# Resumen Técnico: GUASApp 🎭💎

## 🎯 ¿Qué hace la aplicación?
**GUASApp** ("Troleo Inteligente") es un gestor de bots para WhatsApp impulsado por Inteligencia Artificial y diseñado con interfaz de alta gama en modo oscuro / glassmorphism. Su función principal es interceptar mensajes de contactos o grupos seleccionados y responder automáticamente interpretando una de las **14 personalidades satíricas** oficiales o personajes creados a medida por el usuario.

El panel de control incluye:
- Lista de contactos y grupos de WhatsApp ordenados por interacción reciente.
- Asignación individual de personalidades (Bots) con persistencia en Supabase.
- **🚨 Botón de Pánico y comando `!stop`** para desactivar el bot inmediatamente.
- **🎨 Creador de Personalidades Personalizadas** (nombre, emoji y prompt a medida).
- **📸 Exportador de Capturas Virales** para TikTok / Instagram / X con marca de agua oficial.
- **💎 Distintivo ⭐ PRO** y diseño visual de vanguardia con iluminación ambiental.
- Monitor de chat en vivo con burbujas de WhatsApp estilizadas.
- **🧠 Memoria Conversacional Profunda**: Contexto ampliado a **20 iteraciones** (últimos 20 mensajes) para mantener el hilo argumental y réplicas ultra-coherentes tanto en chats individuales como en dinámicas grupales.

---

## 🛠️ Stack Tecnológico Utilizado
- **Frontend:** React 19 + TypeScript + Vite + Tailwind CSS + `html2canvas` + `react-qr-code`.
- **Backend:** Node.js + Express.js + Socket.io + `whatsapp-web.js` + `@google/genai` (Gemini 2.5 Flash / 2.0 Flash / 1.5 Pro / OpenAI GPT-4o-mini).
- **Base de Datos & Auth:** Supabase (PostgreSQL + RLS + JWT).

---

## 📍 Punto exacto del desarrollo
Actualmente, el proyecto está **100% operativo, con diseño visual premium completado y listo para pruebas y despliegue web**:

**Funcionalidades completadas y verificadas:**
- ✅ **Memoria Conversacional Ampliada**: Historial de hasta **20 iteraciones** contextuales en `ai.js` para respuestas coherentes sin perder el hilo de la conversación.
- ✅ Suite de Monetización: Botón de Pánico, Capturas Virales, Creador de Personajes, Modo PRO.
- ✅ Rediseño estético integral con glassmorphism, luces ambientales y burbujas de chat modernas.
- ✅ Autenticación de usuarios en frontend (Supabase Auth).
- ✅ Vinculación de WhatsApp mediante WebSockets y QR en tiempo real.
- ✅ Silencio inicial al escribir tú primero a un contacto (espera a que la otra persona responda para iniciar el bot).
- ✅ Conexión multi-proveedor con fallback inteligente (Google Gemini & OpenAI).
- ✅ Filtros anti-monotonía y reglas avanzadas de personificación en el prompt del sistema.

---

## 📋 Registro de Estado y Próximos Pasos (Regla Global de Documentación)

### 1. Archivos Modificados / Creados Recientemente
- `backend/ai.js`: Ampliación de la memoria conversacional de 6 a **20 iteraciones** (`history.slice(-20)`) y optimización del prompt con reglas anti-monotonía y contexto multi-rol.
- `README.md`: Actualización integral de especificaciones técnicas, memoria de 20 mensajes y estado operativo.
- `ESTADO.md`: Documento de sincronización y estado del proyecto.

### 2. Estado Actual del Desarrollo
- **Backend:** Conexión estable con WhatsApp Web, soporte para Gemini y OpenAI, gestión de estado por contacto/grupo, memoria de 20 mensajes activa.
- **Frontend:** UI reactiva con modo oscuro, generador de capturas virales, sincronización de estados y monitor de logs/mensajes en vivo.
- **Verificación:** Pruebas de integración de flujo conversacional y persistencia completadas con éxito.

### 3. Próximos Pasos Lógicos
1. **Despliegue a Producción:** Configuración de variables de entorno y despliegue del backend en VPS / Railway / Render y frontend en Vercel.
2. **Sistema de Suscripciones / Pasarela de Pago:** Integración de Stripe / Lemon Squeezy para desbloquear planes PRO y límites de bots.
3. **Métricas y Analytics:** Panel con contador de respuestas automáticas, interacciones por personalidad y métricas de viralidad.
