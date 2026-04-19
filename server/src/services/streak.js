import { dbLoad, dbSave } from '../db/index.js';
import { todayUTC } from './solana.js';
const MILESTONES = [3, 7, 30];
function getPreviousDay(dateStr) {
  const d = new Date(dateStr + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}
export function registerWallet(address) {
  const db = dbLoad();
  if (!db.wallets[address]) db.wallets[address] = { registered_at: Math.floor(Date.now()/1000) };
  if (!db.streaks[address]) db.streaks[address] = { current: 0, longest: 0, last_swap_day: null };
  dbSave(db);
  return getStreakData(address);
}
export function getStreakData(address) {
  const db = dbLoad();
  if (!db.wallets[address]) return null;
  const streak = db.streaks[address] || { current: 0, longest: 0, last_swap_day: null };
  const today = todayUTC();
  const yesterday = getPreviousDay(today);
  const isAlive = streak.last_swap_day === today || streak.last_swap_day === yesterday;
  return { wallet: address, current: isAlive ? streak.current : 0, longest: streak.longest, lastSwapDay: streak.last_swap_day, isAlive, daysUntilRaffle: Math.max(0, parseInt(process.env.RAFFLE_MIN_STREAK||'5') - (isAlive ? streak.current : 0)) };
}
export function processSwap(walletAddress, swapDay) {
  const db = dbLoad();
  const existing = db.swap_events.find(e => e.wallet === walletAddress && e.swap_day === swapDay);
  if (existing) return { streakData: getStreakData(walletAddress), newMilestones: [], isNewDay: false };
  const streak = db.streaks[walletAddress] || { current: 0, longest: 0, last_swap_day: null };
  const yesterday = getPreviousDay(swapDay);
  let newStreak;
  if (!streak.last_swap_day) newStreak = 1;
  else if (streak.last_swap_day === yesterday) newStreak = streak.current + 1;
  else if (streak.last_swap_day === swapDay) newStreak = streak.current;
  else newStreak = 1;
  const prev = streak.current;
  streak.current = newStreak;
  streak.longest = Math.max(streak.longest, newStreak);
  streak.last_swap_day = swapDay;
  db.streaks[walletAddress] = streak;
  dbSave(db);
  const newMilestones = checkMilestones(walletAddress, newStreak);
  return { streakData: getStreakData(walletAddress), newMilestones, isNewDay: true, previousStreak: prev, newStreak };
}
function checkMilestones(walletAddress, currentStreak) {
  const db = dbLoad();
  const newMilestones = [];
  if (!db.milestones[walletAddress]) db.milestones[walletAddress] = [];
  for (const milestone of MILESTONES) {
    if (currentStreak < milestone) continue;
    if (db.milestones[walletAddress].find(m => m.milestone === milestone)) continue;
    const isFirstGlobal = !db.global_milestones[milestone];
    db.milestones[walletAddress].push({ milestone, first_global: isFirstGlobal, achieved_at: Math.floor(Date.now()/1000), torque_fired: false });
    if (isFirstGlobal) db.global_milestones[milestone] = { first_wallet: walletAddress, achieved_at: Math.floor(Date.now()/1000) };
    newMilestones.push({ milestone, isFirstGlobal });
  }
  dbSave(db);
  return newMilestones;
}
export function getLeaderboard({ limit = 50 } = {}) {
  const db = dbLoad();
  const today = todayUTC();
  const yesterday = getPreviousDay(today);
  return Object.entries(db.streaks)
    .filter(([, s]) => (s.last_swap_day === today || s.last_swap_day === yesterday) && s.current > 0)
    .sort((a, b) => b[1].current - a[1].current || b[1].longest - a[1].longest)
    .slice(0, limit)
    .map(([wallet, s], i) => ({ rank: i+1, wallet, currentStreak: s.current, longestStreak: s.longest, lastSwapDay: s.last_swap_day, milestones: (db.milestones[wallet]||[]).map(m=>m.milestone) }));
}
export function getRaffleEligibleWallets(minStreak = 5) {
  const db = dbLoad();
  const today = todayUTC();
  const yesterday = getPreviousDay(today);
  return Object.entries(db.streaks).filter(([, s]) => s.current >= minStreak && (s.last_swap_day === today || s.last_swap_day === yesterday)).map(([w]) => w);
}
export function getTopWalletsForRebate(n = 3) {
  const db = dbLoad();
  const today = todayUTC();
  const yesterday = getPreviousDay(today);
  return Object.entries(db.streaks).filter(([, s]) => s.last_swap_day === today || s.last_swap_day === yesterday).sort((a,b) => b[1].current - a[1].current).slice(0, n).map(([wallet, s]) => ({ wallet, current: s.current }));
}
export function getUnfiredMilestones() {
  const db = dbLoad();
  const result = [];
  for (const [wallet, ms] of Object.entries(db.milestones)) {
    for (const m of ms) { if (!m.torque_fired) result.push({ wallet, milestone: m.milestone, first_global: m.first_global }); }
  }
  return result;
}
export function markMilestoneFired(wallet, milestone) {
  const db = dbLoad();
  const m = (db.milestones[wallet]||[]).find(x => x.milestone === milestone);
  if (m) { m.torque_fired = true; dbSave(db); }
}
export function markSwapEventFired(txSig) {
  const db = dbLoad();
  const e = db.swap_events.find(x => x.tx_sig === txSig);
  if (e) { e.torque_fired = true; dbSave(db); }
}
export function recordSwapEvent(wallet, txSig, swapDay) {
  const db = dbLoad();
  if (!db.swap_events.find(e => e.tx_sig === txSig)) {
    db.swap_events.push({ wallet, tx_sig: txSig, swap_day: swapDay, torque_fired: false });
    dbSave(db);
  }
}
export function getLastKnownSig(wallet) {
  const db = dbLoad();
  const events = db.swap_events.filter(e => e.wallet === wallet);
  return events.length ? events[events.length-1].tx_sig : null;
}
export function getAllWallets() {
  return Object.keys(dbLoad().wallets);
}
export function resetCycleStreaks() {
  const db = dbLoad();
  for (const w of Object.keys(db.streaks)) db.streaks[w].current = 0;
  dbSave(db);
}
