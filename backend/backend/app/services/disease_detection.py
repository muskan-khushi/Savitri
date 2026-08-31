"""
disease_detection.py

Inference service for crop disease detection: MobileNetV2 (transfer
learning from ImageNet), fine-tuned on the PlantVillage dataset.

ZERO-MOCK-LOGIC ENFORCEMENT: this module refuses to produce a
prediction if no real trained checkpoint is present. It does NOT fall
back to a randomly-initialized network and dress up its output as a
real disease diagnosis — that would be actively dangerous advice
disguised as a working feature. See ModelNotTrainedError below.

The 38 class labels are the actual PlantVillage folder names (verified
against the dataset's published directory structure, not reconstructed
from memory), covering 14 crop species: Apple, Blueberry, Cherry,
Corn, Grape, Orange, Peach, Pepper (bell), Potato, Raspberry, Soybean,
Squash, Strawberry, Tomato.
"""

from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path

import torch
import torch.nn as nn
from torchvision import models, transforms
from PIL import Image

# Real PlantVillage class labels, in the exact "Species___Condition" folder
# naming used by the dataset (Mohanty et al., spMohanty/PlantVillage-Dataset).
PLANTVILLAGE_CLASSES = [
    "Apple___Apple_scab",
    "Apple___Black_rot",
    "Apple___Cedar_apple_rust",
    "Apple___healthy",
    "Blueberry___healthy",
    "Cherry_(including_sour)___Powdery_mildew",
    "Cherry_(including_sour)___healthy",
    "Corn_(maize)___Cercospora_leaf_spot Gray_leaf_spot",
    "Corn_(maize)___Common_rust_",
    "Corn_(maize)___Northern_Leaf_Blight",
    "Corn_(maize)___healthy",
    "Grape___Black_rot",
    "Grape___Esca_(Black_Measles)",
    "Grape___Leaf_blight_(Isariopsis_Leaf_Spot)",
    "Grape___healthy",
    "Orange___Haunglongbing_(Citrus_greening)",
    "Peach___Bacterial_spot",
    "Peach___healthy",
    "Pepper,_bell___Bacterial_spot",
    "Pepper,_bell___healthy",
    "Potato___Early_blight",
    "Potato___Late_blight",
    "Potato___healthy",
    "Raspberry___healthy",
    "Soybean___healthy",
    "Squash___Powdery_mildew",
    "Strawberry___Leaf_scorch",
    "Strawberry___healthy",
    "Tomato___Bacterial_spot",
    "Tomato___Early_blight",
    "Tomato___Late_blight",
    "Tomato___Leaf_Mold",
    "Tomato___Septoria_leaf_spot",
    "Tomato___Spider_mites Two-spotted_spider_mite",
    "Tomato___Target_Spot",
    "Tomato___Tomato_Yellow_Leaf_Curl_Virus",
    "Tomato___Tomato_mosaic_virus",
    "Tomato___healthy",
]

NUM_CLASSES = len(PLANTVILLAGE_CLASSES)  # 38

DEFAULT_CHECKPOINT_PATH = os.environ.get(
    "DISEASE_MODEL_CHECKPOINT", str(Path(__file__).parent.parent.parent / "ml" / "checkpoints" / "mobilenetv2_plantvillage_best.pth")
)

# Standard ImageNet normalization — required because we're using
# ImageNet-pretrained MobileNetV2 weights as the starting point.
_IMAGENET_MEAN = [0.485, 0.456, 0.406]
_IMAGENET_STD = [0.229, 0.224, 0.225]

_inference_transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(mean=_IMAGENET_MEAN, std=_IMAGENET_STD),
])


class ModelNotTrainedError(RuntimeError):
    """
    Raised when no real trained checkpoint exists. This is intentional
    and load-bearing: it's the mechanism that prevents this service
    from ever returning a prediction from an untrained (random-weight)
    network. See README for how to actually train the model.
    """
    pass


def build_architecture(pretrained: bool = True) -> nn.Module:
    """
    Builds the real MobileNetV2 architecture with a classifier head
    resized for PlantVillage's 38 classes.

    pretrained=True downloads real ImageNet weights from
    download.pytorch.org — this works on a normal internet connection
    but was NOT reachable from the sandboxed environment this file was
    originally developed in (confirmed: 403 from that specific host).
    Set pretrained=False only for structural testing of the network
    shape — never for anything resembling a real prediction.
    """
    weights = models.MobileNet_V2_Weights.IMAGENET1K_V1 if pretrained else None
    model = models.mobilenet_v2(weights=weights)
    # MobileNetV2's classifier is Sequential(Dropout, Linear(1280, 1000));
    # replace the final Linear layer for our 38 classes.
    in_features = model.classifier[1].in_features
    model.classifier[1] = nn.Linear(in_features, NUM_CLASSES)
    return model


@dataclass
class DiseasePrediction:
    predicted_class: str
    crop: str
    condition: str
    is_healthy: bool
    confidence: float
    top5: list[tuple[str, float]]


_loaded_model: nn.Module | None = None
_loaded_checkpoint_path: str | None = None


def _load_model(checkpoint_path: str) -> nn.Module:
    global _loaded_model, _loaded_checkpoint_path

    if not os.path.exists(checkpoint_path):
        raise ModelNotTrainedError(
            f"No trained model checkpoint found at '{checkpoint_path}'. "
            f"This service will not fabricate a prediction from an untrained "
            f"network. Run ml/train_disease_model.py on real PlantVillage data "
            f"first — see ml/README.md."
        )

    if _loaded_model is not None and _loaded_checkpoint_path == checkpoint_path:
        return _loaded_model  # cached

    model = build_architecture(pretrained=False)  # weights overwritten by checkpoint below
    state_dict = torch.load(checkpoint_path, map_location="cpu")
    model.load_state_dict(state_dict)
    model.eval()

    _loaded_model = model
    _loaded_checkpoint_path = checkpoint_path
    return model


def _parse_class_name(class_name: str) -> tuple[str, str, bool]:
    """Split 'Species___Condition' into (species, condition, is_healthy)."""
    species, _, condition = class_name.partition("___")
    is_healthy = condition.lower() == "healthy"
    return species, condition, is_healthy


def predict(image: Image.Image, checkpoint_path: str | None = None) -> DiseasePrediction:
    """
    Run real inference on a PIL image. Raises ModelNotTrainedError if
    no checkpoint exists — this is the expected, correct behavior
    until training has actually been run, not a bug to work around.
    """
    checkpoint_path = checkpoint_path or DEFAULT_CHECKPOINT_PATH
    model = _load_model(checkpoint_path)

    if image.mode != "RGB":
        image = image.convert("RGB")

    tensor = _inference_transform(image).unsqueeze(0)  # add batch dim

    with torch.no_grad():
        logits = model(tensor)
        probs = torch.softmax(logits, dim=1).squeeze(0)

    top5_probs, top5_idx = torch.topk(probs, k=5)
    top5 = [(PLANTVILLAGE_CLASSES[i], float(p)) for i, p in zip(top5_idx.tolist(), top5_probs.tolist())]

    best_class = top5[0][0]
    best_conf = top5[0][1]
    species, condition, is_healthy = _parse_class_name(best_class)

    return DiseasePrediction(
        predicted_class=best_class,
        crop=species,
        condition=condition,
        is_healthy=is_healthy,
        confidence=round(best_conf, 4),
        top5=[(c, round(p, 4)) for c, p in top5],
    )
