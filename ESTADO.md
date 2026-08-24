# ESTADO DEL PROYECTO: GUASApp 🎭💎

*Última actualización: 2026-08-24*

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
- [`backend/index.js`](file:///c:/Users/alici/DEVELOPER/GUASAPAPP/backend/index.js):
  - **Extracción Resiliente con Fallback Directo:** Integrada consulta directa a `window.Store.Chat` y `window.Store.Contact` vía Puppeteer cuando los métodos nativos de `whatsapp-web.js` se retrasan en sincronizar.
  - **Nuevo Endpoint Manual (`POST /api/contacts/manual`):** Permite añadir amigos directamente por su número de teléfono (+34...) y guardarlos en Supabase sin esperar la descarga histórica.
  - **Blindaje contra Excepciones 500:** Todas las llamadas a `client.getContacts()` y `refreshContactMaps()` envueltas en `try...catch` con estructuras de fallback.
- [`frontend/src/pages/Dashboard.tsx`](file:///c:/Users/alici/DEVELOPER/GUASAPAPP/frontend/src/pages/Dashboard.tsx):
  - **Añadir Amigos por Número Directo:** Botón `➕ Nuevo` en la cabecera y en la tarjeta de bienvenida para poder empezar a trolear de inmediato con cualquier número.
  - **Auto-Reintento Inteligente de Sincronización:** Si los contactos tardan unos segundos en descargarse tras escanear el QR, el frontend reintenta automáticamente cada 3 segundos hasta cargarlos.
  - **Robustez de Red Total:** Variable `BACKEND_URL` conectada en directo a `https://guasapp-production.up.railway.app`.
- [`frontend/vite.config.ts`](file:///c:/Users/alici/DEVELOPER/GUASAPAPP/frontend/vite.config.ts):
  - Configurado `workbox: { clientsClaim: true, skipWaiting: true }` para invalidación y actualización instantánea de la PWA en teléfonos móviles.

---

## 2. Estado Actual del Desarrollo
- **Frontend en Producción (Netlify PWA):** Desplegado y funcionando en vivo con SSL en **`https://guasa-pp.netlify.app`**. PWA instalable en iOS y Android con actualización automática.
- **Backend en Producción (Railway):** Desplegado y funcionando en vivo con SSL en `https://guasapp-production.up.railway.app`. Servidor Express, WebSockets, Puppeteer y autenticación Supabase activos.
- **Repositorio GitHub Sincronizado:** Todos los cambios y mejoras subidos a `main` en https://github.com/aliciasalillas-cmd/GUASApp.git.
- **Motor de IA Satírico Avanzado:** 14 personalidades con Active Listening y reglas anti-repetición.

---

## 3. Próximos Pasos Lógicos
1. **Verificación tras Cena:** Abrir `https://guasa-pp.netlify.app` en móvil u ordenador, verificar la carga automática de la lista de chats sincronizada con Railway y activar el primer bot de prueba.
2. **Distribución a Amigos (Fase Beta):** Compartir el enlace con el grupo de 5-15 testers para recopilar feedback de las personalidades más cómicas.
3. **Inicio de Fase 2 (App Nativa en Flutter):** Comenzar la arquitectura en Flutter cuando finalice la fase de validación con amigos.
