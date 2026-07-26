/**
 * sorular.js — Turkce bilgi yarismasi soru bankasi.
 *
 * Bicim:  { s: soru, c: [4 sik], d: dogru sikkin indeksi (0-3), k: kategori }
 *
 * ZORLUK: orta. KPSS genel kultur tarzinda — kisa, SPESIFIK, tek dogru
 * cevabi olan sorular. Onceki bankada "Turkiye'nin en yuksek dagi" gibi
 * herkesin bildigi sorular vardi ve yarismayi anlamsizlastiriyordu:
 * herkes ayni anda dogruyu yazinca ILK-DOGRU odulu bilgiye degil
 * baglanti hizina gidiyordu. Bu sorular bilenle bilmeyeni ayiriyor ama
 * uzman bilgisi de istemiyor.
 *
 * KURALLAR
 *   1) Soru tek satirda okunmali (TikTok'ta 3 saniye).
 *   2) Cevap TARTISMASIZ olmali — "en uzun kiyi", "ilk baskent" gibi
 *      kaynaga gore degisen sorular bilerek alinmadi.
 *   3) Guncel siyaset, din, takim tutma YOK. Tarih/cografya/edebiyat/
 *      bilim gibi degismeyen bilgiler.
 *   4) Celdiriciler makul olmali — uc sik sacmaysa o soru soru degildir.
 */
