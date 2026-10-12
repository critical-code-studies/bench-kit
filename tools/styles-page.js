/*
 * tools/styles-page.js - run in the bench by tools/styles.js: for each colour theme and each
 * state of the page (every tab, the Key, every menu open, every menu item, the genealogy's
 * figures), every visible element's computed style with the stylesheets on disk, then with the
 * stylesheets as committed (served under /__before/), then on disk again: elements that change
 * between the two readings on disk (an animation) are set aside, and the rest that differ listed.
 *   window.__stylesCompare({ themes, only, max }) -> { states, diffs: [{ at, el, props }], counts }
 * Part of bench-kit (github.com/critical-code-studies/bench-kit).
 */
(function () {
  'use strict';
  var SW = window.SW, B = SW.BENCH;
  var P = ['color', 'backgroundColor', 'backgroundImage', 'fontSize', 'fontFamily', 'fontWeight', 'fontStyle', 'lineHeight', 'marginTop', 'marginRight', 'marginBottom', 'marginLeft',
    'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft', 'borderTopWidth', 'borderTopStyle', 'borderTopColor', 'borderBottomWidth', 'borderBottomStyle', 'borderBottomColor',
    'borderLeftWidth', 'borderLeftStyle', 'borderLeftColor', 'borderRightWidth', 'borderRightColor', 'display', 'position', 'top', 'left', 'textAlign', 'textDecorationLine', 'opacity',
    'borderTopLeftRadius', 'whiteSpace', 'gridTemplateColumns', 'flexDirection', 'flexWrap', 'alignItems', 'justifyContent', 'gap', 'visibility', 'overflowX', 'overflowY', 'zIndex',
    'boxShadow', 'cursor', 'verticalAlign', 'textTransform', 'letterSpacing', 'width', 'maxWidth', 'minWidth', 'height', 'maxHeight', 'fill', 'stroke', 'outlineStyle', 'transform'];
  var PP = ['content', 'color', 'backgroundColor', 'display', 'width', 'height', 'borderLeftColor'];
  var sleep = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };
  function path(e) {
    var p = [];
    for (var x = e; x && x !== document.body && p.length < 5; x = x.parentElement)
      p.unshift(x.tagName.toLowerCase() + (x.id ? '#' + x.id : '') + (x.className && typeof x.className === 'string' ? '.' + x.className.trim().split(/\s+/).slice(0, 3).join('.') : ''));
    return p.join('>');
  }
  function shot() {
    var els = SW.$$('body *').filter(function (e) { return e.getClientRects().length > 0; });
    if (els.length > 6000) els = els.filter(function (e) { return !e.closest('svg') || e.tagName.toLowerCase() === 'svg'; });
    return els.map(function (e) {
      var c = getComputedStyle(e), s = P.map(function (k) { return c[k]; }).join('|');
      if (!e.closest('svg')) ['::before', '::after'].forEach(function (pe) {
        var q = getComputedStyle(e, pe); if (q.content && q.content !== 'none' && q.content !== 'normal') s += '|' + pe + PP.map(function (k) { return q[k]; }).join('/');
      });
      return { e: e, s: s };
    });
  }
  // the page's own stylesheets, and their committed versions
  var links = SW.$$('link[rel="stylesheet"]').filter(function (l) { return new URL(l.href).origin === location.origin; });
  links.forEach(function (l) { l.__now = l.getAttribute('href'); l.__before = '/__before' + new URL(l.href).pathname; });
  function swap(mode) {
    return Promise.all(links.map(function (l) {
      return new Promise(function (r) {
        var n = l.cloneNode(); n.href = (mode === 'before' ? l.__before : l.__now) + '?t=' + Date.now(); n.__now = l.__now; n.__before = l.__before;
        n.onload = n.onerror = function () { r(); }; setTimeout(r, 3000);
        l.parentNode.insertBefore(n, l); l.remove(); links[links.indexOf(l)] = n;
      });
    })).then(function () { return sleep(250); });
  }
  function closeAll() {
    SW.$$('dialog[open]').forEach(function (d) { d.close(); });
    if (SW.tours && SW.tours.stop) try { SW.tours.stop(); } catch (e) {}
    SW.$$('.tour-card').forEach(function (e) { e.remove(); });
    if (SW.unpop) SW.unpop();
    var m = document.querySelector('.tab-menu'); if (m) { var b = SW.$('#tabs [aria-expanded="true"]'); if (b) b.click(); }
  }
  // items that leave the page or act rather than show something
  var ACTIONS = ['sitemap', 'site', 'code', 'issue', 'backup', 'restore'].concat(Object.keys(((B.sitemap && B.sitemap.links) || {})));
  function states() {
    var S = [{ name: 'read', go: function () { closeAll(); SW.setTab('read'); } }];
    SW.$$('#tabs > button[data-tab]').forEach(function (b) { if (b.dataset.tab !== 'read') S.push({ name: b.dataset.tab, go: function () { closeAll(); SW.setTab(b.dataset.tab); } }); });
    S.push({ name: 'key', wait: 500, go: async function () { closeAll(); SW.setTab('read'); await sleep(800); var k = SW.$$('#view-read .toolbar > button').filter(function (b) { return b.textContent === 'Key'; })[0]; if (k) k.click(); }, after: closeAll });
    SW.$$('#tabs > button[data-menu]').forEach(function (b) {
      var w = b.dataset.menu;
      S.push({ name: 'menu:' + w, wait: 400, go: async function () { closeAll(); SW.setTab('read'); await sleep(300); b.click(); }, after: closeAll });
      b.click(); var picks = SW.$$('.tab-menu [data-pick]').map(function (x) { return x.dataset.pick; }); b.click();
      picks.filter(function (p) { return ACTIONS.indexOf(p) < 0; }).forEach(function (p) {
        S.push({ name: w + ':' + p, wait: 2200, after: closeAll, go: async function () {
          closeAll(); b.click(); await sleep(150); var it = SW.$('.tab-menu [data-pick="' + p + '"]'); if (it) it.click(); else { b.click(); throw new Error('no ' + p); }
        } });
      });
    });
    if (SW.$('#view-genealogy')) ['stemma', 'flow', 'tree'].forEach(function (m) {
      S.push({ name: 'genealogy:' + m, wait: 2500, go: async function () { closeAll(); SW.setTab('genealogy'); await sleep(800); var x = SW.$$('#view-genealogy button').filter(function (y) { return y.textContent.trim().toLowerCase() === m; })[0]; if (x) x.click(); } });
    });
    return S;
  }

  window.__stylesCompare = async function (o) {
    o = o || {};
    var still = document.createElement('style'); still.textContent = '*, *::before, *::after { transition: none !important; animation: none !important; }'; document.head.appendChild(still);
    var themes = o.themes && o.themes.length ? o.themes : [SW.THEMES[0].id, 'paper'];
    var S = states(); if (o.only && o.only.length) S = S.filter(function (s) { return o.only.indexOf(s.name) >= 0; });
    var out = { states: S.map(function (s) { return s.name; }), themes: themes, diffs: [], counts: {}, total: 0 };
    for (var ti = 0; ti < themes.length; ti++) {
      SW.setTheme(themes[ti]); await sleep(300);
      for (var si = 0; si < S.length; si++) {
        var st = S[si], at = themes[ti] + ' · ' + st.name;
        try { await st.go(); } catch (e) { out.counts[at] = 'could not open: ' + e.message; continue; }
        await sleep(st.wait || 1500);
        // read with the stylesheets on disk, as committed, and on disk again: what changes between
        // the two readings on disk is the page changing by itself (an animation), and is set aside
        var a = shot(); await swap('before'); var b = shot(); await swap('now'); var c = shot();
        var m = new Map(), m2 = new Map(); b.forEach(function (x) { m.set(x.e, x.s); }); c.forEach(function (x) { m2.set(x.e, x.s); });
        var d = 0, moving = a.length !== c.length, steady = 0;
        a.forEach(function (x) {
          if (!m.has(x.e) || m2.get(x.e) !== x.s) { if (m2.get(x.e) !== x.s) moving = true; return; }
          steady++;
          var sb = m.get(x.e); if (sb === x.s) return;
          d++;
          if (out.diffs.length < (o.max || 40)) {
            var A = x.s.split('|'), Bb = sb.split('|'), props = [];
            for (var j = 0; j < Math.max(A.length, Bb.length); j++) if (A[j] !== Bb[j]) props.push((P[j] || 'pseudo') + ': ' + Bb[j] + ' → ' + A[j]);
            out.diffs.push({ at: at, el: path(x.e).slice(-120), props: props.slice(0, 4) });
          }
        });
        var shown = !moving && a.length !== b.length;   // an element shown or hidden by the stylesheets alone
        out.counts[at] = a.length + ' elements' + (d ? ', ' + d + ' differ' : '') + (shown ? ' (' + b.length + ' visible as committed)' : '') +
          (moving ? ' (the page moves by itself here; ' + steady + ' still elements compared)' : '');
        out.total += d + (shown ? 1 : 0);
        if (st.after) try { await st.after(); } catch (e) {}
      }
    }
    SW.setTheme(themes[0]); still.remove();
    return out;
  };
})();
