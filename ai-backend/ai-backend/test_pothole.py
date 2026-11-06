from ultralytics import YOLO

model = YOLO("models/best.pt")

results = model(
    "uploads/pothole.png",
    conf=0.25,
    save=True
)

for result in results:
    print("Class names:", result.names)
    print("Number of detections:", len(result.boxes))

    for box in result.boxes:
        class_id = int(box.cls[0])
        confidence = float(box.conf[0])
        x1, y1, x2, y2 = box.xyxy[0].tolist()

        print(
            "Detected:",
            result.names[class_id],
            "Confidence:",
            round(confidence, 2),
            "BBox:",
            [
                round(x1),
                round(y1),
                round(x2),
                round(y2)
            ]
        )

print("Pothole model test completed!")