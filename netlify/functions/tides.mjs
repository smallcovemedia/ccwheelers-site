// Proxies NOAA tide predictions (Port San Luis, station 9412110) through
// our own domain so the CDN can keep serving the last successful response
// if NOAA's predictions API has an outage, instead of every visitor
// hitting a dead endpoint and seeing "unavailable" at once. Predictions
// are a fixed harmonic calculation for a given date range, so a cached
// response never really goes stale, it's safe to serve for weeks.
export default async (req) => {
  const params = new URL(req.url).searchParams;
  const begin = params.get('begin_date');
  const end = params.get('end_date');
  if (!begin || !end) return err('begin_date and end_date are required', 400);

  const station = params.get('station') || '9412110';
  const interval = params.get('interval');

  const noaaUrl = 'https://api.tidesandcurrents.noaa.gov/api/prod/datagetter' +
    '?product=predictions&application=ccwheelers&datum=MLLW&station=' + encodeURIComponent(station) +
    '&time_zone=lst_ldt&units=english&format=json' +
    (interval ? '&interval=' + encodeURIComponent(interval) : '') +
    '&begin_date=' + encodeURIComponent(begin) + '&end_date=' + encodeURIComponent(end);

  try {
    const res = await fetch(noaaUrl);
    const data = await res.json();
    if (!res.ok || data.error || !data.predictions) {
      return err((data && data.error && data.error.message) || 'NOAA returned no predictions', 502);
    }
    return Response.json(data, {
      headers: {
        'cache-control': 'public, max-age=0, s-maxage=21600, stale-while-revalidate=86400, stale-if-error=2592000',
        'access-control-allow-origin': '*'
      }
    });
  } catch (e) {
    return err(String(e), 502);
  }
};

function err(msg, status) {
  return Response.json({ error: { message: msg } }, { status, headers: { 'access-control-allow-origin': '*' } });
}

export const config = { path: '/api/tides' };
