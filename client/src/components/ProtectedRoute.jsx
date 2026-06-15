import React, { useContext } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { AppContext } from "../context/AppContext";

/**
 * Route guard for role-separated areas.
 * - Applicant `/app/*` and user-only routes: require login; block recruiters
 * - Recruiter `/dashboard/*`: requires recruiter session (companyToken)
 */
const ProtectedRoute = ({ children, role = "applicant" }) => {
  const { user, companyToken } = useContext(AppContext);
  const location = useLocation();

  if (role === "recruiter") {
    if (!companyToken) {
      return <Navigate to="/" replace state={{ from: location }} />;
    }
    return children;
  }

  if (companyToken) {
    return <Navigate to="/dashboard/manage-job" replace />;
  }

  if (!user) {
    return (
      <Navigate
        to="/"
        replace
        state={{ from: location, openLogin: true }}
      />
    );
  }

  return children;
};

export default ProtectedRoute;
