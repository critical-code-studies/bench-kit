/*
 * library.js - the Library: texts for wider reading on the project, public, held in the bench's own
 * repository (its library/ folder) or, where the bench cannot hold them, as a record with a link out.
 * Beside Paratexts, which is the group's private collection and needs a token; the Library needs none.
 * For a bench that sets SW.BENCH.library; loaded after kit/paratexts.js (where the bench has it) and
 * kit/md.js, before kit/shell.js.
 *
 * Two shelves. The public shelf: files the bench may hold (public domain, an open licence), in its own
 * repository, read by anyone. The private shelf (shelf: 'private'): files in the group's private
 * repository (the one Paratexts keeps, or SW.BENCH.library.private: { org, repo }), under its library/
 * folder, which Paratexts does not list; a member opens them with the token Paratexts uses. Everyone
 * sees every entry's record; without a token a private entry shows its record and its link out.
 * SW.BENCH.library: true (the manifest at library/library.json), or
 *   { url, label, intro, items, load, private }: url the manifest (from the page); items the entries given here
 *   instead; load() a promise of the manifest (a bench that makes it from another list, such as a
 *   translation's corpus/SOURCES.md); label the tab's name (Library); intro HTML above the list.
 * The manifest: { title, intro, items: [entry] }. An entry:
 *   id        its code, unchanging: links (?tab=library&lib=<id>) and the group's copies point at it
 *   title, author, date, kind (book, article, chapter, letter, edition, parallel text…; a filter), lang, note
 *   licence   the licence under which the file is held (public domain, CC BY 4.0…), or under which the
 *             text is published elsewhere
 *   shelf     'public' (the default) or 'private'
 *   file      the file held: on the public shelf a path from the page (library/files/…), on the
 *             private one a path in the private repository (library/…); PDF, text (.txt), Markdown
 *             (.md), HTML or an image, shown in a box over the bench
 *   url       the text where it is published (for an entry without a file, the only way to it)
 *   source    where the copy held was found, and when
 *   tags      [word], for the filter
 * The tab lists the entries with a search and filters (held here, links out, by kind); an entry opens
 * in a box over the bench: its record, the file shown (a PDF in the browser's own viewer), Open in a
 * new tab, Download, the link out, and a link to the entry.
 * The group's own copy: where the reader has a paratexts token (kit/paratexts.js), the paratexts that
 * name an entry (a record's library: [id], or a tag library:<id>) are offered in its box as well, and
 * open as a paratext does (SW.paratexts.peek). Without a token nothing is looked up or shown, and the
 * public manifest says nothing of the private copies.
 * Members see the private repository's size above the list (GitHub works badly above about 1 GB).
 * SW.library: load(), items(), open(id), copies(id), privateRepo(), member(), size().
 * Part of bench-kit (github.com/critical-code-studies/bench-kit).
 */
