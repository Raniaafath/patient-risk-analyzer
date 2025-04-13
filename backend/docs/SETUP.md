# Backend Setup Guide

## Prerequisites
- Python 3.9 or higher
- pip (Python package manager)
- MongoDB 4.4 or higher
- Virtual environment (recommended)

## Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd patient-risk-analyzer/backend
```

2. **Create and activate virtual environment**
```bash
# Windows
python -m venv venv
.\venv\Scripts\activate

# Linux/Mac
python3 -m venv venv
source venv/bin/activate
```

3. **Install dependencies**
```bash
pip install -r requirements.txt
```

4. **Configure environment variables**
Create a `.env` file in the backend directory with the following variables:
```env
FLASK_APP=app.py
FLASK_ENV=development
MONGODB_URI=mongodb://localhost:27017/
MONGODB_DB=patient_risk_db
```

5. **Initialize the database**
```bash
python init_db.py
```

## Running the Application

1. **Start the Flask server**
```bash
flask run
```
The server will start at `http://localhost:5000`

2. **Run in development mode**
```bash
flask run --debug
```

## Project Structure
```
backend/
├── app/
│   ├── routes/          # API endpoints
│   ├── models/          # Database models
│   └── utils/           # Utility functions
├── saved_models/        # Trained ML models
├── saved_data/         # Data storage
├── config.py           # Configuration settings
├── requirements.txt    # Python dependencies
└── .env               # Environment variables
```

## Development Guidelines

1. **Code Style**
- Follow PEP 8 guidelines
- Use type hints
- Document functions and classes
- Write unit tests for new features

2. **Git Workflow**
- Create feature branches
- Write descriptive commit messages
- Submit pull requests for review

3. **Testing**
```bash
# Run all tests
pytest

# Run specific test file
pytest tests/test_predict.py

# Run with coverage
pytest --cov=app tests/
```

## Troubleshooting

1. **MongoDB Connection Issues**
- Verify MongoDB is running
- Check connection string in .env
- Ensure network access is allowed

2. **Model Loading Errors**
- Verify model files exist in saved_models/
- Check model version compatibility
- Ensure sufficient memory

3. **Common Issues**
- Port already in use: Change port in .env
- Module not found: Check virtual environment
- Database errors: Check MongoDB status

## Production Deployment

1. **Environment Setup**
- Use production-grade WSGI server (Gunicorn)
- Set up proper logging
- Configure SSL/TLS
- Set up monitoring

2. **Security Considerations**
- Enable authentication
- Use HTTPS
- Set up rate limiting
- Regular security updates

3. **Performance Optimization**
- Enable caching
- Optimize database queries
- Use connection pooling
- Monitor resource usage 