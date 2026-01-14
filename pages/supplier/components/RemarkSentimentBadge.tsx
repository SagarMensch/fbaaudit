import React, { useState, useEffect } from 'react';

// 3D Geometric Icons
const Geo3DSentiment: React.FC<{ size?: number; color?: string }> = ({ size = 24, color = '#00C805' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15h2v2h-2zm1-4c-3.31 0-6-2.69-6-6h2c0 2.21 1.79 4 4 4s4-1.79 4-4h2c0 3.31-2.69 6-6 6z" fill={color} />
        <circle cx="12" cy="12" r="8" stroke="white" strokeWidth="1.5" strokeDasharray="4 2" />
    </svg>
);

const Geo3DAlert: React.FC<{ size?: number; color?: string }> = ({ size = 24, color = '#FF0000' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <path d="M12 2L2 22h20L12 2z" fill={color} />
        <rect x="11" y="9" width="2" height="7" fill="white" />
        <rect x="11" y="18" width="2" height="2" fill="white" />
    </svg>
);

const Geo3DCheck: React.FC<{ size?: number; color?: string }> = ({ size = 24, color = '#00C805' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" fill={color} />
        <path d="M8 12l3 3 5-6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

const Geo3DInfo: React.FC<{ size?: number; color?: string }> = ({ size = 24, color = '#0052FF' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" fill={color} />
        <rect x="11" y="10" width="2" height="6" fill="white" />
        <rect x="11" y="6" width="2" height="2" fill="white" />
    </svg>
);

interface SentimentResult {
    text: string;
    classification: string;
    is_disputed: boolean;
    confidence_score: number;
    confidence_percent: number;
    matched_keywords: string[];
    ui_label: string;
    ui_sublabel: string;
    ui_color: string;
    ui_message: string;
}

interface RemarkSentimentBadgeProps {
    rawText: string | null;
}

export const RemarkSentimentBadge: React.FC<RemarkSentimentBadgeProps> = ({ rawText }) => {
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<SentimentResult | null>(null);
    const [expanded, setExpanded] = useState(false);

    useEffect(() => {
        if (rawText && rawText.length > 5) {
            analyzeSentiment(rawText);
        } else {
            setResult(null);
        }
    }, [rawText]);

    const analyzeSentiment = async (text: string) => {
        setLoading(true);
        try {
            const response = await fetch('http://localhost:5000/api/sentiment/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text })
            });
            const data = await response.json();
            setResult(data);
        } catch (error) {
            console.error('Sentiment Analysis Error:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center gap-2 p-3 bg-gray-50 border border-gray-200 animate-pulse">
                <div className="w-5 h-5 bg-gray-300 rounded-full"></div>
                <div className="h-4 bg-gray-300 w-32 rounded"></div>
            </div>
        );
    }

    if (!result) return null;

    // Use solid colors for risk levels
    const getBgColor = (classification: string) => {
        switch (classification) {
            case 'DAMAGE': return '#FFF0F0'; // Light Red
            case 'SHORTAGE': return '#FFF8F0'; // Light Orange
            case 'LATE_DELIVERY': return '#F0F6FF'; // Light Blue
            case 'DOCUMENT_ISSUE': return '#FFFAEE'; // Light Yellow
            default: return '#F0FFF4'; // Light Green
        }
    };

    const getBorderColor = (classification: string) => {
        return result.ui_color;
    };

    return (
        <div
            className="mt-4 border-2 transition-all duration-300"
            style={{
                borderColor: getBorderColor(result.classification),
                fontFamily: "'Berkeley Mono', 'SF Mono', 'Consolas', monospace",
                backgroundColor: 'white'
            }}
        >
            {/* Header / Summary */}
            <div
                className="p-3 flex items-center justify-between cursor-pointer"
                onClick={() => setExpanded(!expanded)}
                style={{ backgroundColor: result.is_disputed ? result.ui_color : 'white' }}
            >
                <div className="flex items-center gap-3">
                    {result.is_disputed ? (
                        <Geo3DAlert size={24} color={result.is_disputed ? 'white' : result.ui_color} />
                    ) : (
                        <Geo3DCheck size={24} color="#00C805" />
                    )}
                    <div>
                        <p className={`text-xs font-bold uppercase tracking-wider ${result.is_disputed ? 'text-white' : 'text-black'}`}>
                            Remark Sentinel (AI)
                        </p>
                        <p className={`text-sm font-bold ${result.is_disputed ? 'text-white' : 'text-black'}`}>
                            {result.ui_label}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {result.is_disputed && (
                        <span className="bg-white text-black px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border border-black">
                            {result.ui_sublabel}
                        </span>
                    )}
                    <span className={`text-lg font-bold ${result.is_disputed ? 'text-white' : 'text-black'}`}>
                        {expanded ? '−' : '+'}
                    </span>
                </div>
            </div>

            {/* Expanded Details */}
            {expanded && (
                <div className="p-4 border-t-2" style={{ borderColor: result.ui_color }}>
                    <div className="flex gap-4">
                        <div className="flex-1">
                            <p className="text-[10px] uppercase font-bold text-gray-400 mb-1">
                                Analysis Message
                            </p>
                            <p className="text-sm font-medium text-black">
                                {result.ui_message}
                            </p>

                            {result.matched_keywords.length > 0 && (
                                <div className="mt-3">
                                    <p className="text-[10px] uppercase font-bold text-gray-400 mb-1">
                                        Trigger Keywords (English/Hinglish)
                                    </p>
                                    <div className="flex flex-wrap gap-1">
                                        {result.matched_keywords.map((kw, idx) => (
                                            <span
                                                key={idx}
                                                className="bg-gray-100 text-black px-2 py-0.5 text-xs border border-gray-300"
                                            >
                                                "{kw}"
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="w-24 text-center border-l border-gray-200 pl-4">
                            <p className="text-[10px] uppercase font-bold text-gray-400 mb-1">
                                Confidence
                            </p>
                            <div className="relative inline-flex items-center justify-center">
                                <svg className="w-12 h-12 transform -rotate-90">
                                    <circle
                                        cx="24" cy="24" r="20"
                                        stroke="#E5E7EB" strokeWidth="4" fill="none"
                                    />
                                    <circle
                                        cx="24" cy="24" r="20"
                                        stroke={result.ui_color} strokeWidth="4" fill="none"
                                        strokeDasharray={126}
                                        strokeDashoffset={126 * (1 - result.confidence_score)}
                                    />
                                </svg>
                                <span className="absolute text-xs font-bold">{result.confidence_percent}%</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
