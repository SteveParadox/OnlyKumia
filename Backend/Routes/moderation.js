import express from 'express';
import Content from '../DB/Content.js';
import authMiddleware from '../Auth/authMiddleware.js';

const router = express.Router();

// Endpoint for moderation service to poll or receive events (placeholder)
router.get('/queue', authMiddleware, async (req, res) => {
  try {
    // Return flagged content awaiting manual review
    const flagged = await Content.find({ status: 'flagged' }).limit(50).select('filename metadata createdAt');
    res.json({ items: flagged });
  } catch (error) {
    console.error('Moderation queue error', error);
    res.status(500).json({ error: 'Failed to fetch queue' });
  }
});

// Admin approves content
router.post('/review/:contentId/approve', authMiddleware, async (req, res) => {
  try {
    const { contentId } = req.params;
    const content = await Content.findById(contentId);
    if (!content) return res.status(404).json({ error: 'Not found' });

    content.status = 'published';
    content.moderation.reviewedBy = req.user.uid;
    content.moderation.reviewedAt = new Date();
    content.moderation.reviewNotes = req.body.notes || '';
    await content.save();
    res.json({ message: 'Approved', contentId });
  } catch (error) {
    console.error('Approve error', error);
    res.status(500).json({ error: 'Approve failed' });
  }
});

// Admin rejects content
router.post('/review/:contentId/reject', authMiddleware, async (req, res) => {
  try {
    const { contentId } = req.params;
    const content = await Content.findById(contentId);
    if (!content) return res.status(404).json({ error: 'Not found' });

    content.status = 'rejected';
    content.moderation.reviewedBy = req.user.uid;
    content.moderation.reviewedAt = new Date();
    content.moderation.reviewNotes = req.body.notes || '';
    await content.save();
    res.json({ message: 'Rejected', contentId });
  } catch (error) {
    console.error('Reject error', error);
    res.status(500).json({ error: 'Reject failed' });
  }
});

export default router;
