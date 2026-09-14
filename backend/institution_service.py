import requests

IPINFO_TOKEN = "b87b1926577e7f"  # replace with your real token

def identify_institution(ip_address: str) -> dict:
    """
    Looks up an IP address to guess which organization it belongs to.
    Returns institution name and a confidence score.
    """
    # Private/local IPs won't have real organization info
    if ip_address.startswith(("192.168.", "10.", "127.")):
        return {
            "institution": "Private/Internal Network",
            "confidence": 0.5
        }

    try:
        response = requests.get(
            f"https://ipinfo.io/{ip_address}/json?token={IPINFO_TOKEN}",
            timeout=5
        )
        data = response.json()

        if "org" in data:
            return {
                "institution": data["org"],
                "confidence": 0.8
            }
        else:
            return {
                "institution": "Unknown",
                "confidence": 0.0
            }
    except Exception as e:
        return {
            "institution": "Lookup Failed",
            "confidence": 0.0
        }