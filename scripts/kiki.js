import { API_URL, loadProducts } from "./products.js";

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

    // Trigger when clicking the search button
    if (searchBtn) {
        searchBtn.addEventListener('click', performSearch);
    }

    // Trigger when pressing "Enter" inside the input field
    if (searchInput) {
        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                performSearch();
            }
        });
    }
});