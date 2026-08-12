import json
import torch
from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from transformers import AutoModelForCausalLM, AutoTokenizer
from sentence_transformers import SentenceTransformer, util
import uvicorn
import cv_model
from cv_model import extract_image_description

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 1. Product Database
PRODUCTS = [
    {"id": 2, "name": "Electric Kettle", "description": "Electric Glass and Steel Hot Tea Water Kettle - 1.7-Liter", "price": 29.99, "image_url": "images/products/electric-glass-and-steel-hot-water-kettle.webp", "stock": 50},
    {"id": 3, "name": "Coffee maker", "description": "Coffeemaker with Glass Carafe and Reusable Filter - 25 Oz", "price": 35.50, "image_url": "images/products/coffeemaker-with-glass-carafe-black.jpg", "stock": 50},
    {"id": 4, "name": "Blender", "description": "Countertop Blender - 64oz, 1400 Watts", "price": 49.99, "image_url": "images/products/countertop-blender-64-oz.jpg", "stock": 50},
    {"id": 5, "name": "Cotton Socks", "description": "Black and Gray Athletic Cotton Socks - 6 Pairs", "price": 12.00, "image_url": "images/products/athletic-cotton-socks-6-pairs.jpg", "stock": 36},
    {"id": 6, "name": "Basketball", "description": "Intermediate size basketball for sports", "price": 22.00, "image_url": "images/products/intermediate-composite-basketball.jpg", "stock": 40},
    {"id": 7, "name": "Cotton t-Shirt", "description": "Adults Plain Cotton T-Shirt - 2 Pack", "price": 18.00, "image_url": "images/products/adults-plain-cotton-tshirt-2-pack-teal.jpg", "stock": 25},
    {"id": 8, "name": "Dinner Plates", "description": "6 Piece White Dinner Plate Set", "price": 30.00, "image_url": "images/products/6-piece-white-dinner-plate-set.jpg", "stock": 42},
    {"id": 9, "name": "Baking set", "description": "6-Piece Nonstick, Carbon Steel Oven Bakeware Baking Set", "price": 27.50, "image_url": "images/products/6-piece-non-stick-baking-set.webp", "stock": 42},
    {"id": 10, "name": "Liquid Detergent", "description": "Liquid Laundry Detergent, 110 Loads, 82.5 Fl Oz", "price": 15.00, "image_url": "images/products/liquid-laundry-detergent-plain.jpg", "stock": 20},
    {"id": 11, "name": "Sneakers", "description": "Waterproof Knit Athletic Sneakers - Gray", "price": 55.00, "image_url": "images/products/knit-athletic-sneakers-gray.jpg", "stock": 30},
    {"id": 12, "name": "Sunglasses", "description": "Round sun-protection glasses", "price": 14.99, "image_url": "images/products/round-sunglasses-black.jpg", "stock": 30},
    {"id": 13, "name": "Sandals", "description": "Womens Two Strap Buckle Sandals - Tan", "price": 24.99, "image_url": "images/products/women-beach-sandals.jpg", "stock": 15},
    {"id": 14, "name": "Tissue", "description": "Ultra Soft Tissue 2-Ply - 18 Box", "price": 21.00, "image_url": "images/products/facial-tissue-2-ply-18-boxes.jpg", "stock": 115},
    {"id": 15, "name": "Lifeguard Hat", "description": "Straw lifeguard sun hat", "price": 16.50, "image_url": "images/products/straw-sunhat.webp", "stock": 50},
    {"id": 16, "name": "Earrings", "description": "Sterling Silver Sky Flower Stud Earrings", "price": 38.00, "image_url": "images/products/sky-flower-stud-earrings.webp", "stock": 50},
    {"id": 17, "name": "Womens Hoodie", "description": "Womens Stretch Popover Hoodie", "price": 42.00, "image_url": "images/products/women-stretch-popover-hoodie-black.jpg", "stock": 30},
    {"id": 18, "name": "Bath Rug", "description": "Bathroom Bath Rug Mat 20 x 31 Inch - Grey", "price": 19.99, "image_url": "images/products/bathroom-rug.jpg", "stock": 43},
    {"id": 19, "name": "Knit ballet", "description": "Womens Knit Ballet Flat", "price": 32.00, "image_url": "images/products/women-knit-ballet-flat-black.jpg", "stock": 47},
    {"id": 20, "name": "Polo Shirt", "description": "Mens Regular-Fit Quick-Dry Golf Polo Shirt", "price": 26.00, "image_url": "images/products/men-golf-polo-t-shirt-blue.jpg", "stock": 57},
    {"id": 21, "name": "Trash can", "description": "Trash Can with Foot Pedal - Brushed Stainless Steel", "price": 45.00, "image_url": "images/products/trash-can-with-foot-pedal-50-liter.jpg", "stock": 12}
]

