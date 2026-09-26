"""
download_dataset.py

Downloads the official PlantVillage leaf disease dataset (without augmentation)
from Mendeley Data repository (~827 MB), displays progress, and extracts it
into backend/ml/data/PlantVillage.
"""

import os
import sys
import urllib.request
import zipfile
import shutil

DATASET_URL = "https://data.mendeley.com/public-files/datasets/tywbtsjrjv/files/d5652a28-c1d8-4b76-97f3-72fb80f94efc/file_downloaded"
DEST_DIR = os.path.join(os.path.dirname(__file__), "data")
ZIP_PATH = os.path.join(DEST_DIR, "plant_village.zip")
EXTRACT_DIR = os.path.join(DEST_DIR, "PlantVillage")


def download_with_progress(url, dest_path):
    print(f"Connecting to dataset mirror at:\n  {url}\n")
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    
    with urllib.request.urlopen(req, timeout=60) as resp:
        total_size = int(resp.headers.get("Content-Length", 0))
        downloaded = 0
        block_size = 1024 * 1024  # 1 MB blocks
        
        print(f"Target file: {dest_path}")
        print(f"Total size: {total_size / (1024 * 1024):.1f} MB\n")
        
        with open(dest_path, "wb") as out_file:
            while True:
                chunk = resp.read(block_size)
                if not chunk:
                    break
                out_file.write(chunk)
                downloaded += len(chunk)
                if total_size > 0:
                    percent = (downloaded / total_size) * 100
                    mb_down = downloaded / (1024 * 1024)
                    mb_total = total_size / (1024 * 1024)
                    print(f"\rDownloading: {mb_down:.1f}/{mb_total:.1f} MB ({percent:.1f}%)", end="", flush=True)
                else:
                    print(f"\rDownloaded: {downloaded / (1024 * 1024):.1f} MB", end="", flush=True)
        print("\n\nDownload complete!")


def extract_and_organize(zip_path, extract_target):
    print(f"Extracting {zip_path} ...")
    temp_dir = os.path.join(DEST_DIR, "_temp_extract")
    os.makedirs(temp_dir, exist_ok=True)
    
    with zipfile.ZipFile(zip_path, "r") as zf:
        zf.extractall(temp_dir)
        
    print("Organizing dataset folders...")
    # Find the folder containing the class subdirectories
    # Mendeley zip usually contains a folder like 'Plant_leave_diseases_dataset_without_augmentation'
    # which contains the 38 class folders.
    candidates = []
    for root, dirs, files in os.walk(temp_dir):
        # Check if this folder contains classes like 'Apple___Apple_scab' or similar
        matching_dirs = [d for d in dirs if "___" in d]
        if len(matching_dirs) >= 10:
            candidates.append(root)
            break
            
    source_dir = candidates[0] if candidates else temp_dir
    print(f"Found class directories in: {source_dir}")
    
    os.makedirs(extract_target, exist_ok=True)
    for item in os.listdir(source_dir):
        src_item = os.path.join(source_dir, item)
        dst_item = os.path.join(extract_target, item)
        if os.path.isdir(src_item) and "___" in item:
            if os.path.exists(dst_item):
                shutil.rmtree(dst_item)
            shutil.move(src_item, dst_item)
            
    # Clean up temp
    shutil.rmtree(temp_dir, ignore_errors=True)
    if os.path.exists(zip_path):
        os.remove(zip_path)
        
    class_count = len([d for d in os.listdir(extract_target) if os.path.isdir(os.path.join(extract_target, d))])
    print(f"Extraction complete! {class_count} classes verified in {extract_target}")


def main():
    os.makedirs(DEST_DIR, exist_ok=True)
    if os.path.exists(EXTRACT_DIR):
        classes = [d for d in os.listdir(EXTRACT_DIR) if os.path.isdir(os.path.join(EXTRACT_DIR, d))]
        if len(classes) >= 30:
            print(f"PlantVillage dataset already present at {EXTRACT_DIR} with {len(classes)} classes.")
            return

    download_with_progress(DATASET_URL, ZIP_PATH)
    extract_and_organize(ZIP_PATH, EXTRACT_DIR)


if __name__ == "__main__":
    main()
