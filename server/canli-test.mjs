/**
 * canli-test.mjs — "Bu is gercekten TikTok'tan veri cekiyor mu?" sorusunun cevabi.
 *
 * Overlay'ler mock veriyle calisiyor diye gercek akisin da calistigini
 * varsayamayiz. Bu arac tam olarak onu sinar ve HATA SINIFINA gore teshis koyar.
 *
 *   node server/canli-test.mjs <kullaniciadi> [baska_kullanici ...]
 *
 * ONEMLI: Test icin SENIN yayinda olman gerekmiyor — su an canli olan
 * herkese acik HERHANGI bir hesap ise yarar (salt okuma, kimlik gerekmez).
 * Ama en kesin sonuc: kendi yayinini ac, sonra kendi kullanici adinla calistir.
 *
 * EulerStream anahtarin varsa (limite takilirsan gerekir):
 *   PowerShell : $env:EULER_API_KEY="xxxx"
 *   CMD        : set EULER_API_KEY=xxxx
 */

import { TikTokLiveConnection, SignConfig } from 'tiktok-live-connector';

const hedefler = process.argv.slice(2).map((s) => s.replace(/^@/, '')).filter(Boolean);

if (!hedefler.length) {
  console.log(`
Kullanim:  node server/canli-test.mjs <kullaniciadi>
Ornek:     node server/canli-test.mjs dalpirin

Test edilen kisi SU AN canli yayinda olmali.
Kendi yayinini acip kendi kullanici adinla denemek en kesin sonucu verir.
`);
  process.exit(1);
}

if (process.env.EULER_API_KEY) {
  SignConfig.apiKey = process.env.EULER_API_KEY;
  console.log('EulerStream anahtari : ayarlandi\n');
} else {
  console.log('EulerStream anahtari : YOK (anonim limitle deneniyor)\n');
}

// ---------------------------------------------------------------------------
// 1) On kontrol — bu makine TikTok'a ve imza sunucusuna ULASABILIYOR mu?
//    Bu ayrimi yapmazsak "baglanamadi" hatasi belirsiz kalir: ag mi engelli,
//    yoksa kisi mi yayinda degil, ayirt edemeyiz.
// ---------------------------------------------------------------------------
async function erisim(ad, url) {
  const t0 = Date.now();
  try {
    const ac = new AbortController();
    const zamanlayici = setTimeout(() => ac.abort(), 12000);
    const r = await fetch(url, { signal: ac.signal, redirect: 'manual' });
    clearTimeout(zamanlayici);

    // DIKKAT: "cevap geldi" ile "erisim var" ayni sey degil. Kurumsal proxy,
    // VPN ya da filtreleyici bir ag, istegi kendisi karsilayip 403/407/502
    // dondurur — TCP kurulur ama TikTok'a hic ulasilmaz. Gercek tiktok.com
    // ana sayfasi 2xx/3xx doner; 4xx/5xx neredeyse her zaman araya giren
    // bir sey demektir.
    const sure = Date.now() - t0;
    if (r.status >= 400) {
      console.log(`  ${ad.padEnd(22)} ENGELLENMIS?  (HTTP ${r.status}, ${sure}ms — araya giren bir sey var)`);
      return false;
    }
    console.log(`  ${ad.padEnd(22)} ULASILDI      (HTTP ${r.status}, ${sure}ms)`);
    return true;
  } catch (e) {
    const sebep = e?.name === 'AbortError' ? 'zaman asimi' : (e?.cause?.code || e?.message || 'bilinmiyor');
    console.log(`  ${ad.padEnd(22)} ULASILAMADI   (${sebep})`);
    return false;
  }
}

console.log('--- Ag erisimi ---');
const tiktokVar = await erisim('tiktok.com', 'https://www.tiktok.com/');
const eulerVar = await erisim('api.eulerstream.com', 'https://api.eulerstream.com/');
console.log('');

if (!tiktokVar) {
  console.log('!! Bu makine tiktok.com adresine ULASAMIYOR.');
  console.log('   Guvenlik duvari, VPN, kurumsal proxy ya da DNS engeli olabilir.');
  console.log('   Bu duzelmeden hicbir sey calismaz.\n');
}
if (!eulerVar) {
  console.log('!! Imza sunucusuna (api.eulerstream.com) ULASILAMIYOR.');
  console.log('   TikTok webcast adresi imzalanmak zorunda; bu olmadan baglanti kurulamaz.\n');
}

