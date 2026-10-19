/*
 * lispdefs.js - Lisp texts compared by definition. A text is read by its dialect's reader into
 * tokens, split into its top-level forms, and each form that defines something is named; two
 * texts (or two sets of files) are then matched by name, and each pair of definitions compared
 * as token sequences with the parentheses left out, so that layout, case and the defining form
 * (DEFINEQ, DEFPROP … EXPR, DEFUN, DE) do not count as differences.
 *
 * Readers (dialect):
 *   bbn      BBN-LISP and Interlisp: % escapes; [ and ] are super-parentheses (] closes to the
 *            last [, or to the top); comments are (* …) forms and are kept; | is a letter.
 *   pdp6     MIT PDP-6 Lisp of the 1960s: / escapes; ; is a letter (the Samson DECtape's DOCTOR
 *            lists it among the punctuation as plain ;, where White's Maclisp DOCTOR of 1978
 *            writes /;); no |…| symbols.
 *   maclisp  Maclisp, Stanford Lisp 1.6, Franz Lisp: / escapes; ; to the line's end is a
 *            comment; |…| is a symbol.
 *   cl       Common Lisp: \ escapes; ; and #| … |# are comments; |…| is a symbol; #' reads as
 *            FUNCTION.
 *   In bbn, pdp6 and maclisp a " opens a string only after a space or a parenthesis and only
 *   if another closes it on the same line (readers of the time took " as a letter: SHRDLU's
 *   dictionary defines the word " and its grammar quotes it as '"); in cl a string runs to its
 *   closing ". In maclisp and cl 'X reads as QUOTE X; in bbn and pdp6 ' is a letter, as the
 *   scripts of 1966 to 1972 write DON'T, YOU'RE and I'M plainly (White's Maclisp DOCTOR of 1978
 *   writes DON/'T); in interlisp ' is QUOTE at the start of an atom and a letter inside one, as
 *   the Interlisp DOCTORs of 1983 and 1985 write (YOU DON'T SEEM QUITE CERTAIN %.). Case is folded (fold: false keeps it). detect(text) guesses a dialect.
 *
 * Definitions: DEFINEQ entries (LAMBDA, NLAMBDA); DEFPROP name (LAMBDA …) EXPR, FEXPR, LEXPR or
 * MACRO; DEFUN (Maclisp's FEXPR, MACRO and (name prop) forms too), DEFMACRO, DE, DF, DM;
 * Micro-Planner's theorems (DEFPROP name (THCONSE …) THEOREM, THANTE, THERASING, and DEFTHEOREM);
 * SHRDLU's grammar programs (PDEFINE) and dictionary words (DEFS, keyed "word (word)");
 * DEFLIST entries, Interlisp's PUTPROPS and Cosell's RPLQQ as properties (a script's "word RULES");
 * other DEFPROPs as properties, named "name indicator"; DEFVAR, DEFPARAMETER, DEFCONSTANT, RPAQ
 * and RPAQQ as variables; DEFSTRUCT, DEFMETHOD and DEFGENERIC. A function, fexpr, macro or
 * theorem is keyed by its name alone, so a function that became a macro still pairs. Where a
 * text defines a name twice the later definition stands, as it would when loaded.
 * A copy damaged in transmission can lose a parenthesis or gain one, so that a form runs on
 * past its end: a form still open where another defining form begins at the left margin is
 * closed there and marked broken, and so is one still open at the end of the text.
 *
 * API (root.SWLispDefs, and module.exports in Node):
 *   detect(text) -> 'bbn' | 'maclisp' | 'cl' (pdp6 and interlisp are never guessed: name them)
 *   read(text, dialect, opt) -> tokens [{ t, k: '(' | ')' | 'atom' | 'str', line, col }]
 *   forms(tokens) -> the top-level forms, as nested arrays with line, end and broken
 *   defs(texts, dialect, opt) -> { list: [{ key, name, kind, tokens, file, line, end, broken }],
 *        other, redefined, broken }; texts is a string or [{ name, text }]
 *   compare(A, B, opt) -> { rows: [{ key, kind, a, b, sim, status }], matched, identical,
 *        changed, onlyA, onlyB, otherA, otherB, brokenA, brokenB }; A and B are { texts, dialect } (or a string),
 *        status 'identical' | 'changed' | 'only in A' | 'only in B'; a and b are the definitions
 *   similarity(x, y) -> 0..1, twice the longest common subsequence over the two lengths
 * Part of bench-kit (github.com/critical-code-studies/bench-kit).
 */
