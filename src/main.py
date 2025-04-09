import os
from data.data_loader import DataLoader
from models.model_trainer import ModelTrainer
from utils.feature_importance import FeatureImportanceAnalyzer

def main():
    print("🧪 Starting local model training (debug/dev mode)...")
    # Define paths
    model_path = os.path.join('saved_models', 'best_xgboost_model.pkl')
    preprocessor_path = os.path.join('saved_models', 'preprocessor.pkl')
    scaler_path = os.path.join('saved_models', 'scaler.pkl')
    
    # Initialize data loader
    data_loader = DataLoader()  # data_path is not needed anymore as we're loading from MongoDB
    
    # Load and preprocess data from MongoDB
    data = data_loader.load_data(from_mongodb=True)
    processed_data = data_loader.preprocess_data(data, is_training=True)  # Set is_training=True
    
    # Split data
    X_train, X_test, y_train, y_test = data_loader.split_data(
        processed_data,
        target_column='LOS'
    )
    
    # Save preprocessor and scaler
    data_loader.save_preprocessor(preprocessor_path)
    data_loader.save_scaler(scaler_path)
    
    # Initialize model trainer
    trainer = ModelTrainer(random_state=42)
    
    # Set scaler in trainer
    trainer.scaler = data_loader.scaler
    
    # Train model
    best_model, best_params = trainer.train_xgboost(X_train, y_train)
    
    # Evaluate model
    metrics = trainer.evaluate_model(best_model, X_test, y_test)
    
    # Save model (includes scaler and feature names)
    trainer.save_model(model_path)  # The save_model function now only requires the path to save to
    
    # Analyze feature importance
    analyzer = FeatureImportanceAnalyzer(best_model, X_train.columns)
    feature_importance = analyzer.analyze_importance()
    analyzer.plot_feature_correlation(X_train)
    
    # Print results
    print("\nBest Parameters:")
    print(best_params)
    print("\nModel Evaluation Metrics:")
    for metric, value in metrics.items():
        if isinstance(value, (int, float)):
            print(f"{metric}: {value:.4f}")
        else:
            print(f"{metric}:\n{value}")

if __name__ == "__main__":
    main()
