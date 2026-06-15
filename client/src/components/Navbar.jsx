import React, { useContext, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AppContext } from "../context/AppContext";
import { Zap, Briefcase, LogOut, ChevronDown, User as UserIcon, MessageCircle, Sparkles } from "lucide-react";

const Navbar = () => {
  const navigate = useNavigate();
  const { user, handleLogout, loginWithGoogle, setShowRecruiterLogin } = useContext(AppContext);
  const [scrolled, setScrolled] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Handle scroll event
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 30) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <div className="h-2"></div>
      
      <div className={`${scrolled ? "fixed animate-slideDown" : "relative"} top-0 left-0 right-0 z-20 w-full transition-all duration-300`}>
        <nav className={`transition-all duration-500 ${
          scrolled 
            ? "mx-4 my-2 max-w-7xl md:mx-auto bg-white/90 backdrop-blur-md rounded-full shadow-lg border border-white/20 py-3 px-8" 
            : "max-w-7xl mx-auto rounded-full bg-white/80 backdrop-blur-sm border border-gray-100/50 py-4 px-8 mt-2"
        } flex justify-between items-center`}>
          
          {/* Brand Logo - joblet.ai */}
          <div 
            onClick={() => navigate("/")} 
            className="flex items-center gap-1 cursor-pointer group"
          >
            <div className="bg-brand-navy p-1.5 rounded-full flex items-center justify-center">
              <span className="text-white font-extrabold text-sm px-1.5 py-0.5 rounded-full bg-brand-orange">j</span>
            </div>
            <span className="text-2xl font-extrabold text-brand-navy tracking-tight">
              joblet<span className="text-brand-orange">.ai</span>
            </span>
          </div>

          {/* Navigation Links */}
          <div className="hidden lg:flex items-center gap-8">
            <a 
              href="#job-list" 
              className="text-brand-navy font-semibold hover:text-brand-orange transition-colors duration-200 text-sm"
              onClick={(e) => {
                if (window.location.pathname !== "/") {
                  e.preventDefault();
                  navigate("/");
                  setTimeout(() => {
                    document.getElementById("job-list")?.scrollIntoView({ behavior: "smooth" });
                  }, 200);
                }
              }}
            >
              Find Jobs
            </a>
            <button 
              onClick={() => setShowRecruiterLogin(true)}
              className="text-brand-navy font-semibold hover:text-brand-orange transition-colors duration-200 text-sm"
            >
              For Employers
            </button>
            <Link 
              to="/app/chat"
              className="text-brand-navy font-semibold hover:text-brand-orange transition-colors duration-200 text-sm flex items-center gap-1"
            >
              AI Suite
            </Link>
            <a 
              href="#advertise" 
              className="text-brand-navy font-semibold hover:text-brand-orange transition-colors duration-200 text-sm"
            >
              Ads
            </a>
          </div>

          {/* User Auth Section */}
          <div className="flex items-center gap-4">
            {user ? (
              <>
                <Link
                  to="/app/chat"
                  className="flex items-center gap-2 text-white bg-brand-navy hover:bg-brand-blue transition-all duration-200 px-5 py-2.5 rounded-full font-semibold text-sm shadow-md"
                >
                  <MessageCircle size={16} />
                  <span>Open App</span>
                </Link>
                
                {/* Profile Dropdown */}
                <div className="relative">
                  <button 
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex items-center gap-2 focus:outline-none hover:opacity-80 transition-opacity"
                  >
                    <img 
                      src={user.photoURL || "https://via.placeholder.com/150"} 
                      alt="User Avatar"
                      className="h-9 w-9 border-2 border-brand-orange/20 shadow-sm rounded-full object-cover"
                    />
                    <span className="hidden md:block text-sm font-semibold text-brand-navy">
                      {user.displayName || "User"}
                    </span>
                    <ChevronDown size={16} className="text-gray-500" />
                  </button>
 
                  {dropdownOpen && (
                    <div className="absolute right-0 mt-2 w-52 bg-white border border-gray-100 rounded-2xl shadow-xl z-30 py-2">
                      <Link 
                        to="/resume-analyzer" 
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-brand-navy hover:bg-brand-cream w-full text-left transition-colors"
                      >
                        <Zap size={16} className="text-brand-orange" />
                        Resume Analyzer
                      </Link>
                      <Link 
                        to="/app/chat"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-brand-navy hover:bg-brand-cream w-full text-left transition-colors"
                      >
                        <MessageCircle size={16} className="text-brand-orange" />
                        AI Career Assistant
                      </Link>
                      <Link 
                        to="/applications" 
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-brand-navy hover:bg-brand-cream w-full text-left transition-colors"
                      >
                        <Briefcase size={16} />
                        My Jobs
                      </Link>
                      <div className="border-t border-gray-100 my-1"></div>
                      <button 
                        onClick={() => {
                          setDropdownOpen(false);
                          handleLogout();
                        }}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 w-full text-left transition-colors"
                      >
                        <LogOut size={16} />
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <button
                  onClick={() => setShowRecruiterLogin(true)}
                  className="bg-[#F1F3F6] hover:bg-[#E5E8EC] text-brand-navy font-bold px-5 py-2 rounded-full transition-all duration-200 text-sm"
                >
                  Sign In
                </button>
                <button
                  onClick={() => setShowRecruiterLogin(true)}
                  className="bg-brand-orange hover:bg-brand-orange/90 text-white font-bold px-5 py-2 rounded-full transition-all duration-200 text-sm flex items-center gap-1.5 shadow-md shadow-brand-orange/10 hover:translate-y-[-1px]"
                >
                  <span>Get Started Free</span>
                  <Sparkles size={14} className="fill-white/20 text-white" />
                </button>
              </>
            )}
          </div>
        </nav>
      </div>
    </>
  );
};

export default Navbar;