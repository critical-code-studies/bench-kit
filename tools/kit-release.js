#!/usr/bin/env node
/*
 * tools/kit-release.js - a release of the kit itself: the version in base.js (SW.KIT, which the
 * benches show and tools/release.js reports), a heading in CHANGELOG.md over the notes already
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
git(['add', 'base.js', 'CHANGELOG.md']);
git(['commit', '-q', '-m', 'bench-kit ' + next].concat(AUTHOR ? ['--author', AUTHOR] : []));
git(['tag', 'v' + next]);
console.log('released bench-kit ' + cur.join('.') + ' → ' + next + ', tagged v' + next + '\nNext: git push && git push origin v' + next);
