import React from 'react';

export interface TreatmentTimelineViewProps {
  treatments?: {
    medications?: string[];
    procedures?: string[];
    interventions?: string[];
    timeline?: Array<{ date: string; action: string }>;
  };
}

export const TreatmentTimelineView: React.FC<TreatmentTimelineViewProps> = ({ treatments }) => {
  if (!treatments) return <div>No treatment data available.</div>;
  return (
    <div className="space-y-2">
      <h3 className="font-semibold mb-1">Treatment Timeline</h3>
      {treatments.timeline && treatments.timeline.length > 0 ? (
        <ul className="list-disc pl-6">
          {treatments.timeline.map((item, idx) => (
            <li key={idx}>
              <span className="font-mono text-xs text-gray-500">{item.date}:</span> {item.action}
            </li>
          ))}
        </ul>
      ) : (
        <div>No timeline data.</div>
      )}
      {treatments.medications && treatments.medications.length > 0 && (
        <div>
          <span className="font-semibold">Medications:</span> {treatments.medications.join(', ')}
        </div>
      )}
      {treatments.procedures && treatments.procedures.length > 0 && (
        <div>
          <span className="font-semibold">Procedures:</span> {treatments.procedures.join(', ')}
        </div>
      )}
      {treatments.interventions && treatments.interventions.length > 0 && (
        <div>
          <span className="font-semibold">Interventions:</span> {treatments.interventions.join(', ')}
        </div>
      )}
    </div>
  );
}; 