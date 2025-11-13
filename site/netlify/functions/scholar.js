let CACHE = { data: null, ts: 0 };
const TTL_MS = 12 * 60 * 60 * 1000; // 12 hours

export async function handler(event, context) {
  const qs = event?.queryStringParameters || {};
  const defaultUrl = "https://scholar.google.com/citations?user=BzcPJKEAAAAJ&hl=en&authuser=1";
  const incomingUrl = typeof qs.url === 'string' ? qs.url : '';
  const url = (incomingUrl.startsWith('https://scholar.google.com/citations')) ? incomingUrl : defaultUrl;
  const refresh = qs.refresh === '1' || qs.refresh === 'true';
  try {
    const now = Date.now();
    if (!refresh && CACHE.data && now - CACHE.ts < TTL_MS) {
      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify(CACHE.data)
      };
    }
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9"
      }
    });
    if (!res.ok) {
      return {
        statusCode: res.status,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({ error: `Upstream error ${res.status}` })
      };
    }
    const html = await res.text();

    const rows = [...html.matchAll(/<tr>\s*<td class="gsc_rsb_st">\s*([^<]+)\s*<\/td>\s*<td class="gsc_rsb_std">\s*([0-9,]+)\s*<\/td>/g)];
    // Expected order: Citations, h-index, i10-index
    let citations = null, hindex = null, i10index = null;
    for (const m of rows) {
      const label = (m[1] || "").trim().toLowerCase();
      const value = (m[2] || "").trim();
      if (label.startsWith("citations")) citations = value;
      else if (label.startsWith("h-index")) hindex = value;
      else if (label.startsWith("i10-index")) i10index = value;
    }

    if (!citations || !hindex || !i10index) {
      // Fallback: try to capture the three first std cells in stats table
      const stds = [...html.matchAll(/<td class="gsc_rsb_std">\s*([0-9,]+)\s*<\/td>/g)].map(x => x[1]);
      if (stds.length >= 3) {
        citations = citations || stds[0];
        hindex = hindex || stds[2] ? stds[2] : stds[1];
        i10index = i10index || stds[4] ? stds[4] : stds[2];
      }
    }

    const payload = {
      citations,
      hindex,
      i10index,
      lastUpdated: new Date().toISOString(),
      source: 'Google Scholar',
      sources: {
        citations: citations ? 'Google Scholar' : null,
        hindex: hindex ? 'Google Scholar' : null,
        i10index: i10index ? 'Google Scholar' : null
      }
    };

    CACHE = { data: payload, ts: now };

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify(payload)
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ error: err.message || "Failed to fetch" })
    };
  }
}
