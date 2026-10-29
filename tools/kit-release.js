#!/usr/bin/env node
/*
 * tools/kit-release.js - a release of the kit itself: the version in base.js (SW.KIT, which the
 * benches show and tools/release.js reports), README.md, the site (docs/index.html) and CITATION.cff
 * (version and date-released, which Zenodo reads at each GitHub Release), a heading in CHANGELOG.md over the notes already
 * written under "## Unreleased", and a tag. It commits and tags; pushing stays with you.
 * Run from the kit's repository:
 *
 *   node tools/kit-release.js next          raise the last number (0.37.4 → 0.37.5)
 *   node tools/kit-release.js minor         raise the middle number (0.37.4 → 0.38.0)
 *   node tools/kit-release.js 0.40.0
 *   --author "Name <address>"               the commit's author (git's own setting otherwise)
 *   --dry-run                               say what would change, change nothing
 *
 * Part of bench-kit (github.com/critical-code-studies/bench-kit).
 */
'use strict';
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const argv = process.argv.slice(2);
const flag = (f) => { const i = argv.indexOf(f); if (i < 0) return null; argv.splice(i, 1); return true; };
const opt = (f) => { const i = argv.indexOf(f); if (i < 0) return null; const v = argv[i + 1]; argv.splice(i, 2); return v; };
const DRY = flag('--dry-run'), AUTHOR = opt('--author');
const want = argv[0];
const dir = path.resolve(__dirname, '..');
const git = (a) => execFileSync('git', a, { cwd: dir, encoding: 'utf8' }).trim();
const die = (m) => { console.error(m); process.exit(1); };

const basePath = path.join(dir, 'base.js'), logPath = path.join(dir, 'CHANGELOG.md');
const base = fs.readFileSync(basePath, 'utf8'), log = fs.readFileSync(logPath, 'utf8');
const m = /SW\.KIT = \{ version: '(\d+)\.(\d+)\.(\d+)'/.exec(base);
if (!m) die('base.js: no SW.KIT version found');
const cur = m.slice(1, 4).map(Number);
const next = want === 'next' ? [cur[0], cur[1], cur[2] + 1].join('.') : want === 'minor' ? [cur[0], cur[1] + 1, 0].join('.') :
  /^\d+\.\d+\.\d+$/.test(want || '') ? want : die('usage: node tools/kit-release.js next|minor|X.Y.Z [--author "…"] [--dry-run]');
if (!/^## Unreleased[ \t]*$/m.test(log)) die('CHANGELOG.md: write the notes under "## Unreleased" first');
if (git(['status', '--porcelain', '--', 'base.js', 'CHANGELOG.md'])) die('base.js or CHANGELOG.md has uncommitted changes besides the release');

const date = new Date().toISOString().slice(0, 10);
const base2 = base.replace(m[0], m[0].replace(cur.join('.'), next));
const log2 = log.replace(/^## Unreleased[ \t]*$/m, '## ' + next + ' (' + date + ')');
if (DRY) { console.log('would release ' + cur.join('.') + ' → ' + next + ' (base.js, CHANGELOG.md, tag v' + next + ')'); process.exit(0); }
fs.writeFileSync(basePath, base2); fs.writeFileSync(logPath, log2);
// the README's version line follows
const readmePath = path.join(dir, 'README.md');
const readme = fs.readFileSync(readmePath, 'utf8'), readme2 = readme.replace(/^(\*\*Version:\*\* )\S+/m, '$1' + next);
if (readme2 !== readme) fs.writeFileSync(readmePath, readme2);
// and the site's (docs/index.html: each <span data-kit-version>)
const sitePath = path.join(dir, 'docs', 'index.html'), hasSite = fs.existsSync(sitePath);
if (hasSite) { const site = fs.readFileSync(sitePath, 'utf8'), site2 = site.replace(/(data-kit-version>)[^<]*/g, '$1' + next); if (site2 !== site) fs.writeFileSync(sitePath, site2); }
// and the citation file's version and date, which Zenodo takes when the GitHub Release is archived
const citePath = path.join(dir, 'CITATION.cff'), hasCite = fs.existsSync(citePath);
if (hasCite) {
  const c = fs.readFileSync(citePath, 'utf8'), c2 = c.replace(/^version: .*$/m, 'version: "' + next + '"').replace(/^date-released: .*$/m, 'date-released: ' + date);
  if (c2 !== c) fs.writeFileSync(citePath, c2);
}
git(['add', 'base.js', 'CHANGELOG.md', 'README.md'].concat(hasSite ? ['docs/index.html'] : [], hasCite ? ['CITATION.cff'] : []));
git(['commit', '-q', '-m', 'bench-kit ' + next].concat(AUTHOR ? ['--author', AUTHOR] : []));
git(['tag', 'v' + next]);
console.log('released bench-kit ' + cur.join('.') + ' → ' + next + ', tagged v' + next + '\nNext: git push && git push origin v' + next);
