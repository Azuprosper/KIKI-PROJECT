const RESET_PASSWORD_API_URL = 'https://kebab-rule-blandness.ngrok-free.dev/api/auth/reset-password';

document.addEventListener('DOMContentLoaded', () => {
    // Grab the inputs using your exact new HTML IDs
    const passwordInput = document.getElementById('new-password-error');
    const confirmPasswordInput = document.getElementById('confirm-password-error');
    const confirmBtn = document.getElementById('login-button');
    const generalError = document.getElementById('general-error'); // Using your distinct error ID

    // Grab the token automatically from the URL query parameters (e.g., ?token=xyz123)
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');

    const handleReset = async () => {
        if (generalError) generalError.textContent = '';

        const password = passwordInput ? passwordInput.value.trim() : '';
        const confirmPassword = confirmPasswordInput ? confirmPasswordInput.value.trim() : '';

        if (password !== confirmPassword) {
            if (generalError) generalError.textContent = "Passwords do not match.";
            return;
        }

        try {
            const response = await fetch(RESET_PASSWORD_API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 
                    token, 
                    password, 
                    confirmPassword 
                })
            });

            const data = await response.json().catch(() => null);

            if (response.ok) {
                window.location.href = 'login.html';
            } else {
                console.log("Full error response object from backend:", data);
                const backendErrorMessage = data?.message || data?.error || data?.token || data?.password;
                if (generalError) {
                    generalError.textContent = backendErrorMessage;
                }
            }

        } catch (error) {
            console.error("Network error during password reset:", error);
            if (generalError) {
                generalError.textContent = "Could not connect to the backend server.";
            }
        }
    };

    if (confirmBtn) {
        confirmBtn.addEventListener('click', (e) => {
            e.preventDefault();
            handleReset();
        });
    }

    if (confirmPasswordInput) {
        confirmPasswordInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                handleReset();
            }
        });
    }
});