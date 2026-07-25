# TikTok LIVE Studio — tersine mühendislik + yayın oyuncakları

Bilgisayarındaki `C:\Program Files\TikTok LIVE Studio` uygulamasının nasıl çalıştığı,
içine kendi HTML içeriğini nasıl sokacağın, ve yayına koyabileceğin **çalışır durumda
6 interaktif oyuncak**.

> **Not:** Bu depodaki kod bulut ortamında yazıldı ve orada test edildi. Uygulamanın
> kendisine erişim yoktu — LIVE Studio'ya dair bulgular topluluk tersine
> mühendisliğinden ve TikTok'un **kendi resmi Stream Deck eklentisinin** paketinden
> çıkarıldı. Her iddianın yanında güven seviyesi yazıyor. Kesin doğrulama için
> `recon/tls-recon.ps1`'i kendi makinende çalıştır.

---

## TL;DR — yayın açmadan önce yapman gereken tek şey

**`TikTokOyunlar.exe`'ye çift tıkla.** Hepsi bu.

İlk açılışta bir kere TikTok kullanıcı adını sorar, kaydeder, bir daha sormaz.
Sonra kontrol paneli tarayıcıda kendiliğinden açılır. Yayında değilsen
**"YAYIN BEKLENİYOR"** yazar ve yayına geçtiğin an kendiliğinden bağlanır —
programa geri dönmen gerekmez.

Panelden istediğin oyunun adresini kopyala:

| Nereye koyacaksın | Adres |
|---|---|
| **TikTok LIVE Studio** → Kaynak ekle → **Link** | `http://localtest.me:8787/overlays/labirent.html?lite=1` |
| **OBS** → Tarayıcı Kaynağı | `http://localhost:8787/overlays/labirent.html` |

⚠️ LIVE Studio'da `127.0.0.1` **reddedilebilir** (sürüme göre değişiyor, aşağıda
açıkladım). Yukarıdaki `localtest.me` adresi her iki durumda da çalışır — onunla
başla, uğraşma.

Exe'yi kapatmak = programı durdurmak. Yayın boyunca açık kalmalı (simge durumuna
küçültebilirsin).

### Exe'yi nereden alacaksın

Exe **depoda durmuyor** — 90 MB'lık ikili dosyalar git'e girmez (`.gitignore`).
Üç yolun var, en kolayı birincisi:

**1) GitHub üretsin, sen indir (Node kurmana gerek yok)**

1. Depo sayfası → **Actions** sekmesi
2. Soldan **"EXE üret"** → sağdaki **"Run workflow"** düğmesi
3. ~3 dakika bekle, yeşil tik gelsin
4. Aynı sayfanın altında **Artifacts** → `TikTokOyunlar` zip'ini indir
5. Zip'ten `TikTokOyunlar.exe` çıkar, çift tıkla

**2) Kendi makinende üret** — `paketle.bat` (bir kez Node gerekir)

**3) Kaynaktan çalıştır** — exe'ye hiç gerek yok:

```bat
node server/bridge.js --user senin_kullanici_adin
node server/bridge.js --mock                      # sahte veri, internet gerekmez
```

