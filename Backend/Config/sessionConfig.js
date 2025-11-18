import session from 'express-session';
import dotenv from 'dotenv';

dotenv.config();

const sessionMiddleware = session({
  secret: process.env.SECRET_KEY || 'keyboard cat',
  resave: false,
  saveUninitialized: true,
  cookie: {
    secure: process.env.NODE_ENV === 'production', // HTTPS only in production
    httpOnly: true,
    sameSite: 'lax', // adjust based on your frontend
    maxAge: 24 * 60 * 60 * 1000, // 1 day
  },
});

export default sessionMiddleware;
