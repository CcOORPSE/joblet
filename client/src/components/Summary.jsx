import React from 'react';
import ScoreGauge from "./ScoreGauge";
import ScoreBadge from "./ScoreBadge";

const CategoryRow = ({ title, score }) => {
    const textColor = score > 70 ? 'text-emerald-600'
            : score > 49
        ? 'text-amber-600' : 'text-rose-600';

    return (
        <div className="flex items-center justify-between bg-slate-50 border border-slate-100 rounded-xl p-4 transition-all hover:bg-slate-100/50">
            <div className="flex items-center gap-3">
                <p className="text-base font-semibold text-slate-700">{title}</p>
                <ScoreBadge score={score} />
            </div>
            <p className="text-lg font-bold text-slate-800">
                <span className={textColor}>{score}</span><span className="text-slate-400 text-sm font-normal">/100</span>
            </p>
        </div>
    );
};

const Summary = ({ feedback }) => {
    if (!feedback) return null;
    
    return (
        <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-md shadow-slate-100/50 w-full flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row items-center gap-6 pb-2 border-b border-slate-100">
                <ScoreGauge score={feedback.overallScore} />

                <div className="flex flex-col text-center sm:text-left gap-1">
                    <h3 className="text-xl font-bold text-slate-800">Overall ATS Match Score</h3>
                    <p className="text-sm text-slate-400 leading-relaxed">
                        This overall match grade is calculated by analyzing your formatting, keywords, experience layout, and language tone against automated filter parameters.
                    </p>
                </div>
            </div>

            <div className="flex flex-col gap-3">
                <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">Section Scores</h4>
                <CategoryRow title="Tone & Style" score={feedback.toneAndStyle?.score || 0} />
                <CategoryRow title="Content Relevancy" score={feedback.content?.score || 0} />
                <CategoryRow title="Visual Structure" score={feedback.structure?.score || 0} />
                <CategoryRow title="Skills Optimization" score={feedback.skills?.score || 0} />
            </div>
        </div>
    );
};

export default Summary;
