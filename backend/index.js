require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const path = require('path');
const fs = require('fs');
const { Server } = require('socket.io');
const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const { generateReply } = require('./ai');
const { supabaseAdmin } = require('./supabase');
const { requireAuth } = require('./middleware/auth');

const app = express();
const port = process.env.PORT || 3000;
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

app.use(cors());
app.use(express.json());

let currentQr = null;
let isConnected = false;
const recentBotMessages = new Set();
const processedMessageIds = new Set();
const activeContactLocks = new Set();
let memoryBots = {}; // Respaldo instantáneo en memoria { [contactId]: { persona, active, userId } }
let memoryAiConfig = { provider: 'gemini', apiKey: '' };

// Transcribir audio con Gemini con fallback continuo
async function transcribeAudioWithGemini(audioBase64, audioMime, apiKey) {
    if (!apiKey || !audioBase64) return null;
    const { GoogleGenAI } = require('@google/genai');
    const ai = new GoogleGenAI({ apiKey });
    
    const candidateModels = ['gemini-3.7-flash', 'gemini-3.6-flash', 'gemini-3.5-flash'];
    for (const model of candidateModels) {
        try {
            const response = await ai.models.generateContent({
                model: model,
                contents: [
                    {
                        role: 'user',
                        parts: [
                            {
                                inlineData: {
                                    mimeType: audioMime ? audioMime.split(';')[0] : 'audio/ogg',
                                    data: audioBase64
                                }
                            },
                            {
                                text: 'Transcribe exactamente lo que se dice en este audio en español. Devuelve SOLO el texto textual sin comillas ni explicaciones.'
                            }
                        ]
                    }
                ]
            });
            if (response && response.text && response.text.trim().length > 0) {
                return response.text.trim();
            }
        } catch (e) {
            console.warn(`[Transcribe ${model}]:`, e.message);
        }
    }
    return null;
}

// Guardar mensaje en Supabase
async function saveMessageToHistory(contactId, messageData) {
    try {
        const cleanId = contactId.split('@')[0];
        let targetUserId = null;

        const { data: bot } = await supabaseAdmin
            .from('bot_configs')
            .select('user_id')
            .or(`contact_id.eq.${contactId},contact_id.ilike.%${cleanId}%`)
            .maybeSingle();

        targetUserId = bot?.user_id;

        if (!targetUserId) {
            const { data: fav } = await supabaseAdmin
                .from('favorites')
                .select('user_id')
                .or(`contact_id.eq.${contactId},contact_id.ilike.%${cleanId}%`)
                .maybeSingle();
            targetUserId = fav?.user_id;
        }

        if (!targetUserId) {
            const { data: anyUser } = await supabaseAdmin
                .from('ai_configs')
                .select('user_id')
                .limit(1)
                .maybeSingle();
            targetUserId = anyUser?.user_id;
        }

        if (targetUserId) {
            await supabaseAdmin.from('chat_history').insert({
                user_id: targetUserId,
                contact_id: contactId,
                message_type: messageData.type,
                sender: messageData.from || null,
                text: messageData.text,
                created_at: messageData.timestamp || new Date()
            });
        }
    } catch (e) {
        console.error("Error guardando mensaje en Supabase:", e.message);
    }
}

// Configuración robusta de Puppeteer
const chromePaths = [
    process.env.PUPPETEER_EXECUTABLE_PATH,
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
    '/usr/bin/google-chrome-stable',
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe'
].filter(Boolean);
let foundChromePath = chromePaths.find(p => fs.existsSync(p));

const puppeteerConfig = {
    headless: true,
    args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu'
    ]
};
if (foundChromePath) {
    puppeteerConfig.executablePath = foundChromePath;
    console.log(`Usando Chrome en: ${foundChromePath}`);
} else {
    console.log('Usando Chromium integrado de Puppeteer');
}

// Inicializar cliente de WhatsApp
const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: puppeteerConfig
});

client.on('qr', (qr) => {
    console.log('⚡ Nuevo código QR generado para WhatsApp.');
    currentQr = qr;
    isConnected = false;
    io.emit('whatsapp_qr', qr);
});

client.on('loading_screen', (percent, message) => {
    console.log(`Cargando WhatsApp Web: ${percent}% - ${message}`);
});

client.on('authenticated', () => {
    console.log('✅ Sesión de WhatsApp autenticada correctamente.');
});

client.on('auth_failure', (msg) => {
    console.error('❌ Error de autenticación de WhatsApp:', msg);
});

client.on('ready', () => {
    console.log('🚀 ¡Cliente de WhatsApp listo y conectado!');
    currentQr = null;
    isConnected = true;
    io.emit('whatsapp_ready');
    refreshContactMaps();
});

client.on('disconnected', () => {
    console.log('Cliente de WhatsApp desconectado.');
    isConnected = false;
    currentQr = null;
    io.emit('whatsapp_disconnected');
    client.initialize(); 
});

function appendDebug(msg) {
    try {
        const line = `[${new Date().toISOString()}] ${msg}\n`;
        fs.appendFileSync(path.join(__dirname, 'debug_whatsapp.log'), line);
        console.log(line.trim());
    } catch (e) {}
}

const lidToSerializedMap = new Map();
const lidToPhoneMap = new Map();
const nameToPhoneMap = new Map();
const phoneToNameMap = new Map();

