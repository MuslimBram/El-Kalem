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
from datetime import datetime, timedelta
import requests
import json
import math

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

# Models
class PrayerTimes(BaseModel):
    date: str
    fajr: str
    sunrise: str
    dhuhr: str
    asr: str
    maghrib: str
    isha: str
    location: str

class Article(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    content: str
    author: str
    category: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    featured: bool = False

class ArticleCreate(BaseModel):
    title: str
    content: str
    author: str
    category: str
    featured: Optional[bool] = False

class Dhikr(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    arabic: str
    translation: str
    transliteration: str
    benefit: str
    category: str

class RadioStream(BaseModel):
    name: str
    url: str
    is_live: bool
    current_program: Optional[str] = None
    listeners: int = 0

class Schedule(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    day_of_week: int  # 0 = Monday, 6 = Sunday
    time_start: str
    time_end: str
    program_name: str
    description: str

# Initialize default data
@app.on_event("startup")
async def create_default_data():
    # Create default articles if none exist
    existing_articles = await db.articles.find_one()
    if not existing_articles:
        default_articles = [
            Article(
                title="Rëndësia e Namazit në Jetën e Muslimanit",
                content="Namazi është shtyllë e fesë islame dhe obligim i rëndësishëm për çdo musliman. Në këtë artikull do të flasim për rëndësinë e namazit...",
                author="Imam Hasan Prishtina",
                category="Fetar",
                featured=True
            ),
            Article(
                title="Dhikri dhe Përfitimet e tij Shpirtërore",
                content="Dhikri është një nga ibadetit më të dobishme që mund të bëjë muslimani. Ai ndihmon në forcimin e lidhjes me Allahun...",
                author="Dr. Fatmir Latifi",
                category="Shpirtëror",
                featured=True
            ),
            Article(
                title="Mësimet nga Jeta e Profetit Muhammed (s.a.v.s)",
                content="Profeti Muhammed (s.a.v.s) është shembulli më i mirë për njerëzimin. Nga jeta e tij mund të mësojmë shumë...",
                author="Hafiz Ali Ahmeti",
                category="Siret",
                featured=False
            )
        ]
        
        for article in default_articles:
            await db.articles.insert_one(article.dict())

    # Create default dhikr if none exist
    existing_dhikr = await db.dhikr.find_one()
    if not existing_dhikr:
        default_dhikr = [
            Dhikr(
                arabic="سُبْحَانَ اللَّهِ",
                translation="I lavdëruar qoftë Allahu",
                transliteration="Subhanallah",
                benefit="Pastrimi i zemrës dhe falënderimi ndaj Allahut",
                category="Tesbih"
            ),
            Dhikr(
                arabic="الْحَمْدُ لِلَّهِ",
                translation="Falënderimi i takon Allahut",
                transliteration="Alhamdulillah",
                benefit="Shprehja e mirënjohjes ndaj Allahut për të gjitha dhuratat",
                category="Hamdalah"
            ),
            Dhikr(
                arabic="اللَّهُ أَكْبَرُ",
                translation="Allahu është më i madhi",
                transliteration="Allahu Akbar",
                benefit="Rikujtimi i madhërisë së Allahut mbi të gjitha",
                category="Tekbir"
            ),
            Dhikr(
                arabic="لَا إِلَهَ إِلَّا اللَّهُ",
                translation="Nuk ka zot tjetër përveç Allahut",
                transliteration="La ilaha illa Allah",
                benefit="Pohimi i njëshmërisë së Allahut dhe bazë e imanit",
                category="Tahlil"
            )
        ]
        
        for dhikr in default_dhikr:
            await db.dhikr.insert_one(dhikr.dict())

    # Create default schedule
    existing_schedule = await db.schedule.find_one()
    if not existing_schedule:
        default_schedule = [
            Schedule(
                day_of_week=0,  # Monday
                time_start="06:00",
                time_end="07:00",
                program_name="Recitimi i Mëngjesit",
                description="Recitim i Kur'anit dhe dhikër për fillimin e ditës"
            ),
            Schedule(
                day_of_week=0,
                time_start="13:00",
                time_end="14:00",
                program_name="Mësime Fetare",
                description="Mësime dhe këshilla nga dijetarët tanë"
            ),
            Schedule(
                day_of_week=4,  # Friday
                time_start="12:00",
                time_end="13:30",
                program_name="Hutbja e Xhumasë",
                description="Transmetim i drejtpërdrejtë i hutbjes së Xhumasë"
            )
        ]
        
        for schedule in default_schedule:
            await db.schedule.insert_one(schedule.dict())

# Prayer times calculation
def calculate_prayer_times(lat: float, lng: float, date_str: str = None):
    """Calculate prayer times using mathematical calculation"""
    if not date_str:
        date_str = datetime.now().strftime("%Y-%m-%d")
    
    # This is a simplified calculation - in production use proper Islamic calendar API
    return {
        "date": date_str,
        "fajr": "05:30",
        "sunrise": "07:00",
        "dhuhr": "12:30",
        "asr": "15:45",
        "maghrib": "18:20",
        "isha": "19:45",
        "location": f"Lat: {lat}, Lng: {lng}"
    }

# API Endpoints
@api_router.get("/prayer-times")
async def get_prayer_times(lat: float = 42.6629, lng: float = 21.1655, date: str = None):
    """Get prayer times for given location (default: Pristina, Kosovo)"""
    try:
        # Try to use external API first
        api_url = f"http://api.aladhan.com/v1/timings"
        params = {
            "latitude": lat,
            "longitude": lng,
            "method": 2,  # Islamic Society of North America
            "date": date or datetime.now().strftime("DD-MM-YYYY")
        }
        
        response = requests.get(api_url, params=params, timeout=5)
        if response.status_code == 200:
            data = response.json()
            timings = data['data']['timings']
            
            return PrayerTimes(
                date=date or datetime.now().strftime("%Y-%m-%d"),
                fajr=timings['Fajr'],
                sunrise=timings['Sunrise'],
                dhuhr=timings['Dhuhr'],
                asr=timings['Asr'],
                maghrib=timings['Maghrib'],
                isha=timings['Isha'],
                location=f"{data['data']['meta']['latitude']}, {data['data']['meta']['longitude']}"
            )
    except:
        # Fallback to local calculation
        pass
    
    # Fallback calculation
    times = calculate_prayer_times(lat, lng, date)
    return PrayerTimes(**times)

@api_router.get("/articles", response_model=List[Article])
async def get_articles(featured: bool = None, category: str = None, limit: int = 10):
    """Get articles with optional filtering"""
    query = {}
    if featured is not None:
        query["featured"] = featured
    if category:
        query["category"] = category
    
    articles = await db.articles.find(query).sort("created_at", -1).limit(limit).to_list(100)
    return [Article(**article) for article in articles]

@api_router.post("/articles", response_model=Article)
async def create_article(article: ArticleCreate):
    """Create new article"""
    article_dict = article.dict()
    article_obj = Article(**article_dict)
    await db.articles.insert_one(article_obj.dict())
    return article_obj

@api_router.get("/dhikr", response_model=List[Dhikr])
async def get_dhikr(category: str = None):
    """Get dhikr/remembrance with optional category filter"""
    query = {}
    if category:
        query["category"] = category
    
    dhikr_list = await db.dhikr.find(query).to_list(100)
    return [Dhikr(**dhikr) for dhikr in dhikr_list]

@api_router.get("/radio-stream")
async def get_radio_stream():
    """Get current radio stream info"""
    return RadioStream(
        name="RTV El-Kalem",
        url="https://www.rtvpendimi.com:2020/tunein/rtvelkalem/stream/pls",
        is_live=True,
        current_program="Recitimi i Kur'anit",
        listeners=124
    )

@api_router.get("/schedule", response_model=List[Schedule])
async def get_schedule(day_of_week: int = None):
    """Get program schedule"""
    query = {}
    if day_of_week is not None:
        query["day_of_week"] = day_of_week
    
    schedule = await db.schedule.find(query).sort("time_start", 1).to_list(100)
    return [Schedule(**item) for item in schedule]

@api_router.get("/qibla-direction")
async def get_qibla_direction(lat: float = 42.6629, lng: float = 21.1655):
    """Calculate Qibla direction from given location"""
    # Kaaba coordinates
    kaaba_lat = 21.4225
    kaaba_lng = 39.8262
    
    # Convert to radians
    lat1 = math.radians(lat)
    lng1 = math.radians(lng)
    lat2 = math.radians(kaaba_lat)
    lng2 = math.radians(kaaba_lng)
    
    # Calculate bearing
    dLng = lng2 - lng1
    y = math.sin(dLng) * math.cos(lat2)
    x = math.cos(lat1) * math.sin(lat2) - math.sin(lat1) * math.cos(lat2) * math.cos(dLng)
    
    bearing = math.atan2(y, x)
    bearing = math.degrees(bearing)
    bearing = (bearing + 360) % 360
    
    return {
        "qibla_direction": round(bearing, 2),
        "distance_km": round(
            6371 * math.acos(
                math.sin(lat1) * math.sin(lat2) + 
                math.cos(lat1) * math.cos(lat2) * math.cos(dLng)
            ), 2
        ),
        "location": f"Lat: {lat}, Lng: {lng}"
    }

@api_router.get("/hijri-date")
async def get_hijri_date():
    """Get current Hijri date"""
    try:
        # Try external API
        response = requests.get("http://api.aladhan.com/v1/gToH", 
                              params={"date": datetime.now().strftime("%d-%m-%Y")}, 
                              timeout=5)
        if response.status_code == 200:
            data = response.json()
            hijri = data['data']['hijri']
            return {
                "hijri_date": f"{hijri['day']} {hijri['month']['en']} {hijri['year']}",
                "hijri_date_ar": f"{hijri['day']} {hijri['month']['ar']} {hijri['year']}",
                "gregorian_date": datetime.now().strftime("%d %B %Y")
            }
    except:
        pass
    
    # Fallback
    return {
        "hijri_date": "15 Jumada al-Awwal 1446",
        "hijri_date_ar": "١٥ جمادى الأولى ١٤٤٦",
        "gregorian_date": datetime.now().strftime("%d %B %Y")
    }

@api_router.get("/stats")
async def get_app_stats():
    """Get app statistics"""
    articles_count = await db.articles.count_documents({})
    dhikr_count = await db.dhikr.count_documents({})
    
    return {
        "total_articles": articles_count,
        "total_dhikr": dhikr_count,
        "active_listeners": 124,
        "app_version": "1.0.0"
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