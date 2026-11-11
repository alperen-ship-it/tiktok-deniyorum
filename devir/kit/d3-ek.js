'use strict';
// d3-ek.js — cekirdek ek kontrolleri: sahteKare ile dusuk→yok, 'kalite' olayi, baglam kaybi, API'de serbest metin yolu, ocakbasi temasi. Port 9065.
const L = require('./lib'); const path = require('path');
(async () => {
  const sun = await L.statikSunucu(L.kaynak('repo'), 9065); const tr = await L.tarayici(['--enable-unsafe-swiftshader']);
  const ac = async (q) => { const ctx = await tr.newContext({ viewport: { width: 1080, height: 1920 } }); const p = await ctx.newPage(); const hata = []; p.on('pageerror', (e) => hata.push(String(e).slice(0, 140))); p.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) hata.push(m.text().slice(0, 140)); }); await p.goto('http://127.0.0.1:9065/overlays/sahne3d-deneme.html?lite=1&mock=1&' + q, { waitUntil: 'load' }); await p.waitForFunction(() => window.__sahne3d, null, { timeout: 15000 }); return { ctx, p, hata }; };
  { // sahteKare yuruyusu
    const { ctx, p, hata } = await ac('kisi=60&kalite=tam');
    await p.evaluate(() => { window.__olay = []; const s = window.__sahne3d; const kap = document.querySelector('[data-sahne3d]') || document.body; for (const hedef of [window, document, kap, s]) { try { hedef.addEventListener && hedef.addEventListener('kalite', (e) => window.__olay.push([Math.round(performance.now()), (e.detail && (e.detail.kalite || e.detail.yeni)) || '?'])); } catch (e) { /* */ } } if (s.on) try { s.on('kalite', (k) => window.__olay.push([Math.round(performance.now()), typeof k === 'string' ? k : (k && (k.kalite || k.yeni)) || '?'])); } catch (e) { /* */ } s.deneme.sahteKare(140); });
    const iz = []; const t0 = Date.now();
    while (Date.now() - t0 < 50000) { const q = await p.evaluate(() => window.__sahne3d.kalite); if (!iz.length || iz[iz.length - 1][1] !== q) iz.push([((Date.now() - t0) / 1000).toFixed(0), q]); if (q === 'yok') break; await L.bekle(500); }
    const r = await p.evaluate(() => ({ olay: window.__olay, cv: [...document.querySelectorAll('canvas')].map((c) => getComputedStyle(c).display), sinif: (document.querySelector('.sahne3d-yok') || {}).id || !!document.querySelector('.sahne3d-yok'), veri: (document.querySelector('[data-sahne3d]') || { dataset: {} }).dataset.sahne3d }));
    console.log('sahteKare(140): ' + iz.map((x) => `+${x[0]}s ${x[1]}`).join(' → ') + ' | olaylar: ' + JSON.stringify(r.olay) + ' | tuvaller: ' + r.cv.join(',') + ' | sinif sahne3d-yok: ' + r.sinif + ' | data: ' + r.veri + ' | hata: ' + (hata[0] || 'yok'));
    // yok'tan sonra hizli kareler: geri CIKMAMALI
    await p.evaluate(() => window.__sahne3d.deneme.sahteKare(null)); await L.bekle(13000);
    console.log('  hizli karelere donunce 13 sn sonra kalite: ' + await p.evaluate(() => window.__sahne3d.kalite));
    await p.screenshot({ path: path.join(L.CIKTI, 'd3-yok.png') }); await ctx.close();
  }
  { // baglam kaybi
    const { ctx, p, hata } = await ac('kisi=50&kalite=dusuk&kilit=1'); await L.bekle(2500);
    await p.evaluate(() => window.__sahne3d.deneme.baglamKaybet()); await L.bekle(1200);
    const a = await p.evaluate(() => window.__sahne3d.kalite); await p.evaluate(() => window.__sahne3d.deneme.baglamGeriGetir()); await L.bekle(2500);
    const b = await p.evaluate(() => ({ k: window.__sahne3d.kalite, o: window.__sahne3d.olcum() }));
    await p.evaluate(() => window.__sahne3d.deneme.baglamKaybet()); await L.bekle(6000);
    const c = await p.evaluate(() => window.__sahne3d.kalite);
    console.log(`baglam kaybi: kayipken=${a} ; geri gelince=${b.k} (cagri ${b.o.cizimCagrisi}, kayip sayaci ${b.o.kayip}) ; ikinci kayip + 6 sn=${c} ; hata: ${hata[0] || 'yok'}`);
    await ctx.close();
  }
  { // API yuzeyi + ocakbasi
    const { ctx, p, hata } = await ac('kisi=40&tema=ocakbasi&kalite=dusuk&kilit=1'); await L.bekle(4000);
    const api = await p.evaluate(() => { const s = window.__sahne3d; const d = (o) => Object.keys(o || {}).filter((k) => typeof o[k] === 'function'); return { s: Object.keys(s), figur: d(s.figur), etiket: d(s.etiket), halka: d(s.halka), saat: d(s.saat) }; });
    console.log('API: ' + JSON.stringify(api));
    await p.screenshot({ path: path.join(L.CIKTI, 'd3-ocakbasi.png') }); await L.telefon(tr, path.join(L.CIKTI, 'd3-ocakbasi.png'), path.join(L.CIKTI, 'd3-ocakbasi-telefon.png'));
    console.log('ocakbasi hata: ' + (hata[0] || 'yok'));
    await ctx.close();
  }
  await tr.close(); sun.close();
})().catch((e) => { console.error('HATA', e); process.exit(2); });
