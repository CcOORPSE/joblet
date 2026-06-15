// Recruiter dashboard shell — unified Joblet theme
import React, { useContext, useEffect, useState } from "react";
import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import { AppContext } from "../context/AppContext";
import { signOut } from "firebase/auth";
import { auth } from "../config/firebase";
import { motion, AnimatePresence } from "framer-motion";
import { LayoutDashboard, PlusSquare, Inbox, Sparkles, Calendar } from "lucide-react";

const Dashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [activeTab, setActiveTab] = useState("");
  const { companyData, setCompanyData, setCompanyToken, companyToken, setShowRecruiterLogin, clearCompanySession } =
    useContext(AppContext);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const path = location.pathname.split("/").pop();
    setActiveTab(path);
  }, [location]);

  useEffect(() => {
    if (!companyToken) {
      setShowRecruiterLogin(true);
      navigate("/");
    } else if (companyData && location.pathname === "/dashboard") {
      navigate("/dashboard/manage-job");
    }
  }, [companyData, companyToken, location.pathname]);

  useEffect(() => {
    const handleResize = () => setIsSidebarOpen(window.innerWidth >= 1024);
    window.addEventListener("resize", handleResize);
    handleResize();
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const formatTime = (date) =>
    date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });

  const getGreeting = () => {
    const hour = currentTime.getHours();
    return hour < 12 ? "Good Morning" : hour < 18 ? "Good Afternoon" : "Good Evening";
  };

  const logout = async () => {
    clearCompanySession();
    try {
      if (auth) await signOut(auth);
    } catch {
      /* session may already be cleared */
    }
    navigate("/");
  };

  const navItems = [
    { path: "manage-job", label: "Dashboard", icon: <LayoutDashboard size={20} /> },
    { path: "add-job", label: "Add Job", icon: <PlusSquare size={20} /> },
    { path: "view-applications", label: "Applications", icon: <Inbox size={20} /> },
    { path: "assign-interview", label: "Assign Interview", icon: <Calendar size={20} /> },
    { path: "ai", label: "AI Assistant", icon: <Sparkles size={20} /> },
  ];

  return (
    <div className="flex h-screen jl-page">
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.aside
            initial={{ x: -250, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -250, opacity: 0 }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
            className="fixed lg:static left-0 top-0 w-72 h-full z-50 flex flex-col justify-between border-r jl-divider"
            style={{ background: "var(--jl-surface)" }}
          >
            <div className="p-6">
              <div onClick={() => navigate("/")} className="flex items-center gap-1 cursor-pointer group mb-8">
                <div className="bg-brand-navy p-1.5 rounded-full flex items-center justify-center">
                  <span className="text-white font-extrabold text-sm px-1.5 py-0.5 rounded-full bg-brand-orange">j</span>
                </div>
                <span className="text-2xl font-extrabold text-brand-navy tracking-tight">
                  joblet<span className="text-brand-orange">.ai</span>
                </span>
              </div>
              <div className="space-y-2">
                {navItems.map(({ path, label, icon }, i) => (
                  <NavLink
                    key={i}
                    to={`/dashboard/${path}`}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-sm font-medium hover:scale-[1.01] ${
                        isActive
                          ? "text-white shadow-sm bg-jl-accent"
                          : "text-jl-text-secondary hover:bg-jl-muted hover:text-jl-text"
                      }`
                    }
                  >
                    {icon}
                    <span>{label}</span>
                  </NavLink>
                ))}
              </div>
            </div>
            <div className="p-5 border-t jl-divider" style={{ background: "var(--jl-surface-muted)" }}>
              <div className="flex items-center gap-4">
                <div
                  className="w-11 h-11 rounded-full flex items-center justify-center text-white text-lg font-bold shadow-sm"
                  style={{ background: "var(--jl-accent)" }}
                >
                  {companyData?.name?.[0] || "C"}
                </div>
                <div>
                  <p className="text-sm font-semibold text-jl-text">{companyData?.name}</p>
                  <p className="text-xs text-jl-text-secondary">Recruiter Mode</p>
                </div>
              </div>
              <button
                onClick={logout}
                className="mt-4 text-sm w-full text-left hover:underline"
                style={{ color: "var(--jl-danger)" }}
              >
                Sign out
              </button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      <div className="flex-1 flex flex-col overflow-hidden">
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="px-8 py-5 flex justify-between items-center border-b jl-divider"
          style={{ background: "var(--jl-surface)" }}
        >
          <div>
            <h1 className="text-2xl font-bold text-jl-text">
              {activeTab.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()) || "Dashboard"}
            </h1>
            <p className="text-sm text-jl-text-secondary mt-1">
              {currentTime.toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-jl-text-secondary font-semibold">{getGreeting()},</p>
            <p className="text-xs text-jl-text-muted">{companyData?.name}</p>
            <p className="text-sm text-jl-text-muted">{formatTime(currentTime)}</p>
          </div>
        </motion.header>

        <main className="flex-1 overflow-y-auto px-8 py-6" style={{ background: "var(--jl-bg)" }}>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="jl-card-elevated p-6 min-h-[500px]"
          >
            <Outlet />
          </motion.div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
