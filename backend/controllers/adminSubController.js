const pool = require('../db');
const autoExpireSubscriptions = require('../utils/autoExpire');

const getAllSubscriptions = async (req, res) => {
    try {
        await autoExpireSubscriptions();

        const { status, search } = req.query;

        let query = `
            SELECT 
                s.subs_id, s.status, s.start_date, s.end_date, s.domicile,
                p.full_name AS customer_name, u.email,
                g.full_name AS guide_name
            FROM subs s
            JOIN users u ON s.user_id = u.user_id
            LEFT JOIN profiles p ON s.user_id = p.user_id
            LEFT JOIN guides g ON s.employee_id = g.employee_id
            WHERE 1=1
        `;
        const queryParams = [];

        if (status) {
            query += ` AND s.status = ?`;
            queryParams.push(status);
        }

        if (search) {
            query += ` AND p.full_name LIKE ?`;
            queryParams.push(`%${search}%`);
        }

        query += ` ORDER BY s.start_date DESC, s.status ASC`;

        const [subs] = await pool.query(query, queryParams);

        res.status(200).json({
            message: "Berhasil mengambil semua data langganan",
            total: subs.length,
            data: subs
        });

    } catch (error) {
        console.error("Error Get All Subs:", error);
        res.status(500).json({ message: "Terjadi kesalahan server saat mengambil data." });
    }
};

const getSubscriptionDetail = async (req, res) => {
    try {
        const { subs_id } = req.params;

        const query = `
            SELECT 
                s.*, 
                p.full_name AS customer_name, p.category_status AS customer_category,
                u.email, u.username,
                g.full_name AS guide_name, g.phone_number AS guide_phone
            FROM subs s
            JOIN users u ON s.user_id = u.user_id
            LEFT JOIN profiles p ON s.user_id = p.user_id
            LEFT JOIN guides g ON s.employee_id = g.employee_id
            WHERE s.subs_id = ?
        `;

        const [subs] = await pool.query(query, [subs_id]);

        if (subs.length === 0) {
            return res.status(404).json({ message: "Data langganan tidak ditemukan." });
        }

        res.status(200).json({
            message: "Berhasil mengambil detail langganan",
            data: subs[0]
        });

    } catch (error) {
        console.error("Error Get Sub Detail:", error);
        res.status(500).json({ message: "Terjadi kesalahan server." });
    }
};

const assignGuideToSubscription = async (req, res) => {
    try {
        const { subs_id } = req.params;
        const { employee_id } = req.body;

        if (!employee_id) {
            return res.status(400).json({ message: "ID Pemandu (employee_id) wajib diisi!" });
        }

        const [checkSub] = await pool.query(`SELECT status FROM subs WHERE subs_id = ?`, [subs_id]);
        if (checkSub.length === 0) {
            return res.status(404).json({ message: "Data langganan tidak ditemukan." });
        }
        if (checkSub[0].status !== 'Active') {
            return res.status(400).json({ message: "Hanya bisa menugaskan pemandu pada langganan yang sudah Aktif (Sudah dibayar)." });
        }

        const updateQuery = `UPDATE subs SET employee_id = ? WHERE subs_id = ?`;
        await pool.query(updateQuery, [employee_id, subs_id]);

        await pool.query(`UPDATE guides SET is_available = 0 WHERE employee_id = ?`, [employee_id]);

        res.status(200).json({ message: "Berhasil menugaskan pemandu pada langganan ini." });

    } catch (error) {
        console.error("Error Assign Guide:", error);
        res.status(500).json({ message: "Terjadi kesalahan server saat menugaskan pemandu." });
    }
};

const updateSubscriptionStatus = async (req, res) => {
    try {
        const { subs_id } = req.params;
        const { status } = req.body; 

        const validStatuses = ['Active', 'Pending', 'Expired', 'Cancelled'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ message: "Status tidak valid!" });
        }

        const [currentSub] = await pool.query(`SELECT employee_id FROM subs WHERE subs_id = ?`, [subs_id]);
        const employee_id = currentSub.length > 0 ? currentSub[0].employee_id : null;

        let query = `UPDATE subs SET status = ?`;
        let params = [status];

        if (status === 'Active') {
            const startDate = new Date();
            const endDate = new Date();
            endDate.setDate(endDate.getDate() + 30);

            const startStr = startDate.toISOString().split('T')[0];
            const endStr = endDate.toISOString().split('T')[0];

            query += `, start_date = ?, end_date = ?`;
            params.push(startStr, endStr);
        }

        query += ` WHERE subs_id = ?`;
        params.push(subs_id);

        const [result] = await pool.query(query, params);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Data langganan tidak ditemukan." });
        }

        if ((status === 'Expired' || status === 'Cancelled') && employee_id) {
            await pool.query(`UPDATE guides SET is_available = 1 WHERE employee_id = ?`, [employee_id]);
        }

        res.status(200).json({ message: `Berhasil mengubah status langganan menjadi ${status}` });

    } catch (error) {
        console.error("Error Update Sub Status:", error);
        res.status(500).json({ message: "Terjadi kesalahan server saat mengubah status." });
    }
};

const deleteSubscription = async (req, res) => {
    try {
        const { subs_id } = req.params;

        const [result] = await pool.query(`DELETE FROM subs WHERE subs_id = ?`, [subs_id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Data langganan tidak ditemukan." });
        }

        res.status(200).json({ message: "Data langganan berhasil dihapus." });

    } catch (error) {
        console.error("Error Delete Sub:", error);
        res.status(500).json({ message: "Terjadi kesalahan server saat menghapus data." });
    }
};

module.exports = {
    getAllSubscriptions,
    getSubscriptionDetail,
    assignGuideToSubscription,
    updateSubscriptionStatus,
    deleteSubscription
};