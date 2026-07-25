#!/usr/bin/env node
'use strict';
/**
 * paketle.js — projeyi TEK BIR CALISTIRILABILIR DOSYAYA cevirir.
 *
 *   node server/paketle.js              # bu makine icin (Linux/mac/Windows)
 *   node server/paketle.js --win        # Windows .exe uret (baska OS'ten de olur)
 *   node server/paketle.js --win --linux
 *
 * Sonuc:  dist/TikTokOyunlar.exe   (yanina hicbir klasor gerekmez)
 *
 * NASIL CALISIYOR
 *   Node'un "Single Executable Application" (SEA) ozelligi: node.exe'nin
 *   icine kendi kodunu ve dosyalarini gomuyorsun, disari cikan sey calisan
 *   tek bir program oluyor. Kullanicida Node kurulu olmasi GEREKMIYOR.
 *
 *   1) esbuild ile bridge.js + bagimliliklari tek bir .cjs dosyasina toplanir
 *   2) Butun overlay dosyalari "asset" olarak listelenir (varlik.js bunlari
 *      calisma aninda sea.getRawAsset ile okuyor)
 *   3) nodejs.org'dan hedef isletim sisteminin node ikilisi indirilir
 *   4) postject ile blob ikilinin icine enjekte edilir
 *
 * GEREKENLER (sadece paketlerken, kullanicida degil):
 *   npm i -D esbuild postject
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFileSync } = require('child_process');
const { createHash } = require('crypto');

const KOK = path.resolve(__dirname, '..');
const DIST = path.join(KOK, 'dist');
const GECICI = path.join(DIST, '.gecici');

// Hangi Node surumu gomulecek. SEA + getRawAsset icin >= 20.12 gerekiyor;
// 22 LTS guvenli secim.
const NODE_SURUM = process.env.NODE_SEA_SURUM || 'v22.22.2';

const argv = process.argv.slice(2);
const bayrak = (a) => argv.includes(a);

// Hangi hedefler uretilecek? Hicbiri verilmezse bu makine icin.
const hedefler = [];
if (bayrak('--win')) hedefler.push({ ad: 'win', platform: 'win32', arch: 'x64' });
if (bayrak('--linux')) hedefler.push({ ad: 'linux', platform: 'linux', arch: 'x64' });
if (bayrak('--mac')) hedefler.push({ ad: 'mac', platform: 'darwin', arch: process.arch === 'arm64' ? 'arm64' : 'x64' });
if (!hedefler.length) hedefler.push({ ad: 'yerel', platform: process.platform, arch: process.arch });

function bilgi(...a) { console.log('  ', ...a); }
function baslik(s) { console.log('\n' + s); }

// ---------------------------------------------------------------------------
// 1) Gomulecek dosyalari topla
// ---------------------------------------------------------------------------
/** Bir klasoru yinelemeli tarayip kok-goreli yollari dondur. */
function dosyalariTopla(goreli, sonuc = []) {
  const tam = path.join(KOK, goreli);
  for (const girdi of fs.readdirSync(tam, { withFileTypes: true })) {
    if (girdi.name.startsWith('.')) continue;
    const alt = goreli + '/' + girdi.name;
    if (girdi.isDirectory()) dosyalariTopla(alt, sonuc);
    else sonuc.push(alt.replace(/^\/+/, ''));
  }
  return sonuc;
}

function varliklariTopla() {
  const liste = dosyalariTopla('overlays');
  const harita = {};
  for (const yol of liste) harita[yol] = path.join(KOK, yol);
  return harita;
}

// ---------------------------------------------------------------------------
// 2) Node ikilisini indir (nodejs.org)
// ---------------------------------------------------------------------------
function ikiliAdresi(platform, arch) {
  if (platform === 'win32') {
    return {
      url: `https://nodejs.org/dist/${NODE_SURUM}/win-${arch}/node.exe`,
      dosya: `node-${NODE_SURUM}-win-${arch}.exe`,
      tarball: false,
    };
  }
  const isim = platform === 'darwin' ? 'darwin' : 'linux';
  return {
    url: `https://nodejs.org/dist/${NODE_SURUM}/node-${NODE_SURUM}-${isim}-${arch}.tar.gz`,
    dosya: `node-${NODE_SURUM}-${isim}-${arch}.tar.gz`,
    tarball: true,
    icYol: `node-${NODE_SURUM}-${isim}-${arch}/bin/node`,
  };
}

async function indir(url, hedef) {
  if (fs.existsSync(hedef) && fs.statSync(hedef).size > 1024) {
    bilgi('onbellekten:', path.basename(hedef));
    return hedef;
  }
  bilgi('indiriliyor:', url);
  const cevap = await fetch(url);
  if (!cevap.ok) throw new Error(`indirilemedi (HTTP ${cevap.status}): ${url}`);
  const veri = Buffer.from(await cevap.arrayBuffer());
  fs.mkdirSync(path.dirname(hedef), { recursive: true });
  fs.writeFileSync(hedef, veri);
  bilgi('indi:', (veri.length / 1048576).toFixed(1) + ' MB');
  return hedef;
}

async function nodeIkilisiHazirla(platform, arch) {
  const { url, dosya, tarball, icYol } = ikiliAdresi(platform, arch);
  const inen = path.join(GECICI, dosya);
  await indir(url, inen);

  if (!tarball) return inen;

  const cikti = path.join(GECICI, `node-${platform}-${arch}`);
  if (!fs.existsSync(cikti)) {
    bilgi('acilıyor...');
    execFileSync('tar', ['-xzf', inen, '-C', GECICI, icYol], { stdio: 'inherit' });
    fs.copyFileSync(path.join(GECICI, icYol), cikti);
    fs.chmodSync(cikti, 0o755);
  }
  return cikti;
}

