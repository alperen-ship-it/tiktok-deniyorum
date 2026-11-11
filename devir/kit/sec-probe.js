'use strict';
/**
 * sec-probe.js <head|repo|yol> [--hizli] [--ek "--host yayin.local"]
 *
 * Kara kutu guvenlik sondasi. Kopruyu (kullanicisiz = test modu) 9061'de
 * baslatir, 9062'de BASKA ORIGIN'de (http://evil.example:9062) bir saldirgan
 * sayfa acar ve gercek Chromium ile saldiri vektorlerini dener. "Etki"yi
 * cevaptan degil GOZLENEBILIR DURUMDAN olcer:
 *   soyle  -> mesru WS dinleyicisine {type:'bot', text:<isaret>} dustu mu
 *   fire   -> mesru WS dinleyicisine sahte olay dustu mu
 *   oyun   -> /api/istatistik.aktifOyun degisti mi
 *   baglan -> /api/status.user degisti mi   (sahte kutuphane: aga cikmaz)
 *   kapat  -> surec oldu mu
 * Her satir: beklenen (ENGEL/IZIN) ve olan. Beklenenden sapma = BULGU.
 */
const os = require('os');
const path = require('path');
const net = require('net');
const L = require('./lib');

const P = 9061, PA = 9062;
const MESRU = `http://localhost:${P}`;
const argv = process.argv.slice(2);
const HIZLI = argv.includes('--hizli');
const ekI = argv.indexOf('--ek');
const EK = ekI >= 0 ? argv[ekI + 1].split(/\s+/).filter(Boolean) : [];
const hedef = argv.find((a, i) => !a.startsWith('--') && argv[i - 1] !== '--ek') || 'repo';
const hedefAd = path.basename(hedef);

let klasor, B, gozcu, sayac = 0;
const satirlar = [];        // {grup, ad, beklenen:'ENGEL'|'IZIN'|'BILGI', oldu:boolean, kanit}

function kayit(grup, ad, beklenen, oldu, kanit) {
  const bulgu = beklenen === 'BILGI' ? false : (beklenen === 'ENGEL' ? oldu : !oldu);
  satirlar.push({ grup, ad, beklenen, oldu, kanit: kanit || '', bulgu });
  const isaret = beklenen === 'BILGI' ? 'BILGI ' : bulgu ? 'BULGU ' : 'tamam ';
  console.log(`  [${isaret}] ${ad.padEnd(62)} beklenen=${beklenen.padEnd(5)} etki=${oldu ? 'VAR' : 'yok'}${kanit ? '  (' + kanit + ')' : ''}`);
}

async function kopruAc() {
  B = L.bridgeBaslat(klasor, { port: P, etiket: 'sec-' + hedefAd, args: ['--rate', '0.3', ...EK] });
  await L.hazirBekle(B);
  await gozcuAc();
}
async function gozcuAc() {
  if (gozcu) gozcu.kapat();
  gozcu = await L.wsAc({ port: P, hostBasligi: 'localhost:' + P, origin: MESRU });
  if (!gozcu.acildi) gozcu = await L.wsAc({ port: P, hostBasligi: 'localhost:' + P });
  if (!gozcu.acildi) throw new Error('mesru WS gozcusu acilamadi (kod ' + gozcu.kod + ') — sonda kor kalir');
}
async function hayatta() { if (!B.canli()) { await kopruAc(); return false; } return true; }

/** Mesru cagri: once yeni sozlesme (POST + X-TT + ayni Origin), olmazsa eski GET. */
async function mesru(yol) {
  let c = await L.ham({ port: P, yontem: 'POST', yol, basliklar: { host: 'localhost:' + P, origin: MESRU, 'x-tt': '1', 'content-length': '0' } });
  if (c.kod !== 200) c = await L.ham({ port: P, yol, basliklar: { host: 'localhost:' + P } });
  return c;
}
async function durum() { try { return JSON.parse((await L.ham({ port: P, yol: '/api/status', basliklar: { host: 'localhost:' + P } })).govde); } catch { return {}; } }
async function istat() { try { return JSON.parse((await L.ham({ port: P, yol: '/api/istatistik', basliklar: { host: 'localhost:' + P } })).govde); } catch { return {}; } }

