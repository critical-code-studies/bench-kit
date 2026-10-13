/*
 * lang-macro.js - the PDP-1 MACRO assembler's text, for bench-kit's genealogy and compare
 * (kit/genealogy.js): how a line divides into labels, code and comment; its normalised
 * form; which lines are titles (a tape's title line, the line after a start); where a
 * routine begins (a labelled line after a comment, or one the code above cannot fall
 * into; a define) and where a section (a part, a headed block, the macros, the storage
 * tail). From the Spacewar! bench. A bench uses it with SW.BENCH.lang = 'macro'.
 */
(function (root) {
  'use strict';
  var H;   // the genealogy's helpers (unitsFromStarts, headerStart, words, firstWords), given on use

  // Overbar marks (\x, ~x, leading .x before a letter) removed, lower case,
  // whitespace collapsed and dropped around commas.
  function normalize(s) {
    return String(s).toLowerCase()
      .replace(/[\\~]/g, '')
      .replace(/(^|[^a-z0-9.])\.([a-z])/g, '$1$2')
      .replace(/\s+/g, ' ')
      .replace(/ ?, ?/g, ',')
      .replace(/^ | $/g, '');
  }

  /*
   * parseLine(s) -> {labels, code, comment, kind}
   * A '/' directly after a non-blank character is a location assignment
   * ("3/", ". 20/"), part of the code; any other '/' starts the comment.
   * Labels are "name," tokens at the very start of the line (no indent),
   * possibly several ("tno,  6,").
   */
  function parseLine(s) {
    s = String(s).replace(/[\r\n]+$/, '');
    if (/^[\s\f\v]*$/.test(s)) return { labels: [], code: '', comment: '', kind: 'blank' };
    var ci = -1;
    for (var i = 0; i < s.length; i++) {
      if (s.charAt(i) !== '/') continue;
      if (i === 0 || /\s/.test(s.charAt(i - 1))) { ci = i; break; }
    }
    var codePart = ci < 0 ? s : s.slice(0, ci);
    var comment = ci < 0 ? '' : s.slice(ci + 1).replace(/^\s+|\s+$/g, '');
    var labels = [];
    var m, rest = codePart;
    // a label pushed right by spaces alone (the page-break padding in the dfw
    // transcription, '<65 spaces>a1,') is still a label; a tab starts the code field
    if (/^ +[A-Za-z0-9.~\\]+[ \t]*,/.test(rest)) rest = rest.replace(/^ +/, '');
    if (!/^\s/.test(rest)) {
      while ((m = /^([A-Za-z0-9.~\\]+)[ \t]*,[ \t]*/.exec(rest))) {
        labels.push(m[1]);
        rest = rest.slice(m[0].length);
      }
    }
    var code = rest.replace(/^\s+|\s+$/g, '');
    var kind = (code || labels.length) ? 'code' : (comment || ci >= 0 ? 'comment' : 'blank');
    return { labels: labels, code: code, comment: comment, kind: kind };
  }

  var TITLE_RE = /^\s*(spacewar|scorer)\b/i;
  // A line as prepare reads it: a title (the part's first line, a title line, the line after
  // a start), or as parseLine gives it; state carries afterStart through a part.
  function prepareLine(t, p, n, from, state) {
    var isTitle = n === from || (TITLE_RE.test(t) && !/^\s*\//.test(t)) ||
                  (state.afterStart && p.kind !== 'blank');
    if (isTitle && p.kind !== 'blank') {
      p = { labels: [], code: t.replace(/^\s+|\s+$/g, ''), comment: '', kind: 'title' };
      state.afterStart = false;
    } else if (p.kind === 'code' && /^start\b/i.test(p.code)) state.afterStart = true;
    return p;
  }

  function isDefine(l) { return l.kind === 'code' && /^defin[a-z]*( |$)/.test(l.norm); }
  function isTerm(l) { return l.kind === 'code' && /^term[a-z]*$/.test(l.norm); }

  // Macro name for a define line at index i.
  function macroName(lines, i) {
    var m = /^defin[a-z]* +([a-z0-9]+)/.exec(lines[i].norm);
    if (m) return m[1];
    for (var k = i + 1; k < lines.length && k < i + 4; k++) {
      if (lines[k].kind === 'code') return (lines[k].code.split(/\s+/)[0] || '').toLowerCase();
    }
    return '?';
  }

  /*
   * Routine: a labelled line after a comment-only line, or one the code above
   * cannot fall into (after a jmp, say), a `define`, a title or a new part
   * starts a routine; its comment header above (up to the previous code line)
   * belongs to it. Labels inside a macro body do not start routines.
   * Blank lines do not count: they are layout, and transcriptions of one
   * program differ in them (3.1 has a blank line inside sqt that the 4.0
   * listing lacks, which split the routine in one version and not the other).
   */
  function routineUnits(text, o) {
    var L = text.lines, starts = [], names = [], inDef = false, last = -1;
    for (var i = 0; i < L.length; i++) {
      var l = L[i], prev = i > 0 ? L[i - 1] : null, pnb = null;
      for (var q = i - 1; q >= 0 && L[q].part === l.part; q--) if (L[q].kind !== 'blank') { pnb = L[q]; break; }
      var name = null;
      if (l.kind === 'title' || !prev || prev.part !== l.part) name = l.kind === 'title' ? words(l.code, 4) : null;
      // A macro may be defined on one line, tab-separated, ending in its own term
      // (Russell's 3.1 tape: "define mult Z<tab>jda mpy<tab>lac Z<tab>term"); only a
      // define without one opens a body to wait for.
      if (isDefine(l)) { name = 'define ' + macroName(L, i); inDef = !/\bterm[a-z]*\s*$/i.test(l.code || ''); }
      else if (!inDef && l.kind === 'code' && l.labels.length && prev &&
               ((pnb && pnb.kind === 'comment') ||
                (o.flowStarts !== false && flowStart(L, i)))) {
        name = l.labels.filter(function (x) { return !/^\d+$/.test(x); })[0] || l.labels[0];
      }
      if (inDef && isTerm(l)) inDef = false;
      var first = !prev || prev.part !== l.part || l.kind === 'title';
      if (name === null && !first && i !== 0) continue;
      var s = first ? i : headerStart(L, i, last);
      if (starts.length && s <= starts[starts.length - 1]) s = starts[starts.length - 1] + 1;
      if (s > i) s = i;
      if (name === null) name = firstWords(L, i);
      if (starts.length && starts[starts.length - 1] === s) continue;
      starts.push(s); names.push(name); last = i;
    }
    // Units without an explicit name: name from their first comment words.
    return unitsFromStarts(text, starts, names, 'routine', o).map(function (u) {
      if (!u.name) u.name = u.header ? words(u.header, 5) : '(unnamed)';
      return u;
    });
  }

  var SKIP_RE = /^(sza|spa|sma|szl|szo|szf|szs|spi|skp|sas|sad|isp|clo|spq|szm|sni|snl)\b/;
  // True if line i cannot be reached by falling through from the code line
  // above it: that line is a location assignment ("40/"), the end of a
  // macro definition, or an unconditional jmp not preceded by a skip.
  // A plain data word, such as `sq1, 0`: a routine's own storage.
  function isData(l) { return !!l && l.kind === 'code' && /^-?[0-7]+$/.test(String(l.code).replace(/\s+/g, '')); }
  // Where the flow of control begins a routine (a comment above also does, in
  // routineUnits). Storage after a routine's last jump stays with that routine
  // (sqt's sq1 and sq2). A switch from data back to code is not a boundary:
  // the constants table (tno … hd1) mixes instructions and numbers throughout.
  function flowStart(L, i) {
    return !isData(L[i]) && noFallThrough(L, i);
  }

  function noFallThrough(L, i) {
    var k = i - 1;
    while (k >= 0 && L[k].kind !== 'code' && L[k].kind !== 'title') k--;
    if (k < 0 || L[k].kind !== 'code') return true;
    var code = normalize(L[k].code);
    if (/\/$/.test(code) || /^term[a-z]*$/.test(code)) return true;
    if (!/^jmp\b/.test(code)) return false;
    var j = k - 1;
    while (j >= 0 && L[j].kind !== 'code') j--;
    return !(j >= 0 && SKIP_RE.test(normalize(L[j].code)));
  }

  /*
   * Section: coarser blocks. Boundaries at
   *   - each part / tape title (also the title after a `start`);
   *   - a comment-only line preceded by >= 2 blank lines (page breaks count
   *     as blank) or by a line of dashes; the section is named by it;
   *   - `constants` / `variables` pseudo-ops (the storage-allocation tail);
   *   - the first `define` of a run: consecutive macro definitions are
   *     grouped into one "macros" section (header boundaries suppressed),
   *     which ends at the first code line outside a definition.
   */
  function sectionUnits(text, o) {
    var L = text.lines, starts = [], names = [];
    var inMacros = false, inDef = false, blanks = 0, prevNB = null, lastCode = -1, macs = null;
    function push(s, name) {
      if (starts.length && starts[starts.length - 1] >= s) {
        if (starts[starts.length - 1] === s) names[names.length - 1] = name;
        return;
      }
      starts.push(s); names.push(name);
    }
    for (var i = 0; i < L.length; i++) {
      var l = L[i], prev = i > 0 ? L[i - 1] : null;
      if (l.kind === 'title' || !prev || prev.part !== l.part) {
        push(i, l.kind === 'title' ? words(l.code, 5) : '(part)');
        inMacros = false; inDef = false;
      } else if (isDefine(l)) {
        inDef = true;
        if (!inMacros) {
          inMacros = true; macs = [];
          push(headerStart(L, i, lastCode), 'macros');
        }
        macs.push(macroName(L, i));
        names[names.length - 1] = 'macros: ' + macs.slice(0, 3).join(', ') + (macs.length > 3 ? ', ...' : '');
      } else if (inDef) {
        if (isTerm(l)) inDef = false;
      } else if (inMacros && l.kind === 'code') {
        inMacros = false;
        push(headerStart(L, i, lastCode), l.label || firstWords(L, headerStart(L, i, lastCode)));
      } else if (!inMacros && l.kind === 'comment' &&
                 (blanks >= 2 || (prevNB && /^[\/\s]*-{4,}/.test(prevNB.raw)))) {
        push(i, words(l.comment, 6) || '(section)');
      } else if (!inMacros && l.kind === 'code' && /^(constants|variables)\b/.test(l.norm) &&
                 !(prevNB && prevNB.kind === 'code' && /^(constants|variables)\b/.test(prevNB.norm))) {
        push(i, l.norm);
      }
      if (l.kind === 'blank') blanks++;
      else { blanks = 0; prevNB = l; }
      if (l.kind === 'code') lastCode = i;
    }
    return unitsFromStarts(text, starts, names, 'section', o);
  }

  function words(s, n) { return H.words(s, n); }
  function headerStart(L, s, f) { return H.headerStart(L, s, f); }
  function firstWords(L, i) { return H.firstWords(L, i); }
  function unitsFromStarts(text, starts, names, kind, o) { return H.unitsFromStarts(text, starts, names, kind, o); }

  root.SWLang = root.SWLang || {};
  root.SWLang.macro = {
    normalize: normalize, parseLine: parseLine, prepareLine: prepareLine,
    skipPart: function (part, opts) { return part.role !== 'program' && part.role !== 'text' && !opts.includeSupplied; },
    routineUnits: function (text, o, h) { H = h; return routineUnits(text, o); },
    sectionUnits: function (text, o, h) { H = h; return sectionUnits(text, o); }
  };
})(typeof window !== 'undefined' ? window : globalThis);
