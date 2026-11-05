/*
 * vt-views.js - the views of a translation bench (templates/translation), on kit/vt-reader.js:
 *   glossary  the glossary as a concordance: each source term, its readings and renderings, and where
 *             each rendering falls in the translation, by section; English words that
 *             render more than one source term marked
 *   changes   the change lists: every change with its target, page, OLD and NEW, why and origin
 *             (internal, a witness, unmarked), and whether it is in the text now (applied, pending,
 *             both, gone), filtered by origin, state and target; each to its place in the text
 *   search    a source word looked for in the source's OCR (exact after old character forms are
 *             folded to new, or with one character wrong) and in the translation's texts
 * Loaded after kit/vt-reader.js and kit/builds.js, before kit/shell.js. The bench lists the views in
 * its shell.views, with a tab and a section for each (view-glossary, view-changes, view-search).
 * SW.BENCH.translation, the descriptor (kit/vt-reader.js), with:
 *   versions  { literal, translation, ocr }: the ids of the versions in js/versions.js (readable, the
 *             translation's old name, is read as translation)
 *   glossary  { path, kind, heading }; changes [paths]; ocr { path, split }  (paths as the versions'
 *             files are fetched, so a folder opened (kit/folder.js) is read too)
 * SW.vt: ids(), texts(), glossary(), changes(), ocr(), states() (each change with its state).
 * Part of bench-kit (github.com/critical-code-studies/bench-kit).
 */
