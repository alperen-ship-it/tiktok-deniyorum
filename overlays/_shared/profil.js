/**
 * profil.js — oyunlar arasi TEK izleyici kimligi.
 *
 * SORUN: her oyunun kendi localStorage anahtari vardi (13 tane). Misketi
 * kazanan biri triviaya gecince sifirdan basliyordu; PK'de bir tarafi
 * tasiyan kisi at yarisinda kimse degildi. Dort oyun dort ayri adaydi ve
 * hicbiri digerini beslemiyordu.
 *
 * Incelenen butun calisan orneklerde (chat RPG'leri, chat battle royale'lar,
 * ticari urunler) ortak olan sey su: izleyicinin SAHIP OLDUGU, oyunlar
 * arasinda tasinan ve kendisine gosterilen tek bir sayi.
 *
 * BURADA TUTULMAYAN SEY: rekabet tablolari. Onlar oyunlarin kendi
 * anahtarlarinda kaliyor ve tur/sezon basi sifirlanabiliyor — yeni gelen
 * "bu gece kazanabilirim" diyebilsin diye. Burasi OMURLUK katman:
 * kisisel, sifirlanmayan, kimseyle yarismayan.
 *
 * NEDEN localStorage: dort oyun ayni origin'den (kopru) servis edildigi
 * icin depolamayi gercekten paylasiyorlar — merkez iframe'i degistirse
 * bile veri ortak.
 *
 * Kayit basi ~50 bayt; 2000 kisi ~100 KB. localStorage siniri 5 MB.
 */
(function (global) {
  'use strict';

  const ANAHTAR = 'tt-profil-v1';
  const TAVAN = 2000;
  const YENI_YAYIN_MS = 4 * 3600e3;   // 4 saat gorunmediyse yeni yayin say

  let harita = new Map();
  try {
    const ham = JSON.parse(localStorage.getItem(ANAHTAR) || '[]');
    for (const [k, v] of ham) harita.set(k, v);
  } catch { /* sifirdan */ }

  function bos() {
    return {
      ad: '', ilkGorulme: Date.now(), sonGorulme: 0,
      yayin: 0, mesaj: 0, xp: 0,
      misketYaris: 0, misketGalip: 0,
      bilgiDogru: 0, bilgiEnIyiSeri: 0,
      pkTur: 0, pkGalip: 0,
      atBahis: 0, atKazanc: 0,
    };
  }

  function al(kid) { return Object.assign(bos(), harita.get(kid)); }

  /**
   * Profili guncelle.
   * @param {string} kid   kalici kullanici kimligi
   * @param {string} ad    goruntulenen ad (her seferinde tazelenir — isim degisir)
   * @param {object} artis {xp: 5, misketGalip: 1} gibi eklenecek alanlar
   */
  function ekle(kid, ad, artis) {
    if (!kid) return bos();
    const p = al(kid);
    if (ad) p.ad = ad;
    // Uzun aradan sonra donduyse yeni bir yayinda sayilir
    if (p.sonGorulme && Date.now() - p.sonGorulme > YENI_YAYIN_MS) p.yayin++;
    else if (!p.sonGorulme) p.yayin = 1;
    p.sonGorulme = Date.now();
    for (const k in (artis || {})) p[k] = (p[k] || 0) + artis[k];
    harita.set(kid, p);
    yazIstegi();
    return p;
  }

  /* Seviye egrisi: basta hizli, sonra yavaslayan. Karekok tam olarak bunu
     yapiyor — ilk seviyeler birkac mesajda geliyor (yeni gelen hemen bir
     sey kazaniyor), ust seviyeler emek istiyor.
       lv1 = 8xp · lv2 = 32 · lv3 = 72 · lv5 = 200 · lv10 = 800 */
  function seviye(xp) { return Math.floor(Math.sqrt((xp || 0) / 8)); }
  function seviyeIcinXp(lv) { return lv * lv * 8; }

  let kirli = false, zamanlayici = 0;
  function yazIstegi() {
    kirli = true;
    if (zamanlayici) return;
    zamanlayici = setTimeout(() => {
      zamanlayici = 0;
      if (!kirli) return;
      kirli = false;
      /* LRU: EN SON GORULENI tut.
         Oyunlarin ikisinde bu is yanlis yapilmisti — siralamadan
         slice(0, N) yapiliyordu ve JavaScript'te bu EN ONCE EKLENENI
         tutar, yani N kisiden sonra gelen herkes kalici olarak
         atiliyordu. Burada acikca son gorulmeye gore siraliyoruz. */
      const liste = [...harita.entries()]
        .sort((a, b) => (b[1].sonGorulme || 0) - (a[1].sonGorulme || 0))
        .slice(0, TAVAN);
      harita = new Map(liste);
      try { localStorage.setItem(ANAHTAR, JSON.stringify(liste)); } catch { /* dolu */ }
    }, 2000);
    if (zamanlayici.unref) zamanlayici.unref();
  }

  /** Izleyiciye gosterilecek kisa ozet: "3. yayının · sv4 · 2 galibiyet" */
  function ozet(kid) {
    const p = harita.get(kid);
    if (!p) return '';
    const parca = [];
    if (p.yayin > 1) parca.push(`${p.yayin}. yayının`);
    const lv = seviye(p.xp);
    if (lv > 0) parca.push(`sv${lv}`);
    const galip = (p.misketGalip || 0) + (p.pkGalip || 0);
    if (galip > 0) parca.push(`${galip} galibiyet`);
    return parca.join(' · ');
  }

  global.Profil = { al, ekle, ozet, seviye, seviyeIcinXp, ANAHTAR };
})(window);
