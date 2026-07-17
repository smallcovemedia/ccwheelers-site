// Lists the store's synced products from Printful so the merch page can
// render real products. The API key stays server-side; this returns only
// public-safe fields. Cached at the CDN for 10 minutes.
export default async () => {
  const key = process.env.PRINTFUL_API_KEY;
  if (!key) return err('PRINTFUL_API_KEY not configured', 500);

  try {
    // store metadata (type tells us which checkout route exists)
    let store = null;
    try {
      const sr = await fetch('https://api.printful.com/stores', {
        headers: { authorization: `Bearer ${key}` }
      });
      if (sr.ok) {
        const sd = await sr.json();
        const s = (sd.result || [])[0];
        if (s) store = { name: s.name, type: s.type, website: s.website || null };
      }
    } catch {}

    const res = await fetch('https://api.printful.com/store/products?limit=50', {
      headers: { authorization: `Bearer ${key}` }
    });
    if (!res.ok) return err('Printful returned ' + res.status, 502);
    const data = await res.json();
    const list = (data.result || []).filter(p => !p.is_ignored);

    // fetch variant details (for prices) per product, capped to keep it quick
    const detailed = await Promise.all(list.slice(0, 24).map(async p => {
      try {
        const r = await fetch('https://api.printful.com/store/products/' + p.id, {
          headers: { authorization: `Bearer ${key}` }
        });
        if (!r.ok) return base(p);
        const d = await r.json();
        const variants = d.result?.sync_variants || [];
        const prices = variants.map(v => parseFloat(v.retail_price)).filter(n => !isNaN(n));
        return {
          ...base(p),
          price_min: prices.length ? Math.min(...prices) : null,
          currency: variants[0]?.currency || 'USD',
          variant_count: variants.length,
          external_url: variants[0]?.product?.external_url || null
        };
      } catch { return base(p); }
    }));

    return Response.json(
      { store, count: detailed.length, products: detailed, fetched: new Date().toISOString() },
      { headers: { 'cache-control': 'public, max-age=0, s-maxage=600', 'access-control-allow-origin': '*' } }
    );
  } catch (e) {
    return err(String(e), 502);
  }
};

function base(p) {
  return { id: p.id, name: p.name, thumbnail: p.thumbnail_url || null };
}
function err(msg, status) {
  return Response.json({ error: msg }, { status, headers: { 'access-control-allow-origin': '*' } });
}

export const config = { path: '/api/merch' };
