from typing import Optional
from pydantic import BaseModel, Field


class TransferCertificate(BaseModel):
    candidate_name: Optional[str] = Field(None, description="Candidate's name in English")
    father_name: Optional[str] = Field(None, description="Father's name in English")
    mother_name: Optional[str] = Field(None, description="Mother's name in English")
    date_of_birth: Optional[str] = Field(None, description="Date of birth in English (DD/MM/YYYY)")
    school_name: Optional[str] = Field(None, description="School name in English")
    school_address: Optional[str] = Field(None, description="School address in English (City, State)")
    date_of_leaving: Optional[str] = Field(None, description="Date of leaving in English, e.g. '31ST MARCH 2003'")
    roll_number: Optional[str] = Field(None, description="Roll number / admission number as printed on the certificate")