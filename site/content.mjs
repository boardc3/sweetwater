// Every number here traces to research/research.md (F-numbers in comments).
export const site = {
  title: '3620 Sweetwater Mesa',
  address: '3620 Sweetwater Mesa Rd, Malibu, CA 90265',
  study: 'A Sceneset AI concept study',
  disclosure: 'Unaffiliated concept study by Sceneset AI. Not a listing; the home is off market. All images are conceptual renderings, not photographs.',
  facts: [
    ['Bedrooms', '6', 'F4'], ['Bathrooms', '8', 'F4'], ['Living area', '14,995 sq ft', 'F5'],
    ['Lot', '15.74 acres', 'F6'], ['Year built', '1991', 'F3'], ['APN', '4452-017-009', 'F1'],
  ],
  filmRuntime: '1:12',
};

export const sources = [
  ['Bedrooms / bathrooms / living area / year built / APN', 'Los Angeles County Assessor parcel layer (2026 roll)', 'https://public.gis.lacounty.gov/public/rest/services/LACounty_Cache/LACounty_Parcel/MapServer/0'],
  ['Lot 15.74 acres; status off market', 'Redfin property record, read 2026-10-29', 'https://www.redfin.com/CA/Malibu/3620-Sweetwater-Mesa-Rd-90265/home/6853349'],
  ['2016 and 2017 sales; grounds', 'The Real Deal, Apr 10 2017', 'https://therealdeal.com/la/2017/04/10/malibu-mansion-trades-for-69-9m-setting-new-record'],
  ['2017 ranking', 'The Real Deal, Dec 27 2017', 'https://therealdeal.com/la/2017/12/27/las-priciest-residential-sales-in-2017/'],
  ['2014 settlement', 'U.S. Department of Justice, Oct 10 2014', 'https://www.justice.gov/opa/pr/second-vice-president-equatorial-guinea-agrees-relinquish-more-30-million-assets-purchased'],
];

export const timeline = [
  ['1991', 'House built (assessor year built).', 'F3'],
  ['2014', 'A U.S. Department of Justice settlement requires the Malibu mansion to be sold.', 'F11'],
  ['2016', 'Sold by the Justice Department for $38 million — closed.', 'F8'],
  ['2017', 'Renovated, then resold in the spring for $69.9 million — closed. Third-priciest residential sale in Los Angeles that year, per The Real Deal.', 'F9'],
  ['2026', 'Off market. No active listing.', 'F7'],
];

// r = file stem in public/media ; b = bearing chip ; c = caption
export const exteriors = [
  { r: 'r01_hero_aerial', b: 'Looking NNW', c: 'The villa on its promontory, from above the south slope.' },
  { r: 'r03_ocean_view', b: 'Looking SSE', c: 'From the south terrace: the pool, Surfrider Beach and Malibu Pier.' },
  { r: 'r04_motor_court', b: 'Looking S', c: 'The north motor court and its round fountain, where the U opens.' },
  { r: 'r05_courtyard', b: 'Looking S', c: 'Inside the U: the planted courtyard.' },
  { r: 'r06_pool_day', b: 'Looking N', c: 'Up the garden axis from the end of the pool.' },
  { r: 'r15_loggia', b: 'Looking S', c: 'The south loggia, framed on the sea.' },
];

export const interiors = [
  { r: 'r09_entry_hall', t: 'Entry hall', c: 'Double-height hall, curved limestone stair, iron balustrade.' },
  { r: 'r10_great_room', t: 'Great room', c: 'Beamed ceiling, arched doors to the loggia and the sea.' },
  { r: 'r11_dining', t: 'Dining room', c: 'Plaster vault, a table for twelve, windows to the courtyard.' },
  { r: 'r12_kitchen', t: 'Kitchen', c: 'Sage-painted oak, zellige, an arched window over the sink.' },
  { r: 'r13_primary_suite', t: 'Primary suite', c: 'Whitewashed trusses and a balcony toward the Pacific.' },
  { r: 'r14_primary_bath', t: 'Primary bath', c: 'Tadelakt, travertine and a stone tub under one arched window.' },
];

export const places = [
  { n: '3620 Sweetwater Mesa Rd', lat: 34.037079, lon: -118.679806, k: 'home', note: 'Esri geocode (PointAddress)' },
  { n: 'Malibu Pier', lat: 34.037109, lon: -118.676695, k: 'poi', note: 'seen from the south terrace' },
  { n: 'Surfrider Beach', lat: 34.0356, lon: -118.6785, k: 'poi', note: 'the crescent of sand below the estate' },
  { n: 'Malibu Lagoon State Beach', lat: 34.033642, lon: -118.680458, k: 'poi', note: 'west of the promontory' },
];
