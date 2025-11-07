import bcrypt from 'bcryptjs';
import httpStatus from 'http-status';
import ApiError from './ApiError.js';

const acceptableCountries = ['nigeria'];
const acceptableGender = ['male', 'female'];

/**
 * Hash a password using bcrypt
 * @param {string} password - Plain text password
 * @returns {Promise<string>} Hashed password
 */
const hashPassword = async (password) => {
  try {
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(password, salt);
  } catch (error) {
    throw new ApiError("Error hashing password", httpStatus.BAD_REQUEST, error);
  }
};

/**
 * Compare a plain password with a hashed one
 * @param {string} plainPassword - The raw password entered by user
 * @param {string} hashedPassword - The stored hash from database
 * @returns {Promise<boolean>} True if they match
 */
const comparePassword = async (plainPassword, hashedPassword) => {
  try {
    return await bcrypt.compare(plainPassword, hashedPassword);
  } catch (error) {
    throw new ApiError("Error comparing password", httpStatus.BAD_REQUEST, error);
  }
};

export default {
  acceptableCountries,
  acceptableGender,
  hashPassword,
  comparePassword,
};
