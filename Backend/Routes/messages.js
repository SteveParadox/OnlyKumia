import express from 'express';
import rateLimit from 'express-rate-limit';
import Message from '../DB/Message.js';
import authMiddleware from '../Auth/authMiddleware.js';

const router = express.Router();

// simple message rate limiter
const msgLimiter = rateLimit({ windowMs: 10 * 1000, max: 10, message: { error: 'Too many messages, slow down' } });

const BANNED = ['badword1','badword2','spamlink'];

function runModeration(text) {
  const lower = (text||'').toLowerCase();
  for (const b of BANNED) if (lower.includes(b)) return { flagged: true, reason: 'banned_word' };
  return { flagged: false };
}

// send a message (to user or stream)
router.post('/send', authMiddleware, msgLimiter, async (req, res) => {
  try {
    const { toUser, toStream, content } = req.body;
    if (!content) return res.status(400).json({ error: 'Empty message' });
    const mod = runModeration(content);
    const m = await Message.create({ from: req.user._id, toUser, toStream, content, status: mod.flagged ? 'flagged' : 'delivered', flaggedReason: mod.flagged ? mod.reason : undefined });
    // TODO: emit via websocket to recipient(s) if delivered
    if (mod.flagged) return res.status(403).json({ message: 'Message flagged by moderation', id: m._id });
    return res.json({ message: 'sent', id: m._id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// get history (peer-to-peer or stream)
router.get('/history', authMiddleware, async (req, res) => {
  try {
    const { peer, streamId, limit = 50 } = req.query;
    let q = {};
    if (peer) q = { $or: [ { from: req.user._id, toUser: peer }, { from: peer, toUser: req.user._id } ] };
    else if (streamId) q = { toStream: streamId };
    else return res.status(400).json({ error: 'peer or streamId required' });
    const items = await Message.find(q).sort({ createdAt: -1 }).limit(parseInt(limit, 10));
    res.json({ messages: items.reverse() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
