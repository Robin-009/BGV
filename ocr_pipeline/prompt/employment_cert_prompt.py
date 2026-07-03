EMPLOYMENT_CERTIFICATE_PROMPT = """
Extract the following fields from this raw Employment / Experience Certificate text:

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
1. Handle OCR Artifacts: Reconstruct messy text, misspellings, or broken tables based on context.
2. Missing Data: If a field is not present in the document, return null. Do not hallucinate or guess missing values.

DOCUMENT TEXT:
{text}
"""