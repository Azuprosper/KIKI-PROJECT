const BASE_URL = "https://kebab-rule-blandness.ngrok-free.dev";

// --- SECURITY ---
function getAuthHeaders() {
  const token = localStorage.getItem('token') || localStorage.getItem('authToken');
  return token ? { "Authorization": `Bearer ${token}` } : {};
}

// --- MASTER FETCH WRAPPER ---
async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;

  const headers = {
    "Content-Type": "application/json",
    "ngrok-skip-browser-warning": "true",
    ...getAuthHeaders(),
    ...(options.headers || {}),
  };

  const response = await fetch(url, { ...options, headers });

  if (!response.ok) {
    let message = `HTTP ${response.status}`;
    try {
      const errBody = await response.json();
      message = errBody.detail || errBody.message || message;
    } catch {
      // Fails silently if the server doesn't return JSON text
    }
    throw new Error(message);
  }

  // 204 No Content means success, but no data to parse
  if (response.status === 204) return null;
  return response.json();
}

// --- API ENDPOINTS ---

export async function fetchCartFromServer() {
  const data = await request("/api/cart", { method: "GET" });
  
  if (!data) return [];
  if (Array.isArray(data)) return data;
  return data.items || data.cartItems || [];
}

export async function addToCart(productId, quantity = 1) {
  return request("/api/cart/items", {
    method: "POST",
    body: JSON.stringify({ 
      productId: Number(productId), 
      quantity: Number(quantity) 
    }),
  });
}

export async function updateQty(cartItemId, quantity) {
  return request(`/api/cart/items/${cartItemId}`, {
    method: "PUT",
    body: JSON.stringify({ 
      quantity: Number(quantity) 
    }),
  });
}

export async function removeFromCart(cartItemId) {
  return request(`/api/cart/items/${cartItemId}`, { method: "DELETE" });
}

export async function submitCart() {
 
  return request("/api/cart/checkout", { method: "POST" });
}