/**
 * Uc tanimlari: her biri bir "yuk" uretir (sorgu + govde alanlari) ve
 * saldiridan sonra etkiyi olcen bir fonksiyon verir.
 */
const UCLAR = {
  fire: {
    yuk: () => ({ type: 'subscribe' }),
    async once() { gozcu.mesajlar.length = 0; },
    async etki() { const m = await gozcu.bekle((x) => x.type === 'subscribe', 900); return [!!m, m ? 'WS dinleyicisine sahte "subscribe" olayi dustu' : '']; },
  },
  soyle: {
    yuk: () => ({ text: 'ATK' + (++sayac) + 'x' }),
    async once() { gozcu.mesajlar.length = 0; },
    async etki(y) { const m = await gozcu.bekle((x) => x.type === 'bot' && String(x.text).includes(y.text), 6500); return [!!m, m ? 'ekrana/sohbete bot mesaji: ' + m.text : '']; },
  },
  oyun: {
    yuk: () => ({ ad: 'atk' + (++sayac) }),
    async once() {},
    async etki(y) { await L.bekle(250); const s = await istat(); return [s.aktifOyun === y.ad, s.aktifOyun === y.ad ? 'istatistik.aktifOyun=' + s.aktifOyun : '']; },
  },
  baglan: {
    yuk: () => ({ user: 'atk' + (++sayac) }),
    async once() {},
    async etki(y) {
      await L.bekle(300);
      const s = await durum();
      const oldu = s.user === y.user;
      if (oldu) { await mesru('/api/baglan?user='); await L.bekle(200); await gozcuAc(); }
      return [oldu, oldu ? 'kopru saldirganin sectigi hesaba baglanmaya gitti: user=' + s.user : ''];
    },
  },
  kapat: {
    yuk: () => ({}),
    async once() {},
    async etki() {
      await Promise.race([B.bitti, L.bekle(1500)]);
      const oldu = !B.canli();
      if (oldu) await kopruAc();
      return [oldu, oldu ? 'KOPRU SURECI KAPANDI (yayindaki butun oyunlar durur)' : ''];
    },
  },
};

