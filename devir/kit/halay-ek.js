'use strict';
// halay-ek.js — teslim incelemesi ek testleri: (1) yorum/ad enjeksiyonu, (2) karsilama seli, (3) 6 sarkilik bellek, (4) tek kisi cosku. Port 9067, tek tarayici.
const path = require('path'); const L = require('./lib'); const S = require('./sayfa');
const U = (id, ad) => ({ id, uniqueId: id, nickname: ad || id, avatar: '' });
const chat = (id, y, ad) => ({ type: 'chat', user: U(id, ad), comment: y, ts: Date.now() });
(async () => {
  const sun = await L.statikSunucu(L.kaynak('repo'), 9067);
  const tr = await L.tarayici(['--enable-precise-memory-info']);
  const ac = async (sorgu) => { const ctx = await tr.newContext({ viewport: { width: 1920, height: 1080 } }); await ctx.addInitScript(S.KANCA); const p = await ctx.newPage(); const hata = []; p.on('pageerror', (e) => hata.push(String(e).slice(0, 160))); p.on('console', (m) => { if (m.type() === 'error' && !/WebSocket|Failed to load|ERR_/.test(m.text())) hata.push(m.text().slice(0, 160)); }); await p.goto(`http://127.0.0.1:9067/overlays/halay.html?${sorgu}`, { waitUntil: 'load' }); await p.waitForFunction(() => window.Halay); return { ctx, p, hata }; };
  const at = (p, ev) => p.evaluate(S.ATES, ev);

  // ---------- 1) enjeksiyon
  {
    const { ctx, p, hata } = await ac('lite=1&src=bridge&sure=600');
    await p.evaluate(() => { window.__xss = 0; });
    const YUK = ['<img src=x onerror=__xss++>', '"><svg onload=__xss++>', '<script>__xss++</script>', '&lt;b&gt;kalin&lt;/b&gt; &amp;', '‮ters cevir ‭', 'z̀́̂̃̄à́̂l̀́go', 'A'.repeat(300), '🔥'.repeat(60), 'javascript:alert(1)', '${__xss++}', '<b style="font-size:300px">DEV</b>', "';__xss++;//", 'hey <i>hop</i>', '@<img src=x onerror=__xss++>', '{{7*7}}'];
    for (let i = 0; i < YUK.length; i++) { await at(p, chat('e' + i, 'selam', 'Enj' + i)); }
    await L.bekle(1500);
    const gorulen = [];
    for (let i = 0; i < YUK.length; i++) { await p.evaluate(([ev, ham]) => { ev.comment = ham; window.TT.fire(ev); }, [chat('e' + i, '', 'Enj' + i), YUK[i]]); await L.bekle(120); const b = (await p.evaluate(() => window.Halay.ozet().balonlar)).filter((x) => x.kid === 'e' + i && !x.sistem); gorulen.push(b[0] ? b[0].metin : null); }
    // ad uzerinden: TT.dispatch'i ATLAYARAK dogrudan isleyicilere (zararsiz() devre disi kalsa da guvenli mi)
    const kotuAd = '<img src=x onerror=__xss++>"\'&<svg/onload=__xss++>';
    await p.evaluate((ad) => { const ev = { type: 'chat', user: { id: 'kotu', uniqueId: 'kotu', nickname: ad }, comment: 'selam', ts: Date.now() }; window.TT.fire(ev); window.TT.fire({ type: 'gift', user: ev.user, gift: { value: 2000, diamonds: 2000, count: 1, streaking: false }, ts: Date.now() }); window.TT.fire({ type: 'follow', user: { id: 'kotu2', uniqueId: 'kotu2', nickname: ad }, ts: Date.now() }); window.TT.fire({ type: 'chat', user: { id: 'k3', uniqueId: 'k3', nickname: 'Davetci' }, comment: '@kotu', ts: Date.now() }); }, kotuAd);
    await L.bekle(6000);
    const r = await p.evaluate(() => ({ xss: window.__xss, img: document.querySelectorAll('img[src="x"],svg[onload],script:not([src])').length - document.querySelectorAll('body > script:not([src]), head > script:not([src])').length, kokImg: document.querySelectorAll('#kok img[src="x"], #kok svg, #akis img').length }));
    const uzun = gorulen.filter((m) => m && [...m].length > 22);
    console.log(`## 1 enjeksiyon: onerror/onload calisan=${r.xss}, #kok icinde enjekte eleman=${r.kokImg}, 22 krk asan balon=${uzun.length}, sayfa hatasi=${hata.length ? hata.slice(0, 2).join(' | ') : 'yok'}`);
    console.log('   balon metinleri: ' + YUK.map((y, i) => `${JSON.stringify(y.slice(0, 18))}→${JSON.stringify(gorulen[i])}`).join('  '));
    await p.screenshot({ path: path.join(L.CIKTI, 'halay-ek-enjeksiyon.png') });
    await ctx.close();
  }

  // ---------- 2) karsilama seli
  {
    const { ctx, p } = await ac('lite=1&src=bridge&sure=600');
    await L.bekle(2500);
    const adlar = Array.from({ length: 40 }, (_, i) => 'Selam' + String(i).padStart(2, '0') + 'x');
    const izle = p.evaluate(([adlar, ms]) => new Promise((coz) => { const ilk = {}; const t0 = performance.now(); const kuyruk = []; const bak = () => { const m = document.body.innerText; const t = performance.now() - t0; for (const a of adlar) if (ilk[a] == null && m.includes(a)) ilk[a] = Math.round(t); const o = window.Halay.ozet(); kuyruk.push([Math.round(t), o.altyazi]); if (t < ms) setTimeout(bak, 100); else coz({ ilk, kuyruk }); }; bak(); }), [adlar, 40000]);
    for (let i = 0; i < 40; i++) { await at(p, chat('s' + i, 'merhaba', adlar[i])); if (i % 4 === 0) await p.evaluate((u) => window.TT.fire({ type: 'follow', user: u, ts: Date.now() }), U('s' + i, adlar[i])); await L.bekle(25); }
    const z = await izle;
    const gor = adlar.filter((a) => z.ilk[a] != null);
    const bosalma = (z.kuyruk.find(([t, n], i) => i > 5 && n === 0) || [null])[0];
    const enUzun = Math.max(...z.kuyruk.map((k) => k[1]));
    const sirali = gor.map((a) => z.ilk[a]); let ters = 0; for (let i = 1; i < sirali.length; i++) if (sirali[i] < sirali[i - 1] - 150) ters++;
    console.log(`## 2 karsilama seli (40 ilk mesaj + 10 takip, ~1 sn): ekranda adi gorunen ${gor.length}/40; en uzun kuyruk ${enUzun}; kuyruk ${bosalma == null ? '40 sn de bosalmadi' : (bosalma / 1000).toFixed(1) + ' sn de bosaldi'}; sira bozulmasi ${ters}; son adin gorunmesi ${(Math.max(...sirali) / 1000).toFixed(1)} sn`);
    console.log('   gorunmeyen: ' + (adlar.filter((a) => z.ilk[a] == null).join(', ') || 'yok'));
    const o = await p.evaluate(() => window.Halay.ozet()); console.log(`   sonda n=${o.n}, sirada bu 40 kisiden ${o.sira.filter((s) => /^Selam/.test(s.ad)).length}`);
    await ctx.close();
  }

  // ---------- 4) tek kisi cosku
  {
    const { ctx, p } = await ac('lite=1&src=bridge&sure=600');
    await L.bekle(3000);
    const t0 = Date.now(); let dolu = null; const iz = [];
    for (let i = 0; i < 180 && dolu == null; i++) { await at(p, chat('tek', i % 2 ? 'hey hey hey' : 'hop hop hoppa', 'TekKisi')); await at(p, { type: 'like', user: U('tek', 'TekKisi'), likes: 15, ts: Date.now() }); await L.bekle(450); const o = await p.evaluate(() => window.Halay.ozet()); if (i % 10 === 0) iz.push(Math.round(o.cosku)); if (o.cosku >= 99.5) dolu = (Date.now() - t0) / 1000; }
    console.log(`## 4 tek izleyici (surekli tezahurat + 15'lik begeni, 0.45 sn de bir; odada 6 demo botu): cosku ${dolu == null ? '80 sn de dolmadi' : dolu.toFixed(0) + ' sn de %100'}; iz: ${iz.join(' ')}`);
    await ctx.close();
  }

  // ---------- 3) bellek 6 sarki
  {
    const { ctx, p, hata } = await ac('lite=1&src=bridge&sure=22&kutlama=4&kabul=4&duet=3&solo=2');
    const cdp = await ctx.newCDPSession(p); await cdp.send('Performance.enable');
    const olc = async () => { await cdp.send('HeapProfiler.collectGarbage'); await L.bekle(150); await cdp.send('HeapProfiler.collectGarbage'); const m = Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map((x) => [x.name, x.value])); return { heap: +(m.JSHeapUsedSize / 1048576).toFixed(2), dugum: m.Nodes, din: m.JSEventListeners }; };
    let dur = false;
    const pompa = (async () => { let i = 0; while (!dur) { const k = 'b' + (i % 300); const r = i % 8; const u = U(k, 'Bellek' + (i % 300)); try { await p.evaluate(([r, u, i]) => { const f = window.TT.fire; if (r === 0) f({ type: 'like', user: u, likes: 9, ts: Date.now() }); else if (r === 1) f({ type: 'gift', user: u, gift: { value: [1, 150, 2000][i % 3], count: 1, streaking: false }, ts: Date.now() }); else if (r === 2) f({ type: 'follow', user: u, ts: Date.now() }); else if (r === 3) f({ type: 'chat', user: u, comment: '@Bellek' + ((i * 7) % 300), ts: Date.now() }); else if (r === 4) f({ type: 'chat', user: u, comment: String(1 + (i % 60)), ts: Date.now() }); else f({ type: 'chat', user: u, comment: 'hey hop ' + i, ts: Date.now() }); }, [r, u, i]); } catch { break; } i++; await L.bekle(30); } })();
    const dizi = [];
    for (let s = 1; s <= 6; s++) { await p.waitForFunction((n) => window.__D.kart.length >= n, s, { timeout: 60000 }).catch(() => {}); await L.bekle(1500); dizi.push(await olc()); }
    dur = true; await pompa;
    const o = await p.evaluate(() => { const z = window.Halay.ozet(); return { n: z.n, alt: z.altyazi, bas: z.basKuyruk.length, orta: z.ortaKuyruk.length, balon: z.balon, efekt: z.efekt, ls: Object.keys(localStorage).map((k) => k + ':' + localStorage.getItem(k).length).join(',') }; });
    console.log(`## 3 bellek, 6 sarki (300 farkli izleyici, ~30 olay/sn): heap MB ${dizi.map((d) => d.heap).join(' → ')} ; DOM dugumu ${dizi.map((d) => d.dugum).join(' → ')} ; dinleyici ${dizi.map((d) => d.din).join(' → ')}`);
    console.log(`   son durum ${JSON.stringify(o)} ; sayfa hatasi: ${hata.length ? hata.slice(0, 3).join(' | ') : 'yok'}`);
    await ctx.close();
  }
  await tr.close(); sun.close();
})().catch((e) => { console.error('HATA', e); process.exit(2); });
