#!/usr/bin/env node
'use strict';
/**
 * ttls-control.js — TikTok LIVE Studio'nun YEREL Stream Deck API'sine konusur.
 *
 * === Bu nedir? ===
 * LIVE Studio, Elgato Stream Deck entegrasyonu icin 127.0.0.1 uzerinde bir
 * Socket.IO sunucusu aciyor. TikTok'un kendi resmi Stream Deck eklentisi bu
 * sunucuya baglanip sahne degistiriyor, kaynak acip kapatiyor, yayin
 * baslatiyor. Eklentinin paketinden cikan protokol:
 *
 *     ws://127.0.0.1:<port>/socket.io/?EIO=4&transport=websocket
 *     WebSocket alt protokolu : streamdeck_ttls_v1
 *     Aday portlar            : 28189 39728 34246 42205 38534 40825 40622
 *     Kanallar                : stream_deck/join_room
 *                               stream_deck/sync_settings
 *                               stream_deck/action_emit
 *                               stream_deck/device_status_emit
 *     El sikisma              : join_room gonder -> cevap gelince sync_settings
 *
 * Belgelenmemis ve desteklenmeyen bir arayuz; ama gercek ve calisiyor gorunuyor.
 * Kimlik dogrulamasi yok gibi duruyor (eklentide token/parola yok).
 *
 * === DURUM: DOGRULANMADI ===
 * Bu istemci protokolu eklenti kaynagindan cikararak yazildi, gercek uygulamaya
 * karsi TEST EDILMEDI. Bu yuzden varsayilan mod `listen` — yani once dinle,
 * ne geldigini gor. Ciktiyi bana yapistirirsan komut yapilarini netlestiririz.
 *
 * === Kullanim ===
 *   node tools/ttls-control.js scan            # hangi port acik, bul
 *   node tools/ttls-control.js listen          # bagla ve gelen her seyi dok
 *   node tools/ttls-control.js info            # sahne/kaynak listesini yazdir
 *   node tools/ttls-control.js raw '<json>'    # elle action_emit gonder
 *
 * Node 18+ gerekir (global WebSocket icin Node 21+ onerilir).
 */

const net = require('net');

const PORTS = [28189, 39728, 34246, 42205, 38534, 40825, 40622];
const SUBPROTOCOL = 'streamdeck_ttls_v1';
const CH = {
  JOIN: 'stream_deck/join_room',
  SYNC: 'stream_deck/sync_settings',
  ACTION: 'stream_deck/action_emit',
  DEVICE: 'stream_deck/device_status_emit',
};

