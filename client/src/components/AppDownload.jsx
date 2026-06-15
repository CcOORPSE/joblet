import React from "react";
import { motion } from "framer-motion";
import { Briefcase, Building, Globe, MapPin, BarChart3 } from "lucide-react";

const AppDownload = () => {
  const stats = [
    {
      number: "10,000+",
      label: "Job Listing",
      icon: Briefcase,
    },
    {
      number: "1,200+",
      label: "Companies Hiring",
      icon: Building,
    },
    {
      number: "38+",
      label: "Countries",
      icon: Globe,
    },
    {
      number: "3,000+",
      label: "Cities Discovered",
      icon: MapPin,
    },
  ];

  return (
    <section className="py-20 px-4 md:px-8 bg-transparent relative overflow-hidden">
      <div className="max-w-7xl mx-auto relative z-10 text-center">
        {/* Section Header */}
        <div className="flex items-center justify-center gap-2 text-brand-navy font-black text-xl mb-12">
          <BarChart3 className="text-brand-navy" size={24} />
          <span>Joblet by the numbers</span>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              viewport={{ once: true }}
              whileHover={{ y: -4, scale: 1.02 }}
              className="bg-white border-2 border-[#FFDFD6] rounded-3xl p-6 flex items-center gap-5 text-left shadow-sm shadow-[#FFDFD6]/20 transition-all duration-300"
            >
              {/* Icon Container */}
              <div className="p-3.5 bg-brand-cream border border-[#FFDFD6] rounded-2xl text-brand-navy">
                <stat.icon size={28} className="text-brand-navy stroke-[1.5]" />
              </div>
              {/* Labels */}
              <div>
                <h3 className="text-3xl font-black text-brand-navy tracking-tight">
                  {stat.number}
                </h3>
                <p className="text-xs font-semibold text-gray-400 mt-0.5">
                  {stat.label}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Footnote */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          viewport={{ once: true }}
          className="text-[11px] font-semibold text-gray-400 max-w-4xl mx-auto leading-relaxed mt-10"
        >
          Jobs Aggregated From Public Career Pages & Partner Feeds, Including Listings At{" "}
          <strong className="text-brand-navy font-bold">Wells Fargo</strong>,{" "}
          <strong className="text-brand-navy font-bold">Goldman Sachs</strong>,{" "}
          <strong className="text-brand-navy font-bold">Uber</strong>,{" "}
          <strong className="text-brand-navy font-bold">Scale AI</strong>,{" "}
          <strong className="text-brand-navy font-bold">Kenvue</strong>,{" "}
          <strong className="text-brand-navy font-bold">Spring Health</strong>,{" "}
          <strong className="text-brand-navy font-bold">Mercer</strong>,{" "}
          <strong className="text-brand-navy font-bold">Northrop Grumman</strong> And{" "}
          <strong className="text-brand-navy font-bold">Thousands</strong> More. Company Names And Trademarks Belong To Their Respective Owners.
        </motion.p>
      </div>
    </section>
  );
};

export default AppDownload;
