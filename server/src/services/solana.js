import { Connection, PublicKey } from '@solana/web3.js';
import dotenv from 'dotenv';
dotenv.config();
const JUPITER_PROGRAM_ID = process.env.JUPITER_PROGRAM_ID || 'JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4';
const RPC_URL = process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';
let connection;
export function getConnection() {
  if (!connection) connection = new Connection(RPC_URL, 'confirmed');
  return connection;
}
export function todayUTC() {
  return new Date().toISOString().slice(0, 10);
}
export function isValidWallet(address) {
  try { new PublicKey(address); return true; } catch { return false; }
}
export async function getRecentSignatures(walletAddress, { limit = 20, before = undefined } = {}) {
  const conn = getConnection();
  const pubkey = new PublicKey(walletAddress);
  const opts = { limit };
  if (before) opts.before = before;
  return await conn.getSignaturesForAddress(pubkey, opts);
}
export async function isJupiterSwap(signature) {
  const conn = getConnection();
  try {
    const tx = await conn.getParsedTransaction(signature, { maxSupportedTransactionVersion: 0, commitment: 'confirmed' });
    if (!tx || tx.meta?.err) return false;
    const accountKeys = tx.transaction.message.accountKeys.map(k => typeof k === 'string' ? k : k.pubkey?.toString());
    return accountKeys.includes(JUPITER_PROGRAM_ID);
  } catch (err) {
    console.error(`[solana] Failed to parse tx ${signature}:`, err.message);
    return false;
  }
}
export async function scanWalletForSwaps(walletAddress, lastKnownSig = null) {
  const results = [];
  try {
    const sigs = await getRecentSignatures(walletAddress, { limit: 20 });
    const newSigs = lastKnownSig ? sigs.slice(0, sigs.findIndex(s => s.signature === lastKnownSig)) : sigs;
    if (newSigs.length === 0) return results;
    for (const sigInfo of newSigs) {
      if (sigInfo.err) continue;
      const isSwap = await isJupiterSwap(sigInfo.signature);
      if (isSwap) {
        const swapDay = sigInfo.blockTime ? new Date(sigInfo.blockTime * 1000).toISOString().slice(0, 10) : todayUTC();
        results.push({ signature: sigInfo.signature, swapDay, blockTime: sigInfo.blockTime });
      }
    }
  } catch (err) {
    console.error(`[solana] Error scanning wallet ${walletAddress}:`, err.message);
  }
  return results;
}
