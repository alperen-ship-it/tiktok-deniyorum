/**
 * finis.js — finis ani: agir cekim + kazanan karti.
 *
 * Yaris yayinlarinin en cok izlenen ani finis; gercek yayinlar orada agir
 * cekime gecer. Buradaki mekanizma basit: oyunun fizik dongusu dt'yi
 * Finis.carpan ile carpar; agirCekim() carpani dusurur, sure bitince geri alir.
 *
 *   dt *= Finis.carpan;                        // oyun dongusunde
 *   if (lider > %92) Finis.agirCekim(1.4);     // esikte bir kez
 *   Finis.kart(el, { url, isim, alt });        // kazanan perdesi
 */
(function (global) {
  'use strict';

  const F = { carpan: 1 };
  let zamanlayici = 0;

  /** sn saniye boyunca zamani orana dusur (varsayilan 1.4sn, 0.3x). */
  F.agirCekim = function (sn, oran) {
    F.carpan = oran || 0.3;
    clearTimeout(zamanlayici);
    zamanlayici = setTimeout(() => { F.carpan = 1; }, (sn || 1.4) * 1000);
  };

  /**
   * Kazanan kartini doldur ve ac. el = #kazanan perdesi.
   * o: { url (kimlik gorseli, istege bagli), isim, alt, kupa }
   */
  F.kart = function (el, o) {
    const gorsel = o.url
      ? `<div style="width:220px;height:220px;margin:0 auto 10px;` +
        `background:url(${o.url});background-size:contain;background-repeat:no-repeat;background-position:center"></div>`
      : `<div class="kupa">${o.kupa || '🏆'}</div>`;
    el.innerHTML = `<div>
      ${gorsel}
      <div class="kimAd">${o.isim}</div>
      <div class="altYazi">${o.alt || ''}</div>
    </div>`;
    el.classList.add('acik');
  };

  F.kapat = function (el) { el.classList.remove('acik'); };

  global.Finis = F;
})(window);
