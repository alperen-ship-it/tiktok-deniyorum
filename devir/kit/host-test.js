'use strict';
// host-test.js — --host / --lan bayraklari ve 403 mesaji (calisan agac)
const L = require('./lib');
(async () => {
  const k = L.sahnele(L.kaynak('repo'), 'host-repo');
  for (const ek of [[], ['--host', 'yayin.local'], ['--host', 'yayin.local,obs.ev'], ['--lan']]) {
    const B = L.bridgeBaslat(k, { port: 9069, etiket: 'host', args: ek });
    await L.hazirBekle(B);
    const out = [];
    for (const h of ['yayin.local:9069', 'obs.ev:9069', '192.0.2.2:9069']) {
      const c = await L.ham({ port: 9069, yol: '/overlays/oyun.html', basliklar: { host: h } });
      const w = await L.wsAc({ port: 9069, hostBasligi: h, origin: 'http://' + h, zaman: 1200 }); if (w.acildi) w.kapat();
      out.push(`${h} -> sayfa ${c.kod}${c.kod === 403 ? ' "' + c.govde.slice(0, 110) + '"' : ''}, ws ${w.acildi ? 101 : w.kod}`);
    }
    const lan = await L.ham({ host: '192.0.2.2', port: 9069, yol: '/api/status', basliklar: { host: '192.0.2.2:9069' }, zaman: 1500 });
    console.log(`[${ek.join(' ') || 'varsayilan'}]\n   ` + out.join('\n   ') + `\n   LAN arayuzunden TCP: ${lan.kod || lan.hata}`);
    await B.oldur();
  }
})();
