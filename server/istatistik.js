'use strict';
/**
 * istatistik.js — "ne ise yariyor" sorusunun tahminle degil veriyle cevabi.
 *
 * Simdiye kadar hangi oyunun tuttugu konusunda herkes (ben dahil) tahmin
 * yurutuyordu. Bu modul yayin boyunca sunlari sayiyor:
 *
 *   - oyun basina KAC FARKLI KISI yazdi  (asil metrik: katilim genisligi)
 *   - oyun basina kac mesaj, kac begeni, kac hediye
 *   - kac kisi HAYATINDA ILK KEZ yazdi   (huninin en dar yeri)
 *   - kac kisi geri dondu
 *
 * Neden burada (kopruda) ve oyunda degil: kopru butun olaylari zaten
 * goruyor, oyunlar donup duruyor ve sayfa yenilenince hafizalarini
 * kaybediyor. Aktif oyunu merkez /api/oyun ile bildiriyor.
 *
 * Veri makinede kaliyor, hicbir yere gonderilmiyor.
 */

const fs = require('fs');
const path = require('path');

const DOSYA = path.join(path.dirname(process.execPath), 'tiktok-istatistik.json');

function bosOyun() {
  return { mesaj: 0, begeni: 0, hediye: 0, elmas: 0, kisiler: [], ilkKez: 0 };
}

let veri = {
  surum: 1,
  ilkAcilis: new Date().toISOString(),
  gorulen: [],            // hayatinda en az bir kez yazmis kullanici kimlikleri
  oyunlar: {},            // oyun adi -> {mesaj, begeni, hediye, elmas, kisiler[], ilkKez}
  oturum: null,           // bu yayin: {basladi, mesaj, kisiler[], ilkKez, donen}
};

let gorulenSet = new Set();
let aktifOyun = 'bilinmiyor';
let kirli = false;
let yazZamanlayici = null;

function oku() {
  try {
    const ham = JSON.parse(fs.readFileSync(DOSYA, 'utf8'));
    if (ham && ham.surum === 1) {
      veri = Object.assign(veri, ham);
      // Diskte dizi tutuluyor (JSON'da Set yok); bellekte Set'e cevir.
      gorulenSet = new Set(veri.gorulen || []);
    }
  } catch { /* ilk calistirma */ }
  // Her acilis yeni bir oturum
  veri.oturum = { basladi: new Date().toISOString(), mesaj: 0, kisiler: [], ilkKez: 0, donen: 0 };
  oturumSet = new Set();
  return veri;
}

let oturumSet = new Set();

/** Diske yazmayi geciktir — her mesajda dosyaya yazmak gereksiz. */
function isaretle() {
  kirli = true;
  if (yazZamanlayici) return;
  yazZamanlayici = setTimeout(() => { yazZamanlayici = null; kaydet(); }, 5000);
  if (yazZamanlayici.unref) yazZamanlayici.unref();
}

function kaydet() {
  if (!kirli) return;
  kirli = false;
  veri.gorulen = [...gorulenSet].slice(-20000);   // sinirsiz buyumesin
  if (veri.oturum) veri.oturum.kisiler = [...oturumSet];
  try {
    fs.writeFileSync(DOSYA, JSON.stringify(veri, null, 1));
  } catch { /* disk yazilamiyorsa istatistik ugruna calismayi durdurma */ }
}

/** Merkez hangi oyunun ekranda oldugunu bildiriyor. */
function oyunAyarla(ad) {
  if (!ad) return aktifOyun;
  aktifOyun = String(ad).slice(0, 24).replace(/[^a-z0-9_-]/gi, '') || 'bilinmiyor';
  if (!veri.oyunlar[aktifOyun]) veri.oyunlar[aktifOyun] = bosOyun();
  isaretle();
  return aktifOyun;
}

/**
 * Olayi say. Kopru her olayda cagiriyor.
 * @returns {{ilk:boolean, donen:boolean}} bu kullanici ilk kez mi yaziyor
 */
function say(ev) {
  if (!ev || !ev.type) return { ilk: false, donen: false };
  const o = veri.oyunlar[aktifOyun] || (veri.oyunlar[aktifOyun] = bosOyun());
  const kid = ev.user && (ev.user.id || ev.user.uniqueId);

  let ilk = false, donen = false;

  if (ev.type === 'chat') {
    o.mesaj++;
    if (veri.oturum) veri.oturum.mesaj++;
    if (kid) {
      if (!gorulenSet.has(kid)) {
        // Hayatinda ilk kez yaziyor
        ilk = true;
        gorulenSet.add(kid);
        o.ilkKez++;
        if (veri.oturum) veri.oturum.ilkKez++;
      } else if (!oturumSet.has(kid)) {
        // Daha once yazmis ama bu yayinda ilk mesaji
        donen = true;
        if (veri.oturum) veri.oturum.donen++;
      }
      oturumSet.add(kid);
      // Oyun basina farkli kisi: kucuk kalsin diye 5000'de kes
      if (!o.kisiler.includes(kid) && o.kisiler.length < 5000) o.kisiler.push(kid);
    }
  } else if (ev.type === 'like') {
    o.begeni += Number(ev.likes) || 1;
  } else if (ev.type === 'gift') {
    o.hediye++;
    o.elmas += Number(ev.value) || 0;
  } else {
    return { ilk: false, donen: false };
  }

  isaretle();
  return { ilk, donen };
}

/** Panelin gosterecegi ozet. */
function ozet() {
  const oyunlar = {};
  for (const [ad, o] of Object.entries(veri.oyunlar)) {
    oyunlar[ad] = {
      mesaj: o.mesaj,
      kisi: o.kisiler.length,
      begeni: o.begeni,
      hediye: o.hediye,
      elmas: o.elmas,
      ilkKez: o.ilkKez,
      // Asil karsilastirma olcusu: kisi basina kac mesaj
      kisiBasi: o.kisiler.length ? Math.round((o.mesaj / o.kisiler.length) * 10) / 10 : 0,
    };
  }
  return {
    aktifOyun,
    toplamGorulen: gorulenSet.size,
    oturum: veri.oturum,
    oturumKisi: oturumSet.size,
    oyunlar,
  };
}

module.exports = { oku, say, oyunAyarla, ozet, kaydet, DOSYA };
