const express = require('express');
const cors = require('cors');
require('dotenv').config();

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

app.use('/api/admin/subscriptions', adminSubRoutes);
app.use('/api/admin/manage', adminRoleRoutes);
app.use('/api/admin/reports', adminReportRoutes);
app.use('/api/admin/transportations', adminTransportRoutes);
app.use('/api/admin', adminDashboardRoutes);
app.use('/api/admin/guides', adminGuideRoutes);
app.use('/api/admin/users', adminUserRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server backend berjalan di http://localhost:${PORT}`);
});