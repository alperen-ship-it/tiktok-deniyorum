/**
 * finis.js — finis ani: agir cekim + AŞAMALI kazanan acilisi.
 *
 * Yaris yayinlarinin en cok izlenen ani finis; gercek yayinlar orada agir
 * cekime gecer. Mekanizma basit: oyunun fizik dongusu dt'yi Finis.carpan ile
 * carpar; agirCekim() carpani dusurur, sure bitince geri alir.
 *
 *   dt *= Finis.carpan;                        // oyun dongusunde
 *   if (lider > %92) Finis.agirCekim(1.4);     // esikte bir kez
 *   Finis.kart(el, { url, isim, alt });        // kazanan perdesi
 *
 * NEDEN SADECE transform + opacity:
 * base.css'teki `html.tt-lite * { filter/box-shadow/text-shadow/mask-image/
 * backdrop-filter: none !important }` kurali, !important yazar bildirimi
 * oldugu icin CSS animasyon kaynagini da yener. Yani lite modda — yani
 * URETIMDE — bu ozellikleri canlandiran her efekt sessizce olu. transform ve
 * opacity o listede yok: uretimde de calisir, ustelik kompozit katmaninda
 * kalip yeniden rasterleme yaptirmaz.
 *
 * NEDEN SES GORUNTUDEN SONRA:
 * Sezgiye ters geliyor ama yon nettir: insan, sesin goruntuden GERI kalmasina
 * ONDE olmasindan cok daha toleransli. Sebebi fiziksel — isik sesten hizli
 * gelir, algi sistemimiz sesin gec gelmesine alisik. Yayin dunyasinda ayni
 * asimetri dudak-senkron toleransi olarak standartlasmis (ITU-R BT.1359):
 * geride birkac kare fark edilmez, onde ayni miktar hemen "bozuk" duyulur.
 * Bu yuzden zafer sesi ismin 2 kare ARKASINDAN gidiyor.
 *
 * NOT: buradaki 2 kare olcumle degil bu asimetriye dayanarak secildi; kesin
 * esik degerleri icin birincil kaynak acilmadi. Degistirilecekse yon degil
 * miktar tartisilmali — sesi ismin ONUNE almak her halukarda yanlis.
 */
