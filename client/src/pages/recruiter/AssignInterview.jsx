import React, { useContext, useEffect, useState } from "react";
import { AppContext } from "../../context/AppContext";
import axios from "axios";
import { toast } from "react-toastify";
import { Calendar, User, Briefcase, Play, CheckCircle } from "lucide-react";

const AssignInterview = () => {
  const { backendUrl, getRecruiterAuthHeaders, companyToken } = useContext(AppContext);
  const [applicants, setApplicants] = useState([]);
  const [interviewers, setInterviewers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [calendarConnected, setCalendarConnected] = useState(false);

  // Form states
  const [selectedApplicant, setSelectedApplicant] = useState("");
  const [selectedInterviewer, setSelectedInterviewer] = useState("");
  const [objective, setObjective] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");

  const fetchApplicants = async () => {
    try {
      const headers = await getRecruiterAuthHeaders();
      const { data } = await axios.get(`${backendUrl}/api/company/applicants`, { headers });
      if (data.success) {
        setApplicants(data.applications.filter(a => a.status === "Accepted" || a.status === "pending"));
      }
    } catch (error) {
      toast.error("Error fetching applicants: " + error.message);
    }
  };

  const fetchInterviewers = async () => {
    try {
      const { data } = await axios.get(`${backendUrl}/api/interviews/interviewers`);
      if (data.success) {
        setInterviewers(data.interviewers);
        if (data.interviewers.length > 0) {
          setSelectedInterviewer(data.interviewers[0].id);
        }
      }
    } catch (error) {
      toast.error("Error fetching AI interviewers: " + error.message);
    }
  };

  const handleConnectCalendar = async () => {
    try {
      const headers = await getRecruiterAuthHeaders();
      const { data } = await axios.get(`${backendUrl}/api/calendar/auth`, { headers });
      if (data.success && data.authUrl) {
        window.location.href = data.authUrl;
      }
    } catch (error) {
      toast.error("Failed to connect Google Calendar: " + error.message);
    }
  };

  const checkCalendarConnection = async () => {
    // Basic heuristics: if search params has calendar_auth=success or we check DB
    const params = new URLSearchParams(window.location.search);
    if (params.get("calendar_auth") === "success") {
      setCalendarConnected(true);
      toast.success("Google Calendar successfully connected!");
    }
  };

  const handleAssign = async (e) => {
    e.preventDefault();
    if (!selectedApplicant || !selectedInterviewer || !scheduleTime) {
      toast.error("Please fill in all fields");
      return;
    }

    const applicant = applicants.find(a => a._id === selectedApplicant);
    const interviewer = interviewers.find(i => i.id === Number(selectedInterviewer));

    try {
      const headers = await getRecruiterAuthHeaders();
      const { data } = await axios.post(
        `${backendUrl}/api/interviews/assign`,
        {
          applicantId: applicant.userId?._id,
          applicantEmail: applicant.userId?.email,
          interviewerId: interviewer.agent_id,
          interviewerName: interviewer.name,
          objective,
          scheduleTime,
        },
        { headers }
      );

      if (data.success) {
        toast.success("AI Mock Interview assigned successfully!");
        setObjective("");
        setScheduleTime("");
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error("Assignment failed: " + error.message);
    }
  };

  useEffect(() => {
    if (companyToken) {
      fetchApplicants();
      fetchInterviewers();
      checkCalendarConnection();
      setLoading(false);
    }
  }, [companyToken]);

  if (loading) {
    return <div className="text-center py-10">Loading interview manager...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-2xl shadow-sm border border-gray-100">
      <div className="flex justify-between items-center mb-8 border-b pb-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Assign AI Voice Interview</h2>
          <p className="text-sm text-gray-500 mt-1">
            Schedule mock practice or assessment rounds and notify students automatically.
          </p>
        </div>
        <div>
          {calendarConnected ? (
            <div className="flex items-center gap-2 bg-green-50 text-green-600 px-4 py-2 rounded-xl border border-green-200">
              <CheckCircle size={18} />
              <span className="text-sm font-semibold">Calendar Connected</span>
            </div>
          ) : (
            <button
              onClick={handleConnectCalendar}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all"
            >
              <Calendar size={18} />
              Connect Google Calendar
            </button>
          )}
        </div>
      </div>

      <form onSubmit={handleAssign} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Select Student/Applicant</label>
            <div className="relative">
              <select
                value={selectedApplicant}
                onChange={(e) => setSelectedApplicant(e.target.value)}
                className="w-full pl-3 pr-10 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all appearance-none"
              >
                <option value="">-- Choose a Candidate --</option>
                {applicants.map((app) => (
                  <option key={app._id} value={app._id}>
                    {app.userId?.name} ({app.jobId?.title})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Select AI Interviewer Style</label>
            <select
              value={selectedInterviewer}
              onChange={(e) => setSelectedInterviewer(e.target.value)}
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
            >
              {interviewers.map((int) => (
                <option key={int.id} value={int.id}>
                  {int.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Assessment Objective / Instructions</label>
          <textarea
            rows="3"
            placeholder="e.g. Test core JavaScript knowledge and async callback patterns."
            value={objective}
            onChange={(e) => setObjective(e.target.value)}
            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Schedule Date & Time</label>
          <input
            type="datetime-local"
            value={scheduleTime}
            onChange={(e) => setScheduleTime(e.target.value)}
            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
          />
        </div>

        <div className="pt-4">
          <button
            type="submit"
            className="w-full bg-brand-orange hover:bg-brand-orange/90 text-white font-bold py-3 px-6 rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all"
          >
            <Play size={18} />
            Assign and Send Notification
          </button>
        </div>
      </form>
    </div>
  );
};

export default AssignInterview;
