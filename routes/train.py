from flask import Blueprint, jsonify, request
from sklearn.metrics import classification_report
from src.models.model_metadata import ModelMetadata  # Import MongoDB schema
from datetime import datetime, timezone
import pandas as pd
from src.data.data_loader import DataLoader
from src.models.model_trainer import ModelTrainer
from src.utils.feature_importance import FeatureImportanceAnalyzer
import os
import traceback
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

train_bp = Blueprint('train', __name__)

@train_bp.route('/api/models/versions', methods=['GET'])
def list_versions():
    try:
        # Fetch all models metadata from MongoDB
        models = ModelMetadata.objects.all()  # This gets all documents in ModelMetadata collection
        
        # Prepare a list of model version summaries with extra details
        version_list = []
        for model in models:
            version_list.append({
                "version": model.version,
                "trained_on": model.trained_on,
                "metrics": {
                    "accuracy": model.metrics.get('accuracy', 'N/A'),
                    "f1": model.metrics.get('f1', 'N/A')
                },
                "saved_to": model.saved_to,
                "classification_report": model.classification_report,  # Add the classification report
                "top_features": model.top_features,  # Add top features
                "data_size": model.data_size,  # Add data size used for training
                "training_duration": model.training_duration,  # Add training duration
                "selected_features": model.selected_features  # Add selected features used for training
            })
        
        return jsonify({"models": version_list}), 200
    
    except Exception as e:
        return jsonify({"error": f"❌ Error: {str(e)}"}), 500

