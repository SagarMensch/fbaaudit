import re

# Read the file
with open(r'c:\Users\sagar\Downloads\newown - Copy\pages\CarrierPerformance.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Find the CPS Score row and add incident badges row after it
old_cps_row = r'<tr className="bg-gray-100 font-bold">\s+<td className="border border-gray-300 px-2 py-1">CPS Score</td>\s+\{carriers\.map\(c => \(\s+<td key=\{c\.id\} className="border border-gray-300 px-2 py-1 text-center font-mono">\{c\.cpsScore\.toFixed\(2\)\}</td>\s+\)\)\}\s+</tr>'

new_cps_and_incidents = '''<tr className="bg-gray-100 font-bold">
                                        <td className="border border-gray-300 px-2 py-1">CPS Score</td>
                                        {carriers.map(c => (
                                            <td key={c.id} className="border border-gray-300 px-2 py-1 text-center">
                                                <div className="font-mono font-bold">
                                                    {c.cpsScore.toFixed(2)}
                                                    {c.baseCpsScore && c.baseCpsScore !== c.cpsScore && (
                                                        <span className="text-[9px] text-red-600 ml-1">
                                                            ({(c.cpsScore - c.baseCpsScore).toFixed(1)})
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                        ))}
                                    </tr>
                                    <tr className="bg-blue-50">
                                        <td className="border border-gray-300 px-2 py-1 font-bold">Incidents</td>
                                        {carriers.map(c => (
                                            <td key={c.id} className="border border-gray-300 px-2 py-1 text-center">
                                                <div className="flex flex-col gap-1">
                                                    <div className="flex justify-center gap-1">
                                                        {c.incidentCount > 0 && (
                                                            <span className="px-1 py-0.5 bg-gray-600 text-white text-[9px] font-bold">
                                                                {c.incidentCount} Total
                                                            </span>
                                                        )}
                                                        {c.openIncidents > 0 && (
                                                            <span className="px-1 py-0.5 bg-red-600 text-white text-[9px] font-bold">
                                                                {c.openIncidents} Open
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="flex justify-center gap-1">
                                                        {c.escalatedIncidents > 0 && (
                                                            <span className="px-1 py-0.5 bg-purple-600 text-white text-[9px] font-bold">
                                                                {c.escalatedIncidents} Escalated
                                                            </span>
                                                        )}
                                                        {c.criticalIncidents > 0 && (
                                                            <span className="px-1 py-0.5 bg-orange-600 text-white text-[9px] font-bold">
                                                                {c.criticalIncidents} Critical
                                                            </span>
                                                        )}
                                                    </div>
                                                    {c.incidentCount === 0 && (
                                                        <span className="text-green-600 text-[9px] font-bold">No Incidents</span>
                                                    )}
                                                </div>
                                            </td>
                                        ))}
                                    </tr>'''

content = re.sub(old_cps_row, new_cps_and_incidents, content, flags=re.DOTALL)

# Write back
with open(r'c:\Users\sagar\Downloads\newown - Copy\pages\CarrierPerformance.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Added incident badges to carrier table!")
