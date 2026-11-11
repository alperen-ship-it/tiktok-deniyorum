'use strict';
// ses-seviye.js — fon muzigi seviye esitligi: her desen icin cikis RMS / tepe (gercek WebAudio, cikisa analizor). Port 9068.
const L = require('./lib');
(async () => {
  const sun = await L.statikSunucu(L.kaynak('repo'), 9068, { isle(req, res, u) { if (u === '/bos.html') { res.writeHead(200, { 'content-type': 'text/html' }); res.end('<!doctype html><body>'); return true; } return false; } });
  const tr = await L.tarayici();
  const olc = async (ad, tempo) => {
    const ctx = await tr.newContext();
    await ctx.addInitScript(() => {
      const AC = window.AudioContext; const bag = AudioNode.prototype.connect;
      AudioNode.prototype.connect = function (h, ...r) {
        if (h === this.context.destination) { const c = this.context; if (!c.__an) { c.__an = c.createAnalyser(); c.__an.fftSize = 2048; window.__an = c.__an; } bag.call(this, c.__an); }
        return bag.call(this, h, ...r);
      };
      void AC;
    });
    const p = await ctx.newPage();
    await p.goto('http://127.0.0.1:9068/bos.html?ses=1');
    await p.addScriptTag({ url: 'http://127.0.0.1:9068/overlays/_shared/ses.js' });
    const r = await p.evaluate(async ([ad, tempo]) => {
      Ses.kur(); Ses.muzik(ad); if (tempo && Ses.muzikTempo) Ses.muzikTempo(tempo);
      await new Promise((r) => setTimeout(r, 2500));
      const buf = new Float32Array(2048); let kare = 0, n = 0, tepe = 0; const t0 = performance.now();
      while (performance.now() - t0 < 10000) { window.__an.getFloatTimeDomainData(buf); for (const v of buf) { kare += v * v; n++; if (Math.abs(v) > tepe) tepe = Math.abs(v); } await new Promise((r) => setTimeout(r, 43)); }
      return { rms: Math.sqrt(kare / n), tepe };
    }, [ad, tempo]);
    await ctx.close();
    return r;
  };
  const db = (x) => (20 * Math.log10(Math.max(x, 1e-9))).toFixed(1);
  const sonuc = {};
  for (const [ad, tempo] of [['bilye'], ['bilgi'], ['pk'], ['at'], ['halay'], ['halay', 1.25], ['halay', 1.5]]) {
    const r = await olc(ad, tempo); sonuc[ad + (tempo || '')] = r;
    console.log(`  ${(ad + (tempo ? ' x' + tempo : '')).padEnd(12)} RMS ${db(r.rms)} dBFS   tepe ${db(r.tepe)} dBFS`);
  }
  const dort = ['bilye', 'bilgi', 'pk', 'at'].map((k) => sonuc[k].rms); const enYuksek = Math.max(...dort), ort = dort.reduce((a, b) => a + b) / 4;
  for (const k of ['halay', 'halay1.25', 'halay1.5']) console.log(`  ${k}: dort oyunun ortalamasina gore ${(20 * Math.log10(sonuc[k].rms / ort)).toFixed(1)} dB, en yuksegine gore ${(20 * Math.log10(sonuc[k].rms / enYuksek)).toFixed(1)} dB; tepe farki ${(20 * Math.log10(sonuc[k].tepe / Math.max(...['bilye', 'bilgi', 'pk', 'at'].map((x) => sonuc[x].tepe)))).toFixed(1)} dB`);
  await tr.close(); sun.close();
})();
