// Password gate for /leads. One shared password (LEADS_PASSWORD); the session is a signed cookie
// that names who signed in. Changing the password signs everyone out.
const crypto = require('crypto');

const COOKIE = 'ffl_session';
const MAX_AGE = 60 * 60 * 24 * 30; // 30 days
const PEOPLE = ['Agustin', 'Maria'];
const MIN_PASSWORD = 12;

function password() {
  const p = process.env.LEADS_PASSWORD || '';
  return p.length >= MIN_PASSWORD ? p : null;
}

function key() {
  return crypto.createHash('sha256').update(`ffl-session:${password()}`).digest();
}

function sign(payload) {
  return crypto.createHmac('sha256', key()).update(payload).digest('base64url');
}

function sameText(a, b) {
  const x = crypto.createHash('sha256').update(String(a)).digest();
  const y = crypto.createHash('sha256').update(String(b)).digest();
  return crypto.timingSafeEqual(x, y);
}

function readCookie(req, name) {
  const raw = req.headers?.cookie || '';
  for (const part of raw.split(';')) {
    const i = part.indexOf('=');
    if (i > -1 && part.slice(0, i).trim() === name) return decodeURIComponent(part.slice(i + 1).trim());
  }
  return null;
}

function cookieHeader(value, maxAge) {
  return `${COOKIE}=${encodeURIComponent(value)}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${maxAge}`;
}

/** Returns the signed-in name, or null. */
function session(req) {
  if (!password()) return null;
  const raw = readCookie(req, COOKIE);
  if (!raw) return null;
  const dot = raw.lastIndexOf('.');
  if (dot < 1) return null;
  const payload = raw.slice(0, dot);
  if (!sameText(sign(payload), raw.slice(dot + 1))) return null;
  try {
    const { who, exp } = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (!PEOPLE.includes(who) || !(exp > Date.now())) return null;
    return who;
  } catch {
    return null;
  }
}

/** Checks the password; on success returns the Set-Cookie header value. */
async function login(who, pass) {
  const secret = password();
  if (!secret) return { error: 'not_configured' };
  if (!PEOPLE.includes(who) || typeof pass !== 'string' || !sameText(pass, secret)) {
    await new Promise((r) => setTimeout(r, 800)); // slow down guessing
    return { error: 'wrong_password' };
  }
  const payload = Buffer.from(JSON.stringify({ who, exp: Date.now() + MAX_AGE * 1000 })).toString('base64url');
  return { who, cookie: cookieHeader(`${payload}.${sign(payload)}`, MAX_AGE) };
}

function logoutCookie() {
  return cookieHeader('', 0);
}

module.exports = { session, login, logoutCookie, PEOPLE, MIN_PASSWORD, isConfigured: () => !!password() };
