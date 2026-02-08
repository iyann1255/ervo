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

### Untuk VPS (Ubuntu/Debian) - RECOMMENDED 24/7

#### 1. Install Dependencies
```bash
npm install
```

#### 2. Jalankan dengan PM2 (Otomatis)
```bash
chmod +x start.sh
./start.sh
```

#### 3. Atau Jalankan Manual dengan PM2
```bash
# Install PM2 (jika belum)
npm install -g pm2

# Start bot
pm2 start ecosystem.config.js

# Setup auto-start on boot
pm2 startup
pm2 save
```

#### 4. Command PM2 Berguna
```bash
pm2 logs simple-bot      # Lihat logs real-time
pm2 restart simple-bot   # Restart bot
pm2 stop simple-bot      # Stop bot
pm2 status              # Status semua apps
pm2 monit               # Monitoring real-time
```

### Untuk Local/Testing

#### 1. Install Dependencies
```bash
npm install
```

#### 2. Jalankan Bot
```bash
npm start
```

### 3. Scan QR Code
- Buka WhatsApp di HP
- Klik titik tiga > Linked Devices
- Link a Device
- Scan QR code yang muncul di terminal/logs

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

## 🔧 Troubleshooting VPS

### Bot terus reconnect tanpa QR code
1. **Hapus session lama:**
   ```bash
   rm -rf auth_info/
   pm2 restart simple-bot
   ```

2. **Lihat logs untuk cek QR code:**
   ```bash
   pm2 logs simple-bot --lines 100
   ```

3. **Scan QR code dari logs dengan phone:**
   - Buka WhatsApp
   - Linked Devices > Link a Device
   - Scan QR code yang ada di logs

### Connection timeout
1. **Cek koneksi internet VPS:**
   ```bash
   ping -c 4 google.com
   ```

2. **Restart bot:**
   ```bash
   pm2 restart simple-bot
   ```

### Bot crash terus
1. **Cek logs error:**
   ```bash
   pm2 logs simple-bot --err
   ```

2. **Update dependencies:**
   ```bash
   npm update
   pm2 restart simple-bot
   ```

### Port issues (jika pakai Nginx/Apache)
Bot WhatsApp gak butuh port forwarding, jadi aman.

## ⚙️ Konfigurasi VPS

### Requirements
- Node.js 16+ 
- RAM minimal 512MB
- Storage minimal 1GB

### Recommended Setup
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2
npm install -g pm2
```

## 📄 License

MIT License - Kode diambil dari RTXZY-MD
