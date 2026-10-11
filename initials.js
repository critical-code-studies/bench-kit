/*
 * initials.js - initials asked for in a box of their own, where something is to be signed without
 * them (an annotation, a reply, a reaction, a note, a paratext change): two to four letters and a
 * name if given, saved as ⚙ Settings saves them; the promise then resolves with the initials, so
 * the caller can go on with what was asked, or with null if put off. Not now and Esc put it off
 * (remembered as ini.later, for the bench's own reminders). Save, Not now and Esc each finish the
 * box at once, without waiting for its close event, which a hidden tab can hold back.
 * Part of bench-kit (github.com/critical-code-studies/bench-kit).
 */
(function (root) {
  'use strict';
  var SW = root.SW, asking = null;

  SW.askInitials = function (why) {
    var have = SW.me().initials;
    if (have) return Promise.resolve(have);
    if (asking) return asking;
    var d = SW.el('dialog', { class: 'ini-dlg' });
    d.innerHTML = '<form method="dialog" class="settings"><h2>Your initials</h2>' +
      '<p>' + SW.esc(why || 'Annotations, notes and findings are signed with your initials.') + ' They are kept in this browser (⚙ Settings has them too).</p>' +
      '<label>Initials <input class="ini-in" maxlength="4" autocomplete="off" spellcheck="false" placeholder="e.g. AB"></label>' +
      '<label>Name <input class="ini-name" autocomplete="name" placeholder="optional" value="' + SW.esc(SW.store.get('name', '')) + '"></label>' +
      '<p class="hint ini-msg"></p><div class="row"><button type="button" class="btn ghost" data-later>Not now</button><button value="save" class="btn">Save</button></div></form>';
    document.body.appendChild(d);
    var inp = SW.$('.ini-in', d), msg = SW.$('.ini-msg', d);
    inp.addEventListener('input', function () { var p = inp.selectionStart; inp.value = inp.value.toUpperCase().replace(/[^A-Z]/g, ''); inp.setSelectionRange(p, p); });
    asking = new Promise(function (ok) {
      var fin = false;
      function finish(saved) {
        if (fin) return; fin = true;
        if (d.open) d.close();
        d.remove(); asking = null;
        if (saved) { SW.toast('Saved: you sign as ' + saved, 3000); SW.emit('me', saved); } else SW.store.set('ini.later', Date.now());
        ok(saved || null);
      }
      SW.$('form', d).addEventListener('submit', function (e) {
        e.preventDefault();
        var v = inp.value.trim().toUpperCase();
        if (!/^[A-Z]{2,4}$/.test(v)) { msg.textContent = 'Two to four letters, please.'; inp.focus(); return; }
        SW.store.set('initials', v);
        var nm = SW.$('.ini-name', d).value.trim(); if (nm) SW.store.set('name', nm);
        SW.$$('.ini-need').forEach(function (b) { b.outerHTML = 'Signed <b>' + SW.esc(v) + '</b>'; });
        finish(v);
      });
      SW.$('[data-later]', d).onclick = function () { finish(null); };
      d.addEventListener('cancel', function (e) { e.preventDefault(); finish(null); });
      d.addEventListener('close', function () { finish(null); });
    });
    d.showModal(); inp.focus();
    return asking;
  };

  // the initials, asked for first if there are none
  SW.withInitials = function (why) { var i = SW.me().initials; return i ? Promise.resolve(i) : SW.askInitials(why); };

  // A "Set your initials" button anywhere (an annotation or reply box) opens the box. In the
  // capture phase: reply boxes stop their clicks from bubbling.
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-ask-initials]');
    if (!b) return;
    e.preventDefault(); e.stopPropagation();
    SW.askInitials();
  }, true);
})(typeof window !== 'undefined' ? window : globalThis);
