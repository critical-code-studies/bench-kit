#!/usr/bin/env node
/*
 * tools/library-publish.js - what members have added to the Library from the bench, brought into the
 * public manifest. Additions wait in library/additions.json in the private repository; this reads a
 * clone of that repository, lists them, and with --write moves them into the bench's library.json,
 * without the name of who added them. A private copy stays where it is, on the private shelf. It
 * commits nothing. docs/library.md gives the rest.
 *
 *   node research/kit/tools/library-publish.js <clone of the private repository>   lists, changes nothing
 *   --write            moves them
 *   --only L-A,L-B     those entries; the rest keep waiting
 *   --dir <folder>     the bench's folder (research if it has an index.html, else .)
 *   --manifest <file>  the public manifest (<dir>/library/library.json)
 *
 * Exits 1, with nothing written, if an entry cannot be published: one without an id or a title, an id
 * the public manifest already has, or a copy the clone does not hold.
 * Part of bench-kit (github.com/critical-code-studies/bench-kit).
 */
'use strict';
const fs = require('fs');
const path = require('path');

const argv = process.argv.slice(2);
const flag = (f) => { const i = argv.indexOf(f); if (i < 0) return false; argv.splice(i, 1); return true; };
const opt = (f) => { const i = argv.indexOf(f); if (i < 0) return null; const v = argv[i + 1]; argv.splice(i, 2); return v; };
const die = (m) => { console.error(m); process.exit(1); };

const WRITE = flag('--write'), ONLY = opt('--only'), DIR = opt('--dir'), MANIFEST = opt('--manifest');
const clone = argv[0];
if (!clone) die('Name a clone of the private repository: node kit/tools/library-publish.js <folder> [--write] [--only L-A,L-B]');

const dir = DIR || (fs.existsSync(path.join('research', 'index.html')) ? 'research' : '.');
const manifest = MANIFEST || path.join(dir, 'library', 'library.json');
const addsFile = path.join(clone, 'library', 'additions.json');

if (!fs.existsSync(addsFile)) { console.log('Nothing is waiting: ' + addsFile + ' does not exist.'); process.exit(0); }
const adds = JSON.parse(fs.readFileSync(addsFile, 'utf8'));
const waiting = adds.items || [];
const man = fs.existsSync(manifest) ? JSON.parse(fs.readFileSync(manifest, 'utf8')) : { title: 'Library', items: [] };
man.items = man.items || [];

const only = ONLY ? ONLY.split(',').map((s) => s.trim()).filter(Boolean) : null;
if (only) only.filter((id) => !waiting.some((e) => e.id === id)).forEach((id) => die('No entry ' + id + ' is waiting.'));
const chosen = only ? waiting.filter((e) => only.indexOf(e.id) >= 0) : waiting;

if (!chosen.length) { console.log('Nothing is waiting.'); process.exit(0); }

const have = new Set(man.items.map((e) => e.id));
const wrong = [];
chosen.forEach((e) => {
  if (!e.id || !e.title) wrong.push((e.id || '(no id)') + ': needs an id and a title');
  else if (have.has(e.id)) wrong.push(e.id + ': the public manifest already has this id');
  else if (e.file && !fs.existsSync(path.join(clone, e.file))) wrong.push(e.id + ': the clone does not hold ' + e.file);
});

chosen.forEach((e) => {
  const held = e.file ? 'private copy ' + e.file : e.url ? 'link out' : 'record only';
  const by = e.added ? ' (added by ' + (e.added.by || '?') + (e.added.date ? ', ' + e.added.date : '') + ')' : '';
  console.log(e.id + '  ' + e.title + (e.author ? ', ' + e.author : '') + '  [' + held + (e.licence ? '; ' + e.licence : '') + ']' + by);
});
if (wrong.length) { wrong.forEach((w) => console.error('  ✗ ' + w)); die('Nothing written.'); }
if (!WRITE) { console.log('\n' + chosen.length + ' waiting. Nothing changed; --write moves them into ' + manifest + '.'); process.exit(0); }

const ids = new Set(chosen.map((e) => e.id));
chosen.forEach((e) => { const o = Object.assign({}, e); delete o.added; man.items.push(o); });
adds.items = waiting.filter((e) => !ids.has(e.id));
fs.mkdirSync(path.dirname(manifest), { recursive: true });
fs.writeFileSync(manifest, JSON.stringify(man, null, 2) + '\n');
fs.writeFileSync(addsFile, JSON.stringify(adds, null, 1) + '\n');
console.log('\n' + chosen.length + ' moved into ' + manifest + '; ' + adds.items.length + ' still waiting. Nothing is committed: commit and push the bench and the private repository.');
