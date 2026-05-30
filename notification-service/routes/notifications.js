const express = require('express');
const pool = require('../db');
const router = express.Router();

// GET semua notifikasi untuk user tertentu
router.get('/user/:userId', async (req, res) => {
    const { userId } = req.params;
    try {
        const result = await pool.query(
            'SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC',
            [userId]
        );
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET notifikasi yang belum dibaca
router.get('/user/:userId/unread', async (req, res) => {
    const { userId } = req.params;
    try {
        const result = await pool.query(
            'SELECT * FROM notifications WHERE user_id = $1 AND is_read = false ORDER BY created_at DESC',
            [userId]
        );
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST buat notifikasi baru
router.post('/', async (req, res) => {
    const { user_id, title, message } = req.body;
    
    try {
        const result = await pool.query(
            'INSERT INTO notifications (user_id, title, message) VALUES ($1, $2, $3) RETURNING *',
            [user_id, title, message]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// PUT tandai notifikasi sudah dibaca
router.put('/:id/read', async (req, res) => {
    try {
        const result = await pool.query(
            'UPDATE notifications SET is_read = true WHERE id = $1 RETURNING *',
            [req.params.id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Notifikasi tidak ditemukan' });
        }
        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// DELETE hapus notifikasi
router.delete('/:id', async (req, res) => {
    try {
        const result = await pool.query('DELETE FROM notifications WHERE id = $1 RETURNING *', [req.params.id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Notifikasi tidak ditemukan' });
        }
        res.json({ message: 'Notifikasi berhasil dihapus' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;