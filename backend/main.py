# # Backend ကို စတင် Run မယ့် အဓိက ဖိုင် (Entry Point)
# from fastapi import FastAPI
# from api import auth, detect, history

# app = FastAPI(title="Weed Wise App Backend")

# app.include_router(auth.router, prefix="/api/auth", tags=["Auth"])
# app.include_router(detect.router, prefix="/api/detect", tags=["Detect"])
# app.include_router(history.router, prefix="/api/history", tags=["History"])

# @app.get("/")
# def read_root():
#     return {"message": "Welcome to Weed Wise API"}

import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.detect import router as detect_router

# FastAPI App တည်ဆောက်ခြင်း
app = FastAPI(title="Weed Detection API")

# Cross-Origin Resource Sharing (CORS) - Frontend မှ ခေါ်ယူခွင့်ပြုခြင်း
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# api/detect.py ထဲက Router ကို 'api/' prefix ဖြင့် ချိတ်ဆက်ခြင်း
app.include_router(detect_router, prefix="/api")

# Server အလုပ်လုပ်မလုပ် စစ်ဆေးရန် (Health Check) - Render ၏ GET နှင့် HEAD requests များကို လက်ခံသည်
@app.api_route("/", methods=["GET", "HEAD"])
def read_root():
    return {"status": "ok", "message": "Welcome to Weed Detection Backend API!"}

@app.api_route("/health", methods=["GET", "HEAD"])
def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port)