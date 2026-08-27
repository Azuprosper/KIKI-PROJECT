import { ORG_PRODUCTS_API_URL, PRODUCT_BASE_URL, loadMyProducts, allProducts, renderProducts, updateAllProducts } from "./org-products.js";
import { API_URL as CHAT_API_URL, toggleChat, appendMessage, handleSend, handleImageUpload } from "./chatbot.js";

const PRODUCT_API_URL = 'https://kebab-rule-blandness.ngrok-free.dev/api/products';
const UPLOAD_API_URL = 'https://kebab-rule-blandness.ngrok-free.dev/api/products/image';
const ORG_PROFILE_API_URL = 'https://kebab-rule-blandness.ngrok-free.dev/api/organizations/me';

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

    const modal = document.getElementById('product-modal');
    const openBtn = document.getElementById('open-add-product-modal');
    const closeBtn = document.getElementById('close-modal');

    if (modal && openBtn && closeBtn) {
        openBtn.addEventListener('click', () => {
            const form = document.getElementById('add-product-form');
            if (form) form.reset();

            document.getElementById('product-modal').classList.remove('is-update-layout');
            document.getElementById('edit-product-id').value = ''; 
            document.getElementById('image-preview-container').style.display = 'none';
            document.getElementById('image-preview').src = '';
            
            document.querySelector('#product-modal h2').textContent = 'Add New Product';
            document.querySelector('.modal-submit-btn').textContent = 'Save Product';

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

    const logoutBtn = document.getElementById('logout-btn');

    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('token');
            localStorage.removeItem('authToken'); 
            localStorage.removeItem('userRole');
            window.location.href = 'login.html';
        });
    }

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

                const token = localStorage.getItem('token') || localStorage.getItem('authToken');
                
                const editProductId = document.getElementById('edit-product-id').value;
                const isUpdating = editProductId !== "";
                
                const endpointUrl = isUpdating ? `${PRODUCT_API_URL}/${editProductId}` : PRODUCT_API_URL;
                const requestMethod = isUpdating ? 'PUT' : 'POST';

                let imageUrl = null;
                if (imageFile) {
                    submitBtn.textContent = 'Uploading image...';
                    imageUrl = await uploadProductImage(imageFile, token);
                }

                submitBtn.textContent = isUpdating ? 'Updating...' : 'Saving...';

                const payload = {
                    name: nameInput.value.trim(),
                    description: descInput.value.trim(),
                    price: priceInput.value.trim(),
                    stockQuantity: stockInput.value.trim()
                };

                if (imageUrl) {
                    payload.imageUrl = imageUrl;
                } else if (isUpdating) {
                    const existingProduct = allProducts.find(p => String(p.id) === String(editProductId));
                    if (existingProduct && existingProduct.imageUrl) {
                        payload.imageUrl = existingProduct.imageUrl;
                    }
                }

                const response = await fetch(endpointUrl, {
                    method: requestMethod,
                    headers: {
                        'ngrok-skip-browser-warning': 'true',
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(payload)
                });

                const responseText = await response.text();
                const data = responseText ? JSON.parse(responseText) : {};

                if (!response.ok) {
                    throw new Error(data.message);
                }
                
                addProductForm.reset();
                document.getElementById('edit-product-id').value = '';
                document.getElementById('product-image').required = true; 
                document.getElementById('image-preview-container').style.display = 'none';
                document.getElementById('product-modal').style.display = 'none';
                
                if (typeof loadMyProducts === "function") {
                    loadMyProducts();
                }
                
            } catch (error) {
                console.error('Error processing product:', error);
                alert(error.message);
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = originalBtnText;
            }
        });
    }

    // FETCH AND DISPLAY ORG NAME IN HEADER 
    async function loadOrganizationProfile() {
        const token = localStorage.getItem('token') || localStorage.getItem('authToken');
        if (!token) return;

        try {
            const response = await fetch(ORG_PROFILE_API_URL, {
                method: 'GET',
                headers: {
                    'ngrok-skip-browser-warning': 'true',
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const orgData = await response.json();
                const taglineElement = document.getElementById('header-tagline');
                
                if (taglineElement) {
                    const storeName = orgData.name || orgData.orgName;
                    taglineElement.textContent = storeName.toUpperCase();
                }
            }
        } catch (error) {
            console.error('Error fetching org profile:', error);
        }
    }

    loadOrganizationProfile();

    const searchInput = document.getElementById('search-bar'); 
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase().trim();
            const filteredProducts = allProducts.filter(product => {
                return product.name.toLowerCase().includes(searchTerm);
            });
            renderProducts(filteredProducts);
        });
    }

    // --- DELETE MODAL LOGIC ---
    let productToDeleteId = null; 
    const deleteModal = document.getElementById('delete-confirm-modal');
    const cancelDeleteBtn = document.getElementById('cancel-delete-btn');
    const confirmDeleteBtn = document.getElementById('confirm-delete-btn');

    if (cancelDeleteBtn) {
        cancelDeleteBtn.addEventListener('click', () => {
            if (deleteModal) deleteModal.style.display = 'none';
            productToDeleteId = null; 
        });
    }

