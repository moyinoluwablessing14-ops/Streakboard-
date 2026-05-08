import { useState, useEffect } from 'react';
export default function RaffleCountdown() {
  const [timeLeft, setTimeLeft] = useState('');
  useEffect(() => {
    function calc() {
      const now = new Date();
      const next = new Date(now);
      const day = now.getUTCDay();
      const daysUntil = day === 1 ? 7 : (8 - day) % 7;
      next.setUTCDate(now.getUTCDate() + daysUntil);
      next.setUTCHours(0, 0, 0, 0);
      const diff = next - now;
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${d}d ${h}h ${m}m ${s}s`);
    }
    calc();
    const i = setInterval(calc, 1000);
    return () => clearInterval(i);
  }, []);
  return (
    <div style={{ background:'linear-gradient(135deg,#111110,rgba(245,166,35,0.05))', border:'1px solid #c4841a', borderRadius:'12px', padding:'16px 20px', marginTop:'16px', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:'12px' }}>
      <div>
        <div style={{ fontSize:'10px', color:'#f5a623', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:'4px' }}>🎟 Next Weekly Raffle</div>
        <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:'22px', color:'#f5a623' }}>{timeLeft}</div>
        <div style={{ fontSize:'11px', color:'#6b6760', marginTop:'4px' }}>Streak ≥ 5 days to enter • Top 3 earn rebate</div>
      </div>
      <a href="https://jup.ag" target="_blank" rel="noopener noreferrer" style={{ background:'#f5a623', color:'#000', borderRadius:'8px', padding:'12px 20px', fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:'14px', textDecoration:'none', display:'inline-flex', alignItems:'center', gap:'8px', flexShrink:0 }}>
        Swap on Jupiter ↗
      </a>
    </div>
  );
}
