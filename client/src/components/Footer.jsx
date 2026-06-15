import React from "react";
import { Link } from "react-router-dom";
import { Linkedin, Twitter } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-[#FAF9F6] border-t border-gray-200/50 py-16 px-4 md:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Main grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 mb-12">
          
          {/* Logo & description (5 cols) */}
          <div className="lg:col-span-5 text-left flex flex-col justify-between min-h-[140px]">
            <div>
              {/* Brand Logo - joblet.ai */}
              <div className="flex items-center gap-1 mb-4">
                <div className="bg-brand-navy p-1.5 rounded-full flex items-center justify-center">
                  <span className="text-white font-extrabold text-sm px-1.5 py-0.5 rounded-full bg-brand-orange">j</span>
                </div>
                <span className="text-2xl font-extrabold text-brand-navy tracking-tight">
                  joblet<span className="text-brand-orange">.ai</span>
                </span>
              </div>
              <p className="text-sm font-semibold text-gray-400 max-w-sm leading-relaxed">
                AI-powered job search connecting talent with opportunity.
              </p>
            </div>

            {/* Social Icons */}
            <div className="flex gap-3 mt-6">
              <a 
                href="https://linkedin.com" 
                target="_blank" 
                rel="noreferrer"
                className="w-10 h-10 rounded-full bg-gray-400/10 hover:bg-brand-orange/10 hover:text-brand-orange text-brand-navy flex items-center justify-center transition duration-200 border border-gray-200/20"
              >
                <Linkedin size={18} className="fill-current text-brand-navy hover:text-brand-orange" />
              </a>
              <a 
                href="https://x.com" 
                target="_blank" 
                rel="noreferrer"
                className="w-10 h-10 rounded-full bg-gray-400/10 hover:bg-brand-orange/10 hover:text-brand-orange text-brand-navy flex items-center justify-center transition duration-200 border border-gray-200/20"
              >
                {/* Minimal Custom X Icon */}
                <span className="font-extrabold text-sm hover:text-brand-orange">X</span>
              </a>
            </div>
          </div>

          {/* Links Section (7 cols) */}
          <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-8">
            
            {/* Product Links */}
            <div className="text-left">
              <h4 className="text-sm font-black text-brand-navy mb-4 tracking-wider uppercase">Product</h4>
              <ul className="space-y-3">
                <li><a href="#job-list" className="text-xs font-semibold text-gray-400 hover:text-brand-orange transition">Browse Jobs</a></li>
                <li><a href="#job-list" className="text-xs font-semibold text-gray-400 hover:text-brand-orange transition">Job Locations</a></li>
                <li><a href="#job-list" className="text-xs font-semibold text-gray-400 hover:text-brand-orange transition">Post a Job</a></li>
                <li><Link to="/chatbot" className="text-xs font-semibold text-gray-400 hover:text-brand-orange transition">Blog</Link></li>
                <li><Link to="/chatbot" className="text-xs font-semibold text-gray-400 hover:text-brand-orange transition">FAQs</Link></li>
                <li><Link to="/chatbot" className="text-xs font-semibold text-gray-400 hover:text-brand-orange transition">AI Suite</Link></li>
                <li><Link to="/chatbot" className="text-xs font-semibold text-gray-400 hover:text-brand-orange transition">Talent Community</Link></li>
              </ul>
            </div>

            {/* Company Links */}
            <div className="text-left">
              <h4 className="text-sm font-black text-brand-navy mb-4 tracking-wider uppercase">Company</h4>
              <ul className="space-y-3">
                <li><Link to="/chatbot" className="text-xs font-semibold text-gray-400 hover:text-brand-orange transition">About Us</Link></li>
                <li><Link to="/chatbot" className="text-xs font-semibold text-gray-400 hover:text-brand-orange transition">Contact</Link></li>
                <li><Link to="/chatbot" className="text-xs font-semibold text-gray-400 hover:text-brand-orange transition">Refer & Earn</Link></li>
                <li><Link to="/chatbot" className="text-xs font-semibold text-gray-400 hover:text-brand-orange transition">Explore All</Link></li>
              </ul>
            </div>

            {/* Legal Links */}
            <div className="text-left">
              <h4 className="text-sm font-black text-brand-navy mb-4 tracking-wider uppercase">Legal</h4>
              <ul className="space-y-3">
                <li><Link to="/chatbot" className="text-xs font-semibold text-gray-400 hover:text-brand-orange transition">Privacy Policy</Link></li>
                <li><Link to="/chatbot" className="text-xs font-semibold text-gray-400 hover:text-brand-orange transition">Cookie Policy</Link></li>
                <li><Link to="/chatbot" className="text-xs font-semibold text-gray-400 hover:text-brand-orange transition">Terms & Conditions</Link></li>
                <li><Link to="/chatbot" className="text-xs font-semibold text-gray-400 hover:text-brand-orange transition">Manage Cookies</Link></li>
              </ul>
            </div>

          </div>

        </div>

        {/* Divider */}
        <div className="w-full h-px bg-gray-200/60 my-8" />

        {/* Centered copyright note */}
        <div className="text-center">
          <p className="text-[11px] font-semibold text-gray-400">
            © 2026 Joblet.AI. All rights reserved.
          </p>
        </div>

      </div>
    </footer>
  );
};

export default Footer;