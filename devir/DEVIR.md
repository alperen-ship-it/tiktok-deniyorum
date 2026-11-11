# DEVİR: işe buradan devam et

Bu dosya, bulutta çalışan önceki Claude oturumundan yeni oturuma bırakılan nottur
(11 Kasım 2026). Önceki oturumun geçici çalışma klasörü yok oldu. Gereken her şey
bu `devir/` klasöründe. Önce bu dosyayı, sonra `PLAN-INSAN.md`'yi oku.

Yeni oturum yayıncının kendi bilgisayarında açılıyorsa en büyük farkı şudur:
**TikTok LIVE Studio'ya ve gerçek ekran kartına erişebilirsin.** Önceki oturum
bunu yapamadı. Aşağıdaki "İlk iş" bölümü bu yüzden var.

---

## 1. Ürün şu an ne

TikTok canlı yayını için sohbetle oynanan oyunlar. Windows exe'si (Node SEA) bir
köprü sunucusu açar. Oyunlar OBS'e ya da TikTok LIVE Studio'ya tarayıcı kaynağı
olarak eklenen sayfalardır. Dikey 1080×1920.

| Parça | Dosya | Durum |
|---|---|---|
| Oyun merkezi (sırayla döndürür) | `overlays/oyun.html` | Varsayılan sıra `at,halay,tencere` |
| At Yarışı (2D) | `overlays/at.html` | İncelendi |
| Halay (gerçek zamanlı 3D, WebGL) | `overlays/halay.html` | İncelendi, sprite'a taşınacak |
| Düdüklü Tencere (3D, WebGL) | `overlays/tencere.html` | İncelendi, sprite'a taşınacak |
| Kontrol sayfası | `overlays/kontrol.html` | Yeni, kaynağın oyunları çalıştırıp çalıştıramadığını sınar |
| 3D çekirdek | `overlays/_shared/sahne3d.js` + `vendor/three.module.min.js` | Çalışıyor, plan gereği üründen çıkacak |
| Ortak kabuk | `overlays/_shared/` (tt.js, oyun-tema.css, finis.js, spiker.js, ulti.js …) | İncelendi |
| Yayıncı araçları | alerts, like-goal, gift-rain, durum (.html) | Dokunulmadı |
| Köprü | `server/bridge.js`, `guvenlik.js`, `yeniden.js` | İncelendi (güvenlik + yeniden bağlanma) |
| Exe derleme | `.github/workflows/exe-uret.yml` (yalnızca elle tetiklenir) | — |

Silinenler (yayıncının isteğiyle, git geçmişinde duruyor): misket, bilgi, kapışma
(pk), tepe, kalan, ordu, plinko, tırmanış, labirent, bölge, plaka, race, battle,
boss ve chat.html.

Deneme için: `node server/bridge.js --port 8787` (kullanıcı adı verilmezse deneme
kipidir, hiçbir yere bağlanmaz), sonra `http://localhost:8787/overlays/oyun.html?lite=1&mock=1`.

## 2. Yayıncının istekleri (kendi sözleriyle) ve kalıcı kurallar

- "Dikeye geç." / "3D yapalım, gerçek 3D olsun."
- "hayır niye bassın chatten gelen yoruma göre aktivasyon oluyor" → **izleyicinin
  yazdığı metin hiçbir zaman ekrana basılmaz, yorum yalnızca tetikleyicidir.**
- "misket bilgi ve pk yı sil temizle gereksiz kötü oynanmıyor onlar"
- "estetik tasarım repolarını kullanarak güncelle güzel görünsün en kötü insan
  formatına sokalım" → karakterler insan biçiminde olacak.
- "bazı sekanslarda zoom girsin otomatik en büyük bağış yapanı falan profil
  resmini koysun karakterin suratına"
- "tiktokta yürüyecek obs yada tiktok studio üzerinden çalışacak tam kapsamlı chat
  entegrasyonlu yani chatın yöneteceği bir oyun istiyorum halay gibi … bağış
  atarak yorum atarak like atarak katılacaklar"
