/*
 * mending.js - repairs to versions made in the page (kit/builder.js), after the principles for
 * reconstructing digital ruins (Berry, "Digital Ruins and Critical Code Studies", Stunlaw, January
 * 2025): minimum intervention, every repair reversible and documented, the held files never
 * altered. Stage 3 of the hand-built project; for a bench that says editable: true.
 *   Read, a selection in a version made here ▸ Repair: the lines as held beside a box for how they
 *   are to be read, the mend (hibi: a reading corrected against another copy; yobitsugi: a passage
 *   supplied from another copy or version; kake: code written where none survives), a title, why,
 *   and the evidence. The repair is a record (builder.repairs), signed and dated; the file is not
 *   touched. Read shows the held text with the repaired lines underlined in gold, the reading on
 *   hover, through kit/kintsugi.js (the ◆ stepper, the bar, the list; Take out and Why on the bar).
 *   Flatten repairs (on the bar): a new version, derived from this one, whose files are the held
 *   files with the repairs applied, for running or handing on; the held version and its repairs
 *   stay as they are.
 * Load it after kit/kintsugi.js and kit/builder.js, before the bench's js/read.js; Read takes it
 * where the bench gives no repairs of its own. SW.mending: list(vid), add(vid, r), remove(vid, id),
 * apply(text, repairs) (pure), flatten(vid), kintsugi(), selActs().
 * Part of bench-kit (github.com/critical-code-studies/bench-kit).
 */
