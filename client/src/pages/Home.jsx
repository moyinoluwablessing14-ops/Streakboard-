import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { api } from '../lib/api.js';
import HowItWorks from '../components/HowItWorks.jsx';
import RaffleCountdown from '../components/RaffleCountdown.jsx';

export default function Home() {
  const { publicKey, connected } = useWallet();
  const [streak, setStreak] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [stats, setStats] = useState(null);
  const [registered, setRegistered] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const address = publicKey?.toString();

  useEffect(() => {
    api.getLeaderboard(50).then(d => setLeaderboard(d.entries || [])).catch(() => {});
    api.getStats().then(setStats).catch(() => {});
    const i = setInterval(() => {
      api.getLeaderboard(50).then(d => setLeaderboard(d.entries || [])).catch(() => {});
      api.getStats().then(setStats).catch(() => {});
    }, 60000);
    return () => clearInterval(i);
  }, []);

  useEffect(() => {
    if (!address) { setStreak(null); setRegistered(false); return; }
    setChecking(true);
    api.getStreak(address)
      .then(d => { setStreak(d); setRegistered(true); })
      .catch(() => { setRegistered(false); setStreak(null); })
      .finally(() => setChecking(false));
  }, [address]);

  async function register() {
    if (!address) return;
    setLoading(true);
    try {
      const d = await api.registerWallet(address);
      setStreak(d.streak);
      setRegistered(true);
    } catch(e) {
      console.error('Register error:', e);
    }
    setLoading(false);
  }

  return (
    <div style={{ minHeight:'100vh', background:'#0a0a08', color:'#f5f0e8', fontFamily:"'DM Mono',monospace", overflowX:'hidden' }}>

      <nav style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px 20px', borderBottom:'1px solid #1e1e1a', background:'rgba(10,10,8,0.95)', position:'sticky', top:0, zIndex:100 }}>
        <div style={{ display:'flex', alignItems:'center', gap:'8px', flexShrink:0 }}>
          <span style={{ fontSize:'20px' }}>🔥</span>
          <span style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:'18px', letterSpacing:'-0.03em' }}>StreakBoard</span>
          <span style={{ background:'#1a1a17', border:'1px solid #2e2e28', borderRadius:'20px', padding:'2px 8px', fontSize:'9px', color:'#f5a623', letterSpacing:'0.1em' }}>BETA</span>
        </div>
        <WalletMultiButton />
      </nav>

      <div style={{ maxWidth:'640px', margin:'0 auto', padding:'0 20px 80px' }}>

        {!connected && (
          <div style={{ textAlign:'center', padding:'48px 0 32px' }}>
            <div style={{ display:'inline-flex', alignItems:'center', gap:'6px', background:'#1a1a17', border:'1px solid #2e2e28', borderRadius:'20px', padding:'5px 14px', fontSize:'10px', color:'#f5a623', letterSpacing:'0.08em', marginBottom:'24px' }}>
              <span style={{ fontSize:'8px' }}>●</span> POWERED BY TORQUE PROTOCOL
            </div>
            <h1 style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:'clamp(36px,9vw,64px)', letterSpacing:'-0.04em', lineHeight:1.05, marginBottom:'16px' }}>
              Swap daily.<br />
              <span style={{ color:'#f5a623' }}>Climb the board.</span><br />
              Win weekly.
            </h1>
            <p style={{ color:'#6b6760', fontSize:'14px', marginBottom:'28px', lineHeight:1.7 }}>
              Track your Jupiter swap streak. Hit 5 days to enter the weekly raffle. Top 3 earns a rebate. First to hit milestones gets a gift.
            </p>
            <WalletMultiButton />
            <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'10px', marginTop:'36px', paddingTop:'28px', borderTop:'1px solid #1a1a17' }}>
              {[['🏆','Leaderboard'],['🎟','Raffle'],['💸','Rebate'],['🎁','Gift']].map(([e,t]) => (
                <div key={t} style={{ background:'#111110', border:'1px solid #1e1e1a', borderRadius:'10px', padding:'12px 8px', textAlign:'center' }}>
                  <div style={{ fontSize:'20px', marginBottom:'6px' }}>{e}</div>
                  <div style={{ fontSize:'10px', color:'#f5a623', letterSpacing:'0.08em', fontWeight:600 }}>{t}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {stats && (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:'10px', marginBottom:'16px', marginTop: connected ? '24px' : '0' }}>
            {[['👛','Wallets',stats.totalWallets],['⚡','Active Today',stats.activeToday],['🔄','Swaps',stats.totalSwaps],['🏆','Milestones',stats.globalMilestonesUnlocked]].map(([e,l,v]) => (
              <div key={l} style={{ background:'#111110', border:'1px solid #1e1e1a', borderRadius:'12px', padding:'16px' }}>
                <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'8px' }}>
                  <span style={{ fontSize:'16px' }}>{e}</span>
                  <span style={{ fontSize:'10px', color:'#3d3a35', letterSpacing:'0.08em', textTransform:'uppercase' }}>{l}</span>
                </div>
                <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:'28px', color:'#f5f0e8' }}>{v ?? '—'}</div>
              </div>
            ))}
          </div>
        )}

        <RaffleCountdown />

        {connected && (
          <div style={{ background: streak?.isAlive ? 'linear-gradient(135deg,#111110,rgba(245,166,35,0.06))' : '#111110', border:`1px solid ${streak?.isAlive ? '#c4841a' : '#1e1e1a'}`, borderRadius:'16px', padding:'24px', marginTop:'16px', boxShadow: streak?.isAlive ? '0 0 40px rgba(245,166,35,0.08)' : 'none' }}>
            {checking ? (
              <div style={{ textAlign:'center', padding:'20px', color:'#6b6760', fontSize:'13px' }}>
                Checking your streak...
              </div>
            ) : !registered ? (
              <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
                <div style={{ fontSize:'28px' }}>👋</div>
                <h3 style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:'20px' }}>First time here?</h3>
                <p style={{ color:'#6b6760', fontSize:'13px', lineHeight:1.6 }}>Register your wallet to start tracking your daily Jupiter swap streak.</p>
                <button
                  onClick={register}
                  disabled={loading}
                  style={{ alignSelf:'flex-start', background: loading ? '#6b6760' : '#f5a623', color:'#000', border:'none', borderRadius:'8px', padding:'14px 24px', fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:'15px', cursor: loading ? 'not-allowed' : 'pointer', transition:'all 0.2s' }}
                >
                  {loading ? 'Registering...' : '🚀 Start Tracking'}
                </button>
              </div>
            ) : streak ? (
              <div>
                <div style={{ display:'flex', alignItems:'flex-end', gap:'8px', marginBottom:'8px' }}>
                  <span style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:'72px', color: streak.isAlive ? '#f5a623' : '#2e2e28', lineHeight:1 }}>{streak.current}</span>
                  <span style={{ color:'#3d3a35', fontSize:'18px', marginBottom:'8px' }}>day streak</span>
                </div>
                <div style={{ fontSize:'13px', color: streak.isAlive ? '#4ade80' : '#f87171', marginBottom:'20px' }}>
                  {streak.isAlive ? '🔥 Streak active — keep going!' : '💀 Swap today to restart'}
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px', marginBottom:'16px' }}>
                  <div style={{ background:'#0a0a08', border:'1px solid #1a1a17', borderRadius:'8px', padding:'12px' }}>
                    <div style={{ fontSize:'10px', color:'#3d3a35', letterSpacing:'0.08em', textTransform:'uppercase' }}>Longest</div>
                    <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:'22px', marginTop:'4px' }}>{streak.longest}d</div>
                  </div>
                  <div style={{ background:'#0a0a08', border:'1px solid #1a1a17', borderRadius:'8px', padding:'12px' }}>
                    <div style={{ fontSize:'10px', color:'#3d3a35', letterSpacing:'0.08em', textTransform:'uppercase' }}>Last Swap</div>
                    <div style={{ fontSize:'12px', color:'#6b6760', marginTop:'6px' }}>{streak.lastSwapDay || '—'}</div>
                  </div>
                </div>
                <div style={{ background:'#0a0a08', border:'1px solid #1a1a17', borderRadius:'10px', padding:'14px' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'10px' }}>
                    <span style={{ fontSize:'11px', color:'#6b6760' }}>Raffle progress</span>
                    <span style={{ fontSize:'11px', color: streak.current >= 5 ? '#4ade80' : '#f5a623' }}>{streak.current >= 5 ? '✓ Eligible!' : `${streak.daysUntilRaffle} days left`}</span>
                  </div>
                  <div style={{ height:'6px', background:'#1a1a17', borderRadius:'3px', overflow:'hidden' }}>
                    <div style={{ height:'100%', width:`${Math.min(100,(streak.current/5)*100)}%`, background: streak.current >= 5 ? '#4ade80' : '#f5a623', borderRadius:'3px', transition:'width 0.8s ease' }} />
                  </div>
                  <div style={{ display:'flex', justifyContent:'space-between', marginTop:'8px' }}>
                    {[1,2,3,4,5].map(d => <span key={d} style={{ fontSize:'11px', color: streak.current >= d ? '#f5a623' : '#2e2e28' }}>{streak.current >= d ? '◆' : '◇'}</span>)}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        )}

        <div style={{ background:'#111110', border:'1px solid #1e1e1a', borderRadius:'16px', padding:'20px', marginTop:'16px' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px' }}>
            <div>
              <h2 style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:'20px' }}>Leaderboard</h2>
              <p style={{ fontSize:'10px', color:'#3d3a35', marginTop:'3px', letterSpacing:'0.06em' }}>UPDATES EVERY 5 MIN</p>
            </div>
            {stats && <div style={{ background:'#0a0a08', border:'1px solid #1e1e1a', borderRadius:'6px', padding:'6px 10px', fontSize:'11px', color:'#6b6760' }}>{stats.activeToday} active</div>}
          </div>
          {leaderboard.length === 0 ? (
            <div style={{ padding:'40px 0', textAlign:'center' }}>
              <div style={{ fontSize:'32px', marginBottom:'10px' }}>🔥</div>
              <p style={{ color:'#3d3a35', fontSize:'13px' }}>No active streaks yet — be the first!</p>
            </div>
          ) : leaderboard.map((e) => {
            const isUser = e.wallet === address;
            return (
              <div key={e.wallet} style={{ display:'grid', gridTemplateColumns:'36px 1fr auto', alignItems:'center', padding:'10px 12px', borderRadius:'10px', background: isUser ? 'rgba(245,166,35,0.07)' : 'transparent', border:`1px solid ${isUser ? '#c4841a' : 'transparent'}`, marginBottom:'3px' }}>
                <span style={{ fontSize:'15px', fontWeight:700, color: e.rank===1?'#f5a623':e.rank===2?'#c0c0c0':e.rank===3?'#cd7f32':'#3d3a35' }}>
                  {e.rank<=3?['🥇','🥈','🥉'][e.rank-1]:`#${e.rank}`}
                </span>
                <div style={{ display:'flex', alignItems:'center', gap:'8px', minWidth:0 }}>
                  <span style={{ fontSize:'13px', color: isUser?'#f5a623':'#b8b3a8', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                    {e.wallet.slice(0,5)}...{e.wallet.slice(-4)}
                  </span>
                  {isUser && <span style={{ background:'#f5a623', color:'#000', fontSize:'8px', fontWeight:700, padding:'2px 5px', borderRadius:'3px', flexShrink:0 }}>YOU</span>}
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:'4px' }}>
                  <span style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:'18px', color:'#f5a623' }}>{e.currentStreak}</span>
                  <span style={{ fontSize:'11px', color:'#3d3a35' }}>d 🔥</span>
                </div>
              </div>
            );
          })}
          <div style={{ display:'flex', flexWrap:'wrap', gap:'12px', marginTop:'16px', paddingTop:'16px', borderTop:'1px solid #1a1a17' }}>
            {[['#f5a623','Top 3 earn rebate'],['#4ade80','Streak ≥ 5 enters raffle']].map(([c,t]) => (
              <div key={t} style={{ display:'flex', alignItems:'center', gap:'5px' }}>
                <span style={{ fontSize:'8px', color:c }}>◆</span>
                <span style={{ fontSize:'10px', color:'#3d3a35' }}>{t}</span>
              </div>
            ))}
          </div>
        </div>

        <HowItWorks />

      </div>
    </div>
  );
}
