const L = require('./lib'); const S = require('./sayfa');
const U = (id, ad) => ({ id, uniqueId: id, nickname: ad, avatar: '' });
(async () => { const b = await L.statikSunucu(L.REPO, 9064); const tr = await L.tarayici(['--enable-unsafe-swiftshader']);
  const ctx = await tr.newContext({ viewport: { width: 1080, height: 1920 } }); await ctx.addInitScript(S.KANCA); await ctx.addInitScript(S.TUVAL_KANCA); const p = await ctx.newPage(); const hata = []; p.on('pageerror', (e) => hata.push(String(e).slice(0, 120)));
  await p.goto('http://127.0.0.1:9064/overlays/halay.html?lite=1&src=bridge&sure=40&kutlama=8&kalite=dusuk&kilit=1'); await L.bekle(2500);
  for (let i = 0; i < 8; i++) { await p.evaluate(S.ATES, { type: 'chat', user: U('a' + i, 'Kisi' + i), comment: 'x', ts: Date.now() }); await L.bekle(150); }
  await L.bekle(2500); await p.evaluate(() => { window.__T2.kayit.length = 0; });
  await p.evaluate(S.ATES, { type: 'chat', user: U('uzun', 'İstanbulluGüzelÇiçekŞöğüt2026'), comment: 'x', ts: Date.now() }); await L.bekle(1500);
  const r = await p.evaluate(() => { const dom = document.body.innerText.replace(/\s+/g, ''); const tv = window.__T2.kayit.map((k) => k.metin).join(''); return { dom: dom.includes('İstanbulluGüzelÇiçekŞöğüt2026'), tuval: tv.includes('İstanbulluGüzelÇiçekŞöğüt2026') }; });
  console.log('tek giris, uzun ad:', JSON.stringify(r));
  // hediye afisi sirasinda etiket; sonra kart
  await p.evaluate(S.ATES, { type: 'gift', user: U('uzun', 'İstanbulluGüzelÇiçekŞöğüt2026'), gift: { id: 1, name: 'x', diamonds: 1500, value: 1500, count: 1, streaking: false }, ts: Date.now() }); await L.bekle(900);
  await p.evaluate(() => { window.__T2.kayit.length = 0; }); await L.bekle(700);
  const a = await p.evaluate(() => ({ etiket: [...new Set(window.__T2.kayit.map((k) => k.metin))].slice(0, 8), oz: window.Halay.ozet().meydan })); console.log('afis sirasinda tuval metni:', JSON.stringify(a)); await p.screenshot({ path: 'out/h2-afis.png' });
  await p.waitForFunction(() => window.__D.kart.length > 0, null, { timeout: 45000 }).catch(() => {}); await L.bekle(1500); await p.evaluate(() => { window.__T2.kayit.length = 0; }); await L.bekle(900);
  const k = await p.evaluate(() => ({ tuval: [...new Set(window.__T2.kayit.map((k) => k.metin))].slice(0, 6), bg: getComputedStyle(document.getElementById('kazanan')).backgroundColor })); console.log('kart acikken:', JSON.stringify(k), 'hata', hata.length); await p.screenshot({ path: 'out/h2-kart.png' });
  await tr.close(); process.exit(0); })();
