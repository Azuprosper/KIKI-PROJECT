const API_BASE_URL = 'https://kebab-rule-blandness.ngrok-free.dev'; 

let globalUsersArray = [];

document.addEventListener('DOMContentLoaded', () => {
    // Sidebar Toggle
    const sidebar = document.querySelector('.sidebar');
    const toggleBtn = document.getElementById('sidebar-toggle');
    
    if (toggleBtn && sidebar) {
        toggleBtn.addEventListener('click', () => {
            sidebar.classList.toggle('collapsed');
        });
    }
    
    setupLogout();
    setupActionDropdowns(); 
    setupDeleteUser(); 
    fetchUsersData();
});

async function fetchUsersData() {
    const tableBody = document.getElementById('user-table-body');

    try {
        const token = localStorage.getItem('token'); 

        tableBody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align:center; padding: 24px; color: #666;">
                    Loading users...
                </td>
            </tr>
        `;

        const response = await fetch(`${API_BASE_URL}/api/admin/users`, {
            headers: {
                'ngrok-skip-browser-warning': 'true',
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` 
            }
        });

        if (!response.ok) {
            throw new Error(`Server returned status: ${response.status}`);
        }

        const rawUsers = await response.json();
        
        // Handle pagination/arrays safely
        globalUsersArray = Array.isArray(rawUsers) 
            ? rawUsers 
            : (rawUsers.content || rawUsers.data || rawUsers.users || []);

        renderUserTable(globalUsersArray);
        setupSearch(); 

    } catch (error) {
        console.error('Users Load Error:', error);
        tableBody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align:center; color:#dc3545; padding: 24px;">
                    Failed to load users. Verify your connection and login token.
                </td>
            </tr>
        `;
    }
}

function renderUserTable(users) {
    const tableBody = document.getElementById('user-table-body');
    tableBody.innerHTML = ''; 

    if (!Array.isArray(users) || users.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding: 24px; color: #666;">No users match your criteria.</td></tr>`;
        return;
    }

    users.forEach(user => {
        const row = document.createElement('tr');
        
        const userId = user.id || user.userId || ''; 
        const userRole = user.role || 'USER'; 

        row.innerHTML = `
            <td><strong>${user.name || user.username || user.firstName || 'N/A'}</strong></td>
            <td>${user.email || 'N/A'}</td>
            <td><span class="role-badge">${userRole}</span></td>
            <td><span class="status-dot"></span>${user.status || 'ACTIVE'}</td>
            <td>
                <div class="action-dropdown-container">
                    <button class="manage-btn">Manage ▾</button>
                    <div class="action-dropdown">
                        <button class="dropdown-item delete-btn" data-user-id="${userId}" data-user-role="${userRole}">Delete</button>
                    </div>
                </div>
            </td>
        `;
        
        tableBody.appendChild(row);
    });
}

// Search Logic
function setupSearch() {
    const searchInput = document.getElementById('user-search-input') || document.querySelector('.search-box input');
    const searchBtn = document.getElementById('user-search-btn') || document.querySelector('.search-btn');

    const performSearch = () => {
        const searchTerm = searchInput.value.toLowerCase().trim();
        
        const filteredUsers = globalUsersArray.filter(user => {
            const name = (user.name || user.username || user.firstName || '').toLowerCase();
            const email = (user.email || '').toLowerCase();
            const role = (user.role || '').toLowerCase();
            
            return name.includes(searchTerm) || email.includes(searchTerm) || role.includes(searchTerm);
        });

        renderUserTable(filteredUsers);
    };

    if (searchInput) {
        searchInput.addEventListener('input', performSearch);
    }
    if (searchBtn) {
        searchBtn.addEventListener('click', performSearch);
    }
}

// Action dropdown toggle
function setupActionDropdowns() {
    const tableBody = document.getElementById('user-table-body');
    
    if (tableBody) {
        tableBody.addEventListener('click', (event) => {
            if (event.target.classList.contains('manage-btn')) {
                event.stopPropagation(); 
                
                document.querySelectorAll('.action-dropdown.show').forEach(menu => {
                    if (menu !== event.target.nextElementSibling) {
                        menu.classList.remove('show');
                    }
                });

                const dropdown = event.target.nextElementSibling;
                if (dropdown) {
                    dropdown.classList.toggle('show');
                }
            }
        });
    }

    window.addEventListener('click', (event) => {
        if (!event.target.classList.contains('manage-btn')) {
            document.querySelectorAll('.action-dropdown.show').forEach(menu => {
                menu.classList.remove('show');
            });
        }
    });
}

// Delete User Modal and API logic
function setupDeleteUser() {
    const tableBody = document.getElementById('user-table-body');
    const deleteModal = document.getElementById('delete-modal');
    const cancelBtn = document.getElementById('cancel-delete');
    const confirmBtn = document.getElementById('confirm-delete');
    
    let userIdToDelete = null;
    let userRoleToDelete = null; 

    if (tableBody && deleteModal && cancelBtn && confirmBtn) {
        tableBody.addEventListener('click', (event) => {
            if (event.target.classList.contains('delete-btn')) {
                userIdToDelete = event.target.getAttribute('data-user-id');
                userRoleToDelete = event.target.getAttribute('data-user-role'); 
                
                deleteModal.style.display = 'flex';
                
                const dropdown = event.target.closest('.action-dropdown');
                if (dropdown) dropdown.classList.remove('show');
            }
        });

        cancelBtn.addEventListener('click', () => {
            deleteModal.style.display = 'none';
            userIdToDelete = null;
            userRoleToDelete = null;
        });

        confirmBtn.addEventListener('click', async () => {
            if (!userIdToDelete) return;
            
            confirmBtn.textContent = 'Deleting...';
            confirmBtn.disabled = true;

            try {
                const token = localStorage.getItem('token');
                
                const apiEndpoint = userRoleToDelete === 'ORGANIZATION' 
                    ? `${API_BASE_URL}/api/organizations/${userIdToDelete}`
                    : `${API_BASE_URL}/api/users/${userIdToDelete}`;
                
                const response = await fetch(apiEndpoint, {
                    method: 'DELETE',
                    headers: {
                        'ngrok-skip-browser-warning': 'true',
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (response.ok) {
                    deleteModal.style.display = 'none';
                    fetchUsersData(); 
                } else {
                    alert('Failed to delete user. Check backend logs for constraints.');
                }
            } catch (error) {
                console.error('Delete Error:', error);
                alert('An error occurred while communicating with the server.');
            } finally {
                confirmBtn.textContent = 'Delete';
                confirmBtn.disabled = false;
                userIdToDelete = null;
                userRoleToDelete = null;
            }
        });

        window.addEventListener('click', (e) => {
            if (e.target === deleteModal) {
                deleteModal.style.display = 'none';
                userIdToDelete = null;
                userRoleToDelete = null;
            }
        });
    }
}

// Logout handling
function setupLogout() {
    const logoutBtn = document.querySelector('.logout-btn');
    const modal = document.getElementById('logout-modal');
    const cancelBtn = document.getElementById('cancel-logout');
    const confirmBtn = document.getElementById('confirm-logout');

    if (logoutBtn && modal && cancelBtn && confirmBtn) {
        logoutBtn.addEventListener('click', () => {
            modal.style.display = 'flex';
        });

        cancelBtn.addEventListener('click', () => {
            modal.style.display = 'none';
        });

        confirmBtn.addEventListener('click', () => {
            localStorage.removeItem('token'); 
            window.location.href = 'login.html'; 
        });

        window.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
    }
}