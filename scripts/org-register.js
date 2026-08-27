const API_URL = 'https://kebab-rule-blandness.ngrok-free.dev/api/organizations/register';

document.addEventListener('DOMContentLoaded', () => {
    const registerButton = document.getElementById('org-register-button');
    const generalError = document.getElementById('register-error');

    if (registerButton) {
        registerButton.addEventListener('click', async (e) => {
            e.preventDefault();

            // 1. Clear ALL previous errors first { AZU }
            document.querySelectorAll('.error-message').forEach(div => {
                div.textContent = '';
            });

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
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'ngrok-skip-browser-warning': 'true'
                    },
                    body: JSON.stringify(payload)
                });

                const responseText = await response.text();
                const data = responseText ? JSON.parse(responseText) : {};

                if (!response.ok) {
                    
                    const errorMap = {
                        orgName: 'js-brand-name',
                        orgDescription: 'js-org-description',
                        contactFirstName: 'js-firstname',
                        contactLastName: 'js-lastname',
                        username: 'js-username',
                        email: 'js-email',
                        phoneNumber: 'js-number',
                        password: 'js-password'
                    };

                    let hasFieldErrors = false;
                    
                   
                    const fieldErrors = data.errors || data; 

                  
                    for (const [backendField, domId] of Object.entries(errorMap)) {
                        if (fieldErrors[backendField]) {
                            const errorDiv = document.getElementById(domId);
                            if (errorDiv) {
                                errorDiv.textContent = fieldErrors[backendField];
                                errorDiv.style.color = 'red';
                                hasFieldErrors = true;
                            }
                        }
                    }

              
                    if (hasFieldErrors) {
                        throw new Error("VALIDATION_FAILED");
                    } else {
                        throw new Error(data.message || "Registration failed. Please check your inputs.");
                    }
                }

               
                window.location.href = 'login.html';

            } catch (error) {
                
                if (error.message !== "VALIDATION_FAILED" && generalError) {
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