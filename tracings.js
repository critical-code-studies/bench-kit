/*
 * tracings.js - naming, marking and tracing the parts of a program in a graph or a table
 * (Spacewar!'s blocks and routines in Art's Dynamic Profile Gizmo, SHRDLU's functions in
 * Functional overview): your names and colour marks, kept in this browser per version, and
 * tracings, sets of them shared with the crew through the annotation group (SW.notes.tracings),
 * opened read-only with Keep as mine, Link and ✕. From the Spacewar! bench's gizmo. Part of
 * bench-kit (github.com/critical-code-studies/bench-kit).
 *
 * var T = SW.tracings({ ns: 'gz', render, open(t), link(t), hint }): ns prefixes the stored
 * keys (gz.names, gz.marks, gz.pen); render draws the view again; open(t) shows a tracing
 * (its version and mode) and draws; link(t) is the address that opens it (with &tr=id, which
 * the bench reads into SW.state.trace); hint is said when there is nothing to share. Keys
 * (block or function) are the bench's: an address, a name.
 */
(function (root) {
  'use strict';
  var SW = root.SW;
  SW.tracings = function (o) {
  var NS = (o.ns || 'tr') + '.', TR = null;
  function gzLayer(kind, vid) { return TR && TR.vids.indexOf(vid) >= 0 ? (TR[kind] || {})[vid] || {} : ((SW.store.get(NS + kind, {}) || {})[vid] || {}); }
  function gzRO() { if (TR) SW.toast('A tracing is open: Keep as mine to change its names and marks, or close it.', 4000); return !!TR; }
  function gzName(vid, a0) { return gzLayer('names', vid)[a0] || ''; }
  function gzSetName(vid, a0, name) { if (gzRO()) return; var all = SW.store.get(NS + 'names', {}) || {}; all[vid] = all[vid] || {}; if (name) all[vid][a0] = name; else delete all[vid][a0]; SW.store.set(NS + 'names', all); }
  // Marks for tracing: a colour on a block or routine, kept in this browser like its name (not gold:
  // gold is the repairs')
  var GZ_MARKS = [['orange', '#f76b15'], ['blue', '#0090ff'], ['pink', '#d6409f'], ['teal', '#12a594'], ['brown', '#a07553']];   // none the outlines' red, green or violet
  function gzMarkHex(m) { var c = GZ_MARKS.filter(function (x) { return x[0] === m; })[0]; return c ? c[1] : ''; }
  function gzMark(vid, a0) { return gzLayer('marks', vid)[a0] || ''; }
  function gzSetMark(vid, a0, m) { if (gzRO()) return; var all = SW.store.get(NS + 'marks', {}) || {}; all[vid] = all[vid] || {}; if (m) all[vid][a0] = m; else delete all[vid][a0]; SW.store.set(NS + 'marks', all); }
  function gzMarkField(cur) {
    if (TR) return '<span class="gz-marks"><span class="hint">' + (cur ? '<i class="gz-mk on" style="--mk:' + gzMarkHex(cur) + '"></i> ' : '') + 'from the tracing</span></span>';
    return '<span class="gz-marks" title="Mark it in a colour, for tracing (kept in this browser)">' + GZ_MARKS.map(function (c) { return '<button class="gz-mk' + (cur === c[0] ? ' on' : '') + '" data-mark="' + c[0] + '" style="--mk:' + c[1] + '" title="' + c[0] + '" aria-pressed="' + (cur === c[0]) + '"></button>'; }).join('') +
      '<button class="gz-mk gz-mk-none' + (cur ? '' : ' on') + '" data-mark="" title="No mark" aria-pressed="' + !cur + '">✕</button></span>';
  }
  // The pen: the colour a ⇧-click puts on a box (or takes off it), chosen in any box's swatches
  function gzPen() { var m = SW.store.get(NS + 'pen', 'orange'); return gzMarkHex(m) ? m : 'orange'; }
  function gzMarkCount(vids) { var all = SW.store.get(NS + 'marks', {}) || {}; return vids.reduce(function (t, v) { return t + Object.keys(all[v] || {}).length; }, 0); }
  function gzClearMarks(vids) { var all = SW.store.get(NS + 'marks', {}) || {}; vids.forEach(function (v) { delete all[v]; }); SW.store.set(NS + 'marks', all); }
  function gzMarkTool(vids) {   // (in Compare a routine's mark is on both versions: counted once)
    var n = Math.max.apply(null, vids.map(function (v) { return gzMarkCount([v]); }));
    return '<span class="sep"></span><span class="gz-pen" title="⇧-click a box to mark it in this colour, or to take its mark off. Choose the colour in any box (click a box, then a swatch)"><i class="gz-mk on" style="--mk:' + gzMarkHex(gzPen()) + '"></i> ⇧-click to mark</span>' +
      '<button class="btn ghost gz-clear" title="Take every mark off ' + SW.esc(vids.map(function (v) { return SW.refOf(v); }).join(' and ')) + '"' + (n ? '' : ' disabled') + '>Clear marks' + (n ? ' (' + n + ')' : '') + '</button>';
  }
  // Tracings: your names and marks for the versions shown, shared with the crew through the annotation
  // group (SW.notes.tracings), and theirs opened here, read-only, to look at, link to, or keep as yours.
  function gzTraceTool() {
    return '<span class="sep"></span><button class="btn ghost gz-trb" title="Share your names and marks with the crew, or open theirs">⑂ Tracings</button>' +
      (TR ? '<span class="gz-trchip" title="' + SW.esc(TR.note || '') + '">Tracing <b>' + SW.esc(TR.title) + '</b> by ' + SW.esc(TR.by) + '<button class="btn ghost" data-tr="keep" title="Copy its names and marks into yours (yours for the same boxes are replaced)">Keep as mine</button><button class="btn ghost" data-tr="link" title="Share a link that opens it">' + SW.SHARE_ICON + '</button><button class="icon-btn" data-tr="close" title="Close the tracing: your own names and marks again">✕</button></span>' : '');
  }
  function gzTraceOpen(t) {
    TR = t; SW.unpop();
    if (o.open) o.open(t); else o.render();
    SW.toast('Tracing “' + t.title + '” by ' + t.by + ': its names and marks shown', 4000);
  }
  // arriving by a link (?tr=)
  function gzTraceArrive() {
    var id = SW.state.trace; if (!id) return; SW.state.trace = null;
    if (!SW.notes.configured()) { SW.toast('Tracings are shared through the annotation group: join it to open this one (Help ▸ Joining the annotation group).', 7000); return; }
    SW.notes.tracings.list().then(function (l) { var t = l.filter(function (x) { return x.id === id; })[0]; if (t) gzTraceOpen(t); else SW.toast('That tracing is not in your group, or was deleted.', 5000); });
  }
  function gzTraceWire(bar, vids, info) {
    bar.addEventListener('click', function (e) {
      var c = e.target.closest('[data-tr]');
      if (c && TR) {
        if (c.dataset.tr === 'close') { TR = null; o.render(); return; }
        if (c.dataset.tr === 'link') { SW.share({ title: 'Tracing: ' + TR.title, url: o.link(TR) }); return; }
        if (c.dataset.tr === 'keep') {
          ['names', 'marks'].forEach(function (k) { var all = SW.store.get(NS + k, {}) || {}; TR.vids.forEach(function (v) { all[v] = Object.assign(all[v] || {}, (TR[k] || {})[v] || {}); }); SW.store.set(NS + k, all); });
          SW.toast('Kept: its names and marks are now yours, in this browser', 4000); TR = null; o.render(); return;
        }
      }
      var tb = e.target.closest('.gz-trb'); if (!tb) return;
      var r = tb.getBoundingClientRect(), esc = SW.esc;
      var nN = vids.reduce(function (t, v) { return t + Object.keys(((SW.store.get(NS + 'names', {}) || {})[v]) || {}).length; }, 0), nM = vids.reduce(function (t, v) { return t + Object.keys(((SW.store.get(NS + 'marks', {}) || {})[v]) || {}).length; }, 0);
      SW.pop(Math.max(8, r.left - 120), r.bottom + 6, '<div class="gz-trpop"><h4>Share your tracing</h4>' +
        (!SW.notes.configured() ? '<p class="hint">Tracings are shared through the annotation group: join it first (Help ▸ Joining the annotation group).</p>' :
          nN + nM ? '<p class="hint">Your ' + nN + ' name' + (nN === 1 ? '' : 's') + ' and ' + nM + ' mark' + (nM === 1 ? '' : 's') + ' on ' + esc(vids.map(function (v) { return SW.refOf(v); }).join(' and ')) + ', for the crew to open.</p><input class="gz-trt" maxlength="80" placeholder="A title"><input class="gz-trn" maxlength="400" placeholder="A note (optional)"><button class="btn" data-trs>Share with the crew</button>'
            : '<p class="hint">' + esc(o.hint || 'Name or mark some first (click one; ⇧-click to mark).') + '</p>') +
        '<h4>The crew’s</h4><div class="gz-trlist"><p class="hint">' + (SW.notes.configured() ? 'Reading…' : 'None without the group.') + '</p></div></div>');
      var pop = SW.$('.pop .gz-trpop'); if (!pop) return;
      function list() {
        if (!SW.notes.configured()) return;
        SW.notes.tracings.list().then(function (l) {
          var here = l.filter(function (t) { return t.vids.some(function (v) { return vids.indexOf(v) >= 0; }); }), other = l.filter(function (t) { return here.indexOf(t) < 0; });
          function row(t) {
            var n = Object.keys(t.names).reduce(function (a, v) { return a + Object.keys(t.names[v]).length; }, 0), m = Object.keys(t.marks).reduce(function (a, v) { return a + Object.keys(t.marks[v]).length; }, 0);
            return '<div class="gz-tri"><button class="gz-tro" data-tro="' + esc(t.id) + '" title="' + esc(t.note || 'Open it') + '"><b>' + esc(t.title) + '</b><span class="faint">' + esc(t.by) + ' · ' + esc(SW.fmtDate(t.date)) + ' · ' + esc(t.vids.map(function (v) { return SW.refOf(v); }).join(' against ')) + ' · ' + n + ' names, ' + m + ' marks</span></button>' +
              (SW.notes.tracings.mine(t) ? '<button class="icon-btn" data-trd="' + esc(t.id) + '" title="Delete your tracing">✕</button>' : '') + '</div>';
          }
          var box = SW.$('.gz-trlist', pop); if (!box) return;
          box.innerHTML = l.length ? here.map(row).join('') + (other.length ? '<div class="hint gz-trsub">Other versions</div>' + other.map(row).join('') : '') : '<p class="hint">None yet.</p>';
          box.onclick = function (ev) {
            var o = ev.target.closest('[data-tro]'); if (o) { gzTraceOpen(l.filter(function (t) { return t.id === o.dataset.tro; })[0]); return; }
            var dl = ev.target.closest('[data-trd]');
            if (dl && confirm('Delete this tracing for everyone?')) SW.notes.tracings.remove(dl.dataset.trd).then(list, function (er) { SW.toast(er.message, 5000); });
          };
        }, function (er) { var box = SW.$('.gz-trlist', pop); if (box) box.innerHTML = '<p class="hint">' + esc(er.message) + '</p>'; });
      }
      list();
      var sb = SW.$('[data-trs]', pop);
      if (sb) sb.onclick = function () {
        var title = SW.$('.gz-trt', pop).value.trim(); if (!title) { SW.$('.gz-trt', pop).focus(); return; }
        var t = { title: title, note: SW.$('.gz-trn', pop).value.trim(), where: info.where || '', mode: info.mode, v: info.v, cmp: info.cmp || null, split: !!info.split, vids: vids, names: {}, marks: {} };
        vids.forEach(function (v) { t.names[v] = ((SW.store.get(NS + 'names', {}) || {})[v]) || {}; t.marks[v] = ((SW.store.get(NS + 'marks', {}) || {})[v]) || {}; });
        sb.disabled = true;
        SW.notes.tracings.save(t).then(function () { SW.toast('Tracing “' + title + '” shared with the crew', 4000); list(); SW.$('.gz-trt', pop).value = ''; SW.$('.gz-trn', pop).value = ''; sb.disabled = false; },
          function (er) { sb.disabled = false; if (er.message !== 'no initials') SW.toast(er.message, 6000); });
      };
    });
  }
  function gzMarkSet(box, m) { SW.$$('.gz-mk', box).forEach(function (x) { var on = x.dataset.mark === m; x.classList.toggle('on', on); x.setAttribute('aria-pressed', on); }); }
  // the mark's bar, clipped to the box's own outline (rounded for the start)
  var gzMkN = 0;
  function gzMarkBar(m, x, y, w, h, rx) {
    if (!m) return '';
    var id = 'gzmk' + (++gzMkN);
    return '<clipPath id="' + id + '"><rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="' + rx + '"/></clipPath><rect x="' + x + '" y="' + y + '" width="6" height="' + h + '" fill="' + gzMarkHex(m) + '" clip-path="url(#' + id + ')"/>';
  }
  // A block or routine's heading: your name for it, its own label beside it in grey brackets
  function gzTitle(nm, real) { return nm ? SW.esc(nm) + ' <span class="gz-real">(' + SW.esc(real) + ')</span>' : SW.esc(real); }
  // in a graph box: the name cut to the room left beside the time (the box's own label goes on its second line)
  function gzFit(name, room) { var n = Math.max(3, Math.floor(room / 7.2)); return name.length > n ? name.slice(0, n - 1) + '…' : name; }
  function gzNameField(cur, label) { return '<label class="gz-name" title="Your name for it, kept in this browser and shown in the graph in place of ' + SW.esc(label) + '">Name <input type="text" maxlength="40"' + (TR ? ' disabled' : '') + ' value="' + SW.esc(cur) + '" placeholder="' + SW.esc(label) + '"></label>'; }

  return {
    get open() { return TR; },
    close: function () { TR = null; },
    name: gzName, setName: gzSetName, mark: gzMark, setMark: gzSetMark, MARKS: GZ_MARKS, markHex: gzMarkHex,
    markField: gzMarkField, pen: gzPen, markCount: gzMarkCount, clearMarks: gzClearMarks, markTool: gzMarkTool,
    traceTool: gzTraceTool, traceOpen: gzTraceOpen, arrive: gzTraceArrive, wire: gzTraceWire, markSet: gzMarkSet,
    markBar: gzMarkBar, title: gzTitle, fit: gzFit, nameField: gzNameField, readOnly: gzRO
  };
  };
})(typeof window !== 'undefined' ? window : globalThis);
