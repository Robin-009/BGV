from typing import Optional, List
from pydantic import BaseModel, Field


class detail_company_address(BaseModel):
    address_line: Optional[str] = Field(None, description="House/shop no., street, locality, VILLAGE, PO text not captured in the fields below, exactly as printed (e.g. 'Shop number 1&2, Court road, Near old district court')")
    state: Optional[str] = Field(None, description="State, ONLY if explicitly printed in the text")
    city_or_village: Optional[str] = Field(None, description="City, town, or village name. If explicitly marked 'VILLAGE'/'VILL', use that name.")
    pincode: Optional[str] = Field(None, description="6-digit PIN code, if present (India). For non-Indian addresses, use the equivalent postal code if present.")
    district: Optional[str] = Field(None, description="District, only if explicitly present or unambiguous in text")
    country: Optional[str] = Field(None, description="Country, if the address is outside India or explicitly stated (e.g. Norway)")


class EmploymentCertificate(BaseModel):
    candidate_name: Optional[str] = Field(None, description="Candidate's name in English")
    company_name: Optional[str] = Field(None, description="Company name in English")
    company_address: Optional[detail_company_address] = Field(None, description="Detailed address of the company")
    company_telephone: Optional[str] = Field(None, description="Company telephone number if available")
    employee_id: Optional[str] = Field(None, description="Employee ID if available")
    period_of_employment: Optional[str] = Field(None, description="Period of employment in English (DD Month YYYY – DD Month YYYY)")
    designation: Optional[str] = Field(None, description="Employee's designation in English")
    authority_name: Optional[str] = Field(None, description="Issuing authority (HR Manager / Employer) name in English")


class EmploymentCertificateList(BaseModel):
    certificates: List[EmploymentCertificate] = Field(
        default_factory=list,
        description="One entry per distinct employment/experience certificate found in the document text",
    )