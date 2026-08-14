import json
import torch
import requests
from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from transformers import AutoModelForCausalLM, AutoTokenizer
from sentence_transformers import SentenceTransformer, util
import uvicorn
import cv_model
from cv_model import extract_image_description
from contextlib import asynccontextmanager
import urllib3

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

JAVA_API_URL = "https://kebab-rule-blandness.ngrok-free.dev/api/products?size=100"

# Globals
PRODUCTS = []
product_embeddings = None

print("Loading Embedding Model...")
embedder = SentenceTransformer('all-MiniLM-L6-v2')

def update_embeddings_and_context():
    global PRODUCTS, product_embeddings
    
    # Standardize field names from Java payload
    for p in PRODUCTS:
        p['stock'] = p.get('stockQuantity', p.get('quantity', 0))
    
    product_texts = [
        f"{p.get('name', '')} {p.get('description', '')}" 
        for p in PRODUCTS
    ]
    
    product_embeddings = embedder.encode(product_texts, convert_to_tensor=True)
    print(f"Vector embeddings generated for {len(PRODUCTS)} products!")

def fetch_and_embed_products():
    global PRODUCTS
    headers = {
        "User-Agent": "FastAPI-AI-Service",
        "ngrok-skip-browser-warning": "true"
    }
    
    try:
        response = requests.get(JAVA_API_URL, headers=headers, timeout=10)
        if response.status_code == 200:
            data = response.json()
            if isinstance(data, dict) and "content" in data:
                PRODUCTS = data["content"]
            else:
                PRODUCTS = data
                
            print(f"Successfully fetched {len(PRODUCTS)} live products from Java backend!")
            update_embeddings_and_context()
            return
    except Exception as e:
        print(f"Error connecting to Java backend: {e}")
        
    print("Using local fallback product database...")
    PRODUCTS = [
        {"id": 2, "name": "Electric Kettle", "description": "Electric Glass and Steel Hot Tea Water Kettle - 1.7-Liter", "price": 29.99, "image_url": "images/products/electric-glass-and-steel-hot-water-kettle.webp", "stock": 50},
        {"id": 3, "name": "Coffee maker", "description": "Coffeemaker with Glass Carafe and Reusable Filter - 25 Oz", "price": 35.50, "image_url": "images/products/coffeemaker-with-glass-carafe-black.jpg", "stock": 50},
        {"id": 5, "name": "Cotton Socks", "description": "Black and Gray Athletic Cotton Socks - 6 Pairs", "price": 12.00, "image_url": "images/products/athletic-cotton-socks-6-pairs.jpg", "stock": 36},
        {"id": 11, "name": "Sneakers", "description": "Waterproof Knit Athletic Sneakers - Gray", "price": 55.00, "image_url": "images/products/knit-athletic-sneakers-gray.jpg", "stock": 30},
        {"id": 13, "name": "Sandals", "description": "Womens Two Strap Buckle Sandals - Tan", "price": 24.99, "image_url": "images/products/women-beach-sandals.jpg", "stock": 15}
    ]
    update_embeddings_and_context()

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("FastAPI Application Starting Up...")
    fetch_and_embed_products()
    yield
    print("FastAPI Application Shutting Down...")

# Yes, defining app after lifespan is standard FastAPI practice
app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def find_relevant_products_vector(query: str, top_k: int = 3, min_similarity: float = 0.3):
    if product_embeddings is None or len(PRODUCTS) == 0:
        return []
        
    query_embedding = embedder.encode(query, convert_to_tensor=True)
    similarity_scores = util.cos_sim(query_embedding, product_embeddings)[0]
    
    top_k = min(top_k, len(PRODUCTS))
    top_results = torch.topk(similarity_scores, k=top_k)
    
    matches = []
    for score, idx in zip(top_results.values, top_results.indices):
        if score >= min_similarity:
            matches.append(PRODUCTS[idx.item()])
            
    return matches

MODEL_NAME = "Qwen/Qwen2.5-0.5B-Instruct"
tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
model = AutoModelForCausalLM.from_pretrained(
    MODEL_NAME,
    dtype=torch.float16 if torch.cuda.is_available() else torch.float32,
    device_map="auto"
)

class ChatRequest(BaseModel):
    message: str

@app.post("/chat")
def chat(request: ChatRequest):
    matched_products = find_relevant_products_vector(request.message, top_k=3)
    
    # Build context DYNAMICALLY using ONLY the matched items
    if matched_products:
        context_str = "\n".join([
            f"- {p.get('name')}: {p.get('description')} | Price: ${p.get('price')} | In Stock: {p.get('stock')}"
            for p in matched_products
        ])
    else:
        context_str = "No specific products matched this query."

    
    system_prompt = (
        "You are Kiki Store Assistant, a sales associate helping a customer.\n"
        "Your job is to DIRECTLY answer the customer using ONLY the inventory below:\n"
        f"{context_str}\n\n"
        "Rules:\n"
        "- Never ask the customer if an item exists—tell them directly!\n"
        "- Confirm item availability, price, and stock warmly and concisely."
    )
    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": request.message}
    ]
    
    print(f"messages: {messages}")
    
    text_prompt = tokenizer.apply_chat_template(messages, tokenize=False, add_generation_prompt=True)
    inputs = tokenizer(text_prompt, return_tensors="pt").to(model.device)
    
    with torch.no_grad():
        outputs = model.generate(
            **inputs,
            max_new_tokens=100,
            temperature=0.3,
            do_sample=True
        )
    
    generated_text = tokenizer.decode(outputs[0][inputs.input_ids.shape[1]:], skip_special_tokens=True)
    
    return {
        "reply": generated_text,
        "products": matched_products
    }

@app.post("/image-search")
async def image_search(file: UploadFile = File(...)):
    image_bytes = await file.read()
    
    detected_description = extract_image_description(image_bytes)
    print(f"vison model detected: {detected_description}")
    matched_products = find_relevant_products_vector(detected_description, top_k=2)
    
    clean_tags = detected_description.replace("_", " ")
    if matched_products:
        reply_text = f"I scanned your image ({clean_tags}) and found these matching items:"
    else:
        reply_text = f"I scanned your image ({clean_tags}), but we don't have an exact match in stock right now."
        matched_products = []  # Empty list prevents showing random items!
        
    return {
        "reply": reply_text,
        "products": matched_products
    }

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8000)