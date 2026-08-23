const ACCOUNT_INFO_API_URL = 'https://kebab-rule-blandness.ngrok-free.dev/api/users/me'; 

document.addEventListener('DOMContentLoaded', () => {
    
    // KIKI Logo Converted to work as a link to go back to HomePage { AZU }
    const logoLink = document.getElementById('kiki-logo-link');

    if (logoLink) {
        const userRole = localStorage.getItem('userRole');
        
        const role = userRole ? userRole.toUpperCase() : 'CUSTOMER';
        if (role === 'ORGANIZATION') {
            logoLink.href = 'org-dashboard.html';
        } else if (role === 'ADMIN') {
            
            logoLink.href = 'admin-dashboard.html';
        } else {
            logoLink.href = 'index.html';
        }
    }

});

document.addEventListener('DOMContentLoaded', async () => {
    const firstName = document.getElementById('info-firstname');
    const lastName = document.getElementById('info-lastname');
    const username = document.getElementById('info-username');
    const email = document.getElementById('info-email');
    const phone = document.getElementById('info-phone');

    const authToken = localStorage.getItem('token');
    try {

        const response = await fetch(ACCOUNT_INFO_API_URL, {
            method: 'GET',            
            headers: {
                "Authorization": `Bearer ${authToken}`,            
                "Content-Type": 'application/json',
                "ngrok-skip-browser-warning": "true"  //it skips the CORS browser warning on my console{ AZU }
            }  
        });
        
        const data = await response.json().catch(() => null); //converts the backend's response into a readable JavaScript object.{ AZU }

        if (response.ok && data) {
            if (firstName) firstName.textContent = data.firstName || '';
            if (lastName) lastName.textContent = data.lastName || '';
            if (username) username.textContent = data.username || '';
            if (email) email.textContent = data.email || '';
            if (phone) phone.textContent = data.phoneNumber || data.phone || '';
        } else {
            console.error("Failed to load account info:", data?.message);
            if (response.status === 401) {
                window.location.href = 'login.html';
            }
        }
    } catch (error) {
        console.error("Network error while fetching account info:", error);
    }
});