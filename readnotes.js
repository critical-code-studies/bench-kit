/*
 * readnotes.js - annotations in Read: threads under their lines or as cards in the margin,
 * ghosts (annotations from other versions on the lines here that match), the code an
 * annotation is attached to, how notes show (inline, margin, initials, hidden) with a live
 * refresh, the selection (its bar and the pop by a text selection: annotate, finding, cite,
 * link, export, figure, My notes), the listing as a document, and moving an annotation by
 * dragging it onto other lines.
 *
 * var K = SW.readNotes({ view, R, opts, isMine, showsTape, filtering, keptLines, tapeInfo,
 *   kinBar, selActs });   // the bench's Read: its element, its view object, its options and its own parts
 * K.set({ build: b }) when a version is drawn; K.set({ notes: all }) when its notes are read.
 * Part of bench-kit (github.com/critical-code-studies/bench-kit).
 */
(function (root) {
  'use strict';
  var SW = root.SW;

  SW.readNotes = function (X) {
    var N = SW.notes, view = X.view, R = X.R, opts = X.opts;
    var build = null, notes = [];
    var isMine = X.isMine, showsTape = X.showsTape, filtering = X.filtering, keptLines = X.keptLines, tapeInfo = X.tapeInfo;
    function kinBar() { if (X.kinBar) X.kinBar(); }
    function marginOn() { return opts.notes === 'margin'; }

    // ---------- notes in the margin ----------
    // Each thread as a card beside the line it starts on; cards that would
    // overlap are pushed down. Replies open under a card with its + button.
    var openCards = {}, marginTimer = null, marginStale = false;
    // One thread: its first note, a + for its replies, the replies when open.
    // The same block is an inline note or a margin card (cls).
    function threadBlock(t, cls) {
      if (t.ghost) return ghostBlock(t, cls);
      var a = t.note.anchor, nrep = 0, open = !!openCards[t.note.id], h = '';
      (function walk(rs) { rs.forEach(function (r) { nrep++; walk(r.replies); }); })(t.replies);
      if (open) (function walk(rs) { rs.forEach(function (r) { h += N.renderNote(r.note, true, r.reactions); walk(r.replies); }); })(t.replies);
      var isBlock = a.n1 > a.n0 || a.c0 != null, shut = !!cardFold()[t.note.id];
      return '<div class="' + cls + (open ? ' open' : '') + (isBlock ? ' blockn' : '') + (shut ? ' nfold' : '') + (t.note.source === 'draft' ? ' draft' : '') + '" data-tid="' + SW.esc(t.note.id) + '" data-p="' + a.p + '" data-n0="' + a.n0 + '" data-n1="' + a.n1 + '">' +
        '<button type="button" class="card-fold" aria-expanded="' + !shut + '" title="' + (shut ? 'Unfold this annotation' : 'Fold this annotation away (for you; kept in this browser)') + '">' + (shut ? '▸' : '▾') + '</button>' +
        (N.mine(t.note) ? '<span class="mc-grip" draggable="true" title="Drag onto another line to move this annotation there">⠿</span>' : '') +
        '<div class="mc-where">' + (N.hasCode(t.note) ? '<button type="button" class="cf-tog" aria-expanded="' + !N.codeFolded(t.note.id) + '" title="Show or hide the code">' + (N.codeFolded(t.note.id) ? '▸' : '▾') + ' Code</button>' : 'Code') +
          ' · <button type="button" class="cf-lines" title="Select the lines">' + (a.n1 !== a.n0 ? 'lines ' + a.n0 + '–' + a.n1 : 'line ' + a.n0) + '</button></div>' +
        N.renderNote(t.note, false, t.reactions) +
        (nrep ? '<button class="mc-more" data-more="1" title="' + (open ? 'Hide the replies' : 'Show the replies') + '">' + (open ? '−' : '+') + ' ' + nrep + ' repl' + (nrep === 1 ? 'y' : 'ies') + '</button>' : '') +
        (open ? '<div class="mc-replies">' + h + '</div>' : '') + '</div>';
    }
    // The threads to show: anchored on a tape shown, on a line left by the notes filter.
    function shownThreads() {
      var keep = filtering() ? keptLines() : null;
      if (opts.show === 'none') return [];
      return N.threads(notes).concat(opts.ghosts ? ghosts : []).filter(function (t) {
        var a = t.note.anchor;
        if (!a || !showsTape(a.p)) return false;
        if (opts.show === 'mine' && !isMine(t.ghost ? t.note.ghostOf : t.note)) return false;
        if (opts.show === 'open' && (t.ghost || !N.isOpen(N.statusOf(t.reactions).state))) return false;
        if (keep && !keep[a.p + ':' + a.n0]) return false;
        return !!SW.$('#L' + a.p + '-' + a.n0, view);
      });
    }
    function paintNotes() { paintInline(); paintMargin(); paintBlocks(); }

    // ---------- ghosts: annotations from other versions, on the lines here that match ----------
    // Each annotated block of another version is looked for here by its lines' text
    // (spacing and comments ignored, blank lines not counted), with two lines either
    // side as context; it is placed where most of its lines match, in order. Shown
    // faint, read-only: Open goes to the original, Keep here copies it into this
    // version with a link back. A note kept here is not shown as a ghost while
    // its copy stands; bin the copy and the ghost comes back.
    var ghosts = [], ghostKey = '', keptNow = {};   // keptNow: copies made this session ({ id, at }), while Hypothesis indexes them
    var lineKey = SW.lineKey;
    function flat(b) {
      var out = [];
      b.lines.forEach(function (ls, p) { ls.forEach(function (L) { out.push({ p: p, n: L.n, k: lineKey(L.norm || L.raw) }); }); });
      return out;
    }
    function placeHere(srcFlat, s0, s1, here, index) {
      var st = SW.ghostMatch(srcFlat, s0, s1, here, index);
      if (st < 0) return null;
      var a = here[st], z = here[st + s1 - s0];
      if (a.p !== z.p) return null;
      return { p: a.p, n0: a.n, n1: z.n, src: (build.parts[a.p] || {}).src || '' };
    }
    var ghostAt = 0;
    function loadGhosts(lazy) {
      if (!opts.ghosts || !build) { ghosts = []; ghostKey = ''; return Promise.resolve(); }
      var b0 = build;
      if (lazy && ghostKey === b0.v.id && Date.now() - ghostAt < 60000) return Promise.resolve();   // the regular refresh: at most once a minute
      ghostKey = b0.v.id; ghostAt = Date.now();
      return N.listAll().then(function (all) {
        var here = flat(b0), index = {};
        here.forEach(function (x, j) { if (x.k) (index[x.k] = index[x.k] || []).push(j); });
        var kept = {};
        // the originals kept here: by the copy's from tag, or (older copies) a carried
        // copy's link back; a plain link to a note does not count
        all.forEach(function (n) {
          if (n.vid !== b0.v.id) return;
          if (n.from) kept[n.from] = 1;
          else if ((n.tags || []).indexOf('carried') >= 0) { var re = /[?&]a=([A-Za-z0-9_-]+)/g, m; while ((m = re.exec(String(n.text).replace(/\\([_\-])/g, '$1')))) kept[m[1]] = 1; }
        });
        Object.keys(keptNow).forEach(function (k) {   // a copy just made counts until the search has it, unless binned since
          var c = keptNow[k]; if (k.indexOf(b0.v.id + ':') !== 0) return;
          if (N.isGone(c.id) || Date.now() - c.at > 120000) delete keptNow[k]; else kept[k.slice(b0.v.id.length + 1)] = 1;
        });
        var byV = {};
        all.forEach(function (n) {
          // a copy kept from a ghost (tagged carried) is never a ghost itself: its original stands for it
          if (n.vid === b0.v.id || !n.anchor || n.parent || n.source === 'buildlog' || N.isReaction(n) || kept[n.id] || n.from || (n.tags || []).indexOf('carried') >= 0) return;
          (byV[n.vid] = byV[n.vid] || []).push(n);
        });
        var replies = {};
        all.forEach(function (n) { if (n.parent && !N.isReaction(n)) replies[n.parent] = (replies[n.parent] || 0) + 1; });
        return Promise.all(Object.keys(byV).map(function (vid) {
          return SW.build(vid).then(function (bv) {
            var src = flat(bv), at = {};
            src.forEach(function (x, j) { at[x.p + ':' + x.n] = j; });
            return byV[vid].map(function (n) {
              var a = n.anchor, s0 = at[a.p + ':' + a.n0], s1 = at[a.p + ':' + a.n1];
              if (s0 == null || s1 == null) return null;
              var pl = placeHere(src, s0, s1, here, index);
              if (!pl) return null;
              var g = Object.assign({}, n, { id: 'ghost-' + n.id, anchor: pl, source: 'ghost', ghostOf: n, nreplies: replies[n.id] || 0 });
              delete g.quote;
              return { note: g, replies: [], reactions: [], ghost: true };
            }).filter(Boolean);
          }, function () { return []; });
        })).then(function (lists) {
          if (build !== b0) return;
          ghosts = [].concat.apply([], lists);
        });
      });
    }
    function ghostBlock(t, cls) {
      var g = t.note, o = g.ghostOf, a = g.anchor, oa = o.anchor;
      var from = SW.refOf(o.vid, oa.p, oa.n0, oa.n1, SW.nparts(o.vid)), shut = !!cardFold()[g.id];
      return '<div class="' + cls + ' ghost' + (shut ? ' nfold' : '') + '" data-tid="' + SW.esc(g.id) + '" data-p="' + a.p + '" data-n0="' + a.n0 + '" data-n1="' + a.n1 + '">' +
        '<button type="button" class="card-fold" aria-expanded="' + !shut + '" title="' + (shut ? 'Unfold this annotation' : 'Fold this annotation away (for you; kept in this browser)') + '">' + (shut ? '▸' : '▾') + '</button>' +
        '<div class="mc-where">Code · ' + (a.n1 !== a.n0 ? 'lines ' + a.n0 + '–' + a.n1 : 'line ' + a.n0) + '</div>' +
        '<div class="note"><div class="by"><span class="ghost-tag" title="An annotation on another version, shown here on the matching lines">Ghost</span> <b>' + SW.esc(o.by) + '</b> · ' + SW.esc(SW.fmtDate(o.date)) + ' · from ' + SW.esc(from) + '</div>' +
        '<div class="nbody"><div class="body note-md">' + SW.md(SW.figpack.split(o.text).text) + '</div>' +
        (g.nreplies ? '<div class="hint">' + g.nreplies + ' repl' + (g.nreplies === 1 ? 'y' : 'ies') + ' there</div>' : '') + '</div>' +
        '<div class="acts"><a class="swlink" href="' + SW.esc(N.linkOf(o)) + '" title="Go to the original">Open in ' + SW.esc(SW.refOf(o.vid)) + '</a>' +
        '<span class="acts-right"><button data-keep-ghost="' + SW.esc(o.id) + '" title="Copy it into this version as an annotation of its own, on these lines, with a link back to the original">＋ Keep here</button></span></div></div></div>';
    }
    function keepGhost(id) {
      var t = ghosts.filter(function (x) { return x.note.ghostOf.id === id; })[0]; if (!t) return;
      var o = t.note.ghostOf, a = t.note.anchor, lines = build.lines[a.p].slice(a.n0 - 1, a.n1).map(function (L) { return L.raw; }).join('\n');
      N.create({ vid: build.v.id, kind: 'line', anchor: { p: a.p, n0: a.n0, n1: a.n1, src: a.src }, quote: lines,
                 text: o.text + '\n\nCarried from ' + N.linkOf(o), tags: (o.tags || []).concat(['carried']), from: o.id })
        .then(function (c) {
          keptNow[build.v.id + ':' + o.id] = { id: c && c.id, at: Date.now() };
          ghosts = ghosts.filter(function (x) { return x !== t; });
          SW.toast('Kept here, with a link back to the original. ↶ Undo (⌘Z) takes it away.', 5000);
        }, function (e) { if (e.message !== 'no initials') SW.toast(e.message, 5000); });
    }


    // ---------- the code an annotation is attached to ----------
    // Its lines bracketed in the listing (a bar down the side, from the first line
    // to the last), and a span within them marked; both brighten while the pointer
    // is on the annotation. A span is not marked in the normalised view on lines
    // that normalising changed.
    function wrapSpan(t, s, e, tid) {
      var nodes = [], w = document.createTreeWalker(t, NodeFilter.SHOW_TEXT), x, pos = 0;
      while ((x = w.nextNode())) nodes.push(x);
      nodes.forEach(function (nd) {
        var len = nd.nodeValue.length, a = Math.max(s, pos), b = Math.min(e, pos + len);
        if (a < b) {
          var piece = nd;
          if (a > pos) piece = piece.splitText(a - pos);
          if (b - a < piece.nodeValue.length) piece.splitText(b - a);
          var mk = SW.el('mark', { class: 'frag', 'data-tid': tid });
          piece.parentNode.insertBefore(mk, piece); mk.appendChild(piece);
        }
        pos += len;
      });
    }
    function paintBlocks() {
      SW.$$('mark.frag', view).forEach(function (m) { var pa = m.parentNode; while (m.firstChild) pa.insertBefore(m.firstChild, m); m.remove(); pa.normalize(); });
      SW.$$('.ln.blk', view).forEach(function (r) { r.classList.remove('blk', 'blk-top', 'blk-end', 'blk-b'); });
      if (opts.notes === 'hide') return;
      shownThreads().forEach(function (th) {
        if (th.ghost) return;
        var a = th.note.anchor, isBlock = a.n1 > a.n0 || a.c0 != null;
        for (var n = a.n0; n <= a.n1; n++) {
          var row = SW.$('#L' + a.p + '-' + n, view); if (!row) continue;
          row.classList.add('blk'); if (isBlock) row.classList.add('blk-b'); if (n === a.n0) row.classList.add('blk-top'); if (n === a.n1) row.classList.add('blk-end');
          var L = build.lines[a.p][n - 1];
          if (a.c0 == null || !L || (opts.norm && L.norm !== L.raw)) continue;
          var s = n === a.n0 ? a.c0 : 0, e = n === a.n1 ? a.c1 : L.raw.length;
          if (e > s && (s > 0 || e < L.raw.length)) wrapSpan(row.querySelector('.t'), s, e, th.note.id);
        }
      });
    }

    // ---------- notes inline ----------
    // Each thread under the last line it covers, in the listing itself.
    function paintInline() {
      var box = SW.$('.listing', view);
      if (!box) return;
      // Keep what is being typed: a refresh waits while a reply or edit is open.
      if (box.querySelector('.inote .reply-box, .inote .edit-box')) return;
      SW.$$('.inote', box).forEach(function (x) { x.remove(); });
      var wrap = SW.$('.rd-body', view);
      if (wrap) { wrap.classList.toggle('with-inline', opts.notes === 'inline'); wrap.classList.toggle('notes-hidden', opts.notes === 'hide'); }
      if (opts.notes !== 'inline') return;
      var at = {}, order = [];
      shownThreads().forEach(function (t) {
        var a = t.note.anchor, row = SW.$('#L' + a.p + '-' + a.n1, view) || SW.$('#L' + a.p + '-' + a.n0, view);
        if (!at[row.id]) { at[row.id] = { row: row, ts: [] }; order.push(row.id); }
        at[row.id].ts.push(t);
      });
      order.forEach(function (id) {
        var g = at[id], el = SW.el('div', { class: 'inote' }), after = g.row;
        // cards ending on the same line: the narrower first, so a block's card comes last and closes it
        g.ts.sort(function (x, y) { return (y.note.anchor.n0 - x.note.anchor.n0) || String(x.note.date).localeCompare(String(y.note.date)); });
        el.innerHTML = g.ts.map(function (t) { return threadBlock(t, 'ithread'); }).join('');
        while (after.nextElementSibling && after.nextElementSibling.classList.contains('expansion')) after = after.nextElementSibling;
        after.insertAdjacentElement('afterend', el);
      });
      N.wire(box, build.v.id, notes);
    }

    // ---------- notes in the margin ----------
    function paintMargin() {
      var wrap = SW.$('.rd-body', view), margin = SW.$('.note-margin', view);
      if (!wrap || !margin) return;
      wrap.classList.toggle('with-margin', marginOn());
      if (!marginOn()) { margin.innerHTML = ''; return; }
      if (!wrap.getClientRects().length) { marginStale = true; return; }
      // Keep what is being typed: a refresh waits while a reply or edit is open.
      if (margin.querySelector('.reply-box, .edit-box')) return;
      var ts = shownThreads();
      var top0 = wrap.getBoundingClientRect().top;
      var items = ts.map(function (t) {
        var a = t.note.anchor, row = SW.$('#L' + a.p + '-' + a.n0, view);
        return { t: t, y: row.getBoundingClientRect().top - top0 };
      }).sort(function (x, y) { return x.y - y.y; });
      margin.innerHTML = items.map(function (it) { return threadBlock(it.t, 'mcard'); }).join('');
      layoutMargin(items.map(function (it) { return it.y; }));
      N.wire(margin, build.v.id, notes);
    }
    function layoutMargin(ys) {
      var margin = SW.$('.note-margin', view);
      if (!margin) return;
      var cards = SW.$$('.mcard', margin), bottom = 0;
      if (!ys) {
        var wrap = SW.$('.rd-body', view), top0 = wrap.getBoundingClientRect().top;
        ys = cards.map(function (c) { var row = SW.$('#L' + c.dataset.p + '-' + c.dataset.n0, view); return row ? row.getBoundingClientRect().top - top0 : 0; });
      }
      cards.forEach(function (c, i) {
        var y = Math.max(ys[i], bottom + 6);
        c.style.top = y + 'px';
        c.classList.toggle('pushed', y - ys[i] > 12);
        bottom = y + c.offsetHeight;
      });
      margin.style.minHeight = bottom + 'px';
    }
    function linesLit(c, on) {
      for (var n = +c.dataset.n0; n <= +c.dataset.n1; n++) {
        var r = SW.$('#L' + c.dataset.p + '-' + n, view);
        if (r) r.classList.toggle('mlit', on);
      }
      SW.$$('mark.frag[data-tid="' + c.dataset.tid + '"]', view).forEach(function (m) { m.classList.toggle('lit', on); });
    }
    // A click on a thread's + or its line reference (inline or card); true if handled.
    // cards folded away, by note, kept in this browser
    function cardFold() { return SW.store.get('read.cardFold', {}); }
    function threadClick(e) {
      var kg = e.target.closest('[data-keep-ghost]');
      if (kg) { keepGhost(kg.dataset.keepGhost); return true; }
      var cfb = e.target.closest('.card-fold');
      if (cfb) {
        var card = cfb.closest('.mcard, .ithread'), f = cardFold(), id = card.dataset.tid;
        if (f[id]) delete f[id]; else f[id] = true;
        SW.store.set('read.cardFold', f);
        card.classList.toggle('nfold', !!f[id]);
        cfb.textContent = f[id] ? '▸' : '▾'; cfb.setAttribute('aria-expanded', String(!f[id]));
        cfb.title = f[id] ? 'Unfold this annotation' : 'Fold this annotation away (for you; kept in this browser)';
        if (marginOn()) layoutMargin();
        return true;
      }
      var tog = e.target.closest('.cf-tog');
      if (tog) { var tc = tog.closest('.mcard, .ithread'); var shutNow = N.toggleCode(tc.dataset.tid); tog.textContent = (shutNow ? '▸' : '▾') + ' Code'; tog.setAttribute('aria-expanded', String(!shutNow)); if (marginOn()) layoutMargin(); return true; }
      var more = e.target.closest('[data-more]');
      if (more) {
        var c = more.closest('.mcard, .ithread');
        openCards[c.dataset.tid] = !openCards[c.dataset.tid];
        paintNotes();
        return true;
      }
      var w = e.target.closest('.mc-where');
      if (w) {
        var cw = w.closest('.mcard, .ithread');
        SW.state.sel = { p: +cw.dataset.p, n0: +cw.dataset.n0, n1: +cw.dataset.n1 };
        paintSel(); SW.writeQuery();
        return true;
      }
      return false;
    }
    function wireLit(el, sel) {
      el.addEventListener('mouseover', function (e) { var c = e.target.closest(sel); if (c) linesLit(c, true); });
      el.addEventListener('mouseout', function (e) { var c = e.target.closest(sel); if (c && !c.contains(e.relatedTarget)) linesLit(c, false); });
    }
    function wireMargin(margin) {
      margin.addEventListener('click', function (e) {
        threadClick(e);
        // a reply or edit box changes the card's height
        setTimeout(function () { layoutMargin(); }, 0);
      });
      margin.addEventListener('input', function () { layoutMargin(); });
      wireLit(margin, '.mcard');
    }
    // Clicking a noted line brings its note forward (inline or card) instead of the side panel.
    function threadFor(k) {
      var parts = k.split(':');
      return SW.$((marginOn() ? '.mcard' : '.ithread') + '[data-p="' + parts[0] + '"][data-n0="' + parts[1] + '"]', view);
    }

    // How notes show in Read, in the order the toolbar button cycles through them:
    // [mode, name, what it does, the button's icon].
    var MODES = [['inline', 'Under their lines', 'each annotation in the listing, under the last line it covers', '▤'],
                 ['margin', 'Cards in the margin', 'beside the lines, in a column on the right (a window 900px wide or more)', '▥'],
                 ['off', 'Initials only', 'at the line end; click them to read in the side panel', 'ᴬᴮ'],
                 ['hide', 'Hidden', 'no annotations, initials or tint in the listing', '⊘']];
    function modeOf(m) { return MODES.filter(function (x) { return x[0] === m; })[0] || MODES[0]; }
    function setNotes(m) {
      opts.notes = m;
      SW.store.set('read.notes', m);
      paintNotes(); live(); modeBtn();
    }
    function modeBtn() {
      var b = SW.$('#rd-notes-mode', view);
      if (!b) return;
      var i = MODES.indexOf(modeOf(opts.notes)), cur = MODES[i], next = MODES[(i + 1) % MODES.length];
      b.textContent = cur[3];
      b.title = 'Annotations: ' + cur[1].toLowerCase() + '. Click for ' + next[1].toLowerCase() + '.';
      b.classList.toggle('on', opts.notes !== 'hide');
    }

    // The ▴ Notes button, on Read: how notes show, and every note in the side panel.
    R.notesMenu = function (x, y) {
      var modes = MODES;
      var pop = SW.pop(x, y, '<h4>Annotations in Read</h4><div class="notes-menu">' + modes.map(function (m) {
        return '<button data-m="' + m[0] + '"' + (opts.notes === m[0] ? ' class="on"' : '') + ' title="' + SW.esc(m[2]) + '">' + (opts.notes === m[0] ? '● ' : '○ ') + m[1] + '</button>';
      }).join('') + '<hr><button data-m="panel">All annotations on this version…</button></div>');
      pop.addEventListener('click', function (e) {
        var b = e.target.closest('button[data-m]');
        if (!b) return;
        SW.unpop();
        if (b.dataset.m === 'panel') { N.openPanel(build.v.id); return; }
        setNotes(b.dataset.m);
      });
    };
    // Live: while notes show (inline or cards), fetch the group's notes every 20 seconds.
    function live() {
      clearInterval(marginTimer);
      var on = opts.notes === 'inline' || opts.notes === 'margin';
      if (!on || !N.configured()) return;
      marginTimer = setInterval(function () {
        if (!build || SW.state.tab !== 'read' || document.hidden) return;
        if (SW.$('.rd-body .reply-box, .rd-body .edit-box', view)) return;
        N.invalidate(build.v.id);
      }, 20000);
    }

    // ---------- selection ----------
    function paintSel() {
      if (opts.kinBar) setTimeout(kinBar, 0);   // the bar names the repair at or after the selection
      SW.$$('.ln.sel', view).forEach(function (e) { e.classList.remove('sel'); });
      var s = SW.state.sel, bar = SW.$('#rd-selbar', view);
      if (!s || !bar) { if (bar) bar.classList.remove('on'); return; }
      for (var n = s.n0; n <= s.n1; n++) { var e = SW.$('#L' + s.p + '-' + n, view); if (e) e.classList.add('sel'); }
      bar.classList.add('on');
      bar.innerHTML = '';   // the version and file are in the page title and part header; Copy citation gives the full form
      var acts = [
        ['✎ Annotate', annotateSel], ['❝ Copy citation', copyCite], ['🔗 Copy link', copyLink],
        ['⤓ Word', function () { exportSel('docx'); }], ['⤓ Markdown', function () { exportSel('md'); }],
        ['▣ Figure', figureSel], ['★ Finding', findingSel], ['＋ My notes', function () { listingDoc(build, SW.state.sel).then(function (d) { d.title = SW.cite(build, SW.state.sel.p, SW.state.sel.n0, SW.state.sel.n1); var s = SW.state.sel; SW.tray.addDoc(d, { anchor: { p: s.p, n0: s.n0, n1: s.n1, src: build.parts[s.p].src }, quote: quote() }); }); }]
      ].concat(build.doc && build.doc.some(Boolean) && SW.views.book ? [['📖 Book', function () { SW.setTab('book'); }]] : [], X.selActs ? X.selActs() : [], [['✕', function () { SW.state.sel = null; paintSel(); SW.writeQuery(); }]]);   // the bench's own (Breakpoint, Run to here) before ✕
      var s0 = SW.state.sel;
      if (s0) bar.appendChild(SW.el('span', { class: 'selref' }, SW.refTag(build.v.id, s0.p, s0.n0, s0.n1, build.parts.length)));
      acts.forEach(function (a) { bar.appendChild(SW.el('button', { class: 'btn', onclick: a[1] }, a[0])); });
    }
    function selLines() {
      var s = SW.state.sel;
      return build.lines[s.p].slice(s.n0 - 1, s.n1);
    }
    function quote() { return selLines().map(function (L) { return L.raw; }).join('\n'); }
    function annotateSel() {
      var s = SW.state.sel;
      N.dialog({ vid: build.v.id, kind: 'line', anchor: { p: s.p, n0: s.n0, n1: s.n1, src: build.parts[s.p].src },
                 quote: quote(), heading: 'Annotate', anchorText: SW.cite(build, s.p, s.n0, s.n1) });
    }
    // A finding: an annotation on these lines, tagged "finding", shown in Findings under your initials.
    function findingSel() {
      var s = SW.state.sel;
      N.dialog({ vid: build.v.id, kind: 'line', anchor: { p: s.p, n0: s.n0, n1: s.n1, src: build.parts[s.p].src }, tags: ['finding'],
                 quote: quote(), heading: 'Add a finding', anchorText: SW.cite(build, s.p, s.n0, s.n1) + '. Shared with the group and listed under Findings; the first line is its title.' });
    }
    // A text selection in the listing: a small bar by the mouse to copy the
    // lines, put them in My notes, or make them Read's selection.
    var selPop = null;
    function hideSelPop() { if (selPop) { selPop.remove(); selPop = null; } }
    document.addEventListener('mousedown', function (e) { if (selPop && !selPop.contains(e.target)) hideSelPop(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') hideSelPop(); });
    window.addEventListener('scroll', hideSelPop, true);
    document.addEventListener('mouseup', function (e) {
      if (selPop && selPop.contains(e.target)) return;
      setTimeout(function () {
        var sel = window.getSelection();
        if (!build || !sel || sel.isCollapsed || !String(sel).trim()) return;
        function lnOf(nd) { var el0 = nd && (nd.nodeType === 1 ? nd : nd.parentElement); return el0 && el0.closest('#view-read .listing .ln'); }
        var rg = sel.getRangeAt(0), la = lnOf(rg.startContainer), lf = lnOf(rg.endContainer);
        if (!la || !lf || la.dataset.p !== lf.dataset.p) return;
        var p = +la.dataset.p, n0 = +la.dataset.n, n1 = +lf.dataset.n;
        if (n1 < n0) { var sw0 = n0; n0 = n1; n1 = sw0; }
        var lines = build.lines[p].slice(n0 - 1, n1), text = lines.map(function (L) { return L.raw; }).join('\n'), cite = SW.cite(build, p, n0, n1);
        // where in the lines the selection starts and ends (characters of the source text)
        function charIn(row, nd, off, end) {
          var t = row.querySelector('.t'), len = (build.lines[p][+row.dataset.n - 1] || { raw: '' }).raw.length;
          if (!t) return end ? len : 0;
          if (t.contains(nd)) { var r = document.createRange(); r.setStart(t, 0); r.setEnd(nd, off); return Math.min(len, r.toString().length); }
          return t.compareDocumentPosition(nd) & Node.DOCUMENT_POSITION_PRECEDING ? 0 : len;
        }
        var c0 = charIn(la, rg.startContainer, rg.startOffset, false), c1 = charIn(lf, rg.endContainer, rg.endOffset, true);
        if (n1 > n0 && c0 >= lines[0].raw.length) { n0++; c0 = 0; lines = lines.slice(1); }
        if (n1 > n0 && c1 === 0) { n1--; lines = lines.slice(0, -1); c1 = lines[lines.length - 1].raw.length; }
        var normed = opts.norm && lines.some(function (L) { return L.norm !== L.raw; });
        var span = !normed && (c0 > 0 || c1 < lines[lines.length - 1].raw.length) && (n1 > n0 || c1 > c0);
        var exact = span ? (n0 === n1 ? lines[0].raw.slice(c0, c1) : [lines[0].raw.slice(c0)].concat(lines.slice(1, -1).map(function (L) { return L.raw; }), [lines[lines.length - 1].raw.slice(0, c1)]).join('\n')) : lines.map(function (L) { return L.raw; }).join('\n');
        cite = SW.cite(build, p, n0, n1);
        function annotateHere(finding) {
          var an = { p: p, n0: n0, n1: n1, src: build.parts[p].src };
          if (span) { an.c0 = c0; an.c1 = c1; }
          window.getSelection().removeAllRanges(); hideSelPop();
          var q1 = exact.replace(/\s+/g, ' ').trim();
          N.dialog({ vid: build.v.id, kind: 'line', anchor: an, quote: exact, tags: finding ? ['finding'] : [],
                     heading: finding ? 'Add a finding' : 'Annotate',
                     anchorText: cite + (span ? ': “' + (q1.length > 70 ? q1.slice(0, 70) + '…' : q1) + '”' : '') + (finding ? '. Shared with the group and listed under Findings; the first line is its title.' : '') });
        }
        hideSelPop();
        selPop = SW.el('div', { class: 'selpop' });
        selPop.appendChild(SW.el('span', { class: 'hint' }, 'l. ' + n0 + (n1 > n0 ? '–' + n1 : '') + ' ' + SW.refTag(build.v.id, p, n0, n1, build.parts.length)));
        selPop.appendChild(SW.el('button', { class: 'btn', title: span ? 'Annotate the selected code: the annotation is attached to exactly this, and it is marked in the listing' : 'Annotate these lines', onclick: function () { annotateHere(false); } }, '✎ Annotate'));
        selPop.appendChild(SW.el('button', { class: 'btn ghost', title: 'A finding on the selected code, shared with the group and listed under Findings', onclick: function () { annotateHere(true); } }, '★ Finding'));
        selPop.appendChild(SW.el('button', { class: 'btn ghost', title: 'Copy these lines of source (without numbers or addresses)', onclick: function () { copy(text, (n1 - n0 + 1) + ' line' + (n1 > n0 ? 's' : '') + ' copied'); hideSelPop(); } }, 'Copy'));
        selPop.appendChild(SW.el('button', { class: 'btn ghost', title: 'Put these lines in My notes (private), with their citation', onclick: function () {
          var s0 = { p: p, n0: n0, n1: n1 };
          listingDoc(build, s0).then(function (d) { d.title = cite; SW.tray.addDoc(d, { anchor: { p: p, n0: n0, n1: n1, src: build.parts[p].src }, quote: text }); });
          hideSelPop();
        } }, '＋ My notes'));
        selPop.appendChild(SW.el('button', { class: 'btn ghost', title: 'Make these lines Read’s selection, for the bar with Annotate, Finding, Cite and the rest', onclick: function () {
          SW.state.sel = { p: p, n0: n0, n1: n1 }; window.getSelection().removeAllRanges(); paintSel(); SW.writeQuery(); hideSelPop();
        } }, 'Select lines'));
        document.body.appendChild(selPop);
        var x = Math.min(window.innerWidth - selPop.offsetWidth - 8, Math.max(8, e.clientX - 20)), y = e.clientY + 14;
        if (y + selPop.offsetHeight > window.innerHeight - 8) y = e.clientY - selPop.offsetHeight - 10;
        selPop.style.left = x + 'px'; selPop.style.top = y + 'px';
      }, 0);
    });
    function copy(text, msg) {
      (navigator.clipboard ? navigator.clipboard.writeText(text) : Promise.reject())
        .then(function () { SW.toast(msg); }, function () { window.prompt('Copy:', text); });
    }
    function copyCite() {
      var s = SW.state.sel, part = build.parts[s.p];
      var sw = SW.swhidCite(part.src, part.tape ? null : s.n0, part.tape ? null : s.n1);   // a decoded tape's lines are not the file's
      var gh = SW.permalinkOf(part.src, part.tape ? null : s.n0, part.tape ? null : s.n1);
      copy(SW.cite(build, s.p, s.n0, s.n1) + (sw ? '\n' + sw : '') + (gh ? '\n' + gh : ''), 'Citation copied');
    }
    function copyLink() {
      var s = SW.state.sel;
      copy(SW.permalink({ v: build.v.id, l: s.p + ':' + s.n0 + (s.n1 !== s.n0 ? '-' + s.n1 : '') }), 'Link copied');
    }
    function exportSel(fmt) {
      var s = SW.state.sel;
      SW.exportDoc(listingDoc(build, s), ((SW.BENCH || {}).slug || 'bench') + '-' + build.v.id + '-ll' + s.n0 + '-' + s.n1, fmt);
    }
    function figureSel() {
      var s = SW.state.sel;
      SW.figures.codeFigureDialog(build, selLines(), SW.cite(build, s.p, s.n0, s.n1));
    }

    // ---------- export model ----------
    function listingDoc(b, s, lopts) {
      lopts = lopts || {};
      // the whole listing follows the Tape menu: every tape, or the one shown
      var lines = s ? b.lines[s.p].slice(s.n0 - 1, s.n1)
        : [].concat.apply([], b.lines.filter(function (x, pi) { return showsTape(pi); })).filter(function (L) { return !L.away; });
      if (!s && filtering()) { var keep = keptLines(); lines = lines.filter(function (L) { return keep[L.p + ':' + L.n]; }); }
      return N.list(b.v.id).then(function (all) {
        var threads = N.threads(all);
        // each annotation goes after the last of its lines that is exported, so
        // one that begins above a selection is still included
        // the annotated lines only: the lines each annotation covers
        if (lopts.onlyNoted) {
          var cov = {};
          threads.forEach(function (t) { var a = t.note.anchor; if (!a) return; for (var n = a.n0; n <= (a.n1 || a.n0); n++) cov[a.p + ':' + n] = 1; });
          lines = lines.filter(function (L) { return cov[L.p + ':' + L.n]; });
        }
        var out = {}; lines.forEach(function (L) { out[L.p + ':' + L.n] = 1; });
        var byLine = {};
        threads.forEach(function (t) {
          var a = t.note.anchor; if (!a) return;
          for (var n = a.n1 || a.n0; n >= a.n0; n--) if (out[a.p + ':' + n]) { (byLine[a.p + ':' + n] = byLine[a.p + ':' + n] || []).push(t); break; }
        });
        var blocks = [];
        if (!s) blocks.push({ type: 'p', text: b.v.summary });
        var cur = null;
        lines.forEach(function (L) {
          if (!cur || cur.p !== L.p || (lopts.onlyNoted && cur.lines.length && cur.lines[cur.lines.length - 1].n !== L.n - 1)) {
            var ti0 = tapeInfo(b)[L.p];   // headed by its tape, as the Tape menu names it, then the file
            cur = { type: 'code', caption: (b.parts.length > 1 && ti0 ? 'Tape ' + (L.p + 1) + ' of ' + b.parts.length + ': ' + ti0.label + ' · ' : '') + b.parts[L.p].src, lines: [], p: L.p };
            blocks.push(cur);
          }
          var ws = b.asm && (b.asm.byLine[L.p] || [])[L.n];
          cur.lines.push({
            n: L.n, addr: ws && ws.length ? SW.oct(ws[0].loc, 4) : '', word: ws && ws.length ? SW.oct(ws[0].val) : '',
            text: L.raw, mark: b.errorsAt[L.p + ':' + L.n] ? 'del' : undefined,
            notes: (byLine[L.p + ':' + L.n] || []).map(function (t) {
              var reps = [];
              (function walk(rs) { rs.forEach(function (r) { reps.push({ by: r.note.by, date: String(r.note.date).slice(0, 10), text: r.note.text }); walk(r.replies); }); })(t.replies);
              var a = t.note.anchor;
              return { by: t.note.by, date: String(t.note.date).slice(0, 10), text: t.note.text, replies: reps, ref: a.n1 && a.n1 !== a.n0 ? 'll. ' + a.n0 + '–' + a.n1 : 'l. ' + a.n0 };
            })
          });
        });
        // each code block ends its caption with the reference to the lines it holds
        blocks.forEach(function (bl) { if (bl.type === 'code' && bl.lines.length) bl.caption += ' ' + SW.refText(b.v.id, bl.p, bl.lines[0].n, bl.lines[bl.lines.length - 1].n, b.parts.length); });
        var errs = b.asm ? b.asm.errors.filter(function (e) { return !s || (e.file === s.p && e.line >= s.n0 && e.line <= s.n1); }) : [];
        if (errs.length) {
          blocks.push({ type: 'h2', text: 'Assembly errors' });
          blocks.push({ type: 'table', head: ['Reference', 'File', 'Line', 'Message', 'Symbol'], rows: errs.map(function (e) {
            return [SW.refText(b.v.id, e.file, e.line, e.line, b.parts.length), b.parts[e.file].src, String(e.line), e.message, e.symbol || ''];
          }) });
        }
        return {
          title: s ? SW.cite(b, s.p, s.n0, s.n1) : b.v.label + ' ' + SW.refText(b.v.id) + (lopts.onlyNoted ? ': the annotations' : ': annotated listing'),
          subtitle: s ? b.v.summary : b.v.date + ' · ' + b.v.authors,
          meta: SW.docMeta(b), blocks: blocks
        };
      });
    }
    R.listingDoc = listingDoc;

    // ---------- events ----------
    // Moving an annotation: its card's ⠿ dragged onto a line; the same number of lines
    var dragNote = null;
    function clearDrop() { SW.$$('.ln.drop-at', view).forEach(function (r) { r.classList.remove('drop-at'); }); }
    document.addEventListener('dragstart', function (e) {
      var g = e.target.closest && e.target.closest('.mc-grip');
      if (!g) return;
      var card = g.closest('.mcard, .ithread');
      dragNote = notes.filter(function (n) { return n.id === card.dataset.tid; })[0] || null;
      if (!dragNote) return;
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', SW.notes.linkOf ? SW.notes.linkOf(dragNote) : dragNote.id);
      try { e.dataTransfer.setDragImage(card, 12, 12); } catch (x) { /* not everywhere */ }
      document.body.classList.add('dragging-note');
    });
    document.addEventListener('dragend', function () { dragNote = null; clearDrop(); document.body.classList.remove('dragging-note'); });
    // dragging over the listing, and the drop
    function wireDrop(box) {
      box.addEventListener('dragover', function (e) {
        if (!dragNote) return;
        var row = e.target.closest('.ln'); if (!row) return;
        e.preventDefault(); e.dataTransfer.dropEffect = 'move';
        var p = +row.dataset.p, n = +row.dataset.n, len = dragNote.anchor.n1 - dragNote.anchor.n0;
        clearDrop();
        for (var k = n; k <= n + len; k++) { var r = SW.$('#L' + p + '-' + k, view); if (r) r.classList.add('drop-at'); }
      });
      box.addEventListener('drop', function (e) {
        if (!dragNote) return;
        var row = e.target.closest('.ln'); if (!row) return;
        e.preventDefault();
        var note = dragNote, p = +row.dataset.p, n = +row.dataset.n, a = note.anchor, len = a.n1 - a.n0;
        dragNote = null; clearDrop();
        if (p === a.p && n === a.n0) return;
        N.reanchor(note, { p: p, n0: n, n1: n + len }).then(function (an) {
          SW.toast('Moved to ' + (an.n1 !== an.n0 ? 'lines ' + an.n0 + '–' + an.n1 : 'line ' + an.n0) + '. ↶ Undo (⌘Z) puts it back.', 5000);
        }, function (err) { SW.toast(err.message, 5000); });
      });
    }

    // a note added, edited or binned: the next refresh looks for ghosts again
    SW.on('notes', function (vid) { if (build && vid === build.v.id) ghostKey = ''; });
    SW.on('reveal', function (r) { if (build && r.vid === build.v.id && r.root !== r.id && !openCards[r.root]) { openCards[r.root] = true; paintNotes(); } });

    return {
      set: function (o) { if ('build' in o) build = o.build; if ('notes' in o) notes = o.notes; },
      paintNotes: paintNotes, paintMargin: paintMargin, layoutMargin: layoutMargin, wireMargin: wireMargin, wireLit: wireLit, wireDrop: wireDrop,
      threadClick: threadClick, threadFor: threadFor, loadGhosts: loadGhosts, ghostCount: function () { return ghosts.length; },
      // when the listing's box changes size: draw the cards again if they were drawn hidden, else lay them out
      refit: function () { if (marginStale) { marginStale = false; paintMargin(); } else layoutMargin(); },
      MODES: MODES, modeOf: modeOf, setNotes: setNotes, modeBtn: modeBtn, live: live,
      paintSel: paintSel, selLines: selLines, quote: quote, annotateSel: annotateSel, findingSel: findingSel,
      copy: copy, copyCite: copyCite, copyLink: copyLink, exportSel: exportSel, figureSel: figureSel, listingDoc: listingDoc
    };
  };
})(typeof window !== 'undefined' ? window : globalThis);
