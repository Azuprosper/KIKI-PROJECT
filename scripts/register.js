const REGISTER_API_URL = 'https://kebab-rule-blandness.ngrok-free.dev/api/auth/register'; 

document.addEventListener('DOMContentLoaded', () => {
    
    const firstNameInput = document.getElementById('register-firstname');
    const lastNameInput = document.getElementById('register-lastname');
    const usernameInput = document.getElementById('register-username');
    const emailInput = document.getElementById('register-email');
    const phoneInput = document.getElementById('register-phone');
    const passwordInput = document.getElementById('register-password');
    const registerButton = document.getElementById('register-button');
    const generalErrorMessage = document.getElementById('register-error');

    
    const errFirstName = document.getElementById('js-firstname');
    const errLastName = document.getElementById('js-lastname');
    const errUsername = document.getElementById('js-username');
    const errEmail = document.getElementById('js-email');
    const errPhoneNumber = document.getElementById('js-number');
    const errPassword = document.getElementById('js-password');

    const clearErrors = () => {
        if (generalErrorMessage) generalErrorMessage.textContent = '';
        if (errFirstName) errFirstName.textContent = '';
        if (errLastName) errLastName.textContent = '';
        if (errUsername) errUsername.textContent = '';
        if (errEmail) errEmail.textContent = '';
        if (errPhoneNumber) errPhoneNumber.textContent = '';
        if (errPassword) errPassword.textContent = '';
    };

    const handleRegister = async () => {
        clearErrors();

        const firstName = firstNameInput ? firstNameInput.value.trim() : '';
        const lastName = lastNameInput ? lastNameInput.value.trim() : '';
        const username = usernameInput ? usernameInput.value.trim() : '';
        const email = emailInput ? emailInput.value.trim() : '';
        const phone = phoneInput ? phoneInput.value.trim() : '';
        const password = passwordInput ? passwordInput.value.trim() : '';

        try {
            const response = await fetch(REGISTER_API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    firstName,
                    lastName,
                    username,
                    email,
                    phoneNumber: phone,
                    password
                })
            });

            if (response.ok) {
             
                window.location.href = 'login.html';
            } else {
              
                const errorBody = await response.json().catch(() => null);

                if (errorBody) {
                    // Get individual field errors messages if they exist in the response{ Azu }
                    if (errorBody.firstName && errFirstName) errFirstName.textContent = errorBody.firstName;
                    if (errorBody.lastName && errLastName) errLastName.textContent = errorBody.lastName;
                    if (errorBody.username && errUsername) errUsername.textContent = errorBody.username;
                    if (errorBody.email && errEmail) errEmail.textContent = errorBody.email;
                    if (errorBody.phoneNumber && errPhoneNumber) errPhoneNumber.textContent = errorBody.phoneNumber;
                    if (errorBody.password && errPassword) errPassword.textContent = errorBody.password;

                    // Fallback general message if backend sends a general error string{Azu}
                    if (errorBody.message && generalErrorMessage) {
                        generalErrorMessage.textContent = errorBody.message;
                    }
                } else {
                    if (generalErrorMessage) generalErrorMessage.textContent = "Registration failed. Please try again.";
                }
            }

        } catch (error) {
            console.error("Network error during registration:", error);
            if (generalErrorMessage) {
                generalErrorMessage.textContent = "Could not connect to the backend server.";
            }
        }
    };

    if (registerButton) {
        registerButton.addEventListener('click', (e) => {
            e.preventDefault(); //prevents the page from automatically refreshing {AZU}
            handleRegister();
        });
    }

    if (passwordInput) {
        passwordInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault(); //prevents the page from automatically refreshing {AZU}
                handleRegister();
            }
        });
    }
});