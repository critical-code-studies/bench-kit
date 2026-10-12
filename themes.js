/*
 * themes.js - how the bench looks: code text (font and size), the hands written into the text
 * (SW.BENCH.hands), colour schemes for figures, colour themes (the first, the default, named by
 * SW.BENCH.theme), and figures for export (background, colours, reference stamp, SVG, PNG and
 * My notes buttons), with documents exported as Word or Markdown. Loaded after config.js.
 * Part of bench-kit (github.com/critical-code-studies/bench-kit).
 */
(function (root) {
  'use strict';
  var SW = root.SW, B = SW.BENCH || {};

  // ---------- code text: font and size, for reading ----------
  var WEBFONTS = { 'JetBrains Mono': 1, 'IBM Plex Mono': 1, 'Source Code Pro': 1, 'Fira Code': 1, 'Courier Prime': 1 };
  SW.codeFont = function () { return SW.store.get('codeFont', 'system'); };
  SW.codeSize = function () { var n = +SW.store.get('codeSize', 13); return n >= 9 && n <= 24 ? n : 13; };
  // A faint ground on annotated lines, unless turned off in Settings.
  SW.applyNoteShade = function () {
    document.documentElement.classList.toggle('no-note-shade', !SW.store.get('noteShade', true));
  };
  SW.applyCodeText = function () {
    var f = SW.codeFont(), de = document.documentElement;
    if (WEBFONTS[f] && !document.getElementById('font-' + SW.slug(f))) {
      var l = document.createElement('link');
      l.rel = 'stylesheet'; l.id = 'font-' + SW.slug(f);
      l.href = 'https://fonts.googleapis.com/css2?family=' + encodeURIComponent(f).replace(/%20/g, '+') + ':wght@400;700&display=swap';
      document.head.appendChild(l);
    }
    de.style.setProperty('--code-font', f === 'system' ? 'var(--mono)' : '"' + f + '", var(--mono)');
    de.style.setProperty('--code-size', SW.codeSize() + 'px');
    SW.emit('codetext');
  };
  SW.setCodeSize = function (n) {
    n = Math.max(9, Math.min(24, Math.round(n)));
    SW.store.set('codeSize', n);
    SW.applyCodeText();
    SW.toast('Code text ' + n + ' px');
  };

  // ---------- hands: the people whose initials or names are written into the text ----------
  // The bench's list (SW.BENCH.hands): { k, who, re, colour }. Colours read on both the dark plate and white.
  SW.HANDS = B.hands || [];
  SW.handOf = function (k) { return SW.HANDS.filter(function (h) { return h.k === k; })[0] || null; };
  // The hands named in a piece of text, in the order of SW.HANDS.
  SW.handsIn = function (text) {
    return SW.HANDS.filter(function (h) { return h.re.test(text || ''); }).map(function (h) { return h.k; });
  };

  // ---------- colour schemes for the genealogy figures ----------
  SW.PALETTES = [
    ['phosphor', 'Theme colours (default)'], ['okabe', 'Colour-blind safe (Okabe–Ito)'], ['tol', 'Colour-blind safe (Tol)'],
    ['muted', 'Muted (print)'], ['bold', 'Bold, high contrast'], ['warm', 'Warm'], ['grey', 'Greyscale']
  ];
  SW.palette = function () { return SW.store.get('gen.palette', 'phosphor'); };
  SW.applyPalette = function (k) {
    if (k) SW.store.set('gen.palette', k);
    k = SW.palette();
    if (k === 'phosphor') document.documentElement.removeAttribute('data-gpal');
    else document.documentElement.setAttribute('data-gpal', k);
  };
  // A select for choosing a scheme; onChange re-renders the caller's figure.
  SW.paletteSelect = function (onChange) {
    var l = SW.el('label', { class: 'check', title: 'Colours for retained, moved, edited, added and removed, on screen and in exported figures' }, 'Colours ');
    l.classList.add('pal-pick');
    var sel = SW.el('select', {}, SW.PALETTES.map(function (p) { return '<option value="' + p[0] + '"' + (p[0] === SW.palette() ? ' selected' : '') + '>' + SW.esc(p[1]) + '</option>'; }).join(''));
    sel.onchange = function (e) { e.stopPropagation(); SW.applyPalette(sel.value); if (onChange) onChange(); };
    l.appendChild(sel);
    return l;
  };

  // ---------- colour themes ----------
  // Each is a set of CSS custom properties (kit/themes.css, :root[data-theme]; a bench's
  // css/research.css may change any of them).
  // 'dark' says whether its ground is dark, for figures that draw their own. The first is the
  // bench's own, named by SW.BENCH.theme { label, note }.
  SW.THEMES = [
    { id: 'phosphor', label: (B.theme || {}).label || 'Phosphor', dark: true, note: (B.theme || {}).note || 'the bench’s own (the default)' },
    { id: 'green', label: 'Terminal, green', dark: true, note: 'green phosphor on black' },
    { id: 'amber', label: 'Terminal, amber', dark: true, note: 'amber phosphor on black' },
    { id: 'contrast', label: 'High contrast', dark: true, note: 'white and bright colours on black' },
    { id: 'paper', label: 'Listing paper', dark: false, note: 'dark ink on the cream of a printed listing' },
    { id: 'white', label: 'Paper', dark: false, note: 'black on white' },
    { id: 'sepia', label: 'Sepia', dark: false, note: 'brown ink on warm paper, for long reading' }
  ];
  SW.themeInfo = function (id) {
    id = id || document.documentElement.getAttribute('data-theme') || 'phosphor';
    return SW.THEMES.filter(function (t) { return t.id === id; })[0] || SW.THEMES[0];
  };
  SW.theme = function () { return SW.themeInfo().id; };
  // A custom property as the current theme (or a given one) sets it.
  SW.cssVar = function (name, theme) { return SW.resolveVars('var(' + name + ')', theme); };

  // ---------- figures: on screen in the theme's colours; in export, the chosen background ----------
  // 'theme' exports in the colours of the theme in use, on its own figure plate.
  SW.FIGBG = { white: '#ffffff', paper: '#f4f1e8', black: '#04060b', transparent: null, theme: 'theme' };
  SW.figBg = function () { var b = SW.store.get('figbg', 'white'); return b in SW.FIGBG ? b : 'white'; };
  // The theme whose colours an export uses, and the colour laid under it.
  var FIGBG_THEME = { white: 'white', paper: 'paper', black: 'phosphor', transparent: 'white' };
  SW.figTheme = function () { var k = SW.figBg(); return k === 'theme' ? SW.theme() : FIGBG_THEME[k]; };
  SW.figBgColour = function () { var k = SW.figBg(); return k === 'theme' ? SW.cssVar('--plate') : SW.FIGBG[k]; };

  // Resolve CSS custom properties in an SVG against a given theme, so the
  // figure stands alone. The theme attribute is switched and restored
  // synchronously, which reads the other palette without a repaint.
  SW.resolveVars = function (svg, theme) {
    var de = document.documentElement, was = de.getAttribute('data-theme');
    if (theme) de.setAttribute('data-theme', theme);
    var cs = getComputedStyle(de), cache = {};
    function val(name, fb) {
      if (!(name in cache)) cache[name] = cs.getPropertyValue(name).trim();
      return cache[name] || (fb || '#888').trim();
    }
    var out = svg.replace(/var\((--[\w-]+)\s*(?:,\s*([^)]+))?\)/g, function (m, name, fb) { return val(name, fb); });
    if (theme) { if (was == null) de.removeAttribute('data-theme'); else de.setAttribute('data-theme', was); }
    return out;
  };
  // Figures on screen take the colours of the theme in use, on its figure plate.
  SW.lightTheme = function () { return !SW.themeInfo().dark; };

  SW.displaySVG = function (svg) { return SW.resolveVars(svg.replace(/[\x00-\x08\x0b\x0c\x0e-\x1f]/g, '')); };
  // Palettes for figures that draw their own ground (sky, ships). The accent is the bench's
  // (SW.BENCH.accent: { dark, light }).
  var ACC = B.accent || { dark: '#e58be0', light: '#a3317a' };
  SW.PLATE = { bg: '#02040a', ink: '#e6f4ff', ink2: '#8fc3d6', dim: '#7fa6c4', accent: ACC.dark, dark: true };
  SW.exportPalette = function () {
    var k = SW.figBg();
    if (k === 'theme') {
      var t = SW.themeInfo();
      return { bg: SW.cssVar('--plate'), dark: t.dark, ink: SW.cssVar('--g-text'), ink2: SW.cssVar('--beam'), dim: SW.cssVar('--g-muted'), accent: SW.cssVar('--amber') };
    }
    var dark = k === 'black';
    return { bg: SW.FIGBG[k], dark: dark, ink: dark ? '#e6f4ff' : '#1b1f23', ink2: dark ? '#8fc3d6' : '#0f6f86',
             dim: dark ? '#7fa6c4' : '#56606a', accent: dark ? ACC.dark : ACC.light };
  };
  // An SVG for export: coloured for the chosen background, with that background laid under it.
  SW.exportSVG = function (svg) {
    var bg = SW.figBgColour();
    // XML 1.0 forbids most control characters; the sources carry form feeds.
    svg = svg.replace(/[\x00-\x08\x0b\x0c\x0e-\x1f]/g, '');
    svg = SW.resolveVars(svg, SW.figTheme());
    if (bg) svg = svg.replace(/(<svg\b[^>]*>)/, '$1<rect x="0" y="0" width="100%" height="100%" fill="' + bg + '"/>');
    return svg;
  };
  // SVG and PNG buttons for a figure. getSvg(palette) returns the markup.
  // A figure's reference, in small type in its bottom right corner, so an exported
  // figure carries the source it was drawn from (ref: a string, or a function giving one)
  SW.refsOf = function (vids) { var seen = {}; return (vids || []).filter(function (v) { if (!v || seen[v]) return false; seen[v] = 1; return true; }).map(function (v) { return SW.refText(v); }).join(' '); };
  SW.stampRef = function (svg, ref) {
    if (typeof ref === 'function') ref = ref();
    if (!ref) return svg;
    var m = /<svg\b[^>]*>/.exec(svg); if (!m) return svg;
    var vb = /viewBox="\s*([-\d.]+)[\s,]+([-\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)"/.exec(m[0]), wd = /\bwidth="([\d.]+)/.exec(m[0]), ht = /\bheight="([\d.]+)/.exec(m[0]);
    var x0 = vb ? +vb[1] : 0, y0 = vb ? +vb[2] : 0, W = vb ? +vb[3] : wd ? +wd[1] : 0, H = vb ? +vb[4] : ht ? +ht[1] : 0;
    if (!W || !H) return svg;
    var t = '<text x="' + (x0 + W - 6) + '" y="' + (y0 + H - 5) + '" text-anchor="end" font-family="IBM Plex Mono, monospace" font-size="' + Math.max(8, Math.round(W / 110)) + '" fill="#8a96a3" opacity="0.9">' + SW.esc(ref) + '</text>';
    return svg.replace(/<\/svg>\s*$/, t + '</svg>');
  };
  SW.figureButtons = function (getSvg0, name0, ref) {
    var nm = function () { return typeof name0 === 'function' ? name0() : name0; };
    var getSvg = ref ? function (pal) { return SW.stampRef(getSvg0(pal), ref); } : getSvg0;
    var w = SW.el('span');
    w.appendChild(SW.el('button', { class: 'btn', title: 'Save as SVG (background: ' + SW.figBg() + '; change under ⚙)', onclick: function () {
      root.SWExport.download(nm() + '.svg', SW.exportSVG(getSvg(SW.exportPalette())), 'image/svg+xml');
    } }, '▣ SVG'));
    w.appendChild(document.createTextNode(' '));
    w.appendChild(SW.el('button', { class: 'btn', title: 'Save as PNG at three times screen size (background: ' + SW.figBg() + '; change under ⚙)', onclick: function () {
      SW.toast('Rendering PNG…');
      SW.figures.svgToPNG(SW.exportSVG(getSvg(SW.exportPalette())), 3, SW.figBgColour()).then(function (r) {
        root.SWExport.download(nm() + '.png', r.png, 'image/png');
      }, function () { SW.toast('The PNG could not be made from this figure; try SVG, or zoom out first.', 6000); });
    } }, '▣ PNG'));
    w.appendChild(document.createTextNode(' '));
    w.appendChild(SW.el('button', { class: 'btn ghost', title: 'Put this figure in My notes (private), to gather with others for a chapter', onclick: function () {
      if (SW.tray) SW.tray.addFigure(getSvg(SW.exportPalette()), nm());
    } }, '＋ My notes'));
    return w;
  };

  // Export a document model as .docx or .md.
  SW.exportDoc = function (doc, base, fmt) {
    var E = root.SWExport;
    if (!E) { SW.toast('Export library not loaded'); return; }
    var name = SW.slug(base || doc.title || B.slug || 'bench');
    if (fmt === 'md') {
      E.download(name + '.md', E.markdown(doc), 'text/markdown');
      (E.markdownAssets ? E.markdownAssets(doc) : []).forEach(function (a) {
        E.download(name + '-' + a.name, a.data, 'image/png');
      });
    } else {
      E.download(name + '.docx', E.docx(doc),
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    }
    SW.toast('Exported ' + name + (fmt === 'md' ? '.md' : '.docx'));
  };
  SW.exportButtons = function (makeDoc, base) {
    var wrap = SW.el('span');
    wrap.appendChild(SW.el('button', { class: 'btn', title: 'Export to Word', onclick: function () {
      Promise.resolve(makeDoc()).then(function (d) { SW.exportDoc(d, typeof base === 'function' ? base() : base, 'docx'); });
    } }, '⤓ Word'));
    wrap.appendChild(document.createTextNode(' '));
    wrap.appendChild(SW.el('button', { class: 'btn', title: 'Export to Markdown', onclick: function () {
      Promise.resolve(makeDoc()).then(function (d) { SW.exportDoc(d, typeof base === 'function' ? base() : base, 'md'); });
    } }, '⤓ Markdown'));
    wrap.appendChild(document.createTextNode(' '));
    wrap.appendChild(SW.el('button', { class: 'btn ghost', title: 'Put this (as it would export) in My notes (private), to gather with others for a chapter', onclick: function () {
      Promise.resolve(makeDoc()).then(function (d) { if (SW.tray) SW.tray.addDoc(d); });
    } }, '＋ My notes'));
    return wrap;
  };
})(this);
