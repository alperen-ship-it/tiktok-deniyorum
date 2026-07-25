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

// ---------------------------------------------------------------------------
// Argumanlar
// ---------------------------------------------------------------------------
function parseArgs(argv) {
  const out = { port: 8787, mock: false, user: null, verbose: false, rate: 1, bekle: 15 };
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
    else if (a === '--oturum') out.oturum = String(argv[++i] || '');
    else if (a === '--idc') out.idc = String(argv[++i] || '');
    else if (a === '--help' || a === '-h') out.help = true;
  }
  return out;
}

const args = parseArgs(process.argv);

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
  --oturum <sid>     Sohbet botu icin TikTok sessionid cerezi (bir kez ver,
                     ayarlara kaydedilir). GERCEK sohbete yazmak ayrica
                     EulerStream'in ucretli planini gerektirir; yoksa bot
                     mesajlari sadece ekranda/konsolda gorunur.
  --idc <bolge>      tt-target-idc cerezi (varsayilan: useast1a)
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
  '.woff2': 'font/woff2',
  '.ico': 'image/x-icon',
};


const server = http.createServer((req, res) => {
  const urlPath = (req.url || '/').split('?')[0];

  // --- test olayi tetikleme ucu (kontrol paneli kullanir) ---
  if (urlPath === '/api/fire') {
    const q = new URL(req.url, 'http://localhost').searchParams;
    const type = q.get('type') || 'chat';
    const ev = makeMockEvent(type);
    const n = wss.broadcast(ev);
    res.writeHead(200, { 'content-type': 'application/json', 'access-control-allow-origin': '*' });
    res.end(JSON.stringify({ ok: true, sentTo: n, event: ev }));
    return;
  }

  // --- oyunlarin kazanan duyurusu (sohbet botu) ---
  if (urlPath === '/api/soyle') {
    const q = new URL(req.url, 'http://localhost').searchParams;
    const sonuc = botSoyle(q.get('text') || '');
    res.writeHead(200, { 'content-type': 'application/json', 'access-control-allow-origin': '*' });
    res.end(JSON.stringify(sonuc));
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
    res.writeHead(200, { 'content-type': 'application/json', 'access-control-allow-origin': '*' });

    if (!kullanici) {
      args.user = null;
      kopar();
      startMock();
      res.end(JSON.stringify({ ok: true, mode: 'mock' }));
      return;
    }

    args.user = kullanici;
    // Tek dosya modunda paneldeki degisiklik kalici olsun — bir dahaki
    // acilista tekrar sormayalim.
    if (varlik.SEA_MI) ayar.kullaniciKaydet(kullanici);
    kopar();
    startLive(kullanici).catch((e) => log('!! baglanti hatasi:', e?.message || e));
    res.end(JSON.stringify({ ok: true, mode: 'live', user: kullanici }));
    return;
  }

  // --- uygulamayi kapat (panelin "Durdur" dugmesi) ---
  if (urlPath === '/api/kapat') {
    res.writeHead(200, { 'content-type': 'application/json', 'access-control-allow-origin': '*' });
    res.end(JSON.stringify({ ok: true }));
    log('kapatma istegi alindi, cikiliyor.');
    // Cevabin gitmesine firsat ver
    setTimeout(() => process.exit(0), 250);
    return;
  }

  if (urlPath === '/api/status') {
    res.writeHead(200, { 'content-type': 'application/json', 'access-control-allow-origin': '*' });
    res.end(
      JSON.stringify({
        mode: state.mode,
        user: args.user,
        connected: state.connected,
        bekliyor: !!state.bekliyor,
        clients: wss.clients.size,
        events: state.eventCount,
        uptime: Math.round(process.uptime()),
        veriKaynaklari: veriCekici ? veriCekici.kaynaklar() : [],
      })
    );
    return;
  }

  // --- statik dosyalar -----------------------------------------------------
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
    'access-control-allow-origin': '*',
  });
  res.end(govde);
});

