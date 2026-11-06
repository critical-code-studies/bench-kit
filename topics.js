/*
 * topics.js - topic models of a bench's texts, as SW.topics, and the Topics tab. The models are
 * mallette's (kit/mallette.js: MALLET's topic model in JavaScript, the same as MALLET for the same
 * documents and seed). A bench that sets SW.BENCH.topics and loads kit/mallette.js and this file
 * (after kit/lenses.js, before kit/shell.js) has the tab; the kit puts its button in the tab row
 * (after Book, or after the lens menus) and its section in the page where the bench has not, and
 * adds 'topics' to the shell's views. menusOff: ['topics'] leaves it out.
 *
 *   SW.BENCH.topics   {
 *     documents(o)    a promise of the bench's documents, [{ id, label, tokens, meta }]: o.set (one
 *                     of sets), o[set.param] (a stage, say), o.chunk (400). ids stay the same from
 *                     build to build; tokens lower-cased, stopwords still in; meta as the bench has it
 *                     (chapter, chapterLabel, seq…)
 *     sets            [{ id, label, param, choices() }]: the documents a reader may model ('reading',
 *                     'stage'…), and for one that takes a choice, its name and a promise of its
 *                     [[value, label]] (by default one set, 'text')
 *     models          [{ id, name, url, note }]: the models the bench publishes (tools/topics.js
 *                     writes them), each a model file at url; name and note are the bench's words
 *     stopwords       a list (by default the bench's textstats stopwords, else MALLET's English list)
 *     label           the tab's name ('Topics')
 *   }
 *
 * The engine (no page needed; tools/topics.js loads it in node):
 *   prepare(docs, s)      documents for the model: words shorter than s.minLength (3), stopwords, and
 *                         words occurring fewer than s.minCount (3) times in all the documents left out
 *   train(docs, s)        a model, straight through (node, or a small run): { result, model, diagnostics }
 *   file(run, docs, s)    the model file: { kind: 'bench-kit-topics', id, engine, created, settings,
 *                         documents, topics (words, alpha, tokens, diagnostics), theta, alpha, beta,
 *                         model (mallette's data, for inference), check }
 *   idOf(s, docs)         'M-' and six hex digits from the settings and the documents' ids
 *   match(a, b, o), check(runs, o)   how far topics recur across runs (seeds): the overlap of their
 *                         top words (Jaccard, 0.3 or more by default)
 * In the page:
 *   model(id)             a promise of a published model's file; summary(m) its settings as rows
 *   run(o, progress)      a model trained in a Web Worker from the bench's documents: { promise, cancel }
 *   own()                 a promise of the reader's own models (kept in this browser, IndexedDB);
 *                         keep(m), drop(id); use(id) / inUse() the model the tab's parts show
 *
 * The tab's parts, each numbered as the lenses are (the model in use read by 2 to 9):
 *   1  Models        the bench's published models and the reader's own: each one's settings; run a
 *                    new one, export, import, choose the one in use
 *   2  Topics        each topic's words, share, coherence and exclusivity
 *   3  Documents and topics   the mean share of each topic in each part of the text (heatmap)
 *   4  A topic through the text   its share of each document in reading order; its carriers
 *   5  A word's topics       6  A document's topics
 *   7  A selection's topics  a passage (🧩 Topics in Read and Book) inferred on the model
 *   8  Across the stages     each choice of a set inferred on the model; thin text marked
 *   9  Steadiness across seeds   the model's check
 * SW.BENCH.topics may also give open(doc) (a document's text in the bench; else its meta's v, from
 * and to) and tokens(text) (a passage's words as its documents have them).
 * Part of bench-kit (github.com/critical-code-studies/bench-kit).
 */
