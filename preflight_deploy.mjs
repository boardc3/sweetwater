#!/usr/bin/env node
/**
 * preflight_deploy.mjs — run before handing any Renderer site to Vercel.
 *
 *   node preflight_deploy.mjs /path/to/repo
 *
 * Reads the repo's root vercel.json, runs the EXACT installCommand and
 * buildCommand Vercel will run against a clean copy in /tmp, then asserts the
 * result is actually servable. Catches every cause of the recurring
 * `404: NOT_FOUND` on first deploy.
 *
 * Exit 0 = safe to push. Exit 1 = it would have 404'd.
 */
import { execSync } from 'node:child_process';
import {
  existsSync, readFileSync, readdirSync, statSync, mkdtempSync, cpSync, rmSync,
} from 'node:fs';
import { join, relative } from 'node:path';
import { tmpdir } from 'node:os';

const repo = process.argv[2] || process.cwd();
let fails = 0;
const ok = (m) => console.log(`  ok    ${m}`);
const bad = (m) => { console.log(`  FAIL  ${m}`); fails++; };
const head = (m) => console.log(`\n${m}`);

console.log(`preflight_deploy — ${repo}`);

/* ---------------------------------------------------------- 1. root config */
head('1. root vercel.json');
const cfgPath = join(repo, 'vercel.json');
if (!existsSync(cfgPath)) {
  bad('no vercel.json at the repository root. Vercel will build from the root, '
    + 'find no package.json, and serve a 404. Copy _templates/vercel.root.json.');
  console.log(`\n>>> ${fails} FAILURE(S)`);
  process.exit(1);
}
const cfg = JSON.parse(readFileSync(cfgPath, 'utf8'));
ok('present');

const rootPkg = existsSync(join(repo, 'package.json'));
if (!rootPkg) {
  for (const k of ['installCommand', 'buildCommand', 'outputDirectory']) {
    if (!cfg[k]) bad(`no package.json at the repo root, so vercel.json must set "${k}"`);
  }
  if (cfg.installCommand && cfg.buildCommand && cfg.outputDirectory) {
    ok('app lives in a subdirectory and the build contract is declared explicitly');
  }
} else {
  ok('package.json at the repo root');
}
if (cfg.cleanUrls === undefined) bad('set "cleanUrls": true for extensionless routes');
if (!cfg.rewrites?.some((r) => r.destination === '/index.html')) {
  bad('missing the SPA fallback rewrite {"source":"/(.*)","destination":"/index.html"}');
} else ok('SPA fallback rewrite present');

/* -------------------------------------------------------- 2. hygiene */
head('2. repo hygiene');
let tracked = [];
try {
  tracked = execSync('git ls-files', { cwd: repo, encoding: 'utf8' }).trim().split('\n').filter(Boolean);
  ok(`${tracked.length} tracked files`);
} catch { console.log('  --    not a git repo yet, skipping tracked-file checks'); }

if (tracked.length) {
  const nm = tracked.filter((f) => f.split('/').includes('node_modules'));
  const di = tracked.filter((f) => f.split('/').includes('dist'));
  nm.length ? bad(`${nm.length} node_modules files are committed`) : ok('node_modules not committed');
  di.length ? bad(`${di.length} dist files are committed — Vercel builds it`) : ok('dist not committed');

  const big = tracked.filter((f) => {
    try { return statSync(join(repo, f)).size > 45 * 1024 * 1024; } catch { return false; }
  });
  big.length ? bad(`files over 45MB tracked: ${big.slice(0, 4).join(', ')}`) : ok('no oversized tracked files');
}

/* Every asset the built site serves must actually be committed. A bare
 * .gitignore rule like `renders` matches that directory name at ANY depth and
 * silently excludes site/public/media/renders — the build passes locally and
 * deploys with no images. Assert nothing under public/ is ignored. */
const publicDirs = [];
(function findPublic(dir, depth) {
  if (depth > 3) return;
  let entries = [];
  try { entries = readdirSync(dir, { withFileTypes: true }); } catch { return; }
  for (const e of entries) {
    if (!e.isDirectory()) continue;
    if (['node_modules', 'dist', '.git'].includes(e.name)) continue;
    const full = join(dir, e.name);
    if (e.name === 'public') publicDirs.push(full);
    else findPublic(full, depth + 1);
  }
})(repo, 0);

const publicFiles = [];
const walk = (d) => {
  for (const e of readdirSync(d, { withFileTypes: true })) {
    const full = join(d, e.name);
    if (e.isDirectory()) walk(full);
    else publicFiles.push(relative(repo, full));
  }
};
publicDirs.forEach(walk);

if (publicFiles.length) {
  let ignored = [];
  try {
    const out = execSync('git check-ignore -v --stdin', {
      cwd: repo, encoding: 'utf8', input: publicFiles.join('\n'),
    });
    ignored = out.trim().split('\n').filter(Boolean);
  } catch { /* exit 1 = nothing ignored, which is what we want */ }

  if (ignored.length) {
    const rule = ignored[0].split('\t')[0];
    bad(`${ignored.length} of ${publicFiles.length} files under public/ are GITIGNORED `
      + `— they will not deploy and the site will render with missing media. `
      + `First match: ${rule}`);
    console.log(`        e.g. ${ignored.slice(0, 3).map((l) => l.split('\t')[1]).join(', ')}`);
    console.log('        Fix: anchor the rule to the repo root with a leading slash (/renders).');
  } else {
    ok(`${publicFiles.length} files under public/ are all committable`);
  }

  if (tracked.length) {
    const trackedSet = new Set(tracked);
    const untracked = publicFiles.filter((f) => !trackedSet.has(f));
    untracked.length
      ? bad(`${untracked.length} files under public/ are not tracked by git yet `
          + `(run: git add -A). e.g. ${untracked.slice(0, 3).join(', ')}`)
      : ok('every public/ file is tracked by git');
  }
}

