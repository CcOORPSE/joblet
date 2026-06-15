import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const ChatJobCard = ({ jobId, jobs, backendUrl, light = false }) => {
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cached = jobs.find((j) => j._id === jobId);
    if (cached) {
      setJob(cached);
      setLoading(false);
      return;
    }

    const fetchJob = async () => {
      try {
        const { data } = await axios.get(`${backendUrl}/api/jobs/${jobId}`);
        if (data.success) setJob(data.job);
      } catch {
        setJob(null);
      } finally {
        setLoading(false);
      }
    };
    fetchJob();
  }, [jobId, jobs, backendUrl]);

  if (loading) {
    return (
      <div
        className="my-2 p-4 rounded-xl animate-pulse"
        style={{ background: light ? "var(--chat-surface-muted)" : "var(--app-surface-elevated)" }}
      >
        <div
          className="h-4 rounded w-3/4 mb-2 opacity-40"
          style={{ background: light ? "var(--chat-border)" : "var(--app-text-secondary)" }}
        />
        <div
          className="h-3 rounded w-1/2 opacity-30"
          style={{ background: light ? "var(--chat-border)" : "var(--app-text-secondary)" }}
        />
      </div>
    );
  }

  if (!job) {
    return (
      <div
        className="my-2 p-3 rounded-xl text-sm"
        style={{ background: "rgba(245, 158, 11, 0.1)", color: "var(--app-warning)" }}
      >
        Job listing unavailable
      </div>
    );
  }

  const companyName = job.companyIdDetails?.name || job.companyId?.name || "Company";
  const stripHtml = (html) => (html ? html.replace(/<[^>]*>?/gm, "") : "");

  return (
    <div
      className="my-3 p-4 rounded-2xl border transition-all duration-300 app-animate-in"
      style={
        light
          ? { background: "var(--chat-surface)", borderColor: "var(--chat-border)" }
          : { background: "var(--app-surface)", borderColor: "var(--app-surface-elevated)" }
      }
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h4 className="font-bold" style={{ color: light ? "var(--chat-text)" : "var(--app-text-primary)" }}>
            {job.title}
          </h4>
          <p className="text-sm" style={{ color: light ? "var(--chat-text-secondary)" : "var(--app-text-secondary)" }}>
            {companyName}
          </p>
        </div>
        <span
          className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full shrink-0"
          style={
            light
              ? { background: "var(--chat-accent-soft)", color: "var(--chat-accent)" }
              : { background: "rgba(99, 102, 241, 0.2)", color: "#a5b4fc" }
          }
        >
          Match
        </span>
      </div>
      <div
        className="flex flex-wrap gap-2 mt-2 text-xs"
        style={{ color: light ? "var(--chat-text-secondary)" : "var(--app-text-secondary)" }}
      >
        <span
          className="px-2 py-0.5 rounded-full"
          style={{ background: light ? "var(--chat-surface-muted)" : "var(--app-surface-elevated)" }}
        >
          {job.location || "Remote"}
        </span>
        <span
          className="px-2 py-0.5 rounded-full"
          style={{ background: light ? "var(--chat-surface-muted)" : "var(--app-surface-elevated)" }}
        >
          {job.level || "All levels"}
        </span>
      </div>
      <p
        className="text-sm mt-2 line-clamp-2"
        style={{ color: light ? "var(--chat-text-secondary)" : "var(--app-text-secondary)" }}
      >
        {stripHtml(job.description)}
      </p>
      <button
        type="button"
        onClick={() => {
          navigate(`/apply-job/${job._id}`);
          window.scrollTo(0, 0);
        }}
        className="mt-3 w-full py-2.5 text-sm font-semibold text-white rounded-xl transition-all active:scale-[0.98]"
        style={{ background: light ? "var(--chat-accent)" : "var(--app-accent)" }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = light ? "var(--chat-accent-hover)" : "var(--app-accent-hover)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = light ? "var(--chat-accent)" : "var(--app-accent)";
        }}
      >
        Quick Apply
      </button>
    </div>
  );
};

export default ChatJobCard;
