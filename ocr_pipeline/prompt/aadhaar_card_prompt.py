AADHAAR_CARD_PROMPT = """
Extract the following fields from this raw Aadhaar Card text:

### Essential Details
- name: Full name in English
- aadhaar_number: 12-digit Aadhaar number (format as XXXX XXXX XXXX if possible)
- gender: Gender/sex in English
- date_of_birth: Date of birth in English (format as DD/MM/YYYY if possible). If only year of birth is printed, return the year.

### Family & Address Details
- father_or_husband_name: Father's/husband's/guardian's name (often after "S/O", "D/O", "W/O", "C/O") if present
- address: Full address as printed in English
- pincode: 6-digit PIN code if present
- state: State if identifiable

### Extraction Rules:
1. Handle OCR Artifacts: Reconstruct messy text, misspellings, or broken tables based on context.
2. Missing Data: If a field is not present in the document, return null. Do not hallucinate or guess missing values.
3. Do not confuse the VID with the Aadhaar number; the Aadhaar number is 12 digits, the VID is 16 digits.

DOCUMENT TEXT:
{text}
"""
