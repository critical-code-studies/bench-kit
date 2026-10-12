#!/usr/bin/env node
/*
 * tools/sitemap.js - writes a bench's sitemap.html: opens the bench in headless Chrome, runs
 * kit/sitemap.js there (SW.sitemapHTML) and saves what it gives. The site map is made from the
 * bench as it runs: its tab row and menus, its versions, references and source files. Run from
 * the bench's repository:
 *
 *   node research/kit/tools/sitemap.js            writes research/sitemap.html
 *   node research/kit/tools/sitemap.js --dry-run  prints the page instead
 *   --dir <folder>   the bench's folder (research by default, or . where index.html is)
 *
 * Needs Google Chrome or Chromium (CHROME=<path> to name it) and Node 22 or later; no packages.
 * Part of bench-kit (github.com/critical-code-studies/bench-kit).
 */
'use strict';
const fs = require('fs');
const path = require('path');
const C = require('./chrome.js');

const argv = process.argv.slice(2);
const DRY = argv.includes('--dry-run');
const dir = C.benchDir(argv, 'sitemap');

C.withBench({ dir }, async (page) => {
  await page.evaluate(fs.readFileSync(path.join(__dirname, '..', 'sitemap.js'), 'utf8'));
  const html = await page.evaluate('SW.sitemapHTML()');
  if (!html) throw new Error('no page came back' + (page.errors.length ? ': ' + page.errors[0] : ''));
  if (DRY) { process.stdout.write(html); return; }
  const out = path.join(dir, 'sitemap.html');
  fs.writeFileSync(out, html);
  console.log('wrote ' + out + ' (' + (html.match(/<li>/g) || []).length + ' links to views, ' + ((html.match(/<tr[ >]/g) || []).length - 1) + ' versions)');
}).catch((e) => C.fail('sitemap', e.message));
