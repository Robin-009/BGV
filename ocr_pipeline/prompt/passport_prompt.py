PASSPORT_PROMPT = """
Extract the following fields from this raw Passport text:

### Primary Document Details
- passport_number: The unique alphanumeric passport number
- country_code: Issuing country code (e.g., IND, USA)
- nationality: Nationality of the passport holder

### Personal Details
- surname: Last name or surname of the holder
- given_name: First and middle names of the holder
- gender: Gender/Sex (e.g., M, F, X)
- date_of_birth: Date of birth (format as DD/MM/YYYY if possible)
- place_of_birth: City, State, or Country of birth

### Family Details
- father_name: Legal father's full name
- mother_name: Legal mother's full name
- spouse_name: Spouse's full name, if endorsed/printed

### Validity & Issuance
- date_of_issue: Date the passport was issued (DD/MM/YYYY)
- date_of_expiry: Date the passport expires / validity end date (DD/MM/YYYY)
- place_of_issue: Issuing authority or location
- file_number: Official file or reference number usually found on the back page

### Contact Details
- address: The full printed address of the passport holder, exactly as printed
- address_line: house no./street/VILLAGE/PO text that doesn't cleanly map to city_or_village or district (e.g. "H.NO. 173, VILLAGE RAOVALI, PO NURPUR")
- city_or_village: city or village name. If the text explicitly contains "VILLAGE"/"VILL" followed by a name, that name is city_or_village.
- district: district name — only if explicitly labeled (e.g. "DIST") or is an unambiguous, well-known district-level name in the text. A place name near the PIN code that is NOT marked "VILLAGE"/"VILL" is more likely to be the district, especially if it matches a known district in that state.
- pincode: 6-digit PIN code, if present
- state: state name — ONLY if literally printed in the source text. Do NOT infer state from city/district knowledge.

### Extraction Rules:
1. Handle OCR Artifacts: Reconstruct messy text, misspellings, or broken tables based on context. Pay special attention to the Machine Readable Zone (MRZ) at the bottom for verifying name, passport number, and dates.
2. Missing Data: If a field is not present in the document, return null. Do not hallucinate or guess missing values.
3. No Inference Beyond Text: Never infer state or district from general knowledge of Indian geography — only extract what is explicitly printed.
4. VILLAGE Marker Priority: A name explicitly marked "VILLAGE"/"VILL" is always city_or_village — do not overwrite it with a different place name found later in the address. Do not confuse a district-level name (e.g. appearing right before the state/PIN) with the village/city itself.
5. Unlabeled Tokens: If address text has no explicit "DIST"/"STATE"/"VILL" labels, put ambiguous parts into address_line rather than guessing which field they belong to.

DOCUMENT TEXT:
{text}
"""