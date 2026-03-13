const express = require('express');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const profileRoutes = require('./routes/profileRoutes'); 

const app = express();
app.use(express.json()); 

app.use('/api', authRoutes);
app.use('/api/profile', profileRoutes); 

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server backend berjalan dengan rapi di http://localhost:${PORT}`);
});