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
 * The tab's parts, each numbered as the lenses are:
 *   1  Models        the bench's published models and the reader's own: each one's settings; run a
 *                    new one, export, import, choose the one in use
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
    var best = groups.slice().sort(function (a, b) { return b.recurrence - a.recurrence || a.setting.k - b.setting.k; })[0];
    var seed = best ? best.runs.slice().sort(function (a, b) { return b.score - a.score || a.seed - b.seed; })[0] : null;
    return {
      rule: 'top ' + n + ' words, Jaccard ' + th + ' or more', threshold: th, words: n,
      settings: groups.map(function (g) { return { setting: g.setting, seeds: g.runs.map(function (r) { return r.seed; }), recurrence: g.recurrence }; }),
      chosen: best ? { setting: best.setting, seed: seed.seed, recurs: seed.recur, others: best.runs.length - 1 } : null
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
    var th = o.threshold != null ? o.threshold : 0.3, n = o.words || 20, top = o.docs || 5;
    function side(x, y) {
      return x.topics.map(function (t, k) {
        var A = new Set(topWords(t, n)), best = -1, bj = 0;
        y.topics.forEach(function (u, j) { var Bw = topWords(u, n), inter = 0; Bw.forEach(function (w) { if (A.has(w)) inter++; }); var jac = inter / (A.size + Bw.length - inter); if (jac > bj) { bj = jac; best = j; } });
        return { k: k, partner: bj >= th ? best : null, best: best, jaccard: Math.round(bj * 1000) / 1000, words: topWords(t, 10) };
      });
    }
    function carriers(m, k) {
      return m.documents.map(function (d, i) { return { id: d.id, meta: d.meta, p: m.theta[i][k] }; }).sort(function (x, y) { return y.p - x.p; }).slice(0, top);
    }
    var ab = side(a, b), ba = side(b, a);
    return {
      rule: 'top ' + n + ' words, Jaccard ' + th + ' or more', threshold: th, words: n, model: a.id, other: b.id, otherName: b.name || null,
      topics: ab, others: ba,
      unmatched: ab.filter(function (x) { return x.partner == null; }).map(function (x) { return { k: x.k, best: x.best, jaccard: x.jaccard, words: x.words, documents: carriers(a, x.k) }; }),
      unmatchedOthers: ba.filter(function (x) { return x.partner == null; }).map(function (x) { return { k: x.k, best: x.best, jaccard: x.jaccard, words: x.words }; })
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
    if (m.check && m.check.chosen) add('Chosen from', m.check.settings.map(function (x) { return 'K ' + x.setting.k + (x.setting.minCount ? ', min ' + x.setting.minCount : '') + ' (' + Math.round(100 * x.recurrence) + '% recur)'; }).join('; ') + ', over ' + (m.check.chosen.others + 1) + ' seeds each');
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
  var main = SW.$('#view-read') && SW.$('#view-read').parentNode;
  if (main && !SW.$('#view-topics')) main.appendChild(SW.el('section', { class: 'view', id: 'view-topics' }));
  SW.kitViews = (SW.kitViews || []).concat('topics');   // among the shell's views, whatever list the bench sets after this file

  var PARTS = [[1, 'Models', 'The bench’s models and your own: run one, export it, choose the one in use']];
  var part = 1;
  function draw() {
    var view = SW.$('#view-topics'); if (!view) return;
    view.innerHTML = '';
    var pad = SW.el('div', { class: 'pad', style: 'max-width:none' });
    var head = SW.el('div', { class: 'toolbar an-head', style: 'position:static;padding:0 0 10px' });
    head.innerHTML = '<b class="an-title">' + esc(C.label || 'Topics') + '</b>' +
      (PARTS.length > 1 ? '<span class="seg-btns">' + PARTS.map(function (p) { return '<button class="btn' + (p[0] === part ? ' on' : '') + '" data-tp="' + p[0] + '">' + esc(p[1]) + '</button>'; }).join('') + '</span>' : '') +
      '<span class="hint an-desc">' + esc(PARTS.filter(function (p) { return p[0] === part; })[0][2]) + '.</span>';
    head.addEventListener('click', function (e) { var t = e.target.closest('[data-tp]'); if (t) { part = +t.dataset.tp; draw(); } });
    var cards = SW.el('div', { class: 'cards' });
    pad.appendChild(head); pad.appendChild(cards); view.appendChild(pad);
    if (part === 1) models(cards);
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
  SW.views.topics = { show: draw };
})(typeof window !== 'undefined' ? window : globalThis);
