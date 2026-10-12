/*
 * lang-mad.js - MAD (the Michigan Algorithm Decoder, as at MIT's Computation Center on CTSS, with
 * Weizenbaum's SLIP list functions) and the ELIZA scripts written for it, for bench-kit's
 * genealogy and compare (kit/genealogy.js) and for a bench's Read. From the ELIZA bench. A bench
 * uses it with SW.BENCH.lang = 'mad'.
 *
 * A MAD line is a card. In the transcriptions read here: columns 1-11 hold a statement label
 * (IDENT, READ(7)); column 12 an R for a remark card or a digit for a continuation; the
 * statement runs from column 12 or 13 to 72; 73 on is the card's sequence number. A line
 * "        NAME   MAD" heads a deck, a separately compiled program. Keywords are often written
 * short (W'R for WHENEVER, T'O for TRANSFER TO); text is between dollar signs ($HELLO$);
 * relations are dotted (.E., .G.); a function is called NAME.(…).
 *
 * A script (a file not named .mad, as DOCTOR.txt) is lists: a comment runs from ";" to the
 * end of the line, and a keyword's entry opens at the left margin with "(".
 *
 *   SWLang.mad.parseLine(s) -> { labels, code, comment, kind, seq, cont, deck, script }
 *     kind: 'blank', 'comment' (a remark card, or a script's comment), 'code', 'deck' (a deck's
 *     head; deck is its name); seq the sequence number; cont a continuation card. A line
 *     shaped as a script's (beginning "(", ")" or ";") is read as one; parseScript(s) reads
 *     a line known to be.
 *   SWLang.mad.tokens(code) -> [[kind, text]]   kinds: kw (a keyword, whole or short), rel (a
 *     dotted operator), str ($…$), num, call (a name called NAME.(…)), name, punct
 *   SWLang.mad.scriptTokens(code) -> [[kind, text]]   kinds: paren, num, key (=WORD, a
 *     reference to another keyword), tag (/WORD, a word's class), op (DLIST, NEWKEY, PRE,
 *     MEMORY, NONE, START, =), word
 *   SWLang.mad.isScript(src)   a file read as a script (not .mad)
 * Part of bench-kit (github.com/critical-code-studies/bench-kit).
 */
