import React from "react";
import { Menu } from "lucide-react";
import { useAppLayout } from "../../context/AppLayoutContext";

const AppSectionHeader = ({
  title,
  subtitle,
  action,
  showMenu = true,
  onMenuClick,
}) => {
  const { openSidebar } = useAppLayout();
  const handleMenu = onMenuClick || openSidebar;

  return (
    <header className="chat-header shrink-0 flex items-center justify-between px-4 lg:px-6 h-14">
      <div className="flex items-center gap-3 min-w-0">
        {showMenu && (
          <button
            type="button"
            onClick={handleMenu}
            className="chat-btn-ghost p-2 rounded-xl lg:hidden shrink-0"
            aria-label="Open menu"
          >
            <Menu size={20} />
          </button>
        )}
        <div className="min-w-0">
          <h1 className="text-base font-semibold truncate" style={{ color: "var(--chat-text)" }}>
            {title}
          </h1>
          {subtitle && (
            <p className="text-xs truncate" style={{ color: "var(--chat-text-muted)" }}>
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {action && <div className="shrink-0 ml-3">{action}</div>}
    </header>
  );
};

export default AppSectionHeader;
