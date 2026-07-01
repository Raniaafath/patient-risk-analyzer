"""
One-time script to import medical_data.csv into MongoDB.

Usage:
  MONGODB_URI="mongodb+srv://..." python backend/scripts/import_to_mongodb.py

Or with a local .env file:
  python backend/scripts/import_to_mongodb.py
"""

import os
import sys
import pandas as pd
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()

MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017/medical_data")
DB_NAME = os.getenv("DB_NAME", "medical_data")
COLLECTION_NAME = os.getenv("COLLECTION_NAME", "MOESM1_ESM")

CSV_PATH = os.path.join(os.path.dirname(__file__), "..", "saved_data", "raw", "medical_data.csv")


def main():
    if not os.path.exists(CSV_PATH):
        print(f"CSV not found at: {CSV_PATH}")
        sys.exit(1)

    print(f"Loading CSV from {CSV_PATH}...")
    df = pd.read_csv(CSV_PATH)
    print(f"Loaded {len(df)} rows, {len(df.columns)} columns")

    print(f"Connecting to MongoDB at {MONGODB_URI[:40]}...")
    client = MongoClient(MONGODB_URI)
    db = client[DB_NAME]
    collection = db[COLLECTION_NAME]

    existing = collection.count_documents({})
    if existing > 0:
        answer = input(f"Collection already has {existing} documents. Drop and re-import? [y/N] ")
        if answer.lower() != "y":
            print("Aborted.")
            sys.exit(0)
        collection.drop()
        print("Dropped existing collection.")

    records = df.to_dict(orient="records")
    result = collection.insert_many(records)
    print(f"Inserted {len(result.inserted_ids)} documents into {DB_NAME}.{COLLECTION_NAME}")

    client.close()
    print("Done.")


if __name__ == "__main__":
    main()