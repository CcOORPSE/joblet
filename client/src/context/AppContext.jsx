import { createContext, useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { auth, googleProvider, db, isFirebaseReady } from "../config/firebase.js";
import { onAuthStateChanged, signInWithPopup, signOut } from "firebase/auth";
import { collection, onSnapshot, query, where } from "firebase/firestore";

export const AppContext = createContext();

export const AppContextProvider = (props) => {
    let tempBackendUrl = (import.meta.env.VITE_BACKEND_URL || "").trim();
    if (typeof window !== "undefined" && window.location.hostname !== "localhost") {
      if (tempBackendUrl.includes("localhost") || tempBackendUrl.includes("127.0.0.1")) {
        tempBackendUrl = "";
      }
    }
    const backendUrl = tempBackendUrl;
    const isBackendConfigured = true;

    const [user, setUser] = useState(null);
    const [searchFilter, setSearchFilter] = useState({
        title: '',
        location: ''
    });

    const [isSearched, setIsSearched] = useState(false);
    const [jobs , setJobs] = useState([]);
    const [showRecruiterLogin, setShowRecruiterLogin] = useState(false);
    
    const [companyToken, setCompanyToken] = useState(null);
    const [companyData, setCompanyData] = useState(null);

    const [userData, setUserData] = useState(null);
    const [userApplications, setUserApplications] = useState(null);

    const clearCompanySession = () => {
      setCompanyToken(null);
      setCompanyData(null);
      localStorage.removeItem("companyToken");
      localStorage.removeItem("companyData");
    };

    const getRecruiterAuthHeaders = async () => {
      let token = companyToken || localStorage.getItem("companyToken");
      if (auth?.currentUser) {
        token = await auth.currentUser.getIdToken();
        setCompanyToken(token);
        localStorage.setItem("companyToken", token);
      } else if (!token) {
        clearCompanySession();
        throw new Error("Recruiter session expired. Please sign in again.");
      }
      return { Authorization: `Bearer ${token}` };
    };

    const ensureBackendUrl = () => {
      // Relative paths are supported, so we don't block if VITE_BACKEND_URL is missing.
      return true;
    };

    // Google Sign-In helper
    const loginWithGoogle = async () => {
      if (!isFirebaseReady || !auth || !googleProvider) {
        toast.error("Firebase is not configured. Check client/.env and restart the dev server.");
        return;
      }
      try {
        const result = await signInWithPopup(auth, googleProvider);
        toast.success(`Welcome ${result.user.displayName}!`);
      } catch (error) {
        toast.error(error.message);
      }
    };

    // Sign-Out helper
    const handleLogout = async () => {
      try {
        clearCompanySession();
        await signOut(auth);
        setUser(null);
        setUserData(null);
        setUserApplications(null);
        toast.success("Successfully logged out");
      } catch (error) {
        toast.error(error.message);
      }
    };

    // Recruiter jobs from Firestore (GET /api/jobs)
    const fetchJobs = async () => {
      if (!ensureBackendUrl()) return;
      try {
        const { data } = await axios.get(backendUrl + '/api/jobs');
        if (data.success) {
          setJobs(data.jobs);
        } else {
          toast.error(data.message);
        }
      } catch (error) {
        if (error.code === "ERR_NETWORK" || error.message === "Network Error") {
          toast.error("Cannot reach the API. Start the server: cd server && npm run server");
        } else {
          toast.error(error.message);
        }
      }
    };

    // Real-time Firestore listener for jobs
    const setupJobsListener = () => {
      if (!db) {
        console.warn("Firestore not initialized, falling back to REST API");
        return null;
      }
      
      try {
        const jobsRef = collection(db, "jobs");
        // Single-field filter only — sort client-side to avoid requiring a composite index
        const q = query(jobsRef, where("visible", "==", true));
        
        const unsubscribe = onSnapshot(q, (snapshot) => {
          const jobsList = [];
          snapshot.forEach((doc) => {
            jobsList.push({ _id: doc.id, id: doc.id, ...doc.data() });
          });
          jobsList.sort((a, b) => (Number(b.date) || 0) - (Number(a.date) || 0));
          setJobs(jobsList);
        }, (error) => {
          console.error("Firestore listener error:", error);
          toast.error("Real-time updates unavailable, using REST API");
          fetchJobs(); // Fallback to REST API
        });
        
        return unsubscribe;
      } catch (error) {
        console.error("Failed to setup Firestore listener:", error);
        fetchJobs(); // Fallback to REST API
        return null;
      }
    };

    // Function to fetch Company Data
    const fetchCompanyData = async () => {
        if (!ensureBackendUrl()) return;
        try {
            const headers = await getRecruiterAuthHeaders();
            const response = await axios.get(backendUrl + '/api/company/company', { headers });
            const data = response.data;

            if (data.success) {
                setCompanyData(data.company);
            } else {
                if (response.status === 401 || response.status === 403) {
                  clearCompanySession();
                }
                toast.error(data.message);
            }
        } catch (error) {
            if (error.response?.status === 401 || error.response?.status === 403) {
              clearCompanySession();
            }
            toast.error(error.message);
        }
    };

    // Function to fetch User Data
    const fetchUserData = async (firebaseUser) => {
      if (!ensureBackendUrl() || !firebaseUser) return;
      try {
        const token = await firebaseUser.getIdToken();
        const { data } = await axios.get(backendUrl + "/api/users/user", {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (data.success) {
          setUserData(data.user);
        } else {
          toast.error(data.message);
        }
      } catch (error) {
        toast.error(error.message);
      }
    };

    // Function to fetch User's Applied data
    const fetchUserApplications = async (firebaseUser) => {
      if (!ensureBackendUrl() || !firebaseUser) return;
      try {
        const token = await firebaseUser.getIdToken();
        const { data } = await axios.get(backendUrl + "/api/users/applications", {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (data.success) {
          setUserApplications(data.applications);
        } else {
          toast.error(data.message);
        }
      } catch (error) {
        toast.error(error.message);
      }
    };

    // Listen to Firebase auth changes
    useEffect(() => {
      if (!isBackendConfigured) {
        toast.error("Missing VITE_BACKEND_URL in client/.env");
      }
      if (!auth) return;
      const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        if (firebaseUser) {
          setUser(firebaseUser);
          try {
            const tokenResult = await firebaseUser.getIdTokenResult();
            if (tokenResult.claims.role === "recruiter") {
              // Recruiter user - do not fetch candidate profile or applications
              return;
            }
          } catch (e) {
            console.error("Error checking user claims:", e);
          }
          fetchUserData(firebaseUser);
          fetchUserApplications(firebaseUser);
        } else {
          setUser(null);
          setUserData(null);
          setUserApplications(null);
        }
      });
      return () => unsubscribe();
    }, []);

    useEffect(() => {
      // Setup real-time listener for jobs
      const unsubscribe = setupJobsListener();
      
      // Load company token from localStorage
      const storedCompanyToken = localStorage.getItem('companyToken');
      if (storedCompanyToken) {
        setCompanyToken(storedCompanyToken);
      }
      
      // Cleanup listener on unmount
      return () => {
        if (unsubscribe) {
          unsubscribe();
        }
      };
    }, []);

    useEffect(() => {
      if (companyToken) {
        fetchCompanyData();
      }
    }, [companyToken]);

    useEffect(() => {
      if (companyData) {
        localStorage.setItem('companyData', JSON.stringify(companyData));
      }
    }, [companyData]);

    const sendChatMessage = async (message, history = [], resumeText = "", sessionId = null, chatMode = "default") => {
      try {
        if (!user) {
          return { success: false, reply: "Please sign in to use the AI Career Assistant." };
        }
        const token = await user.getIdToken();
        const { data } = await axios.post(
          backendUrl + "/api/chatbot/applicant/chat",
          { message, history, resumeText, sessionId, chatMode },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        return data;
      } catch (error) {
        const serverMsg = error.response?.data?.message || error.message || "Something went wrong.";
        return { success: false, reply: serverMsg };
      }
    };

    const parseResumeForChat = async (file) => {
      try {
        if (!user) return null;
        const token = await user.getIdToken();
        const formData = new FormData();
        formData.append("resume", file);
        const { data } = await axios.post(
          backendUrl + "/api/chatbot/applicant/parse-resume",
          formData,
          { headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" } }
        );
        return data;
      } catch (error) {
        toast.error("Could not parse resume: " + error.message);
        return null;
      }
    };

    const fetchChatSessions = async () => {
      try {
        if (!user) return [];
        const token = await user.getIdToken();
        const { data } = await axios.get(backendUrl + "/api/chatbot/applicant/sessions", {
          headers: { Authorization: `Bearer ${token}` },
        });
        return data.success ? data.sessions : [];
      } catch {
        return [];
      }
    };

    const fetchChatSession = async (sessionId) => {
      try {
        if (!user || !sessionId) return null;
        const token = await user.getIdToken();
        const { data } = await axios.get(
          backendUrl + `/api/chatbot/applicant/sessions/${sessionId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        return data.success ? data.session : null;
      } catch {
        return null;
      }
    };

    const fetchActivity = async (limit = 20) => {
      try {
        if (!user) return [];
        const token = await user.getIdToken();
        const { data } = await axios.get(backendUrl + `/api/activity?limit=${limit}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        return data.success ? data.activities : [];
      } catch {
        return [];
      }
    };

    const sendRecruiterChatMessage = async (message, history = [], sessionId = null) => {
      try {
        if (!companyToken && !auth?.currentUser) {
          return { success: false, reply: "Please sign in as a recruiter." };
        }
        const headers = await getRecruiterAuthHeaders();
        const { data } = await axios.post(
          backendUrl + "/api/chatbot/recruiter/chat",
          { message, history, sessionId },
          { headers }
        );
        return data;
      } catch (error) {
        return {
          success: false,
          reply: error.response?.data?.message || "HireBot is temporarily unavailable.",
        };
      }
    };

    const fetchRecruiterAnalytics = async () => {
      try {
        if (!companyToken) return null;
        const headers = await getRecruiterAuthHeaders();
        const { data } = await axios.get(backendUrl + "/api/company/analytics", { headers });
        return data.success ? data : null;
      } catch {
        return null;
      }
    };

    const fetchUserResumes = async () => {
      try {
        if (!user) return [];
        const token = await user.getIdToken();
        const { data } = await axios.get(backendUrl + "/api/resumes", {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (data.success) {
          return data.analyses;
        } else {
          toast.error(data.message);
          return [];
        }
      } catch (error) {
        toast.error(error.message);
        return [];
      }
    };

    const analyzeResume = async (formData) => {
      try {
        if (!user) {
          toast.error("Please login to analyze your resume");
          return null;
        }
        const token = await user.getIdToken();
        const { data } = await axios.post(backendUrl + "/api/resumes/analyze-resume", formData, {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        });
        if (data.success) {
          toast.success("Resume analyzed successfully!");
          return data.id;
        } else {
          toast.error(data.message);
          return null;
        }
      } catch (error) {
        toast.error(error.response?.data?.message || error.message);
        return null;
      }
    };

    const fetchResumeDetail = async (id) => {
      try {
        if (!user) return null;
        const token = await user.getIdToken();
        const { data } = await axios.get(backendUrl + `/api/resumes/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (data.success) {
          return data.analysis;
        } else {
          toast.error(data.message);
          return null;
        }
      } catch (error) {
        toast.error(error.message);
        return null;
      }
    };

    const [isScraping, setIsScraping] = useState(false);

    const scrapeAndFetchJobs = async (title = "", location = "") => {
      if (!ensureBackendUrl()) return;
      setIsScraping(true);
      try {
        toast.info("Searching & scraping matching jobs from the web...");
        const { data } = await axios.post(backendUrl + '/api/jobs/scrape', { title, location });
        if (data.success) {
          if (data.newJobs > 0) {
            toast.success(`Found and synced ${data.newJobs} new jobs!`);
          } else {
            toast.info("Search complete. Showing all matching jobs.");
          }
        } else {
          toast.error(data.message || "Scraper completed with no updates.");
        }
      } catch (error) {
        console.error("Scraper API Error:", error.message);
        toast.error("Could not run on-demand scraper: " + error.message);
      } finally {
        setIsScraping(false);
        // Real-time listener will automatically update the jobs list
      }
    };

    const value = {
        user,
        searchFilter, setSearchFilter,
        setIsSearched, isSearched,
        jobs, setJobs,
        fetchJobs,
        setShowRecruiterLogin, showRecruiterLogin,
        companyToken, setCompanyToken,
        companyData, setCompanyData,
        clearCompanySession,
        getRecruiterAuthHeaders,
        backendUrl,
        userData, setUserData,
        userApplications, setUserApplications,
        fetchUserData,
        fetchUserApplications,
        loginWithGoogle,
        handleLogout,
        analyzeResume,
        fetchUserResumes,
        fetchResumeDetail,
        sendChatMessage,
        parseResumeForChat,
        fetchChatSessions,
        fetchChatSession,
        fetchActivity,
        sendRecruiterChatMessage,
        fetchRecruiterAnalytics,
        scrapeAndFetchJobs,
        isScraping
    };

    return (
        <AppContext.Provider value={value}>
            {props.children}
        </AppContext.Provider>
    );
};