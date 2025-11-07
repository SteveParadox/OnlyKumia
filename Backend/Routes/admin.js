import express from 'express';
import AuditLog from '../DB/AuditLog.js';
import User from '../DB/User.js';
import KYC from '../DB/KYC.js';
import Content from '../DB/Content.js';
import Wallet from '../DB/Wallet.js';
import authMiddleware from '../Auth/authMiddleware.js';

const router = express.Router();

// Middleware: only allow admin users
function adminOnly(req, res, next) {
  if (req.user?.role === 'admin') return next();
  return res.status(403).json({ error: 'Forbidden' });
}

// Audit log: append-only
router.post('/audit', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { action, target, details } = req.body;
    const log = await AuditLog.create({ action, actor: req.user._id, target, details });
    res.json({ log });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router.get('/audit', authMiddleware, adminOnly, async (req, res) => {
  try {
    const logs = await AuditLog.find({}).sort({ createdAt: -1 }).limit(200);
    res.json({ logs });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Content review queue
router.get('/content/review', authMiddleware, adminOnly, async (req, res) => {
  try {
    const items = await Content.find({ status: { $in: ['flagged','quarantine'] } }).populate('user', 'email displayName');
    res.json({ items });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router.post('/content/:id/approve', authMiddleware, adminOnly, async (req, res) => {
  try {
    const c = await Content.findById(req.params.id);
    if (!c) return res.status(404).json({ error: 'Not found' });
    c.status = 'published';
    await c.save();
    await AuditLog.create({ action: 'content_approved', actor: req.user._id, target: c._id, details: {} });
    res.json({ message: 'approved' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router.post('/content/:id/reject', authMiddleware, adminOnly, async (req, res) => {
  try {
    const c = await Content.findById(req.params.id);
    if (!c) return res.status(404).json({ error: 'Not found' });
    c.status = 'rejected';
    await c.save();
    await AuditLog.create({ action: 'content_rejected', actor: req.user._id, target: c._id, details: {} });
    res.json({ message: 'rejected' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// KYC management
router.get('/kyc', authMiddleware, adminOnly, async (req, res) => {
  try {
    const items = await KYC.find({}).populate('user', 'email displayName');
    res.json({ items });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router.post('/kyc/:id/approve', authMiddleware, adminOnly, async (req, res) => {
  try {
    const kyc = await KYC.findById(req.params.id);
    if (!kyc) return res.status(404).json({ error: 'Not found' });
    kyc.status = 'approved';
    await kyc.save();
    await AuditLog.create({ action: 'kyc_approved', actor: req.user._id, target: kyc._id, details: {} });
    res.json({ message: 'kyc approved' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router.post('/kyc/:id/reject', authMiddleware, adminOnly, async (req, res) => {
  try {
    const kyc = await KYC.findById(req.params.id);
    if (!kyc) return res.status(404).json({ error: 'Not found' });
    kyc.status = 'rejected';
    await kyc.save();
    await AuditLog.create({ action: 'kyc_rejected', actor: req.user._id, target: kyc._id, details: {} });
    res.json({ message: 'kyc rejected' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// User bans
router.post('/user/:id/ban', authMiddleware, adminOnly, async (req, res) => {
  try {
    const u = await User.findById(req.params.id);
    if (!u) return res.status(404).json({ error: 'Not found' });
    u.isBlacklisted = true;
    await u.save();
    await AuditLog.create({ action: 'user_banned', actor: req.user._id, target: u._id, details: {} });
    res.json({ message: 'user banned' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router.post('/user/:id/unban', authMiddleware, adminOnly, async (req, res) => {
  try {
    const u = await User.findById(req.params.id);
    if (!u) return res.status(404).json({ error: 'Not found' });
    u.isBlacklisted = false;
    await u.save();
    await AuditLog.create({ action: 'user_unbanned', actor: req.user._id, target: u._id, details: {} });
    res.json({ message: 'user unbanned' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Financial reconciliation (simple wallet export)
router.get('/wallets', authMiddleware, adminOnly, async (req, res) => {
  try {
    const wallets = await Wallet.find({}).populate('user', 'email displayName');
    res.json({ wallets });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Export tools: audit log export
router.get('/export/audit', authMiddleware, adminOnly, async (req, res) => {
  try {
    const logs = await AuditLog.find({}).sort({ createdAt: -1 });
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename=audit_logs.json');
    res.send(JSON.stringify(logs));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;