#!/usr/bin/env node
/*
 * tools/library-check.js - the Library's and Paratexts' records, for a bench to look over. People make mistakes
 * in a form, and a work added by hand carries a hidden mark (check: "unchecked") until someone has looked at it.
 * This lists those, and in any record: a role word in `author` (eds, translated by, foreword...), which belongs
 * in `contributor`; `pages` that is not a page or a range of pages, which belongs in `extent` for a volume's size;
 * and a missing title, or a book's, chapter's, article's or thesis's missing author or date. It changes nothing unless asked to clear marks.
 *
 *   node research/kit/tools/library-check.js                      research/library/library.json, as release finds it
 *   node research/kit/tools/library-check.js FILE [FILE...]        library.json, additions.json, catalogue.json
 *   node research/kit/tools/library-check.js --dir DIR             the library.json in a bench's folder (or give the folder)
 *   node research/kit/tools/library-check.js FILE --checked ID,ID  clear the mark on these, once looked at
 *   --quiet                                                        a count only (the release tool uses this)
 *
 * Part of bench-kit (github.com/critical-code-studies/bench-kit).
 */
'use strict';
const fs = require('fs');
const path = require('path');

// a role: ed. or eds (with a stop, plural, or in brackets: "Halter, Ed" is a name), trans., translated by...
const ROLE = /\(\s*(?:eds?|trans|tr)\.?\s*\)|(?:^|[\s,;])(?:eds?\.|eds)(?=[\s,;)]|$)|(?:^|[\s,;(])(?:editors?|edited by|trans\.|translated by|translators?|tr\.|foreword by|introduction by|preface by|afterword by|compiled by|advisors?|supervisors?)(?=[\s,;:.)]|$)/i;
// a page, a range, an open range (56–), several (35–52, 83–102), or with ff.
const PAGES = /^\s*[ivxlcdm\d]+(\s*[-–]\s*[ivxlcdm\d]*)?(\s*,\s*[ivxlcdm\d]+(\s*[-–]\s*[ivxlcdm\d]*)?)*\s*(ff?\.?)?\s*$/i;

function problemsOf(e) {
  const out = [];
  const code = e.id || e.code;
  if (e.check === 'unchecked') out.push('added by hand, not yet checked' + (e.added && e.added.by ? ' (' + e.added.by + ')' : e.addedBy ? ' (' + e.addedBy + ')' : ''));
  if (e.author && ROLE.test(String(e.author))) out.push('a role word in author: "' + String(e.author).slice(0, 80) + '" (editors, translators and the like go in contributor)');
  if (e.pages && !PAGES.test(String(e.pages))) out.push('pages is not a page or range: "' + String(e.pages).slice(0, 60) + '" (a volume\'s size goes in extent)');
  if (!e.title) out.push('no title');
  // an author and a date are asked of the kinds that have them; a web page, a news item or a film often has neither
  const scholarly = /^(book|chapter|article|thesis|dissertation|edition|translation|review|monograph)$/i.test(String(e.kind || '').trim());
  if (e.id && scholarly && !e.author && !e.contributor) out.push('no author');
  if (e.id && scholarly && !e.date) out.push('no date');
  return code ? out : [];
}

function itemsOf(j) { return Array.isArray(j) ? j : (j && (j.items || j.entries)) || []; }

function main() {
  const argv = process.argv.slice(2);
  const flag = (f) => { const i = argv.indexOf(f); if (i < 0) return null; argv.splice(i, 1); return true; };
  const opt = (f) => { const i = argv.indexOf(f); if (i < 0) return null; const v = argv[i + 1]; argv.splice(i, 2); return v; };
  const QUIET = flag('--quiet'), CHECKED = opt('--checked'), DIR = opt('--dir');
  // a folder stands for the library.json in it, wherever a bench keeps it
  const inDir = (d) => ['research/library/library.json', 'library/library.json', 'library.json'].map((p) => path.join(d, p)).filter((p) => fs.existsSync(p))[0] || null;
  let files = argv.length ? argv : [DIR || '.'];
  files = files.map((f) => (fs.existsSync(f) && fs.statSync(f).isDirectory() ? inDir(f) : f)).filter((f) => f && fs.existsSync(f));
  if (!files.length) { if (!QUIET) console.log('library-check: no library.json here; give the files to read.'); return; }
  let total = 0;
  files.forEach((f) => {
    const j = JSON.parse(fs.readFileSync(f, 'utf8'));
    const items = itemsOf(j);
    if (CHECKED) {
      const want = new Set(CHECKED.split(',').map((s) => s.trim()).filter(Boolean));
      let n = 0;
      items.forEach((e) => { if (want.has(e.id || e.code) && e.check) { delete e.check; n++; } });
      if (n) fs.writeFileSync(f, JSON.stringify(j, null, 1) + '\n');
      console.log(f + ': ' + n + ' mark' + (n === 1 ? '' : 's') + ' cleared');
      return;
    }
    const found = items.map((e) => ({ code: e.id || e.code, ps: problemsOf(e) })).filter((x) => x.ps.length);
    total += found.length;
    if (QUIET) return;
    console.log(path.relative(process.cwd(), f) + ': ' + items.length + ' records, ' + found.length + ' to look at');
    found.forEach((x) => { console.log('  ' + x.code); x.ps.forEach((p) => console.log('    ' + p)); });
  });
  if (QUIET && !CHECKED) console.log(String(total));
}

if (require.main === module) main();
module.exports = { problemsOf };
