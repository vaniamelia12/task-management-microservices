// reminder.js - Auto reminder service
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
});

const NOTIF_SERVICE_URL = 'http://localhost:3003';

async function checkReminders() {
    try {
        // Cari tugas yang deadline-nya H-1, H-2, H-3 dan belum dikirim reminder
        const result = await pool.query(
            `SELECT * FROM tasks 
             WHERE deadline IS NOT NULL 
             AND status != 'done' 
             AND reminder_sent = false
             AND deadline > NOW()`
        );
        
        for (const task of result.rows) {
            const deadlineDate = new Date(task.deadline);
            const now = new Date();
            const diffDays = Math.ceil((deadlineDate - now) / (1000 * 60 * 60 * 24));
            
            // Kirim reminder hanya H-1, H-2, H-3
            if (diffDays <= 3 && diffDays > 0) {
                await sendReminder(task, diffDays);
                
                // Tandai reminder sudah dikirim
                await pool.query(
                    `UPDATE tasks SET reminder_sent = true WHERE id = $1`,
                    [task.id]
                );
            }
        }
    } catch (error) {
        console.error('Error checking reminders:', error);
    }
}

async function sendReminder(task, daysLeft) {
    try {
        let message = `⏰ Pengingat: Tugas "${task.title}" deadline dalam ${daysLeft} hari!`;
        if (daysLeft === 1) message = `⚠️ PERHATIAN! Tugas "${task.title}" deadline BESOK!`;
        
        // Kirim notifikasi ke user
        await fetch(`${NOTIF_SERVICE_URL}/api/notifications`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                user_id: task.assigned_to,
                title: '🔔 Pengingat Deadline',
                message: message
            })
        });
        
        console.log(`Reminder sent for task ${task.id}: ${daysLeft} days left`);
    } catch (error) {
        console.error('Error sending reminder:', error);
    }
}

// Cek setiap jam
setInterval(checkReminders, 60 * 60 * 1000);
console.log('Reminder service started - checking every hour');

module.exports = { checkReminders };