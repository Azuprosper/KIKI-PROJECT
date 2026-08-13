export const API_URL = "https://cut-unjustly-ellipse.ngrok-free.dev";

export function toggleChat() {
  const window = document.getElementById("chat-window");
  window.classList.toggle("chat-hidden");
}

export function appendMessage(sender, text, products = []) {
  const container = document.getElementById("chat-messages");
  const msgDiv = document.createElement("div");
  msgDiv.className = `message ${sender}-message`;
  msgDiv.innerHTML = text;

  // If products were returned, display product cards in chat
  if (products && products.length > 0) {
    products.forEach(p => {
      const card = document.createElement("div");
      card.className = "product-card";
      card.innerHTML = `
        <strong>${p.name} - $${p.price}</strong>
        <div>${p.description}</div>
        <small>In Stock: ${p.stock}</small>
      `;
      msgDiv.appendChild(card);
    });
  }

  container.appendChild(msgDiv);
  container.scrollTop = container.scrollHeight;
}

// Handle Text Chat Submission
export async function handleSend(event) {
  event.preventDefault();
  const input = document.getElementById("user-input");
  const text = input.value.trim();
  if (!text) return;

  appendMessage("user", text);
  input.value = "";

  try {
    const res = await fetch(`${API_URL}/chat`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "ngrok-skip-browser-warning": "true"
      },
      body: JSON.stringify({ message: text })
    });
    const data = await res.json();
    appendMessage("bot", data.reply, data.products);
  } catch (err) {
    appendMessage("bot", "Error connecting to server. Make sure Python backend is running!");
  }
}

// Handle Image Upload & Search
export async function handleImageUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  appendMessage("user", `📷 Uploaded image: <em>${file.name}</em>`);

  const formData = new FormData();
  formData.append("file", file);
  appendMessage("bot", "<em>Thinking...</em>");         

  try {
    const res = await fetch(`${API_URL}/image-search`, {
      method: "POST",
      headers: {
        "ngrok-skip-browser-warning": "true"
      },
      body: formData
    });
    const data = await res.json();
    appendMessage("bot", data.reply, data.products);
  } catch (err) {
    appendMessage("bot", "Failed to analyze image.");
  }
}

// All event listeners
document.addEventListener("DOMContentLoaded", () => {
  const toggleBtn = document.getElementById("chat-toggle-btn");
  const closeBtn = document.getElementById("chat-close-btn");
  const chatForm = document.getElementById("chat-form");
  const imageInput = document.getElementById("image-input");
  const imageTrigger = document.getElementById("image-upload-trigger");

  if (toggleBtn) toggleBtn.addEventListener("click", toggleChat);
  if (closeBtn) closeBtn.addEventListener("click", toggleChat);
  if (chatForm) chatForm.addEventListener("submit", handleSend);
  if (imageTrigger && imageInput) {
    imageTrigger.addEventListener("click", () => imageInput.click());
    imageInput.addEventListener("change", handleImageUpload);
  }
});