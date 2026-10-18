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
default_model = os.path.join(BASE_DIR, "ai_model", "runs", "weed_detection", "weights", "best.pt")
MODEL_PATH = os.getenv("YOLO_MODEL_PATH", default_model)

local_model = None
try:
    if os.path.exists(MODEL_PATH):
        local_model = YOLO(MODEL_PATH)
    elif os.path.exists(os.path.join(BASE_DIR, "yolov8n.pt")):
        local_model = YOLO(os.path.join(BASE_DIR, "yolov8n.pt"))
except Exception as e:
    print("Warning: Could not load local YOLO model:", e)

try:
    from core.weed_knowledge_base import get_weed_by_scientific, get_fallback_weed
except ImportError:
    from backend.core.weed_knowledge_base import get_weed_by_scientific, get_fallback_weed

@router.post("/detect")
async def detect_weeds(file: UploadFile = File(...), lang: str = "en"):
    # ဝင်လာတဲ့ ဖိုင်က ဓာတ်ပုံ ဟုတ်/မဟုတ် စစ်ဆေးခြင်း
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image.")

    try:
        # Frontend က ပို့လိုက်တဲ့ ဓာတ်ပုံဖိုင်ကို ဖတ်ခြင်း
        contents = await file.read()
        
        predictions = []
        img_w, img_h = 1, 1

        # 1. Try Roboflow inference first
        try:
            from inference_sdk import InferenceHTTPClient
            client = InferenceHTTPClient(
                api_url="https://serverless.roboflow.com",
                api_key="Mzz9I7A3G68NRpGuxx6C"
            )
            image_base64 = base64.b64encode(contents).decode("utf-8")
            data = client.infer(image_base64, model_id="weed-detection-uxofy/2")
            predictions = data.get("predictions", [])
            image_meta = data.get("image", {"width": 1, "height": 1})
            img_w = image_meta.get("width", 1)
            img_h = image_meta.get("height", 1)
        except Exception as roboflow_err:
            print("Roboflow Inference failed, falling back to local YOLO model:", roboflow_err)
            if local_model is not None:
                img = Image.open(BytesIO(contents))
                img_w, img_h = img.size
                results = local_model(img, conf=0.15)
                boxes = results[0].boxes
                if len(boxes) > 0:
                    conf_values = boxes.conf.tolist()
                    xywh_values = boxes.xywh.tolist()
                    cls_values = boxes.cls.tolist()
                    for idx in range(len(boxes)):
                        x, y, w, h = xywh_values[idx]
                        cls_name = local_model.names.get(int(cls_values[idx]), "weed")
                        predictions.append({
                            "x": x,
                            "y": y,
                            "width": w,
                            "height": h,
                            "confidence": conf_values[idx],
                            "class": cls_name
                        })

        weed_count = len(predictions)
        
        confidence = 0
        box_data = []
        gemini_weed_name = "Weeds"
        gemini_weed_data = None

        if weed_count > 0:
            conf_values = [p["confidence"] for p in predictions]
            confidence = int(sum(conf_values) / len(conf_values) * 100)
            
            # Determine language prompt instruction
            target_lang_str = "Myanmar (Burmese)" if lang == "my" else "English"
            
            try:
                import google.generativeai as genai
                import json
                import re
                gemini_api_key = os.getenv("GEMINI_API_KEY")
                if gemini_api_key:
                    genai.configure(api_key=gemini_api_key)
                    model = genai.GenerativeModel('gemini-1.5-flash')
                    prompt = f"""You are a global agricultural botanist and agronomist. Identify the most prominent weed species in this image.
Respond ONLY with a valid JSON object strictly matching this schema:
{{
  "name": "Common Weed Name in {target_lang_str}",
  "scientific": "Latin Binomial Scientific Name (e.g. Cyperus rotundus)",
  "family": "Botanical Family (e.g. Poaceae, Cyperaceae)",
  "description": "Short agronomic description in {target_lang_str}",
  "herbicide": {{
    "name": "Recommended Herbicide Formulation in {target_lang_str}",
    "activeIngredient": "Standard International Chemical Active Ingredient (e.g. Glyphosate, 2,4-D, Halosulfuron-methyl)",
    "ratePerAcre": 0.8,
    "suitableCrop": "Suitable Crops in {target_lang_str}",
    "targetWeed": "Target Weeds controlled in {target_lang_str}",
    "applicationMethod": "Application Method (e.g. Foliar spray / Pre-emergence) in {target_lang_str}",
    "usage": "Usage instructions in {target_lang_str}",
    "safety": "International FAO/EPA safety precautions in {target_lang_str}"
  }}
}}
Ensure the output is strictly valid JSON without markdown formatting."""
                    
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
            except Exception as e:
                print("Gemini API Error / Quota Limit reached:", e)
            
            # Fallback to Global Weed Knowledge Base if Gemini was unavailable or rate-limited
            if not gemini_weed_data:
                print("Using Global Weed Knowledge Base fallback...")
                gemini_weed_data = get_fallback_weed(lang=lang, index=weed_count)
                gemini_weed_name = gemini_weed_data.get("name", "Weeds")
            
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
        active_ingredient = "Glyphosate"
        scientific_name = ""
        
        if gemini_weed_data:
            scientific_name = gemini_weed_data.get("scientific", "")
            h_info = gemini_weed_data.get("herbicide", {})
            if isinstance(h_info, dict):
                herbicide_name = h_info.get("name", herbicide_name)
                active_ingredient = h_info.get("activeIngredient", active_ingredient)
        
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
            "scientific_name": scientific_name,
            "active_ingredient": active_ingredient,
            "recommendation": {
                "herbicide_to_use": herbicide_name,
                "active_ingredient": active_ingredient,
                "dosage_instruction": dosage
            }
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
