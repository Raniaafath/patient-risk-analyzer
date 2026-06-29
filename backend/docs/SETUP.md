# Backend Setup Guide

## Prerequisites

- Python 3.9+
- pip
- MongoDB 4.4+ running locally (or use Docker)

---

## Local Development

### 1. Create and activate a virtual environment

```bash
cd backend

# Linux / Mac
python3 -m venv venv
source venv/bin/activate

# Windows
python -m venv venv
.\venv\Scripts\activate
```

### 2. Install dependencies

```bash
pip install -r requirements.txt
```

### 3. Configure environment variables

Create a `.env` file in the `backend/` directory:

```env
MONGODB_URI=mongodb://localhost:27017/medical_data
DB_NAME=medical_data
COLLECTION_NAME=MOESM1_ESM
```

### 4. Start the server

```bash
python run.py
```

The API will be available at `http://localhost:5000`.

> In production the server runs under Gunicorn (`gunicorn -w 4 -b 0.0.0.0:5000 app:app`). `run.py` is for local development only.

---

## Docker (full stack)

From the project root:

```bash
docker-compose up --build
```

This starts three services:

| Service  | Port  | Notes                          |
|----------|-------|--------------------------------|
| backend  | 5000  | Flask + Gunicorn               |
| frontend | 80    | Nginx serving the React build  |
| mongodb  | 27017 | Mongo with a persistent volume |

To stop:
```bash
docker-compose down
```

To also remove data volumes:
```bash
docker-compose down -v
```

---

## Railway Deployment

The backend is deployed as a standalone service on Railway.

**Settings:**
- Root directory: `backend/`
- Builder: Dockerfile
- Port: `5000`

**Required environment variables (set in Railway dashboard):**

| Variable          | Value                                      |
|-------------------|--------------------------------------------|
| `MONGODB_URI`     | Railway MongoDB internal connection string |
| `DB_NAME`         | `medical_data`                             |
| `COLLECTION_NAME` | `MOESM1_ESM`                               |

The `MONGODB_URI` internal URL is found in the Railway MongoDB service → Variables tab (`MONGO_URL`).

---

## Project Structure

```
backend/
├── data/
│   └── data_loader.py          # MongoDB loading, preprocessing, train/test split
├── models/
│   ├── models.py               # Patient MongoEngine document schema
│   ├── model_trainer.py        # XGBoost training and evaluation
│   └── model_metadata.py       # ModelMetadata MongoEngine document schema
├── routes/
│   ├── predict.py              # POST /api/predict/<version>
│   ├── train.py                # POST /api/train, GET /api/train/status/<id>, GET /api/models/versions
│   └── data_info.py            # GET /api/data/overview, /features, /models
├── utils/
│   ├── utils.py                # Preprocessing helpers, SHAP explanation
│   └── feature_importance.py   # Feature importance analysis
├── saved_models/               # Auto-created; each training run creates a timestamped subdirectory
├── saved_data/raw/             # Place raw data files here before loading
├── app.py                      # Flask app factory and blueprint registration
├── config.py                   # MongoDB connection config
├── run.py                      # Development server entry point
├── requirements.txt
├── Dockerfile
└── .env                        # Not committed — create manually
```

---

## Troubleshooting

**MongoDB connection refused**
- Make sure MongoDB is running locally
- Check `MONGODB_URI` in `.env` matches your MongoDB host/port

**Model not found on prediction**
- At least one training run must complete before predictions work
- Check `backend/saved_models/` for a timestamped directory containing `best_xgboost_model.pkl`
- Verify the model version exists in the `ModelMetadata` collection in MongoDB

**Port already in use**
- Kill the process using the port or change the port in `run.py`

**Missing module errors**
- Make sure the virtual environment is activated
- Re-run `pip install -r requirements.txt`
