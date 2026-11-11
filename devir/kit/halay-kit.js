'use strict';
/**
 * halay-kit.js [repo|yol] [--hizli] [test ...]
 *
 * Halay inceleme harness'i (port 9067, depoyu statik sunar, sayfa-ici olay
 * enjeksiyonu: TT.fire). Testler:
 *   ekran    telefon olcekli (390 px) goruntuler: bos oda, 12 kisi, 60 kisi,
 *            davet bekliyor, duet, hediye basi, gecenin yildizi karti
 *   punto    her anda 26px alti metin
 *   kesme    3/12/20/28 karakterlik adlar: sirada, halay basi, davet eden/edilen, yildiz
 *   davet    @isim ve numara ile davet; kabul; zaman asimi (15 sn); kisi basi
 *            bekleme; hedef bekleme; kuyruk siniri (en cok 5)
 *   hediye   hediye -> halay basi, kademeli sure, kuyruk; sirada olmayanin hediyesi
 *   etki     her mesaj/begeni O izleyicinin danscisinda gorunur etki (tuval farki)
 *   bellek   iki tam sarki: DOM dugumu / dinleyici / JS heap buyumesi
 *   kare     60 dansciyla kare suresi (normal + 4x CPU kisma)
 *   merkez   oyun.html yalnizca TUR SINIRINDA degistiriyor; varsayilan dizilim ayni
 *   lite     transform/opacity disi animasyon, metinde sonsuz scale animasyonu
 *   kelime   bahis/sans sozcugu; Finis.kart + zafer sesi tek
 * window.Halay.ozet() (salt okunur) varsa kullanilir; yoksa yalnizca DOM'dan olcer.
 */
const path = require('path');
const fs = require('fs');
const L = require('./lib');
const S = require('./sayfa');

const PORT = Number(process.env.PORT) || 9067;
const Q3 = 'kalite=dusuk&kilit=1';   // mantik testleri dusuk kademede (SwiftShader'da tam kademe 80 ms/kare)
const argv = process.argv.slice(2);
const HIZLI = argv.includes('--hizli');
const konum = argv.filter((a) => !a.startsWith('--'));
const hedef = konum[0] && !/^(ekran|punto|kesme|davet|hediye|etki|bellek|kare|merkez|lite|kelime|geri)$/.test(konum[0]) ? konum[0] : 'repo';
const secili = konum.filter((a) => /^(ekran|punto|kesme|davet|hediye|etki|bellek|kare|merkez|lite|kelime|geri)$/.test(a));
const calis = (ad) => !secili.length || secili.includes(ad);
const hedefAd = path.basename(hedef);

const U = (id, ad) => ({ id, uniqueId: id, nickname: ad || id, avatar: '', isModerator: false, isSubscriber: false, followRole: 0 });
const chat = (id, yazi, ad) => ({ type: 'chat', user: U(id, ad), comment: yazi, ts: Date.now() });
const like = (id, n, ad) => ({ type: 'like', user: U(id, ad), likes: n, totalLikes: n, ts: Date.now() });
const gift = (id, elmas, ad, ek) => ({ type: 'gift', user: U(id, ad), gift: Object.assign({ id: 5655, name: 'Gül', diamonds: elmas, emoji: '🌹', image: '', count: 1, value: elmas, streaking: false }, ek || {}), ts: Date.now() });

const sonuc = [];
const yaz = (tur, test, metin) => { sonuc.push({ tur, test, metin }); console.log(`  [${tur}] ${metin}`); };
const KALDI = (t, m) => yaz('KALDI', t, m), GECTI = (t, m) => yaz('GECTI', t, m), NOT = (t, m) => yaz('not  ', t, m);

