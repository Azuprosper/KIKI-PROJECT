const LOGIN_API_URL = 'https://kebab-rule-blandness.ngrok-free.dev/api/auth/login';

document.addEventListener('DOMContentLoaded', () => {
    
    const usernameInput = document.getElementById('login-username');
    const passwordInput = document.getElementById('login-password');
    const loginBtn = document.getElementById('login-button');
    
    const userErrorDiv = document.getElementById('user-error-message');
    const passwordErrorDiv = document.getElementById('password-error-message');
    const generalErrorDiv = document.getElementById('login-error');

    const login = async () => {
        
        if (userErrorDiv) userErrorDiv.textContent = '';
        if (passwordErrorDiv) passwordErrorDiv.textContent = '';
        if (generalErrorDiv) generalErrorDiv.textContent = '';

        const username = usernameInput ? usernameInput.value.trim() : '';
        const password = passwordInput ? passwordInput.value.trim() : '';

        try {
            const response = await fetch(LOGIN_API_URL, {
                method: 'POST', //cause we're sending data{AZU}
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
                
                const userRole = data.role ? data.role.toUpperCase() : 'CUSTOMER'; //the colon acts as an 'else' condition{AZU}

                if (userRole === 'ORGANIZATION') {
                    window.location.href = 'org-dashboard.html';
                } else if (userRole === 'ADMIN') {
                    window.location.href = 'admin-dashboard.html';
                } else {
                    window.location.href = 'index.html';
                }

            } else {
               
                const errorBody = await response.json().catch(() => null); //If a user types the wrong password. This block catches that rejection and figures out where to display the error {AZU}
                
                if (errorBody) {
                    let handledSpecificError = false; // it checks if we've already shown an error to the user.{AZU}

                    if (errorBody.username && userErrorDiv) {
                        userErrorDiv.textContent = errorBody.username;
                        handledSpecificError = true;
                    }

                    if (errorBody.password && passwordErrorDiv) {
                        passwordErrorDiv.textContent = errorBody.password;
                        handledSpecificError = true;
                    }

                    if (errorBody.message && !handledSpecificError && generalErrorDiv) {
                        generalErrorDiv.textContent = errorBody.message;
                    }
                } else {

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