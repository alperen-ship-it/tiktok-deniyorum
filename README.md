<div align="center">

# 🎮 TikTok LIVE — Sohbet Oyunları

**İzleyicinin sohbete yazarak oynadığı oyunlar. Aç, başlat, yayını sen yap.**

Dört oyun bir arada döner: bilye yarışı · bilgi yarışması · PK savaşı · at yarışı.
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

**3. Tek adresi LIVE Studio'ya ekle:**

```
http://localtest.me:8787/overlays/oyun.html?lite=1
```

> LIVE Studio'da **Kaynak ekle → Link** → yapıştır. Yatay (Landscape) sahneye
> koy — oyunlar 1920×1080 için tasarlandı.
>
> `localhost` yazma, bazı sürümler kabul etmez; `localtest.me` her durumda çalışır.
> `?lite=1` gömülü tarayıcıda GPU olmadığı için şart — ağır efektler kapanır, akıcı kalır.

**4. Go LIVE.** Bitti. Gerisi otomatik.

---

## Oyunlar

### 🏁 Bilye Yarışı
Twitch'in en çok oynanan sohbet oyunu (Marbles on Stream) uyarlaması. Sohbete
yazan herkes **kendine özel bir bilye** alır — renk ve desen kullanıcı adından
üretilir, her yayında aynıdır ("benim bilyem"). Bilyeler engelli pistten aşağı
yarışır, canlı sıralama + spiker anlatımı + son düzlükte ağır çekim. İlk biten kazanır.

### 👑 Tepe Savaşı
Saf rekabet — **emek = ilerleme.** Her mesaj seni merkezdeki tahta bir adım
yaklaştırır, beğeni küçük adım, **hediye öndeki rakibi geri iter** (saldırı!). Tahta ilk ulaşan **tacı takar**, herkes kenara döner, yeni
tur anında başlar. Üst üste taç = seri çarpanı. Taç ve puan tablosu **kalıcı** —
düzenli izleyiciyi geri getiren tablo bu.

### ⚔️ PK Savaşı
TikTok'un **kendi formatının** (PK Battle) uyarlaması + tartışma yemi. İki taraf
bir konuda kapışır — *🐱 kedi vs 🐶 köpek*, *menemen soğanlı mı soğansız mı*,
*ananaslı pizza olur mu* — kimse kararsız kalamaz, yorum yazmadan duramaz.
İzleyici tarafının adını yazar; **her mesaj takımını ileri iter**, beğeni de
sayılır. 🎁 **Hediye karşı tarafı geri iter.** Son 30 saniye **SPEED** — hediyeler
2 kat (TikTok PK'nın gerçek mekaniği). 30 konu döner, galibiyet tablosu kalıcı.
Konular: `overlays/_shared/kapismalar.js`

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

---

## Yayın notları

- Yayında sesinle ya da kameranla sen de ol: oyunlar kendi kendine döner ama sohbetle konuşan bir yayıncı hem izleyiciye hem platform kurallarına daha yakın durur (öneridir, TikTok'un kendi metnini doğrulamadık).
- Oda boşken oynayan demo botların adı 🤖 ile işaretlidir; puan tablosuna girmezler.
- Bahis mekaniği yok: hediye ödülü büyütmez; koşudaki hediye yalnızca mesajla da verilebilen tavanlı tezahürata eklenir. Teşekkür bandında ismi görünür.
- İzleyicilerin adları ekranda büyük görünür; adlar ekrana olduğu gibi (yalnızca HTML karakterleri temizlenerek) yazılır, ayrıca bir küfür süzgeci yoktur.
- **Güvenlik (kendiliğinden açık):** Köprü yalnızca bu bilgisayardan açılır. Paneldeki adresler (`localhost`, `localtest.me`) ve `tools\hosts-ekle.ps1` ile eklediğin `yayin.local` hazır izinlidir; başka bir sitenin ya da ağdaki başka bir cihazın oyunlara komut göndermesi engellenir. Tarayıcıda "403" görürsen (köprü "403 - Bu adres izinli degil (…)" ya da "403 - Bu siteden erisim izinli degil (…)" yazar) adresi paneldeki gibi yaz.
- **Başka cihazdan açacaksan** (ikinci bilgisayardaki OBS gibi): köprüyü `--lan` ile başlat, yalnızca kendi ev ağında kullan. Farklı bir alan adı kullanıyorsan `--host ad1,ad2` ekle. Oyunu OBS'te "yerel dosya" olarak açıyorsan `--host null` ekle.
- **Bağlantı koparsa kapatma, bekle:** Yayın kapalıyken, imza servisi sınır koyduğunda ya da internet gidip geldiğinde uygulama açık kalır ve kendiliğinden yeniden dener: yayın kapalıyken önce 15 sn'de bir, uzun sürerse dakikada bir; hatalarda en çok 5 dk, limitte en çok 15 dk arayla. Neyi beklediği panelde yazar.
- **Sessizlik bekçisi:** Bağlı görünüp 3 dakika hiç veri gelmezse bağlantı kendiliğinden yenilenir; oda sessiz kalmaya devam ederse bekleme uzar. Süreyi `--sessiz <saniye>` ile değiştirebilirsin (en az 30).
- Kapatmak için paneldeki **Durdur** düğmesini ya da `Durdur.bat`'ı kullan; eski `/api/kapat` adresi tarayıcıdan artık çalışmaz.

---

## Kendi kendine dönen kısımlar

| Durum | Ne olur |
|---|---|
| **Tek link** | `oyun.html` dört oyunu sırayla döndürür (varsayılan 6'şar dk). Geçişler **tur arasında** olur — yarış ortasında ekran değişmez. |
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
`oyun.html?lite=1&dk=4&oyunlar=bilye,at&sag=24`

| Parametre | Ne yapar |
|---|---|
| `?lite=1` | GPU'suz tarayıcı modu (LIVE Studio'da **şart**) |
| `?dk=6` | Oyun başına dakika (tek link modunda) |
| `?oyunlar=bilye,at` | Hangi oyunlar, hangi sırayla (ek: `tepe`, `kalan` rotasyon dışı ama mevcut) |
| `?duyuru=0` | Geçiş duyurusunu kapat |
| `?sag=24&alt=24` | Kenar paylarını daralt, sahneyi büyüt (piksel) |
| `?ust= ?sol=` | Diğer kenarlar — TikTok arayüzünün kapattığı alana göre |

Tek tek oyun eklemek istersen: `bilye.html`, `bilgi.html`, `pk.html`, `at.html` (hepsi
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
                                     ├─ bilye.html   ┐
                                     ├─ kalan.html   ├─ sabit 1920×1080 sahne
                                     └─ at.html      ┘  Canvas2D + DOM, GPU'suz
```

- **Köprü** (Node) TikTok'a bağlanır, olayları normalize eder, WebSocket'le yayınlar.
  Gerçek yayın için `tiktok-live-connector`; internet yokken `--mock` ile sahte olay.
- **Oyunlar** vanilla JS + Canvas2D. Ortak katmanlar `overlays/_shared/`:
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
  bilye.html  bilgi.html  pk.html  at.html   (tepe.html, kalan.html: rotasyon dışı)
  index.html         ← kontrol paneli (adresleri kopyala, test olayı gönder)
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
