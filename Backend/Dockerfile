FROM node:20-slim

# 1. Instalamos Chromium y lo mínimo necesario de una vez
RUN apt-get update && apt-get install -y \
    chromium \
    fonts-liberation \
    libnss3 \
    libatk-bridge2.0-0 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    libgbm1 \
    libasound2 \
    libpangocairo-1.0-0 \
    libxshmfence1 \
    && rm -rf /var/lib/apt/lists/*

# 2. Variables para que Puppeteer no intente descargar nada y use lo que instalamos arriba
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

WORKDIR /app

# 3. Instalación optimizada
COPY package*.json ./
# --only=production evita instalar librerías de test/desarrollo que no sirven en la nube
RUN npm install --only=production --network-timeout=100000

# 4. Copiamos el resto del código
COPY . .

# 5. Compilamos (Si esto falla por RAM, tendremos que subir el código ya compilado)
RUN npm run build

EXPOSE 4000

CMD ["npm", "start"]