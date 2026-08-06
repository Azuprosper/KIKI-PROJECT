// TODO: Replace with your exact backend endpoint for fetching user profile details
const ACCOUNT_INFO_API_URL = 'https://kebab-rule-blandness.ngrok-free.dev/api/users/me'; // Or whatever your backend route is called

document.addEventListener('DOMContentLoaded', async () => {
    // Grabbing the read-only input elements from your HTML
    const firstNameInput = document.getElementById('register-firstname');
    const lastNameInput = document.getElementById('register-lastname');
    const usernameInput = document.getElementById('register-username');
    const emailInput = document.getElementById('register-email');
    const phoneInput = document.getElementById('register-phone');

    // Retrieve the auth token saved during login (adjust the key if your app uses something else like 'token' or 'jwt')
    const authToken = localStorage.getItem('token') || localStorage.getItem('authToken');

    try {
        const response = await fetch(ACCOUNT_INFO_API_URL, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                // Send the token so the backend knows who is requesting their data
                ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {})
            }
        });

        const data = await response.json().catch(() => null);

        if (response.ok && data) {
            // Populate the input fields with the data coming from the backend
            // (Adjust property names like data.phoneNumber if your backend names them differently)
            if (firstNameInput) firstNameInput.value = data.firstName || '';
            if (lastNameInput) lastNameInput.value = data.lastName || '';
            if (usernameInput) usernameInput.value = data.username || '';
            if (emailInput) emailInput.value = data.email || '';
            if (phoneInput) phoneInput.value = data.phoneNumber || data.phone || '';
        } else {
            console.error("Failed to load account info:", data?.message || "Unauthorized or error fetching profile.");
            // Optional: redirect to login if unauthorized
            if (response.status === 401) {
                window.location.href = 'login.html';
            }
        }

    } catch (error) {
        console.error("Network error while fetching account info:", error);
    }
});