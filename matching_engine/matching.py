import json
import re
import sys
from datetime import datetime

DATE_FORMATS = [
    "%Y-%m-%d",
    "%d-%m-%Y",
    "%d/%m/%Y",
    "%m/%d/%Y",
    "%d %b %Y",
    "%d %B %Y",
    "%Y/%m/%d",
]

THRESHOLD_GREEN = 95
THRESHOLD_AMBER = 65

def normalize(value):
    s = str(value or "").lower()
    s = re.sub(r"[^a-z0-9\s]", "", s)
    return re.sub(r"\s+", " ", s).strip()


def levenshtein(a, b):
    m, n = len(a), len(b)
    dp = list(range(n + 1))
    for i in range(1, m + 1):
        prev = dp[:]
        dp[0] = i
        for j in range(1, n + 1):
            if a[i - 1] == b[j - 1]:
                dp[j] = prev[j - 1]
            else:
                dp[j] = 1 + min(prev[j], dp[j - 1], prev[j - 1])
    return dp[n]


def parse_date(value):
    s = str(value or "").strip()
    for fmt in DATE_FORMATS:
        try:
            return datetime.strptime(s, fmt)
        except ValueError:
            continue
    return None


def detect_type(value):
    if not isinstance(value, str):
        return "exact"
    s = value.strip()
    if parse_date(s):
        return "date"
    if re.fullmatch(r"[A-Za-z0-9]{1,15}", s):
        return "exact"
    if 2 <= len(s.split()) <= 6 and all(
        re.fullmatch(r"[A-Za-z'.]+", w) for w in s.split()
    ):
        return "name"
    return "tokens"


def score_exact(a, b):
    return 1.0 if normalize(a) == normalize(b) else 0.0


def score_date(a, b):
    da, db = parse_date(a), parse_date(b)
    if da and db:
        return 1.0 if da.date() == db.date() else 0.0
    return score_exact(a, b)


def score_name(a, b):
    na, nb = normalize(a), normalize(b)
    if na == nb:
        return 1.0
    max_len = max(len(na), len(nb))
    if max_len == 0:
        return 1.0
    lev_sim = 1.0 - levenshtein(na, nb) / max_len
    ta, tb = set(na.split()), set(nb.split())
    union = len(ta | tb)
    jaccard = len(ta & tb) / union if union else 1.0
    return max(lev_sim, jaccard)


def score_tokens(a, b):
    na, nb = normalize(a), normalize(b)
    if na == nb:
        return 1.0
    ta, tb = set(na.split()), set(nb.split())
    union = len(ta | tb)
    return len(ta & tb) / union if union else 0.0


def get_flag(score_pct):
    if score_pct >= THRESHOLD_GREEN:
        return "GREEN"
    if score_pct >= THRESHOLD_AMBER:
        return "AMBER"
    return "RED"


def get_overall_flag(overall_score):
    """Separate logic for overall score flag - can have different thresholds if needed"""
    if overall_score >= 95:
        return "GREEN"
    if overall_score >= 75:
        return "AMBER"
    return "RED"


def flatten(d, parent_key="", sep="."):
    """Flatten nested dicts so each leaf field gets its own key."""
    items = {}
    if not isinstance(d, dict):
        return {parent_key: d} if parent_key else {}
    for k, v in d.items():
        new_key = f"{parent_key}{sep}{k}" if parent_key else k
        if isinstance(v, dict):
            items.update(flatten(v, new_key, sep))
        else:
            items[new_key] = v
    return items


def match(pdf_json, exec_json):
    pdf_json = flatten(pdf_json)
    exec_json = flatten(exec_json)
    results = []
    all_keys = list(dict.fromkeys(list(pdf_json.keys()) + list(exec_json.keys())))

    for key in all_keys:
        val_a = pdf_json.get(key)
        val_b = exec_json.get(key)

        sample = val_a if val_a is not None else val_b
        field_type = detect_type(sample)

        if val_a is None or val_b is None:
            score = 0.0
        elif field_type == "exact":
            score = score_exact(val_a, val_b)
        elif field_type == "date":
            score = score_date(val_a, val_b)
        elif field_type == "name":
            score = score_name(val_a, val_b)
        else:
            score = score_tokens(val_a, val_b)

        score_pct = round(score * 100)
        results.append(
            {
                "key": key,
                "pdf_value": val_a,
                "exec_value": val_b,
                "type": field_type,
                "score_pct": score_pct,
                "flag": get_flag(score_pct),
            }
        )

    overall_score = 0
    if results:
        overall_score = round(sum(r["score_pct"] for r in results) / len(results))

    return {
        "results": results,
        "overall_score": overall_score,
        "overall_flag": get_overall_flag(overall_score),
    }


if __name__ == "__main__":

    pdf_data = {
        "full_name": "Rajesh Kumar Sharma",
        "dob": "15/03/1990",
        "pan_number": "ABCPS1234D",
        "aadhar_last4": "5678",
        "address": "42 MG Road, Lucknow, UP 226001",
        "phone": "9876543210",
        "employer": "Infosys Limited",
        "designation": "Software Engineer",
    }
    exec_data = {
        "full_name": "Rajesh K Sharma",
        "dob": "1990-03-15",
        "pan_number": "ABCPS124D",
        "aadhar_last4": "5678",
        "address": "42 MG Road, Lucknow 226001",
        "phone": "9876543211",
        "employer": "Infosys Ltd.",
        "designation": "Sr Software Engineer",
    }

    # pdf_data = {
    #     "child_name_eng": "SANVI SINGH",
    #     "date_of_birth_eng": "09/12/2023",
    #     "place_of_birth_eng": "CHAND CHOURA, VISHNU PAD",
    #     "father_name_eng": "AMIT KUMAR SINGH",
    #     "mother_name_eng": "SUMAN KUMARI",
    # }
    # exec_data = {
    #     "child_name_eng": "SANVISINGH",
    #     "date_of_birth_eng": "09/12/2023",
    #     "place_of_birth_eng": "CHAND CHOURA VISHNU PAD 20012",
    #     "father_name_eng": "AMIT SINGH",
    #     "mother_name_eng": "SUMAN KUMARI",
    # }

    print(json.dumps(match(pdf_data, exec_data), indent=2))