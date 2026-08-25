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
 * @param {Function} onRemove    - callback(cartItemId)
 * @param {Function} onQtyChange - callback(cartItemId, newQty)
 */
export function renderCartRows(items, onRemove, onQtyChange) {
  const tbody = cartTbody();
  if (!tbody) return;

  tbody.innerHTML = "";

  items.forEach((item) => {
    // Map strictly to CartItemResponseDto fields
    const itemId    = item.cartItemId || item.id;
    const name      = item.productName || item.name || "Product";
    const price     = parseFloat(item.unitPrice ?? item.price ?? 0);
    const qty       = item.quantity || 1;
    const subtotal  = item.subtotal ? parseFloat(item.subtotal).toFixed(2) : (price * qty).toFixed(2);
    
    // Resolve relative vs absolute image paths for the /cart/ subdirectory
    let imgSrc = item.productImageUrl || item.image || item.image_url;
    
    if (!imgSrc || imgSrc === "undefined" || imgSrc === "null") {
      imgSrc = "../images/placeholder.png";
    } else if (!imgSrc.startsWith("http") && !imgSrc.startsWith("/") && !imgSrc.startsWith("../")) {
      // Step out of the /cart/ folder for local relative paths
      imgSrc = `../${imgSrc}`;
    }

    const tr = document.createElement("tr");
    tr.dataset.id = itemId;

    tr.innerHTML = `
      <td>
        <button class="btn-remove" data-id="${itemId}" aria-label="Remove ${escapeHtml(name)}">
          &times;
        </button>
      </td>

      <td>
        <img
          src="${imgSrc}"
          alt="${escapeHtml(name)}"
          class="cart-item-img"
          onerror="this.onerror=null; this.src='../images/placeholder.png';"
        />
      </td>

      <td class="cart-item-name">${escapeHtml(name)}</td>

      <td class="cart-price">$${price.toFixed(2)}</td>

      <td>
        <input
          type="number"
          class="qty-input"
          value="${qty}"
          min="1"
          max="999"
          data-id="${itemId}"
          aria-label="Quantity for ${escapeHtml(name)}"
        />
      </td>

      <td class="cart-subtotal" id="subtotal-${itemId}">
        $${subtotal}
      </td>
    `;

    // Wire remove button
    tr.querySelector(".btn-remove").addEventListener("click", () => {
      onRemove(itemId);
    });

    // Wire quantity input (debounced)
    const qtyInput = tr.querySelector(".qty-input");
    let debounceTimer;
    qtyInput.addEventListener("change", (e) => {
      const newQty = parseInt(e.target.value, 10);
      if (!isNaN(newQty) && newQty >= 1) {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => onQtyChange(itemId, newQty), 400);
      }
    });

    tbody.appendChild(tr);
  });
}

/* ════════════════════
   Order Summary
════════════════════ */

export function renderSummary() {
  const subtotal = getSubtotal();
  const discount = state.discount || 0;
  const total    = getTotal();

  setText("summary-subtotal", `$${subtotal.toFixed(2)}`);
  setText("summary-discount", discount > 0 ? `— $${discount.toFixed(2)}` : "—");
  setText("summary-total",    `$${total.toFixed(2)}`);

  if (total === 0) setText("summary-shipping", "—");
}

/* ════════════════════
   Header Badge
════════════════════ */

export function renderHeaderCount(count) {
  const el = headerCount();
  if (el) el.textContent = count;
}

/* ════════════════════
   Inline Subtotal
════════════════════ */

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