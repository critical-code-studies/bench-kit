/*
 * read.js - Read: a version's files as held, line by line, with the group's annotations
 * (readnotes.js), a search, the file picker, the filters, the Key, the symbol pop-up and the
 * export. The bench's js/read.js calls var ctx = SW.readView(H) with what is its own:
 *   hl(raw, b)        a line as HTML, highlighted for the bench's language (by default numbers
 *                     and the comment); its names as <span class="sym" data-s="NAME">
 *   mark(html)        the line's HTML once highlighted (control characters, page breaks)
 *   files             { word ('File'), info(b) → [{ pi, supplied, star, title, label }],
 *                     help(info) (the picker's hover), remember (keep the choice), jump ('one':
 *                     a line in a file not shown shows that file; 'all': every file),
 *                     chips(b, pi) (HTML after the file's reference), sub(b, pi, t) (its line
 *                     under the title) }
 *   errors            { word ('error'), title(b) }: the badge for b.asm.errors (SW.asmErrors)
 *   words(b, L)       the machine words a line assembled to ([{ loc, val }]): the Address and
 *                     Word columns, View ▸ Addresses & words, and expand(b, p, n), what a click
 *                     on them unfolds under the line
 *   norm, heat        View ▸ Normalised text (L.norm), View ▸ Run heat (SW.profile); titles:
 *                     { words, norm, address, word, source }, the hovers of those options and of
 *                     the columns' headings (HTML attribute text)
 *   rowClass(b, L, k), rowTitle(b, L, k)   a line's further classes, and its hover
 *   key()             HTML: the Key's pop-up
 *   symbol(name, b)   HTML: the pop-up on a name (links data-p/data-n go to a line,
 *                     data-bio to SW.biography); SW.symbolRefs(b, s, o) gives its list of
 *                     where a name is defined (◆) and used (·), from s.defs and s.refs
 *                     ([{ file, line }]); o.file names each line's file, o.width (44) the
 *                     characters of the line shown
 *   selActs()         more actions on the selection bar (readnotes.js)
 *   toolbar           { html(b) (HTML at the head of the toolbar), wire(tb), after(view, b) (adds
 *                     what goes under the toolbar) }: the bench's own tools, as layers' navigation
 *   lost              a line under a version with no text
 *   repairs           the bench's marks on its repairs, usually SW.kintsugi(...) (kintsugi.js):
 *                     { init(ctx), nav (HTML in the toolbar), view (HTML in
 *                     View), wire(tb), paint(box, b) once a listing is drawn, click(e, b) (true
 *                     when it was theirs), bar() (redrawn with the selection), kept() (the lines
 *                     kept by opts.onlyRepaired), relayout() }
 *   onShow(b)         a version is shown (before it is drawn)
 * ctx: { view, opts, R, K, build(), render(), renderListing(), applyFilter(), paintSel(),
 *        listingDoc(), selLines(), setWords(on) }.
 * Part of bench-kit (github.com/critical-code-studies/bench-kit).
 */
