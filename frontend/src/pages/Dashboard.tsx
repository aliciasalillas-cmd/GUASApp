import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import QRCode from 'react-qr-code';
import { io, Socket } from 'socket.io-client';
import html2canvas from 'html2canvas';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || (window.location.hostname === 'localhost' ? 'http://localhost:3000' : 'https://guasapp-production.up.railway.app');

const defaultPersonas = [
  { id: 'absurdo', name: 'Intelectual Absurdo', desc: '🧐 Pedante supremo, latinajos y palabras rimbombantes sin sentido.' },
  { id: 'cachondo', name: 'Cachondo Mental', desc: '🤣 Memes escritos, risas y chistes malos sin tomarse nada en serio.' },
  { id: 'cunado', name: 'El Cuñado de Bar', desc: '🍺 Indignado que sabe de todo, mayúsculas y lecciones de vida.' },
  { id: 'criptobro', name: 'El Cripto-Bro de Bali', desc: '📈 Mindset, levantarse a las 5 AM y mentalidad de tiburón.' },
  { id: 'amoroso', name: 'El Oso Amoroso', desc: '💖 Lluvia de corazones, paz, bendiciones cósmicas y "ser de luz".' },
  { id: 'mistica', name: 'La Tía Mística / Tarotista', desc: '🔮 Mercurio retrógrado, piedras de cuarzo y el aura sucia.' },
  { id: 'pasivo', name: 'El Pasivo-Agresivo', desc: '🙃 "No, si a mí me da igual...", reproches y puñaladas sutiles.' },
  { id: 'coach', name: 'El Coach Motivacional Intenso', desc: '💪 ¡100 flexiones YA!, duchas frías y sin excusas de débil.' },
  { id: 'conspiranoico', name: 'El Conspiranoico', desc: '👁️ Todo es culpa del 5G, los chips y las élites que nos vigilan.' },
  { id: 'progre_clasico', name: 'Progresista Nivel 100', desc: '🥑 Lucha de clases, lenguaje inclusivo y deconstrucción moral.' },
  { id: 'facha_clasico', name: 'Facha Clásico', desc: '🇪🇸 Nostálgico de la mili, patria y críticas a la generación de cristal.' },
  { id: 'sanchista', name: 'El Sanchista de Acero', desc: '🌹 Todo es una jugada en 4D del Presidente. Confía en el plan.' },
  { id: 'turco', name: 'El Turco-Intelectual', desc: '📚 Ensayos sociológicos pedantes ante cualquier pregunta tonta.' },
  { id: 'doomer', name: 'El Doomer Existencialista', desc: '💀 Nihilismo puro. El mundo colapsa mañana, para qué molestarse.' }
];

