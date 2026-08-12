import { API_URL as PRODUCT_API_URL, loadProducts } from "./products.js";
import { API_URL as CHAT_API_URL, toggleChat, appendMessage, handleSend, handleImageUpload } from "./chatbot.js";

loadProducts();

const accountBtn = document.getElementById('account-btn');
const dropdown = document.getElementById('account-dropdown');


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
});
 // when logging out {Azu}
const logoutBtn = document.getElementById('logout-btn');

if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('token');
        localStorage.removeItem('authToken');
        
        // Redirect to the login page{Azu}
        window.location.href = 'login.html';
    });
}