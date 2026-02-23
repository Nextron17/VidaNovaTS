# 1. Usamos Node 20 sobre Debian para máxima compatibilidad
FROM node:20-slim

# 2. Instalamos dependencias del sistema para Puppeteer y herramientas de compilación
RUN apt-get update && apt-get install -y \
    wget \
    gnupg \
    ca-certificates \
    procps \
    libxss1 \
    libasound2 \
    libatk1.0-0 \
    libc6 \
    libcairo2 \
    libcups2 \
    libdbus-1-3 \
    libexpat1 \
    libfontconfig1 \
    libgbm1 \
    libgcc1 \
    libgconf-2-4 \
    libgdk-pixbuf2.0-0 \
    libglib2.0-0 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libstdc++6 \
    libx11-6 \
    libx11-xcb1 \
    libxcb1 \
    libxcomposite1 \
    libxcursor1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxi6 \
    libxrender1 \
    libxtst6 \
    fonts-liberation \
    libappindicator1 \
    libnss3 \
    lsb-release \
    xdg-utils \
    && rm -rf /var/lib/apt/lists/*

# 3. Directorio de trabajo
WORKDIR /app

# 4. Instalamos dependencias primero (para aprovechar el caché de Docker)
COPY package*.json ./
RUN npm install

# 5. Copiamos el resto del código
COPY . .

# 6. Compilamos el proyecto
RUN npm run build

# 7. Exponemos el puerto de tu app
EXPOSE 4000

# 8. Comando de arranque
CMD ["npm", "start"]