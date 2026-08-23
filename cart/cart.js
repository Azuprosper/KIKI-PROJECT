/* ════════════════════════════════════════════
   KIKI — CART MAIN ORCHESTRATOR
   CartPage = f(state) = dispatch(fetch(authenticate(endpoint)))
             = Σ(UI + API + State + Auth)
════════════════════════════════════════════ */

import {
  state,
  setState,
  setItems,
  setItemQty,
  removeItemFromState,
  clearState,
  getTotalCount,
  getSubtotal,
} from "./cart-state.js";

import {
  fetchCartFromServer,
  updateQty,
  removeFromCart,
  submitCart,
} from "./cart-api.js";

import {
  showLoading,
  showEmpty,
  showContent,
  renderCartRows,
  renderSummary,
  renderHeaderCount,
  updateRowSubtotal,
  showNotification,
  setCheckoutLoading,
} from "./cart-render.js";

/* ════════════════════════════════════════════
   INITIALISE
════════════════════════════════════════════ */

document.addEventListener("DOMContentLoaded", () => {
  initAccountDropdown();
  initCart();
  initCoupon();
  initCheckout();
  initClearCart();
});

/* ════════════════════════════════════════════
   CART BOOTSTRAP (Pure Backend Driven)
════════════════════════════════════════════ */

async function initCart() {
  showLoading();

  try {
    const serverData = await fetchCartFromServer();
    const items = normaliseItems(serverData);

    setItems(items);
  } catch (err) {
    console.error("[cart] Failed to fetch cart from server:", err.message);
    showNotification("Failed to load your cart. Please try again.", "error");
  } finally {
    renderAll();
  }
}

/* ════════════════════════════════════════════
   RENDER ORCHESTRATION
════════════════════════════════════════════ */

function renderAll() {
  if (!state.items.length) {
    showEmpty();
    renderHeaderCount(0);
    return;
  }

  showContent();
  renderCartRows(state.items, handleRemove, handleQtyChange);
  renderSummary();
  renderHeaderCount(getTotalCount());
}

/* ════════════════════════════════════════════
   EVENT: REMOVE ITEM
════════════════════════════════════════════ */

async function handleRemove(id) {
  /* Optimistic UI */
  const backup = [...state.items];
  removeItemFromState(id);
  renderAll();

  try {
    await removeFromCart(id);
    showNotification("Item removed from cart.", "success");
  } catch (err) {
    /* Rollback on server error */
    setItems(backup);
    renderAll();
    showNotification(`Failed to remove item: ${err.message}`, "error");
  }
}

/* ════════════════════════════════════════════
   EVENT: QUANTITY CHANGE
════════════════════════════════════════════ */

async function handleQtyChange(id, newQty) {
  const item = state.items.find((i) => String(i.id) === String(id));
  if (!item) return;

  const oldQty = item.quantity;

  /* Optimistic UI — update subtotal cell immediately */
  setItemQty(id, newQty);
  updateRowSubtotal(id, item.price, newQty);
  renderSummary();
  renderHeaderCount(getTotalCount());

  try {
    await updateQty(id, newQty);
  } catch (err) {
    /* Rollback on server error */
    setItemQty(id, oldQty);
    updateRowSubtotal(id, item.price, oldQty);
    renderSummary();
    renderHeaderCount(getTotalCount());
    showNotification(`Could not update quantity: ${err.message}`, "error");
  }
}

/* ════════════════════════════════════════════
   COUPON
════════════════════════════════════════════ */

function initCoupon() {
  const btn   = document.getElementById("btn-apply-coupon");
  const input = document.getElementById("coupon-input");
  const msg   = document.getElementById("coupon-msg");

  if (!btn || !input) return;

  if (state.coupon) input.value = state.coupon;

  btn.addEventListener("click", () => applyCoupon(input, msg));
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") applyCoupon(input, msg);
  });
}

const COUPONS = {
  KIKI10: 0.10,   // 10%
  KIKI20: 0.20,   // 20%
  SAVE5:  5,      // flat $5
};

function applyCoupon(input, msgEl) {
  const code     = input.value.trim().toUpperCase();
  const subtotal = getSubtotal();

  if (!code) {
    setMsg(msgEl, "Please enter a coupon code.", "error");
    return;
  }

  if (!COUPONS[code]) {
    setMsg(msgEl, "Invalid coupon code.", "error");
    return;
  }

  const discount =
    code === "SAVE5"
      ? Math.min(5, subtotal)
      : parseFloat((subtotal * COUPONS[code]).toFixed(2));

  setState({ coupon: code, discount });
  renderSummary();
  setMsg(msgEl, `Coupon "${code}" applied! You save $${discount.toFixed(2)}.`, "success");
  showNotification(`Coupon "${code}" applied!`, "success");
}

/* ════════════════════════════════════════════
   CHECKOUT
════════════════════════════════════════════ */

function initCheckout() {
  const btn = document.getElementById("btn-checkout");
  if (!btn) return;

  btn.addEventListener("click", handleCheckout);
}

async function handleCheckout() {
  if (!state.items.length) {
    showNotification("Your cart is empty.", "error");
    return;
  }

  setCheckoutLoading(true);

  try {
    const result = await submitCart({ coupon: state.coupon });
    showNotification(
      result?.message || "Order placed successfully! 🎉",
      "success",
      5000
    );
    clearState();
    renderAll();
  } catch (err) {
    showNotification(`Checkout failed: ${err.message}`, "error");
  } finally {
    setCheckoutLoading(false);
  }
}

/* ════════════════════════════════════════════
   CLEAR CART
════════════════════════════════════════════ */

function initClearCart() {
  const btn = document.getElementById("btn-clear-cart");
  if (!btn) return;

  btn.addEventListener("click", async () => {
    if (!confirm("Are you sure you want to clear your cart?")) return;

    const backup = [...state.items];
    clearState();
    renderAll();

    try {
      await Promise.all(backup.map((i) => removeFromCart(i.id)));
      showNotification("Cart cleared.", "info");
    } catch (err) {
      console.warn("[cart] Partial clear error:", err.message);
    }
  });
}

/* ════════════════════════════════════════════
   ACCOUNT DROPDOWN
════════════════════════════════════════════ */

function initAccountDropdown() {
  const btn      = document.getElementById("account-btn");
  const dropdown = document.getElementById("account-dropdown");
  if (!btn || !dropdown) return;

  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    dropdown.classList.toggle("show");
  });

  window.addEventListener("click", () => {
    dropdown.classList.remove("show");
  });
}

/* ════════════════════════════════════════════
   HELPERS
════════════════════════════════════════════ */

/**
 * Normalise exact Java CartItemResponseDto into frontend state
 */
function normaliseItems(serverData) {
  // Handle if serverData is either the raw array or a wrapped object container
  const rawList = Array.isArray(serverData) 
    ? serverData 
    : (serverData?.items || serverData?.cartItems || []);

  return rawList.map((dto) => ({
    id:        dto.cartItemId || dto.id,       // CRITICAL: Used for PUT and DELETE requests
    productId: dto.productId,                  // Kept in state in case we need it later
    name:      dto.productName || dto.name,
    price:     parseFloat(dto.unitPrice || dto.price || 0),
    image:     dto.productImageUrl || dto.image || "../images/placeholder.png",
    quantity:  parseInt(dto.quantity || 1, 10),
  }));
}

function setMsg(el, text, type) {
  if (!el) return;
  el.textContent = text;
  el.className   = `coupon-msg ${type}`;
}