'use strict';
// d3-simge.js — s.simge sozlesmesi: yalniz cekirdek tablosu / kayitli oyun etiketi / tamsayi cizilir; serbest metin cizilemez. Port 9064.
const L = require('./lib'); const S = require('./sayfa'); const path = require('path');
(async () => {
  const sun = await L.statikSunucu(L.kaynak('repo'), 9064); const tr = await L.tarayici(['--enable-unsafe-swiftshader']);
  const ctx = await tr.newContext({ viewport: { width: 1080, height: 1920 } }); await ctx.addInitScript(S.TUVAL_KANCA);
  const p = await ctx.newPage(); const hata = []; p.on('pageerror', (e) => hata.push(String(e).slice(0, 140)));
  await p.goto('http://127.0.0.1:9064/overlays/sahne3d-deneme.html?lite=1&mock=0&src=bridge&kisi=30&kalite=dusuk&kilit=1', { waitUntil: 'load' });
  await p.waitForFunction(() => window.__sahne3d && window.__sahne3d.figur.liste && window.__sahne3d.figur.liste().length >= 10, null, { timeout: 20000 });
  await L.bekle(1500);
  const r = await p.evaluate(async () => {
    const s = window.__sahne3d; const kids = s.figur.liste().map((x) => (typeof x === 'string' ? x : x.kid)); const out = { izinliSayi: s.simge.izinli && s.simge.izinli.length, nida: s.simge.nida };
    let hataT = null; try { s.simge.tablo({ sirada: '✓ sıradasın', bekle: '⏳', uzun: 'x'.repeat(25) }); } catch (e) { hataT = String(e.message).slice(0, 60); }
    out.uzunTabloReddi = hataT; try { s.simge.tablo({ sirada: '✓ sıradasın', bekle: '⏳', fokur: 'FOKUR!' }); out.tablo = 'tamam'; } catch (e) { out.tablo = 'HATA ' + e.message; }
    const dene = (i, v, o) => { let d; try { d = s.simge(kids[i], v, o); } catch (e) { d = 'THROW ' + String(e.message).slice(0, 40); } return d; };
    out.gecerli = { hey: dene(0, ['HEY']), heyHop: dene(1, ['HEY', 'HOP']), emoji: dene(2, ['🔥', '❤️', '💃']), tablo: dene(3, ['sirada', 3]), fokur: dene(4, ['fokur']), sayi: dene(5, [42]) };
    out.gecersiz = { serbest: dene(6, ['zxqserbest metin']), disEmoji: dene(7, ['🦄']), kufurEmoji: dene(7, ['🖕']), bes: dene(8, ['HEY', 'HOP', 'HEY', 'HOP', 'HEY']), buyukSayi: dene(9, [10000]), kesir: dene(9, [1.5]), dizgi: dene(9, 'HEY'), bos: dene(9, []), tabloDegeri: dene(9, ['⏳']), nesne: dene(9, [{ toString() { return 'zxqnesne'; } }]), proto: dene(9, ['__proto__']), kucukHarf: dene(9, ['hey']), html: dene(9, ['<b>zxqhtml</b>']), renkXss: dene(0, ['HEY'], { renk: 'red;zxqrenk' }) };
    let gec = null; try { s.simge.tablo({ yeni: 'zxqgec' }); gec = 'KABUL EDILDI'; } catch (e) { gec = 'reddedildi'; } out.gecTablo = gec; out.gecAnahtar = dene(9, ['yeni']);
    await new Promise((r) => setTimeout(r, 900));
    out.cizilen = [...new Set(window.__T2.kayit.filter((k) => k.t > performance.now() - 2500).map((k) => k.metin))].filter((m) => !/^(Ece|Çağlar|Gülşen|Ali|Ayşe|Mehmet|Zeynep|Can|Elif|Burak|Deniz|Seda|Kaan|Melis|Tolga|Pelin|Arda|Sude)/.test(m)).slice(0, 30);
    out.zxq = [...window.__T2.hepsi].filter((m) => /zxq/.test(m)).concat(/zxq/.test(document.body.innerText) ? ['DOM'] : []);
    return out;
  });
  console.log(JSON.stringify(r, null, 1).slice(0, 2600));
  const g = await p.evaluate(S.GUVENLI); const tp = await p.evaluate(S.TUVAL_PUNTO, 30);
  console.log('yasak bolgede tuval metni: ' + (g.tuval.length ? JSON.stringify(g.tuval.slice(0, 3)) : 'yok') + ' ; <30px tuval metni: ' + (tp.kotu.filter((k) => k.bagli).length ? JSON.stringify(tp.kotu.slice(0, 3)) : 'yok') + ' ; hata: ' + (hata[0] || 'yok'));
  await p.screenshot({ path: path.join(L.CIKTI, 'd3-simge.png') }); await L.telefon(tr, path.join(L.CIKTI, 'd3-simge.png'), path.join(L.CIKTI, 'd3-simge-telefon.png'));
  // etiket genisligi: 28-29 karakterlik ad
  await ctx.close(); await tr.close(); sun.close();
})().catch((e) => { console.error('HATA', e); process.exit(2); });
