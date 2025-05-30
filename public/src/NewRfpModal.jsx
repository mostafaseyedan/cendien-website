import React, { useState } from 'react';

function NewRfpModal({ isOpen, onClose, onSubmitRfpData }) {
    // States for form inputs based on your original HTML form
    const [rfpTitle, setRfpTitle] = useState('');
    const [rfpType, setRfpType] = useState('IT Support'); // Default value from your HTML
    const [submittedBy, setSubmittedBy] = useState('Aish'); // Default value
    const [rfpFile, setRfpFile] = useState(null);
    const [addendumFiles, setAddendumFiles] = useState([]); // For multiple addendums

    // Placeholder for status messages within the modal
    const [statusMessage, setStatusMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    if (!isOpen) {
        return null;
    }

    const handleMainFileChange = (event) => {
        setRfpFile(event.target.files[0]);
    };

    const handleAddendumFilesChange = (event) => {
        setAddendumFiles(Array.from(event.target.files));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (!rfpFile) {
            setStatusMessage("Please upload the main RFP document.");
            return;
        }
        setIsLoading(true);
        setStatusMessage('Processing your RFP...');

        // Pass the collected data to the parent component (App.jsx)
        // The actual submission logic (PDF processing, AI call, saving)
        // will be handled in the function passed as `onSubmitRfpData`
        await onSubmitRfpData({
            rfpTitle: rfpTitle || rfpFile.name, // Use file name if title is empty
            rfpType,
            submittedBy,
            rfpFile, // This is a File object
            addendumFiles, // This is an array of File objects
        });
        
        setIsLoading(false);
        // setStatusMessage('RFP analysis submitted!'); // Or set by parent
        // resetFormAndClose(); // Or parent can decide to close
    };

    const resetFormAndClose = () => {
        setRfpTitle('');
        setRfpType('IT Support');
        setSubmittedBy('Aish');
        setRfpFile(null);
        setAddendumFiles([]);
        setStatusMessage('');
        setIsLoading(false);
        // Clear file input fields visually (important for UX)
        const rfpFileInput = document.getElementById('rfpFileUpload-react');
        if (rfpFileInput) rfpFileInput.value = "";
        const addendumInput = document.getElementById('rfpAddendumUpload-react');
        if (addendumInput) addendumInput.value = "";
        onClose();
    };

    return (
        <div className="modal-overlay" onClick={resetFormAndClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}> {/* Prevents closing when clicking inside */}
                <span className="modal-close-button" onClick={resetFormAndClose}>&times;</span>
                <h2 id="modal-title">Analyze New RFP</h2>
                
                <form id="rfp-details-form-react" onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="rfpTitle-react">RFP Title (Optional):</label>
                        <input 
                            type="text" 
                            id="rfpTitle-react" 
                            value={rfpTitle} 
                            onChange={(e) => setRfpTitle(e.target.value)} 
                            disabled={isLoading}
                            placeholder="Enter a Title for this RFP"
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="rfpType-react">RFP Type:</label>
                        <select 
                            id="rfpType-react" 
                            value={rfpType} 
                            onChange={(e) => setRfpType(e.target.value)} 
                            disabled={isLoading}
                            className="section-selector"
                        >
                            <option value="IT Support">IT Support</option>
                            <option value="IT Staffing">IT Staffing</option>
                            <option value="ERP Managed Services">ERP Managed Services</option>
                            <option value="Custom Software Development">Custom Software Development</option>
                            <option value="Cloud Migration">Cloud Migration</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label htmlFor="submittedBy-react">Person Submitting / Analyzing:</label>
                        <select 
                            id="submittedBy-react" 
                            value={submittedBy} 
                            onChange={(e) => setSubmittedBy(e.target.value)} 
                            disabled={isLoading}
                            className="section-selector"
                        >
                            <option value="Aish">Aish</option>
                            <option value="Helen">Helen</option>
                            <option value="Shirley">Shirley</option>
                            <option value="Israel">Israel</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label htmlFor="rfpFileUpload-react">Upload Main RFP Document (PDF only):</label>
                        <input 
                            type="file" 
                            id="rfpFileUpload-react" 
                            accept=".pdf" 
                            required 
                            onChange={handleMainFileChange} 
                            disabled={isLoading}
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="rfpAddendumUpload-react">Upload Addendum(s) (Optional, PDFs only):</label>
                        <input 
                            type="file" 
                            id="rfpAddendumUpload-react" 
                            accept=".pdf" 
                            multiple 
                            onChange={handleAddendumFilesChange} 
                            disabled={isLoading}
                        />
                    </div>

                    {/* This area will display status or results eventually */}
                    <div id="modal-analysis-status-area-react" className="loading-container" style={{ display: isLoading || statusMessage ? 'flex' : 'none', marginTop: '1rem' }}>
                        {isLoading && <div className="spinner"></div>}
                        <p className="loading-text">{statusMessage}</p>
                    </div>
                    
                    {/* Placeholder for where analysis results tabs would go if shown in this modal */}
                    {/* <div id="modal-analysis-results-area-react" style={{ marginTop: '2.5rem', display: 'none' }}> ... </div> */}

                    <button type="submit" className="btn btn-secondary" disabled={isLoading}>
                        {isLoading ? "Analyzing..." : "Analyze RFP"}
                    </button>
                </form>
            </div>
        </div>
    );
}

export default NewRfpModal;
