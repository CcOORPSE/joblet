import React, { useContext, useEffect, useState, useRef } from "react";
import { AppContext } from "../../context/AppContext";
import axios from "axios";
import { toast } from "react-toastify";
import { Play, Calendar, Video, CheckCircle2, User, Mic, CheckCircle, Clock, Volume2, Star } from "lucide-react";
import { RetellWebClient } from "retell-client-js-sdk";

const webClient = new RetellWebClient();

const MockPreparation = () => {
  const { backendUrl, user, token } = useContext(AppContext);
  const [interviews, setInterviews] = useState([]);
  const [interviewers, setInterviewers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCall, setActiveCall] = useState(false);
  const [isCallStarted, setIsCallStarted] = useState(false);
  const [currentCallId, setCurrentCallId] = useState(null);
  const [calendarConnected, setCalendarConnected] = useState(false);

  // Live call states
  const [lastInterviewerResponse, setLastInterviewerResponse] = useState("Hello! I'm your AI Interviewer. Click start to begin!");
  const [lastUserResponse, setLastUserResponse] = useState("Your responses will appear here as you speak...");
  
  const [activeTurn, _setActiveTurn] = useState("agent"); // 'agent' or 'user'
  const activeTurnRef = useRef("agent");
  const setActiveTurn = (turn) => {
    _setActiveTurn(turn);
    activeTurnRef.current = turn;
  };

  const [callTime, setCallTime] = useState(0); // in seconds
  const [isCompletedState, setIsCompletedState] = useState(false);
  const [currentInterview, setCurrentInterview] = useState(null);

  // Feedback states
  const [feedbackText, setFeedbackText] = useState("");
  const [satisfaction, setSatisfaction] = useState(5);
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  // Self scheduling states
  const [selectedInterviewer, setSelectedInterviewer] = useState("");
  const [objective, setObjective] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");
  const [scheduling, setScheduling] = useState(false);

  const timerRef = useRef(null);
  const recognitionRef = useRef(null);
  const utteranceRef = useRef(null);

  const fetchMyInterviews = async () => {
    try {
      const firebaseToken = await user?.getIdToken();
      const authToken = token || firebaseToken;
      if (!authToken) {
        setLoading(false);
        return;
      }
      const { data } = await axios.get(`${backendUrl}/api/interviews/my-interviews`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      if (data.success) {
        setInterviews(data.interviews);
      }
    } catch (error) {
      toast.error("Failed to fetch assigned interviews: " + error.message);
    } finally {
      setLoading(false);
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
      console.error("Error fetching AI interviewers: ", error.message);
    }
  };

  const handleConnectCalendar = async () => {
    try {
      const firebaseToken = await user?.getIdToken();
      const authToken = token || firebaseToken;
      if (!authToken) {
        toast.error("Authentication required");
        return;
      }
      const { data } = await axios.get(`${backendUrl}/api/calendar/auth`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      if (data.success && data.authUrl) {
        window.location.href = data.authUrl;
      }
    } catch (error) {
      toast.error("Failed to connect Google Calendar: " + error.message);
    }
  };

  const checkCalendarConnection = () => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("calendar_auth") === "success") {
      setCalendarConnected(true);
      toast.success("Google Calendar successfully connected!");
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  };

  const handleScheduleOwn = async (e) => {
    e.preventDefault();
    if (!selectedInterviewer || !scheduleTime) {
      toast.error("Please fill in interviewer style and schedule date/time.");
      return;
    }

    setScheduling(true);
    const interviewer = interviewers.find(i => i.id === Number(selectedInterviewer));

    try {
      const firebaseToken = await user?.getIdToken();
      const authToken = token || firebaseToken;
      const { data } = await axios.post(
        `${backendUrl}/api/interviews/schedule-own`,
        {
          interviewerId: interviewer.agent_id,
          interviewerName: interviewer.name,
          objective,
          scheduleTime,
        },
        { headers: { Authorization: `Bearer ${authToken}` } }
      );

      if (data.success) {
        toast.success("Self mock interview scheduled successfully!");
        setObjective("");
        setScheduleTime("");
        fetchMyInterviews();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error("Failed to schedule interview: " + error.message);
    } finally {
      setScheduling(false);
    }
  };

  const speakMockText = (text) => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utteranceRef.current = utterance; // Keep reference to prevent GC (garbage collection)
      const voices = window.speechSynthesis.getVoices();
      const voice = voices.find(v => v.lang.startsWith("en")) || voices[0];
      if (voice) {
        utterance.voice = voice;
      }
      utterance.onstart = () => setActiveTurn("agent");
      utterance.onend = () => {
        setActiveTurn("user");
        startMockRecognition();
      };
      window.speechSynthesis.speak(utterance);
    }
  };

  const startMockRecognition = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn("Speech recognition not supported in this browser.");
      return;
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.onend = null;
        recognitionRef.current.stop();
      } catch (e) {}
    }

    const rec = new SpeechRecognition();
    rec.continuous = false;
    rec.interimResults = false;
    rec.lang = "en-US";

    rec.onstart = () => {
      setActiveTurn("user");
    };

    rec.onresult = (event) => {
      const speechToText = event.results[0][0].transcript;
      setLastUserResponse(speechToText);
      setActiveTurn("agent");

      // Respond back after user finishes speaking
      setTimeout(() => {
        const mockResponses = [
          "That sounds really interesting. Can you tell me more about the technical challenges you faced in that project?",
          "Great explanation. How do you handle conflict or differing opinions within a development team?",
          "Thanks for sharing. What are your thoughts on scalability and database optimization when building high-traffic web applications?",
          "Interesting point. How do you keep yourself updated with the latest trends and technologies in web development?",
          "Perfect. That covers my main questions. Do you have any questions for me about the role or the team?"
        ];
        const nextResponse = mockResponses[Math.floor(Math.random() * mockResponses.length)];
        setLastInterviewerResponse(nextResponse);
        speakMockText(nextResponse);
      }, 2000);
    };

    rec.onerror = (e) => {
      console.warn("Speech recognition error:", e);
    };

    rec.onend = () => {
      // Auto-restart if microphone times out due to silence and turn is still user
      if (activeTurnRef.current === "user") {
        try {
          rec.start();
        } catch (err) {}
      }
    };

    recognitionRef.current = rec;
    rec.start();
  };

  const handleStartCall = async (interview) => {
    setCurrentInterview(interview);
    setCallTime(0);
    setIsCompletedState(false);
    setFeedbackSubmitted(false);
    setFeedbackText("");
    setLastInterviewerResponse("Click 'Start Speaking' below to connect with your AI interviewer.");
    setLastUserResponse("Your responses will appear here as you speak...");
    setActiveCall(true);
    setIsCallStarted(false);
  };

  const startActualCall = async () => {
    toast.info("Connecting to Interview Agent...");
    try {
      const firebaseToken = await user?.getIdToken();
      const authToken = token || firebaseToken;
      
      const { data } = await axios.post(
        `${backendUrl}/api/interviews/register-call`,
        {
          agentId: currentInterview.interviewerId,
          interviewId: currentInterview.id,
        },
        { headers: { Authorization: `Bearer ${authToken}` } }
      );

      if (data.success && data.registerCallResponse) {
        const { access_token, call_id } = data.registerCallResponse;
        setCurrentCallId(call_id);
        setIsCallStarted(true);
        
        if (access_token === "mock_access_token_token") {
          toast.success("Connected to Mock Voice Agent! (Simulating interview session)");
          
          const welcomeMsg = "Hello! I am your AI interviewer. Let's begin the interview. Please introduce yourself and talk about your experience.";
          setLastInterviewerResponse(welcomeMsg);
          speakMockText(welcomeMsg);
          
          timerRef.current = setInterval(() => {
            setCallTime(prev => prev + 1);
          }, 1000);
        } else {
          await webClient.startCall({ accessToken: access_token });
          toast.success("Voice practice call started. Start speaking!");
          
          timerRef.current = setInterval(() => {
            setCallTime(prev => prev + 1);
          }, 1000);
        }
      } else {
        toast.error("Failed to register the call session.");
      }
    } catch (err) {
      toast.error("Failed to start voice call: " + err.message);
      console.error(err);
    }
  };

  const handleEndCall = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }
    try {
      webClient.stopCall();
    } catch (err) {
      console.error("Error stopping call:", err);
    }
    setActiveCall(false);
    setIsCallStarted(false);
    setIsCompletedState(true);
    toast.success("Voice practice call ended. Please leave your feedback.");
    fetchMyInterviews();
  };

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    setSubmittingFeedback(true);
    try {
      toast.success("Thank you for your feedback!");
      setFeedbackSubmitted(true);
    } catch (err) {
      toast.error("Failed to submit feedback: " + err.message);
    } finally {
      setSubmittingFeedback(false);
    }
  };

  useEffect(() => {
    webClient.on("call_started", () => {
      console.log("Call started");
    });
    webClient.on("call_ended", () => {
      console.log("Call ended");
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      setActiveCall(false);
      setIsCallStarted(false);
      setIsCompletedState(true);
    });
    webClient.on("agent_start_talking", () => {
      setActiveTurn("agent");
    });
    webClient.on("agent_stop_talking", () => {
      setActiveTurn("user");
    });
    webClient.on("error", (error) => {
      console.error("An error occurred:", error);
      try {
        webClient.stopCall();
      } catch (err) {}
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      setActiveCall(false);
      setIsCallStarted(false);
      setIsCompletedState(true);
    });

    webClient.on("update", (update) => {
      if (update.transcript) {
        const transcripts = update.transcript;
        let lastAgent = "";
        let lastUser = "";
        for (const t of transcripts) {
          if (t.role === "agent") lastAgent = t.content;
          if (t.role === "user") lastUser = t.content;
        }
        if (lastAgent) setLastInterviewerResponse(lastAgent);
        if (lastUser) setLastUserResponse(lastUser);
      }
    });

    return () => {
      webClient.removeAllListeners();
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
    };
  }, []);

  useEffect(() => {
    if (user) {
      fetchMyInterviews();
      fetchInterviewers();
      checkCalendarConnection();
    } else {
      const timer = setTimeout(() => setLoading(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [user]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  if (loading) {
    return <div className="text-center py-10 text-gray-500">Loading interview sessions...</div>;
  }

  // Get current interviewer's image or fallback
  const interviewerImage = currentInterview?.interviewerId?.includes("tech") || currentInterview?.interviewerName?.includes("David")
    ? "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150"
    : "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150";

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8">
      {/* Header section - hide during active call */}
      {!activeCall && !isCompletedState && (
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b pb-6 gap-4">
          <div>
            <h2 className="text-3xl font-extrabold text-gray-800 tracking-tight">AI Preparation Center</h2>
            <p className="text-gray-500 mt-1">
              Improve your communication, speech flow, and subject matter understanding with voice assessments.
            </p>
          </div>
          <div>
            {calendarConnected ? (
              <div className="flex items-center gap-2 bg-green-50 text-green-600 px-4 py-2 rounded-xl border border-green-200 shadow-sm">
                <CheckCircle size={18} />
                <span className="text-sm font-semibold">Calendar Connected</span>
              </div>
            ) : (
              <button
                onClick={handleConnectCalendar}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all shadow-sm hover:shadow-md"
              >
                <Calendar size={18} />
                Connect Google Calendar
              </button>
            )}
          </div>
        </div>
      )}

      {/* 1. Active Call Panel */}
      {activeCall && (
        <div className="bg-slate-900 text-white rounded-3xl p-8 shadow-2xl flex flex-col space-y-6 max-w-4xl mx-auto border border-slate-800">
          
          {/* Progress Header */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <span className={`h-3.5 w-3.5 rounded-full ${isCallStarted ? "bg-red-500 animate-ping" : "bg-yellow-500 animate-pulse"}`}></span>
              <h3 className="text-lg font-bold text-slate-200">
                {isCallStarted ? "Practice Session Live" : "Session Setup"}
              </h3>
            </div>
            {isCallStarted && (
              <div className="flex items-center gap-2 bg-slate-800 px-4 py-1.5 rounded-full text-sm font-mono text-slate-350">
                <Clock size={16} className="text-indigo-400" />
                <span>{formatTime(callTime)} / 15:00</span>
              </div>
            )}
          </div>

          {!isCallStarted ? (
            <div className="flex flex-col items-center justify-center py-12 text-center max-w-md mx-auto space-y-6">
              <div className="p-4 bg-indigo-500/10 rounded-full text-indigo-400">
                <Mic size={48} className="animate-pulse" />
              </div>
              <div className="space-y-2">
                <h4 className="text-xl font-bold text-slate-150">Ready to speak with {currentInterview?.interviewerName}?</h4>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Make sure your microphone is connected, your sound is turned up, and you are in a quiet room. Click below to begin the voice interaction.
                </p>
              </div>
              <div className="flex gap-4 w-full">
                <button
                  onClick={startActualCall}
                  className="flex-1 bg-brand-orange hover:bg-brand-orange/95 text-white font-bold py-3.5 px-6 rounded-2xl transition-all shadow-lg flex items-center justify-center gap-2 text-base"
                >
                  <Play size={18} />
                  Start Speaking
                </button>
                <button
                  onClick={() => {
                    setActiveCall(false);
                    setIsCallStarted(false);
                  }}
                  className="bg-slate-800 hover:bg-slate-750 text-slate-300 font-semibold py-3.5 px-6 rounded-2xl transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Interactive Screen Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-6">
                
                {/* Left: AI Interviewer */}
                <div className="flex flex-col items-center p-6 bg-slate-800/50 rounded-2xl border border-slate-700/50 relative overflow-hidden">
                  <div className="absolute top-4 right-4 flex items-center gap-1.5 text-xs text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-full">
                    <Volume2 size={12} /> Live Voice
                  </div>
                  <div className={`p-1.5 rounded-full transition-all duration-300 ${activeTurn === "agent" ? "ring-4 ring-indigo-500 ring-offset-4 ring-offset-slate-900Scale" : "opacity-80"}`}>
                    <img 
                      src={interviewerImage} 
                      alt="Interviewer avatar" 
                      className="h-28 w-28 rounded-full object-cover shadow-lg"
                    />
                  </div>
                  <h4 className="text-lg font-bold mt-4 text-slate-100">{currentInterview?.interviewerName}</h4>
                  <p className="text-xs text-indigo-300 font-medium">Interviewer Profile</p>
                  
                  <div className="mt-6 w-full text-center bg-slate-900/60 p-4 rounded-xl text-sm leading-relaxed text-slate-300 min-h-[100px] flex items-center justify-center italic">
                    "{lastInterviewerResponse}"
                  </div>
                </div>

                {/* Right: Candidate */}
                <div className="flex flex-col items-center p-6 bg-slate-800/50 rounded-2xl border border-slate-700/50 relative overflow-hidden">
                  <div className="absolute top-4 right-4 flex items-center gap-1.5 text-xs text-green-400 bg-green-500/10 px-2.5 py-1 rounded-full">
                    <Mic size={12} /> Capturing Speech
                  </div>
                  <div className={`p-1.5 rounded-full transition-all duration-300 ${activeTurn === "user" ? "ring-4 ring-green-500 ring-offset-4 ring-offset-slate-900Scale" : "opacity-80"}`}>
                    <div className="h-28 w-28 rounded-full bg-slate-700 flex items-center justify-center text-3xl font-extrabold text-white shadow-lg">
                      {user?.displayName ? user.displayName.charAt(0).toUpperCase() : "U"}
                    </div>
                  </div>
                  <h4 className="text-lg font-bold mt-4 text-slate-100">{user?.displayName || "Candidate"}</h4>
                  <p className="text-xs text-green-300 font-medium">Speech Stream</p>
                  
                  <div className="mt-6 w-full text-center bg-slate-900/60 p-4 rounded-xl text-sm leading-relaxed text-slate-300 min-h-[100px] flex items-center justify-center italic">
                    "{lastUserResponse}"
                  </div>
                </div>

              </div>

              {/* Action Control Panel */}
              <div className="flex justify-center border-t border-slate-800 pt-6">
                <button
                  onClick={handleEndCall}
                  className="bg-red-650 hover:bg-red-700 active:scale-95 text-white font-bold py-3.5 px-10 rounded-2xl transition-all shadow-lg flex items-center gap-2.5"
                >
                  <Mic size={18} />
                  End and Submit Session
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* 2. Post Call / Feedback screen */}
      {isCompletedState && (
        <div className="max-w-xl mx-auto bg-white border border-gray-150 p-8 rounded-3xl shadow-xl space-y-6 text-center">
          <div className="mx-auto w-16 h-16 bg-green-50 rounded-full flex items-center justify-center text-green-600">
            <CheckCircle2 size={36} />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-gray-800">Practice Completed!</h3>
            <p className="text-sm text-gray-500 mt-1">Your practice answers have been saved and synced to your applicant profile.</p>
          </div>

          {!feedbackSubmitted ? (
            <form onSubmit={handleFeedbackSubmit} className="space-y-4 text-left border-t pt-6">
              <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-2">Leave Session Feedback</h4>
              <div>
                <label className="block text-xs font-semibold text-gray-505 mb-2">Interviewer & Call Quality Rating</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      onClick={() => setSatisfaction(star)}
                      className={`p-1.5 rounded-lg transition-all ${satisfaction >= star ? "text-amber-400" : "text-gray-300"}`}
                    >
                      <Star size={24} fill={satisfaction >= star ? "currentColor" : "none"} />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-505 mb-1.5">Comments or Suggestions</label>
                <textarea
                  rows="3"
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  placeholder="How was the voice naturalness? Did the follow-up questions challenge you?"
                  className="w-full p-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all resize-none"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={submittingFeedback}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl text-sm transition-all shadow-sm"
              >
                {submittingFeedback ? "Submitting..." : "Submit Feedback"}
              </button>
            </form>
          ) : (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-sm text-green-700 font-medium">
              Feedback submitted successfully! Thank you.
            </div>
          )}

          <button
            onClick={() => setIsCompletedState(false)}
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2.5 rounded-xl text-sm transition-all"
          >
            Back to AI Preparation Center
          </button>
        </div>
      )}

      {/* 3. Scheduler & Sessions view */}
      {!activeCall && !isCompletedState && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Interview List */}
          <div className="lg:col-span-2 space-y-6">
            <h3 className="text-xl font-bold text-gray-700 flex items-center gap-2">
              <Video className="text-blue-500" size={20} />
              Scheduled Voice Assessments
            </h3>
            {interviews.length === 0 ? (
              <div className="bg-gray-50 border border-gray-100 rounded-xl p-8 text-center text-gray-500 shadow-inner">
                No interviews scheduled yet. Use the scheduler on the right to set up your first mock practice!
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {interviews.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-semibold px-3 py-1 rounded-full ${
                          item.status === "completed" ? "bg-green-50 text-green-600 border border-green-150" : "bg-blue-50 text-blue-600 border border-blue-150"
                        }`}>
                          {item.status === "completed" ? "Completed" : "Scheduled"}
                        </span>
                        {item.calendarEventUrl && (
                          <a
                            href={item.calendarEventUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 hover:underline flex items-center gap-1 font-medium"
                          >
                            <Calendar size={12} /> Google Calendar
                          </a>
                        )}
                      </div>
                      <h4 className="text-lg font-bold text-gray-800">
                        Assessment with {item.interviewerName}
                      </h4>
                      <p className="text-sm text-gray-500 line-clamp-2">{item.objective}</p>
                      <div className="text-xs text-gray-400">
                        Scheduled: {new Date(item.scheduleTime).toLocaleString()}
                      </div>
                    </div>

                    {item.status !== "completed" && (
                      <button
                        onClick={() => handleStartCall(item)}
                        className="mt-6 w-full bg-brand-orange hover:bg-brand-orange/90 text-white font-bold py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm"
                      >
                        <Play size={16} /> Start Voice Practice
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Self Scheduler Sidebar */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm h-fit">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2 border-b pb-3">
              <Calendar className="text-blue-500" size={18} />
              Schedule Mock Practice
            </h3>
            <form onSubmit={handleScheduleOwn} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-505 mb-1.5 uppercase tracking-wider">
                  AI Interviewer & Domain
                </label>
                <select
                  value={selectedInterviewer}
                  onChange={(e) => setSelectedInterviewer(e.target.value)}
                  className="w-full p-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all appearance-none cursor-pointer"
                >
                  {interviewers.map((int) => (
                    <option key={int.id} value={int.id}>
                      {int.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-505 mb-1.5 uppercase tracking-wider">
                  Objective / Focus Areas
                </label>
                <textarea
                  rows="3"
                  placeholder="e.g. React hooks, behavioral fit, or SQL optimizations."
                  value={objective}
                  onChange={(e) => setObjective(e.target.value)}
                  className="w-full p-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-505 mb-1.5 uppercase tracking-wider">
                  Date & Time
                </label>
                <input
                  type="datetime-local"
                  value={scheduleTime}
                  onChange={(e) => setScheduleTime(e.target.value)}
                  className="w-full p-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all cursor-pointer"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={scheduling}
                className="w-full mt-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl text-sm transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <CheckCircle2 size={16} />
                {scheduling ? "Scheduling..." : "Schedule Session"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MockPreparation;
