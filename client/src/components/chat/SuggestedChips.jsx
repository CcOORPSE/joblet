import React from "react";

const CHIPS = [
  { label: "Find remote jobs", message: "Find remote developer jobs that match my skills" },
  { label: "ATS score", message: "What's my ATS score? Analyze my resume." },
  { label: "Career tips", message: "Give me 3 tips to improve my job search" },
  { label: "Interview prep", message: "Help me prepare for a technical interview" },
];

const SuggestedChips = ({ onSelect, disabled, variant = "scroll" }) => {
  if (variant === "grid") {
    return (
      <div className="grid grid-cols-2 gap-2">
        {CHIPS.map((chip) => (
          <button
            key={chip.label}
            type="button"
            disabled={disabled}
            onClick={() => onSelect(chip.message)}
            className="px-4 py-3 text-sm font-medium rounded-xl border transition-all disabled:opacity-40 text-left"
            style={{
              background: "var(--chat-surface)",
              borderColor: "var(--chat-border)",
              color: "var(--chat-text)",
            }}
          >
            {chip.label}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide -mx-1 px-1">
      {CHIPS.map((chip) => (
        <button
          key={chip.label}
          type="button"
          disabled={disabled}
          onClick={() => onSelect(chip.message)}
          className="shrink-0 px-3 py-1.5 text-xs font-medium rounded-full border transition-all disabled:opacity-40"
          style={{
            background: "var(--chat-surface, var(--app-surface))",
            borderColor: "var(--chat-border, var(--app-surface-elevated))",
            color: "var(--chat-text-secondary, var(--app-text-secondary))",
          }}
        >
          {chip.label}
        </button>
      ))}
    </div>
  );
};

export default SuggestedChips;
