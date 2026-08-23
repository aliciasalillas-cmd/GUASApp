# ESTADO DEL PROYECTO: GUASApp

*Última actualización: 2026-08-23*

---

## 1. Archivos Modificados / Creados
- ackend/config.json:
  - Se eliminó la clave API (apiKey) original para evitar bloqueos de seguridad de GitHub (Secret Scanning) y se sustituyó por el marcador "TU_API_KEY_AQUI".
- Configuración de Git en local.

---

## 2. Estado Actual del Desarrollo
- **Fase Actual:** Configuración de repositorio y control de versiones finalizada.
- **Repositorio de GitHub:** Subida exitosa del proyecto inicial a https://github.com/aliciasalillas-cmd/GUASApp.git en la rama main.
- **Seguridad:** Los secretos del backend no se han expuesto públicamente gracias al escáner de GitHub.
- **Documentación Base:** PRD.md y PLAN.md actualizados para reflejar que a corto plazo convertiremos la web actual en PWA, y a medio plazo se desarrollará la app nativa en Flutter.
- **Operatividad Web:** 100% funcional, limpio de dependencias de pago innecesarias (ElevenLabs removido).

---

## 3. Próximos Pasos Lógicos
0. **Refinamiento de Personalidades IA:** Detallar y enriquecer los prompts de las 14 personalidades satíricas para evitar respuestas repetitivas, chistes recurrentes y mejorar la variedad y profundidad del troleo.
1. **Gestión de Secretos:** Configurar un archivo .env en el backend para almacenar de forma segura la API Key (y añadirlo a .gitignore), para que la app pueda volver a usar Gemini sin comprometer la clave.
2. **Conversión a PWA (Fase 1 Corto Plazo):** Añadir manifest.json y el Service Worker a la web actual (rontend) usando Vite PWA. Ajustar el diseño CSS para que responda a pantallas móviles como una app completa.
3. **Dockerización del Backend:** Preparar el Dockerfile en el directorio ackend para contenedorizar Node + Puppeteer y facilitar su despliegue en un VPS.
4. **Inicio de App Nativa (Fase 2 Medio Plazo):** Comenzar la configuración del proyecto Flutter para el cliente final premium.

