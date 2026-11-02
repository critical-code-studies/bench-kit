/*
 * wordcloud.js - word clouds for a bench's lenses, as SW.wordcloud. The layout is a port of Andreas
 * Mueller's word_cloud (github.com/amueller/word_cloud, 1.9.6, MIT: © 2012 Andreas Christian Mueller;
 * the notice is in docs/wordcloud-LICENSE.txt): words largest first, each put at a place drawn at
 * random from every place where its box touches no ink drawn so far, found through an integral image
 * of the ink, so that small words settle into the gaps between the letters of large ones. The cloud is
 * drawn as SVG coloured by the theme's tokens, every word a <text data-w> a lens can make clickable,
 * and a layout can be kept and redrawn so that a word stays in its place from step to step.
 *
 *   cloud(items, o)   items: [{ w, n, fill?, alpha?, title? }], fill a colour or a theme token
 *                     (var(--green)), alpha 0 to 1. o:
 *                       width (760), height (420); min (11) and max (60) font sizes; seed (11)
 *                       font, weight ('normal'), caps; upright: the share of words set upright (0 to 1)
 *                       contrast: how a count gives a size: 'sqrt' (default), 'log', 'linear', or
 *                         'relative' (word_cloud's own: each word's size from the one before it, by
 *                         relativeScaling, 0.5); scale: the count given the largest size (the items'
 *                         largest by default; pin it to keep sizes comparable across steps)
 *                       shape: one of SHAPES ('rect' by default); mask: a function (x, y) true where
 *                         no word may go; margin (or pad): the space round each word (2)
 *                       layout: 'random' (word_cloud's) or 'spiral' (outwards from the middle)
 *                       fontStep (1): how far a word shrinks at a time when it does not fit
 *                       ink: 'glyphs' (the letters' own shapes, in a page) or 'box' (their boxes)
 *                       places: an earlier layout's; each word is drawn at its place there, no larger
 *                         than it was and smaller if its count is; a word with no place is left out
 *                       faint: a word with a place and no count here is drawn faintly
 *                     returns { svg, places, dropped, drawn }: places { w: { x, y, w, h, size, up,
 *                     n, ox, oy } } (the centre, the ink's size, the font size, upright, the count,
 *                     the baseline's offset from the centre), dropped the words that did not fit,
 *                     drawn the words drawn
 *   metrics(w, size, font, weight)   a word's ink box: { w, h, left, ascent }, measured on a canvas
 *                     where there is one and estimated where there is not (node)
 *   measure(w, size, font, weight)   its width
 *   FONTS             the fonts a lens may offer, { id: [name, CSS font-family] }
 *   LOOKS, DEFAULT    formats that go together, { id: [name, format] }, and the one a cloud starts with
 *                     ('oval': many colours, Georgia, half the words upright, an oval; the Melville
 *                     bench's, which David chose)
 *   format(F)         a whole format from a look and any details set beside it ({ look: 'oval', upright: 0.5 })
 *   brief(F)          the look and only the details that differ from it, for a link or a saved setting
 *   options(F)        the cloud's options for a format (font, weight, caps, upright, shape, pad, contrast)
 *   colour(items, F, o)  the items coloured by the format; o.colour(item, rank) for a bench's own colouring
 *   control(o)        a Look menu, ⚙ (the details in a pop-over) and Default View, for one line of a
 *                     lens's toolbar, keeping the view in the browser (see the function)
 *   save, load        a view kept in the browser under a key: { format, view }
 *   encode, decode    a view as one string for a Share link ('look:oval,upright:1,src:chapters')
 *   frame(o)          the cloud's figure, with zoom (− Fit +) and the kit's SVG, PNG and My notes
 *   SHAPES            the shapes a cloud may take, { id: [name, inside(x, y, W, H)] }, in the order a
 *                     lens lists them: rect, square, oval, round (a circle), diamond, hexagon, triangle,
 *                     heart; inside says whether a point of the W × H frame is in the shape. 'circle'
 *                     is taken for 'round'
 *
 * Differences from word_cloud: a word that does not fit shrinks to the largest size at which a place
 * is free (found by halving rather than one step at a time), trying both orientations at each size;
 * with the fixed sizes (sqrt, log, linear) a word that does not fit at the smallest size is listed in
 * dropped and the next is tried, where word_cloud stops; a free place is chosen evenly among all of
 * them (word_cloud's randint(0, hits) sometimes chooses none and shrinks the word for nothing); the
 * random numbers are mulberry32's, so a seed gives the same cloud here every time but not word_cloud's.
 * Part of bench-kit (github.com/critical-code-studies/bench-kit).
 */
