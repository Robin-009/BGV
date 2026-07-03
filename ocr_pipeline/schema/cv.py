from typing import Optional, List
from pydantic import BaseModel, Field

class Address(BaseModel):
    address_type: Optional[str] = Field(None, description="'Current' or 'Permanent'")
    complete_address: Optional[str] = Field(None, description="The full address string")
    city: Optional[str] = None
    state: Optional[str] = None
    pin_code: Optional[str] = None
    period_of_stay: Optional[str] = Field(None, description="Start date/year or 'Since birth' to End date/'Till now'")
    nature_of_residence: Optional[str] = Field(None, description="e.g., Own House, Rental, PG")

class Reference(BaseModel):
    name: Optional[str] = None
    company_designation: Optional[str] = None
    contact_number: Optional[str] = None
    email_id: Optional[str] = None
    acquainted_since: Optional[str] = None
    investigator_findings: Optional[str] = Field(None, description="Comments on integrity, honesty, reliability")

class IdentityProof(BaseModel):
    document_type: Optional[str] = Field(None, description="e.g., Aadhaar, PAN, Driving License, Passport")
    id_number: Optional[str] = Field(None, description="The alphanumeric identifier")
    validity_expiry_date: Optional[str] = None
    place_of_issue: Optional[str] = None

class CourtCase(BaseModel):
    jurisdiction: Optional[str] = Field(None, description="The court name or location")
    case_title: Optional[str] = Field(None, description="e.g., State v. Tushar")
    case_number: Optional[str] = Field(None, description="e.g., CRM/2631/2026")
    case_status: Optional[str] = Field(None, description="e.g., Pending, Disposed")

class CVBackgroundCheck(BaseModel):

    # Personal Details
    full_name: Optional[str] = None
    father_name: Optional[str] = None
    mother_name: Optional[str] = None
    spouse_name: Optional[str] = None
    date_of_birth: Optional[str] = Field(None, description="DD/MM/YYYY")
    nationality: Optional[str] = None
    phone_number: Optional[str] = None
    criminal_record_declaration: Optional[bool] = Field(None, description="True if 'Yes' to criminal offense declaration")
    
    # Nested Entities
    addresses: List[Address] = Field(default_factory=list)
    references: List[Reference] = Field(default_factory=list)
    identity_proofs: List[IdentityProof] = Field(default_factory=list)
    court_cases: List[CourtCase] = Field(default_factory=list)
    