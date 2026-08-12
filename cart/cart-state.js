const STORAGE_KEY = 'cart';

const cartState = {
  items: [],
  discount: 0,
  isLoading: false,
  error: null
};

function saveCartState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cartState));
}

function loadCartState() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      Object.assign(cartState, JSON.parse(stored));
    } catch (e) {
      console.error('Failed to parse cart state:', e);
      cartState.items = [];
    }
  }
}

function addToCart(product) {
  const existing = cartState.items.find(i => i.id === product.id);
  if (existing) {
    existing.qty++;
  } else {
    cartState.items.push({
      id: product.id,
      name: product.name,
      price: parseFloat(product.price),
      image: product.imageUrl || product.image_url || '',
      sku: product.sku || `SKU-${product.id}`,
      variant: product.variant || 'Default',
      qty: 1
    });
  }
  saveCartState();
  renderCartItems();
  showToast(`${product.name} added to cart`);
}

function removeFromCart(id) {
  cartState.items = cartState.items.filter(i => i.id !== id);
  saveCartState();
  renderCartItems();
}

function updateQty(id, qty) {
  const item = cartState.items.find(i => i.id === id);
  if (item) {
    item.qty = Math.max(1, qty);
  }
  saveCartState();
  renderCartItems();
}

window.cartState = cartState;
window.saveCartState = saveCartState;
window.loadCartState = loadCartState;
window.addToCart = addToCart;
window.removeFromCart = removeFromCart;
window.updateQty = updateQty;
