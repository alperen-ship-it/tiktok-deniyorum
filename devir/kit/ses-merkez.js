'use strict';
// ses-merkez.js <head|repo> — merkezde oyun degisince ses: eski cercevenin AudioContext'i gidiyor mu, yenisi basliyor mu (gercek WebAudio).
const L = require('./lib'); const path = require('path');
(async () => {
  const hedef = process.argv[2] || 'repo';
  const sun = await L.statikSunucu(L.kaynak(hedef), 9068);
  const tr = await L.tarayici();
  const ctx = await tr.newContext({ viewport: { width: 1920, height: 1080 } });
  await ctx.addInitScript(() => {
    window.__A = { ctx: 0, osc: 0, son: 0, durum: () => (window.__A.c ? window.__A.c.state : 'yok') };
    const AC = window.AudioContext; if (!AC) return;
    window.AudioContext = class extends AC { constructor(...a) { super(...a); window.__A.ctx++; window.__A.c = this; } };
    const co = AC.prototype.createOscillator;
    AC.prototype.createOscillator = function () { const o = co.call(this); const st = o.start.bind(o); o.start = (t) => { window.__A.osc++; window.__A.son = Math.max(window.__A.son, t || this.currentTime); return st(t); }; return o; };
  });
  const p = await ctx.newPage(); const hata = [];
  p.on('pageerror', (e) => hata.push(String(e).slice(0, 120)));
  await p.goto('http://127.0.0.1:9068/overlays/oyun.html?lite=1&mock=1&ses=1&rate=3&oyunlar=at,pk,bilye,bilgi&sn=8&tahmin=4&bahis=4&sure=5&kutlama=3', { waitUntil: 'load' });
  const satir = []; let onceki = '';
  for (let i = 0; i < 70; i++) {
    await L.bekle(1000);
    const f = p.frames().filter((x) => x !== p.mainFrame());
    const cocuk = f.find((x) => /overlays\/\w+\.html/.test(x.url()));
    if (!cocuk) continue;
    const ad = (cocuk.url().match(/(\w+)\.html/) || [])[1];
    let a = null; try { a = await cocuk.evaluate(() => ({ ctx: window.__A.ctx, osc: window.__A.osc, durum: window.__A.durum(), an: window.__A.c ? window.__A.c.currentTime : 0, son: window.__A.son })); } catch { continue; }
    if (ad !== onceki) { satir.push(`+${i + 1}s GECIS -> ${ad} (cerceve sayisi ${f.length}; yeni cercevede ctx ${a.ctx}, osc ${a.osc})`); onceki = ad; }
    if (i % 6 === 5) satir.push(`+${i + 1}s ${ad}: ctx ${a.ctx} (${a.durum}), baslatilan osilator ${a.osc}, planlanan son nota ctx-zamanindan ${(a.son - a.an).toFixed(2)} sn ileride`);
  }
  console.log(`# ${path.basename(hedef)}\n  ` + satir.join('\n  ') + `\n  sayfa hatasi: ${hata.length ? hata.join(' | ') : 'yok'}`);
  await tr.close(); sun.close();
})();
