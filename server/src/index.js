import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { readDB, writeDB } from './gist.js';
import { fireSwapEvent, fireMilestoneEvent, pingTorque } from './services/torque.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3001;

// --- BADGE HELPER ---
function getBadge(streak) {
  if (streak >= 14) return { icon: '💎', label: 'Diamond' };
  if (streak >= 7)  return { icon: '🥇', label: 'Gold' };
  if (streak >= 3)  return { icon: '🥈', label: 'Silver' };
  return { icon: '🥉', label: 'Bronze' };
}

// --- HEALTH ---
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// --- TORQUE PING ---
app.get('/api/torque/status', async (req, res) => {
  const active = await pingTorque();
  res.json({ torqueActive: active });
});

// --- REGISTER WALLET ---
app.post('/api/wallet/register', async (req, res) => {
  try {
    const { wallet, referredBy } = req.body;
    if (!wallet) return res.status(400).json({ error: 'wallet required' });

    const db = await readDB();
    const now = Date.now();

    if (!db.wallets[wallet]) {
      db.wallets[wallet] = {
        wallet,
        current: 0,
        lastSwapDay: null,
        isAlive: false,
        registeredAt: now,
        referredBy: referredBy || null
      };
    }

    await writeDB(db);
    res.json({ success: true, wallet: db.wallets[wallet] });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// --- RECORD SWAP ---
app.post('/api/swap/record', async (req, res) => {
  try {
    const { wallet, txSignature } = req.body;
    if (!wallet) return res.status(400).json({ error: 'wallet required' });

    const db = await readDB();
    const today = new Date().toISOString().split('T')[0];

    if (!db.wallets[wallet]) {
      db.wallets[wallet] = {
        wallet,
        current: 0,
        lastSwapDay: null,
        isAlive: false,
        registeredAt: Date.now(),
        referredBy: null
      };
    }

    const w = db.wallets[wallet];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    if (w.lastSwapDay === today) {
      return res.json({ success: true, message: 'Already recorded today', streak: w.current });
    }

    if (w.lastSwapDay === yesterday) {
      w.current += 1;
    } else {
      w.current = 1;
    }

    w.lastSwapDay = today;
    w.isAlive = true;

    // Fire Torque events
    await fireSwapEvent({ wallet, streakCount: w.current, swapDay: today, txSignature: txSignature || 'demo' });

    const milestones = [3, 7, 14, 30];
    if (milestones.includes(w.current)) {
      const isFirstGlobal = !Object.values(db.wallets).some(
        x => x.wallet !== wallet && x.current >= w.current
      );
      await fireMilestoneEvent({ wallet, milestone: w.current, isFirstGlobal });
    }

    // Auto-enter raffle
    if (!db.raffle.entries.includes(wallet)) {
      db.raffle.entries.push(wallet);
    }

    await writeDB(db);
    res.json({ success: true, streak: w.current, badge: getBadge(w.current) });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// --- DEMO SWAP (for testing) ---
app.post('/api/swap/demo', async (req, res) => {
  try {
    const { wallet } = req.body;
    if (!wallet) return res.status(400).json({ error: 'wallet required' });

    const db = await readDB();
    const today = new Date().toISOString().split('T')[0];

    if (!db.wallets[wallet]) {
      db.wallets[wallet] = {
        wallet,
        current: 0,
        lastSwapDay: null,
        isAlive: false,
        registeredAt: Date.now(),
        referredBy: null
      };
    }

    const w = db.wallets[wallet];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    if (w.lastSwapDay !== today) {
      w.current = (w.lastSwapDay === yesterday) ? w.current + 1 : 1;
      w.lastSwapDay = today;
      w.isAlive = true;

      await fireSwapEvent({ wallet, streakCount: w.current, swapDay: today, txSignature: 'demo' });

      if ([3,7,14,30].includes(w.current)) {
        await fireMilestoneEvent({ wallet, milestone: w.current, isFirstGlobal: false });
      }

      if (!db.raffle.entries.includes(wallet)) {
        db.raffle.entries.push(wallet);
      }
    }

    await writeDB(db);
    res.json({ success: true, streak: w.current, badge: getBadge(w.current) });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// --- LEADERBOARD ---
app.get('/api/leaderboard', async (req, res) => {
  try {
    const { quality } = req.query;
    const db = await readDB();
    const now = Date.now();

    let entries = Object.values(db.wallets).map(w => ({
      ...w,
      badge: getBadge(w.current),
      referralCount: Object.values(db.wallets).filter(x => x.referredBy === w.wallet).length
    }));

    if (quality === 'true') {
      entries = entries.filter(w => w.current >= 2 && (now - w.registeredAt) > 3600000);
    }

    entries.sort((a, b) => b.current - a.current);
    res.json(entries);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// --- LEADERBOARD STATS ---
app.get('/api/leaderboard/stats', async (req, res) => {
  try {
    const db = await readDB();
    const wallets = Object.values(db.wallets);
    const today = new Date().toISOString().split('T')[0];
    res.json({
      totalWallets: wallets.length,
      activeToday: wallets.filter(w => w.lastSwapDay === today).length,
      topStreak: wallets.length ? Math.max(...wallets.map(w => w.current)) : 0,
      raffleEntries: db.raffle.entries.length
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// --- RAFFLE STATUS ---
app.get('/api/raffle/status', async (req, res) => {
  try {
    const db = await readDB();
    const nextSunday = new Date();
    nextSunday.setDate(nextSunday.getDate() + (7 - nextSunday.getDay()));
    nextSunday.setHours(0,0,0,0);
    res.json({
      entries: db.raffle.entries.length,
      lastWinner: db.raffle.lastWinner,
      lastDrawDate: db.raffle.lastDrawDate,
      nextDraw: nextSunday.toISOString()
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// --- RAFFLE DRAW (manual trigger) ---
app.post('/api/raffle/draw', async (req, res) => {
  try {
    const db = await readDB();
    if (!db.raffle.entries.length) return res.json({ message: 'No entries yet' });
    const winner = db.raffle.entries[Math.floor(Math.random() * db.raffle.entries.length)];
    db.raffle.lastWinner = winner;
    db.raffle.lastDrawDate = new Date().toISOString();
    db.raffle.entries = [];
    await writeDB(db);
    res.json({ winner, drawDate: db.raffle.lastDrawDate });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// --- CAMPAIGNS ---
app.post('/api/campaign/create', async (req, res) => {
  try {
    const { name, actionType, minStreak, rewardDescription, durationDays } = req.body;
    if (!name) return res.status(400).json({ error: 'name required' });

    const db = await readDB();
    const campaign = {
      id: Date.now().toString(),
      name,
      actionType: actionType || 'Swap Streak',
      minStreak: minStreak || 1,
      rewardDescription: rewardDescription || '',
      durationDays: durationDays || 7,
      createdAt: new Date().toISOString(),
      active: true
    };

    db.campaigns.push(campaign);
    await writeDB(db);
    res.json({ success: true, campaign });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/campaign/list', async (req, res) => {
  try {
    const db = await readDB();
    res.json(db.campaigns || []);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.listen(PORT, () => {
  console.log(`StreakBoard server running on port ${PORT}`);
});
