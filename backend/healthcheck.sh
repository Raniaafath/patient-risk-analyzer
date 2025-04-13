#!/bin/sh
# Simple healthcheck script for the backend container

# Check if Flask app is running
curl -f http://localhost:5000/health || exit 1

exit 0 