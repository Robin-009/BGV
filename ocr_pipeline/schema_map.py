from typing import Optional, Dict, Type
from pydantic import BaseModel, Field
from ocr_pipeline.schema.aadhaar_card_schema import AadhaarCard
from ocr_pipeline.schema.birthcert import BirthCertificate
from ocr_pipeline.schema.cv import CVBackgroundCheck
from ocr_pipeline.schema.driving_licence_schema import DrivingLicence
from ocr_pipeline.schema.marriage import MarriageRecord
from ocr_pipeline.schema.pan_card_schema import PanCard
from ocr_pipeline.schema.passport import PassportRecord
from ocr_pipeline.schema.employment_cert import EmploymentCertificateList, EmploymentCertificate
from ocr_pipeline.schema.tenth_marksheet_schema import TenthMarksheet
from ocr_pipeline.schema.transfer_certificate import TransferCertificate
from ocr_pipeline.schema.twelfth_marksheet_schema import TwelfthMarksheet

class OCRProcessResponse(BaseModel):
    document_type: str
    extracted_data: Dict
    raw_ocr_text: Optional[str] = None

# Registry for mapping keys to schemas
SCHEMA_MAP: Dict[str, Type[BaseModel]] = {
    "aadhaar_card": AadhaarCard,
    "birth_certificate": BirthCertificate,
    "cv_bgv": CVBackgroundCheck,
    "driving_licence": DrivingLicence,
    "marriage": MarriageRecord,
    "pan_card": PanCard,
    "passport": PassportRecord,
    "employment_certificate": EmploymentCertificateList,
    "tenth_marksheet": TenthMarksheet,
    "transfer_certificate": TransferCertificate,
    "twelfth_marksheet": TwelfthMarksheet,
}
