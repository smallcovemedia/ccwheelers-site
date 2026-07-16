# CCWheelers.com — Site Conventions

Public info site for Oceano Dunes SVRA, run by Central Coast Wheelers (a father-son team: Mike and Logan). Read this before changing anything.

## How this site works

- **Plain static HTML/CSS/JS. No frameworks, no build step.** Every page is a self-contained `.html` file. Keep it that way — do not introduce React, bundlers, npm builds, or TypeScript.
- **Deploys are automatic.** Pushing to `main` on GitHub deploys to ccwheelers.com via Netlify in ~1 minute. NEVER run `netlify deploy` manually; git push is the only deploy path.
- **Serverless functions** live in `netlify/functions/` (`gas.mjs` = AAA gas prices at `/api/gas`, `metrics.mjs` = dashboard data). They run on Netlify, not in the browser. API keys live in Netlify environment variables, never in this repo.

## Design system (do not deviate)

- Colors are CSS variables, defined in `site.css` and inline on `index.html`/`map.html`:
  `--sand #f5ede0 · --sand-deep #e8dcc8 · --dune #d9a55b · --dune-dark #b57f3a · --ocean #0e3a4d · --ocean-deep #092835 · --sunset #e26d3a · --sunset-hot #d4552a · --ink #1d2a30 · --ink-soft #4a5b63`
  The logo orange is `--sunset-hot`. Never hardcode new colors; use the variables.
- Fonts: **Barlow Condensed** (headings, uppercase) + **Inter** (body), loaded from Google Fonts.
- Interior pages share `site.css`. `index.html` and `map.html` carry their own inline CSS — a change to shared components (header, nav, footer, buttons) must be applied in all three places.
- Icons are inline SVG emblems (stroke style, brand colors) — no emoji in UI, no icon fonts, no external icon CDNs.
- Buttons: `.btn .btn-primary` (orange pill) / `.btn-ghost`. Cards: `.card`. Section rhythm: `.eyebrow` label → `.section-title` → `.lede`.

## Structure

- Header/nav and footer are duplicated in every HTML file. Changing a nav item means editing **all** pages (there are 18+). Keep nav order and the "More" dropdown structure identical everywhere.
- `conditions.js` — live conditions engine (NOAA tides + creek estimate + news band). The creek override block at the top is intentionally simple so a human can flip `auto`/`open`/`caution`/`closed`.
- `news-data.js` — the news feed data. A scheduled job refreshes it daily; manual entries go at the top of the array.
- `images/` — all photos, pre-optimized JPGs ≤ ~200KB. Optimize before adding (max 1400px wide, quality ~80). `og-image.jpg` is the social link-preview card.
- `netlify.toml` — redirects (including legacy `mobile/*` URLs) and security headers. Do not remove redirects; old inbound links depend on them.

## Content rules

- Voice: experienced local rider giving straight answers. Plain English, short sentences, no marketing fluff.
- **Never use em dashes in site copy.** Write around them.
- Facts about park rules (fees, hours, fire rules, creek policy) must match official State Parks info; when unsure, say "confirm with rangers at (805) 473-7220" rather than guessing.
- Every page keeps its `<title>`, meta description, canonical link, and og: tags. New pages need all of these plus an entry in `sitemap.xml` and the footer/nav.

## Workflow rules

- Pull before you start. Small text fixes can go straight to `main`.
- **Bigger changes (layout, new features, new pages): work on a branch and open a pull request** — Netlify builds a preview URL for every PR so it can be checked before merge. Logan merges.
- After any change, verify locally by opening the HTML file in a browser (mobile width too — most traffic is phones), and check that no other page broke if you touched `site.css` or `nav.js`.
- If something on the live site breaks: Netlify → Deploys → pick the last good deploy → "Publish deploy" rolls back instantly.
