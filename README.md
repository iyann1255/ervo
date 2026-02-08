# 🤖 Simple WhatsApp Bot

Bot WhatsApp sederhana dengan 2 fitur utama:
1. **RVO (Read View Once)** - Lihat pesan view once
2. **Sticker Maker** - Bikin sticker dari gambar/video

## 📋 Fitur

### 1️⃣ RVO (Read View Once)
- Command: `.rvo`, `.read`, `.liat`
- Cara pakai: Reply pesan view once dengan command
- Contoh: Reply foto/video view once lalu ketik `.rvo`

### 2️⃣ Sticker Maker
- Command: `.s`, `.stiker`, `.sticker`
- Cara pakai: Kirim/reply gambar atau video dengan command
- Batasan: Video maksimal 10 detik
- Contoh: Kirim gambar lalu ketik `.s`

## 🚀 Cara Install & Jalankan

### 1. Install Dependencies
```bash
npm install
```

### 2. Jalankan Bot
```bash
npm start
```

### 3. Scan QR Code
Scan QR code yang muncul di terminal dengan WhatsApp kamu

## 📱 Cara Pakai

1. **Menu/Help**
   ```
   .menu atau .help
   ```

2. **RVO - Baca View Once**
   - Tunggu ada yang kirim view once
   - Reply pesan view once tersebut
   - Ketik `.rvo`
   - Bot akan kirim media tanpa view once

3. **Sticker - Bikin Stiker**
   - Kirim gambar/video (atau reply gambar/video)
   - Ketik `.s`
   - Bot akan bikin sticker

## 📦 Dependencies

- `@whiskeysockets/baileys` - Library WhatsApp
- `wa-sticker-formatter` - Untuk bikin sticker
- `sharp` - Image processing
- `node-webpmux` - WebP support
- `qrcode-terminal` - Generate QR di terminal
- `pino` - Logger

## 🔧 Struktur File

```
simple-bot/
├── index.js           # File utama bot
├── package.json       # Dependencies
├── auth_info/         # Folder auth (auto-generated)
└── README.md          # Dokumentasi ini
```

## ⚠️ Catatan

- Bot ini menggunakan kode dari repository RTXZY-MD
- Hanya mengambil fitur RVO dan Sticker saja
- Ringan dan simpel untuk dipake
- Session tersimpan di folder `auth_info/`

## 📝 Command List

| Command | Fungsi |
|---------|--------|
| `.menu` / `.help` | Tampilkan menu |
| `.rvo` / `.read` / `.liat` | Lihat pesan view once |
| `.s` / `.stiker` / `.sticker` | Bikin sticker |

## 🎯 Tips

- Untuk RVO: Pastikan reply pesan view once-nya, bukan kirim biasa
- Untuk Sticker: Video jangan lebih dari 10 detik
- Kalau bot disconnect, akan auto-reconnect
- Session tersimpan, jadi gak perlu scan QR lagi setelah restart

## 📄 License

MIT License - Kode diambil dari RTXZY-MD
