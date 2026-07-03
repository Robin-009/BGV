from typing import Optional
from pydantic import BaseModel, Field


class BirthCertificate(BaseModel):
    child_name: Optional[str] = Field(None, description="Child's name in English")
    gender: Optional[str] = Field(None, description="Child's gender/sex in English")
    date_of_birth: Optional[str] = Field(None, description="Date of birth in English (DD/MM/YYYY)")
    place_of_birth: Optional[str] = Field(None, description="Place of birth in English")
    father_name: Optional[str] = Field(None, description="Father's name in English")
    mother_name: Optional[str] = Field(None, description="Mother's name in English")
    parents_address: Optional[str] = Field(None, description="Parents' address in English")
    registration_number: Optional[str] = Field(None, description="Birth registration number as printed on the certificate")