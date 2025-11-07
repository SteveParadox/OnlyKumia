import express from "express";
import multer from 'multer';
import mongoose from 'mongoose';
import crypto from 'crypto';
import Content from '../DB/Content.js';
import Image from '../DB/Upload.js';
import User from '../DB/User.js';
import authMiddleware from '../Auth/authMiddleware.js';

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({ storage });

// Environment-driven storage configuration (S3 keys expected in env if used)
const useS3 = !!process.env.S3_BUCKET;

// Simple in-memory presign simulation when S3 not configured
const generatePresign = ({ filename }) => {
  const uploadId = crypto.randomBytes(12).toString('hex');
  const key = `quarantine/${Date.now()}-${uploadId}-${filename}`;
  const url = useS3 ? `https://s3.amazonaws.com/${process.env.S3_BUCKET}/${key}` : `/local-storage/${key}`;
  return { uploadId, key, url, publicUrl: url };
};

router.get('/user/:userId/images', async (req, res) => {
    try {
      const userId = req.params.userId;
      const user = await User.findOne({ uid: userId });
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const images = await Image.find({ user: user.id });
      if (!images) {
        return res.status(404).json({ error: 'No image found' });
      }
      res.json(images);
      
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });

router.post('/user/:userId/upload', async (req, res) => {
    try {
      const { name, imgUrl } = req.body;
      const userId = req.params.userId;

      const user = await User.findOne({ uid: userId });

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }


      const image = new Image({
        name: name,
        imgUrl: imgUrl, 
        user: user,
      });

      // Presign endpoint used by the frontend. Returns uploadId and presigned URL (simulated)
      router.post('/presign', authMiddleware, async (req, res) => {
        try {
          const { filename, contentType, size } = req.body;
          if (!filename) return res.status(400).json({ error: 'filename required' });

          const presign = generatePresign({ filename });

          // create content record in quarantine
          const user = await User.findOne({ uid: req.user.uid });
          const content = new Content({
            user: user._id,
            filename,
            s3Key: presign.key,
            size: size || 0,
            contentType: contentType || 'application/octet-stream',
            status: 'quarantine',
            metadata: {}
          });
          await content.save();

          res.json({ uploadId: content._id, url: presign.url, publicUrl: presign.publicUrl });
        } catch (error) {
          console.error('Presign error', error);
          res.status(500).json({ error: 'Presign failed' });
        }
      });

      // Complete endpoint: frontend notifies backend that upload finished and sends metadata + fileHash
      router.post('/complete', authMiddleware, async (req, res) => {
        try {
          const { uploadId, metadata, fileHash, publicUrl } = req.body;
          if (!uploadId) return res.status(400).json({ error: 'uploadId required' });

          const content = await Content.findById(uploadId);
          if (!content) return res.status(404).json({ error: 'Upload record not found' });

          // Save evidence pointers only
          content.fileHash = fileHash || content.fileHash;
          content.metadata = metadata || content.metadata;
          if (publicUrl) content.metadata.publicUrl = publicUrl;
          content.status = 'processing';
          await content.save();

          // Trigger moderation workflow (placeholder: immediate auto-check)
          // For now, accept a very small simulated check
          const autoResult = (content.contentType || '').startsWith('image/') ? 'clean' : 'flagged';

          if (autoResult === 'clean') {
            content.status = 'published';
            await content.save();
            // In a real system we'd enqueue transcode jobs, thumbnails, watermarking here
            res.json({ message: 'Uploaded and auto-published', status: 'published', contentId: content._id });
          } else {
            content.status = 'flagged';
            content.moderation.autoResult = autoResult;
            await content.save();
            res.json({ message: 'Uploaded and flagged for review', status: 'flagged', contentId: content._id });
          }
        } catch (error) {
          console.error('Complete upload error', error);
          res.status(500).json({ error: 'Complete failed' });
        }
      });

      // Get status for an upload/content record
      router.get('/:contentId/status', authMiddleware, async (req, res) => {
        try {
          const { contentId } = req.params;
          const content = await Content.findById(contentId).select('-__v');
          if (!content) return res.status(404).json({ error: 'Not found' });
          res.json({ status: content.status, moderation: content.moderation, metadata: content.metadata });
        } catch (error) {
          console.error('Status lookup error', error);
          res.status(500).json({ error: 'Failed to get status' });
        }
      });

      // Get content details (safe fields only)
      router.get('/:contentId', authMiddleware, async (req, res) => {
        try {
          const { contentId } = req.params;
          const content = await Content.findById(contentId).select('filename status metadata createdAt');
          if (!content) return res.status(404).json({ error: 'Not found' });
          res.json(content);
        } catch (error) {
          console.error('Content lookup error', error);
          res.status(500).json({ error: 'Failed to fetch content' });
        }
      });

      await image.save();

      res.json({ message: 'Image details saved to the database successfully' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });

export default router;
