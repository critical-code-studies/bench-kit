#!/usr/bin/env node
/*
 * tools/release.js - a bench's release: its version raised on every script and stylesheet
 * (the ?v= in its pages) and its date (the bench-date meta) set to the day, a line in its
 * changelog, the version in its README, and the kit moved to a release if asked; then a check
 * for conflict markers. It changes files only: committing and pushing stay with you. Run from
 * the bench's repository:
 *
 *   node research/kit/tools/release.js next "What changed."           raise the last number
 *   node research/kit/tools/release.js 1.19.0 "What changed." --kit v0.31.0
 *   node research/kit/tools/release.js next --no-changelog --kit v0.31.0
 *   node research/kit/tools/release.js --check                        report, change nothing
 *
 *   --kit <tag or commit>   check the kit (research/kit) out at that release first
 *   --no-changelog          leave the changelog (a bench that records releases in groups)
 *   --dry-run               say what would change, change nothing
 *   --dir <folder>          the bench's folder (research by default, or . where index.html is)
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
const CHECK = flag('--check'), DRY = flag('--dry-run'), NOLOG = flag('--no-changelog');
const KIT = opt('--kit'), DIR = opt('--dir');
const [want, line] = argv;
const fail = (m) => { console.error('release: ' + m); process.exit(1); };

const dir = DIR || (fs.existsSync('research/index.html') ? 'research' : '.');
const page = path.join(dir, 'index.html');
if (!fs.existsSync(page)) fail('no ' + page + ': run this from the bench\'s repository, or give --dir');
if (!CHECK && !want) fail('give the new version (or next), or --check');
if (!CHECK && !NOLOG && !line) fail('give a line for the changelog, or --no-changelog');

// the bench's version: the ?v= on its pages' scripts and stylesheets, which should all agree
const pages = fs.readdirSync(dir).filter((f) => f.endsWith('.html')).map((f) => path.join(dir, f));
const count = {};
pages.forEach((p) => {
  for (const m of fs.readFileSync(p, 'utf8').matchAll(/(?:src|href)="(?:kit|js|css)\/[^"?]+\?v=([^"&]+)"/g)) count[m[1]] = (count[m[1]] || 0) + 1;
});
const seen = Object.keys(count).sort((a, b) => count[b] - count[a]);
if (!seen.length) fail('no ?v= on the scripts in ' + page);
const cur = seen[0];
const problems = [];
if (seen.length > 1) problems.push('the pages disagree on the version: ' + seen.map((v) => v + ' (' + count[v] + ')').join(', '));

// the kit's version, from kit/base.js
const kitDir = path.join(dir, 'kit');
const kitVersion = () => { try { return /version: '([^']+)'/.exec(fs.readFileSync(path.join(kitDir, 'base.js'), 'utf8'))[1]; } catch (e) { return null; } };
const git = (args, cwd) => {
  try { return execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).replace(/\s+$/, ''); }
  catch (e) { fail('git ' + args.join(' ') + ' (in ' + cwd + ') failed: ' + String(e.stderr || e.message).trim()); }
};

// conflict markers anywhere in the bench but the kit
function markers(d, out) {
  for (const f of fs.readdirSync(d, { withFileTypes: true })) {
    if (f.name === '.git' || f.name === 'kit' || f.name === 'node_modules') continue;
    const p = path.join(d, f.name);
    if (f.isDirectory()) markers(p, out);
    else if (/\.(html|js|css|md|json|py|txt)$/.test(f.name) && /^(<{7}|>{7}) /m.test(fs.readFileSync(p, 'utf8'))) out.push(p);
  }
  return out;
}
const marked = markers(dir, []);
if (marked.length) problems.push('conflict markers in ' + marked.join(', '));
let kitState = '';
try { kitState = git(['status', '--porcelain'], kitDir); } catch (e) { problems.push('the kit is not a git checkout (' + kitDir + ')'); }
if (kitState) problems.push('the kit has changes not in any release:\n  ' + kitState.split('\n').join('\n  '));

if (CHECK) {
  console.log('bench ' + cur + ', bench-kit ' + kitVersion() + ' (' + git(['describe', '--tags', '--always'], kitDir) + ')');
  if (problems.length) { console.log(problems.map((p) => '- ' + p).join('\n')); process.exit(1); }
  console.log('no problems found');
  process.exit(0);
}
if (problems.length) fail(problems.join('\n'));

// a version is numbers and points (0.1.11); a stamp left on the pages by testing (?v=c1) is not one, and
// "next" of it would be another stamp, so name the version instead (release.js 0.1.12 "…")
const VER = /^\d+(\.\d+)+$/;
if (want === 'next' && !VER.test(cur)) fail('the pages\' ?v= is "' + cur + '", not a version number: give the version to release (release.js X.Y.Z "…")');
if (want !== 'next' && !VER.test(want)) fail('"' + want + '" is not a version number (X.Y.Z), or next');
const next = want === 'next' ? cur.replace(/(\d+)$/, (n) => String(+n + 1)) : want;
if (next === cur) fail('the version is already ' + cur);
const now = new Date(), today = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0');   // the local day, not UTC's
const changes = [], touched = [];
const write = (p, s) => { touched.push(p); if (!DRY) fs.writeFileSync(p, s); };

if (KIT) {
  if (DRY) changes.push('kit: would check out ' + KIT);
  else {
    git(['fetch', '--quiet', '--tags', '--force', 'origin'], kitDir);   // --force: a tag moved upstream is taken, not refused
    git(['checkout', '--quiet', KIT], kitDir);
    changes.push('kit: ' + KIT + ' (' + git(['rev-parse', '--short', 'HEAD'], kitDir) + ')');
    touched.push(kitDir);
  }
}
const kv = kitVersion();
// the kit's own version (base.js) should be the release it is checked out at
{
  let tag = ''; try { tag = git(['describe', '--tags', '--exact-match'], kitDir); } catch (e) { /* between releases */ }
  if (tag && kv && tag.replace(/^v/, '') !== kv) console.warn('warning: the kit is at ' + tag + ' but its base.js says ' + kv + '; release the kit with tools/kit-release.js');
}

