/*
 * tours.js - a guided tour of the bench, for new members of the group: a
 * sequence of stops, each opening a version, a view and (where it helps) a
 * selection, with a line or two of commentary and a soft outline on the
 * control it is about. Played in a card in the bottom-left corner; Back and
 * Next (or the arrow keys), Esc to leave. Started from the Help menu,
 * Settings or the About box, a link ending ?tour=welcome, or the offer made on a first visit.
 */
(function (root) {
  'use strict';
  var SW = root.SW;
  var T = SW.tours = {};

  // A stop: title, text, and where to go: v (version), tab, find (a pattern
  // for the line to select in Read, so the tour survives renumbering), lens,
  // graphic, gen (genealogy view), tape ({path, mode}), b (Compare's other
  // version), focus (a selector to outline).
  // The bench's tours ({welcome: {title, stops}}) and the offer made on a first visit (SW.BENCH)
  var B = SW.BENCH || {};
  T.TOURS = B.tours || {};

  var cur = null;   // { tour, i, card }

  function clearFocus() { SW.$$('.tour-focus').forEach(function (e) { e.classList.remove('tour-focus'); }); }
  function focusOn(sel) {
    clearFocus();
    if (!sel) return;
    var tries = 0;
    (function look() {
      var el = document.querySelector(sel);
      if (el && el.offsetParent !== null) { el.classList.add('tour-focus'); el.scrollIntoView({ block: 'nearest', inline: 'nearest' }); return; }
      if (++tries < 30) setTimeout(look, 150);
    })();
  }

  // Take the bench to a stop.
  function goTo(s) {
    if (SW.$('#dlg-settings').open) SW.$('#dlg-settings').close();
    if (SW.$('#dlg-about') && SW.$('#dlg-about').open) SW.$('#dlg-about').close();
    SW.closeDrawer && document.body.classList.contains('drawer-open') && SW.closeDrawer();
    if (s.v && s.v !== SW.state.v) SW.select(s.v);
    if (s.b) SW.state.b = s.b;
    if (s.tape) { SW.store.set('tape.mode', s.tape.mode || 'holes'); SW.state.tapeGo = { path: s.tape.path }; SW.forget('tape'); }
    if (s.lens) { SW.openLens(s.lens); return focusOn(s.focus); }
    if (s.graphic) { SW.openGraphic(s.graphic); return focusOn(s.focus); }
    if (s.gen) { SW.genealogyShow(s.gen); return focusOn(s.focus); }
    if (s.find) {
      SW.build(s.v || SW.state.v).then(function (b) {
        for (var p = 0; p < b.lines.length; p++) {
          if (b.parts[p].role !== 'program') continue;
          for (var i = 0; i < b.lines[p].length; i++) {
            var L = b.lines[p][i];
            if (!L.away && s.find.test(L.raw)) { SW.openAt(b.v.id, { p: p, n0: L.n }); return focusOn(s.focus); }
          }
        }
        SW.setTab('read'); focusOn(s.focus);
      });
      return;
    }
    if (s.tab) { if (s.tab === 'compare') SW.forget('compare'); SW.setTab(s.tab); }
    focusOn(s.focus);
  }

  function paint() {
    var t = cur.tour, s = t.stops[cur.i], n = t.stops.length;
    cur.card.innerHTML = '<div class="tour-top"><span class="tour-step">' + (cur.i + 1) + ' of ' + n + '</span><span class="tour-name">' + SW.esc(t.title) + '</span>' +
      '<button class="icon-btn tour-x" data-t="exit" title="Leave the tour (Esc)">✕</button></div>' +
      '<h3>' + SW.esc(s.title) + '</h3><p>' + SW.esc(s.text) + '</p>' +
      '<div class="tour-dots">' + t.stops.map(function (x, k) { return '<i class="' + (k === cur.i ? 'on' : k < cur.i ? 'done' : '') + '" data-t="go" data-k="' + k + '" title="' + SW.esc(x.title) + '"></i>'; }).join('') + '</div>' +
      '<div class="tour-nav"><button class="btn ghost" data-t="back"' + (cur.i ? '' : ' disabled') + '>← Back</button>' +
      (cur.i < n - 1 ? '<button class="btn" data-t="next">Next →</button>' : '<button class="btn" data-t="exit">Finish</button>') + '</div>';
    goTo(s);
  }
  function step(d) { if (!cur) return; var k = cur.i + d; if (k < 0 || k >= cur.tour.stops.length) return; cur.i = k; paint(); }
  function key(e) {
    if (!cur || e.target.closest('input, textarea, select, [contenteditable]')) return;
    if (e.key === 'ArrowRight') { e.preventDefault(); step(1); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); step(-1); }
    else if (e.key === 'Escape') T.stop();
  }

  T.start = function (id) {
    var t = T.TOURS[id || 'welcome'];
    if (!t) return;
    T.stop();
    var card = SW.el('div', { class: 'tour-card', role: 'dialog', 'aria-label': t.title });
    document.body.appendChild(card);
    cur = { tour: t, i: 0, card: card };
    card.addEventListener('click', function (e) {
      var b = e.target.closest('[data-t]');
      if (!b) return;
      if (b.dataset.t === 'next') step(1);
      else if (b.dataset.t === 'back') step(-1);
      else if (b.dataset.t === 'go') { cur.i = +b.dataset.k; paint(); }
      else T.stop();
    });
    document.addEventListener('keydown', key);
    SW.store.set('tour.seen', true);
    paint();
  };
  T.stop = function () {
    if (!cur) return;
    cur.card.remove();
    cur = null;
    clearFocus();
    document.removeEventListener('keydown', key);
  };

  // On a first visit, a quiet offer in the tour's corner.
  T.offer = function () {
    if (SW.store.get('tour.seen', false) || cur) return;
    var card = SW.el('div', { class: 'tour-card tour-offer', role: 'dialog', 'aria-label': 'Welcome' });
    card.innerHTML = '<h3>New to the bench?</h3><p>' + SW.esc(B.tourOffer || 'A short tour shows how to read, compare and annotate the sources.') + '</p>' +
      '<div class="tour-nav"><button class="btn ghost" data-o="no">Not now</button><button class="btn" data-o="yes">Take the tour</button></div>';
    document.body.appendChild(card);
    card.addEventListener('click', function (e) {
      var b = e.target.closest('[data-o]');
      if (!b) return;
      card.remove();
      SW.store.set('tour.seen', true);
      if (b.dataset.o === 'yes') T.start('welcome');
      else SW.toast('You can take the tour any time from the Help menu.', 5000);
    });
  };
})(this);
