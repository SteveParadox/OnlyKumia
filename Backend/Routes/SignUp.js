import express from "express";
const router = express.Router();
import User from '../DB/User.js';
import httpStatus from 'http-status';
import ApiError from '../Utils/ApiError.js';
import helper from '../Utils/helpers.js';
import { v4 as uuidv4 } from 'uuid'; // for unique UID
import authMiddleware from '../Auth/authMiddleware.js';
import limiter from '../Auth/rate-limiter.js';

import botProtection from '../Auth/botProtection.js';

const { acceptableGender, acceptableCountries, hashPassword } = helper;

// Optional: protect certain routes
router.use('/google-login', authMiddleware);

router.post('/signUp', limiter, botProtection, async (req, res) => {
  try {
    const { email, password, displayName, gender, country } = req.body;

    // Log incoming payload for debugging
    console.log("SIGNUP PAYLOAD:", {
      email,
      passwordLength: password ? password.length : null,
      displayName,
      gender,
      country
    });

    // 1. Required fields validation
    if (!email || !password || !displayName) {
      throw new ApiError("MISSING_FIELDS", httpStatus.BAD_REQUEST, "Email, password, and displayName are required", true);
    }

    // 2. Email format validation
    const emailReg = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,}$/;
    if (!emailReg.test(email)) {
      throw new ApiError("INVALID_EMAIL", httpStatus.NOT_ACCEPTABLE, "Invalid email format", true);
    }

    // 3. Password length validation
    if (password.length < 6) {
      throw new ApiError("INVALID_PASSWORD", httpStatus.NOT_ACCEPTABLE, "Password must be at least 6 characters", true);
    }

    // 4. Optional validations
    if (gender && !acceptableGender.includes(gender.toLowerCase())) {
      throw new ApiError("INVALID_GENDER", httpStatus.NOT_ACCEPTABLE, "Invalid gender type", true);
    }

    if (country && !acceptableCountries.map(c => c.toLowerCase()).includes(country.toLowerCase())) {
      throw new ApiError("INVALID_COUNTRY", httpStatus.NOT_ACCEPTABLE, "Invalid country", true);
    }

    // 5. Check if user already exists
    const existingUser = await User.findOne({ $or: [{ email }, { displayName }] });
    if (existingUser) {
      throw new ApiError("ACCOUNT_EXISTS", httpStatus.CONFLICT, "Email or displayName already in use", true);
    }

    // 6. Hash the password
    const hashedPassword = await hashPassword(password);

    // 7. Create user
    const newUser = new User({
      uid: uuidv4(),
      email,
      displayName,
      password: hashedPassword,
      gender: gender || null,
      country: country || null,
      picture: '', // optional default
      emailVerified: false
    });

    await newUser.save();

    // 8. Generate JWTs
    const access = await newUser.generateToken(newUser.uid, newUser.email);
    const refresh = await newUser.generateRefreshToken(access.accessToken, false);

    // 9. Send response with filtered user data
    res.status(httpStatus.CREATED).json({
      message: "Account created successfully",
      data: newUser.filterUserData(access, refresh)
    });

  } catch (error) {
    console.error("SignUp error:", error);
    res.status(error.httpCode || httpStatus.BAD_REQUEST).json({
      message: error.message || "Signup failed",
      error
    });
  }
});

export default router;
