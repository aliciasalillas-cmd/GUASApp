# ESTADO DEL PROYECTO: GUASApp 🎭💎

*Última actualización: 2026-08-23*

---

## 1. Archivos Modificados / Creados
- [`PRD.md`](file:///c:/Users/alici/DEVELOPER/GUASAPAPP/PRD.md) **[NUEVO]**:
  - Documento de Requisitos del Producto.
  - Recoge toda la visión, objetivos, público, funcionalidades core y flujos de usuario, abarcando desde la concepción web hasta la visión de la aplicación móvil.
- [`PLAN.md`](file:///c:/Users/alici/DEVELOPER/GUASAPAPP/PLAN.md) **[NUEVO]**:
  - Plan de Proyecto y Arquitectura.
  - Define la arquitectura técnica sugerida (Flutter/React Native, Docker, VPS, Supabase) y las 5 fases de desarrollo para migrar a una app móvil.
- [`frontend/src/pages/Dashboard.tsx`](file:///c:/Users/alici/DEVELOPER/GUASAPAPP/frontend/src/pages/Dashboard.tsx):
  - Eliminación completa de selectores, estados y formularios de ElevenLabs / Clonado de Voz.
  - Simplificación del modal de Configuración del Motor IA (centrado en Google Gemini y OpenAI).
  - Eliminación de selectores de audio para garantizar un flujo 100% gratuito, fluido y sin errores 402.
- [`backend/index.js`](file:///c:/Users/alici/DEVELOPER/GUASAPAPP/backend/index.js):
  - Retirada de endpoints `/api/elevenlabs-voices` y `/api/test-voice`.
  - Simplificación de `/api/config` y envío directo y fiable de respuestas en texto mediante WhatsApp Web.
  - Mantenimiento del transcriptor inteligente de notas de voz entrantes mediante Google Gemini.
- [`ESTADO.md`](file:///c:/Users/alici/DEVELOPER/GUASAPAPP/ESTADO.md):
  - Actualización del estado funcional y próximos pasos con la estrategia híbrida (PWA + Flutter).
- Modificaciones en `PLAN.md` y `PRD.md` para reflejar la estrategia de dos vías (Web a PWA primero, app nativa después).

---

## 2. Estado Actual del Desarrollo
- **Fase Actual:** Decidida la **estrategia de dos vías** para dispositivos móviles.
- **Documentación Base:** `PRD.md` y `PLAN.md` actualizados para reflejar que a corto plazo convertiremos la web actual en PWA, y a medio plazo se desarrollará la app nativa en Flutter.
- **Operatividad Web:** 100% funcional, limpio de dependencias de pago innecesarias (ElevenLabs removido).
- **Motor de Inteligencia Artificial:**
  - 14 personalidades satíricas predefinidas + Creador de personajes custom.
  - Memoria contextual ampliada a **20 iteraciones**.
  - Soporte para **Google Gemini Flash** (gratuito) y OpenAI ChatGPT.
- **WhatsApp Web Bridge:**
  - Conexión mediante WebSockets y código QR.
  - Transcripción automática de audios entrantes con Gemini.

---

## 3. Próximos Pasos Lógicos
1. **Conversión a PWA (Fase 1 Corto Plazo):** Añadir `manifest.json` y el Service Worker a la web actual (`frontend`) usando Vite PWA. Ajustar el diseño CSS para que responda a pantallas móviles como una app completa.
2. **Dockerización del Backend:** Preparar el `Dockerfile` en el directorio `backend` para contenedorizar Node + Puppeteer y facilitar su despliegue en un VPS.
3. **Inicio de App Nativa (Fase 2 Medio Plazo):** Comenzar la configuración del proyecto Flutter para el cliente final premium.
