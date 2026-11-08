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
 *   { url, label, intro, items, load, private, view, order, size, card, snapshot }: snapshot true reads
 *   library/group.json (tools/library-snapshot.js), asked for only then; card { title, description, image } for
 *   the preview card that tools/release.js writes into library/index.html; url the manifest (from the page); items the entries given here
 *   instead; load() a promise of the manifest (a bench that makes it from another list, such as a
 *   translation's corpus/SOURCES.md); label the tab's name (Library); intro HTML above the list; view, order and
 *   size what a reader sees first ('icons' or 'list'; 'author', 'title', 'new', 'old', 'kind', 'lang' or
 *   'listed'; 's', 'm' or 'l'), medium covers by author unless set. A reader's own choice is kept in the browser.
 * The manifest: { title, intro, items: [entry] }. An entry:
 *   id        its code, unchanging: links (?tab=library&lib=<id>) and the group's copies point at it
 *   title, author, date, kind (book, article, chapter, letter, edition, parallel text…; a filter), lang, note
 *   contributor  others who made the work, as one line; in, publisher, pages, doi, extent: where it appeared,
 *             for its record and its citation; citation: the citation as written, in place of the one built
 *   licence   the licence under which the file is held (public domain, CC BY 4.0…), or under which the
 *             text is published elsewhere
 *   shelf     'public' (the default) or 'private'
 *   file      the file held: on the public shelf a path from the page (library/files/…), on the
 *             private one a path in the private repository (library/…); PDF, text (.txt), Markdown
 *             (.md), HTML, an image, audio or video, shown in a box over the bench (a private file is
 *             read whole before it plays, and GitHub holds none over 100 MB)
 *   url       the work where it is published (for an entry without a file, the only way to it). A YouTube,
 *             Vimeo or Internet Archive address plays in the box: at once where the entry has no file the
 *             reader can open, and otherwise on a button below the file
 *   source    where the copy held was found, and when
 *   alts      [{ label, lang, file, shelf }]: other forms of the work (a transcript, a translation), each on
 *             its own shelf, opened below the work in its box; a private one for members only
 *   thumb     an image for its cover: a path from the page, or a link. Without one, a public image file
 *             is its own cover, and otherwise a cover is drawn from the kind
 *   tags      [word], for the filter and the box. Members of the annotation group add and take off tags in the box,
 *             for the group: see N.itemTags in notes.js
 * A reader checks a work out to their To read shelf for one, two or three months, renews it as often as they like
 * or takes the date away, and returns it; past its date it goes back. Kept in this browser, and for a reader with
 * the group's token also as annotations the group can read (N.itemLoans), so it follows them to other browsers, and
 * other members' loans show on the card.
 *   relevance 'essential', 'high', 'medium', 'low', 'minimal' or 'unchecked': an order, the first shown where any entry
 *             has it, and a filter. 'about', 'section', 'mention' and 'unread' from 1.8.0 read as high, medium, low, unchecked.
 *             A tag naming a level (High, Not Checked) comes before this field: the drop-down in the box writes one
 *   key       a number (1, 2, 3…): a key work, marked as one, and ahead of the groups in that order. Members of the
 *             annotation group add and take off the mark in the box, for the group: see N.itemKeys in notes.js
 * The tab shows the entries as covers on a shelf, or as a list, in an order the reader picks, with a search,
 * filters (held, linked, annotated) and facets with their counts (kind, language, rating, decade, author, tag); an
 * entry opens
 * in a box over the bench: its record, the file shown (a PDF in the browser's own viewer), Open in a
 * new tab, Download, the link out, and a link to the entry.
 * The group's own copy: where the reader has a paratexts token (kit/paratexts.js), the paratexts that
 * name an entry (a record's library: [id], or a tag library:<id>) are offered in its box as well, and
 * open as a paratext does (SW.paratexts.peek). Without a token nothing is looked up or shown, and the
 * public manifest does not name these paratexts.
 * Additions: a member adds a work from the tab (＋ Add a work), with a copy of it or without. A member's
 * token reaches the private repository only, so the entry goes in its library/additions.json ({ items })
 * and any copy beside it (library/<id>.<ext>, 40 MB at most). Members see additions in the list at once,
 * and may correct or remove them there; nobody else sees them. tools/library-publish.js brings them into
 * the public manifest, when the person running the bench chooses.
 * Notes on an entry are annotations in the group (kit/notes.js, N.itemPanel): a panel in its box, a count
 * on its cover, an Annotated filter, and a Notes view of them all.
 * SW.library: load(), items(), open(id), copies(id), privateRepo(), member(), add(record, file),
 * update(id, record), remove(id), form(entry), family(entry), year(date), surname(author), sorted(items, order),
 * has(id), citation(entry) { text, html }, canAdd() (a promise: may this reader's token write there),
 * help(), the guide for readers (Help ▸ The Library, ?help=library).
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
  var man = null, loading = null, addRead = false, F = { q: '', show: 'all', facets: {}, more: {}, view: SW.store.get('library.view', '') || C.view || 'icons', order: SW.store.get('library.order', '') || C.order || 'author', size: SW.store.get('library.size', '') || C.size || 'm' };
  var Q0 = SW.readQuery ? SW.readQuery() : {};

  L.load = function () {
    if (man && (addRead || !L.member())) return Promise.resolve(man);
    if (loading) return loading;
    loading = (man ? Promise.resolve(man) : (C.items ? Promise.resolve({ items: C.items }) : C.load ? Promise.resolve(C.load()) :
      fetch(URL0, { cache: 'no-cache' }).then(function (r) { if (!r.ok) throw new Error('The library’s list could not be read (' + r.status + ').'); return r.json(); }))
      .then(function (m) { man = m || {}; man.pub = man.items = (man.items || []).filter(function (e) { return e && e.id && e.title; }); return readSnapshot().then(function () { sweepLoans(); return man; }); }))
      .then(function () { return L.member() ? readAdds() : man; });
    loading.then(function () { loading = null; }, function () { loading = null; });
    return loading;
  };
  // the group's ratings, marks and tags for readers with no token, written by tools/library-snapshot.js. A member's
  // live reading replaces it; no note text is in it
  function readSnapshot() {
    if (C.items || C.load || !C.snapshot) return Promise.resolve();
    return fetch(URL0.replace(/[^/]*$/, 'group.json'), { cache: 'no-cache' }).then(function (r) { return r.ok ? r.json() : null; }).then(function (s) {
      if (!s || typeof s !== 'object') return;
      if (s.ratings) { NR = s.ratings; NRS = JSON.stringify(NR); }
      if (s.keys) setKeys(s.keys);
      if (s.tags) setTags(s.tags);
    }, function () {});
  }
  L.items = function () { return man ? man.items : []; };
  // the private shelf's repository, and whether this reader can open it (a token, as Paratexts has)
  L.privateRepo = function () { var p = C.private || {}, bp = B.paratexts || {}; var org = p.org || bp.org, repo = p.repo || bp.repo; return org && repo ? org + '/' + repo : null; };
  function tokenOf() { return String(SW.store.get('gh.token', '') || '').trim(); }
  L.member = function () { return !!(tokenOf() && L.privateRepo()); };
  // whether this reader's token can write to the private repository, as GitHub says; a token that is
  // out of date, or reads only, gets no button that would fail
  var addP = null, addFor = '';
  L.canAdd = function () {
    if (!L.member()) return Promise.resolve(false);
    if (addP && addFor === tokenOf()) return addP;
    addFor = tokenOf();
    return (addP = fetch('https://api.github.com/repos/' + L.privateRepo(), { headers: { Authorization: 'Bearer ' + tokenOf(), Accept: 'application/vnd.github+json' }, cache: 'no-store' })
      .then(function (r) { return r.ok ? r.json() : null; }).then(function (j) { return !!(j && j.permissions && j.permissions.push); }, function () { return false; }));
  };
  function isPrivate(e) { return e.shelf === 'private'; }
  // a private file, through GitHub's API with the member's token
  function privateFile(path) {
    return fetch('https://api.github.com/repos/' + L.privateRepo() + '/contents/' + String(path).split('/').map(encodeURIComponent).join('/'), { headers: { Authorization: 'Bearer ' + tokenOf(), Accept: 'application/vnd.github.raw' }, cache: 'no-store' })
      .then(function (r) { if (!r.ok) throw new Error(r.status === 401 ? 'GitHub refused your token; make it again (⚙ Settings)' : r.status === 404 ? 'it is not in the private repository, or your token cannot reach it' : 'GitHub answered ' + r.status); return r.blob(); });
  }
  // ---------- additions, in the private repository, with the member's token ----------
  // GitHub's API took 41.5 MB and refused 42 MB in a trial on 2026-11-06; it publishes no figure
  var ADD = 'library/additions.json', MAXUP = 40e6, TRIES = 6, BUSY = 'Others were saving to the private repository at the same moment. Try again';
  function gh(method, path, body) {
    var h = { Authorization: 'Bearer ' + tokenOf(), Accept: 'application/vnd.github+json' };
    if (body) h['Content-Type'] = 'application/json';
    return fetch('https://api.github.com/repos/' + L.privateRepo() + '/contents/' + String(path).split('/').map(encodeURIComponent).join('/'), { method: method, headers: h, body: body ? JSON.stringify(body) : undefined, cache: 'no-store' }).then(function (r) {
      if (r.ok) return r.json();
      function fail(said) {
        var e = new Error(r.status === 401 ? 'GitHub refused your token; make it again (⚙ Settings)' : r.status === 403 ? 'GitHub refused: your token can read the private repository but not write to it' : r.status === 404 ? 'your token cannot reach the private repository, or it does not hold this' : /too large/i.test(said) ? 'GitHub refused this file as too large to take through its API. It can go in through git, up to 100 MB' : r.status === 409 || r.status === 422 ? 'conflict' : r.status >= 500 ? 'GitHub did not finish this (it answered ' + r.status + '). Try again' : 'GitHub answered ' + r.status);
        e.status = r.status; throw e;
      }
      return r.status === 422 ? r.text().then(fail) : fail('');
    });
  }
  // GitHub answers 409 to a commit made while another is going through: wait a moment, longer each time, at a different moment from the others
  function pause(tries) { return new Promise(function (ok) { setTimeout(ok, (tries + Math.random()) * 400); }); }
  function write(method, path, body, tries) {
    tries = tries || 0;
    return gh(method, path, body).catch(function (e) {
      if (e.status !== 409) throw e;
      if (tries + 1 >= TRIES) throw new Error(BUSY);
      return pause(tries + 1).then(function () { return write(method, path, body, tries + 1); });
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
    return currentAdds().then(function (c) { return setAdds(c.items); }, function (e) { man.addErr = e.message; man.addStatus = e.status || 0; addRead = true; return man; });
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
      if (e.message !== 'conflict') throw e;
      if (tries + 1 >= TRIES) throw new Error(BUSY);
      return pause(tries + 1).then(function () { return saveAdds(message, change, tries + 1); });
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
    ['title', 'author', 'contributor', 'date', 'kind', 'lang', 'in', 'publisher', 'pages', 'doi', 'note', 'licence', 'url', 'source', 'thumb'].forEach(function (k) { var v = String(r[k] == null ? '' : r[k]).trim(); if (v) o[k] = v; });
    var tags = (r.tags || []).map(function (t) { return String(t).trim(); }).filter(Boolean);
    if (tags.length) o.tags = tags;
    if (!o.title) throw new Error('Give it a title');
    if (o.url && !/^https?:\/\//i.test(o.url)) throw new Error('The link must begin http:// or https://');
    if (o.thumb && !/^https?:\/\//i.test(o.thumb)) throw new Error('The cover image’s link must begin http:// or https://');
    return o;
  }
  L.add = function (record, file) {
    return new Promise(function (ok) { ok(cleaned(record)); }).then(function (o) {
      if (!L.member()) throw new Error('Adding to the library needs a GitHub token (⚙ Settings)');
      if (file && file.size > MAXUP) throw new Error('Too large to add from here (40 MB at most)');
      return L.load().then(function () {
        var id = newId(), x = file ? (String(file.name).match(/\.[A-Za-z0-9]+$/) || [''])[0].toLowerCase() : '', path = 'library/' + id + x;
        var entry = Object.assign({ id: id }, o, file ? { shelf: 'private', file: path } : {}, { added: Object.assign(who() === '?' ? {} : { by: who() }, { date: new Date().toISOString().slice(0, 10) }), check: 'unchecked' });
        var message = 'Library ' + id + ': ' + o.title + ', added by ' + who();
        function record2(fileSha) {
          return saveAdds(message, function (items) { items.push(entry); }).then(function () { return id; }, function (err) {
            if (!fileSha) throw err;
            // the record could not be saved: the file just uploaded is taken out again
            return write('DELETE', path, { message: 'Library ' + id + ': upload taken back, its record not saved', sha: fileSha }).then(function () { throw err; }, function () { throw new Error(err.message + '; the file ' + path + ' stays in the private repository without a record'); });
          });
        }
        if (!file) return record2(null);
        return fileB64(file).then(function (b64) { return write('PUT', path, { message: message, content: b64 }); }).then(function (r) { return record2(r && r.content && r.content.sha); });
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
        ['shelf', 'file', 'added', 'check'].forEach(function (k) { if (was[k]) next[k] = was[k]; });
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
        return gh('GET', file).then(function (r) { return write('DELETE', file, { message: 'Library ' + id + ': its copy removed by ' + who(), sha: r.sha }); }).then(function () { return id; }, function (err) {
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
      '<div class="lib-fields">' + field('title', 'Title') + field('author', 'Author') + field('contributor', 'With (others who made it)') + field('date', 'Date') + field('kind', 'Kind', ' list="lib-kinds"') + field('lang', 'Language') +
      field('in', 'In (a journal, or a book for a chapter)') + field('publisher', 'Publisher') + field('pages', 'Pages') + field('doi', 'DOI') +
      field('url', 'Where it is published (a link)', ' type="url" placeholder="https://"') + field('licence', 'Licence') + field('source', 'Where the copy came from') +
      field('thumb', 'A cover image (a link, optional)', ' type="url" placeholder="https://"') +
      '<label><span>Tags, with commas</span><input name="tags" value="' + esc((v.tags || []).join(', ')) + '"></label>' +
      '<label class="lib-wide"><span>Note</span><textarea name="note" rows="3">' + esc(v.note || '') + '</textarea></label>' +
      (e ? '' : '<label class="lib-wide"><span>A copy, if the group holds one (40 MB at most)</span><input name="file" type="file"></label>') +
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
  L.has = function (id) { return !!byId(id); };
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
    var btn = SW.el('button', { 'data-tab': 'library', title: 'The secondary literature on the project: held, or linked to where it is published' }, esc(C.label || 'Library'));
    var after = SW.$('[data-tab="paratexts"], [data-menu="paratexts"]', tabs);
    var before = after ? after.nextSibling : SW.$('[data-menu="versions"], [data-menu="help"]', tabs);
    tabs.insertBefore(btn, before || null);
  }
  var main = SW.$('section.view') && SW.$('section.view').parentNode;   // beside the bench's own views, whichever it has
  if (main && !SW.$('#view-library')) main.appendChild(SW.el('section', { class: 'view', id: 'view-library' }));
  SW.kitViews = (SW.kitViews || []).concat('library');

  function meta(e) { return [e.author, e.date, e.kind].filter(Boolean).map(esc).join(' · '); }
  function heldAs(e) {
    return (isPrivate(e) ? 'For the group' + (L.member() ? '' : e.url ? ' · linked ↗' : ' · record') : e.file ? 'Held' : e.url ? 'Linked ↗' : 'Record only') +
      (e.file && (!isPrivate(e) || L.member()) && kindOfFile(e.file) !== 'file' ? ' · ' + kindOfFile(e.file).toUpperCase() : '') + (isAdded(e) ? ' · Added, not yet public' : '');
  }
  function heldClass(e) { return isPrivate(e) ? 'group' : e.file ? 'held' : 'out'; }

  // ---------- the order ----------
  // the year in a date as a catalogue writes it (2001, c. 1935, 1935-40, 20 Nov 2019), or null
  L.year = function (d) { var m = /(?:^|\D)(\d{4})(?!\d)/.exec(String(d == null ? '' : d)); return m ? +m[1] : null; };
  // the name a first author is filed under: before the comma of "Surname, First", or the last word
  L.surname = function (a) {
    var first = String(a == null ? '' : a).split(/\s*(?:;|&|\band\b|\bwith\b)\s*/)[0].trim();
    if (first.indexOf(',') > 0) return first.split(',')[0].trim();
    var w = first.split(/\s+/);
    return w[w.length - 1] || '';
  };
  // the title as filed: without an opening article or quotation mark
  // a shelf mark after the old ones: the year, then the author's initial and two figures from the next letters
  // (after Cutter's tables, simplified), then the title's first letter. A guide to the shelf, not a classification
  function cutterFig(c) { var i = 'abcdefghijklmnopqrstuvwxyz'.indexOf(String(c).toLowerCase()); return i < 0 ? 1 : Math.min(9, Math.max(1, Math.floor(i / 2.9) + 1)); }
  L.callNo = function (e) {
    var y = L.year(e.date), who = String(L.surname(e.author) || titleKey(e.title) || '').replace(/[^A-Za-zÀ-ÿ]/g, ''), t = titleKey(e.title).replace(/^[^A-Za-zÀ-ÿ]+/, '');
    if (!who) return y ? String(y) : '';
    return (y ? y + ' ' : '') + who.charAt(0).toUpperCase() + cutterFig(who.charAt(1)) + cutterFig(who.charAt(2)) + (t ? t.charAt(0).toLowerCase() : '');
  };
  function titleKey(t) { return String(t == null ? '' : t).replace(/^[\s"'“‘«(\[]+/, '').replace(/^(the|an?|le|la|les|der|die|das)\s+/i, ''); }
  var AZ = root.Intl && Intl.Collator ? new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' }).compare : function (a, b) { return a < b ? -1 : a > b ? 1 : 0; };
  var RELEVANCE = ['essential', 'high', 'medium', 'low', 'minimal', 'unchecked'], REL_NAMES = { essential: 'Essential', high: 'High', medium: 'Medium', low: 'Low', minimal: 'Minimal', unchecked: 'Not Checked' };
  var REL_OLD = { about: 'high', section: 'medium', mention: 'low', unread: 'unchecked' };
  function levelOfWord(w) { var t = String(w).trim().toLowerCase(); return RELEVANCE.filter(function (r) { return REL_NAMES[r].toLowerCase() === t; })[0] || ''; }
  // a level given as a tag, the highest if there are two; else the field
  function relOf(e) {
    var from = tagsOf(e).map(levelOfWord).filter(Boolean).sort(function (a, b) { return RELEVANCE.indexOf(a) - RELEVANCE.indexOf(b); })[0];
    if (from) return from;
    var r = String(e.relevance || '').trim().toLowerCase(); r = REL_OLD[r] || r;
    return REL_NAMES[r] ? r : '';
  }
  function relRank(e) { var i = RELEVANCE.indexOf(relOf(e)); return i < 0 ? RELEVANCE.length : i; }
  // the group's marks over the list's: a mark added goes after the list's key works, by when it was made
  var KM = {}, KADD = {}, KMINE = {}, KS = '{}';
  function keyOf(e) {
    var m = KM[e.id], k = Number(e.key);
    if (m && !m.on) return Infinity;
    return k > 0 ? k : m ? KADD[e.id] : Infinity;
  }
  function setKeys(k) {
    Object.keys(KMINE).forEach(function (id) { if (!k[id] || String(k[id].date) < String(KMINE[id].date)) k[id] = KMINE[id]; });
    var sig = JSON.stringify(k), moved = sig !== KS;
    KM = k; KS = sig;
    var top = L.items().reduce(function (t, e) { var n = Number(e.key); return n > t ? n : t; }, 0);
    KADD = {};
    Object.keys(k).filter(function (id) { return k[id].on; }).sort(function (a, b) { return String(k[a].date) < String(k[b].date) ? -1 : 1; })
      .forEach(function (id, i) { KADD[id] = top + i + 1; });
    return moved;
  }
  // What a reference leads with, by Cite Them Right Harvard: the author; with none, a volume's editors, "(ed.)" or
  // "(eds)"; a newspaper or magazine piece's publication (in); a web page's or report's organisation (publisher);
  // else the title, with the year after it
  function namesList(ns) { return ns.length < 2 ? ns.join('') : ns.slice(0, -1).join(', ') + ' and ' + ns[ns.length - 1]; }
  function editorsText(e) { var ns = rolesOf(e).editor; return ns.length ? namesList(ns) + (ns.length > 1 ? ' (eds)' : ' (ed.)') : ''; }
  function leadOf(e) {
    e = e || {};
    if (String(e.author || '').trim()) return { by: 'author', text: String(e.author).trim() };
    var fam = L.family(e), k = String(e.kind || '').trim().toLowerCase();
    if (fam !== 'chapter' && e.contributor && rolesOf(e).editor.length) return { by: 'editors', text: editorsText(e) };
    if (fam === 'news' && inOf(e)) return { by: 'publication', text: pubName(inOf(e)) };
    if ((fam === 'web' || k === 'report') && String(e.publisher || '').trim()) return { by: 'org', text: String(e.publisher).trim() };
    return { by: 'title', text: String(e.title || '').trim() };
  }
  L.leadOf = leadOf;
  // a publication's name without its issue: "Creative Computing 4(1)", "BYTE, June 1977", "Financial Times, no. 27293"
  function pubName(w) {
    w = String(w || '').trim();
    var n = w.replace(/\s*[,;:]\s*(?:vol\b|vol\.|volume\b|no\b|no\.|nos?\.|issue\b|number\b|n[º°]|(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?(?=\s|$)|\d).*$/i, '')
      .replace(/\s+\d[\d()\/.\-–]*(?:\s.*)?$/, '').trim();
    return n || w;
  }
  L.pubName = pubName;
  // the name a work files under: whatever leads its reference, an author's or editor's surname, else the name
  // or title without its opening article, so works with no author file among those with one
  L.sortName = function (e) {
    var ld = leadOf(e);
    if (ld.by === 'author') return L.surname(e.author);
    if (ld.by === 'editors') return L.surname(rolesOf(e).editor[0]);
    return titleKey(ld.text).replace(/^[\s"'“”‘’«»„(\[{¿¡*.,:;!?\-–—]+/, '');
  };
  L.sorted = function (items, order) {
    var byTitle = function (a, b) { return AZ(titleKey(a.title), titleKey(b.title)); };
    // what has no value for this order goes after what has
    function by(key, then) { return function (a, b) { var x = key(a), y = key(b); if (!x !== !y) return x ? -1 : 1; return (x && AZ(x, y)) || then(a, b); }; }
    function byYear(sign) { return function (a, b) { var x = L.year(a.date), y = L.year(b.date); if ((x == null) !== (y == null)) return x == null ? 1 : -1; return (x == null ? 0 : sign * (x - y)) || byTitle(a, b); }; }
    var byAuthor = by(L.sortName, byYear(1));
    var fn = order === 'title' ? byTitle : order === 'new' ? byYear(-1) : order === 'old' ? byYear(1) :
      order === 'kind' ? by(function (e) { return e.kind; }, byTitle) : order === 'lang' ? by(function (e) { return e.lang; }, byTitle) :
      order === 'author' ? byAuthor :
      order === 'relevance' ? (function () {
        var rk = {};
        items.forEach(function (e) { rk[e.id] = relRank(e); });
        return function (a, b) { var x = keyOf(a), y = keyOf(b); if (x !== y) return x < y ? -1 : 1; return (rk[a.id] - rk[b.id]) || byAuthor(a, b); };
      })() :
      order === 'rating' ? function (a, b) { var x = NR[a.id] ? NR[a.id].avg : 0, y = NR[b.id] ? NR[b.id].avg : 0; return (y - x) || byTitle(a, b); } : null;
    return fn ? items.slice().sort(fn) : items.slice();
  };
  var ORDERS = [['relevance', 'By relevance'], ['author', 'Author'], ['title', 'Title'], ['new', 'Date, newest first'], ['old', 'Date, oldest first'], ['kind', 'Kind'], ['lang', 'Language'], ['rating', 'Rating'], ['listed', 'As listed']];

  // ---------- covers ----------
  // what a cover is drawn as: a kind's own word first, then what the file is
  var FAMILY = { book: 'book', monograph: 'book', edition: 'book', 'edited volume': 'book', anthology: 'book', 'parallel text': 'book', translation: 'book', thesis: 'thesis', dissertation: 'thesis',
    article: 'article', paper: 'article', essay: 'article', review: 'article', report: 'article', preprint: 'article', conference: 'article', 'conference paper': 'article', proceedings: 'article',
    news: 'news', newspaper: 'news', magazine: 'news', encyclopedia: 'web', encyclopaedia: 'web', chapter: 'chapter', letter: 'letter', correspondence: 'letter',
    podcast: 'audio', interview: 'audio', radio: 'audio', recording: 'audio', talk: 'talk', lecture: 'talk', keynote: 'talk', seminar: 'talk',
    documentary: 'film', film: 'film', video: 'film', 'web page': 'web', webpage: 'web', website: 'web', blog: 'web', 'blog post': 'web', site: 'web' };
  L.family = function (e) {
    var f = FAMILY[String(e.kind || '').trim().toLowerCase()];
    if (f) return f;
    var k = e.file ? kindOfFile(e.file) : '';
    return k === 'audio' ? 'audio' : k === 'video' ? 'film' : k === 'pdf' || k === 'text' || k === 'md' ? 'article' : k === 'html' ? 'web' : !e.file && e.url && !e.kind ? 'web' : 'other';
  };
  var GLYPH = {
    book: '<path d="M6 3h11a2 2 0 0 1 2 2v14H8a2 2 0 0 0-2 2zM6 21a2 2 0 0 1 0-4h13"/>',
    thesis: '<path d="M2 9l10-5 10 5-10 5zM6 11.5V16c2 2 10 2 12 0v-4.5M22 9v6"/>',
    article: '<path d="M6 2h9l4 4v16H6zM15 2v4h4M9 11h7M9 14h7M9 17h5"/>',
    chapter: '<path d="M12 6c-2-2-5-2-9-2v15c4 0 7 0 9 2 2-2 5-2 9-2V4c-4 0-7 0-9 2zM12 6v15"/>',
    letter: '<path d="M3 5h18v14H3zM3 6l9 7 9-7"/>',
    audio: '<path d="M9 3h6v11H9zM5 11v3a7 7 0 0 0 14 0v-3M12 21v-3"/>',
    talk: '<path d="M4 4h16v11H9l-5 5z"/>',
    film: '<path d="M3 4h18v16H3zM8 4v16M16 4v16M3 9h5M3 15h5M16 9h5M16 15h5"/>',
    news: '<path d="M3 5h15v14a2 2 0 0 0 2 2H5a2 2 0 0 1-2-2zM18 9h3v10a1.500 1.500 0 0 1-3 0M6 9h9M6 13h4M6 16h4M12.500 13h2.500v3h-2.500z"/>',
    web: '<path d="M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/>',
    other: '<path d="M3 7h6l2 2h10v11H3z"/>'
  };
  function glyph(f) { return '<svg class="lib-glyph" viewBox="0 0 24 24" aria-hidden="true">' + (GLYPH[f] || GLYPH.other) + '</svg>'; }
  // the entry's own picture, where it has one a reader may be shown
  function thumbOf(e) { return e.thumb || (e.file && !isPrivate(e) && kindOfFile(e.file) === 'image' ? e.file : ''); }
  var CLOTH = ['#1f3a5f', '#6b1e2b', '#23493a', '#4a3b6b', '#3d4a52', '#7a4a12', '#0f5e63', '#2c2c2c'];
  function cloth(id) { var h = 0; String(id).split('').forEach(function (c) { h = (h * 31 + c.charCodeAt(0)) >>> 0; }); return CLOTH[h % CLOTH.length]; }
  function hostName(u) { return /youtu\.?be/i.test(u) ? 'YouTube' : /vimeo/i.test(u) ? 'Vimeo' : /archive\.org/i.test(u) ? 'the Internet Archive' : host(u); }
  function host(u) { var m = /^https?:\/\/(?:www\.)?([^/]+)/i.exec(u || ''); return m ? m[1] : ''; }
  function coverOf(e) {
    var f = L.family(e), who = e.author ? '<span class="lib-c-a">' + esc(e.author) + '</span>' : '';
    var word = f === 'book' && /^(book|monograph|)$/i.test(String(e.kind || '').trim()) ? '' : '<span class="lib-c-k">' + glyph(f) + esc(e.kind || (f === 'web' ? 'web page' : f === 'audio' ? 'audio' : f === 'film' ? 'film' : '')) + '</span>';
    return '<span class="lib-cover lib-c-' + f + '" aria-hidden="true"' + (f === 'book' || f === 'thesis' ? ' style="--cloth:' + (f === 'thesis' ? '#22262b' : cloth(e.id)) + '"' : '') + '>' +
      (f === 'web' ? '<span class="lib-c-chrome"><i></i><i></i><i></i></span>' : '') + word +
      '<span class="lib-c-t">' + esc(e.title) + '</span>' + (f === 'web' && !e.author && host(e.url) ? '<span class="lib-c-a">' + esc(host(e.url)) + '</span>' : who) + '</span>';
  }
  // ---------- To read: loans to this reader ----------
  function today() { return new Date().toISOString().slice(0, 10); }
  // on a card: NOV 07 26
  function stampOf(day) { if (!day) return 'NO DATE'; var d = new Date(day + 'T00:00:00Z'), two = function (n) { return (n < 10 ? '0' : '') + n; }; return MON3[d.getUTCMonth()] + ' ' + two(d.getUTCDate()) + ' ' + two(d.getUTCFullYear() % 100); }
  // on a cover: DUE DEC 7
  var MON3 = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  function dueShort(day) { var d = new Date(day + 'T00:00:00Z'); return MON3[d.getUTCMonth()] + ' ' + d.getUTCDate(); }
  function plusMonths(day, n) { var d = new Date((day || today()) + 'T00:00:00Z'); d.setUTCMonth(d.getUTCMonth() + n); return d.toISOString().slice(0, 10); }
  function borrower() { var me = SW.me(); return SW.store.get('library.sign', 'name') === 'initials' ? me.initials || me.name || 'You' : me.name || me.initials || 'You'; }
  // how many days before its date a work is due soon; 0, only when overdue
  function soonDays() { var n = parseInt(SW.store.get('library.dueSoon', 7), 10); return isNaN(n) || n < 0 ? 7 : n; }
  function dueSoon(due, t) { return !!due && (due < t || (soonDays() > 0 && due <= plusDays(t, soonDays()))); }
  var LOANS = null;
  function loans() { if (!LOANS) { var l = SW.store.get('library.loans', {}); LOANS = l && typeof l === 'object' && !Array.isArray(l) ? l : {}; } return LOANS; }
  function saveLoans() { SW.store.set('library.loans', LOANS || {}); }
  // past its date a work goes back into the library
  function sweepLoans() {
    var l = loans(), t = today(), moved = false;
    Object.keys(l).forEach(function (c) { var h = l[c] || [], cur = h[h.length - 1]; if (cur && !cur.back && cur.due && cur.due < t) { cur.back = cur.due; moved = true; } });
    if (moved) saveLoans();
  }
  function onLoan(id) { var h = loans()[id] || [], cur = h[h.length - 1]; return cur && !cur.back ? cur : null; }
  L.onLoan = onLoan;
  L.loanHistory = function (evs) { return fromEvents(evs); };
  // the group's record of this reader's loans, where they have a token: events in order make the history
  function fromEvents(evs) {
    var h = [], seen = {};
    evs.forEach(function (ev) {
      // loan:out:<due>[:<out>[:<ref>]], the out date where a loan made in a browser was sent up later, and a
      // reference that makes the same check-out sent twice read once
      var day = String(ev.date || '').slice(0, 10), m = /^loan:(out|ext|back)(?::(.*))?$/.exec(ev.text) || [], parts = String(m[2] || '').split(':'), due = parts[0] && parts[0] !== 'none' ? parts[0] : null, cur = h[h.length - 1], ref = parts[2] || '', ink = parts[3] || '';
      if (ref) { if (seen[ref]) return; seen[ref] = true; }
      var outDay = /^\d{4}-\d\d-\d\d$/.test(parts[1] || '') ? parts[1] : day;
      if (m[1] === 'out' && !ref && cur && !cur.back && cur.due === due && cur.out === outDay) return;
      if (m[1] === 'out') { if (cur && !cur.back) cur.back = day; h.push({ out: outDay, due: due, by: ev.by, ref: ref, ink: ink, sent: true }); }
      else if (m[1] === 'ext' && cur && !cur.back) { cur.back = day; cur.renewed = true; h.push({ out: day, due: due, by: ev.by, renewal: true, ref: ref, ink: ink, sent: true }); }
      else if (m[1] === 'back' && cur && !cur.back) cur.back = day;
    });
    return h;
  }
  // other members' loans, from the group, for the cards and the box: { code: [rows] }
  var OTH = {}, OS = '{}';
  function setOthers(o) {
    var built = {}, t = today();
    Object.keys(o).forEach(function (c) {
      Object.keys(o[c]).forEach(function (u) {
        fromEvents(o[c][u].evs).forEach(function (r) { if (!r.back && r.due && r.due < t) r.back = r.due; r.other = true; (built[c] = built[c] || []).push(r); });
      });
    });
    var sig = JSON.stringify(built), moved = sig !== OS;
    OTH = built; OS = sig;
    return moved;
  }
  function othersOut(id) { return (OTH[id] || []).filter(function (r) { return !r.back; }); }
  // a loan made in this browser before the reader had a token goes up to the group the first time they have one
  // the group is the record where it can be read; this browser's is for a reader with no token, or offline. A loan
  // the group lacks is sent, under its own reference, so sending it again does no harm
  var UP = {};
  function newRef() { return Date.now().toString(36).slice(-5) + Math.random().toString(36).slice(2, 5); }
  function sendUp(byCode) {
    var l = loans(), now = Date.now();
    Object.keys(l).forEach(function (c) {
      var cur = onLoan(c); if (!cur || UP[c] || (PEND[c] && now - PEND[c] < 60000)) return;
      var evs = byCode[c] || [], srv = fromEvents(evs), last = srv[srv.length - 1];
      if (cur.ref && evs.some(function (ev) { return String(ev.text).split(':')[4] === cur.ref; })) return;
      if (last && !last.back) return;
      UP[c] = true;
      cur.ref = cur.ref || newRef(); cur.ink = cur.ink || newInk(); saveLoans();
      var text = 'loan:out:' + (cur.due || 'none') + ':' + cur.out + ':' + cur.ref + ':' + cur.ink;
      byCode[c] = (byCode[c] || []).concat([{ text: text, date: new Date().toISOString(), by: cur.by }]);
      synced(text, c);
    });
  }
  var LS = '';
  // the group's search can be a moment behind a loan just sent: for a minute, this browser's record of it stands
  var PEND = {};
  function setLoans(byCode) {
    var l = loans(), now = Date.now();
    Object.keys(byCode).forEach(function (c) { if (!(PEND[c] && now - PEND[c] < 60000)) l[c] = fromEvents(byCode[c]); });
    saveLoans(); sweepLoans();
    var sig = JSON.stringify(l), moved = sig !== LS; LS = sig;
    return moved;
  }
  function synced(text, id) {
    var N = itemNotes();
    if (!N || !N.setLoan || !canRate()) return;
    PEND[id] = Date.now();
    N.setLoan(id, text).catch(function (err) { SW.toast('Kept in this browser; the group did not take it: ' + err.message, 5000); });
  }
  L.checkOut = function (id, months) {
    var l = loans(), h = l[id] = l[id] || [], due = months ? plusMonths(today(), months) : null, ref = newRef(), ink = newInk();
    h.push({ out: today(), due: due, by: borrower(), ref: ref, ink: ink, sent: canRate() }); saveLoans();
    synced('loan:out:' + (due || 'none') + ':' + today() + ':' + ref + ':' + ink, id);
  };
  L.renew = function (id, months) {
    var l = loans(), h = l[id] || [], cur = h[h.length - 1]; if (!cur || cur.back) return;
    var due = months ? plusMonths(cur.due && cur.due > today() ? cur.due : today(), months) : null;
    cur.back = today(); cur.renewed = true;
    var ref = newRef(), ink = newInk();
    h.push({ out: today(), due: due, by: borrower(), renewal: true, ref: ref, ink: ink, sent: canRate() }); saveLoans();
    synced('loan:ext:' + (due || 'none') + ':' + today() + ':' + ref + ':' + ink, id);
  };
  L.giveBack = function (id) {
    var cur = onLoan(id); if (!cur) return;
    cur.back = today(); saveLoans();
    synced('loan:back', id);
  };
  function dueStamp(e) {
    var cur = onLoan(e.id); if (!cur) return '';
    return '<span class="lib-due" title="On your To read shelf' + (cur.due ? ', due back ' + esc(cur.due) : ', with no return date') + '">' + (cur.due ? 'DUE ' + dueShort(cur.due) : 'ON LOAN') + '</span>';
  }
  // What's new: works due back within the week, and those gone back in the last week
  function plusDays(day, n) { var d = new Date((day || today()) + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); }
  L.dueNews = function () {
    sweepLoans();
    var t = today(), since = plusDays(t, -7), l = loans(), out = [];
    Object.keys(l).forEach(function (c) {
      var h = l[c] || [], cur = onLoan(c), last = h[h.length - 1], e = byId(c), name = e ? e.title : c;
      var line = function (head, day) { return { day: day, html: '<div class="news-item news-due"><div class="news-meta"><b>' + head + '</b> · <button class="news-due-w" data-newslib="' + esc(c) + '">' + esc(name) + '</button></div></div>' }; };
      if (cur && dueSoon(cur.due, t)) { var a = line(cur.due < t ? 'Overdue' : 'Due back ' + dueShort(cur.due), cur.due); a.alert = true; out.push(a); }
      else if (!cur && last && last.back && last.due && last.back === last.due && last.back >= since) out.push(line('Gone back to the library ' + dueShort(last.back), last.back));
    });
    return out.sort(function (a, b) { return (!!b.alert - !!a.alert) || (a.day < b.day ? -1 : 1); });
  };
  if (SW.notes && SW.notes.addNewsSource) {
    SW.notes.addNewsSource(L.dueNews);
    // the titles come with the list: read it once if there are loans to tell of
    if (Object.keys(loans()).length) L.load().then(function () { SW.notes.paintNews(); }, function () {});
  }
  document.addEventListener('click', function (ev) { var b = ev.target.closest && ev.target.closest('[data-newslib]'); if (b) L.open(b.dataset.newslib); });
  // the card in the book's pocket, after the old library cards
  // old library cards came in tints, and yellowed with use: a paper for each work, a little older for each line
  // creams and buffs a shade apart, and now and then an orange card, as some libraries had
  var PAPERS = ['#f4ecd4', '#f2e8cc', '#f6efdc', '#efe5cb', '#f3eacf', '#f1ead9', '#f5ebd3'], ODD = '#e9b97a';
  function hashOf(s) { var h = 0; String(s).split('').forEach(function (c) { h = (h * 31 + c.charCodeAt(0)) >>> 0; }); return h; }
  // a card keeps its paper once chosen, and its age only grows, whatever later kits or a trimmed history say
  function cardKept(code, stamps) {
    var all = SW.store.get('library.cards', {}) || {}, k = all[code] || {}, h = hashOf(code), age = Math.min(Math.max(stamps - 1, 0), 8), moved = false;
    if (!k.paper) { k.paper = h % 11 === 3 ? ODD : PAPERS[h % PAPERS.length]; moved = true; }
    if (!(k.age >= age)) { k.age = age; moved = true; }
    if (moved) { all[code] = k; SW.store.set('library.cards', all); }
    return k;
  }
  L.cardKept = cardKept;
  function paperOf(code, stamps) {
    var kept = cardKept(code, stamps), age = kept.age;
    // a card in heavy use yellows, and its edges darken where hands have held it
    return 'background-color:' + kept.paper + ';filter:sepia(' + (age * 0.07).toFixed(2) + ') brightness(' + (1 - age * 0.015).toFixed(3) + ');' +
      'box-shadow:inset 0 0 ' + (6 + age * 5) + 'px rgba(120, 78, 20, ' + (age * 0.045).toFixed(3) + '), 1px 2px 3px rgba(0, 0, 0, 0.18), 4px 6px 14px rgba(0, 0, 0, 0.12)';
  }
  // each line in its own pen, and its dates in the desk's stamp ink
  var PENS = ['#1f2c6b', '#1f2c6b', '#2a2a2a', '#2f4f8f', '#1f2c6b', '#3b2a6b'], STAMPS = ['#3a3a5a', '#4b2f6b', '#2a2a2a', '#3a3a5a'];
  function aged(hex) {
    var n = parseInt(hex, 16), r = (n >> 16) / 255, g = (n >> 8 & 255) / 255, b = (n & 255) / 255, mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, d = mx - mn, s = d ? d / (1 - Math.abs(2 * l - 1)) : 0, hh = 0;
    if (d) hh = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
    hh = hh * 60; if (hh < 0) hh += 360;
    if (s < 0.08) { hh = 30; s = 0.28; }
    l = l + (0.74 - l) * 0.42; s = s * 0.8;
    var c = (1 - Math.abs(2 * l - 1)) * s, x = c * (1 - Math.abs((hh / 60) % 2 - 1)), m = l - c / 2, k = Math.floor(hh / 60) % 6;
    var rgb = [[c, x, 0], [x, c, 0], [0, c, x], [0, x, c], [x, 0, c], [c, 0, x]][k];
    return rgb.map(function (v) { return ('0' + Math.round((v + m) * 255).toString(16)).slice(-2); }).join('');
  }
  L.aged = aged;
  function newInk() { var h = Math.floor(Math.random() * 1e6); return PENS[h % PENS.length].slice(1) + '.' + STAMPS[(h >> 3) % STAMPS.length].slice(1); }
  function inksOf(r) {
    var ink = /^[0-9a-f]{6}\.[0-9a-f]{6}$/i.test(r.ink || '') ? r.ink.split('.') : null, h = hashOf((r.by || '') + (r.out || '') + (r.due || ''));
    var pen = ink ? ink[0] : PENS[h % PENS.length].slice(1), stamp = ink ? ink[1] : STAMPS[(h >> 3) % STAMPS.length].slice(1);
    // a line crossed out has had time to fade, in its own colour
    if (r.back) { pen = aged(pen); stamp = aged(stamp); }
    return 'style="color:#' + pen + '"|style="color:#' + stamp + '"';
  }
  function cardLines(id) { return (loans()[id] || []).concat(OTH[id] || []).sort(function (a, b) { return a.out < b.out ? -1 : a.out > b.out ? 1 : 0; }); }
  function cardRow(r) {
    var ink = inksOf(r).split('|');
    return '<tr class="' + (r.back ? 'lib-card-done' : '') + (r.other ? ' lib-card-other' : '') + '"><td class="lib-card-d" ' + ink[1] + '>' + stampOf(r.out) + '</td><td class="lib-card-who"><span ' + ink[0] + '>' + esc(r.by || '') + '</span></td><td class="lib-card-d" ' + ink[1] + '>' + stampOf(r.due) + '</td></tr>';
  }
  var CARD_HEAD = '<thead><tr><th>Date<br>loaned</th><th>Borrower’s name</th><th>Date<br>due</th></tr></thead>';
  function cardGrid(id, h) {
    var per = F.size === 's' ? 3 : 6, sheets = Math.max(1, Math.ceil(h.length / per));
    var rows = function (list) { var x = list.map(cardRow); while (x.length < per) x.push('<tr><td></td><td></td><td></td></tr>'); return '<tbody>' + x.join('') + '</tbody>'; };
    var top = '<table class="lib-card-t">' + CARD_HEAD + rows(h.slice((sheets - 1) * per)) + '</table>';
    if (sheets < 2) return top;
    return '<div class="lib-card-sheet"><table class="lib-card-t lib-card-under" aria-hidden="true">' + CARD_HEAD + rows(h.slice((sheets - 2) * per, (sheets - 1) * per)) + '</table>' +
      '<div class="lib-sticker' + (sheets > 2 ? ' lib-sticker-more' : '') + '" role="button" tabindex="0" data-cardall="' + esc(id) + '" title="Every line on this card (' + h.length + ')" aria-label="Every line on this card (' + h.length + ')">' + top + '</div></div>';
  }
  // every line on a card, stickers lifted
  function showCardAll(id) {
    var e = byId(id), h = cardLines(id), d = SW.el('dialog', { class: 'tray-big lib-dlg lib-cardall-dlg' });
    d.innerHTML = '<div class="tray-bighead"><b>' + esc(e ? e.title : id) + '</b><button class="icon-btn" data-x title="Close (Esc)">✕</button></div>' +
      '<div class="lib-card-all" style="' + paperOf(id, h.length) + '"><table class="lib-card-t">' + CARD_HEAD + '<tbody>' + h.map(cardRow).join('') + '</tbody></table></div>';
    document.body.appendChild(d);
    d.addEventListener('close', function () { d.remove(); });
    d.addEventListener('click', function (ev) { if (ev.target === d || ev.target.closest('[data-x]')) d.close(); });
    d.showModal();
    return d;
  }
  L.showCardAll = showCardAll;
  function cardOf(e) {
    var h = cardLines(e.id), cur = onLoan(e.id), t = today();
    var stamps = (loans()[e.id] || []).length + (OTH[e.id] || []).length;
    // within a week of its date, or past it, the card is stamped to say so
    var soon = cur && dueSoon(cur.due, t) ? (cur.due < t ? 'OVERDUE' : 'DUE SOON') : '';
    return '<article class="lib-card' + (FLIP[e.id] ? ' flipped' : '') + (soon ? ' lib-card-soon' : '') + '" data-card="' + esc(e.id) + '" data-face="' + esc(e.id) + '" style="' + paperOf(e.id, stamps) + '"><div class="lib-face lib-front">' + TURN +
      (soon ? '<span class="lib-card-soonstamp">' + soon + '</span>' : '') +
      // the reader knows which library they are in: the card names who the work is by
      '<div class="lib-card-lib">Book Card' + (function () { var ld = leadOf(e); return ld.by === 'title' ? '' : ' <span class="lib-card-bar">|</span> <span>' + esc(ld.text) + '</span>'; })() + '</div>' +
      '<div class="lib-card-label">' + (L.callNo(e) ? '<span class="lib-card-call">' + esc(L.callNo(e)) + '</span> ' : '') + '<button class="lib-card-code" data-lib="' + esc(e.id) + '" title="Open this work">' + esc(e.id) + '</button><span class="lib-cl-a" title="' + esc(e.author || '') + '">' + esc(e.author || '') + '</span><button class="lib-card-title" data-lib="' + esc(e.id) + '" title="' + esc(e.title) + '">' + esc(e.title) + '</button></div>' +
      cardGrid(e.id, h) +
      '<div class="lib-card-acts">' + (cur ? '<span class="lib-loanbox"><button class="btn ghost lib-ib on" data-cardloan aria-haspopup="true" aria-expanded="false" title="Renew or return" aria-label="Renew or return">' + ICON.mark(true) + '</button><span class="lib-loandue">' + (cur.due ? 'DUE ' + dueShort(cur.due) : 'ON LOAN') + '</span>' +
        '<div class="lib-loanmenu" hidden><span class="lib-loanst">Renew for:</span><button class="btn ghost" data-ext="1">1</button><button class="btn ghost" data-ext="2">2</button><button class="btn ghost" data-ext="3">3 months</button><button class="btn ghost" data-ext="0" title="Keep it with no return date">No date</button><button class="btn ghost" data-ret>Return</button></div></span> ' : '') +
      '<button class="btn ghost" data-lib="' + esc(e.id) + '">Open</button></div></div>' + backOf(e.id) + '</article>';
  }
  var LOGOPEN = false;
  // the search box and the Order menu follow the tab: To read has its own order, by date due first
  function syncShelf(view) {
    var shelf = F.show === 'loans', o = SW.$('.lib-order select', view), q = SW.$('.lib-q', view);
    if (q) { q.placeholder = shelf ? 'Search your To read shelf' : 'Search the library'; q.setAttribute('aria-label', q.placeholder); }
    if (!o) return;
    var dueOpt = SW.$('option[value="due"]', o);
    if (shelf && !dueOpt) o.insertBefore(SW.el('option', { value: 'due' }, 'Date due'), o.firstChild);
    if (!shelf && dueOpt) dueOpt.remove();
    o.value = shelf ? (F.loanOrder || 'author') : F.order;
  }
  // every work this reader has had out, with their own rating where the group has one from them
  function logHTML() {
    var l = loans(), codes = Object.keys(l).filter(function (c) { return (l[c] || []).length && byId(c); });
    codes.sort(function (a, b) { var x = l[a][l[a].length - 1].out, y = l[b][l[b].length - 1].out; return x < y ? 1 : x > y ? -1 : 0; });
    // folded by default; opened, it stays open while the reader is here
    var head = '<details class="lib-log"' + (LOGOPEN ? ' open' : '') + '><summary class="lib-log-h">Your reading log <button class="btn ghost" data-mynotes title="The notes you have written on works in the library">Your notes</button></summary>';
    if (!codes.length) return head + '<p class="hint">Works you check out are kept here, with your rating of each.</p></details>';
    return head + '<table class="lib-log-t"><thead><tr><th>Work</th><th>First out</th><th>Back</th><th>Loans</th><th>Your rating</th></tr></thead><tbody>' + codes.map(function (c) {
      var h = l[c], e = byId(c), last = h[h.length - 1], mine = NR[c] && canRate() ? myStars(NR[c]) : 0;
      return '<tr><td><button class="lib-log-w" data-lib="' + esc(c) + '">' + esc(e.title) + '</button><span class="faint"> ' + esc(e.author || '') + '</span></td>' +
        '<td class="mono">' + stampOf(h[0].out) + '</td><td class="mono">' + (onLoan(c) ? 'ON LOAN' : stampOf(last.back)) + '</td>' +
        '<td>' + h.filter(function (r) { return !r.renewal; }).length + '</td>' +
        '<td>' + (mine ? '<span class="lib-stars">' + stars(mine) + '</span>' : '<span class="faint">' + (canRate() ? 'not rated' : '') + '</span>') + '</td></tr>';
    }).join('') + '</tbody></table></details>';
  }
  // the notes this reader has written on works in the library, in a box of their own
  function showMyNotes() {
    var N = itemNotes(), d = SW.el('dialog', { class: 'tray-big lib-dlg' });
    d.innerHTML = '<div class="tray-bighead"><b>Your notes on works in the library</b><button class="icon-btn" data-x title="Close (Esc)">✕</button></div><div class="lib-mynotes"><p class="hint">Reading your notes…</p></div>';
    document.body.appendChild(d);
    d.addEventListener('close', function () { d.remove(); });
    d.addEventListener('click', function (ev) {
      if (ev.target === d || ev.target.closest('[data-x]')) { d.close(); return; }
      var r = ev.target.closest('[data-lib]'); if (r) { d.close(); L.open(r.dataset.lib); }
    });
    d.showModal();
    var at = SW.$('.lib-mynotes', d);
    if (!N) { at.innerHTML = '<p class="hint">This bench has no annotation group.</p>'; return Promise.resolve(); }
    return N.itemNotes().then(function (all) {
      var by = {};
      all.filter(function (n) { return !N.isReaction(n) && N.mine(n); }).forEach(function (n) { var c = N.itemCode(n.vid); (by[c] = by[c] || []).push(n); });
      var codes = Object.keys(by).sort(function (a, b) { return titleOf(a) < titleOf(b) ? -1 : 1; });
      at.innerHTML = codes.length ? codes.map(function (c) {
        return '<section class="lib-mynote-w"><button class="lib-nhead" data-lib="' + esc(c) + '"><span class="px-code mono">' + esc(c) + '</span> <b>' + esc(titleOf(c)) + '</b></button>' +
          by[c].map(function (n) {
            return '<div class="lib-mynote"><div class="faint">' + esc(SW.fmtDate(n.date)) + (n.parent ? ' · reply' : '') + (n.at ? ' · ' + esc(N.atLabel(n.at)) : '') + (n.source === 'draft' ? ' · <span class="note-draft">Draft: this browser only</span>' : '') + '</div>' +
              (n.quote ? '<blockquote class="note-quote">' + esc(n.quote) + '</blockquote>' : '') + '<div class="note-md">' + SW.md(n.text) + '</div></div>';
          }).join('') + '</section>';
      }).join('') : '<p class="hint">You have not written notes on works in the library yet.</p>';
    }, function (err) { at.innerHTML = '<p class="hint in-fail"><span class="in-fail-t">Notes not updated</span> ' + esc(err.message) + '</p>'; });
  }
  L.showMyNotes = showMyNotes;
  // ---------- the back of a card: the group's notes on the work, scribbled ----------
  var FLIP = {}, BACK = {};
  var TURN = '<button class="lib-turn" data-turn title="Turn the card over: the notes on its back" aria-label="Turn the card over">↻</button>';
  function backOf(code) {
    return '<div class="lib-face lib-back" aria-label="The back of the card">' + TURN.replace('Turn the card over: the notes on its back', 'Turn the card back').replace('Turn the card over', 'Turn the card back') +
      '<div class="lib-scrawls">' + (BACK[code] || '') + '</div>' +
      '<button class="lib-addnote" data-addnote="' + esc(code) + '" title="Write a note on this work">Add Annotation</button></div>';
  }
  function fillBack(code, view) {
    var N = itemNotes();
    if (!N) { BACK[code] = '<p class="lib-scrawl faint">This bench has no annotation group.</p>'; return Promise.resolve(); }
    return N.itemNotes().then(function (all) {
      var ns = all.filter(function (n) { return !N.isReaction(n) && N.itemCode(n.vid) === code; }).sort(function (a, b) { return String(a.date) < String(b.date) ? -1 : 1; });
      BACK[code] = ns.length ? ns.map(function (n, i) {
        return '<div class="lib-scrawl" style="--r:' + ((i % 3) - 1) * 0.6 + 'deg">' + (n.parent ? '↳ ' : '') + '<span class="lib-scrawl-t">' + SW.md(String(n.text)) + '</span> <span class="lib-scrawl-by">' + esc(n.by || '') + ', ' + esc(SW.fmtDate(n.date)) + '</span></div>';
      }).join('') : '';
    }, function (err) { BACK[code] = '<p class="lib-scrawl faint">' + esc(err.message) + '</p>'; }).then(function () {
      SW.$$('[data-face="' + code + '"] .lib-scrawls', view || document).forEach(function (s) { s.innerHTML = BACK[code]; });
    });
  }
  L.flipped = FLIP;
  // a card's back follows its notes: a note added, changed or removed is written on it at once
  function refreshBack(code) { delete BACK[code]; if (FLIP[code]) fillBack(code, SW.$('#view-library')); }
  if (SW.on) SW.on('notes', function (vid) { if (/^item:/.test(String(vid || ''))) refreshBack(String(vid).slice(5)); });
  // Add Annotation: the work's box, its notes open and the writing place ready
  function addNote(code) {
    return L.open(code).then(function () {
      setTimeout(function () {
        var ds = document.querySelectorAll('dialog.lib-dlg'), d = ds[ds.length - 1]; if (!d) return;
        // and once more as the box closes, for a group whose search is a moment behind
        d.addEventListener('close', function () { setTimeout(function () { refreshBack(code); }, 600); });
        var f = SW.$('.in-fold', d); if (f) f.open = true;
        var t = SW.$('.in-new .md-rich', d) || SW.$('.in-new textarea', d);
        if (t) { t.scrollIntoView({ block: 'center' }); t.focus(); }
      }, 150);
    });
  }
  // the pinned head's height and the view's, so the filter column can sit under the one and fit the other
  var PINRO = null;
  function pinFacets(view) {
    var top = SW.$('.lib-top', view); if (!top) return;
    var set = function () { view.style.setProperty('--lib-top', top.offsetHeight + 'px'); view.style.setProperty('--lib-vh', view.clientHeight + 'px'); };
    set();
    if (PINRO) PINRO.disconnect();
    if (root.ResizeObserver) { PINRO = new ResizeObserver(set); PINRO.observe(top); PINRO.observe(view); }
  }
  // ---------- the reader's library card, and the Library's settings ----------
  // after the plastic student cards of the late 1960s: the bench's name over a red ground, a seal, and a
  // window with the card's number, the reader's initials and name embossed
  var SEAL = '<svg class="lib-idcard-e" viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="29"/><circle cx="32" cy="32" r="24"/>' +
    '<path d="M15 24c7-2.5 12.5-1.5 17 2.5 4.5-4 10-5 17-2.5v19c-7-2.5-12.5-1.5-17 2.5-4.5-4-10-5-17-2.5zM32 26.5v19M19 29c4-1 7-.5 10 1M19 34c4-1 7-.5 10 1M35 30c3-1.5 6-2 10-1M35 35c3-1.5 6-2 10-1"/></svg>';
  // the day the reader joined: their first check-out, else the first time the card was shown; kept once known
  function joined() {
    var j = SW.store.get('library.joined', ''), l = loans(), first = '';
    Object.keys(l).forEach(function (c) { (l[c] || []).forEach(function (r) { if (r.out && (!first || r.out < first)) first = r.out; }); });
    if (first && (!j || first < j)) j = first;
    if (!j) j = today();
    SW.store.set('library.joined', j);
    return j;
  }
  function cardNo(ini, name, acct) { return ('00000' + (hashOf(acct || (ini + '|' + name)) % 100000)).slice(-5); }
  // the back: who holds the card, where the bench and its records are kept, and the conditions, as on the old cards
  function idBack(ini, name, acct) {
    var title = String(B.title || B.name || 'The Bench'), l = loans(), on = 0, ever = 0;
    Object.keys(l).forEach(function (c) { var h = l[c] || []; ever += h.filter(function (r) { return !r.renewal; }).length; if (onLoan(c)) on++; });
    var grp = SW.notes && SW.notes.groupId ? SW.notes.groupId(SW.groupSet ? SW.groupSet() : '') : '', who = String(acct || '').replace(/^acct:/, '').replace(/@hypothes\.is$/, '');
    var repo = L.privateRepo(), here = location.host + location.pathname.replace(/index\.html$/, '');
    var row = function (k, v) { return '<div class="lib-idb-r"><span>' + k + '</span><b>' + v + '</b></div>'; };
    return '<div class="lib-idcard lib-idcard-back" aria-hidden="true"><div class="lib-idb">' +
      '<div class="lib-idb-h">' + esc(title) + ' · Library</div>' +
      row('Holder', esc(name || '—') + (ini ? ' (' + esc(ini) + ')' : '')) +
      row('Card no.', 'L ' + cardNo(ini, name, acct)) +
      row('Member since', esc(stampOf(joined()))) +
      row('Bench', esc(here)) +
      row('Hypothesis', grp ? 'group ' + esc(grp) + (who ? ' · ' + esc(who) : '') : 'no group set') +
      row('GitHub', repo ? esc(repo) + (tokenOf() ? ' · token held' : ' · no token') : 'none') +
      row('On loan', on + ' now · ' + ever + ' taken out') +
      '<div class="lib-idb-sig"><span>Signature</span></div>' +
      '<div class="lib-idb-f">This card is issued for the use of the holder only and must be shown on request. If found, please return it to the library desk.</div>' +
      '</div></div>';
  }
  L.idBack = idBack;
  function idCard(ini, name, acct) {
    var title = String(B.title || B.name || 'The Bench'), len = title.length;
    var n = cardNo(ini, name, acct), d = new Date(), y0 = d.getMonth() >= 8 ? d.getFullYear() : d.getFullYear() - 1;
    var fs = len <= 14 ? 8.6 : len <= 20 ? 7 : len <= 28 ? 5.6 : 4.4;
    return '<div class="lib-idcard" role="img" aria-label="' + esc(title + ' library card' + (name || ini ? ': ' + (name || ini) : '')) + '">' +
      '<div class="lib-idcard-red"><div class="lib-idcard-t" style="font-size:' + fs + 'cqw">' + esc(title) + '</div>' + SEAL + '<div class="lib-idcard-k">Library<br>Card</div></div>' +
      '<div class="lib-idcard-w"><div class="lib-idcard-n"><span class="lib-idcard-s">L</span> ' + n.split('').join(' ') + '<span class="lib-idcard-i">' + esc(ini || '') + '</span></div>' +
      '<div class="lib-idcard-name">' + esc(String(name || '').toUpperCase()) + '</div><div class="lib-idcard-y">' + y0 + '–' + String(y0 + 1).slice(2) + '</div></div></div>';
  }
  L.idCard = idCard;
  if (SW.settings && SW.settings.add) {
    SW.settings.addTab('library', 'Library', 3);
    var paintId = function () {
      var at = SW.$('#set-libcard'); if (!at) return;
      var i = SW.$('#set-initials'), n = SW.$('#set-name'), iv = i ? i.value.trim() : SW.me().initials, nv = n ? n.value.trim() : SW.me().name, acct = SW.notes && SW.notes.me;
      var was = SW.$('.lib-idflip', at), turned = !!(was && was.classList.contains('turned'));
      at.innerHTML = '<div class="lib-idflip' + (turned ? ' turned' : '') + '" role="button" tabindex="0" aria-pressed="' + turned + '" title="Turn the card over" aria-label="Turn the card over">' +
        '<div class="lib-idflip-in">' + idCard(iv, nv, acct) + idBack(iv, nv, acct) + '</div></div>';
      var fl = SW.$('.lib-idflip', at), turn = function () { var t = fl.classList.toggle('turned'); fl.setAttribute('aria-pressed', String(t)); };
      fl.addEventListener('click', turn);
      fl.addEventListener('keydown', function (ev) { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); turn(); } });
    };
    var idHooked = false;
    SW.settings.add({
      tab: 'library',
      html: '<div id="set-libcard" class="set-libcard"></div>' +
        '<p class="hint">Your card for the library, with your initials and name from the You tab. Click it to turn it over.</p>' +
        '<label>Sign book cards with <select id="set-libsign"><option value="name">Your name</option><option value="initials">Your initials</option></select></label>' +
        '<p class="hint">What is written in the Borrower’s name column when you take a work for your To read shelf. Lines already written keep their name.</p>' +
        '<label>Due back soon <select id="set-libsoon"><option value="0">Only when overdue</option><option value="3">3 days before</option><option value="7">7 days before</option><option value="14">14 days before</option></select></label>' +
        '<p class="hint">When a work on your To read shelf is stamped DUE SOON, and named at the top of What’s new.</p>',
      load: function () {
        SW.$('#set-libsign').value = SW.store.get('library.sign', 'name') === 'initials' ? 'initials' : 'name';
        var sv = String(soonDays()), so = SW.$('#set-libsoon');
        if (!SW.$('option[value="' + sv + '"]', so)) so.appendChild(SW.el('option', { value: sv }, sv + ' days before'));
        so.value = sv;
        paintId();
        if (!idHooked) {
          idHooked = true;
          ['#set-initials', '#set-name'].forEach(function (q) { var x = SW.$(q); if (x) x.addEventListener('input', paintId); });
          var tabs = SW.$('#dlg-settings .set-tabs'); if (tabs) tabs.addEventListener('click', function () { setTimeout(paintId, 0); });
        }
      },
      save: function () {
        SW.store.set('library.sign', SW.$('#set-libsign').value);
        SW.store.set('library.dueSoon', +SW.$('#set-libsoon').value);
        var v = SW.$('#view-library'); if (v && man) list(v);
        if (SW.notes && SW.notes.paintNews) SW.notes.paintNews();
      }
    });
  }
  // ---------- the card catalogue: drawers by author, title, subject or relevance ----------
  var CAT = { by: '', open: -1, card: 0, q: null };
  function catBy() { return CAT.by || SW.store.get('library.catby', '') || 'author'; }
  function catShort(k) { k = String(k || '').replace(/^[^A-Za-z0-9\u00c0-\uffff]+/, '').trim(); return k ? k.charAt(0).toUpperCase() + k.slice(1, 3) : '?'; }
  function catDrawers(rs) {
    var by = catBy(), cards = [];
    if (by === 'subject') rs.forEach(function (e) { var ts = plainTags(e); (ts.length ? ts : ['No subject']).forEach(function (t) { cards.push({ e: e, k: t, tab: t }); }); });
    else rs.forEach(function (e) { var who = L.sortName(e) || ''; cards.push({ e: e, k: by === 'title' ? titleKey(e.title) : who || titleKey(e.title), tab: by === 'title' ? titleKey(e.title) : who || e.title }); });
    if (by === 'relevance') {
      var groups = {}, order = ['key'].concat(RELEVANCE, ['none']);
      cards.forEach(function (c) { var g = keyOf(c.e) < Infinity ? 'key' : relOf(c.e) || 'none'; (groups[g] = groups[g] || []).push(c); });
      return order.filter(function (g) { return groups[g]; }).map(function (g) {
        var cs = groups[g].sort(function (a, b) { return g === 'key' ? keyOf(a.e) - keyOf(b.e) : AZ(a.k, b.k); });
        return { label: g === 'key' ? 'Key works' : g === 'none' ? 'No level' : REL_NAMES[g], cards: cs };
      });
    }
    cards.sort(function (a, b) { return AZ(a.k, b.k) || AZ(titleKey(a.e.title), titleKey(b.e.title)); });
    var per = Math.max(8, Math.ceil(cards.length / 15)), out = [];
    for (var i = 0; i < cards.length; i += per) { var cs = cards.slice(i, i + per); out.push({ label: catShort(cs[0].k) + ' – ' + catShort(cs[cs.length - 1].k), cards: cs }); }
    return out;
  }
  function catCard(e) {
    var s = NR[e.id], ts = plainTags(e), imp = [e.publisher || e.in, L.year(e.date) || 'n.d.'].filter(Boolean).join(', ');
    return '<div class="lib-ccard' + (FLIP[e.id] ? ' flipped' : '') + '" data-face="' + esc(e.id) + '"><div class="lib-face lib-front">' +
      '<div class="lib-cc-top">' + TURN + marksOf(e) + (s ? '<span class="lib-stars" title="' + esc(starTitle(s)) + '">' + starText(s) + '</span>' : '') + '<button class="lib-cc-code" data-lib="' + esc(e.id) + '" title="Open this work">' + esc(e.id) + '</button></div>' +
      '<div class="lib-cc-cn">' + esc(L.callNo(e)) + '</div>' +
      '<div class="lib-cc-body"><div>' + esc(e.author || '') + '</div><button class="lib-cc-ti" data-lib="' + esc(e.id) + '">' + esc(e.title) + '</button><div>' + esc(imp) + '.</div><div class="lib-cc-k">' + esc(e.kind ? e.kind.charAt(0).toUpperCase() + e.kind.slice(1) : '') + '</div></div>' +
      (ts.length ? '<div class="lib-cc-tr">' + ts.slice(0, 4).map(function (t, i) { return (i + 1) + '. ' + esc(t); }).join('&nbsp;&nbsp;') + '</div>' : '') +
      '<span class="lib-cc-hole" aria-hidden="true"></span></div>' + backOf(e.id) + '</div>';
  }
  function drawCatalogue(view, box) {
    var rs = rows(), ds = catDrawers(rs), by = catBy();
    // a search opens the drawer holding the first it finds
    if (F.q !== CAT.q) { CAT.q = F.q; if (F.q && ds.length) { CAT.open = 0; CAT.card = 0; } }
    if (CAT.open >= ds.length) CAT.open = -1;
    var d = ds[CAT.open], i = d ? Math.max(0, Math.min(CAT.card, d.cards.length - 1)) : 0;
    CAT.card = i;
    var tray = '';
    if (d) {
      var behind = d.cards.slice(i + 1, i + 7).map(function (c, j) { return { c: c, at: i + 1 + j }; }).reverse();
      tray = '<div class="lib-tray" tabindex="0" aria-label="Drawer ' + esc(d.label) + ', card ' + (i + 1) + ' of ' + d.cards.length + '. Arrow keys flick through, Enter opens the work, Escape closes the drawer.">' +
        '<div class="lib-tray-in">' + behind.map(function (b, k) { return '<button class="lib-cback" style="--k:' + k + ';--n:' + behind.length + '" data-catcard="' + b.at + '" title="' + esc(b.c.e.title) + '"><span>' + esc(String(b.c.tab).slice(0, 22)) + '</span></button>'; }).join('') + catCard(d.cards[i].e) + '</div>' +
        '<div class="lib-tray-nav"><button class="btn ghost" data-catnav="-1" aria-label="The card before">←</button><span>' + (i + 1) + ' of ' + d.cards.length + (by === 'subject' ? ' · ' + esc(d.cards[i].tab) : '') + '</span><button class="btn ghost" data-catnav="1" aria-label="The next card">→</button><button class="btn ghost" data-catclose>Close the drawer</button></div></div>';
    }
    box.classList.remove('lib-shelf', 'lib-s', 'lib-m', 'lib-l');
    box.innerHTML = rs.length ? '<div class="lib-cat"><div><p class="lib-cat-by">Browse by ' + [['author', 'Author'], ['title', 'Title'], ['subject', 'Subject'], ['relevance', 'Relevance']].map(function (b) { return '<button class="btn' + (by === b[0] ? ' on' : '') + '" data-catby="' + b[0] + '">' + b[1] + '</button>'; }).join('') + '</p>' +
      '<div class="lib-cab"><div class="lib-cab-grid">' + ds.map(function (dr, k) { return '<button class="lib-drawer' + (k === CAT.open ? ' open' : '') + '" data-drawer="' + k + '" aria-pressed="' + (k === CAT.open ? 'true' : 'false') + '" aria-label="Drawer ' + esc(dr.label) + ', ' + dr.cards.length + ' cards"><span class="lib-plate"><span>' + esc(dr.label) + '</span></span><span class="lib-pull"></span><span class="lib-dcount">' + dr.cards.length + '</span></button>'; }).join('') + '</div></div></div>' +
      (tray || '<p class="hint lib-cat-hint">Pull out a drawer to see its cards.</p>') + '</div>' : '<p class="hint pad">Nothing in the library answers the search.</p>';
    var n = SW.$('.lib-n', view); if (n) n.textContent = rs.length + ' of ' + L.items().length;
  }
  function catMove(step) { CAT.card = Math.max(0, CAT.card + step); }
  L.catalogue = CAT;
  // a work on the To read shelf as a line of the list
  function loanRow(e) {
    var cur = onLoan(e.id) || {};
    return '<tr data-card="' + esc(e.id) + '"><td><button class="lib-card-code" data-lib="' + esc(e.id) + '">' + esc(e.id) + '</button></td>' +
      '<td><button class="lib-log-w" data-lib="' + esc(e.id) + '">' + esc(e.title) + '</button><span class="faint"> ' + esc(e.author || '') + '</span></td>' +
      '<td class="mono">' + stampOf(cur.due) + '</td>' +
      '<td class="lib-loanlist-acts"><span class="faint">Renew</span> <button class="btn ghost" data-ext="1">1</button><button class="btn ghost" data-ext="2">2</button><button class="btn ghost" data-ext="3">3</button><button class="btn ghost" data-ext="0" title="No return date">∞</button> <button class="btn ghost" data-ret>Return</button></td></tr>';
  }
  function paintLoanCount(view) {
    var b = SW.$('.lib-tab[data-show="loans"]', view); if (!b) return;
    var n = Object.keys(loans()).filter(function (c) { return onLoan(c); }).length;
    b.textContent = 'To read' + (n ? ' (' + n + ')' : '');
  }
  function isPreprint(e) { return /^pre-?print$/i.test(String(e.kind || '').trim()); }
  function ppBadge(e) { return isPreprint(e) ? '<span class="lib-pp" title="A preprint, before or outside publication">Preprint</span>' : ''; }
  // the list's tags with the group's over them
  var TM = {}, TMINE = {}, TS = '{}';
  function tagsOf(e) {
    var own = TM[e.id] || {}, out = (e.tags || []).map(String).filter(function (w) { return !own[w] || own[w].on; });
    Object.keys(own).forEach(function (w) { if (own[w].on && out.indexOf(w) < 0) out.push(w); });
    return out;
  }
  L.tagsOf = tagsOf;
  function setTags(t) {
    Object.keys(TMINE).forEach(function (id) {
      t[id] = t[id] || {};
      Object.keys(TMINE[id]).forEach(function (w) { if (!t[id][w] || String(t[id][w].date) < String(TMINE[id][w].date)) t[id][w] = TMINE[id][w]; });
    });
    var sig = JSON.stringify(t), moved = sig !== TS;
    TM = t; TS = sig;
    return moved;
  }
  // the level has its own drop-down and filter
  function plainTags(e) { return tagsOf(e).filter(function (w) { return !levelOfWord(w); }); }
  // a bench whose only levels are tags gains the order when the first one comes, so the menu is drawn again
  var relShown = false;
  function afterTags(view) {
    if (L.items().some(function (e) { return relOf(e); }) !== relShown) redraw();
    else if (F.view !== 'notes') list(view);
  }
  function allTags() {
    var seen = {};
    L.items().forEach(function (e) { plainTags(e).forEach(function (w) { seen[w] = 1; }); });
    return Object.keys(seen).sort(AZ);
  }
  function marksOf(e) { return ppBadge(e) + (keyOf(e) < Infinity ? '<span class="lib-key" title="A key work">Key<span class="lib-kw"> work</span></span>' : ''); }
  // a picture that will not load leaves the drawn cover under it
  function tile(e) {
    var pic = thumbOf(e), said = [e.title, e.author, e.date, e.kind].filter(Boolean).join(', '), marks = marksOf(e);
    return '<button class="lib-tile" data-lib="' + esc(e.id) + '" title="' + esc(said) + '" aria-label="' + esc(said + '. ' + heldAs(e)) + '">' +
      '<span class="lib-stand' + (marks ? ' lib-has-mark' : '') + '">' + coverOf(e) + (pic ? '<img class="lib-thumb" src="' + esc(pic) + '" alt="" loading="lazy" referrerpolicy="no-referrer">' : '') + (marks ? '<span class="lib-marks">' + marks + '</span>' : '') + dueStamp(e) + (!pic && /^(book|thesis|chapter)$/.test(L.family(e)) && L.callNo(e) ? '<span class="lib-spine" aria-hidden="true">' + esc(L.callNo(e)) + '</span>' : '') + '</span>' +
      '<span class="lib-cap">' + (pic ? '<span class="lib-t">' + esc(e.title) + '</span>' : '') +
      '<span class="lib-m">' + [e.author, L.year(e.date) || e.date].filter(Boolean).map(esc).join(', ') + '</span>' +
      '<span class="lib-h ' + heldClass(e) + '">' + heldAs(e) + '</span></span></button>';
  }
  // a DOI in a record's text, as a link to it
  function doiLinks(html) { return html.replace(/\b10\.\d{4,9}\/[^\s;,<&]+[^\s;,<&.)]/g, function (d) { return '<a href="https://doi.org/' + d + '" target="_blank" rel="noopener noreferrer">' + d + ' ↗</a>'; }); }
  function row(e) {
    var pic = thumbOf(e);
    return '<button class="lib-row" data-lib="' + esc(e.id) + '"><span class="lib-mini lib-c-' + L.family(e) + '">' + (pic ? '<img class="lib-thumb" src="' + esc(pic) + '" alt="" loading="lazy" referrerpolicy="no-referrer">' : glyph(L.family(e))) + '</span>' +
      '<span class="lib-t">' + marksOf(e) + esc(e.title) + dueStamp(e) + '</span><span class="lib-m">' + meta(e) + '</span>' +
      '<span class="lib-h ' + heldClass(e) + '">' + heldAs(e) + '</span></button>';
  }
  // ---------- facets ----------
  // An entry's values for each facet. Values within a facet widen the choice, and facets narrow one another.
  var FACETS = [['kind', 'Kind'], ['relevance', 'Relevance'], ['lang', 'Language'], ['rating', 'Rating'], ['decade', 'Decade'], ['author', 'Author'], ['tag', 'Tag']];
  // a language's English name from its code, or the code where the browser has no name for it
  var LANGS = {};
  L.langName = function (code) {
    var c = String(code || '');
    if (!c) return '';
    if (LANGS[c]) return LANGS[c];
    var n = c;
    try { if (root.Intl && Intl.DisplayNames) n = new Intl.DisplayNames(['en'], { type: 'language', fallback: 'code' }).of(c) || c; } catch (e) { n = c; }
    LANGS[c] = n;
    return n;
  };
  // the average to the nearest star, or none
  function ratingBand(e) { var s = NR[e.id]; return s ? String(Math.max(1, Math.min(3, Math.round(s.avg)))) : 'none'; }
  function facetLabel(f, v) {
    if (f === 'lang') return L.langName(v);
    if (f === 'relevance') return REL_NAMES[v] || v;
    if (f === 'rating') return v === 'none' ? 'Not rated' : new Array(+v + 1).join('★');
    return v;
  }
  function facetTitle(f, v) {
    if (f === 'lang') return v;
    if (f === 'rating' && v !== 'none') return v + (v === '1' ? ' star' : ' stars') + ' on average, to the nearest star';
    return '';
  }
  function facetValues(e, f) {
    if (f === 'kind') return e.kind ? [String(e.kind)] : [];
    if (f === 'decade') { var y = L.year(e.date); return [y == null ? 'No date' : Math.floor(y / 10) * 10 + 's']; }
    if (f === 'author') return e.author ? String(e.author).split(/\s*(?:;|&|\band\b)\s*/).map(function (a) { return L.surname(a); }).filter(Boolean) : [];
    if (f === 'lang') return e.lang ? [String(e.lang)] : [];
    if (f === 'rating') return [ratingBand(e)];
    if (f === 'relevance') return relOf(e) ? [relOf(e)] : [];
    return plainTags(e);
  }
  function facetsOn() { return Object.keys(F.facets).some(function (f) { return Object.keys(F.facets[f] || {}).length; }); }
  function inFacets(e, skip) {
    return FACETS.every(function (x) {
      var f = x[0], on = Object.keys(F.facets[f] || {});
      return f === skip || !on.length || facetValues(e, f).some(function (v) { return F.facets[f][v]; });
    });
  }
  // which filter headings the reader has opened: shut at first, and a heading with a choice in it open
  function fOpen() { var o = SW.store.get('library.fopen', {}); return o && typeof o === 'object' ? o : {}; }
  // each facet's counts leave out its own choice, so the others in it stay to be added
  function facetHTML() {
    var FO = fOpen();
    var any = facetsOn();
    return (any ? '<button class="btn ghost lib-fclear" data-fclear>Clear these filters</button>' : '') + FACETS.map(function (x) {
      var f = x[0], c = {}, on = F.facets[f] || {};
      rows(f).forEach(function (e) { var seen = {}; facetValues(e, f).forEach(function (v) { if (!seen[v]) { seen[v] = 1; c[v] = (c[v] || 0) + 1; } }); });
      Object.keys(on).forEach(function (v) { if (!c[v]) c[v] = 0; });
      var vs = Object.keys(c);
      if (vs.length < 2 && !Object.keys(on).length) return '';
      var last = f === 'decade' ? 'No date' : 'none';
      vs.sort(f === 'relevance' ? function (a, b) { return RELEVANCE.indexOf(a) - RELEVANCE.indexOf(b); } : f === 'decade' || f === 'rating' ? function (a, b) { return a === last ? 1 : b === last ? -1 : a < b ? 1 : -1; } : function (a, b) { return (c[b] - c[a]) || AZ(a, b); });
      var cap = f === 'decade' || F.more[f] ? vs.length : 8, shown = vs.filter(function (v, i) { return i < cap || on[v]; });
      return '<details class="lib-facet" data-fgroup="' + f + '"' + (FO[f] || Object.keys(on).length ? ' open' : '') + '><summary>' + x[1] + '</summary>' + shown.map(function (v) {
        var tip = facetTitle(f, v);
        return '<button class="lib-f' + (on[v] ? ' on' : '') + '" data-facet="' + f + '" data-val="' + esc(v) + '"' + (tip ? ' title="' + esc(tip) + '"' : '') + ' aria-pressed="' + (on[v] ? 'true' : 'false') + '"><span>' + esc(facetLabel(f, v)) + '</span><i>' + c[v] + '</i></button>';
      }).join('') + (vs.length > 8 && f !== 'decade' ? '<button class="lib-fmore" data-fmore="' + f + '">' + (F.more[f] ? 'Fewer' : 'All ' + vs.length) + '</button>' : '') + '</details>';
    }).join('');
  }
  function rows(skip) {
    var q = F.q.toLowerCase();
    return L.items().filter(function (e) {
      if (F.show === 'held' && (!e.file || isPrivate(e))) return false;
      if (F.show === 'group' && !isPrivate(e)) return false;
      if (F.show === 'out' && (e.file || !e.url)) return false;
      if (F.show === 'added' && !isAdded(e)) return false;
      if (F.show === 'noted' && !NC[e.id]) return false;
      if (F.show === 'loans' && !onLoan(e.id)) return false;
      if (!inFacets(e, skip)) return false;
      if (q && [e.id, e.title, e.author, e.contributor, e.in, e.publisher, e.date, e.kind, e.note, e.licence, e.source, L.langName(e.lang), tagsOf(e).join(' ')].join(' ').toLowerCase().indexOf(q) < 0) return false;
      return true;
    });
  }
  // ---------- notes on the entries ----------
  var NC = {}, NR = {}, NRS = '{}';
  function itemNotes() { return SW.notes && SW.notes.itemNotes ? SW.notes : null; }
  // a rating as stars, the average to the nearest one. The tooltip gives a member their own rating, and a reader
  // with no token the figures
  function stars(k) { return new Array(Math.max(1, Math.min(3, Math.round(k))) + 1).join('★'); }
  function starText(s) { return stars(s.avg); }
  function myStars(s) {
    var me = SW.me ? SW.me().initials : '';
    if (!me || !s.who) return 0;
    var hit = s.who.filter(function (w) { return w.indexOf(me + ' ') === 0; }).pop();
    return hit ? +hit.split(' ').pop() : 0;
  }
  function starTitle(s) {
    if (canRate() && s.who) { var m = myStars(s); return m ? 'Your rating: ' + stars(m) : 'You have not rated this'; }
    return (Math.round(s.avg * 10) / 10) + ' from ' + s.n + (s.n === 1 ? ' rating' : ' ratings');
  }
  function paintRatings(view, r) {
    var box0 = SW.$('.lib-list', view); if (!box0) return;
    SW.$$('[data-lib]', box0).forEach(function (x) {
      var s = r[x.dataset.lib], stand = SW.$('.lib-stand', x), at = stand || SW.$('.lib-m', x), old = SW.$('.lib-rt', x);
      if (old) old.remove();
      if (s && at) at.appendChild(SW.el('span', { class: 'lib-rt' + (stand ? ' lib-rt-c' : ''), title: starTitle(s), 'aria-label': starText(s).length + ' of 3 stars. ' + starTitle(s) }, starText(s)));
    });
  }
  function paintCounts(view) {
    if (!canRate()) paintRatings(view, NR);
    var N = itemNotes(); if (!N) return;
    if (N.itemLoans && canRate()) N.itemLoans().then(function (h) { sendUp(h); if (setLoans(h) && F.view !== 'notes') list(view); }, function () {});
    if (N.itemLoansOthers && canRate()) N.itemLoansOthers().then(function (o) { if (setOthers(o) && F.show === 'loans' && F.view !== 'notes') list(view); }, function () {});
    if (N.itemKeys && canRate()) N.itemKeys().then(function (k) { if (setKeys(k) && F.view !== 'notes') list(view); }, function () {});
    if (N.itemTags && canRate()) N.itemTags().then(function (t) { if (setTags(t)) afterTags(view); }, function () {});
    if (N.itemRatings && canRate()) N.itemRatings().then(function (r) {
      var sig = JSON.stringify(r), moved = sig !== NRS;
      NR = r; NRS = sig;
      // ratings arrive after the first drawing: redraw where they decide what shows, or its order
      if (moved && F.view !== 'notes' && (F.order === 'rating' || Object.keys(F.facets.rating || {}).length)) { list(view); return; }
      var fb0 = SW.$('.lib-fbody', view); if (moved && fb0 && F.view !== 'notes') fb0.innerHTML = facetHTML();
      paintRatings(view, r);
    }, function () {});
    N.itemCounts().then(function (c) {
      NC = c;
      var show = SW.$('.lib-show select', view), box = SW.$('.lib-list', view); if (!box) return;
      var any = Object.keys(c).length;
      if (any && show && !SW.$('option[value="noted"]', show)) show.appendChild(SW.el('option', { value: 'noted' }, 'Annotated'));
      SW.$$('[data-lib]', box).forEach(function (r) {
        // a count of notes in the list only: a cover carries its marks, stars and due stamp
        var n = c[r.dataset.lib], at = SW.$('.lib-stand', r) ? null : SW.$('.lib-t', r), old = SW.$('.lib-nb', r);
        if (old) old.remove();
        if (n && at) at.appendChild(SW.el('span', { class: 'lib-nb', title: n + (n === 1 ? ' note' : ' notes') }, '✎ ' + n));
      });
    }, function () {});
  }
  function titleOf(code) {
    var e = byId(code), P = SW.paratexts;
    return (e && e.title) || (P && P.titleOf && P.titleOf(code)) || code;
  }
  function drawNotes(view, box) {
    box.classList.remove('lib-shelf');
    var zs0 = SW.$('.lib-sizes', view); if (zs0) zs0.hidden = true;
    var N = itemNotes();
    if (!N) { box.innerHTML = '<p class="hint pad">This bench has no annotation group.</p>'; return; }
    box.innerHTML = '<p class="hint pad">Reading the notes…</p>';
    N.itemNotes().then(function (all) {
      if (F.view !== 'notes') return;
      var by = {}, q = F.q.toLowerCase();
      // a rating or a key work mark on its own is no note to list
      all.forEach(function (n) { if (N.isReaction(n) && !n.parent) return; var c = N.itemCode(n.vid); (by[c] = by[c] || []).push(n); });
      function latest(c) { return by[c].reduce(function (m, n) { return String(n.date) > m ? String(n.date) : m; }, ''); }
      var codes = Object.keys(by).filter(function (c) {
        return !q || (c + ' ' + titleOf(c)).toLowerCase().indexOf(q) >= 0 || by[c].some(function (n) { return (String(n.text) + ' ' + n.by + ' ' + (n.quote || '')).toLowerCase().indexOf(q) >= 0; });
      }).sort(function (a, b) { return latest(a) < latest(b) ? 1 : -1; });
      var th = 0;
      box.innerHTML = codes.length ? codes.map(function (c) {
        var ts = N.threads(by[c]).reverse(); th += ts.length;
        return '<section class="lib-nwork" data-code="' + esc(c) + '"><button class="lib-nhead" data-noteopen="' + esc(c) + '"><span class="px-code mono">' + esc(c) + '</span> <b>' + esc(titleOf(c)) + '</b></button>' +
          ts.map(function (t) { return N.renderThread(t); }).join('') + '</section>';
      }).join('') : '<p class="hint pad">' + (N.configured() ? 'No notes' + (q ? ' answer the search' : ' yet') + '. A note is added in an entry’s box.' : 'Notes are kept in the annotation group (Help ▸ Getting set up).') + '</p>';
      N.wire(box, null, all);
      var n = SW.$('.lib-n', view); if (n) n.textContent = th + (th === 1 ? ' note' : ' notes') + ' on ' + codes.length;
    }, function (e) { box.innerHTML = '<p class="pad badge err">' + esc(e.message) + '</p>'; });
  }
  function setting(key, name, v) { F[key] = v; SW.store.set('library.' + name, v); }
  function wideLib() { return !root.matchMedia || root.matchMedia('(min-width: 860px)').matches; }
  function list(view) {
    var box = SW.$('.lib-list', view); if (!box) return;
    var fp = SW.$('.lib-facets', view), fb = SW.$('.lib-fbody', view);
    // the filters serve the library; the To read shelf is short enough without them. The funnel on the bar shows or
    // hides them: beside the list on a wide screen (remembered), folded above it on a narrow one
    var noF = F.view === 'notes' || F.show === 'loans', fOff = SW.store.get('library.filters', '') === 'hidden';
    if (fp) fp.hidden = noF || (fOff && wideLib());
    var fbtn = SW.$('.lib-fbtn', view);
    if (fbtn) { var fShown = wideLib() ? !fOff : !!(fp && fp.classList.contains('open')); fbtn.hidden = noF; fbtn.classList.toggle('on', fShown); fbtn.setAttribute('aria-pressed', String(fShown)); }
    if (F.view === 'notes') { drawNotes(view, box); paintCounts(view); return; }
    sweepLoans(); paintLoanCount(view);
    if (fb) fb.innerHTML = facetHTML();
    if (F.show === 'loans') {
      var due = function (e) { return (onLoan(e.id) || {}).due || '9999'; };
      var lo = F.loanOrder || 'author';
      var ls = lo === 'due' ? rows().sort(function (a, b) { return due(a) < due(b) ? -1 : due(a) > due(b) ? 1 : 0; }) : L.sorted(rows(), lo);
      var asList = F.view === 'list';
      box.classList.remove('lib-shelf', 'lib-s', 'lib-m', 'lib-l');
      var zl = SW.$('.lib-sizes', view); if (zl) zl.hidden = asList;
      box.innerHTML = (ls.length ? (asList ? '<table class="lib-loanlist"><thead><tr><th>Code</th><th>Work</th><th>Due</th><th></th></tr></thead><tbody>' + ls.map(loanRow).join('') + '</tbody></table>' : '<div class="lib-cards lib-cards-' + (F.size || 'm') + '">' + ls.map(cardOf).join('') + '</div>') : '<p class="hint pad">Nothing on your To read shelf. Open a work and check it out for one, two or three months.</p>') + logHTML();
      var nl = SW.$('.lib-n', view); if (nl) nl.textContent = ls.length + ' to read';
      return;
    }
    if (F.view === 'cat') { var zc = SW.$('.lib-sizes', view); if (zc) zc.hidden = true; drawCatalogue(view, box); paintCounts(view); return; }
    var rs = L.sorted(rows(), F.order), icons = F.view !== 'list';
    box.classList.toggle('lib-shelf', icons);
    ['s', 'm', 'l'].forEach(function (z) { box.classList.toggle('lib-' + z, icons && F.size === z); });
    var zs = SW.$('.lib-sizes', view); if (zs) zs.hidden = !icons;
    box.innerHTML = rs.length ? rs.map(icons ? tile : row).join('') : '<p class="hint pad">Nothing in the library answers the search.</p>';
    var n = SW.$('.lib-n', view); if (n) n.textContent = rs.length + ' of ' + L.items().length;
    paintCounts(view);
  }
  function canRate() { var N = itemNotes(); return !!(N && N.configured()); }
  function canSortRating() { return canRate() || Object.keys(NR).length > 0; }
  // the intro under the tab's title: its first sentence, small; the whole in the tooltip
  function introText(html) { try { return new DOMParser().parseFromString(String(html), 'text/html').body.textContent.replace(/\s+/g, ' ').trim(); } catch (e) { return String(html).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim(); } }
  function firstSentence(t) { var m = /^[\s\S]*?[.!?](?=\s|$)/.exec(t); return m ? m[0] : t; }
  L.firstSentence = firstSentence;
  function draw() {
    var view = SW.$('#view-library'); if (!view) return;
    view.innerHTML = '<p class="hint pad">Reading the library…</p>';
    L.load().then(function (m) {
      // a kept order of Rating waits in the store for a reader with the group's token
      if (F.order === 'rating' && !canSortRating()) F.order = C.order && C.order !== 'rating' ? C.order : 'author';
      // relevance is the first order where entries have it, and stands in for As listed there
      var hasRel = m.items.some(function (e) { return relOf(e); });
      relShown = hasRel;
      if (hasRel && (F.order === 'listed' || (!SW.store.get('library.order', '') && !C.order))) F.order = 'relevance';
      if (!hasRel && F.order === 'relevance') F.order = C.order && C.order !== 'relevance' ? C.order : 'author';
      view.innerHTML = '<div class="lib"><h2 class="view-title">' + esc(m.title || C.label || 'Library') + '</h2>' +
        // the tabs and the toolbar stay at the top as the list scrolls
        '<div class="lib-top"><div class="lib-tabs" role="tablist"><button role="tab" class="lib-tab' + (F.show !== 'loans' ? ' on' : '') + '" data-show="all" aria-selected="' + (F.show !== 'loans') + '">Library</button><button role="tab" class="lib-tab' + (F.show === 'loans' ? ' on' : '') + '" data-show="loans" aria-selected="' + (F.show === 'loans') + '">To read</button></div>' +
        '<div class="toolbar lib-bar"><input type="search" class="lib-q" placeholder="Search the library" aria-label="Search the library" value="' + esc(F.q) + '">' +
        '<label class="lib-show faint"' + (F.show === 'loans' ? ' hidden' : '') + '>Show <select aria-label="Show">' + [['all', 'All works'], ['held', 'Held']].concat(m.items.some(isPrivate) ? [['group', 'For the group']] : []).concat([['out', 'Linked']]).concat((m.adds || []).length ? [['added', 'Added']] : []).map(function (s) { return '<option value="' + s[0] + '"' + (F.show === s[0] ? ' selected' : '') + '>' + s[1] + '</option>'; }).join('') + '</select></label>' +
        '<label class="lib-order faint">Order <select aria-label="Order">' + ORDERS.filter(function (o) { return (o[0] !== 'lang' || m.items.some(function (e) { return e.lang; })) && (o[0] !== 'rating' || canSortRating()) && (o[0] !== 'relevance' || hasRel) && (o[0] !== 'listed' || !hasRel); }).map(function (o) { return '<option value="' + o[0] + '"' + (F.order === o[0] ? ' selected' : '') + '>' + o[1] + '</option>'; }).join('') + '</select></label>' +
        '<span class="im-seg lib-views" role="group" aria-label="View"><button class="btn' + (F.view !== 'list' && F.view !== 'notes' && F.view !== 'cat' ? ' on' : '') + '" data-libview="icons" title="Covers on a shelf" aria-label="Covers">▦</button><button class="btn' + (F.view === 'list' ? ' on' : '') + '" data-libview="list" title="A list" aria-label="List">☰</button><button class="btn' + (F.view === 'notes' ? ' on' : '') + '" data-libview="notes" title="The group’s notes on these works" aria-label="Notes">✎</button><button class="btn' + (F.view === 'cat' ? ' on' : '') + '" data-libview="cat" title="A card catalogue, in drawers" aria-label="Catalogue"><svg viewBox="0 0 16 16" width="13" height="13" aria-hidden="true" style="vertical-align:-2px"><rect x="2" y="2" width="12" height="12" rx="1" fill="none" stroke="currentColor" stroke-width="1.4"/><path d="M2 8h12M6.5 5h3M6.5 11h3" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg></button></span>' +
        '<span class="im-seg lib-sizes" role="group" aria-label="Cover size">' + [['s', 'Small covers'], ['m', 'Medium covers'], ['l', 'Large covers']].map(function (z) { return '<button class="btn' + (F.size === z[0] ? ' on' : '') + '" data-libsize="' + z[0] + '" title="' + z[1] + '" aria-label="' + z[1] + '">' + z[0].toUpperCase() + '</button>'; }).join('') + '</span>' +
        '<button class="btn ghost lib-fbtn" data-fpane title="Show or hide the filters" aria-label="Filters" aria-pressed="true"><svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><path d="M3 4h18l-7 8.5V19l-4 2v-8.5z"/></svg></button>' +
        '<button class="btn ghost lib-help" title="How the Library works" aria-label="How the Library works">?</button>' +
        '<span class="lib-n faint"></span></div></div>' +
        (m.addErr && SW.store.get('library.addErrHidden', '') !== tokenOf().slice(-6) ? '<p class="hint lib-adderr">' + (m.addStatus === 401 ? 'Works the group added are kept on GitHub, which no longer accepts the GitHub token saved in this browser; a new one in ⚙ Settings shows them.' : 'Works the group added could not be read: ' + esc(m.addErr) + '.') + ' <button class="btn ghost" data-hideadderr title="Until the token changes">Hide</button></p>' : '') +
        '<div class="lib-body"><div class="lib-facets"><button class="btn ghost lib-ftoggle" data-ftoggle aria-expanded="false">Filters</button><div class="lib-fbody"></div></div><div class="lib-list"></div></div></div>';
      list(view);
      pinFacets(view);
      L.canAdd().then(function (yes) {
        var bar = SW.$('.lib-bar', view);
        if (yes && bar && !SW.$('.lib-add', bar)) bar.appendChild(SW.el('button', { class: 'btn lib-add' }, '＋ Add a work'));
      });
      var q = SW.$('.lib-q', view);
      q.addEventListener('input', function () { F.q = q.value; list(view); });
      if (view.libFor !== L) {
        view.libFor = L;
        if (!view._catKeys) {
          view._catKeys = true;
          view.addEventListener('keydown', function (ev) {
            if (F.view !== 'cat' || CAT.open < 0 || !ev.target.closest('.lib-tray')) return;
            var k = ev.key;
            if (k === 'ArrowRight' || k === 'ArrowDown') { catMove(1); } else if (k === 'ArrowLeft' || k === 'ArrowUp') { catMove(-1); }
            else if (k === 'Escape') { CAT.open = -1; }
            else if (k === 'Enter') { var fc = SW.$('.lib-ccard [data-lib]', view); if (fc) L.open(fc.dataset.lib); ev.preventDefault(); return; }
            else return;
            ev.preventDefault();
            list(view);
            var t = SW.$('.lib-tray', view); if (t) t.focus({ preventScroll: true });
          });
        }
        view.addEventListener('click', function (ev) {
          if (ev.target.closest('.lib-add')) { L.form(); return; }
          if (ev.target.closest('.lib-help')) { L.help(); return; }
          var fv = ev.target.closest('[data-facet]');
          if (fv) { var fk = fv.dataset.facet, fo = F.facets[fk] = F.facets[fk] || {}; if (fo[fv.dataset.val]) delete fo[fv.dataset.val]; else fo[fv.dataset.val] = 1; list(view); return; }
          if (ev.target.closest('[data-fpane]')) {
            // once per click, however many times the Library has been set up on this page
            if (!ev.fpaneDone) {
              ev.fpaneDone = true;
              if (wideLib()) SW.store.set('library.filters', SW.store.get('library.filters', '') === 'hidden' ? '' : 'hidden');
              else { var fpn = SW.$('.lib-facets', view); if (fpn) fpn.classList.toggle('open'); }
            }
            list(view); return;
          }
          var ft = ev.target.closest('[data-ftoggle]'); if (ft) { ft.setAttribute('aria-expanded', ft.parentNode.classList.toggle('open') ? 'true' : 'false'); return; }
          var fm = ev.target.closest('[data-fmore]'); if (fm) { F.more[fm.dataset.fmore] = !F.more[fm.dataset.fmore]; list(view); return; }
          if (ev.target.closest('[data-fclear]')) { F.facets = {}; list(view); return; }
          var no = ev.target.closest('[data-noteopen]'); if (no) { SW.notes.openItem(no.dataset.noteopen); return; }
          var ng = ev.target.closest('[data-at]'), sec = ev.target.closest('[data-code]');
          if (ng && sec) { var nq = ng.dataset.at === 'q' ? ng.textContent : '', nat = ng.dataset.at; SW.notes.openItem(sec.dataset.code).then(function () { setTimeout(function () { var ds = SW.$$('dialog[open]'); SW.notes.itemGo(nat, nq, ds[ds.length - 1]); }, 800); }); return; }
          var zb = ev.target.closest('[data-libsize]'); if (zb) { setting('size', 'size', zb.dataset.libsize); SW.$$('[data-libsize]', view).forEach(function (b) { b.classList.toggle('on', b === zb); }); list(view); return; }
          var w = ev.target.closest('[data-libview]'); if (w) { setting('view', 'view', w.dataset.libview); SW.$$('[data-libview]', view).forEach(function (b) { b.classList.toggle('on', b === w); }); list(view); return; }
          var he = ev.target.closest('[data-hideadderr]'); if (he) { SW.store.set('library.addErrHidden', tokenOf().slice(-6)); he.parentNode.remove(); return; }
          if (ev.target.closest('[data-mynotes]')) { ev.preventDefault(); showMyNotes(); return; }
          var lg = ev.target.closest('.lib-log > summary'); if (lg) { setTimeout(function () { LOGOPEN = lg.parentNode.open; }, 0); }
          var an = ev.target.closest('[data-addnote]'); if (an) { addNote(an.dataset.addnote); return; }
          var tn = ev.target.closest('[data-turn]');
          if (tn) {
            var face = tn.closest('[data-face]'), code = face.dataset.face;
            FLIP[code] = !FLIP[code];
            face.classList.toggle('flipped', !!FLIP[code]);
            if (FLIP[code]) fillBack(code, view);
            return;
          }
          var tray0 = function () { var t = SW.$('.lib-tray', view); if (t) t.focus({ preventScroll: true }); };
          var cby = ev.target.closest('[data-catby]'); if (cby) { CAT.by = cby.dataset.catby; SW.store.set('library.catby', CAT.by); CAT.open = -1; list(view); return; }
          var dr = ev.target.closest('[data-drawer]'); if (dr) { var di = +dr.dataset.drawer; CAT.open = CAT.open === di ? -1 : di; CAT.card = 0; list(view); tray0(); return; }
          var cc = ev.target.closest('[data-catcard]'); if (cc) { CAT.card = +cc.dataset.catcard; list(view); tray0(); return; }
          var cn = ev.target.closest('[data-catnav]'); if (cn) { catMove(+cn.dataset.catnav); list(view); tray0(); return; }
          if (ev.target.closest('[data-catclose]')) { CAT.open = -1; list(view); return; }
          var ca = ev.target.closest('[data-cardall]'); if (ca) { if (!ev.cardAll && cardLines(ca.dataset.cardall).length) { ev.cardAll = true; showCardAll(ca.dataset.cardall); } return; }
          var cl = ev.target.closest('[data-cardloan]');
          if (cl) { var cm = cl.parentNode.querySelector('.lib-loanmenu'), card = cl.closest('.lib-card'); cm.hidden = !cm.hidden; cl.setAttribute('aria-expanded', cm.hidden ? 'false' : 'true'); card.classList.toggle('menu-open', !cm.hidden); return; }
          SW.$$('.lib-card .lib-loanmenu', view).forEach(function (m) { if (!m.hidden && !m.contains(ev.target)) { m.hidden = true; m.closest('.lib-card').classList.remove('menu-open'); } });
          var cd = ev.target.closest('[data-card]');
          if (cd && ev.target.closest('[data-ext]')) { L.renew(cd.dataset.card, +ev.target.closest('[data-ext]').dataset.ext); list(view); return; }
          if (cd && ev.target.closest('[data-ret]')) { L.giveBack(cd.dataset.card); list(view); return; }
          var s = ev.target.closest('[data-show]');
          if (s) {
            F.show = s.dataset.show;
            SW.$$('.lib-tab', view).forEach(function (b) { var on = b === s; b.classList.toggle('on', on); b.setAttribute('aria-selected', on ? 'true' : 'false'); });
            var sl = SW.$('.lib-show', view); if (sl) { sl.hidden = F.show === 'loans'; SW.$('select', sl).value = 'all'; }
            syncShelf(view);
            list(view); return;
          }
          var r = ev.target.closest('[data-lib]'); if (r) L.open(r.dataset.lib);
        });
        // a filter heading opened or shut is remembered
        view.addEventListener('toggle', function (ev) {
          var g = ev.target && ev.target.dataset && ev.target.dataset.fgroup; if (!g) return;
          var o = fOpen(); if (ev.target.open) o[g] = 1; else delete o[g]; SW.store.set('library.fopen', o);
        }, true);
        view.addEventListener('keydown', function (ev) {
          var ca = (ev.key === 'Enter' || ev.key === ' ') && ev.target.closest && ev.target.closest('[data-cardall]');
          if (ca && !ev.cardAll && cardLines(ca.dataset.cardall).length) { ev.cardAll = true; ev.preventDefault(); showCardAll(ca.dataset.cardall); }
        });
      }
      var o = SW.$('.lib-order select', view); o.addEventListener('change', function () { if (F.show === 'loans') F.loanOrder = o.value; else setting('order', 'order', o.value); list(view); });
      syncShelf(view);
      var sh = SW.$('.lib-show select', view); if (sh) sh.addEventListener('change', function () { F.show = sh.value; list(view); });
      // a picture that will not load: the drawn cover under it, or the row's mark
      SW.$('.lib-list', view).addEventListener('error', function (ev) { if (ev.target.classList && ev.target.classList.contains('lib-thumb')) ev.target.remove(); }, true);
      if (Q0.lib) { var id = Q0.lib; Q0.lib = null; L.open(id); }
    }, function (e) { view.innerHTML = '<p class="pad badge err">' + esc(e.message) + '</p>'; });
  }
  var drawn = false;
  function redraw() { if (drawn) draw(); }
  L.help = function () {
    function ul(items) { return '<ul class="ah-steps">' + items.map(function (t) { return '<li>' + t + '</li>'; }).join('') + '</ul>'; }
    SW.guideAdd('library', [C.label || 'The Library', [
      ['What it holds', '<p>The secondary literature on the project: the books, articles, talks, podcasts and documentaries the group reads and cites. Each entry has a record. Some have a file held here, some a file the group keeps privately, and some a link to where the work is published.</p>'],
      ['Finding a work', ul([
        '<b>▦</b> shows covers on a shelf, small, medium or large (<b>S M L</b>), <b>☰</b> a list, and the drawer button a card catalogue: drawers by author, title, subject (the tags) or relevance, with a typed card for each work. Pull out a drawer, flick through with the arrow keys, open a work with Enter, and close the drawer with Escape. A search opens the drawer holding the first it finds. A preprint and a key work carry a badge in each, and in the box. A cover is drawn from the kind of work, or is an image of it where the entry has one.',
        '<b>Order</b> sorts by author, title, date, kind or language, or as the library lists them. Where entries say how far they concern the subject, <b>By relevance</b> comes first: key works, then Essential, High, Medium, Low, Minimal and Not Checked, by author within each. Your choice of view, size and order is kept in this browser.',
        'The search reads the title, author, date, kind, note, licence, source, language and tags. The export icon in a work’s box gives it as RIS (which Zotero, EndNote and Mendeley open) or BibTeX, downloaded or copied for Zotero’s Import from Clipboard. <b>Show</b> narrows to the works held here, those for the group, those linked to where they are published, or those with notes. <b>Library</b> and <b>To read</b> above it switch between the whole library and your own shelf.',
        '<b>Filters</b> beside the list narrow by kind, relevance, language, rating, decade, author and tag, each value with its count. A work’s rating is the group’s average to the nearest star, and Rating shows once a work in the group has one. Several values in one group widen it, and each group narrows the others. <b>Clear these filters</b> takes them all off.'])],
      ['Opening a work', ul([
        'Click a cover or a row: the record opens in a box over the bench, with its citation (<b>Copy</b> copies it), the file where you can read it, and a link to where it is published.',
        'A work may have other forms, such as a transcript: a button below it opens one under the work, so you can read it while a recording plays.',
        'PDFs, text, Markdown, HTML, images, audio and video show in the box. Any other file can be downloaded.',
        'A work linked on YouTube, Vimeo or the Internet Archive plays in the box. Where the group also holds a file, the file comes first and <b>▶ Play from…</b> opens the other. If an uploader has turned this off, the player says so, and the link above still goes to it.',
        '<b>For the group</b> means the group keeps a copy in its private repository. A member with a GitHub token (⚙ Settings) opens it here; anyone else sees the record and the link.',
        'A library card, and a card in the catalogue, turns over with <b>↻</b> to show the group’s notes on the work scribbled on its back, and <b>Add Annotation</b> there writes one. Without the group’s token it stays a draft in this browser.',
        '<b>What’s new</b> lists works on your To read shelf due back within the week, and those that went back in the last week.',
        '<b>To read</b> is your own shelf. Check a work out from its box for one, two or three months, and it carries a due stamp on its cover. To read shows a library card for each, where you renew it, take the date away or return it; past its date it goes back. Below the cards, your reading log lists every work you have had out, with your rating, and <b>Your notes</b> opens the notes you have written on works in the library. It is kept in this browser. With the group’s Hypothesis token it follows you to your other browsers and the group’s members can see it, and a work’s card and box show who else in the group has it out.',
        'Members of the group set a work’s <b>relevance</b> with the drop-down in its box, which orders <b>By relevance</b> for the group, and add <b>tags</b> there, taking them off with ×. The tags are shared with the group, and <b>Filters</b> and the search read them.',
        'Members of the group mark a work as a <b>key work</b> in its box, and press again to take the mark off. The mark is shared with the group, and key works come first in By relevance.',
        '<b>Share</b> opens your system’s share sheet (Mail, Messages, AirDrop…) with a link that opens this box. A browser with no share sheet copies the link.'])],
      ['Notes on a work', ul([
        'Above them, members of the group give a work one to three stars, and an emoji. The average shows on its cover, and <b>Order</b> can sort by it.',
        'The panel beside a work holds the group’s notes on it, with replies and reactions as on a text. They are visible to the annotation group only (Help ▸ Getting set up).',
        'A note can be pinned: <b>⏱ Now</b> takes the time a held recording is at, <b>At</b> takes a typed time or page, and words selected in a transcript or text are quoted. Clicking the pin goes back there.',
        'A count on a cover shows a work has notes. <b>Annotated</b> shows those works, and <b>✎</b> lists all the notes, newest work first; the search reads them too.',
        'A note made on a paratext stays with its code if the item moves to the Library.'])],
      ['Adding a work', ul([
        'A member whose GitHub token (⚙ Settings) can write to the private repository has <b>＋ Add a work</b>: a record, with a copy of up to 40 MB or without one, and a link to a cover image if you have one.',
        'It goes in the group’s private repository. Members see it at once, marked <b>Added, not yet public</b>, and can correct or remove it from its box. Nobody else sees it.',
        'It joins the public list when the person running the bench publishes it, without the name of who added it. A copy stays private.',
        'A copy added here stays in the private repository’s history, even if it is later removed. GitHub shows the repository’s size on its own page; the person running the bench looks after it.'])]
    ]]);
    SW.guide('library');
  };
  SW.views.library = { show: function () { if (!drawn) { drawn = true; draw(); } } };
  if (SW.on) SW.on('notes', function (vid) {
    if (!drawn || !SW.notes || !SW.notes.isItem || !SW.notes.isItem(vid)) return;
    var v = SW.$('#view-library'); if (v && SW.$('.lib-list', v)) list(v);
  });

  // ---------- a citation ----------
  // Harvard, from what the record has: the author as written; the title quoted where it appeared in
  // something else, in italics where it stands alone. e.citation, written by hand, is used as it is.
  function inOf(e) { var s = String(e.in || '').trim(); return /^\(.*\)$/.test(s) ? '' : s; }   // "(monograph)": a note, not a place
  // ---------- export: RIS and BibTeX for Zotero and the like ----------
  // a name with a romanised form goes out in it: "Kuki, Shūzō 九鬼周造" as "Kuki, Shūzō"; a name in its own script alone stays
  function exportName(n) {
    n = String(n || '').trim();
    if (!/[A-Za-z\u00c0-\u024f]/.test(n)) return n;
    return n.replace(/[\u2e80-\u9fff\uac00-\ud7af\uf900-\ufaff\uff00-\uffef\u3000-\u303f]+/g, ' ').replace(/[(\[]\s*[)\]]/g, ' ').replace(/\s+,/g, ',').replace(/\s{2,}/g, ' ').replace(/^[\s,]+|[\s,]+$/g, '');
  }
  function authorsOf(e) { return String(e.author || '').split(/\s*;\s*|\s+and\s+|\s*&\s*/).map(exportName).filter(Boolean); }
  // contributor as "eds A B, C D; translated by E F": editors, translators, and others, by the words before them.
  // Names after a role are split at commas only where each piece has a space in it, so "Surname, Given" holds.
  // A segment with no role word carries on the role before it: "eds Amano, Teiyū; Omodaka, Hisayuki" is two editors,
  // family name first. Any other role ("introduction by X", "complementary essay by X") goes whole into the note
  function splitNames(s) {
    return s.split(/\s*,?\s+and\s+|\s*&\s*|\s*;\s*/).reduce(function (all, part) {
      var bits = part.split(/\s*,\s*/);
      return all.concat(bits.length > 1 && bits.every(function (b) { return /\S\s+\S/.test(b); }) ? bits : [part]);
    }, []).map(exportName).filter(Boolean);
  }
  function rolesOf(e) {
    var out = { editor: [], translator: [], other: [] }, last = 'other';
    String(e.contributor || '').split(/\s*;\s*/).forEach(function (seg) {
      seg = seg.trim(); if (!seg) return;
      var m, role = null;
      if ((m = /^(?:eds?\.?|editors?|edited)(?:\s+by)?\s+/i.exec(seg))) role = 'editor';
      else if ((m = /^(?:trans(?:\.|lated)?|translators?|tr\.)(?:\s+by)?\s+/i.exec(seg))) role = 'translator';
      if (role) { last = role; splitNames(seg.slice(m[0].length)).forEach(function (n) { out[role].push(n); }); return; }
      var other = /^(?:foreword|introduction|preface|afterword|notes|commentary|annotations?)\b/i.test(seg) || /^\S+(?:\s+\S+){0,4}?\s+by\s+\S/i.test(seg);
      if (!other && last !== 'other') { splitNames(seg).forEach(function (n) { out[last].push(n); }); return; }
      last = 'other';
      var note = exportName(seg); if (note) out.other.push(note);
    });
    return out;
  }
  L.rolesOf = rolesOf;
  // a volume's size as a page count: the first number in extent ("331 p.; 23 cm")
  function pageCount(e) { var m = /(\d+)\s*(?:p\b|pp\b|pages\b)/i.exec(String(e.extent || '')) || /^\s*(\d+)/.exec(String(e.extent || '')); return m ? m[1] : ''; }
  function risType(e) {
    var k = String(e.kind || '').toLowerCase().trim();
    return { book: 'BOOK', edition: 'BOOK', monograph: 'BOOK', translation: 'BOOK', 'parallel text': 'BOOK', 'edited volume': 'BOOK', anthology: 'BOOK', thesis: 'THES', dissertation: 'THES', chapter: 'CHAP', article: 'JOUR', review: 'JOUR', preprint: 'UNPB', magazine: 'MGZN', news: 'NEWS', newspaper: 'NEWS', 'web page': 'ELEC', web: 'ELEC', website: 'ELEC', blog: 'BLOG', film: 'VIDEO', video: 'VIDEO', documentary: 'VIDEO', podcast: 'SOUND', audio: 'SOUND', talk: 'SOUND', report: 'RPRT', conference: 'CPAPER', encyclopaedia: 'ENCYC', encyclopedia: 'ENCYC' }[k] || 'GEN';
  }
  function pagesOf(e) { var m = /(\d+)\s*[-–]\s*(\d+)/.exec(String(e.pages || '')); return m ? [m[1], m[2]] : null; }
  L.toRIS = function (es) {
    return es.map(function (e) {
      var out = ['TY  - ' + risType(e)], line = function (k, v) { if (v != null && String(v).trim()) out.push(k + '  - ' + String(v).replace(/\s+/g, ' ').trim()); }, pp = pagesOf(e);
      var roles = rolesOf(e);
      authorsOf(e).forEach(function (a) { line('AU', a); });
      roles.editor.forEach(function (a) { line('ED', a); });
      roles.translator.forEach(function (a) { line('A4', a); });
      line('TI', e.title);
      line(risType(e) === 'JOUR' || risType(e) === 'MGZN' || risType(e) === 'NEWS' ? 'JO' : 'T2', e.in);
      line('PY', L.year(e.date)); line('DA', e.date); line('PB', e.publisher);
      if (pp) { line('SP', pp[0]); line('EP', pp[1]); } else if (e.pages) line('SP', e.pages); else if (/^(BOOK|THES)$/.test(risType(e))) line('SP', pageCount(e));
      line('DO', e.doi); line('UR', e.url); line('LA', e.lang); line('N1', e.note);
      if (roles.other.length) line('N1', 'With ' + roles.other.join('; '));
      plainTags(e).forEach(function (t) { line('KW', t); });
      line('ID', e.id);
      out.push('ER  - ');
      return out.join('\r\n');
    }).join('\r\n\r\n') + '\r\n';
  };
  function bibType(e) { return { BOOK: 'book', THES: 'phdthesis', CHAP: 'incollection', JOUR: 'article', MGZN: 'article', NEWS: 'article', RPRT: 'techreport', CPAPER: 'inproceedings', UNPB: 'unpublished' }[risType(e)] || 'misc'; }
  function bibEsc(v) { return String(v).replace(/\\/g, '\\textbackslash{}').replace(/([{}%&#_$])/g, '\\$1').replace(/\s+/g, ' ').trim(); }
  L.toBibTeX = function (es) {
    var used = {};
    return es.map(function (e) {
      var who = String(L.surname(e.author) || 'anon').normalize ? String(L.surname(e.author) || 'anon').normalize('NFD').replace(/[\u0300-\u036f]/g, '') : String(L.surname(e.author) || 'anon');
      var key = who.replace(/[^A-Za-z]/g, '').toLowerCase() + (L.year(e.date) || '') + (titleKey(e.title).split(/\s+/)[0] || '').replace(/[^A-Za-z]/g, '').toLowerCase(), k = key, n = 1;
      while (used[k]) k = key + String.fromCharCode(96 + (++n));
      used[k] = 1;
      var t = bibType(e), f = [], put = function (name, v) { if (v != null && String(v).trim()) f.push('  ' + name + ' = {' + bibEsc(v) + '}'); }, pp = pagesOf(e);
      var bRoles = rolesOf(e);
      put('author', authorsOf(e).join(' and '));
      put('editor', bRoles.editor.join(' and '));
      put('translator', bRoles.translator.join(' and '));
      f.push('  title = {{' + bibEsc(e.title) + '}}');
      put(t === 'article' ? 'journal' : t === 'incollection' || t === 'inproceedings' ? 'booktitle' : 'howpublished', e.in);
      put('year', L.year(e.date)); put('publisher', e.publisher);
      put('pages', pp ? pp[0] + '--' + pp[1] : e.pages);
      if (!e.pages && (t === 'book' || t === 'phdthesis')) put('pagetotal', pageCount(e));
      put('doi', e.doi); put('url', e.url); put('language', e.lang); put('note', e.note);
      put('keywords', plainTags(e).join(', '));
      return '@' + t + '{' + k + ',\n' + f.join(',\n') + '\n}';
    }).join('\n\n') + '\n';
  };
  function exportList(es, how, name) {
    if (how === 'copybib') { SW.copyText(L.toBibTeX(es), es.length + (es.length === 1 ? ' work' : ' works') + ' as BibTeX'); return; }
    var text = how === 'bib' ? L.toBibTeX(es) : L.toRIS(es), a = SW.el('a', { href: URL.createObjectURL(new Blob([text], { type: how === 'bib' ? 'application/x-bibtex' : 'application/x-research-info-systems' })), download: name + (how === 'bib' ? '.bib' : '.ris') });
    document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
    SW.toast(es.length + (es.length === 1 ? ' work' : ' works') + ' exported.', 3000);
  }
  L.citation = function (e) {
    if (e.citation) return { text: String(e.citation), html: esc(e.citation) };
    // a report and a web page stand alone, their titles in italics, as a book's (Cite Them Right)
    var where = inOf(e), fam = L.family(e), alone = fam === 'web' || /^(report|technical report)$/i.test(String(e.kind || '').trim());
    var part = !alone && (!!where || fam === 'article' || fam === 'chapter' || fam === 'news');
    var plain = [], rich = [];
    function add(t, h) { plain.push(t); rich.push(h == null ? esc(t) : h); }
    function stop(s) { return /[.?!]['’"”]?$/.test(s) ? s : s + '.'; }
    var ld = leadOf(e), yr = '(' + (L.year(e.date) || e.date || 'n.d.') + ')';
    var t = String(e.title || '').trim();
    // a journal's, newspaper's or magazine's publisher is not given; the publication is enough
    var pub = ((fam === 'article' || fam === 'news') && where) || ld.by === 'org' ? '' : String(e.publisher || '').trim(), pages = String(e.pages || '').trim();
    var pp = where && /\d/.test(pages) ? (/^(pp?\.)/i.test(pages) ? pages : (/[-–]/.test(pages) ? 'pp. ' : 'p. ') + pages) : '';
    // an article's pages follow its journal, a newspaper piece's its title; a chapter's follow the book's publisher
    var after = (fam === 'article' || ld.by === 'publication') && pp ? ', ' + pp : '';
    // the publication that leads is not said again, only its issue
    var shown = ld.by === 'publication' ? where.slice(ld.text.length).replace(/^[\s,;:]+/, '') : where;
    var tT, tH, wT = '', wH = '';
    if (part) { tT = '‘' + t + '’'; tH = esc(tT); } else { tT = t; tH = '<i>' + esc(t) + '</i>'; }
    if (part && shown) {
      // a chapter: in, its editors where known, and the book
      var eds = fam === 'chapter' ? editorsText(e) : '', lead = fam === 'chapter' ? 'in ' + (eds ? eds + ' ' : '') : '';
      wT = lead + shown + after; wH = esc(lead) + (ld.by === 'publication' ? esc(shown) : '<i>' + esc(shown) + '</i>') + esc(after);
    } else if (after) { wT = after.slice(2); wH = esc(wT); }
    if (ld.by === 'title') {
      // no one to lead: the title, then the year, then where it appeared
      add(tT + ' ' + yr, tH + ' ' + esc(yr));
      if (wT) add(wT, wH);
    } else {
      add(ld.text + ' ' + yr);
      add(tT + (wT ? (ld.by === 'publication' ? ', ' : ', ') + wT : ''), tH + (wH ? ', ' + wH : ''));
    }
    var tail = [];
    if (pub) tail.push(pub);
    if (pp && !after) tail.push(pp);
    var doi = String(e.doi || '').trim().replace(/^https?:\/\/(dx\.)?doi\.org\//i, '');
    var link = doi ? 'https://doi.org/' + doi : String(e.url || '').trim();
    function join(xs) {
      var s = xs.length > 1 ? xs[0] + ' ' + stop(xs[1]) : stop(xs[0]);
      return tail.length ? s + ' ' + stop(tail.join(', ')) : s;
    }
    var dot = function (s) { return /[.?!]['’"”]?$/.test(s) ? '' : '.'; };
    var text = join(plain), html = (plain.length > 1 ? rich[0] + ' ' + rich[1] + dot(plain[1]) : rich[0] + dot(plain[0])) + (tail.length ? ' ' + esc(stop(tail.join(', '))) : '');
    if (link) { text += ' ' + link; html += ' ' + (/^https?:\/\//i.test(link) ? '<a href="' + esc(link) + '" target="_blank" rel="noopener noreferrer">' + esc(link) + '</a>' : esc(link)); }
    return { text: text, html: html };
  };

  // ---------- an entry, in a box over the bench ----------
  // the Library's own page with its preview card (tools/release.js): links to an entry go through it once it is there
  var cardPage = null;
  function checkCard() {
    if (cardPage !== null) return;
    cardPage = false;
    fetch('library/index.html', { method: 'HEAD', cache: 'no-store' }).then(function (r) { cardPage = r.ok; }, function () {});
  }
  function linkTo(id) { return cardPage ? SW.BASE_URI + 'library/?lib=' + encodeURIComponent(id) : SW.permalink({ tab: 'library', lib: id }); }
  // the box's actions as icons, each with its words in the tooltip and for a screen reader
  function ico(d, fill) { return '<svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path d="' + d + '" fill="' + (fill ? 'currentColor' : 'none') + '" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>'; }
  var ICON = {
    tab: ico('M9 2.5h4.5V7M13.5 2.5 7.5 8.5M12 9.5v4H2.5V4h4'),
    ref: ico('M3 2.5h7l3 3v8H3zM10 2.5v3h3M5.5 8h5M5.5 10.5h3.5'),
    down: ico('M8 2v8M4.5 6.5 8 10l3.5-3.5M2.5 12.5v1h11v-1'),
    globe: ico('M8 1.8a6.2 6.2 0 1 0 0 12.4A6.2 6.2 0 0 0 8 1.8zM1.8 8h12.4M8 1.8c1.8 1.7 2.6 3.8 2.6 6.2S9.8 12.5 8 14.2C6.2 12.5 5.4 10.4 5.4 8S6.2 3.5 8 1.8z'),
    link: ico('M6.6 9.4a2.6 2.6 0 0 0 3.7 0l2.4-2.4a2.6 2.6 0 0 0-3.7-3.7l-.9.9M9.4 6.6a2.6 2.6 0 0 0-3.7 0L3.3 9a2.6 2.6 0 0 0 3.7 3.7l.9-.9'),
    flag: function (on) { return ico('M3.5 14V2.5M3.5 2.5h8l-1.8 2.8 1.8 2.8h-8', on); },
    mark: function (on) { return ico('M4 2h8v12l-4-3-4 3z', on); }
  };
  function ib(attrs, icon, words) { return '<' + (attrs.href ? 'a' : 'button') + ' class="btn ghost lib-ib"' + Object.keys(attrs).map(function (k) { return ' ' + k + '="' + esc(attrs[k]) + '"'; }).join('') + ' title="' + esc(words) + '" aria-label="' + esc(words) + '">' + icon + '</' + (attrs.href ? 'a' : 'button') + '>'; }
  L.open = function (id) {
    checkCard();
    return L.load().then(function () {
      var e = byId(id);
      if (!e) { SW.toast('No entry ' + id + ' in the library.', 3000); return; }
      var priv = isPrivate(e), canOpen = !!e.file && (!priv || L.member());
      var k = canOpen ? kindOfFile(e.file) : null, d = SW.el('dialog', { class: 'tray-big lib-dlg' });
      var alts = (e.alts || []).filter(function (a) { return a && a.file && (!isPrivate(a) || L.member()); });
      var fam = L.family(e), player = e.url && SW.embedPlayer ? SW.embedPlayer(e.url, e.title, fam, 'lib-embed') : null;
      var cite = L.citation(e);
      // a real cover; a public image used as its own cover already shows below
      var boxCover = e.thumb && e.thumb !== e.file ? e.thumb : '';
      var rec = [['Author', e.author], ['With', e.contributor], ['Date', e.date], ['Kind', e.kind], ['Relevance', canRate() ? '' : REL_NAMES[relOf(e)]], ['In', inOf(e)], ['Publisher', e.publisher], ['Pages', e.pages], ['Extent', e.extent], ['DOI', e.doi], ['Language', L.langName(e.lang)], ['Licence', e.licence], ['Source', e.source], ['Note', e.note]]
        .concat(isAdded(e) && e.added ? [['Added', [e.added.by, e.added.date].filter(Boolean).join(', ') + '; not yet in the public list']] : [])
        .filter(function (r) { return r[1]; }).map(function (r) { return '<dt>' + r[0] + '</dt><dd>' + doiLinks(esc(r[1])) + '</dd>'; }).join('') +
        (NR[e.id] ? '<dt>Rating</dt><dd><span class="lib-stars" title="' + esc(starTitle(NR[e.id])) + '">' + starText(NR[e.id]) + '</span></dd>' : '');
      var acts = (e.url && !e.file ? '<a class="btn lib-ib-open" href="' + esc(e.url) + '" target="_blank" rel="noopener noreferrer" title="Open it where it is published">' + ICON.globe + ' Open ↗</a>' : '') +
        (canOpen && !priv ? ib({ href: e.file, target: '_blank', rel: 'noopener' }, ICON.tab, 'Open in a new tab') + ib({ href: e.file, download: '' }, ICON.down, 'Download') : '') +
        (canOpen && priv ? ib({ 'data-a': 'dl' }, ICON.down, 'Download') : '') +
        (e.url && e.file ? ib({ href: e.url, target: '_blank', rel: 'noopener noreferrer' }, ICON.globe, 'Where it is published') : '') +
        ib({ 'data-a': 'share' }, SW.SHARE_ICON || ICON.globe, 'Share a link to this entry') +
        '<span class="lib-refbox">' + ib({ 'data-a': 'ref', 'aria-haspopup': 'true', 'aria-expanded': 'false' }, ICON.ref, 'Export this work for Zotero') +
          '<div class="lib-refmenu" hidden><span class="lib-loanst">Export this work</span><button class="btn ghost" data-a="refris" title="Opens in Zotero, EndNote and Mendeley">Download RIS</button><button class="btn ghost" data-a="refbib">Download BibTeX</button><button class="btn ghost" data-a="refcopy" title="For Zotero’s Import from Clipboard">Copy BibTeX</button></div></span>' +
        (canRate() ? ib({ 'data-a': 'key' }, ICON.flag(false), 'Mark this as a key work for the group') : '') +
        '<span class="lib-loanbox"></span>' +
        (isAdded(e) && L.member() ? '<button class="btn ghost" data-a="edit">Correct</button><button class="btn ghost" data-a="rm">Remove</button>' : '');
      d.innerHTML = '<div class="tray-bighead"><span class="px-code mono">' + esc(e.id) + '</span> <span class="lib-dmarks"></span><b>' + esc(e.title) + '</b><button class="icon-btn" data-x title="Close (Esc)">✕</button></div>' +
        '<div class="lib-cols"><div class="lib-main"><div class="lib-acts">' + acts + '<span class="lib-copies"></span></div>' +
        (boxCover ? '<div class="lib-head"><img class="lib-boxcover" src="' + esc(boxCover) + '" alt="" referrerpolicy="no-referrer"><div class="lib-head-t">' : '') +
        '<div class="lib-cite"><span class="lib-cite-t">' + cite.html + '</span> <button class="btn ghost" data-a="cite" title="Copy this citation">Copy</button></div>' +
        (rec ? '<dl class="lib-rec">' + rec + '</dl>' : '') +
        '<div class="lib-tags"></div>' +
        (boxCover ? '</div></div>' : '') +
        (canOpen ? '<div class="lib-file" data-k="' + k + '"><p class="hint">Opening the file…</p></div>' :
          priv && e.file ? '<p class="hint">The group keeps a copy of this work in its private repository; members open it here with their GitHub token (⚙ Settings)' + (e.url ? '. The link above goes to it where it is published.' : '.') + '</p>' + (player || '') :
          player || '<p class="hint">' + (e.url ? 'Copy not held in the library, use the link above to view it.' : 'Copy not held in the library.') + '</p>') +
        (alts.length || (canOpen && player) ? '<div class="lib-alts">' + (canOpen && player ? '<button class="btn ghost" data-play>▶ Play from ' + esc(hostName(e.url)) + '</button>' : '') + alts.map(function (a, i) { return '<button class="btn ghost" data-alt="' + i + '">' + esc(a.label || a.lang || 'Another version') + '</button>'; }).join('') + '</div><div class="lib-alt"></div>' : '') +
        '</div><div class="lib-side"></div></div>';
      document.body.appendChild(d);
      function paintKey() {
        var on = keyOf(e) < Infinity, kb = SW.$('[data-a="key"]', d), dm = SW.$('.lib-dmarks', d);
        if (dm) dm.innerHTML = marksOf(e);
        if (kb) { var words = on ? 'A key work for the group: take the mark off' : 'Mark this as a key work for the group'; kb.innerHTML = ICON.flag(on); kb.classList.toggle('on', on); kb.setAttribute('aria-pressed', on ? 'true' : 'false'); kb.title = words; kb.setAttribute('aria-label', words); }
      }
      paintKey();
      function paintLoan() {
        var lb = SW.$('.lib-loanbox', d), cur = onLoan(e.id), oth = othersOut(e.id); if (!lb) return;
        var was = SW.$('.lib-loanmenu', lb), open = was && !was.hidden;
        var outTo = oth.length ? 'Out to ' + oth.map(function (r) { return r.by + (r.due ? ' till ' + dueShort(r.due) : ''); }).join(', ') + '.' : '';
        var words = cur ? 'On your To read shelf, due ' + (cur.due ? dueShort(cur.due) : 'with no date') : 'Add to To Read';
        lb.innerHTML = '<button class="btn ghost lib-ib' + (cur ? ' on' : '') + '" data-a="loan" aria-haspopup="true" aria-expanded="' + (open ? 'true' : 'false') + '" title="' + esc(words + (outTo ? '. ' + outTo : '')) + '" aria-label="' + esc(words) + '">' + ICON.mark(!!cur) + '</button>' +
          (cur ? '<span class="lib-loandue">' + (cur.due ? 'DUE ' + dueShort(cur.due) : 'ON LOAN') + '</span>' : '') +
          '<div class="lib-loanmenu"' + (open ? '' : ' hidden') + '>' + (outTo ? '<span class="lib-loanst lib-loan-oth">' + esc(outTo) + '</span>' : '') + (cur ? '<span class="lib-loanst">On your To read shelf, due ' + stampOf(cur.due) + '</span> <button class="btn ghost" data-a="return">Return</button>'
          : '<span class="lib-loanst">Add to To Read:</span> <button class="btn ghost" data-a="co" data-m="1">1</button><button class="btn ghost" data-a="co" data-m="2">2</button><button class="btn ghost" data-a="co" data-m="3" title="Check it out to your To read shelf">3 months</button>') + '</div>';
      }
      function afterLoan() { paintLoan(); var v2 = SW.$('#view-library'); if (v2 && SW.$('.lib-list', v2)) list(v2); }
      sweepLoans(); paintLoan();
      if (canRate() && itemNotes().itemLoansOthers) itemNotes().itemLoansOthers().then(function (o) { setOthers(o); paintLoan(); }, function () {});
      if (canRate()) itemNotes().itemKeys().then(function (k) { setKeys(k); paintKey(); }, function () {});
      function paintTags() {
        var at = SW.$('.lib-tags', d), can = canRate(), ws = plainTags(e), was = SW.$('.lib-taginput', d), typed = was ? was.value : '', lvl = relOf(e);
        if (!at) return;
        at.hidden = !ws.length && !can;
        at.innerHTML = (can ? '<label class="lib-rel">Relevance <select class="lib-relsel" aria-label="Relevance"><option value="">No level</option>' + RELEVANCE.map(function (r) { return '<option value="' + r + '"' + (r === lvl ? ' selected' : '') + '>' + REL_NAMES[r] + '</option>'; }).join('') + '</select></label>' : '') +
          (ws.length || can ? '<span class="lib-tags-h">Tags</span>' : '') + ws.map(function (w) {
          return '<span class="lib-tag">' + esc(w) + (can ? '<button type="button" data-tagoff="' + esc(w) + '" title="Take this tag off, for the group" aria-label="Take off ' + esc(w) + '">×</button>' : '') + '</span>';
        }).join('') + (can ? '<input class="lib-taginput" list="lib-alltags" placeholder="Add a tag" aria-label="Add a tag" value="' + esc(typed) + '"><datalist id="lib-alltags">' + allTags().map(function (w) { return '<option value="' + esc(w) + '">'; }).join('') + '</datalist>' : '');
      }
      function changeTag(word, on) {
        return itemNotes().setItemTag(e.id, word, on).then(function () {
          TMINE[e.id] = TMINE[e.id] || {};
          TMINE[e.id][word] = { on: on, date: new Date().toISOString(), by: 'you' };
          setTags(JSON.parse(JSON.stringify(TM)));
          paintTags();
          var v1 = SW.$('#view-library'); if (v1 && SW.$('.lib-list', v1)) afterTags(v1);
        }, function (err) { if (err.message !== 'no initials') SW.toast(err.message, 5000); });
      }
      // one level: the others come off as this goes on
      function setLevel(r) {
        var word = r ? REL_NAMES[r] : '', steps = tagsOf(e).filter(function (w) { return levelOfWord(w) && w !== word; }).map(function (w) { return [w, false]; });
        if (word && tagsOf(e).indexOf(word) < 0) steps.push([word, true]);
        return steps.reduce(function (p, s) { return p.then(function () { return changeTag(s[0], s[1]); }); }, Promise.resolve());
      }
      d.addEventListener('change', function (ev) { if (ev.target.classList && ev.target.classList.contains('lib-relsel')) setLevel(ev.target.value); });
      paintTags();
      if (canRate()) itemNotes().itemTags().then(function (t) { setTags(t); paintTags(); }, function () {});
      d.addEventListener('keydown', function (ev) {
        if (ev.key !== 'Enter' || !ev.target.classList || !ev.target.classList.contains('lib-taginput')) return;
        ev.preventDefault();
        var inp = ev.target, typed = inp.value.replace(/\s+/g, ' ').trim();
        if (!typed) return;
        if (levelOfWord(typed)) { inp.value = ''; setLevel(levelOfWord(typed)); return; }
        // the spelling already in use, whatever the case
        var same = allTags().filter(function (w) { return w.toLowerCase() === typed.toLowerCase(); })[0] || typed;
        if (tagsOf(e).indexOf(same) >= 0) { inp.value = ''; return; }
        inp.value = '';
        changeTag(same, true).then(function () { var again = SW.$('.lib-taginput', d); if (again) again.focus(); });
      });
      d.addEventListener('close', function () { d.remove(); });
      d.addEventListener('error', function (ev) { if (ev.target.classList && ev.target.classList.contains('lib-boxcover')) ev.target.remove(); }, true);
      d.addEventListener('click', function (ev) {
        if (ev.target === d || ev.target.closest('[data-x]')) { d.close(); return; }
        var lo = ev.target.closest('[data-a="loan"]');
        if (lo) { var mn = SW.$('.lib-loanmenu', d); mn.hidden = !mn.hidden; lo.setAttribute('aria-expanded', mn.hidden ? 'false' : 'true'); return; }
        if (!ev.target.closest('.lib-loanmenu')) { var mn0 = SW.$('.lib-loanmenu', d); if (mn0) mn0.hidden = true; }
        var rf = ev.target.closest('[data-a="ref"]'), rm = SW.$('.lib-refmenu', d);
        if (rf) { rm.hidden = !rm.hidden; rf.setAttribute('aria-expanded', rm.hidden ? 'false' : 'true'); return; }
        var rx = ev.target.closest('[data-a="refris"], [data-a="refbib"], [data-a="refcopy"]');
        if (rx) { rm.hidden = true; exportList([e], { refris: 'ris', refbib: 'bib', refcopy: 'copybib' }[rx.dataset.a], e.id); return; }
        if (rm && !rm.hidden && !ev.target.closest('.lib-refmenu')) rm.hidden = true;
        var co = ev.target.closest('[data-a="co"]'); if (co) { L.checkOut(e.id, +co.dataset.m); afterLoan(); return; }
        if (ev.target.closest('[data-a="return"]')) { L.giveBack(e.id); afterLoan(); return; }
        var tf = ev.target.closest('[data-tagoff]'); if (tf) { changeTag(tf.dataset.tagoff, false); return; }
        var kb = ev.target.closest('[data-a="key"]');
        if (kb) {
          var want = !(keyOf(e) < Infinity), N0 = itemNotes();
          kb.disabled = true;
          N0.setItemKey(e.id, want).then(function () {
            KMINE[e.id] = { on: want, date: new Date().toISOString(), by: 'you' };
            setKeys(Object.assign({}, KM));
            paintKey();
            var v0 = SW.$('#view-library'); if (v0 && SW.$('.lib-list', v0)) list(v0);
          }, function (err) { if (err.message !== 'no initials') SW.toast(err.message, 5000); }).then(function () { kb.disabled = false; });
          return;
        }
        if (ev.target.closest('[data-a="share"]')) { SW.share({ title: e.title, url: linkTo(e.id) }); return; }
        if (ev.target.closest('[data-a="link"]')) { SW.copyText(linkTo(e.id), 'the link'); return; }
        if (ev.target.closest('[data-a="cite"]')) { SW.copyText(cite.text, 'the citation'); return; }
        var pl = ev.target.closest('[data-play]');
        if (pl) {
          var was0 = pl.classList.contains('on');
          SW.$$('[data-alt], [data-play]', d).forEach(function (b) { b.classList.remove('on'); });
          // a held recording stops while the other plays
          SW.$$('.lib-file audio, .lib-file video', d).forEach(function (m) { m.pause(); });
          SW.$('.lib-alt', d).innerHTML = was0 ? '' : player;
          if (!was0) pl.classList.add('on');
          return;
        }
        var alt = ev.target.closest('[data-alt]');
        if (alt) {
          var a = alts[+alt.dataset.alt], at = SW.$('.lib-alt', d), was = alt.classList.contains('on');
          SW.$$('[data-alt], [data-play]', d).forEach(function (b) { b.classList.remove('on'); });
          if (was) { at.innerHTML = ''; return; }
          alt.classList.add('on');
          at.innerHTML = '<p class="hint">Opening…</p>';
          show(at, { file: a.file, lang: a.lang || e.lang, title: a.label || e.title }, kindOfFile(a.file), isPrivate(a));
          return;
        }
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
      if (SW.notes && SW.notes.itemPanel) SW.notes.itemPanel(SW.$('.lib-side', d), e.id, { host: SW.$('.lib-main', d), rate: true });
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
