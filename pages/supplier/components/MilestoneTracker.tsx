import React from 'react';
import { Check, Clock } from 'lucide-react'; // Keep utility icons
import { Geo3DTruck, Geo3DMapPin } from './3DGeometricIcons';

interface MilestoneProps {
    status: 'PLACED' | 'GATE_IN' | 'UNLOADING' | 'GATE_OUT' | 'COMPLETED';
    timestamps: {
        placed?: string;
        gateIn?: string;
        unloading?: string;
        gateOut?: string;
    };
}

const STEPS = [
    { id: 'PLACED', label: 'Vehicle Placed', icon: Geo3DTruck },
    { id: 'GATE_IN', label: 'Gate In', icon: Geo3DMapPin },
    { id: 'UNLOADING', label: 'Unloading', icon: Clock },
    { id: 'GATE_OUT', label: 'Gate Out', icon: Check },
];

export const MilestoneTracker: React.FC<MilestoneProps> = ({ status, timestamps }) => {
    const getCurrentStepIndex = () => {
        switch (status) {
            case 'PLACED': return 0;
            case 'GATE_IN': return 1;
            case 'UNLOADING': return 2;
            case 'GATE_OUT': return 3;
            case 'COMPLETED': return 4;
            default: return 0;
        }
    };

    const currentStep = getCurrentStepIndex();

    return (
        <div className="w-full">
            <div className="relative flex items-center justify-between w-full">
                <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-full h-1 bg-slate-100 -z-10 rounded-full"></div>
                <div className="absolute left-0 top-1/2 transform -translate-y-1/2 h-1 bg-blue-500 transition-all duration-500 -z-10 rounded-full" style={{ width: `${(currentStep / 3) * 100}%` }}></div>

                {STEPS.map((step, index) => {
                    const isCompleted = index <= currentStep;
                    const isCurrent = index === currentStep;

                    // Resolve timestamp key safely
                    const timeKey = step.id === 'PLACED' ? 'placed'
                        : step.id === 'GATE_IN' ? 'gateIn'
                            : step.id === 'UNLOADING' ? 'unloading'
                                : 'gateOut';

                    const time = timestamps[timeKey as keyof typeof timestamps];

                    return (
                        <div key={step.id} className="flex flex-col items-center group relative">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center border-4 transition-all duration-300 z-10 ${isCompleted
                                ? 'bg-blue-600 border-white shadow-md text-white scale-100'
                                : 'bg-white border-slate-200 text-slate-300'
                                } ${isCurrent ? 'ring-4 ring-blue-100' : ''}`}>
                                <step.icon size={16} />
                            </div>
                            <div className="mt-3 text-center">
                                <p className={`text-[10px] font-bold uppercase tracking-wider ${isCompleted ? 'text-slate-800' : 'text-slate-400'}`}>
                                    {step.label}
                                </p>
                                {time && (
                                    <p className="text-[10px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded mt-1 inline-block">
                                        {time}
                                    </p>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
