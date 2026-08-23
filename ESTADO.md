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
  - Blindaje total contra caídas: inicialización resiliente de Supabase con `try...catch` y fallback para evitar excepciones de `RealtimeClient` al iniciar el contenedor en Railway.
- [`PRD_FASE_BETA_AMIGOS.md`](file:///c:/Users/alici/DEVELOPER/GUASAPAPP/PRD_FASE_BETA_AMIGOS.md) **[NUEVO]**:
  - Documento de Requisitos específico para el hito de validación: Despliegue PWA en la nube, onboarding de amigos (5-15 testers), aislamiento de sesiones y circuito de feedback.
- [`backend/.env`](file:///c:/Users/alici/DEVELOPER/GUASAPAPP/backend/.env):
  - Configuración del servidor completada con la API Key de Gemini y las credenciales del proyecto Supabase (protegido en `.gitignore` para evitar filtraciones en GitHub).
- [`Dockerfile`](file:///c:/Users/alici/DEVELOPER/GUASAPAPP/Dockerfile) y [`.dockerignore`](file:///c:/Users/alici/DEVELOPER/GUASAPAPP/.dockerignore) **[NUEVOS en raíz]**:
  - Archivos colocados directamente en la raíz del proyecto para que Railway detecte y compile el backend de forma automática sin necesidad de configurar carpetas manuales.
- [`netlify.toml`](file:///c:/Users/alici/DEVELOPER/GUASAPAPP/netlify.toml) y [`frontend/public/_redirects`](file:///c:/Users/alici/DEVELOPER/GUASAPAPP/frontend/public/_redirects) **[NUEVOS]**:
  - Configuración lista para despliegue en **Netlify** con soporte de enrutamiento SPA (evita errores 404 al recargar páginas).
- [`ESTADO.md`](file:///c:/Users/alici/DEVELOPER/GUASAPAPP/ESTADO.md):
  - Documentación del estado del motor de IA, despliegue y progreso global.

---

## 2. Estado Actual del Desarrollo
- **Backend en Producción (Railway):** Desplegado y funcionando en vivo con SSL en `https://guasapp-production.up.railway.app`. Servidor Express, WebSockets, Puppeteer y autenticación Supabase activos.
- **Frontend en Producción (Netlify PWA):** Desplegado con variables de entorno conectadas a Railway y Supabase, listo para ser instalado en dispositivos móviles (iOS/Android) como PWA.
- **Repositorio GitHub Sincronizado:** Todos los cambios, Dockerfile, netlify.toml y PWA subidos a `main` en https://github.com/aliciasalillas-cmd/GUASApp.git.
- **Motor de IA Satírico Avanzado:** 14 personalidades con Active Listening y reglas anti-repetición.

---

## 3. Próximos Pasos Lógicos
1. **Prueba de Humo en Móvil:** Abrir la URL pública de Netlify desde el teléfono móvil, añadir a pantalla de inicio (PWA), escanear el QR con WhatsApp y activar un bot para probar el flujo completo.
2. **Distribución a Amigos (Fase Beta):** Compartir la URL con el grupo de 5-15 amigos/testers para recopilar feedback de las personalidades más cómicas.
3. **Inicio de Fase 2 (App Nativa en Flutter):** Comenzar la arquitectura en Flutter cuando finalice la fase de pruebas PWA.
