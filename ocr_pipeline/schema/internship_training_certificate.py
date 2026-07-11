from typing import Optional, List
from pydantic import BaseModel, Field

class detail_comp_address(BaseModel):
    address_line: Optional[str] = Field(None, description="House/shop no., street, locality, VILLAGE, PO text not captured in the fields below, exactly as printed (e.g. 'Shop number 1&2, Court road, Near old district court')")
    state: Optional[str] = Field(None, description="State, ONLY if explicitly printed in the text")
    city_or_village: Optional[str] = Field(None, description="City, town, or village name. If explicitly marked 'VILLAGE'/'VILL', use that name.")
    pincode: Optional[str] = Field(None, description="6-digit PIN code, if present (India). For non-Indian addresses, use the equivalent postal code if present.")
    district: Optional[str] = Field(None, description="District, only if explicitly present or unambiguous in text")
    country: Optional[str] = Field(None, description="Country, if the address is outside India or explicitly stated (e.g. Norway)")

class detail_training_address(BaseModel):
    address_line: Optional[str] = Field(None, description="House/shop no., street, locality, VILLAGE, PO text not captured in the fields below, exactly as printed (e.g. 'Shop number 1&2, Court road, Near old district court')")
    state: Optional[str] = Field(None, description="State, ONLY if explicitly printed in the text")
    city_or_village: Optional[str] = Field(None, description="City, town, or village name. If explicitly marked 'VILLAGE'/'VILL', use that name.")
    pincode: Optional[str] = Field(None, description="6-digit PIN code, if present (India). For non-Indian addresses, use the equivalent postal code if present.")
    district: Optional[str] = Field(None, description="District, only if explicitly present or unambiguous in text")
    country: Optional[str] = Field(None, description="Country, if the address is outside India or explicitly stated (e.g. Norway)")


class InternshipCertificate(BaseModel):
    candidate_name: Optional[str] = Field(None, description= "Candidate's name in English")
    company_name: Optional[str] = Field(None, description="Company name in English")
    company_address: Optional[detail_comp_address] =Field(None, description="Detailed address of the company")
    training_location: Optional[detail_training_address] = Field(None, description="Location where training was done")
    training_period: Optional[str] = Field(None, description="Time period for which training was done")
    training_program: Optional[str] = Field(None, description="Type of training program, e.g.: 'F & B Production'")
    nature_of_training: Optional[str] = Field(None , description="nature of training program, e.g: 'Industrial training'.")
    
class InternshipCertificateList(BaseModel):
    certificate : List[InternshipCertificate] = Field(
        default_factory=list,
       description="One entry per distinct internship/training certificate found in the document text",
    )