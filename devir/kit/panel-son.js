const L = require('./lib');
(async () => { const b = await L.statikSunucu(L.REPO, 9064); const tr = await L.tarayici(); const ctx = await tr.newContext({ viewport: { width: 1366, height: 900 } }); const p = await ctx.newPage(); const hata = []; p.on('pageerror', (e) => hata.push(String(e).slice(0, 120)));
  const dis = []; p.on('request', (r) => { if (!/^(http:\/\/127\.0\.0\.1|data:|blob:|about:)/.test(r.url())) dis.push(r.url().slice(0, 80)); });
  await p.goto('http://127.0.0.1:9064/overlays/index.html'); await L.bekle(6000);
  const r = await p.evaluate(() => { const kucuk = []; const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT); for (let n = w.nextNode(); n; n = w.nextNode()) { const t = n.textContent.trim(); if (!t) continue; const e = n.parentElement; const cs = getComputedStyle(e); if (cs.display === 'none' || /SCRIPT|STYLE/.test(e.tagName)) continue; const px = parseFloat(cs.fontSize); if (px < 14) kucuk.push(px + 'px "' + t.slice(0, 30) + '"'); }
    const ifr = [...document.querySelectorAll('iframe')].map((f) => { const r = f.getBoundingClientRect(); return (f.getAttribute('src') || f.dataset.src || '').slice(0, 70) + ' ' + Math.round(r.width) + 'x' + Math.round(r.height) + ' oran ' + (r.width / r.height).toFixed(2); });
    const adres = [...new Set((document.body.innerText.match(/[\w./:]*overlays\/[\w.-]+\.html[^\s"']*/g) || []))];
    return { kucuk: kucuk.slice(0, 8), ifr, adres, yatayTasma: document.documentElement.scrollWidth > innerWidth + 2 }; });
  console.log(JSON.stringify(r, null, 1).slice(0, 3000), 'hata', hata, 'dis', dis.slice(0, 5)); await p.screenshot({ path: 'out/panel-son.png', fullPage: true }); await tr.close(); process.exit(0); })();
