import express from 'express';
import { Parser } from 'json2csv';
import path from 'path';
import WORMStorage from '../Utils/wormStorage.js';
import AuditLog from '../DB/AuditLog.js';
import User from '../DB/User.js';
import KYC from '../DB/KYC.js';
import Content from '../DB/Content.js';
import Wallet from '../DB/Wallet.js';
import authMiddleware from '../Auth/authMiddleware.js';

const router = express.Router();
const wormStorage = new WORMStorage(path.join(process.cwd(), 'data', 'worm'));

// Middleware: only allow admin users
function adminOnly(req, res, next) {
  if (req.user?.role === 'admin') return next();
  return res.status(403).json({ error: 'Forbidden' });
}

// Export audit logs with verification chain
router.get('/audit', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { startDate, endDate, format = 'json' } = req.query;
    
    // Get logs from database
    const query = {};
    if (startDate) query.createdAt = { $gte: new Date(startDate) };
    if (endDate) query.createdAt = { ...query.createdAt, $lte: new Date(endDate) };
    
    const logs = await AuditLog.find(query)
      .sort({ createdAt: -1 })
      .populate('actor', 'email displayName')
      .lean();

    // Store in WORM with metadata
    const wormRecord = await wormStorage.write(logs, {
      type: 'audit_export',
      user: req.user._id,
      query: { startDate, endDate }
    });

    // Format response
    if (format === 'csv') {
      const parser = new Parser();
      const csv = parser.parse(logs);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=audit_logs_${wormRecord.timestamp}.csv`);
      return res.send(csv);
    }

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=audit_logs_${wormRecord.timestamp}.json`);
    res.send(JSON.stringify({ 
      logs,
      metadata: {
        exportId: wormRecord.hash,
        timestamp: wormRecord.timestamp,
        verified: await wormStorage.verify(wormRecord.hash)
      }
    }, null, 2));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Export financial data
router.get('/financial', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { startDate, endDate, format = 'json' } = req.query;

    // Get wallet data with transaction history
    const wallets = await Wallet.find({})
      .populate('user', 'email displayName')
      .lean();

    // Store in WORM
    const wormRecord = await wormStorage.write(wallets, {
      type: 'financial_export',
      user: req.user._id,
      query: { startDate, endDate }
    });

    if (format === 'csv') {
      const parser = new Parser();
      const csv = parser.parse(wallets);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=financial_${wormRecord.timestamp}.csv`);
      return res.send(csv);
    }

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=financial_${wormRecord.timestamp}.json`);
    res.send(JSON.stringify({
      wallets,
      metadata: {
        exportId: wormRecord.hash,
        timestamp: wormRecord.timestamp,
        verified: await wormStorage.verify(wormRecord.hash)
      }
    }, null, 2));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Export user data
router.get('/users', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { format = 'json' } = req.query;
    
    const users = await User.find({})
      .select('-password')
      .lean();

    const wormRecord = await wormStorage.write(users, {
      type: 'users_export',
      user: req.user._id
    });

    if (format === 'csv') {
      const parser = new Parser();
      const csv = parser.parse(users);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=users_${wormRecord.timestamp}.csv`);
      return res.send(csv);
    }

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=users_${wormRecord.timestamp}.json`);
    res.send(JSON.stringify({
      users,
      metadata: {
        exportId: wormRecord.hash,
        timestamp: wormRecord.timestamp,
        verified: await wormStorage.verify(wormRecord.hash)
      }
    }, null, 2));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Verify export record
router.get('/verify/:hash', authMiddleware, adminOnly, async (req, res) => {
  try {
    const isValid = await wormStorage.verify(req.params.hash);
    if (!isValid) {
      return res.status(400).json({ error: 'Invalid or tampered export record' });
    }
    
    const record = await wormStorage.read(req.params.hash);
    res.json({
      verified: true,
      record
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;