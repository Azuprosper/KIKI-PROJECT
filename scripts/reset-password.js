const RESET_PASSWORD_API_URL = 'https://kebab-rule-blandness.ngrok-free.dev/api/auth/reset-password';
const VALIDATE_TOKEN_API_URL = 'https://kebab-rule-blandness.ngrok-free.dev/api/auth/reset-password/validate';

document.addEventListener('DOMContentLoaded', async () => {
    const passwordInput = document.getElementById('new-password-error');
    const confirmPasswordInput = document.getElementById('confirm-password-error');
    const confirmBtn = document.getElementById('login-button');
    const generalError = document.getElementById('general-error'); 

    // Grab the token automatically from the URL query parameters{ for future references }
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');

    

    if (!token) {
        
        if (confirmBtn) confirmBtn.disabled = true;
    } else {
        try {
            const validateResponse = await fetch(`${VALIDATE_TOKEN_API_URL}?token=${encodeURIComponent(token)}`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });

            // Let's check what the server actually sends back
            const responseText = await validateResponse.text();
            let validateData;
            try {
                validateData = JSON.parse(responseText);
            } catch (e) {
                validateData = responseText;
            }

            if (!validateResponse.ok) {
                const errorMsg = typeof validateData === 'object' ? (validateData?.message || validateData?.error) : validateData;
                if (generalError) generalError.textContent = errorMsg || "Invalid or expired reset link.";
                if (confirmBtn) confirmBtn.disabled = true; 
            } else {
                console.log("Token validation successful:", validateData);
            }
        } catch (error) {
           
            console.error("Detailed validation network/CORS error:", error);
           
        }
    }

    
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
                const backendErrorMessage = data?.message || data?.error || data?.token || data?.password || "Password reset failed.";
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