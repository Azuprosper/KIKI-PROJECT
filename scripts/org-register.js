// Define your backend endpoint constant here
const API_URL = 'https://kebab-rule-blandness.ngrok-free.dev/api/organizations/register';

document.addEventListener('DOMContentLoaded', () => {
    const registerButton = document.getElementById('org-register-button');
    const generalError = document.getElementById('register-error');

    if (registerButton) {
        registerButton.addEventListener('click', async (e) => {
            e.preventDefault();

           // Clear all previous errors before a new attempt
            clearAllErrors();

            const brandName = document.getElementById('org-brand-name').value.trim();
            const brandDescription = document.getElementById('org-description').value.trim();
            const firstName = document.getElementById('register-firstname').value.trim();
            const lastName = document.getElementById('register-lastname').value.trim();
            const username = document.getElementById('register-username').value.trim();
            const email = document.getElementById('register-email').value.trim();
            const phone = document.getElementById('register-phone').value.trim();
            const password = document.getElementById('register-password').value.trim();

            const payload = {
                orgName,
                orgDescription,
                contactFirstName,
                contactLastName,
                username,
                email,
                phoneNumber,
                password,
                role: 'ORGANIZATION'
            };

            try {
                registerButton.disabled = true;
                registerButton.textContent = 'Registering Organization...';

                // Pass the constant variable straight into fetch
                const response = await fetch(API_URL, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(payload)
                });

                const responseText = await response.text();
                const data = responseText ? JSON.parse(responseText) : {};

                if (!response.ok) {
                  throw new Error(data.message || 'Registration failed.');
                }

                window.location.href = 'org-login.html';

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