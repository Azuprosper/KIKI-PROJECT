/* ════════════════════════════════════════════
   KIKI — CART RENDER ENGINE
   Pure DOM manipulation — no state mutations
════════════════════════════════════════════ */

import { getSubtotal, getTotal, state } from "./cart-state.js";

/* ── DOM Refs ── */
const cartLoading  = () => document.getElementById("cart-loading");
const cartEmpty    = () => document.getElementById("cart-empty");
const cartContent  = () => document.getElementById("cart-content");
const cartTbody    = () => document.getElementById("cart-tbody");
const headerCount  = () => document.getElementById("header-cart-count");

/* ════════════════════
   View Switchers
════════════════════ */

export function showLoading() {
  cartLoading()?.classList.remove("hidden");
  cartEmpty()?.classList.add("hidden");
  cartContent()?.classList.add("hidden");
}

export function showEmpty() {
  cartLoading()?.classList.add("hidden");
  cartEmpty()?.classList.remove("hidden");
  cartContent()?.classList.add("hidden");
}

export function showContent() {
  cartLoading()?.classList.add("hidden");
  cartEmpty()?.classList.add("hidden");
  cartContent()?.classList.remove("hidden");
}

/* ════════════════════
   Cart Table
════════════════════ */

/**
 * Render all cart item rows into <tbody>.
 * @param {Array} items
 * @param {Function} onRemove  - callback(id)
 * @param {Function} onQtyChange - callback(id, newQty)
 */
export function renderCartRows(items, onRemove, onQtyChange) {
  const tbody = cartTbody();
  if (!tbody) return;

  tbody.innerHTML = "";

  items.forEach((item) => {
    const subtotal = (parseFloat(item.price || 0) * (item.quantity || 1)).toFixed(2);
    const imgSrc   = item.image || item.image_url || "../images/placeholder.png";

    const tr = document.createElement("tr");
    tr.dataset.id = item.id;

    tr.innerHTML = `
      <td>
        <button class="btn-remove" data-id="${item.id}" aria-label="Remove ${item.name}">
          &times;
        </button>
      </td>

      <td>
        <img
          src="${imgSrc}"
          alt="${escapeHtml(item.name)}"
          class="cart-item-img"
          onerror="this.src='../images/placeholder.png'"
        />
      </td>

      <td class="cart-item-name">${escapeHtml(item.name)}</td>

      <td class="cart-price">$${parseFloat(item.price || 0).toFixed(2)}</td>

      <td>
        <input
          type="number"
          class="qty-input"
          value="${item.quantity || 1}"
          min="1"
          max="999"
          data-id="${item.id}"
          aria-label="Quantity for ${escapeHtml(item.name)}"
        />
      </td>

      <td class="cart-subtotal" id="subtotal-${item.id}">
        $${subtotal}
      </td>
    `;

    // Wire remove button
    tr.querySelector(".btn-remove").addEventListener("click", () => {
      onRemove(item.id);
    });

    // Wire quantity input  (debounced)
    const qtyInput = tr.querySelector(".qty-input");
    let debounceTimer;
    qtyInput.addEventListener("change", (e) => {
      const newQty = parseInt(e.target.value, 10);
      if (!isNaN(newQty) && newQty >= 1) {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => onQtyChange(item.id, newQty), 400);
      }
    });

    tbody.appendChild(tr);
  });
}

/* ════════════════════
   Order Summary
════════════════════ */

/**
 * Refresh the summary panel totals.
 */
export function renderSummary() {
  const subtotal = getSubtotal();
  const discount = state.discount || 0;
  const total    = getTotal();

  setText("summary-subtotal", `$${subtotal.toFixed(2)}`);
  setText("summary-discount", discount > 0 ? `— $${discount.toFixed(2)}` : "—");
  setText("summary-total",    `$${total.toFixed(2)}`);

  // Highlight shipping
  if (total === 0) setText("summary-shipping", "—");
}

/* ════════════════════
   Header Badge
════════════════════ */

/**
 * Update the cart item count badge in the header.
 * @param {number} count
 */
export function renderHeaderCount(count) {
  const el = headerCount();
  if (el) el.textContent = count;
}

/* ════════════════════
   Inline Subtotal
════════════════════ */

/**
 * Update a single row's subtotal cell without a full re-render.
 * @param {string|number} id
 * @param {number} price
 * @param {number} qty
 */
export function updateRowSubtotal(id, price, qty) {
  const cell = document.getElementById(`subtotal-${id}`);
  if (cell) {
    cell.textContent = `$${(parseFloat(price) * qty).toFixed(2)}`;
  }
}

/* ════════════════════
   Notification Banner
════════════════════ */

let notifTimer;

/**
 * Show a temporary notification banner.
 * @param {string} message
 * @param {'success'|'error'|'info'} type
 * @param {number} [duration=3000] ms
 */
export function showNotification(message, type = "info", duration = 3000) {
  const el = document.getElementById("cart-notification");
  if (!el) return;

  el.textContent = message;
  el.className   = `cart-notification ${type}`;
  el.classList.remove("hidden");

  clearTimeout(notifTimer);
  notifTimer = setTimeout(() => {
    el.classList.add("hidden");
  }, duration);
}

/* ════════════════════
   Checkout Button
════════════════════ */

export function setCheckoutLoading(isLoading) {
  const btn = document.getElementById("btn-checkout");
  if (!btn) return;
  btn.disabled     = isLoading;
  btn.textContent  = isLoading ? "Processing…" : "Proceed to Checkout";
}

/* ════════════════════
   Helpers
════════════════════ */

function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

function escapeHtml(str = "") {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}