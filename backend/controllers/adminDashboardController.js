const pool = require('../db');

const getDashboardStats = async (req, res) => {
    try {
        const [
            [usersResult],
            [subsResult],
            [reportsCountResult],
            [recentReportsResult],
            [categoryResult]
        ] = await Promise.all([
            pool.query(`SELECT COUNT(*) as total FROM users WHERE role = 'Pengguna'`),
            
            pool.query(`SELECT COUNT(*) as total FROM subs WHERE status = 'Active'`),
            
            pool.query(`SELECT COUNT(*) as total FROM reports WHERE created_at >= NOW() - INTERVAL 1 DAY`),
            
            pool.query(`
                SELECT 
                    r.report_id, 
                    p.full_name AS reporter_name, 
                    r.category AS category, 
                    r.status, 
                    r.created_at 
                FROM reports r
                LEFT JOIN profiles p ON r.reporter_id = p.user_id
                ORDER BY r.created_at DESC
                LIMIT 5
            `),

            pool.query(`
                SELECT 
                    CASE category_status
                        WHEN 'general' THEN 'Umum'
                        WHEN 'elderly' THEN 'Lansia'
                        WHEN 'disability' THEN 'Disabilitas'
                        WHEN 'women' THEN 'Wanita'
                        WHEN 'pregnant' THEN 'Wanita Hamil'
                        WHEN 'children' THEN 'Anak-anak'
                        WHEN 'vulnerable-illness' THEN 'Penyakit Rentan'
                        ELSE 'Umum'
                    END AS name, 
                    COUNT(*) AS value 
                FROM profiles 
                GROUP BY category_status
            `)
        ]);

        const totalUsers = usersResult[0].total;
        const activeSubs = subsResult[0].total;
        const newReports24h = reportsCountResult[0].total;
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
                recent_reports: recentReportsResult,
                user_categories: categoryResult
            }
        });

    } catch (error) {
        console.error("❌ Error Get Dashboard Stats:", error);
        res.status(500).json({ message: "Terjadi kesalahan server saat mengambil data dashboard." });
    }
};

module.exports = { getDashboardStats };