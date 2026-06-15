import React, { useEffect, useRef, useState } from "react";

const ScoreGauge = ({ score = 75 }) => {
    const [pathLength, setPathLength] = useState(0);
    const pathRef = useRef(null);

    const percentage = score / 100;

    useEffect(() => {
        if (pathRef.current) {
            setPathLength(pathRef.current.getTotalLength());
        }
    }, [score]);

    return (
        <div className="flex flex-col items-center justify-center">
            <div className="relative w-40 h-20">
                <svg viewBox="0 0 100 50" className="w-full h-full">
                    <defs>
                        <linearGradient
                            id="gaugeGradient"
                            x1="0%"
                            y1="0%"
                            x2="100%"
                            y2="0%"
                        >
                            <stop offset="0%" stopColor="#3b82f6" />
                            <stop offset="100%" stopColor="#ec4899" />
                        </linearGradient>
                    </defs>

                    {/* Background arc */}
                    <path
                        d="M10,50 A40,40 0 0,1 90,50"
                        fill="none"
                        stroke="#e5e7eb"
                        strokeWidth="8"
                        strokeLinecap="round"
                    />

                    {/* Foreground arc with rounded ends */}
                    <path
                        ref={pathRef}
                        d="M10,50 A40,40 0 0,1 90,50"
                        fill="none"
                        stroke="url(#gaugeGradient)"
                        strokeWidth="8"
                        strokeLinecap="round"
                        strokeDasharray={pathLength || 126}
                        strokeDashoffset={pathLength ? pathLength * (1 - percentage) : 126 * (1 - percentage)}
                        className="transition-all duration-1000 ease-out"
                    />
                </svg>

                <div className="absolute inset-0 flex flex-col items-center justify-center pt-2">
                    <div className="text-2xl font-extrabold text-slate-800 pt-4">{score}%</div>
                </div>
            </div>
        </div>
    );
};

export default ScoreGauge;
