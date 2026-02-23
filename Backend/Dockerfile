# ETAPA 1: Construcción (Donde ocurre el trabajo pesado)
FROM node:20-slim AS builder

WORKDIR /app

# Copiamos solo los archivos de dependencias para instalar primero
COPY package*.json ./

# Instalamos todas las dependencias (incluyendo las de desarrollo para compilar)
# Usamos un tiempo de espera alto para evitar cortes de red
RUN npm install --network-timeout=100000

# Copiamos el resto del código y generamos la carpeta /dist
COPY . .
RUN npm run build

# ETAPA 2: Ejecución (La imagen final que será súper ligera)
FROM node:20-slim

# Instalamos SOLO las librerías de sistema mínimas para que Puppeteer funcione
RUN apt-get update && apt-get install -y \
    libnss3 \
    libatk-bridge2.0-0 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    libgbm1 \
    libasound2 \
    libpangocairo-1.0-0 \
    libxshmfence1 \
    fonts-liberation \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copiamos desde la etapa 'builder' solo lo necesario para arrancar
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 4000

# Comando para iniciar la aplicación desde los archivos compilados
CMD ["npm", "start"]    