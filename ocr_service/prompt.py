from typing import Dict

SYSTEM_PROMPT = (
    "You are an expert BGV (Background Verification) document analyst. "
    "Extract fields from the document text and return ONLY a valid JSON object. "
    "Do NOT translate — copy text exactly as it appears unless specified to use English. "
    "Dates: format as DD-MM-YYYY. Employment periods: format as MM/YYYY. "
    "If a field is not found, set it to null. "
    "No explanation, no markdown, just the JSON."
)

BIRTH_CERTIFICATE_PROMPT = """
Extract from this birth certificate:
- child_name_org: child's name in original/regional language
- child_name_eng: child's name in English
- gender_eng: child's gender in English (Male/Female/Other)
- date_of_birth_eng: date of birth in English (DD-MM-YYYY)
- place_of_birth_eng: place of birth in English (city/town/hospital)
- father_name_eng: father's name in English
- mother_name_eng: mother's name in English
- parents_address_eng: parents' address in English

DOCUMENT TEXT:
{text}
"""

EMPLOYMENT_VERIFICATION_PROMPT = """
Extract from this employment document (appointment letter / experience letter / relieving letter):
- candidate_name: full name of the candidate/employee
- designation: job title or designation held
- organisation_name: full name of the company or organisation
- period_from: employment start month and year (MM/YYYY)
- period_to: employment end month and year (MM/YYYY) — use "Present" if still employed

DOCUMENT TEXT:
{text}
"""

MARRIAGE_CERTIFICATE_PROMPT = """
Extract from this marriage certificate:
- candidate_name: groom or primary applicant's full name
- spouse_name: bride or second party's full name
- place_of_marriage: city/place where the marriage was registered or solemnised
- date_of_marriage: date of marriage (DD-MM-YYYY)
- registration_no: marriage certificate registration number

DOCUMENT TEXT:
{text}
"""

AFFIDAVIT_PROMPT = """
Extract from this affidavit certificate:
- candidate_name: full name of the deponent or applicant
- registration_no: notary registration or document number
- date: date of the affidavit (DD-MM-YYYY)

DOCUMENT TEXT:
{text}
"""

EDUCATION_CERTIFICATE_PROMPT = """
Extract from this education / degree / marksheet document:
- candidate_name: full name of the candidate as printed
- examination_passed: name of the degree, certificate, or examination (e.g. "Bachelor of Technology in Computer Science", "Class X Board Examination")
- roll_no: exam roll number or enrollment/registration number
- institution: full name of the school, college, university, or board
- year_of_passing: year the candidate passed or graduated

DOCUMENT TEXT:
{text}
"""

PASSPORT_PROMPT = """
Extract from this passport:
- candidate_name: full name as printed on passport
- passport_no: passport number
- date_of_birth: date of birth (DD-MM-YYYY)
- issue_date: date of issue (DD-MM-YYYY)
- expiry_date: date of expiry (DD-MM-YYYY)
- nationality: nationality as printed

DOCUMENT TEXT:
{text}
"""

DRIVING_LICENSE_PROMPT = """
Extract from this driving licence:
- candidate_name: full name of the licence holder
- license_no: driving licence number
- date_of_birth: date of birth (DD-MM-YYYY)
- issue_date: date of issue (DD-MM-YYYY)
- expiry_date: date of expiry (DD-MM-YYYY)
- vehicle_class: vehicle class(es) authorised (e.g. "LMV", "MCWG", "Transport")
- address: address as printed on the licence

DOCUMENT TEXT:
{text}
"""

VOTER_ID_PROMPT = """
Extract from this voter ID / EPIC card:
- candidate_name: full name of the voter
- voter_id_no: EPIC / voter ID number
- date_of_birth: date of birth (DD-MM-YYYY)
- father_husband_name: father's name or husband's name as printed
- address: full address as on the card
- constituency: electoral constituency or part name

DOCUMENT TEXT:
{text}
"""

AADHAAR_PROMPT = """
Extract from this Aadhaar card:
- candidate_name: full name of the Aadhaar holder
- aadhaar_no: Aadhaar number — show only last 4 digits, mask rest as XXXX XXXX XXXX
- date_of_birth: date of birth (DD-MM-YYYY)
- gender: Male / Female / Other
- address: full address as printed

DOCUMENT TEXT:
{text}
"""

PAN_CARD_PROMPT = """
Extract from this PAN card:
- candidate_name: full name of the PAN card holder
- pan_no: 10-character alphanumeric PAN number
- date_of_birth: date of birth (DD-MM-YYYY)
- father_name: father's name as printed on the card

DOCUMENT TEXT:
{text}
"""

BANK_STATEMENT_PROMPT = """
Extract from this bank statement:
- account_holder_name: full name of the account holder
- bank_name: name of the bank
- account_no: account number (mask all but last 4 digits with X)
- ifsc_code: IFSC code of the branch
- period_from: statement period start month/year (MM/YYYY)
- period_to: statement period end month/year (MM/YYYY)

DOCUMENT TEXT:
{text}
"""

PROMPT_MAP: Dict[str, str] = {
    "birth_certificate":       BIRTH_CERTIFICATE_PROMPT,
    "employment_verification":  EMPLOYMENT_VERIFICATION_PROMPT,
    "marriage_certificate":     MARRIAGE_CERTIFICATE_PROMPT,
    "affidavit":                AFFIDAVIT_PROMPT,
    "education_certificate":    EDUCATION_CERTIFICATE_PROMPT,
    "passport":                 PASSPORT_PROMPT,
    "driving_license":          DRIVING_LICENSE_PROMPT,
    "voter_id":                 VOTER_ID_PROMPT,
    "aadhaar":                  AADHAAR_PROMPT,
    "pan_card":                 PAN_CARD_PROMPT,
    "bank_statement":           BANK_STATEMENT_PROMPT,
}