(function (root) {
  'use strict';
  var SW = root.SW, B = SW.BENCH || {}, M = SW.mending = {};
  var MENDS = { hibi: { label: 'Corrected', note: 'a reading corrected against another copy of the same file (hibi: a crack filled with gold)' },
                yobitsugi: { label: 'Supplied', note: 'a passage supplied from another copy or version (yobitsugi: a piece from another vessel)' },
                kake: { label: 'Remade', note: 'code written where none survives (kake: a lost piece remade)' } };
  M.MENDS = MENDS;

  // ---------- pure parts (tests/mending.test.js) ----------
  // a file's text with its repairs applied: each replaces lines n0..n1 (of the held file) with its
  // text, the last first, so that the line numbers of the others still hold; the line ends kept
  M.apply = function (text, repairs) {
    var nl = /\r\n/.test(text) ? '\r\n' : '\n', lines = String(text).split(/\r?\n/);
    repairs.slice().sort(function (a, b) { return b.n0 - a.n0; }).forEach(function (r) {
      Array.prototype.splice.apply(lines, [r.n0 - 1, r.n1 - r.n0 + 1].concat(String(r.text).split(/\r?\n/)));
    });
    return lines.join(nl);
  };
  // what stops a repair being kept: '' when nothing does
  M.check = function (r, others) {
    if (!(r.n0 >= 1 && r.n1 >= r.n0)) return 'Choose the lines to repair.';
    if (r.text === r.held) return 'The reading is the same as the held text: change it, or cancel.';
    if (!MENDS[r.mend]) return 'Choose the kind of mend.';
    if (!String(r.why || '').trim()) return 'Say why: a repair is documented.';
    if ((others || []).some(function (o) { return o.p === r.p && o.n0 <= r.n1 && o.n1 >= r.n0; })) return 'These lines overlap a repair already made: take that out first, or choose others.';
    return '';
  };

  var Bd = SW.builder, V = root.SWVersions;
  if (!B.editable || !Bd) return;
  var KEY = 'builder.repairs';
  function all() { return SW.store.get(KEY, {}) || {}; }
  function local(vid) { var v = V.byId(vid); return !!(v && v.local); }
  M.list = function (vid) { return (all()[vid] || []).slice().sort(function (a, b) { return a.p - b.p || a.n0 - b.n0; }); };
  M.add = function (vid, r) {
    var A = all(), L = A[vid] || [], n = L.reduce(function (m, x) { var k = /(\d+)$/.exec(x.id); return Math.max(m, k ? +k[1] : 0); }, 0);
    var msg = M.check(r, L); if (msg) throw new Error(msg);
    r.id = 'K' + (n + 1); r.kind = 'text'; r.by = r.by || SW.me().initials || ''; r.date = r.date || SW.today();
    L.push(r); A[vid] = L; SW.store.set(KEY, A);
    return r;
  };
  M.remove = function (vid, id) {
    var A = all(); A[vid] = (A[vid] || []).filter(function (r) { return r.id !== id; });
    if (!A[vid].length) delete A[vid];
    SW.store.set(KEY, A);
  };
  // a version taken out takes its repairs with it (kit/builder.js)
  M.forget = function (vid) { var A = all(); if (A[vid]) { delete A[vid]; SW.store.set(KEY, A); } };

  // a new version: the held files with the repairs applied, derived from the version
  M.flatten = function (vid) {
    var v = V.byId(vid), R = M.list(vid);
    if (!v || !local(vid)) return Promise.reject(new Error('Only a version made here can be flattened here.'));
    if (!R.length) return Promise.reject(new Error(v.label + ' has no repairs to apply.'));
    var rec = Bd.made().filter(function (r) { return r.id === vid; })[0];
    return Promise.all(v.build.map(function (part, pi) {
      return SW.fileSource.text(part.src).then(function (t) {
        var mine = R.filter(function (r) { return r.p === pi; });
        return { name: rec.files[pi].name, role: rec.files[pi].role, data: new TextEncoder().encode(mine.length ? M.apply(t, mine) : t).buffer };
      });
    })).then(function (files) {
      var id = vid + '-repaired', k = 2; while (V.byId(id)) id = vid + '-repaired-' + k++;
      return Bd.add({ id: id, label: v.label + ', repaired', date: v.date, authors: v.authors, parent: vid,
                      summary: 'Derived from ' + vid + ': its held files with its ' + R.length + ' repair' + (R.length === 1 ? '' : 's') + ' applied (' + R.map(function (r) { return r.id; }).join(', ') + '), for running or handing on. ' + vid + ' and its repairs are unchanged.',
                      derived: { from: vid, repairs: R.map(function (r) { return r.id; }), made: SW.today(), by: SW.me().initials || '' } }, files);
    });
  };

  // ---------- Read: the repairs in gold, through kit/kintsugi.js ----------
  function cur() { return local(SW.state.v) ? M.list(SW.state.v) : []; }
  function what(r) { return 'Lines ' + r.n0 + (r.n1 !== r.n0 ? '–' + r.n1 : '') + ' are read as: “' + String(r.text).replace(/\s+/g, ' ').trim().slice(0, 200) + '”'; }
  function pop(r, x, y) {
    var m = MENDS[r.mend] || { label: r.mend, note: '' };
    SW.pop(x, y, '<h4 class="kin-h">Kintsugi · ' + SW.esc(r.id) + ': ' + SW.esc(r.title || m.label) + '</h4><div class="faint"><span class="rp-chip rp-m-' + SW.esc(r.mend) + '">' + SW.esc(m.label) + '</span> ' + SW.esc(m.note) + '</div>' +
      '<p><b>Held.</b></p><pre class="mono">' + SW.esc(r.held) + '</pre><p><b>Read as.</b></p><pre class="mono">' + SW.esc(r.text) + '</pre>' +
      '<p><b>Why.</b> ' + SW.esc(r.why) + '</p>' + (r.evidence ? '<p class="faint"><b>Evidence.</b> ' + SW.esc(r.evidence) + '</p>' : '') +
      '<p class="faint"><b>By</b> ' + SW.esc(r.by || '') + ', ' + SW.esc(r.date || '') + '. The held file is not changed; Flatten repairs makes a version with the repairs applied.</p>');
  }
  M.kintsugi = function () {
    if (!SW.kintsugi) return null;
    var X = SW.kintsugi({
      stops: function () {
        return cur().map(function (r) {
          var m = MENDS[r.mend] || { label: r.mend };
          return { p: r.p, n0: r.n0, n1: r.n1, id: r.id, r: r, chip: { cls: 'rp-m-' + r.mend, label: m.label }, short: m.label + ' (' + r.id + '): ' + (r.title || ''),
                   name: r.id + ': ' + (r.title || m.label), what: what(r), toast: 'Kintsugi · ' + what(r), note: what(r) + ' Why: ' + r.why + (r.evidence ? ' Evidence: ' + r.evidence : '') };
        });
      },
      disableEmpty: true,
      paint: function (box, b, K) {
        M.list(b.v.id).forEach(function (r) {
          for (var n = r.n0; n <= r.n1; n++) {
            var row = SW.$('#L' + r.p + '-' + n, box), tx = row && row.querySelector('.t'); if (!tx) continue;
            row.classList.add('mend', r.mend === 'yobitsugi' ? 'rp-sup' : 'rp-fix');
            row.dataset.mend = r.id;
            K.squiggle(row, tx, 0, tx.textContent.length, 'Kintsugi · ' + (MENDS[r.mend] || {}).label + ' (' + r.id + '): ' + what(r) + '. Click the line number for why.');
          }
        });
      },
      click: function (e, b) {
        var row = e.target.closest('.ln.mend'); if (!row || !e.target.closest('.n') || e.target.closest('.qa')) return false;
        var r = M.list(b.v.id).filter(function (x) { return x.id === row.dataset.mend; })[0];
        if (r) { pop(r, e.clientX, e.clientY); return true; }
        return false;
      },
      extras: function (c, ui) {
        return ui.b('why', c ? 'What was done to ' + c.id + ', why, and who made it' : 'No repair selected', c ? '' : ' disabled') +
          ui.b('out', c ? 'Take ' + c.id + ' out: the lines are read as held again' : 'No repair selected', c ? '' : ' disabled', 'Take out') +
          ui.b('flat', 'Flatten repairs: a new version made from this one, its files with every repair applied', cur().length ? '' : ' disabled', 'Flatten');
      },
      act: function (k, c, el) {
        var vid = SW.state.v;
        if (k === 'why') { var r0 = el.getBoundingClientRect(); if (c) pop(c.r, r0.left, r0.bottom + 4); return true; }
        if (k === 'out' && c) {
          if (!confirm('Take ' + c.id + ' out? Lines ' + c.n0 + (c.n1 !== c.n0 ? '–' + c.n1 : '') + ' are read as held again, and the record of the repair goes.')) return true;
          M.remove(vid, c.id); redraw(); SW.toast(c.id + ' taken out'); return true;
        }
        if (k === 'flat') {
          M.flatten(vid).then(function (v) { SW.select(v.id); SW.setTab('read'); SW.toast(v.label + ': ' + v.build.length + ' file' + (v.build.length === 1 ? '' : 's') + ', derived from ' + vid, 6000); },
                              function (e) { SW.toast(e.message, 6000); });
          return true;
        }
        return false;
      },
      noRedraw: ['why', 'out', 'flat'],
      about: function () {
        return '<h4>Repairs</h4><p>A repair to a version made here is a record: the lines as held, how they are read, the kind of mend, why, the evidence, who made it and when. The held file is never changed; the repaired lines are underlined in gold, after kintsugi, and their reading shows on hover.</p>' +
          '<div class="keylist">' + Object.keys(MENDS).map(function (k) { return '<div><span class="rp-chip rp-m-' + k + '">' + MENDS[k].label + '</span> ' + SW.esc(MENDS[k].note) + '</div>'; }).join('') + '</div>' +
          '<p class="faint">Flatten repairs makes a new version, derived from this one, whose files have the repairs applied. After Berry, ‘Digital ruins and critical code studies’ (2025).</p>';
      },
      titles: { tog: 'Repairs to this version, made here (kintsugi). Click to show or hide the repairs bar', next: 'The next repair',
                view: 'Mark in gold the lines of this version read otherwise than they are held', list: function (n) { return 'Every repair to this version (' + n + ')'; },
                copy: 'Copy every repair to this version, with references, as plain text' }
    });
    function redraw() { SW.forget('read'); SW.setTab('read'); }
    return X;
  };

  // ---------- the selection bar: Repair ----------
  M.selActs = function () {
    var sel = SW.state.sel, vid = SW.state.v;
    if (!sel || !local(vid)) return [];
    return [['◆ Repair', function () { open(vid, sel); }]];
  };
  function open(vid, sel) {
    SW.build(vid).then(function (b) {
      var p = sel.p, n0 = sel.n0, n1 = sel.n1, held = b.lines[p].slice(n0 - 1, n1).map(function (L) { return L.raw; }).join('\n');
      var d = SW.$('#dlg-mend');
      if (!d) {
        d = SW.el('dialog', { id: 'dlg-mend', class: 'set-dlg' });
        document.body.appendChild(d);
      }
      d.innerHTML = '<form method="dialog" class="settings"><h2>Repair ' + SW.esc(b.parts[p].src.split('/').pop()) + ', line' + (n1 !== n0 ? 's ' + n0 + '–' + n1 : ' ' + n0) + '</h2>' +
        '<p class="hint">The held file is not changed. The repair is a record of how these lines are to be read, marked in gold in Read; Flatten repairs makes a version with it applied.</p>' +
        '<label>As held<pre class="mono mend-held">' + SW.esc(held) + '</pre></label>' +
        '<label>Read as <textarea id="mend-text" rows="' + Math.min(12, n1 - n0 + 2) + '" class="mono" spellcheck="false"></textarea></label>' +
        '<label>Mend <select id="mend-kind">' + Object.keys(MENDS).map(function (k) { return '<option value="' + k + '">' + MENDS[k].label + ': ' + SW.esc(MENDS[k].note) + '</option>'; }).join('') + '</select></label>' +
        '<label>Title <input id="mend-title" placeholder="e.g. A damaged number read as the other copy has it" autocomplete="off"></label>' +
        '<label>Why <textarea id="mend-why" rows="3" placeholder="What is wrong as held, and what the reading rests on"></textarea></label>' +
        '<label>Evidence <input id="mend-ev" placeholder="e.g. the other copy, its file and lines" autocomplete="off"></label>' +
        '<p class="hint set-msg" id="mend-msg"></p>' +
        '<div class="row"><button value="cancel" class="btn ghost">Cancel</button><button value="save" class="btn" id="mend-save">Keep the repair</button></div></form>';
      SW.$('#mend-text', d).value = held;
      SW.$('form', d).addEventListener('submit', function (e) {
        if (!e.submitter || e.submitter.value !== 'save') return;
        e.preventDefault();
        var r = { p: p, file: b.parts[p].src.split('/').pop(), n0: n0, n1: n1, held: held, text: SW.$('#mend-text', d).value.replace(/\n$/, ''),
                  mend: SW.$('#mend-kind', d).value, title: SW.$('#mend-title', d).value.trim(), why: SW.$('#mend-why', d).value.trim(), evidence: SW.$('#mend-ev', d).value.trim() };
        var go = function () {
          try { var k = M.add(vid, r); d.close(); SW.forget('read'); SW.setTab('read'); SW.toast('Repair ' + k.id + ' kept: ' + (MENDS[k.mend] || {}).label, 4000); }
          catch (err) { SW.$('#mend-msg', d).textContent = err.message; }
        };
        if (SW.me().initials) go();
        else SW.withInitials('A repair is signed with your initials.').then(go, function () {});
      });
      d.showModal();
    });
  }
})(typeof window !== 'undefined' ? window : globalThis);
