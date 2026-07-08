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
- address: The full printed address of the passport holder
- pincode: 6-digit PIN code if present
- district: District present in the address if identifiable
- city or village: City or village present in the address if identifiable
- state: State if identifiable

### Extraction Rules:
1. Handle OCR Artifacts: Reconstruct messy text, misspellings, or broken tables based on context. Pay special attention to the Machine Readable Zone (MRZ) at the bottom for verifying name, passport number, and dates.
2. Missing Data: If a field is not present in the document, return null. Do not hallucinate or guess missing values.

DOCUMENT TEXT:
{text}
"""