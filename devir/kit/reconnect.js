'use strict';
/**
 * reconnect.js <head|repo|yol> [senaryoAdi ...] [--goster] [--ek "--sessiz 60"]
 *
 * Kara kutu yeniden-baglanma harness'i. Verilen agacin server/bridge.js'ini
 * SAHTE tiktok-live-connector + SANAL SAAT ile calistirir; connect() cagri
 * zamanlarini, es zamanli baglantilari ve bayat baglantilarin yeniden
 * baglanip baglanmadigini raporlar. Aga cikmaz.
 */
const fs = require('fs');
const path = require('path');
const L = require('./lib');

const DK = 60000, SN = 1000;
const okSonsuz = { r: 'ok', chatHer: 5000 };

const SENARYOLAR = {
  cevrimdisi: {
    aciklama: '12 kez "yayinda degil", sonra yayin acilir',
    script: [...Array(12).fill({ r: 'offline' }), okSonsuz], sonra: okSonsuz, sureMs: 40 * DK,
    denetle(s, c) {
      const b = s.baglan;
      c('12 cevrimdisi denemenin hepsi yapildi ve sonunda baglandi', b.length >= 13 && b[12] && b[12].sonuc === 'ok', `${b.length} connect`);
      const ar = s.bosluklar.slice(1, 12);
      c('bekleme araligi 10 sn..2 dk icinde (sessiz bekleme dongusu)', ar.length > 0 && ar.every((x) => x >= 9500 && x <= 2 * DK), 'bosluklar(sn): ' + ar.map(sn).join(', '));
      c('sonunda tek baglanti CONNECTED', s.bagliSon.length === 1, 'CONNECTED: ' + JSON.stringify(s.bagliSon));
    },
  },
  'oda-yok': {
    aciklama: '6 kez "Room ID alinamadi" (yayin kapaliyken sik gorulen), sonra yayin',
    script: [...Array(6).fill({ r: 'roomid' }), okSonsuz], sonra: okSonsuz, sureMs: 40 * DK,
    denetle(s, c) {
      c('tekrar denendi ve baglandi', s.baglan.some((b) => b.sonuc === 'ok'), `${s.baglan.length} connect`);
      c('Euler ucretli room-id yedegi KAPALI (skipFetchRoomIdFromEulerRoute=true)', s.ham.eulerCagri === 0 && s.baglan.every((b) => b.skipEulerRoomId === true),
        `eulerCagri=${s.ham.eulerCagri}, skip=${JSON.stringify([...new Set(s.baglan.map((b) => b.skipEulerRoomId))])}`);
    },
  },
  limit: {
    aciklama: 'imzalama limiti: retry-after 120 sn, 5 sn, 3600 sn, basliksiz; sonra basari',
    script: [{ r: 'ratelimit', retryAfter: 120 }, { r: 'ratelimit', retryAfter: 5 }, { r: 'ratelimit', retryAfter: 3600 }, { r: 'ratelimit' }, okSonsuz],
    sonra: okSonsuz, sureMs: 90 * DK,
    denetle(s, c) {
      const g = s.bosluklar;   // g[i] = i. denemenin bitisinden (i+1). denemenin baslangicina
      c('limit sonrasi tekrar denendi', s.baglan.length >= 5, `${s.baglan.length} connect`);
      c('retry-after=120 sn sayildi (>=120 sn, <=200 sn)', g[1] >= 120 * SN && g[1] <= 200 * SN, sn(g[1]) + ' sn');
      c('retry-after=5 sn -> en az 30 sn bekledi', g[2] >= 30 * SN && g[2] <= 90 * SN, sn(g[2]) + ' sn');
      c('retry-after=3600 sn -> en cok 15 dk bekledi (ve >=10 dk)', g[3] <= 16 * DK && g[3] >= 10 * DK, sn(g[3]) + ' sn');
      c('retry-after yok -> en az 30 sn bekledi', g[4] >= 30 * SN && g[4] <= 16 * DK, sn(g[4]) + ' sn');
      c('sonunda bagli', s.bagliSon.length === 1, JSON.stringify(s.bagliSon));
    },
  },
  bilinmeyen: {
    aciklama: '9 bilinmeyen hata (soket/zaman asimi/imza sunucusu), basari, 60 sn sonra kopma, 2 hata, basari',
    script: [{ r: 'error' }, { r: 'timeout' }, { r: 'signerror' }, { r: 'error', msg: 'getaddrinfo ENOTFOUND www.tiktok.com' }, { r: 'error' }, { r: 'timeout' }, { r: 'error' }, { r: 'error' }, { r: 'error' },
      { r: 'ok', chatHer: 5000, kop: 60 * SN }, { r: 'error' }, { r: 'error' }, okSonsuz],
    sonra: okSonsuz, sureMs: 90 * DK,
    denetle(s, c) {
      const g = s.bosluklar;
      c('offline DISINDAKI hatalar da tekrar deneniyor', s.baglan.length >= 10, `${s.baglan.length} connect (HEAD: 1)`);
      const beklenen = [10, 20, 40, 80, 160, 300, 300, 300];
      const gercek = g.slice(1, 9);
      const uygun = gercek.length === 8 && gercek.every((x, i) => x >= beklenen[i] * SN * 0.45 && x <= beklenen[i] * SN * 1.6);
      c('ustel geri cekilme ~10s -> 5dk tavan (jitter payiyla)', uygun, 'bosluklar(sn): ' + gercek.map(sn).join(', ') + '  beklenen~ ' + beklenen.join(', '));
      c('tavan 5 dk asilmiyor', gercek.length > 0 && Math.max(...gercek) <= 5 * DK * 1.6, 'en uzun ' + sn(Math.max(0, ...gercek)) + ' sn');
      const farkli = new Set(gercek.slice(5).map((x) => Math.round(x / 100))).size;
      c('jitter var (tavandaki 3 bekleme birebir ayni degil)', gercek.length === 8 && farkli > 1, gercek.slice(5).map(sn).join(', '));
      const i9 = s.baglan[9] && s.ham.instances[s.baglan[9].inst];
      const kop = i9 && i9.olaylar.find((o) => o.ad === 'disconnected');
      const ks = kop && s.baglan[10] ? s.baglan[10].t - kop.t : null;
      c('basaridan sonra sayac sifirlaniyor (kopmadan sonraki ilk deneme <=30 sn)', ks != null && ks <= 30 * SN, ks != null ? sn(ks) + ' sn' : 'yok');
      c('sonunda tek baglanti CONNECTED', s.bagliSon.length === 1, JSON.stringify(s.bagliSon));
    },
  },
  paywall: {
    aciklama: '4 kez ucretli-plan (PremiumFeature) hatasi, sonra basari',
    script: [{ r: 'premium' }, { r: 'premium' }, { r: 'missingtokens' }, { r: 'premium' }, okSonsuz], sonra: okSonsuz, sureMs: 60 * DK,
    denetle(s, c) {
      const g = s.bosluklar.slice(1, 5);
      c('paywall sonrasi da deneniyor', s.baglan.length >= 5, `${s.baglan.length} connect`);
      c('yaklasik 5 dk arayla', g.length === 4 && g.every((x) => x >= 4 * DK && x <= 6.5 * DK), 'bosluklar(sn): ' + g.map(sn).join(', '));
      const satir = s.baglan.slice(0, 5).map((b, i) => s.ham.loglar.filter((l) => l.t >= b.t && l.t < (s.baglan[i + 1] ? s.baglan[i + 1].t : 1e15)).length);
      c('uzun tavsiye metni BIR KEZ (sonraki denemeler <=3 satir)', satir.length >= 2 && satir[0] >= 2 * Math.max(...satir.slice(1, 4)) && satir.slice(1, 4).every((n) => n <= 6), 'deneme basina log satiri: ' + satir.join(', '));
    },
  },
  kopma: {
    aciklama: 'bagli, 60. sn soket kopar',
    script: [{ r: 'ok', chatHer: 5000, kop: 60 * SN }, okSonsuz], sonra: okSonsuz, sureMs: 20 * DK,
    denetle(s, c) {
      c('kopmadan sonra tekrar baglandi', s.baglan.length >= 2 && s.baglan[1].sonuc === 'ok', `${s.baglan.length} connect`);
      c('yeniden baglanma <=60 sn icinde', s.baglan[1] && s.baglan[1].t - 60 * SN <= 60 * SN, s.baglan[1] ? sn(s.baglan[1].t - 60 * SN) + ' sn' : '-');
      c('fazladan baglanti denemesi yok (tam 2 connect)', s.baglan.length === 2, s.baglan.map((b) => `+${sn(b.t)}s:${b.sonuc}`).join(' '));
      c('sonunda tek baglanti CONNECTED', s.bagliSon.length === 1, JSON.stringify(s.bagliSon));
    },
  },
  'yayin-bitti': {
    aciklama: 'bagli, 60. sn streamEnd (+kutuphanenin kendi disconnected olayi), 3 cevrimdisi, yeni yayin',
    script: [{ r: 'ok', chatHer: 5000, yayinBitti: 60 * SN }, { r: 'offline' }, { r: 'offline' }, { r: 'offline' }, okSonsuz], sonra: okSonsuz, sureMs: 30 * DK,
    denetle(s, c) {
      c('yayin bitince bekleyip yeni yayina baglandi', s.baglan.filter((b) => b.sonuc === 'ok').length >= 2, s.baglan.map((b) => `+${sn(b.t)}s:${b.sonuc}`).join(' '));
      c('tek zincir: streamEnd+disconnected cift yeniden baglanma baslatmiyor (tam 5 connect)', s.baglan.length === 5, `${s.baglan.length} connect`);
    },
  },
  sessizlik: {
    aciklama: 'bagli, 30. sn den sonra soket acik ama HIC olay gelmiyor (zombi)',
    script: [{ r: 'ok', chatHer: 5000, sessizlik: 30 * SN }, okSonsuz], sonra: okSonsuz, sureMs: 30 * DK,
    denetle(s, c, o) {
      const esik = (o.sessizSn || 180) * SN;
      const b1 = s.baglan[1];
      c('sessizlik bekcisi yeniden baglaniyor', !!b1, `${s.baglan.length} connect`);
      c(`bekci ~${esik / SN} sn sessizlikten sonra (0.8x..2x)`, b1 && b1.t - 30 * SN >= esik * 0.8 && b1.t - 30 * SN <= esik * 2 + 30 * SN, b1 ? sn(b1.t - 30 * SN) + ' sn sonra' : '-');
      c('zombi baglanti kapatildi (disconnect cagrildi)', s.ham.connects.some((x) => x.tur === 'disconnect' && x.inst === 0), '');
      c('sonunda tek baglanti CONNECTED', s.bagliSon.length === 1, JSON.stringify(s.bagliSon));
    },
  },
  'sessiz-ama-canli': {
    aciklama: 'sohbet yok ama oda canli: sadece roomUser (izleyici sayisi) olayi 10 sn de bir — bekci baglantiyi KESMEMELI',
    script: [{ r: 'ok', chatHer: 10000, sadeceRoomUser: true }], sonra: okSonsuz, sureMs: 30 * DK,
    denetle(s, c) {
      c('sakin ama canli odada gereksiz yeniden baglanma yok (1 connect)', s.baglan.length === 1, `${s.baglan.length} connect: ` + s.baglan.map((b) => `+${sn(b.t)}s`).join(' '));
    },
  },
  'kullanici-degisimi': {
    aciklama: '@a bagli; 30. sn panelden @b ye gecilir',
    byUser: { a: [okSonsuz], b: [okSonsuz] }, sonra: okSonsuz, sureMs: 20 * DK,
    eylemler: [{ t: 30 * SN, api: '/api/baglan?user=b' }],
    denetle(s, c) {
      const sonra = s.baglan.filter((b) => b.t >= 30 * SN);
      c('@b ye baglandi', sonra.some((b) => b.uniqueId === 'b' && b.sonuc === 'ok'), '');
      c('BAYAT baglanti (@a) bir daha connect() etmiyor', !sonra.some((b) => b.uniqueId === 'a'), sonra.filter((b) => b.uniqueId === 'a').map((b) => `+${sn(b.t)}s inst${b.inst}:${b.sonuc}`).join(' ') || 'yok');
      c('sonunda tek baglanti CONNECTED ve o da @b', s.bagliSon.length === 1 && s.bagliSon[0].uniqueId === 'b', JSON.stringify(s.bagliSon));
    },
  },
  'ucusta-degisim': {
    aciklama: '@a connect() ucustayken (2 sn suruyor) panelden @b ye, sonra geri @a ya gecilir; herkes cevrimdisi (Room ID yok)',
    byUser: { a: [{ r: 'roomid', gecikme: 2000 }], b: [] }, sonra: { r: 'roomid' }, sureMs: 10 * DK,
    eylemler: [{ t: 500, api: '/api/baglan?user=b' }, { t: 1000, api: '/api/baglan?user=a' }],
    denetle(s, c) {
      const a = s.baglan.filter((b) => b.uniqueId === 'a' && b.t > 60 * SN);
      const ar = []; for (let i = 1; i < a.length; i++) ar.push(a[i].t - a[i - 1].t);
      const kisa = ar.filter((x) => x < 8 * SN).length;
      c('tek bekleme dongusu (paralel ikinci dongu yok: ardisik denemeler arasi >=8 sn)', a.length > 2 && kisa === 0, `${a.length} deneme, 8 sn den kisa aralik: ${kisa}; ornek(sn): ` + ar.slice(0, 8).map(sn).join(', '));
      c('@b icin bayat deneme yok (60. sn den sonra)', !s.baglan.some((b) => b.uniqueId === 'b' && b.t > 60 * SN), '');
    },
  },
  'ucusta-basari': {
    aciklama: '@a connect() ucustayken (2 sn) panelden @b ye gecilir; @a nin connect i sonradan BASARIYLA biter',
    byUser: { a: [{ r: 'ok', chatHer: 5000, gecikme: 2000 }], b: [okSonsuz] }, sonra: okSonsuz, sureMs: 10 * DK,
    eylemler: [{ t: 500, api: '/api/baglan?user=b' }],
    denetle(s, c) {
      c('sonunda tek baglanti CONNECTED ve o da @b (bayat @a soketi acik kalmadi)', s.bagliSon.length === 1 && s.bagliSon[0].uniqueId === 'b', JSON.stringify(s.bagliSon));
      c('durum ucu @b gosteriyor', /"user":"b"/.test(s.ham.sonDurum || ''), String(s.ham.sonDurum).slice(0, 120));
    },
  },
  'ucusta-bayat-olay': {
    aciklama: '@a connect() ucustayken @b ye gecilir; bayat @a baglanip kapanana kadar (5 ms) 1 ms de bir olay yollar; @b hic baglanmaz',
    byUser: { a: [{ r: 'ok', chatHer: 1, gecikme: 2000 }], b: [{ r: 'hang' }] }, sonra: okSonsuz, sureMs: 2 * DK,
    eylemler: [{ t: 500, api: '/api/baglan?user=b' }],
    denetle(s, c) {
      const yayilan = (s.ham.chatSayisi || {})[0] || 0;
      let ev = -1; try { ev = JSON.parse(s.ham.sonDurum).events; } catch { /* */ }
      c('bayat baglanti kapanmadan once olay yaydi (test gecerli)', yayilan > 0, yayilan + ' olay');
      c('bayat baglantinin HICBIR olayi overlay lere iletilmedi (status.events = 0)', ev === 0, 'events=' + ev);
      c('bayat baglanti kapatildi', s.ham.instances[0].durum === 'DISCONNECTED', s.ham.instances[0].durum);
    },
  },
  'cevrimdisi-uzun': {
    aciklama: '20 dk boyunca yayin kapali (yoklama araligi uzuyor mu), sonra yayin',
    script: Array(55).fill({ r: 'offline' }), sonra: okSonsuz, sureMs: 40 * DK, bilgi: true,
    denetle(s, c) {
      const ar = s.bosluklar.slice(1);
      const ilk = ar.filter((x, i) => s.baglan[i + 1].t < 9 * DK), son = ar.filter((x, i) => s.baglan[i + 1].t > 12 * DK && s.baglan[i + 1].sonuc !== 'ok');
      c('(bilgi) ilk 9 dk aralik', true, [...new Set(ilk.map(sn))].join('/') + ' sn');
      c('(bilgi) 12. dk dan sonra aralik', true, [...new Set(son.map(sn))].join('/') + ' sn; toplam ' + s.baglan.length + ' connect');
    },
  },
  'sessizlik-tekrar': {
    aciklama: 'her baglanti 20 sn veri verip susuyor (4 kez ust uste), sonra saglam baglanti',
    script: Array(4).fill({ r: 'ok', chatHer: 5000, sessizlik: 20 * SN }), sonra: okSonsuz, sureMs: 3 * 60 * DK, bilgi: true,
    denetle(s, c) {
      c('(bilgi) ardisik sessizlik sonrasi yeniden baglanma araliklari', true, s.bosluklar.slice(1).map(sn).join(', ') + ' sn');
    },
  },
  'test-moduna-donus': {
    aciklama: '@a bagli; 30. sn panelden "sahte veri"ye (kullanicisiz) gecilir',
    byUser: { a: [okSonsuz] }, sonra: okSonsuz, sureMs: 10 * DK,
    eylemler: [{ t: 30 * SN, api: '/api/baglan?user=' }],
    denetle(s, c) {
      const sonra = s.baglan.filter((b) => b.t > 31 * SN);
      c('test moduna gecince canli baglanti bir daha connect() etmiyor', sonra.length === 0, sonra.map((b) => `+${sn(b.t)}s inst${b.inst}:${b.sonuc}`).join(' ') || 'yok');
      c('sonunda CONNECTED sahte-canli baglanti yok', s.bagliSon.length === 0, JSON.stringify(s.bagliSon));
    },
  },
  karma: {
    aciklama: 'gorevdeki dizi: cevrimdisi x2, limit(60), hata x2, basari->kopma, basari->yayin bitti, cevrimdisi x2, basari->sessizlik, basari',
    script: [{ r: 'offline' }, { r: 'offline' }, { r: 'ratelimit', retryAfter: 60 }, { r: 'error' }, { r: 'timeout' },
      { r: 'ok', chatHer: 5000, kop: 40 * SN }, { r: 'ok', chatHer: 5000, yayinBitti: 40 * SN }, { r: 'offline' }, { r: 'offline' },
      { r: 'ok', chatHer: 5000, sessizlik: 20 * SN }, okSonsuz],
    sonra: okSonsuz, sureMs: 60 * DK,
    denetle(s, c) {
      c('dizinin tamami islendi (11 adim) ve sonunda bagli', s.ham.kalanScript === 0 && s.bagliSon.length === 1, `kalan adim ${s.ham.kalanScript}, CONNECTED ${s.bagliSon.length}`);
      c('fazladan connect yok (tam 11)', s.baglan.length === 11, `${s.baglan.length} connect`);
    },
  },
  takili: {
    aciklama: '(bilgi) connect() hic donmuyor — kopru kendi basina kurtuluyor mu?',
    script: [{ r: 'hang' }], sonra: okSonsuz, sureMs: 30 * DK, bilgi: true,
    denetle(s, c) {
      c('(bilgi) takili connect ten sonra yeni deneme var', s.baglan.length >= 2, `${s.baglan.length} connect`);
    },
  },
};

