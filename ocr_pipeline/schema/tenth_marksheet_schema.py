from typing import Optional
from pydantic import BaseModel, Field


class TenthMarksheet(BaseModel):
    student_name: Optional[str] = Field(None, description="Student's name in English")
    date_of_birth: Optional[str] = Field(None, description="Date of birth (DD/MM/YYYY)")
    father_name: Optional[str] = Field(None, description="Father's name in English")
    mother_name: Optional[str] = Field(None, description="Mother's name in English")
    roll_number: Optional[str] = Field(None, description="Roll/seat number as printed")
    registration_number: Optional[str] = Field(None, description="Registration/enrollment number as printed")
    exam_year: Optional[str] = Field(None, description="Year of examination (YYYY)")