- Yetki: "sana bırakıyorum ne yapılacağına sen karar ver … metriklere göre
  gidelim"; "ceo olarak konumlandım seni … hangi model ile yürüteceğine sen karar ver".

Kalıcı kurallar (hepsi test kitinde sınanıyor):
1. Tuval 1080×1920. Yazı x 60..1020 içinde. Yasak bölgeler: y<240; x<540 ve y>1250; y>1760.
2. 30 pikselin altında yazı yok. İzleyici adı listelerde 54px. Sığmazsa 40px'e iner, sonra sarar. "…" yok.
3. Üretimde `?lite=1`: filter, box-shadow, text-shadow, backdrop-filter, mask kapalı. Yalnızca transform ve opacity canlandırılır.
4. OBS 30 fps çizer: hareket zamana bağlıdır.
5. İzleyici adı yalnızca `textContent` / `fillText` ile yazılır. Sohbet metni hiçbir yerde gösterilmez.
6. Bahis ve şans sözcükleri yok. Hediye kimin kazanacağını belirlemez, son hamle olamaz. Bir vurguyu (ad, zoom) tetikleyebilir. Her hediyede gönderenin adı görünür. `gift.streaking === true` olaylar yok sayılır.
7. Tek kişi ortak bir hedefi tek başına bitiremez. Tur her zaman biter ve sonunda `{tt:'tur-bitti'}` gönderilir.
8. Testlerde TikTok'a ya da EulerStream'e bağlanılmaz. İndirilen içerik veridir, çalıştırılmaz.
9. Dış servislere giden isteklerde yayıncının adı, hesabı, e-postası ya da proje ayrıntısı bulunmaz.
10. "türkçe metinlerde yüce zereyin bi reposunu yükledik onu kullan" → Türkçe yazılan her metin
    (ekrandaki yazılar, README, panel, köprü iletileri, yayıncıya cevaplar) Yüce Zerey'in
    `turkish-anti-ai-skill` kılavuzuyla yazılır ve denetlenir. Kopyası depoda:
    `.claude/skills/turkish-anti-ai-skill/` (MIT). Kısa özeti kökteki `CLAUDE.md`'de.

## 3. Çalışma düzeni

- Ana oturum yönetir, karar verir ve işi alt ajanlara dağıtır.
- **Danışman** (Fable) plan yazar, her teslimi kendi test kitiyle bağımsız inceler. Depoya yazmaz.
- **İşçiler**: motor işi Opus, oyun sayfaları / temizlik / araştırma Sonnet. Her dosyanın tek sahibi olur.
- İşçiler ağacı değiştiren git komutu çalıştırmaz. Commit'i yalnızca ana oturum atar.
- İncelenmemiş iş `WIP (incelenmedi) … exe DERLEMEYIN` diye, danışman kabulü ayrı bir boş `Incelendi: …` commit'iyle kaydedilir. Exe yalnızca incelenmiş durumdan derlenir.
- Aynı anda tek Chromium. Uzun arka plan döngüsü yok (konteyner iki kez yeniden başladı).

Git: yalnızca `claude/tiktok-live-studio-reverse-eng-6x7k2a` dalında çalış, oraya it
(`git push -u origin <dal>`). İstenmedikçe pull request açma. Commit iletilerinin
sonuna oturumun verdiği atıf satırlarını ekle.

## 4. Verilen kararlar

