#!/usr/bin/env node
/*
 * tools/library-move.js - paratexts moved to the Library, and back. It works on a clone of the private
 * repository and on the bench's folder, and commits nothing. docs/library.md gives the rest.
 *
 * Three steps, each run from the bench's repository:
 *   node research/kit/tools/library-move.js <clone> --plan P-AAAAA,P-BBBBB [--out plan.json]
 *       writes a plan: for each item the entry it would become, for you to correct and approve. A
 *       plan's `note` starts as null and must be set (a string, '' for none), since a catalogue's
 *       description may hold the group's working remarks. `shelf` starts as 'private', on the entry and
 *       on each of its alternates (alts). Fields beginning _ are for reading and are ignored.
 *   node research/kit/tools/library-move.js <clone> --apply plan.json [--write]
 *       lists what it would do; with --write does it: the files moved, the entries in the bench's
 *       library.json, the records out of catalogue.json and into the clone's library/moved.json.
 *   node research/kit/tools/library-move.js <clone> --back P-AAAAA,P-BBBBB [--write]
 *       the reverse: the catalogue record restored whole, at its old place, with its files, and the
 *       entry taken out of library.json.
 *   --dir <folder>     the bench's folder (research if it has an index.html, else .)
 *   --manifest <file>  the public manifest (<dir>/library/library.json)
 *
 * Exits 1, with nothing written, if any item in the run cannot be done.
 * A file put on the public shelf and pushed stays in the public repository's history: moving it back
 * cannot remove it from there.
 * Part of bench-kit (github.com/critical-code-studies/bench-kit).
 */
'use strict';
const fs = require('fs');
const path = require('path');

const argv = process.argv.slice(2);
const flag = (f) => { const i = argv.indexOf(f); if (i < 0) return false; argv.splice(i, 1); return true; };
const opt = (f) => { const i = argv.indexOf(f); if (i < 0) return null; const v = argv[i + 1]; argv.splice(i, 2); return v; };
const die = (m) => { console.error(m); process.exit(1); };

const WRITE = flag('--write'), PLAN = opt('--plan'), APPLY = opt('--apply'), BACK = opt('--back'), OUT = opt('--out'), DIR = opt('--dir'), MANIFEST = opt('--manifest');
const clone = argv[0];
if (!clone || [PLAN, APPLY, BACK].filter(Boolean).length !== 1) die('node kit/tools/library-move.js <clone of the private repository> --plan P-A,P-B | --apply plan.json [--write] | --back P-A,P-B [--write]');

const dir = DIR || (fs.existsSync(path.join('research', 'index.html')) ? 'research' : '.');
const manifest = MANIFEST || path.join(dir, 'library', 'library.json');
const catFile = path.join(clone, 'catalogue.json');
const movedFile = path.join(clone, 'library', 'moved.json');
if (!fs.existsSync(catFile)) die('No catalogue.json in ' + clone + ': name a clone of the private repository.');

