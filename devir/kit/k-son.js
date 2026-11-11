const L = require('./lib'); const S = require('./sayfa');
(async () => { const b = await L.statikSunucu(L.REPO, 9064); const tr = await L.tarayici(['--enable-unsafe-swiftshader']);
  const ctx = await tr.newContext({ viewport: { width: 1080, height: 1920 } }); await ctx.addInitScript(S.TUVAL_KANCA); const p = await ctx.newPage(); const hata = []; p.on('pageerror', (e) => hata.push(String(e)));
  await p.goto('http://127.0.0.1:9064/overlays/sahne3d-deneme.html?kisi=150&kalite=dusuk&kilit=1'); await p.waitForFunction(() => window.__sahne3d); await L.bekle(2500);
  const r = await p.evaluate(async () => { const s = window.__sahne3d; const o = {}; o.sayi = s.figur.sayi(); o.simgeYok = s.simge('yok-boyle-biri', ['HEY']); const l = s.figur.liste(); const ilk = typeof l[0] === 'string' ? l[0] : l[0].kid; o.simgeVar = s.simge(ilk, ['HEY']);
    s.figur.cikar(ilk); o.ekleHemen = s.figur.ekle('yeni-biri', { renk: '#ff0000' }); o.sayiSonra = s.figur.sayi();
    s.etiket.ayarla([{ kid: 'yeni-biri', ad: 'İstanbulluGüzelÇiçekŞöğüt2026', oncelik: 100 }]); await new Promise((c) => setTimeout(c, 1500));
    const k = window.__T2.kayit.slice(-300); const ad = k.filter((x) => /stanbullu|Şöğüt|2026/.test(x.metin)); o.etiket = [...new Set(ad.map((x) => x.metin + '@' + Math.round(x.px) + 'px'))].slice(0, 6); o.nida = [...new Set(k.filter((x) => /HEY/.test(x.metin)).map((x) => x.metin))]; const c = document.createElement('canvas').getContext('2d'); return o; });
  console.log(JSON.stringify(r), 'hata', hata.length); await tr.close(); process.exit(0); })();
