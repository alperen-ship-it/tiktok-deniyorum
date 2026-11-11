'use strict';
// kare-son.js — sessiz makinede son kare olcumu: deneme 150, halay 150, tencere 48; tam ve dusuk. PORT (9065).
const L = require('./lib'); const S = require('./sayfa'); const PORT = Number(process.env.PORT) || 9065;
const U = (id) => ({ id, uniqueId: id, nickname: 'Kisi' + id, avatar: '' });
(async () => {
  const sun = await L.statikSunucu(L.kaynak('repo'), PORT); const tr = await L.tarayici(['--enable-unsafe-swiftshader']);
  const isler = [['sahne3d-deneme.html', 'kisi=150', 0], ['halay.html', 'lite=1&src=bridge', 150], ['tencere.html', 'lite=1&src=bridge&bot=0', 60]];
  for (const [sayfa, q, n] of isler) for (const kal of ['tam', 'dusuk']) {
    const ctx = await tr.newContext({ viewport: { width: 1080, height: 1920 } }); const p = await ctx.newPage(); const hata = []; p.on('pageerror', (e) => hata.push(String(e).slice(0, 100)));
    await p.addInitScript(() => { window.__raf = []; let son = 0; const d = (t) => { if (son) window.__raf.push(t - son); son = t; if (window.__raf.length > 600) window.__raf.shift(); requestAnimationFrame(d); }; requestAnimationFrame(d); });
    await p.goto(`http://127.0.0.1:${PORT}/overlays/${sayfa}?${q}&kalite=${kal}&kilit=1`, { waitUntil: 'load' });
    await p.waitForFunction(() => window.__sahne3d, null, { timeout: 10000 });
    for (let i = 0; i < n; i++) { await p.evaluate(S.ATES, { type: 'chat', user: U('k' + i), comment: 'selam', ts: Date.now() }); if (i % 15 === 14) await L.bekle(80); }
    await L.bekle(3000); await p.evaluate(() => { window.__raf.length = 0; });
    const t0 = Date.now(); let i = 0; while (Date.now() - t0 < 9000) { if (n) await p.evaluate(S.ATES, { type: 'chat', user: U('k' + (i++ % n)), comment: 'hey', ts: Date.now() }); await L.bekle(200); }
    const r = await p.evaluate(() => { const m = window.__sahne3d.olcum(); const a = window.__raf.slice().sort((x, y) => x - y); return { m, raf: +(a.reduce((x, y) => x + y, 0) / a.length).toFixed(1), rafP95: +a[Math.floor(a.length * 0.95)].toFixed(1) }; });
    const yuk = require('os').loadavg()[0].toFixed(2);
    console.log(`${sayfa.padEnd(22)} ${kal.padEnd(6)} figur ${r.m.figur} cizilen ${r.m.cizilen} cagri ${r.m.cizimCagrisi} ucgen ${r.m.ucgen} js ${r.m.jsMs} kareMs ${r.m.kareMs} (p95 ${r.m.kareMsP95}) rAF ${r.raf} (p95 ${r.rafP95}) kalite=${r.m.kalite} yuk ${yuk} hata ${hata.length}`);
    await ctx.close();
  }
  await tr.close(); process.exit(0);
})();
