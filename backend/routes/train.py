from flask import Blueprint, jsonify, request
from sklearn.metrics import classification_report
from models.model_metadata import ModelMetadata  # Import MongoDB schema
from datetime import datetime, timezone
from data.data_loader import DataLoader
from models.model_trainer import ModelTrainer
from utils.feature_importance import FeatureImportanceAnalyzer
import os
import traceback
import logging
import threading
import uuid

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Dictionary to store the status of background training tasks
training_tasks_status = {}

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

# --- Background Training Task ---
def _run_training_task(task_id: str, selected_features: list):
    """The actual training logic run in a separate thread."""
    global training_tasks_status
    
    current_status = {"status": "STARTING", "message": "Training task initiated."}
    training_tasks_status[task_id] = current_status
    
    try:
        logger.info(f"[Task {task_id}] Starting training with features: {selected_features}")
        
        # Step 0: Generate version name & directory
        start_time = datetime.now(timezone.utc)
        version_name = start_time.strftime("model_%Y%m%d_%H%M%S")
        version_dir = os.path.join('saved_models', version_name)
        os.makedirs(version_dir, exist_ok=True)
        logger.info(f"[Task {task_id}] Created model directory: {version_dir}")
        current_status.update({"status": "SETUP_COMPLETE", "message": f"Directory created: {version_dir}"})
        training_tasks_status[task_id] = current_status

        # --- Data Loading ---
        try:
            current_status.update({"status": "LOADING_DATA", "message": "Loading data from MongoDB..."})
            training_tasks_status[task_id] = current_status
            logger.info(f"[Task {task_id}] Loading data from MongoDB...")
            data_loader = DataLoader()
            data = data_loader.load_data(from_mongodb=True)
            data_size = len(data)
            logger.info(f"[Task {task_id}] Successfully loaded {data_size} records.")
            current_status.update({"message": f"Loaded {data_size} records."})
            training_tasks_status[task_id] = current_status
        except Exception as e:
            logger.error(f"[Task {task_id}] Failed to load data: {str(e)}")
            logger.error(traceback.format_exc())
            raise ValueError(f"Failed to load data: {str(e)}") # Raise to be caught by outer try/except

        # --- Preprocessing ---
        try:
            current_status.update({"status": "PREPROCESSING", "message": "Preprocessing data..."})
            training_tasks_status[task_id] = current_status
            logger.info(f"[Task {task_id}] Preprocessing data...")
            processed_data, target = data_loader.preprocess_data(data, is_training=True, selected_features=selected_features)
            logger.info(f"[Task {task_id}] Data preprocessed. Shape: {processed_data.shape}")
            current_status.update({"message": f"Preprocessing complete. Shape: {processed_data.shape}"})
            training_tasks_status[task_id] = current_status
        except Exception as e:
            logger.error(f"[Task {task_id}] Failed to preprocess data: {str(e)}")
            logger.error(traceback.format_exc())
            raise ValueError(f"Failed to preprocess data: {str(e)}")

        # --- Train/Test Split & Data Saving ---
        try:
            current_status.update({"status": "SPLITTING_DATA", "message": "Splitting data..."})
            training_tasks_status[task_id] = current_status
            logger.info(f"[Task {task_id}] Splitting data...")
            X_train, X_test, y_train, y_test = data_loader.split_data((processed_data, target))
            train_set_size = len(X_train)
            test_set_size = len(X_test)
            logger.info(f"[Task {task_id}] Train shape: {X_train.shape}, Test shape: {X_test.shape}")
            current_status.update({"message": f"Data split complete. Train: {X_train.shape}, Test: {X_test.shape}"})
            training_tasks_status[task_id] = current_status

            # --- Save Training/Testing Data --- 
            try:
                current_status.update({"status": "SAVING_DATA", "message": f"Saving training/testing data to {version_dir}..."})
                training_tasks_status[task_id] = current_status
                logger.info(f"[Task {task_id}] Saving training and testing data to {version_dir}...")
                X_train.to_csv(os.path.join(version_dir, 'X_train.csv'), index=False)
                X_test.to_csv(os.path.join(version_dir, 'X_test.csv'), index=False)
                y_train.to_csv(os.path.join(version_dir, 'y_train.csv'), index=False)
                y_test.to_csv(os.path.join(version_dir, 'y_test.csv'), index=False)
                saved_data_files = ['X_train.csv', 'X_test.csv', 'y_train.csv', 'y_test.csv']
                logger.info(f"[Task {task_id}] Successfully saved training/testing data files.")
                current_status.update({"message": "Training/testing data files saved."})
                training_tasks_status[task_id] = current_status
            except Exception as data_save_error:
                logger.warning(f"[Task {task_id}] Could not save training/testing data files: {str(data_save_error)}")
                saved_data_files = [] # Indicate data was not saved
                current_status.update({"warning": f"Could not save data files: {data_save_error}"})
                training_tasks_status[task_id] = current_status # Update status even with warning
            # --- End Save Data ---

        except Exception as e:
            logger.error(f"[Task {task_id}] Failed to split data or save data files: {str(e)}")
            logger.error(traceback.format_exc())
            raise ValueError(f"Failed to split or save data: {str(e)}")

        # --- Model Training & Evaluation ---
        try:
            current_status.update({"status": "TRAINING_MODEL", "message": "Training model..."})
            training_tasks_status[task_id] = current_status
            logger.info(f"[Task {task_id}] Training model...")
            trainer = ModelTrainer(random_state=42)
            trainer.scaler = data_loader.scaler # Pass the scaler used during preprocessing
            best_model, best_params = trainer.train_xgboost(X_train, y_train)
            
            current_status.update({"status": "EVALUATING_MODEL", "message": "Evaluating model..."})
            training_tasks_status[task_id] = current_status
            logger.info(f"[Task {task_id}] Evaluating model...")
            y_pred = best_model.predict(X_test)
            metrics = trainer.evaluate_model(best_model, X_test, y_test, version_dir)
            
            current_status.update({"status": "SAVING_MODEL", "message": "Saving model..."})
            training_tasks_status[task_id] = current_status
            trainer.save_model(os.path.join(version_dir, 'best_xgboost_model.pkl'))
            logger.info(f"[Task {task_id}] Model training, evaluation, and saving completed.")
            current_status.update({"message": "Model training, evaluation, and saving completed."})
            training_tasks_status[task_id] = current_status
        except Exception as e:
            logger.error(f"[Task {task_id}] Failed during model training or evaluation: {str(e)}")
            logger.error(traceback.format_exc())
            raise ValueError(f"Failed during training/evaluation: {str(e)}")

        # --- Feature Importance & Metadata Saving ---
        try:
            current_status.update({"status": "ANALYZING_FEATURES", "message": "Analyzing feature importance..."})
            training_tasks_status[task_id] = current_status
            logger.info(f"[Task {task_id}] Analyzing feature importance...")
            analyzer = FeatureImportanceAnalyzer(best_model, X_train.columns)
            feature_importance = analyzer.analyze_importance(save_dir=version_dir)
            analyzer.plot_feature_correlation(X_train, save_dir=version_dir)
            
            feature_importance_list = []
            if feature_importance is not None and not feature_importance.empty:
                feature_importance_list = feature_importance.head(10).to_dict(orient='records')
            
            end_time = datetime.now(timezone.utc)
            training_duration = str(end_time - start_time)
            class_report_dict = classification_report(y_test, y_pred, output_dict=True)
            
            safe_metrics = {k: float(v) if isinstance(v, (int, float)) else 0.0 for k, v in metrics.items()}
            
            current_status.update({"status": "SAVING_METADATA", "message": "Saving model metadata..."})
            training_tasks_status[task_id] = current_status
            logger.info(f"[Task {task_id}] Saving model metadata...")
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
                trained_by="background_task", # Indicate it was run by the background task
                training_duration=training_duration,
                data_size=data_size,
                train_set_size=train_set_size,
                test_set_size=test_set_size,
                selected_features=selected_features,
                saved_data_files=saved_data_files
            )
            metadata.save()
            logger.info(f"[Task {task_id}] Metadata saved successfully.")
            
            # --- Task Completion ---
            final_status = {
                "status": "COMPLETED",
                "message": "Model training completed successfully.",
                "version": version_name,
                "metrics": safe_metrics,
                "classification_report": class_report_dict,
                "top_features": feature_importance_list,
                "training_duration": training_duration,
            }
            training_tasks_status[task_id] = final_status
            logger.info(f"[Task {task_id}] Training task completed successfully.")

        except Exception as e:
            logger.error(f"[Task {task_id}] Failed during feature analysis or metadata saving: {str(e)}")
            logger.error(traceback.format_exc())
            raise ValueError(f"Failed during analysis/metadata saving: {str(e)}")

    except Exception as e:
        # --- Task Failure ---
        error_message = f"Training task failed: {str(e)}"
        logger.error(f"[Task {task_id}] {error_message}")
        logger.error(traceback.format_exc())
        training_tasks_status[task_id] = {
            "status": "FAILED",
            "error": error_message,
            "details": traceback.format_exc() # Include traceback for debugging if needed
        }

