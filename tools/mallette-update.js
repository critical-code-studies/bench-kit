#!/usr/bin/env node
/*
 * tools/mallette-update.js - the kit's copy of mallette (MALLET's topic model in JavaScript,
 * github.com/Computational-Hermeneutics/mallette, Apache License 2.0) set to a release: its
 * src/mallette.js and src/mallette-worker.js copied to the kit as mallette.js and
 * mallette-worker.js, its NOTICE to docs/mallette-NOTICE.txt, and the release and each file's
 * SHA-256 to docs/mallette.json, which tests/topics.test.js checks the copy against. The kit never
 * changes these files: a change goes to mallette first, then this tool. Run from the kit:
 *
 *   node tools/mallette-update.js v0.2.0                  from GitHub, at that tag
 *   node tools/mallette-update.js v0.2.0 --from ../mallette   from a clone, at that tag (git show)
 *
 * Part of bench-kit (github.com/critical-code-studies/bench-kit).
 */
'use strict';
const fs = require('fs'), path = require('path'), crypto = require('crypto'), cp = require('child_process');
const args = process.argv.slice(2), tag = args[0], fi = args.indexOf('--from'), from = fi >= 0 ? args[fi + 1] : null;
if (!tag || !/^v\d+\.\d+\.\d+$/.test(tag)) { console.error('node tools/mallette-update.js vX.Y.Z [--from <clone>]'); process.exit(1); }
const kit = path.resolve(__dirname, '..'), REPO = 'Computational-Hermeneutics/mallette';
const FILES = [['src/mallette.js', 'mallette.js'], ['src/mallette-worker.js', 'mallette-worker.js'], ['NOTICE', 'docs/mallette-NOTICE.txt']];
async function get(p) {
  if (from) return cp.execFileSync('git', ['-C', from, 'show', tag + ':' + p], { encoding: 'utf8' });
  const r = await fetch('https://raw.githubusercontent.com/' + REPO + '/' + tag + '/' + p);
  if (!r.ok) throw new Error(p + ' at ' + tag + ': ' + r.status);
  return r.text();
}
(async () => {
  const record = { name: 'mallette', repository: 'https://github.com/' + REPO, release: tag, licence: 'Apache-2.0', files: {} };
  for (const [src, dst] of FILES) {
    const text = await get(src);
    fs.writeFileSync(path.join(kit, dst), text);
    record.files[dst] = crypto.createHash('sha256').update(text, 'utf8').digest('hex');
    console.log('  ' + dst + ' ← ' + src + ' (' + text.length + ' bytes)');
  }
  const m = /VERSION:\s*'([^']+)'/.exec(fs.readFileSync(path.join(kit, 'mallette.js'), 'utf8'));
  if (!m || 'v' + m[1] !== tag) throw new Error('mallette.js says version ' + (m && m[1]) + ', not ' + tag);
  fs.writeFileSync(path.join(kit, 'docs/mallette.json'), JSON.stringify(record, null, 2) + '\n');
  console.log('mallette ' + tag + ' in the kit; docs/mallette.json written');
})().catch((e) => { console.error(e.message); process.exit(1); });