/** Saldirgan sayfada (http://evil.example:9062) calisan vektorler. */
const VEKTORLER = {
  'img GET': (u) => new Promise((r) => { const i = new Image(); i.onload = i.onerror = () => r('bitti'); i.src = u.tam; setTimeout(() => r('zaman'), 1500); }),
  'fetch no-cors GET': (u) => fetch(u.tam, { mode: 'no-cors' }).then(() => 'opak', (e) => 'red:' + e.message),
  'fetch no-cors POST (text/plain govde)': (u) => fetch(u.tam, { method: 'POST', mode: 'no-cors', body: u.sorgu }).then(() => 'opak', (e) => 'red:' + e.message),
  'fetch no-cors POST (urlencoded govde)': (u) => fetch(u.tam, { method: 'POST', mode: 'no-cors', body: new URLSearchParams(u.alanlar) }).then(() => 'opak', (e) => 'red:' + e.message),
  'fetch no-cors POST (JSON-gibi text/plain)': (u) => fetch(u.yol, { method: 'POST', mode: 'no-cors', body: JSON.stringify(u.alanlar) }).then(() => 'opak', (e) => 'red:' + e.message),
  'sendBeacon POST': (u) => Promise.resolve(String(navigator.sendBeacon(u.tam, new URLSearchParams(u.alanlar)))),
  'form POST otomatik gonderim': (u) => new Promise((r) => {
    const f = document.createElement('iframe'); f.name = 'f' + Math.random(); f.style.display = 'none'; document.body.appendChild(f);
    const form = document.createElement('form'); form.method = 'post'; form.action = u.tam; form.target = f.name;
    for (const [k, v] of Object.entries(u.alanlar)) { const i = document.createElement('input'); i.name = k; i.value = v; form.appendChild(i); }
    document.body.appendChild(form); form.submit(); setTimeout(() => { f.remove(); form.remove(); r('gonderildi'); }, 700);
  }),
  'form POST enctype=text/plain': (u) => new Promise((r) => {
    const f = document.createElement('iframe'); f.name = 'f' + Math.random(); f.style.display = 'none'; document.body.appendChild(f);
    const form = document.createElement('form'); form.method = 'post'; form.action = u.tam; form.target = f.name; form.enctype = 'text/plain';
    for (const [k, v] of Object.entries(u.alanlar)) { const i = document.createElement('input'); i.name = k; i.value = v; form.appendChild(i); }
    document.body.appendChild(form); form.submit(); setTimeout(() => { f.remove(); form.remove(); r('gonderildi'); }, 700);
  }),
  'gizli iframe GET (gezinme)': (u) => new Promise((r) => { const f = document.createElement('iframe'); f.style.display = 'none'; f.src = u.tam; document.body.appendChild(f); setTimeout(() => { f.remove(); r('yuklendi'); }, 700); }),
  'fetch POST + X-TT:1 (preflight te olmeli)': (u) => fetch(u.tam, { method: 'POST', headers: { 'X-TT': '1' } }).then((x) => 'CEVAP ' + x.status, (e) => 'red:' + e.message),
  'fetch POST + X-TT:1 + JSON (preflight)': (u) => fetch(u.yol, { method: 'POST', headers: { 'X-TT': '1', 'content-type': 'application/json' }, body: JSON.stringify(u.alanlar) }).then((x) => 'CEVAP ' + x.status, (e) => 'red:' + e.message),
};

