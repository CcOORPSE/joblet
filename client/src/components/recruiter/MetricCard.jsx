import React from "react";

const LABELS = {
  applications: "Applications",
  pending: "Pending review",
  interviews: "Interviews",
  open_jobs: "Open jobs",
};

const MetricCard = ({ type, value }) => (
  <div className="inline-flex flex-col min-w-[120px] p-4 rounded-xl border border-jl-border bg-brand-orange/10 my-2 mr-2">
    <span className="text-2xl font-bold text-brand-orange">{value}</span>
    <span className="text-xs font-medium text-brand-orange mt-1">
      {LABELS[type] || type.replace(/_/g, " ")}
    </span>
  </div>
);

export default MetricCard;
