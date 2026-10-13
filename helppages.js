/*
 * helppages.js - four Help pages drawn from the bench's data:
 *   Referencing and versions (SW.refHelp): the bench's form of reference, its versions and its
 *     ports, to copy as a list or export with their SWHIDs. From SW.BENCH.refHelp:
 *       example   a reference in full, as the page's example
 *       about     HTML after the example: what each part of a reference is
 *       letters   [[letter, the witness]]: the witness letters, as a table
 *       more      HTML after the letters: shorter forms, ports, SWHIDs
 *       form      the form in one line of plain text, for the list and the export
 *       versions  { title, hint (HTML), all (lost versions too) }
 *       ports     { title, head: five column names for SW.PORTS [ref, name, in, where, date],
 *                   fold (folded away), hint (HTML) }
 *     The versions come from SWVersions, what each text is from SW.MADE, the ports from SW.PORTS
 *     ([ref, name, in, where, date, files, [catalogue label, href]]); links to GitHub and SWHIDs
 *     from kit/refs.js, where the bench has them.
 *   What you should read (SW.readingHelp): from SW.BENCH.reading { intro (HTML), groups:
 *     [[heading, [entry (HTML)]]], menu (the Help menu's line) }.
 *   Reconstruction cards (SW.cardsHelp(), SW.cardsOne(vid); SW.cardHTML(v) for a card in a page):
 *     what the bench does to each version to read and run it, after Berry (2025). From
 *     SW.BENCH.cards:
 *       about     the principle, in plain text (the dialog and the export)
 *       kinds     { key: [class, label, note] }: the kinds of repair, as chips; legend: the keys shown
 *       head      [[key, label]]: the columns (id, kind, where, what, why, evidence, by)
 *       rows(v)   the repairs to version v, or a promise of them: { id, kind, kindNote, where,
 *                 title, what, why, evidence, by }
 *       note(v)   plain text before the table; after(v): { title, head, rows }, a table after it
 *       empty     what the card says when there are no repairs; subtitle, menu
 *   Marks and conventions (SW.marksHelp): the marks the benches draw for losses, restorations,
 *     corrections and doubtful readings, each with its Leiden form for export (SW.leiden(id, text,
 *     o)), beside the kintsugi of the repairs; SW.BENCH.marks { uses, add, note } adapts it.
 * The kit's Help menu and links (&help=refs, reading, cards, marks) open them.
 * Part of bench-kit (github.com/critical-code-studies/bench-kit).
 */
