# Patient Risk Analyzer

A full-stack web application that predicts the **Length of Stay (LOS)** for ischemic stroke patients using an XGBoost classifier, with MongoDB integration and SHAP-based explanations.

---

## Tech Stack

| Layer     | Technology                                      |
|-----------|-------------------------------------------------|
| Backend   | Python 3.9+, Flask, MongoEngine, XGBoost, SHAP |
| Frontend  | React 18, TypeScript, Vite, Tailwind CSS        |
| Database  | MongoDB                                         |
| Deploy    | Docker + docker-compose                         |

---

## Project Structure

```
patient-risk-analyzer/
├── backend/
│   ├── data/               # Data loading and preprocessing
│   ├── models/             # MongoDB models and ML model trainer
│   ├── routes/             # API blueprints (predict, train, data_info)
│   ├── utils/              # Feature importance and shared utilities
│   ├── saved_models/       # Trained models (auto-created on training)
│   ├── saved_data/         # Raw data storage
│   ├── docs/               # Backend documentation
│   ├── app.py              # Flask application entry point
│   ├── config.py           # MongoDB configuration
│   ├── run.py              # Server runner
│   ├── requirements.txt    # Python dependencies
│   ├── Dockerfile
│   └── .env                # Environment variables (not committed)
│
├── frontend/
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Dashboard, Prediction, Training, Models
│   │   ├── services/       # API calls
│   │   └── hooks/          # Custom React hooks
│   ├── package.json
│   ├── vite.config.ts
│   ├── tsconfig.app.json
│   └── Dockerfile
│
├── docker-compose.yml
└── .gitignore
```

---

## Features

- **Prediction** — Classify a patient's LOS into 3 classes (short / medium / long stay) using a versioned XGBoost model
- **SHAP explanations** — Per-prediction feature importance via SHAP values
- **Async training** — Trigger model training from the UI; track progress by task ID
- **Model versioning** — Each trained model is saved with a timestamp-based version (`model_YYYYMMDD_HHMMSS`) and its metadata stored in MongoDB
- **Data overview** — Dashboard with dataset statistics and feature distributions

---

## Setup

### Prerequisites
- Python 3.9+
- Node.js 18+
- MongoDB 4.4+ (or use Docker)

---

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate      # Windows: .\venv\Scripts\activate
pip install -r requirements.txt
```

Create a `.env` file in `backend/`:
```env
MONGODB_URI=mongodb://localhost:27017/medical_data
DB_NAME=medical_data
COLLECTION_NAME=MOESM1_ESM
```

Start the server:
```bash
python run.py
# or
flask run
```

Backend runs at `http://localhost:5000`.

---

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at `http://localhost:8080`.

---

### Docker (full stack)

```bash
docker-compose up --build
```

| Service  | URL                    |
|----------|------------------------|
| Frontend | http://localhost:80    |
| Backend  | http://localhost:5000  |
| MongoDB  | localhost:27017        |

---

## API Endpoints

| Method | Endpoint                         | Description                        |
|--------|----------------------------------|------------------------------------|
| GET    | `/health`                        | Health check                       |
| POST   | `/api/predict/<version>`         | Predict LOS for a patient          |
| POST   | `/api/train`                     | Start background model training    |
| GET    | `/api/train/status/<task_id>`    | Poll training task status          |
| GET    | `/api/models/versions`           | List all trained model versions    |
| GET    | `/api/data/overview`             | Dataset statistics                 |
| GET    | `/api/data/features`             | Feature descriptions and validation|
| GET    | `/api/data/models`               | Model metadata summary             |

Full endpoint documentation: [backend/docs/API.md](backend/docs/API.md)

---

## Model

- **Algorithm**: XGBoost multiclass classifier
- **Target**: LOS class — `0` (short stay), `1` (medium stay), `2` (long stay)
- **Explainability**: SHAP values per prediction
- **Model files**: saved as `.pkl` under `backend/saved_models/<version>/best_xgboost_model.pkl`

See [backend/docs/MODELS.md](backend/docs/MODELS.md) for details.

---

## License

[Add your license here]
