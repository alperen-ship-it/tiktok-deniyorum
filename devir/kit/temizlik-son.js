const L = require('./lib'); const fs = require('fs'); const path = require('path');
(async () => { const b = await L.statikSunucu(L.REPO, 9064); const tr = await L.tarayici(['--enable-unsafe-swiftshader']);
  // 1) merkez: uc oyun, tur sinirlarinda
  { const ctx = await tr.newContext({ viewport: { width: 1080, height: 1920 } }); const p = await ctx.newPage(); const hata = []; p.on('pageerror', (e) => hata.push(String(e).slice(0, 140))); const yok = []; p.on('response', (r) => { if (r.status() === 404 && !/\/api\//.test(r.url())) yok.push(r.url().slice(-60)); });
    await p.addInitScript(() => { if (window.top !== window) return; window.__g = []; window.addEventListener('message', (e) => { if (e.data && e.data.tt) window.__g.push([Math.round(performance.now() / 100) / 10, 'msg:' + e.data.tt]); }); });
    await p.goto('http://127.0.0.1:9064/overlays/oyun.html?lite=1&mock=1&rate=3&hiz=6&sure=12&kutlama=3&tahmin=5&kosu=5'); const t0 = Date.now(); let son = ''; const gec = [];
    while (Date.now() - t0 < 100000) { const s = await p.evaluate(() => { const f = document.querySelector('iframe'); return f ? (f.getAttribute('src') || '').split('?')[0].split('/').pop() : ''; }); if (s !== son) { gec.push(((Date.now() - t0) / 1000).toFixed(1) + 's ' + s); son = s; } if (gec.length >= 5) break; await L.bekle(300); }
    const g = await p.evaluate(() => window.__g); console.log('merkez gecisler:', gec.join(' | ')); console.log('  tur-bitti iletileri:', JSON.stringify(g.slice(0, 8)), 'hata', hata.length, hata[0] || '', '404', yok.slice(0, 4)); await ctx.close(); }
  // 2) panel: olu baglanti
  { const ctx = await tr.newContext({ viewport: { width: 1366, height: 900 } }); const p = await ctx.newPage(); const hata = []; p.on('pageerror', (e) => hata.push(String(e).slice(0, 140))); const yok = []; p.on('response', (r) => { if (r.status() >= 400 && !/\/api\//.test(r.url())) yok.push(r.status() + ' ' + r.url().slice(-50)); });
    await p.goto('http://127.0.0.1:9064/overlays/index.html'); await L.bekle(5000);
    const adr = await p.evaluate(() => { const s = new Set(); const al = (t) => { for (const m of String(t || '').matchAll(/overlays\/([\w-]+\.html)/g)) s.add(m[1]); }; al(document.documentElement.innerHTML); return [...s]; });
    const olu = adr.filter((a) => !fs.existsSync(path.join(L.REPO, 'overlays', a))); console.log('panel: anilan sayfalar', adr.join(','), '| OLU:', olu.join(',') || 'yok', '| 4xx:', yok.slice(0, 5), 'hata', hata.length); await ctx.close(); }
  // 3) dort widget: varsayilan / ?v=1 / dikey pencere
  for (const s of ['alerts', 'like-goal', 'gift-rain', 'durum']) { const sat = [];
    for (const [ad, w, h, q] of [['1920x1080', 1920, 1080, ''], ['1080x1920 v=1', 1080, 1920, '&v=1'], ['1080x1920', 1080, 1920, '']]) { const ctx = await tr.newContext({ viewport: { width: w, height: h } }); const p = await ctx.newPage(); const hata = []; p.on('pageerror', (e) => hata.push(String(e).slice(0, 100))); p.on('console', (m) => { if (m.type() === 'error' && !/WebSocket|Failed to load|ERR_/.test(m.text())) hata.push('c:' + m.text().slice(0, 80)); });
      await p.goto(`http://127.0.0.1:9064/overlays/${s}.html?mock=1&rate=4${q}`); await L.bekle(4500);
      const r = await p.evaluate(() => ({ cls: document.documentElement.className, tas: document.documentElement.scrollWidth > innerWidth + 2 || document.documentElement.scrollHeight > innerHeight + 2, metin: document.body.innerText.replace(/\s+/g, ' ').length, kotu: /undefined|NaN|\[object/.test(document.body.innerText) }));
      sat.push(`${ad}: sinif="${r.cls}" metin ${r.metin} tasma ${r.tas} bozuk ${r.kotu} hata ${hata.length}${hata[0] ? ' ' + hata[0] : ''}`); if (ad === '1920x1080') await p.screenshot({ path: `out/widget-${s}.png` }); await ctx.close(); }
    console.log(s.padEnd(10), sat.join('\n           ')); }
  await tr.close(); process.exit(0); })();
