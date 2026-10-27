/*
 * projectfile.js - a hand-built project as one file, and the projects CCS-WB made, for a bench that
 * says editable: true and loads kit/builder.js (Stage 2 of the hand-built project). From Versions ▾:
 *   Save the project to a file   one JSON file (<slug>-project-<date>.json, kind bench-kit-project):
 *                                the versions made in the page and their files, the bench's own
 *                                settings and their log (project.js), the annotations kept as
 *                                drafts, and My notes. Tokens are never in it.
 *   Open a project or .ccs file  the same file opened again, here or in another browser; or a
 *                                CCS-WB session (.ccs) read as a version of its own (below)
 *   Open a sample                a CCS-WB sample, read from CCS-WB Classic's public repository at
 *                                the tag SW.BENCH.samples gives (true: pre-bench-kit); nothing of
 *                                them is copied into the kit
 * Opening adds: a version whose id is here already is left out and named in the report; the
 * bench's settings come in only where none is set, so a GitHub location locked here is not
 * changed by a file; drafts and notes already here are kept.
 * A .ccs session becomes one version: its files in their folders (roles from the language and the
 * name, a README or markdown read as documentation), its line annotations drafts on their lines,
 * typed with a tag (ccs:observation, ccs:question, ccs:metaphor, ccs:pattern, ccs:context,
 * ccs:critique) and their replies under them, signed as in the session (CCS where it names no one). Its conversation with an AI is not brought in.
 * SW.projectFile: save(), open(file), data(), load(obj), fromCCS(obj, opts), samples(); and, in any
 * bench, the pure parts slug, roleOf, idOf, parseSamples.
 * Part of bench-kit (github.com/critical-code-studies/bench-kit).
 */
