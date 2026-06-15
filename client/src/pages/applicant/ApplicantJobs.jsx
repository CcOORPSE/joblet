import React, { useContext, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppContext } from "../../context/AppContext";
import AppSectionHeader from "../../components/chat/AppSectionHeader";
import { Briefcase, Building2, MapPin, Search, Sparkles } from "lucide-react";

const stripHtml = (html) => (html ? html.replace(/<[^>]*>?/gm, "").replace(/\*\*/g, "") : "");

const ApplicantJobs = () => {
  const { jobs } = useContext(AppContext);
  const navigate = useNavigate();
  const [query, setQuery] = useState("");

  const filteredJobs = useMemo(() => {
    const q = query.toLowerCase().trim();
    return jobs
      .slice()
      .reverse()
      .filter((job) => {
        if (job.visible === false) return false;
        if (!q) return true;
        const title = (job.title || "").toLowerCase();
        const company = (job.companyIdDetails?.name || job.companyId?.name || "").toLowerCase();
        const location = (job.location || "").toLowerCase();
        return title.includes(q) || company.includes(q) || location.includes(q);
      });
  }, [jobs, query]);

  return (
    <div className="flex flex-col h-full min-h-0">
      <AppSectionHeader
        title="Browse Jobs"
        subtitle={`${filteredJobs.length} open roles`}
      />

      <div className="app-section-body">
        <div className="app-section-inner px-4 lg:px-6 py-4 space-y-4">
          <div className="relative">
            <Search
              size={18}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
              style={{ color: "var(--chat-text-muted)" }}
            />
            <input
              type="search"
              placeholder="Search title, company, or location..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl text-base outline-none jl-input"
            />
          </div>

          <div className="flex items-center gap-2 text-xs" style={{ color: "var(--chat-text-muted)" }}>
            <Sparkles size={14} style={{ color: "var(--chat-accent)" }} />
            Tap a role to view details and apply
          </div>

          {filteredJobs.length === 0 ? (
            <div
              className="text-center py-16 rounded-2xl border"
              style={{ borderColor: "var(--chat-border)", background: "var(--chat-surface)" }}
            >
              <Briefcase size={40} className="mx-auto mb-3 opacity-30" style={{ color: "var(--chat-accent)" }} />
              <p className="text-sm font-medium" style={{ color: "var(--chat-text)" }}>
                No jobs match your search
              </p>
              <p className="text-xs mt-1" style={{ color: "var(--chat-text-muted)" }}>
                Try different keywords or ask CareerBot for matches
              </p>
            </div>
          ) : (
            <div className="space-y-3 pb-4">
              {filteredJobs.map((job) => {
                const companyName = job.companyIdDetails?.name || job.companyId?.name || "Company";
                const initial = companyName.charAt(0).toUpperCase();

                return (
                  <button
                    key={job._id}
                    type="button"
                    onClick={() => navigate(`/apply-job/${job._id}`)}
                    className="w-full text-left p-4 rounded-2xl border transition-all hover:shadow-md active:scale-[0.99] app-animate-in group"
                    style={{
                      background: "var(--chat-surface)",
                      borderColor: "var(--chat-border)",
                    }}
                  >
                    <div className="flex gap-3">
                      <div
                        className="shrink-0 w-11 h-11 rounded-xl flex items-center justify-center text-sm font-bold"
                        style={{
                          background: "var(--chat-accent-soft)",
                          color: "var(--chat-accent)",
                        }}
                      >
                        {initial}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-sm leading-snug group-hover:text-brand-orange transition-colors" style={{ color: "var(--chat-text)" }}>
                          {job.title}
                        </h3>
                        <p className="text-xs mt-0.5 flex items-center gap-1" style={{ color: "var(--chat-text-secondary)" }}>
                          <Building2 size={12} />
                          {companyName}
                        </p>
                        <div className="flex flex-wrap gap-2 mt-2">
                          <span
                            className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full"
                            style={{ background: "var(--chat-surface-muted)", color: "var(--chat-text-secondary)" }}
                          >
                            <MapPin size={11} />
                            {job.location || "Remote"}
                          </span>
                          {job.level && (
                            <span
                              className="text-[11px] font-medium px-2 py-0.5 rounded-full"
                              style={{ background: "var(--chat-surface-muted)", color: "var(--chat-text-secondary)" }}
                            >
                              {job.level}
                            </span>
                          )}
                          {job.salary ? (
                            <span
                              className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                              style={{ background: "var(--chat-accent-soft)", color: "var(--chat-accent)" }}
                            >
                              ${job.salary.toLocaleString()}/yr
                            </span>
                          ) : null}
                        </div>
                        <p className="text-xs mt-2 line-clamp-2 leading-relaxed" style={{ color: "var(--chat-text-muted)" }}>
                          {stripHtml(job.description)}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ApplicantJobs;
