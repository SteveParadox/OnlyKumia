import express from 'express';
import multer from 'multer';
import crypto from 'crypto';
import path from 'path';
import fs from 'fs';
import { promisify } from 'util';
import User from '../DB/User.js';
import KYC from '../DB/KYC.js';
import authMiddleware from '../Auth/authMiddleware.js';
import ApiError from '../Utils/ApiError.js';
import httpStatus from 'http-status';
import rateLimit from 'express-rate-limit';

const router = express.Router();

// Configure rate limiting
const kycLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: 3, // limit each IP to 3 requests per windowMs
  message: 'Too many KYC attempts from this IP, please try again after 24 hours'
});

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(process.env.UPLOAD_DIR, 'temp');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    crypto.randomBytes(16, (err, buf) => {
      if (err) return cb(err);
      cb(null, buf.toString('hex') + path.extname(file.originalname));
    });
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max
    files: 2 // Max number of files
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error('Invalid file type'));
    }
    cb(null, true);
  }
}).fields([
  { name: 'idDocument', maxCount: 1 },
  { name: 'selfie', maxCount: 1 }
]);

// Helper function to compute file hash
const computeFileHash = async (filepath) => {
  const fileBuffer = await promisify(fs.readFile)(filepath);
  return crypto.createHash('sha256').update(fileBuffer).digest('hex');
};

// Clean up uploaded files
const cleanupFiles = async (files) => {
  for (const file of Object.values(files).flat()) {
    await promisify(fs.unlink)(file.path).catch(console.error);
  }
};

router.post('/verify', authMiddleware, kycLimiter, async (req, res) => {
  try {
    upload(req, res, async (err) => {
      if (err) {
        return res.status(400).json({ error: err.message });
      }

      const { fullName, dateOfBirth, country, documentType } = req.body;
      const files = req.files;

      if (!files?.idDocument?.[0] || !files?.selfie?.[0]) {
        return res.status(400).json({ error: 'Both ID document and selfie are required' });
      }

      try {
        // Compute file hashes
        const [idHash, selfieHash] = await Promise.all([
          computeFileHash(files.idDocument[0].path),
          computeFileHash(files.selfie[0].path)
        ]);

        // Create KYC record
        const kyc = new KYC({
          userId: req.user._id,
          documentType,
          documentHash: idHash,
          selfieHash,
          metadata: {
            fullName,
            dateOfBirth,
            country,
            documentNumber: req.body.documentNumber,
            documentExpiry: req.body.documentExpiry
          }
        });

        // TODO: Integrate with KYC provider here
        // const verificationResult = await verifyWithProvider(files, kyc);
        // kyc.verificationToken = verificationResult.token;
        // kyc.verificationProvider = 'provider_name';

        await kyc.save();

        // Update user status
        await User.findByIdAndUpdate(req.user._id, {
          $set: {
            'kyc_status': 'pending',
            'role': 'creator',
            'metadata.fullName': fullName,
            'metadata.dateOfBirth': dateOfBirth,
            'metadata.country': country
          }
        });

        res.status(201).json({
          message: 'KYC verification initiated',
          status: 'pending',
          kycId: kyc._id
        });

      } finally {
        // Clean up uploaded files after processing
        await cleanupFiles(files);
      }
    });
  } catch (error) {
    console.error('KYC verification error:', error);
    res.status(500).json({ error: 'KYC verification failed' });
  }
});

// Get KYC status
router.get('/status', authMiddleware, async (req, res) => {
  try {
    const kyc = await KYC.findOne({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .select('-documentHash -selfieHash');

    if (!kyc) {
      return res.status(404).json({ message: 'No KYC verification found' });
    }

    res.json({ status: kyc.status, updatedAt: kyc.updatedAt });
  } catch (error) {
    console.error('KYC status check error:', error);
    res.status(500).json({ error: 'Failed to check KYC status' });
  }
});

export default router;