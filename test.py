import torch
from transformers import AutoModelForCausalLM, AutoTokenizer

# 1. Load tiny model and tokenizer
model_name = "Qwen/Qwen2.5-0.5B-Instruct"

tokenizer = AutoTokenizer.from_pretrained(model_name)
model = AutoModelForCausalLM.from_pretrained(
    model_name,
    torch_dtype=torch.float16 if torch.cuda.is_available() else torch.float32,
    device_map="auto"
)

PRODUCTS_CONTEXT = """
Store Catalog:
1. Electric Kettle - Electric Glass and Steel Hot Tea Water Kettle - 1.7-Liter ($29.99)
2. Coffee maker - Coffeemaker with Glass Carafe and Reusable Filter - 25 Oz ($35.50)
3. Blender - Countertop Blender - 64oz, 1400 Watts ($49.99)
4. Cotton Socks - Black and Gray Athletic Cotton Socks - 6 Pairs ($12.00)
5. Basketball - Intermediate size basketball for sports ($22.00)
6. Cotton t-Shirt - Adults Plain Cotton T-Shirt - 2 Pack ($18.00)
7. Dinner Plates - 6 Piece White Dinner Plate Set ($30.00)
8. Baking set - 6-Piece Nonstick, Carbon Steel Oven Bakeware Baking Set ($27.50)
9. Liquid Detergent - Liquid Laundry Detergent, 110 Loads, 82.5 Fl Oz ($15.00)
10. Sneakers - Waterproof Knit Athletic Sneakers - Gray ($55.00)
11. Sunglasses - Round sun-protection glasses ($14.99)
12. Sandals - Womens Two Strap Buckle Sandals - Tan ($24.99)
13. Tissue - Ultra Soft Tissue 2-Ply - 18 Box ($21.00)
14. Lifeguard Hat - Straw lifeguard sun hat ($16.50)
15. Earrings - Sterling Silver Sky Flower Stud Earrings ($38.00)
16. Womens Hoodie - Womens Stretch Popover Hoodie ($42.00)
17. Bath Rug - Bathroom Bath Rug Mat 20 x 31 Inch - Grey ($19.99)
18. Knit ballet - Womens Knit Ballet Flat ($32.00)
19. Polo Shirt - Mens Regular-Fit Quick-Dry Golf Polo Shirt ($26.00)
20. Trash can - Trash Can with Foot Pedal - Brushed Stainless Steel ($45.00)
"""

# 3. Create a chat function
def ask_assistant(user_query):
    messages = [
        {"role": "system", "content": f"You are a helpful e-commerce shopping assistant for Kiki Store. Use ONLY the following catalog to answer customer questions:\n{PRODUCTS_CONTEXT}"},
        {"role": "user", "content": user_query}
    ]
    
    # Format prompt using the model's chat template
    text_prompt = tokenizer.apply_chat_template(messages, tokenize=False, add_generation_prompt=True)
    
    inputs = tokenizer(text_prompt, return_tensors="pt").to(model.device)
    
    outputs = model.generate(
        **inputs,
        max_new_tokens=150,
        temperature=0.3,
        do_sample=True
    )
    
    response = tokenizer.decode(outputs[0][inputs.input_ids.shape[1]:], skip_special_tokens=True)
    return response

# 4. Test Query
print(ask_assistant("Do you have any shoes or footwear in stock?"),'5')