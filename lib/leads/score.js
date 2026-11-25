// Ranks a lead by how much a Freeform site would help and whether the business can pay for one.
// Every point comes with a plain reason we can say out loud when we call or walk in.
function scoreLead(lead, { site, speed, chain, year = new Date().getFullYear() } = {}) {
  const reasons = [];
  const add = (points, label, tone = 'plus') => reasons.push({ points, label, tone });

  if (!lead.website) add(40, 'No website');
  else if (site?.kind === 'social') add(35, `Website is only a ${site.platform}`);
  else if (site?.kind === 'booking-only') add(30, `Website is just their ${site.platform} page`);
  else if (site?.kind === 'down') add(30, `Site is broken: ${site.reason.toLowerCase()}`);
  else if (site?.kind === 'site') {
    if (!site.phoneReady) add(15, 'Not built for phones');
    if (!site.https) add(10, 'Browser shows "Not secure"');
    if (site.booking) add(15, `Books through ${site.booking}`);
    if (site.copyright && site.copyright <= year - 3) add(10, `Footer says © ${site.copyright}`);
    if (site.builder) add(0, `Built on ${site.builder}`, 'info');
  }

  if (typeof speed === 'number') {
    if (speed < 50) add(15, `Phone speed ${speed}/100`);
    else if (speed < 90) add(5, `Phone speed ${speed}/100`);
    else add(-10, `Already fast: ${speed}/100`, 'minus');
  }

  const n = lead.reviews || 0;
  if (n >= 100) add(20, `${n} reviews`);
  else if (n >= 30) add(12, `${n} reviews`);
  else if (n >= 10) add(6, `${n} reviews`);
  else add(0, n ? `Only ${n} reviews` : 'No reviews yet', 'info');
  if (lead.rating >= 4.5 && n >= 10) add(5, `${lead.rating} stars`);

  if (chain) add(-30, 'Looks like a chain', 'minus');

  const score = Math.max(0, reasons.reduce((s, r) => s + r.points, 0));
  return { score, reasons };
}

// Hosts that many unrelated small businesses share, so a shared host here says nothing about a chain.
const SHARED_HOSTS = /(^|\.)(facebook\.com|fb\.com|instagram\.com|linktr\.ee|yelp\.com|nextdoor\.com|google\.com|business\.site|vagaro\.com|glossgenius\.com|booksy\.com|styleseat\.com|fresha\.com|schedulicity\.com|setmore\.com|square\.site|squareup\.com|calendly\.com|acuityscheduling\.com|thecut\.co|wixsite\.com|squarespace\.com|godaddysites\.com|weebly\.com|wordpress\.com|myshopify\.com|carrd\.co)$/;

/** Marks businesses that share a name or a website with another result as likely chains. */
function findChains(leads) {
  const count = new Map();
  const keyOf = (l) => {
    const keys = ['n:' + l.name.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()];
    const h = l.website ? safeHost(l.website) : '';
    if (h && !SHARED_HOSTS.test(h)) keys.push('w:' + h);
    return keys;
  };
  for (const l of leads) for (const k of keyOf(l)) count.set(k, (count.get(k) || 0) + 1);
  return new Set(leads.filter((l) => keyOf(l).some((k) => count.get(k) > 1)).map((l) => l.id));
}

function safeHost(u) {
  try { return new URL(u).hostname.replace(/^www\./, ''); } catch { return u; }
}

module.exports = { scoreLead, findChains };
