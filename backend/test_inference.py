import os
from PIL import Image
from ultralytics import YOLO

MODEL_PATH = r"C:\Users\Dell\Desktop\weed-wise-app\backend\ai_model\runs\weed_detection\weights\best.pt"
print(f"Loading model from {MODEL_PATH}")
model = YOLO(MODEL_PATH)

# Find a test image in dataset
img_dir = r"C:\Users\Dell\Desktop\weed-wise-app\dataset\WeedCrop.v1i.yolov5pytorch\test\images"
images = os.listdir(img_dir)
if not images:
    print("No images found for testing.")
else:
    test_img = os.path.join(img_dir, images[0])
    print(f"Testing on {test_img}")
    img = Image.open(test_img)
    results = model(img, conf=0.15)
    boxes = results[0].boxes
    print(f"Detected {len(boxes)} objects")
    
    if len(boxes) > 0:
        conf_values = boxes.conf.tolist()
        cls_values = boxes.cls.tolist()
        xywhn_values = boxes.xywhn.tolist()
        
        for i in range(len(boxes)):
            x, y, w, h = xywhn_values[i]
            left_pct = max(0, (x - w/2)) * 100
            top_pct = max(0, (y - h/2)) * 100
            width_pct = w * 100
            height_pct = h * 100
            
            class_id = int(cls_values[i])
            class_name = model.names[class_id]
            conf = conf_values[i]
            
            print(f"[{i}] {class_name} ({conf:.2f}) -> x={left_pct:.1f}%, y={top_pct:.1f}%, w={width_pct:.1f}%, h={height_pct:.1f}%")