const wss = attach(server, {
  path: '/ws',
  onConnect(client) {
    client.send({
      type: 'hello',
      mode: state.mode,
      user: args.user,
      connected: state.connected,
      bekliyor: !!state.bekliyor,
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
  if (canliBaglanti) {
    try { canliBaglanti.disconnect(); } catch { /* zaten kapali */ }
    canliBaglanti = null;
  }
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

  const { TikTokLiveConnection, SignConfig } = lib;

  // Imzalama: TikTok'un webcast WebSocket adresi imzalanmak zorunda ve bunu
  // yapan tek surdurulen servis EulerStream. Anahtarsiz da calisiyor ama
  // limitler dusuk; ucretsiz anahtar (2500 istek/gun) fazlasiyla yeter.
  //   https://www.eulerstream.com  ->  API key al
  //   set EULER_API_KEY=xxxx    (ya da --key xxxx)
  const apiKey = args.key || process.env.EULER_API_KEY;
  // Yayin beklerken bu blok her 15 saniyede bir tekrar yazilirdi; ilk seferde
  // soylemek yeterli.
  if (!state.bekliyor) {
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
  const conn = new Ctor(username, {
    processInitialData: false,
    // enableExtendedGiftInfo, hediye KATALOGUNU ayri bir uctan cekiyor ve o uc
    // EulerStream'de ucretli. Kapaliyken hediye adi/elmas degeri yine mesajin
    // kendi icinden geliyor — sadece katalog ikonlari gelmiyor, overlay'ler
    // zaten emoji'ye dusuyor. Varsayilan KAPALI; istersen --gifts ile ac.
    enableExtendedGiftInfo: !!args.gifts,
  });

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
        try {
          const ev = fn(data || {});
          if (ev) emit(ev);
        } catch (e) {
          if (args.verbose) log('normalizasyon hatasi', n, e.message);
        }
      });
    }
  }

  conn.on('streamEnd', () => {
    state.connected = false;
    log('yayin bitti — yeniden yayin beklemeye geciliyor.');
    durumYayinla();
    // Yayin bitti diye programi kapatma; ayni oturumda tekrar yayin acabilir.
    const tekrar = setTimeout(() => {
      if (args.user === username) startLive(username).catch(() => {});
    }, Math.max(10, Number(args.bekle) || 15) * 1000);
    mockZamanlayicilar.push(tekrar);
  });
  conn.on('disconnected', () => {
    state.connected = false;
    durumYayinla();
    log('baglanti koptu, 10 sn sonra tekrar denenecek');
    setTimeout(() => conn.connect().catch(() => {}), 10000);
  });
  // Kutuphane hata olayinda cogu zaman Error degil, icinde tam stack olan bir
  // nesne yolluyor. Ham haliyle basilinca konsol okunmaz oluyor — ozetliyoruz.
  // Yayin beklerken zaten normal bir durum, hic basmiyoruz.
  conn.on('error', (e) => {
    if (state.bekliyor) return;
    const ozet = e?.info || e?.message || e?.exception?.message || String(e);
    log('hata:', ozet);
  });

  // Onceki deneme kalintisi kalmasin — her tekrar denemede yeni bir baglanti
  // nesnesi kuruluyor, eskisi arkada sessizce ugrasmaya devam etmesin.
  if (canliBaglanti && canliBaglanti !== conn) {
    try { canliBaglanti.disconnect(); } catch { /* zaten kapali */ }
  }
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
      log('bot: oturum cerezi islendi (sohbete yazma denenir).');
    }
  } catch (e) { log('bot: oturum islenemedi:', e?.message || e); }

  if (!state.bekliyor) log(`@${username} yayinina baglaniliyor...`);
  try {
    const st = await conn.connect();
    state.connected = true;
    if (state.bekliyor) log('YAYIN BASLADI — baglaniliyor.');
    state.bekliyor = false;
    durumYayinla();
    log(`BAGLANDI  roomId=${st?.roomId ?? '?'}`);
  } catch (e) {
    state.connected = false;
    const msg = e?.message || String(e);

    // --- YAYIN BEKLEME MODU ---------------------------------------------
    // Kullanici henuz yayinda degilse bu bir hata degil, sadece "daha
    // baslamadi" demek. Uygulamayi acik birakip yayina gecince kendiliginden
    // baglanmasi, yayin oncesi tek isi "programi ac" yapiyor.
    //
    // Yayin kapaliyken kutuphane iki farkli hata veriyor: bazen dogrudan
    // UserOfflineError, bazen de once oda kimligini bulamayip
    // "Failed to retrieve Room ID" diyor. Ikisi de "henuz yayinda degil"
    // demek, ikisinde de beklemeye geciyoruz.
    if (/offline|room ?id/i.test(msg)) {
      state.denemeSayisi = (state.denemeSayisi || 0) + 1;
      if (!state.bekliyor) {
        state.bekliyor = true;
        state.mode = 'bekliyor';
        log(`@${username} henuz yayinda degil — YAYIN BEKLENIYOR.`);
        log('   Yayina gectiginde kendiliginden baglanacak, bu pencereyi kapatma.');
        durumYayinla();
      }
      // Uzun sure hic baglanamiyorsak kullanici adi yanlis yazilmis olabilir.
      // 20 deneme ~ 5 dakika; bir kez hatirlat, sonra yine sus.
      if (state.denemeSayisi === 20) {
        log(`   (${state.denemeSayisi} denemedir baglanamadim. Kullanici adini`);
        log(`    kontrol et: tiktok.com/@${username} calisiyor mu?)`);
      }
      // Sessizce tekrar dene; kullaniciyi log yagmuruna bogma
      const tekrar = setTimeout(() => {
        if (args.user === username) startLive(username).catch(() => {});
      }, Math.max(10, Number(args.bekle) || 15) * 1000);
      mockZamanlayicilar.push(tekrar);
      return;
    }

    state.bekliyor = false;
    state.denemeSayisi = 0;
    log('!! Baglanilamadi:', msg);
    log('');

    if (/Business plan|requires a .*plan|MissingTokens/i.test(msg)) {
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
      log('        sonra overlay\'i ac:  overlays/chat.html?src=tikfinity');
      log('        (TikFinity ws://127.0.0.1:21213 uzerinden yayin yapiyor)');
      log('');
      log('   3) Ucretli EulerStream plani — aylik ucret.');
    } else if (/rate.?limit|429/i.test(msg)) {
      log('   Imzalama limiti doldu. Ucretsiz anahtar al: https://www.eulerstream.com');
      log('   sonra:  $env:EULER_API_KEY="<anahtar>"');
    }

    log('');
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

server.listen(args.port, '0.0.0.0', async () => {
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

   >> LIVE Studio'ya nasil eklenir (Kaynak ekle > Link) <<
      "localhost" YAZMA, LIVE Studio kabul etmiyor. Bunu kullan:

     ${tls}/overlays/bilye.html?lite=1

      AYNI adresi HEM "Portrait" HEM "Landscape" bolumune ekle.
      Sayfa kendi en-boy oranini olcup yerlesimini kendi degistiriyor;
      iki sahne icin iki ayri adrese ihtiyacin yok.

   >> Oyunlar — sohbet oynuyor, sen hicbir sey yapmiyorsun <<
     bilye.html   yazana OZEL bilye (kalici renk+desen), pist asagi yaris
     kalan.html   battle royale: bolge daralir, "N KALDI" geriye sayar
     at.html      8 sabit at, 1-8 yaz bahis oyna, oranlar havuzdan

      Ucu de kendi kendine donuyor: katilim penceresi acilir, oyun
      oynanir, kazanan cikar, yeni tur baslar. Mudahale gerekmiyor.

   >> Yan gosterge <<
     durum.html   disaridan cektigin veri (Valorant rank, hava, muzik)

     (?lite=1  -> LIVE Studio'nun gomulu tarayicisinda GPU yok,
                  blur/golge kapaniyor, akici kaliyor. HEP KULLAN.)
     (?v=1 / ?y=1 -> yonelimi elle zorla; normalde gerekmez)

   >> OBS icin (Tarayici Kaynagi) — seffaflik dogrudan calisir <<
     ${base}/overlays/labirent.html   ... vb.

   localtest.me acilmiyorsa (modem DNS-rebind korumasi):
     tools\\hosts-ekle.ps1 dosyasini yonetici olarak calistir,
     sonra http://yayin.local:${args.port}/... kullan.
  ================================================================
`);

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
// Ikinci dinleyici: port 80
// ---------------------------------------------------------------------------
// LIVE Studio'nun Link kaynagindaki URL dogrulamasi hakkinda iki farkli bulgu
// var: bir kaynak "port yazilabilir" diyor, digeri "acik port da reddediliyor"
// diyor (surume gore degisiyor olabilir). Ikisini de karsilamak icin ayni
// icerigi port 80'den de sunuyoruz -> http://localtest.me/overlays/... seklinde
// hic port yazmadan da calisir.
// Windows'ta 80'e baglanmak yonetici gerektirmez; dolu ise sessizce geciyoruz.
if (args.port !== 80 && !args.no80) {
  const alt = http.createServer((req, res) => server.emit('request', req, res));
  // upgrade isteklerini de ana sunucuya devret ki ws://localtest.me/ws calissin
  alt.on('upgrade', (req, socket, head) => server.emit('upgrade', req, socket, head));
  alt.on('error', (e) => {
    if (e.code === 'EADDRINUSE' || e.code === 'EACCES') {
      log(`port 80 kullanilamadi (${e.code}) — sorun degil, ${args.port} portu yeterli.`);
    }
  });
  alt.listen(80, '0.0.0.0', () => {
    log('ek dinleyici: port 80 acik  ->  http://localtest.me/overlays/alerts.html?lite=1');
  });
}
