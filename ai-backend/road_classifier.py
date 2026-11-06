
from PIL import Image
from transformers import pipeline

print("Loading road classifier...")

classifier = pipeline(
    "zero-shot-image-classification",
    model="openai/clip-vit-base-patch32",
)

CANDIDATE_LABELS = [
    "a photograph of a road",
    "a photograph of a road with potholes or cracks",
    "a photograph of road debris or waterlogging",
    "a selfie or portrait of a person",
    "an indoor room",
    "an animal or pet",
    "an unrelated object or scene",
]


def check_road_image(image_path: str):
    with Image.open(image_path) as img:
        image = img.convert("RGB")

    results = classifier(
        image,
        candidate_labels=CANDIDATE_LABELS,
    )

    best = results[0]
    label = best["label"]
    score = float(best["score"])

    return {
        "is_road_scene": label in CANDIDATE_LABELS[:3],
        "predicted_label": label,
        "score": round(score, 4),
    }
