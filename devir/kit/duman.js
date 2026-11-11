'use strict';
// duman.js — kopru (mock) + panel, kontrol sayfasi ve yan sayfalar: hata var mi, disariya istek
// var mi, metinler ne diyor. Kullanim: PORT=9141 node duman.js   (varsayilan port 9141)
// Aga cikmaz: kopru --mock, tarayici yalnizca 127.0.0.1. Disari giden her istek kaydedilir ve engellenir.
const L = require('./lib');
const PORT = Number(process.env.PORT) || 9141;
(async () => {
  const klasor = L.sahnele(L.kaynak('repo'), 'duman');
  const b = L.bridgeBaslat(klasor, { port: PORT, args: ['--mock'], etiket: 'duman' });
  await L.hazirBekle(b);
  const tr = await L.tarayici(['--enable-unsafe-swiftshader']);
  const kok = `http://127.0.0.1:${PORT}`;
  let kaldi = 0;
  const yaz = (iyi, m) => { if (!iyi) kaldi++; console.log((iyi ? '  [GECTI] ' : '  [KALDI] ') + m); };
  async function sayfa(ad, yol, bekle, oku, boyut) {
    const ctx = await tr.newContext({ viewport: boyut || { width: 1080, height: 1920 } });
    const p = await ctx.newPage(); const hata = [], dis = [];
    p.on('pageerror', (e) => hata.push(String(e.message || e).slice(0, 160)));
    p.on('console', (m) => { if (m.type() === 'error') hata.push('console: ' + m.text().slice(0, 160)); });
    await p.route('**/*', (r) => { const u = r.request().url(); if (/^(http:\/\/127\.0\.0\.1[:\/]|ws:\/\/127\.0\.0\.1[:\/]|data:|blob:)/.test(u)) return r.continue(); dis.push(u.slice(0, 90)); return r.abort(); });
    await p.goto(kok + yol, { waitUntil: 'load' });
    await L.bekle(bekle || 2500);
    let veri = null; try { veri = oku ? await p.evaluate(oku) : null; } catch (e) { veri = 'OKUNAMADI: ' + e.message; }
    console.log(`\n## ${ad}  ${yol}`);
    yaz(hata.length === 0, 'sayfa hatasi yok' + (hata.length ? ': ' + hata.slice(0, 3).join(' | ') : ''));
    yaz(dis.length === 0, 'disariya istek yok' + (dis.length ? ': ' + [...new Set(dis)].slice(0, 4).join(' , ') : ''));
    if (veri != null) console.log('  [veri ] ' + (typeof veri === 'string' ? veri : JSON.stringify(veri)).slice(0, 900));
    await ctx.close();
    return veri;
  }
  const metin = () => document.body.innerText.replace(/\s+/g, ' ').trim().slice(0, 700);
  await sayfa('panel', '/', 3500, () => ({ durum: document.getElementById('statusTxt') && document.getElementById('statusTxt').textContent, olcum: (document.getElementById('olcumOzet') || {}).textContent, kart: document.querySelectorAll('.card, .kart, [data-copy]').length, at: [...document.querySelectorAll('body *')].map((e) => e.childElementCount === 0 ? e.textContent : '').filter((t) => /rastlant|şans/.test(t)).map((t) => t.slice(t.search(/tavanlı/) - 5, t.search(/tavanlı/) + 60)) }), { width: 1400, height: 1000 });
  const k = await sayfa('kontrol (dis=0)', '/overlays/kontrol.html?dis=0', 6500, () => ({ ozet: document.getElementById('ozet').textContent, satirlar: [...document.querySelectorAll('.satir, .sira, tr, li')].map((e) => e.innerText.replace(/\s+/g, ' ').trim()).filter(Boolean).slice(0, 14), tasma: document.documentElement.scrollHeight - innerHeight }));
  if (k && typeof k === 'object') { yaz(/HAZIR|OYUNLAR ÇALIŞIR/.test(k.ozet), 'kontrol ozeti: ' + k.ozet); yaz(k.tasma <= 0, 'kontrol sayfasi pencereye sigiyor (tasma ' + k.tasma + 'px)'); yaz(k.satirlar.some((s) => /sınanmadı \(dis=0\)/.test(s)), 'dis=0: dis resim sinamasi atlandi'); }
  const lg = await sayfa('begeni hedefi', '/overlays/like-goal.html?mock=1', 2500, () => ({ alt: document.getElementById('doneSub').textContent, yuzde: (document.querySelector('#pct, .pct') || {}).textContent, govde: document.body.innerText.replace(/\s+/g, ' ').trim().slice(0, 200) }), { width: 1080, height: 400 });
  if (lg && typeof lg === 'object') yaz(/beğeni hedefi$/.test(lg.alt) && !/i̇/.test(lg.alt), 'begeni hedefi kucuk harf: "' + lg.alt + '"');
  const lg2 = await sayfa('begeni hedefi (ozel baslik)', '/overlays/like-goal.html?mock=1&label=' + encodeURIComponent('IŞIK HEDEFİ'), 1500, () => document.getElementById('doneSub').textContent, { width: 1080, height: 400 });
  yaz(typeof lg2 === 'string' && /ışık hedefi$/.test(lg2), 'Turkce kucuk harf (I -> ı, İ -> i): "' + lg2 + '"');
  await sayfa('uyarilar', '/overlays/alerts.html?mock=1', 3500, metin, { width: 1080, height: 1920 });
  await sayfa('durum karti', '/overlays/durum.html', 2500, metin, { width: 800, height: 400 });
  await sayfa('hediye yagmuru', '/overlays/gift-rain.html?mock=1', 2500, metin);
  await sayfa('3D deneme', '/overlays/sahne3d-deneme.html?kisi=30&kalite=dusuk&kilit=1', 5000, () => document.body.innerText.replace(/\s+/g, ' ').trim().slice(0, 500));
  await sayfa('merkez', '/overlays/oyun.html?lite=1', 5000, () => ({ cerceve: (document.getElementById('sahne') || {}).src }));
  console.log('\n## kopru');
  const g = b.guard(); yaz(g.length === 0, 'koprunun loopback disi ag denemesi yok' + (g.length ? ': ' + g.slice(0, 3).join(' | ') : ''));
  const kop = (b.stdout + b.stderr); yaz(!/[^\x00-\x7F]/.test(kop.replace(/[─-╿]/g, '')), 'kopru konsol ciktisi ASCII' + (/[^\x00-\x7F]/.test(kop) ? ' degil: ' + JSON.stringify((kop.match(/.{0,30}[^\x00-\x7F].{0,30}/) || [''])[0]) : ''));
  await tr.close(); await b.oldur();
  console.log(`\n# OZET: ${kaldi === 0 ? 'hepsi gecti' : kaldi + ' KALDI'}`);
  process.exit(kaldi ? 1 : 0);
})().catch((e) => { console.error('HATA', e); process.exit(2); });
