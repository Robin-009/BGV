from typing import Dict

SYSTEM_PROMPT = (
    "You are an expert BGV (Background Verification) document analyst. "
    "Extract fields from the document text and return ONLY a valid JSON object. "
    "Do NOT translate — copy text exactly as it appears in the document unless a field says 'in English'. "
    "Dates: format as DD-MM-YYYY unless the field description says otherwise. "
    "Employment periods: format as MM/YYYY. "
    "If a field is not found, set it to null. "
    "For list fields, return an empty array [] if nothing is found. "
    "No explanation, no markdown code blocks, just the raw JSON object."
)

BIRTH_CERTIFICATE_PROMPT = """
Extract from this birth certificate and return JSON with these exact keys:

- child_name_eng: child's full name in English
- child_name_org: child's name in the original/regional language printed on the document
- gender: child's gender in English (Male / Female / Other)
- date_of_birth: date of birth (DD-MM-YYYY)
- place_of_birth: place of birth in English (city, town, or hospital name)
- registration_number: birth registration number as printed on the certificate
- father_name: father's full name in English
- mother_name: mother's full name in English
- parents_address: parents' full address in English

DOCUMENT TEXT:
{text}
"""

EMPLOYMENT_VERIFICATION_PROMPT = """
Extract from this employment document (appointment letter / experience letter / relieving letter / offer letter) and return JSON with these exact keys:

- candidate_name: full name of the candidate or employee
- designation: job title or designation held
- employee_id: employee ID or staff number if available, else null
- company_name: full name of the company or organisation
- company_address: full company address — street, city, state, PIN (null if not found)
- company_telephone: company telephone/fax number if printed, else null
- period_from: employment start month and year (MM/YYYY)
- period_to: employment end month and year (MM/YYYY) — use "Present" if currently employed
- authority_name: name of the issuing authority (HR Manager, Director, etc.)

DOCUMENT TEXT:
{text}
"""

MARRIAGE_CERTIFICATE_PROMPT = """
Extract from this marriage certificate and return JSON with these exact keys:

- spouse1_name: full name of the first spouse (usually groom / husband)
- spouse2_name: full name of the second spouse (usually bride / wife)
- date_of_marriage: date the marriage took place (DD-MM-YYYY)
- place_of_marriage: venue, city, or address where the marriage was solemnised
- certificate_number: official marriage certificate or registration number
- date_of_registration: date the certificate was officially registered (DD-MM-YYYY)
- registrar_office: registrar office or institution that issued the certificate
- office_address: registrar office address (area, district, state)
- witnesses: array of witness objects, each with keys "name" and "address" (empty array if none found)

RULES:
- witnesses must be a JSON array, e.g. [{"name": "...", "address": "..."}]
- If only name is available for a witness, set address to null

DOCUMENT TEXT:
{text}
"""

AFFIDAVIT_PROMPT = """
Extract from this affidavit or notarised document and return JSON with these exact keys:

- candidate_name: full name of the deponent or applicant
- registration_no: notary registration or document number
- notary_name: name of the notary or authority who attested
- date: date of the affidavit (DD-MM-YYYY)
- place: place where the affidavit was executed
- subject: brief subject or purpose of the affidavit

DOCUMENT TEXT:
{text}
"""

EDUCATION_CERTIFICATE_PROMPT = """
Extract from this education / degree / marksheet / certificate document and return JSON with these exact keys:

- candidate_name: full name of the candidate as printed
- examination_passed: name of the degree, certificate, or examination (e.g. "Bachelor of Technology", "Class X Board Examination", "MBA")
- roll_no: exam roll number, enrollment number, or registration number
- institution: full name of the school, college, or university
- board_university: name of the board or university (if printed separately from institution, else same as institution)
- year_of_passing: year the candidate passed or graduated
- percentage_grade: percentage, CGPA, or grade obtained (null if not on document)
- specialisation: branch, stream, or specialisation if applicable (e.g. "Computer Science", "Commerce"), else null

DOCUMENT TEXT:
{text}
"""

