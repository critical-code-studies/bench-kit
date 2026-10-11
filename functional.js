/*
 * functional.js - a functional overview of a version, read from the source, not run: where the
 * program starts (the routine SW.BENCH.entry names) and what it calls, in order, and what each
 * of those calls in turn; what each file runs as it is loaded (its code outside any routine);
 * each file's routines and those the other files call; and the calls between the files.
 *
 * By default a routine begins where SW.BENCH.routine matches (the bench's core.js marks its
 * lines 'def' in b.kind and names it in b.sym), runs to the first code line indented no deeper
 * than its own first line, and calls another where that one's name is followed by "(" (not
 * after a "."). A bench reads its language better with SW.BENCH.functional:
 *   analyse(b)  -> { rs: [{ name, p, n, end, calls: [{ name, line, named }] }], outside: [[lines] per file] }
 *                  (named: the routine is quoted or passed, for something else to call, not called)
 *   note(b)     -> HTML under the start, for what the routines alone do not say
 * SW.functionalOverview.render(b, el) draws it into el (a bench with lenses calls it from one);
 * a page with a section #view-functional has it as the view 'functional'.
 * Part of bench-kit (github.com/critical-code-studies/bench-kit).
 */
(function (root) {
  'use strict';
  var SW = root.SW, B = SW.BENCH, FO = SW.functionalOverview = {};
  function H() { return B.functional || {}; }

  function fileName(b, p) { return b.parts[p].src.split('/').pop(); }
  function card(title, lede) { var c = SW.el('div', { class: 'card' }); c.innerHTML = '<h3>' + SW.esc(title) + '</h3>' + (lede ? '<p class="lede">' + lede + '</p>' : ''); return c; }
  function wide(c) { c.style.gridColumn = '1 / -1'; return c; }
  function go(b, p, n, text) { return '<a href="#" data-go="' + p + ':' + n + '">' + SW.esc(text != null ? text : fileName(b, p) + ':' + n) + '</a>'; }
  function at(b, p, n) { return { html: go(b, p, n), sort: p * 100000 + n, text: fileName(b, p) + ':' + n }; }
  function esc(s) { return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

  // The routines of a version, each with its extent and the routines it calls, in the order of
  // its lines. A routine runs to the line before the first code line indented no deeper than its
  // own first line (Python's dedent; the closing brace of a C or JavaScript function), or to the
  // next routine in the same file.
  function indent(raw) { return /^[ \t]*/.exec(raw)[0].replace(/\t/g, '        ').length; }
  function analyse(b) { return H().analyse ? withNames(H().analyse(b)) : plain(b); }
  function withNames(A) { A.byName = {}; A.rs.forEach(function (r) { if (!A.byName[r.name]) A.byName[r.name] = r; }); return A; }
  function plain(b) {
    var rs = [], byName = {};
    b.lines.forEach(function (ls, p) {
      if (b.parts[p].role === 'doc') return;
      ls.forEach(function (L) {
        if (b.kind[p + ':' + L.n] !== 'def') return;
        var s = Object.keys(b.sym).filter(function (k) { return b.sym[k].p === p && b.sym[k].n === L.n; })[0];
        if (s) rs.push({ name: s, p: p, n: L.n });
      });
    });
    rs.forEach(function (r, i) {
      var next = rs[i + 1], last = next && next.p === r.p ? next.n - 1 : b.lines[r.p].length, ind = indent(b.lines[r.p][r.n - 1].raw);
      r.end = last;
      for (var n = r.n + 1; n <= last; n++) { var raw = b.lines[r.p][n - 1].raw; if (SW.parseLine(raw).code.trim() && indent(raw) <= ind) { r.end = n - 1; break; } }
      if (!byName[r.name]) byName[r.name] = r;
    });
    var re = rs.map(function (r) { return { r: r, re: new RegExp('(^|[^\\w.])' + esc(r.name) + '\\s*\\(') }; });
    rs.forEach(function (r) {
      var first = {};
      for (var n = r.n + 1; n <= r.end; n++) {
        var code = SW.parseLine(b.lines[r.p][n - 1].raw).code;
        re.forEach(function (x) { if (x.r.name !== r.name && first[x.r.name] == null && x.re.test(code)) first[x.r.name] = n; });
      }
      r.calls = Object.keys(first).map(function (k) { return { name: k, line: first[k] }; }).sort(function (a, z) { return a.line - z.line; });
    });
    // code outside any routine: what a file runs as it is loaded
    var outside = b.parts.map(function (pt, p) {
      if (pt.role === 'doc') return [];
      var inR = {};
      rs.forEach(function (r) { if (r.p === p) for (var n = r.n; n <= r.end; n++) inR[n] = 1; });
      return b.lines[p].filter(function (L) { return !inR[L.n] && SW.parseLine(L.raw).code.trim(); });
    });
    return { rs: rs, byName: byName, outside: outside };
  }

  // o.head false: no title and export of its own (a lens has them)
  FO.render = function (b, view, o) {
    o = o || {};
    view.innerHTML = '';
    if (!view._fo) { view._fo = true; view.addEventListener('click', goClick); }
    var pad = SW.el('div', { class: 'pad', style: 'max-width:none' });
    var head = SW.el('div', { class: 'toolbar', style: 'position:static;padding:0 0 10px' });
    head.innerHTML = '<b>Functional overview</b> <span class="hint">Read from the source: where the program starts, what each file runs as it loads, the files’ routines and the calls between them.</span> ' + SW.refTag(b.v.id);
    if (o.head !== false) pad.appendChild(head);
    var cards = SW.el('div', { class: 'cards' });
    pad.appendChild(cards);
    view.appendChild(pad);
    if (!b.v.build) { cards.innerHTML = '<p class="hint">The bench holds no text of ' + SW.esc(b.v.label) + '.</p>'; return null; }
    var A = analyse(b), rows = { start: [], load: [], files: [], calls: [] };

    // where it starts
    var e = A.byName[B.entry];
    var sc = wide(card('Where it starts', e ? 'The routine ' + SW.esc(B.entry) + ' in ' + SW.esc(fileName(b, e.p)) + ' (SW.BENCH.entry), the routines it calls (→)' + (H().analyse ? ' or names for something else to call (‘)' : '') + ' in the order of its lines, and what each of those calls in turn. Click a name to read it.' : ''));
    if (!e) sc.insertAdjacentHTML('beforeend', '<p class="hint">' + SW.esc(b.v.label) + ' has no routine ' + SW.esc(B.entry || '(SW.BENCH.entry is not set)') + '.</p>');
    else {
      sc.insertAdjacentHTML('beforeend', '<ol class="fo-loop">' + e.calls.map(function (c) {
        var r = A.byName[c.name];
        rows.start.push([String(c.line), c.name, c.named ? 'names' : 'calls', fileName(b, r.p) + ':' + r.n, r.calls.map(function (x) { return (x.named ? '‘' : '') + x.name; }).join(' ')]);
        return '<li><span class="fo-ln">' + go(b, e.p, c.line, String(c.line)) + '</span><span class="fo-how" title="' + (c.named ? 'Named, for something else to call' : 'Called') + '">' + (c.named ? '‘' : '→') + '</span>' + go(b, r.p, r.n, c.name).replace('<a ', '<a class="fo-fn mono" ') +
          ' <span class="faint">' + SW.esc(fileName(b, r.p)) + '</span>' +
          (r.calls.length ? '<div class="fo-next">' + r.calls.map(function (x) { var rx = A.byName[x.name]; return go(b, rx.p, rx.n, (x.named ? '‘' : '') + x.name); }).join(' ') + '</div>' : '') + '</li>';
      }).join('') + '</ol>' + (e.calls.length ? '' : '<p class="hint">It calls no other routine.</p>') + (H().note ? H().note(b) || '' : ''));
    }
    cards.appendChild(sc);

    // what each file runs as it is loaded
    var lc = wide(card('Start-up', 'The files of the version in order, with their routines and the code each runs as it is loaded: the lines outside any routine (imports, settings, the call that starts the program).'));
    var lh = '<table class="data fo-start"><thead><tr><th>#</th><th>File</th><th>Routines</th><th>Run at load</th></tr></thead><tbody>' + b.parts.map(function (pt, p) {
      if (pt.role === 'doc') return '';
      var n = A.rs.filter(function (r) { return r.p === p; }).length, out = A.outside[p];
      rows.load.push([String(p + 1), fileName(b, p), String(n), out.map(function (L) { return L.raw.trim(); }).join(' · ')]);
      return '<tr><td class="num">' + (p + 1) + '</td><td class="mono">' + SW.esc(fileName(b, p)) + '</td><td class="num">' + n + '</td><td class="mono fo-run">' +
        (out.length ? out.map(function (L) { return go(b, p, L.n, L.raw.trim().slice(0, 60)); }).join('<br>') : '<span class="faint">nothing</span>') + '</td></tr>';
    }).join('') + '</tbody></table>';
    lc.insertAdjacentHTML('beforeend', lh);
    cards.appendChild(lc);

    // the files, their routines, and the calls between them
    var files = b.parts.map(function (pt, p) { return pt.role === 'doc' ? null : p; }).filter(function (p) { return p != null; });
    var into = {}, pairs = {};
    A.rs.forEach(function (r) { r.calls.forEach(function (c) { var t = A.byName[c.name]; var k = r.p + '>' + t.p; (pairs[k] = pairs[k] || []).push([r, t]); if (t.p !== r.p) (into[t.name] = into[t.name] || {})[r.name] = 1; }); });
    var fc = wide(card('The files', 'Each file’s routines, and its entry points: its routines called from other files.'));
    fc.insertAdjacentHTML('beforeend', '<table class="data"><thead><tr><th>File</th><th>Routines</th><th>Entry points</th></tr></thead><tbody>' + files.map(function (p) {
      var mine = A.rs.filter(function (r) { return r.p === p; }), entries = mine.filter(function (r) { return into[r.name]; });
      rows.files.push([fileName(b, p), mine.map(function (r) { return r.name; }).join(' '), entries.map(function (r) { return r.name; }).join(' ')]);
      return '<tr><td class="mono">' + SW.esc(fileName(b, p)) + '</td><td class="mono">' + (mine.map(function (r) { return go(b, p, r.n, r.name); }).join(' ') || '<span class="faint">none</span>') + '</td><td class="mono">' + (entries.map(function (r) { return go(b, p, r.n, r.name); }).join(' ') || '<span class="faint">none</span>') + '</td></tr>';
    }).join('') + '</tbody></table>');
    cards.appendChild(fc);
    var mc = wide(card('Calls between the files', 'Each row a file calling, each column a file called: the number of distinct calls from a routine of one to a routine of the other. Click a number for the calls.'));
    mc.insertAdjacentHTML('beforeend', '<table class="data fo-matrix"><thead><tr><th>calls ▸</th>' + files.map(function (p) { return '<th class="mono">' + SW.esc(fileName(b, p)) + '</th>'; }).join('') + '</tr></thead><tbody>' +
      files.map(function (a) {
        return '<tr><th class="mono">' + SW.esc(fileName(b, a)) + '</th>' + files.map(function (z) {
          var l = pairs[a + '>' + z] || [];
          if (l.length) rows.calls.push([fileName(b, a), fileName(b, z), String(l.length)]);
          return '<td class="num' + (a === z ? ' fo-self' : '') + '">' + (l.length ? '<button class="fo-cell" data-pair="' + a + '>' + z + '">' + l.length + '</button>' : '') + '</td>';
        }).join('') + '</tr>';
      }).join('') + '</tbody></table><div class="fo-pairs"></div>');
    mc.addEventListener('click', function (ev) {
      var cell = ev.target.closest('[data-pair]'); if (!cell) return;
      SW.$$('.fo-cell.on', mc).forEach(function (x) { x.classList.remove('on'); }); cell.classList.add('on');
      var ab = cell.dataset.pair.split('>'), list = pairs[cell.dataset.pair] || [], box = SW.$('.fo-pairs', mc);
      box.innerHTML = '<h4>' + SW.esc(fileName(b, +ab[0])) + ' calling ' + SW.esc(fileName(b, +ab[1])) + ' (' + list.length + ')</h4>';
      box.appendChild(SW.table(['Caller', 'Where', 'Calls', 'Where'], list.map(function (x) { return [x[0].name, at(b, x[0].p, x[0].n), x[1].name, at(b, x[1].p, x[1].n)]; }), { cls: ['mono', 'mono', 'mono', 'mono'] }));
    });
    cards.appendChild(mc);

    function doc() {
      return { title: b.v.label + ': functional overview', subtitle: 'Read from the source', meta: SW.docMeta(b), blocks: [
        SW.tableBlock('Where it starts: what ' + (B.entry || '') + ' calls, in order', ['Line', 'Routine', 'How', 'Defined at', 'Which calls'], rows.start),
        SW.tableBlock('Start-up', ['#', 'File', 'Routines', 'Run at load'], rows.load),
        SW.tableBlock('The files', ['File', 'Routines', 'Entry points'], rows.files),
        SW.tableBlock('Calls between the files (distinct calls)', ['Calling', 'Called', 'Calls'], rows.calls)] };
    }
    head.appendChild(SW.exportButtons(doc, B.slug + '-' + b.v.id + '-functional-overview'));
    return function () { return doc().blocks; };
  };

  // a name or line clicked: to it in Read
  function goClick(ev) {
    var a = ev.target.closest('[data-go]'); if (!a) return;
    ev.preventDefault(); var x = a.dataset.go.split(':'), p = +x[0], n = +x[1];
    SW.state.sel = { p: p, n0: n, n1: n }; SW.setTab('read'); SW.emit('goto', { p: p, n: n, tab: 'read' });
  }

  // a page with a Functional overview view of its own
  var view = SW.$('#view-functional');
  if (view) SW.views.functional = { show: function (b) { FO.render(b, view); } };
})(typeof window !== 'undefined' ? window : globalThis);
