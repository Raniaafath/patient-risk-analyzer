import joblib
import pandas as pd
import numpy as np
from config import Config
import os
import shap
from models import Patient


# Initialize global variables
model = None
scaler = None
feature_names = None
REQUIRED_FEATURES = []
explainer = None

def load_model_data(model_path):
    """Load model data from the specified path."""
    try:
        print(f"🔄 Loading model from {model_path}")
        if not os.path.exists(model_path):
            raise FileNotFoundError(f"Model file not found at {model_path}")
            
        model_data = joblib.load(model_path)
        
        # Extract components with validation
        if not isinstance(model_data, dict):
            raise ValueError("Invalid model data format")
            
        model = model_data.get('model')
        scaler = model_data.get('scaler')
        feature_names = model_data.get('feature_names')
        
        if model is None or feature_names is None:
            raise ValueError("Missing required model components")
            
        print("✅ Model loaded successfully")
        print(f"📊 Model features: {feature_names}")
        return model, scaler, feature_names
    except Exception as e:
        print(f"❌ Error loading model: {str(e)}")
        raise

def set_model(model_path):
    """Set the global model variables."""
    global model, scaler, feature_names, REQUIRED_FEATURES, explainer
    
    try:
        print(f"🔄 Setting up model from {model_path}")
        model, scaler, feature_names = load_model_data(model_path)
        REQUIRED_FEATURES = feature_names
        
        if hasattr(model, 'predict_proba'):
            explainer = shap.TreeExplainer(model)
            print("✅ SHAP explainer initialized")
        else:
            print("⚠️ Model doesn't support probability predictions")
            
        print(f"✅ Model setup complete")
        print(f"📋 Required features: {REQUIRED_FEATURES}")
        return True
    except Exception as e:
        print(f"❌ Error setting up model: {str(e)}")
        raise

def preprocess_input(data, selected_features=None):
    """Preprocess input data for prediction with validation."""
    try:
        if not REQUIRED_FEATURES:
            raise ValueError("Model not initialized. Call set_model first.")
            
        print("🔄 Preprocessing input data")
        print(f"📥 Input data: {data}")
        
        # Convert input data to DataFrame
        df = pd.DataFrame([data])
        
        # Use selected features or all required features
        features_to_use = selected_features if selected_features else REQUIRED_FEATURES
        features_to_use = [f for f in features_to_use if f in REQUIRED_FEATURES]
        
        if not features_to_use:
            raise ValueError("No valid features found for prediction")
            
        print(f"🎯 Using features: {features_to_use}")
        
        # Validate feature presence
        missing_features = [f for f in features_to_use if f not in df.columns]
        if missing_features:
            raise ValueError(f"Missing required features: {missing_features}")
            
        # Select and order features
        df = df[features_to_use]
        
        # Validation rules
        validation_rules = {
            'Body_Mass_Index': {'min': 15, 'max': 40},
            'age': {'min': 1, 'max': 199},
            'Mrs_admission': {'min': 0, 'max': 5},
            'NIHSS_admission': {'min': 0, 'max': 42},
            'Gender': {'values': ['Male', 'Female', 1, 2]},
        }
        
        # Validate values
        for feature, rules in validation_rules.items():
            if feature in df.columns:
                value = df[feature].iloc[0]
                if 'min' in rules and 'max' in rules:
                    if not (rules['min'] <= float(value) <= rules['max']):
                        raise ValueError(f"{feature} must be between {rules['min']} and {rules['max']}")
                elif 'values' in rules and str(value) not in [str(v) for v in rules['values']]:
                    raise ValueError(f"{feature} must be one of {rules['values']}")
        
        # Convert categorical features
        if 'Gender' in df.columns:
            df['Gender'] = df['Gender'].map({'Male': 1, 'Female': 0, '1': 1, '0': 0, 1: 1, 0: 0})
        
        # Convert to float
        df = df.astype(float)
        
        # Scale if scaler exists
        if scaler is not None:
            print("📊 Scaling features...")
            print("Before scaling:", df.iloc[0].to_dict())
            df = pd.DataFrame(scaler.transform(df), columns=df.columns)
            print("After scaling:", df.iloc[0].to_dict())
        
        print("✅ Preprocessing complete")
        return df
        
    except Exception as e:
        print(f"❌ Preprocessing error: {str(e)}")
        raise

def explain_prediction(processed_df):
    """Generate SHAP explanation for the prediction."""
    try:
        if explainer is None:
            raise ValueError("SHAP explainer not initialized")
            
        print("🔄 Generating prediction explanation")
        
        # Get SHAP values
        shap_values = explainer.shap_values(processed_df)
        
        # Handle multiple outputs (e.g., for multi-class problems)
        if isinstance(shap_values, list):
            shap_values = shap_values[0]
        
        # Calculate feature importance
        feature_importance = {}
        for i, feature in enumerate(processed_df.columns):
            importance = abs(shap_values[0][i])
            feature_importance[feature] = float(importance)
        
        # Sort by importance
        sorted_importance = dict(sorted(
            feature_importance.items(),
            key=lambda x: x[1],
            reverse=True
        ))
        
        explanation = {
            "feature_importance": sorted_importance,
            "shap_values": shap_values.tolist(),
            "features": processed_df.columns.tolist()
        }
        
        print("✅ Explanation generated")
        return explanation
        
    except Exception as e:
        print(f"❌ Error generating explanation: {str(e)}")
        return {
            "feature_importance": {},
            "shap_values": [],
            "features": [],
            "error": str(e)
        }
