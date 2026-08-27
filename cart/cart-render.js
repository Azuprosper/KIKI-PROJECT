import { getSubtotal } from "./cart-state.js";

const cartLoading  = () => document.getElementById("cart-loading");
const cartEmpty    = () => document.getElementById("cart-empty");
const cartContent  = () => document.getElementById("cart-content");
const cartTbody    = () => document.getElementById("cart-tbody");
const headerCount  = () => document.getElementById("header-cart-count");

// --- UI STATE TOGGLES ---

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

// --- TABLE RENDERING ---

export function renderCartRows(items, onRemove, onQtyChange) {
  const tbody = cartTbody();
  if (!tbody) return;

  tbody.innerHTML = "";

  items.forEach((item) => {
    const itemId   = item.cartItemId || item.id;
    const name     = item.productName || item.name || "Product";
    
    const organizationName = item.organizationName ; 
    
    const price    = parseFloat(item.unitPrice ?? item.price ?? 0);
    const qty      = item.quantity || 1;
    const subtotal = (price * qty).toFixed(2);
    
    
    let imgSrc = item.productImageUrl || item.image || item.image_url || "../images/placeholder.png";
    if (imgSrc.includes("undefined") || imgSrc.includes("null")) {
      imgSrc = "../images/placeholder.png";
    } else if (!imgSrc.startsWith("http") && !imgSrc.startsWith("/") && !imgSrc.startsWith("../")) {
      imgSrc = `../${imgSrc}`;
    }

    const tr = document.createElement("tr");
    tr.dataset.id = itemId;
    
    tr.innerHTML = `
      <td>
        <button class="btn-remove" data-id="${itemId}" aria-label="Remove ${escapeHtml(name)}">&times;</button>
      </td>
      <td>
        <img src="${imgSrc}" alt="${escapeHtml(name)}" class="cart-item-img" onerror="this.onerror=null; this.src='../images/placeholder.png';" />
      </td>
      <td class="cart-item-name">${escapeHtml(name)}</td>
      <td class="cart-item-store">${escapeHtml(organizationName)}</td>
      <td class="cart-price">$${price.toFixed(2)}</td>
      <td>
        <input type="number" class="qty-input" value="${qty}" min="1" max="999" data-id="${itemId}" />
      </td>
      <td class="cart-subtotal" id="subtotal-${itemId}">$${subtotal}</td>
    `;

   
    tr.querySelector(".btn-remove").addEventListener("click", () => onRemove(itemId));

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

// --- SUMMARY & TOTALS ---

export function renderSummary() {
  const subtotal = getSubtotal();

  setText("summary-subtotal", `$${subtotal.toFixed(2)}`);
  setText("summary-discount", "—"); 
  setText("summary-total", `$${subtotal.toFixed(2)}`);

  if (subtotal === 0) setText("summary-shipping", "—");
}

export function renderHeaderCount(count) {
  const el = headerCount();
  if (el) el.textContent = count;
}

export function updateRowSubtotal(id, price, qty) {
  const cell = document.getElementById(`subtotal-${id}`);
  if (cell) {
    cell.textContent = `$${(parseFloat(price) * qty).toFixed(2)}`;
  }
}

// --- NOTIFICATIONS & BUTTON STATES ---

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

export function setCheckoutLoading(isLoading) {
  const btn = document.getElementById("btn-checkout");
  if (!btn) return;
  btn.disabled    = isLoading;
  btn.textContent = isLoading ? "Processing…" : "Proceed to Checkout";
}

// --- UTILITIES ---

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