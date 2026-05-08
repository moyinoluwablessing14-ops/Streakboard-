const BASE = import.meta.env.VITE_API_URL || '';
async function request(path, opts = {}) {
  const res = await fetch(`${BASE}${path}`, { headers: { 'Content-Type': 'application/json' }, ...opts });
  if (!res.ok) { const err = await res.json().catch(() => ({ error: res.statusText })); throw new Error(err.error || `Request failed: ${res.status}`); }
  return res.json();
}
export const api = {
  registerWallet: (address) => request('/api/wallet/register', { method: 'POST', body: JSON.stringify({ address }) }),
  getStreak: (address) => request(`/api/wallet/${address}`),
  getMilestones: (address) => request(`/api/wallet/${address}/milestones`),
  getLeaderboard: (limit = 50) => request(`/api/leaderboard?limit=${limit}`),
  getStats: () => request('/api/leaderboard/stats'),
  getEmbedData: (limit = 10) => request(`/api/leaderboard/embed?limit=${limit}`),
};
