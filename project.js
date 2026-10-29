/*
 * project.js - the bench's own settings in ⚙ Settings ▸ Bench, for a project its user configures
 * (SW.BENCH.editable: true). config.js gives the defaults; what the user changes is kept in this
 * browser (bench.settings, and so in Back up my data) and laid over SW.BENCH here, as the
 * page loads, so the rest of the kit reads the project's values as if config.js had given them.
 * A bench that does not say editable is left as it is: its readers see config.js. Load it straight
 * after the bench's config.js, before the rest of the kit.
 *
 * The GitHub locations (the repository, the published address, the paratext archive) are locked
 * once set. Changing one takes two acknowledgements: Unlock, which says what a change does, and the
 * new value typed again before Save. Each change is logged (bench.log) with the date, the initials
 * and the old value, which Put back offers again through the same two steps. The storage prefix
 * (SW.BENCH.store) and the stem of exported files' names (SW.BENCH.slug) are not offered: notes,
 * settings and backups depend on them.
 *
 * SW.project: get(o, path), put(o, path, v), apply(B, overrides), FIELDS, value(path), def(path),
 * overrides(), lockMsg(c), logged(). A bench adds a field with SW.project.FIELDS.push({ path, label,
 * kind, hint, group, locked, pattern, only(B) }) before Settings first opens.
 * Part of bench-kit (github.com/critical-code-studies/bench-kit).
 */
