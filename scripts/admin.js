const API_BASE_URL = 'https://kebab-rule-blandness.ngrok-free.dev';

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
    fetchDashboardMetrics();
});

async function fetchDashboardMetrics() {
    try {
        const token = localStorage.getItem('token'); 

        const fetchOptions = {
            headers: {
                'ngrok-skip-browser-warning': 'true',
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` 
            }
        };

        const [summaryRes, usersRes, orgsRes] = await Promise.all([
            fetch(`${API_BASE_URL}/api/admin/summary`, fetchOptions),
            fetch(`${API_BASE_URL}/api/admin/users`, fetchOptions),
            fetch(`${API_BASE_URL}/api/admin/organizations`, fetchOptions)
        ]);

        if (!summaryRes.ok) {
            throw new Error('Failed to fetch dashboard metrics. Check token.');
        }

        const summaryData = await summaryRes.json();
        const rawUsers = usersRes.ok ? await usersRes.json() : {};
        const rawOrgs = orgsRes.ok ? await orgsRes.json() : {};

        const usersCount = summaryData.totalUsers || rawUsers.totalElements || (Array.isArray(rawUsers) ? rawUsers.length : (rawUsers.content?.length || 0));
        const orgsCount = summaryData.totalOrganizations || rawOrgs.totalElements || (Array.isArray(rawOrgs) ? rawOrgs.length : (rawOrgs.content?.length || 0));

        // --- 1. Financial Metrics ---
        document.getElementById('revenue-all-time').textContent = `$${summaryData.salesAllTime?.totalRevenue?.toLocaleString() || 0}`;
        document.getElementById('sales-all-time-units').textContent = `${summaryData.salesAllTime?.unitsSold || 0} units | ${summaryData.salesAllTime?.orderCount || 0} orders`;

        document.getElementById('revenue-month').textContent = `$${summaryData.salesThisMonth?.totalRevenue?.toLocaleString() || 0}`;
        document.getElementById('sales-month-units').textContent = `${summaryData.salesThisMonth?.unitsSold || 0} units | ${summaryData.salesThisMonth?.orderCount || 0} orders`;

        document.getElementById('revenue-today').textContent = `$${summaryData.salesToday?.totalRevenue?.toLocaleString() || 0}`;
        document.getElementById('sales-today-units').textContent = `${summaryData.salesToday?.unitsSold || 0} units | ${summaryData.salesToday?.orderCount || 0} orders`;

        document.getElementById('total-checkouts').textContent = summaryData.totalCheckouts || 0;

        // --- 2. Platform Counts ---
        document.getElementById('user-count').textContent = usersCount;
        document.getElementById('org-count').textContent = orgsCount;
        document.getElementById('org-stats').textContent = `${summaryData.verifiedOrganizations || 0} Verified | ${summaryData.unverifiedOrganizations || 0} Unverified`;
        document.getElementById('product-count').textContent = summaryData.totalProducts || 0;

    } catch (error) {
        console.error('Metrics Load Error:', error);
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