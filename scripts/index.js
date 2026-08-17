import { API_URL as PRODUCT_API_URL, loadProducts } from "./products.js";
import { API_URL as CHAT_API_URL, toggleChat, appendMessage, handleSend, handleImageUpload } from "./chatbot.js";

// Load products initially
loadProducts();

// ----------------------------------------------------
// 1. Cart Badge Logic (Restored from kiki.js)
// ----------------------------------------------------
let cartQuantity = parseInt(localStorage.getItem('cartQuantity')) || 0;

function updateCartBadgeUI() {
    const cartQuantityElement = document.querySelector('.cart-quantity');
    if (cartQuantityElement) {
        cartQuantityElement.textContent = cartQuantity;
    }
}

function addToCart(productId, quantity = 1) {
    cartQuantity += quantity;
    localStorage.setItem('cartQuantity', cartQuantity);
    updateCartBadgeUI();
}

// ----------------------------------------------------
// 2. Account Dropdown Logic
// ----------------------------------------------------
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

// ----------------------------------------------------
// 3. DOM Content Loaded Initialization
// ----------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
    updateCartBadgeUI();

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
    }

    // Dynamic Header & Role Management (From index.js)
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
        if (guestHeaderActions) guestHeaderActions.style.display = 'none';
        if (loggedInHeaderActions) loggedInHeaderActions.style.display = 'inline-block';
        if (loggedInCart) loggedInCart.style.display = 'flex';

        if ((userRole === 'ORGANIZATION' || userRole === 'ORG') && dropdownSellOption) {
            dropdownSellOption.style.display = 'none';
        }
    }
});

// ----------------------------------------------------
// 4. Add to Cart Delegation (Restored from kiki.js)
// ----------------------------------------------------
document.addEventListener('click', (event) => {
    const addToCartBtn = event.target.closest('.add-to-cart-button, .js-add-to-cart');
    if (addToCartBtn) {
        const productId = addToCartBtn.dataset.productId || "unknown";
        addToCart(productId);
    }
});

// ----------------------------------------------------
// 5. Logout Handling
// ----------------------------------------------------
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