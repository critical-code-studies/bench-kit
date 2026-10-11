/*
 * functional.js - a functional overview of a version, read from the source, not run: where the
 * program starts (the routine SW.BENCH.entry names) and what it calls, in order, and what each
 * of those calls in turn; what each file runs as it is loaded; the parts of the program (by
 * default each file is one) with their routines and those the other parts call; and the calls
 * between the parts.
 *
 * By default a routine begins where SW.BENCH.routine matches (the bench's core.js marks its
 * lines 'def' in b.kind and names it in b.sym), runs to the first code line indented no deeper
 * than its own first line, and calls another where that one's name is followed by "(" (not
 * after a "."); a file runs at load its code outside any routine. A bench reads its language
 * better with SW.BENCH.functional, every part of it optional:
 *   analyse(b)    -> { rs: [{ name, p, n, calls: [{ name, line, named }] }], load: [[{ n, text, count }] per file], show(r) }
 *                    (named: quoted or passed, for something else to call; not counted as a call;
 *                    show: which of rs are listed as routines, where the rest only call)
 *   partOf(b, p)  -> { id, label, short, colour } the part of the program a file belongs to
 *   defines(b, ps)-> text: what the files ps define (in place of the list of their routines)
 *   label(b, name)-> HTML for a routine's name (a reader's own name for it, a mark)
 *   note(b)       -> HTML under the start, for what the routines alone do not say
 *   word          -> what a routine is called ('function'); startTitle, startLede(b, e)
 * SW.functionalOverview.render(b, el, { inline, head }) draws it into el (a bench with lenses calls
 * it from one, inline); a page with a section #view-functional has it as the view 'functional'.
 * Part of bench-kit (github.com/critical-code-studies/bench-kit).
 */
