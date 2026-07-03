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
- company_address: Company full address in English (Street, City, PIN)
- company_telephone: Company telephone number if available
- authority_name: Issuing authority (HR Manager / Employer) name in English

### Extraction Rules:
1. Multiple Certificates: Treat each employer, letterhead, signature block, or clearly separated
   certificate as a distinct entry. Do NOT merge details from different certificates into one.
   If only one certificate is present, return a list with a single object.
2. Handle OCR Artifacts: Reconstruct messy text, misspellings, or broken tables based on context.
3. Missing Data: If a field is not present for a given certificate, return null for that field.
   Do not hallucinate or guess missing values, and do not copy a value from another certificate.

DOCUMENT TEXT:
{text}
"""