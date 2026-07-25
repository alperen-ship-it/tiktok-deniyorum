/**
 * kimlik.js — izleyiciye KALICI gorsel kimlik: renk + desen.
 *
 * Marbles on Stream'in gorsel omurgasi bilye skinleri; "renkli daire + isim"
 * ucuz kopya hissinin tam merkezi. Burada skin, kullanicinin kimliginden
 * (uniqueId) deterministik uretiliyor: ayni izleyici HER YAYINDA ayni bilyeyle
 * gelir — "benim bilyem" bagi boyle kuruluyor. Sunucu yok, varlik dosyasi yok.
 *
 * Performans: kure bir kez 64x64 offscreen tuvale pisirilir (desen + kure
 * golgelemesi + parlama), karede sadece drawImage. Onceki kod her karede her
 * bilye icin createRadialGradient cagiriyordu — GPU'suz renderda en pahali
 * satir oydu.
 *
 *   const k = Kimlik.al(user.uniqueId);   // {renk, desen, url, tuval}
 *   Kimlik.ciz(ctx, id, x, y, cap);       // tuvale blit (merkezden)
 *   Kimlik.cip(id, 28);                   // DOM icin <span> HTML'i
 */
(function (global) {
  'use strict';

  // 16'lik kurator palet — koyu mor zeminde ayirt edilebilir, camursuz.
  // Rastgele HSL uretimi denendi ve birbirine benzeyen kirli tonlar cikardi.
  const PALET = [
    '#ff4d4d', '#ff8a3d', '#ffd23f', '#b6e02b',
    '#7ed957', '#21d1a1', '#00c2c7', '#3fb9ff',
    '#5b7fff', '#8b6bff', '#c05cff', '#ff5fc8',
    '#ff7a9e', '#e0b06b', '#9be07a', '#66d9ff',
  ];
  const DESENLER = ['duz', 'cizgi', 'yarim', 'benek', 'halka', 'burgu'];

  /** FNV-1a — kisa, hizli, dagilimi bu is icin fazlasiyla yeterli. */
  function hash(s) {
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  /** Deseni verilen dikdortgene ciz (kirpilmis baglamda cagrilir). */
  function desenCiz(x, w, h, renk, desen) {
    x.fillStyle = renk;
    x.strokeStyle = renk;
    if (desen === 'cizgi') {
      for (let i = -h; i < w + h; i += 17) {
        x.save(); x.translate(i, 0); x.rotate(-0.5);
        x.fillRect(0, -h, 7, h * 3);
        x.restore();
      }
    } else if (desen === 'yarim') {
      x.fillRect(0, 0, w / 2, h);
    } else if (desen === 'benek') {
      for (let a = 5; a < h; a += 14) {
        for (let b = ((a / 14) % 2) * 7 + 4; b < w; b += 14) {
          x.beginPath(); x.arc(b, a, 3.4, 0, 6.2832); x.fill();
        }
      }
    } else if (desen === 'halka') {
      x.lineWidth = 7;
      x.beginPath(); x.arc(w / 2, h / 2, w * 0.3, 0, 6.2832); x.stroke();
    } else if (desen === 'burgu') {
      x.lineWidth = 6;
      x.beginPath();
      for (let t = 0; t < 12.6; t += 0.14) {
        const r = 2 + t * 2.6;
        x.lineTo(w / 2 + Math.cos(t) * r, h / 2 + Math.sin(t) * r);
      }
      x.stroke();
    }
    // 'duz' -> desen yok, renk konusur
  }

  /** 64x64 kureyi bir kez pisir: taban renk + desen + golgeleme + parlama. */
  function kurePisir(renk, ikincil, desen) {
    const c = document.createElement('canvas');
    c.width = c.height = 64;
    const x = c.getContext('2d');

    x.beginPath(); x.arc(32, 32, 29, 0, 6.2832);
    x.fillStyle = renk; x.fill();

    x.save();
    x.beginPath(); x.arc(32, 32, 29, 0, 6.2832); x.clip();
    desenCiz(x, 64, 64, ikincil, desen);

    // Kure golgelemesi: isik sol ustten. Pisirme aninda bir kez.
    const g = x.createRadialGradient(22, 20, 4, 34, 36, 36);
    g.addColorStop(0, 'rgba(255,255,255,.6)');
    g.addColorStop(0.35, 'rgba(255,255,255,0)');
    g.addColorStop(0.78, 'rgba(0,0,0,0)');
    g.addColorStop(1, 'rgba(0,0,0,.55)');
    x.fillStyle = g;
    x.fillRect(0, 0, 64, 64);
    x.restore();

    x.beginPath(); x.arc(32, 32, 29, 0, 6.2832);
    x.lineWidth = 4; x.strokeStyle = 'rgba(10,6,30,.9)'; x.stroke();
    return c;
  }

  /** Forma (jokey formasi gibi dikdortgen) — at yarisi icin.
   *  k = olcek carpani: buyuk kullanim (kazanan karti) icin buyuk pisir,
   *  kucugu buyutmek bulanik goruntu veriyor. */
  function formaPisir(renk, ikincil, desen, k) {
    k = k || 1;
    const c = document.createElement('canvas');
    c.width = 56 * k; c.height = 40 * k;
    const x = c.getContext('2d');
    x.scale(k, k);
    x.fillStyle = renk;
    x.beginPath(); x.roundRect(2, 2, 52, 36, 8); x.fill();
    x.save();
    x.beginPath(); x.roundRect(2, 2, 52, 36, 8); x.clip();
    desenCiz(x, 56, 40, ikincil, desen);
    x.restore();
    x.beginPath(); x.roundRect(2, 2, 52, 36, 8);
    x.lineWidth = 4; x.strokeStyle = '#17123a'; x.stroke();
    return c;
  }

  const bellek = new Map();

  /** Kimligi getir; yoksa uret ve pisir. */
  function al(id) {
    let k = bellek.get(id);
    if (k) return k;
    const h = hash(String(id));
    const renk = PALET[h % PALET.length];
    let ikincil = PALET[(h >>> 5) % PALET.length];
    if (ikincil === renk) ikincil = '#ffffff';
    // Desen dagilimi: 'duz' da ciksin ki herkes desenli olmasin — desenin
    // degeri, herkeste olmamasindan geliyor.
    const desen = DESENLER[(h >>> 9) % DESENLER.length];
    const tuval = kurePisir(renk, ikincil, desen);
    k = { renk, ikincil, desen, tuval, url: tuval.toDataURL() };
    bellek.set(id, k);
    return k;
  }

  /** Kureyi (x,y) merkezli, cap capinda ciz. */
  function ciz(ctx, id, x, y, cap) {
    const k = al(id);
    ctx.drawImage(k.tuval, x - cap / 2, y - cap / 2, cap, cap);
  }

  /** DOM cipi: ray/feed satirlarinda kucuk kimlik gorseli. */
  function cip(id, boyut) {
    const k = al(id);
    return `<span style="display:inline-block;flex:none;width:${boyut}px;height:${boyut}px;` +
      `background:url(${k.url});background-size:contain;vertical-align:middle"></span>`;
  }

  global.Kimlik = { al, ciz, cip, formaPisir, desenCiz, PALET };
})(window);
