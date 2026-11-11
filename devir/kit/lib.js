'use strict';
/** lib.js — danisman kitinin ortak parcalari. Depoya ASLA yazmaz. */
const fs = require('fs');
const path = require('path');
const http = require('http');
const net = require('net');
const crypto = require('crypto');
const { spawn } = require('child_process');

const KOK = __dirname;
// Depo: TT_REPO verilmediyse bu klasorun (devir/kit) iki ustu.
const REPO = process.env.TT_REPO || path.resolve(KOK, '..', '..');
// Kopru, ayar/istatistik dosyalarini execPath'in YANINA yazar. Sistem node'unun
// yanina yazmasin diye node'un bir kopyasi bin/ altinda tutulur (ilk kullanimda kopyalanir).
const NODE = (() => {
  const hedef = path.join(KOK, 'bin', process.platform === 'win32' ? 'node.exe' : 'node');
  try {
    if (!fs.existsSync(hedef)) { fs.mkdirSync(path.dirname(hedef), { recursive: true }); fs.copyFileSync(process.execPath, hedef); fs.chmodSync(hedef, 0o755); }
  } catch { /* kopyalanamazsa bridgeBaslat hata verir */ }
  return hedef;
})();
const CIKTI = path.join(KOK, 'out');

const bekle = (ms) => new Promise((r) => setTimeout(r, ms));

/** "head" | "repo" | mutlak yol -> kaynak klasor */
function kaynak(ad) {
  if (!ad || ad === 'repo' || ad === 'calisma') return REPO;
  if (ad === 'head') return path.join(KOK, 'head');
  return path.resolve(ad);
}

/**
 * Kaynagin server/ + overlays/ klasorlerini danisman/stage/<etiket>/ altina
 * kopyalar (node_modules HARIC). Boylece:
 *   - `tiktok-live-connector` cozumlemesi danisman/node_modules'taki SAHTE
 *     pakete duser (gercek paket kurulu olsa bile aga cikilmaz),
 *   - calisan agac kilitlenmez, yarim yazilmis dosya okunmaz.
 */
function sahnele(kaynakYol, etiket) {
  const hedef = path.join(KOK, 'stage', etiket);
  fs.rmSync(hedef, { recursive: true, force: true });
  fs.mkdirSync(hedef, { recursive: true });
  for (const k of ['server', 'overlays']) {
    fs.cpSync(path.join(kaynakYol, k), path.join(hedef, k), {
      recursive: true,
      filter: (s) => !/[\\/]node_modules([\\/]|$)/.test(s),
    });
  }
  return hedef;
}

/** Bridge'i baslat. opts: { port, args:[], env:{}, preload:[], etiket } */
function bridgeBaslat(klasor, opts = {}) {
  const port = opts.port;
  const guardLog = path.join(CIKTI, `guard-${opts.etiket || port}.log`);
  try { fs.rmSync(guardLog, { force: true }); } catch { /* */ }
  const pre = [path.join(KOK, 'guard.js'), ...(opts.preload || [])];
  const argv = [];
  for (const p of pre) argv.push('-r', p);
  argv.push(path.join(klasor, 'server', 'bridge.js'), '--port', String(port), '--no-80', ...(opts.args || []));
  const env = Object.assign({}, process.env, { DANISMAN_GUARD_LOG: guardLog }, opts.env || {});
  delete env.EULER_API_KEY; delete env.SIGN_API_KEY;
  const cocuk = spawn(NODE, argv, { cwd: klasor, env, stdio: ['ignore', 'pipe', 'pipe'] });
  const b = { cocuk, port, cikis: null, stdout: '', stderr: '', guardLog };
  cocuk.stdout.on('data', (d) => { b.stdout += d; });
  cocuk.stderr.on('data', (d) => { b.stderr += d; });
  b.bitti = new Promise((r) => cocuk.on('exit', (kod, sinyal) => { b.cikis = { kod, sinyal }; r(b.cikis); }));
  b.oldur = async () => { if (!b.cikis) { cocuk.kill('SIGKILL'); await b.bitti; } };
  b.canli = () => !b.cikis;
  b.guard = () => { try { return fs.readFileSync(guardLog, 'utf8').trim().split('\n').filter(Boolean); } catch { return []; } };
  return b;
}

