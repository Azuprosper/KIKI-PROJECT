const API_URL = 'http://localhost:8080/api/products';

async function loadProducts(){
  try{
    const response = await fetch(API_URL);
    const products = await response.json();
  }
};

const container = document.getElementById('product-container');
container.innerHTML = '';
