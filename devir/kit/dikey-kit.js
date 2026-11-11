'use strict';
/**
 * dikey-kit.js <head|repo|yol> [sayfa.html ...] [--yatay] [--sn 14] [--sorgu "a=1&b=2"]
 *
 * PLAN-DIKEY bolum E: dikey (1080x1920) kabul testleri. Tek tarayici, sayfalar SIRAYLA. Port 9066.
 *   - console/page hatasi, NaN/undefined, #kok tasmasi
 *   - GUVENLI BOLGE: DOM metni ve tuval metni (fillText) yasak bolgelere giremez
 *       y<240 ; x<60 / x>1020 ; (x<540 ve y>1250) ; y>1760
 *   - PUNTO TABANI 30px (DOM + tuval)
 *   - KESILME: 3/12/20/28 karakterlik adlar ekranda TAM gorunmeli (DOM innerText ya da tuval metni)
 *   - telefon goruntusu: out/dikey-<ad>-<sayfa>.png ve -telefon.png (390 px)
 *   - disari giden istek yok (ayni origin / data: disinda)
 * --yatay : ?yatay=1 ile 1920x1080 duman testi (hata + #kok tasmasi; yerlesim cilasi aranmaz)
 * Varsayilan sayfalar: bilye bilgi pk at halay tencere (olanlar) + oyun.html merkezi.
 */
const fs = require('fs');
const path = require('path');
const L = require('./lib');
const S = require('./sayfa');

const PORT = Number(process.env.PORT) || 9066;
const argv = process.argv.slice(2);
const al = (b, v) => { const i = argv.indexOf(b); return i >= 0 ? argv[i + 1] : v; };
const YATAY = argv.includes('--yatay');
const SN = Number(al('--sn', 14));
const EKSORGU = al('--sorgu', '');
const konum = argv.filter((a, i) => !a.startsWith('--') && !['--sn', '--sorgu'].includes(argv[i - 1]));
const hedef = konum[0] || 'repo';
const hedefAd = path.basename(hedef);
let sayfalar = konum.slice(1);
const ADLAR = ['Ali', 'mehmet_yilmz', 'cok_uzun_kullanici_ad', 'İstanbulluGüzelÇiçekŞöğüt2026'];
const PUNTO_TABAN = 30;

