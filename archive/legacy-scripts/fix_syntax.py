import re

# Read the file
with open(r'c:\Users\sagar\Downloads\newown - Copy\pages\CarrierPerformance.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix the malformed line - replace everything from "const [carrierFilter" to the end of the useState<string[]>([]);
pattern = r"const \[carrierFilter[^\n]*useState<string\[\]>\(\[\]\);"
replacement = "const [carrierFilter, setCarrierFilter] = useState('ALL');\n    const [escalatedIncidents, setEscalatedIncidents] = useState<string[]>([]);"

content = re.sub(pattern, replacement, content, flags=re.DOTALL)

# Write back
with open(r'c:\Users\sagar\Downloads\newown - Copy\pages\CarrierPerformance.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Fixed!")
