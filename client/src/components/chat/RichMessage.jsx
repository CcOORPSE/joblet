import React from "react";
import ScoreGauge from "../ScoreGauge";
import ScoreBadge from "../ScoreBadge";
import ChatJobCard from "./ChatJobCard";
import { formatMarkdownSafe } from "../../utils/sanitizeHtml";

export const TOKEN_REGEX = /(\[SCORE_BADGE:(\d+)\]|\[JOB_CARD:([^\]]+)\])/g;

export const formatMarkdown = formatMarkdownSafe;

const InlineScoreBadge = ({ score, light }) => (
  <div
    className="my-3 p-4 rounded-2xl flex flex-col items-center gap-4 app-animate-in"
    style={
      light
        ? { background: "var(--chat-surface-muted)", border: "1px solid var(--chat-border)" }
        : { background: "var(--app-surface-elevated)", border: "1px solid var(--jl-border)" }
    }
  >
    <ScoreGauge score={Number(score)} />
    <div className="text-center">
      <p
        className="text-sm font-bold"
        style={{ color: light ? "var(--chat-text)" : "var(--app-text-primary)" }}
      >
        ATS Compatibility Score
      </p>
      <ScoreBadge score={Number(score)} />
    </div>
  </div>
);

const RichMessage = ({ content, jobs, backendUrl, light = false }) => {
  const textColor = light ? "var(--chat-text)" : "var(--app-text-primary)";
  const parts = [];
  let lastIndex = 0;
  let match;

  TOKEN_REGEX.lastIndex = 0;
  while ((match = TOKEN_REGEX.exec(content)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: "text", value: content.slice(lastIndex, match.index) });
    }
    if (match[2]) {
      parts.push({ type: "score", value: match[2] });
    } else if (match[3]) {
      parts.push({ type: "job", value: match[3] });
    }
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < content.length) {
    parts.push({ type: "text", value: content.slice(lastIndex) });
  }

  if (parts.length === 0) {
    return (
      <div
        className="text-sm leading-relaxed"
        style={{ color: textColor }}
        dangerouslySetInnerHTML={{ __html: formatMarkdown(content) }}
      />
    );
  }

  return (
    <div className="text-sm leading-relaxed" style={{ color: textColor }}>
      {parts.map((part, i) => {
        if (part.type === "score") {
          return <InlineScoreBadge key={`score-${i}`} score={part.value} light={light} />;
        }
        if (part.type === "job") {
          return <ChatJobCard key={`job-${i}`} jobId={part.value} jobs={jobs} backendUrl={backendUrl} light={light} />;
        }
        return (
          <span
            key={`text-${i}`}
            dangerouslySetInnerHTML={{ __html: formatMarkdown(part.value) }}
          />
        );
      })}
    </div>
  );
};

export default RichMessage;
