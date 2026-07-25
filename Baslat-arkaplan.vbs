' ---------------------------------------------------------------------------
'  TikTok Yayin Oyuncaklari — ARKA PLAN baslatici
'
'  Baslat.bat siyah bir konsol penceresi aciyor. Yayin sirasinda o pencerenin
'  ekranda durmasini istemiyorsan bunu cift tikla: kopru gorunmeden calisir,
'  sadece kontrol paneli acilir.
'
'  KAPATMAK ICIN: kontrol panelindeki "Durdur" dugmesi.
'  (Panel kapaliysa Durdur.bat dosyasini cift tikla.)
' ---------------------------------------------------------------------------

Dim kabuk, klasor, komut
Set kabuk = CreateObject("WScript.Shell")
klasor = Left(WScript.ScriptFullName, InStrRev(WScript.ScriptFullName, "\"))

kabuk.CurrentDirectory = klasor

' Kullanici adi daha once kaydedildiyse onu kullan, yoksa mock
Dim dosya, kullanici, argumanlar
Set dosya = CreateObject("Scripting.FileSystemObject")
kullanici = ""
If dosya.FileExists(klasor & "kullanici-adi.txt") Then
    Dim akis
    Set akis = dosya.OpenTextFile(klasor & "kullanici-adi.txt", 1)
    If Not akis.AtEndOfStream Then kullanici = Trim(akis.ReadLine)
    akis.Close
End If

If kullanici = "" Then
    argumanlar = "--mock"
Else
    argumanlar = "--user " & kullanici
End If

' Bagimliliklar hic kurulmadiysa arka planda kurmak riskli (uzun surer,
' kullanici hicbir sey gormez). O durumda gorunur baslaticiya yonlendir.
If Not dosya.FolderExists(klasor & "server\node_modules") And kullanici <> "" Then
    MsgBox "Ilk kurulum gerekiyor." & vbCrLf & vbCrLf & _
           "Lutfen once Baslat.bat dosyasini cift tikla — paketleri kurup" & vbCrLf & _
           "kullanici adini soracak. Sonraki acilislarda bunu kullanabilirsin.", _
           vbInformation, "TikTok Yayin Oyuncaklari"
    WScript.Quit
End If

' 0 = pencere gizli, False = bitmesini bekleme
komut = "cmd /c node """ & klasor & "server\bridge.js"" " & argumanlar
kabuk.Run komut, 0, False

' Kopru ayaga kalksin, sonra paneli ac
WScript.Sleep 2500
kabuk.Run "http://localhost:8787/", 1, False
