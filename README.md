<div align="center">

# 🎮 TikTok LIVE sohbet oyunları

**İzleyicinin sohbete yazarak oynadığı oyunlar. Aç, başlat, yayını sen yap.**

Üç oyun bir arada döner: at yarışı · halay (3D) · Düdüklü (3D).
Oyunlar **dikey (1080×1920)** yayın için tasarlandı.
Oyunlar kendi kendine tur atar, kazananları kutlar, oda boşken demo oynar,
izleyici geldiğinde gerçek oyuna geçer. Sen de sesinle ya da kameranla yayında kalırsın.

</div>

---

## Nasıl başlarım (30 saniye)

**1. Exe'yi al.** Depoda durmaz (90 MB), GitHub üretir:

> Depo → **Actions** → **"EXE üret"** → **Run workflow** → yaklaşık 1 dk → alttaki
> **Artifacts** → `TikTokOyunlar` zip'ini indir, `TikTokOyunlar.exe`'yi çıkar.

Node kurmana gerek yok, tek dosya. Kendin üretmek istersen: `paketle.bat`.

**2. Çift tıkla.** TikTok kullanıcı adını bir kez sorar, kaydeder. Kontrol
paneli tarayıcıda açılır. Yayında değilsen bekler, yayına geçince kendiliğinden bağlanır.

**3. OBS talimatı (dikey yayın).** Oyunlar artık dikey: 1080×1920.

1. **Tuvali dikey yap:** OBS → Ayarlar → Video → *Temel (Tuval) Çözünürlük* ve *Çıkış Çözünürlüğü*: **1080x1920**. FPS 30.
2. **Tarayıcı kaynağını ayarla:** oyun kaynağına çift tıkla → *Genişlik* **1080**, *Yükseklik* **1920**.
   Adres: `http://localhost:8787/overlays/oyun.html?lite=1` (at yarışı, halay ve Düdüklü bu tek adreste döner, ayrıca bir şey eklemene gerek yok)
   (LIVE Studio kullanıyorsan: `http://localtest.me:8787/overlays/oyun.html?lite=1`)
