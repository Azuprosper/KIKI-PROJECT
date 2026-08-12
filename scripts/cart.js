import {
  getProductById,
  readCart,
  writeCart,
  setCartItemQuantity,
  removeFromCart,
  updateCartCount
} from './products.js';

const money = (amount) => `$${Number(amount || 0).toFixed(2)}`;
const byId = (id) => document.getElementById(id);

const cartItems = byId('cart-items');
const cartContent = byId('cart-content');
const emptyCart = byId('empty-cart');
const selectAll = byId('select-all');
const deleteSelectedButton = byId('delete-selected');
const feedback = byId('cart-feedback');

function getCartTotals(cart) {
  const subtotal = cart.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0), 0);
  const delivery = 0;
  const tax = subtotal * 0.075;
  return { subtotal, delivery, tax, total: subtotal + delivery + tax };
}

function getCategory(productId) {
  return getProductById(productId)?.category || 'KIKI essentials';
}

function renderCart() {
  if (!cartItems || !cartContent || !emptyCart || !deleteSelectedButton || !feedback) return;

  const cart = readCart();
  const itemCount = cart.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
  const countLabel = byId('cart-count-label');
  const totals = getCartTotals(cart);
  const subtotalEl = byId('subtotal');
  const deliveryEl = byId('delivery');
  const taxEl = byId('tax');
  const totalEl = byId('total');

  updateCartCount(cart);
  if (countLabel) countLabel.textContent = `${itemCount} ${itemCount === 1 ? 'item' : 'items'}`;

  if (subtotalEl) subtotalEl.textContent = money(totals.subtotal);
  if (deliveryEl) deliveryEl.textContent = totals.delivery === 0 ? 'Free' : money(totals.delivery);
  if (taxEl) taxEl.textContent = money(totals.tax);
  if (totalEl) totalEl.textContent = money(totals.total);

  if (cart.length === 0) {
    cartContent.hidden = true;
    emptyCart.hidden = false;
    deleteSelectedButton.disabled = true;
    if (selectAll) selectAll.checked = false;
    return;
  }

  cartContent.hidden = false;
  emptyCart.hidden = true;
  cartItems.innerHTML = cart.map((item) => `
    <article class="cart-item" data-item-id="${item.id}">
      <input class="item-select" type="checkbox" data-id="${item.id}" aria-label="Select ${item.name} for deletion">
      <a class="item-image-link" href="./kiki.html" aria-label="Continue shopping">
        <img class="item-image" src="${item.image || 'images/kiki-logo.webp'}" alt="${item.name}">
      </a>
      <div class="item-details">
        <div class="item-category">${getCategory(item.id)}</div>
        <h2 class="item-name">${item.name}</h2>
        <p class="item-price">${money(item.price)} each</p>
        <div class="item-actions">
          <div class="quantity-control" aria-label="Quantity for ${item.name}">
            <button type="button" data-action="decrease" data-id="${item.id}" aria-label="Decrease quantity">−</button>
            <output>${item.quantity}</output>
            <button type="button" data-action="increase" data-id="${item.id}" aria-label="Increase quantity">+</button>
          </div>
          <button type="button" class="remove-item-button" data-action="remove" data-id="${item.id}">Remove</button>
        </div>
      </div>
      <strong class="item-total">${money(Number(item.price) * Number(item.quantity))}</strong>
    </article>
  `).join('');

  if (selectAll) {
    selectAll.checked = false;
    updateSelectionState();
  }
}

function updateSelectionState() {
  if (!selectAll || !deleteSelectedButton) return;

  const checkboxes = [...document.querySelectorAll('.item-select')];
  const selectedCount = checkboxes.filter((checkbox) => checkbox.checked).length;
  deleteSelectedButton.disabled = selectedCount === 0;
  selectAll.checked = checkboxes.length > 0 && selectedCount === checkboxes.length;
  selectAll.indeterminate = selectedCount > 0 && selectedCount < checkboxes.length;
}

function showFeedback(message) {
  if (!feedback) return;
  feedback.textContent = message;
  window.clearTimeout(showFeedback.timer);
  showFeedback.timer = window.setTimeout(() => {
    feedback.textContent = '';
  }, 2600);
}

if (cartItems) {
  cartItems.addEventListener('change', (event) => {
    if (event.target.matches('.item-select')) updateSelectionState();
  });

  cartItems.addEventListener('click', (event) => {
    const actionButton = event.target.closest('[data-action]');
    if (!actionButton) return;

    const id = String(actionButton.dataset.id ?? '');
    const item = readCart().find((cartItem) => String(cartItem.id) === id);
    if (!item) return;

    if (actionButton.dataset.action === 'increase') {
      setCartItemQuantity(id, item.quantity + 1);
    } else if (actionButton.dataset.action === 'decrease') {
      setCartItemQuantity(id, item.quantity - 1);
    } else if (actionButton.dataset.action === 'remove') {
      removeFromCart(id);
      showFeedback('Item removed from your cart.');
    }
    renderCart();
  });
}

if (selectAll) {
  selectAll.addEventListener('change', () => {
    document.querySelectorAll('.item-select').forEach((checkbox) => {
      checkbox.checked = selectAll.checked;
    });
    updateSelectionState();
  });
}

if (deleteSelectedButton) {
  deleteSelectedButton.addEventListener('click', () => {
    const selectedIds = new Set(
      [...document.querySelectorAll('.item-select:checked')].map((checkbox) => String(checkbox.dataset.id ?? ''))
    );
    if (selectedIds.size === 0) return;

    const remainingItems = readCart().filter((item) => !selectedIds.has(String(item.id)));
    writeCart(remainingItems);
    renderCart();
    showFeedback(`${selectedIds.size} ${selectedIds.size === 1 ? 'item' : 'items'} removed from your cart.`);
  });
}

const checkoutButton = byId('checkout-button');
if (checkoutButton) {
  checkoutButton.addEventListener('click', () => {
    if (readCart().length > 0) {
      showFeedback('Checkout is ready to connect to your payment flow.');
    }
  });
}

const accountButton = byId('account-btn');
const accountDropdown = byId('account-dropdown');
if (accountButton && accountDropdown) {
  accountButton.addEventListener('click', (event) => {
    event.stopPropagation();
    const isHidden = accountDropdown.hidden;
    accountDropdown.hidden = !isHidden;
    accountButton.setAttribute('aria-expanded', String(isHidden));
  });

  document.addEventListener('click', () => {
    accountDropdown.hidden = true;
    accountButton.setAttribute('aria-expanded', 'false');
  });
}

window.addEventListener('kiki:cart-updated', renderCart);
window.addEventListener('storage', (event) => {
  if (event.key === 'kiki-cart-v1') renderCart();
});

renderCart();
