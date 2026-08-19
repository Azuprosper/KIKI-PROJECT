import { API_URL as PRODUCT_API_URL, loadProducts } from "./products.js";
import { API_URL as CHAT_API_URL, toggleChat, appendMessage, handleSend, handleImageUpload } from "./chatbot.js";


loadProducts();

const accountBtn = document.getElementById('account-btn');
const dropdown = document.getElementById('account-dropdown');

if (accountBtn && dropdown) {
    accountBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdown.classList.toggle('show');
    });

    window.addEventListener('click', () => {
        if (dropdown.classList.contains('show')) {
            dropdown.classList.remove('show');
        }
    });
}


document.addEventListener('DOMContentLoaded', () => {
    
    // 1. Search Bar Logic
    const searchBtn = document.querySelector('.search-btn');
    const searchInput = document.querySelector('.search-input');

    const performSearch = () => {
        if (searchInput) {
            const keyword = searchInput.value;
            loadProducts(keyword);
        }
    };

    if (searchBtn) searchBtn.addEventListener('click', performSearch);
    if (searchInput) {
        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') performSearch();
        });

        searchInput.addEventListener('input', (e) => {
            if (e.target.value.trim() === '') {
                loadProducts(); 
            }
        });
    }

   
    const guestHeaderActions = document.getElementById('guest-header-actions');
    const loggedInHeaderActions = document.getElementById('logged-in-header-actions');
    const loggedInCart = document.getElementById('logged-in-cart');
    const dropdownSellOption = document.getElementById('dropdown-sell-option');

    const token = localStorage.getItem('token') || localStorage.getItem('authToken');
    const userRole = localStorage.getItem('userRole');

    if (!token) {
       
        if (guestHeaderActions) guestHeaderActions.style.display = 'flex';
        if (loggedInHeaderActions) loggedInHeaderActions.style.display = 'none';
        if (loggedInCart) loggedInCart.style.display = 'none';
    } else {
        // User is logged in
        if (guestHeaderActions) guestHeaderActions.style.display = 'none';
        if (loggedInHeaderActions) loggedInHeaderActions.style.display = 'inline-block';
        if (loggedInCart) loggedInCart.style.display = 'flex'; 

        // Hide "Sell with us" if they are already an organization
        if ((userRole === 'ORGANIZATION' || userRole === 'ORG') && dropdownSellOption) {
            dropdownSellOption.style.display = 'none';
        }
    }
});


const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('authToken');
    localStorage.removeItem('userRole');
    window.location.href = 'login.html';
};

const logoutBtn = document.getElementById('logout-btn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', handleLogout);
}