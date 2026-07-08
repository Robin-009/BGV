DRIVING_LICENCE_PROMPT = """
Extract the following fields from this raw Indian Driving Licence text:

### Essential Details
- holder_name: Licence holder's full name in English
- licence_number: Driving licence number as printed (e.g., DL-0420110149646)
- date_of_birth: Date of birth in English (format as DD/MM/YYYY if possible)
- blood_group: Blood group if present

### Family Details
- father_or_guardian_name: Father's/guardian's name in English if present

### Address & Authority
- address: Full address as printed in English
- pincode: 6-digit PIN code if present
- district: District present in the address if identifiable
- city or village: City present in the address if identifiable
- state: State from the addressif identifiable
- issuing_authority: Issuing RTO/authority name
- state_of_issue: State of issue if identifiable

### Validity Details
- date_of_issue: Date of issue (DD/MM/YYYY if possible)
- valid_till: Valid until/expiry date (DD/MM/YYYY if possible)
- vehicle_classes: List of vehicle classes / COV authorized (e.g., MCWG, LMV, TRANS)

### Extraction Rules:
1. Handle OCR Artifacts: Reconstruct messy text, misspellings, or broken tables based on context.
2. Missing Data: If a field is not present in the document, return null. Do not hallucinate or guess missing values.
3. For vehicle_classes, return an empty list if none are found.

DOCUMENT TEXT:
{text}
"""
