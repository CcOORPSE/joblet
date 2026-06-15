import React, { useContext, useEffect, useState } from "react";
import { Outlet, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { AppContext } from "../context/AppContext";
import AppLayout from "./AppLayout";
import BottomTabBar from "../components/chat/BottomTabBar";
import SettingsSheet from "../components/chat/SettingsSheet";
import "../styles/app-shell.css";

const SESSION_STORAGE_KEY = "applicantChatSessionId";

const AppShell = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { user, userData, fetchChatSessions } = useContext(AppContext);
  const [sessions, setSessions] = useState([]);

  useEffect(() => {
    if (!user) {
      setSessions([]);
      return;
    }
    fetchChatSessions().then(setSessions);
  }, [user, fetchChatSessions, location.pathname]);

  const activeSessionId =
    location.pathname.startsWith("/app/chat")
      ? searchParams.get("session") || localStorage.getItem(SESSION_STORAGE_KEY)
      : null;

  const selectSession = (id) => {
    navigate(`/app/chat?session=${id}`);
  };

  return (
    <div className="app-shell flex flex-col h-[100dvh]">
      <div className="app-shell-layout flex-1 min-h-0 flex flex-col">
        <AppLayout
          user={user}
          userData={userData}
          sessions={sessions}
          activeSessionId={activeSessionId}
          onSelectSession={selectSession}
          onSettingsClick={() => setSettingsOpen(true)}
        >
          <Outlet context={{ openSettings: () => setSettingsOpen(true) }} />
        </AppLayout>
      </div>

      <BottomTabBar onSettingsClick={() => setSettingsOpen(true)} hideOnDesktop />
      <SettingsSheet open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
};

export default AppShell;
