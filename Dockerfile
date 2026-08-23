FROM node:20-bullseye-slim

# Instalar dependencias necesarias para Chromium / Puppeteer en Linux
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        chromium \
        fonts-ipafont-gothic \
        fonts-wqy-zenhei \
        fonts-thai-tlwg \
        fonts-kacst \
        fonts-freefont-ttf \
        libxss1 \
        ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Configurar variables de entorno para Puppeteer y puerto
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium \
    NODE_ENV=production \
    PORT=3000

WORKDIR /app

# Copiar dependencias del backend e instalar
COPY backend/package*.json ./
RUN npm install --production

# Copiar todo el código del backend
COPY backend/ ./

# Exponer el puerto de la API y WebSockets
EXPOSE 3000

# Iniciar servidor
CMD ["node", "index.js"]
