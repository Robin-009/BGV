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

### Registration Office Details
- registration_office: ONLY the name of the registration office/authority (e.g. "Municipal Corporation of Delhi", "Office of Registrar of Births & Deaths"). Do NOT include address or location text in this field.
- registration_office_address: address details separated from registration_office, with:
  - address_line: building/street/locality/area text that doesn't cleanly map to city_or_village or district
  - city_or_village: city, town, or village name, if identifiable
  - district: district name — only if explicitly labeled (e.g. "DIST") or is an unambiguous, well-known district name in the text
  - state: state name — ONLY if literally printed in the source text. Do NOT infer state from city/district knowledge.
  - pincode: 6-digit PIN code, if present

### Extraction Rules:
1. Handle OCR Artifacts: Reconstruct messy text, misspellings, or broken tables based on context.
2. Missing Data: If a field is not present in the document, return null. Do not hallucinate or guess missing values.
3. No Inference Beyond Text: Never infer state, district, or pincode from general knowledge (e.g. do not assume a state just because a city is mentioned) — only extract what is explicitly printed.
4. Separate Names From Addresses: Institution or locality names belong in registration_office/city_or_village fields, never mixed into address_line; keep office name and office address strictly separate.
5. Unlabeled Tokens: If address text has no explicit "DIST"/"STATE"/"VILL" labels, put ambiguous parts (locality/village names) into address_line rather than guessing which field they belong to.

DOCUMENT TEXT:
{text}
"""