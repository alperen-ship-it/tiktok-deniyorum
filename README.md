<div align="center">

# 🎮 TikTok LIVE — Sohbet Oyunları

**İzleyicinin sohbete yazarak oynadığı oyunlar. Aç, bırak, karışma.**

Üç oyun bir arada döner: bilye yarışı · bilgi yarışması · at yarışı bahsi.
Yayıncı hiçbir şeye dokunmaz — oyunlar kendi kendine tur atar, kazananları
kutlar, oda boşken demo oynar, izleyici geldiğinde gerçek oyuna geçer.

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

### 🏇 At Yarışı
8 sabit at — kalıcı isim, forma, koşudan koşuya galibiyet + son 5 koşu formu
(bahis yazı-tura değil, form okuma). İzleyici `1-8` ya da at adı yazıp bahis oynar;
oranlar havuzdan hesaplanır (az oynanan at çok öder). Koşu sırasında **mesaj ve
beğeni kendi atına tezahürat gücü verir.** Foto finişte ağır çekim, sonda podyum.

---

## Otomasyon: aç ve unut

| Durum | Ne olur |
|---|---|
| **Tek link** | `oyun.html` üç oyunu sırayla döndürür (varsayılan 6'şar dk). Geçişler **tur arasında** olur — yarış ortasında ekran değişmez. |
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

Tek tek oyun eklemek istersen: `bilye.html`, `bilgi.html`, `at.html` (hepsi
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
  bilye.html  bilgi.html  at.html   (tepe.html, kalan.html: rotasyon dışı)
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
