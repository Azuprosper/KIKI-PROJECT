// const BASE_URL = 'http://localhost:4200';
export const API_URL = 'https://kebab-rule-blandness.ngrok-free.dev/api/products';

const CART_KEY = 'cart';

function getCart() {
  try {
    const raw = localStorage.getItem(CART_KEY);
    if (!raw) return { items: [] };
    return JSON.parse(raw);
  } catch (e) {
    return { items: [] };
  }
}

function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

function updateCartBadge() {
  const cart = getCart();
  const count = cart.items.reduce((sum, item) => sum + item.qty, 0);
  document.querySelectorAll('.cart-quantity').forEach(el => el.textContent = count);
}

function addToCart(product) {
  const cart = getCart();
  const existing = cart.items.find(i => i.id === product.id);
  if (existing) {
    existing.qty++;
  } else {
    cart.items.push({
      id: product.id,
      name: product.name,
      price: parseFloat(product.price),
      image: product.imageUrl || '',
      sku: product.sku || `SKU-${product.id}`,
      variant: product.variant || 'Default',
      qty: 1
    });
  }
  saveCart(cart);
  updateCartBadge();
}

export async function loadProducts(searchKeyword = ''){
  try {
    let url = API_URL;
    if (searchKeyword && typeof searchKeyword === 'string' && searchKeyword.trim() !== ''){
      url = `${API_URL}?search=${encodeURIComponent(searchKeyword.trim())}`;
    }
    const response = await fetch(url , {method: "GET", headers: {
      "Content-Type": "application/json",
      "ngrok-skip-browser-warning": "true"
    }});
    const data = await response.json();
    
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
            <button class="add-to-cart-btn" data-product-id="${product.id}">Add to Cart</button>
        `;

        container.appendChild(card);
    });

    document.querySelectorAll('.add-to-cart-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const productId = parseInt(btn.dataset.productId, 10);
        const product = products.find(p => p.id === productId);
        if (product) {
          addToCart(product);
          btn.textContent = 'Added!';
          setTimeout(() => {
            btn.textContent = 'Add to Cart';
          }, 1000);
        }
      });
    });

  } catch (error) {
      console.error("Network error or backend issue:", error);
  }
}
