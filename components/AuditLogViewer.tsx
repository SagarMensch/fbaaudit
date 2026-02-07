import React from 'react';
import { Clock, User, FileText, AlertTriangle, CheckCircle } from 'lucide-react';

interface AuditLogEntry {
    id: string;
    timestamp: string;
    user_id: string;
    user_name: string;
    action: string;
    field_changed?: string;
    old_value?: string;
    new_value?: string;
    comment?: string;
}

interface AuditLogViewerProps {
    logs: AuditLogEntry[];
}

export const AuditLogViewer: React.FC<AuditLogViewerProps> = ({ logs }) => {
    if (!logs || logs.length === 0) {
        return <div className="p-4 text-center text-gray-400 text-sm">No audit history available.</div>;
    }

    return (
        <div className="border border-gray-200 rounded-lg bg-white shadow-sm overflow-hidden">
            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center">
                <Clock size={16} className="text-gray-500 mr-2" />
                <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide">System Audit Trail</h3>
            </div>
            <div className="max-h-96 overflow-y-auto custom-scrollbar p-0">
                <table className="w-full text-xs text-left">
                    <thead className="bg-gray-50 text-gray-500 font-bold border-b border-gray-100 sticky top-0">
                        <tr>
                            <th className="px-4 py-2">Timestamp</th>
                            <th className="px-4 py-2">User</th>
                            <th className="px-4 py-2">Action</th>
                            <th className="px-4 py-2">Details</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {logs.map((log) => (
                            <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-4 py-3 text-gray-500 font-mono whitespace-nowrap">
                                    {new Date(log.timestamp).toLocaleString()}
                                </td>
                                <td className="px-4 py-3">
                                    <div className="flex items-center text-gray-700 font-medium">
                                        <User size={12} className="mr-1.5 text-gray-400" />
                                        {log.user_name}
                                    </div>
                                    <div className="text-[10px] text-gray-400 pl-4">{log.user_id}</div>
                                </td>
                                <td className="px-4 py-3">
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase ${log.action.includes('REJECT') ? 'bg-red-50 text-red-600 border-red-100' :
                                            log.action.includes('APPROVE') ? 'bg-green-50 text-green-600 border-green-100' :
                                                'bg-blue-50 text-blue-600 border-blue-100'
                                        }`}>
                                        {log.action}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-gray-600">
                                    {log.field_changed ? (
                                        <div className="flex flex-col space-y-1">
                                            <div className="font-medium text-gray-800">Changed <span className="font-mono">{log.field_changed}</span></div>
                                            <div className="flex items-center space-x-2 font-mono text-[10px]">
                                                <span className="bg-red-50 text-red-600 px-1 rounded line-through decoration-red-400">{log.old_value}</span>
                                                <span className="text-gray-400">→</span>
                                                <span className="bg-green-50 text-green-600 px-1 rounded">{log.new_value}</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <span>{log.comment || 'No details provided'}</span>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
