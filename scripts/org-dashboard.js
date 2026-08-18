import { ORG_PRODUCTS_API_URL, loadMyProducts } from "./org-products.js";

const BASE_API_URL = 'https://kebab-rule-blandness.ngrok-free.dev';
const PRODUCT_API_URL = `${BASE_API_URL}/products`;
const UPLOAD_API_URL = `${BASE_API_URL}/uploads/image`;
// 1. Update the base URL for your local organization endpoints
const ORG_API_URL = 'https://cut-unjustly-ellipse.ngrok-free.dev';

const REPORT_API_URL = `${ORG_API_URL}/organization/reports/weekly/random_seller`;


// Load initial products list
loadMyProducts();

document.addEventListener('DOMContentLoaded', () => {
    
    // --- 1. ACCOUNT DROPDOWN LOGIC ---
    const accountBtn = document.getElementById('account-btn');
    const accountDropdown = document.getElementById('account-dropdown');

    if (accountBtn && accountDropdown) {
        accountBtn.addEventListener('click', (event) => {
            event.stopPropagation();
            accountDropdown.style.display = (accountDropdown.style.display === 'block') ? 'none' : 'block';
        });

        window.addEventListener('click', (event) => {
            if (accountDropdown.style.display === 'block' && !accountBtn.contains(event.target) && !accountDropdown.contains(event.target)) {
                accountDropdown.style.display = 'none';
            }
        });
    }

    // --- 2. MODAL LOGIC ---
    const modal = document.getElementById('product-modal');
    const openBtn = document.getElementById('open-add-product-modal');
    const closeBtn = document.getElementById('close-modal');

    if (modal && openBtn && closeBtn) {
        openBtn.addEventListener('click', () => {
            modal.style.display = 'flex';
        });

        closeBtn.addEventListener('click', () => {
            modal.style.display = 'none';
        });

        window.addEventListener('click', (event) => {
            if (event.target === modal) {
                modal.style.display = 'none';
            }
        });
    }

    // --- 3. LOGOUT LOGIC ---
    const logoutBtn = document.getElementById('logout-btn');

    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('token');
            localStorage.removeItem('authToken');
            localStorage.removeItem('userRole');
            window.location.href = 'login.html';
        });
    }

    // --- 4. IMAGE PREVIEW LOGIC ---
    const imageInput = document.getElementById('product-image');
    const imagePreviewContainer = document.getElementById('image-preview-container');
    const imagePreview = document.getElementById('image-preview');

    if (imageInput) {
        imageInput.addEventListener('change', function(event) {
            const file = event.target.files[0]; 

            if (file) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    imagePreview.src = e.target.result;
                    imagePreviewContainer.style.display = 'block';
                }
                reader.readAsDataURL(file);
            } else {
                imagePreviewContainer.style.display = 'none';
                imagePreview.src = '';
            }
        });
    }

    // --- 5. SUBMIT NEW PRODUCT LOGIC ---
    const addProductForm = document.getElementById('add-product-form');

    async function uploadProductImage(file, token) {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch(UPLOAD_API_URL, {
            method: 'POST',
            headers: {
                'ngrok-skip-browser-warning': 'true',
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });

        const responseText = await response.text();
        const data = responseText ? JSON.parse(responseText) : {};

        if (!response.ok) {
            throw new Error(data.message || 'Failed to upload image.');
        }

        return data.imageUrl;
    }

    if (addProductForm) {
        addProductForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const nameInput = document.querySelector('input[placeholder="Product Name"]');
            const descInput = document.querySelector('textarea[placeholder="Product Description"]');
            const priceInput = document.querySelector('input[placeholder="Price ($)"]');
            const stockInput = document.querySelector('input[placeholder="Stock Quantity"]');
            const imageFile = document.getElementById('product-image').files[0];

            const submitBtn = addProductForm.querySelector('button[type="submit"]');
            const originalBtnText = submitBtn.textContent;

            try {
                submitBtn.disabled = true;
                submitBtn.textContent = 'Saving...';

                const token = localStorage.getItem('token');

                let imageUrl = null;
                if (imageFile) {
                    submitBtn.textContent = 'Uploading image...';
                    imageUrl = await uploadProductImage(imageFile, token);
                }

                submitBtn.textContent = 'Saving...';

                const response = await fetch(PRODUCT_API_URL, {
                    method: 'POST',
                    headers: {
                        'ngrok-skip-browser-warning': 'true',
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        name: nameInput.value.trim(),
                        description: descInput.value.trim(),
                        price: priceInput.value.trim(),
                        stockQuantity: stockInput.value.trim(),
                        imageUrl: imageUrl
                    })
                });

                const responseText = await response.text();
                const data = responseText ? JSON.parse(responseText) : {};

                if (!response.ok) {
                    throw new Error(data.message || 'Failed to add product.');
                }

                alert('Product added successfully!');
                
                addProductForm.reset();
                document.getElementById('image-preview-container').style.display = 'none';
                document.getElementById('image-preview').src = '';
                document.getElementById('product-modal').style.display = 'none';
                
                // Refresh product listing
                loadMyProducts();
                
            } catch (error) {
                console.error('Error adding product:', error);
                alert(error.message);
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = originalBtnText;
            }
        });
    }

    // --- 6. AI WEEKLY SALES REPORT LOGIC ---
    const reportBtn = document.getElementById('generate-report-btn');
    const loadingDiv = document.getElementById('report-loading');
    const outputDiv = document.getElementById('report-output');

    if (reportBtn) {
        reportBtn.addEventListener('click', async () => {
            reportBtn.disabled = true;
            loadingDiv.style.display = 'block';
            outputDiv.style.display = 'none';

            try {
                const token = localStorage.getItem('token') || localStorage.getItem('authToken');
                const response = await fetch(REPORT_API_URL, {
                    method: 'GET',
                    headers: {
                        'ngrok-skip-browser-warning': 'true',
                        'Authorization': `Bearer ${token}`
                    }
                });

                const responseText = await response.text();
                const data = responseText ? JSON.parse(responseText) : {};

                if (!response.ok) {
                    throw new Error(data.message || 'Failed to generate report.');
                }

                outputDiv.innerText = data.ai_report || data.report || 'No content generated.';
                outputDiv.style.display = 'block';

            } catch (error) {
                console.error('Report Generation Error:', error);
                outputDiv.innerText = `❌ Error: ${error.message}`;
                outputDiv.style.display = 'block';
            } finally {
                reportBtn.disabled = false;
                loadingDiv.style.display = 'none';
            }
        });
    }
    
});