import React, { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import moment from "moment";
import { AppContext } from "../../context/AppContext";

const ApplicantCard = ({ applicationId, backendUrl }) => {
  const navigate = useNavigate();
  const { getRecruiterAuthHeaders } = useContext(AppContext);
  const [app, setApp] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchApp = async () => {
      try {
        const headers = await getRecruiterAuthHeaders();
        const { data } = await axios.get(`${backendUrl}/api/company/application/${applicationId}`, { headers });
        if (data.success) setApp(data.application);
      } catch {
        setApp(null);
      } finally {
        setLoading(false);
      }
    };
    fetchApp();
  }, [applicationId, backendUrl, getRecruiterAuthHeaders]);

  if (loading) {
    return (
      <div className="my-2 p-4 bg-gray-50 border border-gray-100 rounded-xl animate-pulse h-24" />
    );
  }

  if (!app) {
    return (
      <div className="my-2 p-4 bg-gray-50 border border-gray-100 rounded-xl text-sm text-gray-500">
        Application not found
      </div>
    );
  }

  const name = app.userDetails?.name || app.userId?.name || "Applicant";
  const jobTitle = app.jobDetails?.title || app.jobId?.title || "Position";
  const status = app.status || "pending";

  return (
    <div
      className="my-2 p-4 bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => navigate(`/dashboard/view-applications?highlight=${applicationId}`)}
    >
      <div className="flex justify-between items-start">
        <div>
          <p className="font-semibold text-gray-800">{name}</p>
          <p className="text-sm text-gray-500">{jobTitle}</p>
          <p className="text-xs text-gray-400 mt-1">{moment(app.date).fromNow()}</p>
        </div>
        <span className="text-xs font-medium px-2 py-1 rounded-full bg-brand-orange/10 text-brand-orange capitalize">
          {status}
        </span>
      </div>
    </div>
  );
};

export default ApplicantCard;
