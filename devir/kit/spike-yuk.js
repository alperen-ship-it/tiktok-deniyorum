const L = require('./lib'); const { chromium } = require('playwright');
(async () => { const b = await L.statikSunucu(L.KOK + '/spike', 9069); const tr = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-proxy-server', '--disable-gpu', '--disable-accelerated-2d-canvas'] });
  for (const n of [1, 12, 24]) { const ctx = await tr.newContext({ viewport: { width: 1080, height: 1920 } }); const p = await ctx.newPage(); const cdp = await ctx.newCDPSession(p); await p.goto('http://127.0.0.1:9069/yuk.html?n=' + n); await p.waitForFunction(() => window.__r, null, { timeout: 30000 }); const r = await p.evaluate(() => window.__r); await L.bekle(500);
    let mem = null; try { const m = await cdp.send('Memory.getAllTimeSamplingProfile'); } catch (e) {} const pm = await cdp.send('Performance.getMetrics').catch(() => null); console.log(JSON.stringify(r)); await ctx.close(); }
  await tr.close(); process.exit(0); })();