function sn(ms) { return ms == null ? '-' : (Math.round(ms / 100) / 10).toString(); }

async function kos(klasor, hedefAd, ad, port, o) {
  const S = SENARYOLAR[ad];
  const senDosya = path.join(L.CIKTI, `reconnect-${hedefAd}-${ad}.senaryo.json`);
  const cikDosya = path.join(L.CIKTI, `reconnect-${hedefAd}-${ad}.json`);
  fs.mkdirSync(L.CIKTI, { recursive: true });
  fs.rmSync(cikDosya, { force: true });
  fs.writeFileSync(senDosya, JSON.stringify({ ad, port, script: S.script || [], byUser: S.byUser || null, sonra: S.sonra, sureMs: S.sureMs, eylemler: S.eylemler || [], ornekHer: 60000 }));
  const b = L.bridgeBaslat(klasor, {
    port, etiket: `rc-${hedefAd}-${ad}`, preload: [path.join(L.KOK, 'vclock.js')],
    args: ['--user', 'a', ...(o.ekArg || [])],
    env: { TLC_SENARYO: senDosya, TLC_CIKTI: cikDosya, TLC_GOSTER: o.goster ? '1' : '' },
  });
  const zaman = setTimeout(() => b.oldur(), 120000);
  await b.bitti;
  clearTimeout(zaman);
  if (o.goster) process.stdout.write(b.stdout);
  let ham;
  try { ham = JSON.parse(fs.readFileSync(cikDosya, 'utf8')); }
  catch { return { ad, cokme: true, metin: 'cikti yok. cikis=' + JSON.stringify(b.cikis) + '\n' + b.stdout.slice(-1200) + '\n' + b.stderr.slice(-1200) }; }
  if (ham.surucuHatasi) return { ad, cokme: true, metin: ham.surucuHatasi };

  const baglan = ham.connects.filter((c) => c.tur === 'connect');
  const bosluklar = baglan.map((c, i) => (i === 0 ? c.t : c.t - (baglan[i - 1].tBitti != null ? baglan[i - 1].tBitti : baglan[i - 1].t)));
  const bagliSon = ham.instances.filter((i) => i.durum === 'CONNECTED').map((i) => ({ inst: i.id, uniqueId: i.uniqueId }));
  const esZamanli = baglan.filter((c) => c.digerleri && c.digerleri.length);
  const cift = baglan.filter((c) => /Already/.test(c.sonuc || ''));
  const bayat = baglan.filter((c) => c.inst < c.enYeniInst);
  // ayni anda CONNECTED olan en fazla baglanti sayisi (olay zaman cizelgesinden)
  const olay = [];
  for (const i of ham.instances) for (const e of i.olaylar) if (e.ad === 'connected' || e.ad === 'disconnected') olay.push({ t: e.t, d: e.ad === 'connected' ? 1 : -1 });
  olay.sort((x, y) => x.t - y.t || x.d - y.d);
  let n = 0, enCok = 0; for (const e of olay) { n += e.d; enCok = Math.max(enCok, n); }

  const s = { ham, baglan, bosluklar, bagliSon };
  const denetimler = [];
  const c = (metin, gecti, kanit) => denetimler.push({ metin, gecti: !!gecti, kanit: kanit || '' });
  // her senaryoda ortak
  c('es zamanli connect yok (baska baglanti CONNECTING/CONNECTED iken)', esZamanli.length === 0, esZamanli.slice(0, 4).map((x) => `+${sn(x.t)}s inst${x.inst} iken ${JSON.stringify(x.digerleri)}`).join(' ; ') || '');
  c('Already(Connecting|Connected)Error yok', cift.length === 0, cift.slice(0, 4).map((x) => `+${sn(x.t)}s inst${x.inst}:${x.sonuc}`).join(' ') || '');
  c('bayat baglanti nesnesi connect() etmiyor', bayat.length === 0, bayat.slice(0, 4).map((x) => `+${sn(x.t)}s inst${x.inst} (en yeni ${x.enYeniInst})`).join(' ') || '');
  c('ayni anda en fazla 1 CONNECTED', enCok <= 1, 'en cok ' + enCok);
  c('surec hatasi yok (unhandledRejection/uncaughtException)', ham.hatalar.length === 0, ham.hatalar.slice(0, 2).map((h) => h.tur + ': ' + h.metin.split('\n')[0]).join(' | '));
  c('loopback disi ag denemesi yok', b.guard().length === 0, b.guard().slice(0, 3).join(' | '));
  S.denetle(s, c, o);
  return { ad, aciklama: S.aciklama, bilgi: !!S.bilgi, baglan, bosluklar, denetimler, cikDosya, ham, eulerSkip: [...new Set(baglan.map((x) => x.skipEulerRoomId))] };
}