@train_bp.route('/api/train', methods=['POST'])
def train_model():
    try:
        # Get the selected features from the request data
        data = request.get_json()
        selected_features = data.get("selected_features", None)
        
        logger.info(f"Received training request with features: {selected_features}")
        
        if not selected_features:
            return jsonify({"error": "❌ No selected features provided"}), 400

        # Step 0: Generate version name & directory
        start_time = datetime.now(timezone.utc)
        version_name = start_time.strftime("model_%Y%m%d_%H%M%S")
        version_dir = os.path.join('saved_models', version_name)
        os.makedirs(version_dir, exist_ok=True)
        
        logger.info(f"Created model directory: {version_dir}")

        try:
            # Step 1: Load raw data
            logger.info("Loading data from MongoDB...")
            data_loader = DataLoader()
            data = data_loader.load_data(from_mongodb=True)
            data_size = len(data)
            logger.info(f"Successfully loaded {data_size} records from MongoDB")
        except Exception as e:
            logger.error(f"Failed to load data: {str(e)}")
            logger.error(traceback.format_exc())
            return jsonify({
                "error": "❌ Failed to load data from MongoDB",
                "details": str(e)
            }), 500

        try:
            # Step 2: Preprocess data with the selected features
            logger.info("Preprocessing data...")
            processed_data, target = data_loader.preprocess_data(data, is_training=True, selected_features=selected_features)
            logger.info(f"Data preprocessed. Shape: {processed_data.shape}")
        except Exception as e:
            logger.error(f"Failed to preprocess data: {str(e)}")
            logger.error(traceback.format_exc())
            return jsonify({
                "error": "❌ Failed to preprocess data",
                "details": str(e)
            }), 500

        try:
            # Step 3: Train/test split
            logger.info("Splitting data...")
            X_train, X_test, y_train, y_test = data_loader.split_data((processed_data, target))
            train_set_size = len(X_train)
            test_set_size = len(X_test)
            logger.info(f"Training set shape: {X_train.shape}, Test set shape: {X_test.shape}")

            # --- Save Training/Testing Data --- 
            try:
                logger.info(f"Saving training and testing data to {version_dir}...")
                X_train.to_csv(os.path.join(version_dir, 'X_train.csv'), index=False)
                X_test.to_csv(os.path.join(version_dir, 'X_test.csv'), index=False)
                y_train.to_csv(os.path.join(version_dir, 'y_train.csv'), index=False)
                y_test.to_csv(os.path.join(version_dir, 'y_test.csv'), index=False)
                saved_data_files = ['X_train.csv', 'X_test.csv', 'y_train.csv', 'y_test.csv']
                logger.info("Successfully saved training/testing data files.")
            except Exception as data_save_error:
                logger.warning(f"Could not save training/testing data files: {str(data_save_error)}")
                saved_data_files = [] # Indicate data was not saved
            # --- End Save Data ---

        except Exception as e:
            logger.error(f"Failed to split data or save data files: {str(e)}") # Updated error message
            logger.error(traceback.format_exc())
            return jsonify({
                "error": "❌ Failed to split data or save data files",
                "details": str(e)
            }), 500

        try:
            # Step 4: Train model and evaluate
            logger.info("Training model...")
            trainer = ModelTrainer(random_state=42)
            trainer.scaler = data_loader.scaler
            best_model, best_params = trainer.train_xgboost(X_train, y_train)
            
            # Evaluate model
            y_pred = best_model.predict(X_test)
            metrics = trainer.evaluate_model(best_model, X_test, y_test, version_dir)
            
            # Save model
            trainer.save_model(os.path.join(version_dir, 'best_xgboost_model.pkl'))
            logger.info("Model training and evaluation completed")
        except Exception as e:
            logger.error(f"Failed during model training or evaluation: {str(e)}")
            logger.error(traceback.format_exc())
            return jsonify({
                "error": "❌ Failed during model training or evaluation",
                "details": str(e)
            }), 500

        try:
            # Step 5: Feature importance analysis
            analyzer = FeatureImportanceAnalyzer(best_model, X_train.columns)
            feature_importance = analyzer.analyze_importance(save_dir=version_dir)
            analyzer.plot_feature_correlation(X_train, save_dir=version_dir)
            
            # Ensure feature importance is not None and has data
            feature_importance_list = []
            if feature_importance is not None and not feature_importance.empty:
                feature_importance_list = feature_importance.head(10).to_dict(orient='records')
            
            # Calculate training duration
            end_time = datetime.now(timezone.utc)
            training_duration = str(end_time - start_time)
            
            # Prepare classification report with safe values
            class_report_dict = classification_report(y_test, y_pred, output_dict=True)
            
            # Ensure metrics are safe numbers
            safe_metrics = {}
            for k, v in metrics.items():
                if isinstance(v, (int, float)):
                    safe_metrics[k] = float(v)
                else:
                    safe_metrics[k] = 0.0
            
            # Save metadata
            metadata = ModelMetadata(
                version=version_name,
                saved_to=version_dir,
                best_params=best_params or {},
                metrics=safe_metrics,
                classification_report=class_report_dict,
                top_features=feature_importance_list,
                data_date=datetime.now(timezone.utc).date(),
                trained_on=datetime.now(timezone.utc),
                trained_on_date=datetime.now(timezone.utc).date(),
                trained_by="admin",
                training_duration=training_duration,
                data_size=data_size, # Total records loaded
                train_set_size=train_set_size, # Records in training set
                test_set_size=test_set_size,  # Records in test set
                selected_features=selected_features,
                saved_data_files=saved_data_files # Add list of saved data files
            )
            metadata.save()
            
            # Return success response with safe values
            return jsonify({
                "message": "✅ Model trained and versioned successfully",
                "version": version_name,
                "saved_to": version_dir,
                "best_params": best_params or {},
                "metrics": safe_metrics,
                "classification_report": class_report_dict,
                "top_features": feature_importance_list,
                "training_duration": training_duration,
                "data_size": data_size,
                "train_set_size": train_set_size,
                "test_set_size": test_set_size,
                "selected_features": selected_features
            }), 200
            
        except Exception as e:
            logger.error(f"Failed during feature analysis or metadata saving: {str(e)}")
            logger.error(traceback.format_exc())
            return jsonify({
                "error": "❌ Failed during feature analysis or metadata saving",
                "details": str(e)
            }), 500

    except Exception as e:
        logger.error(f"Unexpected error in train_model: {str(e)}")
        logger.error(traceback.format_exc())
        return jsonify({
            "error": "❌ Unexpected error during model training",
            "details": str(e)
        }), 500
