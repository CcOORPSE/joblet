import React, { useContext, useRef, useState } from "react";
import { AppContext } from "../context/AppContext";
import { motion } from "framer-motion";
import { FiSearch, FiMapPin, FiArrowRight } from "react-icons/fi";
import { Star, Phone, PhoneCall, Zap } from "lucide-react";

const Hero = () => {
  const { setSearchFilter, setIsSearched, scrapeAndFetchJobs, isScraping } = useContext(AppContext);
  const titleRef = useRef(null);
  const locationRef = useRef(null);

  const onSearch = (e) => {
    e.preventDefault();
    const title = titleRef.current.value.trim();
    const location = locationRef.current.value.trim();
    setSearchFilter({ title, location });
    setIsSearched(true);
    if (scrapeAndFetchJobs) {
      scrapeAndFetchJobs(title, location);
    }
    document.getElementById("job-list")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="grid-bg relative pt-12 pb-24 overflow-hidden px-4 md:px-8">
      {/* Background radial glowing effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-brand-orange/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto text-center relative z-10">
        {/* Top Mini Badge */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-1.5 bg-[#101E3C] text-white px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide shadow-sm mb-6"
        >
          <span className="text-[#FFBD3E]">⚡</span> AI Powered Job Matching
        </motion.div>

        {/* Big Heading */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.6 }}
          className="text-4xl md:text-5xl lg:text-6xl font-black text-brand-navy leading-tight tracking-tight mb-4"
        >
          Find the job that actually <span className="custom-underline text-brand-navy">fits you.</span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="text-gray-500 font-semibold text-base md:text-lg mb-10 tracking-wide"
        >
          Connecting Talent With Opportunity Across The Globe
        </motion.p>

        {/* Advanced Double Search Pill Bar */}
        <motion.form
          onSubmit={onSearch}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, type: "spring", stiffness: 100 }}
          className="max-w-4xl mx-auto mb-10 bg-white shadow-xl shadow-brand-navy/5 rounded-full p-2 border border-gray-100 flex flex-col md:flex-row items-center gap-2"
        >
          <div className="flex-1 flex items-center px-4 w-full border-b md:border-b-0 md:border-r border-gray-100 py-3">
            <FiSearch className="text-gray-400 text-xl mr-3 flex-shrink-0" />
            <input
              type="text"
              ref={titleRef}
              placeholder="Search Jobs, Companies or Categories..."
              className="w-full text-sm font-semibold outline-none text-brand-navy placeholder-gray-400 bg-transparent"
            />
          </div>
          <div className="flex-1 flex items-center px-4 w-full py-3">
            <FiMapPin className="text-gray-400 text-xl mr-3 flex-shrink-0" />
            <input
              type="text"
              ref={locationRef}
              placeholder="Search Location..."
              className="w-full text-sm font-semibold outline-none text-brand-navy placeholder-gray-400 bg-transparent"
            />
          </div>
          <button
            type="submit"
            disabled={isScraping}
            className="w-full md:w-auto bg-brand-orange hover:bg-brand-orange/95 text-white font-bold px-8 py-3.5 rounded-full text-sm flex items-center justify-center gap-2 shadow-md shadow-brand-orange/20 transition-all duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            <span>{isScraping ? "Searching..." : "Search"}</span>
            {isScraping ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <FiSearch className="text-base" />
            )}
          </button>
        </motion.form>

        {/* Twin CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="flex flex-wrap justify-center gap-6 mb-16"
        >
          <a
            href="#job-list"
            className="bg-[#FFEFEA] hover:bg-[#FFDFD6] text-brand-orange font-bold px-6 py-3 rounded-full flex items-center justify-between gap-8 border border-brand-orange/10 group transition-all duration-200 w-full max-w-[280px]"
          >
            <div className="text-left">
              <span className="block text-sm">Find a Job</span>
              <span className="block text-[10px] font-medium text-brand-navy/60">Browse thousands of Opportunities</span>
            </div>
            <div className="bg-brand-orange text-white p-2 rounded-full group-hover:translate-x-1 transition-transform">
              <FiArrowRight size={14} />
            </div>
          </a>

          <button
            onClick={() => {
              document.getElementById("job-list")?.scrollIntoView({ behavior: "smooth" });
            }}
            className="bg-[#FFEFEA] hover:bg-[#FFDFD6] text-brand-orange font-bold px-6 py-3 rounded-full flex items-center justify-between gap-8 border border-brand-orange/10 group transition-all duration-200 w-full max-w-[280px]"
          >
            <div className="text-left">
              <span className="block text-sm">Post a Job</span>
              <span className="block text-[10px] font-medium text-brand-navy/60">Reach the Best Talents Fast</span>
            </div>
            <div className="bg-brand-orange text-white p-2 rounded-full group-hover:translate-x-1 transition-transform">
              <FiArrowRight size={14} />
            </div>
          </button>
        </motion.div>

        {/* Phone Mockup and dynamic Testimonials container */}
        <div className="relative max-w-5xl mx-auto mt-12 flex justify-center items-center py-16 px-4">
          
          {/* Testimonial 1 - Kavita Pal (Left) */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            className="absolute left-0 top-1/4 hidden lg:block z-20 w-64 bg-white/95 backdrop-blur-sm p-5 rounded-2xl shadow-xl border border-gray-100/80 text-left"
          >
            {/* Gold Stars */}
            <div className="flex gap-0.5 text-amber-400 mb-2.5">
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={14} className="fill-amber-400 text-amber-400" />
              ))}
            </div>
            <p className="text-xs text-brand-navy/80 font-medium mb-3.5 leading-relaxed">
              "Finally a job platform that <strong className="text-brand-orange font-bold">doesn't waste my time</strong>. The AI suggestions actually <strong className="text-brand-navy font-bold">understood</strong> what I wanted."
            </p>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-emerald-50 border border-emerald-100 overflow-hidden flex items-center justify-center font-bold text-xs text-emerald-700 shadow-sm">
                KP
              </div>
              <div>
                <h4 className="text-xs font-bold text-brand-navy">Kavita Pal</h4>
                <p className="text-[10px] text-gray-400">UX Researcher, Mumbai</p>
              </div>
            </div>
            <div className="absolute -bottom-2 right-12 w-4 h-4 bg-white border-r border-b border-gray-100/80 rotate-45" />
          </motion.div>

          {/* Testimonial 2 - Rahul Mehta (Right) */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.7, duration: 0.8 }}
            className="absolute right-0 bottom-1/4 hidden lg:block z-20 w-64 bg-white/95 backdrop-blur-sm p-5 rounded-2xl shadow-xl border border-gray-100/80 text-left"
          >
            {/* Gold Stars */}
            <div className="flex gap-0.5 text-amber-400 mb-2.5">
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={14} className="fill-amber-400 text-amber-400" />
              ))}
            </div>
            <p className="text-xs text-brand-navy/80 font-medium mb-3.5 leading-relaxed">
              "Found my current role in <strong className="text-brand-orange font-bold">4 days</strong>. The match score was spot on! I <strong className="text-brand-navy font-bold">only applied to 3 jobs</strong> and got 2 interviews."
            </p>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-brand-orange/10 border border-brand-orange/20 overflow-hidden flex items-center justify-center font-bold text-xs text-brand-orange shadow-sm">
                RM
              </div>
              <div>
                <h4 className="text-xs font-bold text-brand-navy">Rahul Mehta</h4>
                <p className="text-[10px] text-gray-400">Product Designer, Bangalore</p>
              </div>
            </div>
            <div className="absolute -top-2 left-12 w-4 h-4 bg-white border-l border-t border-gray-100/80 rotate-45" />
          </motion.div>

          {/* Core Illustration: Smartphone with Dynamic Incoming Call */}
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.5, duration: 0.8, type: "spring" }}
            className="relative z-10 mx-auto"
          >
            {/* Glass Background Shelf Glow */}
            <div className="absolute inset-0 bg-gradient-to-t from-brand-orange/15 to-transparent blur-3xl -bottom-10 pointer-events-none rounded-full" />
            
            {/* CSS Phone Body (Premium Vertical Smartphone) */}
            <div className="relative mx-auto w-[280px] h-[520px] bg-slate-950 rounded-[44px] p-3 shadow-2xl border-[6px] border-slate-800 overflow-hidden transition-all duration-500 flex flex-col justify-between">
              
              {/* Dynamic Island */}
              <div className="absolute top-4 left-1/2 -translate-x-1/2 w-28 h-5 bg-black rounded-full z-30 flex items-center justify-center">
                <div className="w-2.5 h-2.5 rounded-full bg-slate-900 border border-slate-800 ml-auto mr-3" />
              </div>

              {/* Phone Content Screen */}
              <div className="w-full h-full bg-[#FAF9F6] rounded-[34px] overflow-hidden flex flex-col relative border border-slate-900/5 select-none text-left">
                
                {/* Status Bar */}
                <div className="flex justify-between items-center text-[10px] text-brand-navy/60 font-semibold pt-4 px-5 pb-3">
                  <span>9:41</span>
                  <div className="flex gap-1.5 items-center">
                    <span>📶</span>
                    <span>LTE</span>
                    <span>🔋</span>
                  </div>
                </div>

                {/* App Navigation Header */}
                <div className="px-4 pb-3 flex justify-between items-center border-b border-gray-100">
                  <div className="flex items-center gap-1">
                    <span className="text-white font-extrabold text-[10px] w-4.5 h-4.5 rounded-full bg-brand-orange flex items-center justify-center">j</span>
                    <span className="text-xs font-black text-brand-navy tracking-tight">joblet<span className="text-brand-orange">.ai</span></span>
                  </div>
                  <div className="w-5 h-5 rounded-full bg-brand-navy/5 flex items-center justify-center text-[10px]">🔔</div>
                </div>

                {/* Simulated App Content Screen */}
                <div className="p-3 flex-1 flex flex-col gap-3 bg-gray-50/50 overflow-y-auto">
                  {/* Greeting */}
                  <div>
                    <h5 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Hello, Kavita</h5>
                    <h4 className="text-xs font-black text-brand-navy">AI Jobs Matches For You</h4>
                  </div>

                  {/* Matching Job Item 1 */}
                  <div className="p-2.5 bg-white border border-gray-100 rounded-xl shadow-sm flex flex-col gap-1.5 relative">
                    <span className="absolute top-2.5 right-2.5 bg-emerald-500 text-white text-[8px] px-1.5 py-0.5 rounded-full font-extrabold">98% Match</span>
                    <div className="flex gap-2 items-center">
                      <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center font-bold text-xs text-brand-orange">S</div>
                      <div>
                        <h6 className="text-[10px] font-bold text-brand-navy leading-tight">UX Researcher</h6>
                        <span className="text-[8px] text-gray-400">Scale AI • Mumbai</span>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <span className="text-[7px] bg-gray-100 px-1.5 py-0.5 rounded text-gray-500">Full Time</span>
                      <span className="text-[7px] bg-gray-100 px-1.5 py-0.5 rounded text-gray-500">$120k-$140k</span>
                    </div>
                  </div>

                  {/* Matching Job Item 2 */}
                  <div className="p-2.5 bg-white border border-gray-100 rounded-xl shadow-sm flex flex-col gap-1.5 relative">
                    <span className="absolute top-2.5 right-2.5 bg-emerald-500 text-white text-[8px] px-1.5 py-0.5 rounded-full font-extrabold">92% Match</span>
                    <div className="flex gap-2 items-center">
                      <div className="w-8 h-8 rounded-lg bg-brand-orange/10 flex items-center justify-center font-bold text-xs text-brand-orange">U</div>
                      <div>
                        <h6 className="text-[10px] font-bold text-brand-navy leading-tight">Product Designer</h6>
                        <span className="text-[8px] text-gray-400">Uber • Bengaluru</span>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <span className="text-[7px] bg-gray-100 px-1.5 py-0.5 rounded text-gray-500">Remote</span>
                      <span className="text-[7px] bg-gray-100 px-1.5 py-0.5 rounded text-gray-500">Negotiable</span>
                    </div>
                  </div>

                  {/* Matching Job Item 3 */}
                  <div className="p-2.5 bg-white border border-gray-100 rounded-xl shadow-sm flex flex-col gap-1.5 relative opacity-70">
                    <span className="absolute top-2.5 right-2.5 bg-emerald-500 text-white text-[8px] px-1.5 py-0.5 rounded-full font-extrabold">87% Match</span>
                    <div className="flex gap-2 items-center">
                      <div className="w-8 h-8 rounded-lg bg-brand-orange/10 flex items-center justify-center font-bold text-xs text-brand-orange">W</div>
                      <div>
                        <h6 className="text-[10px] font-bold text-brand-navy leading-tight">UX Designer</h6>
                        <span className="text-[8px] text-gray-400">Wells Fargo • Hyderabad</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom App Tab Bar */}
                <div className="bg-white border-t border-gray-100 py-2.5 px-4 flex justify-between text-[9px] font-bold text-gray-400">
                  <span className="text-brand-orange">🔍 Search</span>
                  <span>💼 Jobs</span>
                  <span>💬 AI Chat</span>
                  <span>👤 Profile</span>
                </div>
              </div>
            </div>

            {/* Rising Call Banner: "Dream Job" Notification Card */}
            <motion.div
              animate={{
                y: [0, -8, 0],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="absolute -top-6 left-1/2 -translate-x-1/2 w-[300px] bg-black/95 backdrop-blur-md text-white rounded-2xl p-4 shadow-2xl border border-white/10 z-30"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-brand-orange/20 flex items-center justify-center border border-brand-orange/30">
                    <Zap className="text-brand-orange" size={18} />
                  </div>
                  <div className="text-left">
                    <h3 className="text-xs font-black tracking-wide text-white">Dream Job Call</h3>
                    <p className="text-[9px] text-gray-400 font-semibold">Matched: Scale AI</p>
                  </div>
                </div>

                {/* Action Buttons (Decline / Accept) */}
                <div className="flex gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center cursor-pointer transition shadow-md shadow-red-600/10">
                    <Phone className="text-white fill-white rotate-[135deg]" size={12} />
                  </div>
                  <div className="w-7 h-7 rounded-full bg-emerald-500 hover:bg-emerald-600 flex items-center justify-center cursor-pointer transition shadow-md shadow-emerald-500/10 animate-pulse">
                    <PhoneCall className="text-white fill-white" size={12} />
                  </div>
                </div>
              </div>
            </motion.div>

          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Hero;
