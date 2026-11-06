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
from inference_sdk import InferenceHTTPClient, InferenceConfiguration
from dotenv import load_dotenv

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

from io import BytesIO
from PIL import Image, UnidentifiedImageError

import base64
from PIL import Image, ImageDraw

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

# AI MODELS
# ==========================================

load_dotenv()

ROBOFLOW_API_KEY = os.getenv("ROBOFLOW_API_KEY")

if not ROBOFLOW_API_KEY:
    raise RuntimeError(
        "ROBOFLOW_API_KEY is missing. Check ai-backend/.env"
    )

roboflow_client = InferenceHTTPClient(
    api_url="https://serverless.roboflow.com",
    api_key=ROBOFLOW_API_KEY
).configure(
    InferenceConfiguration(
        api_key_transport="header"
    )
)

WORKSPACE_NAME = "shanmukhas-workspace-52pcp"
WORKFLOW_ID = "roadpulse-road-hazards-vroadpulse-road-hazards-6-yolo26s-t1-logic"


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
# AI ROAD HAZARD DETECTION - ROBOFLOW
# ==========================================

@app.post("/detect")
async def detect(file: UploadFile = File(...)):
    file_path = None

    try:
        if roboflow_client is None:
            raise HTTPException(
                status_code=500,
                detail="Roboflow API key is missing. Check your .env file."
            )

        # ==========================================
# VALIDATE AND SAVE UPLOADED IMAGE
# ==========================================

allowed_formats = {
    "JPEG": ".jpg",
    "PNG": ".png",
    "WEBP": ".webp",
}

# Read uploaded file
image_bytes = await file.read()

# Check empty file
if not image_bytes:
    raise HTTPException(
        status_code=400,
        detail="Uploaded image is empty."
    )

# Limit upload size to 10 MB
if len(image_bytes) > 10 * 1024 * 1024:
    raise HTTPException(
        status_code=413,
        detail="Image size must be less than 10 MB."
    )

# Verify actual image content
try:
    with Image.open(BytesIO(image_bytes)) as img:
        image_format = img.format

        if image_format not in allowed_formats:
            raise HTTPException(
                status_code=400,
                detail="Only JPG, PNG and WEBP images are supported."
            )

        img.verify()

except (UnidentifiedImageError, OSError, SyntaxError):
    raise HTTPException(
        status_code=400,
        detail="Invalid image file. Please upload a valid image."
    )

# Save using the verified image format
extension = allowed_formats[image_format]

os.makedirs("uploads", exist_ok=True)

file_path = os.path.join(
    "uploads",
    f"upload_{int(time.time() * 1000)}{extension}"
)

with open(file_path, "wb") as buffer:
    buffer.write(image_bytes)

        # Run the trained Roboflow workflow
        workflow_result = roboflow_client.run_workflow(
            workspace_name=WORKSPACE_NAME,
            workflow_id=WORKFLOW_ID,
            images={"image": file_path},
            use_cache=False
        )

        # Extract predictions from nested workflow output
        predictions = []

        def collect_predictions(data):
            if isinstance(data, dict):
                # A prediction object normally contains a class and confidence
                class_value = (
                    data.get("class")
                    or data.get("class_name")
                    or data.get("label")
                )

                if class_value is not None and "confidence" in data:
                    predictions.append(data)
                    return

                for key, value in data.items():
                    collect_predictions(value)

            elif isinstance(data, list):
                for item in data:
                    collect_predictions(item)

        collect_predictions(workflow_result)

        # Convert predictions to RoadPulse format
        detections = []
        seen = set()

        for item in predictions:
            try:
                confidence = float(item.get("confidence", 0))
            except (TypeError, ValueError):
                continue

            # Support confidence values expressed as either 0-1 or 0-100
            if confidence > 1:
                confidence /= 100

            # Filter weak predictions
            if confidence < 0.25:
                continue

            hazard = str(
                item.get("class")
                or item.get("class_name")
                or item.get("label")
                or "Unknown hazard"
            ).strip()

            # Roboflow commonly returns center x/y and width/height
            try:
                if all(
                    key in item
                    for key in ("x", "y", "width", "height")
                ):
                    x = float(item["x"])
                    y = float(item["y"])
                    width = float(item["width"])
                    height = float(item["height"])

                    bbox = [
                        round(x - width / 2),
                        round(y - height / 2),
                        round(x + width / 2),
                        round(y + height / 2)
                    ]
                else:
                    bbox = item.get("bbox", [])
            except (TypeError, ValueError):
                bbox = []

            # Avoid duplicate predictions from repeated workflow outputs
            key = (
                hazard.lower(),
                tuple(bbox) if isinstance(bbox, list) else (),
                round(confidence, 3)
            )

            if key in seen:
                continue

            seen.add(key)

            detections.append({
                "hazard_type": hazard,
                "confidence": round(confidence, 3),
                "bbox": bbox
            })

        # Show highest-confidence detection first
        detections.sort(
            key=lambda detection: detection["confidence"],
            reverse=True
        )

        highest_confidence = (
            detections[0]["confidence"] if detections else 0
        )

        # Keep pothole status separate from other hazards
        has_pothole = any(
            "pothole" in detection["hazard_type"].lower()
            for detection in detections
        )

        hazard_types = list(dict.fromkeys(
            detection["hazard_type"]
            for detection in detections
        ))

        # ==========================================
# GENERATE ANNOTATED IMAGE
# ==========================================

annotated_image = None

if detections:
    with Image.open(file_path) as original:
        annotated = original.convert("RGB")

    draw = ImageDraw.Draw(annotated)

    image_width, image_height = annotated.size

    for detection in detections:
        bbox = detection.get("bbox", [])

        if not isinstance(bbox, list) or len(bbox) != 4:
            continue

        try:
            x1, y1, x2, y2 = map(float, bbox)

            # Keep bounding box inside the image
            x1 = max(0, min(x1, image_width))
            y1 = max(0, min(y1, image_height))
            x2 = max(0, min(x2, image_width))
            y2 = max(0, min(y2, image_height))

            if x2 <= x1 or y2 <= y1:
                continue

            draw.rectangle(
                (x1, y1, x2, y2),
                outline="red",
                width=4
            )

            label = (
                f"{detection['hazard_type']} "
                f"{detection['confidence'] * 100:.0f}%"
            )

            draw.text(
                (x1, max(0, y1 - 20)),
                label,
                fill="red",
                stroke_width=1,
                stroke_fill="white"
            )

        except (TypeError, ValueError):
            continue

    # Convert annotated image to Base64
    output = BytesIO()

    annotated.save(
        output,
        format="JPEG",
        quality=85
    )

    encoded_image = base64.b64encode(
        output.getvalue()
    ).decode("utf-8")

    annotated_image = (
        f"data:image/jpeg;base64,{encoded_image}"
    )

        # Preserve existing fields and add all detected hazard types
        return {
            "is_pothole": has_pothole,
            "confidence_score": highest_confidence,
            "hazard_type": (
                detections[0]["hazard_type"]
                if detections else "No hazard detected"
            ),
            "hazard_types": hazard_types,
            "detected_objects": len(detections),
            "detections": detections,
            "annotated_image": annotated_image,
            "workflow_result": workflow_result
        }

    except HTTPException:
        raise

    except Exception as error:
        print("Roboflow detection error:", repr(error))
        raise HTTPException(
            status_code=500,
            detail=f"Road hazard detection failed: {str(error)}"
        )

    finally:
        if file_path and os.path.exists(file_path):
            os.remove(file_path)

        await file.close()

