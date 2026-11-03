"""
GreenCorridor AI - Module 5: AI Model Configuration
Configures YOLO and computer vision detection parameters, class mappings,
and human-in-the-loop verification policies.
"""

import os

# Standard COCO classes relevant to traffic
VEHICLE_CLASSES = {
    2: "car",
    3: "motorcycle",
    5: "bus",
    7: "truck",
}

# Special classification / heuristics for emergency vehicles
# In standard COCO, ambulances are often classified as truck or car.
# When a custom fine-tuned weights file is supplied, custom class IDs are used.
CONFIDENCE_THRESHOLD = 0.40
IOU_THRESHOLD = 0.45
MODEL_PATH = os.getenv("YOLO_MODEL_PATH", "yolov8n.pt")

# Operator confirmation policy
REQUIRE_OPERATOR_CONFIRMATION = True
SAFETY_NOTICE = (
    "AI Vision Detection is advisory. In compliance with GreenCorridor AI safety protocols, "
    "detected emergency vehicles require traffic operator confirmation before preempting signals."
)
