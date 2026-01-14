import re

# Read the file
with open(r'c:\Users\sagar\Downloads\newown - Copy\pages\CarrierPerformance.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Find and replace the filteredIncidents section
old_pattern = r"const filteredCarriers = carrierFilter === 'ALL' \? carriers : carriers\.filter\(c => c\.name === carrierFilter\);\s+const filteredIncidents = INCIDENTS_DEEP\.filter\(inc => \{[^}]+\}\);"

new_code = """const filteredCarriers = carrierFilter === 'ALL' ? carriers : carriers.filter(c => c.name === carrierFilter);
    
    // Read escalations from localStorage to persist status
    const escalations = JSON.parse(localStorage.getItem('carrier_escalations') || '[]');
    const escalatedIds = escalations.map((esc: any) => esc.incidentId);
    
    // Update incident status based on escalations
    const incidentsWithStatus = INCIDENTS_DEEP.map(inc => ({
        ...inc,
        status: escalatedIds.includes(inc.id) ? 'ESCALATED' : inc.status
    }));
    
    const filteredIncidents = incidentsWithStatus.filter(inc => {
        const typeMatch = incidentTypeFilter === 'ALL' || inc.type === incidentTypeFilter;
        const carrierMatch = carrierFilter === 'ALL' || inc.carrier === carrierFilter;
        return typeMatch && carrierMatch;
    });"""

content = re.sub(old_pattern, new_code, content, flags=re.DOTALL)

# Write back
with open(r'c:\Users\sagar\Downloads\newown - Copy\pages\CarrierPerformance.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Fixed incident status persistence!")
