import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface TickerData {
    symbol: string;
    name: string;
    value: number;
    change: number;
    changePercent: number;
    trend: 'up' | 'down';
}

interface FinanceTickerProps {
    bgColor?: string;
    textColor?: string;
}

export const FinanceTicker: React.FC<FinanceTickerProps> = ({
    bgColor = 'bg-gray-950',
    textColor = 'text-orange-400'
}) => {
    const [tickers, setTickers] = useState<TickerData[]>([
        { symbol: 'FRT-IDX', name: 'Freight Index', value: 8547.82, change: 125.40, changePercent: 1.49, trend: 'up' },
        { symbol: 'DSL-MUM', name: 'Diesel Mumbai', value: 94.50, change: -0.75, changePercent: -0.79, trend: 'down' },
        { symbol: 'DSL-DEL', name: 'Diesel Delhi', value: 89.66, change: 0.45, changePercent: 0.50, trend: 'up' },
        { symbol: 'CNT-20FT', name: '20FT Container', value: 2850, change: 45, changePercent: 1.60, trend: 'up' },
        { symbol: 'CNT-40FT', name: '40FT Container', value: 4200, change: -80, changePercent: -1.87, trend: 'down' },
        { symbol: 'AIR-KG', name: 'Air Freight/Kg', value: 185.25, change: -2.10, changePercent: -1.12, trend: 'down' },
        { symbol: 'FTL-32FT', name: 'FTL 32ft MXL', value: 15800, change: 300, changePercent: 1.93, trend: 'up' },
        { symbol: 'LTL-KG', name: 'LTL per Kg', value: 8.50, change: 0.15, changePercent: 1.79, trend: 'up' },
    ]);

    // Simulate ticker updates
    useEffect(() => {
        const interval = setInterval(() => {
            setTickers(prev => prev.map(ticker => {
                const randomChange = (Math.random() - 0.5) * (ticker.value * 0.02);
                const newValue = ticker.value + randomChange;
                const newChange = newValue - ticker.value;
                const newChangePercent = (newChange / ticker.value) * 100;

                return {
                    ...ticker,
                    value: parseFloat(newValue.toFixed(2)),
                    change: parseFloat(newChange.toFixed(2)),
                    changePercent: parseFloat(newChangePercent.toFixed(2)),
                    trend: newChange >= 0 ? 'up' : 'down'
                };
            }));
        }, 4000);

        return () => clearInterval(interval);
    }, []);

    return (
        <div className={`${bgColor} border-b border-gray-800 overflow-hidden`}>
            <div className="flex animate-scroll-left whitespace-nowrap py-1.5">
                {[...tickers, ...tickers, ...tickers].map((ticker, idx) => (
                    <div key={idx} className="inline-flex items-center px-4 border-r border-gray-800">
                        <span className={`font-bold ${textColor} text-xs mr-2`}>{ticker.symbol}</span>
                        <span className="text-white text-xs mr-2">₹{ticker.value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        <span className={`flex items-center text-[10px] ${ticker.trend === 'up' ? 'text-green-400' : 'text-red-400'}`}>
                            {ticker.trend === 'up' ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                            <span className="ml-0.5">{ticker.changePercent > 0 ? '+' : ''}{ticker.changePercent.toFixed(2)}%</span>
                        </span>
                    </div>
                ))}
            </div>
            <style>{`
                @keyframes scroll-left {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-33.333%); }
                }
                .animate-scroll-left {
                    animation: scroll-left 40s linear infinite;
                }
            `}</style>
        </div>
    );
};
