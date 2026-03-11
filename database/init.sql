CREATE TABLE users (
    user_id CHAR(36) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100) NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('Admin', 'Pengguna') NOT NULL,
    is_Active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE profiles (
    profile_id CHAR(36) PRIMARY KEY,
    user_id CHAR(36) UNIQUE,
    full_name VARCHAR(255) NOT NULL,
    phone_number VARCHAR(20),
    category_status ENUM('Disabilitas', 'Lansia', 'Ibu Hamil', 'Penyakit Rentan', 'Anak', 'Perempuan'),
    font_size_pref ENUM ('Small', 'Medium', 'Large') DEFAULT 'Medium'
)