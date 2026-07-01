import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi import FastAPI, UploadFile, File, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware

from pipeline import OCRPipeline
from schema import OCRProcessResponse, SCHEMA_MAP

app = FastAPI(title="BGV OCR Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

ALLOWED_MIME = {"application/pdf", "image/jpeg", "image/png", "image/webp"}

_pipeline = None

def get_pipeline():
    global _pipeline
    if _pipeline is None:
        _pipeline = OCRPipeline()
    return _pipeline


@app.get("/health")
def health():
    import os
    key_set = bool(os.getenv("MISTRAL_API_KEY"))
    return {"status": "ok", "service": "bgv-ocr", "api_key_set": key_set}


@app.get("/schemas")
def list_schemas():
    return list(SCHEMA_MAP.keys())


@app.post("/extract", response_model=OCRProcessResponse)
async def extract(
    doc_type: str = Form(..., description="e.g. birth_certificate, passport, pan_card"),
    file: UploadFile = File(...),
):
    if file.content_type not in ALLOWED_MIME:
        raise HTTPException(400, f"Unsupported file type: {file.content_type}")
    if doc_type not in SCHEMA_MAP:
        raise HTTPException(
            400,
            f"Unknown doc_type '{doc_type}'. Available: {list(SCHEMA_MAP.keys())}"
        )
    try:
        content = await file.read()
        structured, raw_text = get_pipeline().process(content, doc_type, file.content_type)
        return OCRProcessResponse(
            document_type=doc_type,
            extracted_data=structured.model_dump(),
            raw_ocr_text=raw_text,
        )
    except ValueError as e:
        raise HTTPException(400, str(e))
    except Exception as e:
        raise HTTPException(500, f"OCR failed: {e}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001, reload=False)
