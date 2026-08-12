const API_BASE = 'https://kebab-rule-blandness.ngrok-free.dev/api';

function getToken() {
  return localStorage.getItem('auth_token') || null;
}

function authHeaders() {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${getToken()}`
  };
}

window.CartAPI = {
  async fetchCartFromServer() {
    const response = await fetch(`${API_BASE}/cart`, {
      method: 'GET',
      headers: authHeaders()
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  },

  async submitCart() {
    const response = await fetch(`${API_BASE}/cart`, {
      method: 'POST',
      headers: authHeaders()
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  },

  async addItem(productId, quantity) {
    const response = await fetch(`${API_BASE}/cart/items`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ productId, quantity })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  },

  async updateItem(productId, quantity) {
    const response = await fetch(`${API_BASE}/cart/items/${productId}`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify({ quantity })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  },

  async removeItem(productId) {
    const response = await fetch(`${API_BASE}/cart/items/${productId}`, {
      method: 'DELETE',
      headers: authHeaders()
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  }
};