'use strict';
// ham-metin.js [sayfa=halay.html] — "yorum yalniz tetikleyicidir": izleyicinin serbest metni ekranda (DOM, tuval fillText/strokeText, Spiker, TT.soyle, Finis) HIC gorunmemeli. Port 9067.
const L = require('./lib'); const S = require('./sayfa');
(async () => {
  const sayfa = process.argv[2] || 'halay.html';
  const DIKEY = process.argv.includes('--dikey');
  const sun = await L.statikSunucu(L.kaynak('repo'), Number(process.env.PORT) || 9067);
  const tr = await L.tarayici(['--enable-unsafe-swiftshader']);
  const ctx = await tr.newContext({ viewport: DIKEY ? { width: 1080, height: 1920 } : { width: 1920, height: 1080 } });
  await ctx.addInitScript(S.KANCA);
  await ctx.addInitScript(() => { window.__tuval = []; for (const ad of ['fillText', 'strokeText']) { const a = CanvasRenderingContext2D.prototype[ad]; CanvasRenderingContext2D.prototype[ad] = function (t, ...r) { if (window.__tuval.length < 200000) window.__tuval.push(String(t)); return a.call(this, t, ...r); }; } });
  const p = await ctx.newPage(); const hata = []; p.on('pageerror', (e) => hata.push(String(e).slice(0, 140)));
  await p.goto(`http://127.0.0.1:${Number(process.env.PORT) || 9067}/overlays/${sayfa}?lite=1&src=bridge&sure=30&kutlama=4&kabul=4&duet=3&solo=2&tahmin=5&bahis=5`, { waitUntil: 'load' });
  await p.waitForFunction(() => window.TT);
  const SERBEST = ['zxqserbest1 selam millet', 'beni ara 0532 123 45 67', 'instada takip et zxqhesap', 'www.zxqsite.com gel', 'zxqkufur lan', 'bu yayin cok zxqguzel', 'hey zxqkarisik hop', '5 dk sonra zxqgelirim', 'ZXQBUYUK HARF', 'zxq_alt.cizgi-tire', 'kaldır 3 zxqek', '@Kisi2 zxqdavet gel', 'oyna zxqoyna', 'zxqemoji 🔥🔥', '🔥 zxqson', 'hey hey zxqhey', 'ole zxqole', '12 zxqsayi', 'şimşek zxqat', 'A zxqsik'];
  const SERBEST_IZ = /zxq|0532|123 45|selam millet|5 dk|gelirim/i;
  const IZINLI = [['hey', 'HEY!'], ['hey hey hey', 'HEY HEY!'], ['HOPPA', 'HOPPA!'], ['oleeey', 'OLEY!'], ['🔥🔥🔥🔥🔥', '🔥🔥🔥'], ['❤️', '❤️']];
  const at = (ev) => p.evaluate(S.ATES, ev);
  const U = (i) => ({ id: 'k' + i, uniqueId: 'k' + i, nickname: 'Kisi' + i, avatar: '' });
  for (let i = 0; i < 24; i++) await at({ type: 'chat', user: U(i), comment: 'a', ts: Date.now() });
  await L.bekle(3500);
  for (let tur = 0; tur < 2; tur++) for (let i = 0; i < SERBEST.length; i++) { await at({ type: 'chat', user: U(i), comment: SERBEST[i], ts: Date.now() }); await L.bekle(140); }
  const izinliSonuc = [];
  if (sayfa === 'halay.html') for (const [gir, bek] of IZINLI) { await L.bekle(3200); const n0 = await p.evaluate(() => window.__tuval.length); await at({ type: 'chat', user: U(20), comment: gir, ts: Date.now() }); await L.bekle(400); const yeni = await p.evaluate((n) => [...new Set(window.__tuval.slice(n))], n0); izinliSonuc.push(`${JSON.stringify(gir)}→${yeni.includes(bek) ? 'tamam' : 'YOK(' + yeni.filter((x) => !/^\d+$/.test(x)).slice(0, 3).join('|') + ')'}`); }
  await p.waitForFunction(() => window.__D.kart.length >= 1, null, { timeout: 60000 }).catch(() => {});
  await L.bekle(2500);
  const r = await p.evaluate(() => ({ tuval: [...new Set(window.__tuval)], dom: [...window.__D.metinler], spiker: window.__D.spiker.map((s) => s.metin + ' ' + s.html.replace(/url\([^)]*\)/g, '')), soyle: window.__D.soyle.map((s) => s.metin), kart: window.__D.kart.map((k) => k.isim + ' ' + k.alt), ulti: window.__D.ulti.map((u) => u.kim + ' ' + u.ad), govde: document.documentElement.outerHTML.replace(/<script[\s\S]*?<\/script>/g, '').replace(/url\([^)]*\)/g, '').replace(/src="data:[^"]*"/g, '') }));
  const sizinti = {};
  for (const [k, v] of Object.entries(r)) { const l = (Array.isArray(v) ? v : [v]).filter((t) => SERBEST_IZ.test(t)); if (l.length) sizinti[k] = l.slice(0, 4).map((x) => x.slice(0, 80)); }
  console.log(`# ${sayfa}: ${SERBEST.length * 2} serbest metinli yorum; tuvale yazilan farkli metin ${r.tuval.length}, DOM satiri ${r.dom.length}, spiker ${r.spiker.length}, kart ${r.kart.length}`);
  console.log(Object.keys(sizinti).length ? '  SIZINTI: ' + JSON.stringify(sizinti) : '  serbest metin HICBIR yerde gorunmedi (DOM, HTML, tuval, Spiker, TT.soyle, Finis, ULTI)');
  if (izinliSonuc.length) console.log('  izinli balonlar: ' + izinliSonuc.join('  '));
  console.log('  tuvale yazilan harfli metinler: ' + JSON.stringify(r.tuval.filter((t) => /\p{L}/u.test(t)).slice(0, 40)));
  console.log('  sayfa hatasi: ' + (hata.length ? hata.slice(0, 2).join(' | ') : 'yok'));
  await tr.close(); sun.close();
})();
