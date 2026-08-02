import yaml
import os
from pathlib import Path

def validate():
    dataset_dir = Path("C:/Users/Dell/Desktop/weed-wise-app/dataset/WeedCrop.v1i.yolov5pytorch")
    yaml_path = dataset_dir / "data.yaml"
    
    if not yaml_path.exists():
        print(f"Error: {yaml_path} not found")
        return False
        
    with open(yaml_path, 'r') as f:
        data = yaml.safe_load(f)
        
    splits = ["train", "val"]
    valid = True
    
    for split in splits:
        split_path = data.get(split)
        if not split_path:
            continue
            
        img_dir = dataset_dir / split_path
        lbl_dir = dataset_dir / split_path.replace("images", "labels")
        
        if not img_dir.exists():
            print(f"Error: Image directory {img_dir} does not exist.")
            valid = False
            continue
            
        if not lbl_dir.exists():
            print(f"Error: Label directory {lbl_dir} does not exist.")
            valid = False
            continue
            
        images = list(img_dir.glob("*.jpg"))
        labels = list(lbl_dir.glob("*.txt"))
        
        print(f"Split '{split}': {len(images)} images, {len(labels)} labels")
        
        if len(images) == 0:
            print(f"Warning: No images found in {img_dir}")
            valid = False
            
    if valid:
        print("Dataset validation passed!")
    return valid

if __name__ == "__main__":
    validate()
