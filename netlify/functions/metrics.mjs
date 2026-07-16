// CCWheelers GA4 → dashboard metrics. Zero-dep Netlify Function.
// Env: GA4_PROPERTY_ID, GSA_EMAIL, GSA_KEY. CDN-cached 1h.
import crypto from "node:crypto";

const b64url = (b) => Buffer.from(b).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

async function accessToken(email, pem) {
  const now = Math.floor(Date.now() / 1000);
  const h = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const c = b64url(JSON.stringify({ iss: email, scope: "https://www.googleapis.com/auth/analytics.readonly", aud: "https://oauth2.googleapis.com/token", iat: now, exp: now + 3600 }));
  const sig = crypto.createSign("RSA-SHA256").update(`${h}.${c}`).sign(pem);
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${h}.${c}.${b64url(sig)}`,
  });
  if (!res.ok) throw new Error(`token: ${res.status}`);
  return (await res.json()).access_token;
}

async function runReport(token, property, body) {
  const res = await fetch(`https://analyticsdata.googleapis.com/v1beta/properties/${property}:runReport`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`runReport: ${res.status} ${await res.text()}`);
  return res.json();
}
const rows = (r) => (r.rows || []).map((x) => ({ dims: (x.dimensionValues || []).map((d) => d.value), vals: (x.metricValues || []).map((m) => Number(m.value)) }));

export default async () => {
  const property = process.env.GA4_PROPERTY_ID, email = process.env.GSA_EMAIL, pem = (process.env.GSA_KEY || "").replace(/\\n/g, "\n");
  if (!property || !email || !pem) return Response.json({ sample: true, reason: "env vars not set" }, { headers: { "Cache-Control": "public, s-maxage=300" } });
  try {
    const token = await accessToken(email, pem);
    const range = { startDate: "30daysAgo", endDate: "today" };
    const [totals, events, pages, sources, cities, devices, pageTime] = await Promise.all([
      runReport(token, property, { dateRanges: [range], metrics: [{ name: "totalUsers" }, { name: "screenPageViews" }, { name: "averageSessionDuration" }] }),
      runReport(token, property, { dateRanges: [range], dimensions: [{ name: "eventName" }], metrics: [{ name: "eventCount" }],
        dimensionFilter: { filter: { fieldName: "eventName", inListFilter: { values: ["planner_use", "phone_call", "outbound_click", "gallery_open"] } } } }),
      runReport(token, property, { dateRanges: [range], dimensions: [{ name: "pagePath" }], metrics: [{ name: "screenPageViews" }],
        orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }], limit: 10 }),
      runReport(token, property, { dateRanges: [range], dimensions: [{ name: "sessionDefaultChannelGroup" }], metrics: [{ name: "sessions" }],
        orderBys: [{ metric: { metricName: "sessions" }, desc: true }], limit: 8 }),
      runReport(token, property, { dateRanges: [range], dimensions: [{ name: "city" }, { name: "region" }], metrics: [{ name: "totalUsers" }],
        orderBys: [{ metric: { metricName: "totalUsers" }, desc: true }], limit: 10 }),
      runReport(token, property, { dateRanges: [range], dimensions: [{ name: "deviceCategory" }], metrics: [{ name: "totalUsers" }],
        orderBys: [{ metric: { metricName: "totalUsers" }, desc: true }], limit: 4 }),
      runReport(token, property, { dateRanges: [range], dimensions: [{ name: "pagePath" }], metrics: [{ name: "userEngagementDuration" }, { name: "screenPageViews" }],
        orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }], limit: 10 }),
    ]);
    const ev = Object.fromEntries(rows(events).map((r) => [r.dims[0], r.vals[0]]));
    return Response.json({
      sample: false,
      period: "Last 30 days",
      updated: new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
      totals: {
        visitors: rows(totals)[0]?.vals[0] ?? 0,
        pageViews: rows(totals)[0]?.vals[1] ?? 0,
        plannerUses: ev.planner_use ?? 0,
        phoneCalls: ev.phone_call ?? 0,
        outboundClicks: ev.outbound_click ?? 0,
        galleryOpens: ev.gallery_open ?? 0,
        avgTimeSec: Math.round(rows(totals)[0]?.vals[2] ?? 0),
      },
      topPages: rows(pages).map((r) => ({ path: r.dims[0], views: r.vals[0] })),
      sources: rows(sources).map((r) => ({ name: r.dims[0], visitors: r.vals[0] })),
      locations: rows(cities).filter((r) => r.dims[0] && r.dims[0] !== "(not set)").map((r) => ({ name: r.dims[0] + (r.dims[1] && r.dims[1] !== "(not set)" ? ", " + r.dims[1] : ""), visitors: r.vals[0] })),
      devices: rows(devices).map((r) => ({ name: { desktop: "Computer", mobile: "Phone", tablet: "Tablet" }[r.dims[0]] || r.dims[0], visitors: r.vals[0] })),
      pageTime: rows(pageTime).filter((r) => r.vals[1] > 0).map((r) => ({ path: r.dims[0], seconds: Math.round(r.vals[0] / r.vals[1]) })),
    }, { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" } });
  } catch (err) {
    return Response.json({ sample: true, reason: String(err) }, { headers: { "Cache-Control": "public, s-maxage=300" } });
  }
};
export const config = { path: "/api/metrics" };
