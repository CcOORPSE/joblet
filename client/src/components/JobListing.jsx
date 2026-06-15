import { useContext, useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { AppContext } from "../context/AppContext";
import { JobLocations } from "../assets/assets";
import JobCard from "./JobCard";
import { motion, AnimatePresence } from "framer-motion";
import { FiPlusCircle, FiSettings } from "react-icons/fi";
import { toast } from "react-toastify";
import { 
  Cpu, Monitor, Heart, Factory, Box, Building, Truck, Home, 
  CircleDollarSign, Briefcase, ShoppingBag, Utensils, Clapperboard, GraduationCap,
  Layers
} from "lucide-react";

const JobListing = () => {
  const {
    isSearched,
    searchFilter,
    setSearchFilter,
    jobs,
    setShowRecruiterLogin,
    companyToken,
  } = useContext(AppContext);

  const [jobCount, setJobCount] = useState(jobs.length);
  const [showNewJobsNotification, setShowNewJobsNotification] = useState(false);

  const initialLoad = useRef(true);
  const [showFilter, setShowFilter] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState([]);
  const [showAllLocations, setShowAllLocations] = useState(false);
  const [filterJobs, setFilterJobs] = useState(jobs);
  const [sortBy, setSortBy] = useState("recent");
  const [fade, setFade] = useState(true);

  // Refs to track previous filter states
  const prevSelectedCategory = useRef(selectedCategory);
  const prevSelectedLocation = useRef(selectedLocation);
  const prevSearchFilter = useRef({ ...searchFilter });

  // Detect new jobs and show notification
  useEffect(() => {
    if (jobs.length > jobCount && jobCount > 0) {
      const newJobsAdded = jobs.length - jobCount;
      setShowNewJobsNotification(true);
      toast.success(`${newJobsAdded} new job${newJobsAdded > 1 ? 's' : ''} added!`, {
        position: "top-right",
        autoClose: 3000,
      });
      setTimeout(() => setShowNewJobsNotification(false), 3000);
    }
    setJobCount(jobs.length);
  }, [jobs.length, jobCount]);

  const triggerTransition = (callback, shouldScroll = true) => {
    setFade(false);
    setTimeout(() => {
      callback();
      setFade(true);
      if (shouldScroll && !initialLoad.current) {
        document.getElementById("job-list")?.scrollIntoView({
          behavior: "smooth",
          block: "start"
        });
      }
    }, 300);
  };

  useEffect(() => {
    const filterJobs = () => {
      const matchesCategory = (job) =>
        selectedCategory.length === 0 || selectedCategory.includes(job.category);

      const matchesLocation = (job) =>
        selectedLocation.length === 0 || selectedLocation.includes(job.location);

      const matchesTitle = (job) =>
        searchFilter.title === "" ||
        (job.title || "").toLowerCase().includes(searchFilter.title.toLowerCase().trim());

      const matchesSearchLocation = (job) => {
        const search = searchFilter.location.toLowerCase().trim();
        if (!search) return true;
        const jobLoc = (job.location || "").toLowerCase().trim();
        return jobLoc.includes(search) || search.includes(jobLoc);
      };

      const newFilteredJobs = jobs
         .slice()
         .filter(
           (job) =>
             matchesCategory(job) &&
             matchesLocation(job) &&
             matchesTitle(job) &&
             matchesSearchLocation(job)
         )
         .sort((a, b) => {
           if (sortBy === "salary") {
             return (Number(b.salary) || 0) - (Number(a.salary) || 0);
           }
           if (sortBy === "title") {
             return (a.title || "").localeCompare(b.title || "");
           }
           return (Number(b.date) || 0) - (Number(a.date) || 0);
         });

      setFilterJobs(newFilteredJobs);
      setCurrentPage(1);
    };

    // Check if filters changed (excluding jobs update)
    const filtersChanged =
      prevSelectedCategory.current !== selectedCategory ||
      prevSelectedLocation.current !== selectedLocation ||
      JSON.stringify(prevSearchFilter.current) !== JSON.stringify(searchFilter);

    if (initialLoad.current) {
      // Initial load without scroll
      filterJobs();
      initialLoad.current = false;
    } else {
      // Trigger scroll only if filters changed
      triggerTransition(filterJobs, filtersChanged);
    }

    // Update previous filter refs
    prevSelectedCategory.current = selectedCategory;
    prevSelectedLocation.current = selectedLocation;
    prevSearchFilter.current = { ...searchFilter };
  }, [jobs, selectedCategory, selectedLocation, searchFilter, sortBy]);

  const handleCategoryChange = (category) => {
    triggerTransition(() => {
      setSelectedCategory((prev) =>
        prev.includes(category)
          ? prev.filter((c) => c !== category)
          : [...prev, category]
      );
    });
  };

  const handleLocationChange = (location) => {
    triggerTransition(() => {
      setSelectedLocation((prev) =>
        prev.includes(location)
          ? prev.filter((c) => c !== location)
          : [...prev, location]
      );
    });
  };

  const handlePageChange = (newPage) => {
    triggerTransition(() => setCurrentPage(newPage));
  };

  const clearAllFilters = () => {
    triggerTransition(() => {
      setSelectedCategory([]);
      setSelectedLocation([]);
      setSearchFilter({ title: "", location: "" });
    });
  };

  const categoryCards = [
    { label: "AI", icon: Cpu, name: "Technology" },
    { label: "IT", icon: Monitor, name: "Programming" },
    { label: "Healthcare", icon: Heart, name: "Healthcare" },
    { label: "Manufacturing & Production", icon: Factory, name: "Production" },
    { label: "Supply Chain", icon: Box, name: "Logistics" },
    { label: "Infrastructure", icon: Building, name: "Construction" },
    { label: "Transportation & Logistics", icon: Truck, name: "Logistics" },
    { label: "Real Estate", icon: Home, name: "Real Estate" },
    { label: "Finance & Accounting", icon: CircleDollarSign, name: "Finance" },
    { label: "Consulting", icon: Briefcase, name: "Management" },
    { label: "Sales & Marketing", icon: ShoppingBag, name: "Marketing" },
    { label: "Hospitality", icon: Utensils, name: "Hospitality" },
    { label: "Media & Entertainment", icon: Clapperboard, name: "Media" },
    { label: "Education", icon: GraduationCap, name: "Education" },
  ];

  return (
    <>
      <div className="max-w-7xl mx-auto py-12 px-4 lg:px-8">
        {/* Category Grid Section */}
        <div className="mb-20">
          <div className="text-center mb-10 flex flex-col items-center justify-center">
            <div className="flex items-center gap-2 text-brand-orange font-bold text-xs uppercase tracking-widest mb-3">
              <Layers size={14} />
              <span>Browse Jobs By Category</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-black text-brand-navy tracking-tight">
              Explore Opportunities by Sector
            </h2>
            <p className="text-gray-400 font-semibold text-xs md:text-sm mt-2 max-w-lg">
              Find roles matching your specific industry vertical instantly.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-4">
            {categoryCards.map((cat, idx) => {
              const isSelected = selectedCategory.includes(cat.name) || selectedCategory.includes(cat.label);
              return (
                <motion.div
                  key={idx}
                  whileHover={{ y: -4, scale: 1.02 }}
                  onClick={() => {
                    const targetCat = cat.name;
                    triggerTransition(() => {
                      setSelectedCategory([targetCat]);
                    }, true);
                  }}
                  className={`cursor-pointer p-4 rounded-2xl border text-center transition-all duration-200 flex flex-col items-center justify-center min-h-[110px] ${
                    isSelected 
                      ? "bg-brand-orange border-brand-orange text-white shadow-lg shadow-brand-orange/20" 
                      : "bg-[#FAF9F6]/50 border-gray-100 hover:border-brand-orange/30 hover:bg-white text-brand-navy shadow-sm"
                  }`}
                >
                  <div className={`p-2.5 rounded-full mb-3 ${
                    isSelected ? "bg-white/20 text-white" : "bg-white text-brand-orange shadow-sm border border-brand-orange/5"
                  }`}>
                    <cat.icon size={20} />
                  </div>
                  <h4 className="text-xs font-black tracking-tight leading-tight">{cat.label}</h4>
                </motion.div>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col lg:flex-row max-lg:space-y-8 py-8 border-t border-gray-100">
          {/* FILTER SIDEBAR */}
          <motion.div 
            className="w-full lg:w-1/4 bg-white rounded-3xl border border-gray-100 shadow-xl shadow-brand-navy/5 lg:sticky lg:top-28 lg:h-[calc(100vh-140px)] lg:overflow-y-auto"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
        <div className="p-6">
          {/* Mobile filter toggle */}
          <button
            onClick={() => setShowFilter(prev => !prev)}
            className="flex items-center gap-2 px-5 py-3 bg-brand-navy hover:bg-brand-navy/95 text-white font-bold rounded-full lg:hidden w-full justify-center mb-4 transition shadow-md shadow-brand-navy/15"
          >
            {showFilter ? (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4.5 w-4.5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
                <span className="text-xs">Hide Filters</span>
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4.5 w-4.5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clipRule="evenodd" />
                </svg>
                <span className="text-xs">Show Filters</span>
              </>
            )}
          </button>

          {showFilter && (
            <>
              {/* Current Search */}
              {isSearched && (searchFilter.title !== "" || searchFilter.location !== "") && (
                <div className="mb-8 bg-brand-cream border border-[#FFDFD6] p-4 rounded-2xl">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-black text-sm text-brand-navy">Current Search</h3>
                    <button 
                      onClick={clearAllFilters}
                      className="text-xs text-brand-orange font-bold hover:underline"
                    >
                      Clear all
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {searchFilter.title && (
                      <span className="inline-flex items-center gap-1.5 bg-[#FFEFEA] border border-brand-orange/15 px-3 py-1 rounded-full text-xs font-bold text-brand-orange">
                        {searchFilter.title}
                        <button
                          onClick={() => setSearchFilter(prev => ({ ...prev, title: "" }))}
                          className="text-brand-orange hover:text-brand-orange/85"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </span>
                    )}
                    {searchFilter.location && (
                      <span className="inline-flex items-center gap-1.5 bg-[#FFEFEA] border border-brand-orange/15 px-3 py-1 rounded-full text-xs font-bold text-brand-orange">
                        {searchFilter.location}
                        <button
                          onClick={() => setSearchFilter(prev => ({ ...prev, location: "" }))}
                          className="text-brand-orange hover:text-brand-orange/85"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Categories / Job Roles */}
              <div className="mb-8">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-black text-sm text-brand-navy tracking-wide uppercase">Job Roles</h4>
                  {selectedCategory.length > 0 && (
                    <button 
                      onClick={() => setSelectedCategory([])}
                      className="text-xs text-brand-orange font-bold hover:underline"
                    >
                      Clear
                    </button>
                  )}
                </div>
                <ul className="space-y-3">
                  {Array.from(new Set(jobs.map(j => j.category).filter(Boolean))).sort().map((category, index) => (
                    <motion.li 
                      key={index} 
                      className="flex items-center"
                      whileHover={{ x: 3 }}
                    >
                      <input
                        className="h-4 w-4 text-brand-orange rounded border-gray-200 focus:ring-brand-orange focus:ring-offset-0 focus:outline-none cursor-pointer accent-brand-orange transition-all duration-200"
                        type="checkbox"
                        onChange={() => handleCategoryChange(category)}
                        checked={selectedCategory.includes(category)}
                        id={`category-${index}`}
                      />
                      <label 
                        htmlFor={`category-${index}`} 
                        className="ml-3 text-xs font-semibold text-gray-500 cursor-pointer hover:text-brand-orange transition-colors"
                      >
                        {category}
                      </label>
                    </motion.li>
                  ))}
                </ul>
              </div>

              {/* Locations */}
              <div className="mb-4">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-black text-sm text-brand-navy tracking-wide uppercase">Locations</h4>
                  {selectedLocation.length > 0 && (
                    <button 
                      onClick={() => setSelectedLocation([])}
                      className="text-xs text-brand-orange font-bold hover:underline"
                    >
                      Clear
                    </button>
                  )}
                </div>
                <ul className="space-y-3">
                  {JobLocations.slice(0, showAllLocations ? JobLocations.length : 5).map((location, index) => (
                    <motion.li 
                      key={index} 
                      className="flex items-center"
                      whileHover={{ x: 3 }}
                    >
                      <input
                        className="h-4 w-4 text-brand-orange rounded border-gray-200 focus:ring-brand-orange focus:ring-offset-0 focus:outline-none cursor-pointer accent-brand-orange transition-all duration-200"
                        type="checkbox"
                        onChange={() => handleLocationChange(location)}
                        checked={selectedLocation.includes(location)}
                        id={`location-${index}`}
                      />
                      <label 
                        htmlFor={`location-${index}`} 
                        className="ml-3 text-xs font-semibold text-gray-500 cursor-pointer hover:text-brand-orange transition-colors"
                      >
                        {location}
                      </label>
                    </motion.li>
                  ))}
                </ul>
                {JobLocations.length > 5 && (
                  <button
                    onClick={() => setShowAllLocations(!showAllLocations)}
                    className="mt-3 text-xs font-bold text-brand-orange hover:underline block text-left"
                  >
                    {showAllLocations ? 'Show Less' : `Show All (${JobLocations.length})`}
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </motion.div>

      {/* JOB LISTING SECTION */}
      <section className="w-full lg:w-3/4 pl-0 lg:pl-8">
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
            <div className="text-left">
              <h3 className="font-black text-3xl text-brand-navy mb-1.5" id="job-list">
                {isSearched && searchFilter.title ? `"${searchFilter.title}" Jobs` : 'Latest Jobs'}
              </h3>
              <p className="text-gray-400 font-semibold text-xs md:text-sm">
                {isSearched ? 'Live results from the web + recruiter listings on Joblet.AI' : 'Jobs posted by verified recruiters on Joblet.AI'}
              </p>
            </div>
            <div className="flex flex-wrap gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setShowRecruiterLogin(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-orange hover:bg-brand-orange/95 text-white text-xs font-bold rounded-full shadow-md shadow-brand-orange/15 transition-all duration-200 hover:-translate-y-0.5"
              >
                <FiPlusCircle />
                Post a Job
              </button>
              {companyToken && (
                <Link
                  to="/dashboard/manage-job"
                  className="inline-flex items-center gap-2 px-5 py-2.5 border border-brand-orange/20 text-brand-orange text-xs font-bold rounded-full hover:bg-brand-cream transition-all duration-200 hover:-translate-y-0.5"
                >
                  <FiSettings />
                  Manage Jobs
                </Link>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs text-left">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FFEFEA] text-brand-orange font-bold border border-brand-orange/10">
              <span className="w-2.5 h-2.5 rounded-full bg-brand-orange animate-pulse" />
              {jobs.filter(j => !j.isScraped).length} Recruiter {jobs.filter(j => !j.isScraped).length === 1 ? "listing" : "listings"}
            </span>
            {jobs.filter(j => j.isScraped).length > 0 && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-orange/10 text-brand-orange font-bold border border-brand-orange/20">
                <span className="w-2.5 h-2.5 rounded-full bg-brand-orange animate-pulse" />
                {jobs.filter(j => j.isScraped).length} Live web {jobs.filter(j => j.isScraped).length === 1 ? "result" : "results"}
              </span>
            )}
            {showNewJobsNotification && (
              <motion.span 
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-50 text-green-600 font-bold border border-green-200"
              >
                <span className="text-green-500">✨</span>
                New jobs added!
              </motion.span>
            )}
          </div>
        </div>

        {/* Search bar for mobile */}
        <div className="lg:hidden mb-6">
          <div className="relative">
            <input
              type="text"
              placeholder="Search jobs..."
              className="w-full px-5 py-3.5 border border-gray-100 rounded-full focus:ring-2 focus:ring-brand-orange focus:border-transparent outline-none font-semibold text-xs text-brand-navy shadow-sm bg-white"
              value={searchFilter.title}
              onChange={(e) => setSearchFilter({...searchFilter, title: e.target.value})}
            />
            <button className="absolute right-4 top-4 text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4.5 w-4.5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>

        {/* Job count and sorting */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
          <p className="text-gray-400 font-semibold text-xs md:text-sm mb-3 sm:mb-0">
            Showing <span className="font-extrabold text-brand-navy">{filterJobs.length}</span> jobs
            {(selectedCategory.length > 0 || selectedLocation.length > 0) && (
              <span className="text-xs font-semibold ml-2 text-gray-400/85">
                (filtered by {selectedCategory.length > 0 ? `${selectedCategory.length} categor${selectedCategory.length > 1 ? 'ies' : 'y'}` : ''}
                {selectedCategory.length > 0 && selectedLocation.length > 0 ? ' and ' : ''}
                {selectedLocation.length > 0 ? `${selectedLocation.length} location${selectedLocation.length > 1 ? 's' : ''}` : ''})
              </span>
            )}
          </p>
          <div className="flex items-center text-xs">
            <label htmlFor="sort" className="text-gray-400 font-semibold mr-2">Sort by:</label>
            <select 
              id="sort"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="border border-gray-100 bg-[#FAF9F6] text-brand-navy font-semibold rounded-full px-4 py-2 text-xs focus:ring-brand-orange focus:border-brand-orange outline-none cursor-pointer shadow-sm hover:bg-gray-100/50 transition-all duration-200"
            >
              <option value="recent">Most Recent</option>
              <option value="salary">Highest Salary</option>
              <option value="title">Job Title (A–Z)</option>
            </select>
          </div>
        </div>

        {/* Job listings with animations */}
        <div className="relative min-h-[400px]">
          {filterJobs.length === 0 ? (
            <motion.div 
              className="bg-white border border-gray-100 rounded-3xl p-12 text-center shadow-lg shadow-brand-navy/5 max-w-xl mx-auto"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="w-16 h-16 bg-[#FFEFEA] rounded-2xl flex items-center justify-center mx-auto mb-6 text-brand-orange">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h4 className="text-xl font-black text-brand-navy mb-2">No Jobs Match Your Filters</h4>
              <p className="text-gray-400 font-semibold text-sm mb-6 leading-relaxed">
                Try refining your search keyword, adjusting the location filter, or resetting your category selections.
              </p>
              <button 
                onClick={clearAllFilters}
                className="px-6 py-2.5 bg-brand-orange hover:bg-brand-orange/95 text-white font-bold rounded-full text-xs shadow-md shadow-brand-orange/20 transition-all duration-200"
              >
                Clear All Filters
              </button>
            </motion.div>
          ) : (
            <motion.div 
              className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6 transition-opacity duration-300 ${fade ? 'opacity-100' : 'opacity-0'}`}
              layout
            >
              <AnimatePresence>
                {filterJobs
                  .slice((currentPage - 1) * 6, currentPage * 6)
                  .map((job, index) => (
                    <motion.div
                      key={job.id || index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.3 }}
                      layout
                    >
                      <JobCard job={job} />
                    </motion.div>
                  ))}
              </AnimatePresence>
            </motion.div>
          )}
        </div>

        {/* Pagination */}
        {filterJobs.length > 0 && (
          <motion.div 
            className="flex items-center justify-center space-x-2 mt-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <button
              onClick={() => handlePageChange(Math.max(currentPage - 1, 1))}
              disabled={currentPage === 1}
              className={`p-2 rounded-full border border-gray-100 ${currentPage === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-brand-navy hover:bg-brand-cream hover:text-brand-orange transition-all duration-200'}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </button>
            
            {Array.from({ length: Math.ceil(filterJobs.length / 6) }).map((_, index) => (
              <button
                key={index}
                onClick={() => handlePageChange(index + 1)}
                className={`w-10 h-10 flex items-center justify-center rounded-full text-xs font-bold transition-all duration-300 ${
                  currentPage === index + 1
                    ? "bg-brand-orange text-white shadow-lg shadow-brand-orange/25"
                    : "text-brand-navy font-semibold hover:bg-brand-cream hover:text-brand-orange"
                }`}
              >
                {index + 1}
              </button>
            ))}
            
            <button
              onClick={() => handlePageChange(Math.min(currentPage + 1, Math.ceil(filterJobs.length / 6)))}
              disabled={currentPage === Math.ceil(filterJobs.length / 6)}
              className={`p-2 rounded-full border border-gray-100 ${currentPage === Math.ceil(filterJobs.length / 6) ? 'text-gray-300 cursor-not-allowed' : 'text-brand-navy hover:bg-brand-cream hover:text-brand-orange transition-all duration-200'}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            </button>
          </motion.div>
        )}
        </section>
        </div>
      </div>
    </>
  );
};

export default JobListing;