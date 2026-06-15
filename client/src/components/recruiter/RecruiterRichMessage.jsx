import React from "react";
import MetricCard from "./MetricCard";
import ApplicantCard from "./ApplicantCard";
import JobPerfCard from "./JobPerfCard";
import { formatMarkdownSafe } from "../../utils/sanitizeHtml";

export const METRIC_REGEX = /\[METRIC_CARD:([^:]+):([^\]]+)\]/g;
export const APPLICANT_REGEX = /\[APPLICANT_CARD:([^\]]+)\]/g;
export const JOB_PERF_REGEX = /\[JOB_PERF:([^\]]+)\]/g;

const COMBINED_REGEX =
  /(\[METRIC_CARD:([^:]+):([^\]]+)\]|\[APPLICANT_CARD:([^\]]+)\]|\[JOB_PERF:([^\]]+)\])/g;

export const formatMarkdown = formatMarkdownSafe;

const RecruiterRichMessage = ({ content, backendUrl, onUseInAddJob }) => {
  const parts = [];
  let lastIndex = 0;
  let match;

  COMBINED_REGEX.lastIndex = 0;
  while ((match = COMBINED_REGEX.exec(content)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: "text", value: content.slice(lastIndex, match.index) });
    }
    if (match[2] !== undefined) {
      parts.push({ type: "metric", metricType: match[2], value: match[3] });
    } else if (match[4]) {
      parts.push({ type: "applicant", id: match[4] });
    } else if (match[5]) {
      parts.push({ type: "jobperf", id: match[5] });
    }
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < content.length) {
    parts.push({ type: "text", value: content.slice(lastIndex) });
  }

  const plainText = content.replace(/\[METRIC_CARD:[^\]]+\]|\[APPLICANT_CARD:[^\]]+\]|\[JOB_PERF:[^\]]+\]/g, "").trim();
  const looksLikeJd = plainText.length > 200 && /responsibilit|requirement|qualification/i.test(content);

  if (parts.length === 0) {
    return (
      <>
        <div
          className="text-sm leading-relaxed text-gray-700"
          dangerouslySetInnerHTML={{ __html: formatMarkdown(content) }}
        />
        {looksLikeJd && onUseInAddJob && (
          <button
            type="button"
            onClick={() => onUseInAddJob(content)}
            className="mt-3 px-4 py-2 text-sm font-semibold text-white bg-brand-orange hover:bg-jl-accent rounded-xl"
          >
            Use in Add Job
          </button>
        )}
      </>
    );
  }

  return (
    <div className="text-sm leading-relaxed text-gray-700">
      {parts.map((part, i) => {
        if (part.type === "metric") {
          return <MetricCard key={`m-${i}`} type={part.metricType} value={part.value} />;
        }
        if (part.type === "applicant") {
          return (
            <ApplicantCard
              key={`a-${i}`}
              applicationId={part.id}
              backendUrl={backendUrl}
            />
          );
        }
        if (part.type === "jobperf") {
          return <JobPerfCard key={`j-${i}`} jobId={part.id} backendUrl={backendUrl} />;
        }
        return (
          <span key={`t-${i}`} dangerouslySetInnerHTML={{ __html: formatMarkdown(part.value) }} />
        );
      })}
      {looksLikeJd && onUseInAddJob && (
        <button
          type="button"
          onClick={() => onUseInAddJob(content)}
          className="mt-3 px-4 py-2 text-sm font-semibold text-white bg-brand-orange hover:bg-jl-accent rounded-xl"
        >
          Use in Add Job
        </button>
      )}
    </div>
  );
};

export default RecruiterRichMessage;
