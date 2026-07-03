BIRTH_CERTIFICATE_PROMPT = """
Extract the following fields from this raw Birth Certificate text:

### Essential Details
- child_name: Child's full name in English
- gender: Child's gender/sex in English
- date_of_birth: Date of birth in English (format as DD/MM/YYYY if possible)
- place_of_birth: Place of birth in English
- registration_number: Birth registration number as printed on the certificate

### Family Details
- father_name: Father's full name in English
- mother_name: Mother's full name in English
- parents_address: Parents' full address in English

### Extraction Rules:
1. Handle OCR Artifacts: Reconstruct messy text, misspellings, or broken tables based on context.
2. Missing Data: If a field is not present in the document, return null. Do not hallucinate or guess missing values.

DOCUMENT TEXT:
{text}
"""