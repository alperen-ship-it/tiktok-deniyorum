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

  // Bu dosyanin bulundugu klasor (".../overlays/_shared/"). Sprite'lari buna
  // gore ariyoruz: sayfanin kendisi hangi klasorde olursa olsun dogru yeri
  // bulsun diye. document.currentScript SADECE script yuklenirken dolu, o
  // yuzden burada, en ustte yakalamak zorundayiz.
  const KOK = (function () {
    const s = document.currentScript && document.currentScript.src;
    return s ? s.replace(/\/[^/]*$/, '/') : '_shared/';
  })();

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
    // Oyunlarda arkayi karartan perde (okunakliligi garantiler)
    perde: flag('perde'),
    // Olu bolge (dead zone) paylari — TikTok'un kendi arayuzunun kapladigi yer
    dz: {
      ust: q.get('dzust'),
      alt: q.get('dzalt'),
      sag: q.get('dzsag'),
      sol: q.get('dzsol'),
    },
    guvenli: flag('guvenli'),
  };

  // -------------------------------------------------------------------------
  // Arka plan / olcek
  // -------------------------------------------------------------------------
  function applyChrome() {
    const root = document.documentElement;

    // LIVE Studio'nun Link kaynagi yazilim render yapiyor: agir efektler
    // saniyede 5 kareye dusuruyor. lite modda hepsini kapatiyoruz.
    if (cfg.lite) root.classList.add('tt-lite');

    // --- Yon: elle degil, OLCEREK belirle ---------------------------------
    // LIVE Studio'nun dual layout'unda ayni Link kaynagi hem dikey hem yatay
    // sahnede gorunuyor ve icerigini degistiremiyorsun — sadece kutunun
    // boyutu degisiyor. O yuzden sayfa kendi oranina bakip uyum saglamali.
    // ?v=1 / ?y=1 ile zorlanabilir; verilmezse otomatik.
    function yonBelirle() {
      // ARTIK SADECE YATAY. Oyunlar sabit 1920x1080 bir tasarim alanina
      // ciziliyor ve tek bir scale ile ekrana sigdiriliyor. Boylece her sey
      // piksel cinsinden tasarlanabiliyor; yuzde matematigi ve iki ayri
      // yerlesim dali gerekmiyor.
      //
      // Eski dikey/yatay olcumu ?v=1 ile hala zorlanabiliyor cunku ESKI
      // overlay'ler (alerts, chat, race...) o siniflara gore yazilmisti;
      // yeni oyunlar tt-sabit kullaniyor.
      const zorlaDikey = cfg.vertical;
      const oran = innerWidth / Math.max(1, innerHeight);
      const yatay = !zorlaDikey;
      root.classList.toggle('tt-yatay', yatay);
      root.classList.toggle('tt-vertical', !yatay);

      // 1920x1080 tasarim alanini ekrana sigdiran tek olcek
      const olcek = Math.min(innerWidth / 1920, innerHeight / 1080);
      root.style.setProperty('--tt-olcek', String(olcek));

      global.dispatchEvent(new CustomEvent('tt-yon', { detail: { yatay, oran, olcek } }));
    }
    yonBelirle();
    addEventListener('resize', yonBelirle);

    // Perde en arkada dursun: body'nin ilk cocugu olarak ekliyoruz
    if (cfg.perde && !document.getElementById('tt-perde')) {
      const p = document.createElement('div');
      p.id = 'tt-perde';
      document.body.insertBefore(p, document.body.firstChild);
    }

    // Olu bolge paylarini URL'den ezme
    //   ?dzalt=32   -> uyarilarin alani  (--dz-*)
    //   ?dz2alt=45  -> oyunlarin siki alani (--dz2-*)
    const yuzde = (v) => (/^[\d.]+$/.test(v) ? v + '%' : v);

    for (const [k, v] of Object.entries(cfg.dz)) {
      if (v == null || v === '') continue;
      root.style.setProperty('--dz-' + k, yuzde(v));
    }

    // Sabit 1920x1080 kabugun kenar paylari (TikTok arayuzunun kapattigi
    // alan) URL'den ayarlanabilir — piksel cinsinden:
    //   ?sag=300   sagdaki yorum sutunu payi (varsayilan 360)
    //   ?alt=60    alttaki hediye cubugu payi (varsayilan 96)
    //   ?ust=0&sol=0  kenarlari tamamen kullan
    // LIVE Studio'da tuvalin tamami seninse ?sag=24&alt=24 ile oyunu buyut.
    for (const k of ['ust', 'alt', 'sag', 'sol']) {
      const v = q.get(k);
      if (v == null || v === '') continue;
      root.style.setProperty('--yayin-' + k, /^\d+$/.test(v) ? v + 'px' : v);
    }
    for (const k of ['ust', 'alt', 'sag', 'sol']) {
      const v = q.get('dz2' + k);
      if (v) root.style.setProperty('--dz2-' + k, yuzde(v));
    }

    // ?genis=1 — oyunlari da gevsek alana al. Ekranin buyuk kismini oyuna
    // vermek isteyip yorumlarin altina girmesini goze aliyorsan.
    if (flag('genis')) {
      for (const k of ['ust', 'alt', 'sag', 'sol']) {
        root.style.setProperty('--dz2-' + k, getComputedStyle(root).getPropertyValue('--dz-' + k));
      }
    }

    if (cfg.guvenli) kilavuzCiz();

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

  /** Kullanici metinlerini HTML'e zararsizlastir. Oyunlar takma adlari
   *  innerHTML ile basiyor; TikTok takma adi serbest metin — "<img onerror=…>"
   *  iceren bir ad overlay'de kod calistirirdi. Tek noktada, olay daha
   *  işleyicilere ulasmadan temizliyoruz. */
  function zararsiz(v) {
    return String(v).replace(/[<>&"']/g, '');
  }

  function dispatch(ev) {
    if (!ev || !ev.type) return;
    if (ev.user) {
      if (ev.user.nickname != null) ev.user.nickname = zararsiz(ev.user.nickname);
      if (ev.user.uniqueId != null) ev.user.uniqueId = zararsiz(ev.user.uniqueId);
    }
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
  // Olu bolge kilavuzu (?guvenli=1)
  // -------------------------------------------------------------------------
  /**
   * TikTok'un canli yayin arayuzunun kapladigi bolgeleri tarali kirmiziyla,
   * kullanilabilir alani kesikli mavi cerceveyle gosterir.
   * Yerlesim ayarlarken ac, yayina almadan once KAPAT.
   */
  function kilavuzCiz() {
    const k = document.createElement('div');
    k.id = 'tt-guvenli-kilavuz';

    const bolgeler = [
      { stil: 'top:0;left:0;right:0;height:var(--dz-ust)', ad: 'ÜST — yayıncı bilgisi, en çok hediye gönderenler' },
      { stil: 'bottom:0;left:0;right:0;height:var(--dz-alt)', ad: 'ALT — yorum akışı, hediye çubuğu (en büyük ölü bölge)' },
      { stil: 'top:var(--dz-ust);bottom:var(--dz-alt);right:0;width:var(--dz-sag)', ad: 'SAĞ — beğeni / paylaş / hediye ikonları' },
      { stil: 'top:var(--dz-ust);bottom:var(--dz-alt);left:0;width:var(--dz-sol)', ad: 'SOL' },
    ];

    for (const b of bolgeler) {
      const d = document.createElement('div');
      d.className = 'dz';
      d.setAttribute('style', b.stil);
      k.appendChild(d);
    }

    const alan = document.createElement('div');
    alan.className = 'alan';
    k.appendChild(alan);

    const siki = document.createElement('div');
    siki.className = 'alan-siki';
    k.appendChild(siki);

    const et = document.createElement('div');
    et.className = 'etiket';
    et.style.cssText = 'top:calc(var(--dz-ust) + 6px);left:calc(var(--dz-sol) + 6px)';
    et.textContent = 'GEVŞEK — kısa ömürlü uyarılar';
    k.appendChild(et);

    const et2 = document.createElement('div');
    et2.className = 'etiket';
    et2.style.cssText =
      'top:calc(var(--dz2-ust) + 6px);left:calc(var(--dz2-sol) + 6px);' +
      'background:rgba(10,70,20,.9)';
    et2.textContent = 'SIKI — kalıcı widget buraya sığmalı (yanlardan kırpılma dahil)';
    k.appendChild(et2);

    for (const b of bolgeler) {
      const e = document.createElement('div');
      e.className = 'etiket';
      e.style.cssText = b.stil + ';background:rgba(120,0,20,.85);height:auto;width:auto;max-width:70%';
      e.textContent = b.ad;
      k.appendChild(e);
    }

    document.body.appendChild(k);
  }

  // -------------------------------------------------------------------------
  // SPRITE'LAR — gorsel varsa gorsel, yoksa emoji
  // -------------------------------------------------------------------------
  /**
   * Oyunlar once emoji ile yazildi ve emoji hala gecerli bir yedek: gorsel
   * dosyasi yoksa/yuklenemezse oyun bozulmuyor, eskisi gibi calisiyor.
   * Bu yuzden sprite'lar ZORUNLU degil — ustune eklenen bir katman.
   *
   *   const kahraman = TT.sprite('labirent-kahraman', '🐹');
   *   TT.spriteCiz(ctx, kahraman, x, y, 40);
   */
  const spriteler = new Map();

  function sprite(ad, emoji) {
    const anahtar = ad + '|' + emoji;
    if (spriteler.has(anahtar)) return spriteler.get(anahtar);

    const s = { ad, emoji, img: null, hazir: false };
    const img = new Image();
    img.onload = () => {
      // 0 boyutlu / bozuk dosyayi hazir sayma, emoji'de kal
      if (img.naturalWidth > 0) { s.img = img; s.hazir = true; }
    };
    img.onerror = () => { /* gorsel yok — emoji ile devam, sessiz */ };
    img.src = KOK + 'gorsel/' + ad + '.png';

    spriteler.set(anahtar, s);
    return s;
  }

  /**
   * Sprite'i (x,y) MERKEZ olacak sekilde ciz. Emoji yedegi de ayni merkeze
   * hizalaniyor ki gorsel gelince/gitince karakter yerinden oynamasin.
   */
  function spriteCiz(ctx, s, x, y, boyut) {
    if (s.hazir) {
      // Piksel sanati: kenarlar bulanmasin, keskin kalsin
      const eskiYumusatma = ctx.imageSmoothingEnabled;
      ctx.imageSmoothingEnabled = false;
      const en = boyut * (s.img.naturalWidth / s.img.naturalHeight);
      ctx.drawImage(s.img, x - en / 2, y - boyut / 2, en, boyut);
      ctx.imageSmoothingEnabled = eskiYumusatma;
      return;
    }

    ctx.save();
    ctx.font = `${boyut * 0.86}px "Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji",sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(s.emoji, x, y);
    ctx.restore();
  }

  // -------------------------------------------------------------------------
  // UYANMA PERDESI
  // -------------------------------------------------------------------------
  /**
   * Oyun sayfalari bunu cagirinca, ilk gercek olay gelene kadar ekranda
   * "ne yazacaksin" perdesi durur. Ilk olayda kaybolur ve oyun baslar.
   *
   *   TT.uyanis({
   *     baslik: 'LABİRENT',
   *     komutlar: ['SOL','SAĞ','YUKARI','AŞAĞI'],
   *     aciklama: 'Çoğunluk hangi yönü yazarsa oraya gidiyoruz',
   *     tetik: 'chat gift',   // hangi olay oyunu uyandirir
   *     baslat() { ... },     // uyaninca calisacak fonksiyon (istege bagli)
   *     hatirlat: 75,         // kac saniye sessizlikten sonra serit gosterilsin
   *   })
   *
   * Donus: { get uyandi(), uyan() }  — oyun kendi de uyandirabilir.
   */
  // Perdeyi kaldiran olaylar: izleyicinin BILEREK yaptigi her sey.
  // 'viewers' burada YOK — kopru onu 5 saniyede bir kendiliginden yolluyor,
  // tetik sayilsa oyun kimse yokken de baslardi. 'member' de yok: odaya
  // girmek katilim degil, sadece izlemek.
  const UYANDIRAN = 'chat gift like follow share subscribe';

  function uyanis(opts) {
    const o = opts || {};
    const tetikler = String(o.tetik || UYANDIRAN).split(/[\s,]+/);
    const hatirlatSn = o.hatirlat == null ? 75 : Number(o.hatirlat);
    let uyandi = false;
    let sonOlay = Date.now();

    const perde = document.createElement('div');
    perde.id = 'tt-uyanis';
    perde.className = 'tt-oyun';
    perde.dataset.durum = 'bekliyor';

    const durumEl = document.createElement('div');
    durumEl.className = 'durum';
    durumEl.textContent = 'bağlanıyor';

    const baslikEl = document.createElement('div');
    baslikEl.className = 'baslik';
    baslikEl.textContent = o.baslik || 'HAZIR';

    const aciklamaEl = document.createElement('div');
    aciklamaEl.className = 'aciklama';
    aciklamaEl.textContent = o.aciklama || '';

    const komutlarEl = document.createElement('div');
    komutlarEl.className = 'komutlar';
    for (const k of o.komutlar || []) {
      const d = document.createElement('div');
      d.className = 'komut';
      d.textContent = k;
      komutlarEl.appendChild(d);
    }

    const cagriEl = document.createElement('div');
    cagriEl.className = 'cagri';
    cagriEl.textContent = o.cagri || 'sohbete yaz, oyun başlasın';

    const kutu = document.createElement('div');
    kutu.className = 'kutu';
    kutu.append(durumEl, baslikEl, komutlarEl, aciklamaEl, cagriEl);
    perde.appendChild(kutu);

    // Oyun basladiktan sonra ara ara gosterilen ince hatirlatma seridi
    const serit = document.createElement('div');
    serit.id = 'tt-serit';
    for (const k of o.komutlar || []) {
      const d = document.createElement('div');
      d.className = 'komut';
      d.textContent = k;
      serit.appendChild(d);
    }

    document.body.append(perde, serit);

    /** Kopru "yayin bekleniyor" mu diyor, bagli mi — perdenin ust satiri. */
    function durumYaz(d) {
      if (uyandi) return;
      if (d && d.bekliyor) {
        perde.dataset.durum = 'bekliyor';
        durumEl.textContent = 'yayın bekleniyor';
      } else if (d && d.connected) {
        perde.dataset.durum = 'canli';
        durumEl.textContent = 'yayın açık · ilk yorumu bekliyorum';
      } else if (status === 'mock') {
        perde.dataset.durum = 'canli';
        durumEl.textContent = 'test modu';
      } else if (status === 'live') {
        perde.dataset.durum = 'canli';
        durumEl.textContent = 'bağlandı · ilk yorumu bekliyorum';
      } else {
        perde.dataset.durum = 'kopuk';
        durumEl.textContent = 'köprü kapalı';
      }
    }

    on('hello durum', durumYaz);
    setInterval(() => durumYaz(null), 2000);
    durumYaz(null);

    function uyan() {
      if (uyandi) return;
      uyandi = true;
      perde.classList.add('gitti');
      if (o.komutlar && o.komutlar.length && hatirlatSn > 0) seritDongusu();
      try { o.baslat?.(); } catch (e) { console.error('[TT] baslat hatasi', e); }
      global.dispatchEvent(new CustomEvent('tt-uyan'));
    }

    // Ilk gercek olayda uyan
    on(tetikler, uyan);
    // BOS ODA: hic olay gelmezse perde sonsuza kadar kalirdi ve arkadaki
    // demo turlari gorunmezdi. 15 saniye sonra kendiliginden kalk — gelen
    // izleyici "nasil oynanir" yazisini degil OYUNU izleyerek ogrensin.
    setTimeout(uyan, 15000);
    // Sessizlik olcumu her olayda tazelensin
    on('*', () => { sonOlay = Date.now(); });

    /** Uzun sessizlikte kurallari kisa sure geri goster. */
    function seritDongusu() {
      setInterval(() => {
        if (Date.now() - sonOlay < hatirlatSn * 1000) return;
        serit.classList.add('gorunur');
        setTimeout(() => serit.classList.remove('gorunur'), 7000);
        sonOlay = Date.now();   // ust uste gostermesin
      }, 5000);
    }

    return {
      get uyandi() { return uyandi; },
      uyan,
    };
  }

  // -------------------------------------------------------------------------
  // Katilim sutunu — sagdaki bos seride "ne yapacagini" yazar
  // -------------------------------------------------------------------------
  /*
   * Oyunlarin hepsinde ayni sorun vardi: yeni gelen izleyici ekranda guzel
   * bir sey goruyor ama KATILABILECEGINI anlamiyor. Basliktaki komut cipi
   * bunu tasiyor ama kucuk ve ust kosede.
   *
   * Bu sutun tek is yapiyor: "OYUNA KATILMAK ICIN MESAJ AT" + o oyunun
   * gercek komutu. Oyun basina kod yazmamak icin buraya kondu — dort oyun
   * da tt.js yukledigi icin hepsinde otomatik cikiyor. Komut metnini
   * oyunun kendi #komutMetin'inden aynaliyor, yani oyun komutu
   * degistirdiginde burasi da degisiyor.
   */
  function katilimSutunu() {
    if (q.get('katil') === '0') { document.documentElement.classList.add('tt-kcyok'); return; }
    const kok = document.getElementById('kok');
    if (!kok || !kok.classList.contains('tt-oyun')) return;
    if (document.getElementById('katilCagri')) return;

    const el = document.createElement('div');
    el.id = 'katilCagri';
    el.innerHTML =
      '<div class="kcUst">Oyuna katılmak için</div>' +
      '<div class="kcDev">MESAJ<br>AT</div>' +
      '<div class="kcOk">💬 ⬇</div>' +
      '<div class="kcAyrac"></div>' +
      '<div class="kcNe">ne yazacaksın</div>' +
      '<div class="kcKomut" id="kcKomut">—</div>' +
      '<div class="kcAlt">yazınca oyuna girersin<br>ücretsiz · üyelik yok</div>';
    kok.appendChild(el);
    kcTazele();
  }

  /** Oyunun komut metnini katilim sutununa aynala. */
  function kcTazele() {
    const kaynak = document.getElementById('komutMetin');
    const hedef = document.getElementById('kcKomut');
    if (!kaynak || !hedef) return;
    const metin = kaynak.textContent.trim();
    if (metin && hedef.textContent !== metin) hedef.textContent = metin;
  }

  /*
   * Komut degisince: (1) cipe tek seferlik dikkat hareketi ver,
   * (2) katilim sutununu tazele. Oyunlara tek satir kod eklemeden
   * calissin diye MutationObserver ile dinliyoruz.
   */
  function komutIzle() {
    const hedef = document.getElementById('komutMetin');
    const cip = document.getElementById('komut');
    if (!hedef) return;
    new MutationObserver(() => {
      kcTazele();
      if (!cip) return;
      cip.classList.remove('degisti');
      void cip.offsetWidth;              // animasyonu yeniden tetikle
      cip.classList.add('degisti');
    }).observe(hedef, { childList: true, characterData: true, subtree: true });
  }

  // -------------------------------------------------------------------------
  // Baslat
  // -------------------------------------------------------------------------
  function boot() {
    applyChrome();
    if (cfg.debug) makeDot();
    katilimSutunu();
    komutIzle();

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
    /** Su an yatay duzende miyiz? Oyunlar yerlesimi buna gore ayarlayabilir. */
    get yatay() { return document.documentElement.classList.contains('tt-yatay'); },
    /** Ilk yorum gelene kadar "nasil oynanir" perdesi goster. */
    uyanis,
    /** Gorsel varsa gorsel, yoksa emoji ile cizen sprite yardimcisi. */
    sprite, spriteCiz,
    /** Kopru sohbet botuna mesaj birak (kazanan kutlamasi). Sessiz basarisiz:
     *  kopru yoksa ya da bot kapaliysa oyun etkilenmez. */
    soyle(metin) {
      // ?mock=1 sayfa ici sahte moddur (panel ONIZLEMELERI dahil) — panel
      // acikken her onizleme iframe'i kendi yarisini kosturuyor; botu
      // kazanan duyurulariyla spamlamasinlar.
      if (cfg.mock) return;
      try { fetch('/api/soyle?text=' + encodeURIComponent(metin)).catch(() => {}); }
      catch { /* file:// vb. */ }
    },
    /** Elle olay tetikle (test / oyun ici). */
    fire: dispatch,
    mockEvent,
    get status() { return status; },
    ...util,
  };
})(window);
