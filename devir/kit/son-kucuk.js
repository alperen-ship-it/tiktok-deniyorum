const L = require('./lib'); const S = require('./sayfa');
const U = (id, ad) => ({ id, uniqueId: id, nickname: ad || id, avatar: '' });
(async () => { const b = await L.statikSunucu(L.REPO, 9064); const tr = await L.tarayici();
  const ac = async (sayfa, q, init) => { const ctx = await tr.newContext({ viewport: { width: 1080, height: 1920 } }); await ctx.addInitScript(S.KANCA); if (init) await ctx.addInitScript(init); const p = await ctx.newPage(); const hata = []; p.on('pageerror', (e) => hata.push(String(e).slice(0, 120))); await p.goto(`http://127.0.0.1:9064/overlays/${sayfa}?lite=1&src=bridge&${q}`); await L.bekle(1200); return { ctx, p, hata }; };
  // 1) Finis ad2 + Spiker ofset (pk sayfasinda)
  { const { ctx, p, hata } = await ac('pk.html', '');
    const komut = await p.evaluate(() => { const e = document.querySelector('#komut, .komutSerit, #komutMetin'); return e ? e.innerText.replace(/\s+/g, ' ') : document.body.innerText.split('\n').filter((x) => /1.*2/.test(x)).slice(0, 3).join(' | '); });
    console.log('pk KOMUT:', komut);
    for (const [ad, ad2] of [['Ali', 'İstanbulluGüzelÇiçekŞöğüt2026'], ['İstanbulluGüzelÇiçekŞöğüt2026', 'cok_uzun_kullanici_ad'], ['Ali', undefined]]) {
      await p.evaluate(([ad, ad2]) => { window.Finis.kart(document.getElementById('kazanan'), { kupa: '🏆', isim: ad, ad2, alt: '12 puanla kazandı · 🏅 MVP' }); }, [ad, ad2]); await L.bekle(1600);
      const r = await p.evaluate(() => { const k = document.getElementById('kazanan'); const kr = k.getBoundingClientRect(); const o = kr.width / 960; return [...k.querySelectorAll('.kimAd, .altYazi')].map((e) => { const r = e.getBoundingClientRect(); return e.className.replace('gel', '').trim() + ':' + Math.round(parseFloat(getComputedStyle(e).fontSize)) + 'px w' + Math.round(r.width / o) + ' h' + Math.round(r.height / o) + (r.right > kr.right + 1 || r.left < kr.left - 1 || e.scrollWidth > e.clientWidth + 1 ? ' TASIYOR' : '') + ' "' + e.textContent.slice(0, 14) + '"'; }).join(' ; ') + ' | kart ici tasma: ' + (k.scrollHeight > k.clientHeight + 1); });
      console.log(' finis', JSON.stringify([ad, ad2]), '→', r); if (ad2 && ad.length > 5) await p.screenshot({ path: 'out/son-finis-ad2.png' });
      await p.evaluate(() => window.Finis.kapat(document.getElementById('kazanan')));
    }
    const of = await p.evaluate(() => new Promise((c) => { window.Spiker.satir(['deneme ', { kim: 'Ali' }], { oncelik: 5 }); requestAnimationFrame(() => requestAnimationFrame(() => { const e = document.querySelector('#akis .satir, .satir'); const an = e && e.getAnimations()[0]; const kf = an ? an.effect.getKeyframes().map((k) => k.transform) : []; c({ ad: an && an.animationName, kf, waapi: an ? an.constructor.name : null }); })); }));
    console.log(' spiker:', JSON.stringify(of), 'hata', hata.length); await ctx.close(); }
  // 2) bilgi + pk: localStorage firlatirsa
  for (const s of ['bilgi.html', 'pk.html']) { const { ctx, p, hata } = await ac(s, 'mock=1&rate=3', () => { const f = () => { throw new DOMException('yasak', 'SecurityError'); }; try { Storage.prototype.getItem = f; Storage.prototype.setItem = f; } catch (e) {} }); await L.bekle(9000); const m = await p.evaluate(() => document.body.innerText.length); console.log(s, 'localStorage kapali: hata', hata.length, hata[0] || '', 'metin', m); await ctx.close(); }
  await tr.close(); process.exit(0); })();
