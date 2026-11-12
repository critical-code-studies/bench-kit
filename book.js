/*
 * book.js - Book: a version's text set as a page, from the document the bench's reader makes
 * beside its lines, and the reader's way from one version to another. For a bench whose reader
 * gives b.doc (a version's parts as documents: b.doc[p] = { blocks }), with a button
 * data-tab="book", a section #view-book, 'book' in SW.BENCH.shell.views, kit/book.css, and this
 * file after kit/readnotes.js. A bench without a document never shows the tab.
 *
 * The document (README, Book):
 *   block  { t: head | p | l | lg | ab | note | pb | divider, n0, n1 (the version's lines it
 *            covers), rend, cont (it resumes after a page break), id (a note's), facs and
 *            iiif: { id, v } (a page break's page and its IIIF image service), spans }
 *   span   { s (its text), n (its line; none where the text is not in this version's lines),
 *            c0, c1 (where it is in that line's raw text), marks: [{ k, … }] }
 *   marks  added, erased, reinstated, uncertain, sic, regularised (orig), corrected, restored,
 *          supplied, gap, metamark, hi (rend), ref (note), each with hand and change (a stage)
 *          where the document gives them
 *
 * Moving between versions is the view's own business:
 *   - the texts in a row at the top (SW.BENCH.doc.versions, or every version with files), the
 *     open one first; a version's states (SW.BENCH.doc.states: { source, first, last, label },
 *     the versions that are one document read at different stages) are one text there;
 *   - for that text, a slider through SW.BENCH.doc.stages ([{ id, label, note }], in order):
 *     at a stage an addition is shown and a deletion applied when its change is at or before it,
 *     the deletion a reinstatement encloses comes back at the reinstatement's stage (a deletion
 *     further inside it does not), and a change in
 *     no stage (or one in SW.BENCH.doc.unplaced) counts from the first; 0 is the text before
 *     any revision. stageHands (a list of hands' k) limits the slider to those hands' revisions;
 *     the others are shown only in All revisions, which raises the additions and strikes the
 *     deletions. The revisions come and go as the slider moves; with Strike deletions the
 *     deletions made up to the stage stay, struck through in red, and the revisions made at the
 *     stage itself are marked more strongly;
 *   - Compare: other texts beside the first (up to SW.BENCH.doc.besideMax, 3 if not given), all held
 *     at the same page break (facs) as any is scrolled: Compare with… and + another in the toolbar.
 *     SW.BENCH.doc.beside: [ids], the texts beside the first until the reader or a link chooses (bb);
 *     where the first is one of them, the next of doc.versions takes its place.
 *     With three columns or more, the page images are beside the first column only (a ▣ at each page
 *     break in the others opens one); SW.BENCH.doc.imagesFirst: true does so with two. SW.BENCH.doc.imageSide: 'left' sets each page's image to the
 *     left of its text (image | text | text … for a translation read beside its source).
 * The text is set in sheets, a page to each, the page's image beside it (from the bench's own files
 * where SW.BENCH.doc.image gives one, else the page's IIIF service); a click opens it
 * larger, with its lines, its reference and SW.BENCH.doc.imageCredit (HTML), ◀ ▶ (or ← →) for the
 * page before or after, ✕ to close.
 * Where the document gives the boxes its revisions are written in (doc.zones, each page break's
 * size, a revision mark's zone), the text and the image are joined: a revision under the pointer
 * lights its box on the page, a box on the page goes to its text, and the slider lights the boxes
 * of the revisions made at its stage; the enlarged image has the same boxes, a box under the
 * pointer showing its words and revision by it. A click on a box highlights its text in the panel,
 * until the reader clicks, scrolls, hovers another revision or moves the slider. With Compare, a
 * passage of a text facing a version's states lights its page there, and the boxes of the revisions
 * whose words are mostly in it.
 * The enlarged page zooms and pans (wheel, pinch, + −, drag; 0 for the whole page), its boxes with it.
 * 🔗 Share (in the toolbar, and in the enlarged page's details) copies a link that opens Book as it
 * is set: the version, stage and settings, the place (l), the box clicked (hz), and, from the
 * enlarged page, that page open at its zoom (pz, zm). A page whose text, or part of it, the document
 * transcribes under another (pb.elsewhere: [{ to, note }]) has a link to that page by its rule, and
 * the part of its image below its lowest box leads there.
 * The enlarged page zooms as Paratexts' pictures do (a trackpad's pinch, the wheel, a double-click, −
 * and + with the size shown, Fit and 1:1; from half to forty times the fitted size, moved freely), and
 * where doc.image(pb) gives a sharp image as well as src and large, that is fetched as the page opens
 * and put in when it arrives.
 * Where a page break gives the page's lines (pb.lines: [{ n, box: [x0, y0, x1, y1], measured }], in
 * the page's own pixels, n the line number its spans carry), each line has a band on the image, under
 * the revisions' line-sized boxes and over larger ones (a passage added whole), which are reached where
 * no band covers them and from the text: under the pointer it lights its line in the text, and a click highlights it
 * there, as a box does; the other way, a line of the text under the pointer lights its band on the page beside it,
 * and text selected lights the bands of every line it covers, until the selection is let go; a band whose place is estimated (measured false) is drawn with a dashed edge,
 * and the enlarged page's details say so. pb.folio and pb.seq (an archive's folio, a sequence number)
 * are shown beside the page's name in those details (SW.BENCH.doc.folioWord names the folio).
 * Where the bench gives the places of each page's passages (SW.BENCH.doc.regions: 'regions.json' for every
 * page, or 'regions/{page}.json', a file to each page fetched as it is wanted), the text and the image are joined
 * passage by passage, for a text whose lines are not the page's (a translation beside its source):
 *   { pages: { facs: { size: [w, h], regions: [{ boxes: [[x0, y0, x1, y1], …], text, quote, est }] } } }
 * (a page's own file: { size, regions }). boxes: where the passage is on the image, in the page's own pixels
 * (size), a box to each column or line it runs over; text: the source's words there; quote: the words of the text
 * shown that the place holds, one string for every version or { version id: string }; with no quote, text is
 * looked for (a transcription's own words); est: the place or the match is estimated (a dashed edge).
 * A quote is looked for in the page's text and the pages before and after (a passage may cross the turn), in the
 * file's order, whitespace and * passed over; one not found leaves its place drawn and untied. The file is made
 * once for a source whose pages do not change; a quote follows the text when it is edited elsewhere.
 * A passage under the pointer lights its place on the page, and a place its passage; a click on either holds
 * both, until the next click; text selected lights every place it runs over. SW.book.regionsReport() counts the
 * places of the pages read so far and lists those not found in the text.
 * While a passage's highlight link is held, ✦ Share highlight in the toolbar makes a picture to send: the page with the
 * place drawn on it, the passage, its citation, the page's name and the image's credit (doc.imageCreditShort), with,
 * in this order, Copy link (a link that opens Book with the same highlight held; hr: the page, the place and the first
 * of its words), Email… (the picture and the passage handed to the system's sharing where the browser can pass a
 * file; elsewhere the passage, the citation and the link in a new message, the picture on the clipboard to paste
 * in), Download PNG and Copy PNG. 🔗 Share page is the link to Book as set.
 * SW.BENCH.doc.shareCite gives the citation sent with a highlight in the bench's own words, in place of the reference
 * by file and line: a text with {page} (the page's name), {version} and {label} in it, or a function of
 * { page, version, label, cite } that returns one (nothing, to keep the reference).
 * These are Book's highlight links: a line, a box or a passage lit on the page, and its words in the text. Their
 * colour is the theme's, or the bench's (SW.BENCH.doc.linkColor: a CSS colour), or the reader's own (Settings ▸
 * Book, kept in this browser as book.link); the reader can also turn them off there (book.linkOff), and the
 * page's image is then a picture only.
 * The pages' edges can be trimmed (a scan's colour card and ruler): the reader's in Settings ▸ Book,
 * dragged on a page there, or the bench's (SW.BENCH.doc.trim: { l, t, r, b }, each a share of the
 * page's width or height, or a function (pb) giving each page its own, or null); beside the text and in
 * the enlarged page, the boxes and bands with them.
 * Images: a slider for their size, and an eye to fold them away (a ▣ at each page break opens one),
 * for every column, kept for this browser and in the address as img (off, or a width).
 * The state rides in the address: v, tab=book, stage (an id, or 0), all=1, del=strike, bb (the texts beside, by commas),
 * img, l (the place), hz, pz and zm (a shared link's box, page and zoom). A selection maps back to the version's lines (p, n0, n1, and c0, c1 within
 * them), so an annotation made here is the same as one made in Read; the group's annotations are
 * marked on their lines. A state of the text is annotated on the source version's lines.
 * kit/edition.js typesets a version from its document, raising the additions and striking the
 * deletions in a diplomatic version (doc.diplomatic: [ids], or the source of doc.states).
 * Words from SW.BENCH.doc.words: { page ('page': what a page break divides), states, all }; mark
 * names from SW.BENCH.doc.labels; the hand named by mainHand is not named in a revision's note.
 * The pure parts are SW.book (shownAt, selection, join), for tests and for kit/edition.js.
 * Part of bench-kit (github.com/critical-code-studies/bench-kit).
 */
