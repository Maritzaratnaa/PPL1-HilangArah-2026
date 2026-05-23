const pool = require('../db');
const autoExpireSubscriptions = require('../utils/autoExpire');

const getAllGuides = async (req, res) => {
    try {
        const { search } = req.query;

        await autoExpireSubscriptions();
        const statsQuery = `
            SELECT 
                COUNT(*) AS total_pemandu,
                SUM(IF(is_available = 1, 1, 0)) AS tersedia,
                SUM(IF(is_available = 0, 1, 0)) AS tidak_tersedia
            FROM guides
        `;
        const [statsResult] = await pool.query(statsQuery);

        let tableQuery = `SELECT * FROM guides WHERE 1=1`;
        const queryParams = [];

        if (search) {
            tableQuery += ` AND (full_name LIKE ? OR employee_id LIKE ? OR domicile LIKE ?)`;
            queryParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
        }

        tableQuery += ` ORDER BY full_name ASC`;
        const [guides] = await pool.query(tableQuery, queryParams);

        res.status(200).json({
            message: "Berhasil mengambil data pemandu",
            data: {
                stats: {
                    total: statsResult[0].total_pemandu || 0,
                    tersedia: statsResult[0].tersedia || 0,
                    tidak_tersedia: statsResult[0].tidak_tersedia || 0
                },
                list: guides
            }
        });

    } catch (error) {
        console.error("❌ Error Get Guides:", error);
        res.status(500).json({ message: "Terjadi kesalahan server saat mengambil data pemandu." });
    }
};

const getGuideDetail = async (req, res) => {
    try {
        const { employee_id } = req.params;
        const [guide] = await pool.query(`SELECT * FROM guides WHERE employee_id = ?`, [employee_id]);

        if (guide.length === 0) {
            return res.status(404).json({ message: "Data pemandu tidak ditemukan." });
        }

        res.status(200).json({ message: "Berhasil mengambil detail", data: guide[0] });
    } catch (error) {
        res.status(500).json({ message: "Terjadi kesalahan server." });
    }
};

const createGuide = async (req, res) => {
    try {
        const { full_name, phone_number, domicile, gender, age, detail } = req.body;

        if (!full_name || !phone_number || !domicile || !gender) {
            return res.status(400).json({ message: "Nama, telepon, domisili, dan jenis kelamin wajib diisi!" });
        }

        const randomNum = Math.floor(100 + Math.random() * 900);
        const employee_id = `G-${randomNum}`; 
        
        const insertQuery = `
            INSERT INTO guides (employee_id, full_name, phone_number, domicile, is_available, gender, age, detail) 
            VALUES (?, ?, ?, ?, 1, ?, ?, ?)
        `;
        
        await pool.query(insertQuery, [employee_id, full_name, phone_number, domicile, gender, age || null, detail || null]);

        res.status(201).json({ message: "Pemandu berhasil ditambahkan!", employee_id });
    } catch (error) {
        console.error("❌ Error Create Guide:", error);
        res.status(500).json({ message: "Gagal menambah pemandu." });
    }
};

const toggleGuideStatus = async (req, res) => {
    try {
        const { employee_id } = req.params;
        const { is_available } = req.body; 

        const val = is_available ? 1 : 0; 

        const [result] = await pool.query(`UPDATE guides SET is_available = ? WHERE employee_id = ?`, [val, employee_id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Data pemandu tidak ditemukan." });
        }

        res.status(200).json({ message: `Status berhasil diubah.` });
    } catch (error) {
        res.status(500).json({ message: "Gagal mengubah status pemandu." });
    }
};


const updateGuide = async (req, res) => {
    try {
        const { employee_id } = req.params;
        const { full_name, phone_number, domicile, gender, age, detail } = req.body;

        const [result] = await pool.query(
            `UPDATE guides SET full_name = ?, phone_number = ?, domicile = ?, gender = ?, age = ?, detail = ? WHERE employee_id = ?`, 
            [full_name, phone_number, domicile, gender, age || null, detail || null, employee_id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Data tidak ditemukan." });
        }

        res.status(200).json({ message: "Data pemandu berhasil diperbarui!" });
    } catch (error) {
        res.status(500).json({ message: "Gagal memperbarui pemandu." });
    }
};


const deleteGuide = async (req, res) => {
    try {
        const { employee_id } = req.params;
        const [result] = await pool.query(`DELETE FROM guides WHERE employee_id = ?`, [employee_id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Data tidak ditemukan." });
        }
        res.status(200).json({ message: "Data berhasil dihapus." });
    } catch (error) {
        res.status(500).json({ message: "Gagal menghapus data." });
    }
};

module.exports = {
    getAllGuides,
    getGuideDetail,
    createGuide,
    toggleGuideStatus,
    updateGuide,
    deleteGuide
};