(function (root) {
  'use strict';

  var DIALECTS = {
    bbn: { label: 'BBN-LISP', escape: '%', semi: false, bars: false, supers: true, strings: 'line', quote: false },
    // Interlisp reads as BBN-LISP did, except that ' is QUOTE (the read macro came with it, after the BBN-LISP of the 1960s)
    interlisp: { label: 'Interlisp', escape: '%', semi: false, bars: false, supers: true, strings: 'line', quote: 'first' },
    pdp6: { label: 'PDP-6 Lisp', escape: '/', semi: false, bars: false, supers: false, strings: 'line', quote: false },
    maclisp: { label: 'Maclisp', escape: '/', semi: true, bars: true, supers: false, strings: 'line' },
    cl: { label: 'Common Lisp', escape: '\\', semi: true, bars: true, supers: false, strings: 'full' }
  };

  function detect(text) {
    text = String(text);
    if (/\(\s*defineq\b/i.test(text) || /\(\s*rpaqq?\b/i.test(text)) return 'bbn';
    if (/\(\s*(defpackage|in-package|defparameter|defgeneric|defmethod|defstruct)\b/i.test(text) || /#'|#\|/.test(text) || /\(\s*defun\s+\S+\s+\(&/i.test(text)) return 'cl';
    return 'maclisp';
  }

  function read(text, dialect, opt) {
    var D = DIALECTS[dialect] || DIALECTS.maclisp, fold = !(opt && opt.fold === false);
    var s = String(text).replace(/\r\n?/g, '\n').replace(/[\f\u0003]/g, ' ');
    if (dialect === 'interlisp') s = s.replace(/\u0006[\s\S]/g, '');   // Interlisp's font changes in a pretty-printed file (^F and the font's number)
    var out = [], line = 1, i = 0, n = s.length, supers = [], depth = 0, bol = 0;
    function up(x) { return fold ? x.toUpperCase() : x; }
    function push(k, t, at) { out.push({ t: t, k: k, line: line, col: (at == null ? i : at) - bol }); }
    function open() { push('(', '('); depth++; }
    function close() { if (depth > 0) { push(')', ')'); depth--; } }
    while (i < n) {
      var c = s.charAt(i);
      if (c === '\n') { line++; i++; bol = i; continue; }
      if (/\s/.test(c)) { i++; continue; }
      if (c === ';' && D.semi) { while (i < n && s.charAt(i) !== '\n') i++; continue; }
      if (dialect === 'cl' && c === '#' && s.charAt(i + 1) === '|') {
        var nest = 1; i += 2;
        while (i < n && nest) { if (s.substr(i, 2) === '|#') { nest--; i += 2; } else if (s.substr(i, 2) === '#|') { nest++; i += 2; } else { if (s.charAt(i) === '\n') line++; i++; } }
        continue;
      }
      if (c === '(') { open(); i++; continue; }
      if (c === ')') { close(); i++; continue; }
      if (D.supers && c === '[') { open(); supers.push(depth); i++; continue; }
      if (D.supers && c === ']') { var to = supers.length ? supers.pop() - 1 : 0; while (depth > to) close(); i++; continue; }
      if (c === "'" && D.quote !== false) { push('atom', 'QUOTE'); i++; continue; }
      if (dialect === 'cl' && c === '#' && s.charAt(i + 1) === "'") { push('atom', 'FUNCTION'); i += 2; continue; }
      if (dialect === 'cl' && (c === '`' || c === ',')) { var m = s.substr(i, 2) === ',@' ? ',@' : c; push('atom', m); i += m.length; continue; }
      if (c === '"' && (D.strings === 'full' || i === bol || /[\s()]/.test(s.charAt(i - 1)))) {
        var j = i + 1, str = '', ok = false, l0 = line;
        while (j < n) {
          var d = s.charAt(j);
          if (d === D.escape) { str += s.charAt(j + 1); j += 2; continue; }
          if (d === '"') { ok = true; break; }
          if (d === '\n') { if (D.strings === 'line') break; line++; }
          str += d; j++;
        }
        if (ok) { out.push({ t: '"' + up(str) + '"', k: 'str', line: l0, col: i - bol }); if (D.strings !== 'line') { var nl = s.lastIndexOf('\n', j); if (nl > i) bol = nl + 1; } i = j + 1; continue; }
        line = l0;   // not a string here: " is a letter
      }
      // an atom, with escapes, and |…| in the dialects that have it
      var a = '', a0 = i;
      while (i < n) {
        var e = s.charAt(i);
        if (e === D.escape && i + 1 < n) { a += s.charAt(i + 1); i += 2; continue; }
        if (D.bars && e === '|') {
          var k2 = i + 1; while (k2 < n && s.charAt(k2) !== '|') { if (s.charAt(k2) === D.escape) k2++; k2++; }
          a += s.slice(i + 1, k2).replace(new RegExp('\\' + D.escape + '(.)', 'g'), '$1'); for (var q = i; q < k2 && q < n; q++) if (s.charAt(q) === '\n') line++;
          i = k2 + 1; continue;
        }
        if (/\s/.test(e) || e === '(' || e === ')' || (e === "'" && D.quote !== false && D.quote !== 'first') || (e === ';' && D.semi) || (D.supers && (e === '[' || e === ']')) ||
            (dialect === 'cl' && (e === '"' || e === '`' || e === ','))) break;
        a += e; i++;
      }
      if (a) push('atom', up(a), a0); else i++;
    }
    return out;
  }

  // top-level forms as trees: a list is an array; an atom or string its text; with lines. A
  // form still open where a defining form begins at the left margin (a damaged copy, a lost
  // parenthesis) is closed there and marked broken, so that it does not swallow what follows.
  var HEADS = /^(DEFUN|DEFPROP|PUTPROPS|DEFINEQ|DE|DF|DM|DEFMACRO|DEFTHEOREM|PDEFINE|DEFS|DEFLIST|DEFVAR|DEFPARAMETER|DEFCONSTANT|DEFSTRUCT|DEFGENERIC|DEFMETHOD|RPAQQ?)$/;
  function forms(tokens) {
    var top = [], stack = [], cur = null;
    tokens.forEach(function (tk, ti) {
      if (tk.k === '(' && cur && tk.col === 0 && tokens[ti + 1] && tokens[ti + 1].k === 'atom' && HEADS.test(tokens[ti + 1].t) &&
          !(stack.length === 0 && cur[0] === 'DEFINEQ')) {   // a DEFINEQ's entries begin at the margin
        while (stack.length) cur = stack.pop();
        cur.end = tk.line - 1; cur.broken = true; top.push(cur); cur = null;
      }
      if (tk.k === '(') { var l = []; l.line = tk.line; if (cur) { cur.push(l); stack.push(cur); } cur = l; }
      else if (tk.k === ')') { if (!cur) return; cur.end = tk.line; if (stack.length) cur = stack.pop(); else { top.push(cur); cur = null; } }
      else if (cur) cur.push(tk.t);
      else { var at = [tk.t]; at.line = at.end = tk.line; at.atom = true; top.push(at); }
    });
    if (cur) { while (stack.length) cur = stack.pop(); cur.end = tokens[tokens.length - 1].line; cur.broken = true; top.push(cur); }
    return top;
  }
  function flat(x, out) {
    out = out || [];
    if (Array.isArray(x)) x.forEach(function (y) { flat(y, out); }); else out.push(x);
    return out;
  }
  var FN = { EXPR: 'function', SUBR: 'function', LEXPR: 'function', FEXPR: 'fexpr', FSUBR: 'fexpr', MACRO: 'macro' };
  var THEOREMS = { THCONSE: 1, THANTE: 1, THERASING: 1 };
  function head(x) { return Array.isArray(x) ? x[0] : null; }
  function nameOf(x) { return Array.isArray(x) ? x.join(' ') : String(x); }

  // the definitions in one top-level form: [{ key, name, kind, body }]
  function defsIn(f) {
    if (f.atom || !Array.isArray(f) || typeof f[0] !== 'string') return [];
    var h = f[0], out = [];
    function add(name, kind, body, key) { if (name != null) out.push({ key: key || nameOf(name), name: nameOf(name), kind: kind, body: body }); }
    if (h === 'DEFINEQ') {
      f.slice(1).forEach(function (e) {
        if (!Array.isArray(e) || typeof e[0] !== 'string') return;
        var v = e[1], k = Array.isArray(v) && (v[0] === 'NLAMBDA' ? 'fexpr' : v[0] === 'LAMBDA' ? 'function' : null);
        if (k) add(e[0], k, v.slice(1)); else add(e[0], 'function', e.slice(1));
      });
    } else if (h === 'DEFPROP' && f.length >= 4) {
      var v2 = f[2], ind = f[3];
      if (Array.isArray(v2) && v2[0] === 'LAMBDA' && FN[ind]) add(f[1], FN[ind], v2.slice(1));
      else if (THEOREMS[head(v2)]) add(f[1], 'theorem', v2);
      else add(f[1], 'property', [v2], nameOf(f[1]) + ' ' + nameOf(ind));
    } else if (h === 'DEFUN' || h === 'DE' || h === 'DF' || h === 'DM' || h === 'DEFMACRO') {
      var nm = f[1], rest = f.slice(2), kind = { DF: 'fexpr', DM: 'macro', DEFMACRO: 'macro' }[h] || 'function';
      if (h === 'DEFUN' && typeof rest[0] === 'string' && FN[rest[0]] && rest[0] !== 'EXPR' || h === 'DEFUN' && rest[0] === 'EXPR') { kind = FN[rest[0]]; rest = rest.slice(1); }
      add(nm, kind, rest);
    } else if (h === 'DEFTHEOREM') add(f[1], 'theorem', f.slice(2));
    else if (h === 'PUTPROPS' || h === 'RPLQQ') {   // Interlisp's (PUTPROPS atom prop value …) and Cosell's (RPLQQ atom prop value): properties, as DEFPROP's
      for (var pi = 2; pi + 1 < f.length; pi += 2) add(f[1], 'property', [f[pi + 1]], nameOf(f[1]) + ' ' + nameOf(f[pi]));
    }
    else if (h === 'PDEFINE') add(f[1], 'grammar', f.slice(2));
    else if (h === 'DEFS') add(f[1], 'word', f.slice(2), nameOf(f[1]) + ' (word)');
    else if (h === 'DEFLIST') {   // (DEFLIST indicator (atom value) …), or Lisp 1.5's (DEFLIST ((atom value) …) indicator)
      var l15 = Array.isArray(f[1]), ind2 = l15 ? f[2] : f[1];
      (l15 ? f[1] : f.slice(2)).forEach(function (e) { if (Array.isArray(e)) add(e[0], 'property', e.slice(1), nameOf(e[0]) + ' ' + nameOf(ind2)); });
    }
    else if (/^(DEFVAR|DEFPARAMETER|DEFCONSTANT|RPAQ|RPAQQ)$/.test(h)) add(f[1], 'variable', f.slice(2), nameOf(f[1]) + ' (variable)');
    else if (h === 'DEFSTRUCT') { var sn = Array.isArray(f[1]) ? f[1][0] : f[1]; add(sn, 'structure', f.slice(1), nameOf(sn) + ' (structure)'); }
    else if (h === 'DEFGENERIC') add(f[1], 'generic', f.slice(2), nameOf(f[1]) + ' (generic)');
    else if (h === 'DEFMETHOD') {
      var i = 2, q = []; while (typeof f[i] === 'string') q.push(f[i++]);
      var spec = (f[i] || []).map(function (p) { return Array.isArray(p) ? nameOf(p[1]) : 'T'; });
      add(f[1], 'method', f.slice(i), nameOf(f[1]) + ' ' + q.concat(['(' + spec.join(' ') + ')']).join(' '));
    } else if (/^(PROGN|EVAL-WHEN)$/.test(h)) f.slice(h === 'EVAL-WHEN' ? 2 : 1).forEach(function (g) { out = out.concat(defsIn(g)); });
    return out;
  }

  function defs(texts, dialect, opt) {
    if (typeof texts === 'string') texts = [{ name: '', text: texts }];
    var byKey = {}, order = [], other = 0, redefined = [], broken = [];
    texts.forEach(function (tx) {
      var d = dialect && DIALECTS[dialect] ? dialect : detect(tx.text);
      forms(read(tx.text, d, opt)).forEach(function (f) {
        var ds = defsIn(f);
        if (!ds.length) { other++; return; }
        ds.forEach(function (x) {
          var rec = { key: x.key, name: x.name, kind: x.kind, tokens: flat(x.body), file: tx.name, line: f.line, end: f.end };
          if (f.broken) { rec.broken = true; broken.push(x.key); }
          if (byKey[x.key]) redefined.push(x.key); else order.push(x.key);
          byKey[x.key] = rec;
        });
      });
    });
    return { list: order.map(function (k) { return byKey[k]; }), byKey: byKey, other: other, redefined: redefined, broken: broken };
  }

  function similarity(x, y) {
    if (!x.length && !y.length) return 1;
    if (x.length * y.length > 4e6) {   // too long to align: the share of tokens in common
      var c = {}, m = 0; x.forEach(function (t) { c[t] = (c[t] || 0) + 1; }); y.forEach(function (t) { if (c[t] > 0) { c[t]--; m++; } });
      return 2 * m / (x.length + y.length);
    }
    var nb = y.length, prev = new Uint32Array(nb + 1), cur = new Uint32Array(nb + 1);
    for (var i = 1; i <= x.length; i++) {
      for (var j = 1; j <= nb; j++) cur[j] = x[i - 1] === y[j - 1] ? prev[j - 1] + 1 : Math.max(prev[j], cur[j - 1]);
      var t = prev; prev = cur; cur = t;
    }
    return 2 * prev[nb] / (x.length + nb);
  }
  function same(x, y) { if (x.length !== y.length) return false; for (var i = 0; i < x.length; i++) if (x[i] !== y[i]) return false; return true; }

  function side(X, opt) {
    if (typeof X === 'string') X = { texts: X };
    return defs(X.texts, X.dialect, opt);
  }
  function compare(A, B, opt) {
    var a = side(A, opt), b = side(B, opt), rows = [];
    a.list.forEach(function (x) { rows.push({ key: x.key, a: x, b: b.byKey[x.key] || null }); });
    b.list.forEach(function (y) { if (!a.byKey[y.key]) rows.push({ key: y.key, a: null, b: y }); });
    rows.forEach(function (r) {
      r.kind = r.a && r.b && r.a.kind !== r.b.kind ? r.a.kind + ' → ' + r.b.kind : (r.a || r.b).kind;
      if (!r.b) { r.status = 'only in A'; r.sim = null; return; }
      if (!r.a) { r.status = 'only in B'; r.sim = null; return; }
      var id = same(r.a.tokens, r.b.tokens) && r.a.kind === r.b.kind;
      r.sim = id ? 1 : similarity(r.a.tokens, r.b.tokens);
      r.status = id ? 'identical' : 'changed';
    });
    function count(st) { return rows.filter(function (r) { return r.status === st; }).length; }
    var identical = count('identical'), changed = count('changed');
    return { rows: rows, matched: identical + changed, identical: identical, changed: changed, onlyA: count('only in A'), onlyB: count('only in B'),
             otherA: a.other, otherB: b.other, redefinedA: a.redefined, redefinedB: b.redefined, brokenA: a.broken, brokenB: b.broken };
  }

  var api = { DIALECTS: DIALECTS, detect: detect, read: read, forms: forms, defs: defs, compare: compare, similarity: similarity };
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.SWLispDefs = api;
})(typeof window !== 'undefined' ? window : globalThis);
