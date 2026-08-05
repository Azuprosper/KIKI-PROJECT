// The exact login endpoint provided by your backend guy
const LOGIN_API_URL = 'http://192.168.0.154:4200/api/auth/login';

// DOMContentLoaded is a built-in browser event that fires as soon as the initial HTML document has been completely loaded and parsed, without waiting for stylesheets, images, and subframes to finish loading.---->AZU

document.addEventListener('DOMContentLoaded', () => {
    
    const usernameInput = document.querySelector('input[type="text"]');
    const passwordInput = document.querySelector('input[type="password"]');
    const loginBtn = document.querySelector('.login-btn'); 

    const login = async () => {
        const username = usernameInput ? usernameInput.value.trim() : '';
        const password = passwordInput ? passwordInput.value.trim() : '';

        // Simple validation check
        if (!username || !password) {
            alert("Please enter both username and password!");
            return;
        }

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
                
                alert("Login successful!");
                
                // Redirect back to your main shop page
                window.location.href = 'kiki.html';
            } else {
                // If credentials are wrong or server rejects it
                // alert("Login failed! Please check your username or password.");
                const errorBody = await response.json().catch(() => null);
      const serverMessage = errorBody?.message || errorBody?.password;
                // console.log(response);
                // console.log(errorBody);
                // console.log(serverMessage);
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