3. Kaynağı tuvale tam oturt: kaynağa sağ tıkla → *Dönüştür* → *Ekrana Sığdır*.
4. **Kaynağı sına:** adresi bir kez `http://localhost:8787/overlays/kontrol.html` yap
   (LIVE Studio'da `http://localtest.me:8787/overlays/kontrol.html`). Bu sayfa, kaynağın oyunları
   çalıştırıp çalıştıramadığını kendi kendine sınar ve sonucu büyük yazıyla gösterir. Baktığı şeyler:
   hangi tarayıcının açtığı ve pencere boyutu, köprü bağlantısı, 150 figürle 2D çizim hızı, başka
   sitelerden resim yüklenip yüklenmediği (profil fotoğrafları TikTok'un kendi sunucularından gelir) ve
   böyle bir resmin tuvale çizilip çizilemediği. Ekran kartı (WebGL) ve ses yalnızca bilgi olarak yazılır.
   Üstteki özet satırı "HAZIR" diyorsa sorun yok. Sonra adresi oyunun adresine geri çevir.
5. **Güvenli bölgeye bak** (yayına çıkmadan önce bir kez): adresin sonuna `&guvenli=1` ekle. Kırmızı gölgeli yerler
   TikTok'un kendi düğmelerinin ve yorumların duracağı yerlerdir. Oyunun yazıları kırmızının içine girmemeli.
   Baktıktan sonra `&guvenli=1` kısmını sil.
6. **3D kontrolü (halay ve Düdüklü varsayılan döngüde):** OBS → Ayarlar → Gelişmiş → *Tarayıcı Kaynağı Donanım Hızlandırmasını
   Etkinleştir* işaretli olsun (varsayılan böyledir). Sonra tarayıcıda şu adresi aç:
   `http://localhost:8787/overlays/sahne3d-deneme.html?kisi=150`. Ekranda "kalite: tam" ve 33 ms civarında bir kare süresi
   yazmalı. Ekranda "dusuk" ya da "yok" yazıyorsa bilgisayarın 3D'yi zor çeviriyor demektir. Oyun yine çalışır ama sahne sade görünür. Bunu bize bildir.
7. Telefonundan kendi yayınına bak: izleyici adları rahat okunuyor mu, üstte kanal adın oyunun başlığını kapatıyor mu,
   sol altta yorumlar oyunun bir yerini örtüyor mu? Bir sorun görürsen ekran görüntüsü al.
8. Yatay düzene dönmen gerekirse (geçici, yalnızca at yarışı için): tuvali ve kaynağı yeniden 1920x1080 yapıp adrese `&yatay=1` ekle.

> LIVE Studio'da **Kaynak ekle → Link** kullanıyorsan `localhost` yazma, bazı sürümler kabul etmez. `localtest.me` her durumda çalışır.
> Gömülü tarayıcıda GPU olmadığı için `?lite=1` şart: ağır efektler kapanır ve oyun akıcı kalır.

**4. Go LIVE.** Bitti. Gerisi otomatik.

---

## Oyunlar

### 🏇 At yarışı
8 sabit at var. Her atın kalıcı adı, forması, koşudan koşuya taşınan galibiyetleri ve son 5 koşudaki formu
vardır. İzleyici atların formuna bakar, `1-8` ya da at adı yazarak ücretsiz
tahminini yapar. Çarpan havuzdan hesaplanır: az kişinin seçtiği at doğru çıkarsa
çarpan büyür, kalabalığın tersine tahmin yapmak daha çok puan getirir. Doğru bilen
`10 × çarpan` puan alır. Puanlar yalnızca skor tablosunda birikir. Koşu sırasında
**mesaj ve beğeni kendi atına tezahürat gücü verir** (küçük, tavanlı bir destek).
Hediye gelince gönderenin adı ekranda teşekkürle çıkar. Hediye puanı büyütmez. Koşu sırasında tahmini olan izleyicinin hediyesi birkaç mesajlık tezahürat sayılır (mesajla aynı tavan: en çok +%12 hız).
Foto finişte ağır çekim, sonda podyum.
Eski OBS linklerindeki `?bahis=` süre parametresi `?tahmin=` ile aynı işi görmeye devam eder.

### 💃 Halay (3D)
Yarışmasız, ortak bir dans sahnesi. Gerçek 3D bir meydan: ortada platform, etrafında **üç halka, en çok 150 kişi**.
- Sohbete bir şey yazan ya da beğeni gönderen halkaya katılır. Halkalar içten dışa dolar.
- Düet için `@isim` ya da halkadaki bir **numara** yazarak birini dansa kaldırırsın. O da kabul eder ve ortada ikiniz oynarsınız.
- **Halay başı** mendili taşır, ilk sırada durur.
- **Coşku** yazdıkça ve beğeni geldikçe yükselir.
- Küçük hediye **TEMPO** getirir: coşku artar, gönderenin adı yazılır. Çok büyük hediye **MEYDAN GÖSTERİSİ** başlatır:
  halkalar kısa bir süre hızlanır, herkesin kolları havada.
- Kafaların üstündeki balonlar yalnızca tezahürat (HEY! / HOP! / HOPPA! / OLEY!) ve parti emojisi gösterir.
  İzleyicinin yazdığı metin asla çıkmaz.

**Nasıl açılır:** Varsayılan döngüde yer alır, ayrıca bir şey eklemen gerekmez (`oyun.html?lite=1`). Tek başına açmak için: `oyun.html?lite=1&oyunlar=halay`.
Kaynak: `overlays/halay.html`.

### 🍲 Düdüklü (3D)
Herkesin birlikte oynadığı ortak oyun: büyük bir düdüklü tencereyi ateşe odun atarak **hep beraber** doldurursunuz.
- Her mesaj ateşe odun atar, beğeniler de sayılır.
- Basınç **33**'te ve **66**'da düdük öter. **100**'de tencere patlar.
- **USTA AŞÇI**, turun en çok katkı yapan kişisidir. Tencere patlayınca adı kartta çıkar.
- Tek kişi tencereyi tek başına patlatamaz: kişi başına bir üst sınır var.
- Oda boşken 🤖 botlar yardım eder (gerçek izleyici gelince geri çekilirler, kazanan olamazlar).
- Hediye basınca sınırlı bir destek ekler. Tencereyi patlatan son itiş asla hediye olmaz. Gönderenin adı teşekkürle görünür.
- Tencere genelde 1-1,5 dakikada patlar. Patlamazsa tur en geç yaklaşık 2,5 dakikada "kıvamında pişti" ile biter.

**Nasıl açılır:** Varsayılan döngüde yer alır (`oyun.html?lite=1`). Tek başına açmak için: `oyun.html?lite=1&oyunlar=tencere`.
Kaynak: `overlays/tencere.html`.

---

## Yayın notları

- Oyunlar dikey (1080×1920). Geçici olarak yatay düzene dönmek için (yalnızca at yarışı) adrese `&yatay=1` ekle.
- Misket, Bilgi ve PK oyunları ile eski oyunlar senin isteğinle kaldırıldı. Git geçmişinde duruyorlar.
- Yayındayken kontrol paneli sekmesini kapat: panelin ön izlemeleri de bilgisayarın ekran kartını kullanır.
- Yayında sesinle ya da kameranla sen de ol: oyunlar kendi kendine döner ama sohbetle konuşan bir yayıncı hem izleyiciye hem platform kurallarına daha yakın durur (öneridir, TikTok'un kendi metnini doğrulamadık).
- Oda boşken oynayan demo botların adı 🤖 ile işaretlidir. Bu botlar puan tablosuna girmez.
- Bahis mekaniği yok: hediye ödülü büyütmez. Koşudaki hediye yalnızca tavanlı tezahürata eklenir, aynı tezahüratı mesajla da vermek mümkün. Gönderenin adı teşekkür bandında görünür.
- İzleyicilerin adları ekranda büyük görünür. Adlar ekrana olduğu gibi (yalnızca HTML karakterleri temizlenerek) yazılır, ayrıca bir küfür süzgeci yoktur.
- Oyunlar sohbet yorumunu yalnızca komut olarak okur. İzleyicinin yazdığı metin ekrana basılmaz (halayda balonlar yalnızca tezahürat ve emoji gösterir).
- **Güvenlik kendiliğinden açıktır.** Köprü yalnızca bu bilgisayardan açılır. Paneldeki adresler (`localhost`, `localtest.me`) ve `tools\hosts-ekle.ps1` ile eklediğin `yayin.local` hazır izinlidir. Başka bir sitenin ya da ağdaki başka bir cihazın oyunlara komut göndermesi engellenir. Tarayıcıda "403" görürsen (köprü "403 - Bu adres izinli degil (…)" ya da "403 - Bu siteden erisim izinli degil (…)" yazar) adresi paneldeki gibi yaz.
- **Başka cihazdan açacaksan** (ikinci bilgisayardaki OBS gibi): köprüyü `--lan` ile başlat, yalnızca kendi ev ağında kullan. Farklı bir alan adı kullanıyorsan `--host ad1,ad2` ekle. Oyunu OBS'te "yerel dosya" olarak açıyorsan `--host null` ekle.
- **Bağlantı koparsa kapatma, bekle.** Yayın kapalıyken, imza servisi sınır koyduğunda ya da internet gidip geldiğinde uygulama açık kalır ve kendiliğinden yeniden dener: yayın kapalıyken önce 15 sn'de bir, uzun sürerse dakikada bir; hatalarda en çok 5 dk, limitte en çok 15 dk arayla. Neyi beklediği panelde yazar.
- Bağlı görünürken 3 dakika hiç veri gelmezse **sessizlik bekçisi** bağlantıyı kendiliğinden yeniler. Oda sessiz kalmaya devam ederse bekleme uzar. Süreyi `--sessiz <saniye>` ile değiştirebilirsin (en az 30).
- Kapatmak için paneldeki **Durdur** düğmesini ya da `Durdur.bat`'ı kullan. Eski `/api/kapat` adresi tarayıcıdan artık çalışmaz.

---

## Kendi kendine dönen kısımlar

| Durum | Ne olur |
|---|---|
| **Tek link** | `oyun.html` oyunları (at, halay, Düdüklü) sırayla döndürür (varsayılan 6'şar dk). Geçişler **tur arasında** olur, yarış ortasında ekran değişmez. |
| **Oda boş** | Turlar 🤖 demo botlarıyla döner. Gelen izleyici oyunu izleyerek anlar. Yazdığı an sıradaki tur gerçek olur. |
| **Kazanan çıktı** | Sohbet botu kazananı `@etiketler` (aşağıda). Puanlar ve at galibiyetleri kalıcı (localStorage). |

**Sohbet botu için not:** Oyunlar kazananları duyurur. Varsayılan olarak
duyuru **ekranda ve konsolda** görünür. *Gerçek TikTok sohbetine* yazması için
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
| `?ust= ?sol=` | Diğer kenarlar, TikTok arayüzünün kapattığı alana göre |

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

- **Köprü** (Node) TikTok'a bağlanır, olayları normalize edip WebSocket'le yayınlar.
  Gerçek yayında `tiktok-live-connector` kullanılır, internet yokken `--mock` ile sahte olay gelir.
- **Oyunlar** vanilla JS + Canvas2D (halay ve Düdüklü gerçek 3D, `_shared/sahne3d.js`; at yarışı Canvas2D). Ortak katmanlar `overlays/_shared/`:
  `kimlik.js` (kalıcı skin), `spiker.js` (anlatım), `finis.js` + `juice.js`
  (ağır çekim, konfeti, ekran sarsıntısı), `oyun-tema.css` (Outfit fontu, premium tema).
- **Performans:** Pişirilmiş sprite'lar (kare başı gradyan yok), uyarlanır kalite
  (makine zorlanırsa süsü kısar, oyun akıcı kalır), DPR tavanı. GIF yok: yazılımla
  çizimde decode pahalı.

Bu köprünün **neden** böyle kurulduğunu, yani LIVE Studio'nun iç yapısını, "Link"
kaynağının tuzaklarını ve olayların kaynağını ayrı bir belge anlatıyor:
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

Test için `?mock=1` ekle: sayfa sunucu olmadan sahte olaylarla çalışır. Ayrıntı:
[TERSINE-MUHENDISLIK.md → Kendi oyuncağını yaz](TERSINE-MUHENDISLIK.md).

---

## Dosya yapısı

```
overlays/
  oyun.html          ← TEK LİNK: oyunları döndüren merkez
  at.html  halay.html  tencere.html          (üç oyun, hepsi varsayılan döngüde)
  index.html         ← kontrol paneli (adresleri kopyala, test olayı gönder)
  kontrol.html                               (kaynak sınama sayfası: OBS / LIVE Studio)
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
