require('dotenv').config();
const express = require('express');
const cors = require('cors');
const notifRoutes = require('./routes/notifications');

const app = express();
const PORT = process.env.PORT || 3003;

app.use(cors());
app.use(express.json());

app.use('/api/notifications', notifRoutes);

app.get('/health', (req, res) => {
    res.json({ status: 'Notification Service running', port: PORT });
});

app.listen(PORT, () => {
    console.log(`Notification Service running on port ${PORT}`);
});