import React, { useContext, useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { AppContext } from "../context/AppContext";
import axios from "axios";
import { toast } from "react-toastify";
import Loading from "../components/Loading";
import { motion } from "framer-motion";
import moment from "moment";
import { Sparkles, Briefcase, TrendingUp, FolderOpen, Plus, Eye, EyeOff, AlertCircle, Inbox } from "lucide-react";

const ManageJobs = () => {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const { backendUrl, companyToken, getRecruiterAuthHeaders, fetchRecruiterAnalytics } = useContext(AppContext);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const headers = await getRecruiterAuthHeaders();
      const jobsRes = await axios.get(backendUrl + "/api/company/list-jobs", { headers });
      const analyticsRes = await fetchRecruiterAnalytics();

      if (jobsRes.data.success) {
        setJobs(jobsRes.data.jobsData.reverse());
      } else {
        toast.error(jobsRes.data.message);
        setJobs([]);
      }

      if (analyticsRes) {
        setAnalytics(analyticsRes);
      }
    } catch (error) {
      toast.error(error.message);
      setJobs([]);
    } finally {
      setIsLoading(false);
    }
  };

  const changeJobVisiblity = async (id) => {
    try {
      const headers = await getRecruiterAuthHeaders();
      const { data } = await axios.post(
        backendUrl + "/api/company/change-visibility",
        { id },
        { headers }
      );
      if (data.success) {
        toast.success(data.message);
        fetchDashboardData();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  useEffect(() => {
    if (companyToken) {
      fetchDashboardData();
    }
  }, [companyToken]);

  if (isLoading) return <Loading />;

  const metrics = analytics?.metrics || {};
  const topJobs = analytics?.topJobs || [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-8"
    >
      {/* Dashboard Top Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-brand-navy tracking-tight">Dashboard Overview</h1>
          <p className="text-gray-500 mt-1">Real-time pipeline aggregates and job listing controls.</p>
        </div>
        <button
          onClick={() => navigate("/dashboard/add-job")}
          className="bg-brand-orange text-white py-3 px-6 rounded-xl font-semibold hover:bg-jl-accent transition duration-300 ease-in-out flex items-center gap-2 shadow-md hover:shadow-lg active:scale-95"
        >
          <Plus size={18} />
          Post New Job
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          icon={Briefcase}
          label="Total Jobs"
          value={jobs.length}
          accent="blue"
        />
        <StatCard
          icon={FolderOpen}
          label="Active Jobs"
          value={jobs.filter((j) => j.visible).length}
          accent="green"
        />
        <StatCard
          icon={Inbox}
          label="Total Apps"
          value={metrics.totalApplications ?? 0}
          accent="orange"
        />
        <StatCard
          icon={TrendingUp}
          label="This Week"
          value={`+${metrics.applicationsThisWeek ?? 0}`}
          accent="green"
        />
        <StatCard
          icon={AlertCircle}
          label="Pending Review"
          value={metrics.pendingReview ?? 0}
          accent="orange"
        />
      </div>

      {/* Split Layout: Left Jobs Table, Right Analytics List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Manage Jobs Table */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-lg font-bold text-gray-800">Job Listings</h2>
              <span className="text-xs font-semibold px-2.5 py-1 bg-gray-100 text-gray-600 rounded-full">
                {jobs.length} total
              </span>
            </div>
            
            {jobs.length === 0 ? (
              <div className="p-12 text-center text-gray-500">
                <Briefcase size={40} className="mx-auto mb-3 text-gray-300" />
                <p className="text-sm font-medium">No job postings found.</p>
                <p className="text-xs text-gray-400 mt-1">Create a new listing to start receiving applications.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50/50 border-b border-gray-100 text-gray-400 text-xs font-bold uppercase tracking-wider">
                      <th className="py-4 px-6">Job Title</th>
                      <th className="py-4 px-6 max-sm:hidden">Location</th>
                      <th className="py-4 px-6 text-center">Applicants</th>
                      <th className="py-4 px-6 text-center">Visibility</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
                    {jobs.map((job) => (
                      <tr key={job._id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="py-4 px-6 font-semibold text-gray-900">
                          <div>
                            <p>{job.title}</p>
                            <p className="text-xs text-gray-400 font-normal mt-0.5 sm:hidden">{job.location}</p>
                            <p className="text-[10px] text-gray-400 font-normal mt-0.5 max-sm:hidden">
                              Posted {moment(job.date).format("ll")}
                            </p>
                          </div>
                        </td>
                        <td className="py-4 px-6 max-sm:hidden font-medium text-gray-600">{job.location}</td>
                        <td className="py-4 px-6">
                          <div className="flex justify-center">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                              job.applicants > 0
                                ? "bg-brand-orange/10 text-brand-orange"
                                : "bg-gray-100 text-gray-500"
                            }`}>
                              {job.applicants}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex justify-center">
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                onChange={() => changeJobVisiblity(job._id)}
                                className="sr-only peer"
                                type="checkbox"
                                checked={job.visible}
                              />
                              <div className="w-10 h-5.5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4.5 after:w-4.5 after:transition-all peer-checked:bg-brand-orange"></div>
                            </label>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Analytics Widget & AI Copilot */}
        <div className="space-y-6">
          {/* Top Jobs List */}
          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <TrendingUp size={18} className="text-brand-orange" />
              Top Listings by Applicants
            </h3>
            {topJobs.length === 0 ? (
              <p className="text-sm text-gray-400 py-4">No application activity recorded yet.</p>
            ) : (
              <ul className="space-y-3.5">
                {topJobs.slice(0, 5).map((job, idx) => (
                  <li
                    key={job.jobId}
                    className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0 last:pb-0"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-700 truncate">
                        <span className="text-brand-orange font-bold mr-2">{idx + 1}.</span>
                        {job.title}
                      </p>
                    </div>
                    <span className="text-xs font-extrabold bg-gray-100 text-gray-700 px-2.5 py-1 rounded-lg shrink-0">
                      {job.applicantCount} apps
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Ask HireBot Widget */}
          <div className="bg-gradient-to-br from-brand-navy to-brand-blue border border-brand-navy/30 rounded-2xl shadow-md p-6 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl pointer-events-none" />
            <div className="relative z-10 space-y-4">
              <div className="p-2.5 rounded-xl bg-white/10 text-brand-orange w-fit">
                <Sparkles size={20} />
              </div>
              <div>
                <h4 className="font-bold text-lg">AI Talent Assistant</h4>
                <p className="text-xs text-white/70 mt-1 leading-relaxed">
                  Ask HireBot to analyze metrics, filter outstanding candidates, or draft custom job descriptions.
                </p>
              </div>
              <Link
                to="/dashboard/ai"
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 text-sm font-bold text-white bg-brand-orange hover:bg-jl-accent active:scale-[0.98] rounded-xl transition-all shadow-sm"
              >
                <Sparkles size={14} />
                Ask HireBot
              </Link>
            </div>
          </div>
        </div>

      </div>
    </motion.div>
  );
};

const StatCard = ({ icon: Icon, label, value, accent }) => {
  const colors = {
    blue: "bg-blue-50/50 border-blue-100 text-blue-700",
    green: "bg-emerald-50/50 border-emerald-100 text-emerald-700",
    orange: "bg-brand-orange/5 border-brand-orange/10 text-brand-orange",
  };

  return (
    <div className={`p-5 rounded-2xl border ${colors[accent]} transition-all hover:shadow-sm flex flex-col justify-between h-28`}>
      <Icon size={20} className="opacity-80" />
      <div>
        <p className="text-2xl font-black tracking-tight mt-2">{value}</p>
        <p className="text-xs font-semibold opacity-75 mt-0.5">{label}</p>
      </div>
    </div>
  );
};

export default ManageJobs;