# Gunakan Node.js versi 20
FROM node:20-alpine

# Instal pnpm secara global di dalam Docker
RUN npm install -g pnpm

# Buat folder kerja
WORKDIR /app

# Salin file konfigurasi pnpm dan package.json
COPY package.json pnpm-lock.yaml ./

# Instal library React/Vite
RUN pnpm install

# Salin sisa kode frontend
COPY . .

# Beri tahu Docker bahwa Vite jalan di port 5173
EXPOSE 8080

# Nyalakan Vite (WAJIB pakai --host agar bisa diakses dari luar Docker)
CMD ["pnpm", "run", "dev", "--host"]