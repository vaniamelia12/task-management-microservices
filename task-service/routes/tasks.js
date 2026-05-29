const express = require('express');
const pool = require('../db');
const router = express.Router();

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

// POST buat tugas baru
router.post('/', async (req, res) => {
    const { title, description, assigned_to, created_by } = req.body;
    
    try {
        const result = await pool.query(
            'INSERT INTO tasks (title, description, assigned_to, created_by) VALUES ($1, $2, $3, $4) RETURNING *',
            [title, description, assigned_to, created_by]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// PUT update tugas
router.put('/:id', async (req, res) => {
    const { title, description, status, assigned_to } = req.body;
    
    try {
        const result = await pool.query(
            'UPDATE tasks SET title = $1, description = $2, status = $3, assigned_to = $4, updated_at = CURRENT_TIMESTAMP WHERE id = $5 RETURNING *',
            [title, description, status, assigned_to, req.params.id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Tugas tidak ditemukan' });
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

module.exports = router;