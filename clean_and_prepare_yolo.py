import os
import shutil
import hashlib
from pathlib import Path
from collections import Counter

import cv2
import pandas as pd
import yaml

from sklearn.model_selection import train_test_split


# ============================================================
# CONFIGURATION
# ============================================================

# ------------------------------------------------------------
# Change this to your raw dataset location
# ------------------------------------------------------------
RAW_DATASET = Path("raw_dataset")

# ------------------------------------------------------------
# This is where the cleaned YOLO dataset will be created
# ------------------------------------------------------------
OUTPUT_DATASET = Path("dataset")

# ------------------------------------------------------------
# Dataset split ratios
# 70% Train
# 20% Validation
# 10% Test
# ------------------------------------------------------------
TRAIN_RATIO = 0.70
VAL_RATIO = 0.20
TEST_RATIO = 0.10

# Random seed for reproducible splitting
RANDOM_STATE = 42

# ------------------------------------------------------------
# Image extensions supported by OpenCV
# ------------------------------------------------------------
IMAGE_EXTENSIONS = {
    ".jpg",
    ".jpeg",
    ".png",
    ".bmp",
    ".tif",
    ".tiff",
    ".webp"
}

# ------------------------------------------------------------
# Class names
# ------------------------------------------------------------
CLASS_NAMES = [
    "crop",
    "weed"
]


# ============================================================
# HELPER FUNCTIONS
# ============================================================

def calculate_md5(file_path):
    """
    Calculate MD5 hash of a file.

    Used to detect exact duplicate images.
    """
    hash_md5 = hashlib.md5()
    try:
        with open(file_path, "rb") as f:
            for chunk in iter(lambda: f.read(4096), b""):
                hash_md5.update(chunk)
        return hash_md5.hexdigest()
    except Exception:
        return None


def is_valid_image(image_path):
    """
    Check whether an image can be successfully read by OpenCV.
    """
    try:
        image = cv2.imread(str(image_path))
        if image is None:
            return False, None, None
        height, width = image.shape[:2]
        if width <= 0 or height <= 0:
            return False, None, None
        return True, width, height
    except Exception:
        return False, None, None


def read_yolo_labels(label_path):
    """
    Read YOLO annotation file.
    """
    annotations = []
    try:
        with open(label_path, "r", encoding="utf-8") as file:
            lines = file.readlines()
        for line_number, line in enumerate(lines, start=1):
            line = line.strip()
            if not line:
                continue
            parts = line.split()
            if len(parts) != 5:
                print(f"[WARNING] Invalid annotation format: {label_path} line {line_number}")
                continue
            try:
                class_id = int(float(parts[0]))
                x_center = float(parts[1])
                y_center = float(parts[2])
                width = float(parts[3])
                height = float(parts[4])
            except ValueError:
                print(f"[WARNING] Non-numeric annotation: {label_path} line {line_number}")
                continue
            if class_id < 0 or class_id >= len(CLASS_NAMES):
                print(f"[WARNING] Invalid class ID {class_id} in {label_path}")
                continue
            if not (0 <= x_center <= 1 and 0 <= y_center <= 1 and 0 < width <= 1 and 0 < height <= 1):
                print(f"[WARNING] Invalid bounding box in {label_path}")
                continue
            annotations.append({
                "class_id": class_id,
                "x_center": x_center,
                "y_center": y_center,
                "width": width,
                "height": height
            })
    except Exception as e:
        print(f"[ERROR] Cannot read label file {label_path}: {e}")
    return annotations


def dominant_class(label_path):
    """
    Find the dominant class in a label file.
    """
    annotations = read_yolo_labels(label_path)
    if not annotations:
        return None
    class_counter = Counter(annotation["class_id"] for annotation in annotations)
    return class_counter.most_common(1)[0][0]


# ============================================================
# CREATE OUTPUT DIRECTORIES
# ============================================================

def create_output_directories():
    print("\nCreating output directories...")
    for split in ["train", "val", "test"]:
        (OUTPUT_DATASET / split / "images").mkdir(parents=True, exist_ok=True)
        (OUTPUT_DATASET / split / "labels").mkdir(parents=True, exist_ok=True)
    (OUTPUT_DATASET / "unlabelled").mkdir(parents=True, exist_ok=True)
    (OUTPUT_DATASET / "orphan_labels").mkdir(parents=True, exist_ok=True)


# ============================================================
# FIND RAW IMAGES AND LABELS
# ============================================================

