// Google's phone speed test (PageSpeed Insights), the same score we quote on our own site.
async function phoneSpeed(website) {
  const params = new URLSearchParams({ url: website, strategy: 'mobile', category: 'performance' });
  if (process.env.GOOGLE_MAPS_API_KEY) params.set('key', process.env.GOOGLE_MAPS_API_KEY);
  const r = await fetch(`https://www.googleapis.com/pagespeedonline/v5/runPagespeed?${params}`);
  if (!r.ok) {
    let detail = '';
    try { detail = (await r.json())?.error?.message || ''; } catch {}
    throw Object.assign(new Error(`PageSpeed ${r.status}: ${detail}`), { code: 'speed_error' });
  }
  const data = await r.json();
  const score = data?.lighthouseResult?.categories?.performance?.score;
  if (typeof score !== 'number') throw Object.assign(new Error('No performance score'), { code: 'speed_error' });
  return Math.round(score * 100);
}

module.exports = { phoneSpeed };
