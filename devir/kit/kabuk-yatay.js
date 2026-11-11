'use strict';
// kabuk-yatay.js — (a) ?yatay=1: 6d2594b/"onceki" ile calisan agac arasinda eleman kutulari + punto ayni mi (1920x1080)
//                  (b) eski, oyun olmayan overlay'ler (chat, alerts, ...) varsayilan ve ?yatay=1 ile: onceki surume gore fark
//                  (c) ULTI dogru arguman sirasi + kucuk pencerede olcek ; konfeti kirpma
// "onceki" = S'nin baslangic commit'i 3650bfe (danisman/stage/onceki'ye git archive ile acilir; depoya dokunmaz). Port 9066.
const fs = require('fs'); const path = require('path'); const { execSync } = require('child_process');
const L = require('./lib');
(async () => {
  const onceki = path.join(L.KOK, 'stage', 'onceki'); fs.rmSync(onceki, { recursive: true, force: true }); fs.mkdirSync(onceki, { recursive: true });
  execSync(`git -C ${L.REPO} archive 3650bfe overlays | tar -x -C ${onceki}`);
  const sunE = await L.statikSunucu(onceki, 9066), sunY = await L.statikSunucu(L.REPO, 9067);
  const tr = await L.tarayici();
  const dok = async (taban, sayfa, sorgu, bak) => {
    const ctx = await tr.newContext({ viewport: bak }); const p = await ctx.newPage(); const hata = [];
    p.on('pageerror', (e) => hata.push(String(e).slice(0, 120)));
    await p.addInitScript(() => { let s = 12345; Math.random = () => { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; }; });
    await p.goto(`${taban}/overlays/${sayfa}?${sorgu}`, { waitUntil: 'load' }); await L.bekle(1800);
    const d = await p.evaluate(() => { const out = {}; const say = {}; for (const e of document.querySelectorAll('body *')) { if (/^(SCRIPT|STYLE)$/.test(e.tagName)) continue; const cs = getComputedStyle(e); if (cs.display === 'none') continue; const r = e.getBoundingClientRect(); let yol = ''; for (let x = e, n = 0; x && x !== document.body && n < 5; x = x.parentElement, n++) yol = (x.id ? '#' + x.id : x.tagName.toLowerCase() + (typeof x.className === 'string' && x.className ? '.' + x.className.trim().split(/\s+/)[0] : '')) + '>' + yol; say[yol] = (say[yol] || 0) + 1; out[yol + say[yol]] = [Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height), cs.fontSize, cs.visibility, Math.round(Number(cs.opacity) * 100)].join(','); } return out; });
    await ctx.close(); return { d, hata };
  };
  const karsilastir = (a, b) => { const fark = []; for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) if (a[k] !== b[k]) fark.push(`${k}: ${a[k] || 'YOK'} → ${b[k] || 'YOK'}`); return fark; };
  console.log('## (a) ?yatay=1, 1920x1080: 3650bfe (kabuk oncesi) ile calisan agac');
  for (const s of ['at', 'bilye', 'bilgi', 'pk', 'halay']) {
    const e = await dok('http://127.0.0.1:9066', s + '.html', 'lite=1&src=bridge&katil=1', { width: 1920, height: 1080 });
    const y = await dok('http://127.0.0.1:9067', s + '.html', 'lite=1&src=bridge&katil=1&yatay=1', { width: 1920, height: 1080 });
    const f = karsilastir(e.d, y.d);
    console.log(`  [${f.length ? 'FARK ' : 'AYNI '}] ${s.padEnd(6)} ${Object.keys(e.d).length} eleman` + (f.length ? `, ${f.length} fark: ` + f.slice(0, 5).join(' ; ').slice(0, 520) : '') + (y.hata.length ? '  HATA: ' + y.hata[0] : ''));
  }
  console.log('## (b) oyun olmayan eski overlayler: onceki (varsayilan) ile yeni (varsayilan / ?yatay=1 / ?v=1)');
  for (const s of ['chat', 'alerts', 'durum', 'like-goal', 'gift-rain', 'race', 'battle', 'boss']) {
    if (!fs.existsSync(path.join(L.REPO, 'overlays', s + '.html'))) continue;
    const satir = [];
    for (const [ad, bak, eq, yq] of [['1920x1080', { width: 1920, height: 1080 }, '', ''], ['1920x1080 ?yatay=1', { width: 1920, height: 1080 }, '', '&yatay=1'], ['1080x1920', { width: 1080, height: 1920 }, '', ''], ['1080x1920 ?v=1', { width: 1080, height: 1920 }, '&v=1', '&v=1']]) {
      const e = await dok('http://127.0.0.1:9066', s + '.html', 'lite=1&src=bridge' + eq, bak), y = await dok('http://127.0.0.1:9067', s + '.html', 'lite=1&src=bridge' + yq, bak);
      const f = karsilastir(e.d, y.d); satir.push(`${ad}: ${f.length ? f.length + ' fark (' + f.slice(0, 2).join(' ; ').slice(0, 200) + ')' : 'ayni'}${y.hata.length ? ' HATA ' + y.hata[0] : ''}`);
    }
    console.log(`  ${s.padEnd(10)} ` + satir.join('\n             '));
  }
  console.log('## (c) ULTI (ad = ilk arguman) ve konfeti');
  for (const [w, h] of [[1080, 1920], [1920, 1080], [390, 693]]) {
    const ctx = await tr.newContext({ viewport: { width: w, height: h } }); const p = await ctx.newPage();
    await p.goto('http://127.0.0.1:9067/overlays/pk.html?lite=1&src=bridge', { waitUntil: 'load' }); await L.bekle(900);
    for (const ad of ['Ali', 'İstanbulluGüzelÇiçekŞöğüt2026']) {
      await p.evaluate((ad) => window.ULTI.duyur(ad, { ad: 'TEŞEKKÜRLER', emoji: '🎁', renk: '#ffd23f', guc: 2 }, 900), ad); await L.bekle(550);
      const b = await p.evaluate(() => { const o = Number(getComputedStyle(document.documentElement).getPropertyValue('--tt-olcek')) || 1; const k = document.getElementById('kok').getBoundingClientRect(); const e = document.getElementById('ulti-bant'); const r = e.getBoundingClientRect(); const kim = e.querySelector('.u-kim'), ad = e.querySelector('.u-ad'); const kr = kim.getBoundingClientRect(); const ic = !!e.closest('#kok'); const px = (x) => parseFloat(getComputedStyle(x).fontSize) * (ic ? 1 : 1 / o); const tr = getComputedStyle(e).transform; return { my: Math.round(((r.top + r.bottom) / 2 - k.top) / o), ust: Math.round((r.top - k.top) / o), alt: Math.round((r.bottom - k.top) / o), adPx: Math.round(px(kim)), etiketPx: Math.round(px(ad)), adGen: Math.round(kr.width / o), adTasma: kim.scrollWidth > kim.clientWidth + 1, x: [Math.round((r.left - k.left) / o), Math.round((r.right - k.left) / o)], adEkranPx: Math.round(kr.height) }; });
      console.log(`  pencere ${w}x${h} ULTI "${[...ad].length}krk": merkez y=${b.my} (${b.ust}..${b.alt}), ad ${b.adPx}px (ekranda ${b.adEkranPx}px yuksek)${b.adTasma ? ' TASIYOR' : ''}, etiket ${b.etiketPx}px, bant x ${b.x}`);
      await L.bekle(900);
    }
    if (w === 1080) {
      await p.evaluate(() => window.Juice.konfeti({ y: 0.3, adet: 400 })); await L.bekle(700);
      const png = await p.screenshot(); fs.writeFileSync(path.join(L.CIKTI, 'kabuk-konfeti-pk.png'), png);
      const say = await p.evaluate(async (b64) => { const img = new Image(); img.src = 'data:image/png;base64,' + b64; await img.decode(); const c = document.createElement('canvas'); c.width = 1080; c.height = 1920; const g = c.getContext('2d'); g.drawImage(img, 0, 0); return 1; }, png.toString('base64')).catch(() => 0);
      void say;
    }
    await ctx.close();
  }
  // konfeti: yasak bolgelerde parcacik var mi — konfetili ve konfetisiz iki goruntunun farki
  {
    const ctx = await tr.newContext({ viewport: { width: 1080, height: 1920 } }); const p = await ctx.newPage();
    await p.goto('http://127.0.0.1:9067/overlays/pk.html?lite=1&src=bridge&katil=1', { waitUntil: 'load' }); await L.bekle(1500);
    const r = await p.evaluate(async () => {
      const tuvaller = () => [...document.querySelectorAll('canvas')];
      const once = new Set(tuvaller()); window.Juice.konfeti({ y: 0.3, adet: 600 }); await new Promise((r) => setTimeout(r, 900));
      const yeni = tuvaller().filter((c) => !once.has(c))[0] || tuvaller().find((c) => /konfeti|juice/i.test(c.id + c.className));
      if (!yeni) return { yok: true };
      const k = yeni.getBoundingClientRect(); const g = yeni.getContext('2d'); const d = g.getImageData(0, 0, yeni.width, yeni.height).data; const sx = yeni.width / 1080, sy = yeni.height / 1920;
      const bolge = { ust: 0, yan: 0, solAlt: 0, alt: 0, izinli: 0 };
      for (let y = 0; y < yeni.height; y += 3) for (let x = 0; x < yeni.width; x += 3) { if (d[(y * yeni.width + x) * 4 + 3] < 40) continue; const X = x / sx, Y = y / sy; if (Y < 240) bolge.ust++; else if (Y > 1760) bolge.alt++; else if (X < 540 && Y > 1250) bolge.solAlt++; else bolge.izinli++; }
      return { kutu: [Math.round(k.left), Math.round(k.top), Math.round(k.width), Math.round(k.height)], boyut: [yeni.width, yeni.height], bolge };
    });
    console.log('  konfeti parcaciklari (0.9. sn): ' + JSON.stringify(r));
    await ctx.close();
  }
  await tr.close(); sunE.close(); sunY.close();
})().catch((e) => { console.error('HATA', e); process.exit(2); });