let tr, kok;
async function ac(sorgu, o = {}) {
  const ctx = await tr.newContext({ viewport: o.bak || { width: 1080, height: 1920 } });
  await ctx.addInitScript(S.KANCA); await ctx.addInitScript(S.TUVAL_KANCA);
  const p = await ctx.newPage();
  const hata = [];
  p.on('pageerror', (e) => hata.push('pageerror: ' + String(e.stack || e).split('\n').slice(0, 2).join(' @ ').slice(0, 200)));
  p.on('console', (m) => { if (m.type() === 'error' && !/WebSocket|Failed to load resource|ERR_CONNECTION/.test(m.text())) hata.push('console: ' + m.text().slice(0, 160)); });
  await p.goto(`http://127.0.0.1:${PORT}/overlays/${o.sayfa || 'halay.html'}?${sorgu}${o.sayfa || /kalite=|3d=0/.test(sorgu) ? '' : '&' + Q3}`, { waitUntil: 'load' });
  if (!o.sayfa) await p.waitForFunction(() => window.TT && document.getElementById('kok'), null, { timeout: 8000 });
  return { ctx, p, hata };
}
const at = (p, ev) => p.evaluate(S.ATES, ev);
const oz = (p) => p.evaluate(() => (window.Halay && window.Halay.ozet ? window.Halay.ozet() : null));
const metin = (p) => p.evaluate(() => document.body.innerText.replace(/\n/g, '') + '\n' + document.body.innerText + '\n' + (window.__T2 ? [...window.__T2.hepsi].join('\n') + '\n' + window.__T2.kayit.slice(-4000).map((k) => k.metin).join('') : ''));
const spiker = (p) => p.evaluate(() => window.__D.spiker.map((s) => s.metin));
async function cek(p, ad) {
  const y = path.join(L.CIKTI, `halay-${ad}.png`);
  await p.screenshot({ path: y });
  await L.telefon(tr, y, path.join(L.CIKTI, `halay-${ad}-telefon.png`));
  return y;
}
async function olc(p, an, test) {
  const pu = await p.evaluate(S.PUNTO, 30), ke = await p.evaluate(S.KESIK), ta = await p.evaluate(S.TASMA), gv = await p.evaluate(S.GUVENLI), tp = await p.evaluate(S.TUVAL_PUNTO, 30);
  if (gv.dom.length || gv.tuval.length) KALDI(test, `${an}: yasak bolgede metin: ` + [...gv.dom, ...gv.tuval].slice(0, 4).map((x) => `"${x.metin}" ${x.sec || ''} [${x.kutu}] ${x.neden}`).join(' ; '));
  if (tp.kotu.filter((k) => k.bagli).length) KALDI(test, `${an}: tuvalde 30px alti metin: ` + tp.kotu.filter((k) => k.bagli).slice(0, 4).map((k) => `${k.px}px "${k.metin}"`).join(' ; '));
  if (pu.kotu.length) KALDI(test, `${an}: ${pu.kotu.length} metin 30px altinda: ` + pu.kotu.slice(0, 6).map((k) => `${k.px}px "${k.metin}" ${k.sec}`).join(' ; '));
  else GECTI(test, `${an}: 30px altinda metin yok, yasak bolge temiz (${pu.toplam} metin dugumu)`);
  if (ke.length) NOT(test, `${an}: kesilen metin ${ke.length}: ` + ke.slice(0, 6).map((k) => `${k.tur} +${k.tasan}px "${k.metin}" ${k.sec}`).join(' ; '));
  if (ta.bozukMetin.length) KALDI(test, `${an}: bozuk metin ${JSON.stringify(ta.bozukMetin.slice(0, 3))}`);
  if (ta.kokIcTasma || ta.kokEkranDisi || ta.tasanlar.length) KALDI(test, `${an}: #kok tasmasi ${JSON.stringify(ta.kok)} ` + ta.tasanlar.slice(0, 4).map((t) => `${t.sec}+${t.tas}px`).join(' '));
  return { pu, ke };
}
const ADLAR = ['Ali', 'mehmet_yilmz', 'cok_uzun_kullanici_ad', 'İstanbulluGüzelÇiçekŞöğüt2026'];
async function doldur(p, n, onEk = 'k') { for (let i = 0; i < n; i++) { await at(p, i % 3 === 2 ? like(onEk + i, 5, 'Kisi' + onEk + i) : chat(onEk + i, 'selam', 'Kisi' + onEk + i)); if (i % 10 === 9) await L.bekle(60); } }