(function (global) {
  'use strict';

  const F = { carpan: 1 };
  const KARE = 1000 / 30;                  // yayin 30fps; zamanlama bu izgarada
  let rampa = 0, zamanlar = [];

  function sahneyiIptal() { zamanlar.forEach(clearTimeout); zamanlar = []; }

  /**
   * Ismi kutuya SIGDIR — kesme.
   *
   * Bu urunun tek vaadi "sohbete yazarsan adin ekranda cikar". Kazanma ani da
   * o vaadin odendigi yer. Orada ismi "AYSE_KAY…" diye kesmek, tam odeme
   * aninda sozu yarim birakmak demek — ustelik TikTok kullanici adlari
   * cogunlukla 10-20 karakter, yani bu istisna degil NORMAL durum.
   *
   * Cozum: ellipsis yerine yaziyi kucult, tabana inince de SAR (ikinci satir).
   * Dikey kabukta (PLAN-DIKEY A6) 110px'ten baslar, 56px'e kadar iner; 56px'te
   * de sigmayan (cok genis harfli, 28 karakterlik) ad satira bolunur. Eskiden
   * bu sarma yalnizca halay sayfasinda yerel bir yamaydi; artik her oyunda.
   * Yatayda (?yatay=1) eski aralik: 88 -> 40px, sonra sar.
   */
  function sigdir(el, enBuyuk, enKucuk) {
    const dikey = !!(global.TT && global.TT.dikey);
    const buyuk = enBuyuk || (dikey ? 110 : 88), kucuk = enKucuk || (dikey ? 56 : 40);
    el.classList.remove('sar');
    for (let px = buyuk; px >= kucuk; px -= 2) {
      el.style.fontSize = px + 'px';
      if (el.scrollWidth <= el.clientWidth) return px;
    }
    el.style.fontSize = kucuk + 'px';
    // ayractan (_ . -) sonra <wbr>: once ayractan bolunur, sonra harf ortasindan. textContent ayni.
    const parca = el.textContent.match(/[^_.\-]*[_.\-]+|[^_.\-]+/g) || [];
    if (parca.length > 1) {
      el.textContent = '';
      parca.forEach((x, i) => { if (i) el.appendChild(document.createElement('wbr')); el.appendChild(document.createTextNode(x)); });
    }
    el.classList.add('sar');
    return kucuk;
  }

  /** Zaman olcegini yumusak rampayla degistir (sert basamak goze takiliyor). */
  function olcekle(hedef, sureMs, sonra) {
    if (rampa) cancelAnimationFrame(rampa);
    const bas = F.carpan, t0 = performance.now();
    (function kare(t) {
      const p = Math.min(1, (t - t0) / sureMs);
      F.carpan = bas + (hedef - bas) * (1 - Math.pow(1 - p, 3));   // easeOutCubic
      if (p < 1) rampa = requestAnimationFrame(kare);
      else { rampa = 0; if (sonra) sonra(); }
    })(performance.now());
  }

  /** sn saniye boyunca zamani orana dusur (varsayilan 1.4sn, 0.3x). */
  F.agirCekim = function (sn, oran) {
    olcekle(oran || 0.3, 120, () =>
      setTimeout(() => olcekle(1, 420), (sn || 1.4) * 1000));
  };

  /**
   * Kazanan kartini doldur ve AŞAMALI ac. el = #kazanan perdesi.
   * o: { url (kimlik gorseli, istege bagli), isim, alt, kupa, ses, kutlama }
   *
   * Sahne (30fps kare izgarasi):
   *   0 ms   perde + gorsel
   *   167    ISIM — tek basina, en buyuk
   *   233    ses (isimden 2 kare sonra; yukaridaki nota bak)
   *   467    alt yazi
   *   3500   konfeti
   *
   * Konfeti neden en sonda: isim tek basina 3-5 sn tepede tutulmali. Isimle
   * ayni anda konfeti atmak, tek "yuksek etkili an"i kendi ustune yikiyor —
   * izleyicinin gozu ismi degil parcaciklari takip ediyor.
   */
  F.kart = function (el, o) {
    // DOM ile kur (innerHTML yok): url ve metinler enterpolasyon gormez.
    el.textContent = '';
    const ic = document.createElement('div');
    ic.className = 'fkIc';
    if (o.url) {
      const g = document.createElement('div');
      g.className = 'fkGorsel';
      g.style.backgroundImage = 'url("' + String(o.url).replace(/["\\\n\r]/g, '') + '")';
      ic.appendChild(g);
    } else {
      const k = document.createElement('div');
      k.className = 'kupa';
      k.textContent = o.kupa || '🏆';
      ic.appendChild(k);
    }
    const adKap = document.createElement('div');
    adKap.className = 'kimAd';
    const altKap = document.createElement('div');
    altKap.className = 'altYazi';
    // Istege bagli IKINCI AD satiri (o.ad2): ana ad ile alt yazi arasinda. Ayni
    // sigdirma kurali, taban 40px (72 -> 40, sonra <wbr> ile sar). o.ad2 yoksa
    // hic olusmaz: kart eskisiyle ayni.
    let ad2Kap = null;
    if (o.ad2) {
      ad2Kap = document.createElement('div');
      ad2Kap.className = 'kimAd kimAd2';
      ad2Kap.style.color = 'var(--murekkep, #f4f1ff)';
      ad2Kap.style.marginTop = '8px';
    }
    ic.append(adKap);
    if (ad2Kap) ic.append(ad2Kap);
    ic.append(altKap);
    el.appendChild(ic);
    const adEl = el.querySelector('.kimAd');
    const altEl = el.querySelector('.altYazi');
    // textContent: isim zaten TT.zararsiz()'dan geciyor ama burada da
    // enterpolasyon yok — tek kaynakli guvenlik yerine iki katman.
    // (Kart KAZANAN kutusunda: dikeyde 60,488 960x746 — #kazanan CSS'i.)
    // Zamanlayicilar tutuluyor: kart erken kapanirsa (oyun gecisi, iframe
    // yenilenmesi) bekleyen ses/konfeti BASKA bir ekranin uzerine dusmesin.
    sahneyiIptal();
    const at = (kare, fn) => zamanlar.push(setTimeout(fn, Math.round(kare * KARE)));

    el.classList.add('acik');
    at(5, () => { adEl.textContent = o.isim || ''; sigdir(adEl); adEl.classList.add('gel'); });
    at(7, () => { if (o.ses) o.ses(); else if (global.Ses) global.Ses.cal('bitis'); });
    if (ad2Kap) at(10, () => { ad2Kap.textContent = String(o.ad2); sigdir(ad2Kap, 72, 40); ad2Kap.classList.add('gel'); });
    at(14, () => { altEl.textContent = o.alt || ''; altEl.classList.add('gel'); });
    at(105, () => {
      if (o.kutlama) o.kutlama();
      else if (global.Juice) global.Juice.konfeti({ y: 0.3 });
    });
  };

  F.kapat = function (el) { sahneyiIptal(); el.classList.remove('acik'); };

  global.Finis = F;
})(window);
