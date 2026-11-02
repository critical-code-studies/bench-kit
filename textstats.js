/*
 * textstats.js - methods of distant reading for a bench's texts, and the figures that show them, as
 * SW.textstats. Written in the Melville bench for its distant-reading lenses (after Underwood) and
 * lifted into the kit; nothing here knows any one bench. A bench's lenses call it; its styles are
 * in kit.css (.ts-chart, .ts-heat, .ts-step).
 *
 * The engine, which needs no page (node can load it):
 *   rng(seed)                     a seeded generator (mulberry32), for results that repeat
 *   STOP, stopSet(list)           English stopwords (SW.BENCH.textstats.stopwords replaces them)
 *   tokens(text, o)               the words of a text, lower-cased; o.keepCase, o.possessive (keep 's)
 *   counts(toks, stop), total(c), top(c, n), chunks(toks, size)
 *   g2(a, b, A, B)                Dunning's log-likelihood, signed: + where a/A exceeds b/B
 *   keyness(cA, cB, o)            every word's G² between two counts; o.min, o.stop
 *   rho(xs, ys)                   Mann-Whitney ρ: the chance that a value of xs exceeds one of ys
 *   distinctive(chA, chB, o)      ρ for each word over two sets of chunks
 *   delta(docs, o)                Burrows's Delta on the most frequent words; nearest(m, i)
 *   pca(rows, k)                  principal components of a matrix (docs × features)
 *   logistic(X, y, o)             L2-regularised logistic regression, with held-out probabilities (crossval)
 *   mattr(toks, w), heaps(toks, step), zipf(c), yuleK(c), hapax(c), sentences(text), fit(pts)
 *   collocates(toks, node, o)     the words within a window of a node word, by G² and PMI
 * The figures, in SVG coloured only by the theme's tokens (var(--text) …):
 *   lines(series, o), scatter(points, o), dispersion(rows, o), heat(rows, cols, M, o) (HTML)
 *   stepper(o)                    ◀ slider ▶ ▷, to step through a series of states
 *   figure(svg, caption)          an export block, the colours resolved (kit/themes.js)
 * Part of bench-kit (github.com/critical-code-studies/bench-kit).
 */
