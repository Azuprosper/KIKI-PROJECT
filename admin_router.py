from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from pydantic import BaseModel
from typing import Optional
import json
import os
import os
from dotenv import load_dotenv
import random
from datetime import datetime
from groq import Groq

load_dotenv()
# Single APIRouter definition
router = APIRouter(prefix="/organization", tags=["Organization & Seller Admin"])

# Initialize Groq Client securely from environment variables
groq_client = Groq(api_key=os.environ.get("GROQ_API_KEY"))

# Preset seller profiles for demo scenarios
MOCK_SELLER_METRICS = {
    "seller_123": {
        "seller_id": "seller_123",
        "period": "Last 7 Days",
        "total_revenue_usd": 4820.50,
        "total_units_sold": 134,
        "total_orders": 98,
        "top_selling_product": "Wireless Ergonomic Mouse",
        "top_product_units": 42,
        "low_stock_alerts": ["Mechanical Keyboard (2 left)", "USB-C Dock (5 left)"],
        "customer_return_rate": "1.2%"
    },
    "seller_456": {
        "seller_id": "seller_456",
        "period": "Last 7 Days",
        "total_revenue_usd": 12450.00,
        "total_units_sold": 310,
        "total_orders": 280,
        "top_selling_product": "4K USB-C Monitor",
        "top_product_units": 85,
        "low_stock_alerts": ["4K USB-C Monitor (0 left - OUT OF STOCK)", "Ergonomic Chair (1 left)"],
        "customer_return_rate": "0.8%"
    },
    "seller_789": {
        "seller_id": "seller_789",
        "period": "Last 7 Days",
        "total_revenue_usd": 850.00,
        "total_units_sold": 18,
        "total_orders": 15,
        "top_selling_product": "Noise-Canceling Earbuds",
        "top_product_units": 8,
        "low_stock_alerts": [],
        "customer_return_rate": "4.5%"
    }
}

# Pydantic Schemas
class ProductCreate(BaseModel):
    name: str
    description: str
    price: float
    category: str
    stock_quantity: int

class ProductResponse(ProductCreate):
    id: str
    created_at: str

# ----------------------------------------------------
# 1. Product Upload Route
# ----------------------------------------------------
@router.post("/products", response_model=ProductResponse)
async def upload_product(
    name: str = Form(...),
    description: str = Form(...),
    price: float = Form(...),
    category: str = Form(...),
    stock_quantity: int = Form(...),
    image: Optional[UploadFile] = File(None)
):
    try:
        product_id = f"prod_{datetime.now().strftime('%Y%m%d%H%M%S')}"
        
        product_data = {
            "id": product_id,
            "name": name,
            "description": description,
            "price": price,
            "category": category,
            "stock_quantity": stock_quantity,
            "created_at": datetime.now().isoformat()
        }
        
        return product_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create product: {str(e)}")

# ----------------------------------------------------
# 2. Weekly Sales Summary & AI Report Generation Route
# ----------------------------------------------------
@router.get("/reports/weekly/{seller_id}")
async def get_weekly_summary_report(seller_id: str):
    # Check if requested seller_id exists, otherwise pick a random profile from the 3
    if seller_id in MOCK_SELLER_METRICS:
        mock_metrics = MOCK_SELLER_METRICS[seller_id]
    else:
        selected_key = random.choice(list(MOCK_SELLER_METRICS.keys()))
        mock_metrics = MOCK_SELLER_METRICS[selected_key].copy()
        mock_metrics["seller_id"] = seller_id  # Preserve requested seller_id for frontend consistency
    
    prompt = f"""
    You are an expert e-commerce business analyst. Write a concise, professional weekly performance report for a seller based on these 7-day metrics:
    
    {json.dumps(mock_metrics, indent=2)}
    
    Format the response in clean Markdown with these sections:
    - 📊 **Executive Overview**
    - 🚀 **Top Performers & Wins**
    - ⚠️ **Actionable Inventory Alerts**
    - 💡 **Strategic Recommendations for Next Week**
    """
    
    try:
        completion = groq_client.chat.completions.create(
            model="openai/gpt-oss-120b",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.3,
            max_tokens=600
        )
        ai_narrative = completion.choices[0].message.content
        
        return {
            "metrics": mock_metrics,
            "ai_report": ai_narrative
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"LLM Generation failed: {str(e)}")