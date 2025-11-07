import express from "express";
const router = express.Router();
import User from '../DB/User.js';
import httpStatus from 'http-status';
import ApiError from '../Utils/ApiError.js';
import helper from '../Utils/helpers.js';
import authMiddleware from '../Auth/authMiddleware.js';

const { acceptableGender, acceptableCountries, hashPassword } = helper;

router.use('/google-login', authMiddleware);

router.post('/signUp', async function (req, res) {
  try {
    const { email, password, gender, country } = req.body;

    // Validate email and password
    const emailReg = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/;
    if (!emailReg.test(email) || !password || password.length < 6) {
      throw new ApiError("INVALID_INPUT", httpStatus.NOT_ACCEPTABLE, "Invalid email or password");
    }

    // Optional validations
    if (gender && !acceptableGender.includes(gender)) {
      throw new ApiError("INVALID_GENDER", httpStatus.NOT_ACCEPTABLE, "Invalid gender type");
    }

    if (country && !acceptableCountries.includes(country)) {
      throw new ApiError("INVALID_COUNTRY", httpStatus.NOT_ACCEPTABLE, "Invalid country");
    }

    // Check if account already exists
    const ifExist = await User.findOne({ email });
    if (ifExist) {
      throw new ApiError("ACCOUNT_EXISTS", httpStatus.CONFLICT, "Account already exists!");
    }

    // Hash password before saving
    const hashedPassword = await hashPassword(password);

    const newUser = new User({
      email,
      password: hashedPassword,
      gender,
      country,
      isVerified: false, // optionally set this
    });

    await newUser.save();

    const access = await newUser.generateToken(newUser.id, newUser.email);
    const refresh = await newUser.generateRefreshToken(access.accessToken, false);

    res
      .status(httpStatus.CREATED)
      .send({
        message: "Account created successfully",
        data: {
          user: newUser,
          access,
          refresh
        }
      });

  } catch (error) {
    console.log(error);
    res
      .status(error.statusCode || httpStatus.BAD_REQUEST)
      .send({
        message: error.message || "Signup failed",
        error
      });
  }
});

export default router;
