 
const API_BASE_URL = 'http://localhost:3000'; 

document.addEventListener('DOMContentLoaded', () => {
    fetchDashboardData();
});

async function fetchDashboardData() {
    try {
        // Fetch both endpoints concurrently for faster loading
        const [usersResponse, orgsResponse] = await Promise.all([
            fetch(`${API_BASE_URL}/api/users`),
            fetch(`${API_BASE_URL}/api/organizations`)
        ]);

        if (!usersResponse.ok || !orgsResponse.ok) {
            throw new Error('Failed to fetch data from backend endpoints.');
        }

        const usersData = await usersResponse.json();
        const orgsData = await orgsResponse.json();

        // Update the metrics cards
        document.getElementById('user-count').textContent = usersData.length || 0;
        document.getElementById('org-count').textContent = orgsData.length || 0;

        // Render the users into the table
        renderUserTable(usersData);

    } catch (error) {
        console.error('Error fetching dashboard data:', error);
        
        // Fallback dummy data so you can see the UI design even if the backend is down
        const dummyUsers = [
            { name: 'Ajebolens Test', email: 'ajebo@kiki.com', role: 'ADMIN', status: 'ACTIVE' },
            { name: 'Customer One', email: 'user1@kiki.com', role: 'USER', status: 'ACTIVE' }
        ];
        renderUserTable(dummyUsers);
    }
}

function renderUserTable(users) {
    const tableBody = document.getElementById('user-table-body');
    tableBody.innerHTML = ''; // Clear existing rows

    users.forEach(user => {
        const row = document.createElement('tr');
        
        row.innerHTML = `
            <td><strong>${user.name || 'N/A'}</strong></td>
            <td>${user.email || 'N/A'}</td>
            <td><span class="role-badge">${user.role || 'USER'}</span></td>
            <td><span class="status-dot"></span>${user.status || 'ACTIVE'}</td>
            <td><a href="#" class="action-link">Manage user</a></td>
        `;
        
        tableBody.appendChild(row);
    });
}