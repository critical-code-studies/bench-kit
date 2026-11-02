#!/usr/bin/env node
/*
 * tools/dict-build.js - a dictionary for kit/dictionary.js, from a source: one file, or a folder of
 * shards (index.json and a file to each two first letters) for a large one. Optionally only the
 * entries a list of words needs (a bench's own words, with the lemmas dictionary.js tries).
 *
 *   node tools/dict-build.js webster pg29765.txt --one data/webster.json --words words.txt
 *   node tools/dict-build.js webster pg29765.txt --out data/webster/          every entry, in shards
 *   node tools/dict-build.js json entries.json --one data/glossary.json --name "A glossary"
 *
 * Sources:
 *   webster   Webster's Revised Unabridged Dictionary (1913), Project Gutenberg's plain text (ebook
 *             29765, https://www.gutenberg.org/cache/epub/29765/pg29765.txt, public domain in the
 *             United States); only the definitions are taken, not Gutenberg's text or its name.
 *             A headword is a capitalised line after a blank one ("COLOR; COLOUR" two heads), then
 *             its form line (part of speech, Etym: [...], a field such as (Naut.)), then its senses
 *             ("Defn: …", "1. …", "(a) …"). Up to three entries a head, three senses an entry.
 *   json      [{ head, pos, etym, field, senses }], or a dictionary file already ({ entries }).
 * --words: a file of words (one a line, or a JSON list or { word: n }); the entries kept are those of
 * the words' forms (dictionary.js's forms()). --name, --source, --licence set the file's own lines.
 * Part of bench-kit (github.com/critical-code-studies/bench-kit).
 */
'use strict';
const fs = require('fs'), path = require('path');
require('../dictionary.js');
const D = globalThis.SW.dict;

const args = process.argv.slice(2);
function opt(k) { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : null; }
const kind = args[0], src = args[1];
if (!kind || !src || !/^(webster|json)$/.test(kind) || !(opt('--one') || opt('--out'))) {
  console.error('node tools/dict-build.js webster|json <source> (--one <file.json> | --out <folder>) [--words <file>] [--name …] [--source …] [--licence …]');
  process.exit(1);
}

// ---------- Webster's 1913, from Gutenberg's text ----------
const HEAD = /^[A-Z][A-Z0-9'\- ]*(?:; [A-Z][A-Z0-9'\- ]*)*$/;
const FIELD = /\((Naut|Law|Mil|Bot|Zoöl|Zool|Med|Eccl|Her|Arch|Mus|Gram|Theol|Anat|Chem|Rhet|Logic|Philos|Script|Myth|Falconry|Print|Com|Geol|Mech|Math|Astron|Paint|Fort|Gun|Shipbuilding)\.\)/g;
function webster(text) {
  let lines = text.replace(/\r/g, '').split('\n');
  const a = lines.findIndex(l => l.startsWith('*** START')), z = lines.findIndex(l => l.startsWith('*** END'));
  if (a >= 0 && z > a) lines = lines.slice(a + 1, z);
  const isHead = j => HEAD.test(lines[j]) && (j === 0 || !lines[j - 1].trim()) && j + 1 < lines.length && lines[j + 1].trim();
  const entries = Object.create(null);   // headwords such as CONSTRUCTOR are no object's own properties
  let i = 0;
  while (i < lines.length) {
    if (!isHead(i)) { i++; continue; }
    const heads = lines[i].split(';').map(h => h.trim().toLowerCase());
    let j = i + 1;
    const form = [];
    while (j < lines.length && lines[j].trim()) form.push(lines[j++].trim());
    const formLine = form.join(' ');
    const senses = [];
    while (j < lines.length && !isHead(j)) {
      if (lines[j].trim() && !lines[j - 1].trim()) {
        const par = [];
        while (j < lines.length && lines[j].trim()) par.push(lines[j++].trim());
        const p = par.join(' ');
        if (senses.length && /^\d+\. \([A-Za-zö. ]+\)$/.test(senses[senses.length - 1])) senses[senses.length - 1] += ' ' + p.replace(/^Defn:\s*/, '');   // "1. (Fort.)" alone, its sense the paragraph after
        else if (p.startsWith('Defn:') || /^\d+\. /.test(p) || /^\([a-z]\) /.test(p)) senses.push(p.replace(/^Defn:\s*/, ''));
        continue;
      }
      j++;
    }
    if (senses.length) {
      let pos = formLine.replace(/\s*Etym:.*$/, '');
      pos = pos.includes(',') ? pos.replace(/^[^,]*,\s*/, '') : '';
      const etym = /Etym:\s*\[(.*?)\]/.exec(formLine), fields = [];
      [formLine].concat(senses.slice(0, 3)).forEach(t => { for (const m of t.matchAll(FIELD)) { const f = m[1].startsWith('Zo') ? 'Zool' : m[1]; if (!fields.includes(f)) fields.push(f); } });
      heads.forEach(h => {
        const e = { head: h, pos: pos.trim().slice(0, 60), etym: etym ? etym[1].slice(0, 140) : '', field: fields, senses: senses.slice(0, 3).map(s => s.slice(0, 280)) };
        const list = entries[h] = entries[h] || [];
        if (list.length < 3) list.push(e);
      });
    }
    i = j;
  }
  return entries;
}
function fromJSON(j) {
  if (j && j.entries) return j.entries;
  const entries = Object.create(null);
  (Array.isArray(j) ? j : []).forEach(e => { const h = String(e.head || '').toLowerCase(); if (h) (entries[h] = entries[h] || []).push(e); });
  return entries;
}

