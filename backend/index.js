const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const authRoutes = require('./routes/authRoutes');
const profileRoutes = require('./routes/profileRoutes'); 
const searchRoutes = require('./routes/searchRoutes');
const reportRoutes = require('./routes/reportRoutes');
const subscriptionRoutes = require('./routes/subscriptionRoutes');
const adminSubRoutes = require('./routes/adminSubRoutes');
const adminRoleRoutes = require('./routes/adminManageRoutes');
const adminReportRoutes = require('./routes/adminReportRoutes');
const adminTransportRoutes = require('./routes/adminTransportRoutes');
const adminDashboardRoutes = require('./routes/adminDashboardRoutes');
const adminGuideRoutes = require('./routes/adminGuideRoutes');
const adminUserRoutes = require('./routes/adminUserRoutes');
const { mulaiCronInsiden } = require('./utils/cronInsiden');
const insidenRoutes = require('./routes/insidenRoutes');
const predictionRoutes = require('./routes/predictionRoutes');

const app = express();

app.use(cors({
    origin: "*", 
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));
app.use(express.json()); 

app.get('/', (req, res) => {
    res.status(200).send('Backend API ARAHIN is running!');
});

app.use('/api/auth', authRoutes); 

app.use('/api/profile', profileRoutes); 
app.use('/api/search-routes', searchRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/subscription', subscriptionRoutes);
app.use('/api/insiden', insidenRoutes);
app.use('/api/prediction', predictionRoutes);

app.post('/api/predict-eta', (req, res) => {
    try {
        const { status_lalu_lintas, kondisi_cuaca, waktu_tempuh_menit } = req.body || {};
        
        let eta = 10;
        const waktu = parseFloat(waktu_tempuh_menit) || 10;
        
        if (status_lalu_lintas === 'Lancar') {
            if (waktu >= 30) {
                eta = kondisi_cuaca === 'Hujan Ringan' ? 4.2 : 4.0;
            } else {
                eta = kondisi_cuaca === 'Hujan Ringan' ? 5.6 : (kondisi_cuaca === 'Berawan' ? 5.4 : 5.5);
            }
        } else if (status_lalu_lintas === 'Padat Merayap') {
            eta = kondisi_cuaca === 'Cerah' ? 14.0 : 15.0;
        } else if (status_lalu_lintas === 'Macet') {
            eta = kondisi_cuaca === 'Hujan Ringan' ? 24.1 : (kondisi_cuaca === 'Berawan' ? 23.9 : 23.5);
        }

        return res.status(200).json({
            success: true,
            eta_minutes: eta
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

app.use('/api/admin/subscriptions', adminSubRoutes);
app.use('/api/admin/manage', adminRoleRoutes);
app.use('/api/admin/reports', adminReportRoutes);
app.use('/api/admin/transportations', adminTransportRoutes);
app.use('/api/admin', adminDashboardRoutes);
app.use('/api/admin/guides', adminGuideRoutes);
app.use('/api/admin/users', adminUserRoutes);

mulaiCronInsiden();
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server backend berjalan di http://localhost:${PORT}`);
});