<div align="center">

# 🎮 TikTok LIVE — Sohbet Oyunları

**İzleyicinin sohbete yazarak oynadığı oyunlar. Aç, başlat, yayını sen yap.**

Üç oyun bir arada döner: at yarışı · halay (3D) · Düdüklü (3D).
Oyunlar **dikey (1080×1920)** yayın için tasarlandı.
Oyunlar kendi kendine tur atar, kazananları kutlar, oda boşken demo oynar,
izleyici geldiğinde gerçek oyuna geçer; sen de sesinle ya da kameranla yayında kalırsın.

</div>

---

## Nasıl başlarım (30 saniye)

**1. Exe'yi al.** Depoda durmaz (90 MB), GitHub üretir:

> Depo → **Actions** → **"EXE üret"** → **Run workflow** → ~3 dk → alttaki
> **Artifacts** → `TikTokOyunlar` zip'ini indir, `TikTokOyunlar.exe`'yi çıkar.

Node kurmana gerek yok, tek dosya. Kendin üretmek istersen: `paketle.bat`.

**2. Çift tıkla.** TikTok kullanıcı adını bir kez sorar, kaydeder. Kontrol
paneli tarayıcıda açılır. Yayında değilsen bekler, yayına geçince kendi bağlanır.

**3. OBS talimatı (dikey yayın).** Oyunlar artık dikey: 1080×1920.

1. **Tuvali dikey yap:** OBS → Ayarlar → Video → *Temel (Tuval) Çözünürlük* ve *Çıkış Çözünürlüğü*: **1080x1920**. FPS 30.
2. **Tarayıcı kaynağını ayarla:** oyun kaynağına çift tıkla → *Genişlik* **1080**, *Yükseklik* **1920**.
   Adres: `http://localhost:8787/overlays/oyun.html?lite=1` (at yarışı, halay ve Düdüklü bu tek adreste döner; ayrıca bir şey eklemene gerek yok)
   (LIVE Studio kullanıyorsan: `http://localtest.me:8787/overlays/oyun.html?lite=1`)
3. Kaynağı tuvale tam oturt: kaynağa sağ tıkla → *Dönüştür* → *Ekrana Sığdır*.
4. **Kontrol et** (yayına çıkmadan önce bir kez): adresin sonuna `&guvenli=1` ekle. Kırmızı gölgeli yerler
   TikTok'un kendi düğmelerinin ve yorumların duracağı yerlerdir; oyunun yazıları kırmızının içine girmemeli.
   Baktıktan sonra `&guvenli=1` kısmını sil.
5. **3D kontrolü (halay ve Düdüklü varsayılan döngüde):** OBS → Ayarlar → Gelişmiş → *Tarayıcı Kaynağı Donanım Hızlandırmasını
   Etkinleştir* işaretli olsun (varsayılan böyledir). Sonra tarayıcıda şu adresi aç:
   `http://localhost:8787/overlays/sahne3d-deneme.html?kisi=150` — ekranda "kalite: tam" ve 33 ms civarı bir kare süresi
   yazmalı. "dusuk" ya da "yok" yazıyorsa bilgisayarın 3D'yi zor çeviriyor demektir; oyun yine çalışır ama sahne sade görünür. Bunu bize bildir.
6. Telefonundan kendi yayınına bak: izleyici adları rahat okunuyor mu, üstte kanal adın oyunun başlığını kapatıyor mu,
   sol altta yorumlar oyunun bir yerini örtüyor mu? Bir sorun görürsen ekran görüntüsü al.
7. Yatay düzene dönmen gerekirse (geçici, yalnızca at yarışı için): tuvali ve kaynağı yeniden 1920x1080 yap ve adrese `&yatay=1` ekle.

> LIVE Studio'da **Kaynak ekle → Link** kullanıyorsan `localhost` yazma, bazı sürümler kabul etmez; `localtest.me` her durumda çalışır.
> `?lite=1` gömülü tarayıcıda GPU olmadığı için şart — ağır efektler kapanır, akıcı kalır.

**4. Go LIVE.** Bitti. Gerisi otomatik.

---

## Oyunlar

