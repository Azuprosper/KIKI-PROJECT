const API_BASE_URL = 'https://kebab-rule-blandness.ngrok-free.dev'; 

// We create a global variable to hold the user data so the search bar can access it anytime
let globalUsersArray = [];

document.addEventListener('DOMContentLoaded', () => {
    // Sidebar Toggle Logic
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
    fetchDashboardData();
});

async function fetchDashboardData() {
    try {
        const token = localStorage.getItem('token'); 

        const fetchOptions = {
            headers: {
                'ngrok-skip-browser-warning': 'true',
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` 
            }
        };

        const [summaryRes, usersRes, orgsRes, ordersRes] = await Promise.all([
            fetch(`${API_BASE_URL}/api/admin/summary`, fetchOptions),
            fetch(`${API_BASE_URL}/api/admin/users`, fetchOptions),
            fetch(`${API_BASE_URL}/api/admin/organizations`, fetchOptions),
            fetch(`${API_BASE_URL}/api/admin/orders`, fetchOptions)
        ]);

        if (!summaryRes.ok || !usersRes.ok || !orgsRes.ok || !ordersRes.ok) {
            throw new Error('Failed to connect to endpoints. Token may be missing or expired.');
        }

        const summaryData = await summaryRes.json();
        const rawUsers = await usersRes.json();
        const rawOrgs = await orgsRes.json();
        const rawOrders = await ordersRes.json();

        // Extractor
        const usersArray = Array.isArray(rawUsers) ? rawUsers : (rawUsers.content || rawUsers.data || rawUsers.users || []);
        const orgsArray = Array.isArray(rawOrgs) ? rawOrgs : (rawOrgs.content || rawOrgs.data || rawOrgs.organizations || []);
        const ordersArray = Array.isArray(rawOrders) ? rawOrders : (rawOrders.content || rawOrders.data || rawOrders.orders || []);

        globalUsersArray = usersArray;

        // --- METRICS POPULATION ---
        
        // 1. Financial Data 
        document.getElementById('revenue-all-time').textContent = `$${summaryData.salesAllTime?.totalRevenue.toLocaleString() || 0}`;
        document.getElementById('sales-all-time-units').textContent = `${summaryData.salesAllTime?.unitsSold || 0} units | ${summaryData.salesAllTime?.orderCount || 0} orders`;

        document.getElementById('revenue-month').textContent = `$${summaryData.salesThisMonth?.totalRevenue.toLocaleString() || 0}`;
        document.getElementById('sales-month-units').textContent = `${summaryData.salesThisMonth?.unitsSold || 0} units | ${summaryData.salesThisMonth?.orderCount || 0} orders`;

        document.getElementById('revenue-today').textContent = `$${summaryData.salesToday?.totalRevenue.toLocaleString() || 0}`;
        document.getElementById('sales-today-units').textContent = `${summaryData.salesToday?.unitsSold || 0} units | ${summaryData.salesToday?.orderCount || 0} orders`;

        document.getElementById('total-checkouts').textContent = summaryData.totalCheckouts || 0;

        // 2. Platform Data
        document.getElementById('user-count').textContent = summaryData.totalUsers || rawUsers.totalElements || usersArray.length || 0;
        
        document.getElementById('org-count').textContent = summaryData.totalOrganizations || rawOrgs.totalElements || orgsArray.length || 0;
        document.getElementById('org-stats').textContent = `${summaryData.verifiedOrganizations || 0} Verified | ${summaryData.unverifiedOrganizations || 0} Unverified`;

        document.getElementById('product-count').textContent = summaryData.totalProducts || 0;

        // Render the table and activate the search bar
        renderUserTable(globalUsersArray);
        setupSearch(); 

    } catch (error) {
        console.error('Backend Connection Error:', error);
        document.getElementById('user-table-body').innerHTML = `
            <tr>
                <td colspan="5" style="text-align:center; color:red; padding: 20px;">
                    Failed to load data. Ensure you have logged in to generate a valid token.
                </td>
            </tr>
        `;
    }
}

function renderUserTable(users) {
    const tableBody = document.getElementById('user-table-body');
    tableBody.innerHTML = ''; 

    if (!Array.isArray(users) || users.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding: 20px;">No users match your search.</td></tr>`;
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
                        <button class="dropdown-item view-btn" data-user-id="${userId}">View</button>
                        <button class="dropdown-item delete-btn" data-user-id="${userId}" data-user-role="${userRole}">Delete</button>
                    </div>
                </div>
            </td>
        `;
        
        tableBody.appendChild(row);
    });
}

// The Search Logic
function setupSearch() {
    const searchInput = document.querySelector('.search-box input');
    const searchBtn = document.querySelector('.search-btn');

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

    if (searchInput && searchBtn) {
        searchInput.addEventListener('keyup', performSearch);
        searchBtn.addEventListener('click', performSearch);
    }
}

// Logout Modal and Redirect Logic
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

// Dropdown Menu Logic
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

// Delete Modal and API Logic
function setupDeleteUser() {
    const tableBody = document.getElementById('user-table-body');
    const deleteModal = document.getElementById('delete-modal');
    const cancelBtn = document.getElementById('cancel-delete');
    const confirmBtn = document.getElementById('confirm-delete');
    
    let userIdToDelete = null;
    let userRoleToDelete = null; 

    if (tableBody && deleteModal && cancelBtn && confirmBtn) {
        // 1. Open modal when clicking a delete button
        tableBody.addEventListener('click', (event) => {
            if (event.target.classList.contains('delete-btn')) {
                userIdToDelete = event.target.getAttribute('data-user-id');
                userRoleToDelete = event.target.getAttribute('data-user-role'); 
                
                deleteModal.style.display = 'flex';
                
                // Close the dropdown menu immediately
                const dropdown = event.target.closest('.action-dropdown');
                if (dropdown) dropdown.classList.remove('show');
            }
        });

        // 2. Hide modal on Cancel
        cancelBtn.addEventListener('click', () => {
            deleteModal.style.display = 'none';
            userIdToDelete = null;
            userRoleToDelete = null;
        });

        // 3. Fire the API call on Confirm
        confirmBtn.addEventListener('click', async () => {
            if (!userIdToDelete) return;
            
            // Show loading state
            confirmBtn.textContent = 'Deleting...';
            confirmBtn.disabled = true;

            try {
                const token = localStorage.getItem('token');
                
                // DYNAMIC ENDPOINT: Correctly uses /api/users/15 or /api/organizations/15 
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
                    fetchDashboardData(); 
                } else {
                    alert('Failed to delete user. Check backend server logs for foreign key constraints or permission issues.');
                }
            } catch (error) {
                console.error('Delete Error:', error);
                alert('An error occurred while communicating with the server.');
            } finally {
                // Reset button state
                confirmBtn.textContent = 'Delete';
                confirmBtn.disabled = false;
                userIdToDelete = null;
                userRoleToDelete = null;
            }
        });

        // Hide modal if they click outside the box
        window.addEventListener('click', (e) => {
            if (e.target === deleteModal) {
                deleteModal.style.display = 'none';
                userIdToDelete = null;
                userRoleToDelete = null;
            }
        });
    }
}