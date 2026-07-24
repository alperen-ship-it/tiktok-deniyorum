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
const fs = require('fs');
const path = require('path');
const { attach } = require('./ws-mini');

// ---------------------------------------------------------------------------
// Argumanlar
// ---------------------------------------------------------------------------
function parseArgs(argv) {
  const out = { port: 8787, mock: false, user: null, verbose: false, rate: 1 };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--mock' || a === '-m') out.mock = true;
    else if (a === '--verbose' || a === '-v') out.verbose = true;
    else if (a === '--user' || a === '-u') out.user = String(argv[++i] || '').replace(/^@/, '');
    else if (a === '--port' || a === '-p') out.port = Number(argv[++i]) || out.port;
    else if (a === '--rate') out.rate = Number(argv[++i]) || 1;
    else if (a === '--key' || a === '-k') out.key = String(argv[++i] || '');
    else if (a === '--no-80') out.no80 = true;
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
  --key, -k <k>      EulerStream imzalama anahtari (ya da EULER_API_KEY ortam degiskeni)
  --no-80            Port 80'i da dinleme (varsayilan: dener)
  --verbose, -v      Her olayi konsola bas
`);
  process.exit(0);
}

const ROOT = path.resolve(__dirname, '..');

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

function safeJoin(root, urlPath) {
  const decoded = decodeURIComponent(urlPath.split('?')[0]);
  const target = path.resolve(root, '.' + decoded);
  // dizin disina cikma (path traversal) engeli
  if (target !== root && !target.startsWith(root + path.sep)) return null;
  return target;
}

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

  // Tarayici her origin icin bir kez /favicon.ico istiyor; overlay'de ikon
  // gereksiz ama 404 konsolu kirletiyor. Bos cevapla sus.
  if (urlPath === '/favicon.ico') {
    res.writeHead(204).end();
    return;
  }

  if (urlPath === '/api/status') {
    res.writeHead(200, { 'content-type': 'application/json', 'access-control-allow-origin': '*' });
    res.end(
      JSON.stringify({
        mode: state.mode,
        user: args.user,
        connected: state.connected,
        clients: wss.clients.size,
        events: state.eventCount,
        uptime: Math.round(process.uptime()),
      })
    );
    return;
  }

  let target = safeJoin(ROOT, urlPath);
  if (!target) {
    res.writeHead(403).end('403');
    return;
  }

  // / -> kontrol paneli
  if (urlPath === '/') target = path.join(ROOT, 'overlays', 'index.html');

  fs.stat(target, (err, st) => {
    if (!err && st.isDirectory()) target = path.join(target, 'index.html');

    fs.readFile(target, (err2, data) => {
      if (err2) {
        res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
        res.end('404 - bulunamadi: ' + urlPath);
        return;
      }
      res.writeHead(200, {
        'content-type': MIME[path.extname(target).toLowerCase()] || 'application/octet-stream',
        'cache-control': 'no-store',
        'access-control-allow-origin': '*',
      });
      res.end(data);
    });
  });
});

const wss = attach(server, {
  path: '/ws',
  onConnect(client) {
    client.send({ type: 'hello', mode: state.mode, user: args.user, ts: Date.now() });
    log(`overlay baglandi (toplam ${wss.clients.size})`);
  },
});

// ---------------------------------------------------------------------------
// Durum + log
// ---------------------------------------------------------------------------
const state = { mode: 'idle', connected: false, eventCount: 0 };

function log(...a) {
  console.log('[kopru]', ...a);
}

/** Normalize edilmis olayi tum overlay'lere yolla. */
function emit(ev) {
  ev.ts = ev.ts || Date.now();
  state.eventCount++;
  wss.broadcast(ev);
  if (args.verbose) {
    const who = ev.user?.nickname || ev.user?.uniqueId || '-';
    console.log(`  ${String(ev.type).padEnd(9)} ${who} ${ev.comment || ev.gift?.name || ev.likes || ''}`);
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
    emit(makeMockEvent());
    setTimeout(tick, (250 + Math.random() * 1400) / Math.max(0.1, args.rate));
  };
  tick();

  setInterval(() => emit(makeMockEvent('viewers')), 5000);
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
  if (apiKey && SignConfig) {
    SignConfig.apiKey = apiKey;
    log('EulerStream imzalama anahtari ayarlandi.');
  } else {
    log('EulerStream anahtari yok — anonim limitle deneniyor.');
    log('  Limite takilirsan eulerstream.com uzerinden ucretsiz anahtar al,');
    log('  sonra:  set EULER_API_KEY=<anahtar>   (Windows CMD)');
  }

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
    enableExtendedGiftInfo: true,   // giftDetails: ad, elmas degeri, ikon URL'i
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
    log('yayin bitti');
  });
  conn.on('disconnected', () => {
    state.connected = false;
    log('baglanti koptu, 10 sn sonra tekrar denenecek');
    setTimeout(() => conn.connect().catch(() => {}), 10000);
  });
  conn.on('error', (e) => log('hata:', e?.message || e));

  log(`@${username} yayinina baglaniliyor...`);
  try {
    const st = await conn.connect();
    state.connected = true;
    log(`BAGLANDI  roomId=${st?.roomId ?? '?'}`);
  } catch (e) {
    state.connected = false;
    const msg = e?.message || String(e);
    log('!! Baglanilamadi:', msg);
    if (/offline/i.test(msg)) {
      log('   Kullanici su an CANLI yayinda degil.');
    } else if (/rate.?limit|429/i.test(msg)) {
      log('   Imzalama limiti doldu. EulerStream ucretsiz anahtari al: https://www.eulerstream.com');
    }
    log('   Test icin sahte olaylarla devam:  node server/bridge.js --mock');
  }
}

// ---------------------------------------------------------------------------
// Baslat
// ---------------------------------------------------------------------------
server.listen(args.port, '0.0.0.0', () => {
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
   WebSocket      : ws://localhost:${args.port}/ws

   >> TikTok LIVE Studio icin (Kaynak ekle > Link) <<
      "localhost" YAZMA, kabul etmiyor. Bunlari kullan:

     ${tls}/overlays/alerts.html?lite=1
     ${tls}/overlays/chat.html?lite=1
     ${tls}/overlays/gift-rain.html?lite=1
     ${tls}/overlays/like-goal.html?lite=1
     ${tls}/overlays/battle.html?lite=1
     ${tls}/overlays/race.html?lite=1

     (?lite=1  -> LIVE Studio'nun gomulu tarayicisinda GPU yok,
                  blur/golge kapaniyor, akici kaliyor)
     (?v=1     -> 9:16 dikey yayin yerlesimi)

   >> OBS icin (Tarayici Kaynagi) — seffaflik dogrudan calisir <<
     ${base}/overlays/alerts.html
     ${base}/overlays/chat.html   ... vb.

   localtest.me acilmiyorsa (modem DNS-rebind korumasi):
     tools\\hosts-ekle.ps1 dosyasini yonetici olarak calistir,
     sonra http://yayin.local:${args.port}/... kullan.
  ================================================================
`);

  if (args.mock || !args.user) {
    if (!args.mock) log('--user verilmedi, mock moda geciliyor.');
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
