
import { addToCart as apiAddToCart, fetchCartFromServer } from "../cart/cart-api.js";

export const API_URL = 'https://kebab-rule-blandness.ngrok-free.dev/api/products';

// Sync initial badge count from Java backend DTO
export async function syncCartBadge() {
  const badge = document.querySelector('.cart-quantity');
  if (!badge) return;

  const token = localStorage.getItem('token') || localStorage.getItem('authToken');
  if (!token) return;

  try {
    const serverCart = await fetchCartFromServer();
    const items = serverCart?.items || serverCart?.cartItems || [];
    const totalQty = items.reduce((sum, item) => sum + (parseInt(item.quantity, 10) || 1), 0);
    badge.textContent = totalQty;
    localStorage.setItem('cartCount', totalQty);
  } catch (err) {
    console.warn("[products] Could not sync initial badge count:", err.message);
  }
}

export async function loadProducts(searchKeyword = '') {
  // Sync cart counter state on initial load
  syncCartBadge();

  try {
    let url = API_URL;
    if (searchKeyword && typeof searchKeyword === 'string' && searchKeyword.trim() !== '') {
      url = `${API_URL}?search=${encodeURIComponent(searchKeyword.trim())}`;
    }

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "ngrok-skip-browser-warning": "true"
      }
    });

    const data = await response.json();
    const products = data.content || [];

    const container = document.getElementById('products-container');
    if (!container) return;

    container.innerHTML = '';

    products.forEach(product => {
      const card = document.createElement('div');
      card.classList.add('product-card');
      card.innerHTML = `
        <img src="${product.imageUrl}" alt="${product.name}" class="product-image">
        <div class="product-name">${product.name}</div>
        <div class="product-price">$${product.price}</div>
        <div class="product-orgName">Store: ${product.organizationName}</div>
        <button class="add-to-cart-btn" data-product-id="${product.id}">Add to Cart</button>
      `;
      container.appendChild(card);
    });

    // Attach click listeners to dynamically injected buttons
    document.querySelectorAll('.add-to-cart-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const productId = parseInt(btn.dataset.productId, 10);
        
        try {
          btn.disabled = true;
          btn.textContent = 'Adding...';

          const updatedCart = await apiAddToCart(productId, 1);
          const items = updatedCart?.items || updatedCart?.cartItems || [];
          const totalCount = items.reduce((sum, item) => sum + (parseInt(item.quantity, 10) || 1), 0);

          const cartQuantityElement = document.querySelector('.cart-quantity');
          if (cartQuantityElement) {
            cartQuantityElement.textContent = totalCount;
          }
          localStorage.setItem('cartCount', totalCount);

          btn.textContent = 'Added!';
        } catch (err) {
          console.error("Failed to add product to backend cart:", err);
          alert("Could not add item to cart. Please check if you are logged in.");
          btn.textContent = 'Add to Cart';
        } finally {
          setTimeout(() => {
            btn.disabled = false;
            btn.textContent = 'Add to Cart';
          }, 1000);
        }
      });
    });

  } catch (error) {
    console.error("Network error or backend issue:", error);
  }
}