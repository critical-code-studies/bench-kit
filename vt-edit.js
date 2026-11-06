/*
 * vt-edit.js - Edit, a translation bench's working view (templates/translation), in place of Read: the
 * page's image beside its text, the text editable as the file has it (markers, notes and italics as
 * written), scrolling through the whole text, with undo and redo kept across reloads. A save writes a change list in the vector
 * translation method's form, which tools/vt_apply.py applies to the master file; the bench never
 * writes the master itself.
 *
 * What a save does:
 *   a folder open in Chrome or Edge (kit/folder.js)   writes the list into translation.edit.dir, a new file
 *                                                     each save; the browser asks leave to write the first time
 *   no folder, or Safari and Firefox                  downloads the list, and keeps a copy in this browser
 * A list saved and not yet applied goes on showing in Edit: a text's working state is the file with its
 * lists' entries applied (edit()), so the file and the lists can be applied at any time, and an entry
 * whose OLD is no longer there counts as applied. Pages and Glossary read the file as it is until then.
 *
 * Each entry's OLD occurs once in the text it is applied to and not at all afterwards, the test by
 * which vt_apply accepts it and by which this view knows it has been applied. It is widened by whole
 * words until both hold, to at least 8 words where its line has them (the method's 8 to 30). Entries of a
 * list apply in order: each is worked out on the text the ones before it leave.
 *
 * The descriptor (SW.BENCH.translation): edit: { dir, tool }, the folder for the lists (default 'checks/',
 * a path as the versions' files are named; a list is named edit-<date>-<time>-<file's name>.md) and the
 * path of vt_apply in the repository (default 'tools/vt_apply.py'), for the command Edit offers.
 * The bench's shell.alias { read: 'edit' } sends every link to a line here; shell.home is the view a link
 * without a tab opens.
 *
 * SWVTEdit (pure; node and the browser):
 *   changes(a, b)                [{ a0, a1, ins }]: b as a's ranges replaced, by line and then by word
 *   entries(base, text, o)       [{ target, where, old, new }]: the same as a list's entries; o: { target, desc }
 *   list(entries, o)             the list's text; o: { title, origin, why, src } (why and src may be keyed by index)
 *   working(file, lists, target) { text, pending, applied, stuck }: a file with lists ([{ name, raw }]) applied
 *   windows(raw, desc)           [{ key, label, page, img, a, b }]: the text's pages, and its sections outside them
 *   history(text)                { text, can, change(op), undo(), redo(), ops, undone }: splices and their reverse
 *   diffOp(prev, next, at)       the splice { at, del, ins } that makes next of prev, at the offset of prev
 * Part of bench-kit (github.com/critical-code-studies/bench-kit).
 */
