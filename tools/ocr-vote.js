#!/usr/bin/env node
/*
 * tools/ocr-vote.js - one reading from many copies of a page: a scan that holds the same page
 * again and again (ditto copies, carbons, reprints) read by tools/ocr.swift, each line of a base
 * page matched in every other copy, and the reading most copies give taken for it. A line set in
 * from the page's margin keeps its indent. The result is a draft to check against the scan, line
 * by line: a reading the copies agree on can still be wrong, and a line the machine missed on the
 * base page is missing from all.
 *
 *   node research/kit/tools/ocr-vote.js scan.ocr.txt                 base page: the first with text
 *   node research/kit/tools/ocr-vote.js scan.ocr.txt --base 2 --indent 5 --min 0.6 --report
 *
 *   --base N     the page whose lines are matched in the others
 *   --pages A-B  the pages that are copies (all, by default)
 *   --indent K   spaces for a line set in from the margin (5)
 *   --step X     how far in, as a share of the page's width, counts as set in (0.02)
 *   --min R      how alike a line must be to count as the same line (0.6, of 1)
 *   --report     each line's readings and their counts, to stderr
 *
 * Part of bench-kit (github.com/critical-code-studies/bench-kit).
 */
'use strict';
const fs = require('fs');

const argv = process.argv.slice(2);
const opt = (f, d) => { const i = argv.indexOf(f); if (i < 0) return d; const v = argv[i + 1]; argv.splice(i, 2); return v; };
const flag = (f) => { const i = argv.indexOf(f); if (i < 0) return false; argv.splice(i, 1); return true; };
const BASE = opt('--base', null), PAGES = opt('--pages', null), INDENT = +opt('--indent', 5), STEP = +opt('--step', 0.02), MIN = +opt('--min', 0.6), REPORT = flag('--report');
const file = argv[0];
if (!file) { console.error('usage: node ocr-vote.js scan.ocr.txt [--base N] [--pages A-B] [--indent K] [--step X] [--min R] [--report]'); process.exit(1); }

// the pages: [{ x, t }] per page, from "; [page N]" and "x<TAB>text" lines
const pages = {};
let cur = null;
for (const l of fs.readFileSync(file, 'utf8').split('\n')) {
  const m = /^; \[page (\d+)\]/.exec(l);
  if (m) { cur = +m[1]; pages[cur] = []; continue; }
  const tab = l.indexOf('\t');
  if (cur == null || tab < 0) continue;
  pages[cur].push({ x: parseFloat(l.slice(0, tab)), t: l.slice(tab + 1).replace(/\s+/g, ' ').trim() });
}
let nums = Object.keys(pages).map(Number).filter((p) => pages[p].length);
if (PAGES) { const [a, b] = PAGES.split('-').map(Number); nums = nums.filter((p) => p >= a && p <= (b || a)); }
const base = BASE ? +BASE : nums[0];
if (!pages[base] || !pages[base].length) { console.error('no text on the base page ' + base); process.exit(1); }

// how alike two lines are: letters and spaces only, twice the characters they share in order
// (their longest common subsequence) over their lengths together, 0 to 1
const norm = (t) => t.toLowerCase().replace(/[^a-z ]/g, '');
function ratio(a, b) {
  a = norm(a); b = norm(b);
  if (!a.length && !b.length) return 1;
  const prev = new Array(b.length + 1).fill(0);
  for (let i = 1; i <= a.length; i++) {
    let diag = 0;
    for (let j = 1; j <= b.length; j++) { const up = prev[j]; prev[j] = a[i - 1] === b[j - 1] ? diag + 1 : Math.max(prev[j], prev[j - 1]); diag = up; }
  }
  return 2 * prev[b.length] / (a.length + b.length);
}

const lines = pages[base].map((l) => ({ base: l, votes: new Map(), xs: [] }));
for (const p of nums) {
  const v = pages[p], mx = Math.min(...v.map((l) => l.x));
  for (const L of lines) {
    let best = -1, br = 0;
    v.forEach((l, j) => { const r = ratio(L.base.t, l.t); if (r > br) { br = r; best = j; } });
    if (best < 0 || br < MIN) continue;
    L.votes.set(v[best].t, (L.votes.get(v[best].t) || 0) + 1);
    L.xs.push(v[best].x - mx);
  }
}
// the vote: first on each reading without its trailing marks (a copy may lose a faint full stop),
// then, among the readings of the winner, the form most copies give
const core = (t) => t.replace(/[^A-Za-z0-9]+$/, '');
const out = lines.map((L, i) => {
  const cores = new Map();
  for (const [t, c] of L.votes) cores.set(core(t), (cores.get(core(t)) || 0) + c);
  const win = [...cores.entries()].sort((a, b) => b[1] - a[1])[0];
  const ranked = [...L.votes.entries()].filter(([t]) => !win || core(t) === win[0]).sort((a, b) => b[1] - a[1]);
  const xs = L.xs.slice().sort((a, b) => a - b), x = xs.length ? xs[xs.length >> 1] : 0;
  if (REPORT) console.error(String(i + 1).padStart(3) + '  ' + ranked.slice(0, 3).map(([t, c]) => t + ' (' + c + ')').join('  ||  '));
  return (x > STEP ? ' '.repeat(INDENT) : '') + (ranked.length ? ranked[0][0] : L.base.t);
});
process.stdout.write(out.join('\n') + '\n');