async function getInternalPhoneMappings() {
    try {
        if (!client.pupPage || client.pupPage.isClosed()) return {};
        return await client.pupPage.evaluate(() => {
            const mappings = {};
            try {
                if (window.require) {
                    const ContactCollection = window.require('WAWebCollections')?.Contact;
                    const contactApi = window.require('WAWebApiContact');
                    if (ContactCollection && ContactCollection.getModelsArray) {
                        const models = ContactCollection.getModelsArray();
                        for (const m of models) {
                            try {
                                const idStr = m.id?._serialized || '';
                                const lidStr = m.lid?._serialized || (typeof m.lid === 'string' ? m.lid : '');
                                const name = m.name || m.pushname || m.formattedTitle;
                                let phone = null;

                                if (m.id?.server === 'c.us' && m.id?.user && m.id.user.length <= 13) {
                                    phone = m.id.user;
                                } else if (contactApi && m.id) {
                                    const pWid = contactApi.getPhoneNumber(m.id);
                                    if (pWid?.user && pWid.user.length <= 13) {
                                        phone = pWid.user;
                                    }
                                }

                                if (phone) {
                                    if (idStr) mappings[idStr] = phone;
                                    if (lidStr) mappings[lidStr] = phone;
                                    if (name) mappings[`name:${name.trim().toLowerCase()}`] = phone;
                                    if (name && idStr) mappings[`title:${idStr}`] = name.trim();
                                    if (name && phone) mappings[`title:${phone}`] = name.trim();
                                }
                            } catch (e) {}
                        }
                    }
                }
            } catch (e) {}
            return mappings;
        });
    } catch (e) {
        return {};
    }
}

function formatPhoneNumber(rawDigits) {
    if (!rawDigits) return '';
    const digits = String(rawDigits).replace(/\D/g, '');
    if (digits.length < 9 || digits.length > 13) return '';

    // Número español con prefijo 34 (+34 6XX XX XX XX o +34 9XX XX XX XX)
    if (digits.startsWith('34') && digits.length === 11) {
        return `+34 ${digits.slice(2, 5)} ${digits.slice(5, 7)} ${digits.slice(7, 9)} ${digits.slice(9, 11)}`;
    } else if (digits.length === 9) {
        // Número español de 9 dígitos sin prefijo
        return `+34 ${digits.slice(0, 3)} ${digits.slice(3, 5)} ${digits.slice(5, 7)} ${digits.slice(7, 9)}`;
    } else {
        return `+${digits}`;
    }
}

async function refreshContactMaps() {
    try {
        const internalMappings = await getInternalPhoneMappings();
        for (const [k, v] of Object.entries(internalMappings)) {
            if (k.startsWith('name:')) {
                nameToPhoneMap.set(k.replace('name:', ''), v);
            } else if (k.startsWith('title:')) {
                phoneToNameMap.set(k.replace('title:', ''), v);
            } else {
                lidToPhoneMap.set(k, v);
                lidToPhoneMap.set(k.split('@')[0], v);
                lidToSerializedMap.set(k, `${v}@c.us`);
                lidToSerializedMap.set(k.split('@')[0], `${v}@c.us`);
            }
        }

        let contacts = [];
        try {
            contacts = await client.getContacts();
        } catch (e) {}
        for (const c of (contacts || [])) {
            if (c.id && c.id._serialized) {
                const serialized = c.id._serialized;
                const userDigits = (c.id.user || serialized.split('@')[0] || '').replace(/\D/g, '');
                const numDigits = String(c.number || '').replace(/\D/g, '');

                let realPhone = '';
                if (serialized.includes('@c.us') && userDigits.length >= 9 && userDigits.length <= 13) {
                    realPhone = userDigits;
                } else if (numDigits.length >= 9 && numDigits.length <= 13) {
                    realPhone = numDigits;
                }

                if (realPhone) {
                    lidToPhoneMap.set(serialized, realPhone);
                    lidToPhoneMap.set(serialized.split('@')[0], realPhone);
                    lidToSerializedMap.set(serialized, serialized);
                    lidToSerializedMap.set(serialized.split('@')[0], serialized);

                    if (c.name && c.name.trim()) {
                        nameToPhoneMap.set(c.name.trim().toLowerCase(), realPhone);
                        phoneToNameMap.set(realPhone, c.name.trim());
                        phoneToNameMap.set(serialized, c.name.trim());
                    }
                    if (c.pushname && c.pushname.trim()) {
                        nameToPhoneMap.set(c.pushname.trim().toLowerCase(), realPhone);
                        if (!phoneToNameMap.has(realPhone)) {
                            phoneToNameMap.set(realPhone, c.pushname.trim());
                        }
                    }
                }

                if (c.lid) {
                    const lidSerialized = typeof c.lid === 'object' ? c.lid._serialized : String(c.lid);
                    if (lidSerialized) {
                        if (realPhone) {
                            lidToPhoneMap.set(lidSerialized, realPhone);
                            lidToPhoneMap.set(lidSerialized.split('@')[0], realPhone);
                        }
                        lidToSerializedMap.set(lidSerialized, serialized);
                        lidToSerializedMap.set(lidSerialized.split('@')[0], serialized);
                    }
                }
            }
        }
    } catch (e) {}
}

async function resolveCanonicalId(rawId, msg) {
    if (!rawId) return rawId;
    if (rawId.includes('@g.us')) return rawId;

    if (lidToSerializedMap.has(rawId)) return lidToSerializedMap.get(rawId);
    const rawDigits = rawId.split('@')[0];
    if (lidToSerializedMap.has(rawDigits)) return lidToSerializedMap.get(rawDigits);

    // Si es un número normal (<= 13 dígitos), es el ID real
    if (rawDigits.length <= 13 && !rawId.includes('@lid')) {
        return rawId.includes('@c.us') ? rawId : `${rawDigits}@c.us`;
    }

    // Si es un LID (> 13 dígitos o @lid), buscar en los contactos reales
    try {
        const chat = await msg.getChat();
        if (chat) {
            const chatSerialized = chat.id?._serialized || '';
            const chatDigits = chatSerialized.split('@')[0];
            if (chatSerialized.includes('@c.us') && chatDigits.length <= 13) {
                lidToSerializedMap.set(rawId, chatSerialized);
                lidToSerializedMap.set(rawDigits, chatSerialized);
                return chatSerialized;
            }

            const contacts = await client.getContacts();
            const matchingContact = contacts.find(c => 
                c.id && c.id._serialized && c.id._serialized.includes('@c.us') && c.id._serialized.split('@')[0].length <= 13 && (
                    (chat.name && c.name && chat.name === c.name) ||
                    (chat.name && c.pushname && chat.name === c.pushname)
                )
            );
            if (matchingContact) {
                const realId = matchingContact.id._serialized;
                lidToSerializedMap.set(rawId, realId);
                lidToSerializedMap.set(rawDigits, realId);
                return realId;
            }
        }
    } catch (e) {}

    // Si hay un bot activo en memoria, asociar este chat directamente
    for (const cId of Object.keys(memoryBots)) {
        if (cId.includes('@c.us') && memoryBots[cId].active) {
            lidToSerializedMap.set(rawId, cId);
            lidToSerializedMap.set(rawDigits, cId);
            return cId;
        }
    }

    return rawId;
}

