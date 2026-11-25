// Saved leads live in Upstash Redis (Vercel Marketplace, free plan), reached over its REST API.
// Each record holds only the Google place ID and our own notes, never the Google listing itself.
const PREFIX = 'ffl:lead:';
const INDEX = 'ffl:ids';
const STATUSES = ['saved', 'called', 'visited', 'follow-up', 'not-a-fit', 'client'];

function config() {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  return url && token ? { url: url.replace(/\/$/, ''), token } : null;
}

async function pipeline(commands) {
  const c = config();
  if (!c) throw Object.assign(new Error('Saved leads storage is not set up'), { code: 'missing_store' });
  const r = await fetch(`${c.url}/pipeline`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${c.token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(commands),
  });
  if (!r.ok) throw Object.assign(new Error(`Upstash ${r.status}`), { code: 'store_error' });
  const out = await r.json();
  const failed = out.find((x) => x.error);
  if (failed) throw Object.assign(new Error(`Upstash: ${failed.error}`), { code: 'store_error' });
  return out.map((x) => x.result);
}

const parse = (s) => { try { return s ? JSON.parse(s) : null; } catch { return null; } };

async function all() {
  const [ids] = await pipeline([['SMEMBERS', INDEX]]);
  if (!ids?.length) return [];
  const [rows] = await pipeline([['MGET', ...ids.map((id) => PREFIX + id)]]);
  return rows.map(parse).filter(Boolean);
}

async function count() {
  const [n] = await pipeline([['SCARD', INDEX]]);
  return n || 0;
}

async function get(id) {
  const [row] = await pipeline([['GET', PREFIX + id]]);
  return parse(row);
}

/** Merges a change into a saved lead. Only our own fields are kept. */
async function save(id, change, who) {
  const prev = (await get(id)) || { id, createdAt: new Date().toISOString() };
  const next = { ...prev, updatedAt: new Date().toISOString(), by: who };
  if (change.status !== undefined) next.status = change.status;
  if (change.notes !== undefined) next.notes = change.notes;
  if (change.speed !== undefined) next.speed = change.speed;
  if (change.site !== undefined) next.site = change.site;
  if (change.search !== undefined && !prev.search) next.search = change.search;
  await pipeline([['SET', PREFIX + id, JSON.stringify(next)], ['SADD', INDEX, id]]);
  return next;
}

async function remove(id) {
  await pipeline([['DEL', PREFIX + id], ['SREM', INDEX, id]]);
}

module.exports = { all, count, get, save, remove, STATUSES, isConfigured: () => !!config() };