(function (root) {
  'use strict';
  var SW = root.SW;

  SW.symbolRefs = function (b, s, o) {
    o = o || {};
    var list = s.defs.map(function (d) { return ['def', d]; }).concat(s.refs.map(function (r) { return ['ref', r]; }));
    return '<div class="refs">' + list.slice(0, 200).map(function (x) {
      var L = b.lines[x[1].file][x[1].line - 1];
      return '<a href="#" data-p="' + x[1].file + '" data-n="' + x[1].line + '">' + (x[0] === 'def' ? '◆ ' : '· ') +
        (o.file ? SW.esc(b.parts[x[1].file].src.split('/').pop()) + ':' : '') + x[1].line + '  ' + SW.esc((L ? L.raw : '').trim().slice(0, o.width || 44)) + '</a>';
    }).join('') + '</div>';
  };

  SW.readView = function (H) {
    H = H || {};
    var N = SW.notes, B = SW.BENCH, esc = SW.esc;
    var view = SW.$('#view-read');
    var R = SW.views.read = {};
    // the repairs: the bench's own, or those made here to versions made here (kit/mending.js)
    var F = H.files || {}, X = H.repairs || (SW.mending && SW.mending.kintsugi && SW.mending.kintsugi()) || {}, T = H.titles || {}, TB0 = H.toolbar, word = F.word || 'File';
    var SRCW = ((SW.BENCH || {}).words || {}).source || 'Source';   // the text column's heading
    // the toolbar's own tools: the bench's (H.toolbar), else the layers' ◀ ▶ and breadcrumb (kit/layers.js)
    function TB() { return TB0 || (SW.layers && SW.layers.toolbar) || {}; }
    var build = null, notes = [], counts = {}, noted = {}, anchorSel = null;
    // tapes: which of the version's files to show: 'all', or a single file's index
    var opts = { repairs: SW.store.get('read.repairs', true), kinBar: SW.store.get('read.kinBar', false), words: H.words ? SW.store.get('read.words', true) : false, norm: false,
                 tapes: F.remember ? SW.store.get('read.file', '0') : 'all', beside: '', heat: false, onlyNoted: false, onlyRepaired: false, by: '',
                 notes: SW.store.get('read.notes', 'inline'), show: SW.store.get('read.show', 'all'), ghosts: SW.store.get('read.ghosts', true) };
    // ---------- the card lens: a fixed-column file read as cards (SW.BENCH.columns) ----------
    // SW.BENCH.columns: { layout, files: [[pattern on a file's src, layout]], expand, note }
    //   layout  { label: [a, b], flag: { at, cont: /…/, remark: /…/ }, text: [a, b], seq: [a, b] }:
    //           1-based inclusive columns of the file the bench reads (an edition, which may sit
    //           otherwise than the printout behind it); any field may be absent
    //   expand  { contraction: [reading, …] }: contractions written out on demand, a list where the
    //           source leaves it open; never silently: the whole view is set, the held text one
    //           choice away, and each reading is marked (Help ▸ Marks and conventions); expandNot
    //           { contraction: [phrase, …] }, what the source warns it is not, on the mark's title;
    //           expandSource, the source. Written short contracts only a phrase that is a
    //           contraction's one reading, so a statement with no contraction is left as it is
    // Read then offers, under View: the sequence numbers in a gutter, hidden, or as held; a column
    // ruler; continuation cards joined to their statement; contractions written out or shortened.
    // Lines keep their numbers and their annotations whatever the view: a joined card's line is
    // folded, not removed, and a link to it lands on its statement.
    var COLS = SW.BENCH.columns || null;
    // the toolbar's Normal / Expand switch and View's Contractions choose the same thing
    if (COLS) SW.on('flip:expand', function (v) {
      if (opts.expand === v || (v === 'held' && opts.expand === 'short')) return;
      opts.expand = v; SW.store.set('read.expand', v); var se = SW.$('#rd-expand'); if (se) se.value = v; if (build) renderListing();
    });
    if (COLS) { opts.seq = SW.store.get('read.seq', 'gutter'); opts.ruler = SW.store.get('read.ruler', false); opts.join = SW.store.get('read.join', false); opts.expand = SW.flip.get('expand') || SW.store.get('read.expand', 'held'); }
    function layoutOf(b, pi) {
      if (!COLS) return null;
      var src = (b.parts[pi] || {}).src || '', f = (COLS.files || []).filter(function (x) { return x[0].test ? x[0].test(src) : x[0] === src; })[0];
      return f ? f[1] : COLS.layout || null;
    }
    function seqCol() { return !!COLS && opts.seq === 'gutter'; }
    // show: whose annotations Read shows, cycled from the chevron on the Annotations heading
    var SHOW = { all: '▾ All', mine: '▾ Mine', open: '▾ Open', none: '▸ None' }, SHOW_NEXT = { all: 'mine', mine: 'open', open: 'none', none: 'all' };
    function isMine(n) { var me = SW.me().initials; return N.mine(n) || (!!me && n.by === me); }
    // notes: 'inline' (each thread under its lines, the default), 'margin' (cards beside the
    // lines) or 'off' (initials at the line end); chosen from the notes button
    function marginOn() { return opts.notes === 'margin'; }

    // annotations in Read (threads, ghosts, the margin, the selection, export): readnotes.js
    var K = SW.readNotes({ view: view, R: R, opts: opts, isMine: isMine, showsTape: showsTape, filtering: filtering,
      keptLines: keptLines, tapeInfo: info, kinBar: function () { if (X.bar) X.bar(); },
      selActs: function () { return (H.selActs ? H.selActs() : []).concat(SW.mending && SW.mending.selActs ? SW.mending.selActs() : []); } });
    var paintNotes = K.paintNotes, layoutMargin = K.layoutMargin, wireMargin = K.wireMargin,
      threadClick = K.threadClick, threadFor = K.threadFor, loadGhosts = K.loadGhosts, MODES = K.MODES, modeOf = K.modeOf,
      setNotes = K.setNotes, modeBtn = K.modeBtn, live = K.live, paintSel = K.paintSel, annotateSel = K.annotateSel,
      listingDoc = K.listingDoc, ro = null;

    // ---------- the files a version is read from ----------
    var ROLE = { program: 'program', support: 'support', doc: 'documentation' };
    function info(b) {
      if (F.info) return F.info(b);
      // the folder of each file below the folder the version's files share (a project of many folders)
      var dirs = b.parts.map(function (part) { return part.src.split('/').slice(0, -1); }), common = dirs.length ? dirs[0].length : 0;
      dirs.forEach(function (d) { var i = 0; while (i < common && i < d.length && d[i] === dirs[0][i]) i++; common = i; });
      return b.parts.map(function (part, pi) {
        var name = part.src.split('/').pop();
        return { pi: pi, supplied: !SW.mainPart(part), star: false, title: '', folder: dirs[pi].slice(common).join('/'),
                 label: name + (!SW.mainPart(part) ? ' (' + (ROLE[part.role] || part.role) + ')' : '') };
      });
    }
    function showsTape(pi) { return opts.tapes === 'all' || +opts.tapes === pi; }
    function fileOptions(inf) {
      var opt = function (x) { return '<option value="' + x[0] + '"' + (x[0] === String(opts.tapes) ? ' selected' : '') + '>' + esc(x[1]) + '</option>'; };
      var all = opt(['all', 'All ' + inf.length + ' ' + word.toLowerCase() + 's']), one = function (t) { return opt([String(t.pi), (t.pi + 1) + '. ' + t.label]); };
      // in groups by folder where the files are in more than one
      var folders = []; inf.forEach(function (t) { if (folders.indexOf(t.folder || '') < 0) folders.push(t.folder || ''); });
      if (folders.length < 2) return all + inf.map(one).join('');
      return all + folders.map(function (f) { return '<optgroup label="' + esc(f || '(top)') + '">' + inf.filter(function (t) { return (t.folder || '') === f; }).map(one).join('') + '</optgroup>'; }).join('');
    }

    // ---------- highlighting: the bench's, or numbers and the comment ----------
    // o.cut: the column after which the line is its identification field, drawn by Read in its
    // gutter; a bench's hl draws the line up to it
    function hl(raw, b, o) {
      if (H.hl) return H.hl(raw, b, o);
      if (o && o.cut) raw = String(raw).slice(0, o.cut).replace(/\s+$/, '');
      var p = SW.parseLine(raw);
      var code = p.code, h = '', re = /(^|[^\w.])(\d+(?:\.\d+)?)(?![\w.])/g, last = 0, m;
      while ((m = re.exec(code))) { var s0 = m.index + m[1].length; h += esc(code.slice(last, s0)) + '<span class="num">' + m[2] + '</span>'; last = s0 + m[2].length; }
      h += esc(code.slice(last));
      if (p.comment) h += '<span class="cm">' + esc(p.comment) + '</span>';
      return h;
    }
    SW.hlLine = function (raw, b) { return hl(raw, b); };   // also used by the Functional overview

    // ---------- the card lens's parts ----------
    // a ruler of the file's columns, its fields shaded: label, flag, text, sequence
    function rulerHTML(lay) {
      var w = Math.max(lay.text ? lay.text[1] : 0, lay.seq ? lay.seq[1] : 0, 80), out = '';
      function field(c) { return lay.flag && c === lay.flag.at ? 'flag' : lay.label && c >= lay.label[0] && c <= lay.label[1] ? 'label' : lay.text && c >= lay.text[0] && c <= lay.text[1] ? 'text' : lay.seq && c >= lay.seq[0] && c <= lay.seq[1] ? 'seq' : ''; }
      var cut = lay.seq && opts.seq !== 'inline' ? lay.seq[0] - 1 : w;
      for (var c = 1; c <= cut; c++) out += '<span class="cr-' + (field(c) || 'gap') + '" title="column ' + c + (field(c) ? ', ' + field(c) : '') + '">' + (c % 10 === 0 ? String(c / 10 % 10) : c % 5 === 0 ? '+' : '·') + '</span>';
      return '<div class="ln card-ruler" aria-hidden="true"><span class="n">col</span><span class="a"></span><span class="w"></span><span class="t">' + out + '</span>' +
        (seqCol() ? '<span class="sq">' + (lay.seq ? lay.seq[0] + '–' + lay.seq[1] : '') + '</span>' : '') + '<span class="mk"></span></div>';
    }
    // a contraction's Leiden form: W'R with WHENEVER is W(HENEVE)R
    function leidenExp(held, full) {
      var m = /^(.)'(.)$/.exec(held);
      return m && full.charAt(0) === m[1] && full.charAt(full.length - 1) === m[2] ? m[1] + '(' + full.slice(1, -1) + ')' + m[2] : full + ' (' + held + ')';
    }
    function cardPass(box, b) {
      // continuation cards: their text drawn on the statement's first card, their own rows folded
      if (opts.join) b.parts.forEach(function (part, pi) {
        var lay = layoutOf(b, pi); if (!lay || !lay.flag || !lay.flag.cont) return;
        var head = null;
        SW.$$('.ln[data-p="' + pi + '"]', box).forEach(function (row) {
          if (!row.classList.contains('card-cont')) { head = row; return; }
          if (!head) return;
          var t = SW.$('.t', row).cloneNode(true), first = t.firstChild;
          while (first && first.nodeType === 3 && !first.nodeValue.trim()) { t.removeChild(first); first = t.firstChild; }
          if (first && first.nodeType === 3) first.nodeValue = first.nodeValue.replace(/^\s+/, '');
          var j = SW.el('span', { class: 'card-joined', title: 'Continued on line ' + row.dataset.n + ', a card of its own (View ▸ Join continuation cards)' });
          j.innerHTML = t.innerHTML; SW.$('.t', head).appendChild(j);
          row.classList.add('card-folded'); row.dataset.head = head.dataset.n; head.dataset.join = row.dataset.n;
          if (row.classList.contains('noted')) head.classList.add('noted');
        });
      });
      // contractions written out, or spelled-out statements written short: whole-view, marked
      var table = COLS.expand || {}, keys = Object.keys(table);
      if (opts.expand === 'held' || !keys.length) return;
      var esc1 = function (x) { return x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); };
      if (opts.expand === 'out') {
        // a contraction is one token: written out wherever it stands, outside strings and remarks
        var re = new RegExp("(^|[^A-Z0-9'])(" + keys.sort(function (x, y) { return y.length - x.length; }).map(esc1).join('|') + ")(?![A-Z0-9'])", 'g');
        SW.$$('.ln .t', box).forEach(function (t) {
          var w = document.createTreeWalker(t, NodeFilter.SHOW_TEXT), nodes = [], x;
          while ((x = w.nextNode())) if (!x.parentNode.closest('.var, .cm, .card-x')) nodes.push(x);
          nodes.forEach(function (node) {
            var v = node.nodeValue; re.lastIndex = 0; if (!re.test(v)) return; re.lastIndex = 0;
            var frag = document.createDocumentFragment(), last = 0, m;
            while ((m = re.exec(v))) {
              var at = m.index + m[1].length, held = m[2], reads = table[held], one = reads.length === 1;
              frag.appendChild(document.createTextNode(v.slice(last, at)));
              var span = document.createElement('span'), not = (COLS.expandNot || {})[held] || [];   // what the source warns it is not
              span.className = 'card-x' + (one ? '' : ' card-x-open');
              span.textContent = one ? reads[0] : held;
              span.title = held + (one ? ', written out: ' + reads[0] : ': the source leaves it open, ' + reads.join(' or ')) +
                (not.length ? '; not ' + (not.length > 1 ? not.slice(0, -1).join(', ') + ' or ' + not[not.length - 1] : not[0]) : '') + (COLS.expandSource ? ' (' + COLS.expandSource + ')' : '');
              span.dataset.leiden = one ? leidenExp(held, reads[0]) : held;
              frag.appendChild(span); last = at + held.length;
            }
            frag.appendChild(document.createTextNode(v.slice(last)));
            node.parentNode.replaceChild(frag, node);
          });
        });
      } else {
        // written short: a spelled-out statement that is a contraction's one reading, where a
        // statement begins (after the label, or after a comma), matched on the whole line, since
        // its words are drawn apart; INTEGER in NORMAL MODE IS INTEGER is a mode, not a statement
        var full = {}; keys.forEach(function (k) { if (table[k].length === 1) full[table[k][0]] = k; });
        var forms = Object.keys(full).sort(function (x, y) { return y.length - x.length; });
        var re2 = new RegExp("(^\\S*\\s+|,\\s*)(" + forms.map(function (f) { return esc1(f).replace(/ /g, '\\s+'); }).join('|') + ")(?![A-Z0-9'])", 'g');
        SW.$$('.ln .t', box).forEach(function (t) {
          // the line's text, with the places in strings and remarks, which are not read
          var w = document.createTreeWalker(t, NodeFilter.SHOW_TEXT), nodes = [], x, txt = '', off = [];
          while ((x = w.nextNode())) { off.push([x, txt.length, !!x.parentNode.closest('.var, .cm, .card-x, .card-joined')]); nodes.push(x); txt += x.nodeValue; }
          var found = [], m; re2.lastIndex = 0;
          while ((m = re2.exec(txt))) {
            var s0 = m.index + m[1].length, e0 = s0 + m[2].length, form = m[2].replace(/\s+/g, ' ');
            if (off.some(function (o) { return o[2] && o[1] < e0 && o[1] + o[0].nodeValue.length > s0; })) continue;
            found.push([s0, e0, form]);
          }
          found.reverse().forEach(function (f) {   // from the end, so the earlier places stay where they were
            function point(pos) { for (var i = off.length - 1; i >= 0; i--) if (off[i][1] <= pos) return [off[i][0], pos - off[i][1]]; return [off[0][0], 0]; }
            var a = point(f[0]), b = point(f[1]), r = document.createRange();
            r.setStart(a[0], a[1]); r.setEnd(b[0], b[1]);
            var span = document.createElement('span');
            span.className = 'card-x'; span.textContent = full[f[2]]; span.title = f[2] + ', written short: ' + full[f[2]] + (COLS.expandSource ? ' (' + COLS.expandSource + ')' : '');
            span.dataset.leiden = f[2];
            r.deleteContents(); r.insertNode(span);
          });
        });
      }
      // a selection copied: a written-out contraction leaves in Leiden's form, never as if held
      box.addEventListener('copy', function (e) {
        var sel = window.getSelection(); if (!sel || !sel.rangeCount) return;
        var f = sel.getRangeAt(0).cloneContents(); if (!f.querySelector || !f.querySelector('.card-x')) return;
        SW.$$('.card-x', f).forEach(function (x) { x.replaceWith(document.createTextNode(x.dataset.leiden)); });
        SW.$$('.n, .a, .w, .sq, .mk, .card-folded', f).forEach(function (x) { x.remove(); });
        e.clipboardData.setData('text/plain', SW.$$('.ln', f).length ? SW.$$('.ln', f).map(function (r) { return r.textContent.replace(/\s+$/, ''); }).join('\n') : f.textContent);
        e.preventDefault();
      });
    }

    // ---------- a line ----------
    function rowHTML(b, L) {
      var k = L.p + ':' + L.n, cls = 'ln';
      var words = H.words ? H.words(b, L) : null;
      if (L.skipped) cls += ' skip';
      if (b.errorsAt[k]) cls += ' err';
      if (L.norm != null && L.raw !== L.norm && !L.skipped) cls += ' norm';
      if (b.kind && b.kind[k]) cls += ' k' + b.kind[k];
      if (H.rowClass) cls += H.rowClass(b, L, k) || '';
      if (SW.breakpoints && words && words.some(function (w) { return SW.breakpoints[w.loc]; })) cls += ' bp';
      var a = '', w = '', wTitle = '';
      if (words && words.length) {
        a = SW.oct(words[0].loc, 4);
        w = SW.oct(words[0].val) + (words.length > 1 ? ' <span class="faint">+' + (words.length - 1) + '</span>' : '');
        var last = words[words.length - 1].loc;
        wTitle = words.length === 1 ? '1 word, at ' + a
          : words.length + ' words, at ' + (last - words[0].loc === words.length - 1 ? a + '–' + SW.oct(last, 4) : words.map(function (x) { return SW.oct(x.loc, 4); }).join(', ')) +
            (b.kind && b.kind[k] === 'call' ? ' (the macro expanded)' : '');
        wTitle += words.length === 1 ? '. Click to see it.' : '. Click to see them all.';
      }
      var text = opts.norm && L.norm != null ? L.norm : L.raw;
      var mk = N.marginMark(k, counts[k]);
      if (noted[k]) cls += ' noted';
      var heat = '';
      if (opts.heat && SW.profile && SW.profile.build === b && words) {
        var ex = 0;
        words.forEach(function (x) { ex += SW.profile.exec[x.loc] || 0; });
        if (ex) heat = 'background:color-mix(in srgb, var(--amber) ' + (100 * Math.min(0.5, 0.06 + Math.log10(1 + ex) / 12)).toFixed(1) + '%, transparent)';
      }
      var title = b.errorsAt[k] ? b.errorsAt[k].map(function (e) { return e.message + (e.symbol ? ' "' + e.symbol + '"' : ''); }).join('; ') : '';
      if (H.rowTitle) title = H.rowTitle(b, L, k, title) || title;
      var lay = layoutOf(b, L.p), cut = 0, seq = '';
      if (lay && lay.seq && text && opts.seq !== 'inline') { cut = lay.seq[0] - 1; seq = text.slice(cut, lay.seq[1]).trim(); }
      if (lay && lay.flag && text) {
        var fc = text.charAt(lay.flag.at - 1);
        if (lay.flag.remark && lay.flag.remark.test(fc)) cls += ' card-remark'; else if (lay.flag.cont && lay.flag.cont.test(fc)) cls += ' card-cont';
      }
      var t = text ? hl(text, b, cut ? { cut: cut } : undefined) : ' ';
      if (text && H.mark) t = H.mark(t);
      return '<div class="' + cls + '" id="L' + L.p + '-' + L.n + '" data-p="' + L.p + '" data-n="' + L.n + '"' + (title ? ' title="' + esc(title) + '"' : '') + '>' +
        '<span class="n" style="--d:' + String(L.n).length + ';' + heat + '"><button class="qa" tabindex="-1" title="Annotate this">+A</button>' + L.n + '</span>' +
        '<span class="a"' + (wTitle ? ' title="' + esc(wTitle) + '"' : '') + '>' + a + '</span><span class="w"' + (wTitle ? ' title="' + esc(wTitle) + '"' : '') + '>' + w + '</span>' +
        '<span class="t">' + t + '</span>' + (seqCol() ? '<span class="sq">' + esc(seq) + '</span>' : '') + '<span class="mk">' + mk + '</span></div>';
    }
    function errCount(b) { return b.asm && b.asm.errors ? (b.asm.errorCount != null ? b.asm.errorCount : b.asm.errors.length) : 0; }
    function errWord(n) { var w = (H.errors || {}).word || 'error'; return n + ' ' + w + (n > 1 ? 's' : ''); }

    // ---------- the toolbar ----------
    function render() {
      var b = build;
      view.innerHTML = '';
      var tb = SW.el('div', { class: 'toolbar' });
      tb.innerHTML = (TB().html ? TB().html(b) : '') +
        '<input type="search" id="rd-find" placeholder="Find text or /regex/ …">' +
        '<button class="btn" id="rd-prev" title="Previous match">↑</button><button class="btn" id="rd-next" title="Next match">↓</button>' +
        '<span class="hint" id="rd-hits"></span><span class="sep"></span>' +
        '<details class="menu"><summary class="btn" title="What the listing shows">View ▾</summary><div class="menu-body">' +
        (H.words ? '<label class="check" title="' + (T.words || 'Show the address each line was assembled to (octal) and the word it became; click either to see every word a line made') + '"><input type="checkbox" id="rd-words"' + (opts.words ? ' checked' : '') + '> Addresses &amp; words</label>' : '') +
        (H.norm ? '<label class="check" title="' + (T.norm || 'The text as the bench reads it, after the documented normalisations for this version') + '"><input type="checkbox" id="rd-norm"' + (opts.norm ? ' checked' : '') + '> Normalised text</label>' : '') +
        '<label class="check" title="Hide every line that no annotation covers, so the listing reads as the discussion so far. A dashed rule marks where lines are left out. Exports of the whole listing follow the filter."><input type="checkbox" id="rd-noted"' + (opts.onlyNoted ? ' checked' : '') + '> Only annotated lines</label>' +
        '<label class="check" title="Show only annotations (and the lines they cover) in which these initials take part, as author or in a reply">Annotations by <select id="rd-by"><option value="">anyone</option></select></label>' +
        (H.heat ? '<label class="check" title="Shade each line by how often it ran, from the profile collected in the Run view (run the program there first)"><input type="checkbox" id="rd-heat"' + (opts.heat ? ' checked' : '') + '> Run heat</label>' : '') +
        (typeof X.view === 'function' ? X.view() : X.view || '') +
        (COLS ? '<div class="menu-rule"></div>' +
          '<label class="check" title="The identification field (the card’s sequence number): in a gutter of its own, hidden, or where the file has it">Sequence numbers <select id="rd-seq"><option value="gutter"' + (opts.seq === 'gutter' ? ' selected' : '') + '>in a gutter</option><option value="hide"' + (opts.seq === 'hide' ? ' selected' : '') + '>hidden</option><option value="inline"' + (opts.seq === 'inline' ? ' selected' : '') + '>as held</option></select></label>' +
          '<label class="check" title="A ruler of the file’s columns above each file, its fields shaded: label, flag, statement, sequence"><input type="checkbox" id="rd-ruler"' + (opts.ruler ? ' checked' : '') + '> Column ruler</label>' +
          '<label class="check" title="A statement continued on further cards read as one line; the cards keep their own lines and annotations, folded under the first"><input type="checkbox" id="rd-join"' + (opts.join ? ' checked' : '') + '> Join continuation cards</label>' +
          (Object.keys(COLS.expand || {}).length ? '<label class="check" title="Contractions written out, or spelled-out statements written short, over the whole view and marked; the text as held is one choice away, and a copy carries the Leiden form">Contractions <select id="rd-expand"><option value="held"' + (opts.expand === 'held' ? ' selected' : '') + '>as held</option><option value="out"' + (opts.expand === 'out' ? ' selected' : '') + '>written out</option><option value="short"' + (opts.expand === 'short' ? ' selected' : '') + '>written short</option></select></label>' : '') +
          '<div class="hint card-note">' + (COLS.note || 'Columns are those of the file the bench reads, an edition, which may sit otherwise than the printout behind it.') + '</div>' : '') +
        '</div></details>' +
        (COLS && Object.keys(COLS.expand || {}).length ? SW.flip.html('expand', [['held', 'Normal', 'Contractions as held (W’R).'], ['out', 'Expand', 'Contractions written out (WHENEVER), each marked; a copy carries Leiden’s form.']]) : '') +
        '<span class="hint" id="rd-nf"></span>' +
        '<span class="undo-pair"><button class="btn" id="rd-undo" disabled title="Undo">↶</button><button class="btn" id="rd-redo" disabled title="Redo">↷</button></span>' +
        (X.nav || '');
      if (H.key) tb.appendChild(SW.el('button', { class: 'btn', title: 'What the colours and marks in the listing mean', onclick: function (e) { SW.pop(e.clientX, e.clientY, H.key()); } }, 'Key'));
      if (b.v.build && b.parts.length > 1) {
        var ti = info(b);
        tb.appendChild(SW.el('label', { class: 'check tape-pick', title: F.help ? F.help(ti) : 'The files this version is read from, in order. Choose one to read, or All to read them in order.' },
          word + ' <select id="rd-tape">' + fileOptions(ti) + '</select>' + (F.help ? ' <span class="help-dot">?</span>' : '')));
        // another file of the version read beside the one chosen (a program and its data); SW.BENCH.beside: false leaves it out
        if (B.beside !== false) tb.appendChild(SW.el('label', { class: 'check beside-pick', title: 'Another ' + word.toLowerCase() + ' of this version, read beside the one chosen, with a scroll of its own. Choose one ' + word.toLowerCase() + ' first.' },
          'Beside <select id="rd-beside"></select>'));
      }
      var ne = errCount(b);
      if (ne && SW.asmErrors) {
        var eb = SW.el('button', { class: 'badge err', title: (H.errors || {}).title ? H.errors.title(b) : 'What the error' + (ne > 1 ? 's are' : ' is') + ', explained' }, errWord(ne));
        eb.onclick = function () { SW.asmErrors(b); };
        tb.appendChild(eb);
      } else if (b.v.build && !b.asm && H.errors) tb.appendChild(SW.el('span', { class: 'hint' }, 'No source survives.'));
      tb.appendChild(SW.el('span', { class: 'sep' }));
      if (b.v.build && SW.edition) tb.appendChild(SW.edition.menu(function () { return build; }));
      // one Export menu: the listing (as shown, or the annotated lines only) to Word or
      // Markdown, or the annotations with their lines into My notes
      var exm = SW.el('details', { class: 'menu more-menu' });
      exm.innerHTML = '<summary class="btn" title="Export this version’s listing, or put its annotations in My notes">⤓ Export ▾</summary><div class="menu-body">' +
        '<p class="hint">The listing, as shown</p><button class="btn ghost" data-ex="all:docx">⤓ Word</button><button class="btn ghost" data-ex="all:md">⤓ Markdown</button>' +
        '<p class="hint">The annotated lines only</p><button class="btn ghost" data-ex="noted:docx">⤓ Word</button><button class="btn ghost" data-ex="noted:md">⤓ Markdown</button>' +
        '<p class="hint">Private</p><button class="btn ghost" data-ex="noted:tray" title="Each annotation with the lines it covers, as one excerpt in My notes">＋ My notes: the annotations</button></div>';
      exm.addEventListener('click', function (e) {
        var x = e.target.closest('[data-ex]'); if (!x) return;
        exm.open = false;
        var k = x.dataset.ex.split(':'), only = k[0] === 'noted';
        var dp = listingDoc(b, null, { onlyNoted: only });
        if (k[1] === 'tray') { dp.then(function (d) { if (!d.blocks.some(function (bl) { return bl.type === 'code'; })) { SW.toast('No annotations on this version yet.'); return; } SW.tray.addDoc(d); }); return; }
        Promise.resolve(dp).then(function (d) { SW.exportDoc(d, (B.slug || 'bench') + '-' + b.v.id + (only ? '-annotations' : '-listing'), k[1]); });
      });
      tb.appendChild(exm);
      tb.appendChild(SW.el('button', { class: 'btn notes-mode', id: 'rd-notes-mode', onclick: function () {
        var i = MODES.indexOf(modeOf(opts.notes));
        setNotes(MODES[(i + 1) % MODES.length][0]);
      } }));
      view.appendChild(tb);
      if (TB().after) TB().after(view, b);

      if (!b.v.build) {
        var lost = SW.el('div', { class: 'pad prose' });
        lost.innerHTML = '<h2>' + esc(b.v.label) + '</h2><p>' + esc(b.v.summary || '') + '</p><p class="muted">' + (H.lost || 'The bench holds no text of this version. Its record is under Versions ▸ This version.') + '</p>';
        view.appendChild(lost);
        return;
      }
      view.appendChild(SW.el('div', { class: 'selbar', id: 'rd-selbar' }));
      renderListing();
      wireTb(tb);
      modeBtn();
    }

    // ---------- the listing alone, so choosing a file keeps the toolbar (and a search) ----------
    function renderListing() {
      var b = build, inf = info(b), bar = SW.$('#rd-selbar', view);
      SW.$$('.rd-body', view).forEach(function (x) { x.remove(); });
      var wrap = SW.el('div', { class: 'rd-body' + (marginOn() ? ' with-margin' : '') });
      var box = SW.el('div', { class: 'listing' + (opts.words ? '' : ' hide-words') + (opts.repairs ? '' : ' no-repairs') + (seqCol() ? ' with-seq' : '') });
      var margin = SW.el('div', { class: 'note-margin', 'aria-label': 'Annotations' });
      wrap.addEventListener('click', function (e) {
        if (e.target.closest('[data-asmerrs]') && SW.asmErrors) { e.stopPropagation(); SW.asmErrors(b); return; }
        if (X.click && X.click(e, b)) e.stopPropagation();
      });
      // the file read beside: only with one file chosen, and another than it
      var bi = opts.tapes !== 'all' && opts.beside !== '' && +opts.beside !== +opts.tapes && b.parts[+opts.beside] ? +opts.beside : -1;
      var bs = SW.$('#rd-beside', view);
      if (bs) {
        bs.disabled = opts.tapes === 'all';
        bs.innerHTML = '<option value="">' + (opts.tapes === 'all' ? 'choose one ' + word.toLowerCase() + ' first' : 'nothing') + '</option>' +
          inf.filter(function (t) { return String(t.pi) !== String(opts.tapes); }).map(function (t) { return '<option value="' + t.pi + '"' + (t.pi === bi ? ' selected' : '') + '>' + (t.pi + 1) + '. ' + esc(t.label) + '</option>'; }).join('');
      }
      b.parts.forEach(function (part, pi) {
        if (!showsTape(pi)) return;
        var t = inf[pi], sec = SW.el('div', { class: 'part' });
        var errs = b.asm && b.asm.errors ? b.asm.errors.filter(function (e) { return e.file === pi; }).length : 0;
        sec.innerHTML = '<div class="part-head" data-p="' + pi + '">' +
          '<div class="ph-main">' + (b.parts.length > 1 ? '<span class="ph-num">' + word + ' ' + (pi + 1) + ' of ' + b.parts.length + '</span>' : '') +
          '<span class="ph-title">' + esc(t.label) + '</span> ' + SW.refTag(b.v.id, pi, null, null, b.parts.length) + (F.chips ? F.chips(b, pi) : '') +
          (errs ? '<button class="badge err" data-asmerrs title="What the error' + (errs > 1 ? 's are' : ' is') + ', explained">' + errWord(errs) + '</button>' : '') + '</div>' +
          '<div class="ph-sub">' + (F.sub ? F.sub(b, pi, t) : SW.sourceLink(part.src, part.src.split('/').pop()) + ' · ' + ({ program: 'a program file', support: 'a support file', doc: 'documentation' }[part.role] || 'text file') + ' · ' + b.lines[pi].length + ' lines') + '</div>' +
          '<div class="lncols"><span class="n" title="The line’s number in the source file">Line</span>' +
          (H.words ? '<span class="a" title="' + (T.address || 'Where the line’s first word was placed in core memory, in octal') + '">Address</span>' +
            '<span class="w" title="' + (T.word || 'The machine word the line assembled to, in octal; “+N” means N more words followed (hover a row for the count)') + '">Word <button class="colfold" data-cf="0" title="Fold away Address and Word, for more room (View ▸ Addresses &amp; words brings them back too)">‹</button></span>' +
            '<span class="t" title="' + (T.source || 'The source as written (or as the bench reads it, with Normalised text on in View)') + '"><button class="colfold cf-show" data-cf="1" title="Show Address and Word">›</button>' + SW.esc(SRCW) + '</span>'
            : '<span class="a"></span><span class="w"></span><span class="t" title="The source as held">' + SW.esc(SRCW) + '</span>') +
          (seqCol() ? '<span class="sq" title="The identification field: the card’s sequence number, in a gutter of its own (View)">Seq</span>' : '') +
          '<span class="mk" title="Initials of anyone who has annotated the line; click them to read">Annotations<button class="ann-cyc" data-ann title="Show all annotations, only yours, only open questions, or none (click to change)">' + SHOW[opts.show] + '</button><button class="ann-cyc ghost-sw' + (opts.ghosts ? ' on' : '') + '" data-ghosts aria-pressed="' + !!opts.ghosts + '" title="Ghosts: annotations made on other versions, shown faintly on the lines here that match">Ghosts</button></span></div></div>';
        if (opts.ruler && layoutOf(b, pi)) sec.insertAdjacentHTML('beforeend', rulerHTML(layoutOf(b, pi)));
        sec.insertAdjacentHTML('beforeend', b.lines[pi].filter(function (L) { return !L.away; }).map(function (L) { return rowHTML(b, L); }).join(''));
        box.appendChild(sec);
      });
      if (bi >= 0) {
        var pair = SW.el('div', { class: 'rd-pair' }), side = SW.el('div', { class: 'rd-beside', 'aria-label': 'Read beside' });
        side.innerHTML = '<div class="part-head bs-head"><div class="ph-main"><span class="ph-num">Beside</span><span class="ph-title">' + esc(inf[bi].label) + '</span> ' + SW.refTag(b.v.id, bi, null, null, b.parts.length) + '</div>' +
          '<div class="ph-sub"><button type="button" class="btn ghost" data-bs="swap" title="Read this one, with the other beside it">⇄ Swap</button> <button type="button" class="btn ghost" data-bs="close" title="Read one ' + word.toLowerCase() + ' alone">✕ Close</button></div></div>' +
          '<div class="bs-lines">' + b.lines[bi].filter(function (L) { return !L.away; }).map(function (L) {
            return '<div class="bs-ln" data-p="' + bi + '" data-n="' + L.n + '"><span class="n">' + L.n + '</span><span class="t">' + (L.raw ? hl(L.raw, b) : ' ') + '</span></div>';
          }).join('') + '</div>';
        side.addEventListener('click', function (e) {
          var a = e.target.closest('[data-bs]'); if (!a) return;
          if (a.dataset.bs === 'swap') { var was = opts.tapes; opts.tapes = String(bi); opts.beside = was; var ts = SW.$('#rd-tape', view); if (ts) ts.value = opts.tapes; }
          else opts.beside = '';
          renderListing();
        });
        pair.appendChild(box); pair.appendChild(side);
        wrap.appendChild(pair);
      } else wrap.appendChild(box);
      wrap.appendChild(margin);
      view.insertBefore(wrap, bar);
      if (X.paint) X.paint(box, b);
      if (COLS) cardPass(box, b);
      wireBox(box);
      wireMargin(margin);
      applyFilter();
      paintSel();
      // cards placed while Read was hidden all measure 0: place them again when it shows
      if (ro) ro.disconnect();
      if (root.ResizeObserver) {
        ro = new ResizeObserver(function () {
          if (!marginOn() || !wrap.getClientRects().length) return;
          K.refit();
        });
        ro.observe(wrap);
      }
    }

    function wireBox(box) {
      K.wireLit(box, '.ithread'); K.wireDrop(box);
      box.addEventListener('click', function (e) {
        var cf = e.target.closest('[data-cf]');
        if (cf) { setWords(cf.dataset.cf === '1'); return; }
        if (e.target.closest('[data-ghosts]')) {
          opts.ghosts = !opts.ghosts; SW.store.set('read.ghosts', opts.ghosts);
          SW.$$('[data-ghosts]', view).forEach(function (x) { x.classList.toggle('on', opts.ghosts); x.setAttribute('aria-pressed', String(opts.ghosts)); });
          if (opts.ghosts) SW.toast('Looking for annotations on the other versions…', 2500);
          loadGhosts().then(function () {
            paintNotes();
            if (opts.ghosts) SW.toast(K.ghostCount() ? K.ghostCount() + ' ghost annotation' + (K.ghostCount() === 1 ? '' : 's') + ' from other versions' : 'No annotations on other versions match lines here', 3500);
          });
          return;
        }
        if (e.target.closest('[data-ann]')) {
          opts.show = SHOW_NEXT[opts.show] || 'all'; SW.store.set('read.show', opts.show);
          SW.$$('[data-ann]', view).forEach(function (x) { x.textContent = SHOW[opts.show]; });
          paintNotes();
          SW.toast(opts.show === 'all' ? 'Showing all annotations' : opts.show === 'mine' ? 'Showing only your annotations' : opts.show === 'open' ? 'Showing only open questions' : 'Annotations hidden', 2500);
          return;
        }
        if (e.target.closest('.part-head')) return;   // file headers only label (their source link opens GitHub)
        if (e.target.closest('.inote')) { threadClick(e); return; }   // note buttons are wired by N.wire
        // +A by a line number: a quick annotation on that line, or on the selection it is in
        var qa = e.target.closest('.qa');
        if (qa) {
          var qr = qa.closest('.ln'), qp = +qr.dataset.p, qn = +qr.dataset.n, s0 = SW.state.sel;
          var r0 = s0 && s0.p === qp && qn >= s0.n0 && qn <= s0.n1 ? s0 : { p: qp, n0: qn, n1: qn };
          SW.state.sel = r0; paintSel(); SW.writeQuery();
          annotateSel();
          return;
        }
        var dot = e.target.closest('.note-dot');
        if (dot) { showNotesFor(dot.dataset.k); return; }
        var sym = e.target.closest('.sym');
        if (sym && H.symbol) { symbolPop(sym.dataset.s, e.clientX, e.clientY); return; }
        var row = e.target.closest('.ln');
        if (!row) return;
        var p = +row.dataset.p, n = +row.dataset.n;
        if (H.expand && (e.target.closest('.a') || e.target.closest('.w'))) { toggleExpansion(row, p, n); return; }
        if (e.shiftKey && anchorSel && anchorSel.p === p) {
          SW.state.sel = { p: p, n0: Math.min(anchorSel.n, n), n1: Math.max(anchorSel.n, n) };
        } else {
          anchorSel = { p: p, n: n };
          SW.state.sel = { p: p, n0: n, n1: row.dataset.join ? +row.dataset.join : n };   // a joined statement: all its cards
        }
        paintSel();
        SW.writeQuery();
        var k = p + ':' + n;
        if (counts[k] && opts.notes !== 'hide') {
          var card = opts.notes !== 'off' && threadFor(k);
          if (card) { card.scrollIntoView({ block: 'nearest' }); card.classList.add('flash'); setTimeout(function () { card.classList.remove('flash'); }, 900); }
          else showNotesFor(k);
        }
      });
    }

    // Address and Word shown or folded away: from View, or the chevron in the column headings
    function setWords(on) {
      opts.words = on; SW.store.set('read.words', on);
      var box = SW.$('.listing', view), cb = SW.$('#rd-words', view);
      if (box) box.classList.toggle('hide-words', !on);
      if (cb) cb.checked = on;
      if (X.relayout) X.relayout();
      if (build && SW.$('.rd-body', view)) paintNotes();
    }
    // the words a line made, unfolded under it
    function toggleExpansion(row, p, n) {
      var nx = row.nextElementSibling;
      if (nx && nx.classList.contains('expansion')) { nx.remove(); return; }
      var h = H.expand(build, p, n);
      if (!h) return;
      var d = SW.el('div', { class: 'expansion' }, h);
      d.style.whiteSpace = 'pre';
      row.insertAdjacentElement('afterend', d);
    }
    // ↶ ↷: undo and redo what was done to annotations (notes.js keeps the steps)
    function paintUndo() {
      var u = SW.$('#rd-undo', view), r = SW.$('#rd-redo', view); if (!u) return;
      var h = N.history();
      u.disabled = !h.undo || h.busy; r.disabled = !h.redo || h.busy;
      u.title = h.undo ? 'Undo ' + h.undo + ' (⌘Z)' : 'Undo: nothing to undo yet';
      r.title = h.redo ? 'Redo ' + h.redo + ' (⇧⌘Z)' : 'Redo: nothing to redo';
    }
    SW.on('notes-history', paintUndo);

    function wireTb(tb) {
      if (X.wire) X.wire(tb);
      if (TB().wire) TB().wire(tb);
      SW.$('#rd-undo', tb).onclick = function () { N.undo(); };
      SW.$('#rd-redo', tb).onclick = function () { N.redo(); };
      setTimeout(paintUndo, 0);
      var wc = SW.$('#rd-words', tb); if (wc) wc.onchange = function (e) { setWords(e.target.checked); };
      var nc = SW.$('#rd-norm', tb); if (nc) nc.onchange = function (e) { opts.norm = e.target.checked; render(); };
      // the card lens's choices, kept in this browser
      [['rd-seq', 'seq', 'value'], ['rd-ruler', 'ruler', 'checked'], ['rd-join', 'join', 'checked'], ['rd-expand', 'expand', 'value']].forEach(function (c) {
        var el = SW.$('#' + c[0], tb); if (el) el.onchange = function (e) {
          opts[c[1]] = e.target[c[2]]; SW.store.set('read.' + c[1], opts[c[1]]); renderListing();
          if (c[1] === 'expand') SW.flip.set('expand', opts.expand === 'out' ? 'out' : 'held');   // the toolbar's switch follows
        };
      });
      var hc = SW.$('#rd-heat', tb);
      if (hc) hc.onchange = function (e) {
        opts.heat = e.target.checked;
        if (opts.heat && !(SW.profile && SW.profile.build === build)) SW.toast('Run the program in the Run view to collect a profile.');
        render();
      };
      var tapeSel = SW.$('#rd-tape', tb);
      if (tapeSel) tapeSel.onchange = function () { opts.tapes = tapeSel.value; if (opts.beside === opts.tapes) opts.beside = ''; if (F.remember) SW.store.set('read.file', tapeSel.value); renderListing(); view.scrollTop = 0; };
      var besideSel = SW.$('#rd-beside', tb);
      if (besideSel) besideSel.onchange = function () { opts.beside = besideSel.value; renderListing(); };
      SW.$('#rd-noted', tb).onchange = function (e) { opts.onlyNoted = e.target.checked; applyFilter(); view.scrollTop = 0; };
      SW.$('#rd-by', tb).onchange = function (e) { opts.by = e.target.value; applyFilter(); view.scrollTop = 0; };
      fillBy();

      var find = SW.$('#rd-find', tb), hits = [], hi = -1;
      function search() {
        SW.$$('.ln.cur', view).forEach(function (e) { e.classList.remove('cur'); });
        hits = [];
        var q = find.value;
        if (!q) { SW.$('#rd-hits', tb).textContent = ''; return; }
        var re;
        try { re = /^\/.*\/$/.test(q) ? new RegExp(q.slice(1, -1), 'i') : new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'); }
        catch (err) { SW.$('#rd-hits', tb).textContent = 'bad pattern'; return; }
        var keep = filtering() ? keptLines() : null;
        build.lines.forEach(function (ls) { ls.forEach(function (L) { if (!L.away && re.test(L.raw) && (!keep || keep[L.p + ':' + L.n])) hits.push(L); }); });
        SW.$('#rd-hits', tb).textContent = hits.length + ' match' + (hits.length === 1 ? '' : 'es');
        hi = -1; step(1);
      }
      function step(d) {
        if (!hits.length) return;
        hi = (hi + d + hits.length) % hits.length;
        R.goto(hits[hi].p, hits[hi].n, true);
      }
      find.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.shiftKey ? step(-1) : (hits.length && find.dataset.q === find.value ? step(1) : (find.dataset.q = find.value, search())); } });
      SW.$('#rd-next', tb).onclick = function () { if (find.dataset.q !== find.value) { find.dataset.q = find.value; search(); } else step(1); };
      SW.$('#rd-prev', tb).onclick = function () { step(-1); };
    }

    // ---------- a name, in a pop-up: the bench says what it is ----------
    function symbolPop(name, x, y) {
      var h = H.symbol(name, build); if (!h) return;
      var pop = SW.pop(x, y, h);
      pop.addEventListener('click', function (e) {
        var bio = e.target.closest('a[data-bio]');
        if (bio) { e.preventDefault(); SW.unpop(); SW.biography(bio.dataset.bio); return; }
        var a = e.target.closest('a[data-n]');
        if (!a) return;
        e.preventDefault();
        SW.unpop();
        // a row is a place: select its line, as a click on the line would, so the link follows
        var p = +a.dataset.p, n = +a.dataset.n;
        SW.state.sel = { p: p, n0: n, n1: n }; anchorSel = { p: p, n: n };
        R.goto(p, n, true); paintSel(); SW.writeQuery();
      });
    }

    // ---------- a line's annotations, in the side panel ----------
    var openNotesKey = null, binInPanel = false;
    function showNotesFor(k) {
      var parts = k.split(':'), p = +parts[0], n = +parts[1];
      var ts = N.threads(notes).filter(function (t) { return t.note.anchor && t.note.anchor.p === p && t.note.anchor.n0 === n; });
      var html = '<p style="margin-top:0"><button class="btn" data-act="new">✎ Annotate this line</button> ' +
        '<button class="btn" data-act="bin" title="Deleted annotations on this version: restore them, or delete them for good">🗑 Bin</button></p>' +
        (ts.map(function (t) { return N.renderThread(t, null); }).join('') || '<p class="hint">No annotations yet.</p>') +
        '<div class="panel-bin"' + (binInPanel ? '' : ' hidden') + '><h4>Deleted annotations</h4><div></div></div>';
      var body = SW.drawer('Annotations', html);
      body.dataset.notes = k;
      openNotesKey = k;
      N.wire(body, build.v.id, notes);
      var pb = body.querySelector('.panel-bin'), binBtn = body.querySelector('[data-act="bin"]');
      function openBin() { N.showBin(pb.lastChild, { vid: build.v.id }); }
      if (binInPanel) openBin();
      binBtn.classList.toggle('on', binInPanel);
      binBtn.onclick = function (e) {
        e.stopPropagation();
        binInPanel = pb.hidden;
        pb.hidden = !binInPanel;
        binBtn.classList.toggle('on', binInPanel);
        if (binInPanel) { openBin(); pb.scrollIntoView({ block: 'nearest' }); }
      };
      body.querySelector('[data-act="new"]').onclick = function () {
        var L = build.lines[p][n - 1];
        N.dialog({ vid: build.v.id, kind: 'line', anchor: { p: p, n0: n, n1: n, src: build.parts[p].src }, quote: L ? L.raw : '',
                   heading: 'Annotate', anchorText: SW.cite(build, p, n, n) });
      };
    }

    R.goto = function (p, n, flash) {
      // a line in a file not shown (a search hit, a note, a link): show that file, or all of them
      if (build.parts[p] && !showsTape(p)) {
        opts.tapes = F.jump === 'all' ? 'all' : String(p);
        var ts = SW.$('#rd-tape', view);
        if (ts) ts.value = opts.tapes;
        renderListing();
      }
      var el = SW.$('#L' + p + '-' + n, view);
      if (el && el.classList.contains('card-folded')) el = SW.$('#L' + p + '-' + el.dataset.head, view) || el;   // a joined card: its statement
      if (!el) return;
      el.scrollIntoView({ block: 'center' });
      if (flash) {
        SW.$$('.ln.cur', view).forEach(function (e) { e.classList.remove('cur'); });
        el.classList.add('cur');
      }
    };

    // ---------- the filter: annotated lines, by whom, and the bench's repairs ----------
    function keptLines() {
      var keep = {};
      if (opts.onlyRepaired && X.kept) {
        var kk = X.kept(); Object.keys(kk).forEach(function (k) { keep[k] = true; });
        if (!opts.onlyNoted && !opts.by) return keep;
      }
      Object.keys(counts).forEach(function (k) {
        var c = counts[k];
        if (opts.by && c.by.indexOf(opts.by) < 0) return;
        for (var n = c.n0; n <= c.n1; n++) keep[c.p + ':' + n] = true;
      });
      return keep;
    }
    function filtering() { return opts.onlyNoted || !!opts.by || !!opts.onlyRepaired; }
    function fillBy() {
      var sel = SW.$('#rd-by', view);
      if (!sel) return;
      var who = {};
      Object.keys(counts).forEach(function (k) { counts[k].by.forEach(function (x) { who[x] = 1; }); });
      if (opts.by) who[opts.by] = 1;
      sel.innerHTML = '<option value="">anyone</option>' + Object.keys(who).sort().map(function (x) {
        return '<option value="' + esc(x) + '"' + (x === opts.by ? ' selected' : '') + '>' + esc(x) + '</option>';
      }).join('');
    }
    function applyFilter() {
      var on = filtering(), keep = on ? keptLines() : null, shown = 0, gap = false;
      SW.$$('.listing .ln', view).forEach(function (row) {
        var k = row.dataset.p + ':' + row.dataset.n, hide = on && !keep[k];
        row.classList.toggle('nf-hide', hide);
        row.classList.toggle('nf-jump', on && !hide && gap);
        if (hide) gap = true; else { gap = false; shown++; }
      });
      SW.$$('.listing .part', view).forEach(function (sec) {
        sec.classList.toggle('nf-empty', on && !SW.$('.ln:not(.nf-hide)', sec));
      });
      var out = SW.$('#rd-nf', view);
      if (out) out.textContent = on ? shown + (opts.onlyRepaired && !opts.onlyNoted && !opts.by ? ' line' + (shown === 1 ? '' : 's') + ' at the repairs' : ' annotated line' + (shown === 1 ? '' : 's') + (opts.by ? ' with ' + opts.by : '')) : '';
      var box = SW.$('.listing', view);
      if (box) {
        var none = SW.$('.nf-none', box), where = opts.tapes === 'all' ? '' : ' and ' + word.toLowerCase();
        if (on && !shown && !none) box.insertBefore(SW.el('p', { class: 'hint nf-none pad' }, opts.by ? 'No annotations by ' + opts.by + ' on this version' + where + '.' : 'No annotated lines on this version' + where + ' yet.'), box.firstChild);
        else if ((!on || shown) && none) none.remove();
      }
      if (build && SW.$('.rd-body', view)) paintNotes();   // the notes follow the lines left showing
    }

    function refreshNotes() {
      if (!build) return;
      N.list(build.v.id).then(function (all) {
        notes = all; K.set({ notes: all });
        counts = N.countsByLine(all);
        noted = {};
        Object.keys(counts).forEach(function (k) {
          var c = counts[k];
          for (var n = c.n0; n <= c.n1; n++) noted[c.p + ':' + n] = true;
        });
        SW.$$('.ln', view).forEach(function (row) {
          var k = row.dataset.p + ':' + row.dataset.n, mk = row.querySelector('.mk');
          if (mk) mk.innerHTML = N.marginMark(k, counts[k]);
          row.classList.toggle('noted', !!noted[k]);
        });
        fillBy();
        applyFilter();
        if (opts.ghosts) loadGhosts(true).then(paintNotes);
        // keep an open panel current; a closed one stays closed (the refresh runs every 20 seconds)
        if (openNotesKey && SW.$('#drawer-body').dataset.notes === openNotesKey && document.body.classList.contains('drawer-open')) showNotesFor(openNotesKey, true);
      });
    }

    R.show = function (b) {
      var fresh = build !== b;
      if (fresh) { if (!F.remember) opts.tapes = 'all'; else if (!(b.parts[+opts.tapes] || opts.tapes === 'all')) opts.tapes = '0'; }
      build = b; K.set({ build: b });
      R.build = b;
      if (H.onShow) H.onShow(b);
      if (SW.loadGlosses) SW.loadGlosses();
      render();
      refreshNotes();
      live();
      // the listing is drawn by now: go to the selection before the browser paints, so a version
      // newly opened is never seen at the place the last one was scrolled to; again once the
      // margin's cards have settled. A version opened with no line selected starts at its head.
      var s = SW.state.sel;
      if (s) { R.goto(s.p, s.n0, false); setTimeout(function () { if (build === b) R.goto(s.p, s.n0, false); }, 0); }
      else if (fresh) view.scrollTop = 0;
    };
    // a note added, edited or binned: look again (ghosts too), now if Read is open, else when it is next opened
    var stale = false;
    SW.on('notes', function (vid) { if (build && vid === build.v.id) { if (SW.state.tab === 'read') refreshNotes(); else stale = true; } });
    R.enter = function () { if (stale && build) { stale = false; refreshNotes(); } };
    SW.on('goto', function (g) {
      if (g.tab !== 'read') return;
      // Read not drawn yet this visit: opening it goes to the selection (R.show)
      if (!build) { var s = SW.state.sel; if (!s || s.p !== g.p || s.n0 !== g.n) SW.state.sel = { p: g.p, n0: g.n, n1: g.n }; SW.setTab('read'); return; }
      SW.setTab('read'); setTimeout(function () { R.goto(g.p, g.n, true); paintSel(); }, 0);
    });
    SW.on('profile', function () { if (opts.heat && build) render(); });
    // lines change height with the window or the code size: the cards follow
    var relay = null;
    window.addEventListener('resize', function () { clearTimeout(relay); relay = setTimeout(function () { if (build && marginOn()) layoutMargin(); }, 120); });
    SW.on('codetext', function () { if (build && marginOn()) setTimeout(function () { layoutMargin(); }, 50); });

    var ctx = { view: view, opts: opts, R: R, K: K, build: function () { return build; }, render: render, renderListing: renderListing,
                applyFilter: applyFilter, paintSel: paintSel, listingDoc: listingDoc, selLines: K.selLines, setWords: setWords };
    if (X.init) X.init(ctx);   // the repairs (kit/kintsugi.js) work through Read's own
    return ctx;
  };
})(typeof window !== 'undefined' ? window : globalThis);
