# Product Requirements Document (PRD): GUASApp 🎭💎

*Versión 1.1 - Estrategia Híbrida a Móvil*

## 1. Visión y Objetivo
**GUASApp** ("Troleo Inteligente") es una aplicación interactiva que permite a los usuarios gestionar bots impulsados por Inteligencia Artificial para responder automáticamente en WhatsApp. Su objetivo es el entretenimiento mediante el humor, el sarcasmo y el rol, permitiendo a los usuarios "trolear" a amigos y grupos de forma segura y controlada.

Originalmente concebida como una aplicación web (dashboard), la visión del producto evoluciona en dos etapas para capturar el mercado móvil:
1. **Fase 1 (Corto Plazo): Progressive Web App (PWA).** Convertir la web actual en una app instalable para un despliegue rápido, permitiendo a los usuarios tener GUASApp en su pantalla de inicio inmediatamente.
2. **Fase 2 (Medio Plazo): Aplicación Móvil Nativa.** Desarrollo en Flutter para tiendas oficiales (App Store / Google Play), maximizando la experiencia táctil, integrando funciones nativas puras (compartir en redes, respuesta háptica, Text-to-Speech gratuito del OS) y aumentando la retención del usuario.

## 2. Público Objetivo
- **Generación Z y Millennials (16-35 años):** Usuarios nativos digitales que consumen y crean contenido de humor.
- **Creadores de Contenido:** Usuarios que buscan generar capturas de pantalla graciosas para compartir en TikTok, Instagram Stories y X.

## 3. Funcionalidades Core (Características Principales)

### 3.1. Motor de Inteligencia Artificial
- **Personalidades Predefinidas:** 14 perfiles satíricos oficiales (ej. El Cuñado, La Drama Queen, El Filósofo, etc.).
- **Creador Custom:** Capacidad de crear un bot a medida (Nombre, Emoji representativo, Prompt/Reglas de comportamiento).
- **Memoria Contextual:** El bot recuerda las últimas 20 iteraciones (mensajes) de la conversación para mantener el hilo y la coherencia narrativa.
- **Retraso Humano Simulado:** Tiempos de espera variables (1.5s a 4.5s) antes de responder, simulando que una persona real está escribiendo.
- **Reconocimiento de Notas de Voz:** Transcripción automática de audios entrantes usando Gemini, permitiendo al bot "escuchar" y responder a audios.

### 3.2. Integración con WhatsApp
- **Vinculación por QR:** Escaneo del código QR dentro de la app para enlazar la sesión de WhatsApp Web del usuario con el servidor backend.
- **Gestión por Contacto/Grupo:** Activación/Desactivación individual del bot por chat.
- **Silencio Inicial:** El bot no escribe el primer mensaje; espera a que el contacto interactúe.

### 3.3. Controles de Seguridad (Safety First)
- **Botón de Pánico (UI):** Un botón rojo accesible en toda la app que, al pulsarlo, desactiva instantáneamente todos los bots activos. Contará con respuesta háptica (vibración) en móvil.
- **Comandos de Emergencia:** Si el usuario percibe que la broma va demasiado lejos, enviar `!stop`, `!pausa`, o `!basta` desde su propio móvil en el chat detiene el bot.

### 3.4. Viralidad y Redes Sociales
- **Generador de Capturas Virales:** Herramienta nativa para tomar capturas de los chats más graciosos.
- **Marca de Agua:** Aplicación de marca de agua oficial (GUASApp) en las capturas.
- **Compartir Nativo:** Integración con el menú "Compartir" del OS para enviar directamente a Instagram Stories o TikTok.

### 3.5. Text-to-Speech (TTS) Nativo
- Para evitar los costes y bloqueos de APIs externas (como ElevenLabs), la app móvil utilizará el motor de síntesis de voz nativo de iOS (AVSpeechSynthesizer) y Android (TextToSpeech) para leer en voz alta, de forma gratuita y local, las respuestas generadas si el usuario lo desea en su propio dispositivo.

### 3.6. Monetización (Modo PRO)
- Acceso a la creación de personajes ilimitados.
- Retirada de marcas de agua en las capturas.
- Mayor límite de chats activos simultáneamente.

## 4. Flujos de Usuario (User Flows)

1. **Onboarding & Auth:** El usuario descarga la app, se registra (Supabase Auth) y llega a la pantalla principal.
2. **Vinculación:** Se le muestra un código QR generado por el backend. El usuario lo escanea con la sección "Dispositivos Vinculados" de su WhatsApp oficial.
3. **Setup del Troleo:** Se carga la lista de chats recientes. El usuario selecciona a "Juan", le asigna la personalidad "El Cuñado" y enciende el interruptor.
4. **Interacción:** Juan envía un mensaje. El backend lo intercepta, consulta a Gemini y envía la respuesta sarcástica.
5. **Consumo y Viralización:** El usuario lee la conversación en vivo en el monitor de la app, pulsa el botón "Captura Viral" y la sube a Instagram.
6. **Desactivación:** Juan se enfada demasiado. El usuario pulsa el "Botón de Pánico" y la app desactiva todos los bots, permitiendo al usuario retomar el control manual.
