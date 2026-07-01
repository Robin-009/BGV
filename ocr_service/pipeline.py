import os
import base64
import json
from typing import Optional, Any

from mistralai.client import Mistral
from dotenv import load_dotenv

from schema import SCHEMA_MAP
from prompt import PROMPT_MAP, SYSTEM_PROMPT

load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '..', '.env'))


class OCRPipeline:
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.getenv("MISTRAL_API_KEY")
        if not self.api_key:
            raise ValueError("MISTRAL_API_KEY must be set in .env or passed to constructor")
        self.client = Mistral(api_key=self.api_key)

    def _get_raw_ocr(self, file_content: bytes, mime_type: str = "application/pdf") -> str:
        b64 = base64.b64encode(file_content).decode("utf-8")
        data_url = f"data:{mime_type};base64,{b64}"

        if "pdf" in mime_type:
            doc_payload = {"type": "document_url", "document_url": data_url}
        else:
            doc_payload = {"type": "image_url", "image_url": data_url}

        ocr_response = self.client.ocr.process(
            model="mistral-ocr-latest",
            document=doc_payload,
        )
        return "\n\n".join(page.markdown for page in ocr_response.pages)

    def _extract_structured(self, text: str, doc_type: str) -> Any:
        if doc_type not in PROMPT_MAP or doc_type not in SCHEMA_MAP:
            raise ValueError(f"Unsupported document type: '{doc_type}'. "
                             f"Available: {list(SCHEMA_MAP.keys())}")

        schema_class = SCHEMA_MAP[doc_type]
        prompt = PROMPT_MAP[doc_type].format(text=text)

        resp = self.client.chat.complete(
            model="mistral-small-latest",
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user",   "content": prompt},
            ],
            response_format={"type": "json_object"},
            temperature=0,
        )
        data = json.loads(resp.choices[0].message.content)
        return schema_class(**data)

    def process(self, file_content: bytes, doc_type: str,
                mime_type: str = "application/pdf"):
        raw_text  = self._get_raw_ocr(file_content, mime_type)
        structured = self._extract_structured(raw_text, doc_type)
        return structured, raw_text
