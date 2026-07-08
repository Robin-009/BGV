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

### Addresses
The document may list a "Current"/"Present" address and a "Permanent" address separately. Extract each into its own field:
- current_address: the candidate's current/present address, with:
    - complete_address: the full address string, exactly as printed
    - address_line: house/flat no., street, locality, VILLAGE, PO text that doesn't cleanly map to city_or_village or district
    - city_or_village: city, town, or village name. If explicitly marked "VILLAGE"/"VILL", use that name.
    - district: district name — only if explicitly labeled (e.g. "DIST") or is an unambiguous, well-known district-level name in the text
    - state: state name — ONLY if literally printed in the source text. Do NOT infer state from city/district knowledge.
    - pin_code: 6-digit PIN code, if present
    - period_of_stay: Start date/year or 'Since birth' to End date / 'Till now'
    - nature_of_residence: e.g., Own House, Rental, PG
- permanent_address: the candidate's permanent address, using the same fields as above

### Nested Entities
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
3. Multiple Entries: Capture every reference, identity proof, and court case found — do not stop at the first one.
4. Same Address Both Ways: If the document states the current and permanent address are the same (e.g. "Same as above" or "Same as Present"), copy the full details into both current_address and permanent_address rather than leaving one null.
5. No Inference Beyond Text: Never infer state or district from general knowledge (e.g. do not assume a state just because a city is mentioned) — only extract what is explicitly printed.
6. VILLAGE Marker Priority: A name explicitly marked "VILLAGE"/"VILL" is always city_or_village — do not overwrite it with a different place name found later in the address (e.g. a district-level name appearing near the state/PIN).
7. Unlabeled Tokens: If address text has no explicit "DIST"/"STATE"/"VILL" labels, put ambiguous parts into address_line rather than guessing which field they belong to.

DOCUMENT TEXT:
{text}
"""