async function main() {
  klasor = L.sahnele(L.kaynak(hedef), 'sec-' + hedefAd);
  console.log(`# guvenlik sondasi — hedef: ${L.kaynak(hedef)}  (sahnelenen kopya: ${klasor})` + (EK.length ? '  ek arg: ' + EK.join(' ') : ''));
  await kopruAc();
  const saldirgan = await L.statikSunucu(L.KOK, PA, {
    isle(req, res, u) { if (u === '/a.html') { res.writeHead(200, { 'content-type': 'text/html' }); res.end('<!doctype html><title>evil</title><body>saldirgan sayfa'); return true; } return false; },
  });
  const tr = await L.tarayici(['--host-resolver-rules=MAP evil.example 127.0.0.1, MAP rebind.evil.example 127.0.0.1, MAP localtest.me 127.0.0.1, MAP *.localtest.me 127.0.0.1']);
  const ctx = await tr.newContext();

  // ---------------------------------------------------------------- 1) dinleme adresi
  console.log('\n## 1. Dinleme adresi');
  const disIp = Object.values(os.networkInterfaces()).flat().find((i) => i && !i.internal && i.family === 'IPv4');
  if (disIp) {
    const acik = await new Promise((r) => { const s = net.connect({ host: disIp.address, port: P }); s.on('connect', () => { s.destroy(); r(true); }); s.on('error', () => r(false)); setTimeout(() => { s.destroy(); r(false); }, 1500); });
    let c = null;
    if (acik) c = await L.ham({ host: disIp.address, port: P, yol: '/api/status', basliklar: { host: disIp.address + ':' + P } });
    kayit('bind', `LAN arayuzu ${disIp.address}:${P} uzerinden erisim`, EK.includes('--lan') ? 'BILGI' : 'ENGEL', acik && c.kod === 200, acik ? `TCP acik, /api/status -> ${c.kod}` : 'baglanti reddedildi');
  } else console.log('  (loopback disi arayuz yok, atlandi)');

  // ---------------------------------------------------------------- 2) Host basligi
  console.log('\n## 2. Host basligi (ham HTTP; DNS-rebinding in sunucu tarafi)');
  const hostAdlari = [];
  try { for (const s of require('fs').readFileSync('/etc/hosts', 'utf8').split('\n')) { const m = s.replace(/#.*/, '').trim().split(/\s+/); if (/^(127\.|::1)/.test(m[0] || '')) hostAdlari.push(...m.slice(1)); } } catch { /* */ }
  const hostsDosyasi = [...new Set(hostAdlari)].filter((h) => h !== 'localhost');
  const HOSTLAR = [
    ['localhost:' + P, 'IZIN'], ['127.0.0.1:' + P, 'IZIN'], ['[::1]:' + P, 'IZIN'], ['LOCALHOST:' + P, 'IZIN'],
    ['localhost', 'IZIN'], ['localtest.me:' + P, 'IZIN'], ['localtest.me', 'IZIN'], ['oyun.localtest.me:' + P, 'IZIN'], ['a.b.localtest.me', 'IZIN'],
    ...hostsDosyasi.map((h) => [h + ':' + P, 'IZIN']),
    ...EK.filter((a, i) => EK[i - 1] === '--host').map((h) => [h + ':' + P, 'IZIN']),
    ['evil.example:' + P, 'ENGEL'], ['evil.example', 'ENGEL'], ['rebind.evil.example:' + P, 'ENGEL'],
    ['localtest.me.evil.example:' + P, 'ENGEL'], ['evillocaltest.me:' + P, 'ENGEL'], ['localhost.evil.example:' + P, 'ENGEL'],
    ['127.0.0.1.evil.example:' + P, 'ENGEL'], ['yayin.local:' + P, EK.includes('yayin.local') ? 'IZIN' : 'ENGEL'],
    ['192.0.2.2:' + P, EK.includes('--lan') ? 'BILGI' : 'ENGEL'], ['', 'ENGEL'],
  ];
  for (const [h, bek] of HOSTLAR) {
    const bas = h === '' ? {} : { host: h };
    const sayfa = await L.ham({ port: P, yol: '/overlays/oyun.html', basliklar: bas });
    const st = await L.ham({ port: P, yol: '/api/status', basliklar: bas });
    const w = await L.wsAc({ port: P, hostBasligi: h === '' ? null : h, origin: h ? 'http://' + h : undefined, zaman: 1500 });
    if (w.acildi) w.kapat();
    // mesru durum degistirme: ayni Host + ayni Origin + X-TT
    const ad = 'h' + (++sayac);
    const p = await L.ham({ port: P, yontem: 'POST', yol: '/api/oyun?ad=' + ad, basliklar: Object.assign({ 'x-tt': '1', 'content-length': '0' }, bas, h ? { origin: 'http://' + h } : {}) });
    await L.bekle(60);
    const etkili = (await istat()).aktifOyun === ad;
    const gecti = sayfa.kod === 200 && st.kod === 200 && w.acildi && etkili;
    const hic = sayfa.kod !== 200 && st.kod !== 200 && !w.acildi && !etkili;
    const kanit = `sayfa ${sayfa.kod}, status ${st.kod}, ws ${w.acildi ? 101 : (w.kod || w.hata || 'x')}, POST oyun ${p.kod}${etkili ? '+etki' : ''}`;
    if (bek === 'IZIN') kayit('host', `Host: ${h || '(yok)'}  [sayfa+status+ws+POST hepsi calismali]`, 'IZIN', gecti, kanit);
    else if (bek === 'ENGEL') kayit('host', `Host: ${h || '(yok)'}  [hicbiri calismamali]`, 'ENGEL', !hic, kanit);
    else kayit('host', `Host: ${h}`, 'BILGI', gecti, kanit);
  }
  await mesru('/api/oyun?ad=bilye');

  // ---------------------------------------------------------------- 3) mesru sozlesme
  console.log('\n## 3. Mesru cagri sozlesmesi (bozulmamali) ve eski GET');
  {
    const ad = 'm' + (++sayac);
    const c = await L.ham({ port: P, yontem: 'POST', yol: '/api/oyun?ad=' + ad, basliklar: { host: 'localhost:' + P, origin: MESRU, 'x-tt': '1', 'content-length': '0' } });
    kayit('sozlesme', 'POST /api/oyun + X-TT:1 + Origin=ayni', 'IZIN', (await istat()).aktifOyun === ad, 'HTTP ' + c.kod);
    const ad2 = 'm' + (++sayac);
    const c2 = await L.ham({ port: P, yontem: 'POST', yol: '/api/oyun?ad=' + ad2, basliklar: { host: 'localhost:' + P, origin: MESRU, 'content-length': '0' } });
    kayit('sozlesme', 'POST /api/oyun, X-TT YOK (Origin ayni)', 'ENGEL', (await istat()).aktifOyun === ad2, 'HTTP ' + c2.kod);
    const ad3 = 'm' + (++sayac);
    const c3 = await L.ham({ port: P, yontem: 'POST', yol: '/api/oyun?ad=' + ad3, basliklar: { host: 'localhost:' + P, origin: 'http://evil.example:' + PA, 'x-tt': '1', 'content-length': '0' } });
    kayit('sozlesme', 'POST /api/oyun + X-TT:1 + Origin=evil.example', 'ENGEL', (await istat()).aktifOyun === ad3, 'HTTP ' + c3.kod);
    const ad3b = 'm' + (++sayac);
    const c3b = await L.ham({ port: P, yontem: 'POST', yol: '/api/oyun?ad=' + ad3b, basliklar: { host: 'localhost:' + P, origin: 'null', 'x-tt': '1', 'content-length': '0' } });
    kayit('sozlesme', 'POST /api/oyun + X-TT:1 + Origin=null (sandbox iframe/file://)', 'ENGEL', (await istat()).aktifOyun === ad3b, 'HTTP ' + c3b.kod);
    const ad3c = 'm' + (++sayac);
    const c3c = await L.ham({ port: P, yontem: 'POST', yol: '/api/oyun?ad=' + ad3c, basliklar: { host: 'localhost:' + P, origin: `http://localhost.evil.example:${P}`, 'x-tt': '1', 'content-length': '0' } });
    kayit('sozlesme', 'POST /api/oyun + X-TT:1 + Origin=localhost.evil.example', 'ENGEL', (await istat()).aktifOyun === ad3c, 'HTTP ' + c3c.kod);
    const ad4 = 'm' + (++sayac);
    const c4 = await L.ham({ port: P, yol: '/api/oyun?ad=' + ad4, basliklar: { host: 'localhost:' + P } });
    kayit('sozlesme', 'GET /api/oyun (eski sozlesme; durum degistiren GET)', 'ENGEL', (await istat()).aktifOyun === ad4, 'HTTP ' + c4.kod);
    const ad5 = 'm' + (++sayac);
    const c5 = await L.ham({ port: P, yontem: 'POST', yol: '/api/oyun?ad=' + ad5, basliklar: { host: 'localhost:' + P, 'x-tt': '1', 'content-length': '0' } });
    kayit('sozlesme', 'POST /api/oyun + X-TT:1, Origin YOK (curl/betik; tarayici degil)', 'BILGI', (await istat()).aktifOyun === ad5, 'HTTP ' + c5.kod);
    for (const y of ['/api/status', '/api/istatistik', '/overlays/oyun.html', '/overlays/_shared/tt.js']) {
      const c6 = await L.ham({ port: P, yol: y, basliklar: { host: 'localhost:' + P, origin: 'http://evil.example:' + PA } });
      const acao = c6.basliklar['access-control-allow-origin'];
      kayit('cors', `CORS basligi: GET ${y}`, y.startsWith('/api/') ? 'ENGEL' : 'BILGI', !!acao, acao ? 'access-control-allow-origin: ' + acao : 'yok');
    }
    const pre = await L.ham({ port: P, yontem: 'OPTIONS', yol: '/api/soyle?text=x', basliklar: { host: 'localhost:' + P, origin: 'http://evil.example:' + PA, 'access-control-request-method': 'POST', 'access-control-request-headers': 'x-tt' } });
    const izin = !!(pre.basliklar['access-control-allow-origin'] && /x-tt|\*/i.test(pre.basliklar['access-control-allow-headers'] || ''));
    kayit('cors', 'OPTIONS preflight (evil origin, X-TT) onaylaniyor mu', 'ENGEL', izin, `HTTP ${pre.kod}, ACAO=${pre.basliklar['access-control-allow-origin'] || '-'}, ACAH=${pre.basliklar['access-control-allow-headers'] || '-'}`);
    await mesru('/api/oyun?ad=bilye');
  }

  // ---------------------------------------------------------------- 4) baska origin'den tarayici saldirilari
  console.log(`\n## 4. Baska origin (http://evil.example:${PA}) -> ${MESRU}  — gercek Chromium`);
  const sayfa = await ctx.newPage();
  await sayfa.goto(`http://evil.example:${PA}/a.html`);
  const uclar = HIZLI ? ['fire', 'oyun', 'kapat'] : ['fire', 'oyun', 'baglan', 'soyle', 'kapat'];
  for (const uc of uclar) {
    const U = UCLAR[uc];
    for (const [vad, vfn] of Object.entries(VEKTORLER)) {
      await hayatta();
      const y = U.yuk();
      const sorgu = new URLSearchParams(y).toString();
      const u = { yol: `${MESRU}/api/${uc}`, tam: `${MESRU}/api/${uc}${sorgu ? '?' + sorgu : ''}`, sorgu, alanlar: y };
      await U.once();
      let cevap;
      try { cevap = await sayfa.evaluate(`(${vfn.toString()})(${JSON.stringify(u)})`); } catch (e) { cevap = 'hata:' + e.message.split('\n')[0]; }
      const [oldu, kanit] = await U.etki(y);
      kayit('csrf', `/api/${uc} <- ${vad}`, 'ENGEL', oldu, kanit || ('tarayici: ' + cevap));
    }
  }
  // okuma: baska origin veri okuyabiliyor mu
  await hayatta();
  for (const y of ['/api/status', '/api/istatistik']) {
    const r = await sayfa.evaluate((url) => fetch(url).then((x) => x.text()).then((t) => 'OKUNDU ' + t.slice(0, 60), (e) => 'red'), MESRU + y);
    kayit('okuma', `baska origin fetch ile ${y} OKUYOR mu`, 'ENGEL', r.startsWith('OKUNDU'), r);
  }
  {
    const r = await sayfa.evaluate((url) => new Promise((coz) => {
      let n = 0, ilk = '';
      let ws; try { ws = new WebSocket(url); } catch (e) { return coz('kurulamadi'); }
      ws.onmessage = (e) => { n++; if (!ilk) ilk = String(e.data).slice(0, 70); };
      ws.onerror = () => {};
      setTimeout(() => { try { ws.close(); } catch { /* */ } coz(n ? `OKUNDU ${n} mesaj, ilk: ${ilk}` : 'mesaj yok'); }, 2500);
    }), `ws://localhost:${P}/ws`);
    kayit('okuma', 'baska origin WebSocket ile canli olaylari (izleyici adlari, sohbet) dinliyor mu', 'ENGEL', r.startsWith('OKUNDU'), r);
  }
  await sayfa.close();

  // ---------------------------------------------------------------- 5) DNS rebinding (ayni-origin gibi gorunen saldirgan alan adi)
  console.log(`\n## 5. DNS rebinding: sayfa http://rebind.evil.example:${P}/ (saldirganin alan adi artik 127.0.0.1'i gosteriyor)`);
  {
    const s2 = await ctx.newPage();
    // 1. DNS cevabi: saldirganin sunucusu (sayfayi biz veriyoruz). 2. cevap: 127.0.0.1 (host-resolver-rules).
    await s2.route(`http://rebind.evil.example:${P}/attack.html`, (r) => r.fulfill({ status: 200, contentType: 'text/html', body: '<!doctype html><body>rebind' }));
    await s2.goto(`http://rebind.evil.example:${P}/attack.html`);
    for (const uc of (HIZLI ? ['oyun', 'kapat'] : ['fire', 'oyun', 'baglan', 'soyle', 'kapat'])) {
      const U = UCLAR[uc];
      for (const [vad, yontem, bas] of [['ayni-origin fetch GET', 'GET', {}], ['ayni-origin fetch POST + X-TT:1', 'POST', { 'X-TT': '1' }]]) {
        await hayatta();
        const y = U.yuk();
        const sorgu = new URLSearchParams(y).toString();
        await U.once();
        const cevap = await s2.evaluate(([url, m, h]) => fetch(url, { method: m, headers: h }).then((x) => 'HTTP ' + x.status, (e) => 'red'), [`/api/${uc}${sorgu ? '?' + sorgu : ''}`, yontem, bas]);
        const [oldu, kanit] = await U.etki(y);
        kayit('rebind', `/api/${uc} <- ${vad}`, 'ENGEL', oldu, kanit || cevap);
      }
    }
    await hayatta();
    const r = await s2.evaluate(() => fetch('/api/istatistik').then((x) => x.ok ? x.text().then((t) => 'OKUNDU ' + t.slice(0, 50)) : 'HTTP ' + x.status, () => 'red'));
    kayit('rebind', '/api/istatistik OKUMA (izleyici kimlikleri)', 'ENGEL', r.startsWith('OKUNDU'), r);
    const w = await s2.evaluate((url) => new Promise((coz) => {
      let n = 0; let ws; try { ws = new WebSocket(url); } catch { return coz('kurulamadi'); }
      ws.onmessage = () => { n++; }; ws.onerror = () => {};
      setTimeout(() => { try { ws.close(); } catch { /* */ } coz(n ? `OKUNDU ${n} mesaj` : 'mesaj yok'); }, 2500);
    }), `ws://rebind.evil.example:${P}/ws`);
    kayit('rebind', 'WebSocket ile canli olaylari dinleme', 'ENGEL', w.startsWith('OKUNDU'), w);
    await s2.close();
  }

  // ---------------------------------------------------------------- 6) mesru arayuz hala calisiyor mu (gercek sayfalar)
  console.log('\n## 6. Mesru kullanim: gercek panel ve oyun merkezi (calismaya DEVAM etmeli)');
  for (const taban of [`http://localhost:${P}`, `http://127.0.0.1:${P}`, `http://localtest.me:${P}`, `http://oyun.localtest.me:${P}`]) {
    await hayatta();
    const s3 = await ctx.newPage();
    const kotu = []; const hatalar = [];
    s3.on('response', (r) => { if (/\/api\/|\/ws/.test(r.url()) && r.status() >= 400) kotu.push(r.status() + ' ' + r.request().method() + ' ' + new URL(r.url()).pathname); });
    s3.on('pageerror', (e) => hatalar.push(String(e).slice(0, 100)));
    s3.on('console', (m) => { if (m.type() === 'error') hatalar.push(m.text().slice(0, 100)); });
    let panel = 0;
    try { panel = (await s3.goto(taban + '/', { waitUntil: 'load', timeout: 8000 })).status(); } catch (e) { hatalar.push('goto: ' + e.message.split('\n')[0]); }
    // panel: test olayi dugmesi
    gozcu.mesajlar.length = 0;
    let dugme = false;
    try { await s3.click('[data-fire="subscribe"]', { timeout: 2500 }); dugme = !!(await gozcu.bekle((x) => x.type === 'subscribe', 1500)); } catch { /* dugme yok */ }
    kayit('mesru', `${taban}/  panel aciliyor + "Abone" test dugmesi olay gonderiyor`, 'IZIN', panel === 200 && dugme, `panel ${panel}, dugme ${dugme ? 'calisti' : 'CALISMADI'}${kotu.length ? ', hatali istek: ' + kotu.slice(0, 3).join('; ') : ''}`);
    // panel: sahte veri dugmesi (baglan?user=)
    let mock = false;
    try { await s3.click('#mockBtn', { timeout: 2000 }); await L.bekle(500); mock = (await durum()).mode === 'mock'; } catch { /* */ }
    kayit('mesru', `${taban}/  "Sahte veri" dugmesi (baglan) calisiyor`, 'IZIN', mock, kotu.length ? 'hatali istek: ' + kotu.slice(0, 3).join('; ') : '');
    await gozcuAc();
    // oyun merkezi: /api/oyun bildirimi + overlay WS olay aliyor
    await mesru('/api/oyun?ad=sifir');
    kotu.length = 0;
    let wsOlay = 0;
    try {
      await s3.goto(taban + '/overlays/oyun.html?lite=1&oyunlar=at,bilgi&sn=600', { waitUntil: 'load', timeout: 8000 });
      await L.bekle(2500);
      const cerceve = s3.frames().find((f) => /at\.html/.test(f.url()));
      if (cerceve) wsOlay = await cerceve.evaluate(() => new Promise((r) => { let n = 0; window.TT.on('*', () => n++); setTimeout(() => r(window.TT.status === 'connected' || window.TT.status === 'open' ? Math.max(n, 1) : n), 4000); }));
    } catch (e) { hatalar.push('oyun: ' + e.message.split('\n')[0]); }
    const ao = (await istat()).aktifOyun;
    kayit('mesru', `${taban}/overlays/oyun.html  merkez /api/oyun bildiriyor + oyun canli olay aliyor`, 'IZIN', ao === 'at' && wsOlay > 0, `aktifOyun=${ao}, oyun cercevesine gelen olay=${wsOlay}${kotu.length ? ', hatali istek: ' + kotu.slice(0, 3).join('; ') : ''}${hatalar.length ? ', hata: ' + hatalar.slice(0, 2).join(' | ') : ''}`);
    await s3.close();
  }
  // TT.soyle: oyunun kazanan duyurusu (mock OLMAYAN sayfa) ekrana dusuyor mu
  {
    await hayatta(); await gozcuAc();
    const s4 = await ctx.newPage();
    await s4.goto(`http://localhost:${P}/overlays/at.html?lite=1`, { waitUntil: 'load' });
    gozcu.mesajlar.length = 0;
    await s4.evaluate(() => window.TT.soyle('MESRU-SOYLE-1'));
    const m = await gozcu.bekle((x) => x.type === 'bot' && /MESRU-SOYLE-1/.test(x.text), 6500);
    kayit('mesru', 'oyun sayfasindan TT.soyle() (kazanan duyurusu) hala calisiyor', 'IZIN', !!m, '');
    await s4.close();
  }

  // ---------------------------------------------------------------- ozet
  const guard = B.guard();
  await tr.close(); saldirgan.close(); gozcu.kapat(); await B.oldur();
  const bulgu = satirlar.filter((s) => s.bulgu);
  console.log(`\n# OZET (${hedefAd}): ${satirlar.length} deneme, ${bulgu.length} BULGU` + (guard.length ? `, kopru ${guard.length} kez loopback disina cikmayi denedi (engellendi): ${guard.slice(0, 3).join(' | ')}` : ''));
  const grup = {};
  for (const b of bulgu) (grup[b.grup] = grup[b.grup] || []).push(b);
  for (const [g, l] of Object.entries(grup)) {
    console.log(`  ${g}: ${l.length}`);
    for (const b of l.slice(0, 60)) console.log(`     - ${b.ad}  => ${b.beklenen === 'ENGEL' ? 'ENGELLENMEDI' : 'CALISMIYOR'}${b.kanit ? ' (' + b.kanit + ')' : ''}`);
  }
  L.yaz(`sec-${hedefAd}.json`, satirlar);
  process.exit(bulgu.length ? 1 : 0);
}

main().catch(async (e) => { console.error('SONDA HATASI:', e); try { await B.oldur(); } catch { /* */ } process.exit(2); });
