// Looks at a business's website the way an owner's customer would: does it load, is it built
// for phones, where do people book, and when was it last touched.
const SOCIAL = [
  [/(^|\.)facebook\.com$|(^|\.)fb\.com$/, 'Facebook page'],
  [/(^|\.)instagram\.com$/, 'Instagram'],
  [/(^|\.)linktr\.ee$/, 'Linktree'],
  [/(^|\.)yelp\.com$/, 'Yelp page'],
  [/(^|\.)business\.site$/, 'Google page'],
  [/(^|\.)nextdoor\.com$/, 'Nextdoor page'],
];

// Booking and storefront apps. As the whole website, or linked from it.
const BOOKING = [
  [/vagaro\.com/, 'Vagaro'],
  [/glossgenius\.com/, 'GlossGenius'],
  [/booksy\.com/, 'Booksy'],
  [/styleseat\.com/, 'StyleSeat'],
  [/fresha\.com/, 'Fresha'],
  [/schedulicity\.com/, 'Schedulicity'],
  [/setmore\.com/, 'Setmore'],
  [/square\.site|squareup\.com\/appointments|book\.squareup\.com/, 'Square'],
  [/calendly\.com/, 'Calendly'],
  [/acuityscheduling\.com|as\.me\b/, 'Acuity'],
  [/thecut\.co/, 'theCut'],
  [/housecallpro\.com/, 'Housecall Pro'],
  [/getjobber\.com|clienthub\.getjobber/, 'Jobber'],
];

const BUILDERS = [
  [/wixstatic\.com|wix\.com|_wixCssImports/, 'Wix'],
  [/squarespace\.com|static1\.squarespace/, 'Squarespace'],
  [/wsimg\.com|godaddy/i, 'GoDaddy'],
  [/weebly\.com|editmysite\.com/, 'Weebly'],
  [/cdn\.shopify\.com/, 'Shopify'],
  [/wp-content|wp-includes/, 'WordPress'],
];

const MAX_BYTES = 400 * 1024;

function match(list, text) {
  for (const [re, name] of list) if (re.test(text)) return name;
  return null;
}

async function readCapped(res) {
  if (!res.body?.getReader) return (await res.text()).slice(0, MAX_BYTES);
  const reader = res.body.getReader();
  const chunks = [];
  let size = 0;
  while (size < MAX_BYTES) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    size += value.length;
  }
  reader.cancel().catch(() => {});
  return Buffer.concat(chunks.map((c) => Buffer.from(c))).toString('utf8');
}

/**
 * Returns { kind, ... } where kind is one of:
 * none, social, booking-only, down, site
 */
async function checkSite(website, { timeoutMs = 6000 } = {}) {
  if (!website) return { kind: 'none' };
  let url;
  try {
    url = new URL(website);
    if (!/^https?:$/.test(url.protocol)) throw new Error('bad protocol');
  } catch {
    return { kind: 'down', reason: 'Bad web address' };
  }
  const host = url.hostname.replace(/^www\./, '');
  const social = match(SOCIAL, host);
  if (social) return { kind: 'social', platform: social };
  const bookingHost = match(BOOKING, host + url.pathname);
  if (bookingHost) return { kind: 'booking-only', platform: bookingHost };

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      redirect: 'follow',
      signal: ctrl.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; site-check/1.0)', Accept: 'text/html' },
    });
    if (!res.ok) return { kind: 'down', reason: `Error ${res.status}` };
    const finalUrl = new URL(res.url || url);
    const finalHost = finalUrl.hostname.replace(/^www\./, '');
    const redirectedSocial = match(SOCIAL, finalHost);
    if (redirectedSocial) return { kind: 'social', platform: redirectedSocial };
    const redirectedBooking = match(BOOKING, finalHost + finalUrl.pathname);
    if (redirectedBooking) return { kind: 'booking-only', platform: redirectedBooking };

    const html = await readCapped(res);
    const years = [...html.matchAll(/(?:©|&copy;|&#169;|copyright)\s*(?:\d{4}\s*[-–]\s*)?((?:19|20)\d{2})/gi)]
      .map((m) => Number(m[1]));
    return {
      kind: 'site',
      https: finalUrl.protocol === 'https:',
      phoneReady: /<meta[^>]+name=["']?viewport/i.test(html),
      booking: match(BOOKING, html),
      builder: match(BUILDERS, html),
      copyright: years.length ? Math.max(...years) : null,
    };
  } catch (err) {
    return { kind: 'down', reason: err.name === 'AbortError' ? 'Took too long to load' : 'Does not load' };
  } finally {
    clearTimeout(timer);
  }
}

module.exports = { checkSite };
