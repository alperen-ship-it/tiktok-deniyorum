/**
 * juice.js — kutlama ve darbe hissi: konfeti + ekran sarsintisi.
 *
 * Iki teknik de acik kaynak projelerden ogrenilip SIFIRDAN yazildi
 * (kod kopyalanmadi):
 *   - Konfeti: canvas-confetti'nin (ISC) yaklasimi — tek tam-ekran tuval,
 *     CPU'da rAF dongusu, parcacik bitince tuval kaldirilir. GPU gerekmez.
 *   - Sarsinti: "trauma" sistemi (Squirrel Eiserloh, GDC; sajmoni/screen-shake
 *     MIT uygulamasindaki fikir) — darbe travma ekler, travma ussel soner,
 *     ofset = travma^2 * genlik. Kucuk darbeler hissedilmez, buyukler vurur.
 *
 * Lite modda (GPU'suz LIVE Studio) ikisi de otomatik kisilir:
 * konfeti parcacik sayisi yariya iner, sarsinti kapanir.
 *
 *   Juice.konfeti();                    // ekran ortasindan kutlama
 *   Juice.konfeti({ x: .3, y: .2 });    // orana gore konum
 *   Juice.sars(0.5);                    // orta siddette darbe
 *   Juice.sarsHedef(el);                // sarsintinin uygulanacagi eleman
 */
