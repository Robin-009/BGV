TWELFTH_MARKSHEET_PROMPT = """
Extract the following fields from this raw 12th Standard (HSC/Class XII) Marksheet text:

### Essential Details
- student_name: Student's full name in English
- father_name: Father's full name in English
- mother_name: Mother's full name in English
- roll_number: Roll number / seat number as printed
- registration_number: Registration/enrollment number as printed
- exam_year: Year of examination (YYYY)

### Extraction Rules:
1. Handle OCR Artifacts: Reconstruct messy text, misspellings, or broken tables based on context.
2. Missing Data: If a field is not present in the document, return null. Do not hallucinate or guess missing values.

DOCUMENT TEXT:
{text}
"""
