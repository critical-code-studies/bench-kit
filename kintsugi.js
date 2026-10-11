/*
 * kintsugi.js - the repairs in Read, in gold, after kintsugi (Berry 2025): where a bench reads a
 * version otherwise than it is held, to read or run it. The ◆ ‹ › stepper in Read's toolbar, the
 * repairs bar folded under it, the list of repairs, View ▸ Repairs (gold), the filter to the
 * repaired lines, Copy and My notes, and the squiggle under a repaired line. Which lines are
 * repaired, and how, is the bench's: var X = SW.kintsugi(cfg), given to SW.readView as repairs.
 *   stops()        the repairs to step through, in order: [{ p, n0, n1, chip: { cls, label },
 *                  short (the bar's text for it), name (the list's), what (its hover and its
 *                  line when copied), toast, note (with the excerpt kept in My notes), id }]
 *   has()          whether the version has repairs at all (by default, any stop)
 *   total()        the count on the list button (by default the stops)
 *   paint(box, b, K)  marks the listing just drawn (K: wrapChars, diffSpan, squiggle, measure)
 *   click(e, b)    a click in the listing that is the bench's (true when it was)
 *   extras(cur, ui)   HTML for the bar's own buttons, after Only (ui.b, ui.tg make them);
 *                  act(k, cur, el, on) takes them (true when it has); noRedraw: [k]
 *   others()       [{ chip, ref, name, id }]: repairs not in the text, listed after the stops;
 *                  openOther(id, x, y)
 *   copyLines()    the lines Copy gives (by default each stop's reference and what)
 *   about()        HTML: what the marks mean
 *   titles         { tog, next, view (View ▸ Repairs), list(n), listHead(n), noCurrent, keep(ref),
 *                    copy }
 *   disableEmpty   ‹ › and Only greyed out when there is nothing to step to
 * SW.kintsugi.wrapChars(t, s, e, cls, title), diffSpan(a, b), squiggle(row, tx, s, e),
 * measure(row) are the marks' parts, for a bench's paint.
 * Part of bench-kit (github.com/critical-code-studies/bench-kit).
 */
