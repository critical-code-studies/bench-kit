/*
 * refs.js - the bench's references to its sources and the files' identifiers: [REF: …] for a
 * version, a file and its lines, a citation of lines, the file on GitHub (at its last change, to
 * the lines), and its SWHID (Software Heritage identifier, from js/swhid.js) with origin, path
 * and lines. From SW.BENCH.refs:
 *   repo      the repository (https://github.com/…), where the sources are (or SW.BENCH.repo)
 *   dir       the folder of the sources in it ('source')
 *   names     { version id: short name } ('SHI'), for references
 *   prefix    before a version's id where it has no short name ('SH-')
 *   supplied  a pattern for the roles of supplied files, left out of a version's own files
 *   refOf(vid, p, n0, n1, nparts)  the reference itself, where the bench writes it otherwise
 * Loaded after config.js, before the bench's core.js.
 * Part of bench-kit (github.com/critical-code-studies/bench-kit).
 */
(function (root) {
  'use strict';
  var SW = root.SW, B = SW.BENCH || {}, R = B.refs || {}, REPO = R.repo || B.repo || '';
  function V() { return root.SWVersions; }

  SW.REF = R.names || {};   // a bench's core.js may set its own
  // [REF: SHI, blockp.3:111–128]: the short name, the file, the lines
  SW.refOf = function (vid, p, n0, n1, nparts) {
    if (R.refOf) return R.refOf(vid, p, n0, n1, nparts);
    var r = SW.REF[vid] || ((R.prefix || '') + vid);
    if (p == null) return r;
    var v = V().byId(vid), part = v && v.build && v.build[p];
    var file = part ? part.src.split('/').pop() : String(p + 1);
    return r + ', ' + file + (n0 != null ? ':' + n0 + (n1 && n1 !== n0 ? '–' + n1 : '') : '');
  };
  // the number of files (tapes) a version's text is built from, without building it
  SW.nparts = function (vid) { var v = V().byId(vid); return v && v.build ? v.build.length : 1; };
  SW.refText = function (vid, p, n0, n1, nparts) { return '[REF: ' + SW.refOf(vid, p, n0, n1, nparts) + ']'; };
  SW.refTag = function (vid, p, n0, n1, nparts) { var t = SW.refText(vid, p, n0, n1, nparts); return '<span class="swref" data-copy="' + SW.esc(t) + '" title="Click to copy. The bench’s reference to this source (Help ▸ Referencing and versions)">' + SW.esc(t) + '</span>'; };
  SW.cite = function (b, p, n0, n1) {
    var part = b.parts[p];
    var range = n1 && n1 !== n0 ? 'll. ' + n0 + '–' + n1 : 'l. ' + n0;
    return b.v.label + ' (' + b.v.date + '), ' + part.src + ', ' + range + ' ' + SW.refText(b.v.id, p, n0, n1, b.parts.length);
  };

  // ---------- the files in the repository: links and SWHIDs ----------
  // A source file's SWHID (swh:1:cnt:, its git blob hash; js/swhid.js); with the repository as
  // origin, its path, and lines where they are lines of the file.
  var DIR = '/' + (R.dir || 'source') + '/';
  SW.SWHID_ORIGIN = REPO;
  SW.swhidOf = function (path) { var h = SW.SWHID && SW.SWHID[path]; return h ? 'swh:1:cnt:' + h[0] : ''; };
  // a link that works now: GitHub, at the last commit that changed the file, to the lines
  SW.permalinkOf = function (path, n0, n1) {
    var h = SW.SWHID && SW.SWHID[path]; if (!h) return '';
    return SW.SWHID_ORIGIN + '/blob/' + h[1] + DIR + path.split('/').map(encodeURIComponent).join('/') + (n0 != null ? '#L' + n0 + (n1 && n1 !== n0 ? '-L' + n1 : '') : '');
  };
  SW.swhidURL = function (id) { return 'https://archive.softwareheritage.org/' + id; };
  SW.swhidCite = function (path, n0, n1) {
    var id = SW.swhidOf(path); if (!id) return '';
    return id + ';origin=' + SW.SWHID_ORIGIN + ';path=' + DIR + path + (n0 != null ? ';lines=' + n0 + (n1 && n1 !== n0 ? '-' + n1 : '') : '');
  };
  SW.filesOf = function (v) { var seen = {}, out = []; (v.build || []).forEach(function (b) { var f = b.src || b.tape; if (f && !seen[f]) { seen[f] = 1; out.push(f); } }); return out; };
  // A version's own texts: its build less the files supplied to it (SW.BENCH.refs.supplied)
  SW.ownFilesOf = function (v) {
    var seen = {}, out = [];
    (v.build || []).forEach(function (b) { var f = b.src || b.tape; if (!f || seen[f] || (b.role && R.supplied && R.supplied.test(b.role))) return; seen[f] = 1; out.push(f); });
    return out.length ? out : SW.filesOf(v);
  };
  // Tiny SWHIDs, one per file, each copying on a click, its file named on hover
  SW.swhidTiny = function (files) {
    return files.map(function (f) { var id = SW.swhidOf(f); return id ? '<div class="swhid-row tiny"><button class="swhid mono" title="' + SW.esc(f.split('/').pop()) + ': copy ' + SW.esc(id) + '" data-copy="' + SW.esc(id) + '">' + SW.esc(id.slice(10, 22)) + '…</button> <a class="swhid-go" href="' + SW.esc(SW.swhidURL(id)) + '" target="_blank" rel="noopener" title="Open in the Software Heritage archive (once the repository is archived there)">↗</a></div>' : '<div class="swhid-row tiny faint">none</div>'; }).join('');
  };
  SW.swhidList = function (files) {
    return files.map(function (f) { var id = SW.swhidOf(f); return '<div class="swhid-row"><a class="mono" href="' + SW.esc(SW.permalinkOf(f) || SW.sourceURL(f)) + '" target="_blank" rel="noopener" title="The file on GitHub, at its last change">' + SW.esc(f.split('/').pop()) + '</a> ' + (id ? '<button class="swhid mono" title="Copy ' + SW.esc(id) + '" data-copy="' + SW.esc(id) + '">' + SW.esc(id.slice(0, 17)) + '…</button> <a class="swhid-go" href="' + SW.esc(SW.swhidURL(id)) + '" target="_blank" rel="noopener" title="Open in the Software Heritage archive (once the repository is archived there)">↗</a>' : '<span class="faint">no SWHID (not in the repository)</span>') + '</div>'; }).join('');
  };

  // A file of the sources, opened in a new tab on GitHub (a tape image is binary, so the
  // browser cannot show it itself; GitHub shows size, history, raw).
  SW.REPO = REPO + '/blob/main' + DIR;
  SW.sourceURL = function (path) { return SW.REPO + path.split('/').map(encodeURIComponent).join('/'); };
  SW.sourceLink = function (path, text) {
    return '<a href="' + SW.esc(SW.sourceURL(path)) + '" target="_blank" rel="noopener" title="Open ' + SW.esc(path) + ' in a new tab">' + SW.esc(text || path) + ' ↗</a>';
  };
})(typeof window !== "undefined" ? window : globalThis);
