// Google Places API (New): text search for businesses in a city, and fresh details for saved leads.
// Google's terms allow storing place IDs, not the rest of the listing, so saved leads keep only the
// ID plus our own notes and are re-fetched from Google when shown.
const BASE = 'https://places.googleapis.com/v1';

const FIELDS = [
  'id', 'displayName', 'formattedAddress', 'nationalPhoneNumber', 'websiteUri', 'rating',
  'userRatingCount', 'googleMapsUri', 'businessStatus', 'primaryTypeDisplayName',
];

function apiKey() {
  const k = process.env.GOOGLE_MAPS_API_KEY;
  if (!k) throw Object.assign(new Error('GOOGLE_MAPS_API_KEY is not set'), { code: 'missing_maps_key' });
  return k;
}

function shape(p) {
  return {
    id: p.id,
    name: p.displayName?.text || 'Unnamed business',
    category: p.primaryTypeDisplayName?.text || '',
    address: p.formattedAddress || '',
    phone: p.nationalPhoneNumber || '',
    website: p.websiteUri || '',
    rating: typeof p.rating === 'number' ? p.rating : null,
    reviews: p.userRatingCount || 0,
    maps: p.googleMapsUri || '',
    open: !p.businessStatus || p.businessStatus === 'OPERATIONAL',
  };
}

async function googleError(r) {
  let detail = '';
  try { detail = (await r.json())?.error?.message || ''; } catch {}
  return Object.assign(new Error(`Places API ${r.status}: ${detail}`), { code: 'places_error', status: r.status });
}

/** Up to 60 results (3 pages of 20) for one query, e.g. "barber shop in Tuscaloosa, AL". */
async function textSearch(query, { pages = 3 } = {}) {
  const out = [];
  let pageToken;
  for (let i = 0; i < pages; i++) {
    const r = await fetch(`${BASE}/places:searchText`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey(),
        'X-Goog-FieldMask': FIELDS.map((f) => `places.${f}`).join(',') + ',nextPageToken',
      },
      body: JSON.stringify({ textQuery: query, pageSize: 20, ...(pageToken ? { pageToken } : {}) }),
    });
    if (!r.ok) throw await googleError(r);
    const data = await r.json();
    out.push(...(data.places || []).map(shape));
    pageToken = data.nextPageToken;
    if (!pageToken) break;
  }
  return out;
}

async function details(id) {
  const r = await fetch(`${BASE}/places/${encodeURIComponent(id)}`, {
    headers: { 'X-Goog-Api-Key': apiKey(), 'X-Goog-FieldMask': FIELDS.join(',') },
  });
  if (r.status === 404) return null;
  if (!r.ok) throw await googleError(r);
  return shape(await r.json());
}

module.exports = { textSearch, details };
