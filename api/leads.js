// Private lead finder behind freeformworks.com/leads. One function, routed by ?action=.
const auth = require('../lib/leads/auth');
const places = require('../lib/leads/places');
const store = require('../lib/leads/store');
const { checkSite } = require('../lib/leads/site-check');
const { phoneSpeed } = require('../lib/leads/speed');
const { scoreLead, findChains } = require('../lib/leads/score');

// What the search form offers. The server only runs these, so one click can't run up the bill.
const TYPES = {
  barber: 'barber shop',
  salon: 'hair salon',
  nails: 'nail salon',
  photo: 'photographer',
  florist: 'florist',
  food: 'restaurant',
  lawn: 'lawn care service',
  landscape: 'landscaper',
  contractor: 'general contractor',
  handyman: 'handyman',
  detail: 'auto detailing',
  cleaning: 'house cleaning service',
};

async function mapLimit(items, limit, fn) {
  const out = new Array(items.length);
  let next = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) {
      const i = next++;
      out[i] = await fn(items[i], i);
    }
  });
  await Promise.all(workers);
  return out;
}

const pickLead = (l) => ({
  id: String(l?.id || ''), name: String(l?.name || ''), website: String(l?.website || ''),
  reviews: Number(l?.reviews) || 0, rating: typeof l?.rating === 'number' ? l.rating : null,
});

function savedFields(rec) {
  if (!rec) return {};
  const { status, notes, by, updatedAt, speed, site, search } = rec;
  return { status, notes, by, updatedAt, speed, site, search };
}

async function savedById() {
  if (!store.isConfigured()) return new Map();
  return new Map((await store.all()).map((r) => [r.id, r]));
}

const actions = {
  async me(req, res, who) {
    const saved = store.isConfigured() ? await store.count().catch(() => null) : null;
    res.status(200).json({ who, saved, ready: { maps: !!process.env.GOOGLE_MAPS_API_KEY, store: store.isConfigured() }, types: TYPES });
  },

  async logout(req, res) {
    res.setHeader('Set-Cookie', auth.logoutCookie());
    res.status(200).json({ ok: true });
  },

  async search(req, res) {
    const { city, types } = req.body || {};
    const where = String(city || '').trim().slice(0, 80);
    const picked = [...new Set(Array.isArray(types) ? types : [])].filter((t) => TYPES[t]);
    if (!where || !picked.length) return res.status(400).json({ error: 'Pick a city and at least one kind of business.' });

    const batches = await mapLimit(picked, 4, async (t) =>
      (await places.textSearch(`${TYPES[t]} in ${where}`)).map((l) => ({ ...l, found: TYPES[t] })));
    const byId = new Map();
    for (const l of batches.flat()) if (l.open && !byId.has(l.id)) byId.set(l.id, l);
    const leads = [...byId.values()];
    const chains = findChains(leads);
    const saved = await savedById();

    res.status(200).json({
      city: where,
      leads: leads.map((l) => {
        const rec = saved.get(l.id);
        const chain = chains.has(l.id);
        const site = rec?.site;
        return {
          ...l, chain, ...savedFields(rec),
          pending: !!l.website && !site,
          ...scoreLead(l, { chain, site: l.website ? site : undefined, speed: rec?.speed }),
        };
      }),
    });
  },

  // Checks up to 12 websites per call so the page can show progress.
  async check(req, res) {
    const items = (req.body?.items || []).slice(0, 12);
    const results = await mapLimit(items, 6, async (raw) => {
      const lead = pickLead(raw);
      const site = await checkSite(lead.website);
      const speed = typeof raw?.speed === 'number' ? raw.speed : undefined;
      return { id: lead.id, site, ...scoreLead(lead, { site, speed, chain: !!raw?.chain }) };
    });
    res.status(200).json({ results });
  },

  async speed(req, res, who) {
    const lead = pickLead(req.body?.lead);
    if (!lead.website) return res.status(400).json({ error: 'This business has no website to test.' });
    const speed = await phoneSpeed(lead.website);
    const scored = scoreLead(lead, { site: req.body?.site, speed, chain: !!req.body?.lead?.chain });
    if (store.isConfigured() && (await store.get(lead.id))) await store.save(lead.id, { speed }, who);
    res.status(200).json({ id: lead.id, speed, ...scored });
  },

  async saved(req, res) {
    const records = store.isConfigured() ? await store.all() : [];
    const leads = await mapLimit(records, 8, async (rec) => {
      const fresh = await places.details(rec.id).catch(() => null);
      const lead = fresh || { id: rec.id, name: 'No longer on Google Maps', website: '', reviews: 0, rating: null, gone: true };
      return { ...lead, ...savedFields(rec), ...scoreLead(lead, { site: lead.website ? rec.site : undefined, speed: rec.speed }) };
    });
    res.status(200).json({ leads });
  },

  async save(req, res, who) {
    const { id, status, notes, site, speed, search } = req.body || {};
    if (!id || typeof id !== 'string' || id.length > 300) return res.status(400).json({ error: 'Missing lead.' });
    if (status !== undefined && !store.STATUSES.includes(status)) return res.status(400).json({ error: 'Unknown status.' });
    const change = { status, search };
    if (notes !== undefined) change.notes = String(notes).slice(0, 2000);
    if (site && typeof site === 'object') change.site = site;
    if (typeof speed === 'number') change.speed = speed;
    res.status(200).json({ lead: await store.save(id, change, who) });
  },

  async remove(req, res) {
    const id = req.body?.id;
    if (!id || typeof id !== 'string') return res.status(400).json({ error: 'Missing lead.' });
    await store.remove(id);
    res.status(200).json({ ok: true });
  },
};

const MESSAGES = {
  missing_maps_key: [503, 'Google Maps key missing. Add GOOGLE_MAPS_API_KEY in Vercel and redeploy.'],
  missing_store: [503, 'Saving is not set up yet. Connect Upstash Redis to the project in Vercel and redeploy.'],
};

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Robots-Tag', 'noindex, nofollow');
  const action = String(req.query?.action || '');

  try {
    if (action === 'login') {
      if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
      const out = await auth.login(req.body?.who, req.body?.password);
      if (out.error === 'not_configured') {
        return res.status(503).json({ error: `The page is locked until LEADS_PASSWORD (at least ${auth.MIN_PASSWORD} characters) is set in Vercel.` });
      }
      if (out.error) return res.status(401).json({ error: 'That password is not right.' });
      res.setHeader('Set-Cookie', out.cookie);
      return res.status(200).json({ who: out.who });
    }

    const who = auth.session(req);
    if (!who) return res.status(401).json({ error: 'signed_out', configured: auth.isConfigured() });

    const fn = actions[action];
    if (!fn) return res.status(404).json({ error: 'Unknown action' });
    const wantsPost = !['me', 'saved'].includes(action);
    if (wantsPost && req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    await fn(req, res, who);
  } catch (err) {
    const [status, message] = MESSAGES[err.code] || [502, err.code === 'places_error' && err.fixed ? err.message
      : err.code === 'places_error' || err.code === 'speed_error'
        ? `Google said: ${err.message}` : 'Something went wrong. Check the Vercel logs for [leads].'];
    console.error(`[leads] ${action} failed:`, err.code || '', err.message);
    res.status(status).json({ error: message });
  }
};
