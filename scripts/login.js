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
                // If login is successful, parse the response if needed
                const data = await response.json().catch(() => ({}));

                localStorage.setItem("token", data.token)
                
                // alert("Login successful!");
                
                // Redirect back to your main shop page
                window.location.href = 'kiki.html';
            } else {
                // If credentials are wrong or server rejects it
                const errorBody = await response.json().catch(() => null);
      const serverMessage = errorBody?.message || errorBody?.password;
                const message = document.getElementById('login-error')
                message.textContent = serverMessage;
                
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