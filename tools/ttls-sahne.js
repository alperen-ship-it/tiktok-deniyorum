#!/usr/bin/env node
'use strict';
/**
 * ttls-sahne.js — TikTok LIVE Studio'nun sahne/kaynak grafigini okur, Link
 * kaynaklarinin adresini degistirir.
 *
 * === Dosya nerede? ===
 *   %APPDATA%\TikTok LIVE Studio\TTStore\services.json
 *
 * Sema (topluluk tersine muhendisligiyle dogrulandi):
 *   SourceService.state.scenes       -> [{ id, name }, ...]
 *   SourceService.state.sceneSource  -> { <sahneId>: { data: { <kaynakId>: {...} } } }
 *   kaynak                           -> { type, name, payload: { url, ... } }
 *   Link (tarayici) kaynagi          -> type === 'browser', payload.url
 *
 * === Kullanim ===
 *   node tools/ttls-sahne.js list
 *   node tools/ttls-sahne.js set-url "Overlay" "http://localtest.me:8787/overlays/alerts.html?lite=1"
 *   node tools/ttls-sahne.js dump          # ham JSON'un yapisini gormek icin
 *
 * === UYARI ===
 *   * Yazmadan ONCE LIVE Studio'yu KAPAT. Uygulama cikista bu dosyayi
 *     yeniden yaziyor; acikken degistirirsen degisiklik ucar.
 *   * Her yazma isleminden once otomatik yedek aliniyor:
 *     services.json.yedek-<zaman damgasi>
 *   * Yeni kaynak OLUSTURMUYORUZ. Kaynagi LIVE Studio icinden bir kere elle
 *     ekle (Kaynak ekle > Link), sonra adresini buradan istedigin kadar
 *     degistir. Sebebi: yeni kaynak nesnesinin tam semasi dogrulanmadi,
 *     yanlis alan yazarsak uygulama sahneyi bozabilir.
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

function storePath() {
  const appdata =
    process.env.APPDATA ||
    (os.platform() === 'darwin'
      ? path.join(os.homedir(), 'Library', 'Application Support')
      : null);

  if (!appdata) {
    console.error('APPDATA bulunamadi. Bu arac Windows (veya macOS) icin.');
    console.error('Dosyanin yolunu elle ver:  --file "C:\\...\\services.json"');
    process.exit(1);
  }
  return path.join(appdata, 'TikTok LIVE Studio', 'TTStore', 'services.json');
}

function load(file) {
  if (!fs.existsSync(file)) {
    console.error(`Dosya yok: ${file}`);
    console.error('');
    console.error('Kontrol et:');
    console.error('  * LIVE Studio en az bir kez calistirilip sahne olusturuldu mu?');
    console.error('  * Farkli bir yoldaysa:  --file "<tam yol>"');
    process.exit(1);
  }
  const raw = fs.readFileSync(file, 'utf8');
  try {
    return JSON.parse(raw);
  } catch (e) {
    console.error('JSON cozulemedi:', e.message);
    console.error('Dosya bozuk olabilir ya da sema degismis olabilir.');
    process.exit(1);
  }
}

/** Sahneleri ve icindeki kaynaklari duz bir listeye cikar. */
function walk(json) {
  const st = json?.SourceService?.state;
  if (!st) return null;

  const scenes = st.scenes || [];
  const bySceneId = st.sceneSource || {};
  const out = [];

  for (const sc of scenes) {
    const bucket = bySceneId[sc.id]?.data || {};
    const sources = Object.entries(bucket).map(([id, s]) => ({
      id,
      type: s?.type ?? '?',
      name: s?.name ?? '(isimsiz)',
      url: s?.payload?.url ?? null,
      raw: s,
    }));
    out.push({ id: sc.id, name: sc.name ?? '(isimsiz sahne)', sources });
  }
  return out;
}

function cmdList(file) {
  const json = load(file);
  const scenes = walk(json);

  if (!scenes) {
    console.error('Beklenen sema bulunamadi (SourceService.state).');
    console.error('LIVE Studio surumu semayi degistirmis olabilir. Sunu calistir:');
    console.error('   node tools/ttls-sahne.js dump');
    process.exit(1);
  }

  console.log(`\nDosya: ${file}\n`);
  if (!scenes.length) console.log('(hic sahne yok)');

  let linkCount = 0;
  for (const sc of scenes) {
    console.log(`SAHNE: ${sc.name}   [${sc.id}]`);
    if (!sc.sources.length) console.log('   (bos)');
    for (const s of sc.sources) {
      const tag = s.type === 'browser' ? 'LINK' : s.type.toUpperCase();
      console.log(`   ${tag.padEnd(9)} ${s.name}`);
      if (s.url) {
        console.log(`   ${' '.repeat(9)} -> ${s.url}`);
        linkCount++;
      }
    }
    console.log('');
  }

  console.log(`Toplam ${scenes.length} sahne, ${linkCount} Link kaynagi.`);
  if (linkCount === 0) {
    console.log('');
    console.log('Hic Link kaynagin yok. LIVE Studio icinde:');
    console.log('   Kaynak ekle > Link  ->  gecici bir adres yaz (orn. http://localtest.me)');
    console.log('sonra buradan adresini degistirebilirsin.');
  }
}

