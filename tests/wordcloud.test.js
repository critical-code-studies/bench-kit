/*
 * tests/wordcloud.test.js - checks of kit/wordcloud.js, run by tests/run.js: a cloud laid out with
 * each word's box as its ink and a fixed width for each letter (so the checks do not depend on the
 * fonts of the machine they run on), its words inside the
 * frame and apart, the same cloud for the same seed, words that do not fit, upright words, the oval,
 * and a layout kept and redrawn.
 * Part of bench-kit (github.com/critical-code-studies/bench-kit).
 */
(function () {
  'use strict';
  var T = window.T, eq = T.eq, yes = T.yes, C = window.SW.wordcloud;
  var WORDS = 'whale sea ship ahab captain boat man old ishmael queequeg starbuck stubb flask pequod white sperm oil harpoon line deck'.split(' ');
  function measure(w, s) { return w.length * s * 0.52; }
  var items = WORDS.map(function (w, i) { return { w: w, n: Math.round(1000 / (i + 1)) }; });
  function lay(o) { return C.cloud(items, Object.assign({ width: 600, height: 300, measure: measure }, o || {})); }
  function boxes(r) { return Object.keys(r.places).map(function (w) { return r.places[w]; }); }
  function apart(r) {
    var P = boxes(r);
    for (var i = 0; i < P.length; i++) for (var j = i + 1; j < P.length; j++) {
      var a = P[i], b = P[j];
      if (Math.abs(a.x - b.x) * 2 < a.w + b.w && Math.abs(a.y - b.y) * 2 < a.h + b.h) return false;
    }
    return true;
  }
  function inside(r, W, H) { return boxes(r).every(function (p) { return p.x - p.w / 2 >= 0 && p.y - p.h / 2 >= 0 && p.x + p.w / 2 <= W && p.y + p.h / 2 <= H; }); }

  T.group('Word cloud: the layout');
  var r = lay();
  eq('every word drawn', r.drawn.length, WORDS.length);
  yes('no two words overlap', apart(r));
  yes('every word inside the frame', inside(r, 600, 300));
  eq('the most frequent word at the largest size', r.places.whale.size, 60);
  eq('the least at the smallest that its count gives', Math.round(r.places.deck.size * 10) / 10, Math.round((11 + 49 * Math.sqrt(50 / 1000)) * 10) / 10);
  eq('the same seed, the same cloud', lay().svg, r.svg);
  yes('another seed, another cloud', lay({ seed: 12 }).svg !== r.svg);
  yes('the spiral: apart and inside', (function (s) { return apart(s) && inside(s, 600, 300); })(lay({ layout: 'spiral' })));
  eq('word_cloud\'s relative sizes: each from the one before', (function (s) { return s.places.sea.size; })(lay({ contrast: 'relative' })), Math.round((0.5 * 500 / 1000 + 0.5) * 60));

  T.group('Word cloud: words that do not fit');
  var small = C.cloud(items, { width: 100, height: 60, measure: measure, max: 40 });
  yes('some are dropped', small.dropped.length > 0);
  eq('the dropped and the drawn are every word', small.dropped.length + small.drawn.length, WORDS.length);
  yes('a word that does not fit at its size is set smaller', small.places.whale && small.places.whale.size < 40);
  var rel = C.cloud(items, { width: 100, height: 60, measure: measure, max: 40, contrast: 'relative' });
  eq('with relative sizes, every word after the first that does not fit is dropped (as word_cloud stops)', rel.drawn.length + rel.dropped.length, WORDS.length);
  yes('and none is drawn after it', WORDS.indexOf(rel.dropped[0]) > WORDS.indexOf(rel.drawn[rel.drawn.length - 1]));

  T.group('Word cloud: orientation and shape');
  eq('upright 0: none upright', boxes(lay()).filter(function (p) { return p.up; }).length, 0);
  eq('upright 1: all upright', boxes(lay({ upright: 1 })).filter(function (p) { return p.up; }).length, WORDS.length);
  yes('an upright word is taller than wide', lay({ upright: 1 }).places.captain.h > lay({ upright: 1 }).places.captain.w);
  yes('an upright word is turned about its centre', /rotate\(-90 /.test(lay({ upright: 1 }).svg));
  var ov = lay({ shape: 'oval' });
  yes('the oval: every corner of every word inside the ellipse', boxes(ov).every(function (p) {
    return [[-1, -1], [1, -1], [-1, 1], [1, 1]].every(function (k) {
      var dx = (p.x + k[0] * p.w / 2 - 300) / 300, dy = (p.y + k[1] * p.h / 2 - 150) / 150; return dx * dx + dy * dy <= 1.02;
    });
  }));
  yes('a mask keeps words off the left half', boxes(lay({ mask: function (x) { return x < 300; } })).every(function (p) { return p.x - p.w / 2 >= 300; }));
  eq('the shapes a lens lists, the first ids kept', Object.keys(C.SHAPES), ['rect', 'square', 'oval', 'round', 'diamond', 'hexagon', 'triangle', 'heart']);
  eq('each shape named', Object.keys(C.SHAPES).map(function (k) { return C.SHAPES[k][0]; }), ['Rectangle', 'Square', 'Oval', 'Circle', 'Diamond', 'Hexagon', 'Triangle', 'Heart']);
  // a word's four corner pixels inside its shape
  function within(r, id) {
    var f = C.SHAPES[id][1];
    return boxes(r).every(function (p) {
      var x0 = Math.floor(p.x - p.w / 2), x1 = Math.ceil(p.x + p.w / 2) - 1, y0 = Math.floor(p.y - p.h / 2), y1 = Math.ceil(p.y + p.h / 2) - 1;
      return f(x0, y0, 600, 300) && f(x1, y0, 600, 300) && f(x0, y1, 600, 300) && f(x1, y1, 600, 300);
    });
  }
  Object.keys(C.SHAPES).forEach(function (id) {
    var r = lay({ shape: id, upright: 0.3 });
    yes(C.SHAPES[id][0] + ': some words, each inside the shape and apart', r.drawn.length > 3 && within(r, id) && apart(r));
  });
  eq('circle is the same as round', lay({ shape: 'circle' }).svg, lay({ shape: 'round' }).svg);
  eq('a shape not known is the rectangle', lay({ shape: 'whale' }).svg, lay().svg);

  T.group('Word cloud: a layout kept');
  var later = C.cloud([{ w: 'whale', n: 250 }, { w: 'sea', n: 900 }, { w: 'kraken', n: 40 }], { width: 600, height: 300, measure: measure, places: r.places, scale: 1000, faint: true });
  eq('a word keeps its place', later.places.whale, r.places.whale);
  yes('a word whose count falls is drawn smaller', +/font-size="([\d.]+)"[^>]*data-w="whale"/.exec(later.svg)[1] < r.places.whale.size);
  eq('a word whose count rises is drawn no larger than its place', +/font-size="([\d.]+)"[^>]*data-w="sea"/.exec(later.svg)[1], Math.round(r.places.sea.size * 10) / 10);
  eq('a word with no place is left out', later.drawn.indexOf('kraken'), -1);
  yes('a placed word with no count here is drawn faintly', /fill="var\(--line\)" data-w="ship"/.test(later.svg));
  eq('the drawn are those with places and counts', later.drawn.sort(), ['sea', 'whale']);

  T.group('Word cloud: the SVG');
  var odd = C.cloud([{ w: 'a<b>&"c"', n: 3, fill: 'var(--green)', alpha: 0.5, title: 'odd: 3' }], { width: 300, height: 120, ink: 'box' });
  yes('a word escaped', odd.svg.indexOf('a&lt;b&gt;&amp;&quot;c&quot;</text>') > 0);
  yes('its data-w for a click', odd.svg.indexOf('data-w="a&lt;b&gt;&amp;&quot;c&quot;"') > 0);
  yes('its colour, its opacity and its title', /fill="var\(--green\)" fill-opacity="0.50"/.test(odd.svg) && odd.svg.indexOf('<title>odd: 3</title>') > 0);
  yes('in capitals', C.cloud([{ w: 'whale', n: 1 }], { ink: 'box', caps: true }).svg.indexOf('>WHALE</text>') > 0);
  yes('the figure\'s class, for the kit\'s styles', /^<svg [^>]*class="wc-cloud"/.test(r.svg));
  var m = C.metrics('whale', 40);
  yes('a word measured on the page', m.w > 40 && m.h > 10 && m.ascent > 0);

  T.group('Word cloud: looks and the format control');
  eq('the looks', Object.keys(C.LOOKS), ['classic', 'oval', 'ink', 'poster', 'typewriter', 'heart']);
  eq('no format: the default look', C.format().look, C.DEFAULT);
  eq('a look gives the whole format', C.format({ look: 'poster' }).caps, true);
  eq('a look with a detail set beside it keeps the detail', [C.format({ look: 'oval', upright: 0.5 }).shape, C.format({ look: 'oval', upright: 0.5 }).upright], ['oval', 0.5]);
  eq('details from a link, as text, read as numbers and true or false', [C.format({ upright: '0.5', pad: '8', bold: 'true' }).upright, C.format({ pad: '8' }).pad, C.format({ bold: 'true' }).bold], [0.5, 8, true]);
  eq('a look of the old kind (own) is the default look with its details', [C.format({ look: 'own', shape: 'heart' }).look, C.format({ look: 'own', shape: 'heart' }).shape], [C.DEFAULT, 'heart']);
  eq('brief: the look and only what differs from it', C.brief({ look: 'oval', upright: 0.5, shape: 'oval', font: 'serif' }), { look: 'oval', upright: 0.5 });
  eq('brief of a look as it is: the look alone', C.brief(C.format({ look: 'poster' })), { look: 'poster' });
  eq('a format saved before looks: the default look', C.format({ colour: 'change', shape: 'oval' }).look, 'classic');
  var op = C.options({ look: 'poster' });
  eq('the cloud\'s options from a look', [op.weight, op.caps, op.upright, op.shape, op.contrast], ['bold', true, 0.5, 'rect', 'linear']);
  var col = C.colour([{ w: 'sea', n: 10 }, { w: 'ship', n: 5 }], { look: 'ink' });
  eq('ink: every word in the text colour', col.map(function (x) { return x.fill; }), ['var(--text)', 'var(--text)']);
  var sh = C.colour([{ w: 'sea', n: 10 }, { w: 'ship', n: 1 }], { look: 'own', colour: 'shade', hue: 'var(--green)' });
  yes('shade: the hue, fainter for fewer', sh[0].fill === 'var(--green)' && sh[1].alpha < sh[0].alpha);
  eq('a bench\'s own colouring wins where it gives one', C.colour([{ w: 'sea', n: 1 }, { w: 'ship', n: 1 }], {}, { colour: function (x) { return x.w === 'sea' ? 'var(--red)' : null; } }).map(function (x) { return x.fill.slice(0, 6); }), ['var(--', 'var(--']);
  var got = null, ctl = C.control({ value: { look: 'classic' }, colours: [['change', 'by change']], change: function (f) { got = f; } });
  eq('the control: a Look menu and ⚙', [!!ctl.querySelector('[data-f="look"]'), !!ctl.querySelector('.wc-more summary')], [true, true]);
  yes('the bench\'s colourings first', ctl.querySelector('[data-f="colour"] option').value === 'change');
  var shp = ctl.querySelector('[data-f="shape"]'); shp.value = 'heart'; shp.dispatchEvent(new Event('change', { bubbles: true }));
  eq('a detail changed: the look kept with it, the rest the look\'s', got && [got.look, got.shape, got.font], ['classic', 'heart', 'serif']);
  yes('the look marked as changed', / changed$/.test(ctl.querySelector('[data-f="look"] option:checked').textContent));
  var lk = ctl.querySelector('[data-f="look"]'); lk.value = 'typewriter'; lk.dispatchEvent(new Event('change', { bubbles: true }));
  eq('a look chosen: its format', got && [got.look, got.font, got.shape], ['typewriter', 'mono', 'square']);
})();
