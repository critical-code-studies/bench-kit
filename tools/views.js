#!/usr/bin/env node
/*
 * tools/views.js - opens each of a bench's views in headless Chrome and reports, for each, whether
 * it drew something and whether anything went wrong: an uncaught error, or a view left empty or
 * showing that it could not load. The test pages check the kit's pure parts; this checks that the
 * bench, as it is, still works with a kit. Run from the bench's repository:
 *
 *   node research/kit/tools/views.js                  the bench with its own kit
 *   node research/kit/tools/views.js --kit ../bench-kit
 *                                                     the bench with the kit in that folder in
 *                                                     place of its own (nothing in the bench changes)
 *   --dir <folder>   the bench's folder (research by default, or . where index.html is)
 *   --skip a,b       views not to open (paratexts, which needs a token, is always skipped)
 *
 * It exits 1 when a view fails. Needs Google Chrome or Chromium and Node 22; no packages.
 * Part of bench-kit (github.com/critical-code-studies/bench-kit).
 */
'use strict';
const fs = require('fs');
const path = require('path');
const C = require('./chrome.js');

const argv = process.argv.slice(2);
const opt = (f) => { const i = argv.indexOf(f); return i >= 0 ? argv[i + 1] : null; };
const dir = C.benchDir(argv, 'views');
const kit = opt('--kit') ? path.resolve(opt('--kit')) : null;
const skip = ['paratexts'].concat((opt('--skip') || '').split(',').filter(Boolean));
if (kit && !fs.existsSync(path.join(kit, 'base.js'))) C.fail('views', 'no base.js in ' + kit + ': give the kit\'s folder');

// the kit's files from --kit, wherever the bench asks for kit/…
const TYPES = { '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.html': 'text/html' };
const base = '/' + path.relative(process.cwd(), path.resolve(dir)).split(path.sep).filter(Boolean).map((s) => s + '/').join('') + 'kit/';
function route(pn) {
  if (!kit || pn.indexOf(base) !== 0) return null;
  const p = path.join(kit, pn.slice(base.length));
  if (!p.startsWith(kit) || !fs.existsSync(p)) return { data: null };
  return { type: TYPES[path.extname(p)] || 'application/octet-stream', data: fs.readFileSync(p) };
}

// a view is drawn when its section holds something; it has failed when the bench shows it could
// not load (the kit's error badges and messages) or an uncaught error was thrown while it opened
const CHECK = `(async (name) => {
  const sec = document.querySelector('#view-' + name);
  if (!sec) return { name, skipped: 'no section' };
  SW.setTab(name);
  for (let i = 0; i < 60; i++) {
    await new Promise((r) => setTimeout(r, 250));
    if (sec.innerText.trim().length > 20 && !/Loading|Setting the page|Reading the two texts/.test(sec.innerText.slice(0, 200))) break;
  }
  await new Promise((r) => setTimeout(r, 400));
  // the kit's own messages for a view that could not load, read from its message elements only: the
  // text being read may say anything ("he could not read" is Billy Budd), and a reading's notes, such
  // as a count of bracket errors in a listing, are not failures
  const text = sec.innerText.trim(), RE = /could not load|couldn.t load|failed to fetch|could not read the|is not defined|cannot read propert/i;
  const said = [].slice.call(sec.querySelectorAll('.empty, .hint, .pad, .badge, .err, .status')).filter((e) => RE.test(e.textContent)).map((e) => e.textContent.trim().slice(0, 80));
  return { name, chars: text.length, failed: said.length > 0, said: said[0], shown: SW.state.tab === name };
})`;

(async () => {
  let failed = 0;
  try {
    await C.withBench({ dir, route, wait: 240 }, async (page) => {
      const info = JSON.parse(await page.evaluate('JSON.stringify({ bench: SW.BENCH.title || SW.BENCH.name, version: SW.VERSION, kit: SW.KIT && SW.KIT.version, views: (SW.BENCH.shell && SW.BENCH.shell.views) || [] })'));
      console.log((info.bench || 'bench') + ' ' + info.version + ', kit ' + info.kit + (kit ? ' (from ' + kit + ')' : ''));
      const views = info.views.filter((v) => skip.indexOf(v) < 0);
      for (const v of views) {
        const before = page.errors.length;
        let r;
        try { r = await page.evaluate(CHECK + '(' + JSON.stringify(v) + ')'); }
        catch (e) { r = { name: v, failed: true, why: e.message }; }
        const errs = page.errors.slice(before);
        if (r.skipped) { console.log('  · ' + v + ': ' + r.skipped); continue; }
        const empty = !r.chars || r.chars < 20, bad = r.failed || errs.length || empty || !r.shown;
        if (bad) failed++;
        console.log('  ' + (bad ? '✗ ' : '✓ ') + v + (bad ? ': ' + [r.why, errs.length ? errs[0].split('\n')[0] : '', empty ? 'nothing drawn' : '', r.failed ? 'shows: ' + r.said : '', r.shown === false ? 'did not open' : ''].filter(Boolean).join('; ') : ''));
      }
    });
  } catch (e) { console.log('did not start: ' + e.message); failed++; }
  process.exitCode = failed ? 1 : 0;
})();
