# Model Documentation

## Overview

The Patient Risk Analyzer uses an **XGBoost multiclass classifier** to predict the Length of Stay (LOS) category for ischemic stroke patients. Each prediction is accompanied by SHAP-based explanations for interpretability.

---

## Target Variable

**LOS** (Length of Stay) is classified into 3 categories:

| Class | Label       | Meaning     |
|-------|-------------|-------------|
| 0     | LOS Class 0 | Short stay  |
| 1     | LOS Class 1 | Medium stay |
| 2     | LOS Class 2 | Long stay   |

---

## Input Features

The model is trained on a configurable subset of the following features from the `MOESM1_ESM` collection:

### Numerical
| Feature           | Description                        | Validation   | Unit    |
|-------------------|------------------------------------|--------------|---------|
| `age`             | Patient age                        | 18 – 100     | years   |
| `Body_Mass_Index` | Body Mass Index                    | 15 – 40      | kg/m²   |
| `Mrs_admission`   | Modified Rankin Scale at admission | 0 – 5        | score   |
| `NIHSS_admission` | NIH Stroke Scale at admission      | 0 – 42       | score   |

### Categorical (encoded as integers)
| Feature             | Description              |
|---------------------|--------------------------|
| `Gender`            | Patient gender           |
| `medical_insurance` | Insurance type           |
| `payment_method`    | Payment method           |
| `marital_status`    | Marital status           |
| `occupation`        | Occupation               |

### Binary (0 / 1)
| Feature                   | Description                        |
|---------------------------|------------------------------------|
| `hypertension`            | Hypertension history               |
| `diabetes`                | Diabetes history                   |
| `coronary_heart_disease`  | Coronary heart disease             |
| `atrial_fibrillation`     | Atrial fibrillation                |
| `hyperlipidemia`          | Hyperlipidemia                     |
| `hyperhomocysteinemia`    | Hyperhomocysteinemia               |
| `transient_ischemic_attack` | TIA history                      |
| `peripheral_arterial_disease` | PAD history                    |
| `epilepsy`                | Epilepsy                           |
| `respiratory_tract_infection` | RTI                            |
| `hemiplegia`              | Hemiplegia                         |
| `aphasia`                 | Aphasia                            |
| `cognitive_disorder`      | Cognitive disorder                 |
| `dizziness`               | Dizziness                          |
| `trauma`                  | Trauma                             |
| `Postoperative_sequelae`  | Postoperative sequelae             |
| `critical`                | Critical status on admission       |
| `operation`               | Underwent operation                |

---

## Training Pipeline

1. **Feature selection** — caller provides a list of features via the API
2. **Data loading** — records fetched from MongoDB (`MOESM1_ESM` collection)
3. **Preprocessing** — encoding, scaling
4. **Train/test split** — 80/20
5. **XGBoost training** — with Bayesian hyperparameter optimization (`scikit-optimize`)
6. **Evaluation** — accuracy, F1, full classification report on the test set
7. **SHAP analysis** — global feature importance computed and saved
8. **Artifact saving** — model `.pkl`, split CSVs, plots, and metadata all saved under a versioned directory

---

## Model Versioning

Each training run produces a new version named by timestamp:

```
backend/saved_models/
└── model_20250416_212932/
    ├── best_xgboost_model.pkl   # Serialized XGBoost model
    ├── X_train.csv
    ├── X_test.csv
    ├── y_train.csv
    └── y_test.csv
```

Version metadata (metrics, selected features, training duration, etc.) is stored in MongoDB under the `ModelMetadata` collection and is queryable via `GET /api/models/versions`.

---

## Prediction Pipeline

1. Fetch model metadata for the requested version from MongoDB
2. Load `best_xgboost_model.pkl` from disk
3. Validate and preprocess input features using the same pipeline as training
4. Call `model.predict()` and `model.predict_proba()` to get class and probability
5. Generate SHAP explanation for the prediction
6. Return class, probabilities, feature importance, and SHAP values

---

## Explainability (SHAP)

Every prediction includes a SHAP explanation showing which features pushed the prediction toward or away from each LOS class. This allows clinicians to understand why the model made a specific prediction.

Global feature importance plots are also generated during training and saved alongside the model artifacts.
