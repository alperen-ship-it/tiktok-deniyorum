/**
 * ulti.js — Oyunlarin ortak "ULTI" katmani.
 *
 * TASARIM KURALI (dort oyunda da ayni):
 *   yorum   -> temel hamle. Herkes yapar, bedava, oyunun ritmi budur.
 *   begeni  -> birikim. Tek basina kucuk etki, ama ortak KOMBO barini doldurur;
 *              bar dolunca tum sohbet bedava bir takim ultisi kazanir.
 *   hediye  -> ULTI. Adi olan, ekrani kaplayan, gonderene atfedilen ozel hamle.
 *              Elmas degeri buyudukce farkli ve daha yikici bir ulti cikar.
 *
 * Hediyeyi sadece "daha buyuk hasar" yapmak izleyiciye hicbir sey hissettirmiyor.
 * Isminin ekranda patlamasi, oyunun bir anligina durup ona bakmasi hissettiriyor.
 */
(function (global) {
  'use strict';

  // --- Ulti kademeleri: elmas degerine gore ---------------------------------
  const KADEMELER = [
    { esik: 10000, ad: 'İNFAZ',          emoji: '💀', renk: '#b026ff', guc: 5 },
    { esik: 1000,  ad: 'KIYAMET',        emoji: '🌋', renk: '#ff3b5c', guc: 4 },
    { esik: 100,   ad: 'METEOR YAĞMURU', emoji: '☄️', renk: '#ff8c3b', guc: 3 },
    { esik: 10,    ad: 'YILDIRIM',       emoji: '⚡', renk: '#ffd93d', guc: 2 },
    { esik: 0,     ad: 'ATEŞ TOPU',      emoji: '🔥', renk: '#ff6b35', guc: 1 },
  ];

  /** Hediye degerinden ulti kademesini bul. */
  function kademe(deger) {
    const d = Number(deger) || 0;
    return KADEMELER.find((k) => d >= k.esik) || KADEMELER[KADEMELER.length - 1];
  }

  /** Takim ultisi (kombo bariyla kazanilan, bedava olan). */
  const TAKIM = { ad: 'SOHBET GÜCÜ', emoji: '💥', renk: '#25f4ee', guc: 3 };

  // --- Duyuru bandi ---------------------------------------------------------
  // Ayni anda iki ulti gelirse ust uste binmesin diye kuyruk kullaniyoruz.
  let bant = null;
  const kuyruk = [];
  let mesgul = false;

  function bantKur() {
    if (bant) return;

    const css = document.createElement('style');
    css.textContent = `
      #ulti-bant {
        position: fixed;
        left: 0; right: 0;
        top: 50%;
        transform: translateY(-50%);
        z-index: 2147483000;
        pointer-events: none;
        display: none;
        text-align: center;
        padding: 18px 12px;
        background: linear-gradient(90deg,
          transparent, rgba(0,0,0,.86) 12%, rgba(0,0,0,.86) 88%, transparent);
        border-top: 3px solid var(--u-renk, #fff);
        border-bottom: 3px solid var(--u-renk, #fff);
      }
      #ulti-bant.gorunur { display: block; animation: ultiGir .42s cubic-bezier(.16,1,.3,1); }
      #ulti-bant.cikiyor { animation: ultiCik .32s ease forwards; }
      @keyframes ultiGir {
        0%   { opacity: 0; transform: translateY(-50%) scaleX(.2); }
        60%  { opacity: 1; transform: translateY(-50%) scaleX(1.03); }
        100% { opacity: 1; transform: translateY(-50%) scaleX(1); }
      }
      @keyframes ultiCik { to { opacity: 0; transform: translateY(-50%) scaleX(.85); } }

      #ulti-bant .u-kim {
        font-size: 22px; font-weight: 700; opacity: .92;
        letter-spacing: .3px; margin-bottom: 2px;
        white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
      }
      #ulti-bant .u-ad {
        font-size: 54px; font-weight: 900; letter-spacing: -2px;
        color: var(--u-renk, #fff);
        text-shadow: 0 0 26px var(--u-renk, #fff), 0 3px 0 rgba(0,0,0,.6);
        line-height: 1.05;
      }
      #ulti-bant .u-emoji { font-size: 40px; vertical-align: -4px; margin: 0 8px; }

      /* lite modda golge/blur zaten kapali; bant yine okunur kalsin */
      html.tt-lite #ulti-bant .u-ad { text-shadow: none; -webkit-text-stroke: 3px rgba(0,0,0,.8); paint-order: stroke fill; }
      html.tt-vertical #ulti-bant .u-ad { font-size: 38px; letter-spacing: -1px; }
      html.tt-vertical #ulti-bant .u-kim { font-size: 17px; }
    `;
    document.head.appendChild(css);

    bant = document.createElement('div');
    bant.id = 'ulti-bant';
    bant.innerHTML =
      '<div class="u-kim"></div>' +
      '<div class="u-ad"><span class="u-emoji"></span><span class="u-metin"></span><span class="u-emoji"></span></div>';
    document.body.appendChild(bant);
  }

  function siradaki() {
    if (mesgul) return;
    const i = kuyruk.shift();
    if (!i) return;
    mesgul = true;

    bantKur();
    bant.style.setProperty('--u-renk', i.renk);
    bant.querySelector('.u-kim').textContent = i.kim;
    bant.querySelector('.u-metin').textContent = i.ad;
    for (const e of bant.querySelectorAll('.u-emoji')) e.textContent = i.emoji;

    bant.classList.remove('cikiyor');
    bant.classList.add('gorunur');

    setTimeout(() => {
      bant.classList.add('cikiyor');
      setTimeout(() => {
        bant.classList.remove('gorunur', 'cikiyor');
        mesgul = false;
        siradaki();
      }, 320);
    }, i.sure);
  }

  /**
   * Ulti duyurusunu ekranda goster.
   * @param {string} kim   kullanici adi
   * @param {object} k     kademe nesnesi ({ad, emoji, renk})
   * @param {number} sure  ms (varsayilan 1500)
   */
  function duyur(kim, k, sure = 1500) {
    // Kuyruk sisirmesin: cok hizli hediye akisinda eskiyi at
    if (kuyruk.length > 4) kuyruk.splice(0, kuyruk.length - 4);
    kuyruk.push({ kim, ad: k.ad, emoji: k.emoji, renk: k.renk, sure });
    siradaki();
  }

  // --- Kombo bari -----------------------------------------------------------
  /**
   * Yorum ve begenilerle dolan ortak bar. Dolunca geri cagirma tetiklenir ve
   * bar sifirlanir. Bedava katilimcilara da "ulti" hissi veren sey budur.
   */
  function KomboBari(opts) {
    const hedef = Number(opts.hedef) || 100;
    const kap = opts.kap;                 // barin yerlestirilecegi element
    let deger = 0;

    const dis = document.createElement('div');
    dis.className = 'kombo-dis';
    dis.innerHTML =
      '<div class="kombo-ic"></div>' +
      '<div class="kombo-yazi">SOHBET GÜCÜ</div>';
    kap.appendChild(dis);

    if (!document.getElementById('kombo-css')) {
      const s = document.createElement('style');
      s.id = 'kombo-css';
      s.textContent = `
        .kombo-dis {
          position: relative; height: 20px; border-radius: 10px;
          background: rgba(0,0,0,.5); border: 1px solid rgba(255,255,255,.16);
          overflow: hidden;
        }
        .kombo-ic {
          position: absolute; inset: 0 auto 0 0; width: 0;
          background: linear-gradient(90deg, #25f4ee, #7ee787);
          transition: width .25s ease;
        }
        .kombo-yazi {
          position: absolute; inset: 0; display: grid; place-content: center;
          font-size: 11px; font-weight: 800; letter-spacing: 2px;
          text-shadow: 0 1px 3px rgba(0,0,0,.9);
        }
        .kombo-dis.dolu .kombo-ic { background: linear-gradient(90deg, #ffd93d, #ff8c3b); }
        .kombo-dis.dolu { animation: komboPat .4s ease; }
        @keyframes komboPat { 50% { transform: scale(1.06); } }
      `;
      document.head.appendChild(s);
    }

    const ic = dis.querySelector('.kombo-ic');
    const yazi = dis.querySelector('.kombo-yazi');

    function ciz() {
      const o = Math.min(1, deger / hedef);
      ic.style.width = o * 100 + '%';
      yazi.textContent = o >= 1 ? 'HAZIR!' : `SOHBET GÜCÜ  %${Math.floor(o * 100)}`;
      dis.classList.toggle('dolu', o >= 1);
    }

    ciz();

    return {
      ekle(n) {
        deger += n;
        if (deger >= hedef) {
          deger = 0;
          ciz();
          if (opts.dolunca) opts.dolunca();
        } else {
          ciz();
        }
      },
      get oran() { return Math.min(1, deger / hedef); },
    };
  }

  global.ULTI = { kademe, duyur, KADEMELER, TAKIM, KomboBari };
})(window);