### 🏇 At Yarışı
8 sabit at — kalıcı isim, forma, koşudan koşuya galibiyet + son 5 koşu formu
(tahmin yazı-tura değil, form okuma). İzleyici `1-8` ya da at adı yazıp ücretsiz
tahminini yapar; çarpan havuzdan hesaplanır (az kişinin seçtiği at doğru çıkarsa
çarpan büyür, kalabalığın tersine tahmin yapmak daha çok puan getirir). Doğru bilen
`10 × çarpan` puan alır; puanlar yalnızca skor tablosunda birikir. Koşu sırasında
**mesaj ve beğeni kendi atına tezahürat gücü verir** (küçük, tavanlı bir destek).
Hediye gelince adı ekranda teşekkürle çıkar; puanı büyütmez. Koşu sırasında, tahmini olan izleyicinin hediyesi birkaç mesajlık tezahürat sayılır (mesajla aynı tavan: en çok +%12 hız).
Foto finişte ağır çekim, sonda podyum.
Eski OBS linklerindeki `?bahis=` süre parametresi `?tahmin=` ile aynı işi görmeye devam eder.

### 💃 Halay (3D)
Ortak dans sahnesi, yarışma değil. Gerçek 3D bir meydan: ortada platform, etrafında **üç halka, en çok 150 kişi**.
- **Katılmak:** sohbete bir şey yazmak ya da beğeni göndermek halkaya sokar. Halkalar içten dışa dolar.
- **Düet:** `@isim` ya da halkadaki bir **numara** yazarak birini dansa kaldırırsın; o da kabul eder ve ortada ikisi oynar.
- **Halay başı** mendili taşır, ilk sırada durur.
- **Coşku** yazdıkça ve beğeni geldikçe yükselir.
- **Küçük hediye = TEMPO** (coşku artar, göndericinin adı yazılır). **Çok büyük hediye = MEYDAN GÖSTERİSİ**
  (kısa bir süre halkalar hızlanır, herkesin kolları havada).
- Kafaların üstündeki balonlar yalnızca tezahürat (HEY! / HOP! / HOPPA! / OLEY!) ve parti emojisi gösterir;
  izleyicinin yazdığı metin asla çıkmaz.

**Nasıl açılır:** varsayılan rotasyonda; ayrıca bir şey eklemen gerekmez (`oyun.html?lite=1`). Tek başına: `oyun.html?lite=1&oyunlar=halay`.
Kaynak: `overlays/halay.html`.

### 🍲 Düdüklü (3D)
Herkesin birlikte oynadığı ortak oyun: büyük bir düdüklü tencereyi **hep beraber** ateşe odun atarak doldurursunuz.
- **Yazmak = odun:** her mesaj ateşe odun atar, beğeniler de sayılır.
- Basınç **33**'te ve **66**'da düdük öter. **100**'de tencere patlar.
- **USTA AŞÇI** turun en çok katkı yapan kişisidir; patlayınca adı kartta çıkar.
- Tek kişi tencereyi tek başına patlatamaz: kişi başına bir üst sınır var.
- Oda boşken 🤖 botlar yardım eder (gerçek izleyici gelince geri çekilir, kazanan olamazlar).
- Hediye basınca sınırlı bir destek ekler; tencereyi patlatan son itiş asla hediye olmaz. Adı teşekkürle görünür.
- Tencere genelde 1–1,5 dakikada patlar; patlamazsa tur en geç yaklaşık 2,5 dakikada "kıvamında pişti" ile biter.

**Nasıl açılır:** varsayılan rotasyonda (`oyun.html?lite=1`). Tek başına: `oyun.html?lite=1&oyunlar=tencere`.
Kaynak: `overlays/tencere.html`.

---

## Yayın notları

