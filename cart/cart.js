import {
  state,
  setState,
  setItems,
  setItemQty,
  removeItemFromState,
  clearState,
  getTotalCount,
  getSubtotal,
  loadFromLocalStorage
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

document.addEventListener("DOMContentLoaded", () => {
  initAccountDropdown();
  initCart();
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

    if (items.length > 0) {
      setItems(items);
    } else {
      const cached = loadFromLocalStorage();
      if (cached && cached.items && cached.items.length > 0) {
        setItems(cached.items);
      } else {
        setItems([]);
      }
    }
  } catch (err) {
    console.error("Failed to fetch cart from server:", err.message);
    const cached = loadFromLocalStorage();
    if (cached && cached.items) {
      setItems(cached.items);
    } else {
      showNotification("Failed to load your cart. Please try again.", "error");
    }
  } finally {
    renderAll();
  }
}

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

async function handleRemove(id) {
  const backup = [...state.items];
  removeItemFromState(id);
  renderAll();

  try {
    await removeFromCart(id);
    showNotification("Item removed from cart.", "success");
  } catch (err) {
    setItems(backup);
    renderAll();
    showNotification('Failed to remove item', "error");
  }
}

async function handleQtyChange(id, newQty) {
  const item = state.items.find((i) => String(i.id) === String(id));
  if (!item) return;

  const oldQty = item.quantity;

  setItemQty(id, newQty);
  updateRowSubtotal(id, item.price, newQty);
  renderSummary();
  renderHeaderCount(getTotalCount());

  try {
    await updateQty(id, newQty);
  } catch (err) {
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
   CHECKOUT (UPDATED PAYLOAD)
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
    const subtotal = getSubtotal();
    const discount = state.discount || 0;

    // Build the exact payload your Java backend expects
    const checkoutPayload = {
      timestamp: new Date().toISOString(),
      coupon: state.coupon || null,
      discount: discount,
      subtotal: subtotal,
      totalAmount: subtotal - discount,
      items: state.items.map((item) => ({
        cartItemId: item.id,
        productId: item.productId || item.id,
        productName: item.name,
        quantity: item.quantity,
        unitPrice: item.price,
        // Passing the specific organization data for PostgreSQL sorting
        organization_id: item.organization_id,
        organization_name: item.organization_name
      }))
    };

    const result = await submitCart(checkoutPayload);
    
    showNotification(
      result?.message || "Order placed successfully!",
      "success",
      5000
    );
    
    clearState();
    localStorage.removeItem("kiki_cart");
    renderAll();
  } catch (err) {
    console.error("[checkout] Error:", err);
    showNotification(`Checkout failed: ${err.message}`, "error");
  } finally {
    setCheckoutLoading(false);
  }
}

function initClearCart() {
  const btnClear = document.getElementById("btn-clear-cart");
  const modal = document.getElementById("confirm-modal");
  const btnYes = document.getElementById("confirm-yes");
  const btnNo = document.getElementById("confirm-no");

  if (!btnClear || !modal) return;
  
  btnClear.addEventListener("click", () => {
    modal.classList.remove("hidden");
  });

  btnNo.addEventListener("click", () => {
    modal.classList.add("hidden");
  });

  btnYes.addEventListener("click", async () => {
    modal.classList.add("hidden");

    const backup = [...state.items];
    clearState();
    localStorage.removeItem("kiki_cart");
    renderAll();

    try {
      await Promise.all(backup.map((i) => removeFromCart(i.id)));
      showNotification("Cart cleared.", "info");
    } catch (err) {
      console.warn("Partial clear error:", err.message);
    }
  });
}

function initAccountDropdown() {
  const btn = document.getElementById("account-btn");
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
   HELPERS (UPDATED NORMALISATION)
════════════════════════════════════════════ */

/**
 * Normalise exact Java CartItemResponseDto into frontend state
 */
function normaliseItems(serverData) {
  const rawList = Array.isArray(serverData) 
    ? serverData 
    : (serverData?.items || serverData?.cartItems || []);

  return rawList.map((dto) => ({
    id:                dto.cartItemId || dto.id,       
    productId:         dto.productId,                  
    name:              dto.productName || dto.name || "Product",
    price:             parseFloat(dto.unitPrice ?? dto.price ?? 0),
    image:             dto.productImageUrl || dto.image || dto.image_url || "../images/placeholder.png",
    quantity:          parseInt(dto.quantity || 1, 10),
    // Map the organization details here so they persist in state
    organization_id:   dto.organization_id || dto.organizationId || null,
    organization_name: dto.organization_name || dto.organizationName || null
  }));
}
function setMsg(el, text, type) {
  if (!el) return;
  el.textContent = text;
  el.className   = `coupon-msg ${type}`;
}