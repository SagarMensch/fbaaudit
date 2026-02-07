import re

# Read the file
with open(r'c:\Users\sagar\Downloads\newown - Copy\pages\CarrierPerformance.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Add state for viewing escalation details
state_section = r"const \[escalatedIncidents, setEscalatedIncidents\] = useState<string\[\]>\(\[\]\);"
new_state = """const [escalatedIncidents, setEscalatedIncidents] = useState<string[]>([]);
    const [showEscalationDetails, setShowEscalationDetails] = useState(false);
    const [selectedEscalation, setSelectedEscalation] = useState<any>(null);"""

content = re.sub(state_section, new_state, content)

# Add function to view escalation details
handler_section = r"const handleEscalate = \(incident: any\) => \{"
new_handler = """const viewEscalationDetails = (escalationId: string) => {
        const escalations = JSON.parse(localStorage.getItem('carrier_escalations') || '[]');
        const escalation = escalations.find((esc: any) => esc.id === escalationId);
        if (escalation) {
            setSelectedEscalation(escalation);
            setShowEscalationDetails(true);
        }
    };

    const handleEscalate = (incident: any) => {"""

content = re.sub(handler_section, new_handler, content)

# Make escalation ID clickable
old_esc_id = r'\{escalations\.find\(\(esc: any\) => esc\.incidentId === inc\.id\)\?\.id \|\| \'ESCALATED\'\}'
new_esc_id = '''<button 
                                                            onClick={(e) => { 
                                                                e.stopPropagation(); 
                                                                const escId = escalations.find((esc: any) => esc.incidentId === inc.id)?.id;
                                                                if (escId) viewEscalationDetails(escId);
                                                            }}
                                                            className="hover:underline"
                                                        >
                                                            {escalations.find((esc: any) => esc.incidentId === inc.id)?.id || 'ESCALATED'}
                                                        </button>'''

content = re.sub(old_esc_id, new_esc_id, content)

# Write back
with open(r'c:\Users\sagar\Downloads\newown - Copy\pages\CarrierPerformance.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Added escalation details viewer!")
