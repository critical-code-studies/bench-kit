#!/usr/bin/env node
/*
 * tools/topics.js - a topic model for a bench to publish. It opens the bench in headless Chrome and
 * asks it for its documents (SW.BENCH.topics.documents, with the bench's stopwords), trains a model
 * with mallette (kit/mallette.js) in node for every setting and seed asked for, prints how far the
 * topics of each setting recur across its seeds, and writes the model chosen, only that one, to
 * <bench>/topics/<id>.json, with the check in it. The bench then lists it in its config
 * (topics.models). The same documents, settings and seed give the same model every time.
 * Run from the bench's repository:
 *
 *   node research/kit/tools/topics.js --set reading
 *   node research/kit/tools/topics.js --set reading --k 8,12 --min-count 2,3 --seeds 1,2,3,4,5 --write auto
 *   node research/kit/tools/topics.js --set stage --choice 33 --k 12 --seeds 1 --write k=12,min=3,seed=1
 *
 *   --set, --choice     the documents (one of the bench's topics.sets, and its choice: a stage…)
 *   --k, --min-count, --seeds   the settings tried, each a list (12; 3; 1,2,3,4,5)
 *   --iterations (1000), --optimize (20), --min-length (3), --chunk (400)
 *   --write auto        the setting whose topics recur most (the fewer topics on a tie), at its
 *                       steadiest seed; or --write k=8,min=3,seed=2. Without --write, nothing is written.
 *   --compare <file>    another model file (topics/M-….json): the two models' topics matched both ways
 *                       by the cosine of their word probabilities, at the threshold this model's seed
 *                       check calibrated (--threshold to give one), every topic's best partner listed,
 *                       with Jaccard on the top 20 words beside it; written into this one as `compare`
 *   --note "…"          a note kept in the file (what the model is, and how far it goes)
 *   --name "…"          the model's name in the file;   --out <folder> (topics);   --dir <bench folder>
 * The file records where its documents came from (SW.BENCH.topics.source(): the bench's version and
 * its sources' commits) and their fingerprint, so the Topics tab can say when the text has changed.
 *
 * Needs Google Chrome or Chromium and Node 22; no packages.
 * Part of bench-kit (github.com/critical-code-studies/bench-kit).
 */
'use strict';
const fs = require('fs');
const path = require('path');
const C = require('./chrome.js');
const T = require('../topics.js');

const argv = process.argv.slice(2);
function opt(k, d) { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : d; }
function list(k, d) { return String(opt(k, d)).split(',').map((x) => +x).filter((x) => !isNaN(x)); }
const dir = C.benchDir(argv, 'topics');
const set = opt('--set', 'text'), choice = opt('--choice', null);
const Ks = list('--k', '12'), mins = list('--min-count', '3'), seeds = list('--seeds', '1,2,3,4,5');
const base = { iterations: +opt('--iterations', 1000), optimizeInterval: +opt('--optimize', 20), minLength: +opt('--min-length', 3), chunk: +opt('--chunk', 400) };
const given = opt('--threshold', null);
const write = opt('--write', null), out = path.join(dir, opt('--out', 'topics')), name = opt('--name', null), note = opt('--note', null), against = opt('--compare', null);

