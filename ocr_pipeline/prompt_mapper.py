from typing import Dict
from ocr_pipeline.prompt.aadhaar_card_prompt import AADHAAR_CARD_PROMPT
from ocr_pipeline.prompt.birthcert_prompt import BIRTH_CERTIFICATE_PROMPT
from ocr_pipeline.prompt.cv_prompt import CV_BACKGROUND_CHECK_PROMPT
from ocr_pipeline.prompt.driving_licence_prompt import DRIVING_LICENCE_PROMPT
from ocr_pipeline.prompt.marriage_prompt import MARRIAGE_RECORD_PROMPT
from ocr_pipeline.prompt.pan_card_prompt import PAN_CARD_PROMPT
from ocr_pipeline.prompt.passport_prompt import PASSPORT_PROMPT
from ocr_pipeline.prompt.employment_cert_prompt import EMPLOYMENT_CERTIFICATE_PROMPT
from ocr_pipeline.prompt.tenth_marksheet_prompt import TENTH_MARKSHEET_PROMPT
from ocr_pipeline.prompt.transfer_certificate import TRANSFER_CERTIFICATE_PROMPT
from ocr_pipeline.prompt.twelfth_marksheet_prompt import TWELFTH_MARKSHEET_PROMPT

SYSTEM_PROMPT = (
    "You are an expert BGV (Background Verification) document analyst. "
    "Extract fields from the document text and return ONLY a valid JSON object. "
    "Do NOT translate — copy text exactly as it appears unless specified. "
    "If a field is not found, set it to null. "
    "No explanation, no markdown, just the JSON."
)


PROMPT_MAP: Dict[str, str] = {
    "aadhaar_card": AADHAAR_CARD_PROMPT,
    "birth_certificate": BIRTH_CERTIFICATE_PROMPT,
    "cv_bgv" : CV_BACKGROUND_CHECK_PROMPT,
    "driving_licence": DRIVING_LICENCE_PROMPT,
    "marriage": MARRIAGE_RECORD_PROMPT,
    "pan_card": PAN_CARD_PROMPT,
    "passport": PASSPORT_PROMPT,
    "employment_certificate": EMPLOYMENT_CERTIFICATE_PROMPT,
    "tenth_marksheet": TENTH_MARKSHEET_PROMPT,
    "transfer_certificate": TRANSFER_CERTIFICATE_PROMPT,
    "twelfth_marksheet": TWELFTH_MARKSHEET_PROMPT,
}
