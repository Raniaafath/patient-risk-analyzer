# Stroke Length of Stay Prediction System

A Flask-based web application that predicts the Length of Stay (LOS) for ischemic stroke patients using XGBoost machine learning model, with MongoDB integration and SHAP explanations.

## Project Structure

```
myprojectpfa/
├── .venv/              # Virtual environment
├── saved_models/       # Trained model files
├── saved_data/        # Processed data
├── notebooks/         # Jupyter notebooks
├── routes/           # API routes
├── src/              # Source code
├── __pycache__/      # Python cache
├── app.py           # Main Flask application
├── config.py        # Configuration settings
├── models.py        # MongoDB models
├── utils.py         # Utility functions
├── requirements.txt # Python dependencies
└── README.md        # Project documentation
```

## Features

- Flask web application with RESTful API
- MongoDB database integration
- XGBoost machine learning model for LOS prediction
- SHAP (SHapley Additive exPlanations) for model interpretability
- Data preprocessing and validation
- Comprehensive error handling and logging

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd myprojectpfa
```

2. Create and activate virtual environment:
```bash
python -m venv .venv
.venv\Scripts\activate  # On Windows
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Set up environment variables:
Create a `.env` file with the following variables:
```
MONGODB_URI=your_mongodb_uri
MONGODB_DB=your_database_name
```

## Usage

1. Start the Flask application:
```bash
python app.py
```

2. The API will be available at `http://localhost:5000`

## API Endpoints

- `/predict` - POST endpoint for making predictions
  - Input: JSON containing patient data
  - Output: Prediction and SHAP explanation

## Model Features

The model uses the following features:
- Medical insurance
- Payment method
- Body Mass Index (BMI)
- Medical conditions (hypertension, diabetes, etc.)
- Admission scores (mRS, NIHSS)
- Demographic information (age, gender, etc.)
- Clinical indicators (critical status, operation)

## Data Validation

The system includes validation for:
- BMI (15-40)
- Age (18-100)
- mRS score (0-5)
- NIHSS score (0-42)

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request

## License

[Add your license information here]
