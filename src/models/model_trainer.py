import xgboost as xgb
from sklearn.model_selection import RandomizedSearchCV
from sklearn.metrics import accuracy_score, recall_score, f1_score, confusion_matrix, classification_report, log_loss
import joblib
import matplotlib
matplotlib.use('Agg')  # 👈 Add this line before importing pyplot
import matplotlib.pyplot as plt
import seaborn as sns
import pandas as pd
import numpy as np
import os

class ModelTrainer:
    def __init__(self, random_state=42):
        self.random_state = random_state
        self.best_model = None
        self.best_params = None
        self.scaler = None
        self.feature_names = None  # <-- Added to track features explicitly

    def train_xgboost(self, X_train, y_train):
        """Train XGBoost model with hyperparameter tuning"""
        try:
            # Print class distribution
            print("\nTraining Data Class Distribution:")
            print(y_train.value_counts(normalize=True).sort_index())

            # Calculate class weights
            class_weights = {}
            total_samples = len(y_train)
            for cls in sorted(set(y_train)):
                class_weights[cls] = total_samples / (len(set(y_train)) * (y_train == cls).sum())
            
            # Create sample weights
            sample_weights = np.array([class_weights[cls] for cls in y_train])

            param_dist = {
                'max_depth': [2, 3, 4],
                'learning_rate': [0.01, 0.05, 0.1,0.2],
                'n_estimators': [100, 200, 300,400,500],
                'min_child_weight': [1, 2, 3],
                'gamma': [0, 0.1, 0.2],
                'subsample': [0.6, 0.7, 0.8],
                'colsample_bytree': [0.6, 0.7, 0.8]
            }

            xgb_base = xgb.XGBClassifier(
                booster='gbtree',
                objective='multi:softmax',
                num_class=3,
                random_state=self.random_state,
                n_jobs=1,
                reg_alpha=0.1,
                reg_lambda=0.1
            )

            random_search = RandomizedSearchCV(
                estimator=xgb_base,
                param_distributions=param_dist,
                n_iter=20,
                scoring='f1_weighted',
                cv=5,
                n_jobs=1,
                verbose=1,
                random_state=self.random_state
            )

            print("Starting Random Search for XGBoost...")
            random_search.fit(X_train, y_train, sample_weight=sample_weights)

            self.best_model = random_search.best_estimator_
            self.best_params = random_search.best_params_
            self.feature_names = X_train.columns.tolist()

            return self.best_model, self.best_params
        except Exception as e:
            print(f"Error in XGBoost training: {str(e)}")
            raise

    def evaluate_model(self, model, X_test, y_test, version_dir=None):
        """Evaluate model performance with more metrics"""
        try:
            y_pred = model.predict(X_test)
            y_proba = model.predict_proba(X_test)

            # Print class distribution in predictions
            print("\nPredicted Class Distribution:")
            print(pd.Series(y_pred).value_counts(normalize=True).sort_index())

            # Basic metrics
            accuracy = accuracy_score(y_test, y_pred)
            recall = recall_score(y_test, y_pred, average='weighted')
            f1 = f1_score(y_test, y_pred, average='weighted')
            log_loss_score = log_loss(y_test, y_proba, labels=[0, 1, 2])

            # Class-wise metrics
            class_report = classification_report(
                y_test, 
                y_pred, 
                labels=[0, 1, 2],
                target_names=['Short', 'Medium', 'Long']
            )

            print("\nDetailed Performance Metrics:")
            print(f"Accuracy: {accuracy:.4f}")
            print(f"F1 Score: {f1:.4f}")
            print(f"Log Loss: {log_loss_score:.4f}")
            print("\nClassification Report:")
            print(class_report)
            
            self._plot_performance(accuracy, recall, f1, version_dir)
            self._plot_confusion_matrix(y_test, y_pred, version_dir)

            return {
                'accuracy': accuracy,
                'recall': recall,
                'f1': f1,
                'log_loss': log_loss_score,
                'class_report': class_report
            }
        except Exception as e:
            print(f"Error in model evaluation: {str(e)}")
            raise

    def _plot_performance(self, accuracy, recall, f1, save_dir=None):
        metrics = {
            'Accuracy': accuracy,
            'Recall': recall,
            'F1 Score': f1
        }

        plt.figure(figsize=(8, 6))
        plt.bar(metrics.keys(), metrics.values(), color=['#2ecc71', '#3498db', '#e74c3c'])
        plt.title('Model Performance Metrics')
        plt.ylabel('Score')
        plt.ylim(0, 1)
        plt.xticks(rotation=45)
        plt.tight_layout()
        if save_dir:
            os.makedirs(save_dir, exist_ok=True)
            plt.savefig(os.path.join(save_dir, 'performance.png'))
        plt.close()

    def _plot_confusion_matrix(self, y_true, y_pred,save_dir=None):
        cm = confusion_matrix(y_true, y_pred)
        plt.figure(figsize=(8, 6))
        sns.heatmap(cm, annot=True, fmt='d', cmap='Blues')
        plt.title('Confusion Matrix')
        plt.xlabel('Predicted')
        plt.ylabel('Actual')
        if save_dir:
            os.makedirs(save_dir, exist_ok=True)
            plt.savefig(os.path.join(save_dir, 'confusion_matrix.png'))
        plt.close()

    def save_model(self, model_path):
        """Save the trained model, scaler, and feature names."""
        try:
            os.makedirs(os.path.dirname(model_path), exist_ok=True)

            model_data = {
                'model': self.best_model,
                'scaler': self.scaler,
                'feature_names': self.feature_names,
                'best_params': self.best_params
            }

            joblib.dump(model_data, model_path)
            print(f"✅ Model saved to {model_path}")

        except Exception as e:
            print(f"❌ Error saving model: {str(e)}")
            raise

    def load_model(self, model_path):
        """Load the trained model and its metadata"""
        try:
            model_data = joblib.load(model_path)
            self.best_model = model_data['model']
            self.scaler = model_data['scaler']
            self.feature_names = model_data['feature_names']
            self.best_params = model_data['best_params']
            print(f"✅ Model, scaler, and parameters loaded from {model_path}")
            return self.best_model, self.scaler, self.best_params
        except Exception as e:
            print(f"❌ Error loading model: {str(e)}")
            raise
