/*
 * versionlist.js - a bench's list of versions, made from its own records in js/versions.js:
 * each version's link and its place in the descent (parent, witness, the versions it also draws
 * on), the chain from the first version to any other, the lines of descent the genealogy
 * follows, and how a version's files are loaded. Loaded before the bench's js/versions.js, in
 * the browser and in Node (the bench's tools require it).
 *   var L = root.SWVersionList || require('../kit/versionlist.js');
 *   var files = L.files;     files(dir, [name | { src, role, … }]): a version's build list
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
 *     findTitle(lines)   the line a file's text begins on (1 by default)
 *     extra        anything else the bench's views read from SWVersions
 *   The bench then sets SWVersions to api (module.exports in Node).
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
    VERSIONS.forEach(function (v) {
      v.url = function () { return '#v=' + encodeURIComponent(v.id); };
      v.parent = P[v.id] || null;
      v.witnessOf = W[v.id] || null;
      v.also = A[v.id] || [];
      v.influence = I[v.id] || [];
    });
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
          return { src: b.src, role: b.role, raw: raw, text: raw, patch: null, title: 1, end: null };
        });
        // the files read as code: program and support, not documentation
        var fs = parts.map(function (p) { return { name: p.src.split('/').pop(), text: p.role === 'doc' ? '' : p.text, doc: p.role === 'doc' }; });
        return { version: v, parts: parts, files: fs };
      });
    }

    var api = { VERSIONS: VERSIONS, TRANSFORMS: o.transforms || {}, DIALECTS: o.dialects || {}, SRC: o.src, LINES: LINES,
                byId: byId, ancestry: ancestry, load: o.load || load, findTitle: o.findTitle || function () { return 1; } };
    var X = o.extra || {};
    for (var k in X) api[k] = X[k];
    return api;
  }
  make.files = files;

  if (typeof module !== 'undefined' && module.exports) module.exports = make;
  else root.SWVersionList = make;
})(typeof window !== 'undefined' ? window : globalThis);