function yazdir(r) {
  console.log('\n=== ' + r.ad + ' — ' + (r.aciklama || '') + ' ===');
  if (r.cokme) { console.log('  !! HARNESS/KOPRU COKTU:\n' + r.metin); return; }
  console.log('  connect() takvimi  [baslangic  inst  kullanici  adim -> sonuc  (onceki denemenin bitisinden bu yana)]');
  const goster = r.baglan.slice(0, 26);
  goster.forEach((c, i) => {
    console.log(`    +${sn(c.t).padStart(7)}s  inst${String(c.inst).padEnd(2)} @${c.uniqueId.padEnd(2)} ${String(c.adim || '-').padEnd(13)} -> ${String(c.sonuc || 'BITMEDI').padEnd(28)} (${i === 0 ? 'acilis' : '+' + sn(r.bosluklar[i]) + 's'})`);
  });
  if (r.baglan.length > goster.length) console.log(`    ... toplam ${r.baglan.length} connect`);
  const diger = r.ham.connects.filter((c) => c.tur !== 'connect' && c.tur !== 'disconnect');
  if (diger.length) console.log('  diger kutuphane cagrilari: ' + Object.entries(diger.reduce((a, c) => ((a[c.tur] = (a[c.tur] || 0) + 1), a), {})).map(([k, v]) => `${k}x${v}`).join(', '));
  const taslak = r.ham.calls.filter((c) => c.ad !== 'EYLEM' && !/cookieJar/.test(c.ad));
  if (taslak.length) console.log('  UYARI sahte pakette uygulanmamis/diger cagrilar: ' + [...new Set(taslak.map((c) => c.ad))].join(', '));
  for (const e of r.ham.calls.filter((c) => c.ad === 'EYLEM')) console.log(`  eylem +${sn(e.t)}s ${e.eylem.api} -> ${e.sonuc.yontem} ${e.sonuc.kod} ${e.sonuc.govde.slice(0, 80)}`);
  console.log('  son /api/status: ' + String(r.ham.sonDurum).slice(0, 160));
  for (const d of r.denetimler) console.log(`  [${d.gecti ? 'GECTI' : (r.bilgi ? 'BILGI' : 'KALDI')}] ${d.metin}${d.kanit ? '  — ' + d.kanit : ''}`);
}

