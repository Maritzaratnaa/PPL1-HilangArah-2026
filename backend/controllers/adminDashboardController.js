const pool = require('../db');

const getDashboardStats = async (req, res) => {
    try {
        // Gunakan Promise.all agar 4 query berjalan bersamaan (sangat cepat!)
        const [
            [usersResult],
            [subsResult],
            [reportsCountResult],
            [recentReportsResult]
        ] = await Promise.all([
            // 1. Ambil Total Pengguna (Role = Pengguna)
            pool.query(`SELECT COUNT(*) as total FROM users WHERE role = 'Pengguna'`),
            
            // 2. Ambil Total Berlangganan Aktif
            pool.query(`SELECT COUNT(*) as total FROM subs WHERE status = 'Active'`),
            
            // 3. Ambil Jumlah Laporan 24 Jam Terakhir
            // (Asumsi kamu punya tabel 'reports' dengan kolom 'created_at')
            pool.query(`SELECT COUNT(*) as total FROM reports WHERE created_at >= NOW() - INTERVAL 1 DAY`),
            
            // 4. Ambil 5 Laporan Terbaru beserta nama pelapornya
            // (Sesuaikan nama kolom 'report_type' atau 'category' sesuai tabel reports kamu)
            pool.query(`
                SELECT 
                    r.report_id, 
                    p.full_name AS reporter_name, 
                    r.report_type AS category, 
                    r.status, 
                    r.created_at 
                FROM reports r
                LEFT JOIN profiles p ON r.user_id = p.user_id
                ORDER BY r.created_at DESC
                LIMIT 5
            `)
        ]);

        const totalUsers = usersResult[0].total;
        const activeSubs = subsResult[0].total;
        const newReports24h = reportsCountResult[0].total;

        // Hitung persentase Konversi Subscription (seperti di grafik UI kamu: 35%)
        const conversionRate = totalUsers > 0 ? Math.round((activeSubs / totalUsers) * 100) : 0;

        res.status(200).json({
            message: "Berhasil mengambil data statistik dashboard",
            data: {
                stats: {
                    total_users: totalUsers,
                    active_subscriptions: activeSubs,
                    new_reports: newReports24h,
                    conversion_rate: conversionRate
                },
                recent_reports: recentReportsResult
            }
        });

    } catch (error) {
        console.error("❌ Error Get Dashboard Stats:", error);
        res.status(500).json({ message: "Terjadi kesalahan server saat mengambil data dashboard." });
    }
};

module.exports = { getDashboardStats };