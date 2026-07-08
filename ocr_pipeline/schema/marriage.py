from typing import Optional, List
from pydantic import BaseModel, Field

class Witness(BaseModel):
    name: Optional[str] = Field(None, description="Full name of the witness")
    address: Optional[str] = Field(None, description="Address of the witness, if provided")

class detail_office_address(BaseModel):
    address_line: Optional[str] = Field(None, description="Building/street/locality/area text not captured in the fields below, exactly as printed")
    city_or_village: Optional[str] = Field(None, description="City, town, or village of the registrar office, if identifiable")
    district: Optional[str] = Field(None, description="District, only if explicitly present or unambiguous in text")
    state: Optional[str] = Field(None, description="State, ONLY if explicitly printed in the text")
    pincode: Optional[str] = Field(None, description="6-digit PIN code, if present")

class MarriageRecord(BaseModel):
    # Essential Details
    spouse1_name: Optional[str] = Field(None, description="Full name of First spouse")
    spouse2_name: Optional[str] = Field(None, description="Full name of Second spouse")
    
    
    # Event Details
    date_of_marriage: Optional[str] = Field(None, description="Date the marriage took place (DD/MM/YYYY)")
    place_of_marriage: Optional[str] = Field(None, description="Venue, city, or full address where the marriage was solemnized")
    registrar_office: Optional[str] = Field(None, description="Registrar office / institution name in English — name only, not the address")
    date_of_registration: Optional[str] = Field(None, description="Date the certificate was officially issued/registered")
    office_address: Optional[detail_office_address] = Field(None, description="Detailed address of the registrar office")
    certificate_number: Optional[str] = Field(None, description="Marriage certificate number as printed on the certificate")
    
    witnesses: Optional[List[Witness]] = Field(default_factory=list, description="List of witnesses present at the marriage")