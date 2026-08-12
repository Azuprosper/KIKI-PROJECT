import json
import torch
from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from transformers import AutoModelForCausalLM, AutoTokenizer
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

# 2. Load Local Model & Tokenizer (Loads from local cache if already downloaded)
MODEL_NAME = "Qwen/Qwen2.5-0.5B-Instruct"
print("Loading Model from local cache...")
tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
model = AutoModelForCausalLM.from_pretrained(
    MODEL_NAME,
    dtype=torch.float16 if torch.cuda.is_available() else torch.float32,
    device_map="auto"
)
print("Model loaded successfully!")

class ChatRequest(BaseModel):
    message: str

def find_relevant_products(user_query: str):
    query = user_query.lower()
    matches = []
    synonyms = []
    if any(w in query for w in ["shoe", "shoes", "footwear"]):
        synonyms.extend(["sneakers", "sandals", "ballet"])
    
    for item in PRODUCTS:
        text = f"{item['name']} {item['description']}".lower()
        if query in text or any(syn in text for syn in synonyms):
            matches.append(item)
            
    return matches

# 3. LLM Chat Route
@app.post("/chat")
def chat(request: ChatRequest):
    matched_products = find_relevant_products(request.message)
    
    system_prompt = (
        "You are Kiki Store Assistant, a helpful sales associate. "
        "Use ONLY the following product inventory to answer user inquiries:\n"
        f"{PRODUCTS_CONTEXT}\n\n"
        "Be friendly, concise, and mention prices when relevant."
        "If the User goes of topic politely reply: 'I am a Store Assitant"
    )
    
    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": request.message}
    ]
    
    text_prompt = tokenizer.apply_chat_template(messages, tokenize=False, add_generation_prompt=True)
    inputs = tokenizer(text_prompt, return_tensors="pt").to(model.device)
    
    # Generate text without tracking gradients (faster & saves memory)
    with torch.no_grad():
        outputs = model.generate(
            **inputs,
            max_new_tokens=120,
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
    # 1. Read binary bytes of uploaded image
    image_bytes = await file.read()
    
    # 2. Extract raw tags from MobileNet
    detected_description = extract_image_description(image_bytes)
    print(f"Vision Model Detected: {detected_description}")
    
    # 3. Ask Qwen to evaluate the catalog directly
    system_prompt = (
        "You are Kiki Store Assistant. A customer uploaded an image containing: "
        f"'{detected_description}'.\n\n"
        "Here is our entire store inventory:\n"
        f"{PRODUCTS_CONTEXT}\n\n"
        "Task:\n"
        "1. Select ONLY the TOP 1 or TOP 2 products from the inventory that best match the detected object.\n"
        "2. If no items match closely, politely state that we do not have a direct match.\n"
        "3. Do NOT list unrelated items like socks, towels, or kettles unless they directly match."
    )
    
    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": "What matching items do you have in store for my image?"}
    ]
    
    text_prompt = tokenizer.apply_chat_template(messages, tokenize=False, add_generation_prompt=True)
    inputs = tokenizer(text_prompt, return_tensors="pt").to(model.device)
    
    with torch.no_grad():
        outputs = model.generate(
            **inputs,
            max_new_tokens=100,
            temperature=0.2, # Lower temperature forces more precise selection
            do_sample=True
        )
        
    generated_text = tokenizer.decode(outputs[0][inputs.input_ids.shape[1]:], skip_special_tokens=True) 
    # 4. Filter the JSON payload returned to the UI so product cards match Qwen's answer
    matched_products = [
        p for p in PRODUCTS 
        if p["name"].lower() in generated_text.lower() or p["description"].lower() in generated_text.lower()
    ]
    
    return {
        "reply": generated_text,
        "products": matched_products[:2] # Top 2 cards maximum
    }
if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8000)