(function (global) {
  'use strict';

  const lite = () => document.documentElement.classList.contains('tt-lite');

  // ---- konfeti -------------------------------------------------------------
  const RENKLER = ['#f6c94f', '#ff6b5e', '#8b5cf6', '#f4f1ff', '#7ed957', '#3fb9ff'];
  let tuval = null, ctx = null, parcalar = [], donuyor = false;

  /*
   * Konfeti tuvali #kok kutusuna oturur (PLAN-DIKEY A6), pencereye degil:
   * 9:16 olmayan bir pencerede letterbox kenarlarina konfeti dusmesin.
   * Ic cozunurluk TASARIM pikseli (dikey 1080x1920 / yatay 1920x1080), CSS
   * boyutu olceklenmis kutu — parcacik boyutlari ve hizlar her olcekte ayni.
   * Dikeyde ayrica yasak bolgelerin disina KIRPILIR (tt.js TT.YASAK): konfeti
   * TikTok'un kendi arayuzunun altinda kalan yere dusmesin, oralarda yalnizca
   * arka plan degissin.
   */
  let tasarim = { w: 1920, h: 1080 };

  function tuvalYerles() {
    const kok = document.getElementById('kok');
    const T = (global.TT && global.TT.TUVAL) || { w: innerWidth, h: innerHeight };
    tasarim = T;
    if (tuval.width !== T.w) tuval.width = T.w;       // atama tuvali siler: yalniz degisince
    if (tuval.height !== T.h) tuval.height = T.h;
    const r = kok ? kok.getBoundingClientRect() : { left: 0, top: 0, width: innerWidth, height: innerHeight };
    const st = tuval.style;
    st.left = r.left + 'px'; st.top = r.top + 'px';
    st.width = r.width + 'px'; st.height = r.height + 'px';
  }

  function tuvalKur() {
    if (tuval) return;
    tuval = document.createElement('canvas');
    tuval.style.cssText = 'position:fixed;pointer-events:none;z-index:80';
    document.body.appendChild(tuval);
    ctx = tuval.getContext('2d');
    addEventListener('resize', tuvalYerles);
    addEventListener('tt-yon', tuvalYerles);
  }

  function konfeti(o) {
    o = o || {};
    tuvalKur();
    tuvalYerles();
    const adet = Math.round((o.adet || 44) * (lite() ? 0.5 : 1));
    const kx = (o.x != null ? o.x : 0.5) * tuval.width;
    const ky = (o.y != null ? o.y : 0.38) * tuval.height;

    for (let i = 0; i < adet; i++) {
      const aci = -Math.PI / 2 + (Math.random() - 0.5) * 1.9;
      const hiz = 7 + Math.random() * 10;
      parcalar.push({
        x: kx, y: ky,
        vx: Math.cos(aci) * hiz,
        vy: Math.sin(aci) * hiz,
        don: Math.random() * 6.28,
        donHiz: (Math.random() - 0.5) * 0.35,
        en: (7 + Math.random() * 7) * ((global.TT && global.TT.dikey) ? 1.6 : 1),   // dikey: telefonda ~2.8x kucuk
        renk: RENKLER[i % RENKLER.length],
        omur: 1,
      });
    }
    if (!donuyor) { donuyor = true; requestAnimationFrame(adim); }
  }

  /** Dikeyde izinli bolge: yasak bolgelerin disi (tek cokgen). */
  function kirp() {
    if (!(global.TT && global.TT.dikey)) return;
    ctx.beginPath();
    ctx.moveTo(60, 240); ctx.lineTo(1020, 240); ctx.lineTo(1020, 1760);
    ctx.lineTo(540, 1760); ctx.lineTo(540, 1250); ctx.lineTo(60, 1250);
    ctx.closePath();
    ctx.clip();
  }

  /* Kare degil ZAMAN tabanli. Onceden her sey "kare basina" ilerliyordu:
     gelistirmede 60fps, OBS'te 30fps — yani yayinlanan konfeti gelistirirken
     gordugumuzun yarisi hizinda dusuyor, yarisi kadar yasiyordu. k = gecen
     surenin 60fps karesine orani; tum sabitler eskisi gibi 60fps'e gore. */
  let sonT = 0;
  function adim(t) {
    const k = sonT ? Math.min(3, (t - sonT) / (1000 / 60)) : 1;
    sonT = t;
    ctx.clearRect(0, 0, tuval.width, tuval.height);
    ctx.save();
    kirp();
    parcalar = parcalar.filter((p) => p.omur > 0 && p.y < tuval.height + 30);
    for (const p of parcalar) {
      p.vy += 0.34 * k;                // yercekimi
      p.vx *= Math.pow(0.99, k); p.vy *= Math.pow(0.99, k);
      p.x += p.vx * k; p.y += p.vy * k;
      p.don += p.donHiz * k;
      p.omur -= 0.008 * k;

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.don);
      ctx.globalAlpha = Math.max(0, Math.min(1, p.omur * 2));
      ctx.fillStyle = p.renk;
      // dikdortgen pul: donerken parildama hissi bedavaya geliyor
      ctx.fillRect(-p.en / 2, -p.en / 3.4, p.en, p.en / 1.7);
      ctx.restore();
    }
    ctx.restore();
    if (parcalar.length) requestAnimationFrame(adim);
    else { donuyor = false; sonT = 0; ctx.clearRect(0, 0, tuval.width, tuval.height); }
  }

  // ---- yerel darbe ---------------------------------------------------------
  /*
   * NEDEN EKRAN SARSINTISI DEGIL DE BU.
   * Olcum: sars() genligi 14 * travma^2 piksel. Gercek cagri yerlerimizde
   * travma 0.18-0.5 arasi, yani tuvalde 0.45-3.5 px. Yayin 1920 tuvali dikey
   * telefonda ~390pt'ye iniyor (4.92x): telefonda 0.09-0.71 px kaliyor.
   * Yani ALT PIKSEL — hicbir izleyici goremez. Ustelik lite modda (yani
   * uretimde) sars() en basta return ediyordu; bu efekt hic calismadi.
   *
   * Telefonda gorunur olmasi icin genligi ~20 kat buyutmek gerekirdi; o da
   * 1920x1080'lik tum sahneyi zipzip oynatmak demek — "darbe" degil "yayin
   * bozuldu" gibi okunur.
   *
   * Cozum: MUTLAK piksel yerine ORANSAL efekt. scale ve opacity olcekten
   * bagimsizdir — %14 buyume, ekran ne kadar kuculurse kuculsun %14'tur.
   * Ikisi de html.tt-lite'in yasak listesinde degil, ikisi de kompozit
   * katmaninda kalir: uretimde CALISIR ve BEDAVA.
   */

  /** Olcek darbesi. Kendi transform'u OLMAYAN ogeler icin (kart, rozet, bar). */
  function vur(el, siddet) {
    if (!el || !el.animate) return;
    const s = 1 + Math.min(0.3, (siddet == null ? 0.4 : siddet) * 0.32);
    const taban = el.style.transform || '';
    el.animate(
      [{ transform: `${taban} scale(${s.toFixed(3)})` },
       { transform: `${taban} scale(1)` }],
      { duration: 260, easing: 'cubic-bezier(.22,1,.36,1)' });
  }

  /**
   * Saydamlik carpmasi. transform'u SUREKLI guncellenen ogeler icin —
   * orada transform'u canlandirmak konum guncellemesini animasyon suresince
   * dondurur. opacity o catismayi yasamaz.
   * (Eskiden burada filter: brightness() vardi; lite modda olu bir efektti.)
   */
  function parla(el) {
    if (!el || !el.animate) return;
    el.animate([{ opacity: 1 }, { opacity: .3 }, { opacity: 1 }],
      { duration: 300, easing: 'ease-out' });
  }

  // ---- sarsinti (SADECE gelistirme onizlemesi) ------------------------------
  /* Uretimde lite acik oldugu icin bu kod yolu calismaz — bilerek boyle.
     Yerine vur()/parla() kullan; yukaridaki gerekceye bak. */
  let travma = 0, hedefEl = null, sarsiyor = false;

  function sarsHedef(el) { hedefEl = el; }

  function sars(miktar) {
    if (lite()) return;                       // GPU'suz ortamda kapali
    travma = Math.min(1, travma + (miktar || 0.4));
    if (!sarsiyor) { sarsiyor = true; requestAnimationFrame(sarsAdim); }
  }

  function sarsAdim() {
    const el = hedefEl || document.getElementById('kok');
    if (!el) { sarsiyor = false; return; }
    travma = Math.max(0, travma - 0.025);
    const g = travma * travma;                // kucuk travma gorunmez, buyuk vurur
    if (g < 0.001) {
      el.style.setProperty('--sars', '0px, 0px');
      sarsiyor = false;
      return;
    }
    const x = (Math.random() * 2 - 1) * 14 * g;
    const y = (Math.random() * 2 - 1) * 10 * g;
    // #kok'un kendi transform'u (olcek) var — sarsintiyi ayri degiskenle ekle
    el.style.transform =
      `scale(var(--tt-olcek, 1)) translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
    requestAnimationFrame(sarsAdim);
  }

  global.Juice = { konfeti, sars, sarsHedef, vur, parla };
})(window);
