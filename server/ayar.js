'use strict';
/**
 * ayar.js — exe'nin YANINDA duran ayar dosyasini okur/yazar.
 *
 * Cift tiklanarak acilan bir programda komut satiri argumani yok. Kullanici
 * adini her acilista sormamak icin bir kere sorup yanina kaydediyoruz:
 *
 *     TikTokOyunlar.exe
 *     tiktok-ayarlar.json      <- burasi
 *
 * NEDEN process.execPath?
 *   SEA icinde __dirname anlamsiz (gomulu sanal yol). Kullanicinin gordugu
 *   gercek konum exe'nin kendi yolu; ayar dosyasi da orada durmali ki
 *   "exe'yi masaustune tasidim, ayarlarim gitti" olmasin.
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const DOSYA = path.join(path.dirname(process.execPath), 'tiktok-ayarlar.json');

function oku() {
  try {
    return JSON.parse(fs.readFileSync(DOSYA, 'utf8'));
  } catch {
    return {};
  }
}

function yaz(nesne) {
  try {
    fs.writeFileSync(DOSYA, JSON.stringify(nesne, null, 2), 'utf8');
    return true;
  } catch (e) {
    console.log('   (ayarlar kaydedilemedi: ' + e.message + ')');
    return false;
  }
}

/**
 * Kullanici adini sor. Bos birakilirsa null doner -> mock moda geciyoruz.
 * @returns {Promise<string|null>}
 */
function sor(soru) {
  return new Promise((cozumle) => {
    // Konsol yoksa (arka planda baslatildiysa) soru soramayiz
    if (!process.stdin.isTTY) return cozumle(null);

    const arayuz = readline.createInterface({ input: process.stdin, output: process.stdout });
    arayuz.question(soru, (cevap) => {
      arayuz.close();
      cozumle(String(cevap || '').trim());
    });
  });
}

/**
 * Kullanici adini bul: once arguman, sonra ayar dosyasi, sonra sor.
 * @param {string|null} argumandan  --user ile verilmis ad
 * @returns {Promise<string|null>}
 */
async function kullaniciAdi(argumandan) {
  if (argumandan) return argumandan;

  const kayitli = oku();
  if (kayitli.kullanici) return kayitli.kullanici;

  // Konsol yoksa (arka planda / kisayolla gizli baslatildiysa) soru soramayiz.
  // Kurulum ekranini basip cevapsiz kalmak yerine ne olacagini soyle.
  if (!process.stdin.isTTY) {
    console.log('');
    console.log('  Kullanici adi ayarlanmamis ve soru sorulacak bir konsol yok.');
    console.log('  TEST modunda aciliyor. Kontrol panelinden kullanici adini');
    console.log('  girip "Bağlan" dersen kaydedilir ve bir daha sormaz.');
    console.log('');
    return null;
  }

  console.log('');
  console.log('  ------------------------------------------------------------');
  console.log('   ILK KURULUM');
  console.log('  ------------------------------------------------------------');
  console.log('   TikTok kullanici adin ne? (@ isaretini yazma)');
  console.log('   Ornek: dalpirin');
  console.log('');
  console.log('   Bos birakip Enter\'a basarsan TEST MODU acilir:');
  console.log('   sahte yorumlar gelir, oyunlari denersin.');
  console.log('');

  const cevap = await sor('   Kullanici adin: ');
  const temiz = String(cevap || '').replace(/^@/, '').trim();

  if (!temiz) {
    console.log('\n   Test modu seciliyor. Sonra degistirmek icin kontrol panelini kullan.\n');
    return null;
  }

  yaz({ ...kayitli, kullanici: temiz });
  console.log(`\n   Kaydedildi (${path.basename(DOSYA)}). Bir daha sormayacagim.`);
  console.log('   Degistirmek icin bu dosyayi sil ya da kontrol panelinden gir.\n');
  return temiz;
}

/** Panelden kullanici degisince kalici hale getir. */
function kullaniciKaydet(ad) {
  const k = oku();
  if (ad) k.kullanici = ad;
  else delete k.kullanici;
  yaz(k);
}

/** Sohbet botu icin TikTok oturum bilgisi (sessionid cerezi). */
function oturumKaydet(sessionId, idc) {
  const a = oku();
  a.oturum = { sessionId, idc: idc || a.oturum?.idc || '' };
  yaz(a);
}
function oturumOku() {
  return oku().oturum || null;
}

module.exports = { oku, yaz, kullaniciAdi, kullaniciKaydet, oturumKaydet, oturumOku, DOSYA };
