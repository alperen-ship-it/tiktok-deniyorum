'use strict';
// oyun-ek.js <sayfa.html> [--yatay] — her oyun icin: (1) hediye geri bildirimi (taraf/cevap/misketi OLMAYAN izleyici; seri hediye),
// (2) bahis/sans sozcugu taramasi (35 sn mock), (3) tur suresi: Ses.muzik -> Finis.kart. PORT ortam degiskeni (varsayilan 9062).
const L = require('./lib'); const S = require('./sayfa');
(async () => {
  const sayfa = process.argv[2]; const YATAY = process.argv.includes('--yatay'); const kokAd = process.argv.includes('--onceki') ? L.KOK + '/stage/onceki' : L.kaynak('repo');
  const PORT = Number(process.env.PORT) || 9062; const sun = await L.statikSunucu(kokAd, PORT); const tr = await L.tarayici();
  const ctx = await tr.newContext({ viewport: YATAY ? { width: 1920, height: 1080 } : { width: 1080, height: 1920 } });
  await ctx.addInitScript(S.KANCA);
  await ctx.addInitScript(() => { window.__m = []; const iv = setInterval(() => { if (!window.Ses || window.Ses.__m) return; const a = window.Ses.muzik, d = window.Ses.muzikDur; window.Ses.muzik = function (x) { window.__m.push(['muzik', performance.now(), x]); return a.apply(this, arguments); }; window.Ses.muzikDur = function () { window.__m.push(['dur', performance.now()]); return d.apply(this, arguments); }; window.Ses.__m = 1; clearInterval(iv); }, 5); });
  const p = await ctx.newPage(); const hata = []; p.on('pageerror', (e) => hata.push(String(e).slice(0, 140)));
  await p.goto(`http://127.0.0.1:${PORT}/overlays/${sayfa}?lite=1&mock=1&rate=3${YATAY ? '&yatay=1' : ''}${process.argv.includes('--kisa') ? '&katil=8' : ''}`, { waitUntil: 'load' });
  await L.bekle(6000);
  const gor = (ad, ms) => p.evaluate(([ad, ms]) => new Promise((c) => { const t0 = performance.now(); let px = 0; const b = () => { const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT); for (let n = w.nextNode(); n; n = w.nextNode()) if (n.nodeValue.includes(ad)) { const e = n.parentElement, r = e.getBoundingClientRect(); if (r.width > 2 && getComputedStyle(e).visibility !== 'hidden') px = Math.max(px, parseFloat(getComputedStyle(e).fontSize)); } if (px || performance.now() - t0 > ms) c(px); else setTimeout(b, 60); }; b(); }), [ad, ms]);
  const U = (id, ad) => ({ id, uniqueId: id, nickname: ad, avatar: '' });
  const g1 = gor('YabanciHediyeci', 4000); await p.evaluate((u) => window.TT.fire({ type: 'gift', user: u, gift: { id: 1, name: 'Gül', diamonds: 30, value: 30, count: 1, streaking: false, emoji: '🌹', image: '' }, ts: Date.now() }), U('yab', 'YabanciHediyeci'));
  const px1 = await g1; await L.bekle(2500);
  const u0 = await p.evaluate(() => ({ u: window.__D.ulti.length, s: window.__D.spiker.length }));
  await p.evaluate((u) => { for (let i = 1; i <= 10; i++) window.TT.fire({ type: 'gift', user: u, gift: { id: 1, name: 'Gül', diamonds: 1, value: i, count: i, streaking: true, emoji: '🌹', image: '' }, ts: Date.now() }); window.TT.fire({ type: 'gift', user: u, gift: { id: 1, name: 'Gül', diamonds: 1, value: 11, count: 11, streaking: false, emoji: '🌹', image: '' }, ts: Date.now() }); }, U('seri', 'SeriHediyeci'));
  await L.bekle(1200); const u1 = await p.evaluate(() => ({ u: window.__D.ulti.length, ad: [...new Set(window.__D.ulti.map((x) => x.ad))].slice(0, 6), kim: window.__D.ulti.slice(-1).map((x) => x.kim) }));
  // tur suresi
  const sureler = []; const t0 = Date.now();
  while (Date.now() - t0 < 75000) { const r = await p.evaluate(() => ({ m: window.__m, k: window.__D.kart.map((x) => x.t) })); if (r.k.length >= 2 || (r.k.length >= 1 && Date.now() - t0 > 55000)) { for (const kt of r.k) { const bas = r.m.filter((x) => x[0] === 'muzik' && x[1] < kt).pop(); if (bas) sureler.push(((kt - bas[1]) / 1000).toFixed(1)); } break; } await L.bekle(1000); }
  const D = await p.evaluate(() => ({ m: [...window.__D.metinler], sp: window.__D.spiker.map((s) => s.metin), so: window.__D.soyle.map((s) => s.metin), uy: window.__D.uyanis, ka: window.__D.kart, post: window.__D.postalar.filter((x) => x.tt === 'tur-bitti').length }));
  const sozde = await p.evaluate(S.SOZDE);
  const hepsi = [...D.m, ...D.sp, ...D.so, ...D.ka.map((k) => k.isim + ' ' + k.alt), ...D.uy.flatMap((u) => Object.values(u).map(String)), ...sozde.map((s) => s.metin)];
  const RE = [/bahis/, /(^|[^a-z])bahs[ie]/, /(^|[^a-z])oran/, /odeme/, /kumar/, /(^|[^a-z])sans(?!ur)/, /kupon/, /ikramiye/, /jackpot/, /cekilis/, /piyango/, /yatir/, /kazandir/];
  const vur = [...new Set(hepsi.filter((t) => RE.some((r) => r.test(L.trSade(t)))))];
  const hediyeSoz = [...new Set(hepsi.filter((t) => /hediye/i.test(t)))].slice(0, 8);
  console.log(`# ${sayfa}${YATAY ? ' (yatay)' : ''}: yabanci hediye adi ekranda ${px1 ? px1 + 'px' : 'GORUNMEDI'} ; seri hediye bant +${u1.u - u0.u} ; ULTI etiketleri ${JSON.stringify(u1.ad)} ; tur suresi (muzik→kart) sn: ${sureler.join(', ') || '-'} ; kart ${D.ka.length} ; tur-bitti ${D.post} ; spiker ${D.sp.length} satir ; hata ${hata[0] || 'yok'}`);
  console.log('  yasak sozcuk: ' + (vur.length ? JSON.stringify(vur.slice(0, 6)) : 'yok') + '\n  hediye gecen metinler: ' + JSON.stringify(hediyeSoz) + '\n  kart: ' + JSON.stringify(D.ka.slice(0, 2)) + '\n  uyanis: ' + JSON.stringify(D.uy[0] || null).slice(0, 300));
  if (/bilye/.test(sayfa)) console.log('  spiker (etap/anons): ' + JSON.stringify(D.sp.filter((s) => /etap|ETAP|tünel|TÜNEL|düzlük|DÜZLÜK|\d\./i.test(s)).slice(0, 14)));
  await tr.close(); sun.close();
})().catch((e) => { console.error('HATA', e); process.exit(2); });
