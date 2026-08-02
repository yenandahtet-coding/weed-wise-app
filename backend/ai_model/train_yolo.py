from ultralytics import YOLO
from pathlib import Path
import os

def train_model():
    # Load a pretrained YOLOv8n model
    model = YOLO("yolov8n.pt")

    # Define training parameters based on dataset size and requirements
    dataset_yaml = "C:/Users/Dell/Desktop/weed-wise-app/dataset/WeedCrop.v1i.yolov5pytorch/data.yaml"
    project_dir = "C:/Users/Dell/Desktop/weed-wise-app/backend/ai_model/runs"
    
    print("Starting YOLOv8n Training...")
    
    # Train the model
    # We use 100 epochs for better accuracy, early stopping (patience), mosaic augmentation, etc.
    results = model.train(
        data=dataset_yaml,
        epochs=100,
        patience=5,
        batch=16,
        imgsz=640,
        project=project_dir,
        name="weed_detection",
        exist_ok=True,
        augment=True,
        mosaic=1.0,
        fliplr=0.5,
        hsv_h=0.015,
        hsv_s=0.7,
        hsv_v=0.4,
        device='' # Auto select GPU/CPU
    )
    
    print("\nTraining completed successfully!")
    
    # Best weights are saved in backend/ai_model/runs/weed_detection/weights/best.pt
    best_weights = Path(project_dir) / "weed_detection" / "weights" / "best.pt"
    if best_weights.exists():
        print(f"Best model saved at: {best_weights}")
    else:
        print("Error: best.pt not found.")

if __name__ == "__main__":
    train_model()
