'use strict';
/**
 * vclock.js — preload (-r). Bridge surecinde SANAL SAAT kurar ve senaryoyu surer.
 *
 * setTimeout/setInterval/Date/performance.now sanal; HTTP/WS G/C gercek.
 * Surucu: siradaki zamanlayiciya atla -> calistir -> gercek olay dongusune
 * nefes aldir (promise/IO otursun) -> devam. Boylece 3 saatlik yeniden
 * baglanma takvimi birkac saniyede, jitter'i bozmadan gozlenir.
 *
 * Girdi : TLC_SENARYO = senaryo JSON dosyasi
 * Cikti : TLC_CIKTI   = sonuc JSON dosyasi (connect() cagri zamanlari vb.)
 */
const fs = require('fs');
const http = require('http');
const util = require('util');

const senaryo = JSON.parse(fs.readFileSync(process.env.TLC_SENARYO, 'utf8'));
const CIKTI = process.env.TLC_CIKTI;

const G = {
  setTimeout: global.setTimeout, clearTimeout: global.clearTimeout,
  setInterval: global.setInterval, clearInterval: global.clearInterval,
  setImmediate: global.setImmediate, Date: global.Date,
};

const T0 = 1794000000000;            // sabit sanal baslangic (2026-11)
let simdi = T0;
let sira = 0;
const zamanlar = new Map();          // id -> Zaman

class Zaman {
  constructor(fn, ms, args, tekrar) {
    this.id = ++sira;
    this.fn = fn; this.args = args;
    this.ms = Math.max(tekrar ? 1 : 0, Number(ms) || 0);
    this.tekrar = tekrar;
    this.ne = simdi + this.ms;
    this._ref = true;
    zamanlar.set(this.id, this);
  }
  ref() { this._ref = true; return this; }
  unref() { this._ref = false; return this; }
  hasRef() { return this._ref; }
  refresh() { this.ne = simdi + this.ms; if (!zamanlar.has(this.id)) zamanlar.set(this.id, this); return this; }
  close() { zamanlar.delete(this.id); return this; }
  [Symbol.toPrimitive]() { return this.id; }
  [Symbol.dispose]() { this.close(); }
}

function sanalSetTimeout(fn, ms, ...args) {
  if (typeof fn !== 'function') throw new TypeError('callback function olmali');
  return new Zaman(fn, ms, args, false);
}
sanalSetTimeout[util.promisify.custom] = (ms, deger) => new Promise((r) => sanalSetTimeout(() => r(deger), ms));
function sanalSetInterval(fn, ms, ...args) { return new Zaman(fn, ms, args, true); }
function sanalClear(z) {
  if (z == null) return;
  const id = typeof z === 'object' ? z.id : Number(z);
  zamanlar.delete(id);
}

global.setTimeout = sanalSetTimeout;
global.setInterval = sanalSetInterval;
global.clearTimeout = sanalClear;
global.clearInterval = sanalClear;

class SanalDate extends G.Date {
  constructor(...a) { if (a.length === 0) super(simdi); else super(...a); }
  static now() { return simdi; }
}
global.Date = SanalDate;
const perfBas = performance.now();
performance.now = () => perfBas + (simdi - T0);
const hrBas = process.hrtime.bigint();
const gercekHr = process.hrtime;
process.hrtime = Object.assign((onceki) => {
  const ns = hrBas + BigInt(simdi - T0) * 1000000n;
  const s = Number(ns / 1000000000n), n = Number(ns % 1000000000n);
  if (onceki) { let ds = s - onceki[0], dn = n - onceki[1]; if (dn < 0) { ds--; dn += 1e9; } return [ds, dn]; }
  return [s, n];
}, { bigint: () => hrBas + BigInt(simdi - T0) * 1000000n });
void gercekHr;
process.uptime = () => (simdi - T0) / 1000;

// require('timers') / 'timers/promises' uzerinden kacisi da kapat
const timers = require('timers');
timers.setTimeout = sanalSetTimeout; timers.setInterval = sanalSetInterval;
timers.clearTimeout = sanalClear; timers.clearInterval = sanalClear;
const tp = require('timers/promises');
tp.setTimeout = (ms, deger, o) => new Promise((res, rej) => {
  const z = sanalSetTimeout(() => res(deger), ms);
  if (o && o.signal) {
    if (o.signal.aborted) { sanalClear(z); return rej(o.signal.reason); }
    o.signal.addEventListener('abort', () => { sanalClear(z); rej(o.signal.reason); }, { once: true });
  }
});
tp.scheduler = { wait: (ms, o) => tp.setTimeout(ms, undefined, o), yield: () => new Promise((r) => G.setImmediate(r)) };
AbortSignal.timeout = (ms) => {
  const c = new AbortController();
  sanalSetTimeout(() => c.abort(new DOMException('The operation was aborted due to timeout', 'TimeoutError')), ms);
  return c.signal;
};

// ---- senaryo -> sahte paket ------------------------------------------------
globalThis.__TLC = {
  script: senaryo.script || [],
  byUser: senaryo.byUser || null,
  opts: { sonra: senaryo.sonra || { r: 'offline' } },
  connects: [], instances: [], calls: [],
};

