/*
 * library.js - the Library: the secondary literature on the project, public, held in the bench's own
 * repository (its library/ folder) or, where the bench cannot hold them, as a record with a link out.
 * Beside Paratexts, which is the group's private collection and needs a token; the Library needs none.
 * For a bench that sets SW.BENCH.library; loaded after kit/paratexts.js (where the bench has it) and
 * kit/md.js, before kit/shell.js.
 *
 * Two shelves. The public shelf: files the bench may hold (public domain, an open licence), in its own
 * repository, read by anyone. The private shelf (shelf: 'private'): files in the group's private
 * repository (the one Paratexts keeps, or SW.BENCH.library.private: { org, repo }), under its library/
 * folder, which Paratexts does not list; a member opens them with the token Paratexts uses. The
 * manifest is public, so everyone sees every entry's record, and a private entry's shelf and file path
 * are in it; without a token the entry shows its record and its link out.
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
 *             (.md), HTML, an image, audio or video, shown in a box over the bench (a private file is
 *             read whole before it plays, and GitHub holds none over 100 MB)
 *   url       the work where it is published (for an entry without a file, the only way to it)
 *   source    where the copy held was found, and when
 *   tags      [word], for the filter
 * The tab lists the entries with a search and filters (held here, links out, by kind); an entry opens
 * in a box over the bench: its record, the file shown (a PDF in the browser's own viewer), Open in a
 * new tab, Download, the link out, and a link to the entry.
 * The group's own copy: where the reader has a paratexts token (kit/paratexts.js), the paratexts that
 * name an entry (a record's library: [id], or a tag library:<id>) are offered in its box as well, and
 * open as a paratext does (SW.paratexts.peek). Without a token nothing is looked up or shown, and the
 * public manifest does not name these paratexts.
 * Members see the private repository's size above the list (GitHub works badly above about 1 GB).
 * Additions: a member adds a work from the tab (＋ Add a work), with a copy of it or without. A member's
 * token reaches the private repository only, so the entry goes in its library/additions.json ({ items })
 * and any copy beside it (library/<id>.<ext>, 50 MB at most). Members see additions in the list at once,
 * and may correct or remove them there; nobody else sees them. tools/library-publish.js brings them into
 * the public manifest, when the person running the bench chooses.
 * SW.library: load(), items(), open(id), copies(id), privateRepo(), member(), size(), add(record, file),
 * update(id, record), remove(id), form(entry).
 * docs/library.md is the guide for a bench.
 * Part of bench-kit (github.com/critical-code-studies/bench-kit).
 */
