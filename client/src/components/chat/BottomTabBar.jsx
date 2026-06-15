import React from "react";
import { NavLink, useLocation } from "react-router-dom";
import { MessageCircle, Briefcase, Activity, Settings, Calendar } from "lucide-react";

const tabs = [
  { to: "/app/chat", icon: MessageCircle, label: "Chat", end: true },
  { to: "/app/jobs", icon: Briefcase, label: "Jobs" },
  { to: "/app/preparation", icon: Calendar, label: "Prep" },
  { to: "/app/activity", icon: Activity, label: "Activity" },
];

const BottomTabBar = ({ onSettingsClick, hideOnDesktop = true }) => {
  const location = useLocation();

  return (
    <nav
      role="tablist"
      aria-label="App navigation"
      className={`shrink-0 flex items-stretch border-t${hideOnDesktop ? " lg:hidden" : ""}`}
      style={{
        borderColor: "var(--jl-border)",
        background: "var(--jl-surface)",
        boxShadow: "0 -4px 24px rgba(17, 24, 39, 0.06)",
        paddingBottom: "env(safe-area-inset-bottom)",
        minHeight: "64px",
      }}
    >
      {tabs.map(({ to, icon: Icon, label, end }) => {
        const isActive = end
          ? location.pathname === to
          : location.pathname.startsWith(to);

        return (
          <NavLink
            key={to}
            to={to}
            end={end}
            role="tab"
            aria-selected={isActive}
            className="flex-1 flex flex-col items-center justify-center gap-0.5 pt-2 pb-2 text-[10px] font-medium transition-colors relative"
            style={{ color: isActive ? "var(--jl-accent)" : "var(--app-text-secondary)" }}
          >
            {isActive && (
              <span
                className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full"
                style={{ background: "var(--jl-accent)" }}
              />
            )}
            <Icon size={22} fill={isActive ? "var(--jl-accent)" : "none"} strokeWidth={isActive ? 2 : 1.75} />
            {label}
          </NavLink>
        );
      })}

      <button
        type="button"
        role="tab"
        aria-selected={false}
        aria-label="Settings"
        onClick={onSettingsClick}
        className="flex-1 flex flex-col items-center justify-center gap-0.5 pt-2 pb-2 text-[10px] font-medium transition-colors"
        style={{ color: "var(--app-text-secondary)" }}
      >
        <Settings size={22} strokeWidth={1.75} />
        Settings
      </button>
    </nav>
  );
};

export default BottomTabBar;
