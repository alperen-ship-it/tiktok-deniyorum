'use strict';
// kabuk-inceleme.js — Isci S (dikey kabuk) incelemesi. Calisan agacin overlays/ klasorunu + S'nin bos kabuk sayfasini
// danisman/stage/kabuk altina kopyalar (depoya dokunmaz), tek tarayiciyla olcer. Port 9066.
const fs = require('fs'); const path = require('path');
const L = require('./lib'); const S = require('./sayfa');
const sonuc = []; const yaz = (t, m) => { sonuc.push({ t, m }); console.log(`  [${t}] ${m}`); };
const G = (m) => yaz('GECTI', m), K = (m) => yaz('KALDI', m), N = (m) => yaz('not  ', m);
const ADLAR = ['Ali', 'mehmet_yilmz', 'cok_uzun_kullanici_ad', 'İstanbulluGüzelÇiçekŞöğüt2026', 'Ayşe Nur Yılmaz Kaya Demir'];
const PLAN = { ust: [60, 252, 960, 128], komut: [60, 392, 960, 84], sahne: [60, 488, 960, 672], akis: [60, 1170, 960, 64], pano: [560, 1250, 460, 490], kazanan: [60, 488, 960, 746] };

(async () => {
  const hedef = path.join(L.KOK, 'stage', 'kabuk');
  fs.rmSync(hedef, { recursive: true, force: true }); fs.mkdirSync(hedef, { recursive: true });
  fs.cpSync(path.join(L.REPO, 'overlays'), path.join(hedef, 'overlays'), { recursive: true });
  const kabuk = fs.readFileSync(path.join(L.KOK, '..', 'isci-s', 'site', 'kabuk.html'), 'utf8').replace(/overlays\/_shared\//g, '_shared/');
  fs.writeFileSync(path.join(hedef, 'overlays', 'kabuk.html'), kabuk);
  const sun = await L.statikSunucu(hedef, 9066);
  const tr = await L.tarayici();
  const ac = async (sorgu, bak) => { const ctx = await tr.newContext({ viewport: bak || { width: 1080, height: 1920 } }); await ctx.addInitScript(S.KANCA); await ctx.addInitScript(S.TUVAL_KANCA); const p = await ctx.newPage(); const hata = []; p.on('pageerror', (e) => hata.push(String(e).slice(0, 160))); p.on('console', (m) => { if (m.type() === 'error' && !/WebSocket|Failed to load|ERR_/.test(m.text())) hata.push(m.text().slice(0, 160)); }); await p.goto(`http://127.0.0.1:9066/overlays/${sorgu}`, { waitUntil: 'load' }); return { ctx, p, hata }; };
  const kutu = (p, sec) => p.evaluate((sec) => { const e = document.querySelector(sec); if (!e) return null; const o = Number(getComputedStyle(document.documentElement).getPropertyValue('--tt-olcek')) || 1; const k = document.getElementById('kok').getBoundingClientRect(); const r = e.getBoundingClientRect(); return [Math.round((r.left - k.left) / o), Math.round((r.top - k.top) / o), Math.round(r.width / o), Math.round(r.height / o)]; }, sec);
  const esit = (a, b, tol = 1) => a && b && a.every((v, i) => Math.abs(v - b[i]) <= tol);
  const cek = async (p, ad) => { const y = path.join(L.CIKTI, `kabuk-${ad}.png`); await p.screenshot({ path: y }); await L.telefon(tr, y, y.replace('.png', '-telefon.png')); };
  const denetle = async (p, an) => {
    const g = await p.evaluate(S.GUVENLI), pu = await p.evaluate(S.PUNTO, 30), ke = await p.evaluate(S.KESIK), tp = await p.evaluate(S.TUVAL_PUNTO, 30);
    const s = [];
    if (g.dom.length || g.tuval.length) s.push('yasak bolgede: ' + [...g.dom, ...g.tuval].slice(0, 3).map((x) => `"${x.metin}" ${x.sec || ''} [${x.kutu}] ${x.neden}`).join(' ; '));
    if (pu.kotu.length || tp.kotu.length) s.push('<30px: ' + [...pu.kotu, ...tp.kotu].slice(0, 4).map((x) => `${x.px}px "${x.metin}" ${x.sec || ''}`).join(' ; '));
    const ell = ke.filter((x) => x.tur === 'ellipsis' || x.tur === 'kirpma');
    if (ell.length) s.push('kesilen: ' + ell.slice(0, 3).map((x) => `${x.tur} +${x.tasan}px "${x.metin}" ${x.sec}`).join(' ; '));
    s.length ? K(`${an}: ` + s.join(' || ')) : G(`${an}: yasak bolge temiz, >=30px, kesilme yok`);
  };

  // ---------------------------------------------------------------- 1) kutular
  console.log('## 1. Kutular (A3) ve TT.KUTU / --dk-*');
  {
    const { ctx, p, hata } = await ac('kabuk.html?lite=1&src=bridge');
    await L.bekle(1200);
    const tt = await p.evaluate(() => ({ kutu: JSON.parse(JSON.stringify(window.TT.KUTU || null)), yasak: JSON.parse(JSON.stringify(window.TT.YASAK || null)), dikey: window.TT.dikey, tuval: window.TT.TUVAL, sinif: document.documentElement.className, css: Object.fromEntries(['sahne', 'pano', 'ust', 'komut', 'akis', 'kazanan'].map((k) => [k, ['x', 'y', 'w', 'h'].map((e) => parseFloat(getComputedStyle(document.documentElement).getPropertyValue(`--dk-${k}-${e}`)))])) }));
    N('TT.KUTU = ' + JSON.stringify(tt.kutu) + ' ; dikey=' + tt.dikey + ' ; sinif=' + tt.sinif);
    for (const [k, v] of Object.entries(PLAN)) {
      const t = tt.kutu && tt.kutu[k]; const tv = t && (Array.isArray(t) ? t : [t.x, t.y, t.w, t.h]);
      esit(tv, v, 0) ? G(`TT.KUTU.${k} = plan [${v}]`) : K(`TT.KUTU.${k} = ${JSON.stringify(t)} ; plan [${v}]`);
      esit(tt.css[k], v, 0) ? 0 : (tt.css[k].some(isNaN) ? N(`--dk-${k}-* tanimsiz (${tt.css[k]})`) : K(`--dk-${k}-* = [${tt.css[k]}] ; plan [${v}]`));
    }
    await p.evaluate(() => window.TT.fire({ type: 'chat', user: { id: 'a', uniqueId: 'a', nickname: 'Ali' }, comment: 'zxqyorum metni', ts: Date.now() }));
    await L.bekle(600);
    for (const [sec, k] of [['#ust', 'ust'], ['#katilCagri', 'komut'], ['#akis', 'akis'], ['#pano', 'pano'], ['#alan', 'sahne']]) { const r = await kutu(p, sec); esit(r, PLAN[k], 2) ? G(`${sec} olculen [${r}] = ${k}`) : K(`${sec} olculen [${r}] ; plan ${k} [${PLAN[k]}]`); }
    await denetle(p, 'bos kabuk');
    const m = await p.evaluate(() => document.body.innerText); /zxqyorum/.test(m) ? K('sohbet metni ekranda gorundu') : G('TT.fire ile gelen yorum metni innerText te yok');
    N('KOMUT seridi metni: ' + JSON.stringify((await p.evaluate(() => document.getElementById('katilCagri').innerText)).replace(/\n/g, ' | ')));
    await cek(p, '1-bos');
    // ---- pano adlari
    await p.evaluate((a) => window.panoDoldur(a), ADLAR); await L.bekle(300);
    const pa = await p.evaluate(() => [...document.querySelectorAll('#pano .ad')].map((e) => ({ ad: e.textContent, px: parseFloat(getComputedStyle(e).fontSize), satir: Math.round(e.getBoundingClientRect().height / parseFloat(getComputedStyle(e).lineHeight || 1)) || 0, tasma: e.scrollWidth > e.clientWidth + 1 })));
    N('pano adlari: ' + pa.map((x) => `${[...x.ad].length}krk→${x.px}px${x.tasma ? ' TASIYOR' : ''}`).join(', '));
    pa.every((x) => x.px >= 40 && !x.tasma) ? G('pano: adlar >=40px, tasma yok') : K('pano: 40px altinda ya da tasan ad var');
    await denetle(p, 'pano 5 ad'); await cek(p, '2-pano');
    // ---- spiker
    for (const ad of ADLAR) { await p.evaluate((ad) => window.Spiker.satir(['🏆 ', { kim: ad }, ' — ', { b: 'KAZANDI' }, ' · 12 kişi bildi, hep birlikte'], { oncelik: 3, sure: 900 }), ad); await L.bekle(350); const r = await kutu(p, '#akis'); const s = await p.evaluate(() => { const k = document.querySelector('#akis .kim'); const st = document.querySelector('#akis .satir'); return { kim: k && parseFloat(getComputedStyle(k).fontSize), satir: st && parseFloat(getComputedStyle(st).fontSize), h: st && st.getBoundingClientRect().height, tasma: st && (st.scrollWidth > st.clientWidth + 1) }; }); if (ad === ADLAR[3] || ad === ADLAR[0]) { await denetle(p, `spiker "${ad}"`); N(`spiker ${[...ad].length}krk: satir ${s.satir}px, ad ${s.kim}px, #akis [${r}]`); if (ad === ADLAR[3]) await cek(p, '3-spiker-uzun'); } await L.bekle(700); }
    // ---- son yazan
    const sp0 = await p.evaluate(() => window.__D.spiker.length);
    await p.evaluate(() => window.TT.fire({ type: 'chat', user: { id: 'yeni', uniqueId: 'yeni', nickname: 'YeniYazan' }, comment: 'x', ts: Date.now() })); await L.bekle(500);
    N('son yazan: akis="' + (await p.evaluate(() => document.getElementById('akis').innerText)).replace(/\n/g, ' ') + '" ; kcSonYazan gorunur=' + (await p.evaluate(() => { const e = document.getElementById('kcSonYazan'); return !!e && getComputedStyle(e).display !== 'none' && e.getBoundingClientRect().width > 0; })) + ' ; spiker cagri +' + ((await p.evaluate(() => window.__D.spiker.length)) - sp0));
    // ---- finis
    for (const ad of ADLAR) {
      await p.evaluate((ad) => window.Finis.kart(document.getElementById('kazanan'), { kupa: '🏆', isim: ad, alt: '#3 · çarpan x4.5 · 12 kişi bildi' }), ad); await L.bekle(900);
      const r = await kutu(p, '#kazanan'); const f = await p.evaluate(() => { const a = document.querySelector('#kazanan .kimAd'), b = document.querySelector('#kazanan .altYazi'); return { ad: parseFloat(getComputedStyle(a).fontSize), alt: parseFloat(getComputedStyle(b).fontSize), tasma: a.scrollWidth > a.clientWidth + 1, h: Math.round(a.getBoundingClientRect().height), html: a.innerHTML.length !== a.textContent.length && !/wbr/.test(a.innerHTML) }; });
      const tamam = esit(r, PLAN.kazanan, 2) && f.ad >= 56 && f.ad <= 110 && !f.tasma && f.alt >= 30;
      (tamam ? G : K)(`Finis ${[...ad].length}krk: kutu [${r}], ad ${f.ad}px (${f.h}px yuksek), alt ${f.alt}px${f.tasma ? ', AD TASIYOR' : ''}`);
      if (ad === ADLAR[3] || ad === ADLAR[2]) { await denetle(p, `Finis "${ad}"`); await cek(p, 'finis-' + [...ad].length); }
      await p.evaluate(() => window.Finis.kapat(document.getElementById('kazanan'))); await L.bekle(150);
    }
    // ---- finis XSS + konfeti
    await p.evaluate(() => { window.__x = 0; window.Finis.kart(document.getElementById('kazanan'), { isim: '<img src=x onerror=__x++>', alt: '<b>alt</b><img src=x onerror=__x++>' }); window.Spiker.satir([{ kim: '<img src=x onerror=__x++>' }, ' test'], { oncelik: 3 }); window.ULTI.duyur('<img src=x onerror=__x++>', { ad: '<img src=x onerror=__x++>', emoji: '🎁', renk: '#fff', guc: 1 }, 600); });
    await L.bekle(900);
    const x = await p.evaluate(() => ({ x: window.__x, img: document.querySelectorAll('img[src="x"]').length })); x.x || x.img ? K(`ad HTML olarak yorumlandi (onerror ${x.x}, img ${x.img})`) : G('Finis / Spiker.satir / ULTI: kotu niyetli ad HTML olarak yorumlanmiyor');
    await p.evaluate(() => { window.Finis.kapat(document.getElementById('kazanan')); window.Juice.konfeti({ y: 0.3 }); }); await L.bekle(400);
    const kf = await p.evaluate(() => { const o = Number(getComputedStyle(document.documentElement).getPropertyValue('--tt-olcek')) || 1; const k = document.getElementById('kok').getBoundingClientRect(); return [...document.querySelectorAll('canvas')].map((c) => { const r = c.getBoundingClientRect(); const cp = getComputedStyle(c).clipPath; return { kutu: [Math.round((r.left - k.left) / o), Math.round((r.top - k.top) / o), Math.round(r.width / o), Math.round(r.height / o)], klip: cp && cp !== 'none' ? cp.slice(0, 90) : 'yok', ebeveyn: c.parentElement.id || c.parentElement.tagName }; }); });
    N('konfeti tuvali: ' + JSON.stringify(kf)); await cek(p, '4-konfeti');
    // ---- uyanis
    await p.evaluate(() => window.TT.uyanis({ baslik: 'AT YARIŞI', komutlar: ['1', '5', 'şimşek'], aciklama: 'Atının numarasını (1-8) ya da adını yaz · az seçilen atın çarpanı büyük', cagri: 'tahminini yap, koşu başlasın' })); await L.bekle(900);
    const uy = await kutu(p, '#tt-uyanis'); N('uyanis perdesi kutu: ' + JSON.stringify(uy)); await denetle(p, 'uyanis perdesi'); await cek(p, '5-uyanis');
    hata.length ? K('sayfa hatasi: ' + hata.slice(0, 3).join(' | ')) : G('kabuk sayfasinda hata yok');
    await ctx.close();
  }

  // ---------------------------------------------------------------- 2) ULTI
  console.log('## 2. ULTI bandi');
  {
    const { ctx, p } = await ac('kabuk.html?lite=1&src=bridge'); await L.bekle(800);
    for (const ad of [ADLAR[0], ADLAR[3]]) {
      await p.evaluate((ad) => window.ULTI.duyur('🎁 TEŞEKKÜRLER', { ad, emoji: '🎁', renk: '#ffd23f', guc: 2 }, 1200), ad); await L.bekle(600);
      const b = await p.evaluate(() => { const o = Number(getComputedStyle(document.documentElement).getPropertyValue('--tt-olcek')) || 1; const k = document.getElementById('kok').getBoundingClientRect(); const e = document.getElementById('ulti-bant'); const r = e.getBoundingClientRect(); const px = (s) => parseFloat(getComputedStyle(e.querySelector(s)).fontSize) / (e.closest('#kok') ? 1 : o); const m = e.querySelector('.u-metin').getBoundingClientRect(); return { merkezY: Math.round(((r.top + r.bottom) / 2 - k.top) / o), ust: Math.round((r.top - k.top) / o), alt: Math.round((r.bottom - k.top) / o), buyuk: px('.u-ad'), kucuk: px('.u-kim'), adSol: Math.round((m.left - k.left) / o), adSag: Math.round((m.right - k.left) / o), ickok: !!e.closest('#kok') }; });
      const iyi = Math.abs(b.merkezY - 316) <= 12 && b.alt <= 488 && b.ust >= 240 && b.kucuk >= 30 && b.buyuk >= 40 && b.adSol >= 60 && b.adSag <= 1020;
      (iyi ? G : K)(`ULTI ${[...ad].length}krk: merkez y=${b.merkezY} (ust ${b.ust}, alt ${b.alt}), buyuk satir ${b.buyuk}px, kucuk ${b.kucuk}px, ad x ${b.adSol}..${b.adSag}`);
      if (ad === ADLAR[3]) { await denetle(p, 'ULTI 28krk'); await cek(p, '6-ulti'); }
      await L.bekle(1300);
    }
    // kuyruk: buyuk once, 11 kucuk
    const gor = p.evaluate(() => new Promise((c) => { const t0 = performance.now(); let g = false; const b = () => { const e = document.getElementById('ulti-bant'); if (e && e.classList.contains('gorunur') && e.innerText.includes('BuyukBagisci')) g = true; if (g || performance.now() - t0 > 14000) c(g); else setTimeout(b, 50); }; b(); }));
    await p.evaluate(() => { const d = (ad, guc) => window.ULTI.duyur('🎁', { ad, emoji: '🎁', renk: '#fff', guc }, 700); d('IlkKucuk', 1); d('BuyukBagisci', 5); for (let i = 0; i < 11; i++) d('Kucuk' + i, 1); });
    (await gor) ? G('ULTI kuyrugu: buyuk hediye 11 kucukten once gelse de gosterildi') : K('ULTI kuyrugu: buyuk hediye dustu');
    await ctx.close();
  }

  // ---------------------------------------------------------------- 3) guvenli=1, pencere boyutlari
  console.log('## 3. ?guvenli=1 ve farkli pencere boyutlari');
  {
    const { ctx, p } = await ac('kabuk.html?lite=1&src=bridge&guvenli=1'); await L.bekle(800);
    const z = await p.evaluate(() => { const o = Number(getComputedStyle(document.documentElement).getPropertyValue('--tt-olcek')) || 1; const k = document.getElementById('kok').getBoundingClientRect(); return [...document.querySelectorAll('[id^="tt-guv"], .tt-guvenli, #tt-kilavuz *, [class*="yasak"], [class*="guvenli"]')].map((e) => { const r = e.getBoundingClientRect(); return [Math.round((r.left - k.left) / o), Math.round((r.top - k.top) / o), Math.round(r.width / o), Math.round(r.height / o)]; }).filter((r) => r[2] > 5 && r[3] > 5).slice(0, 8); });
    N('guvenli=1 golge kutulari: ' + JSON.stringify(z)); await cek(p, '7-guvenli');
    const bekl = ['0,0,1080,240', '0,1760,1080,160', '0,1250,540,510'];
    const var_ = z.map((r) => r.join(','));
    bekl.every((b) => var_.some((v) => v === b || (b === '0,1250,540,510' && /^0,1250,540,/.test(v)))) && var_.some((v) => /^0,\d+,60,/.test(v)) && var_.some((v) => /^1020,\d+,60,/.test(v)) ? G('guvenli=1: dort yasak bolge golgeli') : N('guvenli=1 kutulari plan bolgeleriyle birebir eslesmedi — goruntuye bak');
    await ctx.close();
    for (const [w, h] of [[390, 693], [1920, 1080], [1080, 2400], [720, 1280]]) {
      const c2 = await ac('kabuk.html?lite=1&src=bridge', { width: w, height: h }); await L.bekle(500);
      const r = await c2.p.evaluate(() => { const k = document.getElementById('kok').getBoundingClientRect(); return { o: Number(getComputedStyle(document.documentElement).getPropertyValue('--tt-olcek')), k: [Math.round(k.left), Math.round(k.top), Math.round(k.width), Math.round(k.height)], kaydirma: document.documentElement.scrollWidth > innerWidth + 1 || document.documentElement.scrollHeight > innerHeight + 1 }; });
      const bek = Math.min(w / 1080, h / 1920); const ic = r.k[0] >= -1 && r.k[1] >= -1 && r.k[0] + r.k[2] <= w + 1 && r.k[1] + r.k[3] <= h + 1 && Math.abs(r.k[0] - (w - 1080 * bek) / 2) <= 2 && Math.abs(r.k[1] - (h - 1920 * bek) / 2) <= 2;
      (Math.abs(r.o - bek) < 0.002 && ic && !r.kaydirma ? G : K)(`pencere ${w}x${h}: olcek ${r.o.toFixed(4)} (beklenen ${bek.toFixed(4)}), #kok [${r.k}]${r.kaydirma ? ', SAYFA KAYIYOR' : ''}`);
      if (w === 1920) { await c2.p.evaluate(() => window.ULTI.duyur('🎁 TEŞEKKÜRLER', { ad: 'Ali', emoji: '🎁', renk: '#fff', guc: 1 }, 900)); await L.bekle(500); const b = await c2.p.evaluate(() => { const o = Number(getComputedStyle(document.documentElement).getPropertyValue('--tt-olcek')); const k = document.getElementById('kok').getBoundingClientRect(); const e = document.getElementById('ulti-bant').getBoundingClientRect(); const a = document.querySelector('#ulti-bant .u-ad').getBoundingClientRect(); return { my: Math.round(((e.top + e.bottom) / 2 - k.top) / o), adH: Math.round(a.height / o), sol: Math.round((e.left - k.left) / o), sag: Math.round((e.right - k.left) / o) }; }); (Math.abs(b.my - 316) <= 12 && b.adH >= 50 ? G : K)(`  kucultulmus pencerede ULTI olcekleniyor: merkez y=${b.my}, buyuk satir yuksekligi ${b.adH} tasarim px, x ${b.sol}..${b.sag}`); }
      await c2.ctx.close();
    }
  }

  // ---------------------------------------------------------------- 4) merkez rozeti
  console.log('## 4. Merkez (oyun.html) "birazdan" rozeti');
  {
    const { ctx, p, hata } = await ac('oyun.html?lite=1&mock=1&oyunlar=at,bilgi&sn=50&tahmin=30&bahis=30'); await L.bekle(7500);
    const r = await p.evaluate(() => { const e = document.getElementById('siradaki'); if (!e) return null; const k = e.getBoundingClientRect(); const cs = getComputedStyle(e); const o = Math.min(innerWidth / 1080, innerHeight / 1920); return { kutu: [Math.round(k.left / o), Math.round(k.top / o), Math.round(k.width / o), Math.round(k.height / o)], px: Math.round(parseFloat(cs.fontSize) / o), gorunur: cs.display !== 'none' && Number(cs.opacity) > 0.5, metin: e.innerText }; });
    r && r.gorunur && esit(r.kutu, PLAN.komut, 3) && r.px >= 30 ? G(`rozet [${r.kutu}] ${r.px}px "${r.metin}"`) : K('rozet: ' + JSON.stringify(r) + ` ; plan [${PLAN.komut}]`);
    await cek(p, '8-merkez-rozet');
    hata.length ? N('merkez hata: ' + hata.slice(0, 2).join(' | ')) : 0;
    await ctx.close();
  }
  await tr.close(); sun.close();
  const k = sonuc.filter((s) => s.t === 'KALDI');
  console.log(`\n# OZET: ${sonuc.filter((s) => s.t === 'GECTI').length} gecti, ${k.length} kaldi`); for (const x of k) console.log('  KALDI ' + x.m.slice(0, 230));
})().catch((e) => { console.error('HATA', e); process.exit(2); });
