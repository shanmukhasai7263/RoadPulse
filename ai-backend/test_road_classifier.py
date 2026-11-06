
from road_classifier import check_road_image

image_path = input(
    "Enter the full path of an image: "
).strip().strip('"')

result = check_road_image(image_path)

print("\nClassification result:")
print(result)
