/**
 * tt.js — TikTok overlay'leri icin ortak istemci kutuphanesi.
 *
 * Uc modda calisir:
 *   1) Kopru sunucusu acikken   -> ws://<host>/ws  uzerinden gercek olaylar
 *   2) ?mock=1                  -> tarayicinin kendisi sahte olay uretir
 *                                  (sunucu gerekmez, file:// ile bile calisir)
 *   3) postMessage              -> baska bir sayfa iframe icine olay enjekte edebilir
 *
 * URL parametreleri
 *   ?mock=1          sahte olay uret
 *   ?rate=2          mock olay hizi carpani
 *   ?bg=green        arka plan rengi — pencere yakalamada seffaflik yok, chroma key icin
 *                    green | magenta | blue | black | #RRGGBB
 *   ?scale=1.4       tum overlay'i buyut/kucult
 *   ?debug=1         sag altta baglanti gostergesi + konsol logu
 *   ?port=8787      kopru portu (varsayilan 8787)
 *
 * Kullanim:
 *   TT.on('gift', ev => { ... });
 *   TT.on('*',    ev => { ... });   // her olay
 */
(function (global) {
  'use strict';

  // -------------------------------------------------------------------------
  // Ayarlar
  // -------------------------------------------------------------------------
  const q = new URLSearchParams(location.search);
  const num = (k, d) => (q.has(k) ? Number(q.get(k)) || d : d);
  const flag = (k) => q.get(k) === '1' || q.get(k) === 'true';

  const CHROMA = {
    green: '#00b140',   // yayin standardi yesil
    magenta: '#ff00ff',
    blue: '#0000fe',
    black: '#000000',
    white: '#ffffff',
  };

  const cfg = {
    mock: flag('mock'),
    rate: num('rate', 1),
    scale: num('scale', 1),
    debug: flag('debug'),
    port: num('port', 8787),
    bg: q.get('bg'),
    max: num('max', 0),
    // TikTok LIVE Studio'nun gomulu tarayicisinda GPU hizlandirma yok.
    // lite modda blur/golge/backdrop-filter kapanir, kare hizi kurtulur.
    lite: flag('lite'),
    // 9:16 dikey yayin yerlesimi
    vertical: flag('v') || flag('vertical'),
  };

  // -------------------------------------------------------------------------
  // Arka plan / olcek
  // -------------------------------------------------------------------------
  function applyChrome() {
    const root = document.documentElement;

    // LIVE Studio'nun Link kaynagi yazilim render yapiyor: agir efektler
    // saniyede 5 kareye dusuruyor. lite modda hepsini kapatiyoruz.
    if (cfg.lite) root.classList.add('tt-lite');
    if (cfg.vertical) root.classList.add('tt-vertical');

    if (cfg.bg) {
      const color = CHROMA[cfg.bg.toLowerCase()] || (cfg.bg.startsWith('#') ? cfg.bg : '#' + cfg.bg);
      document.body.style.background = color;
      root.style.background = color;
      root.classList.add('tt-chroma');
    }
    if (cfg.scale !== 1) {
      root.style.setProperty('--tt-scale', cfg.scale);
      document.body.style.zoom = cfg.scale; // Chromium'da en pratik olcekleme
    }
  }

  // -------------------------------------------------------------------------
  // Olay veriyolu
  // -------------------------------------------------------------------------
  const handlers = new Map(); // type -> Set<fn>

  function on(type, fn) {
    const types = Array.isArray(type) ? type : String(type).split(/[\s,]+/);
    for (const t of types) {
      if (!handlers.has(t)) handlers.set(t, new Set());
      handlers.get(t).add(fn);
    }
    return () => off(type, fn);
  }

  function off(type, fn) {
    const types = Array.isArray(type) ? type : String(type).split(/[\s,]+/);
    for (const t of types) handlers.get(t)?.delete(fn);
  }

  function dispatch(ev) {
    if (!ev || !ev.type) return;
    if (cfg.debug) console.log('[TT]', ev.type, ev);
    for (const fn of handlers.get(ev.type) || []) {
      try { fn(ev); } catch (e) { console.error('[TT] handler hatasi', e); }
    }
    for (const fn of handlers.get('*') || []) {
      try { fn(ev); } catch (e) { console.error('[TT] handler hatasi', e); }
    }
  }

  // -------------------------------------------------------------------------
  // WebSocket baglantisi (otomatik yeniden baglanma)
  // -------------------------------------------------------------------------
  let ws = null;
  let retry = 0;
  let status = 'off';
  let candidateIdx = 0;

  function setStatus(s) {
    status = s;
    if (dot) {
      dot.dataset.status = s;
      dot.title = 'TT: ' + s;
    }
  }

  /**
   * Iki farkli olay kaynagini da konusuyoruz:
   *
   *  1) "bridge"    — bu depodaki server/bridge.js. Olaylari zaten normalize
   *                   edilmis halde yolluyor, oldugu gibi gecir.
   *  2) "tikfinity" — TikFinity Desktop'un yerel gelistirici WebSocket'i
   *                   (varsayilan ws://127.0.0.1:21213/). Zarf sekli
   *                   {event, data} ve alan adlari farkli -> cevirmek gerek.
   *
   * TikFinity kuruluysa hicbir imzalama/API anahtari derdi olmadan calisir.
   *
   * ONEMLI: sayfa LIVE Studio'nun Link kaynagi icinde acildiysa, WebSocket
   * adresi de sayfanin yuklendigi HOST ile ayni olmali. Sayfa
   * localtest.me'den geldiyse 127.0.0.1'e baglanmaya calismak engelleniyor
   * ve overlay sessizce bos kaliyor. Bu yuzden host'u location'dan turetiyoruz.
   */
  function candidates() {
    const httpMode = location.protocol.startsWith('http');
    const proto = location.protocol === 'https:' ? 'wss' : 'ws';
    // Sayfa nereden yuklendiyse WS de oradan gitsin (LIVE Studio kisitlamasi)
    const selfHost = httpMode ? location.hostname : '127.0.0.1';
    const forced = (q.get('src') || '').toLowerCase();

    const bridge = {
      kind: 'bridge',
      url: httpMode
        ? `${proto}://${location.host}/ws`
        : `ws://127.0.0.1:${cfg.port}/ws`,
    };
    const tikfinity = {
      kind: 'tikfinity',
      url: `${proto}://${selfHost}:${num('tfport', 21213)}/`,
    };

    if (forced === 'bridge') return [bridge];
    if (forced === 'tikfinity' || forced === 'tf') return [tikfinity];
    return [bridge, tikfinity];
  }

  let list = [];

  function connect() {
    if (!list.length) list = candidates();
    const target = list[candidateIdx % list.length];

    setStatus('connecting');
    try {
      ws = new WebSocket(target.url);
    } catch {
      scheduleReconnect();
      return;
    }

    let opened = false;

    ws.onopen = () => {
      opened = true;
      retry = 0;
      setStatus('live');
      if (cfg.debug) console.log('[TT] baglandi:', target.kind, target.url);
    };

    ws.onmessage = (m) => {
      let raw;
      try { raw = JSON.parse(m.data); } catch { return; }   // bozuk paket, gec
      const ev = target.kind === 'tikfinity' ? fromTikFinity(raw) : raw;
      if (ev) dispatch(ev);
    };

    ws.onerror = () => { /* onclose zaten tetiklenecek */ };

    ws.onclose = () => {
      setStatus('off');
      // Bu aday hic acilmadiysa siradakini dene; acilip sonra koptuysa
      // ayni adaya yeniden baglan.
      if (!opened) candidateIdx++;
      scheduleReconnect();
    };
  }

  function scheduleReconnect() {
    retry = Math.min(retry + 1, 8);
    const delay = Math.min(400 * 2 ** (retry - 1), 12000); // ustel geri cekilme
    setTimeout(connect, delay);
  }

  // -------------------------------------------------------------------------
  // TikFinity zarfini bizim semaya cevir
  // -------------------------------------------------------------------------
  function fromTikFinity(msg) {
    const name = msg?.event;
    const d = msg?.data || {};
    if (!name || name === 'config') return null;

    const user = {
      id: String(d.userId ?? d.uniqueId ?? d.username ?? ''),
      uniqueId: d.uniqueId ?? d.username ?? 'anon',
      nickname: d.nickname ?? d.uniqueId ?? d.username ?? 'anon',
      avatar: d.profilePictureUrl ?? '',
      isModerator: !!d.isModerator,
      isSubscriber: !!d.isSubscriber,
      followRole: d.followRole ?? 0,
    };

    switch (name) {
      case 'chat':
        return { type: 'chat', user, comment: d.comment ?? d.message ?? '', ts: Date.now() };

      case 'gift': {
        const count = Number(d.repeatCount ?? 1);
        const diamonds = Number(d.diamondCount ?? 0);
        // TikFinity de seri hediyeleri ham haliyle geciriyor: giftType 1 ve
        // repeatEnd false ise seri devam ediyor demek, sayma.
        const streaking = d.giftType === 1 && !d.repeatEnd;
        return {
          type: 'gift', user, ts: Date.now(),
          gift: {
            id: d.giftId ?? 0,
            name: d.giftName ?? 'Hediye',
            image: d.giftPictureUrl ?? '',
            diamonds, count,
            value: Number(d.coins ?? diamonds * count),
            streaking,
          },
        };
      }

      case 'like':
        return {
          type: 'like', user, ts: Date.now(),
          likes: Number(d.likeCount ?? 1),
          totalLikes: Number(d.totalLikeCount ?? 0),
        };

      case 'follow':    return { type: 'follow', user, ts: Date.now() };
      case 'share':     return { type: 'share', user, ts: Date.now() };
      case 'subscribe': return { type: 'subscribe', user, ts: Date.now() };
      case 'member':
      case 'join':      return { type: 'member', user, ts: Date.now() };

      case 'roomUser':
      case 'viewer':
        return { type: 'viewers', count: Number(d.viewerCount ?? 0), ts: Date.now() };

      case 'social': {
        const t = String(d.displayType ?? d.label ?? '');
        if (t.includes('follow')) return { type: 'follow', user, ts: Date.now() };
        if (t.includes('share')) return { type: 'share', user, ts: Date.now() };
        return null;
      }

      default:
        return null;   // modelleMEdigimiz olaylari sessizce yut
    }
  }

  // -------------------------------------------------------------------------
  // Tarayici icinde sahte olay ureteci (sunucusuz mod)
  // -------------------------------------------------------------------------
  const NAMES = ['ayse_k','mehmet61','zeynep.dev','burak_yldz','elif__','cansu35','emrehan',
    'deniz_ok','seda_nur','kaan.06','melis','tolga_34','gamer_baba','pixelperi','noobmaster',
    'sude','arda_tr','yagmur','can_34','pelin'];
  const COMMENTS = ['selam herkese','bu ne ya 😂','takip ettim','A','B','a','b','katıl bize',
    'nasıl yaptın onu','ilk ben geldim','kral','ses gelmiyor','🔥🔥🔥','yarın yayın var mı',
    'abi bi selam ver','B takım kazanır','A A A','çok iyiydi','link atar mısın','valla helal'];
  const GIFTS = [
    { id: 5655, name: 'Gül',           diamonds: 1,     emoji: '🌹' },
    { id: 5827, name: 'GG',            diamonds: 1,     emoji: '🎮' },
    { id: 6064, name: 'Kalp',          diamonds: 5,     emoji: '❤️' },
    { id: 6247, name: 'Parmak Kalp',   diamonds: 5,     emoji: '🫰' },
    { id: 5586, name: 'Kahve',         diamonds: 10,    emoji: '☕' },
    { id: 6427, name: 'Donut',         diamonds: 30,    emoji: '🍩' },
    { id: 5658, name: 'Panda',         diamonds: 99,    emoji: '🐼' },
    { id: 6093, name: 'Roket',         diamonds: 500,   emoji: '🚀' },
    { id: 5269, name: 'Kral Tacı',     diamonds: 1000,  emoji: '👑' },
    { id: 5789, name: 'Aslan',         diamonds: 2999,  emoji: '🦁' },
    { id: 6888, name: 'TikTok Evreni', diamonds: 34999, emoji: '🌌' },
  ];

  const pick = (a) => a[(Math.random() * a.length) | 0];

  function avatarFor(seed) {
    let h = 0;
    for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
    const svg =
      `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96">` +
      `<rect width="96" height="96" rx="48" fill="hsl(${h % 360} 70% 45%)"/>` +
      `<text x="48" y="63" font-family="system-ui,sans-serif" font-size="46" font-weight="700" ` +
      `fill="#fff" text-anchor="middle">${(seed[0] || '?').toUpperCase()}</text></svg>`;
    return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
  }

  function mockUser() {
    const u = pick(NAMES);
    return {
      id: u, uniqueId: u, nickname: u, avatar: avatarFor(u),
      isModerator: Math.random() < 0.05,
      isSubscriber: Math.random() < 0.15,
      followRole: Math.random() < 0.4 ? 1 : 0,
    };
  }

  let mockLikes = 0;

  function mockEvent(force) {
    const r = Math.random();
    const type = force || (r < 0.45 ? 'chat' : r < 0.7 ? 'like' : r < 0.86 ? 'gift'
      : r < 0.93 ? 'follow' : r < 0.97 ? 'share' : 'member');
    const user = mockUser();

    if (type === 'chat') return { type, user, comment: pick(COMMENTS), ts: Date.now() };
    if (type === 'gift') {
      // buyuk hediyeler nadir olsun
      const g = GIFTS[Math.min(GIFTS.length - 1, (Math.abs(gauss()) * 3) | 0)];
      const count = g.diamonds <= 10 ? 1 + ((Math.random() * 20) | 0) : 1;
      return { type, user, gift: { ...g, image: '', count, value: g.diamonds * count, streaking: false }, ts: Date.now() };
    }
    if (type === 'like') {
      const n = 1 + ((Math.random() * 15) | 0);
      mockLikes += n;
      return { type, user, likes: n, totalLikes: mockLikes, ts: Date.now() };
    }
    if (type === 'viewers') return { type, count: 120 + ((Math.random() * 800) | 0), ts: Date.now() };
    return { type, user, ts: Date.now() };
  }

  function gauss() {
    const u = Math.random() || 1e-9, v = Math.random() || 1e-9;
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  }

  function startMock() {
    setStatus('mock');
    const tick = () => {
      dispatch(mockEvent());
      setTimeout(tick, (250 + Math.random() * 1400) / Math.max(0.1, cfg.rate));
    };
    setTimeout(tick, 400);
    setInterval(() => dispatch(mockEvent('viewers')), 5000);
  }

  // -------------------------------------------------------------------------
  // Debug gostergesi
  // -------------------------------------------------------------------------
  let dot = null;
  function makeDot() {
    dot = document.createElement('div');
    dot.id = 'tt-status';
    dot.style.cssText =
      'position:fixed;right:8px;bottom:8px;width:10px;height:10px;border-radius:50%;' +
      'z-index:2147483647;box-shadow:0 0 0 2px rgba(0,0,0,.4);pointer-events:none;' +
      'background:#888;transition:background .3s';
    const css = document.createElement('style');
    css.textContent =
      '#tt-status[data-status="live"]{background:#22c55e}' +
      '#tt-status[data-status="mock"]{background:#f59e0b}' +
      '#tt-status[data-status="connecting"]{background:#3b82f6}' +
      '#tt-status[data-status="off"]{background:#ef4444}';
    document.head.appendChild(css);
    document.body.appendChild(dot);
    setStatus(status);
  }

  // -------------------------------------------------------------------------
  // Yardimcilar (overlay'ler kullaniyor)
  // -------------------------------------------------------------------------
  const util = {
    /** XSS kalkani — yorumlar kullanicidan geliyor, asla ham HTML basma. */
    esc(s) {
      return String(s ?? '').replace(/[&<>"']/g, (c) =>
        ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    },
    avatar(user) {
      return user?.avatar || avatarFor(user?.uniqueId || user?.nickname || '?');
    },
    /** Hediyenin gorseli yoksa elmas degerine gore bir emoji uydur. */
    giftEmoji(gift) {
      if (gift?.emoji) return gift.emoji;
      const d = gift?.diamonds || 0;
      if (d >= 10000) return '🌌';
      if (d >= 1000) return '👑';
      if (d >= 500) return '🚀';
      if (d >= 99) return '🐼';
      if (d >= 30) return '🍩';
      if (d >= 10) return '☕';
      if (d >= 5) return '❤️';
      return '🌹';
    },
    /** 1234 -> "1.2B" (Turkce kisaltma) */
    short(n) {
      n = Number(n) || 0;
      if (n >= 1e9) return (n / 1e9).toFixed(1).replace(/\.0$/, '') + 'Mr';
      if (n >= 1e6) return (n / 1e6).toFixed(1).replace(/\.0$/, '') + 'M';
      if (n >= 1e3) return (n / 1e3).toFixed(1).replace(/\.0$/, '') + 'B';
      return String(n);
    },
    /** Kullanici adindan sabit bir renk uret (ayni kisi hep ayni renk). */
    hue(seed) {
      let h = 0;
      const s = String(seed || '');
      for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
      return h % 360;
    },
    /** requestAnimationFrame tabanli oyun dongusu; dt saniye cinsinden. */
    loop(fn) {
      let last = performance.now();
      const step = (now) => {
        const dt = Math.min((now - last) / 1000, 0.1); // sekme arka plandayken sicramasin
        last = now;
        fn(dt, now);
        requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    },
  };

  // -------------------------------------------------------------------------
  // Baslat
  // -------------------------------------------------------------------------
  function boot() {
    applyChrome();
    if (cfg.debug) makeDot();

    // Baska sayfalardan olay enjeksiyonu (kontrol paneli onizlemesi bunu kullanir)
    global.addEventListener('message', (e) => {
      if (e.data && e.data.__tt) dispatch(e.data.event);
    });

    if (cfg.mock) startMock();
    else connect();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  global.TT = {
    cfg, on, off,
    /** Elle olay tetikle (test / oyun ici). */
    fire: dispatch,
    mockEvent,
    get status() { return status; },
    ...util,
  };
})(window);