(function (root) {
  'use strict';
  var T = {};

  // ---------- numbers ----------
  T.rng = function (seed) {
    var a = (seed == null ? 1 : seed) >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      var t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };
  function sum(xs) { var s = 0; for (var i = 0; i < xs.length; i++) s += xs[i]; return s; }
  function mean(xs) { return xs.length ? sum(xs) / xs.length : 0; }
  function sd(xs) { var m = mean(xs), s = 0; for (var i = 0; i < xs.length; i++) s += (xs[i] - m) * (xs[i] - m); return xs.length > 1 ? Math.sqrt(s / (xs.length - 1)) : 0; }
  T.mean = mean; T.sd = sd;
  // least squares of y on x: { slope, intercept, r2 }
  T.fit = function (pts) {
    var n = pts.length, mx = 0, my = 0, i;
    for (i = 0; i < n; i++) { mx += pts[i][0]; my += pts[i][1]; }
    mx /= n; my /= n;
    var sxy = 0, sxx = 0, syy = 0;
    for (i = 0; i < n; i++) { var dx = pts[i][0] - mx, dy = pts[i][1] - my; sxy += dx * dy; sxx += dx * dx; syy += dy * dy; }
    var slope = sxx ? sxy / sxx : 0;
    return { slope: slope, intercept: my - slope * mx, r2: sxx && syy ? (sxy * sxy) / (sxx * syy) : 0 };
  };

  // ---------- words ----------
  T.STOP = ('a about above after again against all am an and any are as at be because been before being below between both but by ' +
    'can could did do does doing down during each few for from further had has have having he her here hers herself him himself his how ' +
    'i if in into is it its itself just me more most my myself no nor not now of off on once only or other our ours ourselves out over own ' +
    'same she should so some such than that the their theirs them themselves then there these they this those through to too under until ' +
    'up very was we were what when where which while who whom why will with would you your yours yourself yourselves ' +
    'upon unto thee thou thy thine ye hath doth shall may might must one ever also yet though thus nay aye o oh ' +
    'said say says like well even much many every whose whether either neither among within without towards toward').split(' ');
  T.stopSet = function (list) { var s = Object.create(null); (list || T.STOP).forEach(function (w) { s[w] = 1; }); return s; };
  var WORD = /[\p{L}]+(?:'[\p{L}]+)*/gu;
  T.tokens = function (text, o) {
    o = o || {};
    var t = String(text || '').replace(/[’‘ʼ]/g, "'");
    if (!o.keepCase) t = t.toLowerCase();
    var m = t.match(WORD) || [], out = [];
    for (var i = 0; i < m.length; i++) {
      var w = m[i];
      if (!o.possessive && /'s$/i.test(w)) w = w.slice(0, -2);
      out.push(w);
    }
    return out;
  };
  T.counts = function (toks, stop) {
    var c = Object.create(null);
    for (var i = 0; i < toks.length; i++) { var w = toks[i]; if (stop && stop[w]) continue; c[w] = (c[w] || 0) + 1; }
    return c;
  };
  T.total = function (c) { var n = 0; for (var w in c) n += c[w]; return n; };
  T.top = function (c, n) {
    return Object.keys(c).map(function (w) { return [w, c[w]]; })
      .sort(function (a, b) { return b[1] - a[1] || (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0); }).slice(0, n || Infinity);
  };
  T.chunks = function (toks, size) {
    var out = [];
    for (var i = 0; i < toks.length; i += size) out.push(toks.slice(i, i + size));
    // a short last chunk joins the one before
    if (out.length > 1 && out[out.length - 1].length < size / 2) { var l = out.pop(); out[out.length - 1] = out[out.length - 1].concat(l); }
    return out;
  };

  // ---------- what distinguishes two texts ----------
  function xlx(x, e) { return x > 0 ? x * Math.log(x / e) : 0; }
  T.g2 = function (a, b, A, B) {
    var e1 = A * (a + b) / (A + B), e2 = B * (a + b) / (A + B);
    var g = 2 * (xlx(a, e1) + xlx(b, e2));
    return a / A >= b / B ? g : -g;
  };
  // every word in either count: { w, a, b, g2 }, from most over-represented in A to most in B
  T.keyness = function (cA, cB, o) {
    o = o || {};
    var A = T.total(cA), B = T.total(cB), seen = Object.create(null), out = [];
    function add(w) {
      if (seen[w] || (o.stop && o.stop[w])) return;
      seen[w] = 1;
      var a = cA[w] || 0, b = cB[w] || 0;
      if (a + b < (o.min || 1)) return;
      out.push({ w: w, a: a, b: b, g2: T.g2(a, b, A, B) });
    }
    Object.keys(cA).forEach(add); Object.keys(cB).forEach(add);
    return out.sort(function (x, y) { return y.g2 - x.g2; });
  };
  // Mann-Whitney ρ = U / (n·m), by ranks with ties averaged
  T.rho = function (xs, ys) {
    var all = [], i;
    for (i = 0; i < xs.length; i++) all.push([xs[i], 0]);
    for (i = 0; i < ys.length; i++) all.push([ys[i], 1]);
    all.sort(function (a, b) { return a[0] - b[0]; });
    var rA = 0;
    for (i = 0; i < all.length;) {
      var j = i; while (j < all.length && all[j][0] === all[i][0]) j++;
      var r = (i + 1 + j) / 2;
      for (var k = i; k < j; k++) if (all[k][1] === 0) rA += r;
      i = j;
    }
    var n = xs.length, m = ys.length;
    return n && m ? (rA - n * (n + 1) / 2) / (n * m) : 0.5;
  };
  // each word's ρ over the chunks of A against those of B: near 1 where A's chunks use it more
  T.distinctive = function (chA, chB, o) {
    o = o || {};
    function prof(ch) { var c = T.counts(ch), n = ch.length || 1; return { c: c, n: n }; }
    var pA = chA.map(prof), pB = chB.map(prof), seen = Object.create(null), out = [];
    var tot = Object.create(null);
    pA.concat(pB).forEach(function (p) { for (var w in p.c) tot[w] = (tot[w] || 0) + p.c[w]; });
    for (var w in tot) {
      if (o.stop && o.stop[w]) continue;
      if (tot[w] < (o.min || 3) || seen[w]) continue;
      seen[w] = 1;
      var xs = pA.map(function (p) { return (p.c[w] || 0) / p.n; }), ys = pB.map(function (p) { return (p.c[w] || 0) / p.n; });
      out.push({ w: w, rho: T.rho(xs, ys), a: sum(pA.map(function (p) { return p.c[w] || 0; })), b: sum(pB.map(function (p) { return p.c[w] || 0; })) });
    }
    return out.sort(function (x, y) { return y.rho - x.rho || (y.a - y.b) - (x.a - x.b); });
  };

  // ---------- stylometry ----------
  // docs: arrays of words. o.n: the most frequent words (100), o.stop to leave some out.
  // { words, z: docs × words of z-scores, m: Delta between each pair }
  T.profile = function (docs, o) {
    o = o || {};
    var cs = docs.map(function (d) { return T.counts(d, o.stop); }), all = Object.create(null);
    cs.forEach(function (c) { for (var w in c) all[w] = (all[w] || 0) + c[w]; });
    var words = (o.words || T.top(all, o.n || 100).map(function (x) { return x[0]; }));
    var rel = cs.map(function (c, i) { var n = docs[i].length || 1; return words.map(function (w) { return (c[w] || 0) / n; }); });
    var z = rel.map(function () { return []; });
    words.forEach(function (w, j) {
      var col = rel.map(function (r) { return r[j]; }), m = mean(col), s = sd(col) || 1;
      rel.forEach(function (r, i) { z[i][j] = (r[j] - m) / s; });
    });
    return { words: words, rel: rel, z: z };
  };
  T.delta = function (docs, o) {
    var P = T.profile(docs, o), n = docs.length, m = [];
    for (var i = 0; i < n; i++) {
      m.push([]);
      for (var j = 0; j < n; j++) {
        var s = 0; for (var k = 0; k < P.words.length; k++) s += Math.abs(P.z[i][k] - P.z[j][k]);
        m[i].push(P.words.length ? s / P.words.length : 0);
      }
    }
    P.m = m;
    return P;
  };
  T.nearest = function (m, i) { var b = -1, bv = Infinity; for (var j = 0; j < m.length; j++) if (j !== i && m[i][j] < bv) { bv = m[i][j]; b = j; } return b; };
  // principal components of rows (docs × features), by power iteration on the centred Gram matrix:
  // { scores: docs × k, variance: [share of each], loadings: k × features }
  T.pca = function (rows, k) {
    k = k || 2;
    var n = rows.length, f = n ? rows[0].length : 0, X = [], i, j, c;
    var mu = []; for (j = 0; j < f; j++) { var s = 0; for (i = 0; i < n; i++) s += rows[i][j]; mu.push(s / n); }
    for (i = 0; i < n; i++) { X.push([]); for (j = 0; j < f; j++) X[i].push(rows[i][j] - mu[j]); }
    var G = [];
    for (i = 0; i < n; i++) { G.push([]); for (j = 0; j < n; j++) { var d = 0; for (c = 0; c < f; c++) d += X[i][c] * X[j][c]; G[i].push(d); } }
    var trace = 0; for (i = 0; i < n; i++) trace += G[i][i];
    var scores = rows.map(function () { return []; }), variance = [], loadings = [], rand = T.rng(7);
    for (var comp = 0; comp < k && comp < n; comp++) {
      var v = []; for (i = 0; i < n; i++) v.push(rand() - 0.5);
      var lam = 0;
      for (var it = 0; it < 300; it++) {
        var u = [];
        for (i = 0; i < n; i++) { var t = 0; for (j = 0; j < n; j++) t += G[i][j] * v[j]; u.push(t); }
        var norm = Math.sqrt(sum(u.map(function (x) { return x * x; }))) || 1;
        lam = norm; v = u.map(function (x) { return x / norm; });
      }
      // a sign that does not depend on the start: the largest score positive
      var big = 0; for (i = 1; i < n; i++) if (Math.abs(v[i]) > Math.abs(v[big])) big = i;
      if (v[big] < 0) v = v.map(function (x) { return -x; });
      var sq = Math.sqrt(lam);
      for (i = 0; i < n; i++) scores[i].push(v[i] * sq);
      var load = []; for (c = 0; c < f; c++) { var l = 0; for (i = 0; i < n; i++) l += X[i][c] * v[i]; load.push(sq ? l / sq : 0); }
      loadings.push(load);
      variance.push(trace ? lam / trace : 0);
      for (i = 0; i < n; i++) for (j = 0; j < n; j++) G[i][j] -= lam * v[i] * v[j];
    }
    return { scores: scores, variance: variance, loadings: loadings };
  };

  // ---------- a model of a difference: how well the words tell two sets of texts apart ----------
  // X: rows of features (z-scores), y: 0/1. o.c: the L2 penalty (1), o.iter (400), o.folds (5), o.seed.
  // { w, b, held: probability of each row from a model that did not see it, accuracy }
  function train(X, y, o) {
    var f = X[0].length, w = new Float64Array(f), b = 0, lr = o.lr || 0.1, lam = 1 / (o.c || 1), n = X.length;
    for (var it = 0; it < (o.iter || 400); it++) {
      var gw = new Float64Array(f), gb = 0;
      for (var i = 0; i < n; i++) {
        var s = b; for (var j = 0; j < f; j++) s += w[j] * X[i][j];
        var e = 1 / (1 + Math.exp(-s)) - y[i];
        gb += e; for (j = 0; j < f; j++) gw[j] += e * X[i][j];
      }
      for (j = 0; j < f; j++) w[j] -= lr * (gw[j] / n + lam * w[j] / n);
      b -= lr * gb / n;
    }
    return { w: Array.prototype.slice.call(w), b: b };
  }
  function prob(m, x) { var s = m.b; for (var j = 0; j < x.length; j++) s += m.w[j] * x[j]; return 1 / (1 + Math.exp(-s)); }
  T.logistic = function (X, y, o) {
    o = o || {};
    var n = X.length, folds = Math.min(o.folds || 5, n), rand = T.rng(o.seed == null ? 3 : o.seed);
    var order = X.map(function (_, i) { return i; });
    for (var i = n - 1; i > 0; i--) { var j = Math.floor(rand() * (i + 1)), t = order[i]; order[i] = order[j]; order[j] = t; }
    var fold = []; order.forEach(function (r, k) { fold[r] = k % folds; });
    var held = new Array(n);
    for (var f = 0; f < folds; f++) {
      var tx = [], ty = [];
      for (i = 0; i < n; i++) if (fold[i] !== f) { tx.push(X[i]); ty.push(y[i]); }
      if (!tx.length) continue;
      var m = train(tx, ty, o);
      for (i = 0; i < n; i++) if (fold[i] === f) held[i] = prob(m, X[i]);
    }
    var all = train(X, y, o), right = 0;
    for (i = 0; i < n; i++) if ((held[i] >= 0.5 ? 1 : 0) === y[i]) right++;
    return { w: all.w, b: all.b, held: held, accuracy: n ? right / n : 0 };
  };

  // ---------- statistical regularities ----------
  // moving-average type-token ratio (Covington and McFall): the mean TTR of every window of w words
  T.mattr = function (toks, w) {
    w = w || 500;
    if (toks.length < w) return toks.length ? Object.keys(T.counts(toks)).length / toks.length : 0;
    var c = Object.create(null), types = 0, s = 0, i;
    for (i = 0; i < w; i++) { if (!c[toks[i]]) types++; c[toks[i]] = (c[toks[i]] || 0) + 1; }
    s += types / w;
    for (i = w; i < toks.length; i++) {
      var out = toks[i - w]; if (!--c[out]) types--;
      if (!c[toks[i]]) types++; c[toks[i]] = (c[toks[i]] || 0) + 1;
      s += types / w;
    }
    return s / (toks.length - w + 1);
  };
  // the vocabulary's growth: [[tokens read, types seen]] every step tokens
  T.heaps = function (toks, step) {
    step = step || 500;
    var c = Object.create(null), v = 0, out = [];
    for (var i = 0; i < toks.length; i++) { if (!c[toks[i]]) { c[toks[i]] = 1; v++; } if ((i + 1) % step === 0 || i === toks.length - 1) out.push([i + 1, v]); }
    return out;
  };
  // rank against frequency: [[rank, count]]
  T.zipf = function (c) { return T.top(c).map(function (x, i) { return [i + 1, x[1]]; }); };
  // Yule's K: 10⁴ (Σ m² V_m − N) / N²
  T.yuleK = function (c) { var N = 0, M2 = 0; for (var w in c) { N += c[w]; M2 += c[w] * c[w]; } return N ? 1e4 * (M2 - N) / (N * N) : 0; };
  T.hapax = function (c) { var h = 0, d = 0; for (var w in c) { if (c[w] === 1) h++; else if (c[w] === 2) d++; } return { hapax: h, dis: d }; };
  // the length in words of each sentence: ended by . ! or ? (and any closing quotes) before a space or the end
  T.sentences = function (text) {
    return String(text || '').split(/[.!?]+["'”’)]*(?=\s|$)/).map(function (s) { return T.tokens(s).length; }).filter(function (n) { return n > 0; });
  };

  // ---------- collocation ----------
  // the words within o.window (5) of each occurrence of node: { w, n (in the windows), all (in the text), g2, pmi }
  T.collocates = function (toks, node, o) {
    o = o || {};
    var win = o.window || 5, isNode = typeof node === 'function' ? node : function (w) { return w === node; };
    var inWin = Object.create(null), N = toks.length, spanTok = 0, hits = 0, mark = new Uint8Array(N);
    for (var i = 0; i < N; i++) {
      if (!isNode(toks[i])) continue;
      hits++;
      for (var j = Math.max(0, i - win); j <= Math.min(N - 1, i + win); j++) if (j !== i && !isNode(toks[j]) && !mark[j]) mark[j] = 1;
    }
    for (i = 0; i < N; i++) if (mark[i]) { spanTok++; inWin[toks[i]] = (inWin[toks[i]] || 0) + 1; }
    var all = T.counts(toks), out = [];
    for (var w in inWin) {
      if (o.stop && o.stop[w]) continue;
      var a = inWin[w], b = all[w] - a;
      if (a < (o.min || 2)) continue;
      out.push({ w: w, n: a, all: all[w], g2: T.g2(a, b, spanTok, N - spanTok), pmi: Math.log(a * N / (all[w] * spanTok)) / Math.LN2 });
    }
    out.sort(function (x, y) { return y.g2 - x.g2; });
    return { hits: hits, span: spanTok, list: out };
  };

  // ---------- figures ----------
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function fmt(x) { return Math.abs(x) >= 1000 ? Math.round(x).toLocaleString('en-GB') : Math.abs(x) >= 10 ? x.toFixed(0) : Math.abs(x) >= 1 ? x.toFixed(1) : x.toFixed(3).replace(/0+$/, '').replace(/\.$/, ''); }
  T.fmt = fmt;
  // the frame of a chart: { svg (open), x(v), y(v), close() }
  function frame(o, xs, ys) {
    var W = o.width || 640, H = o.height || 300, L = 52, R = 14, Tp = 12, Bt = 38;
    function ext(vs, log) {
      var lo = Infinity, hi = -Infinity;
      vs.forEach(function (v) { if (log && v <= 0) return; lo = Math.min(lo, v); hi = Math.max(hi, v); });
      if (lo === Infinity) { lo = 0; hi = 1; }
      if (lo === hi) { hi = lo + 1; }
      return log ? [Math.log10(lo), Math.log10(hi)] : [Math.min(o.zero === false ? lo : 0, lo), hi];
    }
    var ex = o.xr || ext(xs, o.logx), ey = o.yr || ext(ys, o.logy);
    function X(v) { var t = o.logx ? Math.log10(v) : v; return L + (W - L - R) * (t - ex[0]) / (ex[1] - ex[0] || 1); }
    function Y(v) { var t = o.logy ? Math.log10(v) : v; return H - Bt - (H - Tp - Bt) * (t - ey[0]) / (ey[1] - ey[0] || 1); }
    function ticks(e, log, n) {
      var out = [];
      if (log) { for (var p = Math.ceil(e[0]); p <= Math.floor(e[1]); p++) out.push(Math.pow(10, p)); return out; }
      var step = Math.pow(10, Math.floor(Math.log10((e[1] - e[0]) / n))), span = (e[1] - e[0]) / step;
      if (span > n * 5) step *= 5; else if (span > n * 2) step *= 2;
      for (var v = Math.ceil(e[0] / step) * step; v <= e[1] + 1e-9; v += step) out.push(+v.toFixed(10));
      return out;
    }
    var s = '<svg xmlns="http://www.w3.org/2000/svg" class="ts-chart" viewBox="0 0 ' + W + ' ' + H + '" width="' + W + '" height="' + H + '" font-family="var(--sans, sans-serif)" font-size="11">';
    s += '<line x1="' + L + '" y1="' + (H - Bt) + '" x2="' + (W - R) + '" y2="' + (H - Bt) + '" stroke="var(--line)"/><line x1="' + L + '" y1="' + Tp + '" x2="' + L + '" y2="' + (H - Bt) + '" stroke="var(--line)"/>';
    ticks(ex, o.logx, 6).forEach(function (v) { var x = X(v); s += '<line x1="' + x.toFixed(1) + '" y1="' + (H - Bt) + '" x2="' + x.toFixed(1) + '" y2="' + (H - Bt + 4) + '" stroke="var(--line)"/><text x="' + x.toFixed(1) + '" y="' + (H - Bt + 15) + '" text-anchor="middle" fill="var(--text-dim)">' + (o.xtick ? esc(o.xtick(v)) : fmt(v)) + '</text>'; });
    ticks(ey, o.logy, 5).forEach(function (v) { var y = Y(v); s += '<line x1="' + L + '" y1="' + y.toFixed(1) + '" x2="' + (W - R) + '" y2="' + y.toFixed(1) + '" stroke="var(--line-soft, var(--line))" stroke-dasharray="2 3"/><text x="' + (L - 5) + '" y="' + (y + 3.5).toFixed(1) + '" text-anchor="end" fill="var(--text-dim)">' + fmt(v) + '</text>'; });
    if (o.xlabel) s += '<text x="' + ((L + W - R) / 2) + '" y="' + (H - 6) + '" text-anchor="middle" fill="var(--text-dim)">' + esc(o.xlabel) + '</text>';
    if (o.ylabel) s += '<text transform="translate(12 ' + ((Tp + H - Bt) / 2) + ') rotate(-90)" text-anchor="middle" fill="var(--text-dim)">' + esc(o.ylabel) + '</text>';
    return { s: s, X: X, Y: Y, W: W, H: H, L: L, R: R, Tp: Tp, Bt: Bt };
  }
  T.PALETTE = ['var(--amber)', 'var(--beam)', 'var(--red)', 'var(--green)', 'var(--violet)', 'var(--kin, var(--text-dim))', 'var(--text-dim)'];
  // series: [{ label, pts: [[x, y]], colour? }]. o: width, height, logx, logy, xlabel, ylabel, dots, xtick(v)
  T.lines = function (series, o) {
    o = o || {};
    var xs = [], ys = [];
    series.forEach(function (S) { S.pts.forEach(function (p) { xs.push(p[0]); ys.push(p[1]); }); });
    var F = frame(o, xs, ys), s = F.s;
    series.forEach(function (S, i) {
      var c = S.colour || T.PALETTE[i % T.PALETTE.length];
      var pts = S.pts.filter(function (p) { return (!o.logx || p[0] > 0) && (!o.logy || p[1] > 0); });
      s += '<polyline fill="none" stroke="' + c + '" stroke-width="1.6" points="' + pts.map(function (p) { return F.X(p[0]).toFixed(1) + ',' + F.Y(p[1]).toFixed(1); }).join(' ') + '"><title>' + esc(S.label || '') + '</title></polyline>';
      if (o.dots) pts.forEach(function (p) { s += '<circle cx="' + F.X(p[0]).toFixed(1) + '" cy="' + F.Y(p[1]).toFixed(1) + '" r="2.4" fill="' + c + '"><title>' + esc((S.label ? S.label + ': ' : '') + (o.xtick ? o.xtick(p[0]) : fmt(p[0])) + ', ' + fmt(p[1])) + '</title></circle>'; });
    });
    if (series.length > 1) {
      var lx = F.L + 8, ly = F.Tp + 10;
      series.forEach(function (S, i) {
        var c = S.colour || T.PALETTE[i % T.PALETTE.length];
        s += '<rect x="' + lx + '" y="' + (ly - 7) + '" width="10" height="3" fill="' + c + '"/><text x="' + (lx + 14) + '" y="' + ly + '" fill="var(--text)">' + esc(S.label) + '</text>';
        ly += 14;
      });
    }
    return s + '</svg>';
  };
  // points: [{ x, y, label, colour?, title? }]. o: width, height, xlabel, ylabel
  T.scatter = function (points, o) {
    o = o || {};
    var pad = function (vs) { var lo = Math.min.apply(null, vs), hi = Math.max.apply(null, vs), d = (hi - lo) * 0.08 || 1; return [lo - d, hi + d]; };
    var F = frame({ width: o.width || 640, height: o.height || 420, xr: pad(points.map(function (p) { return p.x; })), yr: pad(points.map(function (p) { return p.y; })), xlabel: o.xlabel, ylabel: o.ylabel },
      [], []), s = F.s;
    points.forEach(function (p) {
      var x = F.X(p.x), y = F.Y(p.y), c = p.colour || 'var(--amber)';
      s += '<g data-i="' + (p.i != null ? p.i : '') + '"><circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="4" fill="' + c + '" fill-opacity="0.8"/><text x="' + (x + 6).toFixed(1) + '" y="' + (y + 3.5).toFixed(1) + '" fill="var(--text)" font-size="10.5">' + esc(p.label) + '</text><title>' + esc(p.title || p.label) + '</title></g>';
    });
    return s + '</svg>';
  };
  // rows: [{ label, at: [positions from 0 to 1], colour? }]: where each occurs through the text. o: width, marks ([[pos, label]] along the foot)
  T.dispersion = function (rows, o) {
    o = o || {};
    var W = o.width || 720, L = 110, R = 10, rowH = 22, H = rows.length * rowH + 30, s = '<svg xmlns="http://www.w3.org/2000/svg" class="ts-chart" viewBox="0 0 ' + W + ' ' + H + '" width="' + W + '" height="' + H + '" font-family="var(--sans, sans-serif)" font-size="11">';
    function X(t) { return L + (W - L - R) * t; }
    (o.marks || []).forEach(function (m, i) {
      var x = X(m[0]);
      s += '<line x1="' + x.toFixed(1) + '" y1="4" x2="' + x.toFixed(1) + '" y2="' + (H - 22) + '" stroke="var(--line-soft, var(--line))"/>';
      if (m[1]) s += '<text x="' + (x + 2).toFixed(1) + '" y="' + (H - 8 - (i % 2) * 0) + '" fill="var(--text-faint, var(--text-dim))" font-size="9">' + esc(m[1]) + '</text>';
    });
    rows.forEach(function (r, i) {
      var y = 6 + i * rowH, c = r.colour || T.PALETTE[i % T.PALETTE.length];
      s += '<text x="' + (L - 8) + '" y="' + (y + 12) + '" text-anchor="end" fill="var(--text)">' + esc(r.label) + ' <tspan fill="var(--text-dim)">' + r.at.length + '</tspan></text>';
      s += '<line x1="' + L + '" y1="' + (y + 8) + '" x2="' + (W - R) + '" y2="' + (y + 8) + '" stroke="var(--line)" stroke-width="0.5"/>';
      r.at.forEach(function (t) { var x = X(t).toFixed(1); s += '<line x1="' + x + '" y1="' + y + '" x2="' + x + '" y2="' + (y + 16) + '" stroke="' + c + '" stroke-width="1.2"/>'; });
    });
    return s + '</svg>';
  };
  // an HTML table shaded by value: rows and cols are labels, M[i][j] a number. o.fmt(v), o.title(i, j, v), o.max
  T.heat = function (rows, cols, M, o) {
    o = o || {};
    var max = o.max || 0;
    if (!max) M.forEach(function (r) { r.forEach(function (v) { max = Math.max(max, Math.abs(v)); }); });
    var h = '<table class="ts-heat"><thead><tr><th></th>' + cols.map(function (c) { return '<th title="' + esc(c) + '">' + esc(c) + '</th>'; }).join('') + '</tr></thead><tbody>';
    M.forEach(function (r, i) {
      h += '<tr><th title="' + esc(rows[i]) + '">' + esc(rows[i]) + '</th>' + r.map(function (v, j) {
        var t = max ? Math.min(1, Math.abs(v) / max) : 0, col = v < 0 ? 'var(--red)' : 'var(--amber)';
        return '<td data-i="' + i + '" data-j="' + j + '" style="background:color-mix(in srgb, ' + col + ' ' + Math.round(t * 70) + '%, transparent)" title="' + esc(o.title ? o.title(i, j, v) : rows[i] + ', ' + cols[j] + ': ' + fmt(v)) + '">' + (o.fmt ? esc(o.fmt(v)) : '') + '</td>';
      }).join('') + '</tr>';
    });
    return h + '</tbody></table>';
  };
  // o: labels (one a state), value (the first shown), change(i), title. An element with ◀ slider ▶ ▷
  T.stepper = function (o) {
    var n = o.labels.length, i = Math.max(0, Math.min(n - 1, o.value || 0)), timer = null;
    var d = document.createElement('div'); d.className = 'ts-step';
    d.innerHTML = '<button type="button" class="btn" data-s="-1" title="The step before">◀</button><input type="range" min="0" max="' + (n - 1) + '" value="' + i + '" aria-label="' + esc(o.title || 'Step') + '"><button type="button" class="btn" data-s="1" title="The step after">▶</button><button type="button" class="btn" data-s="play" title="Step through every state">▷</button><span class="ts-step-l"></span>';
    var range = d.querySelector('input'), lab = d.querySelector('.ts-step-l'), play = d.querySelector('[data-s="play"]');
    function set(k, quiet) { i = Math.max(0, Math.min(n - 1, k)); range.value = i; lab.textContent = o.labels[i] + ' (' + (i + 1) + ' of ' + n + ')'; if (!quiet) o.change(i); }
    function stop() { if (timer) { clearInterval(timer); timer = null; play.textContent = '▷'; } }
    d.addEventListener('click', function (e) {
      var b = e.target.closest('[data-s]'); if (!b) return;
      if (b.dataset.s === 'play') {
        if (timer) { stop(); return; }
        if (i === n - 1) set(0);
        play.textContent = '❚❚';
        timer = setInterval(function () { if (i >= n - 1 || !d.isConnected) { stop(); return; } set(i + 1); }, o.interval || 900);
        return;
      }
      stop(); set(i + +b.dataset.s);
    });
    range.addEventListener('input', function () { stop(); set(+range.value); });
    set(i, true);
    d.set = set; d.value = function () { return i; };
    return d;
  };
  // an export block for a figure, its colours resolved for the export's background
  T.figure = function (svg, caption) {
    var S = root.SW, out = S && S.exportSVG ? S.exportSVG(svg) : svg;
    var m = /viewBox="0 0 ([\d.]+) ([\d.]+)"/.exec(svg);
    return { type: 'figure', svg: out, caption: caption || '', width: m ? +m[1] : null, height: m ? +m[2] : null };
  };

  if (root.SW) root.SW.textstats = T;
  if (typeof module !== 'undefined' && module.exports) module.exports = T;
})(typeof window !== 'undefined' ? window : globalThis);
