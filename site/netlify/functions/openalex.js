let CACHE = { data: null, ts: 0 };
const TTL_MS = 12 * 60 * 60 * 1000; // 12 hours

export async function handler(event, context) {
  const orcid = "0000-0001-7646-1186";
  const url = `https://api.openalex.org/authors?filter=orcid:${encodeURIComponent(orcid)}`;
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
        "Accept": "application/json"
      }
    });
    if (!res.ok) {
      return {
        statusCode: res.status,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({ error: `Upstream error ${res.status}` })
      };
    }
    const data = await res.json();
    const author = data?.results?.[0];
    const citations = author?.summary_stats?.cited_by_count ?? author?.cited_by_count ?? null;
    const hindex = author?.summary_stats?.h_index ?? null;
    // OpenAlex does not provide i10-index directly; leave null
    const i10index = null;
    const payload = {
      citations,
      hindex,
      i10index,
      lastUpdated: new Date().toISOString(),
      source: "OpenAlex",
      sources: {
        citations: citations ? 'OpenAlex' : null,
        hindex: hindex ? 'OpenAlex' : null,
        i10index: i10index ? 'OpenAlex' : null
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
