CV_BACKGROUND_CHECK_PROMPT = """
Extract the following fields from this raw CV / Background Check report text:

### Personal Details
- full_name: Candidate's full legal name
- father_name: Father's full name
- mother_name: Mother's full name
- spouse_name: Spouse's full name
- date_of_birth: Date of birth (format as DD/MM/YYYY if possible)
- nationality: Candidate's nationality
- phone_number: Candidate's phone number
- criminal_record_declaration: true if the candidate answered 'Yes' to any criminal offense declaration, false if 'No', null if not mentioned

### Nested Entities
- addresses: List of addresses. For each, extract:
    - address_type: 'Current' or 'Permanent'
    - complete_address: The full address string
    - city
    - state
    - pin_code
    - period_of_stay: Start date/year or 'Since birth' to End date / 'Till now'
    - nature_of_residence: e.g., Own House, Rental, PG
- references: List of references. For each, extract:
    - name
    - company_designation
    - contact_number
    - email_id
    - acquainted_since
    - investigator_findings: Comments on integrity, honesty, reliability
- identity_proofs: List of ID documents. For each, extract:
    - document_type: e.g., Aadhaar, PAN, Driving License, Passport
    - id_number: The alphanumeric identifier
    - validity_expiry_date
    - place_of_issue
- court_cases: List of court cases. For each, extract:
    - jurisdiction: The court name or location
    - case_title: e.g., State v. Tushar
    - case_number: e.g., CRM/2631/2026
    - case_status: e.g., Pending, Disposed

### Extraction Rules:
1. Handle OCR Artifacts: Reconstruct messy text, misspellings, or broken tables based on context.
2. Missing Data: If a field is not present in the document, return null (or an empty list for nested entities). Do not hallucinate or guess missing values.
3. Multiple Entries: Capture every address, reference, identity proof, and court case found — do not stop at the first one.

DOCUMENT TEXT:
{text}
"""