const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const profileRoutes = require('./routes/profileRoutes'); 
const searchRoutes = require('./routes/searchRoutes');

const app = express();
app.use(cors( {
    origin: "http://localhost:8080",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));
app.use(express.json()); 

app.get('/', (req, res) => {
    res.status(200).send('Backend API ARAHIN is running!');
});
// ------------------------------------------------

app.use('/api', authRoutes);
app.use('/api/profile', profileRoutes); 
app.use('/api/search-routes', searchRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server backend berjalan di http://localhost:${PORT}`);
});