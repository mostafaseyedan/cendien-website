
import React from 'react';

// Sub-component for rendering each RFP item
function RecentRfpItem({ rfp, onViewDetails, onContinueDrafting }) {
    // Helper to map statusClass from mock data to Tailwind text colors
    // You should define these status classes in your global CSS (src/index.css)
    // e.g., .status-analysis-complete { color: #28a745; }
    // Alternatively, apply Tailwind classes directly based on rfp.status
    const getStatusTextColor = (statusClass) => {
        if (statusClass === 'status-analysis-complete') return 'text-green-600'; // Tailwind's green
        if (statusClass === 'status-drafting') return 'text-yellow-600'; // Tailwind's yellow/amber
        if (statusClass === 'status-submitted') return 'text-blue-600'; // Tailwind's blue/cyan
        return 'text-gray-600'; // Default
    };

    return (
        <div className="p-4 rounded-md border border-gray-200 bg-white hover:shadow-lg transition-shadow duration-200">
            <h3 className="font-semibold text-md text-blue-700">{rfp.name}</h3>
            <p className="text-sm text-gray-600">Client: {rfp.client}</p>
            <p className={`text-sm ${getStatusTextColor(rfp.statusClass)}`}>Status: {rfp.status}</p>
            <p className="text-xs text-gray-500 mt-1">Last activity: {rfp.lastActivity}</p>
            <div className="mt-3 flex space-x-2">
                <button 
                    className="text-xs secondary-button py-1 px-3 rounded-md" // Using your .secondary-button class
                    onClick={() => onViewDetails(rfp.id)}
                >
                    View Details
                </button>
                <button 
                    className="text-xs primary-button py-1 px-3 rounded-md" // Using your .primary-button class
                    onClick={() => onContinueDrafting(rfp.id)}
                >
                    Continue Drafting
                </button>
            </div>
        </div>
    );
}

function RecentRfpList({ rfpDataArray = [], onViewDetailsClick, onContinueDraftingClick }) {
    if (!rfpDataArray || rfpDataArray.length === 0) {
        return <p className="text-gray-500">No recent RFPs to display.</p>;
    }

    return (
        <div className="space-y-4">
            {rfpDataArray.map(rfp => (
                <RecentRfpItem 
                    key={rfp.id} 
                    rfp={rfp} 
                    onViewDetails={onViewDetailsClick}
                    onContinueDrafting={onContinueDraftingClick}
                />
            ))}
        </div>
    );
}

export default RecentRfpList;
