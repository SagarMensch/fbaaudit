import requests
import json

try:
    res = requests.post(
        "http://localhost:5000/api/r/forecast",
        json={"horizon": 12, "use_db": True}
    )
    print(f"Status: {res.status_code}")
    print(json.dumps(res.json(), indent=2))
except Exception as e:
    print(e)
