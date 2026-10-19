/*
 * paratexts.js - the project's paratexts: scans, clippings, photographs, documents,
 * recordings and links. Part of bench-kit (github.com/critical-code-studies/bench-kit).
 *
 * They are kept in a private repository of their own (SW.BENCH.paratexts: org/repo),
 * shared with the crew: a catalogue (catalogue.json, one record per item) and the
 * files (files/, each named by its code, P-XXXXX). The bench reads and writes it
 * through GitHub's API with each member's own token, limited to that repository
 * (⚙ Settings), as annotations use each member's Hypothesis token.
 */
(function (root) {
  'use strict';
  var SW = root.SW, P = SW.paratexts = {};
  // The bench's own settings, from its config.js (see the kit's README)
  var B = SW.BENCH || {}, BP = B.paratexts || {}, EX = B.examples || {}, BNAME = B.name || 'research';
  var ORG = BP.org, RNAME = BP.repo, REPO = ORG + '/' + RNAME, API = 'https://api.github.com/repos/' + REPO;
  function plus(t) { return encodeURIComponent(t).replace(/%20/g, '+'); }
  var cat = null, catSha = null, urls = {}, view = null, done = false;
  var F = SW.store.get('px.filt', {}) || {};
  function token() { return String(SW.store.get('gh.token', '') || '').trim(); }
  P.configured = function () { return !!token(); };
  // A token form with everything filled in but the repository (GitHub's links cannot choose that)
  var TOKEN_URL = 'https://github.com/settings/personal-access-tokens/new?name=' + plus(BP.tokenName || BNAME + ' research bench') + '&description=' + plus('Paratexts in the ' + BNAME + ' research bench (' + RNAME + ')') + '&target_name=' + ORG + '&expires_in=366&contents=write';
  var STEPS = 'Paratexts in the ' + BNAME + ' research bench: setting up\n\n1. Accept the invitation to the ' + ORG + ' organisation on GitHub (sent by email).\n2. Open ' + TOKEN_URL + '\n   The name, owner, expiry and permission are filled in.\n3. Under Repository access choose Only select repositories, then ' + RNAME + '.\n4. Generate token, copy it, and paste it into the bench: ⚙ Settings, Paratexts (' + SW.BASE_URI + '?tab=paratexts).\n\nThe token stays in your browser; keep it to yourself.';

  // ---------- GitHub ----------
  function gh(method, path, body, accept) {
    var h = { Authorization: 'Bearer ' + token(), Accept: accept || 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' };
    if (body) h['Content-Type'] = 'application/json';
    return fetch(API + path, { method: method, headers: h, body: body ? JSON.stringify(body) : undefined, cache: 'no-store' }).then(function (r) {
      if (r.ok) return accept === 'application/vnd.github.raw' ? r.blob() : r.status === 204 ? null : r.json();
      var why = r.status === 401 ? 'The GitHub token was refused: check it in ⚙ Settings.' :
        r.status === 403 ? 'GitHub refused: the token may lack write access to ' + REPO + ', or the rate limit is reached.' :
        r.status === 404 ? 'Not found: the token may not reach ' + REPO + ' (ask to be added to the crew).' :
        r.status === 409 || r.status === 422 ? 'conflict' : 'GitHub: ' + r.status;
      var e = new Error(why); e.status = r.status; throw e;
    });
  }
  function b64utf8(s) { var b = new TextEncoder().encode(s), t = ''; for (var i = 0; i < b.length; i += 0x8000) t += String.fromCharCode.apply(null, b.subarray(i, i + 0x8000)); return btoa(t); }
  function utf8b64(s) { var bin = atob(String(s).replace(/\s/g, '')), b = new Uint8Array(bin.length); for (var i = 0; i < bin.length; i++) b[i] = bin.charCodeAt(i); return new TextDecoder().decode(b); }
  function fileB64(file) {
    return new Promise(function (ok, no) { var r = new FileReader(); r.onload = function () { ok(String(r.result).replace(/^data:[^,]*,/, '')); }; r.onerror = no; r.readAsDataURL(file); });
  }
  // Kept in this browser's cache (Cache Storage, cleared when the token is taken out): the files, each
  // fetched from GitHub once, and the catalogue, shown at once and checked with GitHub behind it.
  var CACHE = BP.cache + '-1', CK = 'https://' + BP.cache + '.invalid/';
  function store() { try { return root.caches ? caches.open(CACHE) : Promise.reject(); } catch (e) { return Promise.reject(e); } }
  function cacheGet(key) { return store().then(function (c) { return c.match(CK + key); }).catch(function () { return null; }); }
  function cachePut(key, body, type) { store().then(function (c) { return c.put(CK + key, new Response(body, { headers: { 'Content-Type': type } })); }).catch(function () {}); }
  P.forgetCache = function () { try { if (root.caches) caches.delete(CACHE); } catch (e) { /* none */ } };
  function keepCat() { cachePut('catalogue.json', JSON.stringify({ sha: catSha, cat: cat }), 'application/json'); }
  function fetchCat() { return gh('GET', '/contents/catalogue.json').then(function (r) { catSha = r.sha; cat = JSON.parse(utf8b64(r.content)); cat.items = cat.items || []; keepCat(); return cat; }); }
  P.load = function (force) {
    if (cat && !force) return Promise.resolve(cat);
    if (force) return fetchCat();
    return cacheGet('catalogue.json').then(function (r) { return r ? r.json() : null; }).then(function (k) {
      if (!k || !k.cat || cat) return cat || fetchCat();
      cat = k.cat; cat.items = cat.items || []; catSha = k.sha;
      var was = k.sha;
      fetchCat().then(function () { if (catSha !== was) refresh(); }, function (e) {   // GitHub's answer, behind the copy shown
        if (e.status === 401 || e.status === 404) { P.forgetCache(); cat = null; SW.toast(e.message, 6000); done = false; if (SW.state.tab === 'paratexts') render(); }
      });
      return cat;
    }, function () { return fetchCat(); });
  };
  // A change to the catalogue: made on the newest copy, and made again if someone saved in between
  function save(message, change, tries) {
    tries = tries || 0;
    return P.load(true).then(function () {
      change(cat);
      return gh('PUT', '/contents/catalogue.json', { message: message, content: b64utf8(JSON.stringify(cat, null, 1) + '\n'), sha: catSha });
    }).then(function (r) { catSha = r.content.sha; keepCat(); return cat; }, function (e) {
      if (e.message === 'conflict' && tries < 3) return save(message, change, tries + 1);
      throw e;
    });
  }
  // One blob URL per file, not per record: an alternate carries its record's code, so keying the
  // cache by code alone handed every translation the original's text.
  function ukey(it) { return it.code + '|' + (it.file || ''); }
  var inflight = {};   // a file being fetched: a second request for it waits on the first
  function blobOf(it) {
    if (urls[ukey(it)]) return Promise.resolve(urls[ukey(it)]);
    if (!it.file) return Promise.reject(new Error('A linked item: nothing held here.'));
    if (inflight[ukey(it)]) return inflight[ukey(it)];
    var p = blobOf0(it);
    inflight[ukey(it)] = p;
    return p.then(function (u) { delete inflight[ukey(it)]; return u; }, function (e) { delete inflight[ukey(it)]; throw e; });
  }
  // Fetching ahead: once an item is open, the items either side of it (in the list it came from
  // and in each sequence it is in) and its small alternates are fetched quietly, one at a time,
  // into the browser's cache, so Back, Next and a switch of reading open at once. Large files
  // (over 25 MB; an alternate over 5 MB) are left to be fetched when asked for.
  var aheadQ = [], aheadOn = false;
  function fetchAhead(list) {
    list.forEach(function (x) { if (x && x.file && (x.size || 0) < 25e6 && !urls[ukey(x)] && aheadQ.indexOf(x) < 0) aheadQ.push(x); });
    if (aheadOn) return; aheadOn = true;
    (function next() {
      var x = aheadQ.shift(); if (!x) { aheadOn = false; return; }
      blobOf(x).then(function () { setTimeout(next, 150); }, function () { setTimeout(next, 150); });
    })();
  }
  function blobOf0(it) {
    var key = 'files/' + it.file + '?' + (it.size || 0);
    return cacheGet(key).then(function (hit) { return hit ? hit.blob() : null; }).then(function (b) {
      if (b) return b;
      return gh('GET', '/contents/' + it.file.split('/').map(encodeURIComponent).join('/'), null, 'application/vnd.github.raw').then(function (b2) {
        cachePut(key, b2, it.mime || b2.type || 'application/octet-stream'); return b2;
      });
    }).then(function (b) {
      if (it.mime && b.type !== it.mime) b = b.slice(0, b.size, it.mime);
      return (urls[ukey(it)] = URL.createObjectURL(b));
    });
  }
  function newCode() {
    var have = {}; (cat ? cat.items : []).forEach(function (it) { have[it.code] = 1; });
    var A = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ', c;
    do { c = 'P-'; for (var i = 0; i < 5; i++) c += A[Math.floor(Math.random() * 36)]; } while (have[c]);
    return c;
  }
  function me() { return SW.me().initials || '?'; }
  function now() { return new Date().toISOString().replace(/\.\d+Z$/, 'Z'); }

  // ---------- collections ----------
  // In the catalogue: collections [{id, name, parent, created, by}], nested by parent ('' at the
  // top); an item's collections [ids]. An item can be in several collections, or in none.
  function colls() { return (cat && cat.collections) || []; }
  function coll(id) { return id ? colls().filter(function (c) { return c.id === id; })[0] || null : null; }
  function parentOf(c) { return c.parent && coll(c.parent) ? c.parent : ''; }
  function kidsOf(pid) { return colls().filter(function (c) { return parentOf(c) === (pid || ''); }).sort(function (a, b) { return a.name.toLowerCase() < b.name.toLowerCase() ? -1 : 1; }); }
  function treeOrder() {
    var out = [], seen = {};
    (function walk(pid, d) { kidsOf(pid).forEach(function (c) { if (seen[c.id]) return; seen[c.id] = 1; out.push({ c: c, depth: d }); walk(c.id, d + 1); }); })('', 0);
    colls().forEach(function (c) { if (!seen[c.id]) out.push({ c: c, depth: 0 }); });   // a loop left by two people at once
    return out;
  }
  function isUnder(a, b) { for (var c = coll(a), k = 0; c && k < 50; c = coll(c.parent), k++) if (c.id === b) return true; return false; }
  function pathOf(id) { var p = []; for (var c = coll(id), k = 0; c && k < 50; c = coll(parentOf(c)), k++) p.unshift(c); return p; }
  function pathName(id) { return pathOf(id).map(function (c) { return c.name; }).join(' › '); }
  function inColl(it) { return (it.collections || []).filter(function (id) { return coll(id); }); }
  function inC() { return !!coll(F.c); }
  function collId() { var c; do { c = 'c' + Math.random().toString(36).slice(2, 8); } while (coll(c)); return c; }
  function treeOpts(excl) {
    excl = excl || [];
    return treeOrder().filter(function (o) { return excl.indexOf(o.c.id) < 0; }).map(function (o) { return '<option value="' + SW.esc(o.c.id) + '">' + '   '.repeat(o.depth) + SW.esc(o.c.name) + '</option>'; }).join('');
  }

  // Corpora: a bulk body of material taken in as a set (one collector's, or one search's), kept in the catalogue but out of the
  // default list, so that it cannot crowd out the paratexts proper. An item with no `corpus`
  // is a paratext, which is every item until one is deliberately put in a corpus; a corpus is
  // declared once on the catalogue as `corpora: [{ id, name, note }]`. Nothing else is scoped
  // by it: a code resolves whatever its corpus (byCode reads the whole catalogue), Related and
  // sequence links open across corpora, Withdrawn and the Tag, Type, Language and Kind menus
  // cover all of them, and the export writes every corpus.
  var PX_NAME = 'Paratexts';
  function corpora() { return (cat && cat.corpora) || []; }
  function corpusDef(id) { return id ? corpora().filter(function (c) { return c.id === id; })[0] || null : null; }
  function corpusOf(it) { return String(it.corpus || ''); }
  function corpusName(id) { return !id ? PX_NAME : (corpusDef(id) || {}).name || ('Undeclared corpus \u201c' + id + '\u201d'); }
  function corpusNote(id) { return !id ? '' : (corpusDef(id) || {}).note || ''; }
  // An id that no `corpora` entry declares is an error: it is listed in the menu with ⚠ and
  // marked on the item.
  function corpusBad(it) { var id = corpusOf(it); return !!id && !corpusDef(id); }
  function corpusing() { return corpora().length > 0 || (cat ? cat.items : []).some(function (it) { return !!corpusOf(it); }); }
  // An item has one home, its `corpus` (or the paratexts). A corpus may also list, in `also`,
  // paratexts that belong to its set: its view shows them beside its own items, and they stay
  // paratexts, so the default view and its counts are unchanged. A code in `also` that is not in
  // the catalogue is skipped, as Related skips one; a code whose item has a corpus of its own is
  // an error, marked ⚠.
  function alsoOf(id) { var d = corpusDef(id); return d && Array.isArray(d.also) ? d.also : []; }
  function inAlso(it, id) { return !!id && alsoOf(id).indexOf(it.code) >= 0; }
  function alsoBad(it, id) { return inAlso(it, id) && !!corpusOf(it) && corpusOf(it) !== id; }
  function inCorpus(it) { var cur = F.corpus || ''; return F.corpus === '_all' || corpusOf(it) === cur || inAlso(it, cur); }
  function inCorpusId(it, id) { return corpusOf(it) === id || inAlso(it, id); }
  // every corpus id declared or in use, declared ones first, each with its live count (its own
  // items and the paratexts it also lists, each once) and how many of each
  function corporaIn() {
    var lv = (cat ? cat.items : []).filter(live), seen = {}, out = [];
    corpora().forEach(function (c) {
      seen[c.id] = 1;
      var own = lv.filter(function (it) { return corpusOf(it) === c.id; }).length, listed = lv.filter(function (it) { return corpusOf(it) !== c.id && inAlso(it, c.id); });
      var px = listed.filter(function (it) { return !corpusOf(it); }).length;
      out.push({ id: c.id, name: c.name, note: c.note || '', n: own + listed.length, own: own, also: px, nbad: listed.length - px, bad: listed.length > px });
    });
    lv.forEach(function (it) { var id = corpusOf(it); if (id && !seen[id]) { seen[id] = 1; var n = lv.filter(function (x) { return corpusOf(x) === id; }).length; out.push({ id: id, name: corpusName(id), note: '', n: n, own: n, also: 0, bad: true, undeclared: true }); } });
    return out;
  }
  // the item's home, marked where it differs from the corpus in view: on an item from another
  // corpus, and (as Paratexts) on a paratext a corpus also lists
  function chipFor(it, title) {
    var id = corpusOf(it), bad = corpusBad(it) || alsoBad(it, F.corpus || '');
    return '<span class="px-cx' + (bad ? ' px-cx-bad' : '') + '" title="' + SW.esc(title || (corpusBad(it) ? 'This item names a corpus the catalogue does not declare in corpora.' : alsoBad(it, F.corpus || '') ? 'Listed in this corpus\u2019s also, but its home is another corpus.' : (corpusNote(id) || corpusName(id)))) + '">' + SW.esc(corpusName(id)) + '</span>';
  }
  function corpusChip(it) {
    var home = corpusOf(it), cur = F.corpus || '';
    if (home === cur) return '';
    if (!home && (cur === '' || F.corpus === '_all')) return '';
    return chipFor(it, !home ? 'A paratext, listed in this corpus too' : '');
  }
  // the same mark on a link to an item (Related, a sequence's rows), shown whenever the item's
  // home is a corpus
  function homeChip(it) { return it && corpusOf(it) ? chipFor(it) : ''; }

  // A change to the catalogue, shown at once and then saved (made again on the newest copy)
  var busyN = 0;
  function busy(d) { busyN += d; var el = view && SW.$('.px-busy', view); if (el) el.textContent = busyN ? 'Saving…' : ''; }
  function prep(c) { c.items = c.items || []; c.collections = c.collections || []; }
  function change(label, fn) {
    if (me() === '?') return SW.askInitials('Changes to the paratexts are signed with your initials, and none are set.').then(function (ini) { return ini ? change(label, fn) : false; });
    try { prep(cat); fn(cat); } catch (e) { /* shown again after the save */ }
    refresh(); busy(1);
    return save(label + ', by ' + me(), function (c) { prep(c); fn(c); }).then(function () { busy(-1); refresh(); return true; }, function (e) {
      busy(-1); SW.toast(e.message, 6000);
      return P.load(true).then(function () { refresh(); return false; }, function () { return false; });
    });
  }
  function who(codes) { return codes.length === 1 ? 'Paratext ' + codes[0] : 'Paratexts ' + (codes.length <= 3 ? codes.join(', ') : codes[0] + ' and ' + (codes.length - 1) + ' more'); }
  function each(codes, fn) { return function (c) { c.items.forEach(function (x) { if (codes.indexOf(x.code) >= 0) fn(x); }); }; }
  function put(x, id) { var l = (x.collections || []).slice(); if (l.indexOf(id) < 0) l.push(id); x.collections = l; }
  function take(x, id) { if (!x.collections) return; x.collections = x.collections.filter(function (k) { return k !== id; }); if (!x.collections.length) delete x.collections; }
  function addTo(codes, id) { var c0 = coll(id); if (!c0 || !codes.length) return Promise.resolve(false); return change(who(codes) + ': into “' + c0.name + '”', each(codes, function (x) { put(x, id); })); }
  function outOf(codes, id) { var c0 = coll(id); if (!c0 || !codes.length) return Promise.resolve(false); return change(who(codes) + ': out of “' + c0.name + '”', each(codes, function (x) { take(x, id); })); }
  function moveTo(codes, from, to) { var a = coll(from), b = coll(to); if (!a || !b) return addTo(codes, to); return change(who(codes) + ': moved from “' + a.name + '” to “' + b.name + '”', each(codes, function (x) { take(x, from); put(x, to); })); }
  function newColl(name, parent, codes) {
    var id = collId(); codes = codes || [];
    return change('Paratexts: collection “' + name + '” made' + (codes.length ? ', with ' + codes.length : ''), function (c) {
      if (!c.collections.some(function (x) { return x.id === id; })) c.collections.push({ id: id, name: name, parent: parent || '', created: now(), by: me() });
      c.items.forEach(function (x) { if (codes.indexOf(x.code) >= 0) put(x, id); });
    }).then(function () { return id; });
  }
  function renameColl(id, name) { var c0 = coll(id); if (!c0 || c0.name === name) return; change('Paratexts: collection “' + c0.name + '” renamed “' + name + '”', function (c) { c.collections.forEach(function (x) { if (x.id === id) x.name = name; }); }); }
  function nest(id, parent) {
    var c0 = coll(id); if (!c0 || (c0.parent || '') === parent) return;
    if (parent === id || isUnder(parent, id)) { SW.toast('A collection cannot go inside itself.', 3000); return; }
    var p = coll(parent);
    change('Paratexts: collection “' + c0.name + '” ' + (p ? 'moved into “' + p.name + '”' : 'moved to the top'), function (c) { c.collections.forEach(function (x) { if (x.id === id) x.parent = parent; }); });
  }
  function delColl(id) {
    var c0 = coll(id); if (!c0) return;
    var n = cat.items.filter(function (it) { return inColl(it).indexOf(id) >= 0; }).length, sub = kidsOf(id).length;
    if (!confirm('Delete the collection “' + c0.name + '”?' + (n ? ' Its ' + n + ' item' + (n > 1 ? 's stay' : ' stays') + ' in the catalogue.' : '') + (sub ? ' The collections inside it move up a level.' : ''))) return;
    if (F.c === id) setF('c', parentOf(c0));
    change('Paratexts: collection “' + c0.name + '” deleted', function (c) {
      var me0 = c.collections.filter(function (x) { return x.id === id; })[0], p = me0 ? me0.parent || '' : '';
      c.collections = c.collections.filter(function (x) { return x.id !== id; });
      c.collections.forEach(function (x) { if (x.parent === id) x.parent = p; });
      c.items.forEach(function (x) { take(x, id); });
    });
  }

  // Withdrawing: behind ⋯, with a reason (kept in the record) and the code, or the number, typed to
  // confirm. The file stays in the repository; Withdrawn lists them, to bring back.
  // the item's file and where it is held, under ☰: Download, GitHub ↗ (its history), Open ↗ (a
  // linked item, where it is held), Source ↗ (the original, in its archive)
  function fileMenu(it, gh0) {
    var esc = SW.esc, items = (it.file ? '<a data-a="dl" download="' + esc(it.name || it.code) + '">⤓ Download' + (altList(it).length ? ' ' + esc(altLabels(it)[0].toLowerCase()) : '') + '</a><a data-a="gh" href="' + esc(gh0) + '" target="_blank" rel="noopener" title="On GitHub, with its history">GitHub ↗</a>' :
      okURL(it.url) ? '<a href="' + esc(it.url.trim()) + '" target="_blank" rel="noopener" title="Where it is held">Open ↗</a>' : '') +
      (okURL(it.archiveUrl) ? '<a href="' + esc(it.archiveUrl.trim()) + '" target="_blank" rel="noopener" title="The original, in ' + esc(it.archive || 'its archive') + '">Source ↗</a>' : '');
    return items ? '<details class="px-more px-filemenu"><summary class="btn ghost" title="Download it, see it on GitHub, or go to the original" aria-label="The file and where it is held">☰</summary><div class="px-menu">' + items + '</div></details>' : '';
  }
  function moreMenu(inner) { return '<details class="px-more"><summary class="btn ghost" title="More">⋯</summary><div class="px-menu">' + inner + '</div></details>'; }
  function unwithdraw(x) { delete x.withdrawn; delete x.withdrawnBy; delete x.withdrawnWhy; x.updated = now(); x.updatedBy = me(); }
  function withdrawBox(codes, after) {
    if (!codes.length) return;
    var esc = SW.esc, one = codes.length === 1, key = one ? codes[0] : String(codes.length), d = SW.el('dialog', { class: 'tray-big px-dlg px-wdbox' });
    d.innerHTML = '<div class="tray-bighead"><b>Withdraw ' + (one ? esc(codes[0]) : codes.length + ' paratexts') + ' from the list</b><span class="refhelp-acts"><button class="icon-btn" data-x title="Close (Esc)">✕</button></span></div>' +
      '<ul class="px-wdlist">' + codes.map(function (c) { var it = byCode(c); return '<li><span class="mono">' + esc(c) + '</span> ' + esc(it ? it.title : '') + '</li>'; }).join('') + '</ul>' +
      '<p>' + (one ? 'It leaves' : 'They leave') + ' the list for the whole crew. ' + (one ? 'Its file stays' : 'Their files stay') + ' in the repository, with ' + (one ? 'its' : 'their') + ' history, and ' + (one ? 'it' : 'they') + ' can be brought back from Withdrawn.</p>' +
      '<label class="px-wdf"><span>Why</span><input class="px-why" placeholder="A reason, kept with the record"></label>' +
      '<label class="px-wdf"><span>To confirm, type ' + (one ? 'its code' : 'the number') + ', <b class="mono">' + esc(key) + '</b></span><input class="px-key" autocomplete="off"></label>' +
      '<div class="px-acts"><button class="btn ghost" data-x>Cancel</button><button class="btn px-danger" data-a="go" disabled>Withdraw</button> <span class="hint px-msg"></span></div>';
    document.body.appendChild(d);
    d.addEventListener('close', function () { d.remove(); });
    d.showModal();
    var why = SW.$('.px-why', d), k = SW.$('.px-key', d), go = SW.$('[data-a="go"]', d);
    why.focus();
    function ok() { return why.value.trim() && k.value.trim().toUpperCase() === key.toUpperCase(); }
    d.addEventListener('input', function () { go.disabled = !ok(); });
    d.addEventListener('click', function (e) {
      if (e.target.closest('[data-x]')) { d.close(); return; }
      if (!e.target.closest('[data-a="go"]') || !ok()) return;
      var r = why.value.trim(); go.disabled = true;
      d.close(); if (after) after();
      change(who(codes) + ': withdrawn (' + r + ')', each(codes, function (x) { x.withdrawn = now(); x.withdrawnBy = me(); x.withdrawnWhy = r; x.updatedBy = me(); }))
        .then(function (done0) { if (done0) SW.toast((one ? codes[0] : codes.length + ' paratexts') + ' withdrawn: Withdrawn, on the left, lists ' + (one ? 'it' : 'them'), 5000); });
    });
  }

  // ---------- the view ----------
  var V = root.SWVersions;
  var VW = Object.assign({ mode: 'grid', size: 'm', sort: 'date', dir: 1 }, SW.store.get('px.view', {}) || {});
  var sel = {}, lastPick = null, cur = [], editing = null, dragI = null, dragC = null;
  function setView(o) { Object.assign(VW, o); SW.store.set('px.view', VW); }
  function setF(k, v) { F[k] = v; SW.store.set('px.filt', F); }
  function vShort(id) { var v = V.byId(id); return v ? (v.label.indexOf(BNAME + ' ') === 0 ? v.label.slice(BNAME.length + 1) : v.label) : id; }
  function live(it) { return !it.withdrawn; }
  function base() {
    var all = cat ? cat.items : [];
    if (F.c === '_wd') return all.filter(function (it) { return it.withdrawn; });
    all = all.filter(live);
    if (F.c === '_none') return all.filter(function (it) { return !inColl(it).length; });
    if (inC()) return all.filter(function (it) { return inColl(it).indexOf(F.c) >= 0; });
    return all;
  }
  var SORTS = [['date', 'Date made', 1], ['title', 'Title', 1], ['added', 'Accessioned (newest)', -1], ['rating', 'Rating', -1], ['code', 'Code', 1], ['size', 'Size', -1], ['creator', 'Creator', 1], ['genre', 'Type', 1], ['kind', 'Kind', 1]];
  function defDir(k) { var s = SORTS.filter(function (x) { return x[0] === k; })[0]; return s ? s[2] : 1; }
  function sortKey(it, k) {
    if (k === 'date') return String(it.date || '9999');
    if (k === 'rating') { var a = avg(it); return a ? a.avg : -1; }
    if (k === 'size') return it.size || 0;
    if (k === 'genre') return ((genreOf(it) || [])[1] || '~').toLowerCase();
    if (k === 'added') return (it.accessioned || String(it.added || '').slice(0, 10)) + (it.added || '');
    return String(it[k] || '').toLowerCase();
  }
  // an item passes the filters (all but `skip`, to count what that one filter hides)
  function passes(it, skip) {
      if (skip !== 'corpus' && F.c !== '_wd' && !inCorpus(it)) return false;
      if (skip !== 'tag' && F.tag && (it.tags || []).indexOf(F.tag) < 0) return false;
      if (skip !== 'v' && F.v && (it.versions || []).indexOf(F.v) < 0) return false;
      if (skip !== 'kind' && F.kind && it.kind !== F.kind) return false;
      if (skip !== 'genre' && F.genre && it.genre !== F.genre) return false;
      if (skip !== 'lang' && F.lang && readIn(it).indexOf(F.lang) < 0) return false;   // its own language or a translation's
      if (F.q) { var t = [it.code, it.title, (genreOf(it) || [])[1], langOfRec(it) ? langLabel(langOfRec(it)) : '', it.date, it.creator, it.source, it.archive, it.archiveId, it.publisher, (it.contributor || []).join(' '), it.coverage, it.url, altList(it).map(function (a) { return [a.lang, a.label, a.note, a.by].filter(Boolean).join(' '); }).join(' '), it.description, (it.tags || []).join(' '), it.name, inColl(it).map(pathName).join(' '), gapHay(it), gapHay(it, true)].join(' ').toLowerCase(); if (t.indexOf(F.q.toLowerCase()) < 0) return false; }
      return true;
  }
  function shown() {
    var k = VW.sort, d = VW.dir || 1;
    return base().filter(function (it) { return passes(it); }).sort(function (a, b) {
      var x = sortKey(a, k), y = sortKey(b, k); if (x < y) return -d; if (x > y) return d;
      var t = String(a.title).toLowerCase(), u = String(b.title).toLowerCase(); return t < u ? -1 : t > u ? 1 : 0;
    });
  }
  var ICON = { pdf: '📄', image: '🖼', text: '📝', software: '⌨', audio: '🔊', video: '🎞', link: '🔗', file: '📎', other: '📎', missing: '❔' };
  // What each filter hides: the items that would show were that one filter cleared, so a reader
  // who finds nothing (or less than they expect) is told which filter is in the way, and can
  // clear just that one. A search is never counted as the culprit, and nothing is reset.
  function hiddenBy(nShown) {
    if (F.c === '_wd') return [];
    var b = base(), out = [];
    function lab(k) {
      if (k === 'tag') return 'Tag: ' + F.tag;
      if (k === 'v') return 'Version: ' + vShort(F.v);
      if (k === 'genre') return 'Type: ' + ((genreOf({ genre: F.genre }) || [])[1] || F.genre);
      if (k === 'lang') return 'Language: ' + langLabel(F.lang);
      if (k === 'kind') return 'Kind: ' + F.kind;
      if (k === 'corpus') return 'Corpus: ' + corpusName(F.corpus || '') + ' only';
      return k;
    }
    ['corpus', 'tag', 'v', 'genre', 'lang', 'kind'].forEach(function (k) {
      // the corpus is in force at its default too, where '' means the paratexts only; it is told
      // only while something narrows the list (a search, a filter, a collection), since the
      // left panel and the menu already give each corpus's count
      if (k === 'corpus' ? !corpusing() || F.corpus === '_all' || !(F.q || F.tag || F.v || F.genre || F.lang || F.kind || (F.c && F.c !== '_wd')) : !F[k]) return;
      var n = b.filter(function (it) { return passes(it, k); }).length - nShown;
      if (n > 0) out.push({ k: k, label: lab(k), n: n });
    });
    if (F.c && F.c !== '_wd') {   // the collection open on the left is a filter too
      var n = cat.items.filter(live).filter(inCorpus).filter(function (it) { return passes(it); }).length - nShown;
      if (n > 0) out.push({ k: 'c', label: F.c === '_none' ? 'Not in a collection' : 'Collection: ' + ((coll(F.c) || {}).name || ''), n: n });
    }
    return out;
  }
  function hiddenHTML(h, empty) {
    var esc = SW.esc;
    if (!h.length) return '';
    return h.map(function (x) { return (empty ? '' : ' · ') + '<b>' + x.n + (empty ? (x.n > 1 ? ' matches are' : ' match is') : ' more') + ' hidden by ' + esc(x.label) + '</b> <button class="btn ghost px-clearf" data-px="clearf" data-k="' + x.k + '">Clear ' + esc(x.label.split(':')[0]) + '</button>'; }).join(empty ? ' ' : '') +
      (h.length > 1 || empty ? ' <button class="btn ghost px-clearf" data-px="clearf" data-k="*">Clear all</button>' : '');
  }
  function thumb(it) { return it.kind === 'image' && urls[ukey(it)] ? '<img alt="" src="' + urls[ukey(it)] + '">' : ICON[it.kind] || ICON.file; }
  function fmtSize(n) { return !n ? '' : n < 1024 ? n + ' bytes' : n < 1e6 ? Math.round(n / 1024) + ' KB' : (n / 1048576).toFixed(1) + ' MB'; }
  function render() {
    view = SW.$('#view-paratexts'); if (!view) return;
    done = true;
    var esc = SW.esc;
    view.innerHTML = '<div class="pad px"><div class="px-head"><h2>Paratexts</h2><button class="icon-btn px-ib" aria-expanded="false" title="About Paratexts">ⓘ</button></div><p class="hint px-lede" hidden>The scans, clippings, photographs and documents around the program, kept for the crew in a private repository (' + esc(REPO) + '). Click one to read it; add with ＋. To link to one from an annotation, note or finding, write its code (P-XXXXX).</p><div class="px-body"></div></div>';
    var body = SW.$('.px-body', view), ib = SW.$('.px-ib', view), lede = SW.$('.px-lede', view);
    ib.onclick = function () { lede.hidden = !lede.hidden; ib.setAttribute('aria-expanded', String(!lede.hidden)); };
    if (!P.configured()) {
      body.innerHTML = '<div class="px-howto"><p>The paratexts are in a private repository for the crew. To open them here, the bench needs a GitHub token of your own, limited to that repository. Four steps, once:</p><ol>' +
        '<li>Be a member of the <b>' + ORG + '</b> organisation on GitHub: ask to be added if you are not, and accept the invitation GitHub emails you. (A token cannot reach the repository for someone added to it alone, as an outside collaborator.)</li>' +
        '<li><a class="btn" href="' + SW.esc(TOKEN_URL) + '" target="_blank" rel="noopener">Open the token form ↗</a> Its name, owner (' + ORG + '), a year’s expiry and the permission it needs (Contents, read and write) are filled in.</li>' +
        '<li>Under <b>Repository access</b>, choose <b>Only select repositories</b>, then <b>' + RNAME + '</b>: the one choice the link cannot make. If GitHub asks for a reason, “the ' + BNAME + ' research bench” will do.</li>' +
        '<li><b>Generate token</b>, copy it, and paste it into ⚙ Settings, Paratexts. It stays in this browser only; on another computer, paste it there too.</li></ol>' +
        '<p><button class="btn" data-px="settings">Open ⚙ Settings</button> <button class="btn ghost" data-copy="' + SW.esc(STEPS) + '" title="These steps as text, to send to someone joining the crew">Copy the steps</button></p></div>';
      body.onclick = function (e) { if (e.target.closest('[data-px="settings"]')) SW.settings ? SW.settings.open('px') : SW.$('#btn-settings') && SW.$('#btn-settings').click(); };
      return;
    }
    body.innerHTML = '<p class="hint">Opening the catalogue…</p>';
    P.load().then(function () { paint(body); }, function (e) { body.innerHTML = '<p class="badge err">' + esc(e.message) + '</p>'; });
  }
  function paint(body) {
    var esc = SW.esc, items = cat.items.filter(live);
    if (F.c && F.c.charAt(0) !== '_' && !coll(F.c)) setF('c', '');
    var tags = [], vids = [], kinds = [];
    items.forEach(function (it) { (it.tags || []).forEach(function (g) { if (tags.indexOf(g) < 0) tags.push(g); }); (it.versions || []).forEach(function (v) { if (vids.indexOf(v) < 0) vids.push(v); }); if (kinds.indexOf(it.kind) < 0) kinds.push(it.kind); });
    tags.sort(); vids.sort(function (a, b) { return ((V.byId(a) || {}).sort || 0) - ((V.byId(b) || {}).sort || 0); });
    function opt(v, l, cur0) { return '<option value="' + esc(v) + '"' + (v === cur0 ? ' selected' : '') + '>' + esc(l) + '</option>'; }
    // the languages the catalogue has, by name
    function languagesIn() { var have = {}; items.forEach(function (it) { readIn(it).forEach(function (l) { have[l] = 1; }); }); return Object.keys(have).map(function (l) { return [l, langLabel(l)]; }).sort(function (a, b) { return a[1].localeCompare(b[1]); }); }
    // the types the catalogue has, in the vocabulary's order
    function genresIn() { syncTypes(); var have = {}; items.forEach(function (it) { if (it.genre) have[it.genre] = 1; }); return Object.keys(GENRE_BY).filter(function (g) { return have[g]; }).map(function (g) { return GENRE_BY[g]; }).concat(Object.keys(have).filter(function (g) { return !GENRE_BY[g]; }).map(function (g) { return [g, g]; })); }
    function seg(act, v, label, on, tip) { return '<button class="' + (on ? 'on' : '') + '" data-px="' + act + '" data-v="' + v + '" title="' + tip + '">' + label + '</button>'; }
    body.innerHTML = '<div class="px-shell"><nav class="px-nav" aria-label="Collections"></nav><div class="px-main">' +
      '<div class="toolbar px-bar" style="position:static;padding-left:0">' +
      (corpusing() ? '<label class="check" title="Which body of material to list. A search still reports what it finds in the others.">Corpus <select data-f="corpus">' + opt('', PX_NAME, F.corpus || '') +
        corporaIn().map(function (c) { return opt(c.id, (c.bad ? '⚠ ' : '') + c.name + ' (' + c.n + ')', F.corpus || ''); }).join('') + opt('_all', 'Every corpus', F.corpus || '') + '</select></label>' : '') +
      '<input type="search" data-f="q" placeholder="Find (code, title, words)" value="' + esc(F.q || '') + '">' +
      '<label class="check">Tag <select data-f="tag">' + opt('', 'All', F.tag || '') + tags.map(function (g) { return opt(g, g, F.tag); }).join('') + '</select></label>' +
      '<label class="check">Version <select data-f="v">' + opt('', 'All', F.v || '') + vids.map(function (v) { return opt(v, vShort(v), F.v); }).join('') + '</select></label>' +
      '<label class="check" title="What the items are">Type <select data-f="genre">' + opt('', 'All', F.genre || '') + genresIn().map(function (g) { return opt(g[0], g[1], F.genre); }).join('') + '</select></label>' +
      (languagesIn().length > 1 || F.lang ? '<label class="check" title="The languages it can be read in: its own, and any translation held beside it (a card marks a translation)">Language <select data-f="lang">' + opt('', 'All', F.lang || '') + languagesIn().map(function (l) { return opt(l[0], l[1], F.lang); }).join('') + '</select></label>' : '') +
      '<label class="check" title="The format of the file, or how a link shows">Kind <select data-f="kind">' + opt('', 'All', F.kind || '') + kinds.map(function (k) { return opt(k, k, F.kind); }).join('') + '</select></label>' +
      '<label class="check">Sort <select data-px="sort">' + SORTS.map(function (s) { return opt(s[0], s[1], VW.sort); }).join('') + '</select></label>' +
      '<span class="px-seg">' + seg('view', 'grid', '▦', VW.mode !== 'list', 'Grid') + seg('view', 'list', '☰', VW.mode === 'list', 'List') + '</span>' +
      (VW.mode !== 'list' ? '<span class="px-seg">' + seg('size', 's', 'S', VW.size === 's', 'Small') + seg('size', 'm', 'M', VW.size === 'm', 'Medium') + seg('size', 'l', 'L', VW.size === 'l', 'Large') + '</span>' : '') +
      '<span class="hint px-count"></span><span class="hint px-busy">' + (busyN ? 'Saving…' : '') + '</span>' +
      '<button class="btn ghost" data-px="reload" title="Read the catalogue again (others may have added)">↻</button></div>' +
      '<div class="px-list"></div></div></div>';
    paintNav(body); paintList(body); wire(body);
  }
  function paintNav(body) {
    var nav = SW.$('.px-nav', body); if (!nav) return;
    var esc = SW.esc, lv = cat.items.filter(live).filter(inCorpus), wd = cat.items.filter(function (it) { return !live(it); }).length;
    function row(id, icon, label, n, extra, depth, cls) {
      var isC = !!coll(id);
      return '<div class="px-coll' + ((F.c || '') === id ? ' on' : '') + (cls ? ' ' + cls : '') + '" data-c="' + esc(id) + '"' + (isC ? ' draggable="true"' : '') + ' style="--d:' + (depth || 0) + '" tabindex="0" title="' + esc(isC ? pathName(id) + ': drag items here to put them in it, or drag the collection onto another' : label) + '">' +
        '<span class="px-cn">' + icon + ' ' + esc(label) + '</span><span class="px-cnt">' + n + '</span>' + (extra || '') + '</div>';
    }
    function editRow(depth, val) { return '<div class="px-coll px-cedit" style="--d:' + depth + '"><input class="px-cin" value="' + esc(val) + '" placeholder="Its name, then Enter"></div>'; }
    var tree = treeOrder().map(function (o) {
      var c = o.c, n = lv.filter(function (it) { return inColl(it).indexOf(c.id) >= 0; }).length;
      if (editing && editing.mode === 'ren' && editing.id === c.id) return editRow(o.depth, c.name);
      var r = row(c.id, '📁', c.name, n, '<span class="px-cact"><button class="icon-btn" data-px="subc" title="A collection inside “' + esc(c.name) + '”">＋</button><button class="icon-btn" data-px="ren" title="Rename">✎</button><button class="icon-btn" data-px="delc" title="Delete the collection (its items stay in the catalogue)">✕</button></span>', o.depth);
      if (editing && editing.mode === 'new' && editing.parent === c.id) r += editRow(o.depth + 1, '');
      return r;
    }).join('');
    nav.innerHTML = '<button class="btn px-addbtn" data-px="add" title="Upload a file with its details, to the crew’s repository">＋ Add an item</button>' + row('', '▤', 'All', lv.length) + row('_none', '◌', 'Not in a collection', lv.filter(function (it) { return !inColl(it).length; }).length) +
      (corpusing() ? '<div class="px-ch"><span>Corpora</span></div>' +
        [{ id: '', name: PX_NAME, note: 'The paratexts proper: every item not put in a corpus.', n: cat.items.filter(live).filter(function (it) { return !corpusOf(it); }).length, bad: false }].concat(corporaIn()).map(function (c) {
          var tip = c.undeclared ? 'Not declared in the catalogue\u2019s corpora.' : (c.note ? c.note + ' ' : '') + (c.also || c.nbad ? c.own + ' of its own and ' + c.also + ' ' + (c.also === 1 ? 'paratext' : 'paratexts') + ' listed in it' + (c.nbad ? '; ⚠ ' + c.nbad + ' listed in its also ' + (c.nbad === 1 ? 'has' : 'have') + ' another corpus as home' : '') + '.' : '');
          return '<div class="px-coll px-corow' + ((F.corpus || '') === c.id ? ' on' : '') + (c.bad ? ' px-cx-bad' : '') + '" data-corpus="' + esc(c.id) + '" tabindex="0" title="' + esc(tip.trim() || c.name) + '"><span class="px-cn">' + (c.bad ? '⚠' : '▤') + ' ' + esc(c.name) + '</span><span class="px-cnt">' + c.n + '</span></div>';
        }).join('') + '<div class="px-coll px-corow' + (F.corpus === '_all' ? ' on' : '') + '" data-corpus="_all" tabindex="0" title="Every item, whatever its corpus"><span class="px-cn">▦ Every corpus</span><span class="px-cnt">' + cat.items.filter(live).length + '</span></div>' : '') +
      '<div class="px-ch"><span>Collections</span><button class="icon-btn" data-px="newc" title="A new collection">＋</button></div>' +
      tree + (editing && editing.mode === 'new' && !editing.parent ? editRow(0, '') : '') +
      (!colls().length && !editing ? '<p class="hint px-navfoot">None yet: ＋ makes one; then drag items onto it, or tick them and Add to.</p>' : '') +
      '<div class="px-ch"><span>Sequences</span><button class="icon-btn" data-px="newseq" title="A new sequence: a fixed order, such as a run of logbooks">＋</button></div>' +
      (seqs().length ? seqs().map(function (q) { return '<div class="px-coll px-seqrow" data-seqopen="' + esc(q.id) + '" tabindex="0" title="' + esc((q.note ? q.note + ' ' : '') + 'Click to edit') + '"><span class="px-cn">⛓ ' + esc(q.name) + '</span><span class="px-cnt">' + seqCodes(q).length + '</span></div>'; }).join('') : '<p class="hint px-navfoot">None yet: ＋ makes one, or tick items and choose ⛓ Sequence.</p>') +
      (wd || F.c === '_wd' ? row('_wd', '⊘', 'Withdrawn', wd, '', 0, 'px-wdrow') : '') +
      (colls().length ? '<p class="hint px-navfoot">Drag items onto a collection to put them in it. From inside a collection a drag moves them; hold ⌥ to add them instead.</p>' : '');
    var inp = SW.$('.px-cin', nav); if (inp) { inp.focus(); inp.select(); }
  }
  function paintList(body) {
    var main = SW.$('.px-list', body); if (!main) return;
    var esc = SW.esc, b = base(); cur = shown();
    Object.keys(sel).forEach(function (k) { if (!cur.some(function (it) { return it.code === k; })) delete sel[k]; });
    var hid = hiddenBy(cur.length), cnt = SW.$('.px-count', body);
    var bc = F.c === '_wd' ? b : b.filter(inCorpus);
    var nAlso = F.corpus && F.corpus !== '_all' && F.c !== '_wd' ? bc.filter(function (it) { return !corpusOf(it) && inAlso(it, F.corpus); }).length : 0;
    if (cnt) cnt.innerHTML = cur.length + ' of ' + bc.length + (corpusing() && F.c !== '_wd' ? ' in ' + SW.esc(F.corpus === '_all' ? 'every corpus' : corpusName(F.corpus || '')) : '') +
      (nAlso ? ', ' + nAlso + ' of them also in ' + SW.esc(PX_NAME) : '') + (cur.length ? hiddenHTML(hid) : '');
    var head = '';
    if (inC()) head = '<div class="px-crumbs"><a data-c="" title="All the paratexts">All</a>' + pathOf(F.c).map(function (c) { return ' › ' + (c.id === F.c ? '<b>' + esc(c.name) + '</b>' : '<a data-c="' + esc(c.id) + '">' + esc(c.name) + '</a>'); }).join('') + '</div>';
    else if (F.c === '_none') head = '<div class="px-crumbs"><b>Not in a collection</b></div>';
    else if (F.c === '_wd') head = '<div class="px-crumbs"><b>Withdrawn</b>: out of the list, their files kept. Tick them and Bring back to restore them.</div>';
    var sub = inC() ? kidsOf(F.c) : [];
    if (sub.length) head += '<ul class="px-folders">' + sub.map(function (c) { var n = cat.items.filter(function (it) { return live(it) && inCorpus(it) && inColl(it).indexOf(c.id) >= 0; }).length; return '<li class="px-folder" data-c="' + esc(c.id) + '" tabindex="0">📁 ' + esc(c.name) + ' <span class="faint">' + n + '</span></li>'; }).join('') + '</ul>';
    main.innerHTML = head + '<div class="px-selbar" hidden></div>' + (cur.length ? (VW.mode === 'list' ? listHTML(cur) : gridHTML(cur)) :
      '<p class="hint px-none">' + (bc.length || hid.length ? 'None with these filters. ' + hiddenHTML(hid, true) : F.c === '_wd' ? 'Nothing withdrawn.' : inC() ? 'Nothing in this collection yet: drag items onto it on the left, or tick them and Add to.' : 'Nothing here.') + '</p>');
    selUpdate(body);
    // the pictures, as they come into view (small ones only: a large scan stays an icon here)
    var io = new IntersectionObserver(function (ents) {
      ents.forEach(function (en) {
        if (!en.isIntersecting) return; io.unobserve(en.target);
        var it = byCode(en.target.closest('[data-code]').dataset.code);
        if (it && it.kind === 'image' && (it.size || 0) < 6e6 && !SW.$('img', en.target)) blobOf(it).then(function (u) { en.target.innerHTML = '<img alt="" src="' + u + '">'; }, function () {});
      });
    }, { rootMargin: '200px' });
    SW.$$('.px-thumb', main).forEach(function (t) { io.observe(t); });
  }
  function collChips(it) { return inColl(it).filter(function (id) { return id !== F.c; }).map(function (id) { return '<span class="px-cl" title="' + SW.esc(pathName(id)) + '">📁 ' + SW.esc(coll(id).name) + '</span>'; }).join(''); }
  function gridHTML(l) {
    var esc = SW.esc;
    return '<ul class="px-grid px-' + esc(VW.size || 'm') + '">' + l.map(function (it) {
      return '<li class="px-card" data-code="' + esc(it.code) + '" tabindex="0" draggable="true" title="Open: ' + esc(it.title) + '"><button class="px-pick" data-pick aria-pressed="false" title="Select (or ⌘-click; ⇧-click for a run)"></button><div class="px-thumb" data-kind="' + esc(it.kind) + '">' + thumb(it) + '</div>' +
        // each thing in its own place on every card, so the eye finds it when scanning: the code and
        // the rating on the top line, the title (three lines at most), the type and date, the tags,
        // and the collections at the foot
        '<div class="px-meta"><div class="px-ctop"><span class="px-code mono">' + esc(it.code) + '</span>' + summary1(it) + '</div>' +
        '<b class="px-ctitle">' + esc(it.title) + '</b>' +
        '<div class="px-cline">' + corpusChip(it) + ((genreOf(it) || [])[1] ? '<span class="px-s px-genre">' + esc(genreOf(it)[1]) + '</span>' : '') + (it.date ? '<span class="px-cdate">' + esc(it.date) + '</span>' : '') + (it.kind === 'missing' ? '<span class="px-s px-misschip" title="Provenance found but item not available or missing: known to have existed, and the archive holds no copy and no link. The record says where it is cited.">Not available or missing</span>' : '') + trChips(it) + gapChips(it) + '</div>' +
        '<div class="px-tags">' + (it.tags || []).map(function (g) { return '<span class="fd-tag">' + esc(g) + '</span>'; }).join('') + (it.versions || []).map(function (v) { return '<span class="fd-tag px-v">' + esc(vShort(v)) + '</span>'; }).join('') + '</div>' +
        (inColl(it).some(function (id) { return id !== F.c; }) ? '<div class="px-cfoot">' + collChips(it) + '</div>' : '') + '</div></li>';
    }).join('') + '</ul>';
  }
  var COLS = [['code', 'Code'], ['title', 'Title'], ['genre', 'Type'], ['date', 'Made'], ['creator', 'Creator'], ['kind', 'Kind'], ['size', 'Size'], ['rating', '★'], [null, 'Collections'], ['added', 'Accessioned']];
  function listHTML(l) {
    var esc = SW.esc;
    return '<div class="px-tablewrap"><table class="px-table"><thead><tr><th><button class="px-pick" data-px="pickall" aria-pressed="' + l.every(function (it) { return sel[it.code]; }) + '" title="Select all shown"></button></th><th></th>' +
      COLS.map(function (c) { return c[0] ? '<th data-sort="' + c[0] + '" class="' + (VW.sort === c[0] ? 'on' : '') + '" title="Sort by ' + (c[0] === 'rating' ? 'rating' : c[1].toLowerCase()) + '">' + c[1] + (VW.sort === c[0] ? (VW.dir > 0 ? ' ▲' : ' ▼') : '') + '</th>' : '<th>' + c[1] + '</th>'; }).join('') + '</tr></thead><tbody>' +
      l.map(function (it) {
        var a = avg(it);
        return '<tr class="px-row" data-code="' + esc(it.code) + '" tabindex="0" draggable="true"><td><button class="px-pick" data-pick aria-pressed="false" title="Select"></button></td><td><div class="px-thumb px-mini" data-kind="' + esc(it.kind) + '">' + thumb(it) + '</div></td>' +
          '<td class="mono px-code-c">' + esc(it.code) + '</td><td><b>' + esc(it.title) + '</b>' + corpusChip(it) + ((it.tags || []).length ? ' ' + it.tags.map(function (g) { return '<span class="fd-tag">' + esc(g) + '</span>'; }).join(' ') : '') + '</td>' +
          '<td class="px-genre-c">' + esc((genreOf(it) || [])[1] || '') + '</td>' +
          '<td class="num">' + esc(it.date || '') + '</td><td>' + esc(it.creator || '') + '</td><td>' + esc(it.kind || '') + '</td><td class="num">' + fmtSize(it.size) + '</td>' +
          '<td>' + (a ? SW.stars(a.avg, (Math.round(a.avg * 10) / 10) + ' from ' + a.n + ': ' + a.who.join('; ')) : '') + '</td>' +
          '<td>' + inColl(it).map(function (id) { return '<span class="px-cl" title="' + esc(pathName(id)) + '">📁 ' + esc(coll(id).name) + '</span>'; }).join('') + '</td>' +
          '<td class="num">' + esc(it.accessioned || SW.fmtDate(it.added) || '') + '</td></tr>';
      }).join('') + '</tbody></table></div>';
  }
  function selCodes() { return cur.filter(function (it) { return sel[it.code]; }).map(function (it) { return it.code; }); }
  function pick(code, range) {
    var at = function (c) { for (var i = 0; i < cur.length; i++) if (cur[i].code === c) return i; return -1; };
    if (range && lastPick && sel[lastPick]) { var i = at(lastPick), j = at(code); if (i >= 0 && j >= 0) { for (var k = Math.min(i, j); k <= Math.max(i, j); k++) sel[cur[k].code] = 1; lastPick = code; return; } }
    if (sel[code]) delete sel[code]; else sel[code] = 1;
    lastPick = code;
  }
  function selUpdate(body) {
    var esc = SW.esc, n = selCodes().length;
    SW.$$('[data-code]', body).forEach(function (el) { var on = !!sel[el.dataset.code]; el.classList.toggle('sel', on); var p = SW.$('[data-pick]', el); if (p) p.setAttribute('aria-pressed', on); });
    var pa = SW.$('[data-px="pickall"]', body); if (pa) pa.setAttribute('aria-pressed', n > 0 && n === cur.length);
    body.classList.toggle('px-has-sel', n > 0);
    var bar = SW.$('.px-selbar', body); if (!bar) return;
    if (!n) { bar.innerHTML = ''; bar.hidden = true; return; }
    bar.hidden = false;
    var c0 = coll(F.c);
    bar.innerHTML = '<b>' + n + ' selected</b>' + (n < cur.length ? '<button class="btn ghost" data-px="selall">All ' + cur.length + '</button>' : '') +
      (F.c === '_wd' ? '' : '<select data-px="to" title="Put the selected items in a collection"><option value="">Add to a collection…</option>' + treeOpts(c0 ? [c0.id] : []) + '<option value="_new">＋ A new collection…</option></select>') +
      (c0 ? '<button class="btn ghost" data-px="out" title="Take them out of this collection (they stay in the catalogue)">Out of “' + esc(c0.name) + '”</button>' : '') +
      (F.c === '_wd' ? '' : '<span class="px-tagadd"><select data-px="seqpick" title="Put the selected items, in the list’s order, in a sequence">' + seqs().map(function (q) { return '<option value="' + esc(q.id) + '">⛓ ' + esc(q.name) + '</option>'; }).join('') + '<option value="_new">⛓ A new sequence</option></select><button class="btn ghost" data-px="toseq" title="Open the sequence with these added at the end, to order and save">Sequence…</button></span>') +
      '<span class="px-tagadd"><input class="px-tagin" placeholder="A tag"><button class="btn ghost" data-px="tag" title="Add this tag to each">Tag</button></span>' +
      (n === 2 ? '<button class="btn" data-px="sbs" title="The two side by side, to zoom and pan together">Side by side</button>' : '') +
      exportMenu('data-pxx') +
      '<button class="btn ghost" data-px="codes" title="Their codes, to paste into an annotation, note or finding, where each becomes a link">Copy the codes</button>' +
      (F.c === '_wd' ? '<button class="btn" data-px="restore">Bring back</button>' : moreMenu('<button data-px="wd">Withdraw from the list…</button>')) +
      '<button class="icon-btn" data-px="clear" title="Clear the selection">✕</button>';
  }
  function commitEdit(body, val) {
    var ed = editing; editing = null; val = String(val || '').trim();
    if (!ed || !val) { paintNav(body); return; }
    if (ed.mode === 'ren') renameColl(ed.id, val);
    else newColl(val, ed.parent || '');
    paintNav(body);
  }
  function wire(body) {
    var qt = null;
    body.oninput = function (e) { if (e.target.dataset.f === 'q') { clearTimeout(qt); qt = setTimeout(function () { setF('q', e.target.value); paintList(body); }, 300); } };
    body.onchange = function (e) {
      var t = e.target;
      if (t.dataset.f === 'corpus') { setF('corpus', t.value); sel = {}; paint(body); return; }
      if (t.dataset.f) { setF(t.dataset.f, t.value); paintList(body); return; }
      if (t.dataset.px === 'sort') { setView({ sort: t.value, dir: defDir(t.value) }); paintList(body); return; }
      if (t.dataset.px === 'to') {
        var v = t.value, codes = selCodes(); t.value = ''; if (!v || !codes.length) return;
        if (v === '_new') { var nm = prompt('A name for the new collection'); if (nm && nm.trim()) newColl(nm.trim(), '', codes); }
        else addTo(codes, v);
      }
    };
    body.onclick = function (e) {
      var t = e.target, b = t.closest('[data-px]'), act = b && b.dataset.px, crow = t.closest('[data-c]');
      // a star on a card: rated there, without opening it. Its code is data-rcode: data-c names a
      // collection, and a star carrying it was read as a collection's row (0.40.0's card stars)
      var rb = t.closest('[data-cardrate]');
      if (rb) { e.stopPropagation(); rateIt(rb.dataset.rcode, paintStars(rb, 'cardrate')); return; }
      if (act === 'add') { addBox(); return; }
      if (act === 'clearf') { var fk = b.dataset.k; (fk === '*' ? ['tag', 'v', 'genre', 'lang', 'kind', 'c', 'corpus'] : [fk]).forEach(function (x) { setF(x, x === 'corpus' && corpusing() ? '_all' : ''); }); paint(body); return; }
      if (act === 'reload') { body.innerHTML = '<p class="hint">Reading the catalogue again…</p>'; P.load(true).then(function () { paint(body); }, function (err) { body.innerHTML = '<p class="badge err">' + SW.esc(err.message) + '</p>'; }); return; }
      if (act === 'newc') { editing = { mode: 'new', parent: '' }; paintNav(body); return; }
      if (act === 'newseq') { seqEditor(null); return; }
      var sqo = t.closest('[data-seqopen]'); if (sqo) { seqEditor(sqo.dataset.seqopen); return; }
      if (act === 'toseq') { var sv = SW.$('[data-px="seqpick"]', body); seqEditor(sv && sv.value !== '_new' ? sv.value : null, { append: selCodes() }); return; }
      if (act === 'subc' && crow) { editing = { mode: 'new', parent: crow.dataset.c }; paintNav(body); return; }
      if (act === 'ren' && crow) { editing = { mode: 'ren', id: crow.dataset.c }; paintNav(body); return; }
      if (act === 'delc' && crow) { delColl(crow.dataset.c); return; }
      if (act === 'view') { setView({ mode: b.dataset.v }); paint(body); return; }
      if (act === 'size') { setView({ size: b.dataset.v }); paintList(body); SW.$$('[data-px="size"]', body).forEach(function (x) { x.classList.toggle('on', x === b); }); return; }
      if (act === 'selall') { cur.forEach(function (it) { sel[it.code] = 1; }); selUpdate(body); return; }
      if (act === 'pickall') { var all = cur.length && cur.every(function (it) { return sel[it.code]; }); cur.forEach(function (it) { if (all) delete sel[it.code]; else sel[it.code] = 1; }); selUpdate(body); return; }
      if (act === 'clear') { sel = {}; selUpdate(body); return; }
      if (act === 'out') { outOf(selCodes(), F.c); return; }
      if (act === 'tag') { var ti = SW.$('.px-tagin', body), tg = ti && ti.value.trim(); if (!tg) return; var cs = selCodes(); change(who(cs) + ': tagged “' + tg + '”', each(cs, function (x) { x.tags = (x.tags || []).slice(); if (x.tags.indexOf(tg) < 0) x.tags.push(tg); })); return; }
      if (act === 'codes') { SW.copyText(selCodes().join(' '), 'the codes'); return; }
      if (act === 'sbs') { var two = selCodes(); if (two.length === 2) P.sideBySide(two); return; }
      var xb = t.closest('[data-pxx]');
      if (xb) { var xd = xb.closest('details'); if (xd) xd.open = false; var cd = selCodes(); exportItems(xb.dataset.pxx, cd.map(byCode), 'paratexts-' + cd.length); return; }
      if (act === 'wd') { var mm = b.closest('details'); if (mm) mm.open = false; withdrawBox(selCodes(), function () { sel = {}; }); return; }
      if (act === 'restore') { var cr = selCodes(); sel = {}; change(who(cr) + ': brought back', each(cr, unwithdraw)); return; }
      var th = t.closest('th[data-sort]');
      if (th) { var k = th.dataset.sort; setView(VW.sort === k ? { dir: -(VW.dir || 1) } : { sort: k, dir: defDir(k) }); var ss = SW.$('[data-px="sort"]', body); if (ss) ss.value = VW.sort; paintList(body); return; }
      var corow = t.closest('[data-corpus]');
      if (corow) { setF('corpus', corow.dataset.corpus); sel = {}; editing = null; paint(body); return; }
      if (crow && !t.closest('.px-cedit')) { setF('c', crow.dataset.c); sel = {}; editing = null; paintNav(body); paintList(body); return; }
      var card = t.closest('[data-code]'); if (!card) return;
      if (t.closest('[data-pick]') || e.metaKey || e.ctrlKey || e.shiftKey) { pick(card.dataset.code, e.shiftKey); selUpdate(body); return; }
      openItem(card.dataset.code, listCtx());
    };
    body.onkeydown = function (e) {
      var t = e.target, cl = t.classList;
      if (cl && cl.contains('px-cin')) {
        if (e.key === 'Enter') { e.preventDefault(); t.dataset.done = 1; commitEdit(body, t.value); }
        else if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); t.dataset.done = 1; editing = null; paintNav(body); }
        return;
      }
      if (cl && cl.contains('px-tagin') && e.key === 'Enter') { e.preventDefault(); var tb = SW.$('[data-px="tag"]', body); if (tb) tb.click(); return; }
      if (e.key !== 'Enter' && e.key !== ' ') return;
      if (t.matches && t.matches('[data-c], [data-corpus]')) { e.preventDefault(); t.click(); return; }
      if (t.matches && t.matches('[data-code]')) { e.preventDefault(); if (e.key === ' ') { pick(t.dataset.code, e.shiftKey); selUpdate(body); } else openItem(t.dataset.code, listCtx()); }
    };
    body.onfocusout = function (e) { var t = e.target; if (t.classList && t.classList.contains('px-cin') && !t.dataset.done) { t.dataset.done = 1; commitEdit(body, t.value); } };
    // Dragging: items onto a collection (moved from the one shown, or added with ⌥); a collection
    // onto another, or onto All for the top. An item dropped into a text box gives its code.
    function okDrop(el) {
      var id = el.dataset.c;
      if (dragI) return !!coll(id);
      if (dragC) return id === '' || (!!coll(id) && id !== dragC && !isUnder(id, dragC));
      return false;
    }
    function unmark() { SW.$$('.px-drop-on', body).forEach(function (x) { x.classList.remove('px-drop-on'); }); }
    body.ondragstart = function (e) {
      var t = e.target, crow = t.closest && t.closest('.px-coll[data-c]');
      if (crow) { dragC = crow.dataset.c; dragI = null; e.dataTransfer.setData('text/plain', coll(dragC).name); e.dataTransfer.effectAllowed = 'move'; return; }
      var card = t.closest && t.closest('[data-code]'); if (!card) return;
      var code = card.dataset.code; dragI = sel[code] ? selCodes() : [code]; dragC = null;
      e.dataTransfer.setData('text/plain', dragI.join(' ')); e.dataTransfer.effectAllowed = 'copyMove';
      body.classList.add('px-dragging');
    };
    body.ondragend = function () { dragI = dragC = null; body.classList.remove('px-dragging'); unmark(); };
    body.ondragover = function (e) {
      var el = e.target.closest && e.target.closest('[data-c]'); if (!el || !okDrop(el)) return;
      e.preventDefault(); e.dataTransfer.dropEffect = dragI && !(inC() && !e.altKey) ? 'copy' : 'move';
      if (!el.classList.contains('px-drop-on')) { unmark(); el.classList.add('px-drop-on'); }
    };
    body.ondragleave = function (e) { var el = e.target.closest && e.target.closest('[data-c]'); if (el && !el.contains(e.relatedTarget)) el.classList.remove('px-drop-on'); };
    body.ondrop = function (e) {
      var el = e.target.closest && e.target.closest('[data-c]'); if (!el || !okDrop(el)) return;
      e.preventDefault(); unmark();
      var to = el.dataset.c, codes = dragI, cid = dragC; dragI = dragC = null; body.classList.remove('px-dragging');
      if (codes) { sel = {}; (inC() && F.c !== to && !e.altKey ? moveTo(codes, F.c, to) : addTo(codes, to)).then(function (ok) { if (ok) SW.toast(codes.length + (inC() && F.c !== to && !e.altKey ? ' moved to “' : ' put in “') + coll(to).name + '”'); }); }
      else if (cid) nest(cid, to);
    };
  }
  function byCode(c) { return (cat ? cat.items : []).filter(function (it) { return it.code === c; })[0] || null; }

  // ---------- one paratext ----------
  // ---------- what an item is: its type, beside its file's kind ----------
  // A paratext's type (`genre`): what the thing is, not the format of the file that holds it (a
  // memo scanned to PDF is a memo) and not its carrier (`medium`: paper tape, DECtape). Each type is
  // [id, label, DCMI type (null: from the file), CSL type, RIS type], in groups. The kit's list is
  // extended without a release, in two places: SW.BENCH.paratexts.genres in a bench's config
  // ([[group, [[id, label, dcmi, csl, ris]]]]), and the catalogue's own `types` ([{ id, label, group,
  // dcmi, note, by, added }]), which the crew add from the Type picker (＋ New type…). An id already
  // defined keeps its first definition. Retired ids keep a label, for the records that still carry them,
  // and are not offered.
  var KIT_TYPES = [
    ['Published writing', [['article', 'Journal article', 'Text', 'article-journal', 'JOUR'], ['magazine', 'Magazine article', 'Text', 'article-magazine', 'MGZN'],
      ['press', 'Newspaper article', 'Text', 'article-newspaper', 'NEWS'], ['review', 'Review (of a book, film or program)', 'Text', 'review', 'JOUR'],
      ['book', 'Book', 'Text', 'book', 'BOOK'], ['chapter', 'Book chapter', 'Text', 'chapter', 'CHAP'], ['conference', 'Conference paper', 'Text', 'paper-conference', 'CPAPER'],
      ['thesis', 'Thesis or dissertation', 'Text', 'thesis', 'THES'], ['report', 'Technical report', 'Text', 'report', 'RPRT'], ['preprint', 'Preprint or working paper', 'Text', 'article', 'UNPB'],
      ['abstract', 'Abstract or bibliography entry', 'Text', 'article', 'ABST'], ['newsletter', 'Newsletter or bulletin', 'Text', 'article-magazine', 'MGZN']]],
    ['Documentation', [['manual', 'Manual or user guide', 'Text', 'document', 'GEN'], ['writeup', 'Program write-up or description (e.g. DECUS)', 'Text', 'document', 'GEN'],
      ['catalogue', 'Catalogue entry or price list', 'Text', 'document', 'CTLG'], ['spec', 'Specification or standard', 'Text', 'standard', 'STAND']]],
    ['Correspondence and papers', [['letter', 'Letter', 'Text', 'personal_communication', 'PCOMM'], ['memo', 'Memo', 'Text', 'document', 'GEN'],
      ['email', 'Email or direct message', 'Text', 'personal_communication', 'PCOMM'], ['post', 'Newsgroup or mailing-list post (Usenet, ARPANET lists)', 'Text', 'post', 'ELEC'],
      ['notes', 'Notes or notebook', 'Text', 'manuscript', 'MANSCPT'], ['log', 'Log or logbook (operating log, register)', 'Text', 'manuscript', 'MANSCPT'],
      ['minutes', 'Minutes or agenda', 'Text', 'document', 'GEN'], ['proposal', 'Proposal or grant', 'Text', 'document', 'GRANT'],
      ['legal', 'Legal document (filing, deposition, contract)', 'Text', 'legal_case', 'CASE'], ['patent', 'Patent', 'Text', 'patent', 'PAT']]],
    ['Program text', [['listing', 'Program listing (printed)', 'Text', 'document', 'COMP'], ['printout', 'Printout or run output', 'Text', 'document', 'COMP'],
      ['program', 'Program on a carrier (tape, cards, disk: give the Medium)', 'Software', 'software', 'COMP'], ['software', 'Source code file', 'Software', 'software', 'COMP'],
      ['repo', 'Source repository', 'Software', 'software', 'COMP'], ['emulator', 'Emulator or simulation', 'Software', 'software', 'COMP'], ['dataset', 'Dataset', 'Dataset', 'dataset', 'DATA']]],
    ['Promotion and events', [['advert', 'Advertisement', 'Text', 'document', 'GEN'], ['ephemera', 'Brochure or flyer', 'Text', 'document', 'PAMP'],
      ['pressrel', 'Press release', 'Text', 'document', 'GEN'], ['poster', 'Poster', 'StillImage', 'graphic', 'ART'], ['programme', 'Event programme', 'Text', 'document', 'GEN']]],
    ['Images', [['photo', 'Photograph', 'StillImage', 'graphic', 'FIGURE'], ['diagram', 'Drawing, diagram or schematic', 'StillImage', 'figure', 'FIGURE'], ['flowchart', 'Flowchart', 'StillImage', 'figure', 'FIGURE'],
      ['screenshot', 'Screenshot', 'StillImage', 'graphic', 'FIGURE'], ['map', 'Map or plan', 'StillImage', 'map', 'MAP'], ['slides', 'Slides', 'Text', 'document', 'SLIDE']]],
    ['Recordings and their transcripts', [['interview', 'Interview or oral history', null, 'interview', 'SOUND'], ['talk', 'Lecture, talk or panel', null, 'speech', 'GEN'],
      ['broadcast', 'Broadcast (radio or television)', null, 'broadcast', 'VIDEO'], ['film', 'Film', 'MovingImage', 'motion_picture', 'MPCT'],
      ['audio', 'Audio recording', 'Sound', 'song', 'SOUND'], ['video', 'Video recording', 'MovingImage', 'motion_picture', 'VIDEO']]],
    ['Web', [['webpage', 'Web page', 'InteractiveResource', 'webpage', 'ELEC'], ['blog', 'Blog post', 'Text', 'post-weblog', 'BLOG'], ['social', 'Social media post', 'Text', 'post', 'ELEC']]],
    ['Objects and archives', [['hardware', 'Computer or hardware', 'PhysicalObject', 'document', 'GEN'], ['artefact', 'Object or artefact', 'PhysicalObject', 'document', 'GEN'],
      ['exhibit', 'Exhibition or display (physical or online)', null, 'webpage', 'ELEC'], ['findingaid', 'Finding aid or archival description', 'Text', 'document', 'GEN']]],
    ['Other', [['other', 'Other', null, 'document', 'GEN']]]
  ];
  // retired types: shown on the records that carry them, not offered (a transcript takes the type of
  // what it transcribes; a tape or deck of cards is a program, or an object, with its Medium)
  var RETIRED = [['transcript', 'Transcript (older type)', 'Text', 'document', 'GEN'], ['papertape', 'Paper tape (older type)', 'PhysicalObject', 'document', 'GEN'],
    ['cards', 'Punched cards (older type)', 'PhysicalObject', 'document', 'GEN'], ['magtape', 'Magnetic tape or disk (older type)', 'PhysicalObject', 'document', 'GEN']];
  var GENRES = [], GENRE_BY = {}, typesSig = null;
  function addType(group, e) {
    if (!e || !e[0] || GENRE_BY[e[0]]) return;   // an id already defined keeps its first definition
    var g = GENRES.filter(function (x) { return x[0] === group; })[0];
    if (!g) { g = [group, []]; GENRES.splice(GENRES.length - 1, 0, g); }   // a new group, before Other
    g[1].push(e); GENRE_BY[e[0]] = e;
  }
  // the kit's list, then the bench's, then the catalogue's; rebuilt when the catalogue's types change
  function syncTypes() {
    var ct = (cat && cat.types) || [], sig = JSON.stringify(ct);
    if (sig === typesSig) return; typesSig = sig;
    GENRES = KIT_TYPES.map(function (g) { return [g[0], g[1].slice()]; }); GENRE_BY = {};
    GENRES.forEach(function (g) { g[1].forEach(function (e) { GENRE_BY[e[0]] = e; }); });
    ((B.paratexts || {}).genres || []).forEach(function (g) { g[1].forEach(function (e) { addType(g[0], e); }); });
    ct.forEach(function (t) { addType(t.group || 'Added in this archive', [t.id, t.label || t.id, t.dcmi || null, t.csl || 'document', t.ris || 'GEN']); });
    RETIRED.forEach(function (e) { if (!GENRE_BY[e[0]]) GENRE_BY[e[0]] = e; });
  }
  syncTypes();
  // the carrier (`medium`), optional: set on programs and physical objects. The catalogue's `media`
  // ([{ id, label, by, added }]) adds to it, from the Medium picker (＋ New medium…).
  var KIT_MEDIA = [['paper', 'Paper'], ['microform', 'Microfilm or microfiche'], ['cards', 'Punched cards'], ['papertape', 'Paper tape'], ['magtape', 'Magnetic tape'],
    ['dectape', 'DECtape'], ['disk', 'Disk (floppy or hard)'], ['cartridge', 'ROM cartridge'], ['cassette', 'Data cassette'], ['print', 'Photographic print'],
    ['film', 'Photographic film (negatives, slides, cine)'], ['videotape', 'Videotape'], ['audiotape', 'Audio tape'], ['digital', 'Born digital']];
  function media() { var out = KIT_MEDIA.slice(), have = {}; out.forEach(function (m) { have[m[0]] = 1; }); ((cat && cat.media) || []).forEach(function (m) { if (m.id && !have[m.id]) { have[m.id] = 1; out.push([m.id, m.label || m.id]); } }); return out; }
  function mediumLabel(id) { var m = media().filter(function (x) { return x[0] === id; })[0]; return m ? m[1] : id || ''; }
  function mediumOpts(cur) {
    return '<option value="">—</option>' + media().map(function (m) { return '<option value="' + SW.esc(m[0]) + '"' + (m[0] === cur ? ' selected' : '') + '>' + SW.esc(m[1]) + '</option>'; }).join('') +
      (cur && !media().some(function (m) { return m[0] === cur; }) ? '<option value="' + SW.esc(cur) + '" selected>' + SW.esc(cur) + '</option>' : '') + '<option value="__new">＋ New medium…</option>';
  }
  function slugOf(t) { return String(t || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 32); }
  // ＋ New type… and ＋ New medium…: a small box, then one commit adding it to the catalogue
  function newVocab(which) {
    return new Promise(function (ok) {
      var esc = SW.esc, q = SW.el('dialog', { class: 'ini-dlg px-newtype' }), fin = false;
      var groups = GENRES.map(function (g) { return g[0]; });
      q.innerHTML = '<form method="dialog" class="settings"><h2>' + (which === 'type' ? 'A new type' : 'A new medium') + '</h2>' +
        '<p class="hint">' + (which === 'type' ? 'For a kind of thing no type in the list describes. It is added to this archive’s list for the whole crew, and a later release of the kit may take it in.' : 'For a carrier no medium in the list describes. It is added to this archive’s list for the whole crew.') + '</p>' +
        '<label><span>Name</span><input class="px-nt-label" placeholder="' + (which === 'type' ? 'e.g. Questionnaire' : 'e.g. Magnetic card') + '"></label>' +
        (which === 'type' ? '<label><span>Group</span><select class="px-nt-group">' + groups.map(function (g) { return '<option>' + esc(g) + '</option>'; }).join('') + '</select></label>' +
          '<label><span>DCMI type</span><select class="px-nt-dcmi"><option value="">from the file</option>' + DCMI.map(function (t) { return '<option>' + t + '</option>'; }).join('') + '</select></label>' +
          '<label><span>Note</span><input class="px-nt-note" placeholder="what it covers, for the next person"></label>' : '') +
        '<p class="hint px-nt-msg"></p><div class="row"><button type="button" class="btn ghost" data-u="no">Cancel</button><button type="button" class="btn" data-u="yes">Add</button></div></form>';
      document.body.appendChild(q);
      function finish(v) { if (fin) return; fin = true; if (q.open) q.close(); q.remove(); ok(v); }
      q.addEventListener('cancel', function (e) { e.preventDefault(); finish(null); });
      q.addEventListener('click', function (e) {
        var b = e.target.closest('[data-u]'); if (!b) { if (e.target === q) finish(null); return; }
        if (b.dataset.u === 'no') { finish(null); return; }
        var label = SW.$('.px-nt-label', q).value.trim(), id = slugOf(label), msg = SW.$('.px-nt-msg', q);
        if (!label || !id) { msg.textContent = 'Give it a name.'; return; }
        var clash = which === 'type' ? GENRE_BY[id] || GENRES.some(function (g) { return g[1].some(function (e2) { return e2[1].toLowerCase() === label.toLowerCase(); }); }) : media().some(function (m) { return m[0] === id || m[1].toLowerCase() === label.toLowerCase(); });
        if (clash) { msg.textContent = 'That is in the list already.'; return; }
        var rec = { id: id, label: label, by: me(), added: now() };
        if (which === 'type') { rec.group = SW.$('.px-nt-group', q).value; var dc = SW.$('.px-nt-dcmi', q).value; if (dc) rec.dcmi = dc; var nt = SW.$('.px-nt-note', q).value.trim(); if (nt) rec.note = nt; }
        b.disabled = true; msg.textContent = 'Saving…';
        save('Paratexts: ' + which + ' “' + label + '” added to the list, by ' + me(), function (c) { var k = which === 'type' ? 'types' : 'media'; c[k] = c[k] || []; if (!c[k].some(function (x) { return x.id === id; })) c[k].push(rec); })
          .then(function () { syncTypes(); finish(id); }, function (err) { b.disabled = false; msg.textContent = err.message; });
      });
      q.showModal(); SW.$('.px-nt-label', q).focus();
    });
  }
  // the Type and Medium pickers: ＋ New… opens the box above; the Type picker's find box narrows its list
  document.addEventListener('change', function (e) {
    var t = e.target; if (!t.matches || !t.matches('select[data-k="genre"], select[data-k="medium"]') || t.value !== '__new') return;
    var which = t.dataset.k === 'genre' ? 'type' : 'medium', was = t.dataset.was || '';
    newVocab(which).then(function (id) {
      t.innerHTML = which === 'type' ? genreOpts(id || was) : mediumOpts(id || was);
      t.value = id || was; t.dataset.was = t.value;
    });
  });
  document.addEventListener('focusin', function (e) { var t = e.target; if (t.matches && t.matches('select[data-k="genre"], select[data-k="medium"]')) t.dataset.was = t.value; });
  document.addEventListener('input', function (e) {
    var t = e.target; if (!t.classList || !t.classList.contains('px-tfind')) return;
    var sel = t.parentNode.querySelector('select[data-k="genre"]'); if (!sel) return;
    var q = t.value.trim().toLowerCase(), hits = [];
    SW.$$('option', sel).forEach(function (o) { var on = !q || !o.value || o.value === '__new' || o.textContent.toLowerCase().indexOf(q) >= 0 || (o.parentNode.label || '').toLowerCase().indexOf(q) >= 0; o.hidden = !on; if (on && q && o.value && o.value !== '__new') hits.push(o); });
    SW.$$('optgroup', sel).forEach(function (g) { g.hidden = !SW.$$('option', g).some(function (o) { return !o.hidden; }); });
    if (hits.length === 1) sel.value = hits[0].value;
  });
  // ---------- languages, by name ----------
  // a record's language (BCP 47) by its name; SW.BENCH.paratexts.languages { code: name } adds a
  // bench's. A filter on language reads the record's own, not an alternate's: a German item with an
  // English translation is a German item.
  var LANGS = Object.assign({ en: 'English', de: 'German', fr: 'French', ja: 'Japanese', pl: 'Polish', it: 'Italian', es: 'Spanish', ru: 'Russian', nl: 'Dutch',
    sv: 'Swedish', pt: 'Portuguese', zh: 'Chinese', la: 'Latin', da: 'Danish', no: 'Norwegian', fi: 'Finnish', cs: 'Czech', hu: 'Hungarian', he: 'Hebrew', ko: 'Korean' }, (B.paratexts || {}).languages || {});
  function langOfRec(it) { return String(it && it.language || '').trim().toLowerCase().split(/[-_]/)[0]; }
  function baseLang(l) { return String(l || '').trim().toLowerCase().split(/[-_]/)[0]; }
  // the languages an item can be read in: its own, then each translation's (an alternate in another
  // language); the record's own language field stays the original's
  function readIn(it) {
    var own = langOfRec(it), out = own ? [own] : [];
    altList(it).forEach(function (a) { var l = baseLang(a.lang); if (l && out.indexOf(l) < 0) out.push(l); });
    return out;
  }
  // a card's mark for each translation held beside the item: its language and, where given, its note
  // ("EN · machine translated"), so an original and a translation are told apart in the grid
  function trChips(it) {
    var own = langOfRec(it);
    return altList(it).filter(function (a) { var l = baseLang(a.lang); return l && own && l !== own; }).map(function (a) {
      var n = altNote(a);
      return '<span class="px-s px-trchip" title="' + SW.esc((a.label ? a.label + ': ' : '') + (n || 'a translation') + ' (' + langLabel(baseLang(a.lang)) + ')') + '">' + SW.esc(baseLang(a.lang).toUpperCase()) + (n ? ' · ' + SW.esc(n.charAt(0).toLowerCase() + n.slice(1)) : ' translation') + '</span>';
    }).join('');
  }
  function langLabel(code) { return LANGS[code] || code; }
  function genreOf(it) { syncTypes(); return it && it.genre ? GENRE_BY[it.genre] || [it.genre, it.genre, null, 'document', 'GEN'] : null; }
  function genreOpts(cur) {
    syncTypes();
    return '<option value="">—</option>' + GENRES.map(function (g) {
      return '<optgroup label="' + SW.esc(g[0]) + '">' + g[1].map(function (e) { return '<option value="' + SW.esc(e[0]) + '"' + (e[0] === cur ? ' selected' : '') + '>' + SW.esc(e[1]) + '</option>'; }).join('') + '</optgroup>';
    }).join('') + (cur && GENRE_BY[cur] && !GENRES.some(function (g) { return g[1].some(function (e) { return e[0] === cur; }); }) ? '<option value="' + SW.esc(cur) + '" selected>' + SW.esc(GENRE_BY[cur][1]) + '</option>' : cur && !GENRE_BY[cur] ? '<option value="' + SW.esc(cur) + '" selected>' + SW.esc(cur) + '</option>' : '') +
      '<option value="__new">＋ New type…</option>';
  }
  // file names read as text: program source (kind software) and plain text (kind text)
  var CODE_EXT = /^\.(bas|lisp|lsp|l|mad|slip|c|h|cc|cpp|js|py|asm|mac|mid|f|for|f77|pas|java|rb|pl|pm|sh|el|cl|scm|snobol|sno|cob|cbl|pli|pl1|tec|apl|fth|forth|lgo|logo|pop|p|tcl|awk|m|s)$/i;
  var TEXT_EXT = /^\.(txt|text|md|markdown|csv|tsv|srt|vtt|me|lst|log|1st)$/i;
  // a first guess from the file or the link, only where none is given
  function guessGenre(mime, kind) {
    var m = String(mime || ''), k = kind || '';
    return /^audio\//.test(m) || k === 'audio' ? 'audio' : /^video\//.test(m) || k === 'video' ? 'video' : k === 'link' ? 'webpage' : k === 'software' ? 'software' : '';
  }
  // The record: [key, label, kind, placeholder, group]. The 'dc' group, the rest of Dublin Core's fifteen
  // elements, folds away under More metadata; the archive fields say where the original is kept.
  var DCMI = ['Collection', 'Dataset', 'Event', 'Image', 'InteractiveResource', 'MovingImage', 'PhysicalObject', 'Service', 'Software', 'Sound', 'StillImage', 'Text'];
  var FIELDS = [['title', 'Title'], ['genre', 'Type', 'genre'], ['medium', 'Medium', 'medium'], ['date', 'Date', '', EX.date || 'e.g. 1970-05-17, or 1970'], ['creator', 'Creator'], ['source', 'Source', '', 'where this copy came from'],
    ['archive', 'Held at', '', 'the archive with the original, ' + (EX.archive || 'e.g. Computer History Museum'), 'more'], ['archiveId', 'Archive ref', '', 'its catalogue number, or box and folder', 'more'], ['archiveUrl', 'Archive link', 'url', 'https://… the original in its archive’s catalogue', 'more'], ['url', 'Online at', 'url', 'https://… a recording or page to play or show here', 'more'],
    ['rights', 'Rights', '', '', 'more'], ['accessioned', 'Accession date', '', 'the day it came into the collection', 'more'], ['description', 'Description', 'area'],
    ['tags', 'Tags', 'list', 'comma separated'], ['versions', 'Versions', 'list', EX.versions || 'version ids, comma separated'], ['refs', 'References', 'list', EX.refs || 'e.g. [REF: …]', 'more'],
    ['type', 'DCMI type', 'dcmi', '', 'dc'], ['publisher', 'Publisher', '', EX.publisher || 'e.g. MIT Press', 'dc'], ['contributor', 'Contributors', 'list', 'comma separated', 'dc'],
    ['language', 'Language', '', 'e.g. en', 'dc'], ['extent', 'Extent', '', 'a duration or size, e.g. 1 h 12 min, 34 pp.', 'dc'], ['coverage', 'Coverage', '', 'a place or a period', 'dc'], ['identifier', 'Identifiers', 'list', 'DOI, ISBN, URL; comma separated', 'dc']];
  function okURL(u) { return /^https?:\/\/\S+$/i.test(String(u || '').trim()); }
  function fieldsHTML(it) {
    function one(f) {
      var v = it[f[0]], val = f[2] === 'list' ? (v || []).join(', ') : (v || ''), ph = f[3] || '';
      var inp = f[2] === 'area' ? '<textarea data-k="' + f[0] + '" rows="3">' + SW.esc(val) + '</textarea>' :
        f[2] === 'dcmi' ? '<select data-k="' + f[0] + '"><option value="">—</option>' + DCMI.map(function (t) { return '<option' + (t === val ? ' selected' : '') + '>' + t + '</option>'; }).join('') + '</select>' :
        f[2] === 'genre' ? '<span class="px-tpick"><input class="px-tfind" type="search" placeholder="Find a type" aria-label="Find a type"><select data-k="genre" title="What the item is: a memo scanned to PDF is a memo">' + genreOpts(val) + '</select></span>' :
        f[2] === 'medium' ? '<select data-k="medium" title="The carrier, for a program or an object: paper tape, DECtape, a disk. Leave it empty for a scan of a document.">' + mediumOpts(val) + '</select>' :
        '<input data-k="' + f[0] + '"' + (f[2] === 'url' ? ' type="url"' : '') + ' value="' + SW.esc(val) + '" placeholder="' + SW.esc(ph) + '">';
      return '<label><span>' + f[1] + '</span>' + inp + '</label>';
    }
    var rest = FIELDS.filter(function (f) { return f[4] === 'more' || f[4] === 'dc'; });
    var filled = rest.filter(function (f) { var v = it[f[0]]; return Array.isArray(v) ? v.length : v; }).length;
    return '<div class="px-fields">' + FIELDS.filter(function (f) { return !f[4]; }).map(one).join('') + '</div>' +
      '<details class="px-dc"><summary>More metadata <span class="faint">(archive, rights, Dublin Core' + (filled ? '; ' + filled + ' filled' : '') + ')</span></summary><div class="px-fields">' + rest.map(one).join('') +
      (it.code ? '<label><span>Catalogued</span><span class="px-catby"><input data-k="addedBy" value="' + SW.esc(it.addedBy || '') + '" placeholder="by whom">' +
        (it.updated && it.updated !== it.added ? '<span class="faint">changed ' + SW.esc(SW.fmtDate(it.updated)) + ' by ' + SW.esc(it.updatedBy || '?') + '</span>' : '') + '</span></label>' : '') +
      (it.mime || it.size ? '<label><span>Format</span><span class="px-fmt">' + SW.esc([it.mime, fmtSize(it.size)].filter(Boolean).join(', ')) + '</span></label>' : '') + '</div></details>';
  }
  // Dublin Core (oai_dc) records, for the selection or one item
  function dcXML(items) {
    var x = SW.esc;
    function el(n, v) { return (Array.isArray(v) ? v : [v]).filter(function (y) { return y; }).map(function (y) { return '  <dc:' + n + '>' + x(String(y)) + '</dc:' + n + '>\n'; }).join(''); }
    return '<?xml version="1.0" encoding="UTF-8"?>\n<records xmlns:oai_dc="http://www.openarchives.org/OAI/2.0/oai_dc/" xmlns:dc="http://purl.org/dc/elements/1.1/">\n' + items.map(function (it) {
      return '<oai_dc:dc>\n' + el('title', it.title) + el('creator', it.creator) + el('subject', it.tags) + el('description', [it.description].concat(gapsAll(it).map(gapLine))) + el('publisher', it.publisher) + el('contributor', it.contributor) +
        el('date', it.date) + el('type', [dcType(it), (genreOf(it) || [])[1]]) + el('format', [it.mime, it.extent, it.medium ? 'Medium: ' + mediumLabel(it.medium) : '']) +
        el('identifier', [it.code, SW.BASE_URI + '?code=' + it.code].concat(it.identifier || [], okURL(it.url) ? [it.url] : [], okURL(it.archiveUrl) ? [it.archiveUrl] : [])) +
        el('source', [it.source, [it.archive, it.archiveId].filter(Boolean).join(', ')]) + el('language', it.language) +
        el('relation', (it.refs || []).concat(relOf(it).map(function (r) { return 'references: ' + r + ' ' + byCode(r).title; })).concat(seqsOf(it.code).map(function (q) { var cs = seqCodes(q); return 'isPartOf: ' + q.name + ' (' + (cs.indexOf(it.code) + 1) + ' of ' + cs.length + ')'; })).concat((it.versions || []).map(function (v) { return (B.relation || BNAME + ' ') + vShort(v); })).concat(corpusOf(it) ? ['isPartOf: ' + corpusName(corpusOf(it))] : []).concat(corpora().filter(function (c) { return c.id !== corpusOf(it) && inAlso(it, c.id); }).map(function (c) { return 'isPartOf: ' + c.name; }))
          .concat(altList(it).map(function (a) { return 'hasVersion: ' + (a.label || 'alternate') + ' [' + (a.lang || '') + ']' + (altNote(a) ? ' (' + altNote(a) + ')' : ''); }))) + el('coverage', it.coverage) + el('rights', it.rights) + '</oai_dc:dc>\n';
    }).join('') + '</records>\n';
  }
  // For Zotero and other reference managers: CSL-JSON and RIS. The creator field may hold several
  // people, separated by semicolons, each 'Family, Given' or 'Given Family'; an organisation stays whole.
  function people(s) {
    return String(s || '').split(/\s*;\s*/).filter(Boolean).map(function (p) {
      var m = /^([^,]+),\s*(.+)$/.exec(p); if (m) return { family: m[1].trim(), given: m[2].trim() };
      var w = p.trim().split(/\s+/);
      return w.length === 2 || w.length === 3 && /^[A-Z]\.?$/.test(w[1]) ? { family: w[w.length - 1], given: w.slice(0, -1).join(' ') } : { literal: p.trim() };
    });
  }
  function dateParts(d) { var m = /^(\d{4})(?:-(\d{1,2})(?:-(\d{1,2}))?)?/.exec(String(d || '')); return m ? [m.slice(1).filter(Boolean).map(Number)] : null; }
  function dcType(it) { return it.type || (genreOf(it) || [])[2] || ({ image: 'StillImage', pdf: 'Text', text: 'Text', software: 'Software', video: 'MovingImage', audio: 'Sound' })[it.kind] || ''; }
  function isInterview(it) { return (it.tags || []).some(function (g) { return /^(oral history|interview)$/i.test(g); }); }
  function benchLink(it) { return SW.BASE_URI + '?code=' + it.code; }
  function ids(it) { var o = {}; (it.identifier || []).forEach(function (x) { x = String(x).trim(); if (/^(doi:)?10\.\d{4,}\//i.test(x)) o.DOI = x.replace(/^doi:/i, ''); else if (/^(isbn:)?[\d-]{10,17}X?$/i.test(x)) o.ISBN = x.replace(/^isbn:/i, ''); else if (/^https?:/.test(x) && !o.URL) o.URL = x; }); return o; }
  function cslJSON(items) {
    var T = { StillImage: 'graphic', Image: 'graphic', MovingImage: 'motion_picture', Sound: 'song', Software: 'software', Dataset: 'dataset', Text: 'document' };
    return JSON.stringify(items.map(function (it) {
      var o = { id: it.code, type: genreOf(it) ? genreOf(it)[3] : isInterview(it) ? 'interview' : T[dcType(it)] || (it.kind === 'link' ? 'webpage' : 'document'), title: it.title }, x = ids(it), dp;
      if (genreOf(it)) o.genre = genreOf(it)[1];
      if (it.extent) o.dimensions = it.extent;
      var au = people(it.creator); if (au.length) o.author = au;
      if ((dp = dateParts(it.date))) o.issued = { 'date-parts': dp };
      if ((dp = dateParts(it.accessioned))) o.accessed = { 'date-parts': dp };
      if (it.publisher) o.publisher = it.publisher;
      if (it.description) o.abstract = it.description;
      if (it.archive) o.archive = it.archive;
      if (it.archiveId) o.archive_location = it.archiveId;
      if (it.language) o.language = it.language;
      if (it.rights) o.license = it.rights;
      if (it.medium || it.mime) o.medium = it.medium ? mediumLabel(it.medium) : it.mime;
      if (x.DOI) o.DOI = x.DOI; if (x.ISBN) o.ISBN = x.ISBN;
      o.URL = okURL(it.url) ? it.url.trim() : okURL(it.archiveUrl) ? it.archiveUrl.trim() : x.URL || benchLink(it);
      if ((it.tags || []).length) o.keyword = it.tags.join(', ');
      o.note = BNAME + ' paratext ' + it.code + ' (' + benchLink(it) + ')' + (it.source ? '. Source: ' + it.source : '') + gapsAll(it).map(function (g) { return '. ' + gapLine(g); }).join('');
      return o;
    }), null, 2) + '\n';
  }
  function risText(items) {
    function line(k, v) { return v ? k + '  - ' + String(v).replace(/\s*\n\s*/g, ' ') + '\r\n' : ''; }
    var T = { StillImage: 'ART', Image: 'ART', MovingImage: 'VIDEO', Sound: 'SOUND', Software: 'COMP', Dataset: 'DATA', Text: 'GEN' };
    return items.map(function (it) {
      var x = ids(it), dp = dateParts(it.date), da = dp ? dp[0].map(function (n, i) { return i ? ('0' + n).slice(-2) : n; }).join('/') + '/'.repeat(4 - dp[0].length) : '';
      return line('TY', genreOf(it) ? genreOf(it)[4] : T[dcType(it)] || (it.kind === 'link' ? 'ELEC' : 'GEN')) + line('ID', it.code) + line('TI', it.title) + line('M3', (genreOf(it) || [])[1]) +
        people(it.creator).map(function (p) { return line('AU', p.literal || p.family + ', ' + p.given); }).join('') +
        line('PY', dp ? dp[0][0] : '') + line('DA', da) + line('PB', it.publisher) + line('AB', it.description) +
        (it.tags || []).map(function (g) { return line('KW', g); }).join('') + line('LA', it.language) + line('DO', x.DOI) + line('SN', x.ISBN) +
        line('UR', okURL(it.url) ? it.url.trim() : okURL(it.archiveUrl) ? it.archiveUrl.trim() : x.URL || benchLink(it)) + line('AV', [it.archive, it.archiveId].filter(Boolean).join(', ')) +
        line('N1', BNAME + ' paratext ' + it.code + ' (' + benchLink(it) + ')' + (it.source ? '. Source: ' + it.source : '')) + gapsAll(it).map(function (g) { return line('N1', gapLine(g)); }).join('') + 'ER  - \r\n';
    }).join('\r\n');
  }
  // the export menu's formats: [key, label, file extension, mime, maker]
  var FORMATS = [['csl', 'CSL-JSON (Zotero)', 'json', 'application/json', cslJSON], ['ris', 'RIS', 'ris', 'application/x-research-info-systems', risText], ['dc', 'Dublin Core (XML)', 'xml', 'application/xml', dcXML]];
  function exportItems(fmt, items, base) { var f = FORMATS.filter(function (x) { return x[0] === fmt; })[0]; if (f && items.length) saveFile(base + '.' + f[2], f[4](items), f[3]); }
  function exportMenu(attr) { return '<details class="px-more px-exp"><summary class="btn ghost" title="Its record, to save: for Zotero (CSL-JSON or RIS) or in Dublin Core">⤓ Export</summary><div class="px-menu">' + FORMATS.map(function (f) { return '<button ' + attr + '="' + f[0] + '">' + f[1] + '</button>'; }).join('') + '</div></details>'; }
  function saveFile(name, text, type) {
    var u = URL.createObjectURL(new Blob([text], { type: type })), a = SW.el('a', { href: u, download: name });
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(u); }, 4000);
  }
  function readFields(box) {
    var o = {};
    SW.$$('[data-k]', box).forEach(function (el) {
      var k = el.dataset.k, f = FIELDS.filter(function (x) { return x[0] === k; })[0];
      o[k] = f && f[2] === 'list' ? el.value.split(',').map(function (x) { return x.trim(); }).filter(Boolean) : el.value === '__new' ? '' : el.value.trim();
    });
    return o;
  }
  // Leaving a box with changes not saved: a small box asks first. Resolves 'save', 'discard' or
  // 'keep' (Keep editing, Esc, or a click outside it).
  function askUnsaved(what, canSave) {
    return new Promise(function (ok) {
      var q = SW.el('dialog', { class: 'ini-dlg px-unsaved' }), fin = false;
      q.innerHTML = '<form method="dialog" class="settings"><h2>Not saved</h2><p>' + SW.esc(what) + '</p>' +
        '<div class="row"><button type="button" class="btn ghost" data-u="keep">Keep editing</button><button type="button" class="btn ghost" data-u="discard">Discard</button>' + (canSave ? '<button type="button" class="btn" data-u="save">Save</button>' : '') + '</div></form>';
      document.body.appendChild(q);
      function finish(v) { if (fin) return; fin = true; if (q.open) q.close(); q.remove(); ok(v); }
      q.addEventListener('click', function (e) { var b = e.target.closest('[data-u]'); if (b) finish(b.dataset.u); else if (e.target === q) finish('keep'); });
      q.addEventListener('cancel', function (e) { e.preventDefault(); finish('keep'); });
      q.showModal(); var f = SW.$(canSave ? '[data-u="save"]' : '[data-u="keep"]', q); if (f) f.focus();
    });
  }
  // a box that asks before it closes on what would be lost: d.__leave(then) closes it, asking first
  // when lost() names something; ✕, a click outside and Esc go through it
  function guardClose(d, lost, saveIt) {
    d.__leave = function (then) {
      var w = lost();
      if (!w) { d.close(); if (then) then(); return; }
      askUnsaved(w, !!saveIt).then(function (v) {
        if (v === 'discard') { d.close(); if (then) then(); }
        else if (v === 'save') saveIt().then(function (ok) { if (ok !== false) { d.close(); if (then) then(); } });
      });
    };
    d.addEventListener('cancel', function (e) { if (lost()) { e.preventDefault(); d.__leave(); } });
  }
  // Cited in: the annotations, replies, findings and notes that write its code, each a link to it
  function citedIn(code, box) {
    if (!box || !SW.notes || !SW.notes.citing) return;
    var esc = SW.esc;
    box.innerHTML = '';
    SW.notes.citing(code).then(function (l) {
      if (!l.length) return;   // nothing cites it: the section stays out of the way
      box.innerHTML = '<h4 class="fd-rh">Cited in <span class="faint">' + l.length + '</span></h4>' + ('<ul class="px-citelist">' + l.map(function (c) {
        return '<li><button class="px-cite" data-go="' + esc(c.code) + '" title="Go to it"><span class="px-code mono">' + esc(c.code || '?') + '</span> <b>' + esc(c.what) + '</b>' + (c.by && c.by !== 'bench' ? ' by ' + esc(c.by) : '') + (c.where ? ' · ' + esc(c.where) : '') + (c.date ? ' · <span class="faint">' + esc(SW.fmtDate(c.date)) + '</span>' : '') + (c.text ? '<span class="px-citetext">' + esc(c.text) + '</span>' : '') + '</button></li>';
      }).join('') + '</ul>');
    });
  }
  // a click on a citation: the box (or boxes) closed, and on to it
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('dialog [data-go]'); if (!b || !b.dataset.go) return;
    var open = SW.$$('dialog.px-dlg[open]'), guarded = open.filter(function (d) { return d.__leave; })[0];
    function go() { SW.$$('dialog.px-dlg[open]').forEach(function (d) { d.close(); d.remove(); }); SW.notes.goCode(b.dataset.go); }
    if (guarded) guarded.__leave(go); else go();
  });
  // A linked item played or shown where it lives: YouTube, Vimeo and the Internet Archive in their own
  // players; a direct audio or video file in the browser's; anything else as a link to it.
  function embedHTML(url, kind, title) {
    var esc = SW.esc, m;
    if ((m = /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([\w-]{11})/.exec(url))) {
      var t = /[?&]t=(\d+)/.exec(url);
      return '<iframe class="px-embed" src="https://www.youtube-nocookie.com/embed/' + m[1] + (t ? '?start=' + t[1] : '') + '" title="' + esc(title) + '" allow="fullscreen; picture-in-picture" allowfullscreen loading="lazy" referrerpolicy="strict-origin-when-cross-origin"></iframe>';
    }
    if ((m = /vimeo\.com\/(?:video\/)?(\d+)/.exec(url))) return '<iframe class="px-embed" src="https://player.vimeo.com/video/' + m[1] + '" title="' + esc(title) + '" allow="fullscreen; picture-in-picture" allowfullscreen loading="lazy"></iframe>';
    if ((m = /archive\.org\/(?:details|embed)\/([^/?#]+)/.exec(url))) return '<iframe class="px-embed' + (kind === 'audio' ? ' px-embed-audio' : '') + '" src="https://archive.org/embed/' + m[1] + '" title="' + esc(title) + '" allow="fullscreen" allowfullscreen loading="lazy"></iframe>';
    if (/\.(mp3|m4a|wav|ogg|oga|flac|aac)(\?|$)/i.test(url) || kind === 'audio' && /\.(mp4|webm)(\?|$)/i.test(url)) return '<audio class="px-audio" controls preload="metadata" src="' + esc(url) + '"></audio>';
    if (/\.(mp4|webm|mov|m4v|ogv)(\?|$)/i.test(url)) return '<video class="px-video" controls preload="metadata" src="' + esc(url) + '"></video>';
    if (kind === 'image') return '<img class="px-linkimg" alt="' + esc(title) + '" src="' + esc(url) + '">';
    if (kind === 'pdf') return '<iframe class="px-embed px-embed-pdf" src="' + esc(url) + '" title="' + esc(title) + '"></iframe><p class="px-linkout">' + (ICON.pdf || ICON.link) + ' Held at its source: <a href="' + esc(url) + '" target="_blank" rel="noopener">' + esc(url.replace(/^https?:\/\//, '').slice(0, 80)) + ' ↗</a></p>';
    return '<p class="px-linkout">' + (ICON[kind] || ICON.link) + ' Held at its source: <a href="' + esc(url) + '" target="_blank" rel="noopener">' + esc(url.replace(/^https?:\/\//, '').slice(0, 80)) + ' ↗</a></p>';
  }
  // Zoom in a single item's box. A picture: a bar (− ＋ Fit 1:1 and the scale), the wheel or a
  // pinch zooming where the pointer is, a double-click zooming in, a drag moving it, and the keys
  // + − 0 while the pointer is over it. A PDF the same, a page at a time, drawn by PDF.js, with
  // ‹ › for its pages and Open ↗ for the browser's own viewer.
  function zoomBar(extra) {
    return '<div class="px-zbar"><button class="btn ghost" data-zz="out" title="Zoom out (−)">−</button><span class="px-zpc mono">100%</span><button class="btn ghost" data-zz="in" title="Zoom in (+)">＋</button>' +
      extra + '</div>';
  }
  // A picture in a box, to zoom and move: the bar's own buttons (extra) and the hint under it.
  // Returns show(src, size), which puts a picture in the box, fitted (size: [w, h] where 1:1 is
  // not the picture's own pixels).
  function zoomBox(pv, alt, extra, hint) {
    var esc = SW.esc;
    pv.classList.add('px-zwrap');
    pv.innerHTML = zoomBar(extra) + '<div class="px-zoom px-zone"><img alt="' + esc(alt) + '" draggable="false"><div class="px-cover"></div></div><p class="hint px-zhint">' + hint + '</p>';
    var box = SW.$('.px-zone', pv), img = SW.$('img', box), pc = SW.$('.px-zpc', pv), w = 0, h = 0, st = { z: 1, cx: 0.5, cy: 0.5 };
    function fitSc() { return Math.min(box.clientWidth / w, box.clientHeight / h); }
    // the picture laid out once at its fitted size; a zoom or a move is a transform alone, drawn at
    // most once a frame (sizing a large picture at each step made both lag)
    var laid = 0, raf = 0;
    function place() {
      if (!w || !box.clientWidth) return;
      var W = box.clientWidth, H = box.clientHeight, f = fitSc(), sc = f * st.z;
      if (laid !== w * f) { laid = w * f; img.style.width = w * f + 'px'; img.style.height = h * f + 'px'; }
      img.style.transform = 'translate(' + (W / 2 - st.cx * w * sc) + 'px,' + (H / 2 - st.cy * h * sc) + 'px) scale(' + st.z + ')';
      pc.textContent = Math.round(sc * 100) + '%';
    }
    function soon() { if (!raf) raf = requestAnimationFrame(function () { raf = 0; place(); }); }
    function zoomAt(f, mx, my) {
      if (!w) return;
      var W = box.clientWidth, H = box.clientHeight, sc = fitSc() * st.z;
      if (mx == null) { mx = W / 2; my = H / 2; }
      var px = st.cx + (mx - W / 2) / (w * sc), py = st.cy + (my - H / 2) / (h * sc);
      st.z = Math.max(0.5, Math.min(40, st.z * f)); var sc2 = fitSc() * st.z;
      st.cx = px - (mx - W / 2) / (w * sc2); st.cy = py - (my - H / 2) / (h * sc2);
      soon();
    }
    function fit() { st = { z: 1, cx: 0.5, cy: 0.5 }; place(); }
    var size = null;   // the picture's size where it is not its pixels (a PDF page's own, in points)
    img.onload = function () { w = size ? size[0] : img.naturalWidth; h = size ? size[1] : img.naturalHeight; place(); };
    pv.addEventListener('click', function (e) {
      var b = e.target.closest('[data-zz]'); if (!b) return;
      var k = b.dataset.zz;
      if (k === 'fit') fit(); else if (k === 'one') zoomAt(1 / (fitSc() * st.z)); else zoomAt(k === 'in' ? 1.5 : 1 / 1.5);
    });
    box.addEventListener('wheel', function (e) { e.preventDefault(); var rc = box.getBoundingClientRect(); zoomAt(Math.exp(-e.deltaY * (e.ctrlKey ? 0.01 : 0.0025)), e.clientX - rc.left, e.clientY - rc.top); }, { passive: false });
    box.addEventListener('dblclick', function (e) { var rc = box.getBoundingClientRect(); zoomAt(2, e.clientX - rc.left, e.clientY - rc.top); });
    var drag = null, over = false;
    // a drag moves the picture, and selects nothing: not the page's text, and not the words the
    // system finds in a picture (Live Text), which a cover over the picture keeps the pointer from
    box.addEventListener('selectstart', function (e) { e.preventDefault(); });
    box.addEventListener('pointerdown', function (e) { if (e.button) return; e.preventDefault(); drag = { x: e.clientX, y: e.clientY }; box.setPointerCapture(e.pointerId); box.classList.add('dragging'); });
    box.addEventListener('pointermove', function (e) {
      if (!drag || !w) return;
      var sc = fitSc() * st.z; st.cx -= (e.clientX - drag.x) / (w * sc); st.cy -= (e.clientY - drag.y) / (h * sc);
      drag = { x: e.clientX, y: e.clientY }; soon();
    });
    box.addEventListener('pointerup', function () { drag = null; box.classList.remove('dragging'); });
    box.addEventListener('pointerenter', function () { over = true; });
    box.addEventListener('pointerleave', function () { over = false; });
    var dlg = pv.closest('dialog');
    function key(e) {
      if (!over || /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return;
      if (e.key === '+' || e.key === '=') { e.preventDefault(); zoomAt(1.5); } else if (e.key === '-') { e.preventDefault(); zoomAt(1 / 1.5); } else if (e.key === '0') { e.preventDefault(); fit(); }
    }
    if (dlg) { dlg.addEventListener('keydown', key); dlg.addEventListener('close', function () { window.removeEventListener('resize', place); }); }
    window.addEventListener('resize', place);
    return { show: function (src, sz) { st = { z: 1, cx: 0.5, cy: 0.5 }; size = sz || null; laid = 0; img.src = src; } };
  }
  function zoomImage(it, pv, u) {
    zoomBox(pv, it.title, '<button class="btn ghost" data-zz="fit" title="Fit (0)">Fit</button><button class="btn ghost" data-zz="one" title="Actual size, a pixel of the scan to a pixel of the screen">1:1</button>',
      'Drag to move; wheel or pinch to zoom where the pointer is; double-click to zoom in.').show(u);
  }
  // PDF.js (Mozilla), fetched from cdnjs the first time a PDF is opened. Documents are opened with
  // isEvalSupported false: 3.11.174 can be made to run a crafted PDF's script through its font code
  // (CVE-2024-4367, fixed in 4.2.67), and this turns that path off.
  var PDFJS = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/', pdfjsP = null;
  function pdfOpen(lib, u) { return lib.getDocument({ url: u, isEvalSupported: false }).promise; }
  function pdfjs() {
    if (!pdfjsP) pdfjsP = new Promise(function (ok, no) {
      if (root.pdfjsLib) { ok(root.pdfjsLib); return; }
      var sc = document.createElement('script'); sc.src = PDFJS + 'pdf.min.js';
      sc.onload = function () { root.pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS + 'pdf.worker.min.js'; ok(root.pdfjsLib); };
      sc.onerror = function () { pdfjsP = null; no(new Error('PDF.js could not be fetched')); };
      document.head.appendChild(sc);
    });
    return pdfjsP;
  }
  // a page of a PDF drawn as a picture, at about two and a half times the width it is shown at so
  // that it stays sharp when zoomed: { url, w, h }, w and h the page's own size (in points)
  function pdfPicture(doc, n, width) {
    return doc.getPage(n).then(function (pg) {
      var v1 = pg.getViewport({ scale: 1 }), want = Math.min(4000, Math.max(1600, (width || 800) * 2.5)), vp = pg.getViewport({ scale: want / v1.width });
      var cv = document.createElement('canvas'); cv.width = Math.round(vp.width); cv.height = Math.round(vp.height);
      return pg.render({ canvasContext: cv.getContext('2d'), viewport: vp }).promise.then(function () {
        return new Promise(function (ok) { cv.toBlob(function (bl) { ok({ url: URL.createObjectURL(bl), w: v1.width, h: v1.height }); }); });
      });
    });
  }
  // a PDF as pictures, a page at a time, in the box images use (moved and zoomed the same way)
  function zoomPdf(it, pv, u) {
    var esc = SW.esc, n = 1, doc = null, last = null;
    var Z = zoomBox(pv, it.title,
      '<button class="btn ghost" data-zz="fit" title="Fit (0)">Fit</button><button class="btn ghost" data-zz="one" title="The page at its own size (100%)">1:1</button>' +
      '<span class="px-zpg"><button class="btn ghost" data-pg="-1" title="The previous page (Page Up)">‹</button><span class="px-zpn mono">…</span><button class="btn ghost" data-pg="1" title="The next page (Page Down)">›</button></span>' +
      '<a class="btn ghost" href="' + u + '" target="_blank" rel="noopener" title="In a tab of its own, with the browser\'s own tools">Open ↗</a>',
      'Drag to move; wheel or pinch to zoom where the pointer is; double-click to zoom in; ‹ › or Page Up and Down for the pages.');
    var pn = SW.$('.px-zpn', pv), zone = SW.$('.px-zone', pv);
    function page(k) {
      if (!doc) return;
      n = Math.max(1, Math.min(doc.numPages, k));
      var lost = gapsOf(it).map(function (g, i) { return [g, i]; }).filter(function (x) { var a = x[0].at; return a.page === n || a.pages && n >= a.pages[0] && n <= a.pages[1]; });
      pn.textContent = n + ' / ' + doc.numPages + (lost.length ? ' · ' + (GAPKIND[lost[0][0].kind] || 'Lost').toLowerCase() : '');
      var over = SW.$('.px-gapover', pv); if (over) over.remove();
      if (lost.length) zone.insertAdjacentHTML('beforebegin', '<div class="px-gapover">' + lost.map(function (x) { return gapHTML(x[0], it, x[1]); }).join('') + '</div>');
      pdfPicture(doc, n, zone.clientWidth).then(function (pic) { if (last) URL.revokeObjectURL(last); last = pic.url; Z.show(pic.url, [pic.w, pic.h]); });
    }
    pv.__gopage = page;
    pv.addEventListener('click', function (e) { var b = e.target.closest('[data-pg]'); if (b) page(n + +b.dataset.pg); });
    var dlg = pv.closest('dialog');
    if (dlg) dlg.addEventListener('keydown', function (e) {
      if (/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return;
      if (e.key === 'PageDown') { e.preventDefault(); page(n + 1); } else if (e.key === 'PageUp') { e.preventDefault(); page(n - 1); }
    });
    pdfjs().then(function (lib) { return pdfOpen(lib, u); }).then(function (d) { doc = d; page(1); }, function (e) {
      pn.textContent = '';
      zone.innerHTML = '<p class="hint" style="padding:12px">The PDF could not be drawn here (' + esc(e.message) + '). Open ↗ shows it in the browser\'s own viewer.</p>';
    });
  }
  // A paratext can carry alternates: a translation, a transcription, an OCR reading, kept beside
  // the original under the same code and in the same record. `alts` is [{lang, label, file, mime,
  // size, by, date, note}]; `lang` is BCP 47. altItem makes the shallow item showFile needs.
  function altList(it) { return (it && it.alts || []).filter(function (a) { return a && a.file; }); }
  function altItem(it, a) {
    var mime = a.mime || '', kind = mime === 'application/pdf' ? 'pdf' : /^image\//.test(mime) ? 'image' :
      /^audio\//.test(mime) ? 'audio' : /^video\//.test(mime) ? 'video' : /^text\//.test(mime) ? 'text' : 'file';
    return { code: it.code, title: it.title, file: a.file, mime: mime, kind: kind, size: a.size || 0, lang: a.lang, gaps: a.gaps };
  }
  // The rendered text in its own language, wherever it is shown: an alternate's own `lang`, the
  // record's `language` otherwise.
  function langOf(it) { return it.lang || it.language || ''; }
  function preHTML(it, t) { return '<pre class="px-text"' + (langOf(it) ? ' lang="' + SW.esc(langOf(it)) + '"' : '') + '>' + SW.esc(t) + '</pre>'; }
  function altNote(a) { return a.note || (a.by ? 'working translation, by ' + a.by + (a.date ? ', ' + a.date : '') : ''); }
  // The switcher between a record and its alternates: a row of buttons, one for each reading, all
  // in view, the one showing marked. Each is named for what it is: the record by its kind (Scan,
  // Audio, Text), Original where it is a text with only translations beside it; an alternate in
  // the record's language as a Transcript or Subtitles of a recording, a Scan, or a Text; one in
  // another language as the Translation, or by its language where there are several. An
  // alternate's own `short` names it instead. Its label (often a title) and note are a caption
  // under the row, never in a button: "machine translation, unchecked" has to be seen where the
  // text is.
  function isTr(it, a) { var b = function (l) { return String(l || '').toLowerCase().split('-')[0]; }; return !!(a.lang && it.language && b(a.lang) !== b(it.language)); }
  function kindWord(x) { return x.kind === 'pdf' || x.kind === 'image' ? 'Scan' : x.kind === 'audio' ? 'Audio' : x.kind === 'video' ? 'Video' : x.kind === 'text' || x.kind === 'software' || /^text\//.test(x.mime || '') ? 'Text' : 'File'; }
  function altLabels(it) {
    var list = altList(it), trs = list.filter(function (a) { return isTr(it, a); }).length, rec = it.kind === 'audio' || it.kind === 'video';
    var L = [kindWord(it) === 'Text' && trs === list.length ? 'Original' : kindWord(it)].concat(list.map(function (a) {
      var x = altItem(it, a);
      if (isTr(it, a)) return trs > 1 ? String(a.lang).toUpperCase() : 'Translation';
      if (rec && kindWord(x) === 'Text') return /\.(srt|vtt)$/i.test(a.file) || /subrip|vtt/.test(a.mime || '') ? 'Subtitles' : 'Transcript';
      return kindWord(x);
    }));
    var dup = function (l) { return L.indexOf(l) !== L.lastIndexOf(l); };
    L = L.map(function (l, i) { return !dup(l) ? l : i ? (list[i - 1].label && list[i - 1].label.length <= 24 ? list[i - 1].label : l) : 'Original'; });
    L = L.map(function (l, i) { return i && list[i - 1].short ? list[i - 1].short : l; });
    return L.map(function (l, i) { return L.indexOf(l) !== i ? l + ' ' + (i + 1) : l; });
  }
  function altCaption(it, n) {
    var a = altList(it)[n]; if (!a) return '';
    var t = a.label && a.label !== altLabels(it)[n + 1] ? '<i>' + SW.esc(a.label) + '</i>' : '', note = altNote(a);   // a title the button already gives, once
    return t + (t && note ? ': ' : '') + SW.esc(note);
  }
  function altBar(it) {
    var esc = SW.esc, list = altList(it); if (!list.length) return '';
    var L = altLabels(it), tip = function (n) { var a = list[n]; return a ? (a.label ? a.label + (altNote(a) ? ': ' : '') : '') + altNote(a) : 'The record’s own file'; };
    return '<span class="seg-btns px-alts" role="group" aria-label="Readings">' + L.map(function (l, i) {
      var a = list[i - 1], lg = i ? a.lang : it.language;
      return '<button class="btn ghost' + (i ? '' : ' on') + '" aria-pressed="' + !i + '" data-alt="' + (i - 1) + '"' + (lg ? ' lang="' + esc(lg) + '"' : '') + ' title="' + esc(tip(i - 1)) + '">' + esc(l) + '</button>';
    }).join('') + '</span>';
  }

  // ---------- lacunae: a paratext's gaps, drawn where they are (kintsugi) ----------
  // A record, or an alternate, carries gaps: [{ id, at, kind, cause, note, extent, label, fill }].
  //   at     one key: { page: n, printed } or { pages: [a, b], printed } (1-based pages of the
  //          file; printed, what the paper says); { lines: [a, b] } (lines of the file that stand
  //          for the loss, drawn as the seam); { after: n } (the seam after line n, 0 before the
  //          first); { t: [s, e] } (seconds); { bytes: [a, b] }; label, words for the place
  //   kind   missing, illegible, redacted, damaged or withheld: the loss, not its cause
  //   extent what at cannot give, in words ("c. 46 lines, estimated from the surviving pages")
  //   fill   { text, basis: 'witness' (read from another copy) or 'conjecture', by, date, source }:
  //          drawn inside the seam, never merged into the text, and marked as a restoration in
  //          every export
  // The same loss in two witnesses (the scan's page, the transcription's lines) shares an id, and
  // an export lists it once. The marks are Help ▸ Marks and conventions' (SW.leiden).
  var GAPKIND = { missing: 'Lost', illegible: 'Illegible', redacted: 'Redacted', damaged: 'Damaged', withheld: 'Withheld' };
  // the notation the gaps are read in, for the whole bench (Kintsugi or Leiden, on the item's switch)
  function gapNotation() { document.body.classList.toggle('px-leiden', SW.flip.get('gaps') === 'leiden'); }
  SW.on('flip:gaps', gapNotation); gapNotation();
  function gapsOf(x) { return (x && x.gaps || []).filter(function (g) { return g && g.at; }); }
  function clock(s) { s = Math.round(+s || 0); return Math.floor(s / 60) + ':' + ('0' + s % 60).slice(-2); }
  function gapWhere(g) {
    var a = g.at || {};
    if (g.label || a.label) return g.label || a.label;
    if (a.page != null) return a.printed ? 'printed p. ' + a.printed + ' (page ' + a.page + ' of the file)' : 'page ' + a.page;
    if (a.pages) return a.printed ? 'printed pp. ' + a.printed + ' (pages ' + a.pages[0] + '–' + a.pages[1] + ' of the file)' : 'pages ' + a.pages[0] + '–' + a.pages[1];
    if (a.lines) return 'lines ' + a.lines[0] + '–' + a.lines[1];
    if (a.after != null) return +a.after ? 'after line ' + a.after : 'before the first line';
    if (a.t) return clock(a.t[0]) + '–' + clock(a.t[1]);
    if (a.bytes) return 'bytes ' + a.bytes[0] + '–' + a.bytes[1];
    return '';
  }
  // how much: from at where it can say (pages, time), the rest from extent
  function gapExtent(g) {
    var a = g.at || {}, n = a.page != null ? 1 : a.pages ? a.pages[1] - a.pages[0] + 1 : 0;
    var own = n ? n + ' page' + (n > 1 ? 's' : '') : a.t ? Math.round(a.t[1] - a.t[0]) + ' s' : '';
    return [own, g.extent].filter(Boolean).join(', ');
  }
  function gapLeiden(g) {
    var f = g.fill, a = g.at || {};
    if (f && f.text) return SW.leiden(f.basis === 'witness' ? 'supplied' : 'restored', f.text);
    var lines = /(\d+)\s*lines?/.exec(g.extent || '');
    return SW.leiden('lost', '', a.page != null ? { pages: 1 } : a.pages ? { pages: a.pages[1] - a.pages[0] + 1 } : lines ? { lines: +lines[1] } : {});
  }
  function fillLine(f) { return f.basis === 'witness' ? 'restored from ' + (f.source || 'another copy') + (f.by ? ', by ' + f.by : '') : 'conjecture' + (f.by ? ', ' + f.by : '') + (f.date ? ', ' + f.date : '') + (f.source ? ', from ' + f.source : ''); }
  // one line for a record or an export: lacuna: <kind> at <where>; <cause> (and its fill)
  function gapLine(g) {
    var f = g.fill && g.fill.text ? g.fill : null;
    return 'lacuna ' + gapLeiden(g) + ': ' + (g.kind || 'missing') + ', ' + gapWhere(g) + (g.cause ? '; ' + g.cause : '') + (f ? ' (' + fillLine(f) + ')' : '');
  }
  // the seam: a band in the place of what is lost, with how much and why; a fill inside it, gold
  // (yobitsugi from another copy, dashed; kake by conjecture, solid), never in the text itself
  function gapHTML(g, it, i) {
    var esc = SW.esc, f = g.fill && g.fill.text ? g.fill : null, ext = gapExtent(g), lang = it ? langOf(it) : '';
    return '<div class="px-gap px-gap-' + esc(g.kind || 'missing') + '" data-gap="' + esc(g.id || '') + '" data-gi="' + (i == null ? '' : i) + '" data-leiden="' + esc(gapLeiden(g)) + '" role="note" aria-label="' + esc(gapLine(g)) + '">' +
      '<div class="px-gaphead"><b>' + esc(GAPKIND[g.kind] || 'Lost') + '</b>' + (ext ? ' · ' + esc(ext) : '') + ' · ' + esc(gapWhere(g)) + (g.cause ? ' · ' + esc(g.cause) : '') +
      ' <span class="px-gapl mono" title="In an export (Leiden): Help ▸ Marks and conventions">' + esc(f ? (f.basis === 'witness' ? '[…] supplied' : '[…] restored') : gapLeiden(g)) + '</span></div>' +
      (f ? '<div class="px-gapfill px-gapfill-' + (f.basis === 'witness' ? 'witness' : 'conjecture') + '"><div class="px-gapsrc">' + esc(f.basis === 'witness' ? 'Restored from another copy' : 'Restored by conjecture') + ': ' + esc(fillLine(f)) + '</div><pre' + (lang ? ' lang="' + esc(lang) + '"' : '') + '>' + esc(f.text) + '</pre></div>'
        : '<div class="px-gapnone">Not restored: the seam is left open.</div>') +
      (g.note ? '<details class="px-gapnote"><summary>What is known of it</summary><p>' + esc(g.note) + '</p></details>' : '') +
      // the same gap in Leiden's notation, shown instead when the switch says so (SW.flip 'gaps')
      '<pre class="px-gapleiden"' + (lang ? ' lang="' + esc(lang) + '"' : '') + ' title="' + esc(gapLine(g)) + '">' + esc(gapLeiden(g)) + '</pre></div>';
  }
  // the gaps of a witness, as a strip of places to go to, above its view
  function gapStrip(it) {
    var gs = gapsOf(it); if (!gs.length) return '';
    return '<div class="px-gapstrip" role="list" aria-label="Gaps">' + gs.map(function (g, i) {
      return '<button class="px-gapgo" data-gapgo="' + i + '" role="listitem" title="' + SW.esc(gapLine(g)) + '">' + SW.esc((GAPKIND[g.kind] || 'Lost') + ' · ' + gapWhere(g)) + (g.fill && g.fill.text ? ' <span class="px-gapr">restored</span>' : '') + '</button>';
    }).join('') + '</div>';
  }
  // the losses of a record and its alternates, each once (a shared id is one loss)
  function gapCount(it) {
    var seen = {}, n = 0;
    [it].concat(it.alts || []).forEach(function (x) { gapsOf(x).forEach(function (g, i) { var k = g.id || (x.file || '') + '#' + i; if (!seen[k]) { seen[k] = 1; n++; } }); });
    return n;
  }
  // each loss once; a loss shared by several witnesses is placed in each ("after line 20 of the
  // text; printed p. 219 (page 29 of the scan)")
  function gapsAll(it) {
    var seen = {}, out = [];
    [it].concat(it.alts || []).forEach(function (x, xi) {
      var whose = xi ? (x.label || x.lang || 'alternate') : 'the original';
      gapsOf(x).forEach(function (g, i) {
        var k = g.id || (x.file || '') + '#' + i;
        if (seen[k] == null) { seen[k] = out.length; out.push({ g: g, places: [gapWhere(g) + ', ' + whose] }); }
        else out[seen[k]].places.push(gapWhere(g) + ', ' + whose);
      });
    });
    return out.map(function (o) { return o.places.length > 1 ? Object.assign({}, o.g, { label: o.places.join('; ') }) : o.g; });
  }
  // what a search reads of the gaps: the place, the kind, the cause and note (fill: the restorations)
  function gapHay(it, fill) {
    return gapsAll(it).map(function (g) {
      return fill ? (g.fill && g.fill.text ? [g.fill.text, g.fill.source, g.fill.by].join(' ') : '') : [g.kind, gapWhere(g), g.cause, g.note, g.extent].join(' ');
    }).join(' ');
  }
  // a text with its seams: lines standing for a loss ({ lines }) drawn as the seam, a seam after a
  // line ({ after }) put between; the rest as the text, each run in a <pre> of its language
  function gapText(it, t) {
    var gs = gapsOf(it).map(function (g, i) { return [g, i]; }).filter(function (x) { return x[0].at.lines || x[0].at.after != null; });
    if (!gs.length) return null;
    var L = String(t).replace(/\r\n?/g, '\n').split('\n'), at = {}, skip = {};
    gs.forEach(function (x) {
      var a = x[0].at;
      if (a.lines) { for (var i = a.lines[0]; i <= a.lines[1]; i++) skip[i] = 1; (at[a.lines[0] - 1] = at[a.lines[0] - 1] || []).push(x); }
      else (at[+a.after] = at[+a.after] || []).push(x);
    });
    var out = [], run = [];
    function flush() { if (run.length) { out.push(preHTML(it, run.join('\n'))); run = []; } }
    (at[0] || []).forEach(function (x) { out.push(gapHTML(x[0], it, x[1])); });
    L.forEach(function (line, i) {
      var n = i + 1;
      if (!skip[n]) run.push(line);
      if (at[n]) { flush(); at[n].forEach(function (x) { out.push(gapHTML(x[0], it, x[1])); }); }
    });
    flush();
    return '<div class="px-textgaps">' + out.join('') + '</div>';
  }
  // a selection copied across a seam takes the seam's Leiden form, never its fill as the text
  function leidenCopy(e) {
    var sel = window.getSelection(); if (!sel || !sel.rangeCount) return;
    var frag = sel.getRangeAt(0).cloneContents(); if (!frag.querySelector || !frag.querySelector('.px-gap')) return;
    var parts = [];
    (function walk(node) {
      node.childNodes.forEach(function (c) {
        if (c.nodeType === 3) parts.push(c.nodeValue);
        else if (c.classList && c.classList.contains('px-gap')) parts.push('\n' + c.dataset.leiden + '\n');
        else if (c.nodeType === 1) { walk(c); if (c.tagName === 'PRE' && !/\n$/.test(parts[parts.length - 1] || '')) parts.push('\n'); }
      });
    })(frag);
    e.clipboardData.setData('text/plain', parts.join('').replace(/\n{3,}/g, '\n\n').replace(/^\n+/, ''));
    e.preventDefault();
  }
  // audio and video: the gaps on a strip under the player, and said aloud when playback reaches one
  function mediaGaps(it, pv) {
    var gs = gapsOf(it).filter(function (g) { return g.at.t; }), m = SW.$('audio, video', pv);
    if (!gs.length || !m) return;
    var tl = SW.el('div', { class: 'px-gaptl', 'aria-hidden': 'true' }), say = SW.el('div', { class: 'px-gapsay', 'aria-live': 'polite' });
    m.after(tl); tl.after(say);
    function lay() {
      var dur = m.duration; if (!dur || !isFinite(dur)) return;
      tl.innerHTML = gs.map(function (g) { return '<span class="px-gaptlb" title="' + SW.esc(gapLine(g)) + '" style="left:' + (100 * g.at.t[0] / dur) + '%;width:' + Math.max(0.5, 100 * (g.at.t[1] - g.at.t[0]) / dur) + '%"></span>'; }).join('');
    }
    m.addEventListener('loadedmetadata', lay); lay();
    var inGap = null;
    m.addEventListener('timeupdate', function () {
      var t = m.currentTime, g = gs.filter(function (x) { return t >= x.at.t[0] && t < x.at.t[1]; })[0] || null;
      if (g === inGap) return; inGap = g;
      say.textContent = g ? (GAPKIND[g.kind] || 'Lost') + ' here, ' + gapWhere(g) + (g.cause ? ': ' + g.cause : '') : '';
    });
  }

  function gapWire(it, pv) {
    if (!gapsOf(it).length) return;
    if (!SW.$('.px-gapstrip', pv)) pv.insertAdjacentHTML('afterbegin', gapStrip(it));
    if (pv.dataset.gapwired) return;
    pv.dataset.gapwired = '1';
    pv.addEventListener('copy', leidenCopy);
    pv.addEventListener('click', function (e) {
      var b = e.target.closest('[data-gapgo]'); if (!b) return;
      var cur = pv.__gapIt || it, g = gapsOf(cur)[+b.dataset.gapgo]; if (!g) return;
      var a = g.at, seam = SW.$('.px-gap[data-gi="' + b.dataset.gapgo + '"]', pv), m = SW.$('audio, video', pv);
      if (seam) { seam.scrollIntoView({ block: 'center', behavior: 'smooth' }); seam.classList.add('px-gapflash'); setTimeout(function () { seam.classList.remove('px-gapflash'); }, 1200); }
      else if ((a.page != null || a.pages) && pv.__gopage) pv.__gopage(a.page != null ? a.page : a.pages[0]);
      else if (a.t && m) { m.currentTime = a.t[0]; }
    });
  }
  function showFile(it, pv, dl) {
    pv.__gapIt = it;
    var strip = gapStrip(it), done = function () { gapWire(it, pv); };
    var esc = SW.esc;
    if (!it.file && it.kind === 'missing') {
      // the description, each citing paratext's code a link to it (SW.md makes the links)
      var body = SW.md ? SW.md(it.description || '') : '<p>' + esc(it.description || '') + '</p>';
      pv.innerHTML = '<div class="px-missing"><p class="px-misshead">❔ Provenance found but item not available or missing</p><div class="note-md">' + body + '</div></div>';
      return;
    }
    if (!it.file) {
      pv.innerHTML = okURL(it.url) ? embedHTML(it.url.trim(), it.kind, it.title) : '<p class="hint">Nothing held here, and no link.</p>';
      // a linked text or code file shown as text where the place it is held lets the browser read
      // it (GitHub's raw files do); elsewhere the link stays
      if (okURL(it.url) && (it.kind === 'text' || it.kind === 'software')) {
        var link0 = pv.innerHTML;
        fetch(it.url.trim()).then(function (r) { if (!r.ok) throw new Error(r.status); return r.text(); })
          .then(function (t) { if (pv.__gapIt === it) pv.innerHTML = preHTML(it, t) + link0; }, function () { /* not readable from here: the link stays */ });
      }
      return;
    }
    blobOf(it).then(function (u) {
      if (dl && pv.__gapIt === it) dl.href = u;   // the reading still showing, not one switched away from
      if (it.kind === 'audio' || /^audio\//.test(it.mime || '')) { pv.innerHTML = strip + '<audio class="px-audio" controls preload="metadata" src="' + u + '"></audio>'; mediaGaps(it, pv); done(); }
      else if (it.kind === 'video' || /^video\//.test(it.mime || '')) { pv.innerHTML = strip + '<video class="px-video" controls preload="metadata" src="' + u + '"></video>'; mediaGaps(it, pv); done(); }
      else if (it.kind === 'image') { zoomImage(it, pv, u); done(); }
      else if (it.kind === 'pdf') { zoomPdf(it, pv, u); done(); }
      else if (/^text\//.test(it.mime || '') || it.kind === 'text' || it.kind === 'software') fetch(u).then(function (r) { return r.text(); }).then(function (t) { pv.innerHTML = strip + (gapText(it, t) || preHTML(it, t)); done(); });
      else pv.innerHTML = '<p class="hint">No preview for this kind of file: ⤓ Download to open it.</p>';
    }, function (e) { pv.innerHTML = '<p class="badge err">' + esc(e.message) + '</p>'; });
  }
  // ---------- stepping through: the list it was opened from, and its sequences ----------
  // The list as it stands (collection, filters, search, sort) when an item is opened from it.
  function listCtx() {
    var lab = F.c === '_wd' ? 'Withdrawn' : F.c === '_none' ? 'Not in a collection' : inC() ? (coll(F.c) || {}).name || 'this collection' : 'All';
    var filtered = ['tag', 'v', 'genre', 'lang', 'kind', 'q'].some(function (k) { return F[k]; });
    return { codes: cur.map(function (x) { return x.code; }), label: lab + (filtered ? ', as filtered' : '') };
  }
  // Sequences: fixed orders kept on the catalogue, across collections and filters (a run of
  // logbooks, a deposition's volumes, a transcript's parts): cat.sequences = [{ id, name, codes:
  // [P-codes, in order], note }]. An item can be in several. A stub in a run shows as itself.
  function seqs() { return (cat && cat.sequences) || []; }
  function seqsOf(code) { return seqs().filter(function (q) { return (q.codes || []).indexOf(code) >= 0; }); }
  function seqCodes(q) { return (q.codes || []).filter(function (c) { return byCode(c); }); }
  function stepBar(kind, codes, code, label, tip) {
    var esc = SW.esc, i = codes.indexOf(code); if (i < 0 || codes.length < 2) return '';
    var prev = codes[i - 1], next = codes[i + 1], tt = function (c) { var x = c && byCode(c); return x ? esc(c + ': ' + x.title) : ''; };
    return '<div class="px-stepbar" data-stepkind="' + kind + '"><button class="btn ghost" data-step="' + esc(prev || '') + '"' + (prev ? ' title="' + tt(prev) + ' (←)"' : ' disabled') + '>‹ Back</button>' +
      '<span class="px-steppos" title="' + esc(tip || '') + '">' + (i + 1) + ' of ' + codes.length + ' in ' + esc(label) + '</span>' +
      '<button class="btn ghost" data-step="' + esc(next || '') + '"' + (next ? ' title="' + tt(next) + ' (→)"' : ' disabled') + '>Next ›</button></div>';
  }
  function stepBars(it, ctx) {
    var out = ctx && ctx.codes ? stepBar('list', ctx.codes, it.code, ctx.label, 'The list it was opened from, as it stood') : '';
    seqsOf(it.code).forEach(function (q) { out += stepBar('seq', seqCodes(q), it.code, '⛓ ' + q.name, q.note || 'A sequence: a fixed order'); });
    return out;
  }
  function seqsHTML(it) {
    var esc = SW.esc, mine = seqsOf(it.code), others = seqs().filter(function (q) { return mine.indexOf(q) < 0; });
    return '<span class="px-lab">Sequences</span><span>' + (mine.length ? mine.map(function (q) {
      var cs = seqCodes(q), i = cs.indexOf(it.code);
      return '<span class="fd-tag px-cchip" title="' + esc(q.note || q.name) + '"><a href="#" data-seqedit="' + esc(q.id) + '" title="Edit the sequence">⛓ ' + esc(q.name) + '</a> · ' + (i + 1) + '/' + cs.length +
        '<button data-seqmv="-1" data-seq="' + esc(q.id) + '" title="Earlier in the sequence"' + (i > 0 ? '' : ' disabled') + '>↑</button><button data-seqmv="1" data-seq="' + esc(q.id) + '" title="Later in the sequence"' + (i < cs.length - 1 ? '' : ' disabled') + '>↓</button><button data-unseq="' + esc(q.id) + '" title="Take it out of this sequence">×</button></span>';
    }).join(' ') : '<span class="faint">none</span>') +
      ' <select class="px-addseq" title="Put it in a sequence, at the end"><option value="">＋ Add to…</option>' + others.map(function (q) { return '<option value="' + esc(q.id) + '">' + esc(q.name) + ' (' + (q.codes || []).length + ')</option>'; }).join('') + '<option value="_new">＋ A new sequence…</option></select></span>';
  }
  // Related: links with no order between two items (a transcript and its recording, two papers
  // from one archive folder, two prints of one photograph): related [P-codes] on each item,
  // written both ways; a code not in the catalogue is skipped.
  function relOf(it) { return (it.related || []).filter(function (c) { return c !== it.code && byCode(c); }); }
  function relatedHTML(it) {
    var esc = SW.esc, r = relOf(it);
    return '<h4 class="fd-rh">Related <span class="faint">' + (r.length || '') + '</span> <button class="btn ghost px-reladd" data-a="addrel" title="Link another item to this one (both ways)">＋ Add…</button></h4>' +
      (r.length ? '<ul class="px-citelist">' + r.map(function (c) {
        var x = byCode(c);
        return '<li class="px-relrow"><button class="px-cite" data-relgo="' + esc(c) + '" title="Open it"><span class="px-code mono">' + esc(c) + '</span> <b>' + esc(x.title) + '</b>' + homeChip(x) + (x.kind === 'missing' ? ' <span class="px-s px-misschip">Not available or missing</span>' : '') + (x.date ? ' · <span class="faint">' + esc(x.date) + '</span>' : '') + '</button><button class="icon-btn px-relx" data-unrel="' + esc(c) + '" title="Unlink (both ways)">×</button></li>';
      }).join('') + '</ul>' : '');
  }
  // The sequence editor: a box to make or change a sequence (its name, its note, its members in
  // order: drag, ↑ ↓, ×, and add by code or title), saved in one commit. opts.append adds codes
  // (a selection) at the end; opts.after runs once it is saved.
  function seqEditor(id, opts) {
    opts = opts || {};
    var esc = SW.esc, q0 = seqs().filter(function (q) { return q.id === id; })[0];
    var w = { name: q0 ? q0.name : '', note: q0 ? q0.note || '' : '', codes: q0 ? (q0.codes || []).slice() : [] };
    (opts.append || []).forEach(function (c) { if (w.codes.indexOf(c) < 0) w.codes.push(c); });
    var start = JSON.stringify(w), dragI = -1;
    var d = SW.el('dialog', { class: 'tray-big px-dlg px-seqdlg' });
    d.innerHTML = '<div class="tray-bighead"><b>⛓ ' + (q0 ? 'Sequence' : 'A new sequence') + '</b><span class="refhelp-acts"><button class="icon-btn" data-x title="Close (Esc)">✕</button></span></div>' +
      '<p class="hint">A fixed order across collections and filters: a run of logbooks, a deposition’s volumes, a transcript’s parts. Put a missing member in as its stub, so the gap shows. Drag a row, or use ↑ ↓, to order it.</p>' +
      '<div class="px-fields"><label><span>Name</span><input class="px-sqname" value="' + esc(w.name) + '" placeholder="e.g. The RLE PDP-1 logbooks"></label>' +
      '<label><span>Note</span><input class="px-sqnote" value="' + esc(w.note) + '" placeholder="what the run is, and what is missing from it"></label></div>' +
      '<ol class="px-sqlist"></ol>' +
      '<div class="px-sqadd"><input class="px-sqin" list="px-sqopts" placeholder="Add an item: its code, or start typing its title"><datalist id="px-sqopts">' +
        cat.items.filter(live).map(function (it) { return '<option value="' + esc(it.code + ' — ' + it.title) + '">'; }).join('') + '</datalist><button class="btn ghost" data-sq="add">Add</button></div>' +
      '<div class="px-acts"><button class="btn" data-sq="save">Save</button> <button class="btn ghost" data-sq="cancel">Cancel</button> <span class="hint px-msg"></span>' +
        (q0 ? '<button class="btn ghost px-wd" data-sq="del" title="Delete the sequence (its items stay in the catalogue)">Delete the sequence…</button>' : '') + '</div>';
    document.body.appendChild(d);
    d.addEventListener('close', function () { d.remove(); });
    var list = SW.$('.px-sqlist', d), msg = SW.$('.px-msg', d);
    function read() { w.name = SW.$('.px-sqname', d).value.trim(); w.note = SW.$('.px-sqnote', d).value.trim(); }
    function paintL() {
      list.innerHTML = w.codes.length ? w.codes.map(function (c, i) {
        var x = byCode(c);
        return '<li class="px-sqrow" draggable="true" data-i="' + i + '"><span class="px-sqgrip" title="Drag to move">⋮⋮</span><span class="px-sqn">' + (i + 1) + '</span>' +
          '<span class="px-code mono">' + esc(c) + '</span> <span class="px-sqt">' + (x ? esc(x.title) + homeChip(x) + (x.kind === 'missing' ? ' <span class="px-s px-misschip">Not available or missing</span>' : '') + (x.date ? ' <span class="faint">' + esc(x.date) + '</span>' : '') : '<span class="faint">not in the catalogue</span>') + '</span>' +
          '<span class="px-sqbtns"><button class="icon-btn" data-sqmv="-1" title="Earlier"' + (i ? '' : ' disabled') + '>↑</button><button class="icon-btn" data-sqmv="1" title="Later"' + (i < w.codes.length - 1 ? '' : ' disabled') + '>↓</button><button class="icon-btn" data-sqdel title="Take it out of the sequence">×</button></span></li>';
      }).join('') : '<li class="hint">No items yet: add them below, or tick them in the list and choose ⛓ Sequence in the bar that appears.</li>';
    }
    function add() {
      var inp = SW.$('.px-sqin', d), v = inp.value.trim(), m = /P-[0-9A-Z]{5}/i.exec(v), code = m ? m[0].toUpperCase() : '';
      if (!code) { var t = v.toLowerCase(), hit = cat.items.filter(function (x) { return live(x) && x.title.toLowerCase().indexOf(t) >= 0; }); if (v && hit.length === 1) code = hit[0].code; }
      if (!code || !byCode(code)) { msg.textContent = v ? 'No item with that code or title.' : 'Give a code or a title.'; return; }
      if (w.codes.indexOf(code) >= 0) { msg.textContent = code + ' is in it already.'; return; }
      w.codes.push(code); inp.value = ''; msg.textContent = ''; paintL(); inp.focus();
    }
    function saveIt() {
      read();
      if (!w.name) { msg.textContent = 'Give it a name.'; SW.$('.px-sqname', d).focus(); return Promise.resolve(false); }
      msg.textContent = 'Saving…';
      var sid = q0 ? q0.id : 's' + Math.random().toString(36).slice(2, 8);
      return save('Sequence ' + w.name + ': ' + (q0 ? 'changed' : 'made') + ', ' + w.codes.length + ' items, by ' + me(), function (c) {
        c.sequences = c.sequences || [];
        var q = c.sequences.filter(function (x) { return x.id === sid; })[0];
        if (!q) { q = { id: sid }; c.sequences.push(q); }
        q.name = w.name; q.note = w.note; q.codes = w.codes.slice();
      }).then(function () { start = JSON.stringify(w); SW.toast('Saved: ⛓ ' + w.name, 3000); refresh(); var b = SW.$('#view-paratexts .px-body'); if (b) paintNav(b); if (opts.after) opts.after(); return true; },
        function (err) { msg.textContent = err.message; return false; });
    }
    guardClose(d, function () { read(); return JSON.stringify(w) !== start ? 'Changes to this sequence will be lost: Save keeps them.' : ''; }, saveIt);
    d.addEventListener('click', function (e) {
      var t = e.target;
      if (t === d || t.closest('[data-x]') || t.closest('[data-sq="cancel"]')) { d.__leave(); return; }
      if (t.closest('[data-sq="add"]')) { add(); return; }
      if (t.closest('[data-sq="save"]')) { saveIt().then(function (ok) { if (ok) d.close(); }); return; }
      if (t.closest('[data-sq="del"]')) {
        if (!confirm('Delete the sequence “' + (q0.name) + '”? Its ' + q0.codes.length + ' items stay in the catalogue.')) return;
        save('Sequence ' + q0.name + ': deleted, by ' + me(), function (c) { c.sequences = (c.sequences || []).filter(function (x) { return x.id !== q0.id; }); })
          .then(function () { start = JSON.stringify(w); d.close(); refresh(); var b = SW.$('#view-paratexts .px-body'); if (b) paintNav(b); if (opts.after) opts.after(); }, function (err) { msg.textContent = err.message; });
        return;
      }
      var row = t.closest('.px-sqrow'); if (!row) return; var i = +row.dataset.i;
      var mv = t.closest('[data-sqmv]');
      if (mv) { read(); var j = i + (+mv.dataset.sqmv); if (j >= 0 && j < w.codes.length) { var x = w.codes[i]; w.codes[i] = w.codes[j]; w.codes[j] = x; paintL(); } return; }
      if (t.closest('[data-sqdel]')) { read(); w.codes.splice(i, 1); paintL(); }
    });
    SW.$('.px-sqin', d).addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); add(); } });
    list.addEventListener('dragstart', function (e) { var r = e.target.closest('.px-sqrow'); if (!r) return; dragI = +r.dataset.i; e.dataTransfer.effectAllowed = 'move'; try { e.dataTransfer.setData('text/plain', String(dragI)); } catch (x) {} r.classList.add('dragging'); });
    list.addEventListener('dragover', function (e) { if (dragI < 0) return; e.preventDefault(); var r = e.target.closest('.px-sqrow'); SW.$$('.px-sqrow', list).forEach(function (x) { x.classList.toggle('over', x === r); }); });
    list.addEventListener('dragend', function () { dragI = -1; SW.$$('.px-sqrow', list).forEach(function (x) { x.classList.remove('over', 'dragging'); }); });
    list.addEventListener('drop', function (e) {
      e.preventDefault(); var r = e.target.closest('.px-sqrow'); if (dragI < 0 || !r) return;
      read(); var j = +r.dataset.i, x = w.codes.splice(dragI, 1)[0]; w.codes.splice(j, 0, x); dragI = -1; paintL();
    });
    paintL(); d.showModal(); SW.$(q0 ? '.px-sqin' : '.px-sqname', d).focus();
  }
  function openItem(code, ctx) {
    var it = byCode(code); if (!it) { SW.toast(code + ' is not in the catalogue.', 4000); return; }
    var esc = SW.esc, d = SW.el('dialog', { class: 'tray-big px-dlg' });
    var gh0 = it.file ? 'https://github.com/' + REPO + '/blob/main/' + it.file.split('/').map(encodeURIComponent).join('/') : '';
    d.innerHTML = '<div class="tray-bighead"><span class="px-code mono" data-copy="' + esc(it.code) + '" title="Its code: click to copy">' + esc(it.code) + '</span> <b>' + esc(it.title) + '</b>' +
      '<span class="refhelp-acts"><button class="btn ghost" data-share="' + esc(it.code) + '" title="Send it to someone: a link that opens the bench at this paratext">' + SW.SHARE_ICON + ' Share</button><button class="btn ghost" data-a="keep" title="This paratext, with its details, in My notes (private)">＋ My notes</button>' + fileMenu(it, gh0) + '<button class="icon-btn" data-x title="Close (Esc)">✕</button></span></div>' +
      '<div class="px-stepbars">' + stepBars(it, ctx) + '</div>' +
      '<div class="px-cols"><div class="px-view' + (altList(it).length || gapCount(it) ? ' px-withalts' : '') + '">' +
      (altList(it).length || gapCount(it) ? '<div class="px-viewbar">' + (gapCount(it) ? SW.flip.html('gaps', [['kintsugi', 'Kintsugi', 'Gaps drawn as seams in gold, with what is known of each.'], ['leiden', 'Leiden', 'Gaps in Leiden’s notation, as a quotation or an export carries them.']]) : '') + altBar(it) + (altList(it).length ? '<p class="px-altcap" aria-live="polite" hidden></p>' : '') + '</div>' : '') +
      '<div class="px-pv"><p class="hint">Opening…</p></div></div><div class="px-side">' + fieldsHTML(it) +
      '<div class="px-colls">' + collsHTML(it) + '</div><div class="px-colls px-seqs">' + seqsHTML(it) + '</div>' +
      '<div class="px-acts"><button class="btn" data-a="save">Save changes</button> <span class="hint px-msg"></span>' + exportMenu('data-xp') + (it.withdrawn ? '<button class="btn ghost px-wd" data-a="restore" title="Back into the list">Bring back</button>' : moreMenu('<button data-a="withdraw">Withdraw from the list…</button>')) + '</div>' +
      (it.withdrawn ? '<p class="badge px-wdnote">Withdrawn ' + esc(SW.fmtDate(it.withdrawn)) + (it.withdrawnBy ? ' by ' + esc(it.withdrawnBy) : '') + (it.withdrawnWhy ? ': ' + esc(it.withdrawnWhy) : '') + '</p>' : '') +
      '<div class="px-linkline">Use the code <span class="mono">' + esc(it.code) + '</span> in an annotation to link it. <button class="btn ghost" data-copy="' + esc(it.code) + '">Copy the code</button></div>' +
      '<div class="px-talk">' + talkHTML(it) + '</div><div class="px-related">' + relatedHTML(it) + '</div><div class="px-cited"></div></div></div>';
    document.body.appendChild(d);
    d.addEventListener('close', function () { d.remove(); });
    d.showModal();
    showFile(it, SW.$('.px-pv', d), SW.$('[data-a="dl"]', d));
    setTimeout(function () {   // fetching ahead: N either side (⚙ Settings ▸ Paratexts; 1 by default) in the list and each sequence, nearest first, and small alternates
      if (!d.isConnected) return;
      var n = +SW.store.get('px.ahead', 1); if (!(n >= 0)) n = 1; n = Math.min(n, 10);
      var near = [], runs = (ctx && ctx.codes ? [ctx.codes] : []).concat(seqsOf(it.code).map(seqCodes));
      altList(it).forEach(function (a) { if ((a.size || 0) < 5e6) near.push(altItem(it, a)); });
      for (var k = 1; k <= n; k++) runs.forEach(function (r) { var i = r.indexOf(it.code); if (i < 0) return; [r[i + k], r[i - k]].forEach(function (c) { if (c) near.push(byCode(c)); }); });
      if (n) fetchAhead(near);
    }, 700);
    d.addEventListener('click', function (e) {   // ☰ closes on a choice, or a click anywhere else
      SW.$$('details.px-filemenu[open]', d).forEach(function (x) { if (!x.contains(e.target) || e.target.closest('.px-menu a')) setTimeout(function () { x.open = false; }, 0); });
    });
    d.addEventListener('click', function (e) {   // data-alt, never data-c: the list reads [data-c] as a collection row
      var ab = e.target.closest && e.target.closest('[data-alt]'); if (!ab) return;
      var n = +ab.dataset.alt, list = altList(it), cap = SW.$('.px-altcap', d);
      SW.$$('[data-alt]', d).forEach(function (b) { b.classList.toggle('on', b === ab); b.setAttribute('aria-pressed', b === ab ? 'true' : 'false'); });
      if (cap) { cap.innerHTML = altCaption(it, n); cap.hidden = !cap.innerHTML; }
      // ☰ Download and GitHub follow the reading showing: its own file, under its own name
      var f = n < 0 ? it.file : list[n].file, dl = SW.$('[data-a="dl"]', d), gh = SW.$('[data-a="gh"]', d);
      if (dl) { dl.removeAttribute('href'); dl.download = n < 0 ? it.name || it.code : f.split('/').pop(); dl.textContent = '⤓ Download ' + altLabels(it)[n + 1].toLowerCase(); }
      if (gh) gh.href = 'https://github.com/' + REPO + '/blob/main/' + f.split('/').map(encodeURIComponent).join('/');
      showFile(n < 0 ? it : altItem(it, list[n]), SW.$('.px-pv', d), dl);
    });
    citedIn(code, SW.$('.px-cited', d));
    var kept = JSON.stringify(readFields(SW.$('.px-side', d)));
    function saveDetails() {   // resolves true once saved, false if it failed
      var a = SW.$('[data-a="save"]', d), msg = SW.$('.px-msg', d), o = readFields(SW.$('.px-side', d)), was = JSON.stringify(o);
      a.disabled = true; msg.textContent = 'Saving…';
      return save('Paratext ' + it.code + ': details, by ' + me(), function (c) { c.items.forEach(function (x) { if (x.code === it.code) { Object.assign(x, o); x.updated = now(); x.updatedBy = me(); } }); })
        .then(function () { a.disabled = false; msg.textContent = 'Saved'; kept = was; it = byCode(code); SW.$('.tray-bighead b', d).textContent = it.title; refresh(); return true; },
          function (err) { a.disabled = false; msg.textContent = err.message; return false; });
    }
    guardClose(d, function () {
      var changed = JSON.stringify(readFields(SW.$('.px-side', d))) !== kept, ta = SW.$('.px-cbox textarea', d), said = ta && ta.value.trim();
      return changed && said ? 'Changes to its details, and a comment not yet sent, will be lost.' : changed ? 'Changes to its details will be lost: Save keeps them.' : said ? 'A comment not yet sent will be lost.' : '';
    }, function () { return saveDetails(); });
    function talk(label, change) {   // a rating, emoji or comment: saved, then the talk redrawn
      var who = me();
      if (who === '?') return SW.askInitials('Ratings, reactions and comments are signed with your initials, and none are set.').then(function (ini) { return ini ? talk(label, change) : null; });
      return save('Paratext ' + it.code + ': ' + label + ', by ' + who, function (c) { c.items.forEach(function (x) { if (x.code === it.code) change(x, who); }); })
        .then(function () { it = byCode(code); var t = SW.$('.px-talk', d), op = SW.$('.px-cfold', t) && SW.$('.px-cfold', t).open; t.innerHTML = talkHTML(it); if (op) SW.$('.px-cfold', t).open = true; SW.mdTools(SW.$('.px-cbox textarea', t)); refresh(); }, function (err) { SW.toast(err.message, 5000); });
    }
    SW.mdTools(SW.$('.px-cbox textarea', d));
    function colls0() { it = byCode(code); var b = SW.$('.px-colls', d); if (b) b.innerHTML = collsHTML(it); }
    function seqs0() { it = byCode(code); var b = SW.$('.px-seqs', d); if (b) b.innerHTML = seqsHTML(it); var sb = SW.$('.px-stepbars', d); if (sb) sb.innerHTML = stepBars(it, ctx); }
    function seqSave(label, change) { return save('Paratext ' + code + ': ' + label + ', by ' + me(), function (c) { c.sequences = c.sequences || []; change(c.sequences); }).then(seqs0, function (err) { SW.toast(err.message, 5000); }); }
    function rel0() { it = byCode(code); var b = SW.$('.px-related', d); if (b) b.innerHTML = relatedHTML(it); }
    function relSave(label, other, add) {
      return save('Paratexts ' + code + ', ' + other + ': ' + label + ', by ' + me(), function (c) {
        c.items.forEach(function (x) {
          var mate = x.code === code ? other : x.code === other ? code : null; if (!mate) return;
          var r = (x.related || []).filter(function (y) { return y !== mate; }); if (add) r.push(mate);
          if (r.length) x.related = r; else delete x.related;
        });
      }).then(rel0, function (err) { SW.toast(err.message, 5000); });
    }
    function step(to) { if (to && byCode(to)) d.__leave(function () { openItem(to, ctx); }); }
    d.addEventListener('keydown', function (e) {   // ← → step through the first bar (the list it came from, else its first sequence)
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight' || e.metaKey || e.ctrlKey || e.altKey) return;
      var t = e.target; if (t.closest && t.closest('input, textarea, select, [contenteditable="true"], .px-zone')) return;
      var bar = SW.$('.px-stepbar', d); if (!bar) return;
      var bs = SW.$$('[data-step]', bar), to = (e.key === 'ArrowLeft' ? bs[0] : bs[1]).dataset.step;
      if (to) { e.preventDefault(); step(to); }
    });
    d.addEventListener('change', function (e) {
      if (!e.target.classList.contains('px-addseq')) return;
      var v = e.target.value; e.target.value = ''; if (!v) return;
      if (v === '_new') {
        var nm = prompt('A name for the new sequence (a fixed order: a run of logbooks, the volumes of a deposition)'); if (!nm || !nm.trim()) return;
        var id = 's' + Math.random().toString(36).slice(2, 8);
        seqSave('a new sequence, ' + nm.trim(), function (S) { S.push({ id: id, name: nm.trim(), codes: [code], note: '' }); });
      } else seqSave('added to a sequence', function (S) { S.forEach(function (q) { if (q.id === v && q.codes.indexOf(code) < 0) q.codes.push(code); }); });
    });
    d.addEventListener('change', function (e) {
      if (!e.target.classList.contains('px-addc')) return;
      var v = e.target.value; e.target.value = ''; if (!v) return;
      var p = v === '_new' ? (function () { var nm = prompt('A name for the new collection'); return nm && nm.trim() ? newColl(nm.trim(), '', [code]) : Promise.resolve(); })() : addTo([code], v);
      colls0(); p.then(colls0);
    });
    d.addEventListener('click', function (e) {
      if (e.target === d || e.target.closest('[data-x]')) { d.__leave(); return; }
      var stp = e.target.closest('[data-step]'); if (stp) { step(stp.dataset.step); return; }
      var rg = e.target.closest('[data-relgo]'); if (rg) { var to0 = rg.dataset.relgo; d.__leave(function () { openItem(to0, ctx); }); return; }
      var ur = e.target.closest('[data-unrel]'); if (ur) { relSave('unlinked', ur.dataset.unrel, false); return; }
      if (e.target.closest('[data-a="addrel"]')) {
        var other = (prompt('The code of the related item (P-XXXXX)') || '').trim().toUpperCase();
        if (!other) return;
        if (other === code || !byCode(other)) { SW.toast(other + (other === code ? ' is this item.' : ' is not in the catalogue.'), 4000); return; }
        relSave('linked as related', other, true); return;
      }
      var se = e.target.closest('[data-seqedit]'); if (se) { e.preventDefault(); seqEditor(se.dataset.seqedit, { after: seqs0 }); return; }
      var sm = e.target.closest('[data-seqmv]');
      if (sm) { var dir = +sm.dataset.seqmv, sid = sm.dataset.seq; seqSave('moved in a sequence', function (S) { S.forEach(function (q) { if (q.id !== sid) return; var i = q.codes.indexOf(code), j = i + dir; if (i < 0 || j < 0 || j >= q.codes.length) return; q.codes[i] = q.codes[j]; q.codes[j] = code; }); }); return; }
      var us = e.target.closest('[data-unseq]');
      if (us) { var uid = us.dataset.unseq; seqSave('taken out of a sequence', function (S) { S.forEach(function (q) { if (q.id === uid) q.codes = q.codes.filter(function (x) { return x !== code; }); }); for (var k = S.length - 1; k >= 0; k--) if (S[k].id === uid && !S[k].codes.length) S.splice(k, 1); }); return; }
      var xp = e.target.closest('[data-xp]');
      if (xp) { var xd = xp.closest('details'); if (xd) xd.open = false; exportItems(xp.dataset.xp, [byCode(code)], code); return; }
      var uc = e.target.closest('[data-uncoll]');
      if (uc) { var pr = outOf([code], uc.dataset.uncoll); colls0(); pr.then(colls0); return; }
      var rb = e.target.closest('[data-rate]');
      if (rb) { rateIt(it.code, paintStars(rb, 'rate')); return; }
      var eb = e.target.closest('[data-emoji]');
      if (eb) { var em = eb.dataset.emoji; eb.disabled = true; talk(em, function (x, who) { x.rx = x.rx || {}; var l = x.rx[em] = x.rx[em] || [], i = l.indexOf(who); if (i >= 0) l.splice(i, 1); else l.push(who); if (!l.length) delete x.rx[em]; }); return; }
      var a = e.target.closest('[data-a]'); if (!a) return;
      var msg = SW.$('.px-msg', d);
      if (a.dataset.a === 'comment') {
        var ta = SW.$('.px-cbox textarea', d), text = ta.value.trim(); if (!text) return;
        a.disabled = true;
        talk('comment', function (x, who) { x.comments = x.comments || []; x.comments.push({ id: Math.random().toString(36).slice(2, 9), by: who, date: now(), text: text }); });
        return;
      }
      if (a.dataset.a === 'save') saveDetails();
      else if (a.dataset.a === 'withdraw') {
        var mm = a.closest('details'); if (mm) mm.open = false;
        withdrawBox([it.code], function () { d.close(); });
      } else if (a.dataset.a === 'restore') {
        change('Paratext ' + it.code + ': brought back', each([it.code], unwithdraw))
          .then(function (ok) { if (ok) { d.close(); SW.toast(it.code + ' brought back'); } });
      } else if (a.dataset.a === 'keep') {
        if (!SW.tray) return;
        var rows = FIELDS.map(function (f) { var v = it[f[0]]; return [f[1], Array.isArray(v) ? v.join(', ') : v || '']; }).filter(function (r) { return r[1]; });
        SW.tray.addDoc({ title: 'Paratext ' + it.code + ': ' + it.title, subtitle: it.file ? REPO + ', ' + it.file : it.url || REPO, blocks: [SW.tableBlock('The paratext', ['', ''], rows)] }, { tags: ['paratext'], vid: (it.versions || [])[0] || SW.state.v });
      }
    });
  }
  // Ratings, emojis and comments, in the item's record: rates {initials: 1-3}, rx {emoji: [initials]},
  // comments [{id, by, date, text}]
  function collsHTML(it) {
    var esc = SW.esc, mine = inColl(it);
    return '<span class="px-lab">Collections</span><span>' + (mine.length ? mine.map(function (id) { return '<span class="fd-tag px-cchip" title="' + esc(pathName(id)) + '">📁 ' + esc(coll(id).name) + '<button data-uncoll="' + esc(id) + '" title="Take it out of this collection">×</button></span>'; }).join(' ') : '<span class="faint">none</span>') +
      ' <select class="px-addc" title="Put it in a collection"><option value="">＋ Add to…</option>' + treeOpts(mine) + '<option value="_new">＋ A new collection…</option></select></span>';
  }
  function avg(it) { var r = it.rates || {}, k = Object.keys(r); return k.length ? { avg: k.reduce(function (t, x) { return t + r[x]; }, 0) / k.length, n: k.length, who: k.map(function (x) { return x + ' ' + '★'.repeat(r[x]); }) } : null; }
  // after a rating lands, the averages are stale wherever they are shown
  function redrawTalk() {
    var t = document.querySelector('.px-dlg .px-talk'); if (!t) return;
    var d = t.closest('.px-dlg'), cd = d && SW.$('.px-code', d), it = cd && byCode(cd.dataset.copy || cd.textContent.trim());
    if (!it) return;
    var op = SW.$('.px-cfold', t) && SW.$('.px-cfold', t).open;
    t.innerHTML = talkHTML(it);
    if (op && SW.$('.px-cfold', t)) SW.$('.px-cfold', t).open = true;
    if (SW.mdTools) SW.mdTools(SW.$('.px-cbox textarea', t));
  }
  // the stars move before anything is saved: a click should never wait on the network
  function paintStars(btn, attr) {
    var row = btn.parentNode, want = +btn.dataset[attr];
    var on = SW.$$('[data-' + attr + '].on', row).length;
    var off = btn.classList.contains('on') && on === want;   // the same star again clears it
    SW.$$('[data-' + attr + ']', row).forEach(function (b) { b.classList.toggle('on', !off && +b.dataset[attr] <= want); });
    return off ? 0 : want;
  }
  // Ratings coalesce. Each save is a fetch of the catalogue and a write back, so three quick
  // clicks used to mean six round trips in a queue; now the last one within the window wins.
  // What the reader asked for (pendingRates: code -> stars, 0 for none) is shown at once, on the card
  // and in the open panel, and held until its own save is written: a save that returns while a
  // later click waits must not paint the earlier rating back, and the catalogue each save
  // fetches afresh does not know the clicks still waiting.
  var pendingRates = {}, rateTimer = null;
  function applyWanted() {
    var who = me();
    Object.keys(pendingRates).forEach(function (code) {
      var it0 = byCode(code); if (!it0) return;
      it0.rates = it0.rates || {};
      if (pendingRates[code]) it0.rates[who] = pendingRates[code]; else delete it0.rates[who];
    });
  }
  function showRating(code) {
    var it0 = byCode(code), mr = it0 ? ((it0.rates || {})[me()] || 0) : 0, a = it0 ? avg(it0) : null;
    SW.$$('[data-cardrate][data-rcode="' + code + '"]').forEach(function (b) { b.classList.toggle('on', +b.dataset.cardrate <= mr); });
    SW.$$('[data-cardrate][data-rcode="' + code + '"]').map(function (b) { return b.parentNode; }).filter(function (x, i, l) { return l.indexOf(x) === i; }).forEach(function (row) {
      var av = SW.$('.px-cavg', row);
      if (a && !av) { av = SW.el('span', { class: 'faint px-cavg' }); row.appendChild(av); }
      if (av) { if (a) av.textContent = String(Math.round(a.avg * 10) / 10); else av.remove(); }
    });
    redrawTalk();
  }
  function rateIt(code, k) {
    var who = me();
    if (who === '?') return SW.askInitials('Ratings are signed with your initials, and none are set.')
      .then(function (ini) { return ini ? rateIt(code, k) : null; });
    pendingRates[code] = k || 0;
    applyWanted(); showRating(code);
    clearTimeout(rateTimer);
    rateTimer = setTimeout(function () {
      rateTimer = null;
      var want = {}; Object.keys(pendingRates).forEach(function (c) { want[c] = pendingRates[c]; });
      var codes = Object.keys(want); if (!codes.length) return;
      save('Paratext ' + codes.join(', ') + ': rated, by ' + who, function (c) {
        c.items.forEach(function (x) {
          if (!(x.code in want)) return;
          x.rates = x.rates || {};
          if (want[x.code]) x.rates[who] = want[x.code]; else delete x.rates[who];
          if (!Object.keys(x.rates).length) delete x.rates;
          x.updated = now(); x.updatedBy = who;
        });
      }).then(function () {
        codes.forEach(function (c) { if (pendingRates[c] === want[c]) delete pendingRates[c]; });   // written, unless clicked again since
        settle();
      }, function (err) { SW.toast(err.message, 5000); codes.forEach(function (c) { if (pendingRates[c] === want[c]) delete pendingRates[c]; }); settle(); });
    }, 700);
  }
  // after a save: the list and the open panel from the catalogue, with any rating still waiting
  function settle() { applyWanted(); if (!rateTimer) refresh(); Object.keys(pendingRates).length ? Object.keys(pendingRates).forEach(showRating) : redrawTalk(); }
  function summary(it) { return gapChips(it) + summary0(it); }
  function gapChips(it) {
    var gn = gapCount(it), q = (F.q || '').toLowerCase();
    var inFill = q && gapHay(it, true).toLowerCase().indexOf(q) >= 0 && [it.code, it.title, it.description, gapHay(it)].join(' ').toLowerCase().indexOf(q) < 0;
    return (gn ? '<span class="px-s px-gapn" title="' + SW.esc(gapsAll(it).map(gapLine).join('\n')) + '">' + gn + ' gap' + (gn > 1 ? 's' : '') + '</span>' : '') +
      (inFill ? '<span class="px-s px-gapflag" title="The words searched for are in a restoration, not in the transmitted text">found in a restoration</span>' : '');
  }
  function summary0(it) {
    var gl = (genreOf(it) || [])[1];
    return (gl ? '<span class="px-s px-genre">' + SW.esc(gl) + '</span>' : '') + summary1(it);
  }
  function summary1(it) {
    var a = avg(it), rx = it.rx || {}, em = Object.keys(rx).filter(function (e) { return (rx[e] || []).length; }), nc = (it.comments || []).length;
    var mine = me(), mr = (it.rates || {})[mine] || 0;
    return '<span class="px-s px-cardrate" title="' + SW.esc(a ? (Math.round(a.avg * 10) / 10) + ' from ' + a.n + ': ' + a.who.join('; ') : 'Rate it, one to three stars') + '">' +
      [1, 2, 3].map(function (k) { return '<button class="px-cs' + (mr >= k ? ' on' : '') + '" data-cardrate="' + k + '" data-rcode="' + SW.esc(it.code) + '" title="' + k + ' star' + (k > 1 ? 's' : '') + '">\u2605</button>'; }).join('') +
      (a ? '<span class="faint px-cavg">' + (Math.round(a.avg * 10) / 10) + '</span>' : '') + '</span>' +
      (em.length ? '<span class="px-s">' + em.map(function (e) { return e + (rx[e].length > 1 ? '<sup>' + rx[e].length + '</sup>' : ''); }).join('') + '</span>' : '') +
      (nc ? '<span class="px-s">💬 ' + nc + '</span>' : '');
  }
  function talkHTML(it) {
    var esc = SW.esc, mine = me(), r = it.rates || {}, a = avg(it), rx = it.rx || {};
    var EM = (SW.notes && SW.notes.EMOJI) || ['👍', '👎', '✅', '❓', '💡', '❗', '👀'];
    return '<div class="fd-rxbar px-rx"><span class="fd-rate" title="Your rating, one to three stars (again to take it back); the crew’s average beside it">' +
      [1, 2, 3].map(function (k) { return '<button data-rate="' + k + '" class="' + ((r[mine] || 0) >= k ? 'on' : '') + '">★</button>'; }).join('') +
      (a ? ' <span class="hint" title="' + esc(a.who.join('; ')) + '">' + (Math.round(a.avg * 10) / 10) + ' from ' + a.n + '</span>' : '') + '</span>' +
      EM.filter(function (e) { return (rx[e] || []).length; }).map(function (e) { var by = rx[e]; return '<button class="fd-emo' + (by.indexOf(mine) >= 0 ? ' on' : '') + '" data-emoji="' + e + '" title="' + esc(by.join(', ')) + '">' + e + (by.length > 1 ? '<sup>' + by.length + '</sup>' : '') + '</button>'; }).join('') + '<details class="px-more px-rxmore"><summary class="fd-emo" title="React">+</summary><div class="px-menu px-rxmenu">' + EM.map(function (e) { var by = rx[e] || []; return '<button class="fd-emo' + (by.indexOf(mine) >= 0 ? ' on' : '') + '" data-emoji="' + e + '" title="' + esc(by.join(', ') || 'React') + '">' + e + (by.length ? '<sup>' + by.length + '</sup>' : '') + '</button>'; }).join('') + '</div></details></div>' +
      '<details class="px-cfold"><summary class="fd-rh">Comments' + ((it.comments || []).length ? ' <span class="faint">' + it.comments.length + '</span>' : ' <span class="faint">none yet</span>') + '</summary>' +
      ((it.comments || []).length ? it.comments.map(function (c) { return '<div class="fd-reply"><div class="fd-rhead"><b>' + esc(c.by) + '</b> <span class="faint">' + esc(SW.fmtDate(c.date)) + '</span></div><div class="note-md">' + SW.md(c.text) + '</div></div>'; }).join('') : '') +
      '<div class="fd-replybox px-cbox"><textarea rows="2" placeholder="A comment, signed ' + esc(mine) + '"></textarea><button class="btn" data-a="comment">Comment</button></div></details>';
  }
  function refresh() { var body = view && SW.$('.px-body', view); if (body && cat) paint(body); }

  // ---------- adding ----------
  function addBox() {
    var esc = SW.esc, d = SW.el('dialog', { class: 'tray-big px-dlg px-add' });
    var blank = { title: '', date: '', creator: '', source: '', rights: '', accessioned: now().slice(0, 10), description: '', tags: [], versions: [], refs: [] };
    var into = coll(F.c);
    d.innerHTML = '<div class="tray-bighead"><b>Add an item</b><span class="refhelp-acts"><button class="icon-btn" data-x title="Close (Esc)">✕</button></span></div>' +
      '<div class="px-seg px-addmode"><button class="on" data-mode="file">A file</button><button data-mode="link">A link</button><button data-mode="missing" title="Something known to have existed that the archive holds no copy of and no link to">Missing</button></div>' +
      '<label class="px-drop"><input type="file" class="px-file"><span>Choose a file, or drop one here: a scan, photograph, PDF, text, audio or video (up to 50 MB).</span></label>' +
      '<div class="px-linkin" hidden><label><span>Link</span><input class="px-url" type="url" placeholder="https://… a YouTube, Vimeo or Internet Archive recording, an audio or video file, or a page"></label>' +
      '<label><span>Shows as</span><select class="px-lkind" title="How the bench shows it from where it is held"><option value="">— choose —</option><option value="video">Video</option><option value="audio">Audio</option><option value="image">Image</option><option value="pdf">PDF</option><option value="text">Text file</option><option value="software">Code</option><option value="link">Web page or document</option><option value="other">Other</option></select></label>' +
      '<p class="hint">Catalogued with nothing copied: it plays or shows here from where it is held.</p></div>' +
      '<div class="px-missin" hidden><p class="hint">A stub for something known to have existed that the archive holds no copy of and no link to. Before adding it, read a source that shows it existed. In the description: the line “Provenance found but item not available or missing”; what it is; where it is cited, as the citing paratext’s code (P-XXXXX) with the page or time and a short quotation, or a reference; and, after “Searched:”, where it has been looked for and not found. Tag it to-locate; if a holder can be asked, tag it to-request too and say what to ask for in a paragraph beginning “Request:”, before “Searched:”. When a copy is found, add it as an item of its own, carrying the provenance over, and withdraw this stub giving the new code as the reason.</p></div>' +
      fieldsHTML(blank) + (into ? '<label class="check px-into"><input type="checkbox" class="px-intoc" checked> Into the collection “' + esc(into.name) + '”</label>' : '') + '<div class="px-acts"><button class="btn" data-a="up">Upload</button> <span class="hint px-msg"></span></div>';
    document.body.appendChild(d);
    d.addEventListener('close', function () { d.remove(); });
    d.showModal();
    var inp = SW.$('.px-file', d), drop = SW.$('.px-drop', d), file = null, mode = 'file';
    SW.$('.px-addmode', d).addEventListener('click', function (e) {
      var b = e.target.closest('[data-mode]'); if (!b) return; e.preventDefault(); mode = b.dataset.mode;
      SW.$$('.px-addmode button', d).forEach(function (x) { x.classList.toggle('on', x === b); });
      drop.hidden = mode !== 'file'; SW.$('.px-linkin', d).hidden = mode !== 'link'; SW.$('.px-missin', d).hidden = mode !== 'missing';
      SW.$('[data-a="up"]', d).textContent = mode === 'file' ? 'Upload' : 'Add';
      var ds = SW.$('[data-k="description"]', d);
      if (mode === 'missing' && ds && !ds.value.trim()) ds.value = 'Provenance found but item not available or missing.\n\nWhat it is: \n\nCited in: P-XXXXX, p. … : “…”\n\nSearched: ';
    });
    SW.$('.px-url', d).addEventListener('change', function (e) {   // the kind guessed from the address
      var u = e.target.value, k = SW.$('.px-lkind', d);
      delete SW.$('[data-a="up"]', d).dataset.again;
      if (/\.(mp3|m4a|wav|ogg|oga|flac|aac)(\?|$)/i.test(u)) k.value = 'audio';
      else if (/youtube\.com|youtu\.be|vimeo\.com|\.(mp4|webm|mov|m4v)(\?|$)/i.test(u)) k.value = 'video';
      else if (/\.(png|jpe?g|gif|webp|tiff?|svg)(\?|$)/i.test(u)) k.value = 'image';
      else if (/\.pdf(\?|$)/i.test(u)) k.value = 'pdf';
      else if (/\.(txt|md|markdown|csv|tsv|srt|vtt)(\?|$)/i.test(u)) k.value = 'text';
      else if (/\.(bas|lisp|lsp|mad|slip|c|h|js|py|asm|mac|mid|f|for|pas|java|rb|pl|sh|el|cl|scm)(\?|$)/i.test(u)) k.value = 'software';
      var g = SW.$('[data-k="genre"]', d); if (g && !g.value) g.value = guessGenre('', k.value);
    });
    function pick(f) {
      file = f; if (!f) return;
      delete SW.$('[data-a="up"]', d).dataset.again;   // a new file is checked again
      SW.$('.px-drop span', d).textContent = f.name + ' (' + fmtSize(f.size) + ')';
      var t = SW.$('[data-k="title"]', d); if (t && !t.value) t.value = f.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ');
      var g = SW.$('[data-k="genre"]', d); if (g && !g.value) g.value = guessGenre(f.type, '');
    }
    inp.addEventListener('change', function () { pick(inp.files[0]); });
    drop.addEventListener('dragover', function (e) { e.preventDefault(); drop.classList.add('on'); });
    drop.addEventListener('dragleave', function () { drop.classList.remove('on'); });
    drop.addEventListener('drop', function (e) { e.preventDefault(); drop.classList.remove('on'); pick(e.dataTransfer.files[0]); });
    var blank0 = JSON.stringify(readFields(d));
    guardClose(d, function () { return file || SW.$('.px-url', d).value.trim() || JSON.stringify(readFields(d)) !== blank0 ? 'What you have entered for this item will be lost: it is not added until you ' + (mode === 'file' ? 'Upload' : 'Add') + '.' : ''; });
    d.addEventListener('click', function (e) {
      if (e.target === d || e.target.closest('[data-x]')) { d.__leave(); return; }
      var a = e.target.closest('[data-a="up"]'); if (!a) return;
      var msg = SW.$('.px-msg', d), o = readFields(d), ic = SW.$('.px-intoc', d);
      Object.keys(o).forEach(function (k) { if (o[k] === '' || Array.isArray(o[k]) && !o[k].length) delete o[k]; });   // no empty fields kept
      o.tags = o.tags || [];
      if (ic && ic.checked) o.collections = [into.id];
      if (!o.accessioned) o.accessioned = now().slice(0, 10);
      if (!o.genre) { msg.textContent = 'Choose its Type: what the thing is.'; return; }
      if (mode === 'missing') {
        if (!o.title) { msg.textContent = 'Give it a title, as it is cited.'; return; }
        if (!/\bP-[A-Z0-9]{5}\b|cited/i.test(o.description || '') || /P-XXXXX/.test(o.description || '')) { msg.textContent = 'Say in the description where it is cited: the citing paratext’s code (P-…) with the page, or a reference.'; return; }
        ['missing', 'to-locate'].forEach(function (g) { if (o.tags.indexOf(g) < 0) o.tags.push(g); });   // the stub rule's tags
        a.disabled = true; msg.textContent = 'Recording it in the catalogue…';
        P.load(true).then(function () {
          var code = newCode();
          return save('Paratext ' + code + ': ' + o.title + ' (missing, a stub), catalogued by ' + me(), function (c) {
            c.items.push(Object.assign({ code: code, kind: 'missing' }, o, { added: now(), addedBy: me(), updated: now(), updatedBy: me() }));
          }).then(function () { return code; });
        }).then(function (code) { d.close(); refresh(); SW.toast(code + ' added'); openItem(code); }, function (err) { a.disabled = false; msg.textContent = err.message; });
        return;
      }
      if (mode === 'link') {
        var url = SW.$('.px-url', d).value.trim(), lk = SW.$('.px-lkind', d).value;
        if (!okURL(url)) { msg.textContent = 'Give the link (https://…).'; return; }
        if (!o.title) { msg.textContent = 'Give it a title.'; return; }
        if (!lk) { msg.textContent = 'Choose how it shows: video, audio, image, PDF, text, code or a web page.'; return; }
        var nu = function (x) { return String(x || '').trim().toLowerCase().replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, ''); };
        var dupL = (cat ? cat.items : []).filter(function (x) { return !x.withdrawn && [x.url, x.archiveUrl].concat(x.identifier || []).map(nu).indexOf(nu(url)) >= 0; })[0];
        if (dupL && !a.dataset.again) { a.dataset.again = 1; msg.textContent = 'This link is already catalogued as ' + dupL.code + ' (' + dupL.title + '). Add again to add it anyway.'; return; }
        o.url = url; a.disabled = true; msg.textContent = 'Recording it in the catalogue…';
        P.load(true).then(function () {
          var code = newCode();
          return save('Paratext ' + code + ': ' + o.title + ' (a link), catalogued by ' + me(), function (c) {
            c.items.push(Object.assign({ code: code, kind: lk }, o, { added: now(), addedBy: me(), updated: now(), updatedBy: me() }));
          }).then(function () { return code; });
        }).then(function (code) { d.close(); refresh(); SW.toast(code + ' added'); openItem(code); }, function (err) { a.disabled = false; msg.textContent = err.message; });
        return;
      }
      if (!file) { msg.textContent = 'Choose a file first.'; return; }
      if (file.size > 50e6) { msg.textContent = 'Too large for the repository (50 MB at most).'; return; }
      if (!o.title) { msg.textContent = 'Give it a title.'; return; }
      var dupF = (cat ? cat.items : []).filter(function (x) { return !x.withdrawn && x.size === file.size && (x.name || '').toLowerCase() === file.name.toLowerCase(); })[0];
      if (dupF && !a.dataset.again) { a.dataset.again = 1; msg.textContent = 'A file of this name and size is held as ' + dupF.code + ' (' + dupF.title + '). Upload again to add it anyway.'; return; }
      a.disabled = true; msg.textContent = 'Uploading…';
      P.load(true).then(function () {
        var code = newCode(), ext = (file.name.match(/\.[A-Za-z0-9]+$/) || [''])[0].toLowerCase(), path = 'files/' + code + ext;
        var mime = file.type || '', kind = mime === 'application/pdf' ? 'pdf' : /^image\//.test(mime) ? 'image' : /^text\//.test(mime) ? 'text' : /^audio\//.test(mime) ? 'audio' : /^video\//.test(mime) ? 'video' : 'file';
        if (CODE_EXT.test(ext)) { kind = 'software'; if (!/^text\//.test(mime)) mime = 'text/plain'; }   // source code, read as text
        else if (kind === 'file' && TEXT_EXT.test(ext)) { kind = 'text'; mime = 'text/plain'; }
        var fileSha = null;
        return fileB64(file).then(function (b64) {
          return gh('PUT', '/contents/' + path, { message: 'Paratext ' + code + ': ' + o.title + ', added by ' + me(), content: b64 });
        }).then(function (r) {
          fileSha = r && r.content && r.content.sha;
          msg.textContent = 'Recording it in the catalogue…';
          return save('Paratext ' + code + ': catalogued, by ' + me(), function (c) {
            c.items.push(Object.assign({ code: code, file: path, name: file.name, kind: kind, mime: mime, size: file.size }, o, { added: now(), addedBy: me(), updated: now(), updatedBy: me() }));
          }).then(function () { return code; }, function (err) {
            // the record could not be saved: the file just uploaded is taken out again, so none is left without a record
            if (!fileSha) throw err;
            return gh('DELETE', '/contents/' + path, { message: 'Paratext ' + code + ': upload taken back, its record not saved, by ' + me(), sha: fileSha }).then(function () { throw err; }, function () { throw new Error(err.message + ' The file ' + path + ' was uploaded but has no record: tell whoever keeps the archive.'); });
          });
        });
      }).then(function (code) { d.close(); refresh(); SW.toast(code + ' added'); openItem(code); }, function (err) { a.disabled = false; msg.textContent = err.message; });
    });
  }

  // A paratext read where you are (a link in an annotation, note or finding, a code, ?code=): the file
  // and its record, read-only, in a box that closes back to what you were doing. Paratexts has the rest.
  P.peek = function (code) {
    if (SW.state.tab === 'paratexts' && cat) { openItem(code); return; }
    var esc = SW.esc, d = SW.el('dialog', { class: 'tray-big px-dlg px-peek' });
    function head(title, acts) { return '<div class="tray-bighead"><span class="px-code mono" data-copy="' + esc(code) + '" title="Its code: click to copy">' + esc(code) + '</span> <b>' + esc(title) + '</b><span class="refhelp-acts">' + (acts || '') + '<button class="icon-btn" data-x title="Close (Esc)">✕</button></span></div>'; }
    document.body.appendChild(d);
    d.addEventListener('close', function () { d.remove(); });
    d.addEventListener('click', function (e) {
      if (e.target === d || e.target.closest('[data-x]')) { d.close(); d.remove(); return; }
      if (e.target.closest('[data-px="full"]')) { e.preventDefault(); d.close(); d.remove(); P.reveal(code); return; }
      var xp = e.target.closest('[data-xp]'); if (xp) { var xd = xp.closest('details'); if (xd) xd.open = false; exportItems(xp.dataset.xp, [byCode(code)], code); return; }
      if (e.target.closest('[data-px="join"]')) { d.close(); d.remove(); if (SW.notes) SW.notes.joinHelp(); }
    });
    if (!P.configured()) {
      d.innerHTML = head('A paratext') + '<p>' + esc(code) + ' is one of the paratexts, kept for the crew in a private repository. To read it here, the bench needs a GitHub token of your own.</p><p><button class="btn" data-px="join">How to get access</button></p>';
      d.showModal(); return;
    }
    d.innerHTML = head('Opening…'); d.showModal();
    P.load().then(function () {
      var it = byCode(code);
      if (!it) { d.innerHTML = head('Not found') + '<p>' + esc(code) + ' is not in the catalogue.</p>'; return; }
      var rows = FIELDS.filter(function (f) { return f[0] !== 'title'; }).map(function (f) { var v = it[f[0]]; return [f[1], Array.isArray(v) ? v.join(', ') : v || '']; });
      var cs = inColl(it); if (cs.length) rows.push(['Collections', cs.map(pathName).join('; ')]);
      rows = rows.filter(function (r) { return r[1]; });
      var nc = (it.comments || []).length;
      d.innerHTML = head(it.title, (okURL(it.archiveUrl) ? '<a class="btn ghost" href="' + esc(it.archiveUrl.trim()) + '" target="_blank" rel="noopener" title="The original, in ' + esc(it.archive || 'its archive') + '">Source ↗</a>' : '') + '<button class="btn ghost" data-share="' + esc(it.code) + '" title="Send it to someone: a link that opens the bench at this paratext">' + SW.SHARE_ICON + ' Share</button>' + exportMenu('data-xp') + (it.file ? '<a class="btn ghost" data-a="dl" download="' + esc(it.name || it.code) + '">⤓ Download</a>' : '')) +
        '<div class="px-cols"><div class="px-view"><p class="hint">Opening…</p></div><div class="px-side">' +
        (it.withdrawn ? '<p class="badge">Withdrawn from the list' + (it.withdrawnWhy ? ': ' + esc(it.withdrawnWhy) : '') + '</p>' : '') +
        '<dl class="px-ro">' + rows.map(function (r) { return '<dt>' + esc(r[0]) + '</dt><dd>' + (r[0] === 'Description' ? SW.md(r[1]) : r[0] === 'Archive link' && okURL(r[1]) ? '<a href="' + esc(r[1].trim()) + '" target="_blank" rel="noopener">' + esc(r[1]) + ' ↗</a>' : esc(r[1])) + '</dd>'; }).join('') + '</dl>' +
        '<div class="px-tags">' + summary(it) + '</div>' +
        (nc ? '<details class="px-cfold"><summary class="fd-rh">Comments <span class="faint">' + nc + '</span></summary>' + it.comments.map(function (c) { return '<div class="fd-reply"><div class="fd-rhead"><b>' + esc(c.by) + '</b> <span class="faint">' + esc(SW.fmtDate(c.date)) + '</span></div><div class="note-md">' + SW.md(c.text) + '</div></div>'; }).join('') + '</details>' : '') +
        '<div class="px-cited"></div></div></div>' +
        '<div class="px-peekfoot"><a href="?tab=paratexts&code=' + esc(code) + '" data-px="full" title="In Paratexts, where it can be edited, rated and commented on">Go to ' + esc(code) + ' in Paratexts →</a></div>';
      showFile(it, SW.$('.px-view', d), SW.$('[data-a="dl"]', d));
    citedIn(code, SW.$('.px-cited', d));
    }, function (e) { d.innerHTML = head('Could not open') + '<p class="badge err">' + esc(e.message) + '</p>'; });
  };
  document.addEventListener('click', function (e) {
    var sb = e.target.closest && e.target.closest('dialog [data-share^="P-"]'); if (!sb) return;
    var it = byCode(sb.dataset.share);
    SW.share({ title: 'Paratext ' + sb.dataset.share + (it ? ': ' + it.title : ''), text: it ? it.title : '', url: SW.BASE_URI + '?code=' + sb.dataset.share });
  });
  // Two paratexts side by side: pictures zoom (wheel, pinch, +/−, double-click) and pan (drag) together
  // while Together is on, as for two printings of one page; a PDF or a text scrolls on its own.
  // Codes may be a paratext's own code, or CODE#N for the Nth alternate of it, so that an original
  // and its translation can be set beside each other.
  function sbsItem(spec) {
    var m = /^(.+?)#(\d+)$/.exec(String(spec));
    if (!m) return byCode(spec);
    var it = byCode(m[1]); if (!it) return null;
    var a = altList(it)[+m[2]]; if (!a) return null;
    var alt = altItem(it, a);
    alt.title = it.title + ' (' + (a.label || a.lang || 'alternate') + ')';
    alt.date = it.date; alt.archive = it.archive; alt.archiveId = it.archiveId;
    return alt;
  }
  P.sideBySide = function (codes) {
    var esc = SW.esc, items = codes.map(sbsItem).filter(Boolean); if (items.length !== 2) return;
    var d = SW.el('dialog', { class: 'tray-big px-dlg px-sbs' }), linked = SW.store.get('px.sbsLinked', true);
    function paneHTML(it, i) {
      return '<div class="px-pane" data-i="' + i + '"><div class="px-ph"><span class="px-code mono">' + esc(it.code) + '</span> <b>' + esc(it.title) + '</b>' +
        '<span class="faint">' + esc([it.date, it.archive, it.archiveId].filter(Boolean).join(' · ')) + '</span>' +
        (it.kind === 'pdf' ? '<span class="px-zpg"><button class="btn ghost" data-pg="-1" title="The previous page (Page Up)">‹</button><span class="px-zpn mono">…</span><button class="btn ghost" data-pg="1" title="The next page (Page Down)">›</button></span>' : '') +
        '</div><div class="px-zoom"><p class="hint">Opening…</p></div></div>';
    }
    function draw() {
      d.innerHTML = '<div class="tray-bighead"><b>Side by side</b><span class="refhelp-acts">' +
        '<label class="check" title="Zoom and pan both pictures together"><input type="checkbox" class="px-link"' + (linked ? ' checked' : '') + '> Together</label>' +
        '<button class="btn ghost" data-z="fit" title="Fit both (0)">Fit</button><button class="btn ghost" data-z="in" title="Zoom in (+)">＋</button><button class="btn ghost" data-z="out" title="Zoom out (−)">−</button>' +
        '<button class="btn ghost" data-z="swap" title="Swap the two round">⇄ Swap</button><button class="icon-btn" data-x title="Close (Esc)">✕</button></span></div>' +
        '<div class="px-panes">' + items.map(paneHTML).join('') + '</div><p class="hint">Drag to move; wheel or pinch to zoom where the pointer is; double-click to zoom in; ‹ › or Page Up and Down for a PDF’s pages. With Together on, both follow, matched by their place on the page.</p>';
      views = items.map(function (it, i) { return view(it, SW.$('.px-pane[data-i="' + i + '"] .px-zoom', d)); });
    }
    // a picture's view: z (zoom over fit), and cx, cy (the point of the picture at the pane's centre, 0 to 1)
    var views = [], st = { z: 1, cx: 0.5, cy: 0.5 };
    function view(it, box) {
      var v = { box: box, img: null, w: 0, h: 0, st: { z: 1, cx: 0.5, cy: 0.5 } };
      blobOf(it).then(function (u) {
        if (it.kind === 'image') {
          box.innerHTML = '<img alt="' + esc(it.title) + '" draggable="false"><div class="px-cover"></div>'; v.img = SW.$('img', box);
          v.img.onload = function () { v.w = v.img.naturalWidth; v.h = v.img.naturalHeight; place(v); };
          v.img.src = u;
        } else if (it.kind === 'pdf') {   // a page at a time, drawn as a picture (PDF.js)
          box.innerHTML = '<img alt="' + esc(it.title) + '" draggable="false"><div class="px-cover"></div>'; v.img = SW.$('img', box);
          v.img.onload = function () { v.laid = 0; place(v); };
          pdfjs().then(function (lib) { return pdfOpen(lib, u); }).then(function (doc) { v.doc = doc; turn(v, 1); }, function (e) { box.innerHTML = '<p class="badge err">' + esc(e.message) + '</p>'; v.img = null; });
        }
        else if (/^text\//.test(it.mime || '')) { box.classList.add('px-free'); fetch(u).then(function (r) { return r.text(); }).then(function (t) { box.innerHTML = preHTML(it, t); }); }
        else box.innerHTML = '<p class="hint">No preview for this kind of file.</p>';
      }, function (e) { box.innerHTML = '<p class="badge err">' + esc(e.message) + '</p>'; });
      return v;
    }
    // a PDF's page n, in its pane, at the same zoom and place on the page
    function turn(v, n) {
      if (!v.doc) return;
      v.n = Math.max(1, Math.min(v.doc.numPages, n));
      var pn = SW.$('.px-zpn', v.box.closest('.px-pane')); if (pn) pn.textContent = v.n + ' / ' + v.doc.numPages;
      pdfPicture(v.doc, v.n, v.box.clientWidth).then(function (pic) { if (v.url) URL.revokeObjectURL(v.url); v.url = pic.url; v.w = pic.w; v.h = pic.h; v.img.src = pic.url; });
    }
    function cur(v) { return linked ? st : v.st; }
    // laid out once at its fitted size, then moved and zoomed by a transform, at most once a frame
    function place(v) {
      if (!v.img || !v.w) return;
      var W = v.box.clientWidth, H = v.box.clientHeight, s0 = cur(v), f = Math.min(W / v.w, H / v.h), sc = f * s0.z;
      if (v.laid !== v.w * f) { v.laid = v.w * f; v.img.style.width = v.w * f + 'px'; v.img.style.height = v.h * f + 'px'; }
      v.img.style.transform = 'translate(' + (W / 2 - s0.cx * v.w * sc) + 'px,' + (H / 2 - s0.cy * v.h * sc) + 'px) scale(' + s0.z + ')';
    }
    function all() { views.forEach(place); }
    var raf = 0;
    function soon(v) { if (!raf) raf = requestAnimationFrame(function () { raf = 0; if (linked || !v) all(); else place(v); }); }
    function zoomAt(v, f, mx, my) {   // zoom by f, keeping the point under (mx, my) where it is
      if (!v.img || !v.w) return;
      var s0 = cur(v), W = v.box.clientWidth, H = v.box.clientHeight, fit = Math.min(W / v.w, H / v.h), sc = fit * s0.z;
      if (mx == null) { mx = W / 2; my = H / 2; }
      var px = s0.cx + (mx - W / 2) / (v.w * sc), py = s0.cy + (my - H / 2) / (v.h * sc);
      s0.z = Math.max(0.5, Math.min(40, s0.z * f)); var sc2 = fit * s0.z;
      s0.cx = px - (mx - W / 2) / (v.w * sc2); s0.cy = py - (my - H / 2) / (v.h * sc2);
      soon(linked ? null : v);
    }
    function fit() { st = { z: 1, cx: 0.5, cy: 0.5 }; views.forEach(function (v) { v.st = { z: 1, cx: 0.5, cy: 0.5 }; }); all(); }
    function paneOf(t) { var p = t.closest && t.closest('.px-pane'); return p ? views[+p.dataset.i] : null; }
    document.body.appendChild(d);
    draw();
    d.showModal();
    d.addEventListener('close', function () { window.removeEventListener('resize', all); d.remove(); });
    window.addEventListener('resize', all);
    d.addEventListener('click', function (e) {
      if (e.target === d || e.target.closest('[data-x]')) { d.close(); return; }
      var pg = e.target.closest('[data-pg]'); if (pg) { var pv = paneOf(pg); if (pv) turn(pv, pv.n + +pg.dataset.pg); return; }
      var z = e.target.closest('[data-z]'); if (!z) return;
      if (z.dataset.z === 'fit') fit();
      else if (z.dataset.z === 'swap') { items.reverse(); draw(); }
      else views.forEach(function (v, i) { if (!linked || i === 0) zoomAt(v, z.dataset.z === 'in' ? 1.5 : 1 / 1.5); });
    });
    d.addEventListener('change', function (e) {
      if (!e.target.classList.contains('px-link')) return;
      linked = e.target.checked; SW.store.set('px.sbsLinked', linked);
      if (linked && views[0]) st = Object.assign({}, views[0].st); else views.forEach(function (v) { v.st = Object.assign({}, st); });
      all();
    });
    d.addEventListener('wheel', function (e) {
      var v = paneOf(e.target); if (!v || !v.img) return;
      e.preventDefault();
      var r = v.box.getBoundingClientRect();
      zoomAt(v, Math.exp(-e.deltaY * (e.ctrlKey ? 0.01 : 0.0025)), e.clientX - r.left, e.clientY - r.top);
    }, { passive: false });
    d.addEventListener('dblclick', function (e) { var v = paneOf(e.target); if (!v || !v.img) return; var r = v.box.getBoundingClientRect(); zoomAt(v, 2, e.clientX - r.left, e.clientY - r.top); });
    var drag = null;
    d.addEventListener('selectstart', function (e) { if (paneOf(e.target) && e.target.closest('.px-zoom')) e.preventDefault(); });
    d.addEventListener('pointerdown', function (e) { var v = paneOf(e.target); if (!v || !v.img || e.button || !v.box.contains(e.target)) return; e.preventDefault(); drag = { v: v, x: e.clientX, y: e.clientY }; v.box.setPointerCapture(e.pointerId); v.box.classList.add('dragging'); });
    d.addEventListener('pointermove', function (e) {
      if (!drag) return;
      var v = drag.v, s0 = cur(v), sc = Math.min(v.box.clientWidth / v.w, v.box.clientHeight / v.h) * s0.z;
      s0.cx -= (e.clientX - drag.x) / (v.w * sc); s0.cy -= (e.clientY - drag.y) / (v.h * sc);
      drag.x = e.clientX; drag.y = e.clientY;
      soon(linked ? null : v);
    });
    d.addEventListener('pointerup', function () { if (drag) drag.v.box.classList.remove('dragging'); drag = null; });
    d.addEventListener('keydown', function (e) {
      if (e.target.closest('input, textarea')) return;
      if (e.key === '+' || e.key === '=') { views.forEach(function (v, i) { if (!linked || i === 0) zoomAt(v, 1.5); }); }
      else if (e.key === '-' || e.key === '−') { views.forEach(function (v, i) { if (!linked || i === 0) zoomAt(v, 1 / 1.5); }); }
      else if (e.key === '0') fit();
      else if (e.key === 'PageDown' || e.key === 'PageUp') { e.preventDefault(); views.forEach(function (v) { if (v.doc) turn(v, v.n + (e.key === 'PageDown' ? 1 : -1)); }); }
    });
  };
  // To a paratext by its code (P-XXXXX): Paratexts opened, the item shown
  P.reveal = function (code) {
    SW.setTab('paratexts');
    if (!P.configured()) return;
    P.load().then(function () { openItem(code); }, function (e) { SW.toast(e.message, 5000); });
  };
  SW.views.paratexts = { show: function () { if (!done) render(); }, enter: function () { if (!done) render(); }, reset: function () { done = false; } };
  P.TOKEN_URL = TOKEN_URL;
  P.STEPS = STEPS;                                        // the setting-up steps, for Help ▸ Paratexts to offer as text to send
  // Titles for paratext links in annotations, notes and findings: the catalogue read once, in the background
  var wanted = false;
  P.titleOf = function (c) { var it = byCode(c); return it ? it.title : null; };
  P.want = function () {
    if (cat || wanted || !P.configured()) return;
    wanted = true;
    P.load().then(function () { SW.$$('a.pxlink[data-pcode]').forEach(function (a) { var t = P.titleOf(a.dataset.pcode); if (t) a.textContent = 'Paratext: ' + t; }); }, function () {});
  };
  // The token in Settings, tried: the number in the catalogue, or why not
  P.test = function () { cat = null; return P.load(true).then(function (c) { return c.items.filter(function (it) { return !it.withdrawn; }).length; }); };
  P.reset = function () { done = false; cat = null; wanted = false; if (!P.configured()) P.forgetCache(); if (SW.state.tab === 'paratexts') render(); };
})(typeof window !== 'undefined' ? window : globalThis);
