"""
train_disease_model.py

Real training script: fine-tunes ImageNet-pretrained MobileNetV2 on the
PlantVillage dataset (color images, 38 classes).

This was written to be run on YOUR machine (or Colab/Kaggle with a
GPU), not inside the sandbox this project was scaffolded in — that
sandbox can reach neither download.pytorch.org (for pretrained
ImageNet weights) nor Kaggle (for the dataset itself), both confirmed
by direct attempts during development. Nothing about the code is a
stub: point it at the real dataset and it trains a real model.

Usage:
    1. Download the dataset from Kaggle:
       https://www.kaggle.com/datasets/abdallahalidev/plantvillage-dataset
       (or: https://github.com/spMohanty/PlantVillage-Dataset)

    2. Point --data-dir at the "color" subfolder, which should contain
       one subdirectory per class (ImageFolder format), e.g.:
           plantvillage/color/Apple___Apple_scab/*.jpg
           plantvillage/color/Apple___Black_rot/*.jpg
           ...

    3. Run:
           python3 train_disease_model.py --data-dir /path/to/plantvillage/color --epochs 10

    4. Best checkpoint (lowest validation loss) is saved to
       ./checkpoints/mobilenetv2_plantvillage_best.pth — this is the
       exact path app/services/disease_detection.py looks for by
       default (override with the DISEASE_MODEL_CHECKPOINT env var).

Expect ~1-2 hours on a single consumer GPU for 10 epochs on the full
~54k image dataset; CPU-only will be much slower. Published results
on this dataset with similar lightweight CNNs (MobileNetV3, ShuffleNet,
EfficientNetB0) report 98-99%+ validation accuracy within ~10 epochs
(Rath, 2023 — debuggercafe.com), so 10 epochs is a reasonable starting
point, not an arbitrary guess.
"""

import argparse
import os
import sys
import time

import torch
import torch.nn as nn
from torch.utils.data import DataLoader, random_split
from torchvision import datasets, transforms

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from app.services.disease_detection import build_architecture, PLANTVILLAGE_CLASSES, NUM_CLASSES

IMAGENET_MEAN = [0.485, 0.456, 0.406]
IMAGENET_STD = [0.229, 0.224, 0.225]


def build_dataloaders(data_dir: str, batch_size: int, val_split: float, num_workers: int):
    train_transform = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.RandomHorizontalFlip(),
        transforms.RandomVerticalFlip(),
        transforms.RandomRotation(20),
        transforms.ColorJitter(brightness=0.2, contrast=0.2, saturation=0.2),
        transforms.ToTensor(),
        transforms.Normalize(mean=IMAGENET_MEAN, std=IMAGENET_STD),
    ])
    eval_transform = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize(mean=IMAGENET_MEAN, std=IMAGENET_STD),
    ])

    # Load the dataset TWICE with different transforms, then split using the SAME indices.
    # This is the correct fix for the "val_ds.dataset.transform" bug: random_split
    # returns a Subset that shares the underlying dataset object, so mutating its
    # .transform after splitting would affect the training subset too.
    full_train_ds = datasets.ImageFolder(data_dir, transform=train_transform)
    full_eval_ds = datasets.ImageFolder(data_dir, transform=eval_transform)

    if full_train_ds.classes != PLANTVILLAGE_CLASSES:
        print(
            "WARNING: dataset folder class names/order don't exactly match "
            "PLANTVILLAGE_CLASSES in app/services/disease_detection.py.\n"
            f"  Found in data-dir:  {full_train_ds.classes[:3]}... ({len(full_train_ds.classes)} classes)\n"
            f"  Expected:           {PLANTVILLAGE_CLASSES[:3]}... ({NUM_CLASSES} classes)\n"
            "Training will proceed using the dataset's own class order, but you "
            "MUST update PLANTVILLAGE_CLASSES to match before deploying this "
            "checkpoint, or predictions will be mislabeled.",
            file=sys.stderr,
        )

    total = len(full_train_ds)
    val_size = int(total * val_split)
    train_size = total - val_size

    # Use the same generator seed to produce the SAME index split for both datasets.
    gen = torch.Generator()
    gen.manual_seed(42)
    train_indices, val_indices = [
        idx.tolist()
        for idx in torch.randperm(total, generator=gen).split([train_size, val_size])
    ]

    train_ds = torch.utils.data.Subset(full_train_ds, train_indices)
    val_ds = torch.utils.data.Subset(full_eval_ds, val_indices)

    use_pin = torch.cuda.is_available()
    train_loader = DataLoader(train_ds, batch_size=batch_size, shuffle=True, num_workers=num_workers, pin_memory=use_pin)
    val_loader = DataLoader(val_ds, batch_size=batch_size, shuffle=False, num_workers=num_workers, pin_memory=use_pin)
    return train_loader, val_loader, full_train_ds.classes


