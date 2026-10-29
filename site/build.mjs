// Zero-dependency static generator: node build.mjs -> dist/
import { readFileSync, writeFileSync, mkdirSync, readdirSync, statSync, existsSync, rmSync, renameSync, copyFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { site, sources, timeline, exteriors, interiors, places } from './content.mjs';

const ROOT = dirname(fileURLToPath(import.meta.url));
const DIST = join(ROOT, 'dist');
const PUB = join(ROOT, 'public');
const parcel = JSON.parse(readFileSync(join(ROOT, 'parcel.json'), 'utf8'));

// clean dist (the synced mount refuses unlink: rename instead)
if (existsSync(DIST)) {
  try { rmSync(DIST, { recursive: true, force: true }); }
  catch { renameSync(DIST, join(ROOT, '..', '..', '_work', '_to_delete', 'dist_' + Date.now())); }
}
const copyDir = (src, dst) => {
  mkdirSync(dst, { recursive: true });
  for (const e of readdirSync(src, { withFileTypes: true })) {
    const s = join(src, e.name), d = join(dst, e.name);
    if (e.isDirectory()) copyDir(s, d); else writeFileSync(d, readFileSync(s));
  }
};
copyDir(PUB, DIST);
mkdirSync(join(DIST, 'assets'), { recursive: true });
writeFileSync(join(DIST, 'assets', 'styles.css'), readFileSync(join(ROOT, 'src', 'styles.css')));
writeFileSync(join(DIST, 'assets', 'app.js'), readFileSync(join(ROOT, 'src', 'app.js')));

// JPEG dimensions read off the file — never typed
function jpegSize(file) {
  const b = readFileSync(file); let i = 2;
  while (i < b.length) {
    if (b[i] !== 0xff) { i++; continue; }
    const m = b[i + 1];
    if (m >= 0xc0 && m <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(m)) return { h: b.readUInt16BE(i + 5), w: b.readUInt16BE(i + 7) };
    i += 2 + b.readUInt16BE(i + 2);
  }
  throw new Error('no SOF in ' + file);
}
const M = (stem) => {
  const f = join(PUB, 'media', stem + '.jpg');
  const { w, h } = jpegSize(f);
  return { src: `/media/${stem}.jpg`, w, h };
};
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const img = (stem, alt, cls = '', eager = false) => {
  const m = M(stem);
  return `<img class="${cls}" src="${m.src}" width="${m.w}" height="${m.h}" alt="${esc(alt)}" ${eager ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async">`;
};
const tag = '<span class="tag">Conceptual rendering</span>';

const NAV = [['/', 'The Estate'], ['/interiors', 'Interiors'], ['/house', 'The Record'], ['/film', 'Film'], ['/location', 'Location']];
function page({ path, title, desc, og = 'r01_hero_aerial', body, extraHead = '', scripts = '' }) {
  const nav = NAV.map(([h, t]) => `<a href="${h}"${h === path ? ' aria-current="page"' : ''}>${t}</a>`).join('');
  return `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}">
<meta property="og:image" content="/media/${og}.jpg"><meta name="twitter:card" content="summary_large_image">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Manrope:wght@400;500;600&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/assets/styles.css">${extraHead}
</head><body>
<div class="disclosure" role="note">${esc(site.disclosure)}</div>
<header class="top"><a class="mark" href="/"><span class="mk-n">3620</span><span class="mk-t">Sweetwater Mesa</span></a>
<button class="menu" aria-expanded="false" aria-controls="nav">Menu</button>
<nav id="nav">${nav}</nav></header>
<main>${body}</main>
<footer class="foot"><div><p class="foot-a">${esc(site.address)}</p><p>${esc(site.study)}. Every image on this site is a conceptual rendering produced for this study; none is a photograph of the property. Facts are from the public record, cited on <a href="/house">The Record</a>.</p></div>
<p class="foot-s">Sceneset AI · Laguna Beach</p></footer>
<script src="/assets/app.js" defer></script>${scripts}
</body></html>`;
}
function write(route, html) {
  const dir = route === '/' ? DIST : join(DIST, route.replace(/^\//, ''));
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'index.html'), html);
}
const facts = site.facts.map(([k, v]) => `<div class="fact"><dt>${k}</dt><dd>${v}</dd></div>`).join('');

/* ------------------------------------------------------------- home */
write('/', page({
  path: '/', title: '3620 Sweetwater Mesa — Malibu',
  desc: 'A concept study of a fifteen-acre hilltop villa above Malibu Pier: conceptual renderings, a short film and the public record.',
  body: `
<section class="hero">
  <video class="hero-v" autoplay muted loop playsinline preload="auto" poster="/media/r01_hero_aerial.jpg" aria-label="Silent aerial loop of conceptual renderings of the estate"><source src="/media/hero.mp4" type="video/mp4"></video>
  <img class="hero-still" src="/media/r01_hero_aerial.jpg" alt="Conceptual rendering: aerial of the villa above the slope" width="${M('r01_hero_aerial').w}" height="${M('r01_hero_aerial').h}">
  <div class="hero-t"><p class="kick">Malibu · 34.037° N</p><h1>A villa on the mesa<br><em>above the pier.</em></h1><p class="hero-s">${tag} ${esc(site.study)}</p></div>
</section>
<section class="intro wrap">
  <div class="intro-l"><p class="lede">On a promontory west of Malibu Pier, a U-shaped Mediterranean house turns its back to the ridge and its terrace to the sea. Its roofs are clay tile; its garden runs down an axis to a pool with a rounded end; the slopes below are left to sage.</p>
  <p>This study renders the estate as it might be finished and furnished today. The building's footprint, roof form, orientation and grounds are taken from aerial imagery of the real site. Everything you see inside is proposed.</p></div>
  <dl class="facts">${facts}</dl>
</section>
<section class="band wrap">
  <h2 class="h2">The grounds, by bearing</h2>
  <p class="sub">Each view is labelled with the direction the camera faces. The house opens north to its motor court and south to the ocean.</p>
  <div class="grid ext">${exteriors.map((e, i) => `<figure class="card${i === 0 ? ' wide' : ''}"><div class="ph">${img(e.r, 'Conceptual rendering: ' + e.c)}<span class="brg">${e.b}</span></div><figcaption>${e.c} ${tag}</figcaption></figure>`).join('')}</div>
</section>
<section class="dn wrap">
  <h2 class="h2">From sun to blue hour</h2>
  <p class="sub">Drag to compare the same garden axis by day and after dusk.</p>
  <div class="slider" data-slider style="aspect-ratio:${M('r06_pool_day').w}/${M('r06_pool_day').h}">
    ${img('r07_pool_night_aligned', 'Conceptual rendering: the pool and villa at blue hour', 'sl-b')}
    <div class="sl-a">${img('r06_pool_day', 'Conceptual rendering: the pool and villa by day')}</div>
    <input type="range" min="0" max="100" value="50" aria-label="Compare day and night">
    <span class="sl-l">Day</span><span class="sl-r">Blue hour</span>
  </div>
  <figure class="card wide night">${img('r08_hero_night', 'Conceptual rendering: the estate from the air at blue hour')}<figcaption>The estate at blue hour. ${tag}</figcaption></figure>
</section>
<section class="cta wrap"><a class="btn" href="/film">Watch the film</a><a class="btn ghost" href="/interiors">Step inside</a></section>`,
}));

/* ------------------------------------------------------------- interiors */
write('/interiors', page({
  path: '/interiors', title: 'Interiors — 3620 Sweetwater Mesa', og: 'r10_great_room',
  desc: 'Concept interiors for 3620 Sweetwater Mesa Rd, Malibu — what they are based on, and what is real versus proposed.',
  body: `
<section class="ph-head wrap"><p class="kick">Interiors</p><h1 class="h1">Rooms that face the light</h1></section>
<section class="explainer wrap" id="about-these-interiors">
  <h2>About these interiors</h2>
  <p><strong>No photographs of this home's interiors are publicly available.</strong> The house was not formally listed when it changed hands in 2016 and 2017, and it sits on a private gated road. Every room on this page is therefore a <strong>conceptual rendering</strong> — an informed proposal, not a record of what is inside.</p>
  <div class="ex-cols">
    <div><h3>What they are based on</h3><ul>
      <li>The public record: 6 bedrooms, 8 bathrooms, 14,995 sq ft (Los Angeles County Assessor).</li>
      <li>The architecture visible from the air: a U-shaped villa of clay-tile hipped roofs around a planted courtyard, a south terrace and pool facing Malibu Pier.</li>
      <li>A Californian-Mediterranean palette chosen by this study: plaster, limestone, oak beams, iron and bronze.</li></ul></div>
    <div><h3>What is real</h3><ul><li>The building's footprint, roof form and orientation.</li><li>The pool, terraces, greens and courtyard.</li><li>The views toward the pier, the beach and the ridge.</li></ul></div>
    <div><h3>What is proposed</h3><ul><li>Every room's layout and position in the house.</li><li>Every finish, fixture and piece of furniture.</li><li>Ceiling heights, windows and doors shown inside. No floor plan was available.</li></ul></div>
  </div>
</section>
<section class="wrap rooms">${interiors.map((r, i) => `<figure class="room ${i % 2 ? 'r' : 'l'}"><div class="ph">${img(r.r, 'Conceptual rendering: ' + r.t + ' — ' + r.c)}</div><figcaption><h3>${r.t}</h3><p>${r.c}</p>${tag}</figcaption></figure>`).join('')}</section>`,
}));

/* ------------------------------------------------------------- the record */
write('/house', page({
  path: '/house', title: 'The Record — 3620 Sweetwater Mesa', og: 'r02_aerial_topdown',
  desc: 'Public-record facts, sale history and the real aerial for 3620 Sweetwater Mesa Rd, Malibu.',
  body: `
<section class="ph-head wrap"><p class="kick">The record</p><h1 class="h1">What is known</h1></section>
<section class="wrap rec">
  <dl class="facts big">${facts}</dl>
  <p class="note">Status: <strong>off market</strong>. The most recent recorded sale closed in spring 2017 at $69.9 million.</p>
</section>
<section class="wrap">
  <h2 class="h2">Timeline</h2>
  <ol class="tl">${timeline.map(([y, t]) => `<li><span class="y">${y}</span><span>${esc(t)}</span></li>`).join('')}</ol>
</section>
<section class="wrap">
  <h2 class="h2">The real site, and the rendering</h2>
  <p class="sub">Left of the handle: Esri World Imagery of the actual estate. Right: this study's conceptual rendering of the same frame. Drag to compare.</p>
  <div class="slider" data-slider style="aspect-ratio:${M('esri_house').w}/${M('esri_house').h}">
    ${img('r02_topdown_aligned', 'Conceptual rendering of the estate from directly above', 'sl-b')}
    <div class="sl-a">${img('esri_house', 'Satellite imagery of the estate (Esri World Imagery)')}</div>
    <input type="range" min="0" max="100" value="50" aria-label="Compare imagery and rendering">
    <span class="sl-l">Imagery</span><span class="sl-r">Rendering</span>
  </div>
  <p class="cred">Imagery: Esri, Maxar, Earthstar Geographics, and the GIS User Community.</p>
</section>
<section class="wrap src"><h2 class="h2">Sources</h2><ul>${sources.map(([what, who, url]) => `<li><span>${esc(what)}</span> — <a href="${url}" rel="noopener" target="_blank">${esc(who)}</a></li>`).join('')}</ul></section>`,
}));

/* ------------------------------------------------------------- film */
write('/film', page({
  path: '/film', title: 'Film — 3620 Sweetwater Mesa', og: 'r08_hero_night',
  desc: 'A short film of conceptual renderings of 3620 Sweetwater Mesa Rd, Malibu.',
  body: `
<section class="ph-head wrap"><p class="kick">Film · ${site.filmRuntime}</p><h1 class="h1">Golden hour to blue</h1></section>
<section class="wrap film"><video controls playsinline preload="metadata" poster="/media/r08_hero_night.jpg" style="aspect-ratio:16/9"><source src="/media/film.mp4" type="video/mp4"></video>
<p class="sub">Every shot is generated from this study's conceptual renderings; none is footage of the property. Score synthesised for this study.</p></section>`,
}));

/* ------------------------------------------------------------- location */
const mapData = { parcel: parcel.rings, places };
write('/location', page({
  path: '/location', title: 'Location — 3620 Sweetwater Mesa', og: 'r03_ocean_view',
  desc: 'Interactive map of 3620 Sweetwater Mesa Rd with the Los Angeles County assessor parcel outline.',
  extraHead: `\n<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" crossorigin="">`,
  scripts: `\n<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" crossorigin=""></script>\n<script>window.MAPDATA=${JSON.stringify(mapData)};</script>\n<script src="/assets/map.js" defer></script>`,
  body: `
<section class="ph-head wrap"><p class="kick">Location</p><h1 class="h1">Between the lagoon and the pier</h1></section>
<section class="wrap loc">
  <div id="map" class="map" aria-label="Interactive map"></div>
  <p class="cap">Outline: Los Angeles County Assessor parcel 4452-017-009 (${parcel.acres_polygon} acres by polygon area; recorded lot 15.74 acres). Approximate — not a survey. Click the map to enable scroll-zoom.</p>
  <ul class="plc">${places.map((p) => `<li><b>${esc(p.n)}</b> — ${esc(p.note)}</li>`).join('')}</ul>
  <figure class="card wide">${img('r03_ocean_view', 'Conceptual rendering: the view south-south-east from the terrace to Malibu Pier')}<figcaption>Looking south-south-east from the terrace. ${tag}</figcaption></figure>
</section>`,
}));
writeFileSync(join(DIST, 'assets', 'map.js'), readFileSync(join(ROOT, 'src', 'map.js')));
console.log('built', readdirSync(DIST).join(' '));
