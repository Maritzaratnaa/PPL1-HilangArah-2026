const pool = require('../db');

const assignAdminRole = async (req, res) => {
    try {
        const { target_user_id } = req.body;

        if (!target_user_id) {
            return res.status(400).json({message: "ID User target harus disertakan!"});
        }

        // Cek target user di database
        const checkQuery = `SELECT username, role FROM users WHERE user_id = ?`;
        const [users] = await pool.query(checkQuery, [target_user_id]);
    
        if (users.length === 0) {
            return res.status(404).json({message: "User tidak ditemukan di database."});
        }

        const targetUser = users[0];

        // Cek apakah user sudah menjadi admin
        if (targetUser.role === 'Admin') {
            return res.status(400).json({
                message: `User ${targetUser.username} sudah memiliki akses Admin.`
            });
        }

        // Update role user
        const updateQuery = `UPDATE users SET role = 'Admin' Where user_id = ?`;
        await pool.query(updateQuery, [target_user_id]);

        res.status(200).json({
            message: "Role user telah berhasil diubah.",
            data: {
                username: targetUser.username,
                new_role: 'Admin'
            }
        });
    }

    catch (error) {
        console.error("Error Assign Admin Role: ", error);
        res.status(500).json({message: "Terjadi kesalahan apda server saat mengubah role."});
    }
};

module.exports = {assignAdminRole};