def find_dataset_files():
    print("\nScanning raw dataset...")
    images = {}
    labels = {}
    for file_path in RAW_DATASET.rglob("*"):
        if not file_path.is_file():
            continue
        extension = file_path.suffix.lower()
        if extension in IMAGE_EXTENSIONS:
            images[file_path.stem] = file_path
        elif extension == ".txt":
            labels[file_path.stem] = file_path
    print(f"Found images: {len(images)}")
    print(f"Found labels: {len(labels)}")
    return images, labels


# ============================================================
# CLEAN AND VALIDATE DATA
# ============================================================

def clean_dataset(images, labels):
    print("\nStarting dataset cleaning...")
    valid_pairs = []
    seen_image_hashes = {}
    cleaning_report = []
    
    for image_name, image_path in images.items():
        valid, width, height = is_valid_image(image_path)
        if not valid:
            cleaning_report.append({"image_name": image_name, "status": "corrupted_image", "reason": "Unreadable or invalid image"})
            print(f"[REMOVE] Corrupted image: {image_path}")
            continue

        image_hash = calculate_md5(image_path)
        if image_hash in seen_image_hashes:
            cleaning_report.append({"image_name": image_name, "status": "duplicate_image", "reason": f"Duplicate of {seen_image_hashes[image_hash]}"})
            print(f"[REMOVE] Duplicate image: {image_path}")
            continue
        seen_image_hashes[image_hash] = image_name

        if image_name not in labels:
            destination = OUTPUT_DATASET / "unlabelled" / image_path.name
            shutil.copy2(image_path, destination)
            cleaning_report.append({"image_name": image_name, "status": "unlabelled", "reason": "No matching YOLO label file"})
            print(f"[MOVE] Unlabelled image: {image_path}")
            continue

        label_path = labels[image_name]
        annotations = read_yolo_labels(label_path)
        
        if not annotations:
            cleaning_report.append({"image_name": image_name, "status": "invalid_label", "reason": "No valid YOLO annotations"})
            print(f"[REMOVE] Invalid label: {label_path}")
            continue

        dominant = dominant_class(label_path)
        valid_pairs.append({
            "image_path": image_path,
            "label_path": label_path,
            "image_name": image_name,
            "width": width,
            "height": height,
            "dominant_class": dominant
        })
        cleaning_report.append({"image_name": image_name, "status": "valid", "reason": "Valid image and label"})

    for label_name, label_path in labels.items():
        if label_name not in images:
            destination = OUTPUT_DATASET / "orphan_labels" / label_path.name
            shutil.copy2(label_path, destination)
            cleaning_report.append({"image_name": label_name, "status": "orphan_label", "reason": "No matching image file"})
            print(f"[MOVE] Orphan label: {label_path}")

    report_df = pd.DataFrame(cleaning_report)
    report_df.to_csv(OUTPUT_DATASET / "cleaning_report.csv", index=False)
    print(f"\nValid image-label pairs: {len(valid_pairs)}")
    
    return valid_pairs


# ============================================================
# SPLIT DATASET
# ============================================================

def split_dataset(valid_pairs):
    print("\nSplitting dataset...")
    df = pd.DataFrame(valid_pairs)
    
    if len(df) < 3:
        raise ValueError("Not enough valid images for splitting.")

    try:
        train_df, temp_df = train_test_split(df, test_size=(1 - TRAIN_RATIO), random_state=RANDOM_STATE, stratify=df["dominant_class"])
        val_df, test_df = train_test_split(temp_df, test_size=TEST_RATIO / (VAL_RATIO + TEST_RATIO), random_state=RANDOM_STATE, stratify=temp_df["dominant_class"])
        print("Stratified split successfully applied.")
    except ValueError as e:
        print("\n[WARNING] Stratified split failed.")
        print("Reason:", e)
        print("Using random split instead.")
        train_df, temp_df = train_test_split(df, test_size=(1 - TRAIN_RATIO), random_state=RANDOM_STATE)
        val_df, test_df = train_test_split(temp_df, test_size=TEST_RATIO / (VAL_RATIO + TEST_RATIO), random_state=RANDOM_STATE)

    print(f"Train: {len(train_df)}")
    print(f"Validation: {len(val_df)}")
    print(f"Test: {len(test_df)}")
    
    return train_df, val_df, test_df


# ============================================================
# COPY FILES INTO YOLO STRUCTURE
# ============================================================

