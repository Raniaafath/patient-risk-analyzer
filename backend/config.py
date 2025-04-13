import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    MONGODB_SETTINGS = {
        "db": "medical_data",
        "host": os.environ.get("MONGODB_URI", "mongodb://mongodb:27017/medical_data"),
        "connect": True,
        "retryWrites": True,
        "w": "majority",
        "alias": "default"
    }

   # MODEL_PATH = "models/stroke_los_model.pkl"
    #SCALER_PATH = "models/stroke_scaler.pkl"
   # ENCODER_PATH = "models/stroke_encoders.pkl"
