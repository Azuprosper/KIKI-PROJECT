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