(function (root) {
  'use strict';
  var SW = root.SW, B = SW.BENCH || {};
  var C = B.library === true ? {} : B.library || null;
  var L = SW.library = {};
  if (!C || (SW.menuOff && SW.menuOff('library')) || !SW.views) return;
  var esc = SW.esc, URL0 = C.url || 'library/library.json';
  var man = null, loading = null, F = { q: '', show: 'all', kind: '' };
  var Q0 = SW.readQuery ? SW.readQuery() : {};

  L.load = function () {
    if (man) return Promise.resolve(man);
    if (loading) return loading;
    loading = (C.items ? Promise.resolve({ items: C.items }) : C.load ? Promise.resolve(C.load()) :
      fetch(URL0, { cache: 'no-cache' }).then(function (r) { if (!r.ok) throw new Error('The library’s list could not be read (' + r.status + ').'); return r.json(); }))
      .then(function (m) { man = m || {}; man.items = (man.items || []).filter(function (e) { return e && e.id && e.title; }); return man; });
    loading.catch(function () { loading = null; });
    return loading;
  };
  L.items = function () { return man ? man.items : []; };
  // the private shelf's repository, and whether this reader can open it (a token, as Paratexts has)
  L.privateRepo = function () { var p = C.private || {}, bp = B.paratexts || {}; var org = p.org || bp.org, repo = p.repo || bp.repo; return org && repo ? org + '/' + repo : null; };
  function tokenOf() { return String(SW.store.get('gh.token', '') || '').trim(); }
  L.member = function () { return !!(tokenOf() && L.privateRepo()); };
  function isPrivate(e) { return e.shelf === 'private'; }
  // a private file, through GitHub's API with the member's token
  function privateFile(path) {
    return fetch('https://api.github.com/repos/' + L.privateRepo() + '/contents/' + String(path).split('/').map(encodeURIComponent).join('/'), { headers: { Authorization: 'Bearer ' + tokenOf(), Accept: 'application/vnd.github.raw' }, cache: 'no-store' })
      .then(function (r) { if (!r.ok) throw new Error(r.status === 401 ? 'GitHub refused your token; make it again (⚙ Settings)' : r.status === 404 ? 'it is not in the private repository, or your token cannot reach it' : 'GitHub answered ' + r.status); return r.blob(); });
  }
  var sizeP = null;
  L.size = function () {
    if (!L.member()) return Promise.resolve(null);
    return sizeP || (sizeP = fetch('https://api.github.com/repos/' + L.privateRepo(), { headers: { Authorization: 'Bearer ' + tokenOf() }, cache: 'no-store' })
      .then(function (r) { return r.ok ? r.json() : null; }).then(function (j) { return j && j.size != null ? j.size * 1024 : null; }, function () { return null; }));
  };
  function byId(id) { return L.items().filter(function (e) { return e.id === id; })[0] || null; }
  function ext(f) { var m = /\.([a-z0-9]+)(?:[?#].*)?$/i.exec(f || ''); return m ? m[1].toLowerCase() : ''; }
  function kindOfFile(f) {
    var x = ext(f);
    return x === 'pdf' ? 'pdf' : /^(txt|text)$/.test(x) ? 'text' : /^(md|markdown)$/.test(x) ? 'md' : /^(html?|xhtml)$/.test(x) ? 'html' : /^(png|jpe?g|gif|webp|svg|avif)$/.test(x) ? 'image' : 'file';
  }

  // ---------- the group's copies, from the private paratexts, only with a token ----------
  L.copies = function (id) {
    var P = SW.paratexts;
    if (!P || !P.configured || !P.configured() || !P.load) return Promise.resolve([]);
    return P.load().then(function (cat) {
      return (cat.items || []).filter(function (it) {
        if (it.withdrawn) return false;
        var l = it.library;
        if (l && ([].concat(l).indexOf(id) >= 0)) return true;
        return (it.tags || []).indexOf('library:' + id) >= 0;
      }).map(function (it) { return { code: it.code, title: it.title }; });
    }, function () { return []; });
  };

  // ---------- the tab ----------
  var tabs = SW.$('#tabs');
  if (tabs && !SW.$('[data-tab="library"]', tabs)) {
    var btn = SW.el('button', { 'data-tab': 'library', title: 'Texts for wider reading on the project: held here, or linked to where they are published' }, esc(C.label || 'Library'));
    var after = SW.$('[data-tab="paratexts"], [data-menu="paratexts"]', tabs);
    var before = after ? after.nextSibling : SW.$('[data-menu="versions"], [data-menu="help"]', tabs);
    tabs.insertBefore(btn, before || null);
  }
  var main = SW.$('#view-read') && SW.$('#view-read').parentNode;
  if (main && !SW.$('#view-library')) main.appendChild(SW.el('section', { class: 'view', id: 'view-library' }));
  SW.kitViews = (SW.kitViews || []).concat('library');

  function meta(e) { return [e.author, e.date, e.kind].filter(Boolean).map(esc).join(' · '); }
  function rows() {
    var q = F.q.toLowerCase();
    return L.items().filter(function (e) {
      if (F.show === 'held' && (!e.file || isPrivate(e))) return false;
      if (F.show === 'group' && !isPrivate(e)) return false;
      if (F.show === 'out' && (e.file || !e.url)) return false;
      if (F.kind && e.kind !== F.kind) return false;
      if (q && [e.id, e.title, e.author, e.date, e.kind, e.note, e.licence, e.source, (e.tags || []).join(' ')].join(' ').toLowerCase().indexOf(q) < 0) return false;
      return true;
    });
  }
  function list(view) {
    var box = SW.$('.lib-list', view); if (!box) return;
    var rs = rows();
    box.innerHTML = rs.length ? rs.map(function (e) {
      return '<button class="lib-row" data-lib="' + esc(e.id) + '"><span class="lib-t">' + esc(e.title) + '</span><span class="lib-m">' + meta(e) + '</span>' +
        '<span class="lib-h ' + (isPrivate(e) ? 'group' : e.file ? 'held' : 'out') + '">' + (isPrivate(e) ? 'For the group' + (L.member() ? '' : e.url ? ' · link out ↗' : ' · record') : e.file ? 'Held here' : 'Link out ↗') +
        (e.file && (!isPrivate(e) || L.member()) && kindOfFile(e.file) !== 'file' ? ' · ' + kindOfFile(e.file).toUpperCase() : '') + '</span></button>';
    }).join('') : '<p class="hint pad">Nothing in the library answers the search.</p>';
    var n = SW.$('.lib-n', view); if (n) n.textContent = rs.length + ' of ' + L.items().length;
  }
  function draw() {
    var view = SW.$('#view-library'); if (!view) return;
    view.innerHTML = '<p class="hint pad">Reading the library…</p>';
    L.load().then(function (m) {
      var kinds = []; m.items.forEach(function (e) { if (e.kind && kinds.indexOf(e.kind) < 0) kinds.push(e.kind); });
      view.innerHTML = '<div class="lib"><h2>' + esc(m.title || C.label || 'Library') + '</h2>' +
        ((C.intro || m.intro) ? '<div class="lib-intro">' + (C.intro || m.intro) + '</div>' : '') +
        '<div class="toolbar lib-bar"><input type="search" class="lib-q" placeholder="Search the library" aria-label="Search the library" value="' + esc(F.q) + '">' +
        '<span class="lib-show">' + [['all', 'All'], ['held', 'Held here']].concat(m.items.some(isPrivate) ? [['group', 'For the group']] : []).concat([['out', 'Links out']]).map(function (s) { return '<button class="btn' + (F.show === s[0] ? ' on' : '') + '" data-show="' + s[0] + '">' + s[1] + '</button>'; }).join('') + '</span>' +
        (kinds.length > 1 ? '<select class="lib-kind" aria-label="Kind"><option value="">Every kind</option>' + kinds.sort().map(function (k) { return '<option' + (k === F.kind ? ' selected' : '') + '>' + esc(k) + '</option>'; }).join('') + '</select>' : '') +
        '<span class="lib-n faint"></span></div><p class="hint lib-size" hidden></p><div class="lib-list"></div></div>';
      list(view);
      L.size().then(function (b) {
        var el = SW.$('.lib-size', view); if (!el || b == null) return;
        var mb = b / 1048576;
        el.hidden = false; el.classList.toggle('lib-big', mb > 800);
        el.textContent = 'The private repository (' + L.privateRepo() + ') holds ' + (mb >= 1024 ? (mb / 1024).toFixed(2) + ' GB' : Math.round(mb) + ' MB') + (mb > 800 ? ': GitHub works badly above about 1 GB.' : '.');
      });
      var q = SW.$('.lib-q', view);
      q.addEventListener('input', function () { F.q = q.value; list(view); });
      view.addEventListener('click', function (ev) {
        var s = ev.target.closest('[data-show]'); if (s) { F.show = s.dataset.show; SW.$$('[data-show]', view).forEach(function (b) { b.classList.toggle('on', b === s); }); list(view); return; }
        var r = ev.target.closest('[data-lib]'); if (r) L.open(r.dataset.lib);
      });
      var k = SW.$('.lib-kind', view); if (k) k.addEventListener('change', function () { F.kind = k.value; list(view); });
      if (Q0.lib) { var id = Q0.lib; Q0.lib = null; L.open(id); }
    }, function (e) { view.innerHTML = '<p class="pad badge err">' + esc(e.message) + '</p>'; });
  }
  var drawn = false;
  SW.views.library = { show: function () { if (!drawn) { drawn = true; draw(); } } };

  // ---------- an entry, in a box over the bench ----------
  L.open = function (id) {
    return L.load().then(function () {
      var e = byId(id);
      if (!e) { SW.toast('No entry ' + id + ' in the library.', 3000); return; }
      var priv = isPrivate(e), canOpen = !!e.file && (!priv || L.member());
      var k = canOpen ? kindOfFile(e.file) : null, d = SW.el('dialog', { class: 'tray-big lib-dlg' });
      var rec = [['Author', e.author], ['Date', e.date], ['Kind', e.kind], ['Language', e.lang], ['Licence', e.licence], ['Source', e.source], ['Note', e.note]]
        .filter(function (r) { return r[1]; }).map(function (r) { return '<dt>' + r[0] + '</dt><dd>' + esc(r[1]) + '</dd>'; }).join('');
      var acts = (canOpen && !priv ? '<a class="btn ghost" href="' + esc(e.file) + '" target="_blank" rel="noopener">Open in a new tab ↗</a><a class="btn ghost" href="' + esc(e.file) + '" download>⤓ Download</a>' : '') +
        (canOpen && priv ? '<button class="btn ghost" data-a="dl">⤓ Download</button>' : '') +
        (e.url ? '<a class="btn' + (e.file ? ' ghost' : '') + '" href="' + esc(e.url) + '" target="_blank" rel="noopener noreferrer">' + (e.file ? 'Where it is published ↗' : 'Read it where it is published ↗') + '</a>' : '') +
        '<button class="btn ghost" data-a="link" title="A link that opens this entry">🔗 Link</button>';
      d.innerHTML = '<div class="tray-bighead"><span class="px-code mono">' + esc(e.id) + '</span> <b>' + esc(e.title) + '</b><button class="icon-btn" data-x title="Close (Esc)">✕</button></div>' +
        '<div class="lib-acts">' + acts + '<span class="lib-copies"></span></div>' +
        (rec ? '<dl class="lib-rec">' + rec + '</dl>' : '') +
        (canOpen ? '<div class="lib-file" data-k="' + k + '"><p class="hint">Opening the file…</p></div>' :
          priv && e.file ? '<p class="hint">The group keeps a copy of this text in its private repository; members open it here with their GitHub token (⚙ Settings)' + (e.url ? '. The link above goes to it where it is published.' : '.') + '</p>' :
          '<p class="hint">The library holds no copy of this text' + (e.url ? '; the link above goes to it.' : '.') + '</p>');
      document.body.appendChild(d);
      d.addEventListener('close', function () { d.remove(); });
      d.addEventListener('click', function (ev) {
        if (ev.target === d || ev.target.closest('[data-x]')) { d.close(); return; }
        if (ev.target.closest('[data-a="link"]')) { SW.copyText(SW.permalink({ tab: 'library', lib: e.id }), 'the link'); return; }
        var c = ev.target.closest('[data-px]'); if (c) { d.close(); SW.paratexts.peek(c.dataset.px); return; }
        if (ev.target.closest('[data-a="dl"]')) privateFile(e.file).then(function (b) { var a = SW.el('a', { href: URL.createObjectURL(b), download: String(e.file).split('/').pop() }); document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1000); }, function (err) { SW.toast('The file could not be read: ' + err.message + '.', 4000); });
      });
      d.showModal();
      if (canOpen) show(SW.$('.lib-file', d), e, k, priv);
      L.copies(e.id).then(function (cs) {
        var box = SW.$('.lib-copies', d); if (!box || !cs.length) return;
        box.innerHTML = '<span class="faint">The group’s copy:</span> ' + cs.map(function (c) { return '<button class="btn ghost" data-px="' + esc(c.code) + '" title="' + esc(c.title || '') + '">' + esc(c.code) + ' in ' + SW.px('Many') + '</button>'; }).join(' ');
      });
    });
  };
  // the file in the box: a public file from its path, a private one through GitHub as a blob
  var TYPE = { pdf: 'application/pdf', html: 'text/html', image: '' };
  function show(box, e, k, priv) {
    function fail(err) { box.innerHTML = '<p class="badge err">The file could not be read: ' + esc(String(err.message || err)) + '.</p>'; }
    function text(t) { box.innerHTML = k === 'md' && SW.md ? '<div class="lib-md"' + (e.lang ? ' lang="' + esc(e.lang) + '"' : '') + '>' + SW.md(t) + '</div>' : '<pre class="lib-text"' + (e.lang ? ' lang="' + esc(e.lang) + '"' : '') + '>' + esc(t) + '</pre>'; }
    function at(u) {
      if (k === 'pdf') box.innerHTML = '<iframe class="lib-frame" src="' + esc(u) + '#view=FitH" title="' + esc(e.title) + '"></iframe>';
      else if (k === 'image') box.innerHTML = '<img class="lib-img" src="' + esc(u) + '" alt="' + esc(e.title) + '">';
      else if (k === 'html') box.innerHTML = '<iframe class="lib-frame" sandbox="" src="' + esc(u) + '" title="' + esc(e.title) + '"></iframe>';
      else box.innerHTML = '<p class="hint">This file is not shown here: Download it' + (priv ? '' : ', or open it in a new tab') + '.</p>';
    }
    if (priv) {
      privateFile(e.file).then(function (blob) {
        if (k === 'text' || k === 'md') return blob.text().then(text);
        at(URL.createObjectURL(TYPE[k] ? new Blob([blob], { type: TYPE[k] }) : blob));
      }).catch(fail);
      return;
    }
    if (k === 'text' || k === 'md') { fetch(e.file, { cache: 'no-cache' }).then(function (r) { if (!r.ok) throw new Error(r.status); return r.text(); }).then(text, fail); return; }
    at(e.file);
  }
})(typeof window !== 'undefined' ? window : globalThis);
