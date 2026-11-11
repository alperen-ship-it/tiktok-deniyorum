const L = require('./lib'); const os = require('os');
(async () => { const b = await L.statikSunucu(L.KOK + '/spike', 9069); const tr = await L.tarayici(['--enable-unsafe-swiftshader']);
  const isler = (process.argv[2] || 'n=150&h=0;n=150&h=4;n=150&h=4&birles=1;n=150&h=8&birles=1;n=0&h=8&birles=1;n=150&h=0&yuz=0').split(';');
  for (const q of isler) { const ctx = await tr.newContext({ viewport: { width: 1080, height: 1920 } }); const p = await ctx.newPage(); const hata = []; p.on('pageerror', (e) => hata.push(String(e).slice(0, 200))); p.on('console', (m) => { if (m.type() === 'error') hata.push(m.text().slice(0, 200)); });
    await p.goto('http://127.0.0.1:9069/spike.html?' + q); await p.waitForFunction(() => window.__hazir, null, { timeout: 20000 }).catch(() => {}); await L.bekle(9000);
    const r = await p.evaluate(() => window.__olc && window.__olc()).catch((e) => String(e)); console.log(q.padEnd(26), JSON.stringify(r), 'yuk', os.loadavg()[0].toFixed(2), hata.slice(0, 2).join(' | ')); if (/h=4&birles/.test(q)) await p.screenshot({ path: 'out/spike-' + q.replace(/\W+/g, '_') + '.png' }); await ctx.close(); }
  await tr.close(); process.exit(0); })();
