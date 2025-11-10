FROM node:20-alpine

# Instalar OpenSSL para Prisma y dependencias para Chromium (Puppeteer)
RUN apk add --no-cache \
  openssl \
  postgresql-client \
  chromium \
  nss \
  freetype \
  harfbuzz \
  ca-certificates \
  ttf-freefont

# Configurar Puppeteer para usar Chromium del sistema y evitar descarga en build
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./
COPY prisma ./prisma/

# Instalar dependencias
RUN npm install

# Generar cliente de Prisma
RUN npx prisma generate

# Copiar el script de entrada
COPY docker-entrypoint.sh /app/docker-entrypoint.sh
RUN chmod +x /app/docker-entrypoint.sh

EXPOSE 3000
EXPOSE 3001
EXPOSE 3002
EXPOSE 5173

ENTRYPOINT ["/app/docker-entrypoint.sh"]