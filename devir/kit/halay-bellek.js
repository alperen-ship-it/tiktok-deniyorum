'use strict';
// halay-bellek.js [sarkiSayisi=8] — KANCASIZ (olcum araci sayfaya hicbir sey eklemez) uzun bellek olcumu. Port 9067.
const L = require('./lib');
(async () => {
  const N = Number(process.argv[2]) || 8;
  const sun = await L.statikSunucu(L.kaynak('repo'), 9067);
  const tr = await L.tarayici(['--enable-precise-memory-info']);
  const ctx = await tr.newContext({ viewport: { width: 1920, height: 1080 } });
  const p = await ctx.newPage(); const hata = []; p.on('pageerror', (e) => hata.push(String(e).slice(0, 160)));
  await p.goto('http://127.0.0.1:9067/overlays/halay.html?lite=1&src=bridge&sure=22&kutlama=4&kabul=4&duet=3&solo=2', { waitUntil: 'load' });
  await p.waitForFunction(() => window.Halay);
  const cdp = await ctx.newCDPSession(p); await cdp.send('Performance.enable');
  const olc = async () => { await cdp.send('HeapProfiler.collectGarbage'); await L.bekle(150); await cdp.send('HeapProfiler.collectGarbage'); const m = Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map((x) => [x.name, x.value])); return { heap: +(m.JSHeapUsedSize / 1048576).toFixed(2), dugum: m.Nodes, din: m.JSEventListeners }; };
  // pompa SAYFANIN ICINDE degil, disaridan; sayfaya eklenen tek sey olaylar
  let dur = false;
  const pompa = (async () => { let i = 0; while (!dur) { try { await p.evaluate((i) => { const k = 'b' + (i % 300); const u = { id: k, uniqueId: k, nickname: 'Bellek' + (i % 300), avatar: '' }; const r = i % 8; const f = window.TT.fire; if (r === 0) f({ type: 'like', user: u, likes: 9, ts: Date.now() }); else if (r === 1) f({ type: 'gift', user: u, gift: { value: [1, 150, 2000][i % 3], count: 1, streaking: false }, ts: Date.now() }); else if (r === 2) f({ type: 'follow', user: u, ts: Date.now() }); else if (r === 3) f({ type: 'chat', user: u, comment: '@Bellek' + ((i * 7) % 300), ts: Date.now() }); else if (r === 4) f({ type: 'chat', user: u, comment: String(1 + (i % 60)), ts: Date.now() }); else f({ type: 'chat', user: u, comment: 'hey hop ' + i, ts: Date.now() }); }, i); } catch { break; } i++; await L.bekle(30); } return i; })();
  const dizi = [];
  for (let s = 2; s <= N + 1; s++) { await p.waitForFunction((n) => window.Halay.ozet().sarkiNo >= n, s, { timeout: 90000 }).catch(() => {}); await L.bekle(1200); dizi.push(await olc()); }
  dur = true; const olay = await pompa;
  const ls = await p.evaluate(() => Object.keys(localStorage).map((k) => k + ':' + localStorage.getItem(k).length).join(','));
  console.log(`halay, ${N} sarki, ${olay} olay, 300 izleyici (kancasiz): heap MB ${dizi.map((d) => d.heap).join(' → ')} | DOM ${dizi.map((d) => d.dugum).join(' → ')} | dinleyici ${dizi.map((d) => d.din).join(' → ')} | ${ls} | hata: ${hata.length ? hata[0] : 'yok'}`);
  await tr.close(); sun.close();
})();