if (typeof WebSocket === 'undefined') {
  console.error('Bu Node surumunde global WebSocket yok. Node 21+ kullan ya da: npm i ws');
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Port tarama — hangi portta bir sey dinliyor?
// ---------------------------------------------------------------------------
function probe(port, timeout = 700) {
  return new Promise((resolve) => {
    const s = new net.Socket();
    let done = false;
    const finish = (open) => {
      if (done) return;
      done = true;
      s.destroy();
      resolve(open);
    };
    s.setTimeout(timeout);
    s.once('connect', () => finish(true));
    s.once('timeout', () => finish(false));
    s.once('error', () => finish(false));
    s.connect(port, '127.0.0.1');
  });
}

async function scan() {
  console.log('Aday portlar taraniyor...\n');
  const open = [];
  for (const p of PORTS) {
    const ok = await probe(p);
    console.log(`  ${String(p).padEnd(7)} ${ok ? 'ACIK  <--' : 'kapali'}`);
    if (ok) open.push(p);
  }
  console.log('');
  if (!open.length) {
    console.log('Hicbiri acik degil. Kontrol et:');
    console.log('  1) TikTok LIVE Studio CALISIYOR mu?');
    console.log('  2) Surumunde Stream Deck destegi var mi? (1.1x+ olmali)');
    console.log('  3) Portlar surume gore degismis olabilir. Tam listeyi gor:');
    console.log('     powershell -c "Get-NetTCPConnection -State Listen | ? { $_.OwningProcess -in (Get-Process \'TikTok LIVE Studio\').Id } | ft LocalPort"');
  } else {
    console.log(`Acik port(lar): ${open.join(', ')}`);
    console.log(`Simdi dene:  node tools/ttls-control.js listen --port ${open[0]}`);
  }
  return open;
}

// ---------------------------------------------------------------------------
// Minik Socket.IO v4 istemcisi (Engine.IO cercevesi elle)
// ---------------------------------------------------------------------------
// Engine.IO paket tipleri: 0=open 1=close 2=ping 3=pong 4=message
// Socket.IO alt tipleri (4'ten sonra): 0=CONNECT 1=DISCONNECT 2=EVENT 3=ACK
class SioClient {
  constructor(port, { verbose = false } = {}) {
    this.port = port;
    this.verbose = verbose;
    this.handlers = new Map();
    this.ws = null;
    this.sid = null;
  }

  on(event, fn) {
    if (!this.handlers.has(event)) this.handlers.set(event, []);
    this.handlers.get(event).push(fn);
    return this;
  }

  _fire(event, ...args) {
    for (const fn of this.handlers.get(event) || []) fn(...args);
    for (const fn of this.handlers.get('*') || []) fn(event, ...args);
  }

  connect() {
    return new Promise((resolve, reject) => {
      const url = `ws://127.0.0.1:${this.port}/socket.io/?EIO=4&transport=websocket`;
      if (this.verbose) console.log(`[ws] -> ${url}  (alt protokol: ${SUBPROTOCOL})`);

      let ws;
      try {
        ws = new WebSocket(url, [SUBPROTOCOL]);
      } catch (e) {
        reject(e);
        return;
      }
      this.ws = ws;

      const timer = setTimeout(() => reject(new Error('el sikisma zaman asimi (10 sn)')), 10000);

      ws.onerror = (e) => {
        clearTimeout(timer);
        reject(new Error('WebSocket hatasi: ' + (e.message || 'baglanamadi')));
      };

      ws.onclose = (e) => {
        this._fire('__close', e.code, e.reason);
        if (this.verbose) console.log(`[ws] kapandi  kod=${e.code} sebep=${e.reason || '-'}`);
      };

      ws.onopen = () => {
        if (this.verbose) console.log(`[ws] acildi (secilen alt protokol: "${ws.protocol || '(yok)'}")`);
      };

      ws.onmessage = (m) => {
        const data = typeof m.data === 'string' ? m.data : '';
        if (this.verbose) console.log('[ham] ' + data.slice(0, 400));

        const t = data[0];

        if (t === '0') {
          // Engine.IO OPEN
          try {
            const h = JSON.parse(data.slice(1));
            this.sid = h.sid;
            if (this.verbose) console.log('[eio] open', JSON.stringify(h));
          } catch { /* onemli degil */ }
          ws.send('40');            // Socket.IO CONNECT (varsayilan namespace)
          return;
        }

        if (t === '2') { ws.send('3'); return; }   // ping -> pong

        if (t === '4') {
          const sub = data[1];
          const rest = data.slice(2);

          if (sub === '0') {        // CONNECT onayi
            clearTimeout(timer);
            if (this.verbose) console.log('[sio] baglandi', rest);
            resolve(this);
            return;
          }
          if (sub === '2' || sub === '3') {   // EVENT / ACK
            // Onunde ack id olabilir: 42123["ev",...]
            const jsonStart = rest.indexOf('[');
            if (jsonStart < 0) return;
            try {
              const arr = JSON.parse(rest.slice(jsonStart));
              const [name, ...args] = arr;
              this._fire(name, ...args);
            } catch (e) {
              console.log('[!] EVENT cozulemedi:', rest.slice(0, 200));
            }
          }
        }
      };
    });
  }

  emit(event, payload) {
    if (!this.ws || this.ws.readyState !== 1) throw new Error('baglanti yok');
    // Eklenti payload'lari JSON *string* olarak yolluyor gorunuyor; obje
    // verirsen stringe ceviriyoruz.
    const args = payload === undefined
      ? []
      : [typeof payload === 'string' ? payload : JSON.stringify(payload)];
    const frame = '42' + JSON.stringify([event, ...args]);
    if (this.verbose) console.log('[gonder] ' + frame.slice(0, 300));
    this.ws.send(frame);
  }

  close() { try { this.ws?.close(); } catch { /* zaten kapali */ } }
}

// ---------------------------------------------------------------------------
// Baglan: verilen porta ya da acik olan ilkine
// ---------------------------------------------------------------------------
async function connectAny(port, verbose) {
  const list = port ? [port] : PORTS;
  for (const p of list) {
    if (!(await probe(p, 400))) continue;
    const c = new SioClient(p, { verbose });
    try {
      await c.connect();
      console.log(`\n>> BAGLANDI: 127.0.0.1:${p}\n`);
      return c;
    } catch (e) {
      console.log(`   ${p}: ${e.message}`);
      c.close();
    }
  }
  throw new Error('Hicbir porta baglanilamadi. Once `scan` calistir.');
}

// ---------------------------------------------------------------------------
// Komutlar
// ---------------------------------------------------------------------------
async function listen(port) {
  const c = await connectAny(port, true);

  c.on('*', (name, ...args) => {
    console.log('\n=== OLAY: ' + name + ' ===');
    for (const a of args) {
      let v = a;
      if (typeof a === 'string') {
        try { v = JSON.parse(a); } catch { /* duz metinmis */ }
      }
      console.log(typeof v === 'string' ? v : JSON.stringify(v, null, 2).slice(0, 4000));
    }
  });

  console.log('El sikisma: join_room gonderiliyor...');
  c.emit(CH.JOIN);

  c.on(CH.JOIN, () => {
    console.log('join_room onaylandi -> sync_settings gonderiliyor');
    c.emit(CH.SYNC);
  });

  console.log('\nDinlemede. LIVE Studio icinde sahne degistir, kaynak ac/kapat,');
  console.log('mikrofonu sustur — ne mesaj dondugunu burada goreceksin.');
  console.log('Cikmak icin Ctrl+C.\n');
}

async function info(port, asJson) {
  const c = await connectAny(port, false);

  // Uygulama sync_settings'i BIRDEN FAZLA kez yolluyor: ilkinde bazi listeler
  // (ses efektleri gibi) henuz bos, ikincisinde doluyor. Bu yuzden hemen basmak
  // yerine bir sure toplayip en dolu olani kullaniyoruz.
  let enIyi = null;
  let enIyiPuan = -1;

  const puanla = (d) =>
    JSON.stringify(d || {}).length; // daha uzun = daha dolu

  c.on(CH.SYNC, (raw) => {
    let d = raw;
    if (typeof raw === 'string') { try { d = JSON.parse(raw); } catch { /* duz metin */ } }
    const s = d?.lsSettings || d || {};
    const p = puanla(s);
    if (p > enIyiPuan) { enIyiPuan = p; enIyi = s; }
  });

  c.emit(CH.JOIN);
  c.on(CH.JOIN, () => c.emit(CH.SYNC));

  // Ikinci (dolu) paketi bekle
  await new Promise((r) => setTimeout(r, 5000));
  c.close();

  if (!enIyi) {
    console.log('Ayar paketi gelmedi. `listen` ile ham trafige bak.');
    process.exit(1);
  }

  if (asJson) {
    console.log(JSON.stringify(enIyi, null, 2));
    process.exit(0);
  }

  const s = enIyi;
  const yaz = (x) => console.log(x);

  yaz('');
  yaz('================ SAHNELER ================');
  yaz(`Aktif sahne: ${s.scene ?? '(bilinmiyor)'}`);
  yaz('');

  const scenes = s.scene_list || s.sceneList || [];
  if (!scenes.length) {
    yaz('(sahne listesi gelmedi)');
  }
  for (const sc of scenes) {
    const aktif = sc.name === s.scene ? '  <-- AKTIF' : '';
    yaz(`SAHNE: ${sc.name}${aktif}`);

    // visible_sources, sources'in alt kumesi: gorunurlugu boyle okuyoruz
    const gorunur = new Set((sc.visible_sources || []).map((x) => x.value));
    const kaynaklar = sc.sources || [];
    if (!kaynaklar.length) yaz('   (bos)');

    for (const src of kaynaklar) {
      const id = src.value ?? src.id ?? '?';
      const isaret = gorunur.has(id) ? '[G]' : '[ ]';
      yaz(`   ${isaret} ${String(src.label ?? src.name ?? '?').padEnd(18)} ${id}`);
    }
    yaz('');
  }
  yaz('  [G] = su an gorunur');

  yaz('');
  yaz('================ SES ================');
  yaz(`Hoparlor susturulmus : ${s.audio_mute}`);
  yaz(`Mikrofon susturulmus : ${s.mic_mute}`);
  for (const d of s.audio_filter?.deviceList || []) {
    yaz(`  cihaz: ${d.label}   (${d.value})`);
  }
  const aktifFiltre = s.audio_filter?.enableTypes || {};
  for (const [cihaz, f] of Object.entries(aktifFiltre)) {
    const acik = Object.entries(f || {}).map(([k, v]) => `${k}=${v}`).join(', ');
    if (acik) yaz(`  aktif filtre (${cihaz}): ${acik}`);
  }

  const sesler = s.sound_effect?.sound_Info || [];
  if (sesler.length) {
    yaz('');
    yaz(`  Ses efektleri (${sesler.length}): ${sesler.join(', ')}`);
    yaz(`  Su an calan: ${s.sound_effect?.currentsound || '(yok)'}`);
  }

  const efektGruplari = s.camera_effect?.effectList || [];
  if (efektGruplari.length) {
    yaz('');
    yaz('================ KAMERA EFEKTLERI ================');
    let toplam = 0;
    for (const g of efektGruplari) {
      const n = (g.effects || []).length;
      toplam += n;
      yaz(`  ${String(g.name ?? g.key).padEnd(14)} ${n} efekt`);
    }
    yaz(`  toplam ${toplam} efekt`);
    yaz('');
    yaz('  Tam listeyi gormek icin:  node tools/ttls-control.js info --json');
  }

  yaz('');
  process.exit(0);
}

async function raw(port, json) {
  const c = await connectAny(port, true);
  c.emit(CH.JOIN);
  await new Promise((r) => setTimeout(r, 800));
  console.log('\naction_emit gonderiliyor:', json);
  c.emit(CH.ACTION, json);
  await new Promise((r) => setTimeout(r, 4000));
  c.close();
  process.exit(0);
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------
(async () => {
  const argv = process.argv.slice(2);
  const cmd = argv[0] || 'scan';
  const pi = argv.indexOf('--port');
  const port = pi >= 0 ? Number(argv[pi + 1]) : null;

  try {
    if (cmd === 'scan') await scan();
    else if (cmd === 'listen') await listen(port);
    else if (cmd === 'info') await info(port, argv.includes('--json'));
    else if (cmd === 'raw') await raw(port, argv[1]);
    else {
      console.log(`
TikTok LIVE Studio yerel API araci

  node tools/ttls-control.js scan             acik portu bul
  node tools/ttls-control.js listen           bagla, gelen her seyi dok  <-- once bunu calistir
  node tools/ttls-control.js info             sahne/kaynak listesi
  node tools/ttls-control.js raw '{"..."}'    elle action_emit

  --port <n>   port sec (varsayilan: aday listeden ilk acik olan)

NOT: Protokol resmi Stream Deck eklentisinden cikarildi, gercek uygulamada
     dogrulanmadi. \`listen\` ciktisini paylas, komut yapilarini netlestirelim.
`);
    }
  } catch (e) {
    console.error('\nHATA:', e.message);
    process.exit(1);
  }
})();
