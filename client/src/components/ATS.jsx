import React from 'react';

const ATS = ({ score, suggestions = [] }) => {
  const gradientClass = score > 69
    ? 'from-emerald-50 border-emerald-100'
    : score > 49
      ? 'from-amber-50 border-amber-100'
      : 'from-rose-50 border-rose-100';

  const iconSrc = score > 69
    ? '/icons/ats-good.svg'
    : score > 49
      ? '/icons/ats-warning.svg'
      : '/icons/ats-bad.svg';

  const subtitle = score > 69
    ? 'Excellent ATS Performance!'
    : score > 49
      ? 'Decent Foundation, Action Needed'
      : 'Critical System Warnings';

  return (
    <div className={`bg-gradient-to-b ${gradientClass} to-white border rounded-2xl shadow-md p-6 w-full flex flex-col gap-5`}>
      <div className="flex items-center gap-4 border-b border-slate-100 pb-4">
        <img src={iconSrc} alt="ATS Icon" className="w-14 h-14 object-contain" />
        <div>
          <h3 className="text-xl font-extrabold text-slate-800">ATS Grade Summary</h3>
          <p className="text-sm text-slate-400">Instantly assess keyword filters compatibility</p>
        </div>
      </div>

      <div>
        <h4 className="text-base font-bold text-slate-700 mb-1">{subtitle}</h4>
        <p className="text-sm text-slate-500 leading-relaxed mb-4">
          This rating describes how effectively an automated system can parse, read, and rank your experience details compared to competitors.
        </p>

        <div className="flex flex-col gap-3">
          {suggestions.map((suggestion, index) => (
            <div key={index} className={`flex items-start gap-3 p-3 rounded-xl border ${
              suggestion.type === "good" 
                ? "bg-emerald-50/50 border-emerald-100 text-emerald-800" 
                : "bg-amber-50/50 border-amber-100 text-amber-800"
            }`}>
              <img
                src={suggestion.type === "good" ? "/icons/check.svg" : "/icons/warning.svg"}
                alt={suggestion.type === "good" ? "Check" : "Warning"}
                className="w-5 h-5 object-contain mt-0.5"
              />
              <p className="text-sm font-medium">
                {suggestion.tip}
              </p>
            </div>
          ))}
        </div>
      </div>

      <p className="text-xs text-slate-400 italic">
        Tip: Focus on aligning your resume metrics and key phrases with the target job details to boost this rating.
      </p>
    </div>
  );
};

export default ATS;
