/*
 * vt-reader.js - a translation made by the vector translation method
 * (github.com/vector-humanities/vector-translation), read for a bench: its texts as lines and pages,
 * its glossary, its change lists, and the source text where the repository holds one. Nothing here
 * knows any one translation: what differs is in the bench's descriptor (SW.BENCH.translation, or
 * the argument given to SWVT.layout), and the defaults are the method's layout.
 *
 * The descriptor (every field optional except where a translation departs from the layout):
 *   literal, readable  [paths] of the two versions, in reading order (default text/literal/*.md and
 *                      text/readable/*.md, listed by the bench or by tools/vt-index.js)
 *   glossary           { path, kind: 'csv' | 'md' }: the method's glossary.csv, or a Markdown table
 *                      (Japanese | Reading | English) under a heading named in `heading`
 *   changes            [paths] of change lists (method format; also the older forms named below)
 *   ocr                { path, split: RegExp with the image number in group 1 }: the source as OCR,
 *                      for search only
 *   page               the page marker, a RegExp source with the page in group 1 (book.toml
 *                      [markers] page; default '\[p\. (\d+)\]')
 *   image              the image marker, a RegExp source with the image number in group 1
 *                      (Kuki: '\[コマ (\d+)\]'), or none
 *   body               { until: RegExp source of the heading where the apparatus begins }
 *   exclude            [path prefixes] never read into a snapshot (tools/vt-index.js refuses them)
 *
 * A text is read a line of its file to a line of the bench (the kit's unit), so a reference to a
 * line is a reference to the file at the commit the bench holds. Each line is classified:
 *   head (level, title, orig: the source's title in brackets, image range), para, note (a
 *   footnote's definition: label), fig (an image line), caption, rule, working (inside
 *   <!-- working -->), fence (::: lines), table, blank
 * and the markers in it are found with their columns, so a page break can fall inside a paragraph.
 *
 * SWVT (pure; node and the browser):
 *   layout(desc)                    the descriptor with the method's defaults filled in
 *   read(raw, desc)                 { lines: [{ n, raw, kind, … }], pages: [{ page, n, c }],
 *                                     images: [{ img, n, c }], sections: [{ n, level, title, … }],
 *                                     notes: { label: n }, refs: [{ label, n, c }], bodyEnd: n }
 *   pageAt(t, n, c)                 the page a place in the text is on
 *   inline(s)                       a line's text as spans: [{ s, c0, c1, marks }] (markers taken
 *                                     out; italic, bold, note references, insertions 〔 〕, notes 〔Tr.: 〕)
 *   doc(t, o)                       the text as Book's document (kit/book.js): head, p and note
 *                                     blocks, a page break (pb, facs = the page) where a page begins
 *   glossary(raw, kind)             [{ source: [..], reading: [..], english: [..], note, competitors,
 *                                     scope, decided, n }]
 *   changes(raw, file)              [{ file, n, target, page, kind, old, new, src, why, origin, part }]
 *   applied(ch, texts)              'applied' | 'pending' | 'both' | 'gone': NEW and OLD looked for in
 *                                     the target version's current text, paragraph by paragraph
 *   ocr(raw, split)                 [{ img, text }]
 *   fold(s)                         a Japanese string with old character forms made new (kyūjitai →
 *                                     shinjitai), for search and lookup
 *   search(pages, q, o)             hits of a source word in OCR pages, exact after folding, or with
 *                                     one character wrong in three or more (o.fuzzy)
 * Part of bench-kit (github.com/critical-code-studies/bench-kit).
 */
