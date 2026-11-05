#!/usr/bin/env node
/*
 * tools/new-bench.js - a new research bench from one of the kit's templates (templates/<type>/): the
 * template copied to a new folder, the bench's name, slug, storage prefix, repository and addresses put
 * in place of the example's, a git repository made there with bench-kit as its submodule at a release,
 * and what is left to edit listed. It writes nothing outside the new folder and pushes nothing.
 *
 *   node tools/new-bench.js translation ~/Projects/kuki-bench --name "Kuki" --org vector-humanities --repo kuki-bench
 *   node tools/new-bench.js translation ../rang-bench --name "Rang" --org vector-humanities --kit v0.98.0 --no-git
 *
 *   --name "…"   the bench's name, as in "the Kuki research bench"
 *   --org, --repo   its GitHub organisation and repository (the folder's name if not given)
 *   --slug, --store   file names of exports, and the prefix of its keys in the browser (from the name)
 *   --kit vX.Y.Z    the kit's release for the submodule (this kit's own version if not given)
 *   --no-git        copy and fill only
 * Part of bench-kit (github.com/critical-code-studies/bench-kit).
 */
'use strict';
const fs = require('fs'), path = require('path'), cp = require('child_process');
const args = process.argv.slice(2);
function opt(k, d) { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; }
const type = args[0], dest = args[1] && path.resolve(args[1].replace(/^~(?=\/)/, process.env.HOME));
const kit = path.resolve(__dirname, '..'), tpl = path.join(kit, 'templates', type || '');
if (!type || !dest || !opt('--name')) { console.error('node tools/new-bench.js <type> <folder> --name "…" [--org …] [--repo …] [--kit vX.Y.Z] [--no-git]\n  types: ' + fs.readdirSync(path.join(kit, 'templates')).filter((f) => fs.statSync(path.join(kit, 'templates', f)).isDirectory()).join(', ')); process.exit(1); }
if (!fs.existsSync(tpl)) { console.error('new-bench: no template ' + type); process.exit(1); }
if (fs.existsSync(dest) && fs.readdirSync(dest).length) { console.error('new-bench: ' + dest + ' is not empty'); process.exit(1); }
const name = opt('--name'), org = opt('--org', 'vector-humanities'), repo = opt('--repo', path.basename(dest));
const slug = opt('--slug', name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')), store = opt('--store', slug.replace(/-/g, '').slice(0, 10) + 'bench.');
const version = opt('--kit', 'v' + (/^version:\s*"([^"]+)"/m.exec(fs.readFileSync(path.join(kit, 'CITATION.cff'), 'utf8')) || [0, '0.0.0'])[1]);

// the example's values, and the bench's in their place
const REPL = [
  ['Example Translation Research Bench', name + ' Research Bench'], ['Example Translation research bench', name + ' research bench'],
  ['<b>Example Translation</b>', '<b>' + name + '</b>'], ["'Example Translation, '", "'" + name + ", '"], ["'Example Translation: '", "'" + name + ": '"],
  ["name: 'Example Translation'", "name: '" + name.replace(/'/g, "\\'") + "'"],
  ["'example-translation'", "'" + slug + "'"], ["'extrbench.'", "'" + store + "'"],
  ['vector-humanities.github.io/example-bench/', org + '.github.io/' + repo + '/'], ['github.com/vector-humanities/example-bench', 'github.com/' + org + '/' + repo],
  ["org: 'vector-humanities', repo: 'example_paratexts', cache: 'example-paratexts'", "org: '" + org + "', repo: '" + repo.replace(/-bench$/, '') + "_paratexts', cache: '" + slug + "-paratexts'"]
];
function copy(from, to) {
  fs.mkdirSync(to, { recursive: true });
  for (const f of fs.readdirSync(from)) {
    const a = path.join(from, f), b = path.join(to, f);
    if (fs.statSync(a).isDirectory()) { copy(a, b); continue; }
    if (/\.(html|js|json|md|css|yml|csv|txt)$/.test(f)) { let t = fs.readFileSync(a, 'utf8'); REPL.forEach(([x, y]) => { t = t.split(x).join(y); }); fs.writeFileSync(b, t); }
    else fs.copyFileSync(a, b);
  }
}
copy(tpl, dest);
console.log('Made ' + dest + ' from templates/' + type + '.');
if (!args.includes('--no-git')) {
  const run = (c, a) => cp.execFileSync(c, a, { cwd: dest, stdio: ['ignore', 'pipe', 'inherit'] }).toString();
  run('git', ['init', '-q', '-b', 'main']);
  run('git', ['submodule', 'add', '-q', 'https://github.com/critical-code-studies/bench-kit', 'kit']);
  try { run('git', ['-C', 'kit', 'checkout', '-q', version]); console.log('bench-kit at ' + version + ' in kit/.'); }
  catch (e) { console.log('bench-kit added in kit/; ' + version + ' is not a release there yet, so it is at the kit\'s main: check out a release before the first commit.'); }
  console.log('A git repository, nothing committed: look over the files, then commit and push it yourself.');
}
const left = [];
for (const f of ['js/config.js', 'js/versions.js']) {
  const p = path.join(dest, f); if (!fs.existsSync(p)) continue;
  fs.readFileSync(p, 'utf8').split('\n').forEach((l, i) => { if (/\bEDIT\b/.test(l)) left.push(f + ':' + (i + 1) + '  ' + l.trim().slice(0, 110)); });
}
console.log('\nLeft to edit (' + left.length + '):\n  ' + left.join('\n  '));