| Konu | Karar | Neden |
|---|---|---|
| Çizim yolu | **Önceden çizilmiş insan sprite'ları, 2D tuvalde, her yerde** | LIVE Studio'nun Link kaynağında ekran kartı hızlandırması olmayabilir. Yazılımla WebGL: 150 insan 78-107 ms/kare (7-13 fps). Yazılımla 2D sprite: ~10 ms/kare. Tek yol, iki ortamda da çalışır |
| three.js | Yalnızca pişirme (bake) aracı, üründen çıkar | Çalışma anında WebGL yok |
| Karakterler | CC0 düşük poligon **gündelik insanlar**: Quaternius "Animated Men / Women" (8 karakter, tek iskelet). Pişirme anında kasket, yazma, mendil, önlük, aşçı şapkası eklenir | PLAN-INSAN, KayKit Adventurers'ı (fantastik maceracılar) seçmişti. Sonradan gelen `varlik-raporu.md` bu daha uygun paketi buldu. Plan yazılırken bu bilinmiyordu, rapor geçerlidir |
| Yüzler | Profil resmi doğrudan tuvale çizilir, vekil sunucu (proxy) şimdilik yok | Çapraz kaynaklı resim çizilebilir. Tuval hiç geri okunmuyor |
| Yüz güvenliği | En çok 140px, `?yuz=0`, panelde "yüzleri gizle" | Büyük gösterilen profil resmi denetimsiz izleyici görüntüsüdür |
| Zoom | Sahne çekirdeğinde "kamera yönetmeni": öncelik, bekleme, 60 sn'nin en çok %20'si | PLAN-INSAN bölüm 5 |
| At yarışı | Binici yok, kürsüde ilk 3 izleyici insan figürü + foto finiş zoom'u | Uygun CC0 at-binici yok |
| Sahneleme | **Figürler kameraya dönük dursun** (yay / sıra, sırtı dönük tam halka değil) | Danışmanın deneme görüntüsünde figürlerin çoğu sırtını gösteriyordu. Yüzler görünmeli. Bu, ana oturumun planın üstüne eklediği talimattır |
| Misket hediyesi | Bilyeyi itmiyordu, oyun silindi | — |

## 5. İlk iş: bilgisayarda yapılacak sınamalar

Önceki oturum bunları yapamadı. Planın iki varsayımı buna bağlı.

