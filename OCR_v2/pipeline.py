import os
import base64
import json
from typing import Optional, Any, List, Dict
from mistralai.client import Mistral
from dotenv import load_dotenv

from ocr_pipeline.schema_map import SCHEMA_MAP, RAW_PROFILES

load_dotenv()

SYSTEM_PROMPT = (
    "You are an expert BGV (Background Verification) document analyst. "
    "Extract fields from the provided document text and return ONLY a valid JSON object. "
    "Do NOT translate values — copy text exactly as it appears. "
    "If a field is not found or is unreadable, set it to null. "
    "Provide no preamble, no markdown formatting blocks, and no explanations — return only raw JSON."
)

class OCRPipeline:
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.getenv("MISTRAL_API_KEY")
        if not self.api_key:
            raise ValueError("MISTRAL_API_KEY must be set in environment variables.")
        self.client = Mistral(api_key=self.api_key)

    def _get_raw_ocr(self, file_content: bytes) -> str:
        """Processes the document asset strictly as a pure PDF data stream via Mistral OCR."""
        b64_content = base64.b64encode(file_content).decode("utf-8")
        
        ocr_response = self.client.ocr.process(
            model="mistral-ocr-latest",
            document={
                "type": "document_url",
                "document_url": f"data:application/pdf;base64,{b64_content}",
            },
        )
        return "\n\n".join(page.markdown for page in ocr_response.pages)

    def _extract_structured_data(self, text: str, doc_types: List[str]) -> Dict[str, Any]:
        """Programmatically synthesizes extraction rules to execute unified simultaneous extractions."""
        composite_user_prompt = (
            "You are reviewing raw extracted text from a candidate verification PDF bundle. "
            "Extract data matching the following document structural target rules simultaneously.\n\n"
        )
        expected_json_structure = {}

        for doc_type in doc_types:
            if doc_type not in RAW_PROFILES or doc_type not in SCHEMA_MAP:
                raise ValueError(f"Unsupported or unregistered document type parameter: {doc_type}")
            
            profile = RAW_PROFILES[doc_type]
            schema_class = SCHEMA_MAP[doc_type]
            
            composite_user_prompt += f"=== STRATEGY MANDATE FOR SCHEMA: {doc_type} ===\n"
            composite_user_prompt += f"Core Objective: {profile['instructions']}\n"
            composite_user_prompt += "Target Fields Definition:\n"
            
            for field_name, field_meta in profile.get("fields", {}).items():
                composite_user_prompt += f" - {field_name} (Expected Type: {field_meta['type']}): {field_meta['description']}\n"
            
            composite_user_prompt += "\n"
            
            expected_json_structure[doc_type] = {
                field: "Extracted value matching definition, or null" 
                for field in schema_class.model_fields.keys()
            }

        composite_user_prompt += (
            f"Provide your response as a single valid nested JSON object matching this structural container layout exactly:\n"
            f"{json.dumps(expected_json_structure, indent=2)}\n\n"
            f"Here is the raw document verification text to process:\n"
            f"\"\"\"\n{text}\n\"\"\""
        )

        chat_response = self.client.chat.complete(
            model="mistral-small-latest",
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": composite_user_prompt},
            ],
            response_format={"type": "json_object"},
            temperature=0,
        )

        raw_json = chat_response.choices[0].message.content
        extracted_json = json.loads(raw_json)
        
        validated_data = {}
        for doc_type in doc_types:
            schema_data = extracted_json.get(doc_type, {})
            try:
                # Re-validate against dynamic model layout parameters
                validated_data[doc_type] = SCHEMA_MAP[doc_type](**schema_data).model_dump()
            except Exception as e:
                # Isolated parsing failures caught cleanly per document type schema block
                validated_data[doc_type] = {
                    "error": "Structural schema validation failed",
                    "details": str(e),
                    "raw_fallback": schema_data
                }

        return validated_data

    def process(self, file_content: bytes, doc_types: List[str]):
        """Executes full multi-extraction workflow logic sequences."""
        raw_text = self._get_raw_ocr(file_content)
        structured_data = self._extract_structured_data(raw_text, doc_types)
        return structured_data, raw_text