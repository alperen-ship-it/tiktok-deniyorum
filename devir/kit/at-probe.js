'use strict';
/**
 * at-probe.js <head|repo|yol> [--tur N] [--hizli]
 *
 * At yarisi sondasi (kara kutu; depoyu statik sunar, port 9066):
 *   A) KELIME TARAMASI — tam donguler boyunca izleyicinin gorebildigi HER metin:
 *      innerText (120 ms ornekleme + MutationObserver), ::before/::after content,
 *      <title>, Spiker.soyle satirlari, TT.soyle (sohbet botu) metinleri,
 *      TT.uyanis perdesi, Finis.kart, ULTI bandi. Turkce-duyarli.
 *   B) ODUL ESITLIGI — ayni ata tahmin yapan hediyeci / hediyesiz cift, 8 atin
 *      hepsinde; odul localStorage 'tt-at-puan' farkindan okunur.
 *   C) DUSEN HEDIYE — tahmini OLMAYAN izleyicinin hediyesi (lobi / kosu /
 *      kutlama) ekranda adiyla gorunur bir karsilik uretiyor mu; sel ve seri.
 *   D) punto + kesilme + alias (?tahmin / ?bahis).
 */
const path = require('path');
const fs = require('fs');
const L = require('./lib');
const S = require('./sayfa');

const PORT = Number(process.env.PORT) || 9066;
const argv = process.argv.slice(2);
const hedef = argv.find((a) => !a.startsWith('--') && !/^\d+$/.test(a)) || 'repo';
const hedefAd = path.basename(hedef) + (process.argv.includes('--yatay') ? '-yatay' : '');
const TUR = Number(argv[argv.indexOf('--tur') + 1]) || 8;
const HIZLI = argv.includes('--hizli');
const BOLUM = process.env.AT_BOLUM || 'ABCDE';
const YATAY = argv.includes('--yatay');          // varsayilan artik DIKEY 1080x1920; --yatay: 1920x1080 + ?yatay=1
const BAK0 = YATAY ? { width: 1920, height: 1080 } : { width: 1080, height: 1920 };
const TABAN = YATAY ? 26 : 30;   // AT_BOLUM=C node at-probe.js repo  -> yalniz C

// Turkce-duyarli yasak kokler (trSade sonrasi: kucuk harf, aksansiz)
const YASAK = [
  ['bahis', /bahis/], ['bahs-', /(^|[^a-z])bahs[ie]/], ['oran', /(^|[^a-z])oran/], ['odeme', /odeme/], ['ode-', /(^|[^a-z])ode(r|di|n|y|t)/],
  ['yatir/yatan', /yatir|(^|[^a-z])yatan/], ['kumar', /kumar/], ['sans', /(^|[^a-z])sans(?!ur)/], ['kupon', /kupon/],
  ['ikramiye', /ikramiye/], ['jackpot', /jackpot/], ['iddaa', /iddaa/], ['kasa', /(^|[^a-z])kasa([^a-z]|$)/], ['katla', /katla/],
  ['oyna (bahis/para baglaminda)', /(bahs|para|puan)\w* oyna|(^|[^a-z])oynanan at/], ['kazandirir/kazanc', /kazandir|kazanc/],
];
const YUMUSAK = [['yandi (kaybedilen miza)', /yandi/], ['havuz', /havuz/], ['risk', /(^|[^a-z])risk/], ['pari', /pari.?mut/], ['bedava/para', /(^|[^a-z])para([^a-z]|$)/]];

function tara(metin) {
  const s = L.trSade(metin);
  const v = YASAK.filter(([, re]) => re.test(s)).map(([ad]) => ad);
  const y = YUMUSAK.filter(([, re]) => re.test(s)).map(([ad]) => ad);
  return { v, y };
}

