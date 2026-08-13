const FORGOT_PASSWORD_API_URL = 'https://kebab-rule-blandness.ngrok-free.dev/api/auth/forgot-password';

document.addEventListener('DOMContentLoaded', () => {
    const emailInput = document.getElementById('register-email');
    const submitBtn = document.getElementById('login-button');
    const errorMsg = document.getElementById('login-error');

    const handlePasswordReset = async () => {
        if (errorMsg) errorMsg.textContent = '';

        const email = emailInput ? emailInput.value.trim() : '';

        try {
            const response = await fetch(FORGOT_PASSWORD_API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email })
            });

            // Read response as text
            const responseText = await response.text();
            
            // Parse as JSON safely, or fallback to text string
            let data;
            try {
                data = JSON.parse(responseText);
            } catch (e) {
                data = responseText; 
            }

            if (response.ok) {
                console.log("Password Reset Response / Token Details:", data);
                
                // Extract message whether data is a JSON object or a raw string
                const serverMessage = typeof data === 'object' ? (data?.message || "If an Account exist for the email, reset link has been sent") : data;

                if (errorMsg) {
                    errorMsg.style.color = "black"; 
                    errorMsg.textContent = serverMessage; 
                }
            } else {
                const serverErrorMessage = typeof data === 'object' ? (data?.message || data?.email || "An error occurred.") : data;
                if (errorMsg) {
                    errorMsg.style.color = ""; 
                    errorMsg.textContent = serverErrorMessage;
                }
            }

        } catch (error) {
            console.error("Network error during password reset:", error);
            if (errorMsg) {
                errorMsg.style.color = "";
                errorMsg.textContent = "Could not connect to the backend server.";
            }
        }
    };

    if (submitBtn) {
        submitBtn.addEventListener('click', (e) => {
            e.preventDefault();
            handlePasswordReset();
        });
    }

    if (emailInput) {
        emailInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                handlePasswordReset();
            }
        });
    }
});