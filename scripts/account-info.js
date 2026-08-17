const ACCOUNT_INFO_API_URL = 'https://kebab-rule-blandness.ngrok-free.dev/api/users/me'; 

document.addEventListener('DOMContentLoaded', () => {
    
    // KIKI LOGO ROUTING LOGIC
    const logoLink = document.getElementById('kiki-logo-link');

    if (logoLink) {
        const userRole = localStorage.getItem('userRole');
        // Ensure it is uppercase to match exactly
        const roleString = userRole ? userRole.toUpperCase() : 'CUSTOMER';
        if (roleString === 'ORGANIZATION') {
            // Reroute organizations to their dashboard
            logoLink.href = 'org-dashboard.html';
        } else if (roleString === 'ADMIN') {
            // Reroute admins to the admin panel
            logoLink.href = 'admin-dashboard.html';
        } else {
            logoLink.href = 'index.html';
        }
    }

    // ... the rest of your account page logic ...
});

document.addEventListener('DOMContentLoaded', async () => {
    const firstNameSpan = document.getElementById('info-firstname');
    const lastNameSpan = document.getElementById('info-lastname');
    const usernameSpan = document.getElementById('info-username');
    const emailSpan = document.getElementById('info-email');
    const phoneSpan = document.getElementById('info-phone');

    const authToken = localStorage.getItem('token');
    console.log(authToken);
    try {

        const response = await fetch(ACCOUNT_INFO_API_URL, {
            method: 'GET',            
            headers: {
                "Authorization": `Bearer ${authToken}`,            
                "Content-Type": 'application/json',
                "ngrok-skip-browser-warning": "true"  //it skips the CORS browser warning on my console
            }  
        });
        
        const data = await response.json().catch(() => null);

        if (response.ok && data) {
            if (firstNameSpan) firstNameSpan.textContent = data.firstName || 'N/A';
            if (lastNameSpan) lastNameSpan.textContent = data.lastName || 'N/A';
            if (usernameSpan) usernameSpan.textContent = data.username || 'N/A';
            if (emailSpan) emailSpan.textContent = data.email || 'N/A';
            if (phoneSpan) phoneSpan.textContent = data.phoneNumber || data.phone || 'N/A';
        } else {
            console.error("Failed to load account info:", data?.message || "Unauthorized.");
            if (response.status === 401) {
                window.location.href = 'login.html';
            }
        }
    } catch (error) {
        console.error("Network error while fetching account info:", error);
    }
});