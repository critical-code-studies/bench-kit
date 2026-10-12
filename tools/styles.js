#!/usr/bin/env node
/*
 * tools/styles.js - checks that a change to a bench's stylesheets (its own, or the kit's) changes
 * nothing on the page, or shows what it changes. It opens the bench in headless Chrome and, in
 * each colour theme and each state of the page (every tab, the Key, every menu open, every menu
 * item, the genealogy's figures), reads every visible element's computed style with the
 * stylesheets on disk and again with them as committed, the kit's as the bench's commit had it.
 * Only stylesheets differ between the two, so an element that differs is the change's doing.
 * Run from the bench's repository:
 *
 *   node research/kit/tools/styles.js                  against the last commit (HEAD)
 *   node research/kit/tools/styles.js --ref v1.18.0    against another commit or tag
 *   --themes paper,green | all   the colour themes (by default the bench's own and paper)
 *   --only read,menu:help        only these states (names as the report gives them)
 *   --max 60                     the differences listed (40 by default)
 *   --dir <folder>               the bench's folder (research by default, or . where index.html is)
 *
 * It exits 1 when anything differs. Needs Google Chrome or Chromium and Node 22; no packages.
 * Part of bench-kit (github.com/critical-code-studies/bench-kit).
 */
'use strict';
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const C = require('./chrome.js');

const argv = process.argv.slice(2);
const opt = (f, d) => { const i = argv.indexOf(f); return i < 0 ? d : argv[i + 1]; };
const dir = C.benchDir(argv, 'styles');
const REF = opt('--ref', 'HEAD'), MAX = +opt('--max', 40);
const themesArg = opt('--themes', ''), only = opt('--only', '');
const git = (args, cwd) => execFileSync('git', args, { cwd, encoding: 'buffer', stdio: ['ignore', 'pipe', 'ignore'] });

const root = process.cwd(), rel = path.relative(root, path.resolve(dir)).split(path.sep).filter(Boolean).join('/');
const kitRel = (rel ? rel + '/' : '') + 'kit';
// the kit as the bench's commit had it
let kitSha = null;
try { kitSha = git(['ls-tree', REF, kitRel], root).toString().split(/\s+/)[2] || null; } catch (e) { C.fail('styles', 'no commit ' + REF + ' in this repository'); }
const cache = {};
function before(pn) {
  const p = pn.replace(/^\/+/, '');
  if (cache[p] !== undefined) return cache[p];
  let data = null;
  try {
    if (kitSha && p.startsWith(kitRel + '/')) data = git(['show', kitSha + ':' + p.slice(kitRel.length + 1)], path.join(root, kitRel));
    else data = git(['show', REF + ':' + p], root);
  } catch (e) { data = null; }   // a stylesheet the commit did not have
  return (cache[p] = data);
}

C.withBench({ dir, route: (pn) => pn.startsWith('/__before/') ? { type: 'text/css', data: before(pn.slice('/__before'.length)) } : null }, async (page) => {
  await page.evaluate(fs.readFileSync(path.join(__dirname, 'styles-page.js'), 'utf8'));
  const themes = themesArg === 'all' ? await page.evaluate('SW.THEMES.map(function (t) { return t.id; })') : themesArg ? themesArg.split(',') : null;
  const r = await page.evaluate('__stylesCompare(' + JSON.stringify({ themes, only: only ? only.split(',') : null, max: MAX }) + ')');
  const rows = Object.keys(r.counts), bad = rows.filter((k) => /differ|visible as committed|could not/.test(r.counts[k])), moving = rows.filter((k) => /moves by itself/.test(r.counts[k]));
  console.log('Compared ' + r.states.length + ' states in ' + r.themes.length + ' theme' + (r.themes.length === 1 ? '' : 's') + ' (' + r.themes.join(', ') + ') against ' + REF + (kitSha ? ', the kit at ' + kitSha.slice(0, 7) : '') + '.');
  if (moving.length) console.log('Animated, compared where still: ' + moving.join('; ') + '.');
  if (!bad.length) { console.log('No element\'s computed style differs.'); return; }
  console.log('\n' + bad.map((k) => '  ' + k + ': ' + r.counts[k]).join('\n'));
  if (r.diffs.length) console.log('\n' + r.diffs.map((d) => '  ' + d.at + '\n    ' + d.el + '\n    ' + d.props.join('\n    ')).join('\n'));
  process.exitCode = 1;
}).catch((e) => C.fail('styles', e.message));
