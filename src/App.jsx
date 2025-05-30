
import React, { useState, useEffect } from 'react';
import MessageModal from './MessageModal'; // Assuming MessageModal.jsx is in the same src/ folder

function App() {
    // Mock data - in a real app, this would come from state, props, or API calls
    const [userName, setUserName] = useState("Jane Doe"); // (mock data)

    // For the message modal
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMessage, setModalMessage] = useState('');

    // Data for child components - initially mock data
    const [recentRFPs, setRecentRFPs] = useState([ // (mock data)
        { id: 1, name: "Acme Corp Q3 IT Services", client: "Acme Corporation", status: "Analysis Complete", lastActivity: "2 days ago", statusClass: "status-analysis-complete" },
        { id: 2, name: "Global Tech Infrastructure RFP", client: "Global Tech", status: "Drafting", lastActivity: "5 hours ago", statusClass: "status-drafting" },
        { id: 3, name: "City Gov Public Works Project", client: "City Municipality", status: "Submitted", lastActivity: "1 week ago", statusClass: "status-submitted" },
        { id: 4, name: "Innovate Solutions Software Dev", client: "Innovate Ltd.", status: "Analysis Complete", lastActivity: "3 days ago", statusClass: "status-analysis-complete" }
    ]);
    const [upcomingDeadlines, setUpcomingDeadlines] = useState([ // (mock data)
        { id: 1, rfpName: "Global Tech", event: "Q&A Submission", date: "June 5, 2025" },
        { id: 2, rfpName: "Acme Corp Q3", event: "Proposal Due", date: "June 15, 2025" },
        { id: 3, rfpName: "Innovate Solutions", event: "Proposal Due", date: "June 22, 2025" }
    ]);

    const currentYear = new Date().getFullYear();

    const showModalWithMessage = (message) => {
        setModalMessage(message);
        setIsModalOpen(true);
    };

    const handleUploadRFPClick = () => {
        showModalWithMessage('"Upload New RFP" button clicked. This would typically lead to the RFP upload screen.');
        // In a full SPA, you would navigate to a different route/component here.
        // For now, we'll imagine this means showing the UploadRFPPage component.
        // setCurrentPage('upload'); // Example of how you might manage views
    };

    const handleUserProfileClick = () => {
        showModalWithMessage('User Profile / Settings clicked. This would open a profile menu or settings page.');
    };
    
    const handleHelpClick = (e) => {
        e.preventDefault();
        showModalWithMessage('Help link clicked. This would navigate to a help/documentation page.');
    };

    const handleContactSupportClick = (e) => {
        e.preventDefault();
        showModalWithMessage('Contact Support link clicked. This would open a support channel or contact form.');
    };

    // useEffect to fetch real data would go here in a full application
    // useEffect(() => {
    //    fetchRecentRFPs().then(data => setRecentRFPs(data));
    //    fetchUpcomingDeadlines().then(data => setUpcomingDeadlines(data));
    // }, []);


    return (
        <div className="flex flex-col min-h-screen"> {/* Based on body class from HTML */}
            <header className="header-bg shadow-md sticky top-0 z-50"> {/* */}
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center">
                            <span className="text-2xl font-bold text-blue-600">RFP Analyzer Pro</span>
                        </div>
                        <div className="flex items-center">
                            <button 
                                id="userProfileButton" 
                                onClick={handleUserProfileClick}
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
                    <div className="lg:col-span-2 space-y-6 p-6 rounded-lg card"> {/* */}
                        <h1 id="welcomeMessage" className="text-3xl font-semibold welcome-text">{`Welcome, ${userName}!`}</h1>
                        <p className="text-lg feature-text">Ready to streamline your RFP process with AI?</p>
                        
                        <button 
                            id="uploadRFPButton" 
                            onClick={handleUploadRFPClick}
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

                    <div className="space-y-6">
                        <section className="p-6 rounded-lg card">
                            <h2 className="text-xl font-semibold welcome-text mb-4">Recent RFPs</h2>
                            <div id="recentRFPsContainer" className="space-y-4">
                                {/* <RecentRfpList rfpDataArray={recentRFPs} /> You will uncomment and use this later */}
                                <p className="text-gray-500">Recent RFP list will load here via component...</p>

                            </div>
                             <p className="text-sm text-gray-500 mt-4">This section displays your most recently accessed or updated RFPs. Quickly jump back into drafting a response or view the analysis details. Status indicators provide an at-a-glance understanding of where each RFP stands in your workflow.</p>
                        </section>

                        <section className="p-6 rounded-lg card">
                            <h2 className="text-xl font-semibold welcome-text mb-4">Upcoming Deadlines</h2>
                            <div id="upcomingDeadlinesContainer" className="space-y-3">
                                {/* <UpcomingDeadlines deadlineDataArray={upcomingDeadlines} /> You will uncomment and use this later */}
                                <p className="text-gray-500">Upcoming deadlines will load here via component...</p>
                            </div>
                            <p className="text-sm text-gray-500 mt-4">Stay on top of your schedule. This widget highlights critical upcoming deadlines extracted from your active RFPs, helping you prioritize tasks and ensure timely submissions. Dates are automatically identified by the AI during analysis.</p>
                        </section>
                    </div>
                </div>
            </main>

            <footer className="footer-bg py-6 text-center"> {/* */}
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <nav className="flex justify-center space-x-4">
                        <a href="#" id="helpLink" onClick={handleHelpClick} className="text-gray-600 hover:text-blue-600">Help</a>
                        <a href="#" id="contactSupportLink" onClick={handleContactSupportClick} className="text-gray-600 hover:text-blue-600">Contact Support</a>
                    </nav>
                    <p className="text-sm text-gray-500 mt-2">&copy; <span id="currentYear">{currentYear}</span> RFP Analyzer Pro. All rights reserved.</p>
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
