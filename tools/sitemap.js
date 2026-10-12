#!/usr/bin/env node
/*
 * tools/sitemap.js - writes a bench's sitemap.html: serves the bench's repository, opens its
 * page in headless Chrome, runs kit/sitemap.js there (SW.sitemapHTML) and saves what it gives.
 * The site map is made from the bench as it runs: its tab row and menus, its versions,
 * references and source files. Run from the bench's repository:
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
const http = require('http');
const os = require('os');
const { spawn } = require('child_process');

const argv = process.argv.slice(2);
const DRY = argv.includes('--dry-run');
const di = argv.indexOf('--dir');
const dir = di >= 0 ? argv[di + 1] : (fs.existsSync('research/index.html') ? 'research' : '.');
const fail = (m) => { console.error('sitemap: ' + m); process.exit(1); };
if (!fs.existsSync(path.join(dir, 'index.html'))) fail('no ' + path.join(dir, 'index.html') + ': run this from the bench\'s repository, or give --dir');
const sitemapJs = path.join(__dirname, '..', 'sitemap.js');

const chrome = process.env.CHROME || ['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/Applications/Chromium.app/Contents/MacOS/Chromium',
  '/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser'].find((p) => fs.existsSync(p));
if (!chrome) fail('no Chrome or Chromium found; give its path as CHROME=');

// the repository, served as GitHub Pages would (the bench reads ../ for its sources)
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.woff2': 'font/woff2' };
const root = process.cwd();
const server = http.createServer((req, res) => {
  const p = path.join(root, decodeURIComponent(req.url.split('?')[0]));
  if (!p.startsWith(root)) { res.writeHead(403); res.end(); return; }
  fs.readFile(p, (e, data) => {
    if (e) { res.writeHead(404); res.end(); return; }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(p)] || 'application/octet-stream' }); res.end(data);
  });
});

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
server.listen(0, '127.0.0.1', async () => {
  const port = server.address().port, dport = 9300 + Math.floor(Math.random() * 600);
  const prof = fs.mkdtempSync(path.join(os.tmpdir(), 'bench-sitemap-'));
  const ch = spawn(chrome, ['--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check', '--user-data-dir=' + prof,
    '--remote-debugging-port=' + dport, '--window-size=1440,900', 'about:blank'], { stdio: 'ignore' });
  const done = (code) => { try { ch.kill('SIGKILL'); } catch (e) {} server.close(); try { fs.rmSync(prof, { recursive: true, force: true }); } catch (e) {} process.exit(code); };
  try {
    let ws = null;
    for (let i = 0; i < 60 && !ws; i++) {
      try { const page = (await (await fetch('http://127.0.0.1:' + dport + '/json')).json()).find((t) => t.type === 'page'); if (page) ws = new WebSocket(page.webSocketDebuggerUrl); }
      catch (e) { await sleep(250); }
    }
    if (!ws) throw new Error('Chrome did not start');
    let id = 0; const pending = {}, errors = [];
    ws.onmessage = (m) => {
      const d = JSON.parse(m.data);
      if (d.id && pending[d.id]) { pending[d.id](d); delete pending[d.id]; }
      else if (d.method === 'Runtime.exceptionThrown') errors.push(d.params.exceptionDetails.exception ? d.params.exceptionDetails.exception.description : d.params.exceptionDetails.text);
    };
    await new Promise((r) => { ws.onopen = r; });
    const send = (method, params) => new Promise((r) => { const i = ++id; pending[i] = r; ws.send(JSON.stringify({ id: i, method, params: params || {} })); });
    const evaluate = async (expression) => {
      const r = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
      if (r.result && r.result.exceptionDetails) throw new Error(r.result.exceptionDetails.exception ? r.result.exceptionDetails.exception.description : r.result.exceptionDetails.text);
      return r.result && r.result.result ? r.result.result.value : undefined;
    };
    await send('Runtime.enable');
    const rel = path.relative(root, path.resolve(dir)).split(path.sep).filter(Boolean).join('/');
    await send('Page.navigate', { url: 'http://127.0.0.1:' + port + '/' + (rel ? rel + '/' : '') + 'index.html' });
    // the bench is ready when a version is open and its tab row is drawn
    let ready = false;
    for (let i = 0; i < 120 && !ready; i++) { await sleep(250); try { ready = await evaluate('!!(window.SW && SW.state && SW.state.v && document.querySelector("#tabs button"))'); } catch (e) {} }
    if (!ready) throw new Error('the bench did not start' + (errors.length ? ': ' + errors[0] : ''));
    await sleep(500);
    await evaluate(fs.readFileSync(sitemapJs, 'utf8'));
    const html = await evaluate('SW.sitemapHTML()');
    if (!html) throw new Error('no page came back' + (errors.length ? ': ' + errors[0] : ''));
    if (DRY) process.stdout.write(html);
    else {
      const out = path.join(dir, 'sitemap.html');
      fs.writeFileSync(out, html);
      console.log('wrote ' + out + ' (' + (html.match(/<li>/g) || []).length + ' links to views, ' + ((html.match(/<tr[ >]/g) || []).length - 1) + ' versions)');
    }
    done(0);
  } catch (e) { console.error('sitemap: ' + e.message); done(1); }
});
