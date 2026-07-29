# ပုံတင်ပြီး AI စစ်ဆေးမယ့် API
import os
from fastapi import APIRouter, UploadFile, File, HTTPException
from ultralytics import YOLO
from PIL import Image
from io import BytesIO

router = APIRouter()

# Server စတက်တာနဲ့ AI Model ကို တစ်ခါတည်း Load လုပ်ထားပါမယ် (အချိန်မကြာအောင်လို့ပါ)
MODEL_PATH = os.getenv("YOLO_MODEL_PATH", "yolov8n.pt")
model = YOLO(MODEL_PATH) 

@router.post("/detect")
async def detect_weeds(file: UploadFile = File(...)):
    # ဝင်လာတဲ့ ဖိုင်က ဓာတ်ပုံ ဟုတ်/မဟုတ် စစ်ဆေးခြင်း
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image.")

    try:
        # Frontend က ပို့လိုက်တဲ့ ဓာတ်ပုံဖိုင်ကို ဖတ်ခြင်း
        contents = await file.read()
        image = Image.open(BytesIO(contents)).convert("RGB")

        # YOLOv8 Model ထဲထည့်ပြီး ပေါင်းပင်များကို ရှာဖွေခြင်း
        results = model(image)

        # တွေ့ရှိတဲ့ ပေါင်းပင် (Bounding Box) အရေအတွက်ကို ရေတွက်ခြင်း
        boxes = results[0].boxes
        weed_count = len(boxes)

        # Average confidence calculation
        confidence = 0
        if weed_count > 0 and hasattr(boxes, 'conf') and boxes.conf is not None:
            conf_values = boxes.conf.tolist()
            if conf_values:
                confidence = int(sum(conf_values) / len(conf_values) * 100)
        else:
            confidence = 85 # Mock confidence if no weeds detected or no conf attribute

        # ဆေးညွှန်း တွက်ချက်ခြင်း (ဒီအပိုင်းကို services/calculator.py ထဲ ခွဲထုတ်ရေးလို့ရပါတယ်)
        herbicide_name = "Glyphosate (Roundup)"
        
        if weed_count == 0:
            severity = "Low"
            dosage = "No spraying needed."
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
            "recommendation": {
                "herbicide_to_use": herbicide_name,
                "dosage_instruction": dosage
            }
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
