from typing import Optional
from pydantic import BaseModel, Field


class AadhaarCard(BaseModel):
    name: Optional[str] = Field(None, description="Full name in English")
    aadhaar_number: Optional[str] = Field(None, description="12-digit Aadhaar number")
    #vid: Optional[str] = Field(None, description="Virtual ID (VID) if present")
    gender: Optional[str] = Field(None, description="Gender/sex in English")
    date_of_birth: Optional[str] = Field(None, description="Date of birth (DD/MM/YYYY) or year")
    father_or_husband_name: Optional[str] = Field(None, description="Father's/husband's/guardian's name")
    address: Optional[str] = Field(None, description="Full address in English")
    pincode: Optional[str] = Field(None, description="6-digit PIN code")
    state: Optional[str] = Field(None, description="State if identifiable")
