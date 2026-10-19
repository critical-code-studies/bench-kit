/*
 * settings.js - ⚙ Settings, in tabs: You (initials and name), Annotations (the Hypothesis group and
 * token), Paratexts (the GitHub token), Display (colour theme, code font and size, tinting, the
 * background of exported figures) and Developer. The box is made the first time it opens, from the
 * bench's settings (SW.BENCH.settings: tour, group and theme hints); a bench adds rows of its own
 * with SW.settings.add({ tab, html, load(), save() }) before then. The colour theme and the code
 * font and size are previewed as they change and put back on Cancel. The tab last used opens again.
 * The bench gives the kit its theme function as SW.setTheme (it redraws the bench's figures).
 * Part of bench-kit (github.com/critical-code-studies/bench-kit).
 */
(function (root) {
  'use strict';
  var SW = root.SW, S = SW.settings = {}, extra = [];
  var TABS = [['you', 'You'], ['anno', 'Annotations'], ['px', 'Paratexts'], ['display', 'Display'], ['dev', 'Developer']];
  S.add = function (row) { extra.push(row); };

  function rows(tab) { return extra.filter(function (r) { return (r.tab || 'display') === tab; }).map(function (r) { return r.html; }).join(''); }
  function build() {
    var B = SW.BENCH || {}, ST = B.settings || {}, BP = B.paratexts || {}, esc = SW.esc, PX = SW.paratexts || {};
    var d = SW.el('dialog', { id: 'dlg-settings', class: 'set-dlg' });
    d.innerHTML = '<form method="dialog" class="settings">' +
      '<div class="set-tabs" role="tablist">' + TABS.map(function (t) { return '<button type="button" role="tab" data-st="' + t[0] + '">' + t[1] + '</button>'; }).join('') + '</div>' +

      '<section class="set-pane" data-sp="you">' +
      '<p class="hint">Initials and a date are attached to every annotation, note and finding, so discussions can be followed. They are kept in this browser.</p>' +
      '<label>Initials <input id="set-initials" maxlength="4" placeholder="e.g. AB" autocomplete="off" spellcheck="false"></label>' +
      '<label>Name <input id="set-name" placeholder="optional" autocomplete="off"></label>' +
      '<p class="hint set-msg" id="set-inimsg"></p>' +
      '<label class="check-row"><span><input type="checkbox" id="set-fresh"> Tell me when a newer release is live</span><span class="hint">A bar at the foot of the page, with a button to reload, when the bench has been updated since this page was opened.</span></label>' + rows('you') + '</section>' +

      '<section class="set-pane" data-sp="anno">' +
      '<p class="hint">' + (ST.groupHint || 'Annotations are shared through a private Hypothesis group. Paste the group link from your invitation (it fills in the group), and a personal API token (hypothes.is/account/developer). Without them, annotations are kept as drafts in this browser and can be exported or published later.') + '</p>' +
      '<label>Group link or ID <input id="set-group" placeholder="' + esc(ST.groupPlaceholder || 'The group link from your invitation') + '" autocomplete="off"></label>' +
      '<label for="set-token">API token</label>' +
      '<div class="token-row"><input id="set-token" type="password" placeholder="6879-…" autocomplete="new-password" data-lpignore="true" data-1p-ignore spellcheck="false"><button id="set-token-show" type="button" class="btn ghost" aria-pressed="false">Show</button></div>' +
      '<p class="row-l"><button id="set-test" type="button" class="btn ghost">Test connection</button> <span class="hint" id="set-check"></span></p>' +
      '<p class="row-l"><a class="btn ghost" href="https://hypothes.is/account/developer" target="_blank" rel="noopener">Open the token page ↗</a> <button type="button" class="btn ghost" id="set-hypsteps">Copy the steps to send</button></p>' +
      '<p class="hint"><button type="button" class="btn ghost" id="set-join">New to this? How to join the group</button> An account, the group and your token, step by step.</p>' + rows('anno') + '</section>' +

      '<section class="set-pane" data-sp="px">' +
      '<p class="hint">The paratexts are kept in a private GitHub repository shared with the crew (' + esc((BP.org || '') + '/' + (BP.repo || '')) + '). Paste a fine-grained token limited to that repository, with Contents read and write (Paratexts, in the menu, says how). It is kept in this browser only.</p>' +
      '<label for="set-ghtoken">GitHub token</label>' +
      '<div class="token-row"><input id="set-ghtoken" type="password" placeholder="github_pat_…" autocomplete="new-password" data-lpignore="true" data-1p-ignore spellcheck="false"><button id="set-ghtoken-show" type="button" class="btn ghost" aria-pressed="false">Show</button></div>' +
      '<p class="row-l">' + (PX.TOKEN_URL ? '<a class="btn ghost" href="' + esc(PX.TOKEN_URL) + '" target="_blank" rel="noopener">Open the token form ↗</a> ' : '') +
      (PX.STEPS ? '<button type="button" class="btn ghost" id="set-ghsteps">Copy the steps to send</button>' : '') + '</p>' +
      '<p class="hint">The form arrives with its name, owner, a year’s expiry and the permission filled in; <b>Only select repositories</b> and <b>' + esc(BP.repo || '') + '</b> are chosen by hand. The token is read and write, so send the steps only to people who are to catalogue. Help ▸ Paratexts says the same at length.</p>' +
      (PX.LOST ? '<p class="hint">' + esc(PX.LOST) + '</p>' : '') +
      '<h2>Fetching ahead</h2><p class="hint">When an item is open, the items either side of it in the list (and in any sequence it is in) are fetched quietly into this browser, so Back and Next open at once. Files over 25 MB wait until asked for.</p>' +
      '<label>Fetch ahead <select id="set-ahead">' + [0, 1, 2, 3, 5, 10].map(function (n) { return '<option value="' + n + '">' + (n ? n + ' each way' : 'Off') + '</option>'; }).join('') + '</select></label>' + rows('px') + '</section>' +

      '<section class="set-pane" data-sp="display">' +
      '<h2>Colour theme</h2><p class="hint">' + esc(ST.themeHint || 'The colours of the whole bench: listings, annotations and figures. The ◐ button in the top bar switches between your last light and dark themes.') + '</p>' +
      '<label>Theme <select id="set-theme"></select></label><div class="theme-swatches" id="set-theme-sw"></div>' +
      '<h2>Reading code</h2><p class="hint">Applies wherever code is shown: listings, comparisons, traces, tables. The A− and A+ buttons in the top bar change the size too.</p>' +
      '<label>Code font <select id="set-font">' + [['system', 'System monospace'], ['JetBrains Mono'], ['IBM Plex Mono'], ['Source Code Pro'], ['Fira Code'], ['Courier Prime', 'Courier Prime (typewriter)'], ['Courier New']].map(function (f) { return '<option value="' + f[0] + '">' + (f[1] || f[0]) + '</option>'; }).join('') + '</select></label>' +
      rows('display') +
      '<label class="check-row"><span><input type="checkbox" id="set-noteshade"> Tint annotated lines</span><span class="hint">A faint ground on every line an annotation covers, in the listings.</span></label>' +
      '<label>Code size <span class="token-row"><input id="set-size" type="range" min="9" max="24" step="1"><span id="set-size-out" class="mono" style="min-width:3.5em"></span></span></label>' +
      '<h2>Figures</h2><p class="hint">The background given to exported figures (PNG and SVG). On a white or paper background figures are drawn in dark ink; on black, in phosphor. Transparent leaves the background empty, for layering in other software.</p>' +
      '<label>Background for exported figures <select id="set-figbg"><option value="white">White (for print and Word)</option><option value="paper">Listing paper</option><option value="black">Black (phosphor)</option><option value="transparent">Transparent</option><option value="theme">The current colour theme</option></select></label></section>' +

      '<section class="set-pane" data-sp="dev"><p class="dev-warn">Only use if you are developing this software.</p>' +
      '<label class="check-row"><span><input type="checkbox" id="set-dev"> Developer mode</span><span class="hint">Shows annotations marked Developer only, and features still being built. This allows you to see Beta software and may affect your ability to use the software.</span></label>' + rows('dev') + '</section>' +

      '<div class="row set-foot"><button type="button" class="btn ghost" id="set-tour" title="' + esc(ST.tour || 'A guided tour of the bench') + '">Take the welcome tour</button><span class="set-gap"></span><button value="cancel" class="btn ghost">Cancel</button><button value="save" id="set-save" class="btn">Save</button></div></form>';
    document.body.appendChild(d);
    // tabs
    function show(t) {
      SW.$$('.set-tabs [data-st]', d).forEach(function (b) { var on = b.dataset.st === t; b.classList.toggle('on', on); b.setAttribute('aria-selected', String(on)); });
      SW.$$('.set-pane', d).forEach(function (p) { p.hidden = p.dataset.sp !== t; });
      SW.store.set('set.tab', t);
    }
    S.show = show;
    SW.$('.set-tabs', d).addEventListener('click', function (e) { var b = e.target.closest('[data-st]'); if (b) show(b.dataset.st); });
    SW.$('#set-tour', d).onclick = function () { d.close('cancel'); SW.tours.start('welcome'); };
    // initials: two to four letters, or none
    var ini = SW.$('#set-initials', d);
    ini.addEventListener('input', function () { var p = ini.selectionStart; ini.value = ini.value.toUpperCase().replace(/[^A-Z]/g, ''); ini.setSelectionRange(p, p); });
    SW.$('form', d).addEventListener('submit', function (e) {
      if (!e.submitter || e.submitter.value !== 'save') return;
      var v = ini.value.trim();
      if (v && !/^[A-Z]{2,4}$/.test(v)) { e.preventDefault(); show('you'); SW.$('#set-inimsg', d).textContent = 'Initials: two to four letters, please.'; ini.focus(); }
    });
    return d;
  }

  // a token written only when it differs from the one held; an empty box removes one only when confirmed
  function keepToken(key, v, what) {
    var was = String(SW.store.get(key, '') || '').trim();
    if (v === was) return false;
    if (!v && was && !confirm('Remove the ' + what + ' from this browser? The bench will ask for one again.')) return false;
    SW.store.set(key, v); return true;
  }
  S.open = function (tab) {
    var dlg = SW.$('#dlg-settings') || build(), B = SW.BENCH || {};
    S.show(tab || SW.store.get('set.tab', 'you'));
    SW.$('#set-inimsg').textContent = '';
    SW.$('#set-initials').value = SW.store.get('initials', '');
    SW.$('#set-name').value = SW.store.get('name', '');
    var grp = SW.$('#set-group'), tok = SW.$('#set-token'), show = SW.$('#set-token-show');
    grp.value = SW.notes.groupId(SW.store.get('group', B.group || ''));
    tok.value = SW.store.get('token', '');
    tok.type = 'password'; show.textContent = 'Show'; show.setAttribute('aria-pressed', 'false');
    SW.$('#set-ahead').value = String(SW.store.get('px.ahead', 1));
    var gtok = SW.$('#set-ghtoken'), gshow = SW.$('#set-ghtoken-show');
    gtok.value = SW.store.get('gh.token', ''); gtok.type = 'password'; gshow.textContent = 'Show'; gshow.setAttribute('aria-pressed', 'false');
    gshow.onclick = function () { var hid = gtok.type === 'password'; gtok.type = hid ? 'text' : 'password'; gshow.textContent = hid ? 'Hide' : 'Show'; gshow.setAttribute('aria-pressed', String(hid)); };
    SW.$('#set-check').textContent = '';
    dlg.returnValue = '';
    // A pasted group link is reduced to its ID, so what is stored is visible.
    grp.onchange = function () { grp.value = SW.notes.groupId(grp.value); };
    show.onclick = function () { var hidden = tok.type === 'password'; tok.type = hidden ? 'text' : 'password'; show.textContent = hidden ? 'Hide' : 'Show'; show.setAttribute('aria-pressed', String(hidden)); };
    SW.$('#set-join').onclick = function () { SW.notes.joinHelp(); };
    // the steps to send someone, copied rather than written out again; built by the modules that
    // own each service, so the group, the organisation and the repository stay right
    var hyps = SW.$('#set-hypsteps');
    if (hyps) hyps.onclick = function () { SW.copyText(SW.notes.joinSteps(), 'the steps'); };
    var ghs = SW.$('#set-ghsteps');
    if (ghs) ghs.onclick = function () { SW.copyText(PX.STEPS, 'the steps'); };
    SW.$('#set-test').onclick = function () {
      SW.store.set('group', SW.notes.groupId(grp.value));
      SW.store.set('token', tok.value.trim());
      SW.$('#set-check').textContent = 'Checking…';
      SW.notes.test().then(function (r) {
        SW.$('#set-check').textContent = 'Connected as ' + r.user + (r.group ? '; group “' + r.group + '” found.' : '; but that group was not found for this account.');
      }, function (e) { SW.$('#set-check').textContent = e.message; });
    };
    // Colour theme: previewed live, put back on Cancel.
    var themeSel = SW.$('#set-theme'), wasTheme = SW.theme();
    themeSel.innerHTML = ['Dark', 'Light'].map(function (g) {
      return '<optgroup label="' + g + '">' + SW.THEMES.filter(function (t) { return t.dark === (g === 'Dark'); }).map(function (t) {
        return '<option value="' + t.id + '"' + (t.id === wasTheme ? ' selected' : '') + ' title="' + SW.esc(t.note) + '">' + SW.esc(t.label) + '</option>';
      }).join('') + '</optgroup>';
    }).join('');
    function swatches() {
      var t = SW.themeInfo(themeSel.value), sw = SW.$('#set-theme-sw');
      sw.innerHTML = '<span class="hint">' + SW.esc(t.note) + '</span>' + ['--bg', '--surface', '--text', '--beam', '--amber', '--green', '--violet', '--red', '--g-retained', '--g-edited'].map(function (n) {
        return '<i style="background:' + SW.cssVar(n) + '" title="' + n.slice(2) + '"></i>';
      }).join('');
    }
    themeSel.onchange = function () { SW.setTheme(themeSel.value); swatches(); };
    swatches();
    SW.$('#set-figbg').value = SW.figBg();
    SW.$('#set-noteshade').checked = SW.store.get('noteShade', true);
    SW.$('#set-fresh').checked = SW.store.get('freshBar', true) !== false;
    SW.$('#set-dev').checked = SW.dev();
    extra.forEach(function (r) { if (r.load) r.load(); });
    var fontSel = SW.$('#set-font'), size = SW.$('#set-size'), sizeOut = SW.$('#set-size-out');
    var was = { font: SW.codeFont(), size: SW.codeSize() };
    fontSel.value = was.font; size.value = was.size; sizeOut.textContent = was.size + ' px';
    // Preview live; Cancel puts them back.
    fontSel.onchange = function () { SW.store.set('codeFont', fontSel.value); SW.applyCodeText(); };
    size.oninput = function () { sizeOut.textContent = size.value + ' px'; SW.store.set('codeSize', +size.value); SW.applyCodeText(); };
    dlg.onclose = function () {
      if (dlg.returnValue !== 'save') { SW.store.set('codeFont', was.font); SW.store.set('codeSize', was.size); SW.applyCodeText(); if (SW.theme() !== wasTheme) SW.setTheme(wasTheme); return; }
      SW.store.set('figbg', SW.$('#set-figbg').value);
      SW.store.set('noteShade', SW.$('#set-noteshade').checked);
      SW.store.set('freshBar', SW.$('#set-fresh').checked);
      if (!SW.$('#set-fresh').checked) SW.$$('.fresh-bar').forEach(function (b) { b.remove(); });
      extra.forEach(function (r) { if (r.save) r.save(); });
      SW.applyNoteShade();
      if (SW.dev() !== SW.$('#set-dev').checked) {
        SW.store.set('dev', SW.$('#set-dev').checked); SW.applyDev();
        if (SW.dev()) SW.toast('Developer mode on', 3000);
        else SW.notes.myDevCount().then(function (k) {
          SW.toast('Developer mode off' + (k ? '. ' + k + ' of your annotations ' + (k === 1 ? 'is' : 'are') + ' marked Developer only and now hidden: to share ' + (k === 1 ? 'it' : 'them') + ', turn the mode on, Edit, and untick Developer only.' : ''), k ? 9000 : 3000);
        });
      }
      SW.store.set('initials', SW.$('#set-initials').value.trim().toUpperCase());
      SW.store.set('name', SW.$('#set-name').value.trim());
      SW.store.set('group', SW.notes.groupId(grp.value));
      // the tokens: written only when changed in the box (so a box a browser filled, or left empty, does not
      // overwrite one held), and taken out only when asked
      keepToken('token', tok.value.trim(), 'Hypothesis API token');
      SW.store.set('px.ahead', +SW.$('#set-ahead').value);
      if (keepToken('gh.token', gtok.value.trim(), 'GitHub token') && SW.paratexts) SW.paratexts.reset();
      SW.notes.forget();
      SW.notes.invalidate(SW.state.v);
      SW.toast('Saved');
    };
    dlg.showModal();
  };
})(typeof window !== 'undefined' ? window : globalThis);
