VOTER_ID_PROMPT = """
Extract the following fields from this raw Voter ID (EPIC) Card text:

### Essential Details
- name: Full name in English
- epic_number: EPIC number / Voter ID number as printed (usually a 10-character alphanumeric code)
- gender: Gender/sex in English
- date_of_birth: Date of birth in English (format as DD/MM/YYYY if possible)
- relation_name: Father's/mother's/husband's name as printed
- relation_type: Relation prefix — Father, Husband, Mother, or Guardian

### Address Details
- voter_address: the voter's residential address, with:
  - address_line: house no./street/locality/village text that doesn't cleanly map to city_or_village or district (e.g. "H.NO 45, VILL ANANDPURAM, KALYANPUR")
  - city_or_village: city, town, or village name, if identifiable
  - district: district name — only if explicitly labeled (e.g. "DIST") or is an unambiguous, well-known district name in the text
  - state: state name — ONLY if literally printed in the source text. Do NOT infer state from city/district knowledge.
  - pincode: 6-digit PIN code, if present

### Electoral Details
- assembly_constituency: Assembly Constituency (AC) name and/or number
- issue_date: Date of issue, if printed

### Extraction Rules:
1. Handle OCR Artifacts: Reconstruct messy text, misspellings, or broken tables based on context.
2. Missing Data: If a field is not present in the document, return null. Do not hallucinate or guess missing values.
3. DOB vs Age: Older Voter ID cards often print only "Age" instead of a full date of birth — extract whichever is present, and do not compute one from the other.
4. No Inference Beyond Text: Never infer state, district, or pincode from general knowledge (e.g. do not assume a state just because a city/district is mentioned) — only extract what is explicitly printed.
5. Voter Address vs Polling Station: Do not confuse the elector's residential address with the polling station address — keep them in their respective fields.
6. Unlabeled Tokens: If address text has no explicit "DIST"/"STATE" labels, put ambiguous parts (locality/village names) into address_line rather than guessing which field they belong to.

DOCUMENT TEXT:
{text}
"""