import React, { useContext, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AppContext } from "../../context/AppContext";
import AppSectionHeader from "../../components/chat/AppSectionHeader";
import {
  Briefcase,
  FileText,
  MessageCircle,
  Activity,
  Sparkles,
  CheckCircle,
  Bookmark,
} from "lucide-react";
import moment from "moment";

const ACTIVITY_ICONS = {
  application_submitted: Briefcase,
  application_status_changed: CheckCircle,
  resume_uploaded: FileText,
  resume_analyzed: Sparkles,
  chat_message: MessageCircle,
  job_saved: Bookmark,
  login: Activity,
};

const ActivityPanel = () => {
  const { userApplications, userData, user, fetchActivity, fetchChatSessions } =
    useContext(AppContext);

  const [activities, setActivities] = useState([]);
  const [sessionCount, setSessionCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const applications = userApplications || [];

  const statusCounts = useMemo(() => {
    const counts = { pending: 0, accepted: 0, rejected: 0, other: 0 };
    applications.forEach((app) => {
      const s = (app.status || "pending").toLowerCase();
      if (s === "accepted" || s === "approved") counts.accepted += 1;
      else if (s === "rejected") counts.rejected += 1;
      else if (s === "pending") counts.pending += 1;
      else counts.other += 1;
    });
    return counts;
  }, [applications]);

  useEffect(() => {
    let active = true;

    const load = async () => {
      if (!user) {
        setActivities([]);
        setSessionCount(0);
        setLoading(false);
        return;
      }

      setLoading(true);
      const [feed, sessions] = await Promise.all([fetchActivity(10), fetchChatSessions()]);
      if (!active) return;
      setActivities(feed);
      setSessionCount(sessions.length);
      setLoading(false);
    };

    load();
    return () => {
      active = false;
    };
  }, [user, fetchActivity, fetchChatSessions]);

  const timeline = activities.length > 0 ? activities : buildFallbackTimeline(applications);

  return (
    <div className="flex flex-col h-full min-h-0">
      <AppSectionHeader
        title="Activity"
        subtitle="Your job search at a glance"
      />

      <div className="app-section-body">
        <div className="app-section-inner px-4 lg:px-6 py-4 space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <SummaryCard
              icon={Briefcase}
              label="Applications"
              value={applications.length}
              sub={`${statusCounts.pending} pending`}
            />
            <SummaryCard
              icon={FileText}
              label="Resume"
              value={userData?.resume ? "✓" : "—"}
              sub={userData?.resume ? "Uploaded" : "Not set"}
            />
            <SummaryCard
              icon={MessageCircle}
              label="Chat"
              value={sessionCount || "—"}
              sub={sessionCount ? "sessions" : "No sessions"}
            />
          </div>

          <div>
            <p
              className="text-[11px] font-semibold uppercase tracking-wider mb-3"
              style={{ color: "var(--chat-text-muted)" }}
            >
              Recent activity
            </p>

            {!user ? (
              <EmptyState message="Sign in to see your activity" />
            ) : loading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-16 rounded-xl animate-pulse"
                    style={{ background: "var(--chat-surface-muted)" }}
                  />
                ))}
              </div>
            ) : timeline.length === 0 ? (
              <EmptyState message="No activity yet" cta={{ to: "/app/chat", label: "Start chatting" }} />
            ) : (
              <div className="space-y-2 pb-4">
                {timeline.map((item) => {
                  const Icon = ACTIVITY_ICONS[item.type] || Activity;
                  return (
                    <div
                      key={item.id}
                      className="flex gap-3 p-3.5 rounded-xl border transition-all hover:shadow-sm app-animate-in"
                      style={{
                        background: "var(--chat-surface)",
                        borderColor: "var(--chat-border)",
                      }}
                    >
                      <div
                        className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center"
                        style={{ background: "var(--chat-accent-soft)" }}
                      >
                        <Icon size={18} style={{ color: "var(--chat-accent)" }} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium line-clamp-2" style={{ color: "var(--chat-text)" }}>
                          {item.title}
                        </p>
                        <p className="text-xs mt-0.5" style={{ color: "var(--chat-text-muted)" }}>
                          {item.timestamp ? moment(item.timestamp).fromNow() : ""}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

function buildFallbackTimeline(applications) {
  return applications.slice(0, 10).map((app) => ({
    id: app._id,
    type: "application_submitted",
    title: `Applied to ${app.jobId?.title || app.jobDetails?.title || "a role"}`,
    timestamp: app.date ? new Date(app.date).toISOString() : null,
  }));
}

const SummaryCard = ({ icon: Icon, label, value, sub }) => (
  <div
    className="p-3.5 rounded-xl border text-center"
    style={{
      background: "var(--chat-surface)",
      borderColor: "var(--chat-border)",
    }}
  >
    <div
      className="w-8 h-8 rounded-lg flex items-center justify-center mx-auto mb-2"
      style={{ background: "var(--chat-accent-soft)" }}
    >
      <Icon size={16} style={{ color: "var(--chat-accent)" }} />
    </div>
    <p className="text-xl font-bold" style={{ color: "var(--chat-text)" }}>
      {value}
    </p>
    <p className="text-[10px] font-semibold uppercase tracking-wide mt-0.5" style={{ color: "var(--chat-text-secondary)" }}>
      {label}
    </p>
    {sub && (
      <p className="text-[10px] mt-0.5" style={{ color: "var(--chat-text-muted)" }}>
        {sub}
      </p>
    )}
  </div>
);

const EmptyState = ({ message, cta }) => (
  <div
    className="text-center py-12 rounded-2xl border"
    style={{ borderColor: "var(--chat-border)", background: "var(--chat-surface)" }}
  >
    <Activity size={36} className="mx-auto mb-3 opacity-30" style={{ color: "var(--chat-accent)" }} />
    <p className="text-sm mb-4" style={{ color: "var(--chat-text-secondary)" }}>
      {message}
    </p>
    {cta && (
      <Link to={cta.to} className="jl-btn-primary inline-flex text-sm">
        {cta.label}
      </Link>
    )}
  </div>
);

export default ActivityPanel;
