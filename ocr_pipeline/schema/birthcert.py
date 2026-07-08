from typing import Optional
from pydantic import BaseModel, Field

class detail_office_address(BaseModel):
    address_line: Optional[str] = Field(None, description="Building/street/locality/area text not captured in the fields below, exactly as printed")
    city_or_village: Optional[str] = Field(None, description="City, town, or village of the registration office, if identifiable")
    district: Optional[str] = Field(None, description="District, only if explicitly present or unambiguous in text")
    state: Optional[str] = Field(None, description="State, ONLY if explicitly printed in the text")
    pincode: Optional[str] = Field(None, description="6-digit PIN code, if present")


class BirthCertificate(BaseModel):
    child_name: Optional[str] = Field(None, description="Child's name in English")
    gender: Optional[str] = Field(None, description="Child's gender/sex in English")
    date_of_birth: Optional[str] = Field(None, description="Date of birth in English (DD/MM/YYYY)")
    place_of_birth: Optional[str] = Field(None, description="Place of birth in English")
    father_name: Optional[str] = Field(None, description="Father's name in English")
    mother_name: Optional[str] = Field(None, description="Mother's name in English")
    parents_address: Optional[str] = Field(None, description="Parents' address in English")
    registration_number: Optional[str] = Field(None, description="Birth registration number as printed on the certificate")

    # Registration office details
    registration_office: Optional[str] = Field(None, description="Only the name of the registration office/authority (e.g. Municipal Corporation) — do not include address here")
    registration_office_address: Optional[detail_office_address] = Field(None, description="Detailed address of the registration office")