export default function Dashboard({ session }: { session: any }) {
  const [selectedContact, setSelectedContact] = useState<any>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showCustomModal, setShowCustomModal] = useState(false);
  
  const [whatsappConnected, setWhatsappConnected] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [contacts, setContacts] = useState<any[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'contactos' | 'grupos' | 'favoritos'>('contactos');
  
  const [customPersonas, setCustomPersonas] = useState<any[]>([]);
  const [newCustomName, setNewCustomName] = useState('');
  const [newCustomPrompt, setNewCustomPrompt] = useState('');
  const [newCustomAvatar, setNewCustomAvatar] = useState('🎭');
  const [savingCustom, setSavingCustom] = useState(false);

  const [, setSocket] = useState<Socket | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [aiConfig, setAiConfig] = useState(() => {
    try {
      const saved = localStorage.getItem('guasap_ai_config');
      return saved ? JSON.parse(saved) : { provider: 'gemini', apiKey: '' };
    } catch (e) {
      return { provider: 'gemini', apiKey: '' };
    }
  });
  
  const [exportingScreenshot, setExportingScreenshot] = useState(false);
  const [panicAlert, setPanicAlert] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const contactsLoaded = useRef(false);

  const getAuthHeaders = useCallback(() => {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session?.access_token}`
    };
  }, [session?.access_token]);

  const fetchCustomPersonas = useCallback(async () => {
    if (!session?.access_token) return;
    try {
      const res = await fetch(`${BACKEND_URL}/api/personas/custom`, {
        headers: getAuthHeaders()
      });
      const data = await res.json();
      if (data.personas) {
        setCustomPersonas(data.personas.map((p: any) => ({
          id: p.id,
          name: p.name,
          desc: `${p.avatar || '🎭'} ${p.desc || p.prompt?.slice(0, 45)}...`
        })));
      }
    } catch (e) {
      console.error("Error al cargar personalidades personalizadas:", e);
    }
  }, [session?.access_token, getAuthHeaders]);

  const fetchContacts = useCallback(async () => {
    if (!session?.access_token) return;
    setLoadingContacts(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/contacts`, {
        headers: getAuthHeaders()
      });
      const data = await res.json();
      if (data.contacts) {
        const mapped = data.contacts.map((c: any) => ({
          ...c,
          persona: c.bot?.persona || 'Ninguna',
          active: c.bot?.active || false,
          avatar: c.isGroup ? '👥' : '👤'
        }));
        setContacts(mapped);

        setSelectedContact((curr: any) => {
          if (curr) {
            const updated = mapped.find((m: any) => m.id === curr.id || (m.number && curr.number && m.number === curr.number));
            return updated || curr;
          }
          const savedLastId = localStorage.getItem('guasap_last_contact');
          const cleanSaved = savedLastId ? savedLastId.split('@')[0].replace(/\D/g, '') : '';
          return mapped.find((m: any) => 
            m.id === savedLastId || 
            (cleanSaved && m.id.includes(cleanSaved)) || 
            (cleanSaved && m.number && m.number.replace(/\D/g, '').includes(cleanSaved))
          ) || mapped.find((m: any) => m.favorite) || null;
        });
      }
    } catch (error) {
      console.error("Error al cargar contactos:", error);
    } finally {
      setLoadingContacts(false);
    }
  }, [session?.access_token, getAuthHeaders]);

  useEffect(() => {
    if (!session?.access_token) return;

    fetchCustomPersonas();

    const newSocket = io(BACKEND_URL, {
      auth: {
        token: session.access_token
      }
    });
    setSocket(newSocket);

    newSocket.on('whatsapp_qr', (qr: string) => {
      setQrCode(qr);
      setWhatsappConnected(false);
    });

    newSocket.on('whatsapp_ready', () => {
      setWhatsappConnected(true);
      setQrCode(null);
      if (!contactsLoaded.current) {
        fetchContacts();
        contactsLoaded.current = true;
      }
    });
    
    newSocket.on('whatsapp_disconnected', () => {
      setWhatsappConnected(false);
      contactsLoaded.current = false;
    });

    newSocket.on('bot_updated', (data: any) => {
      if (data.contactId) {
        setContacts(prev => prev.map(c => c.id === data.contactId ? { ...c, active: data.bot?.active ?? false, persona: data.bot?.persona ?? '' } : c));
        setSelectedContact((curr: any) => {
          if (curr && curr.id === data.contactId) {
            return { ...curr, active: data.bot?.active ?? false, persona: data.bot?.persona ?? '' };
          }
          return curr;
        });
      }
    });
    
    newSocket.on('chat_message', (msg) => {
      setMessages(prev => [...prev, msg]);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);

      if (msg.from || msg.to || msg.rawFrom || msg.rawTo) {
        const targetId = msg.from || msg.to;
        const rawTargetId = msg.rawFrom || msg.rawTo;
        setContacts(prev => {
          const idx = prev.findIndex(c => c.id === targetId || (rawTargetId && c.id === rawTargetId));
          if (idx > 0) {
            const copy = [...prev];
            const [item] = copy.splice(idx, 1);
            return [{ ...item, timestamp: Date.now() }, ...copy];
          }
          return prev;
        });
      }
    });

    const checkStatus = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/status`, {
          headers: getAuthHeaders()
        });
        const data = await res.json();
        
        if (data.whatsapp_connected !== undefined) {
          setWhatsappConnected(data.whatsapp_connected);
        }
        if (data.qr !== undefined) {
          setQrCode(data.qr);
        }
        if (data.config) {
          setAiConfig((prev: any) => prev?.apiKey === '' ? data.config : prev);
        }

        if (data.whatsapp_connected && !contactsLoaded.current) {
          fetchContacts();
          contactsLoaded.current = true;
        }
      } catch (error) {}
    };

    const interval = setInterval(checkStatus, 3000);
    checkStatus();

    return () => {
      clearInterval(interval);
      newSocket.disconnect();
    };
  }, [session?.access_token, fetchContacts, fetchCustomPersonas, getAuthHeaders]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const saveAiConfig = async () => {
    try {
      localStorage.setItem('guasap_ai_config', JSON.stringify(aiConfig));
      setShowSettings(false);
      const res = await fetch(`${BACKEND_URL}/api/config`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(aiConfig)
      });
      const data = await res.json();
      if (data.config) {
        setAiConfig(data.config);
      }
    } catch (e) {
      console.error("Error sincronizando config con backend:", e);
      setShowSettings(false);
    }
  };

  const saveBotConfig = async (contactId: string, active: boolean, persona: string) => {
    try {
      await fetch(`${BACKEND_URL}/api/bot`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ contactId, active, persona })
      });
      
      setContacts(prev => prev.map(c => c.id === contactId ? { ...c, active, persona } : c));
      if (selectedContact && selectedContact.id === contactId) {
        setSelectedContact({ ...selectedContact, active, persona });
      }
    } catch (e) {
      console.error("Error guardando bot:", e);
    }
  };

  const handleEmergencyPause = () => {
    if (!selectedContact) return;
    saveBotConfig(selectedContact.id, false, 'Ninguna');
  };

  const handleGlobalPanic = async () => {
    try {
      setContacts(prev => prev.map(c => ({ ...c, active: false, persona: 'Ninguna' })));
      if (selectedContact) {
        setSelectedContact({ ...selectedContact, active: false, persona: 'Ninguna' });
      }
      setPanicAlert('🚨 ¡BOTÓN DE PÁNICO ACTIVADO! Todos los bots han sido silenciados y apagados de inmediato.');
      setTimeout(() => setPanicAlert(null), 4500);

      await fetch(`${BACKEND_URL}/api/panic`, {
        method: 'POST',
        headers: getAuthHeaders()
      });
    } catch (e) {
      console.error("Error en botón de pánico:", e);
    }
  };

  const handleCreateCustomPersona = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomName.trim() || !newCustomPrompt.trim()) return;

    setSavingCustom(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/personas/custom`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          name: newCustomName.trim(),
          prompt: newCustomPrompt.trim(),
          avatar: newCustomAvatar
        })
      });
      const data = await res.json();
      if (data.persona) {
        await fetchCustomPersonas();
        if (selectedContact) {
          saveBotConfig(selectedContact.id, true, data.persona.name);
        }
        setShowCustomModal(false);
        setNewCustomName('');
        setNewCustomPrompt('');
      }
    } catch (e) {
      console.error("Error guardando personalidad personalizada:", e);
    } finally {
      setSavingCustom(false);
    }
  };

  const handleExportViralScreenshot = async () => {
    if (!chatContainerRef.current) return;
    setExportingScreenshot(true);
    try {
      const canvas = await html2canvas(chatContainerRef.current, {
        backgroundColor: '#18200B',
        scale: 2,
        useCORS: true
      });
      const image = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = image;
      link.download = `GUASApp_${selectedContact?.name || 'chat'}_troleo.png`;
      link.click();
    } catch (e) {
      console.error("Error al exportar captura:", e);
    } finally {
      setExportingScreenshot(false);
    }
  };

  const toggleFavorite = async (e: React.MouseEvent, contactId: string, currentStatus: boolean) => {
    e.stopPropagation();
    try {
      await fetch(`${BACKEND_URL}/api/favorite`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ contactId, favorite: !currentStatus })
      });
      setContacts(prev => prev.map(c => c.id === contactId ? { ...c, favorite: !currentStatus } : c));
    } catch (e) {
      console.error("Error cambiando favorito:", e);
    }
  };

  useEffect(() => {
    if (selectedContact?.id && session?.access_token) {
      const fetchHistory = async () => {
        try {
          const res = await fetch(`${BACKEND_URL}/api/messages/${encodeURIComponent(selectedContact.id)}`, {
            headers: getAuthHeaders()
          });
          const data = await res.json();
          if (data.messages && Array.isArray(data.messages)) {
            setMessages(data.messages);
            setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
          }
        } catch (e) {
          console.error("Error cargando mensajes:", e);
        }
      };
      fetchHistory();
    }
  }, [selectedContact?.id, session?.access_token, getAuthHeaders]);

  return (
    <div className="min-h-screen bg-[#38461E] text-slate-100 relative overflow-hidden pb-16">
      {/* Luces de ambiente y gradientes de fondo Neón */}
      <div className="fixed top-[-15%] left-[-10%] w-[500px] h-[500px] bg-[#FF6B00]/15 rounded-full blur-[130px] pointer-events-none"></div>
      <div className="fixed bottom-[-15%] right-[-10%] w-[600px] h-[600px] bg-[#FF2E93]/15 rounded-full blur-[150px] pointer-events-none"></div>
      <div className="fixed top-[30%] right-[15%] w-[400px] h-[400px] bg-[#222B11]/40 rounded-full blur-[100px] pointer-events-none"></div>

      {/* Barra de Navegación Militar Táctica */}
      <header className="sticky top-0 z-30 bg-[#222B11]/95 backdrop-blur-xl border-b-2 border-[#465522] shadow-lg shadow-black/40">
        <div className="max-w-5xl mx-auto px-4 py-2.5 flex items-center justify-between gap-4">
          
          {/* Lado Izquierdo: Logo Más Grande y Título Vibrante */}
          <div className="flex items-center gap-4">
            <div className="relative group">
              <img 
                src="/logo.jpg?v=4" 
                alt="GUASA-APP Logo" 
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl shadow-2xl shadow-orange-500/50 object-cover border-3 border-[#FF5500] animate-playful-logo hover:rotate-12 hover:scale-110 active:-rotate-12 transition-all duration-300 shrink-0 cursor-pointer" 
              />
              <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-[#FF2E93] rounded-full border-2 border-[#222B11] animate-ping pointer-events-none"></span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-black text-2xl sm:text-3xl tracking-wider flex items-center leading-none drop-shadow-[0_2px_12px_rgba(255,85,0,0.4)]">
                  <span className="text-[#FF5500]">GUASA</span>
                  <span className="text-[#FFE500]">-APP</span>
                </h1>
                <span className="text-xl sm:text-2xl transform hover:scale-125 transition-transform cursor-pointer" title="¡Troleo Activo!">
                  😉
                </span>
              </div>
              <p className="text-xs sm:text-sm text-[#FFC4A8] font-bold mt-1 tracking-tight">
                Troleo Inteligente para WhatsApp
              </p>
            </div>
          </div>

          {/* Centro: 🚨 BOTÓN DEL PÁNICO MAESTRO */}
          <div className="flex items-center justify-center">
            <button 
              onClick={handleGlobalPanic} 
              className="px-4 sm:px-6 py-2.5 bg-gradient-to-r from-red-600 via-[#FF2E93] to-red-600 hover:from-red-500 hover:to-pink-500 text-white rounded-2xl shadow-xl shadow-red-600/50 transition-all text-xs sm:text-sm font-black flex items-center gap-2 cursor-pointer transform hover:scale-108 active:scale-95 border-2 border-[#FFE500] animate-pulse"
              title="¡Pánico! Silenciar y apagar todos los bots de inmediato"
            >
              <span className="text-base sm:text-lg animate-bounce">🚨</span>
              <span className="font-black uppercase tracking-widest drop-shadow-md">BOTÓN DE PÁNICO</span>
            </button>
          </div>
          
          {/* Lado Derecho: Botones de Configuración y Salir */}
          <div className="flex items-center gap-2.5">
            <button 
              onClick={() => setShowSettings(true)} 
              className="px-3 py-2 bg-[#18200B] hover:bg-[#2F3D18] text-[#FFD6E8] hover:text-[#FF5500] rounded-xl border border-[#465522] hover:border-[#FF5500] transition-all text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <span>⚙️</span>
              <span className="hidden sm:inline">IA Config</span>
            </button>
            
            <button 
              onClick={handleLogout} 
              className="text-xs text-[#FFC4A8] hover:text-red-300 transition-colors bg-[#18200B] hover:bg-red-950/60 px-3 py-2 rounded-xl border border-[#465522] hover:border-red-500/50 font-bold cursor-pointer"
            >
              Salir
            </button>
          </div>
        </div>

        {/* Alerta Banner de Pánico */}
        {panicAlert && (
          <div className="bg-red-600 border-t-2 border-b-2 border-[#FFE600] text-white px-4 py-2 text-center text-xs font-black tracking-wider animate-bounce flex items-center justify-center gap-2 shadow-2xl">
            <span className="text-base">🚨</span>
            <span>{panicAlert}</span>
            <span className="text-base">🚨</span>
          </div>
        )}
      </header>

      {/* Contenido Principal */}
      <main className="max-w-5xl mx-auto px-4 mt-6 flex flex-col md:flex-row gap-5 relative z-10">
        {!whatsappConnected ? (
          <div className="w-full bg-[#222B11]/95 backdrop-blur-xl border-2 border-[#465522] rounded-3xl p-8 text-center flex flex-col items-center shadow-2xl">
            <img 
              src="/logo.jpg?v=4" 
              alt="GUASAPAPP Logo" 
              className="w-20 h-20 rounded-3xl mx-auto mb-4 object-cover shadow-2xl shadow-orange-500/30 border-2 border-[#FF6B00] transform hover:scale-105 transition-transform" 
            />
            <h2 className="text-2xl font-black mb-1 tracking-tight">
              <span className="text-[#FF6B00]">GUASA</span><span className="text-[#FFE600]">-APP</span>
            </h2>
            <p className="text-[#FFC4A8] mb-6 max-w-md mx-auto text-sm leading-relaxed">
              Abre WhatsApp en tu móvil, entra en <b className="text-[#FF6B00] font-bold">Dispositivos Vinculados</b> y escanea este código.
            </p>
            
            <div className="bg-white p-4 rounded-3xl shadow-2xl shadow-pink-500/15 w-64 h-64 flex items-center justify-center mb-4 border-4 border-[#FF6B00] transform hover:scale-102 transition-transform">
              {qrCode ? (
                <QRCode value={qrCode} size={224} />
              ) : (
                <div className="animate-pulse flex flex-col items-center justify-center">
                  <div className="w-12 h-12 border-4 border-[#FF6B00] border-t-transparent rounded-full animate-spin mb-3"></div>
                  <p className="text-slate-800 text-xs font-bold">Generando código QR...</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <>
            <div className={`${selectedContact ? 'hidden md:flex' : 'flex'} w-full md:w-[380px] flex-shrink-0 flex-col gap-3`}>
              {/* Barra de pestañas */}
              <div className="bg-[#222B11]/95 backdrop-blur-xl p-1 rounded-2xl border border-[#465522] flex shadow-sm">
                <button 
                  onClick={() => setActiveTab('contactos')} 
                  className={`flex-1 py-2 text-xs font-black rounded-xl transition-all cursor-pointer ${activeTab === 'contactos' ? 'bg-gradient-to-r from-[#FF6B00] to-[#FF2E93] text-white shadow-md shadow-pink-500/20' : 'text-[#FFC4A8] hover:text-[#FFD6E8]'}`}
                >
                  👤 Contactos
                </button>
                <button 
                  onClick={() => setActiveTab('grupos')} 
                  className={`flex-1 py-2 text-xs font-black rounded-xl transition-all cursor-pointer ${activeTab === 'grupos' ? 'bg-gradient-to-r from-[#FF6B00] to-[#FF2E93] text-white shadow-md shadow-pink-500/20' : 'text-[#FFC4A8] hover:text-[#FFD6E8]'}`}
                >
                  👥 Grupos
                </button>
                <button 
                  onClick={() => setActiveTab('favoritos')} 
                  className={`flex-1 py-2 text-xs font-black rounded-xl transition-all cursor-pointer ${activeTab === 'favoritos' ? 'bg-gradient-to-r from-[#FF6B00] to-[#FF2E93] text-white shadow-md shadow-pink-500/20' : 'text-[#FFC4A8] hover:text-[#FFD6E8]'}`}
                >
                  ⭐ Favoritos
                </button>
              </div>
              
              {/* Buscador */}
              <div className="flex items-center gap-2 w-full">
                <div className="relative flex-1">
                  <input
                    type="text"
                    placeholder="Buscar chat o grupo..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-[#18200B] border border-[#465522] focus:border-[#FF6B00] rounded-2xl px-3.5 py-2.5 text-xs text-[#FFD6E8] placeholder-[#8B9D6E] focus:ring-1 focus:ring-[#FF6B00]/40 focus:outline-none transition-all shadow-inner"
                  />
                  {searchQuery && (
                    <button 
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-2.5 text-xs text-[#FFC4A8] hover:text-white"
                    >
                      ✕
                    </button>
                  )}
                </div>
                <button 
                  onClick={fetchContacts} 
                  className="text-[#FF6B00] p-2.5 bg-[#18200B] hover:bg-[#2F3D18] rounded-2xl border border-[#465522] hover:border-[#FF6B00] transition-all flex items-center justify-center text-sm shadow-sm cursor-pointer"
                  title="Refrescar lista de chats"
                >
                  ↻
                </button>
              </div>
              
              {/* Lista de Contactos */}
              {loadingContacts ? (
                 <div className="text-center py-12 text-[#FFC4A8] animate-pulse text-xs bg-[#222B11]/60 rounded-3xl border border-[#465522] p-6">
                   <div className="w-8 h-8 border-2 border-[#FF6B00] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                   Extrayendo chats tácticos de WhatsApp...
                 </div>
              ) : (
                <div className="grid gap-2 max-h-[70vh] overflow-y-auto pr-1 custom-scrollbar">
                  {contacts
                    .filter(c => {
                       if (activeTab === 'contactos') return !c.isGroup;
                       if (activeTab === 'grupos') return c.isGroup;
                       if (activeTab === 'favoritos') return c.favorite;
                       return true;
                    })
                    .filter(c => (c.name || '').toLowerCase().includes(searchQuery.toLowerCase()) || (c.number || '').includes(searchQuery))
                    .map(contact => {
                      const isSelected = selectedContact?.id === contact.id;
                      return (
                        <div 
                          key={contact.id} 
                          onClick={() => {
                            setSelectedContact(contact);
                            localStorage.setItem('guasap_last_contact', contact.id);
                          }}
                          className={`p-3 rounded-2xl flex items-center justify-between cursor-pointer transition-all duration-200 border ${
                            isSelected 
                              ? 'bg-[#18200B] border-[#FF6B00] shadow-lg shadow-pink-500/15 scale-[1.01]' 
                              : 'bg-[#222B11]/90 hover:bg-[#2B3716] border-[#465522]/80 hover:border-[#FF6B00]/40'
                          }`}
                        >
                          <div className="flex items-center gap-3 truncate">
                            <div className="w-10 h-10 bg-[#18200B] rounded-2xl flex items-center justify-center text-xl relative border border-[#465522] flex-shrink-0 shadow-inner">
                              {contact.avatar}
                              {contact.favorite && <span className="absolute -bottom-1 -right-1 text-[11px] drop-shadow-md">⭐</span>}
                            </div>
                            <div className="truncate">
                              <h4 className="font-bold text-[#FFD6E8] text-xs truncate leading-tight">{contact.name}</h4>
                              <div className="text-[10px] text-[#A3B880] font-mono mt-0.5 truncate">{contact.number || (contact.isGroup ? 'Grupo de WhatsApp' : 'Contacto de WhatsApp')}</div>
                              <div className="flex items-center gap-1.5 mt-1">
                                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${contact.active ? 'bg-[#FF2E93] animate-ping' : 'bg-slate-600'}`}></span>
                                <span className={`text-[11px] truncate max-w-[150px] font-semibold ${contact.active ? 'text-[#FF2E93]' : 'text-[#8B9D6E]'}`}>
                                  {contact.active ? contact.persona : 'Inactivo'}
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          <button 
                            onClick={(e) => toggleFavorite(e, contact.id, contact.favorite)}
                            className={`text-lg transition-transform hover:scale-125 p-1 flex-shrink-0 cursor-pointer ${contact.favorite ? 'text-[#FF6B00] drop-shadow-md' : 'text-[#8B9D6E] hover:text-[#FF6B00]'}`}
                            title={contact.favorite ? 'Quitar de favoritos' : 'Añadir a favoritos'}
                          >
                            {contact.favorite ? '⭐' : '☆'}
                          </button>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>

            <div className={`${selectedContact ? 'flex' : 'hidden md:flex'} flex-1 flex-col h-[74vh]`}>
              {selectedContact ? (
                <div className="bg-[#222B11]/95 backdrop-blur-xl border-2 border-[#465522] rounded-3xl overflow-hidden flex flex-col h-full shadow-2xl">
                  {/* Cabecera del Contacto */}
                  <div className="p-3.5 border-b border-[#465522] flex justify-between items-center bg-[#18200B]/90 gap-2">
                     <div className="flex items-center gap-2.5 truncate">
                       <button 
                         onClick={() => setSelectedContact(null)} 
                         className="md:hidden px-2.5 py-1 bg-[#18200B] border border-[#465522] text-[#FF6B00] rounded-xl text-xs font-bold hover:text-white cursor-pointer"
                         title="Volver a la lista de chats"
                       >
                         ← Volver
                       </button>
                       <span className="text-xl bg-[#222B11] p-1 rounded-xl border border-[#465522]">{selectedContact.avatar}</span>
                       <div className="truncate">
                         <h3 className="text-[#FFD6E8] font-black text-sm truncate leading-tight">{selectedContact.name}</h3>
                         <span className="text-[10px] text-[#A3B880] font-mono">{selectedContact.number || (selectedContact.isGroup ? 'Grupo de WhatsApp' : 'Contacto de WhatsApp')}</span>
                       </div>
                     </div>

                     <div className="flex items-center gap-2 flex-shrink-0">
                       {/* Botón de Pánico */}
                       {selectedContact.active && (
                         <button 
                           onClick={handleEmergencyPause}
                           className="px-3 py-1 bg-[#FF2E93] hover:bg-[#ff48a1] text-white font-black text-[11px] rounded-full shadow-md shadow-pink-600/40 flex items-center gap-1 transition-all cursor-pointer animate-pulse"
                           title="Pausar el bot de inmediato"
                         >
                           🚨 Pausar
                         </button>
                       )}

                       {/* Botón de Captura Viral */}
                       <button
                         onClick={handleExportViralScreenshot}
                         disabled={exportingScreenshot}
                         className="px-3 py-1 bg-gradient-to-r from-[#FF6B00] to-[#FF2E93] hover:from-[#ff8533] hover:to-[#ff48a1] text-white font-bold text-[11px] rounded-full shadow-md flex items-center gap-1 transition-all cursor-pointer"
                         title="Descargar imagen del chat lista para compartir en redes"
                       >
                         {exportingScreenshot ? '⏳ Exportando...' : '📸 Captura Viral'}
                       </button>

                       <span className={`px-2.5 py-1 rounded-full text-[10px] font-black tracking-wide ${selectedContact.active ? 'bg-[#FF2E93]/20 text-[#FF2E93] border border-[#FF2E93]/50' : 'bg-[#18200B] text-[#8B9D6E] border border-[#465522]'}`}>
                         {selectedContact.active ? 'ACTIVO' : 'INACTIVO'}
                       </span>
                     </div>
                  </div>

                  {/* Selector de Personalidad y Creador */}
                  <div className="p-3 bg-[#18200B]/80 border-b border-[#465522]">
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="text-[11px] text-[#FFC4A8] font-black uppercase tracking-wider block">PERSONALIDAD DEL BOT</label>
                      <button 
                        onClick={() => setShowCustomModal(true)}
                        className="text-[11px] text-[#FF6B00] hover:text-[#FF8833] font-black flex items-center gap-1 hover:underline cursor-pointer"
                      >
                        + Crear Personaje Propio
                      </button>
                    </div>
                    
                    <select 
                      value={selectedContact.persona || ''}
                      onChange={(e) => {
                         const persona = e.target.value;
                         saveBotConfig(selectedContact.id, !!persona, persona);
                      }}
                      className="w-full bg-[#222B11] border border-[#465522] focus:border-[#FF6B00] text-[#FFD6E8] rounded-xl p-2.5 text-xs focus:ring-1 focus:ring-[#FF6B00]/40 focus:outline-none transition-all font-semibold"
                    >
                      <option value="">❌ Desactivar Bot para este contacto</option>
                      <optgroup label="🎭 Personalidades Oficiales">
                        {defaultPersonas.map(p => (
                          <option key={p.id} value={p.name}>{p.name} - {p.desc}</option>
                        ))}
                      </optgroup>
                      {customPersonas.length > 0 && (
                        <optgroup label="✨ Mis Personajes Creados">
                          {customPersonas.map(p => (
                            <option key={p.id} value={p.name}>{p.name} - {p.desc}</option>
                          ))}
                        </optgroup>
                      )}
                    </select>

                    <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-[#465522] gap-2">
                      <span className="text-[10px] text-[#A3B880] font-semibold flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse"></span>
                        <span>Motor de IA Satírico Activo ({aiConfig.provider === 'gemini' ? 'Gemini Flash' : 'ChatGPT'})</span>
                      </span>

                      <button 
                        type="button"
                        onClick={() => setShowSettings(true)}
                        className="text-[10px] text-[#FF6B00] hover:text-white underline font-semibold transition-colors cursor-pointer flex items-center gap-1"
                        title="Configurar Motor IA"
                      >
                        ⚙️ Ajustar Clave IA
                      </button>
                    </div>
                  </div>

                  {/* Monitor de Chats (Canvas Ref para Captura Viral) */}
                  <div 
                    ref={chatContainerRef}
                    className="flex-1 p-4 overflow-y-auto bg-[#141A09] flex flex-col gap-3 custom-scrollbar"
                  >
                     <div className="flex items-center justify-between text-[11px] text-[#8B9D6E] border-b border-[#465522] pb-1.5 mb-1">
                       <span className="font-bold">💬 Conversación en Directo</span>
                       <span className="text-[10px] text-[#FF2E93] font-black flex items-center gap-1">
                         <span className="w-1.5 h-1.5 rounded-full bg-[#FF2E93] animate-ping"></span>
                         ⚡ GUASApp En Directo
                       </span>
                     </div>
                     
                     {messages.filter(m => {
                        if (!selectedContact) return false;
                        const msgFrom = String(m.from || '');
                        const msgTo = String(m.to || '');
                        const cId = String(selectedContact.id || '');
                        const cNum = String(selectedContact.number || '');
                        const cleanCId = cId.split('@')[0];
                        const cleanMsgFrom = msgFrom.split('@')[0];
                        const cleanMsgTo = msgTo.split('@')[0];

                        return msgFrom === cId || msgTo === cId ||
                               (cleanCId && (cleanMsgFrom === cleanCId || cleanMsgTo === cleanCId || msgFrom.includes(cleanCId) || msgTo.includes(cleanCId))) ||
                               (cNum && (msgFrom.includes(cNum) || msgTo.includes(cNum))) ||
                               (m.rawTo && String(m.rawTo).includes(cleanCId)) ||
                               (m.rawFrom && String(m.rawFrom).includes(cleanCId)) ||
                               m.type === 'system' || m.type === 'error';
                      }).map((msg, i) => (
                        <div 
                          key={i} 
                          className={`flex flex-col max-w-[85%] ${
                            msg.type === 'outgoing' || msg.type === 'system' 
                              ? 'self-end items-end' 
                              : 'self-start items-start'
                          }`}
                        >
                           <span className="text-[10px] text-[#FFC4A8] font-medium mb-1 px-1">
                             {msg.type === 'system' ? '🤖 Sistema' : msg.type === 'outgoing' ? '🤖 Bot (Tú)' : selectedContact.name}
                           </span>
                           <div className={`p-3 rounded-2xl text-xs leading-relaxed shadow-lg ${
                             msg.type === 'outgoing' ? 'bg-gradient-to-r from-[#FF6B00] via-[#FF5500] to-[#FF2E93] text-white font-medium rounded-tr-sm shadow-pink-500/20' : 
                             msg.type === 'system' ? 'bg-[#222B11] text-[#FF6B00] border border-[#FF6B00]/40 font-bold' :
                             msg.type === 'error' ? 'bg-red-950/80 text-red-200 border border-red-500/50' :
                             'bg-[#222B11] text-[#FFD6E8] rounded-tl-sm border border-[#465522]'
                           }`}>
                              {msg.audioUrl && (
                                <div className="mb-2 bg-black/40 p-2 rounded-xl border border-white/10 flex items-center gap-2">
                                  <audio controls src={msg.audioUrl} className="h-7 w-full max-w-[240px]" />
                                </div>
                              )}
                              <div>{msg.text}</div>
                           </div>
                        </div>
                      ))}

                      {/* Marca de Agua Oficial Viral para Redes Sociales */}
                      <div className="mt-4 pt-3 border-t border-[#465522]/60 flex items-center justify-between opacity-80 select-none">
                        <div className="flex items-center gap-2">
                          <img src="/logo.jpg?v=4" alt="GUASApp" className="w-5 h-5 rounded-lg object-cover border border-[#FF6B00]" />
                          <span className="text-[10px] font-black tracking-wider text-[#FFD6E8]">
                            <span className="text-[#FF6B00]">GUASA</span><span className="text-[#FFE500]">-APP</span>
                          </span>
                        </div>
                        <span className="text-[9px] font-mono text-[#A3B880] tracking-tight">
                          🎭 Troleo Inteligente con IA · TikTok / Insta / X
                        </span>
                      </div>
                      
                      <div ref={messagesEndRef} />
                  </div>
                </div>
              ) : (
                <div className="bg-[#222B11]/70 border-2 border-[#465522] border-dashed rounded-3xl flex-1 flex flex-col items-center justify-center p-8 text-center text-[#FFC4A8]">
                  <img src="/logo.jpg?v=4" alt="GUASAPAPP Logo" className="w-16 h-16 rounded-2xl mb-4 object-cover border-2 border-[#FF6B00]/60 shadow-lg shadow-orange-500/20" />
                  <h4 className="font-black text-base mb-1">
                    <span className="text-[#FF6B00]">GUASA</span><span className="text-[#FFE600]">-APP</span>
                  </h4>
                  <p className="text-xs max-w-xs text-[#A3B880]">Haz clic en cualquier contacto de la izquierda para activarle una personalidad satírica y ver el chat en vivo.</p>
                </div>
              )}
            </div>
          </>
        )}
      </main>

      {/* Modal Creador de Personalidades Personalizadas */}
      {showCustomModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-xl z-50 flex items-center justify-center p-4">
          <div className="bg-[#222B11] border-2 border-[#FF6B00] w-full max-w-md rounded-3xl p-6 shadow-2xl shadow-pink-500/20">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">🎨</span>
              <h3 className="text-lg font-black text-[#FFD6E8] tracking-tight">Crear Personalidad Propia</h3>
            </div>
            
            <form onSubmit={handleCreateCustomPersona} className="space-y-4">
              <div>
                <label className="text-xs text-[#FFC4A8] block mb-1 font-bold">Nombre del Personaje</label>
                <input 
                  type="text"
                  placeholder="Ej: Mi Suegra, El Jefe Exigente, Vendedor Pesado..."
                  value={newCustomName}
                  onChange={e => setNewCustomName(e.target.value)}
                  className="w-full bg-[#18200B] border border-[#465522] focus:border-[#FF6B00] text-[#FFD6E8] rounded-xl p-2.5 text-xs focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-xs text-[#FFC4A8] block mb-1 font-bold">Emoji Representativo</label>
                <div className="flex gap-2">
                  {['🎭', '👑', '😈', '💼', '🍕', '👵', '🤖', '🔥', '🍷'].map(emoji => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setNewCustomAvatar(emoji)}
                      className={`w-9 h-9 text-lg rounded-xl border transition-all flex items-center justify-center cursor-pointer ${newCustomAvatar === emoji ? 'bg-[#FF6B00] border-[#FF6B00] text-white scale-110' : 'bg-[#18200B] border-[#465522] hover:bg-[#2F3D18]'}`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs text-[#FFC4A8] block mb-1 font-bold">Instrucciones de Actitud y Estilo (Prompt)</label>
                <textarea 
                  rows={4}
                  placeholder="Explica cómo debe comportarse: qué muletillas usa, cómo reacciona cuando se enfadan, qué temas saca siempre..."
                  value={newCustomPrompt}
                  onChange={e => setNewCustomPrompt(e.target.value)}
                  className="w-full bg-[#18200B] border border-[#465522] focus:border-[#FF6B00] text-[#FFD6E8] rounded-xl p-2.5 text-xs focus:outline-none"
                  required
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button 
                  type="submit" 
                  disabled={savingCustom}
                  className="flex-1 bg-gradient-to-r from-[#FF6B00] to-[#FF2E93] hover:from-[#ff8533] hover:to-[#ff48a1] text-white font-black py-2.5 rounded-xl transition-all text-xs shadow-lg shadow-pink-500/30 cursor-pointer"
                >
                  {savingCustom ? 'Guardando...' : 'Guardar y Usar'}
                </button>
                <button 
                  type="button" 
                  onClick={() => setShowCustomModal(false)} 
                  className="px-5 bg-[#18200B] hover:bg-[#2F3D18] text-[#FFD6E8] border border-[#465522] font-bold rounded-xl transition-colors text-xs cursor-pointer"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

          {/* Modal Settings IA */}
          {showSettings && (
            <div className="fixed inset-0 bg-black/85 backdrop-blur-xl z-50 flex items-center justify-center p-4">
              <div className="bg-[#222B11] border-2 border-[#FF6B00] w-full max-w-md rounded-3xl p-6 shadow-2xl shadow-pink-500/20">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-2xl">⚙️</span>
                  <h3 className="text-lg font-black text-[#FFD6E8] tracking-tight">Configuración del Motor IA</h3>
                </div>

                <div className="space-y-4 mb-6">
                  <div>
                    <label className="text-xs text-[#FFC4A8] block mb-1.5 font-bold">Motor de Inteligencia Artificial</label>
                    <select 
                      value={aiConfig.provider}
                      onChange={e => setAiConfig({...aiConfig, provider: e.target.value})}
                      className="w-full bg-[#18200B] border border-[#465522] focus:border-[#FF6B00] text-[#FFD6E8] rounded-xl p-2.5 text-xs focus:outline-none font-semibold"
                    >
                      <option value="gemini">Google Gemini Flash (Gratuito, Rápido y Estable)</option>
                      <option value="openai">OpenAI ChatGPT (GPT-4o-mini)</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="text-xs text-[#FFC4A8] block mb-1.5 font-bold">API Key Personal (Opcional)</label>
                    <input 
                      type="password"
                      value={aiConfig.apiKey || ''}
                      onChange={e => setAiConfig({...aiConfig, apiKey: e.target.value})}
                      placeholder="Dejar vacío para usar la clave gratuita del servidor"
                      className="w-full bg-[#18200B] border border-[#465522] focus:border-[#FF6B00] text-[#FFD6E8] rounded-xl p-2.5 text-xs focus:outline-none font-mono"
                    />
                  </div>

                  <div className="p-3 bg-[#18200B] border border-[#465522] rounded-2xl text-[11px] text-[#A3B880] space-y-1.5">
                    <span className="font-bold text-[#10B981] flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse"></span>
                      Clave de Google Gemini Activa en el Servidor
                    </span>
                    <p>
                      El servidor ya cuenta con una <b>clave oficial de Google Gemini</b> configurada. No necesitas rellenar este campo a menos que quieras usar tu propia clave de <a href="https://aistudio.google.com" target="_blank" rel="noreferrer" className="text-[#FF6B00] underline font-bold">Google AI Studio</a> o tu cuenta de OpenAI.
                    </p>
                  </div>
                </div>

                <div className="flex gap-2.5">
                  <button onClick={saveAiConfig} className="flex-1 bg-gradient-to-r from-[#FF6B00] to-[#FF2E93] hover:from-[#ff8533] hover:to-[#ff48a1] text-white font-black py-2.5 rounded-xl transition-all text-xs shadow-lg shadow-pink-500/30 cursor-pointer">Guardar Configuración</button>
                  <button onClick={() => setShowSettings(false)} className="px-5 bg-[#18200B] hover:bg-[#2F3D18] text-[#FFD6E8] border border-[#465522] font-bold rounded-xl transition-colors text-xs cursor-pointer">Cerrar</button>
                </div>
              </div>
            </div>
          )}
        </div>
      );
    }
