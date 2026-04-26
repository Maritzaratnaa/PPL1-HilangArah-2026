const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
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

const isAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'Admin') {
        next();
    }
    else {
        return res.status(403).json({ message: "Akses ditolak! Halaman ini khusus Admin." });
    }
};

const isMainAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'Admin' && req.user.email === 'arahin.support@gmail.com') {
        next();
    }
    else {
        return res.status(403).json({message: "Akses ditolak! Hanya Admin Utama yang memiliki akses ini."})
    }
};

module.exports = {
    verifyToken,
    isAdmin,
    isMainAdmin
}