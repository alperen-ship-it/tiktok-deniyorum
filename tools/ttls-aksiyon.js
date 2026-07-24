'use strict';
/**
 * ttls-aksiyon.js — TikTok LIVE Studio yerel Stream Deck API'sine KOMUT gonderme katmani.
 *
 * ttls-control.js icindeki SioClient ile calisir. Gereken tek sey, verilen
 * istemcinin su iki metodu saglamasi:
 *     client.emit(eventAdi, payload)   // payload obje ise JSON.stringify edilir
 *     client.on('*', (ad, ...args) => ...)
 *
 * Tel uzerindeki cerceve (DOGRULANMIS):
 *     42["stream_deck/action_emit","{\"action\":...}"]      <- ic katman JSON STRING
 * Cevap action_emit'ten DEGIL, "stream_deck/<context>" kanalindan gelir:
 *     42["stream_deck/ctx-1","{\"code\":0}"]                 code 0 = basari
 */

const CH = {
  JOIN: 'stream_deck/join_room',
  SYNC: 'stream_deck/sync_settings',
  ACTION: 'stream_deck/action_emit',
  DEVICE: 'stream_deck/device_status_emit',
};

const A = {
  scene: 'com.tiktok.livestudio.scene',
  source: 'com.tiktok.livestudio.source',
  soundeffect: 'com.tiktok.livestudio.soundeffect',
  mic: 'com.tiktok.livestudio.mic',
  audio: 'com.tiktok.livestudio.audio',
  miccontrol: 'com.tiktok.livestudio.miccontrol',
  audiocontrol: 'com.tiktok.livestudio.audiocontrol',
  audiofilter: 'com.tiktok.livestudio.audiofilter',
  cameraeffects: 'com.tiktok.livestudio.cameraeffects',
  livestartend: 'com.tiktok.livestudio.livestartend',
  livepauseresume: 'com.tiktok.livestudio.livepauseresume',
  recording: 'com.tiktok.livestudio.recording',
  highlight: 'com.tiktok.livestudio.highlight',
  vibe: 'com.tiktok.livestudio.vibe',
  vote: 'com.tiktok.livestudio.vote',
};

let _ctrSayac = 0;
function yeniContext(onek = 'ttls') {
  _ctrSayac += 1;
  return `${onek}-${Date.now().toString(36)}-${_ctrSayac}`;
}

class TTLSKontrol {
  /**
   * @param {{emit:Function,on:Function}} client  ttls-control.js icindeki SioClient
   * @param {{device?:string, timeoutMs?:number, log?:Function}} opt
   */
  constructor(client, opt = {}) {
    this.c = client;
    this.device = opt.device || 'node-dev-0';
    this.timeoutMs = opt.timeoutMs || 3000;
    this.log = opt.log || (() => {});
    this.ayarlar = null;          // en son sync_settings anlik goruntusu
    this._bekleyen = new Map();   // context -> {resolve, timer}
    this._syncBekleyenler = [];

    // TEK bir joker dinleyici: hem cevap kanallarini hem sync_settings'i yakalar.
    this.c.on('*', (ad, ...args) => {
      const ham = args[0];
      let veri = ham;
      if (typeof ham === 'string') { try { veri = JSON.parse(ham); } catch { /* duz metin */ } }

      if (ad === CH.SYNC) {
        this.ayarlar = (veri && veri.lsSettings) ? veri.lsSettings : (veri || {});
        const kuyruk = this._syncBekleyenler.splice(0);
        for (const r of kuyruk) r(this.ayarlar);
        return;
      }
      if (ad.startsWith('stream_deck/')) {
        const ctx = ad.slice('stream_deck/'.length);
        const bek = this._bekleyen.get(ctx);
        if (bek) {
          clearTimeout(bek.timer);
          this._bekleyen.delete(ctx);
          bek.resolve(veri && typeof veri === 'object' ? veri : { code: -1, ham: veri });
        }
      }
    });
  }

  // --- el sikisma: join_room -> sync_settings -----------------------------
  async hazirla({ deviceStatus = true } = {}) {
    this.c.emit(CH.JOIN);                       // payload YOK
    setTimeout(() => this.c.emit(CH.SYNC), 250); // savunmaci: echo gelmezse de iste
    this.c.on(CH.JOIN, () => this.c.emit(CH.SYNC));
    if (deviceStatus) this.c.emit(CH.DEVICE, { status: 'connected' }); // {"status":"connected"}
    return this.ayarlariBekle(4000);
  }

  ayarlariBekle(ms = 3000) {
    if (this.ayarlar) return Promise.resolve(this.ayarlar);
    return new Promise((res) => {
      this._syncBekleyenler.push(res);
      setTimeout(() => res(this.ayarlar), ms);
    });
  }

