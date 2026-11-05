/*
 * folder.js - a folder on this computer read in place of the bench's published files: a working copy
 * of the bench's repository, with work not yet committed, read without a token or a server. For a
 * bench that sets SW.BENCH.folder (true, or { hint, root }); loaded after kit/builds.js and
 * kit/builder.js (where the bench has it), before kit/shell.js.
 *
 * File ▾ ▸ Open a folder… asks for the folder (the repository's top, or a folder within it). A file the
 * bench fetches (by its path from the repository's top, as SWVersions.SRC) is read from the folder
 * where the folder holds it, and fetched as before where it does not: at the path itself, at
 * folder.root + the path, at the bench's own source folder + the path (SWVersions.SRC, where it is
 * relative), at the path less its first folders (a folder chosen within the repository), or at the
 * shortest path ending with it (a folder chosen above). Hidden folders (.git) and node_modules are not read.
 *   - Chrome and Edge (showDirectoryPicker): each file is read from the disk when it is wanted;
 *     File ▾ ▸ Read the folder again reads the changes made since, and the folder is offered again on
 *     the next visit (File ▾ ▸ Reopen <name>, with the browser's permission).
 *   - Safari and Firefox (a folder chosen in a file box): the files as they were when chosen; choose
 *     the folder again to read the changes.
 * File ▾ ▸ Close the folder goes back to the published files. A chip in the tab row names the folder
 * while it is open.
 * SW.folder: offered(), open(), again(), close(), reopen(), fromFiles(files), on (true while a folder is open), name,
 * paths() (every file's path in the folder, from its top), has(path), text(path), bytes(path).
 * SW.on('folder', fn) is told { name, paths } when a folder is opened or read again, and null when it is
 * closed, so that a bench's reader can find its texts in the folder (a translation laid out by the
 * vector translation method, read in place).
 * Part of bench-kit (github.com/critical-code-studies/bench-kit).
 */
