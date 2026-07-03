from typing import Optional, Dict, Type
from pydantic import BaseModel, Field
from ocr_pipeline.schema.birthcert import BirthCertificate
from ocr_pipeline.schema.cv import CVBackgroundCheck
from ocr_pipeline.schema.marriage import MarriageRecord
from ocr_pipeline.schema.passport import PassportRecord
from ocr_pipeline.schema.employment_cert import EmploymentCertificate
from ocr_pipeline.schema.transfer_certificate import TransferCertificate

class OCRProcessResponse(BaseModel):
    document_type: str
    extracted_data: Dict
    raw_ocr_text: Optional[str] = None

# Registry for mapping keys to schemas
SCHEMA_MAP: Dict[str, Type[BaseModel]] = {
    "birth_certificate": BirthCertificate,
    "cv_bgv": CVBackgroundCheck,
    "marriage": MarriageRecord,
    "passport": PassportRecord,
    "employment_certificate": EmploymentCertificate,
    "transfer_certificate": TransferCertificate
}
