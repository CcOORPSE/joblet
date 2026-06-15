import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const JobPerfCard = ({ jobId, backendUrl }) => {
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchJob = async () => {
      try {
        const { data } = await axios.get(`${backendUrl}/api/jobs/${jobId}`);
        if (data.success) setJob(data.job);
      } catch {
        setJob(null);
      } finally {
        setLoading(false);
      }
    };
    fetchJob();
  }, [jobId, backendUrl]);

  if (loading) {
    return <div className="my-2 p-4 bg-gray-50 rounded-xl animate-pulse h-20" />;
  }

  if (!job) {
    return (
      <div className="my-2 p-3 bg-amber-50 border border-amber-100 rounded-xl text-sm text-amber-700">
        Job unavailable
      </div>
    );
  }

  return (
    <div className="my-3 p-4 bg-white border border-jl-border rounded-2xl shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <h4 className="font-bold text-gray-800">{job.title}</h4>
        <span
          className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
            job.visible !== false ? "bg-green-50 text-green-600" : "bg-gray-100 text-gray-500"
          }`}
        >
          {job.visible !== false ? "Live" : "Hidden"}
        </span>
      </div>
      <p className="text-sm text-gray-500 mt-1">{job.location || "Remote"}</p>
      <button
        type="button"
        onClick={() => navigate("/dashboard/manage-job")}
        className="mt-3 w-full py-2 text-sm font-semibold text-brand-orange border border-brand-orange/30 hover:bg-brand-orange/10 rounded-xl transition-colors"
      >
        Manage job
      </button>
    </div>
  );
};

export default JobPerfCard;
