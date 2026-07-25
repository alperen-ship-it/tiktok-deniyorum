/**
 * kapismalar.js — PK Savasi'nin tartisma konulari ("bait").
 *
 * Ilke: insanlarin YORUM YAZMADAN duramayacagi konular. Kriterler:
 *   1) Herkesin bir tarafi vardir (kararsiz kalinmaz)
 *   2) Tek bakista anlasilir, aciklama gerektirmez
 *   3) ZARARSIZ — siyaset, din, takim tutma, kisisel hakaret YOK.
 *      Yayinci basini agritacak hicbir konu listede olmamali.
 *
 * Bicim: { a: {ad, emoji, renk, kelimeler}, b: {...} }
 * kelimeler: bu tarafa katilmak icin yazilabilecek kelimeler (kucuk harf,
 * Turkce karakterler sadelestirilmis halde de eslesir).
 */
window.KAPISMALAR = [
  { a: { ad: 'KEDİ', emoji: '🐱', renk: '#ff8a3d', kelimeler: ['kedi', 'kedic', 'pisi'] },
    b: { ad: 'KÖPEK', emoji: '🐶', renk: '#3fb9ff', kelimeler: ['kopek', 'köpek', 'dog'] } },

  { a: { ad: 'ÇAY', emoji: '🫖', renk: '#e0784a', kelimeler: ['cay', 'çay'] },
    b: { ad: 'KAHVE', emoji: '☕', renk: '#8b6bff', kelimeler: ['kahve', 'coffee'] } },

  { a: { ad: 'SOĞANLI', emoji: '🧅', renk: '#c05cff', kelimeler: ['soganli', 'soğanlı', 'sogan', 'soğan'] },
    b: { ad: 'SOĞANSIZ', emoji: '🍳', renk: '#ffd23f', kelimeler: ['sogansiz', 'soğansız', 'sade'] },
    baslik: 'MENEMEN' },

  { a: { ad: 'ANANASLI', emoji: '🍍', renk: '#b6e02b', kelimeler: ['ananas', 'ananasli', 'ananaslı', 'evet'] },
    b: { ad: 'ASLA', emoji: '🚫', renk: '#ff4d4d', kelimeler: ['asla', 'hayir', 'hayır', 'olmaz'] },
    baslik: 'ANANASLI PİZZA' },

  { a: { ad: 'YAZ', emoji: '🌞', renk: '#ffd23f', kelimeler: ['yaz', 'sicak', 'sıcak'] },
    b: { ad: 'KIŞ', emoji: '❄️', renk: '#66d9ff', kelimeler: ['kis', 'kış', 'soguk', 'soğuk'] } },

  { a: { ad: 'DENİZ', emoji: '🌊', renk: '#3fb9ff', kelimeler: ['deniz', 'kumsal', 'plaj'] },
    b: { ad: 'DAĞ', emoji: '🏔️', renk: '#7ed957', kelimeler: ['dag', 'dağ', 'yayla'] } },

  { a: { ad: 'PİZZA', emoji: '🍕', renk: '#ff6b5e', kelimeler: ['pizza'] },
    b: { ad: 'HAMBURGER', emoji: '🍔', renk: '#e0b06b', kelimeler: ['burger', 'hamburger'] } },

  { a: { ad: 'GECE', emoji: '🌙', renk: '#8b6bff', kelimeler: ['gece', 'gece kusu', 'baykus', 'baykuş'] },
    b: { ad: 'SABAH', emoji: '☀️', renk: '#ffd23f', kelimeler: ['sabah', 'erkenci', 'erken'] },
    baslik: 'SEN HANGİSİSİN?' },

  { a: { ad: 'ANDROID', emoji: '🤖', renk: '#7ed957', kelimeler: ['android', 'samsung', 'droid'] },
    b: { ad: 'IPHONE', emoji: '📱', renk: '#f4f1ff', kelimeler: ['iphone', 'apple', 'ios'] } },

  { a: { ad: 'ALTYAZI', emoji: '💬', renk: '#3fb9ff', kelimeler: ['altyazi', 'altyazı', 'orijinal'] },
    b: { ad: 'DUBLAJ', emoji: '🎙️', renk: '#ff8a3d', kelimeler: ['dublaj', 'turkce', 'türkçe'] },
    baslik: 'FİLM İZLERKEN' },

  { a: { ad: 'AYRAN', emoji: '🥛', renk: '#f4f1ff', kelimeler: ['ayran'] },
    b: { ad: 'KOLA', emoji: '🥤', renk: '#ff4d4d', kelimeler: ['kola', 'gazoz'] } },

  { a: { ad: 'ACILI', emoji: '🌶️', renk: '#ff4d4d', kelimeler: ['acili', 'acılı', 'aci', 'acı'] },
    b: { ad: 'ACISIZ', emoji: '🥗', renk: '#7ed957', kelimeler: ['acisiz', 'acısız', 'sade'] } },

  { a: { ad: 'PC', emoji: '🖥️', renk: '#5b7fff', kelimeler: ['pc', 'bilgisayar', 'masaustu'] },
    b: { ad: 'MOBİL', emoji: '📱', renk: '#ff5fc8', kelimeler: ['mobil', 'telefon'] },
    baslik: 'OYUN OYNARKEN' },

  { a: { ad: 'SESLİ MESAJ', emoji: '🎤', renk: '#ff8a3d', kelimeler: ['sesli', 'ses'] },
    b: { ad: 'YAZILI', emoji: '⌨️', renk: '#00c2c7', kelimeler: ['yazili', 'yazılı', 'yazi', 'yazı'] } },

  { a: { ad: 'KİTAP', emoji: '📚', renk: '#e0b06b', kelimeler: ['kitap', 'okumak'] },
    b: { ad: 'FİLM', emoji: '🎬', renk: '#c05cff', kelimeler: ['film', 'dizi', 'izlemek'] } },

  { a: { ad: 'MAKARNA', emoji: '🍝', renk: '#ffd23f', kelimeler: ['makarna', 'pasta'] },
    b: { ad: 'PİLAV', emoji: '🍚', renk: '#f4f1ff', kelimeler: ['pilav', 'pirinc', 'pirinç'] } },

  { a: { ad: 'SÜTLÜ', emoji: '🍫', renk: '#e0b06b', kelimeler: ['sutlu', 'sütlü'] },
    b: { ad: 'BİTTER', emoji: '🖤', renk: '#8b6bff', kelimeler: ['bitter', 'kakao'] },
    baslik: 'ÇİKOLATA' },

  { a: { ad: 'ŞEHİR', emoji: '🏙️', renk: '#66d9ff', kelimeler: ['sehir', 'şehir', 'kalabalik'] },
    b: { ad: 'KÖY', emoji: '🌾', renk: '#9be07a', kelimeler: ['koy', 'köy', 'doga', 'doğa', 'sakin'] } },

  { a: { ad: 'ERKEN GİT', emoji: '⏰', renk: '#3fb9ff', kelimeler: ['erken'] },
    b: { ad: 'SON DAKİKA', emoji: '🏃', renk: '#ff6b5e', kelimeler: ['son', 'gec', 'geç', 'sondakika'] },
    baslik: 'RANDEVUYA' },

  { a: { ad: 'YURT İÇİ', emoji: '🇹🇷', renk: '#ff4d4d', kelimeler: ['yurtici', 'yurtiçi', 'ici', 'içi', 'turkiye', 'türkiye'] },
    b: { ad: 'YURT DIŞI', emoji: '✈️', renk: '#5b7fff', kelimeler: ['yurtdisi', 'yurtdışı', 'disi', 'dışı', 'yurt disi'] },
    baslik: 'TATİL' },

  { a: { ad: 'FUTBOL', emoji: '⚽', renk: '#7ed957', kelimeler: ['futbol', 'top'] },
    b: { ad: 'BASKETBOL', emoji: '🏀', renk: '#ff8a3d', kelimeler: ['basket', 'basketbol'] } },

  { a: { ad: 'KÜLAHTA', emoji: '🍦', renk: '#ffd23f', kelimeler: ['kulah', 'külah', 'kulahta', 'külahta'] },
    b: { ad: 'KÂSEDE', emoji: '🥣', renk: '#66d9ff', kelimeler: ['kase', 'kâse', 'kasede', 'kâsede'] },
    baslik: 'DONDURMA' },

  { a: { ad: 'ÇORAPLA', emoji: '🧦', renk: '#ff5fc8', kelimeler: ['corapla', 'çorapla', 'corap', 'çorap'] },
    b: { ad: 'ÇORAPSIZ', emoji: '🦶', renk: '#9be07a', kelimeler: ['corapsiz', 'çorapsız', 'ciplak', 'çıplak'] },
    baslik: 'UYURKEN' },

  { a: { ad: 'SABAH DUŞU', emoji: '🌅', renk: '#ffd23f', kelimeler: ['sabah'] },
    b: { ad: 'AKŞAM DUŞU', emoji: '🌃', renk: '#8b6bff', kelimeler: ['aksam', 'akşam', 'gece'] },
    baslik: 'DUŞ' },

  { a: { ad: 'TAVUK', emoji: '🍗', renk: '#e0b06b', kelimeler: ['tavuk', 'pilic', 'piliç'] },
    b: { ad: 'ET', emoji: '🥩', renk: '#ff4d4d', kelimeler: ['et', 'kirmizi', 'kırmızı', 'kofte', 'köfte'] } },

  { a: { ad: 'DEMLİ', emoji: '🍵', renk: '#c9622e', kelimeler: ['demli', 'koyu', 'tavsan', 'tavşan'] },
    b: { ad: 'AÇIK', emoji: '🫖', renk: '#e0b06b', kelimeler: ['acik', 'açık', 'tavsankani'] },
    baslik: 'ÇAY NASIL?' },

  { a: { ad: 'KULAKLIK', emoji: '🎧', renk: '#8b6bff', kelimeler: ['kulaklik', 'kulaklık'] },
    b: { ad: 'HOPARLÖR', emoji: '🔊', renk: '#ff8a3d', kelimeler: ['hoparlor', 'hoparlör', 'ses', 'speaker'] } },

  { a: { ad: 'PLANLI', emoji: '📋', renk: '#3fb9ff', kelimeler: ['planli', 'planlı', 'plan'] },
    b: { ad: 'SPONTAN', emoji: '🎲', renk: '#ff5fc8', kelimeler: ['spontan', 'ani', 'anlik', 'anlık', 'surpriz', 'sürpriz'] },
    baslik: 'SEN NASILSIN?' },

  { a: { ad: 'ONLİNE', emoji: '🛒', renk: '#66d9ff', kelimeler: ['online', 'internet', 'kargo'] },
    b: { ad: 'MAĞAZA', emoji: '🏬', renk: '#ffd23f', kelimeler: ['magaza', 'mağaza', 'dukkan', 'dükkan'] },
    baslik: 'ALIŞVERİŞ' },

  { a: { ad: 'BUZLU', emoji: '🧊', renk: '#66d9ff', kelimeler: ['buzlu', 'buz', 'soguk', 'soğuk'] },
    b: { ad: 'NORMAL', emoji: '💧', renk: '#f4f1ff', kelimeler: ['normal', 'oda', 'sicaklik', 'sıcaklık'] },
    baslik: 'SU NASIL?' },
];
