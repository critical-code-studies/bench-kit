#!/usr/bin/env node
/*
 * tools/collate-lisp.js - compares two Lisp texts by definition (kit/lispdefs.js) and prints the
 * counts, and with --rows every definition's status. Each side is a file, or several joined with
 * "+"; a side's dialect is guessed unless given (bbn, maclisp, cl).
 *
 *   node kit/tools/collate-lisp.js A.lisp B.lisp [--a-dialect bbn] [--b-dialect maclisp] [--rows]
 *   node kit/tools/collate-lisp.js --check tests/lispdefs-collations.json --root eliza=<folder> --root shrdlu=<folder>
 *
 * --check runs the collations listed in a JSON file ([{ name, root, a, b, aDialect, bDialect,
 * want: { matched, identical, … } }], each pair's paths under the folder given for its root),
 * skips a pair whose root is not given, and exits 1 where a count differs. The kit's own list
 * (tests/lispdefs-collations.json) names files in the ELIZA project's Implementations working
 * folder (eliza/_tmp/implementations/out, which holds the files not yet cleared for publication)
 * and in SHRDLU's source/ folder.
 * Needs Node 18 or later; no packages.
 * Part of bench-kit (github.com/critical-code-studies/bench-kit).
 */
'use strict';
const fs = require('fs');
const path = require('path');
const L = require('../lispdefs.js');

const argv = process.argv.slice(2);
const opt = (k) => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : null; };
const texts = (spec, root) => spec.split('+').map((p) => ({ name: path.basename(p), text: fs.readFileSync(path.resolve(root || '.', p), 'latin1') }));
const counts = (r) => ({ matched: r.matched, identical: r.identical, changed: r.changed, onlyA: r.onlyA, onlyB: r.onlyB, otherA: r.otherA, otherB: r.otherB });

if (opt('--check')) {
  const list = JSON.parse(fs.readFileSync(opt('--check'), 'utf8')), roots = {};
  argv.forEach((x, i) => { if (argv[i - 1] === '--root') { const m = /^([^=]+)=(.*)$/.exec(x); roots[m ? m[1] : ''] = m ? m[2] : x; } });
  let bad = 0;
  for (const c of list) {
    const root = roots[c.root || ''];
    if (root == null) { console.log('·  ' + c.name + ': skipped (no --root ' + c.root + '=…)'); continue; }
    let r;
    try { r = L.compare({ texts: texts(c.a, root), dialect: c.aDialect }, { texts: texts(c.b, root), dialect: c.bDialect }); }
    catch (e) { console.log('–  ' + c.name + ': ' + e.message); bad++; continue; }
    const got = counts(r), diff = Object.keys(c.want || {}).filter((k) => got[k] !== c.want[k]);
    if (diff.length) bad++;
    console.log((diff.length ? '✗  ' : '✓  ') + c.name + ': ' + JSON.stringify(got) + (diff.length ? '  wanted ' + JSON.stringify(c.want) : ''));
  }
  process.exit(bad ? 1 : 0);
}
const [a, b] = argv.filter((x, i) => !x.startsWith('--') && !(argv[i - 1] || '').startsWith('--'));
if (!a || !b) { console.error('usage: collate-lisp.js A B [--a-dialect d] [--b-dialect d] [--rows]'); process.exit(2); }
const r = L.compare({ texts: texts(a), dialect: opt('--a-dialect') }, { texts: texts(b), dialect: opt('--b-dialect') });
console.log(JSON.stringify(counts(r)));
if (argv.includes('--rows')) r.rows.forEach((x) => console.log([x.status.padEnd(10), (x.sim == null ? '' : Math.round(x.sim * 100) + '%').padStart(4), x.kind.padEnd(10), x.key].join('  ')));
