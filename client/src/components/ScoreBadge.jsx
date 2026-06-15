import React from 'react';

const ScoreBadge = ({ score }) => {
  let badgeColor = '';
  let badgeText = '';

  if (score > 70) {
    badgeColor = 'bg-emerald-100 text-emerald-800';
    badgeText = 'Strong';
  } else if (score > 49) {
    badgeColor = 'bg-amber-100 text-amber-800';
    badgeText = 'Good Start';
  } else {
    badgeColor = 'bg-rose-100 text-rose-800';
    badgeText = 'Needs Work';
  }

  return (
    <div className={`px-3 py-1 rounded-full ${badgeColor} inline-block`}>
      <p className="text-xs font-semibold uppercase tracking-wider">{badgeText}</p>
    </div>
  );
};

export default ScoreBadge;
