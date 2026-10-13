/*
 * builds.js - a bench's texts fetched and built: the unit every view reads from. A "build" is one
 * version fetched (SWVersions.load), read as the bench reads its language, and indexed; builds
 * are cached, so moving between views or comparing versions never reads the files again. Loaded
 * after kit/refs.js and before the bench's js/core.js, which calls
 *   SW.builds({ read, split, key, meta })
 *     read(v, L, extra)  the build of version v from what SWVersions.load gave (L.parts, L.files):
 *                        { v, dialect, parts, asm, lines, errorsAt, kind, sym, … }, as the views
 *                        read it (the kit times it as b.ms)
 *     split(text)        how a file divides into lines, for SWVersions.load
 *     key(v, extra)      the cache's key, where a version builds more than one way (an
 *                        assembler's dialect); by default the version's id
 *     meta(b)            [[label, value]]: the bench's rows in an export's details, before
 *                        Generated (how the text was read)
 * It gives SW.build(id, extra), SW.current(), SW.fetchText(path), SW.fetchBytes(path),
 * SW.openAt(vid, a), SW.docMeta(b) and SW.oct(n, width).
 * Part of bench-kit (github.com/critical-code-studies/bench-kit).
 */
(function (root) {
  'use strict';
  var SW = root.SW, B = SW.BENCH;
  function V() { return root.SWVersions; }

  SW.BASE_URI = SW.BASE_URI || B.base;
  // a number in octal, at least w digits (6 by default), for the views that show machine words
  SW.oct = function (n, w) { if (n == null) return ''; var s = (n >>> 0).toString(8); while (s.length < (w || 6)) s = '0' + s; return s; };

  // ---------- fetching ----------
  function urlOf(path) { return V().SRC + path.split('/').map(encodeURIComponent).join('/'); }
  var textCache = {};
  SW.fetchText = function (path) {
    if (textCache[path]) return textCache[path];
    // revalidated, so a corrected transcription is not served from an old cache
    textCache[path] = fetch(urlOf(path), { cache: 'no-cache' }).then(function (r) {
      if (!r.ok) throw new Error('Could not fetch ' + path + ' (' + r.status + ')');
      return r.text();
    });
    textCache[path].catch(function () { delete textCache[path]; });
    return textCache[path];
  };
  SW.fetchBytes = function (path) {
    return fetch(urlOf(path)).then(function (r) {
      if (!r.ok) throw new Error('Could not fetch ' + path);
      return r.arrayBuffer();
    }).then(function (b) { return new Uint8Array(b); });
  };

  // ---------- building ----------
  var cfg = {}, buildCache = {};
  SW.builds = function (c) { cfg = c || {}; };
  SW.build = function (id, extra) {
    var v = V().byId(id);
    if (!v) return Promise.reject(new Error('Unknown version ' + id));
    var key = cfg.key ? cfg.key(v, extra) : id;
    if (buildCache[key]) return buildCache[key];
    buildCache[key] = V().load(v, SW.fetchText, cfg.split, SW.fetchBytes).then(function (L) {
      var t0 = performance.now();
      var b = cfg.read ? cfg.read(v, L, extra) : { v: v, dialect: v.dialect, parts: L.parts, asm: null };
      b.ms = Math.round(performance.now() - t0);
      return b;
    });
    buildCache[key].catch(function () { delete buildCache[key]; });
    return buildCache[key];
  };
  SW.current = function () { return SW.state.v ? SW.build(SW.state.v) : Promise.reject(new Error('no version')); };

  // Open a version at a line range (or its record when there is none).
  SW.openAt = function (vid, a) {
    var same = !vid || vid === SW.state.v;
    if (!same) SW.select(vid);
    if (!a) { SW.setTab('about'); return; }
    SW.state.sel = { p: a.p, n0: a.n0, n1: a.n1 != null ? a.n1 : a.n0 };
    SW.setTab('read');   // draws Read at the selection if it was not yet showing this version
    if (same) SW.emit('goto', { p: a.p, n: a.n0, tab: 'read' });
  };

  // An export's details: the version, its reference, date, authors and sources, the bench's own
  // rows, and when and by what it was made.
  SW.docMeta = function (b) {
    return [
      ['Version', b.v.label], ['Reference', SW.refText(b.v.id)], ['Date', b.v.date], ['Authors', b.v.authors],
      ['Sources', b.parts.map(function (p) { return p.src + (!SW.mainPart(p) ? ' (' + p.role + ')' : ''); }).join('; ')]
    ].concat(cfg.meta ? cfg.meta(b) : []).concat([['Generated', SW.fmtDate(SW.today()) + ', ' + (B.title || 'Research Bench') + ' v' + SW.VERSION]]);
  };
})(typeof window !== 'undefined' ? window : globalThis);
