
const BASE_URL = "https://kebab-rule-blandness.ngrok-free.dev";


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
    ...getAuthHeaders(), // Attaches Bearer JWT token required by Authentication param
  };

  const response = await fetch(url, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...(options.headers || {}),
    },
  });

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

  if (response.status === 204) return null;

  return response.json();
}

/* ════════════════════════════════════════════
   API HANDLERS
════════════════════════════════════════════ */

/**
 * GET /api/cart
 * Fetches CartResponseDto: { cartId, items: [...], totalPrice }
 */
export async function fetchCartFromServer() {
  const data = await request("/api/cart", { method: "GET" });
  
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.items)) return data.items;
  if (Array.isArray(data.cartItems)) return data.cartItems;
  
  return [];
}

/**
 * POST /api/cart/items
 * Maps strictly to AddCartItemRequest: { productId, quantity }
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
 * Maps to updateItemQuantity(@PathVariable Long itemId, @RequestBody UpdateCartItemRequest)
 */
export async function updateQty(cartItemId, quantity) {
  return request(`/api/cart/items/${cartItemId}`, {
    method: "PUT",
    body: JSON.stringify({ 
      quantity: Number(quantity) 
    }),
  });
}

/**
 * DELETE /api/cart/items/:itemId
 * Maps to removeItemFromCart(@PathVariable Long itemId)
 * Returns updated CartResponseDto
 */
export async function removeFromCart(cartItemId) {
  return request(`/api/cart/items/${cartItemId}`, { method: "DELETE" });
}


export async function submitCart(payload = {}) {
  return request("/api/cart/checkout", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}