PRODUCTS_CONTEXT = "\n".join([
    f"- {p['name']}: {p['description']} (Price: ${p['price']}, Stock: {p['stock']})"
    for p in PRODUCTS
])

# 2. Vector Embedding Setup
print("Loading Embedding Model...")
embedder = SentenceTransformer('all-MiniLM-L6-v2')

# Pre-compute product embeddings ONCE at server startup
product_texts = [f"{p['name']} {p['description']}" for p in PRODUCTS]
product_embeddings = embedder.encode(product_texts, convert_to_tensor=True)
print("Product vectors embedded successfully!")

def find_relevant_products_vector(query: str, top_k: int = 3, min_similarity: float = 0.20):
    # Encode user search query or image tags into high-dimensional vector space
    query_embedding = embedder.encode(query, convert_to_tensor=True)
    
    # Calculate cosine similarity matrix against all catalog vectors
    similarity_scores = util.cos_sim(query_embedding, product_embeddings)[0]
    
    # Get top matching product indices
    top_results = torch.topk(similarity_scores, k=top_k)
    
    matches = []
    for score, idx in zip(top_results.values, top_results.indices):
        if score >= min_similarity:
            matches.append(PRODUCTS[idx.item()])
            
    return matches

# 3. Load Qwen LLM for Text Chat
MODEL_NAME = "Qwen/Qwen2.5-0.5B-Instruct"
print("Loading Qwen from local cache...")
tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
model = AutoModelForCausalLM.from_pretrained(
    MODEL_NAME,
    dtype=torch.float16 if torch.cuda.is_available() else torch.float32,
    device_map="auto"
)
print("Qwen loaded successfully!")

class ChatRequest(BaseModel):
    message: str

# 4. Standard Text Chat Route
@app.post("/chat")
def chat(request: ChatRequest):
    matched_products = find_relevant_products_vector(request.message, top_k=3)
    
    system_prompt = (
        "You are Kiki Store Assistant, a helpful sales associate. "
        "Use ONLY the following product inventory to answer user inquiries:\n"
        f"{PRODUCTS_CONTEXT}\n\n"
        "Be friendly, concise, and mention prices when relevant."
    )
    
    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": request.message}
    ]
    
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

# 5. Image Search Route (Uses Vector Matching + Skips LLM Overhead)
@app.post("/image-search")
async def image_search(file: UploadFile = File(...)):
    image_bytes = await file.read()
    
    # Step A: Computer vision extracts tags
    detected_description = extract_image_description(image_bytes)
    print(f"Vision Model Detected: {detected_description}")
    
    # Step B: Fast vector search maps vision tags directly to inventory
    matched_products = find_relevant_products_vector(detected_description, top_k=2)
    
    # Step C: Clean structured response
    clean_tags = detected_description.replace("_", " ")
    if matched_products:
        reply_text = f"I scanned your image ({clean_tags}) and found these matching items in store:"
    else:
        reply_text = f"I scanned your image ({clean_tags}), but we don't have an exact match in stock right now."
        matched_products = PRODUCTS[:2] # Fallback display
        
    return {
        "reply": reply_text,
        "products": matched_products
    }

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8000)