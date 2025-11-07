import express from "express";
const router = express.Router();
import User from '../DB/User.js';
import httpStatus from 'http-status';
import ApiError from '../Utils/ApiError.js';
import helper from '../Utils/helpers.js';
import authMiddleware from '../Auth/authMiddleware.js';

const { comparePassword } = helper;

// Google login endpoint
router.post('/google-login', authMiddleware, async (req, res) => {
    try {
        // User is already verified by authMiddleware
        const user = req.user;
        res.status(httpStatus.OK).json({
            success: true,
            user: {
                uid: user.uid,
                email: user.email,
                displayName: user.displayName,
                picture: user.picture
            }
        });
    } catch (error) {
        console.error(error);
        res.status(httpStatus.BAD_REQUEST).json({ error: error.message });
    }
});

// Traditional email/password login
router.post('/login', async function(req, res, next) {
  const { email, password } = req.body;

  let emailReg = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/;

  if (!emailReg.test(email) || !password.length) {
      throw new ApiError("WRONG CREDENTIALS", httpStatus.NOT_ACCEPTABLE, "Wrong credentials")
  }

  try {
      const ifExist = await User.findOne({ email });
      if (!ifExist) {
          throw new ApiError("NO ACCOUNT", httpStatus.NOT_ACCEPTABLE, "Account doesn't exist!")
      }

      if (!(await ifExist.comparePassword(password))) {
          throw new ApiError("WRONG PASSWORD", httpStatus.NOT_ACCEPTABLE, "Incorrect credentials")
      }

      // if blacklisted
      if (ifExist.isBlacklisted) {
          throw new ApiError("User Account Suspended", httpStatus.UNAUTHORIZED, "Sorry this Account has been suspended")
      }

      if (!ifExist.emailVerified) {
          throw new ApiError("Verify Account", httpStatus.UNAUTHORIZED, "Account is not verified")
      }

      const access = await ifExist.generateToken(ifExist.id, ifExist.email);
      const refresh = await ifExist.generateRefreshToken(access.accessToken, false);
      
      res.status(httpStatus.OK).json({ 
          message: "Login successful", 
          data: ifExist.filterUserData(access, refresh)
      })

  } catch (error) {
      console.log(error)
      res.status(httpStatus.BAD_REQUEST).send(error)
  }
});

router.post('/logout', async function(req, res, next) {
  try {
      if (req.user) {
          // Clear any session data if needed
          await User.findOneAndUpdate(
              { uid: req.user.uid },
              { $set: { lastLogout: new Date() } }
          );
      }
      res.status(httpStatus.OK).json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
      console.error('Logout error:', error);
      res.status(httpStatus.BAD_REQUEST).json({ error: error.message });
  }
});

export default router;
