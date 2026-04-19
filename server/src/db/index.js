import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, '../../../db.json');
const EMPTY = { wallets: {}, streaks: {}, swap_events: [], milestones: {}, global_milestones: {}, cycles: [{ id: 1, started_at: Math.floor(Date.now()/1000), ended_at: null }] };
function load() {
  try { return JSON.parse(fs.readFileSync(DB_PATH, 'utf8')); }
  catch { save(EMPTY); return JSON.parse(JSON.stringify(EMPTY)); }
}
function save(data) { fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2)); }
export function getDb() { return { load, save }; }
export function dbLoad() { return load(); }
export function dbSave(data) { save(data); }
