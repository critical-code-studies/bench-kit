/*
 * guides.js - Help guides for the parts of the bench that have grown their own ways of working:
 * Paratexts, and codes, links and sharing; a bench adds its own with SW.guideAdd(name, [title,
 * sections]). Each opens in a box over whatever is showing (Help menu, or a link: ?help=paratexts,
 * ?help=codes). Part of bench-kit (github.com/critical-code-studies/bench-kit).
 */
(function (root) {
  'use strict';
  var SW = root.SW, B = SW.BENCH || {}, BP = B.paratexts || {}, EX = B.examples || {}, esc = SW.esc;
  function ul(items) { return '<ul class="ah-steps">' + items.filter(Boolean).map(function (t) { return '<li>' + t + '</li>'; }).join('') + '</ul>'; }
  function k(t) { return '<kbd>' + t + '</kbd>'; }
  // the token form, and the steps to send someone: both built by kit/paratexts.js from the bench's
  // own org and repository, so they stay right if either is renamed
  function tokenBtn() {
    var P = SW.paratexts || {}, url = P.TOKEN_URL || '';
    return (url ? '<a class="btn" href="' + esc(url) + '" target="_blank" rel="noopener">Open the token form ↗</a> ' : '') +
      (P.STEPS ? '<button class="btn ghost" data-copy="' + esc(P.STEPS) + '">Copy the steps to send</button>' : '');
  }

  var GUIDES = {
    paratexts: ['Paratexts', [
      ['What they are', '<p>The scans, clippings, photographs and documents around the program, kept for the crew in a private GitHub repository (' + BP.org + '/' + BP.repo + '): a catalogue of records, and the files. Every change made here is saved there as a commit, signed with your initials, so the history of each item is kept.</p>'],
      ['Getting access', ul([
        'Accept the invitation to the <b>' + BP.org + '</b> organisation that GitHub emails you. Until that is accepted the token form will not offer the owner.',
        'Open the token form: its name, owner, a year’s expiry and the permission it needs (Contents, read and write) are filled in. ' + tokenBtn(),
        'On the form, under <b>Repository access</b>, choose <b>Only select repositories</b> and then <b>' + BP.repo + '</b>. GitHub will not take the repository from a link, so this step is by hand.',
        '<b>Generate token</b>, copy it, and paste it into the bench: ⚙ Settings, Paratexts, then <b>Save and test</b>. Help ▸ Joining the annotation group, step 5, has the same box.',
        'The token stays in this browser, and is sent to nobody but GitHub. On another computer, paste it there too. Each browser keeps its own, and Safari clears what a site has stored after seven days without a visit; a token that is lost, or has expired, is replaced by making a new one from the same form (Only select repositories, the paratexts repository) and pasting it in. The old one can be deleted on GitHub under Settings ▸ Developer settings ▸ Fine-grained tokens.'])],
      ['Inviting someone', '<p>Send them the four steps above with the link, which is what the button below copies. Two things to know before you do.</p>' + ul([
        'They must be a member of the <b>' + BP.org + '</b> organisation first, so invite them there before sending the steps.',
        'The token is <b>read and write</b>. Whoever holds one can add, change and withdraw paratexts. Every change is a commit in ' + BP.org + '/' + BP.repo + ' under their initials, so nothing is anonymous and nothing is lost, but there is no reading-only form of this link. Send it to people you mean to catalogue with.',
        'Tokens expire after a year. GitHub emails a warning first; a new one is made the same way and pasted over the old.'])],
      ['The left panel', ul([
        '<b>＋ Add an item</b>: <b>A file</b> (a scan, photograph, PDF, text, audio or video, up to 50 MB), or <b>A link</b> (a YouTube, Vimeo or Internet Archive recording, an audio or video file online, or a page), catalogued with nothing copied, which plays or shows in the item’s box from where it is held. Give it a title and its <b>Type</b> (what the thing is: a memo scanned to PDF is a memo; type in the find box beside the list to narrow it), a <b>Medium</b> if it is a program or an object (paper tape, DECtape, a disk), and for a link how it <b>Shows as</b>. When no type or medium fits, <b>＋ New type…</b> or <b>＋ New medium…</b> at the foot of the list adds one to this archive’s list for the whole crew, with its Library of Congress or Getty term if it has one. Each type and medium is matched to such a standard term (shown under More metadata as Standard terms), which the Dublin Core export carries beside the bench’s own label. Then what else you know, and Upload (or Add). Program source (.lisp, .bas, .c and the like) is kept as text, to read in the box. A file of the same name and size, or a link already catalogued, is named before it is added again. It goes into the collection you are in, unless you untick it.',
        '<b>All</b>, <b>Not in a collection</b>, your <b>collections</b>, and <b>Withdrawn</b>, each with its count.',
        'Collections nest like folders, and an item can be in several. ＋ beside Collections makes one; on a collection, ＋ makes one inside it, ✎ renames it and ✕ deletes it (its items stay in the catalogue; the collections inside it move up a level).',
        'A collection is for a grouping someone has to judge, such as how a program was received in a country, which no field records. Where a field already says it (an item’s type, language or date), use the filter of that name: a collection that repeats a field has to be kept up by hand, and goes wrong the first time an item is added without it.',
        'Drag items onto a collection to put them in it. From inside a collection a drag moves them; hold ' + k('⌥') + ' to add them instead. Drag one collection onto another to nest it, or onto All to bring it to the top.'])],
      ['Views', ul([
        '▦ a grid of cards, small, medium or large (S M L), or ☰ a list with a column for each field; click a column’s heading to sort by it, again to reverse.',
        '<b>Sort</b>: date made, title, accessioned (newest first), rating, code, size, creator or kind.',
        'Find searches codes, titles, descriptions, tags, archives and collection names; Tag, Version and Kind narrow the list.',
        'Your view is remembered in this browser. ↻ reads the catalogue again.'])],
      ['Selecting several', ul([
        'Tick the box at a card’s corner, ' + k('⌘') + '-click to add or take one, ' + k('⇧') + '-click to take a run, or ' + k('Space') + ' on a focused card.',
        'The bar that appears: add them to a collection (or a new one), take them out of this one, tag them, ⤓ Export their records, copy their codes, and, under ⋯, withdraw them.',
        'With two selected, <b>Side by side</b> shows them in one box. Pictures zoom (wheel, pinch, ＋ −, double-click) and pan (drag); with <b>Together</b> on, both follow, matched by their place on the page, for comparing two printings or copies. Fit (' + k('0') + ') puts them back; ⇄ Swap turns them round.'])],
      ['One item', ul([
        'Click a card for its box: the file (a picture, a PDF, a text), its record, its collections, the crew’s ratings, reactions and comments.',
        'The record: title, date made, creator, source (where this copy came from), <b>Held at</b>, <b>Archive ref</b> and <b>Archive link</b> (the original, in its archive: a <b>Source ↗</b> button appears), rights, accession date (the day it came into the collection, set on upload), description, tags, versions and references. <b>Save changes</b> keeps them.',
        '<b>More metadata</b> folds out the rest of Dublin Core: type (from DCMI’s list; video and audio are set as MovingImage and Sound), publisher, contributors, language, coverage, extent (a duration or size), identifiers (DOI, ISBN, URL), and the file’s format. Tag an interview <i>oral history</i> and it exports to Zotero as an interview.',
        'Rate it with one to three stars (gold up to the crew’s average), react with an emoji, and comment; comments fold away until you open them.',
        'Zoom: a picture has − ＋ Fit and 1:1 above it, and zooms with the wheel or a pinch where the pointer is, or a double-click; drag to move it, and ' + k('+') + ' ' + k('−') + ' ' + k('0') + ' work while the pointer is over it. A PDF has − ＋, Fit page and Fit width, and Open ↗ for a tab of its own.',
        'At the top: <b>Share</b>, ＋ My notes, ⤓ Download, the file on GitHub with its history.',
        '<b>⤓ Export</b> saves its record: <b>CSL-JSON</b> or <b>RIS</b> to import into Zotero (File ▸ Import; creators as Family, Given, separated by semicolons; the archive and its reference go to Zotero’s Archive and Loc. in Archive), or <b>Dublin Core</b> (oai_dc XML). The read-only box has it too.',
        'Under ⋯: <b>Withdraw from the list</b>.'])],
      ['Stepping through', ul([
        'An item opened from the list has <b>‹ Back</b> and <b>Next ›</b> under its title, through the list as it stood (the collection, filters, search and sort): “12 of 56 in Photos”. ' + k('←') + ' ' + k('→') + ' step too.',
        '<b>Sequences</b> in the left panel lists them: ＋ makes one, a name opens it in the editor (name, note, members: drag a row or use ↑ ↓, × takes one out, Add by code or title, Save). Or tick items in the list and choose ⛓ Sequence… in the bar that appears.',
        'A <b>sequence</b> is a fixed order across collections, such as a run of logbooks or a deposition’s volumes. In an item’s box, Sequences ▸ ＋ Add to… puts it at the end of one or starts a new one; ↑ ↓ move it, × takes it out. An item in a sequence has a bar for it as well, and a missing member shows as itself in its place.',
        '<b>Related</b>, in an item’s box, lists items linked to it with no order: a transcript and its recording, two prints of one photograph. ＋ Add… takes a code and links both ways; × unlinks both ways.'])],
      ['Missing items', ul([
        'Something known to have existed that the archive holds no copy of and no link to gets a <b>stub</b>: ＋ Add an item ▸ <b>Missing</b>. Its card shows ❔ and <b>Not available or missing</b>; Kind ▸ missing lists them all.',
        'Before adding one, read a source that shows it existed. Something planned and never made is not a stub. An object in a catalogue that is not digitised is not missing either: add it as <b>A link</b> to its catalogue page.',
        'The description says, in order: “Provenance found but item not available or missing.”; what it is; where it is cited, as the citing paratext’s code with the page or time and a short quotation (each code becomes a link); and, after “Searched:”, where it has been looked for and not found.',
        'Two tags make worklists: <b>to-locate</b> on every stub (no holder known) and <b>to-request</b> on anything a known holder could be asked for, a stub or a link to a catalogue page. The ask goes in the description as a paragraph beginning “Request:”: the holder, the collection and number, the part and the form wanted (in a stub, before “Searched:”). Tag ▸ to-request lists them.',
        'When a copy is found, add it as an item of its own with the provenance carried over, and withdraw the stub, giving the new item’s code as the reason.'])],
      ['Corpora', ul([
        'A <b>corpus</b> is a body of material taken in as a set, gathered by one collector or by one search, such as every reimplementation on one collector’s site, kept in the catalogue but out of the default list so that it does not crowd out the paratexts proper. Where a catalogue has one, <b>Corpus</b> is the first menu in the bar and <b>Corpora</b> heads the left panel, each with its count; the list shows <b>Paratexts</b> until another is chosen, and <b>Every corpus</b> lists them all.',
        'A search looks through every corpus. What it finds in the others is told after the count, as “3 more hidden by Corpus: Paratexts only”, with a button to show them; an item from another corpus carries its name beside the title.',
        'Nothing else is divided by corpus: a code opens its item wherever it is, Related and sequence links cross corpora and mark an item whose home is a corpus, Withdrawn and the Tag, Type, Language and Kind menus cover them all, and the export writes every one, its corpus given as isPartOf.',
        'An item has one home, its corpus or the paratexts. A corpus may also list paratexts that belong to its set: they stay in Paratexts and its counts, and appear in the corpus as well, marked Paratexts, with the count saying how many (“42 in Versions, 10 of them also in Paratexts”).',
        'A corpus named on an item but not declared in the catalogue is marked ⚠ in the menu and on the item.'])],
      ['Withdrawing', '<p>Withdrawing takes an item out of the list for the whole crew. It asks for a reason, kept with the record, and for the item’s code typed in (for several, their number). The file stays in the repository, with its history. <b>Withdrawn</b>, in the left panel, lists them, with who withdrew each and why; select them there and <b>Bring back</b>.</p>'],
      ['Linking to one', ul([
        'In an annotation, note or finding, write its code, as <span class="mono">P-XXXXX</span>. It shows as a link, <b>Paratext:</b> and its title.',
        'Clicking the link opens the paratext read-only, over whatever you were doing, and closes back to it. At its foot, <b>Go to P-… in Paratexts →</b> opens its full box.',
        '<b>Share</b> sends a link that opens the bench at the paratext; whoever opens it needs access to see it.',
        'Its box lists where it is <b>Cited in</b>: the group’s annotations, replies and findings, the bench’s findings and your notes that write its code, each a link.'])],
      ['Speed and privacy', '<p>The catalogue and each file are kept in this browser’s cache after the first time, so the list appears at once and pictures load from here; the bench checks GitHub behind them and redraws if anything has changed. Taking your token out of ⚙ Settings clears the cache.</p>']
    ]],
    codes: ['Codes, links and sharing', [
      ['Every item has a code', '<p>Each thing the bench keeps has a code that does not change, shown on it (click to copy):</p>' + ul([
        '<span class="mono">A-XXXXX</span> an annotation, <span class="mono">R-XXXXX</span> a reply',
        '<span class="mono">C-XXXXX</span> a finding of the crew’s, <span class="mono">' + (EX.finding || 'F1') + '</span> one of the bench’s own',
        '<span class="mono">XX-N1</span> a note in My notes (your initials and its number)',
        '<span class="mono">P-XXXXX</span> a paratext',
        B.implementations ? '<span class="mono">I-XXXXX</span> an implementation (Help ▸ Implementations)' : null])],
      ['Going to one', ul([
        '<b>#</b> in the top bar: type a code and Enter.',
        'In an annotation, note or finding, a code written in the text becomes a link (a paratext’s shows as <b>Paratext:</b> and its title, and opens read-only where you are).',
        'A web link can carry one: <span class="mono">…/research/?code=A-XXXXX</span>.'])],
      ['Sharing', ul([
        B.topShare ? SW.SHARE_ICON + ' in the top bar shares what you are looking at: the version, view, lines or comparison.' : null,
        '<b>Share</b> on a paratext sends a link to it. Where the browser has a share sheet (Safari, phones), it opens it: Mail, Messages and the rest. Elsewhere the link is copied, to paste.',
        'Help ▸ Joining the annotation group, <b>Share an invitation</b>: a link that sets up the annotation group for whoever opens it. Send it only to the crew: anyone with it can join.'])],
      ['Findings and My notes', ul([
        'A note in My notes can be shared to Findings, where the crew can reply, rate it and react; it moves to the <b>Shared</b> box in My notes. Recalling it brings it back, with its replies.',
        'A finding’s status comes from reactions: 🔓 marks it open, 💡 asks for help, ✅ resolves it. Findings filters by status and by category.',
        '<b>✉</b> lists what is new in the group’s annotations, replies to your own first.'])]
    ]]
  };

  // Implementations, where the bench has the tab (kit/implementations.js)
  if (B.implementations) GUIDES.implementations = ['Implementations', [
    ['What they are', '<p>The program’s other texts: its copies, ports, translations, revisions and reimplementations, and the tapes, disks and listings that carry them. Paratexts are the documents around the program; implementations are the program written again, on other machines and in other languages. Each has an entry in a public catalogue kept in the bench’s repository, so the tab reads without a token.</p>' + ul([
      'An entry gives the title, author, date, language, machine and operating system, its <b>family</b> (a line of implementations the catalogue groups together), its <b>status</b>, its <b>parents</b>, the bench’s <b>features</b> read in it, the paratexts that document it, and what it runs on (an interpreter or a system that is itself an entry).',
      'Status says what survives: <b>held</b>, a copy is held; <b>linked</b>, a public copy is held elsewhere at a stable place; <b>printed</b>, the whole program text survives in print, its scan kept as a paratext; <b>attested</b>, known only from mentions; <b>lost</b>.'])],
    ['Descent', ul([
      'Each parent of an entry is another entry, or one of the bench’s own versions (shown as the original, in the variorum).',
      'With it go the <b>relation</b> (port, adaptation, translation, revision, copy, reimplementation, inspired-by, recovery), the route it came by (<b>via</b> a publication, a print listing, a tape, DECUS, a network, a disk), the <b>confidence</b> (established, probable or possible) and the <b>evidence</b>, citing paratexts by their P-codes or findings.'])],
    ['The views', ul([
      '<b>List</b>: every entry, with its code, date, title, language, machine, family, status and whether its files are published. Click a heading to sort by it, again to reverse. <b>Features</b> adds a column for each of the bench’s features: ✓ present, ✗ absent, ? not yet read.',
      '<b>Read</b>: one entry. Its record folds above its source. The strip under the record runs from its parents through the entry to its descendants, each with its relation, route and confidence; hover one for the evidence, click it to move along the descent. A source with several files has a button for each (the main file and its alternates); an alternate held privately is named, with the paratext that holds it.',
      '<b>Tree</b>: the descent drawn with the families as lanes and the date across, the bench’s own versions in the top lane. A solid line is established, dashed probable, dotted possible. A filled node is held, a node with a dot printed, an open one attested, linked or lost. Hover a line for its relation and evidence; click a node to read the entry.',
      '<b>Matrix</b>: every entry against the features, grouped by family and in date order; <b>only rows with a feature read</b> leaves out the rest.',
      'Find (code, title, author, language, machine, date, description), family, status and published or not narrow the List, the Tree and the Matrix alike.'])],
    ['Comparing two', ul([
      'Open <b>Compare</b>, and choose each side by typing an I-code or a title, or with <b>Choose in the Tree</b>; ⇄ swaps them. From an entry in Read, <b>Compare with its parent</b> and <b>Compare with…</b> start it there.',
      'The features first, side by side, the ones that differ marked and counted where both are known.',
      'Then the texts. Two in related languages (Lisp with Lisp, BASIC with BASIC) are aligned line by line, without case or spacing, with the lines in common, those only in A and only in B, and a similarity.',
      'Two Lisp texts are also compared <b>by function</b>: their definitions matched by name and compared as tokens, so that BBN-LISP’s DEFINEQ, Maclisp’s DEFPROP and DEFUN read alike and parentheses and layout are left out. Each entry is read in its own dialect, from its language. A definition still open where the next one begins (a parenthesis lost or gained in the copy) is marked <b>unbalanced</b>.',
      'Two in different languages, or too long to align, are shown side by side.'])],
    ['Published and held', ul([
      'Every entry is public. A file is published only once its publication is cleared: by the author’s permission, a licence, the public domain, a release from the rights holder, or research fair dealing. The basis is recorded with the entry (Files, in its record).',
      'Until then the file stays in the private paratext archive, awaiting clearance, and the entry says that it is held privately. A tape or disk with other programs on it stays private as a whole; its entry publishes what can be cleared and describes the rest.',
      'Files published or Entry only, in the filters, lists one or the other.'])],
    ['Linking to one', ul([
      'Every entry has a code, <span class="mono">I-XXXXX</span>, shown in the List and on its record. Written in an annotation, note, finding or paratext description it becomes a link that opens the entry in Read.',
      '<b>#</b> in the top bar opens one by its code, and a web link can carry one: <span class="mono">…/research/?code=I-XXXXX</span>.',
      'While the tab is open the address carries its view, the entry read, the two compared, the filters and the feature columns, so a link copied from it opens the tab as it stands.'])]
  ]];

  SW.guideAdd = function (name, g) { GUIDES[name] = g; };
  SW.guide = function (name) {
    var g = GUIDES[name]; if (!g) return;
    var d = SW.el('dialog', { class: 'tray-big annohelp guidehelp' });
    d.innerHTML = '<div class="tray-bighead"><b>' + g[0] + '</b><span class="refhelp-acts"><button class="btn ghost" data-share title="A link that opens the bench with this guide showing">' + SW.SHARE_ICON + ' Share</button><button class="icon-btn" data-x title="Close (Esc)">✕</button></span></div><div class="ah">' +
      '<nav class="gh-toc">' + g[1].map(function (s, i) { return '<a href="#" data-to="' + i + '">' + s[0] + '</a>'; }).join('') + '</nav>' +
      g[1].map(function (s, i) { return '<section data-s="' + i + '"><h3>' + s[0] + '</h3>' + s[1] + '</section>'; }).join('') + '</div>';
    document.body.appendChild(d);
    d.showModal();
    d.addEventListener('click', function (e) {
      if (e.target === d || e.target.closest('[data-x]')) { d.close(); return; }
      if (e.target.closest('[data-share]')) { SW.share({ title: g[0] + ' · ' + (B.title || 'Research Bench'), url: SW.BASE_URI + '?help=' + name }); return; }
      var to = e.target.closest('[data-to]');
      if (to) { e.preventDefault(); var sec = d.querySelector('[data-s="' + to.dataset.to + '"]'); if (sec) sec.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
    });
    d.addEventListener('close', function () { d.remove(); });
  };
})(typeof window !== 'undefined' ? window : globalThis);