// ---- log yakala --------------------------------------------------------------
const loglar = [];
for (const ad of ['log', 'error', 'warn', 'info']) {
  const asil = console[ad].bind(console);
  console[ad] = (...a) => {
    const metin = util.format(...a);
    loglar.push({ t: simdi - T0, ad, metin });
    if (process.env.TLC_GOSTER) asil(`[+${((simdi - T0) / 1000).toFixed(1)}s]`, metin);
  };
}

const hatalar = [];
process.on('unhandledRejection', (e) => { hatalar.push({ t: simdi - T0, tur: 'unhandledRejection', metin: String(e && e.stack || e) }); });
process.on('uncaughtException', (e) => { hatalar.push({ t: simdi - T0, tur: 'uncaughtException', metin: String(e && e.stack || e) }); });

// ---- surucu ------------------------------------------------------------------
const nefes = (ms) => new Promise((r) => G.setTimeout(r, ms));
const anlik = () => new Promise((r) => G.setImmediate(r));

function istek(yontem, yol) {
  const port = Number(senaryo.port);
  return new Promise((coz) => {
    const req = http.request({
      host: '127.0.0.1', port, path: yol, method: yontem,
      headers: { host: 'localhost:' + port, origin: 'http://localhost:' + port, 'x-tt': '1', 'content-length': 0 },
    }, (res) => { let g = ''; res.on('data', (d) => (g += d)); res.on('end', () => coz({ kod: res.statusCode, govde: g })); });
    req.on('error', (e) => coz({ kod: 0, govde: String(e) }));
    req.end();
  });
}
/** Durum degistiren uc: once yeni sozlesme (POST + X-TT), olmazsa eski (GET). */
async function api(yol) {
  let c = await istek('POST', yol);
  if (c.kod !== 200) { const g = await istek('GET', yol); if (g.kod === 200) c = Object.assign(g, { yontem: 'GET' }); }
  return c;
}

async function sur() {
  await nefes(senaryo.acilisMs || 500);           // listen + ilk import() otursun
  const bitis = T0 + senaryo.sureMs;
  const eylemler = (senaryo.eylemler || []).slice().sort((a, b) => a.t - b.t);
  const ornekler = [];
  let sonOrnek = -1e9;
  let adim = 0;
  for (;;) {
    // siradaki zamanlayici
    let en = null;
    for (const z of zamanlar.values()) if (!en || z.ne < en.ne || (z.ne === en.ne && z.id < en.id)) en = z;
    const eylem = eylemler[0];
    const eylemNe = eylem ? T0 + eylem.t : Infinity;
    const zNe = en ? en.ne : Infinity;
    const hedef = Math.min(zNe, eylemNe);
    if (hedef > bitis) break;
    if (hedef > simdi) simdi = hedef;
    if (eylemNe <= zNe) {
      eylemler.shift();
      let sonuc;
      if (eylem.api) sonuc = await api(eylem.api);
      else if (eylem.durum) sonuc = await istek('GET', '/api/status');
      (globalThis.__TLC.calls).push({ t: simdi, ad: 'EYLEM', eylem, sonuc: sonuc && { kod: sonuc.kod, govde: String(sonuc.govde).slice(0, 300), yontem: sonuc.yontem || 'POST' } });
    } else {
      if (en.tekrar) en.ne = simdi + en.ms; else zamanlar.delete(en.id);
      try { en.fn(...en.args); } catch (e) { hatalar.push({ t: simdi - T0, tur: 'zamanlayici', metin: String(e && e.stack || e) }); }
    }
    await anlik(); await anlik();
    if (++adim % 20 === 0) await nefes(1);
    await anlik();
    if (senaryo.ornekHer && simdi - sonOrnek >= senaryo.ornekHer) {
      sonOrnek = simdi;
      const s = await istek('GET', '/api/status');
      let j = null; try { j = JSON.parse(s.govde); } catch { /* */ }
      ornekler.push({ t: simdi - T0, kod: s.kod, mode: j && j.mode, connected: j && j.connected, bekliyor: j && j.bekliyor, user: j && j.user });
    }
  }
  simdi = bitis;
  const son = await istek('GET', '/api/status');
  const T = globalThis.__TLC;
  const cikti = {
    senaryo: senaryo.ad, sureMs: senaryo.sureMs,
    connects: T.connects.map((c) => Object.assign({}, c, { t: c.t - T0, tBitti: c.tBitti != null ? c.tBitti - T0 : undefined })),
    instances: T.instances.map((i) => Object.assign({}, i, { t: i.t - T0, olaylar: i.olaylar.map((o) => Object.assign({}, o, { t: o.t - T0 })) })),
    calls: T.calls.map((c) => Object.assign({}, c, { t: c.t - T0 })),
    chatSayisi: T.chatSayisi || {}, eulerCagri: T.eulerCagri || 0,
    kalanScript: T.script.length,
    kalanZamanlayici: zamanlar.size,
    sonDurum: son.govde, ornekler, loglar, hatalar,
  };
  fs.writeFileSync(CIKTI, JSON.stringify(cikti, null, 1));
  process.exit(0);
}
G.setTimeout(() => sur().catch((e) => { fs.writeFileSync(CIKTI, JSON.stringify({ surucuHatasi: String(e && e.stack || e), loglar, hatalar })); process.exit(3); }), 0);
