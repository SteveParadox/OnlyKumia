import express from "express";
const router = express.Router();
import User from '../DB/User.js';
import httpStatus from 'http-status';
import ApiError from '../Utils/ApiError.js';
import helper from '../Utils/helpers.js';
import { v4 as uuidv4 } from 'uuid'; // for unique UID
import authMiddleware from '../Auth/authMiddleware.js';

const { acceptableGender, acceptableCountries, hashPassword } = helper;

// Optional: protect certain routes
router.use('/google-login', authMiddleware);

router.post('/signUp', async (req, res) => {
  try {
    const { email, password, displayName, gender, country } = req.body;

    // Validate required fields
    if (!email || !password || !displayName) {
      throw new ApiError("MISSING_FIELDS", httpStatus.BAD_REQUEST, "Email, password, and displayName are required");
    }

    // Validate email format
    const emailReg = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/;
    if (!emailReg.test(email)) {
      throw new ApiError("INVALID_EMAIL", httpStatus.NOT_ACCEPTABLE, "Invalid email format");
    }

    // Validate password length
    if (password.length < 6) {
      throw new ApiError("INVALID_PASSWORD", httpStatus.NOT_ACCEPTABLE, "Password must be at least 6 characters");
    }

    // Optional validations
    if (gender && !acceptableGender.includes(gender)) {
      throw new ApiError("INVALID_GENDER", httpStatus.NOT_ACCEPTABLE, "Invalid gender type");
    }
    if (country && !acceptableCountries.includes(country)) {
      throw new ApiError("INVALID_COUNTRY", httpStatus.NOT_ACCEPTABLE, "Invalid country");
    }

    // Check if account/email/displayName already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { displayName }]
    });
    if (existingUser) {
      throw new ApiError("ACCOUNT_EXISTS", httpStatus.CONFLICT, "Email or displayName already in use");
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create new user
    const newUser = new User({
      uid: uuidv4(),        // generate unique UID
      displayName,          // must come from frontend or user input
      email,
      password: hashedPassword,
      picture: '',          // optional default
      gender,
      country,
      emailVerified: false
    });

    await newUser.save();

    // Generate JWTs
    const access = await newUser.generateToken(newUser.uid, newUser.email);
    const refresh = await newUser.generateRefreshToken(access.accessToken, false);

    res.status(httpStatus.CREATED).send({
      message: "Account created successfully",
      data: {
        user: newUser.filterUserData(access, refresh)
      }
    });

  } catch (error) {
    console.error("SignUp error:", error);
    res.status(error.statusCode || httpStatus.BAD_REQUEST).send({
      message: error.message || "Signup failed",
      error
    });
  }
});

export default router;