- Oyunlar dikey (1080×1920). Geçici olarak yatay düzene dönmek için (yalnızca at yarışı) adrese `&yatay=1` ekle.
- Misket, Bilgi ve PK oyunları ile eski oyunlar streamer'ın isteğiyle kaldırıldı; git geçmişinde duruyorlar.
- Yayındayken kontrol paneli sekmesini kapat: panelin önizlemeleri de bilgisayarın ekran kartını kullanır.
- Yayında sesinle ya da kameranla sen de ol: oyunlar kendi kendine döner ama sohbetle konuşan bir yayıncı hem izleyiciye hem platform kurallarına daha yakın durur (öneridir, TikTok'un kendi metnini doğrulamadık).
- Oda boşken oynayan demo botların adı 🤖 ile işaretlidir; puan tablosuna girmezler.
- Bahis mekaniği yok: hediye ödülü büyütmez; koşudaki hediye yalnızca mesajla da verilebilen tavanlı tezahürata eklenir. Teşekkür bandında ismi görünür.
- İzleyicilerin adları ekranda büyük görünür; adlar ekrana olduğu gibi (yalnızca HTML karakterleri temizlenerek) yazılır, ayrıca bir küfür süzgeci yoktur.
- Oyunlar sohbet yorumunu yalnızca komut olarak okur; izleyicinin yazdığı metin ekrana basılmaz (halayda balonlar yalnızca tezahürat ve emoji gösterir).
- **Güvenlik (kendiliğinden açık):** Köprü yalnızca bu bilgisayardan açılır. Paneldeki adresler (`localhost`, `localtest.me`) ve `tools\hosts-ekle.ps1` ile eklediğin `yayin.local` hazır izinlidir; başka bir sitenin ya da ağdaki başka bir cihazın oyunlara komut göndermesi engellenir. Tarayıcıda "403" görürsen (köprü "403 - Bu adres izinli degil (…)" ya da "403 - Bu siteden erisim izinli degil (…)" yazar) adresi paneldeki gibi yaz.
- **Başka cihazdan açacaksan** (ikinci bilgisayardaki OBS gibi): köprüyü `--lan` ile başlat, yalnızca kendi ev ağında kullan. Farklı bir alan adı kullanıyorsan `--host ad1,ad2` ekle. Oyunu OBS'te "yerel dosya" olarak açıyorsan `--host null` ekle.
- **Bağlantı koparsa kapatma, bekle:** Yayın kapalıyken, imza servisi sınır koyduğunda ya da internet gidip geldiğinde uygulama açık kalır ve kendiliğinden yeniden dener: yayın kapalıyken önce 15 sn'de bir, uzun sürerse dakikada bir; hatalarda en çok 5 dk, limitte en çok 15 dk arayla. Neyi beklediği panelde yazar.
- **Sessizlik bekçisi:** Bağlı görünüp 3 dakika hiç veri gelmezse bağlantı kendiliğinden yenilenir; oda sessiz kalmaya devam ederse bekleme uzar. Süreyi `--sessiz <saniye>` ile değiştirebilirsin (en az 30).
- Kapatmak için paneldeki **Durdur** düğmesini ya da `Durdur.bat`'ı kullan; eski `/api/kapat` adresi tarayıcıdan artık çalışmaz.

---

## Kendi kendine dönen kısımlar

| Durum | Ne olur |
|---|---|
| **Tek link** | `oyun.html` oyunları (at, halay, Düdüklü) sırayla döndürür (varsayılan 6'şar dk). Geçişler **tur arasında** olur — yarış ortasında ekran değişmez. |
| **Oda boş** | Turlar 🤖 demo botlarıyla döner. Gelen izleyici oyunu izleyerek anlar; yazdığı an sıradaki tur gerçek olur. |
| **Kazanan çıktı** | Sohbet botu kazananı `@etiketler` (aşağıda). Puanlar ve at galibiyetleri kalıcı (localStorage). |

**Sohbet botu — dürüst not:** Oyunlar kazananları duyurur. Varsayılan olarak
duyuru **ekranda + konsolda** görünür. *Gerçek TikTok sohbetine* yazması için
köprüyü `--oturum <sessionid>` ile başlatman **ve** EulerStream'in ücretli planı
gerekir (kütüphanenin `sendMessage`'ı onların bulutundan geçiyor). Yetki yoksa
bot kendini kapatır, oyunlar etkilenmez.

---

## Ayarlar (URL parametreleri)

Hepsi `oyun.html`'e eklenir, oyunlara aktarılır. Örnek:
`oyun.html?lite=1&dk=4&oyunlar=at,halay&sag=24`

| Parametre | Ne yapar |
|---|---|
| `?lite=1` | GPU'suz tarayıcı modu (LIVE Studio'da **şart**) |
| `?yatay=1` | 1920×1080 düzen, geçici (yalnızca at yarışı) |
| `?dk=6` | Oyun başına dakika (tek link modunda) |
| `?oyunlar=at,halay,tencere` | Hangi oyunlar, hangi sırayla (varsayılan: üçü de) |
| `?duyuru=0` | Geçiş duyurusunu kapat |
| `?sag=24&alt=24` | Kenar paylarını daralt, sahneyi büyüt (piksel) |
| `?ust= ?sol=` | Diğer kenarlar — TikTok arayüzünün kapattığı alana göre |

Tek tek oyun eklemek istersen: `at.html`, `halay.html`, `tencere.html` (hepsi
`?lite=1` ile). Her birinin kendi parametreleri kontrol panelinde yazılı.

---

## Kendi başına çalışan bir sistem

```
TikTokOyunlar.exe
   │
   ├─ köprü (server/bridge.js)  ── TikTok LIVE olayları ──┐
   │    chat · gift · like → tek biçime çevirir            │
   │                                                        ▼
   └─ http://localhost:8787   ──►  oyun.html (tek link)
                                     ├─ at.html       ┐ sabit dikey 1080×1920 sahne
                                     ├─ halay.html    │ (at.html: ?yatay=1 geçici 1920×1080)
                                     └─ tencere.html  ┘ at: Canvas2D + DOM; halay, Düdüklü: gerçek 3D
```

- **Köprü** (Node) TikTok'a bağlanır, olayları normalize eder, WebSocket'le yayınlar.
  Gerçek yayın için `tiktok-live-connector`; internet yokken `--mock` ile sahte olay.
- **Oyunlar** vanilla JS + Canvas2D (halay ve Düdüklü gerçek 3D, `_shared/sahne3d.js`; at yarışı Canvas2D). Ortak katmanlar `overlays/_shared/`:
  `kimlik.js` (kalıcı skin), `spiker.js` (anlatım), `finis.js` + `juice.js`
  (ağır çekim, konfeti, ekran sarsıntısı), `oyun-tema.css` (Outfit fontu, premium tema).
- **Performans:** Pişirilmiş sprite'lar (kare başı gradyan yok), uyarlanır kalite
  (makine zorlanırsa süsü kısar, oyun akıcı kalır), DPR tavanı. GIF yok — yazılım
  renderda decode pahalı.

Bu köprünün **neden** böyle kurulduğu — LIVE Studio'nun iç yapısı, "Link"
kaynağının tuzakları, olayların kaynağı — ayrı bir belgede:
**[TERSINE-MUHENDISLIK.md](TERSINE-MUHENDISLIK.md)**

---

## Kendi oyununu yaz

`overlays/` altına bir HTML koy, `_shared/tt.js` ve `_shared/oyun-tema.css`'i
bağla. Olaylar:

```js
TT.on('chat', (ev) => { ev.user.nickname; ev.comment; });
TT.on('gift', (ev) => { ev.user; ev.gift.count; ev.gift.value; });
TT.on('like', (ev) => { ev.user; ev.likes; });

TT.soyle('kazanan @' + ev.user.uniqueId);   // sohbet botuna mesaj
Kimlik.ciz(ctx, ev.user.id, x, y, çap);      // kullanıcıya özel skin
Juice.konfeti(); Juice.sars(0.4);            // kutlama / darbe
```

Test için `?mock=1` — sunucu olmadan sahte olaylarla çalışır. Ayrıntı:
[TERSINE-MUHENDISLIK.md → Kendi oyuncağını yaz](TERSINE-MUHENDISLIK.md).

---

## Dosya yapısı

```
overlays/
  oyun.html          ← TEK LİNK: oyunları döndüren merkez
  at.html  halay.html  tencere.html          (üç oyun, hepsi varsayılan dönüşte)
  index.html         ← kontrol paneli (adresleri kopyala, test olayı gönder)
  sahne3d-deneme.html                        (3D / GPU kontrol sayfası)
  alerts.html  like-goal.html  gift-rain.html  durum.html   (yayıncı widget'ları)
  _shared/           tt.js · kimlik.js · spiker.js · finis.js · juice.js
                     oyun-tema.css · base.css · font/ (Outfit, OFL)
server/
  bridge.js          köprü + statik sunucu + sohbet botu
  paketle.js         tek dosya exe üretir (Node SEA)
Baslat.bat  paketle.bat  Durdur.bat
```

---

## Lisans / sorumluluk

Kişisel yayın araçları. TikTok'un resmî ürünü değil, TikTok ile bağlantısı yok.
Gömülü Outfit fontu SIL Open Font License (bkz. `overlays/_shared/font/`).
Kendi hesabınla, kendi sorumluluğunda kullan.
