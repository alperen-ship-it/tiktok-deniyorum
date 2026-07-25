/**
 * sorular.js — Turkce bilgi yarismasi soru bankasi.
 *
 * Bicim:  { s: soru, c: [4 sik], d: dogru sikkin indeksi (0-3), k: kategori }
 *
 * Ilke: TikTok izleyicisi soruyu 3 saniyede OKUYUP anlamali. Uzun paragraf
 * yok, tuzak yok, tartismali cevap yok. Zorluk karisik — herkesin bildigi
 * sorular kalabaligi oyuna sokar, zorlar rekabeti korur.
 */
window.SORULAR = [
  // --- Turkiye ---
  { s: 'Türkiye’nin en uzun nehri hangisidir?', c: ['Kızılırmak', 'Fırat', 'Sakarya', 'Yeşilırmak'], d: 0, k: 'Türkiye' },
  { s: 'Türkiye’nin en büyük gölü hangisidir?', c: ['Tuz Gölü', 'Van Gölü', 'Beyşehir', 'İznik'], d: 1, k: 'Türkiye' },
  { s: 'Türkiye’nin en yüksek dağı hangisidir?', c: ['Erciyes', 'Uludağ', 'Ağrı Dağı', 'Kaçkar'], d: 2, k: 'Türkiye' },
  { s: 'Türkiye’de kaç il vardır?', c: ['79', '80', '81', '82'], d: 2, k: 'Türkiye' },
  { s: 'Anıtkabir hangi şehirdedir?', c: ['İstanbul', 'Ankara', 'İzmir', 'Bursa'], d: 1, k: 'Türkiye' },
  { s: 'Ankara hangi yıl başkent oldu?', c: ['1920', '1923', '1919', '1930'], d: 1, k: 'Türkiye' },
  { s: 'Pamukkale travertenleri hangi ildedir?', c: ['Denizli', 'Muğla', 'Antalya', 'Aydın'], d: 0, k: 'Türkiye' },
  { s: 'Efes Antik Kenti hangi ildedir?', c: ['Manisa', 'İzmir', 'Aydın', 'Muğla'], d: 1, k: 'Türkiye' },
  { s: 'Truva Antik Kenti hangi ildedir?', c: ['Balıkesir', 'Çanakkale', 'Edirne', 'Bursa'], d: 1, k: 'Türkiye' },
  { s: 'Peribacalarıyla ünlü Kapadokya ağırlıklı hangi ildedir?', c: ['Kayseri', 'Niğde', 'Nevşehir', 'Aksaray'], d: 2, k: 'Türkiye' },
  { s: 'İstiklal Marşı’nın şairi kimdir?', c: ['Namık Kemal', 'Mehmet Akif Ersoy', 'Tevfik Fikret', 'Yahya Kemal'], d: 1, k: 'Türkiye' },
  { s: 'Türk bayrağında hangi iki renk vardır?', c: ['Kırmızı-Beyaz', 'Kırmızı-Sarı', 'Mavi-Beyaz', 'Yeşil-Beyaz'], d: 0, k: 'Türkiye' },
  { s: 'Türkiye’nin en kalabalık şehri hangisidir?', c: ['Ankara', 'İzmir', 'İstanbul', 'Bursa'], d: 2, k: 'Türkiye' },
  { s: 'Boğaziçi Köprüsü hangi yıl açıldı?', c: ['1973', '1980', '1968', '1985'], d: 0, k: 'Türkiye' },
  { s: 'Sümela Manastırı hangi ildedir?', c: ['Rize', 'Trabzon', 'Artvin', 'Giresun'], d: 1, k: 'Türkiye' },
  { s: 'Türkiye’nin en kalabalık ikinci şehri hangisidir?', c: ['İzmir', 'Bursa', 'Ankara', 'Antalya'], d: 2, k: 'Türkiye' },
  { s: 'Nemrut Dağı’ndaki dev heykeller hangi ildedir?', c: ['Malatya', 'Adıyaman', 'Şanlıurfa', 'Diyarbakır'], d: 1, k: 'Türkiye' },
  { s: 'Türkiye kaç denize kıyısı olan bir ülkedir?', c: ['2', '3', '4', '5'], d: 2, k: 'Türkiye' },

  // --- Bilim ---
  { s: 'Suyun kimyasal formülü nedir?', c: ['CO2', 'H2O', 'O2', 'NaCl'], d: 1, k: 'Bilim' },
  { s: 'Güneş sistemimizde kaç gezegen vardır?', c: ['7', '8', '9', '10'], d: 1, k: 'Bilim' },
  { s: 'Güneş sistemindeki en büyük gezegen hangisidir?', c: ['Satürn', 'Neptün', 'Jüpiter', 'Dünya'], d: 2, k: 'Bilim' },
  { s: '“Kızıl Gezegen” diye bilinen gezegen hangisidir?', c: ['Venüs', 'Mars', 'Merkür', 'Satürn'], d: 1, k: 'Bilim' },
  { s: 'Yetişkin bir insanda yaklaşık kaç kemik vardır?', c: ['186', '206', '226', '246'], d: 1, k: 'Bilim' },
  { s: 'İnsan kalbi kaç odacıklıdır?', c: ['2', '3', '4', '5'], d: 2, k: 'Bilim' },
  { s: 'Altın elementinin simgesi nedir?', c: ['Ag', 'Au', 'Al', 'Fe'], d: 1, k: 'Bilim' },
  { s: 'Deniz seviyesinde su kaç derecede kaynar?', c: ['90°C', '100°C', '110°C', '80°C'], d: 1, k: 'Bilim' },
  { s: 'Dünya’nın tek doğal uydusu nedir?', c: ['Ay', 'Titan', 'Europa', 'Phobos'], d: 0, k: 'Bilim' },
  { s: 'Karadaki en hızlı hayvan hangisidir?', c: ['Aslan', 'Çita', 'Antilop', 'At'], d: 1, k: 'Bilim' },
  { s: 'Dünyanın en büyük memeli hayvanı hangisidir?', c: ['Fil', 'Mavi balina', 'Zürafa', 'Gergedan'], d: 1, k: 'Bilim' },
  { s: 'Örümceğin kaç bacağı vardır?', c: ['6', '8', '10', '12'], d: 1, k: 'Bilim' },
  { s: 'Bitkilerin güneş ışığıyla besin üretmesine ne denir?', c: ['Solunum', 'Fotosentez', 'Terleme', 'Emilim'], d: 1, k: 'Bilim' },
  { s: 'Işık bir saniyede yaklaşık kaç km yol alır?', c: ['30.000', '300.000', '3.000.000', '3.000'], d: 1, k: 'Bilim' },
  { s: 'Oksijen elementinin simgesi nedir?', c: ['O', 'Ox', 'Og', 'On'], d: 0, k: 'Bilim' },
  { s: 'Kanı vücutta pompalayan organ hangisidir?', c: ['Karaciğer', 'Akciğer', 'Kalp', 'Böbrek'], d: 2, k: 'Bilim' },
  { s: 'Buz kaç derecede erimeye başlar?', c: ['0°C', '-10°C', '10°C', '5°C'], d: 0, k: 'Bilim' },

  // --- Dunya ---
  { s: 'Japonya’nın başkenti neresidir?', c: ['Osaka', 'Kyoto', 'Tokyo', 'Nagoya'], d: 2, k: 'Dünya' },
  { s: 'Eyfel Kulesi hangi şehirdedir?', c: ['Roma', 'Paris', 'Londra', 'Madrid'], d: 1, k: 'Dünya' },
  { s: 'Kolezyum hangi şehirdedir?', c: ['Atina', 'Roma', 'Napoli', 'Milano'], d: 1, k: 'Dünya' },
  { s: 'Piramitler hangi ülkededir?', c: ['Meksika', 'Mısır', 'Sudan', 'Ürdün'], d: 1, k: 'Dünya' },
  { s: 'Özgürlük Heykeli hangi şehirdedir?', c: ['Boston', 'Washington', 'New York', 'Chicago'], d: 2, k: 'Dünya' },
  { s: 'Dünyanın en büyük okyanusu hangisidir?', c: ['Atlas', 'Hint', 'Pasifik', 'Arktik'], d: 2, k: 'Dünya' },
  { s: 'En kalabalık kıta hangisidir?', c: ['Afrika', 'Asya', 'Avrupa', 'Amerika'], d: 1, k: 'Dünya' },
  { s: 'Kanguru hangi ülkeyle özdeşleşmiştir?', c: ['Yeni Zelanda', 'Avustralya', 'Güney Afrika', 'Brezilya'], d: 1, k: 'Dünya' },
  { s: 'Dünyanın en yüksek dağı hangisidir?', c: ['K2', 'Everest', 'Kilimanjaro', 'Mont Blanc'], d: 1, k: 'Dünya' },
  { s: 'Almanya’nın başkenti neresidir?', c: ['Münih', 'Hamburg', 'Berlin', 'Frankfurt'], d: 2, k: 'Dünya' },
  { s: 'Big Ben hangi şehirdedir?', c: ['Londra', 'Dublin', 'Edinburgh', 'Manchester'], d: 0, k: 'Dünya' },
  { s: 'Sahra Çölü hangi kıtadadır?', c: ['Asya', 'Afrika', 'Avustralya', 'Amerika'], d: 1, k: 'Dünya' },
  { s: 'Amazon Ormanları ağırlıklı hangi ülkededir?', c: ['Peru', 'Kolombiya', 'Brezilya', 'Venezuela'], d: 2, k: 'Dünya' },
  { s: 'Pizza hangi ülkenin geleneksel yemeğidir?', c: ['Yunanistan', 'İtalya', 'İspanya', 'Fransa'], d: 1, k: 'Dünya' },
  { s: 'Samuray geleneği hangi ülkeye aittir?', c: ['Çin', 'Kore', 'Japonya', 'Vietnam'], d: 2, k: 'Dünya' },

  // --- Sanat & Edebiyat ---
  { s: 'Mona Lisa tablosunun ressamı kimdir?', c: ['Van Gogh', 'Picasso', 'Leonardo da Vinci', 'Michelangelo'], d: 2, k: 'Sanat' },
  { s: '“Kürk Mantolu Madonna” romanının yazarı kimdir?', c: ['Sabahattin Ali', 'Yaşar Kemal', 'Orhan Kemal', 'Peyami Safa'], d: 0, k: 'Sanat' },
  { s: '“Çalıkuşu” romanının yazarı kimdir?', c: ['Halide Edib', 'Reşat Nuri Güntekin', 'Ahmet Hamdi', 'Refik Halid'], d: 1, k: 'Sanat' },
  { s: 'Nobel Edebiyat Ödülü alan ilk Türk yazar kimdir?', c: ['Yaşar Kemal', 'Nazım Hikmet', 'Orhan Pamuk', 'Aziz Nesin'], d: 2, k: 'Sanat' },
  { s: '“İnce Memed” romanının yazarı kimdir?', c: ['Yaşar Kemal', 'Orhan Kemal', 'Kemal Tahir', 'Fakir Baykurt'], d: 0, k: 'Sanat' },
  { s: '“Yıldızlı Gece” tablosu hangi ressama aittir?', c: ['Monet', 'Van Gogh', 'Dali', 'Renoir'], d: 1, k: 'Sanat' },
  { s: 'Piyanoda kaç tuş vardır (standart)?', c: ['76', '88', '61', '96'], d: 1, k: 'Sanat' },
  { s: '“Nutuk” eserinin yazarı kimdir?', c: ['İsmet İnönü', 'Atatürk', 'Ziya Gökalp', 'Namık Kemal'], d: 1, k: 'Sanat' },

  // --- Spor ---
  { s: 'Futbolda bir takım sahada kaç oyuncuyla başlar?', c: ['10', '11', '12', '9'], d: 1, k: 'Spor' },
  { s: 'Basketbolda bir takım sahada kaç oyuncu bulundurur?', c: ['5', '6', '7', '4'], d: 0, k: 'Spor' },
  { s: 'Voleybolda bir takım sahada kaç oyuncu bulundurur?', c: ['5', '6', '7', '8'], d: 1, k: 'Spor' },
  { s: 'FIFA Dünya Kupası kaç yılda bir düzenlenir?', c: ['2', '3', '4', '5'], d: 2, k: 'Spor' },
  { s: 'Yaz Olimpiyatları kaç yılda bir düzenlenir?', c: ['2', '4', '5', '6'], d: 1, k: 'Spor' },
  { s: 'Teniste “love” kaç sayıyı ifade eder?', c: ['0', '15', '30', '40'], d: 0, k: 'Spor' },
  { s: 'Satranç tahtasında kaç kare vardır?', c: ['36', '49', '64', '81'], d: 2, k: 'Spor' },
  { s: 'Bir futbol maçı normal süresi kaç dakikadır?', c: ['80', '90', '100', '120'], d: 1, k: 'Spor' },

  // --- Gunluk hayat ---
  { s: 'Bir yıl kaç gündür (artık yıl hariç)?', c: ['360', '364', '365', '366'], d: 2, k: 'Genel' },
  { s: 'Gökkuşağında kaç renk vardır?', c: ['5', '6', '7', '8'], d: 2, k: 'Genel' },
  { s: 'Bir düzine kaç adettir?', c: ['10', '12', '15', '20'], d: 1, k: 'Genel' },
  { s: 'Trafik ışığında “dur” hangi renktir?', c: ['Sarı', 'Yeşil', 'Kırmızı', 'Mavi'], d: 2, k: 'Genel' },
  { s: 'Bir günde kaç saat vardır?', c: ['12', '24', '48', '20'], d: 1, k: 'Genel' },
  { s: 'Klavyedeki en yaygın harf düzeni hangisidir?', c: ['QWERTY', 'ABCDEF', 'AZERTY', 'DVORAK'], d: 0, k: 'Genel' },
  { s: 'Bir haftada kaç gün vardır?', c: ['5', '6', '7', '8'], d: 2, k: 'Genel' },
  { s: 'Bir asır kaç yıldır?', c: ['10', '50', '100', '1000'], d: 2, k: 'Genel' },
  { s: 'Sağlıklı bir yetişkinin normal vücut sıcaklığı yaklaşık kaçtır?', c: ['35°C', '36.5°C', '38°C', '39°C'], d: 1, k: 'Genel' },
  { s: 'Bir futbol sahasında kaç kale vardır?', c: ['1', '2', '3', '4'], d: 1, k: 'Genel' },
  { s: 'Çay hangi ilimizde yoğun olarak yetiştirilir?', c: ['Rize', 'Ordu', 'Samsun', 'Sinop'], d: 0, k: 'Genel' },
  { s: 'Fındık üretiminde öne çıkan ilimiz hangisidir?', c: ['Trabzon', 'Giresun', 'Rize', 'Artvin'], d: 1, k: 'Genel' },
];
