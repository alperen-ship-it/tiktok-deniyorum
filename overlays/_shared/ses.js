/**
 * ses.js — oyun sesleri. Dosya YOK, hepsi WebAudio ile sentezleniyor.
 *
 * Neden sentez: ses dosyasi indirmek exe'yi sisirir, ilk calmada takilma
 * yapar ve lisans derdi getirir. Kisa tonlari osilatorle uretmek hem
 * birkac kilobayt hem de gecikmesiz.
 *
 * Neden ses: TikTok'ta ses tasir. Sessiz bir oyun ekran koruyucu gibi
 * duruyor; geri sayim tikirtisi ve finis fanfari "burada bir sey oluyor"
 * hissini kuruyor. (LIVE Studio'da sayfa sesi miksere alinamiyordu, OBS'te
 * aliniyor — o yuzden artik anlamli.)
 *
 * Kullanim:  Ses.cal('katil')   ·   Ses.cal('bitis')
 * Kapatmak:  ?ses=0
 */
(function (global) {
  'use strict';

  const q = new URLSearchParams(location.search);
  const KAPALI = q.get('ses') === '0';
  const SESSIZ_MOCK = q.get('mock') === '1' && q.get('ses') !== '1';
  const SEVIYE = Math.max(0, Math.min(1, Number(q.get('sesd') || 0.35)));

  /* Ornek yolu: bu betigin bulundugu klasore gore. Sayfa hangi klasorde
     olursa olsun dogru yeri bulsun diye currentScript'ten turetiliyor. */
  const KOK_SES = (function () {
    const sc = document.currentScript && document.currentScript.src;
    return (sc ? sc.replace(/\/[^/]*$/, '/') : '_shared/') + 'ses/';
  })();

  let ctx = null;
  let ana = null;
  let sonCalma = new Map();

  function kur() {
    if (ctx || KAPALI) return ctx;
    const AC = global.AudioContext || global.webkitAudioContext;
    if (!AC) return null;
    try {
      ctx = new AC();
      ana = ctx.createGain();
      ana.gain.value = SEVIYE;
      ana.connect(ctx.destination);
      for (const ad in ORNEKLER) ornekYukle(ad);   // onden yukle: ilk calmada takilma olmasin
    } catch { ctx = null; }
    return ctx;
  }

  /**
   * Tek bir ton. sure saniye, frekans Hz.
   * @param {object} o {f, f2, sure, tip, hacim, gecikme}
   */
  function ton(o) {
    if (!ctx) return;
    const t0 = ctx.currentTime + (o.gecikme || 0);
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = o.tip || 'sine';
    osc.frequency.setValueAtTime(o.f, t0);
    if (o.f2) osc.frequency.exponentialRampToValueAtTime(Math.max(1, o.f2), t0 + o.sure);
    // Yumusak zarf: tik/klik sesi olmasin
    const h = (o.hacim == null ? 1 : o.hacim);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(h, t0 + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + o.sure);
    osc.connect(g); g.connect(ana);
    osc.start(t0);
    osc.stop(t0 + o.sure + 0.02);
  }

  /* ---- GERCEK ORNEKLER (Kenney, CC0 1.0) ----
     Sentez ucuz ve gecikmesiz ama zafer fanfari gibi anlarda gercek bir
     ornegin yerini tutmuyor. Karar anlarina — kazanma, dogru cevap, bahis,
     geri sayim — gercek ses kondu; geri kalan her sey sentezde kaldi.
     Toplam ~92 KB, exe'de fark etmiyor. CC0: atif zorunlu degil, ticari
     kullanim serbest, viral degil. Lisans metni _shared/ses/ icinde. */
  const ORNEKLER = { zafer: 'zafer.ogg', dogru: 'dogru.ogg', bahis: 'bahis.ogg', tik: 'tik.ogg' };
  const tamponlar = new Map();

  function ornekYukle(ad) {
    if (!ctx || tamponlar.has(ad)) return;
    tamponlar.set(ad, null);                       // tekrar istemeyi engelle
    fetch(KOK_SES + ORNEKLER[ad])
      .then((r) => r.arrayBuffer())
      .then((b) => ctx.decodeAudioData(b))
      .then((buf) => tamponlar.set(ad, buf))
      .catch(() => tamponlar.delete(ad));          // basarisizsa sentez devreye girer
  }

  function ornekCal(ad, hacim) {
    const buf = tamponlar.get(ad);
    if (!buf) { ornekYukle(ad); return false; }    // bu sefer sentez calsin
    const src = ctx.createBufferSource();
    const g = ctx.createGain();
    g.gain.value = hacim == null ? 0.9 : hacim;
    src.buffer = buf; src.connect(g); g.connect(ana);
    src.start();
    return true;
  }

  /* Ses tarifleri. Hepsi kisa — uzun ses yayinin kendi sesini bogar. */
  const TARIFLER = {
    katil:   () => ton({ f: 620, f2: 880, sure: 0.09, tip: 'triangle', hacim: 0.5 }),
    tik:     () => { if (ornekCal('tik', 0.35)) return;
                     ton({ f: 1100, sure: 0.035, tip: 'square', hacim: 0.22 }); },
    bahis:   () => { if (ornekCal('bahis', 0.6)) return;
                     ton({ f: 880, sure: 0.09, tip: 'sine' }); },
    sonTik:  () => ton({ f: 1500, sure: 0.06, tip: 'square', hacim: 0.4 }),
    dogru:   () => { if (ornekCal('dogru', 0.7)) return;
                     ton({ f: 760, sure: 0.1, tip: 'triangle' });
                     ton({ f: 1140, sure: 0.16, tip: 'triangle', gecikme: 0.09 }); },
    yanlis:  () => ton({ f: 220, f2: 130, sure: 0.22, tip: 'sawtooth', hacim: 0.34 }),
    start:   () => { ton({ f: 440, sure: 0.1, tip: 'square', hacim: 0.4 });
                     ton({ f: 660, sure: 0.16, tip: 'square', hacim: 0.4, gecikme: 0.1 }); },
    etap:    () => { ton({ f: 520, sure: 0.08, tip: 'triangle', hacim: 0.4 });
                     ton({ f: 780, sure: 0.11, tip: 'triangle', hacim: 0.35, gecikme: 0.07 }); },
    bitis:   () => { if (ornekCal('zafer', 0.75)) return;
                     const n = [523, 659, 784, 1047];
                     n.forEach((f, i) => ton({ f, sure: i === 3 ? 0.38 : 0.14,
                                               tip: 'triangle', gecikme: i * 0.1 })); },
    hediye:  () => { ton({ f: 880, sure: 0.09, tip: 'sine' });
                     ton({ f: 1320, sure: 0.13, tip: 'sine', gecikme: 0.08 }); },
    hosgeldin: () => { ton({ f: 660, sure: 0.1, tip: 'triangle', hacim: 0.45 });
                       ton({ f: 990, sure: 0.14, tip: 'triangle', hacim: 0.4, gecikme: 0.09 }); },
  };

  /**
   * Sesi cal. Ayni ses cok sik calmasin diye kisa bir kilit var —
   * 40 kisi ayni anda yazinca 40 "katil" sesi uzayan bir vizilti oluyor.
   */
  function cal(ad, enAzMs) {
    if (KAPALI || SESSIZ_MOCK) return;
    const tarif = TARIFLER[ad];
    if (!tarif) return;
    const simdi = Date.now();
    const bekle = enAzMs == null ? 55 : enAzMs;
    if (simdi - (sonCalma.get(ad) || 0) < bekle) return;
    sonCalma.set(ad, simdi);
    if (!ctx && !kur()) return;
    // Tarayici otomatik oynatmayi kilitlemis olabilir; OBS'te kilit yok.
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});
    try { tarif(); } catch { /* ses ugruna oyunu bozma */ }
  }

  // ==========================================================================
  // MUZIK — her oyunun kendi kisa temasi ve fon dongusu
  // ==========================================================================
  /*
   * Neden sentez, yine dosya degil: bir muzik dosyasi exe'yi megabaytlarca
   * sisirir, ilk calmada indirilirken takilma yapar ve lisans derdi getirir.
   * Buradaki muzik birkac yuz satir kodla uretiliyor — sifir dosya, sifir
   * gecikme, sifir lisans.
   *
   * Neden zamanlayici ile ONDEN planlama: notalari calindiklari anda
   * tetiklersek oyun karesi takildiginda muzik de aksiyor. Bunun yerine
   * her 120 ms'de bir, 500 ms ilerisi WebAudio'nun kendi saatine
   * planlaniyor — tuval ne kadar mesgul olursa olsun tempo bozulmuyor.
   *
   * Ses seviyesi bilerek DUSUK: yayincinin sesinin ustune cikmamali.
   * ?muzik=0 kapatir · ?muzikd=0.2 seviyesini degistirir.
   */
  const MUZIK_KAPALI = q.get('muzik') === '0';
  const MUZIK_SEVIYE = Math.max(0, Math.min(1, Number(q.get('muzikd') || 0.16)));

  // Nota adi -> frekans (A4 = 440). Sadece kullandigimiz araligi uretiyoruz.
  const NOTA = (() => {
    const adlar = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const t = {};
    for (let o = 2; o <= 6; o++) {
      for (let i = 0; i < 12; i++) {
        t[adlar[i] + o] = 440 * Math.pow(2, (i - 9) / 12 + (o - 4));
      }
    }
    return t;
  })();

  /*
   * Desenler: her oyunun kimlik RENGI gibi, kimlik SESI de sabit.
   * Izleyici rotasyonda oyunun degistigini ekrana bakmadan da duyuyor.
   *   bas   — dongunun temeli, uzun notalar
   *   melodi— ustteki kisa motif ('.' = sus)
   *   vurus — ritim (x = var, . = yok)
   *   bpm   — tempo
   */
  const DESENLER = {
    // Misket: zipzip, oyuncakli — majör pentatonik, hafif
    bilye: {
      bpm: 104, dalga: 'triangle',
      bas:    ['C3', '.', 'G2', '.', 'A2', '.', 'F2', '.'],
      melodi: ['C5', 'E5', 'G5', 'E5', 'A4', 'C5', 'F4', 'G4'],
      vurus:  ['x', '.', 'x', '.', 'x', '.', 'x', 'x'],
    },
    // Bilgi: dusundurucu, seyrek — yarisma programi gerilimi
    bilgi: {
      bpm: 88, dalga: 'sine',
      bas:    ['A2', '.', '.', '.', 'F2', '.', '.', '.'],
      melodi: ['A4', '.', 'C5', '.', 'E5', '.', 'D5', '.'],
      vurus:  ['x', '.', '.', '.', 'x', '.', '.', '.'],
    },
    // PK: itisli, ritmik — kapisma
    pk: {
      bpm: 126, dalga: 'sawtooth',
      bas:    ['D3', 'D3', '.', 'D3', 'A2', '.', 'C3', '.'],
      melodi: ['D5', '.', 'F5', '.', 'A5', 'G5', 'F5', '.'],
      vurus:  ['x', 'x', '.', 'x', 'x', '.', 'x', 'x'],
    },
    // At: dortnal — nal sesini andiran ucuslu ritim
    at: {
      bpm: 118, dalga: 'triangle',
      bas:    ['G2', 'G2', '.', 'D3', 'G2', 'G2', '.', 'C3'],
      melodi: ['G4', 'B4', 'D5', 'B4', 'G4', 'D5', 'B4', 'G4'],
      vurus:  ['x', 'x', '.', 'x', 'x', 'x', '.', 'x'],
    },
    // Halay: davul (düm-tek) + zurna tinisi. Re uzerinde HICAZ dizisi
    // (Re Mib Fa# Sol La Sib Do) — Mib-Fa# artik ikilisi makamin kokusu.
    // Ezgi bu oyun icin YAZILDI; var olan bir turkuden/oyun havasindan
    // alinmadi. Diger desenlerden iki farki var, ikisi de EKLEME:
    //   vurus 't'  — "tek": davulun ince cubugu ('x' = "düm", eskisi gibi)
    //   zurna      — ezgi testere disi + genizden suzgecle calinir
    // ve ezgi/vurus 8 adimdan uzun (32 / 16): dort olculuk cumle.
    halay: {
      bpm: 96, dalga: 'triangle', zurna: true,
      bas:    ['D3', '.', '.', '.', 'D3', '.', 'A2', '.'],
      melodi: ['A5', '.', 'G5', 'F#5', 'D#5', '.', 'D5', '.',
               'D5', 'D#5', 'F#5', 'G5', 'F#5', 'D#5', 'D5', '.',
               'G5', 'A5', 'A#5', 'A5', 'G5', '.', 'F#5', 'G5',
               'A5', 'G5', 'F#5', 'D#5', 'D5', '.', 'D5', '.'],
      vurus:  ['x', '.', 't', 't', 'x', '.', 't', '.',
               'x', '.', 't', 't', 'x', 't', 't', '.'],
    },
  };

  let muzikAcik = false, desen = null, adim = 0, siradakiZaman = 0;
  let planlayici = 0, muzikGain = null;
  // Vurus saati icin: planlanan son adimlarin (adim no, calma ani, adim suresi)
  // kaydi. Tempo degisse de "su an hangi vurustayiz" buradan kesin okunur.
  const saatIzi = [];
  let zurnaSuzgec = null;

  function muzikKur() {
    if (muzikGain || !ctx) return;
    muzikGain = ctx.createGain();
    muzikGain.gain.value = 0;                 // her zaman yumusak gir
    muzikGain.connect(ana);
  }

  /** Tek bir notayi belirtilen ANA planla (calma aninda degil). */
  function nota(f, t, sure, tip, hacim) {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = tip;
    osc.frequency.setValueAtTime(f, t);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(hacim, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + sure);
    osc.connect(g); g.connect(muzikGain);
    osc.start(t);
    osc.stop(t + sure + 0.03);
  }

  /** Kisa, tok bir vurus — gurultu yerine alcak frekansli dususlu ton. */
  function vurusCal(t) {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(150, t);
    osc.frequency.exponentialRampToValueAtTime(48, t + 0.09);
    g.gain.setValueAtTime(0.5, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.11);
    osc.connect(g); g.connect(muzikGain);
    osc.start(t); osc.stop(t + 0.13);
  }

  /** "Tek": davulun ince cubugu — kisa, tiz, kuru. ("Düm" = vurusCal.) */
  function tekCal(t) {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(900, t);
    osc.frequency.exponentialRampToValueAtTime(420, t + 0.04);
    g.gain.setValueAtTime(0.3, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.06);
    osc.connect(g); g.connect(muzikGain);
    osc.start(t); osc.stop(t + 0.08);
  }

  /**
   * Zurna tinisi: cift kamisli, genizden, parlak. Testere disi dalga +
   * 1.9 kHz civarinda tepe (bant geciren) + susun ardindan gelen notaya
   * alttan kisa bir kayisla giris (carpma). Zarf diger notalardan uzun:
   * zurna nefesli, tuslu degil.
   *
   * ZURNA_HACIM: suzgec temel sesi kistigi icin diger desenlerin ezgi
   * seviyesinden (0.16) yuksek yaziliyor; OLCULEN cikis seviyesi onlarla
   * ayni bantta (desenlerin RMS karsilastirmasi yapildi).
   */
  const ZURNA_HACIM = 0.22;
  function zurnaNota(f, t, sure, hacim, kayis) {
    if (!zurnaSuzgec) {
      zurnaSuzgec = ctx.createBiquadFilter();
      zurnaSuzgec.type = 'bandpass';
      zurnaSuzgec.frequency.value = 1900;
      zurnaSuzgec.Q.value = 0.8;
      zurnaSuzgec.connect(muzikGain);
    }
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'sawtooth';
    if (kayis) {
      osc.frequency.setValueAtTime(f * 0.944, t);             // yarim ses alttan
      osc.frequency.exponentialRampToValueAtTime(f, t + 0.04);
    } else {
      osc.frequency.setValueAtTime(f, t);
    }
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(hacim, t + 0.018);
    g.gain.setValueAtTime(hacim, t + sure * 0.7);
    g.gain.exponentialRampToValueAtTime(0.0001, t + sure);
    osc.connect(g); g.connect(zurnaSuzgec);
    osc.start(t);
    osc.stop(t + sure + 0.03);
  }

  function planla() {
    if (!muzikAcik || !desen || !ctx) return;
    const adimSure = 60 / desen.bpm / 2;        // 8'lik nota
    const ufuk = ctx.currentTime + 0.5;
    while (siradakiZaman < ufuk) {
      // Diziler 8'den UZUN olabilir (halay: 32 adimlik ezgi). Onceki dort
      // desende uzunluk 8 oldugu icin sonuc eskisiyle ayni: adim % 8.
      const b = desen.bas[adim % desen.bas.length];
      const m = desen.melodi[adim % desen.melodi.length];
      const v = desen.vurus[adim % desen.vurus.length];
      if (b && b !== '.' && NOTA[b]) nota(NOTA[b], siradakiZaman, adimSure * 1.6, desen.dalga, 0.32);
      if (m && m !== '.' && NOTA[m]) {
        if (desen.zurna) {
          const onceki = desen.melodi[(adim + desen.melodi.length - 1) % desen.melodi.length];
          zurnaNota(NOTA[m], siradakiZaman, adimSure * 0.94, ZURNA_HACIM, onceki === '.');
        } else {
          nota(NOTA[m], siradakiZaman, adimSure * 0.75, desen.dalga, 0.16);
        }
      }
      if (v === 'x') vurusCal(siradakiZaman);
      else if (v === 't') tekCal(siradakiZaman);
      if (adim === 0) saatIzi.length = 0;        // muzik bastan basladi
      saatIzi.push({ a: adim, t: siradakiZaman, s: adimSure });
      if (saatIzi.length > 24) saatIzi.shift();
      siradakiZaman += adimSure;
      adim++;
    }
  }

  /**
   * Fon muzigini baslat. ad = oyun anahtari (bilye | bilgi | pk | at | halay).
   * Ayni desen zaten caliyorsa hicbir sey yapmaz — sayfa icindeki durum
   * degisimlerinde muzik bastan baslamasin diye.
   */
  function muzik(ad) {
    if (KAPALI || SESSIZ_MOCK || MUZIK_KAPALI) return;
    if (!ctx && !kur()) return;
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});
    muzikKur();
    const yeni = DESENLER[ad];
    if (!yeni) return;
    if (muzikAcik && desen === yeni) return;
    desen = yeni;
    adim = 0;
    siradakiZaman = ctx.currentTime + 0.08;
    muzikAcik = true;
    // Yumusak giris: aniden baslayan muzik yayinin ustune biner
    muzikGain.gain.cancelScheduledValues(ctx.currentTime);
    muzikGain.gain.setValueAtTime(muzikGain.gain.value, ctx.currentTime);
    muzikGain.gain.linearRampToValueAtTime(MUZIK_SEVIYE, ctx.currentTime + 1.2);
    if (!planlayici) planlayici = setInterval(planla, 120);
    planla();
  }

  /** Fon muzigini yumusakca kis. Kutlama/fanfar aninda cagriliyor. */
  function muzikDur(sn) {
    if (!muzikGain || !ctx) return;
    const s = sn == null ? 0.6 : sn;
    muzikGain.gain.cancelScheduledValues(ctx.currentTime);
    muzikGain.gain.setValueAtTime(muzikGain.gain.value, ctx.currentTime);
    muzikGain.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + s);
    muzikAcik = false;
    if (planlayici) { clearInterval(planlayici); planlayici = 0; }
  }

  /** Kisa gerilim: son duzluk / speed fazi gibi anlarda tempoyu yukselt. */
  function muzikHizli(carpan) {
    if (!desen || !muzikAcik) return;
    const k = Math.max(1, Math.min(1.6, carpan || 1.25));
    desen = Object.assign({}, desen, { bpm: Math.round(desen.bpm * k) });
  }

  /**
   * Tempoyu desenin TABAN hizina gore MUTLAK ayarla (0.6 - 1.8).
   * muzikHizli'dan farki: asagi da inebilir ve birikmez (o, o anki tempoyu
   * carpar ve 1'in altina inmez). Calan desen bastan baslamaz, sadece
   * bundan sonra planlanan adimlarin suresi degisir.
   */
  function muzikTempo(carpan) {
    if (!desen || !muzikAcik) return;
    // Taban: kopyalar ayni melodi dizisini paylastigi icin oradan bulunur.
    let taban = null;
    for (const ad in DESENLER) if (DESENLER[ad].melodi === desen.melodi) taban = DESENLER[ad];
    if (!taban) return;
    const k = Math.max(0.6, Math.min(1.8, Number(carpan) || 1));
    desen = Object.assign({}, desen, { bpm: Math.round(taban.bpm * k) });
  }

  /**
   * Vurus saati: desenin basindan beri kac SEKIZLIK adim gecti (kesirli) ve
   * o anki bpm. Adim animasyonunu muzige kilitlemek icin (halay).
   * Muzik calmiyorsa ya da ses saati yurumuyorsa (ses kapali, tarayici
   * otomatik oynatmayi kilitlemis) null doner — cagiran kendi saatine duser.
   */
  function muzikSaat() {
    if (!muzikAcik || !ctx || ctx.state !== 'running') return null;
    const an = ctx.currentTime;
    for (let i = saatIzi.length - 1; i >= 0; i--) {
      const e = saatIzi[i];
      if (e.t <= an) return { adim: e.a + Math.min(1, (an - e.t) / e.s), bpm: desen.bpm };
    }
    return null;
  }

  global.Ses = {
    cal, kur, muzik, muzikDur, muzikHizli, muzikTempo, muzikSaat,
    KAPALI: KAPALI || SESSIZ_MOCK,
  };
})(window);