(async () => {
  const argv = process.argv.slice(2);
  const o = { goster: false, ekArg: [], sessizSn: 180 };
  const adlar = [];
  let hedef = null;
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--goster') o.goster = true;
    else if (argv[i] === '--ek') o.ekArg = argv[++i].split(/\s+/).filter(Boolean);
    else if (argv[i] === '--sessiz-sn') o.sessizSn = Number(argv[++i]);
    else if (!hedef) hedef = argv[i];
    else adlar.push(argv[i]);
  }
  hedef = hedef || 'repo';
  const hedefAd = path.basename(hedef);
  const klasor = L.sahnele(L.kaynak(hedef), 'rc-' + hedefAd);
  const liste = adlar.length ? adlar : Object.keys(SENARYOLAR);
  console.log(`# yeniden-baglanma harness — hedef: ${L.kaynak(hedef)}  (sahnelenen kopya: ${klasor})`);
  const PORTLAR = [9063, 9064, 9065];
  const sonuclar = new Array(liste.length);
  let sira = 0;
  await Promise.all(PORTLAR.map(async (port) => {
    for (;;) { const i = sira++; if (i >= liste.length) return; sonuclar[i] = await kos(klasor, hedefAd, liste[i], port, o); }
  }));
  let kaldi = 0, gecti = 0;
  for (const r of sonuclar) {
    yazdir(r);
    if (r.cokme) { kaldi++; continue; }
    if (!r.bilgi) for (const d of r.denetimler) d.gecti ? gecti++ : kaldi++;
  }
  console.log(`\n# OZET (${hedefAd}): ${gecti} denetim gecti, ${kaldi} kaldi.`);
  for (const r of sonuclar) {
    if (r.cokme) { console.log(`  KALDI ${r.ad}: cokme`); continue; }
    const k = r.denetimler.filter((d) => !d.gecti);
    if (k.length && !r.bilgi) console.log(`  KALDI ${r.ad}: ` + k.map((d) => d.metin).join(' | '));
  }
  L.yaz(`reconnect-${hedefAd}-ozet.json`, sonuclar.map((r) => ({ ad: r.ad, cokme: r.cokme, denetimler: r.denetimler, takvim: (r.baglan || []).map((c) => ({ t: c.t, inst: c.inst, u: c.uniqueId, adim: c.adim, sonuc: c.sonuc })) })));
  process.exit(kaldi ? 1 : 0);
})();
