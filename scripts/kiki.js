import { API_URL as PRODUCT_API_URL, loadProducts } from "./products.js";
import { API_URL as CHAT_API_URL, toggleChat, appendMessage, handleSend, handleImageUpload } from "./chatbot.js";

// Load products initially
loadProducts();

// ----------------------------------------------------
// Cart Badge Logic
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
    console.log(`Added product ${productId} to cart. Total items: ${cartQuantity}`);
}

// ----------------------------------------------------
// Event Listeners Setup
// ----------------------------------------------------
const accountBtn = document.getElementById('account-btn');
const dropdown = document.getElementById('account-dropdown');

if (accountBtn && dropdown) {
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
}

document.addEventListener('DOMContentLoaded', () => {
    // Initialize cart badge counter on page load
    updateCartBadgeUI();

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
});

// Event delegation for "Add to Cart" clicks across dynamically loaded product cards
document.addEventListener('click', (event) => {
    const addToCartBtn = event.target.closest('.add-to-cart-button, .js-add-to-cart');
    if (addToCartBtn) {
        const productId = addToCartBtn.dataset.productId || "unknown";
        addToCart(productId);
    }
});

// ----------------------------------------------------
// Authentication / Logout
// ----------------------------------------------------
const logoutBtn = document.getElementById('logout-btn');

if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('token');
        localStorage.removeItem('authToken');
        
        // Redirect to the login page
        window.location.href = 'login.html';
    });
}