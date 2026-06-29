# API Documentation

Base URL: `http://localhost:5000`

No authentication is required. In a production environment, add authentication middleware.

---

## Health

### `GET /health`

Check whether the server and MongoDB connection are healthy.

**Response `200`**
```json
{
  "status": "healthy",
  "mongodb": "connected"
}
```

**Response `500`**
```json
{
  "status": "unhealthy",
  "error": "..."
}
```

---

## Prediction

### `POST /api/predict/<version>`

Run a prediction for one patient using a specific model version.

**URL parameter**
| Param     | Description                                          |
|-----------|------------------------------------------------------|
| `version` | Model version string, e.g. `model_20250416_212932`   |

**Request body**

Send the patient fields that match the features the model was trained on. Example:

```json
{
  "age": 65,
  "Gender": 1,
  "Body_Mass_Index": 24.5,
  "hypertension": 1,
  "diabetes": 0,
  "Mrs_admission": 2,
  "NIHSS_admission": 8,
  "medical_insurance": 1,
  "payment_method": 2,
  "critical": 0,
  "operation": 0
}
```

**Response `200`**
```json
{
  "prediction": {
    "class": 1,
    "class_label": "LOS Class 1",
    "probabilities": [0.12, 0.71, 0.17]
  },
  "features_used": ["age", "Gender", "Body_Mass_Index", "..."],
  "explanation": {
    "feature_importance": {
      "NIHSS_admission": 0.34,
      "age": 0.21
    },
    "shap_values": [...]
  },
  "model_version": "model_20250416_212932"
}
```

**LOS classes**
| Class | Label       | Meaning     |
|-------|-------------|-------------|
| 0     | LOS Class 0 | Short stay  |
| 1     | LOS Class 1 | Medium stay |
| 2     | LOS Class 2 | Long stay   |

**Error responses**

| Status | Cause                                  |
|--------|----------------------------------------|
| 400    | Missing or invalid input data          |
| 404    | Model version not found                |
| 500    | Preprocessing or prediction failure    |

---

## Training

### `POST /api/train`

Start a background model training job. Returns a `task_id` immediately; use the status endpoint to poll progress.

**Request body**
```json
{
  "selected_features": [
    "age",
    "Gender",
    "Body_Mass_Index",
    "hypertension",
    "diabetes",
    "Mrs_admission",
    "NIHSS_admission"
  ]
}
```

**Response `202`**
```json
{
  "message": "Training initiated. Check status using the task ID.",
  "task_id": "a3f2c1d4-5678-..."
}
```

**Error responses**

| Status | Cause                            |
|--------|----------------------------------|
| 400    | `selected_features` not provided |
| 500    | Failed to start training thread  |

---

### `GET /api/train/status/<task_id>`

Poll the status of a running or completed training job.

**Response `200`** — while running:
```json
{
  "status": "TRAINING_MODEL",
  "message": "Training model..."
}
```

**Response `200`** — on completion:
```json
{
  "status": "COMPLETED",
  "message": "Model training completed successfully.",
  "version": "model_20250416_212932",
  "metrics": {
    "accuracy": 0.83,
    "f1": 0.81
  },
  "classification_report": { "...": "..." },
  "top_features": [
    { "feature": "NIHSS_admission", "importance": 0.34 }
  ],
  "training_duration": "0:02:13.421"
}
```

**Possible status values**
| Status              | Meaning                          |
|---------------------|----------------------------------|
| `QUEUED`            | Waiting to start                 |
| `STARTING`          | Initializing                     |
| `LOADING_DATA`      | Fetching data from MongoDB       |
| `PREPROCESSING`     | Cleaning and encoding features   |
| `SPLITTING_DATA`    | Train/test split                 |
| `SAVING_DATA`       | Persisting split CSVs            |
| `TRAINING_MODEL`    | XGBoost fitting                  |
| `EVALUATING_MODEL`  | Running test set evaluation      |
| `SAVING_MODEL`      | Writing `.pkl` to disk           |
| `ANALYZING_FEATURES`| Computing SHAP / feature importance |
| `SAVING_METADATA`   | Writing to MongoDB               |
| `COMPLETED`         | Done successfully                |
| `FAILED`            | Error — see `error` field        |

**Response `404`** — task ID not found:
```json
{ "error": "Training task not found" }
```

---

## Models

### `GET /api/models/versions`

List all trained model versions stored in MongoDB.

**Response `200`**
```json
{
  "models": [
    {
      "version": "model_20250416_212932",
      "trained_on": "2025-04-16T21:29:32Z",
      "metrics": { "accuracy": 0.83, "f1": 0.81 },
      "saved_to": "saved_models/model_20250416_212932",
      "classification_report": { "...": "..." },
      "top_features": [ { "feature": "NIHSS_admission", "importance": 0.34 } ],
      "data_size": 1500,
      "training_duration": "0:02:13",
      "selected_features": ["age", "Gender", "..."]
    }
  ]
}
```

---

## Data

### `GET /api/data/overview`

Return dataset statistics and a list of available model versions.

**Response `200`**
```json
{
  "total_patients": 1500,
  "model_versions": [
    { "version": "model_20250416_212932", "feature_count": 11, "features": ["age", "..."] }
  ],
  "numerical_stats": {
    "age":             { "min": 18, "max": 95, "count": 1500 },
    "Body_Mass_Index": { "min": 15.2, "max": 39.8, "count": 1500 },
    "Mrs_admission":   { "min": 0, "max": 5, "count": 1500 },
    "NIHSS_admission": { "min": 0, "max": 42, "count": 1500 }
  },
  "categorical_stats": {
    "Gender":            { "values": { "1": 900, "0": 600 }, "count": 1500 },
    "medical_insurance": { "values": { "...": "..." }, "count": 1500 },
    "payment_method":    { "values": { "...": "..." }, "count": 1500 }
  },
  "last_updated": "2025-04-16T21:30:00"
}
```

---

### `GET /api/data/features`

Return descriptions and validation rules for all features seen across model versions.

**Response `200`**
```json
{
  "features": {
    "Body_Mass_Index": {
      "description": "Body Mass Index",
      "type": "numerical",
      "validation": { "min": 15, "max": 40 },
      "unit": "kg/m²"
    },
    "age": {
      "description": "Patient Age",
      "type": "numerical",
      "validation": { "min": 18, "max": 100 },
      "unit": "years"
    },
    "Mrs_admission": {
      "description": "Modified Rankin Scale at Admission",
      "type": "numerical",
      "validation": { "min": 0, "max": 5 },
      "unit": "score"
    },
    "NIHSS_admission": {
      "description": "NIH Stroke Scale at Admission",
      "type": "numerical",
      "validation": { "min": 0, "max": 42 },
      "unit": "score"
    },
    "Gender":            { "description": "Patient Gender",       "type": "categorical", "values": ["Male", "Female"] },
    "medical_insurance": { "description": "Medical Insurance Type","type": "categorical" },
    "payment_method":    { "description": "Payment Method",        "type": "categorical" }
  },
  "total_features": 7
}
```

---

### `GET /api/data/models`

Return a lightweight summary of all models (version + features).

**Response `200`**
```json
{
  "models": [
    {
      "version": "model_20250416_212932",
      "selected_features": ["age", "Gender", "Body_Mass_Index", "..."]
    }
  ],
  "total_models": 1
}
```