// Descargar media con reintentos limpios
async function downloadMediaWithRetry(msg, retries = 2) {
    for (let i = 0; i < retries; i++) {
        try {
            if (typeof msg.downloadMedia === 'function') {
                const media = await msg.downloadMedia().catch(() => null);
                if (media && media.data) return media;
            }
        } catch (e) {}
        await new Promise(r => setTimeout(r, 400));
    }
    return null;
}

// Función centralizada para disparar el bot consultando Supabase
async function triggerBot(text, unifiedId, targetWhatsAppId, wasIncomingAudio = false) {
    if (!text || typeof text !== 'string' || text.trim().length === 0) return;

    // Evitar ejecuciones simultáneas/duplicadas para el mismo contacto
    if (activeContactLocks.has(unifiedId) || activeContactLocks.has(targetWhatsAppId)) {
        appendDebug(`⏳ Ya hay una respuesta de IA generándose para ${unifiedId}. Omitiendo duplicado.`);
        return;
    }

    activeContactLocks.add(unifiedId);
    activeContactLocks.add(targetWhatsAppId);

    try {
        appendDebug(`🤖 Evaluando bot para ${unifiedId} (target: ${targetWhatsAppId}, audio: ${wasIncomingAudio})...`);
        
        const cleanUnified = unifiedId.split('@')[0];
        const cleanTarget = targetWhatsAppId.split('@')[0];

        // 1. Buscar primero en memoria activa instantánea
        let bot = null;
        for (const [cId, b] of Object.entries(memoryBots)) {
            if (b.active) {
                const cIdClean = cId.split('@')[0];
                if (cId === unifiedId || cId === targetWhatsAppId || cIdClean === cleanUnified || cIdClean === cleanTarget || unifiedId.includes(cIdClean) || targetWhatsAppId.includes(cIdClean)) {
                    bot = { user_id: b.userId, persona: b.persona, active: true };
                    appendDebug(`⚡ Bot encontrado en memoria activa: ${bot.persona}`);
                    break;
                }
            }
        }

        // 2. Si no estaba en memoria, consultar en Supabase
        if (!bot) {
            const { data: allActiveBots } = await supabaseAdmin
                .from('bot_configs')
                .select('user_id, persona, active, contact_id')
                .eq('active', true);

            if (allActiveBots && allActiveBots.length > 0) {
                const found = allActiveBots.find(b => {
                    const cleanBotContact = b.contact_id.split('@')[0];
                    return b.contact_id === unifiedId ||
                           b.contact_id === targetWhatsAppId ||
                           cleanBotContact === cleanUnified ||
                           cleanBotContact === cleanTarget ||
                           unifiedId.includes(cleanBotContact) ||
                           targetWhatsAppId.includes(cleanBotContact);
                });
                if (found) {
                    bot = { user_id: found.user_id, persona: found.persona, active: true };
                    memoryBots[unifiedId] = { persona: found.persona, active: true, userId: found.user_id };
                }
            }
        }

        if (!bot || !bot.active) {
            appendDebug(`ℹ️ No hay bot activo configurado para ${unifiedId} ni ${targetWhatsAppId}`);
            return;
        }

        appendDebug(`🎯 Bot activado: ${bot.persona} (Usuario: ${bot.user_id})`);
        
        io.emit('chat_message', { 
            type: 'system', 
            from: unifiedId,
            to: unifiedId,
            text: `Generando respuesta como ${bot.persona}...`, 
            timestamp: new Date() 
        });

        // 3. Obtener configuración de IA del usuario (Supabase + Memoria + Env)
        let userApiKey = memoryAiConfig.apiKey || process.env.GEMINI_API_KEY || '';
        let userProvider = memoryAiConfig.provider || 'gemini';

        if (!userApiKey) {
            const { data: aiConfigData } = await supabaseAdmin
                .from('ai_configs')
                .select('provider, api_key')
                .eq('user_id', bot.user_id)
                .maybeSingle();

            if (aiConfigData?.api_key) {
                userApiKey = aiConfigData.api_key;
                userProvider = aiConfigData.provider;
                memoryAiConfig = { provider: userProvider, apiKey: userApiKey };
            }
        }

        const aiConfig = {
            provider: userProvider,
            apiKey: userApiKey
        };

        if (!aiConfig.apiKey) {
            appendDebug(`⚠️ Falta API Key para usuario ${bot.user_id}`);
            io.emit('chat_message', { 
                type: 'error', 
                from: unifiedId,
                to: unifiedId,
                text: `⚠️ Falta la API Key. Pulsa en '⚙️ IA Config' arriba a la derecha y pon tu clave de Gemini u OpenAI para que el bot responda.`, 
                timestamp: new Date() 
            });
            return;
        }

        // 4. Obtener historial reciente para dar coherencia conversacional profunda
        let recentHistory = [];
        try {
            const { data: dbHistory } = await supabaseAdmin
                .from('chat_history')
                .select('message_type, text, sender, created_at')
                .eq('user_id', bot.user_id)
                .eq('contact_id', unifiedId)
                .order('created_at', { ascending: false })
                .limit(20);

            if (dbHistory && dbHistory.length > 0) {
                recentHistory = dbHistory.reverse().map(h => ({
                    type: h.message_type,
                    text: h.text,
                    sender: h.sender
                }));
            }
        } catch (e) {}

        // Buscar si es una personalidad personalizada
        let activePersona = bot.persona;
        const customP = memoryCustomPersonas.find(p => p.name === bot.persona || p.id === bot.persona);
        if (customP) {
            activePersona = { name: customP.name, prompt: customP.prompt };
        } else {
            try {
                const { data: dbCustom } = await supabaseAdmin
                    .from('custom_personas')
                    .select('*')
                    .or(`name.eq."${bot.persona}",id.eq."${bot.persona}"`)
                    .maybeSingle();
                if (dbCustom) {
                    activePersona = { name: dbCustom.name, prompt: dbCustom.prompt };
                }
            } catch (e) {}
        }

        const personaDisplayName = typeof activePersona === 'object' ? activePersona.name : activePersona;
        appendDebug(`⏳ Llamando a ${aiConfig.provider} con personalidad ${personaDisplayName} e historial de ${recentHistory.length} mensajes...`);
        const reply = await generateReply(text, activePersona, aiConfig, recentHistory);
        appendDebug(`✨ Respuesta generada por IA: "${reply}"`);

        // Evitar bucles infinitos
        recentBotMessages.add(reply.trim());

        // Simular retraso humano de tecleo
        let typingDelay = 1500 + (reply.length * 30);
        if (typingDelay > 4500) typingDelay = 4500;
        await new Promise(resolve => setTimeout(resolve, typingDelay));

        await client.sendMessage(targetWhatsAppId, reply);
        appendDebug(`🚀 ¡Mensaje de texto del bot enviado con éxito a ${targetWhatsAppId}!`);

    } catch (error) {
        appendDebug(`❌ Error al generar o enviar respuesta IA: ${error.message}`);
        io.emit('chat_message', { 
            type: 'error', 
            from: unifiedId,
            to: unifiedId,
            text: `Error IA: ${error.message}`, 
            timestamp: new Date() 
        });
    } finally {
        activeContactLocks.delete(unifiedId);
        activeContactLocks.delete(targetWhatsAppId);
    }
}

