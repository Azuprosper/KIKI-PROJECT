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

document.addEventListener('DOMContentLoaded', () => {
    const triggerBtn = document.getElementById('trigger-delete-btn');
    const modal = document.getElementById('delete-modal');
    const cancelBtn = document.getElementById('cancel-delete-btn');
    const confirmBtn = document.getElementById('confirm-delete-btn');

    if (triggerBtn && modal) {
        triggerBtn.addEventListener('click', (e) => {
            e.preventDefault();
            modal.classList.remove('delete-acc-hidden');
        });
    }

    if (cancelBtn && modal) {
        cancelBtn.addEventListener('click', () => {
            modal.classList.add('delete-acc-hidden');
        });
    }

    if (confirmBtn) {
        confirmBtn.addEventListener('click', async () => {
            confirmBtn.textContent = 'Deleting...';
            confirmBtn.disabled = true;

            const token = localStorage.getItem('token') || localStorage.getItem('authToken');

            try {
                const response = await fetch('https://kebab-rule-blandness.ngrok-free.dev/api/users/me', {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                        'ngrok-skip-browser-warning': 'true'
                    }
                });

                // if (!response.ok) {
                //     throw new Error('Failed to delete account from server.');
                // }

                localStorage.clear();
                window.location.href = 'index.html'; 

            } catch (error) {
                console.error("Deletion Error:", error);
                
                confirmBtn.textContent = 'Yes, Delete';
                confirmBtn.disabled = false;
                modal.classList.add('delete-acc-hidden');
            }
        });
    }
});