(function (root) {
  'use strict';
  var VT = root.SWVT || (typeof require !== 'undefined' ? require('./vt-reader.js') : null);
  var E = {};

  // ---------- two sequences compared (Myers), as ranges replaced ----------
  // past limit differences, the whole middle is one range
  function diff(a, b, limit) {
    var lo = 0, ea = a.length, eb = b.length;
    while (lo < ea && lo < eb && a[lo] === b[lo]) lo++;
    while (ea > lo && eb > lo && a[ea - 1] === b[eb - 1]) { ea--; eb--; }
    if (lo === ea && lo === eb) return [];
    if (lo === ea || lo === eb) return [{ a0: lo, a1: ea, b0: lo, b1: eb }];
    var N = ea - lo, M = eb - lo, max = Math.min(N + M, limit || 2000), off = max + 1, v = new Int32Array(2 * max + 3), trace = [], d, k, x, y, end = -1;
    for (d = 0; d <= max && end < 0; d++) {
      trace.push(v.slice(off - d - 1, off + d + 2));
      for (k = -d; k <= d; k += 2) {
        x = k === -d || (k !== d && v[off + k - 1] < v[off + k + 1]) ? v[off + k + 1] : v[off + k - 1] + 1;
        y = x - k;
        while (x < N && y < M && a[lo + x] === b[lo + y]) { x++; y++; }
        v[off + k] = x;
        if (x >= N && y >= M) { end = d; break; }
      }
    }
    if (end < 0) return [{ a0: lo, a1: ea, b0: lo, b1: eb }];
    // back through the trace: the steps that are not matches, gathered into ranges
    var out = [], cur = null;
    x = N; y = M;
    for (d = end; d > 0; d--) {
      var w = trace[d], at = function (kk) { return w[kk + d + 1]; };
      k = x - y;
      var pk = k === -d || (k !== d && at(k - 1) < at(k + 1)) ? k + 1 : k - 1, px = at(pk), py = px - pk;
      while (x > px && y > py) { x--; y--; cur = null; }   // the diagonal: matches
      if (!cur) { cur = { a0: px, a1: x, b0: py, b1: y }; out.unshift(cur); } else { cur.a0 = px; cur.b0 = py; }
      x = px; y = py;
    }
    return out.map(function (r) { return { a0: r.a0 + lo, a1: r.a1 + lo, b0: r.b0 + lo, b1: r.b1 + lo }; });
  }
  // ranges that touch are one
  function joined(rs) {
    var out = [];
    rs.forEach(function (r) { var z = out[out.length - 1]; if (z && z.a1 >= r.a0 && z.b1 >= r.b0) { z.a1 = r.a1; z.b1 = r.b1; } else out.push({ a0: r.a0, a1: r.a1, b0: r.b0, b1: r.b1 }); });
    return out;
  }
  function tokens(s) { return s.match(/\n|[^\S\n]+|[\p{L}\p{N}]+|[^\s\p{L}\p{N}]/gu) || []; }
  function offsets(ts) { var o = [0]; ts.forEach(function (t) { o.push(o[o.length - 1] + t.length); }); return o; }

  // b as a's ranges replaced: lines compared first, then the words of the lines that differ; two changes
  // with fewer than three words between them in one line are one change
  E.changes = function (a, b) {
    if (a === b) return [];
    var la = a.split('\n'), lb = b.split('\n'), oa = [0], ob = [0], out = [];
    la.forEach(function (s) { oa.push(oa[oa.length - 1] + s.length + 1); });
    lb.forEach(function (s) { ob.push(ob[ob.length - 1] + s.length + 1); });
    joined(diff(la, lb, 4000)).forEach(function (r) {
      var A0 = oa[r.a0], A1 = Math.min(oa[r.a1], a.length), B0 = ob[r.b0], B1 = Math.min(ob[r.b1], b.length);
      // lines added or taken out at the file's end, where the last line has no break of its own: the
      // break before them goes with them
      if (A0 > a.length) { A0 = a.length; B0 -= 1; }
      if (B0 > b.length) { B0 = b.length; A0 -= 1; }
      var sa = a.slice(A0, A1), sb = b.slice(B0, B1), ta = tokens(sa), tb = tokens(sb), pa = offsets(ta), pb = offsets(tb);
      var parts = sa.length + sb.length > 40000 ? [{ a0: 0, a1: ta.length, b0: 0, b1: tb.length }] : joined(diff(ta, tb, 2000));
      var merged = [];
      parts.forEach(function (p) {
        var z = merged[merged.length - 1];
        if (z) {
          var between = ta.slice(z.a1, p.a0), words = between.filter(function (t) { return /[\p{L}\p{N}]/u.test(t); }).length;
          if (words < 3 && between.indexOf('\n') < 0) { z.a1 = p.a1; z.b1 = p.b1; return; }
        }
        merged.push({ a0: p.a0, a1: p.a1, b0: p.b0, b1: p.b1 });
      });
      merged.forEach(function (p) { out.push({ a0: A0 + pa[p.a0], a1: A0 + pa[p.a1], ins: sb.slice(pb[p.b0], pb[p.b1]), b0: B0 + pb[p.b0] }); });
    });
    // changes with nothing but space between them, a paragraph taken out and put back beside itself: one change
    var one = [];
    out.forEach(function (c) {
      var z = one[one.length - 1];
      if (z && !/\S/.test(a.slice(z.a1, c.a0))) { z.ins = b.slice(z.b0, c.b0 + c.ins.length); z.a1 = c.a1; }
      else one.push(c);
    });
    return one;
  };

  // ---------- as a change list's entries ----------
  function count(s, x) { var n = 0, i = 0; while ((i = s.indexOf(x, i)) >= 0) { n++; if (n > 1) return n; i += 1; } return n; }
  function wordsIn(s) { return (s.match(/[\p{L}\p{N}]+/gu) || []).length; }
  // one word further, to the left or the right, within the line unless across is true; the new end, or the end given
  function stepLeft(s, l, across) {
    var i = l;
    while (i > 0 && /[^\S\n]/.test(s[i - 1])) i--;
    if (i > 0 && s[i - 1] === '\n') return across ? i - 1 : l;
    if (i > 0 && /[\p{L}\p{N}]/u.test(s[i - 1])) { while (i > 0 && /[\p{L}\p{N}]/u.test(s[i - 1])) i--; } else if (i > 0) i--;
    return i;
  }
  function stepRight(s, r, across) {
    var i = r;
    while (i < s.length && /[^\S\n]/.test(s[i])) i++;
    if (i < s.length && s[i] === '\n') return across ? i + 1 : r;
    if (i < s.length && /[\p{L}\p{N}]/u.test(s[i])) { while (i < s.length && /[\p{L}\p{N}]/u.test(s[i])) i++; } else if (i < s.length) i++;
    return i;
  }
  // the label after a target's name: the page at that place, or outside the pages its section
  function whereAt(s, pos, desc) {
    var t = VT.read(s, desc), head = s.slice(0, pos), n = 1, i = -1, last = 0;
    while ((i = head.indexOf('\n', i + 1)) >= 0) { n++; last = i + 1; }
    var pg = n < t.bodyEnd ? VT.pageAt(t, n, pos - last) : null;
    if (pg != null) return 'p. ' + pg;
    var sec = null; t.sections.forEach(function (x) { if (x.n <= n) sec = x; });
    return sec ? '§ ' + String(sec.title).replace(/\|/g, '/') : '';
  }
  // characters a change list cannot carry: vt_apply splits lines on these as well as on a line break
  var BREAKS = /[\x0b\x0c\x1c-\x1e\x85\u2028\u2029]/;
  function fits(x) { return !/(^|\n)~~~[ \t]*(\n|$)/.test(x) && !BREAKS.test(x); }
  // Words added at the very top or end of a file have no context on one side, so OLD stays inside NEW:
  // the one case where OLD remains after applying. working() knows it by NEW holding OLD, and vt_apply run
  // a second time on such a list would add those words again.
  function atEdge(S, l, r) { return l === 0 || r === S.length; }
  E.entries = function (base, text, o) {
    o = o || {};
    var MINW = o.minWords || 8, out = null;
    // a later entry may bring back an earlier entry's OLD (a paragraph moved): the lines around it as well,
    // more of them each time, until none does
    for (var tries = 0; tries < 4; tries++) {
      out = entriesAt(base, text, o, MINW, tries * 2);
      if (out.every(function (e) { return e.new.indexOf(e.old) >= 0 || count(text, e.old) === 0; })) return out;
    }
    throw new Error('Two changes could not be told apart in a change list: save them one at a time.');
  };
  function entriesAt(base, text, o, MINW, lines) {
    var S = base, shift = 0, out = [];
    E.changes(base, text).forEach(function (c) {
      var a = c.a0 + shift, b = c.a1 + shift, ins = c.ins, l = a, r = b;
      function NEW() { return S.slice(l, a) + ins + S.slice(b, r); }
      function right() { var old = S.slice(l, r); if (!old) return false; if (count(S, old) !== 1) return false; return count(S.slice(0, l) + NEW() + S.slice(r), old) === 0 || (atEdge(S, l, r) && (a === 0 || b === S.length)); }
      for (var q = 0; q < lines; q++) { if (l > 0) l = S.lastIndexOf('\n', l - 2) + 1; var nl0 = S.indexOf('\n', r + 1); r = nl0 < 0 ? S.length : nl0; }
      // the words the method asks for, as far as the line goes
      for (var g = 0; g < 40 && wordsIn(S.slice(l, r)) < MINW; g++) {
        var nr = stepRight(S, r, false), nl = stepLeft(S, l, false);
        if (nr === r && nl === l) break;
        r = nr; if (wordsIn(S.slice(l, r)) < MINW) l = nl;
      }
      // until OLD is unique, and gone once applied: within the line first, then across lines
      for (var h = 0; h < 4000 && !right(); h++) {
        var R = stepRight(S, r, false), L = stepLeft(S, l, false);
        if (R === r && L === l) { R = stepRight(S, r, true); L = stepLeft(S, l, true); if (R === r && L === l) break; }
        r = R; l = L;
      }
      if (!right()) throw new Error('A change near “' + S.slice(a, a + 40) + '” could not be written so that it applies once.');
      var old = S.slice(l, r), nw = NEW();
      if (!fits(old) || !fits(nw)) throw new Error('A change near “' + S.slice(a, a + 40) + '” holds a line or a character a change list cannot carry (~~~, or an unusual line break).');
      out.push({ target: o.target || 'translation', where: o.desc ? whereAt(S, a, o.desc) : '', old: old, new: nw });
      S = S.slice(0, l) + nw + S.slice(r);
      shift += ins.length - (b - a);
    });
    if (S !== text) throw new Error('The change list does not reproduce the text; nothing was saved.');
    return out;
  }
  function field(name, v) {
    if (v == null) return [];
    v = String(v);
    return v.indexOf('\n') >= 0 ? [name + ':', '~~~', v, '~~~'] : [v === '' ? name + ':' : name + ': ' + v];
  }
  E.list = function (es, o) {
    o = o || {};
    var out = ['# ' + (o.title || 'Change list'), ''];
    es.forEach(function (e, i) {
      var why = o.whys && o.whys[i] != null ? o.whys[i] : o.why, src = o.srcs && o.srcs[i];
      out.push('### ' + e.target + (e.where ? ' | ' + e.where : ''));
      out = out.concat(field('OLD', e.old), field('NEW', e.new));
      if (src) out = out.concat(field('SRC', src));
      if (why) out = out.concat(field('WHY', why));
      out.push('ORIGIN: ' + (o.origin || 'internal'), '');
    });
    return out.join('\n');
  };
  // a file with its lists' entries for this target applied, in the order of the lists' names: OLD found
  // once, applied; not found and NEW there, already applied; otherwise stuck, the text left as it was
  E.working = function (file, lists, target) {
    var S = file, res = { pending: [], applied: [], stuck: [] };
    lists.slice().sort(function (x, y) { return x.name < y.name ? -1 : x.name > y.name ? 1 : 0; }).forEach(function (L) {
      VT.changes(L.raw, L.name).forEach(function (c) {
        if ((c.target === 'readable' ? 'translation' : c.target) !== target || !c.old) return;
        var n = count(S, c.old);
        if (c.new && c.new.indexOf(c.old) >= 0 && S.indexOf(c.new) >= 0) res.applied.push(c);
        else if (n === 1) { S = S.replace(c.old, function () { return c.new; }); res.pending.push(c); }
        else if (n === 0 && (!c.new || VT.present(S, c.new))) res.applied.push(c);
        else res.stuck.push(c);
      });
    });
    res.text = S;
    return res;
  };

  // ---------- windows on a text ----------
  E.windows = function (raw, desc) {
    var t = VT.read(raw, desc), at = [0], out = [], i;
    t.lines.forEach(function (L) { at.push(at[at.length - 1] + L.raw.length + 1); });
    function start(n) { return at[n - 1]; }
    function end(n) { return Math.min(at[n] - 1, raw.length); }
    function sections(n0, n1) {   // the text between lines n0 and n1, a window to each heading of level 3 or above
      var hs = t.sections.filter(function (s) { return s.n >= n0 && s.n <= n1 && s.level <= 3; }), bounds = hs.map(function (s) { return s.n; });
      if (!bounds.length || bounds[0] > n0) bounds.unshift(n0);
      bounds.forEach(function (b, k) {
        var last = k + 1 < bounds.length ? bounds[k + 1] - 1 : n1, s = hs.filter(function (h) { return h.n === b; })[0];
        while (last > b && t.lines[last - 1] && t.lines[last - 1].kind === 'blank') last--;
        out.push({ key: 's' + b, label: s ? s.title : '(the top of the file)', page: null, img: null, a: start(b), b: end(last) });
      });
    }
    var first = t.pages.length ? t.pages[0].n : t.lines.length + 1, bodyEnd = Math.min(t.bodyEnd, t.lines.length + 1);
    if (first > 1) sections(1, Math.min(first, bodyEnd) - 1);
    var img = null, pages = t.pages.filter(function (g) { return g.n < bodyEnd; });
    pages.forEach(function (g, k) {
      var nx = pages[k + 1], n1 = nx ? (nx.c > 0 ? nx.n : nx.n - 1) : bodyEnd - 1;
      t.images.forEach(function (m) { if (m.n < g.n || (m.n === g.n && m.c <= g.c + g.len + 2)) img = m.img; });
      while (n1 > g.n && t.lines[n1 - 1].kind === 'blank') n1--;
      out.push({ key: 'p' + g.page, label: 'p. ' + g.page, page: g.page, img: img, a: start(g.n), b: end(n1) });
    });
    if (bodyEnd <= t.lines.length) sections(bodyEnd, t.lines.length);
    for (i = 0; i < out.length; i++) out[i].i = i;
    return out;
  };

  // ---------- undo and redo ----------
  // a splice, with the selection before it and after it
  E.diffOp = function (prev, next, at) {
    var p = 0, a = prev.length, b = next.length;
    while (p < a && p < b && prev[p] === next[p]) p++;
    while (a > p && b > p && prev[a - 1] === next[b - 1]) { a--; b--; }
    return { at: (at || 0) + p, del: prev.slice(p, a), ins: next.slice(p, b) };
  };
  var GAP = 1200;   // ms: typing within this of the last stroke is one step of undo
  function mergeable(z, op) {
    if (!z || op.t - z.t > GAP || op.brk || z.brk) return false;
    var word = /^\S$/u;
    if (!z.del && !op.del && op.at === z.at + z.ins.length && /^.$/su.test(op.ins) && !(/\s$/.test(z.ins) && word.test(op.ins))) return true;   // typing: a step to a word
    if (!z.ins && !op.ins && op.at + op.del.length === z.at && op.del.length === 1) return true;   // backspace
    return false;
  }
  E.history = function (text, saved) {
    var H = { text: text, ops: saved && saved.ops || [], undone: saved && saved.undone || [] };
    function apply(s, at, del, ins) { return s.slice(0, at) + ins + s.slice(at + del.length); }
    H.change = function (op) {
      if (s_same(op)) return null;
      op.t = op.t || Date.now();
      H.text = apply(H.text, op.at, op.del, op.ins);
      H.undone.length = 0;
      var z = H.ops[H.ops.length - 1];
      if (mergeable(z, op)) {
        if (!z.ins && !op.ins) { z.at = op.at; z.del = op.del + z.del; } else z.ins += op.ins;
        z.t = op.t; z.selAfter = op.selAfter;
        return z;
      }
      H.ops.push(op);
      return op;
    };
    function s_same(op) { return op.del === op.ins; }
    H.undo = function () {
      var op = H.ops.pop(); if (!op) return null;
      H.text = apply(H.text, op.at, op.ins, op.del);
      H.undone.push(op);
      return op;
    };
    H.redo = function () {
      var op = H.undone.pop(); if (!op) return null;
      H.text = apply(H.text, op.at, op.del, op.ins);
      H.ops.push(op);
      return op;
    };
    return H;
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = E;
  root.SWVTEdit = E;

  // ---------- the view ----------
  var SW = root.SW, B = SW && SW.BENCH;
  if (!SW || !B || !B.translation || !root.document) return;
  var D = VT.layout(B.translation), esc = SW.esc, VERS = root.SWVersions;
  var CFG = Object.assign({ dir: 'checks/', tool: 'tools/vt_apply.py' }, D.edit || {});
  var TARGETS = ['translation', 'literal'];
  var S = { target: 'translation', key: null, beside: 'image', docs: {}, cur: null };

  // ---------- kept in this browser: drafts, and lists saved where the folder cannot be written ----------
  var DB = 'bench-kit-edit';
  function db() { return new Promise(function (res, rej) { var r = indexedDB.open(DB, 1); r.onupgradeneeded = function () { r.result.createObjectStore('k'); }; r.onsuccess = function () { res(r.result); }; r.onerror = function () { rej(r.error); }; }); }
  function idb(mode, fn) { return db().then(function (d) { return new Promise(function (res, rej) { var t = d.transaction('k', mode), q = fn(t.objectStore('k')); t.oncomplete = function () { res(q && q.result); }; t.onerror = function () { rej(t.error); }; }); }); }
  function keyOf(path) { return (B.store || 'bench.') + (SW.folder && SW.folder.on ? 'folder:' + SW.folder.name + ':' : 'published:') + path; }
  function hash(s) { var h = 2166136261; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return s.length + ':' + (h >>> 0).toString(36); }

  // ---------- a text being edited ----------
  // file: the file as read; base: the file with its lists applied, what a save compares against;
  // hist.text: the text now. A version's first file only, so far: a translation laid out in several files
  // (the method's text/translation/*.md) cannot yet be edited past its first.
  function open(target) {
    var id = SW.vt.ids()[target], v = VERS.byId(id);
    if (!v || !v.build || !v.build.length) return Promise.reject(new Error('The bench has no ' + target + ' version.'));
    var path = v.build[0].src, memo = S.docs[target];
    if (memo && memo.path === path && memo.key === keyOf(path)) return Promise.resolve(memo);
    return Promise.all([SW.fetchText(path), SW.vt.editLists()]).then(function (r) {
      if (/\r/.test(r[0])) throw new Error(path + ' has carriage returns (Windows line endings): a change list could not match it. Convert it first.');
      var w = E.working(r[0], r[1], target), doc = { target: target, path: path, key: keyOf(path), file: r[0], base: w.text, pending: w.pending.length, pendingIn: w.pending.map(function (c) { return c.file; }), stuck: w.stuck };
      return idb('readonly', function (st) { return st.get(doc.key); }).catch(function () { return null; }).then(function (kept) {
        var text = w.text, note = '';
        if (kept && kept.entries && kept.entries.length) {
          var again = E.working(w.text, [{ name: 'draft', raw: E.list(kept.entries) }], target);
          text = again.text;
          if (again.stuck.length) note = again.stuck.length + ' unsaved change' + (again.stuck.length === 1 ? '' : 's') + ' could not be restored: the file has changed there.';
        }
        // the steps of undo hold only if the text they were made on is the one here
        var same = kept && kept.hash === hash(w.text) && !note;
        doc.hist = E.history(text, same ? { ops: kept.ops || [], undone: kept.undone || [] } : null);
        doc.note = note;
        doc.edits = E.changes(doc.base, doc.hist.text);
        S.docs[target] = doc;
        return doc;
      });
    });
  }
  var keepTimer = {};
  function keep(doc) {
    clearTimeout(keepTimer[doc.target]);
    keepTimer[doc.target] = setTimeout(function () {
      var entries;
      try { entries = E.entries(doc.base, doc.hist.text, { target: doc.target, minWords: 1 }); } catch (e) { entries = null; }
      if (!entries) return;
      idb('readwrite', function (st) { return st.put({ hash: hash(doc.base), entries: entries, ops: doc.hist.ops, undone: doc.hist.undone }, doc.key); }).catch(function () {
        SW.toast('This browser would not keep the unsaved changes; save them before you leave the page.', 5000);
      });
    }, 500);
  }
  function dirty(doc) { return !!doc && doc.hist.text !== doc.base; }

  // ---------- drawing ----------
  var view, ta, back, pane, status, winSel;
  function allWins(doc) { if (doc.winsFor !== doc.hist.text) { doc.wins = E.windows(doc.hist.text, D); doc.winsFor = doc.hist.text; } return doc.wins; }
  function draw() {
    view = SW.$('#view-edit'); if (!view) return;
    view.innerHTML = '<div class="vte">' +
      '<div class="toolbar vte-bar">' +
        '<span class="im-seg">' + TARGETS.map(function (t) { return '<button class="btn" data-target="' + t + '">' + (t === 'literal' ? 'Literal' : 'Translation') + '</button>'; }).join('') + '</span>' +
        '<span class="vte-nav"><button class="btn ghost" data-go="-1" title="The page before (Alt+←)" aria-label="The page before">◀</button><select class="vte-win" aria-label="The page"></select><button class="btn ghost" data-go="1" title="The page after (Alt+→)" aria-label="The page after">▶</button></span>' +
        '<span class="vte-do"><button class="btn ghost" data-do="undo" title="Undo (⌘Z)">↶ Undo</button><button class="btn ghost" data-do="redo" title="Redo (⇧⌘Z)">↷ Redo</button></span>' +
        '<button class="btn" data-do="save" title="Write what has changed as a change list (⌘S)">Save</button>' +
        '<span class="vte-beside"><span class="faint">Beside</span> <span class="im-seg"><button class="btn" data-beside="image">Image</button><button class="btn" data-beside="other"></button></span></span>' +
      '</div>' +
      '<div class="vte-status hint"></div>' +
      '<div class="vte-split"><div class="vte-pane"></div><div class="vte-text"><div class="vte-stack"><pre class="vte-back" aria-hidden="true"></pre><textarea class="vte-in" spellcheck="true" aria-label="The text of this page, as the file has it"></textarea></div></div></div>' +
    '</div>';
    ta = SW.$('.vte-in', view); back = SW.$('.vte-back', view); pane = SW.$('.vte-pane', view); status = SW.$('.vte-status', view); winSel = SW.$('.vte-win', view);
    ta.lang = 'en';
    wire();
  }
  function marks(s, doc, w) {
    // what has changed since the last save, the markers and the headings, coloured under the text. A
    // page's marker and a heading carry their place, for the page in view (track())
    var spots = [], R = /\[p\. (\d+)\]|\[コマ [^\]]*\]|\[\^[^\]]+\]|^#{1,6} [^\n]*/gm, m;
    while ((m = R.exec(s))) {
      var head = m[0][0] === '#';
      spots.push({ a: m.index, b: m.index + m[0].length, c: head ? 'vte-hd' : 'vte-mk', at: m[1] ? ' data-p="' + m[1] + '"' : head ? ' data-at="' + m.index + '"' : '' });
    }
    doc.edits.forEach(function (c) {
      var a = c.b0 - w.a, b = a + c.ins.length;
      if (b <= 0 || a >= s.length) return;
      if (b > a) spots.push({ a: Math.max(0, a), b: Math.min(s.length, b), c: 'vte-new', at: '' });
    });
    spots.sort(function (x, y) { return x.a - y.a || y.b - x.b; });
    var out = '', at = 0;
    spots.forEach(function (p) { if (p.a < at) return; out += esc(s.slice(at, p.a)) + '<span class="' + p.c + '"' + p.at + '>' + esc(s.slice(p.a, p.b)) + '</span>'; at = p.b; });
    return out + esc(s.slice(at)) + '\n';
  }
  function refreshEdits(doc) { try { doc.edits = E.changes(doc.base, doc.hist.text); } catch (e) { doc.edits = []; } }
  function paint() {
    var doc = S.cur, w = doc && doc.win; if (!w) return;
    back.innerHTML = marks(ta.value, doc, w);
  }
  var paintTimer = null;
  function paintSoon() { clearTimeout(paintTimer); back.textContent = ta.value + '\n'; paintTimer = setTimeout(function () { refreshEdits(S.cur); paint(); buttons(); }, 250); }
  function buttons() {
    var doc = S.cur; if (!doc || !view) return;
    SW.$$('[data-target]', view).forEach(function (b) { b.classList.toggle('on', b.dataset.target === S.target); });
    SW.$$('[data-beside]', view).forEach(function (b) { b.classList.toggle('on', b.dataset.beside === S.beside); if (b.dataset.beside === 'other') b.textContent = S.target === 'literal' ? 'Translation' : 'Literal'; });
    SW.$('[data-do="undo"]', view).disabled = !doc.hist.ops.length;
    SW.$('[data-do="redo"]', view).disabled = !doc.hist.undone.length;
    var n = TARGETS.reduce(function (k, t) { var d = S.docs[t]; return k + (d && d.edits ? d.edits.length : 0); }, 0), sv = SW.$('[data-do="save"]', view);
    sv.disabled = !n; sv.textContent = n ? 'Save ' + n + ' change' + (n === 1 ? '' : 's') : 'Saved';
    say(doc);
  }
  function writable() { return !!(SW.folder && SW.folder.on && SW.folder.writable && SW.folder.writable()); }
  function say(doc) {
    var where = writable() ? 'Editing the folder <b>' + esc(SW.folder.name) + '</b>. A save writes a change list to <span class="mono">' + esc(realDir()) + '</span>.' :
      SW.folder && SW.folder.on ? 'Editing the folder <b>' + esc(SW.folder.name) + '</b>. This browser cannot write to it: a save downloads the change list.' :
      'Editing the published text in this browser. A save downloads a change list. File ▾ ▸ Open a folder… edits a working copy.';
    var extra = '';
    if (doc.pending) extra += ' <b>' + doc.pending + '</b> saved change' + (doc.pending === 1 ? ' is' : 's are') + ' shown here and not yet in the file. <button class="vt-chip" data-do="cmd">Copy the vt_apply command</button>';
    if (doc.stuck && doc.stuck.length) extra += ' <span class="vt-warn">⚠ ' + doc.stuck.length + ' saved change' + (doc.stuck.length === 1 ? '' : 's') + ' no longer match' + (doc.stuck.length === 1 ? 'es' : '') + ' the file: see Changes.</span>';
    if (doc.note) extra += ' <span class="vt-warn">⚠ ' + esc(doc.note) + '</span>';
    status.innerHTML = where + extra;
  }
  function fillWins(doc) {
    var wins = allWins(doc);
    winSel.innerHTML = wins.map(function (w) { return '<option value="' + w.i + '">' + esc(w.label.slice(0, 48)) + '</option>'; }).join('');
  }
  function drawPane(doc, w) {
    if (S.beside === 'other') {
      var other = S.target === 'literal' ? 'translation' : 'literal';
      pane.innerHTML = '<p class="hint pad">Reading the ' + other + '…</p>';
      open(other).then(function (o) {
        if (S.cur !== doc || doc.page !== w) return;
        var match = allWins(o).filter(function (x) { return x.key === w.key; })[0];
        pane.innerHTML = match ? '<pre class="vte-other" lang="en">' + esc(o.hist.text.slice(match.a, match.b)) + '</pre>' : '<p class="hint pad">The ' + other + ' has no ' + esc(w.label) + '.</p>';
      }, function (e) { pane.innerHTML = '<p class="pad badge err">' + esc(e.message) + '</p>'; });
      return;
    }
    var x = w.page != null && B.doc && B.doc.image ? B.doc.image({ facs: String(w.page), img: w.img }) : null;
    if (x && typeof x === 'string') x = { src: x };
    if (!x || !x.src) { pane.innerHTML = '<p class="hint pad">' + (w.page != null ? 'No image of this page.' : 'No page image for this part of the text.') + '</p>'; return; }
    pane.innerHTML = '<img class="vte-img" alt="' + esc(w.label) + '" src="' + esc(x.large || x.src) + '" title="Click to enlarge">' + (B.doc.imageCreditShort ? '<div class="faint vte-credit">' + esc(B.doc.imageCreditShort) + '</div>' : '');
    var im = SW.$('.vte-img', pane);
    im.addEventListener('click', function () { var big = im.classList.toggle('big'); if (big && x.sharp) im.src = x.sharp; });
  }
  // ---------- the text in the box ----------
  // The box holds a stretch of the text (doc.win: { a, b }, offsets in the text), never the whole, which a
  // text box would be slow to type in: pages are added as it scrolls near an end, and those far behind let
  // go, so that the whole text scrolls as one. doc.page is the window in view.
  var MAXCHARS = 60000, NEAR = 1200;
  function box() { return SW.$('.vte-text', view); }
  function setRange(doc, a, b) { doc.win.a = a; doc.win.b = b; ta.value = doc.hist.text.slice(a, b); back.innerHTML = marks(ta.value, doc, doc.win); }
  function scrollToOffset(off, margin) {
    var w = document.createTreeWalker(back, NodeFilter.SHOW_TEXT), n, at = 0;
    while ((n = w.nextNode())) {
      if (at + n.length >= off) {
        var r = document.createRange(); r.setStart(n, Math.min(off - at, n.length)); r.collapse(true);
        var rect = r.getClientRects()[0] || r.getBoundingClientRect(), bx = box();
        bx.scrollTop += rect.top - bx.getBoundingClientRect().top - (margin == null ? 90 : margin);
        return;
      }
      at += n.length;
    }
  }
  // a window more at one end; false at the end of the text. What is on the screen stays where it is
  function extend(doc, dir) {
    var wins = allWins(doc), r = doc.win, bx = box(), s0 = r.a + ta.selectionStart, e0 = r.a + ta.selectionEnd, a = r.a, b = r.b, i, h;
    if (dir > 0) { for (i = 0; i < wins.length && wins[i].b <= b; i++) {} if (i === wins.length) return false; b = wins[i].b; }
    else { for (i = wins.length - 1; i >= 0 && wins[i].a >= a; i--) {} if (i < 0) return false; a = wins[i].a; }
    if (dir > 0) {
      setRange(doc, a, b);
      if (b - a > MAXCHARS) {
        for (i = 0; i < wins.length && (wins[i].a <= a || b - wins[i].a > MAXCHARS); i++) {}
        if (i < wins.length) { h = back.offsetHeight; setRange(doc, wins[i].a, b); bx.scrollTop -= h - back.offsetHeight; }
      }
    } else {
      h = back.offsetHeight; setRange(doc, a, b); bx.scrollTop += back.offsetHeight - h;
      if (b - a > MAXCHARS) {
        for (i = wins.length - 1; i >= 0 && (wins[i].b >= b || wins[i].b - a > MAXCHARS); i--) {}
        if (i >= 0) setRange(doc, a, wins[i].b);
      }
    }
    // the caret, where it is still in the box; a box typed into must never hold it somewhere else
    if (s0 < r.a || e0 > r.b) { if (document.activeElement === ta) ta.blur(); ta.setSelectionRange(0, 0); }
    else ta.setSelectionRange(s0 - r.a, e0 - r.a);
    last = { value: ta.value, s: ta.selectionStart, e: ta.selectionEnd };
    return true;
  }
  // the page in view: the last marker or heading above the top of the box
  var paneTimer = null;
  function track(doc) {
    var spots = SW.$$('[data-p],[data-at]', back), top = box().getBoundingClientRect().top + 30, lo = 0, hi = spots.length - 1, best = null;
    while (lo <= hi) { var mid = (lo + hi) >> 1; if (spots[mid].getBoundingClientRect().top <= top) { best = spots[mid]; lo = mid + 1; } else hi = mid - 1; }
    if (!best) return;
    var wins = allWins(doc), w = best.dataset.p != null ? wins.filter(function (x) { return x.key === 'p' + best.dataset.p; })[0] : winAt(doc, doc.win.a + +best.dataset.at);
    if (!w || w.key === S.key) return;
    S.key = w.key; doc.page = w; winSel.value = String(w.i);
    SW.store.set('edit.place', { target: S.target, key: w.key });
    clearTimeout(paneTimer); paneTimer = setTimeout(function () { if (doc.page === w) drawPane(doc, w); }, 120);
  }
  var pumping = false;
  function pump() {
    if (pumping) return;
    pumping = true;
    setTimeout(function () {
      pumping = false;
      var doc = S.cur, bx = view && box(); if (!doc || !doc.win || composing || !bx) return;
      took();
      var more = false;
      if (bx.scrollTop + bx.clientHeight > bx.scrollHeight - NEAR) more = extend(doc, 1);
      else if (bx.scrollTop < NEAR) more = extend(doc, -1);
      track(doc);
      if (more) pump();
    }, 30);
  }
  // a window of the text in the box. sel: the selection to set (offsets in the text), or null for the top
  function show(doc, w, sel) {
    doc.win = { a: w.a, b: w.b }; doc.page = w; S.key = w.key;
    ta.value = doc.hist.text.slice(w.a, w.b);
    winSel.value = String(w.i);
    refreshEdits(doc); paint(); buttons(); drawPane(doc, w);
    SW.store.set('edit.place', { target: S.target, key: w.key });
    if (sel) { ta.focus({ preventScroll: true }); ta.setSelectionRange(sel[0] - w.a, sel[1] - w.a); scrollToOffset(sel[0] - w.a); }
    else {
      // a page may begin inside a paragraph: to its marker
      box().scrollTop = 0;
      var mk = w.page != null ? ta.value.indexOf('[p. ' + w.page + ']') : -1;
      if (mk > 0) scrollToOffset(mk, 8);
    }
    last = { value: ta.value, s: ta.selectionStart, e: ta.selectionEnd };
    pump();
  }
  function winAt(doc, pos) {
    var wins = allWins(doc), hit = null;
    wins.forEach(function (w) { if (w.a <= pos && pos <= w.b && !hit) hit = w; });
    if (hit) return hit;
    wins.forEach(function (w) { if (w.a <= pos) hit = w; });
    return hit || wins[0];
  }
  function go(target, key, sel) {
    S.target = target;
    return open(target).then(function (doc) {
      if (S.target !== target) return;
      S.cur = doc;
      fillWins(doc);
      var w = allWins(doc).filter(function (x) { return x.key === key; })[0] || allWins(doc)[0];
      if (!w) { ta.value = ''; return; }
      show(doc, w, sel);
    }, function (e) { status.innerHTML = '<span class="badge err">' + esc(e.message) + '</span>'; });
  }
  // a line of a file, from a link: the window that holds it
  function goLine(vid, n) {
    var ids = SW.vt.ids(), target = vid === ids.literal ? 'literal' : vid === ids.translation ? 'translation' : null;
    if (!target) return;
    S.target = target; SW.state.sel = null;
    open(target).then(function (doc) {
      S.cur = doc; fillWins(doc);
      var s = doc.hist.text, i = 0, k = 1;
      while (k < n) { var j = s.indexOf('\n', i); if (j < 0) break; i = j + 1; k++; }
      show(doc, winAt(doc, i), [i, i]);
    });
  }

  // ---------- typing ----------
  var last = { value: '', s: 0, e: 0 }, composing = false;
  function took() {
    var doc = S.cur, w = doc && doc.win; if (!w || composing) return;
    var next = ta.value; if (next === last.value) return;
    var op = E.diffOp(last.value, next, w.a);
    op.selBefore = [w.a + last.s, w.a + last.e];
    op.selAfter = [w.a + ta.selectionStart, w.a + ta.selectionEnd];
    w.b += op.ins.length - op.del.length;
    doc.hist.change(op);
    last = { value: next, s: ta.selectionStart, e: ta.selectionEnd };
    paintSoon(); keep(doc); SW.$('[data-do="undo"]', view).disabled = false; SW.$('[data-do="redo"]', view).disabled = true;
  }
  // undo or redo: the window it happened in, the selection as it was
  function step(dir) {
    var doc = S.cur; if (!doc) return;
    took();
    var op = dir < 0 ? doc.hist.undo() : doc.hist.redo();
    if (!op) return;
    var sel = dir < 0 ? (op.selBefore || [op.at, op.at + op.del.length]) : (op.selAfter || [op.at + op.ins.length, op.at + op.ins.length]);
    var r = doc.win;
    if (r && sel[0] >= r.a && sel[0] <= r.b && op.at >= r.a && op.at <= r.b) {
      refreshEdits(doc);
      setRange(doc, r.a, r.b + (dir < 0 ? op.del.length - op.ins.length : op.ins.length - op.del.length));
      ta.focus({ preventScroll: true }); ta.setSelectionRange(sel[0] - r.a, sel[1] - r.a);
      last = { value: ta.value, s: ta.selectionStart, e: ta.selectionEnd };
      scrollToOffset(sel[0] - r.a); buttons(); pump();
    } else show(doc, winAt(doc, sel[0]), sel);
    keep(doc);
  }
  function wire() {
    ta.addEventListener('input', function (e) { if (e.isComposing) { back.textContent = ta.value + '\n'; return; } took(); });
    ta.addEventListener('compositionstart', function () { composing = true; });
    ta.addEventListener('compositionend', function () { composing = false; took(); });
    ['keyup', 'mouseup', 'select'].forEach(function (ev) { ta.addEventListener(ev, function () { if (ta.value === last.value) { last.s = ta.selectionStart; last.e = ta.selectionEnd; } }); });
    // the browser's own Edit ▸ Undo comes here too: its history of this box stops at the last window drawn
    ta.addEventListener('beforeinput', function (e) {
      if (e.inputType === 'historyUndo') { e.preventDefault(); step(-1); }
      else if (e.inputType === 'historyRedo') { e.preventDefault(); step(1); }
    });
    view.addEventListener('click', function (e) {
      var t = e.target.closest('[data-target]'); if (t) { took(); go(t.dataset.target, S.key); return; }
      var g = e.target.closest('[data-go]'); if (g) { took(); move(+g.dataset.go); return; }
      var b = e.target.closest('[data-beside]'); if (b) { S.beside = b.dataset.beside; buttons(); if (S.cur && S.cur.win) drawPane(S.cur, S.cur.win); return; }
      var d = e.target.closest('[data-do]'); if (!d) return;
      if (d.dataset.do === 'undo') step(-1);
      else if (d.dataset.do === 'redo') step(1);
      else if (d.dataset.do === 'save') saveBox();
      else if (d.dataset.do === 'cmd') copyCommand();
    });
    winSel.addEventListener('change', function () { took(); var w = allWins(S.cur)[+winSel.value]; if (w) show(S.cur, w); });
    box().addEventListener('scroll', pump, { passive: true });
  }
  function move(d) { var doc = S.cur; if (!doc || !doc.page) return; var wins = allWins(doc), at = wins.filter(function (x) { return x.key === S.key; })[0], w = at && wins[at.i + d]; if (w) show(doc, w); }
  document.addEventListener('keydown', function (e) {
    if (!SW.state || SW.state.tab !== 'edit' || document.querySelector('dialog[open]')) return;
    var mod = e.metaKey || e.ctrlKey, k = e.key.toLowerCase();
    if (mod && k === 'z') { e.preventDefault(); step(e.shiftKey ? 1 : -1); }
    else if (mod && k === 'y') { e.preventDefault(); step(1); }
    else if (mod && k === 's') { e.preventDefault(); took(); if (TARGETS.some(function (t) { return dirty(S.docs[t]); })) saveBox(); }
    else if (e.altKey && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) { e.preventDefault(); took(); move(e.key === 'ArrowLeft' ? -1 : 1); }
  });

  // ---------- saving ----------
  function realDir() { return SW.vt.editDir() || CFG.dir; }
  function stamp() { var d = new Date(), p = function (n) { return String(n).padStart(2, '0'); }; return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) + '-' + p(d.getHours()) + p(d.getMinutes()); }
  function nameFor(doc) { return 'edit-' + stamp() + '-' + doc.path.split('/').pop().replace(/\.[^.]*$/, '') + '.md'; }
  function originOf(box) {
    var k = SW.$('.vte-origin', box).value;
    if (k === 'witness') return 'witness ' + SW.$('.vte-wit', box).value.trim();
    var ini = SW.store.get('initials', '');
    return k === 'editor' && ini ? 'editor ' + ini : k;
  }
  function saveBox() {
    took();
    var docs = TARGETS.map(function (t) { return S.docs[t]; }).filter(dirty), sets;
    try { sets = docs.map(function (doc) { return { doc: doc, entries: E.entries(doc.base, doc.hist.text, { target: doc.target, desc: D }) }; }); }
    catch (e) { SW.toast(e.message, 8000); return; }
    var i = 0, d = SW.el('dialog', { class: 'vte-save' });
    d.innerHTML = '<form method="dialog"><h3>Save as a change list</h3>' +
      '<div class="toolbar"><label>Origin <select class="vte-origin"><option value="editor">editor: revised here by a person</option><option value="internal">internal: a check the agents ran on their own output</option><option value="witness">witness: from a witness</option></select></label> <input class="vte-wit" placeholder="The witness’s ID" hidden></div>' +
      '<label class="vte-allwhy">Why, for any change without its own <input class="vte-why0" type="text"></label>' +
      '<div class="vte-list">' + sets.map(function (s) {
        return '<h4>' + esc(s.doc.target) + ' <span class="faint">' + esc(s.doc.path) + '</span></h4>' + s.entries.map(function (e) {
          var k = i++;
          return '<div class="vt-ch"><div class="vt-ch-h"><b>' + esc(e.where || '') + '</b></div><div class="vt-old"><span class="faint">OLD</span> ' + esc(e.old) + '</div><div class="vt-new"><span class="faint">NEW</span> ' + esc(e.new) + '</div>' +
            '<input class="vte-why" data-k="' + k + '" type="text" placeholder="Why (optional)"> <input class="vte-src" data-k="' + k + '" type="text" lang="' + esc(B.textLang || 'ja') + '" placeholder="The source’s wording (optional)"></div>';
        }).join('');
      }).join('') + '</div>' +
      '<div class="row"><button value="cancel" class="btn ghost">Cancel</button> <button type="button" class="btn vte-ok">' + (writable() ? 'Write the list' : 'Download the list') + '</button></div></form>';
    document.body.appendChild(d);
    d.addEventListener('close', function () { d.remove(); });
    SW.$('.vte-origin', d).addEventListener('change', function (e) { SW.$('.vte-wit', d).hidden = e.target.value !== 'witness'; });
    SW.$('.vte-ok', d).addEventListener('click', function () {
      var origin = originOf(d);
      if (/^witness\s*$/.test(origin)) { SW.toast('Name the witness.', 3000); return; }
      var why0 = SW.$('.vte-why0', d).value.trim(), whys = {}, srcs = {}, off = 0;
      SW.$$('.vte-why', d).forEach(function (x) { whys[+x.dataset.k] = x.value.trim() || why0; });
      SW.$$('.vte-src', d).forEach(function (x) { srcs[+x.dataset.k] = x.value.trim(); });
      var files = sets.map(function (s) {
        var name = nameFor(s.doc), w = {}, r = {};
        s.entries.forEach(function (_, j) { w[j] = whys[off + j]; r[j] = srcs[off + j]; });
        off += s.entries.length;
        return { doc: s.doc, name: name, raw: E.list(s.entries, { title: 'Edit: ' + s.doc.target + ', ' + stamp(), origin: origin, whys: w, srcs: r }) };
      });
      write(files).then(function () { d.close(); }, function (e) { SW.toast(e.message, 8000); });
    });
    d.showModal();
  }
  function write(files) {
    var toFolder = writable();
    return files.reduce(function (p, f) {
      return p.then(function () {
        f.path = f.name;
        if (!toFolder) { download(f.name, f.raw); return SW.vt.keepList(f.name, f.raw); }
        return SW.folder.write(realDir().replace(/\/?$/, '/') + f.name, f.raw, { fresh: true }).then(function (at) { f.path = at; });
      });
    }, Promise.resolve()).then(function () {
      files.forEach(function (f) { f.doc.base = f.doc.hist.text; f.doc.pending += VT.changes(f.raw, f.path).length; f.doc.pendingIn.push(f.path); keepNow(f.doc); refreshEdits(f.doc); });
      SW.vt.refresh();
      paint(); buttons();
      SW.toast(files.length === 1 ? (toFolder ? 'Written: ' : 'Downloaded: ') + files[0].name : files.length + ' lists ' + (toFolder ? 'written.' : 'downloaded.'), 5000);
    });
  }
  function keepNow(doc) { idb('readwrite', function (st) { return st.put({ hash: hash(doc.base), entries: [], ops: doc.hist.ops, undone: doc.hist.undone }, doc.key); }).catch(function () {}); }
  function download(name, raw) { var a = SW.el('a', { href: URL.createObjectURL(new Blob([raw], { type: 'text/markdown' })), download: name }); document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1000); }
  // the lists not yet in their files, and each text's file, from the top of the working copy
  function copyCommand() {
    var lists = {}, targets = [];
    TARGETS.forEach(function (t) {
      var d = S.docs[t]; if (!d) return;
      d.pendingIn.forEach(function (p) { lists[p] = 1; });
      targets.push('--target ' + t + '=' + (SW.folder && SW.folder.on ? SW.folder.locate(d.path) || d.path : d.path));
    });
    SW.copyText(['python3', CFG.tool].concat(Object.keys(lists), targets).join(' '), 'the command (a dry run; add --write to apply)');
  }

  // ---------- the view, to the shell ----------
  var drawn = false;
  function place() {
    var p = SW.store.get('edit.place', null), sel = SW.state.sel;
    // both texts, so that the count on Save takes in a draft of either
    TARGETS.forEach(function (t) { open(t).then(buttons, function () {}); });
    if (sel && SW.state.v) { goLine(SW.state.v, sel.n0); return; }
    if (p) go(p.target, p.key); else go(S.target, null);
  }
  SW.views.edit = {
    show: function () { if (!drawn) { draw(); drawn = true; place(); } else if (SW.state.sel) goLine(SW.state.v, SW.state.sel.n0); },
    enter: function () { if (SW.state.sel) goLine(SW.state.v, SW.state.sel.n0); }
  };
  if (SW.on) {
    SW.on('goto', function (g) { if (SW.state.tab === 'edit' && drawn) goLine(SW.state.v, g.n); });
    // a folder opened or closed: another text, with drafts of its own
    SW.on('folder', function () { S.docs = {}; S.cur = null; if (drawn && SW.state.tab === 'edit') place(); });
  }
})(typeof window !== 'undefined' ? window : globalThis);
