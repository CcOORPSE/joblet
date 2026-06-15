import React, { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { FiBookmark, FiMapPin, FiBriefcase, FiDollarSign, FiClock } from "react-icons/fi";
import { AppContext } from "../context/AppContext";

const savedJobsKey = (userId) => `savedJobs_${userId || "guest"}`;

const JobCard = ({ job }) => {
  const navigate = useNavigate();
  const { user } = useContext(AppContext);
  const jobId = job._id || job.id;
  const [isSaved, setIsSaved] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    if (!jobId) return;
    try {
      const saved = JSON.parse(localStorage.getItem(savedJobsKey(user?.uid)) || "[]");
      setIsSaved(saved.includes(jobId));
    } catch {
      setIsSaved(false);
    }
  }, [jobId, user?.uid]);

  const toggleSave = (e) => {
    e.stopPropagation();
    if (!jobId) return;
    try {
      const key = savedJobsKey(user?.uid);
      const saved = JSON.parse(localStorage.getItem(key) || "[]");
      const next = isSaved ? saved.filter((id) => id !== jobId) : [...saved, jobId];
      localStorage.setItem(key, JSON.stringify(next));
      setIsSaved(!isSaved);
    } catch {
      /* ignore storage errors */
    }
  };

  const stripHtmlTags = (html) => {
    return html ? html.replace(/<[^>]*>?/gm, '') : 'No description provided';
  };

  const getTimePassed = (date) => {
    if (!date) return "Recently posted";
    const diff = Date.now() - new Date(date);
    const mins = Math.floor(diff / 60000);
    const hrs = Math.floor(mins / 60);
    const days = Math.floor(hrs / 24);
    if (days > 0) return `${days}d ago`;
    if (hrs > 0) return `${hrs}h ago`;
    if (mins > 0) return `${mins}m ago`;
    return "Just now";
  };

  const formatSalary = (salary) => {
    if (!salary) return "Salary negotiable";
    if (typeof salary === "string") return salary;
    if (typeof salary === "number") return `$${salary.toLocaleString()}/yr`;
    if (salary.min && salary.max) return `$${salary.min} - $${salary.max}`;
    return `$${salary.amount}`;
  };

  // Safe fallback resolver for company images and names
  const companyLogo = job.companyIdDetails?.image || job.companyId?.image || "https://via.placeholder.com/100?text=Company";
  const companyName = job.companyIdDetails?.name || job.companyId?.name || "Premium Recruiter";

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      viewport={{ once: true }}
    >
      <motion.div
        whileHover={{ scale: 1.02 }}
        transition={{ type: "spring", stiffness: 300 }}
        className="relative group p-1 rounded-2xl bg-gradient-to-tr from-white to-[#f9f9f9] border border-gray-200 hover:border-brand-orange/40 shadow-xl hover:shadow-2xl backdrop-blur-md transition-all duration-300"
      >
        <div className="bg-white rounded-2xl overflow-hidden text-left">
          
          {/* New Scraped Badge Ribbon */}
          {job.isScraped ? (
            <span className="absolute top-4 right-4 bg-brand-orange text-white text-[9px] px-2 py-0.5 rounded-full font-bold shadow-md z-10">
              🌐 LIVE
            </span>
          ) : (
            <span className="absolute top-4 right-4 bg-brand-navy text-white text-[9px] px-2 py-0.5 rounded-full font-bold shadow-md z-10">
              ✓ VERIFIED
            </span>
          )}

          {/* Header */}
          <div className="p-6 pb-3 flex justify-between items-start">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl border border-gray-200 overflow-hidden bg-white shadow-sm flex items-center justify-center">
                <img
                  src={companyLogo}
                  alt="company logo"
                  className="w-full h-full object-contain p-1"
                />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-brand-navy line-clamp-1">{job.title || "Job Title"}</h3>
                <p className="text-xs font-semibold text-gray-400 line-clamp-1">{companyName}</p>
              </div>
            </div>
            <button
              onClick={toggleSave}
              className={`p-2 rounded-full text-xl ${
                isSaved ? "text-brand-orange fill-brand-orange" : "text-gray-400 hover:text-brand-orange"
              } transition`}
              title={isSaved ? "Saved" : "Save job"}
            >
              <FiBookmark />
            </button>
          </div>

          {/* Tags */}
          <div className="px-6 pb-4 flex flex-wrap gap-2 text-[10px] font-bold">
            <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-[#FFEFEA] text-brand-orange">
              <FiMapPin size={11} /> {job.location || "Remote"}
            </span>
            <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-orange-50 text-orange-600">
              <FiBriefcase size={11} /> {job.level || "Intermediate"}
            </span>
            <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-50 text-emerald-600">
              <FiDollarSign size={11} /> {formatSalary(job.salary)}
            </span>
            <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-gray-100 text-gray-500">
              <FiClock size={11} /> {getTimePassed(job.date || job.postedAt)}
            </span>
          </div>

          {/* Description preview */}
          <div className="px-6 pb-4">
            <p className={`text-xs text-gray-500 leading-relaxed ${isExpanded ? "" : "line-clamp-2"}`}>
              {stripHtmlTags(job.description)}
            </p>
            {(job.description || "").length > 120 && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-xs text-brand-orange font-semibold mt-1 hover:underline"
              >
                {isExpanded ? "Show less" : "Read more"}
              </button>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-100 flex justify-between items-center bg-gray-50/50">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
              {job.category || "General"}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => navigate(`/apply-job/${jobId}`)}
                className="px-4 py-2 text-xs font-bold text-brand-orange bg-white border border-brand-orange/30 rounded-full hover:bg-brand-orange hover:text-white transition-all duration-200"
              >
                View Details
              </button>
              <button
                onClick={() => navigate(`/apply-job/${jobId}`)}
                className="px-4 py-2 text-xs font-bold text-white bg-brand-orange rounded-full hover:bg-brand-orange/90 transition-all duration-200 shadow-sm"
              >
                Apply Now
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default JobCard;
