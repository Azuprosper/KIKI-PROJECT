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

// --- INITIALISE ---
document.addEventListener("DOMContentLoaded", () => {
  initAccountDropdown();
  initCart();
  initCheckout();
  initClearCart();
});

// --- CART FETCHING ---
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

// --- RENDER SCREEN ---
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

// --- USER ACTIONS ---
async function handleRemove(id) {
  // Optimistic UI update: Remove immediately, restore if server fails
  const backup = [...state.items];
  removeItemFromState(id);
  renderAll();

  try {
    await removeFromCart(id);
    showNotification("Item removed from cart.", "success");
  } catch (err) {
    setItems(backup);
    renderAll();
    showNotification(`Failed to remove item: ${err.message}`, "error");
  }
}

async function handleQtyChange(id, newQty) {
  const item = state.items.find((i) => String(i.id) === String(id));
  if (!item) return;

  const oldQty = item.quantity;

  // Optimistic UI update
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

// --- CHECKOUT ---
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
    const result = await submitCart();
    showNotification(
      result?.message || "Order placed successfully!",
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

// --- CLEAR ENTIRE CART ---
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
    renderAll();

    try {
      await Promise.all(backup.map((i) => removeFromCart(i.id)));
      showNotification("Cart cleared.", "info");
    } catch (err) {
      console.warn("Partial clear error:", err.message);
    }
  });
}

// --- UI HELPERS ---
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

// Ensure server data matches our expected frontend format
function normaliseItems(serverData) {
  const rawList = Array.isArray(serverData) 
    ? serverData 
    : (serverData?.items || serverData?.cartItems || []);

  return rawList.map((dto) => ({
    id: dto.id,
    productId: dto.productId,
    name: dto.productName,
    organizationName: dto.organizationName,
    price: parseFloat(dto.unitPrice ?? dto.price ?? 0),
    image: dto.productImageUrl || dto.image || dto.image_url || "../images/placeholder.png",
    quantity: parseInt(dto.quantity || 1, 10),
  }));
}