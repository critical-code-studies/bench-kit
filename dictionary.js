/*
 * dictionary.js - dictionaries for a bench: a word looked up in the dictionaries the bench names,
 * from the text (📕 Look up, on a selection in Read and Book) or in bulk for a lens; and a list of
 * word frequencies beside them, since what is rare is a matter of use, not of being in a dictionary.
 * SW.BENCH.dictionaries: [{ id, name, short, url | base, credit, licence, entryURL }]
 *   url        one file holding the whole dictionary, fetched when first wanted (a bench's own
 *              selection, as the words of its texts that the dictionary has)
 *   base       a folder of shards for a large one: index.json, then a file to each two first letters
 *              (ab.json, …; _.json for the rest), each fetched when a word in it is first wanted
 *   credit     HTML shown with every entry; entryURL(head) a link to the source's own entry, if any
 * A dictionary file: { kind: 'bench-kit-dictionary', name, source, licence, entries: { word: [entry] } }
 * (a shard is { entries }; index.json the same without entries, with shards: [key]); the words are
 * keys in lower case, an entry is { head, pos, etym, field: [label], senses: [text] }, plain text.
 * tools/dict-build.js makes them (Webster's 1913 from Project Gutenberg's text, or a JSON list).
 * SW.BENCH.wordFreq: { url, name, credit }: a file { kind: 'bench-kit-frequencies', name, source,
 * licence, scale: 'zipf', words: { word: n } }.
 * SW.dict: forms(word) and shardOf(word) (pure); list(); load() (every one-file dictionary and the
 * shards' indexes, and the frequencies); lookup(word) and lookupMany(words) (promises, fetching the
 * shards needed); lookupNow(word), from what is loaded (a lens's thousands of words, after
 * lookupMany or load); zipf(word); show(words, x, y); selActs().
 * A result: { word, found: [{ dict, as, how, entries }] }, as the form found and how it was reached
 * ('as written', or 'from walked': a lemma of the word looked up).
 * Settings ▸ Dictionaries turns each off or on (dict.off: [id]), kept in this browser.
 * Part of bench-kit (github.com/critical-code-studies/bench-kit).
 */
