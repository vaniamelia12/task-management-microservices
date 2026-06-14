const express = require('express');
const pool = require('../db');
const router = express.Router();

// URL Notification Service (untuk kirim notifikasi)
const NOTIF_SERVICE_URL = 'http://localhost:3003';

// GET semua tugas
router.get('/', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM tasks ORDER BY created_at DESC');
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET tugas berdasarkan ID
router.get('/:id', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM tasks WHERE id = $1', [req.params.id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Tugas tidak ditemukan' });
        }
        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST buat tugas baru (TAMBAH DEADLINE)
router.post('/', async (req, res) => {
    const { title, description, assigned_to, created_by, deadline } = req.body;
    
    try {
        const result = await pool.query(
            `INSERT INTO tasks (title, description, assigned_to, created_by, deadline) 
             VALUES ($1, $2, $3, $4, $5) RETURNING *`,
            [title, description, assigned_to, created_by, deadline]
        );
        
        // Kirim notifikasi ke user yang ditugasi (jika ada)
        if (assigned_to) {
            const deadlineText = deadline ? `, deadline: ${new Date(deadline).toLocaleString()}` : '';
            await fetch(`${NOTIF_SERVICE_URL}/api/notifications`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: assigned_to,
                    title: '📋 Tugas Baru',
                    message: `Anda mendapat tugas: "${title}"${deadlineText}`
                })
            });
        }
        
        res.status(201).json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// PUT update tugas (TAMBAH DEADLINE)
router.put('/:id', async (req, res) => {
    const { title, description, status, assigned_to, deadline } = req.body;
    
    try {
        const result = await pool.query(
            `UPDATE tasks SET 
                title = $1, 
                description = $2, 
                status = $3, 
                assigned_to = $4, 
                deadline = $5,
                updated_at = CURRENT_TIMESTAMP 
             WHERE id = $6 RETURNING *`,
            [title, description, status, assigned_to, deadline, req.params.id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Tugas tidak ditemukan' });
        }
        
        // Kirim notifikasi jika tugas di-assign ke user lain
        if (assigned_to && assigned_to !== result.rows[0].assigned_to) {
            await fetch(`${NOTIF_SERVICE_URL}/api/notifications`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: assigned_to,
                    title: '🔄 Tugas Diubah',
                    message: `Anda mendapat tugas baru: "${title}"`
                })
            });
        }
        
        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// DELETE hapus tugas
router.delete('/:id', async (req, res) => {
    try {
        const result = await pool.query('DELETE FROM tasks WHERE id = $1 RETURNING *', [req.params.id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Tugas tidak ditemukan' });
        }
        res.json({ message: 'Tugas berhasil dihapus' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET filter tugas berdasarkan status
router.get('/status/:status', async (req, res) => {
    const { status } = req.params;
    try {
        const result = await pool.query('SELECT * FROM tasks WHERE status = $1 ORDER BY created_at DESC', [status]);
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET tugas yang sudah expired (TAMBAHAN FITUR BARU)
router.get('/expired/tasks', async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT * FROM tasks 
             WHERE deadline < NOW() 
             AND status != 'done' 
             ORDER BY deadline ASC`
        );
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;