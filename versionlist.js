/*
 * versionlist.js - a bench's list of versions, made from its own records in js/versions.js:
 * each version's link and its place in the descent (parent, witness, the versions it also draws
 * on), the chain from the first version to any other, the lines of descent the genealogy
 * follows, and how a version's files are loaded. Loaded before the bench's js/versions.js, in
 * the browser and in Node (the bench's tools require it).
 *   var L = root.SWVersionList || require('../kit/versionlist.js');
 *   var files = L.files;     files(dir, [name | { src, role, … }]): a version's build list
 *                            (role: program, support, doc, or text: a witness read and compared
 *                            as plain text, a transcript, a conversation, a log)
 *   L.skipHead(mark, test)   a findTitle that starts a file past the lines at its head that open
 *                            with mark (a transcriber's note) or are blank, for files test(b) accepts
 *   var api = L({ versions, src, dialects, transforms, parent, witness, also, influence, lines,
 *                 load, findTitle, extra });
 *     versions     the records, [{ id, label, date, build, … }]
 *     src          where the source files are, from the page
 *     parent       { id: id }: the version each was made from
 *     witness      { id: id }: another copy or reading of a version, not a step of its own
 *     also         { id: [id] }: other versions it draws on; influence the same, more loosely
 *     lines        [{ id, label, tip }]: the lines of descent, each to its last version; or
 *                  { id, label, ids }: versions in the order given, where no descent is known
 *     load(v, fetchText, splitLines, fetchBytes)   by default each file read as it is held,
 *                  documentation ('doc') shown but not indexed as code
 *     findTitle(lines, b)   the line a file's text begins on (1 by default): the comparisons and
 *                  the genealogy start there, so a transcriber's note at a file's head is left out
 *     extra        anything else the bench's views read from SWVersions
 *   The bench then sets SWVersions to api (module.exports in Node).
 *   api.add(v, { parent, witness, also, influence, line })   a version made in the page (kit/builder.js)
 *                put in the list as the bench's own are; a line of descent whose tip is its parent
 *                (or the line named, made where there is none) then runs to it
 *   api.remove(id)   one taken out again, its lines running to its parent
 * Part of bench-kit (github.com/critical-code-studies/bench-kit).
 */
(function (root) {
  'use strict';

  function files(dir, list) {
    return list.map(function (x) {
      var f = typeof x === 'string' ? { src: x } : x;
      f.src = dir + f.src;
      f.role = f.role || 'program';
      return f;
    });
  }

  function make(o) {
    var VERSIONS = o.versions, P = o.parent || {}, W = o.witness || {}, A = o.also || {}, I = o.influence || {};
    function dress(v, parent, witness, also, influence) {
      v.url = function () { return '#v=' + encodeURIComponent(v.id); };
      v.parent = parent || null;
      v.witnessOf = witness || null;
      v.also = also || [];
      v.influence = influence || [];
    }
    VERSIONS.forEach(function (v) { dress(v, P[v.id], W[v.id], A[v.id], I[v.id]); });
    function byId(id) {
      for (var i = 0; i < VERSIONS.length; i++) if (VERSIONS[i].id === id) return VERSIONS[i];
      return null;
    }
    // The chain from the first version to this one, following parents (a witness stands in
    // for the version it reads).
    function ancestry(id) {
      var v = byId(id), chain = [];
      if (!v) return chain;
      var cur = v.witnessOf || v.id;
      while (cur) { chain.unshift(cur); var p = byId(cur); cur = p && p.parent; }
      if (v.witnessOf) chain[chain.length - 1] = v.id;
      return chain;
    }
    var LINES = o.lines || [];
    // a line is its tip's ancestry, or the versions it lists (ids), where the descent is not known
    LINES.forEach(function (l) { l.ids = l.ids ? l.ids.slice() : ancestry(l.tip); });

    function load(v, fetchText) {
      if (!v.build) return Promise.resolve({ version: v, parts: [], files: [] });
      return Promise.all(v.build.map(function (b) { return fetchText(b.src); })).then(function (texts) {
        var parts = v.build.map(function (b, i) {
          var raw = texts[i];
          // title: the line the text begins on, past any note set at its head (o.findTitle)
          var title = o.findTitle ? o.findTitle(String(raw).replace(/\r\n?/g, '\n').split('\n'), b) || 1 : 1;
          return { src: b.src, role: b.role, raw: raw, text: raw, patch: null, title: title, end: null };
        });
        // the files read as code: program and support, not documentation
        var fs = parts.map(function (p) { return { name: p.src.split('/').pop(), text: p.role === 'doc' ? '' : p.text, doc: p.role === 'doc' }; });
        return { version: v, parts: parts, files: fs };
      });
    }

    function relines() { LINES.forEach(function (l) { if (l.tip) l.ids = ancestry(l.tip); }); }
    function add(v, d) {
      d = d || {};
      if (byId(v.id)) throw new Error('There is already a version ' + v.id + '.');
      dress(v, d.parent, d.witness, d.also, d.influence);
      VERSIONS.push(v);
      var line = d.line ? LINES.filter(function (l) { return l.id === d.line; })[0] : null;
      if (d.line && !line) LINES.push(line = { id: d.line, label: d.lineLabel || d.line, tip: v.id });
      if (line && line.tip) line.tip = v.id;
      else if (!line && v.parent) LINES.forEach(function (l) { if (l.tip === v.parent) l.tip = v.id; });
      relines();
      return v;
    }
    function remove(id) {
      var v = byId(id); if (!v) return false;
      VERSIONS.splice(VERSIONS.indexOf(v), 1);
      for (var i = LINES.length - 1; i >= 0; i--) if (LINES[i].tip === id) { if (v.parent) LINES[i].tip = v.parent; else LINES.splice(i, 1); }
      relines();
      return true;
    }

    var api = { VERSIONS: VERSIONS, TRANSFORMS: o.transforms || {}, DIALECTS: o.dialects || {}, SRC: o.src, LINES: LINES,
                byId: byId, ancestry: ancestry, load: o.load || load, findTitle: o.findTitle || function () { return 1; },
                add: add, remove: remove };
    var X = o.extra || {};
    for (var k in X) api[k] = X[k];
    return api;
  }
  make.files = files;
  // a findTitle that starts a file past its head note: the lines opening with mark, and blanks
  make.skipHead = function (mark, test) {
    return function (lines, b) {
      if (test && !test(b)) return 1;
      for (var i = 0; i < lines.length; i++) { var t = lines[i].replace(/^\s+/, ''); if (t && t.indexOf(mark) !== 0) return i + 1; }
      return 1;
    };
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = make;
  else root.SWVersionList = make;
})(typeof window !== 'undefined' ? window : globalThis);