(function (root) {
  'use strict';
  var SW = root.SW, B = SW.BENCH || {};
  var CFG = B.folder === true ? {} : B.folder || null;
  var F = SW.folder = { on: false, name: '' };
  var PICKER = typeof root.showDirectoryPicker === 'function';
  var MAXFILES = 50000;
  var idx = null, prev = null, stored = null, ends = {};   // idx: path -> FileSystemFileHandle or File

  F.offered = function () { return !!CFG; };
  F.paths = function () { return idx ? Object.keys(idx) : []; };
  // the folder's path for a path the bench fetches, or null where the folder does not hold it
  function find(path) {
    if (!idx) return null;
    path = String(path).replace(/^\.?\//, '');
    if (idx[path]) return path;
    var r = CFG && CFG.root ? String(CFG.root).replace(/^\/|\/?$/g, '') : '';
    if (r && idx[r + '/' + path]) return r + '/' + path;
    // the bench's own folder for its sources, where it is a relative one (SWVersions.SRC: source/)
    var src = root.SWVersions && root.SWVersions.SRC;
    if (src && !/^[a-z]+:|^\//i.test(src) && idx[src.replace(/\/?$/, '/') + path]) return src.replace(/\/?$/, '/') + path;
    var parts = path.split('/');
    for (var i = 1; i < parts.length; i++) { var p = parts.slice(i).join('/'); if (idx[p]) return p; }
    // a folder chosen above the repository: the shortest path in it that ends with this one
    if (!(path in ends)) ends[path] = Object.keys(idx).filter(function (k) { return k.slice(-path.length - 1) === '/' + path; }).sort(function (a, b) { return a.length - b.length; })[0] || null;
    return ends[path];
  }
  F.has = function (path) { return find(path) != null; };
  F.bytes = function (path) {
    var p = find(path);
    if (p == null) return Promise.reject(new Error(path + ' is not in the folder ' + F.name));
    var h = idx[p];
    return (h.getFile ? h.getFile() : Promise.resolve(h)).then(function (f) { return f.arrayBuffer(); }).then(function (b) { return new Uint8Array(b); });
  };
  F.text = function (path) { return F.bytes(path).then(function (b) { return new TextDecoder('utf-8').decode(b); }); };

  // the folder's files read into the bench in place of the published ones, before any source it had
  // (a version made from files, kit/builder.js)
  function install() {
    if (prev === null) prev = SW.fileSource || false;
    var p = prev || null;
    SW.fileSource = {
      has: function (path) { return F.has(path) || !!(p && p.has(path)); },
      bytes: function (path) { return F.has(path) ? F.bytes(path) : p.bytes(path); },
      text: function (path) { return F.has(path) ? F.text(path) : p.text(path); }
    };
  }
  function uninstall() { if (prev !== null) { SW.fileSource = prev || undefined; prev = null; } }
  // every view drawn again from the files as they are now
  function redraw() {
    if (SW.forgetBuilds) SW.forgetBuilds();
    Object.keys(SW.views || {}).forEach(function (t) { SW.forget(t); });
    if (SW.state && SW.state.tab) SW.setTab(SW.state.tab);
    chip();
  }
  function skip(name) { return /^\./.test(name) || name === 'node_modules'; }

  // ---------- a folder kept by the browser (Chrome, Edge) ----------
  function walk(dir, pre, out) {
    var it = dir.values(), n = 0;
    function next() {
      return it.next().then(function (r) {
        if (r.done || Object.keys(out).length >= MAXFILES) return out;
        var h = r.value, p = pre + h.name;
        if (skip(h.name)) return next();
        n++;
        return (h.kind === 'directory' ? walk(h, p + '/', out) : Promise.resolve(out[p] = h)).then(next);
      });
    }
    return next();
  }
  function fromHandle(h) {
    return walk(h, '', {}).then(function (out) {
      idx = out; ends = {}; F.on = true; F.name = h.name; F.handle = h;
      install(); keep(h); redraw();
      SW.emit('folder', { name: F.name, paths: F.paths() });
      SW.toast('Reading the folder ' + F.name + ' (' + Object.keys(out).length + ' files) in place of the published files.', 4000);
    });
  }
  // ---------- a folder chosen in a file box (Safari, Firefox) ----------
  function fromFiles(files) {
    var out = {}, name = '';
    Array.prototype.forEach.call(files, function (f) {
      var rel = f.webkitRelativePath || f.name, parts = rel.split('/');
      name = name || (parts.length > 1 ? parts[0] : '');
      if (parts.length > 1) parts.shift();
      if (parts.some(skip)) return;
      out[parts.join('/')] = f;
    });
    idx = out; ends = {}; F.on = true; F.name = name || 'the folder'; F.handle = null;
    install(); redraw();
    SW.emit('folder', { name: F.name, paths: F.paths() });
    SW.toast('Reading the folder ' + F.name + ' (' + Object.keys(out).length + ' files, as they are now) in place of the published files.', 4000);
  }
  F.fromFiles = fromFiles;   // files with webkitRelativePath (a folder from a file box, or dropped)
  function fileBox() {
    var inp = SW.el('input', { type: 'file', webkitdirectory: '', multiple: '', hidden: '' });
    inp.addEventListener('change', function () { if (inp.files && inp.files.length) fromFiles(inp.files); inp.remove(); });
    document.body.appendChild(inp);
    inp.click();
  }

  F.open = function () {
    if (!PICKER) { fileBox(); return; }
    root.showDirectoryPicker({ id: 'bench-folder', mode: 'read' }).then(fromHandle, function (e) { if (e && e.name !== 'AbortError') SW.toast(e.message, 4000); });
  };
  F.again = function () {
    if (!F.on) return;
    if (F.handle) { fromHandle(F.handle); return; }
    fileBox();
  };
  F.close = function () {
    idx = null; F.on = false; F.name = ''; F.handle = null;
    uninstall(); forgetKept(); redraw();
    SW.emit('folder', null);
    SW.toast('Back to the published files.', 2500);
  };

  // ---------- kept for the next visit (Chrome, Edge) ----------
  var DB = 'bench-kit-folder', KEY = (B.store || 'bench.') + 'folder';
  function db() {
    return new Promise(function (res, rej) {
      var r = indexedDB.open(DB, 1);
      r.onupgradeneeded = function () { r.result.createObjectStore('h'); };
      r.onsuccess = function () { res(r.result); }; r.onerror = function () { rej(r.error); };
    });
  }
  function tx(mode, fn) {
    return db().then(function (d) {
      return new Promise(function (res, rej) {
        var t = d.transaction('h', mode), out = fn(t.objectStore('h'));
        t.oncomplete = function () { res(out && 'result' in out ? out.result : undefined); };
        t.onerror = function () { rej(t.error); };
      });
    });
  }
  function keep(h) { tx('readwrite', function (s) { s.put(h, KEY); }).catch(function () {}); }
  function forgetKept() { stored = null; if (PICKER) tx('readwrite', function (s) { s.delete(KEY); }).catch(function () {}); }
  F.stored = function () { return !F.on && stored ? stored.name : ''; };
  F.reopen = function () {
    if (!stored) return;
    var h = stored;
    (h.requestPermission ? h.requestPermission({ mode: 'read' }) : Promise.resolve('granted')).then(function (p) {
      if (p === 'granted') fromHandle(h); else SW.toast('The browser did not allow the folder to be read; open it again.', 4000);
    }, function () { F.open(); });
  };
  if (CFG && PICKER && root.indexedDB) tx('readonly', function (s) { return s.get(KEY); }).then(function (h) { stored = h || null; }).catch(function () {});

  // ---------- File ▾'s items, and the chip ----------
  F.items = function () {
    if (!CFG) return [];
    if (F.on) return [['folder-again', 'Read the folder again', F.handle ? 'The changes made in ' + F.name + ' since it was read' : 'Choose ' + F.name + ' again to read its changes'],
                      ['folder-close', 'Close the folder', 'Back to the published files']];
    return [['folder-open', 'Open a folder…', CFG.hint || 'A working copy on this computer, read in place of the published files']]
      .concat(F.stored() ? [['folder-reopen', 'Reopen ' + F.stored(), 'The folder read here last time']] : []);
  };
  F.pick = function (p) {
    ({ 'folder-open': F.open, 'folder-again': F.again, 'folder-close': F.close, 'folder-reopen': F.reopen })[p]();
  };
  function chip() {
    var tabs = SW.$('#tabs'), c = SW.$('#folder-chip');
    if (!F.on) { if (c) c.remove(); return; }
    if (!tabs) return;
    if (!c) {
      c = SW.el('button', { id: 'folder-chip', class: 'folder-chip', type: 'button' });
      c.addEventListener('click', function () { F.again(); });
      tabs.appendChild(c);
    }
    c.textContent = '📂 ' + F.name;
    c.title = 'Reading the folder ' + F.name + ' on this computer in place of the published files. Click to read it again; File ▾ ▸ Close the folder to go back.';
  }
})(typeof window !== 'undefined' ? window : globalThis);
