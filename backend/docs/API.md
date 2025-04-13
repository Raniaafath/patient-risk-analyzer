# Patient Risk Analyzer API Documentation

## Overview
This API provides endpoints for predicting patient risk and managing medical data. The API is built using Flask and provides RESTful endpoints for data analysis and prediction.

## Base URL
```
http://localhost:5000
```

## Authentication
Currently, the API does not require authentication. In production, implement proper authentication.

## Endpoints

### 1. Prediction Endpoint
**POST** `/predict`

Predicts patient risk based on provided medical data.

#### Request Body
```json
{
    "patient_data": {
        "age": 45,
        "gender": "M",
        "bmi": 25.5,
        "hypertension": true,
        "diabetes": false,
        "heart_disease": false,
        "smoking_status": "never smoked"
    }
}
```

#### Response
```json
{
    "prediction": 0.75,
    "risk_level": "High",
    "explanation": {
        "factors": [
            {"feature": "age", "importance": 0.3},
            {"feature": "bmi", "importance": 0.2}
        ]
    }
}
```

### 2. Training Endpoint
**POST** `/train`

Trains or updates the prediction model with new data.

#### Request Body
```json
{
    "training_data": [...],
    "parameters": {
        "learning_rate": 0.01,
        "max_depth": 6
    }
}
```

#### Response
```json
{
    "status": "success",
    "model_metrics": {
        "accuracy": 0.85,
        "precision": 0.83,
        "recall": 0.86
    }
}
```

### 3. Data Information Endpoint
**GET** `/data_info`

Retrieves information about the available data and model statistics.

#### Response
```json
{
    "total_patients": 1000,
    "feature_distributions": {
        "age": {
            "mean": 45.5,
            "std": 15.2
        }
    },
    "model_performance": {
        "last_training_date": "2024-04-13",
        "accuracy": 0.85
    }
}
```

## Error Responses

### 400 Bad Request
```json
{
    "error": "Invalid input data",
    "details": "Age must be between 0 and 120"
}
```

### 500 Internal Server Error
```json
{
    "error": "Internal server error",
    "message": "Error processing request"
}
```

## Rate Limiting
- 100 requests per minute per IP address
- 1000 requests per hour per IP address

## Data Validation
All input data is validated against the following rules:
- Age: 0-120 years
- BMI: 10-50
- Gender: "M" or "F"
- Smoking Status: ["never smoked", "formerly smoked", "smokes"] 