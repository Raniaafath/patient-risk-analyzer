from flask import Flask, jsonify
from flask_mongoengine import MongoEngine
from mongoengine import disconnect, connect
from config import Config
from routes.predict import predict_bp
from routes.train import train_bp
from routes.data_info import data_info_bp
from flask_cors import CORS
import logging
import os

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)

# Load configurations from config.py
app.config.from_object(Config)

# Initialize MongoDB connection
db = MongoEngine(app)

# Enable CORS (important for frontend integration)
CORS(app)

# Register routes
app.register_blueprint(predict_bp)
app.register_blueprint(train_bp)
app.register_blueprint(data_info_bp)

# Add health endpoint
@app.route('/health')
def health_check():
    try:
        # Test MongoDB connection
        db.connection.server_info()
        return jsonify({"status": "healthy", "mongodb": "connected"}), 200
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        return jsonify({"status": "unhealthy", "error": str(e)}), 500

def init_db():
    with app.app_context():
        try:
            # Test the connection
            db.connection.server_info()
            logger.info("Successfully connected to MongoDB")
            
            # Test accessing the collection
            from mongoengine import get_db
            db_conn = get_db()
            collection_names = db_conn.list_collection_names()
            logger.info(f"Available collections: {collection_names}")
            
            if 'MOESM1_ESM' in collection_names:
                count = db_conn['MOESM1_ESM'].count_documents({})
                logger.info(f"Found {count} documents in MOESM1_ESM collection")
            else:
                logger.warning("MOESM1_ESM collection not found")
                
        except Exception as e:
            logger.error(f"Failed to connect to MongoDB: {str(e)}")
            raise

def init_model():
    try:
        model_version = "model_20250416_212932"  # Latest model version
        model_path = os.path.join(os.path.dirname(__file__), 'saved_models', model_version, 'best_xgboost_model.pkl')
        from utils import set_model
        set_model(model_path)
        logger.info(f"✅ Model initialized successfully from {model_path}")
    except Exception as e:
        logger.error(f"❌ Error initializing model: {str(e)}")
        raise

if __name__ == "__main__":
    init_db()
    app.run(debug=True)
