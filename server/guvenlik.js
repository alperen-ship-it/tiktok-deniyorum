'use strict';
/**
 * Yerel erisim guvenligi: Host / Origin izin listesi.
 *
 * Kopru yayincinin kendi bilgisayarinda calisir; ama tarayicida acilan HERHANGI
 * bir sayfa http://localhost:PORT'a istek atabilir (<img src>, form, fetch) ve
 * DNS-rebinding ile "evil.com" adini 127.0.0.1'e cevirip ayni-origin gibi
 * konusabilir. Savunma iki katmanli:
 *   1) Host basligi izin listesinde olmali (rebinding'i keser: saldirgan adi
 *      listede yok)
 *   2) Yan etkili uclar POST + ozel baslik ister (bridge.js); Origin varsa o da
 *      listede olmali ve portu bu sunucununkiyle ayni olmali.
 *
 * Izinli adlar (port karsilastirilmaz):
 *   localhost, 127.0.0.1, ::1
 *   localtest.me ve *.localtest.me  (127.0.0.1'e cozulen herkese acik alan adi)
 *   hosts dosyasinda loopback'e (127.x / ::1) yazilmis her ad (yayin.local ...)
 *   --host a,b ile verilenler; --lan ile bu makinenin LAN IPv4 adresleri
 */

const fs = require('fs');
const os = require('os');
const path = require('path');

const SABIT = ['localhost', '127.0.0.1', '::1'];

/** "Host: Foo.Example:8787" / "[::1]:8787" -> "foo.example" / "::1". */
function hostAdi(deger) {
  let h = String(deger || '').trim().toLowerCase();
  if (!h) return '';
  if (h[0] === '[') {                       // [::1]:8787
    const k = h.indexOf(']');
    return k > 0 ? h.slice(1, k) : '';
  }
  const iki = h.indexOf(':');
  if (iki !== -1 && h.indexOf(':', iki + 1) === -1) h = h.slice(0, iki);   // ad:port
  return h.replace(/\.$/, '');              // "localhost." (mutlak ad)
}

/** "Host: ad:8787" / "[::1]:8787" -> 8787 (port yoksa http icin 80). */
function hostPortu(deger) {
  const h = String(deger || '').trim();
  const m = /:(\d+)$/.exec(h.replace(/^\[[^\]]*\]/, ''));
  return m ? Number(m[1]) : 80;
}

/** Origin'in portu (yoksa semaya gore 80/443). */
function originPortu(origin) {
  try {
    const u = new URL(String(origin));
    return u.port ? Number(u.port) : (u.protocol === 'https:' ? 443 : 80);
  } catch {
    return -1;
  }
}

/** Origin basligindan host adi. "null" / bozuk -> '' (listede olamaz). */
function originAdi(origin) {
  try {
    const u = new URL(String(origin));
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return '';
    return hostAdi(u.hostname);
  } catch {
    return '';
  }
}

function loopbackMu(ip) {
  return /^127\./.test(ip) || ip === '::1' || /^0*:0*:0*:0*:0*:0*:0*:0*1$/.test(ip);
}

/** hosts dosyasi icerigi -> loopback'e eslenmis adlar. Saf (test icin). */
function hostsAyikla(metin) {
  const out = new Set();
  for (const satir of String(metin || '').split(/\r?\n/)) {
    const temiz = satir.replace(/#.*$/, '').trim();
    if (!temiz) continue;
    const parca = temiz.split(/\s+/);
    if (!loopbackMu(parca[0].replace(/%.*$/, ''))) continue;
    for (const ad of parca.slice(1)) out.add(hostAdi(ad));
  }
  out.delete('');
  return out;
}

function hostsYolu() {
  return process.platform === 'win32'
    ? path.join(process.env.SystemRoot || 'C:\\Windows', 'System32', 'drivers', 'etc', 'hosts')
    : '/etc/hosts';
}

/** Acilista BIR kez okunur; okunamazsa bos (sorun degil, --host var). */
function hostsOku(yol) {
  try {
    return hostsAyikla(fs.readFileSync(yol || hostsYolu(), 'utf8'));
  } catch {
    return new Set();
  }
}

/** Bu makinenin LAN (dis arayuzlu) IPv4 adresleri. */
function lanAdresleri() {
  const out = [];
  const arayuzler = os.networkInterfaces();
  for (const ad of Object.keys(arayuzler)) {
    for (const a of arayuzler[ad] || []) {
      const v4 = a.family === 'IPv4' || a.family === 4;
      if (v4 && !a.internal) out.push(a.address);
    }
  }
  return out;
}

/**
 * Izin denetleyicisi olusturur.
 * @param {{ ekstra?: string[], lan?: boolean, hostsYolu?: string, lanListesi?: string[] }} o
 */
function olustur(o) {
  const opt = o || {};
  const tam = new Set(SABIT);
  const hostsAdlari = hostsOku(opt.hostsYolu);
  for (const ad of hostsAdlari) tam.add(ad);
  for (const ad of opt.ekstra || []) {
    const t = hostAdi(ad);
    if (t) tam.add(t);
  }
  const lan = opt.lan ? (opt.lanListesi || lanAdresleri()) : [];
  for (const ip of lan) tam.add(ip);
  // --host null: file:// ya da sandbox'li sayfalarin Origin'i "null" / "file://". Varsayilan
  // reddedilir; bilerek acmak isteyen --host null der.
  const nullOk = tam.has('null');

  const gorulen = new Set();
  function hostIzinli(ad) {
    if (!ad) return false;
    if (tam.has(ad)) return true;
    return ad === 'localtest.me' || ad.endsWith('.localtest.me');
  }
  return {
    hostAdi,
    hostIzinli,
    /**
     * Origin yoksa (ayni-origin GET, curl, sunucu) serbest. Varsa host'u izinli
     * olmali VE (hostBasligi verildiyse) portu bu sunucunun portuyla ayni:
     * ayni makinede baska portta calisan bir sayfa (ornegin
     * http://127.0.0.1:3000) sohbet olaylarini okuyamasin. Gercek overlay'ler
     * her zaman kendi sunucusundan gelir, yani port zaten tutar.
     */
    originIzinli(origin, hostBasligi) {
      if (origin === undefined || origin === null || origin === '') return true;
      // file:// sayfalarda Chromium WebSocket'e "Origin: file://" yollar, bazi
      // yollarda "null"; ikisi de ayni anahtara (--host null) baglidir.
      const o = String(origin);
      if (o === 'null' || o.startsWith('file:')) return nullOk;
      if (!hostIzinli(originAdi(origin))) return false;
      if (hostBasligi === undefined) return true;
      return originPortu(origin) === hostPortu(hostBasligi);
    },
    /** Reddedilen host'u yalnizca ILK kez true doner (log icin). */
    ilkRed(ad) {
      if (gorulen.has(ad)) return false;
      if (gorulen.size < 200) gorulen.add(ad);
      return true;
    },
    liste() { return [...tam]; },
    hostsAdlari: [...hostsAdlari],
    lan,
  };
}

module.exports = { olustur, hostAdi, hostPortu, originAdi, hostsAyikla, hostsOku, lanAdresleri, SABIT };
