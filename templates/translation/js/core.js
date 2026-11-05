/*
 * core.js - this bench's own part of reading its texts, on bench-kit's kit/vt-reader.js: each file
 * of a translation read as the vector translation method lays it out (lines, page and image markers,
 * sections, notes), and set as Book's document (b.doc), a page break at each page marker. The OCR is
 * read as plain lines. Fetching, the cache of builds and opening a version at a line are the kit's
 * (kit/builds.js).
 */
(function (root) {
  'use strict';
  var SW = root.SW, B = SW.BENCH, VT = root.SWVT;

  // a line is all text: no code and comment
  SW.parseLine = function (raw) { return { labels: [], loc: '', code: String(raw || '').replace(/\n$/, ''), comment: '' }; };

  SW.builds({
    read: function (v, L) {
      var b = { v: v, dialect: v.dialect, parts: L.parts, asm: null, errorsAt: {}, kind: {}, sym: {} };
      var desc = B.translation, isText = v.id !== (desc.versions || {}).ocr;
      b.vt = b.parts.map(function (p) { return isText ? VT.read(p.raw, desc) : null; });
      b.lines = b.parts.map(function (p, pi) { return VT.splitLines(p.raw).map(function (r, i) { return { p: pi, n: i + 1, raw: r, norm: r }; }); });
      // what each line is, for Read's marks: a heading as def (listed among the sections), a note as com
      b.vt.forEach(function (t, pi) {
        if (!t) return;
        t.lines.forEach(function (L) {
          if (L.kind === 'head') { b.kind[pi + ':' + L.n] = 'def'; if (!b.sym[L.title]) b.sym[L.title] = { name: L.title, p: pi, n: L.n }; }
          else if (L.kind === 'note' || L.kind === 'working') b.kind[pi + ':' + L.n] = 'com';
        });
      });
      if (isText) b.doc = b.vt.map(function (t) { return VT.doc(t, { bodyOnly: false }); });
      return b;
    }
  });

  // ghosts: lines as keys, spacing and case set aside
  SW.lineKey = function (t) { return String(t || '').replace(/\[(p\.|コマ) [^\]]*\]/g, '').replace(/\s+/g, ' ').trim().toLowerCase(); };
})(this);
