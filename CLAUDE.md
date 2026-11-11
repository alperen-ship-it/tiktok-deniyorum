# tiktok-deniyorum

TikTok canlı yayını için sohbetle oynanan oyunlar: bir köprü sunucusu (`server/`) ve OBS ya da
TikTok LIVE Studio'ya tarayıcı kaynağı olarak eklenen sayfalar (`overlays/`).

İşe başlamadan önce `devir/DEVIR.md` dosyasını oku. Ürünün durumu, yayıncının istekleri, verilen
kararlar ve sıradaki işler orada.

## Değişmeyen kurallar

- İzleyicinin yazdığı metin hiçbir zaman ekrana basılmaz. Yorum yalnızca tetikleyicidir.
- Bahis ve şans sözcükleri kullanılmaz. Hediye kimin kazanacağını belirlemez.
- Testlerde TikTok'a ya da EulerStream'e bağlanılmaz.
- Yalnızca `claude/tiktok-live-studio-reverse-eng-6x7k2a` dalında çalışılır. İstenmedikçe pull request açılmaz.
- Kuralların tamamı `devir/DEVIR.md` bölüm 2 ve 3'te.

## Türkçe metinler

Türkçe yazılan her metin `turkish-anti-ai-skill` kılavuzuyla yazılır ve denetlenir
(`.claude/skills/turkish-anti-ai-skill/`). Buna ekrandaki oyun yazıları, README, panel, kontrol
sayfası, köprünün konsol iletileri ve yayıncıya yazılan cevaplar dahildir.

- Var olan metni düzeltirken kılavuzun onarım kipini ve olgusal sadakat kilidini uygula: sayı, kural,
  komut, adres ve dosya yolu değişmez. Kaynakta olmayan bilgi eklenmez.
- Oyunların yerleşik terimlerine dokunma: tahmin, çarpan, ödül, usta aşçı, halay başı, coşku, körük, düdük.
- Kod yorumları, konsola yazılan her şey (köprü, araçlar, `.bat`, `.ps1`, `.vbs`) ve örnek
  JSON'daki `_aciklama` alanları bilerek Türkçe karaktersiz yazılır. Bunlara karakter ekleme.
- Yerleşik yazım kararları:
  - Ara söz için uzun çizgi kullanılmaz. Etiketten sonra ":", iki cümle arasında nokta ya da virgül gelir.
  - Ekrandaki satırlarda etiketle ileti arasına " · " konur.
  - Aralıkta kısa çizgi (1-8), ekranda ondalık virgül (x1,5).
  - "!" ve "." sonrasında büyük harf, seslenilen addan sonra virgül.
  - Sahte olaylarla çalışan kipin adı her yerde "mock modu". Paneldeki düğme "Sahte veri".
- Köprü ve araçlar yorumun metnini konsola da yazmaz, yalnızca uzunluğunu yazar.