client.on('message', async msg => {
    try {
        let text = msg.body || '';
        let wasAudio = false;
        let audioUrl = null;

        // Detectar si es una nota de voz / audio entrante de WhatsApp
        if (msg.hasMedia && (msg.type === 'ptt' || msg.type === 'audio')) {
            wasAudio = true;
            try {
                const rawFrom = msg.from;
                appendDebug(`🎙️ Audio entrante detectado de ${rawFrom}. Descargando y transcribiendo con Gemini...`);
                const media = await downloadMediaWithRetry(msg, 3);
                if (media && media.data) {
                    audioUrl = `data:${media.mimetype || 'audio/ogg'};base64,${media.data}`;
                    let userApiKey = memoryAiConfig.apiKey || process.env.GEMINI_API_KEY || '';
                    if (!userApiKey) {
                        const { data: anyUser } = await supabaseAdmin.from('ai_configs').select('api_key').limit(1).maybeSingle();
                        userApiKey = anyUser?.api_key || '';
                    }

                    const transcribed = await transcribeAudioWithGemini(media.data, media.mimetype, userApiKey);
                    if (transcribed) {
                        text = transcribed;
                        appendDebug(`🎤 Audio transcrito con éxito: "${text}"`);
                    } else {
                        text = "Nota de voz recibida";
                    }
                } else {
                    text = "Nota de voz recibida";
                }
            } catch (err) {
                appendDebug(`⚠️ Error transcribiendo audio entrante: ${err.message || err}`);
                text = "Nota de voz recibida";
            }
        }

        if (!text || text.trim().length === 0) return;
        if (msg.fromMe) return;

        const msgId = msg.id?._serialized || `${msg.from}_${msg.timestamp}`;
        if (processedMessageIds.has(msgId)) {
            appendDebug(`⏩ Omitiendo mensaje ya procesado: ${msgId}`);
            return;
        }
        processedMessageIds.add(msgId);
        if (processedMessageIds.size > 1000) {
            const first = processedMessageIds.values().next().value;
            processedMessageIds.delete(first);
        }

        const rawFrom = msg.from;
        const unifiedId = await resolveCanonicalId(rawFrom, msg);
        
        appendDebug(`📩 MENSAJE ENTRANTE de ${rawFrom} -> Canónico: ${unifiedId}: "${text}" ${wasAudio ? '(AUDIO)' : ''}`);
        
        const messageData = { 
            type: 'incoming', 
            from: unifiedId, 
            to: unifiedId,
            rawFrom: rawFrom,
            text: wasAudio ? `🎤 "${text}"` : text, 
            audioUrl: audioUrl,
            timestamp: new Date() 
        };
        io.emit('chat_message', messageData);
        
        await saveMessageToHistory(unifiedId, messageData);
        await triggerBot(text, unifiedId, rawFrom, wasAudio);
    } catch (err) {
        appendDebug(`❌ Error en client.on message: ${err.message}`);
    }
});

