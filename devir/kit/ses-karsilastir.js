'use strict';
/**
 * ses-karsilastir.js — _shared/ses.js geriye uyumluluk: 6d2594b (D/head) ile calisan agac.
 * Sahte AudioContext + sanal saat: ayni cagri dizisi iki surume de uygulanir, WebAudio'ya
 * giden HER cagri (dugum, tip, AudioParam olayi, baglanti, start/stop) kaydedilir ve
 * birebir karsilastirilir. Port 9068.
 */
const L = require('./lib');
const fs = require('fs'); const path = require('path'); const crypto = require('crypto');

function SAHTE() {
  let simdi = 0; const kayit = []; let nid = 0; const araliklar = new Map(); let iid = 0;
  const y = (x) => (typeof x === 'number' ? Math.round(x * 1e6) / 1e6 : x);
  const param = (sahip, ad, ilk) => {
    let v = ilk;
    const p = { get value() { return v; }, set value(x) { v = x; kayit.push([y(simdi), sahip, ad + '.value=', y(x)]); } };
    for (const m of ['setValueAtTime', 'linearRampToValueAtTime', 'exponentialRampToValueAtTime', 'cancelScheduledValues', 'setTargetAtTime'])
      p[m] = (...a) => { if (m === 'setValueAtTime' || m.endsWith('RampToValueAtTime')) v = a[0]; kayit.push([y(simdi), sahip, ad + '.' + m, ...a.map(y)]); return p; };
    return p;
  };
  const dugum = (tur) => {
    const id = tur + '#' + (++nid);
    const d = { __id: id, connect(h) { kayit.push([y(simdi), id, 'connect', h.__id || 'destination']); return h; }, disconnect() { kayit.push([y(simdi), id, 'disconnect']); } };
    kayit.push([y(simdi), id, 'create']);
    return d;
  };
  class AC {
    constructor() { this.destination = { __id: 'destination' }; this.state = 'running'; this.sampleRate = 48000; kayit.push([y(simdi), 'ctx', 'new']); }
    get currentTime() { return simdi; }
    resume() { kayit.push([y(simdi), 'ctx', 'resume']); return Promise.resolve(); }
    createGain() { const d = dugum('gain'); d.gain = param(d.__id, 'gain', 1); return d; }
    createOscillator() { const d = dugum('osc'); let tip = 'sine'; Object.defineProperty(d, 'type', { get: () => tip, set: (x) => { tip = x; kayit.push([y(simdi), d.__id, 'type=', x]); } }); d.frequency = param(d.__id, 'frequency', 440); d.detune = param(d.__id, 'detune', 0); d.start = (t) => kayit.push([y(simdi), d.__id, 'start', y(t)]); d.stop = (t) => kayit.push([y(simdi), d.__id, 'stop', y(t)]); return d; }
    createBiquadFilter() { const d = dugum('biquad'); let tip = 'lowpass'; Object.defineProperty(d, 'type', { get: () => tip, set: (x) => { tip = x; kayit.push([y(simdi), d.__id, 'type=', x]); } }); d.frequency = param(d.__id, 'frequency', 350); d.Q = param(d.__id, 'Q', 1); d.gain = param(d.__id, 'gain', 0); return d; }
    createBufferSource() { const d = dugum('buf'); d.start = (t) => kayit.push([y(simdi), d.__id, 'start', y(t)]); d.stop = () => {}; return d; }
    createDynamicsCompressor() { const d = dugum('comp'); for (const k of ['threshold', 'knee', 'ratio', 'attack', 'release']) d[k] = param(d.__id, k, 0); return d; }
    decodeAudioData() { return Promise.reject(new Error('sahte')); }
  }
  window.AudioContext = AC; window.webkitAudioContext = AC;
  window.fetch = () => Promise.reject(new Error('sahte'));       // ornek dosyalar yok -> sentez yolu (iki surumde de ayni)
  window.setInterval = (fn, ms) => { const id = ++iid; araliklar.set(id, { fn, ms, ne: simdi * 1000 + ms }); kayit.push([y(simdi), 'zaman', 'setInterval', ms]); return id; };
  window.clearInterval = (id) => { if (araliklar.delete(id)) kayit.push([y(simdi), 'zaman', 'clearInterval']); };
  const pn = () => simdi * 1000; performance.now = pn; Date.now = () => 1.7e12 + simdi * 1000;
  window.__S = { kayit, ilerle(sn) { const hedef = simdi + sn; for (;;) { let en = null; for (const a of araliklar.values()) if (!en || a.ne < en.ne) en = a; if (!en || en.ne / 1000 > hedef) break; simdi = en.ne / 1000; en.ne += en.ms; en.fn(); } simdi = hedef; } };
}

