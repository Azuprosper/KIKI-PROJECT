import { API_URL as PRODUCT_API_URL, loadProducts } from "./products.js";
import { API_URL as CHAT_API_URL, toggleChat, appendMessage, handleSend, handleImageUpload } from "./chatbot.js";
// You might need to adjust the path depending on where cart-api.js is saved!
import { addToCart } from "../cart/cart-api.js";

loadProducts();


const accountBtn = document.getElementById('account-btn');
const dropdown = document.getElementById('account-dropdown');

if (accountBtn && dropdown) {
    accountBtn.addEventListener('click', (e) => {
        e.stopPropagation(); //This stops the click from "bubbling up" to the rest of the page. Without this, the click would immediately trigger the window listener below it and close the menu instantly { AI ASSISTED ME }
        dropdown.classList.toggle('show');
    });

    window.addEventListener('click', () => {
        if (dropdown.classList.contains('show')) {
            dropdown.classList.remove('show');
        }
    });
}


document.addEventListener('DOMContentLoaded', () => {
    
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
        // User is logged in { AZU }
        if (guestHeaderActions) guestHeaderActions.style.display = 'none';
        if (loggedInHeaderActions) loggedInHeaderActions.style.display = 'inline-block';
        if (loggedInCart) loggedInCart.style.display = 'flex'; 

        // Hide "Sell with us" if they are already an organization { AZU }
        if ((userRole === 'ORGANIZATION') && dropdownSellOption) {
            dropdownSellOption.style.display = 'none';
        }  
    }
    const productsContainer = document.getElementById('products-container');
        const authModal = document.getElementById('auth-modal');
        const closeModalBtn = document.getElementById('close-auth-modal');

       
       
        const updateCartBadge = () => {
            try {
                const savedCart = localStorage.getItem('kiki_cart_v1');
                if (savedCart) {
                    const data = JSON.parse(savedCart);
                    const items = data.items || [];
                    const totalCount = items.reduce((sum, item) => sum + (item.quantity || 1), 0);
                    const cartBadges = document.querySelectorAll('.cart-quantity');
                    cartBadges.forEach(badge => {
                        badge.textContent = totalCount;
                    });
                }
            } catch (err) {
                console.warn("Could not load cart badge data:", err);
            }
        };

       
        updateCartBadge();

       
       
       if (productsContainer) {
            productsContainer.addEventListener('click', (e) => {
                if (e.target.classList.contains('add-to-cart-btn')) {
                    
                    if (!token) {
                        // Not logged in
                        e.preventDefault(); 
                        e.stopImmediatePropagation(); 
                        if (authModal) authModal.style.display = 'flex';
                    }
                    
                }
            });
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