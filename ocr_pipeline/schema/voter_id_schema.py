from typing import Optional
from pydantic import BaseModel, Field

class detail_voter_address(BaseModel):
    address_line: Optional[str] = Field(None, description="House no./street/locality/village text not captured in the fields below, exactly as printed")
    state: Optional[str] = Field(None, description="State, ONLY if explicitly printed in the text")
    city_or_village: Optional[str] = Field(None, description="City, town, or village name, if identifiable")
    pincode: Optional[str] = Field(None, description="6-digit PIN code, if present")
    district: Optional[str] = Field(None, description="District, only if explicitly present or unambiguous in text")


class VoterIDCard(BaseModel):
    name: Optional[str] = Field(None, description="Full name in English")
    epic_number: Optional[str] = Field(None, description="EPIC number / Voter ID number as printed")
    gender: Optional[str] = Field(None, description="Gender/sex in English")
    date_of_birth: Optional[str] = Field(None, description="Date of birth (DD/MM/YYYY), if printed")
    relation_name: Optional[str] = Field(None, description="Father's/mother's/husband's name as printed")
    relation_type: Optional[str] = Field(None, description="Relation prefix: Father, Husband, Mother, Guardian, etc.")

    #address of voter
    voter_address: Optional[detail_voter_address] = Field(None, description="Detailed address of the voter")

    # --- Electoral details ---
    assembly_constituency: Optional[str] = Field(None, description="Assembly Constituency (AC) name and/or number")
    issue_date: Optional[str] = Field(None, description="Date of issue, if printed")