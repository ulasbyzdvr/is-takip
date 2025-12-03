# İş Takip Mobil Uygulaması

React Native ve Expo ile geliştirilmiş mobil iş takip uygulaması.

## Özellikler

- ✅ Firma kaydı yapma
- ✅ İş kaydı girme (firma seçimi, tutar, açıklama)
- ✅ İşlere görsel ekleme (kamera veya galeriden)
- ✅ Firma bazlı iş listeleme
- ✅ Yerel veri saklama (AsyncStorage)

## Kurulum

1. Bağımlılıkları yükleyin:
```bash
npm install
```

2. Uygulamayı başlatın:
```bash
npm start
```

3. Expo Go uygulamasını telefonunuza indirin ve QR kodu tarayın, veya:
   - Android için: `npm run android`
   - iOS için: `npm run ios`

## Kullanım

### Firma Ekleme
- Ana ekranda "+ Firma" butonuna tıklayın
- Firma adını girin ve kaydedin

### İş Ekleme
- Ana ekranda "+ İş" butonuna tıklayın
- Firma seçin
- Tutar ve açıklama girin
- İsteğe bağlı olarak görsel ekleyin (kamera veya galeri)

### İşleri Görüntüleme
- Ana ekranda bir firmaya tıklayın
- O firmaya ait tüm işler listelenir
- Toplam tutar ve iş sayısı gösterilir

## Teknolojiler

- React Native
- Expo
- TypeScript
- React Navigation
- AsyncStorage
- Expo Image Picker