// ---------------------------------------------------------------------------
// 2) Gercek baglanti denemesi — hata SINIFI teshisi veriyor
// ---------------------------------------------------------------------------
const TESHIS = {
  UserOfflineError: [
    '>>> BORU HATTI CALISIYOR <<<',
    'Odayi bulabildi, imzalama gecti — sadece bu kisi su an canli yayinda degil.',
    'Canli birini dene ya da kendi yayinini ac. Teknik olarak her sey saglam.',
  ],
  InvalidUniqueIdError: [
    'Kullanici adi gecersiz. Basindaki @ olmadan, birebir yaz.',
  ],
  SignatureRateLimitError: [
    '>>> BORU HATTI CALISIYOR <<<',
    'Sadece imzalama limiti doldu.',
    'eulerstream.com uzerinden UCRETSIZ anahtar al (2500 istek/gun), sonra:',
    '   $env:EULER_API_KEY="<anahtar>"     (PowerShell)',
  ],
  SignAPIError: [
    'Imza sunucusu hata dondu. Gecici olabilir, birkac dakika sonra tekrar dene.',
    'Surerse EulerStream tarafinda sorun var demektir.',
  ],
  InvalidResponseCompositeError: [
    'Oda kimligi HICBIR kaynaktan alinamadi.',
    'Neredeyse her zaman AG sorunudur: tiktok.com engelli, VPN/proxy araya giriyor,',
    'ya da DNS cozmuyor. Yukaridaki ag erisimi satirlarina bak.',
    'Ag saglamsa ve kullanici adi dogruysa, TikTok tarafinda bir degisiklik olmus olabilir.',
  ],
  ConnectTimeoutError: [
    'Baglanti zaman asimina ugradi — ag yavas ya da engelli.',
  ],
};

let bagliOldu = false;

for (const kullanici of hedefler) {
  console.log(`--- @${kullanici} ---`);
  const c = new TikTokLiveConnection(kullanici, { enableExtendedGiftInfo: true });

  const sayac = { yorum: 0, hediye: 0, begeni: 0, takip: 0, paylasim: 0, katilan: 0 };

  c.on('chat', (d) => {
    if (sayac.yorum < 5) console.log(`   yorum    ${d.user?.uniqueId}: ${d.comment}`);
    sayac.yorum++;
  });
  c.on('gift', (d) => {
    // Seri hediyede her tik icin olay gelir; sadece seri bitince say.
    if (d.giftDetails?.giftType === 1 && !d.repeatEnd) return;
    const deger = (d.giftDetails?.diamondCount ?? 0) * (d.repeatCount ?? 1);
    console.log(`   HEDIYE   ${d.user?.uniqueId} -> ${d.giftDetails?.giftName} x${d.repeatCount} (${deger} elmas)`);
    sayac.hediye++;
  });
  c.on('like', (d) => { sayac.begeni += d.likeCount ?? 1; });
  c.on('follow', () => sayac.takip++);
  c.on('share', () => sayac.paylasim++);
  c.on('member', () => sayac.katilan++);

  try {
    const st = await Promise.race([
      c.connect(),
      new Promise((_, rej) =>
        setTimeout(() => rej(Object.assign(new Error('30 sn icinde cevap gelmedi'), { name: 'ConnectTimeoutError' })), 30000)
      ),
    ]);

    bagliOldu = true;
    console.log(`   BAGLANDI   roomId=${st?.roomId ?? '?'}`);
    console.log('   20 saniye dinleniyor...\n');

    await new Promise((r) => setTimeout(r, 20000));

    const toplam = Object.values(sayac).reduce((a, b) => a + b, 0);
    console.log('');
    console.log('   20 saniyede gelenler:');
    console.log(`     yorum ${sayac.yorum} · hediye ${sayac.hediye} · begeni ${sayac.begeni} · ` +
                `takip ${sayac.takip} · paylasim ${sayac.paylasim} · katilan ${sayac.katilan}`);
    console.log('');
    if (toplam > 0) {
      console.log('   >>> GERCEK VERI AKIYOR. Kopru ve overlay\'ler calisir. <<<');
    } else {
      console.log('   Baglanti KURULDU ama olay gelmedi — yayin cok sessiz olabilir.');
      console.log('   Baglantinin kendisi calisiyor; daha hareketli bir yayinda tekrar dene.');
    }
    try { c.disconnect(); } catch { /* zaten kapali */ }
    console.log('');
    break;
  } catch (e) {
    const sinif = e?.constructor?.name || e?.name || 'Error';
    console.log(`   HATA: ${sinif}`);
    console.log(`     ${String(e?.message || e).slice(0, 200)}`);
    const t = TESHIS[sinif] || TESHIS[e?.name];
    if (t) {
      console.log('');
      for (const satir of t) console.log(`     ${satir}`);
    }
    console.log('');
  }
}

console.log('==================================================');
if (bagliOldu) {
  console.log('SONUC: TikTok baglantisi CALISIYOR.');
  console.log('');
  console.log('  Sirada:  node server/bridge.js --user <kullaniciadin>');
  console.log('  OBS Tarayici Kaynagi:  http://localhost:8787/overlays/chat.html');
} else {
  console.log('SONUC: Baglanti kurulamadi.');
  console.log('');
  console.log('  Yukaridaki teshis satirlarini oku — hata sinifi sorunun ne oldugunu soyluyor.');
  console.log('  En sik sebep: test edilen kisi CANLI DEGIL.');
  console.log('  Kendi yayinini acip kendi kullanici adinla tekrar dene.');
}
console.log('==================================================');

process.exit(bagliOldu ? 0 : 1);
