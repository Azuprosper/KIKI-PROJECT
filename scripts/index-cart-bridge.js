/* ════════════════════════════════════════════
   KIKI — INDEX CART BRIDGE
   Communicates with Java backend without touching index.js
════════════════════════════════════════════ */

import { addToCart as addToCartAPI, fetchCartFromServer } from "./cart-api.js";

// Global set to lock buttons while request is in-flight (prevents multi-click multiplier)
const activeRequests = new Set();

/**
 * Fetch total cart item count from backend and update badge UI safely
 */
async function syncCartBadge() {
  const badge = document.querySelector('.cart-quantity');
  if (!badge) return;

  const token = localStorage.getItem('token') || localStorage.getItem('authToken');
  if (!token) return; // Do not call server if user is not signed in

  try {
    const serverCart = await fetchCartFromServer();
    
    // Exact match to Java CartResponseDto.java: { items: List<CartItemResponseDto> }
    const items = serverCart?.items || [];
    
    const totalQty = items.reduce((sum, item) => sum + (parseInt(item.quantity, 10) || 1), 0);
    
    badge.textContent = totalQty;
  } catch (err) {
    console.warn("[cart-bridge] Could not update badge from server:", err.message);
  }
}

/**
 * Initialize event listeners on page load
 */
document.addEventListener('DOMContentLoaded', () => {
  // Update badge count initial state
  syncCartBadge();

  // Listen for Add to Cart button clicks across the page
  document.addEventListener('click', async (event) => {
    const btn = event.target.closest('.add-to-cart-button, .js-add-to-cart');
    if (!btn) return;

    // Prevent default form submits or navigation
    event.preventDefault();

    const productId = btn.dataset.productId || btn.dataset.id;
    if (!productId) return;

    // LOCK GUARD: Ignore click if this specific product/button is already processing
    if (activeRequests.has(productId) || btn.disabled) return;

    // Lock button
    activeRequests.add(productId);
    btn.disabled = true;
    const originalText = btn.textContent;
    btn.textContent = "Adding…";

    try {
      await addToCartAPI(productId, 1);
      await syncCartBadge();
    } catch (err) {
      console.error("[cart-bridge] Add to cart failed:", err.message);
    } finally {
      // UNLOCK GUARD: Re-enable button regardless of success/error
      activeRequests.delete(productId);
      btn.disabled = false;
      btn.textContent = originalText;
    }
  });
});