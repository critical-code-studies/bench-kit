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
      T.script(kit + 'library.js?t=' + Date.now() + Math.random()).then(res, rej);
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
      T.eq('by author, surnames; a work with no author files under its title', ids('author'), 'cdba');
      T.eq('by title, without the opening article', ids('title'), 'bdca');
      T.eq('newest first, those without a date last', ids('new'), 'badc');
      T.eq('oldest first, those without a date last', ids('old'), 'dabc');
      T.eq('by kind', ids('kind'), 'bdac');
      T.eq('by language, those without last', ids('lang'), 'dbca');
      T.eq('as listed', ids('listed'), 'abcd');
      var idc = document.createElement('div'); idc.innerHTML = L.idCard('AB', 'Ada Byron', '');
      var wl0 = SW.store.get('library.loans', {}), wc0 = SW.store.get('library.cards', {});
      SW.store.set('library.loans', { 'L-WIPE': [{ out: '2026-11-01', due: '2026-12-01', by: 'You' }] });
      L.wipeLoans();
      T.eq('wiping the loan history empties this browser’s record and the cards', [SW.store.get('library.loans', {}), SW.store.get('library.cards', {}), !!L.onLoan('L-WIPE')], [{}, {}, false]);
      SW.store.set('library.loans', wl0); SW.store.set('library.cards', wc0);
      var lv = document.getElementById('view-library');
      if (lv && lv.querySelector('[data-show="loans"]') && lv.querySelector('[data-libview="cat"]')) {
        var v0 = (lv.querySelector('[data-libview].on') || { dataset: { libview: 'icons' } }).dataset.libview;
        lv.querySelector('[data-libview="cat"]').click();
        lv.querySelector('[data-show="loans"]').click();
        T.eq('on the To read shelf the card catalogue and the gallery are put away, and Covers is marked', [lv.querySelector('[data-libview="cat"]').hidden, lv.querySelector('[data-libview="gallery"]').hidden, lv.querySelector('[data-libview="icons"]').classList.contains('on')], [true, true, true]);
        lv.querySelector('[data-show="all"]').click();
        T.eq('and back in the library they return, the catalogue marked', [lv.querySelector('[data-libview="cat"]').hidden, lv.querySelector('[data-libview="cat"]').classList.contains('on')], [false, true]);
        lv.querySelector('[data-libview="' + v0 + '"]').click();
      }
      var noInk = [];
      for (var hi = 0; hi < 400; hi++) { try { L.inksOf({ out: '2026-11-0' + (hi % 9 + 1), due: '2027-0' + (hi % 9 + 1) + '-08', by: 'Reader ' + hi }); } catch (er) { noInk.push(hi); } }
      T.eq('a line with no ink of its own (a loan from before inks were kept) is drawn in a pen and stamp of its own', noInk, []);
      T.yes('an aged card has no filter, which would keep it from turning over', !/filter/.test(L.paperOf('L-AGED', 6)));
      T.yes('its worn edges are given to the back too', /--lib-edge:inset/.test(L.paperOf('L-AGED', 6)));
      var idw = document.createElement('div'), tw = SW.BENCH.title; idw.style.width = '320px'; document.body.appendChild(idw);
      SW.BENCH.title = 'The Vector Humanities Translation and Interpretation Research Bench'; idw.innerHTML = L.idCard('AB', 'Ada Byron', ''); L.fitIdTitle(idw);
      var idt = idw.querySelector('.lib-idcard-t');
      T.yes('a long bench name is shown whole on the card', !idt.clientWidth || (idt.scrollWidth <= idt.clientWidth + 1 && idt.scrollHeight <= idt.clientHeight + 1 && idt.classList.contains('lib-idcard-t2')));
      SW.BENCH.title = tw; idw.remove();
      T.eq('a library card: the bench, the initials, the name in capitals, a five-figure number', [!!idc.querySelector('.lib-idcard-t').textContent, idc.querySelector('.lib-idcard-i').textContent, idc.querySelector('.lib-idcard-name').textContent, /^L \d \d \d \d \d/.test(idc.querySelector('.lib-idcard-n').textContent)], [true, 'AB', 'ADA BYRON', true]);
      var idc2 = document.createElement('div'); idc2.innerHTML = L.idCard('AB', 'Ada Byron', '');
      T.eq('and the same card each time', idc2.innerHTML, idc.innerHTML);
      var bk = document.createElement('div'); bk.innerHTML = L.idBack('AB', 'Ada Byron', '');
      T.yes('its back: the holder, the card number, member since, where the bench is, Hypothesis and GitHub', /Ada Byron \(AB\)/.test(bk.textContent) && /L \d{5}/.test(bk.textContent) && /Member since/.test(bk.textContent) && /Hypothesis/.test(bk.textContent) && /GitHub/.test(bk.textContent) && !/gh\.token|github_pat/.test(bk.innerHTML));
      var eds = es.concat([{ id: 'e', title: 'A Reader', contributor: 'eds C. Pine, D. Elm; translated by E. Ash', date: '2000', kind: 'book' }]);
      T.eq('an edited volume with no author files under its first editor', [L.sortName(eds[4]), L.sorted(eds, 'author').map(function (e) { return e.id; }).join('')], ['Pine', 'cdbea']);
      T.eq('and others with none under what leads their reference', [L.sortName({ title: 'A Piece', kind: 'news', in: 'The Guardian' }), L.sortName({ title: 'X', kind: 'web page', publisher: 'OpenAI' }), L.sortName({ title: '“The Last” Word', kind: 'talk' }), L.sortName({ title: 'Как первый в мире чат-бот', kind: 'web page' })], ['Guardian', 'OpenAI', 'Last” Word', 'Как первый в мире чат-бот']);
      T.eq('the entries themselves left in their order', es[0].id, 'a');
      function cite(e) { return L.citation(e).text; }
      T.eq('a citation: an article', cite({ title: 'On Time', author: 'Marc Peeters', date: '2017', kind: 'article', in: 'A Journal 2', publisher: 'A Press', pages: '145–157', url: 'https://example.org/a' }), 'Marc Peeters (2017) ‘On Time’, A Journal 2, pp. 145–157. https://example.org/a');
      T.eq('a book: in italics in the page, with its publisher, a note in brackets left out', cite({ title: 'A Book', author: 'A. Scholar', date: '1966', kind: 'book', in: '(monograph)', publisher: 'A Press', pages: 'ix, 198 p.' }), 'A. Scholar (1966) A Book. A Press.');
      T.yes('its title in italics', /<i>A Book<\/i>/.test(L.citation({ title: 'A Book', kind: 'book' }).html));
      T.eq('a chapter', cite({ title: 'A Part', author: 'E. Editor', date: '1999', kind: 'chapter', in: 'A Whole', publisher: 'A Press', pages: '5–9', doi: 'https://doi.org/10.1/x' }), 'E. Editor (1999) ‘A Part’, in A Whole. A Press, pp. 5–9. https://doi.org/10.1/x');
      T.yes('its DOI a live link in the page', /<a href="https:\/\/doi\.org\/10\.1\/x"/.test(L.citation({ title: 'A Part', kind: 'chapter', doi: '10.1/x' }).html));
      T.yes('a link that is not a web address is not made live', !/<a /.test(L.citation({ title: 'x', kind: 'book', url: 'javascript:alert(1)' }).html));
      T.eq('no author, no date: the title leads, the year after it', cite({ title: 'What Is It?', kind: 'book' }), 'What Is It? (n.d.).');
      T.eq('a date cited by its year', cite({ title: 'A Talk', kind: 'talk', date: '2020-11-21' }), 'A Talk (2020).');
      T.eq('no author: an edited volume, its editors leading', cite({ title: 'The Handbook of Artificial Intelligence', contributor: 'eds Barr, A.; Feigenbaum, E.A.', date: '1981', kind: 'book', publisher: 'William Kaufmann' }), 'Barr, A. and Feigenbaum, E.A. (eds) (1981) The Handbook of Artificial Intelligence. William Kaufmann.');
      T.eq('one editor', cite({ title: 'A Reader', contributor: 'ed. C. Pine', date: '2000', kind: 'book' }), 'C. Pine (ed.) (2000) A Reader.');
      T.eq('a chapter: in, the editors, the book', cite({ title: 'A Part', author: 'E. Writer', contributor: 'eds C. Pine, D. Elm', date: '1999', kind: 'chapter', in: 'A Whole', publisher: 'A Press', pages: '5–9' }), 'E. Writer (1999) ‘A Part’, in C. Pine and D. Elm (eds) A Whole. A Press, pp. 5–9.');
      T.eq('no author: a newspaper piece, its paper leading', cite({ title: 'Machines that talk', in: 'The Guardian', date: '2008', kind: 'news', pages: '5' }), 'The Guardian (2008) ‘Machines that talk’, p. 5.');
      T.eq('a publication leads by its name; its issue stays after the title', [L.pubName('Creative Computing 4(1)'), L.pubName('BYTE, June 1977'), L.pubName('Financial Times, no. 27293'), L.pubName('Quaderni di informatica 36 (Bull Italia)'), L.pubName('The Guardian'), cite({ title: 'Eliza', in: 'Creative Computing 4(1)', date: '1978', kind: 'magazine', pages: '10–12', publisher: 'Ahl Computing' })], ['Creative Computing', 'BYTE', 'Financial Times', 'Quaderni di informatica', 'The Guardian', 'Creative Computing (1978) ‘Eliza’, 4(1), pp. 10–12.']);
      T.eq('no author: an organisation’s web page', cite({ title: 'About us', publisher: 'A Lab', date: '2023', kind: 'web page', url: 'https://example.org/' }), 'A Lab (2023) About us. https://example.org/');
      T.yes('and the title in italics after it', /^A Lab \(2023\) <i>About us<\/i>\./.test(L.citation({ title: 'About us', publisher: 'A Lab', date: '2023', kind: 'web page' }).html));
      T.eq('a report and a web page: their titles in italics, not quoted', [L.citation({ title: 'Design Recommendations', publisher: 'Defense Technical Information Center', date: '1980', kind: 'report', in: 'AD-A115894' }).html.indexOf('<i>Design Recommendations</i>') > 0, /^<i>A Page<\/i> \(2019\)/.test(L.citation({ title: 'A Page', in: 'iGuides', date: '2019', kind: 'web page' }).html)], [true, true]);
      T.eq('no author, in a journal: the title, the year, the journal', cite({ title: 'On It', in: 'A Journal 3', date: '2001', kind: 'article', pages: '1–4' }), '‘On It’ (2001) A Journal 3, pp. 1–4.');
      T.eq('as written, where it is', cite({ title: 'x', citation: 'By hand.' }), 'By hand.');
      T.yes('and escaped in the page', !/<script/.test(L.citation({ title: '<script>', kind: 'book' }).html));
      var play = function (u, k) { return SW.embedPlayer(u, 'A title', k, 'lib-embed'); };
      T.yes('YouTube plays, without its cookies, from its start', /youtube-nocookie\.com\/embed\/abcdefghijk\?start=211/.test(play('https://www.youtube.com/watch?v=abcdefghijk&t=211') || ''));
      T.yes('a short address too', /embed\/abcdefghijk"/.test(play('https://youtu.be/abcdefghijk') || ''));
      T.yes('Vimeo', /player\.vimeo\.com\/video\/123/.test(play('https://vimeo.com/123') || ''));
      T.yes('the Internet Archive', /archive\.org\/embed\/x1/.test(play('https://archive.org/details/x1') || ''));
      T.eq('any other address does not', play('https://example.org/a'), null);
      T.yes('in the frame class it is given', /class="lib-embed"/.test(play('https://vimeo.com/123') || ''));
      T.eq('a cover from the kind, whatever its case', [{ kind: 'Book' }, { kind: 'essay' }, { kind: 'lecture' }, { kind: 'documentary' }, { kind: 'PhD oddity' }].map(L.family), ['book', 'article', 'talk', 'film', 'other']);
      var ex = [{ id: 'X-1', kind: 'article', title: 'The {Big} Idea', author: 'Weizenbaum, Joseph; Berry, David M.', date: '1966-01', in: 'Communications of the ACM', pages: '36–45', doi: '10.1145/365153.365168', url: 'https://example.org', tags: ['ELIZA', 'High'] }, { id: 'X-2', kind: 'oddity', title: 'Bare', author: 'Weizenbaum, Joseph', date: '1966' }];
      var kx = [{ id: 'K-1', kind: 'translation', title: 'The Structure of Iki', author: 'Kuki, Shūzō 九鬼周造', contributor: 'eds 天野貞祐 Amano Teiyū, 澤瀉久敬 Omodaka Hisayuki; translated by Takeshi Morisato; foreword by Ann Other', extent: '331 p.; 23 cm', date: '2015' }];
      var kris = L.toRIS(kx), kbib = L.toBibTeX(kx);
      T.yes('RIS: the romanised name, editors, a translator, other roles in a note, a page count, a book', /AU  - Kuki, Shūzō\r\n/.test(kris) && /ED  - Amano Teiyū\r\nED  - Omodaka Hisayuki/.test(kris) && /A4  - Takeshi Morisato/.test(kris) && /N1  - With foreword by Ann Other/.test(kris) && /SP  - 331/.test(kris) && /TY  - BOOK/.test(kris));
      T.yes('BibTeX: editor, translator, pagetotal', /editor = \{Amano Teiyū and Omodaka Hisayuki\}/.test(kbib) && /translator = \{Takeshi Morisato\}/.test(kbib) && /pagetotal = \{331\}/.test(kbib) && /@book\{/.test(kbib));
      T.eq('Surname, Given holds after a role', L.rolesOf({ contributor: 'ed. Smith, John' }).editor, ['Smith, John']);
      var fam = L.rolesOf({ contributor: 'eds Amano, Teiyū 天野貞祐; Omodaka, Hisayuki; translated by Graham Parkes; introduction by Graham Parkes; annotations and commentary (注解・解説) by Obama Yoshinobu' });
      T.eq('family name first, one to a segment; other roles kept whole; no empty brackets', fam, { editor: ['Amano, Teiyū', 'Omodaka, Hisayuki'], translator: ['Graham Parkes'], other: ['introduction by Graham Parkes', 'annotations and commentary by Obama Yoshinobu'] });
      T.yes('a parallel text exports as a book', /TY  - BOOK/.test(L.toRIS([{ id: 'P-1', kind: 'parallel text', title: 'P' }])));
      var ris = L.toRIS(ex);
      T.yes('RIS: type, authors, journal, pages, DOI, tags and code', /TY  - JOUR/.test(ris) && /AU  - Weizenbaum, Joseph\r\nAU  - Berry, David M\./.test(ris) && /JO  - Communications of the ACM/.test(ris) && /SP  - 36\r\nEP  - 45/.test(ris) && /DO  - 10\.1145/.test(ris) && /KW  - ELIZA/.test(ris) && !/KW  - High/.test(ris) && /ID  - X-1/.test(ris) && /TY  - GEN/.test(ris));
      var bib = L.toBibTeX(ex);
      T.yes('BibTeX: a key each, authors joined, braces kept safe', /@article\{weizenbaum1966big,/.test(bib) && /@misc\{weizenbaum1966bare,/.test(bib) && /author = \{Weizenbaum, Joseph and Berry, David M\.\}/.test(bib) && /title = \{\{The \\\{Big\\\} Idea\}\}/.test(bib) && /pages = \{36--45\}/.test(bib));
      T.eq('a call number', [L.callNo({ title: 'Computer Power and Human Reason', author: 'Weizenbaum, Joseph', date: '1976' }), L.callNo({ title: 'The Thrill of the Grass', author: 'Kinsella, W. P.' }), L.callNo({ title: 'x' })], ['1976 W23c', 'K35t', 'X11x']);
      T.eq('an intro to its first sentence', [L.firstSentence('One part. Two parts.'), L.firstSentence('No end'), L.firstSentence('Billy Budd: the works. More.')], ['One part.', 'No end', 'Billy Budd: the works.']);
      T.eq('a language by name, or its code', [L.langName('ja'), L.langName('simple'), L.langName('')], ['Japanese', 'simple', '']);
      T.eq('kinds a literature search uses', [{ kind: 'preprint' }, { kind: 'conference' }, { kind: 'news' }, { kind: 'magazine' }, { kind: 'encyclopedia' }].map(L.family), ['article', 'article', 'news', 'news', 'web']);
      T.eq('or from the file', [{ file: 'a.mp3' }, { file: 'a.webm' }, { file: 'a.pdf' }, { url: 'https://example.org' }].map(L.family), ['audio', 'film', 'article', 'web']);
    }
    var PUB = [
      { id: 'a1', title: 'A talk', file: 'library/files/talk.mp3' },
      { id: 'v1', title: 'A film', file: 'library/files/film.mp4' },
      { id: 'p1', title: 'A podcast', shelf: 'private', file: 'library/podcast.m4a', url: 'https://example.org/podcast' }
    ];
    B.library = { private: { org: 'group', repo: 'archive' }, items: PUB };
    SW.paratexts = undefined;   // the group's copies are not what is tried here
    var asked = [], repo = null, shas = 0, conflicts = 0, puts = [], canPush = true;
    // repo null: every answer a small file. repo an object: GitHub's contents API, on that object
    window.fetch = function (u, o) {
      if (!/api\.github\.com/.test(String(u))) return was.fetch.apply(window, arguments);
      asked.push(String(u));
      if (/\/repos\/[^/]+\/[^/]+$/.test(String(u))) return json({ permissions: { push: canPush } });
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
        T.eq('no Rating to order by without a group', v.querySelector('.lib-order select option[value="rating"]'), null);
        if (SW.guideAdd) { SW.library.help(); var hd = document.querySelector('dialog h3'); T.yes('the guide opens, from the Help menu or the ?', hd && /holds/.test(hd.textContent)); hd.closest('dialog').close(); }
        v.querySelector('[data-libsize="l"]').click();
        T.yes('large covers', v.querySelector('.lib-list.lib-shelf.lib-l'));
        T.eq('the size is kept', SW.store.get('library.size', ''), 'l');
        v.querySelector('[data-libsize="s"]').click();
        T.yes('small covers', v.querySelector('.lib-list.lib-s') && !v.querySelector('.lib-list.lib-l'));
        SW.store.set('library.size', '');
        v.querySelector('[data-libview="list"]').click();
        T.eq('the switch: a list', v.querySelectorAll('.lib-row').length, 6);
        T.yes('and no sizes to choose', v.querySelector('.lib-sizes').hidden);
        v.querySelector('[data-libview="cat"]').click();
        T.yes('the catalogue: drawers, none pulled out', v.querySelectorAll('.lib-drawer').length >= 1 && !v.querySelector('.lib-tray'));
        v.querySelector('[data-drawer="0"]').click();
        var cfirst = v.querySelector('.lib-ccard .lib-cc-code').textContent;
        T.yes('a drawer pulled out, its front card typed', v.querySelector('.lib-tray .lib-ccard') && v.querySelector('.lib-cc-cn'));
        v.querySelector('[data-catnav="1"]').click();
        T.yes('the next card', v.querySelector('.lib-ccard .lib-cc-code').textContent !== cfirst);
        v.querySelector('.lib-tray').dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
        T.eq('and back with the arrow key', v.querySelector('.lib-ccard .lib-cc-code').textContent, cfirst);
        v.querySelector('.lib-tray').dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
        T.eq('Escape closes the drawer', v.querySelectorAll('.lib-tray').length, 0);
        v.querySelector('[data-catby="relevance"]').click();
        T.yes('browse by relevance', v.querySelector('.lib-drawer'));
        SW.store.set('library.catby', '');
        v.querySelector('[data-libview="list"]').click();
        T.eq('which is kept', SW.store.get('library.view', ''), 'list');
        var o = v.querySelector('.lib-order select'); o.value = 'title'; o.dispatchEvent(new Event('change'));
        T.eq('in the order chosen', Array.prototype.map.call(v.querySelectorAll('.lib-row .lib-t'), function (x) { return x.textContent; }).join('|'), 'Bare|Cloth|A film|A jacket|A podcast|A talk');
        T.eq('and kept', SW.store.get('library.order', ''), 'title');
        v.querySelector('[data-libview="icons"]').click();
        // the image is lazy, and this page may never ask for it: its failure, as a browser reports one
        var bad = v.querySelector('[data-lib="c1"] img.lib-thumb');
        if (bad) bad.dispatchEvent(new Event('error'));
        return wait(30);
      }).then(function () {
        var img = v.querySelector('[data-lib="c1"] img.lib-thumb');
        T.eq('a picture that will not load: the drawn cover alone', img, null);
        SW.store.set('library.view', keepV); SW.store.set('library.order', keepO);
        if (!hadV) v.remove(); else v.innerHTML = '';
        B.library = was0;
        T.group('Library: audio and video');
        return load();
      });
    }).then(function () {
      // a transcript on each shelf, a citation, and a code that has moved here
      T.group('Library: the box');
      var was1 = B.library, Lm = null;
      var vf = document.getElementById('view-library') || document.body.appendChild(Object.assign(document.createElement('section'), { id: 'view-library', className: 'view' }));
      B.library = { items: [{ id: 'P-AAAAA', title: 'A talk', author: 'A. Speaker', contributor: 'B. Host', date: '2020', kind: 'talk', file: 'library/files/t.mp3', url: 'https://example.org/t',
        alts: [{ label: 'Open', lang: 'en', file: 'data:text/plain,hello.txt' }, { label: 'Held back', file: 'library/t1.md', shelf: 'private' }] },
        { id: 'F-1', title: 'First', kind: 'article', date: '1995', author: 'A. One', tags: ['x'] }, { id: 'F-2', title: 'Second', kind: 'article', date: '2001', author: 'B. Two and A. One', tags: ['x', 'y'] }, { id: 'F-3', title: 'Third', kind: 'book', date: '2005', author: 'C. Three', lang: 'fr' },
        { id: 'P-LINK1', title: 'A linked film', kind: 'film', url: 'https://vimeo.com/123' }, { id: 'P-BOTH1', title: 'Both', kind: 'talk', file: 'library/files/b.mp3', url: 'https://vimeo.com/456' }], private: { org: 'group', repo: 'archive' } };
      return load().then(function () { Lm = SW.library; return Lm.load(); }).then(function () {
        T.yes('it has the code', Lm.has('P-AAAAA'));
        return Lm.canAdd();
      }).then(function (yes) {
        T.eq('without a token, no adding', yes, false);
        SW.store.set('gh.token', 'read-only'); canPush = false;
        return Lm.canAdd();
      }).then(function (yes) {
        T.eq('a token that cannot write, no adding', yes, false);
        SW.store.set('gh.token', 'can-write'); canPush = true;
        return Lm.canAdd();
      }).then(function (yes) {
        T.eq('a token that can write, adding', yes, true);
        SW.store.set('gh.token', ''); asked.length = 0;
        SW.views.library.show();
        return wait(40);
      }).then(function () {
        var vw = document.getElementById('view-library');
        function facet(f, val) { return vw.querySelector('[data-facet="' + f + '"][data-val="' + val + '"]'); }
        function n(f, val) { var b = facet(f, val); return b ? +b.querySelector('i').textContent : null; }
        function shown() { return Array.prototype.map.call(vw.querySelectorAll('[data-lib]'), function (x) { return x.dataset.lib; }).sort().join(' '); }
        T.eq('a facet counts its values', [n('kind', 'article'), n('kind', 'book')], [2, 1]);
        T.eq('by decade', [n('decade', '1990s'), n('decade', '2000s')], [1, 2]);
        T.eq('each author counted, by surname', n('author', 'One'), 2);
        T.yes('entries with no date are named', facet('decade', 'No date'));
        facet('kind', 'article').click();
        T.eq('a value filters', shown(), 'F-1 F-2');
        T.yes('another in that facet stays to add', facet('kind', 'book'));
        T.eq('another facet narrows, and counts what is left', n('decade', '1990s'), 1);
        facet('kind', 'book').click();
        T.eq('values in one facet widen', shown(), 'F-1 F-2 F-3');
        facet('decade', '2000s').click();
        T.eq('facets narrow one another', shown(), 'F-2 F-3');
        vw.querySelector('[data-fclear]').click();
        T.eq('clearing shows all', vw.querySelectorAll('[data-lib]').length, 6);
        T.eq('the reader’s tag facet', n('tag', 'x'), 2);
        T.eq('and no other', Lm.has('P-BBBBB'), false);
        return Lm.open('P-AAAAA');
      }).then(function () { return wait(30); }).then(function () {
        var d = box();
        T.yes('the citation is near the top', /A\. Speaker \(2020\)/.test(d.querySelector('.lib-cite-t').textContent));
        T.yes('with Copy', d.querySelector('[data-a="cite"]'));
        T.yes('a contributor in the record', /B\. Host/.test(d.querySelector('.lib-rec').textContent));
        T.eq('without a token, only the public form', Array.prototype.map.call(d.querySelectorAll('[data-alt]'), function (b) { return b.textContent; }), ['Open']);
        T.eq('a link that does not play: no player', d.querySelectorAll('iframe.lib-embed').length, 0);
        d.close();
        return Lm.open('P-LINK1');
      }).then(function () { return wait(30); }).then(function () {
        var d = box();
        T.yes('a linked work plays at once', d.querySelector('iframe.lib-embed'));
        T.yes('with its link still there', d.querySelector('a[href^="https://vimeo.com/"]'));
        d.close();
        return Lm.open('P-BOTH1');
      }).then(function () { return wait(30); }).then(function () {
        var d = box();
        T.eq('a held file first, no player yet', d.querySelectorAll('iframe.lib-embed').length, 0);
        T.yes('the file plays', d.querySelector('.lib-file audio'));
        var p = d.querySelector('[data-play]');
        T.yes('a button for the player', p && /Vimeo/.test(p.textContent));
        p.click();
        T.yes('which opens it below the file', d.querySelector('.lib-alt iframe.lib-embed'));
        p.click();
        T.eq('and closes it', d.querySelectorAll('iframe.lib-embed').length, 0);
        d.close();
        B.library = was1;
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
  // notes on an item, against a stand-in for Hypothesis
  function itemNotes() {
    var SW = window.SW, B = SW.BENCH, N = SW.notes;
    if (!N || !N.itemPanel) return Promise.resolve();
    T.group('Notes on items');
    T.eq('a time', [N.parseAt('12:46'), N.parseAt('1:02:03'), N.parseAt('p. 12'), N.parseAt('12'), N.parseAt('soon')], ['t:766', 't:3723', 'p:12', 'p:12', null]);
    T.eq('as read', [N.atLabel('t:766'), N.atLabel('t:3723'), N.atLabel('p:12')], ['12:46', '1:02:03', 'p. 12']);
    var was = { fetch: window.fetch, token: SW.store.get('token', ''), group: SW.store.get('group', ''), lib: B.library, mod: SW.library, ini: SW.store.get('initials', ''), view: SW.views.library, kit: SW.kitViews, px: SW.paratexts, drafts: SW.store.get('drafts', []) };
    var rows = [], posted = [], nid = 0;
    function ok(o) { return Promise.resolve(new Response(JSON.stringify(o), { status: 200, headers: { 'Content-Type': 'application/json' } })); }
    window.fetch = function (u, o) {
      u = String(u);
      if (!/api\.hypothes\.is/.test(u)) return was.fetch.apply(window, arguments);
      var m = (o && o.method) || 'GET';
      if (/\/profile/.test(u)) return ok({ userid: 'acct:tester@hypothes.is', groups: [{ id: 'grp', name: 'G' }] });
      if (m === 'DELETE') { var did = u.split('/').pop(); rows = rows.filter(function (a) { return a.id !== did; }); return ok({ deleted: true }); }
      if (m === 'POST') { var b = JSON.parse(o.body); posted.push(b); var r = Object.assign({ id: 'h' + (++nid), created: new Date().toISOString(), user: 'acct:tester@hypothes.is', references: b.references }, b); rows.push(r); return ok(r); }
      if (/offset=[1-9]/.test(u)) return ok({ rows: [] });
      var um = /[?&]uri=([^&]+)/.exec(u), want = um && decodeURIComponent(um[1]);
      return ok({ rows: rows.filter(function (a) { return !want || a.uri === want; }) });
    };
    SW.store.set('token', 'x'); SW.store.set('group', 'grp'); SW.store.set('initials', 'TT'); N.forget();
    var el = document.createElement('div'), host = document.createElement('div');
    host.innerHTML = '<audio></audio><p>Words in it</p>';
    document.body.appendChild(host); document.body.appendChild(el);
    function restore() {
      window.fetch = was.fetch; SW.store.set('token', was.token); SW.store.set('group', was.group); SW.store.set('initials', was.ini); SW.store.set('drafts', was.drafts);
      B.library = was.lib; SW.library = was.mod; SW.kitViews = was.kit; SW.paratexts = was.px; if (was.view) SW.views.library = was.view; else delete SW.views.library; N.forget(); N.invalidate('item:P-AAAAA'); el.remove(); host.remove();
      var v = document.getElementById('view-library'); if (v && !was.view) v.remove();
    }
    return N.itemPanel(el, 'P-AAAAA', { host: host, rate: true }).then(function () {
      T.yes('the panel draws, open for a member', el.querySelector('details[open] textarea'));
      T.eq('a work with no notes shows only Add note', [el.querySelector('.in-fold').hidden, el.querySelector('.in-add').hidden, el.classList.contains('in-none')], [true, false, true]);
      el.querySelector('.in-add').click();
      T.eq('which opens the notes and the box to write in', [el.querySelector('.in-fold').hidden, el.querySelector('.in-add').hidden, el.classList.contains('in-none')], [false, true, false]);
      var el5 = document.createElement('div'), bar5 = document.createElement('div');
      document.body.appendChild(bar5); document.body.appendChild(el5);
      N.itemPanel(el5, 'P-AAAAA', { rate: true, bar: bar5 });
      T.eq('given a bar, the stars and Add note go in it', [!!bar5.querySelector('.in-rate'), !!bar5.querySelector('.in-add'), !!el5.querySelector('.in-rate, .in-add')], [true, true, false]);
      bar5.querySelector('.in-add').click();
      T.yes('and Add note there opens the panel', !el5.querySelector('.in-fold').hidden && !el5.classList.contains('in-none'));
      el5.remove(); bar5.remove();
      el.querySelector('textarea').value = 'At this moment.';
      if (el.querySelector('.md-rich')) el.querySelector('.md-rich').textContent = 'At this moment.';
      el.querySelector('.in-at').value = '12:46';
      el.querySelector('[data-in="save"]').click();
      return wait(40);
    }).then(function () {
      var b = posted[0];
      T.yes('the note goes to the group', b && b.group === 'grp' && b.permissions.read[0] === 'group:grp');
      T.yes('tagged with the item, the kind and the time', b.tags.indexOf('bk:v:item:P-AAAAA') >= 0 && b.tags.indexOf('bk:kind:item') >= 0 && b.tags.indexOf('bk:at:t:766') >= 0);
      return wait(60);
    }).then(function () {
      var chip = el.querySelector('.note-at');
      T.eq('it shows with its pin', chip && chip.textContent, '12:46');
      chip.click();
      T.eq('and the pin moves the player', host.querySelector('audio').currentTime >= 0, true);
      T.eq('the count', el.querySelector('.in-n').textContent, '1');
      T.eq('no My notes button on it', el.querySelectorAll('[data-act="keep"]').length, 0);
      return N.itemCounts();
    }).then(function (c) {
      T.eq('counted by code', c, { 'P-AAAAA': 1 });
      return N.listAll({ reactions: true });
    }).then(function (all) {
      T.eq('left out of what reads versions', all.filter(function (n) { return N.isItem(n.vid); }).length, 0);
      T.yes('its link opens the item', /code=P-AAAAA/.test(N.linkOf({ vid: 'item:P-AAAAA' })));
      T.yes('its label names the item', /P-AAAAA/.test(N.labelOf({ vid: 'item:P-AAAAA', by: 'TT' })));
      // the reply goes to the same item
      el.querySelector('[data-act="reply"]').click();
      T.eq('nothing left in the box after adding a note', [el.querySelector('.in-new textarea').value, el.querySelector('.in-new .md-rich') ? el.querySelector('.in-new .md-rich').textContent : ''], ['', '']);
      var box = el.querySelector('.reply-box'); box.querySelector('textarea').value = 'And a reply.'; box.querySelector('[data-r="save"]').click();
      return wait(60);
    }).then(function () {
      T.yes('a reply on the same item', posted[1] && posted[1].uri === posted[0].uri && posted[1].references[0] === 'h1');
      el.querySelector('[data-star="2"]').click();
      return wait(80);
    }).then(function () {
      var r = rows.filter(function (a) { return a.text === '★2'; })[0];
      T.yes('a rating, on the item and answering nothing', r && r.tags.indexOf('bk:kind:reaction') >= 0 && !(r.references || []).length);
      T.eq('it shows as yours', el.querySelectorAll('.in-rate [data-star].on').length, 2);
      el.querySelector('[data-star="3"]').click();
      return wait(80);
    }).then(function () {
      T.eq('a new rating replaces yours', rows.filter(function (a) { return /^★/.test(a.text); }).map(function (a) { return a.text; }), ['★3']);
      return N.itemRatings();
    }).then(function (rt) {
      T.eq('the average, by code', rt['P-AAAAA'] && [rt['P-AAAAA'].avg, rt['P-AAAAA'].n], [3, 1]);
      T.eq('no reaction shows until someone has left one; ☺+ opens them all', [el.querySelectorAll('.in-rate .reacts > [data-rx]').length, el.querySelectorAll('.in-rate .react-pick [data-rx]').length, el.querySelector('.in-rate .react-pick').hidden], [0, 9, true]);
      el.querySelector('.in-rate [data-rxpick]').click();
      T.yes('☺+ opens the rest', !el.querySelector('.in-rate .react-pick').hidden);
      el.querySelector('[data-rx="👍"]').click();
      return wait(80);
    }).then(function () {
      T.eq('an emoji', rows.filter(function (a) { return a.text === '👍'; }).length, 1);
      T.eq('and it shows, with who left it', el.querySelectorAll('.in-rate .reacts > [data-rx="👍"]').length, 1);
      el.querySelector('[data-rx="👍"]').click();
      return wait(80);
    }).then(function () {
      T.eq('again takes it back', rows.filter(function (a) { return a.text === '👍'; }).length, 0);
      return N.itemCounts();
    }).then(function (c2) {
      T.eq('ratings are not counted as notes', c2['P-AAAAA'], 1);
      if (!document.getElementById('view-library')) document.body.appendChild(Object.assign(document.createElement('section'), { id: 'view-library', className: 'view' }));
      SW.paratexts = undefined;
      B.library = { items: [{ id: 'P-AAAAA', title: 'Rated', lang: 'ja' }, { id: 'P-OTHER', title: 'Another', lang: 'en' }] };
      SW.store.set('library.order', 'rating');
      return load().then(function () { SW.store.set('library.order', ''); return SW.library.load(); }).then(function () {
        SW.views.library.show();
        return wait(120);
      }).then(function () {
        var vw = document.getElementById('view-library');
        function facet(f, val) { return vw.querySelector('[data-facet="' + f + '"][data-val="' + val + '"]'); }
        function shown() { return Array.prototype.map.call(vw.querySelectorAll('[data-lib]'), function (x) { return x.dataset.lib; }).join(' '); }
        T.eq('a kept order of Rating, once the ratings have come', shown(), 'P-AAAAA P-OTHER');
        T.yes('Rating to order by, with a group', vw.querySelector('.lib-order select option[value="rating"]'));
        T.eq('the Rating filter', [facet('rating', '3').textContent, facet('rating', 'none').textContent], ['★★★1', 'Not rated1']);
        T.eq('language by name in the filter', facet('lang', 'ja').querySelector('span').textContent, 'Japanese');
        facet('rating', 'none').click();
        T.eq('filtered by rating', shown(), 'P-OTHER');
        vw.querySelector('[data-fclear]').click();
        facet('lang', 'ja').click();
        T.eq('filtered by language', shown(), 'P-AAAAA');
        vw.querySelector('[data-fclear]').click();
        SW.store.set('token', ''); N.forget();
        SW.store.set('library.order', 'rating');
        return load();
      }).then(function () { return SW.library.load(); }).then(function () {
        SW.views.library.show();
        return wait(80);
      }).then(function () {
        var sel = document.querySelector('#view-library .lib-order select');
        T.eq('a kept order of Rating, with no token: Author', sel.value, 'author');
        T.eq('and it stays kept', SW.store.get('library.order', ''), 'rating');
        SW.store.set('library.order', '');
        // sharing an entry
        var shared = [];
        Object.defineProperty(navigator, 'share', { configurable: true, value: function (d) { shared.push(d); return Promise.resolve(); } });
        Object.defineProperty(navigator, 'canShare', { configurable: true, value: function () { return true; } });
        function unstub() { delete navigator.share; delete navigator.canShare; }
        return SW.library.open('P-AAAAA').then(function () { return wait(30); }).then(function () {
          var d = box();
          d.querySelector('[data-a="share"]').click();
          return wait(30).then(function () {
            T.eq('Share: the title and a link to the box', [shared.length, shared[0] && shared[0].title, /lib=P-AAAAA/.test(shared[0] && shared[0].url)], [1, 'Rated', true]);
            T.eq('and no file', shared[0] && shared[0].files, undefined);
            d.close();
            var f1 = window.fetch;
            window.fetch = function (u, o) { return /library\/index\.html/.test(String(u)) ? Promise.resolve(new Response('', { status: 200 })) : f1.apply(window, arguments); };
            return load().then(function () { return SW.library.load(); }).then(function () { return SW.library.open('P-AAAAA'); }).then(function () { return wait(30); }).then(function () { return SW.library.open('P-AAAAA'); }).then(function () { return wait(30); }).then(function () {
              var d2 = box(); shared.length = 0;
              d2.querySelector('[data-a="share"]').click();
              return wait(30).then(function () {
                T.yes('through the card page, once it is there', /library\/\?lib=P-AAAAA$/.test(shared[0] && shared[0].url));
                document.querySelectorAll('dialog.lib-dlg').forEach(function (x) { x.close(); });
                window.fetch = f1;
                var dot = 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==';
                B.library = { items: [{ id: 'C-REAL', title: 'Jacket', thumb: dot }, { id: 'C-BAD', title: 'Lost', thumb: 'library/no-such-cover.webp' }, { id: 'C-SELF', title: 'Own cover', thumb: dot, file: dot }, { id: 'C-NONE', title: 'Bare' }] };
                function covers(id) { return SW.library.open(id).then(function () { return wait(120); }).then(function () { var x = box(), n = [x.querySelectorAll('.lib-boxcover').length, x.querySelectorAll('.lib-cover').length]; x.close(); return n; }); }
                return load().then(function () { return SW.library.load(); }).then(function () { return covers('C-REAL'); }).then(function (n) {
                  T.eq('a real cover in the box, and no drawn one', n, [1, 0]);
                  return covers('C-BAD');
                }).then(function (n) {
                  T.eq('a picture that fails is removed', n, [0, 0]);
                  return covers('C-SELF');
                }).then(function (n) {
                  T.eq('an image that is its own cover is not repeated', n, [0, 0]);
                  return covers('C-NONE');
                }).then(function (n) {
                  T.eq('no thumb, no cover', n, [0, 0]);
                  B.library = { items: [{ id: 'C-PRE', title: 'Early', kind: 'Preprint' }, { id: 'C-ART', title: 'Later', kind: 'article' }] };
                  return load().then(function () { return SW.library.load(); });
                }).then(function () {
                  SW.views.library.show();
                  return wait(60);
                }).then(function () {
                  var vp = document.getElementById('view-library');
                  function pp(id) { var x = vp.querySelector('[data-lib="' + id + '"]'); return x ? x.querySelectorAll('.lib-pp').length : null; }
                  T.eq('a preprint badged on its cover, and no other', [pp('C-PRE'), pp('C-ART')], [1, 0]);
                  vp.querySelector('[data-libview="list"]').click();
                  T.eq('and in the list', [pp('C-PRE'), pp('C-ART')], [1, 0]);
                  vp.querySelector('[data-libview="icons"]').click();
                  SW.store.set('library.view', '');
                  return SW.library.open('C-PRE').then(function () { return wait(20); });
                }).then(function () {
                  var x = box();
                  T.eq('and in its box', x.querySelectorAll('.tray-bighead .lib-pp').length, 1);
                  x.close();
                  T.yes('As listed, on a bench with no relevance', document.querySelector('#view-library .lib-order option[value="listed"]') && !document.querySelector('#view-library .lib-order option[value="relevance"]'));
                  B.library = { order: 'listed', items: [{ id: 'R-1', title: 'M', author: 'Zed', relevance: 'low' }, { id: 'R-2', title: 'U', author: 'Ann', relevance: 'unchecked' }, { id: 'R-3', title: 'A2', author: 'Bee', relevance: 'essential' }, { id: 'R-4', title: 'None', author: 'Aab' }, { id: 'R-5', title: 'A1', author: 'Abe', relevance: 'essential' }, { id: 'R-6', title: 'K2', author: 'Zzz', relevance: 'unchecked', key: 2 }, { id: 'R-7', title: 'K1', author: 'Yyy', key: 1 }] };
                  return load().then(function () { return SW.library.load(); });
                }).then(function () {
                  SW.views.library.show();
                  return wait(60);
                }).then(function () {
                  var vr = document.getElementById('view-library'), sel = vr.querySelector('.lib-order select');
                  function rids() { return Array.prototype.map.call(vr.querySelectorAll('[data-lib]'), function (x) { return x.dataset.lib; }).join(' '); }
                  T.eq('order: listed shows By relevance', sel.value, 'relevance');
                  T.eq('and no As listed', sel.querySelector('option[value="listed"]'), null);
                  T.eq('key works, then by group and author, the rest last', rids(), 'R-7 R-6 R-5 R-3 R-1 R-2 R-4');
                  T.eq('another order ignores key', SW.library.sorted(SW.library.items(), 'author').map(function (e) { return e.id; }).join(' '), 'R-4 R-5 R-2 R-3 R-7 R-1 R-6');
                  var fa = vr.querySelector('[data-facet="relevance"][data-val="essential"]');
                  T.eq('the filter, by name', fa && fa.querySelector('span').textContent, 'Essential');
                  T.eq('its groups in order', Array.prototype.map.call(vr.querySelectorAll('[data-facet="relevance"]'), function (x) { return x.dataset.val; }), ['essential', 'low', 'unchecked']);
                  T.eq('all six levels, and the old values read', SW.library.sorted([{ id: 'n', relevance: 'unchecked' }, { id: 'o4', relevance: 'unread' }, { id: 'm', relevance: 'minimal' }, { id: 'l', relevance: 'low' }, { id: 'o3', relevance: 'mention' }, { id: 'h', relevance: 'high' }, { id: 'o1', relevance: 'about' }, { id: 'e', relevance: 'essential' }, { id: 'c', relevance: 'medium' }, { id: 'o2', relevance: 'section' }], 'relevance').map(function (e) { return e.id.charAt(0); }).join(''), 'ehocolomno');
                  fa.click();
                  T.eq('filtered', rids(), 'R-5 R-3');
                  vr.querySelector('[data-fclear]').click();
                  return SW.library.open('R-3').then(function () { return wait(20); });
                }).then(function () {
                  var x2 = box();
                  T.yes('in the record', /Essential/.test(x2.querySelector('.lib-rec').textContent));
                  x2.close();
                  B.library = { items: [{ id: 'K-1', title: 'Listed key', key: 1, tags: ['listed'] }, { id: 'K-2', title: 'Plain' }, { id: 'K-3', title: 'Early', kind: 'preprint', key: 2 }] };
                  return load().then(function () { return SW.library.load(); });
                }).then(function () {
                  SW.views.library.show();
                  return wait(60);
                }).then(function () {
                  var vk = document.getElementById('view-library');
                  function mark(id) { return vk.querySelectorAll('[data-lib="' + id + '"] .lib-key').length; }
                  T.eq('a key work marked on its cover, with no token', [mark('K-1'), mark('K-2')], [1, 0]);
                  T.yes('a preprint that is a key work has both', vk.querySelector('[data-lib="K-3"] .lib-marks .lib-pp') && vk.querySelector('[data-lib="K-3"] .lib-marks .lib-key'));
                  T.eq('the words kept', vk.querySelector('[data-lib="K-1"] .lib-key').textContent, 'Key work');
                  vk.querySelector('[data-libview="list"]').click();
                  T.eq('and in the list', [mark('K-1'), mark('K-2')], [1, 0]);
                  vk.querySelector('[data-libview="icons"]').click();
                  SW.store.set('library.view', '');
                  return SW.library.open('K-1').then(function () { return wait(30); });
                }).then(function () {
                  var x3 = box();
                  T.eq('an export of this work in its box, its menu shut', [x3.querySelectorAll('[data-a="ref"]').length, x3.querySelector('.lib-refmenu').hidden], [1, true]);
                  x3.querySelector('[data-a="ref"]').click();
                  T.eq('and opening', x3.querySelector('.lib-refmenu').hidden, false);
                  T.eq('in the box, and no button without the group', [x3.querySelectorAll('.lib-dmarks .lib-key').length, x3.querySelectorAll('[data-a="key"]').length], [1, 0]);
                  T.eq('tags shown, with no way to change them without the group', [x3.querySelectorAll('.lib-tag').length, x3.querySelectorAll('[data-tagoff]').length, x3.querySelectorAll('.lib-taginput').length], [1, 0, 0]);
                  x3.close();
                  SW.store.set('token', 'x'); N.forget();
                  return SW.library.open('K-2').then(function () { return wait(60); });
                }).then(function () {
                  var x4 = box(), kb = x4.querySelector('[data-a="key"]');
                  T.eq('with the group, a button to mark', [kb && kb.getAttribute('aria-pressed'), /Mark this as a key work/.test(kb && kb.getAttribute('aria-label'))], ['false', true]);
                  kb.click();
                  return wait(150).then(function () {
                    T.eq('kept in the group, for that entry', rows.filter(function (a) { return a.text === 'key:on'; }).length, 1);
                    T.eq('the button and the box show it', [kb.getAttribute('aria-pressed'), x4.querySelectorAll('.lib-dmarks .lib-key').length], ['true', 1]);
                    x4.close();
                    return N.itemKeys();
                  });
                }).then(function (k) {
                  T.eq('read back from the group', k['K-2'] && k['K-2'].on, true);
                  T.eq('a mark added comes after the list\u2019s', SW.library.sorted(SW.library.items(), 'relevance').map(function (e) { return e.id; }), ['K-1', 'K-3', 'K-2']);
                  return SW.library.open('K-1').then(function () { return wait(60); });
                }).then(function () {
                  var x5 = box();
                  x5.querySelector('[data-a="key"]').click();
                  return wait(150).then(function () {
                    T.eq('a key from the list can be taken off', [rows.filter(function (a) { return a.text === 'key:off'; }).length, x5.querySelectorAll('.lib-dmarks .lib-key').length], [1, 0]);
                    x5.close();
                    return N.itemCounts();
                  });
                }).then(function (c3) {
                  T.eq('marks are not counted as notes', c3['K-1'], undefined);
                  rows.push({ id: 'h-late', created: '2999-01-01T00:00:00Z', user: 'acct:other@hypothes.is', uri: rows.filter(function (a) { return a.text === 'key:off'; })[0].uri, text: 'key:on', tags: rows.filter(function (a) { return a.text === 'key:off'; })[0].tags, references: [] });
                  N.invalidate('item:K-1');
                  return N.itemKeys();
                }).then(function (k2) {
                  T.eq('the latest mark counts, whoever made it', k2['K-1'] && k2['K-1'].on, true);
                  return SW.library.open('K-2').then(function () { return wait(60); });
                }).then(function () {
                  var x6 = box(), inp = x6.querySelector('.lib-taginput');
                  inp.value = '  early   work ';
                  inp.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
                  return wait(150).then(function () {
                    T.eq('a tag, kept in the group', rows.filter(function (a) { return a.text === 'tag:on:early work'; }).length, 1);
                    T.eq('shown, and read by the filter and search', [x6.querySelectorAll('.lib-tag').length, SW.library.tagsOf(SW.library.items()[1])], [1, ['early work']]);
                    x6.querySelector('.lib-taginput').value = 'LISTED';
                    x6.querySelector('.lib-taginput').dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
                    return wait(150);
                  }).then(function () {
                    T.eq('the spelling in use, whatever the case', rows.filter(function (a) { return a.text === 'tag:on:listed'; }).length, 1);
                    x6.querySelector('[data-tagoff="early work"]').click();
                    return wait(150);
                  }).then(function () {
                    T.eq('taken off', [rows.filter(function (a) { return a.text === 'tag:off:early work'; }).length, SW.library.tagsOf(SW.library.items()[1])], [1, ['listed']]);
                    x6.close();
                    return SW.library.open('K-1').then(function () { return wait(60); });
                  });
                }).then(function () {
                  var x7 = box();
                  x7.querySelector('[data-tagoff="listed"]').click();
                  return wait(150).then(function () {
                    T.eq('a tag from the list can be taken off', SW.library.tagsOf(SW.library.items()[0]), []);
                    x7.close();
                    return N.itemCounts();
                  });
                }).then(function (c4) {
                  T.eq('tags are not counted as notes', c4['K-2'], undefined);
                  B.library = { items: [{ id: 'V-1', title: 'A', relevance: 'low', tags: ['plain'] }, { id: 'V-2', title: 'B', tags: ['High'] }, { id: 'V-3', title: 'C' }] };
                  return load().then(function () { return SW.library.load(); });
                }).then(function () {
                  function ord() { return SW.library.sorted(SW.library.items(), 'relevance').map(function (e) { return e.id; }).join(' '); }
                  T.eq('a level as a tag, and as the field', ord(), 'V-2 V-1 V-3');
                  return SW.library.open('V-1').then(function () { return wait(60); }).then(function () {
                    var x8 = box(), s0 = x8.querySelector('.lib-relsel');
                    T.eq('the drop-down shows the field’s level', s0.value, 'low');
                    function pick(v) { var sel = x8.querySelector('.lib-relsel'); sel.value = v; sel.dispatchEvent(new Event('change', { bubbles: true })); return wait(200); }
                    return pick('essential').then(function () {
                      T.eq('kept as a tag in the group', rows.filter(function (a) { return a.text === 'tag:on:Essential'; }).length, 1);
                      T.eq('a tag comes before the field', ord(), 'V-1 V-2 V-3');
                      T.eq('and not among the tags', Array.prototype.map.call(x8.querySelectorAll('.lib-tag'), function (t) { return t.firstChild.textContent; }), ['plain']);
                      return pick('minimal');
                    }).then(function () {
                      T.eq('one level: the last comes off', [rows.filter(function (a) { return a.text === 'tag:off:Essential'; }).length, x8.querySelector('.lib-relsel').value, SW.library.tagsOf(SW.library.items()[0])], [1, 'minimal', ['plain', 'Minimal']]);
                      return pick('');
                    }).then(function () {
                      T.eq('No level goes back to the field', [rows.filter(function (a) { return a.text === 'tag:off:Minimal'; }).length, x8.querySelector('.lib-relsel').value], [1, 'low']);
                      var ti = x8.querySelector('.lib-taginput');
                      ti.value = 'not checked';
                      ti.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
                      return wait(200);
                    }).then(function () {
                      T.eq('a level typed as a tag sets the drop-down', x8.querySelector('.lib-relsel').value, 'unchecked');
                      x8.close();
                    });
                  });
                }).then(function () {
                  var f2 = window.fetch, failing = true, el2 = document.createElement('div');
                  document.body.appendChild(el2);
                  window.fetch = function (u) { return failing && /api\.hypothes\.is.*search/.test(String(u)) ? Promise.resolve(new Response('{}', { status: 500 })) : f2.apply(window, arguments); };
                  N.invalidate('item:P-AAAAA');
                  return N.itemPanel(el2, 'P-AAAAA', {}).then(function () { return wait(30); }).then(function () {
                    T.yes('a failed read is said', el2.querySelector('.in-fail [data-in="retry"]'));
                    return N.itemNotes().then(function () { return 'read'; }, function () { return 'refused'; });
                  }).then(function (said) {
                    T.eq('and is not taken for an empty group', said, 'refused');
                    failing = false;
                    el2.querySelector('[data-in="retry"]').click();
                    return wait(150);
                  }).then(function () {
                    T.eq('try again reads the notes', [el2.querySelectorAll('.in-fail').length, el2.querySelectorAll('.in-list .note').length > 0], [0, true]);
                    return N.itemNotes().then(function () { return 'read'; }, function () { return 'refused'; });
                  }).then(function (said) {
                    T.eq('and the failure was not kept', said, 'read');
                    window.fetch = f2; el2.remove();
                    SW.store.set('token', ''); N.forget();
                    var el3 = document.createElement('div');
                    document.body.appendChild(el3);
                    return N.itemPanel(el3, 'D-1', {}).then(function () {
                      el3.querySelector('.in-new textarea').value = 'Mine alone.';
                      el3.querySelector('[data-in="save"]').click();
                      return wait(120);
                    }).then(function () {
                      T.eq('a draft is plainly marked', el3.querySelectorAll('.in-list .note-draft').length, 1);
                      el3.remove();
                      var el4 = document.createElement('div');
                      document.body.appendChild(el4);
                      return N.itemPanel(el4, 'D-1', {}).then(function () {
                        T.yes('and its fold opens', el4.querySelector('.in-fold').open);
                        el4.remove();
                      });
                    });
                  }, function (e) { window.fetch = f2; el2.remove(); throw e; });
                }).then(function () {
                  // with no token (cleared above), from the published snapshot
                  var f3 = window.fetch, snap = { ratings: { 'S-1': { avg: 2.5, n: 2 } }, keys: { 'S-2': { on: true, date: '2026-01-01' } }, tags: { 'S-1': { shared: { on: true, date: '2026-01-01' }, High: { on: true, date: '2026-01-01' } }, 'S-2': { other: { on: true, date: '2026-01-01' }, Low: { on: true, date: '2026-01-01' } } } };
                  window.fetch = function (u) {
                    u = String(u);
                    if (/snap\/library\.json/.test(u)) return Promise.resolve(new Response(JSON.stringify({ items: [{ id: 'S-1', title: 'One', author: 'Bee' }, { id: 'S-2', title: 'Two', author: 'Ann' }, { id: 'S-3', title: 'Three', author: 'Cee' }] })));
                    if (/snap\/group\.json/.test(u)) return Promise.resolve(new Response(JSON.stringify(snap)));
                    return f3.apply(window, arguments);
                  };
                  B.library = { url: 'snap/library.json', snapshot: true };
                  return load().then(function () { return SW.library.load(); }).then(function () {
                    SW.views.library.show();
                    return wait(80);
                  }).then(function () {
                    var vs = document.getElementById('view-library');
                    function sh(id, q) { return vs.querySelectorAll('[data-lib="' + id + '"] ' + q).length; }
                    T.eq('a rating and a mark with no token', [sh('S-1', '.lib-rt'), sh('S-3', '.lib-rt'), sh('S-2', '.lib-key'), sh('S-1', '.lib-key')], [1, 0, 1, 0]);
                    T.eq('the rating as stars, on the cover', [vs.querySelector('[data-lib="S-1"] .lib-stand .lib-rt').textContent, /2\.5 from 2/.test(vs.querySelector('[data-lib="S-1"] .lib-rt').title)], ['★★★', true]);
                    T.yes('a filter by rating, and the order', vs.querySelector('[data-facet="rating"][data-val="3"]') && vs.querySelector('.lib-order option[value="rating"]'));
                    T.yes('a tag in the filter', vs.querySelector('[data-facet="tag"][data-val="shared"]'));
                    T.yes('and a level from a tag', vs.querySelector('[data-facet="relevance"][data-val="high"]'));
                    return SW.library.open('S-1').then(function () { return wait(40); });
                  }).then(function () {
                    var x9 = box();
                    T.eq('in the box, as stars only', [x9.querySelector('.lib-rec .lib-stars').textContent, /from/.test(x9.querySelector('.lib-rec').textContent)], ['★★★', false]);
                    T.yes('and its tags', x9.querySelector('.lib-tag'));
                    T.eq('with nothing to change', [x9.querySelectorAll('[data-a="key"], .lib-relsel, .lib-taginput, [data-tagoff], [data-star]').length], [0]);
                    x9.close();
                    SW.store.set('library.loans', {});
                    return SW.library.open('S-2').then(function () { return wait(30); });
                  }).then(function () {
                    function plus(n) { var d = new Date(new Date().toISOString().slice(0, 10) + 'T00:00:00Z'); d.setUTCMonth(d.getUTCMonth() + n); return d.toISOString().slice(0, 10); }
                    var xb = box();
                    T.eq('To Read is one button, its menu shut', [xb.querySelectorAll('[data-a="loan"]').length, xb.querySelector('.lib-loanmenu').hidden], [1, true]);
                    xb.querySelector('[data-a="loan"]').click();
                    T.eq('and opens', xb.querySelector('.lib-loanmenu').hidden, false);
                    xb.querySelector('[data-a="co"][data-m="2"]').click();
                    T.eq('checked out for two months', SW.library.onLoan('S-2') && SW.library.onLoan('S-2').due, plus(2));
                    T.yes('the box says so, with Return', /To read shelf/.test(xb.querySelector('.lib-loanbox').textContent) && xb.querySelector('[data-a="return"]'));
                    xb.close();
                    var vl = document.getElementById('view-library');
                    T.eq('a due stamp on its cover, and no other', [vl.querySelectorAll('[data-lib="S-2"] .lib-due').length, vl.querySelectorAll('[data-lib="S-1"] .lib-due').length], [1, 0]);
                    T.yes('as DUE and the month and day', /^DUE [A-Z]{3} \d{1,2}$/.test(vl.querySelector('[data-lib="S-2"] .lib-due').textContent));
                    vl.querySelector('[data-libview="gallery"]').click();
                    var galRows = vl.querySelectorAll('.lib-gal-r'), galPane = vl.querySelector('.lib-gal-pane');
                    T.eq('the gallery: the works in a list, the first chosen', [galRows.length > 1, galRows[0].classList.contains('on')], [true, true]);
                    var N0 = SW.notes, cf0 = N0.configured, ls0 = N0.list, asked = [];
                    N0.configured = function () { return true; }; N0.list = function (v) { asked.push(v); return Promise.resolve([]); };
                    galRows[1].click();
                    N0.configured = cf0; N0.list = ls0;
                    var ahead = [].slice.call(galRows, 2, 7).map(function (r) { return 'item:' + r.dataset.gsel; }).concat(['item:' + galRows[0].dataset.gsel]);
                    T.eq('the works ahead (five after, two before) are asked for before they are reached', ahead.filter(function (v) { return asked.indexOf(v) < 0; }), []);
                    var relRow = [].filter.call(galRows, function (r) { var e0 = SW.library.items().filter(function (x) { return x.id === r.dataset.gsel; })[0]; return e0 && (e0.relevance || '').match(/^(essential|high|medium|low|minimal|about|section|mention)$/i); })[0];
                    T.yes('a work with a level shows it in its row', !relRow || !!relRow.querySelector('.lib-lvl'));
                    T.eq('choosing another marks it', vl.querySelector('.lib-gal-r.on').dataset.gsel, galRows[1].dataset.gsel);
                    vl.querySelector('.lib-gal-list').dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));
                    T.eq('and the arrow keys move through them', vl.querySelector('.lib-gal-r.on').dataset.gsel, galRows[0].dataset.gsel);
                    vl.querySelector('[data-show="loans"]').click();
                    T.eq('filter headings shut at first', vl.querySelectorAll('.lib-facet[open]').length, 0);
                    var fb0 = vl.querySelector('.lib-fbtn').getAttribute('aria-pressed');
                    vl.querySelector('.lib-fbtn').click();
                    var fb1 = vl.querySelector('.lib-fbtn').getAttribute('aria-pressed');
                    vl.querySelector('.lib-fbtn').click();
                    T.eq('the funnel on the bar shows and hides the filters', [fb0 !== fb1, vl.querySelector('.lib-fbtn').getAttribute('aria-pressed')], [true, fb0]);
                    T.eq('the tabs and the toolbar are pinned together', [!!vl.querySelector('.lib-top > .lib-tabs'), !!vl.querySelector('.lib-top > .lib-bar')], [true, true]);
                    T.eq('To read: a card for it', [vl.querySelectorAll('.lib-card').length, vl.querySelector('[data-show="loans"]').textContent], [1, 'To read (1)']);
                    T.eq('its code and title open the work', vl.querySelectorAll('.lib-card [data-lib="S-2"]').length, 3);
                    var s2 = SW.library.items().filter(function (x) { return x.id === 'S-2'; })[0], hd = vl.querySelector('.lib-card .lib-card-lib').textContent;
                    T.yes('its head: Book Card, and who the work is by', /^Book Card/.test(hd) && (SW.library.leadOf(s2).by === 'title' || hd.indexOf(SW.library.leadOf(s2).text) > 0));
                    T.eq('Add Annotation on its back', vl.querySelectorAll('.lib-card .lib-back [data-addnote="S-2"]').length, 1);
                    vl.querySelector('.lib-card .lib-front [data-turn]').click();
                    T.yes('the card turns over', vl.querySelector('.lib-card').classList.contains('flipped') && SW.library.flipped['S-2']);
                    vl.querySelector('.lib-card .lib-back .lib-scrawls').innerHTML = 'stale';
                    SW.emit('notes', 'item:S-2');
                    return wait(80).then(function () {
                    T.eq('the chosen work in its box in the gallery pane, not over the bench', [!!galPane.querySelector('.lib-pane'), (galPane.querySelector('.px-code') || {}).textContent, document.querySelectorAll('dialog.lib-dlg[open]').length], [true, galRows[0].dataset.gsel, 0]);
                    T.yes('its back follows a note added', vl.querySelector('.lib-card .lib-back .lib-scrawls').innerHTML !== 'stale');
                    vl.querySelector('.lib-card .lib-back [data-turn]').click();
                    T.yes('and back', !vl.querySelector('.lib-card').classList.contains('flipped'));
                    vl.querySelector('[data-libview="list"]').click();
                    T.eq('as a list', [vl.querySelectorAll('.lib-loanlist tbody tr').length, vl.querySelectorAll('.lib-card').length], [1, 0]);
                    vl.querySelector('[data-libview="icons"]').click();
                    SW.store.set('library.view', '');
                    vl.querySelector('.lib-card [data-ext="1"]').click();
                    var nd = SW.library.dueNews().length;
                    var cur0 = SW.library.onLoan('S-2'), was0 = cur0.due, d3 = new Date(); d3.setUTCDate(d3.getUTCDate() + 3); cur0.due = d3.toISOString().slice(0, 10);
                    var dn0 = SW.library.dueNews();
                    SW.store.set('library.dueSoon', 0);
                    var dnOff = SW.library.dueNews().length;
                    SW.store.set('library.dueSoon', 7);
                    T.eq('due soon can be only when overdue', dnOff, 0);
                    vl.querySelector('[data-show="loans"]').click();
                    T.eq('due within the week: the card is stamped, and the news is an alert', [vl.querySelectorAll('.lib-card-soon').length, (vl.querySelector('.lib-card-soonstamp') || {}).textContent, dn0[0] && dn0[0].alert], [1, 'DUE SOON', true]);
                    T.eq('What’s new: a work due back within the week', [nd, dn0.length, /Due back [A-Z]{3} \d+/.test(dn0[0] && dn0[0].html), /data-newslib="S-2"/.test(dn0[0] && dn0[0].html)], [0, 1, true, true]);
                    cur0.due = was0;
                    T.eq('renewed: a second line, the first struck through, a month on', [vl.querySelectorAll('.lib-card tbody tr.lib-card-done').length, SW.library.onLoan('S-2').due], [1, plus(3)]);
                    var aged = vl.querySelector('.lib-card tr.lib-card-done .lib-card-who span').getAttribute('style');
                    T.yes('a crossed-out line fades in its own ink, not grey', /color:#[0-9a-f]{6}/.test(aged) && !/1f2c6b|2a2a2a|2f4f8f|3b2a6b/.test(aged) && SW.library.aged('1f2c6b') !== SW.library.aged('3b2a6b'));
                    for (var rn = 0; rn < 6; rn++) vl.querySelector('.lib-card [data-ext="1"]').click();
                    var cardH = vl.querySelector('.lib-card').offsetHeight;
                    T.eq('a full card does not grow: a sticker over the old lines, the new ones on it', [vl.querySelectorAll('.lib-card .lib-sticker').length, vl.querySelectorAll('.lib-card .lib-sticker tbody tr').length, vl.querySelectorAll('.lib-card .lib-sticker tbody tr.lib-card-done, .lib-card .lib-sticker tbody tr:not(.lib-card-done) td.lib-card-d:not(:empty)').length > 0, vl.querySelectorAll('.lib-card .lib-card-under tbody tr').length], [1, 6, true, 6]);
                    vl.querySelector('.lib-card [data-cardall]').click();
                    var cad = document.querySelector('.lib-cardall-dlg');
                    T.eq('the sticker opens every line', [!!cad, cad && cad.querySelectorAll('tbody tr').length], [true, 8]);
                    if (cad) cad.close();
                    vl.querySelector('.lib-card [data-ext="1"]').click();
                    // where the kit's stylesheet is loaded the sticker lies over the old lines; the page height is checked there
                    if (getComputedStyle(vl.querySelector('.lib-sticker')).position === 'absolute') T.eq('and the card stays its size', vl.querySelector('.lib-card').offsetHeight, cardH);
                    vl.querySelector('.lib-card [data-ext="0"]').click();
                    T.eq('and with no date', [SW.library.onLoan('S-2').due, /NO DATE/.test(vl.querySelector('.lib-card').textContent)], [null, true]);
                    vl.querySelector('.lib-card [data-ret]').click();
                    T.eq('returned', [SW.library.onLoan('S-2'), vl.querySelectorAll('.lib-card').length], [null, 0]);
                    T.eq('To read: by author, and the search names the shelf', [vl.querySelector('.lib-order select').value, vl.querySelector('.lib-q').placeholder], ['author', 'Search your To read shelf']);
                    T.eq('the reading log, shut at first, and no filters on To read', [vl.querySelector('.lib-log').open, vl.querySelector('.lib-facets').hidden], [false, true]);
                    T.eq('the reading log keeps it', [vl.querySelectorAll('.lib-log tbody tr').length, /Two/.test(vl.querySelector('.lib-log').textContent), vl.querySelector('.lib-log tbody td:nth-child(4)').textContent], [1, true, '1']);
                    vl.querySelector('[data-mynotes]').click();
                    return wait(120).then(function () {
                      var dn = box();
                      T.yes('your notes, in a box of their own', dn.querySelector('.lib-mynotes') && /Mine alone/.test(dn.querySelector('.lib-mynotes').textContent));
                      dn.close();
                    });
                    });
                  }).then(function () {
                    var l = SW.store.get('library.loans', {});
                    l['S-3'] = [{ out: '1999-01-01', due: '2000-01-01', by: 'TT' }];
                    SW.store.set('library.loans', l);
                    return load().then(function () { return SW.library.load(); });
                  }).then(function () {
                    T.eq('past its date it goes back', [SW.library.onLoan('S-3'), (SW.store.get('library.loans', {})['S-3'] || [{}])[0].back], [null, '2000-01-01']);
                    SW.store.set('library.loans', {});
                    SW.library.checkOut('S-2', 2);
                    SW.store.set('token', 'x'); N.forget();
                    return SW.library.open('S-1').then(function () { return wait(30); });
                  }).then(function () {
                    box().querySelector('[data-a="co"][data-m="1"]').click();
                    return wait(200);
                  }).then(function () {
                    function plus1() { var d = new Date(new Date().toISOString().slice(0, 10) + 'T00:00:00Z'); d.setUTCMonth(d.getUTCMonth() + 1); return d.toISOString().slice(0, 10); }
                    var today1 = new Date().toISOString().slice(0, 10), outs = posted.filter(function (x) { return x.text.indexOf('loan:out:' + plus1() + ':' + today1 + ':') === 0; }), p = outs[0];
                    T.eq('with a token, kept in the group', [!!p, p && p.permissions && p.permissions.read], [true, ['group:grp']]);
                    T.eq('and sent once, with its reference, however soon the shelf reads the group again', [outs.length, (p && p.text.split(':')[4] || '').length > 4], [1, true]);
                    T.yes('the check-out carries its inks', /^[0-9a-f]{6}\.[0-9a-f]{6}$/.test(p && p.text.split(':')[5] || ''));
                    var ck = SW.library.cardKept('S-1', 1), ck2 = SW.library.cardKept('S-1', 0);
                    T.eq('a card keeps its paper, and its age does not go back', [ck2.paper === ck.paper, ck2.age >= ck.age], [true, true]);
                    T.eq('the same reference twice reads as one', SW.library.loanHistory([{ text: 'loan:out:2026-12-01:2026-11-01:abc12', date: '2026-11-01T10:00:00Z', by: 'DB' }, { text: 'loan:out:2026-12-01:2026-11-01:abc12', date: '2026-11-02T10:00:00Z', by: 'DB' }]).length, 1);
                    T.eq('the same check-out twice reads as one', SW.library.loanHistory([{ text: 'loan:out:2026-12-01', date: '2026-11-01T10:00:00Z', by: 'DB' }, { text: 'loan:out:2026-12-01:2026-11-01', date: '2026-11-01T10:00:05Z', by: 'DB' }]).length, 1);
                    var today0 = new Date().toISOString().slice(0, 10), d2 = new Date(today0 + 'T00:00:00Z'); d2.setUTCMonth(d2.getUTCMonth() + 2);
                    T.eq('a loan made before the token is sent up, with its date', posted.filter(function (x) { return x.text.indexOf('loan:out:' + d2.toISOString().slice(0, 10) + ':' + today0 + ':') === 0; }).length, 1);
                    box().close();
                    SW.store.set('library.loans', {});
                    N.invalidate('item:S-1');
                    return load().then(function () { return SW.library.load(); }).then(function () { SW.views.library.show(); return wait(200); }).then(function () {
                      T.eq('and read back in another browser', SW.library.onLoan('S-1') && SW.library.onLoan('S-1').due, plus1());
                      var mine = rows.filter(function (a) { return a.text.indexOf('loan:out:' + plus1() + ':') === 0; })[0];
                      rows.push({ id: 'h-oth', created: '2026-01-02T00:00:00Z', user: 'acct:other@hypothes.is', uri: mine.uri, text: 'loan:out:2099-03-04', tags: ['bk:v:item:S-1', 'bk:kind:reaction', 'bk:by:OT'], references: [] });
                      N.invalidate('item:S-1');
                      return SW.library.open('S-1').then(function () { return wait(200); });
                    }).then(function () {
                      var xo = box();
                      T.yes('the box says who else has it out', /Out to OT till MAR 4/.test(xo.querySelector('.lib-loanbox').textContent));
                      xo.close();
                      var vo = document.getElementById('view-library');
                      vo.querySelector('[data-show="loans"]').click();
                      T.eq('and the card has their line', [vo.querySelectorAll('.lib-card tr.lib-card-other').length, /OT/.test(vo.querySelector('.lib-card[data-card="S-1"]').textContent)], [1, true]);
                    });
                  }).then(function () {
                    SW.store.set('library.loans', {}); SW.store.set('token', ''); N.forget();
                    window.fetch = f3;
                  }, function (e) { window.fetch = f3; throw e; });
                });
              });
            });
          });
        }).then(unstub, function (e) { unstub(); throw e; });
      });
    }).then(function () {
      restore();
    }, function (e) { restore(); throw e; });
  }
  // wiping a member's loan history: their own loan records in the group deleted one by one, and the count kept
  function wipeGroup() {
    var SW = window.SW, N = SW.notes, L = SW.library;
    if (!N || !L || !L.wipeLoans) return Promise.resolve();
    T.group('Wiping the loan history');
    var was = { cf: N.configured, my: N.myLoanNotes, rm: N.remove }, gone = [];
    N.configured = function () { return true; };
    N.myLoanNotes = function () { return Promise.resolve([{ id: 'a1', text: 'loan:out:2027-01-01' }, { id: 'a2', text: 'loan:ext:2027-03-01' }, { id: 'a3', text: 'loan:back' }]); };
    N.remove = function (n) { gone.push(n.id); return n.id === 'a3' ? Promise.reject(new Error('refused')) : Promise.resolve(); };
    SW.store.set('library.loans', { 'L-WIPE': [{ out: '2026-11-01', due: '2027-01-01', by: 'You' }] });
    return L.wipeLoans().then(function (r) {
      N.configured = was.cf; N.myLoanNotes = was.my; N.remove = was.rm;
      T.eq('each of the reader’s loan records in the group is deleted, and one refused is counted', [gone, r.group, r.failed], [['a1', 'a2', 'a3'], 2, 1]);
      T.eq('and this browser’s record is empty', SW.store.get('library.loans', {}), {});
    }, function (e) { N.configured = was.cf; N.myLoanNotes = was.my; N.remove = was.rm; throw e; });
  }
  // a reader's own Library settings would change what the checks see: kept aside while they run, then put back
  var OWN = ['library.view', 'library.order', 'library.size', 'library.catby', 'library.loans', 'library.relevance', 'library.cards', 'library.sign', 'library.dueSoon', 'library.fopen', 'library.joined', 'library.filters'];
  // the library's record in memory is let go each way, or a later save would write the checks' loans (S-1, S-2, by TT)
  // into the bench's own store; putting back waits for anything the checks set going to finish first
  function forget() { if (SW.library && SW.library.forgetLoans) SW.library.forgetLoans(); }
  function aside() { var kept = {}; OWN.forEach(function (k) { kept[k] = SW.store.get(k, null); SW.store.set(k, k === 'library.loans' ? {} : ''); }); forget(); return kept; }
  function putBack(kept) { return wait(400).then(function () { OWN.forEach(function (k) { if (kept[k] == null) SW.store.remove(k); else SW.store.set(k, kept[k]); }); forget(); }); }
  T.later('the Library', function () {
    var kept = aside();
    return (T.fetchChain || Promise.resolve()).then(run).then(itemNotes).then(wipeGroup).then(function () { return putBack(kept); }, function (e) { return putBack(kept).then(function () { throw e; }); });
  });
})();
