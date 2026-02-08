#!/bin/bash

echo "🚀 Starting Simple WhatsApp Bot untuk VPS"
echo "=========================================="
echo ""

# Check if PM2 is installed
if ! command -v pm2 &> /dev/null
then
    echo "⚠️ PM2 belum terinstall!"
    echo "📦 Install PM2 dengan: npm install -g pm2"
    echo ""
    read -p "Install PM2 sekarang? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]
    then
        npm install -g pm2
    else
        exit 1
    fi
fi

# Stop bot jika sedang running
pm2 stop simple-bot 2>/dev/null
pm2 delete simple-bot 2>/dev/null

# Start bot dengan PM2
echo "🔄 Starting bot dengan PM2..."
pm2 start index.js --name simple-bot

# Setup auto-restart on reboot
echo "⚙️ Setup PM2 startup..."
pm2 startup
pm2 save

echo ""
echo "✅ Bot berhasil dijalankan!"
echo ""
echo "📋 Command berguna:"
echo "  pm2 logs simple-bot    - Lihat logs"
echo "  pm2 restart simple-bot - Restart bot"
echo "  pm2 stop simple-bot    - Stop bot"
echo "  pm2 status             - Status semua bot"
echo ""