const giPath = join(repo, '.gitignore');
if (existsSync(giPath)) {
  const inline = readFileSync(giPath, 'utf8').split('\n')
    .filter((l) => /\S\s+#/.test(l) && !l.trimStart().startsWith('#'));
  inline.length
    ? bad(`.gitignore has inline comments — the whole line becomes the pattern: ${inline[0].trim()}`)
    : ok('.gitignore comments are on their own lines');
}

/* -------------------------------------------- 3. run Vercel's real commands */
head('3. running Vercel’s install + build on a clean copy');
const work = mkdtempSync(join(tmpdir(), 'preflight-'));
const clean = join(work, 'repo');
cpSync(repo, clean, {
  recursive: true,
  filter: (s) => {
    const r = relative(repo, s).split('/');
    return !r.includes('node_modules') && !r.includes('.git') && !r.includes('dist');
  },
});

const run = (label, cmd) => {
  if (!cmd) return true;
  try {
    execSync(cmd, { cwd: clean, stdio: 'pipe', encoding: 'utf8', timeout: 240000 });
    ok(`${label}: ${cmd}`);
    return true;
  } catch (e) {
    bad(`${label} failed: ${cmd}`);
    console.log((e.stdout || '') + (e.stderr || '') .toString().split('\n').slice(-12).join('\n'));
    return false;
  }
};

const installed = run('installCommand', cfg.installCommand || (rootPkg ? 'npm ci' : null));
const built = installed && run('buildCommand', cfg.buildCommand || (rootPkg ? 'npm run build' : null));

/* ------------------------------------------------------ 4. output is servable */
head('4. build output');
const outDir = join(clean, cfg.outputDirectory || 'dist');
if (!built) {
  bad('build did not complete — skipping output checks');
} else if (!existsSync(outDir)) {
  bad(`outputDirectory "${cfg.outputDirectory || 'dist'}" does not exist after the build. `
    + 'This is the classic 404: Vercel serves an empty directory.');
} else {
  ok(`outputDirectory exists: ${cfg.outputDirectory || 'dist'}`);
  existsSync(join(outDir, 'index.html'))
    ? ok('index.html at the output root')
    : bad('no index.html at the output root — "/" will 404');

  const shells = [];
  const walk = (d, base = '') => {
    for (const e of readdirSync(d, { withFileTypes: true })) {
      if (e.isDirectory()) {
        if (['assets', 'media'].includes(e.name)) continue;
        walk(join(d, e.name), base + e.name + '/');
      } else if (e.name === 'index.html') shells.push(base + 'index.html');
    }
  };
  walk(outDir);
  ok(`${shells.length} route shell(s)`);

  // conflicting flat vs directory routes under cleanUrls
  const flat = readdirSync(outDir)
    .filter((f) => f.endsWith('.html') && !['index.html', '404.html'].includes(f));
  const conflicts = flat.filter((f) => shells.includes(f.replace(/\.html$/, '') + '/index.html'));
  conflicts.length
    ? bad(`under cleanUrls these resolve to the same URL as their directory form: ${conflicts.join(', ')}`)
    : ok('no flat-vs-directory route conflicts');

  // meta sanity
  const titles = new Map();
  let mediaMissing = 0;
  const mediaDir = join(outDir, 'media');
  const media = existsSync(mediaDir) ? new Set(readdirSync(mediaDir)) : new Set();
  for (const s of shells) {
    const html = readFileSync(join(outDir, s), 'utf8');
    const t = (html.match(/<title>([\s\S]*?)<\/title>/) || [])[1];
    if (!t) { bad(`no <title> in ${s}`); continue; }
    if (titles.has(t)) bad(`duplicate <title> "${t}" in ${s} and ${titles.get(t)}`);
    titles.set(t, s);
    const og = (html.match(/og:image" content="([^"]*)"/) || [])[1];
    if (og?.includes('/media/')) {
      const f = og.split('/media/')[1];
      if (media.size && !media.has(f)) { bad(`og:image missing from output: ${f} (${s})`); mediaMissing++; }
    }
  }
  if (!mediaMissing) ok('every og:image resolves to a file in the output');

  // assets referenced by the bundle
  const assetsDir = join(outDir, 'assets');
  if (existsSync(assetsDir) && media.size) {
    const js = readdirSync(assetsDir).filter((f) => f.endsWith('.js'))
      .map((f) => readFileSync(join(assetsDir, f), 'utf8')).join('\n');
    const ids = [...new Set([...js.matchAll(/["'`]([0-9]{3}_[a-z0-9_]+)["'`]/g)].map((m) => m[1]))];
    const miss = ids.filter((n) => !media.has(n + '.jpg'));
    miss.length
      ? bad(`bundle references media not in the output: ${miss.slice(0, 5).join(', ')}`)
      : ok(`${ids.length} bundle-referenced media files all present`);
  }
}

rmSync(work, { recursive: true, force: true });

console.log(fails
  ? `\n>>> ${fails} FAILURE(S) — this would not deploy correctly. Fix before pushing.`
  : '\n>>> ALL CHECKS PASSED — safe to push. No Vercel dashboard setting required.');
process.exit(fails ? 1 : 0);
