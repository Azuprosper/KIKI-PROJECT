import { ORG_PRODUCTS_API_URL, PRODUCT_BASE_URL, loadMyProducts, allProducts, renderProducts, updateAllProducts } from "./org-products.js";
import { API_URL as CHAT_API_URL, toggleChat, appendMessage, handleSend, handleImageUpload } from "./chatbot.js";

/* ── BASE URL DEFINITIONS ── */
const PRODUCT_API_URL = 'https://kebab-rule-blandness.ngrok-free.dev/api/products';
// we changed upload_api_url
const UPLOAD_API_URL = 'https://kebab-rule-blandness.ngrok-free.dev/api/products/image';
const ORG_PROFILE_API_URL = 'https://kebab-rule-blandness.ngrok-free.dev/api/organizations/me';

// Java backend summary endpoint
const ORG_SUMMARY_API_URL = 'https://kebab-rule-blandness.ngrok-free.dev/api/organizations/me/summary';

// FastAPI AI engine endpoint
const FASTAPI_REPORT_URL = 'https://cut-unjustly-ellipse.ngrok-free.dev/organization/reports/weekly';

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
                };
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

    // --- 6. ORG PROFILE & SEARCH LOGIC ---
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

    // --- 7. DELETE & UPDATE MODAL HANDLERS ---
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

                const response = await fetch(`${PRODUCT_BASE_URL}/${productToDeleteId}`, {
                    method: 'DELETE',
                    headers: {
                        'ngrok-skip-browser-warning': 'true',
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (!response.ok) throw new Error('Failed to delete the product.');

                const newProducts = allProducts.filter(product => String(product.id) !== String(productToDeleteId));
                updateAllProducts(newProducts);
                renderProducts(newProducts);

                if (deleteModal) deleteModal.style.display = 'none';

            } catch (error) {
                console.error("Error deleting product:", error);
                alert(error.message); 
            } finally {
                confirmDeleteBtn.textContent = 'Yes, Delete';
                confirmDeleteBtn.disabled = false;
                productToDeleteId = null;
            }
        });
    }

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

    // --- 8. AI WEEKLY REPORT GENERATOR LOGIC ---
    const generateReportBtn = document.getElementById('generate-report-btn');
    const reportDisplayArea = document.getElementById('report-output-container');

    if (generateReportBtn) {
        generateReportBtn.addEventListener('click', async () => {
            const originalBtnText = generateReportBtn.textContent;
            
            try {
                generateReportBtn.disabled = true;
                generateReportBtn.textContent = 'Fetching metrics...';

                const token = localStorage.getItem('token') || localStorage.getItem('authToken');

                // Step A: Fetch aggregated store summary from Java Backend
                const summaryResponse = await fetch(ORG_SUMMARY_API_URL, {
                    method: 'GET',
                    headers: {
                        'ngrok-skip-browser-warning': 'true',
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (!summaryResponse.ok) {
                    throw new Error(`Failed to retrieve sales summary (HTTP ${summaryResponse.status})`);
                }

                const javaMetricsJson = await summaryResponse.json();

                generateReportBtn.textContent = 'Generating AI report...';

                // Step B: Wrap the Java JSON to match the FastAPI Pydantic schema
                const pythonPayload = {
                    organization_id: "me", // Or grab this from your decoded JWT if needed
                    seller_id: null,
                    metrics: javaMetricsJson // Nesting the Java response here!
                };

                // Step C: Post compiled JSON payload to FastAPI AI endpoint
                const reportResponse = await fetch(FASTAPI_REPORT_URL, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'ngrok-skip-browser-warning': 'true'
                    },
                    body: JSON.stringify(pythonPayload)
                });

                if (!reportResponse.ok) {
                    throw new Error(`AI Report Service error (HTTP ${reportResponse.status})`);
                }

                const reportResult = await reportResponse.json();
                
                // Step D: Render Markdown Report safely
                if (reportDisplayArea) {
                    const content = reportResult.ai_report || "No report generated.";
                    const htmlOutput = (typeof marked !== 'undefined' && marked.parse) 
                        ? marked.parse(content) 
                        : content;
                    
                    reportDisplayArea.innerHTML = `<div class="ai-report-content">${htmlOutput}</div>`;
                    reportDisplayArea.scrollIntoView({ behavior: 'smooth' });
                } else {
                    alert('Weekly Report Generated Successfully!');
                }

            } catch (error) {
                console.error('Error generating report:', error);
                alert(`Report Generation Failed: ${error.message}`);
            } finally {
                generateReportBtn.disabled = false;
                generateReportBtn.textContent = originalBtnText;
            }
        });
    }

});