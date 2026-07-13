import os
import base64
import json
import logging
import asyncio
from typing import Optional, Any, List, Dict
from mistralai.client import Mistral
from dotenv import load_dotenv
from ocr_pipeline.schema_map import SCHEMA_MAP
from ocr_pipeline.prompt_mapper import PROMPT_MAP, SYSTEM_PROMPT

load_dotenv()

log_directory = "logs"
os.makedirs(log_directory, exist_ok=True)
log_filepath = os.path.join(log_directory, "pipeline.log")

logging.basicConfig(level= logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
                    handlers=[logging.FileHandler(log_filepath),
                              logging.StreamHandler()])

logger  = logging.getLogger("ocr_pipeline")

class OCRPipeline:
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.getenv("MISTRAL_API_KEY")
        if not self.api_key:
            raise ValueError("MISTRAL_API_KEY must be set in environment or passed to constructor")
        self.client = Mistral(api_key=self.api_key)
        
        # Since 0.83 RPS is fast but 50k TPM is small, lock concurrency to 1.
        # This creates an orderly, single-file line so payloads don't stack up up over 50k tokens.
        self.semaphore = asyncio.Semaphore(1)

    async def _get_raw_ocr(self, file_content: bytes) -> str:
        """Processes the PDF/Image and returns markdown text."""
        b64_content = base64.b64encode(file_content).decode("utf-8")
        
        ocr_response = self.client.ocr.process(
            model="mistral-ocr-latest",
            document={
                "type": "document_url",
                "document_url": f"data:application/pdf;base64,{b64_content}",
            },
        )
        input_pages = len(ocr_response.pages)
        markdown_text = "\n\n".join(page.markdown for page in ocr_response.pages)
        
        return markdown_text, input_pages        
        
    async def _extract_structured_data(self, text: str, doc_types: List[str]) -> Dict[str, Any]:
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
            model="mistral-small-latest",
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT + " Output a nested JSON container mapping precisely to requested schema keys."},
                {"role": "user", "content": composite_user_prompt},
            ],
            response_format={"type": "json_object"},
            temperature=0,
        )

        raw_json = chat_response.choices[0].message.content
        extracted_json = json.loads(raw_json)
        
        # Extract token counts from response usage metadata
        input_tokens = getattr(chat_response.usage, "prompt_tokens", 0)
        total_tokens = getattr(chat_response.usage, "total_tokens", 0)
        
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

        return validated_data, input_tokens, total_tokens

    async def process(self, file_content: bytes, doc_types: List[str]):
        """Full Async pipeline processing: One OCR Call -> One LLM Compilation Multi-Extraction."""
        
        max_retries = 5
        backoff_factor = 2
        
        async with self.semaphore:
            for attempt in range(max_retries):
                try:
                    raw_text, input_pages = await self._get_raw_ocr(file_content)
                    
                    await asyncio.sleep(2)
                    structured_data, input_tokens, total_tokens =await self._extract_structured_data(raw_text, doc_types)
                    
                    logger.info(
                        f"[OCR Pipeline Metrics] Input Pages: {input_pages} |"
                        f"Input Tokens: {input_tokens} | Total Tokens: {total_tokens}"
                    )
            #         db.execute(
            #         "INSERT INTO ocr_logs (doc_types, input_pages, input_tokens, total_tokens) VALUES (%s, %s, %s, %s)",
            #         (json.dumps(doc_types), input_pages, input_tokens, total_tokens)
            #         )      
                    if total_tokens> 30000:
                        cooldown_delay = 30
                        logger.info(f"High token usage detected ({total_tokens} tokens). Throttling next file queue for {cooldown_delay}s...")
                        await asyncio.sleep(cooldown_delay)
                        
                        
                    return structured_data, raw_text, {
                        "input_pages": input_pages,
                        "input_tokens": input_tokens,
                        "total_tokens": total_tokens
                    }
                    
                except Exception as e:
                    is_rate_limit = "429" in str(e) or "too many requests" in str(e).lower()
                    
                    if is_rate_limit and attempt < max_retries - 1:
                        # Exponential cooling: 2^(1+1)=4s, 2^(2+1)=8s, etc. 
                        # We append an extra 35 seconds to ensure the sliding 60-second window resets.
                        sleep_time = (backoff_factor ** (attempt + 1)) + 35
                        logger.warning(f"Rate limit triggered (429). Resetting window for {sleep_time}s... (Attempt {attempt + 1}/{max_retries})")
                        await asyncio.sleep(sleep_time)
                    else:
                        logger.error(f"Pipeline process encountered an unrecoverable failure: {str(e)}")
                        raise e