/*
 * lang-plain.js - source text in any language, for bench-kit's genealogy and compare
 * (kit/genealogy.js), set by the bench rather than written for one language:
 *   SW.BENCH.comment   the marks that begin a comment to the end of the line ('#', or ['//', ';'])
 *   SW.BENCH.routine   a regular expression (a string) for the line that begins a routine, its
 *                      name in the first group ('^\\s*(?:def|class)\\s+(\\w+)' for Python)
 *   SW.BENCH.caseFold  true where case means nothing in the language (compared in lower case)
 * A comment mark inside quotes is taken as a comment all the same: give the bench its own
 * adapter where that matters. A section is a whole file. A bench uses it with
 * SW.BENCH.lang = 'plain'.
 * Part of bench-kit (github.com/critical-code-studies/bench-kit).
 */
(function (root) {
  'use strict';
  var H;   // the genealogy's helpers, given on use

  function B() { return (root.SW && root.SW.BENCH) || {}; }
  function marks() { var c = B().comment; return (Array.isArray(c) ? c : [c == null ? '#' : c]).filter(Boolean); }
  function routineRE() { var r = B().routine; return r ? new RegExp(r) : null; }

  // Whitespace collapsed; lower case where the bench says case means nothing.
  function normalize(s) {
    s = String(s).replace(/[\f\u0003]/g, '');
    if (B().caseFold) s = s.toLowerCase();
    return s.replace(/\s+/g, ' ').replace(/^ | $/g, '');
  }

  /*
   * parseLine(s) -> {labels, code, comment, kind}
   * A comment runs from the first of the bench's comment marks to the end of the line.
   */
  function parseLine(s) {
    s = String(s).replace(/[\r\n]+$/, '').replace(/[\f\u0003]/g, '');
    if (/^[\s\v]*$/.test(s)) return { labels: [], code: '', comment: '', kind: 'blank' };
    var ci = -1, mk = '';
    marks().forEach(function (m) { var i = s.indexOf(m); if (i >= 0 && (ci < 0 || i < ci)) { ci = i; mk = m; } });
    var code = (ci < 0 ? s : s.slice(0, ci)).replace(/^\s+|\s+$/g, '');
    var comment = ci < 0 ? '' : s.slice(ci + mk.length).replace(/^\s+|\s+$/g, '');
    return { labels: [], code: code, comment: comment, kind: code ? 'code' : (ci >= 0 ? 'comment' : 'blank') };
  }

  function stemOf(src) { return String(src).split('/').pop(); }

  // A line that begins a routine, by the bench's pattern
  function prepareLine(t, p) { var re = routineRE(), m = re && re.exec(t); p.top = !!m; p.routine = m ? (m[1] || m[0]).trim() : ''; return p; }

  /*
   * Routine: from a line the bench's pattern matches, with the comment lines above it,
   * named by the pattern's first group. Without a pattern each file is one routine.
   */
  function routineUnits(text, o) {
    var L = text.lines, starts = [], names = [], last = -1;
    for (var i = 0; i < L.length; i++) {
      var l = L[i], first = i === 0 || L[i - 1].part !== l.part;
      if (!(l.top || first)) continue;
      var s = first ? i : H.headerStart(L, i, last);
      if (starts.length && s <= starts[starts.length - 1]) s = starts[starts.length - 1] + 1;
      if (s > i) s = i;
      if (starts.length && starts[starts.length - 1] === s) continue;
      starts.push(s); names.push(l.top ? l.routine : l.stem + ' (head)'); last = i;
    }
    return H.unitsFromStarts(text, starts, names, 'routine', o);
  }

  // Section: a whole file.
  function sectionUnits(text, o) {
    var L = text.lines, starts = [], names = [];
    for (var i = 0; i < L.length; i++) if (i === 0 || L[i - 1].part !== L[i].part) { starts.push(i); names.push(L[i].stem); }
    return H.unitsFromStarts(text, starts, names, 'section', o);
  }

  root.SWLang = root.SWLang || {};
  root.SWLang.plain = {
    normalize: normalize, parseLine: parseLine, prepareLine: prepareLine, stem: stemOf,
    // documentation files are never compared; support files only when asked
    skipPart: function (part, opts) { return part.role === 'doc' || (!(part.role === 'program' || part.role === 'text') && !opts.includeSupplied); },
    routineUnits: function (text, o, h) { H = h; return routineUnits(text, o); },
    sectionUnits: function (text, o, h) { H = h; return sectionUnits(text, o); }
  };
})(typeof window !== 'undefined' ? window : globalThis);
