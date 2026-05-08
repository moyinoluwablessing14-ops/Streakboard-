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
    const i = setInterval(() => {
      api.getLeaderboard(50).then(d => setLeaderboard(d.entries || [])).catch(() => {});
      api.getStats().then(setStats).catch(() => {});
    }, 60000);
    return () => clearInterval(i);
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
    <div style={{ minHeight:'100vh', background:'#0a0a08', color:'#f5f0e8', fontFamily:"'DM Mono',monospace" }}>

      {/* Nav */}
      <nav style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'20px 32px', borderBottom:'1px solid #1e1e1a', backdropFilter:'blur(10px)', position:'sticky', top:0, background:'rgba(10,10,8,0.9)', zIndex:100 }}>
        <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
          <span style={{ fontSize:'24px' }}>🔥</span>
          <span style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:'20px', letterSpacing:'-0.03em' }}>StreakBoard</span>
          <span style={{ background:'#1a1a17', border:'1px solid #2e2e28', borderRadius:'20px', padding:'2px 10px', fontSize:'10px', color:'#f5a623', letterSpacing:'0.1em' }}>BETA</span>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:'16px' }}>
          <a href="https://jup.ag" target="_blank" rel="noopener noreferrer" style={{ fontSize:'12px', color:'#6b6760', textDecoration:'none', letterSpacing:'0.05em' }}>Jupiter ↗</a>
          <WalletMultiButton />
        </div>
      </nav>

      <div style={{ maxWidth:'960px', margin:'0 auto', padding:'0 24px 80px' }}>

        {/* Hero */}
        {!connected && (
          <div style={{ textAlign:'center', padding:'80px 0 60px', borderBottom:'1px solid #1e1e1a', marginBottom:'48px' }}>
            <div style={{ display:'inline-flex', alignItems:'center', gap:'8px', background:'#1a1a17', border:'1px solid #2e2e28', borderRadius:'20px', padding:'6px 16px', fontSize:'11px', color:'#f5a623', letterSpacing:'0.08em', marginBottom:'28px' }}>
              <span>●</span> POWERED BY TORQUE PROTOCOL
            </div>
            <h1 style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:'clamp(40px,8vw,72px)', letterSpacing:'-0.04em', lineHeight:1.05, marginBottom:'20px' }}>
              Swap daily.<br />
              <span style={{ color:'#f5a623' }}>Climb the board.</span><br />
              Win weekly.
            </h1>
            <p style={{ color:'#6b6760', fontSize:'15px', maxWidth:'460px', margin:'0 auto 36px', lineHeight:1.7 }}>
              Track your Jupiter swap streak. Hit 5 days to enter the weekly raffle. Top 3 earns a rebate. First to hit milestones gets a gift.
            </p>
            <WalletMultiButton />
            <div style={{ display:'flex', justifyContent:'center', gap:'32px', marginTop:'48px' }}>
              {[['Leaderboard','Live rankings'],['Raffle','Weekly draw'],['Rebate','Top 3 reward'],['Gift','Milestone prize']].map(([t,s]) => (
                <div key={t} style={{ textAlign:'center' }}>
                  <div style={{ fontSize:'11px', color:'#f5a623', letterSpacing:'0.1em', fontWeight:600 }}>{t}</div>
                  <div style={{ fontSize:'11px', color:'#3d3a35', marginTop:'2px' }}>{s}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Stats */}
        {stats && (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'12px', marginBottom:'32px' }}>
            {[['Total Wallets',stats.totalWallets,'👛'],['Active Today',stats.activeToday,'⚡'],['Total Swaps',stats.totalSwaps,'🔄'],['Milestones',stats.globalMilestonesUnlocked,'🏆']].map(([l,v,e]) => (
              <div key={l} style={{ background:'#111110', border:'1px solid #1e1e1a', borderRadius:'12px', padding:'20px 16px', transition:'border-color 0.2s' }}>
                <div style={{ fontSize:'20px', marginBottom:'8px' }}>{e}</div>
                <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:'28px', color:'#f5f0e8', lineHeight:1 }}>{v ?? '—'}</div>
                <div style={{ fontSize:'10px', color:'#3d3a35', letterSpacing:'0.1em', marginTop:'6px', textTransform:'uppercase' }}>{l}</div>
              </div>
            ))}
          </div>
        )}

        {/* Streak Card */}
        {connected && (
          <div style={{ background: streak?.isAlive ? 'linear-gradient(135deg,#111110,rgba(245,166,35,0.06))' : '#111110', border:`1px solid ${streak?.isAlive ? '#c4841a' : '#1e1e1a'}`, borderRadius:'16px', padding:'32px', marginBottom:'24px', boxShadow: streak?.isAlive ? '0 0 60px rgba(245,166,35,0.1)' : 'none' }}>
            {!registered ? (
              <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
                <div style={{ fontSize:'32px' }}>👋</div>
                <h3 style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:'22px' }}>First time here?</h3>
                <p style={{ color:'#6b6760', fontSize:'13px', lineHeight:1.6 }}>Register your wallet to start tracking your daily Jupiter swap streak and compete on the leaderboard.</p>
                <button onClick={register} disabled={loading} style={{ alignSelf:'flex-start', background:'#f5a623', color:'#000', border:'none', borderRadius:'8px', padding:'12px 24px', fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:'14px', cursor:'pointer', opacity: loading ? 0.7 : 1 }}>
                  {loading ? 'Registering...' : 'Start Tracking →'}
                </button>
              </div>
            ) : streak ? (
              <div style={{ display:'grid', gridTemplateColumns:'auto 1fr', gap:'40px', alignItems:'start' }}>
                <div>
                  <div style={{ fontSize:'10px', color:'#3d3a35', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:'8px' }}>Current Streak</div>
                  <div style={{ display:'flex', alignItems:'baseline', gap:'8px' }}>
                    <span style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:'80px', color: streak.isAlive ? '#f5a623' : '#2e2e28', lineHeight:1 }}>{streak.current}</span>
                    <span style={{ color:'#3d3a35', fontSize:'20px' }}>days</span>
                  </div>
                  <div style={{ marginTop:'8px', fontSize:'12px', color: streak.isAlive ? '#4ade80' : '#f87171' }}>
                    {streak.isAlive ? '🔥 Active — keep it going!' : '💀 Swap today to restart'}
                  </div>
                </div>
                <div style={{ display:'flex', flexDirection:'column', gap:'16px', paddingTop:'8px' }}>
                  <div style={{ display:'flex', gap:'24px' }}>
                    <div><div style={{ fontSize:'10px', color:'#3d3a35', letterSpacing:'0.1em', textTransform:'uppercase' }}>Longest</div><div style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:'24px', marginTop:'4px' }}>{streak.longest}d</div></div>
                    <div><div style={{ fontSize:'10px', color:'#3d3a35', letterSpacing:'0.1em', textTransform:'uppercase' }}>Last Swap</div><div style={{ fontSize:'13px', color:'#6b6760', marginTop:'6px' }}>{streak.lastSwapDay || '—'}</div></div>
                  </div>
                  <div style={{ background:'#0a0a08', border:'1px solid #1e1e1a', borderRadius:'10px', padding:'14px' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'10px' }}>
                      <span style={{ fontSize:'11px', color:'#6b6760' }}>Raffle entry progress</span>
                      <span style={{ fontSize:'11px', color: streak.current >= 5 ? '#4ade80' : '#f5a623' }}>{streak.current >= 5 ? '✓ Eligible!' : `${streak.daysUntilRaffle} days left`}</span>
                    </div>
                    <div style={{ height:'6px', background:'#1a1a17', borderRadius:'3px', overflow:'hidden' }}>
                      <div style={{ height:'100%', width:`${Math.min(100,(streak.current/5)*100)}%`, background: streak.current >= 5 ? '#4ade80' : '#f5a623', borderRadius:'3px', transition:'width 0.8s ease' }} />
                    </div>
                    <div style={{ display:'flex', justifyContent:'space-between', marginTop:'6px' }}>
                      {[1,2,3,4,5].map(d => <span key={d} style={{ fontSize:'10px', color: streak.current >= d ? '#f5a623' : '#2e2e28' }}>{streak.current >= d ? '◆' : '◇'}</span>)}
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        )}

        {/* Leaderboard */}
        <div style={{ background:'#111110', border:'1px solid #1e1e1a', borderRadius:'16px', padding:'28px' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'24px' }}>
            <div>
              <h2 style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:'22px' }}>Leaderboard</h2>
              <p style={{ fontSize:'11px', color:'#3d3a35', marginTop:'4px', letterSpacing:'0.05em' }}>RANKED BY ACTIVE STREAK · UPDATES EVERY 5 MIN</p>
            </div>
            {stats && <div style={{ background:'#0a0a08', border:'1px solid #1e1e1a', borderRadius:'8px', padding:'8px 14px', fontSize:'12px', color:'#6b6760' }}>{stats.activeToday} active today</div>}
          </div>

          {leaderboard.length === 0 ? (
            <div style={{ padding:'60px 0', textAlign:'center' }}>
              <div style={{ fontSize:'40px', marginBottom:'12px' }}>🔥</div>
              <p style={{ color:'#3d3a35', fontSize:'13px' }}>No active streaks yet — be the first!</p>
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:'4px' }}>
              {leaderboard.map((e) => {
                const isUser = e.wallet === address;
                const medals = ['🥇','🥈','🥉'];
                return (
                  <div key={e.wallet} style={{ display:'grid', gridTemplateColumns:'44px 1fr 100px', alignItems:'center', padding:'12px 16px', borderRadius:'10px', background: isUser ? 'rgba(245,166,35,0.08)' : e.rank <= 3 ? 'rgba(255,255,255,0.02)' : 'transparent', border:`1px solid ${isUser ? '#c4841a' : 'transparent'}`, transition:'background 0.15s' }}>
                    <span style={{ fontSize:'16px', fontWeight:700, color: e.rank === 1 ? '#f5a623' : e.rank === 2 ? '#c0c0c0' : e.rank === 3 ? '#cd7f32' : '#3d3a35' }}>
                      {e.rank <= 3 ? medals[e.rank-1] : `#${e.rank}`}
                    </span>
                    <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                      <span style={{ fontFamily:"'DM Mono',monospace", fontSize:'13px', color: isUser ? '#f5a623' : '#b8b3a8' }}>
                        {e.wallet.slice(0,6)}...{e.wallet.slice(-4)}
                      </span>
                      {isUser && <span style={{ background:'#f5a623', color:'#000', fontSize:'9px', fontWeight:700, padding:'2px 6px', borderRadius:'4px', letterSpacing:'0.05em' }}>YOU</span>}
                    </div>
                    <div style={{ textAlign:'right', display:'flex', alignItems:'center', justifyContent:'flex-end', gap:'6px' }}>
                      <span style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:'20px', color:'#f5a623' }}>{e.currentStreak}</span>
                      <span style={{ fontSize:'12px', color:'#3d3a35' }}>days 🔥</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div style={{ display:'flex', gap:'20px', marginTop:'24px', paddingTop:'20px', borderTop:'1px solid #1a1a17', flexWrap:'wrap' }}>
            {[['◆','amber','Top 3 earn rebate'],['◆','green','Streak ≥ 5 enters raffle'],['🏆','','First milestone = gift']].map(([icon,color,text]) => (
              <div key={text} style={{ display:'flex', alignItems:'center', gap:'6px' }}>
                <span style={{ fontSize:'11px', color: color === 'amber' ? '#f5a623' : color === 'green' ? '#4ade80' : 'inherit' }}>{icon}</span>
                <span style={{ fontSize:'11px', color:'#3d3a35' }}>{text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
