const STORAGE_KEY = "kiki_cart_v1";

export const state = {
  items: [],
  loading: false,
  error: null
};

export function setState(patch) {
  Object.assign(state, patch);
}

export function setItems(items) {
  state.items = Array.isArray(items) ? items : [];
  saveToLocalStorage();
}

export function setItemQty(id, quantity) {
  const item = state.items.find((i) => String(i.id) === String(id));
  if (item) {
    item.quantity = Math.max(1, quantity);
    saveToLocalStorage();
  }
}

export function removeItemFromState(id) {
  state.items = state.items.filter((i) => String(i.id) !== String(id));
  saveToLocalStorage();
}

export function clearState() {
  state.items = [];
  state.error = null;
  clearLocalStorage();
}

// --- MATH CALCULATIONS ---

export function getTotalCount() {
  return state.items.reduce((sum, item) => sum + (item.quantity || 1), 0);
}

export function getSubtotal() {
  return state.items.reduce((sum, item) => {
    return sum + (parseFloat(item.price || 0) * (item.quantity || 1));
  }, 0);
}

export function getTotal() {
  // Since coupons are disabled, the total is simply the subtotal
  return getSubtotal();
}

// --- LOCAL STORAGE CACHING ---

export function saveToLocalStorage() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      items: state.items
    }));
  } catch (err) {
    console.warn("localStorage write failed:", err);
  }
}

export function loadFromLocalStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function clearLocalStorage() {
  localStorage.removeItem(STORAGE_KEY);
}