function cmdDump(file) {
  const json = load(file);
  // Semanin ust seviyesini goster — alan adlari degistiyse boyle gorulur
  console.log('Ust seviye anahtarlar:', Object.keys(json).join(', '));
  const st = json?.SourceService?.state;
  if (st) {
    console.log('SourceService.state anahtarlari:', Object.keys(st).join(', '));
    const firstScene = (st.scenes || [])[0];
    if (firstScene) {
      const bucket = st.sceneSource?.[firstScene.id]?.data || {};
      const firstSrc = Object.values(bucket)[0];
      if (firstSrc) {
        console.log('\nOrnek bir kaynak nesnesi (sema referansi):');
        console.log(JSON.stringify(firstSrc, null, 2).slice(0, 4000));
      }
    }
  } else {
    console.log('\nSourceService yok. Ham ilk 3000 karakter:');
    console.log(JSON.stringify(json, null, 2).slice(0, 3000));
  }
}

function cmdSetUrl(file, targetName, newUrl) {
  if (!targetName || !newUrl) {
    console.error('Kullanim: node tools/ttls-sahne.js set-url "<kaynak adi>" "<yeni adres>"');
    process.exit(1);
  }

  // LIVE Studio'nun URL dogrulamasi hakkinda CELISKILI bulgu var: iki kaynak
  // "localhost/IP reddediliyor" diyor, biri "127.0.0.1 kabul ediliyor" diyor.
  // Muhtemelen surume gore degisiyor. Bu yuzden engellemiyoruz, uyariyoruz.
  if (/^https?:\/\/(localhost|127\.0\.0\.1|\d+\.\d+\.\d+\.\d+)/i.test(newUrl)) {
    console.warn('');
    console.warn('  UYARI: Bu adres LIVE Studio surumune gore reddedilebilir.');
    console.warn('  Link kaynaginin URL dogrulamasi bazi surumlerde "localhost" ve');
    console.warn('  ham IP kabul etmiyor, gercek alan adi istiyor.');
    console.warn('');
    console.warn('  Calismazsa bunu dene (her durumda calisir):');
    console.warn('     ' + newUrl.replace(/^(https?:\/\/)(localhost|127\.0\.0\.1|\d+\.\d+\.\d+\.\d+)/i, '$1localtest.me'));
    console.warn('  (localtest.me herkese acik bir alan adi ve 127.0.0.1\'e cozuluyor,');
    console.warn('   yani trafik yine makineden disari cikmiyor)');
    console.warn('');
  }

  const json = load(file);
  const st = json?.SourceService?.state;
  const bySceneId = st?.sceneSource || {};

  let hit = 0;
  for (const sceneId of Object.keys(bySceneId)) {
    const bucket = bySceneId[sceneId]?.data || {};
    for (const [id, s] of Object.entries(bucket)) {
      if (s?.type !== 'browser') continue;
      if (String(s.name ?? '').toLowerCase() !== targetName.toLowerCase()) continue;

      const old = s.payload?.url;
      s.payload = s.payload || {};
      s.payload.url = newUrl;
      hit++;
      console.log(`  ${s.name}  [${id}]`);
      console.log(`     eski: ${old ?? '(yok)'}`);
      console.log(`     yeni: ${newUrl}`);
    }
  }

  if (!hit) {
    console.error(`"${targetName}" adinda bir Link kaynagi bulunamadi.`);
    console.error('Mevcut kaynaklari gormek icin:  node tools/ttls-sahne.js list');
    process.exit(1);
  }

  // Yedekle, sonra yaz
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backup = `${file}.yedek-${stamp}`;
  fs.copyFileSync(file, backup);
  fs.writeFileSync(file, JSON.stringify(json), 'utf8');

  console.log('');
  console.log(`${hit} kaynak guncellendi.`);
  console.log(`Yedek: ${backup}`);
  console.log('');
  console.log('LIVE Studio ACIKSA simdi kapatip yeniden ac — acikken yaptigin');
  console.log('degisiklik uygulamanin kendi yazmasiyla ezilir.');
}

// ---------------------------------------------------------------------------
(() => {
  const argv = process.argv.slice(2);
  const fi = argv.indexOf('--file');
  const file = fi >= 0 ? argv[fi + 1] : storePath();
  const args = argv.filter((a, i) => i !== fi && i !== fi + 1);
  const cmd = args[0] || 'list';

  if (cmd === 'list') cmdList(file);
  else if (cmd === 'dump') cmdDump(file);
  else if (cmd === 'set-url') cmdSetUrl(file, args[1], args[2]);
  else {
    console.log(`
TikTok LIVE Studio sahne/kaynak araci

  node tools/ttls-sahne.js list                       sahneleri ve kaynaklari listele
  node tools/ttls-sahne.js set-url "<ad>" "<adres>"   Link kaynaginin adresini degistir
  node tools/ttls-sahne.js dump                       ham semayi incele

  --file "<yol>"   services.json yolunu elle ver

Varsayilan dosya: %APPDATA%\\TikTok LIVE Studio\\TTStore\\services.json
Yazmadan once LIVE Studio'yu KAPAT.
`);
  }
})();
