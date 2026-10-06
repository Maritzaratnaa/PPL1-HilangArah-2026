# Gunakan Node.js versi 20 yang ringan
FROM node:20-alpine

# Buat folder kerja di dalam Docker
WORKDIR /app

# --- BAGIAN BARU: Instalasi Python & Library ML ---
# Instal Python 3, pip, dan library ML versi native Alpine agar cepat dan stabil
RUN apk add --no-cache python3 py3-pip py3-pandas py3-scikit-learn

# Instal joblib menggunakan pip (gunakan flag ini karena aturan PEP 668 di Python baru)
RUN pip3 install joblib --break-system-packages
# -------------------------------------------------

# Salin package.json dan package-lock.json lebih dulu
COPY package*.json ./

# Instal semua library (express, bcrypt, dll)
RUN npm install

# Salin sisa kode backend kamu
COPY . .

# Beri tahu Docker bahwa backend jalan di port 3000
EXPOSE 3000

# Perintah untuk menyalakan server
CMD ["npm", "start"]