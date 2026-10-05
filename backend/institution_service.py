import os
import requests

IPINFO_TOKEN = os.environ.get("IPINFO_TOKEN", "b87b1926577e7f")  # replace with your real token

def identify_institution(ip_address: str) -> dict:
    """
    Looks up an IP address to guess organization and geographic location.
    Returns institution name, city, country, coordinates, and confidence.
    """
    # Private/local IPs won't have real organization info
    if ip_address.startswith(("192.168.", "10.", "127.")):
        return {
            "institution": "Private/Internal Network",
            "city": "Local Subnet",
            "region": "Intranet",
            "country": "Local Network",
            "country_code": "LAN",
            "loc": "0,0",
            "confidence": 0.5
        }

    try:
        response = requests.get(
            f"https://ipinfo.io/{ip_address}/json?token={IPINFO_TOKEN}",
            timeout=5
        )
        data = response.json()

        org = data.get("org", "Unknown Organization")
        city = data.get("city", "Unknown City")
        region = data.get("region", "Unknown Region")
        country = data.get("country", "Unknown")
        loc = data.get("loc", "")

        return {
            "institution": org,
            "city": city,
            "region": region,
            "country": country,
            "country_code": country,
            "loc": loc,
            "confidence": 0.85 if "org" in data else 0.4
        }
    except Exception as e:
        return {
            "institution": "Lookup Failed",
            "city": "Unknown",
            "region": "Unknown",
            "country": "Unknown",
            "country_code": "UNK",
            "loc": "",
            "confidence": 0.0
        }