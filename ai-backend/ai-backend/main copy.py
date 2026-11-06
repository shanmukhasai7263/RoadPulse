from fastapi import (
    FastAPI,
    UploadFile,
    File,
    Query,
    HTTPException
)
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from ultralytics import YOLO

import math
from typing import Optional
import shutil
import time
import urllib.parse
import urllib.request
import json

import os
import math
from collections import defaultdict
from typing import Optional

app = FastAPI()


# ==========================================
# AUTHORITY ALERT MODEL
# ==========================================

class AuthorityAlert(BaseModel):
    locality: str
    latitude: float
    longitude: float
    pothole_count: int
    risk_level: str
    radius: int


   # ==========================================
# COMPLAINT LOCATION MODEL
# ==========================================

class ComplaintLocation(BaseModel):
    latitude: float
    longitude: float
    locality: Optional[str] = "Unknown locality"


class HotspotRequest(BaseModel):
    complaints: list[ComplaintLocation]


HOTSPOT_RADIUS_METRES = 1000
MIN_COMPLAINTS = 3

sent_hotspot_alerts = set()

    # ==========================================
# HOTSPOT CONFIGURATION
# ==========================================

HOTSPOT_RADIUS_METRES = 1000
MIN_COMPLAINTS = 3

sent_hotspot_alerts = set()


# ==========================================
# COMPLAINT LOCATION MODEL
# ==========================================

class ComplaintLocation(BaseModel):
    latitude: float
    longitude: float
    locality: Optional[str] = "Unknown locality"


class HotspotRequest(BaseModel):
    complaints: list[ComplaintLocation]


# ==========================================
# DISTANCE CALCULATION
# ==========================================

def distance_metres(lat1, lon1, lat2, lon2):

    earth_radius = 6_371_000

    lat1, lon1, lat2, lon2 = map(
        math.radians,
        [lat1, lon1, lat2, lon2]
    )

    dlat = lat2 - lat1
    dlon = lon2 - lon1

    a = (
        math.sin(dlat / 2) ** 2
        + math.cos(lat1)
        * math.cos(lat2)
        * math.sin(dlon / 2) ** 2
    )

    return 2 * earth_radius * math.asin(
        math.sqrt(min(1, a))
    )


# ==========================================
# CORS
# ==========================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ==========================================
# UPLOAD AND RESULTS FOLDERS
# ==========================================

os.makedirs("uploads", exist_ok=True)
os.makedirs("results", exist_ok=True)

app.mount(
    "/results",
    StaticFiles(directory="results"),
    name="results"
)

# ==========================================
# AI MODEL
# ==========================================

model = YOLO("models/best.pt")


# ==========================================
# HOME
# ==========================================

@app.get("/")
def home():

    return {
        "message": "RoadPulse AI Backend is running!"
    }


# ==========================================
# AUTHORITY NOTIFICATION
# ==========================================

@app.post("/notify-authority")
def notify_authority(
    alert: AuthorityAlert
):

    message = f"""
ROADPULSE AUTHORITY ALERT

Multiple potholes have been detected in the same area.

Locality: {alert.locality}
Potholes Reported: {alert.pothole_count}
Risk Level: {alert.risk_level}
Affected Radius: {alert.radius} metres

Location:
Latitude: {alert.latitude}
Longitude: {alert.longitude}

Please inspect this location and take necessary road maintenance action.

RoadPulse
Intelligent Road Condition Monitoring System
"""

    print(
        "==================================="
    )

    print(
        "AUTHORITY ALERT"
    )

    print(
        message
    )

    print(
        "==================================="
    )

    return {
        "success": True,

        "message":
            "Authority alert generated successfully.",

        "authority_message":
            message,

        "locality":
            alert.locality,

        "pothole_count":
            alert.pothole_count,

        "risk_level":
            alert.risk_level
    }

    # ==========================================
# AUTOMATIC HOTSPOT ANALYSIS
# ==========================================

def distance_metres(lat1, lon1, lat2, lon2):
    earth_radius = 6_371_000

    lat1, lon1, lat2, lon2 = map(
        math.radians,
        [lat1, lon1, lat2, lon2]
    )

    dlat = lat2 - lat1
    dlon = lon2 - lon1

    a = (
        math.sin(dlat / 2) ** 2
        + math.cos(lat1) * math.cos(lat2)
        * math.sin(dlon / 2) ** 2
    )

    return 2 * earth_radius * math.asin(
        math.sqrt(min(1, a))
    )


