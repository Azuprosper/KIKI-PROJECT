import { ORG_PRODUCTS_API_URL, loadMyProducts } from "./org-products.js";
import { API_URL as CHAT_API_URL, toggleChat, appendMessage, handleSend, handleImageUpload } from "./chatbot.js";
// import { loadMyProducts } from "./products.js";

const PRODUCT_API_URL = 'https://kebab-rule-blandness.ngrok-free.dev/api/products';
const UPLOAD_API_URL = 'https://kebab-rule-blandness.ngrok-free.dev/api/uploads/image';


loadMyProducts();

document.addEventListener('DOMContentLoaded', () => {
    
    // --- 1. ACCOUNT DROPDOWN LOGIC ---
    const accountBtn = document.getElementById('account-btn');
    const accountDropdown = document.getElementById('account-dropdown');

    if (accountBtn && accountDropdown) {
        // Toggle dropdown on button click
        accountBtn.addEventListener('click', (event) => {
            event.stopPropagation(); // Stop click from bubbling up to the window
            accountDropdown.style.display = (accountDropdown.style.display === 'block') ? 'none' : 'block';
        });

        // Close dropdown when clicking outside of it
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
        // Open modal
        openBtn.addEventListener('click', () => {
            modal.style.display = 'flex';
        });

        // Close modal via 'X' button
        closeBtn.addEventListener('click', () => {
            modal.style.display = 'none';
        });

        // Close modal when clicking on the dark overlay background
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
            // 1. Clear the authentication data from localStorage
            localStorage.removeItem('token');
            localStorage.removeItem('authToken'); // Just in case you use this key anywhere
            localStorage.removeItem('userRole');

            // 2. Redirect the user back to the login page (or index.html)
            window.location.href = 'login.html';
        });
    }

    // --- 4. IMAGE PREVIEW LOGIC ---
    const imageInput = document.getElementById('product-image');
    const imagePreviewContainer = document.getElementById('image-preview-container');
    const imagePreview = document.getElementById('image-preview');

    if (imageInput) {
        imageInput.addEventListener('change', function(event) {
            // Grab the first file the user selected from their laptop
            const file = event.target.files[0]; 

            if (file) {
                // Create a FileReader to read the image data
                const reader = new FileReader();
                
                reader.onload = function(e) {
                    // Set the image source to the file's data and show the container
                    imagePreview.src = e.target.result;
                    imagePreviewContainer.style.display = 'block';
                }
                
                // Read the file as a data URL
                reader.readAsDataURL(file);
            } else {
                // If they cancel the selection, hide the preview again
                imagePreviewContainer.style.display = 'none';
                imagePreview.src = '';
            }
        });
    }

    // --- 5. SUBMIT NEW PRODUCT LOGIC (UPLOAD IMAGE FIRST, THEN CREATE PRODUCT) ---
    const addProductForm = document.getElementById('add-product-form');

    // Helper: uploads the picked file to Cloudinary via the backend, returns the hosted URL
    async function uploadProductImage(file, token) {
        const formData = new FormData();
        formData.append('file', file); // field name MUST be "file" - backend reads @RequestParam("file")

        const response = await fetch(UPLOAD_API_URL, {
            method: 'POST',
            headers: {
                'ngrok-skip-browser-warning': 'true',
                'Authorization': `Bearer ${token}`
                // No Content-Type here - browser sets multipart boundary automatically
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

            // Target ALL the inputs
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

                // 1. Upload the image first (if one was picked) to get back a real URL
                let imageUrl = null;
                if (imageFile) {
                    submitBtn.textContent = 'Uploading image...';
                    imageUrl = await uploadProductImage(imageFile, token);
                }

                submitBtn.textContent = 'Saving...';

                // 2. Send the normal product payload as JSON, imageUrl now points to Cloudinary
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
                
            } catch (error) {
                console.error('Error adding product:', error);
                alert(error.message);
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = originalBtnText;
            }
        });
    }
    
});