(function (root) {
  'use strict';
  var SW = root.SW, B = SW.BENCH || {};
  var C = B.library === true ? {} : B.library || null;
  var L = SW.library = {};
  if (!C || (SW.menuOff && SW.menuOff('library')) || !SW.views) return;
  var esc = SW.esc, URL0 = C.url || 'library/library.json';
  var man = null, loading = null, addRead = false, F = { q: '', show: 'all', kind: '' };
  var Q0 = SW.readQuery ? SW.readQuery() : {};

  L.load = function () {
    if (man && (addRead || !L.member())) return Promise.resolve(man);
    if (loading) return loading;
    loading = (man ? Promise.resolve(man) : (C.items ? Promise.resolve({ items: C.items }) : C.load ? Promise.resolve(C.load()) :
      fetch(URL0, { cache: 'no-cache' }).then(function (r) { if (!r.ok) throw new Error('The library’s list could not be read (' + r.status + ').'); return r.json(); }))
      .then(function (m) { man = m || {}; man.pub = man.items = (man.items || []).filter(function (e) { return e && e.id && e.title; }); return man; }))
      .then(function () { return L.member() ? readAdds() : man; });
    loading.then(function () { loading = null; }, function () { loading = null; });
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
  // ---------- additions, in the private repository, with the member's token ----------
  var ADD = 'library/additions.json', MAXUP = 50e6;
  function gh(method, path, body) {
    var h = { Authorization: 'Bearer ' + tokenOf(), Accept: 'application/vnd.github+json' };
    if (body) h['Content-Type'] = 'application/json';
    return fetch('https://api.github.com/repos/' + L.privateRepo() + '/contents/' + String(path).split('/').map(encodeURIComponent).join('/'), { method: method, headers: h, body: body ? JSON.stringify(body) : undefined, cache: 'no-store' }).then(function (r) {
      if (r.ok) return r.json();
      var e = new Error(r.status === 401 ? 'GitHub refused your token; make it again (⚙ Settings)' : r.status === 403 ? 'GitHub refused: your token can read the private repository but not write to it' : r.status === 404 ? 'your token cannot reach the private repository, or it does not hold this' : r.status === 409 || r.status === 422 ? 'conflict' : 'GitHub answered ' + r.status);
      e.status = r.status; throw e;
    });
  }
  function b64utf8(s) { var b = new TextEncoder().encode(s), t = ''; for (var i = 0; i < b.length; i += 0x8000) t += String.fromCharCode.apply(null, b.subarray(i, i + 0x8000)); return btoa(t); }
  function utf8b64(s) { var bin = atob(String(s).replace(/\s/g, '')), b = new Uint8Array(bin.length); for (var i = 0; i < bin.length; i++) b[i] = bin.charCodeAt(i); return new TextDecoder().decode(b); }
  function fileB64(file) { return new Promise(function (ok, no) { var r = new FileReader(); r.onload = function () { ok(String(r.result).replace(/^data:[^,]*,/, '')); }; r.onerror = no; r.readAsDataURL(file); }); }
  function currentAdds() {
    return gh('GET', ADD).then(function (r) { return { sha: r.sha, items: JSON.parse(utf8b64(r.content)).items || [] }; }, function (e) { if (e.status === 404) return { sha: null, items: [] }; throw e; });
  }
  function setAdds(list) {
    var have = {}; man.pub.forEach(function (e) { have[e.id] = 1; });
    man.adds = list.filter(function (e) { return e && e.id && e.title && !have[e.id]; });
    man.items = man.pub.concat(man.adds); man.addErr = null; addRead = true;
    return man;
  }
  function readAdds() {
    return currentAdds().then(function (c) { return setAdds(c.items); }, function (e) { man.addErr = e.message; addRead = true; return man; });
  }
  // a change made on the newest copy, and made again if someone saved in between
  function saveAdds(message, change, tries) {
    tries = tries || 0;
    return currentAdds().then(function (c) {
      change(c.items);
      var body = { message: message, content: b64utf8(JSON.stringify({ items: c.items }, null, 1) + '\n') };
      if (c.sha) body.sha = c.sha;
      return gh('PUT', ADD, body).then(function () { return setAdds(c.items); });
    }).catch(function (e) {
      if (e.message === 'conflict' && tries < 3) return saveAdds(message, change, tries + 1);
      throw e;
    });
  }
  function isAdded(e) { return !!man && (man.adds || []).indexOf(e) >= 0; }
  function who() { var m = SW.me ? SW.me() : null; return (m && m.initials) || '?'; }
  function newId() {
    var A = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ', c;
    do { c = 'L-'; for (var i = 0; i < 5; i++) c += A[Math.floor(Math.random() * 36)]; } while (byId(c));
    return c;
  }
  // only the fields of an entry, and a link only to a web address
  function cleaned(r) {
    var o = {};
    ['title', 'author', 'date', 'kind', 'lang', 'note', 'licence', 'url', 'source'].forEach(function (k) { var v = String(r[k] == null ? '' : r[k]).trim(); if (v) o[k] = v; });
    var tags = (r.tags || []).map(function (t) { return String(t).trim(); }).filter(Boolean);
    if (tags.length) o.tags = tags;
    if (!o.title) throw new Error('Give it a title');
    if (o.url && !/^https?:\/\//i.test(o.url)) throw new Error('The link must begin http:// or https://');
    return o;
  }
  L.add = function (record, file) {
    return new Promise(function (ok) { ok(cleaned(record)); }).then(function (o) {
      if (!L.member()) throw new Error('Adding to the library needs a GitHub token (⚙ Settings)');
      if (file && file.size > MAXUP) throw new Error('Too large to add from here (50 MB at most)');
      return L.load().then(function () {
        var id = newId(), x = file ? (String(file.name).match(/\.[A-Za-z0-9]+$/) || [''])[0].toLowerCase() : '', path = 'library/' + id + x;
        var entry = Object.assign({ id: id }, o, file ? { shelf: 'private', file: path } : {}, { added: Object.assign(who() === '?' ? {} : { by: who() }, { date: new Date().toISOString().slice(0, 10) }) });
        var message = 'Library ' + id + ': ' + o.title + ', added by ' + who();
        function record2(fileSha) {
          return saveAdds(message, function (items) { items.push(entry); }).then(function () { return id; }, function (err) {
            if (!fileSha) throw err;
            // the record could not be saved: the file just uploaded is taken out again
            return gh('DELETE', path, { message: 'Library ' + id + ': upload taken back, its record not saved', sha: fileSha }).then(function () { throw err; }, function () { throw new Error(err.message + '; the file ' + path + ' stays in the private repository without a record'); });
          });
        }
        if (!file) return record2(null);
        return fileB64(file).then(function (b64) { return gh('PUT', path, { message: message, content: b64 }); }).then(function (r) { return record2(r && r.content && r.content.sha); });
      });
    });
  };
  // only an addition: the public manifest is not written from here, and a public entry's copy is not removed
  function addition(id) { var e = byId(id); if (!e || !isAdded(e)) throw new Error('That entry is no longer among the additions'); return e; }
  L.update = function (id, record) {
    return new Promise(function (ok) { addition(id); ok(cleaned(record)); }).then(function (o) {
      return saveAdds('Library ' + id + ': corrected by ' + who(), function (items) {
        var i = items.map(function (e) { return e.id; }).indexOf(id);
        if (i < 0) throw new Error('That entry is no longer among the additions');
        var was = items[i], next = { id: id };
        Object.keys(o).forEach(function (k) { next[k] = o[k]; });
        ['shelf', 'file', 'added'].forEach(function (k) { if (was[k]) next[k] = was[k]; });
        items[i] = next;
      }).then(function () { return id; });
    });
  };
  L.remove = function (id) {
    return new Promise(function (ok) { ok(addition(id)); }).then(function (e) {
      var file = e.file;
      return saveAdds('Library ' + id + ': removed by ' + who(), function (items) {
        for (var i = items.length - 1; i >= 0; i--) if (items[i].id === id) items.splice(i, 1);
      }).then(function () {
        if (!file) return id;
        return gh('GET', file).then(function (r) { return gh('DELETE', file, { message: 'Library ' + id + ': its copy removed by ' + who(), sha: r.sha }); }).then(function () { return id; }, function (err) {
          throw new Error('The entry is removed, but its file ' + file + ' stays in the private repository: ' + err.message);
        });
      });
    });
  };
  // the form, for a new entry or for correcting an addition
  L.form = function (e) {
    var kinds = ['article', 'book', 'chapter', 'documentary', 'podcast', 'talk', 'thesis', 'web page'];
    L.items().forEach(function (x) { if (x.kind && kinds.indexOf(x.kind) < 0) kinds.push(x.kind); });
    var v = e || {};
    function field(name, label, more) { return '<label><span>' + label + '</span><input name="' + name + '" value="' + esc(v[name] || '') + '"' + (more || '') + '></label>'; }
    var d = SW.el('dialog', { class: 'tray-big lib-form' });
    d.innerHTML = '<div class="tray-bighead"><b>' + (e ? 'Correct ' + esc(e.id) : 'Add a work to the library') + '</b><button class="icon-btn" data-x title="Close (Esc)">✕</button></div>' +
      '<p class="hint">It goes in the group’s private repository. Members see it at once. It joins the public list when the person running the bench publishes it; a copy stays private.</p>' +
      '<div class="lib-fields">' + field('title', 'Title') + field('author', 'Author') + field('date', 'Date') + field('kind', 'Kind', ' list="lib-kinds"') + field('lang', 'Language') +
      field('url', 'Where it is published (a link)', ' type="url" placeholder="https://"') + field('licence', 'Licence') + field('source', 'Where the copy came from') +
      '<label><span>Tags, with commas</span><input name="tags" value="' + esc((v.tags || []).join(', ')) + '"></label>' +
      '<label class="lib-wide"><span>Note</span><textarea name="note" rows="3">' + esc(v.note || '') + '</textarea></label>' +
      (e ? '' : '<label class="lib-wide"><span>A copy, if the group holds one (50 MB at most)</span><input name="file" type="file"></label>') +
      '</div><datalist id="lib-kinds">' + kinds.sort().map(function (k) { return '<option value="' + esc(k) + '">'; }).join('') + '</datalist>' +
      '<div class="lib-acts"><button class="btn" data-a="save">' + (e ? 'Save' : 'Add') + '</button><span class="lib-msg hint" role="status"></span></div>';
    document.body.appendChild(d);
    d.addEventListener('close', function () { d.remove(); });
    d.addEventListener('click', function (ev) {
      if (ev.target === d || ev.target.closest('[data-x]')) { d.close(); return; }
      var a = ev.target.closest('[data-a="save"]'); if (!a) return;
      var msg = SW.$('.lib-msg', d), r = {};
      SW.$$('.lib-fields input, .lib-fields textarea', d).forEach(function (i) { if (i.name !== 'file') r[i.name] = i.value; });
      r.tags = String(r.tags || '').split(',');
      var input = SW.$('input[name="file"]', d), file = input && input.files && input.files[0] || null;
      var same = !e && L.items().filter(function (x) { return String(x.title).trim().toLowerCase() === String(r.title).trim().toLowerCase(); })[0];
      if (same && !a.dataset.again) { a.dataset.again = 1; msg.textContent = same.id + ' has this title. Add again to add it anyway.'; return; }
      a.disabled = true; msg.textContent = 'Saving…';
      (e ? L.update(e.id, r) : L.add(r, file)).then(function (id) { d.close(); redraw(); SW.toast(id + (e ? ' corrected' : ' added')); L.open(id); }, function (err) { a.disabled = false; msg.textContent = err.message + '.'; });
    });
    d.showModal();
    return d;
  };
  function byId(id) { return L.items().filter(function (e) { return e.id === id; })[0] || null; }
  function ext(f) { var m = /\.([a-z0-9]+)(?:[?#].*)?$/i.exec(f || ''); return m ? m[1].toLowerCase() : ''; }
  function kindOfFile(f) {
    var x = ext(f);
    return x === 'pdf' ? 'pdf' : /^(txt|text)$/.test(x) ? 'text' : /^(md|markdown)$/.test(x) ? 'md' : /^(html?|xhtml)$/.test(x) ? 'html' : /^(png|jpe?g|gif|webp|svg|avif)$/.test(x) ? 'image' : /^(mp3|m4a|wav|ogg|oga|flac|aac|opus)$/.test(x) ? 'audio' : /^(mp4|webm|mov|m4v|ogv)$/.test(x) ? 'video' : 'file';
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
    var btn = SW.el('button', { 'data-tab': 'library', title: 'The secondary literature on the project: held here, or linked to where it is published' }, esc(C.label || 'Library'));
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
      if (F.show === 'added' && !isAdded(e)) return false;
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
        (e.file && (!isPrivate(e) || L.member()) && kindOfFile(e.file) !== 'file' ? ' · ' + kindOfFile(e.file).toUpperCase() : '') + (isAdded(e) ? ' · Added, not yet public' : '') + '</span></button>';
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
        '<span class="lib-show">' + [['all', 'All'], ['held', 'Held here']].concat(m.items.some(isPrivate) ? [['group', 'For the group']] : []).concat([['out', 'Links out']]).concat((m.adds || []).length ? [['added', 'Added']] : []).map(function (s) { return '<button class="btn' + (F.show === s[0] ? ' on' : '') + '" data-show="' + s[0] + '">' + s[1] + '</button>'; }).join('') + '</span>' +
        (kinds.length > 1 ? '<select class="lib-kind" aria-label="Kind"><option value="">Every kind</option>' + kinds.sort().map(function (k) { return '<option' + (k === F.kind ? ' selected' : '') + '>' + esc(k) + '</option>'; }).join('') + '</select>' : '') +
        '<span class="lib-n faint"></span>' + (L.member() ? '<button class="btn lib-add">＋ Add a work</button>' : '') + '</div>' +
        (m.addErr ? '<p class="hint">The group’s additions could not be read: ' + esc(m.addErr) + '.</p>' : '') +
        '<p class="hint lib-size" hidden></p><div class="lib-list"></div></div>';
      list(view);
      L.size().then(function (b) {
        var el = SW.$('.lib-size', view); if (!el || b == null) return;
        var mb = b / 1048576;
        el.hidden = false; el.classList.toggle('lib-big', mb > 800);
        el.textContent = 'The private repository (' + L.privateRepo() + ') holds ' + (mb >= 1024 ? (mb / 1024).toFixed(2) + ' GB' : Math.round(mb) + ' MB') + (mb > 800 ? ': GitHub works badly above about 1 GB.' : '.');
      });
      var q = SW.$('.lib-q', view);
      q.addEventListener('input', function () { F.q = q.value; list(view); });
      if (view.libFor !== L) {
        view.libFor = L;
        view.addEventListener('click', function (ev) {
          if (ev.target.closest('.lib-add')) { L.form(); return; }
          var s = ev.target.closest('[data-show]'); if (s) { F.show = s.dataset.show; SW.$$('[data-show]', view).forEach(function (b) { b.classList.toggle('on', b === s); }); list(view); return; }
          var r = ev.target.closest('[data-lib]'); if (r) L.open(r.dataset.lib);
        });
      }
      var k = SW.$('.lib-kind', view); if (k) k.addEventListener('change', function () { F.kind = k.value; list(view); });
      if (Q0.lib) { var id = Q0.lib; Q0.lib = null; L.open(id); }
    }, function (e) { view.innerHTML = '<p class="pad badge err">' + esc(e.message) + '</p>'; });
  }
  var drawn = false;
  function redraw() { if (drawn) draw(); }
  SW.views.library = { show: function () { if (!drawn) { drawn = true; draw(); } } };

  // ---------- an entry, in a box over the bench ----------
  L.open = function (id) {
    return L.load().then(function () {
      var e = byId(id);
      if (!e) { SW.toast('No entry ' + id + ' in the library.', 3000); return; }
      var priv = isPrivate(e), canOpen = !!e.file && (!priv || L.member());
      var k = canOpen ? kindOfFile(e.file) : null, d = SW.el('dialog', { class: 'tray-big lib-dlg' });
      var rec = [['Author', e.author], ['Date', e.date], ['Kind', e.kind], ['Language', e.lang], ['Licence', e.licence], ['Source', e.source], ['Note', e.note]]
        .concat(isAdded(e) && e.added ? [['Added', [e.added.by, e.added.date].filter(Boolean).join(', ') + '; not yet in the public list']] : [])
        .filter(function (r) { return r[1]; }).map(function (r) { return '<dt>' + r[0] + '</dt><dd>' + esc(r[1]) + '</dd>'; }).join('');
      var acts = (canOpen && !priv ? '<a class="btn ghost" href="' + esc(e.file) + '" target="_blank" rel="noopener">Open in a new tab ↗</a><a class="btn ghost" href="' + esc(e.file) + '" download>⤓ Download</a>' : '') +
        (canOpen && priv ? '<button class="btn ghost" data-a="dl">⤓ Download</button>' : '') +
        (e.url ? '<a class="btn' + (e.file ? ' ghost' : '') + '" href="' + esc(e.url) + '" target="_blank" rel="noopener noreferrer">' + (e.file ? 'Where it is published ↗' : 'Go to it where it is published ↗') + '</a>' : '') +
        '<button class="btn ghost" data-a="link" title="A link that opens this entry">🔗 Link</button>' +
        (isAdded(e) && L.member() ? '<button class="btn ghost" data-a="edit">Correct</button><button class="btn ghost" data-a="rm">Remove</button>' : '');
      d.innerHTML = '<div class="tray-bighead"><span class="px-code mono">' + esc(e.id) + '</span> <b>' + esc(e.title) + '</b><button class="icon-btn" data-x title="Close (Esc)">✕</button></div>' +
        '<div class="lib-acts">' + acts + '<span class="lib-copies"></span></div>' +
        (rec ? '<dl class="lib-rec">' + rec + '</dl>' : '') +
        (canOpen ? '<div class="lib-file" data-k="' + k + '"><p class="hint">Opening the file…</p></div>' :
          priv && e.file ? '<p class="hint">The group keeps a copy of this work in its private repository; members open it here with their GitHub token (⚙ Settings)' + (e.url ? '. The link above goes to it where it is published.' : '.') + '</p>' :
          '<p class="hint">The library holds no copy of this work' + (e.url ? '; the link above goes to it.' : '.') + '</p>');
      document.body.appendChild(d);
      d.addEventListener('close', function () { d.remove(); });
      d.addEventListener('click', function (ev) {
        if (ev.target === d || ev.target.closest('[data-x]')) { d.close(); return; }
        if (ev.target.closest('[data-a="link"]')) { SW.copyText(SW.permalink({ tab: 'library', lib: e.id }), 'the link'); return; }
        if (ev.target.closest('[data-a="edit"]')) { d.close(); L.form(e); return; }
        var rm = ev.target.closest('[data-a="rm"]');
        if (rm) {
          if (!rm.dataset.again) { rm.dataset.again = 1; rm.textContent = 'Remove: press again'; return; }
          rm.disabled = true;
          L.remove(e.id).then(function () { d.close(); redraw(); SW.toast(e.id + ' removed'); }, function (err) { d.close(); redraw(); SW.toast(err.message + '.', 6000); });
          return;
        }
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
  // GitHub's answer does not name a media type, and some browsers will not play a file without one
  var MEDIA = { mp3: 'audio/mpeg', m4a: 'audio/mp4', wav: 'audio/wav', ogg: 'audio/ogg', oga: 'audio/ogg', flac: 'audio/flac', aac: 'audio/aac', opus: 'audio/ogg', mp4: 'video/mp4', webm: 'video/webm', mov: 'video/quicktime', m4v: 'video/mp4', ogv: 'video/ogg' };
  function show(box, e, k, priv) {
    function fail(err) { box.innerHTML = '<p class="badge err">The file could not be read: ' + esc(String(err.message || err)) + '.</p>'; }
    function text(t) { box.innerHTML = k === 'md' && SW.md ? '<div class="lib-md"' + (e.lang ? ' lang="' + esc(e.lang) + '"' : '') + '>' + SW.md(t) + '</div>' : '<pre class="lib-text"' + (e.lang ? ' lang="' + esc(e.lang) + '"' : '') + '>' + esc(t) + '</pre>'; }
    function at(u) {
      if (k === 'pdf') box.innerHTML = '<iframe class="lib-frame" src="' + esc(u) + '#view=FitH" title="' + esc(e.title) + '"></iframe>';
      else if (k === 'image') box.innerHTML = '<img class="lib-img" src="' + esc(u) + '" alt="' + esc(e.title) + '">';
      else if (k === 'html') box.innerHTML = '<iframe class="lib-frame" sandbox="" src="' + esc(u) + '" title="' + esc(e.title) + '"></iframe>';
      else if (k === 'audio') box.innerHTML = '<audio class="lib-audio" controls preload="metadata" src="' + esc(u) + '"></audio>';
      else if (k === 'video') box.innerHTML = '<video class="lib-video" controls preload="metadata" src="' + esc(u) + '"></video>';
      else box.innerHTML = '<p class="hint">This file is not shown here: Download it' + (priv ? '' : ', or open it in a new tab') + '.</p>';
    }
    if (priv) {
      privateFile(e.file).then(function (blob) {
        if (k === 'text' || k === 'md') return blob.text().then(text);
        var type = TYPE[k] || MEDIA[ext(e.file)];
        at(URL.createObjectURL(type ? new Blob([blob], { type: type }) : blob));
      }).catch(fail);
      return;
    }
    if (k === 'text' || k === 'md') { fetch(e.file, { cache: 'no-cache' }).then(function (r) { if (!r.ok) throw new Error(r.status); return r.text(); }).then(text, fail); return; }
    at(e.file);
  }
})(typeof window !== 'undefined' ? window : globalThis);
