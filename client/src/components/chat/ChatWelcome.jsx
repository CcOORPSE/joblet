import React from "react";
import { Bot, FileText, Search, Sparkles, Target } from "lucide-react";
import SuggestedChips from "./SuggestedChips";

const FEATURES = [
  { icon: FileText, label: "ATS resume scan", desc: "Attach PDF for compatibility score" },
  { icon: Search, label: "Job matching", desc: "Find roles that fit your skills" },
  { icon: Target, label: "Interview prep", desc: "Practice questions & tips" },
];

const ChatWelcome = ({ onSelectChip, disabled }) => (
  <div className="chat-welcome-gradient flex-1 flex flex-col items-center justify-center px-6 py-8 min-h-0 overflow-y-auto">
    <div
      className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5 shadow-sm"
      style={{
        background: "var(--chat-surface)",
        border: "1px solid var(--chat-border)",
        color: "var(--chat-accent)",
      }}
    >
      <Bot size={32} />
    </div>

    <h2 className="text-xl lg:text-2xl font-bold text-center mb-2" style={{ color: "var(--chat-text)" }}>
      Hi, I'm CareerBot
    </h2>
    <p
      className="text-sm text-center max-w-md mb-8 leading-relaxed"
      style={{ color: "var(--chat-text-secondary)" }}
    >
      Your AI career assistant. Analyze resumes, discover matching jobs, and get personalized advice —
      all in one conversation.
    </p>

    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full max-w-2xl mb-8">
      {FEATURES.map(({ icon: Icon, label, desc }) => (
        <div
          key={label}
          className="p-4 rounded-2xl text-center"
          style={{
            background: "var(--chat-surface)",
            border: "1px solid var(--chat-border)",
          }}
        >
          <Icon size={22} className="mx-auto mb-2" style={{ color: "var(--chat-accent)" }} />
          <p className="text-sm font-semibold mb-1" style={{ color: "var(--chat-text)" }}>
            {label}
          </p>
          <p className="text-xs leading-relaxed" style={{ color: "var(--chat-text-muted)" }}>
            {desc}
          </p>
        </div>
      ))}
    </div>

    <div className="w-full max-w-2xl">
      <p
        className="text-xs font-semibold uppercase tracking-wide mb-3 flex items-center gap-1.5 justify-center"
        style={{ color: "var(--chat-text-muted)" }}
      >
        <Sparkles size={14} style={{ color: "var(--chat-accent)" }} />
        Try asking
      </p>
      <SuggestedChips onSelect={onSelectChip} disabled={disabled} variant="grid" />
    </div>
  </div>
);

export default ChatWelcome;
