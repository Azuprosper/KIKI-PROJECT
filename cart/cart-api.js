const API_BASE = '/api';

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
    const token = getToken();
    if (!token) {
      window.location.href = '../login.html?redirect=/cart';
      return;
    }

    const res = await fetch(`${API_BASE}/cart`, {
      headers: authHeaders()
    });

    if (!res.ok) {
      throw new Error('Failed to fetch cart');
    }

    const data = await res.json();
    Object.assign(cartState, data);
    saveCartState();
    renderCartItems();
  },

  async submitCart() {
    const token = getToken();
    if (!token) {
      window.location.href = '../login.html?redirect=/cart';
      return;
    }

    const payload = {
      items: cartState.items,
      coupon: cartState.coupon || '',
      discount: cartState.discount || 0
    };

    const res = await fetch(`${API_BASE}/cart/checkout`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      throw new Error('Failed to submit cart');
    }

    return await res.json();
  },

  async addItem(productId, quantity) {
    const token = getToken();
    if (!token) {
      window.location.href = '../login.html?redirect=/cart';
      return;
    }

    const res = await fetch(`${API_BASE}/cart/items`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ productId, quantity })
    });

    if (!res.ok) {
      throw new Error('Failed to add item');
    }

    return await res.json();
  },

  async updateItem(productId, quantity) {
    const token = getToken();
    if (!token) {
      window.location.href = '../login.html?redirect=/cart';
      return;
    }

    const res = await fetch(`${API_BASE}/cart/items/${productId}`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify({ quantity })
    });

    if (!res.ok) {
      throw new Error('Failed to update item');
    }

    return await res.json();
  },

  async removeItem(productId) {
    const token = getToken();
    if (!token) {
      window.location.href = '../login.html?redirect=/cart';
      return;
    }

    const res = await fetch(`${API_BASE}/cart/items/${productId}`, {
      method: 'DELETE',
      headers: authHeaders()
    });

    if (!res.ok) {
      throw new Error('Failed to remove item');
    }

    return await res.json();
  }
};
