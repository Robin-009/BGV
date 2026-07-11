from fastapi import FastAPI, UploadFile, File, HTTPException, Form
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from ocr_pipeline.pipeline import OCRPipeline
from ocr_pipeline.schema_map import SCHEMA_MAP
from typing import List, Dict, Any
import uvicorn
import json
import os

app = FastAPI(title="Production PDF OCR Pipeline", description="Metadata-Driven Exclusive PDF Multi-Extraction Engine")

current_dir = os.path.dirname(os.path.abspath(__file__))
static_dir = os.path.join(current_dir, "static")
os.makedirs(static_dir, exist_ok=True)

app.mount("/static", StaticFiles(directory=static_dir), name="static")

pipeline = OCRPipeline()

# Maps alternative request queries safely to their exact configuration keys
KEY_NORMALIZATION_MAP = {
    "cv": "cv_bgv",
    "resume": "cv_bgv",
    "cv_bgv": "cv_bgv",
    "aadhaar": "aadhaar_card",
    "aadhaar_card": "aadhaar_card",
    "pan": "pan_card",
    "pan_card": "pan_card",
    "birth_certificate": "birth_certificate",
    "birthcert": "birth_certificate",
    "driving_licence": "driving_licence",
    "dl": "driving_licence",
    "marriage": "marriage",
    "marriage_record": "marriage",
    "employment_certificate": "employment_certificate",
    "employment_cert": "employment_certificate",
    "internship_certificate": "internship_certificate",
    "internship_cert": "internship_certificate",
    "tenth_marksheet": "tenth_marksheet",
    "10th_marksheet": "tenth_marksheet",
    "twelfth_marksheet": "twelfth_marksheet",
    "12th_marksheet": "twelfth_marksheet",
    "transfer_certificate": "transfer_certificate",
    "tc": "transfer_certificate",
    "voter_id": "voter_id",
    "voterid": "voter_id"
}

def normalize_doc_types(raw_doc_types: Any) -> List[str]:
    if not isinstance(raw_doc_types, list):
        raise ValueError("doc_types must be a JSON array list.")

    normalized: List[str] = []
    for item in raw_doc_types:
        if isinstance(item, str):
            doc_type = item.strip().lower()
        elif isinstance(item, dict):
            doc_type = (item.get("value") or item.get("doc_type") or item.get("key") or "").strip().lower()
        else:
            doc_type = str(item).strip().lower()

        mapped_type = KEY_NORMALIZATION_MAP.get(doc_type, doc_type)
        if mapped_type and mapped_type not in normalized:
            normalized.append(mapped_type)

    if not normalized:
        raise ValueError("doc_types must contain at least one valid document type selection.")

    return normalized

def parse_doc_types_input(doc_types: str) -> List[str]:
    raw_value = (doc_types or "").strip()
    if not raw_value:
        raise ValueError("doc_types input parameter options are explicitly required.")

    try:
        parsed_value = json.loads(raw_value)
    except json.JSONDecodeError:
        parsed_value = [item.strip() for item in raw_value.split(",") if item.strip()]

    return normalize_doc_types(parsed_value)

@app.get("/")
async def read_index():
    # Production endpoint route sandboxing protection
    if os.getenv("ENV") == "production":
        return {"status": "running", "mode": "production"}
    return FileResponse(os.path.join(static_dir, "index.html"))

@app.get("/schemas", response_model=List[str])
def list_available_schemas():
    return list(SCHEMA_MAP.keys())

@app.get("/schema-fields/{doc_type}", response_model=List[str])
def get_schema_fields(doc_type: str):
    normalized_type = KEY_NORMALIZATION_MAP.get(doc_type.lower(), doc_type.lower())
    if normalized_type not in SCHEMA_MAP:
        raise HTTPException(status_code=400, detail=f"Unknown or unconfigured document type: {doc_type}")
    
    schema_class = SCHEMA_MAP[normalized_type]
    return list(schema_class.model_fields.keys())

@app.post("/extract")
async def extract_document(
    doc_types: str = Form(..., description="JSON string array list of targets (e.g. '[\"pan\", \"aadhaar\"]')"),
    file: UploadFile = File(...)
):
    # Enforce strict PDF verification boundaries across incoming file payloads
    if file.content_type != "application/pdf" or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=400, 
            detail="Invalid file type format. This specialized pipeline exclusively accepts PDF documents."
        )

    try:
        parsed_doc_types = parse_doc_types_input(doc_types)
        content = await file.read()
        
        structured_data, raw_text = pipeline.process(content, parsed_doc_types)
        
        return {
            "document_types": parsed_doc_types,
            "extracted_data": structured_data,
            "raw_ocr_text": raw_text
        }
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal Server Processing Failure: {str(e)}")

@app.get("/health")
def health_check():
    return {"status": "healthy", "mode": "pdf_exclusive"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)