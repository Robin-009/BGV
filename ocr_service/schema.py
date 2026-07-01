from typing import Optional, Dict, Type
from pydantic import BaseModel


class BirthCertificate(BaseModel):
    child_name_org:      Optional[str] = None
    child_name_eng:      Optional[str] = None
    gender_eng:          Optional[str] = None
    date_of_birth_eng:   Optional[str] = None
    place_of_birth_eng:  Optional[str] = None
    father_name_eng:     Optional[str] = None
    mother_name_eng:     Optional[str] = None
    parents_address_eng: Optional[str] = None


class EmploymentVerification(BaseModel):
    candidate_name:    Optional[str] = None
    designation:       Optional[str] = None
    organisation_name: Optional[str] = None
    period_from:       Optional[str] = None  # MM/YYYY
    period_to:         Optional[str] = None  # MM/YYYY or "Present"


class MarriageCertificate(BaseModel):
    candidate_name:    Optional[str] = None
    spouse_name:       Optional[str] = None
    place_of_marriage: Optional[str] = None
    date_of_marriage:  Optional[str] = None  # DD-MM-YYYY
    registration_no:   Optional[str] = None


class AffidavitCertificate(BaseModel):
    candidate_name:  Optional[str] = None
    registration_no: Optional[str] = None
    date:            Optional[str] = None


class EducationCertificate(BaseModel):
    candidate_name:     Optional[str] = None
    examination_passed: Optional[str] = None
    roll_no:            Optional[str] = None
    institution:        Optional[str] = None
    year_of_passing:    Optional[str] = None


class Passport(BaseModel):
    candidate_name: Optional[str] = None
    passport_no:    Optional[str] = None
    date_of_birth:  Optional[str] = None
    issue_date:     Optional[str] = None
    expiry_date:    Optional[str] = None
    nationality:    Optional[str] = None


class DrivingLicense(BaseModel):
    candidate_name: Optional[str] = None
    license_no:     Optional[str] = None
    date_of_birth:  Optional[str] = None
    issue_date:     Optional[str] = None
    expiry_date:    Optional[str] = None
    vehicle_class:  Optional[str] = None
    address:        Optional[str] = None


class VoterID(BaseModel):
    candidate_name:      Optional[str] = None
    voter_id_no:         Optional[str] = None
    date_of_birth:       Optional[str] = None
    father_husband_name: Optional[str] = None
    address:             Optional[str] = None
    constituency:        Optional[str] = None


class AadhaarCard(BaseModel):
    candidate_name: Optional[str] = None
    aadhaar_no:     Optional[str] = None
    date_of_birth:  Optional[str] = None
    gender:         Optional[str] = None
    address:        Optional[str] = None


class PANCard(BaseModel):
    candidate_name: Optional[str] = None
    pan_no:         Optional[str] = None
    date_of_birth:  Optional[str] = None
    father_name:    Optional[str] = None


class BankStatement(BaseModel):
    account_holder_name: Optional[str] = None
    bank_name:           Optional[str] = None
    account_no:          Optional[str] = None
    ifsc_code:           Optional[str] = None
    period_from:         Optional[str] = None
    period_to:           Optional[str] = None


class OCRProcessResponse(BaseModel):
    document_type:  str
    extracted_data: Dict
    raw_ocr_text:   Optional[str] = None


SCHEMA_MAP: Dict[str, Type[BaseModel]] = {
    "birth_certificate":               BirthCertificate,
    "employment_verification":         EmploymentVerification,
    "marriage_certificate":            MarriageCertificate,
    "affidavit":                       AffidavitCertificate,
    "education_certificate":           EducationCertificate,
    "passport":                        Passport,
    "driving_license":                 DrivingLicense,
    "voter_id":                        VoterID,
    "aadhaar":                         AadhaarCard,
    "pan_card":                        PANCard,
    "bank_statement":                  BankStatement,
}