/** Ham HTTP istegi: Host/Origin basliklari tam kontrol altinda. */
function ham(opts) {
  const { port, host = '127.0.0.1', yontem = 'GET', yol = '/', basliklar = {}, govde = null, zaman = 4000 } = opts;
  return new Promise((coz) => {
    const h = Object.assign({}, basliklar);
    if (govde != null && h['content-length'] == null) h['content-length'] = Buffer.byteLength(govde);
    const req = http.request({ host, port, method: yontem, path: yol, headers: h, setHost: false, agent: false }, (res) => {
      const p = [];
      res.on('data', (d) => p.push(d));
      res.on('end', () => coz({ kod: res.statusCode, basliklar: res.headers, govde: Buffer.concat(p).toString('utf8') }));
    });
    req.setTimeout(zaman, () => { req.destroy(new Error('zaman asimi')); });
    req.on('error', (e) => coz({ kod: 0, hata: e.code || e.message, basliklar: {}, govde: '' }));
    if (govde != null) req.write(govde);
    req.end();
  });
}

async function hazirBekle(b, ms = 8000) {
  const t0 = Date.now();
  while (Date.now() - t0 < ms) {
    if (!b.canli()) throw new Error('bridge acilmadan oldu:\n' + b.stdout.slice(-1500) + b.stderr.slice(-1500));
    const c = await ham({ port: b.port, yol: '/api/status', basliklar: { host: 'localhost:' + b.port } });
    if (c.kod === 200) return true;
    await bekle(120);
  }
  throw new Error('bridge ' + ms + 'ms icinde hazir olmadi\n' + b.stdout.slice(-800) + b.stderr.slice(-800));
}

/**
 * Minik ham WebSocket istemcisi (Host + Origin basligi serbest).
 * Doner: { acildi, kod, mesajlar[], kapat(), bekle(fn, ms) }
 */
function wsAc(opts) {
  const { port, host = '127.0.0.1', hostBasligi, origin, yol = '/ws', zaman = 3000 } = opts;
  return new Promise((coz) => {
    const anahtar = crypto.randomBytes(16).toString('base64');
    const sok = net.connect({ host, port });
    const w = { acildi: false, kod: 0, mesajlar: [], dinleyiciler: new Set(), hata: null };
    let tampon = Buffer.alloc(0), baslik = false, bitti = false;
    const son = () => { if (!bitti) { bitti = true; coz(w); } };
    const zt = setTimeout(() => { w.hata = w.hata || 'zaman asimi'; if (!w.acildi) sok.destroy(); son(); }, zaman);
    w.kapat = () => { try { sok.destroy(); } catch { /* */ } };
    w.bekle = (fn, ms) => new Promise((r) => {
      const var_ = w.mesajlar.find(fn);
      if (var_) return r(var_);
      const d = (m) => { if (fn(m)) { w.dinleyiciler.delete(d); clearTimeout(t); r(m); } };
      const t = setTimeout(() => { w.dinleyiciler.delete(d); r(null); }, ms);
      w.dinleyiciler.add(d);
    });
    sok.on('connect', () => {
      let s = `GET ${yol} HTTP/1.1\r\n`;
      if (hostBasligi !== null) s += `Host: ${hostBasligi || 'localhost:' + port}\r\n`;
      s += 'Upgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Version: 13\r\n';
      s += `Sec-WebSocket-Key: ${anahtar}\r\n`;
      if (origin) s += `Origin: ${origin}\r\n`;
      s += '\r\n';
      sok.write(s);
    });
    sok.on('data', (d) => {
      tampon = Buffer.concat([tampon, d]);
      if (!baslik) {
        const i = tampon.indexOf('\r\n\r\n');
        if (i < 0) return;
        const bas = tampon.subarray(0, i).toString('latin1');
        tampon = tampon.subarray(i + 4);
        baslik = true;
        w.kod = Number((bas.match(/^HTTP\/1\.1 (\d+)/) || [])[1]) || 0;
        w.acildi = w.kod === 101;
        clearTimeout(zt);
        son();
        if (!w.acildi) { sok.destroy(); return; }
      }
      for (;;) {
        if (tampon.length < 2) break;
        const op = tampon[0] & 0x0f;
        let len = tampon[1] & 0x7f, o = 2;
        if (len === 126) { if (tampon.length < 4) break; len = tampon.readUInt16BE(2); o = 4; }
        else if (len === 127) { if (tampon.length < 10) break; len = Number(tampon.readBigUInt64BE(2)); o = 10; }
        if (tampon.length < o + len) break;
        const yuk = tampon.subarray(o, o + len);
        tampon = tampon.subarray(o + len);
        if (op === 1) {
          let m; try { m = JSON.parse(yuk.toString('utf8')); } catch { m = { ham: yuk.toString('utf8') }; }
          w.mesajlar.push(m);
          for (const fn of [...w.dinleyiciler]) fn(m);
        } else if (op === 8) { sok.destroy(); break; }
      }
    });
    sok.on('error', (e) => { w.hata = e.code || e.message; clearTimeout(zt); son(); });
    sok.on('close', () => { w.kapandi = true; clearTimeout(zt); son(); });
  });
}