PASSPORT_PROMPT = """
Extract from this passport document and return JSON with these exact keys:

- passport_number: unique alphanumeric passport number
- country_code: issuing country code (e.g. IND, USA, GBR)
- nationality: nationality as printed
- surname: last name / surname of the holder
- given_name: first and middle names of the holder
- gender: M, F, or X as printed
- date_of_birth: date of birth (DD-MM-YYYY)
- place_of_birth: city, state, or country of birth
- father_name: father's full legal name (null if not in document)
- mother_name: mother's full legal name (null if not in document)
- spouse_name: spouse's full name if endorsed or printed, else null
- date_of_issue: date the passport was issued (DD-MM-YYYY)
- date_of_expiry: date the passport expires (DD-MM-YYYY)
- place_of_issue: issuing authority or location (e.g. "RPO MUMBAI")
- file_number: file or reference number usually printed on back page (null if not found)
- address: full printed address of the passport holder (null if not in document)

RULES:
- passport_number is typically on the top-right of the bio page (e.g. P1234567)
- MRZ lines at the bottom may also contain the passport number — use the human-readable value first

DOCUMENT TEXT:
{text}
"""

DRIVING_LICENSE_PROMPT = """
Extract from this driving licence and return JSON with these exact keys:

- candidate_name: full name of the licence holder
- license_no: driving licence number
- date_of_birth: date of birth (DD-MM-YYYY)
- father_name: father's name as printed on the licence
- blood_group: blood group if printed (e.g. O+, A-), else null
- issue_date: date of issue (DD-MM-YYYY)
- expiry_date: date of expiry (DD-MM-YYYY)
- vehicle_class: vehicle class(es) authorised, comma-separated (e.g. "LMV, MCWG")
- issuing_rto: issuing RTO office name or code
- address: full address as printed on the licence

DOCUMENT TEXT:
{text}
"""

VOTER_ID_PROMPT = """
Extract from this voter ID / EPIC card and return JSON with these exact keys:

- candidate_name: full name of the voter
- voter_id_no: EPIC / voter ID number
- date_of_birth: date of birth (DD-MM-YYYY)
- gender: gender as printed (Male / Female / Other)
- father_husband_name: father's or husband's name as printed
- address: full address as on the card
- constituency: electoral constituency or assembly segment name
- part_number: part number of the electoral roll if printed, else null

DOCUMENT TEXT:
{text}
"""

AADHAAR_PROMPT = """
Extract from this Aadhaar card and return JSON with these exact keys:

- candidate_name: full name of the Aadhaar holder
- aadhaar_no: Aadhaar number — show ONLY the last 4 digits, mask the rest (e.g. XXXX XXXX 5678)
- date_of_birth: date of birth (DD-MM-YYYY)
- gender: Male / Female / Other
- father_name: father's name if printed on the card, else null
- address: full address as printed
- vid: Virtual ID (VID) if printed, else null

SECURITY RULE: Never output the full 12-digit Aadhaar number. Always mask the first 8 digits with X.

DOCUMENT TEXT:
{text}
"""

PAN_CARD_PROMPT = """
Extract from this PAN card and return JSON with these exact keys:

- candidate_name: full name of the PAN card holder
- pan_no: 10-character alphanumeric PAN number (e.g. ABCDE1234F)
- date_of_birth: date of birth (DD-MM-YYYY)
- father_name: father's name as printed on the card
- entity_type: Individual / Company / HUF / Trust / etc. (null if not determinable)

DOCUMENT TEXT:
{text}
"""

