#!/usr/bin/env node
/*
 * tools/release.js - a bench's release: its version raised on every script and stylesheet
 * (the ?v= in its pages) and its date (the bench-date meta) set to the day, a line in its
 * changelog, the version in its README, the DOI badge at the README's foot (from about.doi), the bench's
 * preview card (the tags in index.html a site reads when a link is posted, from about.card), the Library's
 * page with its preview card (library/index.html, for a bench with a Library), and the kit moved to a release if asked; then a check for conflict markers. It changes files only: committing and pushing stay with you. Run from
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
    // the rest of the release is the new kit's: this run is still the old tool
    const rest = process.argv.slice(2), at = rest.indexOf('--kit');
    rest.splice(at, 2);
    const said = 'kit: ' + KIT + ' (' + git(['rev-parse', '--short', 'HEAD'], kitDir) + ')';
    try { execFileSync(process.execPath, [path.join(kitDir, 'tools', 'release.js')].concat(rest), { stdio: 'inherit', env: Object.assign({}, process.env, { BENCH_KIT_MOVED: said }) }); }
    catch (e) { process.exit(e.status || 1); }
    process.exit(0);
  }
}
if (process.env.BENCH_KIT_MOVED) { changes.push(process.env.BENCH_KIT_MOVED); touched.push(kitDir); }
const kv = kitVersion();
// the kit's own version (base.js) should be the release it is checked out at
{
  // (asked without git(), which stops the release on an error: a kit between releases has no tag, and that is no fault)
  let tag = ''; try { tag = execFileSync('git', ['describe', '--tags', '--exact-match'], { cwd: kitDir, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim(); } catch (e) { /* between releases */ }
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

