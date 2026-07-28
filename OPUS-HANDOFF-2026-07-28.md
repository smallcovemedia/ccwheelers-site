# Dune Guide Network — Opus Handoff

Date: July 28, 2026  
Status: Local work only. **Do not deploy until Michael reviews the complete batch.**

## Non-negotiable visual direction

- These are sister sites in one premium Dune Guide network.
- Named places must use authentic place-specific photography. Never use a made-up town, lake, campground, or landmark for a named location.
- Tiles, feature cards, and empty-looking text blocks should use relevant photography with readable dark/opaque overlays.
- Avoid repetitive images and images unrelated to the adjacent copy.
- Generated imagery is acceptable for generic concepts only; named locations require an authentic, license-compatible source with attribution.
- Keep the shared cream, deep green/blue, warm orange, and gold visual language.
- Logos must remain transparent and readable. Glow belongs behind the landscape/icon portion, not across the name.
- Mobile readability matters: small labels, URLs, and supporting text must remain legible on a phone.

## Advertising architecture

The ad system is a showcase-first fallback system:

1. A paying local business always replaces the house ad assigned to its slot.
2. When no local business is assigned, the slot must still show a polished visual house ad—never an empty placeholder.
3. The position directly below **Live Conditions** always shows **Dune Guide USA**, unless that premium slot is sold.
4. Other unsold positions show the individual dune destinations (CCWheelers, Oregon Dunes Guide, Little Sahara Utah, or Silver Lake).
5. Paid ads must remain honestly labeled and retain `rel="sponsored"`.
6. House ads remain ordinary `noopener` links.
7. All clicks retain UTM attribution and GA4 `house_ad_click` / `partner_click` tracking.

Shared banner contract:

- 1600 × 500 WebP
- full-bleed artwork
- readable on desktop and mobile
- five files in each site's house-ad folder:
  - `ccwheelers-banner-1600x500.webp`
  - `oregon-dunes-guide-banner-1600x500.webp`
  - `little-sahara-guide-banner-1600x500.webp`
  - `silver-lake-guide-banner-1600x500.webp`
  - `dune-guide-usa-banner-1600x500.webp`

The verified Silver Lake Live Conditions fallback currently resolves to:

- image: `images/partners/house/dune-guide-usa-banner-1600x500.webp`
- natural size: 1600 × 500
- destination: `https://duneguideusa.com/`
- UTM campaign: `network_hub`
- UTM content: `live_conditions`

## Files changed for ads

- CCWheelers: `partners.js`, `index.html`, `images/partners/house/*`
- Oregon Dunes Guide: `static/partners.js`, `public/static/partners.js`, both house-ad asset folders
- Little Sahara: `static/partners.js`, `static/style.css`, `public/images/partners/house/*`
- Silver Lake: `static/partners.js`, `static/style.css`, `images/partners/house/*`

Important: an earlier bulk edit duplicated the `if (h.banner)` line four times. It has now been reduced to one line in all five partner scripts, and all five scripts passed `node --check`.

CCWheelers had visual-ad CSS accidentally appended after `</html>`. It has been moved into the page's `<style>` block. Do not re-append CSS after the document.

## OG images and favicons completed

Little Sahara:

- 22 HTML pages have unique 1200 × 630 OG images in `og/`.
- 22/22 OG tags existed and all referenced files existed at validation time.
- favicon package: `favicon-48.png`, `favicon-192.png`, `favicon-512.png`, `apple-touch-icon.png`, `favicon.ico`.

Silver Lake:

- 24 unique 1200 × 630 OG images in `og/`.
- `scripts/build-pages.mjs` generates page-specific `/og/${page.slug}.jpg`.
- `planner.jpg` was also copied to `trip-planner.jpg` for the public slug.
- 24/24 OG tags existed and all referenced files existed at validation time.
- favicon package completed.

Dune Guide USA:

- `og/home.jpg`
- `duneguideusa-logo.png`
- complete favicon package
- `site.webmanifest`
- homepage OG/Twitter metadata wired
- 404 intentionally has no OG image.

## Build state

Immediately before handoff:

- Silver Lake page build succeeded: 23 generated pages plus sitemap/robots.
- Little Sahara page build succeeded: 21 generated pages plus sitemap/robots.
- A follow-up test command used the wrong guessed path (`tests/run-tests.mjs`) and therefore did not run. This is not a product failure. Inspect `package.json` or the existing test filename and run the repository's actual direct Node test entrypoint.
- Earlier in this work session, the correct direct tests passed 20/20 for Silver Lake and 19/19 for Little Sahara.
- Do not use `pnpm run test` if it delegates to unavailable `npm`; call the actual Node test file with the bundled Node runtime.

Useful bundled runtimes:

- Node: `C:\Users\micha\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe`
- Python: `C:\Users\micha\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe`
- Git: `C:\Users\micha\.cache\codex-runtimes\codex-primary-runtime\dependencies\native\git\cmd\git.exe`

## Finish checklist

1. Inspect the actual test commands in both `package.json` files and rerun the correct direct tests.
2. Re-run `node --check` on every partner script after any edits.
3. Preview representative desktop and phone widths for all four sites:
   - Dune Guide USA banner directly below Live Conditions.
   - at least one section sponsor fallback.
   - at least one directory/featured fallback.
   - paid entry replacing the house ad when a valid listing is temporarily supplied.
4. Confirm every intentional ad container is filled. Do not add ads to safety/emergency content unless Michael specifically requests a slot there.
5. Confirm all banner images load at 1600 × 500 and no CSS forces them into a distorted crop.
6. Confirm outbound URLs keep their original UTM source and gain the correct `utm_content`.
7. Confirm there is no remaining `network-master` folder inside Silver Lake. It was removed as obsolete.
8. Update this handoff with final verification results.
9. Do not deploy or push until Michael explicitly says to do so.

## User's immediate intent

Michael clarified:

> The local businesses will replace our ads. Our ads are just there to show how good it can look.

Honor that exactly. The house creative is the polished default; it is not meant to block or compete with sold local inventory.
