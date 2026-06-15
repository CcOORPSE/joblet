import React, { useContext, useEffect, useState } from "react";
import axios from "axios";
import { AppContext } from "../context/AppContext";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { toast } from "react-toastify";
import { Shield, Briefcase, Users, FileText, AlertCircle } from "lucide-react";

const AdminPortal = () => {
  const { user, backendUrl } = useContext(AppContext);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);

  useEffect(() => {
    const fetchAdminMetrics = async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      try {
        const token = await user.getIdToken();
        const { data } = await axios.get(backendUrl + "/api/admin/metrics", {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (data.success) {
          setMetrics(data.metrics);
        } else {
          setAccessDenied(true);
          toast.error(data.message);
        }
      } catch (error) {
        if (error.response?.status === 403) {
          setAccessDenied(true);
        } else {
          toast.error("Failed to load admin metrics: " + error.message);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchAdminMetrics();
  }, [user, backendUrl]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-jl-bg">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-orange"></div>
      </div>
    );
  }

  if (accessDenied || !metrics) {
    return (
      <div className="min-h-screen flex flex-col justify-between bg-jl-bg">
        <Navbar />
        <div className="max-w-md mx-auto my-auto text-center p-8 bg-white border border-gray-100 rounded-2xl shadow-xl">
          <AlertCircle className="mx-auto text-red-500 mb-4 animate-bounce" size={48} />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-6">You do not have administrative privileges to access this area.</p>
          <button 
            onClick={() => window.location.href = "/"}
            className="w-full py-3 bg-gradient-to-r from-brand-orange to-orange-600 hover:from-brand-orange/95 hover:to-orange-700 text-white rounded-xl font-medium shadow-md transition-all duration-300"
          >
            Return to Home
          </button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col justify-between bg-jl-bg">
      <Navbar />
      <div className="max-w-6xl mx-auto my-12 px-6 w-full flex-grow">
        {/* Premium Dashboard Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="bg-gradient-to-br from-brand-orange to-orange-600 p-3 rounded-xl shadow-md">
            <Shield className="text-white" size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-gray-800 bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              Admin Control Panel
            </h1>
            <p className="text-gray-500 font-medium">Manage and audit Prodigy platform metrics</p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {/* Card 1 */}
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100/50 hover:shadow-md transition-all duration-300">
            <div className="flex justify-between items-center mb-4">
              <span className="text-gray-400 font-semibold uppercase tracking-wider text-xs">Total Active Jobs</span>
              <div className="bg-brand-orange/10 p-2 rounded-lg text-brand-orange">
                <Briefcase size={20} />
              </div>
            </div>
            <h3 className="text-4xl font-extrabold text-gray-800">{metrics?.totalJobs || 0}</h3>
          </div>

          {/* Card 2 */}
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100/50 hover:shadow-md transition-all duration-300">
            <div className="flex justify-between items-center mb-4">
              <span className="text-gray-400 font-semibold uppercase tracking-wider text-xs">Registered Talent</span>
              <div className="bg-green-50 p-2 rounded-lg text-green-600">
                <Users size={20} />
              </div>
            </div>
            <h3 className="text-4xl font-extrabold text-gray-800">{metrics?.totalUsers || 0}</h3>
          </div>

          {/* Card 3 */}
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100/50 hover:shadow-md transition-all duration-300">
            <div className="flex justify-between items-center mb-4">
              <span className="text-gray-400 font-semibold uppercase tracking-wider text-xs">Job Applications</span>
              <div className="bg-brand-orange/10 p-2 rounded-lg text-brand-orange">
                <FileText size={20} />
              </div>
            </div>
            <h3 className="text-4xl font-extrabold text-gray-800">{metrics?.totalApplications || 0}</h3>
          </div>
        </div>

        {/* Administration Table Mockup */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Admin Audit Trail</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 text-gray-400 text-sm font-semibold">
                  <th className="py-3 px-4">Entity</th>
                  <th className="py-3 px-4">Action Required</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="text-gray-600 text-sm">
                <tr className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
                  <td className="py-4 px-4 font-medium text-gray-800">Job Feed Indexing</td>
                  <td className="py-4 px-4">Audit active listings</td>
                  <td className="py-4 px-4"><span className="px-2.5 py-1 bg-green-50 text-green-700 text-xs font-semibold rounded-full">Healthy</span></td>
                </tr>
                <tr className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
                  <td className="py-4 px-4 font-medium text-gray-800">Database Engine</td>
                  <td className="py-4 px-4">Cloud Firestore Connection</td>
                  <td className="py-4 px-4"><span className="px-2.5 py-1 bg-brand-orange/10 text-brand-orange text-xs font-semibold rounded-full">Connected</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default AdminPortal;
