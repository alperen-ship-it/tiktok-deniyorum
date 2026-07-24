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

## TL;DR — 3 dakikada yayında

```bat
git clone <bu-depo> && cd tiktok-deniyorum
node server/bridge.js --mock
```

Tarayıcıda `http://localhost:8787/` aç → kontrol paneli açılır, tüm oyuncakların
canlı önizlemesi orada. Beğendiğinin adresini kopyala:

| Nereye koyacaksın | Adres |
|---|---|
| **TikTok LIVE Studio** → Kaynak ekle → **Link** | `http://localtest.me:8787/overlays/alerts.html?lite=1` |
| **OBS** → Tarayıcı Kaynağı | `http://localhost:8787/overlays/alerts.html` |

⚠️ LIVE Studio'da `127.0.0.1` **reddedilebilir** (sürüme göre değişiyor, aşağıda
açıkladım). Yukarıdaki `localtest.me` adresi her iki durumda da çalışır — onunla
başla, uğraşma.

Gerçek yayına bağlanmak için: `node server/bridge.js --user senin_kullanici_adin`

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

Altısı da hazır, gerçek tarayıcıda test edildi (WebSocket bağlanıyor, olaylar
akıyor, konsol temiz).

> **Not:** LIVE Studio'nun kendi hazır widget'ları var — Uyarılar, Sohbet Kutusu,
> Hedef, Liderlik Tablosu, Geri Sayım. Buradaki `alerts` / `chat` / `like-goal`
> onlarla örtüşüyor; farkı tamamen senin kontrolünde olması (renk, metin, animasyon,
> eşikler). **`battle`, `race` ve `gift-rain`'in yerel karşılığı yok** — asıl değer orada.

### 🔔 `alerts.html` — Uyarılar
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
| `?v=1` | 9:16 dikey yayın yerleşimi |
| `?mock=1` | Sunucu olmadan sahte olay üretir — `file://` ile bile çalışır |
| `?bg=green` | Yeşil zemin (chroma key gerekirse) — `green\|magenta\|blue\|#RRGGBB` |
| `?scale=1.4` | Tümünü büyüt/küçült |
| `?debug=1` | Sağ altta bağlantı göstergesi + konsol logu |
| `?src=tikfinity` | Olay kaynağını zorla (`bridge` \| `tikfinity`) |

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