(function (root) {
  'use strict';
  var SW = root.SW = root.SW || {};
  var D = SW.dict = {};

  // ---------- pure parts ----------
  // The forms of a word to try, in order: as written (in lower case), then simple English lemmas,
  // modern and archaic: 's; -men to -man (seamen, Englishmen); -ies, -ied to -y; -es, -s; -ed, -d; -ing; -ly, -ily; -ness; -er, -est,
  // -ier, -iest; -eth, -est (thou walkest, he walketh); each with a final e put back, and a doubled
  // consonant undone (stopped, stop). No lemma shorter than three letters.
  D.forms = function (word) {
    var w = String(word || '').toLowerCase().replace(/[’`]/g, "'").replace(/^[^a-z]+|[^a-z']+$/g, '').replace(/'$/, '');
    var out = [], seen = Object.create(null);   // no object's own names: constructor is a word
    function add(f, how) { if (f && f.length >= (how === 'as written' ? 1 : 3) && /^[a-z][a-z'-]*$/.test(f) && !seen[f]) { seen[f] = 1; out.push({ w: f, how: how }); } }
    if (!w) return out;
    add(w, 'as written');
    var from = 'from ' + w, s = w.replace(/'s$/, '');
    if (s !== w) add(s, from);
    function stem(t) {   // a stem, with an e put back and a doubled consonant undone
      add(t, from); add(t + 'e', from);
      if (/([bcdfgklmnprstvz])\1$/.test(t)) add(t.slice(0, -1), from);
    }
    var m;
    if ((m = /^(.+)men$/.exec(s))) add(m[1] + 'man', from);
    if ((m = /^(.+)ies$/.exec(s)) || (m = /^(.+)ied$/.exec(s)) || (m = /^(.+)ier$/.exec(s)) || (m = /^(.+)iest$/.exec(s)) || (m = /^(.+)ily$/.exec(s))) add(m[1] + 'y', from);
    if ((m = /^(.+)es$/.exec(s))) add(m[1], from);
    if ((m = /^(.+[^s])s$/.exec(s))) add(m[1], from);
    if ((m = /^(.+)ed$/.exec(s))) stem(m[1]);
    if ((m = /^(.+e)d$/.exec(s))) add(m[1], from);
    if ((m = /^(.+)ing$/.exec(s))) stem(m[1]);
    if ((m = /^(.+)ly$/.exec(s))) add(m[1], from);
    if ((m = /^(.+)ness$/.exec(s))) add(m[1], from);
    if ((m = /^(.+)eth$/.exec(s))) stem(m[1]);
    if ((m = /^(.+)est$/.exec(s))) stem(m[1]);
    if ((m = /^(.+)er$/.exec(s))) stem(m[1]);
    return out;
  };
  // the shard a word is in: its first two letters, or _ for a word that does not begin with two
  D.shardOf = function (word) { var k = String(word || '').toLowerCase().replace(/[^a-z]/g, '').slice(0, 2); return k.length === 2 ? k : '_'; };
  // a word in a dictionary's entries (a map of word to entries): the first of its forms found
  D.find = function (entries, word, has) {
    var fs = D.forms(word);
    for (var i = 0; i < fs.length; i++) {
      var e = entries(fs[i].w);
      if (e && e.length) return { as: fs[i].w, how: fs[i].how, entries: e };
      if (e === undefined && has) return undefined;   // a shard not yet loaded: not known
    }
    return null;
  };

  if (typeof document === 'undefined') return;
  var B = SW.BENCH || {}, esc = SW.esc;
  var held = {}, index = {}, shards = {}, freq = null, loading = {};
  function all() { return (B.dictionaries || []).filter(function (d) { return d && d.id && (d.url || d.base); }); }
  function off() { var o = SW.store.get('dict.off', []); return Array.isArray(o) ? o : []; }
  D.list = function () { var o = off(); return all().filter(function (d) { return o.indexOf(d.id) < 0; }); };
  D.any = function () { return all().length > 0; };

  function fetchJSON(url) {
    if (!loading[url]) loading[url] = fetch(url).then(function (r) { if (!r.ok) throw new Error(url + ': ' + r.status); return r.json(); })
      .catch(function (e) { delete loading[url]; throw e; });
    return loading[url];
  }
  function folder(d) { return d.base.replace(/\/?$/, '/'); }
  // a dictionary ready to be asked: its one file, or its index
  function ready(d) {
    if (d.url) return held[d.id] ? Promise.resolve() : fetchJSON(d.url).then(function (j) { held[d.id] = j.entries || {}; });
    return index[d.id] ? Promise.resolve() : fetchJSON(folder(d) + 'index.json').then(function (j) { index[d.id] = j; shards[d.id] = shards[d.id] || {}; });
  }
  function shard(d, k) {
    var ss = shards[d.id];
    if (ss[k]) return Promise.resolve();
    if (index[d.id].shards && index[d.id].shards.indexOf(k) < 0) { ss[k] = {}; return Promise.resolve(); }
    return fetchJSON(folder(d) + k + '.json').then(function (j) { ss[k] = j.entries || {}; }, function () { ss[k] = {}; });
  }
  // a word's entries in a dictionary, from what is held: undefined where its shard is not (own
  // properties only, so that a word such as constructor is not taken for an object's)
  var own = Object.prototype.hasOwnProperty;
  function get(m, w) { return m && own.call(m, w) && Array.isArray(m[w]) ? m[w] : null; }
  function entriesOf(d) {
    return function (w) {
      if (d.url) return get(held[d.id], w);
      var ss = shards[d.id] || {}, k = D.shardOf(w);
      return ss[k] ? get(ss[k], w) : undefined;
    };
  }
  D.load = function () {
    var ps = D.list().map(ready);
    var wf = B.wordFreq;
    if (wf && wf.url && !freq) ps.push(fetchJSON(wf.url).then(function (j) { freq = j.words || {}; }, function () { freq = {}; }));
    return Promise.all(ps.map(function (p) { return p.catch(function () {}); }));
  };
  // the shards a set of words needs, in each sharded dictionary
  function need(words) {
    return Promise.all(D.list().map(function (d) {
      return ready(d).then(function () {
        if (d.url) return;
        var ks = {};
        words.forEach(function (w) { D.forms(w).forEach(function (f) { ks[D.shardOf(f.w)] = 1; }); });
        return Promise.all(Object.keys(ks).map(function (k) { return shard(d, k); }));
      }).catch(function () {});
    }));
  }
  D.lookupNow = function (word) {
    var found = [];
    D.list().forEach(function (d) { var r = D.find(entriesOf(d), word, !d.url); if (r) { r.dict = d; found.push(r); } });
    return { word: word, found: found };
  };
  D.lookup = function (word) { return need([word]).then(function () { return D.lookupNow(word); }); };
  D.lookupMany = function (words) {
    return need(words).then(function () { var out = {}; words.forEach(function (w) { out[w] = D.lookupNow(w); }); return out; });
  };
  // a word's frequency, as the bench's list gives it (Zipf: 7 the commonest, 0 not in the list); null
  // before the list is loaded or where the bench has none
  D.zipf = function (word) { if (!freq) return null; var w = String(word || '').toLowerCase(); return own.call(freq, w) && freq[w] != null ? +freq[w] : 0; };
  D.freqLoaded = function () { return !!freq; };

  // ---------- an entry shown ----------
  D.entryHTML = function (r) {
    var d = r.dict;
    return '<div class="dict-src">' + esc(d.short || d.name) + (r.how !== 'as written' ? ' <span class="faint">· ' + esc(r.as) + ', ' + esc(r.how) + '</span>' : '') + '</div>' +
      r.entries.map(function (e) {
        var link = d.entryURL ? d.entryURL(e.head || r.as) : '';
        return '<div class="dict-entry"><span class="dict-head">' + esc(e.head || r.as) + '</span>' + (e.pos ? ' <i>' + esc(e.pos) + '</i>' : '') +
          (e.field || []).map(function (f) { return ' <span class="dict-field">' + esc(f) + '</span>'; }).join('') +
          (e.senses && e.senses.length ? '<div class="dict-senses">' + e.senses.map(function (s) { return '<div class="dict-sense">' + esc(s) + '</div>'; }).join('') + '</div>' : '') +
          (e.etym ? '<div class="dict-etym">' + esc(e.etym) + '</div>' : '') + (link ? '<a href="' + esc(link) + '" target="_blank" rel="noopener">the full entry ↗</a>' : '') + '</div>';
      }).join('') + (d.credit ? '<div class="dict-credit">' + d.credit + '</div>' : '');
  };
  // words looked up, by the place they were chosen: each word's entries in every dictionary, its
  // frequency beside it where the bench gives one
  D.show = function (words, x, y) {
    words = words.filter(Boolean).slice(0, 6);
    if (!words.length) return;
    var pop = SW.pop(x, y, '<div class="dict-pop"><p class="hint">Looking up…</p></div>');
    Promise.all([D.load(), D.lookupMany(words)]).then(function (r) {
      var res = r[1];
      var html = words.map(function (w) {
        var z = D.zipf(w), f = res[w].found;
        return '<div class="dict-word"><div class="dict-q"><b>' + esc(w) + '</b>' + (z != null ? ' <span class="faint" title="How common the word is in use (Zipf: 7 the commonest, 3 rare, 0 not in the list)' + (B.wordFreq && B.wordFreq.name ? ': ' + esc(B.wordFreq.name) : '') + '">Zipf ' + (Math.round(z * 10) / 10) + '</span>' : '') + '</div>' +
          (f.length ? f.map(D.entryHTML).join('') : '<p class="hint">In none of the dictionaries' + (D.list().length < all().length ? ' turned on (⚙ Settings ▸ Dictionaries)' : '') + '.</p>') + '</div>';
      }).join('');
      if (pop.isConnected) { pop.innerHTML = '<div class="dict-pop">' + html + '</div>'; }
    }, function (e) { if (pop.isConnected) pop.innerHTML = '<div class="dict-pop"><p class="hint">' + esc(e.message) + '</p></div>'; });
  };
  // the words of the text selected on the page (at most six)
  D.selectedWords = function () {
    return String(window.getSelection() || '').split(/[^A-Za-z’'-]+/).map(function (w) { return w.replace(/^['’-]+|['’-]+$/g, ''); }).filter(function (w) { return /[A-Za-z]{2}/.test(w); }).slice(0, 6);
  };
  // 📕 Look up on a selection bar: the words selected, or nothing where the bench names no dictionary
  D.selActs = function () {
    if (!D.list().length) return [];
    return [['📕 Look up', function () {
      var ws = D.selectedWords(), r = window.getSelection().rangeCount ? window.getSelection().getRangeAt(0).getBoundingClientRect() : null;
      if (!ws.length) { SW.toast('Select a word in the text to look it up.', 3000); return; }
      D.show(ws, r ? r.left : 100, r ? r.bottom : 100);
    }]];
  };

  // ---------- Settings ▸ Dictionaries ----------
  if (all().length && SW.settings && SW.settings.add) {
    SW.settings.addTab('dict', 'Dictionaries', 4);   // after Book, where it has one
    SW.settings.add({
      tab: 'dict',
      html: '<h2>Dictionaries</h2><p class="hint">The dictionaries 📕 Look up asks, on a word selected in the text. Kept in this browser.</p>' +
        all().map(function (d) { return '<label class="check-row"><span><input type="checkbox" data-dict="' + esc(d.id) + '"> ' + esc(d.name) + '</span><span class="hint">' + (d.credit || '') + (d.licence ? ' ' + esc(d.licence) + '.' : '') + '</span></label>'; }).join('') +
        (B.wordFreq ? '<p class="hint">Word frequencies: ' + esc(B.wordFreq.name || '') + (B.wordFreq.credit ? '. ' + B.wordFreq.credit : '') + '</p>' : ''),
      load: function () { var o = off(); SW.$$('[data-dict]').forEach(function (c) { c.checked = o.indexOf(c.dataset.dict) < 0; }); },
      save: function () { SW.store.set('dict.off', SW.$$('[data-dict]').filter(function (c) { return !c.checked; }).map(function (c) { return c.dataset.dict; })); }
    });
  }
})(typeof window !== 'undefined' ? window : globalThis);
