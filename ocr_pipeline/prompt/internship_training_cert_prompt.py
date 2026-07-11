INTERNSHIP_CERTIFICATE_PROMPT = """
The document text may contain ONE OR MORE separate Internship / Training Certificates.
Identify every distinct certificate and extract the fields below for EACH one.
Return a list under the key "certificate", with one object per certificate.

For each certificate, extract:

### Candidate Details
- candidate_name: Candidate's full name in English

### Company Details
- company_name: Company name in English
- company_address: detailed address of the company, with:
  - address_line: house/shop no., street, locality, VILLAGE, PO text that doesn't cleanly map to city_or_village or district
  - city_or_village: city, town, or village name. If explicitly marked "VILLAGE"/"VILL", use that name.
  - district: district name — only if explicitly labeled (e.g. "DIST") or is an unambiguous, well-known district-level name in the text
  - state: state name — ONLY if literally printed in the source text. Do NOT infer state from city/district knowledge.
  - pincode: postal/PIN code, if present
  - country: country name, if the address is outside India or explicitly printed (e.g. Norway, UK)

### Training Details
- training_location: location where the training was actually conducted (may differ from company_address, e.g. a branch, unit, site, or outlet). Use the same address sub-fields:
  - address_line: house/shop no., street, locality, VILLAGE, PO text that doesn't cleanly map to city_or_village or district
  - city_or_village: city, town, or village name. If explicitly marked "VILLAGE"/"VILL", use that name.
  - district: district name — only if explicitly labeled (e.g. "DIST") or is an unambiguous, well-known district-level name in the text
  - state: state name — ONLY if literally printed in the source text. Do NOT infer state from city/district knowledge.
  - pincode: postal/PIN code, if present
  - country: country name, if the address is outside India or explicitly printed (e.g. Norway, UK)
  If no separate training location is mentioned and only the company address is given, leave training_location null rather than duplicating company_address.
- training_period: time period for which the training was conducted, exactly as printed (e.g. "DD Month YYYY – DD Month YYYY")
- training_program: the specific type/domain of the training program as printed, e.g. "F & B Production", "Front Office Operations"
- nature_of_training: the nature/category of the training as printed, e.g. "Industrial training", "Summer internship"

### Extraction Rules:
1. Multiple Certificates: Treat each employer, letterhead, signature block, or clearly separated
   certificate as a distinct entry. Do NOT merge details from different certificates into one.
   If only one certificate is present, return a list with a single object.
2. Handle OCR Artifacts: Reconstruct messy text, misspellings, or broken tables based on context.
3. Missing Data: If a field is not present for a given certificate, return null for that field.
   Do not hallucinate or guess missing values, and do not copy a value from another certificate.
4. No Inference Beyond Text: Never infer state, district, or country from general knowledge (e.g. do not assume a state just because a city is mentioned) — only extract what is explicitly printed.
5. Non-Indian Addresses: Some certificates may be from companies outside India (e.g. Norway). Extract whatever structured details are present and put the country name in the country field; leave pincode/district/state null if not applicable or not printed.
6. Unlabeled Tokens: If address text has no explicit "DIST"/"STATE"/"VILL" labels, put ambiguous parts into address_line rather than guessing which field they belong to.
7. Company Address vs. Training Location: These may be the same or different. Only populate training_location as a separate address if the document explicitly distinguishes a training/site/unit address from the company's registered/head office address. If the text gives only one address used for both purposes, populate company_address and leave training_location null.

DOCUMENT TEXT:
{text}
"""