def train_one_epoch(model, loader, optimizer, criterion, device):
    model.train()
    running_loss, correct, total = 0.0, 0, 0
    for images, labels in loader:
        images, labels = images.to(device), labels.to(device)
        optimizer.zero_grad()
        outputs = model(images)
        loss = criterion(outputs, labels)
        loss.backward()
        optimizer.step()

        running_loss += loss.item() * images.size(0)
        _, preds = outputs.max(1)
        correct += (preds == labels).sum().item()
        total += labels.size(0)
    return running_loss / total, correct / total


@torch.no_grad()
def evaluate(model, loader, criterion, device):
    model.eval()
    running_loss, correct, total = 0.0, 0, 0
    for images, labels in loader:
        images, labels = images.to(device), labels.to(device)
        outputs = model(images)
        loss = criterion(outputs, labels)
        running_loss += loss.item() * images.size(0)
        _, preds = outputs.max(1)
        correct += (preds == labels).sum().item()
        total += labels.size(0)
    return running_loss / total, correct / total


def main():
    parser = argparse.ArgumentParser(description="Train MobileNetV2 on PlantVillage")
    parser.add_argument("--data-dir", required=True, help="Path to PlantVillage 'color' directory (ImageFolder format)")
    parser.add_argument("--epochs", type=int, default=10)
    parser.add_argument("--batch-size", type=int, default=32)
    parser.add_argument("--learning-rate", type=float, default=0.001)
    parser.add_argument("--val-split", type=float, default=0.15)
    parser.add_argument("--num-workers", type=int, default=4)
    parser.add_argument("--label-smoothing", type=float, default=0.1, help="Label smoothing for CrossEntropyLoss (default: 0.1)")
    parser.add_argument("--output-dir", default=os.path.join(os.path.dirname(__file__), "checkpoints"))
    args = parser.parse_args()

    os.makedirs(args.output_dir, exist_ok=True)
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Training on device: {device}")

    train_loader, val_loader, classes = build_dataloaders(
        args.data_dir, args.batch_size, args.val_split, args.num_workers
    )
    print(f"Train batches: {len(train_loader)}, Val batches: {len(val_loader)}, Classes: {len(classes)}")

    model = build_architecture(pretrained=True).to(device)
    criterion = nn.CrossEntropyLoss(label_smoothing=args.label_smoothing)
    optimizer = torch.optim.SGD(model.parameters(), lr=args.learning_rate, momentum=0.9)
    scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=args.epochs, eta_min=1e-6)

    best_val_loss = float("inf")
    best_path = os.path.join(args.output_dir, "mobilenetv2_plantvillage_best.pth")

    for epoch in range(1, args.epochs + 1):
        t0 = time.time()
        train_loss, train_acc = train_one_epoch(model, train_loader, optimizer, criterion, device)
        val_loss, val_acc = evaluate(model, val_loader, criterion, device)
        elapsed = time.time() - t0

        scheduler.step()
        current_lr = scheduler.get_last_lr()[0]

        print(
            f"Epoch {epoch}/{args.epochs} ({elapsed:.1f}s) | lr={current_lr:.2e} | "
            f"train_loss={train_loss:.4f} train_acc={train_acc:.4f} | "
            f"val_loss={val_loss:.4f} val_acc={val_acc:.4f}"
        )

        if val_loss < best_val_loss:
            best_val_loss = val_loss
            torch.save(model.state_dict(), best_path)
            print(f"  -> saved new best checkpoint (val_loss={val_loss:.4f}) to {best_path}")

    print(f"\nTraining complete. Best checkpoint: {best_path}")
    print("This is the exact path app/services/disease_detection.py loads by default.")


if __name__ == "__main__":
    main()