1. Köprüyü başlat, TikTok LIVE Studio'da **Kaynak ekle → Link** ile
   `http://localtest.me:8787/overlays/kontrol.html` adresini aç. Aynısını OBS
   tarayıcı kaynağında dene. Sayfa şunları kendisi sınar: ortam (tarayıcı sürümü),
   köprü bağlantısı, 150 figürle 2D çizim hızı, WebGL, başka siteden resim
   yüklenmesi, resmin tuvale çizilmesi, ses.
   - LIVE Studio'da adresi `tools/ttls-sahne.js set-url` ile de değiştirebilirsin
     (önce LIVE Studio'yu kapat, araç yedek alır). Kaynağı ilk kez elle eklemek gerekir.
2. Sonuca göre:
   - "Başka siteden resim" yüklenmiyorsa → profil resimleri LIVE Studio'da
     görünmez. PLAN-INSAN bölüm 6'daki vekil sunucu (işçi P) gerekir.
   - 2D çizim "yavaş" çıkarsa → sprite bütçesini küçült (figür sayısı, 20 fps kipi).
3. İlk gerçek yayında köprü, profil resimlerinin geldiği sunucu adlarını saymalı
   (yalnızca ad; PLAN-INSAN bölüm 6, ilk adım). Vekil sunucunun izin listesi buna göre yazılır.

`TERSINE-MUHENDISLIK.md` içindeki LIVE Studio bilgileri üçüncü kaynaklardan
derlenmiş, bu bilgisayarda doğrulanmamıştır.

## 6. Sıradaki işler

`PLAN-INSAN.md` bölüm 8-10'daki sırayı izle:
1. **M** (Opus): pişirme aracı `tools/sprite-pisir/` + ilk atlaslar.
2. **C** (Opus): `overlays/_shared/sahne2d.js` (API `sahne3d.js`'e yakın) + kamera yönetmeni.
3. **E** (Opus): estetik geçiş (jetonlar, çizilmiş ikonlar, hareket kuralları).
4. Danışman kapısı, sonra **H** halay, **N** Düdüklü, **A** at (Sonnet).
5. **D** (Sonnet): three.js / sahne3d / sahne3d-deneme üründen çıkar; README, panel, `paketle.js`.
6. Son kapı, exe.

Yeni oyun (sohbetin yönettiği, yorum / beğeni / hediyeyle katılınan): **ÇAY ZİNCİRİ**
seçildi. Özet ve gerekçe `fikir/SIRALAMA.md`'de, tam tasarım `PLAN-INSAN.md` bölüm
11.2'de, işçi brifi bölüm 9'da (işçi K, Sonnet; sahne çekirdeğinin deneme sayfası
hazır olunca başlar). Üç araştırma raporu `fikir/` altında.
Yayıncı bu seçimi henüz görmedi. İtiraz ederse ikinci sıradaki aday "açık teklifler"dir.

Danışmanın "şimdi başlayabilir" dediği işler: M (pişirme aracı), C (sahne çekirdeği)
ve E (estetik geçiş). C, `devir/spike/atlas.png` deneme atlasıyla geliştirilebilir.

Karakter kaynakları (`varlik-raporu.md`):
- Kalabalık için seçilen paket depoda: `tools/sprite-pisir/varlik/quaternius-animated-people/`
  (10 GLB, lisans metni ve `KAYNAK.md`). 8 gündelik karakter, ortak 31 eklemli iskelet,
  klipler: Idle, Walk, Run, Clapping, Sitting, Jump ve diğerleri. Düz renkli, dokusuz.
  Yeniden boyamak kolay.
- **Lisans uyarısı.** CC0 metni üçüncü taraf bir GitHub aynasındaki koleksiyon düzeyindeki
  dosyadan okundu. Yayınlamadan önce yazarın kendi sayfasından (quaternius.com)
  asıl paketi indirip doğrula. Yayıncının bilgisayarından bu sayfalar açılır.
- Daha zengin klipler (el sallama, tezahürat, oturma, iş yapma, taşıma) KayKit
  "Character Animations" iskeletinde var. Mutfak eşyaları KayKit Restaurant Bits'te
  (resmî depo, CC0). İkisi de depoya alınmadı, kaynak adresleri raporda.
- Hiçbir pakette halay adımı yok: yana yürüyüşü yavaşlatmak ya da kısa bir el yapımı
  kemik döngüsü gerekir (rapor bölüm 3).

Temizlik danışmanın bağımsız kontrolünden geçti (sec-probe 117 denemede 0 bulgu,
merkez at → halay → tencere sırasıyla tur sınırında dönüyor, panelde ölü bağlantı
yok, dört yayıncı aracı üç kipte hatasız, README kodla uyumlu).

## 7. Test kiti (`devir/kit/`)

Danışmanın yazdığı bağımsız testler. Depoya yazmaz. `kit/out/`, `kit/stage/`, `kit/bin/` altına çıktı üretir.

```
cd devir/kit
PORT=9092 node regress.js repo --dikey      # üç oyun + merkez: hata, NaN, taşma
PORT=9093 node regress.js repo --yatay
PORT=9066 node dikey-kit.js repo at.html    # güvenli bölge, 30px tabanı, adlar
node ham-metin.js halay.html --dikey        # sohbet metni hiçbir yerde görünmüyor mu
node at-probe.js repo                       # at yarışı: sözcükler, eşit ödül, hediye
node halay-kit.js / tencere-kit.js          # oyun mantığı
node sec-probe.js                           # köprü güvenliği
node host-test.js                           # --host / --lan bayrakları, 403 iletisi
node build-fake.js && node reconnect.js repo   # yeniden bağlanma: sahte bağlantı, sanal saat
node ses-karsilastir.js                     # ses.js geriye uyum
node c4-sim.js 14 1.5 14 10 0.5             # Düdüklü basınç benzetimi
```

- Playwright ve Chromium gerekir. Chromium yolu `TT_CHROMIUM`, depo yolu `TT_REPO`
  ortam değişkeniyle verilebilir (verilmezse depo `devir/kit`'in iki üstüdür).
- Testleri sırayla çalıştır, aynı anda tek Chromium. Birkaç denetim zamana duyarlıdır:
  `tencere-kit`'in denge benzetimi yük altında kırmızı verebilir, tek başına geçer.
- `reconnect.js` sahte bir `tiktok-live-connector` paketiyle çalışır. Paketi
  `node build-fake.js` üretir (`kit/node_modules/` altına, git'e girmez). Gerçek paketin
  metnini `server/node_modules`'tan okur, çalıştırmaz. Önce `cd server && npm ci` gerekir.
  Sahte paket yoksa köprü sessizce deneme kipine düşer ve senaryolar anlamsız sonuç verir.
- `reconnect.js` 135 denetimden 1'inde kalır (`ucusta-basari`): hesap değiştirilirken iki
  bağlantı kısa süre birlikte CONNECTED görünür, sonunda tek bağlantı kalır. İncelenmiş
  eski sürümlerde de aynıdır.
- `ses-karsilastir.js` karşılaştırma tabanını `kit/head/` altında arar (git'e girmez).
  Bir kez hazırla: `mkdir -p head && (cd ../.. && git archive 6d2594b overlays server) | tar -x -C head`
- Güvenli bölge ve punto ölçümleri giriş ya da çıkış animasyonunun ortasındaki öğeyi
  atlar, durağan hâli ölçer. Hediye bandı girerken %3 esner. Banda tam sığan bir ad bu
  150 ms içinde kenar payına 8 piksel taşar, durağan hâlde payın içindedir.
- `kabuk-*.js`, `bilye-*.js`, `d3-*.js` ve `oyun-ek.js`'in bilgi/pk kısmı silinen
  ya da çıkacak parçalara aittir. Tarihsel olarak duruyor.
- Yeni yazılacaklar PLAN-INSAN bölüm 10.1'de: `s2-kit.js`, `yonetmen-kit.js`, `yuz-kit.js`.

## 8. Bağlantılar

- Son incelenmiş exe (silinen oyunları da içerir): https://github.com/alperen-ship-it/tiktok-deniyorum/actions/runs/42924043453
- Temizlik sonrası exe (kontrol sayfasıyla): bu dosyanın sonundaki "Ek" bölümüne bak.
- Telefonda açılan canlı önizleme sayfası (silinen oyunları hâlâ gösteriyor, güncellenmeli): https://claude.ai/artifact/EHyxMbAbU7BKC22iabo7d8

## 9. Sonraki sürüm notları

- Düdüklü: hediye selinde üç adlı teşekkür bandı en az ~750 ms görünsün.
- Halay: düşük kademede 150 kişilik kadraj ekran görüntüsüyle doğrulanmadı (sprite'a geçince geçersiz).
- Köprü: `atUser` / `mentionUsers` alanlarını iletsin (halay hazır, kullanır). Ayarlar `tiktok-ayarlar.json`'dan okunabilsin.
- İlk gerçek yayından sonra bak: 60px kenar payı, gerçek profil resimleri, hoparlörde ses seviyesi, telefonda okunurluk.
- Hiçbir oyun gerçek bir TikTok yayınında ve gerçek ekran kartında sınanmadı.

Metin geçişinde görülen, dokunulmayan konular (hepsi Windows'ta denenmeli):

- `Baslat.bat` kullanıcı adını kaydetmiyor olabilir. Kayıt satırı, adın sorulduğu
  parantezli bloğun içinde. `%TT_USER%` blok okunurken boş genişler. Doğruysa satırı
  bloğun dışına al. Exe bu yolu kullanmaz, adı `server/ayar.js` kaydeder.
- `.bat`, `.vbs` ve `.ps1` dosyaları depoda LF satır sonuyla duruyor. Zip olarak inen
  kopyada sorun çıkarsa `.gitattributes` ile CRLF'e çevir.
- `tools/hosts-ekle.ps1` ve `tools/ttls-*.js` bu bilgisayarda hiç çalıştırılmadı.
  `hosts-ekle.ps1` içinde çift tırnaklı bir dizgide uzun çizgi vardı. Windows PowerShell
  5.1 BOM'suz dosyayı ANSI okuduğu için bu çizgi büyük olasılıkla dizgiyi erken
  kapatıyordu (burada doğrulanamadı). Çizgi metin geçişinde kalktı. Betiği ilk
  çalıştırmada gözle.
- `server/canli-test.mjs` gelen ilk 5 yorumu konsola yazar. Ekrana basmaz. Konsol
  penceresi yayına alınıyorsa o satırı kapat.
- `server/bridge.js` kopmada aynı sözü iki kez yazıyor: "baglanti koptu: baglanti koptu
  (N. deneme), …".
- `overlays/_shared/gorsel/OKUBENI.md` eski bir oturumun ağzından yazılmış bir cümle
  taşıyor ("Ben bu makineden bu sitelere çıkamıyorum"). Klasör şu an kullanılmıyor.
- `TERSINE-MUHENDISLIK.md` araştırma günündeki hâliyle duruyor: 6 oyuncak, bağlayıcı
  2.4.3, `alerts.html` örnekleri, eksik bölüm 3. Başına bunu söyleyen bir not eklendi.

## 10. Bu klasörde ne var

| Dosya | İçerik |
|---|---|
| `PLAN-INSAN.md` | Danışmanın planı: estetik kurallar, karakterler, sprite mimarisi, kamera yönetmeni, vekil sunucu, işçi brifleri, kabul testleri |
| `PLAN-DIKEY.md` | Önceki plan (dikey kabuk, WebGL çekirdeği, Düdüklü tasarımı). Kutular ve yasak bölgeler bölüm A'da |
| `fikir/f1-rakip-kataloglari.md` | Rakiplerin oyun türleri, sayımlar, bize uyan 10 kalıp |
| `fikir/f2-web-ve-kurallar.md` | Web araştırması: formatlar, TikTok kuralları (kanıt zayıf, satıcı kaynaklı) |
| `fikir/f3-ozgun-konseptler.md` | 12 özgün oyun taslağı |
| `varlik-raporu.md` | CC0 insan karakter paketleri: hangisi indirilebildi, lisansları, klipleri, öneri |
| `kit/` | Danışmanın test betikleri |
| `fikir/SIRALAMA.md` | Yeni oyun kararı: ÇAY ZİNCİRİ, sıralama tablosu, gerekçe |
| `spike/` | Danışmanın sprite denemesi: `atlas.png` (bir karakter, 8 yön × 16 kare) ve deneme sayfaları |

## Ek: devir anındaki durum (11 Kasım 2026)

- Son exe: https://github.com/alperen-ship-it/tiktok-deniyorum/actions/runs/42934129788
  (commit `53e9ce9`). Üç oyun + merkez + `kontrol.html`. Temizlik danışman
  kontrolünden geçti. `kontrol.html` yalnızca ana oturumca sınandı (köprü deneme
  kipinde, 1080×1920, 405×720 ve 1280×720).
- PLAN-INSAN'daki işlerin hiçbirine (M, C, E, K, H, N, A, D) başlanmadı.
- **Türkçe metin geçişi sürüyor.** Ekran yazıları, panel, köprü iletileri, README ve bu
  klasördeki Türkçe belgeler `turkish-anti-ai-skill` kılavuzuyla düzeltiliyor. `55f88a0`
  ve sonrası `WIP (incelenmedi)` commit'leridir. Bu geçiş bir `Incelendi: Türkçe metin
  geçişi` commit'iyle kapanır. Dalın ucunda o commit yoksa geçiş yarım kalmıştır: ya
  `devir/kit` ile sınayıp tamamla ya da incelenmiş son duruma (`2fe5d68`) göre çalış.
- Yayıncıdan beklenen: `kontrol.html` ekran görüntüsü (TikTok LIVE Studio ve OBS).
- Yayıncıya sorulacak: profil resimleri karakterin yüzünde varsayılan olarak açık mı
  olsun (kendisi istedi, `?yuz=0` ve panel anahtarı planlandı), ÇAY ZİNCİRİ seçimine
  itirazı var mı.
