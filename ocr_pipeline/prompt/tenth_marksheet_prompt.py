TENTH_MARKSHEET_PROMPT = """
Extract the following fields from this raw 10th Standard (SSC/Class X) Marksheet text:

### Essential Details
- student_name: Student's full name in English
- date_of_birth: Date of birth in English (format as DD/MM/YYYY if possible)
- father_name: Father's full name in English
- mother_name: Mother's full name in English
- roll_number: Roll number / seat number as printed
- registration_number: Registration/enrollment number as printed
- examination_passed: Name of the examination or certificate about   
- exam_year: Year of examination (YYYY)

### School Details
- school_name: ONLY the name of the institution itself (e.g. "BSS EDU CENTRE"). Do NOT include codes, village names, or location text in this field.
- school_address: address details separated from school_name, with:
  - address_line: any locality/village/area text that doesn't cleanly map to city_or_village or district (e.g. "VILL ANANDPURAM, KALYANPUR")
  - city_or_village: city or village name, if identifiable
  - district: district name — only if explicitly labeled (e.g. "DIST") or is an unambiguous, well-known district name in the text
  - state: state name — ONLY if literally printed in the source text. Do NOT infer state from city/district knowledge.
  - pincode: 6-digit PIN code, if present

### Extraction Rules:
1. Handle OCR Artifacts: Reconstruct messy text, misspellings, or broken tables based on context.
2. Missing Data: If a field is not present in the document, return null. Do not hallucinate or guess missing values.
3. No Inference Beyond Text: Never infer state, district, or pincode from general knowledge (e.g. do not assume "Uttar Pradesh" just because "Kanpur" is mentioned) — only extract what is explicitly printed.
4. Separate School Name From Address: Codes, "VILL", locality, and city/district text belong in school_address, never in school_name.
5. Unlabeled Tokens: If address text has no explicit "DIST"/"STATE" labels, put ambiguous parts (locality/village names) into address_line rather than guessing which field they belong to.

DOCUMENT TEXT:
{text}
"""