// ---------------------------------------------------------------------------
// 3) Derle
// ---------------------------------------------------------------------------
function komutBul(ad) {
  // esbuild/postject hem kokte hem server/ altinda kurulmus olabilir
  for (const temel of [KOK, path.join(KOK, 'server'), process.cwd()]) {
    const yol = path.join(temel, 'node_modules', '.bin', ad + (process.platform === 'win32' ? '.cmd' : ''));
    if (fs.existsSync(yol)) return yol;
  }
  return null;
}

function paketiTopla() {
  baslik('1/4  Kod tek dosyaya toplaniyor (esbuild)');
  const esbuild = komutBul('esbuild');
  if (!esbuild) {
    throw new Error(
      'esbuild bulunamadi. Once kur:\n' +
      '     npm i -D esbuild postject'
    );
  }
  const cikti = path.join(GECICI, 'paket.cjs');
  execFileSync(esbuild, [
    path.join(KOK, 'server', 'bridge.js'),
    '--bundle',
    '--platform=node',
    '--format=cjs',
    '--target=node20',
    // node:sea calisma aninda cozulmeli, esbuild dokunmasin
    '--external:node:sea',
    '--outfile=' + cikti,
  ], { stdio: 'inherit' });

  const kb = (fs.statSync(cikti).size / 1024).toFixed(0);
  bilgi(`paket.cjs -> ${kb} KB`);
  return cikti;
}

function seaBlobUret(girisDosya, varliklar) {
  baslik('2/4  Overlay dosyalari gomuluyor');
  const yapilandirma = {
    main: girisDosya,
    output: path.join(GECICI, 'sea.blob'),
    disableExperimentalSEAWarning: true,
    // useSnapshot KAPALI: acilis birkaç ms yavas ama dinamik import()
    // (tiktok-live-connector ESM) anlik goruntude sorun cikariyor.
    useSnapshot: false,
    assets: varliklar,
  };
  const yol = path.join(GECICI, 'sea-config.json');
  fs.writeFileSync(yol, JSON.stringify(yapilandirma, null, 2));
  bilgi(`${Object.keys(varliklar).length} dosya gomulecek`);

  execFileSync(process.execPath, ['--experimental-sea-config', yol], { stdio: 'inherit' });
  const mb = (fs.statSync(yapilandirma.output).size / 1048576).toFixed(1);
  bilgi(`sea.blob -> ${mb} MB`);
  return yapilandirma.output;
}

async function enjekteEt(hedef, blob) {
  baslik(`3/4  Node ikilisi hazirlaniyor (${hedef.platform}-${hedef.arch}, ${NODE_SURUM})`);
  const ikili = await nodeIkilisiHazirla(hedef.platform, hedef.arch);

  baslik('4/4  Blob ikiliye enjekte ediliyor (postject)');
  const uzanti = hedef.platform === 'win32' ? '.exe' : '';
  const ad = hedef.platform === 'win32'
    ? 'TikTokOyunlar.exe'
    : `TikTokOyunlar-${hedef.platform}-${hedef.arch}${uzanti}`;
  const cikti = path.join(DIST, ad);

  fs.copyFileSync(ikili, cikti);
  fs.chmodSync(cikti, 0o755);

  const postject = komutBul('postject');
  if (!postject) throw new Error('postject bulunamadi. npm i -D postject');

  const bayraklar = [
    cikti,
    'NODE_SEA_BLOB', blob,
    '--sentinel-fuse', 'NODE_SEA_FUSE_fce680ab2cc467b6e072b8b5df1996b2',
  ];
  // macOS ikilisi imzali geliyor, enjeksiyon imzayi bozuyor -> once sokmek gerek
  if (hedef.platform === 'darwin') bayraklar.push('--macho-segment-name', 'NODE_SEA');

  execFileSync(postject, bayraklar, { stdio: 'inherit' });

  const mb = (fs.statSync(cikti).size / 1048576).toFixed(1);
  const ozet = createHash('sha256').update(fs.readFileSync(cikti)).digest('hex').slice(0, 16);
  return { cikti, mb, ozet };
}

// ---------------------------------------------------------------------------
async function main() {
  console.log('\n=== TikTok Oyunları — paketleme ===');
  console.log('    kaynak:', KOK);
  console.log('    node  :', NODE_SURUM);

  fs.mkdirSync(GECICI, { recursive: true });

  const varliklar = varliklariTopla();
  const paket = paketiTopla();
  const blob = seaBlobUret(paket, varliklar);

  const sonuclar = [];
  for (const hedef of hedefler) {
    sonuclar.push(await enjekteEt(hedef, blob));
  }

  console.log('\n=== BITTI ===');
  for (const s of sonuclar) {
    console.log(`  ${path.relative(KOK, s.cikti)}   ${s.mb} MB   sha256:${s.ozet}`);
  }
  console.log('\n  Bu dosyayi tek basina kopyalayabilirsin — yanina klasor gerekmiyor.');
  console.log('  Cift tiklayinca kontrol paneli tarayicida aciliyor.\n');
}

main().catch((e) => {
  console.error('\n!! Paketleme basarisiz:', e.message);
  process.exit(1);
});
