/*
 * base.js - the bench's foundation: the SW object and its small helpers (elements, dates,
 * storage under the bench's prefix, events, toasts), the side panel, popovers and dialogs
 * closed from their backdrop, sorting tables, sharing and copying, the address bar's query,
 * Developer mode, gzip in base64, ghost matching, an annotation's earlier wordings, and
 * figures packed into an annotation's text. Loaded first, before config.js and the bench's core.js.
 * Part of bench-kit (github.com/critical-code-studies/bench-kit).
 */
(function (root) {
  'use strict';

  var SW = root.SW = root.SW || {};
  // the bench's settings (config.js), read when used: this file loads before them
  function BEN() { return SW.BENCH || {}; }

  SW.state = { v: null, tab: 'read', sel: null, b: null };
  SW.views = {};
  // The kit's own version, raised with each release (CHANGELOG.md), shown in the About box (about.js)
  SW.KIT = { version: '0.24.2', url: 'https://github.com/critical-code-studies/bench-kit' };
  // The bench's version: the ?v= on the script tags in index.html (set there for every
  // script), shown beside the title and recorded in exports.
  SW.VERSION = ((document.currentScript && /[?&]v=([^&#]+)/.exec(document.currentScript.src)) || [])[1] || 'dev';
  var verEl = document.getElementById('bench-ver');
  if (verEl) { verEl.textContent = 'v' + SW.VERSION; verEl.title = 'Research bench version ' + SW.VERSION; }

  // ---------- small helpers ----------
  SW.$ = function (sel, el) { return (el || document).querySelector(sel); };
  SW.$$ = function (sel, el) { return Array.prototype.slice.call((el || document).querySelectorAll(sel)); };
  // A rating out of three as a row of stars: gold up to the average (rounded), the rest dim
  SW.stars = function (avg, title) {
    var n = Math.max(0, Math.min(3, Math.round(avg || 0)));
    return '<span class="sw-stars"' + (title ? ' title="' + SW.esc(title) + '"' : '') + ' aria-label="' + (Math.round((avg || 0) * 10) / 10) + ' of 3 stars">' + '<b>' + '★'.repeat(n) + '</b>' + '<i>' + '★'.repeat(3 - n) + '</i></span>';
  };
  SW.esc = function (s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  };
  SW.el = function (tag, attrs, html) {
    var e = document.createElement(tag);
    if (attrs) for (var k in attrs) {
      if (k === 'class') e.className = attrs[k];
      else if (k.slice(0, 2) === 'on') e.addEventListener(k.slice(2), attrs[k]);
      else e.setAttribute(k, attrs[k]);
    }
    if (html != null) e.innerHTML = html;
    return e;
  };
  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  SW.fmtDate = function (iso) {
    if (!iso) return '';
    var d = new Date(iso);
    if (isNaN(d)) return iso;
    return d.getDate() + ' ' + MONTHS[d.getMonth()] + ' ' + d.getFullYear();
  };
  SW.today = function () { return new Date().toISOString().slice(0, 10); };
  SW.slug = function (s) { return String(s).toLowerCase().replace(/[^a-z0-9.]+/g, '-').replace(/^-|-$/g, ''); };

  // ---------- storage (always guarded), under the bench's prefix (SW.BENCH.store) ----------
  function pre() { return BEN().store || 'bench.'; }
  SW.store = {
    get: function (k, d) {
      try { var v = localStorage.getItem(pre() + k); return v == null ? d : JSON.parse(v); }
      catch (e) { return d; }
    },
    set: function (k, v) {
      try { localStorage.setItem(pre() + k, JSON.stringify(v)); } catch (e) { /* ignore */ }
    }
  };

  // A draggable divide between the first and last columns of a three-column
  // grid (left, divide, right); the width is kept under key, double-click resets.
  SW.dragSplit = function (wrap, split, key, minL, minR) {
    minL = minL || 200; minR = minR || 240;
    split.classList.add('split-v'); split.setAttribute('role', 'separator'); split.setAttribute('aria-orientation', 'vertical');
    split.title = 'Drag to resize; double-click to reset';
    function set(w) { wrap.style.gridTemplateColumns = w ? Math.round(w) + 'px 6px minmax(0, 1fr)' : ''; }
    set(SW.store.get(key, 0));
    split.addEventListener('pointerdown', function (e) {
      e.preventDefault(); split.setPointerCapture(e.pointerId); split.classList.add('on');
      var x0 = wrap.getBoundingClientRect().left, max = wrap.clientWidth - minR, w = 0;
      function mv(ev) { w = Math.max(minL, Math.min(max, ev.clientX - x0)); set(w); window.dispatchEvent(new Event('resize')); }
      function up() { split.removeEventListener('pointermove', mv); split.removeEventListener('pointerup', up); split.classList.remove('on'); if (w) SW.store.set(key, Math.round(w)); }
      split.addEventListener('pointermove', mv); split.addEventListener('pointerup', up);
    });
    split.addEventListener('dblclick', function () { SW.store.set(key, 0); set(0); window.dispatchEvent(new Event('resize')); });
  };
  SW.me = function () {
    return { initials: SW.store.get('initials', ''), name: SW.store.get('name', '') };
  };

  // ---------- events ----------
  var handlers = {};
  SW.on = function (ev, fn) { (handlers[ev] = handlers[ev] || []).push(fn); };
  SW.emit = function (ev, data) { (handlers[ev] || []).forEach(function (fn) { fn(data); }); };

  // ---------- toast / status ----------
  var toastTimer;
  // act: {label, fn}, a button in the toast (Undo)
  SW.toast = function (msg, ms, act) {
    var t = SW.$('#toast');
    t.textContent = msg;
    t.classList.toggle('act', !!act);
    if (act) {
      var b = SW.el('button', { class: 'btn ghost toast-act' }, SW.esc(act.label));
      b.onclick = function () { t.classList.remove('on'); act.fn(); };
      t.appendChild(b);
    }
    t.classList.add('on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove('on'); }, ms || (act ? 6000 : 2600));
  };
  SW.status = function (msg) { SW.$('#status').textContent = msg || ''; };

  // Share a link: the system's share sheet where the browser has one (Mail, Messages…), else the link copied.
  // A local address becomes the public one.
  SW.share = function (o) {
    var url = String(o.url || location.href).replace(/[?&]nc=\d+/, '');
    var m = /\/research\/(?:index\.html)?(\?.*)?$/.exec(url); if (m && url.indexOf(SW.BASE_URI) !== 0) url = SW.BASE_URI + (m[1] || '');
    var d = { title: o.title || document.title, text: o.text || '', url: url };
    if (navigator.share && (!navigator.canShare || navigator.canShare(d))) return navigator.share(d).catch(function (e) { if (e && e.name !== 'AbortError') SW.copyText(url, 'the link'); });
    SW.copyText(url, 'the link');
  };
  SW.SHARE_ICON = '<svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" style="vertical-align:-2px"><path d="M8 1.5v8M5 4.5l3-3 3 3M3.5 7.5v6h9v-6" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  // Copy text; where the clipboard API is refused, through a selected textarea.
  SW.copyText = function (t, what) {
    function old() {
      var ta = SW.el('textarea', { style: 'position:fixed;left:-9999px' }); ta.value = t;
      (document.querySelector('dialog[open]') || document.body).appendChild(ta); ta.select();
      var ok = false; try { ok = document.execCommand('copy'); } catch (e) {}
      ta.remove(); SW.toast(ok ? 'Copied ' + (what || '') : 'Could not copy');
    }
    (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(function () { SW.toast('Copied ' + (what || t)); }, old);
  };
  document.addEventListener('click', function (e) {
    var c = e.target.closest('[data-copy]'); if (!c) return;
    e.preventDefault(); e.stopPropagation();
    var t = c.dataset.copy;
    (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(function () { SW.toast('Copied ' + t); }, function () { window.prompt('Copy:', t); });
  }, true);

  SW.permalink = function (params) {
    var q = [];
    for (var k in params) if (params[k] != null && params[k] !== '') q.push(k + '=' + encodeURIComponent(params[k]));
    return SW.BASE_URI + (q.length ? '?' + q.join('&') : '');
  };
  SW.versionURI = function (id) { return SW.BASE_URI + '?v=' + encodeURIComponent(id); };

  // ---------- routing ----------
  SW.readQuery = function () {
    var q = {};
    location.search.replace(/^\?/, '').split('&').forEach(function (kv) {
      if (!kv) return;
      var i = kv.indexOf('=');
      q[decodeURIComponent(i < 0 ? kv : kv.slice(0, i))] = i < 0 ? '' : decodeURIComponent(kv.slice(i + 1));
    });
    return q;
  };
  SW.writeQuery = function (extra) {
    var s = SW.state, q = { v: s.v, tab: s.tab !== 'read' ? s.tab : null };
    if (s.b && (s.tab === 'compare')) q.b = s.b;
    if (s.tab === 'analyse' && SW.anLens) q.lens = SW.anLens();
    if (s.tab === 'analyse' && SW.gzQuery) { var gq = SW.gzQuery(); for (var gk in gq) q[gk] = gq[gk]; }
    if (s.tab === 'graphics' && SW.gfxItem) q.g = SW.gfxItem();
    if (s.sel && s.tab === 'read') q.l = s.sel.p + ':' + s.sel.n0 + (s.sel.n1 !== s.sel.n0 ? '-' + s.sel.n1 : '');
    for (var k in extra || {}) q[k] = extra[k];
    var parts = [];
    for (var k2 in q) if (q[k2] != null && q[k2] !== '') parts.push(k2 + '=' + encodeURIComponent(q[k2]));
    try { history.replaceState(null, '', '?' + parts.join('&')); } catch (e) { /* file: urls */ }
  };

  // ---------- drawer and popover ----------
  // The side panel. Closing it minimises it to a tab at the foot of the screen,
  // which brings it back with its contents as they were.
  SW.drawer = function (title, html) {
    document.body.classList.remove('drawer-wide');
    delete SW.$('#drawer-body').dataset.notes;
    delete SW.$('#drawer-body').dataset.panel;
    SW.$('#drawer-title').textContent = title;
    var body = SW.$('#drawer-body');
    if (typeof html === 'string') body.innerHTML = html; else { body.innerHTML = ''; body.appendChild(html); }
    document.body.classList.add('drawer-open');
    var dk = SW.$('#drawer-dock');
    if (dk) dk.classList.remove('on');
    return body;
  };
  SW.closeDrawer = function () {
    var wide = document.body.classList.contains('drawer-wide');
    document.body.classList.remove('drawer-open', 'drawer-wide');
    // An annotations panel is reopened from the Annotations tab (notes.js), which is always there.
    if (SW.$('#drawer-title').textContent === 'Annotations') { var d0 = SW.$('#drawer-dock'); if (d0) d0.classList.remove('on'); return; }
    var dock = SW.$('#drawer-dock');
    if (!dock) {
      dock = SW.el('button', { id: 'drawer-dock', class: 'drawer-dock', title: 'Show the side panel again' });
      document.body.appendChild(dock);
      dock.onclick = function () {
        document.body.classList.add('drawer-open');
        if (dock.dataset.wide === '1') document.body.classList.add('drawer-wide');
        dock.classList.remove('on');
      };
    }
    dock.dataset.wide = wide ? '1' : '';
    dock.textContent = '▴ ' + (SW.$('#drawer-title').textContent || 'Side panel');
    dock.classList.add('on');
  };

  var popEl = null;
  SW.pop = function (x, y, html) {
    SW.unpop();
    popEl = SW.el('div', { class: 'pop' }, html);
    document.body.appendChild(popEl);
    var r = popEl.getBoundingClientRect();
    var left = Math.min(x, window.innerWidth - r.width - 10), top = y + 14;
    if (top + r.height > window.innerHeight - 10) top = Math.max(10, y - r.height - 10);
    popEl.style.left = Math.max(10, left) + 'px';
    popEl.style.top = top + 'px';
    return popEl;
  };
  SW.unpop = function () { if (popEl) { popEl.remove(); popEl = null; } };
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') SW.unpop(); });
  document.addEventListener('mousedown', function (e) { if (popEl && !popEl.contains(e.target)) SW.unpop(); });
  // Toolbar drop-down menus (<details class="menu">) close on a click elsewhere.
  document.addEventListener('mousedown', function (e) {
    SW.$$('details.menu[open]').forEach(function (d) { if (!d.contains(e.target)) d.open = false; });
  });

  // A click on a modal's backdrop closes it. Both ends of the click must fall
  // outside the box, so a text selection dragged out of a field does not.
  function outside(d, e) {
    var r = d.getBoundingClientRect();
    return e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom;
  }
  var downOnBackdrop = null;
  document.addEventListener('mousedown', function (e) {
    downOnBackdrop = e.target.tagName === 'DIALOG' && e.target.open && outside(e.target, e) ? e.target : null;
  });
  // A dialog marked data-keep (the note) stays open while it holds text: the
  // click shakes it and shows its .keep-hint instead.
  document.addEventListener('click', function (e) {
    var d = e.target;
    if (d === downOnBackdrop && d.open && outside(d, e)) {
      var held = d.hasAttribute('data-keep') &&
        SW.$$('textarea, input:not([type]), input[type="text"]', d).some(function (x) { return x.value.trim(); });
      if (!held) d.close();
      else {
        d.classList.remove('nudge'); void d.offsetWidth; d.classList.add('nudge');
        var k = SW.$('.keep-hint', d); if (k) k.hidden = false;
        var f = SW.$('textarea', d); if (f) f.focus();
      }
    }
    downOnBackdrop = null;
  });

  // A table (array of rows) sorted by clicking headers.
  SW.table = function (head, rows, opts) {
    opts = opts || {};
    var t = SW.el('table', { class: 'data' });
    var sortCol = -1, asc = true;
    function render() {
      var h = '<thead><tr>' + head.map(function (c, i) {
        return '<th data-i="' + i + '">' + SW.esc(c) + (i === sortCol ? (asc ? ' ▲' : ' ▼') : '') + '</th>';
      }).join('') + '</tr></thead><tbody>';
      h += rows.map(function (r, ri) {
        return '<tr data-r="' + ri + '">' + r.map(function (c, i) {
          var cls = (opts.cls && opts.cls[i]) || '';
          var v = c && typeof c === 'object' && 'html' in c ? c.html : SW.esc(c);
          return '<td class="' + cls + '">' + v + '</td>';
        }).join('') + '</tr>';
      }).join('') + '</tbody>';
      t.innerHTML = h;
    }
    t.addEventListener('click', function (e) {
      var th = e.target.closest('th');
      if (th) {
        var i = +th.dataset.i;
        asc = sortCol === i ? !asc : true;
        sortCol = i;
        rows.sort(function (a, b) {
          var x = a[i], y = b[i];
          if (x && typeof x === 'object') x = x.sort != null ? x.sort : x.html;
          if (y && typeof y === 'object') y = y.sort != null ? y.sort : y.html;
          if (typeof x === 'number' && typeof y === 'number') return asc ? x - y : y - x;
          return asc ? String(x).localeCompare(String(y)) : String(y).localeCompare(String(x));
        });
        render();
        return;
      }
      var tr = e.target.closest('tr[data-r]');
      if (tr && opts.onRow) opts.onRow(rows[+tr.dataset.r], e);
    });
    render();
    t.getRows = function () { return rows; };
    return t;
  };

  // Plain text of a table for export.
  SW.tableBlock = function (caption, head, rows) {
    return { type: 'table', caption: caption, head: head, rows: rows.map(function (r) {
      return r.map(function (c) {
        if (c && typeof c === 'object') return c.text != null ? String(c.text) : String(c.html).replace(/<[^>]+>/g, '');
        return String(c == null ? '' : c);
      });
    }) };
  };

  // A string gzipped and base64'd, and back (for My notes kept on Hypothesis).
  SW.gz = {
    pack: function (str) {
      if (!root.CompressionStream) return Promise.reject(new Error('This browser cannot compress.'));
      return new Response(new Blob([new TextEncoder().encode(str)]).stream().pipeThrough(new CompressionStream('gzip'))).arrayBuffer().then(function (buf) {
        var b = new Uint8Array(buf), bin = '';
        for (var i = 0; i < b.length; i += 0x8000) bin += String.fromCharCode.apply(null, b.subarray(i, i + 0x8000));
        return btoa(bin);
      });
    },
    unpack: function (b64) {
      var bin = atob(b64), b = new Uint8Array(bin.length);
      for (var i = 0; i < bin.length; i++) b[i] = bin.charCodeAt(i);
      return new Response(new Blob([b]).stream().pipeThrough(new DecompressionStream('gzip'))).text();
    }
  };

  // ---------- ghosts: where a block of lines from one version sits in another ----------
  // src and here: arrays of { k } (line keys); index: key -> positions in here.
  // The start in here of src[s0..s1], where most of its lines match in order
  // (at least 60% of the non-blank ones), two lines either side counting as
  // context; -1 when none is good enough, or a single common line has no context.
  SW.ghostMatch = function (src, s0, s1, here, index) {
    var len = s1 - s0 + 1, best = null, cands = {}, need = 0, i, q;
    for (i = s0; i <= s1; i++) {
      var k = src[i].k; if (!k) continue;
      need++;
      (index[k] || []).forEach(function (j) { var st = j - (i - s0); if (st >= 0 && st + len <= here.length) cands[st] = 1; });
    }
    if (!need) return -1;
    Object.keys(cands).forEach(function (st) {
      st = +st;
      var hit = 0, ctx = 0;
      for (q = 0; q < len; q++) if (src[s0 + q].k && src[s0 + q].k === here[st + q].k) hit++;
      for (q = 1; q <= 2; q++) {
        if (s0 - q >= 0 && st - q >= 0 && src[s0 - q].k && src[s0 - q].k === here[st - q].k) ctx++;
        if (s1 + q < src.length && st + len - 1 + q < here.length && src[s1 + q].k && src[s1 + q].k === here[st + len - 1 + q].k) ctx++;
      }
      var score = hit + ctx * 0.5;
      if (!best || score > best.score) best = { st: st, hit: hit, ctx: ctx, score: score };
    });
    if (!best || best.hit < Math.max(1, Math.ceil(need * 0.6))) return -1;
    if (need === 1 && best.ctx === 0 && (index[src[s0].k] || []).length > 1) return -1;
    return best.st;
  };
  // ---------- an annotation's hidden marks ----------
  // Closing lines <!-- bk:… -->, and before bench-kit 0.5.0
  // under the bench's own prefix (SW.BENCH.tag: sh:, sw:), still read. rest follows the prefix.
  SW.markRE = function (rest, flags) {
    var t = String(BEN().tag || '').replace(/\W/g, '');
    return new RegExp('\\n*<!-- (?:' + (t && t !== 'bk' ? t + '|' : '') + 'bk):' + rest, flags || '');
  };

  // ---------- earlier wordings of an annotation ----------
  // When a note is edited, the wording it replaces is kept in the note itself, on
  // a closing line <!-- bk:was DATE BASE64 --> (before any figure), so the record
  // travels with the note in Hypothesis. Hidden wherever the note is shown.
  function b64(s) { return btoa(unescape(encodeURIComponent(s))); }
  function unb64(s) { try { return decodeURIComponent(escape(atob(s))); } catch (e) { return ''; } }
  function WAS() { return SW.markRE('was (\\S+) ([A-Za-z0-9+\\/=]+) -->', 'g'); }
  SW.noteHistory = {
    visible: function (t) { return String(t || '').replace(SW.markRE('[\\s\\S]*?-->', 'g'), '').replace(/\s+$/, ''); },
    list: function (t) { var out = [], m, re = WAS(); while ((m = re.exec(String(t || '')))) out.push({ date: m[1], text: unb64(m[2]) }); return out; },
    wasLines: function (t) { return (String(t || '').match(WAS()) || []).map(function (x) { return '\n\n' + x.replace(/^\n+/, ''); }).join(''); },
    was: function (text, date) { return '\n\n<!-- bk:was ' + (date || new Date().toISOString()) + ' ' + b64(text) + ' -->'; },
    fig: function (t) { var m = SW.markRE('fig:gz [A-Za-z0-9+\\/=]+ -->\\s*$').exec(String(t || '')); return m ? '\n\n' + m[0].replace(/^\s+/, '') : ''; },
    // the full text to store: the new wording, earlier ones (with the one replaced), a figure last
    compose: function (newText, oldFull, oldDate) {
      var H = SW.noteHistory, vNew = H.visible(newText), vOld = H.visible(oldFull);
      return vNew + H.wasLines(oldFull) + (vOld && vNew !== vOld ? H.was(vOld, oldDate) : '') + (H.fig(newText) || H.fig(oldFull));
    }
  };

  // ---------- Developer mode (⚙) ----------
  // For the team: shows annotations marked Developer only, and features still
  // being built. A feature in progress checks SW.dev(), or its markup takes the
  // class dev-only, shown only while body has dev-on.
  SW.dev = function () { return !!SW.store.get('dev', false); };
  SW.applyDev = function () { document.body.classList.toggle('dev-on', SW.dev()); };
  // once the page's scripts have run (config.js, with the storage prefix, loads after this file)
  document.addEventListener('DOMContentLoaded', SW.applyDev);

  // A figure carried in an annotation's text: the SVG gzipped and base64'd on
  // one closing line, <!-- bk:fig:gz ... -->. Shown as an <img>, so markup
  // from someone else's finding is never run.
  SW.figpack = {
    re: function () { return SW.markRE('fig:gz ([A-Za-z0-9+\\/=]+) -->\\s*$'); },
    pack: function (svg) {
      var bytes = new TextEncoder().encode(svg);
      if (!root.CompressionStream) return Promise.resolve('');
      var cs = new Blob([bytes]).stream().pipeThrough(new CompressionStream('gzip'));
      return new Response(cs).arrayBuffer().then(function (buf) {
        var b = new Uint8Array(buf), bin = '';
        for (var i = 0; i < b.length; i += 0x8000) bin += String.fromCharCode.apply(null, b.subarray(i, i + 0x8000));
        return '\n\n<!-- bk:fig:gz ' + btoa(bin) + ' -->';
      });
    },
    split: function (text) { var m = SW.figpack.re().exec(String(text || '')); var H = SW.noteHistory; return m ? { text: H.visible(String(text).slice(0, m.index)), b64: m[1] } : { text: H.visible(text), b64: null }; },
    unpack: function (b64) {
      if (!root.DecompressionStream) return Promise.reject(new Error('This browser cannot open the figure.'));
      var bin = atob(b64), b = new Uint8Array(bin.length);
      for (var i = 0; i < bin.length; i++) b[i] = bin.charCodeAt(i);
      return new Response(new Blob([b]).stream().pipeThrough(new DecompressionStream('gzip'))).text();
    },
    img: function (svg, cls) { return '<img class="' + (cls || '') + '" alt="Figure" src="data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg) + '">'; },
    big: function (svg, title) {
      var d = SW.el('dialog', { class: 'tray-big' });
      d.innerHTML = '<div class="tray-bighead"><b>' + SW.esc(title || 'Figure') + '</b><button class="icon-btn" data-x title="Close (Esc)">✕</button></div><div class="tray-fig">' + SW.figpack.img(svg, 'fig-full') + '</div>';
      document.body.appendChild(d);
      d.addEventListener('click', function (e) { if (e.target === d || e.target.closest('[data-x]')) { d.close(); d.remove(); } });
      d.addEventListener('close', function () { d.remove(); });
      d.showModal();
    }
  };
})(this);
