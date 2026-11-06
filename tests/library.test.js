/*
 * tests/library.test.js - checks of kit/library.js, run by tests/run.js, whatever the bench: the module
 * loaded here with entries of its own. Audio and video in an entry's box, on the public shelf and through
 * GitHub on the private one; a private entry without a token, with nothing asked of GitHub.
 * Part of bench-kit (github.com/critical-code-studies/bench-kit).
 */
(function () {
  'use strict';
  var T = window.T, kit = document.currentScript.src.replace(/[^/]*$/, '').replace(/tests\/$/, '');
  function wait(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function box() { var ds = document.querySelectorAll('dialog.lib-dlg'); return ds[ds.length - 1] || null; }
  function run() {
    var SW = window.SW, B = SW.BENCH;
    var was = { lib: B.library, mod: SW.library, view: SW.views && SW.views.library, kit: SW.kitViews, px: SW.paratexts, token: SW.store.get('gh.token', ''), fetch: window.fetch };
    var hadTab = !!document.querySelector('[data-tab="library"]'), hadView = !!document.getElementById('view-library');
    SW.views = SW.views || {};
    B.library = { private: { org: 'group', repo: 'archive' }, items: [
      { id: 'a1', title: 'A talk', file: 'library/files/talk.mp3' },
      { id: 'v1', title: 'A film', file: 'library/files/film.mp4' },
      { id: 'p1', title: 'A podcast', shelf: 'private', file: 'library/podcast.m4a', url: 'https://example.org/podcast' }
    ] };
    SW.paratexts = undefined;   // the group's copies are not what is tried here
    var asked = [];
    window.fetch = function (u) {
      if (!/api\.github\.com/.test(String(u))) return was.fetch.apply(window, arguments);
      asked.push(String(u));
      return Promise.resolve(new Response(new Blob(['x']), { status: 200 }));
    };
    function restore() {
      window.fetch = was.fetch; B.library = was.lib; SW.library = was.mod; SW.kitViews = was.kit; SW.paratexts = was.px; SW.store.set('gh.token', was.token);
      if (was.view) SW.views.library = was.view; else delete SW.views.library;
      if (!hadTab) { var t = document.querySelector('[data-tab="library"]'); if (t) t.remove(); }
      if (!hadView) { var v = document.getElementById('view-library'); if (v) v.remove(); }
      document.querySelectorAll('dialog.lib-dlg').forEach(function (d) { if (d.open) d.close(); d.remove(); });
    }
    SW.store.set('gh.token', '');
    return new Promise(function (res, rej) {
      var s = document.createElement('script'); s.src = kit + 'library.js?t=' + Date.now(); s.onload = res; s.onerror = function () { rej(new Error('could not load library.js')); }; document.body.appendChild(s);
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
    }).then(restore, function (e) { restore(); throw e; });
  }
  // after the Images tab's checks, which also put their own window.fetch in place
  T.later('the Library', function () { return (T.fetchChain || Promise.resolve()).then(run); });
})();
