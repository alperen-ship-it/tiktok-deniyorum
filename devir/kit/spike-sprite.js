const L = require('./lib'); const os = require('os'); const { chromium } = require('playwright');
(async () => { const b = await L.statikSunucu(L.KOK + '/spike', 9069);
  const tr = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-proxy-server', '--disable-gpu', '--disable-gpu-compositing', '--disable-accelerated-2d-canvas'] });
  for (const q of (process.argv[2] || 'n=150').split(';')) { const ctx = await tr.newContext({ viewport: { width: 1080, height: 1920 } }); const p = await ctx.newPage(); const hata = []; p.on('pageerror', (e) => hata.push(String(e).slice(0, 200)));
    await p.goto('http://127.0.0.1:9069/sprite.html?' + q); await p.waitForFunction(() => window.__hazir, null, { timeout: 15000 }); await L.bekle(7000);
    const r = await p.evaluate(() => { const c = document.createElement('canvas'); const gl = c.getContext('webgl'); let ren = 'webgl yok'; if (gl) { const e = gl.getExtension('WEBGL_debug_renderer_info'); ren = e ? gl.getParameter(e.UNMASKED_RENDERER_WEBGL) : 'webgl var'; } return Object.assign(window.__olc(), { webgl: ren.slice(0, 50) }); });
    console.log(q.padEnd(30), JSON.stringify(r), 'yuk', os.loadavg()[0].toFixed(2), hata.join('|')); if (q === 'n=150' || q === 'n=150&zoom=1') await p.screenshot({ path: 'out/sprite-' + q.replace(/\W+/g, '_') + '.png' }); await ctx.close(); }
  await tr.close(); process.exit(0); })();