const TESTLER = {
  // ------------------------------------------------------------------ ekran + punto + kesme
  async ekran() {
    console.log('\n## ekran / punto / kesme — sabit anlarda telefon olcekli goruntu + olcum');
    const { ctx, p, hata } = await ac('lite=1&src=bridge&sure=75&kutlama=8&kabul=15');
    await L.bekle(3000); await cek(p, '1-bos-oda'); await olc(p, 'bos oda (demo)', 'punto');
    for (let i = 0; i < ADLAR.length; i++) await at(p, chat('uz' + i, 'merhaba', ADLAR[i]));
    await doldur(p, 8); await L.bekle(2500); await cek(p, '2-12-kisi'); await olc(p, '12 kisi', 'punto');
    const m12 = await metin(p);
    for (const a of ADLAR) { if (m12.includes(a)) GECTI('kesme', `sirada "${a}" (${[...a].length} krk) tam gorunuyor`); else KALDI('kesme', `sirada "${a}" (${[...a].length} krk) ekranda TAM olarak yok (kesilmis ya da hic yazilmamis)`); }
    // davet: uzun ad uzun adi kaldiriyor
    await at(p, chat('uz3', '@cok_uzun_kullanici_ad', ADLAR[3])); await L.bekle(1500); await cek(p, '3-davet-bekliyor'); await olc(p, 'davet bekliyor (28 krk -> 20 krk)', 'punto');
    await at(p, chat('uz2', 'geldim', ADLAR[2])); await L.bekle(2000); await cek(p, '4-duet'); await olc(p, 'duet', 'punto');
    await at(p, gift('uz3', 1200, ADLAR[3])); await L.bekle(2000); await cek(p, '5-hediye-basi'); await olc(p, 'hediye ile halay basi (28 krk)', 'punto');
    await doldur(p, 138, 'd'); await L.bekle(4500); await cek(p, '6-150-kisi'); await olc(p, '150 kisi', 'punto');
    const o = await oz(p); if (o) NOT('ekran', `150 kisi: ozet n=${o.n}, gorunen=${o.sira.filter((s) => s.gorunur).length}, cosku=${o.cosku}, seviye=${o.seviye}`);
    // yildiz: en uzun ad en cok katilan olsun
    for (let i = 0; i < 40; i++) { await at(p, chat('uz3', 'hop ' + i, ADLAR[3])); await L.bekle(1250); if (o && (await oz(p)).durum !== 'oyun') break; }
    await p.waitForFunction(() => window.__D.kart.length > 0, null, { timeout: 90000 }).catch(() => {});
    await L.bekle(1500); await cek(p, '7-gecenin-yildizi'); await olc(p, 'gecenin yildizi karti', 'punto');
    const D = await p.evaluate(() => ({ kart: window.__D.kart, ses: window.__D.sesler, soyle: window.__D.soyle }));
    if (!D.kart.length) KALDI('ekran', 'sarki sonunda Finis.kart cagrilmadi');
    else { GECTI('ekran', `sarki sonu: Finis.kart isim="${D.kart[0].isim}" alt="${D.kart[0].alt}"`);
      const zafer = D.ses.filter((s) => /bitis|zafer|kazan/.test(s.ad) && Math.abs(s.t - D.kart[0].t) < 800);
      if (zafer.length > 1) KALDI('ekran', `zafer sesi ${zafer.length} kez caliniyor (Finis.kart kendi caliyor)`); else GECTI('ekran', 'zafer sesi cift degil'); }
    if (hata.length) KALDI('ekran', 'sayfa hatasi: ' + hata.slice(0, 3).join(' | ')); else GECTI('ekran', 'sayfa hatasi yok');
    console.log(`  goruntuler: ${L.CIKTI}/halay-{1..7}-*[-telefon].png  — GOZLE BAK: telefonda adlar okunuyor mu, lejant, cosku hedefi, en cok katilan + avatar, son girenler`);
    await ctx.close();
  },

  // ------------------------------------------------------------------ davet akisi
  async davet() {
    console.log('\n## davet — @isim / numara, kabul, zaman asimi, beklemeler, kuyruk siniri');
    const KABUL = HIZLI ? 5 : 15;
    const { ctx, p } = await ac(`lite=1&src=bridge&sure=600&kabul=${KABUL}&duet=4&solo=3`);
    await L.bekle(500);
    for (const [id, ad] of [['ayse', 'Ayşe'], ['mehmet', 'Mehmet'], ['zeynep', 'Zeynep'], ['can', 'Can'], ['elif', 'Elif'], ['burak', 'Burak'], ['deniz', 'Deniz'], ['seda', 'Seda'], ['kaan', 'Kaan'], ['melis', 'Melis'], ['tolga', 'Tolga'], ['pelin', 'Pelin'], ['arda', 'Arda'], ['sude', 'Sude']]) await at(p, chat(id, 'selam', ad));
    await L.bekle(2500);
    let o = await oz(p);
    if (!o) { NOT('davet', 'window.Halay.ozet() yok — davet akisi yalnizca gorunen metinden izlenecek (zayif)'); }
    const orta = async () => { const x = await oz(p); return x ? x.orta : null; };
    const no = (kid) => { const s = o && o.sira.find((x) => x.kid === kid); return s ? s.no : null; };
    // 1) @isim ile
    await at(p, chat('ayse', '@mehmet gel', 'Ayşe')); await L.bekle(600);
    let m = await metin(p); let or = await orta();
    if (or && or.kim === 'ayse' && or.hedef === 'mehmet' && or.evre === 'davet') GECTI('davet', '@mehmet -> davet acildi (Ayşe ▸ Mehmet), ' + or.kalan + ' sn kabul penceresi'); else KALDI('davet', '@isim daveti acilmadi: orta=' + JSON.stringify(or));
    if (/Ayşe/.test(m) && /Mehmet/.test(m)) GECTI('davet', 'davet ekranda iki adla gorunuyor'); else KALDI('davet', 'davet ekranda iki adla gorunmuyor');
    if (or && Math.abs(or.kalan - KABUL) > 1.5) KALDI('davet', `kabul penceresi ${or.kalan} sn (beklenen ~${KABUL})`);
    // kabul: herhangi bir mesaj
    await at(p, chat('mehmet', 'tamam', 'Mehmet')); await L.bekle(500); or = await orta();
    if (or && or.evre !== 'davet') GECTI('davet', 'davet edilen yazinca KABUL -> evre=' + or.evre); else KALDI('davet', 'kabul calismadi: ' + JSON.stringify(or));
    // kisi basi bekleme: Ayşe hemen tekrar
    const s0 = (await spiker(p)).length;
    await L.bekle(5500); await at(p, chat('ayse', '@zeynep', 'Ayşe')); await L.bekle(500);
    let x = await oz(p); let sp = (await spiker(p)).slice(s0);
    const ayseTekrar = x && ((x.orta && x.orta.kim === 'ayse' && x.orta.hedef === 'zeynep') || x.ortaKuyruk.some((q) => q.kim === 'ayse'));
    if (ayseTekrar) KALDI('davet', 'kisi basi bekleme yok: Ayşe 6 sn sonra yine davet edebildi'); else GECTI('davet', 'kisi basi bekleme calisiyor' + (sp.some((s) => /Ayşe/.test(s) && /sn/.test(s)) ? ' ve Ayşe ye kalan sure soylendi' : ' — ANCAK Ayşe ye gorunur geri bildirim yok'));
    // hedef bekleme: Can, az once ortada olan Mehmet'i kaldirmak istiyor
    const s1 = (await spiker(p)).length;
    await at(p, chat('can', '@mehmet', 'Can')); await L.bekle(500); x = await oz(p); sp = (await spiker(p)).slice(s1);
    const canMehmet = x && ((x.orta && x.orta.kim === 'can') || x.ortaKuyruk.some((q) => q.kim === 'can' && q.hedef === 'mehmet'));
    if (canMehmet) KALDI('davet', 'hedef bekleme yok: az once ortadaki Mehmet hemen yine kaldirildi'); else GECTI('davet', 'hedef bekleme calisiyor' + (sp.some((s) => /Mehmet/.test(s)) ? ' ve sebebi soylendi' : ' — ANCAK gorunur geri bildirim yok'));
    // 2) numara ile + zaman asimi
    await L.bekle(4000);
    o = await oz(p);
    const zNo = no('zeynep');
    await at(p, chat('elif', String(zNo), 'Elif')); await L.bekle(700); or = await orta(); x = await oz(p);
    const elifZ = (or && or.kim === 'elif' && or.hedef === 'zeynep') || (x && x.ortaKuyruk.some((q) => q.kim === 'elif' && q.hedef === 'zeynep'));
    if (elifZ) GECTI('davet', `numara ile davet: Elif "${zNo}" yazdi -> Zeynep`); else KALDI('davet', `numara ile davet calismadi (Zeynep no=${zNo}): orta=${JSON.stringify(or)}`);
    // zaman asimi: Zeynep cevap vermiyor
    const t0 = Date.now(); let bitti = null;
    await p.waitForFunction(() => { const z = window.Halay.ozet().orta; return z && z.kim === 'elif' && z.evre === 'davet'; }, null, { timeout: 20000 }).catch(() => {});
    const tDavet = Date.now();
    while (Date.now() - tDavet < (KABUL + 6) * 1000) { or = await orta(); if (!or || or.kim !== 'elif' || or.evre !== 'davet') { bitti = (Date.now() - tDavet) / 1000; break; } await L.bekle(150); }
    if (bitti == null) KALDI('davet', `cevapsiz davet ${KABUL + 6} sn sonra hala acik (zaman asimi yok)`);
    else if (Math.abs(bitti - KABUL) > 2) KALDI('davet', `cevapsiz davet ${bitti.toFixed(1)} sn de kapandi (beklenen ~${KABUL})`);
    else GECTI('davet', `cevapsiz davet ${bitti.toFixed(1)} sn de zaman asimina ugradi -> sonraki: ${JSON.stringify(or)}`);
    void t0;
    // 3) kuyruk siniri: 9 farkli kisi 9 farkli hedefe ayni anda
    await L.bekle(6000);
    const cift = [['burak', 'deniz'], ['seda', 'kaan'], ['melis', 'tolga'], ['pelin', 'arda'], ['sude', 'can'], ['deniz', 'burak'], ['kaan', 'seda'], ['tolga', 'melis'], ['arda', 'pelin']];
    const s2 = (await spiker(p)).length;
    for (const [a, b] of cift) await at(p, chat(a, '@' + b, a[0].toUpperCase() + a.slice(1)));
    await L.bekle(500); x = await oz(p); sp = (await spiker(p)).slice(s2);
    const toplam = x ? (x.orta ? 1 : 0) + x.ortaKuyruk.length : null;
    if (toplam == null) NOT('davet', 'kuyruk siniri olculemedi');
    else if (toplam > 5) KALDI('davet', `kuyruk siniri asildi: sahnede+bekleyen = ${toplam} (>5)`);
    else GECTI('davet', `kuyruk siniri: 9 istekten ${toplam} tanesi alindi (<=5)` + (sp.some((s) => /dolu/.test(s)) ? ', reddedilenlere "dolu" denildi' : ' — ANCAK reddedilenlere gorunur bilgi yok'));
    // kendini davet / sirada olmayan / bilinmeyen ad
    await at(p, chat('ayse', '@ayse', 'Ayşe')); await at(p, chat('ayse', '@yokboylebiri', 'Ayşe')); await at(p, chat('ayse', '999', 'Ayşe'));
    await L.bekle(300); x = await oz(p);
    if (x && x.ortaKuyruk.some((q) => q.kim === 'ayse' && q.hedef === 'ayse')) KALDI('davet', 'kisi kendini davet edebiliyor'); else GECTI('davet', 'kendini / olmayan adi / gecersiz numarayi davet etmek kuyruga girmiyor');
    await ctx.close();
  },

  // ------------------------------------------------------------------ hediye
  async hediye() {
    console.log('\n## hediye — halay basi sirasi, kademeli sure, kuyruk, sirada olmayanin hediyesi, seri');
    const { ctx, p } = await ac('lite=1&src=bridge&sure=600');
    await doldur(p, 10); await L.bekle(2000);
    // kucuk hediye (<10) = TEMPO: cosku +8, en cok 3 / 20 sn, ad gorunur, halay basi SIRASI ALMAZ
    let o = await oz(p); const c0 = o ? o.cosku : 0;
    await at(p, gift('tempo1', 5, 'TempoHediye')); await L.bekle(500);
    o = await oz(p); let m = await metin(p);
    if (/TempoHediye/.test(m)) GECTI('hediye', 'kucuk hediye (5): gonderenin adi ekranda'); else KALDI('hediye', 'kucuk hediye (5): gonderenin adi ekranda yok');
    if (o) { (o.cosku - c0 >= 5 ? GECTI : KALDI)('hediye', `TEMPO: cosku ${c0} -> ${o.cosku}`); (!o.hediyeBas || o.hediyeBas.kid !== 'tempo1' ? GECTI : KALDI)('hediye', 'kucuk hediye halay basi sirasi almiyor'); }
    for (let i = 0; i < 5; i++) await at(p, gift('tempo' + (2 + i), 5, 'TempoHediye' + i));
    await L.bekle(300); const o2 = await oz(p);
    if (o && o2) (o2.cosku - c0 <= 8 * 3 + 6 ? GECTI : KALDI)('hediye', `TEMPO siniri: 6 kucuk hediye sonrasi cosku ${c0} -> ${o2.cosku} (en cok +24 bekleniyor)`);
    await at(p, gift('zengin', 30, 'KucukHediye')); await L.bekle(400);
    o = await oz(p); m = await metin(p);
    if (/KucukHediye/.test(m)) GECTI('hediye', 'sirada OLMAYAN izleyicinin hediyesi: adi ekranda'); else KALDI('hediye', 'sirada olmayan izleyicinin hediyesi ekranda adiyla gorunmuyor (sessiz dusuyor)');
    if (o) { if (o.hediyeBas && o.hediyeBas.kid === 'zengin') GECTI('hediye', `hediye (30) -> hemen halay basi, sure ${o.hediyeBas.sure}`); else KALDI('hediye', 'hediye veren halay basi olmadi: ' + JSON.stringify(o.hediyeBas)); }
    await at(p, gift('orta', 150, 'OrtaHediye')); await at(p, gift('buyuk', 5000, 'BuyukHediye')); await L.bekle(600);
    o = await oz(p); m = await metin(p);
    if (o && 'meydan' in o) NOT('hediye', '5000 elmas: meydan=' + JSON.stringify(o.meydan) + ' ; ekranda MEYDAN: ' + /MEYDAN/.test(m));
    if (o) { NOT('hediye', `kuyruk: su an ${JSON.stringify(o.hediyeBas)}, bekleyen ${JSON.stringify(o.basKuyruk)}`);
      const sureler = [o.hediyeBas && o.hediyeBas.sure, ...o.basKuyruk.map((b) => b.sure)].filter(Boolean);
      if (new Set(sureler).size >= 2) GECTI('hediye', 'sure kademeye gore degisiyor: ' + sureler.join(' / ')); else KALDI('hediye', 'sure kademeye gore degismiyor: ' + sureler.join(' / '));
      if (o.basKuyruk.length >= 2 || (o.basKuyruk.length === 1 && o.hediyeBas)) GECTI('hediye', 'sonraki hediyeler kuyruga girdi (ezmiyor)'); else KALDI('hediye', 'ikinci/ucuncu hediye kuyruga girmedi'); }
    // sel: 20 hediye
    for (let i = 0; i < 20; i++) await at(p, gift('sel' + i, 20, 'SelHediye' + i));
    await L.bekle(300); o = await oz(p);
    if (o) NOT('hediye', `20 hediyelik sel: kuyruk uzunlugu ${o.basKuyruk.length}; toplam bekleme ~${Math.round(o.basKuyruk.reduce((a, b) => a + (b.sure > 1000 ? b.sure / 1000 : b.sure), 0))} sn — sinir var mi, dusenlere ne oluyor KOD OKUYARAK bak`);
    // seri hediye
    const u0 = o ? o.basKuyruk.length : 0;
    for (let i = 1; i <= 10; i++) await at(p, gift('seri', i, 'SeriHediye', { count: i, value: i, streaking: true }));
    await at(p, gift('seri', 110, 'SeriHediye', { count: 11, value: 110, streaking: false })); await L.bekle(300);
    o = await oz(p);
    if (o) { const n = o.basKuyruk.filter((b) => b.kid === 'seri').length + (o.hediyeBas && o.hediyeBas.kid === 'seri' ? 1 : 0); if (n > 1) KALDI('hediye', `seri hediye ${n} ayri sira aliyor`); else GECTI('hediye', 'seri hediye tek sayiliyor (kuyruk ' + u0 + ' -> ' + o.basKuyruk.length + ')'); }
    await ctx.close();
  },

  // ------------------------------------------------------------------ kisiye ozel etki (tuval)
  async etki() {
    console.log('\n## etki — her mesaj/begeni O izleyicinin kendi figurunde hareket (cekirdek cagrilari sayilir)');
    const { ctx, p } = await ac('lite=1&src=bridge&sure=600');
    await doldur(p, 12); await L.bekle(4000);
    const kur = await p.evaluate(() => { const s = window.__sahne3d; if (!s) return false; window.__h = []; const a = s.figur.hareket; s.figur.hareket = function (kid, tur, o) { window.__h.push([kid, tur]); return a.apply(this, arguments); }; const b = s.simge; const y = function (kid, par, o) { window.__h.push([kid, 'simge', JSON.stringify(par)]); return b.apply(this, arguments); }; Object.assign(y, b); try { s.simge = y; } catch (e) { /* salt okunur */ } return true; });
    if (!kur) { KALDI('etki', 'window.__sahne3d yok'); await ctx.close(); return; }
    await at(p, chat('k3', 'hop', 'Kisik3')); await at(p, like('k7', 10, 'Kisik7')); await at(p, chat('k4', 'selam nasilsiniz', 'Kisik4')); await at(p, chat('k5', '🔥🔥', 'Kisik5')); await L.bekle(500);
    const h = await p.evaluate(() => window.__h);
    NOT('etki', 'cekirdek cagrilari: ' + JSON.stringify(h).slice(0, 400));
    for (const k of ['k3', 'k7', 'k4']) (h.some((x) => x[0] === k && x[1] !== 'simge') ? GECTI : KALDI)('etki', `${k}: kendi figurunde hareket ${h.filter((x) => x[0] === k).map((x) => x[1]).join(',') || 'YOK'}`);
    (h.some((x) => x[0] === 'k4' && x[1] === 'simge') ? KALDI : GECTI)('etki', 'serbest metinli mesaj balon uretmiyor');
    await ctx.close();
  },

  // ------------------------------------------------------------------ bellek / DOM buyumesi
  async bellek() {
    console.log('\n## bellek — iki tam sarki boyunca DOM / dinleyici / heap buyumesi (60 dansci, yogun olay)');
    const SURE = HIZLI ? 25 : 100;
    const { ctx, p, hata } = await ac(`lite=1&src=bridge&sure=${SURE}&kutlama=6`);
    const cdp = await ctx.newCDPSession(p);
    await cdp.send('Performance.enable');
    const olcum = async () => { await cdp.send('HeapProfiler.collectGarbage'); await L.bekle(200); const m = Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map((x) => [x.name, x.value])); return { dugum: m.Nodes, dinleyici: m.JSEventListeners, heapMB: +(m.JSHeapUsedSize / 1048576).toFixed(2), dom: await p.evaluate(() => document.querySelectorAll('*').length) }; };
    let durdur = false;
    const pompa = (async () => { let i = 0; while (!durdur) { const k = 'b' + (i % 90); const r = i % 7; try { await at(p, r === 0 ? like(k, 12, 'Bellek' + (i % 90)) : r === 1 ? gift(k, [1, 150, 2000][i % 3], 'Bellek' + (i % 90)) : r === 2 ? chat(k, '@Bellek' + ((i * 7) % 90), 'Bellek' + (i % 90)) : r === 3 ? chat(k, String(1 + (i % 60)), 'Bellek' + (i % 90)) : chat(k, 'hop hop', 'Bellek' + (i % 90))); } catch { break; } i++; await L.bekle(35); } })();
    await L.bekle(8000);
    const m0 = await olcum();
    const kartBekle = async (n) => p.waitForFunction((n) => window.__D.kart.length >= n, n, { timeout: (SURE + 40) * 1000 }).catch(() => {});
    await kartBekle(1); await L.bekle(9000); const m1 = await olcum();
    await kartBekle(2); await L.bekle(9000); const m2 = await olcum();
    durdur = true; await pompa;
    console.log(`     baslangic(8.sn): ${JSON.stringify(m0)}\n     1. sarki sonu : ${JSON.stringify(m1)}\n     2. sarki sonu : ${JSON.stringify(m2)}`);
    const b = (a, c) => (c - a) / Math.max(1, a);
    if (m2.dom > m1.dom * 1.1 + 20) KALDI('bellek', `DOM sarkidan sarkiya buyuyor: ${m1.dom} -> ${m2.dom}`); else GECTI('bellek', `DOM sabit: ${m0.dom} / ${m1.dom} / ${m2.dom}`);
    if (m2.dinleyici > m1.dinleyici * 1.1 + 10) KALDI('bellek', `olay dinleyicileri buyuyor: ${m1.dinleyici} -> ${m2.dinleyici}`); else GECTI('bellek', `dinleyici sabit: ${m0.dinleyici} / ${m1.dinleyici} / ${m2.dinleyici}`);
    if (b(m1.heapMB, m2.heapMB) > 0.25 && m2.heapMB - m1.heapMB > 3) KALDI('bellek', `JS heap 1.->2. sarki %${Math.round(b(m1.heapMB, m2.heapMB) * 100)} buyudu (${m1.heapMB} -> ${m2.heapMB} MB)`); else GECTI('bellek', `heap: ${m0.heapMB} / ${m1.heapMB} / ${m2.heapMB} MB`);
    const o = await oz(p); if (o) NOT('bellek', `sarki no ${o.sarkiNo}, n=${o.n}, kuyruklar: orta ${o.ortaKuyruk.length}, bas ${o.basKuyruk.length}, altyazi ${o.altyazi}, cikan ${o.cikan}`);
    const ls = await p.evaluate(() => Object.keys(localStorage).map((k) => k + ':' + localStorage.getItem(k).length).join(', '));
    NOT('bellek', 'localStorage: ' + ls);
    if (hata.length) KALDI('bellek', 'sayfa hatasi: ' + hata.slice(0, 3).join(' | ')); else GECTI('bellek', 'iki sarki boyunca sayfa hatasi yok');
    await ctx.close();
  },

  // ------------------------------------------------------------------ kare suresi
  async kare() {
    console.log('\n## kare — 150 dansci, kalite=tam&kilit=1: s.olcum() butcesi (SwiftShader tavani 90 ms)');
    const { ctx, p } = await ac('lite=1&src=bridge&sure=600&kalite=tam&kilit=1');
    await doldur(p, 150, 'f'); await L.bekle(9000);
    const ornek = []; for (let i = 0; i < 8; i++) { const k = await p.evaluate(() => window.__sahne3d && window.__sahne3d.olcum()); if (k) ornek.push(k); await L.bekle(900); }
    if (!ornek.length) { KALDI('kare', 'olcum kancasi yok'); await ctx.close(); return; }
    const ort = (f) => ornek.reduce((a, x) => a + x[f], 0) / ornek.length; const son = ornek[ornek.length - 1];
    console.log('     ' + JSON.stringify(son).slice(0, 300));
    (son.figur >= 150 ? GECTI : KALDI)('kare', `figur ${son.figur}, cizilen ${son.cizilen}`);
    (son.cizimCagrisi <= 40 ? GECTI : KALDI)('kare', `cizim cagrisi ${son.cizimCagrisi} (<=40)`);
    (son.ucgen <= 160000 ? GECTI : KALDI)('kare', `ucgen ${son.ucgen} (<=160k)`);
    (ort('jsMs') <= 6 ? GECTI : KALDI)('kare', `JS/kare ort ${ort('jsMs').toFixed(2)} ms (<=6), p95 ${son.jsMsP95}`);
    (ort('kareMs') <= 90 ? GECTI : KALDI)('kare', `kare ort ${ort('kareMs').toFixed(1)} ms (<=90, SwiftShader)`);
    await ctx.close();
  },

  // ------------------------------------------------------------------ merkez
  async merkez() {
    console.log('\n## merkez — oyun.html yalnizca tur sinirinda degistiriyor; varsayilan dizilim degismedi');
    // varsayilan dizilim
    {
      const { ctx, p } = await ac('lite=1&mock=1', { sayfa: 'oyun.html' });
      await L.bekle(1500);
      const src = await p.evaluate(() => document.getElementById('sahne').src);
      const kaynak = fs.readFileSync(path.join(kok, 'overlays', 'oyun.html'), 'utf8');
      const m = kaynak.match(/q\.get\('oyunlar'\)\s*\|\|\s*'([^']+)'/);
      if (m && m[1] === 'at,halay,tencere' && /at\.html/.test(src)) GECTI('merkez', 'varsayilan dizilim at,halay,tencere, ilk oyun at'); else KALDI('merkez', `varsayilan dizilim degismis: ${m && m[1]} ; ilk cerceve ${src}`);
      await ctx.close();
    }
    const SN = 12, SARKI = 30;
    const ctx = await tr.newContext({ viewport: { width: 1080, height: 1920 } });
    await ctx.addInitScript(() => {
      if (window.top !== window) return;
      window.__M = { olay: [], t0: performance.now() };
      addEventListener('message', (e) => { if (e.data && e.data.tt === 'tur-bitti') window.__M.olay.push({ t: performance.now() - window.__M.t0, ne: 'tur-bitti' }); });
      const iv = setInterval(() => { const s = document.getElementById('sahne'); if (!s) return; clearInterval(iv); let son = ''; setInterval(() => { const a = s.getAttribute('src') || ''; if (a !== son) { son = a; window.__M.olay.push({ t: performance.now() - window.__M.t0, ne: 'src', src: a.split('?')[0] }); } }, 50); }, 10);
    });
    const p = await ctx.newPage();
    await p.goto(`http://127.0.0.1:${PORT}/overlays/oyun.html?lite=1&mock=1&oyunlar=halay,at&sn=${SN}&sure=${SARKI}&kutlama=5&tahmin=5&bahis=5&${Q3}`, { waitUntil: 'load' });
    await L.bekle((SARKI + 5 + 20) * 1000);
    const M = await p.evaluate(() => window.__M.olay);
    console.log('     ' + M.map((o) => `+${(o.t / 1000).toFixed(1)}s ${o.ne}${o.src ? ' ' + o.src : ''}`).join('  |  '));
    const gecis = M.filter((o) => o.ne === 'src')[1];
    const turBitti = M.filter((o) => o.ne === 'tur-bitti');
    if (!gecis) KALDI('merkez', `halay ${SARKI + 25} sn icinde hic "tur-bitti" demedi; merkez gecemedi`);
    else {
      const once = turBitti.filter((o) => o.t <= gecis.t).pop();
      if (gecis.t < (SN + 1) * 1000 + 600 && gecis.t < SARKI * 1000 - 3000) KALDI('merkez', `merkez sure dolar dolmaz (+${(gecis.t / 1000).toFixed(1)}s) sarkinin ORTASINDA gecti`);
      else if (!once || gecis.t - once.t > 1500) KALDI('merkez', `gecis (+${(gecis.t / 1000).toFixed(1)}s) bir tur-bitti mesajinin hemen ardindan degil`);
      else GECTI('merkez', `gecis +${(gecis.t / 1000).toFixed(1)}s de, tur-bitti (+${(once.t / 1000).toFixed(1)}s) ardindan — sarki ${SARKI}s + kutlama 5s sinirinda`);
      if (turBitti.length && turBitti[0].t < (SARKI - 2) * 1000) KALDI('merkez', `halay tur-bitti yi sarki bitmeden (+${(turBitti[0].t / 1000).toFixed(1)}s) gonderdi`);
    }
    await ctx.close();
  },

  // ------------------------------------------------------------------ lite kurallari
  async lite() {
    console.log('\n## lite — canlanan ozellikler yalnizca transform/opacity; metinde sonsuz scale yok');
    const { ctx, p } = await ac('lite=1&src=bridge&sure=40&kutlama=6');
    await doldur(p, 20); await at(p, chat('k1', '@Kisik2', 'Kisik1')); await at(p, gift('k4', 500, 'Kisik4'));
    const gorulen = new Map();
    for (let i = 0; i < 26; i++) {
      const a = await p.evaluate(() => document.getAnimations().map((an) => {
        const e = an.effect; const el = e && e.target; if (!el) return null;
        const kf = e.getKeyframes(); const ozel = new Set(); for (const k of kf) for (const key of Object.keys(k)) if (!['offset', 'easing', 'composite', 'computedOffset'].includes(key)) ozel.add(key);
        const t = e.getComputedTiming();
        const olcekli = kf.some((k) => /scale|matrix/.test(String(k.transform || '')) || k.scale);
        return { sec: (el.id ? '#' + el.id : '.' + String(el.className).split(' ')[0]), ad: an.animationName || an.transitionProperty || '?', ozel: [...ozel], sonsuz: t.iterations === Infinity, olcekli, metin: !!(el.innerText || '').trim() };
      }).filter(Boolean));
      for (const x of a) gorulen.set(x.sec + '|' + x.ad, x);
      await L.bekle(1800);
    }
    const kotuOzel = [...gorulen.values()].filter((x) => x.ozel.some((o) => !/^(transform|opacity|translate|scale|rotate)$/.test(o)));
    const yasak = kotuOzel.filter((x) => x.ozel.some((o) => /filter|shadow|mask|backdrop/i.test(o)));
    const sonsuzOlcek = [...gorulen.values()].filter((x) => x.sonsuz && x.olcekli && x.metin);
    NOT('lite', `gorulen animasyon/gecis: ${gorulen.size} — ` + [...gorulen.values()].slice(0, 14).map((x) => `${x.sec}:${x.ad}[${x.ozel.join(',')}]${x.sonsuz ? '∞' : ''}`).join(' '));
    if (yasak.length) KALDI('lite', 'lite modda olu ozellik canlandiriliyor: ' + yasak.map((x) => `${x.sec}:${x.ad}[${x.ozel.join(',')}]`).join(' ')); else GECTI('lite', 'filter/shadow/mask canlandiran animasyon yok');
    if (kotuOzel.length) NOT('lite', 'transform/opacity DISI canlanan ozellik (yerlesim/boya maliyeti): ' + kotuOzel.map((x) => `${x.sec}:${x.ad}[${x.ozel.join(',')}]`).join(' '));
    if (sonsuzOlcek.length) KALDI('lite', 'metin tasiyan elemanda SONSUZ scale animasyonu: ' + sonsuzOlcek.map((x) => x.sec + ':' + x.ad).join(' ')); else GECTI('lite', 'metinde sonsuz scale animasyonu yok');
    // statik: kaynakta setInterval/rAF disi kare-bagimli hareket ipucu
    const k = fs.readFileSync(path.join(kok, 'overlays', 'halay.html'), 'utf8');
    const ih = (k.match(/innerHTML\s*=\s*`[^`]*\$\{[^`]*`/g) || []).length;
    NOT('lite', `kaynak: innerHTML+sablon ${ih} yerde (izleyici metni textContent/kacisla mi — KOD OKU), dt kullanimi ${(k.match(/\bdt\b/g) || []).length}, performance.now ${(k.match(/performance\.now/g) || []).length}`);
    await ctx.close();
  },

  // ------------------------------------------------------------------ kelime
  async kelime() {
    console.log('\n## kelime — gorunen tum metinde bahis/sans sozcugu; izleyici adi HTML olarak yorumlaniyor mu');
    const { ctx, p, hata } = await ac('lite=1&src=bridge&sure=30&kutlama=5&kabul=4&duet=3&solo=2');
    await p.evaluate(() => { window.__xss = 0; });
    const kotuAd = 'A<img src=x onerror=__xss++>B&amp;"\'';
    // TT.fire -> dispatch zararsiz() uyguluyor; ayrica Halay'in kendi kacisi var mi diye dogrudan da bak
    await at(p, chat('xss', 'selam', kotuAd)); await at(p, gift('xss', 2000, kotuAd)); await doldur(p, 14);
    await at(p, chat('k1', '@Kisik4', 'Kisik1')); await at(p, chat('k3', 'oyna', 'Kisik3')); await at(p, like('k5', 20, 'Kisik5'));
    await p.waitForFunction(() => window.__D.kart.length >= 1, null, { timeout: 60000 }).catch(() => {});
    await L.bekle(7000);
    const D = await p.evaluate(() => ({ m: [...window.__D.metinler], sp: window.__D.spiker.map((s) => s.metin), so: window.__D.soyle.map((s) => s.metin), uy: window.__D.uyanis, ka: window.__D.kart, xss: window.__xss, img: document.querySelectorAll('img[src="x"]').length }));
    const sozde = await p.evaluate(S.SOZDE);
    const hepsi = [...D.m, ...D.sp, ...D.so, ...D.ka.map((k) => k.isim + ' ' + k.alt), ...D.uy.flatMap((u) => Object.values(u).map(String)), ...sozde.map((s) => s.metin)];
    const RE = [/bahis/, /(^|[^a-z])bahs[ie]/, /(^|[^a-z])oran/, /odeme/, /kumar/, /(^|[^a-z])sans(?!ur)/, /kupon/, /ikramiye/, /jackpot/, /(^|[^a-z])kasa([^a-z]|$)/, /cekilis/, /piyango/, /kazandir/, /yatir/];
    const vur = [...new Set(hepsi.filter((t) => RE.some((r) => r.test(L.trSade(t)))))];
    if (vur.length) KALDI('kelime', 'bahis/sans sozcugu: ' + vur.slice(0, 8).map((v) => JSON.stringify(v.slice(0, 70))).join(' ; ')); else GECTI('kelime', `${hepsi.length} metinde bahis/sans sozcugu yok`);
    if (D.xss || D.img) KALDI('kelime', `izleyici adi HTML olarak yorumlandi (onerror ${D.xss}, img ${D.img})`); else GECTI('kelime', 'kotu niyetli ad HTML olarak yorumlanmadi');
    NOT('kelime', 'sohbet botu: ' + JSON.stringify(D.so.slice(0, 3)) + ' ; uyanis: ' + JSON.stringify(D.uy[0] || null).slice(0, 260));
    if (hata.length) KALDI('kelime', 'sayfa hatasi: ' + hata.slice(0, 3).join(' | '));
    await ctx.close();
  },
};
TESTLER.geri = async function () {
  console.log('\n## geri — ?3d=0 ile tam tur');
  const { ctx, p, hata } = await ac('lite=1&src=bridge&sure=25&kutlama=4&3d=0');
  await doldur(p, 20); await at(p, chat('k1', '@Kisik4', 'Kisik1')); await at(p, gift('k5', 200, 'Kisik5')); await L.bekle(1500);
  await olc(p, '3d=0 gorunumu', 'geri'); await cek(p, '8-3d0');
  const m = await metin(p); (/Kisik1/.test(m) && /Kisik5/.test(m) ? GECTI : KALDI)('geri', '3d=0: davet eden ve hediye verenin adi ekranda');
  await p.waitForFunction(() => window.__D.kart.length >= 1, null, { timeout: 60000 }).then(() => GECTI('geri', '3d=0: tur bitti, kart + tur-bitti'), () => KALDI('geri', '3d=0: 60 sn de tur bitmedi'));
  hata.length ? KALDI('geri', 'hata: ' + hata.slice(0, 2).join(' | ')) : GECTI('geri', '3d=0: hata yok');
  await ctx.close();
};
TESTLER.punto = TESTLER.kesme = null;   // "ekran" icinde olculur

