'use strict';
// port80-test.js <head|repo> — LIVE Studio yolu: sayfa http://localtest.me/ (PORTSUZ = 80) adresinden aciliyor.
// 80'e baglanamadigimiz icin Chromium'a "localtest.me:80 -> 127.0.0.1:9069" eslemesi veriyoruz: tarayici
// acisindan sayfa port 80'de; kopruye giden Host: localtest.me, Origin: http://localtest.me (ayna dinleyicinin gorecegiyle ayni).
const path = require('path'); const L = require('./lib');
(async () => {
  const hedef = process.argv[2] || 'repo';
  const k = L.sahnele(L.kaynak(hedef), 'p80-' + path.basename(hedef));
  const B = L.bridgeBaslat(k, { port: 9069, etiket: 'p80', args: ['--rate', '3'] });
  await L.hazirBekle(B);
  const tr = await L.tarayici(['--host-resolver-rules=MAP localtest.me:80 127.0.0.1:9069, MAP oyun.localtest.me:80 127.0.0.1:9069']);
  for (const taban of ['http://localtest.me', 'http://oyun.localtest.me']) {
    const p = await tr.newPage();
    const kotu = []; const istek = [];
    p.on('response', (r) => { if (r.status() >= 400) kotu.push(r.status() + ' ' + r.request().method() + ' ' + r.url().replace(taban, '')); });
    p.on('request', (r) => { if (/\/api\//.test(r.url())) istek.push(r.method() + ' ' + r.url()); });
    p.on('websocket', (w) => istek.push('WS ' + w.url()));
    await p.goto(taban + '/overlays/oyun.html?lite=1&oyunlar=at,bilgi&sn=600', { waitUntil: 'load' });
    await L.bekle(2500);
    const f = p.frames().find((x) => /at\.html/.test(x.url()));
    const r = await f.evaluate(() => new Promise((c) => { let n = 0; window.TT.on('*', () => n++); window.TT.soyle('P80-SOYLE'); setTimeout(() => c({ durum: window.TT.status, olay: n }), 3000); }));
    const ist = JSON.parse((await L.ham({ port: 9069, yol: '/api/istatistik', basliklar: { host: 'localhost:9069' } })).govde);
    await p.goto(taban + '/', { waitUntil: 'load' });
    await L.bekle(1500);
    const panel = await p.evaluate(() => (document.getElementById('statusTxt') || {}).textContent);
    console.log(`${path.basename(hedef)} ${taban}/ : oyun cercevesi WS durum=${r.durum}, 3 sn de ${r.olay} olay; aktifOyun=${ist.aktifOyun}; panel durum="${panel}"; hatali istek: ${kotu.length ? kotu.join(' ; ') : 'yok'}`);
    console.log('   istekler: ' + [...new Set(istek)].slice(0, 6).join(' | '));
    await p.close();
  }
  console.log('   kopru red logu: ' + ((B.stdout.match(/!!.*reddedildi.*/g) || []).join(' / ') || 'yok') + ' ; bot: ' + ((B.stdout.match(/bot \(ekran\).*/g) || []).join(' / ') || 'yok'));
  await tr.close(); await B.oldur();
})();
