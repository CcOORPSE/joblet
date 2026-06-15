import React, { useContext, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LogOut, FileText, Briefcase, User, MessageCircle, ChevronRight } from "lucide-react";
import { AppContext } from "../../context/AppContext";

const SettingsSheet = ({ open, onClose }) => {
  const navigate = useNavigate();
  const { user, userData, userApplications, handleLogout, fetchChatSessions } = useContext(AppContext);
  const [sessions, setSessions] = useState([]);
  const [loadingSessions, setLoadingSessions] = useState(false);

  useEffect(() => {
    if (!open || !user) return;

    let active = true;
    setLoadingSessions(true);
    fetchChatSessions().then((list) => {
      if (active) {
        setSessions(list.slice(0, 5));
        setLoadingSessions(false);
      }
    });

    return () => {
      active = false;
    };
  }, [open, user, fetchChatSessions]);

  if (!open) return null;

  const appCount = userApplications?.length ?? 0;
  const hasResume = Boolean(userData?.resume);

  const signOut = async () => {
    onClose();
    await handleLogout();
    navigate("/");
  };

  const openSession = (sessionId) => {
    onClose();
    navigate(`/app/chat?session=${sessionId}`);
  };

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/60" onClick={onClose} aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-title"
        className="fixed inset-x-0 bottom-0 z-50 app-sheet-enter rounded-t-3xl max-h-[70vh] flex flex-col"
        style={{ background: "var(--app-surface)" }}
      >
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 rounded-full" style={{ background: "var(--app-surface-elevated)" }} />
        </div>

        <div className="px-5 pb-2">
          <h2 id="settings-title" className="text-lg font-bold text-jl-text">
            Settings
          </h2>
        </div>

        <div className="flex-1 overflow-y-auto overscroll-contain px-5 pb-8 space-y-4">
          <div className="flex items-center gap-3 py-3">
            <img
              src={user?.photoURL || "https://via.placeholder.com/48"}
              alt=""
              className="w-12 h-12 rounded-full object-cover"
              style={{ border: "2px solid var(--app-accent)" }}
            />
            <div>
              <p className="font-semibold text-jl-text">
                {user?.displayName || userData?.name || "Guest"}
              </p>
              <p className="text-sm" style={{ color: "var(--app-text-secondary)" }}>
                {user?.email || "Sign in to sync profile"}
              </p>
            </div>
          </div>

          <div className="space-y-1">
            <SettingsRow icon={FileText} label="My resume" detail={hasResume ? "Uploaded ✓" : "Not uploaded"} />
            <SettingsRow icon={Briefcase} label="Applications" detail={`${appCount} active`} />
          </div>

          {user && (
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wide px-1" style={{ color: "var(--app-text-secondary)" }}>
                Chat history
              </p>
              {loadingSessions ? (
                <div className="h-10 rounded-xl animate-pulse" style={{ background: "var(--app-bg)" }} />
              ) : sessions.length === 0 ? (
                <p className="text-xs px-3 py-2" style={{ color: "var(--app-text-secondary)" }}>
                  No saved conversations yet
                </p>
              ) : (
                sessions.map((session) => (
                  <button
                    key={session.id}
                    type="button"
                    onClick={() => openSession(session.id)}
                    className="flex items-center justify-between w-full px-3 py-3 rounded-xl text-left transition-colors"
                    style={{ background: "var(--app-bg)" }}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <MessageCircle size={18} style={{ color: "var(--app-text-secondary)" }} />
                      <div className="min-w-0">
                        <p className="text-sm truncate text-jl-text">
                          {session.title}
                        </p>
                        <p className="text-[10px]" style={{ color: "var(--app-text-secondary)" }}>
                          {session.messageCount} messages
                        </p>
                      </div>
                    </div>
                    <ChevronRight size={16} style={{ color: "var(--app-text-secondary)" }} />
                  </button>
                ))
              )}
            </div>
          )}

          <div className="pt-2 space-y-1 border-t" style={{ borderColor: "var(--app-surface-elevated)" }}>
            <Link
              to="/applications"
              onClick={onClose}
              className="flex items-center gap-3 w-full px-3 py-3 rounded-xl text-sm transition-colors text-jl-text"
            >
              <User size={18} style={{ color: "var(--app-text-secondary)" }} />
              Open full dashboard
            </Link>
            <Link
              to="/resume-analyzer"
              onClick={onClose}
              className="flex items-center gap-3 w-full px-3 py-3 rounded-xl text-sm transition-colors text-jl-text"
            >
              <FileText size={18} style={{ color: "var(--app-text-secondary)" }} />
              Resume analyzer
            </Link>
            <button
              type="button"
              onClick={signOut}
              className="flex items-center gap-3 w-full px-3 py-3 rounded-xl text-sm transition-colors"
              style={{ color: "var(--app-danger)" }}
            >
              <LogOut size={18} />
              Sign out
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

const SettingsRow = ({ icon: Icon, label, detail }) => (
  <div
    className="flex items-center justify-between px-3 py-3 rounded-xl"
    style={{ background: "var(--app-bg)" }}
  >
    <div className="flex items-center gap-3">
      <Icon size={18} style={{ color: "var(--app-text-secondary)" }} />
      <span className="text-sm text-jl-text">
        {label}
      </span>
    </div>
    <span className="text-xs" style={{ color: "var(--app-text-secondary)" }}>
      {detail}
    </span>
  </div>
);

export default SettingsSheet;
