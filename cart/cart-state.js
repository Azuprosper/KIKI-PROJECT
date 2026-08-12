/* ════════════════════════════════════════════
   KIKI — CART STATE ENGINE
   Single source of truth + localStorage sync
════════════════════════════════════════════ */

const STORAGE_KEY = "kiki_cart_v1";

/* ── Core State Object ── */
export const state = {
  items:    [],       // Array<{ id, name, price, image, quantity }>
  loading:  false,
  error:    null,
  coupon:   "",
  discount: 0,        // Flat discount in dollars
};

/* ════════════
   Mutators
════════════ */

/**
 * Merge a partial update into state (non-destructive).
 * @param {Partial<typeof state>} patch
 */
export function setState(patch) {
  Object.assign(state, patch);
}

/**
 * Replace the entire items array and sync to localStorage.
 * @param {Array} items
 */
export function setItems(items) {
  state.items = Array.isArray(items) ? items : [];
  saveToLocalStorage();
}

/**
 * Update a single item's quantity by id.
 * @param {string|number} id
 * @param {number} quantity
 */
export function setItemQty(id, quantity) {
  const item = state.items.find((i) => String(i.id) === String(id));
  if (item) {
    item.quantity = Math.max(1, quantity);
    saveToLocalStorage();
  }
}

/**
 * Remove an item from local state by id.
 * @param {string|number} id
 */
export function removeItemFromState(id) {
  state.items = state.items.filter((i) => String(i.id) !== String(id));
  saveToLocalStorage();
}

/**
 * Clear all items from state and localStorage.
 */
export function clearState() {
  state.items    = [];
  state.coupon   = "";
  state.discount = 0;
  state.error    = null;
  clearLocalStorage();
}

/* ════════════════════
   Computed Selectors
════════════════════ */

/**
 * Total number of items (sum of all quantities).
 */
export function getTotalCount() {
  return state.items.reduce((sum, i) => sum + (i.quantity || 1), 0);
}

/**
 * Cart subtotal before discount.
 */
export function getSubtotal() {
  return state.items.reduce(
    (sum, i) => sum + parseFloat(i.price || 0) * (i.quantity || 1),
    0
  );
}

/**
 * Final total after discount.
 */
export function getTotal() {
  return Math.max(0, getSubtotal() - state.discount);
}

/* ══════════════════════
   localStorage Engine
══════════════════════ */

export function saveToLocalStorage() {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        items:    state.items,
        coupon:   state.coupon,
        discount: state.discount,
      })
    );
  } catch (err) {
    console.warn("[cart-state] localStorage write failed:", err);
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