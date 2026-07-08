EMPLOYMENT_CERTIFICATE_PROMPT = """
The document text may contain ONE OR MORE separate Employment / Experience Certificates.
Identify every distinct certificate and extract the fields below for EACH one.
Return a list under the key "certificates", with one object per certificate.

For each certificate, extract:

### Candidate Details
- candidate_name: Candidate's full name in English
- designation: Employee's designation/title in English
- employee_id: Employee ID if available
- period_of_employment: Period of employment in English (DD Month YYYY – DD Month YYYY)

### Company Details
- company_name: Company name in English
- company_address: detailed address of the company, with:
  - address_line: house/shop no., street, locality, VILLAGE, PO text that doesn't cleanly map to city_or_village or district
  - city_or_village: city, town, or village name. If explicitly marked "VILLAGE"/"VILL", use that name.
  - district: district name — only if explicitly labeled (e.g. "DIST") or is an unambiguous, well-known district-level name in the text
  - state: state name — ONLY if literally printed in the source text. Do NOT infer state from city/district knowledge.
  - pincode: postal/PIN code, if present
  - country: country name, if the address is outside India or explicitly printed (e.g. Norway, UK)
- company_telephone: Company telephone number if available
- authority_name: Issuing authority (HR Manager / Employer) name in English

### Extraction Rules:
1. Multiple Certificates: Treat each employer, letterhead, signature block, or clearly separated
   certificate as a distinct entry. Do NOT merge details from different certificates into one.
   If only one certificate is present, return a list with a single object.
2. Handle OCR Artifacts: Reconstruct messy text, misspellings, or broken tables based on context.
3. Missing Data: If a field is not present for a given certificate, return null for that field.
   Do not hallucinate or guess missing values, and do not copy a value from another certificate.
4. No Inference Beyond Text: Never infer state, district, or country from general knowledge (e.g. do not assume a state just because a city is mentioned) — only extract what is explicitly printed.
5. Non-Indian Addresses: Some certificates may be from companies outside India (e.g. Norway). Extract whatever structured details are present and put the country name in the country field; leave pincode/district/state null if not applicable or not printed.
6. Unlabeled Tokens: If address text has no explicit "DIST"/"STATE"/"VILL" labels, put ambiguous parts into address_line rather than guessing which field they belong to.

DOCUMENT TEXT:
{text}
"""