(function (root) {
  'use strict';
  var SW = root.SW, B = SW.BENCH, esc = SW.esc;

  function slug() { return String(B.name || 'bench').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }
  function benchLine() { return (B.title || 'Research Bench') + ' ' + SW.VERSION; }
  function V() { return root.SWVersions; }
  function made(v) { return (SW.MADE || {})[v.id] || ''; }

  // a box over the bench: a title, actions beside it, and the page
  function bigDialog(title, html, cls, acts) {
    var d = SW.el('dialog', { class: 'tray-big refhelp ' + (cls || '') });
    d.innerHTML = '<div class="tray-bighead"><b>' + esc(title) + '</b><span class="refhelp-acts">' + (acts || '') + '<button class="icon-btn" data-x title="Close (Esc)">✕</button></span></div>' + html;
    document.body.appendChild(d);
    d.addEventListener('click', function (e) { if (e.target === d || e.target.closest('[data-x]')) d.close(); });
    d.addEventListener('close', function () { d.remove(); });
    d.showModal();
    return d;
  }
  // an Export ▾ menu of buttons [[key, label]] (data-attr="key")
  function menu(attr, title, items) {
    return '<details class="menu more-menu"><summary class="btn ghost" title="' + esc(title) + '">⤓ Export ▾</summary><div class="menu-body">' +
      items.map(function (i) { return '<button class="btn ghost" data-' + attr + '="' + i[0] + '">' + esc(i[1]) + '</button>'; }).join('') + '</div></details>';
  }

  // ---------- Referencing and versions ----------
  function R() { return B.refHelp || {}; }
  function versions() {
    var all = (R().versions || {}).all;
    return V().VERSIONS.filter(function (v) { return all || v.build; }).sort(function (a, b) { return a.sort - b.sort; });
  }
  function ports() { return SW.PORTS || []; }
  function filesOfPort(r) { return r[5] ? String(r[5]).split(/,\s*/).filter(Boolean) : []; }
  function hasSWHIDs(lists) { return !!SW.swhidOf && lists.some(function (fs) { return fs.some(function (f) { return SW.swhidOf(f); }); }); }
  function links(files, label, title) {
    return files.map(function (f, k) {
      return '<a href="' + esc(SW.permalinkOf(f)) + '" target="_blank" rel="noopener" title="' + esc(f.split('/').pop()) + ' on GitHub, at its last change"' + (k ? ' class="ref-more"' : '') + '>' + (k ? 'part ' + (k + 1) : esc(label)) + ' ↗</a>';
    }).join(' ');
  }
  function lettersLine() { return (R().letters || []).length ? 'Witness letters: ' + R().letters.map(function (l) { return l[0] + ' ' + l[1]; }).join('; ') + '.' : ''; }

  SW.refHelp = function () {
    var r = R(), vs = versions(), own = vs.map(function (v) { return SW.ownFilesOf ? SW.ownFilesOf(v) : []; });
    var showAuthor = vs.some(function (v) { return v.authors; }), showIds = hasSWHIDs(own), linked = !!(SW.permalinkOf && (SW.REPO || (B.refs || {}).repo));
    var ps = ports(), pFiles = ps.map(filesOfPort), pIds = hasSWHIDs(pFiles), pHeld = pFiles.some(function (f) { return f.length; });
    var ph = (r.ports || {}).head || ['Reference', 'Program', 'Machine', 'Where and by whom', 'Date'];
    var vt = '<table class="ov-sub refhelp-t"><thead><tr><th>No.</th><th>Reference</th><th>Version</th>' + (showAuthor ? '<th>Author</th>' : '') + '<th>Version dated</th><th>This text</th>' + (showIds ? '<th>SWHID</th>' : '') + '</tr></thead><tbody>' +
      vs.map(function (v, n) {
        var fs = own[n];
        return '<tr><td class="num">' + (n + 1) + '</td><td class="mono"><span class="swref-c" data-copy="' + esc(SW.refText(v.id)) + '" title="Click to copy">' + esc(SW.refOf(v.id)) + '</span></td><td>' +
          (linked && fs.length ? links(fs, v.label) : esc(v.label)) + (v.status === 'lost' ? ' <span class="faint">(lost)</span>' : '') + '</td>' +
          (showAuthor ? '<td>' + esc(v.authors || '') + '</td>' : '') + '<td>' + esc(v.date || '') + '</td><td>' + esc(made(v) || v.medium || (v.build ? '' : 'none held')) + '</td>' +
          (showIds ? '<td>' + SW.swhidTiny(fs) + '</td>' : '') + '</tr>';
      }).join('') + '</tbody></table>';
    var pt = ps.length ? '<table class="ov-sub refhelp-t"><thead><tr><th>No.</th><th>' + ph.map(esc).join('</th><th>') + '</th>' + (pIds ? '<th>SWHID</th>' : '') + '</tr></thead><tbody>' +
      ps.map(function (p, n) {
        var fs = pFiles[n];
        return '<tr><td class="num">' + (n + 1) + '</td><td class="mono"><span class="swref-c" data-copy="[REF: ' + esc(p[0]) + ']" title="Click to copy">' + esc(p[0]) + '</span></td><td>' +
          (linked && fs.length ? links(fs, p[1]) : esc(p[1]) + (p[6] ? ' <a class="ref-more" href="../' + esc(p[6][1]) + '" target="_blank" rel="noopener" title="No source held; the catalogue entry">' + esc(p[6][0]) + ' ↗</a>' : pHeld ? ' <span class="faint ref-more">none held</span>' : '')) +
          '</td><td>' + esc(p[2] || '') + '</td><td>' + esc(p[3] || '') + '</td><td>' + esc(p[4] || '') + '</td>' + (pIds ? '<td>' + (fs.length ? SW.swhidTiny(fs) : '') + '</td>' : '') + '</tr>';
      }).join('') + '</tbody></table>' : '';
    var po = r.ports || {}, ptitle = po.title || 'Ports';
    var html = '<p>The bench names each source text in one form, shown beside it across the bench, in citations and in exports:</p>' +
      (r.example ? '<p class="refhelp-ex mono">' + esc(r.example) + '</p>' : '') + (r.about || '') +
      ((r.letters || []).length ? '<table class="ov-sub"><thead><tr><th>Letter</th><th>The witness</th></tr></thead><tbody>' + r.letters.map(function (l) { return '<tr><td class="mono">' + esc(l[0]) + '</td><td>' + esc(l[1]) + '</td></tr>'; }).join('') + '</tbody></table>' : '') +
      (r.more || '') +
      '<h4>' + esc((r.versions || {}).title || 'The versions') + '</h4>' + ((r.versions || {}).hint ? '<p class="hint">' + r.versions.hint + '</p>' : '') + vt +
      (pt ? (po.fold ? '<details class="refhelp-ports"><summary><h4>' + esc(ptitle) + ' <span class="faint">' + ps.length + '</span></h4></summary>' + pt + (po.hint ? '<p class="hint">' + po.hint + '</p>' : '') + '</details>'
                     : '<h4>' + esc(ptitle) + '</h4>' + pt + (po.hint ? '<p class="hint">' + po.hint + '</p>' : '')) : '');
    var d = bigDialog('Referencing and versions', html, '',
      '<button class="btn ghost" data-rx="copy" title="Every reference, as plain text to paste into an email">⧉ Copy the list</button>' +
      menu('rx', 'The form and every reference, with SWHIDs, as a file to share', [['docx', '⤓ Word'], ['md', '⤓ Markdown']]));
    d.addEventListener('click', function (e) {
      var rx = e.target.closest('[data-rx]'); if (!rx) return;
      var dm = rx.closest('details'); if (dm) dm.open = false;
      if (rx.dataset.rx === 'copy') SW.copyText(SW.refList.text(), 'the list of references');
      else SW.exportDoc(SW.refList.doc(), slug() + '-source-references', rx.dataset.rx);
    });
  };

  // every version's and port's reference, for sharing: plain text to paste, or a document with the SWHIDs
  SW.refList = {
    versions: versions,
    head: function () { return (B.name || '') + ' source references (' + benchLine() + ', ' + SW.fmtDate(SW.today()) + ')'; },
    text: function () {
      var r = R(), L = [SW.refList.head(), ''];
      if (r.form) L.push(r.form); if (lettersLine()) L.push(lettersLine()); L.push('', (r.versions || {}).title || 'The versions');
      versions().forEach(function (v, n) { L.push((n + 1) + '. ' + SW.refOf(v.id) + '  ' + v.label + ' (' + (v.date || '') + ')' + (v.status === 'lost' ? ', lost' : '') + (made(v) ? '; this text: ' + made(v) : '')); });
      if (ports().length) { L.push('', (r.ports || {}).title || 'Ports'); ports().forEach(function (p, n) { L.push((n + 1) + '. ' + p[0] + '  ' + p[1] + ', ' + p[2] + '; ' + p[3] + ', ' + p[4]); }); }
      L.push('', 'The full table: ' + (SW.BASE_URI || location.href.split('?')[0]) + ' (Help ▸ Referencing and versions)');
      return L.join('\n');
    },
    doc: function () {
      var r = R();
      function ids(files) { return (files || []).map(function (f) { var h = SW.swhidOf && SW.swhidOf(f); return f + (h ? ': ' + h : ''); }).join('; '); }
      var blocks = [];
      if (r.form) blocks.push({ type: 'p', text: r.form });
      if ((r.letters || []).length) blocks.push({ type: 'table', caption: 'Witness letters', head: ['Letter', 'The witness'], rows: r.letters.map(function (l) { return [l[0], l[1]]; }) });
      blocks.push({ type: 'h2', text: (r.versions || {}).title || 'The versions' });
      blocks.push({ type: 'table', head: ['No.', 'Reference', 'Version', 'Version dated', 'This text', 'SWHID of each file'],
        rows: versions().map(function (v, n) { return [String(n + 1), SW.refOf(v.id), v.label + (v.status === 'lost' ? ' (lost)' : ''), v.date || '', made(v) || v.medium || '', SW.filesOf ? ids(SW.filesOf(v)) : '']; }) });
      if (ports().length) {
        blocks.push({ type: 'h2', text: (r.ports || {}).title || 'Ports' });
        blocks.push({ type: 'table', head: ['No.'].concat((r.ports || {}).head || ['Reference', 'Program', 'Machine', 'Where and by whom', 'Date']).concat(['SWHID of each file']),
          rows: ports().map(function (p, n) { var fs = filesOfPort(p); return [String(n + 1), p[0], p[1], p[2] || '', p[3] || '', p[4] || '', fs.length ? ids(fs) : p[6] ? 'no source; catalogue entry only: ' + p[6][0] : 'none held']; }) });
      }
      return { title: (B.name || '') + ' source references', subtitle: 'The referencing convention of the ' + (B.title || 'research bench'),
        meta: [['Generated', SW.fmtDate(SW.today()) + ', ' + benchLine()], ['Bench', SW.BASE_URI]], blocks: blocks };
    }
  };

  // ---------- What you should read ----------
  SW.readingHelp = function () {
    var r = B.reading || {};
    bigDialog('What you should read', (r.intro ? '<p>' + r.intro + '</p>' : '') +
      (r.groups || []).map(function (g) { return '<h4>' + esc(g[0]) + '</h4><ul class="reading">' + g[1].map(function (e) { return '<li>' + e + '</li>'; }).join('') + '</ul>'; }).join(''), 'readhelp');
  };

  // ---------- Reconstruction cards ----------
  function C() { return B.cards || {}; }
  function built() { return V().VERSIONS.filter(function (w) { return w.build; }).sort(function (a, b) { return a.sort - b.sort; }); }
  function verOf(x) { return typeof x === 'string' ? V().byId(x) : x && x.v ? x.v : x; }
  function rowsOf(v) { return Promise.resolve(C().rows ? C().rows(v) : []); }
  function head() { return C().head || [['where', 'Where'], ['kind', 'Kind'], ['what', 'What'], ['evidence', 'Evidence'], ['by', 'By']]; }
  function kinds() { var k = C().kinds; return (typeof k === 'function' ? k() : k) || {}; }
  function kindOf(k) { return kinds()[k] || ['', k || '', '']; }
  function chip(k) { var c = kindOf(k); return '<span class="rp-chip ' + esc(c[0]) + '" title="' + esc(c[2]) + '">' + esc(c[1]) + '</span>'; }
  function whatText(r) { return (r.title ? r.title + '. ' : '') + (r.what || ''); }
  function cell(r, key) {
    if (key === 'kind') return [kindOf(r.kind)[1] || '', r.kindNote || ''];
    if (key === 'what') return whatText(r);
    return r[key] == null ? '' : String(r[key]);
  }
  function plainCell(r, key) { var c = cell(r, key); return Array.isArray(c) ? c[0] : c; }
  function after(v) { return C().after ? C().after(v) : null; }

  function cardHTML(v, rows, o) {
    var h = head(), a = after(v), note = C().note ? C().note(v) : '';
    if (o && o.about && C().about) note = C().about + (note ? ' ' + note : '');
    return '<div class="kin-card" data-card="' + esc(v.id) + '"><h3>Reconstruction card: ' + esc(v.label) + ' <span class="swref-sm mono">' + esc(SW.refText(v.id)) + '</span></h3>' +
      (note ? '<p class="hint">' + esc(note) + '</p>' : '') +
      (rows.length ? '<table class="ov-sub kin-t"><thead><tr>' + h.map(function (c) { return '<th>' + esc(c[1]) + '</th>'; }).join('') + '</tr></thead><tbody>' +
        rows.map(function (r) {
          return '<tr>' + h.map(function (c) {
            var k = c[0];
            if (k === 'kind') return '<td>' + chip(r.kind) + (r.kindNote ? '<div class="faint">' + esc(r.kindNote) + '</div>' : '') + '</td>';
            if (k === 'what') return '<td' + (r.mono ? ' class="mono"' : '') + '>' + (r.title ? '<b>' + esc(r.title) + '.</b> ' : '') + esc(r.what || '') + '</td>';
            return '<td' + (k === 'id' || k === 'where' ? ' class="mono"' : k === 'evidence' || k === 'by' ? ' class="faint"' : '') + '>' + esc(cell(r, k)) + '</td>';
          }).join('') + '</tr>';
        }).join('') + '</tbody></table>' : '<p>' + esc(C().empty || 'No repairs.') + '</p>') +
      (a ? '<h4>' + esc(a.title) + '</h4><table class="ov-sub"><tbody>' + a.rows.map(function (m) { return '<tr><td>' + esc(m[0]) + '</td><td>' + esc(m[1]) + '</td></tr>'; }).join('') + '</tbody></table>' : '') + '</div>';
  }
  // a card in a page (This version; { about: true } puts the principle in it too): drawn at once,
  // or as soon as its repairs are known
  SW.cardHTML = function (x, o) {
    var v = verOf(x); if (!v || !v.build) return '';
    var rs = C().rows ? C().rows(v) : [];
    if (Array.isArray(rs)) return cardHTML(v, rs, o);
    Promise.resolve(rs).then(function (rows) { var el = document.querySelector('.kin-card[data-card="' + v.id + '"]'); if (el) el.outerHTML = cardHTML(v, rows, o); }, function () {});
    return '<div class="kin-card" data-card="' + esc(v.id) + '"><h3>Reconstruction card: ' + esc(v.label) + '</h3><p class="faint">…</p></div>';
  };

  function cardText(v, rows) {
    var a = after(v), note = C().note ? C().note(v) : '';
    return 'Reconstruction card: ' + v.label + ' ' + SW.refText(v.id) + ' (' + benchLine() + ')\n' + (note ? note + '\n' : '') +
      (rows.length ? rows.map(function (r) {
        return [r.id, r.where].filter(Boolean).join('  ') + '  ' + kindOf(r.kind)[1] + ': ' + whatText(r) + (r.why ? ' Why: ' + r.why : '') + (r.evidence ? ' Evidence: ' + r.evidence + '.' : '') + (r.by ? ' By ' + r.by + '.' : '');
      }).join('\n') : (C().empty || 'No repairs.')) +
      (a ? '\n' + a.title + ': ' + a.rows.map(function (m) { return m[0] + ': ' + m[1]; }).join(' ') : '');
  }
  function cardBlocks(v, rows) {
    var h = head(), a = after(v), note = C().note ? C().note(v) : '';
    return [{ type: 'h2', text: 'Reconstruction card: ' + v.label + ' ' + SW.refText(v.id) }]
      .concat(note ? [{ type: 'p', text: note }] : [])
      .concat(rows.length ? [{ type: 'table', head: h.map(function (c) { return c[1]; }), rows: rows.map(function (r) { return h.map(function (c) { return plainCell(r, c[0]); }); }) }] : [{ type: 'p', text: C().empty || 'No repairs.' }])
      .concat(a ? [{ type: 'h3', text: a.title }, { type: 'table', head: a.head, rows: a.rows.map(function (m) { return [m[0], m[1]]; }) }] : []);
  }
  function cardDoc(pairs) {
    return { title: pairs.length === 1 ? 'Reconstruction card: ' + pairs[0][0].label : (B.name || '') + ' reconstruction cards',
      subtitle: C().subtitle || 'What the bench does to each version to read and run it',
      meta: [['Generated', SW.fmtDate(SW.today()) + ', ' + benchLine()], ['Bench', SW.BASE_URI]],
      blocks: (C().about ? [{ type: 'p', text: C().about }] : []).concat([].concat.apply([], pairs.map(function (p) { return cardBlocks(p[0], p[1]); }))) };
  }
  // the card as an SVG table, for PNG and SVG and for My notes as a figure
  var WIDTH = { id: 70, kind: 110, where: 190, what: 330, why: 390, evidence: 250, by: 120 };
  function cardSVG(v, rows) {
    var h = head(), cols = h.map(function (c) { return WIDTH[c[0]] || 200; }), pad = 24, fs = 13, lh = 17, cw = fs * 0.56;
    var W = pad * 2 + cols.reduce(function (t, c) { return t + c; }, 0);
    function wrap(s, w) {
      var n = Math.max(4, Math.floor((w - 10) / cw)), out = [], line = '';
      String(s).split(/\s+/).forEach(function (wd) { if ((line + ' ' + wd).trim().length > n) { if (line) out.push(line); line = wd; while (line.length > n) { out.push(line.slice(0, n)); line = line.slice(n); } } else line = (line + ' ' + wd).trim(); });
      if (line) out.push(line); return out;
    }
    var o = [], y = pad + 26;
    o.push('<text x="' + pad + '" y="' + y + '" font-size="22" font-weight="600" fill="#9a7400">Reconstruction card: ' + esc(v.label) + '</text>');
    y += 22; o.push('<text x="' + pad + '" y="' + y + '" font-size="12" fill="#666" font-family="IBM Plex Mono, monospace">' + esc(SW.refText(v.id)) + '  ·  ' + esc(benchLine()) + ', ' + esc(SW.fmtDate(SW.today())) + '</text>');
    y += 26;
    var xs = [pad]; cols.forEach(function (c, i) { xs.push(xs[i] + c); });
    h.forEach(function (c, i) { o.push('<text x="' + (xs[i] + 4) + '" y="' + y + '" font-size="' + fs + '" font-weight="600" fill="#222">' + esc(c[1]) + '</text>'); });
    y += 8; o.push('<line x1="' + pad + '" x2="' + (W - pad) + '" y1="' + y + '" y2="' + y + '" stroke="#9a7400"/>');
    rows.forEach(function (r) {
      var cells = h.map(function (c, i) { return wrap(plainCell(r, c[0]), cols[i]); }), ht = Math.max.apply(null, cells.map(function (c) { return c.length; })) * lh + 8;
      cells.forEach(function (c, i) {
        var k = h[i][0];
        c.forEach(function (ln, j) { o.push('<text x="' + (xs[i] + 4) + '" y="' + (y + 16 + j * lh) + '" font-size="' + fs + '" fill="' + (k === 'kind' ? '#9a7400' : k === 'evidence' || k === 'by' ? '#666' : '#222') + '"' + (k === 'id' || k === 'where' ? ' font-family="IBM Plex Mono, monospace"' : '') + '>' + esc(ln) + '</text>'); });
      });
      y += ht; o.push('<line x1="' + pad + '" x2="' + (W - pad) + '" y1="' + y + '" y2="' + y + '" stroke="#ddd"/>');
    });
    y += pad;
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + W + ' ' + y + '" width="' + W + '" height="' + y + '" font-family="IBM Plex Sans, Helvetica, Arial, sans-serif"><rect width="' + W + '" height="' + y + '" fill="#fffdf6"/><rect x="0" y="0" width="5" height="' + y + '" fill="#d4af37"/>' + o.join('') + '</svg>';
  }
  // copy, export or keep a card: k is copy | docx | md | png | svg | keep | keep-fig | docx-all | md-all
  function act(k, vid) {
    var v = V().byId(vid), base = slug() + '-reconstruction-card-' + SW.refOf(v.id);
    if (/-all$/.test(k)) {
      SW.toast('Gathering every card…');
      Promise.all(built().map(function (w) { return rowsOf(w).then(function (rs) { return [w, rs]; }, function () { return [w, []]; }); }))
        .then(function (pairs) { SW.exportDoc(cardDoc(pairs), slug() + '-reconstruction-cards', k.replace('-all', '')); });
      return;
    }
    rowsOf(v).then(function (rows) {
      if (k === 'copy') SW.copyText(cardText(v, rows), 'the reconstruction card');
      else if (k === 'keep') { if (SW.tray) SW.tray.addDoc(cardDoc([[v, rows]]), { vid: v.id, tags: ['repair', 'reconstruction card'] }); }
      else if (k === 'keep-fig') { if (SW.tray) SW.tray.addFigure(cardSVG(v, rows), 'Reconstruction card: ' + v.label); }
      else if (k === 'svg') root.SWExport.download(base + '.svg', cardSVG(v, rows), 'image/svg+xml');
      else if (k === 'png') { SW.toast('Rendering PNG…'); SW.figures.svgToPNG(cardSVG(v, rows), 2, '#fffdf6').then(function (r) { root.SWExport.download(base + '.png', r.png, 'image/png'); }, function () { SW.toast('The PNG could not be made; try SVG.', 6000); }); }
      else SW.exportDoc(cardDoc([[v, rows]]), base, k);
    });
  }
  function cardBar() {
    return '<span class="card-acts"><button class="btn ghost" data-cx="copy" title="This card as plain text, with its references">⧉ Copy</button>' +
      menu('cx', 'This card, or every card, as a file', [['docx', '⤓ This card, Word'], ['md', '⤓ This card, Markdown'], ['png', '⤓ This card, PNG'], ['svg', '⤓ This card, SVG'], ['docx-all', '⤓ All cards, Word'], ['md-all', '⤓ All cards, Markdown']]) +
      '<details class="menu more-menu"><summary class="btn ghost" title="Put this card in My notes (private), to gather with others for a chapter">＋ My notes ▾</summary><div class="menu-body">' +
      '<button class="btn ghost" data-cx="keep">＋ As text and a table</button><button class="btn ghost" data-cx="keep-fig">＋ As a figure</button></div></details></span>';
  }
  // one card at a time, chosen from the versions the bench builds
  function cardDialog(x) {
    var vs = built(), v0 = verOf(x), cur = v0 && v0.build ? v0.id : vs[0].id, c = C();
    var legend = (c.legend || Object.keys(kinds())).map(function (k) { var n = kindOf(k)[2]; return '<div>' + chip(k) + ' ' + esc(n.charAt(0).toLowerCase() + n.slice(1)) + '</div>'; }).join('');
    var d = bigDialog('Reconstruction cards', (c.about ? '<p>' + esc(c.about) + '</p>' : '') + (legend ? '<div class="keylist kin-key">' + legend + '</div>' : '') +
      '<div class="kin-pick"><button class="btn ghost" data-cx="prev" title="The previous version">‹</button><select aria-label="Version">' +
      vs.map(function (w) { return '<option value="' + esc(w.id) + '"' + (w.id === cur ? ' selected' : '') + '>' + esc(SW.refOf(w.id) + '  ' + w.label) + '</option>'; }).join('') +
      '</select><button class="btn ghost" data-cx="next" title="The next version">›</button></div><div class="kin-one"></div>', 'cardshelp', cardBar());
    var sel = d.querySelector('select'), box = d.querySelector('.kin-one');
    function show(id) { cur = id; sel.value = id; box.innerHTML = SW.cardHTML(id); }
    sel.addEventListener('change', function () { show(sel.value); });
    d.addEventListener('click', function (e) {
      var b = e.target.closest('[data-cx]'); if (!b) return;
      var k = b.dataset.cx, m = b.closest('details'); if (m) m.open = false;
      var i = vs.findIndex(function (w) { return w.id === cur; });
      if (k === 'prev' || k === 'next') { show(vs[(i + (k === 'next' ? 1 : -1) + vs.length) % vs.length].id); return; }
      act(k, cur);
    });
    show(cur);
  }
  SW.cardsOne = function (vid) { cardDialog(vid); };
  SW.cardsHelp = function () { cardDialog(SW.state && SW.state.v); };

  // ---------- Marks and conventions ----------
  // One list of the marks the benches draw on a text, each with its Leiden form, so that what is
  // seen and what is exported say the same thing, and a reader of an export needs no key of the
  // bench's: the Leiden conventions of epigraphy and papyrology for losses, restorations and
  // readings, beside the kintsugi of the repairs (Berry 2025), which leaves a repair visible.
  //   id: [mark on screen (HTML), Leiden form, what it means, kintsugi's name, where the benches use it]
  // A bench adds or rewords through SW.BENCH.marks: { uses: { id: text }, add: [[id, ...]], note }.
  var MARKS = [
    ['lost', '<span class="mk-lost">— 1 page lost: the camera failed —</span>', '[---]  ·  [--- c. 46 lines ---]  ·  [.3.]',
      'Lost and not restored: the band stands in the place of what is missing, with how much and why.', 'the open seam',
      'A page a scan failed on, a tape torn, a reel that drops out (a paratext’s gaps).'],
    ['restored', '<span class="mk-fill">PRINT COMMENT</span>', '[PRINT COMMENT]',
      'Restored by an editor where nothing can be read: a conjecture, never merged into the text.', 'kake, a missing piece remade',
      'A line remade where none can be read; a gap filled by conjecture.'],
    ['supplied', '<span class="mk-supplied">PRINT COMMENT</span>', '[PRINT COMMENT], the witness named in a note',
      'Supplied from another copy of the same text, named.', 'yobitsugi, a piece from another vessel',
      'A tape supplied from another listing; a gap filled from another copy.'],
    ['corrected', '<span class="mk-corr">jmp <b>srt</b></span>', 'the text as the source reads, the old reading in a note',
      'A transcription corrected against the scan: the text is the source’s again.', 'hibi, a crack mended',
      'Readings corrected against the scan.'],
    ['uncertain', '<span class="mk-unc">ior (4</span>', 'ịọṛ (4  (a dot under each doubtful letter)',
      'Read, but not surely: left as found.', 'a crack seen, not mended',
      'Uncertain readings in a transcription ([word?]).'],
    ['illegible', '<span class="mk-ill">[?]</span>', '. . .  (a dot for each letter seen but not read)',
      'Traces of letters that cannot be read.', '',
      '[?] in a transcription.'],
    ['erased', '<span class="mk-erased">the Police</span>', '⟦the Police⟧',
      'Struck out or erased in the source itself.', '',
      'Strike-overs in typed copies; words struck out in pencil on a printout.'],
    ['added', '<span class="mk-added">n</span>', '\\n/',
      'Written in above the line, or in the margin, in the source itself.', '',
      'A handwritten insertion: Me corrected to Men by a caret and an n.'],
    ['omitted', '<span class="mk-omit">u</span>', '⟨u⟩',
      'Left out by the source, supplied by the editor so it reads.', '',
      'A letter a typist dropped.'],
    ['superfluous', '<span class="mk-sup">e</span>', '{e}',
      'In the source by mistake, set aside by the editor.', '',
      'A letter typed twice.'],
    ['sic', '<span class="mk-sic">thunb</span>', 'thunb (!)',
      'So in the source, odd as it is: not a mistake of the transcription.', '',
      'A typist’s slip kept as typed.'],
    ['expanded', '<span class="mk-exp">W’R</span>', 'W(HENEVE)R',
      'An abbreviation written out in full.', '',
      'MAD’s contracted statements written out (W’R for WHENEVER), where a bench offers it.'],
    ['vacat', '<span class="mk-vac">vac.</span>', 'vac.',
      'Space left blank in the source.', '',
      'A blank card or line in a listing.'],
    ['normalised', '<span class="mk-norm">~ssn</span>', 'the text as held, the change in a note',
      'Changed only so that the text can be run, not to its reading: the bench’s own mark.', 'the mount, not the vessel',
      'Normalised for assembly or for running.'],
    ['note', '<span class="mk-note">; [page 3]</span>', 'a note, outside the text',
      'The transcriber’s note: what the page is, what is on it besides the text.', '',
      'Lines beginning ; in a transcription.']
  ];
  function marks() {
    var M = B.marks || {}, uses = M.uses || {};
    return MARKS.concat(M.add || []).map(function (m) { return m.slice(0, 5).concat([uses[m[0]] || m[5]]); });
  }
  // a mark's Leiden form, for an export: SW.leiden(id, text, { lines, pages, chars, label })
  SW.leiden = function (id, t, o) {
    o = o || {}; t = t == null ? '' : String(t);
    switch (id) {
      case 'lost': return o.lines ? '[--- c. ' + o.lines + ' line' + (o.lines > 1 ? 's' : '') + ' ---]' : o.pages ? '[--- ' + o.pages + ' page' + (o.pages > 1 ? 's' : '') + ' ---]' : o.chars ? '[.' + o.chars + '.]' : '[---]';
      case 'restored': case 'supplied': return '[' + t + ']';
      case 'uncertain': return t.replace(/(\S)/g, '$1\u0323');
      case 'illegible': return new Array((o.chars || 1) + 1).join('. ').trim();
      case 'erased': return '\u27E6' + t + '\u27E7';
      case 'added': return '\\' + t + '/';
      case 'omitted': return '\u27E8' + t + '\u27E9';
      case 'superfluous': return '{' + t + '}';
      case 'sic': return t + ' (!)';
      case 'vacat': return 'vac.';
      default: return t;   // corrected, normalised, expanded (given whole), note: the text, the rest in a note
    }
  };
  SW.MARKS = { list: marks };
  SW.marksHelp = function () {
    var ms = marks(), note = (B.marks || {}).note;
    var rows = ms.map(function (m) {
      return '<tr><td class="mk-cell">' + m[1] + '</td><td class="mono">' + esc(m[2]) + '</td><td>' + esc(m[3]) + (m[4] ? ' <span class="faint">Kintsugi: ' + esc(m[4]) + '.</span>' : '') + '</td><td class="faint">' + esc(m[5]) + '</td></tr>';
    }).join('');
    var d = bigDialog('Marks and conventions', '<div class="marks-help">' +
      '<p>The marks the bench draws on a text where something was lost, restored, corrected or read with doubt, and the form each takes in an export. The export follows the Leiden conventions of epigraphy and papyrology, so that a reader of a Word or Markdown file can read the marks without this page. On the screen, the repairs are in gold, after kintsugi, the mending of pottery with gold that leaves the repair visible (Berry 2025): a restoration is never merged into the text it mends, and a loss is drawn where it is, not closed up.</p>' +
      (note ? '<p>' + note + '</p>' : '') +
      '<table class="data marks-table"><thead><tr><th>On the screen</th><th>In an export (Leiden)</th><th>What it means</th><th>In the benches</th></tr></thead><tbody>' + rows + '</tbody></table>' +
      '<p class="hint">A restoration and a supply both take square brackets in Leiden; the export names the witness of a supply, or the editor of a conjecture, in a note, as the screen does in gold.</p></div>',
      'markshelp', '<button class="btn ghost" data-mk="md">⤓ Markdown</button>');
    d.addEventListener('click', function (e) {
      if (!e.target.closest('[data-mk="md"]')) return;
      var md = '# Marks and conventions\n\n| In an export (Leiden) | What it means | Kintsugi | In the benches |\n|---|---|---|---|\n' +
        ms.map(function (m) { return '| `' + m[2].replace(/\|/g, '\\|') + '` | ' + m[3] + ' | ' + (m[4] || '') + ' | ' + m[5] + ' |'; }).join('\n') + '\n';
      root.SWExport.download(slug() + '-marks.md', md, 'text/markdown');
    });
  };

  SW.cards = { text: function (v, rows) { return cardText(verOf(v), rows); }, doc: cardDoc, svg: function (v, rows) { return cardSVG(verOf(v), rows); }, act: act, rows: rowsOf };
})(typeof window !== 'undefined' ? window : globalThis);
