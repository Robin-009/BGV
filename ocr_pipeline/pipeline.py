import os
import base64
import json
from typing import Optional, Any, List, Dict
from mistralai.client import Mistral
from dotenv import load_dotenv
from ocr_pipeline.schema_map import SCHEMA_MAP
from ocr_pipeline.prompt_mapper import PROMPT_MAP, SYSTEM_PROMPT

load_dotenv()

class OCRPipeline:
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.getenv("MISTRAL_API_KEY")
        if not self.api_key:
            raise ValueError("MISTRAL_API_KEY must be set in environment or passed to constructor")
        self.client = Mistral(api_key=self.api_key)

    def _get_raw_ocr(self, file_content: bytes) -> str:
        """Processes the PDF/Image and returns markdown text."""
        b64_content = base64.b64encode(file_content).decode("utf-8")
        
        ocr_response = self.client.ocr.process(
            model="mistral-ocr-2512",
            document={
                "type": "document_url",
                "document_url": f"data:application/pdf;base64,{b64_content}",
            },
        )
        
        return "\n\n".join(page.markdown for page in ocr_response.pages)

    def _extract_structured_data(self, text: str, doc_types: List[str]) -> Dict[str, Any]:
        """Uses a single LLM call to extract multiple schemas simultaneously from the OCR text."""
        
        composite_user_prompt = (
            "You are reviewing text from a document. Extract data matching the following structures simultaneously. "
            "If components are missing for a given schema, return empty values/null elements for those fields.\n\n"
        )
        expected_json_structure = {}

        # Synthesize instructions and sample targets dynamically 
        for doc_type in doc_types:
            if doc_type not in PROMPT_MAP or doc_type not in SCHEMA_MAP:
                raise ValueError(f"Unsupported document type: {doc_type}")
            
            schema_fields = list(SCHEMA_MAP[doc_type].model_fields.keys())
            
            composite_user_prompt += f"=== EXTRACTION COMMAND FOR SCHEMA: {doc_type} ===\n"
            composite_user_prompt += f"{PROMPT_MAP[doc_type].format(text='[See text appended below]')}\n\n"
            
            # Map out an explicit structure shape blueprint for the LLM to fill
            expected_json_structure[doc_type] = {field: "value or null" for field in schema_fields}

        # Wrap down rules and define structural object keys
        composite_user_prompt += (
            f"Provide your response as a single valid nested JSON object matching this structure layout:\n"
            f"{json.dumps(expected_json_structure, indent=2)}\n\n"
            f"Here is the raw document text to process:\n{text}"
        )

        # Fire unified payload execution
        chat_response = self.client.chat.complete(
            model="mistral-small-2603",
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT + " Output a nested JSON container mapping precisely to requested schema keys."},
                {"role": "user", "content": composite_user_prompt},
            ],
            response_format={"type": "json_object"},
            temperature=0,
        )

        raw_json = chat_response.choices[0].message.content
        extracted_json = json.loads(raw_json)
        
        # Cross validate schemas and output cleanly 
        validated_data = {}
        for doc_type in doc_types:
            schema_data = extracted_json.get(doc_type, {})
            try:
                # Re-validate with Pydantic class map parameters to ensure clean formatting
                validated_data[doc_type] = SCHEMA_MAP[doc_type](**schema_data).model_dump()
            except Exception:
                # Graceful fallback: return the raw dictionary segment if minor schema validation fails
                validated_data[doc_type] = schema_data

        return validated_data

    def process(self, file_content: bytes, doc_types: List[str]):
        """Full pipeline processing: One OCR Call -> One LLM Compilation Multi-Extraction."""
        raw_text = self._get_raw_ocr(file_content)
        structured_data = self._extract_structured_data(raw_text, doc_types)
        return structured_data, raw_text