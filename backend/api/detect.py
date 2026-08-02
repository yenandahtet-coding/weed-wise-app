# ပုံတင်ပြီး AI စစ်ဆေးမယ့် API
import os
from fastapi import APIRouter, UploadFile, File, HTTPException
from ultralytics import YOLO
from PIL import Image
from io import BytesIO

router = APIRouter()

# Server စတက်တာနဲ့ AI Model ကို တစ်ခါတည်း Load လုပ်ထားပါမယ် (အချိန်မကြာအောင်လို့ပါ)
import os
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
# default_model = os.path.join(BASE_DIR, "ai_model", "best.pt")
default_model = os.path.join(BASE_DIR, "ai_model", "runs", "weed_detection", "weights", "best.pt")
MODEL_PATH = os.getenv("YOLO_MODEL_PATH", default_model)

try:
    model = YOLO(MODEL_PATH) 
except FileNotFoundError:
    print(f"Warning: Model not found at {MODEL_PATH}. Falling back to yolov8n.pt")
    model = YOLO("yolov8n.pt")

@router.post("/detect")
async def detect_weeds(file: UploadFile = File(...)):
    # ဝင်လာတဲ့ ဖိုင်က ဓာတ်ပုံ ဟုတ်/မဟုတ် စစ်ဆေးခြင်း
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image.")

    try:
        # Frontend က ပို့လိုက်တဲ့ ဓာတ်ပုံဖိုင်ကို ဖတ်ခြင်း
        contents = await file.read()
        image = Image.open(BytesIO(contents)).convert("RGB")

        # YOLOv8 Model ထဲထည့်ပြီး ပေါင်းပင်များကို ရှာဖွေခြင်း (Confidence 5% အထက်ကို ယူမယ်)
        results = model(image, conf=0.05)

        # တွေ့ရှိတဲ့ ပေါင်းပင် (Bounding Box) အရေအတွက်ကို ရေတွက်ခြင်း
        boxes = results[0].boxes
        weed_count = len(boxes)

        # Average confidence calculation and box extraction
        confidence = 0
        box_data = []
        if weed_count > 0 and hasattr(boxes, 'conf') and boxes.conf is not None:
            conf_values = boxes.conf.tolist()
            cls_values = boxes.cls.tolist() if hasattr(boxes, 'cls') and boxes.cls is not None else [0] * weed_count
            
            if conf_values:
                confidence = int(sum(conf_values) / len(conf_values) * 100)
                
            # Extract box coordinates (normalized xywh)
            if hasattr(boxes, 'xywhn') and boxes.xywhn is not None:
                for i, box in enumerate(boxes.xywhn.tolist()):
                    x, y, w, h = box
                    # YOLO xywhn gives center x, center y. Convert to top-left for frontend css
                    # x, y are centers, w, h are widths. All in 0-1 scale.
                    # CSS left = (x - w/2) * 100, top = (y - h/2) * 100
                    left_pct = max(0, (x - w/2)) * 100
                    top_pct = max(0, (y - h/2)) * 100
                    width_pct = w * 100
                    height_pct = h * 100
                    
                    class_id = int(cls_values[i])
                    class_name = model.names[class_id] if hasattr(model, 'names') and class_id in model.names else "Weed"
                    
                    box_data.append({
                        "x": left_pct,
                        "y": top_pct,
                        "w": width_pct,
                        "h": height_pct,
                        "confidence": int(conf_values[i] * 100),
                        "class_name": class_name
                    })

        # ဆေးညွှန်း တွက်ချက်ခြင်း
        herbicide_name = "Glyphosate (Roundup)"
        
        if weed_count == 0:
            severity = "Low"
            dosage = "No weeds detected."
        elif weed_count < 15:
            severity = "Low"
            dosage = "50ml per 10 liters of water"
        elif weed_count < 50:
            severity = "Medium"
            dosage = "100ml per 10 liters of water"
        else:
            severity = "High"
            dosage = "150ml per 10 liters of water"

        # Frontend ဆီကို အဖြေပြန်ပို့ပေးခြင်း
        return {
            "filename": file.filename,
            "detected_weeds": weed_count,
            "severity_level": severity,
            "confidence": confidence,
            "boxes": box_data,
            "recommendation": {
                "herbicide_to_use": herbicide_name,
                "dosage_instruction": dosage
            }
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
