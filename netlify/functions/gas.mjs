// Fetches AAA's California gas price page server-side and returns the
// San Luis Obispo county metro averages (current + trend rows) as JSON.
// Cached at the CDN for 6 hours so AAA only sees a few requests a day.
export default async () => {
  try {
    const res = await fetch('https://gasprices.aaa.com/?state=CA', {
      headers: { 'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) ccwheelers.com conditions widget' }
    });
    if (!res.ok) return err('AAA returned ' + res.status);
    const html = await res.text();

    const i = html.indexOf('San Luis Obispo-Atascadero-Paso Robles');
    if (i === -1) return err('metro section not found');
    const chunk = html.slice(i, i + 3500);

    const ROWS = [
      ['current', 'Current Avg'],
      ['yesterday', 'Yesterday Avg'],
      ['weekAgo', 'Week Ago Avg'],
      ['monthAgo', 'Month Ago Avg'],
      ['yearAgo', 'Year Ago Avg']
    ];
    const out = {};
    for (const [key, label] of ROWS) {
      const j = chunk.indexOf(label);
      if (j === -1) continue;
      const prices = chunk.slice(j, j + 400).match(/\$([0-9]\.[0-9]{2,3})/g);
      if (prices && prices.length >= 4) {
        const [regular, mid, premium, diesel] = prices.map(p => parseFloat(p.slice(1)));
        out[key] = { regular, mid, premium, diesel };
      }
    }
    if (!out.current) return err('current prices not found');

    return Response.json(
      {
        metro: 'San Luis Obispo County',
        // kept for the homepage widget
        regular: out.current.regular,
        diesel: out.current.diesel,
        ...out,
        source: 'AAA Gas Prices',
        fetched: new Date().toISOString()
      },
      {
        headers: {
          'cache-control': 'public, max-age=0, s-maxage=21600',
          'access-control-allow-origin': '*'
        }
      }
    );
  } catch (e) {
    return err(String(e));
  }
};

function err(msg) {
  return Response.json({ error: msg }, { status: 502, headers: { 'access-control-allow-origin': '*' } });
}

export const config = { path: '/api/gas' };
