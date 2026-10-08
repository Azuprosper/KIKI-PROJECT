// Target elements
const productTableBody = document.querySelector('#product-table-body');
const searchInput = document.querySelector('#product-search-input');
const searchBtn = document.querySelector('#product-search-btn');

// Modal elements
const deleteModal = document.querySelector('#delete-product-modal');
const cancelDeleteBtn = document.querySelector('#cancel-delete-product');
const confirmDeleteBtn = document.querySelector('#confirm-delete-product');
const deleteModalMsg = document.querySelector('#delete-modal-msg');

const BASE_URL = 'https://kebab-rule-blandness.ngrok-free.dev';

let allProducts = [];
let targetProductId = null;

// 1. Fetch all products
async function loadProducts() {
  try {
    productTableBody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align: center; padding: 24px; color: #666;">
          Loading products...
        </td>
      </tr>
    `;

    const token = localStorage.getItem('token');

    const response = await fetch(`${BASE_URL}/api/products`, {
      headers: {
        'ngrok-skip-browser-warning': 'true',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    allProducts = data.content || [];
    renderProductTable(allProducts);

  } catch (error) {
    console.error('Failed to load products:', error);
    productTableBody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align: center; color: #dc3545; padding: 24px;">
          Failed to fetch products. Check if the backend is active.
        </td>
      </tr>
    `;
  }
}

// 2. Render table rows
function renderProductTable(products) {
  if (!products || products.length === 0) {
    productTableBody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align: center; padding: 24px; color: #666;">
          No products found.
        </td>
      </tr>
    `;
    return;
  }

  const rowsHtml = products.map((item) => {
    const id = item.id;
    const name = item.name || 'Untitled Product';
    const store = item.organizationName || 'N/A';
    const price = typeof item.price === 'number' ? item.price.toFixed(2) : (item.price || '0.00');
    const image = item.imageUrl || 'images/icons/cart-icon.png';
    const stock = item.stockQuantity ?? 0;

    const safeName = name.replace(/'/g, "\\'");

    return `
      <tr id="product-row-${id}">
        <td>
          <img 
            src="${image}" 
            alt="${name}" 
            style="width: 44px; height: 44px; object-fit: contain; border-radius: 6px; background-color: #f8f9fa; border: 1px solid #eee;"
            onerror="this.src='images/icons/cart-icon.png'"
          >
        </td>
        <td><strong>${name}</strong></td>
        <td>${store}</td>
        <td>$${price}</td>
        <td>
          <span style="
            display: inline-block;
            padding: 4px 10px;
            border-radius: 12px;
            font-size: 13px;
            font-weight: 600;
            background-color: ${Number(stock) > 0 ? '#e8f4fd' : '#fbeaea'};
            color: ${Number(stock) > 0 ? '#0284c7' : '#d92d20'};
          ">
            ${stock} units
          </span>
        </td>
        <td>
          <button 
            class="action-btn delete-btn" 
            onclick="openDeleteModal(${id}, '${safeName}')"
            style="cursor: pointer; padding: 6px 12px; border-radius: 4px; border: 1px solid #dc3545; color: #dc3545; background: transparent; font-weight: 500;"
          >
            Delete
          </button>
        </td>
      </tr>
    `;
  }).join('');

  productTableBody.innerHTML = rowsHtml;
}

// 3. Modal Trigger
window.openDeleteModal = function(id, name) {
  targetProductId = id;
  if (deleteModalMsg) {
    deleteModalMsg.textContent = `Are you sure you want to permanently delete "${name}"? This action cannot be undone.`;
  }
  deleteModal.style.display = 'flex';
};

// 4. Close Modal
function closeDeleteModal() {
  targetProductId = null;
  deleteModal.style.display = 'none';
}

if (cancelDeleteBtn) {
  cancelDeleteBtn.addEventListener('click', closeDeleteModal);
}

if (deleteModal) {
  deleteModal.addEventListener('click', (e) => {
    if (e.target === deleteModal) closeDeleteModal();
  });
}

// 5. Confirm and Send Authenticated DELETE Request
if (confirmDeleteBtn) {
  confirmDeleteBtn.addEventListener('click', async () => {
    if (!targetProductId) return;

    confirmDeleteBtn.disabled = true;
    confirmDeleteBtn.textContent = 'Deleting...';

    try {
      const token = localStorage.getItem('token');

      const response = await fetch(`${BASE_URL}/api/products/${targetProductId}`, {
        method: 'DELETE',
        headers: {
          'ngrok-skip-browser-warning': 'true',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` // Fixes the 403 Forbidden error
        }
      });

      if (!response.ok) {
        throw new Error(`Delete failed with HTTP status: ${response.status}`);
      }

      // Remove item from state
      allProducts = allProducts.filter(p => p.id !== targetProductId);

      // Remove row directly from the DOM
      const row = document.querySelector(`#product-row-${targetProductId}`);
      if (row) {
        row.remove();
      } else {
        renderProductTable(allProducts);
      }

      closeDeleteModal();

    } catch (err) {
      console.error('Delete error:', err);
      alert('Failed to delete product. Check console or make sure your admin session is valid.');
    } finally {
      confirmDeleteBtn.disabled = false;
      confirmDeleteBtn.textContent = 'Delete';
      targetProductId = null;
    }
  });
}

// 6. Search filter
function filterProducts() {
  const query = searchInput.value.toLowerCase().trim();
  const filtered = allProducts.filter((product) => {
    const name = (product.name || '').toLowerCase();
    const org = (product.organizationName || '').toLowerCase();
    return name.includes(query) || org.includes(query);
  });
  renderProductTable(filtered);
}

if (searchInput) searchInput.addEventListener('input', filterProducts);
if (searchBtn) searchBtn.addEventListener('click', filterProducts);

// Initial Load
loadProducts();

// Logout handling
function setupLogout() {
    const logoutBtn = document.querySelector('.logout-btn');
    const modal = document.getElementById('logout-modal');
    const cancelBtn = document.getElementById('cancel-logout');
    const confirmBtn = document.getElementById('confirm-logout');

    if (logoutBtn && modal && cancelBtn && confirmBtn) {
        logoutBtn.addEventListener('click', () => {
            modal.style.display = 'flex';
        });

        cancelBtn.addEventListener('click', () => {
            modal.style.display = 'none';
        });

        confirmBtn.addEventListener('click', () => {
            localStorage.removeItem('token'); 
            window.location.href = 'login.html'; 
        });

        window.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
    }
}