Ayrıntılar → [§0. Tek dosya exe](#0-tek-dosya-exe).

---

## 0. Tek dosya exe

`dist/TikTokOyunlar.exe` — **86 MB, yanına hiçbir klasör gerekmiyor.** Node'un
kendisi, köprü sunucusu ve bütün oyunlar tek dosyanın içinde gömülü. Kopyaladığın
makinede Node kurulu olması gerekmez.

### Nasıl üretiliyor

Node'un **SEA** (Single Executable Application) mekanizması: `node.exe`nin içine
kendi kodunu ve dosyalarını enjekte ediyorsun.

1. `esbuild` → `server/bridge.js` + bağımlılıkları tek bir `.cjs` dosyasına toplanır
2. `overlays/` altındaki her dosya **asset** olarak listelenir
3. nodejs.org'dan hedef işletim sisteminin `node` ikilisi indirilir
4. `postject` blob'u ikilinin içine enjekte eder

Çalışma anında `server/varlik.js` dosyaları nereden okuyacağını biliyor: kaynak
koddan çalışıyorsan diskten (düzenle-yenile döngüsü bozulmasın), exe'den
çalışıyorsan `sea.getRawAsset` ile içeriden.

```bat
paketle.bat                        REM Windows exe
node server/paketle.js --win --linux
```

### İlk çalıştırmada göreceklerin

**Windows SmartScreen uyarısı çıkacak.** Exe imzalı değil (kod imzalama
sertifikası yıllık ücretli). Uyarı ekranında **"Ek bilgi"** → **"Yine de çalıştır"**.
Bu beklenen bir durum, exe'yle ilgili bir sorun değil — imzasız her programda çıkıyor.

Ayarların `tiktok-ayarlar.json` olarak **exe'nin yanına** yazılır. Exe'yi başka
klasöre taşırsan ayarlar da taşınmalı, yoksa kullanıcı adını tekrar sorar.

### Exe ne yapmıyor

- **Kendi kendini güncellemiyor.** Oyunlarda değişiklik yaparsam `paketle.bat`'ı
  tekrar çalıştırman gerekir.
- **Yayını başlatmıyor.** Yayını her zamanki gibi LIVE Studio / OBS ile sen
  açıyorsun; exe sadece sohbet verisini çekip oyunları besliyor.

---

## 1. Uygulamanın iç yapısı — ne bulduk

### Ne üzerine kurulu

**Electron. Ama stok Electron değil — ByteDance'in kendi çatallaması: `TTElectron`.**
*(kanıtlanmış — User-Agent dizesi birden çok bağımsız projede birebir aynı)*

| LIVE Studio | Chromium | Electron |
|---|---|---|
| 0.52 | 104 | 20.1.0-tt.8 |
| 0.53 – 0.89 | 108 | 22.3.18-tt.8/tt.11 |
| **1.27+ (güncel)** | **136** | **36.4.0-alpha.17** |

```
Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko)
TikTokLIVEStudio/1.27.0 Chrome/136.0.7103.59 Electron/36.4.0-alpha.17
TTElectron/36.4.0-alpha.17 Safari/537.36
```

`-tt.N.release.main.NN` eki ve fazladan `TTElectron/` belirteci, bunun ByteDance'in
kurum içi derlemesi olduğunu gösteriyor. Yani stok Electron davranışına **birebir
güvenme** — bayraklar kaldırılmış olabilir.

**CEF değil, OBS/libobs değil.** Video tarafı ByteDance'in kendi **MediaSDK**'sı ve
ayrı bir native process olarak çalışıyor. *(kanıtlanmış — Douyin 直播伴侣 ile aynı bileşen)*

### Dosya yapısı

```
C:\Program Files\TikTok LIVE Studio\
├── TikTok LIVE Studio Launcher.exe
├── TikTok LIVE Studio Uninstaller.exe
└── <sürüm>\                              ← düz sürüm numarası: 1.27.0\  (app-1.27.0 DEĞİL)
    ├── TikTok LIVE Studio.exe
    ├── ffmpeg.dll, libEGL.dll, icudtl.dat, resources.pak …   ← Chromium bileşenleri
    └── resources\app\                    ← ★ ASAR YOK, KOD AÇIK DİZİNDE ★
        ├── package.json                  ← "branch", "build_id" — güncelleme kanalı
        ├── static\js\*.js                ← renderer kodu, düz minified JS
        ├── locales\Live_Studio\
        ├── node_modules\@bytedance-dev\gecko
        └── electron\sdk\lib\mediasdk_server.exe
```

**`app.asar` yok.** Kodu çıkarmana gerek yok, `resources\app\static\js\` içindeki
JS dosyalarını doğrudan açıp okuyabilirsin. *(kanıtlanmış — birden çok araç bu
dosyaları yerinde düzenliyor)*

### Kullanıcı verisi

`%APPDATA%\TikTok LIVE Studio\` *(kanıtlanmış — Roaming, LocalAppData değil)*

| Yol | İçerik |
|---|---|
| **`TTStore\services.json`** | **★ Sahne ve kaynak grafiği. En önemli dosya.** |
| `TTStore\store.json` | Uygulama durumu (`source` anahtarını silmek tuvali temizler) |
| `TTStore\localStore.json` | Efekt önbelleği |
| `logs\renderer.log` | Renderer logu — içinde protobuf dökümleri var |
| `Network\Cookies` | Chromium SQLite çerez veritabanı |
| `gecko_cache\` | ByteDance Gecko sıcak-güncelleme paketleri |

`services.json` şeması:
```
SourceService.state.scenes       → [{ id, name }, …]
SourceService.state.sceneSource  → { <sahneId>: { data: { <kaynakId>: {…} } } }
  kaynak → { type, name, payload: { url, … } }
  Link (tarayıcı) kaynağı → type === 'browser',  payload.url
```

Bu dosyayı okumak/düzenlemek için: `node tools/ttls-sahne.js list`

### Yan processler

`MediaSDK_Server.exe`, `AISDK_Server.exe`, `AIEngine.exe`, `EffectProvider.exe`,
`VoiceAssistant.exe`, `tt_crash_reporter.exe`

### ★ Gizli yerel API — Stream Deck soketi

**En değerli bulgu.** LIVE Studio, Elgato Stream Deck entegrasyonu için `127.0.0.1`
üzerinde bir **Socket.IO sunucusu** açıyor. TikTok'un kendi resmi eklentisi bununla
konuşuyor. *(kanıtlanmış — protokol resmi eklentinin paketinden çıkarıldı)*

```
ws://127.0.0.1:<port>/socket.io/?EIO=4&transport=websocket
alt protokol : streamdeck_ttls_v1
aday portlar : 28189  39728  34246  42205  38534  40825  40622
kanallar     : stream_deck/join_room
               stream_deck/sync_settings
               stream_deck/action_emit
               stream_deck/device_status_emit
el sıkışma   : join_room gönder → cevap gelince sync_settings gönder
```

Sunucu cevabında `scene` (aktif sahne) ve `scene_list: [{name, sources:[{label,value}]}]`
geliyor. Eylemler arasında **sahne değiştirme** ve **kaynak gösterme/gizleme** var —
ayrıca yayın başlat/bitir, mikrofon, kayıt, anket, hedef, hazine kutusu.

**Eklentide token/parola yok** → endpoint muhtemelen kimlik doğrulamasız. Yani kendi
scriptinle uygulamayı sürebilirsin.

Konuşmak için: `node tools/ttls-control.js scan` sonra `listen`.

### Eklenti sistemi

**Genel amaçlı eklenti API'si yok.** Uygulama mağazası yok, "Apps" sekmesi yok.
Genişletilebilirlik yüzeyi tam olarak üç şey: **Link kaynağı (tarayıcı)**, **Stream
Deck eylemleri**, **kısayol tuşları**.

---

## 2. Kaynak tipleri — ve "Link" meselesi

**LIVE Studio'da tarayıcı kaynağı VAR. Adı "Link".** *(kanıtlanmış — dahili tip
adı `browser`, `services.json` içinde böyle geçiyor)*

`Kaynak ekle → Link` → "Link Source Settings" penceresi.

Tam kaynak listesi:
- **Yakalama:** Kamera, Ekran yakalama, Pencere yakalama, **Oyun yakalama**, Yakalama kartı, Cast (iOS/Android)
- **Medya:** Resim, Video, Metin, **Link** (= tarayıcı)
- **Widget:** Hedef, Geri sayım, Hatırlatıcı, Sohbet kutusu, Liderlik tablosu, Yayın aktarma
- **Ses kaynak değil** — ayrı bir Ses Karıştırıcı paneli var

### ⚠️ Link kaynağının 6 tuzağı

Bunları bilmezsen overlay'in sessizce boş kalır. Hepsi bu depoda çözülmüş durumda:

**1. `localhost` / ham IP — ÇELİŞKİLİ BULGU, en önemli madde.**

Üç bağımsız araştırma, üç farklı sonuç verdi:

| Kaynak | İddia |
|---|---|
| `dOtExE97/botexe-studio` (2026, bakımlı) | localhost ve IP **reddediliyor**, kodda `localtest.me`'ye çeviriyor |
| `vicentefelipechile/stream-persona-overlay` | localhost, IP **ve port** reddediliyor; `:80` ile hosts dosyası kullanıyor |
| Bir overlay sağlayıcısının kılavuzu | `http://127.0.0.1:PORT` **kabul ediliyor** |

Muhtemelen **sürüme göre değişiyor** (doğrulama kodu bir noktada eklendi/gevşetildi).

> **Sıralama böyle dene — ilki tutarsa gerisine bakma:**
> 1. `http://127.0.0.1:8787/overlays/alerts.html?lite=1` — en basit
> 2. `http://localtest.me:8787/overlays/alerts.html?lite=1` — **her durumda çalışır**
> 3. `http://localtest.me/overlays/alerts.html?lite=1` — port da reddediliyorsa
>    (köprü 80'i de dinliyor)
> 4. `powershell -File tools\hosts-ekle.ps1` (yönetici) → `http://yayin.local:8787/...`
>    — modeminin DNS-rebind koruması `localtest.me`'yi engelliyorsa (FritzBox vb.)
>
> `localtest.me` herkese açık bir alan adı ve DNS'i kalıcı olarak `127.0.0.1`'e
> çözülüyor — yani trafik makineden dışarı çıkmıyor, sadece doğrulamayı geçiyor.

**2. Link kaynağı fare/klavye almıyor.** OBS'teki "Interact" karşılığı yok; sayfa
salt görüntü. Yani oyuncağı **tıklamayla değil, TikTok olaylarıyla** sürmelisin.
> Bu depodaki 6 oyuncak zaten öyle çalışıyor — hiçbiri tıklama beklemiyor.

**3. Sayfanın alt kaynakları AYNI HOST'tan gelmeli.** Sayfa `localtest.me`'den
yüklenip WebSocket'i `127.0.0.1`'e giderse engelleniyor → sayfa yüklenir ama
**overlay görünmez**. En sinsi tuzak bu.
> **Çözüm:** `tt.js` WebSocket adresini `location`'dan türetiyor, sabit yazmıyor.

**4. Gömülü tarayıcıda GPU hızlandırma YOK.** `blur`, `backdrop-filter`, `drop-shadow`
yazılımda hesaplanıyor ve kare hızını yerle bir ediyor.
> **Çözüm:** Adrese `?lite=1` ekle — pahalı efektler kapanır, yazıya ucuz kontur gelir.
> Görünüm neredeyse aynı, maliyet ~10 kat düşer.

**5. Link kaynağının sesi sessizce ölüyor** *(bilinen hata)*.
> **Çözüm:** Yayına girdikten sonra ve her sahne değişiminde kaynağı **Gizle → Göster** yap.

**6. Sahne başına en fazla 10 kaynak** *(muhtemel)*.

Ayrıca yok: özel CSS alanı, genişlik/yükseklik ayarı, "sahne aktif olunca yenile",
"etkileşim" penceresi. `file:///` muhtemelen çalışmıyor (alan adı doğrulamasıyla çelişiyor).

### OBS ile karşılaştırma

| | LIVE Studio "Link" | OBS "Tarayıcı Kaynağı" |
|---|---|---|
| Şeffaf arka plan | ✅ | ✅ (gerçek alfa, kanıtlanmış) |
| `localhost` | ⚠️ sürüme göre | ✅ |
| GPU hızlandırma | ❌ yok | ✅ (varsayılan kapalı, açılabilir) |
| Özel CSS alanı | ❌ | ✅ |
| Fare/klavye (Interact) | ❌ | ✅ |
| Sahne aktifken yenile | ❌ | ✅ |
| Sayfa sesini miksere al | ❌ | ✅ |

Overlay işi için OBS teknik olarak açık ara üstün. **Ama TikTok'a OBS ile yayın
yapmanın ciddi bir bedeli var** — aşağıya bak.

### ⚠️ OBS ile TikTok'a yayın: bilmen gereken 3 şey

**1. Yayın anahtarı her yayında değişiyor.** *(kanıtlanmış — Aitum eklentisinin
dil dosyasında bu uyarı birebir var)* Anahtarı `livecenter.tiktok.com/producer`
üzerinden alıyorsun ve **her yayın öncesi yeniden yapıştırman gerekiyor**.

**2. TikTok, OBS'in hizmet listesinde YOK.** *(kanıtlanmış — OBS'in
`services.json` dosyasında 84 hizmet var, TikTok yok)* Ayarlar → Yayın →
Hizmet: **"Özel…"** seçip Sunucu + Anahtar'ı elle gireceksin. Bu ayrıca OBS'in
TikTok için bit hızı/keyframe sınırı uygulamadığı anlamına geliyor.

**3. ★ %50 oyun içeriği kuralı.** 7 Temmuz 2025'ten beri TikTok, üçüncü taraf
yazılımla (OBS, Streamlabs, Restream) yayın erişimi için **yayınlarının en az
%50'sinin oyun içeriği olmasını** şart koşuyor. Erişimin iptal edilirse 14 gün
sonra yeniden başvurabiliyorsun. *(bu belgedeki en iyi kanıtlanmış kısıt —
Streamlabs, Restream ve StreamElements destek sayfaları birbirini doğruluyor)*

> **Oyun yayını yapmıyorsan OBS yolu senin için kırılgan.** LIVE Studio bu kuralın
> dışında — TikTok'un kendi uygulaması olduğu için. Bu, LIVE Studio'nun teknik
> kısıtlarına katlanmanın en güçlü sebebi.

Ayrıca: TikTok Shop yayınlarında **ekranın %50'sinden fazlasını kaplayan sabit
içerik yasak** — overlay ağırlıklı, kamerasız bir sahne buna takılabilir.

**OBS için dikey ayarlar:** 1080×1920, 30 fps, H.264 High, CBR, keyframe 2 sn,
~4000–6000 kbps, AAC 128 kbps. Yatay ve dikey kanvası aynı anda kullanmak için
**Aitum Vertical** (veya yerine geçen **Aitum Stream Suite** — ikisi birden
kurulmuyor). OBS'in kendi çoklu-kanvas desteği motor seviyesinde var ama
**arayüzü yok**, eklenti şart.

Bu depodaki overlay'ler OBS'te ekstra ayar istemiyor: `?lite=1` ve `?bg=` olmadan
kullan, şeffaflık kendiliğinden çalışır.

---

## 3. Oyuncaklar

Hepsi hazır, gerçek tarayıcıda test edildi (WebSocket bağlanıyor, olaylar akıyor,
konsol temiz). İki gruba ayrılıyorlar:

**Widget'lar** — izleyici bakar, etkileşim tek yönlü:
`alerts` · `chat` · `gift-rain` · `like-goal` · `battle` · `race` · `durum`

**Oyunlar** — izleyici *oynar*, yorumu oyunu değiştirir:
`labirent` · `tirmanis` · `boss` · `plinko` · `ordu` · `bolge`

> **Not:** LIVE Studio'nun kendi hazır widget'ları var — Uyarılar, Sohbet Kutusu,
> Hedef, Liderlik Tablosu, Geri Sayım. Buradaki `alerts` / `chat` / `like-goal`
> onlarla örtüşüyor; farkı tamamen senin kontrolünde olması (renk, metin, animasyon,
> eşikler). **Oyunların hiçbirinin yerel karşılığı yok** — asıl değer orada.

---

### Oyunlar — sohbet oynuyor

Altısında da aynı iki kural geçerli:

- **Yorum + beğeni = ana döngü.** Herkes bedava katılabiliyor.
- **Hediye = ULTİ.** Elmas değerine göre 5 kademe, her birinin adı ve görsel
  efekti farklı: 🔥 ATEŞ TOPU (≥0) · ⚡ YILDIRIM (≥10) · ☄️ METEOR YAĞMURU (≥100) ·
  🌋 KIYAMET (≥1000) · 💀 İNFAZ (≥10000).
  Ayrıca **kombo barı**: yorum ve beğeniler ortak bir barı doldurur, dolunca
  *bedava takım ultisi* patlar — hediye gönderemeyen izleyici de ulti hissi yaşar.

Her oyun, ilk yorum gelene kadar **"nasıl oynanır"** perdesi gösterir; ilk
etkileşimde perde kalkar ve oyun başlar. Uzun sessizlikte kurallar ince bir şerit
olarak geri gelir (sonradan katılan izleyici için).

#### 🧭 `labirent.html` — 4 yönlü labirent
İzleyiciler `sol` / `sağ` / `yukarı` / `aşağı` yazar, en çok oy alan yöne gidilir.
Duvara çıkan yönler ✕ ile işaretlenir. Hazine topla, hayaletlerden kaç.
Ultiler: duvar kır · 3 adım koş · canavarları dağıt · hazineleri topla · çıkışa ışınlan.
`w a s d`, `← → ↑ ↓`, `2 4 6 8` yazımları da sayılıyor.

#### 🧗 `tirmanis.html` — ortak tırmanış
Üç aday platform gösterilir, sohbet `sol` / `zıpla` / `sağ` yazarak seçer.
Yükseldikçe rekor kırılır. Beğeni gücü doldurur.

#### 🐉 `boss.html` — ortak canavar avı
Ne yazarsan yaz vuruyorsun (%12 kritik). Boss düşünce bir sonrakine geçilir, her
tur güçlenir. Hasar tablosu ve MVP var. Gecikmeli "hayalet" can barı — vuruşun ne
kadar götürdüğü gözle görülüyor.

#### 🎯 `plinko.html` — yaz, topun düşsün
Her yorum bir top bırakır, klasik plinko dağılımı (kenarda ×25, ortada ×0.5).
Ulti kademeleri 3 / 8 / 18 top veriyor, üst kademeler kenara nişanlı atıyor.

#### ⚔️ `ordu.html` — şeritli otomatik savaş
Takımını yaz (`mavi` / `kırmızı`), askerin sahaya iner. Hediye kahraman çağırır
(🗡️ 🛡️ 🐺 🐲 ☠️, çarpan 3 → 110). Şerit tabanlı simülasyon: yüzlerce birim ucuza dönüyor.

#### 🗺️ `bolge.html` — harita boyama
Takımını yaz, haritayı boya. Beğeni de boyar. Sınır organik büyüyor.
Yeni gelen izleyici geride kalan takıma yazılıyor — maç tek taraflı kilitlenmiyor.

---

### Görsel (sprite) eklemek — isteğe bağlı

Oyunlardaki karakterler varsayılan olarak **emoji** (🐹 🧗 👻). İstersen kendi
PNG'ini koyup değiştirebilirsin: `overlays/_shared/gorsel/` klasörüne doğru
isimle at, oyun otomatik olarak emoji yerine onu kullanır.

| Dosya | Nerede |
|---|---|
| `labirent-kahraman.png` | Labirentteki karakter |
| `labirent-canavar.png` | Labirentteki canavarlar |
| `tirmanis-kahraman.png` | Tırmanan karakter |

Saydam arka planlı PNG, 96–256 piksel arası, karakter ortada olsun. Ücretsiz
(CC0) kaynaklar: **kenney.nl/assets**, **opengameart.org** (CC0 filtresi),
**itch.io/game-assets/free**.

Görsel yoksa ya da yüklenemezse oyun sessizce emojiye düşer — **hiçbir şey
bozulmaz.** Ayrıntı → [`overlays/_shared/gorsel/OKUBENI.md`](overlays/_shared/gorsel/OKUBENI.md)

### Widget'lar

#### 📊 `durum.html` — dışarıdan çekilen veri kartı
Valorant rankın, çalan şarkı, hava durumu… `server/veri-kaynaklari.json`'a bir API
tanımlıyorsun, köprü periyodik çekip overlay'e yolluyor.
İstek **sunucudan** gidiyor: CORS'a takılmıyor ve API anahtarın yayında ekranda görünmüyor.
`?kaynak=valorant&baslik=RANK&ana=rank&alt=puan,sonMac&gorsel=gorsel&kose=sag-ust`
Başlamak için `server/veri-kaynaklari.ornek.json`'ı kopyala.

#### 🔔 `alerts.html` — Uyarılar
Hediye / takip / paylaşım / abone bildirimi. Elmas değerine göre 4 kademe: büyük
hediyede kart sallanır ve konfeti patlar. Kuyruk var, hediye yağmurunda ekran kusmaz.

### 💬 `chat.html` — Sohbet duvarı
Yorumlar alttan yükselir, üstte yumuşakça silinir. Mod/abone rozetleri, isme özel
sabit renk, hediye satırları ayrı stilde.
`?limit=20` mesaj sayısı · `?ttl=30` 30 sn sonra sil · `?joins=1` katılanları göster

### 🌧️ `gift-rain.html` — Hediye yağmuru
Hediyeler ekrandan yağar, beğeniler kalp balonu olarak yükselir. Sağ üstte elmas
kombo sayacı (6 sn hediye gelmezse sıfırlanır). Miktar ve boyut elmas değerinin
`log10`'una göre ölçekleniyor — 35.000 elmaslık hediye ekranı kilitlemiyor.
`?max=600` parçacık sınırı

### 🎯 `like-goal.html` — Hedef çubuğu
`?mode=likes|diamonds|follows|shares` · `?goal=5000` · `?label=ÖZEL YAZI`
`?next=1` → hedefe ulaşınca hedefi ikiye katlayıp devam eder (yayın boyu uğraş kalır)

### ⚔️ `battle.html` — Takım savaşı
İzleyiciler sohbete yazarak oy verir, hediye gönderen kendi takımını güçlendirir.
Oy vermemiş biri hediye gönderirse geride kalan takıma yazılır (kendini dengeler).
`?a=Kediler&b=Köpekler&ka=kedi&kb=köpek` · `?dur=180` geri sayım · `?perdiamond=1`
elmasla orantılı ağırlık · `?giftw=10` hediye kaç oy

Tek harfli anahtarlarda kelime sınırı kontrolü var — "araba" yazan biri A'ya oy vermez.

### 🏁 `race.html` — Sohbet yarışı
Yorum yazan herkes bir yarışçı olur. Yorum ilerletir, hediye fırlatır, ilk bitiren kazanır.
`?lanes=10` şerit · `?step=3&boost=40` · `?auto=1` otomatik yeniden başlat ·
`?decay=1` saniyede %1 geri kayma (kimse öne kaçamasın)

### Her overlay'de çalışan ortak parametreler

| Parametre | Ne yapar |
|---|---|
| `?lite=1` | **LIVE Studio için şart.** Pahalı efektleri kapatır. |
| `?mock=1` | Sunucu olmadan sahte olay üretir — `file://` ile bile çalışır |
| `?bg=green` | Yeşil zemin (chroma key gerekirse) — `green\|magenta\|blue\|#RRGGBB` |
| `?scale=1.4` | Tümünü büyüt/küçült |
| `?debug=1` | Sağ altta bağlantı göstergesi + konsol logu |
| `?src=tikfinity` | Olay kaynağını zorla (`bridge` \| `tikfinity`) |
| `?perde=1` | Arkayı karartan perde — oyun ana içerikse aç |
| `?guvenli=1` | Ölü bölgeleri kırmızı tarayarak göster (**yayına alma**) |

### Dikey / yatay — Dual layout

LIVE Studio'nun **Dual layout**'unda aynı Link kaynağı hem dikey hem yatay sahnede
görünüyor ve içeriğini değiştiremiyorsun — sadece kutunun boyutu değişiyor. Yani
tek bir sayfa iki farklı en-boy oranında çalışmak zorunda.

Sayfa bunu **kendisi ölçüyor**: en/boy oranına bakıp yerleşimi ve ölü bölge
paylarını değiştiriyor. İki sahneye de aynı adresi ekleyebilirsin, ekstra bir şey
yapman gerekmiyor.

| Parametre | Ne yapar |
|---|---|
| _(hiçbiri)_ | **Önerilen.** Oranı ölçüp kendi karar verir |
| `?v=1` | Dikeye zorla |
| `?y=1` | Yataya zorla |

### Ölü bölgeler

TikTok LIVE izlerken ekranın büyük kısmını TikTok'un **kendi arayüzü** kaplıyor:
üstte yayıncı bilgisi ve en çok hediye gönderenler, altta kayan yorum akışı ve
hediye çubuğu, sağda beğeni/paylaş/hediye ikonları. Oraya koyduğun her şey
izleyicide **görünmez**.

İki kademe var:

| Kademe | Ne için | Dikey (üst/alt/sağ/sol) | Yatay |
|---|---|---|---|
| `--dz-*` gevşek | Kısa ömürlü uyarılar | %14 / %32 / %17 / %4 | %10 / %14 / %6 / %6 |
| `--dz2-*` sıkı | **Kalıcı şeyler: oyun tahtası, skor** | %22 / %42 / %19 / %8 | %13 / %18 / %26 / %7 |

Sıkı kademe neden daha geniş: (1) alttaki %32 kimsenin yeri — TikTok'un sert
blokladığı %26'nın üstünde ama yorum akışının gerçekte ulaştığı %39-44'ün altında;
(2) **yanlardan kırpılma** — 1080×1920 yayın, 19.5:9 veya 20:9 bir telefonda ekranı
doldururken her kenardan %9-12 kırpılıyor.

URL'den ayarlanabiliyor: `?dzust=14&dzalt=32&dzsag=17&dzsol=4` ve `?dz2alt=45`
`?genis=1` → oyunları da gevşek alana al.

> ⚠️ **Bu yüzdeleri kendi telefonunda doğrula.** LIVE Studio'nun "mobil önizleme"
> düğmesiyle 10 dakikada hepsini yanlışlayabilirsin. Değerler topluluk
> ölçümlerinden geliyor, TikTok arayüzü de sürekli değişiyor.

Göstergenin rengi: 🟢 canlı · 🟠 mock · 🔵 bağlanıyor · 🔴 kopuk

---

## 4. Olay verisi nereden geliyor

**Önce net olalım: TikTok'un resmî canlı yayın olay API'si YOK.**
*(kanıtlanmış — TikTok'un webhook listesi tam olarak 4 olay içeriyor, hiçbiri canlı
yayınla ilgili değil; scope listesinde `live.*` yok)*

Ortakçı (partner) kapısı arkasında `live.room.info` / `live.room.manage` scope'ları
var ama bunlar sadece **izleyici sayısı** veriyor — sohbet, hediye, beğeni yok.
Gerçek zamanlı olay isteyen herkes aynı tersine mühendislik yüzeyini kullanıyor.

Bu depo **üç yolu da** destekliyor:

### Yol A — TikFinity (en kolay, kod yok)
TikFinity Desktop kuruluysa `ws://127.0.0.1:21213/` üzerinden ham JSON olay yayınlıyor.
`tt.js` bu formatı zaten konuşuyor — **köprüye hiç gerek yok**, imzalama derdi yok,
API anahtarı yok. Overlay'i açman yeterli, otomatik bulur.

Kapalı kaynak ve o da aynı tersine mühendisliğe dayanıyor, ama bakımını **başkası**
yapıyor — TikTok protokolü değiştirdiğinde senin kodun bozulmuyor.

### Yol B — Bu depodaki köprü (bağımsız)
```bat
cd server && npm install
node bridge.js --user senin_kullanici_adin
```
`tiktok-live-connector` v2.4.3 kullanıyor. İki teknik detay:
- Paket **ESM-only**; köprü CommonJS olduğu için dinamik `import()` ile yüklüyor
  (`require()` ile v2'nin sınıfına ulaşılmıyor — yaygın bir tuzak)
- TikTok'un webcast adresi **imzalanmak zorunda**; bunu yapan tek sürdürülen servis
  **EulerStream**. Ücretsiz katman **2500 istek/gün** — bir istek = bir *bağlantı*,
  mesaj başına değil, yani tek yayıncı için fazlasıyla yeter.
  ```bat
  set EULER_API_KEY=<anahtarin>
  node bridge.js --user kullaniciadin
  ```
- **`sessionid` çerezi gerekmiyor** — sadece okuma için kimlik bilgisi istemiyor.
  (Zaten isteme: çerezini üçüncü taraf imza sunucusuna göndermiş olursun.)

### Yol C — Mock (geliştirme)
```bat
node server/bridge.js --mock --rate 3
```
Sahte yorum/hediye/beğeni üretir. İnternet gerekmez, yayında olman gerekmez.
Gece 3'te animasyon ayarlamak için doğru araç bu.

### Hediye serisi tuzağı

Kullanıcı ucuz bir hediyeye basılı tuttuğunda **her tık için ayrı olay** gelir
(`repeatCount` artarak). Seri, `repeatEnd: true` olan son bir olayla biter.
**Tek dokunuşta bile olay iki kere gelir.** Saymazsan bütün sayaçların şişer.

Bu depoda çözülmüş:
```js
if (giftType === 1 && !repeatEnd) return;   // seri devam ediyor, sayma
const değer = repeatCount * diamondCount;
```

---

## 5. Araçlar

| Araç | Ne yapar |
|---|---|
| `recon/tls-recon.ps1` | **Kendi makinende çalıştır.** Kurulumu tarar, sürümü, dosya yapısını, `services.json` sahnelerini, açık portları tek rapora döker. Hiçbir şeyi değiştirmez. |
| `tools/ttls-control.js` | Stream Deck yerel API'sine bağlanır. `scan` → port bul, `listen` → gelen her şeyi dök, `info` → sahne/kaynak listesi |
| `tools/ttls-sahne.js` | `services.json`'u okur, Link kaynaklarının adresini değiştirir (otomatik yedekli) |
| `tools/hosts-ekle.ps1` | `localtest.me` çalışmazsa yerel alan adı oluşturur (yönetici) |
| `server/bridge.js` | Olay köprüsü + overlay dosya sunucusu + kontrol paneli |
| `server/ws-mini.js` | Bağımlılıksız WebSocket sunucusu — `npm install` yapamasan bile mock çalışsın diye |

### Önerilen sıra

```powershell
# 1) Uygulamayı AÇIK bırak, sonra:
powershell -ExecutionPolicy Bypass -File recon\tls-recon.ps1
#    → tls-recon-raporu.txt çıkar, bana yapıştır

# 2) Yerel API açık mı:
node tools\ttls-control.js scan
node tools\ttls-control.js listen        # uygulamada sahne değiştir, ne geldiğini gör

# 3) Sahnelerini gör:
node tools\ttls-sahne.js list
```

---

## 6. Kendi oyuncağını yaz

`overlays/` içine bir HTML dosyası koy, `_shared/tt.js`'i çağır, bitti:

```html
<!doctype html>
<html><head>
  <meta charset="utf-8">
  <link rel="stylesheet" href="_shared/base.css">
</head><body>
  <div id="ekran"></div>
  <script src="_shared/tt.js"></script>
  <script>
    TT.on('gift', ev => {
      // ev.gift = { id, name, image, diamonds, count, value, streaking }
      if (ev.gift.streaking) return;               // seri bitene kadar bekle
      ekran.textContent = `${ev.user.nickname} → ${ev.gift.name} (${ev.gift.value}💎)`;
    });

    TT.on('chat',   ev => console.log(ev.user.nickname, ev.comment));
    TT.on('like',   ev => console.log('+' + ev.likes));
    TT.on('follow share subscribe member', ev => console.log(ev.type));
    TT.on('viewers', ev => console.log(ev.count + ' izleyici'));
    TT.on('*',      ev => console.log('her şey:', ev.type));
  </script>
</body></html>
```

Test etmek için `dosyaadi.html?mock=1` aç — sunucu bile gerekmez.

### Olay şeması

```js
{
  type: 'chat'|'gift'|'like'|'follow'|'share'|'member'|'subscribe'|'viewers',
  ts: 1784928808048,
  user: { id, uniqueId, nickname, avatar, isModerator, isSubscriber, followRole },

  comment: '...',                                        // chat
  gift: { id, name, image, diamonds, count, value, usd, streaking },   // gift
  likes: 5, totalLikes: 1234,                            // like
  count: 420,                                            // viewers
}
```

### `TT` yardımcıları

`TT.esc(s)` XSS kalkanı (yorumlar kullanıcıdan geliyor — **asla ham HTML basma**) ·
`TT.avatar(user)` · `TT.giftEmoji(gift)` · `TT.short(1234)` → `1.2B` ·
`TT.hue(seed)` kişiye sabit renk · `TT.loop(dt => …)` oyun döngüsü ·
`TT.fire(ev)` elle olay tetikle

---

## 7. Doğrulanmamış olanlar

Dürüst olmak gerekirse şunları kanıtlayamadık:

- **`--remote-debugging-port` / DevTools çalışıyor mu.** Hiçbir yönde kanıt yok.
  ByteDance çatallaması bayrağı kaldırmış olabilir. Recon scripti bunu deniyor.
- **Link kaynağının port kabul edip etmediği** — iki kaynak çelişiyor (bu yüzden
  köprü hem 8787'yi hem 80'i dinliyor).
- **Stream Deck soketinde sunucu tarafı kimlik doğrulaması var mı** ve portun 7
  adaydan rastgele mi seçildiği.
- **`ttls-control.js`'in komut gönderme kısmı** — protokol resmi eklentiden çıkarıldı
  ama gerçek uygulamaya karşı test edilmedi. Bu yüzden varsayılan mod `listen`.
- **Sahne başına 10 kaynak sınırı** (muhtemel, kesin değil).
- **macOS sürümünde Link kaynağı var mı.**
- **Güncel tam sürüm numarası** — 1.27.0 kodda alt sınır olarak doğrulandı, 1.29.2
  tek kaynaklı.

`recon/tls-recon.ps1` çıktısını paylaşırsan bunların çoğu netleşir.

## Kaynaklar

Bulgular şu projelerin kaynak kodundan çıkarıldı:
`fefecal/ajazz-tiktok-live-studio-plugin` (TikTok'un **resmi** Stream Deck eklentisi —
yerel protokolün kaynağı) · `Zumbisinho/GD-TiktokLive` (`services.json` şeması) ·
`dOtExE97/botexe-studio` (Link kaynağı URL kuralları, `localtest.me`) ·
`xinzongTT/tiktok_vcam_bypass` (dosya yapısı) · `Renamezyx/python` LSTools ·
`Loukious/TikTokStreamKeyGenerator` (UA/sürüm sabitleri) ·
`NoMercy-ac/NoMercy` (yakalanmış gerçek kurulum yolları) ·
`zerodytrash/TikTok-Live-Connector` · `isaackogan/TikTokLive` ·
`steveseguin/social_stream` · `streamlabs/desktop`

---

## Lisans / sorumluluk

Kendi yayınının verisiyle, kendi makinendeki uygulamayla çalışmak için yazıldı.
`services.json` düzenleyen araç her yazma öncesi yedek alıyor — yine de LIVE
Studio'yu **kapattıktan sonra** kullan, açıkken yaptığın değişikliği uygulama ezer.
