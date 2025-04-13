from mongoengine import Document, StringField, DictField, ListField, DateTimeField, DateField, IntField
from datetime import datetime, timezone


class ModelMetadata(Document):
    # Model Version (e.g., model_20250403_190254)
    version = StringField(required=True, unique=True)
    
    # Hyperparameters used in the model
    best_params = DictField()
    
    # Performance metrics (accuracy, F1, recall, etc.)
    metrics = DictField()
    
    # Classification report (detailed performance metrics)
    classification_report = DictField()  # Store classification report as a dictionary
    
    # Top features (e.g., feature importance)
    top_features = ListField(DictField())  # List of dictionaries for top features
    
    # File paths of the saved model and related files
    saved_to = StringField(required=True)
    
    # Timestamp of the model training (with time)
    timestamp = DateTimeField(default=lambda: datetime.now(timezone.utc))
    
    # Date when the training data was used (without time, only date)
    data_date = DateField(required=True)  # Date of the data used for training
    
    # Date when the model was trained (including time)
    trained_on = DateTimeField(default=lambda: datetime.now(timezone.utc))
    
    # Store only the date of when the model was trained (without time)
    trained_on_date = DateField(default=lambda: datetime.now(timezone.utc).date())  # This stores only the date (no time)
    
    # Optional: User who trained the model (could be useful if you plan to have multiple users)
    trained_by = StringField()
    # Add new fields to capture training duration and data size
    training_duration = StringField()  # Stores the duration of model training (e.g., "0:30:15" for 30 minutes 15 seconds)
    data_size = IntField()  # Number of records in the training data
    train_set_size = IntField()  # Number of records in training set
    test_set_size = IntField()   # Number of records in test set
    # Store the features used in this model version
    selected_features = ListField(StringField())  # List of features used in the training of this model
    saved_data_files = ListField(StringField())  # List of saved data file names

    meta = {
        'collection': 'model_metadata',
        'indexes': ['version', 'trained_on_date']
    }

    def __str__(self):
        return f"Model Version {self.version} - Trained on {self.trained_on_date}"
