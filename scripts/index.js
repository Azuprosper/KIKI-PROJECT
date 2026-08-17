import { API_URL as PRODUCT_API_URL, loadProducts } from "./products.js";
import { API_URL as CHAT_API_URL, toggleChat, appendMessage, handleSend, handleImageUpload } from "./chatbot.js";

loadProducts();

const accountBtn = document.getElementById('account-btn');
const dropdown = document.getElementById('account-dropdown');

// Toggle dropdown visibility
accountBtn.addEventListener('click', (e) => {
    e.stopPropagation(); // Prevents the window click event from instantly closing it
    dropdown.classList.toggle('show');
});

// Close the dropdown if the user clicks anywhere outside of it
window.addEventListener('click', () => {
    if (dropdown.classList.contains('show')) {
        dropdown.classList.remove('show');
    }
});

document.addEventListener('DOMContentLoaded', () => {
    const searchBtn = document.querySelector('.search-btn');
    const searchInput = document.querySelector('.search-input');

    // Function to trigger search
    const performSearch = () => {
        if (searchInput) {
            const keyword = searchInput.value;
            loadProducts(keyword);
        }
    };

    if (searchBtn) {
        searchBtn.addEventListener('click', performSearch);
    }

    if (searchInput) {
        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                performSearch();
            }
        });
    }

   // --- DYNAMIC HEADER & DROPDOWN TOGGLE LOGIC ---
    const guestHeaderActions = document.getElementById('guest-header-actions');
    const loggedInHeaderActions = document.getElementById('logged-in-header-actions');
    const loggedInCart = document.getElementById('logged-in-cart');
    const dropdownSellOption = document.getElementById('dropdown-sell-option');

    const token = localStorage.getItem('token') || localStorage.getItem('authToken');
    const userRole = localStorage.getItem('userRole'); // 'ORGANIZATION' or 'CUSTOMER'

    if (!token) {
        // GUEST: Show direct header buttons, hide Account and Cart completely
        if (guestHeaderActions) guestHeaderActions.style.display = 'flex';
        if (loggedInHeaderActions) loggedInHeaderActions.style.display = 'none';
        if (loggedInCart) loggedInCart.style.display = 'none';
    } else {
        // LOGGED IN: Hide guest buttons, show Account dropdown and Cart
        if (guestHeaderActions) guestHeaderActions.style.display = 'none';
        if (loggedInHeaderActions) loggedInHeaderActions.style.display = 'inline-block';
        if (loggedInCart) loggedInCart.style.display = 'flex';

        // If logged in as an Organization, hide "Sell on Kiki" inside the dropdown
        if ((userRole === 'ORGANIZATION' || userRole === 'ORG') && dropdownSellOption) {
            dropdownSellOption.style.display = 'none';
        }
    }
});

// --- LOGOUT HANDLING FOR BOTH CUSTOMER & ORG ---
const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('authToken');
    localStorage.removeItem('userRole');
    
    // Redirect to the login page
    window.location.href = 'login.html';
};

const logoutBtn = document.getElementById('logout-btn');

if (logoutBtn) {
    logoutBtn.addEventListener('click', handleLogout);
}