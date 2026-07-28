# Dune Guide Network Ad Creative Standard

This contract applies to CCWheelers, Oregon Dunes Guide, Little Sahara Utah,
and Silver Lake Dune Guide. A creative prepared to this standard must be
portable between all four sites without redesign.

## Creative package for one advertiser

1. **Wide campaign artwork**
   - File: `business-slug-banner-1600x500.webp`
   - Canvas: 1600 x 500 pixels
   - Use: Premium Live Conditions and exclusive section sponsorships
   - Keep the main subject inside the center 70 percent of the canvas.
   - Do not burn essential copy, prices, phone numbers, or buttons into the
     image. The site supplies accessible live text over the artwork.

2. **Featured-listing photograph**
   - File: `business-slug-photo-1200x800.webp`
   - Canvas: 1200 x 800 pixels
   - Use: Tier Two directory and trip-planner placements
   - Show the real business, product, food, campsite, machine, or service.
   - Named places and businesses must use authentic photography supplied by
     the owner or imagery with a verified reuse license.

3. **Transparent logo**
   - File: `business-slug-logo-1000.png`
   - Canvas: 1000 x 1000 pixels
   - Transparent PNG with at least 80 pixels of clear padding on every side.
   - The mark must remain readable when displayed at 48 x 48 pixels.

## Text supplied separately

Every partner entry contains:

- business name;
- one concise tagline, ideally 45 to 75 characters;
- destination URL;
- phone number when useful;
- town and category;
- expiration date;
- accessible alternative text.

Do not place this information permanently inside the artwork. Keeping it as
live HTML makes the ad readable, responsive, searchable, trackable, and easy
to update without recreating the image.

## Mobile safe area

- Assume the wide image may crop by 15 percent from both sides.
- Keep faces, vehicles, products, and landmarks away from the outer edges.
- Avoid fine detail behind the live headline and call-to-action area.
- Test the finished placement at 390 pixels wide.

## Quality rules

- Destination-specific advertising uses recognizable, accurate scenery.
- No invented storefronts, landmarks, access points, or named campgrounds.
- Avoid repeated stock imagery across advertisers.
- Maintain strong contrast beneath all live text.
- Export photographic WebP files in sRGB at quality 82 to 88.
- Never upscale a weak source simply to satisfy the pixel dimensions.
- Paid links must retain `rel="sponsored"`.
- Every click must retain partner name, tier, placement, and page-path tracking.

## Runtime paths

The browser-facing path is always:

`images/partners/<filename>`

Projects that build from a `public` directory store the source file at:

`public/images/partners/<filename>`

The generated browser URL must still be `images/partners/<filename>`.

## Click attribution contract

Every paid and house-ad link must:

- open the destination website in a new tab;
- retain the required `rel="sponsored"` value for paid placements;
- add these UTM parameters without removing any parameters supplied by the
  advertiser:
  - `utm_source`: the originating guide domain;
  - `utm_medium=referral`;
  - `utm_campaign=dune_guide_partner`;
  - `utm_content`: the placement, such as `live_conditions`,
    `section_camping`, `directory_rentals`, or `trip_planner`;
- send a GA4 `partner_click` event for paid placements or a
  `house_ad_click` event for sister-guide placements;
- include partner name, tier, placement, originating page path, destination
  host, and destination URL in the event.
- also populate GA4's standard `link_url`, `link_domain`, and `outbound`
  parameters so dashboard reporting works without exposing or depending on
  advertiser-side analytics.

The owner dashboard should report:

- total clicks by advertiser;
- clicks by guide and destination town;
- clicks by placement and tier;
- the pages where clicks originated;
- click-through trends over time;
- sister-guide traffic separately from paid advertising.

No visitor name, trip details, confirmation number, or other personal planner
information may be included in advertising events.

## Acceptance check

Before an ad is approved:

- desktop and mobile crops preserve the subject;
- all live text remains readable;
- the logo is clear at 48 pixels;
- the link, phone number, and tracking event work;
- UTM attribution identifies the correct originating guide and placement;
- the image matches the advertised place or business;
- no important information exists only inside the image.
