'use strict';
/**
 * regress.js <head|repo|yol> [--sn 25] [oyun ...]
 *
 * Regresyon: bilye, bilgi, pk, at, halay — her biri ?lite=1&mock=1 ile
 * 1920x1080'de --sn saniye. Bakilanlar:
 *   - console.error / pageerror / yakalanmamis promise
 *   - gorunen metinde NaN / undefined / null / [object / Infinity
 *   - #kok tasmasi (ic tasma, ekran disina cikma, #kok disina tasan eleman)
 *   - 404 veren kaynak
 *   - (bilgi) 26px alti metin sayisi, kesilen metin sayisi
 * Ayrica oyun.html merkezi varsayilan dizilimle acilir (ilk oyun + hata).
 * Port 9068.
 */
const fs = require('fs');
const path = require('path');
const L = require('./lib');
const S = require('./sayfa');

const PORT = Number(process.env.PORT) || 9068;
const argv = process.argv.slice(2);
const snI = argv.indexOf('--sn');
const SN = snI >= 0 ? Number(argv[snI + 1]) : 25;
const konum = argv.filter((a, i) => !a.startsWith('--') && argv[i - 1] !== '--sn');
const DIKEY = argv.includes('--dikey'), YATAY = argv.includes('--yatay');   // --dikey: 1080x1920 ; --yatay: 1920x1080 + ?yatay=1
const BAK = DIKEY ? { width: 1080, height: 1920 } : { width: 1920, height: 1080 };
const EKQ = YATAY ? '&yatay=1' : '';
const hedef = konum[0] || 'repo';
const hedefAd = path.basename(hedef);
const OYUNLAR = konum.slice(1).length ? konum.slice(1) : (YATAY ? ['at'] : ['at', 'halay', 'tencere']);

(async () => {
  const kok = L.kaynak(hedef);
  console.log(`# regresyon — hedef: ${kok}  (${SN} sn/oyun, lite+mock, 1920x1080)`);
  const sunucu = await L.statikSunucu(kok, PORT);
  const tr = await L.tarayici(['--enable-unsafe-swiftshader']);
  let kaldi = 0;

  async function kos(ad, url) {
    const ctx = await tr.newContext({ viewport: BAK });
    await ctx.addInitScript(S.KANCA);
    const p = await ctx.newPage();
    const hata = [], yok = [];
    p.on('pageerror', (e) => hata.push('pageerror: ' + String(e.stack || e).split('\n').slice(0, 2).join(' @ ').slice(0, 220)));
    p.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) hata.push('console.error: ' + m.text().slice(0, 200)); });
    p.on('response', (r) => { if (r.status() >= 400 && !/\/api\//.test(r.url())) yok.push(r.status() + ' ' + new URL(r.url()).pathname); });
    p.on('requestfailed', (r) => { if (!/^data:/.test(r.url())) yok.push('FAILED ' + new URL(r.url()).pathname); });
    const ornek = [];
    await p.goto(url, { waitUntil: 'load' });
    const hedefCerceve = () => p.frames().find((f) => f !== p.mainFrame() && /overlays\/\w+\.html/.test(f.url())) || p.mainFrame();
    const adimlar = [Math.round(SN / 3), Math.round((2 * SN) / 3), SN];
    let gecen = 0;
    for (const a of adimlar) {
      await L.bekle((a - gecen) * 1000); gecen = a;
      try { ornek.push(Object.assign({ t: a }, await hedefCerceve().evaluate(S.TASMA))); } catch (e) { hata.push('olcum: ' + e.message.split('\n')[0]); }
    }
    let pu = { kotu: [], toplam: 0 }, ke = [], ic = [];
    try { pu = await hedefCerceve().evaluate(S.PUNTO, DIKEY ? 30 : 26); ke = await hedefCerceve().evaluate(S.KESIK); ic = await hedefCerceve().evaluate(() => window.__D ? window.__D.hatalar : []); } catch (e) { /* */ }
    await p.screenshot({ path: path.join(L.CIKTI, `regres-${hedefAd}-${ad}.png`) });
    await ctx.close();
    const bozuk = [...new Set(ornek.flatMap((o) => o.bozukMetin || []))];
    const tasan = new Map(); for (const o of ornek) for (const t of (o.tasanlar || [])) tasan.set(t.sec, t);
    const icTasma = ornek.some((o) => o.kokIcTasma), disari = ornek.some((o) => o.kokEkranDisi), kokYok = ornek.some((o) => !o.kokVar);
    const tumHata = [...new Set([...hata, ...ic])];
    const sorun = [];
    if (tumHata.length) sorun.push(`${tumHata.length} hata: ` + tumHata.slice(0, 3).join(' | '));
    if (yok.length) sorun.push('eksik kaynak: ' + [...new Set(yok)].slice(0, 4).join(', '));
    if (bozuk.length) sorun.push('bozuk metin: ' + bozuk.slice(0, 4).map((b) => JSON.stringify(b)).join(', '));
    if (kokYok) sorun.push('#kok yok');
    if (icTasma) sorun.push('#kok ICERIGI tasiyor ' + JSON.stringify((ornek.find((o) => o.kokIcTasma) || {}).kok));
    if (disari) sorun.push('#kok ekran disina cikiyor ' + JSON.stringify((ornek.find((o) => o.kokEkranDisi) || {}).kok));
    if (tasan.size) sorun.push(`#kok disina tasan ${tasan.size} eleman: ` + [...tasan.values()].slice(0, 4).map((t) => `${t.sec} +${t.tas}px "${t.metin}"`).join(' ; '));
    const bilgi = `(bilgi: <26px ${pu.kotu.length}/${pu.toplam} metin, kesilen ${ke.length})`;
    if (sorun.length) { kaldi++; console.log(`  [KALDI] ${ad.padEnd(8)} ${sorun.join('  ||  ')}  ${bilgi}`); }
    else console.log(`  [GECTI] ${ad.padEnd(8)} hata yok, NaN/undefined yok, #kok tasmiyor  ${bilgi}`);
    if (pu.kotu.length) console.log('           <26px ornek: ' + pu.kotu.slice(0, 5).map((k) => `${k.px}px "${k.metin}" ${k.sec}`).join(' ; '));
    return { ad, tumHata, yok, bozuk, tasan: [...tasan.values()], pu: pu.kotu, ke };
  }

  const isler = [];
  for (const o of OYUNLAR) {
    if (!fs.existsSync(path.join(kok, 'overlays', o + '.html'))) { console.log(`  [ATLA ] ${o.padEnd(8)} dosya yok (${hedefAd})`); continue; }
    isler.push(() => kos(o, `http://127.0.0.1:${PORT}/overlays/${o}.html?lite=1&mock=1&rate=2${EKQ}`));
  }
  isler.push(() => kos('merkez', `http://127.0.0.1:${PORT}/overlays/oyun.html?lite=1&mock=1${EKQ}`));
  const sonuc = []; for (const is of isler) sonuc.push(await is());
  await tr.close(); sunucu.close();
  L.yaz(`regres-${hedefAd}.json`, sonuc);
  console.log(`\n# OZET (${hedefAd}): ${sonuc.length - kaldi} gecti, ${kaldi} kaldi. Goruntuler: ${L.CIKTI}/regres-${hedefAd}-*.png`);
  process.exit(kaldi ? 1 : 0);
})().catch((e) => { console.error('HATA', e); process.exit(2); });
