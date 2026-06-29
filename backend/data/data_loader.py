import pandas as pd
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.model_selection import train_test_split
import os
import joblib
from pymongo import MongoClient
from dotenv import load_dotenv

class DataLoader:
    def __init__(self, data_path=None):
        self.data_path = data_path
        self.scaler = StandardScaler()
        self.label_encoders = {}
        self.preprocessor = None
        self.feature_names = None  # Store feature names from training
        load_dotenv()  # Load environment variables

    def extract_from_mongodb(self):
        """Extract data from MongoDB and save to raw data directory"""
        try:
            mongo_uri = os.getenv('MONGODB_URI')
            db_name = os.getenv('DB_NAME')
            collection_name = os.getenv('COLLECTION_NAME')

            print("🔄 Connecting to MongoDB...")

            client = MongoClient(mongo_uri)
            db = client[db_name]
            collection = db[collection_name]

            data = list(collection.find())
            data = pd.DataFrame(data)

            if '_id' in data.columns:
                data = data.drop('_id', axis=1)

            raw_data_path = os.path.join('saved_data', 'raw', 'medical_data.csv')
            os.makedirs(os.path.dirname(raw_data_path), exist_ok=True)
            data.to_csv(raw_data_path, index=False)

            print(f"✅ Successfully loaded {len(data)} records from MongoDB and saved to {raw_data_path}")

            print("\nDataset Info:")
            print(data.info())

            print("\nSample data:")
            print(data.head())

            print("\nMissing values:")
            print(data.isnull().sum())

            client.close()
            return data

        except Exception as e:
            print(f"❌ Error connecting to MongoDB: {str(e)}")
            raise

    def categorize_los(self, days):
        """Convert LOS days to class labels (0, 1, 2)"""
        try:
            if pd.isna(days):
                return 0  # Default to class 0 for missing values
            
            days = int(days)  # Convert to integer since LOS is already integer
            
            if days <= 7:
                return 0  # Short stay (0-7 days)
            elif days <= 14:
                return 1  # Medium stay (8-14 days)
            else:
                return 2  # Long stay (15+ days)
        except Exception as e:
            print(f"Warning: Error categorizing LOS value {days}: {str(e)}")
            return 0  # Default to class 0 on error

    def load_data(self, from_mongodb=False):
        """Load data from either CSV file or MongoDB"""
        try:
            if from_mongodb:
                data = self.extract_from_mongodb()
            else:
                if not self.data_path:
                    raise ValueError("Data path is not specified")
                data = pd.read_csv(self.data_path)
                print(f"✅ Data loaded successfully from {self.data_path}")

            # Validate data structure
            if data is None or data.empty:
                raise ValueError("No data loaded")

            # Print initial data info for debugging
            print("\nInitial data info:")
            print(f"Columns: {data.columns.tolist()}")
            print(f"Shape: {data.shape}")
            print(f"Data types:\n{data.dtypes}")

            # Ensure LOS column exists and rename if necessary
            if 'LOS' not in data.columns:
                # Try to find LOS column with different cases
                los_variations = ['los', 'Los', 'LengthOfStay', 'length_of_stay', 'Length of Stay', 'length of stay']
                for variation in los_variations:
                    if variation in data.columns:
                        print(f"Found LOS column as '{variation}'. Renaming to 'LOS'...")
                        data = data.rename(columns={variation: 'LOS'})
                        break
                else:
                    print(f"❌ 'LOS' column not found. Available columns: {', '.join(data.columns)}")
                    raise ValueError("'LOS' column not found in the data.")

            # Debugging step: Ensure 'LOS' is available after renaming
            print(f"\nColumns after renaming: {data.columns.tolist()}")

            # Check for missing values in 'LOS'
            if data['LOS'].isnull().sum() > 0:
                print(f"⚠️ Warning: 'LOS' column contains {data['LOS'].isnull().sum()} missing values.")
                # Fill missing 'LOS' values with 0 (default class for missing values)
                data['LOS'] = data['LOS'].fillna(0)

            # Print final data info
            print("\nFinal data info:")
            print(f"Columns: {data.columns.tolist()}")
            print(f"Shape: {data.shape}")
            print(f"LOS unique values: {data['LOS'].unique()}")

            return data
        except Exception as e:
            print(f"❌ Error loading data: {str(e)}")
            raise

    def preprocess_data(self, data, is_training=True, selected_features=None):
        """Preprocess the data for model training or prediction."""
        try:
            if data is None or data.empty:
                raise ValueError("Input data is empty or None")

            df = data.copy()

            # Handle target variable
            target = None
            if 'LOS' in df.columns:
                target = df['LOS']
                # Drop LOS column from features, only for training data
                if is_training:
                    df = df.drop(columns=['LOS'])
            else:
                raise ValueError("'LOS' column not found in the data")

            # Debugging: Print columns after extracting 'LOS'
            print(f"Columns after target extraction: {df.columns.tolist()}")

            # Feature selection: Ensure 'LOS' is excluded from selected features
            if is_training:
                # During training, use the provided selected_features
                if selected_features:
                    # Make sure LOS is not in the selected features
                    if 'LOS' in selected_features:
                        selected_features.remove('LOS')
                    missing_features = [feature for feature in selected_features if feature not in df.columns]
                    if missing_features:
                        print(f"⚠️ Warning: Missing features: {missing_features}")
                    df = df[selected_features]
                    # Store the selected features for later use during prediction
                    self.feature_names = selected_features
            else:
                # During prediction, use only the features that were selected during training
                if self.feature_names is None:
                    raise ValueError("No features were selected during training. Please train the model first.")
                
                # Check for missing features
                missing_features = [feature for feature in self.feature_names if feature not in df.columns]
                if missing_features:
                    print(f"⚠️ Warning: Missing features during prediction: {missing_features}")
                    # Add missing features with default values
                    for feature in missing_features:
                        print(f"Adding missing feature '{feature}' with default value 0")
                        df[feature] = 0
                
                # Select only the features that were used during training
                df = df[self.feature_names]

            # Handle categorical columns
            categorical_columns = df.select_dtypes(include=['object']).columns
            for column in categorical_columns:
                if is_training:
                    self.label_encoders[column] = LabelEncoder()
                    df[column] = self.label_encoders[column].fit_transform(df[column])
                else:
                    if column in self.label_encoders:
                        df[column] = self.label_encoders[column].transform(df[column])

            # Scale numerical features
            if is_training:
                self.scaler = StandardScaler()
                df_scaled = self.scaler.fit_transform(df)
                df = pd.DataFrame(df_scaled, columns=df.columns)
            else:
                df_scaled = self.scaler.transform(df)
                df = pd.DataFrame(df_scaled, columns=df.columns)

            # Return preprocessed features (X) and target (y)
            return df, target
        except Exception as e:
            print(f"❌ Error preprocessing data: {str(e)}")
            raise

    def split_data(self, data, test_size=0.2, random_state=42):
        """Split data into training and testing sets"""
        try:
            # No need to specify target_column here, as it's already handled in preprocessing
            X, y = data  # Data comes from preprocess_data (X as features, y as target)
            
            # Debugging: Check the shapes of X and y
            print(f"Preprocessed data shapes - Features: {X.shape}, Target: {y.shape}")
            print(f"Columns in the preprocessed data: {X.columns.tolist()}")

            # Then split the preprocessed data
            X_train, X_test, y_train, y_test = train_test_split(
                X, y, test_size=test_size, random_state=random_state
            )

            print("✅ Data split and preprocessed successfully")
            return X_train, X_test, y_train, y_test
        except Exception as e:
            print(f"❌ Error splitting data: {str(e)}")
            raise

    def save_preprocessor(self, path):
        """Save the preprocessor"""
        try:
            os.makedirs(os.path.dirname(path), exist_ok=True)
            preprocessor_data = {
                'label_encoders': self.label_encoders,
                'feature_names': self.feature_names
            }
            joblib.dump(preprocessor_data, path)
            print(f"✅ Preprocessor saved to {path}")
        except Exception as e:
            print(f"❌ Error saving preprocessor: {str(e)}")
            raise

    def load_preprocessor(self, path):
        """Load the preprocessor"""
        try:
            preprocessor_data = joblib.load(path)
            self.label_encoders = preprocessor_data['label_encoders']
            self.feature_names = preprocessor_data['feature_names']
            print(f"✅ Preprocessor loaded from {path}")
        except Exception as e:
            print(f"❌ Error loading preprocessor: {str(e)}")
            raise

    def save_scaler(self, path):
        """Save the scaler"""
        try:
            os.makedirs(os.path.dirname(path), exist_ok=True)
            joblib.dump(self.scaler, path)
            print(f"✅ Scaler saved to {path}")
        except Exception as e:
            print(f"❌ Error saving scaler: {str(e)}")
            raise

    def load_scaler(self, path):
        """Load the scaler"""
        try:
            self.scaler = joblib.load(path)
            print(f"✅ Scaler loaded from {path}")
        except Exception as e:
            print(f"❌ Error loading scaler: {str(e)}")
            raise
