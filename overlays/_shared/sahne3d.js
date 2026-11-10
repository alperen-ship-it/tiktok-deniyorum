/**
 * sahne3d.js — halay ve "Düdüklü" icin ORTAK 3D CEKIRDEK (PLAN-DIKEY bolum G).
 *
 *   import { Sahne3D, THREE } from './_shared/sahne3d.js';
 *   const s = Sahne3D.kur({ kap: document.getElementById('kok'), tema: 'meydan', enCokFigur: 150 });
 *
 * Bu dosya bir ES modulu: <script type="module"> ile yuklenir, file:// ile CALISMAZ
 * (3D sayfalari sadece kopru uzerinden acilir). Three.js ./vendor/ altinda, ag yok.
 *
 * Tasarim kurallari (kontrol listesi):
 *  - Govde / kafa / basliklar / kollar / golge birer InstancedMesh; Lambert; iki isik;
 *    gercek golge yok, post-processing yok.
 *  - Render en fazla 30 fps (dusuk katmanda 20). Her animasyon SAAT'ten (zaman tabanli),
 *    kare sayisindan degil. Kare basina bellek ayirma YOK (onceden ayrilmis tipli diziler).
 *  - Ust katman: 3D tuvalin tam ustunde seffaf bir Canvas2D. Avatar diski duz <img>'den
 *    (crossOrigin YOK), isimler SADECE fillText ile. Cekirdegin serbest metin kabul eden
 *    hicbir fonksiyonu yoktur: etiket.ayarla'ya giren `ad` oyunun verdigi gorunen ad'dir
 *    (izleyici sohbet metni degil) ve ekrana yalnizca fillText ile gider.
 *  - A2 yasak bolgelere (y<240, x<60, x>1020, y>1760, x<540 & y>1250) hicbir sey cizilmez.
 *  - Kalite basamaklari tam > orta > dusuk > yok (G4); 'kalite' olayi; ?3d=0, ?kalite=.
 *
 * Test kancasi: s.olcum()  ve  s.deneme (yavas kare enjekte et, baglam kaybi, GPU ms).
 */
import * as THREE from './vendor/three.module.min.js';

const W = 1080, H = 1920;                       // tasarim pikseli
const TAVAN = { ust: 240, sol: 60, sag: 1020, alt: 1760, komX: 540, komY: 1250 };   // A2
const FONT = '"Outfit", system-ui, "Segoe UI", Arial, sans-serif';
const YAZILIM_RE = /swiftshader|llvmpipe|softpipe|software|basic render|microsoft basic|mesa offscreen|lavapipe/i;

// ------------------------------------------------------------------ kucuk yardimcilar
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
function hash(str) {                              // FNV-1a, 32 bit
  const s = String(str);
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
  return h >>> 0;
}
function easeOutBack(u) { const c = 1.70158; const x = u - 1; return 1 + (c + 1) * x * x * x + c * x * x; }
function easeInOut(u) { return u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2; }

/** Izinli bolge: dikdortgen hicbir yasak bolgeye (A2) girmiyorsa true. */
function izinli(x0, y0, x1, y1) {
  if (y0 < TAVAN.ust || x0 < TAVAN.sol || x1 > TAVAN.sag || y1 > TAVAN.alt) return false;
  if (x0 < TAVAN.komX && y1 > TAVAN.komY) return false;
  return true;
}

/** Geometrileri tek geometride birlestir (BufferGeometryUtils build icinde yok). */
function birlestir(liste) {
  let vs = 0, is = 0;
  for (const g of liste) { vs += g.attributes.position.count; is += g.index ? g.index.count : g.attributes.position.count; }
  const pos = new Float32Array(vs * 3), nor = new Float32Array(vs * 3), idx = new Uint32Array(is);
  let vo = 0, io = 0;
  for (const g of liste) {
    const p = g.attributes.position, n = g.attributes.normal;
    pos.set(p.array, vo * 3); nor.set(n.array, vo * 3);
    if (g.index) for (let i = 0; i < g.index.count; i++) idx[io++] = g.index.array[i] + vo;
    else for (let i = 0; i < p.count; i++) idx[io++] = vo + i;
    vo += p.count;
  }
  const o = new THREE.BufferGeometry();
  o.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  o.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  o.setIndex(new THREE.BufferAttribute(idx, 1));
  return o;
}
function uvSil(g) { g.deleteAttribute('uv'); return g; }

// ------------------------------------------------------------------ geometri fabrikalari
const GOVDE_R = 0.19, GOVDE_L = 0.24;             // kapsul: toplam boy 0.62
const KAFA_R = 0.235;
const KOL_R = 0.062, KOL_L = 0.26;                // kol: omuzdan ele 0.384
const KOL_BOY = KOL_L + 2 * KOL_R;
const Y_GOVDE = 0.33, Y_KAFA = 0.85, Y_OMUZ = 0.52, X_OMUZ = 0.205;
const FIGUR_BOY = 1.12;

function govdeGeo() { return uvSil(new THREE.CapsuleGeometry(GOVDE_R, GOVDE_L, 2, 8)); }
function kafaGeo() { return uvSil(new THREE.SphereGeometry(KAFA_R, 9, 6)); }
function kolGeo() {
  const g = uvSil(new THREE.CapsuleGeometry(KOL_R, KOL_L, 1, 6));
  g.translate(0, -(KOL_L / 2 + KOL_R), 0);        // pivot omuzda, kol asagi sarkar
  return g;
}
function kasketGeo() {
  const kubbe = uvSil(new THREE.SphereGeometry(0.255, 10, 3, 0, Math.PI * 2, 0, Math.PI / 2));
  kubbe.scale(1, 0.62, 1); kubbe.translate(0, 0.055, 0);
  const siper = uvSil(new THREE.CylinderGeometry(0.19, 0.19, 0.022, 6, 1, false, 0, Math.PI));
  siper.rotateY(-Math.PI / 2); siper.rotateX(0.18); siper.translate(0, 0.09, 0.15);
  return birlestir([kubbe, siper]);
}
function yazmaGeo() {
  const ort = uvSil(new THREE.SphereGeometry(0.262, 10, 5, 0, Math.PI * 2, 0, Math.PI * 0.66));
  ort.translate(0, 0.0, -0.012);
  const dugum = uvSil(new THREE.SphereGeometry(0.075, 6, 4)); dugum.translate(0, -0.035, -0.255);
  const uc = uvSil(new THREE.ConeGeometry(0.07, 0.17, 5)); uc.rotateX(Math.PI); uc.translate(0, -0.14, -0.27);
  return birlestir([ort, dugum, uc]);
}
function golgeGeo() { const g = uvSil(new THREE.CircleGeometry(0.34, 14)); g.rotateX(-Math.PI / 2); return g; }
function mendilGeo() { const g = uvSil(new THREE.PlaneGeometry(0.36, 0.3, 1, 1)); return g; }
function haleGeo() { const g = uvSil(new THREE.RingGeometry(0.34, 0.5, 28)); g.rotateX(-Math.PI / 2); return g; }

// ------------------------------------------------------------------ rotasyon yardimcilari (dizi tabanli, bellek ayirmaz)
// 3x3 matrisler satir-oncelikli Float64Array(9)
function rotYZ(m, yaw, roll) {                    // Ry(yaw) * Rz(roll)
  const cy = Math.cos(yaw), sy = Math.sin(yaw), c = Math.cos(roll), s = Math.sin(roll);
  m[0] = cy * c; m[1] = -cy * s; m[2] = sy;
  m[3] = s;      m[4] = c;       m[5] = 0;
  m[6] = -sy * c; m[7] = sy * s; m[8] = cy;
}
function rotXZ(m, pit, rol) {                     // Rx(pit) * Rz(rol)
  const cp = Math.cos(pit), sp = Math.sin(pit), c = Math.cos(rol), s = Math.sin(rol);
  m[0] = c;       m[1] = -s;      m[2] = 0;
  m[3] = cp * s;  m[4] = cp * c;  m[5] = -sp;
  m[6] = sp * s;  m[7] = sp * c;  m[8] = cp;
}
function carp(o, a, b) {
  for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++)
    o[r * 3 + c] = a[r * 3] * b[c] + a[r * 3 + 1] * b[3 + c] + a[r * 3 + 2] * b[6 + c];
}
function yaz(arr, o, m, sx, sy, sz, px, py, pz) { // sutun-oncelikli 4x4
  arr[o] = m[0] * sx; arr[o + 1] = m[3] * sx; arr[o + 2] = m[6] * sx; arr[o + 3] = 0;
  arr[o + 4] = m[1] * sy; arr[o + 5] = m[4] * sy; arr[o + 6] = m[7] * sy; arr[o + 7] = 0;
  arr[o + 8] = m[2] * sz; arr[o + 9] = m[5] * sz; arr[o + 10] = m[8] * sz; arr[o + 11] = 0;
  arr[o + 12] = px; arr[o + 13] = py; arr[o + 14] = pz; arr[o + 15] = 1;
}
const SIFIR = new Float32Array(16);               // olcegi 0 matris (gizli)

