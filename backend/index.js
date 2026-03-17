const express = require('express');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const profileRoutes = require('./routes/profileRoutes'); 
const searchRoutes = require('./routes/searchRoutes');

const app = express();
app.use(express.json()); 

app.use('/api', authRoutes);
app.use('/api/profile', profileRoutes); 
app.use('/api/search-routes', searchRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server backend berjalan di http://localhost:${PORT}`);
});