let entries = kind === 'webster' ? webster(fs.readFileSync(src, 'utf8')) : fromJSON(JSON.parse(fs.readFileSync(src, 'utf8')));
const all = Object.keys(entries).length;

// only what a list of words needs: each word's forms
const wl = opt('--words');
if (wl) {
  const t = fs.readFileSync(wl, 'utf8').trim();
  let words;
  try { const j = JSON.parse(t); words = Array.isArray(j) ? j : Object.keys(j.words || j); } catch (e) { words = t.split(/\s+/); }
  const keep = Object.create(null);
  words.forEach(w => { const f = D.find(x => entries[x] || null, w); if (f) keep[f.as] = entries[f.as]; });
  entries = keep;
}

const meta = {
  kind: 'bench-kit-dictionary',
  name: opt('--name') || (kind === 'webster' ? 'Webster’s Revised Unabridged Dictionary (1913)' : path.basename(src)),
  source: opt('--source') || (kind === 'webster' ? 'Project Gutenberg ebook 29765, plain text; definitions only' : src),
  licence: opt('--licence') || (kind === 'webster' ? 'Public domain in the United States' : ''),
  made: 'tools/dict-build.js ' + kind + ', ' + new Date().toISOString().slice(0, 10)
};
const n = Object.keys(entries).length;
if (opt('--one')) {
  const out = opt('--one');
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, JSON.stringify(Object.assign({}, meta, { entries }), null, 0));
  console.log(`${n} of ${all} heads; ${out}, ${Math.round(fs.statSync(out).size / 1024)} KB`);
} else {
  const dir = opt('--out'), by = {};
  Object.keys(entries).forEach(w => { const k = D.shardOf(w); (by[k] = by[k] || {})[w] = entries[w]; });
  fs.mkdirSync(dir, { recursive: true });
  const keys = Object.keys(by).sort();
  keys.forEach(k => fs.writeFileSync(path.join(dir, k + '.json'), JSON.stringify({ entries: by[k] })));
  fs.writeFileSync(path.join(dir, 'index.json'), JSON.stringify(Object.assign({}, meta, { heads: n, shards: keys }), null, 1));
  console.log(`${n} of ${all} heads in ${keys.length} shards; ${dir}`);
}
