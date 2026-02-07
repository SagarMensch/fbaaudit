import re

# Read the file
with open(r'c:\Users\sagar\Downloads\newown - Copy\pages\VendorScorecard.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Update handleLogIncident to use centralized incident service
old_log_incident = r"const handleLogIncident = \(\) => \{\s+if \(!newIncident\.remarks\) return;\s+scorecardService\.reportIncident\(\{\s+vendorId: selectedVendor,\s+date: new Date\(\)\.toISOString\(\)\.split\('T'\)\[0\],\s+type: newIncident\.type as any,\s+remarks: newIncident\.remarks,\s+costImpact: newIncident\.impact\s+\}\);\s+setRefreshTrigger\(prev => prev \+ 1\);\s+setIsIncidentModalOpen\(false\);\s+setNewIncident\(\{ type: 'DELAY', remarks: '', impact: 0 \}\);\s+\};"

new_log_incident = """const handleLogIncident = () => {
        if (!newIncident.remarks) return;
        
        // Log to local scorecard service
        scorecardService.reportIncident({
            vendorId: selectedVendor,
            date: new Date().toISOString().split('T')[0],
            type: newIncident.type as any,
            remarks: newIncident.remarks,
            costImpact: newIncident.impact
        });
        
        // CROSS-LINKING: Also log to centralized incident service
        incidentService.addIncident({
            date: new Date().toISOString().split('T')[0],
            carrier: scorecard.vendorName,
            carrierId: selectedVendor,
            type: newIncident.type as any,
            remarks: newIncident.remarks,
            lossImpact: newIncident.impact,
            status: 'OPEN',
            severity: newIncident.impact > 20000 ? 'CRITICAL' : newIncident.impact > 10000 ? 'HIGH' : 'MEDIUM',
            createdBy: 'Blackbook User'
        });
        
        setRefreshTrigger(prev => prev + 1);
        setIsIncidentModalOpen(false);
        setNewIncident({ type: 'DELAY', remarks: '', impact: 0 });
    };"""

content = re.sub(old_log_incident, new_log_incident, content, flags=re.DOTALL)

# Update submitEscalation to use centralized service
old_escalation = r"const submitEscalation = \(\) => \{\s+// Save escalation to localStorage\s+const escalations = JSON\.parse\(localStorage\.getItem\('vendor_escalations'\) \|\| '\[\]'\);\s+escalations\.push\(\{\s+id: `ESC-\$\{Date\.now\(\)\}`,\s+incidentId: selectedIncidentForAction\.id,\s+vendor: scorecard\.vendorName,\s+date: new Date\(\)\.toISOString\(\),\s+status: 'OPEN',\s+priority: 'HIGH',\s+assignedTo: 'Operations Manager'\s+\}\);\s+localStorage\.setItem\('vendor_escalations', JSON\.stringify\(escalations\)\);\s+alert\(`Escalation created: ESC-\$\{Date\.now\(\)\}\\nAssigned to: Operations Manager\\nStatus: OPEN`\);\s+setShowEscalationModal\(false\);\s+\};"

new_escalation = """const submitEscalation = () => {
        // CROSS-LINKING: Use centralized escalation service
        const escalation = incidentService.createEscalation(
            selectedIncidentForAction,
            'Operations Manager'
        );
        
        alert(`Escalation created: ${escalation.id}\\nAssigned to: ${escalation.assignedTo}\\nStatus: ${escalation.status}`);
        setShowEscalationModal(false);
        setRefreshTrigger(prev => prev + 1);
    };"""

content = re.sub(old_escalation, new_escalation, content, flags=re.DOTALL)

# Write back
with open(r'c:\Users\sagar\Downloads\newown - Copy\pages\VendorScorecard.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Integrated incident service into VendorScorecard!")
