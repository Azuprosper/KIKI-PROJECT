// const BASE_URL = 'http://localhost:4200';
export const API_URL = 'https://kebab-rule-blandness.ngrok-free.dev/api/products';

export async function loadProducts(searchKeyword = ''){
  try {
    // Check if a search keyword was passed, then use the search endpoint
    let url = API_URL;
    if (searchKeyword && typeof searchKeyword === 'string' && searchKeyword.trim() !== ''){
      url = `${API_URL}?search=${encodeURIComponent(searchKeyword.trim())}`;
    }
    const response = await fetch(url , {method: "GET", headers: {
      "Content-Type": "application/json",
      "ngrok-skip-browser-warning": "true"
    }});
    const data = await response.json();
    
    // Extract the array from the backend
    const products = data.content || data; 

    const container = document.getElementById('products-container');
    if (!container) return;

    container.innerHTML = '';

   if (!products || products.length === 0) {
      container.innerHTML = '<p style="color: white; text-align: center; grid-column: 1 / -1;">No products found.</p>';
      return;
    }

    products.forEach(product => {
        const card = document.createElement('div');
        card.classList.add('product-card');

        card.innerHTML = `
            <img src="${product.imageUrl}" alt="${product.name}" class="product-image">
            <div class="product-name">${product.name}</div>
            <div class="product-price">$${product.price}</div>
            <button class="add-to-cart-btn">Add to Cart</button>
        `;

        container.appendChild(card);
    });

  } catch (error) {
      console.error("Network error or backend issue:", error);
  }
}