(function (root) {
  'use strict';
  var SW = root.SW, B = SW ? SW.BENCH : {}, C = B.topics;
  var T = (SW && SW.topics) || {};
  if (SW) SW.topics = T;
  function mallette() { return root.mallette || (typeof require === 'function' ? require('./mallette.js') : null); }

  // ---------- the engine ----------
  T.DEFAULTS = { k: 12, seed: 1, iterations: 1000, alphaSum: 5, beta: 0.01, optimizeInterval: 20, burnin: 200, minLength: 3, minCount: 3, chunk: 400, words: 30 };
  function settingsOf(s) { var o = {}, k; for (k in T.DEFAULTS) o[k] = T.DEFAULTS[k]; for (k in s || {}) if (s[k] != null) o[k] = s[k]; return o; }
  function letters(w) { return (String(w).match(/\p{L}/gu) || []).length; }
  T.prepare = function (docs, s) {
    s = settingsOf(s);
    var stop = new Set((s.stopwordList || mallette().STOPLIST).map(function (w) { return String(w).toLowerCase(); }));
    var keep = docs.map(function (d) { return (d.tokens || []).map(function (t) { return String(t).toLowerCase(); }).filter(function (t) { return letters(t) >= s.minLength && !stop.has(t); }); });
    var count = new Map();
    keep.forEach(function (ts) { ts.forEach(function (t) { count.set(t, (count.get(t) || 0) + 1); }); });
    return docs.map(function (d, i) { return { name: d.id, meta: d.meta, tokens: keep[i].filter(function (t) { return count.get(t) >= s.minCount; }) }; });
  };
  // a short hash (FNV-1a, 24 bits) of the settings that make the model and the documents' ids
  T.idOf = function (s, docs) {
    s = settingsOf(s);
    var keys = ['set', 'param', 'choice', 'k', 'seed', 'iterations', 'alphaSum', 'beta', 'optimizeInterval', 'burnin', 'minLength', 'minCount', 'stopwordsHash', 'chunk'];
    var text = keys.map(function (k) { return k + '=' + (s[k] == null ? '' : s[k]); }).join('&') + '|' + docs.map(function (d) { return d.id; }).join(',');
    var h = 0x811c9dc5;
    for (var i = 0; i < text.length; i++) { h ^= text.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
    return 'M-' + ('000000' + (h & 0xffffff).toString(16)).slice(-6);
  };
  T.hash = function (list) { var h = 0x811c9dc5, t = (list || []).join('\n'); for (var i = 0; i < t.length; i++) { h ^= t.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; } return ('00000000' + h.toString(16)).slice(-8); };
  // straight through, as in node (tools/topics.js) or for a small run
  T.train = function (docs, s) {
    s = settingsOf(s);
    var M = mallette(), model = new M.TopicModel(s.k, { seed: s.seed, iterations: s.iterations, alphaSum: s.alphaSum, beta: s.beta, optimizeInterval: s.optimizeInterval, burnin: s.burnin });
    model.addInstances(M.importDocs(T.prepare(docs, s), { stopwords: false }));
    model.estimate();
    return { result: model.result(s.words), model: model.toJSON(), diagnostics: model.diagnostics(20) };
  };
  function r5(x) { return Math.round(x * 1e5) / 1e5; }
  T.file = function (run, docs, s, extra) {
    s = settingsOf(s);
    var R = run.result, D = run.diagnostics, M = mallette();
    var keep = ['tokens', 'document_entropy', 'coherence', 'exclusivity', 'eff_num_words', 'corpus_dist', 'rank_1_docs'];
    var settings = {};
    ['set', 'param', 'choice', 'choiceLabel', 'k', 'seed', 'iterations', 'alphaSum', 'beta', 'optimizeInterval', 'burnin', 'minLength', 'minCount', 'stopwords', 'stopwordsHash', 'chunk', 'documents'].forEach(function (k) { if (s[k] != null) settings[k] = s[k]; });
    var f = {
      kind: 'bench-kit-topics', version: 1, id: T.idOf(s, docs), name: s.name || null,
      engine: 'mallette ' + (M && M.VERSION || ''), created: new Date().toISOString().slice(0, 10), settings: settings,
      documents: docs.map(function (d, i) { return { id: d.id, label: d.label, meta: d.meta, length: (R.docs[i] || {}).length }; }),
      topics: R.topics.map(function (t, k) {
        var sc = {}; keep.forEach(function (n) { var v = D && D.topics[k] ? D.topics[k].scores[n] : null; if (v != null) sc[n] = isFinite(v) ? Math.round(v * 1e4) / 1e4 : null; });
        return { k: k, alpha: r5(t.alpha), tokens: t.tokens, words: t.words, diagnostics: sc };
      }),
      theta: R.theta.map(function (row) { return row.map(r5); }),
      alpha: R.alpha.map(r5), alphaSum: R.alphaSum, beta: R.beta, logLikelihoodPerToken: Math.round(R.logLikelihoodPerToken * 1e4) / 1e4,
      model: run.model
    };
    for (var k in extra || {}) f[k] = extra[k];
    return f;
  };
  // how far the topics of one run recur in another: for each topic of a, the best overlap (Jaccard) of
  // its top n words with a topic of b
  function topWords(t, n) { return (t.words || t).slice(0, n).map(function (w) { return Array.isArray(w) ? w[0] : w; }); }
  T.match = function (a, b, o) {
    var n = (o && o.words) || 20;
    return a.map(function (ta) {
      var A = new Set(topWords(ta, n)), best = 0;
      b.forEach(function (tb) { var Bw = topWords(tb, n), inter = 0; Bw.forEach(function (w) { if (A.has(w)) inter++; }); var j = inter / (A.size + Bw.length - inter); if (j > best) best = j; });
      return best;
    });
  };
  // each topic's word probabilities, (count + beta) / (tokens + V·beta), over its own model's words
  T.phi = function (md) {
    var K = md.numTopics, V = md.words.length, mask = 1, bits = 0, b;
    if ((K & (K - 1)) === 0) mask = K - 1; else { while (mask < K) mask *= 2; mask -= 1; }
    b = mask; while (b) { bits += b & 1; b >>>= 1; }
    var vec = [], k, w;
    for (k = 0; k < K; k++) vec.push(new Float64Array(V).fill(md.beta / (md.tokensPerTopic[k] + V * md.beta)));
    for (w = 0; w < V; w++) md.typeTopicCounts[w].forEach(function (x) { if (x > 0) { var t = x & mask; vec[t][w] = ((x >> bits) + md.beta) / (md.tokensPerTopic[t] + V * md.beta); } });
    var norm = vec.map(function (v) { var s2 = 0; for (var i = 0; i < V; i++) s2 += v[i] * v[i]; return Math.sqrt(s2); });
    var index = new Map(); md.words.forEach(function (x, i) { index.set(x, i); });
    return { words: md.words, index: index, vec: vec, norm: norm };
  };
  // the cosine of every topic of a with every topic of b, over the union of their words (0 where a word
  // is not one model's)
  T.cosines = function (pa, pb) {
    var shared = []; pa.words.forEach(function (w, i) { var j = pb.index.get(w); if (j !== undefined) shared.push([i, j]); });
    return pa.vec.map(function (va, ka) { return pb.vec.map(function (vb, kb) { var d = 0; for (var n = 0; n < shared.length; n++) d += va[shared[n][0]] * vb[shared[n][1]]; return d / (pa.norm[ka] * pb.norm[kb]); }); });
  };
  function quantile(xs, q) { if (!xs.length) return null; var a = xs.slice().sort(function (x, y) { return x - y; }), i = (a.length - 1) * q, lo = Math.floor(i); return a[lo] + (a[Math.min(lo + 1, a.length - 1)] - a[lo]) * (i - lo); }
  function r3(x) { return x == null ? null : Math.round(x * 1000) / 1000; }
  // runs: [{ setting: { k, minCount }, seed, topics }]. For each setting, the share of its topics that
  // recur in its other seeds; the setting chosen (the most recurrence; the fewer topics on a tie) and
  // its seed (the one whose topics recur most; the lowest on a tie); for that run, each topic's count
  // of the other seeds that have it
  T.check = function (runs, o) {
    o = o || {};
    var th = o.threshold != null ? o.threshold : 0.3, n = o.words || 20, groups = [], byKey = {};
    runs.forEach(function (r) { var key = JSON.stringify(r.setting); if (!byKey[key]) { byKey[key] = { setting: r.setting, runs: [] }; groups.push(byKey[key]); } byKey[key].runs.push(r); });
    groups.forEach(function (g) {
      var hits = 0, all = 0;
      g.runs.forEach(function (r) {
        r.recur = r.topics.map(function () { return 0; });
        g.runs.forEach(function (q) { if (q === r) return; T.match(r.topics, q.topics, { words: n }).forEach(function (j, i) { all++; if (j >= th) { hits++; r.recur[i]++; } }); });
        r.score = r.recur.reduce(function (a, b) { return a + b; }, 0);
      });
      g.recurrence = all ? Math.round(1000 * hits / all) / 1000 : 0;
    });
    // the cosine of word probabilities, where the runs carry their models: topics that are each other's
    // best match across two seeds of a setting are taken to recur; the threshold is the lower quartile of
    // those pairs' cosines over every setting, and a topic recurs in another seed at it or above
    var cos = null;
    if (runs.every(function (r) { return r.model; })) {
      runs.forEach(function (r) { r.phi = T.phi(r.model); });
      var mutual = [];
      groups.forEach(function (g) {
        g.runs.forEach(function (r, i) { g.runs.forEach(function (q, j) {
          if (j <= i) return;
          var M = T.cosines(r.phi, q.phi);
          M.forEach(function (row, a) { var b = row.indexOf(Math.max.apply(null, row)), col = M.map(function (x) { return x[b]; }); if (col.indexOf(Math.max.apply(null, col)) === a) mutual.push(row[b]); });
        }); });
      });
      var cth = quantile(mutual, 0.25);
      groups.forEach(function (g) {
        var hits = 0, all = 0;
        g.runs.forEach(function (r) {
          r.recurCos = r.topics.map(function () { return 0; });
          g.runs.forEach(function (q) { if (q === r) return; T.cosines(r.phi, q.phi).forEach(function (row, a) { all++; if (Math.max.apply(null, row) >= cth) { hits++; r.recurCos[a]++; } }); });
          r.scoreCos = r.recurCos.reduce(function (a, b) { return a + b; }, 0);
        });
        g.recurrenceCos = all ? Math.round(1000 * hits / all) / 1000 : 0;
      });
      cos = { rule: 'cosine of the topics’ word probabilities over both models’ words (0 where a word is not one model’s); a topic recurs at the threshold or above', threshold: r3(cth),
        calibration: 'the lower quartile of the cosines of topics that are each other’s best match across two seeds of one setting (' + mutual.length + ' pairs; median ' + r3(quantile(mutual, 0.5)) + ', least ' + r3(quantile(mutual, 0)) + ')' };
    }
    var key = cos ? 'recurrenceCos' : 'recurrence', sk = cos ? 'scoreCos' : 'score', rk = cos ? 'recurCos' : 'recur';
    var best = groups.slice().sort(function (a, b) { return b[key] - a[key] || a.setting.k - b.setting.k; })[0];
    var seed = best ? best.runs.slice().sort(function (a, b) { return b[sk] - a[sk] || a.seed - b.seed; })[0] : null;
    return {
      rule: 'top ' + n + ' words, Jaccard ' + th + ' or more', threshold: th, words: n, measure: cos ? 'cosine' : 'jaccard', cosine: cos,
      settings: groups.map(function (g) { var x = { setting: g.setting, seeds: g.runs.map(function (r) { return r.seed; }), recurrence: g.recurrence }; if (cos) x.recurrenceCos = g.recurrenceCos; return x; }),
      chosen: best ? { setting: best.setting, seed: seed.seed, recurs: seed[rk], recursJaccard: seed.recur, others: best.runs.length - 1 } : null
    };
  };

  // the documents' fingerprint: their ids and token counts, in order (a change in how the bench cuts
  // or tokenises its texts changes it, at the same source)
  T.fingerprint = function (docs) { return T.hash(docs.map(function (d) { return d.id + ':' + (d.tokens || []).length; })); };
  // two models' topics matched both ways by the seed check's rule: each topic's best partner and its
  // overlap, the topics with none at or above the threshold, and for those of a, the documents that
  // carry most of each
  T.compare = function (a, b, o) {
    o = o || {};
    var n = o.words || 20, top = o.docs || 5, jth = 0.3;
    var cth = o.threshold != null ? o.threshold : (a.check && a.check.cosine ? a.check.cosine.threshold : null);
    var pa = T.phi(a.model), pb = T.phi(b.model), M = T.cosines(pa, pb), union = new Set(pa.words.concat(pb.words)).size;
    function jac(x, y) { var A = new Set(topWords(x, n)), Bw = topWords(y, n), inter = 0; Bw.forEach(function (w) { if (A.has(w)) inter++; }); return inter / (A.size + Bw.length - inter); }
    function side(x, y, rowOf) {
      return x.topics.map(function (t, k) {
        var row = rowOf(k), best = row.indexOf(Math.max.apply(null, row)), bj = 0, bjk = -1;
        y.topics.forEach(function (u, jj) { var v = jac(t, u); if (v > bj) { bj = v; bjk = jj; } });
        return { k: k, best: best, cosine: r3(row[best]), matched: cth != null ? row[best] >= cth : null, jaccard: Math.round(bj * 1000) / 1000, jaccardBest: bjk, words: topWords(t, 10) };
      }).sort(function (p, q) { return q.cosine - p.cosine; });
    }
    function carriers(m, k) { return m.documents.map(function (d, i) { return { id: d.id, meta: d.meta, p: m.theta[i][k] }; }).sort(function (x, y) { return y.p - x.p; }).slice(0, top); }
    var ab = side(a, b, function (k) { return M[k]; }), ba = side(b, a, function (k) { return M.map(function (r) { return r[k]; }); });
    ab.forEach(function (x) { if (x.matched === false) x.documents = carriers(a, x.k); });
    return {
      measure: 'cosine', rule: 'cosine of the topics’ word probabilities, (count + beta) / (tokens + V·beta) over each model’s own words, compared over the union of the two models’ words (' + union + '), 0 where a word is not one model’s',
      threshold: cth != null ? r3(cth) : null, thresholdFrom: o.threshold != null ? 'given' : cth != null ? 'this model’s seed check (' + (a.check.cosine.calibration || '') + ')' : 'none: no seed check with cosines',
      jaccard: { rule: 'top ' + n + ' words, Jaccard ' + jth + ' or more', threshold: jth }, vocabulary: { model: pa.words.length, other: pb.words.length, union: union },
      model: a.id, other: b.id, otherName: b.name || null,
      topics: ab, others: ba,
      unmatched: ab.filter(function (x) { return x.matched === false; }).map(function (x) { return { k: x.k, best: x.best, cosine: x.cosine, jaccard: x.jaccard, words: x.words, documents: x.documents }; }),
      unmatchedOthers: ba.filter(function (x) { return x.matched === false; }).map(function (x) { return { k: x.k, best: x.best, cosine: x.cosine, jaccard: x.jaccard, words: x.words }; })
    };
  };

  if (!SW) { if (typeof module !== 'undefined' && module.exports) module.exports = T; return; }
  var esc = SW.esc;

  // ---------- in the page ----------
  // a model file's settings, as rows to show
  T.summary = function (m) {
    var s = m.settings || {}, rows = [];
    function add(label, v) { if (v != null && v !== '') rows.push([label, String(v)]); }
    add('Id', m.id);
    add('Engine', m.engine);
    add('Made', m.created);
    add('Documents', s.choiceLabel || s.documents || s.set);
    add('Topics', s.k != null ? s.k : (m.topics || []).length || null);
    add('Documents modelled', (m.documents || []).length || null);
    add('Seed', s.seed);
    add('Iterations', s.iterations);
    add('Alpha (sum), beta', s.alphaSum != null || s.beta != null ? [s.alphaSum, s.beta].filter(function (x) { return x != null; }).join(', ') : null);
    add('Optimised every', s.optimizeInterval ? s.optimizeInterval + ' iterations, after ' + (s.burnin != null ? s.burnin : 200) : s.optimizeInterval === 0 ? 'not optimised' : null);
    add('Words left out', [s.stopwords ? 'stopwords: ' + s.stopwords : '', s.minLength ? 'shorter than ' + s.minLength + ' letters' : '', s.minCount ? 'fewer than ' + s.minCount + ' occurrences' : ''].filter(Boolean).join('; ') || null);
    if (m.source) add('Made from', [m.source.bench ? 'the bench at ' + m.source.bench : ''].concat((m.source.sources || []).map(function (x) { return x.name + ' at ' + String(x.commit || '').slice(0, 8); })).filter(Boolean).join('; '));
    if (m.compare) add('Compared with', (m.compare.otherName || m.compare.other) + ': ' + m.compare.unmatched.length + ' of its topics without a partner here, ' + m.compare.unmatchedOthers.length + ' of this model\'s without one there (' + m.compare.rule + ')');
    if (m.note) add('Note', m.note);
    if (m.check && m.check.chosen) add('Chosen from', m.check.settings.map(function (x) { return 'K ' + x.setting.k + (x.setting.minCount ? ', min ' + x.setting.minCount : '') + ' (' + Math.round(100 * (x.recurrenceCos != null ? x.recurrenceCos : x.recurrence)) + '% recur)'; }).join('; ') + ', over ' + (m.check.chosen.others + 1) + ' seeds each' + (m.check.cosine ? ' (cosine ' + m.check.cosine.threshold + ')' : ' (Jaccard ' + m.check.threshold + ')'));
    return rows;
  };
  var cache = {};
  T.model = function (id) {
    var M = ((C || {}).models || []).filter(function (x) { return x.id === id; })[0];
    if (!M) return T.own().then(function (list) { var m = list.filter(function (x) { return x.id === id; })[0]; if (!m) throw new Error('No model ' + id + ' in this bench.'); return m; });
    return cache[id] || (cache[id] = fetch(M.url, { cache: 'no-cache' }).then(function (r) {
      if (!r.ok) throw new Error('Its file, ' + M.url + ', could not be read (' + r.status + ').');
      return r.json();
    }).then(function (m) {
      if (!m || m.kind !== 'bench-kit-topics') throw new Error(M.url + ' is not a topic model file.');
      return m;
    }));
  };
  // where the documents come from now: the bench's version and its sources (SW.BENCH.topics.source())
  T.source = function () { try { return C && C.source ? C.source() : { bench: SW.VERSION }; } catch (e) { return { bench: SW.VERSION }; } };
  // a model's source against the bench's now: [] where they agree; else what differs, the sources
  // first (the lines may have moved), then the bench's version (noted only)
  T.drift = function (m) {
    var was = m.source, now = T.source(), out = [];
    if (!was) return out;
    var byName = {}; (now.sources || []).forEach(function (x) { byName[x.name] = x; });
    (was.sources || []).forEach(function (x) {
      var y = byName[x.name];
      if (!y) out.push({ kind: 'source', text: x.name + ' is no longer a source of the bench' });
      else if (y.commit !== x.commit || y.repo !== x.repo) out.push({ kind: 'source', text: x.name + ' was at ' + String(x.commit).slice(0, 8) + ', now at ' + String(y.commit).slice(0, 8) });
    });
    if (was.bench && now.bench && was.bench !== now.bench) out.push({ kind: 'bench', text: 'made with the bench at ' + was.bench + ', now ' + now.bench });
    return out;
  };
  T.sets = function () { return (C && C.sets) || [{ id: 'text', label: 'The text' }]; };
  function stopList() { var S = (B.textstats || {}).stopwords || (SW.textstats && SW.textstats.STOP); return S ? [].concat(Array.isArray(S) ? S : Object.keys(S)) : null; }
  // the settings for a run: the bench's stopwords, and what the documents are
  T.settings = function (o) {
    var s = settingsOf(o), list = (C && C.stopwords) || stopList();
    s.stopwordList = list || null;
    s.stopwords = list ? 'the bench\'s (' + list.length + ' words)' : 'MALLET\'s English list';
    s.stopwordsHash = T.hash(list || mallette().STOPLIST);
    return s;
  };
  // the bench's documents, for o.set (and its choice)
  T.documents = function (o) {
    if (!C || !C.documents) return Promise.reject(new Error('This bench gives no documents for topic models.'));
    var q = { set: o.set, chunk: o.chunk || T.DEFAULTS.chunk }; if (o.param) q[o.param] = o.choice;
    return Promise.resolve(C.documents(q));
  };
  T.run = function (o, progress) {
    var s = T.settings(o), job = null, stopped = false;
    var promise = T.documents(s).then(function (docs) {
      if (stopped) throw new Error('Stopped.');
      var prepared = T.prepare(docs, s), M = mallette();
      var url = (document.querySelector('script[src*="kit/mallette.js"]') || {}).src;
      job = M.trainInWorker(prepared.map(function (d) { return { name: d.name, tokens: d.tokens, meta: d.meta }; }), s.k,
        { seed: s.seed, iterations: s.iterations, alphaSum: s.alphaSum, beta: s.beta, optimizeInterval: s.optimizeInterval, burnin: s.burnin, stopwords: false, numWords: s.words, diagnostics: true,
          workerURL: url ? url.replace(/mallette\.js(\?.*)?$/, 'mallette-worker.js') : undefined, progress: progress });
      return job.promise.then(function (w) { return T.file(w, docs, s, { source: T.source(), fingerprint: T.fingerprint(docs) }); });
    });
    return { promise: promise, cancel: function () { stopped = true; if (job) job.cancel(); } };
  };

  // the reader's own models, in this browser
  function db() {
    return new Promise(function (res, rej) {
      var r = indexedDB.open((B.store || 'bk.') + 'topics', 1);
      r.onupgradeneeded = function () { r.result.createObjectStore('models', { keyPath: 'id' }); };
      r.onsuccess = function () { res(r.result); }; r.onerror = function () { rej(r.error); };
    });
  }
  function tx(mode, fn) { return db().then(function (d) { return new Promise(function (res, rej) { var t = d.transaction('models', mode), st = t.objectStore('models'), out = fn(st); t.oncomplete = function () { res(out && out.result !== undefined ? out.result : out); }; t.onerror = function () { rej(t.error); }; }); }); }
  T.own = function () { return root.indexedDB ? tx('readonly', function (st) { return st.getAll(); }).catch(function () { return []; }) : Promise.resolve([]); };
  T.keep = function (m) { return tx('readwrite', function (st) { st.put(m); }); };
  T.drop = function (id) { return tx('readwrite', function (st) { st.delete(id); }); };
  T.use = function (id) { SW.store.set('topics.model', id); };
  T.inUse = function () { var id = SW.store.get('topics.model', null), pub = ((C || {}).models || [])[0]; return id || (pub ? pub.id : null); };

  if (!C || (SW.menuOff && SW.menuOff('topics')) || !SW.views) return;

  // the tab, its section, and its place among the shell's views, where the bench has not given them
  var tabs = SW.$('#tabs');
  if (tabs && !SW.$('[data-tab="topics"]', tabs)) {
    var btn = SW.el('button', { 'data-tab': 'topics', title: 'Topic models of the texts: the topics, and where they fall' }, esc(C.label || 'Topics'));
    var after = SW.$('[data-tab="book"]', tabs) || SW.$$('[data-tabs~="analyse"]', tabs).pop();
    var before = after ? after.nextSibling : SW.$('[data-menu="versions"], [data-menu="help"]', tabs);
    tabs.insertBefore(btn, before || null);
  }
  var main = SW.$('section.view') && SW.$('section.view').parentNode;   // beside the bench's own views, whichever it has
  if (main && !SW.$('#view-topics')) main.appendChild(SW.el('section', { class: 'view', id: 'view-topics' }));
  SW.kitViews = (SW.kitViews || []).concat('topics');   // among the shell's views, whatever list the bench sets after this file

  // the parts of the tab: [number, name, what it shows]
  var PARTS = [[1, 'Models', 'The bench’s models and your own: run one, export it, choose the one in use'],
    [2, 'Topics', 'Each topic: its words, its share of the text, how coherent and how exclusive it is'],
    [3, 'Documents and topics', 'How much of each topic is in each part of the text'],
    [4, 'A topic through the text', 'A topic’s share of each document in reading order, and the passages that carry most of it'],
    [5, 'A word’s topics', 'Which topics a word is drawn into, and how far'],
    [6, 'A document’s topics', 'The topics one document is made of'],
    [7, 'A selection’s topics', 'The topics of a passage selected in Read or Book, or typed, by the model in use'],
    [8, 'Across the stages', 'The model’s topics in each of a set’s choices (a manuscript’s stages, say), inferred on the model'],
    [9, 'Steadiness across seeds', 'How far the model’s topics recurred when it was trained with other seeds']];
  var part = 1, focus = { topic: 0, word: '', doc: 0, text: '', across: null }, blocks = null;
  function go(n, f) { part = n; for (var k in f || {}) focus[k] = f[k]; draw(); }
  T.show = go;   // SW.topics.show(part, { topic, word, doc, text }): the tab at a part
  function draw() {
    var view = SW.$('#view-topics'); if (!view) return;
    view.innerHTML = '';
    blocks = null;
    var pad = SW.el('div', { class: 'pad', style: 'max-width:none' });
    var head = SW.el('div', { class: 'toolbar an-head', style: 'position:static;padding:0 0 10px' });
    var P = PARTS.filter(function (p) { return p[0] === part; })[0];
    head.innerHTML = '<b class="an-title">' + esc(C.label || 'Topics') + '</b> <select class="tp-part" aria-label="Part">' + PARTS.map(function (p) { return '<option value="' + p[0] + '"' + (p[0] === part ? ' selected' : '') + '>' + p[0] + '  ' + esc(p[1]) + '</option>'; }).join('') + '</select>' +
      '<span class="hint an-desc">' + esc(P[2]) + '.</span>' + (SW.guide ? ' <button class="btn ghost tp-help" title="Help ▸ Topic models">?</button>' : '');
    if (SW.guide) SW.$('.tp-help', head).addEventListener('click', T.help);
    SW.$('.tp-part', head).addEventListener('change', function (e) { go(+e.target.value); });
    var cards = SW.el('div', { class: 'cards' });
    pad.appendChild(head); pad.appendChild(cards); view.appendChild(pad);
    if (part === 1) { models(cards); return; }
    var id = T.inUse();
    if (!id) { cards.appendChild(SW.el('p', { class: 'hint wide' }, 'No model yet: run one in 1 Models, or the bench will publish one.')); return; }
    var w8 = SW.el('p', { class: 'hint wide' }, 'Reading the model…'); cards.appendChild(w8);
    T.model(id).then(function (m) {
      w8.remove();
      cards.appendChild(SW.el('p', { class: 'hint wide tp-using' }, 'The model in use: ' + esc(m.name || m.id) + ' (' + esc(m.id) + ', ' + (m.topics || []).length + ' topics). Choose another in 1 Models.'));
      ({ 2: topicsPart, 3: heatPart, 4: throughPart, 5: wordPart, 6: docPart, 7: selPart, 8: acrossPart, 9: steadyPart })[part](m, cards);
      if (blocks && SW.lenses && SW.exportButtons) {
        var b = blocks;
        head.appendChild(SW.lenses.expMenu(SW.exportButtons(function () { return { title: (B.title || 'Bench') + ': ' + P[1].toLowerCase(), subtitle: 'Topic model ' + (m.name || m.id) + ' (' + m.id + ')', meta: [['Model', m.id], ['Engine', m.engine || '']], blocks: b() }; }, slug(B.slug || 'bench') + '-topics-' + part)));
      }
    }, function (e) { w8.textContent = e.message; });
  }
  function table(m) { var t = SW.el('table', { class: 'tp-sum' }); t.innerHTML = T.summary(m).map(function (r) { return '<tr><th>' + esc(r[0]) + '</th><td>' + esc(r[1]) + '</td></tr>'; }).join(''); return t; }
  function topWordsLine(m) { return (m.topics || []).slice(0, 3).map(function (t) { return (t.k + 1) + ': ' + t.words.slice(0, 5).map(function (w) { return w[0]; }).join(' '); }).join(' · '); }
  function slug(s) { return String(s || 'model').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }
  function download(m) { var a = SW.el('a', { href: URL.createObjectURL(new Blob([JSON.stringify(m)], { type: 'application/json' })), download: slug(B.slug || 'bench') + '-topics-' + m.id + '.json' }); document.body.appendChild(a); a.click(); a.remove(); }
  function modelCard(m, own, cards) {
    var inUse = T.inUse() === m.id;
    var c = SW.lenses.card((m.name || 'K ' + (m.settings || {}).k + ', seed ' + (m.settings || {}).seed) + (inUse ? ' · in use' : ''), own ? 'Yours, kept in this browser.' : '');
    c.appendChild(table(m));
    var drift = T.drift(m), warn = SW.el('div', { class: 'tp-warn' });
    drift.forEach(function (d) { warn.appendChild(SW.el('p', { class: d.kind === 'source' ? 'tp-warn-src' : 'hint' }, esc((d.kind === 'source' ? '⚠ The text has changed since this model was made: ' : '') + d.text + (d.kind === 'source' ? '. Its documents may no longer point at the right lines.' : '.')))); });
    c.appendChild(warn);
    if (m.fingerprint && m.settings && C.documents && !drift.some(function (d) { return d.kind === 'source'; })) {
      T.documents({ set: m.settings.set, param: m.settings.param, choice: m.settings.choice, chunk: m.settings.chunk }).then(function (docs) {
        if (T.fingerprint(docs) !== m.fingerprint) warn.appendChild(SW.el('p', { class: 'tp-warn-src' }, '⚠ The bench now cuts or tokenises these documents differently from when this model was made: its documents may no longer point at the right passages.'));
      }, function () { /* the documents cannot be had here: no warning to give */ });
    }
    var tw = topWordsLine(m); if (tw) c.appendChild(SW.el('p', { class: 'hint' }, esc(tw) + ' …'));
    var bar = SW.el('div', { class: 'toolbar tp-acts' });
    bar.innerHTML = (inUse ? '' : '<button class="btn" data-a="use">Use this model</button> ') + '<button class="btn ghost" data-a="export">⤓ Export</button>' + (own ? ' <button class="btn ghost" data-a="drop">Delete</button>' : '');
    bar.addEventListener('click', function (e) {
      var a = e.target.closest('[data-a]'); if (!a) return;
      if (a.dataset.a === 'use') { T.use(m.id); draw(); }
      else if (a.dataset.a === 'export') download(m);
      else if (a.dataset.a === 'drop' && confirm('Delete your model ' + m.id + ' from this browser?')) T.drop(m.id).then(draw);
    });
    c.appendChild(bar); cards.appendChild(c);
  }
  function models(cards) {
    // the bench's
    (C.models || []).forEach(function (M) {
      var holder = SW.el('div', { class: 'tp-slot' }); cards.appendChild(holder);
      T.model(M.id).then(function (m) { var tmp = SW.el('div'); modelCard(Object.assign({}, m, { name: M.name || m.name }), false, tmp); holder.replaceWith(tmp.firstChild); }, function (e) {
        var c = SW.lenses.card(M.name || M.id); c.appendChild(SW.el('p', { class: 'hint' }, esc(e.message))); holder.replaceWith(c);
      });
    });
    if (!(C.models || []).length) cards.appendChild(SW.el('p', { class: 'hint wide' }, 'This bench publishes no topic models yet. You can run one of your own below.'));
    // the reader's own
    T.own().then(function (list) { list.sort(function (a, b) { return String(b.created).localeCompare(String(a.created)); }).forEach(function (m) { modelCard(m, true, cards); }); runCard(cards); });
  }
  // run a model in the page, or import one
  function runCard(cards) {
    var c = SW.lenses.wide(SW.lenses.card('Run a model of your own', 'Trained here, in the background, and kept in this browser. A model with the same settings and documents gives the same topics anywhere.'));
    var sets = T.sets();
    function opt(v, l, on) { return '<option value="' + esc(v) + '"' + (on ? ' selected' : '') + '>' + esc(l) + '</option>'; }
    var bar = SW.el('div', { class: 'toolbar tp-run' });
    bar.innerHTML = '<select data-k="set">' + sets.map(function (x, i) { return opt(x.id, x.label, !i); }).join('') + '</select> <select data-k="choice" hidden></select> ' +
      '<select data-k="k">' + [5, 8, 10, 12, 15, 20, 30].map(function (k) { return opt(k, k + ' topics', k === T.DEFAULTS.k); }).join('') + '</select> ' +
      '<label>seed <input type="number" data-k="seed" value="1" min="1" style="width:5em"></label> ' +
      '<select data-k="iterations">' + [200, 500, 1000].map(function (n) { return opt(n, n + ' iterations', n === T.DEFAULTS.iterations); }).join('') + '</select> ' +
      '<select data-k="minCount">' + [1, 2, 3, 5].map(function (n) { return opt(n, n === 1 ? 'every word' : 'words seen ' + n + '+ times', n === T.DEFAULTS.minCount); }).join('') + '</select> ' +
      '<button class="btn" data-a="run">Run</button> <label class="btn ghost tp-import">⤒ Import a model<input type="file" accept=".json,application/json" hidden></label>';
    var msg = SW.el('p', { class: 'hint' }), job = null;
    c.appendChild(bar); c.appendChild(msg); cards.appendChild(c);
    function v(k) { return SW.$('[data-k="' + k + '"]', bar).value; }
    function setChanged() {
      var S = sets.filter(function (x) { return x.id === v('set'); })[0], ch = SW.$('[data-k="choice"]', bar);
      ch.hidden = !(S && S.choices); ch.innerHTML = '';
      if (S && S.choices) Promise.resolve(S.choices()).then(function (list) { ch.innerHTML = list.map(function (x, i) { return opt(x[0], x[1], i === list.length - 1); }).join(''); });
    }
    setChanged();
    bar.addEventListener('change', function (e) { if (e.target.dataset.k === 'set') setChanged(); });
    bar.addEventListener('click', function (e) {
      var a = e.target.closest('[data-a="run"]'); if (!a) return;
      if (job) { job.cancel(); job = null; a.textContent = 'Run'; msg.textContent = 'Stopped.'; return; }
      var S = sets.filter(function (x) { return x.id === v('set'); })[0] || {}, ch = SW.$('[data-k="choice"]', bar);
      var o = { set: S.id, param: S.param, choice: S.choices ? (isNaN(+ch.value) ? ch.value : +ch.value) : undefined, choiceLabel: S.label + (S.choices && ch.selectedOptions[0] ? ': ' + ch.selectedOptions[0].textContent : ''),
        documents: S.label, k: +v('k'), seed: +v('seed') || 1, iterations: +v('iterations'), minCount: +v('minCount') };
      a.textContent = 'Stop'; msg.textContent = 'Reading the documents…';
      job = T.run(o, function (i, of) { msg.textContent = 'Modelling: iteration ' + i + ' of ' + of + '…'; });
      job.promise.then(function (m) { job = null; a.textContent = 'Run'; return T.keep(m).then(function () { if (!T.inUse()) T.use(m.id); msg.textContent = 'Done: ' + m.id + '.'; draw(); }); })
        .catch(function (err) { job = null; a.textContent = 'Run'; msg.textContent = err.message; });
    });
    SW.$('.tp-import input', bar).addEventListener('change', function (e) {
      var f = e.target.files[0]; if (!f) return;
      f.text().then(function (t) { var m = JSON.parse(t); if (!m || m.kind !== 'bench-kit-topics' || !m.id) throw new Error('That file is not a topic model.'); return T.keep(m).then(function () { msg.textContent = 'Imported ' + m.id + '.'; draw(); }); })
        .catch(function (err) { msg.textContent = err.message; });
    });
  }

  // ---------- the parts that read a model ----------
  function tname(m, k) { var n = m.names && m.names[k]; return 'Topic ' + (k + 1) + (n ? ': ' + n : ''); }
  function tw(m, k, n) { return m.topics[k].words.slice(0, n || 8).map(function (w) { return w[0]; }).join(' '); }
  function pct(v) { return v == null || !isFinite(v) ? '' : (100 * v).toFixed(v < 0.1 ? 1 : 0) + '%'; }
  function share(m) {   // each topic's share of the documents' tokens
    var tot = m.topics.reduce(function (a, t) { return a + t.tokens; }, 0) || 1;
    return m.topics.map(function (t) { return t.tokens / tot; });
  }
  function docLabel(d) { return d.label || d.id; }
  function group(d) { var x = d.meta || {}; return x.chapterLabel || x.group || x.chapter || 'All'; }
  function order(m) { return m.documents.map(function (d, i) { return i; }).sort(function (a, b) { var x = (m.documents[a].meta || {}).seq, y = (m.documents[b].meta || {}).seq; return x != null && y != null ? x - y : a - b; }); }
  // a document's text in the bench: SW.BENCH.topics.open(doc), or its meta's version and lines
  T.open = function (d) {
    if (C.open) return C.open(d);
    var x = d.meta || {}, f = x.from;
    if (f) SW.openAt(x.v || SW.state.v, { p: f[0], n0: f[1], n1: x.to && x.to[0] === f[0] ? x.to[1] : f[1] });
  };
  function docLink(m, i, extra) { return '<a href="#" data-doc="' + i + '">' + esc(docLabel(m.documents[i])) + '</a>' + (extra || ''); }
  function wordLink(w) { return '<a href="#" data-word="' + esc(w) + '">' + esc(w) + '</a>'; }
  function topicLink(m, k) { return '<a href="#" data-topic="' + k + '">' + esc(tname(m, k)) + '</a>'; }
  // links within the tab and to the text
  function wire(el, m) {
    el.addEventListener('click', function (e) {
      var a = e.target.closest('[data-doc], [data-word], [data-topic], [data-open]'); if (!a) return;
      e.preventDefault();
      if (a.dataset.open != null) T.open(m.documents[+a.dataset.open]);
      else if (a.dataset.doc != null) go(6, { doc: +a.dataset.doc });
      else if (a.dataset.word != null) go(5, { word: a.dataset.word });
      else if (a.dataset.topic != null) go(4, { topic: +a.dataset.topic });
    });
  }
  function card(title, lede) { return SW.lenses.wide(SW.lenses.card(title, lede)); }
  // a bar for each value: rows [[html, value]]
  function barsHTML(rows, max) {
    max = max || rows.reduce(function (a, r) { return Math.max(a, r[1]); }, 0) || 1;
    return '<table class="tp-bars">' + rows.map(function (r) { return '<tr><th>' + r[0] + '</th><td><span class="tp-bar" style="width:' + Math.round(100 * r[1] / max) + '%"></span></td><td class="tp-num">' + pct(r[1]) + '</td></tr>'; }).join('') + '</table>';
  }
  function heatHTML(rows, cols, M, o) {
    o = o || {};
    var max = 0; M.forEach(function (r) { r.forEach(function (v) { if (v > max) max = v; }); });
    return '<div class="tp-heatwrap"><table class="ts-heat"><thead><tr><th></th>' + cols.map(function (c, j) { return '<th title="' + esc(o.colTitle ? o.colTitle(j) : c) + '">' + esc(c) + '</th>'; }).join('') + '</tr></thead><tbody>' +
      M.map(function (r, i) { return '<tr><th title="' + esc(rows[i]) + '">' + esc(rows[i]) + (o.mark && o.mark(i) ? ' <span class="tp-thin" title="' + esc(o.mark(i)) + '">◌</span>' : '') + '</th>' + r.map(function (v, j) { var t = max ? v / max : 0; return '<td data-topic="' + j + '" style="background:color-mix(in srgb, var(--amber) ' + Math.round(t * 75) + '%, transparent)" title="' + esc(rows[i] + ', ' + (o.colTitle ? o.colTitle(j) : cols[j]) + ': ' + pct(v)) + '"></td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table></div>';
  }
  // a line for each series over x = 0…n-1: series [{ label, ys, colour }]
  var COLS = ['var(--amber)', 'var(--beam)', 'var(--red)', 'var(--green)', 'var(--violet)', 'var(--text)', 'var(--text-dim)'];
  function linesSVG(series, n, o) {
    o = o || {};
    var W = 880, H = o.height || 260, L = 44, R = 12, Tp = 10, Bt = 34, max = 0;
    series.forEach(function (S) { S.ys.forEach(function (y) { if (y > max) max = y; }); });
    max = max || 1;
    function X(i) { return L + (n > 1 ? i * (W - L - R) / (n - 1) : 0); }
    function Y(v) { return H - Bt - v / max * (H - Tp - Bt); }
    var s = '<svg xmlns="http://www.w3.org/2000/svg" class="ts-chart" viewBox="0 0 ' + W + ' ' + H + '" font-size="11" font-family="inherit">';
    [0, 0.25, 0.5, 0.75, 1].forEach(function (f) { var y = Y(f * max).toFixed(1); s += '<line x1="' + L + '" y1="' + y + '" x2="' + (W - R) + '" y2="' + y + '" stroke="var(--line)" stroke-dasharray="2 3"/><text x="' + (L - 5) + '" y="' + (+y + 3.5) + '" text-anchor="end" fill="var(--text-dim)">' + pct(f * max) + '</text>'; });
    var lastLab = -1e9;   // a mark's label only where it has room (60 px from the one before)
    (o.marks || []).forEach(function (mk) {
      var xv = X(mk[0]), x = xv.toFixed(1), lab = mk[1] && xv - lastLab >= 60 && xv <= W - R - 20 ? mk[1] : '';
      if (lab) lastLab = xv;
      s += '<line x1="' + x + '" y1="' + Tp + '" x2="' + x + '" y2="' + (H - Bt) + '" stroke="var(--line)" stroke-width="0.5"/>' + (lab ? '<text x="' + x + '" y="' + (H - Bt + 14) + '" text-anchor="middle" fill="var(--text-dim)">' + esc(lab) + '</text>' : '');
    });
    series.forEach(function (S, k) {
      var c = S.colour || COLS[k % COLS.length];
      s += '<polyline fill="none" stroke="' + c + '" stroke-width="1.6" points="' + S.ys.map(function (v, i) { return X(i).toFixed(1) + ',' + Y(v).toFixed(1); }).join(' ') + '"><title>' + esc(S.label) + '</title></polyline>';
      if (n <= 60) S.ys.forEach(function (v, i) { s += '<circle cx="' + X(i).toFixed(1) + '" cy="' + Y(v).toFixed(1) + '" r="2.2" fill="' + c + '"' + (S.hollow && S.hollow(i) ? ' fill-opacity="0.25" stroke="' + c + '"' : '') + '><title>' + esc(S.label + ', ' + (o.xlabel ? o.xlabel(i) : i + 1) + ': ' + pct(v)) + '</title></circle>'; });
    });
    if (o.xtitle) s += '<text x="' + ((L + W - R) / 2) + '" y="' + (H - 4) + '" text-anchor="middle" fill="var(--text-dim)">' + esc(o.xtitle) + '</text>';
    return s + '</svg>';
  }
  function svgBox(svg) { var d = SW.el('div', { class: 'tp-fig' }); d.innerHTML = svg; return d; }
  function figBlock(svg, caption) { var o = SW.exportSVG ? SW.exportSVG(svg) : svg, mm = /viewBox="0 0 ([\d.]+) ([\d.]+)"/.exec(svg); return { type: 'figure', svg: o, caption: caption, width: mm ? +mm[1] : null, height: mm ? +mm[2] : null }; }

  // 2 the topics
  function topicsPart(m, cards) {
    var sh = share(m), c = card('The topics', 'Each topic’s twenty most probable words, its share of the text’s words, and two of MALLET’s measures: coherence (higher, nearer 0, where its top words occur in the same documents) and exclusivity (higher where its words belong to it more than to other topics). Click a topic for where it falls, a word for its topics.');
    var ord = m.topics.map(function (t, k) { return k; }).sort(function (a, b) { return sh[b] - sh[a]; });
    var el = SW.el('div', { class: 'tp-topics' });
    el.innerHTML = ord.map(function (k) {
      var d = m.topics[k].diagnostics || {};
      return '<div class="tp-topic"><div class="tp-th">' + topicLink(m, k) + ' <span class="tp-num">' + pct(sh[k]) + '</span>' +
        (d.coherence != null ? ' <span class="hint" title="coherence">coh ' + d.coherence.toFixed(0) + '</span>' : '') + (d.exclusivity != null ? ' <span class="hint" title="exclusivity">excl ' + d.exclusivity.toFixed(2) + '</span>' : '') + '</div>' +
        '<div class="tp-words">' + m.topics[k].words.slice(0, 20).map(function (w) { return wordLink(w[0]); }).join(' ') + '</div></div>';
    }).join('');
    c.appendChild(el); wire(el, m); cards.appendChild(c);
    blocks = function () { return [SW.tableBlock('The topics of ' + (m.name || m.id), ['Topic', 'Share', 'Coherence', 'Exclusivity', 'Words'], ord.map(function (k) { var d = m.topics[k].diagnostics || {}; return [k + 1, pct(sh[k]), d.coherence != null ? d.coherence : '', d.exclusivity != null ? d.exclusivity : '', tw(m, k, 20)]; }))]; };
  }
  // 3 documents and topics: the mean share by the bench's grouping
  function heatPart(m, cards) {
    var groups = [], idx = {}, M = [], n = [];
    order(m).forEach(function (i) { var g = String(group(m.documents[i])); if (!(g in idx)) { idx[g] = groups.length; groups.push(g); M.push(m.topics.map(function () { return 0; })); n.push(0); } var r = idx[g]; n[r]++; m.theta[i].forEach(function (v, k) { M[r][k] += v; }); });
    M.forEach(function (row, r) { row.forEach(function (v, k) { row[k] = v / n[r]; }); });
    var c = card('Documents and topics', 'The mean share of each topic in the documents of each part of the text, darker for more. Click a column for that topic through the text.');
    var el = SW.el('div'); el.innerHTML = heatHTML(groups, m.topics.map(function (t, k) { return String(k + 1); }), M, { colTitle: function (k) { return tname(m, k) + ': ' + tw(m, k, 5); } });
    c.appendChild(el); wire(el, m); cards.appendChild(c);
    blocks = function () { return [SW.tableBlock('Mean share of each topic, by part', ['Part', 'Documents'].concat(m.topics.map(function (t, k) { return 'T' + (k + 1); })), M.map(function (row, r) { return [groups[r], n[r]].concat(row.map(pct)); }))]; };
  }
  // 4 a topic through the text
  function throughPart(m, cards) {
    var k = Math.min(focus.topic || 0, m.topics.length - 1), ord = order(m);
    var c = card(tname(m, k), tw(m, k, 15) + '. Its share of each document, in reading order; the parts of the text marked beneath.');
    var bar = SW.el('div', { class: 'tp-row' });
    bar.innerHTML = '<select>' + m.topics.map(function (t, j) { return '<option value="' + j + '"' + (j === k ? ' selected' : '') + '>' + esc(tname(m, j) + ': ' + tw(m, j, 4)) + '</option>'; }).join('') + '</select>';
    SW.$('select', bar).addEventListener('change', function (e) { go(4, { topic: +e.target.value }); });
    var marks = [], last = null;
    ord.forEach(function (i, x) { var g = String(group(m.documents[i])); if (g !== last) { marks.push([x, g.replace(/^Chapter /, 'Ch. ')]); last = g; } });
    var svg = linesSVG([{ label: tname(m, k), ys: ord.map(function (i) { return m.theta[i][k]; }) }], ord.length, { marks: marks, xlabel: function (x) { return docLabel(m.documents[ord[x]]); } });
    var top = ord.slice().sort(function (a, b) { return m.theta[b][k] - m.theta[a][k]; }).slice(0, 8);
    var list = SW.el('div', { class: 'tp-carriers' });
    list.innerHTML = '<h4>The documents that carry most of it</h4>' + top.map(function (i) { return '<p>' + docLink(m, i) + ' <span class="tp-num">' + pct(m.theta[i][k]) + '</span> <a href="#" data-open="' + i + '" class="hint">read ›</a></p>'; }).join('');
    c.appendChild(bar); c.appendChild(svgBox(svg)); c.appendChild(list); wire(list, m); cards.appendChild(c);
    blocks = function () { return [figBlock(svg, tname(m, k) + ' through the text'), SW.tableBlock('The documents that carry most of ' + tname(m, k), ['Document', 'Share'], top.map(function (i) { return [docLabel(m.documents[i]), pct(m.theta[i][k])]; }))]; };
  }
  // 5 a word's topics: from the model's word–topic counts
  function wordTopics(m, w) {
    var mm = m.model, K = m.topics.length, idx = mm.words.indexOf(w); if (idx < 0) return null;
    var bits = 0, mask; if ((K & (K - 1)) === 0) mask = K - 1; else { mask = 1; while (mask < K) mask *= 2; mask -= 1; }
    var b = mask; while (b) { bits += b & 1; b >>>= 1; }
    var counts = new Array(K).fill(0);
    mm.typeTopicCounts[idx].forEach(function (x) { if (x > 0) counts[x & mask] += x >> bits; });
    return counts;
  }
  T.wordTopics = wordTopics;
  function wordPart(m, cards) {
    var c = card('A word’s topics', 'How often the word is drawn into each topic, and its rank among the topic’s words. Words the model left out (stopwords, rare and short words) have none.');
    var bar = SW.el('div', { class: 'tp-row' });
    bar.innerHTML = '<input type="search" placeholder="a word" value="' + esc(focus.word || '') + '" style="width:200px">';
    var out = SW.el('div'); c.appendChild(bar); c.appendChild(out); cards.appendChild(c); wire(out, m);
    function show() {
      var w = SW.$('input', bar).value.trim().toLowerCase(); focus.word = w; out.innerHTML = '';
      if (!w) return;
      var counts = wordTopics(m, w);
      if (!counts) { out.innerHTML = '<p class="hint">“' + esc(w) + '” is not among the model’s words.</p>'; return; }
      var tot = counts.reduce(function (a, b) { return a + b; }, 0);
      var rows = counts.map(function (n, k) { return [k, n / tot]; }).filter(function (x) { return x[1] > 0; }).sort(function (a, b) { return b[1] - a[1]; });
      out.innerHTML = '<p class="hint">' + tot + ' occurrences in the documents modelled.</p>' + barsHTML(rows.map(function (x) {
        var rank = m.topics[x[0]].words.map(function (y) { return y[0]; }).indexOf(w);
        return [topicLink(m, x[0]) + ' <span class="hint">' + esc(tw(m, x[0], 5)) + (rank >= 0 ? ' · its word no. ' + (rank + 1) : '') + '</span>', x[1]];
      }), 1);
      blocks = function () { return [SW.tableBlock('The topics of “' + w + '”', ['Topic', 'Share of its occurrences'], rows.map(function (x) { return [tname(m, x[0]), pct(x[1])]; }))]; };
    }
    var t = null; SW.$('input', bar).addEventListener('input', function () { clearTimeout(t); t = setTimeout(show, 250); });
    show();
  }
  // 6 a document's topics
  function docPart(m, cards) {
    var ord = order(m), i = Math.min(focus.doc || ord[0], m.documents.length - 1), d = m.documents[i];
    var c = card(docLabel(d), 'The topics this document is made of, as the model has them.');
    var bar = SW.el('div', { class: 'tp-row' });
    bar.innerHTML = '<select>' + ord.map(function (j) { return '<option value="' + j + '"' + (j === i ? ' selected' : '') + '>' + esc(docLabel(m.documents[j])) + '</option>'; }).join('') + '</select> <a href="#" data-open="' + i + '" class="btn ghost">Read it ›</a>';
    SW.$('select', bar).addEventListener('change', function (e) { go(6, { doc: +e.target.value }); });
    var rows = m.theta[i].map(function (v, k) { return [k, v]; }).sort(function (a, b) { return b[1] - a[1]; }).filter(function (x, n) { return n < 6 || x[1] >= 0.05; });
    var out = SW.el('div'); out.innerHTML = barsHTML(rows.map(function (x) { return [topicLink(m, x[0]) + ' <span class="hint">' + esc(tw(m, x[0], 6)) + '</span>', x[1]]; }), 1) + (d.length != null ? '<p class="hint">' + d.length + ' words modelled.</p>' : '');
    c.appendChild(bar); c.appendChild(out); wire(bar, m); wire(out, m); cards.appendChild(c);
    blocks = function () { return [SW.tableBlock('The topics of ' + docLabel(d), ['Topic', 'Share', 'Words'], rows.map(function (x) { return [tname(m, x[0]), pct(x[1]), tw(m, x[0], 8)]; }))]; };
  }
  // the words of a passage, as the bench's documents have them: SW.BENCH.topics.tokens(text); the bench's
  // or the word breaker's (kit/textstats.js) where it has its own or the text is unspaced; or words of letters
  T.tokens = function (text) {
    if (C.tokens) return C.tokens(text);
    var TS = SW.textstats;
    if (TS && (typeof B.tokenise === 'function' || TS.unspaced(text))) return TS.tokens(text);
    return (String(text).toLowerCase().match(/\p{L}[\p{L}'’]*\p{L}|\p{L}/gu) || []).map(function (w) { return w.replace(/['’]s$/, ''); }); };
  // a passage inferred on a model: { theta, known, length }
  T.infer = function (m, text, o) {
    var M = mallette(), s = T.settings(m.settings || {});
    var docs = T.prepare([{ id: 'x', tokens: T.tokens(text) }], Object.assign({}, s, { minCount: 1 }));
    var inf = M.inferencerFrom(m.model, (o && o.seed) || (m.settings || {}).seed || 1);
    var r = inf.infer([{ name: 'x', tokens: docs[0].tokens }]);
    return { theta: r.theta[0], known: r.docs[0].known, length: r.docs[0].length };
  };
  // 7 a selection's topics
  function selPart(m, cards) {
    var c = card('A selection’s topics', 'Select a passage in Read or Book and choose 🧩 Topics, or type or paste one here. Its words are read as the model’s documents were, and its topics inferred (the model unchanged). Words the model does not hold are passed over; a short passage gives a rough answer.');
    var bar = SW.el('div', { class: 'tp-selbox' });
    bar.innerHTML = '<textarea rows="4" style="width:100%">' + esc(focus.text || '') + '</textarea><div class="toolbar"><button class="btn" data-a="infer">Its topics</button></div>';
    var out = SW.el('div'); c.appendChild(bar); c.appendChild(out); cards.appendChild(c); wire(out, m);
    function run() {
      var text = SW.$('textarea', bar).value; focus.text = text; out.innerHTML = '';
      if (!text.trim()) return;
      var r = T.infer(m, text), rows = r.theta.map(function (v, k) { return [k, v]; }).sort(function (a, b) { return b[1] - a[1]; }).filter(function (x, n) { return n < 5 || x[1] >= 0.08; });
      out.innerHTML = '<p class="hint">' + r.known + ' of its ' + r.length + ' words are the model’s.' + (r.known < 30 ? ' Few words: read the shares as a rough guide.' : '') + '</p>' + barsHTML(rows.map(function (x) { return [topicLink(m, x[0]) + ' <span class="hint">' + esc(tw(m, x[0], 6)) + '</span>', x[1]]; }), 1);
      blocks = function () { return [{ type: 'quote', text: text.slice(0, 2000) }, SW.tableBlock('Its topics, inferred on ' + (m.name || m.id), ['Topic', 'Share', 'Words'], rows.map(function (x) { return [tname(m, x[0]), pct(x[1]), tw(m, x[0], 8)]; }))]; };
    }
    SW.$('[data-a="infer"]', bar).addEventListener('click', run);
    if (focus.text) run();
  }
  // 🧩 Topics on a selection bar (kit/read.js) and Book's pop-up: the selected text in part 7
  T.selActs = function () {
    if (!C || !T.inUse() || (SW.menuOff && SW.menuOff('topics'))) return [];
    return [['🧩 Topics', function () { T.forText(String(window.getSelection() || '')); }]];
  };
  T.forText = function (text) {
    if (!String(text).trim()) { SW.toast('Select a passage to see its topics.', 3000); return; }
    focus.text = text; part = 7; SW.setTab('topics'); if (SW.state.tab === 'topics') draw();
  };
  // 8 across a set's choices (a manuscript's stages), each choice's documents inferred on the model
  var acrossCache = {};
  function acrossPart(m, cards) {
    var sets = T.sets().filter(function (x) { return x.choices; });
    var lens = m.documents.map(function (d) { return d.length || 0; }).sort(function (a, b) { return a - b; }), THIN = lens.length ? lens[Math.floor(lens.length / 2)] : 100;   // one document's worth of the model's words
    var c = card('Across the stages', 'For each choice of a set (each stage of a manuscript, say), its documents’ topics inferred on the model in use, so every choice is read in the same topics, and their mean share. Words of a choice the model does not hold are passed over; the table gives how many. Below, one topic part by part, where a share resting on less than one document’s worth of the model’s words (' + THIN + ') is marked.');
    cards.appendChild(c);
    if (!sets.length) { c.appendChild(SW.el('p', { class: 'hint' }, 'This bench gives no set with choices (topics.sets).')); return; }
    var bar = SW.el('div', { class: 'tp-row' });
    bar.innerHTML = '<select data-k="set">' + sets.map(function (x) { return '<option value="' + esc(x.id) + '">' + esc(x.label) + '</option>'; }).join('') + '</select> <button class="btn" data-a="go">Infer every choice</button> <span class="hint tp-prog"></span>';
    var out = SW.el('div'); c.appendChild(bar); c.appendChild(out); wire(out, m);
    function show(R) {
      var K = m.topics.length, n = R.rows.length, sel = focus.across || share(m).map(function (v, k) { return [k, v]; }).sort(function (a, b) { return b[1] - a[1]; }).slice(0, 5).map(function (x) { return x[0]; });
      var thin = function (i) { return R.rows[i].known < THIN; };
      var series = sel.map(function (k, j) { return { label: tname(m, k) + ': ' + tw(m, k, 3), ys: R.rows.map(function (r) { return r.mean[k]; }), colour: COLS[j % COLS.length], hollow: thin }; });
      var svg = linesSVG(series, n, { marks: R.rows.map(function (r, i) { return [i, i % Math.max(1, Math.ceil(n / 8)) ? '' : String(i)]; }), xlabel: function (i) { return R.rows[i].label; }, xtitle: R.label });
      out.innerHTML = '<div class="tp-pick">' + m.topics.map(function (t, k) { var on = sel.indexOf(k) >= 0; return '<label class="check"><input type="checkbox" data-k="' + k + '"' + (on ? ' checked' : '') + '> <span style="color:' + (on ? COLS[sel.indexOf(k) % COLS.length] : 'inherit') + '">' + (k + 1) + '</span></label>'; }).join(' ') + '</div>';
      out.appendChild(svgBox(svg));
      var tbl = SW.el('div', { class: 'tp-heatwrap' });
      tbl.innerHTML = '<table class="tp-across"><thead><tr><th></th><th>documents</th><th>words modelled</th><th>not the model’s</th>' + sel.map(function (k) { return '<th>T' + (k + 1) + '</th>'; }).join('') + '</tr></thead><tbody>' +
        R.rows.map(function (r, i) { return '<tr' + (thin(i) ? ' class="tp-thinrow"' : '') + '><th>' + esc(r.label) + '</th><td>' + r.docs + '</td><td>' + r.known + '</td><td>' + pct(r.length ? 1 - r.known / r.length : 0) + '</td>' + sel.map(function (k) { return '<td>' + pct(r.mean[k]) + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table>';
      out.appendChild(tbl);
      // one topic, part by part and choice by choice; a cell resting on less than one document's worth of the model's words is marked
      var gk = focus.acrossTopic != null ? focus.acrossTopic : sel[0] || 0, gnames = [], gseq = {};
      R.rows.forEach(function (r) { for (var g in r.groups) if (!(g in gseq)) { gseq[g] = r.groups[g].seq; gnames.push(g); } });
      gnames.sort(function (a, b) { return gseq[a] - gseq[b]; });
      var GM = R.rows.map(function (r) { return gnames.map(function (g) { var G = r.groups[g]; return G && G.known ? G.sum[gk] / G.known : 0; }); });
      var gbox = SW.el('div', { class: 'tp-gmap' });
      gbox.innerHTML = '<h4>One topic, part by part <select>' + m.topics.map(function (t, k) { return '<option value="' + k + '"' + (k === gk ? ' selected' : '') + '>' + esc(tname(m, k) + ': ' + tw(m, k, 4)) + '</option>'; }).join('') + '</select></h4>' +
        '<p class="hint">Its share in each part of the text at each choice. ◌ marks a cell resting on fewer than ' + THIN + ' of the model’s words (one document’s worth); a blank cell, a part with no text at that choice.</p>' +
        '<div class="tp-heatwrap"><table class="ts-heat"><thead><tr><th></th>' + gnames.map(function (g) { return '<th title="' + esc(g) + '">' + esc(g.replace(/^Chapter /, '')) + '</th>'; }).join('') + '</tr></thead><tbody>' +
        R.rows.map(function (r, i) {
          var max = 0; GM.forEach(function (row) { row.forEach(function (v) { if (v > max) max = v; }); });
          return '<tr><th>' + esc(r.label) + '</th>' + gnames.map(function (g, j) {
            var G = r.groups[g]; if (!G || !G.known) return '<td></td>';
            var v = GM[i][j], t = max ? v / max : 0;
            return '<td style="background:color-mix(in srgb, var(--amber) ' + Math.round(t * 75) + '%, transparent)" title="' + esc(r.label + ', ' + g + ': ' + pct(v) + ' (' + G.known + ' words)') + '">' + (G.known < THIN ? '◌' : '') + '</td>';
          }).join('') + '</tr>';
        }).join('') + '</tbody></table></div>';
      SW.$('select', gbox).addEventListener('change', function (e) { focus.acrossTopic = +e.target.value; show(R); });
      out.appendChild(gbox);
      SW.$$('.tp-pick input', out).forEach(function (cb) { cb.addEventListener('change', function () { var k = +cb.dataset.k, s2 = sel.slice(); if (cb.checked) s2.push(k); else s2 = s2.filter(function (x) { return x !== k; }); focus.across = s2; show(R); }); });
      blocks = function () { return [figBlock(svg, 'Topics across ' + R.label + ', inferred on ' + (m.name || m.id)),
        SW.tableBlock(tname(m, gk) + ', part by part, by ' + R.label, ['Choice'].concat(gnames), R.rows.map(function (r, i) { return [r.label].concat(gnames.map(function (g, j) { var G = r.groups[g]; return G && G.known ? pct(GM[i][j]) + (G.known < THIN ? ' (thin)' : '') : ''; })); })), SW.tableBlock('Mean share of each topic, by ' + R.label, ['Choice', 'Documents', 'Words modelled', 'Not the model’s'].concat(m.topics.map(function (t, k) { return 'T' + (k + 1); })), R.rows.map(function (r) { return [r.label, r.docs, r.known, pct(r.length ? 1 - r.known / r.length : 0)].concat(r.mean.map(pct)); }))]; };
    }
    function runAll() {
      var S = sets.filter(function (x) { return x.id === SW.$('[data-k="set"]', bar).value; })[0], key = m.id + '|' + S.id, prog = SW.$('.tp-prog', bar);
      if (acrossCache[key]) { show(acrossCache[key]); return; }
      Promise.resolve(S.choices()).then(function (choices) {
        var rows = [], M2 = mallette(), inf = M2.inferencerFrom(m.model, (m.settings || {}).seed || 1), s = T.settings(m.settings || {});
        function next(ci) {
          if (ci >= choices.length) { var R = { label: S.label, rows: rows }; acrossCache[key] = R; prog.textContent = ''; show(R); return; }
          prog.textContent = 'Inferring ' + choices[ci][1] + ' (' + (ci + 1) + ' of ' + choices.length + ')…';
          T.documents({ set: S.id, param: S.param, choice: choices[ci][0] }).then(function (docs) {
            var prep = T.prepare(docs, Object.assign({}, s, { minCount: 1 })), mean = m.topics.map(function () { return 0; }), known = 0, length = 0;
            var r = inf.infer(prep.map(function (d) { return { name: d.name, tokens: d.tokens }; })), byGroup = {};
            r.theta.forEach(function (row, i) {
              var kn = r.docs[i].known, g = String(group(docs[i])), G = byGroup[g] || (byGroup[g] = { known: 0, sum: m.topics.map(function () { return 0; }), seq: (docs[i].meta || {}).seq != null ? docs[i].meta.seq : i });
              row.forEach(function (v, k) { mean[k] += v * kn; G.sum[k] += v * kn; });
              G.known += kn; known += kn; length += r.docs[i].length;
            });
            rows.push({ label: choices[ci][1], docs: docs.length, known: known, length: length, mean: mean.map(function (v) { return known ? v / known : 0; }), groups: byGroup });
            setTimeout(function () { next(ci + 1); }, 0);
          }).catch(function (e) { prog.textContent = e.message; });
        }
        next(0);
      });
    }
    SW.$('[data-a="go"]', bar).addEventListener('click', runAll);
    var S0 = sets[0]; if (acrossCache[m.id + '|' + S0.id]) show(acrossCache[m.id + '|' + S0.id]);
  }
  // 9 steadiness across seeds: the model's own check
  function steadyPart(m, cards) {
    var ck = m.check, c = card('Steadiness across seeds', ck ? 'When the model was made, each setting was trained with several seeds. ' + (ck.cosine ? 'A topic recurs in another seed when the cosine of its word probabilities with one of that seed’s topics is ' + ck.cosine.threshold + ' or more, ' + ck.cosine.calibration + '. The overlap of the top ' + ck.words + ' words (Jaccard ' + ck.threshold + ') is given beside it.' : 'A topic recurs in another seed when its top ' + ck.words + ' words overlap with one of that seed’s topics by a Jaccard index of ' + ck.threshold + ' or more.') + ' A topic found by few seeds is less the text’s than the sampler’s.' : '');
    cards.appendChild(c);
    if (!ck) { c.appendChild(SW.el('p', { class: 'hint' }, 'This model was not made with a check across seeds (tools/topics.js makes one).')); return; }
    var el = SW.el('div');
    el.innerHTML = '<table class="tp-sum"><tr><th>Setting</th><td><b>Seeds</b></td>' + (ck.cosine ? '<td><b>Recur (cosine)</b></td>' : '') + '<td><b>Recur (Jaccard)</b></td></tr>' + ck.settings.map(function (x) { return '<tr><th>K ' + x.setting.k + (x.setting.minCount ? ', words seen ' + x.setting.minCount + '+ times' : '') + '</th><td>' + x.seeds.join(', ') + '</td>' + (ck.cosine ? '<td>' + pct(x.recurrenceCos) + '</td>' : '') + '<td>' + pct(x.recurrence) + '</td></tr>'; }).join('') + '</table>' +
      (ck.chosen && !ck.chosen.others ? '<p class="hint">This model was made from one seed, so there is nothing to compare its topics with.</p>' : '') +
      (ck.chosen && ck.chosen.recurs && ck.chosen.others ? '<h4>This model’s topics: in how many of the other ' + ck.chosen.others + ' seeds each recurs</h4>' + barsHTML(ck.chosen.recurs.map(function (r, k) { return [topicLink(m, k) + ' <span class="hint">' + esc(tw(m, k, 6)) + '</span>', r / ck.chosen.others]; }), 1) : '');
    c.appendChild(el); wire(el, m);
    blocks = function () { return [SW.tableBlock('Topics that recur across seeds, by setting (' + ck.rule + ')', ['Setting', 'Seeds', 'Recur'], ck.settings.map(function (x) { return ['K ' + x.setting.k + ', min ' + x.setting.minCount, x.seeds.join(' '), pct(x.recurrence)]; }))]; };
  }
  // ---------- Help ▸ Topic models ----------
  function ul(xs) { return '<ul>' + xs.map(function (x) { return '<li>' + x + '</li>'; }).join('') + '</ul>'; }
  // registered when first opened, since kit/guides.js may load after this file
  T.help = function () { if (SW.guideAdd) SW.guideAdd('topics', GUIDE); if (SW.guide) SW.guide('topics'); };
  var GUIDE = ['Topic models', [
    ['What a topic model is', '<p>A topic model (latent Dirichlet allocation, as MALLET makes it) reads the text cut into documents of a few hundred words and finds groups of words that tend to occur in the same documents. Each group is a <b>topic</b>, a list of words with their probabilities; each document is a mixture of the topics. The topics are found, not given: the model knows nothing of meaning, and a topic is named by the reader who reads its words and the passages that carry it.</p>' +
      '<p>The bench’s models are made by <b>mallette</b>, MALLET’s topic model in JavaScript, which gives the same model as MALLET for the same documents, settings and seed, in any browser.</p>'],
    ['The models', ul([
      '<b>1 Models</b> lists the bench’s published models and your own. Each shows how it was made: which documents, how many topics, the seed, the words left out (stopwords, short words, words seen fewer than a minimum), where its text came from, and the check behind it.',
      'A model has an id, such as <span class="mono">M-771c6b</span>, made from its settings and documents. “Topic 3 of M-771c6b” means the same topic for every reader; cite a topic so.',
      '<b>Run a model of your own</b>: it is trained in the background in this browser and kept here; export it to share it, import one shared with you. The same settings give the same model the bench would make.',
      'A warning on a model’s card means the text has changed since it was made, so its documents may no longer point at the right lines.'])],
    ['Reading the topics', ul([
      '<b>2 Topics</b>: each topic’s twenty most probable words and its share of the text. <b>Coherence</b> (nearer 0 is higher) is how far its top words occur in the same documents; <b>exclusivity</b> how far they belong to it more than to other topics. A topic low on both is often a mixture of the common words of a passage.',
      '<b>3 Documents and topics</b>: the mean share of each topic in each part of the text. <b>4 A topic through the text</b>: its share of each document in reading order, and the documents that carry most of it, with a link to read them.',
      '<b>5 A word’s topics</b> and <b>6 A document’s topics</b>. A word the model left out (a stopword, a rare or short word) has none.',
      '<b>7 A selection’s topics</b>: select a passage in Read or Book and choose 🧩 Topics, or paste one. Its topics are inferred on the model in use, which is not changed. A short passage, or one in words the model does not hold, gives a rough answer; the count of its words the model holds is shown.'])],
    ['Across the stages', ul([
      '<b>8 Across the stages</b> infers each choice of a set (each stage of a manuscript, say) on the model in use, so every stage is read in the same topics: the change from stage to stage is a change in the text, not in the model.',
      'The model’s topics are those of the text it was trained on. A theme that was in an early stage and cut before the text the model read has no topic of its own; its words are spread across topics that do not fit it. A model of the early stage, compared with this one, is the way to look for such themes.',
      'A share resting on few words (less than one document’s worth of the model’s words) is marked ◌, and should be read as uncertain.'])],
    ['How far to trust a topic', ul([
      'The model is found by sampling, from a seed. Another seed can give other topics. <b>9 Steadiness across seeds</b> shows, for the model as it was made, how far its topics recurred when it was trained with other seeds. A topic found by most seeds is the text’s; one found by one seed is the sampler’s.',
      'Two topics are taken to be the same when the cosine of their word probabilities reaches a threshold; the threshold is set from how closely topics that recur across seeds of the same text match (shown with the check). The overlap of their top twenty words (Jaccard) is given beside it.',
      'Topics are a reading aid. A finding rests on the passages, which the topics only point to.'])]
  ]];

  SW.views.topics = { show: draw };
})(typeof window !== 'undefined' ? window : globalThis);
