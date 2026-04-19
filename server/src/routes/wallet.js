import express from 'express';
import { isValidWallet } from '../services/solana.js';
import { registerWallet, getStreakData } from '../services/streak.js';
import { dbLoad } from '../db/index.js';
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
export default router;
