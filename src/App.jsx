// mostafaseyedan/cendien-website/Dev/src/App.jsx
import React, { useState, useEffect } from 'react';
import MessageModal from './MessageModal';
import RecentRfpList from './RecentRfpList'; // We'll make sure this handles props correctly
import UpcomingDeadlines from './UpcomingDeadlines'; // We'll make sure this handles props correctly

// Assuming your Tailwind setup and global styles (from your new HTML designs)
// are in a CSS file imported in main.jsx (e.g., src/index.css).

function App() {
    const [userName, setUserName] = useState("User"); // Replace with actual user data logic later

    // For the message modal
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMessage, setModalMessage] = useState('');

    // State for fetched data
    const [recentRFPs, setRecentRFPs] = useState([]);
    const [upcomingDeadlines, setUpcomingDeadlines] = useState([]);
    const [isLoadingRFPs, setIsLoadingRFPs] = useState(true);
    const [isLoadingDeadlines, setIsLoadingDeadlines] = useState(true);

    const currentYear = new Date().getFullYear();

    const showModalWithMessage = (message) => {
        setModalMessage(message);
        setIsModalOpen(true);
    };

    // Simulate navigation to different pages/components
    const navigateTo = (pageName) => {
        showModalWithMessage(`Simulating navigation to: ${pageName}`);
        // In a real SPA, you'd use React Router or similar here.
        // For now, this will just show a message.
        // Example: if (pageName === 'upload') setCurrentView(<UploadRfpScreen />);
    };
    
    // Fetch Recent RFPs
    useEffect(() => {
        setIsLoadingRFPs(true);
        fetch('/api/rfp-analyses') // Your existing API endpoint
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to fetch RFPs');
                }
                return response.json();
            })
            .then(data => {
                // Assuming the API returns an array of RFPs
                // You might need to adapt the data structure to match what RecentRfpList expects
                // or adapt RecentRfpList to the API structure.
                // For now, let's add the statusClass based on status.
                const formattedData = data.map(rfp => ({
                    ...rfp,
                    id: rfp.id, // Ensure 'id' is present for keys
                    name: rfp.rfpTitle || rfp.rfpFileName,
                    client: rfp.submittedBy || "N/A", // Or another client field if available
                    status: rfp.status || "Unknown",
                    lastActivity: rfp.analysisDate ? new Date(rfp.analysisDate._seconds * 1000).toLocaleDateString() : "N/A",
                    statusClass: rfp.status === 'analyzed' || rfp.status === 'active' ? 'status-analysis-complete' : rfp.status === 'drafting' ? 'status-drafting' : 'status-submitted'
                }));
                setRecentRFPs(formattedData.slice(0, 4)); // Displaying a few, like in mock
                setIsLoadingRFPs(false);
            })
            .catch(error => {
                console.error("Error fetching recent RFPs:", error);
                showModalWithMessage(`Error fetching recent RFPs: ${error.message}`);
                setIsLoadingRFPs(false);
                setRecentRFPs([]); // Ensure it's an empty array on error
            });
    }, []);

    // Fetch Upcoming Deadlines (Placeholder - you'll need an API or derive this)
    useEffect(() => {
        setIsLoadingDeadlines(true);
        // Placeholder: In a real app, you'd fetch this or derive it from full RFP data
        // For now, using a timeout to simulate fetch & an empty array
        setTimeout(() => {
            const mockDeadlines = [ // Using mock data structure for now
                 { id: 1, rfpName: "Global Tech (from API)", event: "Q&A Submission", date: "June 5, 2025" },
                 { id: 2, rfpName: "Acme Corp Q3 (from API)", event: "Proposal Due", date: "June 15, 2025" },
            ];
            setUpcomingDeadlines(mockDeadlines); // Or an empty array if no API yet: setUpcomingDeadlines([]);
            setIsLoadingDeadlines(false);
        }, 1500);
    }, []);


    return (
        <div className="flex flex-col min-h-screen bg-gray-100"> {/* body background from new HTML */}
            <header className="bg-white shadow-md sticky top-0 z-50"> {/* header-bg from new HTML */}
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center">
                            <span className="text-2xl font-bold text-blue-600">RFP Analyzer Pro</span>
                        </div>
                        <div className="flex items-center">
                            <button 
                                id="userProfileButton" 
                                onClick={() => showModalWithMessage('User Profile / Settings clicked.')}
                                className="p-2 rounded-full hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500" 
                                aria-label="User Profile and Settings"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6 text-gray-600">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Welcome and Action Section */}
                    <div className="lg:col-span-2 space-y-6 p-6 rounded-lg card">
                        <h1 className="text-3xl font-semibold welcome-text">{`Welcome, ${userName}!`}</h1>
                        <p className="text-lg feature-text">Ready to streamline your RFP process with AI?</p>
                        
                        <button 
                            onClick={() => navigateTo('UploadRFP')} // Updated action
                            className="w-full sm:w-auto primary-button font-medium py-3 px-6 rounded-lg text-lg shadow-md hover:shadow-lg flex items-center justify-center space-x-2"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 0 1-1.41-8.775 5.25 5.25 0 0 1 10.338-2.32 3.75 3.75 0 0 1 1.036 7.498M19.5 19.5a2.25 2.25 0 0 0-2.25-2.25H6.75A2.25 2.25 0 0 0 4.5 19.5Z" />
                            </svg>
                            <span>Upload New RFP</span>
                        </button>

                        <div>
                            <h2 className="text-xl font-semibold welcome-text mb-3">Key Features:</h2>
                            <ul className="list-disc list-inside space-y-1 feature-text">
                                <li>AI-powered requirement extraction</li>
                                <li>Automated compliance checks</li>
                                <li>Collaborative task management</li>
                                <li>Customizable report generation</li>
                            </ul>
                        </div>
                        <p className="text-sm text-gray-500 mt-4">This dashboard provides a central hub for managing your Request for Proposals. Upload new RFPs for AI analysis, track the progress of ongoing responses, and access key insights to improve your bidding strategy. Click 'Upload New RFP' to begin, or review your recent activity on the right.</p>
                    </div>

                    {/* Sidebar Section with Recent RFPs and Upcoming Deadlines */}
                    <div className="space-y-6">
                        <section className="p-6 rounded-lg card">
                            <h2 className="text-xl font-semibold welcome-text mb-4">Recent RFPs</h2>
                            {isLoadingRFPs ? (
                                <p className="text-gray-500">Loading recent RFPs...</p>
                            ) : (
                                <RecentRfpList 
                                    rfpDataArray={recentRFPs} 
                                    onViewDetailsClick={(rfpId) => navigateTo(`ViewDetails/${rfpId}`)}
                                    onContinueDraftingClick={(rfpId) => navigateTo(`DraftRFP/${rfpId}`)}
                                />
                            )}
                            <p className="text-sm text-gray-500 mt-4">This section displays your most recently accessed or updated RFPs...</p>
                        </section>

                        <section className="p-6 rounded-lg card">
                            <h2 className="text-xl font-semibold welcome-text mb-4">Upcoming Deadlines</h2>
                            {isLoadingDeadlines ? (
                                <p className="text-gray-500">Loading upcoming deadlines...</p>
                            ) : (
                                <UpcomingDeadlines deadlineDataArray={upcomingDeadlines} />
                            )}
                            <p className="text-sm text-gray-500 mt-4">Stay on top of your schedule...</p>
                        </section>
                    </div>
                </div>
            </main>

            <footer className="footer-bg py-6 text-center">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <nav className="flex justify-center space-x-4">
                        <a href="#" onClick={(e) => {e.preventDefault(); showModalWithMessage('Help link clicked.')}} className="text-gray-600 hover:text-blue-600">Help</a>
                        <a href="#" onClick={(e) => {e.preventDefault(); showModalWithMessage('Contact Support link clicked.')}} className="text-gray-600 hover:text-blue-600">Contact Support</a>
                    </nav>
                    <p className="text-sm text-gray-500 mt-2">&copy; {currentYear} RFP Analyzer Pro. All rights reserved.</p>
                </div>
            </footer>

            <MessageModal 
                isOpen={isModalOpen}
                message={modalMessage}
                onClose={() => setIsModalOpen(false)}
            />
        </div>
    );
}

export default App;
