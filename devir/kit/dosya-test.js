'use strict';
// dosya-test.js <head|repo> — file:// ile acilan overlay kopruden olay alabiliyor mu (varsayilan / --host null)
const path = require('path'); const L = require('./lib');
(async () => {
  const hedef = process.argv[2] || 'repo';
  const k = L.sahnele(L.kaynak(hedef), 'dosya-' + path.basename(hedef));
  const tr = await L.tarayici(['--allow-file-access-from-files']);
  for (const ek of [[], ['--host', 'null']]) {
    const B = L.bridgeBaslat(k, { port: 9069, etiket: 'dosya', args: ['--rate', '3', ...ek] });
    await L.hazirBekle(B);
    const p = await tr.newPage();
    await p.goto('file://' + path.join(k, 'overlays', 'at.html') + '?lite=1&port=9069&src=bridge');
    const r = await p.evaluate(() => new Promise((c) => { let n = 0; window.TT.on('*', () => n++); setTimeout(() => c({ durum: window.TT.status, olay: n }), 3500); }));
    const red = (B.stdout.match(/!!.*reddedildi.*/g) || []).slice(0, 2);
    console.log(`${path.basename(hedef)} ${ek.join(' ') || '(varsayilan)'}: file:// sayfa -> WS durum=${r.durum}, 3.5 sn de ${r.olay} olay` + (red.length ? '  | kopru logu: ' + red.join(' / ') : ''));
    await p.close(); await B.oldur();
  }
  await tr.close();
})();
