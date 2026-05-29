require('dotenv').config();
const express = require('express');
const cors = require('cors');
const taskRoutes = require('./routes/tasks');

const app = express();
const PORT = process.env.PORT || 3002;

app.use(cors());
app.use(express.json());

app.use('/api/tasks', taskRoutes);

app.get('/health', (req, res) => {
    res.json({ status: 'Task Service running', port: PORT });
});

app.listen(PORT, () => {
    console.log(`Task Service running on port ${PORT}`);
});