// the DOI badge, placed by the kit: one line at the foot of the README, from the bench's config.js
// (about.doi, about.doiBadge); any Zenodo badge elsewhere in the README is taken out. Without a DOI,
// where to get one.
{
  let A = {};
  try {
    const vm = require('vm'), sb = { SW: {} }; sb.window = sb; sb.globalThis = sb;
    vm.runInNewContext(fs.readFileSync(path.join(dir, 'js', 'config.js'), 'utf8'), sb);
    A = (sb.SW.BENCH || {}).about || {};
  } catch (e) { /* no config.js, or one that needs the page */ }
  const readme = fs.existsSync('README.md') ? 'README.md' : path.join(dir, 'README.md');
  if (A.doi && fs.existsSync(readme)) {
    const badge = '[![DOI](' + (A.doiBadge || 'https://zenodo.org/badge/DOI/' + A.doi + '.svg') + ')](https://doi.org/' + A.doi + ')';
    const s = fs.readFileSync(readme, 'utf8');
    // a badge line taken out takes a blank line beside it, so no gap is left
    const L = s.split('\n'), keep = [];
    L.forEach((l, i) => {
      if (/\[!\[DOI\]\(https:\/\/zenodo\.org\/badge\//.test(l)) { if (keep.length && keep[keep.length - 1] === '' && L[i + 1] === '') keep.pop(); return; }
      keep.push(l);
    });
    const t = keep.join('\n').replace(/\s+$/, '') + '\n\n' + badge + '\n';
    if (t !== s) { write(readme, t); changes.push(readme + ': the DOI badge at the foot'); }
  } else if (!A.doi) console.log('No DOI: set about.doi in js/config.js once Zenodo has archived a GitHub Release (https://zenodo.org/account/settings/github/; the kit\'s README, "A bench\'s DOI").');
}

// The bench's preview card: the picture, title and line a site shows when a link to the bench is posted
// (LinkedIn, Slack, Mastodon, Bluesky and others read Open Graph tags; X reads twitter: ones). A site's reader
// runs no script, so the tags are written into index.html here, between two comments, from the bench's settings
// (js/config.js): about.card { title, description, image, alt, site }, each with a default: the bench's title, the page's
// own description, and the kit's picture (kit/docs/img/bench-card.jpg). about.card: false writes none. A page
// whose tags were written by hand is left as it is until the bench sets about.card.
{
  let B = {}, SWx = {};
  try {
    const vm = require('vm'), sb = { SW: {} }; sb.window = sb; sb.globalThis = sb;
    vm.runInNewContext(fs.readFileSync(path.join(dir, 'js', 'config.js'), 'utf8'), sb);
    SWx = sb.SW; B = sb.SW.BENCH || {};
  } catch (e) { /* no config.js, or one that needs the page */ }
  const A = B.about || {}, K = A.card && typeof A.card === 'object' ? A.card : {};
  const START = '<!-- preview card: written by kit/tools/release.js from about.card in js/config.js -->', END = '<!-- /preview card -->';
  const s = fs.readFileSync(page, 'utf8'), has = s.indexOf(START) >= 0, byHand = !has && /<meta\s+(?:property="og:|name="twitter:)/.test(s);
  const base = B.base || SWx.BASE_URI || '';
  if (A.card === false) {   // the bench wants none: a card this tool wrote earlier is taken out
    if (has) {
      const cut = s.slice(0, s.lastIndexOf('\n', s.indexOf(START)) + 1) + s.slice(s.indexOf('\n', s.indexOf(END)) + 1);
      write(page, cut); changes.push(page + ': the preview card taken out (about.card: false)');
    }
  }
  else if (byHand && !A.card) { /* written by hand: left */ }
  else if (!base) console.log('No preview card: set base in js/config.js to the address the bench is published at.');
  else {
    const attr = (x) => String(x).replace(/&(?!#?\w+;)/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const plain = (x) => String(x || '').replace(/<\/?(?:p|div|br|li|ul|ol|h\d)\b[^>]*>/gi, ' ').replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
    const unattr = (x) => String(x || '').replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
    const title = K.title || B.title || ((B.name || 'A') + ' research bench');
    let desc = plain(K.description) || unattr((/<meta name="description" content="([^"]*)">/.exec(s) || [])[1]) || plain(A.purpose);
    if (desc.length > 200) {
      const head = desc.slice(0, 201), end = Math.max(head.lastIndexOf('. '), head.lastIndexOf('! '), head.lastIndexOf('? '));
      desc = end > 40 ? head.slice(0, end + 1) : head.replace(/\s+\S*$/, '') + '…';
    }
    const root = base.replace(/\/?$/, '/'), abs = (u) => /^https?:/.test(u) ? u : root + String(u).replace(/^\.?\//, '');
    // the picture: the bench's own, or the kit's. Its size and kind are read from the file, and its address
    // carries a stamp of its bytes, so a site that has kept an old picture fetches a new one.
    let pic = K.image || 'kit/docs/img/bench-card.jpg', info = null, stamp = '';
    const read = (u) => {
      if (/^https?:/.test(u)) return null;
      try {
        const b = fs.readFileSync(path.join(dir, u.replace(/[?#].*$/, ''))), o = { bytes: b.length, hash: require('crypto').createHash('sha1').update(b).digest('hex').slice(0, 8) };
        if (b.length > 24 && b.readUInt32BE(0) === 0x89504e47) { o.w = b.readUInt32BE(16); o.h = b.readUInt32BE(20); o.type = 'image/png'; }
        else if (b[0] === 0xff && b[1] === 0xd8) {
          o.type = 'image/jpeg';
          for (let i = 2; i + 9 < b.length;) {
            if (b[i] !== 0xff) { i++; continue; }
            const m = b[i + 1];
            if (m >= 0xc0 && m <= 0xcf && m !== 0xc4 && m !== 0xc8 && m !== 0xcc) { o.h = b.readUInt16BE(i + 5); o.w = b.readUInt16BE(i + 7); break; }
            if (m === 0xff) { i++; continue; }
            if (m === 0xd8 || m === 0x01 || (m >= 0xd0 && m <= 0xd7)) { i += 2; continue; }
            i += 2 + b.readUInt16BE(i + 2);
          }
        }
        return o;
      } catch (e) { return undefined; }
    };
    info = read(pic);
    if (info === undefined && K.image) { console.warn('warning: the preview card\'s picture ' + K.image + ' (about.card.image) is not in the bench; the kit\'s picture is used.'); pic = 'kit/docs/img/bench-card.jpg'; info = read(pic); }
    if (info && K.image) {
      if (!info.type) console.warn('warning: the preview card\'s picture ' + pic + ' is neither PNG nor JPEG; LinkedIn and others show those only.');
      else if (info.w < 1200 || info.h < 627) console.warn('warning: the preview card\'s picture ' + pic + ' is ' + info.w + ' × ' + info.h + '; a card wants 1200 × 627 or more.');
      if (info.bytes > 5 * 1024 * 1024) console.warn('warning: the preview card\'s picture ' + pic + ' is over 5 MB, which LinkedIn refuses.');
    }
    if (info && info.hash && !/[?#]/.test(pic)) stamp = '?v=' + info.hash;
    const image = abs(pic) + stamp, alt = K.alt || title;
    const tags = [START,
      '<meta property="og:type" content="website">',
      K.site || B.title ? '<meta property="og:site_name" content="' + attr(K.site || B.title) + '">' : '',
      '<meta property="og:title" content="' + attr(title) + '">',
      desc ? '<meta property="og:description" content="' + attr(desc) + '">' : '',
      '<meta property="og:url" content="' + attr(root) + '">',
      '<meta property="og:image" content="' + attr(image) + '">',
      info && info.type ? '<meta property="og:image:type" content="' + info.type + '">' : '',
      info && info.w ? '<meta property="og:image:width" content="' + info.w + '">' : '',
      info && info.h ? '<meta property="og:image:height" content="' + info.h + '">' : '',
      '<meta property="og:image:alt" content="' + attr(alt) + '">',
      '<meta name="twitter:card" content="summary_large_image">',
      '<meta name="twitter:title" content="' + attr(title) + '">',
      desc ? '<meta name="twitter:description" content="' + attr(desc) + '">' : '',
      '<meta name="twitter:image" content="' + attr(image) + '">',
      END].filter(Boolean);
    // an earlier card taken out, with tags written by hand where the bench now gives about.card
    let t = s;
    if (has) t = t.replace(new RegExp('[ \\t]*' + START.replace(/[.*+?^${}()|[\]\\\/]/g, '\\$&') + '[\\s\\S]*?' + END.replace(/[.*+?^${}()|[\]\\\/]/g, '\\$&') + '[ \\t]*\\n?'), '');
    else t = t.replace(/^[ \t]*<meta\s+(?:property="og:[^"]*"|name="twitter:[^"]*")[^>]*>[ \t]*\n/gm, '');
    // the page's own description follows the card's, where the bench gives one
    if (K.description && desc) t = /<meta name="description" content="[^"]*">/.test(t) ? t.replace(/<meta name="description" content="[^"]*">/, () => '<meta name="description" content="' + attr(desc) + '">') : t;
    const at = /^([ \t]*)<meta name="description"[^>]*>[ \t]*\n/m.exec(t) || /^([ \t]*)<title>[^\n]*\n/m.exec(t);
    if (!at) console.warn('warning: no <title> in ' + page + ' to put the preview card after; none written.');
    else {
      const k = at.index + at[0].length;
      t = t.slice(0, k) + tags.map((x) => at[1] + x).join('\n') + '\n' + t.slice(k);
      if (t !== s) { write(page, t); changes.push(page + ': the preview card (' + pic + (info && info.w ? ', ' + info.w + ' × ' + info.h : '') + ')'); }
    }
  }
}

// the Library's own page, for the preview card a site shows when a link is posted. Every tab is one page and a
// site's reader runs no script, so the card needs a page of its own, which sends a person on to the entry.
{
  let B = {}, SWx = {};
  try {
    const vm = require('vm'), sb = { SW: {} }; sb.window = sb; sb.globalThis = sb;
    vm.runInNewContext(fs.readFileSync(path.join(dir, 'js', 'config.js'), 'utf8'), sb);
    SWx = sb.SW; B = sb.SW.BENCH || {};
  } catch (e) { /* no config.js, or one that needs the page */ }
  if (B.library) {
    const C = B.library === true ? {} : B.library, K = C.card || {}, html = fs.readFileSync(page, 'utf8');
    const tag = (name) => { const m = new RegExp('property="og:' + name + '" content="([^"]*)"').exec(html); return m ? m[1] : ''; };
    const base = B.base || SWx.BASE_URI || tag('url');
    if (base) {
      let man = {};
      try { man = JSON.parse(fs.readFileSync(path.join(dir, 'library', 'library.json'), 'utf8')); } catch (e) { /* no manifest yet */ }
      const attr = (s) => String(s).replace(/&(?!#?\w+;)/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      const plain = (s) => String(s || '').replace(/<\/?(?:p|div|br|li|ul|ol|h\d)\b[^>]*>/gi, ' ').replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
      const title = K.title || ((B.name || B.title || 'The') + ' ' + (C.label || 'Library'));
      let desc = plain(K.description || C.intro || man.intro);
      if (desc.length > 200) {
        // whole sentences if the first fits, else cut at a word
        const head = desc.slice(0, 201), end = Math.max(head.lastIndexOf('. '), head.lastIndexOf('! '), head.lastIndexOf('? '));
        desc = end > 40 ? head.slice(0, end + 1) : head.replace(/\s+\S*$/, '') + '…';
      }
      const root = base.replace(/\/?$/, '/'), abs = (u) => /^https?:/.test(u) ? u : root + u;
      // the bench's own picture, if it has one: not the kit's picture of a bench, which the shelves replace here
      const benchImage = /kit\/docs\/img\/bench-card\./.test(tag('image')) ? '' : tag('image');
      const ownImage = K.image || benchImage, image = abs(ownImage || 'kit/docs/img/library-card.jpg');
      const out = '<!doctype html>\n<!-- Written by the kit\'s tools/release.js: edit library.card in js/config.js, not this. -->\n<html lang="en">\n<head>\n<meta charset="utf-8">\n' +
        '<title>' + attr(title) + '</title>\n' +
        (desc ? '<meta name="description" content="' + attr(desc) + '">\n' : '') +
        '<meta property="og:title" content="' + attr(title) + '">\n' +
        (desc ? '<meta property="og:description" content="' + attr(desc) + '">\n' : '') +
        '<meta property="og:type" content="website">\n<meta property="og:url" content="' + attr(root + 'library/') + '">\n' +
        '<meta property="og:image" content="' + attr(image) + '">\n' +
        (ownImage ? '' : '<meta property="og:image:width" content="1200">\n<meta property="og:image:height" content="630">\n') +
        '<meta property="og:image:alt" content="' + attr(title) + '">\n' +
        '<meta name="twitter:card" content="summary_large_image">\n<meta name="twitter:title" content="' + attr(title) + '">\n' +
        (desc ? '<meta name="twitter:description" content="' + attr(desc) + '">\n' : '') +
        '<meta name="twitter:image" content="' + attr(image) + '">\n' +
        '<script>var m = /[?&]lib=([^&#]*)/.exec(location.search); location.replace(\'../?tab=library\' + (m ? \'&lib=\' + m[1] : \'\'));</script>\n' +
        '<noscript><meta http-equiv="refresh" content="0; url=../?tab=library"></noscript>\n</head>\n' +
        '<body><p><a href="../?tab=library">' + attr(title) + '</a></p></body>\n</html>\n';
      const to = path.join(dir, 'library', 'index.html');
      if (!fs.existsSync(to) || fs.readFileSync(to, 'utf8') !== out) {
        if (!DRY) fs.mkdirSync(path.dirname(to), { recursive: true });
        write(to, out);
        changes.push(to + ': the Library\'s preview card');
      }
    } else console.log('No preview card for the Library: set base in js/config.js to the address the bench is published at.');
  }
}

// the Library's records a person should look over (tools/library-check.js)
{
  const lj = path.join(dir, 'library', 'library.json');
  if (fs.existsSync(lj)) {
    try {
      const chk = require(path.join(__dirname, 'library-check.js'));
      const j = JSON.parse(fs.readFileSync(lj, 'utf8')), n = (j.items || []).filter((e) => chk.problemsOf(e).length).length;
      if (n) console.log('Library: ' + n + ' record' + (n === 1 ? '' : 's') + ' to look over: node ' + path.join(path.relative(process.cwd(), path.dirname(__dirname)), 'tools', 'library-check.js') + ' ' + lj);
    } catch (e) { /* a manifest that does not parse is reported elsewhere */ }
  }
}

console.log((DRY ? 'would release ' : 'released ') + cur + ' → ' + next + ', bench-kit ' + kv + ':\n' + changes.map((c) => '  ' + c).join('\n'));
if (!DRY) console.log('\nNext: look over git diff, then commit and push:\n  git add ' + touched.filter((p, i, a) => a.indexOf(p) === i).join(' '));
