from fastapi import FastAPI, APIRouter, HTTPException, File, UploadFile, Form
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime
import base64
import shutil

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Create uploads directory
uploads_dir = ROOT_DIR / 'uploads'
uploads_dir.mkdir(exist_ok=True)

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Mount static files for serving uploaded 3D models
app.mount("/uploads", StaticFiles(directory=str(uploads_dir)), name="uploads")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Models
class Product(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: str
    price: float
    category: str
    model_3d_url: Optional[str] = None
    model_3d_format: Optional[str] = None
    thumbnail_url: Optional[str] = None
    position: Dict[str, float] = {"x": 0, "y": 0, "z": 0}
    rotation: Dict[str, float] = {"x": 0, "y": 0, "z": 0}
    scale: Dict[str, float] = {"x": 1, "y": 1, "z": 1}
    created_at: datetime = Field(default_factory=datetime.utcnow)

class ProductCreate(BaseModel):
    name: str
    description: str
    price: float
    category: str
    position: Optional[Dict[str, float]] = {"x": 0, "y": 0, "z": 0}
    rotation: Optional[Dict[str, float]] = {"x": 0, "y": 0, "z": 0}
    scale: Optional[Dict[str, float]] = {"x": 1, "y": 1, "z": 1}

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    category: Optional[str] = None
    position: Optional[Dict[str, float]] = None
    rotation: Optional[Dict[str, float]] = None
    scale: Optional[Dict[str, float]] = None

class ShopSettings(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    shop_name: str
    environment_image: Optional[str] = None
    background_color: str = "#87CEEB"
    lighting_intensity: float = 1.0
    created_at: datetime = Field(default_factory=datetime.utcnow)

class ShopSettingsCreate(BaseModel):
    shop_name: str
    background_color: Optional[str] = "#87CEEB"
    lighting_intensity: Optional[float] = 1.0

# Initialize default shop settings
@app.on_event("startup")
async def create_default_shop():
    existing_shop = await db.shop_settings.find_one()
    if not existing_shop:
        default_shop = ShopSettings(
            shop_name="Dyqani VR Modern",
            background_color="#87CEEB",
            lighting_intensity=1.0
        )
        await db.shop_settings.insert_one(default_shop.dict())
    
    # Create some example products if none exist
    existing_products = await db.products.find_one()
    if not existing_products:
        example_products = [
            Product(
                name="iPhone 15 Pro",
                description="Telefon inteligjent i fundit me teknologji të avancuar",
                price=1299.99,
                category="Elektronikë",
                position={"x": -3, "y": 1, "z": -2},
                rotation={"x": 0, "y": 0, "z": 0},
                scale={"x": 1, "y": 1, "z": 1}
            ),
            Product(
                name="MacBook Pro",
                description="Laptop i fuqishëm për profesionistë",
                price=2499.99,
                category="Elektronikë",
                position={"x": 0, "y": 1, "z": -2},
                rotation={"x": 0, "y": 0, "z": 0},
                scale={"x": 1, "y": 1, "z": 1}
            ),
            Product(
                name="AirPods Pro",
                description="Kufje wireless me noise cancellation",
                price=299.99,
                category="Aksesorë",
                position={"x": 3, "y": 1, "z": -2},
                rotation={"x": 0, "y": 0, "z": 0},
                scale={"x": 1, "y": 1, "z": 1}
            )
        ]
        
        for product in example_products:
            await db.products.insert_one(product.dict())

# Product endpoints
@api_router.post("/products", response_model=Product)
async def create_product(product: ProductCreate):
    product_dict = product.dict()
    product_obj = Product(**product_dict)
    await db.products.insert_one(product_obj.dict())
    return product_obj

@api_router.get("/products", response_model=List[Product])
async def get_products(category: Optional[str] = None):
    query = {}
    if category:
        query["category"] = category
    
    products = await db.products.find(query).to_list(1000)
    return [Product(**product) for product in products]

@api_router.get("/products/{product_id}", response_model=Product)
async def get_product(product_id: str):
    product = await db.products.find_one({"id": product_id})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return Product(**product)

@api_router.put("/products/{product_id}", response_model=Product)
async def update_product(product_id: str, product_update: ProductUpdate):
    update_data = {k: v for k, v in product_update.dict().items() if v is not None}
    
    result = await db.products.update_one(
        {"id": product_id},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    
    updated_product = await db.products.find_one({"id": product_id})
    return Product(**updated_product)

@api_router.delete("/products/{product_id}")
async def delete_product(product_id: str):
    result = await db.products.delete_one({"id": product_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    return {"message": "Product deleted successfully"}

# File upload endpoints
@api_router.post("/products/{product_id}/upload-3d-model")
async def upload_3d_model(
    product_id: str,
    file: UploadFile = File(...),
    format: str = Form(...)
):
    # Verify product exists
    product = await db.products.find_one({"id": product_id})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Validate file format
    allowed_formats = ['gltf', 'glb', 'obj', 'fbx', 'dae', 'stl']
    if format.lower() not in allowed_formats:
        raise HTTPException(status_code=400, detail=f"Unsupported format. Allowed: {allowed_formats}")
    
    # Save file
    file_extension = format.lower()
    filename = f"{product_id}_model.{file_extension}"
    file_path = uploads_dir / filename
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # Update product with model URL
    model_url = f"/uploads/{filename}"
    await db.products.update_one(
        {"id": product_id},
        {"$set": {
            "model_3d_url": model_url,
            "model_3d_format": format.lower()
        }}
    )
    
    return {
        "message": "3D model uploaded successfully",
        "model_url": model_url,
        "format": format.lower()
    }

@api_router.post("/products/{product_id}/upload-thumbnail")
async def upload_thumbnail(
    product_id: str,
    file: UploadFile = File(...)
):
    # Verify product exists
    product = await db.products.find_one({"id": product_id})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Validate image format
    allowed_formats = ['jpg', 'jpeg', 'png', 'webp']
    file_extension = file.filename.split('.')[-1].lower()
    if file_extension not in allowed_formats:
        raise HTTPException(status_code=400, detail=f"Unsupported image format. Allowed: {allowed_formats}")
    
    # Save file
    filename = f"{product_id}_thumbnail.{file_extension}"
    file_path = uploads_dir / filename
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # Update product with thumbnail URL
    thumbnail_url = f"/uploads/{filename}"
    await db.products.update_one(
        {"id": product_id},
        {"$set": {"thumbnail_url": thumbnail_url}}
    )
    
    return {
        "message": "Thumbnail uploaded successfully",
        "thumbnail_url": thumbnail_url
    }

# Shop settings endpoints
@api_router.get("/shop-settings", response_model=ShopSettings)
async def get_shop_settings():
    settings = await db.shop_settings.find_one()
    if not settings:
        # Create default if not exists
        default_settings = ShopSettings(shop_name="Dyqani VR Modern")
        await db.shop_settings.insert_one(default_settings.dict())
        return default_settings
    return ShopSettings(**settings)

@api_router.put("/shop-settings", response_model=ShopSettings)
async def update_shop_settings(settings_update: ShopSettingsCreate):
    update_data = settings_update.dict()
    
    # Try to update existing settings
    result = await db.shop_settings.update_one(
        {},  # Match any document (should be only one)
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        # Create new if none exists
        settings_obj = ShopSettings(**update_data)
        await db.shop_settings.insert_one(settings_obj.dict())
        return settings_obj
    
    # Return updated settings
    updated_settings = await db.shop_settings.find_one()
    return ShopSettings(**updated_settings)

@api_router.post("/shop-settings/upload-environment")
async def upload_environment_image(file: UploadFile = File(...)):
    # Validate image format
    allowed_formats = ['jpg', 'jpeg', 'png', 'webp', 'hdr', 'exr']
    file_extension = file.filename.split('.')[-1].lower()
    if file_extension not in allowed_formats:
        raise HTTPException(status_code=400, detail=f"Unsupported image format. Allowed: {allowed_formats}")
    
    # Save file
    filename = f"environment.{file_extension}"
    file_path = uploads_dir / filename
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # Update shop settings with environment image URL
    environment_url = f"/uploads/{filename}"
    await db.shop_settings.update_one(
        {},
        {"$set": {"environment_image": environment_url}}
    )
    
    return {
        "message": "Environment image uploaded successfully",
        "environment_url": environment_url
    }

# Categories endpoint
@api_router.get("/categories")
async def get_categories():
    # Get unique categories from products
    pipeline = [
        {"$group": {"_id": "$category", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}}
    ]
    
    categories = await db.products.aggregate(pipeline).to_list(100)
    return [{"name": cat["_id"], "count": cat["count"]} for cat in categories]

# Analytics endpoint
@api_router.get("/analytics")
async def get_analytics():
    total_products = await db.products.count_documents({})
    categories_count = len(await db.products.distinct("category"))
    products_with_3d = await db.products.count_documents({"model_3d_url": {"$ne": None}})
    
    return {
        "total_products": total_products,
        "total_categories": categories_count,
        "products_with_3d_models": products_with_3d,
        "completion_rate": (products_with_3d / total_products * 100) if total_products > 0 else 0
    }

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()