(function (root) {
  'use strict';
  var SW = root.SW, B = SW.BENCH, FO = SW.functionalOverview = {};
  function H() { return B.functional || {}; }

  function fileName(b, p) { return b.parts[p].src.split('/').pop(); }
  function card(title, lede) { var c = SW.el('div', { class: 'card' }); c.innerHTML = '<h3>' + SW.esc(title) + '</h3>' + (lede ? '<p class="lede">' + lede + '</p>' : ''); return c; }
  function wide(c) { c.style.gridColumn = '1 / -1'; return c; }
  function go(p, n, html) { return '<a href="#" data-go="' + p + ':' + n + '">' + html + '</a>'; }
  function at(b, p, n) { return { html: go(p, n, SW.esc(fileName(b, p) + ':' + n)), sort: p * 100000 + n, text: fileName(b, p) + ':' + n }; }
  function esc(s) { return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
  function label(b, name) { return H().label ? H().label(b, name) : '<span class="mono">' + SW.esc(name) + '</span>'; }
  function chip(pt) { return pt.colour ? '<i class="fo-chip" style="background:' + pt.colour + '"></i>' : ''; }

  // ---------- reading the routines (any language) ----------
  // A routine runs to the line before the first code line indented no deeper than its own first
  // line (Python's dedent; the closing brace of a C or JavaScript function), or to the next
  // routine in the same file.
  function indent(raw) { return /^[ \t]*/.exec(raw)[0].replace(/\t/g, '        ').length; }
  function plain(b) {
    var rs = [];
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
    // what a file runs as it is loaded: its code outside any routine
    var load = b.parts.map(function (pt, p) {
      if (pt.role === 'doc') return [];
      var inR = {};
      rs.forEach(function (r) { if (r.p === p) for (var n = r.n; n <= r.end; n++) inR[n] = 1; });
      return b.lines[p].filter(function (L) { return !inR[L.n] && SW.parseLine(L.raw).code.trim(); }).map(function (L) { return { n: L.n, text: L.raw.trim() }; });
    });
    return { rs: rs, load: load };
  }
  function analyse(b) {
    var A = H().analyse ? H().analyse(b) : plain(b);
    A.byName = {}; A.rs.forEach(function (r) { if (!A.byName[r.name]) A.byName[r.name] = r; });
    A.load = A.load || b.parts.map(function () { return []; });
    A.shown = A.show ? A.rs.filter(A.show) : A.rs;
    return A;
  }
  // the parts of the program, in the order of their first files
  function partsOf(b) {
    var list = [], by = {}, of = {};
    b.parts.forEach(function (pt, p) {
      if (pt.role === 'doc') return;
      var x = H().partOf ? H().partOf(b, p) : { id: 'f' + p, label: fileName(b, p) };
      if (!by[x.id]) { by[x.id] = { id: x.id, label: x.label, short: x.short, colour: x.colour, files: [] }; list.push(by[x.id]); }
      by[x.id].files.push(p); of[p] = by[x.id];
    });
    return { list: list, of: of, grouped: !!H().partOf };
  }

  // ---------- drawing ----------
  // o.inline: el is a grid of cards already (a lens's), the cards go straight into it, with no
  // title or export of their own (the lens has them); o.head false: no title or export either
  FO.render = function (b, view, o) {
    o = o || {};
    var W = H().word || 'routine', Ws = W + 's';
    view.innerHTML = '';
    if (!view._fo) { view._fo = true; view.addEventListener('click', goClick); }
    var pad = SW.el('div', { class: 'pad', style: 'max-width:none' });
    var head = SW.el('div', { class: 'toolbar', style: 'position:static;padding:0 0 10px' });
    head.innerHTML = '<b>Functional overview</b> <span class="hint">Read from the source: where the program starts, what each file runs as it loads, the ' + Ws + ' of each part and the calls between them.</span> ' + SW.refTag(b.v.id);
    if (o.head !== false && !o.inline) pad.appendChild(head);
    var cards = o.inline ? view : SW.el('div', { class: 'cards' });
    if (!o.inline) { pad.appendChild(cards); view.appendChild(pad); }
    if (!b.v.build) { cards.innerHTML = '<p class="hint">The bench holds no text of ' + SW.esc(b.v.label) + '.</p>'; return null; }
    var A = analyse(b), P = partsOf(b), rows = { start: [], load: [], parts: [], calls: [] };
    function partName(p) { return P.of[p] ? P.of[p].label : fileName(b, p); }

    // where it starts
    var e = A.byName[B.entry];
    var sc = wide(card(H().startTitle || 'Where it starts', !e ? '' : H().startLede ? H().startLede(b, e) :
      'The ' + W + ' ' + SW.esc(B.entry) + ' in ' + SW.esc(fileName(b, e.p)) + ', where the program starts: the ' + Ws + ' it calls (→)' + (H().analyse ? ' or names for something else to call (‘)' : '') + ', in the order of its lines, ' + (P.grouped ? 'with the part each belongs to, ' : '') + 'and what each of those calls in turn. Click a name to read it.'));
    if (!e) sc.insertAdjacentHTML('beforeend', '<p class="hint">' + SW.esc(b.v.label) + ' has no ' + W + ' ' + SW.esc(B.entry || '(SW.BENCH.entry is not set)') + '.</p>');
    else {
      sc.insertAdjacentHTML('beforeend', '<ol class="fo-loop">' + e.calls.map(function (c) {
        var r = A.byName[c.name], pt = P.of[r.p];
        rows.start.push([String(c.line), c.name, c.named ? 'names' : 'calls', partName(r.p), fileName(b, r.p) + ':' + r.n, r.calls.map(function (x) { return (x.named ? '‘' : '') + x.name; }).join(' ')]);
        return '<li><span class="fo-ln">' + go(e.p, c.line, String(c.line)) + '</span><span class="fo-how" title="' + (c.named ? 'Named, for something else to call' : 'Called') + '">' + (c.named ? '‘' : '→') + '</span>' +
          go(r.p, r.n, label(b, c.name)).replace('<a ', '<a class="fo-fn" ') + ' ' + (pt ? chip(pt) : '') + '<span class="faint">' + SW.esc(P.grouped ? partName(r.p) : fileName(b, r.p)) + '</span>' +
          (r.calls.length ? '<div class="fo-next">' + r.calls.slice(0, 14).map(function (x) { var rx = A.byName[x.name]; return go(rx.p, rx.n, SW.esc((x.named ? '‘' : '') + x.name)); }).join(' ') + (r.calls.length > 14 ? ' <span class="faint">+' + (r.calls.length - 14) + ' more</span>' : '') + '</div>' : '') + '</li>';
      }).join('') + '</ol>' + (e.calls.length ? '' : '<p class="hint">It calls no other ' + W + '.</p>') + (H().note ? H().note(b) || '' : ''));
    }
    cards.appendChild(sc);

    // what each file runs as it is loaded
    var lc = wide(card('Start-up', 'The files of the version in order, with ' + (P.grouped ? 'the part each belongs to, ' : '') + 'how many ' + Ws + ' each defines, and what each runs as it is loaded. Click to read it.'));
    var lh = '<table class="data fo-start"><thead><tr><th>#</th><th>File</th>' + (P.grouped ? '<th>Part</th>' : '') + '<th>' + W.charAt(0).toUpperCase() + Ws.slice(1) + '</th><th>Run at load</th></tr></thead><tbody>' + b.parts.map(function (pt, p) {
      if (pt.role === 'doc') return '';
      var n = A.shown.filter(function (r) { return r.p === p; }).length, ld = A.load[p] || [], inline = ld.some(function (x) { return x.count; });
      rows.load.push([String(p + 1), fileName(b, p)].concat(P.grouped ? [partName(p)] : [], [String(n), ld.map(function (x) { return x.text + (x.count > 1 ? ' ×' + x.count : ''); }).join(inline ? ', ' : ' · ')]));
      return '<tr><td class="num">' + (p + 1) + '</td><td class="mono">' + SW.esc(fileName(b, p)) + (pt.role !== 'program' ? ' <span class="faint">(' + SW.esc(pt.role) + ')</span>' : '') + '</td>' +
        (P.grouped ? '<td>' + chip(P.of[p]) + SW.esc(partName(p)) + '</td>' : '') + '<td class="num">' + n + '</td><td class="mono fo-run">' +
        (ld.length ? ld.map(function (x) { return go(p, x.n, SW.esc(x.text.slice(0, 60))) + (x.count > 1 ? ' ×' + x.count : ''); }).join(inline ? ', ' : '<br>') : '<span class="faint">nothing</span>') + '</td></tr>';
    }).join('') + '</tbody></table>';
    lc.insertAdjacentHTML('beforeend', lh);
    cards.appendChild(lc);

    // the parts, their routines, and the calls between them (calls only, not names)
    var into = {}, pairs = {};
    A.rs.forEach(function (r) {
      var pa = P.of[r.p]; if (!pa) return;
      r.calls.forEach(function (c) {
        var t = A.byName[c.name], pz = t && P.of[t.p]; if (!pz || c.named) return;
        var k = pa.id + '>' + pz.id; (pairs[k] = pairs[k] || []).push([r, t]);
        if (pz !== pa) (into[t.name] = into[t.name] || {})[r.name] = 1;
      });
    });
    var what = P.grouped ? 'the parts' : 'the files', What = P.grouped ? 'The parts of the program' : 'The files';
    var fc = wide(card(What, (P.grouped ? 'The files grouped into the parts of the program, with what each part defines and its entry points: its ' : 'Each file’s ' + Ws + ', and its entry points: its ') + Ws + ' called from ' + (P.grouped ? 'other parts' : 'other files') + (P.grouped ? ', by how many outside ' + Ws + ' call them.' : '.')));
    fc.insertAdjacentHTML('beforeend', '<table class="data"><thead><tr><th>' + (P.grouped ? 'Part</th><th>Files' : 'File') + '</th><th>' + (H().defines ? 'Defines' : W.charAt(0).toUpperCase() + Ws.slice(1)) + '</th><th>Entry points</th></tr></thead><tbody>' + P.list.map(function (pt) {
      var mine = A.shown.filter(function (r) { return P.of[r.p] === pt; }), entries = mine.filter(function (r) { return into[r.name]; }).sort(function (a, z) { return Object.keys(into[z.name]).length - Object.keys(into[a.name]).length; });
      var defs = H().defines ? H().defines(b, pt.files) : null, names = pt.files.map(function (p) { return fileName(b, p); }).join(' ');
      rows.parts.push((P.grouped ? [pt.label, names] : [names]).concat([defs != null ? defs : mine.map(function (r) { return r.name; }).join(' '), entries.slice(0, 8).map(function (r) { return r.name + (P.grouped ? ' (' + Object.keys(into[r.name]).length + ')' : ''); }).join(', ')]));
      return '<tr>' + (P.grouped ? '<td>' + chip(pt) + SW.esc(pt.label) + '</td>' : '') + '<td class="mono">' + SW.esc(names) + '</td><td' + (defs != null ? '' : ' class="mono"') + '>' + (defs != null ? SW.esc(defs) : mine.map(function (r) { return go(r.p, r.n, SW.esc(r.name)); }).join(' ') || '<span class="faint">none</span>') + '</td><td class="mono">' +
        (entries.slice(0, 8).map(function (r) { return go(r.p, r.n, label(b, r.name)); }).join(', ') || '<span class="faint">none</span>') + (entries.length > 8 ? ' <span class="faint">+' + (entries.length - 8) + '</span>' : '') + '</td></tr>';
    }).join('') + '</tbody></table>');
    cards.appendChild(fc);
    var mc = wide(card('Calls between ' + what, 'Each row ' + (P.grouped ? 'a part' : 'a file') + ' calling, each column ' + (P.grouped ? 'a part' : 'a file') + ' called: the number of distinct calls from a ' + W + ' of one to a ' + W + ' of the other (a call made many times counts once). Click a number for the calls.'));
    mc.insertAdjacentHTML('beforeend', '<table class="data fo-matrix"><thead><tr><th>calls ▸</th>' + P.list.map(function (pt) { return '<th class="' + (P.grouped ? '' : 'mono') + '" title="' + SW.esc(pt.label) + '">' + chip(pt) + SW.esc(pt.short || pt.label) + '</th>'; }).join('') + '</tr></thead><tbody>' +
      P.list.map(function (a) {
        return '<tr><th class="' + (P.grouped ? '' : 'mono') + '" title="' + SW.esc(a.label) + '">' + chip(a) + SW.esc(a.short || a.label) + '</th>' + P.list.map(function (z) {
          var l = pairs[a.id + '>' + z.id] || [];
          if (l.length) rows.calls.push([a.label, z.label, String(l.length)]);
          return '<td class="num' + (a === z ? ' fo-self' : '') + '">' + (l.length ? '<button class="fo-cell" data-pair="' + SW.esc(a.id + '>' + z.id) + '">' + l.length + '</button>' : '') + '</td>';
        }).join('') + '</tr>';
      }).join('') + '</tbody></table><div class="fo-pairs"></div>');
    mc.addEventListener('click', function (ev) {
      var cell = ev.target.closest('[data-pair]'); if (!cell) return;
      SW.$$('.fo-cell.on', mc).forEach(function (x) { x.classList.remove('on'); }); cell.classList.add('on');
      var ab = cell.dataset.pair.split('>'), pa = P.list.filter(function (x) { return x.id === ab[0]; })[0], pz = P.list.filter(function (x) { return x.id === ab[1]; })[0];
      var list = (pairs[cell.dataset.pair] || []).slice().sort(function (x, y) { return x[0].name < y[0].name ? -1 : x[0].name > y[0].name ? 1 : x[1].name < y[1].name ? -1 : 1; }), box = SW.$('.fo-pairs', mc);
      box.innerHTML = '<h4>' + SW.esc(pa.label) + ' calling ' + SW.esc(pz.label) + ' (' + list.length + ')</h4>';
      box.appendChild(SW.table(['Caller', 'Where', 'Calls', 'Where'], list.map(function (x) { return [x[0].name, at(b, x[0].p, x[0].n), x[1].name, at(b, x[1].p, x[1].n)]; }), { cls: ['mono', 'mono', 'mono', 'mono'] }));
    });
    cards.appendChild(mc);

    function doc() {
      return { title: b.v.label + ': functional overview', subtitle: 'Read from the source', meta: SW.docMeta(b), blocks: [
        SW.tableBlock((H().startTitle || 'Where it starts') + ': what ' + (B.entry || '') + ' calls (→) and names (‘), in order', ['Line', W.charAt(0).toUpperCase() + W.slice(1), 'How', 'Part', 'Defined at', 'Which calls'], rows.start),
        SW.tableBlock('Start-up', ['#', 'File'].concat(P.grouped ? ['Part'] : [], [W.charAt(0).toUpperCase() + Ws.slice(1), 'Run at load']), rows.load),
        SW.tableBlock(What, (P.grouped ? ['Part', 'Files'] : ['File']).concat([H().defines ? 'Defines' : W.charAt(0).toUpperCase() + Ws.slice(1), 'Entry points']), rows.parts),
        SW.tableBlock('Calls between ' + what + ' (distinct calls)', ['Calling', 'Called', 'Calls'], rows.calls)] };
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