(async () => {
  const kok = L.kaynak(hedef);
  if (!sayfalar.length) sayfalar = ['at', 'halay', 'tencere'].map((x) => x + '.html').filter((x) => fs.existsSync(path.join(kok, 'overlays', x))).concat(['oyun.html']);
  console.log(`# dikey kit — hedef: ${kok}  mod: ${YATAY ? 'YATAY duman (?yatay=1, 1920x1080)' : 'DIKEY 1080x1920'}  sayfalar: ${sayfalar.join(', ')}`);
  const sunucu = await L.statikSunucu(kok, PORT);
  const tr = await L.tarayici(['--enable-unsafe-swiftshader']);
  let kaldi = 0; const ozet = [];

  for (const sayfa of sayfalar) {
    const bak = YATAY ? { width: 1920, height: 1080 } : { width: 1080, height: 1920 };
    const ctx = await tr.newContext({ viewport: bak });
    await ctx.addInitScript(S.KANCA); await ctx.addInitScript(S.TUVAL_KANCA);
    const p = await ctx.newPage();
    const hata = [], dis = [], yok = [];
    p.on('pageerror', (e) => hata.push('pageerror: ' + String(e.stack || e).split('\n').slice(0, 2).join(' @ ').slice(0, 200)));
    p.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource|WebSocket/.test(m.text())) hata.push('console: ' + m.text().slice(0, 180)); });
    p.on('request', (r) => { const u = r.url(); if (!/^(data:|blob:|about:)/.test(u) && !u.startsWith(`http://127.0.0.1:${PORT}/`)) dis.push(u.slice(0, 90)); });
    p.on('response', (r) => { if (r.status() >= 400 && !/\/api\//.test(r.url())) yok.push(r.status() + ' ' + new URL(r.url()).pathname); });
    const merkez = sayfa === 'oyun.html';
    const sorgu = 'lite=1&mock=1&rate=2' + (YATAY ? '&yatay=1' : '') + (EKSORGU ? '&' + EKSORGU : '');
    await p.goto(`http://127.0.0.1:${PORT}/overlays/${sayfa}?${sorgu}`, { waitUntil: 'load' });
    const cerceve = () => (merkez ? (p.frames().find((f) => f !== p.mainFrame() && /overlays\/\w+\.html/.test(f.url())) || p.mainFrame()) : p.mainFrame());
    await L.bekle(2500);
    // uzun adlar: sohbet + begeni + hediye (oyun ne yapiyorsa onunla listeye/karta girsinler)
    if (!merkez) {
      for (let i = 0; i < ADLAR.length; i++) {
        const u = { id: 'uz' + i, uniqueId: 'uz' + i, nickname: ADLAR[i], avatar: '' };
        try {
          await cerceve().evaluate(([u, i]) => { const f = window.TT.fire; f({ type: 'chat', user: u, comment: String(1 + i), ts: Date.now() }); f({ type: 'chat', user: u, comment: ['A', 'B', 'C', 'D'][i], ts: Date.now() }); f({ type: 'chat', user: u, comment: String(1 + (i % 2)), ts: Date.now() }); f({ type: 'like', user: u, likes: 12, ts: Date.now() }); }, [u, i]);
        } catch (e) { hata.push('enjeksiyon: ' + e.message.split('\n')[0]); }
        await L.bekle(350);
      }
      try { await cerceve().evaluate((u) => window.TT.fire({ type: 'gift', user: u, gift: { id: 1, name: 'Gül', diamonds: 30, value: 30, count: 1, streaking: false, emoji: '🌹', image: '' }, ts: Date.now() }), { id: 'uz3', uniqueId: 'uz3', nickname: ADLAR[3], avatar: '' }); } catch (e) { /* */ }
    }
    // ornekle
    const bulgu = { guvenliDom: new Map(), guvenliTuval: new Map(), punto: new Map(), tuvalPunto: new Map(), bozuk: new Set(), tasma: null };
    const adGorulen = new Set();
    const adim = Math.max(3, Math.round(SN / 4));
    for (let t = 0; t < SN; t += adim) {
      await L.bekle(adim * 1000);
      const f = cerceve();
      try {
        const ta = await f.evaluate(S.TASMA);
        for (const b of ta.bozukMetin) bulgu.bozuk.add(b);
        if (!ta.kokVar) bulgu.tasma = '#kok yok'; else if (ta.kokIcTasma || ta.kokEkranDisi) bulgu.tasma = JSON.stringify(ta.kok);
        if (!YATAY) {
          const g = await f.evaluate(S.GUVENLI);
          for (const x of g.dom) bulgu.guvenliDom.set(x.sec + x.neden, x);
          for (const x of g.tuval) bulgu.guvenliTuval.set(x.metin + x.neden, x);
          const pu = await f.evaluate(S.PUNTO, PUNTO_TABAN);
          for (const x of pu.kotu) bulgu.punto.set(x.sec + x.px, x);
          const tp = await f.evaluate(S.TUVAL_PUNTO, PUNTO_TABAN);
          for (const x of tp.kotu) bulgu.tuvalPunto.set(x.metin, x);
          const gor = await f.evaluate((adlar) => { const m = document.body.innerText + '\n' + [...(window.__T2 ? window.__T2.hepsi : [])].join('\n') + '\n' + [...window.__D.metinler].join('\n') + '\n' + (window.__T2 ? window.__T2.kayit.slice(-6000).map((k) => k.metin).join('') : '') + '\n' + document.body.innerText.replace(/\n/g, ''); return adlar.filter((a) => m.includes(a));   /* cok satirli tuval etiketi / sarilmis DOM adi da TAM sayilir */ }, ADLAR);
          gor.forEach((a) => adGorulen.add(a));
        }
      } catch (e) { hata.push('olcum: ' + e.message.split('\n')[0]); }
    }
    const ad = sayfa.replace('.html', '');
    const png = path.join(L.CIKTI, `dikey-${hedefAd}-${ad}${YATAY ? '-yatay' : ''}.png`);
    await p.screenshot({ path: png });
    if (!YATAY) await L.telefon(tr, png, png.replace('.png', '-telefon.png'));
    let ic = []; try { ic = await cerceve().evaluate(() => window.__D.hatalar); } catch { /* */ }
    await ctx.close();

    const sorun = [];
    const tumHata = [...new Set([...hata, ...ic])];
    if (tumHata.length) sorun.push(`hata(${tumHata.length}): ` + tumHata.slice(0, 2).join(' | '));
    if (yok.length) sorun.push('eksik kaynak: ' + [...new Set(yok)].slice(0, 3).join(', '));
    if (dis.length) sorun.push('DISARI ISTEK: ' + [...new Set(dis)].slice(0, 3).join(', '));
    if (bulgu.bozuk.size) sorun.push('bozuk metin: ' + [...bulgu.bozuk].slice(0, 3).join(' ; '));
    if (bulgu.tasma) sorun.push('#kok: ' + bulgu.tasma);
    if (!YATAY) {
      if (bulgu.guvenliDom.size) sorun.push(`guvenli bolge DOM(${bulgu.guvenliDom.size}): ` + [...bulgu.guvenliDom.values()].slice(0, 4).map((x) => `"${x.metin}" ${x.sec} [${x.kutu}] ${x.neden}`).join(' ; '));
      if (bulgu.guvenliTuval.size) sorun.push(`guvenli bolge TUVAL(${bulgu.guvenliTuval.size}): ` + [...bulgu.guvenliTuval.values()].slice(0, 4).map((x) => `"${x.metin}" [${x.kutu}] ${x.neden}`).join(' ; '));
      if (bulgu.punto.size) sorun.push(`<${PUNTO_TABAN}px DOM(${bulgu.punto.size}): ` + [...bulgu.punto.values()].slice(0, 5).map((x) => `${x.px}px "${x.metin}" ${x.sec}`).join(' ; '));
      if (bulgu.tuvalPunto.size) sorun.push(`<${PUNTO_TABAN}px TUVAL(${bulgu.tuvalPunto.size}): ` + [...bulgu.tuvalPunto.values()].slice(0, 5).map((x) => `${x.px}px "${x.metin}"`).join(' ; '));
      if (!merkez) { const eksik = ADLAR.filter((a) => !adGorulen.has(a)); if (eksik.length) sorun.push('TAM gorunmeyen ad: ' + eksik.map((a) => `${a} (${[...a].length} krk)`).join(', ')); }
    }
    if (sorun.length) { kaldi++; console.log(`  [KALDI] ${ad.padEnd(8)} ` + sorun.join('\n            || ')); }
    else console.log(`  [GECTI] ${ad.padEnd(8)} hata yok; ${YATAY ? '#kok tasmiyor' : 'guvenli bolge temiz, punto >= ' + PUNTO_TABAN + ', dort ad tam gorundu'}`);
    ozet.push({ sayfa, sorun });
  }
  await tr.close(); sunucu.close();
  L.yaz(`dikey-${hedefAd}${YATAY ? '-yatay' : ''}.json`, ozet);
  console.log(`\n# OZET: ${sayfalar.length - kaldi} gecti, ${kaldi} kaldi. Goruntuler: ${L.CIKTI}/dikey-${hedefAd}-*${YATAY ? '-yatay' : ''}.png`);
  process.exit(kaldi ? 1 : 0);
})().catch((e) => { console.error('KIT HATASI', e); process.exit(2); });
