from typing import Optional
from pydantic import BaseModel, Field


class PanCard(BaseModel):
    name: Optional[str] = Field(None, description="Cardholder's name in English")
    pan_number: Optional[str] = Field(None, description="10-character PAN number")
    date_of_birth: Optional[str] = Field(None, description="Date of birth (DD/MM/YYYY)")
    father_name: Optional[str] = Field(None, description="Father's name in English")
