MARRIAGE_RECORD_PROMPT = """
Extract the following fields from this raw Marriage Certificate or Marriage Record text:

### Essential Details
- spouse1_name: Full name of the first spouse (groom / husband)
- spouse2_name: Full name of the second spouse (bride / wife)
- certificate_number: The official certificate or registration number

### Event Details
- date_of_marriage: The exact date the marriage occurred (format as DD/MM/YYYY if possible)
- place_of_marriage: The venue, city, or full address where the marriage was solemnized
- registrar_office: Registrar office / institution name in English
- office_address: Registrar office address in English (Area, District, State)
- date_of_registration: The date the document was officially signed or registered by the registrar

### Nested Entities
- witnesses: Extract a list of any witnesses mentioned, including their name and address.

### Extraction Rules:
1. Handle OCR Artifacts: Reconstruct messy text, misspellings, or broken tables based on context.
2. Missing Data: If a field is not present in the document, return null. Do not hallucinate or guess missing values.

DOCUMENT TEXT:
{text}
"""