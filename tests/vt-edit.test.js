/*
 * tests/vt-edit.test.js - checks of kit/vt-edit.js's plain functions: edits as a change list's entries,
 * the list read back and applied as tools/vt_apply.py applies it (OLD once, then gone), a file with its
 * lists applied, windows on a text, and undo and redo. Each list-writing check applies the entries with
 * the same rule as vt_apply, so a list that it would refuse fails here.
 * Part of bench-kit (github.com/critical-code-studies/bench-kit).
 */
(function () {
  'use strict';
  var T = window.T, eq = T.eq, E = window.SWVTEdit, VT = window.SWVT;
  T.group('vt-edit');
  var text = '# A book\n\n## Chapter 1\n\n[p. 1] [コマ 7] The first page says the same thing here, and the same thing there, in so many words as it can find.\n\n[p. 2] The second page begins[^1] and ends without any trouble at all, as a page should do.\n\n## Appendix\n\nThe last words.\n';
  var D = { image: '\\[コマ (\\d+)\\]' };
  function count(s, x) { return s.split(x).length - 1; }
  // as vt_apply: each OLD exactly once, in order; and the list as written, read back
  function applied(base, next) {
    var es = E.entries(base, next, { target: 'translation', desc: D }), raw = E.list(es, { origin: 'editor DB', why: 'a test' }), s = base, ok = true;
    VT.changes(raw, 'l.md').forEach(function (c) { if (count(s, c.old) !== 1) ok = false; s = s.replace(c.old, function () { return c.new; }); });
    return { ok: ok, text: s, es: es, raw: raw };
  }
  function roundTrip(name, next) { var r = applied(text, next); T.yes(name + ': each OLD once', r.ok); eq(name + ': gives the text', r.text, next); return r; }
  var one = roundTrip('a word changed', text.replace('second page begins', 'second leaf begins'));
  eq('one entry', one.es.length, 1);
  eq('its page', one.es[0].where, 'p. 2');
  T.yes('at least 8 words of OLD, where its line has them', one.es[0].old.match(/[\p{L}\p{N}]+/gu).length >= 8);
  roundTrip('a phrase that occurs twice', text.replace('the same thing there', 'another thing there'));
  roundTrip('a word doubled: OLD would sit inside NEW', text.replace('trouble', 'trouble trouble'));
  roundTrip('a marker moved', text.replace('[p. 2] The second', 'The second [p. 2]'));
  roundTrip('a paragraph split', text.replace('page begins', 'page\n\nbegins'));
  roundTrip('two paragraphs joined', text.replace('find.\n\n[p. 2]', 'find. [p. 2]'));
  roundTrip('a paragraph taken out', text.replace('## Appendix\n\nThe last words.\n', ''));
  roundTrip('a line at the top', 'New.\n' + text);
  roundTrip('a line at the end', text + 'New.\n');
  roundTrip('a line at the end of a file with no last break', text.slice(0, -1) + '\nNew.');
  eq('the same text: no changes', E.entries(text, text, { target: 'literal' }).length, 0);
  var two = roundTrip('two changes far apart', text.replace('first page', 'opening page').replace('without any trouble', 'without trouble'));
  eq('two entries', two.es.length, 2);
  eq('a section outside the pages named as one', applied(text, text.replace('The last words', 'The very last words')).es[0].where, '§ Appendix');

  T.group('vt-edit: the list’s form');
  T.yes('a multi-line OLD is fenced', /OLD:\n~~~\n/.test(applied(text, text.replace('find.\n\n[p. 2]', 'find. [p. 2]')).raw));
  var del = VT.changes(E.list([{ target: 'literal', where: 'p. 3', old: 'gone', new: '' }], { origin: 'internal' }), 'l.md')[0];
  eq('an empty NEW', del.new, '');
  eq('its target', del.target, 'literal');
  eq('its origin', del.origin, 'internal');
  var lead = VT.changes(E.list([{ target: 'translation', old: '\nx', new: 'y\n' }]), 'l.md')[0];
  eq('a fenced value that begins with a break keeps it', lead.old, '\nx');
  eq('and one that ends with a break', lead.new, 'y\n');
  var refused = false;
  try { E.entries('a b c\n', 'a b\n~~~\nc\n', { target: 'translation' }); } catch (e) { refused = true; }
  T.yes('a line of ~~~ is refused', refused);

  T.group('vt-edit: a file with its lists');
  var next = text.replace('second page begins', 'second leaf begins'), list = E.list(E.entries(text, next, { target: 'translation' }));
  var w = E.working(text, [{ name: 'a', raw: list }], 'translation');
  eq('not yet applied: shown', w.text, next);
  eq('and counted', w.pending.length, 1);
  w = E.working(next, [{ name: 'a', raw: list }], 'translation');
  eq('applied: nothing more done', w.text, next);
  eq('and counted as applied', w.applied.length, 1);
  w = E.working(text, [{ name: 'a', raw: list }], 'literal');
  eq('another target: left alone', w.text, text);
  w = E.working(text.replace('second page begins', 'other words'), [{ name: 'a', raw: list }], 'translation');
  eq('the passage changed since: stuck', w.stuck.length, 1);
  var top = 'New.\n' + text, tl = E.list(E.entries(text, top, { target: 'translation' }));
  eq('words added at the top, before', E.working(text, [{ name: 'a', raw: tl }], 'translation').text, top);
  eq('words added at the top, after: not twice', E.working(top, [{ name: 'a', raw: tl }], 'translation').text, top);
  var back = E.list(E.entries(next, text, { target: 'translation' }));
  eq('a save undoing a save: both unapplied', E.working(text, [{ name: 'a', raw: list }, { name: 'b', raw: back }], 'translation').text, text);

  T.group('vt-edit: windows');
  var ws = E.windows(text, { image: D.image, body: { until: '^#+ Appendix' } });
  eq('the keys', ws.map(function (x) { return x.key; }).join(' '), 's1 s3 p1 p2 s9');
  eq('a page’s text', text.slice(ws[2].a, ws[2].b).slice(0, 6), '[p. 1]');
  eq('its image', ws[2].img, 7);
  eq('no page outside the pages', ws[4].page, null);
  var mid = 'a\n\n[p. 1] one [p. 2] two\n\n[p. 3] three\n', mw = E.windows(mid, {});
  eq('a line with two pages is in both', mid.slice(mw.filter(function (x) { return x.key === 'p2'; })[0].a, mw.filter(function (x) { return x.key === 'p1'; })[0].b).indexOf('two') >= 0, true);

  T.group('vt-edit: undo and redo');
  var H = E.history('abc');
  H.change({ at: 3, del: '', ins: 'd', t: 1000 }); H.change({ at: 4, del: '', ins: 'e', t: 1100 });
  eq('typing', H.text, 'abcde');
  eq('typing is one step', H.ops.length, 1);
  H.change({ at: 5, del: '', ins: 'f', t: 9000 });
  eq('after a pause, another', H.ops.length, 2);
  H.undo(); eq('undo', H.text, 'abcde');
  H.undo(); eq('undo again', H.text, 'abc');
  eq('nothing left to undo', H.undo(), null);
  H.redo(); H.redo(); eq('redo twice', H.text, 'abcdef');
  eq('nothing left to redo', H.redo(), null);
  H.undo(); H.change({ at: 0, del: 'a', ins: 'z', t: 20000 });
  eq('an edit after an undo drops the redo', H.undone.length, 0);
  var K = E.history('one two ');
  K.change({ at: 8, del: '', ins: 't', t: 1 }); K.change({ at: 9, del: '', ins: ' ', t: 2 }); K.change({ at: 10, del: '', ins: 'x', t: 3 });
  eq('a word is a step', K.ops.length, 2);
  var again = E.history('abcdef', { ops: [{ at: 3, del: '', ins: 'def', t: 1 }], undone: [] });
  again.undo(); eq('steps kept across a reload', again.text, 'abc');
  var op = E.diffOp('hello world', 'hello brave world', 100);
  eq('a splice, at the window’s offset', [op.at, op.del, op.ins].join('|'), '106||brave ');
})();