(async () => {
  console.log('Reading the documents from the bench (' + dir + ')…');
  const got = await C.withBench({ dir, wait: 240 }, (page) => page.evaluate(`(async () => {
    const C = SW.BENCH.topics || {};
    if (!C.documents) throw new Error('the bench gives no SW.BENCH.topics.documents');
    const S = (C.sets || []).filter((x) => x.id === ${JSON.stringify(set)})[0] || {};
    const q = { set: ${JSON.stringify(set)}, chunk: ${base.chunk} };
    if (S.param) q[S.param] = ${choice == null ? 'undefined' : JSON.stringify(isNaN(+choice) ? choice : +choice)};
    let label = S.label || ${JSON.stringify(set)};
    if (S.choices && q[S.param] !== undefined) { const ch = await S.choices(); const m = ch.filter((x) => String(x[0]) === String(q[S.param]))[0]; if (m) label += ': ' + m[1]; }
    const stop = C.stopwords || (SW.BENCH.textstats || {}).stopwords || (SW.textstats && SW.textstats.STOP) || null;
    const docs = await C.documents(q);
    const source = C.source ? C.source() : { bench: SW.VERSION };
    return JSON.stringify({ docs, param: S.param || null, label, source, stop: stop ? [].concat(Array.isArray(stop) ? stop : Object.keys(stop)) : null });
  })()`).then(JSON.parse));
  const docs = got.docs;
  const stopwords = got.stop ? 'the bench\'s (' + got.stop.length + ' words)' : 'MALLET\'s English list';
  const common = Object.assign({}, base, { set, param: got.param, choice: choice == null ? undefined : (isNaN(+choice) ? choice : +choice), choiceLabel: got.label, documents: got.label,
    stopwordList: got.stop || undefined, stopwords, stopwordsHash: T.hash(got.stop || require('../mallette.js').STOPLIST), name });
  console.log(docs.length + ' documents (' + got.label + '); stopwords: ' + stopwords);
  const runs = [];
  for (const k of Ks) for (const minCount of mins) for (const seed of seeds) {
    const s = Object.assign({}, common, { k, minCount, seed }), t0 = Date.now();
    const run = T.train(docs, s);
    runs.push({ setting: { k, minCount }, seed, topics: run.result.topics.map((t) => t.words.map((w) => w[0])), model: run.model, run, s });
    process.stdout.write('  K ' + k + ', min ' + minCount + ', seed ' + seed + ': ' + (Date.now() - t0) + ' ms\n');
  }
  const check = T.check(runs);
  console.log('\nHow far the topics recur across the seeds:');
  if (check.cosine) console.log('  cosine at ' + check.cosine.threshold + ' or more (' + check.cosine.calibration + '); beside it, Jaccard ' + check.threshold + ' on the top ' + check.words + ' words');
  console.log('  K   min  seeds  recur (cosine)  recur (Jaccard)');
  check.settings.forEach((x) => console.log('  ' + String(x.setting.k).padEnd(4) + String(x.setting.minCount).padEnd(5) + String(x.seeds.length).padEnd(7) + (x.recurrenceCos != null ? Math.round(100 * x.recurrenceCos) + '%' : '').padEnd(16) + Math.round(100 * x.recurrence) + '%'));
  if (check.chosen) {
    const c = check.chosen;
    console.log('\nSteadiest: K ' + c.setting.k + ', min ' + c.setting.minCount + ', seed ' + c.seed + '. Each topic, in how many of the other ' + c.others + ' seeds it recurs:');
    const r = runs.filter((x) => x.seed === c.seed && x.setting.k === c.setting.k && x.setting.minCount === c.setting.minCount)[0];
    r.topics.forEach((ws, i) => console.log('  ' + String(i + 1).padStart(2) + '  ' + c.recurs[i] + '/' + c.others + '  ' + ws.slice(0, 8).join(' ')));
  }
  if (!write) { console.log('\nNothing written. Give --write auto, or --write k=…,min=…,seed=…, to write the model.'); return; }
  let pick;
  if (write === 'auto') pick = check.chosen && { k: check.chosen.setting.k, min: check.chosen.setting.minCount, seed: check.chosen.seed };
  else { pick = {}; write.split(',').forEach((kv) => { const [a, b] = kv.split('='); pick[a] = +b; }); }
  const r = pick && runs.filter((x) => x.setting.k === pick.k && x.setting.minCount === (pick.min != null ? pick.min : x.setting.minCount) && x.seed === pick.seed)[0];
  if (!r) C.fail('topics', 'no run with ' + write + ' among those trained');
  const same = check.chosen && check.chosen.seed === r.seed && check.chosen.setting.k === r.setting.k && check.chosen.setting.minCount === r.setting.minCount;
  const chosen = Object.assign({}, check, { chosen: { setting: r.setting, seed: r.seed, recurs: same ? check.chosen.recurs : r.recurCos || r.recur || null, recursJaccard: same ? check.chosen.recursJaccard : r.recur || null, others: seeds.length - 1, by: write } });
  const extra = { check: chosen, source: got.source, fingerprint: T.fingerprint(docs) };
  if (note) extra.note = note;
  const file = T.file(r.run, docs, r.s, extra);
  if (against) {
    const other = JSON.parse(fs.readFileSync(path.resolve(against), 'utf8'));
    file.compare = T.compare(file, other, given != null ? { threshold: +given } : {});
    const X = file.compare;
    console.log('\nCompared with ' + other.id + ': cosine (threshold ' + X.threshold + ', from ' + X.thresholdFrom + '), Jaccard on the top 20 words beside it. Every topic, best partner first:');
    X.topics.forEach((u) => console.log('  ' + String(u.k + 1).padStart(2) + ' → its ' + String(u.best + 1).padStart(2) + '  cos ' + u.cosine.toFixed(3) + (u.matched === false ? ' (below)' : '        ') + '  jac ' + u.jaccard.toFixed(2) + '  ' + u.words.slice(0, 7).join(' ')));
    console.log('  and its topics against this one:');
    X.others.forEach((u) => console.log('  ' + String(u.k + 1).padStart(2) + ' → our ' + String(u.best + 1).padStart(2) + '  cos ' + u.cosine.toFixed(3) + (u.matched === false ? ' (below)' : '        ') + '  jac ' + u.jaccard.toFixed(2) + '  ' + u.words.slice(0, 7).join(' ')));
  }
  fs.mkdirSync(out, { recursive: true });
  const fp = path.join(out, file.id + '.json');
  fs.writeFileSync(fp, JSON.stringify(file));
  console.log('\nWrote ' + fp + ' (' + Math.round(fs.statSync(fp).size / 1024) + ' KB). List it in the bench\'s config:');
  console.log("  topics: { models: [{ id: '" + file.id + "', name: '" + (name || 'K ' + r.setting.k + ', ' + got.label) + "', url: '" + path.relative(dir, fp).split(path.sep).join('/') + "' }] }");
})().catch((e) => C.fail('topics', e.message));
