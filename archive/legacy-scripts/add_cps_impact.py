import re

# Read the file
with open(r'c:\Users\sagar\Downloads\newown - Copy\pages\CarrierPerformance.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Find the carriers array creation and add CPS score impact calculation
old_carriers = r"const carriers = CARRIERS_DEEP\.map\(c => \(\{\s+\.\.\.c,\s+shipmentsYTD: Math\.floor\(c\.shipmentsYTD \* multiplier\),\s+totalSpendYTD: Math\.floor\(c\.totalSpendYTD \* multiplier\)\s+\}\)\)\.sort\(\(a, b\) => b\.cpsScore - a\.cpsScore\);"

new_carriers = """const carriers = CARRIERS_DEEP.map(c => {
        // Get incident statistics for this carrier
        const incidentStats = incidentService.getCarrierIncidentStats(c.name);
        const cpsImpact = incidentService.calculateIncidentImpact(c.name);
        
        return {
            ...c,
            shipmentsYTD: Math.floor(c.shipmentsYTD * multiplier),
            totalSpendYTD: Math.floor(c.totalSpendYTD * multiplier),
            // Add incident data
            incidentCount: incidentStats.total,
            openIncidents: incidentStats.open,
            escalatedIncidents: incidentStats.escalated,
            criticalIncidents: incidentStats.criticalCount,
            totalIncidentLoss: incidentStats.totalLoss,
            // Calculate adjusted CPS score
            baseCpsScore: c.cpsScore,
            cpsScore: Math.max(0, c.cpsScore + cpsImpact) // Ensure score doesn't go below 0
        };
    }).sort((a, b) => b.cpsScore - a.cpsScore);"""

content = re.sub(old_carriers, new_carriers, content, flags=re.DOTALL)

# Write back
with open(r'c:\Users\sagar\Downloads\newown - Copy\pages\CarrierPerformance.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Added CPS score impact calculation!")
