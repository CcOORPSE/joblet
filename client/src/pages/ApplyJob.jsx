import React, { useContext, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { AppContext } from "../context/AppContext";
import Loading from "../components/Loading";
import Navbar from "../components/Navbar";
import kConvert from "k-convert";
import moment from "moment";
import JobCard from "../components/JobCard";
import Footer from "../components/Footer";
import axios from "axios";
import { toast } from "react-toastify";
import Calltoaction from "../components/Calltoaction";
import { motion, AnimatePresence } from "framer-motion";
import { FiMapPin, FiBriefcase, FiDollarSign, FiClock, FiCheckCircle, FiExternalLink } from "react-icons/fi";
import { sanitizeHtml } from "../utils/sanitizeHtml";

const ApplyJob = () => {
  const { id } = useParams();
  const [jobData, setJobData] = useState(null);
  const [isAlreadyApplied, setAlreadyApplied] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [similarJobs, setSimilarJobs] = useState([]);

  // Resume upload modal state
  const [showResumeModal, setShowResumeModal] = useState(false);
  const [resumeFile, setResumeFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const {
    jobs = [],
    backendUrl,
    userData,
    user,
    userApplications = [],
    fetchUserApplications,
    fetchUserData,
  } = useContext(AppContext);

  // Fetch job details
  const fetchJob = async () => {
    try {
      const { data } = await axios.get(`${backendUrl}/api/jobs/${id}`);
      if (data.success) {
        setJobData(data.job);
        findSimilarJobs(data.job);
        setIsLoading(false);
      } else {
        setIsLoading(false);
        toast.error(data.message);
      }
    } catch (error) {
      setIsLoading(false);
      toast.error("Failed to fetch job details. Please try again later.");
    }
  };

  // Find similar jobs
  const findSimilarJobs = (currentJob) => {
    const similar = jobs.filter(job => 
      job._id !== currentJob._id && 
      job.category === currentJob.category
    ).slice(0, 4);
    setSimilarJobs(similar);
  };

  // Submit application (used after confirming resume exists)
  const submitApplication = async () => {
    try {
      const token = await user.getIdToken();
      const { data } = await axios.post(
        `${backendUrl}/api/users/apply`,
        { jobId: jobData?._id },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (data.success) {
        toast.success("Application submitted successfully! 🎉");
        if (fetchUserApplications) fetchUserApplications(user);
        setAlreadyApplied(true);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error("Error applying for the job. Please try again.");
    }
  };

  // Handle Apply Now click
  const applyHandler = async () => {
    if (!user) {
      return toast.error("Please login to apply.");
    }

    if (!userData?.resume) {
      // Show resume upload modal instead of just a toast
      setShowResumeModal(true);
      return;
    }

    await submitApplication();
  };

  // Upload resume then apply
  const handleResumeUploadAndApply = async () => {
    if (!resumeFile) {
      toast.error("Please select a PDF resume file.");
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append("resume", resumeFile);

      const token = await user.getIdToken();

      // Simulate progress ticks while uploading
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => (prev < 80 ? prev + 10 : prev));
      }, 200);

      const response = await fetch(`${backendUrl}/api/users/update-resume`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await response.json();

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (data.success) {
        toast.success("Resume uploaded!");
        await fetchUserData(user); // refresh userData so resume URL is populated
        setShowResumeModal(false);
        setResumeFile(null);
        setUploadProgress(0);
        // Now apply with the newly uploaded resume
        await submitApplication();
      } else {
        toast.error(data.message || "Resume upload failed.");
        setUploadProgress(0);
      }
    } catch (error) {
      toast.error("Failed to upload resume. Please try again.");
      setUploadProgress(0);
    } finally {
      setIsUploading(false);
    }
  };

  // Drag-and-drop handlers for modal
  const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = () => setIsDragging(false);
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file?.type === "application/pdf") {
      setResumeFile(file);
    } else {
      toast.error("Please upload a PDF file.");
    }
  };

  // Check if user already applied
  const checkAlreadyApplied = () => {
    if (jobData && userApplications && userApplications.length > 0) {
      const hasApplied = userApplications.some(
        (item) => item.jobId === jobData._id || item.jobId?._id === jobData._id
      );
      setAlreadyApplied(hasApplied);
    }
  };

  useEffect(() => {
    if (id) fetchJob();
  }, [id, backendUrl]);

  useEffect(() => {
    checkAlreadyApplied();
  }, [jobData, userApplications]);

  if (isLoading || !jobData) {
    return <Loading />;
  }

  // Safe fallback resolver for company logo and name
  const companyLogo = jobData.companyIdDetails?.image || jobData.companyId?.image || "https://via.placeholder.com/150";
  const companyName = jobData.companyIdDetails?.name || jobData.companyId?.name || "Premium Recruiter";

  return (
    <>
      <Navbar />
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="min-h-screen bg-jl-bg">
          <div className="bg-gradient-to-r from-brand-orange to-brand-navy py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
                <div className="flex items-start space-x-6">
                  <motion.div 
                    whileHover={{ scale: 1.05 }}
                    className="bg-white p-3 rounded-lg shadow-lg border border-white/20"
                  >
                    <img
                      className="h-20 w-20 object-contain"
                      src={companyLogo}
                      alt="Company Logo"
                    />
                  </motion.div>
                  <div>
                    <h1 className="text-3xl font-bold text-white">{jobData?.title}</h1>
                    <p className="text-xl text-white/80 mt-1">{companyName}</p>

                    <div className="flex flex-wrap gap-4 mt-4">
                      <div className="flex items-center text-white/80">
                        <FiMapPin className="mr-2" />
                        {jobData?.location}
                      </div>
                      <div className="flex items-center text-white/80">
                        <FiBriefcase className="mr-2" />
                        {jobData?.level}
                      </div>
                      <div className="flex items-center text-white/80">
                        <FiDollarSign className="mr-2" />
                        {typeof jobData?.salary === 'number' ? `$${jobData.salary.toLocaleString()}/yr` : "Competitive"}
                      </div>
                      <div className="flex items-center text-white/80">
                        <FiClock className="mr-2" />
                        Posted {moment(jobData?.date || jobData?.postedAt).fromNow()}
                      </div>
                    </div>
                  </div>
                </div>

                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="flex flex-col items-center"
                >
                  {jobData.isScraped ? (
                    <a
                      href={jobData.externalLink || "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-8 py-4 rounded-lg font-semibold text-lg shadow-lg bg-emerald-500 hover:bg-emerald-600 text-white flex items-center gap-2"
                    >
                      Apply on Source <FiExternalLink />
                    </a>
                  ) : (
                    <button
                      onClick={applyHandler}
                      disabled={isAlreadyApplied}
                      className={`px-8 py-4 rounded-lg font-semibold text-lg shadow-lg transition-all ${
                        isAlreadyApplied
                          ? "bg-emerald-600 text-white flex items-center"
                          : "bg-white text-brand-orange hover:bg-brand-orange/10 hover:shadow-xl"
                      }`}
                    >
                      {isAlreadyApplied ? (
                        <>
                          <FiCheckCircle className="mr-2" />
                          Applied Successfully
                        </>
                      ) : (
                        "Apply Now"
                      )}
                    </button>
                  )}
                  {!isAlreadyApplied && !jobData.isScraped && (
                    <p className="mt-2 text-white/80 text-sm">
                      {userData?.resume ? "✅ Your resume is ready" : "⚠️ No resume — upload on apply"}
                    </p>
                  )}
                </motion.div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="flex flex-col lg:flex-row gap-8">
              {/* Job Details */}
              <div className="lg:w-2/3">
                <motion.div 
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="bg-white rounded-xl shadow-md p-8 mb-8"
                >
                  <h2 className="text-2xl font-bold text-gray-800 mb-6">Job Description</h2>
                  <div 
                    className="prose max-w-none text-gray-700"
                    dangerouslySetInnerHTML={{ __html: sanitizeHtml(jobData?.description || "") }}
                  ></div>
                </motion.div>
              </div>

              {/* Sidebar */}
              <div className="lg:w-1/3 space-y-6">
                {/* Company Info */}
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="bg-white rounded-xl shadow-md p-6"
                >
                  <h3 className="text-xl font-bold text-gray-800 mb-4">About the Company</h3>
                  <p className="text-gray-600 mb-4">
                    Opportunity at {companyName}. Apply to learn more.
                  </p>
                </motion.div>

                {/* Similar Jobs */}
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="bg-white rounded-xl shadow-md p-6"
                >
                  <h3 className="text-xl font-bold text-gray-800 mb-4">Similar Jobs</h3>
                  <div className="space-y-4">
                    {similarJobs.length > 0 ? (
                      similarJobs.map((job) => (
                        <JobCard key={job._id} job={job} />
                      ))
                    ) : (
                      <p className="text-gray-500">No similar jobs found</p>
                    )}
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </div>
        <Calltoaction />
        <Footer />
      </motion.div>

      {/* ── Resume Upload Modal ── */}
      <AnimatePresence>
        {showResumeModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ backgroundColor: "rgba(10,14,33,0.75)", backdropFilter: "blur(6px)" }}
            onClick={(e) => { if (e.target === e.currentTarget && !isUploading) setShowResumeModal(false); }}
          >
            <motion.div
              initial={{ scale: 0.88, y: 30, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.88, y: 30, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 28 }}
              className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden"
            >
              {/* Gradient header */}
              <div className="relative bg-gradient-to-r from-brand-orange to-orange-600 px-8 pt-8 pb-16">
                <button
                  onClick={() => { if (!isUploading) { setShowResumeModal(false); setResumeFile(null); } }}
                  className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors p-1"
                  aria-label="Close"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-xl font-extrabold text-white leading-tight">Upload Your Resume</h2>
                    <p className="text-white/70 text-xs">Required to apply for this role</p>
                  </div>
                </div>
                <p className="text-white/80 text-sm mt-1">
                  Applying for <span className="font-bold text-white">{jobData?.title}</span> at <span className="font-semibold">{companyName}</span>
                </p>
              </div>

              {/* Card body overlapping header */}
              <div className="relative -mt-10 mx-6 mb-6 bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                {/* Drop zone */}
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`relative rounded-xl border-2 border-dashed transition-all duration-200 flex flex-col items-center justify-center p-8 mb-5 cursor-pointer
                    ${isDragging ? "border-brand-orange bg-orange-50 scale-[1.02]" : resumeFile ? "border-emerald-400 bg-emerald-50" : "border-gray-200 bg-gray-50 hover:border-brand-orange hover:bg-orange-50/40"}`}
                >
                  <label htmlFor="modal-resume-upload" className="flex flex-col items-center cursor-pointer w-full">
                    {resumeFile ? (
                      <>
                        <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center mb-3">
                          <svg className="w-7 h-7 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <p className="font-bold text-emerald-700 text-sm text-center break-all">{resumeFile.name}</p>
                        <p className="text-emerald-500 text-xs mt-1">{(resumeFile.size / 1024).toFixed(1)} KB · PDF</p>
                        <p className="text-gray-400 text-xs mt-2">Click to choose a different file</p>
                      </>
                    ) : (
                      <>
                        <div className="w-14 h-14 bg-orange-100 rounded-2xl flex items-center justify-center mb-3">
                          <svg className="w-7 h-7 text-brand-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                          </svg>
                        </div>
                        <p className="font-bold text-gray-700 text-sm">Drag & drop your resume here</p>
                        <p className="text-gray-400 text-xs mt-1">or click to browse files</p>
                        <span className="mt-3 inline-block px-3 py-1 bg-orange-100 text-brand-orange text-xs font-semibold rounded-full">PDF only · Max 5MB</span>
                      </>
                    )}
                    <input
                      id="modal-resume-upload"
                      type="file"
                      accept="application/pdf"
                      className="sr-only"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file?.type === "application/pdf") setResumeFile(file);
                        else toast.error("Please select a PDF file.");
                      }}
                    />
                  </label>
                </div>

                {/* Progress bar */}
                <AnimatePresence>
                  {isUploading && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mb-4 overflow-hidden"
                    >
                      <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>Uploading &amp; applying…</span>
                        <span>{uploadProgress}%</span>
                      </div>
                      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                        <motion.div
                          className="h-2 bg-gradient-to-r from-brand-orange to-orange-400 rounded-full"
                          initial={{ width: "0%" }}
                          animate={{ width: `${uploadProgress}%` }}
                          transition={{ duration: 0.3 }}
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Actions */}
                <div className="flex gap-3">
                  <button
                    onClick={() => { if (!isUploading) { setShowResumeModal(false); setResumeFile(null); } }}
                    disabled={isUploading}
                    className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-500 text-sm font-semibold hover:bg-gray-50 transition-all disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <motion.button
                    whileHover={{ scale: isUploading ? 1 : 1.02 }}
                    whileTap={{ scale: isUploading ? 1 : 0.98 }}
                    onClick={handleResumeUploadAndApply}
                    disabled={isUploading || !resumeFile}
                    className="flex-1 py-3 rounded-xl bg-gradient-to-r from-brand-orange to-orange-600 text-white text-sm font-bold shadow-md hover:shadow-lg transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isUploading ? (
                      <>
                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Uploading…
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Upload &amp; Apply
                      </>
                    )}
                  </motion.button>
                </div>

                <p className="text-center text-xs text-gray-400 mt-3">
                  Your resume will be saved to your profile for future applications
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ApplyJob;