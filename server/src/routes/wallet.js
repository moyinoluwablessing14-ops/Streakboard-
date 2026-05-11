import express from 'express';
import { isValidWallet, todayUTC } from '../services/solana.js';
import { registerWallet, getStreakData, recordSwapEvent, processSwap } from '../services/streak.js';
import { dbLoad } from '../db/index.js';
import { fireSwapEvent } from '../services/torque.js';
const router = express.Router();

router.post('/register', (req, res) => {
  const { address } = req.body;
  if (!address || !isValidWallet(address)) return res.status(400).json({ error: 'Invalid wallet address' });
  const streakData = registerWallet(address);
  res.json({ success: true, streak: streakData });
});

router.get('/:address', (req, res) => {
  const { address } = req.params;
  if (!isValidWallet(address)) return res.status(400).json({ error: 'Invalid wallet address' });
  const streakData = getStreakData(address);
  if (!streakData) return res.status(404).json({ error: 'Wallet not registered' });
  res.json(streakData);
});

router.get('/:address/milestones', (req, res) => {
  const { address } = req.params;
  if (!isValidWallet(address)) return res.status(400).json({ error: 'Invalid wallet address' });
  const db = dbLoad();
  res.json({ milestones: db.milestones[address] || [] });
});

router.post('/demo', async (req, res) => {
  const { address } = req.body;
  if (!address || !isValidWallet(address)) return res.status(400).json({ error: 'Invalid wallet address' });
  registerWallet(address);
  const today = todayUTC();
  const sig = 'demo_' + Date.now();
  recordSwapEvent(address, sig, today);
  const result = processSwap(address, today);
  await fireSwapEvent({ wallet: address, streakCount: 1, swapDay: today, txSignature: sig });
  res.json({ success: true, streak: result?.streakData });
});

export default router;
