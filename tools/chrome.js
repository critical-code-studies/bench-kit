/*
 * tools/chrome.js - what the kit's tools share: the bench's repository served as GitHub Pages
 * would serve it (with routes of a tool's own), the bench opened in headless Chrome, and
 * scripts run in it. Node 22 or later and Google Chrome or Chromium (CHROME=<path>); no packages.
 *   const C = require('./chrome.js');
 *   C.benchDir(argv)                                 the bench's folder (--dir, or research, or .)
 *   C.withBench({ dir, route, url, ready }, async (page) => { … await page.evaluate(js) … })
 *     url (index.html by default) the page to open; ready, a JS expression true once it is ready
 *     (by default, a version open and the tab row drawn)
 *     route(pathname) -> { type, data } | null       a tool's own answers before the files
 *     page.evaluate(js) runs js in the bench (awaiting a promise) and gives its value;
 *     page.errors, the page's uncaught errors so far
 * On a CI machine (CI set) Chrome runs without its sandbox, which such machines may not allow.
 * Part of bench-kit (github.com/critical-code-studies/bench-kit).
 */
'use strict';
const fs = require('fs');
const path = require('path');
const http = require('http');
const os = require('os');
const { spawn } = require('child_process');

const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.gif': 'image/gif', '.woff2': 'font/woff2', '.txt': 'text/plain', '.pdf': 'application/pdf' };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function fail(tool, m) { console.error(tool + ': ' + m); process.exit(1); }

function benchDir(argv, tool) {
  const i = argv.indexOf('--dir');
  const dir = i >= 0 ? argv[i + 1] : (fs.existsSync('research/index.html') ? 'research' : '.');
  if (!fs.existsSync(path.join(dir, 'index.html'))) fail(tool, 'no ' + path.join(dir, 'index.html') + ': run this from the bench\'s repository, or give --dir');
  return dir;
}

async function withBench(o, fn) {
  const chrome = process.env.CHROME || ['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/Applications/Chromium.app/Contents/MacOS/Chromium',
    '/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser'].find((p) => fs.existsSync(p));
  if (!chrome) throw new Error('no Chrome or Chromium found; give its path as CHROME=');
  const root = process.cwd();
  const server = http.createServer((req, res) => {
    const pn = decodeURIComponent(req.url.split('?')[0]);
    const own = o.route ? o.route(pn) : null;
    if (own) { res.writeHead(own.data == null ? 404 : 200, { 'Content-Type': own.type || 'text/plain', 'Cache-Control': 'no-store' }); res.end(own.data == null ? '' : own.data); return; }
    const p = path.join(root, pn);
    if (!p.startsWith(root)) { res.writeHead(403); res.end(); return; }
    fs.readFile(p, (e, data) => {
      if (e) { res.writeHead(404); res.end(); return; }
      res.writeHead(200, { 'Content-Type': TYPES[path.extname(p)] || 'application/octet-stream', 'Cache-Control': 'no-store' }); res.end(data);
    });
  });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const port = server.address().port, dport = 9300 + Math.floor(Math.random() * 600);
  const prof = fs.mkdtempSync(path.join(os.tmpdir(), 'bench-tool-'));
  const ch = spawn(chrome, ['--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check', '--user-data-dir=' + prof,
    '--remote-debugging-port=' + dport, '--window-size=' + (o.size || '1440,900')].concat(process.env.CI ? ['--no-sandbox'] : [], ['about:blank']), { stdio: 'ignore' });
  const cleanup = () => { try { ch.kill('SIGKILL'); } catch (e) {} server.close(); try { fs.rmSync(prof, { recursive: true, force: true }); } catch (e) {} };
  try {
    let ws = null;
    for (let i = 0; i < 60 && !ws; i++) {
      try { const pg = (await (await fetch('http://127.0.0.1:' + dport + '/json')).json()).find((t) => t.type === 'page'); if (pg) ws = new WebSocket(pg.webSocketDebuggerUrl); }
      catch (e) { await sleep(250); }
    }
    if (!ws) throw new Error('Chrome did not start');
    let id = 0; const pending = {}, errors = [];
    ws.onmessage = (m) => {
      const d = JSON.parse(m.data);
      if (d.id && pending[d.id]) { pending[d.id](d); delete pending[d.id]; }
      else if (d.method === 'Runtime.exceptionThrown') { const x = d.params.exceptionDetails; errors.push(x.exception ? x.exception.description : x.text); }
    };
    await new Promise((r) => { ws.onopen = r; });
    const send = (method, params) => new Promise((r) => { const i = ++id; pending[i] = r; ws.send(JSON.stringify({ id: i, method, params: params || {} })); });
    const page = {
      errors,
      evaluate: async (expression) => {
        const r = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
        const x = r.result && r.result.exceptionDetails;
        if (x) throw new Error(x.exception ? x.exception.description : x.text);
        return r.result && r.result.result ? r.result.result.value : undefined;
      }
    };
    await send('Runtime.enable');
    const rel = path.relative(root, path.resolve(o.dir)).split(path.sep).filter(Boolean).join('/');
    await send('Page.navigate', { url: 'http://127.0.0.1:' + port + '/' + (rel ? rel + '/' : '') + (o.url || 'index.html') });
    // the bench is ready when a version is open and its tab row is drawn (or as the tool says)
    const test = o.ready || '!!(window.SW && SW.state && SW.state.v && document.querySelector("#tabs button"))';
    let ready = false;
    for (let i = 0; i < (o.wait || 120) && !ready; i++) { await sleep(250); try { ready = await page.evaluate('!!(' + test + ')'); } catch (e) {} }
    if (!ready) throw new Error((o.url || 'the bench') + ' did not ' + (o.ready ? 'finish' : 'start') + (errors.length ? ': ' + errors[0] : ''));
    await sleep(500);
    return await fn(page);
  } finally { cleanup(); }
}

module.exports = { benchDir, withBench, fail, sleep };
