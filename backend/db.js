const mysql = require('mysql2/promise');
//require('dotenv').config();

const pool = mysql.createPool({
    host: 'db',
    user: 'root',
    password: 'rootpassword',
    database: 'arahin_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

pool.getConnection()
    .then(conn => {
        console.log("✅ KONEKSI DATABASE BERHASIL!");
        conn.release();
    })
    .catch(err => {
        console.log("❌ KONEKSI DATABASE GAGAL:", err.message);
    });

module.exports = pool;