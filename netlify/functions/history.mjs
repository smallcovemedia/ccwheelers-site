// GA4 → month-by-month history. Zero-dependency Netlify Function, serves /api/history.
// CCWheelers. Generated from Tools/Client Dashboard Kit/templates/history.mjs —
// edit the template and re-run the port script, not this copy.
//
// Same env vars as metrics.mjs: GA4_PROPERTY_ID / GSA_EMAIL / GSA_KEY.
//
// Why this is cheap: the `yearMonth` dimension buckets EVERY month in one
// report, so all of history costs 2-3 API calls no matter how many months
// pile up. Nothing is stored anywhere — GA4 is the storage layer. The one
// dial that matters is the property's Data Retention setting: set it to
// 14 months in GA4 Admin, or months quietly fall off the back.

const CONFIG = {
  // Revenue-action events to track per month. Must match metrics.mjs.
  events: ["planner_use", "phone_call", "outbound_click", "gallery_open"],
  // Optional "count the pageviews of a page" metrics, e.g. a thank-you page
  // standing in for leads: { leads: "thank-you" } matches pagePath CONTAINS.
  pageCounts: {},
  timezone: "America/Los_Angeles", // property timezone; month buckets follow it
};

import crypto from "node:crypto";

const b64url = (b) =>
  Buffer.from(b).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

async function accessToken(email, pem) {
  const now = Math.floor(Date.now() / 1000);
  const h = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const c = b64url(JSON.stringify({
    iss: email,
    scope: "https://www.googleapis.com/auth/analytics.readonly",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  }));
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
  const res = await fetch(
    `https://analyticsdata.googleapis.com/v1beta/properties/${property}:runReport`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }
  );
  if (!res.ok) throw new Error(`runReport: ${res.status} ${await res.text()}`);
  return res.json();
}

const rows = (r) => (r.rows || []).map((x) => ({
  dims: (x.dimensionValues || []).map((d) => d.value),
  vals: (x.metricValues || []).map((m) => Number(m.value)),
}));

// "202607" -> { key: "2026-07", label: "Jul 2026" }
const monthMeta = (ym) => ({
  key: `${ym.slice(0, 4)}-${ym.slice(4, 6)}`,
  label: new Date(Date.UTC(Number(ym.slice(0, 4)), Number(ym.slice(4, 6)) - 1, 1))
    .toLocaleDateString("en-US", { month: "short", year: "numeric", timeZone: "UTC" }),
});

export default async () => {
  const property = process.env.GA4_PROPERTY_ID;
  const email = process.env.GSA_EMAIL;
  const pem = (process.env.GSA_KEY || "").replace(/\\n/g, "\n");

  if (!property || !email || !pem) {
    return Response.json(
      { sample: true, months: [], reason: "GA4 env vars not set on this Netlify site yet" },
      { headers: { "Cache-Control": "public, s-maxage=300" } }
    );
  }

  try {
    const token = await accessToken(email, pem);
    // Wide-open start: GA4 only returns months that actually have data, so
    // history begins on its own the day the tag went live.
    const range = { startDate: "2020-01-01", endDate: "today" };
    const pageKeys = Object.keys(CONFIG.pageCounts || {});

    const [traffic, events, ...pageReports] = await Promise.all([
      runReport(token, property, {
        dateRanges: [range],
        dimensions: [{ name: "yearMonth" }],
        metrics: [{ name: "totalUsers" }, { name: "screenPageViews" }],
        orderBys: [{ dimension: { dimensionName: "yearMonth" } }],
        limit: 200,
      }),
      runReport(token, property, {
        dateRanges: [range],
        dimensions: [{ name: "yearMonth" }, { name: "eventName" }],
        metrics: [{ name: "eventCount" }],
        dimensionFilter: { filter: { fieldName: "eventName", inListFilter: { values: CONFIG.events } } },
        limit: 2000,
      }),
      ...pageKeys.map((k) => runReport(token, property, {
        dateRanges: [range],
        dimensions: [{ name: "yearMonth" }],
        metrics: [{ name: "screenPageViews" }],
        dimensionFilter: {
          filter: { fieldName: "pagePath", stringFilter: { matchType: "CONTAINS", value: CONFIG.pageCounts[k] } },
        },
        limit: 200,
      })),
    ]);

    // Which month is still accruing? Compare against "now" in the property timezone.
    const nowKey = new Date()
      .toLocaleDateString("en-CA", { timeZone: CONFIG.timezone, year: "numeric", month: "2-digit" })
      .slice(0, 7);

    const byMonth = new Map();
    for (const r of rows(traffic)) {
      if (!/^\d{6}$/.test(r.dims[0])) continue;
      const { key, label } = monthMeta(r.dims[0]);
      byMonth.set(key, {
        key,
        label,
        partial: key === nowKey,
        visitors: r.vals[0],
        pageviews: r.vals[1],
        ...Object.fromEntries(pageKeys.map((k) => [k, 0])),
        events: Object.fromEntries(CONFIG.events.map((e) => [e, 0])),
      });
    }
    for (const r of rows(events)) {
      if (!/^\d{6}$/.test(r.dims[0])) continue;
      const m = byMonth.get(monthMeta(r.dims[0]).key);
      if (m) m.events[r.dims[1]] = r.vals[0];
    }
    pageReports.forEach((rep, i) => {
      for (const r of rows(rep)) {
        if (!/^\d{6}$/.test(r.dims[0])) continue;
        const m = byMonth.get(monthMeta(r.dims[0]).key);
        if (m) m[pageKeys[i]] = (m[pageKeys[i]] || 0) + r.vals[0];
      }
    });

    const months = [...byMonth.values()].sort((a, b) => a.key.localeCompare(b.key));

    return Response.json(
      { sample: false, events: CONFIG.events, months },
      { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" } }
    );
  } catch (err) {
    return Response.json(
      { sample: true, months: [], reason: String(err) },
      { headers: { "Cache-Control": "public, s-maxage=300" } }
    );
  }
};

export const config = { path: "/api/history" };
