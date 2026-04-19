import { getAllWallets, getLastKnownSig, recordSwapEvent, processSwap, getUnfiredMilestones, markMilestoneFired, markSwapEventFired } from '../services/streak.js';
import { scanWalletForSwaps } from '../services/solana.js';
import { fireSwapEvent, fireMilestoneEvent } from '../services/torque.js';
let isRunning = false;
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
export async function runSwapPoll() {
  if (isRunning) { console.log('[poller] Still running, skipping'); return; }
  isRunning = true;
  try {
    const wallets = getAllWallets();
    if (!wallets.length) { console.log('[poller] No wallets registered'); return; }
    console.log(`[poller] Scanning ${wallets.length} wallet(s)...`);
    let total = 0;
    for (const wallet of wallets) {
      try {
        const lastSig = getLastKnownSig(wallet);
        const newSwaps = await scanWalletForSwaps(wallet, lastSig);
        if (!newSwaps.length) continue;
        const sorted = [...newSwaps].sort((a, b) => (a.blockTime || 0) - (b.blockTime || 0));
        for (const swap of sorted) {
          recordSwapEvent(wallet, swap.signature, swap.swapDay);
          const result = processSwap(wallet, swap.swapDay);
          if (!result || !result.isNewDay) continue;
          total++;
          console.log(`[poller] ${wallet.slice(0,8)}... streak: ${result.previousStreak} -> ${result.newStreak}`);
          const t = await fireSwapEvent({ wallet, streakCount: result.newStreak, swapDay: swap.swapDay, txSignature: swap.signature });
          if (t) markSwapEventFired(swap.signature);
          for (const { milestone, isFirstGlobal } of result.newMilestones) {
            const m = await fireMilestoneEvent({ wallet, milestone, isFirstGlobal });
            if (m) markMilestoneFired(wallet, milestone);
          }
        }
        await sleep(300);
      } catch (err) { console.error(`[poller] Error for ${wallet}:`, err.message); }
    }
    console.log(`[poller] Done. ${total} new swap days processed`);
  } finally { isRunning = false; }
}
