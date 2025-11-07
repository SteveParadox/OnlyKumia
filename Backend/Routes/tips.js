import express from 'express';
import Wallet from '../DB/Wallet.js';
import authMiddleware from '../Auth/authMiddleware.js';
import User from '../DB/User.js';

const router = express.Router();

// Tip a creator: deduct from fan wallet, credit creator minus fee
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { creatorId, amount } = req.body;
    const fanId = req.user._id;
    const a = Number(amount) || 0;
    if (a <= 0) return res.status(400).json({ error: 'Invalid amount' });
    if (!creatorId) return res.status(400).json({ error: 'creatorId required' });

    // load wallets (create if missing)
    let fanW = await Wallet.findOne({ user: fanId });
    if (!fanW) fanW = await Wallet.create({ user: fanId, balance: 0 });
    let creatorW = await Wallet.findOne({ user: creatorId });
    if (!creatorW) creatorW = await Wallet.create({ user: creatorId, balance: 0 });

    if (fanW.balance < a) return res.status(400).json({ error: 'Insufficient balance' });

    const feePct = Number(process.env.PLATFORM_FEE_PCT || 10) / 100.0;
    const fee = Math.round(a * feePct * 100) / 100;
    const net = Math.round((a - fee) * 100) / 100;

    // apply transactions
    fanW.balance = Math.round((fanW.balance - a) * 100) / 100;
    fanW.transactions.push({ type: 'debit', amount: a, to: creatorId, meta: { note: 'tip' } });
    creatorW.balance = Math.round((creatorW.balance + net) * 100) / 100;
    creatorW.transactions.push({ type: 'credit', amount: net, from: fanId, meta: { note: 'tip' } });
    // platform fee account: omitted for now — could credit a platform wallet
    await fanW.save();
    await creatorW.save();

    // TODO: emit events / create payout records
    res.json({ message: 'tipped', amount: a, net, fee, fanBalance: fanW.balance, creatorBalance: creatorW.balance });
  } catch (err) {
    console.error('tip error', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