  /** Aksiyondan sonra taze durum icin: sync_settings'i tekrar iste. */
  async ayarlariYenile(ms = 1200) {
    const eski = this.ayarlar;
    this.ayarlar = null;
    this.c.emit(CH.SYNC);
    const yeni = await this.ayarlariBekle(ms);
    if (!yeni) this.ayarlar = eski;
    return this.ayarlar;
  }

  // --- cekirdek: action_emit ---------------------------------------------
  /**
   * @param {string} action      com.tiktok.livestudio.*
   * @param {object} settings    payload.settings
   * @param {object} o           {varyant:1..4, encoder:bool, ekPayload:object, context:string}
   * @returns {Promise<{code:number}>}  code === 0 -> basari
   */
  aksiyon(action, settings = {}, o = {}) {
    const varyant = o.varyant || 1;
    const context = o.context || yeniContext();

    let mesaj;
    if (varyant === 2) {
      // MINIMUM: sadece kesin gerekli alanlar
      mesaj = { action, context, payload: { settings } };
    } else if (o.encoder) {
      // Encoder (knob) yolu: coordinates + controller:"Encoder"
      mesaj = {
        action, context, device: this.device,
        payload: Object.assign(
          { settings, controller: 'Encoder', coordinates: { column: 0, row: 0 }, pressed: false },
          o.ekPayload || {}
        ),
      };
    } else {
      // VARYANT 1 (VARSAYILAN): Stream Deck keyUp olayinin birebir taklidi
      mesaj = {
        action, context, device: this.device,
        payload: Object.assign(
          {
            settings,
            coordinates: { column: 0, row: 0 },
            state: 0,
            isInMultiAction: false,
            controller: 'Keypad',
          },
          o.ekPayload || {}
        ),
      };
    }

    const sozVerilenCevap = new Promise((resolve) => {
      const timer = setTimeout(() => {
        this._bekleyen.delete(context);
        resolve({ code: -1, timeout: true });
      }, this.timeoutMs);
      this._bekleyen.set(context, { resolve, timer });
    });

    if (varyant === 4) {
      // VARYANT 4 (TAHMIN, en dusuk olasilik): ic katman STRING degil OBJE
      this._hamGonder([CH.ACTION, mesaj]);
    } else {
      this.c.emit(CH.ACTION, JSON.stringify(mesaj)); // cift kodlama (DOGRU olan bu)
    }
    this.log('->', CH.ACTION, JSON.stringify(mesaj));
    return sozVerilenCevap;
  }

  _hamGonder(dizi) {
    const ws = this.c.ws;
    if (!ws || ws.readyState !== 1) throw new Error('baglanti yok');
    ws.send('42' + JSON.stringify(dizi));
  }

  // =======================================================================
  // ISTENEN 4 FONKSIYON
  // =======================================================================

  /**
   * sahneDegistir("Gameplay 2")
   * settings.scene = sync_settings.scene_list[].name  (ISIM, uuid degil)
   */
  async sahneDegistir(ad, o = {}) {
    if (!ad) throw new Error('sahneDegistir: sahne adi gerekli');
    const cevap = await this.aksiyon(A.scene, { scene: String(ad) }, o);
    if (cevap.code === 0) await this.ayarlariYenile();
    return cevap;
  }

  /**
   * kaynakGorunurluk("<uuid>", true|false)
   * DIKKAT: protokolde "goster/gizle" diye ayri komut YOK — bu bir TOGGLE.
   * Bu yuzden once son sync_settings'ten mevcut gorunurluk okunur; istenen
   * durum zaten saglanmissa hicbir sey gonderilmez (idempotent sarmalayici).
   */
  async kaynakGorunurluk(kaynakId, gorunur, o = {}) {
    if (!kaynakId) throw new Error('kaynakGorunurluk: kaynak UUID gerekli');
    const s = this.ayarlar || (await this.ayarlariBekle(2000)) || {};
    const liste = s.scene_list || [];

    // Kaynagi barindiran sahneyi bul (once aktif sahne, sonra digerleri)
    let sahneAdi = o.sahne || null;
    if (!sahneAdi) {
      const aktif = liste.find((x) => x.name === s.scene);
      const varMi = (sc) => (sc.sources || []).some((x) => x.value === kaynakId);
      if (aktif && varMi(aktif)) sahneAdi = aktif.name;
      else {
        const bulunan = liste.find(varMi);
        if (bulunan) sahneAdi = bulunan.name;
      }
    }
    if (!sahneAdi) throw new Error(`kaynakGorunurluk: ${kaynakId} hicbir sahnede bulunamadi (once ayarlariYenile())`);

    const sc = liste.find((x) => x.name === sahneAdi) || {};
    const suAnGorunur = (sc.visible_sources || []).some((x) => x.value === kaynakId);
    if (gorunur === suAnGorunur) return { code: 0, atlandi: true, sebep: 'zaten istenen durumda' };

    const cevap = await this.aksiyon(A.source, { scene: sahneAdi, source: String(kaynakId) }, o);
    if (cevap.code === 0) await this.ayarlariYenile();
    return cevap;
  }