(function (root) {
  'use strict';
  var SW = root.SW, B = SW.BENCH || {}, V = root.SWVersions, Bd = SW.builder;
  var P = SW.projectFile = {}, KIND = 'bench-kit-project', TAG = 'bk:';

  // ---------- pure parts (tests/projectfile.test.js) ----------
  function slug(s) { return String(s || 'ccs').toLowerCase().replace(/[^a-z0-9._-]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'ccs'; }
  function roleOf(f) { return /^readme/i.test(f.name) || /\.md$/i.test(f.name) ? 'doc' : 'program'; }
  // an id from the session's name where its own is a generated one (a UUID)
  function idOf(s) { return slug(/^[0-9a-f]{8}-[0-9a-f]{4}-/i.test(s.id || '') || !s.id ? s.name || s.projectName || s.id : s.id); }
  // Samples.md: "- folder/file.ccs: Display Name | mode | Description | era | annotations", outside the
  // fenced example of that format
  function parseSamples(t) {
    return String(t).replace(/```[\s\S]*?```/g, '').split('\n').map(function (l) { return /^- ([^:\s]+\.ccs):\s*(.*)$/.exec(l); }).filter(Boolean).map(function (m) {
      var f = m[2].split('|').map(function (x) { return x.trim(); });
      return { path: m[1], name: f[0], mode: f[1], about: f[2], era: f[3], annotations: +f[4] || 0 };
    });
  }
  P.slug = slug; P.roleOf = roleOf; P.idOf = idOf; P.parseSamples = parseSamples;
  if (!B.editable || !Bd) return;
  var SAMPLES = 'https://raw.githubusercontent.com/Computational-Hermeneutics/CCS-WB-classic/' + (typeof B.samples === 'string' ? B.samples : 'pre-bench-kit') + '/public/sample-code/';

  function b64(u8) { var s = ''; for (var i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000)); return btoa(s); }
  function unb64(s) { var bin = atob(s), u = new Uint8Array(bin.length); for (var i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); return u.buffer; }
  function utf8(s) { return new TextEncoder().encode(String(s)).buffer; }

  // ---------- the project as one object ----------
  P.data = function () {
    var M = Bd.made();
    return Promise.all(M.map(function (r) {
      return Promise.all(r.files.map(function (f) { return SW.fileSource.bytes('local/' + r.id + '/' + f.name).then(function (u) { return b64(u); }); }))
        .then(function (data) { var c = JSON.parse(JSON.stringify(r)); c.files.forEach(function (f, i) { f.data = data[i]; }); return c; });
    })).then(function (versions) {
      return { kind: KIND, format: 1, kit: (SW.KIT || {}).version, bench: B.slug || B.name, title: B.title, made: new Date().toISOString(), by: SW.me().initials || '',
               settings: { bench: SW.store.get('bench.settings', {}), log: SW.store.get('bench.log', []) },
               versions: versions, drafts: SW.store.get('drafts', []), myNotes: SW.tray ? SW.tray.data() : null };
    });
  };
  P.save = function () {
    return P.data().then(function (o) {
      var name = (B.slug || 'bench') + '-project-' + SW.today() + '.json';
      root.SWExport.download(name, JSON.stringify(o, null, 1), 'application/json');
      SW.toast('Saved ' + name + ': ' + o.versions.length + ' version' + (o.versions.length === 1 ? '' : 's') + ', ' + o.drafts.length + ' draft' + (o.drafts.length === 1 ? '' : 's'), 5000);
      return o;
    });
  };

  // ---------- opening ----------
  function addDrafts(ds) {
    var have = SW.store.get('drafts', []), ids = {}, n = 0;
    have.forEach(function (d) { ids[d.id] = 1; });
    ds.forEach(function (d) { if (!ids[d.id]) { have.push(d); n++; } });
    if (n) SW.store.set('drafts', have);
    return n;
  }
  P.load = function (o) {
    if (!o || o.kind !== KIND) return Promise.reject(new Error('This is not a bench-kit project file.'));
    var out = { versions: [], skipped: [], drafts: 0, notes: 0, settings: 0 };
    var chain = Promise.resolve();
    (o.versions || []).forEach(function (r) {
      chain = chain.then(function () {
        if (V.byId(r.id)) { out.skipped.push(r.id); return; }
        var rec = JSON.parse(JSON.stringify(r)), files = rec.files.map(function (f) { return { name: f.name, role: f.role, data: unb64(f.data) }; });
        delete rec.files;
        return Bd.add(rec, files).then(function (v) { out.versions.push(v.id); });
      });
    });
    return chain.then(function () {
      var S = (o.settings || {}).bench || {}, cur = SW.store.get('bench.settings', {}) || {};
      // a GitHub location locked here is taken from the file only where none is set
      var locked = function (k) { return SW.project && SW.project.FIELDS.some(function (f) { return f.path === k && f.locked; }); };
      Object.keys(S).forEach(function (k) { if (!(k in cur) && (!locked(k) || !SW.project.value(k))) { cur[k] = S[k]; out.settings++; } });
      if (out.settings) SW.store.set('bench.settings', cur);
      if ((o.settings || {}).log && !SW.store.get('bench.log', []).length) SW.store.set('bench.log', o.settings.log);
      out.drafts = addDrafts(o.drafts || []);
      if (o.myNotes && SW.tray) out.notes = SW.tray.merge(o.myNotes);
      if (SW.notes) V.VERSIONS.forEach(function (v) { SW.notes.invalidate(v.id); });
      return out;
    });
  };

  // a CCS-WB session (.ccs) as one version, its annotations as drafts
  P.fromCCS = function (s, opts) {
    opts = opts || {};
    if (!s || !Array.isArray(s.codeFiles) || !s.codeContents) return Promise.reject(new Error('This is not a CCS-WB session (.ccs).'));
    var id = opts.id || idOf(s), base = id, n = 2;
    while (V.byId(id)) id = base + '-' + n++;
    var C = s.codeContents, seen = {};
    var files = s.codeFiles.filter(function (f) { return C[f.id] != null; }).map(function (f) {
      var name = (f.folder ? f.folder.replace(/^\/+|\/+$/g, '') + '/' : '') + f.name, k = name, i = 2;
      while (seen[k]) k = name.replace(/(\.[^.\/]*)?$/, '-' + i++ + '$1');
      seen[k] = 1;
      return { ref: f, name: k, role: roleOf(f), data: utf8(C[f.id]) };
    });
    var rec = { id: id, label: opts.label || s.name || s.projectName || s.id || 'CCS-WB session', date: opts.date || s.era || '', authors: opts.authors || '',
                summary: s.description || '', parent: opts.parent || null };
    return Bd.add(rec, files.map(function (f) { return { name: f.name, role: f.role, data: f.data }; })).then(function (v) {
      var at = {}, stamp = Date.now(), ds = [];
      files.forEach(function (f, i) { at[f.ref.id] = i; });
      (s.lineAnnotations || []).forEach(function (a, k) {
        var p = at[a.codeFileId]; if (p == null) return;
        var n0 = a.lineNumber, n1 = a.endLineNumber || a.lineNumber, did = 'draft-ccs-' + stamp + '-' + k;
        var anchor = { p: p, n0: n0, n1: n1, src: v.build[p].src }, tags = ['ccs:' + a.type];
        // signed as in the session; one that names no one is marked as CCS Workbench's, not the reader's
        var by = a.addedBy || 'CCS';
        var hTags = [TAG + 'v:' + v.id, TAG + 'kind:line', TAG + 'by:' + by, TAG + 'lines:' + p + ':' + n0 + (n1 !== n0 ? '-' + n1 : ''), TAG + 'src:' + anchor.src].concat(tags);
        ds.push({ id: did, vid: v.id, kind: 'line', anchor: anchor, quote: a.lineContent || '', text: a.content, by: by, name: a.addedBy ? '' : 'CCS Workbench',
                  date: a.createdAt || new Date().toISOString(), parent: null, tags: tags, source: 'draft', hTags: hTags, dev: false, from: null });
        (a.replies || []).forEach(function (r, j) {
          ds.push({ id: did + '-r' + j, vid: v.id, kind: 'line', anchor: null, quote: '', text: r.content, by: r.addedBy || 'CCS', name: r.addedBy ? '' : 'CCS Workbench',
                    date: r.createdAt || new Date().toISOString(), parent: did, tags: [], source: 'draft',
                    hTags: [TAG + 'v:' + v.id, TAG + 'kind:line', TAG + 'by:' + (r.addedBy || 'CCS')], dev: false, from: null });
        });
      });
      var nd = addDrafts(ds);
      if (SW.notes) SW.notes.invalidate(v.id);
      return { version: v, files: files.length, annotations: nd, messages: (s.messages || []).length };
    });
  };

  P.open = function (file) {
    return file.text().then(function (t) {
      var o = JSON.parse(t);
      if (o && o.kind === KIND) return P.load(o).then(function (r) {
        SW.toast('Opened: ' + r.versions.length + ' version' + (r.versions.length === 1 ? '' : 's') + ', ' + r.drafts + ' draft' + (r.drafts === 1 ? '' : 's') + ', ' + r.notes + ' note' + (r.notes === 1 ? '' : 's') +
          (r.skipped.length ? '; left out, already here: ' + r.skipped.join(', ') : '') + (r.settings ? '. Reload for the bench\'s settings.' : ''), 8000);
        if (r.versions.length) SW.select(r.versions[r.versions.length - 1]);
        return r;
      });
      return P.fromCCS(o).then(function (r) {
        SW.toast('Read ' + r.version.label + ' from CCS-WB: ' + r.files + ' file' + (r.files === 1 ? '' : 's') + ', ' + r.annotations + ' annotation' + (r.annotations === 1 ? '' : 's') + ' as drafts' +
          (r.messages ? '; its ' + r.messages + ' AI message' + (r.messages === 1 ? ' was' : 's were') + ' not brought in' : ''), 8000);
        SW.select(r.version.id); SW.setTab('read');
        return r;
      });
    });
  };
  P.choose = function () {
    var inp = SW.el('input', { type: 'file', accept: '.json,.ccs,application/json' });
    inp.onchange = function () { if (inp.files[0]) P.open(inp.files[0]).catch(function (e) { SW.toast('Could not open it: ' + e.message, 6000); }); };
    inp.click();
  };

  // ---------- CCS-WB's samples, from its public repository ----------
  P.samples = function () {
    return fetch(SAMPLES + 'Samples.md').then(function (r) { if (!r.ok) throw new Error('Could not reach the samples (' + r.status + ')'); return r.text(); }).then(parseSamples);
  };
  P.openSample = function (s) {
    SW.toast('Fetching ' + s.name + '…');
    return fetch(SAMPLES + s.path.split('/').map(encodeURIComponent).join('/')).then(function (r) { if (!r.ok) throw new Error('Could not fetch ' + s.path + ' (' + r.status + ')'); return r.json(); })
      .then(function (o) { return P.fromCCS(o, { id: slug(s.path.split('/')[0]), label: s.name, date: (/\b(1\d{3}|20\d{2})\b/.exec(s.name) || [])[1] || s.era }); })
      .then(function (r) { SW.select(r.version.id); SW.setTab('read'); SW.toast(r.version.label + ': ' + r.files + ' files, ' + r.annotations + ' annotations as drafts', 6000); return r; });
  };
  P.pickSample = function () {
    var d = SW.$('#dlg-samples');
    if (!d) {
      d = SW.el('dialog', { id: 'dlg-samples', class: 'set-dlg' });
      d.innerHTML = '<form method="dialog" class="settings"><h2>Open a sample</h2><p class="hint">Projects from CCS Workbench Classic, read from its public repository (Computational-Hermeneutics/CCS-WB-classic). Each opens as a version of its own, its annotations as drafts.</p>' +
        '<div id="smp-list" class="bd-list"><p class="hint">Fetching the list…</p></div><div class="row"><button value="cancel" class="btn ghost">Close</button></div></form>';
      document.body.appendChild(d);
      d.addEventListener('click', function (e) {
        var b = e.target.closest('[data-smp]'); if (!b) return;
        var s = d._list[+b.dataset.smp]; d.close();
        P.openSample(s).catch(function (err) { SW.toast(err.message, 6000); });
      });
    }
    d.showModal();
    P.samples().then(function (L) {
      d._list = L;
      SW.$('#smp-list', d).innerHTML = L.map(function (s, i) {
        return '<button type="button" class="btn ghost smp" data-smp="' + i + '"><b>' + SW.esc(s.name) + '</b><span class="hint">' + SW.esc(s.about) + (s.annotations ? ' · ' + s.annotations + ' annotations' : '') + '</span></button>';
      }).join('');
    }, function (e) { SW.$('#smp-list', d).innerHTML = '<p class="hint">' + SW.esc(e.message) + '</p>'; });
  };
})(typeof window !== 'undefined' ? window : globalThis);
