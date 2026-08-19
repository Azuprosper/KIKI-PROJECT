const LOGIN_API_URL = 'https://kebab-rule-blandness.ngrok-free.dev/api/auth/login';

document.addEventListener('DOMContentLoaded', () => {
    
    // 1. Grab the inputs AND your new specific error divs
    const usernameInput = document.getElementById('login-username');
    const passwordInput = document.getElementById('login-password');
    const loginBtn = document.getElementById('login-button');
    
    const userErrorDiv = document.getElementById('user-error-message');
    const passwordErrorDiv = document.getElementById('password-error-message');
    const generalErrorDiv = document.getElementById('login-error');

    const login = async () => {
        // 2. Clear out any old error messages before sending the new request
        if (userErrorDiv) userErrorDiv.textContent = '';
        if (passwordErrorDiv) passwordErrorDiv.textContent = '';
        if (generalErrorDiv) generalErrorDiv.textContent = '';

        const username = usernameInput ? usernameInput.value.trim() : '';
        const password = passwordInput ? passwordInput.value.trim() : '';

        try {
            const response = await fetch(LOGIN_API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });

            if (response.ok) {
                const data = await response.json().catch(() => ({}));

                localStorage.setItem("token", data.token);
                if (data.role) {
                    localStorage.setItem('userRole', data.role);
                }
                
                const userRole = data.role ? data.role.toUpperCase() : 'CUSTOMER'; 

                if (userRole === 'ORGANIZATION') {
                    window.location.href = 'org-dashboard.html';
                } else if (userRole === 'ADMIN') {
                    window.location.href = 'admin-dashboard.html';
                } else {
                    window.location.href = 'index.html';
                }

            } else {
                // 3. TARGETED ERROR HANDLING
                const errorBody = await response.json().catch(() => null);
                
                if (errorBody) {
                    let handledSpecificError = false;

                    // If the backend sends a specific username error, put it under the username field
                    if (errorBody.username && userErrorDiv) {
                        userErrorDiv.textContent = errorBody.username;
                        handledSpecificError = true;
                    }

                    // If the backend sends a specific password error, put it under the password field
                    if (errorBody.password && passwordErrorDiv) {
                        passwordErrorDiv.textContent = errorBody.password;
                        handledSpecificError = true;
                    }

                    // If it's a general error and not a field-specific one
                    if (errorBody.message && !handledSpecificError && generalErrorDiv) {
                        generalErrorDiv.textContent = errorBody.message;
                    }
                } else {
                    // Fallback if the backend completely fails to send a readable JSON error
                    if (generalErrorDiv) {
                        generalErrorDiv.textContent = 'Login failed. Please check your credentials.';
                    }
                }
            }

        } catch (error) {
            console.error("Network error during login:", error);
            if (generalErrorDiv) {
                generalErrorDiv.textContent = "Could not connect to the backend server!";
            }
        }
    };

    if (loginBtn) {
        loginBtn.addEventListener('click', (e) => {
            e.preventDefault(); 
            login();
        });
    }

    if (passwordInput) {
        passwordInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                login();
            }
        });
    }
});