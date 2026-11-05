#!/usr/bin/env node
/*
 * tools/iiif-map.js - a bench's image map from a IIIF manifest (Presentation 2 or 3): each image in
 * the manifest's order, with its image service, size and label, written as a script the bench loads
 * (and as JSON), so that its pages' images come from the holding library's own service. Lifted from
 * the Melville bench's tools/leaves.py. Optionally a copy of each image fetched into the bench's
 * folder, at a size the holder allows, with a record of where every file came from.
 *
 *   node research/kit/tools/iiif-map.js https://dl.ndl.go.jp/api/iiif/1037966/manifest.json --out js/images.js
 *   node kit/tools/iiif-map.js manifest.json --out js/images.js --name SWImages --key 'img_{seq}' \
 *        --credit "National Diet Library" --map pages.csv --fetch img/pages --width 560 --large 1600
 *
 *   --out <file.js>     the script (and <file>.json beside it): root[name] = { manifest, label, credit,
 *                       images: { key: { seq, label, service, v, w, h, canvas, region } } }
 *   --name <global>     (SWImages)        --key <template>   each image's key: {seq} (1, 2, …), {seq3} (001),
 *                       {label} (the canvas's label); 'seq' if not given
 *   --map <file.csv>    instead, the bench's own keys: lines key,seq[,region], region one of left, right
 *                       (half a spread), IIIF's x,y,w,h or pct:x,y,w,h; a key may take part of an image
 *   --credit "…"        the credit kept with the map (shown by the bench beside each image)
 *   --fetch <folder>    copies of the images in the bench: <key>.jpg (--width wide, 560) and
 *                       <key>-large.jpg (no more than --large on the long side, 1600), with
 *                       provenance.csv; only where the holder's terms allow copies to be held
 * In the bench's config (Book's images, kit/book.js):
 *   image: function (pb) { var x = root.SWImages.images[pb.img || pb.facs]; return SW.iiifImage(x); }
 * (SW.iiifImage, kit/base.js: { src, large, sharp }, a region where the map gives one, o.held for the
 * copies fetched.)
 * Needs Node 18 or later; no packages.
 * Part of bench-kit (github.com/critical-code-studies/bench-kit).
 */
'use strict';
const fs = require('fs'), path = require('path');
const args = process.argv.slice(2);
function opt(k, d) { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; }
const src = args[0], out = opt('--out');
if (!src || !out) { console.error('node tools/iiif-map.js <manifest URL or file> --out <file.js> [--name …] [--key …] [--map …] [--credit …] [--fetch <folder> --width 560 --large 1600]'); process.exit(1); }
const NAME = opt('--name', 'SWImages'), KEY = opt('--key', '{seq}'), W = +opt('--width', 560), L = +opt('--large', 1600);

async function get(url, binary) {
  for (let k = 0; k < 4; k++) {
    try {
      const r = await fetch(url, { headers: { 'User-Agent': 'bench-kit iiif-map (github.com/critical-code-studies/bench-kit)' } });
      if (!r.ok) throw new Error(url + ': ' + r.status);
      return binary ? Buffer.from(await r.arrayBuffer()) : r.text();
    } catch (e) { if (k === 3) throw e; await new Promise((res) => setTimeout(res, 1500 * (k + 1))); }
  }
}
function text(x) {   // a label in either version: a string, { none: [..] } / { en: [..] }, or [{ @value }]
  if (x == null) return '';
  if (typeof x === 'string') return x;
  if (Array.isArray(x)) return x.map(text).join(' ');
  if (x['@value']) return x['@value'];
  const k = Object.keys(x)[0]; return k ? text(x[k]) : '';
}
// the manifest's images, in order: Presentation 3 (items) or 2 (sequences[0].canvases)
function canvases(m) {
  const v3 = Array.isArray(m.items), cs = v3 ? m.items : ((m.sequences || [])[0] || {}).canvases || [];
  return cs.map((c, i) => {
    let res, svc;
    if (v3) { const a = (((c.items || [])[0] || {}).items || [])[0] || {}; res = a.body || {}; svc = [].concat(res.service || [])[0] || {}; }
    else { const a = (c.images || [])[0] || {}; res = a.resource || {}; svc = [].concat(res.service || [])[0] || {}; }
    const sid = svc.id || svc['@id'] || '', ctx = JSON.stringify(svc['@context'] || svc.type || '');
    return { seq: i + 1, label: text(c.label), canvas: c.id || c['@id'], service: sid.replace(/\/$/, ''), v: /image\/3|ImageService3/.test(ctx) ? 3 : 2, w: c.width, h: c.height };
  });
}
// a region as a level 1 service takes it: a half of a spread in pixels, from the image's size
function region(x) {
  const r = x.region || 'full', w = x.w, h = x.h, half = Math.floor((w || 0) / 2);
  if (r === 'left' && w) return { r: '0,0,' + half + ',' + h, w: half, h };
  if (r === 'right' && w) return { r: half + ',0,' + (w - half) + ',' + h, w: w - half, h };
  const m = /^(\d+),(\d+),(\d+),(\d+)$/.exec(r);
  return m ? { r, w: +m[3], h: +m[4] } : { r, w, h };
}
function keyOf(c) { return KEY.replace('{seq}', c.seq).replace('{seq3}', String(c.seq).padStart(3, '0')).replace('{label}', c.label); }

