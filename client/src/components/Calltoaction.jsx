import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Briefcase, BookOpen, Megaphone, Send, HelpCircle, 
  Search, FilePlus2, Lightbulb, Compass, Clock, Check
} from "lucide-react";

const CallToAction = () => {
  const [suggestion, setSuggestion] = useState("");
  const [submitted, setSubmitted] = useState(false);

  // Timers states
  const [timer1, setTimer1] = useState({ d: 27, h: 0, m: 0, s: 0 });
  const [timer2, setTimer2] = useState({ d: 48, h: 0, m: 0, s: 0 });

  useEffect(() => {
    const interval = setInterval(() => {
      // Tick Timer 1
      setTimer1((prev) => {
        let { d, h, m, s } = prev;
        if (s > 0) s--;
        else {
          s = 59;
          if (m > 0) m--;
          else {
            m = 59;
            if (h > 0) h--;
            else {
              h = 23;
              if (d > 0) d--;
              else {
                d = 27; // Reset
              }
            }
          }
        }
        return { d, h, m, s };
      });

      // Tick Timer 2
      setTimer2((prev) => {
        let { d, h, m, s } = prev;
        if (s > 0) s--;
        else {
          s = 59;
          if (m > 0) m--;
          else {
            m = 59;
            if (h > 0) h--;
            else {
              h = 23;
              if (d > 0) d--;
              else {
                d = 48; // Reset
              }
            }
          }
        }
        return { d, h, m, s };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleSuggestionSubmit = (e) => {
    e.preventDefault();
    if (!suggestion.trim()) return;
    setSubmitted(true);
    setTimeout(() => {
      setSuggestion("");
      setSubmitted(false);
    }, 3000);
  };

  const formatNumber = (num) => String(num).padStart(2, "0");

  return (
    <section id="advertise" className="py-20 px-4 md:px-8 bg-transparent">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-16 flex flex-col items-center justify-center">
          <div className="flex items-center gap-2 text-brand-navy font-bold text-xs uppercase tracking-widest mb-3 bg-[#FFEFEA] px-3.5 py-1.5 rounded-full border border-brand-orange/10">
            <Briefcase size={12} className="text-brand-orange" />
            <span className="text-brand-orange">Our Services</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-black text-brand-navy tracking-tight">
            Supercharge Your Career Journey
          </h2>
          <p className="text-gray-400 font-semibold text-xs md:text-sm mt-2 max-w-lg">
            Explore advanced AI agents and robust toolsets built to accelerate matching.
          </p>
        </div>

        {/* Services 3x2 Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          
          {/* 1. Jobs Box */}
          <motion.div 
            whileHover={{ y: -4 }}
            className="bg-white rounded-[32px] p-8 border border-gray-100 shadow-xl shadow-brand-navy/5 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center gap-2 text-brand-orange font-bold text-sm mb-6">
                <div className="p-2 bg-[#FFEFEA] rounded-xl"><Briefcase size={16} /></div>
                <span>Jobs</span>
              </div>
              <div className="space-y-4">
                <a href="#job-list" className="flex items-start gap-4 p-3 hover:bg-brand-cream rounded-2xl transition duration-200 group">
                  <div className="p-2.5 bg-white border border-gray-100 rounded-xl text-brand-navy group-hover:text-brand-orange group-hover:border-brand-orange/20"><FilePlus2 size={18} /></div>
                  <div className="text-left">
                    <h4 className="text-xs font-black text-brand-navy">Post a Job</h4>
                    <p className="text-[10px] text-gray-400 font-medium mt-0.5">Source Talent Globally</p>
                  </div>
                </a>
                <a href="#job-list" className="flex items-start gap-4 p-3 hover:bg-brand-cream rounded-2xl transition duration-200 group">
                  <div className="p-2.5 bg-white border border-gray-100 rounded-xl text-brand-navy group-hover:text-brand-orange group-hover:border-brand-orange/20"><Search size={18} /></div>
                  <div className="text-left">
                    <h4 className="text-xs font-black text-brand-navy">Search Jobs</h4>
                    <p className="text-[10px] text-gray-400 font-medium mt-0.5">Search Jobs Globally</p>
                  </div>
                </a>
              </div>
            </div>
          </motion.div>

          {/* 2. Blogs Box */}
          <motion.div 
            whileHover={{ y: -4 }}
            className="bg-white rounded-[32px] p-8 border border-gray-100 shadow-xl shadow-brand-navy/5 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center gap-2 text-brand-orange font-bold text-sm mb-6">
                <div className="p-2 bg-[#FFEFEA] rounded-xl"><BookOpen size={16} /></div>
                <span>Blogs</span>
              </div>
              <div className="space-y-4">
                <Link to="/chatbot" className="flex items-start gap-4 p-3 hover:bg-brand-cream rounded-2xl transition duration-200 group">
                  <div className="p-2.5 bg-white border border-gray-100 rounded-xl text-brand-navy group-hover:text-brand-orange group-hover:border-brand-orange/20"><Lightbulb size={18} /></div>
                  <div className="text-left">
                    <h4 className="text-xs font-black text-brand-navy">Career Insights</h4>
                    <p className="text-[10px] text-gray-400 font-medium mt-0.5">Expert Advice</p>
                  </div>
                </Link>
                <Link to="/chatbot" className="flex items-start gap-4 p-3 hover:bg-brand-cream rounded-2xl transition duration-200 group">
                  <div className="p-2.5 bg-white border border-gray-100 rounded-xl text-brand-navy group-hover:text-brand-orange group-hover:border-brand-orange/20"><Compass size={18} /></div>
                  <div className="text-left">
                    <h4 className="text-xs font-black text-brand-navy">Browse All Blogs</h4>
                    <p className="text-[10px] text-gray-400 font-medium mt-0.5">Tips, Guides and Resources</p>
                  </div>
                </Link>
              </div>
            </div>
          </motion.div>

          {/* 3. Advertise AI Box */}
          <motion.div 
            whileHover={{ y: -4 }}
            className="bg-white rounded-[32px] p-8 border border-gray-100 shadow-xl shadow-brand-navy/5 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center gap-2 text-brand-orange font-bold text-sm mb-6">
                <div className="p-2 bg-[#FFEFEA] rounded-xl"><Megaphone size={16} /></div>
                <span>Advertise AI</span>
              </div>
              <div className="space-y-4">
                <div className="flex items-start gap-4 p-3">
                  <div className="p-2.5 bg-white border border-gray-100 rounded-xl text-brand-navy"><Lightbulb size={18} /></div>
                  <div className="text-left">
                    <h4 className="text-xs font-black text-brand-navy">Sponsored Listings</h4>
                    <p className="text-[10px] text-gray-400 font-medium mt-0.5">Reach the Right Candidates</p>
                  </div>
                </div>
              </div>
            </div>
            <button className="w-full mt-6 bg-brand-orange hover:bg-brand-orange/95 text-white font-bold py-3.5 rounded-full text-xs transition duration-200 shadow-md shadow-brand-orange/20">
              Advertise With AI
            </button>
          </motion.div>

          {/* 4. Apply AI Box with countdown */}
          <motion.div 
            whileHover={{ y: -4 }}
            className="bg-white rounded-[32px] p-8 border border-gray-100 shadow-xl shadow-brand-navy/5 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center gap-2 text-brand-orange font-bold text-sm mb-6">
                <div className="p-2 bg-[#FFEFEA] rounded-xl"><Briefcase size={16} /></div>
                <span>Apply AI</span>
              </div>
              <div className="text-left">
                <h4 className="text-sm font-black text-brand-navy mb-2 leading-snug">
                  Applying for a job just got 83% easier!
                </h4>
                <p className="text-[10px] text-gray-400 font-semibold mb-6">
                  The more you apply, the less you need to apply. Curious?
                </p>
              </div>
            </div>
            {/* Live Timer Grid */}
            <div className="flex items-center justify-center gap-3 bg-brand-cream border border-[#FFDFD6] py-3 rounded-2xl text-brand-navy font-black text-xs shadow-sm">
              <Clock size={14} className="text-brand-orange" />
              <div className="flex gap-2">
                <div><span>{formatNumber(timer1.d)}</span><span className="text-[8px] text-gray-400 font-bold ml-0.5">D</span></div>
                <div><span>{formatNumber(timer1.h)}</span><span className="text-[8px] text-gray-400 font-bold ml-0.5">H</span></div>
                <div><span>{formatNumber(timer1.m)}</span><span className="text-[8px] text-gray-400 font-bold ml-0.5">M</span></div>
                <div><span>{formatNumber(timer1.s)}</span><span className="text-[8px] text-gray-400 font-bold ml-0.5">S</span></div>
              </div>
            </div>
          </motion.div>

          {/* 5. Interview AI Box with countdown */}
          <motion.div 
            whileHover={{ y: -4 }}
            className="bg-white rounded-[32px] p-8 border border-gray-100 shadow-xl shadow-brand-navy/5 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center gap-2 text-brand-orange font-bold text-sm mb-6">
                <div className="p-2 bg-[#FFEFEA] rounded-xl"><Compass size={16} /></div>
                <span>Interview AI</span>
              </div>
              <div className="text-left">
                <h4 className="text-sm font-black text-brand-navy mb-2 leading-snug">
                  Give AI Interviews without any hassle!
                </h4>
                <p className="text-[10px] text-gray-400 font-semibold mb-6">
                  Just send your AI avatar & Voila! Curious?
                </p>
              </div>
            </div>
            {/* Live Timer Grid */}
            <div className="flex items-center justify-center gap-3 bg-brand-cream border border-[#FFDFD6] py-3 rounded-2xl text-brand-navy font-black text-xs shadow-sm">
              <Clock size={14} className="text-brand-orange" />
              <div className="flex gap-2">
                <div><span>{formatNumber(timer2.d)}</span><span className="text-[8px] text-gray-400 font-bold ml-0.5">D</span></div>
                <div><span>{formatNumber(timer2.h)}</span><span className="text-[8px] text-gray-400 font-bold ml-0.5">H</span></div>
                <div><span>{formatNumber(timer2.m)}</span><span className="text-[8px] text-gray-400 font-bold ml-0.5">M</span></div>
                <div><span>{formatNumber(timer2.s)}</span><span className="text-[8px] text-gray-400 font-bold ml-0.5">S</span></div>
              </div>
            </div>
          </motion.div>

          {/* 6. Suggestions Feedback Box */}
          <motion.div 
            whileHover={{ y: -4 }}
            className="bg-white rounded-[32px] p-8 border border-gray-100 shadow-xl shadow-brand-navy/5 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center gap-2 text-brand-orange font-bold text-sm mb-6">
                <div className="p-2 bg-[#FFEFEA] rounded-xl"><HelpCircle size={16} /></div>
                <span>Suggestions</span>
              </div>
              <div className="text-left">
                <h4 className="text-sm font-black text-brand-navy mb-2 leading-snug">
                  Let us know what feature you want!
                </h4>
                <p className="text-[10px] text-gray-400 font-semibold mb-6">
                  And we will name the feature after you!
                </p>
              </div>
            </div>

            <form onSubmit={handleSuggestionSubmit} className="relative mt-2">
              <input
                type="text"
                placeholder={submitted ? "Thanks for your feedback!" : "Type here"}
                value={suggestion}
                disabled={submitted}
                onChange={(e) => setSuggestion(e.target.value)}
                className={`w-full text-xs font-semibold pl-4 pr-12 py-3 rounded-full border outline-none transition duration-200 ${
                  submitted 
                    ? "bg-[#E6F4EA] border-[#34A853] text-[#137333] placeholder-[#137333]" 
                    : "bg-brand-cream border-gray-100 focus:border-brand-orange/40 text-brand-navy placeholder-gray-400"
                }`}
              />
              <button
                type="submit"
                disabled={submitted}
                className="absolute right-1 top-1 bg-brand-orange hover:bg-brand-orange/95 text-white p-2 rounded-full transition shadow-md shadow-brand-orange/10 flex items-center justify-center disabled:bg-[#34A853] disabled:shadow-none"
              >
                {submitted ? <Check size={12} /> : <Send size={12} className="translate-x-[0.5px] translate-y-[-0.5px]" />}
              </button>
            </form>
          </motion.div>

        </div>
      </div>
    </section>
  );
};

export default CallToAction;