PAN_CARD_PROMPT = """
Extract the following fields from this raw PAN Card text:

### Essential Details
- name: Cardholder's full name in English
- pan_number: 10-character PAN (format: 5 letters, 4 digits, 1 letter, e.g., ABCDE1234F)
- date_of_birth: Date of birth in English (format as DD/MM/YYYY if possible)

### Family Details
- father_name: Father's full name in English if present

### Extraction Rules:
1. Handle OCR Artifacts: Reconstruct messy text, misspellings, or broken tables based on context.
2. Missing Data: If a field is not present in the document, return null. Do not hallucinate or guess missing values.
3. PAN format is exactly 5 letters + 4 digits + 1 letter. Correct obvious OCR confusions (e.g., O vs 0, I vs 1) only where the fixed format makes the intended character unambiguous.

DOCUMENT TEXT:
{text}
"""
