/* ════════════════════════════════════════════
   KIKI — CART API LAYER
   All fetch() calls → backend endpoints
════════════════════════════════════════════ */

const BASE_URL = "https://kebab-rule-blandness.ngrok-free.dev";

/* ── Helper: Retrieve Auth Token ── */
function getAuthHeaders() {
  const token = localStorage.getItem('token') || localStorage.getItem('authToken');
  return token ? { "Authorization": `Bearer ${token}` } : {};
}

/* ── Shared fetch wrapper ── */
async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;

  const defaultHeaders = {
    "Content-Type": "application/json",
    "ngrok-skip-browser-warning": "true",
    ...getAuthHeaders(), // Automatically attaches JWT token if available
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
 * Fetch the full cart from the server and unwrap its items array.
 * @returns {Promise<Array>}
 */
export async function fetchCartFromServer() {
  const data = await request("/api/cart", { method: "GET" });
  // Unwraps the Java CartResponseDto { id, items, totalPrice } into just the items array
  return data?.items || data?.cartItems || (Array.isArray(data) ? data : []);
}

/**
 * POST /api/cart/items
 * Add a new item to the server cart.
 * Maps strictly to AddCartItemRequest.java: { productId, quantity }
 */
export async function addToCart(productId, quantity = 1) {
  return request("/api/cart/items", {
    method: "POST",
    body: JSON.stringify({ 
      productId: Number(productId), 
      quantity: Number(quantity) 
    }),
  });
}

/**
 * PUT /api/cart/items/:itemId
 * Update the quantity of an existing cart item.
 * @param {string|number} cartItemId - The ID of the item in the cart (NOT the productId)
 * @param {number} quantity
 * @returns {Promise<object>}
 */
export async function updateQty(cartItemId, quantity) {
  return request(`/api/cart/items/${cartItemId}`, {
    method: "PUT", // Matches @PutMapping in CartController.java
    body: JSON.stringify({ 
      quantity: Number(quantity) 
    }),
  });
}

/**
 * DELETE /api/cart/items/:itemId
 * Remove an item from the server cart.
 * @param {string|number} cartItemId - The ID of the item in the cart (NOT the productId)
 * @returns {Promise<null>}
 */
export async function removeFromCart(cartItemId) {
  return request(`/api/cart/items/${cartItemId}`, { method: "DELETE" });
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