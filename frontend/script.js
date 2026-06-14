// Konfigurasi API
const API_URL = 'http://localhost:3011/api';

// Helper show toast
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = message;
    toast.className = `toast ${type}`;
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Cek halaman saat ini
const currentPage = window.location.pathname;

// ==================== REGISTER ====================
if (currentPage.includes('register.html')) {
    const form = document.getElementById('registerForm');
    const messageDiv = document.getElementById('message');
    
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const username = document.getElementById('username').value;
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            
            try {
                const response = await fetch(`${API_URL}/users/register`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, email, password })
                });
                
                const data = await response.json();
                
                if (response.ok) {
                    messageDiv.className = 'message success';
                    messageDiv.textContent = 'Registrasi berhasil! Silakan login.';
                    setTimeout(() => {
                        window.location.href = 'login.html';
                    }, 2000);
                } else {
                    messageDiv.className = 'message error';
                    messageDiv.textContent = data.error || 'Registrasi gagal';
                }
            } catch (error) {
                messageDiv.className = 'message error';
                messageDiv.textContent = 'Terjadi kesalahan server';
            }
        });
    }
}

// ==================== LOGIN ====================
if (currentPage.includes('login.html')) {
    const form = document.getElementById('loginForm');
    const messageDiv = document.getElementById('message');
    
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            
            try {
                const response = await fetch(`${API_URL}/users/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });
                
                const data = await response.json();
                
                if (response.ok) {
                    localStorage.setItem('token', data.token);
                    localStorage.setItem('userId', data.user.id);
                    localStorage.setItem('username', data.user.username);
                    
                    window.location.href = 'dashboard.html';
                } else {
                    messageDiv.className = 'message error';
                    messageDiv.textContent = data.error || 'Login gagal';
                }
            } catch (error) {
                messageDiv.className = 'message error';
                messageDiv.textContent = 'Terjadi kesalahan server';
            }
        });
    }
}

// ==================== DASHBOARD ====================
if (currentPage.includes('dashboard.html')) {
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');
    const username = localStorage.getItem('username');
    let allUsers = [];
    let editTaskId = null;
    
    if (!token) {
        window.location.href = 'login.html';
    }
    
    document.getElementById('userName').textContent = username;
    
    // Load semua user
    async function loadUsers() {
        try {
            const response = await fetch(`${API_URL}/users`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            allUsers = await response.json();
            
            // Update dropdown
            const select = document.getElementById('assignedTo');
            if (select) {
                select.innerHTML = '<option value="">-- Assign ke User (opsional) --</option>' + 
                    allUsers.filter(u => u.id != userId).map(u => `<option value="${u.id}">${u.username}</option>`).join('');
            }
            
            const editSelect = document.getElementById('editAssignedTo');
            if (editSelect) {
                editSelect.innerHTML = '<option value="">-- Pilih User --</option>' + 
                    allUsers.map(u => `<option value="${u.id}">${u.username}</option>`).join('');
            }
            
            // Tampilkan users
            const usersDiv = document.getElementById('usersList');
            if (usersDiv) {
                usersDiv.innerHTML = allUsers.map(user => `
                    <div class="user-item">
                        <div class="user-info">
                            <h4>${user.username}</h4>
                            <p>${user.email}</p>
                        </div>
                        <div>ID: ${user.id}</div>
                    </div>
                `).join('');
            }
            
            document.getElementById('totalUsers').textContent = allUsers.length;
        } catch (error) {
            console.error('Error loading users:', error);
        }
    }
    
    // Load statistik
    async function loadStats() {
        try {
            const response = await fetch(`${API_URL}/tasks`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const allTasks = await response.json();
            const myTasks = allTasks.filter(task => task.assigned_to == userId);
            const pendingTasks = myTasks.filter(task => task.status === 'pending').length;
            const doneTasks = myTasks.filter(task => task.status === 'done').length;
            
            document.getElementById('totalTasks').textContent = myTasks.length;
            document.getElementById('pendingTasks').textContent = pendingTasks;
            document.getElementById('doneTasks').textContent = doneTasks;
        } catch (error) {
            console.error('Error loading stats:', error);
        }
    }
    
    // Load recent tasks
    async function loadRecentTasks() {
        try {
            const response = await fetch(`${API_URL}/tasks`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const allTasks = await response.json();
            const myTasks = allTasks.filter(task => task.assigned_to == userId).slice(0, 5);
            
            const container = document.getElementById('recentTasksList');
            if (container) {
                if (myTasks.length === 0) {
                    container.innerHTML = '<p style="text-align:center; padding:40px;">Belum ada tugas</p>';
                } else {
                    container.innerHTML = myTasks.map(task => `
                        <div class="task-item">
                            <h4>${task.title}</h4>
                            <p>${task.description || 'Tidak ada deskripsi'}</p>
                            ${task.deadline ? `<small>📅 Deadline: ${new Date(task.deadline).toLocaleString()}</small><br>` : ''}
                            <span class="status ${task.status}">${task.status === 'pending' ? '⏳ Pending' : '✅ Selesai'}</span>
                        </div>
                    `).join('');
                }
            }
        } catch (error) {
            console.error('Error loading recent tasks:', error);
        }
    }
    
    // Load my tasks
    async function loadMyTasks() {
        try {
            const response = await fetch(`${API_URL}/tasks`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const allTasks = await response.json();
            const myTasks = allTasks.filter(task => task.assigned_to == userId);
            
            const container = document.getElementById('myTasksList');
            if (container) {
                if (myTasks.length === 0) {
                    container.innerHTML = '<p style="text-align:center; padding:40px;">✨ Belum ada tugas yang diberikan ke Anda.</p>';
                } else {
                    container.innerHTML = myTasks.map(task => `
                        <div class="task-item">
                            <h4>${task.title}</h4>
                            <p>${task.description || 'Tidak ada deskripsi'}</p>
                            ${task.deadline ? `<small>📅 Deadline: ${new Date(task.deadline).toLocaleString()}</small><br>` : ''}
                            <span class="status ${task.status}">${task.status === 'pending' ? '⏳ Pending' : '✅ Selesai'}</span>
                            <div class="task-actions">
                                <button onclick="updateStatus(${task.id})" ${task.status === 'done' ? 'disabled' : ''}>✅ Selesai</button>
                            </div>
                        </div>
                    `).join('');
                }
            }
        } catch (error) {
            console.error('Error loading my tasks:', error);
        }
    }
    
    // Load created tasks
    async function loadCreatedTasks() {
        try {
            const response = await fetch(`${API_URL}/tasks`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const allTasks = await response.json();
            const createdTasks = allTasks.filter(task => task.created_by == userId);
            
            const container = document.getElementById('createdTasksList');
            if (container) {
                if (createdTasks.length === 0) {
                    container.innerHTML = '<p style="text-align:center; padding:40px;">📝 Belum ada tugas yang Anda buat.</p>';
                } else {
                    container.innerHTML = createdTasks.map(task => `
                        <div class="task-item">
                            <h4>${task.title}</h4>
                            <p>${task.description || 'Tidak ada deskripsi'}</p>
                            ${task.deadline ? `<small>📅 Deadline: ${new Date(task.deadline).toLocaleString()}</small><br>` : ''}
                            <small>Assign ke: ${task.assigned_to ? 'User ID ' + task.assigned_to : 'Belum di-assign'}</small><br>
                            <span class="status ${task.status}">${task.status === 'pending' ? '⏳ Pending' : '✅ Selesai'}</span>
                            <div class="task-actions">
                                <button onclick="openEditModal(${task.id})" class="edit-btn">✏️ Edit</button>
                                <button onclick="deleteTask(${task.id})">🗑️ Hapus</button>
                            </div>
                        </div>
                    `).join('');
                }
            }
        } catch (error) {
            console.error('Error loading created tasks:', error);
        }
    }
    
    // Load calendar
    async function loadCalendar() {
        try {
            const response = await fetch(`${API_URL}/tasks`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const allTasks = await response.json();
            const myTasks = allTasks.filter(task => task.assigned_to == userId && task.deadline);
            
            // Kelompokkan berdasarkan tanggal
            const tasksByDate = {};
            myTasks.forEach(task => {
                const date = new Date(task.deadline).toDateString();
                if (!tasksByDate[date]) tasksByDate[date] = [];
                tasksByDate[date].push(task);
            });
            
            // Render kalender 30 hari ke depan
            let html = '<div class="calendar-grid">';
            const today = new Date();
            for (let i = 0; i < 30; i++) {
                const date = new Date(today);
                date.setDate(today.getDate() + i);
                const dateStr = date.toDateString();
                const tasks = tasksByDate[dateStr] || [];
                const isToday = i === 0;
                
                html += `
                    <div class="calendar-day ${tasks.length > 0 ? 'has-tasks' : ''} ${isToday ? 'today' : ''}">
                        <div class="calendar-date">${date.getDate()} ${date.toLocaleString('id', { month: 'short' })}</div>
                        <div class="calendar-tasks">
                            ${tasks.map(task => `
                                <div class="calendar-task ${task.status}" title="${task.title}">
                                    ${task.title.length > 15 ? task.title.substring(0, 12) + '...' : task.title}
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `;
            }
            html += '</div>';
            
            document.getElementById('calendarView').innerHTML = html;
        } catch (error) {
            console.error('Error loading calendar:', error);
            document.getElementById('calendarView').innerHTML = '<p>Gagal memuat kalender</p>';
        }
    }
    
    // Global functions
    window.updateStatus = async (taskId) => {
        try {
            await fetch(`${API_URL}/tasks/${taskId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ status: 'done' })
            });
            showToast('✅ Tugas selesai!', 'success');
            loadMyTasks();
            loadCreatedTasks();
            loadStats();
            loadRecentTasks();
            loadCalendar();
        } catch (error) {
            showToast('Gagal update status', 'error');
        }
    };
    
    window.deleteTask = async (taskId) => {
        if (confirm('Yakin ingin menghapus tugas ini?')) {
            try {
                await fetch(`${API_URL}/tasks/${taskId}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                showToast('🗑️ Tugas dihapus', 'success');
                loadCreatedTasks();
                loadStats();
                loadCalendar();
            } catch (error) {
                showToast('Gagal menghapus tugas', 'error');
            }
        }
    };
    
    window.openEditModal = async (taskId) => {
        editTaskId = taskId;
        await loadUsers();
        
        try {
            const response = await fetch(`${API_URL}/tasks/${taskId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const task = await response.json();
            
            document.getElementById('editTitle').value = task.title;
            document.getElementById('editDesc').value = task.description || '';
            document.getElementById('editStatus').value = task.status;
            document.getElementById('editAssignedTo').value = task.assigned_to || '';
            
            // Format deadline untuk input datetime-local
            if (task.deadline) {
                const deadlineDate = new Date(task.deadline);
                const formattedDeadline = deadlineDate.toISOString().slice(0, 16);
                document.getElementById('editDeadline').value = formattedDeadline;
            } else {
                document.getElementById('editDeadline').value = '';
            }
            
            document.getElementById('editModal').style.display = 'block';
        } catch (error) {
            showToast('Gagal memuat data tugas', 'error');
        }
    };
    
    // Close modal
    document.querySelector('.close')?.addEventListener('click', () => {
        document.getElementById('editModal').style.display = 'none';
    });
    
    window.addEventListener('click', (e) => {
        const modal = document.getElementById('editModal');
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });
    
    // Edit form submit (TAMBAH DEADLINE)
    const editForm = document.getElementById('editForm');
    editForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const title = document.getElementById('editTitle').value;
        const description = document.getElementById('editDesc').value;
        const status = document.getElementById('editStatus').value;
        const assigned_to = document.getElementById('editAssignedTo').value || null;
        const deadline = document.getElementById('editDeadline').value || null;
        
        try {
            await fetch(`${API_URL}/tasks/${editTaskId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ title, description, status, assigned_to, deadline })
            });
            showToast('✏️ Tugas berhasil diupdate!', 'success');
            document.getElementById('editModal').style.display = 'none';
            loadCreatedTasks();
            loadMyTasks();
            loadCalendar();
        } catch (error) {
            showToast('Gagal update tugas', 'error');
        }
    });
    
    // Create task (TAMBAH DEADLINE)
    const taskForm = document.getElementById('taskForm');
    taskForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const title = document.getElementById('taskTitle').value;
        const description = document.getElementById('taskDesc').value;
        const assigned_to = document.getElementById('assignedTo').value || null;
        const created_by = parseInt(userId);
        const deadline = document.getElementById('taskDeadline').value || null;
        
        try {
            const response = await fetch(`${API_URL}/tasks`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ title, description, assigned_to, created_by, deadline })
            });
            
            if (response.ok) {
                showToast('📝 Tugas baru berhasil dibuat!', 'success');
                taskForm.reset();
                loadCreatedTasks();
                loadMyTasks();
                loadStats();
                loadCalendar();
            }
        } catch (error) {
            showToast('Gagal membuat tugas', 'error');
        }
    });
    
    // Tab switching (TAMBAH CALENDAR)
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const tabId = item.dataset.tab;
            
            document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
            document.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('active'));
            
            item.classList.add('active');
            document.getElementById(tabId).classList.add('active');
            
            if (tabId === 'my-tasks') loadMyTasks();
            if (tabId === 'created-tasks') loadCreatedTasks();
            if (tabId === 'users') loadUsers();
            if (tabId === 'calendar') loadCalendar();
        });
    });
    
    // View all link
    document.querySelector('.view-all')?.addEventListener('click', (e) => {
        e.preventDefault();
        document.querySelector('[data-tab="my-tasks"]').click();
    });
    
    // Logout
    document.getElementById('logoutBtn')?.addEventListener('click', () => {
        localStorage.clear();
        window.location.href = 'landing.html';
    });
    
    // Initial load
    loadUsers();
    loadStats();
    loadRecentTasks();
    loadMyTasks();
    loadCreatedTasks();
}