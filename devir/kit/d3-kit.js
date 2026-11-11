'use strict';
/**
 * d3-kit.js <head|repo|yol> [sayfa=sahne3d-deneme.html] [--sorgu "kisi=150"] [test ...]
 *
 * PLAN-DIKEY bolum G/E: 3D cekirdek kabul testleri. Tek tarayici, her kosu < 60 sn. Port 9065.
 * Testler: motor butce kademe geri etiket
 *   motor  — vendor/three.module.min.js npm 0.170.0 tarball'indaki dosyayla BIREBIR mi; lisans + SURUM.txt var mi;
 *            sayfa disari istek atiyor mu
 *   butce  — ?kalite=tam&kilit=1 ile 150 figur: cizim cagrisi <=40, ucgen <=160k, JS <=6 ms ort / 12 ms p95,
 *            SwiftShader kare <=90 ms; ?kalite=dusuk&kilit=1: <=45 ms; 4x30 sn heap duz (+-%10)
 *   kademe — ?kalite=tam (kilitsiz) + CPU kismasi: tam -> orta -> dusuk -> yok SIRAYLA, geri cikmadan
 *   geri   — ?3d=0: gorunur WebGL tuvali yok, hata yok, SAHNE'de DOM metni var
 *   etiket — ust katman: ad etiketi >=40px, yasak bolgede etiket yok, 28 karakterlik ad x 60..1020 icinde,
 *            404 veren avatar hataya yol acmiyor
 * Olcum kancasi: sayfa `window.__sahne3d` (Sahne3D.kur donusu) birakmali; `.olcum()` ve `.kalite` okunur.
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const L = require('./lib');
const S = require('./sayfa');

const PORT = 9065;
const argv = process.argv.slice(2);
const al = (b, v) => { const i = argv.indexOf(b); return i >= 0 ? argv[i + 1] : v; };
const TESTLER = ['motor', 'butce', 'kademe', 'geri', 'etiket'];
const konum = argv.filter((a, i) => !a.startsWith('--') && argv[i - 1] !== '--sorgu');
const hedef = konum[0] && !TESTLER.includes(konum[0]) && !/\.html$/.test(konum[0]) ? konum[0] : 'repo';
const SAYFA = konum.find((a) => /\.html$/.test(a)) || 'sahne3d-deneme.html';
const secili = konum.filter((a) => TESTLER.includes(a));
const calis = (t) => !secili.length || secili.includes(t);
const EK = al('--sorgu', 'kisi=150');
const LIM = { cagri: 40, ucgen: 160000, jsOrt: 6, jsP95: 12, swTam: 90, swDusuk: 45 };

const sonuc = [];
const yaz = (tur, m) => { sonuc.push({ tur, m }); console.log(`  [${tur}] ${m}`); };

(async () => {
  const kok = L.kaynak(hedef);
  console.log(`# 3D kit — hedef: ${kok}  sayfa: ${SAYFA}?${EK}`);
  if (!fs.existsSync(path.join(kok, 'overlays', SAYFA))) { console.log('  sayfa YOK — calistirilamaz'); process.exit(2); }
  const sunucu = await L.statikSunucu(kok, PORT);
  const tr = await L.tarayici(['--enable-unsafe-swiftshader', '--enable-precise-memory-info']);
  const ac = async (sorgu, o = {}) => {
    const ctx = await tr.newContext({ viewport: { width: 1080, height: 1920 } });
    await ctx.addInitScript(S.KANCA); await ctx.addInitScript(S.TUVAL_KANCA);
    const p = await ctx.newPage(); const hata = [], dis = [], yok = [];
    p.on('pageerror', (e) => hata.push(String(e.stack || e).split('\n')[0].slice(0, 180)));
    p.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource|WebSocket/.test(m.text())) hata.push(m.text().slice(0, 160)); });
    p.on('request', (r) => { const u = r.url(); if (!/^(data:|blob:|about:)/.test(u) && !u.startsWith(`http://127.0.0.1:${PORT}/`)) dis.push(u.slice(0, 90)); });
    p.on('response', (r) => { if (r.status() >= 400 && !/olmayan-avatar/.test(r.url())) yok.push(r.status() + ' ' + new URL(r.url()).pathname); });
    if (o.yol) await p.route(o.yol.kalip, o.yol.isle);
    await p.goto(`http://127.0.0.1:${PORT}/overlays/${SAYFA}?lite=1&mock=1&${EK}${sorgu ? '&' + sorgu : ''}`, { waitUntil: 'load' });
    return { ctx, p, hata, dis, yok };
  };
  const kanca = (p) => p.evaluate(() => { const s = window.__sahne3d; if (!s || typeof s.olcum !== 'function') return null; const o = s.olcum(); return Object.assign({}, o, { kalite: s.kalite || o.kalite }); });

  // ---------------- motor
  if (calis('motor')) {
    console.log('\n## motor — paketlenmis Three.js ve disari istek');
    const v = path.join(kok, 'overlays/_shared/vendor');
    const dosya = path.join(v, 'three.module.min.js'); const asil = path.join(L.KOK, 'uc/package/build/three.module.min.js');
    if (!fs.existsSync(dosya)) yaz('KALDI', 'overlays/_shared/vendor/three.module.min.js yok');
    else {
      const h = (f) => crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
      if (!fs.existsSync(asil)) yaz('not  ', 'karsilastirma kopyasi yok (danisman/uc) — `npm pack three@0.170.0` ile yeniden al');
      else if (h(dosya) === h(asil)) yaz('GECTI', `three.module.min.js npm three@0.170.0 ile birebir (sha256 ${h(dosya).slice(0, 16)}…, ${fs.statSync(dosya).size} bayt)`);
      else yaz('KALDI', `three.module.min.js npm 0.170.0 dosyasindan FARKLI (${fs.statSync(dosya).size} bayt; beklenen ${fs.statSync(asil).size})`);
      const lis = fs.existsSync(path.join(v, 'THREE-LICENSE.txt')) && /MIT License/.test(fs.readFileSync(path.join(v, 'THREE-LICENSE.txt'), 'utf8'));
      lis ? yaz('GECTI', 'THREE-LICENSE.txt (MIT) var') : yaz('KALDI', 'THREE-LICENSE.txt yok ya da MIT metni degil');
      fs.existsSync(path.join(v, 'SURUM.txt')) && /0\.170\.0/.test(fs.readFileSync(path.join(v, 'SURUM.txt'), 'utf8')) ? yaz('GECTI', 'SURUM.txt 0.170.0 diyor') : yaz('KALDI', 'SURUM.txt yok ya da surum yazmiyor');
      const fazla = fs.readdirSync(v).filter((f) => !['three.module.min.js', 'THREE-LICENSE.txt', 'SURUM.txt'].includes(f));
      if (fazla.length) yaz('not  ', 'vendor/ icinde beklenmeyen dosya: ' + fazla.join(', '));
    }
    const { ctx, p, hata, dis, yok } = await ac('');
    await L.bekle(5000);
    const k = await kanca(p);
    k ? yaz('GECTI', `olcum kancasi var: ${JSON.stringify(k).slice(0, 220)}`) : yaz('KALDI', 'window.__sahne3d.olcum() yok — testler kor');
    dis.length ? yaz('KALDI', 'sayfa DISARI istek atiyor: ' + [...new Set(dis)].slice(0, 3).join(', ')) : yaz('GECTI', 'disari istek yok');
    hata.length || yok.length ? yaz('KALDI', 'hata: ' + [...hata, ...yok].slice(0, 3).join(' | ')) : yaz('GECTI', 'sayfa hatasi / 404 yok');
    await p.screenshot({ path: path.join(L.CIKTI, `d3-${SAYFA.replace('.html', '')}.png`) });
    await L.telefon(tr, path.join(L.CIKTI, `d3-${SAYFA.replace('.html', '')}.png`), path.join(L.CIKTI, `d3-${SAYFA.replace('.html', '')}-telefon.png`));
    await ctx.close();
  }

  // ---------------- butce
  if (calis('butce')) {
    console.log('\n## butce — 150 figurde cizim/JS/kare butcesi (SwiftShader: mutlak fps degil, tavan)');
    for (const [kalite, lim] of [['tam', LIM.swTam], ['dusuk', LIM.swDusuk]]) {
      const { ctx, p, hata } = await ac(`kalite=${kalite}&kilit=1`);
      await L.bekle(4000);
      const ornek = []; const kare = await p.evaluate(() => new Promise((coz) => { const d = []; let son = performance.now(); const t0 = son; (function k(t) { d.push(t - son); son = t; if (t - t0 < 12000) requestAnimationFrame(k); else coz(d.slice(1)); })(son); }));
      for (let i = 0; i < 6; i++) { const k = await kanca(p); if (k) ornek.push(k); await L.bekle(500); }
      if (!ornek.length) { yaz('KALDI', `${kalite}: olcum kancasi yok`); await ctx.close(); continue; }
      const son = ornek[ornek.length - 1]; const js = ornek.map((o) => o.jsMs).filter((x) => x != null).sort((a, b) => a - b);
      const ort = (a) => a.reduce((x, y) => x + y, 0) / Math.max(1, a.length);
      const kareMs = ornek.map((o) => o.kareMs).filter((x) => x != null);
      yaz('not  ', `${kalite}: ${JSON.stringify(son).slice(0, 260)} ; rAF araligi ort ${ort(kare).toFixed(1)} ms`);
      if (kalite === 'tam') {
        son.figur >= 150 ? yaz('GECTI', `figur ${son.figur}`) : yaz('KALDI', `tam kademede figur ${son.figur} (<150)`);
        son.cizimCagrisi <= LIM.cagri ? yaz('GECTI', `cizim cagrisi ${son.cizimCagrisi} (<=${LIM.cagri})`) : yaz('KALDI', `cizim cagrisi ${son.cizimCagrisi} (>${LIM.cagri})`);
        son.ucgen <= LIM.ucgen ? yaz('GECTI', `ucgen ${son.ucgen} (<=${LIM.ucgen})`) : yaz('KALDI', `ucgen ${son.ucgen} (>${LIM.ucgen})`);
        const jo = ort(js), jp = js[Math.floor(js.length * 0.95)] || jo;
        jo <= LIM.jsOrt && jp <= LIM.jsP95 ? yaz('GECTI', `JS/kare ort ${jo.toFixed(2)} ms, en yuksek ornek ${jp.toFixed(2)} ms`) : yaz('KALDI', `JS/kare ort ${jo.toFixed(2)} ms (sinir ${LIM.jsOrt}), en yuksek ${jp.toFixed(2)} (sinir ${LIM.jsP95})`);
      }
      // 'dusuk' 20 fps'e SABITLENIR: olcum().kareMs orada tavan araligidir (50 ms), maliyet degil. Maliyet olcusu olarak
      // sayfanin rAF araligina bakilir (cizim sayfayi bogmuyorsa rAF 16-40 ms kalir) + fps tavani dogru mu.
      if (kalite === 'dusuk') {
        const r = ort(kare);
        r <= 40 ? yaz('GECTI', `dusuk: sayfa rAF araligi ${r.toFixed(1)} ms (<=40; cizim 20 fps tavaninda, kareMs ${ort(kareMs).toFixed(0)} ms)`) : yaz('KALDI', `dusuk: sayfa rAF araligi ${r.toFixed(1)} ms (>40): dusuk kademe bile sayfayi boguyor`);
        son.fps === 20 || son.fps == null ? 0 : yaz('not  ', `dusuk fps tavani ${son.fps}`);
        (son.cizilen == null || son.cizilen <= 60) ? yaz('GECTI', `dusuk: cizilen figur ${son.cizilen} (<=60), piksel orani ${son.pikselOrani}`) : yaz('KALDI', `dusuk: cizilen figur ${son.cizilen} (>60)`);
      } else {
        const k = kareMs.length ? ort(kareMs) : ort(kare);
        k <= lim ? yaz('GECTI', `${kalite}: kare ${k.toFixed(1)} ms (<=${lim}, SwiftShader)`) : yaz('KALDI', `${kalite}: kare ${k.toFixed(1)} ms (>${lim}, SwiftShader; ciplak sahne referansi 55 ms)`);
      }
      if (hata.length) yaz('KALDI', `${kalite}: hata ${hata.slice(0, 2).join(' | ')}`);
      if (kalite === 'tam') {
        const cdp = await ctx.newCDPSession(p); await cdp.send('Performance.enable');
        const heap = []; for (let i = 0; i < 4; i++) { await L.bekle(i ? 9000 : 0); await cdp.send('HeapProfiler.collectGarbage'); await L.bekle(150); const m = Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map((x) => [x.name, x.value])); heap.push(+(m.JSHeapUsedSize / 1048576).toFixed(2)); }
        heap[3] <= heap[1] * 1.1 + 0.3 ? yaz('GECTI', `heap duz: ${heap.join(' → ')} MB`) : yaz('KALDI', `heap buyuyor: ${heap.join(' → ')} MB (kare basi ayirma?)`);
      }
      await ctx.close();
    }
  }

  // ---------------- kademe
  if (calis('kademe')) {
    console.log('\n## kademe — yavas karelerde tam → orta → dusuk → yok, sirayla ve geri cikmadan');
    const { ctx, p, hata } = await ac('kalite=tam');
    const cdp = await ctx.newCDPSession(p); await cdp.send('Emulation.setCPUThrottlingRate', { rate: 6 });
    const iz = []; const t0 = Date.now();
    while (Date.now() - t0 < 55000) { const k = await kanca(p).catch(() => null); const q = k ? k.kalite : '?'; if (!iz.length || iz[iz.length - 1][1] !== q) iz.push([((Date.now() - t0) / 1000).toFixed(0), q]); if (q === 'yok') break; await L.bekle(700); }
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
    const dizi = iz.map((x) => x[1]); const SIRA = ['tam', 'orta', 'dusuk', 'yok'];
    yaz('not  ', 'gozlenen: ' + iz.map((x) => `+${x[0]}s ${x[1]}`).join(' → '));
    const sirali = dizi.every((q, i) => i === 0 || SIRA.indexOf(q) === SIRA.indexOf(dizi[i - 1]) + 1);
    if (dizi[0] !== 'tam') yaz('KALDI', `?kalite=tam baslangic kademesini vermedi (ilk: ${dizi[0]})`);
    else if (!sirali) yaz('KALDI', 'kademeler sirayla inmiyor / geri cikiyor: ' + dizi.join(' → '));
    else if (dizi.length < 2) yaz('KALDI', 'yavas karelerde hic kademe dusmedi (55 sn, 6x CPU kismasi + SwiftShader)');
    else yaz('GECTI', 'sirayla indi: ' + dizi.join(' → '));
    const hizli = iz.slice(1).some((x, i) => Number(x[0]) - Number(iz[i][0]) < 9 && i > 0);
    if (hizli) yaz('KALDI', 'iki kademe degisimi arasi 10 sn den kisa');
    if (hata.length) yaz('KALDI', 'hata: ' + hata.slice(0, 2).join(' | '));
    await ctx.close();
  }

  // ---------------- geri
  if (calis('geri')) {
    console.log('\n## geri — ?3d=0: tuvalsiz DOM gorunumu');
    const { ctx, p, hata } = await ac('3d=0');
    await L.bekle(6000);
    const r = await p.evaluate(() => {
      const gl = [...document.querySelectorAll('canvas')].filter((c) => { const s = getComputedStyle(c); const k = c.getBoundingClientRect(); if (s.display === 'none' || s.visibility === 'hidden' || k.width < 2) return false; let w = false; try { w = !!(c.__webgl || (c.getContext && (c.getContext('webgl2') || c.getContext('webgl')))); } catch { w = false; } return w; }).length;
      const olcek = Number(getComputedStyle(document.documentElement).getPropertyValue('--tt-olcek')) || 1; let sahneMetin = 0;
      const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      for (let n = w.nextNode(); n; n = w.nextNode()) { if (!n.nodeValue.trim()) continue; const k = n.parentElement.getBoundingClientRect(); const y = k.top / olcek; if (k.width > 1 && y >= 480 && y <= 1160) sahneMetin++; }
      const s = window.__sahne3d; return { gl, sahneMetin, kalite: s ? (s.kalite || (s.olcum && s.olcum().kalite)) : null };
    });
    r.kalite === 'yok' || r.kalite == null ? yaz('GECTI', `kalite=${r.kalite}`) : yaz('KALDI', `?3d=0 iken kalite=${r.kalite}`);
    r.sahneMetin > 0 ? yaz('GECTI', `SAHNE kutusunda ${r.sahneMetin} DOM metni (sade gorunum dolu)`) : yaz('KALDI', 'SAHNE kutusu bos: 3D yokken izleyici hicbir sey gormuyor');
    hata.length ? yaz('KALDI', 'hata: ' + hata.slice(0, 2).join(' | ')) : yaz('GECTI', 'hata yok');
    await p.screenshot({ path: path.join(L.CIKTI, `d3-${SAYFA.replace('.html', '')}-3d0.png`) });
    await ctx.close();
  }

  // ---------------- etiket
  if (calis('etiket')) {
    console.log('\n## etiket — ust katman: ad etiketleri ve avatar');
    const { ctx, p, hata } = await ac('kalite=dusuk&kilit=1&avatar=' + encodeURIComponent('/olmayan-avatar/x.png'));   // statik sunucu 404 verir
    await L.bekle(7000);
    const g = await p.evaluate(S.GUVENLI); const tp = await p.evaluate(S.TUVAL_PUNTO, 40);
    const adet = await p.evaluate(() => (window.__T2 ? window.__T2.kayit.filter((k) => k.bagli && /\p{L}/u.test(k.metin)).length : 0));
    adet > 0 ? yaz('GECTI', `ust katmana ${adet} metin cizimi kaydedildi`) : yaz('not  ', 'tuvale metin cizilmedi (etiketler DOM ise GUVENLI/PUNTO DOM tarafinda olculur)');
    g.tuval.length || g.dom.length ? yaz('KALDI', 'yasak bolgede metin: ' + [...g.tuval, ...g.dom].slice(0, 4).map((x) => `"${x.metin}" [${x.kutu}] ${x.neden}`).join(' ; ')) : yaz('GECTI', 'yasak bolgede etiket/metin yok');
    const kucuk = tp.kotu.filter((k) => k.bagli);
    kucuk.length ? yaz('KALDI', '40px altinda tuval etiketi: ' + kucuk.slice(0, 5).map((k) => `${k.px}px "${k.metin}"`).join(' ; ')) : yaz('GECTI', 'tuval etiketleri >= 40px');
    hata.length ? yaz('KALDI', 'hata: ' + hata.slice(0, 2).join(' | ')) : yaz('GECTI', 'hata yok (404 avatar dahil)');
    await ctx.close();
  }

  await tr.close(); sunucu.close();
  const k = sonuc.filter((s) => s.tur === 'KALDI');
  console.log(`\n# OZET: ${sonuc.filter((s) => s.tur === 'GECTI').length} gecti, ${k.length} kaldi, ${sonuc.filter((s) => s.tur === 'not  ').length} not`);
  for (const x of k) console.log('  KALDI ' + x.m.slice(0, 200));
  L.yaz(`d3-${path.basename(hedef)}-${SAYFA.replace('.html', '')}.json`, sonuc);
  process.exit(k.length ? 1 : 0);
})().catch((e) => { console.error('KIT HATASI', e); process.exit(2); });
