/*
 * lang-maclisp.js - MacLisp source, for bench-kit's genealogy and compare (kit/genealogy.js):
 * a comment runs from the first ";" not escaped by "/"; there are no labels or titles; a
 * routine is a top-level form (a line beginning "(" at the left margin) with the comment
 * lines above it, named by what it defines; a section is a whole file, named without its
 * ITS version number. From the SHRDLU bench. A bench uses it with SW.BENCH.lang = 'maclisp'.
 */
(function (root) {
  'use strict';
  var H;   // the genealogy's helpers, given on use

  // Page marks removed, lower case, whitespace collapsed (MacLisp read case
  // and layout as nothing).
  function normalize(s) {
    return String(s).replace(/[\f\u0003]/g, '').toLowerCase().replace(/\s+/g, ' ').replace(/^ | $/g, '');
  }

  /*
   * parseLine(s) -> {labels, code, comment, kind}
   * MacLisp: a comment runs from the first ";" not escaped by "/". No labels.
   */
  function parseLine(s) {
    s = String(s).replace(/[\r\n]+$/, '').replace(/[\f\u0003]/g, '');
    if (/^[\s\v]*$/.test(s)) return { labels: [], code: '', comment: '', kind: 'blank' };
    var ci = -1;
    for (var i = 0; i < s.length; i++) {
      if (s.charAt(i) === '/') { i++; continue; }
      if (s.charAt(i) === ';') { ci = i; break; }
    }
    var code = (ci < 0 ? s : s.slice(0, ci)).replace(/^\s+|\s+$/g, '');
    var comment = ci < 0 ? '' : s.slice(ci).replace(/^;+\s*/, '').replace(/\s+$/, '');
    return { labels: [], code: code, comment: comment, kind: code ? 'code' : (ci >= 0 ? 'comment' : 'blank') };
  }

  function stemOf(src) { return String(src).split('/').pop().replace(/\.\d+$/, '').replace(/^demo\.flick$/, 'demo'); }

  // No titles; a line beginning "(" at the left margin opens a top-level form
  function prepareLine(t, p) { p.top = /^\(/.test(t); return p; }

  /*
   * Routine: a top-level form, a line beginning "(" at the left margin (a
   * DEFUN, a theorem, a dictionary word, a grammar program, a SETQ), with the
   * comment lines above it; named by what it defines.
   */
  function routineUnits(text, o) {
    var L = text.lines, starts = [], names = [], last = -1;
    for (var i = 0; i < L.length; i++) {
      var l = L[i], first = i === 0 || L[i - 1].part !== l.part;
      if (!(l.top || first)) continue;
      var s = first ? i : headerStart(L, i, last);
      if (starts.length && s <= starts[starts.length - 1]) s = starts[starts.length - 1] + 1;
      if (s > i) s = i;
      if (starts.length && starts[starts.length - 1] === s) continue;
      var m = /^\((\S+)\s+(\S+)/.exec(l.code || ''), name = m ? (/^(DEFUN|DEFPROP|DEFS|PDEFINE|SETQ)$/i.test(m[1]) ? m[2].replace(/\)+$/, '') : m[1]) : (l.stem + ' (head)');
      starts.push(s); names.push(name.toUpperCase()); last = i;
    }
    return unitsFromStarts(text, starts, names, 'routine', o);
  }

  /*
   * Section: a whole file, named without its ITS version number, so that
   * plnr.182 and plnr are the same section.
   */
  function sectionUnits(text, o) {
    var L = text.lines, starts = [], names = [];
    for (var i = 0; i < L.length; i++) if (i === 0 || L[i - 1].part !== L[i].part) { starts.push(i); names.push(L[i].stem); }
    return unitsFromStarts(text, starts, names, 'section', o);
  }

  function words(s, n) { return H.words(s, n); }
  function headerStart(L, s, f) { return H.headerStart(L, s, f); }
  function firstWords(L, i) { return H.firstWords(L, i); }
  function unitsFromStarts(text, starts, names, kind, o) { return H.unitsFromStarts(text, starts, names, kind, o); }

  root.SWLang = root.SWLang || {};
  root.SWLang.maclisp = {
    normalize: normalize, parseLine: parseLine, prepareLine: prepareLine, stem: stemOf,
    // documentation files are never compared; support files only when asked
    skipPart: function (part, opts) { return part.role === 'doc' || (part.role !== 'program' && part.role !== 'text' && !opts.includeSupplied); },
    routineUnits: function (text, o, h) { H = h; return routineUnits(text, o); },
    sectionUnits: function (text, o, h) { H = h; return sectionUnits(text, o); }
  };
})(typeof window !== 'undefined' ? window : globalThis);