const kullanici = (id, ad) => ({ id, uniqueId: id, nickname: ad || id, avatar: '', isModerator: false, isSubscriber: false, followRole: 0 });
const sohbet = (id, yazi, ad) => ({ type: 'chat', user: kullanici(id, ad), comment: yazi, ts: Date.now() });
const hediye = (id, elmas, ad, ek) => ({ type: 'gift', user: kullanici(id, ad), gift: Object.assign({ id: 5655, name: 'Gül', diamonds: elmas, emoji: '🌹', image: '', count: 1, value: elmas, streaking: false }, ek || {}), ts: Date.now() });
const begeni = (id, n) => ({ type: 'like', user: kullanici(id), likes: n, totalLikes: n, ts: Date.now() });

async function sayfaAc(tr, sorgu, bak) {
  const ctx = await tr.newContext({ viewport: bak || BAK0 });
  await ctx.addInitScript(S.KANCA);
  const p = await ctx.newPage();
  const hatalar = [];
  p.on('pageerror', (e) => hatalar.push('pageerror: ' + String(e).slice(0, 160)));
  p.on('console', (m) => { if (m.type() === 'error' && !/WebSocket|ERR_CONNECTION_REFUSED|404|Failed to load resource/.test(m.text())) hatalar.push('console: ' + m.text().slice(0, 160)); });
  await p.goto(`http://127.0.0.1:${PORT}/overlays/at.html?${sorgu}${YATAY ? '&yatay=1' : ''}`, { waitUntil: 'load' });
  await p.waitForFunction(() => window.TT && window.Spiker && document.getElementById('cagri'), null, { timeout: 8000 });
  return { ctx, p, hatalar };
}
const ates = (p, ev) => p.evaluate(S.ATES, ev);
const kosu = (p) => p.evaluate(() => Number(localStorage.getItem('tt-at-kosu') || 1));
const cagri = (p) => p.evaluate(() => document.getElementById('cagri').textContent);
/** faz: 'lobi' | 'kosu' | 'kutlama' (gorunen #cagri metninden; iki surumde de ayni cumleler) */
async function faz(p) { const c = L.trSade(await cagri(p)); return /suruyor/.test(c) ? 'kosu' : /kazandi/.test(c) ? 'kutlama' : 'lobi'; }
async function fazBekle(p, f, ms = 60000) { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (await faz(p) === f) return true; await L.bekle(60); } throw new Error('faz gelmedi: ' + f); }
const puan = (p) => p.evaluate(() => { try { return Object.fromEntries(JSON.parse(localStorage.getItem('tt-at-puan') || '[]').map(([k, o]) => [k, o.puan])); } catch { return {}; } });

