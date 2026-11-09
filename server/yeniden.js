'use strict';
/**
 * Yeniden deneme karari — SAF fonksiyon, hicbir yan etkisi yok.
 *
 *   karar(hata, deneme, { bekle, rng }) -> { delayMs, state, tur, message }
 *
 * `hata` bir Error ya da { olay: 'streamEnd' | 'disconnected' | 'sessiz' }.
 * `deneme` 1'den baslar: bu, ARDISIK basarisiz deneme sayisi (basarili
 * baglantidan sonra sifirlanir). Cevrimdisi beklemede sayilmaz.
 *
 * Siniflar:
 *   cevrimdisi  yayin kapali -> --bekle saniyede bir (en az 10 sn) sabit
 *   limit       imzalama limiti -> retry-after, 30 sn .. 15 dk arasina kirpilir;
 *               retry-after yoksa 30 sn'den baslayip ikiye katlanir
 *   ucretli     paywall / plan hatasi -> 5 dk'da bir (tavsiye bir kez basilir)
 *   diger       ag, imza sunucusu cokmesi, bilinmeyen -> 10, 20, 40 sn ...
 *               en fazla 5 dk, +-%20 titresimle (hepsi ayni anda denemesin)
 *
 * Hata siniflarini instanceof ile degil ad/alan/mesajla taniyoruz: paket
 * ESM, bu dosya ondan habersiz kalsin; esbuild isim kisaltsa bile mesaj
 * metni degismiyor.
 */

const SN = 1000;
const LIMIT_MIN = 30 * SN;
const LIMIT_MAX = 15 * 60 * SN;
const UCRETLI_BEKLEME = 5 * 60 * SN;
const USTEL_TABAN = 10 * SN;
const USTEL_TAVAN = 5 * 60 * SN;
const JITTER = 0.2;

function mesajOku(e) {
  return String(e?.message || e?.info || e?.exception?.message || e || '');
}

function sinif(e) {
  if (e && e.olay) return e.olay === 'streamEnd' ? 'yayinBitti' : 'diger';
  const ad = String(e?.name || e?.constructor?.name || '');
  const msg = mesajOku(e);

  // Once ad/alan (kesin), sonra mesaj kalibi. "room id" gibi belirsiz
  // kaliplar en sona kaliyor (Euler'in "Failed to retrieve Room ID ... due
  // to an error" cevabi da o kalibi iceriyor).
  if (ad === 'SignatureRateLimitError' || e?.reason === 'Rate Limited') return 'limit';
  if (ad === 'PremiumFeatureError' || ad === 'SignatureMissingTokensError' ||
      e?.reason === 'Premium Feature' || e?.reason === 'Empty Payload') return 'ucretli';
  if (ad === 'UserOfflineError') return 'cevrimdisi';
  if (/Business plan|requires a .*plan|MissingTokens|Premium Feature/i.test(msg)) return 'ucretli';
  if (/rate.?limit|too many (connections|requests)|\b429\b/i.test(msg)) return 'limit';
  if (/offline|room ?id|isn'?t online/i.test(msg)) return 'cevrimdisi';
  return 'diger';
}

function ustel(deneme, taban, tavan, rng) {
  const n = Math.max(1, Math.floor(Number(deneme) || 1));
  const ham = Math.min(tavan, taban * Math.pow(2, Math.min(n - 1, 20)));
  const r = typeof rng === 'function' ? rng() : Math.random();
  return Math.round(Math.min(tavan, ham * (1 - JITTER + 2 * JITTER * r)));
}

function kirp(v, alt, ust) {
  return Math.min(ust, Math.max(alt, v));
}

function sn(ms) {
  return Math.round(ms / SN);
}

function karar(hata, deneme, secenek) {
  const o = secenek || {};
  const bekle = Math.max(10, Number(o.bekle) || 15) * SN;
  const t = sinif(hata);
  const n = Math.max(1, Math.floor(Number(deneme) || 1));

  switch (t) {
    case 'yayinBitti':
      return { delayMs: bekle, state: 'yayin bitti', tur: t,
               message: 'yayin bitti — yeniden yayin beklemeye geciliyor.' };

    case 'cevrimdisi':
      return { delayMs: bekle, state: 'bekliyor', tur: t,
               message: 'yayin kapali, ' + sn(bekle) + ' sn sonra tekrar yoklanacak.' };

    case 'limit': {
      // retryAfter MILISANIYE (kutuphane header'i * 1000 yapiyor); header
      // yoksa 0 gelir -> kendi ustel egrimiz.
      const ra = Number(hata?.retryAfter);
      const ham = ra > 0 ? ra : LIMIT_MIN * Math.pow(2, Math.min(n - 1, 10));
      const ms = kirp(ham, LIMIT_MIN, LIMIT_MAX);
      return { delayMs: ms, state: 'limit', tur: t,
               message: 'imzalama limiti — ' + sn(ms) + ' sn sonra tekrar denenecek' +
                        (ra > 0 ? ' (sunucu retry-after: ' + sn(ra) + ' sn).' : '.') };
    }

    case 'ucretli':
      return { delayMs: UCRETLI_BEKLEME, state: 'ucretli plan', tur: t,
               message: 'imzalama ucretli plan istiyor — ' + sn(UCRETLI_BEKLEME) + ' sn sonra tekrar denenecek.' };

    default: {
      const ms = ustel(n, USTEL_TABAN, USTEL_TAVAN, o.rng);
      const ne = hata?.olay === 'disconnected' ? 'baglanti koptu'
               : hata?.olay === 'sessiz' ? 'yayin sessiz kaldi'
               : 'baglanti hatasi';
      return { delayMs: ms, state: hata?.olay === 'sessiz' ? 'sessiz' : 'hata', tur: t,
               message: ne + ' (' + n + '. deneme) — ' + sn(ms) + ' sn sonra tekrar denenecek.' };
    }
  }
}

/** Panelde gosterilecek kisa metin: "limit — 90 sn sonra tekrar". */
function durumMetni(etiket, kalanMs) {
  const s = Math.max(0, Math.ceil(kalanMs / SN));
  const sure = s >= 120 ? Math.round(s / 60) + ' dk' : s + ' sn';
  return etiket + ' — ' + sure + ' sonra tekrar';
}

module.exports = {
  karar, sinif, durumMetni,
  SABIT: { LIMIT_MIN, LIMIT_MAX, UCRETLI_BEKLEME, USTEL_TABAN, USTEL_TAVAN, JITTER },
};
