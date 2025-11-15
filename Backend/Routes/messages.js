import express from 'express';
import rateLimit from 'express-rate-limit';
import Message from '../DB/Message.js';
import User from '../DB/User.js';
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

// Store io instance (will be set by server.js)
let io = null;
export const setIO = (ioInstance) => { io = ioInstance; };

// send a message (to user or stream)
router.post('/send', authMiddleware, msgLimiter, async (req, res) => {
  try {
    const { toUser, toStream, content } = req.body;
    if (!content || !content.trim()) return res.status(400).json({ error: 'Empty message' });
    
    // Validate recipient exists
    if (toUser) {
      const recipient = await User.findById(toUser);
      if (!recipient) return res.status(404).json({ error: 'Recipient not found' });
    }

    const mod = runModeration(content);
    const messageData = {
      from: req.user._id,
      toUser,
      toStream,
      content: content.trim(),
      status: mod.flagged ? 'flagged' : 'delivered',
      flaggedReason: mod.flagged ? mod.reason : undefined,
      meta: { isRead: false, sentAt: new Date() }
    };

    const m = await Message.create(messageData);
    await m.populate('from', 'displayName picture email');

    // Emit via WebSocket if delivered and recipient is online
    if (!mod.flagged && io && toUser) {
      io.to(`user_${toUser}`).emit('message:new', {
        id: m._id,
        from: m.from,
        content: m.content,
        timestamp: m.createdAt,
        conversationId: toUser
      });
      // Emit unread badge update
      io.to(`user_${toUser}`).emit('badge:update', {
        unreadCount: await getUnreadCount(toUser)
      });
    }

    if (mod.flagged) {
      return res.status(403).json({ message: 'Message flagged by moderation', id: m._id });
    }

    return res.status(201).json({
      message: 'Message sent',
      data: {
        id: m._id,
        content: m.content,
        timestamp: m.createdAt,
        status: m.status
      }
    });
  } catch (err) {
    console.error('Send message error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Helper: Get unread count for a user
async function getUnreadCount(userId) {
  try {
    return await Message.countDocuments({
      toUser: userId,
      status: 'delivered',
      meta: { isRead: false }
    });
  } catch (e) {
    console.error('Unread count error:', e);
    return 0;
  }
}

// get unread message count
router.get('/unread-count', authMiddleware, async (req, res) => {
  try {
    const count = await getUnreadCount(req.user._id);
    res.json({ unreadCount: count });
  } catch (err) {
    console.error('Unread count error:', err);
    res.status(500).json({ error: err.message });
  }
});

// mark messages as read
router.put('/mark-read', authMiddleware, async (req, res) => {
  try {
    const { peer } = req.body;
    if (!peer) return res.status(400).json({ error: 'peer required' });

    await Message.updateMany(
      { from: peer, toUser: req.user._id, status: 'delivered' },
      { $set: { 'meta.isRead': true } }
    );

    // Emit badge update
    if (io) {
      io.to(`user_${req.user._id}`).emit('badge:update', {
        unreadCount: await getUnreadCount(req.user._id)
      });
    }

    res.json({ message: 'Messages marked as read' });
  } catch (err) {
    console.error('Mark read error:', err);
    res.status(500).json({ error: err.message });
  }
});

// get conversation history (peer-to-peer) with unread count
router.get('/conversations', authMiddleware, async (req, res) => {
  try {
    // Find all users this user has messaged or been messaged by
    const messages = await Message.find({
      $or: [{ from: req.user._id }, { toUser: req.user._id }]
    })
      .populate('from', 'displayName picture email')
      .populate('toUser', 'displayName picture email')
      .sort({ createdAt: -1 })
      .lean();

    // Group by peer (opposite of current user)
    const convMap = new Map();
    for (const msg of messages) {
      const peerId = msg.from._id.equals(req.user._id) ? msg.toUser._id : msg.from._id;
      const peerData = msg.from._id.equals(req.user._id) ? msg.toUser : msg.from;
      
      if (!convMap.has(peerId.toString())) {
        // Count unread messages from this peer
        const unreadCount = await Message.countDocuments({
          from: peerId,
          toUser: req.user._id,
          status: 'delivered',
          meta: { isRead: false }
        });

        convMap.set(peerId.toString(), {
          id: peerId.toString(),
          peerId: peerId,
          name: peerData.displayName || peerData.email,
          avatar: peerData.picture || '/avatars/default.jpg',
          lastMessage: msg.content,
          lastMessageTime: msg.createdAt,
          unreadCount,
          status: msg.status
        });
      }
    }

    const conversations = Array.from(convMap.values()).sort((a, b) => 
      new Date(b.lastMessageTime) - new Date(a.lastMessageTime)
    );

    res.json({ conversations, total: conversations.length });
  } catch (err) {
    console.error('Conversations fetch error:', err);
    res.status(500).json({ error: err.message });
  }
});

// get history (peer-to-peer or stream)
router.get('/history', authMiddleware, async (req, res) => {
  try {
    const { peer, streamId, limit = 50 } = req.query;
    let q = {};
    if (peer) {
      // Ensure peer is properly formatted
      q = { $or: [ { from: req.user._id, toUser: peer }, { from: peer, toUser: req.user._id } ] };
      // Mark messages from peer to current user as read
      await Message.updateMany(
        { from: peer, toUser: req.user._id, status: 'delivered' },
        { $set: { 'meta.isRead': true } }
      );
    } else if (streamId) {
      q = { toStream: streamId };
    } else {
      return res.status(400).json({ error: 'peer or streamId required' });
    }

    const items = await Message.find(q)
      .populate('from', 'displayName picture email')
      .populate('toUser', 'displayName picture email')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit, 10));

    res.json({ messages: items.reverse() });
  } catch (err) {
    console.error('History fetch error:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