def copy_split_files(split_df, split_name):
    print(f"\nCopying {split_name} dataset...")
    image_output = OUTPUT_DATASET / split_name / "images"
    label_output = OUTPUT_DATASET / split_name / "labels"
    
    for _, row in split_df.iterrows():
        image_source = Path(row["image_path"])
        label_source = Path(row["label_path"])
        image_destination = image_output / image_source.name
        label_destination = label_output / f"{image_source.stem}.txt"
        
        shutil.copy2(image_source, image_destination)
        shutil.copy2(label_source, label_destination)


# ============================================================
# GENERATE SUMMARY CSV
# ============================================================

def generate_summary(split_name):
    print(f"\nGenerating {split_name} summary...")
    image_dir = OUTPUT_DATASET / split_name / "images"
    label_dir = OUTPUT_DATASET / split_name / "labels"
    rows = []

    for image_path in image_dir.iterdir():
        if not image_path.is_file():
            continue
            
        valid, width, height = is_valid_image(image_path)
        if not valid:
            continue
            
        label_path = label_dir / f"{image_path.stem}.txt"
        annotations = read_yolo_labels(label_path)
        
        class_counts = Counter(annotation["class_id"] for annotation in annotations)
        for class_id, count in class_counts.items():
            rows.append({
                "image_name": image_path.name,
                "image_width": width,
                "image_height": height,
                "class_id": class_id,
                "class_name": CLASS_NAMES[class_id],
                "bounding_box_count": count
            })

    summary_df = pd.DataFrame(rows)
    summary_df.to_csv(OUTPUT_DATASET / f"{split_name}_summary.csv", index=False)
    print(f"Saved {split_name}_summary.csv")


# ============================================================
# GENERATE DATA.YAML
# ============================================================

def generate_data_yaml():
    print("\nGenerating data.yaml...")
    data = {
        "path": str(OUTPUT_DATASET.resolve()),
        "train": "train/images",
        "val": "val/images",
        "test": "test/images",
        "nc": len(CLASS_NAMES),
        "names": CLASS_NAMES
    }
    
    with open(OUTPUT_DATASET / "data.yaml", "w", encoding="utf-8") as file:
        yaml.dump(data, file, sort_keys=False)
    print("data.yaml created successfully.")


# ============================================================
# PRINT DATASET STATISTICS
# ============================================================

def print_statistics(train_df, val_df, test_df):
    print("\n")
    print("=" * 60)
    print("FINAL DATASET STATISTICS")
    print("=" * 60)
    
    total = len(train_df) + len(val_df) + len(test_df)
    print(f"Total images: {total}")
    print(f"Train: {len(train_df)} ({len(train_df) / total * 100:.2f}%)")
    print(f"Validation: {len(val_df)} ({len(val_df) / total * 100:.2f}%)")
    print(f"Test: {len(test_df)} ({len(test_df) / total * 100:.2f}%)")
    
    print("\nClass Distribution:")
    for split_name, split_df in [("Train", train_df), ("Validation", val_df), ("Test", test_df)]:
        print(f"\n{split_name}:")
        distribution = split_df["dominant_class"].value_counts().sort_index()
        for class_id, count in distribution.items():
            class_name = CLASS_NAMES[int(class_id)]
            print(f"  {class_id} - {class_name}: {count}")


# ============================================================
# MAIN FUNCTION
# ============================================================

def main():
    print("=" * 60)
    print("YOLO DATASET CLEANING AND PREPARATION")
    print("=" * 60)

    if not RAW_DATASET.exists():
        raise FileNotFoundError(f"Raw dataset not found: {RAW_DATASET}")

    create_output_directories()
    images, labels = find_dataset_files()
    valid_pairs = clean_dataset(images, labels)
    train_df, val_df, test_df = split_dataset(valid_pairs)
    
    copy_split_files(train_df, "train")
    copy_split_files(val_df, "val")
    copy_split_files(test_df, "test")
    
    generate_summary("train")
    generate_summary("val")
    generate_summary("test")
    
    generate_data_yaml()
    print_statistics(train_df, val_df, test_df)
    print("\n")
    print("=" * 60)
    print("DATASET PREPARATION COMPLETED!")
    print("=" * 60)
    print(f"\nOutput dataset: {OUTPUT_DATASET.resolve()}")


# ============================================================
# RUN SCRIPT
# ============================================================

if __name__ == "__main__":
    main()