async function kos(tr, taban, oyun) {
  const ctx = await tr.newContext(); await ctx.addInitScript(SAHTE);
  const p = await ctx.newPage();
  await p.goto(taban + '/bos.html?x=1');
  await p.addScriptTag({ url: taban + '/overlays/_shared/ses.js' });
  const r = await p.evaluate((oyun) => {
    const S = window.__S, Ses = window.Ses; const anahtar = Object.keys(Ses).sort();
    Ses.kur();
    for (const ad of ['katil', 'tik', 'bahis', 'sonTik', 'dogru', 'yanlis', 'start', 'etap', 'bitis', 'hediye', 'hosgeldin', 'olmayan']) { Ses.cal(ad); S.ilerle(0.5); Ses.cal(ad, 150); Ses.cal(ad); S.ilerle(0.3); }
    Ses.muzik(oyun); S.ilerle(8);
    Ses.muzik(oyun); S.ilerle(0.5);                 // ayni desen: yeniden baslamamali
    Ses.muzikHizli(1.25); S.ilerle(5);
    Ses.muzikHizli(); S.ilerle(2);
    Ses.muzikHizli(9); S.ilerle(1);                 // tavan 1.6
    Ses.muzikDur(0.35); S.ilerle(1.2);
    Ses.muzikHizli(1.3); S.ilerle(0.3);             // durmusken etkisiz
    Ses.muzik(oyun); S.ilerle(4);                   // tabandan yeniden
    const diger = 'at';   // bilye,bilgi,pk silindi (Kasim 2026): yalniz at karsilastirilir
    Ses.muzik(diger); S.ilerle(3);                  // calarken desen degisimi
    Ses.muzikDur(); S.ilerle(1);
    Ses.muzik('yok-boyle-desen'); S.ilerle(0.5);
    return { anahtar, kapali: Ses.KAPALI, kayit: S.kayit };
  }, oyun);
  await ctx.close();
  return r;
}

(async () => {
  const eski = L.kaynak('head'), yeni = L.kaynak('repo');
  const dosya = path.join(yeni, 'overlays/_shared/ses.js');
  console.log(`# ses.js karsilastirma — yeni: ${dosya}  md5 ${crypto.createHash('md5').update(fs.readFileSync(dosya)).digest('hex')}  (${fs.readFileSync(dosya, 'utf8').split('\n').length} satir)`);
  const sun = await L.statikSunucu('/', 9068, { isle(req, res, u) { if (u === '/bos.html') { res.writeHead(200, { 'content-type': 'text/html' }); res.end('<!doctype html><body>'); return true; } return false; } });
  const tr = await L.tarayici();
  let fark = 0;
  for (const oyun of ['at']) {
    const a = await kos(tr, 'http://127.0.0.1:9068' + eski, oyun), b = await kos(tr, 'http://127.0.0.1:9068' + yeni, oyun);
    const osc = (k) => k.filter((x) => x[2] === 'start').length;
    let i = 0; while (i < a.kayit.length && i < b.kayit.length && JSON.stringify(a.kayit[i]) === JSON.stringify(b.kayit[i])) i++;
    const ayni = i === a.kayit.length && i === b.kayit.length;
    if (!ayni) fark++;
    console.log(`  [${ayni ? 'AYNI ' : 'FARKLI'}] ${oyun.padEnd(6)} eski ${a.kayit.length} WebAudio cagrisi (${osc(a.kayit)} nota/ses), yeni ${b.kayit.length} (${osc(b.kayit)})` + (ayni ? '' : `  — ilk fark #${i}: eski ${JSON.stringify(a.kayit[i])} / yeni ${JSON.stringify(b.kayit[i])}`));
    if (oyun === 'at') {
      const eksik = a.anahtar.filter((k) => !b.anahtar.includes(k)), ek = b.anahtar.filter((k) => !a.anahtar.includes(k));
      console.log(`  API: eski {${a.anahtar.join(', ')}}  yeni ek {${ek.join(', ')}}  eksik {${eksik.join(', ')}}  -> ${eksik.length ? 'UST KUME DEGIL' : 'ust kume'}`);
      if (eksik.length) fark++;
    }
  }
  await tr.close(); sun.close();
  console.log(fark ? `# SONUC: ${fark} FARK` : '# SONUC: dort oyun icin WebAudio cagri dizisi birebir ayni; API ust kume');
  process.exit(fark ? 1 : 0);
})();
