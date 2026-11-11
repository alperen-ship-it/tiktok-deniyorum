'use strict';
// tencere-kit.js [test...] — DUDUKLU bagimsiz inceleme. PORT ortam degiskeni (varsayilan 9064).
const path = require('path'); const L = require('./lib'); const S = require('./sayfa');
const PORT = Number(process.env.PORT) || 9064;
const U = (id, ad) => ({ id, uniqueId: id, nickname: ad || id, avatar: '' });
const chat = (id, y, ad) => ({ type: 'chat', user: U(id, ad), comment: y, ts: Date.now() });
const gift = (id, e, ad, ek) => ({ type: 'gift', user: U(id, ad), gift: Object.assign({ id: 1, name: 'Gül', diamonds: e, value: e, count: 1, streaking: false, emoji: '🌹', image: '' }, ek || {}), ts: Date.now() });
const say = { g: 0, k: 0 };
const G = (m) => { say.g++; console.log('  [GECTI] ' + m); }, K = (m) => { say.k++; console.log('  [KALDI] ' + m); }, N = (m) => console.log('  [not  ] ' + m);
let tr;
const SATIR = () => { window.__SP = []; const iv = setInterval(() => { if (!window.Spiker || window.Spiker.__k) return; window.Spiker.__k = 1; const a = window.Spiker.satir; window.Spiker.satir = function (p, o) { try { window.__SP.push((p || []).map((x) => (typeof x === 'string' ? x : (x && x.kim) || '')).join('')); if (window.__SP.length > 400) window.__SP.shift(); } catch (e) {} return a.apply(this, arguments); }; }, 5); };
async function ac(sorgu) {
  const ctx = await tr.newContext({ viewport: { width: 1080, height: 1920 } });
  await ctx.addInitScript(S.KANCA); await ctx.addInitScript(S.TUVAL_KANCA); await ctx.addInitScript(SATIR);
  const p = await ctx.newPage(); const hata = [];
  p.on('pageerror', (e) => hata.push(String(e.stack || e).slice(0, 200)));
  p.on('console', (m) => { if (m.type() === 'error' && !/WebSocket|Failed to load|ERR_CONN/.test(m.text())) hata.push('console: ' + m.text().slice(0, 160)); });
  const dis = []; p.on('request', (r) => { if (!/^(http:\/\/127\.0\.0\.1|data:|blob:)/.test(r.url())) dis.push(r.url().slice(0, 80)); });
  await p.goto(`http://127.0.0.1:${PORT}/overlays/tencere.html?lite=1&src=bridge&${sorgu}`, { waitUntil: 'load' });
  await p.waitForFunction(() => window.Tencere && window.TT, null, { timeout: 10000 });
  return { ctx, p, hata, dis };
}
const at = (p, ev) => p.evaluate(S.ATES, ev);
const oz = (p) => p.evaluate(() => window.Tencere.ozet());
async function olc(p, an) {
  const pu = await p.evaluate(S.PUNTO, 30), ke = await p.evaluate(S.KESIK), ta = await p.evaluate(S.TASMA), gv = await p.evaluate(S.GUVENLI), tp = await p.evaluate(S.TUVAL_PUNTO, 30);
  if (gv.dom.length || gv.tuval.length) K(`${an}: yasak bolgede metin: ` + [...gv.dom, ...gv.tuval].slice(0, 4).map((x) => `"${x.metin}" ${x.sec || ''} [${x.kutu}] ${x.neden}`).join(' ; '));
  if (tp.kotu.filter((k) => k.bagli).length) K(`${an}: tuvalde 30px alti: ` + tp.kotu.filter((k) => k.bagli).slice(0, 4).map((k) => `${k.px}px "${k.metin}"`).join(' ; '));
  if (pu.kotu.length) K(`${an}: 30px alti: ` + pu.kotu.slice(0, 6).map((k) => `${k.px}px "${k.metin}" ${k.sec}`).join(' ; '));
  else G(`${an}: 30px alti yok, yasak bolge temiz (${pu.toplam} dugum)`);
  if (ke.length) N(`${an}: kesilen ${ke.length}: ` + ke.slice(0, 5).map((k) => `${k.tur} +${k.tasan}px "${k.metin}" ${k.sec}`).join(' ; '));
  if (ta.kokIcTasma || ta.kokEkranDisi || ta.tasanlar.length) K(`${an}: #kok tasmasi ` + ta.tasanlar.slice(0, 4).map((t) => `${t.sec}+${t.tas}px`).join(' '));
}
async function cek(p, ad) { const y = path.join(L.CIKTI, `tencere-${ad}.png`); await p.screenshot({ path: y }); await L.telefon(tr, y, path.join(L.CIKTI, `tencere-${ad}-telefon.png`)); }
const Q = 'kalite=dusuk&kilit=1';
const ADLAR = ['Ali', 'mehmet_yilmz', 'cok_uzun_kullanici_ad', 'İstanbulluGüzelÇiçekŞöğüt2026'];
const T = {};
// tek izleyici, bot yok: tavan 45, patlamaz
T.tek = async () => {
  console.log('\n## tek — bot=0, tek izleyici azami hizda (hiz=10)');
  const { ctx, p, hata } = await ac('bot=0&hiz=10&' + Q);
  let mx = 0, pat = false; const t0 = Date.now();
  while (Date.now() - t0 < 19000) { await at(p, chat('a', 'x', 'Ali')); const o = await oz(p); mx = Math.max(mx, o.basinc); if (o.durum === 'titreme' || o.durum === 'patladi') pat = true; if (o.durum === 'pisti') break; await L.bekle(40); }
  const o = await oz(p);
  (!pat && mx <= 45.01 ? G : K)(`tek izleyici: en yuksek basinc ${mx}, patladi=${pat}, durum=${o.durum}`);
  (o.durum === 'pisti' || o.tur > 1 ? G : K)('tur "pişti" ile bitti');
  await L.bekle(600); const kart = await p.evaluate(() => window.__D.kart.slice(-1)[0]); N('pişti karti: ' + JSON.stringify(kart).slice(0, 220));
  await cek(p, '5-pisti'); await olc(p, 'pişti karti');
  hata.length ? K('hata: ' + hata[0]) : G('hata yok'); await ctx.close();
};
// botlu odalar: patlama suresi (oyun saniyesi)
T.denge = async () => {
  console.log('\n## denge — botlu odalarda TİTRİYOR anina kadar oyun saniyesi (hiz=10)');
  for (const [n, ara] of [[0, 0], [1, 20], [2, 6], [5, 20], [20, 6], [60, 40]]) {
    const { ctx, p } = await ac('hiz=10&' + Q);
    const t0 = Date.now(); let son = null; const sonAt = new Array(n).fill(-1e9); let enPay = 0;
    while (Date.now() - t0 < 17000) {
      const o = await oz(p); son = o;
      for (const k of o.katilanlar) if (!/^bot|🤖/.test(k.ad) && k.kid.indexOf('v') === 0) enPay = Math.max(enPay, k.pay);
      if (o.durum !== 'oyun') break;
      for (let i = 0; i < n; i++) if (o.oyunSaati - sonAt[i] >= ara * (0.6 + 0.8 * ((i * 7919) % 100) / 100)) { sonAt[i] = o.oyunSaati; await at(p, chat('v' + i, 'x', 'V' + i)); }
      await L.bekle(30);
    }
    const sn = (150 - (son.durum === 'oyun' ? son.kalanSn : NaN));
    const msg = `${n} izleyici / ara ${ara} sn: durum=${son.durum}, oyun saati ${son.oyunSaati}, basinc ${son.basinc}, en buyuk kisisel pay ${enPay.toFixed(1)}`;
    (son.durum === 'titreme' || son.durum === 'patladi') && son.oyunSaati >= 45 && son.oyunSaati <= 130 ? G(msg) : K(msg + ' (beklenen: 45–130 sn arasinda patlama)');
    await ctx.close();
  }
};
// hediyeler
T.hediye = async () => {
  console.log('\n## hediye — seri, tavan, 95 ustu siraya, sel, usta asci degismez');
  const { ctx, p, hata } = await ac('bot=0&' + Q);
  for (let i = 0; i < 4; i++) await at(p, chat('c' + i, 'selam', ADLAR[i]));
  await at(p, chat('c0', 'x', ADLAR[0]));
  const o0 = await oz(p);
  for (let i = 1; i <= 8; i++) await at(p, gift('z', 1, 'SeriCi', { streaking: true, count: i }));
  await L.bekle(300); let u = await p.evaluate(() => window.__D.ulti.length);
  (u === 0 ? G : K)(`seri surerken hediye sayilmadi (ULTI ${u})`);
  await at(p, gift('z', 8, 'SeriCi', { streaking: false, count: 8 })); await L.bekle(400);
  let o = await oz(p); u = await p.evaluate(() => window.__D.ulti.map((x) => x.kim + '|' + (x.ad || '')));
  (u.length === 1 && /SeriCi/.test(u[0]) ? G : K)('seri sonu: tek tesekkur, ad ilk satirda: ' + JSON.stringify(u));
  N(`kucuk hediye basinc etkisi: ${o0.basinc} -> ${o.basinc} (hediyeBasinc ${o.hediyeBasinc})`);
  await at(p, gift('h1', 30, ADLAR[3])); await L.bekle(500); await cek(p, '3-koruk'); await olc(p, 'koruk + ULTI');
  o = await oz(p); (o.koruk.kalan > 0 ? G : K)('30 elmas: körük ' + o.koruk.kalan + ' sn');
  (o.ustaAsci && o.ustaAsci.ad === ADLAR[0] ? G : K)('hediye usta asciyi degistirmedi: ' + JSON.stringify(o.ustaAsci));
  // sel: 30 hediye, 12 farkli kisi
  for (let i = 0; i < 30; i++) await at(p, gift('s' + (i % 12), [1, 5, 30, 200, 1500][i % 5], 'Sel' + (i % 12)));
  await L.bekle(300); o = await oz(p);
  (o.hediyeBasinc <= 25.01 ? G : K)('hediye tavani: hediyeBasinc ' + o.hediyeBasinc + ', basinc ' + o.basinc);
  await L.bekle(14000);
  const ul = await p.evaluate(() => window.__D.ulti.map((x) => x.kim)); const sp = await p.evaluate(() => window.__SP);
  const selU = ul.filter((x) => /^Sel/.test(x)).length, selS = sp.filter((x) => /Sel\d+/.test(x) && /sağ ol/.test(x)).length;
  N(`sel: 30 hediyeden 14 sn icinde ULTI ${selU}, Spiker.satir tesekkur ${selS}; ilk 4 ULTI: ${JSON.stringify(ul.slice(2, 6))}`);
  (selS === 30 ? G : K)('her hediye icin serit satiri istendi (30)');
  hata.length ? K('hata: ' + hata[0]) : G('hata yok'); await ctx.close();
};
// tam tur ekranlari: duduk, titreme, patladi karti, tur-bitti, ses
T.ekran = async () => {
  console.log('\n## ekran — sabit anlar (hiz=4), 4 uzun ad');
  const { ctx, p, hata, dis } = await ac('hiz=4&kutlama=6&' + Q);
  for (let i = 0; i < 4; i++) await at(p, chat('c' + i, 'selam', ADLAR[i]));
  await at(p, chat('c3', 'fokur', ADLAR[3]));
  await L.bekle(900); await cek(p, '1-baslangic'); await olc(p, 'baslangic');
  const m0 = await p.evaluate(() => document.body.innerText + '\n' + [...window.__T2.hepsi].join('\n'));
  for (const a of ADLAR) (m0.replace(/\s+/g, '').includes(a.replace(/\s+/g, '')) ? G : K)(`ad tam gorunuyor: ${a}`);
  let cekildi = {}; const t0 = Date.now(); let i = 0;
  while (Date.now() - t0 < 50000) {
    const o = await oz(p);
    if (o.esik >= 1 && !cekildi.d) { cekildi.d = 1; await L.bekle(300); await cek(p, '2-duduk'); await olc(p, 'duduk'); }
    if (o.durum === 'titreme' && !cekildi.t) { cekildi.t = 1; await cek(p, '4-titreme'); await olc(p, 'titreme'); }
    if (o.durum === 'patladi' && !cekildi.p) { cekildi.p = 1; await L.bekle(900); await cek(p, '6-patladi'); await olc(p, 'patladi karti'); }
    if (o.tur >= 2) break;
    if (o.durum === 'oyun' || o.durum === 'titreme') { await at(p, chat('c' + (i % 4), i % 5 ? 'x' : 'fokur', ADLAR[i % 4])); await at(p, chat('e' + (i % 9), 'x', 'Ek' + (i % 9))); i++; }
    await L.bekle(120);
  }
  const D = await p.evaluate(() => ({ kart: window.__D.kart, ses: (window.__D.sesler || []).map((s) => s.ad || s), soyle: window.__D.soyle, sp: window.__SP, m: [...window.__D.metinler], uy: window.__D.uyanis }));
  (D.kart.length === 1 ? G : K)('tek Finis.kart: ' + JSON.stringify(D.kart[0]).slice(0, 200));
  const zafer = D.ses.filter((s) => /zafer|kazan/.test(String(s))).length; (zafer === 0 ? G : K)('sayfa zafer sesini kendisi calmiyor (' + zafer + ') ; sesler: ' + [...new Set(D.ses.map(String))].join(','));
  N('sohbet botu: ' + JSON.stringify(D.soyle.slice(0, 2)));
  const RE = [/bahis/, /\bsans/, /kumar/, /kupon/, /jackpot/, /cekilis/, /piyango/, /\boran\b/, /\biddaa/, /\bkazan(c|dir)/, /talih/, /kura\b/, /rulet/];
  const hepsi = [...D.m, ...D.sp, ...D.soyle.map((s) => s.metin || s), JSON.stringify(D.uy)]; const vur = hepsi.filter((t) => RE.some((r) => r.test(L.trSade(String(t)))));
  (vur.length ? K : G)(`${hepsi.length} metinde bahis/sans sozcugu: ` + JSON.stringify(vur.slice(0, 5)));
  N('serit ornekleri: ' + JSON.stringify([...new Set(D.sp)].slice(0, 14)));
  (dis.length ? K : G)('dis istek: ' + dis.length); hata.length ? K('hata: ' + hata.slice(0, 2).join(' | ')) : G('hata yok');
  Object.keys(cekildi).length === 3 ? G('duduk/titreme/patladi anlari yakalandi') : K('yakalanan anlar: ' + Object.keys(cekildi));
  await ctx.close();
};
T.geri = async () => {
  console.log('\n## geri — ?3d=0 tam tur (hiz=6)');
  const { ctx, p, hata } = await ac('hiz=6&kutlama=5&3d=0');
  for (let i = 0; i < 4; i++) await at(p, chat('c' + i, 'selam', ADLAR[i]));
  await at(p, gift('c3', 30, ADLAR[3])); await L.bekle(900); await cek(p, '7-3d0'); await olc(p, '3d=0');
  const t0 = Date.now(); let i = 0, o;
  while (Date.now() - t0 < 40000) { o = await oz(p); if (o.tur >= 2) break; await at(p, chat('e' + (i++ % 9), 'x', 'Ek' + (i % 9))); await L.bekle(150); }
  (o.tur >= 2 ? G : K)('3d=0: tur tamamlandi, yeni tur basladi'); hata.length ? K('hata: ' + hata[0]) : G('hata yok'); await ctx.close();
};
T.kare = async () => {
  console.log('\n## kare — kalite=tam&kilit=1, 48 figur + efektler: s.olcum()');
  const { ctx, p, hata } = await ac('kalite=tam&kilit=1&bot=0');
  for (let i = 0; i < 60; i++) await at(p, chat('f' + i, 'x', 'Figur' + i));
  const t0 = Date.now(); let i = 0; while (Date.now() - t0 < 14000) { await at(p, chat('f' + (i++ % 60), i % 4 ? 'x' : 'fokur', 'Figur' + (i % 60))); await L.bekle(120); }
  const m = await p.evaluate(() => window.__sahne3d.olcum()); const o = await oz(p);
  console.log('     ' + JSON.stringify(m).slice(0, 420)); console.log('     sayfaJs ' + JSON.stringify(o.sayfaJs));
  (m.cizimCagrisi <= 40 ? G : K)('cizim cagrisi ' + m.cizimCagrisi); (m.ucgen <= 160000 ? G : K)('ucgen ' + m.ucgen);
  (m.jsMs + o.sayfaJs.jsMs <= 6 ? G : K)('JS/kare ' + (m.jsMs + o.sayfaJs.jsMs).toFixed(2) + ' ms'); (m.kareMs <= 90 ? G : K)('kare ort ' + m.kareMs + ' ms (<=90)');
  await cek(p, '8-tam48'); hata.length ? K('hata: ' + hata[0]) : G('hata yok'); await ctx.close();
};
T.lite = async () => {
  console.log('\n## lite — golge/filtre yok; canlanan ozellikler transform/opacity');
  const { ctx, p } = await ac('hiz=4&' + Q);
  for (let i = 0; i < 12; i++) await at(p, chat('c' + i, i % 3 ? 'x' : 'fokur', 'Kisi' + i)); await at(p, gift('c1', 30, 'Kisi1'));
  const kotu = new Set(); const t0 = Date.now();
  while (Date.now() - t0 < 12000) {
    const r = await p.evaluate(() => { const o = []; for (const e of document.querySelectorAll('body *')) { const c = getComputedStyle(e); for (const k of ['filter', 'boxShadow', 'textShadow', 'backdropFilter', 'maskImage']) if (c[k] && c[k] !== 'none') o.push(k + ' ' + (e.id || e.className)); }
      for (const a of document.getAnimations()) { const kf = a.effect && a.effect.getKeyframes ? a.effect.getKeyframes() : []; const ps = new Set(); for (const k of kf) for (const n of Object.keys(k)) if (!['offset', 'easing', 'composite', 'computedOffset'].includes(n)) ps.add(n); const t = a.effect.target; const inf = a.effect.getTiming().iterations === Infinity; for (const n of ps) if (!['transform', 'opacity'].includes(n)) o.push('anim ' + n + ' ' + (t.id || t.className)); if (inf && kf.some((k) => /scale|matrix/.test(String(k.transform || ''))) && t.textContent.trim()) o.push('sonsuz scale metin ' + (t.id || t.className)); if (a.transitionProperty && !['transform', 'opacity'].includes(a.transitionProperty)) o.push('gecis ' + a.transitionProperty + ' ' + (t.id || t.className)); } return o; });
    r.forEach((x) => kotu.add(x)); await at(p, chat('c' + (Date.now() % 12), 'x', 'Kisi')); await L.bekle(250);
  }
  (kotu.size ? K : G)('lite ihlali: ' + JSON.stringify([...kotu].slice(0, 8))); await ctx.close();
};
(async () => {
  const sec = process.argv.slice(2); const sun = await L.statikSunucu(L.kaynak('repo'), PORT); tr = await L.tarayici(['--enable-unsafe-swiftshader']);
  for (const t of (sec.length ? sec : Object.keys(T))) { try { await T[t](); } catch (e) { K(t + ' cokme: ' + String(e.stack || e).slice(0, 300)); } }
  console.log(`\n# OZET: ${say.g} gecti, ${say.k} kaldi`); await tr.close(); sun.close && sun.close(); process.exit(0);
})();
