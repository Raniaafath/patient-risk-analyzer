from flask import Blueprint, request, jsonify
import numpy as np
from utils import preprocess_input, explain_prediction, set_model
from models.model_metadata import ModelMetadata
import os
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

predict_bp = Blueprint("predict", __name__)

def convert_to_serializable(obj):
    """Convert numpy types to Python native types for JSON serialization."""
    if isinstance(obj, np.integer):
        return int(obj)
    elif isinstance(obj, np.floating):
        return float(obj)
    elif isinstance(obj, np.ndarray):
        return obj.tolist()
    elif isinstance(obj, dict):
        return {key: convert_to_serializable(value) for key, value in obj.items()}
    elif isinstance(obj, list):
        return [convert_to_serializable(item) for item in obj]
    return obj

@predict_bp.route('/api/predict/<version>', methods=['POST'])
def predict(version):
    """Make a prediction for a single patient."""
    try:
        logger.info(f"🔄 Received prediction request for model version: {version}")
        
        # Validate request data
        data = request.get_json()
        if not data:
            return jsonify({"error": "No patient data provided"}), 400
            
        logger.info(f"📥 Input data: {data}")

        # Step 1: Fetch model metadata
        model_metadata = ModelMetadata.objects(version=version).first()
        if not model_metadata:
            return jsonify({"error": f"Model version {version} not found"}), 404
            
        logger.info(f"✅ Found model metadata for version {version}")

        # Step 2: Load model
        model_path = os.path.join(model_metadata.saved_to, 'best_xgboost_model.pkl')
        if not os.path.exists(model_path):
            return jsonify({"error": f"Model file not found at {model_path}"}), 404
            
        # Load and verify model
        try:
            from utils import set_model, get_model
            model = set_model(model_path)
            
            # Double check the model is loaded and usable
            if model is None or not hasattr(model, 'predict'):
                logger.error("❌ Model initialization failed - model is None or invalid")
                return jsonify({"error": "Failed to initialize model properly"}), 500
                
            logger.info("✅ Model loaded and verified successfully")
        except Exception as e:
            logger.error(f"❌ Error loading model: {str(e)}")
            return jsonify({"error": f"Failed to load model: {str(e)}"}), 500

        # Step 3: Get selected features
        selected_features = model_metadata.selected_features
        if not selected_features:
            return jsonify({"error": "No features found for this model"}), 500
            
        logger.info(f"📋 Using features: {selected_features}")

        # Step 4: Preprocess input
        try:
            processed_data = preprocess_input(data, selected_features=selected_features)
            logger.info("✅ Data preprocessed successfully")
        except ValueError as e:
            logger.error(f"❌ Validation error: {str(e)}")
            return jsonify({"error": str(e)}), 400
        except Exception as e:
            logger.error(f"❌ Preprocessing error: {str(e)}")
            return jsonify({"error": f"Error preprocessing data: {str(e)}"}), 500

        # Step 5: Make prediction
        try:
            model = get_model()
            if model is None:
                logger.error("❌ Model not found - was it unloaded?")
                return jsonify({"error": "Model not available"}), 500
                
            prediction = model.predict(processed_data)
            probabilities = model.predict_proba(processed_data)
            logger.info(f"✅ Prediction generated: {prediction[0]}")
        except Exception as e:
            logger.error(f"❌ Prediction error: {str(e)}")
            return jsonify({"error": f"Error making prediction: {str(e)}"}), 500

        # Step 6: Generate explanation for the predicted class
        try:
            explanation = explain_prediction(processed_data, predicted_class=int(prediction[0]))
            logger.info("✅ Explanation generated")
        except Exception as e:
            logger.error(f"❌ Explanation error: {str(e)}")
            explanation = {
                "error": str(e),
                "feature_importance": {},
                "shap_values": []
            }

        # Map prediction class to label
        class_labels = {
            0: "LOS Class 0",  # Short stay
            1: "LOS Class 1",  # Medium stay
            2: "LOS Class 2"   # Long stay
        }

        # Prepare response
        result = {
            "prediction": {
                "class": int(prediction[0]),
                "class_label": class_labels[int(prediction[0])],
                "probabilities": convert_to_serializable(probabilities[0].tolist()),
            },
            "features_used": selected_features,
            "explanation": explanation,
            "model_version": version
        }

        logger.info("✅ Request completed successfully")
        return jsonify(result)

    except Exception as e:
        logger.error(f"❌ Unexpected error: {str(e)}")
        return jsonify({"error": f"Unexpected error: {str(e)}"}), 500

