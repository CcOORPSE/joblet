import React, { useContext } from "react";
import { Route, Routes, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import Applications from "./pages/Applications";
import ApplyJob from "./pages/ApplyJob";
import RecruiterLogin from "./components/RecruiterLogin";
import { AppContext } from "./context/AppContext";
import Dashboard from "./pages/Dashboard";
import AddJob from "./pages/AddJob";
import ManageJobs from "./pages/ManageJobs";
import ViewApplications from "./pages/ViewApplications";
import AdminPortal from "./pages/AdminPortal";
import ResumeAnalyzer from "./pages/ResumeAnalyzer";
import ResumeReport from "./pages/ResumeReport";
import Chatbot from "./pages/Chatbot";
import ProtectedRoute from "./components/ProtectedRoute";
import AppShell from "./layouts/AppShell";
import ApplicantChat from "./pages/applicant/ApplicantChat";
import ApplicantJobs from "./pages/applicant/ApplicantJobs";
import ActivityPanel from "./pages/applicant/ActivityPanel";
import RecruiterChat from "./pages/recruiter/RecruiterChat";
import AssignInterview from "./pages/recruiter/AssignInterview";
import MockPreparation from "./pages/applicant/MockPreparation";
import ErrorBoundary from "./components/ErrorBoundary";
import "quill/dist/quill.snow.css";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const App = () => {
  const { showRecruiterLogin } = useContext(AppContext);

  return (
    <div>
      {showRecruiterLogin && <RecruiterLogin />}
      <ToastContainer />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/apply-job/:id" element={<ApplyJob />} />
        <Route path="/recruiter-login" element={<RecruiterLogin />} />
        <Route
          path="/applications"
          element={
            <ProtectedRoute role="user-only">
              <Applications />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute role="user-only">
              <AdminPortal />
            </ProtectedRoute>
          }
        />
        <Route
          path="/resume-analyzer"
          element={
            <ProtectedRoute role="user-only">
              <ResumeAnalyzer />
            </ProtectedRoute>
          }
        />
        <Route
          path="/resume-analyzer/report/:id"
          element={
            <ProtectedRoute role="user-only">
              <ResumeReport />
            </ProtectedRoute>
          }
        />
        <Route path="/chatbot" element={<Chatbot />} />
        <Route
          path="/app"
          element={
            <ProtectedRoute role="applicant">
              <ErrorBoundary>
                <AppShell />
              </ErrorBoundary>
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="chat" replace />} />
          <Route path="chat" element={<ApplicantChat />} />
          <Route path="jobs" element={<ApplicantJobs />} />
          <Route path="preparation" element={<MockPreparation />} />
          <Route path="activity" element={<ActivityPanel />} />
        </Route>
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute role="recruiter">
              <ErrorBoundary>
                <Dashboard />
              </ErrorBoundary>
            </ProtectedRoute>
          }
        >
          <Route path="add-job" element={<AddJob />} />
          <Route path="manage-job" element={<ManageJobs />} />
          <Route path="view-applications" element={<ViewApplications />} />
          <Route path="assign-interview" element={<AssignInterview />} />
          <Route path="ai" element={<RecruiterChat />} />
        </Route>
      </Routes>
    </div>
  );
};

export default App;
