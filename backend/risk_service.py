# Severity weights for specific attack types (0-100 scale baseline)
THREAT_SEVERITY = {
    "BENIGN": 0,
    "Heartbleed": 95,          # critical vulnerability, data leakage
    "DDoS": 85,
    "DoS Hulk": 80,
    "DoS GoldenEye": 80,
    "DoS Slowhttptest": 75,
    "DoS slowloris": 75,
    "SSH-Patator": 70,         # brute force login attempts
    "FTP-Patator": 70,
    "Web Attack \x96 Sql Injection": 90,
    "Web Attack \x96 Brute Force": 65,
    "Web Attack \x96 XSS": 60,
}

def calculate_risk_score(threat_type: str, confidence: float) -> dict:
    """
    Calculates a risk score (0-100) and risk level based on
    the specific attack type and the AI's confidence.
    """
    base_severity = THREAT_SEVERITY.get(threat_type, 50)  # default 50 for unknown types

    if threat_type == "BENIGN":
        risk_score = round((1 - confidence) * 20)
    else:
        # scale the base severity by how confident the model is
        risk_score = round(base_severity * confidence + (base_severity * 0.2))

    risk_score = max(0, min(100, risk_score))

    if risk_score >= 80:
        risk_level = "Critical"
    elif risk_score >= 60:
        risk_level = "High"
    elif risk_score >= 30:
        risk_level = "Medium"
    else:
        risk_level = "Low"

    return {
        "risk_score": risk_score,
        "risk_level": risk_level
    }