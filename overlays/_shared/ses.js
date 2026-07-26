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

  /* Ses tarifleri. Hepsi kisa — uzun ses yayinin kendi sesini bogar. */
  const TARIFLER = {
    katil:   () => ton({ f: 620, f2: 880, sure: 0.09, tip: 'triangle', hacim: 0.5 }),
    tik:     () => ton({ f: 1100, sure: 0.035, tip: 'square', hacim: 0.22 }),
    sonTik:  () => ton({ f: 1500, sure: 0.06, tip: 'square', hacim: 0.4 }),
    dogru:   () => { ton({ f: 760, sure: 0.1, tip: 'triangle' });
                     ton({ f: 1140, sure: 0.16, tip: 'triangle', gecikme: 0.09 }); },
    yanlis:  () => ton({ f: 220, f2: 130, sure: 0.22, tip: 'sawtooth', hacim: 0.34 }),
    start:   () => { ton({ f: 440, sure: 0.1, tip: 'square', hacim: 0.4 });
                     ton({ f: 660, sure: 0.16, tip: 'square', hacim: 0.4, gecikme: 0.1 }); },
    etap:    () => { ton({ f: 520, sure: 0.08, tip: 'triangle', hacim: 0.4 });
                     ton({ f: 780, sure: 0.11, tip: 'triangle', hacim: 0.35, gecikme: 0.07 }); },
    bitis:   () => { const n = [523, 659, 784, 1047];
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

  global.Ses = { cal, kur, KAPALI: KAPALI || SESSIZ_MOCK };
})(window);