(async () => {
  kok = L.kaynak(hedef);
  console.log(`# halay inceleme kiti — hedef: ${kok}`);
  if (!fs.existsSync(path.join(kok, 'overlays', 'halay.html'))) { console.log('  halay.html YOK — calistirilamaz.'); process.exit(2); }
  const sunucu = await L.statikSunucu(kok, PORT);
  tr = await L.tarayici(['--enable-precise-memory-info', '--enable-unsafe-swiftshader']);
  for (const [ad, fn] of Object.entries(TESTLER)) {
    if (!fn || !calis(ad)) continue;
    try { await fn(); } catch (e) { KALDI(ad, 'TEST COKTU: ' + String(e && e.message || e).split('\n')[0]); }
  }
  await tr.close(); sunucu.close();
  const k = sonuc.filter((s) => s.tur === 'KALDI');
  console.log(`\n# OZET: ${sonuc.filter((s) => s.tur === 'GECTI').length} gecti, ${k.length} kaldi, ${sonuc.filter((s) => s.tur === 'not  ').length} not`);
  for (const x of k) console.log(`  KALDI [${x.test}] ${x.metin.slice(0, 220)}`);
  L.yaz(`halay-${hedefAd}.json`, sonuc);
  process.exit(k.length ? 1 : 0);
})().catch((e) => { console.error('KIT HATASI', e); process.exit(2); });
