'use strict';
/**
 * veri.js — Disaridaki bir JSON API'sini periyodik olarak cekip overlay'lere
 * yayinlayan genel amacli modul.
 *
 * NEDEN SUNUCU TARAFINDA?
 *   Overlay bir tarayici sayfasi. Baska bir siteye dogrudan istek atarsa CORS'a
 *   takilir; ustelik API anahtarini sayfaya gomsek yayinda ekranda gorunur.
 *   Istegi kopru atiyor, overlay'e sadece sonucu yolluyoruz.
 *
 * YAPILANDIRMA: server/veri-kaynaklari.json
 *   [
 *     {
 *       "ad": "valorant",
 *       "url": "https://api.ornek.com/rank/oyuncu",
 *       "basliklar": { "Authorization": "ANAHTARIN" },
 *       "aralik": 60,
 *       "alanlar": {
 *         "rank":  "data.currenttierpatched",
 *         "puan":  "data.ranking_in_tier",
 *         "gorsel":"data.images.small"
 *       }
 *     }
 *   ]
 *
 * "alanlar" -> cevabin icinden hangi degerleri alacagimiz. Nokta ile
 * derinlere inilebilir, dizi indeksi de nokta ile: "data.items.0.name"
 *
 * Overlay tarafinda:
 *   TT.on('veri', ev => { ev.kaynak; ev.alanlar.rank; ... })
 */

const fs = require('fs');
const path = require('path');

const YAPILANDIRMA = path.join(__dirname, 'veri-kaynaklari.json');

/** "a.b.0.c" yolunu nesnede takip et. */
function yolIzle(nesne, yol) {
  return String(yol).split('.').reduce((o, p) => (o == null ? o : o[p]), nesne);
}

function yapilandirmaOku(log) {
  if (!fs.existsSync(YAPILANDIRMA)) return [];
  try {
    const ham = JSON.parse(fs.readFileSync(YAPILANDIRMA, 'utf8'));
    const liste = Array.isArray(ham) ? ham : [ham];
    // Yorum amacli girdileri ve eksikleri ele
    return liste.filter((k) => k && k.url && k.ad && !k.kapali);
  } catch (e) {
    log('veri-kaynaklari.json okunamadi:', e.message);
    return [];
  }
}

/**
 * @param {(ev:object)=>void} yayinla  normalize olayi overlay'lere gonderen fonksiyon
 * @param {(...a:any)=>void} log
 * @returns {{ dur:()=>void, kaynaklar:()=>string[], sonDeger:()=>object }}
 */
function baslat(yayinla, log) {
  const kaynaklar = yapilandirmaOku(log);
  const zamanlayicilar = [];
  const sonDegerler = {};

  if (!kaynaklar.length) {
    return { dur() {}, kaynaklar: () => [], sonDeger: () => ({}) };
  }

  log(`veri kaynaklari: ${kaynaklar.map((k) => k.ad).join(', ')}`);

  for (const k of kaynaklar) {
    const aralik = Math.max(10, Number(k.aralik) || 60) * 1000;   // en sik 10 sn
    let ardArdaHata = 0;

    const cek = async () => {
      try {
        const kontrol = new AbortController();
        const zamanAsimi = setTimeout(() => kontrol.abort(), 12000);
        const cevap = await fetch(k.url, {
          headers: k.basliklar || {},
          signal: kontrol.signal,
        });
        clearTimeout(zamanAsimi);

        if (!cevap.ok) throw new Error('HTTP ' + cevap.status);
        const govde = await cevap.json();

        const alanlar = {};
        for (const [ad, yol] of Object.entries(k.alanlar || {})) {
          alanlar[ad] = yolIzle(govde, yol);
        }

        sonDegerler[k.ad] = alanlar;
        ardArdaHata = 0;
        yayinla({ type: 'veri', kaynak: k.ad, alanlar, ts: Date.now() });
      } catch (e) {
        ardArdaHata++;
        // Ilk hatada bagir, sonra sus — 60 sn'de bir tekrarlayan hata
        // konsolu doldurmasin
        if (ardArdaHata === 1 || ardArdaHata % 10 === 0) {
          log(`veri kaynagi "${k.ad}" hata (${ardArdaHata}. kez):`, e.message);
        }
        yayinla({ type: 'veri', kaynak: k.ad, hata: String(e.message || e), ts: Date.now() });
      }
    };

    cek();                                        // hemen bir kez
    zamanlayicilar.push(setInterval(cek, aralik));
  }

  return {
    dur() { while (zamanlayicilar.length) clearInterval(zamanlayicilar.pop()); },
    kaynaklar: () => kaynaklar.map((k) => k.ad),
    sonDeger: () => sonDegerler,
  };
}

module.exports = { baslat, yolIzle };
