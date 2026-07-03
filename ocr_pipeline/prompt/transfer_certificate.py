TRANSFER_CERTIFICATE_PROMPT = """
Extract the following fields from this raw Transfer Certificate (TC) text:

### Candidate Details
- candidate_name: Candidate's full name in English
- father_name: Father's full name in English
- mother_name: Mother's full name in English
- date_of_birth: Date of birth in English (format as DD/MM/YYYY if possible)

### School Details
- school_name: School name in English
- school_address: School address in English (City, State)

### Certificate Details
- date_of_leaving: Date of leaving the school in English, e.g. '31ST MARCH 2003'
- roll_number: Roll number / admission number as printed on the certificate

### Extraction Rules:
1. Handle OCR Artifacts: Reconstruct messy text, misspellings, or broken tables based on context.
2. Missing Data: If a field is not present in the document, return null. Do not hallucinate or guess missing values.

DOCUMENT TEXT:
{text}
"""