export const ORG_PRODUCTS_API_URL = 'https://kebab-rule-blandness.ngrok-free.dev/api/organizations/me/products';

// Create a variable to hold all products so we can search them without re-fetching {AZU}
let allProducts = [];

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
        
        // Save the fetched products to our array
        allProducts = await response.json();
        
        // Build the grid with all products initially
        renderProducts(allProducts);
        
    } catch (error) {
        console.error('Error loading products:', error);
    }
}

// 2. Extracted rendering logic so the search bar can re-draw the grid
function renderProducts(products) {
    const mainContainer = document.querySelector('.dashboard-empty-state');
    
    // Get the empty state elements so we can hide them if products exist
    const emptyIcon = mainContainer.querySelector('.empty-icon');
    const emptyTitle = mainContainer.querySelector('h2');
    const emptyText = mainContainer.querySelector('p');

    // Find or create the product grid container
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
        // Show the empty state UI (Handles both zero products AND zero search results)
        if (emptyIcon) emptyIcon.style.display = 'block';
        
        if (emptyTitle) {
            emptyTitle.style.display = 'block';
            // Dynamically change text if it's an empty search vs completely empty store
            emptyTitle.textContent = allProducts.length === 0 ? "No Products Yet" : "No matches found";
        }
        
        if (emptyText) emptyText.style.display = 'block';
        grid.style.display = 'none';

        // Keep the container centered vertically
        mainContainer.style.display = 'flex';
        mainContainer.style.height = '70vh';
        mainContainer.style.paddingTop = '0';
    } else {
        // Hide the empty state UI and show products
        if (emptyIcon) emptyIcon.style.display = 'none';
        if (emptyTitle) emptyTitle.style.display = 'none';
        if (emptyText) emptyText.style.display = 'none';
        grid.style.display = 'grid';
        
        // Stop centering the grid and push it below the black header
        mainContainer.style.display = 'block'; 
        mainContainer.style.height = 'auto';
        mainContainer.style.paddingTop = '120px'; 
        
        // Clear the grid before rendering (prevents duplicates)
        grid.innerHTML = '';
        
        // Build a card for each product
        products.forEach(product => {
            const card = document.createElement('div');
            card.style.border = '1px solid #e0e0e0';
            card.style.borderRadius = '8px';
            card.style.padding = '15px';
            card.style.backgroundColor = 'white'; // Keeping it to color names!
            card.style.boxShadow = '0 2px 5px rgba(0,0,0,0.05)';
            
            card.innerHTML = `
                <img src="${product.imageUrl || 'images/kiki-logo.webp'}" alt="${product.name}" style="width: 100%; height: 160px; object-fit: contain; background-color: white; border-radius: 4px; margin-bottom: 10px;">
                <h3 style="margin: 0 0 5px 0; font-size: 18px; color: #333;">${product.name}</h3>
                <p style="color: #1a54bf; font-weight: bold; margin: 0 0 10px 0;">$${product.price}</p>
                <p style="font-size: 13px; color: #777; margin: 0;">Stock: ${product.stockQuantity}</p>
            `;
            grid.appendChild(card);
        });
    }
}

// 3. The Search Bar Event Listener
document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('search-bar'); 

    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
           
            const searchTerm = e.target.value.toLowerCase().trim();
            
            const filteredProducts = allProducts.filter(product => {
                return product.name.toLowerCase().includes(searchTerm);
            });
            // Redraw the grid with only the matching products
            renderProducts(filteredProducts);
        });
    }
});