// ------------------------------------------------------------------ kilim / zemin dokulari (bir kez cizilir)
function kilimDokusu() {
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const x = c.getContext('2d');
  x.clearRect(0, 0, 128, 128);
  const elmas = (r, renk) => { x.beginPath(); x.moveTo(64, 64 - r); x.lineTo(64 + r, 64); x.lineTo(64, 64 + r); x.lineTo(64 - r, 64); x.closePath(); x.fillStyle = renk; x.fill(); };
  elmas(62, '#ffffff'); elmas(50, '#3a1d2e'); elmas(42, '#ffffff'); elmas(30, '#3a1d2e'); elmas(22, '#ffffff'); elmas(11, '#3a1d2e');
  // kanca (kilim "elibelinde" ucgenleri)
  x.fillStyle = '#3a1d2e';
  for (const [dx, dy] of [[0, -1], [1, 0], [0, 1], [-1, 0]]) {
    x.beginPath(); x.moveTo(64 + dx * 62, 64 + dy * 62);
    x.lineTo(64 + dx * 62 + (dy ? 7 : 0) + (dx ? 0 : 0), 64 + dy * 62 + (dx ? 7 : 0));
    x.lineTo(64 + dx * 62 - (dy ? 7 : 0), 64 + dy * 62 - (dx ? 7 : 0)); x.closePath(); x.fill();
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 1; t.generateMipmaps = true;
  return t;
}
function gokDokusu(tema) {
  const c = document.createElement('canvas'); c.width = 4; c.height = 256;
  const x = c.getContext('2d');
  const g = x.createLinearGradient(0, 0, 0, 256);
  if (tema === 'ocakbasi') {
    g.addColorStop(0, '#120e30'); g.addColorStop(0.3, '#241a52'); g.addColorStop(0.5, '#3a2468'); g.addColorStop(0.72, '#7a3a76'); g.addColorStop(0.9, '#d8604a'); g.addColorStop(1, '#f08a3c');
  } else {
    g.addColorStop(0, '#1b1446'); g.addColorStop(0.3, '#2c1e68'); g.addColorStop(0.5, '#4a2a7c'); g.addColorStop(0.72, '#9a4486'); g.addColorStop(0.9, '#e0705c'); g.addColorStop(1, '#f5a54b');
  }
  x.fillStyle = g; x.fillRect(0, 0, 4, 256);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.generateMipmaps = false; t.minFilter = THREE.LinearFilter;
  return t;
}
const ZEMIN_R = 24;                               // zemin diski yaricapi (dunya birimi)
function zeminCiz(ctx, N, tema, halkalar, hearth) {
  const c = N / 2, k = c / ZEMIN_R;               // k: piksel / dunya birimi
  ctx.clearRect(0, 0, N, N);
  // temel: sicak toprak (merkez) -> erik moru -> ufuk rengi (kenar)
  let g = ctx.createRadialGradient(c, c, 0, c, c, c);
  if (tema === 'ocakbasi') {
    g.addColorStop(0, '#5a3a3a'); g.addColorStop(0.25, '#4a3047'); g.addColorStop(0.6, '#3c2a5a'); g.addColorStop(0.9, '#6a3a66'); g.addColorStop(1, '#c8553d');
  } else {
    g.addColorStop(0, '#a47a52'); g.addColorStop(0.3, '#8d6350'); g.addColorStop(0.62, '#6d4a68'); g.addColorStop(0.9, '#8a4a76'); g.addColorStop(1, '#e0705c');
  }
  ctx.fillStyle = g; ctx.fillRect(0, 0, N, N);
  // dosemeli meydan: ince esmerkezli ve isinsal derzler
  ctx.strokeStyle = 'rgba(40,20,40,.28)'; ctx.lineWidth = 1.2;
  for (let r = 1; r < 16; r += 1) { ctx.beginPath(); ctx.arc(c, c, r * k, 0, Math.PI * 2); ctx.stroke(); }
  for (let a = 0; a < 48; a++) {
    const t = a / 48 * Math.PI * 2; ctx.beginPath(); ctx.moveTo(c + Math.cos(t) * 1 * k, c + Math.sin(t) * 1 * k);
    ctx.lineTo(c + Math.cos(t) * 15 * k, c + Math.sin(t) * 15 * k); ctx.stroke();
  }
  // fener rengi zemin isigi: her halkanin altinda altin seritler
  for (const r of halkalar) {
    const r0 = Math.max(0.1, (r - 0.95) * k), r1 = (r + 0.95) * k;
    const gg = ctx.createRadialGradient(c, c, r0, c, c, r1);
    gg.addColorStop(0, 'rgba(255,200,90,0)'); gg.addColorStop(0.5, 'rgba(255,205,100,.55)'); gg.addColorStop(1, 'rgba(255,200,90,0)');
    ctx.fillStyle = gg; ctx.beginPath(); ctx.arc(c, c, r1, 0, Math.PI * 2); ctx.fill();
  }
  if (tema === 'ocakbasi' || hearth) {            // ocak: kul + sicak parilti
    const gh = ctx.createRadialGradient(c, c, 0, c, c, 4.6 * k);
    gh.addColorStop(0, 'rgba(255,150,50,.85)'); gh.addColorStop(0.35, 'rgba(255,110,40,.45)'); gh.addColorStop(1, 'rgba(255,90,30,0)');
    ctx.fillStyle = gh; ctx.beginPath(); ctx.arc(c, c, 4.6 * k, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(30,22,28,.85)'; ctx.beginPath(); ctx.arc(c, c, 1.25 * k, 0, Math.PI * 2); ctx.fill();
  }
}

// ------------------------------------------------------------------ ana
const Sahne3D = {
  /** Yerel destek sorgusu (sayfa kur'dan once bakmak isterse). */
  destek() {
    const r = { webgl: false, yazilim: false, render: '' };
    try {
      const cv = document.createElement('canvas');
      const gl = cv.getContext('webgl2');
      if (gl) {
        r.webgl = true;
        const e = gl.getExtension('WEBGL_debug_renderer_info');
        r.render = String(e ? gl.getParameter(e.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER));
        r.yazilim = YAZILIM_RE.test(r.render);
        const l = gl.getExtension('WEBGL_lose_context'); if (l) l.loseContext();
      }
    } catch (e) { /* yok */ }
    return r;
  },

  kur(secenek) {
    const sec = secenek || {};
    const kap = sec.kap;
    if (!kap) throw new Error('Sahne3D.kur: kap gerekli');
    const q = new URLSearchParams(location.search);
    const tema = sec.tema === 'ocakbasi' ? 'ocakbasi' : 'meydan';
    const CAP = Math.max(1, Math.min(300, sec.enCokFigur | 0 || 150));
    const SLOT = CAP + 16;                        // olum animasyonundaki figurler icin pay
    const zorlaKalite = ['tam', 'orta', 'dusuk'].includes(q.get('kalite')) ? q.get('kalite')
      : (['tam', 'orta', 'dusuk'].includes(sec.kalite) ? sec.kalite : null);
    const kilitIstek = q.get('kilit') === '1' || sec.kilit === true;   // ?kalite=..&kilit=1: basamak sabitlenir
    const kapali3d = q.get('3d') === '0' || sec.kapali === true;

    // ---- olay merkezi
    const dinleyen = Object.create(null);
    function dinle(ad, fn) { (dinleyen[ad] || (dinleyen[ad] = [])).push(fn); return () => { const l = dinleyen[ad]; const i = l.indexOf(fn); if (i >= 0) l.splice(i, 1); }; }
    function yay(ad, detay) {
      const l = dinleyen[ad]; if (l) for (const fn of l.slice()) { try { fn(detay); } catch (e) { console.error(e); } }
      try { kap.dispatchEvent(new CustomEvent(ad, { detail: detay, bubbles: true })); } catch (e) { /* yok */ }
    }

    // ---- yok sahne: ?3d=0 / WebGL yok
    const s = { dinle, tuval: null, ustTuval: null, sahne: null, kamera: null };
    window.__sahne3d = s;                         // test kancasi: en son kurulan sahne
    let kalite = 'yok', yokSebep = '';
    function kaliteDurumu(k, sebep, onceki) {
      kap.setAttribute('data-sahne3d', k);
      kap.classList.toggle('sahne3d-yok', k === 'yok');
      return { kalite: k, onceki: onceki || null, sebep: sebep || '', toplam: 0, cizilen: 0, gizlenen: 0 };
    }
    function yokSahne(sebep) {
      kalite = 'yok'; yokSebep = sebep;
      const bos = () => {};
      s.figur = { ekle: () => false, cikar: bos, yerlestir: bos, hareket: bos, isaret: bos, sayi: () => 0, liste: () => [] };
      s.halka = { ayarla: bos, hiz: bos };
      s.saat = { bagla: bos, tempo: bos, get vurus() { return 0; } };
      s.etiket = { ayarla: bos, enFazla: 0 };
      s.ekran = (kid, o) => { const r = o || {}; r.x = 0; r.y = 0; r.olcek = 1; r.gorunur = false; return r; };
      s.kadrajla = bos; s.kaliteSifirla = bos; s.yokEt = bos;
      s.olcum = () => ({ kalite: 'yok', figur: 0, cizimCagrisi: 0, ucgen: 0, jsMs: 0, jsMsP95: 0, kareMs: 0, kareMsP95: 0, pikselOrani: 0, webgl: '', yazilim: false, cizilen: 0, gizli: 0, sebep });
      s.deneme = { sahteKare: bos, baglamKaybet: bos, baglamGeriGetir: bos, gpuMs: () => 0 };
      s.render = ''; s.yazilim = false;
      Object.defineProperty(s, 'kalite', { get: () => 'yok', set: bos, enumerable: true, configurable: true });
      const d = kaliteDurumu('yok', sebep, null);
      setTimeout(() => yay('kalite', d), 0);      // sayfa dinleyici ekleyebilsin diye ertele
      return s;
    }
    if (kapali3d) return yokSahne('3d=0');

    // ---- WebGL: once yazilim mi diye bak (antialias kararı icin)
    const bilgi = Sahne3D.destek();
    if (!bilgi.webgl) return yokSahne('webgl-yok');
    const yazilim = bilgi.yazilim;
    s.render = bilgi.render; s.yazilim = yazilim;

    // ---- tuvaller
    if (getComputedStyle(kap).position === 'static') kap.style.position = 'relative';
    const cv = document.createElement('canvas');
    cv.id = 'sahne3d-tuval';
    cv.setAttribute('aria-hidden', 'true');
    cv.style.cssText = 'position:absolute;left:0;top:0;width:' + W + 'px;height:' + H + 'px;z-index:0;pointer-events:none;display:block';
    const ov = document.createElement('canvas');
    ov.id = 'sahne3d-ust'; ov.width = W; ov.height = H;
    ov.setAttribute('aria-hidden', 'true');
    ov.style.cssText = 'position:absolute;left:0;top:0;width:' + W + 'px;height:' + H + 'px;z-index:0;pointer-events:none;display:block';
    kap.insertBefore(ov, kap.firstChild); kap.insertBefore(cv, kap.firstChild);
    s.tuval = cv; s.ustTuval = ov;
    const ctx = ov.getContext('2d', { alpha: true });

    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas: cv, antialias: !yazilim, alpha: false, powerPreference: 'high-performance', stencil: false, depth: true });
    } catch (e) { cv.remove(); ov.remove(); return yokSahne('webgl-kurulamadi'); }
    if (!renderer.capabilities.isWebGL2) { renderer.dispose(); cv.remove(); ov.remove(); return yokSahne('webgl2-yok'); }
    renderer.setClearColor(0x1b1446, 1);
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    // ---- sahne, kamera, isiklar
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(30, W / H, 1, 260);
    scene.add(camera);
    s.sahne = scene; s.kamera = camera;
    const hemi = new THREE.HemisphereLight(tema === 'ocakbasi' ? 0xd8c8ff : 0xffe8cc, tema === 'ocakbasi' ? 0x4a3560 : 0x7a5070, 2.0);
    const gunes = new THREE.DirectionalLight(tema === 'ocakbasi' ? 0xffc890 : 0xffd9a8, 2.2);
    gunes.position.set(-6, 14, 9);
    scene.add(hemi, gunes);

    // ---- kamera kadrajlama
    const vp = new Float64Array(12);              // VP'nin 0,1,3. satirlari (satir-oncelikli)
    let p11 = 1;
    function vpGuncelle() {
      camera.updateMatrixWorld(true);
      const m = new THREE.Matrix4().multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse).elements;
      const sat = [0, 1, 3];
      for (let i = 0; i < 3; i++) for (let c = 0; c < 4; c++) vp[i * 4 + c] = m[c * 4 + sat[i]];
      p11 = camera.projectionMatrix.elements[5];
    }
    let kadrajKutu = { x: 60, y: 488, w: 960, h: 672 };
    function kutuOku() {
      try { const k = window.TT && window.TT.KUTU && window.TT.KUTU.sahne; if (k && k.w > 0) return { x: k.x, y: k.y, w: k.w, h: k.h }; } catch (e) { /* sabit */ }
      return { x: 60, y: 488, w: 960, h: 672 };
    }
    let garlandYenile = null;
    /** Zemin halkasinin (yaricap) SAHNE kutusuna sigdigi sabit kamera. egim: yerden derece. */
    function kadrajla(kutu, yaricap, egim) {
      const b = kutu || kutuOku(); kadrajKutu = b;
      const R = Math.max(1, yaricap || 6.8), th = (egim || 38) * Math.PI / 180;
      const fov = camera.fov * Math.PI / 180;
      const ppuH = b.w / (2 * R + 0.5);
      const ppuV = b.h / (2 * R * Math.sin(th) + FIGUR_BOY * Math.cos(th));
      const ppu = Math.min(ppuH, ppuV);
      const d = H / (2 * ppu * Math.tan(fov / 2));
      camera.position.set(0, d * Math.sin(th), d * Math.cos(th));
      camera.lookAt(0, 0, 0);
      // yer merkezi: arka figurun basi kutunun ustune, on ayak altina yakin
      const yuk = (R * Math.sin(th) + FIGUR_BOY * Math.cos(th)) * ppu;
      const cy = clamp(b.y + yuk + (b.h - (R * Math.sin(th) * 2 + FIGUR_BOY * Math.cos(th)) * ppu) / 2, b.y, b.y + b.h);
      const cx = b.x + b.w / 2;
      camera.setViewOffset(W, H, W / 2 - cx, H / 2 - cy, W, H);
      camera.updateProjectionMatrix();
      vpGuncelle();
      if (garlandYenile) garlandYenile();
    }
    s.kadrajla = kadrajla;

    // ======================================================================
    // SABIT DEKOR: gok, zemin, kilim girlandi, fenerler (+ ocakbasi tasi)
    // ======================================================================
    const gokTex = gokDokusu(tema);
    const gok = new THREE.Mesh(new THREE.PlaneGeometry(260, 40), new THREE.MeshBasicMaterial({ map: gokTex, depthWrite: false, fog: false }));
    gok.position.set(0, 18, -ZEMIN_R - 3); scene.add(gok); gok.renderOrder = -2; gok.frustumCulled = false;

    const zemCv = document.createElement('canvas'); zemCv.width = zemCv.height = 512;
    const zemCtx = zemCv.getContext('2d');
    const zemTex = new THREE.CanvasTexture(zemCv); zemTex.colorSpace = THREE.SRGBColorSpace; zemTex.anisotropy = 1; zemTex.generateMipmaps = false; zemTex.minFilter = THREE.LinearFilter;
    const zemGeo = new THREE.CircleGeometry(ZEMIN_R, 64); zemGeo.rotateX(-Math.PI / 2);
    const zemin = new THREE.Mesh(zemGeo, new THREE.MeshBasicMaterial({ map: zemTex }));
    zemin.renderOrder = -1; scene.add(zemin);

    // girland: kameraya bagli, ekranin ust bandinda (y 100..235) — sadece arka plan
    const garland = new THREE.Group(); camera.add(garland);
    const kilimTex = kilimDokusu();
    const ELMAS_N = 17;
    const elmas = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: kilimTex, alphaTest: 0.5, side: THREE.DoubleSide }), ELMAS_N);
    const IP_N = 72;
    const ip = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial({ color: 0x4a2a30 }), IP_N);
    const ampul = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffe29a }), ELMAS_N);
    elmas.frustumCulled = ip.frustumCulled = ampul.frustumCulled = false;
    garland.add(ip, elmas, ampul);
    const KILIM_RENK = [0xd8344a, 0xf5b92e, 0x20b2b0, 0xf6ead0];
    {
      const c = new THREE.Color();
      for (let i = 0; i < ELMAS_N; i++) { c.setHex(KILIM_RENK[i % 4]); elmas.setColorAt(i, c); }
    }
    const _gm = new THREE.Matrix4(), _gq = new THREE.Quaternion(), _gv = new THREE.Vector3(), _gs = new THREE.Vector3(), _ge = new THREE.Euler();
    garlandYenile = function () {                 // kadraj degisince bir kez
      const D = 38, th = Math.tan(camera.fov * Math.PI / 360);
      const ppuD = H / (2 * D * th);
      const off = camera.view ? camera.view : { offsetX: 0, offsetY: 0 };
      const px2x = (px) => (px + off.offsetX - W / 2) / ppuD;
      const py2y = (py) => -(py + off.offsetY - H / 2) / ppuD;
      const yAt = (u) => 112 + 84 * Math.sin(Math.PI * ((u * 3) % 1));
      // iplik
      const N = IP_N;
      let ox = px2x(-30), oy = py2y(yAt(0));
      for (let i = 0; i < N; i++) {
        const u1 = (i + 1) / N, px = -30 + u1 * (W + 60);
        const nx = px2x(px), ny = py2y(yAt(u1));
        const dx = nx - ox, dy = ny - oy, len = Math.hypot(dx, dy);
        _gv.set((ox + nx) / 2, (oy + ny) / 2, -D); _gq.setFromEuler(_ge.set(0, 0, Math.atan2(dy, dx)));
        _gs.set(len * 1.04, 3.2 / ppuD, 0.05);
        ip.setMatrixAt(i, _gm.compose(_gv, _gq, _gs)); ox = nx; oy = ny;
      }
      ip.instanceMatrix.needsUpdate = true;
      const bw = 78 / ppuD;
      for (let i = 0; i < ELMAS_N; i++) {
        const u = (i + 0.5) / ELMAS_N, px = -30 + u * (W + 60), py = yAt(u) + 52;
        _gv.set(px2x(px), py2y(py), -D);
        _gq.identity(); _gs.set(bw, bw, 1);
        elmas.setMatrixAt(i, _gm.compose(_gv, _gq, _gs));
        _gv.set(px2x(px + (W + 60) / ELMAS_N / 2), py2y(yAt(u + 0.5 / ELMAS_N) + 2), -D + 0.2);
        const r = 8 / ppuD; _gq.identity(); _gs.set(r, r, r);
        ampul.setMatrixAt(i, _gm.compose(_gv, _gq, _gs));
      }
      elmas.instanceMatrix.needsUpdate = true; ampul.instanceMatrix.needsUpdate = true;
      elmas.instanceColor.needsUpdate = true;
    };

    // fenerler (arka koseler) — direk + isik topu, 2 cizim cagrisi
    const FENER_YER = tema === 'ocakbasi' ? [[-6.2, -6.2], [6.2, -6.2], [-9, -1.5], [9, -1.5]] : [[-6.4, -6.4], [6.4, -6.4], [-3.4, -9.6], [3.4, -9.6]];
    const direk = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.07, 0.09, 2.6, 7), new THREE.MeshLambertMaterial({ color: 0x4a3326 }), FENER_YER.length);
    const fener = new THREE.InstancedMesh(new THREE.SphereGeometry(0.34, 10, 8), new THREE.MeshBasicMaterial({ color: 0xffc66a }), FENER_YER.length);
    direk.frustumCulled = fener.frustumCulled = false;
    FENER_YER.forEach((p, i) => {
      direk.setMatrixAt(i, _gm.compose(_gv.set(p[0], 1.3, p[1]), _gq.identity(), _gs.set(1, 1, 1)));
      fener.setMatrixAt(i, _gm.compose(_gv.set(p[0], 2.75, p[1]), _gq.identity(), _gs.set(1, 1.25, 1)));
    });
    scene.add(direk, fener);
    if (tema === 'ocakbasi') {                    // tas ocak: 14 tas halka halinde
      const tas = new THREE.InstancedMesh(new THREE.DodecahedronGeometry(0.3, 0), new THREE.MeshLambertMaterial({ color: 0x8a8590 }), 14);
      tas.frustumCulled = false;
      for (let i = 0; i < 14; i++) {
        const a = i / 14 * Math.PI * 2, rr = 1.25;
        tas.setMatrixAt(i, _gm.compose(_gv.set(Math.cos(a) * rr, 0.2, Math.sin(a) * rr), _gq.setFromEuler(_ge.set(0.3 * i, 0.7 * i, 0)), _gs.set(1, 0.75, 1)));
      }
      scene.add(tas);
    }

    // ======================================================================
    // FIGUR SISTEMI (struct-of-arrays, sabit kapasite)
    // ======================================================================
    const mGovde = new THREE.MeshLambertMaterial({});
    const meshGovde = new THREE.InstancedMesh(govdeGeo(), mGovde, SLOT);
    const meshKafa = new THREE.InstancedMesh(kafaGeo(), new THREE.MeshLambertMaterial({}), SLOT);
    const meshKasket = new THREE.InstancedMesh(kasketGeo(), new THREE.MeshLambertMaterial({}), SLOT);
    const meshYazma = new THREE.InstancedMesh(yazmaGeo(), new THREE.MeshLambertMaterial({}), SLOT);
    const meshKol = new THREE.InstancedMesh(kolGeo(), new THREE.MeshLambertMaterial({}), SLOT * 2);
    const meshMendil = new THREE.InstancedMesh(mendilGeo(), new THREE.MeshLambertMaterial({ side: THREE.DoubleSide, emissive: 0x555555 }), SLOT);
    const meshGolge = new THREE.InstancedMesh(golgeGeo(), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.32, depthWrite: false }), SLOT);
    const HALE_N = 6;
    const meshHale = new THREE.InstancedMesh(haleGeo(), new THREE.MeshBasicMaterial({ color: 0xffd25a, transparent: true, opacity: 0.9, depthWrite: false }), HALE_N);
    const ortakMeshler = [meshGovde, meshKafa, meshKasket, meshYazma, meshKol, meshMendil, meshGolge, meshHale];
    for (const m of ortakMeshler) {
      m.frustumCulled = false; m.count = 0;
      m.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      if (m !== meshGolge && m !== meshHale) m.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(m.instanceMatrix.count * 3), 3);
      scene.add(m);
    }
    meshGolge.renderOrder = 1; meshHale.renderOrder = 2;
    { const a = meshMendil.instanceColor.array; a.fill(1); }

    // slot dizileri
    const kidler = new Array(SLOT).fill(null);
    const slotOf = new Map();
    let nSlot = 0;
    const px = new Float32Array(SLOT), pz = new Float32Array(SLOT);              // simdiki dunya konumu
    const fx = new Float32Array(SLOT), fz = new Float32Array(SLOT);              // hareket baslangici
    const mod = new Uint8Array(SLOT);                                            // 0 halka, 1 serbest
    const tx = new Float32Array(SLOT), tz = new Float32Array(SLOT), tYon = new Float32Array(SLOT);
    const serbestYon = new Uint8Array(SLOT);                                     // 1: yon verildi
    const halkaNo = new Int16Array(SLOT), siraNo = new Int16Array(SLOT);
    const gez0 = new Float64Array(SLOT), gezS = new Float64Array(SLOT);          // konum gecisi (sn)
    const dogum = new Float64Array(SLOT), olum = new Float64Array(SLOT);
    const hrkTip = new Uint8Array(SLOT), hrk0 = new Float64Array(SLOT), hrkS = new Float64Array(SLOT);
    const isaretB = new Uint8Array(SLOT);                                        // 1 hale, 2 mendil
    const faz = new Float32Array(SLOT);
    const bot = new Uint8Array(SLOT), baslikT = new Uint8Array(SLOT);            // 0 yok 1 kasket 2 yazma
    const renkA = new Float32Array(SLOT * 3), deriA = new Float32Array(SLOT * 3), baslikA = new Float32Array(SLOT * 3);
    const baskX = new Float32Array(SLOT), baskY = new Float32Array(SLOT), baskZ = new Float32Array(SLOT), baskOl = new Float32Array(SLOT), baskD = new Float32Array(SLOT), baskVis = new Uint8Array(SLOT);
    // etiket alanlari
    const etOnc = new Float32Array(SLOT), etAltin = new Uint8Array(SLOT);
    const etAd = new Array(SLOT).fill(null), etAv = new Array(SLOT).fill(null), etDuz = new Array(SLOT).fill(null);
    const HRK = { adim: 1, zipla: 2, kollar: 3, at: 4, mendil: 5 };
    const HRK_SURE = { 1: 1.6, 2: 0.85, 3: 1.8, 4: 0.9, 5: 2.2 };

    // cizilecek liste (kalite basamagina gore) ve baslik sikistirmasi
    const ciz = new Int32Array(SLOT); let nCiz = 0;
    const kIdx = new Int32Array(SLOT), yIdx = new Int32Array(SLOT);
    let nKasket = 0, nYazma = 0;
    let cizKirli = true;

    // basamak ayarlari
    const TIER = {
      tam:   { pr: 1.0,  figur: 9999, golge: true,  fps: 30 },
      orta:  { pr: 0.66, figur: 9999, golge: false, fps: 30 },
      dusuk: { pr: 0.5,  figur: 60,   golge: false, fps: 20 },
    };
    let tier = TIER.tam;

    const _c = new THREE.Color();
    const SKIN = [0xf2c9a0, 0xe3b088, 0xc98d5f, 0xf6d6b8, 0xd6a37a];
    const KASKET_R = [0x3d3a44, 0x5a4a3a, 0x2f3a52, 0x6a5d4d, 0x4a4a4a];
    const YAZMA_R = [0xf5f0e6, 0xf2a7c3, 0x4ec2c0, 0xf7c64a, 0xe9604f];
    function renkCoz(v) {
      try {
        if (typeof v === 'number') _c.setHex(v);
        else _c.set(typeof v === 'string' ? v : '#b9a0ff');
      } catch (e) { _c.set('#b9a0ff'); }
      return _c;
    }

    // ---- halka tablosu
    const MAXH = 8;
    let nHalka = 0;
    const hR = new Float32Array(MAXH), hKap = new Int16Array(MAXH), hYon = new Float32Array(MAXH), hAci = new Float32Array(MAXH);
    let halkaHiz = 1;
    const HALKA_HIZ = 0.5;                        // dunya birimi / sn (cizgisel)
    function zeminYenile() {
      const lst = []; for (let i = 0; i < nHalka; i++) lst.push(hR[i]);
      zeminCiz(zemCtx, 512, tema, lst, tema === 'ocakbasi');
      zemTex.needsUpdate = true;
    }

    // ---- saat (vurus)
    let saatFn = null, vurus = 0, tempoBpm = 108, saatSon = -1e9, saatBpm = 108;
    function saatGuncelle(now, dt) {
      if (saatFn && now - saatSon > 120) {
        saatSon = now;
        let m = null; try { m = saatFn(); } catch (e) { m = null; }
        if (m != null) {
          let hedef = null, bpm = 0;
          if (typeof m === 'number') hedef = m; else { if (m.adim != null) hedef = m.adim / 2; if (m.bpm) bpm = m.bpm; }
          saatBpm = bpm > 20 ? bpm : tempoBpm;
          if (hedef != null && isFinite(hedef)) {
            let fark = ((hedef - vurus) % 4 + 4) % 4; if (fark > 2) fark -= 4;
            vurus += fark * Math.min(1, 0.35);
          }
        } else saatBpm = tempoBpm;
      } else if (!saatFn) saatBpm = tempoBpm;
      vurus += dt * saatBpm / 60;
    }

    // ---- slot yonetimi
    function slotSil(i) {                         // swap-remove
      const son = nSlot - 1;
      slotOf.delete(kidler[i]);
      if (i !== son) {
        const k = kidler[son];
        kidler[i] = k; slotOf.set(k, i);
        px[i] = px[son]; pz[i] = pz[son]; fx[i] = fx[son]; fz[i] = fz[son]; mod[i] = mod[son]; tx[i] = tx[son]; tz[i] = tz[son]; tYon[i] = tYon[son]; serbestYon[i] = serbestYon[son];
        halkaNo[i] = halkaNo[son]; siraNo[i] = siraNo[son]; gez0[i] = gez0[son]; gezS[i] = gezS[son]; dogum[i] = dogum[son]; olum[i] = olum[son];
        hrkTip[i] = hrkTip[son]; hrk0[i] = hrk0[son]; hrkS[i] = hrkS[son]; isaretB[i] = isaretB[son]; faz[i] = faz[son]; bot[i] = bot[son]; baslikT[i] = baslikT[son];
        for (let c = 0; c < 3; c++) { renkA[i * 3 + c] = renkA[son * 3 + c]; deriA[i * 3 + c] = deriA[son * 3 + c]; baslikA[i * 3 + c] = baslikA[son * 3 + c]; }
        baskX[i] = baskX[son]; baskY[i] = baskY[son]; baskZ[i] = baskZ[son]; baskOl[i] = baskOl[son]; baskD[i] = baskD[son]; baskVis[i] = baskVis[son];
        etOnc[i] = etOnc[son]; etAltin[i] = etAltin[son]; etAd[i] = etAd[son]; etAv[i] = etAv[son]; etDuz[i] = etDuz[son];
      }
      kidler[son] = null; etAd[son] = null; etAv[son] = null; etDuz[son] = null; etOnc[son] = 0; isaretB[son] = 0;
      nSlot--; cizKirli = true;
    }
    function figEkle(kid, o) {
      const op = o || {};
      if (slotOf.has(kid)) return true;
      if (nSlot >= SLOT || slotOf.size >= CAP) return false;
      const i = nSlot++;
      kidler[i] = kid; slotOf.set(kid, i);
      const h = hash(kid);
      const a = (h % 628) / 100;                  // dogus yonu: halka disindan gelsin
      const gelR = (nHalka ? hR[nHalka - 1] : 6) + 2.5;
      px[i] = fx[i] = Math.cos(a) * gelR; pz[i] = fz[i] = Math.sin(a) * gelR;
      mod[i] = 1; tx[i] = px[i]; tz[i] = pz[i]; serbestYon[i] = 0; gez0[i] = 0; gezS[i] = 0;
      halkaNo[i] = 0; siraNo[i] = 0;
      dogum[i] = performance.now() / 1000; olum[i] = 0; hrkTip[i] = 0; isaretB[i] = 0;
      faz[i] = ((h >>> 8) % 100) / 100;
      bot[i] = op.bot ? 1 : 0;
      const bt = op.baslik === 'kasket' ? 1 : op.baslik === 'yazma' ? 2 : op.baslik === 'yok' ? 0 : ((h >>> 4) & 1 ? 2 : 1);
      baslikT[i] = bt;
      renkCoz(op.renk); let r = _c.r, g = _c.g, b = _c.b;
      if (op.bot) { const l = (r + g + b) / 3; r += (l - r) * 0.55; g += (l - g) * 0.55; b += (l - b) * 0.55; }
      renkA[i * 3] = r; renkA[i * 3 + 1] = g; renkA[i * 3 + 2] = b;
      _c.setHex(SKIN[(h >>> 12) % SKIN.length]); deriA[i * 3] = _c.r; deriA[i * 3 + 1] = _c.g; deriA[i * 3 + 2] = _c.b;
      _c.setHex(bt === 1 ? KASKET_R[(h >>> 16) % KASKET_R.length] : YAZMA_R[(h >>> 16) % YAZMA_R.length]);
      baslikA[i * 3] = _c.r; baslikA[i * 3 + 1] = _c.g; baslikA[i * 3 + 2] = _c.b;
      etOnc[i] = 0; etAd[i] = null; etAv[i] = null; etDuz[i] = null;
      cizKirli = true;
      return true;
    }
    function figCikar(kid) {
      const i = slotOf.get(kid); if (i === undefined) return;
      slotOf.delete(kid);                         // kid hemen yeniden eklenebilir; slot birazdan kapanir
      kidler[i] = '\u0000olu' + i + ':' + kid; slotOf.set(kidler[i], i);
      olum[i] = performance.now() / 1000; etOnc[i] = 0; etAd[i] = null; etAv[i] = null; etDuz[i] = null; cizKirli = true;
    }
    function figYerlestir(kid, hedef, o) {
      const i = slotOf.get(kid); if (i === undefined || !hedef) return;
      const sure = ((o && o.sureMs) != null ? o.sureMs : 700) / 1000;
      fx[i] = px[i]; fz[i] = pz[i]; gez0[i] = performance.now() / 1000; gezS[i] = Math.max(0.0001, sure);
      if (hedef.halka != null && hedef.sira != null) {
        mod[i] = 0; halkaNo[i] = clamp(hedef.halka | 0, 0, MAXH - 1); siraNo[i] = hedef.sira | 0; serbestYon[i] = 0;
      } else {
        mod[i] = 1; tx[i] = +hedef.x || 0; tz[i] = +hedef.z || 0;
        if (hedef.yon != null) { tYon[i] = +hedef.yon; serbestYon[i] = 1; } else serbestYon[i] = 0;
      }
    }
    function figHareket(kid, tip, o) {
      const i = slotOf.get(kid); if (i === undefined) return;
      const t = HRK[tip]; if (!t) return;
      hrkTip[i] = t; hrk0[i] = performance.now() / 1000;
      hrkS[i] = ((o && o.sureMs) != null ? o.sureMs / 1000 : HRK_SURE[t]);
    }
    function figIsaret(kid, v) {
      const i = slotOf.get(kid); if (i === undefined) return;
      let b = 0;
      const ekle = (x) => { if (x === 'hale') b |= 1; else if (x === 'mendil') b |= 2; else if (x === 'ikisi') b |= 3; };
      if (Array.isArray(v)) v.forEach(ekle); else ekle(v);
      isaretB[i] = b; cizKirli = true;
    }
    s.figur = {
      ekle: figEkle, cikar: figCikar, yerlestir: figYerlestir, hareket: figHareket, isaret: figIsaret,
      sayi() { let n = 0; for (let i = 0; i < nSlot; i++) if (!olum[i]) n++; return n; },
      liste() { const l = []; for (let i = 0; i < nSlot; i++) if (!olum[i]) l.push(kidler[i]); return l; },
      /** dusuk katmanda cizilmeyen figurler */
      gizli() { const l = []; const cizili = new Set(); for (let j = 0; j < nCiz; j++) cizili.add(ciz[j]); for (let i = 0; i < nSlot; i++) if (!olum[i] && !cizili.has(i)) l.push(kidler[i]); return l; },
    };
    s.halka = {
      ayarla(liste) {
        nHalka = Math.min(MAXH, (liste || []).length);
        for (let i = 0; i < nHalka; i++) { hR[i] = +liste[i].yaricap || 1; hKap[i] = Math.max(1, liste[i].kapasite | 0); hYon[i] = (liste[i].yon < 0) ? -1 : 1; }
        zeminYenile();
      },
      /** Tum halkalarin donus hizi carpani (MEYDAN GOSTERISI: 3). */
      hiz(c) { halkaHiz = Math.max(0, +c || 0); },
    };
    s.saat = {
      bagla(fn) { saatFn = typeof fn === 'function' ? fn : null; },
      tempo(bpm) { tempoBpm = clamp(+bpm || 108, 40, 220); },
      get vurus() { return vurus; },
    };

    // ======================================================================
    // KALITE
    // ======================================================================
    let kalKilit = !!zorlaKalite && kilitIstek;   // ?kalite= yalniz BASLANGIC basamagi; &kilit=1 ile sabit
    let sonDegisim = -1e9, baslangicKalite;
    const ayarlar = { webglKayip: 0 };
    function katmanUygula(ad, sebep) {
      const onceki = kalite;
      kalite = ad;
      if (ad === 'yok') {
        cv.style.display = 'none'; ov.style.display = 'none';
        if (raf) { cancelAnimationFrame(raf); raf = 0; }
      } else {
        tier = TIER[ad];
        cv.style.display = 'block'; ov.style.display = 'block';
        renderer.setPixelRatio(tier.pr); renderer.setSize(W, H, false);
        meshGolge.visible = tier.golge;
        cizKirli = true;
        if (!raf && !kayip) raf = requestAnimationFrame(dongu);
      }
      sonDegisim = performance.now();
      istStart = 0; istN = 0; istSum = 0; istAtla = 6;   // yeni basamakta olcumu yeniden baslat
      const d = kaliteDurumu(ad, sebep, onceki);
      d.toplam = s.figur.sayi(); d.cizilen = nCiz; d.gizlenen = Math.max(0, d.toplam - nCiz);
      if (onceki !== ad) yay('kalite', d);
      return d;
    }
    Object.defineProperty(s, 'kalite', {
      get: () => kalite,
      set: (v) => { if (['tam', 'orta', 'dusuk', 'yok'].includes(v)) { kalKilit = true; katmanUygula(v, 'elle'); } },
      enumerable: true, configurable: true,
    });
    s.kaliteSifirla = function () {               // tur basinda: otomatik basamaga yeniden izin ver
      kalKilit = !!zorlaKalite && kilitIstek; ayarlar.webglKayip = 0;
      katmanUygula(zorlaKalite || (yazilim ? 'dusuk' : 'tam'), 'sifirla');
    };

    // ---- cerceve istatistigi
    const ISTN = 240;
    const kareDizi = new Float32Array(ISTN), jsDizi = new Float32Array(ISTN);
    let kareI = 0, kareC = 0, istStart = 0, istN = 0, istSum = 0, istAtla = 6;
    let sahteKareMs = null, sonCizim = 0, sonOlcumKare = 0;
    let kayip = false, raf = 0;

    function kaliteDegerlendir(now, aralik) {
      if (kalKilit || kalite === 'yok') return;
      if (istAtla > 0) { istAtla--; return; }     // ilk kareler (shader derleme) sayilmaz
      if (!istStart) istStart = now;
      istSum += aralik; istN++;
      if (now - istStart < 3000) return;
      const ort = istSum / Math.max(1, istN);
      istStart = now; istSum = 0; istN = 0;
      if (now - sonDegisim < 10000) return;       // 10 sn'de bir kereden fazla degisme
      if (kalite === 'tam' && ort > 40) katmanUygula('orta', 'kare>' + Math.round(ort) + 'ms');
      else if (kalite === 'orta' && ort > 40) katmanUygula('dusuk', 'kare>' + Math.round(ort) + 'ms');
      else if (kalite === 'dusuk' && ort > 80) katmanUygula('yok', 'kare>' + Math.round(ort) + 'ms');
    }

    // ======================================================================
    // UST KATMAN: avatar diskleri + isim etiketleri
    // ======================================================================
    const avatarlar = new Map();                  // url -> { durum 0/1/2, img, cv }
    function avatarYukle(url) {
      if (!url || typeof url !== 'string') return null;
      let e = avatarlar.get(url);
      if (e) return e;
      let u; try { u = new URL(url, location.href); } catch (er) { return null; }
      if (!/^(https?:|data:|blob:)$/.test(u.protocol)) return null;
      e = { durum: 0, img: new Image(), cv: null };
      avatarlar.set(url, e);
      if (avatarlar.size > 500) {                 // tasma: en eski kayitlari at (kullanimda olmayanlar)
        const kullanilan = new Set(); for (let i = 0; i < nSlot; i++) if (etAv[i]) kullanilan.add(etAv[i]);
        for (const [k, v] of avatarlar) { if (avatarlar.size <= 400) break; if (!kullanilan.has(v)) avatarlar.delete(k); }
      }
      e.img.decoding = 'async';
      e.img.onload = () => {
        try {
          const N = 64, c = document.createElement('canvas'); c.width = c.height = N;
          const x = c.getContext('2d');
          const iw = e.img.naturalWidth || 1, ih = e.img.naturalHeight || 1, m = Math.min(iw, ih);
          x.save(); x.beginPath(); x.arc(N / 2, N / 2, N / 2 - 3, 0, Math.PI * 2); x.clip();
          x.drawImage(e.img, (iw - m) / 2, (ih - m) / 2, m, m, 0, 0, N, N); x.restore();
          x.lineWidth = 5; x.strokeStyle = '#ffffff'; x.beginPath(); x.arc(N / 2, N / 2, N / 2 - 2.5, 0, Math.PI * 2); x.stroke();
          e.cv = c; e.durum = 1;
        } catch (er) { e.durum = 2; }
      };
      e.img.onerror = () => { e.durum = 2; };
      e.img.src = url;                            // crossOrigin YOK: sadece goruntu, piksel okunmaz
      return e;
    }

    // etiket duzeni (olcum yalnizca ayarla'da / yazi tipi yuklenince; kare basina yok)
    let etMax = 14;
    let fontSurum = 0, duzenSurum = -1;
    if (document.fonts && document.fonts.addEventListener) {
      document.fonts.addEventListener('loadingdone', () => { fontSurum++; });
      try { document.fonts.load('900 40px Outfit'); } catch (e) { /* yazi tipi yok */ }
    }
    function duzenle(ad, altin) {
      const f = (px) => (altin ? '900 ' : '900 ') + px + 'px ' + FONT;
      const maxW = 520, pad = 18;
      let px = 44; ctx.font = f(px);
      let w = ctx.measureText(ad).width;
      if (w > 440) { px = 40; ctx.font = f(px); w = ctx.measureText(ad).width; }
      const satirlar = [];
      if (w <= maxW) satirlar.push(ad);
      else {                                      // sar: once bosluklardan, sigmayan kelimeyi harf harf bol; asla "..."
        let cur = '';
        const kelimeler = ad.split(/\s+/);
        const bas = (t) => { if (t) satirlar.push(t); };
        for (const kl of kelimeler) {
          let k = kl;
          const dene = cur ? cur + ' ' + k : k;
          if (ctx.measureText(dene).width <= maxW) { cur = dene; continue; }
          bas(cur); cur = '';
          while (ctx.measureText(k).width > maxW) {
            let n = k.length; while (n > 1 && ctx.measureText(k.slice(0, n)).width > maxW) n--;
            satirlar.push(k.slice(0, n)); k = k.slice(n);
          }
          cur = k;
        }
        bas(cur);
      }
      let mw = 0; for (const t of satirlar) mw = Math.max(mw, ctx.measureText(t).width);
      const lh = Math.round(px * 1.18);
      return { ad, altin, font: f(px), px, satirlar, lh, w: Math.ceil(mw + pad * 2), h: satirlar.length * lh + 14, surum: fontSurum };
    }
    s.etiket = {
      /** [{ kid, ad, oncelik, avatarUrl, altin }] — oncelik>0: isim etiketi de ciz; 0/yok: yalniz avatar diski.
          `ad` oyunun verdigi GORUNEN AD'dir; yalniz fillText ile cizilir. */
      ayarla(liste) {
        for (let i = 0; i < nSlot; i++) { etOnc[i] = 0; etAd[i] = null; etAv[i] = null; etAltin[i] = 0; }
        if (Array.isArray(liste)) for (const e of liste) {
          if (!e) continue;
          const i = slotOf.get(e.kid); if (i === undefined || olum[i]) continue;
          etOnc[i] = +e.oncelik > 0 ? +e.oncelik : 0;
          etAltin[i] = e.altin ? 1 : 0;
          const ad = e.ad == null ? '' : String(e.ad);
          if (etOnc[i] > 0 && ad) {
            if (etAd[i] !== ad || !etDuz[i] || etDuz[i].altin !== !!e.altin) etDuz[i] = duzenle(ad, !!e.altin);
            etAd[i] = ad;
          } else { etAd[i] = null; etDuz[i] = null; }
          etAv[i] = e.avatarUrl ? avatarYukle(e.avatarUrl) : null;
        }
        cizKirli = true;
      },
      get enFazla() { return etMax; },
      set enFazla(v) { etMax = clamp(v | 0, 0, 40); },
    };

    // ======================================================================
    // KARE GUNCELLEME
    // ======================================================================
    const Rk = new Float64Array(9), Ra = new Float64Array(9), Rb = new Float64Array(9);
    const ord = new Int32Array(SLOT), ordK = new Float32Array(SLOT);
    const rektler = new Float32Array(64 * 4);     // yerlesen etiket dikdortgenleri
    const adaylar = new Int32Array(SLOT);
    let dx0 = 0, dy0 = 0, dx1 = 0, dy1 = 0, kirliVar = false;
    const T0 = performance.now() / 1000;

    function cizimListesi() {
      // silinmesi biten (olum + sure) slotlar
      const simdi = performance.now() / 1000;
      for (let i = nSlot - 1; i >= 0; i--) if (olum[i] && simdi - olum[i] > 0.32) slotSil(i);
      const lim = tier.figur;
      nCiz = 0;
      if (nSlot <= lim) { for (let i = 0; i < nSlot; i++) ciz[nCiz++] = i; }
      else {                                      // dusuk: oncelikli + halay basi once, sonra sira sirasi
        for (let i = 0; i < nSlot && nCiz < lim; i++) if (!olum[i] && (etOnc[i] > 0 || isaretB[i])) ciz[nCiz++] = i;
        for (let i = 0; i < nSlot && nCiz < lim; i++) if (!olum[i] && !(etOnc[i] > 0 || isaretB[i])) ciz[nCiz++] = i;
      }
      nKasket = 0; nYazma = 0;
      const ar = meshKol.instanceColor.array;
      for (let j = 0; j < nCiz; j++) {
        const i = ciz[j];
        const a = meshGovde.instanceColor.array, b = meshKafa.instanceColor.array;
        for (let c = 0; c < 3; c++) {
          a[j * 3 + c] = renkA[i * 3 + c]; b[j * 3 + c] = deriA[i * 3 + c];
          ar[(2 * j) * 3 + c] = renkA[i * 3 + c]; ar[(2 * j + 1) * 3 + c] = renkA[i * 3 + c];
        }
        if (baslikT[i] === 1) { kIdx[j] = nKasket; for (let c = 0; c < 3; c++) meshKasket.instanceColor.array[nKasket * 3 + c] = baslikA[i * 3 + c]; nKasket++; }
        else kIdx[j] = -1;
        if (baslikT[i] === 2) { yIdx[j] = nYazma; for (let c = 0; c < 3; c++) meshYazma.instanceColor.array[nYazma * 3 + c] = baslikA[i * 3 + c]; nYazma++; }
        else yIdx[j] = -1;
      }
      meshGovde.count = meshKafa.count = meshGolge.count = nCiz; meshMendil.count = 0;
      meshKol.count = nCiz * 2; meshKasket.count = nKasket; meshYazma.count = nYazma;
      meshGovde.instanceColor.needsUpdate = meshKafa.instanceColor.needsUpdate = meshKol.instanceColor.needsUpdate = true;
      meshKasket.instanceColor.needsUpdate = meshYazma.instanceColor.needsUpdate = true;
      cizKirli = false;
    }

    function guncelle(now, dt) {
      const T = now / 1000;
      saatGuncelle(now, dt);
      for (let h = 0; h < nHalka; h++) hAci[h] += hYon[h] * HALKA_HIZ * halkaHiz * dt / hR[h];
      if (cizKirli) cizimListesi();
      const aGovde = meshGovde.instanceMatrix.array, aKafa = meshKafa.instanceMatrix.array, aKol = meshKol.instanceMatrix.array;
      const aKas = meshKasket.instanceMatrix.array, aYaz = meshYazma.instanceMatrix.array, aMen = meshMendil.instanceMatrix.array, aGol = meshGolge.instanceMatrix.array;
      const aHale = meshHale.instanceMatrix.array;
      const beatPh = vurus * Math.PI;             // pi*vurus: 2 vurusta bir tam salinim
      let nHaleK = 0, nMen = 0;
      for (let j = 0; j < nCiz; j++) {
        const i = ciz[j];
        // ---- konum
        let hx, hz;
        if (mod[i] === 0) {
          const h = halkaNo[i] < nHalka ? halkaNo[i] : (nHalka ? nHalka - 1 : -1);
          if (h >= 0) { const a = hAci[h] + (siraNo[i] % hKap[h]) * 6.283185307 / hKap[h]; hx = Math.cos(a) * hR[h]; hz = Math.sin(a) * hR[h]; }
          else { hx = tx[i]; hz = tz[i]; }
        } else { hx = tx[i]; hz = tz[i]; }
        let yurur = 0;
        if (gezS[i] > 0) {
          const u = (T - gez0[i]) / gezS[i];
          if (u >= 1) { gezS[i] = 0; px[i] = hx; pz[i] = hz; }
          else { const e = easeInOut(u < 0 ? 0 : u); px[i] = fx[i] + (hx - fx[i]) * e; pz[i] = fz[i] + (hz - fz[i]) * e; yurur = 1; }
        } else { px[i] = hx; pz[i] = hz; }
        const X = px[i], Z = pz[i];
        // ---- yonelim: halkada merkeze bak; serbestte verilen yon ya da kameraya
        let yaw;
        if (mod[i] === 1 && serbestYon[i]) yaw = tYon[i];
        else if (X * X + Z * Z < 0.04) yaw = 0;
        else yaw = Math.atan2(-X, -Z);
        // ---- olcek (dogus / olum)
        let k = 1;
        const yas = T - dogum[i];
        if (yas < 0.4) k = easeOutBack(yas / 0.4); if (k < 0.001) k = 0.001;
        if (olum[i]) { const o = (T - olum[i]) / 0.3; k *= o >= 1 ? 0 : 1 - o * o; }
        // ---- hareket zarfi
        let tip = hrkTip[i], u = 0, env = 0;
        if (tip) { u = (T - hrk0[i]) / hrkS[i]; if (u >= 1) { hrkTip[i] = 0; tip = 0; } else { env = Math.min(1, u * 6, (1 - u) * 6); } }
        // ---- adim (vurus kilitli)
        const ph = beatPh + faz[i] * 0.3;
        let guc = tip === 1 ? 1.7 : 1.0;
        let sal = Math.sin(ph) * guc;             // yana salinim
        let bob = Math.abs(Math.cos(ph)) * 0.05 * guc;
        if (yurur) { bob = Math.abs(Math.sin(T * 9 + faz[i] * 6)) * 0.07; sal *= 0.4; }
        let y0 = bob, kol = sal;
        let rolG = sal * 0.07, kolPL = 0, kolRL = 0.55, kolPR = 0, kolRR = 0.55;
        // kollar varsayilan: halay tutusu (one-yana, hafif salinim)
        kolPL = -0.5 + Math.sin(ph + 0.8) * 0.18; kolPR = -0.5 + Math.sin(ph + 0.8) * 0.18;
        kolRL = -(0.62 + Math.sin(ph) * 0.12); kolRR = 0.62 + Math.sin(ph) * 0.12;
        let mendilVar = (isaretB[i] & 2) !== 0 ? 1 : 0;
        if (mendilVar) { kolRR = 2.3 + Math.sin(T * 7 + faz[i] * 6) * 0.35; kolPR = -0.15; }
        if (tip === 2) {                          // zipla
          const par = 4 * u * (1 - u); y0 += 0.5 * par; rolG = 0;
          kolRL = -(0.9 + 1.6 * env); kolRR = 0.9 + 1.6 * env; kolPL = kolPR = -0.2;
        } else if (tip === 3) {                   // kollar yukari
          const dal = Math.sin(T * 6 + faz[i] * 6) * 0.2;
          kolRL = -(0.62 + (2.45 + dal - 0.62) * env); kolRR = 0.62 + (2.45 - dal - 0.62) * env; kolPL = kolPR = -0.2 * env + kolPL * (1 - env);
          y0 += 0.04 * env * Math.abs(Math.sin(T * 6));
        } else if (tip === 4) {                   // at (firlat): sag kol geri, ileri-yukari
          const g = u < 0.35 ? -(u / 0.35) : (u < 0.6 ? -1 + 3.4 * ((u - 0.35) / 0.25) : 2.4 - 1.2 * ((u - 0.6) / 0.4));
          kolPR = 1.1 - g * 1.5; kolRR = 0.25; rolG = 0.14 * (g > 0 ? g : 0) * -1;
          kolPR = clamp(kolPR, -3.0, 1.6); y0 += 0.04 * Math.max(0, g);
        } else if (tip === 5) {                   // mendil sallama (sag el)
          mendilVar = 1;
          kolRR = 2.1 + 0.35 * env + Math.sin(T * 10 + faz[i] * 6) * 0.35 * env; kolPR = -0.15;
        }
        // ---- govde donusu
        rotYZ(Rk, yaw, rolG);
        const cx = X + (Math.cos(yaw) * kol * 0.04 * k), cz = Z + (-Math.sin(yaw) * kol * 0.04 * k);
        // govde
        yaz(aGovde, j * 16, Rk, k, k, k, cx + Rk[1] * Y_GOVDE * k, y0 + Rk[4] * Y_GOVDE * k, cz + Rk[7] * Y_GOVDE * k);
        // kafa
        const kx = cx + Rk[1] * Y_KAFA * k, ky = y0 + Rk[4] * Y_KAFA * k, kz = cz + Rk[7] * Y_KAFA * k;
        yaz(aKafa, j * 16, Rk, k, k, k, kx, ky, kz);
        if (kIdx[j] >= 0) yaz(aKas, kIdx[j] * 16, Rk, k, k, k, kx, ky, kz);
        if (yIdx[j] >= 0) yaz(aYaz, yIdx[j] * 16, Rk, k, k, k, kx, ky, kz);
        // kollar (sol: -X, sag: +X)
        let eX = 0, eY = 0, eZ = 0;
        for (let side = 0; side < 2; side++) {
          const sg = side ? 1 : -1;
          rotXZ(Ra, side ? kolPR : kolPL, side ? kolRR : kolRL);
          carp(Rb, Rk, Ra);
          const ox = sg * X_OMUZ, oy = Y_OMUZ;
          const sx = cx + (Rk[0] * ox + Rk[1] * oy) * k, sy = y0 + (Rk[3] * ox + Rk[4] * oy) * k, sz = cz + (Rk[6] * ox + Rk[7] * oy) * k;
          yaz(aKol, (2 * j + side) * 16, Rb, k, k, k, sx, sy, sz);
          if (side) { eX = sx - Rb[1] * KOL_BOY * k; eY = sy - Rb[4] * KOL_BOY * k; eZ = sz - Rb[7] * KOL_BOY * k; }
        }
        // mendil
        if (mendilVar) {
          const f = Math.sin(T * 13 + faz[i] * 9);
          rotYZ(Ra, yaw + f * 0.5, f * 0.6);
          yaz(aMen, nMen * 16, Ra, k, k, k, eX, eY + 0.07 * k, eZ); nMen++;
        }
        // golge
        const gs = (0.95 - y0 * 0.9) * k;
        for (let q = 0; q < 16; q++) aGol[j * 16 + q] = 0; aGol[j * 16] = gs; aGol[j * 16 + 5] = 1; aGol[j * 16 + 10] = gs; aGol[j * 16 + 12] = X; aGol[j * 16 + 13] = 0.015; aGol[j * 16 + 14] = Z; aGol[j * 16 + 15] = 1;
        // hale (halay basi zemin halkasi)
        if ((isaretB[i] & 1) && nHaleK < HALE_N) {
          const p = 1.15 + 0.07 * Math.sin(T * 4) , hs = p * k;
          aHale.fill(0, nHaleK * 16, nHaleK * 16 + 16);
          aHale[nHaleK * 16] = hs; aHale[nHaleK * 16 + 5] = 1; aHale[nHaleK * 16 + 10] = hs; aHale[nHaleK * 16 + 12] = X; aHale[nHaleK * 16 + 13] = 0.03; aHale[nHaleK * 16 + 14] = Z; aHale[nHaleK * 16 + 15] = 1;
          nHaleK++;
        }
        // ---- ekran izdusumu (kafa merkezi)
        const cw = vp[8] * kx + vp[9] * ky + vp[10] * kz + vp[11];
        if (cw > 0.01) {
          const ndx = (vp[0] * kx + vp[1] * ky + vp[2] * kz + vp[3]) / cw, ndy = (vp[4] * kx + vp[5] * ky + vp[6] * kz + vp[7]) / cw;
          baskX[i] = (ndx * 0.5 + 0.5) * W; baskY[i] = (0.5 - ndy * 0.5) * H; baskD[i] = cw; baskOl[i] = p11 * H * 0.5 / cw * k;
          baskVis[i] = olum[i] ? 0 : 1;
        } else baskVis[i] = 0;
        baskX[i] = baskX[i]; baskY[i] = baskY[i];
      }
      meshHale.count = nHaleK; meshMendil.count = nMen;
      meshGovde.instanceMatrix.needsUpdate = meshKafa.instanceMatrix.needsUpdate = meshKol.instanceMatrix.needsUpdate = true;
      meshKasket.instanceMatrix.needsUpdate = meshYazma.instanceMatrix.needsUpdate = meshMendil.instanceMatrix.needsUpdate = meshGolge.instanceMatrix.needsUpdate = true;
      meshHale.instanceMatrix.needsUpdate = true;
      garland.rotation.z = Math.sin(T * 0.7) * 0.006;
    }

    // ---- ust katman cizimi
    function pillCiz(x, y, w, h, r) {
      ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
    }
    function ustCiz(now) {
      if (kirliVar) { ctx.clearRect(dx0 - 4, dy0 - 4, dx1 - dx0 + 8, dy1 - dy0 + 8); kirliVar = false; }
      let mnx = 1e9, mny = 1e9, mxx = -1e9, mxy = -1e9;
      // 1) avatar diskleri, uzaktan yakina
      let n = 0;
      for (let j = 0; j < nCiz; j++) {
        const i = ciz[j];
        const av = etAv[i];
        if (!av || av.durum !== 1 || !baskVis[i]) continue;
        const r = baskOl[i] * KAFA_R * 0.94;
        if (r < 5) continue;
        if (!izinli(baskX[i] - r, baskY[i] - r, baskX[i] + r, baskY[i] + r)) continue;
        // yerlestirme: derinlige gore (insertion, neredeyse sirali)
        let p = n++;
        while (p > 0 && ordK[p - 1] < baskD[i]) { ord[p] = ord[p - 1]; ordK[p] = ordK[p - 1]; p--; }
        ord[p] = i; ordK[p] = baskD[i];
      }
      for (let q = 0; q < n; q++) {
        const i = ord[q], av = etAv[i], r = baskOl[i] * KAFA_R * 0.94;
        ctx.drawImage(av.cv, baskX[i] - r, baskY[i] - r, r * 2, r * 2);
        if (baskX[i] - r < mnx) mnx = baskX[i] - r; if (baskY[i] - r < mny) mny = baskY[i] - r;
        if (baskX[i] + r > mxx) mxx = baskX[i] + r; if (baskY[i] + r > mxy) mxy = baskY[i] + r;
      }
      // 2) etiketler: oncelige gore, cakisan dusurulur
      if (etMax > 0) {
        let na = 0;
        for (let j = 0; j < nCiz; j++) {
          const i = ciz[j];
          if (etOnc[i] <= 0 || !etDuz[i] || !baskVis[i]) continue;
          if (etDuz[i].surum !== fontSurum) etDuz[i] = duzenle(etAd[i], !!etAltin[i]);   // yazi tipi yuklendi: yeniden olc
          let p = na++;
          while (p > 0 && etOnc[adaylar[p - 1]] < etOnc[i]) { adaylar[p] = adaylar[p - 1]; p--; }
          adaylar[p] = i;
        }
        let yer = 0;
        for (let a = 0; a < na && yer < etMax && yer < 64; a++) {
          const i = adaylar[a], d = etDuz[i];
          const r = baskOl[i] * KAFA_R;
          let x0 = clamp(baskX[i] - d.w / 2, TAVAN.sol, TAVAN.sag - d.w);
          let y0 = baskY[i] - r - 10 - d.h;                         // basin ustunde
          let ok = izinli(x0, y0, x0 + d.w, y0 + d.h);
          if (!ok) { y0 = baskY[i] + r + 0.8 * baskOl[i] + 6; ok = izinli(x0, y0, x0 + d.w, y0 + d.h); }   // altta dene
          if (!ok) continue;
          for (let b = 0; b < yer; b++) {
            if (x0 < rektler[b * 4 + 2] + 6 && x0 + d.w + 6 > rektler[b * 4] && y0 < rektler[b * 4 + 3] + 6 && y0 + d.h + 6 > rektler[b * 4 + 1]) { ok = false; break; }
          }
          if (!ok) continue;
          rektler[yer * 4] = x0; rektler[yer * 4 + 1] = y0; rektler[yer * 4 + 2] = x0 + d.w; rektler[yer * 4 + 3] = y0 + d.h; yer++;
          pillCiz(x0, y0, d.w, d.h, 18);
          ctx.fillStyle = 'rgba(23,18,58,.88)'; ctx.fill();
          ctx.lineWidth = 3; ctx.strokeStyle = d.altin ? '#ffd25a' : 'rgba(255,255,255,.55)'; ctx.stroke();
          ctx.font = d.font; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.fillStyle = d.altin ? '#ffd25a' : '#ffffff';
          for (let l = 0; l < d.satirlar.length; l++) ctx.fillText(d.satirlar[l], x0 + d.w / 2, y0 + 7 + d.lh * (l + 0.5));
          if (x0 < mnx) mnx = x0; if (y0 < mny) mny = y0; if (x0 + d.w > mxx) mxx = x0 + d.w; if (y0 + d.h > mxy) mxy = y0 + d.h;
        }
      }
      if (mxx > mnx) { dx0 = Math.max(0, mnx); dy0 = Math.max(0, mny); dx1 = Math.min(W, mxx); dy1 = Math.min(H, mxy); kirliVar = true; }
    }

    // ---- baglam kaybi
    cv.addEventListener('webglcontextlost', (e) => {
      e.preventDefault(); kayip = true; ayarlar.webglKayip++;
      if (raf) { cancelAnimationFrame(raf); raf = 0; }
      if (ayarlar.webglKayip >= 2) { katmanUygula('yok', 'baglam-iki-kez-kayboldu'); return; }
      kayipZaman = setTimeout(() => { if (kayip) katmanUygula('yok', 'baglam-donmedi'); }, 4000);
    });
    let kayipZaman = 0;
    cv.addEventListener('webglcontextrestored', () => {
      clearTimeout(kayipZaman); kayip = false;
      if (kalite !== 'yok') { renderer.setPixelRatio(tier.pr); renderer.setSize(W, H, false); zemTex.needsUpdate = true; gokTex.needsUpdate = true; kilimTex.needsUpdate = true; saatSon = -1e9; sonCizim = 0; if (!raf) raf = requestAnimationFrame(dongu); }
    });

    // ======================================================================
    // DONGU
    // ======================================================================
    let sonGuncelle = 0;
    function dongu(now) {
      raf = requestAnimationFrame(dongu);
      if (kayip || kalite === 'yok') return;
      const aralik = 1000 / tier.fps;
      if (sonCizim && now - sonCizim < aralik - 4) return;     // fps tavani
      const t0 = performance.now();
      const dt = sonGuncelle ? Math.min(0.1, (now - sonGuncelle) / 1000) : 0.033;
      sonGuncelle = now;
      guncelle(now, dt);
      renderer.render(scene, camera);
      ustCiz(now);
      const js = performance.now() - t0;
      const aral = sonCizim ? now - sonCizim : 0;
      sonCizim = now;
      if (aral > 0 && aral < 1500) {
        const olc = sahteKareMs != null ? sahteKareMs : aral;
        kareDizi[kareI % ISTN] = olc; jsDizi[kareI % ISTN] = js; kareI++; if (kareC < ISTN) kareC++;
        kaliteDegerlendir(now, olc);
      } else { jsDizi[kareI % ISTN] = js; kareI++; if (kareC < ISTN) kareC++; }
    }

    // ---- olcum
    function ort(a, n) { let t = 0; for (let i = 0; i < n; i++) t += a[i]; return n ? t / n : 0; }
    function p95(a, n) { if (!n) return 0; const c = Array.from(a.subarray(0, n)).sort((x, y) => x - y); return c[Math.min(n - 1, Math.floor(n * 0.95))]; }
    s.olcum = function () {
      const n = Math.min(kareC, ISTN);
      return {
        kalite, figur: s.figur.sayi(), cizimCagrisi: renderer.info.render.calls, ucgen: renderer.info.render.triangles,
        jsMs: +ort(jsDizi, n).toFixed(3), jsMsP95: +p95(jsDizi, n).toFixed(3),
        kareMs: +ort(kareDizi, n).toFixed(2), kareMsP95: +p95(kareDizi, n).toFixed(2),
        pikselOrani: kalite === 'yok' ? 0 : tier.pr, webgl: bilgi.render, yazilim,
        cizilen: nCiz, gizli: Math.max(0, s.figur.sayi() - nCiz), fps: kalite === 'yok' ? 0 : tier.fps, kayip: ayarlar.webglKayip,
      };
    };
    s.ekran = function (kid, out) {
      const r = out || {}; const i = slotOf.get(kid);
      if (i === undefined || !baskVis[i]) { r.x = 0; r.y = 0; r.olcek = 1; r.gorunur = false; return r; }
      r.x = baskX[i]; r.y = baskY[i]; r.olcek = baskOl[i];
      let g = false; for (let j = 0; j < nCiz; j++) if (ciz[j] === i) { g = true; break; }
      r.gorunur = g && r.x >= 0 && r.x <= W && r.y >= 0 && r.y <= H;
      return r;
    };
    s.deneme = {
      /** yavas kare enjekte et (basamak testi): ms=null kapatir. Sadece olcumu degistirir. */
      sahteKare(ms) { sahteKareMs = ms == null ? null : +ms; },
      baglamKaybet() { const e = renderer.getContext().getExtension('WEBGL_lose_context'); if (e) e.loseContext(); },
      baglamGeriGetir() { const e = renderer.getContext().getExtension('WEBGL_lose_context'); if (e) e.restoreContext(); },
      /** n kare uzerinden readPixels ile GERCEK kare maliyeti (ms) — rAF'i beklemeden. */
      gpuMs(n) {
        const px1 = new Uint8Array(4);
        const gl = renderer.getContext(); n = n || 10; const t = performance.now();
        for (let i = 0; i < n; i++) { guncelle(performance.now(), 0.033); renderer.render(scene, camera); gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px1); }
        return (performance.now() - t) / n;
      },
    };
    s.yokEt = function () {
      if (raf) cancelAnimationFrame(raf); raf = 0; kayip = true;
      try { renderer.dispose(); } catch (e) { /* tamam */ }
      cv.remove(); ov.remove();
    };

    // ---- baslat
    const kutu0 = kutuOku();
    s.halka.ayarla([]);                           // zemin dokusunu bir kez ciz
    kadrajla(kutu0, 6.8, 38);
    const ilk = zorlaKalite || (yazilim ? 'dusuk' : 'tam');
    baslangicKalite = ilk;
    tier = TIER[ilk]; kalite = ilk;
    renderer.setPixelRatio(tier.pr); renderer.setSize(W, H, false);
    meshGolge.visible = tier.golge;
    kap.setAttribute('data-sahne3d', ilk);
    sonDegisim = performance.now();
    raf = requestAnimationFrame(dongu);
    { const d = kaliteDurumu(ilk, zorlaKalite ? (kilitIstek ? 'kilitli' : 'zorla') : (yazilim ? 'yazilim-render' : 'baslangic'), null); setTimeout(() => yay('kalite', d), 0); }
    return s;
  },
};

export { Sahne3D, THREE };
