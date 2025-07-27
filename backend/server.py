from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, date
from enum import Enum

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Enums and Models
class PlatformType(str, Enum):
    FACEBOOK = "facebook"
    INSTAGRAM = "instagram"
    TWITTER = "twitter"
    LINKEDIN = "linkedin"
    TIKTOK = "tiktok"
    YOUTUBE = "youtube"
    PINTEREST = "pinterest"
    SNAPCHAT = "snapchat"
    TELEGRAM = "telegram"
    WHATSAPP = "whatsapp"

class PostStatus(str, Enum):
    DRAFT = "draft"
    SCHEDULED = "scheduled"
    POSTED = "posted"
    FAILED = "failed"

class Website(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    url: str
    description: Optional[str] = None
    connected_platforms: List[PlatformType] = []
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class WebsiteCreate(BaseModel):
    name: str
    url: str
    description: Optional[str] = None
    connected_platforms: List[PlatformType] = []

class WebsiteUpdate(BaseModel):
    name: Optional[str] = None
    url: Optional[str] = None
    description: Optional[str] = None
    connected_platforms: Optional[List[PlatformType]] = None

class SocialPost(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    website_id: str
    platform: PlatformType
    content: str
    media_urls: List[str] = []
    scheduled_time: datetime
    status: PostStatus = PostStatus.DRAFT
    ai_generated: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class SocialPostCreate(BaseModel):
    website_id: str
    platform: PlatformType
    content: str
    media_urls: List[str] = []
    scheduled_time: datetime
    ai_generated: bool = False

class SocialPostUpdate(BaseModel):
    content: Optional[str] = None
    media_urls: Optional[List[str]] = None
    scheduled_time: Optional[datetime] = None
    status: Optional[PostStatus] = None

class ContentGenerationRequest(BaseModel):
    website_id: str
    platform: PlatformType
    prompt: str
    tone: Optional[str] = "professional"
    length: Optional[str] = "medium"

class CalendarEvent(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    website_id: str
    title: str
    description: Optional[str] = None
    date: date
    time: str
    type: str  # 'generation', 'posting', 'monitoring'
    platform: Optional[PlatformType] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class CalendarEventCreate(BaseModel):
    website_id: str
    title: str
    description: Optional[str] = None
    date: date
    time: str
    type: str
    platform: Optional[PlatformType] = None

# Website endpoints
@api_router.post("/websites", response_model=Website)
async def create_website(website: WebsiteCreate):
    website_dict = website.dict()
    website_obj = Website(**website_dict)
    await db.websites.insert_one(website_obj.dict())
    return website_obj

@api_router.get("/websites", response_model=List[Website])
async def get_websites():
    websites = await db.websites.find().to_list(1000)
    return [Website(**website) for website in websites]

@api_router.get("/websites/{website_id}", response_model=Website)
async def get_website(website_id: str):
    website = await db.websites.find_one({"id": website_id})
    if not website:
        raise HTTPException(status_code=404, detail="Website not found")
    return Website(**website)

@api_router.put("/websites/{website_id}", response_model=Website)
async def update_website(website_id: str, website_update: WebsiteUpdate):
    update_data = {k: v for k, v in website_update.dict().items() if v is not None}
    update_data["updated_at"] = datetime.utcnow()
    
    result = await db.websites.update_one(
        {"id": website_id},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Website not found")
    
    updated_website = await db.websites.find_one({"id": website_id})
    return Website(**updated_website)

@api_router.delete("/websites/{website_id}")
async def delete_website(website_id: str):
    result = await db.websites.delete_one({"id": website_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Website not found")
    return {"message": "Website deleted successfully"}

# Social Posts endpoints
@api_router.post("/posts", response_model=SocialPost)
async def create_post(post: SocialPostCreate):
    # Verify website exists
    website = await db.websites.find_one({"id": post.website_id})
    if not website:
        raise HTTPException(status_code=404, detail="Website not found")
    
    post_dict = post.dict()
    post_obj = SocialPost(**post_dict)
    await db.social_posts.insert_one(post_obj.dict())
    return post_obj

@api_router.get("/posts", response_model=List[SocialPost])
async def get_posts(website_id: Optional[str] = None, platform: Optional[PlatformType] = None):
    query = {}
    if website_id:
        query["website_id"] = website_id
    if platform:
        query["platform"] = platform
    
    posts = await db.social_posts.find(query).to_list(1000)
    return [SocialPost(**post) for post in posts]

@api_router.get("/posts/{post_id}", response_model=SocialPost)
async def get_post(post_id: str):
    post = await db.social_posts.find_one({"id": post_id})
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    return SocialPost(**post)

@api_router.put("/posts/{post_id}", response_model=SocialPost)
async def update_post(post_id: str, post_update: SocialPostUpdate):
    update_data = {k: v for k, v in post_update.dict().items() if v is not None}
    update_data["updated_at"] = datetime.utcnow()
    
    result = await db.social_posts.update_one(
        {"id": post_id},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Post not found")
    
    updated_post = await db.social_posts.find_one({"id": post_id})
    return SocialPost(**updated_post)

@api_router.delete("/posts/{post_id}")
async def delete_post(post_id: str):
    result = await db.social_posts.delete_one({"id": post_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Post not found")
    return {"message": "Post deleted successfully"}

# Calendar endpoints
@api_router.post("/calendar", response_model=CalendarEvent)
async def create_calendar_event(event: CalendarEventCreate):
    # Verify website exists
    website = await db.websites.find_one({"id": event.website_id})
    if not website:
        raise HTTPException(status_code=404, detail="Website not found")
    
    event_dict = event.dict()
    event_obj = CalendarEvent(**event_dict)
    await db.calendar_events.insert_one(event_obj.dict())
    return event_obj

@api_router.get("/calendar", response_model=List[CalendarEvent])
async def get_calendar_events(website_id: Optional[str] = None, date_from: Optional[date] = None, date_to: Optional[date] = None):
    query = {}
    if website_id:
        query["website_id"] = website_id
    if date_from and date_to:
        query["date"] = {"$gte": date_from.isoformat(), "$lte": date_to.isoformat()}
    elif date_from:
        query["date"] = {"$gte": date_from.isoformat()}
    elif date_to:
        query["date"] = {"$lte": date_to.isoformat()}
    
    events = await db.calendar_events.find(query).to_list(1000)
    return [CalendarEvent(**event) for event in events]

# Content Generation endpoint (placeholder for OpenAI integration)
@api_router.post("/generate-content")
async def generate_content(request: ContentGenerationRequest):
    # For now, return a placeholder response
    # Will integrate OpenAI when API key is provided
    return {
        "generated_content": f"[AI-Generated content for {request.platform} will appear here once OpenAI API is configured. Prompt: {request.prompt}]",
        "platform": request.platform,
        "tone": request.tone,
        "length": request.length,
        "ai_ready": False,
        "message": "OpenAI API key required for content generation"
    }

# Dashboard stats
@api_router.get("/stats")
async def get_dashboard_stats():
    websites_count = await db.websites.count_documents({})
    posts_count = await db.social_posts.count_documents({})
    scheduled_count = await db.social_posts.count_documents({"status": "scheduled"})
    today_events = await db.calendar_events.count_documents({"date": date.today().isoformat()})
    
    return {
        "total_websites": websites_count,
        "total_posts": posts_count,
        "scheduled_posts": scheduled_count,
        "today_events": today_events
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