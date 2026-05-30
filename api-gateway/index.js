require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// URL Service
const USER_SERVICE = process.env.USER_SERVICE_URL;
const TASK_SERVICE = process.env.TASK_SERVICE_URL;
const NOTIF_SERVICE = process.env.NOTIF_SERVICE_URL;

// Helper untuk forward request
const forwardRequest = async (req, res, targetUrl) => {
    try {
        const options = {
            method: req.method,
            url: `${targetUrl}${req.originalUrl}`,
            data: req.body,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': req.headers.authorization || ''
            }
        };
        
        const response = await axios(options);
        res.status(response.status).json(response.data);
    } catch (error) {
        if (error.response) {
            res.status(error.response.status).json(error.response.data);
        } else {
            res.status(500).json({ error: 'Gateway Error', message: error.message });
        }
    }
};

// ROUTING
app.use('/api/users', (req, res) => forwardRequest(req, res, USER_SERVICE));
app.use('/api/auth', (req, res) => forwardRequest(req, res, USER_SERVICE));
app.use('/api/tasks', (req, res) => forwardRequest(req, res, TASK_SERVICE));
app.use('/api/notifications', (req, res) => forwardRequest(req, res, NOTIF_SERVICE));

// Health Check
app.get('/health', (req, res) => {
    res.json({
        status: 'API Gateway Running',
        port: PORT,
        services: {
            user: USER_SERVICE,
            task: TASK_SERVICE,
            notification: NOTIF_SERVICE
        }
    });
});

app.get('/', (req, res) => {
    res.json({
        message: 'Sistem Manajemen Tugas - API Gateway',
        endpoints: {
            users: 'POST /api/users/register, POST /api/users/login, GET /api/users/profile/:id',
            tasks: 'GET,POST /api/tasks | PUT,DELETE /api/tasks/:id',
            notifications: 'GET /api/notifications/user/:userId'
        }
    });
});

app.listen(PORT, () => {
    console.log(`✅ API Gateway running on port ${PORT}`);
    console.log(`\n📋 Routes:`);
    console.log(`   → /api/users/* → ${USER_SERVICE}`);
    console.log(`   → /api/tasks/* → ${TASK_SERVICE}`);
    console.log(`   → /api/notifications/* → ${NOTIF_SERVICE}`);
});