(function (root) {
  'use strict';
  var SW = root.SW, B = SW.BENCH || {}, VT = root.SWVT, esc = SW.esc;
  if (!VT || !B.translation) return;
  var D = VT.layout(B.translation), V = SW.vt = {};
  V.ids = function () { return Object.assign({ literal: 'literal', translation: 'translation', ocr: 'ocr' }, D.versions || {}); };
  var RAW = {};
  function once(f) { var p = null; return function () { return p || (p = f().catch(function (e) { p = null; throw e; })); }; }
  // each text's build, its parts as read by vt-reader (b.vt) and its raw text whole
  RAW.texts = function () {
    var ids = V.ids();
    return Promise.all([ids.literal, ids.translation].map(function (id) { return SW.build(id).catch(function () { return null; }); })).then(function (bs) {
      return { literal: bs[0], translation: bs[1] };
    });
  };
  // each read once, until a folder is opened or closed
  function wrap() { Object.keys(RAW).forEach(function (k) { V[k] = once(RAW[k]); }); }
  function whole(b) { return b ? b.parts.map(function (p) { return p.raw; }).join('\n') : null; }
  RAW.glossary = function () {
    var g = D.glossary; if (!g || !g.path) return Promise.resolve([]);
    return SW.fetchText(g.path).then(function (raw) { return VT.glossary(raw, g.kind || 'csv', { heading: g.heading }); });
  };
  RAW.changes = function () {
    var ps = [].concat(D.changes || []).filter(function (p) { return !/\*/.test(p); });
    return Promise.all(ps.map(function (p) { return SW.fetchText(p).then(function (raw) { return VT.changes(raw, p); }, function () { return []; }); }))
      .then(function (ls) { return [].concat.apply([], ls); });
  };
  RAW.ocr = function () {
    var o = D.ocr; if (!o || !o.path) return Promise.resolve([]);
    return SW.fetchText(o.path).then(function (raw) { return VT.ocr(raw, o.split); });
  };
  RAW.states = function () {
    return Promise.all([V.changes(), V.texts()]).then(function (r) {
      var texts = { literal: whole(r[1].literal), translation: whole(r[1].translation) };
      r[0].forEach(function (c) { c.state = VT.applied(c, texts); c.origin1 = VT.originOf(c); });
      return r[0];
    });
  };
  wrap();
  // a place in a text's build: the first line holding s, from part p0 on
  function find(b, s) {
    if (!b || !s) return null;
    var probe = String(s).split(/\n+/).map(function (x) { return x.trim(); }).filter(Boolean)[0];
    for (var p = 0; p < b.parts.length; p++) {
      var ls = VT.splitLines(b.parts[p].raw);
      for (var i = 0; i < ls.length; i++) if (ls[i].indexOf(probe) >= 0) return { p: p, n0: i + 1, n1: i + 1 };
    }
    return null;
  }
  // the section a line is in (its top heading, level 2 or the first level the text uses)
  function sectionOf(t, n) {
    var L = t.lines[n - 1]; if (!L || !L.sec.length) return null;
    var top = t.lines[L.sec[0] - 1], two = L.sec.map(function (k) { return t.lines[k - 1]; }).filter(function (h) { return h.level === 2; })[0];
    return (two || top).title;
  }
  function pending(view, what) { view.innerHTML = '<p class="hint pad">Reading the ' + what + '…</p>'; }
  function failed(view, e) { view.innerHTML = '<p class="pad badge err">' + esc(e.message || String(e)) + '</p>'; }

  // ---------- the glossary, as a concordance ----------
  function drawGlossary() {
    var view = SW.$('#view-glossary'); if (!view) return;
    pending(view, 'glossary');
    Promise.all([V.glossary(), V.texts()]).then(function (r) {
      var gl = r[0], rb = r[1].translation, ids = V.ids();
      if (!gl.length) { view.innerHTML = '<p class="hint pad">The bench names no glossary (SW.BENCH.translation.glossary).</p>'; return; }
      var col = {}; VT.collisions(gl).forEach(function (c) { col[c.english] = c.terms.map(function (g) { return g.source.join(' / '); }); });
      // each rendering's places in the translation's body, by section
      var ts = rb ? rb.parts.map(function (p) { return VT.read(p.raw, D); }) : [];
      function where(word) {
        var w = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), R = new RegExp('(^|[^\\p{L}])' + w + '(?![\\p{L}])', 'giu'), out = {}, order = [];
        ts.forEach(function (t, p) {
          t.lines.forEach(function (L) {
            if (L.n >= t.bodyEnd || L.n < t.bodyStart || L.kind === 'head' || L.kind === 'working') return;
            R.lastIndex = 0; var k = 0; while (R.exec(L.raw)) k++;
            if (!k) return;
            var s = sectionOf(t, L.n) || '(before the first heading)';
            if (!out[s]) { out[s] = { n: 0, at: { p: p, n0: L.n, n1: L.n } }; order.push(s); }
            out[s].n += k;
          });
        });
        return order.map(function (s) { return [s, out[s]]; });
      }
      view.innerHTML = '<div class="vt-pad"><h2>Glossary</h2><p class="hint">Each source term, its renderings (a note in brackets), and where each rendering falls in the author’s text of the translation, section by section (a count opens Read at its first place). ⚠ marks an English word that renders more than one source term.</p>' +
        '<div class="toolbar"><input type="search" class="vt-q" placeholder="Filter: a source term, a reading or an English word" aria-label="Filter the glossary"><span class="faint vt-n"></span></div>' +
        '<table class="vt-table vt-gloss"><thead><tr><th>Source</th><th>Reading</th><th>English</th><th>Where, in the translation</th></tr></thead><tbody>' +
        gl.map(function (g, i) {
          return '<tr data-i="' + i + '" data-hay="' + esc([g.source.join(' '), g.reading.join(' '), g.english.join(' '), g.note || ''].join(' ').toLowerCase()) + '"><td class="vt-src" lang="' + esc(B.textLang || 'ja') + '">' + esc(g.source.join(' / ')) + '</td><td>' + esc(g.reading.join(' / ')) + '</td><td>' +
            g.english.map(function (e) { var c = col[e.toLowerCase()]; return '<div>' + esc(e) + (c ? ' <span class="vt-warn" title="Also renders ' + esc(c.filter(function (x) { return x !== g.source.join(' / '); }).join(', ')) + '">⚠</span>' : '') + '</div>'; }).join('') +
            (g.note ? '<div class="faint vt-note" title="A note in the glossary, not a rendering">(' + esc(g.note) + ')</div>' : '') + '</td><td class="vt-where" data-where="' + i + '"><span class="faint">…</span></td></tr>';
        }).join('') + '</tbody></table></div>';
      // the counts, row by row, so the table shows at once
      var rowsEl = SW.$$('tr[data-i]', view), k = 0;
      (function next() {
        var end = Math.min(rowsEl.length, k + 8);
        for (; k < end; k++) {
          var g = gl[k], cell = SW.$('[data-where="' + k + '"]', view);
          cell.innerHTML = g.english.map(function (e) {
            var ws = where(e);
            return ws.length ? '<div><span class="faint">' + esc(e) + ':</span> ' + ws.map(function (x) { return '<button class="vt-chip" data-go="' + esc(JSON.stringify(x[1].at)) + '" title="' + esc(x[0]) + '">' + esc(x[0].slice(0, 28)) + ' ' + x[1].n + '</button>'; }).join(' ') + '</div>' : '<div class="faint">' + esc(e) + ': not in the translation</div>';
          }).join('');
        }
        if (k < rowsEl.length) setTimeout(next, 0);
      })();
      var q = SW.$('.vt-q', view), n = SW.$('.vt-n', view);
      function filter() { var s = q.value.toLowerCase(), c = 0; rowsEl.forEach(function (tr) { var on = !s || tr.dataset.hay.indexOf(s) >= 0; tr.hidden = !on; if (on) c++; }); n.textContent = c + ' of ' + gl.length; }
      q.addEventListener('input', filter); filter();
      view.addEventListener('click', function (e) { var b = e.target.closest('[data-go]'); if (b) SW.openAt(ids.translation, JSON.parse(b.dataset.go)); });
    }, function (e) { failed(view, e); });
  }

  // ---------- the change lists ----------
  var CF = { origin: '', state: '', target: '', q: '' };
  var SAY = { applied: 'Applied', pending: 'Pending', both: 'Old and new both present', gone: 'Neither present: changed again since' };
  function drawChanges() {
    var view = SW.$('#view-changes'); if (!view) return;
    pending(view, 'change lists');
    Promise.all([V.states(), V.texts()]).then(function (r) {
      var cs = r[0], bs = r[1], ids = V.ids();
      if (!cs.length) { view.innerHTML = '<p class="hint pad">The bench names no change lists (SW.BENCH.translation.changes).</p>'; return; }
      function okey(c) { return c.origin1.k === 'witness' ? 'witness ' + c.origin1.id : c.origin1.k; }
      var origins = {}, states = {};
      cs.forEach(function (c) { origins[okey(c)] = (origins[okey(c)] || 0) + 1; var s = c.kind === 'PROBLEM' ? 'problem' : c.state || 'unknown'; states[s] = (states[s] || 0) + 1; });
      function chips(name, obj, cur) { return Object.keys(obj).sort().map(function (k) { return '<button class="btn' + (cur === k ? ' on' : '') + '" data-f="' + name + '" data-v="' + esc(k) + '">' + esc(k) + ' <span class="faint">' + obj[k] + '</span></button>'; }).join(''); }
      view.innerHTML = '<div class="vt-pad"><h2>Changes</h2><p class="hint">Every change in the change lists, by its origin (made in the text, or from a witness), and whether it is in the text now.</p>' +
        '<div class="toolbar vt-filters"><span class="faint">Origin</span>' + chips('origin', origins, CF.origin) + '<span class="sep"></span><span class="faint">State</span>' + chips('state', states, CF.state) +
        '<span class="sep"></span><input type="search" class="vt-q" placeholder="Search the changes" value="' + esc(CF.q) + '"><span class="faint vt-n"></span></div><div class="vt-changes"></div></div>';
      var box = SW.$('.vt-changes', view);
      function list() {
        var q = CF.q.toLowerCase(), shown = cs.filter(function (c) {
          if (CF.origin && okey(c) !== CF.origin) return false;
          if (CF.state && (c.kind === 'PROBLEM' ? 'problem' : c.state || 'unknown') !== CF.state) return false;
          if (q && [c.old, c.new, c.src, c.why, c.note, c.label, c.part, c.file].join(' ').toLowerCase().indexOf(q) < 0) return false;
          return true;
        });
        SW.$('.vt-n', view).textContent = shown.length + ' of ' + cs.length;
        box.innerHTML = shown.slice(0, 400).map(function (c) {
          var i = cs.indexOf(c), st = c.kind === 'PROBLEM' ? 'problem' : c.state;
          return '<div class="vt-ch"><div class="vt-ch-h"><b>' + esc(c.target || '') + '</b>' + (c.page != null ? ' · p. ' + c.page : '') + (c.kind ? ' · ' + esc(c.kind) : '') + (c.label ? ' · ' + esc(c.label) : '') +
            ' <span class="vt-st vt-st-' + esc(st || 'x') + '">' + esc(SAY[st] || st || '') + '</span> <span class="faint">' + esc(okey(c)) + ' · ' + esc(c.file) + ':' + c.n + '</span>' +
            (c.kind !== 'PROBLEM' && st !== 'gone' ? ' <button class="vt-chip" data-at="' + i + '">In the text</button>' : '') + '</div>' +
            (c.note ? '<div>' + esc(c.note) + '</div>' : '') +
            (c.old ? '<div class="vt-old"><span class="faint">OLD</span> ' + esc(c.old) + '</div>' : '') + (c.new ? '<div class="vt-new"><span class="faint">NEW</span> ' + esc(c.new) + '</div>' : '') +
            (c.src ? '<div class="vt-srcline" lang="' + esc(B.textLang || 'ja') + '"><span class="faint">SRC</span> ' + esc(c.src) + '</div>' : '') + (c.why ? '<div class="faint">' + esc(c.why) + '</div>' : '') + '</div>';
        }).join('') + (shown.length > 400 ? '<p class="hint">The first 400 shown; narrow the filters for the rest.</p>' : '');
      }
      list();
      view.addEventListener('click', function (e) {
        var f = e.target.closest('[data-f]');
        if (f) { CF[f.dataset.f] = CF[f.dataset.f] === f.dataset.v ? '' : f.dataset.v; SW.$$('[data-f="' + f.dataset.f + '"]', view).forEach(function (b) { b.classList.toggle('on', CF[f.dataset.f] === b.dataset.v); }); list(); return; }
        var a = e.target.closest('[data-at]');
        if (a) { var c = cs[+a.dataset.at], b = bs[c.target === 'readable' ? 'translation' : c.target], at = find(b, c.state === 'pending' ? c.old : c.new || c.old); if (at && b) SW.openAt(b.v.id, at); else SW.toast('Not found in the ' + c.target + ' now.', 3000); }
      });
      SW.$('.vt-q', view).addEventListener('input', function (e) { CF.q = e.target.value; list(); });
    }, function (e) { failed(view, e); });
  }

  // ---------- a source word ----------
  function drawSearch() {
    var view = SW.$('#view-search'); if (!view) return;
    view.innerHTML = '<div class="vt-pad"><h2>Search the source</h2><p class="hint">A source word in the source’s OCR (old character forms read as new), and in the translation’s texts. The OCR misreads some words; One character wrong finds those it reads with one mistake.</p>' +
      '<div class="toolbar"><input type="search" class="vt-sq" lang="' + esc(B.textLang || 'ja') + '" placeholder="A source word: 偶然性" aria-label="A source word"><label class="check"><input type="checkbox" class="vt-fuzzy"> One character wrong</label><button class="btn vt-go">Search</button></div><div class="vt-res"></div></div>';
    var q = SW.$('.vt-sq', view), res = SW.$('.vt-res', view), fz = SW.$('.vt-fuzzy', view);
    function run() {
      var w = q.value.trim(); if (!w) return;
      res.innerHTML = '<p class="hint">Searching…</p>';
      Promise.all([V.ocr(), V.texts()]).then(function (r) {
        var hits = VT.search(r[0], w, { fuzzy: fz.checked }), ids = V.ids(), out = '';
        // each image's first page, as Book has it (the image a page break gives)
        var imgPage = {};
        if (r[1].literal && r[1].literal.doc) r[1].literal.doc.forEach(function (d) { (d ? d.blocks : []).forEach(function (bl) { if (bl.t === 'pb' && bl.img != null && imgPage[bl.img] == null) imgPage[bl.img] = bl.facs; }); });
        out += '<h3>In the OCR <span class="faint">' + hits.length + (r[0].length ? '' : ' (the bench names no OCR)') + '</span></h3>' + hits.slice(0, 200).map(function (h) {
          var pg = imgPage[h.img];
          return '<div class="vt-hit" lang="' + esc(B.textLang || 'ja') + '"><span class="faint">image ' + h.img + (pg != null ? ', near p. ' + pg : '') + '</span> ' + (h.near ? '<span class="vt-st vt-st-both">near: ' + esc(h.found) + '</span> ' : '') + esc(h.context) +
            (pg != null && ids.literal ? ' <button class="vt-chip" data-book="' + pg + '">Book ↗</button>' : '') + '</div>';
        }).join('');
        ['translation', 'literal'].forEach(function (k) {
          var b = r[1][k]; if (!b) return;
          var found = [];
          b.parts.forEach(function (p, pi) { VT.splitLines(p.raw).forEach(function (s, i) { if (VT.fold(s).indexOf(VT.fold(w)) >= 0) found.push({ p: pi, n: i + 1, s: s }); }); });
          out += '<h3>In the ' + k + ' <span class="faint">' + found.length + '</span></h3>' + found.slice(0, 100).map(function (f) {
            var c = f.s.indexOf(w), ctx = c >= 0 ? f.s.slice(Math.max(0, c - 60), c + w.length + 60) : f.s.slice(0, 140);
            return '<div class="vt-hit"><button class="vt-chip" data-read="' + esc(b.v.id) + '" data-p="' + f.p + '" data-n="' + f.n + '">line ' + f.n + '</button> ' + esc(ctx) + '</div>';
          }).join('');
        });
        res.innerHTML = out;
      }, function (e) { res.innerHTML = '<p class="badge err">' + esc(e.message) + '</p>'; });
    }
    SW.$('.vt-go', view).addEventListener('click', run);
    q.addEventListener('keydown', function (e) { if (e.key === 'Enter') run(); });
    res.addEventListener('click', function (e) {
      var r = e.target.closest('[data-read]'); if (r) { SW.openAt(r.dataset.read, { p: +r.dataset.p, n0: +r.dataset.n, n1: +r.dataset.n }); return; }
      var bk = e.target.closest('[data-book]');
      if (bk) V.texts().then(function (t) {
        var b = t.literal, pg = bk.dataset.book;
        for (var p = 0; p < b.parts.length; p++) { var tt = VT.read(b.parts[p].raw, D), g = tt.pages.filter(function (x) { return String(x.page) === pg; })[0]; if (g) { SW.select(b.v.id); SW.state.sel = { p: p, n0: g.n, n1: g.n }; SW.setTab('book'); return; } }
      });
    });
  }

  var drawn = {};
  function view(name, draw) { SW.views[name] = { show: function () { if (!drawn[name]) { drawn[name] = true; draw(); } }, reset: function () { drawn[name] = false; } }; }
  view('glossary', drawGlossary); view('changes', drawChanges); view('search', drawSearch);
  // a folder opened or closed (kit/folder.js): everything read again
  if (SW.on) SW.on('folder', function () { wrap(); drawn = {}; });
})(typeof window !== 'undefined' ? window : globalThis);
