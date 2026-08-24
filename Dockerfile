# ==============================================================================
# Loadout AI - Tactical Valorant Radar, Analytics and ML Draft Assistant
# Production Docker Image (Node.js 20 + Python 3 ML Runtime)
# ==============================================================================

FROM node:20-bookworm-slim

WORKDIR /app

# 1. Instalar Python 3, pip y herramientas de compilación necesarias para ML
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    python3-pip \
    python3-venv \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# 2. Configurar entorno virtual para dependencias de Machine Learning
ENV VIRTUAL_ENV=/opt/venv
RUN python3 -m venv $VIRTUAL_ENV
ENV PATH="$VIRTUAL_ENV/bin:$PATH"

# 3. Instalar librerías de Machine Learning (scikit-learn, pandas, numpy, joblib)
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# 4. Copiar definiciones de dependencias de Node.js
COPY package.json package-lock.json ./
COPY frontend/package.json frontend/package-lock.json ./frontend/

# 5. Instalar dependencias de Node.js (backend y frontend)
RUN npm install
RUN npm install --prefix frontend

# 6. Copiar el resto del código fuente del proyecto
COPY . .

# 7. Compilar frontend (Next.js export a public/) y backend (NestJS dist/)
ENV NODE_ENV=production
RUN npm run build

# 8. Exponer el puerto de la aplicación web y websockets
EXPOSE 3000

# 9. Iniciar el servidor
CMD ["node", "dist/main.js"]
