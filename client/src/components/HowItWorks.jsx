export default function HowItWorks() {
  const steps = [
    { n:'01', emoji:'🔗', title:'Connect Wallet', body:'Connect your Phantom wallet and register for free. No gas needed.' },
    { n:'02', emoji:'🔄', title:'Swap Daily on Jupiter', body:'Execute at least one swap per day on Jupiter. We detect it automatically.' },
    { n:'03', emoji:'🔥', title:'Build Your Streak', body:'Each consecutive day adds to your streak. Hit 3, 7, or 30 days for milestone badges and gifts.' },
    { n:'04', emoji:'🏆', title:'Win Weekly', body:'Streak ≥ 5 days enters you in the raffle. Top 3 wallets earn a rebate. Resets every Monday.' },
  ];
  return (
    <div style={{ marginTop:'24px' }}>
      <h2 style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:'20px', marginBottom:'16px' }}>How it works</h2>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px' }}>
        {steps.map(s => (
          <div key={s.n} style={{ background:'#111110', border:'1px solid #1e1e1a', borderRadius:'12px', padding:'16px' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'10px' }}>
              <span style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:'11px', color:'#2e2e28' }}>{s.n}</span>
              <span style={{ fontSize:'20px' }}>{s.emoji}</span>
            </div>
            <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:'14px', marginBottom:'6px' }}>{s.title}</div>
            <div style={{ fontSize:'11px', color:'#6b6760', lineHeight:1.6 }}>{s.body}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
