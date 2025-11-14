// Routes/Login.js
import express from "express";
import User from '../DB/User.js';
import httpStatus from 'http-status';
import ApiError from '../Utils/ApiError.js';
import helper from '../Utils/helpers.js';
import authMiddleware from '../Auth/authMiddleware.js';
import limiter from '../Auth/rate-limiter.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import botProtection from '../Auth/botProtection.js';

const router = express.Router();
const { acceptableGender, acceptableCountries, hashPassword } = helper;

// =======================
// Google Login
// =======================
router.post('/google-login', authMiddleware, async (req, res) => {
    try {
        const user = req.user; // set by authMiddleware after Google token verification
        if (!user) {
            throw new ApiError("NO_USER", httpStatus.UNAUTHORIZED, "User not authenticated via Google");
        }

        return res.status(httpStatus.OK).json({
            success: true,
            user: {
                uid: user.uid,
                email: user.email,
                displayName: user.displayName,
                picture: user.picture
            }
        });
    } catch (error) {
        console.error("Google login error:", error);
        return res.status(httpStatus.BAD_REQUEST).json({ error: error.message });
    }
});

// =======================
// Email/Password Login
// =======================
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        const emailReg = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,}$/; // support longer TLDs
        if (!emailReg.test(email) || !password?.length) {
            throw new ApiError("WRONG_CREDENTIALS", httpStatus.NOT_ACCEPTABLE, "Wrong credentials");
        }

        const user = await User.findOne({ email });
        if (!user) throw new ApiError("NO_ACCOUNT", httpStatus.NOT_ACCEPTABLE, "Account doesn't exist!");

        const passwordMatch = await user.comparePassword(password);
        if (!passwordMatch) throw new ApiError("WRONG_PASSWORD", httpStatus.NOT_ACCEPTABLE, "Incorrect credentials");

        if (user.isBlacklisted) throw new ApiError("ACCOUNT_SUSPENDED", httpStatus.UNAUTHORIZED, "Account suspended");
        if (!user.emailVerified) throw new ApiError("VERIFY_ACCOUNT", httpStatus.UNAUTHORIZED, "Account not verified");

        const access = await user.generateToken(user.id, user.email);
        const refresh = await user.generateRefreshToken(access.accessToken, false);

        return res.status(httpStatus.OK).json({
            message: "Login successful",
            data: user.filterUserData(access, refresh)
        });

    } catch (error) {
        console.error("Login error:", error);
        return res.status(httpStatus.BAD_REQUEST).json({ error: error.message || "Login failed" });
    }
});

// =======================
// Email/Password SignUp
// =======================
router.post('/signUp', limiter, botProtection, async (req, res) => {
    try {
        const { email, password, gender, country } = req.body;

        // Validate inputs
        const emailReg = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,}$/;
        if (!emailReg.test(email) || !password || password.length < 6) {
            throw new ApiError("INVALID_INPUT", httpStatus.NOT_ACCEPTABLE, "Invalid email or password");
        }

        if (gender && !acceptableGender.includes(gender)) {
            throw new ApiError("INVALID_GENDER", httpStatus.NOT_ACCEPTABLE, "Invalid gender type");
        }

        if (country && !acceptableCountries.includes(country)) {
            throw new ApiError("INVALID_COUNTRY", httpStatus.NOT_ACCEPTABLE, "Invalid country");
        }

        // Check if user exists
        const existing = await User.findOne({ email });
        if (existing) throw new ApiError("ACCOUNT_EXISTS", httpStatus.CONFLICT, "Account already exists!");

        const hashedPassword = await hashPassword(password);

        const newUser = new User({
            email,
            password: hashedPassword,
            gender,
            country,
            emailVerified: false
        });

        await newUser.save();

        const access = await newUser.generateToken(newUser.id, newUser.email);
        const refresh = await newUser.generateRefreshToken(access.accessToken, false);

        return res.status(httpStatus.CREATED).json({
            message: "Account created successfully",
            data: {
                user: newUser,
                access,
                refresh
            }
        });

    } catch (error) {
        console.error("SignUp error:", error);
        return res.status(error.statusCode || httpStatus.BAD_REQUEST).json({
            message: error.message || "Signup failed",
            error
        });
    }
});

// =======================
// Creator SignUp (with optional KYC document upload)
// Accepts multipart/form-data with optional 'idDocument' file and 'idHash' field
// =======================
// Configure multer storage for creator signup KYC uploads
const creatorStorageDir = process.env.LOCAL_STORAGE_PATH || './uploads';
if (!fs.existsSync(creatorStorageDir)) fs.mkdirSync(creatorStorageDir, { recursive: true });

const creatorStorage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, creatorStorageDir),
    filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});

const creatorUpload = multer({
    storage: creatorStorage,
    limits: { fileSize: 10 * 1024 * 1024 }
});

router.post('/creator/signup', limiter, creatorUpload.single('idDocument'), botProtection, async (req, res) => {
    try {
        // Basic honeypot check handled by botProtection middleware
        const { email, password, gender, country, fullName, dob, idHash } = req.body;

        // Validate inputs
        const emailReg = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,}$/;
        if (!emailReg.test(email) || !password || password.length < 6) {
            throw new ApiError("INVALID_INPUT", httpStatus.NOT_ACCEPTABLE, "Invalid email or password");
        }

        if (gender && !helper.acceptableGender.includes(gender)) {
            throw new ApiError("INVALID_GENDER", httpStatus.NOT_ACCEPTABLE, "Invalid gender type");
        }

        if (country && !helper.acceptableCountries.includes(country)) {
            throw new ApiError("INVALID_COUNTRY", httpStatus.NOT_ACCEPTABLE, "Invalid country");
        }

        // Check if user exists
        const existing = await User.findOne({ email });
        if (existing) throw new ApiError("ACCOUNT_EXISTS", httpStatus.CONFLICT, "Account already exists!");

        const hashedPassword = await helper.hashPassword(password);

        const newUser = new User({
            email,
            password: hashedPassword,
            gender,
            country,
            emailVerified: false,
            role: 'creator',
            kyc_status: 'pending',
            metadata: { fullName, dateOfBirth: dob, country }
        });

        // If an ID document was uploaded, attach a pointer to its path (do NOT store raw document in response)
        if (req.file) {
            // store path in a helper place - in production this should be an encrypted secure storage
            newUser.metadata.idDocumentPath = path.relative(process.cwd(), req.file.path);
            if (idHash) newUser.metadata.idHash = idHash;
        }

        await newUser.save();

        const access = await newUser.generateToken(newUser.id, newUser.email);
        const refresh = await newUser.generateRefreshToken(access.accessToken, false);

        return res.status(httpStatus.CREATED).json({
            message: 'Creator account created; KYC pending',
            data: {
                user: newUser,
                access,
                refresh
            }
        });
    } catch (error) {
        console.error('Creator SignUp error:', error);
        return res.status(error.statusCode || httpStatus.BAD_REQUEST).json({
            message: error.message || 'Creator signup failed',
            error
        });
    }
});

// =======================
// Logout
// =======================
router.post('/logout', authMiddleware, async (req, res) => {
    try {
        await User.findOneAndUpdate(
            { uid: req.user.uid },
            { $set: { lastLogout: new Date() } }
        );

        return res.status(httpStatus.OK).json({ success: true, message: 'Logged out successfully' });

    } catch (error) {
        console.error('Logout error:', error);
        return res.status(httpStatus.BAD_REQUEST).json({ error: error.message });
    }
});

export default router;
