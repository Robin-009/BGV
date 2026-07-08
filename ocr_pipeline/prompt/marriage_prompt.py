MARRIAGE_RECORD_PROMPT = """
Extract the following fields from this raw Marriage Certificate or Marriage Record text:

### Essential Details
- spouse1_name: Full name of the first spouse (groom / husband)
- spouse2_name: Full name of the second spouse (bride / wife)
- certificate_number: The official certificate or registration number

### Event Details
- date_of_marriage: The exact date the marriage occurred (format as DD/MM/YYYY if possible)
- place_of_marriage: The venue, city, or full address where the marriage was solemnized
- registrar_office: ONLY the name of the registrar office/institution. Do NOT include address or location text in this field.
- office_address: address details separated from registrar_office, with:
  - address_line: building/street/locality/area text that doesn't cleanly map to city_or_village or district
  - city_or_village: city, town, or village name, if identifiable
  - district: district name — only if explicitly labeled (e.g. "DIST") or is an unambiguous, well-known district name in the text
  - state: state name — ONLY if literally printed in the source text. Do NOT infer state from city/district knowledge.
  - pincode: 6-digit PIN code, if present
- date_of_registration: The date the document was officially signed or registered by the registrar

### Nested Entities
- witnesses: Extract a list of any witnesses mentioned, including their name and address.

### Extraction Rules:
1. Handle OCR Artifacts: Reconstruct messy text, misspellings, or broken tables based on context.
2. Missing Data: If a field is not present in the document, return null. Do not hallucinate or guess missing values.
3. No Inference Beyond Text: Never infer state, district, or pincode from general knowledge (e.g. do not assume a state just because a city is mentioned) — only extract what is explicitly printed.
4. Separate Office Name From Address: Institution name text belongs in registrar_office, never in office_address, and vice versa.
5. Unlabeled Tokens: If address text has no explicit "DIST"/"STATE" labels, put ambiguous parts (locality/area names) into address_line rather than guessing which field they belong to.

DOCUMENT TEXT:
{text}
"""