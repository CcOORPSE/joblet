import React, { useMemo, useState } from "react";
import { NavLink } from "react-router-dom";
import {
  Search,
  MessageCircle,
  Briefcase,
  Activity,
  Sparkles,
  FileText,
  ChevronDown,
  Calendar,
} from "lucide-react";
import moment from "moment";

const NAV_ITEMS = [
  { to: "/app/chat", icon: MessageCircle, label: "Chat with AI", end: true },
  { to: "/app/jobs", icon: Briefcase, label: "Browse Jobs" },
  { to: "/app/preparation", icon: Calendar, label: "Prep Center" },
  { to: "/app/activity", icon: Activity, label: "Activity" },
];

function groupSessionsByDate(sessions) {
  const groups = [];
  const map = new Map();

  sessions.forEach((session) => {
    const d = moment(session.updatedAt || session.createdAt);
    let label;
    if (d.isSame(moment(), "day")) label = "Today";
    else if (d.isSame(moment().subtract(1, "day"), "day")) label = "Yesterday";
    else label = d.format("D MMM YYYY");

    if (!map.has(label)) {
      const group = { label, items: [] };
      map.set(label, group);
      groups.push(group);
    }
    map.get(label).items.push(session);
  });

  return groups;
}

const ChatSidebar = ({
  user,
  userData,
  sessions = [],
  activeSessionId,
  onSelectSession,
  onSettingsClick,
  onLogoClick,
  className = "",
}) => {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    if (!query.trim()) return sessions;
    const q = query.toLowerCase();
    return sessions.filter((s) => (s.title || "").toLowerCase().includes(q));
  }, [sessions, query]);

  const groups = useMemo(() => groupSessionsByDate(filtered), [filtered]);

  return (
    <aside className={`chat-sidebar flex flex-col h-full ${className}`}>
      <div className="shrink-0 p-4 space-y-4">
        <button
          type="button"
          onClick={onLogoClick}
          className="flex items-center gap-2 w-full text-left chat-btn-ghost rounded-xl px-1 py-1 -mx-1"
        >
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm shrink-0"
            style={{ background: "var(--chat-accent)" }}
          >
            J
          </div>
          <span className="font-bold text-lg tracking-tight" style={{ color: "var(--chat-text)" }}>
            Joblet AI
          </span>
        </button>

        <div className="relative">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
            style={{ color: "var(--chat-text-muted)" }}
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search chats..."
            className="w-full pl-9 pr-3 py-2 text-sm rounded-xl outline-none"
            style={{
              background: "var(--chat-surface-muted)",
              border: "1px solid var(--chat-border)",
              color: "var(--chat-text)",
            }}
          />
        </div>
      </div>

      <nav className="shrink-0 px-3 space-y-0.5" aria-label="Chat navigation">
        {NAV_ITEMS.map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `chat-nav-item flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm${isActive ? " active" : ""}`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="flex-1 overflow-y-auto chat-thread-scroll px-3 py-3 min-h-0">
        <p
          className="text-[11px] font-semibold uppercase tracking-wider px-3 mb-2"
          style={{ color: "var(--chat-text-muted)" }}
        >
          History
        </p>

        {groups.length === 0 ? (
          <p className="text-xs px-3 py-2" style={{ color: "var(--chat-text-muted)" }}>
            {user ? "No conversations yet" : "Sign in to save chats"}
          </p>
        ) : (
          groups.map((group) => (
            <div key={group.label} className="mb-3">
              <p
                className="text-[11px] font-medium px-3 mb-1"
                style={{ color: "var(--chat-text-muted)" }}
              >
                {group.label}
              </p>
              {group.items.map((session) => (
                <button
                  key={session.id}
                  type="button"
                  onClick={() => onSelectSession(session.id)}
                  className={`chat-history-item w-full text-left px-3 py-2 rounded-xl text-sm truncate${
                    activeSessionId === session.id ? " active" : ""
                  }`}
                >
                  {session.title || "Conversation"}
                </button>
              ))}
            </div>
          ))
        )}
      </div>

      <div
        className="shrink-0 p-3 border-t"
        style={{ borderColor: "var(--chat-border)" }}
      >
        <button
          type="button"
          onClick={onSettingsClick}
          className="chat-btn-ghost w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left"
        >
          <img
            src={user?.photoURL || "https://via.placeholder.com/36"}
            alt=""
            className="w-9 h-9 rounded-full object-cover shrink-0"
            style={{ border: "2px solid var(--chat-border)" }}
          />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium truncate" style={{ color: "var(--chat-text)" }}>
              {user?.displayName || userData?.name || "Guest"}
            </p>
            <p className="text-xs truncate" style={{ color: "var(--chat-text-muted)" }}>
              {user ? "Job seeker" : "Sign in"}
            </p>
          </div>
          <ChevronDown size={16} style={{ color: "var(--chat-text-muted)" }} />
        </button>
      </div>
    </aside>
  );
};

export const ChatQuickActions = () => (
  <div className="hidden lg:flex items-center gap-2 px-4 py-2">
    <span
      className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full"
      style={{ background: "var(--chat-accent-soft)", color: "var(--chat-accent)" }}
    >
      <Sparkles size={14} />
      Career assistant
    </span>
    <span
      className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full"
      style={{ background: "var(--chat-surface-muted)", color: "var(--chat-text-secondary)" }}
    >
      <FileText size={14} />
      Resume-aware
    </span>
  </div>
);

export default ChatSidebar;
