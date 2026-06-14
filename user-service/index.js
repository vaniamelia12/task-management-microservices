require('dotenv').config();
const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use('/api/users', authRoutes);

app.get('/health', (req, res) => {
    res.json({ status: 'User Service running', port: PORT });
});

// Hanya jalankan server jika bukan dalam mode test
if (process.env.NODE_ENV !== 'test') {
    app.listen(PORT, () => {
        console.log(`User Service running on port ${PORT}`);
    });
}

module.exports = app;