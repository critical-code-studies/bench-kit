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
 *   { url, label, intro, items, load, private, view, order }: url the manifest (from the page); items the entries given here
 *   instead; load() a promise of the manifest (a bench that makes it from another list, such as a
 *   translation's corpus/SOURCES.md); label the tab's name (Library); intro HTML above the list; view and
 *   order what a reader sees first ('icons' or 'list'; 'author', 'title', 'new', 'old', 'kind', 'lang' or
 *   'listed'), author and icons unless set. A reader's own choice is kept in the browser.
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
 *   thumb     an image for its cover: a path from the page, or a link. Without one, a public image file
 *             is its own cover, and otherwise a cover is drawn from the kind
 *   tags      [word], for the filter
 * The tab shows the entries as covers on a shelf, or as a list, in an order the reader picks, with a search
 * and filters (held here, links out, by kind); an entry opens
 * in a box over the bench: its record, the file shown (a PDF in the browser's own viewer), Open in a
 * new tab, Download, the link out, and a link to the entry.
 * The group's own copy: where the reader has a paratexts token (kit/paratexts.js), the paratexts that
 * name an entry (a record's library: [id], or a tag library:<id>) are offered in its box as well, and
 * open as a paratext does (SW.paratexts.peek). Without a token nothing is looked up or shown, and the
 * public manifest does not name these paratexts.
 * Members see the private repository's size above the list (GitHub works badly above about 1 GB).
 * Additions: a member adds a work from the tab (＋ Add a work), with a copy of it or without. A member's
 * token reaches the private repository only, so the entry goes in its library/additions.json ({ items })
 * and any copy beside it (library/<id>.<ext>, 40 MB at most). Members see additions in the list at once,
 * and may correct or remove them there; nobody else sees them. tools/library-publish.js brings them into
 * the public manifest, when the person running the bench chooses.
 * SW.library: load(), items(), open(id), copies(id), privateRepo(), member(), size(), add(record, file),
 * update(id, record), remove(id), form(entry), family(entry), year(date), surname(author), sorted(items, order),
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
  var man = null, loading = null, addRead = false, F = { q: '', show: 'all', kind: '', view: SW.store.get('library.view', '') || C.view || 'icons', order: SW.store.get('library.order', '') || C.order || 'author' };
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
    ['title', 'author', 'date', 'kind', 'lang', 'note', 'licence', 'url', 'source', 'thumb'].forEach(function (k) { var v = String(r[k] == null ? '' : r[k]).trim(); if (v) o[k] = v; });
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
        var entry = Object.assign({ id: id }, o, file ? { shelf: 'private', file: path } : {}, { added: Object.assign(who() === '?' ? {} : { by: who() }, { date: new Date().toISOString().slice(0, 10) }) });
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
      '<div class="lib-fields">' + field('title', 'Title') + field('author', 'Author') + field('date', 'Date') + field('kind', 'Kind', ' list="lib-kinds"') + field('lang', 'Language') +
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
  function titleKey(t) { return String(t == null ? '' : t).replace(/^[\s"'“‘«(\[]+/, '').replace(/^(the|an?|le|la|les|der|die|das)\s+/i, ''); }
  var AZ = root.Intl && Intl.Collator ? new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' }).compare : function (a, b) { return a < b ? -1 : a > b ? 1 : 0; };
  L.sorted = function (items, order) {
    var byTitle = function (a, b) { return AZ(titleKey(a.title), titleKey(b.title)); };
    // what has no value for this order goes after what has
    function by(key, then) { return function (a, b) { var x = key(a), y = key(b); if (!x !== !y) return x ? -1 : 1; return (x && AZ(x, y)) || then(a, b); }; }
    function byYear(sign) { return function (a, b) { var x = L.year(a.date), y = L.year(b.date); if ((x == null) !== (y == null)) return x == null ? 1 : -1; return (x == null ? 0 : sign * (x - y)) || byTitle(a, b); }; }
    var fn = order === 'title' ? byTitle : order === 'new' ? byYear(-1) : order === 'old' ? byYear(1) :
      order === 'kind' ? by(function (e) { return e.kind; }, byTitle) : order === 'lang' ? by(function (e) { return e.lang; }, byTitle) :
      order === 'author' ? by(function (e) { return L.surname(e.author); }, byYear(1)) : null;
    return fn ? items.slice().sort(fn) : items.slice();
  };
  var ORDERS = [['author', 'Author'], ['title', 'Title'], ['new', 'Date, newest first'], ['old', 'Date, oldest first'], ['kind', 'Kind'], ['lang', 'Language'], ['listed', 'As listed']];

  // ---------- covers ----------
  // what a cover is drawn as: a kind's own word first, then what the file is
  var FAMILY = { book: 'book', monograph: 'book', edition: 'book', 'edited volume': 'book', anthology: 'book', 'parallel text': 'book', translation: 'book', thesis: 'thesis', dissertation: 'thesis',
    article: 'article', paper: 'article', essay: 'article', review: 'article', report: 'article', chapter: 'chapter', letter: 'letter', correspondence: 'letter',
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
    web: '<path d="M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/>',
    other: '<path d="M3 7h6l2 2h10v11H3z"/>'
  };
  function glyph(f) { return '<svg class="lib-glyph" viewBox="0 0 24 24" aria-hidden="true">' + (GLYPH[f] || GLYPH.other) + '</svg>'; }
  // the entry's own picture, where it has one a reader may be shown
  function thumbOf(e) { return e.thumb || (e.file && !isPrivate(e) && kindOfFile(e.file) === 'image' ? e.file : ''); }
  var CLOTH = ['#1f3a5f', '#6b1e2b', '#23493a', '#4a3b6b', '#3d4a52', '#7a4a12', '#0f5e63', '#2c2c2c'];
  function cloth(id) { var h = 0; String(id).split('').forEach(function (c) { h = (h * 31 + c.charCodeAt(0)) >>> 0; }); return CLOTH[h % CLOTH.length]; }
  function host(u) { var m = /^https?:\/\/(?:www\.)?([^/]+)/i.exec(u || ''); return m ? m[1] : ''; }
  function coverOf(e) {
    var f = L.family(e), who = e.author ? '<span class="lib-c-a">' + esc(e.author) + '</span>' : '';
    var word = f === 'book' ? '' : '<span class="lib-c-k">' + glyph(f) + esc(e.kind || (f === 'web' ? 'web page' : f === 'audio' ? 'audio' : f === 'film' ? 'film' : '')) + '</span>';
    return '<span class="lib-cover lib-c-' + f + '" aria-hidden="true"' + (f === 'book' || f === 'thesis' ? ' style="--cloth:' + (f === 'thesis' ? '#22262b' : cloth(e.id)) + '"' : '') + '>' +
      (f === 'web' ? '<span class="lib-c-chrome"><i></i><i></i><i></i></span>' : '') + word +
      '<span class="lib-c-t">' + esc(e.title) + '</span>' + (f === 'web' && !e.author && host(e.url) ? '<span class="lib-c-a">' + esc(host(e.url)) + '</span>' : who) + '</span>';
  }
  // a picture that will not load leaves the drawn cover under it
  function tile(e) {
    var pic = thumbOf(e), said = [e.title, e.author, e.date, e.kind].filter(Boolean).join(', ');
    return '<button class="lib-tile" data-lib="' + esc(e.id) + '" title="' + esc(said) + '" aria-label="' + esc(said + '. ' + heldAs(e)) + '">' +
      '<span class="lib-stand">' + coverOf(e) + (pic ? '<img class="lib-thumb" src="' + esc(pic) + '" alt="" loading="lazy" referrerpolicy="no-referrer">' : '') + '</span>' +
      '<span class="lib-cap">' + (pic ? '<span class="lib-t">' + esc(e.title) + '</span>' : '') +
      '<span class="lib-m">' + [e.author, L.year(e.date) || e.date].filter(Boolean).map(esc).join(', ') + '</span>' +
      '<span class="lib-h ' + heldClass(e) + '">' + heldAs(e) + '</span></span></button>';
  }
  function row(e) {
    var pic = thumbOf(e);
    return '<button class="lib-row" data-lib="' + esc(e.id) + '"><span class="lib-mini lib-c-' + L.family(e) + '">' + (pic ? '<img class="lib-thumb" src="' + esc(pic) + '" alt="" loading="lazy" referrerpolicy="no-referrer">' : glyph(L.family(e))) + '</span>' +
      '<span class="lib-t">' + esc(e.title) + '</span><span class="lib-m">' + meta(e) + '</span>' +
      '<span class="lib-h ' + heldClass(e) + '">' + heldAs(e) + '</span></button>';
  }
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
  function setting(key, name, v) { F[key] = v; SW.store.set('library.' + name, v); }
  function list(view) {
    var box = SW.$('.lib-list', view); if (!box) return;
    var rs = L.sorted(rows(), F.order), icons = F.view !== 'list';
    box.classList.toggle('lib-shelf', icons);
    box.innerHTML = rs.length ? rs.map(icons ? tile : row).join('') : '<p class="hint pad">Nothing in the library answers the search.</p>';
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
        '<span class="lib-show">' + [['all', 'All'], ['held', 'Held']].concat(m.items.some(isPrivate) ? [['group', 'For the group']] : []).concat([['out', 'Linked']]).concat((m.adds || []).length ? [['added', 'Added']] : []).map(function (s) { return '<button class="btn' + (F.show === s[0] ? ' on' : '') + '" data-show="' + s[0] + '">' + s[1] + '</button>'; }).join('') + '</span>' +
        (kinds.length > 1 ? '<select class="lib-kind" aria-label="Kind"><option value="">Every kind</option>' + kinds.sort().map(function (k) { return '<option' + (k === F.kind ? ' selected' : '') + '>' + esc(k) + '</option>'; }).join('') + '</select>' : '') +
        '<label class="lib-order faint">Order <select aria-label="Order">' + ORDERS.filter(function (o) { return o[0] !== 'lang' || m.items.some(function (e) { return e.lang; }); }).map(function (o) { return '<option value="' + o[0] + '"' + (F.order === o[0] ? ' selected' : '') + '>' + o[1] + '</option>'; }).join('') + '</select></label>' +
        '<span class="im-seg lib-views" role="group" aria-label="View"><button class="btn' + (F.view !== 'list' ? ' on' : '') + '" data-libview="icons" title="Covers on a shelf" aria-label="Covers">▦</button><button class="btn' + (F.view === 'list' ? ' on' : '') + '" data-libview="list" title="A list" aria-label="List">☰</button></span>' +
        '<button class="btn ghost lib-help" title="How the Library works" aria-label="How the Library works">?</button>' +
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
          if (ev.target.closest('.lib-help')) { L.help(); return; }
          var w = ev.target.closest('[data-libview]'); if (w) { setting('view', 'view', w.dataset.libview); SW.$$('[data-libview]', view).forEach(function (b) { b.classList.toggle('on', b === w); }); list(view); return; }
          var s = ev.target.closest('[data-show]'); if (s) { F.show = s.dataset.show; SW.$$('[data-show]', view).forEach(function (b) { b.classList.toggle('on', b === s); }); list(view); return; }
          var r = ev.target.closest('[data-lib]'); if (r) L.open(r.dataset.lib);
        });
      }
      var k = SW.$('.lib-kind', view); if (k) k.addEventListener('change', function () { F.kind = k.value; list(view); });
      var o = SW.$('.lib-order select', view); o.addEventListener('change', function () { setting('order', 'order', o.value); list(view); });
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
        '<b>▦</b> shows covers on a shelf, and <b>☰</b> a list. A cover is drawn from the kind of work, or is an image of it where the entry has one.',
        '<b>Order</b> sorts by author, title, date, kind or language, or as the library lists them. Your choice of view and order is kept in this browser.',
        'The search reads the title, author, date, kind, note, licence, source and tags. <b>Held</b>, <b>For the group</b> and <b>Linked</b> show those entries only, and <b>Every kind</b> narrows to one kind.'])],
      ['Opening a work', ul([
        'Click a cover or a row: the record opens in a box over the bench, with the file where you can read it, and a link to where it is published.',
        'PDFs, text, Markdown, HTML, images, audio and video show in the box. Any other file can be downloaded.',
        '<b>For the group</b> means the group keeps a copy in its private repository. A member with a GitHub token (⚙ Settings) opens it here; anyone else sees the record and the link.',
        '<b>🔗 Copy link</b> copies a link to the entry.'])],
      ['Adding a work', ul([
        'A member with a token has <b>＋ Add a work</b>: a record, with a copy of up to 40 MB or without one, and a link to a cover image if you have one.',
        'It goes in the group’s private repository. Members see it at once, marked <b>Added, not yet public</b>, and can correct or remove it from its box. Nobody else sees it.',
        'It joins the public list when the person running the bench publishes it, without the name of who added it. A copy stays private.'])]
    ]]);
    SW.guide('library');
  };
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
        (e.url ? '<a class="btn' + (e.file ? ' ghost' : '') + '" href="' + esc(e.url) + '" target="_blank" rel="noopener noreferrer">' + (e.file ? 'Where it is published ↗' : 'Open where it is published ↗') + '</a>' : '') +
        '<button class="btn ghost" data-a="link" title="Copies a link to this entry">🔗 Copy link</button>' +
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
