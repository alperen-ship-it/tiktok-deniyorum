#!/usr/bin/env node
'use strict';
/**
 * TikTok LIVE -> yerel WebSocket koprusu + overlay dosya sunucusu.
 *
 *   node server/bridge.js --mock                 # sahte olaylar, internet gerekmez
 *   node server/bridge.js --user kullaniciadin   # gercek yayindan olay ceker
 *   node server/bridge.js --user x --port 8787
 *
 * Ne yapar:
 *   1) http://localhost:8787/  adresinde kontrol panelini ve overlay'leri sunar
 *   2) ws://localhost:8787/ws  uzerinden normalize edilmis olaylari yayinlar
 *   3) --mock ile TikTok'a hic baglanmadan sahte olay uretir (gelistirme icin)
 *
 * Gercek yayina baglanmak icin `tiktok-live-connector` paketi gerekir:
 *   cd server && npm install
 * Paket yoksa kopru otomatik olarak mock moda duser, overlay'ler yine calisir.
 */

const http = require('http');
const path = require('path');
const { attach } = require('./ws-mini');
const veri = require('./veri');
const varlik = require('./varlik');
const ayar = require('./ayar');
const istatistik = require('./istatistik');
const guvenlik = require('./guvenlik');
const yeniden = require('./yeniden');

// ---------------------------------------------------------------------------
// Argumanlar
// ---------------------------------------------------------------------------
function parseArgs(argv) {
  const out = { port: 8787, mock: false, user: null, verbose: false, rate: 1, bekle: 15, sessiz: 180, host: [] };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--mock' || a === '-m') out.mock = true;
    else if (a === '--verbose' || a === '-v') out.verbose = true;
    else if (a === '--user' || a === '-u') out.user = String(argv[++i] || '').replace(/^@/, '');
    else if (a === '--port' || a === '-p') out.port = Number(argv[++i]) || out.port;
    else if (a === '--rate') out.rate = Number(argv[++i]) || 1;
    else if (a === '--bekle') out.bekle = Number(argv[++i]) || 15;
    else if (a === '--tarayici') out.tarayici = true;
    else if (a === '--key' || a === '-k') out.key = String(argv[++i] || '');
    else if (a === '--gifts') out.gifts = true;
    else if (a === '--no-80') out.no80 = true;
    else if (a === '--lan') out.lan = true;
    else if (a === '--host') out.host.push(...String(argv[++i] || '').split(',').map((x) => x.trim()).filter(Boolean));
    else if (a === '--sessiz') out.sessiz = Number(argv[++i]) || 180;
    else if (a === '--oturum') out.oturum = String(argv[++i] || '');
    else if (a === '--idc') out.idc = String(argv[++i] || '');
    else if (a === '--klasor') out.klasor = String(argv[++i] || '');
    else if (a === '--gomulu') out.gomulu = true;
    else if (a === '--help' || a === '-h') out.help = true;
  }
  return out;
}

const args = parseArgs(process.argv);

istatistik.oku();

/* Oyun dosyalari nereden okunacak?
 *   --klasor <yol>  -> acikca verilen klasor
 *   (yoksa)         -> exe'nin yanindaki overlays/ klasoru varsa o
 *   --gomulu        -> her ikisini de yoksay, exe'nin icindekini kullan
 * Amac: kucuk bir guncelleme icin 90 MB exe'yi bastan indirmemek. */
let disKlasorYolu = null;
if (!args.gomulu) {
  disKlasorYolu = args.klasor ? varlik.disKlasor(args.klasor) : varlik.disKlasorBul();
  if (args.klasor && !disKlasorYolu) {
    console.log('  [kopru] --klasor bulunamadi, gomulu surum kullanilacak:', args.klasor);
  }
}

if (args.help) {
  console.log(`
TikTok LIVE koprusu

  --user, -u <ad>    Baglanilacak TikTok kullanici adi (@ olmadan)
  --mock, -m         Sahte olay uret, TikTok'a baglanma
  --port, -p <n>     HTTP/WS portu (varsayilan 8787)
  --rate <n>         Mock modda olay hizi carpani (varsayilan 1)
  --bekle <sn>       Yayin kapaliysa kac saniyede bir tekrar denensin (varsayilan 15)
  --tarayici         Acilista kontrol panelini varsayilan tarayicida ac
  --key, -k <k>      EulerStream imzalama anahtari (ya da EULER_API_KEY ortam degiskeni)
  --gifts            Hediye katalogunu da cek (ikon URL'leri icin) — UCRETLI uc,
                     varsayilan kapali. Kapaliyken hediye adi/elmas degeri yine gelir.
  --no-80            Port 80'i da dinleme (varsayilan: dener)
  --lan              Agdaki diger cihazlar da baglanabilsin (varsayilan: SADECE bu
                     bilgisayar — 127.0.0.1 ve ::1). Acinca ayni Wi-Fi'daki herkes
                     paneli ve sohbet olaylarini gorebilir; sadece guvendigin agda kullan.
  --host <a,b>       Izinli ek alan adlari (virgulle). Hazir izinli: localhost,
                     127.0.0.1, localtest.me, hosts dosyasinda 127.0.0.1'e yazdigin
                     adlar (yayin.local gibi). Baska bir adla acarsan 403 gorursun.
  --sessiz <sn>      Baglanti acik ama bu kadar saniye hic veri gelmezse yeniden
                     baglan (varsayilan 180, en az 30)
  --oturum <sid>     Sohbet botu icin TikTok sessionid cerezi (bir kez ver,
                     ayarlara kaydedilir). GERCEK sohbete yazmak ayrica
                     EulerStream'in ucretli planini gerektirir; yoksa bot
                     mesajlari sadece ekranda/konsolda gorunur.
  --idc <bolge>      tt-target-idc cerezi (varsayilan: useast1a)
  --klasor <yol>     Oyun dosyalarini bu klasorden oku (guncelleme icin).
                     Verilmezse exe'nin yanindaki overlays/ klasoru varsa
                     otomatik kullanilir; yoksa exe'ye gomulu surum calisir.
  --gomulu           Yanindaki overlays/ klasorunu YOKSAY, gomulu surumu kullan
  --verbose, -v      Her olayi konsola bas
`);
  process.exit(0);
}

// ---------------------------------------------------------------------------
// Statik dosya sunucusu
// ---------------------------------------------------------------------------
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.mp3': 'audio/mpeg',
  '.ogg': 'audio/ogg',
  '.wav': 'audio/wav',
  '.woff2': 'font/woff2',
  '.ico': 'image/x-icon',
};


// ---------------------------------------------------------------------------
// Erisim denetimi (Host / Origin / yan etkili uclar) — ayrinti: guvenlik.js
// ---------------------------------------------------------------------------
const guv = guvenlik.olustur({ ekstra: args.host, lan: args.lan });

// Durumu degistiren uclar: yalnizca POST + "X-TT: 1" basligi. Ozel baslik
// tarayicida CORS preflight zorunlu kilar; biz preflight'a hic onay vermiyoruz
// (hicbir yanita access-control-* basligi koymuyoruz) -> baska siteden gelen
// sayfa bu istegi GONDEREMEZ. <img src> ve <form> ise POST + ozel baslik
// yapamaz.
const YAN_ETKILI = new Set(['/api/fire', '/api/baglan', '/api/kapat', '/api/soyle', '/api/oyun']);

