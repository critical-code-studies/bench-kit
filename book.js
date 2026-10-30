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
 *   - Compare: a second text facing the first, the two held at the same page break (facs) as
 *     either is scrolled.
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
 * The enlarged page zooms as Paratexts' pictures do (a trackpad's pinch, the wheel, a double-click, −
 * and + with the size shown, Fit and 1:1; from half to forty times the fitted size, moved freely), and
 * where doc.image(pb) gives a sharp image as well as src and large, that is fetched as the page opens
 * and put in when it arrives.
 * Where a page break gives the page's lines (pb.lines: [{ n, box: [x0, y0, x1, y1], measured }], in
 * the page's own pixels, n the line number its spans carry), each line has a band on the image, under
 * the revisions' line-sized boxes and over larger ones (a passage added whole), which are reached where
 * no band covers them and from the text: under the pointer it lights its line in the text, and a click highlights it
 * there, as a box does; a band whose place is estimated (measured false) is drawn with a dashed edge,
 * and the enlarged page's details say so. pb.folio and pb.seq (an archive's folio, a sequence number)
 * are shown beside the page's name in those details (SW.BENCH.doc.folioWord names the folio).
 * transcribes under another (pb.elsewhere: [{ to, note }]) has a link to that page by its rule, and
 * the part of its image below its lowest box leads there.
 * Images: a slider for their size, and Off to fold them away (a ▣ at each page break opens one),
 * for both columns, kept for this browser and in the address as img (off, or a width).
 * The state rides in the address: v, tab=book, stage (an id, or 0), all=1, del=strike, bb (the text beside),
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

  // the address as the page was opened, read before the shell rewrites it
  var Q0 = SW.readQuery();
  var st = { stage: STAGES.length, all: false, hands: true, play: null, right: Q0.bb || null, first: true, own: false };
  if (Q0.stage != null && Q0.stage !== '') st.stage = Q0.stage === '0' ? 0 : (AT[Q0.stage] || STAGES.length);
  if (Q0.all === '1') st.all = true;
  // deletions struck in red at the stage, not taken out (Strike deletions): kept for this browser, and in a link as del=strike
  st.strike = Q0.del === 'strike' || (Q0.del == null && SW.store.get('book.del', '') === 'strike');
  // the pages' images: a width (a slider), and on or off (Off folds them away, leaving a ▣ at each
  // page break, and On brings them back at the width they had); kept for this browser, and in a link
  // that asks for it (img=off, or img=a width)
  var IMGW = [100, 560], IMGW0 = 320;
  function imgw(x) { x = Math.round(+x); return x >= IMGW[0] && x <= IMGW[1] ? x : null; }
  st.imgW = imgw(SW.store.get('book.imgw', IMGW0)) || IMGW0;
  st.imgOn = SW.store.get('book.imgon', true) !== false;
  if (Q0.img === 'off') st.imgOn = false;
  else if (Q0.img === 'small') { st.imgOn = true; st.imgW = 150; }   // a link from 0.72
  else if (imgw(Q0.img)) { st.imgOn = true; st.imgW = imgw(Q0.img); }
  function showImages() {
    view.classList.toggle('bk-noimg', !st.imgOn);
    view.style.setProperty('--bk-imgw', st.imgW + 'px');
    (cols || []).forEach(function (c) { c.stale = true; });
  }
  var cols = [], place = null, pending = null, shared = (Q0.pz || Q0.hz) ? { pz: Q0.pz, zm: Q0.zm, hz: Q0.hz } : null;
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
    var btn = SW.el('button', { class: 'bk-fig-b', title: 'The ' + PAGE + ' ' + (pg.facs || '') + ': click to see it larger, with its details' + (pg.zoneN || pg.lines ? '; a box or a line on it: highlight this in panel' : '') });
    var img = SW.el('img', { src: pg.img ? pg.img.src : iiifURL(pg.iiif, 400), alt: PAGE + ' ' + (pg.facs || ''), loading: 'lazy' });
    btn.appendChild(img);
    pg.figBtn = btn; pg.figImg = img;
    img.addEventListener('load', function () { if (pg.layer) fitZones(pg); });
    // the revisions' boxes, drawn when the pointer comes onto the image
    btn.addEventListener('pointerenter', function () { if (pg.zoneN || pg.lines) { zoneLayer(pg, col); fitZones(pg); } });
    btn.onclick = function (e) {
      var z = e.target.closest('.bk-z');
      if (z) { e.preventDefault(); toText(col, pg, z.dataset.z); return; }
      var lb = e.target.closest('.bk-band');
      if (lb) { e.preventDefault(); toLine(col, pg, +lb.dataset.ln); return; }
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
    var L = SW.el('div', { class: 'bk-zl' }), w = pg.size[0], h = pg.size[1], zdiv = {}, ldiv = {};
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
    return { L: L, zdiv: zdiv, ldiv: ldiv };
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
    if (pg.layer || !pg.figBtn || !pg.size) return pg.layer || null;
    var Z = makeZones(pg, true);
    pg.zdiv = Z.zdiv;
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
  // a layer laid over the picture as it is drawn in its image (object-fit: contain)
  function fitLayer(img, L) {
    if (!img || !L || !img.naturalWidth || !img.clientWidth) return;
    var W = img.clientWidth, H = img.clientHeight, s = Math.min(W / img.naturalWidth, H / img.naturalHeight), cw = img.naturalWidth * s, ch = img.naturalHeight * s;
    L.style.left = (img.offsetLeft + (W - cw) / 2) + 'px'; L.style.top = (img.offsetTop + (H - ch) / 2) + 'px';
    L.style.width = cw + 'px'; L.style.height = ch + 'px';
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
    facing(s0, true);
  });
  view.addEventListener('pointerout', function (e) {
    var s0 = e.target.closest && e.target.closest('.bk-s'); if (!s0) return;
    if (s0._zones) lightZones(s0._pg, s0._zones, 'bk-zhover', false);
    facing(s0, false);
  });
  function words(t) { return String(t).toLowerCase().match(/[a-z\u00c0-\u024f']{3,}/g) || []; }
  function facing(s0, on) {
    if (cols.length < 2 || !s0._leaf || !s0._leaf.facs) return;
    var here = cols.filter(function (c) { return c.el.contains(s0); })[0], other = here && cols[1 - cols.indexOf(here)];
    if (!here || here.states || !other || !other.states) return;
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
    cols.forEach(function (c) { c.pages.forEach(function (pg) { if (pg.layer) fitZones(pg); }); });
    var m = SW.$('dialog.bk-modal[open] .bk-modal-pic'); if (m) fitLayer(m.querySelector('img'), m.querySelector('.bk-zl'));
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
      var pg = col.pages[k], b = col.b, next = col.pages[k + 1], n1 = next && next.p === pg.p && next.n0 != null ? next.n0 - 1 : (b.lines[pg.p] || []).length;
      // an archive's folio and sequence beside the page's name (pb.folio, pb.seq)
      var arch = [pg.folio != null ? (D.folioWord || 'folio') + ' ' + pg.folio : '', pg.seq != null ? 'seq. ' + pg.seq : ''].filter(Boolean).join(', ');
      var rows = [[P, esc(pg.facs || '') + (arch ? ' (' + esc(arch) + ')' : '')], ['Text', esc(textLabel(col.vid))]];
      if (b.parts.length > 1) rows.push(['Part', esc(b.parts[pg.p].src.split('/').pop())]);
      if (pg.n0 != null) rows.push(['Lines', (n1 > pg.n0 ? 'll. ' + pg.n0 + '–' + n1 : 'l. ' + pg.n0) + ' ' + SW.refTag(b.v.id, pg.p, pg.n0, Math.max(pg.n0, n1), b.parts.length)]);
      if (pg.lines && pg.lines.some(function (ln) { return !ln.measured; })) rows.push(['Lines on the image', 'Their places are estimated from the revision boxes (dashed where no box lies on the line), so a band may sit a little off the written line.']);
      if (D.imageCredit) rows.push(['Image', D.imageCredit]);
      rows.push(['Source', pg.iiif ? '<a href="' + esc(iiifURL(pg.iiif)) + '" target="_blank" rel="noopener">the full image ↗</a> · <a href="' + esc(pg.iiif.id + '/info.json') + '" target="_blank" rel="noopener">its IIIF service ↗</a>' :
        '<a href="' + esc(pg.img.large || pg.img.src) + '" target="_blank" rel="noopener">the image ↗</a>']);
      var prev = step(k, -1), nxt = step(k, 1), many = prev >= 0 || nxt >= 0;
      rows.push(['Share', '<button class="btn" data-share title="A link that opens Book at this ' + esc(PAGE) + ', as it is set here: the stage, the zoom and the place">🔗 Copy link</button>']);
      d.innerHTML = '<div class="bk-modal-in"><div class="bk-modal-pic"><div class="bk-zoom"><img src="' + esc(pg.img && pg.img.large ? pg.img.large : pg.iiif ? iiifURL(pg.iiif, 1600, 1600) : pg.img.src) + '" alt="' + esc(PAGE + ' ' + (pg.facs || '')) + '"></div>' +
        '<div class="bk-zctl"><button data-zm="-" title="Smaller (−)">−</button><span class="bk-zpc" title="The size it is shown at, of the image file">100%</span><button data-zm="+" title="Larger (+)">+</button><button data-zm="0" class="bk-zw" title="The whole ' + esc(PAGE) + ' (0)">Fit</button><button data-zm="1" class="bk-zw" title="Actual size: a pixel of the image file to a pixel of the screen">1:1</button></div>' +
        (many ? '<button class="bk-nav bk-nav-prev" data-to="' + prev + '"' + (prev < 0 ? ' disabled' : '') + ' title="The ' + esc(PAGE) + ' before" aria-label="The ' + esc(PAGE) + ' before">◀</button>' +
          '<button class="bk-nav bk-nav-next" data-to="' + nxt + '"' + (nxt < 0 ? ' disabled' : '') + ' title="The ' + esc(PAGE) + ' after" aria-label="The ' + esc(PAGE) + ' after">▶</button>' : '') + '</div>' +
        '<div class="bk-modal-meta"><button class="bk-x" data-x title="Close (Esc)" aria-label="Close">✕</button><table>' + rows.map(function (r) { return '<tr><td>' + esc(r[0]) + '</td><td>' + r[1] + '</td></tr>'; }).join('') + '</table>' +
        '<p class="hint">Wheel, pinch or + −: zoom; drag: move. ' + (pg.zoneN || pg.lines ? 'A box or a line on the image: its text by the pointer; a click: highlight this in panel. ' : '') + (many ? '◀ ▶ or the arrow keys: the ' + esc(PAGE) + ' before or after. ' : '') + '✕, Esc or a click beside the image: close.</p></div></div>';
      zoomEl = d.querySelector('.bk-zoom'); zm = { z: 1, x: 0, y: 0 }; paint();
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
      if ((pg.zoneN || pg.lines) && pg.size) {
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
    // as Paratexts' pictures (kit/paratexts.js, zoomBox): from half to forty times the size it fits at,
    // moved freely at any size, drawn at most once a frame; the share link's zm keeps its form
    var raf = 0;
    function paintNow() {
      if (!zoomEl) return;
      zm.z = Math.max(0.5, Math.min(40, zm.z));
      zoomEl.style.transform = 'translate(' + zm.x + 'px,' + zm.y + 'px) scale(' + zm.z + ')';
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
      if (e.target.closest('a, .swref')) return;
      // the image itself, zoomed, is for moving about in: only a click beside it closes the view
      if (zm.z > 1.001 && e.target.closest('.bk-modal-pic')) return;
      d.close();
    });
    d.addEventListener('keydown', function (e) {
      var dir = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
      if (dir) { e.preventDefault(); go(step(i, dir)); return; }
      if (zoomEl && (e.key === '+' || e.key === '=' || e.key === '-' || e.key === '0')) {
        e.preventDefault(); var S = size();
        if (e.key === '0') { zm = { z: 1, x: 0, y: 0 }; paint(); } else zoomAt(S.W / 2, S.H / 2, e.key === '-' ? 1 / 1.5 : 1.5);
      }
    });
    d.addEventListener('close', function () { d.remove(); });
    fill(i);
    d.showModal();
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
        var pg = { facs: bl.facs, iiif: bl.iiif, img: ownImage(bl), p: p, n0: bl.n0, size: bl.size || null, zones: {}, zoneN: 0, elsewhere: bl.elsewhere || null,
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
    SW.writeQuery({ v: cols[0] ? cols[0].vid : null, stage: stageQ(), all: st.all && cols.some(function (c) { return c.states; }) ? 1 : null, del: st.strike && cols.some(function (c) { return c.states; }) ? 'strike' : null, bb: st.right, img: !st.imgOn ? 'off' : st.imgW !== IMGW0 ? st.imgW : null, l: lineQ(place) });
  }
  // a link to Book as it is set: the version, the stage, the settings, the place, and what is held
  // (the box clicked), with the enlarged page and its zoom where the link is made there (pz, zm)
  function shareLink(extra) {
    var hasStates = cols.some(function (c) { return c.states; });
    var q = { v: cols[0] ? cols[0].vid : SW.state.v, tab: 'book', stage: stageQ(), all: st.all && hasStates ? 1 : null, del: st.strike && hasStates ? 'strike' : null,
      bb: st.right, img: !st.imgOn ? 'off' : st.imgW !== IMGW0 ? st.imgW : null, l: lineQ(place), hz: heldZone };
    for (var k in extra || {}) q[k] = extra[k];
    return SW.permalink(q);
  }
  function linkTo(vid, a) { return SW.permalink({ v: vid, tab: 'book', l: lineQ(a), stage: inStates(vid) ? stageQ() : null, all: inStates(vid) && st.all ? 1 : null }); }

  // ---------- the toolbar ----------
  function toolbar(left) {
    var tb = SW.el('div', { class: 'toolbar bk-bar' }), list = texts(), hasStates = cols.some(function (c) { return c.states; });
    var chips = list.map(function (t) { return '<button class="btn' + (t === textOf(left) ? ' on' : '') + '" data-text="' + esc(t) + '">' + esc(textLabel(t)) + '</button>'; }).join('');
    var beside = '<label class="check" title="A second text facing this one, held at the same ' + esc(PAGE) + ' as either is scrolled (Versions ▸ Collate sets two versions out line by line)">Compare <select id="bk-right"><option value="">with nothing</option>' +
      list.filter(function (t) { return t !== textOf(left); }).map(function (t) { return '<option value="' + esc(t) + '"' + (t === st.right ? ' selected' : '') + '>with ' + esc(textLabel(t)) + '</option>'; }).join('') + '</select></label>';
    tb.innerHTML = '<span class="bk-texts">' + chips + '</span><span class="sep"></span>' + beside + '<span class="sep"></span>' +
      '<span class="bk-imgs" title="The size of the ' + esc(PAGE) + 's’ images beside the text; Off folds them away (a ▣ at each ' + esc(PAGE) + ' opens one)">Images ' +
        '<input type="range" id="bk-imgw" min="' + IMGW[0] + '" max="' + IMGW[1] + '" step="10" value="' + st.imgW + '" aria-label="Size of the images"' + (st.imgOn ? '' : ' disabled') + '>' +
        '<button class="btn' + (st.imgOn ? '' : ' on') + '" id="bk-imgoff" aria-pressed="' + !st.imgOn + '" title="' + (st.imgOn ? 'Fold the images away' : 'Show the images again') + '">Off</button></span><span class="sep"></span>' +
      '<button class="btn ghost" id="bk-read" title="Read at the place shown here, line by line">≡ Read here</button>' +
      '<button class="btn ghost" id="bk-share" title="A link that opens Book here, as it is set: the stage, the settings, the place and the text highlighted">🔗 Share</button>' +
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
        st.imgOn = !st.imgOn; SW.store.set('book.imgon', st.imgOn); showImages();
        b0.classList.toggle('on', !st.imgOn); b0.setAttribute('aria-pressed', String(!st.imgOn)); b0.title = st.imgOn ? 'Fold the images away' : 'Show the images again';
        var r0 = SW.$('#bk-imgw', tb); if (r0) r0.disabled = !st.imgOn;
        writeQ(); return;
      }
      var t = b0.dataset.text != null ? b0 : null;
      if (t) { stop(); var to = t.dataset.text; if (to === st.right) st.right = null; st.own = true; SW.select(to === textOf(SW.state.v) ? SW.state.v : to); return; }
      if (e.target.id === 'bk-prev') { stop(); st.stage = Math.max(0, st.stage - 1); apply(true); }
      if (e.target.id === 'bk-next') { stop(); st.stage = Math.min(STAGES.length, st.stage + 1); apply(true); }
      if (e.target.id === 'bk-play') { if (st.play) stop(); else play(); }
      if (e.target.id === 'bk-share') { SW.copyText(shareLink(), 'the link'); return; }
      if (e.target.id === 'bk-read') { var c = cols[0]; if (c) { var a = place || firstLine(c); if (a) SW.openAt(c.vid, a); else SW.setTab('read'); } }
    });
    tb.addEventListener('input', function (e) {
      if (e.target.id === 'bk-stage') { stop(); st.stage = +e.target.value; apply(true); }
      if (e.target.id === 'bk-imgw') { st.imgW = imgw(e.target.value) || IMGW0; SW.store.set('book.imgw', st.imgW); showImages(); writeQ(); }
    });
    tb.addEventListener('change', function (e) {
      if (e.target.id === 'bk-all') { st.all = e.target.checked; stop(); var sk = SW.$('#bk-strike', tb); if (sk) sk.disabled = st.all; apply(false); }
      if (e.target.id === 'bk-strike') { st.strike = e.target.checked; SW.store.set('book.del', st.strike ? 'strike' : ''); apply(true); }
      if (e.target.id === 'bk-hands') { st.hands = e.target.checked; apply(false); }
      if (e.target.id === 'bk-right') { st.right = e.target.value || null; draw(SW.state.v); }
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
    if (st.right === left) st.right = null;
    cols = [];
    view.innerHTML = '';
    var holder = SW.el('div', { class: 'bk-cols' + (st.right ? ' bk-two' : '') });
    view.appendChild(holder);
    cols.push(column(left, holder));
    if (st.right) cols.push(column(st.right, holder));
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
        col.frame = requestAnimationFrame(function () { col.frame = 0; follow(col, cols[1 - i]); });
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
      '<button class="btn" data-a="link">🔗 Copy link</button><button class="btn" data-a="read">≡ Read</button></div>');
    pop.addEventListener('click', function (e) {
      var k = (e.target.closest('[data-a]') || {}).dataset; if (!k) return;
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
})(typeof window !== 'undefined' ? window : globalThis);
