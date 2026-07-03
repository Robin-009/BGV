from typing import Optional
from pydantic import BaseModel, Field


class EmploymentCertificate(BaseModel):
    candidate_name: Optional[str] = Field(None, description="Candidate's name in English")
    company_name: Optional[str] = Field(None, description="Company name in English")
    company_address: Optional[str] = Field(None, description="Company full address in English (Street, City, PIN)")
    company_telephone: Optional[str] = Field(None, description="Company telephone number if available")
    employee_id: Optional[str] = Field(None, description="Employee ID if available")
    period_of_employment: Optional[str] = Field(None, description="Period of employment in English (DD Month YYYY – DD Month YYYY)")
    designation: Optional[str] = Field(None, description="Employee's designation in English")
    authority_name: Optional[str] = Field(None, description="Issuing authority (HR Manager / Employer) name in English")