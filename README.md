# Patient Risk Analyzer

A full-stack web application that predicts the Length of Stay (LOS) for ischemic stroke patients using XGBoost machine learning model, with MongoDB integration and SHAP explanations.

## Project Structure

```
patient-risk-analyzer/
├── backend/                  # Python/Flask backend
│   ├── app/                 # Core application code
│   │   ├── routes/          # API endpoints
│   │   ├── models/          # Database models
│   │   └── utils/           # Utility functions
│   ├── saved_models/        # Trained ML models
│   ├── saved_data/         # Data storage
│   ├── docs/               # Backend documentation
│   ├── config.py           # Configuration settings
│   ├── app.py              # Main Flask application
│   ├── requirements.txt    # Python dependencies
│   └── .env                # Backend environment variables
│
├── frontend/                # React/TypeScript frontend
│   ├── src/                # Frontend source code
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/         # Page components
│   │   ├── services/      # API service calls
│   │   ├── hooks/         # Custom React hooks
│   │   ├── utils/         # Frontend utilities
│   │   ├── App.tsx        # Main App component
│   │   └── main.tsx       # Entry point
│   ├── public/            # Static assets
│   ├── package.json       # Node.js dependencies
│   ├── tsconfig.json      # TypeScript configuration
│   ├── vite.config.ts     # Vite configuration
│   └── .env               # Frontend environment variables
│
├── docker/                 # Docker configuration
│   ├── backend/           # Backend Dockerfile
│   └── frontend/          # Frontend Dockerfile
│
├── docker-compose.yml      # Docker services configuration
├── .gitignore             # Git ignore rules
└── README.md              # Project documentation
```

## Features

### Backend
- Flask web application with RESTful API
- MongoDB database integration
- XGBoost machine learning model for LOS prediction
- SHAP (SHapley Additive exPlanations) for model interpretability
- Data preprocessing and validation
- Comprehensive error handling and logging

### Frontend
- React with TypeScript
- Modern UI with Tailwind CSS
- Real-time data visualization
- Responsive design
- Form validation

## Installation

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Create and activate virtual environment:
```bash
python -m venv venv
.\venv\Scripts\activate  # On Windows
source venv/bin/activate  # On Linux/Mac
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Set up environment variables:
Create a `.env` file in the backend directory with the following variables:
```
FLASK_APP=app.py
FLASK_ENV=development
MONGODB_URI=your_mongodb_uri
MONGODB_DB=your_database_name
```

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Set up environment variables:
Create a `.env` file in the frontend directory with the following variables:
```
VITE_API_URL=http://localhost:5000
```

## Usage

### Development

1. Start the backend server:
```bash
cd backend
flask run
```

2. Start the frontend development server:
```bash
cd frontend
npm run dev
# or
yarn dev
```

3. Access the application:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

### Production

1. Build the Docker containers:
```bash
docker-compose build
```

2. Start the containers:
```bash
docker-compose up -d
```

## API Endpoints

- `/predict` - POST endpoint for making predictions
  - Input: JSON containing patient data
  - Output: Prediction and SHAP explanation

- `/train` - POST endpoint for model training
  - Input: Training data and parameters
  - Output: Training metrics and model performance

- `/data_info` - GET endpoint for data statistics
  - Output: Data distributions and model performance metrics

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

## Documentation

- [Backend API Documentation](backend/docs/API.md)
- [Backend Setup Guide](backend/docs/SETUP.md)
- [Model Documentation](backend/docs/MODELS.md)

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request

## License

[Add your license information here]
