
import json
from datetime import datetime, timedelta
import random

data = []
start_date = datetime(2023, 1, 1)
for i in range(60):
    date = start_date + timedelta(days=i)
    # Sine wave + trend + noise
    import math
    volume = 10 + (i * 0.1) + (5 * math.sin(i / 7)) + random.uniform(-2, 2)
    data.append({"date": date.strftime("%Y-%m-%d"), "volume": max(0, volume)})

output = {
    "horizon": 12,
    "data": json.dumps(data)  # R script expects 'data' as JSON string inside the JSON object
}

print(json.dumps(output))
