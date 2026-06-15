import React, { useContext, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AppContext } from "../../context/AppContext";
import { Sparkles, Briefcase, TrendingUp, FolderOpen } from "lucide-react";

const RecruiterAnalytics = () => {
  const { fetchRecruiterAnalytics } = useContext(AppContext);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    fetchRecruiterAnalytics().then((result) => {
      if (active) {
        setData(result);
        setLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, [fetchRecruiterAnalytics]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-pulse">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-28 bg-gray-100 rounded-2xl" />
        ))}
      </div>
    );
  }

  const metrics = data?.metrics || {};

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          icon={Briefcase}
          label="Total applications"
          value={metrics.totalApplications ?? 0}
          accent="orange"
        />
        <StatCard
          icon={TrendingUp}
          label="This week"
          value={`+${metrics.applicationsThisWeek ?? 0}`}
          accent="green"
        />
        <StatCard
          icon={FolderOpen}
          label="Open jobs"
          value={metrics.openJobs ?? 0}
          accent="orange"
        />
      </div>

      <div className="bg-white/80 border border-gray-100 rounded-2xl p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Top jobs by applicants</h3>
        {!data?.topJobs?.length ? (
          <p className="text-sm text-gray-500">No jobs posted yet. Add a job to get started.</p>
        ) : (
          <ul className="space-y-3">
            {data.topJobs.map((job, i) => (
              <li
                key={job.jobId}
                className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0"
              >
                <span className="text-sm text-gray-700">
                  <span className="font-semibold text-brand-orange mr-2">{i + 1}.</span>
                  {job.title}
                </span>
                <span className="text-sm font-bold text-gray-800">{job.applicantCount}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Link
        to="/dashboard/ai"
        className="inline-flex items-center gap-2 px-5 py-3 text-sm font-semibold text-white bg-brand-orange hover:bg-jl-accent rounded-xl transition-colors"
      >
        <Sparkles size={16} />
        Ask HireBot about these numbers
      </Link>
    </div>
  );
};

const StatCard = ({ icon: Icon, label, value, accent }) => {
  const colors = {
    orange: "bg-brand-orange/10 border-brand-orange/20 text-brand-orange",
    green: "bg-green-50 border-green-100 text-green-700",
  };

  return (
    <div className={`p-6 rounded-2xl border ${colors[accent]}`}>
      <Icon size={22} className="mb-3 opacity-80" />
      <p className="text-3xl font-bold">{value}</p>
      <p className="text-sm font-medium mt-1 opacity-80">{label}</p>
    </div>
  );
};

export default RecruiterAnalytics;
