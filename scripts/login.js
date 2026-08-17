// The exact login endpoint provided by your backend guy
const LOGIN_API_URL = 'https://kebab-rule-blandness.ngrok-free.dev/api/auth/login';

// DOMContentLoaded is a built-in browser event that fires as soon as the initial HTML document has been completely loaded and parsed, without waiting for stylesheets, images, and subframes to finish loading.---->AZU

document.addEventListener('DOMContentLoaded', () => {
    
    const usernameInput = document.getElementById('login-username');
    const passwordInput = document.getElementById('login-password');
    const loginBtn = document.getElementById('login-button');

    const login = async () => {
        const username = usernameInput ? usernameInput.value.trim() : '';
        const password = passwordInput ? passwordInput.value.trim() : '';


        try {
            // Send a POST request to your backend login endpoint
            const response = await fetch(LOGIN_API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });

            if (response.ok) {
                // If login is successful, parse the response
                const data = await response.json().catch(() => ({}));

                // 1. Save the token and role to localStorage
                localStorage.setItem("token", data.token);
                if (data.role) {
                    localStorage.setItem('userRole', data.role);
                }
                
                // --- 2. THE TRAFFIC COP: Read the role and redirect ---
                // (We use .toUpperCase() to ensure it matches no matter how the backend formats it)
                const userRole = data.role ? data.role.toUpperCase() : 'CUSTOMER'; 

                if (userRole === 'ORGANIZATION') {
                    // Send sellers to their dedicated dashboard
                    window.location.href = 'org-dashboard.html';
                } else if (userRole === 'ADMIN') {
                    // Send admins to the admin panel
                    window.location.href = 'admin-dashboard.html';
                } else {
                    // Default fallback: Send end-users/customers to the main homepage
                    window.location.href = 'index.html';
                }

            } else {
                // If credentials are wrong or server rejects it
                const errorBody = await response.json().catch(() => null);
                const serverMessage = errorBody?.message || errorBody?.password;
                const message = document.getElementById('login-error');
                
                if (message) {
                    message.textContent = serverMessage || 'Login failed. Please check your credentials.';
                }
            }

        } catch (error) {
            console.error("Network error during login:", error);
            alert("Could not connect to the backend server. Make sure it's running!");
        }
    };

    // Trigger when clicking the login button
    if (loginBtn) {
        loginBtn.addEventListener('click', (e) => {
            e.preventDefault(); // Prevents default form submit behavior if wrapped in a form
            login();
        });
    }

    // Trigger when pressing "Enter" inside the password field
    if (passwordInput) {
        passwordInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                login();
            }
        });
    }
});