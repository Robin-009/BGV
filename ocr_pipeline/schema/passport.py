from typing import Optional
from pydantic import BaseModel, Field

class PassportRecord(BaseModel):
    # Primary Document Details
    passport_number: Optional[str] = Field(None, description="The unique alphanumeric passport number")
    country_code: Optional[str] = Field(None, description="Issuing country code (e.g., IND, USA)")
    nationality: Optional[str] = Field(None, description="Nationality of the passport holder")
    
    # Personal Details
    surname: Optional[str] = Field(None, description="Last name or surname of the holder")
    given_name: Optional[str] = Field(None, description="First and middle names of the holder")
    gender: Optional[str] = Field(None, description="Gender/Sex (e.g., M, F, X)")
    date_of_birth: Optional[str] = Field(None, description="Date of birth (DD/MM/YYYY)")
    place_of_birth: Optional[str] = Field(None, description="City, State, or Country of birth")
    
    # Family Details
    father_name: Optional[str] = Field(None, description="Legal father's full name")
    mother_name: Optional[str] = Field(None, description="Legal mother's full name")
    spouse_name: Optional[str] = Field(None, description="Spouse's full name, if endorsed/printed")
    
    # Validity & Issuance
    date_of_issue: Optional[str] = Field(None, description="Date the passport was issued (DD/MM/YYYY)")
    date_of_expiry: Optional[str] = Field(None, description="Date the passport expires/validity end date (DD/MM/YYYY)")
    place_of_issue: Optional[str] = Field(None, description="Issuing authority or location")
    file_number: Optional[str] = Field(None, description="Official file or reference number usually found on the back page")
    
    # Contact Details
    address: Optional[str] = Field(None, description="The full printed address of the passport holder")
    pincode: Optional[str] = Field(None, description="6-digit PIN code")
    district: Optional[str] = Field(None, description="District if identifiable")
    city_or_village: Optional[str] = Field(None, description="City or village if identifiable")
    state: Optional[str] = Field(None, description="State if identifiable")
