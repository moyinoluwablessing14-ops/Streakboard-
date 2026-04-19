import { getDb } from '../db/index.js';
import { getLeaderboard, getRaffleEligibleWallets, getTopWalletsForRebate, resetCycleStreaks } from '../services/streak.js';
export async function runCycleReset() {
  const db = getDb();
  console.log('[cycle] Weekly reset starting...');
  try {
    const leaderboard = getLeaderboard({ limit: 100 });
    const minStreak = parseInt(process.env.RAFFLE_MIN_STREAK || '5');
    const raffleWallets = getRaffleEligibleWallets(minStreak);
    console.log(`[cycle] Raffle eligible: ${raffleWallets.length} wallets`);
    const rebateN = parseInt(process.env.REBATE_TOP_N || '3');
    const topWallets = getTopWalletsForRebate(rebateN);
    console.log(`[cycle] Top ${rebateN} for rebate:`, topWallets.map(w => w.wallet.slice(0,8)));
    db.prepare('UPDATE cycles SET ended_at = unixepoch() WHERE id = (SELECT MAX(id) FROM cycles)').run();
    db.prepare('INSERT INTO cycles (started_at) VALUES (unixepoch())').run();
    resetCycleStreaks();
    console.log('[cycle] Reset complete ✓');
  } catch (err) { console.error('[cycle] Error:', err); }
}
