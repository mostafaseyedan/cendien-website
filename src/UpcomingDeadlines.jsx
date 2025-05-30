
import React from 'react';

// Sub-component for rendering each deadline item
function UpcomingDeadlineItem({ deadline }) {
    // The .deadline-item class should be in your global CSS (src/index.css)
    // .deadline-item { border-left: 3px solid #007bff; }
    return (
        <div className="deadline-item p-3 rounded-md bg-gray-50">
            <p className="font-medium text-sm text-gray-700">{deadline.event} - {deadline.rfpName}</p>
            <p className="text-xs text-red-600 font-semibold">Due: {deadline.date}</p>
        </div>
    );
}

function UpcomingDeadlines({ deadlineDataArray = [] }) {
    if (!deadlineDataArray || deadlineDataArray.length === 0) {
        return <p className="text-gray-500">No upcoming deadlines.</p>;
    }

    return (
        <div className="space-y-3">
            {deadlineDataArray.map(deadline => (
                <UpcomingDeadlineItem key={deadline.id} deadline={deadline} />
            ))}
        </div>
    );
}

export default UpcomingDeadlines;