(function (root) {
  'use strict';
  var SW = root.SW, B = SW.BENCH || {}, D = B.doc || {};
  var K = SW.book = {};
  // Book at a version's lines, and at a stage of its revision where it has stages: from another view
  // (a topic's documents, say). Where the bench has no Book, Read at the lines.
  K.openAt = function (vid, a) { SW.openAt(vid, a); };

  // ---------- the pure parts ----------
  // a stage's place in the list (1 for the first); a change in no stage counts from the first
  K.stageMap = function (stages) { var m = {}; (stages || []).forEach(function (s, i) { m[s.id || s] = i + 1; }); return m; };
  // whether a span is in the text at stage s (0: before any revision), its marks read outermost first
  K.shownAt = function (marks, s, at, hands) {
    function counts(m) { return !hands || !m.hand || hands.indexOf(m.hand) >= 0; }
    function st(m) { return m.change && at[m.change] ? at[m.change] : 1; }
    for (var i = 0; i < marks.length; i++) {
      var m = marks[i];
      if (m.k === 'added') { if (!counts(m) || s === 0 || st(m) > s) return false; }
      else if (m.k === 'erased' && s > 0 && counts(m) && st(m) <= s) {
        var back = false;
        // a reinstatement brings back the deletion it encloses, not a deletion further inside that one
        for (var j = i - 1; j >= 0 && marks[j].k !== 'erased'; j--) if (marks[j].k === 'reinstated' && counts(marks[j]) && st(marks[j]) <= s) back = true;
        if (!back) return false;
      }
    }
    return true;
  };
  // with deletions struck rather than taken out: a span is in the text when its additions are, and
  // struck when, at that stage, it would otherwise be taken out
  function noDel(m) { return m.k !== 'erased' && m.k !== 'reinstated'; }
  K.struckAt = function (marks, s, at, hands) {
    var inText = K.shownAt(marks.filter(noDel), s, at, hands);
    return { on: inText, struck: inText && !K.shownAt(marks, s, at, hands) };
  };
  // whether a revision in the span was made at stage s itself (by the hands the slider follows)
  K.madeAt = function (marks, s, at, hands) {
    return s > 0 && marks.some(function (m) {
      return (m.k === 'added' || m.k === 'erased' || m.k === 'reinstated') && (!hands || !m.hand || hands.indexOf(m.hand) >= 0) && m.change && at[m.change] === s;
    });
  };
  // a text made ready to be looked for or in: whitespace and * (a mark of emphasis) taken out
  K.squash = function (s) { return String(s == null ? '' : s).normalize('NFC').replace(/[\s*\u200b]+/g, ''); };
  // where a quote lies in a text (both squashed): the first place at or after from that reaches past lo and
  // begins before hi (the part of the text that is the page's own), as [start, end], or null
  K.findQuote = function (hay, q, from, lo, hi) {
    if (!q) return null;
    var i = hay.indexOf(q, Math.max(0, from || 0));
    while (i >= 0) {
      if (hi != null && i >= hi) return null;
      if (lo == null || i + q.length > lo) return [i, i + q.length];
      i = hay.indexOf(q, i + 1);
    }
    return null;
  };
  // the citation sent with a highlight: the bench's wording where it gives one (doc.shareCite: a function of
  // { page, version, label, cite }, or a text with {page}, {version} and {label} in it), else the reference made
  // from the file and its lines (o.cite); * (a mark of emphasis) is taken out, the picture and an email being plain
  K.shareCite = function (how, o) {
    var t = null;
    if (typeof how === 'function') { try { t = how(o); } catch (e) { t = null; } }
    else if (typeof how === 'string') t = how.replace(/\{(page|version|label)\}/g, function (_, k) { return o[k] == null ? '' : o[k]; });
    return t == null || t === '' ? (o.cite || '') : String(t).replace(/\*/g, '');
  };
  // a selection from one span to another as the lines it covers: start and end are
  // { n, c0, c1, off } (off: characters into the span, or null for the span's start or end)
  K.selection = function (a, b) {
    if (!a || !b || a.n == null || b.n == null) return null;
    var c0 = (a.c0 || 0) + (a.off == null ? 0 : a.off), c1 = b.off == null ? b.c1 : (b.c0 || 0) + b.off;
    if (a.n > b.n || (a.n === b.n && c0 > c1)) { var t = a; a = b; b = t; var tc = c0; c0 = c1; c1 = tc; }
    return { n0: a.n, n1: b.n, c0: c0, c1: c1 };
  };
  // a space between two spans of a block: where they are on different lines, neither side has
  // one, and the first does not end in a hyphen (a word divided at the line's end)
  K.join = function (prev, sp, prevN) {
    return prev != null && sp.n != null && prevN != null && sp.n !== prevN && !/[\s\-­]$/.test(prev) && !/^\s/.test(sp.s);
  };

  var view = SW.$('#view-book');
  if (!view || !SW.views) return;
  var V = root.SWVersions, N = SW.notes, esc = SW.esc;
  var STATES = D.states || null, STAGES = D.stages || [], AT = K.stageMap(STAGES), HANDS = {};
  (B.hands || []).forEach(function (h) { HANDS[h.k] = h; });
  var W = D.words || {}, PAGE = W.page || 'page';
  var NAME = Object.assign({ added: 'Added', erased: 'Deleted', reinstated: 'Deleted and reinstated', uncertain: 'Uncertain reading', sic: 'So in the source',
    regularised: 'Regularised', corrected: 'Corrected', restored: 'Restored by the editor', supplied: 'Supplied', gap: 'Gap', metamark: 'A note in the source' }, D.labels || {});
  var CLS = { added: 'bk-add', erased: 'bk-del', reinstated: 'bk-stet', uncertain: 'bk-unc', sic: 'bk-sic', regularised: 'bk-reg', corrected: 'bk-cor',
    restored: 'bk-res', supplied: 'bk-supp', gap: 'bk-gap', metamark: 'bk-meta', ref: 'bk-ref' };

  // the places of each page's passages (doc.regions): the file's address, or none
  var RG = D.regions ? (typeof D.regions === 'string' ? D.regions : D.regions.url) || null : null;
  // the highlight links between the text and the page: on unless the reader has turned them off (Settings ▸ Book), in the
  // reader's colour, else the bench's (doc.linkColor), else the theme's
  function linkOn() { return !SW.store.get('book.linkOff', false); }
  function hasBoxes(pg) { return linkOn() && !!(pg.zoneN || pg.lines || pg.regions); }
  function linkColor() { var own = SW.store.get('book.link', null); return (/^#[0-9a-f]{6}$/i.test(own || '') ? own : '') || D.linkColor || ''; }
  function paintLink() { var c = linkColor(), e = document.documentElement; if (c) e.style.setProperty('--bk-link', c); else e.style.removeProperty('--bk-link'); }
  paintLink();
  // the address as the page was opened, read before the shell rewrites it
  var Q0 = SW.readQuery();
  var BESIDE = Math.max(1, +D.besideMax || 3);   // the most texts beside the first
  var st = { stage: STAGES.length, all: false, hands: true, play: null, beside: String(Q0.bb || '').split(',').filter(Boolean), besideSet: Q0.bb != null, first: true, own: false };
  if (Q0.stage != null && Q0.stage !== '') st.stage = Q0.stage === '0' ? 0 : (AT[Q0.stage] || STAGES.length);
  if (Q0.all === '1') st.all = true;
  // deletions struck in red at the stage, not taken out (Strike deletions): kept for this browser, and in a link as del=strike
  st.strike = Q0.del === 'strike' || (Q0.del == null && SW.store.get('book.del', '') === 'strike');
  // the pages' images: a width (a slider), and on or off (the eye folds them away, leaving a ▣ at each
  // page break, and On brings them back at the width they had); kept for this browser, and in a link
  // that asks for it (img=off, or img=a width)
  var IMGW = [100, 560], IMGW0 = 320;
  function imgw(x) { x = Math.round(+x); return x >= IMGW[0] && x <= IMGW[1] ? x : null; }
  st.imgW = imgw(SW.store.get('book.imgw', IMGW0)) || IMGW0;
  st.imgOn = true;   // shown when a page opens, unless a link says otherwise
  // the button that folds the images away: an open eye while they show, a crossed one when they do not
  var EYE = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M1.5 12S5.5 5 12 5s10.5 7 10.5 7-4 7-10.5 7S1.5 12 1.5 12z"/><circle cx="12" cy="12" r="3"/></svg>';
  var EYEOFF = EYE.replace('</svg>', '<path d="M3 3l18 18"/></svg>');
  function imgBtn(b) { b.innerHTML = st.imgOn ? EYE : EYEOFF; b.title = st.imgOn ? 'Hide the images' : 'Show the images'; b.setAttribute('aria-label', b.title); }
  if (Q0.img === 'off') st.imgOn = false;
  else if (Q0.img === 'small') { st.imgOn = true; st.imgW = 150; }   // a link from 0.72
  else if (imgw(Q0.img)) { st.imgOn = true; st.imgW = imgw(Q0.img); }
  function showImages() {
    view.classList.toggle('bk-noimg', !st.imgOn);
    view.classList.toggle('bk-imgleft', D.imageSide === 'left');
    view.style.setProperty('--bk-imgw', st.imgW + 'px');
    (cols || []).forEach(function (c) { c.stale = true; });
  }
  var cols = [], place = null, pending = null, shared = (Q0.pz || Q0.hz || Q0.hr) ? { pz: Q0.pz, zm: Q0.zm, hz: Q0.hz, hr: Q0.hr } : null;
  showImages();   // place: in the first column's lines; pending: a link's, until it is set

  function inStates(vid) { return !!STATES && [STATES.source, STATES.first, STATES.last].indexOf(vid) >= 0; }
  function textOf(vid) { return inStates(vid) ? STATES.source : vid; }
  function textLabel(vid) { if (inStates(vid)) return STATES.label || 'States'; var v = V.byId(vid); return v ? v.label : vid; }
  // the texts Book offers: the bench's list, or every version held; a version's states as one
  function texts() {
    var ids = D.versions || V.VERSIONS.filter(function (v) { return v.build; }).sort(function (a, b) { return a.sort - b.sort; }).map(function (v) { return v.id; });
    var out = [];
    ids.forEach(function (id) { var t = textOf(id); if (out.indexOf(t) < 0) out.push(t); });
    return out;
  }
  function stageName(s) {
    if (st.all) return W.all || 'All revisions';
    if (s === 0) return 'Before revision';
    var x = STAGES[s - 1] || {};
    return (x.label || x.id || '') + (s === STAGES.length ? ' (the last)' : '') + ' · ' + s + ' of ' + STAGES.length;
  }
  function changeName(c) {
    if (!c) return '';
    if (AT[c]) { var x = STAGES[AT[c] - 1]; return (x.label || c); }
    return 'not yet placed (' + ((D.unplaced || {})[c] || c) + ')';
  }
  function describe(marks) {
    return marks.map(function (m) {
      if (m.k === 'regularised') return NAME.regularised + (m.orig ? ': the source reads “' + m.orig + '”' : '');
      if (!NAME[m.k]) return '';
      var who = m.hand && m.hand !== D.mainHand && HANDS[m.hand] ? 'by ' + HANDS[m.hand].who : '';
      return [NAME[m.k], who, changeName(m.change)].filter(Boolean).join(', ');
    }).filter(Boolean).join('; ');
  }

  // ---------- setting a document ----------
  function notesOf(doc) {
    var out = {};
    doc.blocks.forEach(function (bl) { if (bl.t === 'note') out[bl.id] = bl.spans.map(function (s) { return s.s; }).join('').trim(); });
    return out;
  }
  // a page's image from the bench's own files: SW.BENCH.doc.image(pb) gives a URL (the image beside the
  // text), or { src, large } (large for the enlarged view), or nothing to use the page's IIIF service
  function ownImage(bl) {
    var x = D.image ? D.image(bl) : null;
    return !x ? null : typeof x === 'string' ? { src: x } : x.src ? x : null;
  }
  // a IIIF image: the service's whole image, or one fitted to a width (w) or a box (w by h)
  function iiifURL(x, w, h) { return x.id + '/full/' + (w && h ? '!' + w + ',' + h : w ? w + ',' : x.v === 2 ? 'full' : 'max') + '/0/default.jpg'; }
  // a page break: a rule with the page's name in the text, and the page's image beside it
  function pageBreak(bl, p) {
    var d = SW.el('div', { class: 'bk-pb', 'data-facs': bl.facs || '', 'data-p': p, 'data-n': bl.n0 == null ? '' : bl.n0 });
    d.appendChild(SW.el('span', { class: 'bk-pb-n' }, bl.facs || PAGE));
    return d;
  }
  function figure(pg, col) {
    var f = SW.el('figure', { class: 'bk-fig' });
    var btn = SW.el('button', { class: 'bk-fig-b', title: 'The ' + PAGE + ' ' + (pg.facs || '') + ': click to see it larger, with its details' + (pg.zoneN || pg.lines || RG ? '; a box or a line on it: highlight this in panel' : '') });
    var img = SW.el('img', { src: pg.img ? pg.img.src : iiifURL(pg.iiif, 400), alt: PAGE + ' ' + (pg.facs || ''), loading: 'lazy' });
    btn.appendChild(img);
    pg.figBtn = btn; pg.figImg = img;
    var T0 = trim(pg); if (T0) withShape(pg, img, function (ar) { cropIn(img, T0, ar); });
    if (pg.facs) { pg.markBox = SW.el('div', { class: 'bk-mkbox' }); pg.markBox.innerHTML = markHTML(pg.facs); btn.appendChild(pg.markBox); fitMark(img, pg.markBox); }
    // the picture is fetched as it comes near the view (loading: lazy), and the places of its passages with it,
    // so the first passage pointed at is lit without a wait
    img.addEventListener('load', function () { if (pg.layer) fitZones(pg); fitMark(img, pg.markBox); if (RG && linkOn()) rgNeed(col, col.pages.indexOf(pg)); });
    // the revisions' boxes, drawn when the pointer comes onto the image
    btn.addEventListener('pointerenter', function () { if (RG) rgNeed(col, col.pages.indexOf(pg)); if (hasBoxes(pg)) { zoneLayer(pg, col); fitZones(pg); } });
    btn.onclick = function (e) {
      var mk = e.target.closest('.bk-mk');
      if (mk) { e.preventDefault(); setMark(pg.facs, !marked(pg.facs)); return; }
      var z = e.target.closest('.bk-z');
      if (z) { e.preventDefault(); toText(col, pg, z.dataset.z); return; }
      var lb = e.target.closest('.bk-band');
      if (lb) { e.preventDefault(); toLine(col, pg, +lb.dataset.ln); return; }
      var rb = e.target.closest('.bk-rg');
      if (rb) { e.preventDefault(); toRegion(col, pg, +rb.dataset.rg); return; }
      var ew = e.target.closest('.bk-else');
      if (ew) { e.preventDefault(); goElsewhere(col, ew.dataset.to); return; }
      pageBox(col, col.pages.indexOf(pg));
    };
    f.appendChild(btn);
    f.appendChild(SW.el('figcaption', {}, pg.facs || ''));
    return f;
  }
  // ---------- the text and the page's image joined: each revision's box on the page ----------
  // The document gives the boxes (doc.zones: { id: [ulx, uly, lrx, lry] }) in the page's own pixel
  // space (the page break's size: [w, h]), and a revision's marks name the box it is written in
  // (zone). A box is placed by its share of that space over the picture as it is drawn (object-fit:
  // contain), so the image's own size need not match. A zone the document does not define is passed over.
  // the boxes of a page as a layer: link, whether a box under the pointer lights the text written in it
  function makeZones(pg, link) {
    var L = SW.el('div', { class: 'bk-zl' }), sz = pg.size || pg.rsize, w = sz[0], h = sz[1], zdiv = {}, ldiv = {}, rdiv = [];
    // the places of the page's passages (doc.regions), beneath the lines and the revisions' boxes
    (pg.regions || []).forEach(function (r, k) {
      var rw = pg.rsize[0], rh = pg.rsize[1];
      rdiv[k] = r.boxes.map(function (b0) {
        // kept within the page, whatever the file gives
        var b = [Math.max(0, Math.min(b0[0], b0[2])), Math.max(0, Math.min(b0[1], b0[3])), Math.min(rw, Math.max(b0[0], b0[2])), Math.min(rh, Math.max(b0[1], b0[3]))];
        var d = SW.el('div', { class: 'bk-rg' + (r.est ? ' bk-rg-est' : ''), 'data-rg': k, title: link ? 'Highlight this in panel' : '' });
        d.style.left = (100 * b[0] / rw) + '%'; d.style.top = (100 * b[1] / rh) + '%';
        d.style.width = (100 * (b[2] - b[0]) / rw) + '%'; d.style.height = (100 * (b[3] - b[1]) / rh) + '%';
        if (link) {
          d.addEventListener('pointerenter', function () { rgHover([{ pg: pg, k: k }]); });
          d.addEventListener('pointerleave', function () { rgHover(null); });
        }
        L.appendChild(d);
        return d;
      });
    });
    // the page's lines (pb.lines), as bands under the revisions' boxes
    (pg.lines || []).forEach(function (ln) {
      var b0 = ln.box, b = [Math.min(b0[0], b0[2]), Math.min(b0[1], b0[3]), Math.max(b0[0], b0[2]), Math.max(b0[1], b0[3])];
      var d = SW.el('div', { class: 'bk-band' + (ln.measured ? '' : ' bk-band-est'), 'data-ln': ln.n, title: link ? 'Line ' + ln.n + ': highlight this in panel' : '' });
      d.style.left = (100 * b[0] / w) + '%'; d.style.top = (100 * b[1] / h) + '%';
      d.style.width = (100 * (b[2] - b[0]) / w) + '%'; d.style.height = (100 * (b[3] - b[1]) / h) + '%';
      if (link) {
        d.addEventListener('pointerenter', function () { lineSpans(pg, ln.n).forEach(function (e) { e.classList.add('bk-zlink'); }); });
        d.addEventListener('pointerleave', function () { lineSpans(pg, ln.n).forEach(function (e) { e.classList.remove('bk-zlink'); }); });
      }
      ldiv[ln.n] = d; L.appendChild(d);
    });
    // a revision's box larger than a line (taller than twice the bands' usual height, or 7% of the
    // page: a passage added whole, a paste-on) lies beneath the bands, reached where no band covers it
    // and from the text; a line-sized box stays above them
    var hs = (pg.lines || []).map(function (ln) { return Math.abs(ln.box[3] - ln.box[1]); }).sort(function (a, b) { return a - b; });
    var bigH = hs.length ? Math.min(2 * hs[Math.floor(hs.length / 2)], 0.07 * h) : Infinity;
    Object.keys(pg.zones).forEach(function (id) {
      // the corners in order (a document may give them either way round)
      var b0 = pg.zones[id].box, b = [Math.min(b0[0], b0[2]), Math.min(b0[1], b0[3]), Math.max(b0[0], b0[2]), Math.max(b0[1], b0[3])];
      var d = SW.el('div', { class: 'bk-z' + (b[3] - b[1] > bigH ? ' bk-zbig' : ''), 'data-z': id, title: link ? 'Highlight this in panel' : '' });
      d.style.left = (100 * b[0] / w) + '%'; d.style.top = (100 * b[1] / h) + '%';
      d.style.width = (100 * (b[2] - b[0]) / w) + '%'; d.style.height = (100 * (b[3] - b[1]) / h) + '%';
      // the text written in the box lit while the pointer is on it
      if (link) {
        d.addEventListener('pointerenter', function () { pg.zones[id].spans.forEach(function (e) { e.classList.add('bk-zlink'); }); });
        d.addEventListener('pointerleave', function () { pg.zones[id].spans.forEach(function (e) { e.classList.remove('bk-zlink'); }); });
      }
      zdiv[id] = d; L.appendChild(d);
    });
    var zids = Object.keys(pg.zones), lowest = Math.max.apply(null, zids.map(function (id) { var b = pg.zones[id].box; return Math.max(b[1], b[3]); }));
    if (pg.elsewhere && pg.elsewhere.length && zids.length && 1 - lowest / h > 0.1) {
      var ew = pg.elsewhere[0], r = SW.el('div', { class: 'bk-else', 'data-to': ew.to, title: (ew.note ? ew.note + ' ' : '') + '(' + ew.to + ')' });
      r.style.top = (100 * lowest / h + 1) + '%'; r.style.height = (99 - 100 * lowest / h) + '%';
      L.appendChild(r);
    }
    return { L: L, zdiv: zdiv, ldiv: ldiv, rdiv: rdiv };
  }
  // the text of a line of the page (pb.lines' n), and its spans highlighted as a box's are
  function lineSpans(pg, n) { return ((pg.col && pg.col.byLine[pg.p + ':' + n]) || []).filter(function (e) { return e.classList.contains('bk-s'); }); }
  function lineTip(pg, ln) {
    var t = lineSpans(pg, ln.n).filter(function (e) { return !e.classList.contains('bk-gone'); }).map(function (e) { return e.textContent; }).join(' ').replace(/\s+/g, ' ').trim();
    return '<div class="bk-ztip-w">' + (t ? '“' + esc(t.length > 180 ? t.slice(0, 180) + '…' : t) + '”' : '<i>nothing of this line at this stage</i>') + '</div><div>Line ' + esc(String(ln.n)) +
      (ln.measured ? '' : ', its place estimated from the revision boxes') + '</div><div class="bk-ztip-h">Click: highlight this in panel</div>';
  }
  function toLine(col, pg, n) {
    var marks = lineSpans(pg, n).filter(function (e) { return !e.classList.contains('bk-gone') && !e.closest('[hidden]'); });
    if (!marks.length) { SW.toast('Line ' + n + ' is not in the text at this stage' + (col.states && !st.all ? ': ' + (W.all || 'All revisions') + ' shows it.' : '.'), 4000); return; }
    hold(col, marks);
  }
  function zoneLayer(pg) {
    if (pg.layer || !pg.figBtn || !(pg.size || pg.rsize) || !linkOn()) return pg.layer || null;
    var Z = makeZones(pg, true);
    pg.zdiv = Z.zdiv; pg.ldiv = Z.ldiv; pg.rdiv = Z.rdiv;
    pg.figBtn.appendChild(Z.L);
    pg.layer = Z.L;
    return Z.L;
  }
  function fitZones(pg) { fitLayer(pg.figImg, pg.layer); }
  // what a box holds: the words written there, what the revision is (and what it replaced, or what
  // replaced it), its stage and its hand
  function zoneTip(pg, id) {
    var z = pg.zones[id], n = 0;
    // the words, a deletion struck through
    var words = z.spans.map(function (e) {
      var t = e.textContent.replace(/\s+/g, ' '); if (n > 180) return ''; n += t.length;
      return e.classList.contains('bk-del') ? '<s>' + esc(t) + '</s>' : esc(t);
    }).join(' ').trim() + (n > 180 ? '…' : '');
    var what = [], seen = {}, hasAdd = z.marks.some(function (m) { return m.k === 'added'; }), hasDel = z.marks.some(function (m) { return m.k === 'erased'; });
    z.marks.forEach(function (m) { var t = describe([m]); if (t && !seen[t]) { seen[t] = 1; what.push(t); } });
    z.subst.forEach(function (sid) {
      var sb = (pg.subst || {})[sid]; if (!sb) return;
      var E = sb.erased.join(' ').trim(), A = sb.added.join(' ').trim();
      if (hasAdd && hasDel && E && A) what.push('“' + E + '” replaced by “' + A + '”');
      else if (hasAdd && E) what.push('replacing “' + E + '”');
      else if (hasDel && A) what.push('replaced by “' + A + '”');
    });
    return '<div class="bk-ztip-w">“' + words + '”</div>' + what.map(function (t) { return '<div>' + esc(t) + '</div>'; }).join('') + '<div class="bk-ztip-h">Click: highlight this in panel</div>';
  }
  // ---------- bookmarks: a page marked by the reader, a red bookmark at its top right ----------
  // Kept in this browser (book.marks: { facs: when }, which Back up my data saves), the same page in
  // every text; set on the page beside the text, in the enlarged page, or with b there
  function marks() { return SW.store.get('book.marks', {}) || {}; }
  function marked(facs) { return !!(facs && marks()[facs]); }
  function setMark(facs, on) {
    var m = marks(); if (on) m[facs] = new Date().toISOString(); else delete m[facs];
    SW.store.set('book.marks', m); SW.emit('book-marks', facs);
  }
  function markTitle(facs) { return marked(facs) ? 'Bookmarked: click to take the bookmark off (b)' : 'Bookmark this ' + PAGE + ', kept in this browser; Bookmarks in the toolbar goes to it (b)'; }
  function markHTML(facs) { return '<span class="bk-mk' + (marked(facs) ? ' on' : '') + '" data-mark="' + esc(facs) + '" title="' + (marked(facs) ? 'Bookmarked: click to take the bookmark off' : 'Bookmark this ' + esc(PAGE)) + '"></span>'; }
  // the bookmark's box: over the picture as drawn, or the whole of a trimmed one
  function fitMark(img, M) {
    if (!img || !M) return;
    if (img.classList.contains('bk-cropped')) {
      if (M.parentNode !== img.parentNode) img.parentNode.appendChild(M);
      M.style.left = M.style.top = '0'; M.style.width = M.style.height = '100%';
    } else fitLayer(img, M);
  }
  // every bookmark shown, and the enlarged page's, as the marks now are
  SW.on('book-marks', function () {
    SW.$$('.bk-mk[data-mark]').forEach(function (e) { var on = marked(e.dataset.mark); e.classList.toggle('on', on); e.title = on ? 'Bookmarked: click to take the bookmark off' : 'Bookmark this ' + PAGE; });
    SW.$$('[data-markbtn]').forEach(function (b) { var on = marked(b.dataset.markbtn); b.title = markTitle(b.dataset.markbtn); b.setAttribute('aria-pressed', String(on)); b.classList.toggle('on', on); });
  });
  // a page's rating, one to three stars, as Paratexts' and the findings': a reaction ★1..★3 that answers
  // no annotation, tagged with the page (page:<facs>), signed and shared with the group's annotations
  // (or a draft in this browser), one to each reader; the same star again takes it back
  var RATE = /^★([123])(\s|$)/, rated = null;
  function pageRates(again) {
    if (!N || !N.listAll) return Promise.resolve([]);
    if (!rated || again) rated = N.listAll({ reactions: true }).then(function (all) {
      return all.filter(function (n) { return N.isReaction(n) && !n.parent && RATE.test(n.text) && (n.tags || []).some(function (g) { return /^page:/.test(g); }); });
    }, function () { return []; });
    return rated;
  }
  function ratingOf(rs, facs) {
    rs = rs.filter(function (r) { return (r.tags || []).indexOf('page:' + facs) >= 0; });
    var mine = rs.filter(function (r) { return N.myReaction(r); });
    return { n: rs.length, avg: rs.length ? rs.reduce(function (a, r) { return a + +RATE.exec(r.text)[1]; }, 0) / rs.length : 0,
             mine: mine.length ? +RATE.exec(mine[0].text)[1] : 0, mineR: mine, who: rs.map(function (r) { return r.by + ' ' + RATE.exec(r.text)[0].trim(); }) };
  }
  function rateHTML(R) {
    return '<span class="fd-rate" title="Your rating of this ' + esc(PAGE) + ', one to three stars (again to take it back); the group’s average beside it">' +
      [1, 2, 3].map(function (k) { return '<button type="button" data-prate="' + k + '" class="' + (R.mine >= k ? 'on' : '') + '">★</button>'; }).join('') +
      (R.n ? ' <span class="hint" title="' + esc(R.who.join('; ')) + '">' + (Math.round(R.avg * 10) / 10) + ' from ' + R.n + '</span>' : '') + '</span>';
  }
  function ratePage(facs, vid, k) {
    return pageRates().then(function (rs) {
      var R = ratingOf(rs, facs);
      return R.mineR.reduce(function (p, r) { return p.then(function () { return N.remove(r, true); }); }, Promise.resolve())
        .then(function () { return R.mine === k ? null : N.create({ vid: vid, kind: 'reaction', text: '★' + k, tags: ['page:' + facs], quiet: true }); });
    }).then(function () { return pageRates(true); });
  }
  // the pages' edges trimmed, each side a share of the page, at most 40%: the reader's own (Settings ▸
  // Book), the same for every page, or the bench's (doc.trim: one for every page, or a function of the
  // page break giving each its own); null where nothing is trimmed
  function sides(t) {
    if (!t) return null;
    var c = function (x) { return Math.max(0, Math.min(0.4, +x || 0)); }, o = { l: c(t.l), t: c(t.t), r: c(t.r), b: c(t.b) };
    return o.l || o.t || o.r || o.b ? o : null;
  }
  function benchTrim(pg) { return sides(typeof D.trim === 'function' ? (pg ? D.trim(pg.pb || pg) : null) : D.trim); }
  function trim(pg) { var own = SW.store.get('book.trim', null); return own ? sides(own) : benchTrim(pg); }
  K.trim = trim;
  // the page's width over its height, from its size or from the image when it has come
  function withShape(pg, img, fn) {
    if (pg.size) return fn(pg.size[0] / pg.size[1]);
    if (img.complete && img.naturalWidth) return fn(img.naturalWidth / img.naturalHeight);
    img.addEventListener('load', function () { fn(img.naturalWidth / img.naturalHeight); }, { once: true });
  }
  // a picture trimmed: the image in a box of the kept part's shape (.bk-crop), drawn larger and moved
  // so that part fills it; the boxes' layer goes with the image (fitLayer)
  function cropIn(img, T, ar) {
    var w = 1 - T.l - T.r, h = 1 - T.t - T.b, cr = img.parentNode.classList.contains('bk-crop') ? img.parentNode : null;
    if (!cr) { cr = SW.el('div', { class: 'bk-crop' }); img.parentNode.insertBefore(cr, img); cr.appendChild(img); }
    cr.style.aspectRatio = String(ar * w / h);
    img.classList.add('bk-cropped');
    img.style.width = (100 / w) + '%'; img.style.height = (100 / h) + '%';
    img.style.left = (-100 * T.l / w) + '%'; img.style.top = (-100 * T.t / h) + '%';
    return cr;
  }
  K.cropIn = cropIn;
  function cropOut(img) {
    var cr = img.parentNode; if (!cr.classList.contains('bk-crop')) return;
    cr.parentNode.insertBefore(img, cr); cr.remove();
    img.classList.remove('bk-cropped'); ['width', 'height', 'left', 'top'].forEach(function (k) { img.style[k] = ''; });
  }
  K.cropOut = cropOut;
  // the pictures beside the text trimmed as now set; a layer of boxes is made again when next wanted
  function trimFigs() {
    cols.forEach(function (c) {
      (c.pages || []).forEach(function (pg) {
        if (!pg.figImg) return;
        var T = trim(pg);
        if (pg.layer) { pg.layer.remove(); pg.layer = null; pg.zdiv = null; pg.ldiv = null; pg.rdiv = null; }
        if (T) withShape(pg, pg.figImg, function (ar) { cropIn(pg.figImg, T, ar); }); else cropOut(pg.figImg);
        if (pg.markBox) { if (!pg.markBox.isConnected) pg.figBtn.appendChild(pg.markBox); fitMark(pg.figImg, pg.markBox); }
      });
    });
  }
  SW.on('book-trim', trimFigs);
  // a layer laid over the picture as it is drawn in its image (object-fit: contain), or over the image
  // as placed in a trimmed picture
  function fitLayer(img, L) {
    if (img && L && img.classList.contains('bk-cropped')) {
      if (L.parentNode !== img.parentNode) img.parentNode.appendChild(L);
      ['left', 'top', 'width', 'height'].forEach(function (k) { L.style[k] = img.style[k]; });
      return;
    }
    if (!img || !L || !img.naturalWidth || !img.clientWidth) return;
    var W = img.clientWidth, H = img.clientHeight, s = Math.min(W / img.naturalWidth, H / img.naturalHeight), cw = img.naturalWidth * s, ch = img.naturalHeight * s;
    L.style.left = (img.offsetLeft + (W - cw) / 2) + 'px'; L.style.top = (img.offsetTop + (H - ch) / 2) + 'px';
    L.style.width = cw + 'px'; L.style.height = ch + 'px';
  }
  // a page's bands (pb.lines) for these lines lit or put out, the layer drawn first if need be
  function lightLines(pg, ns, cls, on) {
    if (!pg || !pg.lines) return;
    if (on) { zoneLayer(pg); fitZones(pg); }
    if (!pg.ldiv) return;
    ns.forEach(function (n) { if (pg.ldiv[n]) pg.ldiv[n].classList.toggle(cls, on); });
  }
  function lightZones(pg, ids, cls, on) {
    if (!pg || !pg.zoneN) return;
    if (on) { zoneLayer(pg); fitZones(pg); }
    if (!pg.zdiv) return;
    ids.forEach(function (id) { if (pg.zdiv[id]) pg.zdiv[id].classList.toggle(cls, on); });
  }
  // the text a box was clicked for stays highlighted until the reader does something else: another
  // click, scrolling the text, a hover on another revision, moving the slider
  var held = [], heldAt = 0, heldZone = null;   // heldZone: the box clicked, for a link to this place
  function clearHeld() { held.forEach(function (e) { e.classList.remove('bk-held'); }); held = []; heldZone = null; }
  function hold(col, marks) {
    col.moved = false;
    col.el.scrollTop = Math.max(0, marks[0].offsetTop - READ);
    clearHeld();
    marks.forEach(function (e) { e.classList.add('bk-held'); });
    held = marks; heldAt = Date.now();
  }
  view.addEventListener('click', function (e) { if (held.length && Date.now() - heldAt > 300 && !(e.target.closest && e.target.closest('#bk-share'))) clearHeld(); }, true);   // Share keeps it, to link to it
  // a box on the page: to the text written in it, highlighted until the reader does something else
  function toText(col, pg, id) {
    var z = pg.zones[id]; if (!z) return;
    // its text as it stands at this stage, or, where that is taken out here, the passage it was in
    var shown = z.spans.filter(function (e) { return !e.classList.contains('bk-gone') && !e.closest('[hidden]'); });
    var marks = shown.length ? shown : [z.spans[0] && z.spans[0].closest('p, h3, .bk-lg')].filter(function (e) { return e && !e.hidden; });
    if (!marks.length) { SW.toast('What is written there is not in the text at this stage' + (col.states && !st.all ? ': ' + (W.all || 'All revisions') + ' shows it.' : '.'), 4000); return; }
    hold(col, marks);
    heldZone = id;
    if (!shown.length) SW.toast('The text written there is not in the text at this stage: its passage is marked.', 4000);
  }
  // a page (or part of one) whose text the document transcribes under another page (pb.elsewhere:
  // [{ to, note }]): that page's text, highlighted as a box's is
  function goElsewhere(col, to) {
    if (col.stale || !col.byFacs) measure(col);
    var pg = col.pages[col.byFacs[to]];
    if (!pg || !pg.sheet) { SW.toast('The ' + PAGE + ' ' + to + ' is not in this text.', 4000); return; }
    var els = [].slice.call(pg.sheet.querySelectorAll('.bk-text > p, .bk-text > h3, .bk-text > .bk-lg')).filter(function (e) { return !e.hidden; });
    hold(col, els.length ? els : [pg.el]);
  }
  // a revision in the text: its box lit on the page beside it while the pointer is on it; and, with
  // Compare, a passage of the text facing a version's states lights its page there
  view.addEventListener('pointerover', function (e) {
    var s0 = e.target.closest && e.target.closest('.bk-s'); if (!s0) return;
    if (s0._zones) { if (held.length && Date.now() - heldAt > 800 && held.indexOf(s0) < 0) clearHeld(); lightZones(s0._pg, s0._zones, 'bk-zhover', true); }
    if (s0._ln != null) lightLines(s0._leaf, [s0._ln], 'bk-lhover', true);
    facing(s0, true);
  });
  view.addEventListener('pointerout', function (e) {
    var s0 = e.target.closest && e.target.closest('.bk-s'); if (!s0) return;
    if (s0._zones) lightZones(s0._pg, s0._zones, 'bk-zhover', false);
    if (s0._ln != null) lightLines(s0._leaf, [s0._ln], 'bk-lhover', false);
    facing(s0, false);
  });
  // text selected in a column: the bands of the lines it covers lit on their pages, until it is let go
  var selLit = [];
  function selLines() {
    selLit.forEach(function (x) { lightLines(x.pg, x.ns, 'bk-lsel', false); }); selLit = [];
    var sel = window.getSelection && window.getSelection();
    if (!sel || sel.isCollapsed || !sel.rangeCount || !view.isConnected) return;
    var r = sel.getRangeAt(0), by = new Map();
    if (!view.contains(r.commonAncestorContainer)) return;
    var root = r.commonAncestorContainer.nodeType === 1 ? r.commonAncestorContainer : r.commonAncestorContainer.parentNode;
    var spans = root.classList && root.classList.contains('bk-s') ? [root] : [].slice.call(root.querySelectorAll('.bk-s'));
    var s1 = root.closest && root.closest('.bk-s'); if (s1 && spans.indexOf(s1) < 0) spans.push(s1);
    spans.forEach(function (e) {
      if (e._ln == null || !e._leaf || !r.intersectsNode(e)) return;
      var ns = by.get(e._leaf); if (!ns) by.set(e._leaf, ns = []);
      if (ns.indexOf(e._ln) < 0) ns.push(e._ln);
    });
    by.forEach(function (ns, pg) { lightLines(pg, ns, 'bk-lsel', true); selLit.push({ pg: pg, ns: ns }); });
  }
  var selT = 0;
  document.addEventListener('selectionchange', function () { clearTimeout(selT); selT = setTimeout(function () { selLines(); if (RG) rgSel(); }, 60); });
  K.selLines = selLines;

  // ---------- places on the page tied to passages of the text (SW.BENCH.doc.regions) ----------
  // The file gives each page's places and the words of the text each holds; the words are found in the text as it
  // is set, so the join is the text's own and nothing is kept of lines or offsets.
  function rgFetch(u) { return fetch(u, { cache: 'no-cache' }).then(function (r) { if (!r.ok) throw new Error(u + ': ' + r.status); return r.json(); }); }
  var rgOne = null, rgGot = {};
  function rgLoad(facs) {
    if (!RG || !facs) return Promise.resolve(null);
    if (rgGot[facs]) return rgGot[facs];
    if (RG.indexOf('{page}') >= 0) return (rgGot[facs] = rgFetch(RG.replace('{page}', encodeURIComponent(facs))).catch(function () { return null; }));
    rgOne = rgOne || rgFetch(RG).then(function (j) { return (j && j.pages) || {}; }).catch(function (e) { SW.toast('The places on the pages could not be read (' + e.message + ').', 5000); return {}; });
    return (rgGot[facs] = rgOne.then(function (P) { return P[facs] || null; }));
  }
  function rgBox(b) { return Array.isArray(b) && b.length === 4 && b.every(function (x) { return typeof x === 'number' && isFinite(x); }); }
  function rgArea(b) { return b[0] !== b[2] && b[1] !== b[3]; }   // a box with no width or height is not drawn
  // a page's places, and those of the pages beside it, asked for once; a layer already drawn is made again
  function rgNeed(col, k) {
    return Promise.all([k - 1, k, k + 1].map(function (j) {
      var pg = col.pages[j]; if (!pg || !pg.facs) return null;
      if (pg.rgAsked) return pg.rgAsked;
      return (pg.rgAsked = rgLoad(pg.facs).then(function (x) {
        if (!x || !Array.isArray(x.regions) || !rgBox([0, 0].concat(x.size || []))) return;
        var rs = x.regions.filter(function (r) { return r && Array.isArray(r.boxes) && r.boxes.every(rgBox); })
          .map(function (r) { return Object.assign({}, r, { boxes: r.boxes.filter(rgArea) }); }).filter(function (r) { return r.boxes.length; });
        if (!rs.length) return;
        pg.regions = rs; pg.rsize = x.size;
        if (pg.layer) { pg.layer.remove(); pg.layer = null; pg.zdiv = null; pg.ldiv = null; pg.rdiv = null; }
        if (pg.figBtn && pg.figBtn.matches(':hover')) { zoneLayer(pg); fitZones(pg); }
      }));
    }));
  }
  // the text of a page and of the pages beside it as it is set, squashed, with each character's node and place
  // in it; lo and hi: the part that is the page's own
  function rgIndex(col, k) {
    var S = [], nodes = [], offs = [], lo = 0, hi = 0;
    for (var j = Math.max(0, k - 1); j <= Math.min(col.pages.length - 1, k + 1); j++) {
      if (j === k) lo = nodes.length;
      (col.pages[j].sp || []).forEach(function (e) {
        if (e.classList.contains('bk-gone') || e.classList.contains('bk-off') || e.classList.contains('bk-ref') || e.closest('[hidden]')) return;
        var w = document.createTreeWalker(e, NodeFilter.SHOW_TEXT), t;
        while ((t = w.nextNode())) {
          var d = t.data;
          for (var i = 0; i < d.length; i++) { var c = d.charCodeAt(i); if (c === 42 || c === 0x200b || /\s/.test(d[i])) continue; S.push(d[i]); nodes.push(t); offs.push(i); }
        }
      });
      if (j === k) hi = nodes.length;
    }
    return { S: S.join(''), nodes: nodes, offs: offs, lo: lo, hi: hi };
  }
  // each place's passage in a column's text, as a range, or null where its words are not found there
  function rgQuote(r, vid) {
    var q = r.quote;
    if (q && typeof q === 'object') q = q[vid] != null ? q[vid] : q[textOf(vid)];
    else if (q == null) q = r.text;
    return K.squash(q || '');
  }
  function rgResolve(col, k) {
    var pg = col.pages[k]; if (!pg || !pg.regions) return null;
    var stamp = st.stage + '|' + st.all + '|' + st.strike;
    if (pg.rr && pg.rrAt === stamp) return pg.rr;
    var ix = rgIndex(col, k), cur = 0;
    pg.rr = pg.regions.map(function (r) {
      var q = rgQuote(r, col.vid); if (!q) return null;
      var m = K.findQuote(ix.S, q, cur, ix.lo, ix.hi) || K.findQuote(ix.S, q, 0, ix.lo, ix.hi);
      if (!m) return null;
      cur = m[0];
      var rg = document.createRange();
      rg.setStart(ix.nodes[m[0]], ix.offs[m[0]]); rg.setEnd(ix.nodes[m[1] - 1], ix.offs[m[1] - 1] + 1);
      // its text block by block (a paragraph, a heading): a passage that crosses a page turn is marked and read
      // by these, so that what lies between its two parts (the page break, the next page's image) is neither
      rg.parts = [];
      var blockOf = function (i) { var sp = ix.nodes[i].parentNode.closest('.bk-s'); return sp ? sp.parentNode : ix.nodes[i].parentNode; };
      for (var a = m[0]; a < m[1];) {
        var bl = blockOf(a), b = a;
        while (b + 1 < m[1] && blockOf(b + 1) === bl) b++;
        var part = document.createRange(); part.setStart(ix.nodes[a], ix.offs[a]); part.setEnd(ix.nodes[b], ix.offs[b] + 1);
        rg.parts.push(part); a = b + 1;
      }
      return rg;
    });
    pg.rrAt = stamp;
    return pg.rr;
  }
  // a passage marked in the text without touching it (the CSS Custom Highlight API), or, where a browser has
  // none, the spans it runs over
  var HL = root.CSS && root.CSS.highlights && root.Highlight ? root.CSS.highlights : null, hlSpans = {};
  function hlSet(name, ranges) {
    if (HL) { if (!ranges.length) { HL.delete(name); return; } var h = new root.Highlight(); ranges.forEach(function (r) { (r.parts || [r]).forEach(function (x) { h.add(x); }); }); HL.set(name, h); return; }
    (hlSpans[name] || []).forEach(function (e) { e.classList.remove(name); });
    hlSpans[name] = [];
    ranges.forEach(function (r) {
      var c = r.commonAncestorContainer; c = c.nodeType === 1 ? c : c.parentNode;
      var one = c.closest('.bk-s'), es = one ? [one] : [].slice.call(c.querySelectorAll('.bk-s'));
      es.forEach(function (e) { if (r.intersectsNode(e)) { e.classList.add(name); hlSpans[name].push(e); } });
    });
  }
  // a passage's words: its parts' text, a space between two parts
  function rgText(r) { return r ? (r.parts || [r]).map(function (x) { return x.toString(); }).join(' ').replace(/\s+/g, ' ').trim() : ''; }
  // a place's boxes lit on every picture of its page now shown
  function rgLight(facs, k, cls, on) {
    cols.forEach(function (c) {
      if (c.stale || !c.byFacs) measure(c);
      var j = c.byFacs[facs], pg = c.pages[j]; if (!pg || !pg.figBtn) return;
      if (!pg.regions) { if (on) rgNeed(c, j); return; }
      if (on) { zoneLayer(pg); fitZones(pg); }
      ((pg.rdiv || [])[k] || []).forEach(function (d) { d.classList.toggle(cls, on); });
    });
  }
  // a place's passage in each column's text
  function rgRanges(facs, k) {
    var out = [];
    cols.forEach(function (c) {
      if (c.stale || !c.byFacs) measure(c);
      var j = c.byFacs[facs], pg = c.pages[j]; if (!pg) return;
      if (!pg.regions) { rgNeed(c, j); return; }
      var r = (rgResolve(c, j) || [])[k]; if (r) out.push(r);
    });
    return out;
  }
  // the places whose passage holds a point of the text: the page's own, and those of the pages beside it
  function caretAt(x, y) {
    if (document.caretPositionFromPoint) { var c = document.caretPositionFromPoint(x, y); return c && { node: c.offsetNode, off: c.offset }; }
    if (document.caretRangeFromPoint) { var r = document.caretRangeFromPoint(x, y); return r && { node: r.startContainer, off: r.startOffset }; }
    return null;
  }
  function rgAtPoint(s0, x, y) {
    var pg = s0._leaf, col = pg && pg.col; if (!col) return [];
    var c = caretAt(x, y); if (!c || !s0.contains(c.node)) return [];
    var k = col.pages.indexOf(pg), out = [];
    [k - 1, k, k + 1].forEach(function (j) {
      var q = col.pages[j]; if (!q || !q.regions) return;
      (rgResolve(col, j) || []).forEach(function (rg, i) {
        try { if (rg && rg.comparePoint(c.node, c.off) === 0) out.push({ pg: q, k: i }); } catch (err) { /* a node no longer in the text */ }
      });
    });
    return out;
  }
  // under the pointer: the places lit and their passages marked, until the pointer leaves
  var rgHov = [], rgHovKey = '';
  function rgKey(list) { return (list || []).map(function (x) { return x.pg.facs + ':' + x.k; }).join(','); }
  function rgHover(list) {
    if (!linkOn()) list = null;
    var key = rgKey(list); if (key === rgHovKey) return;
    rgHov.forEach(function (x) { rgLight(x.facs, x.k, 'bk-rhover', false); });
    rgHov = (list || []).map(function (x) { return { facs: x.pg.facs, k: x.k }; }); rgHovKey = key;
    var ranges = [];
    rgHov.forEach(function (x) { rgLight(x.facs, x.k, 'bk-rhover', true); ranges = ranges.concat(rgRanges(x.facs, x.k)); });
    hlSet('bk-rg-hover', ranges);
  }
  // clicked: held, the place and its passage, until the next click
  var rgHeld = [], rgHeldAt = 0;
  function rgShareShown() { var b = SW.$('#bk-share-hl'); if (b) b.hidden = !rgHeld.length; }
  function rgUnhold() { rgHeld.forEach(function (x) { rgLight(x.facs, x.k, 'bk-rheld', false); }); rgHeld = []; hlSet('bk-rg-held', []); rgShareShown(); }
  function rgHold(list) {
    rgUnhold(); if (!linkOn()) return [];
    rgHeld = list.map(function (x) { return { facs: x.pg.facs, k: x.k }; }); rgHeldAt = Date.now();
    var ranges = [];
    rgHeld.forEach(function (x) { rgLight(x.facs, x.k, 'bk-rheld', true); ranges = ranges.concat(rgRanges(x.facs, x.k)); });
    hlSet('bk-rg-held', ranges);
    rgShareShown();
    return ranges;
  }
  // a place on the page: to its passage in the text beside it, both held
  function toRegion(col, pg, k) {
    var r = (rgResolve(col, col.pages.indexOf(pg)) || [])[k];
    if (!r) { SW.toast('The words of this place were not found in the text shown.', 4000); return; }
    rgHold([{ pg: pg, k: k }]);
    var e = r.startContainer.parentNode && r.startContainer.parentNode.closest('.bk-s');
    if (e) { col.moved = false; col.el.scrollTop = Math.max(0, e.offsetTop - READ); }
  }
  function regionTip(col, pg, k) {
    var r = pg.regions[k], rg = (rgResolve(col, col.pages.indexOf(pg)) || [])[k], t = rgText(rg);
    return (r.text ? '<div class="bk-ztip-w">' + esc(r.text.length > 220 ? r.text.slice(0, 220) + '…' : r.text) + '</div>' : '') +
      (t ? '<div>“' + esc(t.length > 260 ? t.slice(0, 260) + '…' : t) + '”</div>' : '<div><i>its words were not found in the text shown</i></div>') +
      (r.est ? '<div>The place or the match is estimated.</div>' : '') + (t ? '<div class="bk-ztip-h">Click: highlight this in panel</div>' : '');
  }
  // text selected: every place its passage runs over lit, until the selection is let go
  var rgSelLit = [];
  function rgSel() {
    rgSelLit.forEach(function (x) { rgLight(x.facs, x.k, 'bk-rsel', false); }); rgSelLit = [];
    var sel = window.getSelection && window.getSelection();
    if (!sel || sel.isCollapsed || !sel.rangeCount || !view.isConnected) return;
    var r = sel.getRangeAt(0); if (!view.contains(r.commonAncestorContainer)) return;
    var c = r.commonAncestorContainer; c = c.nodeType === 1 ? c : c.parentNode;
    var one = c.closest('.bk-s'), spans = one ? [one] : [].slice.call(c.querySelectorAll('.bk-s')), seen = [];
    spans.forEach(function (e) {
      var pg = e._leaf; if (!pg || !pg.col || seen.indexOf(pg) >= 0 || !r.intersectsNode(e)) return;
      seen.push(pg);
      var k = pg.col.pages.indexOf(pg); rgNeed(pg.col, k);
      (rgResolve(pg.col, k) || []).forEach(function (rg, i) {
        if (rg && rg.compareBoundaryPoints(Range.END_TO_START, r) < 0 && rg.compareBoundaryPoints(Range.START_TO_END, r) > 0) { rgLight(pg.facs, i, 'bk-rsel', true); rgSelLit.push({ facs: pg.facs, k: i }); }
      });
    });
  }
  if (RG) {
    var rgRaf = 0, rgEv = null;
    view.addEventListener('pointermove', function (e) {
      rgEv = e; if (rgRaf) return;
      rgRaf = requestAnimationFrame(function () {
        rgRaf = 0;
        var t = rgEv.target, s0 = t.closest && t.closest('.bk-s');
        if (s0 && s0._leaf && s0._leaf.col) { rgNeed(s0._leaf.col, s0._leaf.col.pages.indexOf(s0._leaf)); rgHover(rgAtPoint(s0, rgEv.clientX, rgEv.clientY)); }
        else if (!(t.closest && t.closest('.bk-rg'))) rgHover(null);
      });
    });
    view.addEventListener('pointerleave', function () { rgHover(null); });
    view.addEventListener('click', function (e) { if (rgHeld.length && Date.now() - rgHeldAt > 300 && !(e.target.closest && e.target.closest('#bk-share, #bk-share-hl'))) rgUnhold(); }, true);
    // a click on a passage of the text (not a drag that selects, nor a link, a note's mark or a button): held
    view.addEventListener('click', function (e) {
      var s0 = e.target.closest && e.target.closest('.bk-s'); if (!s0 || !s0._leaf || !s0._leaf.col || e.target.closest('a, button, .bk-ref')) return;
      var sel = window.getSelection && window.getSelection(); if (sel && !sel.isCollapsed) return;
      var x = e.clientX, y = e.clientY;
      rgNeed(s0._leaf.col, s0._leaf.col.pages.indexOf(s0._leaf)).then(function () { var list = rgAtPoint(s0, x, y); if (list.length) rgHold(list); });
    });
  }
  // ---------- a held highlight to send: a link that holds it again, and a picture of the page with it ----------
  // hr in a link: the page, the place's number on it, and the first of its words (squashed), so that a place
  // whose number has changed since (the file made again) is still found by its words
  function rgRef(c, x) { var pg = c.pages[c.byFacs[x.facs]]; return x.facs + ':' + x.k + ':' + rgQuote(pg.regions[x.k], c.vid).slice(0, 16); }
  function rgOpenHeld(c, hr) {
    var m = /^([^:]+):(\d+):?(.*)$/.exec(String(hr)); if (!m) return;
    if (c.stale || !c.byFacs) measure(c);
    var j = c.byFacs[m[1]]; if (j == null) return;
    rgNeed(c, j).then(function () {
      var pg = c.pages[j], rs = pg.regions; if (!rs) return;
      var k = +m[2], has = function (i) { return rs[i] && (!m[3] || rgQuote(rs[i], c.vid).indexOf(m[3]) === 0); };
      if (!has(k)) { k = -1; for (var i = 0; i < rs.length; i++) if (has(i)) { k = i; break; } }
      if (k < 0) { SW.toast('The passage this link held is no longer marked on the ' + PAGE + '.', 5000); return; }
      // after the place the link names has been gone to
      setTimeout(function () { toRegion(c, pg, k); }, 250);
    });
  }
  function loadPic(src) {
    return new Promise(function (ok, no) {
      var im = new Image(); im.crossOrigin = 'anonymous';
      im.onload = function () { ok(im); }; im.onerror = function () { no(new Error('the ' + PAGE + '’s image could not be read')); };
      im.src = src;
    });
  }
  function wrapText(x, text, width) {
    var out = [], line = '';
    String(text).split(/\s+/).forEach(function (w) {
      var t = line ? line + ' ' + w : w;
      if (line && x.measureText(t).width > width) { out.push(line); line = w; } else line = t;
    });
    if (line) out.push(line);
    return out;
  }
  // what is held, read for sending: the page, its places held, the passage as the first text has it, its citation
  function rgHeldInfo() {
    var c = cols[0]; if (!c || !rgHeld.length) return null;
    if (c.stale || !c.byFacs) measure(c);
    var x = rgHeld[0], j = c.byFacs[x.facs], pg = c.pages[j]; if (!pg || !pg.regions) return null;
    var rr = rgResolve(c, j) || [], range = rr[x.k], ks = rgHeld.filter(function (y) { return y.facs === x.facs; }).map(function (y) { return y.k; });
    var passage = rgText(range), cite = '', sa = range && spanOf(range.startContainer);
    var face = getComputedStyle(sa || c.el).fontFamily;   // the text's own face, for the picture
    if (range && SW.cite && c.b) {
      var sb = spanOf(range.endContainer);
      if (sa && sb && sa.dataset.n && sa.dataset.p != null) cite = SW.cite(c.b, +sa.dataset.p, +sa.dataset.n, Math.max(+sa.dataset.n, +(sb.dataset.n || sa.dataset.n)));
    }
    // the bench's own wording for what is sent (doc.shareCite), in place of the reference by file and line
    var ref = cite, P = PAGE.charAt(0).toUpperCase() + PAGE.slice(1);
    cite = K.shareCite(D.shareCite, { page: pg.facs || '', version: c.vid, label: textLabel(c.vid), cite: cite });
    // what is said of the passage, once: the bench's wording alone (it names the page), else the page and the
    // reference (which names the text), else the page and the text
    var lines = D.shareCite && cite && cite !== ref ? [cite] : cite ? [P + ' ' + (pg.facs || ''), cite] : [P + ' ' + (pg.facs || '') + ' · ' + textLabel(c.vid)];
    return { c: c, pg: pg, ks: ks, passage: passage, cite: cite, lines: lines, face: face, est: ks.some(function (k) { return pg.regions[k].est; }), link: shareLink({ hr: rgRef(c, x) }) };
  }
  // the picture: the page as it is trimmed, the places drawn in the links' colour; beside it the passage, and
  // under that the page's name, the text, the citation, the bench and the image's credit
  function rgPicture(h) {
    var pg = h.pg, src = pg.img ? (pg.img.large || pg.img.src) : iiifURL(pg.iiif, 1200);
    return loadPic(src).then(function (im) {
      var T = trim(pg) || { l: 0, t: 0, r: 0, b: 0 }, nw = im.naturalWidth, nh = im.naturalHeight;
      var sx = T.l * nw, sy = T.t * nh, sw = (1 - T.l - T.r) * nw, sh = (1 - T.t - T.b) * nh;
      var PAD = 40, IW = 640, IH = Math.round(IW * sh / sw), TX = PAD + IW + 44, CW = 1400, TW = CW - TX - PAD;
      var cv = document.createElement('canvas'), x = cv.getContext('2d');
      var serif = h.face || 'Georgia, serif', sans = 'system-ui, -apple-system, "Segoe UI", Helvetica, Arial, sans-serif';
      var css = getComputedStyle(document.documentElement), colour = css.getPropertyValue('--bk-link').trim() || css.getPropertyValue('--amber').trim() || '#a3317a';
      var size = h.passage.length > 900 ? 20 : h.passage.length > 500 ? 23 : 27;
      x.font = size + 'px ' + serif;
      var body = wrapText(x, '“' + h.passage + '”', TW), lh = Math.round(size * 1.5);
      x.font = '17px ' + sans;
      var P = PAGE.charAt(0).toUpperCase() + PAGE.slice(1), credit = String(D.imageCreditShort || '').replace(/<[^>]*>/g, '').trim();
      var meta = [].concat.apply([], h.lines.map(function (t) { return wrapText(x, t, TW); })).concat([B.title || B.name || ''].filter(Boolean),
        credit ? wrapText(x, 'Image: ' + credit, TW) : [], h.est ? ['The place marked on the ' + PAGE + ' is approximate.'] : []);
      var CH = Math.max(IH, body.length * lh + 30 + meta.length * 26) + 2 * PAD;
      cv.width = CW; cv.height = CH;
      x.fillStyle = '#ffffff'; x.fillRect(0, 0, CW, CH);
      x.drawImage(im, sx, sy, sw, sh, PAD, PAD, IW, IH);
      x.strokeStyle = '#c9c9c9'; x.lineWidth = 1; x.strokeRect(PAD + 0.5, PAD + 0.5, IW - 1, IH - 1);
      // the places, by their share of the page, within the trimmed picture
      x.save(); x.beginPath(); x.rect(PAD, PAD, IW, IH); x.clip();
      h.ks.forEach(function (k) {
        pg.regions[k].boxes.forEach(function (b0) {
          var rw = pg.rsize[0], rh = pg.rsize[1];
          var bx = PAD + (Math.min(b0[0], b0[2]) / rw - T.l) / (1 - T.l - T.r) * IW, by = PAD + (Math.min(b0[1], b0[3]) / rh - T.t) / (1 - T.t - T.b) * IH;
          var bw = Math.abs(b0[2] - b0[0]) / rw / (1 - T.l - T.r) * IW, bh = Math.abs(b0[3] - b0[1]) / rh / (1 - T.t - T.b) * IH;
          // filled, with no edge, as on the page, and a little past the place above and below
          var M = 4;
          x.globalAlpha = 0.32; x.fillStyle = colour; x.fillRect(bx, by - M, bw, bh + 2 * M);
          x.globalAlpha = 1;
        });
      });
      x.restore();
      x.fillStyle = '#15191c'; x.textBaseline = 'top'; x.font = size + 'px ' + serif;
      body.forEach(function (ln, i) { x.fillText(ln, TX, PAD + i * lh); });
      // a rule in the links' colour beside the passage
      x.fillStyle = colour; x.fillRect(TX - 18, PAD + 4, 4, body.length * lh - 10);
      x.fillStyle = '#55606a'; x.font = '17px ' + sans;
      meta.forEach(function (ln, i) { x.fillText(ln, TX, PAD + body.length * lh + 30 + i * 26); });
      return new Promise(function (ok, no) { cv.toBlob(function (bl) { if (bl) ok({ blob: bl, w: CW, h: CH }); else no(new Error('the picture could not be made')); }, 'image/png'); });
    });
  }
  function shareHighlight() {
    var h = rgHeldInfo();
    if (!h) { SW.toast('Click a passage, or its place on the ' + PAGE + ', to hold a highlight first.', 4000); return; }
    var old = SW.$('dialog.bk-shl'); if (old) old.remove();
    var d = SW.el('dialog', { class: 'bk-shl' }), P = PAGE.charAt(0).toUpperCase() + PAGE.slice(1), pic = null;
    var name = String(B.id || B.name || 'bench').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '-' + PAGE + '-' + (h.pg.facs || '') + '-highlight.png';
    d.innerHTML = '<form method="dialog"><h3>Share highlight</h3>' +
      '<div class="bk-shl-pic"><p class="hint">Making the picture…</p></div>' +
      '<p class="hint">' + esc(h.lines.join(' · ')) + '</p>' +
      '<div class="row bk-shl-acts"><button type="button" class="btn" data-shl="link" title="A link that opens this ' + esc(PAGE) + ' with the highlight held">Copy link</button>' +
      '<button type="button" class="btn" data-shl="mail" title="A message with the picture and the passage">Email…</button>' +
      '<button type="button" class="btn" data-shl="save" disabled title="The picture as a file">Download PNG</button>' +
      '<button type="button" class="btn" data-shl="copy" disabled title="The picture, to paste">Copy PNG</button>' +
      '<span class="bk-shl-gap"></span><button value="cancel" class="btn ghost">Close</button></div>' +
      '<p class="hint bk-shl-msg" aria-live="polite"></p></form>';
    document.body.appendChild(d);
    var msg = SW.$('.bk-shl-msg', d), say = function (t) { msg.textContent = t; };
    var text = (h.passage ? '“' + h.passage + '”\n\n' : '') + (h.cite ? h.cite + '\n\n' : '') + h.link;
    var file = function () { return new File([pic.blob], name, { type: 'image/png' }); };
    var toClip = function () {
      if (!pic || !navigator.clipboard || !root.ClipboardItem) return Promise.reject(new Error('this browser cannot copy a picture'));
      return navigator.clipboard.write([new root.ClipboardItem({ 'image/png': pic.blob })]);
    };
    rgPicture(h).then(function (p) {
      pic = p;
      var u = URL.createObjectURL(p.blob), box = SW.$('.bk-shl-pic', d);
      box.innerHTML = ''; box.appendChild(SW.el('img', { src: u, alt: 'The ' + PAGE + ' with the passage’s place marked, and the passage', width: p.w, height: p.h }));
      d.addEventListener('close', function () { URL.revokeObjectURL(u); });
      SW.$$('[data-shl="copy"], [data-shl="save"]', d).forEach(function (b) { b.disabled = false; });
    }, function (e) {
      SW.$('.bk-shl-pic', d).innerHTML = '<p class="hint">The picture could not be made here (' + esc(e.message) + '). The passage and the link can still be sent.</p>';
    });
    d.addEventListener('click', function (e) {
      var b = e.target.closest('[data-shl]'); if (!b) return;
      var k = b.dataset.shl;
      if (k === 'link') { SW.copyText(h.link, 'the link'); say('The link is copied. It opens this ' + PAGE + ' with the highlight held.'); }
      else if (k === 'copy') toClip().then(function () { say('The picture is copied: paste it into a message or a document.'); }, function (err) { say('Could not copy the picture (' + err.message + '). Download PNG gives it as a file.'); });
      else if (k === 'save') { var a = SW.el('a', { href: URL.createObjectURL(pic.blob), download: name }); document.body.appendChild(a); a.click(); a.remove(); say('Saved as ' + name + '.'); }
      else if (k === 'mail') {
        // where the browser can hand a file on, the picture and the words go to the system's sharing, which gives
        // them to Mail; elsewhere an email cannot be given a file from a page, so the words and the link go in a
        // new message and the picture on the clipboard, to paste in
        var can = false; try { can = !!(pic && navigator.canShare && navigator.canShare({ files: [file()] })); } catch (err) { can = false; }
        if (can) {
          navigator.share({ files: [file()], title: (B.title || B.name || '') + ', ' + PAGE + ' ' + (h.pg.facs || ''), text: text })
            .then(function () { say('Handed on with the picture and the passage.'); }, function (err) { if (err && err.name !== 'AbortError') say('Could not hand the picture on (' + err.message + '). Download PNG gives it to attach.'); });
          return;
        }
        var go = function (copied) {
          var a = SW.el('a', { href: 'mailto:?subject=' + encodeURIComponent((B.title || B.name || 'A passage') + ', ' + PAGE + ' ' + (h.pg.facs || '')) + '&body=' + encodeURIComponent(text) });
          document.body.appendChild(a); a.click(); a.remove();
          say(copied ? 'A message is started with the passage and the link. The picture is copied: paste it into the message.' : 'A message is started with the passage and the link. Download PNG gives the picture to attach.');
        };
        toClip().then(function () { go(true); }, function () { go(false); });
      }
    });
    d.addEventListener('close', function () { d.remove(); });
    d.showModal();
  }
  K.heldInfo = rgHeldInfo; K.heldPicture = function () { var h = rgHeldInfo(); return h ? rgPicture(h) : Promise.resolve(null); };
  // the highlight links turned on or off, or their colour changed (Settings ▸ Book): what is lit is put out, and each page's
  // layer is made again when next wanted
  SW.on('book-link', function () {
    paintLink();
    clearHeld(); rgHover(null); rgUnhold();
    rgSelLit.forEach(function (x) { rgLight(x.facs, x.k, 'bk-rsel', false); }); rgSelLit = [];
    cols.forEach(function (c) { (c.pages || []).forEach(function (pg) { if (pg.layer) { pg.layer.remove(); pg.layer = null; pg.zdiv = null; pg.ldiv = null; pg.rdiv = null; } }); });
  });
  // the places of the pages read so far, and those whose words are not in the first text
  K.regionsReport = function () {
    var out = { pages: 0, regions: 0, tied: 0, untied: [] }, c = cols[0];
    if (c) c.pages.forEach(function (pg, k) {
      if (!pg.regions) return;
      out.pages++;
      (rgResolve(c, k) || []).forEach(function (rg, i) { out.regions++; if (rg) out.tied++; else out.untied.push({ page: pg.facs, k: i, quote: rgQuote(pg.regions[i], c.vid).slice(0, 60) }); });
    });
    return out;
  };
  K.regionsNeed = function (facs) { var c = cols[0]; if (!c) return Promise.resolve(); if (c.stale || !c.byFacs) measure(c); return c.byFacs[facs] == null ? Promise.resolve() : rgNeed(c, c.byFacs[facs]); };
  function words(t) { return String(t).toLowerCase().match(/[a-z\u00c0-\u024f']{3,}/g) || []; }
  function facing(s0, on) {
    if (cols.length < 2 || !s0._leaf || !s0._leaf.facs) return;
    var here = cols.filter(function (c) { return c.el.contains(s0); })[0];
    if (!here || here.states) return;
    cols.forEach(function (other) { if (other !== here && other.states) facingIn(other, s0, on); });
  }
  function facingIn(other, s0, on) {
    if (other.stale || !other.byFacs) measure(other);
    var pg = other.pages[other.byFacs[s0._leaf.facs]]; if (!pg) return;
    if (pg.sheet) pg.sheet.classList.toggle('bk-leaflit', on);
    if (!on) { if (pg.litFrom) lightZones(pg, pg.litFrom, 'bk-zhover', false); pg.litFrom = null; return; }
    // the revisions on that page whose words are mostly in this passage (the words, not their places,
    // so a close match only: where none is close, the page alone is lit)
    var have = {}; words(s0.textContent).forEach(function (w) { have[w] = 1; });
    pg.litFrom = Object.keys(pg.zones).filter(function (id) {
      var ws = words(pg.zones[id].spans.map(function (e) { return e.textContent; }).join(' '));
      var hit = ws.filter(function (w) { return have[w]; }).length;
      return ws.length && hit && hit / ws.length >= 0.6;
    });
    if (pg.litFrom.length) lightZones(pg, pg.litFrom, 'bk-zhover', true);
  }
  window.addEventListener('resize', function () {
    cols.forEach(function (c) { c.pages.forEach(function (pg) { if (pg.layer) fitZones(pg); if (pg.markBox) fitMark(pg.figImg, pg.markBox); }); });
    if (K.placeCrop) K.placeCrop();
    var m = SW.$('dialog.bk-modal[open] .bk-modal-pic'); if (m) { fitLayer(m.querySelector('img'), m.querySelector('.bk-zl')); fitMark(m.querySelector('img'), m.querySelector('.bk-mkbox')); }
  });

  // the page larger, in a box over the view, with what is known of it: ◀ ▶ (or the arrow keys) for
  // the page before or after, ✕, Esc or a click elsewhere to close
  function pageBox(col, i, zq) {
    var old = SW.$('dialog.bk-modal'); if (old) old.remove();
    var d = SW.el('dialog', { class: 'bk-modal' });
    document.body.appendChild(d);
    // the page before or after that has an image, or -1
    function step(k, dir) { for (k += dir; k >= 0 && k < col.pages.length; k += dir) if (col.pages[k].has) return k; return -1; }
    var P = PAGE.charAt(0).toUpperCase() + PAGE.slice(1);
    function fill(k) {
      i = k;
      if (RG && !col.pages[k].rgAsked) rgNeed(col, k).then(function () { if (i === k && d.isConnected && col.pages[k].regions) fill(k); });
      var pg = col.pages[k], b = col.b, next = col.pages[k + 1], n1 = next && next.p === pg.p && next.n0 != null ? next.n0 - 1 : (b.lines[pg.p] || []).length;
      // an archive's folio and sequence beside the page's name (pb.folio, pb.seq)
      var arch = [pg.folio != null ? (D.folioWord || 'folio') + ' ' + pg.folio : '', pg.seq != null ? 'seq. ' + pg.seq : ''].filter(Boolean).join(', ');
      var rows = [[P, esc(pg.facs || '') + (arch ? ' (' + esc(arch) + ')' : '')], ['Text', esc(textLabel(col.vid))]];
      if (b.parts.length > 1) rows.push(['Part', esc(b.parts[pg.p].src.split('/').pop())]);
      if (pg.n0 != null) rows.push(['Lines', (n1 > pg.n0 ? 'll. ' + pg.n0 + '–' + n1 : 'l. ' + pg.n0) + ' ' + SW.refTag(b.v.id, pg.p, pg.n0, Math.max(pg.n0, n1), b.parts.length)]);
      if (pg.lines && pg.lines.some(function (ln) { return !ln.measured; })) rows.push(['Lines on the image', 'Lines are estimated.']);
      if (pg.regions) {
        var rrs = rgResolve(col, k) || [], untied = rrs.filter(function (x) { return !x; }).length;
        rows.push(['Passages on the image', pg.regions.length + (untied ? ', ' + untied + ' not found in this text' : '') + (pg.regions.some(function (r) { return r.est; }) ? '. A dashed edge: the place or the match is estimated.' : '')]);
      }
      // the image's credit folded behind the bench's short form (doc.imageCreditShort, plain text), or
      // its first words (as "Houghton Library"), opened with the chevron
      if (D.imageCredit) {
        var cred0 = String(D.imageCredit).replace(/<[^>]*>/g, '').split(/[,.;]/)[0].trim();
        cred0 = D.imageCreditShort ? String(D.imageCreditShort) : cred0.length > 40 ? cred0.slice(0, 40) + '…' : cred0;
        rows.push(['Image', '<details class="bk-credit"><summary>' + esc(cred0) + '</summary>' + D.imageCredit + '</details>']);
      }
      rows.push(['Source', pg.iiif ? '<a href="' + esc(iiifURL(pg.iiif)) + '" target="_blank" rel="noopener">the full image ↗</a> · <a href="' + esc(pg.iiif.id + '/info.json') + '" target="_blank" rel="noopener">its IIIF service ↗</a>' :
        '<a href="' + esc(pg.img.large || pg.img.src) + '" target="_blank" rel="noopener">the image ↗</a>']);
      var prev = step(k, -1), nxt = step(k, 1), many = prev >= 0 || nxt >= 0;
      // the rating, the bookmark and the link on one line, under the details
      var acts = '<div class="bk-acts">' + (N && N.listAll && pg.facs ? '<span class="bk-prate">' + rateHTML({ n: 0, mine: 0 }) + '</span>' : '') +
        (pg.facs ? '<button class="btn bk-markbtn' + (marked(pg.facs) ? ' on' : '') + '" data-markbtn="' + esc(pg.facs) + '" title="' + esc(markTitle(pg.facs)) + '" aria-pressed="' + marked(pg.facs) + '">🔖</button>' : '') +
        '<button class="btn" data-share title="A link that opens Book at this ' + esc(PAGE) + ', as it is set here: the stage, the zoom and the place">🔗 Copy link</button></div>';
      d.innerHTML = '<div class="bk-modal-in"><div class="bk-modal-pic"><div class="bk-zoom"><img src="' + esc(pg.img && pg.img.large ? pg.img.large : pg.iiif ? iiifURL(pg.iiif, 1600, 1600) : pg.img.src) + '" alt="' + esc(PAGE + ' ' + (pg.facs || '')) + '"></div>' +
        '<div class="bk-zctl"><button data-zm="-" title="Smaller (−)">−</button><span class="bk-zpc" title="The size it is shown at, of the image file">100%</span><button data-zm="+" title="Larger (+)">+</button><button data-zm="0" class="bk-zw" title="The whole ' + esc(PAGE) + ' (0)">Fit</button><button data-zm="1" class="bk-zw" title="Actual size: a pixel of the image file to a pixel of the screen">1:1</button></div>' +
        (many ? '<button class="bk-nav bk-nav-prev" data-to="' + prev + '"' + (prev < 0 ? ' disabled' : '') + ' title="The ' + esc(PAGE) + ' before" aria-label="The ' + esc(PAGE) + ' before">◀</button>' +
          '<button class="bk-nav bk-nav-next" data-to="' + nxt + '"' + (nxt < 0 ? ' disabled' : '') + ' title="The ' + esc(PAGE) + ' after" aria-label="The ' + esc(PAGE) + ' after">▶</button>' : '') + '</div>' +
        '<div class="bk-modal-meta"><button class="bk-x" data-x title="Close (Esc)" aria-label="Close">✕</button><table>' + rows.map(function (r) { return '<tr><td>' + esc(r[0]) + '</td><td>' + r[1] + '</td></tr>'; }).join('') + '</table>' + acts +
        '<p class="hint bk-keys">Wheel, pinch or + −: zoom; drag: move. ' + (hasBoxes(pg) ? 'A box or a line on the image: its text by the pointer; a click: highlight this in panel. ' : '') + (many ? '◀ ▶ or the arrow keys: the ' + esc(PAGE) + ' before or after. ' : '') + '✕, Esc or a click outside: close.</p></div></div>';
      zoomEl = d.querySelector('.bk-zoom'); zm = { z: 1, x: 0, y: 0 }; paint();
      showRating(pg.facs);
      // the bookmark at the page's top right, moving with the page and kept its own size
      if (pg.facs) {
        var mkb = SW.el('div', { class: 'bk-mkbox' }), bigM = zoomEl.querySelector('img'); mkb.innerHTML = markHTML(pg.facs); zoomEl.appendChild(mkb);
        var fitM = function () { fitMark(bigM, mkb); };
        if (bigM.complete) fitM(); bigM.addEventListener('load', fitM);
      }
      // the dialog takes the page's shape (as trimmed), from its size or, where none is given, from the image
      // when it comes; a trimmed page is a box of the kept part's shape, fitted in the picture's place
      var T = trim(pg), im0 = zoomEl.querySelector('img');
      withShape(pg, im0, function (ar) {
        d.style.setProperty('--bk-ar', (T ? ar * (1 - T.l - T.r) / (1 - T.t - T.b) : ar).toFixed(4));
        if (T) { d.classList.add('bk-trim'); cropIn(im0, T, ar); placeCrop(); }
        paint();
      });
      // a sharper image where the bench gives one (doc.image(pb).sharp), fetched as the page opens and
      // put in when it arrives, if the page is still open; the same page, so the boxes and the zoom hold.
      // The pages either side are fetched too, so ◀ ▶ arrive sharp; a failure leaves the image shown
      var sharp = pg.img && pg.img.sharp;
      if (sharp) {
        var sim = new Image();
        sim.onload = function () {
          if (i !== k || !d.open) return;
          var bigNow = d.querySelector('.bk-zoom img'); if (!bigNow) return;
          bigNow.src = sharp;
          var Lz = d.querySelector('.bk-zoom .bk-zl'); if (Lz) { if (bigNow.complete) fitLayer(bigNow, Lz); else bigNow.addEventListener('load', function () { fitLayer(bigNow, Lz); }, { once: true }); }
          paint();
        };
        sim.src = sharp;
      }
      [step(k, -1), step(k, 1)].forEach(function (j) { var q = j >= 0 && col.pages[j].img && col.pages[j].img.sharp; if (q) (new Image()).src = q; });
      // the revisions' boxes over the large image, as beside the text: faint with the pointer on it,
      // the stage's lit in red, a click on one to the text written there
      if (hasBoxes(pg) && (pg.size || pg.rsize)) {
        var pic = d.querySelector('.bk-modal-pic'), big = pic.querySelector('img'), Z = makeZones(pg, false), sNow = st.all ? 0 : st.stage;
        zoomEl.appendChild(Z.L);
        var er = Z.L.querySelector('.bk-else');
        // a box under the pointer: its words and what was done there, by the pointer
        var tip = SW.el('div', { class: 'bk-ztip', hidden: '' }); d.appendChild(tip);
        Object.keys(Z.zdiv).forEach(function (id) {
          var zd = Z.zdiv[id];
          zd.addEventListener('pointerenter', function () { tip.innerHTML = zoneTip(pg, id); tip.hidden = false; });
          zd.addEventListener('pointermove', function (e) { var r = tip.getBoundingClientRect(); tip.style.left = Math.min(e.clientX + 14, innerWidth - r.width - 8) + 'px'; tip.style.top = Math.min(e.clientY + 16, innerHeight - r.height - 8) + 'px'; });
          zd.addEventListener('pointerleave', function () { tip.hidden = true; });
        });
        (pg.lines || []).forEach(function (ln) {
          var bd = Z.ldiv[ln.n]; if (!bd) return;
          bd.addEventListener('pointerenter', function () { tip.innerHTML = lineTip(pg, ln); tip.hidden = false; });
          bd.addEventListener('pointermove', function (e) { var r = tip.getBoundingClientRect(); tip.style.left = Math.min(e.clientX + 14, innerWidth - r.width - 8) + 'px'; tip.style.top = Math.min(e.clientY + 16, innerHeight - r.height - 8) + 'px'; });
          bd.addEventListener('pointerleave', function () { tip.hidden = true; });
        });
        Z.rdiv.forEach(function (ds, rk) {
          ds.forEach(function (rd) {
            rd.addEventListener('pointerenter', function () { ds.forEach(function (x) { x.classList.add('bk-rhover'); }); tip.innerHTML = regionTip(col, pg, rk); tip.hidden = false; });
            rd.addEventListener('pointermove', function (e) { var r = tip.getBoundingClientRect(); tip.style.left = Math.min(e.clientX + 14, innerWidth - r.width - 8) + 'px'; tip.style.top = Math.min(e.clientY + 16, innerHeight - r.height - 8) + 'px'; });
            rd.addEventListener('pointerleave', function () { ds.forEach(function (x) { x.classList.remove('bk-rhover'); }); tip.hidden = true; });
          });
        });
        if (er) {
          er.addEventListener('pointerenter', function () { tip.innerHTML = '<div>' + esc(pg.elsewhere[0].note || '') + '</div><div class="bk-ztip-h">Click: the text, under ' + esc(pg.elsewhere[0].to) + '</div>'; tip.hidden = false; });
          er.addEventListener('pointermove', function (e) { var r = tip.getBoundingClientRect(); tip.style.left = Math.min(e.clientX + 14, innerWidth - r.width - 8) + 'px'; tip.style.top = Math.min(e.clientY + 16, innerHeight - r.height - 8) + 'px'; });
          er.addEventListener('pointerleave', function () { tip.hidden = true; });
        }
        if (sNow > 0) Object.keys(pg.zones).forEach(function (id) { if (pg.zones[id].at[sNow]) Z.zdiv[id].classList.add('bk-zstage'); });
        if (big.complete) fitLayer(big, Z.L); else big.addEventListener('load', function () { fitLayer(big, Z.L); });
      }
      // the text beside follows, so the page closed on is the one in view
      if (pg.el) col.el.scrollTop = Math.max(0, pg.el.offsetTop - 20);
    }
    function go(k) { if (k >= 0 && col.pages[k]) fill(k); }
    // zoom and pan: a scale and an offset on the image and its boxes together, so the boxes stay on
    // the words at every size; the place in a link is the view's centre as a share of the image
    var zoomEl = null, zm = { z: 1, x: 0, y: 0 }, drag = null, dragged = false, touches = {};
    function size() { return { W: zoomEl.clientWidth, H: zoomEl.clientHeight }; }
    // the page's rating in its details, as the group's annotations have it
    function showRating(facs) {
      pageRates().then(function (rs) { var box = d.querySelector('.bk-prate'); if (box && col.pages[i] && col.pages[i].facs === facs) box.innerHTML = rateHTML(ratingOf(rs, facs)); });
    }
    // a trimmed page's box, as large as fits the picture's place, in the middle of it
    function placeCrop() {
      var cr = zoomEl && zoomEl.querySelector('.bk-crop'); if (!cr) return;
      var S = size(), a = parseFloat(cr.style.aspectRatio) || 1, w = Math.min(S.W, S.H * a);
      cr.style.width = w + 'px'; cr.style.height = (w / a) + 'px';
      fitMark(cr.querySelector('img'), zoomEl.querySelector('.bk-mkbox'));
    }
    K.placeCrop = placeCrop;
    // as Paratexts' pictures (kit/paratexts.js, zoomBox): from half to forty times the size it fits at,
    // moved freely at any size, drawn at most once a frame; the share link's zm keeps its form
    var raf = 0;
    function paintNow() {
      if (!zoomEl) return;
      zm.z = Math.max(0.5, Math.min(40, zm.z));
      zoomEl.style.transform = 'translate(' + zm.x + 'px,' + zm.y + 'px) scale(' + zm.z + ')';
      var mk0 = zoomEl.querySelector('.bk-mk'); if (mk0) mk0.style.transform = 'scale(' + (1 / zm.z) + ')';
      d.classList.toggle('bk-zoomed', Math.abs(zm.z - 1) > 0.001 || zm.x !== 0 || zm.y !== 0);
      var pc = d.querySelector('.bk-zpc'), f = fitScale(); if (pc && f) pc.textContent = Math.round(100 * f * zm.z) + '%';
    }
    function paint() { if (!raf) raf = requestAnimationFrame(function () { raf = 0; paintNow(); }); }
    // the image's scale at fit: its file's pixels to the screen's
    function fitScale() { var im = zoomEl && zoomEl.querySelector('img'); if (!im || !im.naturalWidth || !im.clientWidth) return 0; return Math.min(im.clientWidth / im.naturalWidth, im.clientHeight / im.naturalHeight); }
    function zoomAt(px, py, f) { var z1 = Math.max(0.5, Math.min(40, zm.z * f)); zm.x = px - (px - zm.x) * z1 / zm.z; zm.y = py - (py - zm.y) * z1 / zm.z; zm.z = z1; paint(); }
    function picXY(e) { var r = zoomEl.parentNode.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; }
    function zoomQ() { if (zm.z <= 1.001) return null; var S = size(); return zm.z.toFixed(2) + ',' + ((S.W / 2 - zm.x) / zm.z / S.W).toFixed(4) + ',' + ((S.H / 2 - zm.y) / zm.z / S.H).toFixed(4); }
    function zoomTo(q) {
      var m = /^([\d.]+),([\d.]+),([\d.]+)$/.exec(q || ''); if (!m || !zoomEl) return;
      var S = size(); zm.z = +m[1]; zm.x = S.W / 2 - (+m[2]) * S.W * zm.z; zm.y = S.H / 2 - (+m[3]) * S.H * zm.z; paint();
    }
    d.addEventListener('wheel', function (e) {
      if (!e.target.closest('.bk-modal-pic')) return;
      // a trackpad's pinch comes as the wheel with ctrl held, and zooms faster than a wheel
      e.preventDefault(); var p = picXY(e); zoomAt(p.x, p.y, Math.exp(-e.deltaY * (e.ctrlKey ? 0.01 : 0.0025)));
    }, { passive: false });
    d.addEventListener('dblclick', function (e) {
      if (!e.target.closest('.bk-modal-pic') || e.target.closest('.bk-nav, .bk-zctl')) return;
      e.preventDefault(); var p = picXY(e); zoomAt(p.x, p.y, 2);
    });
    d.addEventListener('pointerdown', function (e) {
      if (!e.target.closest('.bk-modal-pic') || e.target.closest('.bk-nav, .bk-zctl')) return;
      touches[e.pointerId] = picXY(e); dragged = false;
      var ids = Object.keys(touches);
      drag = ids.length === 1 ? { x0: e.clientX, y0: e.clientY, x: zm.x, y: zm.y } : { pinch: Math.hypot(touches[ids[0]].x - touches[ids[1]].x, touches[ids[0]].y - touches[ids[1]].y) };
    });
    d.addEventListener('pointermove', function (e) {
      if (!drag || !touches[e.pointerId]) return;
      touches[e.pointerId] = picXY(e);
      var ids = Object.keys(touches);
      if (drag.pinch && ids.length === 2) {
        var a = touches[ids[0]], b = touches[ids[1]], dist = Math.hypot(a.x - b.x, a.y - b.y);
        if (drag.pinch > 0) zoomAt((a.x + b.x) / 2, (a.y + b.y) / 2, dist / drag.pinch);
        drag.pinch = dist; dragged = true; return;
      }
      var dx = e.clientX - drag.x0, dy = e.clientY - drag.y0;
      if (Math.abs(dx) + Math.abs(dy) > 4) dragged = true;
      if (dragged) { zm.x = drag.x + dx; zm.y = drag.y + dy; paint(); }
    });
    function up(e) { delete touches[e.pointerId]; if (!Object.keys(touches).length) drag = null; }
    d.addEventListener('pointerup', up); d.addEventListener('pointercancel', up);
    d.addEventListener('click', function (e) {
      // a drag or a pinch is not a click
      if (dragged) { dragged = false; e.stopPropagation(); return; }
      var zc = e.target.closest('[data-zm]');
      if (zc) {
        e.stopPropagation(); var S = size(), k = zc.dataset.zm;
        if (k === '0') { zm = { z: 1, x: 0, y: 0 }; paint(); }
        else if (k === '1') { var f1 = fitScale(); if (f1) zoomAt(S.W / 2, S.H / 2, 1 / (f1 * zm.z)); }
        else zoomAt(S.W / 2, S.H / 2, k === '+' ? 1.5 : 1 / 1.5);
        return;
      }
      var mkc = e.target.closest('.bk-mk, [data-markbtn]');
      if (mkc) { e.stopPropagation(); var fm = col.pages[i].facs; setMark(fm, !marked(fm)); return; }
      var rb = e.target.closest('[data-prate]');
      if (rb) {
        e.stopPropagation();
        // the stars move at once, as Paratexts' do; the group's average when the rating is saved
        var k = +rb.dataset.prate, row = rb.parentNode, on = SW.$$('[data-prate].on', row).length, off = rb.classList.contains('on') && on === k;
        SW.$$('[data-prate]', row).forEach(function (b) { b.classList.toggle('on', !off && +b.dataset.prate <= k); });
        var fx = col.pages[i].facs;
        ratePage(fx, col.vid, k).then(function () { showRating(fx); }, function (err) { showRating(fx); if (err && err.message !== 'no initials') SW.toast(err.message, 5000); });
        return;
      }
      var sh = e.target.closest('[data-share]');
      if (sh) { e.stopPropagation(); SW.copyText(shareLink({ pz: col.pages[i].facs, zm: zoomQ() }), 'the link'); return; }
      var ew = e.target.closest('.bk-else');
      if (ew) { e.stopPropagation(); d.close(); goElsewhere(col, ew.dataset.to); return; }
      var nav = e.target.closest('.bk-nav');
      if (nav) { e.stopPropagation(); if (!nav.disabled) go(+nav.dataset.to); return; }
      var zb = e.target.closest('.bk-z');
      if (zb) { e.stopPropagation(); var at = col.pages[i]; d.close(); toText(col, at, zb.dataset.z); return; }
      var lbm = e.target.closest('.bk-band');
      if (lbm) { e.stopPropagation(); var at2 = col.pages[i]; d.close(); toLine(col, at2, +lbm.dataset.ln); return; }
      var rgm = e.target.closest('.bk-rg');
      if (rgm) { e.stopPropagation(); var at3 = col.pages[i]; d.close(); toRegion(col, at3, +rgm.dataset.rg); return; }
      // only ✕ or a click outside the box (on the backdrop, which is the dialog itself) closes it, and Esc
      if (e.target === d || e.target.closest('[data-x]')) d.close();
    });
    d.addEventListener('keydown', function (e) {
      var dir = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
      if (dir) { e.preventDefault(); go(step(i, dir)); return; }
      if ((e.key === 'b' || e.key === 'B') && !e.target.closest('input, textarea') && col.pages[i].facs) { e.preventDefault(); setMark(col.pages[i].facs, !marked(col.pages[i].facs)); return; }
      if (zoomEl && (e.key === '+' || e.key === '=' || e.key === '-' || e.key === '0')) {
        e.preventDefault(); var S = size();
        if (e.key === '0') { zm = { z: 1, x: 0, y: 0 }; paint(); } else zoomAt(S.W / 2, S.H / 2, e.key === '-' ? 1 / 1.5 : 1.5);
      }
    });
    d.addEventListener('close', function () { d.remove(); });
    fill(i);
    d.showModal(); placeCrop(); paint();
    // a link's zoom, once the image is laid out
    if (zq) { var big0 = d.querySelector('.bk-zoom img'), z0 = function () { requestAnimationFrame(function () { zoomTo(zq); }); }; if (big0.complete) z0(); else big0.addEventListener('load', z0); }
  }
  function spanEl(sp, p, notes) {
    var e = document.createElement('span'), cls = ['bk-s'], title = describe(sp.marks);
    e.textContent = sp.s;
    sp.marks.forEach(function (m) {
      if (CLS[m.k]) cls.push(CLS[m.k]);
      if (m.k === 'hi' && m.rend) String(m.rend).split(/\s+/).forEach(function (r) { if (r) cls.push('bk-' + r.replace(/[^\w-]/g, '')); });
      if (m.k === 'ref' && notes[m.note] != null) e.dataset.note = m.note;
      if ((m.k === 'added' || m.k === 'erased') && m.hand && HANDS[m.hand] && HANDS[m.hand].colour) e.style.setProperty('--hand', HANDS[m.hand].colour);
    });
    e.className = cls.join(' ');
    if (title) e.title = title;
    e.dataset.p = p;
    if (sp.n != null) { e.dataset.n = sp.n; e.dataset.c0 = sp.c0 || 0; e.dataset.c1 = sp.c1 != null ? sp.c1 : (sp.c0 || 0) + sp.s.length; }
    return e;
  }
  var MARGIN = /\b(top|bottom|left|right|margin|above|below|foot|head)\b/;
  function setDoc(doc, p, col) {
    var notes = notesOf(doc), box = SW.el('div', { class: 'bk-page', 'data-p': p }), text = null, cur = null, ZONES = doc.zones || null;
    Object.assign(col.notes, notes);
    // the text in sheets, one to a page, each with the page's image beside it
    function sheet(pg) {
      var sh = SW.el('div', { class: 'bk-sheet' });
      if (pg) pg.sheet = sh;
      text = SW.el('div', { class: 'bk-text' });
      sh.appendChild(text);
      sh.appendChild(pg && pg.has ? figure(pg, col) : SW.el('div', { class: 'bk-fig bk-nofig' }));
      box.appendChild(sh);
    }
    doc.blocks.forEach(function (bl) {
      if (bl.t === 'note') return;
      if (bl.t === 'pb') {
        var pg = { pb: bl, facs: bl.facs, iiif: bl.iiif, img: ownImage(bl), p: p, n0: bl.n0, size: bl.size || null, zones: {}, zoneN: 0, elsewhere: bl.elsewhere || null,
                   lines: bl.lines && bl.lines.length && bl.size ? bl.lines : null, folio: bl.folio, seq: bl.seq, col: col };
        cur = pg;
        pg.has = !!(pg.img || pg.iiif);
        col.pages.push(pg);
        sheet(pg);
        text.appendChild(pg.el = pageBreak(bl, p));
        // the text of (part of) this page transcribed under another: a link to it, with the document's note
        (pg.elsewhere || []).forEach(function (ew) {
          var a = SW.el('button', { class: 'bk-else-link', title: ew.note || ('Transcribed under ' + ew.to) }, '→ ' + ew.to);
          a.onclick = function () { goElsewhere(col, ew.to); };
          pg.el.appendChild(a);
        });
        if (pg.has) {   // with the images folded away, the page's image is one click away here
          var mk = SW.el('button', { class: 'bk-pb-img', title: 'The ' + PAGE + ' ' + (pg.facs || '') + ', larger, with its details' }, '▣');
          mk.onclick = function () { pageBox(col, col.pages.indexOf(pg)); };
          pg.el.appendChild(mk);
        }
        if (bl.n0 != null) col.byLine[p + ':' + bl.n0] = [pg.el];
        return;
      }
      if (!text) sheet(null);
      if (bl.t === 'divider') { text.appendChild(SW.el('hr', { class: 'bk-divider' })); return; }
      var tag = bl.t === 'head' ? 'h3' : bl.t === 'lg' ? 'div' : 'p';
      var el = SW.el(tag, { class: 'bk-' + bl.t + (bl.cont ? ' bk-cont' : '') + (bl.t === 'ab' && MARGIN.test(bl.rend || '') ? ' bk-margin' : '') + (bl.rend ? ' bk-r-' + String(bl.rend).split(/\s+/)[0].replace(/[^\w-]/g, '') : '') });
      if (el.classList.contains('bk-margin')) el.dataset.where = String(bl.rend).replace(/-/g, ' ');
      var mine = [], prev = null, prevN = null;
      bl.spans.forEach(function (sp) {
        if (K.join(prev, sp, prevN)) el.appendChild(document.createTextNode(' '));
        var e = spanEl(sp, p, notes);
        el.appendChild(e);
        e._leaf = cur;
        if (cur && RG) (cur.sp = cur.sp || []).push(e);
        if (cur && cur.lines && sp.n != null) e._ln = sp.n;
        // a substitution's two sides (a deletion and the addition in its place), by its id
        if (cur) sp.marks.forEach(function (q) {
          if (q.k !== 'subst' || !q.id) return;
          var sb = (cur.subst = cur.subst || {})[q.id] = (cur.subst || {})[q.id] || { added: [], erased: [] };
          // the span's own revision is its innermost (marks run outermost first)
          var own = sp.marks.filter(function (r) { return r.k === 'added' || r.k === 'erased'; }).pop();
          if (own) (own.k === 'added' ? sb.added : sb.erased).push(sp.s);
        });
        // the boxes its revisions are written in, on the page it is on
        if (ZONES && cur && cur.size) sp.marks.forEach(function (m) {
          if (!m.zone || !ZONES[m.zone] || (m.k !== 'added' && m.k !== 'erased' && m.k !== 'reinstated')) return;
          var z = cur.zones[m.zone];
          if (!z) { z = cur.zones[m.zone] = { box: ZONES[m.zone], spans: [], at: {}, marks: [], subst: [] }; cur.zoneN++; }
          if (z.spans.indexOf(e) < 0) z.spans.push(e);
          if (z.marks.indexOf(m) < 0) z.marks.push(m);
          // a substitution counts for the box its words' own revision is written in, not a larger one round it
          var own = sp.marks.filter(function (r) { return r.k === 'added' || r.k === 'erased'; }).pop();
          if (own === m) sp.marks.forEach(function (q) { if (q.k === 'subst' && q.id && z.subst.indexOf(q.id) < 0) z.subst.push(q.id); });
          if (m.change && AT[m.change] && (!D.stageHands || !m.hand || D.stageHands.indexOf(m.hand) >= 0)) z.at[AT[m.change]] = true;
          (e._zones = e._zones || []).indexOf(m.zone) < 0 && e._zones.push(m.zone);
          e._pg = cur;
        });
        var x = { el: e, marks: sp.marks, text: /\S/.test(sp.s) };
        col.spans.push(x); mine.push(x);
        if (sp.n != null) { var k = p + ':' + sp.n; (col.byLine[k] = col.byLine[k] || []).push(e); prevN = sp.n; }
        prev = sp.s;
      });
      col.blocks.push({ el: el, spans: mine });
      text.appendChild(el);
    });
    return box;
  }

  // ---------- the text at the slider's stage ----------
  function apply(animate) {
    clearHeld();
    var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    cols.forEach(function (col) {
      col.el.classList.toggle('bk-all', st.all && col.states);
      col.el.classList.toggle('bk-hands', st.hands);
      if (!col.states) return;
      // a span going out fades and closes up, then leaves the line, so the spaces either side of
      // it close up too; one coming in returns to the line, opens, and is marked for a moment
      var arriving = [], leaving = [], hands = D.stageHands || null, strike = st.strike && !st.all;
      col.spans.forEach(function (x) {
        var t = strike ? K.struckAt(x.marks, st.stage, AT, hands) : null;
        x.on = st.all ? true : t ? t.on : K.shownAt(x.marks, st.stage, AT, hands);
        // struck at this stage: a deletion newly made is drawn through as it is reached
        var struck = !!(t && t.struck), wasStruck = x.el.classList.contains('bk-struck');
        if (struck !== wasStruck) {
          x.el.classList.toggle('bk-struck', struck);
          if (struck && animate && !reduce) { x.el.classList.add('bk-strike-in'); (function (e) { setTimeout(function () { e.classList.remove('bk-strike-in'); }, 700); })(x.el); }
        }
        // the revisions made at this very stage, marked more strongly
        x.el.classList.toggle('bk-now', strike && K.madeAt(x.marks, st.stage, AT, hands));
        var was = !x.el.classList.contains('bk-off');
        if (x.on === was) return;
        x.el.classList.remove('bk-new');
        if (x.on) { x.el.classList.remove('bk-gone'); if (animate && !reduce) arriving.push(x.el); else x.el.classList.remove('bk-off'); }
        else { x.el.classList.add('bk-off'); if (animate && !reduce) leaving.push(x.el); else x.el.classList.add('bk-gone'); }
      });
      if (arriving.length) requestAnimationFrame(function () { requestAnimationFrame(function () { arriving.forEach(function (e) { e.classList.remove('bk-off'); e.classList.add('bk-new'); }); }); });
      if (leaving.length) setTimeout(function () { leaving.forEach(function (e) { if (e.classList.contains('bk-off')) e.classList.add('bk-gone'); }); }, 480);
      // a passage with nothing to show at this stage is left out
      col.blocks.forEach(function (bl) { bl.el.hidden = !bl.spans.some(function (x) { return x.on && x.text; }); });
      // on the pages, the boxes of the revisions made at this stage, so the hand is seen moving across
      // the page as the slider moves
      var sNow = st.all ? 0 : st.stage;
      col.pages.forEach(function (pg) {
        if (!pg.zoneN) return;
        var ids = Object.keys(pg.zones), now = ids.filter(function (id) { return sNow > 0 && pg.zones[id].at[sNow]; });
        if (!now.length && !pg.layer) return;
        lightZones(pg, ids, 'bk-zstage', false);
        if (now.length) lightZones(pg, now, 'bk-zstage', true);
      });
    });
    cols.forEach(function (c) { c.stale = true; });
    var lab = SW.$('#bk-stage-l', view); if (lab) lab.textContent = stageName(st.stage);
    var r = SW.$('#bk-stage', view); if (r) { r.value = st.stage; r.disabled = st.all; }
    writeQ();
  }
  function play() {
    if (st.all) { st.all = false; var c = SW.$('#bk-all', view); if (c) c.checked = false; }
    if (st.stage >= STAGES.length) st.stage = 0;
    apply(true);
    st.play = setInterval(function () { if (st.stage >= STAGES.length) { stop(); return; } st.stage++; apply(true); }, 900);
    var p = SW.$('#bk-play', view); if (p) p.textContent = '❚❚';
  }
  function stop() {
    if (st.play) clearInterval(st.play);
    st.play = null;
    var p = SW.$('#bk-play', view); if (p) p.textContent = '▶▶';
  }

  // ---------- the address ----------
  function lineQ(a) { return a ? a.p + ':' + a.n0 + (a.n1 != null && a.n1 !== a.n0 ? '-' + a.n1 : '') : null; }
  function stageQ() { return cols.some(function (c) { return c.states; }) && !st.all ? (st.stage ? (STAGES[st.stage - 1].id || STAGES[st.stage - 1]) : '0') : null; }
  function writeQ() {
    if (SW.state.tab !== 'book') return;
    // the version named is the one whose lines the place numbers: for a version's states, their source
    SW.writeQuery({ v: cols[0] ? cols[0].vid : null, stage: stageQ(), all: st.all && cols.some(function (c) { return c.states; }) ? 1 : null, del: st.strike && cols.some(function (c) { return c.states; }) ? 'strike' : null, bb: st.beside.join(',') || null, img: !st.imgOn ? 'off' : st.imgW !== IMGW0 ? st.imgW : null, l: lineQ(place) });
  }
  // a link to Book as it is set: the version, the stage, the settings, the place, and what is held
  // (the box clicked), with the enlarged page and its zoom where the link is made there (pz, zm)
  function shareLink(extra) {
    var hasStates = cols.some(function (c) { return c.states; });
    var q = { v: cols[0] ? cols[0].vid : SW.state.v, tab: 'book', stage: stageQ(), all: st.all && hasStates ? 1 : null, del: st.strike && hasStates ? 'strike' : null,
      bb: st.beside.join(',') || null, img: !st.imgOn ? 'off' : st.imgW !== IMGW0 ? st.imgW : null, l: lineQ(place), hz: heldZone };
    for (var k in extra || {}) q[k] = extra[k];
    return SW.permalink(q);
  }
  function linkTo(vid, a) { return SW.permalink({ v: vid, tab: 'book', l: lineQ(a), stage: inStates(vid) ? stageQ() : null, all: inStates(vid) && st.all ? 1 : null }); }

  // ---------- the toolbar ----------
  function toolbar(left) {
    var tb = SW.el('div', { class: 'toolbar bk-bar' }), list = texts(), hasStates = cols.some(function (c) { return c.states; });
    var chips = list.map(function (t) { return '<button class="btn' + (t === textOf(left) ? ' on' : '') + '" data-text="' + esc(t) + '">' + esc(textLabel(t)) + '</button>'; }).join('');
    // Compare: a select for each text beside, and one more while there are texts and room
    var others = list.filter(function (t) { return t !== textOf(left); }), slots = st.beside.slice();
    if (slots.length < BESIDE && others.length > slots.length) slots.push('');
    var beside = '<span class="check bk-beside" title="Other texts beside this one, held at the same ' + esc(PAGE) + ' as any is scrolled (Versions ▸ Collate sets two versions out line by line)">Compare ' +
      slots.map(function (cur, i) {
        return (i ? '<span class="faint">and</span> ' : '') + '<select data-slot="' + i + '" aria-label="' + (i ? 'Another text beside' : 'A text beside') + '"><option value="">' + (i ? 'nothing more' : 'with nothing') + '</option>' +
          others.filter(function (t) { return t === cur || st.beside.indexOf(t) < 0; }).map(function (t) { return '<option value="' + esc(t) + '"' + (t === cur ? ' selected' : '') + '>with ' + esc(textLabel(t)) + '</option>'; }).join('') + '</select>';
      }).join(' ') + '</span>';
    tb.innerHTML = '<span class="bk-texts">' + chips + '</span><span class="sep"></span>' + beside + '<span class="sep"></span>' +
      '<span class="bk-imgs" title="The size of the ' + esc(PAGE) + 's’ images beside the text; the eye folds them away (a ▣ at each ' + esc(PAGE) + ' opens one)">Images ' +
        '<input type="range" id="bk-imgw" min="' + IMGW[0] + '" max="' + IMGW[1] + '" step="10" value="' + st.imgW + '" aria-label="Size of the images"' + (st.imgOn ? '' : ' disabled') + '>' +
        '<button class="btn bk-eye" id="bk-imgoff" title="' + (st.imgOn ? 'Hide the images' : 'Show the images') + '" aria-label="' + (st.imgOn ? 'Hide the images' : 'Show the images') + '">' + (st.imgOn ? EYE : EYEOFF) + '</button></span><span class="sep"></span>' +
      '<button class="btn ghost" id="bk-read" title="' + SW.lineWord() + ' at the place shown here, line by line">≡ ' + SW.lineWord() + ' here</button>' +
      '<button class="btn ghost" id="bk-share" title="A link that opens Book here, as it is set: the stage, the settings, the place and the text highlighted">🔗 Share page</button>' +
      '<button class="btn ghost" id="bk-share-hl"' + (rgHeld.length ? '' : ' hidden') + ' title="The highlight held: a picture of the page with its place marked and the passage, to send, or a link that opens it here">✦ Share highlight</button>' +
      '<select id="bk-marks" class="bk-marks" title="The ' + esc(PAGE) + 's you have bookmarked in this text: choose one to go to it"><option value="">🔖 Bookmarks</option></select>' +
      (hasStates && STAGES.length ? '<div class="bk-stages"><button class="btn ghost" id="bk-prev" title="The stage before">◀</button>' +
        '<input type="range" id="bk-stage" min="0" max="' + STAGES.length + '" step="1" value="' + st.stage + '" aria-label="Stage of revision">' +
        '<button class="btn ghost" id="bk-next" title="The stage after">▶</button><button class="btn ghost" id="bk-play" title="Run through the stages, one by one">' + (st.play ? '❚❚' : '▶▶') + '</button>' +
        '<span class="bk-stage-l" id="bk-stage-l"></span>' +
        '<label class="check" title="Deletions made up to this stage struck through, in red (or in the hand’s colour), rather than taken out; the revisions of this stage marked more strongly"><input type="checkbox" id="bk-strike"' + (st.strike ? ' checked' : '') + (st.all ? ' disabled' : '') + '> strike deletions</label>' +
        '<label class="check" title="Every revision at once: additions raised, deletions struck, each with its hand and stage"><input type="checkbox" id="bk-all"' + (st.all ? ' checked' : '') + '> ' + esc((W.all || 'All revisions').toLowerCase()) + '</label>' +
        (Object.keys(HANDS).length ? '<label class="check" title="Revisions coloured by hand"><input type="checkbox" id="bk-hands"' + (st.hands ? ' checked' : '') + '> hands</label>' : '') + '</div>' : '');
    tb.addEventListener('click', function (e) {
      // controls are found by their own ids and attributes, within the toolbar only
      var b0 = e.target.closest('button, input'); if (!b0 || !tb.contains(b0)) return;
      if (b0.id === 'bk-imgoff') {
        st.imgOn = !st.imgOn; showImages();
        imgBtn(b0);
        var r0 = SW.$('#bk-imgw', tb); if (r0) r0.disabled = !st.imgOn;
        writeQ(); return;
      }
      var t = b0.dataset.text != null ? b0 : null;
      if (t) { stop(); var to = t.dataset.text; st.beside = st.beside.filter(function (x) { return x !== to; }); st.own = true; SW.select(to === textOf(SW.state.v) ? SW.state.v : to); return; }
      if (e.target.id === 'bk-prev') { stop(); st.stage = Math.max(0, st.stage - 1); apply(true); }
      if (e.target.id === 'bk-next') { stop(); st.stage = Math.min(STAGES.length, st.stage + 1); apply(true); }
      if (e.target.id === 'bk-play') { if (st.play) stop(); else play(); }
      if (e.target.id === 'bk-share') { SW.copyText(shareLink(), 'the link'); return; }
      if (e.target.id === 'bk-share-hl') { shareHighlight(); return; }
      if (e.target.id === 'bk-read') { var c = cols[0]; if (c) { var a = place || firstLine(c); if (a) SW.openAt(c.vid, a); else SW.setTab('read'); } }
    });
    tb.addEventListener('input', function (e) {
      if (e.target.id === 'bk-stage') { stop(); st.stage = +e.target.value; apply(true); }
      if (e.target.id === 'bk-imgw') { st.imgW = imgw(e.target.value) || IMGW0; SW.store.set('book.imgw', st.imgW); showImages(); writeQ(); }
    });
    // the bookmarks, listed afresh as the list is opened, in the text's order
    var mkSel = SW.$('#bk-marks', tb);
    function listMarks() {
      var c = cols[0], m = marks(), pgs = c ? c.pages.filter(function (pg) { return pg.facs && m[pg.facs]; }) : [];
      mkSel.innerHTML = '<option value="">🔖 Bookmarks' + (pgs.length ? ' (' + pgs.length + ')' : '') + '</option>' +
        (pgs.length ? pgs.map(function (pg) { return '<option value="' + esc(pg.facs) + '">' + esc(pg.facs) + (pg.folio != null ? ' (' + esc((D.folioWord || 'folio') + ' ' + pg.folio) + ')' : '') + '</option>'; }).join('') : '<option value="" disabled>None yet: the bookmark at a ' + esc(PAGE) + '’s top right</option>');
    }
    mkSel.addEventListener('pointerdown', listMarks); mkSel.addEventListener('focus', listMarks);
    tb.addEventListener('change', function (e) {
      if (e.target.id === 'bk-marks') { var to = e.target.value; e.target.value = ''; if (to && cols[0]) { goElsewhere(cols[0], to); writeQ(); } return; }
      if (e.target.id === 'bk-all') { st.all = e.target.checked; stop(); var sk = SW.$('#bk-strike', tb); if (sk) sk.disabled = st.all; apply(false); }
      if (e.target.id === 'bk-strike') { st.strike = e.target.checked; SW.store.set('book.del', st.strike ? 'strike' : ''); apply(true); }
      if (e.target.id === 'bk-hands') { st.hands = e.target.checked; apply(false); }
      if (e.target.dataset.slot != null) {
        var i = +e.target.dataset.slot, val = e.target.value;
        if (val) st.beside[i] = val; else st.beside.splice(i, 1);
        st.besideSet = true;
        draw(SW.state.v);
      }
    });
    return tb;
  }

  // ---------- the columns ----------
  function firstLine(col) { var e = col.el.querySelector('.bk-s[data-n]'); return e ? { p: +e.dataset.p, n0: +e.dataset.n, n1: +e.dataset.n } : null; }
  function column(vid, holder) {
    var col = { vid: vid, states: inStates(vid), spans: [], blocks: [], byLine: {}, notes: {}, pages: [], b: null, el: SW.el('div', { class: 'bk-col' }) };
    col.el.appendChild(SW.el('p', { class: 'hint pad' }, 'Setting the page…'));
    holder.appendChild(col.el);
    col.ready = SW.build(vid).then(function (b) {
      col.b = b;
      col.el.innerHTML = '';
      if (!b.doc || !b.doc.some(Boolean)) { col.el.innerHTML = '<p class="pad hint">' + esc(b.v.label) + ' has no document to set as a page; read it in Read.</p>'; return col; }
      if (cols.length > 1) col.el.appendChild(SW.el('div', { class: 'bk-colhead' }, textLabel(vid)));
      b.doc.forEach(function (doc, p) {
        if (!doc) return;
        if (b.parts.length > 1) col.el.appendChild(SW.el('div', { class: 'bk-part' }, b.parts[p].src.split('/').pop().replace(/\.\w+$/, '').replace(/[-_]/g, ' ')));
        col.el.appendChild(setDoc(doc, p, col));
      });
      return col;
    }).catch(function (e) { col.el.innerHTML = '<p class="pad badge err">' + esc(e.message) + '</p>'; return col; });
    return col;
  }
  // the view: one text, or two facing, at the version open and the place asked for
  function draw(vid) {
    stop(); SW.unpop();
    var left = textOf(vid);
    var known = texts();
    if (!st.besideSet && D.beside) {   // the bench's texts beside, the first left out
      var want = D.beside.length;
      st.beside = D.beside.concat(D.versions || []).filter(function (t, i, a) { return t !== left && a.indexOf(t) === i; }).slice(0, want);
    }
    st.beside = st.beside.filter(function (t, i, a) { return t !== left && a.indexOf(t) === i && known.indexOf(t) >= 0; }).slice(0, BESIDE);
    cols = [];
    view.innerHTML = '';
    var holder = SW.el('div', { class: 'bk-cols' + (st.beside.length ? ' bk-two' : '') + (st.beside.length > 1 ? ' bk-many' : '') + (D.imagesFirst ? ' bk-onefig' : '') });
    holder.style.setProperty('--bk-n', String(st.beside.length + 1));
    view.appendChild(holder);
    cols.push(column(left, holder));
    st.beside.forEach(function (t) { cols.push(column(t, holder)); });
    view.insertBefore(toolbar(vid), holder);
    var top = holder.getBoundingClientRect().top + (window.scrollY || 0);
    holder.style.setProperty('--bk-top', Math.max(0, Math.round(top)) + 'px');
    Promise.all(cols.map(function (c) { return c.ready; })).then(function () {
      apply(false);
      cols.forEach(markNotes);
      wireScroll();
      var where = SW.state.sel ? { vid: SW.state.v, a: SW.state.sel, flash: true } : pending || (place && { vid: cols[0].vid, a: place });
      pending = null;
      if (where && cols[0].b && textOf(where.vid) === cols[0].vid) placeIn(cols[0], where).then(function (a) { if (a) { goTo(cols[0], a, !!where.flash); place = a; writeQ(); } });
      // a shared link: the box it held, held again, and the page it had open, at its zoom
      var sh = shared; shared = null;
      if (sh && cols[0].b) {
        var c0 = cols[0];
        if (sh.hz) c0.pages.some(function (pg) { if (pg.zones[sh.hz]) { toText(c0, pg, sh.hz); return true; } return false; });
        if (sh.pz) { if (c0.stale || !c0.byFacs) measure(c0); var k = c0.byFacs[sh.pz]; if (k != null && c0.pages[k].has) pageBox(c0, k, sh.zm); }
        if (sh.hr && RG) rgOpenHeld(c0, sh.hr);
      }
    });
  }

  // ---------- scrolling: the place, and two texts held at the same page break ----------
  // Each column's page breaks are measured once (their tops, in the column) and looked up as it
  // scrolls; they are measured again only after something changes the page's height: a stage, the
  // images' size, the window's width. A scroll this view makes in the other column is not followed.
  function measure(col) {
    col.tops = col.pages.map(function (pg) { return pg.el ? pg.el.offsetTop : 0; });
    col.byFacs = {}; col.pages.forEach(function (pg, k) { if (pg.facs && col.byFacs[pg.facs] == null) col.byFacs[pg.facs] = k; });
    col.stale = false;
  }
  // the page at a height in the column: the last whose break is at or above it
  function pageAt(col, y) {
    if (col.stale || !col.tops) measure(col);
    var lo = 0, hi = col.tops.length - 1, k = -1;
    while (lo <= hi) { var mid = (lo + hi) >> 1; if (col.tops[mid] <= y) { k = mid; lo = mid + 1; } else hi = mid - 1; }
    return k;
  }
  function topSpan(col) {
    // the line being read: the first at or below the height goTo brings a line to, looked for in the
    // page there and the one after it
    var y = col.el.scrollTop + READ - 8, k = Math.max(0, pageAt(col, y)), r0 = col.el.getBoundingClientRect().top + READ - 8;
    var where = [col.pages[k], col.pages[k + 1]].filter(Boolean).map(function (pg) { return pg.sheet; }).filter(Boolean);
    if (!where.length) where = [col.el];
    for (var w = 0; w < where.length; w++) {
      var es = where[w].querySelectorAll('.bk-s[data-n]');
      for (var i = 0; i < es.length; i++) { var r = es[i].getBoundingClientRect(); if (r.height && r.top >= r0) return es[i]; }
    }
    return null;
  }
  function follow(col, other) {
    var y = col.el.scrollTop + 8, k = pageAt(col, y);
    if (k < 0) return;
    var m = other.stale || !other.tops ? (measure(other), other.byFacs[col.pages[k].facs]) : other.byFacs[col.pages[k].facs];
    if (m == null) return;
    // as far into the matching page as this one is into its own
    var top = col.tops[k], span = (k + 1 < col.tops.length ? col.tops[k + 1] : col.el.scrollHeight) - top;
    var f = span > 0 ? Math.max(0, Math.min(1, (col.el.scrollTop - top) / span)) : 0;
    var mtop = other.tops[m], mspan = (m + 1 < other.tops.length ? other.tops[m + 1] : other.el.scrollHeight) - mtop;
    var to = Math.round(mtop + f * mspan);
    if (Math.abs(other.el.scrollTop - to) < 2) return;
    other.ignore = true;
    other.el.scrollTop = to;
  }
  var placeTimer = null, READ = 60;   // READ: how far below the column's top a line is brought
  window.addEventListener('resize', function () { cols.forEach(function (c) { c.stale = true; }); });
  function wireScroll() {
    cols.forEach(function (col, i) {
      measure(col);
      // the reader's own scrolling (wheel, touch, keys, the scroll bar), not the page settling
      ['wheel', 'touchstart', 'keydown', 'pointerdown'].forEach(function (ev) { col.el.addEventListener(ev, function () { col.moved = true; if (ev !== 'pointerdown') clearHeld(); }, { passive: true }); });
      col.el.onscroll = function () {
        if (col.ignore) { col.ignore = false; return; }   // the other column moved this one
        clearTimeout(placeTimer);
        // the place follows the reader's scrolling, not a jump Book made itself
        placeTimer = setTimeout(function () { if (i === 0 && col.moved) { var e = topSpan(col); place = e ? { p: +e.dataset.p, n0: +e.dataset.n, n1: +e.dataset.n } : null; writeQ(); } }, 250);
        if (cols.length < 2 || col.frame) return;
        col.frame = requestAnimationFrame(function () { col.frame = 0; cols.forEach(function (o) { if (o !== col) follow(col, o); }); });
      };
    });
  }
  // a place in one of the states (its own lines) as a place in the source the column sets: the same
  // block of the document, whose blocks run in parallel from one state to another
  function placeIn(col, where) {
    if (!where || !where.a) return Promise.resolve(null);
    if (where.vid === col.vid || !inStates(where.vid)) return Promise.resolve(where.vid === col.vid ? where.a : null);
    return SW.build(where.vid).then(function (sb) {
      var a = where.a, from = sb.doc && sb.doc[a.p], to = col.b.doc && col.b.doc[a.p];
      if (!from || !to || from.blocks.length !== to.blocks.length) return null;
      for (var i = 0; i < from.blocks.length; i++) {
        var bl = from.blocks[i];
        if (bl.n0 != null && bl.n0 <= a.n0 && a.n0 <= (bl.n1 != null ? bl.n1 : bl.n0)) {
          for (var j = i; j >= 0 && to.blocks[j].n0 == null; j--);
          if (j < 0) return null;
          // in that block and those either side, the line sharing most words with the one asked for,
          // the nearer to where it stands in its own block when two share as many
          var lo = to.blocks.slice(Math.max(0, j - 2), j + 3).filter(function (x) { return x.n0 != null; });
          var t0 = lo[0].n0, t1 = Math.max.apply(null, lo.map(function (x) { return x.n1 != null ? x.n1 : x.n0; }));
          var words = function (n, ls) { return String((ls[n - 1] || {}).raw || '').toLowerCase().match(/[a-z\u00c0-\u024f']+/g) || []; };
          var want = words(a.n0, sb.lines[a.p] || []), guess = to.blocks[j].n0 + (a.n0 - bl.n0), best = guess, most = -1;
          for (var n = t0; n <= t1; n++) {
            var got = words(n, col.b.lines[a.p] || []), c = want.filter(function (w) { return got.indexOf(w) >= 0; }).length;
            if (c > most || (c === most && Math.abs(n - guess) < Math.abs(best - guess))) { most = c; best = n; }
          }
          return { p: a.p, n0: best, n1: best };
        }
      }
      return null;
    }, function () { return null; });
  }
  function goTo(col, a, flash) {
    // the first part of the line in view at this stage, or of the nearest line before it that is
    function shown(es) { return (es || []).filter(function (x) { return !x.classList.contains('bk-gone') && !(x.closest('[hidden]')); })[0]; }
    var e = shown(col.byLine[a.p + ':' + a.n0]);
    for (var n = a.n0 - 1; n >= 1 && !e; n--) e = shown(col.byLine[a.p + ':' + n]);
    if (!e) return;
    col.moved = false;
    col.el.scrollTop = Math.max(0, e.offsetTop - READ);
    if (flash) (col.byLine[a.p + ':' + a.n0] || []).forEach(function (x) { x.classList.add('bk-flash'); setTimeout(function () { x.classList.remove('bk-flash'); }, 1600); });
  }

  // ---------- the group's annotations, on their lines ----------
  function markNotes(col) {
    if (!N || !col.b || !col.b.doc) return;
    N.list(col.vid).then(function (all) {
      SW.$$('.bk-nm', col.el).forEach(function (e) { e.remove(); });
      SW.$$('.bk-noted', col.el).forEach(function (e) { e.classList.remove('bk-noted'); });
      var at = {};
      N.threads(all).filter(function (t) { return t.note.anchor && t.note.source !== 'buildlog'; }).forEach(function (t) {
        var a = t.note.anchor, k = a.p + ':' + a.n0;
        for (var n = a.n0; n <= (a.n1 || a.n0); n++) (col.byLine[a.p + ':' + n] || []).forEach(function (e) { e.classList.add('bk-noted'); });
        (at[k] = at[k] || []).push(t);
      });
      Object.keys(at).forEach(function (k) {
        var es = col.byLine[k]; if (!es) return;
        var m = SW.el('button', { class: 'bk-nm', title: at[k].length + ' annotation' + (at[k].length > 1 ? 's' : '') + ' here' }, '✎' + (at[k].length > 1 ? at[k].length : ''));
        m.onclick = function (e) { e.stopPropagation(); threadsPanel(col, at[k], all); };
        es[0].parentNode.insertBefore(m, es[0]);
      });
    }, function () { /* no group: drafts only, and none to mark */ });
  }
  function threadsPanel(col, ts, all) {
    var body = SW.drawer('Annotations', ts.map(function (t) { return N.renderThread(t, col.b); }).join(''));
    N.wire(body, col.vid, all);
  }
  SW.on('notes', function (vid) { cols.forEach(function (c) { if (c.vid === vid) markNotes(c); }); });

  // ---------- a selection: the lines it covers, to annotate, cite or link ----------
  function spanOf(nd) { var el = nd && (nd.nodeType === 1 ? nd : nd.parentElement); return el && el.closest('#view-book .bk-s'); }
  function keyed(e, dir) {
    // the nearest span with a line, from e in the direction given, within the same page
    var page = e.closest('.bk-page'), all = [].slice.call(page.querySelectorAll('.bk-s')), i = all.indexOf(e);
    for (; i >= 0 && i < all.length; i += dir) if (all[i].dataset.n && !all[i].classList.contains('bk-gone')) return { el: all[i], moved: all[i] !== e };
    return null;
  }
  function info(k, off, end) {
    var d = k.el.dataset;
    return { n: +d.n, c0: +d.c0, c1: +d.c1, off: k.moved ? (end ? null : 0) : off };
  }
  document.addEventListener('mouseup', function (e) {
    if (SW.state.tab !== 'book' || (e.target.closest && e.target.closest('.pop'))) return;
    setTimeout(function () {
      var sel = window.getSelection();
      if (!sel || sel.isCollapsed || !String(sel).trim()) return;
      var rg = sel.getRangeAt(0), sa = spanOf(rg.startContainer), sb = spanOf(rg.endContainer);
      if (!sa || !sb || sa.closest('.bk-col') !== sb.closest('.bk-col') || sa.dataset.p !== sb.dataset.p) return;
      var col = cols.filter(function (c) { return c.el.contains(sa); })[0];
      var ka = keyed(sa, 1), kb = keyed(sb, -1);
      if (!col || !ka || !kb) return;
      var off0 = rg.startContainer.nodeType === 3 ? rg.startOffset : 0, off1 = rg.endContainer.nodeType === 3 ? rg.endOffset : null;
      var s = K.selection(info(ka, off0, false), info(kb, off1, true));
      if (!s) return;
      s.p = +sa.dataset.p;
      selPop(col, s, e.clientX, e.clientY);
    }, 0);
  });
  function selPop(col, s, x, y) {
    var b = col.b, lines = b.lines[s.p] || [];
    var quote = lines.slice(s.n0 - 1, s.n1).map(function (L, i, arr) { var t = L.raw || ''; if (i === arr.length - 1) t = t.slice(0, s.c1); if (i === 0) t = t.slice(s.c0); return t; }).join('\n');
    var cite = SW.cite(b, s.p, s.n0, s.n1), a = { p: s.p, n0: s.n0, n1: s.n1 };
    var pop = SW.pop(x, y, '<div class="bk-selpop"><span class="selref">' + SW.refTag(b.v.id, s.p, s.n0, s.n1, b.parts.length) + '</span>' +
      (N ? '<button class="btn" data-a="note">✎ Annotate</button>' : '') + '<button class="btn" data-a="cite">❝ Copy citation</button>' +
      '<button class="btn" data-a="link">🔗 Copy link</button><button class="btn" data-a="read">≡ ' + SW.lineWord() + '</button>' +
      (SW.dict && SW.dict.list && SW.dict.list().length ? '<button class="btn" data-a="dict" title="The words selected, in the bench’s dictionaries">📕 Look up</button>' : '') +
      (SW.topics && SW.topics.selActs && SW.topics.selActs().length ? '<button class="btn" data-a="topics" title="The passage’s topics, by the topic model in use">🧩 Topics</button>' : '') + '</div>');
    pop.addEventListener('click', function (e) {
      var k = (e.target.closest('[data-a]') || {}).dataset; if (!k) return;
      if (k.a === 'dict') { var ws = SW.dict.selectedWords(); SW.dict.show(ws.length ? ws : quote.split(/\s+/).slice(0, 6), x, y); return; }
      if (k.a === 'topics') { SW.unpop(); SW.topics.forText(quote); return; }
      SW.unpop();
      if (k.a === 'note') N.dialog({ vid: b.v.id, kind: 'line', anchor: { p: s.p, n0: s.n0, n1: s.n1, c0: s.c0, c1: s.c1, src: b.parts[s.p].src }, quote: quote, heading: 'Annotate', anchorText: cite });
      if (k.a === 'cite') SW.copyText(cite, 'the citation');
      if (k.a === 'link') SW.copyText(linkTo(b.v.id, a), 'the link');
      if (k.a === 'read') SW.openAt(b.v.id, a);
    });
  }
  // a reference to a note: the note beside it
  view.addEventListener('click', function (e) {
    var r = e.target.closest('.bk-s[data-note]'); if (!r || String(window.getSelection())) return;
    var col = cols.filter(function (c) { return c.el.contains(r); })[0]; if (!col) return;
    SW.pop(e.clientX, e.clientY, '<div class="bk-notepop">' + esc(col.notes[r.dataset.note] || '') + '</div>');
  });

  // ---------- the view ----------
  function show(b) {
    var vid = b.v.id;
    // opened on a state of the text from elsewhere (Read ▾, a link): the slider starts at that state
    if (!st.own && inStates(vid) && !(st.first && Q0.stage != null)) {
      if (vid === STATES.first) { st.stage = 0; st.all = false; }
      else if (vid === STATES.last) { st.stage = STAGES.length; st.all = false; }
      else if (vid === STATES.source && !(st.first && Q0.all != null)) st.all = true;
    }
    if (st.first && Q0.l && !SW.state.sel) { var m = /^(\d+):(\d+)(?:-(\d+))?$/.exec(Q0.l); if (m) pending = { vid: vid, a: { p: +m[1], n0: +m[2], n1: +(m[3] || m[2]) } }; }
    st.first = false; st.own = false;
    draw(vid);
  }
  // opened again on the version already set: to the line selected in Read, if there is one
  function enter() {
    if (SW.state.sel && cols[0] && cols[0].b && textOf(SW.state.v) === cols[0].vid)
      placeIn(cols[0], { vid: SW.state.v, a: SW.state.sel }).then(function (a) { if (a) { goTo(cols[0], a, true); place = a; } writeQ(); });
    else writeQ();
  }
  SW.views.book = { show: show, enter: enter, hide: function () { stop(); SW.unpop(); } };
  // SW.book.openAt(vid, { p, n0, n1 }, stage): Book on vid, at those lines (selected, as in Read), and
  // at stage (0 before revision, n after the nth of doc.stages) where vid is one of the text's states;
  // a step on the way back (SW.trail)
  K.openAt = function (vid, a, stage) {
    if (SW.trail && SW.state.tab !== 'book') SW.trail.from();
    if (stage != null && STATES && inStates(vid) && !isNaN(+stage)) { st.stage = Math.max(0, Math.min(STAGES.length, Math.round(+stage))); st.all = false; st.own = true; }
    var sel = a ? { p: a.p, n0: a.n0, n1: a.n1 != null ? a.n1 : a.n0 } : null;
    if (vid !== SW.state.v) SW.select(vid, true);
    SW.state.sel = sel;
    var drawn = cols[0] && cols[0].b && cols[0].vid === textOf(vid);
    if (drawn && SW.state.tab === 'book') {
      st.own = false; apply(true);
      if (sel) placeIn(cols[0], { vid: vid, a: sel }).then(function (x) { if (x) { goTo(cols[0], x, true); place = x; writeQ(); } });
      return;
    }
    SW.forget('book');
    SW.trail.quietly(function () { SW.setTab('book'); });
  };

  // Settings ▸ Book: the pages' edges, dragged on a page of the text open in Book (or typed, as a
  // percentage of the page); the bench's (doc.trim) to go back to, and none. Kept in this browser
  if (SW.settings && SW.settings.add) {
    SW.settings.addTab('book', 'Book', 3);
    var SIDES = [['l', 'Left'], ['t', 'Top'], ['r', 'Right'], ['b', 'Bottom']], tv = null;
    var spg = null, dflt = function () { var t = benchTrim(spg) || {}; return { l: t.l || 0, t: t.t || 0, r: t.r || 0, b: t.b || 0 }; };
    var same = function (a, b) { return SIDES.every(function (sd) { return Math.abs(a[sd[0]] - b[sd[0]]) < 0.0005; }); };
    // the page in view in Book's first column, or its first page with an image
    var samplePage = function () {
      var c = cols[0], pgs = (c && c.pages || []).filter(function (pg) { return pg.has; }), at = c && c.el ? c.el.scrollTop + c.el.clientHeight / 3 : 0, best = pgs[0] || null;
      pgs.forEach(function (pg) { if (pg.el && pg.el.offsetTop <= at) best = pg; });
      return best;
    };
    var drawTrim = function () {
      var box = SW.$('#set-trim-pic'); if (!box) return;
      var F = box.querySelector('.bk-tframe'); if (F) { F.style.left = 100 * tv.l + '%'; F.style.top = 100 * tv.t + '%'; F.style.right = 100 * tv.r + '%'; F.style.bottom = 100 * tv.b + '%'; }
      SIDES.forEach(function (sd) { var i = SW.$('#set-trim-' + sd[0]); if (i && document.activeElement !== i) i.value = Math.round(1000 * tv[sd[0]]) / 10; });
      var msg = SW.$('#set-trim-msg'); if (msg) msg.textContent = same(tv, dflt()) ? (D.trim ? 'The bench’s default trim' + (typeof D.trim === 'function' ? ' for this page; it trims each page as that page needs.' : '.') : 'Not trimmed.') : 'Your own trim, the same for every page.';
    };
    SW.settings.add({
      tab: 'book',
      html: '<h2>The pages’ edges</h2><p class="hint">Trim what is not the page, such as a scan’s colour card and ruler, from every page’s image, beside the text and enlarged. Drag an edge of the page, or give each side as a percentage of the page. The boxes and lines on the image keep their places.</p>' +
        '<div class="bk-tset"><div id="set-trim-pic" class="bk-tpic"></div><div class="bk-tnums">' +
        SIDES.map(function (sd) { return '<label><span>' + sd[1] + '</span> <input type="number" id="set-trim-' + sd[0] + '" min="0" max="40" step="0.1"> %</label>'; }).join('') +
        '<p class="row-l"><button type="button" class="btn ghost" id="set-trim-bench">' + (D.trim ? 'Bench’s default trim' : 'Not trimmed') + '</button>' + (D.trim ? ' <button type="button" class="btn ghost" id="set-trim-none">None</button>' : '') + '</p>' +
        '<p class="hint" id="set-trim-msg"></p></div></div>',
      load: function () {
        var box = SW.$('#set-trim-pic'), pg = spg = samplePage(), t = trim(pg);
        tv = t ? { l: t.l, t: t.t, r: t.r, b: t.b } : { l: 0, t: 0, r: 0, b: 0 };
        box.innerHTML = pg ? '<div class="bk-tpage"><img alt="" src="' + esc(pg.img ? (pg.img.large || pg.img.src) : iiifURL(pg.iiif, 600)) + '"><div class="bk-tframe">' +
          SIDES.map(function (sd) { return '<span class="bk-tedge bk-tedge-' + sd[0] + '" data-side="' + sd[0] + '" title="Drag: the ' + sd[1].toLowerCase() + ' edge"></span>'; }).join('') + '</div></div>' :
          '<p class="hint">Open a text in Book to see one of its pages here.</p>';
        var page = box.querySelector('.bk-tpage');
        if (page) page.addEventListener('pointerdown', function (e) {
          var side = e.target.dataset && e.target.dataset.side; if (!side) return;
          e.preventDefault(); e.target.setPointerCapture(e.pointerId);
          var mv = function (ev) {
            var r = page.getBoundingClientRect(), fx = (ev.clientX - r.left) / r.width, fy = (ev.clientY - r.top) / r.height;
            var v = side === 'l' ? fx : side === 'r' ? 1 - fx : side === 't' ? fy : 1 - fy;
            var opp = { l: 'r', r: 'l', t: 'b', b: 't' }[side];
            tv[side] = Math.max(0, Math.min(0.4, 1 - tv[opp] - 0.2, Math.round(v * 1000) / 1000)); drawTrim();
          };
          var up = function () { e.target.removeEventListener('pointermove', mv); e.target.removeEventListener('pointerup', up); };
          e.target.addEventListener('pointermove', mv); e.target.addEventListener('pointerup', up);
        });
        SIDES.forEach(function (sd) { SW.$('#set-trim-' + sd[0]).oninput = function () { tv[sd[0]] = Math.max(0, Math.min(40, +this.value || 0)) / 100; drawTrim(); }; });
        SW.$('#set-trim-bench').onclick = function () { tv = dflt(); drawTrim(); };
        var no = SW.$('#set-trim-none'); if (no) no.onclick = function () { tv = { l: 0, t: 0, r: 0, b: 0 }; drawTrim(); };
        drawTrim();
      },
      // the bench's trim is kept as none of the reader's own, so a change to the bench's reaches them
      save: function () {
        if (!tv) return;
        SW.store.set('book.trim', same(tv, dflt()) ? null : { l: tv.l, t: tv.t, r: tv.r, b: tv.b });
        SW.emit('book-trim');
      }
    });
    // Settings ▸ Book: the highlight links between the text and the page's image, on or off, and their colour
    var lk = null;
    // a CSS colour as #rrggbb, for the colour box
    var toHex = function (c) { var x = document.createElement('canvas').getContext('2d'); x.fillStyle = '#000000'; try { x.fillStyle = c; } catch (e) { /* not a colour */ } return /^#[0-9a-f]{6}$/i.test(x.fillStyle) ? x.fillStyle : '#000000'; };
    var benchHex = function () { return toHex(D.linkColor || getComputedStyle(document.documentElement).getPropertyValue('--amber').trim() || '#a3317a'); };
    var drawLink = function () {
      var i = SW.$('#set-bklink'), demo = SW.$('#set-bklink-demo'), on = SW.$('#set-bklink-on'), msg = SW.$('#set-bklink-msg'); if (!i) return;
      i.value = lk.color || benchHex(); i.disabled = !on.checked; SW.$('#set-bklink-bench').disabled = !on.checked;
      demo.style.backgroundColor = on.checked ? 'color-mix(in srgb, ' + i.value + ' 30%, transparent)' : 'transparent';
      demo.style.outlineColor = on.checked ? i.value : 'transparent';
      msg.textContent = !on.checked ? 'Off: the page’s image is a picture only.' : lk.color ? 'Your own colour.' : D.linkColor ? 'The bench’s default colour.' : 'The theme’s colour.';
    };
    SW.settings.add({
      tab: 'book',
      html: '<h2>Highlight links</h2><p class="hint">A highlight link ties words of the text to their place on the page’s image: the words under the pointer are lit on the image, a place on the image lights its words, and a click holds both. Shown where a text’s pages give the places of their lines, revisions or passages.</p>' +
        '<p class="row-l"><label><input type="checkbox" id="set-bklink-on"> Show highlight links</label></p>' +
        '<p class="row-l"><label>Colour <input type="color" id="set-bklink"></label> <button type="button" class="btn ghost" id="set-bklink-bench">' + (D.linkColor ? 'Bench’s default colour' : 'Theme’s colour') + '</button> <span class="bk-linkdemo" id="set-bklink-demo">a passage lit</span></p>' +
        '<p class="hint" id="set-bklink-msg"></p>',
      load: function () {
        var own = SW.store.get('book.link', null);
        lk = { color: /^#[0-9a-f]{6}$/i.test(own || '') ? own : null };
        var on = SW.$('#set-bklink-on'), i = SW.$('#set-bklink');
        on.checked = linkOn(); on.onchange = drawLink;
        i.oninput = function () { lk.color = i.value; drawLink(); };
        SW.$('#set-bklink-bench').onclick = function () { lk.color = null; drawLink(); };
        drawLink();
      },
      // the bench's colour is kept as none of the reader's own, so a change to the bench's reaches them
      save: function () {
        if (!lk) return;
        var on = SW.$('#set-bklink-on');
        SW.store.set('book.link', lk.color || null);
        if (on) SW.store.set('book.linkOff', !on.checked);
        SW.emit('book-link');
      }
    });
  }
})(typeof window !== 'undefined' ? window : globalThis);
