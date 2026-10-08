function setupLogout() {
    const logoutBtn = document.querySelector('.logout-btn');
    const modal = document.getElementById('logout-modal');
    const cancelBtn = document.getElementById('cancel-logout');
    const confirmBtn = document.getElementById('confirm-logout');

    if (logoutBtn && modal && cancelBtn && confirmBtn) {
        logoutBtn.addEventListener('click', () => {
            modal.style.display = 'flex';
        });

        cancelBtn.addEventListener('click', () => {
            modal.style.display = 'none';
        });

        confirmBtn.addEventListener('click', () => {
            localStorage.removeItem('token'); 
            window.location.href = 'login.html'; 
        });

        window.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
    }
}