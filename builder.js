/*
 * builder.js - versions made in the page from files on the user's computer, for a project its user
 * configures (SW.BENCH.editable: true; Stage 1 of the hand-built project). Versions ▾ ▸ Add a
 * version from files asks for an id, label, date, authors, a summary, the version it was made from,
 * and the files, each with its role (program, support, doc, text). The files are kept in this
 * browser's IndexedDB, the records in its storage (builder.versions); both stay until removed. A
 * version made here is put in the bench's list (SWVersions.add) as the bench's own are, so Read,
 * Collate, Genealogy and the rest read it; its files are read through SW.fileSource
 * (kit/builds.js), under local/<id>/. Load it after kit/project.js, before kit/shell.js.
 * SW.builder: open(), add(rec, files), remove(id), made(); rec may name a line of descent to run to
 * it (line, lineLabel), made where there is none; otherwise a line whose tip is its parent runs on to it.
 * Part of bench-kit (github.com/critical-code-studies/bench-kit).
 */
(function (root) {
  'use strict';
  var SW = root.SW, B = SW.BENCH || {}, V = root.SWVersions;

  // what to fill in from the files given, where nothing is typed yet (tests/builder.test.js): the folder
  // dropped, else one file's name, else what the files' names share, else the first program's; a year
  // in it (ELIZA-1965b, spacewar-1962) goes to the date, the rest to the id
  SW.builderSuggest = function (names, folder) {
    var stem = function (n) { return String(n).split('/').pop().replace(/\.[^.]*$/, ''); };
    var ss = names.map(stem), base = folder || '';
    if (!base && ss.length === 1) base = ss[0];
    if (!base && ss.length) {
      var p = ss.reduce(function (a, b) { var i = 0; while (i < a.length && i < b.length && a[i].toLowerCase() === b[i].toLowerCase()) i++; return a.slice(0, i); });
      p = p.replace(/[-_. ]+$/, '');
      base = p.length >= 3 ? p : (ss.filter(function (x) { return !/^(readme|notes?)$/i.test(x); })[0] || ss[0]);
    }
    if (!base) return { id: '', label: '', date: '' };
    var m = /(^|[-_ .])((?:1[5-9]|20)\d\d)[a-z]?(?=$|[-_ .])/i.exec(base), date = '', rest = base;
    if (m) { date = m[2]; rest = base.slice(0, m.index) + base.slice(m.index + m[0].length); }
    var slug = function (x) { return String(x).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''); };
    return { id: slug(rest) || slug(base), label: base, date: date };
  };
  if (!B.editable || !V || !V.add) return;
  var KEY = 'builder.versions', PRE = 'local/', ROLES = ['program', 'support', 'doc', 'text'];
  var Bd = SW.builder = {};

  // ---------- the files, in IndexedDB, under the bench's storage prefix ----------
  var dbp = null;
  function db() {
    if (dbp) return dbp;
    dbp = new Promise(function (res, rej) {
      var r = indexedDB.open('bench-kit', 1);
      r.onupgradeneeded = function () { r.result.createObjectStore('files'); };
      r.onsuccess = function () { res(r.result); };
      r.onerror = function () { rej(r.error || new Error('This browser would not open its file store.')); };
    });
    return dbp;
  }
  function tx(mode, fn) {
    return db().then(function (d) {
      return new Promise(function (res, rej) {
        var t = d.transaction('files', mode), st = t.objectStore('files'), out = fn(st);
        t.oncomplete = function () { res(out && 'result' in out ? out.result : undefined); };
        t.onerror = function () { rej(t.error); };
      });
    });
  }
  function key(path) { return (B.store || 'bench.') + path; }
  function bytes(path) {
    return tx('readonly', function (st) { return st.get(key(path)); }).then(function (buf) {
      if (buf == null) throw new Error('Could not find ' + path + ' in this browser: the version was made in another.');
      return new Uint8Array(buf);
    });
  }
  SW.fileSource = {
    has: function (path) { return String(path).indexOf(PRE) === 0; },
    bytes: bytes,
    text: function (path) { return bytes(path).then(function (b) { return new TextDecoder('utf-8').decode(b); }); }
  };

  // ---------- the records ----------
  function made() { return SW.store.get(KEY, []) || []; }
  Bd.made = made;
  function sortOf(date) {
    var y = /\b(1[0-9]{3}|20[0-9]{2})(?!\d)/.exec(date || ''), mo = /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i.exec(date || '');
    var m = /\b\d{4}-(\d{2})(?:-(\d{2}))?\b/.exec(date || '');
    if (!y) return V.VERSIONS.reduce(function (a, v) { return Math.max(a, v.sort || 0); }, 0) + 1;
    var month = m ? +m[1] : mo ? 'janfebmaraprmayjunjulaugsepoctnovdec'.indexOf(mo[1].toLowerCase()) / 3 + 1 : 0;
    return +y[1] * 10000 + month * 100 + (m && m[2] ? +m[2] : 0);
  }
  function record(r) {
    var any = V.VERSIONS.filter(function (v) { return v.build; })[0];
    return { id: r.id, label: r.label || r.id, date: r.date || '', sort: r.sort != null ? r.sort : sortOf(r.date), authors: r.authors || '',
             fork: r.fork != null ? r.fork : (B.forks && B.forks[0] ? B.forks[0][0] : undefined), status: 'recovered', medium: 'Files added in this browser',
             summary: r.summary || '', made: r.made || SW.today(), local: true, derived: r.derived || null, dialect: any ? any.dialect : 'text', buildNotes: [],
             build: r.files.map(function (f) { return { src: PRE + r.id + '/' + f.name, role: f.role || 'program' }; }) };
  }
  function put(r) { return V.add(record(r), { parent: r.parent || null, line: r.line || (!V.LINES.length ? 'main' : null), lineLabel: r.lineLabel || 'The main line' }); }
  made().forEach(function (r) { try { put(r); } catch (e) { /* a clash with a version the bench has since given */ } });

  // a version made from files: rec { id, label, date, authors, summary, parent, fork }, files [{ name, role, data (ArrayBuffer) }]
  Bd.add = function (rec, files) {
    if (!/^[A-Za-z0-9._-]+$/.test(rec.id || '')) return Promise.reject(new Error('The id: letters, digits, dots, dashes and underscores only.'));
    if (V.byId(rec.id)) return Promise.reject(new Error('There is already a version ' + rec.id + '.'));
    if (!files.length) return Promise.reject(new Error('Add at least one file.'));
    var names = {};
    if (files.some(function (f) { var d = names[f.name]; names[f.name] = 1; return d; })) return Promise.reject(new Error('Two files have the same name.'));
    return tx('readwrite', function (st) { files.forEach(function (f) { st.put(f.data, key(PRE + rec.id + '/' + f.name)); }); }).then(function () {
      var r = { id: rec.id, label: rec.label, date: rec.date, authors: rec.authors, summary: rec.summary, parent: rec.parent || null, fork: rec.fork, line: rec.line || null, lineLabel: rec.lineLabel || null, derived: rec.derived || null,
                made: SW.today(), by: SW.me().initials || '', files: files.map(function (f) { return { name: f.name, role: f.role }; }) };
      var v = put(r), all = made(); all.push(r); SW.store.set(KEY, all);
      if (SW.fillPicker) SW.fillPicker();
      return v;
    });
  };
  Bd.remove = function (id) {
    var all = made(), r = all.filter(function (x) { return x.id === id; })[0];
    if (!r) return Promise.resolve(false);
    return tx('readwrite', function (st) { r.files.forEach(function (f) { st.delete(key(PRE + id + '/' + f.name)); }); }).then(function () {
      V.remove(id); SW.store.set(KEY, all.filter(function (x) { return x.id !== id; }));
      if (SW.mending && SW.mending.forget) SW.mending.forget(id);
      if (SW.fillPicker) SW.fillPicker();
      if (SW.state.v === id) SW.select(B.start);
      return true;
    });
  };

  // ---------- Versions ▾ ▸ Add a version from files ----------
  var esc = SW.esc, chosen = [], dropped = '';
  function build() {
    var d = SW.el('dialog', { id: 'dlg-builder', class: 'set-dlg' });
    var forks = B.forks && B.forks.length > 1 ? '<label>Listed under <select id="bd-fork">' + B.forks.map(function (f) { return '<option value="' + esc(f[0]) + '">' + esc(f[1]) + '</option>'; }).join('') + '</select></label>' : '';
    d.innerHTML = '<form method="dialog" class="settings">' +
      '<h2>Add a version from files</h2>' +
      '<p class="hint">The files are kept in this browser, as they are, and read as the bench reads its own. Nothing is uploaded. The version is listed with the others, and can be read, collated and placed in the genealogy.</p>' +
      '<label>Id <input id="bd-id" placeholder="e.g. v3" autocomplete="off" spellcheck="false"></label>' +
      '<label>Label <input id="bd-label" placeholder="e.g. Version 3" autocomplete="off"></label>' +
      '<label>Date <input id="bd-date" placeholder="' + esc((B.examples || {}).date || 'e.g. 1970-05-17, or 1970') + '" autocomplete="off"></label>' +
      '<label>Authors <input id="bd-authors" autocomplete="off"></label>' +
      '<label>Summary <textarea id="bd-summary" rows="2"></textarea></label>' +
      '<label>Made from <select id="bd-parent"></select></label>' + forks +
      '<label>Files <input id="bd-files" type="file" multiple></label>' +
      '<div class="bd-drop" id="bd-drop">Or drop files here</div>' +
      '<div id="bd-list" class="bd-list"></div>' +
      '<p class="hint set-msg" id="bd-msg"></p>' +
      '<div id="bd-made"></div>' +
      '<div class="row"><button value="cancel" class="btn ghost">Cancel</button><button value="add" id="bd-add" class="btn">Add the version</button></div></form>';
    document.body.appendChild(d);
    // files given: [{ file, name (its path within a folder dropped) }], and the folder's name if one was
    function take(list, folder) {
      list.forEach(function (x) {
        chosen = chosen.filter(function (c) { return c.name !== x.name; });
        chosen.push({ file: x.file, name: x.name, role: /^(readme|notes?)\b|\.(md|txt)$/i.test(x.name.split('/').pop()) ? 'doc' : 'program' });
      });
      if (folder) dropped = folder;
      drawList(); autofill();
    }
    // id, label and date from the files, into the boxes left empty or filled this way before; a value
    // typed stays
    function autofill() {
      var g = SW.builderSuggest(chosen.map(function (c) { return c.name; }), dropped);
      if (g.id) { var id = g.id, k = 2; while (V.byId(id)) id = g.id + '-' + k++; g.id = id; }
      ['id', 'label', 'date'].forEach(function (k) {
        var el = SW.$('#bd-' + k); if (!el || !g[k]) return;
        if (!el.value || el.dataset.auto) { el.value = g[k]; el.dataset.auto = '1'; }
      });
    }
    ['id', 'label', 'date'].forEach(function (k) { SW.$('#bd-' + k, d).addEventListener('input', function (e) { delete e.target.dataset.auto; }); });
    // a folder dropped: its files, read through the entries the browser gives, their paths kept
    function walk(entry, path, out) {
      if (entry.isFile) return new Promise(function (res) { entry.file(function (f) { out.push({ file: f, name: path + f.name }); res(); }, function () { res(); }); });
      if (!entry.isDirectory) return Promise.resolve();
      var rd = entry.createReader(), all = [];
      return new Promise(function (res) {
        (function more() { rd.readEntries(function (es) { if (!es.length) res(all); else { all = all.concat(es); more(); } }, function () { res(all); }); })();
      }).then(function (es) { return Promise.all(es.filter(function (e) { return !/^\./.test(e.name); }).map(function (e) { return walk(e, path + entry.name + '/', out); })); });
    }
    SW.$('#bd-files', d).onchange = function (e) { take([].slice.call(e.target.files).map(function (f) { return { file: f, name: f.name }; })); e.target.value = ''; };
    var drop = SW.$('#bd-drop', d);
    drop.addEventListener('dragover', function (e) { e.preventDefault(); drop.classList.add('on'); });
    drop.addEventListener('dragleave', function () { drop.classList.remove('on'); });
    drop.addEventListener('drop', function (e) {
      e.preventDefault(); drop.classList.remove('on');
      var items = [].slice.call(e.dataTransfer.items || []), ents = items.map(function (it) { return it.webkitGetAsEntry ? it.webkitGetAsEntry() : null; });
      if (!ents.length || ents.some(function (x) { return !x; })) { take([].slice.call(e.dataTransfer.files).map(function (f) { return { file: f, name: f.name }; })); return; }
      var out = [], dirs = ents.filter(function (x) { return x.isDirectory; });
      // one folder dropped: its files named within it, the folder named for the version
      Promise.all(ents.map(function (x) { return dirs.length === 1 && ents.length === 1 ? walkIn(x, out) : walk(x, '', out); })).then(function () {
        take(out, dirs.length === 1 && ents.length === 1 ? dirs[0].name : '');
      });
    });
    function walkIn(dir, out) {   // the folder's own files, without its name before them
      return walk(dir, '', out).then(function () { out.forEach(function (x) { x.name = x.name.replace(new RegExp('^' + dir.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '/'), ''); }); });
    }
    SW.$('#bd-list', d).addEventListener('change', function (e) { var s = e.target.closest('[data-bd-role]'); if (s) chosen[+s.dataset.bdRole].role = s.value; });
    SW.$('#bd-list', d).addEventListener('click', function (e) { var x = e.target.closest('[data-bd-out]'); if (x) { chosen.splice(+x.dataset.bdOut, 1); drawList(); } });
    SW.$('#bd-made', d).addEventListener('click', function (e) {
      var x = e.target.closest('[data-bd-remove]'); if (!x) return;
      var id = x.dataset.bdRemove;
      if (!confirm('Take ' + id + ' out of the bench, and its files out of this browser? Annotations made on it stay where they are.')) return;
      Bd.remove(id).then(function () { drawMade(); fillParents(); SW.toast(id + ' taken out'); });
    });
    SW.$('form', d).addEventListener('submit', function (e) {
      if (!e.submitter || e.submitter.value !== 'add') return;
      e.preventDefault();
      var rec = { id: SW.$('#bd-id').value.trim(), label: SW.$('#bd-label').value.trim(), date: SW.$('#bd-date').value.trim(), authors: SW.$('#bd-authors').value.trim(),
                  summary: SW.$('#bd-summary').value.trim(), parent: SW.$('#bd-parent').value || null, fork: SW.$('#bd-fork') ? SW.$('#bd-fork').value : undefined };
      Promise.all(chosen.map(function (c) { return c.file.arrayBuffer().then(function (data) { return { name: c.name, role: c.role, data: data }; }); }))
        .then(function (files) { return Bd.add(rec, files); })
        .then(function (v) { d.close(); SW.select(v.id); SW.setTab('read'); SW.toast(v.label + ' added: ' + v.build.length + ' file' + (v.build.length === 1 ? '' : 's'), 4000); },
              function (err) { SW.$('#bd-msg').textContent = err.message; });
    });
    return d;
  }
  function drawList() {
    SW.$('#bd-list').innerHTML = chosen.map(function (c, i) {
      return '<div class="bd-file"><span class="mono">' + esc(c.name) + '</span> <span class="hint">' + Math.max(1, Math.round(c.file.size / 1024)) + ' KB</span>' +
        '<select data-bd-role="' + i + '">' + ROLES.map(function (r) { return '<option' + (r === c.role ? ' selected' : '') + '>' + r + '</option>'; }).join('') + '</select>' +
        '<button type="button" class="btn ghost" data-bd-out="' + i + '" title="Leave this file out">×</button></div>';
    }).join('');
  }
  function fillParents() {
    SW.$('#bd-parent').innerHTML = '<option value="">None: the first, or not known</option>' + V.VERSIONS.slice().sort(function (a, b) { return a.sort - b.sort; }).map(function (v) {
      return '<option value="' + esc(v.id) + '">' + esc(v.id + ' · ' + v.label + (v.date ? ' · ' + v.date : '')) + '</option>';
    }).join('');
  }
  function drawMade() {
    var M = made();
    SW.$('#bd-made').innerHTML = M.length ? '<h2>Made here</h2>' + M.map(function (r) {
      return '<div class="bd-file"><span class="mono">' + esc(r.id) + '</span> ' + esc(r.label || '') + ' <span class="hint">' + esc(r.made + (r.by ? ' ' + r.by : '') + ' · ' + r.files.length + ' file' + (r.files.length === 1 ? '' : 's')) + '</span>' +
        '<button type="button" class="btn ghost" data-bd-remove="' + esc(r.id) + '">Take out</button></div>';
    }).join('') : '';
  }
  Bd.open = function () {
    var d = SW.$('#dlg-builder') || build();
    chosen = []; dropped = ''; drawList(); fillParents(); drawMade();
    ['id', 'label', 'date'].forEach(function (k) { delete SW.$('#bd-' + k).dataset.auto; });
    ['id', 'label', 'date', 'authors', 'summary'].forEach(function (k) { SW.$('#bd-' + k).value = ''; });
    SW.$('#bd-msg').textContent = '';
    var cur = V.byId(SW.state.v); if (cur) SW.$('#bd-parent').value = cur.id;
    d.showModal();
  };
})(typeof window !== 'undefined' ? window : globalThis);
