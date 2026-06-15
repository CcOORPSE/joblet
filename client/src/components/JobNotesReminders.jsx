import React, { useState, useEffect, useContext } from "react";
import { AppContext } from "../context/AppContext";
import axios from "axios";
import { toast } from "react-toastify";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, Bell, CheckSquare, Save, X, Calendar, Sparkles } from "lucide-react";

const JobNotesReminders = ({ jobId, jobTitle, onClose, role = "user" }) => {
  const { user, backendUrl, getRecruiterAuthHeaders } = useContext(AppContext);
  const [notes, setNotes] = useState("");
  const [reminderTitle, setReminderTitle] = useState("");
  const [reminderDate, setReminderDate] = useState("");
  const [reminderSynced, setReminderSynced] = useState(false);
  const [isCalendarConnected, setIsCalendarConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const getHeaders = async () => {
    if (role === "recruiter") {
      return await getRecruiterAuthHeaders();
    }
    const token = await user.getIdToken();
    return { Authorization: `Bearer ${token}` };
  };

  const fetchNotesAndStatus = async () => {
    setIsLoading(true);
    try {
      const headers = await getHeaders();
      
      // Fetch notes
      const notesRes = await axios.get(backendUrl + `/api/calendar-notes/notes/${jobId}`, { headers });
      if (notesRes.data.success && notesRes.data.data) {
        const payload = notesRes.data.data;
        setNotes(payload.notes || "");
        setReminderTitle(payload.reminderTitle || "");
        setReminderDate(payload.reminderDate || "");
        setReminderSynced(!!payload.reminderSynced);
      }

      // Fetch user google calendar sync state
      const profileEndpoint = role === "recruiter" ? "/api/company/company" : "/api/users/user";
      const profileRes = await axios.get(backendUrl + profileEndpoint, { headers });
      const profile = role === "recruiter" ? profileRes.data.company : profileRes.data.user;
      if (profile) {
        setIsCalendarConnected(!!profile.calendarConnected);
      }
    } catch (error) {
      console.error("Error fetching notes/reminders:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (jobId) {
      fetchNotesAndStatus();
    }
  }, [jobId]);

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const headers = await getHeaders();
      
      const payload = {
        jobId,
        notes,
        reminderTitle,
        reminderDate,
        reminderSynced: isCalendarConnected ? reminderSynced : false
      };

      const { data } = await axios.post(backendUrl + "/api/calendar-notes/notes", payload, { headers });
      if (data.success) {
        toast.success("Notes & Reminders updated successfully!");
        if (onClose) onClose();
      }
    } catch (error) {
      toast.error("Failed to save notes & reminders");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[99] flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ duration: 0.3 }}
        className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col border border-gray-100"
      >
        {/* Header */}
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-brand-orange/10 text-brand-orange rounded-xl">
              <FileText size={18} />
            </div>
            <div>
              <h3 className="font-extrabold text-brand-navy text-sm lg:text-base leading-tight">Job Notes & Alerts</h3>
              <p className="text-xs text-gray-500 font-semibold truncate max-w-[280px]">{jobTitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-200 text-gray-400 hover:text-gray-700 rounded-lg transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        {isLoading ? (
          <div className="p-12 text-center text-gray-500 flex flex-col items-center justify-center gap-2">
            <div className="w-8 h-8 border-4 border-brand-orange border-t-transparent rounded-full animate-spin" />
            <p className="text-xs font-semibold mt-2">Retrieving Notes...</p>
          </div>
        ) : (
          <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-5">
            {/* Notes Textarea */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block">Personal Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Write specific notes about this job, recruiter follow-ups, salary insights, mock preparation..."
                className="w-full h-32 p-3 text-xs border border-gray-200 rounded-xl focus:border-brand-orange focus:ring-1 focus:ring-brand-orange/30 outline-none resize-none transition"
              />
            </div>

            {/* Reminder Options */}
            <div className="bg-gray-50/50 border border-gray-100 rounded-xl p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell size={16} className="text-brand-orange" />
                  <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">Set Reminder Alert</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Reminder Title</label>
                  <input
                    type="text"
                    value={reminderTitle}
                    onChange={(e) => setReminderTitle(e.target.value)}
                    placeholder="e.g. Call recruiter, Technical test"
                    className="w-full p-2.5 text-xs border border-gray-200 rounded-lg focus:border-brand-orange focus:ring-1 focus:ring-brand-orange/30 outline-none transition bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Date & Time</label>
                  <input
                    type="datetime-local"
                    value={reminderDate}
                    onChange={(e) => setReminderDate(e.target.value)}
                    className="w-full p-2.5 text-xs border border-gray-200 rounded-lg focus:border-brand-orange focus:ring-1 focus:ring-brand-orange/30 outline-none transition bg-white"
                  />
                </div>
              </div>

              {/* Sync with Google Calendar Switch */}
              <div className="flex items-center justify-between pt-2 border-t border-gray-100/50">
                <div className="flex items-center gap-2">
                  <Calendar size={14} className="text-blue-500" />
                  <div>
                    <p className="text-xs font-bold text-gray-700">Sync to Google Calendar</p>
                    <p className="text-[10px] text-gray-400">
                      {isCalendarConnected ? "Synched live with your active calendar" : "Google Calendar is not connected"}
                    </p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={reminderSynced && isCalendarConnected}
                    disabled={!isCalendarConnected}
                    onChange={(e) => setReminderSynced(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-500 peer-disabled:opacity-50"></div>
                </label>
              </div>
            </div>

            {/* Form Footer */}
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="py-2.5 px-5 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="py-2.5 px-6 rounded-xl bg-brand-orange hover:bg-jl-accent text-white text-xs font-extrabold transition shadow-sm hover:shadow flex items-center gap-1.5 active:scale-95 disabled:opacity-75"
              >
                {isSaving ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save size={14} />
                    <span>Save Notes & Reminder</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </motion.div>
    </div>
  );
};

export default JobNotesReminders;