client.on('message_create', async msg => {
    try {
        let text = msg.body || '';
        if (msg.hasMedia && (msg.type === 'ptt' || msg.type === 'audio')) {
            text = '🎤 [Nota de voz enviada]';
        }
        if (!text) return;
        if (!msg.fromMe) return;

        const msgId = msg.id?._serialized || `${msg.to}_${msg.timestamp}`;
        if (processedMessageIds.has(msgId)) return;
        processedMessageIds.add(msgId);
        if (processedMessageIds.size > 1000) {
            const first = processedMessageIds.values().next().value;
            processedMessageIds.delete(first);
        }

        const rawTo = msg.to;
        const unifiedId = await resolveCanonicalId(rawTo, msg);
        
        appendDebug(`📝 MENSAJE SALIENTE a ${rawTo} -> Canónico: ${unifiedId}: "${text}"`);
        
        const messageData = { 
            type: 'outgoing', 
            from: unifiedId, 
            to: unifiedId,
            rawTo: rawTo,
            text: text, 
            timestamp: new Date() 
        };
        io.emit('chat_message', messageData);
        await saveMessageToHistory(unifiedId, messageData);

        // Comprobación de comando de pánico / emergencia desde WhatsApp
        const cleanText = text.trim().toLowerCase();
        if (['!stop', '!pausa', '!alto', '!fin', '!off', '!stopbot', '!cancelar', '!basta'].includes(cleanText)) {
            appendDebug(`🚨 COMANDO DE PÁNICO ACTIVADO por el usuario en ${unifiedId}. Desactivando bot...`);
            delete memoryBots[unifiedId];
            const digits = unifiedId.split('@')[0];
            delete memoryBots[digits];
            
            try {
                await supabaseAdmin
                    .from('bot_configs')
                    .update({ active: false })
                    .eq('contact_id', unifiedId);
            } catch (e) {}

            io.emit('bot_updated', { contactId: unifiedId, bot: { active: false, persona: 'Ninguna' } });
            io.emit('chat_message', {
                type: 'system',
                from: unifiedId,
                to: unifiedId,
                text: '🚨 BOT DESACTIVADO AL INSTANTE por comando de emergencia (!stop).',
                timestamp: new Date()
            });
        }
    } catch (err) {
        appendDebug(`❌ Error en client.on message_create: ${err.message}`);
    }
});

client.initialize();

// Conexiones de Socket.io
io.on('connection', (socket) => {
    console.log('Cliente frontend conectado a WebSockets');
});

// ==========================================
// RUTAS API PROTEGIDAS CON SUPABASE AUTH
// ==========================================

// Estado general y configuración del usuario
app.get('/api/status', requireAuth, async (req, res) => {
    try {
        const [{ data: aiConfigData }, { data: botsData }] = await Promise.all([
            supabaseAdmin
                .from('ai_configs')
                .select('provider, api_key')
                .eq('user_id', req.user.id)
                .maybeSingle(),
            supabaseAdmin
                .from('bot_configs')
                .select('contact_id, persona, active')
                .eq('user_id', req.user.id)
        ]);

        const activeBotsMap = {};
        if (botsData) {
            botsData.forEach(b => {
                activeBotsMap[b.contact_id] = { active: b.active, persona: b.persona };
            });
        }

        res.json({ 
            status: 'ok', 
            whatsapp_connected: isConnected,
            qr: currentQr,
            config: aiConfigData ? { provider: aiConfigData.provider, apiKey: aiConfigData.api_key } : { provider: 'gemini', apiKey: '' },
            activeBots: activeBotsMap
        });
    } catch (e) {
        console.error("Error en /api/status:", e);
        res.status(500).json({ error: e.message });
    }
});