BANK_STATEMENT_PROMPT = """
Extract from this bank statement and return JSON with these exact keys:

- account_holder_name: full name of the account holder
- bank_name: name of the bank (e.g. State Bank of India, HDFC Bank)
- branch_name: branch name (null if not found)
- account_no: account number — mask all but last 4 digits with X (e.g. XXXX XXXX 9012)
- account_type: Savings / Current / Overdraft / OD etc.
- ifsc_code: IFSC code of the branch
- period_from: statement period start (MM/YYYY)
- period_to: statement period end (MM/YYYY)
- opening_balance: opening balance for the statement period (as a string, include currency if printed)
- closing_balance: closing balance for the statement period (as a string, include currency if printed)

DOCUMENT TEXT:
{text}
"""

CV_BGV_PROMPT = """
Extract from this Background Verification (BGV) application form / CV and return JSON with these exact keys:

Top-level scalar fields:
- full_name: candidate's full name
- father_name: father's full name
- mother_name: mother's full name
- spouse_name: spouse's full name (null if unmarried or not provided)
- date_of_birth: date of birth (DD-MM-YYYY)
- nationality: nationality (e.g. Indian)
- phone_number: primary phone number
- criminal_record_declaration: true if candidate declared any criminal offense, false if explicitly denied, null if not found

List fields — each must be a JSON array:

"addresses": array of address objects with keys:
  - address_type: "Current" or "Permanent"
  - complete_address: full address as written
  - city
  - state
  - pin_code
  - period_of_stay: e.g. "Jan 2020 – Present"
  - nature_of_residence: Own House / Rental / PG / Company Accommodation / etc.

"references": array of reference objects with keys:
  - name: reference person's full name
  - company_designation: company and job title
  - contact_number
  - email_id
  - acquainted_since: how long they have known the candidate
  - investigator_findings: any comments noted about integrity / reliability

"identity_proofs": array of identity document objects with keys:
  - document_type: Aadhaar / PAN / Passport / Driving License / Voter ID / etc.
  - id_number
  - validity_expiry_date
  - place_of_issue

"court_cases": array of court case objects with keys:
  - jurisdiction: court name or location
  - case_title: e.g. "State v. John Doe"
  - case_number
  - case_status: Pending / Disposed / Acquitted / etc.

RULES:
- If no entries are found for a list, return an empty array []
- Do not invent data — only extract what is explicitly stated in the document

DOCUMENT TEXT:
{text}
"""

TRANSFER_CERTIFICATE_PROMPT = """
Extract from this Transfer Certificate (TC) or School Leaving Certificate and return JSON with these exact keys:

- candidate_name: student's full name in English
- father_name: father's full name in English
- mother_name: mother's full name in English (null if not found)
- date_of_birth: date of birth (DD-MM-YYYY)
- school_name: full name of the school in English
- school_address: school address in English (city, state)
- date_of_leaving: date the student left the school (DD-MM-YYYY or as written)
- roll_number: roll number or admission number as printed on the certificate
- reason_leaving: reason for leaving if mentioned (e.g. "Passed out", "Transfer of parents"), else null
- conduct: conduct or character remark if mentioned (e.g. "Good", "Satisfactory"), else null

DOCUMENT TEXT:
{text}
"""

PROMPT_MAP: Dict[str, str] = {
    "birth_certificate":       BIRTH_CERTIFICATE_PROMPT,
    "employment_verification": EMPLOYMENT_VERIFICATION_PROMPT,
    "marriage_certificate":    MARRIAGE_CERTIFICATE_PROMPT,
    "affidavit":               AFFIDAVIT_PROMPT,
    "education_certificate":   EDUCATION_CERTIFICATE_PROMPT,
    "passport":                PASSPORT_PROMPT,
    "driving_license":         DRIVING_LICENSE_PROMPT,
    "voter_id":                VOTER_ID_PROMPT,
    "aadhaar":                 AADHAAR_PROMPT,
    "pan_card":                PAN_CARD_PROMPT,
    "bank_statement":          BANK_STATEMENT_PROMPT,
    "cv_bgv":                  CV_BGV_PROMPT,
    "transfer_certificate":    TRANSFER_CERTIFICATE_PROMPT,
}
