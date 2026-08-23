import { useState } from 'react';
import { supabase } from '../lib/supabase';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);

  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin + '/dashboard'
      }
    });
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      setIsError(true);
      setMessage(error.message);
    }
    setLoading(false);
  };

  const handleEmailSignup = async () => {
    setLoading(true);
    setMessage('');
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });
    
    if (error) {
      setIsError(true);
      setMessage(error.message);
    } else {
      setIsError(false);
      setMessage('¡Revisa tu correo para verificar tu cuenta!');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#38461E] text-slate-100 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Elementos decorativos de fondo con iluminación ambiental Neón */}
      <div className="fixed top-[-10%] left-[-10%] w-[500px] h-[500px] bg-[#FF6B00]/15 rounded-full blur-[130px] pointer-events-none"></div>
      <div className="fixed bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-[#FF2E93]/15 rounded-full blur-[140px] pointer-events-none"></div>
      <div className="fixed top-[40%] right-[15%] w-[350px] h-[350px] bg-[#222B11]/50 rounded-full blur-[110px] pointer-events-none"></div>
      
      <div className="z-10 w-full max-w-md bg-[#222B11]/90 backdrop-blur-2xl border-2 border-[#465522] hover:border-[#FF6B00]/60 transition-colors rounded-3xl p-8 shadow-2xl shadow-black/60">
        <div className="text-center mb-8">
          <img 
            src="/logo.jpg?v=4" 
            alt="GUASA-APP Logo" 
            className="w-28 h-28 rounded-3xl mx-auto mb-4 object-cover shadow-2xl shadow-orange-500/50 border-3 border-[#FF5500] animate-playful-logo hover:scale-110 transition-transform" 
          />
          
          <div className="flex items-center justify-center gap-2 mb-1">
            <h1 className="text-3xl font-black tracking-wider drop-shadow-[0_2px_12px_rgba(255,85,0,0.4)]">
              <span className="text-[#FF5500]">GUASA</span><span className="text-[#FFE500]">-APP</span>
            </h1>
            <span className="text-2xl">😉</span>
          </div>
          
          <h2 className="text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#FF5500] to-[#FF2E93] mb-2 tracking-tight">
            Desata el Troleo Táctico en WhatsApp
          </h2>
          
          <p className="text-[#FFC4A8] text-xs leading-relaxed">
            <span className="text-[#FF5500] font-bold block mt-0.5">¡Dale GUASA-APP a tu WhatsApp! 😉</span>
          </p>
        </div>

        <form onSubmit={handleEmailLogin} className="space-y-4 mb-6">
          <div>
            <input
              type="email"
              placeholder="Tu correo electrónico"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#18200B] border border-[#465522] focus:border-[#FF6B00] rounded-2xl px-4 py-3 text-xs text-white placeholder-[#8B9D6E] focus:outline-none focus:ring-1 focus:ring-[#FF6B00]/40 transition-all shadow-inner"
              required
            />
          </div>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#18200B] border border-[#465522] focus:border-[#FF6B00] rounded-2xl px-4 py-3 text-xs text-white placeholder-[#8B9D6E] focus:outline-none focus:ring-1 focus:ring-[#FF6B00]/40 transition-all pr-12 shadow-inner"
              required
            />
            <button 
              type="button" 
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-[#FFC4A8] hover:text-[#FF2E93] focus:outline-none transition-colors"
            >
              {showPassword ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"></path></svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
              )}
            </button>
          </div>

          {message && (
            <div className={`text-xs p-3 rounded-xl ${isError ? 'bg-red-500/20 text-red-200 border border-red-500/40' : 'bg-[#FF6B00]/20 text-[#FFD6E8] border border-[#FF6B00]/40'}`}>
              {message}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button 
              type="submit"
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-[#FF6B00] via-[#FF5500] to-[#FF2E93] hover:from-[#ff8533] hover:to-[#ff48a1] text-white font-black py-3 px-4 rounded-2xl transition-all duration-200 shadow-lg shadow-pink-500/25 disabled:opacity-50 text-xs cursor-pointer active:scale-95"
            >
              Entrar
            </button>
            <button 
              type="button"
              onClick={handleEmailSignup}
              disabled={loading}
              className="flex-1 bg-[#18200B] hover:bg-[#2F3D18] text-[#FFD6E8] font-bold py-3 px-4 rounded-2xl border border-[#465522] hover:border-[#FF6B00] transition-all duration-200 disabled:opacity-50 text-xs cursor-pointer"
            >
              Registrarse
            </button>
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={handleGoogleLogin}
              className="w-full bg-[#18200B] hover:bg-[#2F3D18] border border-[#465522] text-[#FFD6E8] font-bold py-3 px-4 rounded-2xl flex items-center justify-center gap-2.5 transition-all text-xs shadow-sm hover:border-[#FF6B00]/50 cursor-pointer"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              Continuar con Google
            </button>
          </div>
        </form>

        <div className="mt-8 pt-6 border-t border-[#465522] text-center">
          <p className="text-[11px] text-[#A3B880]">
            *Al acceder aceptas que todo esto es por las risas.
          </p>
        </div>
      </div>
    </div>
  );
}
