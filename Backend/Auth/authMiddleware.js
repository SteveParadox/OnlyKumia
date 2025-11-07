import express from "express";
import admin from "firebase-admin";
import dotenv from 'dotenv';
import session from 'express-session';
import fs from 'fs';
import path from 'path';
import User from '../DB/User.js';

dotenv.config();

const router = express.Router();

// Initialize Firebase Admin: prefer explicit service account file, fallback to env vars
if (!admin.apps.length) {
  let credential;
  try {
    // Try explicit path from ENV, else look for common candidate locations
    const candidates = [];
    if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) candidates.push(process.env.FIREBASE_SERVICE_ACCOUNT_PATH);
    // Common locations relative to current working directory
    candidates.push(path.resolve(process.cwd(), 'Backend', 'Keys', 'serviceAccountKey.json'));
    candidates.push(path.resolve(process.cwd(), 'Keys', 'serviceAccountKey.json'));

    // Try relative to this file (supports running from repo root)
    try {
      const fileUrl = new URL(import.meta.url).pathname;
      const dir = path.dirname(fileUrl);
      candidates.push(path.resolve(dir, '..', 'Keys', 'serviceAccountKey.json'));
    } catch (e) {
      // ignore if import.meta.url not resolvable
    }

    let svcPathFound = null;
    for (const c of candidates) {
      if (!c) continue;
      try {
        if (fs.existsSync(c)) { svcPathFound = c; break; }
      } catch (e) {}
    }

    if (svcPathFound) {
      const raw = fs.readFileSync(svcPathFound, 'utf8');
      const parsed = JSON.parse(raw);
      credential = admin.credential.cert(parsed);
    } else {
      // Build from environment variables
      const projectId = process.env.FIREBASE_PROJECT_ID;
      const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
      let privateKey = process.env.FIREBASE_PRIVATE_KEY;

      if (privateKey) privateKey = privateKey.replace(/\\n/g, '\n');

      if (!projectId || !clientEmail || !privateKey) {
        throw new Error('Firebase service account is not configured. Provide a service account file (set FIREBASE_SERVICE_ACCOUNT_PATH) or set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY in .env');
      }

      credential = admin.credential.cert({
        projectId,
        clientEmail,
        privateKey,
      });
    }

    admin.initializeApp({ credential });
  } catch (err) {
    // Re-throw with helpful context
    console.error('Failed to initialize Firebase Admin:', err.message);
    throw err;
  }
}

router.use(session({
  secret: process.env.SECRET_KEY || 'keyboard cat', 
  resave: false,
  saveUninitialized: true,
}));

const authMiddleware = async (req, res, next) => {
  try {
    // Check if authorization header exists
    if (!req.headers.authorization?.startsWith('Bearer ')) {
      throw new Error('No token provided');
    }

    const idToken = req.headers.authorization.split('Bearer ')[1];
    const decodedToken = await admin.auth().verifyIdToken(idToken);

    // Attach verified user data to request
    req.user = {
      uid: decodedToken.uid,
      displayName: decodedToken.name,
      email: decodedToken.email,
      picture: decodedToken.picture,
      emailVerified: decodedToken.email_verified
    };

    // Store in session if needed
    if (req.session) {
      req.session.user = req.user;
    }

    // Check/create user in database
    const existingUser = await User.findOne({ uid: decodedToken.uid });
    if (!existingUser) {
      const newUser = new User({
        uid: decodedToken.uid,
        displayName: decodedToken.name,
        email: decodedToken.email,
        picture: decodedToken.picture,
        emailVerified: decodedToken.email_verified
      });
      await newUser.save();
    }

    // Continue to next middleware/route handler
    next();

  } catch (error) {
    console.error('Error verifying ID token:', error);
    
    if (process.env.NODE_ENV === 'development') {
      return res.status(401).json({ 
        error: 'Unauthorized', 
        details: error.message 
      });
    }
    
    return res.status(401).json({ error: 'Unauthorized' });
  }
};

// Export middleware function instead of router
export default authMiddleware;


