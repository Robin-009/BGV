from fastapi import FastAPI, UploadFile, File, HTTPException, Form
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from ocr_pipeline.pipeline import OCRPipeline
from ocr_pipeline.schema_map import SCHEMA_MAP
from typing import List, Dict, Any
import uvicorn
import json
import os

app = FastAPI(title="Production OCR Pipeline", description="Mistral-powered OCR and Structured Multi-Extraction")

current_dir = os.path.dirname(os.path.abspath(__file__))
static_dir = os.path.join(current_dir, "static")
os.makedirs(static_dir, exist_ok=True)

app.mount("/static", StaticFiles(directory=static_dir), name="static")

pipeline = OCRPipeline()

def normalize_doc_types(raw_doc_types: Any) -> List[str]:
    if not isinstance(raw_doc_types, list):
        raise ValueError("doc_types must be a JSON array list.")

    normalized: List[str] = []
    for item in raw_doc_types:
        if isinstance(item, str):
            doc_type = item.strip()
        elif isinstance(item, dict):
            doc_type = (
                item.get("value")
                or item.get("doc_type")
                or item.get("name")
                or item.get("key")
                or ""
            ).strip()
        else:
            doc_type = str(item).strip() if item is not None else ""

        if doc_type:
            normalized.append(doc_type)

    if not normalized:
        raise ValueError("doc_types must contain at least one valid document type.")

    return normalized


def parse_doc_types_input(doc_types: str) -> List[str]:
    raw_value = (doc_types or "").strip()
    if not raw_value:
        raise ValueError(
            "doc_types is required. In Swagger UI, enter a JSON array like [\"passport\", \"pan_card\"] or a comma-separated list like passport, pan_card."
        )

    try:
        parsed_value = json.loads(raw_value)
    except json.JSONDecodeError:
        parsed_value = [item.strip() for item in raw_value.split(",") if item.strip()]

    return normalize_doc_types(parsed_value)

#un-comment this 
# @app.get("/")
# async def root():
#     return {"message": "API is running"}


@app.get("/") #---COMMENT OUT THIS WHEN RUNNING IN MAIN FRONTEND
async def read_index():
    return FileResponse(os.path.join(static_dir, "index.html")) ##this is for testing 

@app.get("/schemas", response_model=List[str])
def list_available_schemas():
    return list(SCHEMA_MAP.keys())

@app.get("/schema-fields/{doc_type}", response_model=List[str])
def get_schema_fields(doc_type: str):
    if doc_type not in SCHEMA_MAP:
        raise HTTPException(status_code=400, detail=f"Unknown document type: {doc_type}")
    
    schema_class = SCHEMA_MAP[doc_type]
    return list(schema_class.model_fields.keys())

@app.post("/extract")
async def extract_document(
    doc_types: str = Form(..., description="JSON string array of document types (e.g., '[\"passport\", \"marriage\"]')"),
    file: UploadFile = File(...)
):
    if file.content_type not in ["application/pdf", "image/jpeg", "image/png"]:
        raise HTTPException(status_code=400, detail="Invalid file type. Only PDF and Images (JPEG/PNG) are supported.")

    try:
        # Parse the incoming form field from Swagger UI or the frontend.
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
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")

@app.get("/health")
def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)