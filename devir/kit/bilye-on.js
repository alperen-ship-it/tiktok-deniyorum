const L = require('./lib'); const S = require('./sayfa');
const U = (id) => ({ id, uniqueId: id, nickname: 'Bilye' + id, avatar: '' });
(async () => { const b = await L.statikSunucu(L.REPO, 9064); const tr = await L.tarayici();
  const ctx = await tr.newContext({ viewport: { width: 1080, height: 1920 } }); await ctx.addInitScript(S.KANCA); const p = await ctx.newPage(); const hata = []; p.on('pageerror', (e) => hata.push(String(e).slice(0, 120)));
  await p.goto('http://127.0.0.1:9064/overlays/bilye.html?lite=1&src=bridge&katilim=4&kutlama=2'); await L.bekle(800);
  const N = Number(process.argv[2]) || 10; let kartSay = 0; const sureler = [];
  for (let tur = 0; tur < 4; tur++) {
    for (let i = 0; i < N; i++) await p.evaluate(S.ATES, { type: 'chat', user: U('t' + tur + 'k' + i), comment: 'x', ts: Date.now() });
    const t0 = Date.now(); let ok = false;
    while (Date.now() - t0 < 60000) { const k = await p.evaluate(() => window.__D.kart.length); if (k > kartSay) { kartSay = k; ok = true; break; } await L.bekle(250); }
    sureler.push(ok ? ((Date.now() - t0) / 1000).toFixed(1) : 'BITMEDI'); if (!ok) { await p.screenshot({ path: 'out/bilye-takili.png' }); break; }
    await L.bekle(3500);
  }
  console.log(N, 'bilye: ilk yorumdan karta sn:', sureler.join(', '), 'hata', hata.length, hata[0] || ''); await tr.close(); process.exit(0); })();
