const API_URL = 'https://kebab-rule-blandness.ngrok-free.dev/api/organizations/register';

document.addEventListener('DOMContentLoaded', () => {
    const registerButton = document.getElementById('org-register-button');
    const generalError = document.getElementById('register-error');

    if (registerButton) {
        registerButton.addEventListener('click', async (e) => {
            e.preventDefault();

            if (generalError) generalError.textContent = '';

            const payload = {
                orgName: document.getElementById('org-brand-name').value.trim(),
                orgDescription: document.getElementById('org-description').value.trim(),
                contactFirstName: document.getElementById('register-firstname').value.trim(),
                contactLastName: document.getElementById('register-lastname').value.trim(),
                username: document.getElementById('register-username').value.trim(),
                email: document.getElementById('register-email').value.trim(),
                phoneNumber: document.getElementById('register-phone').value.trim(),
                password: document.getElementById('register-password').value.trim()
            };

            try {
                registerButton.disabled = true;
                registerButton.textContent = 'Registering Organization...';

                const response = await fetch(API_URL, {
                    method: 'POST', // Must be POST
                    headers: {
                        'Content-Type': 'application/json',
                        'ngrok-skip-browser-warning': 'true' // Prevents ngrok from blocking JSON payload requests
                    },
                    body: JSON.stringify(payload)
                });

                const responseText = await response.text();
                const data = responseText ? JSON.parse(responseText) : {};

                if (!response.ok) {
                    throw new Error(data.message || 'Registration failed.');
                }

                window.location.href = 'login.html';

            } catch (error) {
                if (generalError) {
                    generalError.textContent = error.message;
                    generalError.style.color = 'red';
                }
            } finally {
                registerButton.disabled = false;
                registerButton.textContent = 'Register Organization';
            }
        });
    }
});