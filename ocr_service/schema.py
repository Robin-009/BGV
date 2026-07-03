from typing import Optional, List, Dict, Type
from pydantic import BaseModel, Field


# ── Birth Certificate ──────────────────────────────────────────────────────────
class BirthCertificate(BaseModel):
    child_name_eng:      Optional[str] = Field(None, description="Child's full name in English")
    child_name_org:      Optional[str] = Field(None, description="Child's name in regional/original language")
    gender:              Optional[str] = Field(None, description="Child's gender in English (Male/Female/Other)")
    date_of_birth:       Optional[str] = Field(None, description="Date of birth (DD-MM-YYYY)")
    place_of_birth:      Optional[str] = Field(None, description="Place of birth in English")
    registration_number: Optional[str] = Field(None, description="Birth registration number on the certificate")
    father_name:         Optional[str] = Field(None, description="Father's full name in English")
    mother_name:         Optional[str] = Field(None, description="Mother's full name in English")
    parents_address:     Optional[str] = Field(None, description="Parents' full address in English")


# ── Employment Verification ────────────────────────────────────────────────────
class EmploymentVerification(BaseModel):
    candidate_name:     Optional[str] = Field(None, description="Candidate's full name")
    designation:        Optional[str] = Field(None, description="Job title or designation held")
    employee_id:        Optional[str] = Field(None, description="Employee ID if available")
    company_name:       Optional[str] = Field(None, description="Full name of the company or organisation")
    company_address:    Optional[str] = Field(None, description="Company full address (Street, City, PIN)")
    company_telephone:  Optional[str] = Field(None, description="Company telephone number if available")
    period_from:        Optional[str] = Field(None, description="Employment start month/year (MM/YYYY)")
    period_to:          Optional[str] = Field(None, description="Employment end month/year (MM/YYYY) or 'Present'")
    authority_name:     Optional[str] = Field(None, description="Issuing authority (HR Manager/Employer) name")


# ── Marriage Certificate ───────────────────────────────────────────────────────
class Witness(BaseModel):
    name:    Optional[str] = Field(None, description="Full name of the witness")
    address: Optional[str] = Field(None, description="Address of the witness, if provided")

class MarriageCertificate(BaseModel):
    spouse1_name:        Optional[str] = Field(None, description="Full name of first spouse (groom/husband)")
    spouse2_name:        Optional[str] = Field(None, description="Full name of second spouse (bride/wife)")
    date_of_marriage:    Optional[str] = Field(None, description="Date the marriage took place (DD-MM-YYYY)")
    place_of_marriage:   Optional[str] = Field(None, description="Venue, city, or address where marriage was solemnised")
    certificate_number:  Optional[str] = Field(None, description="Official marriage certificate/registration number")
    date_of_registration:Optional[str] = Field(None, description="Date the certificate was officially registered (DD-MM-YYYY)")
    registrar_office:    Optional[str] = Field(None, description="Registrar office / institution name")
    office_address:      Optional[str] = Field(None, description="Registrar office address (Area, District, State)")
    witnesses:           Optional[List[Witness]] = Field(default_factory=list, description="Witnesses present at the marriage")


# ── Affidavit Certificate ──────────────────────────────────────────────────────
class AffidavitCertificate(BaseModel):
    candidate_name:  Optional[str] = Field(None, description="Full name of the deponent or applicant")
    registration_no: Optional[str] = Field(None, description="Notary registration or document number")
    notary_name:     Optional[str] = Field(None, description="Name of the notary/authority who attested")
    date:            Optional[str] = Field(None, description="Date of the affidavit (DD-MM-YYYY)")
    place:           Optional[str] = Field(None, description="Place where affidavit was executed")
    subject:         Optional[str] = Field(None, description="Brief subject or purpose of the affidavit")


# ── Education Certificate ──────────────────────────────────────────────────────
class EducationCertificate(BaseModel):
    candidate_name:     Optional[str] = Field(None, description="Full name of the candidate as printed")
    examination_passed: Optional[str] = Field(None, description="Degree, certificate, or examination name")
    roll_no:            Optional[str] = Field(None, description="Exam roll number or enrollment/registration number")
    institution:        Optional[str] = Field(None, description="Full name of school, college, university, or board")
    board_university:   Optional[str] = Field(None, description="Name of the board or university (if separate from institution)")
    year_of_passing:    Optional[str] = Field(None, description="Year the candidate passed or graduated")
    percentage_grade:   Optional[str] = Field(None, description="Percentage, CGPA, or grade obtained")
    specialisation:     Optional[str] = Field(None, description="Branch, stream, or specialisation if applicable")


