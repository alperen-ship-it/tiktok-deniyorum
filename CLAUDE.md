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
  komut, adres ve dosya yolu değişmez; kaynakta olmayan bilgi eklenmez.
- Oyunların yerleşik terimlerine dokunma: tahmin, çarpan, ödül, usta aşçı, halay başı, coşku, körük.
- Kod yorumları ve köprünün konsol iletileri bilerek Türkçe karaktersiz yazılır; bunlara karakter ekleme.
