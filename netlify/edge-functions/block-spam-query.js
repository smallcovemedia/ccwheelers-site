const ALLOWED_QUERY_KEYS = new Set([
  "dclid",
  "fbclid",
  "gad_source",
  "gbraid",
  "gclid",
  "li_fat_id",
  "mc_cid",
  "mc_eid",
  "msclkid",
  "ref",
  "source",
  "twclid",
  "wbraid",
]);

function isAllowedQueryKey(key) {
  return key.toLowerCase().startsWith("utm_") ||
    ALLOWED_QUERY_KEYS.has(key.toLowerCase());
}

export default function blockSpamQuery(request) {
  const url = new URL(request.url);

  if (!["/", "/index.html"].includes(url.pathname) || !url.search) return;

  const queryKeys = [...url.searchParams.keys()];
  if (queryKeys.length === 0 || queryKeys.every(isAllowedQueryKey)) return;

  const body = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="robots" content="noindex, nofollow">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Page removed | CCWheelers</title>
  </head>
  <body>
    <main>
      <h1>This page is gone.</h1>
      <p>The requested address was not a valid CCWheelers page.</p>
      <p><a href="/">Visit the CCWheelers homepage</a></p>
    </main>
  </body>
</html>`;

  return new Response(request.method === "HEAD" ? null : body, {
    status: 410,
    headers: {
      "Cache-Control": "public, max-age=3600",
      "Content-Type": "text/html; charset=utf-8",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}

export const config = {
  path: ["/", "/index.html"],
};
