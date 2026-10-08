document.addEventListener('DOMContentLoaded', async () => {
    // 1. Sidebar Toggle
    const sidebar = document.querySelector('.sidebar');
    const toggleBtn = document.getElementById('sidebar-toggle');
    if (toggleBtn && sidebar) {
        toggleBtn.addEventListener('click', () => {
            sidebar.classList.toggle('collapsed');
        });
    }

    // 2. Setup Logout Handler
    setupLogout();

    // 3. Organization Directory Elements
    const tableBody = document.getElementById('org-table-body');
    const searchInput = document.getElementById('org-search-input');
    const searchBtn = document.getElementById('search-btn');

    // 4. Status Confirmation Modal Elements
    const statusModal = document.getElementById('status-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalMessage = document.getElementById('modal-message');
    const cancelStatusBtn = document.getElementById('cancel-status');
    const confirmStatusBtn = document.getElementById('confirm-status');

    let organizationsList = [];
    let pendingAction = null; // Stores: { id, name, targetStatus: boolean }

    const BASE_URL = 'https://kebab-rule-blandness.ngrok-free.dev';
    const GET_ORGS_ENDPOINT = `${BASE_URL}/api/admin/organizations`;

    // Fetch and populate organizations table
    async function loadOrganizations() {
        try {
            const token = localStorage.getItem('token') || localStorage.getItem('authToken');
            
            const res = await fetch(GET_ORGS_ENDPOINT, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'ngrok-skip-browser-warning': 'true',
                    ...(token && { 'Authorization': `Bearer ${token}` })
                }
            });

            if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);

            const jsonResponse = await res.json();
            organizationsList = jsonResponse.content || (Array.isArray(jsonResponse) ? jsonResponse : []);
            
            render(organizationsList);
        } catch (error) {
            console.error('Fetch error:', error);
            if (tableBody) {
                tableBody.innerHTML = `
                    <tr>
                        <td colspan="4" style="text-align: center; color: #ef4444; padding: 24px;">
                            Failed to load organizations. Please ensure your ngrok tunnel is live.
                        </td>
                    </tr>
                `;
            }
        }
    }

    // Render table rows with the dropdown action menu
    function render(data) {
        if (!tableBody) return;
        tableBody.innerHTML = '';

        if (!data || data.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="4" style="text-align: center; color: #6b7280; padding: 24px;">
                        No organizations found.
                    </td>
                </tr>
            `;
            return;
        }

        data.forEach(org => {
            const name = org.orgName || org.name || 'Unnamed Store';
            const description = org.orgDescription || org.description || 'No description provided';
            const isVerified = org.verified ?? false;

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td style="font-weight: 600; color: #111827; padding: 14px 16px;">${name}</td>
                <td style="padding: 14px 16px; color: #4b5563; max-width: 320px;">${description}</td>
                <td style="padding: 14px 16px;">
                    ${isVerified 
                        ? `<span style="background-color: #d1fae5; color: #065f46; font-size: 0.75rem; font-weight: 700; padding: 4px 10px; border-radius: 9999px;">• VERIFIED</span>`
                        : `<span style="background-color: #fee2e2; color: #991b1b; font-size: 0.75rem; font-weight: 700; padding: 4px 10px; border-radius: 9999px;">• UNVERIFIED</span>`
                    }
                </td>
                <td class="action-cell" style="padding: 14px 16px;">
                    <button class="manage-btn" onclick="toggleDropdown(event, ${org.id})">
                        Manage ▾
                    </button>
                    <div id="dropdown-${org.id}" class="action-dropdown">
                        <button class="verify-opt" onclick="promptStatusChange(${org.id}, '${name.replace(/'/g, "\\'")}', true)">
                            ✓ Verify
                        </button>
                        <button class="unverify-opt" onclick="promptStatusChange(${org.id}, '${name.replace(/'/g, "\\'")}', false)">
                            ✕ Unverify
                        </button>
                    </div>
                </td>
            `;
            tableBody.appendChild(tr);
        });
    }

    // Modal Trigger
    window.promptStatusChange = (id, name, targetStatus) => {
        closeAllDropdowns();
        pendingAction = { id, name, targetStatus };

        const actionText = targetStatus ? 'Verify' : 'Unverify';
        modalTitle.textContent = `${actionText} Organization`;
        modalMessage.textContent = `Are you sure you want to ${actionText.toLowerCase()} "${name}"?`;
        
        confirmStatusBtn.textContent = actionText;
        confirmStatusBtn.style.backgroundColor = targetStatus ? '#059669' : '#dc2626';

        statusModal.style.display = 'flex';
    };

    // Close Confirmation Modal
    function closeModal() {
        if (statusModal) statusModal.style.display = 'none';
        pendingAction = null;
    }

    if (cancelStatusBtn) cancelStatusBtn.addEventListener('click', closeModal);

    // Call exact PATCH endpoint on confirmation
    if (confirmStatusBtn) {
        confirmStatusBtn.addEventListener('click', async () => {
            if (!pendingAction) return;

            const { id, targetStatus } = pendingAction;
            const token = localStorage.getItem('token') || localStorage.getItem('authToken');

            // Exact route handling:
            // Verify:   PATCH /api/organizations/{id}/verify
            // Unverify: PATCH /api/organizations/{id}/verify?verified=false
            const targetUrl = targetStatus
                ? `${BASE_URL}/api/organizations/${id}/verify`
                : `${BASE_URL}/api/organizations/${id}/verify?verified=false`;

            try {
                confirmStatusBtn.disabled = true;
                confirmStatusBtn.textContent = 'Processing...';

                const res = await fetch(targetUrl, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        'ngrok-skip-browser-warning': 'true',
                        ...(token && { 'Authorization': `Bearer ${token}` })
                    }
                });

                if (!res.ok) throw new Error(`Status update failed with code: ${res.status}`);

                closeModal();
                await loadOrganizations(); // Reload table with updated status
            } catch (err) {
                console.error('Update error:', err);
                alert('Failed to update organization status. Please check server logs.');
            } finally {
                confirmStatusBtn.disabled = false;
            }
        });
    }

    // Search filter across organization name and description
    function handleSearch() {
        if (!searchInput) return;
        const q = searchInput.value.toLowerCase().trim();
        const filtered = organizationsList.filter(o => 
            (o.orgName || o.name || '').toLowerCase().includes(q) ||
            (o.orgDescription || o.description || '').toLowerCase().includes(q)
        );
        render(filtered);
    }

    if (searchBtn) searchBtn.addEventListener('click', handleSearch);
    if (searchInput) searchInput.addEventListener('input', handleSearch);

    // Initial load
    loadOrganizations();
});