(async () => {
  const m = JSON.parse(/^https?:/.test(src) ? await get(src) : fs.readFileSync(src, 'utf8'));
  const cs = canvases(m);
  if (!cs.length) throw new Error('no images in the manifest');
  const images = {};
  if (opt('--map')) {
    fs.readFileSync(opt('--map'), 'utf8').split(/\r?\n/).forEach((line, i) => {
      const t = line.trim(); if (!t || t.startsWith('#') || (i === 0 && /^key\b/i.test(t))) return;
      const [key, seq, ...rest] = t.split(','), c = cs[+seq - 1];
      if (!c) throw new Error('--map line ' + (i + 1) + ': no image ' + seq);
      images[key.trim()] = Object.assign({}, c, rest.length ? { region: rest.join(',').trim() } : {});
    });
  } else cs.forEach((c) => { images[keyOf(c)] = c; });
  Object.keys(images).forEach((k) => { images[k].key = k; });
  const map = { manifest: m.id || m['@id'] || src, label: text(m.label), credit: opt('--credit', text(m.attribution || m.requiredStatement && m.requiredStatement.value) || ''), made: new Date().toISOString().slice(0, 10), images };
  fs.mkdirSync(path.dirname(path.resolve(out)), { recursive: true });
  fs.writeFileSync(out.replace(/\.js$/, '') + '.json', JSON.stringify(map, null, 1) + '\n');
  fs.writeFileSync(out, '/* ' + path.basename(out) + ' - the images of ' + (map.label || map.manifest).replace(/\*\//g, '') + ', each with its IIIF image service\n' +
    ' * (made by bench-kit\'s tools/iiif-map.js from ' + map.manifest + ', ' + map.made + '). */\n' +
    '(function (root) { root.' + NAME + ' = ' + JSON.stringify(map) + '; })(typeof window !== \'undefined\' ? window : globalThis);\n');
  console.log(Object.keys(images).length + ' images from ' + cs.length + ' in the manifest; ' + out + ' and ' + out.replace(/\.js$/, '') + '.json');

  const dir = opt('--fetch');
  if (!dir) return;
  // copies held in the bench: the service asked for a size within the limits, as a level 1 service
  // answers (a region in pixels, a size by width or by height); one that rounds up is asked again, a pixel smaller
  fs.mkdirSync(dir, { recursive: true });
  const rows = [['file', 'file_large', 'key', 'seq', 'label', 'region', 'service', 'canvas', 'manifest', 'credit', 'fetched']];
  function jpegSize(b) { let i = 2; while (i < b.length) { if (b[i] !== 0xFF) { i++; continue; } const k = b[i + 1], n = b.readUInt16BE(i + 2); if (k >= 0xC0 && k <= 0xC2) return [b.readUInt16BE(i + 7), b.readUInt16BE(i + 5)]; i += 2 + n; } return null; }
  const keys = Object.keys(images);
  for (let i = 0; i < keys.length; i++) {
    const k = keys[i], x = images[k], g = region(x), reg = g.r;
    const tall = g.h > g.w;
    for (const [suffix, wide, side] of [['', Math.min(W, g.w || W), null], ['-large', null, Math.min(L, Math.max(g.w || L, g.h || L))]]) {
      const f = path.join(dir, k + suffix + '.jpg');
      if (fs.existsSync(f) && fs.statSync(f).size > 0) continue;
      let data;
      for (let less = 0; less < 4; less++) {
        data = await get(x.service + '/' + reg + '/' + (wide ? (wide - less) + ',' : tall ? ',' + (side - less) : (side - less) + ',') + '/0/default.jpg', true);
        const s = jpegSize(data); if (!s) throw new Error(k + suffix + ': not a JPEG');
        if ((!wide || s[0] <= wide) && (!side || Math.max(s[0], s[1]) <= side)) break;
      }
      fs.writeFileSync(f + '.part', data); fs.renameSync(f + '.part', f);
    }
    rows.push([path.join(dir, k + '.jpg'), path.join(dir, k + '-large.jpg'), k, x.seq, x.label, x.region || '', x.service, x.canvas, map.manifest, map.credit, map.made]);
    process.stdout.write('\r  ' + (i + 1) + ' of ' + keys.length);
  }
  const csv = (v) => /[",\n]/.test(String(v)) ? '"' + String(v).replace(/"/g, '""') + '"' : String(v);
  fs.writeFileSync(path.join(dir, 'provenance.csv'), rows.map((r) => r.map(csv).join(',')).join('\n') + '\n');
  console.log('\n' + keys.length + ' images held in ' + dir + ', with provenance.csv');
})().catch((e) => { console.error('iiif-map: ' + e.message); process.exit(1); });
