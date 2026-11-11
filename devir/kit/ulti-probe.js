'use strict';
// ulti-probe.js [repo|yol] [sayfa] [ad] — uzun adla hediye at, hediye bandindaki adin kutusunu zaman
// icinde ornekle (giris animasyonundaki gecici tasma ile durgun hali ayirir).
// Aga cikmaz: yalnizca yerel statik sunucu. Kit kutuphanesini kullanir.
const L = require('./lib'); const S = require('./sayfa');
const PORT = Number(process.env.PORT) || 9123;
const agac = L.kaynak(process.argv[2] || 'repo'); const sayfa = process.argv[3] || 'tencere.html';
const AD = process.argv[4] || 'İstanbulluGüzelÇiçekŞöğüt2026';
const U = (id, ad) => ({ id, uniqueId: id, nickname: ad || id, avatar: '' });
const chat = (id, y, ad) => ({ type: 'chat', user: U(id, ad), comment: y, ts: Date.now() });
const gift = (id, e, ad) => ({ type: 'gift', user: U(id, ad), gift: { id: 1, name: 'Gül', diamonds: e, value: e, count: 1, streaking: false, emoji: '🌹', image: '' }, ts: Date.now() });
(async () => {
  const sun = await L.statikSunucu(agac, PORT); const tr = await L.tarayici(['--enable-unsafe-swiftshader']);
  const ctx = await tr.newContext({ viewport: { width: 1080, height: 1920 } });
  await ctx.addInitScript(S.KANCA);
  const p = await ctx.newPage();
  await p.goto(`http://127.0.0.1:${PORT}/overlays/${sayfa}?lite=1&src=bridge&bot=0&kalite=dusuk&kilit=1`, { waitUntil: 'load' });
  await p.waitForFunction(() => window.TT && window.TT.fire, null, { timeout: 10000 });
  await L.bekle(800);
  for (let i = 0; i < 4; i++) await p.evaluate(S.ATES, chat('c' + i, 'selam', 'Kisi' + i));
  await p.evaluate(() => {
    window.__O = []; const t0 = performance.now();
    const iv = setInterval(() => {
      const b = document.getElementById('ulti-bant'); if (!b) return;
      const k = b.querySelector('.u-kim'); const cs = getComputedStyle(b);
      if (cs.display === 'none') return;
      const tn = k.firstChild; let r = null;
      if (tn) { const ra = document.createRange(); ra.selectNodeContents(tn); const rs = [...ra.getClientRects()]; if (rs.length) r = { l: Math.min(...rs.map((x) => x.left)), r: Math.max(...rs.map((x) => x.right)), n: rs.length }; }
      const kb = k.getBoundingClientRect();
      window.__O.push({ t: Math.round(performance.now() - t0), tf: cs.transform, sinif: b.className, px: getComputedStyle(k).fontSize, sar: k.classList.contains('sar'), sw: k.scrollWidth, cw: k.clientWidth,
        metin: r && [Math.round(r.l * 10) / 10, Math.round(r.r * 10) / 10, r.n], kutu: [Math.round(kb.left * 10) / 10, Math.round(kb.right * 10) / 10] });
      if (window.__O.length > 400) clearInterval(iv);
    }, 25);
  });
  await p.evaluate(S.ATES, gift('h1', 30, AD));
  await L.bekle(3200);
  const O = await p.evaluate(() => window.__O);
  const ozet = (o) => `+${o.t}ms tf=${o.tf.replace(/matrix\(([^,]+),.*/, 'sx=$1')} px=${o.px} sar=${o.sar} sw/cw=${o.sw}/${o.cw} metin=${JSON.stringify(o.metin)} kutu=${JSON.stringify(o.kutu)} [${o.sinif}]`;
  console.log('ornek sayisi: ' + O.length);
  const sec = O.filter((o, i) => i < 14 || i % 12 === 0 || i === O.length - 1);
  for (const o of sec) console.log('  ' + ozet(o));
  const durgun = O.filter((o) => /sx=1$|^none$/.test(o.tf.replace(/matrix\(([^,]+),.*/, 'sx=$1')));
  const enSol = Math.min(...O.filter((o) => o.metin).map((o) => o.metin[0])), enSag = Math.max(...O.filter((o) => o.metin).map((o) => o.metin[1]));
  console.log(`en sol ${enSol}, en sag ${enSag} (yasak: <60, >1020)`);
  if (durgun.length) { const d = durgun[Math.floor(durgun.length / 2)]; console.log('durgun hal: ' + ozet(d)); }
  await ctx.close(); await tr.close(); sun.close && sun.close();
  process.exit(0);
})().catch((e) => { console.error('HATA', e); process.exit(1); });