function metinCevap(res, kod, metin, baslik) {
  res.writeHead(kod, Object.assign(
    { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store' }, baslik));
  res.end(metin);
}

function jsonCevap(res, nesne) {
  res.writeHead(200, { 'content-type': 'application/json', 'cache-control': 'no-store' });
  res.end(JSON.stringify(nesne));
}

/** HTTP istegi ve WebSocket upgrade icin ortak: reddedilirse sebep metni doner. */
function erisimDenetle(req) {
  const ad = guv.hostAdi(req.headers.host);
  if (!guv.hostIzinli(ad)) {
    if (guv.ilkRed('host:' + ad)) {
      log(`!! izin verilmeyen adres reddedildi: "${ad || '(bos)'}" — gerekiyorsa:  --host ${ad || '<ad>'}`);
    }
    return `Bu adres izinli degil (${ad || 'bos'}). Bu adla acmak icin kopruyu --host ${ad || '<ad>'} ile baslat.`;
  }
  const origin = req.headers.origin;
  if (!guv.originIzinli(origin, req.headers.host)) {
    const o = String(origin);
    const dosyaMi = o === 'null' || o.startsWith('file:');   // file:// ya da sandbox'li sayfa
    const oAd = guvenlik.originAdi(o);
    const portFarki = oAd && guv.hostIzinli(oAd);     // ad izinli ama baska porttan geliyor
    if (guv.ilkRed('origin:' + o)) {
      log(dosyaMi
        ? `!! dosyadan acilan sayfa reddedildi (Origin ${o}) — izin icin:  --host null`
        : portFarki
          ? `!! baska porttan gelen istek reddedildi: Origin ${o} (bu sunucu: ${req.headers.host})`
          : `!! baska siteden gelen istek reddedildi: Origin ${o} — gerekiyorsa:  --host ${oAd || '<ad>'}`);
    }
    return dosyaMi
      ? `Dosyadan acilan sayfa (${o}) izinli degil. Izin icin kopruyu --host null ile baslat.`
      : portFarki
        ? `Bu porttan erisim izinli degil (${o}); sayfa bu sunucudan acilmali (${req.headers.host}).`
        : `Bu siteden erisim izinli degil (${o}). Izin icin kopruyu --host ${oAd || '<ad>'} ile baslat.`;
  }
  return null;
}

const server = http.createServer((req, res) => {
  const urlPath = (req.url || '/').split('?')[0];

  const red = erisimDenetle(req);
  if (red) { metinCevap(res, 403, '403 - ' + red); return; }

  if (urlPath.startsWith('/api/')) {
    if (YAN_ETKILI.has(urlPath)) {
      if (req.method !== 'POST') {
        metinCevap(res, 405, '405 - bu uc sadece POST kabul eder', { allow: 'POST' });
        return;
      }
      if (req.headers['x-tt'] !== '1') {
        metinCevap(res, 403, '403 - "X-TT: 1" basligi gerekli');
        return;
      }
    } else if (req.method !== 'GET' && req.method !== 'HEAD') {
      metinCevap(res, 405, '405 - bu uc sadece GET kabul eder', { allow: 'GET, HEAD' });
      return;
    }
  }

  // --- test olayi tetikleme ucu (kontrol paneli kullanir) ---
  if (urlPath === '/api/fire') {
    const q = new URL(req.url, 'http://localhost').searchParams;
    const type = q.get('type') || 'chat';
    const ev = makeMockEvent(type);
    const n = wss.broadcast(ev);
    jsonCevap(res, { ok: true, sentTo: n, event: ev });
    return;
  }

  // --- merkez hangi oyunun ekranda oldugunu bildiriyor (istatistik icin) ---
  if (urlPath === '/api/oyun') {
    const q = new URL(req.url, 'http://localhost').searchParams;
    const ad = istatistik.oyunAyarla(q.get('ad'));
    jsonCevap(res, { ok: true, oyun: ad });
    return;
  }

  // --- olcum ozeti (panel gosteriyor) ---
  if (urlPath === '/api/istatistik') {
    jsonCevap(res, istatistik.ozet());
    return;
  }

  // --- oyunlarin kazanan duyurusu (sohbet botu) ---
  if (urlPath === '/api/soyle') {
    const q = new URL(req.url, 'http://localhost').searchParams;
    jsonCevap(res, botSoyle(q.get('text') || ''));
    return;
  }

  // Tarayici her origin icin bir kez /favicon.ico istiyor; overlay'de ikon
  // gereksiz ama 404 konsolu kirletiyor. Bos cevapla sus.
  if (urlPath === '/favicon.ico') {
    res.writeHead(204).end();
    return;
  }

  // --- kontrol panelinden yayina baglanma / baglantiyi degistirme ---
  // Terminale donup surec yeniden baslatmak zorunda kalmamak icin.
  if (urlPath === '/api/baglan') {
    const q = new URL(req.url, 'http://localhost').searchParams;
    const kullanici = String(q.get('user') || '').replace(/^@/, '').trim();

    if (!kullanici) {
      args.user = null;
      kopar();
      startMock();
      jsonCevap(res, { ok: true, mode: 'mock' });
      return;
    }

    args.user = kullanici;
    // Tek dosya modunda paneldeki degisiklik kalici olsun — bir dahaki
    // acilista tekrar sormayalim.
    if (varlik.SEA_MI) ayar.kullaniciKaydet(kullanici);
    kopar();
    baglanti.basarisiz = 0;      // kullanici elle denedi: geri cekilme egrisi sifirdan
    baglanti.cevrimdisiAt = 0;   // ... ve seyreltilmis yoklama da 15 sn'ye doner
    baglanti.seyreltildi = false;
    baglanti.sessizCarpan = 1;
    baglanti.tavsiye = false;
    startLive(kullanici).catch((e) => log('!! baglanti hatasi:', e?.message || e));
    jsonCevap(res, { ok: true, mode: 'live', user: kullanici });
    return;
  }

  // --- uygulamayi kapat (panelin "Durdur" dugmesi) ---
  if (urlPath === '/api/kapat') {
    jsonCevap(res, { ok: true });
    log('kapatma istegi alindi, cikiliyor.');
    // Cevabin gitmesine firsat ver
    setTimeout(() => process.exit(0), 250);
    return;
  }

  if (urlPath === '/api/status') {
    jsonCevap(res, {
      mode: state.mode,
      user: args.user,
      connected: state.connected,
      bekliyor: !!state.bekliyor,
      detay: durumDetay(),
      tekrarSn: baglanti.tekrarAt ? Math.max(0, Math.ceil((baglanti.tekrarAt - Date.now()) / 1000)) : 0,
      clients: wss.clients.size,
      events: state.eventCount,
      uptime: Math.round(process.uptime()),
      veriKaynaklari: veriCekici ? veriCekici.kaynaklar() : [],
    });
    return;
  }

  // --- statik dosyalar -----------------------------------------------------
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    metinCevap(res, 405, '405 - sadece GET', { allow: 'GET, HEAD' });
    return;
  }
  // Diskten mi yoksa exe'nin icinden mi okundugunu varlik.js biliyor.
  let ad = varlik.adaCevir(urlPath);
  if (ad === null) {
    res.writeHead(403).end('403');
    return;
  }

  if (ad === '') ad = 'overlays/index.html';           // / -> kontrol paneli
  let govde = varlik.oku(ad);
  if (govde === null && !path.extname(ad)) {
    govde = varlik.oku(ad.replace(/\/$/, '') + '/index.html');   // klasor -> index
  }

  if (govde === null) {
    res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
    res.end('404 - bulunamadi: ' + urlPath);
    return;
  }

  res.writeHead(200, {
    'content-type': MIME[path.extname(ad).toLowerCase()] || 'application/octet-stream',
    'cache-control': 'no-store',
  });
  res.end(govde);
});

const wss = attach(server, {
  path: '/ws',
  dogrula: erisimDenetle,
  onConnect(client) {
    client.send({
      type: 'hello',
      mode: state.mode,
      user: args.user,
      connected: state.connected,
      bekliyor: !!state.bekliyor,
      detay: durumDetay(),
      ts: Date.now(),
    });
    log(`overlay baglandi (toplam ${wss.clients.size})`);
  },
});

// ---------------------------------------------------------------------------
// Durum + log
// ---------------------------------------------------------------------------
const state = { mode: 'idle', connected: false, eventCount: 0 };

// Acik olan canli baglantiyi / mock zamanlayicilarini durdur.
// Panelden kullanici adi degistirilince eskisinin arkada calismaya devam
// etmemesi icin gerekli.
let canliBaglanti = null;

// ---------------------------------------------------------------------------
// TEK yeniden-baglanma zamanlayicisi
// ---------------------------------------------------------------------------
// Eskiden streamEnd, disconnected ve "yayin kapali" yollari kendi setTimeout'unu
// kuruyordu; ayni anda iki yol calisabiliyor, eski bir baglantinin olayi yeni
// baglantiyi bozabiliyordu. Simdi:
//   * bekleyen tek bir zamanlayici var (baglanti.zamanlayici); doluyken yeni
//     istek yok sayilir (ilk gelen kazanir: streamEnd'den hemen sonra gelen
//     disconnected ikinci dongu baslatmaz)
//   * her yeni baglanti nesli bir sayac artirir (baglanti.nesil); eski
//     nesillerin olaylari ve cevaplari yok sayilir
//   * ne kadar bekilecegini yeniden.js saf fonksiyonu soyler
const baglanti = {
  nesil: 0,
  zamanlayici: null,
  tekrarAt: 0,          // zamanlayici ne zaman atesleyecek (ms epoch)
  etiket: '',           // panelde gosterilen kisa durum: 'limit', 'hata'...
  basarisiz: 0,         // ardisik basarisiz deneme (basarili baglantida sifirlanir)
  kayit: 0,             // basarisiz'in baglanmadan onceki degeri (erken kopma icin)
  baglandiAt: 0,
  sonVeri: 0,           // son olay/ham veri zamani (sessizlik bekcisi)
  kareSayisi: 0,        // bu baglantida gelen ham veri sayisi
  sessizCarpan: 1,      // veri hic gelmeyen baglantilarda esigi buyutur
  bekci: null,
  cevrimdisiAt: 0,      // kesintisiz 'yayin kapali' beklemesi ne zaman basladi
  tavsiye: false,       // paywall tavsiyesi bu seansta basildi mi
};
const SAGLAM_MS = 60 * 1000;         // bu kadar ayakta kalmadan "basarili" sayilmaz
const SEYRELT_MS = 10 * 60 * 1000;   // bu kadar suredir kapali bekleniyorsa yoklamayi seyrelt
const SEYRELT_BEKLE = 60;            // sn

function sessizMs() {
  return Math.max(30, Number(args.sessiz) || 180) * 1000 * baglanti.sessizCarpan;
}

/** Panelde gosterilecek: "limit — 120 sn sonra tekrar" ya da bos. */
function durumDetay() {
  if (!baglanti.zamanlayici || !baglanti.etiket) return '';
  return yeniden.durumMetni(baglanti.etiket, baglanti.tekrarAt - Date.now());
}

function tekrarIptal() {
  if (baglanti.zamanlayici) clearTimeout(baglanti.zamanlayici);
  baglanti.zamanlayici = null;
  baglanti.tekrarAt = 0;
  baglanti.etiket = '';
}

function bekciDurdur() {
  if (baglanti.bekci) clearInterval(baglanti.bekci);
  baglanti.bekci = null;
}

/**
 * Bir sonraki baglanti denemesini planla. Bekleyen zamanlayici varsa yok sayar.
 * @returns {object|null} karar (loglama icin) ya da null (zaten planli)
 */
function tekrarPlanla(hata, kullanici) {
  if (baglanti.zamanlayici) return null;
  // Yayin kapali / bitti = TikTok'a ulasabiliyoruz, geri cekilme egrisini
  // sifirla. Diger her sey ardisik basarisizlik sayilir.
  const tur = yeniden.sinif(hata);
  let deneme = 1;
  if (tur === 'cevrimdisi' || tur === 'yayinBitti') baglanti.basarisiz = 0;
  else deneme = ++baglanti.basarisiz;
  // Kesintisiz "yayin kapali" beklemesi ~10 dk'yi gecerse yoklama 60 sn'e
  // gevsetilir ("Room ID" hatasi captcha engeli de olabilir; tiktok.com'u
  // dovme). Basarili baglanti, elle baglan ya da baska turde hata sayaci sifirlar.
  let bekle = args.bekle;
  if (tur === 'cevrimdisi' || tur === 'yayinBitti') {
    if (!baglanti.cevrimdisiAt) baglanti.cevrimdisiAt = Date.now();
    if (Date.now() - baglanti.cevrimdisiAt >= SEYRELT_MS) {
      if (Math.max(10, Number(args.bekle) || 15) < SEYRELT_BEKLE) {
        if (!baglanti.seyreltildi) log(`   uzun suredir yayin yok — yoklama ${SEYRELT_BEKLE} sn'de bire seyreltildi.`);
        baglanti.seyreltildi = true;
        bekle = SEYRELT_BEKLE;
      }
    }
  } else {
    baglanti.cevrimdisiAt = 0;
    baglanti.seyreltildi = false;
  }
  const k = yeniden.karar(hata, deneme, { bekle });
  const nesil = baglanti.nesil;
  baglanti.etiket = k.state;
  baglanti.tekrarAt = Date.now() + k.delayMs;
  baglanti.zamanlayici = setTimeout(() => {
    baglanti.zamanlayici = null;
    baglanti.tekrarAt = 0;
    baglanti.etiket = '';
    // Bu arada kullanici baska ada gectiyse / kopar() cagrildiysa dokunma
    if (args.user !== kullanici || nesil !== baglanti.nesil || state.mode === 'mock') return;
    startLive(kullanici).catch((e) => {
      log('!! baglanti hatasi:', e?.message || e);
      tekrarPlanla(e, kullanici);
    });
  }, k.delayMs);
  durumYayinla();
  return k;
}

/** Acik baglantiyi kapat; olaylari artik dikkate alinmaz (nesil artar). */
function baglantiyiBirak() {
  baglanti.nesil++;
  bekciDurdur();
  if (canliBaglanti) {
    const eski = canliBaglanti;
    canliBaglanti = null;
    try { Promise.resolve(eski.disconnect()).catch(() => {}); } catch { /* zaten kapali */ }
  }
}

/**
 * Sessizlik bekcisi: baglanti "acik" gorunup veri gelmeyi kesmisse (olu
 * soket) kimse fark etmiyordu. Kutuphane 10 sn'de bir kalp atisi yolluyor ve
 * gelen HER kare 'websocketData' olayi uretiyor; ayrica oda olaylari var.
 * --sessiz sn boyunca bunlarin hicbiri gelmezse yeniden baglan.
 */
function bekciKur(nesil, kullanici) {
  bekciDurdur();
  baglanti.sonVeri = Date.now();
  baglanti.kareSayisi = 0;
  const aralik = Math.max(1000, Math.min(10000, Math.floor(sessizMs() / 4)));
  baglanti.bekci = setInterval(() => {
    if (nesil !== baglanti.nesil) { bekciDurdur(); return; }
    const sessiz = Date.now() - baglanti.sonVeri;
    if (sessiz < sessizMs()) return;
    bekciDurdur();
    // Art arda sessizlikle tetiklenen her yeniden baglanma esigi ikiye katlar
    // (en fazla 8x): sessiz bir odada her seferinde bir imza hakki yakmayalim.
    // Ilk normal olay (yorum, hediye...) esigi 1x'e dondurur; yalniz ham kare
    // (kalp atisi cevabi) dondurmez.
    baglanti.sessizCarpan = Math.min(8, baglanti.sessizCarpan * 2);
    log(`!! ${Math.round(sessiz / 1000)} sn boyunca hic veri gelmedi — baglanti yenileniyor` +
        (baglanti.sessizCarpan > 1 ? ` (sonraki esik ${Math.round(sessizMs() / 1000)} sn).` : '.'));
    state.connected = false;
    if (Date.now() - baglanti.baglandiAt < SAGLAM_MS) baglanti.basarisiz = baglanti.kayit;
    baglantiyiBirak();
    const k = tekrarPlanla({ olay: 'sessiz' }, kullanici);
    if (k) log('   ' + k.message);
  }, aralik);
  baglanti.bekci.unref?.();
}

// ---------------------------------------------------------------------------
// Sohbet botu — oyunlar kazananlari kutlamak icin /api/soyle cagirir.
//
// Iki katman:
//   1) HER ZAMAN: mesaj 'bot' olayi olarak overlay'lere yayinlanir ve konsola
//      yazilir (ekran botu).
//   2) MUMKUNSE: gercek TikTok sohbetine yazilir. Bunun icin yayincinin
//      sessionid cerezi (--oturum) VE EulerStream'in ucretli plani gerekir —
//      kutuphanenin sendMessage'i Euler bulutundan geciyor ve yetkisizse
//      401/403 "paid plan" hatasi donuyor. O durumda canli gonderim kapanir,
//      ekran botu calismaya devam eder.
//
// Kurallar: mesajlar 150 karaktere kirpilir, iki gonderim arasi en az 5sn,
// kuyrukta en fazla 3 mesaj (fazlasi dusurulur) — bot spam yapamaz.
const bot = { kuyruk: [], son: 0, zamanlayici: null, canliKapali: false };

function botSoyle(metin) {
  metin = String(metin || '').trim().slice(0, 150);
  if (!metin) return { ok: false, sebep: 'bos' };
  if (bot.kuyruk.length >= 3) return { ok: false, sebep: 'kuyruk dolu' };
  bot.kuyruk.push(metin);
  botPompala();
  return { ok: true, kuyruk: bot.kuyruk.length };
}

function botPompala() {
  if (bot.zamanlayici) return;
  const bekle = Math.max(0, 5000 - (Date.now() - bot.son));
  bot.zamanlayici = setTimeout(async () => {
    bot.zamanlayici = null;
    const metin = bot.kuyruk.shift();
    if (!metin) return;
    bot.son = Date.now();

    wss.broadcast({ type: 'bot', text: metin, ts: Date.now() });

    const oturum = args.oturum || ayar.oturumOku()?.sessionId;
    if (state.mode === 'live' && canliBaglanti && oturum && !bot.canliKapali) {
      try {
        await canliBaglanti.sendMessage(metin);
        log('bot >> (sohbete yazildi)', metin);
      } catch (e) {
        bot.canliKapali = true;
        log('!! bot sohbete yazamadi:', e?.message || e);
        log('   Gercek sohbete yazmak sessionid + EulerStream UCRETLI plani ister.');
        log('   Bot bundan sonra sadece ekranda calisacak.');
      }
    } else {
      log('bot (ekran):', metin);
    }
    if (bot.kuyruk.length) botPompala();
  }, bekle);
}
let veriCekici = null;
const mockZamanlayicilar = [];

function kopar() {
  baglantiyiBirak();
  tekrarIptal();
  // Node'da setTimeout ve setInterval ayni Timeout nesnesini donduruyor,
  // ikisini de clearTimeout ile iptal edebiliyoruz.
  while (mockZamanlayicilar.length) clearTimeout(mockZamanlayicilar.pop());
  state.connected = false;
  state.bekliyor = false;
  state.mode = 'idle';
}

/**
 * Overlay'lere "su an ne durumdayiz" bilgisini yolla. Oyunlar bunu dinleyip
 * yayin baslamadan once "YAYIN BEKLENIYOR" perdesi gosteriyor, ilk yorum
 * gelince oyuna geciyor.
 */
function durumYayinla() {
  wss.broadcast({
    type: 'durum',
    mode: state.mode,
    user: args.user,
    connected: state.connected,
    bekliyor: !!state.bekliyor,
    detay: durumDetay(),
    ts: Date.now(),
  });
}

function log(...a) {
  console.log('[kopru]', ...a);
}

let hediyeUyarisiVerildi = false;

/** Normalize edilmis olayi tum overlay'lere yolla. */
function emit(ev) {
  ev.ts = ev.ts || Date.now();
  state.eventCount++;

  // Sayim + "bu kisi ilk kez mi yaziyor" isareti. Oyunlar sayfa yenilenince
  // hafizalarini kaybettigi icin bunu kopru biliyor; oyunlar sadece
  // ev.ilk / ev.donen bayragina bakip karsilamayi yapiyor.
  try {
    const d = istatistik.say(ev);
    if (d.ilk) ev.ilk = true;
    else if (d.donen) ev.donen = true;
  } catch { /* istatistik oyunu bozmasin */ }

  // Hediye katalogu kapaliyken hediye adi/elmas degerinin yine de mesajin
  // icinden geldigini varsayiyoruz. Gelmiyorsa overlay'ler "Hediye 0 elmas"
  // gosterir ve sebebi anlasilmaz — bir kez uyar.
  if (ev.type === 'gift' && !hediyeUyarisiVerildi) {
    const adYok = !ev.gift?.name || ev.gift.name === 'Hediye';
    const elmasYok = !ev.gift?.diamonds;
    if (adYok || elmasYok) {
      hediyeUyarisiVerildi = true;
      log('');
      log('!! Hediye geldi ama bilgisi eksik (ad: ' + (ev.gift?.name ?? '-') +
          ', elmas: ' + (ev.gift?.diamonds ?? '-') + ').');
      log('   Hediye katalogu kapali oldugu icin olabilir. Denemek icin:');
      log('     node server/bridge.js --user ' + (args.user || '<ad>') + ' --gifts');
      log('   (--gifts ucretli bir uca gidiyor, plan yoksa baglanti hic kurulmaz)');
      log('');
    }
  }

  wss.broadcast(ev);
  if (args.verbose) {
    const who = ev.user?.nickname || ev.user?.uniqueId || '';
    let ayrinti = '';
    switch (ev.type) {
      case 'chat':    ayrinti = ev.comment ?? ''; break;
      case 'gift':    ayrinti = `${ev.gift?.name} x${ev.gift?.count} (${ev.gift?.value} elmas)`; break;
      case 'like':    ayrinti = `+${ev.likes}` + (ev.totalLikes ? ` (toplam ${ev.totalLikes})` : ''); break;
      case 'viewers': ayrinti = `${ev.count} izleyici`; break;   // eskiden bos basiyordu
      default:        ayrinti = '';
    }
    console.log(`  ${String(ev.type).padEnd(9)} ${who.padEnd(16)} ${ayrinti}`);
  }
}

// ---------------------------------------------------------------------------
// Olay normalizasyonu
// ---------------------------------------------------------------------------
// tiktok-live-connector surumleri alan adlarini degistirdigi icin her alani
// birden fazla olasi isimden okuyoruz. Yeni bir surum cikip alan adi degisirse
// buradaki fallback listesine eklemek yeterli.
function pick(obj, ...keys) {
  for (const k of keys) {
    const v = k.split('.').reduce((o, part) => (o == null ? o : o[part]), obj);
    if (v !== undefined && v !== null && v !== '') return v;
  }
  return undefined;
}

function normUser(d) {
  return {
    id: String(pick(d, 'user.userId', 'user.id', 'userId', 'uniqueId') ?? ''),
    uniqueId: pick(d, 'user.uniqueId', 'uniqueId') ?? 'anon',
    nickname: pick(d, 'user.nickname', 'nickname', 'user.uniqueId', 'uniqueId') ?? 'anon',
    avatar:
      pick(
        d,
        // v2 (tiktok-live-connector 2.x)
        'user.avatarThumb.urlList.0',
        'user.avatarThumb.url.0',
        'user.avatarMedium.urlList.0',
        // v1 / legacy
        'profilePictureUrl',
        'user.profilePicture.url.0',
        'user.profilePicture.urls.0',
        'userDetails.profilePictureUrls.0'
      ) ?? '',
    isModerator: !!pick(d, 'isModerator', 'user.isModerator'),
    isSubscriber: !!pick(d, 'isSubscriber', 'user.isSubscriber'),
    followRole: pick(d, 'followRole', 'user.followInfo.followStatus') ?? 0,
  };
}

const NORMALIZERS = {
  chat: (d) => ({ type: 'chat', user: normUser(d), comment: pick(d, 'comment', 'content') ?? '' }),

  gift: (d) => {
    const repeatEnd = pick(d, 'repeatEnd', 'gift.repeat_end');
    const giftType = pick(d, 'giftDetails.giftType', 'giftType', 'gift.gift_type');
    // giftType 1 = seri hediye (kullanici parmagi basili tutuyor). Seri boyunca
    // repeatCount artarak ayni olay tekrar tekrar gelir, seri bitince
    // repeatEnd=true olan son bir olay duser. Sadece onu sayiyoruz — yoksa tek
    // dokunusta bile olay iki kere islenir ve sayaclar sisir.
    const streaking = giftType === 1 && !repeatEnd;
    const count = Number(pick(d, 'repeatCount', 'gift.repeat_count') ?? 1);
    const diamonds = Number(pick(d, 'giftDetails.diamondCount', 'diamondCount') ?? 0);
    return {
      type: 'gift',
      user: normUser(d),
      gift: {
        id: pick(d, 'giftId', 'giftDetails.id', 'giftDetails.giftId') ?? 0,
        name: pick(d, 'giftDetails.giftName', 'giftName') ?? 'Hediye',
        // v2'de gercek CDN ikonu burada; <img src> ile dogrudan kullanilabilir
        image:
          pick(
            d,
            'giftDetails.giftImage.url.0',
            'giftDetails.giftImage.urlList.0',
            'giftDetails.icon.url.0',
            'giftPictureUrl',
            'giftDetails.giftImage.giftPictureUrl'
          ) ?? '',
        diamonds,
        count,
        value: diamonds * count,
        // 1 elmas ~ 0.005 USD (yayinciya giden pay)
        usd: +(diamonds * count * 0.005).toFixed(2),
        streaking,
      },
    };
  },

  like: (d) => ({
    type: 'like',
    user: normUser(d),
    likes: Number(pick(d, 'likeCount') ?? 1),
    totalLikes: Number(pick(d, 'totalLikeCount') ?? 0),
  }),

  follow: (d) => ({ type: 'follow', user: normUser(d) }),
  share: (d) => ({ type: 'share', user: normUser(d) }),
  member: (d) => ({ type: 'member', user: normUser(d) }),
  subscribe: (d) => ({ type: 'subscribe', user: normUser(d) }),
  roomUser: (d) => ({ type: 'viewers', count: Number(pick(d, 'viewerCount') ?? 0) }),

  // Eski surumlerde follow/share ayri olay degil, 'social' altinda displayType ile gelir
  social: (d) => {
    const dt = String(pick(d, 'displayType') ?? '');
    if (dt.includes('follow')) return { type: 'follow', user: normUser(d) };
    if (dt.includes('share')) return { type: 'share', user: normUser(d) };
    return null;
  },
};

// ---------------------------------------------------------------------------
// Mock olay ureteci
// ---------------------------------------------------------------------------
const MOCK_NAMES = [
  'ayse_k', 'mehmet61', 'zeynep.dev', 'burak_yldz', 'elif__', 'cansu35',
  'emrehan', 'deniz_ok', 'seda_nur', 'kaan.06', 'melis', 'tolga_34',
  'gamer_baba', 'pixelperi', 'noobmaster', 'sude', 'arda_tr', 'yagmur',
];
const MOCK_GIFTS = [
  { id: 5655, name: 'Gül', image: '', diamonds: 1, emoji: '🌹' },
  { id: 5827, name: 'GG', image: '', diamonds: 1, emoji: '🎮' },
  { id: 6064, name: 'Kalp', image: '', diamonds: 5, emoji: '❤️' },
  { id: 6247, name: 'Parmak Kalp', image: '', diamonds: 5, emoji: '🫰' },
  { id: 5586, name: 'Kahve', image: '', diamonds: 10, emoji: '☕' },
  { id: 6427, name: 'Donut', image: '', diamonds: 30, emoji: '🍩' },
  { id: 5658, name: 'Panda', image: '', diamonds: 99, emoji: '🐼' },
  { id: 6093, name: 'Roket', image: '', diamonds: 500, emoji: '🚀' },
  { id: 5269, name: 'Kral Taci', image: '', diamonds: 1000, emoji: '👑' },
  { id: 5789, name: 'Aslan', image: '', diamonds: 2999, emoji: '🦁' },
  { id: 6888, name: 'TikTok Evreni', image: '', diamonds: 34999, emoji: '🌌' },
];
const MOCK_COMMENTS = [
  'selam herkese', 'bu ne ya 😂', 'takip ettim', 'A', 'B', 'a', 'b',
  'katıl bize', 'nasıl yaptın onu', 'ilk ben geldim', 'kral', 'ses gelmiyor',
  '🔥🔥🔥', 'yarın yayın var mı', 'abi bi selam ver', 'B takım kazanır',
  'A A A', 'kod nerede', 'çok iyiydi', 'link atar mısın', 'valla helal',
];

const rnd = (arr) => arr[Math.floor(Math.random() * arr.length)];

function mockUser() {
  const u = rnd(MOCK_NAMES);
  const seed = u.replace(/\W/g, '');
  return {
    id: seed,
    uniqueId: u,
    nickname: u,
    // dicebear yerine yerel SVG: internet olmadan da avatar gorunsun
    avatar: `data:image/svg+xml;utf8,${encodeURIComponent(avatarSvg(seed))}`,
    isModerator: Math.random() < 0.05,
    isSubscriber: Math.random() < 0.15,
    followRole: Math.random() < 0.4 ? 1 : 0,
  };
}

function avatarSvg(seed) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  const hue = h % 360;
  const letter = (seed[0] || '?').toUpperCase();
  return `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96">
<rect width="96" height="96" rx="48" fill="hsl(${hue} 70% 45%)"/>
<text x="48" y="62" font-family="system-ui,sans-serif" font-size="46" font-weight="700"
 fill="#fff" text-anchor="middle">${letter}</text></svg>`;
}

function makeMockEvent(forceType) {
  const roll = Math.random();
  const type =
    forceType ||
    (roll < 0.45 ? 'chat' : roll < 0.7 ? 'like' : roll < 0.86 ? 'gift' : roll < 0.93 ? 'follow' : roll < 0.97 ? 'share' : 'member');

  const user = mockUser();

  switch (type) {
    case 'chat':
      return { type: 'chat', user, comment: rnd(MOCK_COMMENTS), ts: Date.now() };
    case 'gift': {
      // buyuk hediyeler nadir olsun: kucuk indekslere agirlik ver
      const idx = Math.min(MOCK_GIFTS.length - 1, Math.floor(Math.abs(gauss()) * 3));
      const g = MOCK_GIFTS[idx];
      const count = g.diamonds <= 10 ? 1 + Math.floor(Math.random() * 20) : 1;
      return {
        type: 'gift',
        user,
        gift: { ...g, count, value: g.diamonds * count, streaking: false },
        ts: Date.now(),
      };
    }
    case 'like': {
      const n = 1 + Math.floor(Math.random() * 15);
      state.mockTotalLikes = (state.mockTotalLikes || 0) + n;
      return { type: 'like', user, likes: n, totalLikes: state.mockTotalLikes, ts: Date.now() };
    }
    case 'viewers':
      return { type: 'viewers', count: 120 + Math.floor(Math.random() * 800), ts: Date.now() };
    default:
      return { type, user, ts: Date.now() };
  }
}

function gauss() {
  // Box-Muller: buyuk hediyeleri nadir kilmak icin
  const u = Math.random() || 1e-9;
  const v = Math.random() || 1e-9;
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

function startMock() {
  state.mode = 'mock';
  state.connected = true;
  log('MOCK modu: sahte olaylar uretiliyor (TikTok baglantisi yok)');

  const tick = () => {
    if (state.mode !== 'mock') return;          // kopar() cagrildiysa dur
    emit(makeMockEvent());
    mockZamanlayicilar.push(setTimeout(tick, (250 + Math.random() * 1400) / Math.max(0.1, args.rate)));
  };
  tick();

  mockZamanlayicilar.push(setInterval(() => emit(makeMockEvent('viewers')), 5000));
}

// ---------------------------------------------------------------------------
// Gercek TikTok baglantisi
// ---------------------------------------------------------------------------
async function startLive(username) {
  // Yeni nesil: onceki baglanti (varsa) birakilir, olaylari artik yok sayilir.
  baglantiyiBirak();
  tekrarIptal();
  const nesil = baglanti.nesil;
  const gecerli = () => nesil === baglanti.nesil;

  // tiktok-live-connector 2.x SADECE ESM. Bu dosya CommonJS oldugu icin
  // dinamik import() kullaniyoruz — require() ile v2'nin sinifina ulasilmiyor.
  let lib;
  try {
    lib = await import('tiktok-live-connector');
  } catch (e) {
    log('!! `tiktok-live-connector` yuklenemedi:', e?.message || e);
    log('   Kurmak icin:  cd server && npm install');
    log('   Simdilik MOCK moda dusuluyor.\n');
    startMock();
    return;
  }
  if (!gecerli()) return;       // import beklerken kullanici baska ada gecti

  const { TikTokLiveConnection, SignConfig } = lib;

  // Oda kimligi cozumleme zinciri: HTML -> TikTok API -> EulerStream. Son halka
  // UCRETLI ve yayin kapaliyken her yoklamada (15 sn) calisirdi. Kapat: HTML
  // ve API zaten yeterli, Euler'e sadece imzalama icin gidiyoruz.
  if (!baglanti.euler) {
    baglanti.euler = true;
    try {
      if (lib.RoomIdRouteConfig && lib.IsLiveRouteConfig) {
        lib.RoomIdRouteConfig.skipFetchRoomIdFromEulerRoute = true;
        lib.IsLiveRouteConfig.skipFetchRoomIdFromEulerRoute = true;
        log('EulerStream oda-kimligi yedegi kapatildi (ucretli uc; yalnizca imzalama kullanilir).');
      } else {
        log('uyari: RoomIdRouteConfig bulunamadi — EulerStream oda yedegi kapatilamadi (eski paket?).');
      }
    } catch (e) { log('Euler yedegi kapatilamadi:', e?.message || e); }
  }

  // Imzalama: TikTok'un webcast WebSocket adresi imzalanmak zorunda ve bunu
  // yapan tek surdurulen servis EulerStream. Anahtarsiz da calisiyor ama
  // limitler dusuk; ucretsiz anahtar (2500 istek/gun) fazlasiyla yeter.
  //   https://www.eulerstream.com  ->  API key al
  //   set EULER_API_KEY=xxxx    (ya da --key xxxx)
  const apiKey = args.key || process.env.EULER_API_KEY;
  // Yayin beklerken bu blok her 15 saniyede bir tekrar yazilirdi; ilk seferde
  // soylemek yeterli.
  if (!state.bekliyor && !baglanti.anahtarYazildi) {
    baglanti.anahtarYazildi = true;
    if (apiKey && SignConfig) {
      log('EulerStream imzalama anahtari ayarlandi.');
    } else {
      log('EulerStream anahtari yok — anonim limitle deneniyor.');
      log('  Limite takilirsan eulerstream.com uzerinden ucretsiz anahtar al,');
      log('  sonra:  set EULER_API_KEY=<anahtar>   (Windows CMD)');
    }
  }
  if (apiKey && SignConfig) SignConfig.apiKey = apiKey;

  let Ctor = TikTokLiveConnection;
  if (!Ctor) {
    // Cok eski surum: v1 API'si `legacy` alt yolunda duruyor
    try {
      Ctor = require('tiktok-live-connector/legacy').WebcastPushConnection;
      log('v1 (legacy) API kullaniliyor.');
    } catch { /* yok */ }
  }
  if (!Ctor) {
    log('!! Paket bulundu ama baglanti sinifi tanimlanamadi. MOCK moda dusuluyor.');
    startMock();
    return;
  }

  state.mode = 'live';
  let conn;
  try {
    // NOT: authenticateWs'i HIC vermiyoruz (varsayilan false) -> kutuphane
    // WebSocket el sikismasinda oturum cerezini (sessionid) GONDERMEZ, sadece
    // anonim cerezleri yollar. Oturum cerezi yalnizca sohbete yazarken
    // (sendMessage -> EulerStream) kullanilir.
    conn = new Ctor(username, {
      processInitialData: false,
      // enableExtendedGiftInfo, hediye KATALOGUNU ayri bir uctan cekiyor ve o uc
      // EulerStream'de ucretli. Kapaliyken hediye adi/elmas degeri yine mesajin
      // kendi icinden geliyor — sadece katalog ikonlari gelmiyor, overlay'ler
      // zaten emoji'ye dusuyor. Varsayilan KAPALI; istersen --gifts ile ac.
      enableExtendedGiftInfo: !!args.gifts,
    });
  } catch (e) {
    log('!! baglanti nesnesi kurulamadi:', e?.message || e);
    const k = tekrarPlanla(e, username);
    if (k) log('   ' + k.message);
    return;
  }

  // Olay adlari surumler arasi degisti (subscribe -> subNotify gibi). Enum
  // varsa oradan al, yoksa duz string kullan — ikisi de ayni degere cikiyor.
  const E = lib.WebcastEvent || {};
  const ALIASES = {
    subscribe: [E.SUB_NOTIFY, 'subNotify', 'subscribe'],
  };

  for (const [evName, fn] of Object.entries(NORMALIZERS)) {
    const names = ALIASES[evName] || [E[evName.toUpperCase()], evName];
    for (const n of new Set(names.filter(Boolean))) {
      conn.on(n, (data) => {
        if (!gecerli()) return;
        baglanti.sonVeri = Date.now();
        baglanti.sessizCarpan = 1;     // gercek olay geldi: bekci esigi normale doner
        try {
          const ev = fn(data || {});
          if (ev) emit(ev);
        } catch (e) {
          if (args.verbose) log('normalizasyon hatasi', n, e.message);
        }
      });
    }
  }
  // Ham kare: kalp atisi cevaplari dahil sunucudan gelen HER sey. Sessizlik
  // bekcisinin asil sinyali (yorum olmayan sessiz odada da akar).
  conn.on('websocketData', () => {
    if (!gecerli()) return;
    baglanti.sonVeri = Date.now();
    baglanti.kareSayisi++;
  });

  conn.on('streamEnd', () => {
    if (!gecerli()) return;
    state.connected = false;
    state.bekliyor = true;
    state.mode = 'bekliyor';
    bekciDurdur();
    // Yayin bitti diye programi kapatma; ayni oturumda tekrar yayin acabilir.
    const k = tekrarPlanla({ olay: 'streamEnd' }, username);
    log('yayin bitti — yeniden yayin beklemeye geciliyor.');
    if (!k) durumYayinla();
  });
  conn.on('disconnected', () => {
    if (!gecerli()) return;       // eski/kapatilmis baglanti: sessizce yut
    state.connected = false;
    bekciDurdur();
    if (Date.now() - baglanti.baglandiAt < SAGLAM_MS) baglanti.basarisiz = baglanti.kayit;
    // streamEnd zaten planladiysa (kutuphane ikisini art arda yollar) bu
    // cagri yok sayilir -> tek dongu.
    const k = tekrarPlanla({ olay: 'disconnected' }, username);
    durumYayinla();
    if (k) log('baglanti koptu — ' + k.message);
  });
  // Kutuphane hata olayinda cogu zaman Error degil, icinde tam stack olan bir
  // nesne yolluyor. Ham haliyle basilinca konsol okunmaz oluyor — ozetliyoruz.
  // Yayin beklerken zaten normal bir durum, hic basmiyoruz.
  conn.on('error', (e) => {
    if (!gecerli() || state.bekliyor) return;
    const ozet = e?.info || e?.message || e?.exception?.message || String(e);
    log('hata:', ozet);
  });

  canliBaglanti = conn;

  // Sohbet botu icin oturum cerezi: --oturum verildiyse kaydet, yoksa
  // ayarlardan oku. Cerez baglantinin cookie kavanozuna islenir ki
  // sendMessage kimligimizle ciksin.
  try {
    if (args.oturum) ayar.oturumKaydet(args.oturum, args.idc);
    const oturum = args.oturum ? { sessionId: args.oturum, idc: args.idc } : ayar.oturumOku();
    if (oturum?.sessionId && conn.webClient?.cookieJar?.setSessionBundle) {
      conn.webClient.cookieJar.setSessionBundle({
        type: 'cookie',
        value: { sessionId: oturum.sessionId, ttTargetIdc: oturum.idc || 'useast1a' },
      });
      if (!baglanti.oturumYazildi) {
        baglanti.oturumYazildi = true;
        log('bot: oturum cerezi islendi (sohbete yazma denenir; WebSocket el sikismasina GONDERILMEZ).');
      }
    }
  } catch (e) { log('bot: oturum islenemedi:', e?.message || e); }

  if (!state.bekliyor) log(`@${username} yayinina baglaniliyor...`);
  try {
    const st = await conn.connect();
    if (!gecerli()) {
      // Biz beklerken baska bir baglanti nesli basladi: bunu kapat, karisma.
      try { Promise.resolve(conn.disconnect()).catch(() => {}); } catch { /* kapali */ }
      return;
    }
    state.connected = true;
    if (state.bekliyor) log('YAYIN BASLADI — baglaniliyor.');
    state.bekliyor = false;
    state.denemeSayisi = 0;
    baglanti.tavsiye = false;
    baglanti.cevrimdisiAt = 0;
    baglanti.seyreltildi = false;
    baglanti.kayit = baglanti.basarisiz;     // erken kopma olursa geri donmek icin
    baglanti.basarisiz = 0;                  // basarili baglanti: geri cekilme sifirlandi
    baglanti.baglandiAt = Date.now();
    bekciKur(nesil, username);
    durumYayinla();
    log(`BAGLANDI  roomId=${st?.roomId ?? '?'}`);
  } catch (e) {
    if (!gecerli()) return;       // eski nesil: sonucu onemsiz
    state.connected = false;
    const msg = e?.message || String(e);
    const tur = yeniden.sinif(e);

    // --- YAYIN BEKLEME MODU ---------------------------------------------
    // Kullanici henuz yayinda degilse bu bir hata degil, sadece "daha
    // baslamadi" demek. Uygulamayi acik birakip yayina gecince kendiliginden
    // baglanmasi, yayin oncesi tek isi "programi ac" yapiyor.
    //
    // Yayin kapaliyken kutuphane iki farkli hata veriyor: bazen dogrudan
    // UserOfflineError, bazen de once oda kimligini bulamayip
    // "Failed to retrieve Room ID" diyor. Ikisi de "henuz yayinda degil"
    // demek, ikisinde de beklemeye geciyoruz.
    if (tur === 'cevrimdisi') {
      state.denemeSayisi = (state.denemeSayisi || 0) + 1;
      if (!state.bekliyor) {
        state.bekliyor = true;
        state.mode = 'bekliyor';
        log(`@${username} henuz yayinda degil — YAYIN BEKLENIYOR.`);
        log('   Yayina gectiginde kendiliginden baglanacak, bu pencereyi kapatma.');
      }
      // Uzun sure hic baglanamiyorsak kullanici adi yanlis yazilmis olabilir.
      // 20 deneme ~ 5 dakika; bir kez hatirlat, sonra yine sus.
      if (state.denemeSayisi === 20) {
        log(`   (${state.denemeSayisi} denemedir baglanamadim. Kullanici adini`);
        log(`    kontrol et: tiktok.com/@${username} calisiyor mu?)`);
      }
      // Sessizce tekrar dene; kullaniciyi log yagmuruna bogma
      tekrarPlanla(e, username);
      return;
    }

    state.bekliyor = false;
    state.denemeSayisi = 0;
    const ilkTavsiye = tur === 'ucretli' && !baglanti.tavsiye;
    const k = tekrarPlanla(e, username);

    if (tur === 'ucretli' && !ilkTavsiye) {
      // Tavsiye bir kez basildi; sonraki denemelerde tek satir.
      log('!! Baglanilamadi (ucretli plan):', msg.split('\n')[0]);
      if (k) log('   ' + k.message);
      return;
    }

    log('!! Baglanilamadi:', msg);
    log('');

    if (tur === 'ucretli') {
      baglanti.tavsiye = true;
      // En sik ve en can sikici durum: zincirin geri kalani calisiyor,
      // sadece imzalama paywall'a takiliyor.
      log('   >>> IMZALAMA PAYWALL <<<');
      log('   Oda bulundu, yayin canli, ama webcast adresini imzalayan servis');
      log('   (EulerStream) bu istegi ucretli plana kilitlemis.');
      log('');
      log('   Siradaki adimlar, ucuzdan pahaliya:');
      log('');
      log('   1) UCRETSIZ ANAHTAR DENE — anonim istek reddediliyor olabilir,');
      log('      anahtarli ucretsiz katman calisabilir:');
      log('        https://www.eulerstream.com  -> kaydol, API key al');
      log('        $env:EULER_API_KEY="<anahtar>"   (PowerShell)');
      log('        node server/bridge.js --user ' + username);
      log('');
      log('   2) TIKFINITY — imzalamayi kendisi hallediyor, bizim overlay\'ler');
      log('      onun yerel WebSocket\'ini zaten konusuyor. Kopruye gerek kalmaz:');
      log('        tikfinity.zerody.one -> Desktop uygulamasini kur, hesabina bagla');
      log('        sonra overlay\'i ac:  overlays/oyun.html?src=tikfinity&lite=1');
      log('        (TikFinity ws://127.0.0.1:21213 uzerinden yayin yapiyor)');
      log('');
      log('   3) Ucretli EulerStream plani — aylik ucret.');
    } else if (tur === 'limit') {
      log('   Imzalama limiti doldu. Ucretsiz anahtar al: https://www.eulerstream.com');
      log('   sonra:  $env:EULER_API_KEY="<anahtar>"');
    }

    log('');
    if (k) log('   ' + k.message + ' (kopru acik kalir, kendiliginden dener.)');
    log('   Overlay\'leri sahte veriyle denemeye devam:  node server/bridge.js --mock');
  }
}

// ---------------------------------------------------------------------------
// Baslat
// ---------------------------------------------------------------------------
/** Varsayilan tarayicida bir adres ac (Windows/mac/Linux). */
function tarayiciAc(url) {
  try {
    const { spawn } = require('child_process');
    const [cmd, cmdArgs] =
      process.platform === 'win32' ? ['cmd', ['/c', 'start', '', url]]
      : process.platform === 'darwin' ? ['open', [url]]
      : ['xdg-open', [url]];
    const cocuk = spawn(cmd, cmdArgs, { detached: true, stdio: 'ignore' });
    // spawn hatasi ASENKRON gelir: komut yoksa (Linux'ta xdg-open kurulu
    // degilse) 'error' olayi tetiklenir. Dinleyici koymazsak Node bunu
    // "unhandled error" sayip BUTUN KOPRUYU dusuruyor — yani yayin ortasinda
    // sunucu oluyor, sirf tarayici acilamadi diye. Yutup devam ediyoruz:
    // adres zaten konsolda yaziyor, elle yapistirilabilir.
    cocuk.on('error', () => {
      console.log('  [kopru] tarayici otomatik acilamadi — adresi elle ac:', url);
    });
    cocuk.unref();
  } catch { /* tarayici acilamadiysa adres zaten konsolda yaziyor */ }
}

// EXE olarak calisirken hicbir arguman yok: kullanici cift tikladi. O zaman
// kullanici adini sorup kaydediyoruz ve paneli kendimiz aciyoruz.
const TEK_DOSYA = varlik.SEA_MI;
if (TEK_DOSYA && !argVerildi('--tarayici')) args.tarayici = true;

function argVerildi(bayrak) {
  return process.argv.includes(bayrak);
}

// Varsayilan: SADECE bu bilgisayar (127.0.0.1 + ::1). --lan ile tum arayuzler.
const DINLE_ADRES = args.lan ? '0.0.0.0' : '127.0.0.1';

server.listen(args.port, DINLE_ADRES, async () => {
  const base = `http://localhost:${args.port}`;
  // TikTok LIVE Studio'nun "Link" kaynagi ham IP ve `localhost` yazimini
  // REDDEDIYOR; gercek bir alan adi istiyor. localtest.me herkese acik bir
  // alan adi ve DNS'i kalici olarak 127.0.0.1'e cozuluyor -> trafik yine
  // makineden disari cikmiyor ama dogrulamayi geciyor.
  const tls = `http://localtest.me:${args.port}`;

  console.log(`
  ================================================================
   TikTok LIVE koprusu ayakta
  ================================================================
   Kontrol paneli : ${base}/
      ^ Butun oyunlarin adresi, kopyala dugmeleriyle burada.
        Asagisini okumana gerek yok, panel yeter.

   Erisim : ${args.lan ? 'AGDAKI HERKES (--lan acik)' : 'sadece bu bilgisayar (127.0.0.1 / ::1)'}
     Izinli adlar : ${guv.liste().filter((x) => x !== 'null').join(', ')}, *.localtest.me
     Baska ad icin --host <ad>  |  agdaki cihazlar icin --lan
     Sessizlik bekcisi: ${Math.max(30, Number(args.sessiz) || 180)} sn veri gelmezse yeniden baglanir (--sessiz)

   >> LIVE Studio'ya nasil eklenir (Kaynak ekle > Link) <<
      "localhost" YAZMA, LIVE Studio kabul etmiyor. Bunu kullan:

     ${tls}/overlays/oyun.html?lite=1

      Sahneyi DIKEY (1080x1920) kur; yatay gerekirse adrese &yatay=1 ekle (gecici).

      TEK LINK YETER: oyun.html dort oyunu sirayla dondurur, gecisleri
      tur arasinda yapar, bos odada demo calistirir. Istersen oyunlari
      tek tek de ekleyebilirsin:

   >> Oyunlar — sohbet oynuyor, sen hicbir sey yapmiyorsun <<
     bilye.html   MISKET YARISI — yazana ozel misket, 10 etaplik uzun pist
     bilgi.html   soru cikar, A/B/C/D yaz — ILK dogru en cok puani alir
     pk.html      iki taraf kapisir (kedi vs kopek...), tarafini yaz, ittir
     at.html      8 sabit at, 1-8 yaz tahminini yap, carpan havuzdan
     (istege bagli 3D: halay + Duduklu — adrese &oyunlar=bilye,bilgi,pk,at,halay,tencere ekle; OBS'te donanim hizlandirma acik olmali)

      Hepsi kendi kendine donuyor: katilim penceresi acilir, oyun
      oynanir, kazanan cikar, yeni tur baslar. Mudahale gerekmiyor.

   >> Yan gosterge <<
     durum.html   disaridan cektigin veri (Valorant rank, hava, muzik)

     (?lite=1  -> LIVE Studio'nun gomulu tarayicisinda GPU yok,
                  blur/golge kapaniyor, akici kaliyor. HEP KULLAN.)
     (?v=1 / ?y=1 -> yonelimi elle zorla; normalde gerekmez)

   >> OBS icin (Tarayici Kaynagi) — seffaflik dogrudan calisir <<
     ${base}/overlays/oyun.html?lite=1   (dikey 1080x1920, tek link)

   localtest.me acilmiyorsa (modem DNS-rebind korumasi):
     tools\\hosts-ekle.ps1 dosyasini yonetici olarak calistir,
     sonra http://yayin.local:${args.port}/... kullan.
  ================================================================
`);

  if (args.lan) {
    log('!! UYARI: --lan acik — ayni agdaki HERKES paneli, sohbet olaylarini ve');
    log('   test/baglan/kapat dugmelerini kullanabilir. Sadece guvendigin agda kullan.');
    log('   Erisim adresleri: ' + (guv.lan.length ? guv.lan.map((ip) => `http://${ip}:${args.port}/`).join('  ') : '(LAN adresi bulunamadi)'));
  }

    // Dosyalar nereden okunuyor — sessiz kalirsa "guncelledim ama degismedi"
  // durumu tesbit edilemez oluyor.
  if (disKlasorYolu) {
    log('oyun dosyalari DIS KLASORDEN okunuyor:', disKlasorYolu);
    log('   (guncelleme icin exe degil, sadece bu klasoru degistir)');
  } else if (varlik.SEA_MI) {
    log('oyun dosyalari exe\'nin icinden okunuyor (gomulu surum).');
    log('   Guncellemede exe indirmek istemiyorsan: exe\'nin yanina');
    log('   guncel "overlays" klasorunu koy, otomatik onu kullanir.');
  }

  // Disaridan veri ceken kaynaklar (Valorant rank, hava, simdi calan...)
  // server/veri-kaynaklari.json varsa devreye giriyor.
  veriCekici = veri.baslat(emit, log);

  // Tek dosya modunda arguman yok — adi ayar dosyasindan al, yoksa sor.
  if (TEK_DOSYA && !args.mock && !args.user) {
    args.user = await ayar.kullaniciAdi(null);
  }

  // EXE olarak calisirken kullanicinin gorecegi tek sey konsol penceresi
  // olurdu; paneli kendimiz aciyoruz ki cift tiklayip devam etsin.
  if (args.tarayici) tarayiciAc(base + '/');

  if (args.mock || !args.user) {
    if (!args.mock) log('kullanici adi yok, TEST moduna geciliyor.');
    startMock();
  } else {
    startLive(args.user).catch((e) => {
      log('!! canli baglanti kurulamadi:', e?.message || e);
      startMock();
    });
  }
});

server.on('error', (e) => {
  if (e.code === 'EADDRINUSE') {
    console.error(`\n!! Port ${args.port} dolu. Baska bir port dene:  --port ${args.port + 1}\n`);
    process.exit(1);
  }
  throw e;
});

// ---------------------------------------------------------------------------
// Ek dinleyiciler: ::1 ve port 80
// ---------------------------------------------------------------------------
// 1) ::1 (IPv6 loopback). Windows'ta tarayici "localhost"u once ::1'e cozup
//    deneyebiliyor; sadece 127.0.0.1'i dinlersek ilk baglanti reddedilir ve
//    yedek adrese dusmesi tarayiciya/OBS surumune kalir. Sistemde IPv6 yoksa
//    (EADDRNOTAVAIL / EAFNOSUPPORT) sessizce geciyoruz.
// 2) Port 80 — LIVE Studio'nun Link kaynagindaki URL dogrulamasi hakkinda iki
//    farkli bulgu var: bir kaynak "port yazilabilir" diyor, digeri "acik port
//    da reddediliyor" diyor (surume gore degisiyor olabilir). Ikisini de
//    karsilamak icin ayni icerigi port 80'den de sunuyoruz ->
//    http://localtest.me/overlays/... seklinde hic port yazmadan da calisir.
//    Windows'ta 80'e baglanmak yonetici gerektirmez; dolu ise sessizce geciyoruz.
// Hepsi ayni isleyiciyi (ve ayni Host/Origin denetimini) paylasir.
function ekDinleyici(port, adres, acikla) {
  const alt = http.createServer((req, res) => server.emit('request', req, res));
  // upgrade isteklerini de ana sunucuya devret ki ws://localtest.me/ws calissin
  alt.on('upgrade', (req, socket, head) => server.emit('upgrade', req, socket, head));
  alt.on('error', (e) => {
    if (e.code === 'EADDRNOTAVAIL' || e.code === 'EAFNOSUPPORT') {
      if (args.verbose) log(`${acikla}: bu adres yok (${e.code}) — sorun degil.`);
    } else if (e.code === 'EADDRINUSE' || e.code === 'EACCES') {
      log(`${acikla} kullanilamadi (${e.code}) — sorun degil.`);
    } else {
      log(`${acikla} hatasi:`, e.code || e.message);
    }
  });
  alt.listen(port, adres, () => {
    if (port === 80) log(`ek dinleyici: ${acikla} acik  ->  http://localtest.me/overlays/alerts.html?lite=1`);
    else if (args.verbose) log(`ek dinleyici: ${acikla} acik`);
  });
}

ekDinleyici(args.port, '::1', `[::1]:${args.port}`);
if (args.port !== 80 && !args.no80) {
  ekDinleyici(80, DINLE_ADRES, `port 80 (${args.lan ? 'tum arayuzler' : '127.0.0.1'})`);
  ekDinleyici(80, '::1', 'port 80 ([::1])');
}