// Lista de contactos con favoritos y estado de bot desde Supabase
app.get('/api/contacts', requireAuth, async (req, res) => {
    if (!isConnected) {
        return res.status(400).json({ error: 'WhatsApp no está conectado' });
    }
    
    try {
        try {
            await refreshContactMaps();
        } catch (e) {
            console.warn("Advertencia en refreshContactMaps:", e.message);
        }

        let userFavs = [], userBots = [];
        try {
            const [favRes, botRes] = await Promise.all([
                supabaseAdmin.from('favorites').select('contact_id').eq('user_id', req.user.id),
                supabaseAdmin.from('bot_configs').select('contact_id, persona, active').eq('user_id', req.user.id)
            ]);
            userFavs = favRes?.data || [];
            userBots = botRes?.data || [];
        } catch (e) {
            console.warn("Advertencia al consultar Supabase en /api/contacts:", e.message);
        }

        const favSet = new Set((userFavs || []).map(f => f.contact_id));
        const botMap = new Map();
        (userBots || []).forEach(b => botMap.set(b.contact_id, { active: b.active, persona: b.persona }));

        let activeChats = [];
        for (let attempt = 0; attempt < 3; attempt++) {
            try {
                activeChats = await client.getChats();
                if (activeChats && activeChats.length > 0) {
                    activeChats.sort((a, b) => {
                        const aPinned = a.pinned ? 1 : 0;
                        const bPinned = b.pinned ? 1 : 0;
                        if (aPinned !== bPinned) return bPinned - aPinned;

                        const aTime = a.timestamp || a.lastMessage?.timestamp || 0;
                        const bTime = b.timestamp || b.lastMessage?.timestamp || 0;
                        return bTime - aTime;
                    });
                    break;
                }
            } catch (e) {
                console.warn(`Intento ${attempt + 1} getChats:`, e.message);
            }

            // Fallback directo a window.Store si getChats vino vacío
            if (client.pupPage && !client.pupPage.isClosed()) {
                try {
                    const storeChats = await client.pupPage.evaluate(() => {
                        try {
                            const ChatStore = window.Store?.Chat || (window.require ? window.require('WAWebCollections')?.Chat : null);
                            if (ChatStore && ChatStore.getModelsArray) {
                                return ChatStore.getModelsArray().map(c => ({
                                    id: { _serialized: c.id?._serialized || String(c.id) },
                                    name: c.name || c.formattedTitle || '',
                                    isGroup: !!c.isGroup,
                                    pinned: !!c.pinned,
                                    timestamp: c.t || 0
                                }));
                            }
                        } catch (err) {}
                        return [];
                    });
                    if (storeChats && storeChats.length > 0) {
                        activeChats = storeChats;
                        break;
                    }
                } catch (err) {}
            }

            if (attempt < 2) {
                await new Promise(r => setTimeout(r, 1000));
            }
        }

        let contacts = [];
        try {
            contacts = await client.getContacts();
        } catch (e) {
            console.warn("No se pudieron obtener contactos con client.getContacts():", e.message);
        }

        // Fallback directo a window.Store para contactos
        if ((!contacts || contacts.length === 0) && client.pupPage && !client.pupPage.isClosed()) {
            try {
                const storeContacts = await client.pupPage.evaluate(() => {
                    try {
                        const ContactStore = window.Store?.Contact || (window.require ? window.require('WAWebCollections')?.Contact : null);
                        if (ContactStore && ContactStore.getModelsArray) {
                            return ContactStore.getModelsArray().map(c => ({
                                id: { _serialized: c.id?._serialized || String(c.id), user: c.id?.user || '' },
                                name: c.name || '',
                                pushname: c.pushname || '',
                                number: c.number || '',
                                isGroup: !!c.isGroup,
                                isMe: !!c.isMe
                            }));
                        }
                    } catch (err) {}
                    return [];
                });
                if (storeContacts && storeContacts.length > 0) {
                    contacts = storeContacts;
                }
            } catch (err) {}
        }

        const contactMap = new Map();
        for (const c of (contacts || [])) {
            if (c.id && c.id._serialized) {
                contactMap.set(c.id._serialized, c);
            }
        }

        function resolveContactPhone(chatOrContact, contactObj) {
            if (chatOrContact.isGroup) return '';
            const uid = chatOrContact.id?._serialized || chatOrContact.id || '';
            const uidClean = uid.split('@')[0].replace(/\D/g, '');
            const name = (chatOrContact.name || chatOrContact.formattedTitle || contactObj?.name || contactObj?.pushname || '').trim().toLowerCase();

            // 1. Mirar en el mapeo LID/UID -> Teléfono real
            if (lidToPhoneMap.has(uid)) return lidToPhoneMap.get(uid);
            if (lidToPhoneMap.has(uidClean)) return lidToPhoneMap.get(uidClean);

            // 2. Si el propio UID es un teléfono normal (<= 13 dígitos y @c.us)
            if (uid.includes('@c.us') && uidClean.length >= 9 && uidClean.length <= 13) {
                return uidClean;
            }

            // 3. Del contactObj asociado
            if (contactObj?.number) {
                const cNum = String(contactObj.number).replace(/\D/g, '');
                if (cNum.length >= 9 && cNum.length <= 13) return cNum;
            }

            // 4. Por coincidencia de nombre en la agenda
            if (name && nameToPhoneMap.has(name)) {
                return nameToPhoneMap.get(name);
            }

            return '';
        }

        const seenIds = new Set();
        const activeChatsList = [];

        // 1. PRIMERO: Las conversaciones reales de WhatsApp (ordenadas por fecha del último mensaje)
        for (const chat of activeChats) {
            if (!chat.id || !chat.id._serialized) continue;
            const uid = chat.id._serialized;
            if (chat.isMe || (!uid.includes('@c.us') && !uid.includes('@g.us') && !uid.includes('@lid'))) continue;

            const contactObj = contactMap.get(uid) || {};
            seenIds.add(uid);
            if (uid.includes('@lid')) {
                const mappedPhone = lidToPhoneMap.get(uid) || lidToPhoneMap.get(uid.split('@')[0]);
                if (mappedPhone) seenIds.add(`${mappedPhone}@c.us`);
            }

            const realPhoneDigits = resolveContactPhone(chat, contactObj);
            const formattedPhone = formatPhoneNumber(realPhoneDigits);

            let bestName = chat.name || chat.formattedTitle || contactObj.name || contactObj.pushname || phoneToNameMap.get(realPhoneDigits) || (chat.isGroup ? 'Grupo sin nombre' : (formattedPhone || 'Contacto'));

            // Si el nombre detectado es solo el número pero tenemos el nombre en la agenda, usar el nombre
            if (realPhoneDigits && phoneToNameMap.has(realPhoneDigits)) {
                bestName = phoneToNameMap.get(realPhoneDigits);
            }

            activeChatsList.push({
                id: uid,
                name: bestName,
                number: formattedPhone,
                isGroup: chat.isGroup,
                pinned: !!chat.pinned,
                timestamp: chat.timestamp || chat.t || chat.lastMessage?.timestamp || 0
            });
        }

        // 2. LUEGO: Los contactos de la agenda con los que no hay conversación activa
        const remainingNamedContacts = [];
        const remainingUnnamedContacts = [];

        for (const c of contacts) {
            if (!c.id || !c.id._serialized || c.isMe) continue;
            const uid = c.id._serialized;
            if ((!uid.includes('@c.us') && !uid.includes('@g.us') && !uid.includes('@lid')) || seenIds.has(uid)) continue;

            seenIds.add(uid);

            const realPhoneDigits = resolveContactPhone(c, c);
            const formattedPhone = formatPhoneNumber(realPhoneDigits);
            const contactName = c.name || c.pushname || (realPhoneDigits ? phoneToNameMap.get(realPhoneDigits) : null);

            if (contactName && contactName.trim() && !contactName.startsWith('+') && !/^\d+$/.test(contactName.replace(/\s+/g, ''))) {
                remainingNamedContacts.push({
                    id: uid,
                    name: contactName.trim(),
                    number: formattedPhone,
                    isGroup: !!c.isGroup,
                    pinned: false,
                    timestamp: 0
                });
            } else if (formattedPhone) {
                remainingUnnamedContacts.push({
                    id: uid,
                    name: contactName || formattedPhone,
                    number: formattedPhone,
                    isGroup: !!c.isGroup,
                    pinned: false,
                    timestamp: 0
                });
            }
        }

        // Ordenar contactos de la agenda con nombre alfabéticamente (A-Z)
        remainingNamedContacts.sort((a, b) => a.name.localeCompare(b.name, 'es', { sensitivity: 'base' }));

        // Unir: primero chats activos, luego contactos con nombre, al final contactos sin nombre
        const orderedList = [...activeChatsList, ...remainingNamedContacts, ...remainingUnnamedContacts];

        const simplifiedContacts = orderedList.map(c => {
            const uid = c.id;
            const cleanDigits = uid.split('@')[0].replace(/\D/g, '');
            const rawPhone = String(c.number || '').replace(/\D/g, '');
            const lidPhone = lidToPhoneMap.get(uid) || lidToPhoneMap.get(cleanDigits) || '';

            const isFav = (
                favSet.has(uid) ||
                favSet.has(cleanDigits) ||
                (rawPhone && (favSet.has(rawPhone) || favSet.has(`${rawPhone}@c.us`))) ||
                (lidPhone && (favSet.has(lidPhone) || favSet.has(`${lidPhone}@c.us`))) ||
                (c.name && favSet.has(c.name))
            );

            const botConfig = (
                botMap.get(uid) ||
                botMap.get(cleanDigits) ||
                (rawPhone && (botMap.get(rawPhone) || botMap.get(`${rawPhone}@c.us`))) ||
                (lidPhone && (botMap.get(lidPhone) || botMap.get(`${lidPhone}@c.us`))) ||
                { active: false, persona: '' }
            );

            return {
                id: uid,
                name: c.name,
                number: c.number,
                isGroup: c.isGroup,
                favorite: !!isFav,
                bot: botConfig,
                pinned: c.pinned || false,
                timestamp: c.timestamp || 0
            };
        });
        
        res.json({ contacts: simplifiedContacts });
    } catch (error) {
        console.error("Error obteniendo contactos:", error);
        res.status(500).json({ error: 'Error al obtener contactos' });
    }
});