@app.post("/analyze-hotspots")
def analyze_hotspots(request: HotspotRequest):

    complaints = request.complaints

    # Validate coordinates.
    for item in complaints:
        if not (
            -90 <= item.latitude <= 90
            and -180 <= item.longitude <= 180
        ):
            raise HTTPException(
                status_code=422,
                detail="Invalid GPS coordinates"
            )

    hotspots = []

    # Each complaint is considered as a possible hotspot centre.
    for centre in complaints:

        nearby = [
            item for item in complaints
            if distance_metres(
                centre.latitude,
                centre.longitude,
                item.latitude,
                item.longitude
            ) <= HOTSPOT_RADIUS_METRES
        ]

        if len(nearby) < MIN_COMPLAINTS:
            continue

        # Calculate the centre of the nearby reports.
        latitude = sum(
            item.latitude for item in nearby
        ) / len(nearby)

        longitude = sum(
            item.longitude for item in nearby
        ) / len(nearby)

        # Keep only reports within 1 km of the final centre.
        nearby = [
            item for item in nearby
            if distance_metres(
                latitude,
                longitude,
                item.latitude,
                item.longitude
            ) <= HOTSPOT_RADIUS_METRES
        ]

        if len(nearby) < MIN_COMPLAINTS:
            continue

        locality_counts = {}

        for item in nearby:
            name = (item.locality or "").strip()
            if name:
                locality_counts[name] = (
                    locality_counts.get(name, 0) + 1
                )

        locality = (
            max(locality_counts, key=locality_counts.get)
            if locality_counts
            else "Unknown locality"
        )

        hotspot = {
            "locality": locality,
            "latitude": latitude,
            "longitude": longitude,
            "pothole_count": len(nearby),
            "risk_level": (
                "High" if len(nearby) >= 5 else "Medium"
            ),
            "radius": HOTSPOT_RADIUS_METRES
        }

        # Suppress duplicate circles representing the same area.
        duplicate = any(
            distance_metres(
                hotspot["latitude"],
                hotspot["longitude"],
                existing["latitude"],
                existing["longitude"]
            ) < HOTSPOT_RADIUS_METRES
            for existing in hotspots
        )

        if not duplicate:
            hotspots.append(hotspot)

    # Generate authority alerts for new hotspot/count combinations.
    new_alerts = []

    for hotspot in hotspots:

        alert_key = (
            round(hotspot["latitude"], 4),
            round(hotspot["longitude"], 4),
            hotspot["pothole_count"]
        )

        if alert_key in sent_hotspot_alerts:
            continue

        alert_result = notify_authority(
            AuthorityAlert(**hotspot)
        )

        sent_hotspot_alerts.add(alert_key)

        new_alerts.append({
            "locality": hotspot["locality"],
            "pothole_count": hotspot["pothole_count"],
            "message": alert_result["message"]
        })

    return {
        "success": True,
        "minimum_complaints": MIN_COMPLAINTS,
        "radius_metres": HOTSPOT_RADIUS_METRES,
        "hotspot_count": len(hotspots),
        "hotspots": hotspots,
        "new_authority_alerts": new_alerts
    }


# ==========================================
# DESTINATION SEARCH
# ==========================================

@app.get("/search-destination")
def search_destination(
    q: str = Query(...)
):

    if not q.strip():
        return []

    params = urllib.parse.urlencode({
        "format": "jsonv2",
        "addressdetails": "1",
        "namedetails": "1",
        "limit": "15",
        "countrycodes": "in",
        "layer": "address,poi",
        "accept-language": "en",
        "q": q.strip(),
    })

    url = (
        "https://nominatim.openstreetmap.org/search?"
        + params
    )

    request = urllib.request.Request(
        url,
        headers={
            "User-Agent": "RoadPulse/1.0"
        }
    )

    try:

        with urllib.request.urlopen(
            request,
            timeout=10
        ) as response:

            data = json.loads(
                response.read().decode(
                    "utf-8"
                )
            )

        print(
            "DESTINATION SEARCH:",
            q
        )

        print(
            "RESULTS FOUND:",
            len(data)
        )

        return data

    except Exception as error:

        print(
            "Destination search error:",
            error
        )

        return []


# ==========================================
# AI POTHOLE DETECTION
# ==========================================

@app.post("/detect")
async def detect(
    file: UploadFile = File(...)
):

    file_path = (
        "uploads/"
        + file.filename
    )

    with open(
        file_path,
        "wb"
    ) as buffer:

        shutil.copyfileobj(
            file.file,
            buffer
        )


    # ======================================
    # RUN YOLO
    # ======================================

    results = model(
        file_path,
        conf=0.50
    )


    # ======================================
    # SAVE ANNOTATED IMAGE
    # ======================================

    annotated_filename = (
        f"annotated_"
        f"{int(time.time() * 1000)}"
        f".jpg"
    )

    annotated_path = (
        "results/"
        + annotated_filename
    )

    for result in results:

        result.save(
            filename=annotated_path
        )


    # ======================================
    # GET DETECTIONS
    # ======================================

    detections = []

    for result in results:

        for box in result.boxes:

            confidence = float(
                box.conf[0]
            )

            x1, y1, x2, y2 = (
                box.xyxy[0].tolist()
            )

            detections.append({

                "hazard_type":
                    "Pothole",

                "confidence":
                    round(
                        confidence,
                        2
                    ),

                "bbox": [
                    round(x1),
                    round(y1),
                    round(x2),
                    round(y2)
                ]

            })


    # ======================================
    # HIGHEST CONFIDENCE
    # ======================================

    highest_confidence = 0

    if detections:

        highest_confidence = max(
            detection["confidence"]
            for detection in detections
        )


    # ======================================
    # RESPONSE
    # ======================================

    return {

        "is_pothole":
            len(detections) > 0,

        "confidence_score":
            highest_confidence,

        "hazard_type":
            "Pothole"
            if detections
            else
            "No pothole",

        "detected_objects":
            len(detections),

        "detections":
            detections,

        "annotated_image":
            (
                "http://127.0.0.1:8000"
                "/results/"
                + annotated_filename
            )
    }