# ── Passport ───────────────────────────────────────────────────────────────────
class Passport(BaseModel):
    passport_number: Optional[str] = Field(None, description="Unique alphanumeric passport number")
    country_code:    Optional[str] = Field(None, description="Issuing country code (e.g. IND, USA)")
    nationality:     Optional[str] = Field(None, description="Nationality of the passport holder")
    surname:         Optional[str] = Field(None, description="Last name / surname of the holder")
    given_name:      Optional[str] = Field(None, description="First and middle names of the holder")
    gender:          Optional[str] = Field(None, description="Gender/Sex (M, F, X)")
    date_of_birth:   Optional[str] = Field(None, description="Date of birth (DD-MM-YYYY)")
    place_of_birth:  Optional[str] = Field(None, description="City, State, or Country of birth")
    father_name:     Optional[str] = Field(None, description="Father's full legal name")
    mother_name:     Optional[str] = Field(None, description="Mother's full legal name")
    spouse_name:     Optional[str] = Field(None, description="Spouse's full name, if endorsed/printed")
    date_of_issue:   Optional[str] = Field(None, description="Date the passport was issued (DD-MM-YYYY)")
    date_of_expiry:  Optional[str] = Field(None, description="Date the passport expires (DD-MM-YYYY)")
    place_of_issue:  Optional[str] = Field(None, description="Issuing authority or location")
    file_number:     Optional[str] = Field(None, description="Official file or reference number (usually on back page)")
    address:         Optional[str] = Field(None, description="Full printed address of the passport holder")


# ── Driving License ────────────────────────────────────────────────────────────
class DrivingLicense(BaseModel):
    candidate_name: Optional[str] = Field(None, description="Full name of the licence holder")
    license_no:     Optional[str] = Field(None, description="Driving licence number")
    date_of_birth:  Optional[str] = Field(None, description="Date of birth (DD-MM-YYYY)")
    father_name:    Optional[str] = Field(None, description="Father's name as printed")
    blood_group:    Optional[str] = Field(None, description="Blood group if printed on licence")
    issue_date:     Optional[str] = Field(None, description="Date of issue (DD-MM-YYYY)")
    expiry_date:    Optional[str] = Field(None, description="Date of expiry (DD-MM-YYYY)")
    vehicle_class:  Optional[str] = Field(None, description="Vehicle class(es) authorised (e.g. LMV, MCWG, Transport)")
    issuing_rto:    Optional[str] = Field(None, description="Issuing RTO name or code")
    address:        Optional[str] = Field(None, description="Address as printed on the licence")


# ── Voter ID ───────────────────────────────────────────────────────────────────
class VoterID(BaseModel):
    candidate_name:      Optional[str] = Field(None, description="Full name of the voter")
    voter_id_no:         Optional[str] = Field(None, description="EPIC / voter ID number")
    date_of_birth:       Optional[str] = Field(None, description="Date of birth (DD-MM-YYYY)")
    gender:              Optional[str] = Field(None, description="Gender as printed")
    father_husband_name: Optional[str] = Field(None, description="Father's or husband's name as printed")
    address:             Optional[str] = Field(None, description="Full address as on the card")
    constituency:        Optional[str] = Field(None, description="Electoral constituency or part name")
    part_number:         Optional[str] = Field(None, description="Part number of the electoral roll")


# ── Aadhaar Card ───────────────────────────────────────────────────────────────
class AadhaarCard(BaseModel):
    candidate_name: Optional[str] = Field(None, description="Full name of the Aadhaar holder")
    aadhaar_no:     Optional[str] = Field(None, description="Aadhaar number — last 4 digits only, rest masked as XXXX XXXX")
    date_of_birth:  Optional[str] = Field(None, description="Date of birth (DD-MM-YYYY)")
    gender:         Optional[str] = Field(None, description="Male / Female / Other")
    father_name:    Optional[str] = Field(None, description="Father's name if printed on the card")
    address:        Optional[str] = Field(None, description="Full address as printed")
    vid:            Optional[str] = Field(None, description="Virtual ID (VID) if printed")


# ── PAN Card ───────────────────────────────────────────────────────────────────
class PANCard(BaseModel):
    candidate_name: Optional[str] = Field(None, description="Full name of the PAN card holder")
    pan_no:         Optional[str] = Field(None, description="10-character alphanumeric PAN number")
    date_of_birth:  Optional[str] = Field(None, description="Date of birth (DD-MM-YYYY)")
    father_name:    Optional[str] = Field(None, description="Father's name as printed on the card")
    entity_type:    Optional[str] = Field(None, description="Individual / Company / HUF etc.")