# --- API Routes ---

@train_bp.route('/api/train', methods=['POST'])
def train_model():
    """Initiates the model training process in the background."""
    global training_tasks_status
    try:
        data = request.get_json()
        selected_features = data.get("selected_features", None)
        
        if not selected_features:
            logger.warning("Training request received without selected features.")
            return jsonify({"error": "❌ No selected features provided"}), 400

        # Generate a unique task ID
        task_id = str(uuid.uuid4())
        logger.info(f"Received training request. Assigning Task ID: {task_id}")

        # Initial status
        training_tasks_status[task_id] = {"status": "QUEUED", "message": "Training task is queued."}

        # Start the background thread
        thread = threading.Thread(target=_run_training_task, args=(task_id, selected_features))
        thread.daemon = True  # Allows the main application to exit even if threads are running
        thread.start()

        logger.info(f"Started background training thread for Task ID: {task_id}")

        # Return acceptance and task ID
        return jsonify({
            "message": "✅ Training initiated. Check status using the task ID.",
            "task_id": task_id 
        }), 202 # HTTP 202 Accepted

    except Exception as e:
        logger.error(f"Error initiating training task: {str(e)}")
        logger.error(traceback.format_exc())
        return jsonify({
            "error": "❌ Failed to initiate training task",
            "details": str(e)
        }), 500

@train_bp.route('/api/train/status/<task_id>', methods=['GET'])
def get_training_status(task_id):
    """Gets the status of a background training task."""
    global training_tasks_status
    
    status_info = training_tasks_status.get(task_id)
    
    if status_info:
        logger.debug(f"Status requested for Task ID: {task_id}. Current status: {status_info.get('status')}")
        return jsonify(status_info), 200
    else:
        logger.warning(f"Status requested for unknown Task ID: {task_id}")
        return jsonify({"error": "❌ Training task not found"}), 404
