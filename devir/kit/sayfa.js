'use strict';
/**
 * sayfa.js — tarayici tarafinda calisan ortak olcum fonksiyonlari.
 * Hepsi page.evaluate ile cagrilir; sayfaya hicbir sey EKLEMEZ (sadece okur),
 * KANCA() haric: o, addInitScript ile sayfa betiklerinden ONCE kurulur.
 */

/** addInitScript: metin/cagri kaydi. window.__D altinda toplar. */
function KANCA() {
  const D = (window.__D = { spiker: [], soyle: [], uyanis: [], kart: [], ulti: [], hatalar: [], postalar: [], metinler: new Set(), fetchler: [] });
  const sar = (nesneAdi, fnAdi, kayit) => {
    let asil;
    const dene = () => {
      const n = window[nesneAdi];
      if (!n || typeof n[fnAdi] !== 'function' || n[fnAdi].__d) return !!(n && n[fnAdi] && n[fnAdi].__d);
      asil = n[fnAdi];
      const yeni = function (...a) { try { kayit(a); } catch (e) { /* */ } return asil.apply(this, a); };
      yeni.__d = true;
      try { n[fnAdi] = yeni; } catch (e) { /* salt okunur */ }
      return true;
    };
    const iv = setInterval(() => { if (dene()) clearInterval(iv); }, 5);
    document.addEventListener('DOMContentLoaded', dene);
  };
  const duz = (h) => String(h).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  sar('Spiker', 'soyle', (a) => D.spiker.push({ t: performance.now(), metin: duz(a[0]), html: String(a[0]), o: a[1] || {} }));
  sar('TT', 'soyle', (a) => D.soyle.push({ t: performance.now(), metin: String(a[0]) }));
  sar('TT', 'uyanis', (a) => D.uyanis.push(JSON.parse(JSON.stringify(a[0] || {}))));
  sar('Finis', 'kart', (a) => D.kart.push({ t: performance.now(), isim: a[1] && a[1].isim, alt: a[1] && a[1].alt, sesVar: !!(a[1] && a[1].ses) }));
  sar('ULTI', 'duyur', (a) => D.ulti.push({ t: performance.now(), kim: a[0], ad: a[1] && a[1].ad, sure: a[2] }));
  // Ses.cal sayimi (Finis.kart zafer sesini kendi caliyor mu, cift calma var mi)
  D.sesler = [];
  sar('Ses', 'cal', (a) => D.sesler.push({ t: performance.now(), ad: a[0] }));
  addEventListener('error', (e) => D.hatalar.push('error: ' + (e.message || e)));
  addEventListener('unhandledrejection', (e) => D.hatalar.push('rejection: ' + (e.reason && e.reason.message || e.reason)));
  // parent'a giden postMessage (tur-bitti / nabiz) — sayfa tek basina acikken de gorulsun
  try {
    const asilPost = window.parent.postMessage.bind(window.parent);
    if (window.parent !== window) { /* gercek merkez icindeyiz: dokunma */ }
    else window.postMessage = function (m, ...r) { try { if (m && m.tt) D.postalar.push({ t: performance.now(), tt: m.tt }); } catch (e) { /* */ } return asilPost(m, ...r); };
  } catch (e) { /* */ }
  // gorunen metni surekli topla (gecici satirlar kacmasin)
  const topla = () => {
    try {
      if (document.body) for (const s of document.body.innerText.split('\n')) { const t = s.trim(); if (t) D.metinler.add(t); }
    } catch (e) { /* */ }
  };
  setInterval(topla, 120);
  document.addEventListener('DOMContentLoaded', () => {
    new MutationObserver(topla).observe(document.documentElement, { childList: true, subtree: true, characterData: true });
  });
}

