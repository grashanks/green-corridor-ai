# GreenCorridor AI - Datasets & Pretrained Models

## 1. Supported Classes
The computer vision detection pipeline recognizes key roadway classes:
- **Ambulance** (Class: Emergency Vehicle - triggers priority candidate workflow)
- **Fire Engine** (Class: Emergency Vehicle)
- **Passenger Car** (Class: Standard Traffic)
- **Bus** (Class: Standard Transit)
- **Motorcycle** (Class: Two-Wheeler)
- **Truck** (Class: Heavy Vehicle)

## 2. Model Configuration
- Default model: `yolov8n.pt` (Ultralytics Nano Model).
- Fine-tuned emergency vehicle models: Point `YOLO_MODEL_PATH` in `.env` to any custom `.pt` weights file trained on emergency vehicle datasets (such as Roboflow Emergency Vehicles or Kaggle Emergency vs Non-Emergency).
- **Safety Policy**: Visual detection remains advisory and requires operator confirmation before preempting active signals.
