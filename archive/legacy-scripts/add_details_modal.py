import re

# Read the file
with open(r'c:\Users\sagar\Downloads\newown - Copy\pages\CarrierPerformance.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Find the closing of the escalation modal and add the details modal after it
insertion_point = r"(\s+)\}\)\}\s+</div>\s+</div>\s+</div>\s+\);\s+\};"

escalation_details_modal = r'''\1)}

                    {/* ESCALATION DETAILS MODAL */}
                    {showEscalationDetails && selectedEscalation && (
                        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
                            <div className="bg-white border-4 border-gray-900 w-full max-w-3xl">
                                <div className="bg-purple-700 px-4 py-3 flex justify-between items-center">
                                    <h3 className="text-white font-bold text-sm uppercase">Escalation Details: {selectedEscalation.id}</h3>
                                    <button onClick={() => setShowEscalationDetails(false)} className="text-white hover:text-gray-300"><X size={20} /></button>
                                </div>
                                <div className="p-6">
                                    <div className="grid grid-cols-2 gap-4 mb-4">
                                        <div className="border-2 border-gray-900 p-3">
                                            <h4 className="text-xs font-bold uppercase mb-2 border-b-2 border-gray-900 pb-1">Escalation Info</h4>
                                            <table className="w-full text-xs">
                                                <tbody>
                                                    <tr className="border-b border-gray-200">
                                                        <td className="py-1 font-bold">ID:</td>
                                                        <td className="py-1 font-mono">{selectedEscalation.id}</td>
                                                    </tr>
                                                    <tr className="border-b border-gray-200">
                                                        <td className="py-1 font-bold">Incident ID:</td>
                                                        <td className="py-1 font-mono">{selectedEscalation.incidentId}</td>
                                                    </tr>
                                                    <tr className="border-b border-gray-200">
                                                        <td className="py-1 font-bold">Date:</td>
                                                        <td className="py-1 font-mono">{new Date(selectedEscalation.date).toLocaleString()}</td>
                                                    </tr>
                                                    <tr>
                                                        <td className="py-1 font-bold">Status:</td>
                                                        <td className="py-1">
                                                            <span className={`px-2 py-1 text-white text-[9px] font-bold ${selectedEscalation.status === 'OPEN' ? 'bg-red-600' : 'bg-green-600'}`}>
                                                                {selectedEscalation.status}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </div>
                                        <div className="border-2 border-gray-900 p-3">
                                            <h4 className="text-xs font-bold uppercase mb-2 border-b-2 border-gray-900 pb-1">Assignment</h4>
                                            <table className="w-full text-xs">
                                                <tbody>
                                                    <tr className="border-b border-gray-200">
                                                        <td className="py-1 font-bold">Carrier:</td>
                                                        <td className="py-1">{selectedEscalation.carrier}</td>
                                                    </tr>
                                                    <tr className="border-b border-gray-200">
                                                        <td className="py-1 font-bold">Priority:</td>
                                                        <td className="py-1">
                                                            <span className={`px-2 py-1 text-white text-[9px] font-bold ${selectedEscalation.priority === 'HIGH' ? 'bg-orange-600' : 'bg-yellow-600'}`}>
                                                                {selectedEscalation.priority}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                    <tr className="border-b border-gray-200">
                                                        <td className="py-1 font-bold">Assigned To:</td>
                                                        <td className="py-1 font-bold">{selectedEscalation.assignedTo}</td>
                                                    </tr>
                                                    <tr>
                                                        <td className="py-1 font-bold">Escalated By:</td>
                                                        <td className="py-1">{selectedEscalation.escalatedBy}</td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                    <div className="bg-blue-50 border-2 border-blue-600 p-4 text-xs">
                                        <strong>Escalation Timeline:</strong>
                                        <ul className="list-disc ml-4 mt-2">
                                            <li>Created: {new Date(selectedEscalation.date).toLocaleString()}</li>
                                            <li>Status: {selectedEscalation.status}</li>
                                            <li>This escalation is tracked in localStorage under key: <code className="bg-gray-200 px-1 font-mono">carrier_escalations</code></li>
                                        </ul>
                                    </div>
                                    <div className="mt-4 flex justify-end">
                                        <button onClick={() => setShowEscalationDetails(false)} className="px-6 py-2 border-2 border-gray-900 bg-purple-700 text-white font-bold text-xs hover:bg-purple-800">Close</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

        </div>
    );
};'''

content = re.sub(insertion_point, escalation_details_modal, content, flags=re.DOTALL)

# Write back
with open(r'c:\Users\sagar\Downloads\newown - Copy\pages\CarrierPerformance.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Added escalation details modal!")
