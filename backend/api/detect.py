# ပုံတင်ပြီး AI စစ်ဆေးမယ့် API
import os
from fastapi import APIRouter, UploadFile, File, HTTPException
from ultralytics import YOLO
from PIL import Image
from io import BytesIO

router = APIRouter()

# Server စတက်တာနဲ့ AI Model ကို တစ်ခါတည်း Load လုပ်ထားပါမယ် (အချိန်မကြာအောင်လို့ပါ)
import os
import requests
import base64
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
# default_model = os.path.join(BASE_DIR, "ai_model", "best.pt")
default_model = os.path.join(BASE_DIR, "ai_model", "runs", "weed_detection", "weights", "best.pt")
MODEL_PATH = os.getenv("YOLO_MODEL_PATH", default_model)

# Commented out local YOLO so you can still use it later if you want
# try:
#     model = YOLO(MODEL_PATH) 
# except FileNotFoundError:
#     print(f"Warning: Model not found at {MODEL_PATH}. Falling back to yolov8n.pt")
#     model = YOLO("yolov8n.pt")

@router.post("/detect")
async def detect_weeds(file: UploadFile = File(...)):
    # ဝင်လာတဲ့ ဖိုင်က ဓာတ်ပုံ ဟုတ်/မဟုတ် စစ်ဆေးခြင်း
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image.")

    try:
        # Frontend က ပို့လိုက်တဲ့ ဓာတ်ပုံဖိုင်ကို ဖတ်ခြင်း
        contents = await file.read()
        
        # Send to Roboflow using Inference SDK
        from inference_sdk import InferenceHTTPClient
        
        client = InferenceHTTPClient(
            api_url="https://serverless.roboflow.com",
            api_key="Mzz9I7A3G68NRpGuxx6C"
        )
        
        # Convert image to base64
        image_base64 = base64.b64encode(contents).decode("utf-8")
        
        # Reverted back to the robust model that works on the user's images
        data = client.infer(image_base64, model_id="weed-detection-uxofy/2")
        
        predictions = data.get("predictions", [])
        image_meta = data.get("image", {"width": 1, "height": 1})
        img_w = image_meta.get("width", 1)
        img_h = image_meta.get("height", 1)
        
        weed_count = len(predictions)
        
        confidence = 0
        box_data = []
        if weed_count > 0:
            conf_values = [p["confidence"] for p in predictions]
            confidence = int(sum(conf_values) / len(conf_values) * 100)
            
            gemini_weed_name = "Weeds"
            gemini_weed_data = None
            try:
                import google.generativeai as genai
                import json
                import re
                gemini_api_key = os.getenv("GEMINI_API_KEY")
                if gemini_api_key:
                    genai.configure(api_key=gemini_api_key)
                    model = genai.GenerativeModel('gemini-3.5-flash')
                    prompt = """Identify the most prominent weed species in this agricultural image. 
Respond ONLY with a valid JSON object with the following keys, translated into Myanmar Language (Burmese) except for 'scientific':
{
  "name": "Weed Name (Burmese)",
  "scientific": "Scientific Name (English)",
  "description": "Short description (Burmese)",
  "herbicide": {
    "name": "Herbicide Name (Burmese/English)",
    "activeIngredient": "Active ingredient (Burmese)",
    "ratePerAcre": 1.0,
    "suitableCrop": "Suitable Crop (Burmese)",
    "targetWeed": "Target Weed (Burmese)",
    "applicationMethod": "Foliar spray etc (Burmese)",
    "usage": "Usage instructions (Burmese)",
    "safety": "Safety guidelines (Burmese)"
  }
}
If you cannot identify it, respond with a JSON object where "name" is "အမည်မသိ ပေါင်းပင်" (Unknown Weed) and fill the rest with generic advice in Burmese. Ensure the output is strictly valid JSON without markdown formatting."""
                    
                    response = model.generate_content([
                        prompt,
                        {"mime_type": file.content_type, "data": contents}
                    ])
                    if response.text:
                        text = response.text.strip()
                        match = re.search(r'\{.*\}', text, re.DOTALL)
                        if match:
                            text = match.group(0)
                        try:
                            gemini_weed_data = json.loads(text)
                            gemini_weed_name = gemini_weed_data.get("name", "Weeds")
                        except Exception as e:
                            print("JSON Parse error:", e)
                            gemini_weed_name = text[:20] # Fallback if JSON fails completely
            except Exception as e:
                print("Gemini Error:", e)
            
            for p in predictions:
                # Roboflow gives center x, center y, width, height in pixels
                x = p["x"]
                y = p["y"]
                w = p["width"]
                h = p["height"]
                
                left_pct = max(0, (x - w/2) / img_w) * 100
                top_pct = max(0, (y - h/2) / img_h) * 100
                width_pct = (w / img_w) * 100
                height_pct = (h / img_h) * 100
                
                class_name = gemini_weed_name if gemini_weed_name != "Weeds" else p.get("class", "Weed")
                
                box_data.append({
                    "x": left_pct,
                    "y": top_pct,
                    "w": width_pct,
                    "h": height_pct,
                    "confidence": int(p["confidence"] * 100),
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
            "gemini_data": gemini_weed_data,
            "recommendation": {
                "herbicide_to_use": herbicide_name,
                "dosage_instruction": dosage
            }
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
