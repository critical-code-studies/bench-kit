#!/usr/bin/env node
/*
 * tools/library-snapshot.js - the group's ratings, Key work marks and tags for readers with no token. A private
 * Hypothesis group can be read only with a member's token, so this reads it and writes library/group.json, which
 * the Library loads for every reader. It takes only reactions on entries in the public library.json: the average
 * rating and how many gave one, the marks and the tags. Note text, replies, emoji and who did what are not read
 * into it. Run from the bench's repository, with the token in the environment and never on the command line:
 *
 *   HYPOTHESIS_TOKEN=... node research/kit/tools/library-snapshot.js
 *   HYPOTHESIS_TOKEN=... node research/kit/tools/library-snapshot.js --dry-run     say what would change
 *
 *   --dir <folder>   the bench's folder (research by default, or . where index.html is)
 *   --group <id>     the group, if js/config.js does not give it
 *
 * A token that is not a member sees an empty group rather than an error, so this checks membership first and
 * writes nothing on any failure. The file is rewritten only when its content has changed.
 * templates/library-snapshot.yml runs this on a schedule. Part of bench-kit (github.com/critical-code-studies/bench-kit).
 */
'use strict';
const fs = require('fs');
const path = require('path');

const API = process.env.HYPOTHESIS_API || 'https://api.hypothes.is/api';

// rows from Hypothesis, and the entries' codes: what may be published
function build(rows, codes, prefixes) {
  const pre = prefixes && prefixes.length ? prefixes : ['bk:'];
  const known = new Set(codes);
  const tv = (tags, name) => {
    for (const p of pre) { const t = tags.find((x) => x.indexOf(p + name) === 0); if (t) return t.slice((p + name).length); }
    return null;
  };
  const has = (tags, name) => pre.some((p) => tags.includes(p + name));
  const stars = {}, keys = {}, tags = {};
  rows.slice().sort((a, b) => (String(a.created) < String(b.created) ? -1 : 1)).forEach((a) => {
    const t = a.tags || [], vid = tv(t, 'v:') || '';
    if (!/^item:/.test(vid) || tv(t, 'kind:') !== 'reaction') return;
    if ((a.references || []).length || has(t, 'deleted') || has(t, 'dev')) return;
    const code = vid.slice(5), text = String(a.text || '');
    if (!known.has(code)) return;
    let m;
    if ((m = /^★([123])$/.exec(text))) (stars[code] = stars[code] || {})[tv(t, 'by:') || a.user || ''] = +m[1];
    else if ((m = /^key:(on|off)$/.exec(text))) keys[code] = { on: m[1] === 'on', date: a.created };
    else if ((m = /^tag:(on|off):([\s\S]+)$/.exec(text))) (tags[code] = tags[code] || {})[m[2]] = { on: m[1] === 'on', date: a.created };
  });
  const sorted = (o) => Object.keys(o).sort().reduce((r, k) => { r[k] = o[k]; return r; }, {});
  const ratings = {};
  Object.keys(stars).forEach((c) => {
    const vals = Object.values(stars[c]);
    ratings[c] = { avg: Math.round((vals.reduce((s, v) => s + v, 0) / vals.length) * 100) / 100, n: vals.length };
  });
  Object.keys(tags).forEach((c) => { tags[c] = sorted(tags[c]); });
  return { ratings: sorted(ratings), keys: sorted(keys), tags: sorted(tags) };
}

async function get(url, token) {
  const r = await fetch(url, { headers: { Authorization: 'Bearer ' + token, Accept: 'application/json' } });
  if (!r.ok) throw new Error(r.status === 401 ? 'Hypothesis refused the token' : 'Hypothesis answered ' + r.status);
  return r.json();
}
async function readGroup(group, token) {
  const me = await get(API + '/profile', token);
  if (!(me.groups || []).some((g) => g.id === group)) throw new Error('the token is not a member of the group ' + group);
  let rows = [], after = '';
  for (;;) {
    const page = await get(API + '/search?limit=200&sort=created&order=asc&group=' + encodeURIComponent(group) + (after ? '&search_after=' + encodeURIComponent(after) : ''), token);
    const got = page.rows || [];
    rows = rows.concat(got);
    if (got.length < 200) return rows;
    after = got[got.length - 1].created;
  }
}

async function main() {
  const argv = process.argv.slice(2);
  const flag = (f) => { const i = argv.indexOf(f); if (i < 0) return null; argv.splice(i, 1); return true; };
  const opt = (f) => { const i = argv.indexOf(f); if (i < 0) return null; const v = argv[i + 1]; argv.splice(i, 2); return v; };
  const DRY = flag('--dry-run'), DIR = opt('--dir'), GROUP = opt('--group');
  const dir = DIR || (fs.existsSync('research/index.html') ? 'research' : '.');
  const token = String(process.env.HYPOTHESIS_TOKEN || '').trim();
  if (!token) throw new Error('set HYPOTHESIS_TOKEN in the environment');
  const vm = require('vm'), sb = { SW: {} }; sb.window = sb; sb.globalThis = sb;
  vm.runInNewContext(fs.readFileSync(path.join(dir, 'js', 'config.js'), 'utf8'), sb);
  const B = sb.SW.BENCH || {}, group = GROUP || B.group;
  if (!group) throw new Error('no group: set group in js/config.js, or give --group');
  const man = JSON.parse(fs.readFileSync(path.join(dir, 'library', 'library.json'), 'utf8'));
  const codes = (man.items || []).map((e) => e && e.id).filter(Boolean);
  const out = build(await readGroup(group, token), codes, ['bk:'].concat(B.tag && B.tag !== 'bk:' ? [B.tag] : []));
  const to = path.join(dir, 'library', 'group.json');
  let old = null;
  try { old = JSON.parse(fs.readFileSync(to, 'utf8')); } catch (e) { /* the first */ }
  const same = (a, b) => ['ratings', 'keys', 'tags'].every((k) => JSON.stringify(a[k]) === JSON.stringify(b[k]));
  const said = Object.keys(out.ratings).length + ' rated, ' + Object.keys(out.keys).length + ' marked, ' + Object.keys(out.tags).length + ' tagged';
  if (old && same(old, out)) { console.log(to + ': no change (' + said + ')'); return; }
  if (DRY) { console.log('would write ' + to + ' (' + said + ')'); return; }
  fs.writeFileSync(to, JSON.stringify(Object.assign({ generated: new Date().toISOString().slice(0, 10) }, out), null, 1) + '\n');
  console.log('wrote ' + to + ' (' + said + ')');
}

if (require.main === module) main().catch((e) => { console.error('library-snapshot: ' + e.message + '. Nothing written.'); process.exit(1); });
module.exports = { build };