(function (root) {
  'use strict';
  var H;   // the genealogy's helpers, given on use

  // MAD's words: whole, and as programmers wrote them short
  var KW = ['WHENEVER', 'OR', 'OTHERWISE', 'END', 'OF', 'CONDITIONAL', 'TRANSFER', 'TO', 'THROUGH', 'FOR', 'VALUES', 'FUNCTION', 'RETURN',
    'ENTRY', 'EXTERNAL', 'INTERNAL', 'NORMAL', 'MODE', 'IS', 'INTEGER', 'FLOATING', 'POINT', 'BOOLEAN', 'STATEMENT', 'LABEL', 'VECTOR',
    'DIMENSION', 'PRINT', 'COMMENT', 'COMENT', 'FORMAT', 'READ', 'DATA', 'RESULTS', 'CONTINUE', 'PROGRAM', 'EQUIVALENCE', 'ERASABLE',
    'COMMON', 'EXECUTE', 'PAUSE', 'NO', 'LIST', 'ONLINE', 'PUNCH', 'LOOK', 'AT', 'SET', 'BACK', 'INSERT', 'FILE', 'RECORD', 'REWIND', 'TAPE'];
  var KWSET = {}; KW.forEach(function (k) { KWSET[k] = 1; });
  // LIST, READ and TAPE are also names in programs; they count as keywords only before a space
  var SOFT = { LIST: 1, READ: 1, TAPE: 1, TO: 0 };
  var SHORT = /^[A-Z]'[A-Z]$/;   // W'R, T'O, T'H, E'L, O'E, F'N, E'N, E'M, V'S, I'N, D'N, O'R

  function isScript(src) { return !/\.mad$/i.test(String(src || '')); }
  function looksScript(s) { return /^\s*[;()]/.test(s) || (/^\S/.test(s) && s.replace(/\s+$/, '').length < 12 && !/ MAD$/.test(s)); }

  function parseScript(s) {
    s = String(s).replace(/[\r\n]+$/, '');
    if (/^\s*$/.test(s)) return { labels: [], code: '', comment: '', kind: 'blank', script: true };
    var ci = s.indexOf(';'), code = (ci < 0 ? s : s.slice(0, ci)).replace(/\s+$/, ''), comment = ci < 0 ? '' : s.slice(ci + 1).trim();
    return { labels: [], code: code.trim(), comment: comment, kind: code.trim() ? 'code' : 'comment', script: true, top: /^\(/.test(s) };
  }

  function parseMad(s) {
    s = String(s).replace(/[\r\n]+$/, '').replace(/[\f\u0003]/g, '');
    if (/^\s*$/.test(s)) return { labels: [], code: '', comment: '', kind: 'blank' };
    var deck = /^\s+([A-Z0-9]+)\s+MAD\s*$/.exec(s);
    if (deck) return { labels: [], code: s.trim(), comment: '', kind: 'deck', deck: deck[1] };
    var body = s.length > 72 ? s.slice(0, 72) : s, seq = s.length > 72 ? s.slice(72).trim() : '';
    var label = body.slice(0, 11).trim(), flag = body.charAt(11);
    if (flag === 'R') return { labels: label ? [label] : [], code: '', comment: body.slice(12).trim(), kind: 'comment', seq: seq };
    var cont = /[0-9]/.test(flag), code = (cont || flag === ' ' ? body.slice(12) : body.slice(11)).replace(/\s+$/, '');
    return { labels: label ? [label] : [], code: code.trim(), comment: '', kind: code.trim() || label ? 'code' : 'blank', seq: seq, cont: cont };
  }

  function parseLine(s) { return looksScript(String(s)) ? parseScript(s) : parseMad(s); }

  // a statement's words, in order
  function tokens(code) {
    var out = [], re = /(\$[^$]*\$?)|(\.[A-Z]+\.)|([A-Z][A-Z0-9]*'[A-Z])|([A-Z][A-Z0-9]*)(\.\()?|(\d+(?:\.\d*)?(?:E[+-]?\d+)?K?)|(\s+)|(.)/g, m;
    while ((m = re.exec(code))) {
      if (m[1]) out.push(['str', m[1]]);
      else if (m[2]) out.push(['rel', m[2]]);
      else if (m[3]) out.push([SHORT.test(m[3]) ? 'kw' : 'name', m[3]]);
      else if (m[4]) {
        if (m[5]) { out.push(['call', m[4]]); out.push(['punct', '.(']); }
        else {
          var after = code.charAt(re.lastIndex);
          out.push([KWSET[m[4]] && !(SOFT[m[4]] && after !== ' ') ? 'kw' : 'name', m[4]]);
        }
      }
      else if (m[6]) out.push(['num', m[6]]);
      else out.push(['punct', m[7] || m[8]]);
    }
    return out;
  }

  var SCRIPT_OPS = { DLIST: 1, NEWKEY: 1, PRE: 1, MEMORY: 1, NONE: 1, START: 1 };
  function scriptTokens(code) {
    var out = [], re = /([()])|(=[A-Z'][A-Z0-9']*)|(\/[A-Z][A-Z0-9]*)|(\d+)(?=[\s()]|$)|(=)|([^\s()]+)|(\s+)/g, m;
    while ((m = re.exec(code))) {
      if (m[1]) out.push(['paren', m[1]]);
      else if (m[2]) out.push(['key', m[2]]);
      else if (m[3]) out.push(['tag', m[3]]);
      else if (m[4]) out.push(['num', m[4]]);
      else if (m[5]) out.push(['op', '=']);
      else if (m[6]) out.push([SCRIPT_OPS[m[6]] ? 'op' : 'word', m[6]]);
      else out.push(['punct', m[7]]);
    }
    return out;
  }

  // Whitespace collapsed; case means nothing (the cards were in capitals)
  function normalize(s) { return String(s).replace(/[\f\u0003]/g, '').toLowerCase().replace(/\s+/g, ' ').replace(/^ | $/g, ''); }
  function stemOf(src) { return String(src).split('/').pop().replace(/\.[a-z]+$/i, ''); }

  // A line that opens a routine: a deck's head, an internal function, a script's keyword entry
  function prepareLine(t, p, n, from, state, part) {
    if (part && isScript(part.src) && !p.script) p = parseScript(t);
    p.top = p.kind === 'deck' || /^INTERNAL FUNCTION\b/.test(p.code) || (p.script && /^\(/.test(t));
    return p;
  }
  function routineName(l) {
    if (l.kind === 'deck') return l.code.replace(/\s+MAD$/, '').trim();
    var f = /^INTERNAL FUNCTION\s*(?:\(([^)]*)\))?\s*/.exec(l.code);
    if (f) { var e = /([A-Z][A-Z0-9]*)\./.exec(l.code.slice(f[0].length)); return (e ? e[1] : (l.label || 'INTERNAL FUNCTION')); }
    var w = /^\(\s*([^\s()]+)/.exec(l.raw || l.code);
    return w ? w[1] : l.stem + ' (head)';
  }

  /*
   * Routine: a deck (a separately compiled program, from its head), an internal function, or
   * a script's keyword entry, with the comment lines above it.
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
      starts.push(s); names.push(l.top ? routineName(l) : l.stem + ' (head)'); last = i;
    }
    return H.unitsFromStarts(text, starts, names, 'routine', o);
  }
  // Section: a whole file
  function sectionUnits(text, o) {
    var L = text.lines, starts = [], names = [];
    for (var i = 0; i < L.length; i++) if (i === 0 || L[i - 1].part !== L[i].part) { starts.push(i); names.push(L[i].stem); }
    return H.unitsFromStarts(text, starts, names, 'section', o);
  }

  root.SWLang = root.SWLang || {};
  root.SWLang.mad = {
    normalize: normalize, parseLine: parseLine, parseMad: parseMad, parseScript: parseScript, prepareLine: prepareLine, stem: stemOf,
    tokens: tokens, scriptTokens: scriptTokens, isScript: isScript, keywords: KW,
    skipPart: function (part, opts) { return part.role === 'doc' || (part.role !== 'program' && !opts.includeSupplied); },
    routineUnits: function (text, o, h) { H = h; return routineUnits(text, o); },
    sectionUnits: function (text, o, h) { H = h; return sectionUnits(text, o); }
  };
})(typeof window !== 'undefined' ? window : globalThis);
