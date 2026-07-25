# Görseller (sprite'lar)

Bu klasör **boş olabilir** — oyunlar o zaman emoji ile çalışır, hiçbir şey
bozulmaz. Buraya PNG atarsan oyun otomatik olarak emoji yerine onu kullanır.

## Dosya adları

Adı birebir tutturman gerekiyor, klasöre şu isimlerle at:

| Dosya adı                | Nerede görünür            | Şu an emoji |
|--------------------------|---------------------------|-------------|
| `labirent-kahraman.png`  | Labirentte gezen karakter | 🐹          |
| `labirent-canavar.png`   | Labirentteki canavarlar   | 👻          |
| `tirmanis-kahraman.png`  | Tırmanan karakter         | 🧗          |

Yeni bir tane eklemek istersen oyun dosyasında `TT.sprite('ad', 'emoji')`
satırını arayıp aynı `ad` ile buraya `ad.png` koyman yeterli.

## Nasıl bir PNG olmalı

- **Arka planı saydam (transparent) PNG.** JPG olmaz, arkası beyaz kalır.
- **Kare civarı**, 96–256 piksel arası. Daha büyüğü gereksiz, LIVE Studio'nun
  gömülü tarayıcısını yorar.
- Piksel sanatı iyi durur: oyun zaten kenarları keskin çiziyor
  (`imageSmoothingEnabled = false`), bulanıklaşmaz.
- Karakterin **tam ortada** olması iyi olur; oyun görseli merkeze hizalıyor.

## Nereden bulunur (ücretsiz, ticari kullanıma açık)

Aşağıdakiler CC0 / ücretsiz lisanslı, yani yayında kullanman sorun değil.
Ben bu makineden bu sitelere çıkamıyorum (kurumsal ağ engeli), o yüzden
indirmeyi senin yapman gerekiyor:

- **kenney.nl/assets** — en temizi. "Pixel Platformer", "Tiny Dungeon",
  "Roguelike Characters" paketlerine bak. Hepsi CC0, atıf bile gerekmiyor.
- **opengameart.org** — filtreden `CC0` seç, aramaya `character sprite` yaz.
- **itch.io/game-assets/free** — "Free" + "Sprites" filtresi.
- **game-icons.net** — tek renk ikonlar, canavar/silah için iyi.

İndirdiğin paketten tek bir karakter PNG'si seç, adını yukarıdaki tabloya
göre değiştir, bu klasöre at. Sayfayı yenile — görsel gelmiş olur.

## Çalışmadıysa

- Dosya adında büyük/küçük harf farkı var mı? `Labirent-Kahraman.png` olmaz.
- Uzantı gerçekten `.png` mi? Windows uzantıyı gizliyor olabilir
  (Görünüm > Dosya adı uzantıları'nı aç).
- Görsel gelmezse oyun sessizce emojiye düşer, yani bir şey **bozulmaz** —
  sadece eskisi gibi görünür.

> **Not:** EXE'ye gömülmesi için görselleri buraya koyduktan sonra exe'yi
> yeniden üretmen gerekir (`paketle.bat`). Kaynaktan çalıştırıyorsan
> (`Baslat.bat`) böyle bir gerek yok, anında görünür.