/** Sozde-eleman (::before/::after) content metinleri + title. */
function SOZDE() {
  const out = [];
  for (const el of document.querySelectorAll('*')) {
    for (const p of ['::before', '::after']) {
      const c = getComputedStyle(el, p).content;
      if (c && c !== 'none' && c !== 'normal' && /[A-Za-zÇĞİÖŞÜçğıöşü]/.test(c)) out.push({ nerede: (el.id ? '#' + el.id : el.className ? '.' + String(el.className).split(' ')[0] : el.tagName) + p, metin: c.replace(/^"|"$/g, '') });
    }
  }
  out.push({ nerede: 'title', metin: document.title });
  return out;
}

/**
 * Gorunen metin dugumlerinin ETKIN punto taramasi (1920 tasarim pikseli).
 * etkin = font-size x (ekrandaki kutu / yerlesim kutusu) / sayfa olcegi.
 * Doner: [{metin, px, sec, gorunur}] — px < esik olanlar.
 */
function PUNTO(esik) {
  const olcek = Number(getComputedStyle(document.documentElement).getPropertyValue('--tt-olcek')) || 1;
  const kotu = [];
  let toplam = 0;
  const yol = (el) => { const p = []; for (let e = el; e && e !== document.body && p.length < 4; e = e.parentElement) p.unshift(e.id ? '#' + e.id : e.className && typeof e.className === 'string' ? '.' + e.className.trim().split(/\s+/)[0] : e.tagName.toLowerCase()); return p.join('>'); };
  const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let n = w.nextNode(); n; n = w.nextNode()) {
    const metin = n.nodeValue.replace(/\s+/g, ' ').trim();
    if (!metin) continue;
    const el = n.parentElement;
    if (!el || /^(SCRIPT|STYLE|NOSCRIPT)$/.test(el.tagName)) continue;
    const cs = getComputedStyle(el);
    const r = document.createRange(); r.selectNodeContents(n);
    const kutu = r.getBoundingClientRect();
    if (kutu.width < 1 || kutu.height < 1) continue;
    if (cs.visibility === 'hidden' || cs.display === 'none') continue;
    let op = 1, gizli = false;
    for (let e = el; e; e = e.parentElement) { const c = getComputedStyle(e); op *= Number(c.opacity); if (c.display === 'none' || c.visibility === 'hidden') gizli = true; }
    if (gizli || op < 0.05) continue;
    if (kutu.right < 0 || kutu.bottom < 0 || kutu.left > innerWidth || kutu.top > innerHeight) continue;
    // giris/cikis animasyonunun ORTASINDAKI eleman olculmez (scaleX .2 -> 1 gibi gecici olcekler punto degildir)
    let canli = false;
    for (let e = el; e && e !== document.documentElement; e = e.parentElement) { if (e.getAnimations && e.getAnimations().some((a) => a.playState === 'running' && a.effect && a.effect.getComputedTiming().iterations !== Infinity)) { canli = true; break; } }
    if (canli) continue;
    // donusum olcegi
    let s = 1;
    for (let e = el; e && e !== document.documentElement; e = e.parentElement) {
      const t = getComputedStyle(e).transform;
      if (t && t !== 'none') { const m = new DOMMatrixReadOnly(t); s *= Math.sqrt(Math.abs(m.a * m.d - m.b * m.c)) || 1; }
      const z = Number(getComputedStyle(e).zoom); if (z && z !== 1) s *= z;
    }
    const px = parseFloat(cs.fontSize) * s / olcek;
    toplam++;
    // yalniz emoji/simge iceren dugumler metin sayilmaz
    if (!/[A-Za-z0-9ÇĞİÖŞÜçğıöşü]/.test(metin)) continue;
    if (px < esik - 0.01) kotu.push({ metin: metin.slice(0, 40), px: Math.round(px * 10) / 10, sec: yol(el), op: Math.round(op * 100) / 100 });
  }
  return { toplam, kotu, olcek };
}

