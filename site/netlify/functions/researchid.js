let CACHE = { data: null, ts: 0 };
const TTL_MS = 12 * 60 * 60 * 1000; // 12 hours

export async function handler(event, context) {
  const url = "https://researchid.co/nirojdahal";
  try {
    const now = Date.now();
    if (CACHE.data && now - CACHE.ts < TTL_MS) {
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

    // Attempt to parse common metric labels if present on ResearchID.co
    let citations = null, hindex = null, i10index = null;

    const pairs = [...html.matchAll(/<div[^>]*class=["'][^"']*(?:metric|stat)[^"']*["'][^>]*>\s*<[^>]+>\s*([^<:]+?)\s*:?\s*<\/[^>]+>\s*<[^>]+>\s*([0-9,]+)\s*<\/[\s\S]*?div>/gi)];
    for (const m of pairs) {
      const label = (m[1] || '').trim().toLowerCase();
      const value = (m[2] || '').trim();
      if (!citations && label.includes('citation')) citations = value;
      if (!hindex && (label.includes('h-index') || label === 'h index' || label === 'hindex')) hindex = value;
      if (!i10index && label.includes('i10')) i10index = value;
    }

    // Generic label/value fallback
    if (!citations || !hindex || !i10index) {
      const generic = [...html.matchAll(/<[^>]*>(Citations|h-index|i10-index)<\/[^>]*>\s*<[^>]*>([0-9,]+)<\/[^>]*>/gi)];
      for (const m of generic) {
        const label = (m[1] || '').toLowerCase();
        const value = (m[2] || '').trim();
        if (label === 'citations' && !citations) citations = value;
        if (label === 'h-index' && !hindex) hindex = value;
        if (label === 'i10-index' && !i10index) i10index = value;
      }
    }

    const payload = {
      citations,
      hindex,
      i10index,
      lastUpdated: new Date().toISOString(),
      source: 'ResearchID.co',
      sources: {
        citations: citations ? 'ResearchID.co' : null,
        hindex: hindex ? 'ResearchID.co' : null,
        i10index: i10index ? 'ResearchID.co' : null
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
