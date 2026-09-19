# Disease Detection Model Training

Real transfer-learning pipeline: ImageNet-pretrained MobileNetV2, fine-tuned
on the PlantVillage dataset (38 classes, 14 crop species).

## Why this can't be trained inside the build sandbox

Training requires two things this sandbox's network allowlist blocks:
- `download.pytorch.org` — for the pretrained ImageNet weights (confirmed
  403 on direct attempt)
- Kaggle / GitHub release assets — for the PlantVillage dataset itself

Both work normally on your machine or Colab/Kaggle. Everything up to
those network calls was verified structurally in this sandbox (dataset
loading, augmentation, train/val split, the training loop, checkpoint
saving) using a synthetic 3-class dataset and random-init weights —
never shipped, purely to prove the code path executes.

## Steps to actually train

1. **Get the dataset.** Either:
   - Kaggle: https://www.kaggle.com/datasets/abdallahalidev/plantvillage-dataset
   - Original source: https://github.com/spMohanty/PlantVillage-Dataset

2. **Point at the `color` subfolder** — it's already in ImageFolder
   format (one directory per class):
   ```
   plantvillage/color/Apple___Apple_scab/*.jpg
   plantvillage/color/Apple___Black_rot/*.jpg
   ...
   ```

3. **Run training:**
   ```bash
   cd backend
   source venv/bin/activate
   python3 ml/train_disease_model.py --data-dir /path/to/plantvillage/color --epochs 10
   ```

4. **Output:** best checkpoint (lowest validation loss) saved to
   `ml/checkpoints/mobilenetv2_plantvillage_best.pth` — this is the
   exact path `app/services/disease_detection.py` loads by default.
   No config changes needed after training finishes.

## What to expect

Published results fine-tuning similarly lightweight CNNs (MobileNetV3,
ShuffleNet, EfficientNetB0) on this exact dataset report 98-99%+
validation accuracy within ~10 epochs (Rath, 2023, debuggercafe.com) —
cited here as a sanity check for your own run, not a guarantee. Real
compute time: roughly 1-2 hours on a single consumer GPU for the full
~54k images at 10 epochs; CPU-only will be considerably slower.

**If the script warns about class name/order mismatch**: your
dataset's folder names don't exactly match `PLANTVILLAGE_CLASSES` in
`app/services/disease_detection.py`. Training will still work (it uses
the dataset's own class order), but you must update that list to match
before deploying the checkpoint, or the inference API will attach the
wrong disease names to the right predictions — silently, which is
exactly the kind of failure the zero-mock-logic policy exists to catch.
Check this before trusting a trained checkpoint in production.

## Known simplifications

- **Fixed epoch count, no early stopping** beyond "save if val_loss
  improved." Fine for a first pass; add early stopping / LR scheduling
  if 10 epochs isn't enough on your data.
- **No k-fold cross-validation** — single random 85/15 train/val split
  (seeded for reproducibility). Standard practice for a dataset this
  size, but worth knowing.
- **PlantVillage images are lab-condition photos** (clean background,
  controlled lighting) — a model trained only on this dataset will
  likely perform worse on real farmer phone photos with messy
  backgrounds and variable lighting than the validation accuracy
  suggests. This is a documented, known limitation of the dataset
  itself, not something this training script can fix. Worth planning
  for: field-condition fine-tuning data, or blending in a
  field-conditions dataset like PlantDoc, before trusting this for
  real farmer photos.
