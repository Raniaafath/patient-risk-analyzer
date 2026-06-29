# Patient Risk Analyzer

A full-stack web application that predicts the **Length of Stay (LOS)** for ischemic stroke patients using an XGBoost classifier, with MongoDB integration and SHAP-based explanations.

**Live demo:** https://upbeat-connection-production-c3aa.up.railway.app

---

## Tech Stack

| Layer     | Technology                                      |
|-----------|-------------------------------------------------|
| Backend   | Python 3.9+, Flask, Gunicorn, MongoEngine, XGBoost, SHAP |
| Frontend  | React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui |
| Database  | MongoDB                                         |
| CI/CD     | GitHub Actions (lint → build → Docker)          |
| Deploy    | Railway (backend + frontend + MongoDB)          |

---

## Project Structure

```
patient-risk-analyzer/
├── backend/
│   ├── data/               # Data loading and preprocessing
│   ├── models/             # MongoDB models and ML model trainer
│   ├── routes/             # API blueprints (predict, train, data_info)
│   ├── utils/              # Preprocessing helpers, SHAP explanation
│   ├── scripts/
│   │   └── import_to_mongodb.py  # One-time CSV → MongoDB import
│   ├── saved_models/       # Trained models (auto-created on training)
│   ├── saved_data/         # Raw data storage
│   ├── docs/               # Backend documentation
│   ├── app.py              # Flask application entry point
│   ├── config.py           # MongoDB configuration
│   ├── run.py              # Server runner (local dev)
│   ├── healthcheck.sh      # Docker health probe
│   ├── requirements.txt    # Python dependencies
│   ├── Dockerfile
│   └── .env                # Environment variables (not committed)
│
├── frontend/
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Dashboard, Prediction, Training, Models
│   │   ├── services/       # API calls (api.ts)
│   │   └── hooks/          # Custom React hooks
│   ├── nginx.conf          # Serves static build on port 80
│   ├── package.json
│   ├── vite.config.ts
│   ├── tsconfig.app.json
│   └── Dockerfile
│
├── .github/workflows/ci.yml  # CI pipeline
├── docker-compose.yml
└── .gitignore
```

---

## Features

- **Prediction** — Classify a patient's LOS into 3 classes (short ≤7 days / medium 8–14 days / long >14 days) using a versioned XGBoost model
- **SHAP explanations** — Per-prediction feature importance via SHAP values
- **Async training** — Trigger model training from the UI; track progress by task ID
- **Model versioning** — Each trained model is saved with a timestamp-based version (`model_YYYYMMDD_HHMMSS`) and metadata stored in MongoDB
- **Data overview** — Dashboard with dataset statistics and feature distributions

---

## Local Development

### Prerequisites
- Python 3.9+
- Node.js 18+
- MongoDB 4.4+ running locally

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate      # Windows: .\venv\Scripts\activate
pip install -r requirements.txt
```

Create `backend/.env`:
```env
MONGODB_URI=mongodb://localhost:27017/medical_data
DB_NAME=medical_data
COLLECTION_NAME=MOESM1_ESM
```

```bash
python run.py
```

Backend runs at `http://localhost:5000`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at `http://localhost:8080`.

### Docker (full stack)

```bash
docker-compose up --build
```

| Service  | URL                   |
|----------|-----------------------|
| Frontend | http://localhost:80   |
| Backend  | http://localhost:5000 |
| MongoDB  | localhost:27017       |

---

## Deployment (Railway)

The app is deployed on [Railway](https://railway.app) as three separate services:

| Service  | Config                                      |
|----------|---------------------------------------------|
| Backend  | Root directory: `backend/`, port `5000`     |
| Frontend | Root directory: `frontend/`, port `80`      |
| MongoDB  | Managed Railway plugin                      |

Required environment variables:

**Backend service:**
```
MONGODB_URI=<Railway MongoDB internal URL>
DB_NAME=medical_data
COLLECTION_NAME=MOESM1_ESM
```

**Frontend service:**
```
VITE_API_URL=https://<backend-railway-url>
```

Any push to `main` triggers a redeploy automatically.

---

## CI/CD

GitHub Actions runs on every push and pull request to `main`:

1. **backend-lint** — flake8 (F-codes only) on Python source
2. **frontend-build** — `npm ci && npm run build`
3. **docker-build** — builds both Docker images (no push)

See [`.github/workflows/ci.yml`](.github/workflows/ci.yml).

---

## API Endpoints

| Method | Endpoint                         | Description                         |
|--------|----------------------------------|-------------------------------------|
| GET    | `/health`                        | Health check + MongoDB status       |
| POST   | `/api/predict/<version>`         | Predict LOS for a patient           |
| POST   | `/api/train`                     | Start background model training     |
| GET    | `/api/train/status/<task_id>`    | Poll training task status           |
| GET    | `/api/models/versions`           | List all trained model versions     |
| GET    | `/api/data/overview`             | Dataset statistics                  |
| GET    | `/api/data/features`             | Feature descriptions and validation |
| GET    | `/api/data/models`               | Model metadata summary              |

Full endpoint documentation: [backend/docs/API.md](backend/docs/API.md)

---

## Model

- **Algorithm**: XGBoost multiclass classifier
- **Target**: LOS class — `0` short stay (≤7 days), `1` medium stay (8–14 days), `2` long stay (>14 days)
- **Explainability**: SHAP values per prediction, showing which features pushed the prediction up or down
- **Model files**: saved as `.pkl` under `backend/saved_models/<version>/best_xgboost_model.pkl`

See [backend/docs/MODELS.md](backend/docs/MODELS.md) for full details.

---

## License

MIT
