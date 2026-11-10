/**
 * spiker.js — olaylari SPOR SPIKERI gibi anlatan alt-ucluk.
 *
 * Jelle's Marble Runs'in dersi: simulasyon ham goruntudur, onu yarisa
 * ceviren sey anlatimdir. Bu modul olay cumlelerini oncelik kuyrugundan
 * gecirir: onemli olay (finis, lider degisimi) onemsizi (katilim) ezer,
 * ayni olay 3 saniye icinde tekrarlanmaz, ekranda ayni anda tek satir durur.
 *
 *   Spiker.kur(document.getElementById('akis'));
 *   Spiker.soyle('⚡ <b>emre</b> öne geçti', { oncelik: 2, anahtar: 'lider' });
 *   Spiker.sec(['%s uçuyor!', '%s farkı açıyor!'], 'emre')  -> rastgele kalip
 *
 * Izleyici adi iceren satirlari DOM'la kur: Spiker.satir(['⚡ ', {kim: ad}, ' öne geçti'])
 * — ad textContent ile yazilir (ham HTML yok). Parca: duz metin | {kim} | {b}.
 *
 * DIKEY kabukta (PLAN-DIKEY A6): kutu SPIKER 960x64, TEK satir, 36px; adlar
 * (.kim) 40px. Satir kutuya sigmazsa once 30px'e iner, sonra iki satira sarar —
 * adin sonuna "…" asla konmaz.
 */
(function (global) {
  'use strict';

  let el = null;
  let gosterilen = null;      // {oncelik, bitis}
  let kuyruk = [];            // en fazla 2 bekleyen
  let zamanlayici = 0;
  const sonAnahtar = new Map();

  function kur(hedef) { el = hedef; }

  /**
   * @param {string} html   satir icerigi
   * @param {object} [o]    {oncelik: 1..3, anahtar: tekrarlama kilidi, sure: ms}
   */
  function soyle(html, o) {
    return ekle({ html }, o);
  }

  /** Parcalardan (metin | {kim} | {b}) DOM kurarak soyle — ad textContent. */
  function satir(parcalar, o) {
    const f = document.createDocumentFragment();
    for (const p of parcalar || []) {
      if (typeof p === 'string') { f.append(document.createTextNode(p)); continue; }
      if (p && p.kim != null) {
        const sp = document.createElement('span');
        sp.className = 'kim'; sp.textContent = String(p.kim);
        f.append(sp);
      } else if (p && p.b != null) {
        const b = document.createElement('b');
        b.textContent = String(p.b);
        f.append(b);
      }
    }
    return ekle({ dugum: f }, o);
  }

  function ekle(icerik, o) {
    if (!el) return;
    const { oncelik = 1, anahtar = null, sure = 3200 } = o || {};
    const t = performance.now();

    if (anahtar) {
      const son = sonAnahtar.get(anahtar);
      if (son && t - son < 3000) return;   // ayni sey uste uste soylenmez
      sonAnahtar.set(anahtar, t);
    }

    const m = { ...icerik, oncelik, sure };
    if (!gosterilen || oncelik > gosterilen.oncelik) {
      goster(m);
    } else if (kuyruk.length < 2) {
      kuyruk.push(m);
    }
    // kuyruk doluysa dusuk oncelikli soz kaybolur — spiker de her seyi soylemez
  }

  function goster(m) {
    gosterilen = m;
    el.textContent = '';
    const d = document.createElement('div');
    d.className = 'satir';
    if (m.dugum) d.append(m.dugum); else d.innerHTML = m.html;
    el.appendChild(d);
    sigdir(d);
    // Dikey: giris kaymasi en fazla 16px (CSS kayDikey 64px'ten basliyordu ve
    // soldaki yorum bolgesine (y>1250) dusuyordu). Ayni egri/sure, yalniz
    // transform + opacity; WAAPI ile, CSS animasyonunun yerine.
    if (global.TT && global.TT.dikey && d.animate) {
      d.style.animation = 'none';
      const lite = document.documentElement.classList.contains('tt-lite');
      d.animate([
        { transform: 'translateY(16px)', opacity: 0, offset: 0 },
        { transform: 'translateY(0)', opacity: 1, offset: 0.1 },
        { transform: 'translateY(0)', opacity: 1, offset: 0.84 },
        { transform: 'translateY(-16px)', opacity: 0, offset: 1 },
      ], { duration: lite ? 2600 : 3400, easing: 'cubic-bezier(0.16, 1, 0.3, 1)', fill: 'forwards' });
    }
    clearTimeout(zamanlayici);
    zamanlayici = setTimeout(() => {
      gosterilen = null;
      el.innerHTML = '';
      const sonraki = kuyruk.shift();
      if (sonraki) goster(sonraki);
    }, m.sure);
  }

  /** Dikey kabuk: satiri 960px'e sigdir. 36px -> 30px -> iki satir. Kesme yok. */
  function sigdir(d) {
    if (!(global.TT && global.TT.dikey)) return;
    if (d.scrollWidth <= d.clientWidth) return;
    d.classList.add('kucuk');
    if (d.scrollWidth <= d.clientWidth) return;
    d.classList.add('sar');
  }

  /** Kalip dizisinden rastgele sec, %s yerine adi koy. Ayni cumleyi arka
   *  arkaya kurmasin diye son secim hatirlanir. */
  let sonKalip = -1;
  function sec(kaliplar, ad) {
    let i = Math.floor(Math.random() * kaliplar.length);
    if (kaliplar.length > 1 && i === sonKalip) i = (i + 1) % kaliplar.length;
    sonKalip = i;
    return kaliplar[i].replace('%s', ad);
  }

  global.Spiker = { kur, soyle, satir, sec };
})(window);