// Añadir contacto manualmente por número de teléfono
app.post('/api/contacts/manual', requireAuth, async (req, res) => {
    try {
        const { phone, name } = req.body;
        if (!phone) return res.status(400).json({ error: 'Falta el número de teléfono' });

        let rawDigits = String(phone).replace(/\D/g, '');
        if (rawDigits.length === 9) rawDigits = `34${rawDigits}`; // España default
        if (rawDigits.length < 9) return res.status(400).json({ error: 'Número de teléfono no válido' });

        const serialized = `${rawDigits}@c.us`;
        const formattedPhone = formatPhoneNumber(rawDigits);
        const contactName = name ? name.trim() : (formattedPhone || `Contacto ${rawDigits}`);

        // Guardar en favoritos en Supabase automáticamente
        try {
            await supabaseAdmin
                .from('favorites')
                .upsert({ user_id: req.user.id, contact_id: serialized });
        } catch (e) {}

        res.json({
            success: true,
            contact: {
                id: serialized,
                name: contactName,
                number: formattedPhone,
                isGroup: false,
                favorite: true,
                bot: { active: false, persona: '' },
                pinned: false,
                timestamp: Date.now()
            }
        });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Guardar configuración de IA en Supabase
app.post('/api/config', requireAuth, async (req, res) => {
    try {
        const { provider, apiKey } = req.body;
        const finalProvider = provider || 'gemini';
        const finalApiKey = apiKey !== undefined ? apiKey.trim() : '';
        
        memoryAiConfig = { 
            provider: finalProvider, 
            apiKey: finalApiKey
        };

        const updateData = {
            user_id: req.user.id,
            provider: finalProvider,
            api_key: finalApiKey,
            updated_at: new Date()
        };

        try {
            await supabaseAdmin
                .from('ai_configs')
                .upsert(updateData, { onConflict: 'user_id' });
        } catch (e) {}

        res.json({ 
            success: true, 
            config: memoryAiConfig 
        });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Listar modelos disponibles
app.get('/api/models', requireAuth, async (req, res) => {
    try {
        const { data: config } = await supabaseAdmin
            .from('ai_configs')
            .select('api_key')
            .eq('user_id', req.user.id)
            .maybeSingle();

        const apiKey = config?.api_key || memoryAiConfig.apiKey;
        if (!apiKey) return res.status(400).json({ error: 'Falta apiKey configurada' });

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        const data = await response.json();
        res.json(data);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Activar o desactivar bot para un contacto en Supabase
app.post('/api/bot', requireAuth, async (req, res) => {
    try {
        const { contactId, active, persona } = req.body;
        if (!contactId) return res.status(400).json({ error: 'Falta contactId' });
        
        if (!active) {
            const clean = contactId.split('@')[0].replace(/\D/g, '');
            const mappedPhone = lidToPhoneMap.get(contactId) || lidToPhoneMap.get(clean) || '';
            const idsToDelete = [contactId, clean, mappedPhone, mappedPhone ? `${mappedPhone}@c.us` : ''].filter(Boolean);
            
            for (const id of idsToDelete) {
                delete memoryBots[id];
                await supabaseAdmin
                    .from('bot_configs')
                    .delete()
                    .eq('user_id', req.user.id)
                    .eq('contact_id', id);
            }
        } else {
            const clean = contactId.split('@')[0].replace(/\D/g, '');
            const mappedPhone = lidToPhoneMap.get(contactId) || lidToPhoneMap.get(clean) || '';
            const idsToSet = [contactId, clean, mappedPhone, mappedPhone ? `${mappedPhone}@c.us` : ''].filter(Boolean);

            for (const id of idsToSet) {
                memoryBots[id] = { persona: persona || '', active: true, userId: req.user.id };
                await supabaseAdmin
                    .from('bot_configs')
                    .upsert({
                        user_id: req.user.id,
                        contact_id: id,
                        persona: persona || '',
                        active: true,
                        updated_at: new Date()
                    }, { onConflict: 'user_id,contact_id' });
            }
        }
        
        io.emit('bot_updated', { contactId, bot: { active: !!active, persona: persona || '' } });
        res.json({ success: true });
    } catch (e) {
        console.error("Error actualizando bot:", e);
        res.status(500).json({ error: e.message });
    }
});

// Configurar Modo Audio / Voz para un contacto
app.post('/api/voice-mode', requireAuth, async (req, res) => {
    try {
        const { contactId, voiceMode } = req.body;
        if (!contactId) return res.status(400).json({ error: 'Falta contactId' });
        
        const clean = contactId.split('@')[0];
        memoryVoiceMode[contactId] = !!voiceMode;
        memoryVoiceMode[clean] = !!voiceMode;

        res.json({ success: true, voiceMode: !!voiceMode });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// 🚨 Botón de Pánico Maestro: Silenciar y desactivar todos los bots al instante
app.post('/api/panic', requireAuth, async (req, res) => {
    try {
        const userId = req.user.id;
        
        // Limpiar de memoria
        for (const [cId, config] of Object.entries(memoryBots)) {
            if (config.userId === userId) {
                delete memoryBots[cId];
                io.emit('bot_updated', { contactId: cId, bot: { active: false, persona: 'Ninguna' } });
            }
        }

        // Eliminar en Supabase
        await supabaseAdmin
            .from('bot_configs')
            .delete()
            .eq('user_id', userId);

        io.emit('panic_triggered', { userId });
        res.json({ success: true, message: 'Todos los bots han sido silenciados y desactivados de emergencia.' });
    } catch (e) {
        console.error("Error en botón de pánico:", e);
        res.status(500).json({ error: e.message });
    }
});

// Gestionar favoritos en Supabase
app.post('/api/favorite', requireAuth, async (req, res) => {
    try {
        const { contactId, favorite } = req.body;
        if (!contactId) return res.status(400).json({ error: 'Falta contactId' });
        
        const cleanDigits = contactId.split('@')[0].replace(/\D/g, '');
        const mappedPhone = lidToPhoneMap.get(contactId) || lidToPhoneMap.get(cleanDigits) || '';

        const idsToProcess = [contactId];
        if (cleanDigits) idsToProcess.push(cleanDigits);
        if (mappedPhone) {
            idsToProcess.push(mappedPhone);
            idsToProcess.push(`${mappedPhone}@c.us`);
        }

        if (favorite) {
            for (const id of idsToProcess) {
                await supabaseAdmin
                    .from('favorites')
                    .upsert({
                        user_id: req.user.id,
                        contact_id: id,
                        created_at: new Date()
                    }, { onConflict: 'user_id,contact_id' });
            }
        } else {
            for (const id of idsToProcess) {
                await supabaseAdmin
                    .from('favorites')
                    .delete()
                    .eq('user_id', req.user.id)
                    .eq('contact_id', id);
            }
        }
        
        res.json({ success: true });
    } catch (e) {
        console.error("Error actualizando favoritos:", e);
        res.status(500).json({ error: e.message });
    }
});

// Obtener historial de mensajes desde WhatsApp Web + Supabase
app.get('/api/messages/:contactId', requireAuth, async (req, res) => {
    try {
        const contactId = req.params.contactId;
        const cleanId = contactId.split('@')[0];

        // 1. Mensajes guardados en Supabase
        const { data, error } = await supabaseAdmin
            .from('chat_history')
            .select('*')
            .eq('user_id', req.user.id)
            .or(`contact_id.eq.${contactId},contact_id.eq.${cleanId},contact_id.ilike.%${cleanId}%`)
            .order('created_at', { ascending: true })
            .limit(100);

        const mergedMessages = (data || []).map(m => ({
            type: m.message_type,
            from: m.sender || m.contact_id,
            text: m.text,
            timestamp: m.created_at
        }));

        // 2. Si WhatsApp está conectado, traer también mensajes reales del chat
        if (isConnected && client) {
            try {
                const targetWid = lidToSerializedMap.get(contactId) || lidToSerializedMap.get(cleanId) || contactId;
                const chat = await client.getChatById(targetWid);
                if (chat && chat.fetchMessages) {
                    const waMsgs = await chat.fetchMessages({ limit: 40 });
                    for (const wm of (waMsgs || [])) {
                        if (!wm.body) continue;
                        const msgTime = new Date((wm.timestamp || 0) * 1000);
                        const isExisting = mergedMessages.some(m => m.text === wm.body && Math.abs(new Date(m.timestamp) - msgTime) < 10000);
                        if (!isExisting) {
                            mergedMessages.push({
                                type: wm.fromMe ? 'outgoing' : 'incoming',
                                from: wm.from,
                                text: wm.body,
                                timestamp: msgTime
                            });
                        }
                    }
                }
            } catch (err) {}
        }

        // Ordenar cronológicamente
        mergedMessages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

        res.json({ messages: mergedMessages });
    } catch (e) {
        console.error("Error en /api/messages:", e);
        res.status(500).json({ error: e.message });
    }
});

// Memoria para personalidades personalizadas
let memoryCustomPersonas = [];

// Obtener personalidades personalizadas del usuario
app.get('/api/personas/custom', requireAuth, async (req, res) => {
    try {
        const { data, error } = await supabaseAdmin
            .from('custom_personas')
            .select('*')
            .eq('user_id', req.user.id);

        if (!error && data && data.length > 0) {
            return res.json({ personas: data });
        }
        res.json({ personas: memoryCustomPersonas.filter(p => p.user_id === req.user.id) });
    } catch (e) {
        res.json({ personas: memoryCustomPersonas.filter(p => p.user_id === req.user.id) });
    }
});

// Guardar nueva personalidad personalizada
app.post('/api/personas/custom', requireAuth, async (req, res) => {
    try {
        const { name, desc, prompt, avatar } = req.body;
        if (!name || !prompt) return res.status(400).json({ error: 'Falta nombre o instrucciones del personaje' });

        const newPersona = {
            id: `custom_${Date.now()}`,
            user_id: req.user.id,
            name: name.trim(),
            desc: desc ? desc.trim() : prompt.slice(0, 60),
            prompt: prompt.trim(),
            avatar: avatar || '🎭',
            created_at: new Date()
        };

        memoryCustomPersonas.push(newPersona);

        try {
            await supabaseAdmin
                .from('custom_personas')
                .upsert(newPersona);
        } catch (e) {}

        res.json({ success: true, persona: newPersona });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Eliminar personalidad personalizada
app.delete('/api/personas/custom/:id', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;
        memoryCustomPersonas = memoryCustomPersonas.filter(p => !(p.id === id && p.user_id === req.user.id));
        try {
            await supabaseAdmin
                .from('custom_personas')
                .delete()
                .eq('id', id)
                .eq('user_id', req.user.id);
        } catch (e) {}
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

server.listen(port, () => {
    console.log(`Backend conectado a Supabase y corriendo en http://localhost:${port}`);
});
