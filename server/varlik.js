'use strict';
/**
 * varlik.js — overlay dosyalarini nereden okuyacagimizi bilen tek yer.
 *
 * Uygulama iki sekilde calisiyor:
 *
 *   1) KAYNAK KODDAN   node server/bridge.js
 *      Dosyalar diskte, depo klasorunde duruyor. Duzenleyip sayfayi
 *      yenileyince degisiklik aninda gorunuyor — gelistirirken bu lazim.
 *
 *   2) TEK DOSYA EXE   TikTokOyunlar.exe
 *      Yaninda hicbir klasor yok; butun HTML/CSS/JS exe'nin ICINE gomulu
 *      (Node SEA "assets" mekanizmasi). Kullanicinin kopyalayacagi tek bir
 *      dosya olmasi, "klasoru eksik kopyaladim" hatasini tamamen kaldiriyor.
 *
 * Ayni sunucu kodu ikisinde de calissin diye okuma isini buraya topluyoruz.
 */

const fs = require('fs');
const path = require('path');

let sea = null;
try {
  // node:sea, Node 20.12+ ile geldi. Yoksa (ya da eski Node) sorun degil:
  // o zaman zaten diskten okuyoruz.
  sea = require('node:sea');
} catch { /* eski Node — sadece disk modu */ }

const SEA_MI = !!(sea && typeof sea.isSea === 'function' && sea.isSea());

// Kaynak koddan calisirken depo kokü: server/ klasorunun bir ustu
const KOK = path.resolve(__dirname, '..');

/**
 * URL yolunu ("/overlays/boss.html") varlik adina cevir ("overlays/boss.html").
 * Klasor disina cikma (path traversal) denemelerini burada kesiyoruz.
 * @returns {string|null} null -> istek reddedilmeli
 */
function adaCevir(urlYolu) {
  let temiz;
  try {
    temiz = decodeURIComponent(String(urlYolu).split('?')[0]);
  } catch {
    return null;                       // bozuk yuzde kodlamasi
  }
  temiz = temiz.replace(/\\/g, '/').replace(/^\/+/, '');
  if (!temiz) return '';

  // ".." parcalarini cozup hala kokun altinda miyiz diye bak
  const parcalar = [];
  for (const p of temiz.split('/')) {
    if (!p || p === '.') continue;
    if (p === '..') {
      if (!parcalar.length) return null;   // koku asti
      parcalar.pop();
      continue;
    }
    parcalar.push(p);
  }
  return parcalar.join('/');
}

/**
 * Varligi oku.
 * @param {string} ad  "overlays/boss.html" gibi, kok-goreli
 * @returns {Buffer|null}
 */
function oku(ad) {
  if (ad == null) return null;

  if (SEA_MI) {
    try {
      const ham = sea.getRawAsset(ad);
      return ham ? Buffer.from(ham) : null;
    } catch {
      return null;                     // exe'ye gomulmemis
    }
  }

  const hedef = path.resolve(KOK, ad);
  // resolve sonrasi tekrar dogrula — adaCevir'i atlayan bir cagri gelirse diye
  if (hedef !== KOK && !hedef.startsWith(KOK + path.sep)) return null;
  try {
    const st = fs.statSync(hedef);
    if (st.isDirectory()) return null;
    return fs.readFileSync(hedef);
  } catch {
    return null;
  }
}

/** Varlik var mi? (dizin indeksine dusmeden once bakmak icin) */
function varMi(ad) {
  return oku(ad) !== null;
}

module.exports = { adaCevir, oku, varMi, SEA_MI, KOK };
