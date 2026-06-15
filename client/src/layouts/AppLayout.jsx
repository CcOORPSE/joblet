import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import ChatSidebar from "../components/chat/ChatSidebar";
import { AppLayoutContext } from "../context/AppLayoutContext";
import "../styles/chat.css";

const AppLayout = ({
  user,
  userData,
  sessions = [],
  activeSessionId,
  onSelectSession,
  onSettingsClick,
  children,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    setDrawerOpen(false);
  }, [activeSessionId, location.pathname]);

  const openSidebar = () => setDrawerOpen(true);
  const closeSidebar = () => setDrawerOpen(false);

  const handleSelectSession = (id) => {
    onSelectSession(id);
    closeSidebar();
  };

  const sidebarProps = {
    user,
    userData,
    sessions,
    activeSessionId,
    onSelectSession: handleSelectSession,
    onSettingsClick: () => {
      closeSidebar();
      onSettingsClick();
    },
    onLogoClick: () => navigate("/"),
  };

  return (
    <AppLayoutContext.Provider value={{ openSidebar }}>
      <div className="chat-workspace flex h-full min-h-0 w-full">
        <ChatSidebar
          {...sidebarProps}
          className="hidden lg:flex w-[var(--chat-sidebar-width)] shrink-0"
        />

        {drawerOpen && (
          <>
            <div
              className="fixed inset-0 z-40 bg-black/40 lg:hidden"
              onClick={closeSidebar}
              aria-hidden="true"
            />
            <ChatSidebar
              {...sidebarProps}
              className="chat-drawer-enter fixed inset-y-0 left-0 z-50 w-[min(300px,85vw)] lg:hidden shadow-xl"
            />
          </>
        )}

        <div className="chat-main flex flex-col flex-1 min-w-0 min-h-0">
          {children}
        </div>
      </div>
    </AppLayoutContext.Provider>
  );
};

export default AppLayout;
