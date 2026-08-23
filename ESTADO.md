# ESTADO DEL PROYECTO: GUASApp 🎭💎

*Última actualización: 2026-08-23*

---

## 1. Archivos Modificados / Creados
- [`backend/ai.js`](file:///c:/Users/alici/DEVELOPER/GUASAPAPP/backend/ai.js):
  - **Refactorización Integral de Prompts:** Renovadas las 14 personalidades predefinidas con la arquitectura de 4 pilares:
    1. *Rol y Visión del Mundo (Sesgos Cognitivos)*.
    2. *Estilo y Tono de WhatsApp*.
    3. *Estrategia ante el Enfado / Pique*.
    4. *Temas Obsesivos / Desvíos situacionales*.
    5. *Regla Anti-Caricatura (70/30 de naturalidad e ironía)*.
    6. *Few-Shot Prompting* con ejemplos de conversación realistas para cada personalidad.
  - **Active Listening:** Instrucciones avanzadas para engancharse y retorcer las palabras literales del interlocutor en lugar de soltar muletillas genéricas.
  - **Compatibilidad Extensible:** Función `formatPersonaInstruction` para estructurar tanto personalidades fijas como personalizadas creadas por el usuario.
- [`frontend/src/pages/Dashboard.tsx`](file:///c:/Users/alici/DEVELOPER/GUASAPAPP/frontend/src/pages/Dashboard.tsx):
  - **Experiencia Móvil Táctica:** Implementado el alternador de vista táctil (en pantallas móviles, al pulsar un chat se muestra el monitor/panel y se añade el botón de navegación «← Volver a chats» estilo WhatsApp).
  - **Robustez de Red:** Configurada la variable dinámica `BACKEND_URL` con soporte para `VITE_BACKEND_URL` y detección de protocolo HTTPS/HTTP para despliegues públicos en Vercel.
- [`frontend/src/lib/supabase.ts`](file:///c:/Users/alici/DEVELOPER/GUASAPAPP/frontend/src/lib/supabase.ts) y [`backend/supabase.js`](file:///c:/Users/alici/DEVELOPER/GUASAPAPP/backend/supabase.js):
  - Blindaje contra caídas: inicialización resiliente de Supabase con advertencias en consola en lugar de excepciones fatales.
- [`PRD_FASE_BETA_AMIGOS.md`](file:///c:/Users/alici/DEVELOPER/GUASAPAPP/PRD_FASE_BETA_AMIGOS.md) **[NUEVO]**:
  - Documento de Requisitos específico para el hito de validación: Despliegue PWA en la nube, onboarding de amigos (5-15 testers), aislamiento de sesiones y circuito de feedback.
- [`backend/.env`](file:///c:/Users/alici/DEVELOPER/GUASAPAPP/backend/.env):
  - Configuración del servidor completada con la API Key de Gemini y las credenciales del proyecto Supabase (protegido en `.gitignore` para evitar filtraciones en GitHub).
- [`netlify.toml`](file:///c:/Users/alici/DEVELOPER/GUASAPAPP/netlify.toml) y [`frontend/public/_redirects`](file:///c:/Users/alici/DEVELOPER/GUASAPAPP/frontend/public/_redirects) **[NUEVOS]**:
  - Configuración lista para despliegue en **Netlify** con soporte de enrutamiento SPA (evita errores 404 al recargar páginas).
- [`ESTADO.md`](file:///c:/Users/alici/DEVELOPER/GUASAPAPP/ESTADO.md):
  - Documentación del estado del motor de IA, despliegue y progreso global.

---

## 2. Estado Actual del Desarrollo
- **Frontend PWA & Mobile-First Verificado:** Compilación con `npm run build` completada con **0 errores**, PWA service worker y manifest activos. Interfaz adaptada fluidamente a pantallas de 375px-430px.
- **Backend Dockerizado:** Listo para despliegue en la nube (Railway/Render) con soporte Chromium headless.
- **Motor de IA Satírico Avanzado:** 14 personalidades con Active Listening y reglas anti-repetición.

---

## 3. Próximos Pasos Lógicos
1. **Despliegue en la Nube:**
   - Subir el backend Dockerizado a Railway o Render (conectando variables `GEMINI_API_KEY`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`).
   - Desplegar el frontend en Vercel apuntando `VITE_BACKEND_URL` al dominio de Railway.
2. **Prueba de Humo en Móvil:** Instalar la PWA en el teléfono propio, vincular WhatsApp y verificar la respuesta del bot.
3. **Distribución a Amigos:** Compartir el enlace con el grupo de testers.
