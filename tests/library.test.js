/*
 * tests/library.test.js - checks of kit/library.js, run by tests/run.js, whatever the bench: the module
 * loaded here with entries of its own. Audio and video in an entry's box, on the public shelf and through
 * GitHub on the private one; a private entry without a token, with nothing asked of GitHub; a member adding,
 * correcting and removing works, against a stand-in for GitHub's contents API.
 * Part of bench-kit (github.com/critical-code-studies/bench-kit).
 */
(function () {
  'use strict';
  var T = window.T, kit = document.currentScript.src.replace(/[^/]*$/, '').replace(/tests\/$/, '');
  function wait(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function box() { var ds = document.querySelectorAll('dialog.lib-dlg'); return ds[ds.length - 1] || null; }
  function load() {
    return new Promise(function (res, rej) {
      var s = document.createElement('script'); s.src = kit + 'library.js?t=' + Date.now() + Math.random(); s.onload = res; s.onerror = function () { rej(new Error('could not load library.js')); }; document.body.appendChild(s);
    });
  }
  function b64(s) { var b = new TextEncoder().encode(s), t = ''; for (var i = 0; i < b.length; i++) t += String.fromCharCode(b[i]); return btoa(t); }
  function unb64(s) { var bin = atob(s), b = new Uint8Array(bin.length); for (var i = 0; i < bin.length; i++) b[i] = bin.charCodeAt(i); return new TextDecoder().decode(b); }
  function json(o, status) { return Promise.resolve(new Response(JSON.stringify(o), { status: status || 200, headers: { 'Content-Type': 'application/json' } })); }
  function run() {
    var SW = window.SW, B = SW.BENCH;
    var was = { lib: B.library, mod: SW.library, view: SW.views && SW.views.library, kit: SW.kitViews, px: SW.paratexts, token: SW.store.get('gh.token', ''), fetch: window.fetch };
    var hadTab = !!document.querySelector('[data-tab="library"]'), hadView = !!document.getElementById('view-library');
    SW.views = SW.views || {};
    function shelfChecks(L) {
      T.eq('a year, as a catalogue writes it', ['2001', 'c. 1935', '1935-40', '20 Nov 2019', '', null, 'n.d.'].map(L.year), [2001, 1935, 1935, 2019, null, null, null]);
      T.eq('a surname', ['A. Scholar', 'Scholar, A.', 'Ōtsuka, Hisao', 'A. One and B. Two', 'A. One; B. Two', 'Plato', ''].map(L.surname), ['Scholar', 'Scholar', 'Ōtsuka', 'One', 'One', 'Plato', '']);
      var es = [
        { id: 'a', title: 'The Zebra', author: 'B. Young', date: '1990', kind: 'book' },
        { id: 'b', title: 'Apples', author: 'Ōtsuka, Hisao', date: '2010', kind: 'article', lang: 'ja' },
        { id: 'c', title: 'A Middle', date: 'n.d.', kind: 'talk' },
        { id: 'd', title: 'Early', author: 'B. Oak', date: 'c. 1935', kind: 'article', lang: 'en' }
      ];
      function ids(o) { return L.sorted(es, o).map(function (e) { return e.id; }).join(''); }
      T.eq('by author, surnames, those without last', ids('author'), 'dbac');
      T.eq('by title, without the opening article', ids('title'), 'bdca');
      T.eq('newest first, those without a date last', ids('new'), 'badc');
      T.eq('oldest first, those without a date last', ids('old'), 'dabc');
      T.eq('by kind', ids('kind'), 'bdac');
      T.eq('by language, those without last', ids('lang'), 'dbca');
      T.eq('as listed', ids('listed'), 'abcd');
      T.eq('the entries themselves left in their order', es[0].id, 'a');
      T.eq('a cover from the kind, whatever its case', [{ kind: 'Book' }, { kind: 'essay' }, { kind: 'lecture' }, { kind: 'documentary' }, { kind: 'PhD oddity' }].map(L.family), ['book', 'article', 'talk', 'film', 'other']);
      T.eq('or from the file', [{ file: 'a.mp3' }, { file: 'a.webm' }, { file: 'a.pdf' }, { url: 'https://example.org' }].map(L.family), ['audio', 'film', 'article', 'web']);
    }
    var PUB = [
      { id: 'a1', title: 'A talk', file: 'library/files/talk.mp3' },
      { id: 'v1', title: 'A film', file: 'library/files/film.mp4' },
      { id: 'p1', title: 'A podcast', shelf: 'private', file: 'library/podcast.m4a', url: 'https://example.org/podcast' }
    ];
    B.library = { private: { org: 'group', repo: 'archive' }, items: PUB };
    SW.paratexts = undefined;   // the group's copies are not what is tried here
    var asked = [], repo = null, shas = 0, conflicts = 0, puts = [];
    // repo null: every answer a small file. repo an object: GitHub's contents API, on that object
    window.fetch = function (u, o) {
      if (!/api\.github\.com/.test(String(u))) return was.fetch.apply(window, arguments);
      asked.push(String(u));
      if (!repo) return Promise.resolve(new Response(new Blob(['x']), { status: 200 }));
      var p = decodeURIComponent(String(u).split('/contents/')[1] || ''), m = (o && o.method) || 'GET', b = o && o.body ? JSON.parse(o.body) : null;
      if (m === 'GET') return repo[p] ? json({ sha: repo[p].sha, content: repo[p].content }) : json({}, 404);
      if (m === 'PUT') {
        puts.push(p);
        if (conflicts > 0) { conflicts--; return json({}, 409); }
        if (repo[p] && b.sha !== repo[p].sha) return json({}, 409);
        repo[p] = { sha: 's' + (++shas), content: b.content };
        return json({ content: { sha: repo[p].sha } });
      }
      if (m === 'DELETE') { if (!repo[p] || b.sha !== repo[p].sha) return json({}, 409); delete repo[p]; return json({}); }
      return json({}, 400);
    };
    function addsIn() { return repo['library/additions.json'] ? JSON.parse(unb64(repo['library/additions.json'].content)).items : []; }
    function refused(p) { return p.then(function () { return null; }, function (e) { return e.message; }); }
    function restore() {
      window.fetch = was.fetch; B.library = was.lib; SW.library = was.mod; SW.kitViews = was.kit; SW.paratexts = was.px; SW.store.set('gh.token', was.token);
      if (was.view) SW.views.library = was.view; else delete SW.views.library;
      if (!hadTab) { var t = document.querySelector('[data-tab="library"]'); if (t) t.remove(); }
      if (!hadView) { var v = document.getElementById('view-library'); if (v) v.remove(); }
      document.querySelectorAll('dialog.lib-dlg, dialog.lib-form').forEach(function (d) { if (d.open) d.close(); d.remove(); });
    }
    SW.store.set('gh.token', '');
    return load().then(function () {
      shelfChecks(SW.library);
      // the tab, in a section of its own for the checks
      T.group('Library: the shelf');
      var hadV = document.getElementById('view-library'), v = hadV || document.body.appendChild(Object.assign(document.createElement('section'), { id: 'view-library', className: 'view' }));
      var keepV = SW.store.get('library.view', ''), keepO = SW.store.get('library.order', '');
      SW.store.set('library.view', ''); SW.store.set('library.order', '');
      var was0 = B.library;
      B.library = { items: PUB.concat([{ id: 'c1', title: 'A jacket', kind: 'book', thumb: 'library/thumbs/none.jpg' }, { id: 'c2', title: 'Bare', kind: 'article' }, { id: 'c3', title: 'Cloth', kind: 'book', thumb: 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7' }]), private: { org: 'group', repo: 'archive' } };
      return load().then(function () { SW.views.library.show(); return wait(60); }).then(function () {
        T.eq('covers first', v.querySelectorAll('.lib-tile').length, 6);
        T.eq('none as a list', v.querySelectorAll('.lib-row').length, 0);
        T.yes('a book drawn as a book, until its picture loads', v.querySelector('[data-lib="c3"] .lib-cover.lib-c-book'));
        T.yes('its picture over it', v.querySelector('[data-lib="c3"] img.lib-thumb'));
        T.yes('an article as an article', v.querySelector('[data-lib="c2"] .lib-cover.lib-c-article'));
        T.eq('by author first', v.querySelector('.lib-order select').value, 'author');
        v.querySelector('[data-libview="list"]').click();
        T.eq('the switch: a list', v.querySelectorAll('.lib-row').length, 6);
        T.eq('which is kept', SW.store.get('library.view', ''), 'list');
        var o = v.querySelector('.lib-order select'); o.value = 'title'; o.dispatchEvent(new Event('change'));
        T.eq('in the order chosen', Array.prototype.map.call(v.querySelectorAll('.lib-row .lib-t'), function (x) { return x.textContent; }).join('|'), 'Bare|Cloth|A film|A jacket|A podcast|A talk');
        T.eq('and kept', SW.store.get('library.order', ''), 'title');
        v.querySelector('[data-libview="icons"]').click();
        return wait(300);
      }).then(function () {
        var img = v.querySelector('[data-lib="c1"] img.lib-thumb');
        T.eq('a picture that will not load: the drawn cover alone', img, null);
        SW.store.set('library.view', keepV); SW.store.set('library.order', keepO);
        if (!hadV) v.remove(); else v.innerHTML = '';
        B.library = was0;
        T.group('Library: audio and video');
        return load();
      });
    }).then(function () { return SW.library.open('a1'); }).then(function () {
      T.group('Library: audio and video');
      var a = box().querySelector('audio.lib-audio');
      T.yes('an audio file gets a player', a);
      T.eq('from its path', a && a.getAttribute('src'), 'library/files/talk.mp3');
      box().close();
      return SW.library.open('v1');
    }).then(function () {
      var v = box().querySelector('video.lib-video');
      T.eq('a video file gets a player, from its path', v && v.getAttribute('src'), 'library/files/film.mp4');
      box().close();
      return SW.library.open('p1');
    }).then(function () { return wait(30); }).then(function () {
      var d = box();
      T.eq('a private file without a token: no player', d.querySelectorAll('audio, video').length, 0);
      T.yes('its link out stays', d.querySelector('a[href="https://example.org/podcast"]'));
      T.eq('and nothing is asked of GitHub', asked, []);
      d.close();
      SW.store.set('gh.token', 'test-token');
      return SW.library.open('p1');
    }).then(function () { return wait(100); }).then(function () {
      var a = box().querySelector('audio.lib-audio');
      T.yes('with a token it plays', a && /^blob:/.test(a.getAttribute('src') || ''));
      T.eq('read from the private repository', asked.filter(function (u) { return /repos\/group\/archive\/contents\/library\/podcast\.m4a/.test(u); }).length, 1);
      return was.fetch.call(window, a.getAttribute('src')).then(function (r) { return r.blob(); }).then(function (b) { T.eq('with its media type named', b.type, 'audio/mp4'); });
    }).then(function () {
      // ---------- adding, against the stand-in; a fresh module for each stage ----------
      box().close();
      T.group('Library: adding from the bench');
      repo = { 'library/additions.json': { sha: 's0', content: b64(JSON.stringify({ items: [{ id: 'a1', title: 'Named as a public entry is' }, { id: 'old', title: 'Already waiting' }] })) } };
      return load();
    }).then(function () { return SW.library.load(); }).then(function () {
      var L = SW.library;
      T.yes('a member sees what is waiting', L.items().some(function (e) { return e.id === 'old'; }));
      T.eq('the public entry stands where an addition has its id', L.items().filter(function (e) { return e.id === 'a1'; })[0].title, 'A talk');
      return refused(L.add({ author: 'No title' })).then(function (m) {
        T.yes('no title: refused', /title/.test(m || ''));
        return refused(L.add({ title: 'Bad link', url: 'javascript:alert(1)' }));
      }).then(function (m) {
        T.yes('a link that is not a web address: refused', /http/.test(m || ''));
        var big = new File(['x'], 'big.mp4'); Object.defineProperty(big, 'size', { value: 6e7 });
        return refused(L.add({ title: 'Too big' }, big));
      }).then(function (m) {
        T.yes('over 40 MB: refused', /40 MB/.test(m || ''));
        T.eq('and none of these wrote anything', puts, []);
        return L.add({ title: ' A stub ', url: 'https://example.org/stub', tags: ['one', ' ', 'two'], stray: 'dropped' });
      }).then(function (id) {
        var e = addsIn().filter(function (x) { return x.id === id; })[0];
        T.yes('an id of the Library’s own', /^L-[0-9A-Z]{5}$/.test(id));
        T.eq('a record without a copy is on no shelf', [e.title, e.url, e.shelf, e.file], ['A stub', 'https://example.org/stub', undefined, undefined]);
        T.eq('only an entry’s fields, tags trimmed', [e.stray, e.tags], [undefined, ['one', 'two']]);
        T.yes('it says when', e.added && /^\d{4}-\d\d-\d\d$/.test(e.added.date));
        T.yes('and is in the list at once', L.items().some(function (x) { return x.id === id; }));
        puts.length = 0;
        return L.add({ title: 'With a copy' }, new File(['audio'], 'My Talk.M4A', { type: 'audio/mp4' }));
      }).then(function (id) {
        var e = addsIn().filter(function (x) { return x.id === id; })[0], path = 'library/' + id + '.m4a';
        T.eq('a copy goes on the private shelf, named by its id', [e.shelf, e.file], ['private', path]);
        T.eq('held in the private repository', unb64(repo[path].content), 'audio');
        T.eq('the file first, then the record', puts, [path, 'library/additions.json']);
        conflicts = 1;
        var before = addsIn().length;
        return L.add({ title: 'Someone saved in between' }).then(function () { T.eq('a conflict: made again on the newest copy', addsIn().length, before + 1); return id; });
      }).then(function (id) {
        // GitHub's 409 to a commit made while another goes through, on the file as well as the record
        conflicts = 1; puts.length = 0;
        return L.add({ title: 'Someone committing' }, new File(['pdf'], 'a.pdf')).then(function (id2) {
          T.yes('a 409 on the file: sent again', puts.length === 3 && puts[0] === puts[1] && !!repo['library/' + id2 + '.pdf']);
          return id;
        });
      }).then(function (id) {
        // GitHub's words for a file over its limit, with no upload to take back and nothing retried
        var f1 = window.fetch, tried = 0;
        window.fetch = function (u, o) {
          if (o && o.method === 'PUT' && /\.bin$/.test(String(u))) { tried++; return json({ message: 'Sorry, the file is too large to be processed.' }, 422); }
          return f1.apply(window, arguments);
        };
        return refused(L.add({ title: 'Near the limit' }, new File(['x'], 'near.bin'))).then(function (m) {
          window.fetch = f1;
          T.yes('too large for GitHub: said so, not a conflict', /too large/.test(m || '') && !/conflict/.test(m));
          T.eq('and not sent again', tried, 1);
          T.eq('and no record', addsIn().some(function (x) { return x.title === 'Near the limit'; }), false);
          return id;
        });
      }).then(function (id) {
        // a record that cannot be saved takes its upload back
        var saved = repo['library/additions.json']; repo['library/additions.json'] = saved;
        conflicts = 0;
        var files = Object.keys(repo).length, f0 = window.fetch;
        window.fetch = function (u, o) {
          if (o && o.method === 'PUT' && /additions\.json/.test(String(u))) return json({}, 403);
          return f0.apply(window, arguments);
        };
        return refused(L.add({ title: 'Record refused' }, new File(['y'], 'y.pdf'))).then(function (m) {
          window.fetch = f0;
          T.yes('a record refused: says so', /write/.test(m || ''));
          T.eq('and its upload is taken back', Object.keys(repo).length, files);
          return id;
        });
      }).then(function (id) {
        return L.update(id, { title: 'Corrected', note: 'A note' }).then(function () {
          var e = addsIn().filter(function (x) { return x.id === id; })[0];
          T.eq('correcting keeps its copy and who added it', [e.title, e.note, e.shelf, !!e.file, !!e.added], ['Corrected', 'A note', 'private', true, true]);
          return refused(L.update('a1', { title: 'A public one' }));
        }).then(function (m) {
          T.yes('a public entry cannot be corrected from here', /no longer among/.test(m || ''));
          repo['library/podcast.m4a'] = { sha: 'keep', content: b64('held') };
          return refused(L.remove('p1'));
        }).then(function (m) {
          T.yes('or removed', /no longer among/.test(m || ''));
          T.eq('and its private copy stays', !!repo['library/podcast.m4a'], true);
          return L.remove(id);
        }).then(function () {
          T.eq('removing takes the record', addsIn().some(function (x) { return x.id === id; }), false);
          T.eq('and the copy', !!repo['library/' + id + '.m4a'], false);
          T.eq('and the list', L.items().some(function (x) { return x.id === id; }), false);
        });
      }).then(function () {
        var d = L.form(), msg = d.querySelector('.lib-msg'), save = d.querySelector('[data-a="save"]');
        T.yes('the form opens', d.open);
        d.querySelector('input[name="title"]').value = 'A stub';
        save.click();
        T.yes('a title the list has: asks again', /has this title/.test(msg.textContent));
        d.querySelector('input[name="title"]').value = 'From the form';
        d.querySelector('input[name="url"]').value = 'https://example.org/form';
        delete save.dataset.again;
        var n = addsIn().length;
        save.click();
        return wait(200).then(function () {
          T.eq('filled in and saved', addsIn().length, n + 1);
          T.eq('with its fields', addsIn()[n].title + ' ' + addsIn()[n].url, 'From the form https://example.org/form');
          T.eq('and the form closes', !!d.open, false);
          document.querySelectorAll('dialog.lib-dlg').forEach(function (x) { if (x.open) x.close(); });
          var added = L.items().filter(function (e) { return e.title === 'From the form'; })[0];
          return L.open(added.id);
        }).then(function () {
          var bx = box();
          T.yes('an addition’s box offers to correct and remove it', bx.querySelector('[data-a="edit"]') && bx.querySelector('[data-a="rm"]'));
          bx.close();
          return L.open('a1');
        }).then(function () {
          var bx = box();
          T.eq('a public entry’s does not', bx.querySelectorAll('[data-a="edit"], [data-a="rm"]').length, 0);
          bx.close();
        });
      });
    }).then(function () {
      // without a token: none of it
      SW.store.set('gh.token', '');
      asked.length = 0;
      return load();
    }).then(function () { return SW.library.load(); }).then(function () {
      T.eq('without a token: only the public entries', SW.library.items().map(function (e) { return e.id; }), ['a1', 'v1', 'p1']);
      T.eq('and nothing asked of GitHub', asked, []);
    }).then(restore, function (e) { restore(); throw e; });
  }
  // after the Images tab's checks, which also put their own window.fetch in place
  T.later('the Library', function () { return (T.fetchChain || Promise.resolve()).then(run); });
})();