/** Basit statik sunucu (overlay'leri kopru olmadan sunmak / saldirgan sayfa). */
function statikSunucu(kokYol, port, ek = {}) {
  const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
    '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp',
    '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg', '.wav': 'audio/wav', '.woff2': 'font/woff2' };
  const s = http.createServer((req, res) => {
    const u = decodeURIComponent((req.url || '/').split('?')[0]);
    if (ek.isle && ek.isle(req, res, u)) return;
    const dosya = path.join(kokYol, path.normalize(u).replace(/^(\.\.[\\/])+/, ''));
    if (!dosya.startsWith(kokYol)) { res.writeHead(403).end(); return; }
    fs.readFile(dosya, (e, veri) => {
      if (e) { res.writeHead(404, { 'content-type': 'text/plain' }).end('404'); return; }
      res.writeHead(200, { 'content-type': MIME[path.extname(dosya).toLowerCase()] || 'application/octet-stream', 'cache-control': 'no-store' });
      res.end(veri);
    });
  });
  return new Promise((coz, red) => { s.on('error', red); s.listen(port, '127.0.0.1', () => coz(s)); });
}

async function tarayici(ekArg = []) {
  const { chromium } = require('playwright');
  return chromium.launch({
    executablePath: process.env.TT_CHROMIUM || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined),
    // --no-proxy-server: ortam proxy'si WS'i bozuyor ve hicbir istek disari cikmamali.
    // PNA kapali: sunucunun KENDI savunmasini olcuyoruz, Chrome'un Private Network Access'ini degil
    // (OBS/LIVE Studio'nun gomulu CEF surumunde PNA'ya guvenilemez).
    args: ['--autoplay-policy=no-user-gesture-required', '--mute-audio', '--no-proxy-server',
      '--disable-features=PrivateNetworkAccessSendPreflights,BlockInsecurePrivateNetworkRequests,LocalNetworkAccessChecks,PrivateNetworkAccessRespectPreflightResults', ...ekArg],
  });
}

/** PNG'yi telefon genisligine (390) kucult — Chromium ile (Pillow bu makinede bozuk). */
async function telefon(tr, pngYol, cikisYol, gen = 390) {
  const veri = fs.readFileSync(pngYol).toString('base64');
  const ctx = await tr.newContext({ viewport: { width: gen, height: 900 } });
  const p = await ctx.newPage();
  await p.setContent(`<body style="margin:0;background:#000"><img id="i" style="width:${gen}px;display:block" src="data:image/png;base64,${veri}">`);
  await p.waitForFunction(() => document.getElementById('i').complete && document.getElementById('i').naturalWidth > 0);
  await p.locator('#i').screenshot({ path: cikisYol });
  await ctx.close();
  return cikisYol;
}

function yaz(ad, nesne) {
  fs.mkdirSync(CIKTI, { recursive: true });
  const y = path.join(CIKTI, ad);
  fs.writeFileSync(y, typeof nesne === 'string' ? nesne : JSON.stringify(nesne, null, 1));
  return y;
}

/** Turkce-duyarli kucultme + sadeleştirme (İ/I/ı/i, ş, ç, ğ, ö, ü). */
function trSade(s) {
  return String(s).toLocaleLowerCase('tr')
    .replace(/ı/g, 'i').replace(/ş/g, 's').replace(/ğ/g, 'g')
    .replace(/ü/g, 'u').replace(/ö/g, 'o').replace(/ç/g, 'c')
    .replace(/â/g, 'a').replace(/î/g, 'i').replace(/û/g, 'u')
    .normalize('NFD').replace(/[̀-ͯ]/g, '');
}

module.exports = { KOK, REPO, NODE, CIKTI, bekle, kaynak, sahnele, bridgeBaslat, ham, hazirBekle, wsAc, statikSunucu, tarayici, telefon, yaz, trSade };
