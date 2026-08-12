function updateCartCount() {
  const count = cartState.items.reduce((sum, item) => sum + item.qty, 0);
  document.getElementById('cart-count').textContent = count;
}

function renderCartItems() {
  const tbody = document.getElementById('cart-tbody');
  tbody.innerHTML = '';

  if (cartState.items.length === 0) {
    showEmptyState();
    return;
  }

  hideEmptyState();

  cartState.items.forEach(item => {
    const tr = document.createElement('tr');
    tr.innerHTML = buildCartRow(item);
    tbody.appendChild(tr);
  });

  bindCartRowEvents();
  updateCartCount();
  renderCartSummary();
}

function buildCartRow(item) {
  return `
    <tr data-id="${item.id}">
      <td class="cart-product">
        <img src="${item.image}" alt="${item.name}" class="cart-thumb" />
        <div class="cart-product-info">
          <p class="cart-name">${item.name}</p>
          <p class="cart-sku">SKU: ${item.sku}</p>
        </div>
      </td>
      <td class="cart-variant">
        <select class="variant-selector" data-id="${item.id}">
          <option value="${item.variant}">${item.variant}</option>
        </select>
      </td>
      <td class="cart-price">$${item.price.toFixed(2)}</td>
      <td class="cart-qty">
        <div class="qty-stepper">
          <button class="qty-btn minus" data-id="${item.id}">&minus;</button>
          <input type="number" class="qty-input" value="${item.qty}" min="1" data-id="${item.id}" />
          <button class="qty-btn plus" data-id="${item.id}">+</button>
        </div>
      </td>
      <td class="cart-total">$${(item.price * item.qty).toFixed(2)}</td>
      <td>
        <button class="remove-btn" data-id="${item.id}">&times;</button>
      </td>
    </tr>
  `;
}

function bindCartRowEvents() {
  document.querySelectorAll('.qty-btn.plus').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      const input = document.querySelector(`.qty-input[data-id="${id}"]`);
      const currentQty = parseInt(input.value, 10) || 1;
      updateQty(id, currentQty + 1);
      input.value = currentQty + 1;
    });
  });

  document.querySelectorAll('.qty-btn.minus').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      const input = document.querySelector(`.qty-input[data-id="${id}"]`);
      const currentQty = parseInt(input.value, 10) || 1;
      if (currentQty > 1) {
        updateQty(id, currentQty - 1);
        input.value = currentQty - 1;
      }
    });
  });

  document.querySelectorAll('.qty-input').forEach(input => {
    input.addEventListener('change', () => {
      const id = input.dataset.id;
      let qty = parseInt(input.value, 10);
      if (isNaN(qty) || qty < 1) qty = 1;
      updateQty(id, qty);
      input.value = qty;
    });
  });

  document.querySelectorAll('.remove-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      removeFromCart(id);
    });
  });

  document.querySelectorAll('.variant-selector').forEach(select => {
    select.addEventListener('change', () => {
      const id = select.dataset.id;
      const item = cartState.items.find(i => i.id === id);
      if (item) {
        item.variant = select.value;
        saveCartState();
      }
    });
  });
}

function renderCartSummary() {
  const subtotal = cartState.items.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const discount = cartState.discount || 0;
  const shipping = subtotal > 100 ? 0 : 9.99;
  const tax = (subtotal - discount) * 0.08;
  const total = subtotal - discount + shipping + tax;

  const summaryEl = document.getElementById('cart-summary');
  summaryEl.innerHTML = `
    <div class="summary-box">
      <h2>Order Summary</h2>
      <div class="summary-row"><span>Subtotal</span><span>$${subtotal.toFixed(2)}</span></div>
      <div class="summary-row discount"><span>Discount</span><span>-$${discount.toFixed(2)}</span></div>
      <div class="summary-row"><span>Shipping</span><span>${shipping === 0 ? 'FREE' : '$' + shipping.toFixed(2)}</span></div>
      <div class="summary-row"><span>Tax (8%)</span><span>$${tax.toFixed(2)}</span></div>
      <hr />
      <div class="summary-row total"><span>Total</span><span>$${total.toFixed(2)}</span></div>
      <button id="checkout-btn" onclick="proceedToCheckout()">
        Proceed to Checkout &rarr;
      </button>
    </div>
  `;
}

function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.className = `toast toast-${type}`;
  toast.classList.remove('hidden');
  setTimeout(() => toast.classList.add('hidden'), 3000);
}

function showEmptyState() {
  document.getElementById('cart-table').classList.add('hidden');
  document.getElementById('empty-cart-state').classList.remove('hidden');
  document.getElementById('cart-summary').classList.add('hidden');
  document.getElementById('cart-actions').classList.add('hidden');
  document.getElementById('upsell-section').classList.add('hidden');
}

function hideEmptyState() {
  document.getElementById('cart-table').classList.remove('hidden');
  document.getElementById('empty-cart-state').classList.add('hidden');
  document.getElementById('cart-summary').classList.remove('hidden');
  document.getElementById('cart-actions').classList.remove('hidden');
  document.getElementById('upsell-section').classList.remove('hidden');
}

function continueShopping() {
  window.location.href = '../kiki.html';
}

function clearCart() {
  if (!confirm('Clear all items from your cart?')) return;
  cartState.items = [];
  cartState.discount = 0;
  saveCartState();
  renderCartItems();
  showToast('Cart cleared.');
}

async function proceedToCheckout() {
  const token = getToken();
  if (!token) {
    window.location.href = '../login.html?redirect=/cart';
    return;
  }

  const checkoutBtn = document.getElementById('checkout-btn');
  if (checkoutBtn) {
    checkoutBtn.disabled = true;
    checkoutBtn.textContent = 'Processing...';
  }

  try {
    await CartAPI.submitCart();
    cartState.items = [];
    cartState.discount = 0;
    saveCartState();
    showToast('Order placed successfully!');
    setTimeout(() => {
      window.location.href = '../kiki.html';
    }, 1500);
  } catch (err) {
    console.error(err);
    showToast('Checkout failed. Please try again.');
    if (checkoutBtn) {
      checkoutBtn.disabled = false;
      checkoutBtn.textContent = 'Proceed to Checkout \u2192';
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const token = getToken();
  if (!token) {
    window.location.href = '../login.html?redirect=/cart';
    return;
  }

  loadCartState();
  renderCartItems();

  window.addEventListener('cart-update', (e) => {
    if (e.detail && e.detail.product) {
      addToCart(e.detail.product);
    }
  });
});