(function (root) {
  'use strict';
  var VT = {};

  var DEFAULTS = {
    literal: ['text/literal/*.md'], readable: ['text/readable/*.md'],
    glossary: { path: 'glossary.csv', kind: 'csv' },
    changes: ['checks/*.md'], page: '\\[p\\. (\\d+)\\]', image: null,
    body: { until: '^#+ (Appendix|Glossary)' },
    exclude: ['corpus/texts/', 'references/']
  };
  VT.layout = function (desc) {
    var d = {}, k;
    for (k in DEFAULTS) d[k] = DEFAULTS[k];
    for (k in (desc || {})) if (desc[k] !== undefined) d[k] = desc[k];
    return d;
  };

  function splitLines(t) { var ls = String(t || '').replace(/\r\n?/g, '\n').split('\n'); if (ls.length > 1 && ls[ls.length - 1] === '') ls.pop(); return ls; }
  VT.splitLines = splitLines;
  function re(src, flags) { return src instanceof RegExp ? new RegExp(src.source, flags) : new RegExp(src, flags); }

  // ---------- a text ----------
  VT.read = function (raw, desc) {
    var d = VT.layout(desc), PG = re(d.page, 'g'), IM = d.image ? re(d.image, 'g') : null;
    var until = d.body && d.body.until ? re(d.body.until) : null;
    var t = { lines: [], pages: [], images: [], sections: [], notes: {}, refs: [], bodyEnd: null };
    var working = false, fence = false;
    splitLines(raw).forEach(function (s, i) {
      var n = i + 1, L = { n: n, raw: s, kind: 'para' }, m;
      if (/^<!--\s*working\s*-->/.test(s)) { working = true; L.kind = 'working'; }
      else if (working) { L.kind = 'working'; if (/<!--\s*\/working\s*-->/.test(s)) working = false; }
      else if (/^\s*$/.test(s)) L.kind = 'blank';
      else if (/^:::/.test(s)) { L.kind = 'fence'; fence = !fence && !/^:::\s*$/.test(s); }
      else if ((m = /^(#{1,6})\s+(.*)$/.exec(s))) {
        L.kind = 'head'; L.level = m[1].length;
        var title = m[2].replace(/\s*\{[^}]*\}\s*$/, ''), im = /\s*\[コマ ([^\]]*)\]\s*$/.exec(title);
        if (im) { L.imageRange = im[1]; title = title.slice(0, im.index); }
        var orig = /\s*\(([^()]*[　-鿿][^()]*)\)\s*$/.exec(title);
        if (orig) { L.orig = orig[1]; title = title.slice(0, orig.index); }
        L.title = title.trim();
        if (until && until.test(s) && t.bodyEnd == null) t.bodyEnd = n;
        t.sections.push({ n: n, level: L.level, title: L.title, orig: L.orig || null });
      }
      else if ((m = /^\[\^([^\]]+)\]:\s?/.exec(s))) { L.kind = 'note'; L.label = m[1]; t.notes[m[1]] = n; }
      else if (/^!\[[^\]]*\]\([^)]*\)/.test(s)) { L.kind = 'fig'; L.src = /\(([^)\s]*)/.exec(s)[1]; }
      else if (/^\*\*Figure \d+\.\*\*/.test(s)) L.kind = 'caption';
      else if (/^\|/.test(s)) L.kind = 'table';
      else if (/^(\* \* \*|· · ·|---+)\s*$/.test(s)) L.kind = 'rule';
      if (L.kind !== 'working') {
        PG.lastIndex = 0;
        while ((m = PG.exec(s))) t.pages.push({ page: +m[1], n: n, c: m.index, len: m[0].length });
        if (IM) { IM.lastIndex = 0; while ((m = IM.exec(s))) t.images.push({ img: +m[1], n: n, c: m.index, len: m[0].length }); }
        var R = /\[\^([^\]]+)\](?!:)/g;
        while ((m = R.exec(s))) t.refs.push({ label: m[1], n: n, c: m.index });
      }
      t.lines.push(L);
    });
    if (t.bodyEnd == null) t.bodyEnd = t.lines.length + 1;
    // the section each line is in: the nearest heading above it, by level
    var stack = [];
    t.lines.forEach(function (L) {
      if (L.kind === 'head') { while (stack.length && stack[stack.length - 1].level >= L.level) stack.pop(); stack.push(L); }
      L.sec = stack.map(function (h) { return h.n; });
    });
    return t;
  };

  // the page a place is on: the last page marker at or before it (null before the first)
  VT.pageAt = function (t, n, c) {
    var p = null;
    for (var i = 0; i < t.pages.length; i++) {
      var g = t.pages[i];
      if (g.n < n || (g.n === n && g.c <= (c || 0))) p = g.page; else break;
    }
    return p;
  };
  // every page's first and last line
  VT.pageLines = function (t) {
    var out = {};
    t.pages.forEach(function (g, i) {
      var nx = t.pages[i + 1];
      out[g.page] = { n0: g.n, c0: g.c, n1: nx ? nx.n : Math.min(t.bodyEnd - 1, t.lines.length), c1: nx ? nx.c : null };
    });
    return out;
  };

  // ---------- a line as spans ----------
  // Markers ([p. N], [コマ N]) leave the text; *italic*, **bold**, [^note], 〔insertion〕 and
  // 〔Tr.: note〕 become marks. Each span keeps its columns in the raw line (c0, c1).
  VT.inline = function (s, o) {
    o = o || {};
    var tokens = [], R = /(\*\*[^*]+\*\*)|(\*[^*\s][^*]*\*)|(\[\^[^\]]+\])|(〔Tr\.:[^〕]*〕)|(〔[^〕]*〕)|(\[p\. \d+\])|(\[コマ [^\]]*\])/g, m, at = 0;
    function plain(a, b, marks) { if (b > a) tokens.push({ s: s.slice(a, b), c0: a, c1: b, marks: marks || [] }); }
    while ((m = R.exec(s))) {
      plain(at, m.index);
      var x = m[0], a = m.index, b = a + x.length;
      if (m[1]) plain(a + 2, b - 2, [{ k: 'hi', rend: 'bold' }]);
      else if (m[2]) plain(a + 1, b - 1, [{ k: 'hi', rend: 'italic' }]);
      else if (m[3]) tokens.push({ s: '', c0: a, c1: b, marks: [{ k: 'ref', note: x.slice(2, -1) }] });
      else if (m[4]) plain(a, b, [{ k: 'supplied', note: true }]);
      else if (m[5]) plain(a, b, [{ k: 'supplied' }]);
      else tokens.push({ s: '', c0: a, c1: b, marker: x });
      at = b;
    }
    plain(at, s.length);
    return tokens;
  };

  // ---------- Book's document ----------
  // A head, p or note block to a line; a paragraph is divided where a page begins inside it, the
  // second part marked cont. A page break block: t 'pb', facs (the page, as text), n0, n1 (its line),
  // img (the image number the text gives at that page, where it gives one).
  VT.doc = function (t, o) {
    o = o || {};
    var blocks = [], pagesAt = {}, imgsAt = {};
    t.pages.forEach(function (g) { (pagesAt[g.n] = pagesAt[g.n] || []).push(g); });
    t.images.forEach(function (g) { (imgsAt[g.n] = imgsAt[g.n] || []).push(g); });
    var lastImg = null;
    t.lines.forEach(function (L) {
      if (L.kind === 'blank' || L.kind === 'working' || L.kind === 'fence') return;
      if (o.bodyOnly && L.n >= t.bodyEnd) return;
      var tks = VT.inline(L.raw), cur = null, cont = false, kind = L.kind === 'head' ? 'head' : L.kind === 'note' ? 'note' : 'p';
      function open() { cur = { t: kind, n0: L.n, n1: L.n, spans: [], cont: cont || undefined, level: L.level, id: L.label }; blocks.push(cur); }
      tks.forEach(function (tk) {
        if (tk.marker && /^\[p\./.test(tk.marker)) {
          var g = (pagesAt[L.n] || []).filter(function (x) { return x.c === tk.c0; })[0];
          var im = (imgsAt[L.n] || []).filter(function (x) { return x.c > tk.c0 && x.c < tk.c0 + 20; })[0];
          if (im) lastImg = im.img;
          if (cur && cur.spans.some(function (sp) { return sp.s.trim(); })) cont = true; else if (cur) { blocks.pop(); }
          blocks.push({ t: 'pb', facs: String(g ? g.page : tk.marker.replace(/\D/g, '')), n0: L.n, n1: L.n, img: lastImg, spans: [] });
          cur = null; return;
        }
        if (tk.marker) return;
        if (!cur) open();
        tk.n = L.n; cur.spans.push(tk);
      });
      if (cur && !cur.spans.length) blocks.pop();
    });
    // a heading's spans lose its # marks and any {attributes}; its title, the source's title and the
    // image range are kept on the block as well
    blocks.forEach(function (bl) {
      if (bl.t !== 'head') return;
      var L = t.lines[bl.n0 - 1]; bl.title = L.title; bl.orig = L.orig; bl.imageRange = L.imageRange;
      var f = bl.spans[0];
      if (f) { var m = /^#{1,6}\s+/.exec(f.s); if (m) { f.s = f.s.slice(m[0].length); f.c0 += m[0].length; } }
      var z = bl.spans[bl.spans.length - 1];
      if (z) { var a = /\s*\{[^}]*\}\s*$/.exec(z.s) || /\s+$/.exec(z.s); if (a) { z.s = z.s.slice(0, a.index); z.c1 = z.c0 + z.s.length; } }
      bl.spans = bl.spans.filter(function (sp) { return sp.s || (sp.marks || []).length; });
      var y = bl.spans[bl.spans.length - 1];
      if (y && /\s+$/.test(y.s)) { y.s = y.s.replace(/\s+$/, ''); y.c1 = y.c0 + y.s.length; }
    });
    return { blocks: blocks };
  };

  // ---------- the glossary ----------
  function csvRows(raw) {
    var rows = [], row = [], f = '', q = false, i, c;
    raw = String(raw || '').replace(/\r\n?/g, '\n');
    for (i = 0; i < raw.length; i++) {
      c = raw[i];
      if (q) { if (c === '"' && raw[i + 1] === '"') { f += '"'; i++; } else if (c === '"') q = false; else f += c; }
      else if (c === '"') q = true;
      else if (c === ',') { row.push(f); f = ''; }
      else if (c === '\n') { row.push(f); rows.push(row); row = []; f = ''; }
      else f += c;
    }
    if (f || row.length) { row.push(f); rows.push(row); }
    return rows;
  }
  VT.csv = csvRows;
  // an English cell: renderings separated by ; (or / where the source cell pairs terms), the words
  // in brackets a note
  function renderings(cell) {
    var note = [], s = String(cell || '').replace(/\s*\(([^()]*)\)/g, function (_, x) { note.push(x); return ''; });
    return { list: s.split(/\s*;\s*/).map(function (x) { return x.replace(/\*/g, '').trim(); }).filter(Boolean), note: note.join('; ') };
  }
  VT.glossary = function (raw, kind, o) {
    o = o || {};
    var out = [];
    if (kind === 'md') {
      var lines = splitLines(raw), on = !o.heading, n = 0;
      lines.forEach(function (s, i) {
        if (o.heading && /^#+\s/.test(s)) on = s.replace(/^#+\s*/, '').trim() === o.heading;
        if (!on || !/^\|/.test(s) || /^\|\s*-/.test(s)) return;
        var cells = s.replace(/^\||\|\s*$/g, '').split('|').map(function (x) { return x.trim(); });
        if (/^(Japanese|Source|German)$/i.test(cells[0])) return;
        n++;
        var src = cells[0].split(/\s*\/\s*/), rd = (cells[1] || '').split(/\s*\/\s*/), en = renderings(cells[2]);
        // a pair (存在 / 非存在 … existence / non-existence): one row to each source term
        var enParts = en.list.length === 1 ? en.list[0].split(/\s*\/\s*/) : null;
        if (src.length > 1 && enParts && enParts.length === src.length) {
          src.forEach(function (sw, k) { out.push({ source: [sw], reading: rd[k] ? [rd[k]] : [], english: [enParts[k]], note: en.note, n: i + 1, row: n }); });
        } else out.push({ source: src, reading: rd, english: en.list, note: en.note, n: i + 1, row: n });
      });
      return out;
    }
    var rows = csvRows(raw), head = rows.shift() || [];
    var col = function (name) { return head.indexOf(name); };
    rows.forEach(function (r, i) {
      if (!r.join('').trim()) return;
      var get = function (name) { var k = col(name); return k < 0 ? '' : (r[k] || '').trim(); };
      out.push({
        source: [get('source')], reading: get('reading') ? [get('reading')] : [], english: get('english').split(/\s*;\s*/).filter(Boolean),
        competitors: get('competitors').split(/\s*;\s*/).filter(Boolean), scope: get('scope'), decided: get('decided'), note: get('notes'), n: i + 2, row: i + 1
      });
    });
    return out;
  };
  // English words that render more than one source term (ground: 根據 and 理由)
  VT.collisions = function (gl) {
    var by = {};
    gl.forEach(function (g) { g.english.forEach(function (e) { var k = e.toLowerCase(); (by[k] = by[k] || []).push(g); }); });
    return Object.keys(by).filter(function (k) {
      var srcs = {}; by[k].forEach(function (g) { srcs[g.source.join('/')] = 1; }); return Object.keys(srcs).length > 1;
    }).map(function (k) { return { english: k, terms: by[k] }; });
  };

  // ---------- change lists ----------
  // The method's form (templates/change-list.md):
  //   ### readable | p. 123      (target and a page or label, either order)
  //   OLD: … NEW: … SRC: … WHY: … ORIGIN: internal | witness <ID>    (multi-line in ~~~ fences)
  // and the older forms of the first run: JP: for SRC; '### p. 50 | CHANGES' (the read-through's
  // kinds: ADDS, DROPS, CHANGES, RULE; the target is then the readable); a '## Literal problems'
  // section of bullets (each kept as a note on the literal, not a change); '## Summary' ends a list.
  var KINDS = /^(ADDS|DROPS|CHANGES|RULE|POEM)$/;
  VT.changes = function (raw, file, o) {
    o = o || {};
    var out = [], cur = null, field = null, fenced = false, part = null, problems = false;
    splitLines(raw).forEach(function (s, i) {
      var n = i + 1, m;
      if (fenced) { if (/^~~~\s*$/.test(s)) { fenced = false; field = null; } else cur[field] += (cur[field] ? '\n' : '') + s; return; }
      if ((m = /^##\s+(.*)$/.exec(s)) && !/^###/.test(s)) {
        cur = null; part = m[1].trim(); problems = /^Literal problems/i.test(part);
        if (/^Summary/i.test(part)) part = '#summary';
        return;
      }
      if (part === '#summary') return;
      if (problems && (m = /^-\s+(.*)$/.exec(s))) {
        var pm = /^p\.\s*(\d+)/.exec(m[1]);
        out.push({ file: file, n: n, target: 'literal', page: pm ? +pm[1] : null, kind: 'PROBLEM', note: m[1], old: '', new: '', src: '', why: '', origin: o.origin || null, part: part });
        return;
      }
      if ((m = /^###\s+(.*)$/.exec(s))) {
        cur = { file: file, n: n, target: o.target || null, page: null, label: null, kind: null, old: '', new: '', src: '', why: '', origin: o.origin || null, part: part };
        m[1].split('|').map(function (x) { return x.trim(); }).forEach(function (h) {
          var pg = /^p\.\s*(\d+)/.exec(h);
          if (pg) cur.page = +pg[1];
          else if (KINDS.test(h)) cur.kind = h;
          else if (/^(readable|literal)$/i.test(h)) cur.target = h.toLowerCase();
          else if (h) cur.label = h;
        });
        if (!cur.target) cur.target = 'readable';
        out.push(cur); field = null; return;
      }
      if (!cur) return;
      if ((m = /^(OLD|NEW|SRC|JP|WHY|ORIGIN):\s?(.*)$/.exec(s))) {
        field = { OLD: 'old', NEW: 'new', SRC: 'src', JP: 'src', WHY: 'why', ORIGIN: 'origin' }[m[1]];
        if (m[2] === '' && field !== 'origin') return;
        if (field === 'origin') { cur.origin = m[2].trim(); field = null; return; }
        cur[field] = m[2]; return;
      }
      if (/^~~~\s*$/.test(s) && field) { fenced = true; cur[field] = ''; return; }
      if (field && field !== 'origin' && s.trim() && !/^###/.test(s)) cur[field] += ' ' + s.trim();
    });
    return out.filter(function (c) { return c.kind === 'PROBLEM' || c.old || c.new; });
  };
  // the origin as the method counts it: internal, witness (with its ID), or unmarked
  VT.originOf = function (c) {
    var o = String(c.origin || '').trim();
    if (!o) return { k: 'unmarked' };
    var w = /^witness\s+(.+)$/i.exec(o);
    return w ? { k: 'witness', id: w[1].trim() } : { k: /^internal/i.test(o) ? 'internal' : o };
  };
  // whether a change is in the text now: NEW there and OLD not ('applied'), OLD there and NEW not
  // ('pending'), both ('both'), neither ('gone': the passage has changed again since). A NEW (or OLD)
  // of several paragraphs is there when each of its paragraphs is, so that text inserted between
  // them later (a note added) does not hide it
  function present(t, s) {
    var ps = String(s).split(/\n+/).map(function (x) { return x.trim(); }).filter(Boolean);
    return ps.length > 0 && ps.every(function (x) { return t.indexOf(x) >= 0; });
  }
  VT.present = present;
  VT.applied = function (c, texts) {
    var t = texts[c.target]; if (t == null || c.kind === 'PROBLEM') return null;
    var hasNew = c.new ? present(t, c.new) : false, hasOld = c.old ? present(t, c.old) : false;
    if (!c.new) return hasOld ? 'pending' : 'applied';
    return hasNew && !hasOld ? 'applied' : hasOld && !hasNew ? 'pending' : hasNew ? 'both' : 'gone';
  };
  // where the change is in a text now: the line holding NEW (or OLD), or null
  VT.locate = function (c, t) {
    var probe = [c.new, c.old].filter(Boolean);
    for (var k = 0; k < probe.length; k++)
      for (var i = 0; i < t.lines.length; i++) { var c0 = t.lines[i].raw.indexOf(probe[k]); if (c0 >= 0) return { n: i + 1, c: c0 }; }
    return null;
  };

  // ---------- the source ----------
  VT.ocr = function (raw, split) {
    var R = split ? re(split) : /^=== PAGE (\d+)/, out = [], cur = null;
    splitLines(raw).forEach(function (s) {
      var m = R.exec(s);
      if (m) { cur = { img: +m[1], text: '' }; out.push(cur); } else if (cur) cur.text += s + '\n';
    });
    return out;
  };
  // old character forms and their new ones (kyūjitai → shinjitai), the jōyō pairs a pre-war text
  // uses; each pair is old then new
  var FORMS = '假仮說説樣様實実體体學学對対獨独眞真與与爲為證証驗験據拠從従來来會会國国圖図變変當当舊旧歸帰氣気傳伝單単區区數数斷断應応廣広點点擧挙黨党觀観權権歡歓劍剣檢検險険顯顕圓円鹽塩縣県戰戦錢銭譯訳釋釈澤沢擇択驛駅讀読續続賣売屬属觸触齒歯號号惡悪壓圧亞亜圍囲醫医營営榮栄衞衛緣縁應応歐欧櫻桜價価畫画擴拡覺覚樂楽卷巻陷陥勸勧寬寛關関僞偽戲戯犧犠峽峡狹狭曉暁驅駆勳勲徑径莖茎惠恵溪渓經経繼継輕軽鷄鶏藝芸缺欠儉倹圈圏獻献嚴厳效効恆恒鑛鉱濟済碎砕齋斎劑剤雜雑參参慘惨棧桟蠶蚕贊賛殘残絲糸兒児辭辞濕湿寫写壽寿收収澁渋獸獣縱縦肅粛處処敍叙奬奨燒焼稱称乘乗剩剰壤壌孃嬢條条淨浄狀状疊畳讓譲釀醸囑嘱愼慎寢寝盡尽粹粋醉酔穗穂隨随髓髄樞枢聲声靜静齊斉攝摂竊窃專専淺浅潛潜纖繊禪禅雙双壯壮爭争莊荘搜捜插挿巢巣裝装總総騷騒增増藏蔵臟臓卽即墮堕帶帯滯滞臺台瀧滝擔担膽胆團団彈弾癡痴遲遅晝昼蟲虫鑄鋳廳庁聽聴鎭鎮遞逓鐵鉄轉転盜盗燈灯鬪闘德徳屆届繩縄貳弐惱悩腦脳霸覇廢廃拜拝麥麦發発髮髪拔抜蠻蛮祕秘濱浜甁瓶拂払佛仏竝並邊辺辯弁瓣弁辨弁舖舗寶宝豐豊沒没飜翻萬万滿満默黙藥薬豫予餘余譽誉搖揺謠謡賴頼亂乱覽覧龍竜兩両獵猟綠緑壘塁淚涙勵励禮礼隸隷靈霊齡齢戀恋爐炉勞労樓楼錄録灣湾歷歴曆暦旣既槪概黃黄黑黒步歩每毎稅税脫脱閱閲銳鋭姬姫硏研揭掲渴渇敎教曾曽卑卑碑碑祖祖神神祝祝福福社社視視者者都都著著諸諸緖緒暑暑署署突突節節練練類類器器臭臭懷懐壞壊';
  var FOLD = {};
  for (var i = 0; i + 1 < FORMS.length; i += 2) if (FORMS[i] !== FORMS[i + 1]) FOLD[FORMS[i]] = FORMS[i + 1];
  VT.FOLD = FOLD;
  VT.fold = function (s) { return String(s || '').normalize('NFKC').replace(/[㐀-鿿豈-﫿]/g, function (c) { return FOLD[c] || c; }); };
  // a source word in the OCR's pages: each hit's image, place and context. Exact after folding; with
  // o.fuzzy, a word of three characters or more also matches with one character wrong (the OCR reads
  // 偶然 as 借然), marked near. The OCR's own line breaks and spaces are taken out first.
  VT.search = function (pages, q, o) {
    o = o || {};
    var w = VT.fold(q).replace(/\s+/g, ''), out = [];
    if (!w) return out;
    pages.forEach(function (pg) {
      var flat = VT.fold(pg.text).replace(/[\s|]+/g, ''), i, k;
      for (i = 0; i + w.length <= flat.length; i++) {
        var miss = 0;
        for (k = 0; k < w.length && miss < 2; k++) if (flat[i + k] !== w[k]) miss++;
        var near = miss === 1 && o.fuzzy && w.length >= 3 && flat[i] !== undefined;
        if (miss === 0 || near) {
          out.push({ img: pg.img, at: i, near: miss === 1, found: flat.slice(i, i + w.length), context: flat.slice(Math.max(0, i - 12), i + w.length + 12) });
          i += w.length - 1;
        }
      }
    });
    return out;
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = VT;
  root.SWVT = VT;
})(typeof window !== 'undefined' ? window : globalThis);
