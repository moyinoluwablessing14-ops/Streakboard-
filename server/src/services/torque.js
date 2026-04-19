import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const INGEST_URL = process.env.TORQUE_INGEST_URL || 'https://ingest.torque.so/events';
const API_TOKEN = process.env.TORQUE_API_TOKEN;

async function ingestEvent(userPubkey, eventName, data) {
  if (!API_TOKEN) {
    console.warn('[torque] No API token set — skipping event:', eventName);
    return null;
  }
  try {
    const res = await axios.post(INGEST_URL, {
      userPubkey,
      timestamp: Date.now(),
      eventName,
      data,
    }, {
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_TOKEN,
      },
      timeout: 10000,
    });
    console.log(`[torque] Event sent: ${eventName} for ${userPubkey.slice(0,8)}...`);
    return res.data;
  } catch (err) {
    console.error(`[torque] Failed to send ${eventName}:`, err.response?.data || err.message);
    return null;
  }
}

export async function fireSwapEvent({ wallet, streakCount, swapDay, txSignature }) {
  return ingestEvent(wallet, 'daily_swap', {
    streak_count: streakCount,
    swap_day: swapDay,
    tx_signature: txSignature,
  });
}

export async function fireMilestoneEvent({ wallet, milestone, isFirstGlobal }) {
  return ingestEvent(wallet, 'streak_milestone', {
    milestone_days: milestone,
    first_global: isFirstGlobal,
  });
}

export async function pingTorque() {
  if (!API_TOKEN) {
    console.warn('[torque] No API token — running in offline mode');
    return false;
  }
  console.log('[torque] API token present ✓');
  return true;
}
