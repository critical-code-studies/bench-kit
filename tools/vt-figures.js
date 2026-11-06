#!/usr/bin/env node
/*
 * tools/vt-figures.js - a translation's figures brought into its bench. It reads the translation's
 * figure list (figures/figures.csv, the vector translation method's), its labels (overlays.json beside
 * the list) and the captions after the image lines in the translation, and checks them against one
 * another: every image line has a row and every row an image line, the file names agree, the files
 * exist, the flag agrees with the text. Where all agree it copies the print files to the bench's
 * figures/ and the originals to figures/raw/, and writes figures/figures.json (the Images tab's
 * records, kit/images.js) and figures/overlays.json. Where any disagree it says which, writes nothing
 * and exits 1. Run from the bench's folder, again whenever the list changes:
 *
 *   node kit/tools/vt-figures.js <translation root>
 *   node kit/tools/vt-figures.js ../my-translation --out . --check
 *
 *   --out <folder>      the bench (the current folder if not given)
 *   --check             check only; nothing is written
 *   --text <file>       the translation, from the root (more than one: --text a.md --text b.md). If not
 *                       given, the files of the bench's translation version (js/versions.js) at the same
 *                       path under the root or by name at its top, else text/translation/*.md
 *   --list <file>       the list, from the root: else SW.BENCH.translation.figures.list, else figures/figures.csv
 *   --overlays <file>   the labels, from the root: else translation.figures.overlays, else beside the list
 * The list's columns: n,file,original,page,image,region,overlays,placement,labels_note (the method's
 * templates). region is x,y,w,h in pixels of the full-size image; where the bench has an image map
 * (js/images.json, kit/tools/iiif-map.js) image and region are checked against it. No IIIF service is
 * assumed. docs/figure-labels.md gives the labels' format. Nothing already in the bench's figures/ is
 * deleted; a file there that the list no longer names is reported.
 * Needs Node 18 or later; no packages.
 * Part of bench-kit (github.com/critical-code-studies/bench-kit).
 */
'use strict';
const fs = require('fs'), path = require('path');
const VT = require('../vt-reader.js');
const args = process.argv.slice(2);
function opt(k) { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : null; }
function opts(k) { return args.filter((a, i) => args[i - 1] === k); }
function die(m) { console.error('vt-figures: ' + m); process.exit(1); }
const root = args[0] && !args[0].startsWith('--') ? path.resolve(args[0]) : null;
if (!root) die('node tools/vt-figures.js <translation root> [--out <bench>] [--check] [--text <file>] [--list <file>] [--overlays <file>]');
if (!fs.existsSync(root)) die('no folder ' + root);
const out = path.resolve(opt('--out') || '.');
const inRoot = (p) => path.join(root, p), has = (p) => fs.existsSync(inRoot(p)) && fs.statSync(inRoot(p)).isFile();

// the bench's descriptor and its translation's files, as its own scripts give them
let desc = {}, files = [];
const cfg = path.join(out, 'js/config.js');
if (fs.existsSync(cfg)) { try { globalThis.SW = globalThis.SW || {}; require(cfg); desc = (globalThis.SW.BENCH || {}).translation || {}; } catch (e) { console.log('Note: js/config.js could not be read here (' + e.message + '); give --list and --text if they are not in the usual places.'); } }
const verFile = path.join(out, 'js/versions.js');
if (fs.existsSync(verFile)) { try { const V = require(verFile), id = VT.layout(desc).versions && VT.layout(desc).versions.translation || 'translation', v = V.byId && V.byId(id); files = ((v && v.build) || []).map((f) => f.src); } catch (e) { /* --text, or the method's layout */ } }

let texts = opts('--text');
if (!texts.length) texts = files.map((f) => has(f) ? f : has(path.basename(f)) ? path.basename(f) : null).filter(Boolean);
if (!texts.length && fs.existsSync(inRoot('text/translation'))) texts = fs.readdirSync(inRoot('text/translation')).filter((f) => /\.md$/.test(f)).sort().map((f) => 'text/translation/' + f);
if (!texts.length) die('no translation found under ' + root + ': give --text <file>');
texts.forEach((t) => { if (!has(t)) die('no file ' + t + ' under ' + root); });

const F = desc.figures || {}, list = opt('--list') || F.list || 'figures/figures.csv';
if (!has(list)) die('no figure list ' + list + ' under ' + root + ': give --list <file>, or translation.figures.list in js/config.js');
const labelsAt = opt('--overlays') || F.overlays || path.join(path.dirname(list), 'overlays.json');
let overlays = {};
if (has(labelsAt)) { try { overlays = JSON.parse(fs.readFileSync(inRoot(labelsAt), 'utf8')); } catch (e) { die(labelsAt + ' is not JSON: ' + e.message); } }
else console.log('Note: no ' + labelsAt + ': no labels.');
let images = null;
const mapFile = path.join(out, 'js/images.json');
if (fs.existsSync(mapFile)) { try { images = JSON.parse(fs.readFileSync(mapFile, 'utf8')).images || null; } catch (e) { console.log('Note: js/images.json could not be read, so images and regions are not checked.'); } }

const r = VT.figures({
  csv: fs.readFileSync(inRoot(list), 'utf8'),
  texts: texts.map((p) => ({ path: p, t: VT.read(fs.readFileSync(inRoot(p), 'utf8'), desc) })),
  overlays, images, exists: has
});
r.notes.forEach((n) => console.log('Note: ' + n));
const off = r.items.filter((f) => !f.overlays).map((f) => f.n), nl = r.items.filter((f) => f.overlays).reduce((a, f) => a + (overlays[path.basename(f.file)] || []).length, 0);
console.log(r.items.length + ' figures in ' + list + ', against ' + texts.join(', ') + ': ' + (r.items.length - off.length) + ' with labels (' + nl + ' labels), ' + off.length + ' with the key beside the image' + (off.length ? ' (' + off.join(', ') + ')' : '') + (images ? '; image map checked' : '') + '.');
if (r.problems.length) {
  console.error('\n' + r.problems.length + ' mismatch' + (r.problems.length > 1 ? 'es' : '') + ':');
  r.problems.forEach((p) => console.error('  ' + p));
  console.error('\nNothing written.');
  process.exit(1);
}
if (args.includes('--check')) { console.log('All agree. Nothing written (--check).'); process.exit(0); }

fs.mkdirSync(path.join(out, 'figures/raw'), { recursive: true });
r.copies.forEach((c) => fs.copyFileSync(inRoot(c.from), path.join(out, c.to)));
fs.writeFileSync(path.join(out, 'figures/figures.json'), JSON.stringify({ items: r.items }, null, 1) + '\n');
fs.writeFileSync(path.join(out, 'figures/overlays.json'), JSON.stringify(overlays, null, 1) + '\n');
console.log('Wrote figures/figures.json and figures/overlays.json, and copied ' + r.copies.length + ' files, in ' + out + '.');
const named = new Set(r.copies.map((c) => c.to).concat(['figures/figures.json', 'figures/overlays.json']));
const left = [];
for (const d of ['figures', 'figures/raw']) for (const f of fs.readdirSync(path.join(out, d))) if (fs.statSync(path.join(out, d, f)).isFile() && !named.has(d + '/' + f)) left.push(d + '/' + f);
if (left.length) console.log('In figures/ and not on the list (left where they are): ' + left.join(', '));
