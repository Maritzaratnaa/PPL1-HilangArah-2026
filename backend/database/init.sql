-- Active: 1773420604143@@127.0.0.1@3306@arahin_db
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
);

CREATE TABLE guides (
    employee_id VARCHAR(50) PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    phone_number VARCHAR(20),
    domicile VARCHAR(50),
    is_available BOOLEAN DEFAULT TRUE
);

CREATE TABLE subs (
    subs_id CHAR(36) PRIMARY KEY,
    user_id CHAR(36),
    employee_id VARCHAR(50),
    phone_number VARCHAR(20),
    emergency_contact_name VARCHAR(255),
    emergency_contact_phone VARCHAR(20),
    domicile VARCHAR(50),
    specific_needs TEXT,
    status ENUM('Pending', 'Active', 'Expired') DEFAULT 'Pending',
    start_date DATE,
    end_date DATE,
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (employee_id) REFERENCES guides(employee_id)
);

CREATE TABLE payments (
    payment_id CHAR(36) PRIMARY KEY,
    subs_id CHAR(36),
    user_id CHAR(36),
    amount DECIMAL(10,2),
    payment_proof VARCHAR(255),
    status ENUM('Pending', 'Verified', 'Rejected') DEFAULT 'Pending',
    verified_by CHAR(36) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (subs_id) REFERENCES subs(subs_id),
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (verified_by) REFERENCES users(user_id)
);

CREATE TABLE trans (
    trans_id CHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type ENUM('Bus', 'Train', 'LRT', 'MRT'),
    is_low_entry BOOLEAN DEFAULT FALSE,
    has_wheelchair_slot BOOLEAN DEFAULT FALSE,
    has_priority_seat BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE stops (
    stop_id CHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    address TEXT,
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    has_ramp BOOLEAN DEFAULT FALSE,
    has_elevator BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE routes (
    route_id CHAR(36) PRIMARY KEY,
    trans_id CHAR(36),
    route_name VARCHAR(255),
    origin_stop_id CHAR(36),
    destination_stop_id CHAR(36),
    is_active BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (trans_id) REFERENCES trans(trans_id),
    FOREIGN KEY (origin_stop_id) REFERENCES stops(stop_id),
    FOREIGN KEY (destination_stop_id) REFERENCES stops(stop_id)
);

CREATE TABLE route_stops (
    route_stop_id CHAR(36) PRIMARY KEY,
    route_id CHAR(36),
    stop_id CHAR(36),
    stop_order INT,
    est_time_minutes INT,
    FOREIGN KEY (route_id) REFERENCES routes(route_id),
    FOREIGN KEY (stop_id) REFERENCES stops(stop_id)
);

CREATE TABLE reports (
    report_id CHAR(36) PRIMARY KEY,
    reporter_id CHAR(36),
    category ENUM('Fasilitas', 'Pemandu'),
    stop_id CHAR(36),
    subs_id CHAR(36),
    description TEXT,
    status ENUM('Pending', 'Processed', 'Resolved') DEFAULT 'Pending',
    resolved_by CHAR(36),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (reporter_id) REFERENCES users(user_id),
    FOREIGN KEY (stop_id) REFERENCES stops(stop_id),
    FOREIGN KEY (subs_id) REFERENCES subs(subs_id),
    FOREIGN KEY (resolved_by) REFERENCES users(user_id)
);