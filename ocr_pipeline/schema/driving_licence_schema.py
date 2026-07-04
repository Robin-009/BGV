from typing import Optional, List
from pydantic import BaseModel, Field


class DrivingLicence(BaseModel):
    holder_name: Optional[str] = Field(None, description="Licence holder's name in English")
    licence_number: Optional[str] = Field(None, description="Driving licence number as printed")
    date_of_birth: Optional[str] = Field(None, description="Date of birth (DD/MM/YYYY)")
    #gender: Optional[str] = Field(None, description="Gender/sex in English")
    blood_group: Optional[str] = Field(None, description="Blood group if present")
    father_or_guardian_name: Optional[str] = Field(None, description="Father's/guardian's name in English")
    address: Optional[str] = Field(None, description="Full address in English")
    issuing_authority: Optional[str] = Field(None, description="Issuing RTO/authority name")
    state: Optional[str] = Field(None, description="State of issue")
    date_of_issue: Optional[str] = Field(None, description="Date of issue (DD/MM/YYYY)")
    #valid_from: Optional[str] = Field(None, description="Valid-from date (DD/MM/YYYY)")
    valid_till: Optional[str] = Field(None, description="Valid until/expiry date (DD/MM/YYYY)")
    vehicle_classes: List[str] = Field(default_factory=list, description="Authorized vehicle classes/COV")
