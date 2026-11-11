'use strict';
// c4-sim.js — DUDUKLU basinc formulu, saf matematik simulasyonu (tarayici yok).
// node c4-sim.js [K=25] [PENCERE=20] [N_MIN=2.5] [SIZINTI_BEKLE=8] [SIZINTI=0.6]
// node c4-sim.js [ODUN=12] [HIZ=1.4] [DEPO=12] [SIZINTI_BEKLE=8] [SIZINTI=0.6]
const DMAX = Number(process.argv[2]) || 12, HIZ = Number(process.argv[3]) || 1.4, DEPO = Number(process.argv[4]) || 12, SB = Number(process.argv[5]) || 8, SZ = Number(process.argv[6]) || 0.6;
const TUR = 150;
const kisiTavani = (A) => Math.max(12, Math.min(45, 160 / Math.max(1, A)));
let tohum = 7; const rnd = () => { tohum = (tohum * 1664525 + 1013904223) >>> 0; return tohum / 4294967296; };
const us = (ort) => -Math.log(1 - rnd()) * ort;
function tur(nGercek, aralik, botlu) {
  const oyuncu = [];
  for (let i = 0; i < nGercek; i++) oyuncu.push({ bot: false, ort: aralik, sonraki: us(aralik), jeton: 3, jt: 0, pay: 0 });
  const nBot = botlu ? Math.max(0, 6 - nGercek) : 0;   // botlar katilimciyi 6'ya tamamlar
  for (let i = 0; i < nBot; i++) oyuncu.push({ bot: true, ort: nGercek ? 10 * 0.62 : 10, sonraki: us(8), jeton: 3, jt: 0, pay: 0 });
  let P = 0, taban = 0, son = 0, t = 0, depo = DEPO / 2; const katkida = new Set();
  const dt = 0.1;
  for (t = 0; t < TUR; t += dt) {
    if (t - son > SB) P = Math.max(taban, P - SZ * dt);
    depo = Math.min(DEPO, depo + HIZ * dt);
    for (const o of oyuncu) {
      if (t < o.sonraki) continue;
      o.sonraki = t + us(o.ort);
      o.jeton = Math.min(3, o.jeton + (t - o.jt) / 4); o.jt = t;
      if (o.jeton < 1) continue;
      o.jeton -= 1; katkida.add(o);
      let d = Math.min(DMAX, depo, kisiTavani(katkida.size) - o.pay); if (d <= 0) { son = t; continue; }
      depo -= d; o.pay += d; P = Math.min(100, P + d); son = t;
      if (P >= 66) taban = 66; else if (P >= 33) taban = Math.max(taban, 33);
      if (P >= 100) return { t, enPay: Math.max(...oyuncu.filter((x) => !x.bot).map((x) => x.pay), 0), A: katkida.size };
    }
  }
  return { t: null, P, enPay: Math.max(...oyuncu.filter((x) => !x.bot).map((x) => x.pay), 0), A: katkida.size };
}
console.log(`formul: ortak ISI DEPOSU saniyede ${HIZ} dolar (en cok ${DEPO}, tur basinda ${DEPO / 2}); bir odun = min(${DMAX}, depo, kisisel tavandan kalan) ; kisi tavani = clamp(160/A, 12, 45) ; sizinti: ${SB} sn sessizlikten sonra ${SZ}/sn ; jeton 3, 4 sn de 1`);
console.log('gercek  aralik  bot   patlama sn (ortanca [min-maks])   patlamayan   en buyuk kisisel pay');
for (const botlu of [false, true]) for (const n of [0, 1, 2, 3, 5, 10, 20, 60]) for (const g of [6, 20, 40]) {
  if (n === 0 && (!botlu || g !== 6)) continue;
  const r = []; for (let i = 0; i < 40; i++) r.push(tur(n, g, botlu));
  const pop = r.filter((x) => x.t != null).map((x) => x.t).sort((a, b) => a - b); const pay = Math.max(...r.map((x) => x.enPay));
  console.log(`${String(n).padStart(4)}   ${String(n ? g : '-').padStart(5)}   ${botlu ? 'var' : 'yok'}   ` + (pop.length ? `${pop[pop.length >> 1].toFixed(0).padStart(4)} [${pop[0].toFixed(0)}-${pop[pop.length - 1].toFixed(0)}]`.padEnd(30) : 'hic'.padEnd(30)) + `   ${String(40 - pop.length).padStart(2)}/40        ${pay.toFixed(0)}`);
}