// Dropdown Toggling Logic
function toggleDropdown(event, id) {
    event.stopPropagation();
    const dropdown = document.getElementById(`dropdown-${id}`);
    const isVisible = dropdown.classList.contains('show');
    
    closeAllDropdowns();
    
    if (!isVisible) {
        dropdown.classList.add('show');
    }
}

function closeAllDropdowns() {
    document.querySelectorAll('.action-dropdown').forEach(d => d.classList.remove('show'));
}

// Logout Modal and Redirect Logic
function setupLogout() {
    const logoutBtn = document.querySelector('.logout-btn');
    const logoutModal = document.getElementById('logout-modal');
    const cancelLogoutBtn = document.getElementById('cancel-logout');
    const confirmLogoutBtn = document.getElementById('confirm-logout');

    if (logoutBtn && logoutModal && cancelLogoutBtn && confirmLogoutBtn) {
        logoutBtn.addEventListener('click', () => {
            logoutModal.style.display = 'flex';
        });

        cancelLogoutBtn.addEventListener('click', () => {
            logoutModal.style.display = 'none';
        });

        confirmLogoutBtn.addEventListener('click', () => {
            localStorage.removeItem('token');
            window.location.href = 'login.html';
        });

        window.addEventListener('click', (e) => {
            if (e.target === logoutModal) {
                logoutModal.style.display = 'none';
            }
        });
    }
}

// Global click handler to close dropdowns or the status modal backdrop
window.addEventListener('click', (e) => {
    closeAllDropdowns();
    const statusModal = document.getElementById('status-modal');
    if (e.target === statusModal) {
        statusModal.style.display = 'none';
    }
});