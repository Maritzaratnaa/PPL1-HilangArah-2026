# Gunakan Node.js versi 20 yang ringan
FROM node:20-alpine

# Buat folder kerja di dalam Docker
WORKDIR /app

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