import { useState, useEffect } from 'react';
import { api } from '../lib/api.js';
export default function Embed() {
  const [entries, setEntries] = useState([]);
  const params = new URLSearchParams(window.location.search);
  const limit = Math.min(parseInt(params.get('limit') || '10'), 20);
  useEffect(() => {
    api.getEmbedData(limit).then(d => setEntries(d.entries || [])).catch(() => {});
    const i = setInterval(() => api.getEmbedData(limit).then(d => setEntries(d.entries || [])).catch(() => {}), 60000);
    return () => clearInterval(i);
  }, [limit]);
  return (
    <div style={{ fontFamily:"'DM Mono',monospace", background:'#111110', border:'1px solid #2e2e28', borderRadius:'10px', overflow:'hidden', maxWidth:'360px' }}>
      <div style={{ display:'flex', alignItems:'center', gap:'8px', padding:'14px 16px', borderBottom:'1px solid #2e2e28', background:'#0a0a08' }}>
        <span style={{ fontSize:'16px' }}>🔥</span>
        <span style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:'14px', color:'#f5f0e8', flex:1 }}>StreakBoard</span>
        <a href={window.location.origin} target="_blank" rel="noopener noreferrer" style={{ fontSize:'10px', color:'#f5a623', textDecoration:'none' }}>Live ↗</a>
      </div>
      {entries.map(e => (
        <div key={e.wallet} style={{ display:'grid', gridTemplateColumns:'32px 1fr 64px', alignItems:'center', padding:'8px 16px', gap:'8px' }}>
          <span style={{ fontSize:'13px', color:'#f5f0e8' }}>{e.rank <= 3 ? ['🥇','🥈','🥉'][e.rank-1] : `#${e.rank}`}</span>
          <span style={{ fontSize:'12px', color:'#b8b3a8' }}>{e.short}</span>
          <span style={{ textAlign:'right' }}><span style={{ fontSize:'16px', fontWeight:700, color:'#f5a623' }}>{e.streak}</span><span style={{ fontSize:'11px', color:'#6b6760' }}>d 🔥</span></span>
        </div>
      ))}
      {entries.length === 0 && <div style={{ padding:'24px', textAlign:'center', fontSize:'12px', color:'#6b6760' }}>No active streaks yet</div>}
    </div>
  );
}