(function (root) {
  'use strict';
  var C = {};
  var FONT = 'Georgia, "Times New Roman", serif', ctx = null;
  C.FONTS = {
    serif: ['Georgia', FONT],
    old: ['Old style', '"Iowan Old Style", "Palatino Linotype", Palatino, "Book Antiqua", serif'],
    sans: ['Sans serif', '"Helvetica Neue", Helvetica, Arial, sans-serif'],
    mono: ['Typewriter', '"American Typewriter", "Courier New", Courier, monospace']
  };
  // each shape centred in the frame; (u, v) a point's place from the middle, -1 to 1 across the frame
  function uv(x, y, W, H) { return [(x + 0.5 - W / 2) / (W / 2), (y + 0.5 - H / 2) / (H / 2)]; }
  function sq(x, y, W, H) { var s = Math.min(W, H); return [(x + 0.5 - W / 2) / (s / 2), (y + 0.5 - H / 2) / (s / 2)]; }   // in the square of the shorter side
  C.SHAPES = {
    rect: ['Rectangle', function () { return true; }],
    square: ['Square', function (x, y, W, H) { var p = sq(x, y, W, H); return Math.abs(p[0]) <= 1 && Math.abs(p[1]) <= 1; }],
    oval: ['Oval', function (x, y, W, H) { var p = uv(x, y, W, H); return p[0] * p[0] + p[1] * p[1] <= 1; }],
    round: ['Circle', function (x, y, W, H) { var p = sq(x, y, W, H); return p[0] * p[0] + p[1] * p[1] <= 1; }],
    diamond: ['Diamond', function (x, y, W, H) { var p = uv(x, y, W, H); return Math.abs(p[0]) + Math.abs(p[1]) <= 1; }],
    hexagon: ['Hexagon', function (x, y, W, H) { var p = uv(x, y, W, H); return Math.abs(p[1]) <= 1 && Math.abs(p[0]) <= 1 - Math.abs(p[1]) / 2; }],
    triangle: ['Triangle', function (x, y, W, H) { var p = uv(x, y, W, H); return Math.abs(p[0]) <= (p[1] + 1) / 2; }],
    // the heart curve (x² + y² − 1)³ ≤ x²y³, drawn in the square of the shorter side, point down
    heart: ['Heart', function (x, y, W, H) { var p = sq(x, y, W, H), a = p[0] * 1.18, b = -p[1] * 1.16 + 0.12, t = a * a + b * b - 1; return t * t * t <= a * a * b * b * b; }]
  };
  C.SHAPES.circle = C.SHAPES.round;
  Object.defineProperty(C.SHAPES, 'circle', { enumerable: false });
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function rng(seed) {
    var a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  C.rng = rng;
  function canvas() {
    if (!ctx && typeof document !== 'undefined') ctx = document.createElement('canvas').getContext('2d', { willReadFrequently: true });
    return ctx;
  }
  function fontOf(size, font, weight) { return (weight || 'normal') + ' ' + size + 'px ' + (font || FONT); }

  C.metrics = function (w, size, font, weight) {
    var g = canvas();
    if (g) {
      g.font = fontOf(size, font, weight);
      var m = g.measureText(w);
      if (m.actualBoundingBoxAscent != null) {
        var L = m.actualBoundingBoxLeft, A = m.actualBoundingBoxAscent;
        return { w: Math.max(1, Math.ceil(L + m.actualBoundingBoxRight)), h: Math.max(1, Math.ceil(A + m.actualBoundingBoxDescent)), left: L, ascent: A };
      }
      return { w: Math.ceil(m.width), h: Math.ceil(size * 1.0), left: 0, ascent: size * 0.78 };
    }
    return { w: Math.ceil(w.length * size * 0.52), h: Math.ceil(size * 0.95), left: 0, ascent: size * 0.75 };
  };
  C.measure = function (w, size, font, weight) { return C.metrics(w, size, font, weight).w; };

  // the letters' own pixels in a word's ink box (1 where there is ink), or the whole box
  function glyphs(w, m, size, font, weight, box) {
    var px = new Uint8Array(m.w * m.h), g = !box && canvas();
    if (!g) { px.fill(1); return px; }
    var cv = g.canvas;
    if (cv.width < m.w || cv.height < m.h) { cv.width = Math.max(cv.width, m.w); cv.height = Math.max(cv.height, m.h); }
    g.clearRect(0, 0, m.w, m.h);
    g.font = fontOf(size, font, weight); g.fillStyle = '#000'; g.textBaseline = 'alphabetic'; g.textAlign = 'left';
    g.fillText(w, m.left, m.ascent);
    var d = g.getImageData(0, 0, m.w, m.h).data;
    for (var i = 0; i < px.length; i++) px[i] = d[i * 4 + 3] ? 1 : 0;
    return px;
  }
  // turned a quarter to the left, as SVG's rotate(-90): (col u, row v) goes to (col v, row w - 1 - u)
  function upright(px, w, h) {
    var out = new Uint8Array(w * h);
    for (var v = 0; v < h; v++) for (var u = 0; u < w; u++) out[(w - 1 - u) * h + v] = px[v * w + u];
    return out;
  }

  // word_cloud's IntegralOccupancyMap: the ink so far, and its integral image S, where S[r][c] is the
  // ink in the rows above r and the columns left of c, so any box's ink is four look-ups
  function Occupancy(W, H, blocked) {
    this.W = W; this.H = H;
    this.ink = new Uint8Array(W * H);
    this.S = new Int32Array((W + 1) * (H + 1));
    if (blocked) { for (var y = 0; y < H; y++) for (var x = 0; x < W; x++) if (blocked(x, y)) this.ink[y * W + x] = 1; }
    this.update(0, 0);
  }
  // the integral image again from (x0, y0) right and down: nothing above or to the left has changed
  Occupancy.prototype.update = function (x0, y0) {
    var W = this.W, H = this.H, S = this.S, ink = this.ink, W1 = W + 1;
    for (var r = y0 + 1; r <= H; r++) {
      var row = r * W1, up = row - W1, src = (r - 1) * W - 1;
      for (var c = x0 + 1; c <= W; c++) S[row + c] = ink[src + c] + S[up + c] + S[row + c - 1] - S[up + c - 1];
    }
  };
  Occupancy.prototype.free = function (x, y, bw, bh) {
    var S = this.S, W1 = this.W + 1, a = y * W1 + x, b = (y + bh) * W1 + x;
    return S[b + bw] - S[a + bw] - S[b] + S[a] === 0;
  };
  // every free place for a bw × bh box: how many there are, or the k-th of them (k from 0)
  Occupancy.prototype.scan = function (bw, bh, k) {
    var n = 0, X = this.W - bw, Y = this.H - bh;
    for (var y = 0; y <= Y; y++) for (var x = 0; x <= X; x++) {
      if (this.free(x, y, bw, bh)) { if (n === k) return { x: x, y: y }; n++; }
    }
    return k == null ? n : null;
  };
  Occupancy.prototype.any = function (bw, bh) {
    var X = this.W - bw, Y = this.H - bh;
    for (var y = 0; y <= Y; y++) for (var x = 0; x <= X; x++) if (this.free(x, y, bw, bh)) return true;
    return false;
  };
  // the free place nearest the middle along an Archimedean spiral (r = 0.8θ), squashed to the frame
  Occupancy.prototype.spiral = function (bw, bh, th) {
    var W = this.W, H = this.H, ax = Math.max(1, (W / H) * 0.9);
    for (var a = 0, r = 0; r < Math.max(W, H); a += Math.min(0.5, 2 / Math.max(r, 1)), r = 0.8 * a) {
      var x = Math.round(W / 2 + r * Math.cos(th + a) * ax - bw / 2), y = Math.round(H / 2 + r * Math.sin(th + a) - bh / 2);
      if (x >= 0 && y >= 0 && x + bw <= W && y + bh <= H && this.free(x, y, bw, bh)) return { x: x, y: y };
    }
    return null;
  };
  Occupancy.prototype.put = function (px, x, y, w, h) {
    var W = this.W, ink = this.ink;
    for (var v = 0; v < h; v++) for (var u = 0; u < w; u++) if (px[v * w + u]) ink[(y + v) * W + x + u] = 1;
    this.update(x, y);
  };

  C.cloud = function (items, o) {
    o = o || {};
    var W = Math.round(o.width || 760), H = Math.round(o.height || 420), lo = o.min || 11, hi = o.max || 60;
    var font = o.font || FONT, weight = o.weight || 'normal', contrast = o.contrast || 'sqrt';
    var shape = C.SHAPES[o.shape] ? o.shape : 'rect', within = C.SHAPES[shape][1];
    var margin = o.margin != null ? o.margin : o.pad != null ? o.pad : 2, step = o.fontStep || 1;
    var rs = o.relativeScaling != null ? o.relativeScaling : 0.5, box = o.ink === 'box';
    var metrics = o.measure ? function (w, s) { return { w: Math.ceil(o.measure(w, s, font, weight)), h: Math.ceil(s * 0.95), left: 0, ascent: s * 0.75 }; }
      : function (w, s) { return C.metrics(w, s, font, weight); };
    // a smaller shape, smaller words: sizes scaled by the square root of its share of the frame (counted on a grid)
    var fit = 1;
    if (shape !== 'rect') { for (var gi = 0, gn = 0, gx = 0; gx < 60; gx++) for (var gy = 0; gy < 60; gy++, gn++) if (within(gx * W / 60, gy * H / 60, W, H)) gi++; fit = Math.sqrt(gi / gn); }
    lo *= Math.max(fit, 0.8); hi *= fit;
    var maxN = o.scale || items.reduce(function (m, x) { return Math.max(m, x.n); }, 1);
    function size(n) {
      if (!(n > 0)) return 0;
      var f = contrast === 'linear' || contrast === 'relative' ? n / maxN : contrast === 'log' ? Math.log(1 + n) / Math.log(1 + maxN) : Math.sqrt(n / maxN);
      return lo + (hi - lo) * Math.min(1, f);
    }
    function label(w) { return o.caps ? w.toUpperCase() : w; }
    function outside(x, y) {
      if (shape === 'rect') return false;
      return !within(x, y, W, H);
    }
    var places = o.places || {}, dropped = [], drawn = [];

    if (!o.places) {
      var rand = rng(o.seed == null ? 11 : o.seed), mask = o.mask;
      var occ = new Occupancy(W, H, shape !== 'rect' || mask ? function (x, y) { return outside(x, y) || (mask && mask(x, y)); } : null);
      var sorted = items.filter(function (it) { return it.n > 0; }).sort(function (a, b) { return b.n - a.n || (a.w < b.w ? -1 : a.w > b.w ? 1 : 0); });
      var last = null, fs = hi, stopped = false;
      sorted.forEach(function (it) {
        if (stopped) { dropped.push(it.w); return; }
        // word_cloud: each size from the last word's, by the ratio of their counts
        var s = contrast === 'relative' ? (last ? Math.round((rs * it.n / last.n + (1 - rs)) * fs) : fs) : size(it.n);
        var up = rand() < (o.upright || 0), both = o.upright > 0 && o.upright < 1, th = rand() * Math.PI * 2;
        var word = label(it.w), mm = {};
        function dims(sz, u) {
          var m = mm[sz] || (mm[sz] = metrics(word, sz));
          return u ? { bw: m.h + margin, bh: m.w + margin, m: m } : { bw: m.w + margin, bh: m.h + margin, m: m };
        }
        // the orientation that fits at a size: this word's own first, then the other (if words may be either)
        function fits(sz) {
          var d = dims(sz, up); if (occ.any(d.bw, d.bh)) return up;
          if (both) { d = dims(sz, !up); if (occ.any(d.bw, d.bh)) return !up; }
          return null;
        }
        var u = s >= lo ? fits(s) : null;
        if (u === null && s - step >= lo) {
          // the largest size on the steps down to the smallest at which it fits: free places only grow as a box shrinks
          var a = 1, b = Math.floor((s - lo) / step), got = null;
          while (a <= b) { var mid = (a + b) >> 1, f = fits(s - mid * step); if (f !== null) { got = [mid, f]; b = mid - 1; } else a = mid + 1; }
          if (got) { s = s - got[0] * step; u = got[1]; }
        }
        if (u === null) { dropped.push(it.w); if (contrast === 'relative') stopped = true; return; }
        var d = dims(s, u), at;
        if (o.layout === 'spiral') at = occ.spiral(d.bw, d.bh, th);
        if (!at) at = occ.scan(d.bw, d.bh, Math.floor(rand() * occ.scan(d.bw, d.bh)));
        var m = d.m, px = glyphs(word, m, s, font, weight, box || !!o.measure);
        if (u) px = upright(px, m.w, m.h);
        var iw = u ? m.h : m.w, ih = u ? m.w : m.h, x0 = at.x + (margin >> 1), y0 = at.y + (margin >> 1);
        occ.put(px, x0, y0, iw, ih);
        places[it.w] = { x: x0 + iw / 2, y: y0 + ih / 2, w: iw, h: ih, size: s, up: u, n: it.n, ox: m.left - m.w / 2, oy: m.ascent - m.h / 2 };
        last = it; fs = s;
      });
    }

    var by = Object.create(null); items.forEach(function (it) { by[it.w] = it; });
    function n2(v) { return (Math.round(v * 10) / 10).toString(); }
    // the baseline at its place, scaled to the size drawn; a layout from before ox and oy were kept is centred
    function at(P, s) {
      var cx = n2(P.x), cy = n2(P.y), k = s / P.size, rot = P.up ? ' transform="rotate(-90 ' + cx + ' ' + cy + ')"' : '';
      if (P.ox == null) return 'x="' + cx + '" y="' + cy + '" text-anchor="middle" dominant-baseline="central"' + rot;
      return 'x="' + n2(P.x + k * P.ox) + '" y="' + n2(P.y + k * P.oy) + '"' + rot;
    }
    function rel(P, n) {
      if (contrast !== 'relative') return size(n);
      return P.n ? P.size * Math.min(1, rs * n / P.n + (1 - rs)) : P.size;
    }
    var out = [];
    Object.keys(places).forEach(function (w) {
      var P = places[w], it = by[w], s = it && it.n > 0 ? Math.min(P.size, rel(P, it.n)) : 0;
      if (!s) {
        if (o.faint) out.push('<text ' + at(P, P.size * 0.45) + ' font-size="' + n2(P.size * 0.45) + '" fill="var(--line)" data-w="' + esc(w) + '">' + esc(label(w)) + '</text>');
        return;
      }
      drawn.push(w);
      var a = it.alpha != null && it.alpha < 1 ? ' fill-opacity="' + it.alpha.toFixed(2) + '"' : '';
      out.push('<text ' + at(P, s) + ' font-size="' + n2(s) + '" fill="' + (it.fill || 'var(--text)') + '"' + a + ' data-w="' + esc(w) + '"><title>' + esc(it.title || w + ': ' + it.n) + '</title>' + esc(label(w)) + '</text>');
    });
    var svg = '<svg xmlns="http://www.w3.org/2000/svg" class="wc-cloud" viewBox="0 0 ' + W + ' ' + H + '" width="' + W + '" height="' + H + '" font-family="' + esc(font) + '"' +
      (weight !== 'normal' ? ' font-weight="' + weight + '"' : '') + '>' + out.join('') + '</svg>';
    return { svg: svg, places: places, dropped: dropped, drawn: drawn };
  };

  // ---------- looks: formats that go together, and the control that chooses them ----------
  // A format F is { look, colour, hue, font, bold, caps, upright, shape, pad, contrast }. A look
  // sets all of them but look and hue; a detail set besides is kept beside the look (look: 'oval',
  // upright: 0.5), so a link or a saved setting holds the look and only what was changed from it.
  // A bench adds looks of its own and names the one a cloud starts with in SW.BENCH.wordcloud
  // ({ looks: { id: [name, format] }, look: id }); its looks come first in the menu.
  C.PALETTE = ['var(--amber)', 'var(--beam)', 'var(--red)', 'var(--green)', 'var(--violet)'];
  C.COLOURS = [['many', 'many colours'], ['ink', 'ink'], ['one', 'one colour'], ['shade', 'one colour, shaded by count'], ['size', 'by size']];
  C.HUES = [['var(--amber)', 'Accent'], ['var(--beam)', 'Beam'], ['var(--violet)', 'Violet'], ['var(--green)', 'Green'], ['var(--red)', 'Red'], ['var(--text)', 'Ink']];
  C.LOOKS = {
    oval: ['Oval', { colour: 'many', font: 'serif', bold: false, caps: false, upright: 0.5, shape: 'oval', pad: 4, contrast: 'sqrt' }],
    classic: ['Classic', { colour: 'many', font: 'serif', bold: false, caps: false, upright: 0.1, shape: 'rect', pad: 4, contrast: 'sqrt' }],
    ink: ['Ink on paper', { colour: 'ink', font: 'old', bold: false, caps: false, upright: 0, shape: 'rect', pad: 4, contrast: 'sqrt' }],
    poster: ['Poster', { colour: 'size', font: 'sans', bold: true, caps: true, upright: 0.5, shape: 'rect', pad: 2, contrast: 'linear' }],
    typewriter: ['Typewriter', { colour: 'shade', font: 'mono', bold: false, caps: false, upright: 0, shape: 'square', pad: 4, contrast: 'sqrt' }],
    heart: ['Heart', { colour: 'one', font: 'serif', bold: false, caps: false, upright: 0.1, shape: 'heart', pad: 2, contrast: 'sqrt' }]
  };
  C.DEFAULT = 'oval';
  var WB = (root.SW && root.SW.BENCH && root.SW.BENCH.wordcloud) || {};
  if (WB.looks) {
    var mine = {}, k0;
    for (k0 in WB.looks) mine[k0] = WB.looks[k0];
    for (k0 in C.LOOKS) if (!mine[k0]) mine[k0] = C.LOOKS[k0];
    C.LOOKS = mine;
  }
  if (WB.look && C.LOOKS[WB.look]) C.DEFAULT = WB.look;
  var KEYS = ['colour', 'font', 'bold', 'caps', 'upright', 'shape', 'pad', 'contrast'], NUM = { upright: 1, pad: 1 };
  function lookOf(F) { return C.LOOKS[F.look] ? F.look : C.DEFAULT; }
  // a whole format: its look's (the default look where it names none it knows), with any detail it sets
  // itself kept (a format from before looks, or with look: 'own', is all details)
  C.format = function (F) {
    F = F || {};
    var look = lookOf(F), base = C.LOOKS[look][1], out = { look: look, hue: F.hue || 'var(--amber)' };
    KEYS.forEach(function (k) { var v = F[k] != null && F[k] !== '' ? F[k] : base[k]; out[k] = NUM[k] ? +v : k === 'bold' || k === 'caps' ? v === true || v === 'true' || v === '1' || v === 1 : v; });
    return out;
  };
  // a format as short as it can be said: its look, and only the details that differ from the look's
  C.brief = function (F) {
    var W = C.format(F), base = C.LOOKS[W.look][1], out = { look: W.look };
    KEYS.forEach(function (k) { if (String(W[k]) !== String(base[k])) out[k] = W[k]; });
    if (W.hue !== 'var(--amber)') out.hue = W.hue;
    return out;
  };
  function hash(w) { for (var h = 0, i = 0; i < w.length; i++) h = (h * 31 + w.charCodeAt(i)) | 0; return Math.abs(h); }
  // the cloud's options from a format
  C.options = function (F) {
    F = C.format(F);
    return { font: (C.FONTS[F.font] || C.FONTS.serif)[1], weight: F.bold ? 'bold' : 'normal', caps: !!F.caps, upright: +F.upright, shape: F.shape, pad: +F.pad, contrast: F.contrast };
  };
  // items coloured by a format: each word's fill (and alpha for shade); a colour the bench names
  // itself (o.colour(item, rank)) wins where it gives one
  C.colour = function (items, F, o) {
    F = C.format(F); o = o || {};
    var n = items.length, max = items.reduce(function (m, x) { return Math.max(m, x.n); }, 1);
    var ranked = items.slice().sort(function (a, b) { return b.n - a.n; }), rank = Object.create(null);
    ranked.forEach(function (x, i) { rank[x.w] = i; });
    return items.map(function (x) {
      var y = {}; for (var k in x) y[k] = x[k];
      var own = o.colour ? o.colour(x, rank[x.w]) : null;
      if (own) { y.fill = own; return y; }
      var r = rank[x.w];
      y.fill = F.colour === 'ink' ? 'var(--text)' : F.colour === 'one' || F.colour === 'shade' ? F.hue :
        F.colour === 'size' ? (r < n * 0.1 ? 'var(--amber)' : r < n * 0.35 ? 'var(--beam)' : 'var(--text-dim)') : C.PALETTE[hash(x.w) % C.PALETTE.length];
      if (F.colour === 'shade') y.alpha = 0.3 + 0.7 * Math.sqrt(x.n / max);
      return y;
    });
  };
  // ---------- a view kept, shared and put back ----------
  // A view is the format and whatever else the bench lets the reader set (which text, how many
  // words…: the bench's own, as { key: value }). It is kept in the browser under a key the bench
  // names, written into a Share link as one string, and put back to the bench's default by
  // Default View.
  function store() { return root.SW && root.SW.store; }
  C.save = function (key, F, view) { var S = store(); if (S && key) S.set(key, { f: C.brief(F), v: view || null }); };
  C.load = function (key) { var S = store(), x = S && key ? S.get(key, null) : null; return x && x.f ? { format: C.format(x.f), view: x.v || null } : null; };
  // 'look:oval,upright:1,src:chapters,n:80': the format's brief and the view's own; read back with
  // the format's keys taken as the format (a link from before looks, all details, reads the same)
  C.encode = function (F, view) {
    var b = C.brief(F), parts = [], k;
    for (k in b) parts.push(k + ':' + b[k]);
    for (k in view || {}) if (view[k] != null) parts.push(k + ':' + (view[k] === true ? 1 : view[k] === false ? 0 : view[k]));
    return parts.join(',');
  };
  C.decode = function (s) {
    var f = {}, v = {}, own = { look: 1, hue: 1 };
    KEYS.forEach(function (k) { own[k] = 1; });
    String(s || '').split(',').forEach(function (kv) {
      var i = kv.indexOf(':'); if (i < 1) return;
      var k = kv.slice(0, i), x = kv.slice(i + 1);
      if (own[k]) f[k] = x; else v[k] = /^-?\d+(\.\d+)?$/.test(x) ? +x : x;
    });
    return { format: C.format(f), view: v };
  };

  // The control: a Look menu, ⚙ (a pop-over with the format's details) and Default View, in one
  // line of a lens's toolbar. o:
  //   value       the format to start with (a link's); else the one kept under key; else the default
  //   key         where the view is kept in the browser (SW.store), on every change
  //   view        the bench's own part of the view: { defaults, get(), set(v) }; Default View sets
  //               defaults, and get() is kept with the format
  //   change(F)   on every change of the format, and on Default View
  //   colours     the bench's own colourings, [[id, label]], listed first
  //   more        an element of the bench's own options, at the foot of the pop-over
  //   frame       the cloud's figure (frame()), set back to Fit by Default View
  // The element has value() (the format), refresh() (after the bench changes its own part: keeps the
  // view, and shows Default View only when the view is not the default) and share() (the view as one
  // string, for a link: decode() reads it).
  C.control = function (o) {
    o = o || {};
    var kept = o.value ? null : C.load(o.key);
    var F = C.format(o.value || (kept && kept.format)), wrap = document.createElement('span');
    wrap.className = 'wc-ctl';
    function opt(v, label, on) { return '<option value="' + esc(v) + '"' + (on ? ' selected' : '') + '>' + esc(label) + '</option>'; }
    function sel(k, list) { return '<select data-f="' + k + '">' + list.map(function (x) { return opt(x[0], x[1], String(F[k]) === String(x[0])); }).join('') + '</select>'; }
    function list(obj) { return Object.keys(obj).map(function (k) { return [k, obj[k][0]]; }); }
    function viewNow() { return o.view && o.view.get ? o.view.get() : null; }
    function same(a, b) { a = a || {}; b = b || {}; for (var k in b) if (String(a[k]) !== String(b[k])) return false; return true; }
    // whether the view is the bench's default (where the bench's part cannot be read yet, as the control
    // is built before the bench puts it in the page, it is taken to be)
    function isDefault() {
      if (JSON.stringify(C.brief(F)) !== JSON.stringify({ look: C.DEFAULT })) return false;
      try { return !o.view || same(viewNow(), o.view.defaults); } catch (e) { return true; }
    }
    function safeView() { try { return viewNow(); } catch (e) { return null; } }
    function draw() {
      var changed = KEYS.some(function (k) { return String(F[k]) !== String(C.LOOKS[F.look][1][k]); });
      wrap.innerHTML = '<label class="wc-look">' + sel('look', list(C.LOOKS).map(function (x) { return x[0] === F.look && changed ? [x[0], x[1] + ', changed'] : x; })) + '</label>' +
        '<details class="menu wc-more"><summary class="btn" title="Colour, font, shape, spacing and sizes">⚙</summary><div class="menu-body wc-grid">' +
        '<label>Colour</label>' + sel('colour', (o.colours || []).concat(C.COLOURS)) +
        '<label data-for="hue">Hue</label>' + sel('hue', C.HUES) +
        '<label>Font</label>' + sel('font', list(C.FONTS)) +
        '<label>Shape</label>' + sel('shape', list(C.SHAPES)) +
        '<label>Upright</label>' + sel('upright', [[0, 'none'], [0.1, 'a few'], [0.5, 'half'], [1, 'all']]) +
        '<label>Spacing</label>' + sel('pad', [[2, 'tight'], [4, 'normal'], [8, 'loose']]) +
        '<label>Sizes</label>' + sel('contrast', [['log', 'closer together'], ['sqrt', 'normal'], ['linear', 'further apart']]) +
        '<span></span><span class="wc-checks"><label><input type="checkbox" data-f="bold"' + (F.bold ? ' checked' : '') + '> bold</label> <label><input type="checkbox" data-f="caps"' + (F.caps ? ' checked' : '') + '> capitals</label></span>' +
        '<span class="wc-own"></span></div></details>' +
        '<button type="button" class="btn ghost wc-reset" title="The cloud as the bench first shows it">Default View</button>';
      var showHue = F.colour === 'one' || F.colour === 'shade';
      wrap.querySelector('[data-for="hue"]').hidden = wrap.querySelector('[data-f="hue"]').hidden = !showHue;
      if (o.more) { var own = wrap.querySelector('.wc-own'); own.parentNode.insertBefore(o.more, own); }
      wrap.querySelector('.wc-reset').hidden = isDefault();
    }
    function keep() { var v = safeView(); if (v || !o.view) C.save(o.key, F, v); }
    draw();
    var det = function () { return wrap.querySelector('.wc-more'); };
    function redraw() { var open = det().open; draw(); det().open = open; }
    wrap.addEventListener('change', function (e) {
      var k = e.target.dataset && e.target.dataset.f; if (!k) return;
      var v = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
      if (k === 'look') F = C.format({ look: v, hue: F.hue });
      else { F[k] = NUM[k] ? +v : v; F = C.format(F); }
      keep(); redraw();
      if (o.change) o.change(F);
    });
    wrap.addEventListener('click', function (e) {
      if (!e.target.closest('.wc-reset')) return;
      F = C.format();
      if (o.view && o.view.set) o.view.set(o.view.defaults);
      if (o.frame && o.frame.zoom) o.frame.zoom('fit');
      keep(); draw();
      if (o.change) o.change(F);
    });
    document.addEventListener('mousedown', function (e) { var d = det(); if (d && d.open && !wrap.contains(e.target)) d.open = false; });
    wrap.value = function () { return F; };
    wrap.refresh = function () { keep(); var b = wrap.querySelector('.wc-reset'); if (b) b.hidden = isDefault(); };
    wrap.share = function () { return C.encode(F, safeView()); };
    wrap.kept = kept;   // what was kept under key (its view for the bench to put back), or null
    return wrap;
  };

  // A cloud's figure: the SVG with − and + to zoom (Fit to fill its width), and the kit's SVG, PNG
  // and My notes buttons where the page has them. o: name (the file name, or a function giving it),
  // ref (the source, stamped in the corner of an export). The element has show(svg) and zoom(z):
  // z a scale (1 the cloud's own size) or 'fit'.
  C.frame = function (o) {
    o = o || {};
    var SW = root.SW, el = document.createElement('div'), z = 'fit', svg = '';
    el.className = 'wc-frame';
    el.innerHTML = '<div class="wc-zbar"><button type="button" class="btn ghost" data-z="-" title="Smaller">−</button><button type="button" class="btn ghost wc-zl" data-z="fit" title="Fit the width">Fit</button><button type="button" class="btn ghost" data-z="+" title="Larger">+</button><span class="wc-exp"></span></div><div class="wc-zoom"></div>';
    var box = el.querySelector('.wc-zoom'), zl = el.querySelector('.wc-zl');
    if (SW && SW.figureButtons) el.querySelector('.wc-exp').appendChild(SW.figureButtons(function () { return svg; }, o.name || 'word-cloud', o.ref));
    var STEPS = [0.5, 0.75, 1, 1.25, 1.5, 2, 3, 4];
    function natural() { var m = /\bwidth="([\d.]+)"/.exec(svg); return m ? +m[1] : 760; }
    function fitScale() { return box.clientWidth ? box.clientWidth / natural() : 1; }
    function apply() {
      var s = box.querySelector('svg'); if (!s) return;
      if (z === 'fit') { s.style.width = '100%'; s.style.maxWidth = 'none'; zl.textContent = 'Fit'; }
      else { s.style.width = Math.round(natural() * z) + 'px'; s.style.maxWidth = 'none'; zl.textContent = Math.round(z * 100) + '%'; }
    }
    el.addEventListener('click', function (e) {
      var b = e.target.closest('[data-z]'); if (!b) return;
      var cur = z === 'fit' ? fitScale() : z, d = b.dataset.z;
      if (d === 'fit') z = 'fit';
      else if (d === '+') z = STEPS.filter(function (x) { return x > cur + 0.01; })[0] || STEPS[STEPS.length - 1];
      else z = STEPS.filter(function (x) { return x < cur - 0.01; }).pop() || STEPS[0];
      apply();
    });
    el.show = function (s) { svg = s || ''; box.innerHTML = svg; apply(); };
    el.zoom = function (x) { if (x != null) { z = x; apply(); } return z; };
    return el;
  };

  if (root.SW) root.SW.wordcloud = C;
  if (typeof module !== 'undefined' && module.exports) module.exports = C;
})(typeof window !== 'undefined' ? window : globalThis);
