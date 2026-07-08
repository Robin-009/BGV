from typing import Optional
from pydantic import BaseModel, Field

class detail_school_address(BaseModel):
    address_line: Optional[str] = Field(None, description="Locality/village/area text not captured in the fields below, exactly as printed (e.g. 'VILL ANANDPURAM, KALYANPUR')")
    state: Optional[str] = Field(None, description="State, ONLY if explicitly printed in the text")
    city_or_village: Optional[str] = Field(None, description="City or village of the school, if identifiable")
    pincode: Optional[str] = Field(None, description="6-digit PIN code, if present")
    district: Optional[str] = Field(None, description="District, only if explicitly present or unambiguous in text")


class TransferCertificate(BaseModel):
    candidate_name: Optional[str] = Field(None, description="Candidate's name in English")
    father_name: Optional[str] = Field(None, description="Father's name in English")
    mother_name: Optional[str] = Field(None, description="Mother's name in English")
    date_of_birth: Optional[str] = Field(None, description="Date of birth in English (DD/MM/YYYY)")

    school_name: Optional[str] = Field(None, description="Only the institution's name — do not include address, village, or location text here")
    school_address: Optional[detail_school_address] = Field(None, description="Detailed address of the school")

    date_of_leaving: Optional[str] = Field(None, description="Date of leaving in English, e.g. '31ST MARCH 2003'")
    roll_number: Optional[str] = Field(None, description="Roll number / admission number as printed on the certificate")