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

  function tuvalKur() {
    if (tuval) return;
    tuval = document.createElement('canvas');
    tuval.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:80';
    document.body.appendChild(tuval);
    ctx = tuval.getContext('2d');
  }

  function konfeti(o) {
    o = o || {};
    tuvalKur();
    tuval.width = innerWidth; tuval.height = innerHeight;
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
        en: 7 + Math.random() * 7,
        renk: RENKLER[i % RENKLER.length],
        omur: 1,
      });
    }
    if (!donuyor) { donuyor = true; requestAnimationFrame(adim); }
  }

  function adim() {
    ctx.clearRect(0, 0, tuval.width, tuval.height);
    parcalar = parcalar.filter((p) => p.omur > 0 && p.y < tuval.height + 30);
    for (const p of parcalar) {
      p.vy += 0.34;                    // yercekimi
      p.vx *= 0.99; p.vy *= 0.99;
      p.x += p.vx; p.y += p.vy;
      p.don += p.donHiz;
      p.omur -= 0.008;

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.don);
      ctx.globalAlpha = Math.max(0, Math.min(1, p.omur * 2));
      ctx.fillStyle = p.renk;
      // dikdortgen pul: donerken parildama hissi bedavaya geliyor
      ctx.fillRect(-p.en / 2, -p.en / 3.4, p.en, p.en / 1.7);
      ctx.restore();
    }
    if (parcalar.length) requestAnimationFrame(adim);
    else { donuyor = false; ctx.clearRect(0, 0, tuval.width, tuval.height); }
  }

  // ---- sarsinti ------------------------------------------------------------
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

  global.Juice = { konfeti, sars, sarsHedef };
})(window);
