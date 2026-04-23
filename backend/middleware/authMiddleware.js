const jwt = require('jsonwebtoken');

// 1. Ini fungsi lamamu yang tidak kita ubah namanya (tetap authMiddleware)
const authMiddleware = (req, res, next) => {
    const token = req.header('Authorization')?.split(' ')[1];

    if (!token) {
        return res.status(401).json({message: "Akses ditolak, token tidak ada."});   
    }

    try {
        const verified = jwt.verify(token, process.env.JWT_SECRET);
        req.user = verified;
        next();
    }
    catch (error) {
        res.status(400).json({message: "Token tidak valid!"});
    }
};

// 2. Fungsi baru khusus Admin
const isAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'Admin') {
        next();
    } else {
        return res.status(403).json({ message: "Akses ditolak! Halaman ini khusus Admin." });
    }
};


authMiddleware.isAdmin = isAdmin;
module.exports = authMiddleware;