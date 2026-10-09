# Gunakan node:20-slim (berbasis Debian) agar instalasi ML lebih instan
FROM node:20-slim

WORKDIR /app

# Instal Python dan virtual environment
RUN apt-get update && \
    apt-get install -y python3 python3-pip python3-venv && \
    rm -rf /var/lib/apt/lists/*

# Buat virtual environment untuk Python (standar baru keamanan pip)
ENV VIRTUAL_ENV=/opt/venv
RUN python3 -m venv $VIRTUAL_ENV
ENV PATH="$VIRTUAL_ENV/bin:$PATH"

# Instal dependensi ML (langsung download pre-built, tidak perlu compile)
RUN pip install --no-cache-dir pandas scikit-learn==1.6.1 joblib

# Salin file konfigurasi Node.js
COPY package*.json ./
RUN npm install

# Salin sisa kode backend
COPY . .

EXPOSE 3000
CMD ["npm", "start"]