(async () => {
  const kok = L.kaynak(hedef);
  console.log(`# at yarisi sondasi — hedef: ${kok}`);
  const sunucu = await L.statikSunucu(kok, PORT);
  const tr = await L.tarayici();
  const bulgular = [];
  const bulgu = (grup, metin) => { bulgular.push({ grup, metin }); console.log('  [BULGU] ' + metin); };
  const tamam = (metin) => console.log('  [tamam] ' + metin);

  // ------------------------------------------------------------------ A) kelime taramasi
  console.log(`\n## A. Kelime taramasi (${TUR} tam dongu, hizlandirilmis: tahmin 5 sn, kosu 4 sn, kutlama 3 sn)`);
  if (BOLUM.includes('A')) {
    const SORGU = 'lite=1&src=bridge&tahmin=5&bahis=5&sure=4&kutlama=3';
    const { ctx, p, hatalar } = await sayfaAc(tr, SORGU);
    const kaynaklar = new Map();    // metin -> Set(kaynak)
    const ekle = (kay, m) => { if (!m) return; if (!kaynaklar.has(m)) kaynaklar.set(m, new Set()); kaynaklar.get(m).add(kay); };
    for (let t = 0; t < TUR; t++) {
      await fazBekle(p, 'lobi');
      const k0 = await kosu(p);
      // tur cesitleri: 0 = bos (demo), 1 = tek kisi yanlis/dogru, digerleri kalabalik + hediyeler
      if (t % 4 !== 0) {
        const n = t % 4 === 1 ? 1 : t % 4 === 2 ? 9 : 40;       // kademe duyurulari icin 40
        for (let i = 0; i < n; i++) await ates(p, sohbet(`iz${t}_${i}`, i % 3 === 0 ? ['şimşek', 'poyraz', 'fırtına', 'karayel', 'bozkır', 'sedef', 'duman', 'rüzgar'][i % 8] : String(1 + (i % 8)), `Izleyici${t}x${i}`));
        await ates(p, sohbet(`iz${t}_0`, '3', `Izleyici${t}x0`));                 // tahmin degistirme
        await ates(p, hediye(`iz${t}_0`, 1, `Izleyici${t}x0`));                    // tahmini olan, lobi
        await ates(p, hediye(`yok${t}`, 30, `Tahminsiz${t}`));                     // tahmini olmayan, lobi
        await ates(p, hediye(`iz${t}_1`, 1200, `Izleyici${t}x1`));
        await ates(p, sohbet(`laf${t}`, 'selam naber', `Lafci${t}`));              // gecersiz mesaj (ilk temas)
      }
      await fazBekle(p, 'kosu');
      for (let i = 0; i < 6; i++) { await ates(p, sohbet(`iz${t}_${i}`, 'hadiii', `Izleyici${t}x${i}`)); await ates(p, begeni(`iz${t}_${i}`, 15)); }
      await ates(p, hediye(`iz${t}_2`, 5, `Izleyici${t}x2`));
      await ates(p, hediye(`yokk${t}`, 100, `KosuTahminsiz${t}`));
      await ates(p, sohbet(`gec${t}`, '4', `GecGelen${t}`));                        // kosuda ilk temas
      for (let i = 0; i < 14; i++) await ates(p, sohbet(`iz${t}_3`, 'bas bas', `Izleyici${t}x3`));   // tribun cosku esigi
      await fazBekle(p, 'kutlama');
      await ates(p, hediye(`yokq${t}`, 10, `KutlamaTahminsiz${t}`));
      await ates(p, sohbet(`kut${t}`, '2', `KutlamaGelen${t}`));
      await L.bekle(1200);
      for (const s of await p.evaluate(S.SOZDE)) ekle('css ' + s.nerede, s.metin);
      const t0 = Date.now();
      while (await kosu(p) === k0 && Date.now() - t0 < 20000) await L.bekle(80);
    }
    const D = await p.evaluate(() => ({ metinler: [...window.__D.metinler], spiker: window.__D.spiker.map((s) => s.metin), soyle: window.__D.soyle.map((s) => s.metin), uyanis: window.__D.uyanis, kart: window.__D.kart, ulti: window.__D.ulti, sesler: window.__D.sesler, hatalar: window.__D.hatalar }));
    for (const m of D.metinler) ekle('ekran', m);
    for (const m of D.spiker) ekle('spiker', m);
    for (const m of D.soyle) ekle('sohbet botu (TT.soyle)', m);
    for (const u of D.uyanis) for (const [k, v] of Object.entries(u)) ekle('uyanis.' + k, Array.isArray(v) ? v.join(' ') : String(v));
    for (const k of D.kart) { ekle('kazanan karti', k.isim); ekle('kazanan karti alt', k.alt); }
    for (const u of D.ulti) ekle('ULTI bandi', u.ad);
    for (const s of await p.evaluate(S.SOZDE)) ekle('css ' + s.nerede, s.metin);
    // izleyici adlarini (bizim enjekte ettiklerimiz) kelime sayma
    const vurus = [], yumusak = [];
    for (const [m, ks] of kaynaklar) {
      const temiz = m.replace(/(Izleyici|Tahminsiz|KosuTahminsiz|KutlamaTahminsiz|Lafci|GecGelen|KutlamaGelen)\d+(x\d+)?/g, '');
      const r = tara(temiz);
      if (r.v.length) vurus.push({ m, k: [...ks], v: r.v });
      else if (r.y.length) yumusak.push({ m, k: [...ks], v: r.y });
    }
    console.log(`  taranan farkli metin: ${kaynaklar.size}  (spiker ${D.spiker.length} satir, sohbet botu ${D.soyle.length}, kazanan karti ${D.kart.length}, ULTI ${D.ulti.length})`);
    if (vurus.length) { bulgu('kelime', `${vurus.length} gorunen metinde bahis/sans sozcugu:`); for (const v of vurus.slice(0, 40)) console.log(`       [${v.v.join(',')}] "${v.m.slice(0, 90)}"  <- ${v.k.join(', ')}`); }
    else tamam('yasak kok yok (bahis, bahs-, oran, odeme, ode-, yatir, kumar, sans, kupon, ikramiye, kasa, katla, kazanc)');
    if (yumusak.length) { console.log(`  [not  ] ${yumusak.length} metinde tartismali sozcuk:`); for (const v of yumusak.slice(0, 12)) console.log(`       [${v.v.join(',')}] "${v.m.slice(0, 90)}"  <- ${v.k.join(', ')}`); }
    console.log('  sohbet botu metinleri: ' + JSON.stringify([...new Set(D.soyle.map((s) => s.replace(/@\S+/g, '@…').replace(/\+\d+ kişi/, '+N kişi')))].slice(0, 6)));
    console.log('  ULTI bandinda gorulen kademe adlari: ' + JSON.stringify([...new Set(D.ulti.map((u) => u.ad))]));
    // Finis.kart zafer sesini kendi caliyor: ayni anda ikinci "bitis/zafer" sesi var mi
    const cift = D.kart.filter((k) => D.sesler.filter((s) => /bitis|zafer|kazan/.test(s.ad) && Math.abs(s.t - k.t) < 600).length > 1).length;
    if (cift) bulgu('ses', `${cift} kazanan kartinda zafer sesi CIFT caliniyor`); else tamam('kazanan kartinda zafer sesi tek (Finis.kart)');
    const tumHata = [...hatalar, ...D.hatalar];
    if (tumHata.length) bulgu('hata', 'sayfa hatasi: ' + tumHata.slice(0, 4).join(' | ')); else tamam('sayfa/console hatasi yok');
    L.yaz(`at-${hedefAd}-metinler.json`, [...kaynaklar].map(([m, k]) => ({ m, k: [...k] })));

    // D) punto + kesilme, uzun adlarla, her fazda
    console.log('\n## D. Punto (<26px) ve kesilme — 3/12/20/28 karakterlik adlar');
    const ADLAR = ['Ali', 'mehmet_yilmz', 'cok_uzun_kullanici_ad', 'İstanbulluGüzelÇiçekŞöğüt2026'];
    await fazBekle(p, 'lobi');
    for (let i = 0; i < ADLAR.length; i++) { await ates(p, sohbet('uz' + i, String(i + 1), ADLAR[i])); await L.bekle(150); }
    for (let h = 0; h < 8; h++) await ates(p, sohbet('uzh' + h, String(h + 1), ADLAR[h % 4] + h));
    await ates(p, hediye('uz3', 50, ADLAR[3]));
    const olc = {};
    const olcum = async (ad) => {
      const pu = await p.evaluate(S.PUNTO, TABAN); const ke = await p.evaluate(S.KESIK);
      olc[ad] = { pu, ke };
      await p.screenshot({ path: path.join(L.CIKTI, `at-${hedefAd}-${ad}.png`) });
    };
    await L.bekle(500); await olcum('lobi');
    await fazBekle(p, 'kosu'); await ates(p, hediye('uz3', 50, ADLAR[3])); await L.bekle(700); await olcum('kosu');
    await fazBekle(p, 'kutlama'); await L.bekle(1500); await olcum('kutlama');
    const kp = new Map(), kk = new Map();
    for (const [f, o] of Object.entries(olc)) { for (const x of o.pu.kotu) kp.set(x.sec + '|' + x.px, Object.assign({ f }, x)); for (const x of o.ke) kk.set(x.sec, Object.assign({ f }, x)); }
    if (kp.size) { bulgu('punto', `${kp.size} yerde ${TABAN}px altinda metin:`); for (const x of [...kp.values()].slice(0, 14)) console.log(`       ${x.px}px "${x.metin}"  ${x.sec}  (${x.f})`); } else tamam(TABAN + 'px altinda metin yok (lobi/kosu/kutlama)');
    if (kk.size) { console.log(`  [not  ] ${kk.size} yerde metin kesiliyor:`); for (const x of [...kk.values()].slice(0, 14)) console.log(`       ${x.tur} +${x.tasan}px "${x.metin}"  ${x.sec}  (${x.f})`); } else tamam('kesilen metin yok');
    // telefon olcegi goruntusu (1920 -> 390)
    for (const f of ['lobi', 'kosu', 'kutlama']) await L.telefon(tr, path.join(L.CIKTI, `at-${hedefAd}-${f}.png`), path.join(L.CIKTI, `at-${hedefAd}-${f}-telefon.png`));
    console.log(`  ekran goruntuleri: ${L.CIKTI}/at-${hedefAd}-{lobi,kosu,kutlama}[-telefon].png`);
    await ctx.close();
  }

  // ------------------------------------------------------------------ B) odul esitligi
  console.log('\n## B. Odul esitligi: ayni tahmin, hediyeli vs hediyesiz (8 atin her birinde bir cift)');
  if (BOLUM.includes('B')) {
    const { ctx, p } = await sayfaAc(tr, 'lite=1&src=bridge&tahmin=5&bahis=5&sure=3&kutlama=2');
    const N = HIZLI ? 2 : 4;
    let esit = 0, farkli = 0; const ornek = [];
    for (let t = 0; t < N; t++) {
      await fazBekle(p, 'lobi');
      const k0 = await kosu(p);
      const once = await puan(p);
      for (let h = 0; h < 8; h++) {
        await ates(p, sohbet(`hed${h}`, String(h + 1), `Hediyeci${h}`));
        await ates(p, sohbet(`duz${h}`, String(h + 1), `Hediyesiz${h}`));
      }
      for (let h = 0; h < 8; h++) for (let j = 0; j < 3; j++) await ates(p, hediye(`hed${h}`, j === 2 ? 1000 : 5, `Hediyeci${h}`));
      await fazBekle(p, 'kosu');
      for (let h = 0; h < 8; h++) await ates(p, hediye(`hed${h}`, 100, `Hediyeci${h}`));      // her ata esit tezahurat
      const t0 = Date.now();
      while (await kosu(p) === k0 && Date.now() - t0 < 30000) await L.bekle(80);
      const sonra = await puan(p);
      for (let h = 0; h < 8; h++) {
        const a = (sonra[`hed${h}`] || 0) - (once[`hed${h}`] || 0), b = (sonra[`duz${h}`] || 0) - (once[`duz${h}`] || 0);
        if (a || b) { ornek.push(`kosu ${t + 1} at ${h + 1}: hediyeli +${a} / hediyesiz +${b}`); if (a === b) esit++; else farkli++; }
      }
    }
    console.log('    ' + ornek.join('\n    '));
    if (!esit && !farkli) bulgu('odul', 'hic odul gozlenemedi (sonda kor) — elle bak');
    else if (farkli) bulgu('odul', `hediye odulu DEGISTIRIYOR: ${farkli}/${esit + farkli} kosuda hediyeli izleyici farkli puan aldi`);
    else tamam(`hediye odulu degistirmiyor (${esit}/${esit} kosuda esit)`);
    await ctx.close();
  }

  // ------------------------------------------------------------------ C) dusen hediye
  console.log('\n## C. Dusen hediye: tahmini OLMAYAN izleyicinin hediyesi ekranda adiyla karsilik buluyor mu');
  if (BOLUM.includes('C')) {
    const { ctx, p } = await sayfaAc(tr, 'lite=1&src=bridge&tahmin=9&bahis=9&sure=7&kutlama=6');
    /** ad ekranda (gorunur bir elemanda) cikti mi; ciktiysa punto ve sure */
    const gorunduMu = (ad, ms) => p.evaluate(([ad, ms]) => new Promise((coz) => {
      const t0 = performance.now(); let ilk = null, enBuyuk = 0, son = null, nerede = '';
      const bak = () => {
        let var_ = false;
        const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
        for (let n = w.nextNode(); n; n = w.nextNode()) {
          if (!n.nodeValue.includes(ad)) continue;
          const el = n.parentElement; const r = el.getBoundingClientRect();
          let op = 1, gizli = false;
          for (let e = el; e; e = e.parentElement) { const c = getComputedStyle(e); op *= Number(c.opacity); if (c.display === 'none' || c.visibility === 'hidden') gizli = true; }
          if (gizli || op < 0.3 || r.width < 2 || r.height < 2) continue;
          var_ = true;
          const px = parseFloat(getComputedStyle(el).fontSize);
          if (px > enBuyuk) { enBuyuk = px; nerede = (el.closest('[id]') || el).id || el.className; }
        }
        const t = performance.now() - t0;
        if (var_) { if (ilk == null) ilk = t; son = t; }
        if (t < ms) setTimeout(bak, 50); else coz({ gorundu: ilk != null, ilkMs: ilk && Math.round(ilk), sureMs: ilk != null ? Math.round(son - ilk) : 0, px: enBuyuk, nerede });
      };
      bak();
    }), [ad, ms]);
    const dene = async (fazAd, ad, id, hazirlik) => {
      await fazBekle(p, fazAd);
      await L.bekle(400);
      if (hazirlik) await hazirlik();
      const g = gorunduMu(ad, 3500);
      await ates(p, hediye(id, 30, ad));
      const r = await g;
      if (!r.gorundu) bulgu('hediye', `${fazAd}: tahmini olmayan "${ad}" hediye gonderdi -> ekranda adi HIC cikmadi (hediye sessizce dustu)`);
      else if (r.px < TABAN) bulgu('hediye', `${fazAd}: "${ad}" icin karsilik var ama adi ${r.px}px (<26px) — telefonda okunmaz  [${r.nerede}]`);
      else tamam(`${fazAd}: "${ad}" hediyesi ${r.ilkMs} ms de ekranda, ${r.px}px, ${r.sureMs} ms gorundu  [${r.nerede}]`);
      return r;
    };
    await dene('lobi', 'LobiHediyeci', 'c_lobi');
    await dene('kosu', 'KosuHediyeci', 'c_kosu');
    await dene('kutlama', 'KutlamaHediyeci', 'c_kut');
    // tahmini OLAN izleyici, lobi
    await fazBekle(p, 'lobi'); await ates(p, sohbet('c_var', '3', 'TahminliHediyeci')); await L.bekle(3600);
    await dene('lobi', 'TahminliHediyeci', 'c_var');

    // sel: 1 saniyede 12 farkli kisiden hediye (lobi)
    await fazBekle(p, 'kutlama'); await fazBekle(p, 'lobi'); await L.bekle(300);
    const selAd = Array.from({ length: 12 }, (_, i) => `Sel${String.fromCharCode(65 + i)}kisi`);
    const gorulen = p.evaluate(([adlar, ms]) => new Promise((coz) => {
      const g = new Set(); const t0 = performance.now();
      const bak = () => { const m = document.body.innerText; for (const a of adlar) if (m.includes(a)) g.add(a); if (performance.now() - t0 < ms) setTimeout(bak, 60); else coz([...g]); };
      bak();
    }), [selAd, 16000]);
    for (let i = 0; i < 12; i++) { await ates(p, hediye('sel' + i, i === 11 ? 5000 : 5, selAd[i])); await L.bekle(80); }
    const g = await gorulen;
    const buyukGorundu = g.includes(selAd[11]);
    console.log(`  [${g.length === 12 ? 'tamam' : 'not  '}] hediye seli: 1 sn de 12 kisiden hediye -> 16 sn icinde ${g.length}/12 kisinin adi ekranda gorundu` + (g.length < 12 ? `  (gorunmeyen: ${selAd.filter((a) => !g.includes(a)).join(', ')})` : ''));
    if (!buyukGorundu) bulgu('hediye', 'hediye selinde EN BUYUK hediyeyi (5000 elmas) gonderenin adi hic gorunmedi');
    else tamam('seldeki en buyuk hediye (5000 elmas) gorundu');

    // sel-2: EN BUYUK hediye ONCE gelir, ardindan 11 kucuk hediye (kuyruk "eskiyi at" yaparsa buyuk bagisci duser)
    await fazBekle(p, 'kutlama'); await fazBekle(p, 'lobi'); await L.bekle(300);
    const buyukGor = p.evaluate(([ad, ms]) => new Promise((coz) => { const t0 = performance.now(); let g = false; const bak = () => { const b = document.getElementById('ulti-bant'); if (b && b.classList.contains('gorunur') && b.innerText.includes(ad)) g = true; if (g || performance.now() - t0 > ms) coz(g); else setTimeout(bak, 50); }; bak(); }), ['BuyukBagisci', 18000]);
    await ates(p, hediye('ilkk', 1, 'IlkKucuk')); await L.bekle(60);
    await ates(p, hediye('buyukb', 5000, 'BuyukBagisci'));
    for (let i = 0; i < 11; i++) { await L.bekle(80); await ates(p, hediye('kck' + i, 1, 'Kucuk' + i)); }
    if (await buyukGor) tamam('sel-2: 5000 elmaslik hediye once gelip ardindan 11 kucuk hediye gelince de BANTTA gorundu');
    else bulgu('hediye', 'sel-2: 5000 elmaslik hediye, ardindan gelen 11 kucuk hediye yuzunden tesekkur bandina HIC cikmadi (kuyruk en eskiyi atiyor, degere bakmiyor)');

    // bant geometrisi: kosu sirasinda kulvarlari kapatiyor mu; ad mi buyuk etiket mi
    await fazBekle(p, 'kutlama'); await fazBekle(p, 'kosu'); await L.bekle(300);
    await ates(p, hediye('geo', 30, 'GeometriHediyeci')); await L.bekle(600);
    const geo = await p.evaluate(() => {
      const b = document.getElementById('ulti-bant'); if (!b || !b.classList.contains('gorunur')) return null;
      const r = b.getBoundingClientRect(), s = document.getElementById('sahaKutu').getBoundingClientRect();
      const kesisim = Math.max(0, Math.min(r.bottom, s.bottom) - Math.max(r.top, s.top));
      const adEl = [...b.querySelectorAll('*')].filter((e) => e.children.length === 0 && e.textContent.includes('GeometriHediyeci'))[0];
      const px = (e) => (e ? parseFloat(getComputedStyle(e).fontSize) : 0);
      const enBuyukDiger = Math.max(...[...b.querySelectorAll('*')].filter((e) => e.children.length === 0 && e.textContent.trim() && !e.textContent.includes('GeometriHediyeci') && /[A-Za-zÇĞİÖŞÜçğıöşü]/.test(e.textContent)).map(px), 0);
      return { kulvarKapanan: Math.round(kesisim), kulvarYuzde: Math.round(100 * kesisim / s.height), adPx: px(adEl), digerPx: enBuyukDiger, metin: b.innerText.replace(/\n/g, ' / ') };
    });
    if (!geo) console.log('  [not  ] kosuda hediye bandi gorunmuyor (bant kullanilmiyor olabilir)');
    else {
      console.log(`  [not  ] kosuda bant: "${geo.metin}"  ad ${geo.adPx}px, bantdaki diger en iri yazi ${geo.digerPx}px, kulvar alaninin %${geo.kulvarYuzde} i kapali`);
      if (geo.kulvarYuzde > 5) bulgu('bant', `kosu sirasinda tesekkur bandi kulvar alaninin %${geo.kulvarYuzde} ini (${geo.kulvarKapanan}px) kapatiyor`); else tamam('kosuda bant kulvarlari kapatmiyor');
      if (geo.adPx < geo.digerPx) bulgu('bant', `bantta izleyici adi (${geo.adPx}px) etiketten (${geo.digerPx}px) KUCUK — ad en iri metin olmali`); else tamam('bantta en iri metin izleyicinin adi');
    }

    // seri (combo) hediye: 10 ara olay (streaking:true) + 1 bitis
    await fazBekle(p, 'kutlama'); await fazBekle(p, 'lobi'); await L.bekle(4500);
    const u0 = await p.evaluate(() => ({ u: window.__D.ulti.length, s: window.__D.spiker.length }));
    for (let i = 1; i <= 10; i++) { await ates(p, hediye('seri', i, 'SeriHediyeci', { count: i, value: i, streaking: true })); await L.bekle(60); }
    await ates(p, hediye('seri', 11, 'SeriHediyeci', { count: 11, value: 11, streaking: false }));
    await L.bekle(300);
    const u1 = await p.evaluate(() => ({ u: window.__D.ulti.length, s: window.__D.spiker.filter((x) => x.metin.includes('SeriHediyeci')).length }));
    const bantSay = u1.u - u0.u;
    if (bantSay > 2) bulgu('hediye', `seri hediye (parmak basili tek gul serisi: 10 ara olay + bitis) ${bantSay} ayri ULTI bandi kuyruga atiyor — tek hediye icin ~${Math.min(bantSay, 6) * 1.9 | 0} sn ekran ortasi kapanir`);
    else console.log(`  [tamam] seri hediye: ${bantSay} bant, ${u1.s} spiker satiri`);
    await ctx.close();
  }

  // ------------------------------------------------------------------ alias
  console.log('\n## E. Parametre takma adi: ?tahmin= ve eski ?bahis=');
  for (const [param, sn] of BOLUM.includes('E') ? [['tahmin', 40], ['bahis', 40]] : []) {
    const { ctx, p } = await sayfaAc(tr, `lite=1&src=bridge&${param}=${sn}`);
    await L.bekle(400);
    const g = await p.evaluate(() => Number(document.getElementById('geriSn').textContent));
    if (g >= sn - 2 && g <= sn) tamam(`?${param}=${sn} -> geri sayim ${g}`);
    else if (param === 'bahis') bulgu('alias', `?bahis=${sn} calismiyor (geri sayim ${g}) — eski OBS linkleri bozulur`);
    else bulgu('alias', `?tahmin=${sn} taninmiyor (geri sayim ${g})`);
    await ctx.close();
  }

  await tr.close(); sunucu.close();
  console.log(`\n# OZET (${hedefAd}): ${bulgular.length} bulgu`);
  const g = {};
  for (const b of bulgular) (g[b.grup] = g[b.grup] || []).push(b.metin);
  for (const [k, l] of Object.entries(g)) console.log(`  ${k}: ` + l.join(' || '));
  L.yaz(`at-${hedefAd}-bulgular.json`, bulgular);
  process.exit(bulgular.length ? 1 : 0);
})().catch((e) => { console.error('SONDA HATASI:', e); process.exit(2); });