if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener('click', async () => {
            if (!productToDeleteId) return;

            try {
                confirmDeleteBtn.textContent = 'Deleting...';
                confirmDeleteBtn.disabled = true;
                
                const token = localStorage.getItem('token') || localStorage.getItem('authToken');

                const response = await fetch(`${PRODUCT_API_URL}/${productToDeleteId}`, {
                    method: 'DELETE',
                    headers: {
                        'ngrok-skip-browser-warning': 'true',
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json' 
                    }
                });

                if (!response.ok) {
                 
                    let backendMessage = 'Failed to delete the product.';
                    try {
                        const errorData = await response.json();
                        backendMessage = errorData.message || backendMessage;
                    } catch (e) {
                        backendMessage = `Server Error: ${response.status}`;
                    }
                    throw new Error(backendMessage);
                }

                // If SUCCESSFUL: filter, update, render, and close
                const newProducts = allProducts.filter(product => String(product.id) !== String(productToDeleteId));
                updateAllProducts(newProducts);
                renderProducts(newProducts);
                
                if (deleteModal) deleteModal.style.display = 'none';
                
                // ONLY clear the ID if the deletion actually worked { AZU }
                productToDeleteId = null;

            } catch (error) {
                console.error("Error deleting product:", error);
                alert(`Cannot delete: ${error.message}`); 
            } finally {
                
                confirmDeleteBtn.textContent = 'Yes, Delete';
                confirmDeleteBtn.disabled = false;
            }
        });
    }

    // --- MAIN GRID CLICK LISTENER (EDIT & DELETE TRIGGER) ---
    document.addEventListener('click', async (e) => {
        
        if (e.target.classList.contains('delete-product-btn')) {
            productToDeleteId = e.target.getAttribute('data-id');
            if (deleteModal) deleteModal.style.display = 'flex';
        } 
        
        else if (e.target.classList.contains('update-product-btn')) {
            const productId = e.target.getAttribute('data-id');
            
            const product = allProducts.find(p => String(p.id) === String(productId));
            if (!product) return;

            document.getElementById('edit-product-id').value = product.id;
            document.querySelector('input[placeholder="Product Name"]').value = product.name;
            document.querySelector('textarea[placeholder="Product Description"]').value = product.description;
            document.querySelector('input[placeholder="Price ($)"]').value = product.price;
            document.querySelector('input[placeholder="Stock Quantity"]').value = product.stockQuantity;

            const previewContainer = document.getElementById('image-preview-container');
            const previewImage = document.getElementById('image-preview');
            previewImage.src = product.imageUrl || 'images/kiki-logo.webp';
            previewContainer.style.display = 'block';

            document.querySelector('#product-modal h2').textContent = 'Update Product';
            document.querySelector('.modal-submit-btn').textContent = 'Update Product';
            document.getElementById('product-image').required = false;

            document.getElementById('product-modal').classList.add('is-update-layout');
            
            document.getElementById('product-modal').style.display = 'flex';
        }
    });
    
});