const readJSON = (f, d) => (fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')) : d);
const cat = readJSON(catFile);
const man = readJSON(manifest, { title: 'Library', items: [] });
man.items = man.items || [];
const moved = readJSON(movedFile, { items: [] });
const codes = (s) => s.split(',').map((x) => x.trim()).filter(Boolean);
const HISTORY = 'A file on the public shelf, once pushed, stays in the public repository\'s history: moving it back does not remove it from there.';
const PUBLIC_MAX = 100e6;

function record(code) { return cat.items.filter((x) => x.code === code)[0] || null; }
const list = (v) => (Array.isArray(v) ? v : v ? [v] : []);
const firstLink = (it) => [it.url, it.archiveUrl].concat(list(it.identifier)).filter((u) => /^https?:\/\//i.test(String(u || '')))[0] || '';
function target(file, shelf) { return (shelf === 'public' ? 'library/files/' : 'library/') + path.basename(file); }
function onDisk(rel, shelf) { return shelf === 'public' ? path.join(dir, rel) : path.join(clone, rel); }
function mb(n) { return (n / 1e6).toFixed(1) + ' MB'; }

// ---------- a plan ----------
function makePlan() {
  const out = { note: 'Correct each entry and set each note (a string, or an empty string for none), then run --apply. Fields beginning _ are not used.', items: [] };
  const bad = [];
  codes(PLAN).forEach((code) => {
    const it = record(code);
    if (!it) { bad.push(code + ': not in the catalogue'); return; }
    if (it.kind === 'missing') { bad.push(code + ': a stub for a missing item stays in the catalogue'); return; }
    if (it.withdrawn) { bad.push(code + ': withdrawn'); return; }
    if (man.items.some((e) => e.id === code)) { bad.push(code + ': the public manifest already has this id'); return; }
    const named = (String(it.description || '').match(/\bfiles\/[^\s)`'",;]+/g) || []).filter((f) => f !== it.file && !list(it.alts).some((a) => a.file === f));
    const e = {
      id: code, title: it.title, author: it.creator || '', contributor: list(it.contributor).join('; '), date: it.date || '', kind: it.genre || '', lang: it.language || '',
      publisher: it.publisher || '', extent: it.extent || '', licence: it.rights || '', url: firstLink(it), source: it.source || '', tags: it.tags || [], note: null
    };
    if (it.file) { e.shelf = 'private'; e.file = it.file; }
    const alts = list(it.alts).filter((a) => a && a.file).map((a) => ({ label: a.label || a.lang || 'Another version', lang: a.lang || '', file: a.file, shelf: 'private' }));
    if (alts.length) e.alts = alts;
    Object.keys(e).forEach((k) => { if (e[k] === '' || (Array.isArray(e[k]) && !e[k].length)) delete e[k]; });
    e._description = it.description || '';
    if (named.length) e._namedInDescription = named.map((f) => f + (fs.existsSync(path.join(clone, f)) ? '' : ' (not in the clone)'));
    const linked = cat.items.filter((x) => x.code !== code && list(x.related).indexOf(code) >= 0).map((x) => x.code);
    if (linked.length) e._relatedFrom = linked;
    if ((it.comments || []).length) e._comments = it.comments.length + ' comment(s): kept for moving back, not shown in the Library';
    out.items.push(e);
  });
  if (bad.length) { bad.forEach((b) => console.error('  ✗ ' + b)); die('No plan written.'); }
  const file = OUT || 'library-move-plan.json';
  if (fs.existsSync(file)) die(file + ' exists: name another with --out.');
  fs.writeFileSync(file, JSON.stringify(out, null, 2) + '\n');
  console.log('Wrote ' + file + ': ' + out.items.length + ' item(s). Each note must be set before --apply.');
  out.items.filter((e) => e._namedInDescription).forEach((e) => console.log('  ' + e.id + ' names other files in its description: ' + e._namedInDescription.join(', ') + '. To move one, add it to the entry\'s alts.'));
}

// ---------- applying a plan ----------
function apply() {
  const plan = readJSON(APPLY);
  if (!plan) die('No plan at ' + APPLY + '.');
  const bad = [], jobs = [];
  plan.items.forEach((p) => {
    const it = record(p.id);
    if (!it) { bad.push(p.id + ': not in the catalogue'); return; }
    if (man.items.some((e) => e.id === p.id)) { bad.push(p.id + ': the public manifest already has this id'); return; }
    if (p.note == null) { bad.push(p.id + ': its note is not set (a string, or an empty string for none)'); return; }
    if (!p.title) { bad.push(p.id + ': no title'); return; }
    if (it.file && p.shelf !== 'public' && p.shelf !== 'private') { bad.push(p.id + ': shelf must be public or private'); return; }
    const e = {}, moves = [];
    Object.keys(p).forEach((k) => { if (k[0] !== '_') e[k] = p[k]; });
    if (!e.note) delete e.note;
    const fileMove = (from, shelf, what) => {
      const to = target(from, shelf), src = path.join(clone, from), dst = onDisk(to, shelf);
      if (!fs.existsSync(src)) { bad.push(p.id + ': the clone does not hold ' + from); return to; }
      if (fs.existsSync(dst)) bad.push(p.id + ': ' + dst + ' already exists');
      if (shelf === 'public' && fs.statSync(src).size > PUBLIC_MAX) bad.push(p.id + ': ' + from + ' is over GitHub\'s 100 MB');
      moves.push({ from, to, shelf, what, size: fs.statSync(src).size });
      return to;
    };
    if (it.file) { e.file = fileMove(it.file, p.shelf, 'file'); if (p.shelf === 'public') delete e.shelf; }
    else { delete e.file; delete e.shelf; }
    (e.alts || []).forEach((a) => {
      if (a.shelf !== 'public' && a.shelf !== 'private') { bad.push(p.id + ': shelf of ' + a.file + ' must be public or private'); return; }
      a.file = fileMove(a.file, a.shelf, a.label || 'alternate');
      if (a.shelf === 'public') delete a.shelf;
    });
    jobs.push({ p, it, e, moves });
  });
  jobs.forEach((j) => {
    console.log(j.p.id + '  ' + j.p.title);
    j.moves.forEach((m) => console.log('   ' + m.from + ' → ' + (m.shelf === 'public' ? 'public: ' + path.join(dir, m.to) : 'private: ' + m.to) + ' (' + mb(m.size) + ', ' + m.what + ')'));
    if (!j.moves.length) console.log('   no file: a record' + (j.e.url ? ' and a link out' : ''));
  });
  const pub = jobs.reduce((n, j) => n + j.moves.filter((m) => m.shelf === 'public').length, 0);
  if (pub) console.log('\n' + pub + ' file(s) to the public shelf. ' + HISTORY);
  if (bad.length) { bad.forEach((b) => console.error('  ✗ ' + b)); die('Nothing written.'); }
  if (!WRITE) { console.log('\n' + jobs.length + ' item(s). Nothing changed; --write moves them.'); return; }
  jobs.forEach((j) => {
    j.moves.forEach((m) => {
      const dst = onDisk(m.to, m.shelf);
      fs.mkdirSync(path.dirname(dst), { recursive: true });
      fs.copyFileSync(path.join(clone, m.from), dst);
      fs.unlinkSync(path.join(clone, m.from));
    });
    moved.items.push({ code: j.p.id, index: cat.items.indexOf(j.it), date: new Date().toISOString().slice(0, 10), record: j.it, moves: j.moves.map((m) => ({ from: m.from, to: m.to, shelf: m.shelf })), entry: j.e });
    cat.items.splice(cat.items.indexOf(j.it), 1);
    man.items.push(j.e);
  });
  saveAll();
  console.log('\n' + jobs.length + ' moved. Nothing is committed: commit and push the bench and the private repository.');
}

// ---------- back ----------
function back() {
  const bad = [], jobs = [];
  codes(BACK).forEach((code) => {
    const m = moved.items.filter((x) => x.code === code)[0];
    if (!m) { bad.push(code + ': not in ' + movedFile); return; }
    if (record(code)) { bad.push(code + ': already in the catalogue'); return; }
    m.moves.forEach((x) => {
      if (!fs.existsSync(onDisk(x.to, x.shelf))) bad.push(code + ': ' + onDisk(x.to, x.shelf) + ' is not there');
      if (fs.existsSync(path.join(clone, x.from))) bad.push(code + ': ' + path.join(clone, x.from) + ' already exists');
    });
    jobs.push(m);
  });
  jobs.forEach((m) => {
    console.log(m.code + '  ' + m.record.title);
    m.moves.forEach((x) => console.log('   ' + (x.shelf === 'public' ? 'public: ' + path.join(dir, x.to) : 'private: ' + x.to) + ' → ' + x.from));
    const now = man.items.filter((e) => e.id === m.code)[0];
    if (now && JSON.stringify(now) !== JSON.stringify(m.entry)) console.log('   Its entry has changed since it moved, and those changes are not carried back.');
  });
  if (jobs.some((m) => m.moves.some((x) => x.shelf === 'public'))) console.log('\n' + HISTORY);
  if (bad.length) { bad.forEach((b) => console.error('  ✗ ' + b)); die('Nothing written.'); }
  if (!WRITE) { console.log('\n' + jobs.length + ' item(s). Nothing changed; --write moves them back.'); return; }
  // the last moved first, so that each index means what it did
  jobs.slice().sort((a, b) => moved.items.indexOf(b) - moved.items.indexOf(a)).forEach((m) => {
    m.moves.forEach((x) => {
      const src = onDisk(x.to, x.shelf), dst = path.join(clone, x.from);
      fs.mkdirSync(path.dirname(dst), { recursive: true });
      fs.copyFileSync(src, dst);
      fs.unlinkSync(src);
    });
    cat.items.splice(Math.min(m.index, cat.items.length), 0, m.record);
    man.items = man.items.filter((e) => e.id !== m.code);
    moved.items = moved.items.filter((x) => x !== m);
  });
  saveAll();
  console.log('\n' + jobs.length + ' moved back. Nothing is committed: commit and push the bench and the private repository.');
}

function saveAll() {
  fs.writeFileSync(catFile, JSON.stringify(cat, null, 1) + '\n');
  fs.mkdirSync(path.dirname(manifest), { recursive: true });
  fs.writeFileSync(manifest, JSON.stringify(man, null, 2) + '\n');
  fs.mkdirSync(path.dirname(movedFile), { recursive: true });
  if (moved.items.length) fs.writeFileSync(movedFile, JSON.stringify(moved, null, 1) + '\n');
  else if (fs.existsSync(movedFile)) fs.unlinkSync(movedFile);
}

if (PLAN) makePlan();
else if (APPLY) apply();
else back();
