import re

# Read the file
with open(r'c:\Users\sagar\Downloads\newown - Copy\pages\CarrierPerformance.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Find the Actions column in the incident table and replace it with proper logic
# This will show escalation ID for escalated incidents, disable button for escalated ones

old_actions = r'<td className="border border-gray-300 px-2 py-1 text-center">\s+<button className="text-blue-600 underline text-\[9px\] mr-2 hover:text-blue-800">View</button>\s+<button onClick=\{\(e\) => \{ e\.stopPropagation\(\); handleEscalate\(inc\); \}\} className="text-red-600 underline text-\[9px\] hover:text-red-800">Escalate</button>\s+</td>'

new_actions = '''<td className="border border-gray-300 px-2 py-1 text-center">
                                                <button className="text-blue-600 underline text-[9px] mr-2 hover:text-blue-800">View</button>
                                                {inc.status === 'ESCALATED' ? (
                                                    <span className="text-purple-600 font-mono text-[9px] font-bold">
                                                        {escalations.find((esc: any) => esc.incidentId === inc.id)?.id || 'ESCALATED'}
                                                    </span>
                                                ) : (
                                                    <button 
                                                        onClick={(e) => { e.stopPropagation(); handleEscalate(inc); }} 
                                                        className="text-red-600 underline text-[9px] hover:text-red-800"
                                                    >
                                                        Escalate
                                                    </button>
                                                )}
                                            </td>'''

content = re.sub(old_actions, new_actions, content, flags=re.DOTALL)

# Write back
with open(r'c:\Users\sagar\Downloads\newown - Copy\pages\CarrierPerformance.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Fixed escalation button logic!")
