const { 
    default: makeWASocket,
    DisconnectReason,
    useMultiFileAuthState,
    downloadMediaMessage,
    makeInMemoryStore,
    fetchLatestBaileysVersion
} = require('@whiskeysockets/baileys')
const pino = require('pino')
const qrcode = require('qrcode-terminal')
const { Sticker } = require('wa-sticker-formatter')
const { Boom } = require('@hapi/boom')
const fs = require('fs')
const readline = require('readline')

// Konfigurasi bot
const config = {
    packname: 'Simple Bot',
    author: 'RVO & Sticker Bot'
}

// Create store for better connection handling
const store = makeInMemoryStore({ 
    logger: pino().child({ level: 'silent', stream: 'store' }) 
})

// Function untuk input pairing code
const question = (text) => {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    })
    return new Promise((resolve) => {
        rl.question(text, (answer) => {
            rl.close()
            resolve(answer)
        })
    })
}

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('./auth_info')
    const { version, isLatest } = await fetchLatestBaileysVersion()
    
    console.log(`🔧 Menggunakan WA v${version.join('.')}, isLatest: ${isLatest}`)
    
    // Tanya user mau pakai QR atau Pairing Code
    let usePairingCode = false
    let phoneNumber = ''
    
    if (!fs.existsSync('./auth_info/creds.json')) {
        console.log('\n📱 Pilih metode koneksi:')
        console.log('1. QR Code (scan dengan HP)')
        console.log('2. Pairing Code (masukin kode di HP)')
        
        const choice = await question('\nPilih (1/2): ')
        
        if (choice === '2') {
            usePairingCode = true
            phoneNumber = await question('📱 Masukkan nomor WhatsApp (format: 62xxx): ')
            phoneNumber = phoneNumber.replace(/[^0-9]/g, '')
        }
    }
    
    const sock = makeWASocket({
        version,
        auth: state,
        logger: pino({ level: 'silent' }),
        browser: ['Ubuntu', 'Chrome', '20.0.04'],
        printQRInTerminal: false,
        // Pengaturan untuk VPS & stabilitas
        connectTimeoutMs: 60000,
        defaultQueryTimeoutMs: undefined,
        keepAliveIntervalMs: 30000,
        emitOwnEvents: true,
        fireInitQueries: true,
        generateHighQualityLinkPreview: true,
        syncFullHistory: false,
        markOnlineOnConnect: true,
        getMessage: async (key) => {
            if (store) {
                const msg = await store.loadMessage(key.remoteJid, key.id)
                return msg?.message || undefined
            }
            return undefined
        }
    })

    // Bind store
    store?.bind(sock.ev)

    // Pairing code mode
    if (usePairingCode && !sock.authState.creds.registered) {
        setTimeout(async () => {
            const code = await sock.requestPairingCode(phoneNumber)
            console.log(`\n🔐 PAIRING CODE: ${code}`)
            console.log('📱 Masukkan kode ini di WhatsApp kamu:')
            console.log('   Settings > Linked Devices > Link a Device > Link with phone number')
        }, 3000)
    }

    // Handle koneksi
    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update
        
        if (qr && !usePairingCode) {
            console.log('\n========================================')
            console.log('📱 SCAN QR CODE INI DENGAN WHATSAPP:')
            console.log('========================================\n')
            qrcode.generate(qr, { small: true })
            console.log('\n========================================')
            console.log('⏰ QR code valid selama 30 detik\n')
        }
        
        if (connection === 'close') {
            const reason = new Boom(lastDisconnect?.error)?.output?.statusCode
            
            console.log('⚠️ Koneksi tertutup!')
            console.log('📋 Reason:', reason)
            
            if (reason === DisconnectReason.badSession) {
                console.log('❌ Bad Session File, hapus auth_info dan scan ulang')
                fs.rmSync('./auth_info', { recursive: true, force: true })
            } else if (reason === DisconnectReason.connectionClosed) {
                console.log('🔄 Koneksi tertutup, reconnecting...')
                setTimeout(() => startBot(), 5000)
            } else if (reason === DisconnectReason.connectionLost) {
                console.log('🔄 Koneksi hilang dari server, reconnecting...')
                setTimeout(() => startBot(), 5000)
            } else if (reason === DisconnectReason.connectionReplaced) {
                console.log('⚠️ Koneksi diganti, tutup sesi lain dulu!')
            } else if (reason === DisconnectReason.loggedOut) {
                console.log('❌ Device logged out, hapus auth_info dan scan ulang')
                fs.rmSync('./auth_info', { recursive: true, force: true })
            } else if (reason === DisconnectReason.restartRequired) {
                console.log('🔄 Restart required, restarting...')
                startBot()
            } else if (reason === DisconnectReason.timedOut) {
                console.log('🔄 Connection timed out, reconnecting...')
                setTimeout(() => startBot(), 5000)
            } else {
                console.log('⚠️ Unknown DisconnectReason:', reason)
                setTimeout(() => startBot(), 5000)
            }
        } else if (connection === 'open') {
            console.log('\n✅ BOT BERHASIL TERHUBUNG!')
            console.log('📱 Bot siap digunakan!')
            console.log('💬 Ketik .menu untuk melihat command\n')
        } else if (connection === 'connecting') {
            console.log('🔄 Menghubungkan ke WhatsApp...')
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
