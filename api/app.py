"""
Produce Processor — Clover Ingest API
Accepts a CSV from Clover and uploads it to Firebase Storage
so the produce processor app can load it automatically.

POST /ingest
  - Header: X-API-Key: <API_KEY>
  - Body: multipart/form-data with field "file" (CSV)
  - Response: { "status": "ok", "path": "produce-csv/2026-03-18.csv" }
"""

import os
import re
from datetime import date

import firebase_admin
from firebase_admin import credentials, storage
from fastapi import FastAPI, File, Header, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------
API_KEY = os.environ["INGEST_API_KEY"]
SERVICE_ACCOUNT_PATH = os.environ.get(
    "FIREBASE_SERVICE_ACCOUNT", "firebase-service-account.json"
)
STORAGE_BUCKET = os.environ["FIREBASE_STORAGE_BUCKET"]  # e.g. process-6d2dc.firebasestorage.app

EXPECTED_COLUMNS = {"task", "instruction", "case quantity", "item", "notes", "check in notes"}

# ---------------------------------------------------------------------------
# Firebase init
# ---------------------------------------------------------------------------
cred = credentials.Certificate(SERVICE_ACCOUNT_PATH)
firebase_admin.initialize_app(cred, {"storageBucket": STORAGE_BUCKET})

# ---------------------------------------------------------------------------
# App
# ---------------------------------------------------------------------------
app = FastAPI(title="Produce Processor Ingest API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["POST"],
    allow_headers=["X-API-Key", "Content-Type"],
)


def _authenticate(api_key: str) -> None:
    if api_key != API_KEY:
        raise HTTPException(status_code=401, detail="Invalid API key")


def _extract_date_from_csv(content: str) -> str:
    """Try to pull date from the report header line, e.g. '2026-03-18 Produce Processing Report'.
    Falls back to today if not found."""
    match = re.search(r"(\d{4}-\d{2}-\d{2})", content[:200])
    return match.group(1) if match else date.today().isoformat()


def _validate_columns(content: str) -> None:
    """Find the header row and confirm expected columns are present."""
    for line in content.splitlines():
        line_lower = line.lower().strip().strip('"')
        if "task" in line_lower and "item" in line_lower:
            found = {col.strip().strip('"').lower() for col in line_lower.split(",")}
            missing = EXPECTED_COLUMNS - found
            if missing:
                raise HTTPException(
                    status_code=422,
                    detail=f"CSV missing expected columns: {missing}",
                )
            return
    raise HTTPException(status_code=422, detail="Could not find data header row in CSV")


@app.post("/ingest")
async def ingest(
    file: UploadFile = File(...),
    x_api_key: str = Header(...),
):
    _authenticate(x_api_key)

    content_bytes = await file.read()
    content = content_bytes.decode("utf-8", errors="replace")

    _validate_columns(content)

    report_date = _extract_date_from_csv(content)
    storage_path = f"produce-csv/{report_date}.csv"

    bucket = storage.bucket()
    blob = bucket.blob(storage_path)
    blob.upload_from_string(content_bytes, content_type="text/csv")

    return {"status": "ok", "path": storage_path, "date": report_date}


@app.get("/health")
def health():
    return {"status": "ok"}