/** Kesilen (ellipsis / tasma gizli) metinler. */
function KESIK() {
  const out = [];
  const yol = (el) => { const p = []; for (let e = el; e && e !== document.body && p.length < 4; e = e.parentElement) p.unshift(e.id ? '#' + e.id : e.className && typeof e.className === 'string' ? '.' + e.className.trim().split(/\s+/)[0] : e.tagName.toLowerCase()); return p.join('>'); };
  for (const el of document.body.querySelectorAll('*')) {
    if (!el.childNodes.length) continue;
    let kendiMetni = '';
    for (const c of el.childNodes) if (c.nodeType === 3) kendiMetni += c.nodeValue;
    kendiMetni = kendiMetni.trim();
    if (!kendiMetni) continue;
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden' || el.getClientRects().length === 0) continue;
    const gizliX = /hidden|clip/.test(cs.overflowX) || cs.textOverflow === 'ellipsis';
    if (gizliX && el.scrollWidth > el.clientWidth + 1) out.push({ metin: kendiMetni.slice(0, 40), sec: yol(el), tasan: el.scrollWidth - el.clientWidth, tur: cs.textOverflow === 'ellipsis' ? 'ellipsis' : 'kirpma' });
    else if (/hidden|clip/.test(cs.overflowY) && el.scrollHeight > el.clientHeight + 2 && cs.whiteSpace !== 'nowrap') out.push({ metin: kendiMetni.slice(0, 40), sec: yol(el), tasan: el.scrollHeight - el.clientHeight, tur: 'dikey kirpma' });
  }
  return out;
}