pages.forEach((p) => {
  let s = fs.readFileSync(p, 'utf8'), t = s;
  const n = s.split('?v=' + cur + '"').length - 1;
  if (n) t = t.split('?v=' + cur + '"').join('?v=' + next + '"');
  // the release's day, which Help and About show beside the version
  t = t.replace(/(<meta name="bench-date" content=")[^"]*(">)/, (m, a, b) => a + today + b);
  const dated = (/<meta name="bench-date" content="([^"]*)">/.exec(s) || [])[1] !== (/<meta name="bench-date" content="([^"]*)">/.exec(t) || [])[1];
  if (t !== s) { write(p, t); changes.push(p + ': ' + [n ? n + ' × ?v=' + next : '', dated ? 'bench-date ' + today : ''].filter(Boolean).join(', ')); }
});

const log = path.join(dir, 'CHANGELOG.md');
if (!NOLOG) {
  if (!fs.existsSync(log)) fail('no ' + log + ' (or give --no-changelog)');
  const s = fs.readFileSync(log, 'utf8'), i = s.indexOf('\n## ');
  if (i < 0) fail(log + ' has no entries to put this above');
  write(log, s.slice(0, i) + '\n## ' + next + ' (' + today + ')\n\n- ' + line + '\n' + s.slice(i));
  changes.push(log + ': ## ' + next);
}

['README.md', path.join(dir, 'README.md')].filter((p, i, a) => a.indexOf(p) === i && fs.existsSync(p)).forEach((p) => {
  const s = fs.readFileSync(p, 'utf8');
  // the README's version line follows the release, whatever it said before
  const t = s.replace(/(\*\*Version:\*\* )[^ ]+( \(bench-kit )[^)]+\)/, (m, a, b) => a + next + b + kv + ')');
  if (t !== s) { write(p, t); changes.push(p + ': Version ' + next + ' (bench-kit ' + kv + ')'); }
});

console.log((DRY ? 'would release ' : 'released ') + cur + ' → ' + next + ', bench-kit ' + kv + ':\n' + changes.map((c) => '  ' + c).join('\n'));
if (!DRY) console.log('\nNext: look over git diff, then commit and push:\n  git add ' + touched.filter((p, i, a) => a.indexOf(p) === i).join(' '));
