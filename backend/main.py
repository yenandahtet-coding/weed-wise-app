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

from fastapi import FastAPI
from api.detect import router as detect_router

# FastAPI App ကို တည်ဆောက်ခြင်း
app = FastAPI(title="Weed Detection API")

# api/detect.py ထဲက Router ကို 'api/' ဆိုတဲ့ prefix နဲ့ ချိတ်ဆက်ခြင်း
app.include_router(detect_router, prefix="/api")

# Server အလုပ်လုပ်မလုပ် စမ်းသပ်ရန် (Health Check)
@app.get("/")
def read_root():
    return {"message": "Welcome to Weed Detection Backend API!"}