// Lists the store's synced products from Printful so the merch page can
// render real products. The API key stays server-side; this returns only
// public-safe fields. Cached at the CDN for 10 minutes.
export default async (req) => {
  const key = process.env.PRINTFUL_API_KEY;
  if (!key) return err('PRINTFUL_API_KEY not configured', 500);

  const url = new URL(req.url);

  // Research helpers for setting up new products (variant IDs, colors/sizes,
  // print files, catalog options). Not used by the live merch page. Re-added
  // per HANDOFF.md for the Ruff Riders + stickers batch; removed again once
  // that ships (see HANDOFF.md for the standing agreement on this).
  const detailId = url.searchParams.get('detail');
  if (detailId) {
    const r = await fetch('https://api.printful.com/store/products/' + encodeURIComponent(detailId), {
      headers: { authorization: `Bearer ${key}` }
    });
    if (!r.ok) return err('Printful returned ' + r.status, 502);
    const d = await r.json();
    const sp = d.result?.sync_product;
    const variants = (d.result?.sync_variants || []).map(v => ({
      id: v.id,
      variant_id: v.variant_id,
      name: v.name,
      size: v.size,
      color: v.color,
      retail_price: v.retail_price,
      sku: v.sku,
      files: (v.files || []).map(f => ({ type: f.type, preview_url: f.preview_url }))
    }));
    return Response.json({ product: sp ? { id: sp.id, name: sp.name } : null, variants },
      { headers: { 'access-control-allow-origin': '*' } });
  }

  // Raw, unfiltered sync_variant payload for one product. Used to compare a
  // dashboard-created product against an API-created one when a product will
  // not transfer to the Quick Store.
  const rawId = url.searchParams.get('raw');
  if (rawId) {
    const r = await fetch('https://api.printful.com/store/products/' + encodeURIComponent(rawId), {
      headers: { authorization: `Bearer ${key}` }
    });
    if (!r.ok) return err('Printful returned ' + r.status, 502);
    const d = await r.json();
    return Response.json(d.result || d, { headers: { 'access-control-allow-origin': '*' } });
  }

  const catalogVariantId = url.searchParams.get('catalog');
  if (catalogVariantId) {
    const vr = await fetch('https://api.printful.com/products/variant/' + encodeURIComponent(catalogVariantId), {
      headers: { authorization: `Bearer ${key}` }
    });
    if (!vr.ok) return err('Printful returned ' + vr.status, 502);
    const vd = await vr.json();
    const productId = vd.result?.product?.id;
    if (!productId) return err('no product id for that variant', 502);

    const pr = await fetch('https://api.printful.com/products/' + productId, {
      headers: { authorization: `Bearer ${key}` }
    });
    const pd = await pr.json();
    const colors = [...new Set((pd.result?.variants || []).map(v => v.color))];
    const sizes = [...new Set((pd.result?.variants || []).map(v => v.size))];
    return Response.json({
      product: { id: pd.result?.product?.id, title: pd.result?.product?.title },
      colors,
      sizes,
      variant_count: (pd.result?.variants || []).length
    }, { headers: { 'access-control-allow-origin': '*' } });
  }

  const catalogProductId = url.searchParams.get('catalogFull');
  if (catalogProductId) {
    const pr = await fetch('https://api.printful.com/products/' + encodeURIComponent(catalogProductId), {
      headers: { authorization: `Bearer ${key}` }
    });
    if (!pr.ok) return err('Printful returned ' + pr.status, 502);
    const pd = await pr.json();
    const variants = (pd.result?.variants || []).map(v => ({ id: v.id, color: v.color, size: v.size, price: v.price }));
    return Response.json({ product: pd.result?.product?.title, variants },
      { headers: { 'access-control-allow-origin': '*' } });
  }

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
  // serve thumbnails through our own domain (see /pfimg proxy in netlify.toml)
  const thumb = p.thumbnail_url
    ? p.thumbnail_url.replace('https://files.cdn.printful.com/', '/pfimg/')
    : null;
  return { id: p.id, name: p.name, thumbnail: thumb };
}
function err(msg, status) {
  return Response.json({ error: msg }, { status, headers: { 'access-control-allow-origin': '*' } });
}

export const config = { path: '/api/merch' };
