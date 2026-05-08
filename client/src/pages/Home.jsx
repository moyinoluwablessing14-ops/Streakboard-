import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { api } from '../lib/api.js';

export default function Home() {
  const { publicKey, connected } = useWallet();
  const [streak, setStreak] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [stats, setStats] = useState(null);
  const [registered, setRegistered] = useState(false);
  const [loading, setLoading] = useState(false);
  const address = publicKey?.toString();

  useEffect(() => {
    api.getLeaderboard(50).then(d => setLeaderboard(d.entries || [])).catch(() => {});
    api.getStats().then(setStats).catch(() => {});
  }, []);

  useEffect(() => {
    if (!address) { setStreak(null); setRegistered(false); return; }
    api.getStreak(address).then(d => { setStreak(d); setRegistered(true); }).catch(() => setRegistered(false));
  }, [address]);

  async function register() {
    setLoading(true);
    try { const d = await api.registerWallet(address); setStreak(d.streak); setRegistered(true); } catch {}
    setLoading(false);
  }

  return (
    <div className="page">
      <header style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'20px 0 28px', borderBottom:'1px solid var(--border)', marginBottom:'40px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
          <span className="flame" style={{ fontSize:'22px' }}>🔥</span>
          <span className="display" style={{ fontSize:'22px', color:'var(--text-0)' }}>StreakBoard</span>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:'16px' }}>
          <a href="https://jup.ag" target="_blank" rel="noopener noreferrer" style={{ fontSize:'12px', color:'var(--text-2)' }}>Trade on Jupiter ↗</a>
          <WalletMultiButton />
        </div>
      </header>

      {stats && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'1px', background:'var(--border)', border:'1px solid var(--border)', borderRadius:'8px', overflow:'hidden', marginBottom:'32px' }} className="fade-up">
          {[['Total Wallets', stats.totalWallets], ['Active Today', stats.activeToday], ['Total Swaps', stats.totalSwaps], ['Milestones', stats.globalMilestonesUnlocked]].map(([l,v]) => (
            <div key={l} style={{ background:'var(--bg-1)', padding:'16px 18px' }}>
              <div className="label">{l}</div>
              <div className="display" style={{ fontSize:'22px', marginTop:'6px' }}>{v ?? '—'}</div>
            </div>
          ))}
        </div>
      )}

      <div className="card fade-up fade-up-1" style={{ marginBottom:'32px' }}>
        {!connected ? (
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', textAlign:'center', padding:'32px 0', gap:'16px' }}>
            <span style={{ fontSize:'56px' }} className="flame">🔥</span>
            <h2 className="display" style={{ fontSize:'32px' }}>Swap daily. Climb. Win weekly.</h2>
            <p style={{ color:'var(--text-1)', fontSize:'14px', maxWidth:'400px' }}>Connect your wallet to track your Jupiter swap streak. Hit 5 days to enter the weekly raffle. Top 3 earns a rebate.</p>
            <WalletMultiButton />
          </div>
        ) : !registered ? (
          <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
            <h3 className="display" style={{ fontSize:'20px' }}>First time here?</h3>
            <p style={{ color:'var(--text-1)', fontSize:'13px' }}>Register your wallet to start tracking your daily Jupiter swap streak.</p>
            <button className="btn btn-primary" onClick={register} disabled={loading}>{loading ? 'Registering...' : 'Start Tracking'}</button>
          </div>
        ) : streak ? (
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'32px' }}>
            <div>
              <div className="label">Current Streak</div>
              <div style={{ display:'flex', alignItems:'baseline', gap:'8px', margin:'8px 0' }}>
                <span className="display" style={{ fontSize:'72px', color: streak.isAlive ? 'var(--amber)' : 'var(--text-3)', lineHeight:1 }}>{streak.current}</span>
                <span style={{ color:'var(--text-2)', fontSize:'18px' }}>days</span>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:'6px' }}>
                {streak.isAlive ? <><span className="flame">🔥</span><span style={{ color:'var(--green)', fontSize:'12px' }}>Streak active</span></> : <span style={{ color:'var(--red)', fontSize:'12px' }}>💀 Swap today to start!</span>}
              </div>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:'16px' }}>
              <div><div className="label">Longest Ever</div><div style={{ fontSize:'22px', fontWeight:700 }}>{streak.longest}d</div></div>
              <div style={{ background:'var(--bg-2)', border:'1px solid var(--border)', borderRadius:'6px', padding:'12px' }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'8px' }}>
                  <span className="label">Raffle Entry</span>
                  <span style={{ fontSize:'11px', color: streak.current >= 5 ? 'var(--green)' : 'var(--text-2)' }}>{streak.current >= 5 ? '✓ Eligible' : `${streak.daysUntilRaffle} days to go`}</span>
                </div>
                <div style={{ height:'4px', background:'var(--bg-3)', borderRadius:'2px', overflow:'hidden' }}>
                  <div style={{ height:'100%', width:`${Math.min(100,(streak.current/5)*100)}%`, background: streak.current >= 5 ? 'var(--green)' : 'var(--amber)', borderRadius:'2px', transition:'width 0.6s ease' }} />
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      <div className="card fade-up fade-up-2">
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px' }}>
          <span className="display" style={{ fontSize:'20px' }}>Leaderboard</span>
          <span style={{ fontSize:'11px', color:'var(--text-2)' }}>Updates every 5 min</span>
        </div>
        {leaderboard.length === 0 ? (
          <div style={{ padding:'40px 0', textAlign:'center', color:'var(--text-2)', fontSize:'13px' }}>No active streaks yet — be the first! 🔥</div>
        ) : leaderboard.map((e, i) => (
          <div key={e.wallet} style={{ display:'grid', gridTemplateColumns:'36px 1fr 80px', alignItems:'center', padding:'10px 12px', borderRadius:'6px', background: e.wallet === address ? 'var(--amber-glow)' : 'transparent', border: e.wallet === address ? '1px solid var(--amber-dim)' : '1px solid transparent', marginBottom:'2px' }}>
            <span style={{ fontSize:'14px' }} className={`rank-${e.rank}`}>{e.rank <= 3 ? ['🥇','🥈','🥉'][e.rank-1] : `#${e.rank}`}</span>
            <span style={{ fontFamily:'var(--font-mono)', fontSize:'13px', color: e.wallet === address ? 'var(--amber)' : 'var(--text-0)' }}>
              {e.wallet.slice(0,4)}...{e.wallet.slice(-4)}
              {e.wallet === address && <span style={{ marginLeft:'6px', background:'var(--amber)', color:'#000', fontSize:'9px', padding:'1px 5px', borderRadius:'3px' }}>you</span>}
            </span>
            <span style={{ color:'var(--amber)', fontWeight:700, fontSize:'16px' }}>{e.currentStreak}d <span className="flame">🔥</span></span>
          </div>
        ))}
      </div>
    </div>
  );
}