/** #kok tasmasi + gorunen metinde NaN/undefined/null/[object. */
function TASMA() {
  const kok = document.getElementById('kok');
  const out = { kokVar: !!kok, tasanlar: [], bozukMetin: [] };
  const olcek = Number(getComputedStyle(document.documentElement).getPropertyValue('--tt-olcek')) || 1;
  if (kok) {
    const k = kok.getBoundingClientRect();
    out.kok = { x: Math.round(k.left), y: Math.round(k.top), w: Math.round(k.width), h: Math.round(k.height), scrollW: kok.scrollWidth, clientW: kok.clientWidth, scrollH: kok.scrollHeight, clientH: kok.clientHeight };
    out.kokIcTasma = kok.scrollWidth > kok.clientWidth + 2 || kok.scrollHeight > kok.clientHeight + 2;
    out.kokEkranDisi = k.left < -2 || k.top < -2 || k.right > innerWidth + 2 || k.bottom > innerHeight + 2;
    const yol = (el) => { const p = []; for (let e = el; e && e !== kok && p.length < 4; e = e.parentElement) p.unshift(e.id ? '#' + e.id : e.className && typeof e.className === 'string' ? '.' + e.className.trim().split(/\s+/)[0] : e.tagName.toLowerCase()); return p.join('>'); };
    for (const el of kok.querySelectorAll('*')) {
      const cs = getComputedStyle(el);
      if (cs.display === 'none' || cs.visibility === 'hidden' || Number(cs.opacity) === 0) continue;
      if (cs.position === 'fixed') continue;
      const r = el.getBoundingClientRect();
      if (r.width < 2 || r.height < 2) continue;
      // bir ust overflow:hidden atasi kirpiyorsa gorunmez -> sayma
      let kirpik = false;
      for (let e = el.parentElement; e && e !== kok.parentElement; e = e.parentElement) {
        const c = getComputedStyle(e);
        if (/hidden|clip/.test(c.overflow + c.overflowX + c.overflowY)) {
          const pr = e.getBoundingClientRect();
          if (r.left >= pr.right || r.right <= pr.left || r.top >= pr.bottom || r.bottom <= pr.top) { kirpik = true; break; }
          if (e !== kok) { kirpik = 'kismi'; }
        }
      }
      if (kirpik === true) continue;
      const tas = Math.max(k.left - r.left, r.right - k.right, k.top - r.top, r.bottom - k.bottom);
      if (tas > 3 * olcek && kirpik !== 'kismi') {
        // yalnizca metin ya da resim tasiyan elemanlar anlamli
        if ((el.innerText || '').trim() || el.tagName === 'IMG' || el.tagName === 'CANVAS') out.tasanlar.push({ sec: yol(el), tas: Math.round(tas / olcek), metin: (el.innerText || '').trim().slice(0, 30) });
      }
    }
    out.tasanlar = out.tasanlar.slice(0, 12);
  }
  for (const s of document.body.innerText.split('\n')) {
    if (/\bNaN\b|\bundefined\b|\bnull\b|\[object |Infinity/.test(s)) out.bozukMetin.push(s.trim().slice(0, 80));
  }
  out.bozukMetin = [...new Set(out.bozukMetin)].slice(0, 10);
  return out;
}

/** Sayfaya olay enjekte et (TT.fire). */
function ATES(ev) { window.TT.fire(ev); return true; }


/** addInitScript: tuval metni kaydi (fillText/strokeText) — metin, etkin punto ve TASARIM koordinati (1080x1920). */
function TUVAL_KANCA() {
  const K = (window.__T2 = { kayit: [], hepsi: new Set() });
  const tasarim = (canvas, cx, cy) => {
    if (!canvas || !canvas.isConnected) return null;
    const r = canvas.getBoundingClientRect(); if (!r.width || !canvas.width) return null;
    const kok = document.getElementById('kok'); const kr = kok ? kok.getBoundingClientRect() : { left: 0, top: 0 };
    const olcek = Number(getComputedStyle(document.documentElement).getPropertyValue('--tt-olcek')) || 1;
    return { x: (r.left + cx * r.width / canvas.width - kr.left) / olcek, y: (r.top + cy * r.height / canvas.height - kr.top) / olcek, k: (r.width / canvas.width) / olcek };
  };
  for (const ad of ['fillText', 'strokeText']) {
    const asil = CanvasRenderingContext2D.prototype[ad];
    CanvasRenderingContext2D.prototype[ad] = function (t, x, y, ...r) {
      try {
        const metin = String(t); K.hepsi.add(metin);
        if (K.kayit.length < 60000) {
          const m = this.getTransform(); const px = parseFloat((this.font.match(/([\d.]+)px/) || [0, 0])[1]);
          const s = Math.sqrt(Math.abs(m.a * m.d - m.b * m.c)) || 1;
          const w = this.measureText(metin).width;
          let sol = x; const hiza = this.textAlign; if (hiza === 'center') sol = x - w / 2; else if (hiza === 'right' || hiza === 'end') sol = x - w;
          const p0 = tasarim(this.canvas, m.a * sol + m.c * y + m.e, m.b * sol + m.d * y + m.f);
          const p1 = tasarim(this.canvas, m.a * (sol + w) + m.c * y + m.e, m.b * (sol + w) + m.d * y + m.f);
          K.kayit.push({ t: performance.now(), metin, px: p0 ? px * s * p0.k : null, hamPx: px * s, x0: p0 && p0.x, x1: p1 && p1.x, y: p0 && p0.y, bagli: !!p0 });
        }
      } catch (e) { /* olcum oyunu bozmasin */ }
      return asil.call(this, t, x, y, ...r);
    };
  }
}

/**
 * Guvenli bolge ihlali (dikey 1080x1920 tasarim pikseli). DOM metin dugumleri + TUVAL_KANCA kayitlari.
 * Yasak: y<240 ; x<60 ya da x>1020 ; (x<540 ve y>1250) ; y>1760.
 */
function GUVENLI(o) {
  const Z = Object.assign({ ust: 240, yan: 60, en: 1080, solAltX: 540, solAltY: 1250, alt: 1760 }, o || {});
  const olcek = Number(getComputedStyle(document.documentElement).getPropertyValue('--tt-olcek')) || 1;
  const kok = document.getElementById('kok'); const kr = kok ? kok.getBoundingClientRect() : { left: 0, top: 0 };
  const ihlal = (x0, y0, x1, y1) => {
    const n = [];
    if (y0 < Z.ust - 1) n.push('ust<' + Z.ust);
    if (x0 < Z.yan - 1) n.push('sol<' + Z.yan);
    if (x1 > Z.en - Z.yan + 1) n.push('sag>' + (Z.en - Z.yan));
    if (y1 > Z.alt + 1) n.push('alt>' + Z.alt);
    if (x0 < Z.solAltX - 1 && y1 > Z.solAltY + 1) n.push('sol-alt (yorum kutusu)');
    return n;
  };
  const yol = (el) => { const p = []; for (let e = el; e && e !== document.body && p.length < 4; e = e.parentElement) p.unshift(e.id ? '#' + e.id : e.className && typeof e.className === 'string' ? '.' + e.className.trim().split(/\s+/)[0] : e.tagName.toLowerCase()); return p.join('>'); };
  const out = { dom: [], tuval: [], domSayi: 0, tuvalSayi: 0 };
  const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let n = w.nextNode(); n; n = w.nextNode()) {
    const metin = n.nodeValue.replace(/\s+/g, ' ').trim(); if (!metin || !/[\p{L}\p{N}]/u.test(metin)) continue;
    const el = n.parentElement; if (!el || /^(SCRIPT|STYLE)$/.test(el.tagName)) continue;
    let op = 1, gizli = false; for (let e = el; e; e = e.parentElement) { const c = getComputedStyle(e); op *= Number(c.opacity); if (c.display === 'none' || c.visibility === 'hidden') gizli = true; }
    if (gizli || op < 0.05) continue;
    const r = document.createRange(); r.selectNodeContents(n);
    for (const k of r.getClientRects()) {
      if (k.width < 1 || k.height < 1) continue;
      out.domSayi++;
      const v = ihlal((k.left - kr.left) / olcek, (k.top - kr.top) / olcek, (k.right - kr.left) / olcek, (k.bottom - kr.top) / olcek);
      if (v.length) out.dom.push({ metin: metin.slice(0, 30), sec: yol(el), neden: v.join(','), kutu: [Math.round((k.left - kr.left) / olcek), Math.round((k.top - kr.top) / olcek), Math.round((k.right - kr.left) / olcek), Math.round((k.bottom - kr.top) / olcek)] });
    }
  }
  const T = window.__T2;
  if (T) {
    const gor = new Map();
    for (const k of T.kayit) { if (!k.bagli || !/[\p{L}\p{N}]/u.test(k.metin)) continue; out.tuvalSayi++; const v = ihlal(k.x0, k.y - k.px, k.x1, k.y); if (v.length) gor.set(k.metin + v.join(), { metin: k.metin.slice(0, 30), neden: v.join(','), kutu: [Math.round(k.x0), Math.round(k.y - k.px), Math.round(k.x1), Math.round(k.y)] }); }
    out.tuval = [...gor.values()];
  }
  out.dom = out.dom.slice(0, 20); out.tuval = out.tuval.slice(0, 20);
  return out;
}

/** Tuvale yazilan metinlerin punto tabani (TUVAL_KANCA gerekir). */
function TUVAL_PUNTO(esik) {
  const T = window.__T2; if (!T) return { kotu: [], toplam: 0 };
  const gor = new Map(); let toplam = 0;
  for (const k of T.kayit) { if (!/[\p{L}\p{N}]/u.test(k.metin)) continue; toplam++; const px = k.px != null ? k.px : k.hamPx; if (px < esik - 0.01) gor.set(k.metin, { metin: k.metin.slice(0, 30), px: Math.round(px * 10) / 10, bagli: k.bagli }); }
  return { kotu: [...gor.values()].slice(0, 20), toplam };
}

module.exports = { KANCA, SOZDE, PUNTO, KESIK, TASMA, ATES, TUVAL_KANCA, GUVENLI, TUVAL_PUNTO };
