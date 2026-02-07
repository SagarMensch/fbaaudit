import re

# Read the file
with open(r'c:\Users\sagar\Downloads\newown - Copy\pages\CarrierPerformance.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Find the CarrierPerformance component start and add initialization
# Look for the first useState after the component definition
component_start = r"export const CarrierPerformance: React\.FC = \(\) => \{\s+const \[selectedPeriod"

initialization = """export const CarrierPerformance: React.FC = () => {
    // Initialize incident service with existing incidents
    React.useEffect(() => {
        incidentService.initializeFromExisting(INCIDENTS_DEEP);
    }, []);

    const [selectedPeriod"""

content = re.sub(component_start, initialization, content)

# Write back
with open(r'c:\Users\sagar\Downloads\newown - Copy\pages\CarrierPerformance.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Added incident service initialization!")