(function (root) {
  'use strict';
  var SW = root.SW, esc = SW.esc;

  // ---------- the marks' parts ----------
  function diffSpan(a, b) {   // where b differs from a: [start, end) in b
    var i = 0, j = 0;
    while (i < a.length && i < b.length && a[i] === b[i]) i++;
    while (j < a.length - i && j < b.length - i && a[a.length - 1 - j] === b[b.length - 1 - j]) j++;
    return [i, Math.max(i, b.length - j)];
  }
  // characters s to e of the text in t, wrapped in a span
  function wrapChars(t, s, e, cls, title) {
    var nodes = [], w = document.createTreeWalker(t, NodeFilter.SHOW_TEXT), x, pos = 0;
    while ((x = w.nextNode())) nodes.push(x);
    nodes.forEach(function (nd) {
      var len = nd.nodeValue.length, a = Math.max(s, pos), bb = Math.min(e, pos + len);
      if (a < bb) {
        var piece = nd;
        if (a > pos) piece = piece.splitText(a - pos);
        if (bb - a < piece.nodeValue.length) piece.splitText(bb - a);
        var sp = SW.el('span', { class: cls, title: title });
        piece.parentNode.insertBefore(sp, piece); sp.appendChild(piece);
      }
      pos += len;
    });
  }
  // the squiggle's reach, the line's text (code and comment), measured once drawn, in em so that
  // it follows the text size; not past a comment cut short
  function measure(row) {
    var rl = row.querySelectorAll('.rp-line'), first = rl[0], last = rl[rl.length - 1];
    if (!last) return;
    var r0 = row.getBoundingClientRect(), fs = parseFloat(getComputedStyle(row).fontSize) || 13;
    var tt = row.querySelector('.t'), a = first.getBoundingClientRect().left - r0.left, z = Math.min(last.getBoundingClientRect().right, tt ? tt.getBoundingClientRect().right : Infinity) - r0.left;
    if (!r0.width || z <= a) return;
    row.style.setProperty('--k0', (a / fs).toFixed(2) + 'em');
    row.style.setProperty('--kw', ((z - a) / fs).toFixed(2) + 'em');
  }
  // the squiggle under a line's text from s to e (as under a misspelt word): gold for a repair,
  // grey for an uncertain reading left as found
  function squiggle(row, tx, s, e, title) {
    if (row.classList.contains('rp-sq') || e <= s) return;
    wrapChars(tx, s, e, 'rp-line', title || '');
    row.classList.add('rp-sq'); measure(row);
  }
  // small line icons for the repairs bar (currentColor, 14px)
  var KI = {
    list: '<path d="M2 4h10M2 7h10M2 10h10"/>',
    only: '<path d="M2 3h10L8.2 7.6V11L5.8 12V7.6z"/>',
    from: '<path d="M3.5 1.5h5l2.5 2.5v8.5h-7.5z M8.5 1.5V4H11 M5.5 7h3.5M5.5 9.5h3.5"/>',
    scan: '<path d="M3.5 1.5h5l2.5 2.5v8.5h-7.5z M8.5 1.5V4H11 M5.5 7h3.5M5.5 9.5h3.5"/>',
    why: '<path d="M5 5.2a2 2 0 1 1 2.8 1.8c-.5.3-.8.7-.8 1.3v.6 M7 10.8v.1"/>',
    norm: '<path d="M2 6c1.5-1.6 3-1.6 5 0s3.5 1.6 5 0M2 9.5c1.5-1.6 3-1.6 5 0s3.5 1.6 5 0"/>',
    keep: '<path d="M3.5 1.5h7v11L7 10l-3.5 2.5z M7 4v4M5 6h4"/>',
    copy: '<path d="M4.5 4.5h7v7h-7z M2.5 9.5v-7h7"/>',
    card: '<path d="M1.5 3.5h11v7h-11z M3.5 6h7M3.5 8h4.5"/>',
    cards: '<path d="M3.5 5.5h9v6.5h-9z M1.5 8.5V3.5h9 M5.5 8h5"/>',
    about: '<path d="M7 1.5a5.5 5.5 0 1 0 0 11a5.5 5.5 0 1 0 0-11z M7 6.2v3.8 M7 4.2v.1"/>'
  };
  function kic(k) { return '<svg class="ki" viewBox="0 0 14 14" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + KI[k] + '</svg>'; }
  // a button of the bar, and one that stays pressed
  function b(k, title, extra, lab) { return '<button class="kb" data-km="' + k + '" title="' + esc(title) + '"' + (extra || '') + '>' + (KI[k] ? kic(k) : '') + (lab ? '<span>' + esc(lab) + '</span>' : '') + '</button>'; }
  function tg(k, on, title, lab, extra) { return b(k, title, ' aria-pressed="' + (on ? 'true' : 'false') + '"' + (extra || ''), lab); }

  SW.kintsugi = function (cfg) {
    var ctx = null, T = cfg.titles || {};
    function build() { return ctx.build(); }
    function view() { return ctx.view; }
    function opts() { return ctx.opts; }
    function stops() { return cfg.stops ? cfg.stops() : []; }
    function has() { return cfg.has ? cfg.has() : stops().length > 0; }
    function shown() { return opts().repairs !== false && has(); }
    function ref(s) { var bl = build(); return SW.refText(bl.v.id, s.p, s.n0, s.n1, bl.parts.length); }
    function rowOf(s) { return SW.$('#L' + s.p + '-' + s.n0, view()); }
    // the stops still in view (the filter may have hidden some)
    function live() { return stops().filter(function (s) { var r = rowOf(s); return !r || !r.classList.contains('nf-hide'); }); }

    function paintNav() {
      var nav = SW.$('.kin-nav', view()); if (!nav) return;
      var n = stops().length;
      nav.hidden = !shown();
      SW.$('.kin-n', nav).textContent = n;
      if (cfg.disableEmpty) SW.$('#rd-kprev', nav).disabled = SW.$('#rd-knext', nav).disabled = !n;
      paintBar();
    }
    function go(s) {
      ctx.R.goto(s.p, s.n0, false);
      SW.state.sel = { p: s.p, n0: s.n0, n1: s.n1 }; ctx.paintSel(); SW.writeQuery();
      var r = rowOf(s);
      if (r) { r.scrollIntoView({ block: 'center' }); r.classList.remove('kin-flash'); void r.offsetWidth; r.classList.add('kin-flash'); }
      var t = s.toast || s.what; if (t) SW.toast(t, 6000);
    }
    function current() {   // the selected repair, else the next one after the selection
      var st = live(), s = SW.state.sel; if (!st.length) return null;
      if (s) {
        var hit = st.filter(function (x) { return x.p === s.p && x.n0 <= s.n1 && x.n1 >= s.n0; })[0]; if (hit) return hit;
        var nx = st.filter(function (x) { return x.p > s.p || (x.p === s.p && x.n0 > s.n1); })[0]; if (nx) return nx;
      }
      return st[0];
    }
    function step(dir) {
      var st = live(); if (!st.length) return;
      var s = SW.state.sel, i;
      if (!s) i = dir > 0 ? 0 : st.length - 1;
      else {
        var at = -1; st.forEach(function (x, k) { if (x.p < s.p || (x.p === s.p && x.n0 <= s.n0)) at = k; });
        var on = at >= 0 && st[at].p === s.p && st[at].n0 <= s.n1 && st[at].n1 >= s.n0;
        i = dir > 0 ? at + 1 : (on ? at - 1 : at);
      }
      go(st[(i + st.length) % st.length]);
    }
    function list(btn) {
      var st = live(), others = cfg.others ? cfg.others() : [], r0 = btn.getBoundingClientRect();
      function chip(c) { return '<span class="kin-k ' + esc(c.cls || '') + '">' + esc(c.label) + '</span>'; }
      SW.pop(r0.left, r0.bottom + 4, '<h4>' + esc(T.listHead ? T.listHead(st.length) : 'Repairs in this text (' + st.length + ')') + '</h4><div class="kin-list">' + st.map(function (s, i) {
        return '<a href="#" data-k="' + i + '">' + chip(s.chip) + ' <span class="mono">' + esc(ref(s)) + '</span><span class="kin-w">' + esc(s.name || s.what || '') + '</span></a>';
      }).join('') + (others.length ? '<div class="faint kin-sub">' + esc(T.others || 'Not in the text') + '</div>' + others.map(function (o) {
        return '<a href="#" data-o="' + esc(o.id) + '">' + chip(o.chip) + ' <span class="mono">' + esc(o.ref) + '</span><span class="kin-w">' + esc(o.name) + '</span></a>';
      }).join('') : '') + '</div>');
      var pop = SW.$('.pop');
      if (pop) pop.addEventListener('click', function (e) {
        var a = e.target.closest('[data-k]'), o = e.target.closest('[data-o]');
        if (a) { e.preventDefault(); SW.unpop(); go(st[+a.dataset.k]); }
        else if (o && cfg.openOther) { e.preventDefault(); SW.unpop(); cfg.openOther(o.dataset.o, r0.left, r0.bottom + 4); }
      });
    }
    // ◆ ⌄: the repairs bar, folded down under the toolbar (redrawn as the selection and settings change)
    function paintBar() {
      var bar = SW.$('.kin-bar', view()), tog = SW.$('#rd-klist', view()); if (!bar || !build()) return;
      var n = live().length, on = opts().kinBar && shown();
      bar.hidden = !on;
      if (tog) { tog.setAttribute('aria-expanded', on ? 'true' : 'false'); tog.classList.toggle('open', on); }
      if (!on) return;
      var cur = current(), rf = cur ? ref(cur) : '', s = SW.state.sel, here = cur && s && cur.p === s.p && cur.n0 <= s.n1 && cur.n1 >= s.n0;
      var off = cfg.disableEmpty && !n ? ' disabled' : '', total = cfg.total ? cfg.total() : n;
      bar.innerHTML =
        '<button class="kb" data-km="prev" title="The previous repair"' + off + '>‹</button><button class="kb" data-km="next" title="' + esc(T.next || 'The next repair') + '"' + off + '>›</button>' +
        b('list', T.list ? T.list(total) : 'Every repair in this text (' + total + '), to jump to', '', String(total)) +
        (cur ? '<button class="kin-cur" data-km="go" title="' + esc((here ? 'This repair' : 'The next repair after the selection') + ': ' + rf + ' ' + (cur.what || '')) + '"><span class="mono">' + esc(rf.replace(/^\[REF: |\]$/g, '')) + '</span> ' + esc(cur.short || cur.what || '') + '</button>'
             : (T.noCurrent ? '<span class="kin-cur faint">' + esc(T.noCurrent) + '</span>' : '')) +
        '<span class="kbs"></span>' +
        tg('only', opts().onlyRepaired, 'Only the repaired lines, with two either side', '', off) +
        (cfg.extras ? cfg.extras(cur, { b: b, tg: tg, ref: rf }) : '') +
        '<span class="kbs"></span>' +
        b('keep', cur ? (T.keep ? T.keep(rf) : 'Add this repair to My notes (' + rf + '), cited, with its lines') : 'No repair selected', cur ? '' : ' disabled') +
        b('copy', T.copy || 'Copy every repair, with references, as plain text') +
        '<span class="kbs"></span>' +
        b('card', 'This version’s reconstruction card') +
        b('cards', 'All reconstruction cards') +
        b('about', 'What the gold marks mean') +
        '<button class="kb kb-x" data-km="close" title="Fold the repairs bar away">✕</button>';
    }
    function act(k, el) {
      var cur = current(), on = el && el.getAttribute && el.hasAttribute('aria-pressed') ? el.getAttribute('aria-pressed') !== 'true' : el && el.checked;
      var bl = build(), anchorEl = el || SW.$('#rd-klist', view());
      if (cfg.act && cfg.act(k, cur, anchorEl, on)) return;
      if (k === 'prev') step(-1);
      else if (k === 'next') step(1);
      else if (k === 'list') list(anchorEl);
      else if (k === 'go') { if (cur) go(cur); }
      else if (k === 'close') { opts().kinBar = false; SW.store.set('read.kinBar', false); paintBar(); }
      else if (k === 'only') { opts().onlyRepaired = on; ctx.applyFilter(); if (on) { var f = live()[0]; if (f) go(f); } }
      else if (k === 'card') SW.cardsOne(bl.v.id);
      else if (k === 'cards') SW.cardsHelp();
      else if (k === 'about') { var r1 = anchorEl.getBoundingClientRect(); if (cfg.about) SW.pop(r1.left, r1.bottom + 4, cfg.about()); }
      else if (k === 'copy') {
        var lines = cfg.copyLines ? cfg.copyLines() : stops().map(function (s) { return ref(s) + '  ' + (s.what || ''); });
        var text = 'Repairs to ' + bl.v.label + ' ' + SW.refText(bl.v.id) + ' (' + (SW.BENCH.title || 'Research Bench') + ' ' + SW.VERSION + '):\n' + lines.join('\n');
        (navigator.clipboard ? navigator.clipboard.writeText(text) : Promise.reject()).then(function () { SW.toast(lines.length + ' repairs copied'); }, function () { root.prompt('Copy:', text); });
      }
      else if (k === 'keep') {   // the lines, cited, with what was done to them, into My notes
        if (!cur || !SW.tray) return;
        var rf = ref(cur), sel = { p: cur.p, n0: cur.n0, n1: cur.n1 };
        ctx.listingDoc(bl, sel).then(function (d) {
          d.title = 'Repair ' + (cur.id ? cur.id + ' ' : '') + rf;
          d.blocks.push({ type: 'p', text: cur.note || cur.what || '' });
          SW.tray.addDoc(d, { anchor: { p: cur.p, n0: cur.n0, n1: cur.n1, src: bl.parts[cur.p].src }, quote: bl.lines[cur.p].slice(cur.n0 - 1, cur.n1).map(function (L) { return L.raw; }).join('\n'), tags: ['repair'] });
        });
      }
    }
    function measureAll() { SW.$$('.listing .ln.rp-sq', view()).forEach(measure); }

    // the hooks Read takes (kit/read.js, H.repairs)
    return {
      init: function (c) { ctx = c; },
      nav: '<span class="kin-nav" hidden><button class="btn" id="rd-kprev" title="The previous repair">‹</button>' +
        '<button class="btn kin-tog" id="rd-klist" aria-expanded="false" title="' + esc(T.tog || 'Repairs (kintsugi). Click to show or hide the repairs bar') + '"><span class="kin-dia">◆</span> <span class="kin-n"></span> <span class="kin-chev" aria-hidden="true">⌄</span></button>' +
        '<button class="btn" id="rd-knext" title="' + esc(T.next || 'The next repair') + '">›</button></span>',
      view: function () { return '<label class="check" title="' + esc(T.view || 'Mark in gold where the bench reads the text otherwise than it is held, to read or run it (kintsugi)') + '"><input type="checkbox" id="rd-repairs"' + (opts().repairs ? ' checked' : '') + '> Repairs (gold)</label>'; },
      wire: function (tb) {
        SW.$('#rd-repairs', tb).onchange = function (e) {
          opts().repairs = e.target.checked; SW.store.set('read.repairs', opts().repairs);
          SW.$$('.listing', view()).forEach(function (x) { x.classList.toggle('no-repairs', !opts().repairs); });
          paintNav();
        };
        SW.$('#rd-kprev', tb).onclick = function () { step(-1); };
        SW.$('#rd-knext', tb).onclick = function () { step(1); };
        var kb = SW.el('div', { class: 'kin-bar', role: 'toolbar', 'aria-label': 'Repairs' }); kb.hidden = true;
        tb.appendChild(kb);
        SW.$('#rd-klist', tb).onclick = function () { opts().kinBar = !opts().kinBar; SW.store.set('read.kinBar', opts().kinBar); paintBar(); };
        var keepBar = ['close', 'list', 'about', 'card', 'cards'].concat(cfg.noRedraw || []);
        kb.addEventListener('click', function (e) { var x = e.target.closest('[data-km]'); if (x && x.tagName !== 'INPUT' && !x.disabled) { e.preventDefault(); act(x.dataset.km, x); if (keepBar.indexOf(x.dataset.km) < 0) paintBar(); } });
        kb.addEventListener('change', function (e) { var x = e.target.closest('[data-km]'); if (x) { act(x.dataset.km, x); paintBar(); } });
      },
      paint: function (box, bl) {
        if (cfg.paint) cfg.paint(box, bl, SW.kintsugi);
        measureAll();
        if (root.ResizeObserver && SW.$('.ln.rp-sq', box)) new ResizeObserver(measureAll).observe(box);   // measured again once shown (Read opened from another tab)
        box.classList.toggle('no-repairs', !opts().repairs);
        setTimeout(paintNav, 0);
      },
      click: function (e, bl) { return cfg.click ? cfg.click(e, bl) : false; },
      bar: function () { paintBar(); },
      kept: function () { var keep = {}; stops().forEach(function (s) { for (var n = s.n0 - 2; n <= s.n1 + 2; n++) keep[s.p + ':' + n] = true; }); return keep; },
      relayout: measureAll,
      paintNav: paintNav
    };
  };
  SW.kintsugi.wrapChars = wrapChars;
  SW.kintsugi.diffSpan = diffSpan;
  SW.kintsugi.squiggle = squiggle;
  SW.kintsugi.measure = measure;
})(typeof window !== 'undefined' ? window : globalThis);
