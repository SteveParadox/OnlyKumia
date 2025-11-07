import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const userSchema = new mongoose.Schema({
    uid: {
      type: String,
      required: true,
      unique: true,
    },
    displayName: {
      type: String,
      required: true,
      unique: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: false,
    },
    picture: {
      type: String,
      required: false,
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    role: {
      type: String,
      enum: ['user', 'creator', 'admin'],
      default: 'user'
    },
    verified_creator: {
      type: Boolean,
      default: false
    },
    kyc_status: {
      type: String,
      enum: ['not_started', 'pending', 'verified', 'rejected', 'flagged'],
      default: 'not_started'
    },
    metadata: {
      fullName: String,
      dateOfBirth: Date,
      country: String,
      gender: {
        type: String,
        enum: ['male', 'female', 'other', 'prefer_not_to_say']
      }
    },
    isBlacklisted: {
      type: Boolean,
      default: false
    },
    lastLogin: Date,
    lastLogout: Date
  });


// Hash password before saving
userSchema.pre('save', async function (next) {
  const user = this;
  if (!user.isModified('password')) return next();

  try {
    const hashedPassword = await bcrypt.hash(user.password, 10);
    user.password = hashedPassword;
    next();
  } catch (error) {
    return next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw error;
  }
};

// Generate JWT token
userSchema.methods.generateToken = async function (userId, email) {
  try {
    const token = jwt.sign(
      { userId, email },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
    return { accessToken: token };
  } catch (error) {
    throw error;
  }
};

// Generate refresh token
userSchema.methods.generateRefreshToken = async function (accessToken, isNewToken = false) {
  try {
    const token = jwt.sign(
      { accessToken, isNewToken },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: '7d' }
    );
    return { refreshToken: token };
  } catch (error) {
    throw error;
  }
};

// Filter user data for response
userSchema.methods.filterUserData = function (accessToken, refreshToken) {
  return {
    id: this._id,
    uid: this.uid,
    email: this.email,
    displayName: this.displayName,
    picture: this.picture,
    emailVerified: this.emailVerified,
    accessToken: accessToken?.accessToken,
    refreshToken: refreshToken?.refreshToken
  };
};

export default mongoose.model('User', userSchema);

