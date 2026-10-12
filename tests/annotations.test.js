/*
 * tests/annotations.test.js - checks of the annotation system's pure parts (Markdown, rich
 * text back to Markdown, plain text for print, earlier wordings, bench links, ghosts, open and
 * resolved, mentions), run by tests/run.js in a bench's tests/annotations.html, after the
 * bench's own values (its tests/annotations.test.js):
 *   window.BENCH_TESTS = { link: { v, l, name }, text, lineKey: [line, key] }
 *     link     a version and lines for a bench link, and a RegExp for its name in print
 *     text     a phrase with non-ASCII characters, from the bench's sources
 *     lineKey  a line in the bench's language and its key (comments and spacing set aside)
 * The prefix of the bench's older tags is SW.BENCH.tag. Nothing here touches Hypothesis or
 * settings.
 * Part of bench-kit (github.com/critical-code-studies/bench-kit).
 */
(function () {
  'use strict';
  var SW = window.SW, N = SW.notes, eq = window.T.eq, yes = window.T.yes;
  var T = window.BENCH_TESTS || {}, TAG = SW.BENCH.tag || 'bk:';
  function html(md) { var d = document.createElement('div'); d.innerHTML = SW.md(md); return d; }

  window.T.group('Markdown');
  eq('bold, italic, code, struck', SW.md('**b** *i* `c` ~~s~~'), '<p><b>b</b> <i>i</i> <code>c</code> <s>s</s></p>');
  eq('a line break inside a paragraph', SW.md('a\nb'), '<p>a<br>b</p>');
  eq('paragraphs', SW.md('a\n\nb'), '<p>a</p><p>b</p>');
  eq('a list under a sentence', SW.md('Intro:\n- one\n- two'), '<p>Intro:</p><ul><li>one</li><li>two</li></ul>');
  eq('numbered list', SW.md('1. a\n2. b'), '<ol><li>a</li><li>b</li></ol>');
  eq('quotation', SW.md('> q'), '<blockquote><p>q</p></blockquote>');
  eq('code block keeps its lines', SW.md('```\nlac nx1\n\tdac ny1\n```'), '<pre class="md-pre"><code>lac nx1\n\tdac ny1</code></pre>');
  eq('heading', SW.md('# Title'), '<p><b class="md-h">Title</b></p>');
  eq('HTML is text', SW.md('<script>x</script>'), '<p>&lt;script&gt;x&lt;/script&gt;</p>');
  eq('javascript: is not a link', SW.md('[x](javascript:alert(1))'), '<p>[x](javascript:alert(1))</p>');
  yes('a link opens in a new tab', /target="_blank"/.test(SW.md('[F-36](https://bitsavers.org/x.pdf)')));
  yes('a bare address is a link', /<a href="https:\/\/example.com\/a_b"/.test(SW.md('see https://example.com/a_b.')));
  eq('snake_case is not italic', SW.md('snake_case_name'), '<p>snake_case_name</p>');
  eq('\\* is a plain star', SW.md('2\\*3\\*4'), '<p>2*3*4</p>');
  yes('an escaped underscore in an address is dropped', /a=ab_-cd"/.test(SW.md('https://x.org/?a=ab\\_-cd')));
  eq('a mention', SW.md('ask @DMB'), '<p>ask <span class="mention" title="A mention of DMB">@DMB</span></p>');
  eq('an email address is not a mention', SW.md('me@x.org'), '<p>me@x.org</p>');
  eq('hidden lines stay hidden', SW.md('text\n\n<!-- ' + TAG + 'was 2026-09-30T10:00:00Z dGV4dA== -->'), '<p>text</p>');

  window.T.group('Rich text to Markdown');
  ['Plain **bold** and *italic* and `lac nx1` and ~~gone~~.\nNext line.',
   'See [Graetz](https://example.com/g) and snake_case and 2\\*3\\*4.',
   'Intro:\n\n- one\n- two',
   '> quoted *text*\n> more\n\nafter',
   '```\nlac nx1\ndac ny1\n```',
   '# Heading\n\nbody\n\n1. a\n2. b',
   'see https://x.org/?a=ab_-cd here'].forEach(function (md, i) {
    var back = SW.htmlToMd(html(md));
    eq('round trip ' + (i + 1) + ' renders the same', SW.md(back), SW.md(md));
  });
  eq('an address typed as text is left whole', SW.htmlToMd(html('see https://x.org/?a=ab_-cd')), 'see https://x.org/?a=ab_-cd');
  eq('a bench link written bare stays bare', SW.htmlToMd(html('see ' + SW.BASE_URI + '?v=4.1&a=Xy')), 'see ' + SW.BASE_URI + '?v=4.1&a=Xy');
  eq('marks typed as text are escaped', SW.htmlToMd((function () { var d = document.createElement('div'); d.textContent = 'a*b*c'; return d; })()), 'a\\*b\\*c');

  window.T.group('Plain text');
  eq('marks out, links as text (url)', SW.mdPlain('**b** [F](https://x.org) `c`'), 'b F (https://x.org) c');
  eq('hidden lines out', SW.mdPlain('t\n\n<!-- ' + TAG + 'was 2026 dA== -->'), 't');

  window.T.group('Earlier wordings');
  var H = SW.noteHistory, fig = '\n\n<!-- ' + TAG + 'fig:gz H4sIAAAA -->';
  var v2 = H.compose('second', 'first', '2026-09-30T10:00:00Z');
  eq('the replaced wording is kept', H.list(v2).map(function (h) { return h.text; }), ['first']);
  eq('the visible text is the new one', H.visible(v2), 'second');
  var v3 = H.compose('third', v2 + fig, '2026-09-30T11:00:00Z');
  eq('wordings build up, oldest first', H.list(v3).map(function (h) { return h.text; }), ['first', 'second']);
  yes('a figure stays last', v3.slice(-fig.length + 2) === fig.slice(2));
  eq('the figure is still found', SW.figpack.split(v3).b64, 'H4sIAAAA');
  eq('no change, no new wording', H.list(H.compose('second', v2, 'x')).length, 1);
  eq('non-ASCII survives', H.list(H.compose('b', T.text, 'x'))[0].text, T.text);

  window.T.group('Bench links');
  var LK = T.link, u = SW.BASE_URI + '?v=' + LK.v + '&l=' + LK.l + '&a=AbC-12_x';
  eq('a bench link is read', N.parseLink(u), { v: LK.v, l: LK.l, a: 'AbC-12_x' });
  eq('another site is not', N.parseLink('https://example.com/?v=' + LK.v), null);
  eq('an escaped underscore is read through', N.parseLink(SW.BASE_URI + '?v=' + LK.v + '&a=ab\\_-cd').a, 'ab_-cd');
  yes('a bench link is drawn in place, not in a new tab', /class="swlink"/.test(SW.md(u)) && !/_blank/.test(SW.md(u)));
  yes('for print, a bench link becomes its name', LK.name.test(N.linksAsNames('see ' + u)));

  window.T.group('Ghosts');
  function keys(lines) { return lines.map(function (t) { return { k: SW.lineKey(t) }; }); }
  function indexOf(h) { var ix = {}; h.forEach(function (x, j) { if (x.k) (ix[x.k] = ix[x.k] || []).push(j); }); return ix; }
  var src = keys(['define listen', '\tcla+cli+clf 1-opr-opr', '\tszf i 1', '\tjmp .-1', '\ttyi', '\tterm', '', 'define swap', '\trcl 9s', '\trcl 9s', '\tterm']);
  var shifted = keys(['/ five lines', 'a', 'b', 'c', 'd'].concat(['define listen', '\tcla+cli+clf 1-opr-opr', '\tszf i 1', '\tjmp .-1', '\ttyi', '\tterm', '', 'define swap', '\trcl 9s', '\trcl 9s', '\tterm']));
  eq('a block moved down five lines is found there', SW.ghostMatch(src, 0, 5, shifted, indexOf(shifted)), 5);
  var edited = keys(['define listen', '\tcla+cli+clf 1-opr-opr', '\tszf i 2', '\tjmp .-1', '\ttyi', '\tterm']);
  eq('one line of six changed: still found', SW.ghostMatch(src, 0, 5, edited, indexOf(edited)), 0);
  var other = keys(['define other', 'lac a', 'dac b', 'term']);
  eq('nothing alike: no ghost', SW.ghostMatch(src, 0, 5, other, indexOf(other)), -1);
  var common = keys(['x', '\tterm', 'y', '\tterm', 'z']), one = keys(['q', '\tterm', 'r']);
  eq('a single common line with no context: no ghost', SW.ghostMatch(one, 1, 1, common, indexOf(common)), -1);
  eq('comments and spacing set aside', SW.lineKey(T.lineKey[0]), T.lineKey[1]);

  window.T.group('Open and resolved');
  eq('none', N.statusOf([]).state, '');
  eq('🔓 opens', N.statusOf([{ text: '🔓', date: '2026-09-30T10:00' }]).state, 'open');
  eq('a later ✅ resolves', N.statusOf([{ text: '🔓', date: '2026-09-30T10:00' }, { text: '✅', date: '2026-09-30T11:00' }, { text: '👍', date: '2026-09-30T12:00' }]).state, 'resolved');
  eq('a later 🔓 opens again', N.statusOf([{ text: '✅', date: '2026-09-30T10:00' }, { text: '🔓', date: '2026-09-30T11:00' }]).state, 'open');
  eq('💡 asks for help', N.statusOf([{ text: '🔓', date: '2026-09-30T10:00' }, { text: '💡', date: '2026-09-30T11:00' }]).state, 'help');
  yes('help counts as open in filters', N.isOpen('help') && N.isOpen('open') && !N.isOpen('resolved'));
  eq('the old status marks are ignored', N.statusOf([{ text: 'status:open', date: '2026-09-30T10:00' }]).state, '');

  window.T.group('Mentions');
  yes('a mention of CL', N.mentions({ text: 'ask @CL here' }, 'CL'));
  yes('@CLX is not CL', !N.mentions({ text: 'ask @CLX here' }, 'CL'));
  yes('a mention in an earlier wording does not count', !N.mentions({ text: 'now\n\n' + H.was('ask @CL', 'x').trim() }, 'CL'));

})();
