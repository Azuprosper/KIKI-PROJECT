export const ORG_PRODUCTS_API_URL = 'https://kebab-rule-blandness.ngrok-free.dev/api/organizations/me/products';
export const PRODUCT_BASE_URL = 'https://kebab-rule-blandness.ngrok-free.dev/api/products';

export let allProducts = [];

export async function loadMyProducts() {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
        const response = await fetch(ORG_PRODUCTS_API_URL, {
            method: 'GET',
            headers: {
                'ngrok-skip-browser-warning': 'true',
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) throw new Error('Failed to fetch products');
        
        allProducts = await response.json();
        renderProducts(allProducts);
        
    } catch (error) {
        console.error('Error loading products:', error);
    }
}

export function renderProducts(products) {
    const mainContainer = document.querySelector('.dashboard-empty-state');
    const emptyIcon = mainContainer.querySelector('.empty-icon');
    const emptyTitle = mainContainer.querySelector('h2');
    const emptyText = mainContainer.querySelector('p');

    let grid = document.getElementById('org-product-grid');
    if (!grid) {
        grid = document.createElement('div');
        grid.id = 'org-product-grid';
        grid.style.display = 'grid';
        grid.style.gridTemplateColumns = 'repeat(auto-fill, minmax(220px, 1fr))';
        grid.style.gap = '20px';
        grid.style.width = '100%';
        grid.style.padding = '20px';
        grid.style.boxSizing = 'border-box';
        mainContainer.appendChild(grid);
    }

    if (products.length === 0) {
        if (emptyIcon) emptyIcon.style.display = 'block';
        if (emptyTitle) {
            emptyTitle.style.display = 'block';
            emptyTitle.textContent = allProducts.length === 0 ? "No Products Yet" : "No matches found";
        }
        if (emptyText) emptyText.style.display = 'block';
        grid.style.display = 'none';

        mainContainer.style.display = 'flex';
        mainContainer.style.height = '70vh';
        mainContainer.style.paddingTop = '0';
    } else {
        if (emptyIcon) emptyIcon.style.display = 'none';
        if (emptyTitle) emptyTitle.style.display = 'none';
        if (emptyText) emptyText.style.display = 'none';
        grid.style.display = 'grid';
        
        mainContainer.style.display = 'block'; 
        mainContainer.style.height = 'auto';
        mainContainer.style.paddingTop = '120px'; 
        
        grid.innerHTML = '';
        
        products.forEach(product => {
            const card = document.createElement('div');
            card.style.border = '1px solid rgba(7, 0, 0, 0.05)';
            card.style.borderRadius = '8px';
            card.style.padding = '15px';
            card.style.backgroundColor = 'white';
            card.style.boxShadow = '0 2px 5px rgba(0,0,0,0.05)';
            
            card.innerHTML = `
                <img src="${product.imageUrl || 'images/kiki-logo.webp'}" alt="${product.name}" style="width: 100%; height: 160px; object-fit: contain; background-color: white; border-radius: 4px; margin-bottom: 10px;">
                <h3 style="margin: 0 0 5px 0; font-size: 18px; color: #333;">${product.name}</h3>
                <p style="color: #1a54bf; font-weight: bold; margin: 0 0 2px 0;">$${product.price}</p>
                <p style="font-size: 13px; color: rgb(117, 117, 117); margin: 0 0 4px 0;">Stock: ${product.stockQuantity}</p>
                <button class="delete-product-btn" data-id="${product.id}">Delete</button> 
                <button class="update-product-btn" data-id="${product.id}">Update</button>
            `;
            grid.appendChild(card);
        });
    }
}

// NEW: Export this helper so dashboard.js can update the array after a deletion!
export function updateAllProducts(newProductsArray) {
    allProducts = newProductsArray;
}