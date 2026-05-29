const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../db');
const router = express.Router();

// REGISTRASI USER
router.post('/register', async (req, res) => {
    const { username, email, password } = req.body;
    
    try {
        // Cek apakah user sudah ada
        const checkUser = await pool.query(
            'SELECT * FROM users WHERE email = $1',
            [email]
        );
        
        if (checkUser.rows.length > 0) {
            return res.status(400).json({ error: 'Email sudah terdaftar' });
        }
        
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Simpan user
        const result = await pool.query(
            'INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING id, username, email',
            [username, email, hashedPassword]
        );
        
        // Generate JWT
        const token = jwt.sign(
            { id: result.rows[0].id, email: result.rows[0].email },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );
        
        res.status(201).json({
            message: 'Registrasi berhasil',
            user: result.rows[0],
            token
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// LOGIN USER
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    
    try {
        // Cari user berdasarkan email
        const result = await pool.query(
            'SELECT * FROM users WHERE email = $1',
            [email]
        );
        
        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Email atau password salah' });
        }
        
        const user = result.rows[0];
        
        // Verifikasi password
        const validPassword = await bcrypt.compare(password, user.password);
        
        if (!validPassword) {
            return res.status(401).json({ error: 'Email atau password salah' });
        }
        
        // Generate JWT
        const token = jwt.sign(
            { id: user.id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );
        
        res.json({
            message: 'Login berhasil',
            user: { id: user.id, username: user.username, email: user.email },
            token
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET PROFIL USER
router.get('/profile/:id', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT id, username, email, created_at FROM users WHERE id = $1',
            [req.params.id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User tidak ditemukan' });
        }
        
        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;