/* ════════════════════════════════════════════
   KIKI — CART API LAYER
   All fetch() calls → backend endpoints
════════════════════════════════════════════ */

const BASE_URL = "https://kebab-rule-blandness.ngrok-free.dev";

/* ── Shared fetch wrapper ── */
async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;

  const defaultHeaders = {
    "Content-Type": "application/json",
    // ngrok tunnels require this header to bypass the browser warning page
    "ngrok-skip-browser-warning": "true",
  };

  const response = await fetch(url, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...(options.headers || {}),
    },
  });

  // Surface server errors as thrown Error objects
  if (!response.ok) {
    let message = `HTTP ${response.status}`;
    try {
      const errBody = await response.json();
      message = errBody?.detail || errBody?.message || message;
    } catch {
      /* body not JSON — keep generic message */
    }
    throw new Error(message);
  }

  // 204 No Content → return null
  if (response.status === 204) return null;

  return response.json();
}

/* ════════════════════════════════════════════
   API HANDLERS
════════════════════════════════════════════ */

/**
 * GET /api/cart
 * Fetch the full cart from the server.
 * @returns {Promise<{ items: Array }>}
 */
export async function fetchCartFromServer() {
  return request("/api/cart", { method: "GET" });
}

/**
 * POST /api/cart/items
 * Add a new item to the server cart.
 * @param {{ product_id: string|number, quantity: number }} item
 * @returns {Promise<object>}
 */
export async function addToCart(item) {
  return request("/api/cart/items", {
    method: "POST",
    body: JSON.stringify(item),
  });
}

/**
 * PATCH /api/cart/items/:id
 * Update the quantity of an existing cart item.
 * @param {string|number} id
 * @param {number} quantity
 * @returns {Promise<object>}
 */
export async function updateQty(id, quantity) {
  return request(`/api/cart/items/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ quantity }),
  });
}

/**
 * DELETE /api/cart/items/:id
 * Remove an item from the server cart.
 * @param {string|number} id
 * @returns {Promise<null>}
 */
export async function removeFromCart(id) {
  return request(`/api/cart/items/${id}`, { method: "DELETE" });
}

/**
 * POST /api/cart/checkout
 * Submit the cart for checkout.
 * @param {{ coupon?: string }} payload
 * @returns {Promise<object>}
 */
export async function submitCart(payload = {}) {
  return request("/api/cart/checkout", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}