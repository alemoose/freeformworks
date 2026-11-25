// Ranks a lead by how much a Freeform site would help and whether the business can pay for one.
// Every point comes with a plain reason we can say out loud when we call or walk in.
function scoreLead(lead, { site, speed, chain, year = new Date().getFullYear() } = {}) {
  const reasons = [];
  const add = (points, label, tone = 'plus') => reasons.push({ points, label, tone });

  if (!lead.website) add(40, 'No website');
  else if (site?.kind === 'social') add(35, `Website is only a ${site.platform}`);
  else if (site?.kind === 'booking-only') add(30, `Website is just their ${site.platform} page`);
  else if (site?.kind === 'down') add(30, `Site is broken: ${site.reason.toLowerCase()}`);
  else if (site?.kind === 'not-theirs') add(35, 'Google links to a site that never mentions them');
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
  else add(0, n ? `Only ${n} review${n === 1 ? '' : 's'}` : 'No reviews yet', 'info');
  if (lead.rating >= 4.5 && n >= 10) add(5, `${lead.rating} stars`);

  if (chain || isKnownChain(lead)) add(-30, 'Looks like a chain', 'minus');

  const score = Math.max(0, reasons.reduce((s, r) => s + r.points, 0));
  return { score, reasons };
}

// Hosts that many unrelated small businesses share, so a shared host here says nothing about a chain.
const SHARED_HOSTS = /(^|\.)(beautyseeker\.com|yellowpages\.com|mapquest\.com|bbb\.org|alignable\.com|manta\.com|thumbtack\.com|angi\.com|homeadvisor\.com|houzz\.com|porch\.com|birdeye\.com|groupon\.com|mydurable\.com|facebook\.com|fb\.com|instagram\.com|linktr\.ee|yelp\.com|nextdoor\.com|google\.com|business\.site|vagaro\.com|glossgenius\.com|booksy\.com|styleseat\.com|fresha\.com|schedulicity\.com|setmore\.com|square\.site|squareup\.com|calendly\.com|acuityscheduling\.com|thecut\.co|wixsite\.com|squarespace\.com|godaddysites\.com|weebly\.com|wordpress\.com|myshopify\.com|carrd\.co)$/;

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
  return new Set(leads.filter((l) => isKnownChain(l) || keyOf(l).some((k) => count.get(k) > 1)).map((l) => l.id));
}

// National chains and franchises. One location in a search can't be caught by name matching, so they are named here.
const CHAINS = new RegExp('^(' + [
  'great clips', 'sport clips', 'supercuts', 'fantastic sams', 'cost cutters', 'smartstyle', 'hair cuttery', 'regis',
  'first choice haircutters', 'roosters', 'floyd.?s 99', 'mastercuts', 'holiday hair', 'ulta', 'jcpenney', 'european wax',
  'the lash lounge', 'drybar', 'massage envy', 'hand ?& ?stone', 'nails? ?pro',
  'the picture people', 'portrait innovations',
  'trugreen', 'weed man', 'the grounds guys', 'lawn doctor', 'u\\.?s\\.? lawns', 'yard ?nique',
  'molly maid', 'merry maids', 'the maids', 'maid pro', 'two maids', 'servpro', 'servicemaster',
  'mr\\.? handyman', 'ace handyman', 'handyman connection', 'ziebart', 'tint world', 'take 5', 'jiffy lube', 'mister car wash',
  'mcdonald.?s', 'burger king', 'chick-?fil-?a', 'taco bell', 'subway', 'domino.?s', 'pizza hut', 'papa john.?s',
  'sonic drive', 'zaxby.?s', 'popeyes', 'kfc', 'starbucks', 'dunkin', 'waffle house', 'cracker barrel', 'applebee.?s',
  'chili.?s grill', 'olive garden', 'outback steakhouse', 'buffalo wild wings', 'panera', 'chipotle', 'moe.?s southwest', 'jimmy john.?s',
  'jersey mike.?s', 'firehouse subs', 'whataburger', 'dairy queen', 'little caesars', 'marco.?s pizza',
  'hooters', 'texas roadhouse', 'longhorn steakhouse', 'ihop', 'panda express', 'raising cane.?s', 'wingstop',
  'five guys', 'cook out', 'krispy kreme', 'baskin', 'tropical smoothie', 'smoothie king',
  'checkers drive', 'jack.?s family', 'mellow mushroom', 'newk.?s', 'twin peaks', 'red lobster', 'logan.?s roadhouse',
  'o.?charley.?s', 'ruby tuesday', 'steak .?n.? shake', 'slim chickens', 'qdoba', 'sbarro', 'cicis', 'golden corral',
  'bojangles', 'church.?s (texas )?chicken', 'captain d.?s', 'tijuana flats', 'mcalister.?s', 'zoe.?s kitchen', 'jason.?s deli',
].join('|') + ')\\b', 'i');

// Chains whose name is also a common first name ("Wendy's Hair Studio"), so only the bare brand name counts.
const EXACT_CHAINS = /^(wendy.?s|denny.?s|arby.?s|hardee.?s|krystal|church.?s)( restaurant)?( #?\d+)?$/i;

function isKnownChain(lead) {
  const name = String(lead.name || '').trim();
  return CHAINS.test(name) || EXACT_CHAINS.test(name);
}

function safeHost(u) {
  try { return new URL(u).hostname.replace(/^www\./, ''); } catch { return u; }
}

module.exports = { scoreLead, findChains };
