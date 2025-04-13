# Use Python 3.9 image
FROM python:3.9

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Create and activate virtual environment
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Copy requirements first to leverage Docker cache
COPY requirements.txt .

# Install Python dependencies with specific versions
RUN pip install --no-cache-dir -r requirements.txt && \
    pip install --no-cache-dir Flask==2.0.1 Flask-MongoEngine==1.0.0

# Copy the rest of the application
COPY . .

# Expose port
EXPOSE 5000

# Set environment variables
ENV FLASK_APP=app.py
ENV FLASK_ENV=production
ENV PYTHONUNBUFFERED=1

# Run the application with error handling
CMD ["flask", "run", "--host=0.0.0.0"] 