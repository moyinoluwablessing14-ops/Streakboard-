import express from 'express';
import { getLeaderboard } from '../services/streak.js';
import { dbLoad } from '../db/index.js';
const router = express.Router();
router.get('/', (req, res) => {
  const limit = Math.min(parseInt(req.query.limit)||50, 100);
  const entries = getLeaderboard({ limit });
  const db = dbLoad();
  const cycle = db.cycles[db.cycles.length-1];
  const now = new Date();
  const day = now.getUTCDay();
  const next = new Date(now);
  next.setUTCDate(now.getUTCDate() + (day === 1 ? 7 : (8-day)%7));
  next.setUTCHours(0,0,0,0);
  res.json({ entries, meta: { total: entries.length, cycleId: cycle?.id, nextResetAt: next.toISOString(), raffleMinStreak: parseInt(process.env.RAFFLE_MIN_STREAK||'5'), rebateTopN: parseInt(process.env.REBATE_TOP_N||'3') }});
});
router.get('/stats', (req, res) => {
  const db = dbLoad();
  const today = new Date().toISOString().slice(0,10);
  const activeToday = new Set(db.swap_events.filter(e => e.swap_day === today).map(e => e.wallet)).size;
  const longest = Object.entries(db.streaks).sort((a,b) => b[1].longest - a[1].longest)[0];
  res.json({ totalWallets: Object.keys(db.wallets).length, activeToday, totalSwaps: db.swap_events.length, longestEver: longest ? { wallet: longest[0], longest: longest[1].longest } : null, globalMilestonesUnlocked: Object.keys(db.global_milestones).length });
});
router.get('/embed', (req, res) => {
  const limit = Math.min(parseInt(req.query.limit)||10, 20);
  const entries = getLeaderboard({ limit });
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.json({ entries: entries.map(e => ({ rank: e.rank, wallet: e.wallet, short: e.wallet.slice(0,4)+'...'+e.wallet.slice(-4), streak: e.currentStreak, milestones: e.milestones })), updatedAt: Date.now() });
});
export default router;
