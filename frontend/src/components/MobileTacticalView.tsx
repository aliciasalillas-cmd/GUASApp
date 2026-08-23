import { useState, useRef } from 'react';
import confetti from 'canvas-confetti';

interface MobileTacticalViewProps {
  onClose?: () => void;
  selectedContact?: any;
  onLaunchBot?: (persona: string) => void;
}

export default function MobileTacticalView({ onClose, selectedContact, onLaunchBot }: MobileTacticalViewProps) {
  const [victimCount, setVictimCount] = useState(1482);
  const [gaugeLevel, setGaugeLevel] = useState(98.4);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'bromas' | 'radar' | 'rango'>('bromas');
  
  const excusas = [
    '"Mi perro hackeó el satélite del Pentágono y se comió las coordenadas de la reunión."',
    '"Se declaró toque de queda en mi cama por orden directa del Coronel Somnolencia."',
    '"Fui interceptado por un escuadrón de cuñados con diapositivas sobre criptomonedas."',
    '"Misión fallida: mi abuela me obligó a comer tres raciones de croquetas tácticas."',
    '"El radar detectó una tormenta de pereza de categoría 5 sobre mi código postal."',
    '"Mi gato asumió el mando supremo del hogar e impuso la ley marcial en el sofá."'
  ];
  const [excuseIdx, setExcuseIdx] = useState(0);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const toastTimerRef = useRef<any>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  };

  const getAudioContext = () => {
    if (!audioCtxRef.current) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      audioCtxRef.current = new AudioCtx();
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  };

  const playSound = (type: 'fart' | 'airhorn' | 'laser' | 'boing') => {
    try {
      const ctx = getAudioContext();
      const now = ctx.currentTime;

      if (type === 'fart') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(110, now);
        osc.frequency.linearRampToValueAtTime(55, now + 0.25);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.3);
        showToast("💨 ¡Pedo táctico silencioso pero letal!");
      } else if (type === 'airhorn') {
        [311.13, 466.16, 622.25].forEach(freq => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(freq, now);
          gain.gain.setValueAtTime(0.15, now);
          gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 0.35);
        });
        showToast("🎺 ¡Bocinazo destructor de siestas!");
      } else if (type === 'laser') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1200, now);
        osc.frequency.exponentialRampToValueAtTime(120, now + 0.2);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.2);
        showToast("🔫 ¡Rayo troleador activado!");
      } else if (type === 'boing') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.exponentialRampToValueAtTime(650, now + 0.15);
        osc.frequency.exponentialRampToValueAtTime(220, now + 0.35);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.35);
        showToast("🎪 ¡Boing cómico disparado!");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const launchGuasaAtomica = () => {
    setVictimCount(prev => prev + Math.floor(Math.random() * 6) + 1);
    setGaugeLevel(prev => Math.min(100, +(prev + 0.2).toFixed(1)));
    playSound('airhorn');

    try {
      confetti({
        particleCount: 90,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#FF6B00', '#FF2E93', '#FF8833', '#FF60AE', '#10B981']
      });
    } catch (e) {}

    const alertas = [
      "💣 ¡MISIL DE MEMES LANZADO AL GRUPO DE LA FAMILIA!",
      "🚨 ¡ALERTA! Cuñado neutralizado con sticker demoledor.",
      "🔥 ¡NIVEL DE GUASA EN MÁXIMO HISTÓRICO!",
      "📡 ¡AUDIO ENVIADO AL GRUPO DE VECINOS!",
      "🎯 ¡IMPACTO CONFIRMADO! Víctima riéndose en el metro."
    ];
    showToast(alertas[Math.floor(Math.random() * alertas.length)]);

    if (onLaunchBot && selectedContact) {
      onLaunchBot('cachondo');
    }
  };

  const nextExcuse = () => {
    playSound('boing');
    setExcuseIdx(prev => (prev + 1) % excusas.length);
  };

  const copyExcuse = () => {
    navigator.clipboard.writeText(excusas[excuseIdx]);
    showToast("📋 ¡Excusa táctica copiada al portapapeles!");
  };

  return (
    <div className="w-full flex items-center justify-center p-0 sm:p-4 select-none">
      {/* Contenedor móvil táctico: Fondo Verde Clarito (#4E612B), Cajas Verde Militar (#222B11), Naranja (#FF6B00) y Rosa (#FF2E93) */}
      <main className="w-full max-w-[430px] min-h-screen sm:min-h-[880px] bg-[#4E612B] sm:rounded-[38px] shadow-[0_25px_60px_rgba(0,0,0,0.85)] overflow-hidden flex flex-col justify-between border-0 sm:border-4 border-[#688039] relative text-slate-100">

        {/* Notificación Toast dinámica */}
        {toastMessage && (
          <div className="absolute top-20 left-4 right-4 z-50 bg-[#1C240E] text-[#FF6B00] border-2 border-[#FF6B00] px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-bounce">
            <span className="text-xl">💣</span>
            <p className="text-xs font-bold text-[#FFD6E8] flex-1 leading-snug">{toastMessage}</p>
          </div>
        )}

        {/* 1. HEADER */}
        <header className="pt-5 px-4 pb-3 bg-[#263013] border-b-2 border-[#465522] flex items-center justify-between shadow-md z-20">
          <div className="flex items-center gap-2.5">
            <img 
              src="/logo.jpg?v=4" 
              alt="GUASAPAPP Logo" 
              className="w-12 h-12 rounded-2xl object-cover border-2 border-[#FF6B00] shadow-lg shrink-0" 
            />

            <div>
              <h1 className="text-2xl font-black tracking-wider flex items-center leading-none drop-shadow-md">
                <span className="text-[#FF6B00]">GUASA</span><span className="text-[#FFE600]">-APP</span>
              </h1>
              <div className="mt-1">
                <span className="text-[9px] font-black uppercase tracking-wider bg-gradient-to-r from-[#FF6B00] to-[#FF2E93] text-white px-2.5 py-0.5 rounded-full shadow-sm">
                  ★ CORONEL RISITAS ★
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onClose && (
              <button 
                onClick={onClose} 
                className="px-3 py-1.5 rounded-xl bg-[#222B11] border border-[#FF6B00]/40 text-[#FFD6E8] text-xs font-bold hover:bg-[#FF6B00] hover:text-[#1C240E] transition-all cursor-pointer"
              >
                Cerrar ✕
              </button>
            )}
          </div>
        </header>

        {/* 2. CONTENIDO PRINCIPAL */}
        <div className="p-4 space-y-4 flex-1 overflow-y-auto pb-28">

          {/* HERO SECTION: Tarjeta Verde Militar con Acentos Naranja y Rosa */}
          <section className="bg-gradient-to-br from-[#263013] to-[#1C240E] border-2 border-[#FF6B00] rounded-3xl p-5 shadow-2xl relative overflow-hidden">
            <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-[#FF2E93]/20 rounded-full blur-2xl pointer-events-none"></div>

            <div className="flex items-center justify-between mb-2 relative z-10">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-[#FF6B00] text-[#1C240E] tracking-wider uppercase shadow-md">
                ⚡ NIVEL DE GUASA
              </span>
              <span className="text-xs font-bold text-[#FF60AE] flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#FF2E93] animate-ping"></span> RADAR ACTIVO
              </span>
            </div>

            <div className="my-3 flex items-end justify-between relative z-10">
              <div>
                <div className="text-5xl font-black text-[#FFD6E8] tracking-tight drop-shadow-lg flex items-baseline gap-1">
                  {victimCount.toLocaleString()}
                  <span className="text-base text-[#FF6B00] font-normal">pts</span>
                </div>
                <p className="text-xs text-[#FFC4A8] font-semibold mt-0.5">
                  Víctimas Trolleadas en Combate
                </p>
              </div>

              <div className="text-right">
                <div className="text-3xl font-black text-[#FF2E93] drop-shadow">
                  {gaugeLevel}%
                </div>
                <p className="text-[10px] text-[#FF6B00] font-bold uppercase tracking-wider">
                  Carga Atómica
                </p>
              </div>
            </div>

            {/* Barra de Progreso Naranja a Rosa */}
            <div className="w-full bg-[#141A09] rounded-full h-3.5 p-0.5 border border-[#465522] shadow-inner relative z-10">
              <div 
                className="bg-gradient-to-r from-[#FF6B00] via-[#FF5500] to-[#FF2E93] h-full rounded-full transition-all duration-300 shadow-md"
                style={{ width: `${gaugeLevel}%` }}
              ></div>
            </div>

            <div className="flex items-center justify-between text-[10px] font-semibold text-[#E2C7D4] mt-2 relative z-10">
              <span className="text-[#FF8833]">Defcon 5 (Risitas)</span>
              <span className="text-[#FF2E93] font-bold">Defcon 1 (Troleo Máximo)</span>
            </div>
          </section>

          {/* 3. BOTÓN PRINCIPAL (CTA GIGANTE NEÓN ROSA / NARANJA) */}
          <div className="py-1">
            <button 
              onClick={launchGuasaAtomica} 
              className="w-full py-5 px-6 rounded-3xl bg-gradient-to-r from-[#FF2E93] via-[#FF6B00] to-[#FF2E93] hover:from-[#ff48a1] hover:to-[#ff8533] active:scale-95 text-white font-black text-xl tracking-wider shadow-[0_12px_30px_rgba(255,46,147,0.6)] border-3 border-[#FF6B00] flex items-center justify-center gap-3 cursor-pointer transition-all duration-150 animate-pulse"
            >
              <span className="text-2xl animate-bounce">💣</span>
              <span className="text-2xl uppercase tracking-wider drop-shadow-md text-white font-black">
                ¡LANZAR GUASA ATÓMICA!
              </span>
              <span className="text-2xl">✨</span>
            </button>
          </div>

          {/* 4. TARJETAS SECUNDARIAS (FONDO VERDE MILITAR #222B11) */}
          <div className="space-y-3.5">
            
            {/* Tarjeta 1: Excusa Militar Clasificada */}
            <article className="bg-[#222B11] border border-[#465522] rounded-3xl p-4 shadow-xl hover:border-[#FF6B00] transition-colors relative overflow-hidden">
              <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-2xl bg-[#1C240E] text-[#FF6B00] flex items-center justify-center border border-[#465522] shadow-inner text-lg">
                    🛡️
                  </div>
                  <div>
                    <h2 className="font-bold text-[#FFD6E8] text-sm">Excusa Militar Clasificada</h2>
                    <p className="text-[10px] text-[#FFC4A8]">Para librarte de cualquier plan</p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button onClick={copyExcuse} className="p-2 rounded-xl bg-[#1C240E] hover:bg-[#2F3D18] text-[#FF6B00] text-xs font-bold transition-all border border-[#465522] cursor-pointer" title="Copiar">
                    📋
                  </button>
                  <button onClick={nextExcuse} className="px-3 py-1.5 rounded-xl bg-[#FF6B00] hover:bg-[#FF8833] text-[#1C240E] text-xs font-extrabold transition-all shadow flex items-center gap-1 cursor-pointer">
                    🔀 <span>Otra</span>
                  </button>
                </div>
              </div>

              <p className="text-xs text-[#FFE5D9] italic bg-[#1C240E]/90 p-3 rounded-2xl border border-[#3A481B] leading-relaxed shadow-inner">
                {excusas[excuseIdx]}
              </p>
            </article>

            {/* Tarjeta 2: Bomba de Audios Inconfesables */}
            <article className="bg-[#222B11] border border-[#465522] rounded-3xl p-4 shadow-xl">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-2xl bg-[#1C240E] text-[#FF2E93] flex items-center justify-center border border-[#465522] shadow-inner text-lg">
                    🔊
                  </div>
                  <div>
                    <h2 className="font-bold text-[#FFD6E8] text-sm">Bomba de Audios Inconfesables</h2>
                    <p className="text-[10px] text-[#FFC4A8]">Detonadores de risas instantáneas</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold bg-[#FF2E93]/20 text-[#FF60AE] px-2 py-0.5 rounded-full border border-[#FF2E93]/40">
                  AUDIO FX
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => playSound('fart')} className="bg-[#1C240E] hover:bg-[#FF6B00] hover:text-[#1C240E] text-[#FFD6E8] p-2.5 rounded-2xl text-xs font-bold border border-[#3A481B] transition-all flex flex-col items-start gap-0.5 group active:scale-95 cursor-pointer">
                  <span className="font-bold text-[#FFD6E8] group-hover:text-[#1C240E]">💨 Pedo Táctico</span>
                  <span className="text-[10px] text-[#FFC4A8] group-hover:text-[#1C240E]">Silencioso y letal</span>
                </button>
                <button onClick={() => playSound('airhorn')} className="bg-[#1C240E] hover:bg-[#FF2E93] hover:text-white text-[#FFD6E8] p-2.5 rounded-2xl text-xs font-bold border border-[#3A481B] transition-all flex flex-col items-start gap-0.5 group active:scale-95 cursor-pointer">
                  <span className="font-bold text-[#FFD6E8] group-hover:text-white">🎺 Bocinazo Épico</span>
                  <span className="text-[10px] text-[#FFC4A8] group-hover:text-white">Despierta vecinos</span>
                </button>
                <button onClick={() => playSound('laser')} className="bg-[#1C240E] hover:bg-[#FF6B00] hover:text-[#1C240E] text-[#FFD6E8] p-2.5 rounded-2xl text-xs font-bold border border-[#3A481B] transition-all flex flex-col items-start gap-0.5 group active:scale-95 cursor-pointer">
                  <span className="font-bold text-[#FFD6E8] group-hover:text-[#1C240E]">🔫 Láser Risas</span>
                  <span className="text-[10px] text-[#FFC4A8] group-hover:text-[#1C240E]">Desintegra seriedad</span>
                </button>
                <button onClick={() => playSound('boing')} className="bg-[#1C240E] hover:bg-[#FF2E93] hover:text-white text-[#FFD6E8] p-2.5 rounded-2xl text-xs font-bold border border-[#3A481B] transition-all flex flex-col items-start gap-0.5 group active:scale-95 cursor-pointer">
                  <span className="font-bold text-[#FFD6E8] group-hover:text-white">🎪 Boing Dibujos</span>
                  <span className="text-[10px] text-[#FFC4A8] group-hover:text-white">Carcajada pura</span>
                </button>
              </div>
            </article>

            {/* Tarjeta 3: Radar de Cuñados */}
            <article className="bg-[#222B11] border border-[#465522] rounded-3xl p-4 shadow-xl flex items-center justify-between hover:border-[#FF2E93] transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#1C240E] flex items-center justify-center text-[#FF2E93] border border-[#3A481B] relative shadow-inner text-lg">
                  📡
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[#FF2E93] animate-ping"></span>
                </div>
                <div>
                  <h2 className="font-bold text-[#FFD6E8] text-sm">Radar de Cuñados Táctico</h2>
                  <p className="text-xs text-[#FFC4A8]">3 detectados explicando freidoras de aire</p>
                </div>
              </div>
              <span className="text-[10px] font-black text-[#FF6B00] bg-[#1C240E] px-2.5 py-1 rounded-full border border-[#465522] shadow-sm">
                PELIGRO ⚠️
              </span>
            </article>

          </div>
        </div>

        {/* 5. BOTTOM BAR FLOTANTE (NARANJA Y ROSA) */}
        <nav className="absolute bottom-3 left-4 right-4 bg-[#1C240E]/95 backdrop-blur-lg border-2 border-[#FF6B00] rounded-3xl p-1.5 flex items-center justify-around shadow-[0_10px_25px_rgba(0,0,0,0.6)] z-30">
          <button 
            onClick={() => { setActiveTab('bromas'); showToast("💣 Modo bromas tácticas listo."); }}
            className={`flex flex-col items-center py-1.5 px-5 rounded-2xl font-black transition-all cursor-pointer ${activeTab === 'bromas' ? 'bg-gradient-to-r from-[#FF6B00] to-[#FF2E93] text-white shadow-md scale-105' : 'text-[#FFC4A8] hover:text-[#FF2E93]'}`}
          >
            <span className="text-lg">💣</span>
            <span className="text-[10px] uppercase font-bold tracking-tight mt-0.5">Bromas</span>
          </button>

          <button 
            onClick={() => { setActiveTab('radar'); showToast("📡 Radar activado: 4 cuñados y 1 jefe en tu zona."); }}
            className={`flex flex-col items-center py-1.5 px-5 rounded-2xl font-black transition-all cursor-pointer ${activeTab === 'radar' ? 'bg-gradient-to-r from-[#FF6B00] to-[#FF2E93] text-white shadow-md scale-105' : 'text-[#FFC4A8] hover:text-[#FF2E93]'}`}
          >
            <span className="text-lg">📡</span>
            <span className="text-[10px] uppercase font-bold tracking-tight mt-0.5">Radar</span>
          </button>

          <button 
            onClick={() => { setActiveTab('rango'); showToast("🏆 Rango: General Supremo de la Guasa (#1 Mundial)."); }}
            className={`flex flex-col items-center py-1.5 px-5 rounded-2xl font-black transition-all cursor-pointer ${activeTab === 'rango' ? 'bg-gradient-to-r from-[#FF6B00] to-[#FF2E93] text-white shadow-md scale-105' : 'text-[#FFC4A8] hover:text-[#FF6B00]'}`}
          >
            <span className="text-lg">🏆</span>
            <span className="text-[10px] uppercase font-bold tracking-tight mt-0.5">Rango</span>
          </button>
        </nav>

      </main>
    </div>
  );
}
