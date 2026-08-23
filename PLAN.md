# Project Plan & Architecture: GUASApp Mobile Migration 📱

*Versión 1.1 - Estrategia Híbrida (PWA + Flutter)*

## 1. Arquitectura Técnica (Estrategia de 2 Vías)

Para llevar la aplicación al móvil de forma ágil y segura, adoptaremos una **estrategia de dos fases para el Frontend**, manteniendo siempre el mismo Backend centralizado.

### 1.1. Frontend Vía 1: Corto Plazo (PWA - Progressive Web App)
- **Tecnología:** React 19 + Vite + `vite-plugin-pwa`.
- **Objetivo:** Convertir la web actual en una app instalable inmediatamente sin pasar por tiendas.
- **Ventajas:** Despliegue instantáneo, sin comisiones, mismo código base.
- **Limitaciones:** Sin vibración nativa profunda en iOS, compartición en redes sociales dependiente del navegador, TTS mediante Web Speech API (calidad variable).

### 1.2. Frontend Vía 2: Medio Plazo (App Nativa)
- **Tecnología:** **Flutter** (Dart).
- **Objetivo:** Experiencia premium, fluida (60/120fps) y con acceso total al hardware.
- **Librerías Clave:**
  - `flutter_tts`: Uso del motor de voz nativo (Siri/Google TTS) de altísima calidad y 100% gratuito.
  - `share_plus`: Compartir capturas virales nativamente a Instagram Stories y TikTok.
  - `vibration`: Feedback háptico real para el Botón de Pánico.

### 1.3. Backend (El Motor de WhatsApp)
- **Tecnología:** Node.js, Express, Socket.io, `whatsapp-web.js`.
- **Inteligencia Artificial:** Google Gemini API (texto y transcripción de audio).
- **Hosting / Infraestructura:** 
  - Al depender de `whatsapp-web.js` (Chromium bajo Puppeteer), el backend **debe estar dockerizado** y alojado en un VPS (Servidor Privado Virtual) como Railway o DigitalOcean.

### 1.4. Base de Datos & Autenticación
- **Tecnología:** Supabase (PostgreSQL + RLS + Supabase Auth).
- **Rol:** Centralizar usuarios, perfiles y estados. Ambos frontends (PWA y Flutter) consumirán la misma base de datos.

---

## 2. Fases de Desarrollo (Roadmap)

### Fase 1: Preparación de Infraestructura y Backend en la Nube
El objetivo de esta fase es sacar el backend del entorno local (`localhost`) y hacerlo accesible para cualquier dispositivo móvil.
1. **Dockerización:** Crear un `Dockerfile` optimizado que incluya Node.js y las dependencias del sistema necesarias para ejecutar Chromium/Puppeteer de forma headless.
2. **Despliegue de Backend:** Subir la imagen Docker a un proveedor VPS (ej. Railway).
3. **Refactorización de Sockets:** Asegurar que los WebSockets puedan escalar y manejar reconexiones si el móvil pierde cobertura.
4. **Configurar Supabase:** Ajustar políticas de RLS (Row Level Security) para asegurar que un usuario solo pueda controlar sus propias sesiones de WhatsApp.

### Fase 2: Fundación del Frontend Móvil (Semanas 1-2)
1. **Inicializar Proyecto:** Crear el proyecto en Flutter o React Native.
2. **Autenticación UI:** Pantallas de Login y Registro conectadas a Supabase Auth.
3. **Escáner de Conexión:** Pantalla que recibe el evento Socket con el QR desde el VPS y lo renderiza en pantalla para que el usuario vincule su WhatsApp.
4. **Navegación Base:** Implementar la barra de navegación inferior (Dashboard, Logs, Ajustes).

### Fase 3: Funcionalidades Core (Semanas 3-4)
1. **Dashboard de Contactos:** Obtener y renderizar la lista de chats activos desde el backend.
2. **Selector de Bots:** Interfaz táctil para asignar personalidades a los contactos.
3. **Creador Custom:** Formulario para introducir nombre, emoji y reglas del bot personalizado.
4. **Botón de Pánico:** Implementar el botón flotante global. Al pulsarlo, emite evento socket, deshabilita visualmente los bots e invoca la API de vibración (Haptics) del teléfono.

### Fase 4: Integración de Features Nativas Móviles (Semanas 5-6)
1. **TTS Nativo (Text-to-Speech):** Implementar lógica para que cuando el backend avise de que un bot ha respondido, el dispositivo lea la respuesta usando la API nativa de Android/iOS (sin consumo de API de pago).
2. **Motor de Capturas Virales:** Crear un widget/componente que formatee la conversación bonita, le ponga la marca de agua de GUASApp, convierta esa vista a imagen (Canvas/Bitmap) y abra el diálogo nativo de compartir para Instagram/TikTok.

### Fase 5: Monetización y Lanzamiento (Semanas 7-8)
1. **Compras In-App:** Integrar RevenueCat o el sistema nativo (Stripe) para gestionar las suscripciones de la capa PRO.
2. **Testing:** Pruebas beta cerradas con usuarios reales en TestFlight (iOS) y Google Play Console.
3. **Publicación:** Preparar capturas de pantalla de la tienda, textos de marketing y enviar a revisión a Apple y Google.