(function (root) {
  'use strict';
  var SW = root.SW, P = SW.project = {};
  var KEY = 'bench.settings', LOG = 'bench.log';

  // a value at a dotted path, and one put there (making the objects on the way)
  P.get = function (o, path) {
    return String(path).split('.').reduce(function (x, k) { return x == null ? undefined : x[k]; }, o);
  };
  P.put = function (o, path, v) {
    var ks = String(path).split('.'), last = ks.pop();
    ks.forEach(function (k) { if (o[k] == null || typeof o[k] !== 'object') o[k] = {}; o = o[k]; });
    o[last] = v;
  };
  P.apply = function (B, over) {
    Object.keys(over || {}).forEach(function (path) { P.put(B, path, over[path]); });
    return B;
  };

  var GH = /^https:\/\/github\.com\/[\w.-]+\/[\w.-]+\/?$/, NAME = /^[\w.-]+$/;
  P.FIELDS = [
    { group: 'The project', path: 'name', label: 'Short name', hint: 'In menus, messages and the relation of a paratext to a version.' },
    { group: 'The project', path: 'title', label: 'Title', hint: 'At the head of the page and the About box.' },
    { group: 'The project', path: 'about.project', label: 'Project and leads', kind: 'area', hint: 'The first row of the About box. HTML.' },
    { group: 'The project', path: 'about.cite.authors', label: 'Cited as (the leads)', hint: 'As in a citation: Berry, D. M. and Jonik, M.' },
    { group: 'The project', path: 'about.cite.title', label: 'Title as cited' },
    { group: 'References', path: 'refs.prefix', label: 'Before a version’s id', hint: 'Where a version has no short name (e.g. SH-).' },
    { group: 'References', path: 'refs.names', label: 'Short names', kind: 'map', hint: 'One a line: the version’s id, =, its short name.' },
    { group: 'Language', path: 'comment', label: 'Comment marks', kind: 'list', hint: 'The marks that begin a comment to the end of the line, separated by spaces; none for prose.', only: function (B) { return B.lang === 'plain'; } },
    { group: 'Language', path: 'routine', label: 'A routine begins', hint: 'A regular expression for the line that begins a routine, its name in the first group.', only: function (B) { return B.lang === 'plain'; } },
    { group: 'Language', path: 'caseFold', label: 'Case means nothing in the language', kind: 'check', only: function (B) { return B.lang === 'plain'; } },
    { group: 'GitHub', path: 'repo', label: 'Repository', locked: true, pattern: GH, hint: 'https://github.com/owner/name, where the sources are.' },
    { group: 'GitHub', path: 'refs.repo', label: 'Repository for references', locked: true, pattern: GH, only: function () { return P.def('refs.repo') != null; } },
    { group: 'GitHub', path: 'base', label: 'Published address', locked: true, pattern: /^https:\/\/\S+$/, hint: 'Where the project is read, once published.' },
    { group: 'GitHub', path: 'paratexts.org', label: 'Paratext archive: owner', locked: true, pattern: NAME },
    { group: 'GitHub', path: 'paratexts.repo', label: 'Paratext archive: repository', locked: true, pattern: NAME, hint: 'A private repository, read and written with the token in the Paratexts tab.' }
  ];

  // the values config.js gave, before any of the user's are laid over them
  var defaults = {};
  P.def = function (path) { return defaults[path]; };
  P.value = function (path) { return P.get(SW.BENCH || {}, path); };
  P.overrides = function () { return SW.store.get(KEY, {}) || {}; };
  P.logged = function () { return SW.store.get(LOG, []) || []; };

  // what stops a change to a locked location being saved: '' when it may be
  //   c = { label, from, to, again, initials, pattern }
  P.lockMsg = function (c) {
    if (c.to === c.from) return '';
    if (c.to && c.pattern && !c.pattern.test(c.to)) return c.label + ': not in the expected form.';
    if (!c.from) return '';
    if (c.again !== c.to) return c.label + ': type the new value again, exactly, to confirm it.';
    if (!/^[A-Z]{2,4}$/.test(c.initials || '')) return c.label + ': set your initials (You) first; the change is logged under them.';
    return '';
  };

  // the form a field is shown in, and read back from
  function show(f, v) {
    if (f.kind === 'check') return !!v;
    if (f.kind === 'list') return (Array.isArray(v) ? v : v == null ? [] : [v]).join(' ');
    if (f.kind === 'map') return Object.keys(v || {}).map(function (k) { return k + ' = ' + v[k]; }).join('\n');
    return v == null ? '' : String(v);
  }
  function read(f, s) {
    if (f.kind === 'check') return !!s;
    s = String(s).trim();
    if (f.kind === 'list') return s ? s.split(/\s+/) : [];
    if (f.kind === 'map') {
      var o = {};
      s.split('\n').forEach(function (l) { var m = /^\s*([^=]+?)\s*=\s*(.*?)\s*$/.exec(l); if (m && m[2]) o[m[1]] = m[2]; });
      return o;
    }
    return s;
  }
  P.show = show; P.read = read;

  var B = SW.BENCH;
  if (!B || !B.editable) return;
  P.FIELDS.forEach(function (f) { var v = P.get(B, f.path); defaults[f.path] = v == null ? v : JSON.parse(JSON.stringify(v)); });
  P.apply(B, P.overrides());

  // ---------- Settings ▸ Bench ----------
  var esc = SW.esc, opened = {};
  function fields() { return P.FIELDS.filter(function (f) { return !f.only || f.only(SW.BENCH); }); }
  function id(f) { return 'pk-' + f.path.replace(/\./g, '-'); }
  function input(f) {
    var i = id(f);
    if (f.kind === 'check') return '<label class="check-row"><span><input type="checkbox" id="' + i + '"> ' + esc(f.label) + '</span>' + (f.hint ? '<span class="hint">' + esc(f.hint) + '</span>' : '') + '</label>';
    var box = f.kind === 'area' || f.kind === 'map' ? '<textarea id="' + i + '" rows="3" spellcheck="false"></textarea>' : '<input id="' + i + '" autocomplete="off" spellcheck="false">';
    if (f.locked) box = '<span class="token-row">' + box + '<button type="button" class="btn ghost" data-pk-unlock="' + f.path + '">Unlock</button></span>' +
      '<span class="pk-again" data-pk-again="' + f.path + '" hidden>Type the new value again to confirm it <input autocomplete="off" spellcheck="false"></span>';
    return '<label>' + esc(f.label) + box + (f.hint ? '<span class="hint">' + esc(f.hint) + '</span>' : '') + '</label>';
  }
  function html() {
    var out = '<p class="hint">This project’s own settings. config.js gives the defaults; what you change here is kept in this browser (Back up my data includes it) and is used when the page reloads, which Save does.</p>', g = '';
    fields().forEach(function (f) {
      if (f.group !== g) {
        g = f.group; out += '<h2>' + esc(g) + '</h2>';
        if (g === 'GitHub') out += '<p class="hint">Locked once set. Links, references, permalinks and annotations depend on these addresses, and nothing on GitHub moves when one changes here. To change one: Unlock, then type the new value a second time before saving.</p>';
      }
      out += input(f);
    });
    return out + '<h2>Changes to the locations</h2><div class="pk-log" id="pk-log"></div>';
  }
  function box(f) { return SW.$('#' + id(f)); }
  function again(f) { return SW.$('[data-pk-again="' + f.path + '"]'); }
  function lock(f, on) {
    var b = box(f), u = SW.$('[data-pk-unlock="' + f.path + '"]'), a = again(f);
    b.readOnly = on; b.classList.toggle('pk-locked', on);
    u.hidden = !on && !opened[f.path]; u.textContent = on ? 'Unlock' : 'Lock';
    a.hidden = on || !opened[f.path];
    if (on) a.querySelector('input').value = '';
  }
  function warn(f, to) {
    return confirm('Unlock ' + f.label.toLowerCase() + '?\n\nNow: ' + (P.value(f.path) || '(none)') + (to != null ? '\nPut back: ' + to : '') +
      '\n\nReferences, permalinks, links and annotations made under the present address may stop resolving. Nothing on GitHub is moved or renamed. ' +
      'You will be asked to type the new value a second time before it is saved.');
  }
  function unlock(f, to) {
    if (!warn(f, to)) return;
    opened[f.path] = true; lock(f, false);
    if (to != null) box(f).value = to;
    box(f).focus();
  }
  function relock(f) { opened[f.path] = false; box(f).value = show(f, P.value(f.path)); lock(f, true); }
  function drawLog() {
    var L = P.logged(), el = SW.$('#pk-log');
    el.innerHTML = L.length ? L.slice().reverse().map(function (e, i) {
      return '<div class="pk-entry"><span class="mono">' + esc(e.date) + ' ' + esc(e.by || '') + '</span> ' + esc(e.label || e.path) + ': <span class="mono">' + esc(e.from || '(none)') + '</span> → <span class="mono">' + esc(e.to || '(none)') + '</span>' +
        (e.from ? ' <button type="button" class="btn ghost" data-pk-back="' + (L.length - 1 - i) + '">Put back</button>' : '') + '</div>';
    }).join('') : '<p class="hint">None.</p>';
  }
  function byPath(p) { return P.FIELDS.filter(function (f) { return f.path === p; })[0]; }

  function load() {
    opened = {};
    fields().forEach(function (f) {
      var b = box(f), v = P.value(f.path);
      if (f.kind === 'check') b.checked = show(f, v); else b.value = show(f, v);
      var d = show(f, P.def(f.path));
      if (f.kind !== 'check' && d && d !== b.value) b.placeholder = 'config.js: ' + d.split('\n')[0];
      if (f.locked) lock(f, !!v);
    });
    var pane = SW.$('[data-sp="bench"]');
    pane.onclick = function (e) {
      var u = e.target.closest('[data-pk-unlock]'), k = e.target.closest('[data-pk-back]');
      if (u) { var f = byPath(u.dataset.pkUnlock); if (opened[f.path]) relock(f); else unlock(f); }
      if (k) { var en = P.logged()[+k.dataset.pkBack], g = byPath(en.path); if (g) { if (opened[g.path]) relock(g); unlock(g, en.from); } }
    };
    drawLog();
  }
  // the initials as typed in You, where Save is also setting them
  function initials() { var i = SW.$('#set-initials'); return (i && i.value.trim().toUpperCase()) || SW.me().initials; }
  function changes() {
    var out = [];
    fields().forEach(function (f) {
      var b = box(f), to = read(f, f.kind === 'check' ? b.checked : b.value), from = P.value(f.path);
      if (JSON.stringify(to) !== JSON.stringify(from == null ? read(f, f.kind === 'check' ? false : '') : from)) out.push({ f: f, from: from, to: to });
    });
    return out;
  }
  function check() {
    var me = initials(), msg = '';
    changes().some(function (c) {
      if (!c.f.locked) return false;
      msg = P.lockMsg({ label: c.f.label, from: c.from || '', to: c.to, again: again(c.f).querySelector('input').value.trim(), initials: me, pattern: c.f.pattern });
      return !!msg;
    });
    return msg;
  }
  function save() {
    var cs = changes(); if (!cs.length) return;
    var over = P.overrides(), L = P.logged(), me = initials();
    cs.forEach(function (c) {
      var d = P.def(c.f.path);
      if (JSON.stringify(c.to) === JSON.stringify(d)) delete over[c.f.path]; else over[c.f.path] = c.to;
      if (c.f.locked && c.from) L.push({ date: SW.today(), by: me, path: c.f.path, label: c.f.label, from: c.from, to: c.to });
    });
    SW.store.set(KEY, over); SW.store.set(LOG, L);
    setTimeout(function () { location.reload(); }, 900);
  }
  function add() {
    if (!SW.settings || !SW.settings.addTab) return;
    SW.settings.addTab('bench', 'Bench', 0);
    SW.settings.add({ tab: 'bench', html: html(), load: load, check: check, save: save });
  }
  if (SW.settings) add(); else document.addEventListener('DOMContentLoaded', add);
})(typeof window !== 'undefined' ? window : globalThis);
