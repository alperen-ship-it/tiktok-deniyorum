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
    if (!el) return;
    const { oncelik = 1, anahtar = null, sure = 3200 } = o || {};
    const t = performance.now();

    if (anahtar) {
      const son = sonAnahtar.get(anahtar);
      if (son && t - son < 3000) return;   // ayni sey uste uste soylenmez
      sonAnahtar.set(anahtar, t);
    }

    const m = { html, oncelik, sure };
    if (!gosterilen || oncelik > gosterilen.oncelik) {
      goster(m);
    } else if (kuyruk.length < 2) {
      kuyruk.push(m);
    }
    // kuyruk doluysa dusuk oncelikli soz kaybolur — spiker de her seyi soylemez
  }

  function goster(m) {
    gosterilen = m;
    el.innerHTML = `<div class="satir">${m.html}</div>`;
    clearTimeout(zamanlayici);
    zamanlayici = setTimeout(() => {
      gosterilen = null;
      el.innerHTML = '';
      const sonraki = kuyruk.shift();
      if (sonraki) goster(sonraki);
    }, m.sure);
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

  global.Spiker = { kur, soyle, sec };
})(window);