  /**
   * sesEfekti("Cheer")
   * settings.currentSound = sync_settings.sound_effect.sound_Info[] icindeki duz string.
   * NOT: sunucu tarafinda alan adi kucuk s ile 'currentsound' olarak okunuyor;
   * varyant 3 her iki anahtari birden gonderir.
   */
  async sesEfekti(ad, o = {}) {
    if (!ad) throw new Error('sesEfekti: efekt adi gerekli');
    const settings = (o.varyant === 3)
      ? { currentSound: String(ad), currentsound: String(ad) }
      : { currentSound: String(ad) };
    return this.aksiyon(A.soundeffect, settings, o);
  }

  /**
   * mikrofonSustur(true)  -> sustur
   * mikrofonSustur(false) -> ac
   * Protokolde yine sadece TOGGLE var; mevcut mic_mute ile karsilastirilir.
   */
  async mikrofonSustur(sustur, o = {}) {
    const s = this.ayarlar || (await this.ayarlariBekle(2000)) || {};
    const suAnKapali = Boolean(s.mic_mute);
    if (Boolean(sustur) === suAnKapali) return { code: 0, atlandi: true, sebep: 'zaten istenen durumda' };
    const cevap = await this.aksiyon(A.mic, {}, o);
    if (cevap.code === 0) await this.ayarlariYenile();
    return cevap;
  }

  // =======================================================================
  // BONUS (ayni desen)
  // =======================================================================

  async sesCikisiSustur(sustur, o = {}) {
    const s = this.ayarlar || (await this.ayarlariBekle(2000)) || {};
    if (Boolean(sustur) === Boolean(s.audio_mute)) return { code: 0, atlandi: true };
    const cevap = await this.aksiyon(A.audio, {}, o);
    if (cevap.code === 0) await this.ayarlariYenile();
    return cevap;
  }

  /** Mikrofon seviyesi. OLCEK 0..5 (yuzde DEGIL). */
  mikSeviye(micId, deger, o = {}) {
    const v = Math.min(5, Math.max(0, Number(deger)));
    return this.aksiyon(A.miccontrol, { currentMicId: String(micId) },
      Object.assign({ encoder: true, ekPayload: { ticks: 0, mutationValue: v } }, o));
  }

  /** Mikrofon knob'una basma = mute toggle (mutationValue GONDERILMEZ). */
  mikKnobToggle(micId, o = {}) {
    return this.aksiyon(A.miccontrol, { currentMicId: String(micId) },
      Object.assign({ encoder: true }, o));
  }

  cikisSeviye(audioId, deger, o = {}) {
    const v = Math.min(5, Math.max(0, Number(deger)));
    return this.aksiyon(A.audiocontrol, { currentAudioId: String(audioId) },
      Object.assign({ encoder: true, ekPayload: { ticks: 0, mutationValue: v } }, o));
  }

  /**
   * DIKKAT: Bu komut YAYINI BASLATIR ya da BITIRIR — ve bu bir TOGGLE, yani
   * hangisini yapacagini onceden bilemezsin. Yanlislikla herkese acik bir
   * yayin baslatabilir ya da suren yayini kesebilir.
   *
   * Kaza olmasin diye acik onay istiyoruz:
   *     kontrol.yayinBaslatBitir({ eminim: true })
   */
  yayinBaslatBitir(o = {}) {
    if (!o.eminim) {
      throw new Error(
        'yayinBaslatBitir() yayini baslatir/bitirir ve TOGGLE calisir. ' +
        'Gercekten istiyorsan: yayinBaslatBitir({ eminim: true })'
      );
    }
    return this.aksiyon(A.livestartend, {}, o);
  }
  yayinDuraklatDevam(o = {}) { return this.aksiyon(A.livepauseresume, {}, o); }
  kayitBaslatDurdur(o = {}) { return this.aksiyon(A.recording, {}, o); }
  aniVurgula(o = {}) { return this.aksiyon(A.highlight, {}, o); }

  kameraEfekti(kaynak, tip, efektId, o = {}) {
    return this.aksiyon(A.cameraeffects, {
      cameraSource: String(kaynak),     // "all" | "default" | sourceList[].value
      cameraEffectType: String(tip),    // typeList[] (ornek "Trending")
      cameraEffectId: String(efektId),  // effects[].value
    }, o);
  }

  sesFiltresi(cihaz, tip, secim, o = {}) {
    return this.aksiyon(A.audiofilter, {
      audioFilterDevice: String(cihaz),
      audioFilterType: String(tip),     // "Templates" | "Equalizer" | "Reverb"
      audioFilterSelect: String(secim),
    }, o);
  }
}

module.exports = { TTLSKontrol, CH, AKSIYONLAR: A, yeniContext };
