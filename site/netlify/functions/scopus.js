let CACHE = { data: null, ts: 0 };
const TTL_MS = 12 * 60 * 60 * 1000; // 12 hours

export async function handler(event, context) {
  const scopusAuthorId = "57210440609";
  const openAlexUrl = `https://api.openalex.org/authors?filter=ids:SCOPUS:${encodeURIComponent(scopusAuthorId)}`;
  try {
    const now = Date.now();
    if (CACHE.data && now - CACHE.ts < TTL_MS) {
      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify(CACHE.data)
      };
    }

    // Prefer OpenAlex (no key, public) as a proxy for Scopus-like metrics
    const res = await fetch(openAlexUrl, { headers: { Accept: "application/json" } });
    if (!res.ok) {
      return { statusCode: res.status, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }, body: JSON.stringify({ error: `Upstream error ${res.status}` }) };
    }
    const data = await res.json();
    const author = data?.results?.[0];
    const citations = author?.summary_stats?.cited_by_count ?? author?.cited_by_count ?? null;
    const hindex = author?.summary_stats?.h_index ?? null;

    const payload = {
      citations,
      hindex,
      lastUpdated: new Date().toISOString(),
      source: 'OpenAlex (via Scopus id)',
      sources: {
        citations: citations ? 'OpenAlex (Scopus)' : null,
        hindex: hindex ? 'OpenAlex (Scopus)' : null
      }
    };
    CACHE = { data: payload, ts: now };

    return { statusCode: 200, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }, body: JSON.stringify(payload) };
  } catch (err) {
    return { statusCode: 500, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }, body: JSON.stringify({ error: err.message || 'Failed to fetch' }) };
  }
}