window.SORULAR = [
  // ===== KURTULUS SAVASI VE INKILAP TARIHI =====
  { s: 'Sakarya Meydan Muharebesi hangi yıl yapıldı?', c: ['1920', '1921', '1922', '1923'], d: 1, k: 'İnkılap Tarihi' },
  { s: 'Büyük Taarruz hangi yıl başlatıldı?', c: ['1921', '1922', '1923', '1920'], d: 1, k: 'İnkılap Tarihi' },
  { s: 'TBMM hangi tarihte açıldı?', c: ['19 Mayıs 1919', '23 Nisan 1920', '29 Ekim 1923', '30 Ağustos 1922'], d: 1, k: 'İnkılap Tarihi' },
  { s: 'Kurtuluş Savaşı’nı sona erdiren barış antlaşması hangisidir?', c: ['Sevr', 'Mudanya', 'Lozan', 'Kars'], d: 2, k: 'İnkılap Tarihi' },
  { s: 'Saltanat hangi yıl kaldırıldı?', c: ['1920', '1922', '1924', '1923'], d: 1, k: 'İnkılap Tarihi' },
  { s: 'Halifelik hangi yıl kaldırıldı?', c: ['1922', '1923', '1924', '1926'], d: 2, k: 'İnkılap Tarihi' },
  { s: 'Harf İnkılabı (Latin alfabesi) hangi yıl kabul edildi?', c: ['1924', '1926', '1928', '1932'], d: 2, k: 'İnkılap Tarihi' },
  { s: 'Soyadı Kanunu hangi yıl kabul edildi?', c: ['1928', '1930', '1934', '1936'], d: 2, k: 'İnkılap Tarihi' },
  { s: 'Türk Medeni Kanunu hangi yıl kabul edildi?', c: ['1924', '1926', '1928', '1930'], d: 1, k: 'İnkılap Tarihi' },
  { s: 'Kadınlara milletvekili seçilme hakkı hangi yıl verildi?', c: ['1930', '1934', '1926', '1938'], d: 1, k: 'İnkılap Tarihi' },
  { s: 'Amasya Genelgesi hangi yıl yayımlandı?', c: ['1918', '1919', '1920', '1921'], d: 1, k: 'İnkılap Tarihi' },
  { s: 'Sivas Kongresi hangi yıl toplandı?', c: ['1919', '1920', '1921', '1918'], d: 0, k: 'İnkılap Tarihi' },
  { s: 'Mondros Ateşkes Antlaşması hangi yıl imzalandı?', c: ['1914', '1916', '1918', '1920'], d: 2, k: 'İnkılap Tarihi' },
  { s: 'Sevr Antlaşması hangi yıl imzalandı?', c: ['1918', '1919', '1920', '1922'], d: 2, k: 'İnkılap Tarihi' },
  { s: 'Mudanya Ateşkes Antlaşması hangi yıl imzalandı?', c: ['1920', '1921', '1922', '1923'], d: 2, k: 'İnkılap Tarihi' },
  { s: 'Çanakkale Savaşları hangi yıl başladı?', c: ['1912', '1914', '1915', '1916'], d: 2, k: 'İnkılap Tarihi' },
  { s: 'İlk anayasamız Teşkilat-ı Esasiye hangi yıl kabul edildi?', c: ['1920', '1921', '1923', '1924'], d: 1, k: 'İnkılap Tarihi' },
  { s: 'Ankara hangi yıl başkent ilan edildi?', c: ['1920', '1922', '1923', '1924'], d: 2, k: 'İnkılap Tarihi' },
  { s: 'Mustafa Kemal Samsun’a hangi tarihte çıktı?', c: ['19 Mayıs 1919', '23 Nisan 1920', '9 Eylül 1922', '30 Ağustos 1922'], d: 0, k: 'İnkılap Tarihi' },
  { s: 'Kabotaj Kanunu Türk gemilerine hangi hakkı verdi?', c: ['Uçuş hakkı', 'Kıyılarda taşımacılık', 'Balıkçılık tekeli', 'Liman işletmeciliği'], d: 1, k: 'İnkılap Tarihi' },

  // ===== OSMANLI VE SELCUKLU =====
  { s: 'Malazgirt Savaşı hangi yıl yapıldı?', c: ['1048', '1071', '1176', '1243'], d: 1, k: 'Tarih' },
  { s: 'Malazgirt’te Bizans ordusunu yenen Selçuklu sultanı kimdir?', c: ['Tuğrul Bey', 'Alparslan', 'Melikşah', 'Sultan Sencer'], d: 1, k: 'Tarih' },
  { s: 'Anadolu Selçuklu Devleti’nin başkenti neresidir?', c: ['Kayseri', 'Sivas', 'Konya', 'Niğde'], d: 2, k: 'Tarih' },
  { s: 'Kösedağ Savaşı’nda Anadolu Selçuklu’yu kim yendi?', c: ['Bizans', 'Moğollar', 'Haçlılar', 'Memlükler'], d: 1, k: 'Tarih' },
  { s: 'İstanbul hangi yıl fethedildi?', c: ['1402', '1453', '1481', '1514'], d: 1, k: 'Tarih' },
  { s: 'Ankara Savaşı’nda Yıldırım Bayezid kime yenildi?', c: ['Timur', 'Şah İsmail', 'Uzun Hasan', 'Memlükler'], d: 0, k: 'Tarih' },
  { s: 'Çaldıran Savaşı hangi padişah döneminde yapıldı?', c: ['Fatih Sultan Mehmet', 'Yavuz Sultan Selim', 'Kanuni', 'II. Bayezid'], d: 1, k: 'Tarih' },
  { s: 'Mohaç Meydan Muharebesi hangi yıl yapıldı?', c: ['1514', '1520', '1526', '1571'], d: 2, k: 'Tarih' },
  { s: 'Preveze Deniz Savaşı’nı kazanan Osmanlı amirali kimdir?', c: ['Turgut Reis', 'Piri Reis', 'Barbaros Hayreddin Paşa', 'Kılıç Ali Paşa'], d: 2, k: 'Tarih' },
  { s: 'Tanzimat Fermanı hangi yıl ilan edildi?', c: ['1826', '1839', '1856', '1876'], d: 1, k: 'Tarih' },
  { s: 'Kanun-i Esasi hangi yıl ilan edildi?', c: ['1856', '1876', '1908', '1839'], d: 1, k: 'Tarih' },
  { s: 'II. Meşrutiyet hangi yıl ilan edildi?', c: ['1876', '1908', '1918', '1839'], d: 1, k: 'Tarih' },
  { s: 'Niğbolu Savaşı hangi padişah döneminde kazanıldı?', c: ['I. Murat', 'Yıldırım Bayezid', 'Fatih', 'II. Murat'], d: 1, k: 'Tarih' },
  { s: 'Osmanlı’da ilk Türkçe matbaayı kuran kimdir?', c: ['Kâtip Çelebi', 'İbrahim Müteferrika', 'Evliya Çelebi', 'Piri Reis'], d: 1, k: 'Tarih' },
  { s: 'Yeniçeri Ocağı hangi padişah tarafından kaldırıldı?', c: ['III. Selim', 'II. Mahmut', 'Abdülmecit', 'II. Abdülhamit'], d: 1, k: 'Tarih' },
  { s: 'Fatih Sultan Mehmet Osmanlı’nın kaçıncı padişahıdır?', c: ['5.', '6.', '7.', '8.'], d: 2, k: 'Tarih' },
  { s: '“Kitab-ı Bahriye” adlı denizcilik eserinin yazarı kimdir?', c: ['Piri Reis', 'Seydi Ali Reis', 'Barbaros', 'Turgut Reis'], d: 0, k: 'Tarih' },
  { s: 'Osmanlı’da askeri amaçlı toprak sistemi hangi adla anılır?', c: ['Tımar', 'Vakıf', 'Mülk', 'Yurtluk'], d: 0, k: 'Tarih' },

  // ===== TURKIYE COGRAFYASI =====
  { s: 'Türkiye’nin en büyük ovası hangisidir?', c: ['Çukurova', 'Konya Ovası', 'Bafra Ovası', 'Amik Ovası'], d: 1, k: 'Coğrafya' },
  { s: 'Türkiye’nin en derin gölü hangisidir?', c: ['Beyşehir', 'Van Gölü', 'Tuz Gölü', 'İznik'], d: 1, k: 'Coğrafya' },
  { s: 'Yüzölçümü en büyük coğrafi bölgemiz hangisidir?', c: ['İç Anadolu', 'Doğu Anadolu', 'Karadeniz', 'Akdeniz'], d: 1, k: 'Coğrafya' },
  { s: 'Yüzölçümü en küçük coğrafi bölgemiz hangisidir?', c: ['Marmara', 'Ege', 'Güneydoğu Anadolu', 'Akdeniz'], d: 2, k: 'Coğrafya' },
  { s: 'Nüfusu en kalabalık coğrafi bölgemiz hangisidir?', c: ['Ege', 'İç Anadolu', 'Marmara', 'Akdeniz'], d: 2, k: 'Coğrafya' },
  { s: 'Atatürk Barajı hangi nehir üzerindedir?', c: ['Dicle', 'Fırat', 'Kızılırmak', 'Sakarya'], d: 1, k: 'Coğrafya' },
  { s: 'Keban Barajı hangi nehir üzerindedir?', c: ['Fırat', 'Dicle', 'Yeşilırmak', 'Seyhan'], d: 0, k: 'Coğrafya' },
  { s: 'Çukurova’yı oluşturan nehirler hangileridir?', c: ['Seyhan-Ceyhan', 'Fırat-Dicle', 'Gediz-Menderes', 'Kızılırmak-Yeşilırmak'], d: 0, k: 'Coğrafya' },
  { s: 'Göbeklitepe hangi ilimizdedir?', c: ['Mardin', 'Şanlıurfa', 'Diyarbakır', 'Gaziantep'], d: 1, k: 'Coğrafya' },
  { s: 'Çatalhöyük hangi ilimizdedir?', c: ['Konya', 'Karaman', 'Aksaray', 'Niğde'], d: 0, k: 'Coğrafya' },
  { s: 'Ani Harabeleri hangi ilimizdedir?', c: ['Ardahan', 'Kars', 'Iğdır', 'Ağrı'], d: 1, k: 'Coğrafya' },
  { s: 'İshak Paşa Sarayı hangi ilimizdedir?', c: ['Van', 'Ağrı', 'Bitlis', 'Muş'], d: 1, k: 'Coğrafya' },
  { s: 'Safranbolu hangi ilimizin ilçesidir?', c: ['Bartın', 'Kastamonu', 'Karabük', 'Zonguldak'], d: 2, k: 'Coğrafya' },
  { s: 'Hasankeyf hangi ilimizdedir?', c: ['Siirt', 'Batman', 'Mardin', 'Şırnak'], d: 1, k: 'Coğrafya' },
  { s: 'Ihlara Vadisi hangi ilimizdedir?', c: ['Nevşehir', 'Aksaray', 'Niğde', 'Kayseri'], d: 1, k: 'Coğrafya' },
  { s: 'Uzungöl hangi ilimizdedir?', c: ['Rize', 'Trabzon', 'Giresun', 'Artvin'], d: 1, k: 'Coğrafya' },
  { s: 'Toros Dağları hangi bölgemizde uzanır?', c: ['Ege', 'Akdeniz', 'Karadeniz', 'İç Anadolu'], d: 1, k: 'Coğrafya' },
  { s: 'Kızılırmak hangi denize dökülür?', c: ['Marmara', 'Ege', 'Karadeniz', 'Akdeniz'], d: 2, k: 'Coğrafya' },
  { s: 'Fırat ve Dicle nehirleri nereye ulaşır?', c: ['Akdeniz', 'Basra Körfezi', 'Kızıldeniz', 'Hazar Denizi'], d: 1, k: 'Coğrafya' },
  { s: 'Türkiye’nin en çok yağış alan yöresi neresidir?', c: ['Doğu Karadeniz', 'Batı Akdeniz', 'Trakya', 'Doğu Anadolu'], d: 0, k: 'Coğrafya' },
  { s: 'Nemrut Dağı’ndaki dev heykeller hangi ildedir?', c: ['Malatya', 'Adıyaman', 'Şanlıurfa', 'Elazığ'], d: 1, k: 'Coğrafya' },
  { s: 'Pamukkale travertenleri hangi ildedir?', c: ['Aydın', 'Denizli', 'Muğla', 'Uşak'], d: 1, k: 'Coğrafya' },
  { s: 'Sümela Manastırı hangi ildedir?', c: ['Rize', 'Gümüşhane', 'Trabzon', 'Giresun'], d: 2, k: 'Coğrafya' },
  { s: 'Türkiye’nin en güney noktası hangi ilimizdedir?', c: ['Mersin', 'Antalya', 'Hatay', 'Adana'], d: 2, k: 'Coğrafya' },
  { s: 'Kapadokya peribacaları ağırlıklı olarak hangi ildedir?', c: ['Kayseri', 'Nevşehir', 'Aksaray', 'Niğde'], d: 1, k: 'Coğrafya' },
  { s: 'Türkiye kaç coğrafi bölgeye ayrılır?', c: ['5', '6', '7', '8'], d: 2, k: 'Coğrafya' },
  { s: 'Tuz Gölü hangi coğrafi bölgemizdedir?', c: ['İç Anadolu', 'Doğu Anadolu', 'Akdeniz', 'Ege'], d: 0, k: 'Coğrafya' },
  { s: 'Efes Antik Kenti hangi ildedir?', c: ['Aydın', 'Manisa', 'İzmir', 'Muğla'], d: 2, k: 'Coğrafya' },
  { s: 'Truva Antik Kenti hangi ildedir?', c: ['Balıkesir', 'Çanakkale', 'Edirne', 'Tekirdağ'], d: 1, k: 'Coğrafya' },
  { s: 'Ölüdeniz hangi ilimizdedir?', c: ['Antalya', 'Muğla', 'Aydın', 'İzmir'], d: 1, k: 'Coğrafya' },

  // ===== TURK EDEBIYATI =====
  { s: '“Çalıkuşu” romanının yazarı kimdir?', c: ['Halide Edib Adıvar', 'Reşat Nuri Güntekin', 'Yakup Kadri', 'Peyami Safa'], d: 1, k: 'Edebiyat' },
  { s: '“Kürk Mantolu Madonna” kimin eseridir?', c: ['Sabahattin Ali', 'Sait Faik', 'Orhan Kemal', 'Kemal Tahir'], d: 0, k: 'Edebiyat' },
  { s: '“İnce Memed” romanının yazarı kimdir?', c: ['Orhan Kemal', 'Yaşar Kemal', 'Fakir Baykurt', 'Kemal Tahir'], d: 1, k: 'Edebiyat' },
  { s: '“Yaban” romanının yazarı kimdir?', c: ['Yakup Kadri Karaosmanoğlu', 'Halit Ziya', 'Refik Halit', 'Ahmet Hamdi Tanpınar'], d: 0, k: 'Edebiyat' },
  { s: '“Sinekli Bakkal” kimin eseridir?', c: ['Halide Edib Adıvar', 'Reşat Nuri', 'Yakup Kadri', 'Hüseyin Rahmi'], d: 0, k: 'Edebiyat' },
  { s: '“Aşk-ı Memnu” romanının yazarı kimdir?', c: ['Recaizade Mahmut Ekrem', 'Halit Ziya Uşaklıgil', 'Namık Kemal', 'Mehmet Rauf'], d: 1, k: 'Edebiyat' },
  { s: '“Araba Sevdası” kimin eseridir?', c: ['Namık Kemal', 'Ahmet Mithat', 'Recaizade Mahmut Ekrem', 'Şinasi'], d: 2, k: 'Edebiyat' },
  { s: '“Saatleri Ayarlama Enstitüsü” kimin romanıdır?', c: ['Oğuz Atay', 'Ahmet Hamdi Tanpınar', 'Peyami Safa', 'Yusuf Atılgan'], d: 1, k: 'Edebiyat' },
  { s: '“Tutunamayanlar” romanının yazarı kimdir?', c: ['Oğuz Atay', 'Yusuf Atılgan', 'Bilge Karasu', 'Ferit Edgü'], d: 0, k: 'Edebiyat' },
  { s: 'Nobel Edebiyat Ödülü alan Türk yazar kimdir?', c: ['Yaşar Kemal', 'Orhan Pamuk', 'Nâzım Hikmet', 'Ahmet Hamdi Tanpınar'], d: 1, k: 'Edebiyat' },
  { s: '“Safahat” adlı eserin şairi kimdir?', c: ['Tevfik Fikret', 'Mehmet Akif Ersoy', 'Yahya Kemal', 'Namık Kemal'], d: 1, k: 'Edebiyat' },
  { s: '“Divanü Lugati’t-Türk”ün yazarı kimdir?', c: ['Yusuf Has Hacib', 'Kaşgarlı Mahmud', 'Ahmed Yesevi', 'Edip Ahmet'], d: 1, k: 'Edebiyat' },
  { s: '“Kutadgu Bilig”in yazarı kimdir?', c: ['Kaşgarlı Mahmud', 'Yusuf Has Hacib', 'Ali Şir Nevai', 'Ahmed Yesevi'], d: 1, k: 'Edebiyat' },
  { s: '“Seyahatname” adlı eserin yazarı kimdir?', c: ['Kâtip Çelebi', 'Evliya Çelebi', 'Piri Reis', 'Naima'], d: 1, k: 'Edebiyat' },
  { s: 'Orhun Yazıtları hangi alfabeyle yazılmıştır?', c: ['Uygur', 'Göktürk', 'Arap', 'Latin'], d: 1, k: 'Edebiyat' },
  { s: 'İlk Türk romanı “Taaşşuk-ı Talat ve Fitnat” kimindir?', c: ['Namık Kemal', 'Şemsettin Sami', 'Ahmet Mithat', 'Şinasi'], d: 1, k: 'Edebiyat' },
  { s: '“Han Duvarları” şiiri kime aittir?', c: ['Faruk Nafiz Çamlıbel', 'Yahya Kemal', 'Ahmet Haşim', 'Cahit Sıtkı'], d: 0, k: 'Edebiyat' },
  { s: '“Otuz Beş Yaş” şiirinin şairi kimdir?', c: ['Orhan Veli', 'Cahit Sıtkı Tarancı', 'Necip Fazıl', 'Attila İlhan'], d: 1, k: 'Edebiyat' },
  { s: 'Garip akımının öncü şairi kimdir?', c: ['Orhan Veli Kanık', 'Nâzım Hikmet', 'Cemal Süreya', 'Turgut Uyar'], d: 0, k: 'Edebiyat' },
  { s: '“Anayurt Oteli” romanının yazarı kimdir?', c: ['Oğuz Atay', 'Yusuf Atılgan', 'Adalet Ağaoğlu', 'Ferit Edgü'], d: 1, k: 'Edebiyat' },
  { s: 'İstiklal Marşı’nın şairi kimdir?', c: ['Namık Kemal', 'Mehmet Akif Ersoy', 'Tevfik Fikret', 'Yahya Kemal'], d: 1, k: 'Edebiyat' },

  // ===== BILIM =====
  { s: 'İnsan vücudunda kaç kemik vardır?', c: ['186', '196', '206', '216'], d: 2, k: 'Bilim' },
  { s: 'Kana kırmızı rengini veren protein hangisidir?', c: ['Miyoglobin', 'Hemoglobin', 'Keratin', 'Kollajen'], d: 1, k: 'Bilim' },
  { s: 'Periyodik tablodaki ilk element hangisidir?', c: ['Helyum', 'Hidrojen', 'Oksijen', 'Karbon'], d: 1, k: 'Bilim' },
  { s: 'Altının kimyasal simgesi nedir?', c: ['Ag', 'Au', 'Al', 'Ar'], d: 1, k: 'Bilim' },
  { s: 'Demirin kimyasal simgesi nedir?', c: ['Fe', 'Fr', 'F', 'Fm'], d: 0, k: 'Bilim' },
  { s: 'Güneş sistemindeki en büyük gezegen hangisidir?', c: ['Satürn', 'Jüpiter', 'Neptün', 'Uranüs'], d: 1, k: 'Bilim' },
  { s: 'Güneşe en yakın gezegen hangisidir?', c: ['Venüs', 'Merkür', 'Mars', 'Dünya'], d: 1, k: 'Bilim' },
  { s: 'Yerçekimi yasasını formüle eden bilim insanı kimdir?', c: ['Galileo', 'Newton', 'Kepler', 'Einstein'], d: 1, k: 'Bilim' },
  { s: 'Görelilik teorisini ortaya koyan bilim insanı kimdir?', c: ['Bohr', 'Einstein', 'Planck', 'Heisenberg'], d: 1, k: 'Bilim' },
  { s: 'Penisilini keşfeden bilim insanı kimdir?', c: ['Pasteur', 'Fleming', 'Koch', 'Jenner'], d: 1, k: 'Bilim' },
  { s: 'Işık hızı yaklaşık kaç km/saniyedir?', c: ['30.000', '150.000', '300.000', '900.000'], d: 2, k: 'Bilim' },
  { s: 'Hücrenin enerji üreten organeli hangisidir?', c: ['Ribozom', 'Mitokondri', 'Lizozom', 'Golgi'], d: 1, k: 'Bilim' },
  { s: 'Kanın pıhtılaşmasını sağlayan kan hücresi hangisidir?', c: ['Alyuvar', 'Akyuvar', 'Trombosit', 'Plazma'], d: 2, k: 'Bilim' },
  { s: 'Ses hangi ortamda yayılamaz?', c: ['Katı', 'Sıvı', 'Gaz', 'Boşluk'], d: 3, k: 'Bilim' },
  { s: 'Vücudumuzun en büyük organı hangisidir?', c: ['Karaciğer', 'Deri', 'Akciğer', 'Bağırsak'], d: 1, k: 'Bilim' },
  { s: 'Elmas hangi elementin farklı bir biçimidir?', c: ['Silisyum', 'Karbon', 'Kükürt', 'Fosfor'], d: 1, k: 'Bilim' },
  { s: 'Suyun kimyasal formülü nedir?', c: ['H2O', 'CO2', 'O2', 'NaCl'], d: 0, k: 'Bilim' },

  // ===== DUNYA / GENEL KULTUR =====
  { s: 'Dünyanın yüzölçümü en büyük ülkesi hangisidir?', c: ['Kanada', 'Çin', 'Rusya', 'ABD'], d: 2, k: 'Dünya' },
  { s: 'Dünyanın en yüksek dağı hangisidir?', c: ['K2', 'Everest', 'Kilimanjaro', 'Aconcagua'], d: 1, k: 'Dünya' },
  { s: 'Dünyanın en büyük okyanusu hangisidir?', c: ['Atlas', 'Hint', 'Pasifik', 'Arktik'], d: 2, k: 'Dünya' },
  { s: 'Sahra Çölü hangi kıtadadır?', c: ['Asya', 'Afrika', 'Avustralya', 'Güney Amerika'], d: 1, k: 'Dünya' },
  { s: 'Afrika’nın en uzun nehri hangisidir?', c: ['Kongo', 'Nil', 'Zambezi', 'Nijer'], d: 1, k: 'Dünya' },
  { s: 'I. Dünya Savaşı hangi yıl başladı?', c: ['1912', '1914', '1916', '1918'], d: 1, k: 'Dünya' },
  { s: 'II. Dünya Savaşı hangi yıl sona erdi?', c: ['1943', '1944', '1945', '1946'], d: 2, k: 'Dünya' },
  { s: 'Fransız İhtilali hangi yıl başladı?', c: ['1776', '1789', '1804', '1815'], d: 1, k: 'Dünya' },
  { s: 'Berlin Duvarı hangi yıl yıkıldı?', c: ['1985', '1989', '1991', '1993'], d: 1, k: 'Dünya' },
  { s: 'Amerika kıtasına ulaşan ünlü denizci kimdir?', c: ['Macellan', 'Kristof Kolomb', 'Vasco da Gama', 'Marco Polo'], d: 1, k: 'Dünya' },
  { s: 'Matbaayı Avrupa’da geliştiren kişi kimdir?', c: ['Gutenberg', 'Galileo', 'Da Vinci', 'Newton'], d: 0, k: 'Dünya' },
  { s: '“Mona Lisa” tablosunun ressamı kimdir?', c: ['Michelangelo', 'Leonardo da Vinci', 'Raffaello', 'Van Gogh'], d: 1, k: 'Dünya' },
  { s: '“Suç ve Ceza” romanının yazarı kimdir?', c: ['Tolstoy', 'Dostoyevski', 'Çehov', 'Gogol'], d: 1, k: 'Dünya' },
  { s: '“Sefiller” romanının yazarı kimdir?', c: ['Balzac', 'Victor Hugo', 'Zola', 'Dumas'], d: 1, k: 'Dünya' },
  { s: '“Don Kişot” kimin eseridir?', c: ['Cervantes', 'Dante', 'Shakespeare', 'Goethe'], d: 0, k: 'Dünya' },
  { s: '“Hamlet” kimin eseridir?', c: ['Molière', 'Shakespeare', 'Ibsen', 'Çehov'], d: 1, k: 'Dünya' },
  { s: 'Modern olimpiyat oyunları ilk kez hangi ülkede yapıldı?', c: ['Fransa', 'Yunanistan', 'İngiltere', 'İtalya'], d: 1, k: 'Dünya' },
  { s: 'Vatikan hangi şehrin içindedir?', c: ['Roma', 'Milano', 'Floransa', 'Napoli'], d: 0, k: 'Dünya' },
  { s: 'Machu Picchu hangi ülkededir?', c: ['Meksika', 'Peru', 'Bolivya', 'Şili'], d: 1, k: 'Dünya' },
  { s: 'Ay’a ilk ayak basan insan kimdir?', c: ['Yuri Gagarin', 'Neil Armstrong', 'Buzz Aldrin', 'Michael Collins'], d: 1, k: 'Dünya' },
  { s: 'Uzaya çıkan ilk insan kimdir?', c: ['Neil Armstrong', 'Yuri Gagarin', 'Alan Shepard', 'John Glenn'], d: 1, k: 'Dünya' },
  { s: 'Dünyada kaç kıta vardır?', c: ['5', '6', '7', '8'], d: 2, k: 'Dünya' },

  // ===== KURUMLAR / VATANDASLIK =====
  { s: 'TBMM’de kaç milletvekili bulunur?', c: ['450', '550', '600', '650'], d: 2, k: 'Vatandaşlık' },
  { s: 'Türkiye’de seçme yaşı kaçtır?', c: ['16', '17', '18', '21'], d: 2, k: 'Vatandaşlık' },
  { s: 'Türkiye’de milletvekili seçilme yaşı kaçtır?', c: ['18', '21', '25', '30'], d: 0, k: 'Vatandaşlık' },
  { s: 'Anayasa Mahkemesi kaç üyeden oluşur?', c: ['11', '13', '15', '17'], d: 2, k: 'Vatandaşlık' },
  { s: 'Kamu harcamalarını denetleyen kurum hangisidir?', c: ['Danıştay', 'Sayıştay', 'Yargıtay', 'TÜİK'], d: 1, k: 'Vatandaşlık' },
  { s: 'Türkiye’de kaç il vardır?', c: ['79', '80', '81', '82'], d: 2, k: 'Vatandaşlık' },
  { s: 'Türkiye Cumhuriyeti hangi tarihte ilan edildi?', c: ['23 Nisan 1920', '30 Ağustos 1922', '29 Ekim 1923', '10 Kasım 1938'], d: 2, k: 'Vatandaşlık' },
  { s: 'İstiklal Marşı hangi yıl kabul edildi?', c: ['1920', '1921', '1923', '1924'], d: 1, k: 'Vatandaşlık' },
  { s: 'İstiklal Marşı’nın bestecisi kimdir?', c: ['Zeki Üngör', 'Mehmet Akif Ersoy', 'Ahmet Adnan Saygun', 'Cemal Reşit Rey'], d: 0, k: 'Vatandaşlık' },
];
