import React, { useState, useEffect, useContext } from "react";
import { AppContext } from "../context/AppContext";
import axios from "axios";
import { toast } from "react-toastify";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, CheckCircle2, AlertCircle, RefreshCw, LogOut, ChevronRight, Bell, Sparkles } from "lucide-react";
import moment from "moment";

const CalendarWidget = ({ role = "user" }) => {
  const { user, companyToken, backendUrl, getRecruiterAuthHeaders } = useContext(AppContext);
  const [isConnected, setIsConnected] = useState(false);
  const [calendarEmail, setCalendarEmail] = useState("");
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const getHeaders = async () => {
    if (role === "recruiter") {
      return await getRecruiterAuthHeaders();
    }
    const token = await user.getIdToken();
    return { Authorization: `Bearer ${token}` };
  };

  const fetchSyncStatus = async () => {
    try {
      const headers = await getHeaders();
      const endpoint = role === "recruiter" ? "/api/company/company" : "/api/users/user";
      const { data } = await axios.get(backendUrl + endpoint, { headers });
      
      const profile = role === "recruiter" ? data.company : data.user;
      if (profile) {
        setIsConnected(!!profile.calendarConnected);
        setCalendarEmail(profile.calendarEmail || "");
      }
    } catch (error) {
      console.error("Error fetching sync status:", error);
    }
  };

  const fetchEvents = async () => {
    if (!isConnected) return;
    setIsLoading(true);
    try {
      const headers = await getHeaders();
      const { data } = await axios.get(backendUrl + "/api/calendar-notes/events", { headers });
      if (data.success) {
        setEvents(data.events);
      }
    } catch (error) {
      console.error("Error fetching events:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const checkCalendarConnection = () => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("calendar_auth") === "success") {
      setIsConnected(true);
      toast.success("Google Calendar successfully connected!");
      window.history.replaceState({}, document.title, window.location.pathname);
      fetchSyncStatus();
    }
  };

  useEffect(() => {
    if (user || companyToken) {
      fetchSyncStatus();
      checkCalendarConnection();
    }
  }, [user, companyToken, isConnected]);

  useEffect(() => {
    if (isConnected) {
      fetchEvents();
    } else {
      setEvents([]);
    }
  }, [isConnected]);

  const handleConnectCalendar = async () => {
    setIsLoading(true);
    try {
      const headers = await getHeaders();
      const currentPath = window.location.pathname;
      const { data } = await axios.get(
        `${backendUrl}/api/calendar/auth?redirect_to=${encodeURIComponent(currentPath)}`,
        { headers }
      );
      if (data.success && data.authUrl) {
        window.location.href = data.authUrl;
      } else {
        toast.error("Failed to fetch Google Auth URL");
      }
    } catch (error) {
      toast.error("Failed to connect Google Calendar: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = async () => {
    setIsLoading(true);
    try {
      const headers = await getHeaders();
      const { data } = await axios.post(
        backendUrl + "/api/calendar-notes/sync-calendar",
        { connected: false },
        { headers }
      );
      if (data.success) {
        setIsConnected(false);
        setCalendarEmail("");
        setEvents([]);
        toast.info("Google Calendar disconnected.");
      }
    } catch (error) {
      toast.error("Failed to disconnect");
    } finally {
      setIsLoading(false);
    }
  };

  const triggerManualSync = () => {
    fetchEvents();
    toast.success("Calendar events synchronized!");
  };

  return (
    <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden p-6 relative">
      {/* Background visual glow */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50/50 rounded-full blur-xl pointer-events-none" />

      <div className="flex items-center justify-between border-b border-gray-50 pb-4 mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
            <Calendar size={20} />
          </div>
          <div>
            <h3 className="font-bold text-gray-800 text-sm lg:text-base">Google Calendar</h3>
            <p className="text-xs text-gray-400">Sync interviews & reminders</p>
          </div>
        </div>
        
        {isConnected && (
          <button
            onClick={triggerManualSync}
            disabled={isLoading}
            className="p-1.5 hover:bg-gray-50 text-gray-400 hover:text-gray-700 rounded-lg transition"
            title="Force Sync"
          >
            <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
          </button>
        )}
      </div>

      <AnimatePresence mode="wait">
        {!isConnected ? (
          <motion.div
            key="disconnected"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="text-center py-6"
          >
            <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
              <Calendar size={24} className="text-gray-300" />
            </div>
            <p className="text-xs font-semibold text-gray-600">Calendar Not Connected</p>
            <p className="text-[11px] text-gray-400 mt-1 max-w-[200px] mx-auto leading-relaxed">
              Connect Google Calendar to automatically receive alerts, interviews and job reminders.
            </p>
            <button
              onClick={handleConnectCalendar}
              disabled={isLoading}
              className="mt-4 bg-brand-orange text-white py-2 px-5 rounded-xl text-xs font-bold hover:bg-jl-accent transition shadow-sm hover:shadow active:scale-95 inline-flex items-center gap-1.5 disabled:opacity-50"
            >
              <Sparkles size={13} />
              Connect Google Calendar
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="connected"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            {/* Sync Header Status Card */}
            <div className="bg-emerald-50/50 border border-emerald-100/50 rounded-xl p-3 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-emerald-800 font-semibold truncate">
                <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                <span className="truncate">{calendarEmail}</span>
              </div>
              <button
                onClick={handleDisconnect}
                className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-1 rounded transition shrink-0"
                title="Disconnect Account"
              >
                <LogOut size={13} />
              </button>
            </div>

            {/* Events List */}
            <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Upcoming Schedule</p>
              {events.length === 0 ? (
                <div className="text-center py-6 text-gray-400">
                  <Bell size={18} className="mx-auto mb-1 opacity-40" />
                  <p className="text-[11px]">No upcoming events synced.</p>
                </div>
              ) : (
                events.map((event) => (
                  <div
                    key={event.id}
                    className={`p-2.5 rounded-xl border text-xs transition hover:shadow-xs flex flex-col gap-1 ${
                      event.isReminder
                        ? "bg-amber-50/40 border-amber-100 text-amber-900"
                        : "bg-blue-50/30 border-blue-100 text-blue-900"
                    }`}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <p className="font-bold line-clamp-1">{event.title}</p>
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                        event.isReminder
                          ? "bg-amber-100 text-amber-700"
                          : "bg-blue-100 text-blue-700"
                      }`}>
                        {event.isReminder ? "Reminder" : "Event"}
                      </span>
                    </div>
                    <p className="text-[10px] opacity-75 font-medium">
                      {moment(event.date).format("MMM DD, YYYY at h:mm A")}
                    </p>
                    {event.description && (
                      <p className="text-[10px] text-gray-500 line-clamp-1 mt-0.5">{event.description}</p>
                    )}
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default CalendarWidget;