# ── Bank Statement ─────────────────────────────────────────────────────────────
class BankStatement(BaseModel):
    account_holder_name: Optional[str] = Field(None, description="Full name of the account holder")
    bank_name:           Optional[str] = Field(None, description="Name of the bank")
    branch_name:         Optional[str] = Field(None, description="Branch name")
    account_no:          Optional[str] = Field(None, description="Account number — mask all but last 4 digits with X")
    account_type:        Optional[str] = Field(None, description="Savings / Current / OD etc.")
    ifsc_code:           Optional[str] = Field(None, description="IFSC code of the branch")
    period_from:         Optional[str] = Field(None, description="Statement period start (MM/YYYY)")
    period_to:           Optional[str] = Field(None, description="Statement period end (MM/YYYY)")
    opening_balance:     Optional[str] = Field(None, description="Opening balance for the statement period")
    closing_balance:     Optional[str] = Field(None, description="Closing balance for the statement period")


# ── Curriculum Vitae / BGV Form ───────────────────────────────────────────────
class Address(BaseModel):
    address_type:        Optional[str] = Field(None, description="'Current' or 'Permanent'")
    complete_address:    Optional[str] = Field(None, description="Full address string")
    city:                Optional[str] = None
    state:               Optional[str] = None
    pin_code:            Optional[str] = None
    period_of_stay:      Optional[str] = Field(None, description="Start date to End date / 'Till now'")
    nature_of_residence: Optional[str] = Field(None, description="Own House, Rental, PG, etc.")

class Reference(BaseModel):
    name:                  Optional[str] = None
    company_designation:   Optional[str] = None
    contact_number:        Optional[str] = None
    email_id:              Optional[str] = None
    acquainted_since:      Optional[str] = None
    investigator_findings: Optional[str] = Field(None, description="Comments on integrity, honesty, reliability")

class IdentityProof(BaseModel):
    document_type:       Optional[str] = Field(None, description="Aadhaar, PAN, Driving License, Passport, etc.")
    id_number:           Optional[str] = None
    validity_expiry_date:Optional[str] = None
    place_of_issue:      Optional[str] = None

class CourtCase(BaseModel):
    jurisdiction: Optional[str] = Field(None, description="Court name or location")
    case_title:   Optional[str] = Field(None, description="e.g. State v. John")
    case_number:  Optional[str] = Field(None, description="e.g. CRM/2631/2026")
    case_status:  Optional[str] = Field(None, description="Pending, Disposed, etc.")

class CVBackgroundCheck(BaseModel):
    full_name:                   Optional[str] = None
    father_name:                 Optional[str] = None
    mother_name:                 Optional[str] = None
    spouse_name:                 Optional[str] = None
    date_of_birth:               Optional[str] = Field(None, description="DD-MM-YYYY")
    nationality:                 Optional[str] = None
    phone_number:                Optional[str] = None
    criminal_record_declaration: Optional[bool] = Field(None, description="True if 'Yes' to any criminal offense declaration")
    addresses:      List[Address]      = Field(default_factory=list)
    references:     List[Reference]    = Field(default_factory=list)
    identity_proofs:List[IdentityProof]= Field(default_factory=list)
    court_cases:    List[CourtCase]    = Field(default_factory=list)


# ── Transfer Certificate ───────────────────────────────────────────────────────
class TransferCertificate(BaseModel):
    candidate_name: Optional[str] = Field(None, description="Candidate's full name in English")
    father_name:    Optional[str] = Field(None, description="Father's full name in English")
    mother_name:    Optional[str] = Field(None, description="Mother's full name in English")
    date_of_birth:  Optional[str] = Field(None, description="Date of birth (DD-MM-YYYY)")
    school_name:    Optional[str] = Field(None, description="School name in English")
    school_address: Optional[str] = Field(None, description="School address in English (City, State)")
    date_of_leaving:Optional[str] = Field(None, description="Date of leaving the school")
    roll_number:    Optional[str] = Field(None, description="Roll number / admission number on the certificate")
    reason_leaving: Optional[str] = Field(None, description="Reason for leaving if mentioned")
    conduct:        Optional[str] = Field(None, description="Conduct/character remark if mentioned")


# ── Schema registry ────────────────────────────────────────────────────────────
class OCRProcessResponse(BaseModel):
    document_type:  str
    extracted_data: Dict
    raw_ocr_text:   Optional[str] = None


SCHEMA_MAP: Dict[str, type] = {
    "birth_certificate":        BirthCertificate,
    "employment_verification":  EmploymentVerification,
    "marriage_certificate":     MarriageCertificate,
    "affidavit":                AffidavitCertificate,
    "education_certificate":    EducationCertificate,
    "passport":                 Passport,
    "driving_license":          DrivingLicense,
    "voter_id":                 VoterID,
    "aadhaar":                  AadhaarCard,
    "pan_card":                 PANCard,
    "bank_statement":           BankStatement,
    "cv_bgv":                   CVBackgroundCheck,
    "transfer_certificate":     TransferCertificate,
}
