import React from "react";

const CHIPS = [
  { label: "Pipeline summary", message: "Give me a summary of my applicant pipeline this week" },
  { label: "Draft job post", message: "Help me draft a job description for a Senior React Developer, remote" },
  { label: "Pending applications", message: "Show applications that need review" },
  { label: "Job performance", message: "Which of my job listings has the most applicants?" },
];

const SuggestedRecruiterChips = ({ onSelect, disabled, visible = true }) => {
  if (!visible) return null;

  return (
    <div className="flex flex-wrap gap-2 pb-3">
      {CHIPS.map((chip) => (
        <button
          key={chip.label}
          type="button"
          disabled={disabled}
          onClick={() => onSelect(chip.message)}
          className="px-3 py-1.5 text-xs font-medium rounded-full border border-brand-orange/30 bg-brand-orange/10 text-brand-orange hover:bg-brand-orange/20 transition-colors disabled:opacity-40"
        >
          {chip.label}
        </button>
      ))}
    </div>
  );
};

export default SuggestedRecruiterChips;
