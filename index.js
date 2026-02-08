const { 
    default: makeWASocket,
    DisconnectReason,
    useMultiFileAuthState,
    downloadMediaMessage
} = require('@whiskeysockets/baileys')
const pino = require('pino')
const qrcode = require('qrcode-terminal')
const { Sticker } = require('wa-sticker-formatter')

// Konfigurasi bot
const config = {
    packname: 'Simple Bot',
    author: 'RVO & Sticker Bot'
}

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('./auth_info')
    
    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: true,
        logger: pino({ level: 'silent' })
    })

    // Handle koneksi
    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update
        
        if (qr) {
            console.log('Scan QR code ini:')
            qrcode.generate(qr, { small: true })
        }
        
        if (connection === 'close') {
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut
            console.log('Koneksi tertutup, reconnect:', shouldReconnect)
            if (shouldReconnect) {
                startBot()
            }
        } else if (connection === 'open') {
            console.log('✅ Bot terhubung!')
        }
    })

    // Simpan kredensial
    sock.ev.on('creds.update', saveCreds)

    // Handler pesan
    sock.ev.on('messages.upsert', async ({ messages }) => {
        const m = messages[0]
        if (!m.message) return
        
        const from = m.key.remoteJid
        const isGroup = from.endsWith('@g.us')
        const sender = isGroup ? m.key.participant : from
        
        // Ambil teks pesan
        const body = m.message.conversation || 
                    m.message.extendedTextMessage?.text || 
                    m.message.imageMessage?.caption || 
                    m.message.videoMessage?.caption || ''
        
        const command = body.trim().toLowerCase()
        const quoted = m.message.extendedTextMessage?.contextInfo?.quotedMessage

        console.log(`Pesan dari ${sender}: ${body}`)

        // ===== FITUR 1: RVO (READ VIEW ONCE) =====
        if (['.rvo', '.read', '.liat'].includes(command)) {
            try {
                if (!quoted) {
                    await sock.sendMessage(from, { 
                        text: '❌ Reply pesan view once yang ingin dilihat!' 
                    }, { quoted: m })
                    return
                }

                console.log('Memproses RVO...')
                
                // Download media dari quoted message
                const buffer = await downloadMediaMessage(
                    { message: quoted },
                    'buffer',
                    {},
                    { 
                        logger: pino({ level: 'silent' }),
                        reuploadRequest: sock.updateMediaMessage
                    }
                )

                // Kirim media tanpa view once
                if (quoted.imageMessage) {
                    await sock.sendMessage(from, {
                        image: buffer,
                        caption: '✅ Ini gambar view once-nya!'
                    }, { quoted: m })
                } else if (quoted.videoMessage) {
                    await sock.sendMessage(from, {
                        video: buffer,
                        caption: '✅ Ini video view once-nya!'
                    }, { quoted: m })
                }
                
                console.log('✅ RVO berhasil')
            } catch (err) {
                console.error('Error RVO:', err)
                await sock.sendMessage(from, { 
                    text: '❌ Gagal memuat media view once!' 
                }, { quoted: m })
            }
        }

        // ===== FITUR 2: STICKER MAKER =====
        if (['.s', '.stiker', '.sticker'].includes(command)) {
            try {
                let media
                
                // Cek apakah ada gambar/video di pesan atau quoted
                if (m.message.imageMessage) {
                    media = await downloadMediaMessage(m, 'buffer', {}, {
                        logger: pino({ level: 'silent' }),
                        reuploadRequest: sock.updateMediaMessage
                    })
                } else if (m.message.videoMessage) {
                    const seconds = m.message.videoMessage.seconds
                    if (seconds > 10) {
                        await sock.sendMessage(from, { 
                            text: '❌ Video maksimal 10 detik!' 
                        }, { quoted: m })
                        return
                    }
                    media = await downloadMediaMessage(m, 'buffer', {}, {
                        logger: pino({ level: 'silent' }),
                        reuploadRequest: sock.updateMediaMessage
                    })
                } else if (quoted?.imageMessage) {
                    media = await downloadMediaMessage(
                        { message: quoted },
                        'buffer',
                        {},
                        {
                            logger: pino({ level: 'silent' }),
                            reuploadRequest: sock.updateMediaMessage
                        }
                    )
                } else if (quoted?.videoMessage) {
                    const seconds = quoted.videoMessage.seconds
                    if (seconds > 10) {
                        await sock.sendMessage(from, { 
                            text: '❌ Video maksimal 10 detik!' 
                        }, { quoted: m })
                        return
                    }
                    media = await downloadMediaMessage(
                        { message: quoted },
                        'buffer',
                        {},
                        {
                            logger: pino({ level: 'silent' }),
                            reuploadRequest: sock.updateMediaMessage
                        }
                    )
                } else {
                    await sock.sendMessage(from, { 
                        text: '❌ Kirim/reply gambar atau video dengan caption .s' 
                    }, { quoted: m })
                    return
                }

                await sock.sendMessage(from, { 
                    text: '⏳ Sedang membuat sticker...' 
                }, { quoted: m })

                console.log('Membuat sticker...')
                
                // Buat sticker
                const sticker = new Sticker(media, {
                    pack: config.packname,
                    author: config.author,
                    type: 'full',
                    quality: 50
                })

                const stickerBuffer = await sticker.toBuffer()
                
                await sock.sendMessage(from, {
                    sticker: stickerBuffer
                }, { quoted: m })
                
                console.log('✅ Sticker berhasil dibuat')
            } catch (err) {
                console.error('Error sticker:', err)
                await sock.sendMessage(from, { 
                    text: '❌ Gagal membuat sticker!' 
                }, { quoted: m })
            }
        }

        // Menu help
        if (['.menu', '.help'].includes(command)) {
            const menuText = `
╭━━━『 *SIMPLE BOT* 』
│
│ *FITUR RVO:*
│ • .rvo - Lihat pesan view once
│ • .read - Lihat pesan view once
│ • .liat - Lihat pesan view once
│
│ *FITUR STICKER:*
│ • .s - Buat sticker
│ • .stiker - Buat sticker
│ • .sticker - Buat sticker
│
│ *Cara pakai:*
│ • RVO: Reply pesan view once dengan .rvo
│ • Sticker: Kirim/reply gambar atau video dengan .s
│
╰━━━━━━━━━━━━━━━━━━`
            
            await sock.sendMessage(from, { text: menuText }, { quoted: m })
        }
    })

    return sock
}

// Start bot
startBot().catch(err => {
    console.error('Error starting bot:', err)
})
