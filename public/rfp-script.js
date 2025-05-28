import * as pdfjsLib from 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/5.0.375/pdf.min.mjs';

pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/5.0.375/pdf.worker.min.mjs';

document.addEventListener('DOMContentLoaded', () => {
    // --- MODAL Elements (for New RFP Analysis) ---
    const newRfpModal = document.getElementById('new-rfp-modal');
    const openNewRfpModalButton = document.getElementById('open-new-rfp-modal-button');
    const modalCloseButton = document.getElementById('modal-close-button');
    const modalFormTitle = document.getElementById('modal-title'); 
    
    const rfpForm = document.getElementById('rfp-details-form'); // Inside modal
    const rfpFileUpload = document.getElementById('rfpFileUpload'); // Inside modal
    const generateAnalysisButton = document.getElementById('generate-analysis-button'); // Inside modal
    const modalAnalysisStatusArea = document.getElementById('modal-analysis-status-area'); 
    const modalAnalysisResultsArea = document.getElementById('modal-analysis-results-area');

    // Modal's result tab content divs
    const modalSummaryResultContentDiv = document.getElementById('modal-summary-result-content');
    const modalQuestionsResultContentDiv = document.getElementById('modal-questions-result-content');
    const modalDeadlinesOnlyContentDiv = document.getElementById('modal-deadlines-only-content');
    const modalSubmissionFormatContentDiv = document.getElementById('modal-submission-format-content');
    const modalRequirementsResultContentDiv = document.getElementById('modal-requirements-result-content');
    const modalStakeholdersResultContentDiv = document.getElementById('modal-stakeholders-result-content');
    const modalRisksResultContentDiv = document.getElementById('modal-risks-result-content');
    const modalRegistrationResultContentDiv = document.getElementById('modal-registration-result-content');
    const modalLicensesResultContentDiv = document.getElementById('modal-licenses-result-content');
    const modalBudgetResultContentDiv = document.getElementById('modal-budget-result-content');

    // --- MAIN PAGE Elements (for Viewing Saved RFP Details) ---
    const viewSavedRfpDetailsSection = document.getElementById('view-saved-rfp-details-section');
    const viewRfpMainTitleHeading = document.getElementById('view-rfp-main-title-heading');
    const closeViewRfpDetailsButton = document.getElementById('close-view-rfp-details-button');
    const viewRfpStatusArea = document.getElementById('view-rfp-status-area');
    const viewAnalysisResultsArea = document.getElementById('view-analysis-results-area');

    // Main page's view result tab content divs
    const viewSummaryResultContentDiv = document.getElementById('view-summary-result-content');
    const viewQuestionsResultContentDiv = document.getElementById('view-questions-result-content');
    const viewDeadlinesOnlyContentDiv = document.getElementById('view-deadlines-only-content');
    const viewSubmissionFormatContentDiv = document.getElementById('view-submission-format-content');
    const viewRequirementsResultContentDiv = document.getElementById('view-requirements-result-content');
    const viewStakeholdersResultContentDiv = document.getElementById('view-stakeholders-result-content');
    const viewRisksResultContentDiv = document.getElementById('view-risks-result-content');
    const viewRegistrationResultContentDiv = document.getElementById('view-registration-result-content');
    const viewLicensesResultContentDiv = document.getElementById('view-licenses-result-content');
    const viewBudgetResultContentDiv = document.getElementById('view-budget-result-content');
    
    // --- SAVED RFP LIST Elements (on main page) ---
    const savedAnalysesListDiv = document.getElementById('saved-analyses-list');
    const noSavedAnalysesP = document.getElementById('no-saved-analyses');
    const rfpListTabsContainer = document.querySelector('.rfp-list-tabs');
    const rfpListStatusArea = document.getElementById('rfp-list-status-area'); // For list operations like delete/status change
    const yearSpanRFP = document.getElementById('current-year-rfp');

    // --- State Variables ---
    let allFetchedAnalyses = []; 
    let currentSortKey = 'analysisDate'; 
    let currentSortOrder = 'desc'; 
    let currentStatusFilter = 'all'; 

    if (yearSpanRFP && !yearSpanRFP.textContent) {
        yearSpanRFP.textContent = new Date().getFullYear();
    }

    // --- Modal Handling ---
    if (openNewRfpModalButton) {
        openNewRfpModalButton.addEventListener('click', () => {
            if (newRfpModal) {
                if (rfpForm) rfpForm.reset();
                if (modalAnalysisResultsArea) modalAnalysisResultsArea.style.display = 'none';
                if (modalAnalysisStatusArea) modalAnalysisStatusArea.style.display = 'none';
                clearModalAnalysisResultTabs(); 
                if (modalFormTitle) modalFormTitle.textContent = "Analyze New RFP";
                if (viewSavedRfpDetailsSection) viewSavedRfpDetailsSection.style.display = 'none'; // Hide main page view section
                newRfpModal.style.display = 'block';
            }
        });
    }
    if (modalCloseButton) {
        modalCloseButton.addEventListener('click', () => {
            if (newRfpModal) newRfpModal.style.display = 'none';
        });
    }
    if (newRfpModal) {
        newRfpModal.addEventListener('click', (event) => { 
            if (event.target === newRfpModal) {
                newRfpModal.style.display = 'none';
            }
        });
    }
    if (closeViewRfpDetailsButton) {
        closeViewRfpDetailsButton.addEventListener('click', () => {
            if(viewSavedRfpDetailsSection) viewSavedRfpDetailsSection.style.display = 'none';
        });
    }

    // --- Helper: Clear Tab Content ---
    function clearModalAnalysisResultTabs() {
        const contentDivs = [
            modalSummaryResultContentDiv, modalQuestionsResultContentDiv,
            modalDeadlinesOnlyContentDiv, modalSubmissionFormatContentDiv,
            modalRequirementsResultContentDiv, modalStakeholdersResultContentDiv,
            modalRisksResultContentDiv, modalRegistrationResultContentDiv,
            modalLicensesResultContentDiv, modalBudgetResultContentDiv
        ];
        contentDivs.forEach(div => { if (div) div.innerHTML = ''; });
    }
    function clearViewAnalysisResultTabs() {
         const contentDivs = [
            viewSummaryResultContentDiv, viewQuestionsResultContentDiv,
            viewDeadlinesOnlyContentDiv, viewSubmissionFormatContentDiv,
            viewRequirementsResultContentDiv, viewStakeholdersResultContentDiv,
            viewRisksResultContentDiv, viewRegistrationResultContentDiv,
            viewLicensesResultContentDiv, viewBudgetResultContentDiv
        ];
        contentDivs.forEach(div => { if (div) div.innerHTML = ''; });
    }

    // --- Helper: Show/Hide Loading/Status Messages ---
    function showLoadingMessage(areaElement, message = "Processing...", showSpinner = true) {
        if (!areaElement) return;
        areaElement.style.display = 'flex'; // Make it visible
        areaElement.innerHTML = `
            ${showSpinner ? '<div class="spinner"></div>' : ''}
            <p class="loading-text">${message}</p>`;
        // Disable analysis button only if it's the modal's status area for a new analysis
        if (areaElement === modalAnalysisStatusArea && generateAnalysisButton && showSpinner) {
            generateAnalysisButton.disabled = true;
        }
    }
    function hideLoadingMessage(areaElement, delay = 0) {
        setTimeout(() => {
            if (areaElement && (areaElement.innerHTML.includes('loading-text') || areaElement.innerHTML.includes('spinner'))) {
                areaElement.style.display = 'none';
                areaElement.innerHTML = '';
            }
             // Re-enable analysis button only if it's the modal's status area
            if (areaElement === modalAnalysisStatusArea && generateAnalysisButton) {
                 generateAnalysisButton.disabled = false;
            }
        }, delay);
    }
    
    // --- PDF Extraction & Content Formatting ---
    async function extractTextFromPdf(file) { /* ... (same as your uploaded version) ... */ 
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = async (event) => {
                try {
                    const pdfData = new Uint8Array(event.target.result);
                    const pdfDoc = await pdfjsLib.getDocument({ data: pdfData }).promise;
                    let fullText = '';
                    for (let i = 1; i <= pdfDoc.numPages; i++) {
                        const page = await pdfDoc.getPage(i);
                        const textContent = await page.getTextContent();
                        fullText += textContent.items.map(item => item.str).join(' ') + '\n'; 
                    }
                    resolve(fullText.trim());
                } catch (err) {
                    reject(new Error(`Failed to extract text from PDF: ${err.message}`));
                }
            };
            reader.onerror = (err) => reject(new Error(`FileReader error: ${err.message}`));
            reader.readAsArrayBuffer(file);
        });
    }
    function formatAndDisplayContent(parentElement, textContent) { /* ... (same as your uploaded version) ... */
        if (!parentElement) return;
        parentElement.innerHTML = ''; 
        const lines = textContent.split('\n');
        let currentList = null;
        lines.forEach(line => {
            const trimmedLine = line.trim();
            if (trimmedLine) {
                let formattedLine = trimmedLine.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
                // Using modalQuestionsResultContentDiv as a reference for `ol` isn't ideal if this function is generic.
                // For now, this will work if only modal's questions tab uses <ol>.
                // A better way would be to pass a flag or check parentElement's ID more specifically.
                const isQuestionsList = parentElement.id && parentElement.id.includes('questions-result-content');
                const listMatch = formattedLine.match(/^(\*|-|\d+\.)\s+/);

                if (listMatch) {
                    if (!currentList) {
                        currentList = isQuestionsList ? document.createElement('ol') : document.createElement('ul');
                        if (isQuestionsList) currentList.className = 'numbered-list';
                        parentElement.appendChild(currentList);
                    }
                    const listItem = document.createElement('li');
                    listItem.innerHTML = formattedLine.substring(listMatch[0].length); 
                    currentList.appendChild(listItem);
                } else {
                    currentList = null; 
                    const p = document.createElement('p');
                    p.innerHTML = formattedLine;
                    parentElement.appendChild(p);
                }
            } else {
                currentList = null;
            }
        });
     }

    // --- API Call Functions for List Item Actions ---
    async function updateRfpStatus(rfpId, newStatus) {
        const rfpToUpdate = allFetchedAnalyses.find(a => a.id === rfpId);
        const rfpTitleForMessage = rfpToUpdate ? (rfpToUpdate.rfpTitle || rfpToUpdate.rfpFileName || 'this RFP') : 'this RFP';
        showLoadingMessage(rfpListStatusArea, `Updating "${rfpTitleForMessage}" to ${newStatus}...`);
        try {
            const response = await fetch(`/api/rfp-analysis/${rfpId}/status`, {
                method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: newStatus }),
            });
            if (!response.ok) throw new Error((await response.json()).error || 'Failed to update status.');
            const updatedAnalysis = allFetchedAnalyses.find(a => a.id === rfpId);
            if (updatedAnalysis) updatedAnalysis.status = newStatus;
            renderAnalysesList();
            showLoadingMessage(rfpListStatusArea, `"${rfpTitleForMessage}" status updated to ${newStatus}!`, false);
        } catch (error) { showLoadingMessage(rfpListStatusArea, `Error: ${error.message}`, false);
        } finally { hideLoadingMessage(rfpListStatusArea, 3000); }
    }
    async function updateRfpTitle(rfpId, currentTitle) {
        const newTitle = window.prompt("Enter the new title for the RFP:", currentTitle);
        if (newTitle === null || newTitle.trim() === "" || newTitle.trim() === currentTitle) return;
        showLoadingMessage(rfpListStatusArea, `Updating title for "${currentTitle}"...`);
        try {
            const response = await fetch(`/api/rfp-analysis/${rfpId}/title`, {
                method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ rfpTitle: newTitle.trim() }),
            });
            if (!response.ok) throw new Error((await response.json()).error || `Failed to update title.`);
            const updatedRfp = allFetchedAnalyses.find(a => a.id === rfpId);
            if (updatedRfp) updatedRfp.rfpTitle = newTitle.trim();
            renderAnalysesList();
            showLoadingMessage(rfpListStatusArea, `Title updated successfully!`, false);
        } catch (error) { showLoadingMessage(rfpListStatusArea, `Error updating title: ${error.message}`, false);
        } finally { hideLoadingMessage(rfpListStatusArea, 3000); }
    }
    async function deleteRfp(rfpId, rfpTitleForConfirm) {
        if (!window.confirm(`Are you sure you want to delete RFP: "${rfpTitleForConfirm}"? This action cannot be undone.`)) return;
        showLoadingMessage(rfpListStatusArea, `Deleting "${rfpTitleForConfirm}"...`);
        try {
            const response = await fetch(`/api/rfp-analysis/${rfpId}`, { method: 'DELETE' });
            if (!response.ok) throw new Error((await response.json()).error || `Failed to delete ${rfpTitleForConfirm}.`);
            allFetchedAnalyses = allFetchedAnalyses.filter(a => a.id !== rfpId);
            renderAnalysesList();
            if (viewSavedRfpDetailsSection) viewSavedRfpDetailsSection.style.display = 'none'; 
            showLoadingMessage(rfpListStatusArea, `"${rfpTitleForConfirm}" deleted successfully!`, false);
        } catch (error) { showLoadingMessage(rfpListStatusArea, `Error deleting: ${error.message}`, false);
        } finally { hideLoadingMessage(rfpListStatusArea, 3000); }
    }
    
    // --- Render Saved Analyses List (Main Page) ---
    function renderAnalysesList() {
        if (!savedAnalysesListDiv || !noSavedAnalysesP) return;
        savedAnalysesListDiv.innerHTML = '';
        let filteredAnalyses = [...allFetchedAnalyses];

        if (currentStatusFilter === 'active') {
            filteredAnalyses = filteredAnalyses.filter(a => a.status === 'active');
        } else if (currentStatusFilter === 'not_pursuing') {
            filteredAnalyses = filteredAnalyses.filter(a => a.status === 'not_pursuing');
        } else if (currentStatusFilter === 'all') { 
            filteredAnalyses = filteredAnalyses.filter(a => a.status === 'analyzed' || a.status === 'active' || a.status === 'new');
        }

        filteredAnalyses.sort((a, b) => {
            let valA = a[currentSortKey]; let valB = b[currentSortKey];
            if (currentSortKey === 'analysisDate') {
                valA = a.analysisDate && a.analysisDate._seconds ? Number(a.analysisDate._seconds) : 0;
                valB = b.analysisDate && b.analysisDate._seconds ? Number(b.analysisDate._seconds) : 0;
            } else {
                valA = (typeof valA === 'string' ? valA.toLowerCase() : (valA || '')).toString();
                valB = (typeof valB === 'string' ? valB.toLowerCase() : (valB || '')).toString();
            }
            if (valA < valB) return currentSortOrder === 'asc' ? -1 : 1;
            if (valA > valB) return currentSortOrder === 'asc' ? 1 : -1;
            return 0;
        });

        if (filteredAnalyses.length === 0) {
            noSavedAnalysesP.style.display = 'block';
            noSavedAnalysesP.textContent = `No analyses found for "${currentStatusFilter}" category.`;
        } else {
            noSavedAnalysesP.style.display = 'none';
            filteredAnalyses.forEach(analysis => {
                const itemDiv = document.createElement('div');
                itemDiv.className = 'analyzed-rfp-item';
                const displayTitle = analysis.rfpTitle || analysis.rfpFileName || 'N/A';
                let formattedDateTime = 'N/A';
                if (analysis.analysisDate && typeof analysis.analysisDate._seconds === 'number') { 
                    const date = new Date(analysis.analysisDate._seconds * 1000); 
                    if (!isNaN(date.valueOf())) { 
                        const year = date.getFullYear(); const month = String(date.getMonth() + 1).padStart(2, '0');
                        const day = String(date.getDate()).padStart(2, '0'); const hours = String(date.getHours()).padStart(2, '0');
                        const minutes = String(date.getMinutes()).padStart(2, '0');
                        formattedDateTime = `${year}/${month}/${day} ${hours}:${minutes}`;
                    }
                }
                const statusDotClass = analysis.status === 'active' ? 'green' :
                                       analysis.status === 'not_pursuing' ? 'red' : 'orange'; 

                itemDiv.innerHTML = `
                    <span class="rfp-col-title" title="${displayTitle}">${displayTitle}</span>
                    <span class="rfp-col-type">${analysis.rfpType || 'N/A'}</span>
                    <span class="rfp-col-owner">${analysis.submittedBy || 'N/A'}</span>
                    <span class="rfp-col-date">${formattedDateTime}</span>
                    <span class="rfp-col-status"><span class="rfp-status-dot ${statusDotClass}" title="${analysis.status || 'analyzed'}"></span></span>
                    <span class="rfp-col-actions"></span>`; 

                const actionsSpan = itemDiv.querySelector('.rfp-col-actions');
                
                const viewLink = document.createElement('a');
                viewLink.href = '#'; viewLink.className = 'rfp-view-details action-icon';
                viewLink.dataset.id = analysis.id; 
                viewLink.innerHTML = '<i class="fas fa-eye" aria-hidden="true"></i><span class="visually-hidden">View Details</span>';
                viewLink.title = "View Analysis Details";
                viewLink.addEventListener('click', async (e) => {
                    e.preventDefault();
                    const analysisId = e.currentTarget.dataset.id;
                    const rfpItemDiv = e.currentTarget.closest('.analyzed-rfp-item');
                    const titleElement = rfpItemDiv ? rfpItemDiv.querySelector('.rfp-col-title') : null;
                    const loadingMessageTitle = titleElement ? titleElement.textContent : 'Selected RFP';
                    
                    if (newRfpModal) newRfpModal.style.display = 'none';
                    if (viewSavedRfpDetailsSection) viewSavedRfpDetailsSection.style.display = 'block';
                    if (viewRfpMainTitleHeading) viewRfpMainTitleHeading.textContent = `Details for: ${loadingMessageTitle}`;
                    
                    showLoadingMessage(viewRfpStatusArea, `Loading analysis for ${loadingMessageTitle}...`);
                    if (viewAnalysisResultsArea) viewAnalysisResultsArea.style.display = 'none';
                    clearViewAnalysisResultTabs();

                    try {
                        const detailResponse = await fetch(`/api/rfp-analysis/${analysisId}`);
                        if (!detailResponse.ok) throw new Error((await detailResponse.json()).error || 'Failed to fetch details.');
                        const detailedAnalysis = await detailResponse.json();
                        
                        formatAndDisplayContent(viewSummaryResultContentDiv, detailedAnalysis.rfpSummary || "N/A");
                        formatAndDisplayContent(viewQuestionsResultContentDiv, detailedAnalysis.generatedQuestions || "N/A");
                        formatAndDisplayContent(viewDeadlinesOnlyContentDiv, detailedAnalysis.rfpDeadlines || "N/A");
                        formatAndDisplayContent(viewSubmissionFormatContentDiv, detailedAnalysis.rfpSubmissionFormat || "N/A");
                        formatAndDisplayContent(viewRequirementsResultContentDiv, detailedAnalysis.rfpKeyRequirements || "N/A");
                        formatAndDisplayContent(viewStakeholdersResultContentDiv, detailedAnalysis.rfpStakeholders || "N/A");
                        formatAndDisplayContent(viewRisksResultContentDiv, detailedAnalysis.rfpRisks || "N/A");
                        formatAndDisplayContent(viewRegistrationResultContentDiv, detailedAnalysis.rfpRegistration || "N/A");
                        formatAndDisplayContent(viewLicensesResultContentDiv, detailedAnalysis.rfpLicenses || "N/A");
                        formatAndDisplayContent(viewBudgetResultContentDiv, detailedAnalysis.rfpBudget || "N/A");
                        
                        if (viewAnalysisResultsArea) viewAnalysisResultsArea.style.display = 'block';
                        const firstViewTabLink = document.querySelector('#view-analysis-results-area .tabs-container .tab-link');
                        if (firstViewTabLink) {
                            document.querySelectorAll('#view-analysis-results-area .tabs-container .tab-link').forEach(tl => tl.classList.remove('active'));
                            firstViewTabLink.classList.add('active'); // Make first tab active
                            const tabNameToOpen = firstViewTabLink.getAttribute('onclick').match(/'([^']*)'/)[1];
                            if (window.openViewTab) window.openViewTab(null, tabNameToOpen); 
                        }
                        
                        const titleForStatus = detailedAnalysis.rfpTitle || detailedAnalysis.rfpFileName || 'N/A';
                        showLoadingMessage(viewRfpStatusArea, `Displaying: ${titleForStatus}`, false);
                    } catch (loadError) {
                         showLoadingMessage(viewRfpStatusArea, `Error: ${loadError.message}`, false);
                    } finally {
                        hideLoadingMessage(viewRfpStatusArea, 5000); 
                    }
                });
                actionsSpan.appendChild(viewLink);

                const editTitleButton = document.createElement('button');
                editTitleButton.className = 'action-icon';
                editTitleButton.innerHTML = '<i class="fas fa-edit" aria-hidden="true"></i><span class="visually-hidden">Edit Title</span>';
                editTitleButton.title = "Edit RFP Title";
                editTitleButton.onclick = () => updateRfpTitle(analysis.id, displayTitle);
                actionsSpan.appendChild(editTitleButton);

                if (analysis.status !== 'active') {
                    const setActiveButton = document.createElement('button');
                    setActiveButton.className = 'action-icon';
                    setActiveButton.innerHTML = '<i class="fas fa-check-circle" aria-hidden="true"></i>';
                    setActiveButton.title = "Move to Active";
                    setActiveButton.onclick = () => updateRfpStatus(analysis.id, 'active');
                    actionsSpan.appendChild(setActiveButton);
                }
                if (analysis.status !== 'not_pursuing') {
                    const setNotPursuingButton = document.createElement('button');
                    setNotPursuingButton.className = 'action-icon';
                    setNotPursuingButton.innerHTML = '<i class="fas fa-times-circle" aria-hidden="true"></i>';
                    setNotPursuingButton.title = "Move to Not Pursuing";
                    setNotPursuingButton.onclick = () => updateRfpStatus(analysis.id, 'not_pursuing');
                    actionsSpan.appendChild(setNotPursuingButton);
                }
                if (analysis.status === 'active' || analysis.status === 'not_pursuing') {
                    const setAnalyzedButton = document.createElement('button');
                    setAnalyzedButton.className = 'action-icon';
                    setAnalyzedButton.innerHTML = '<i class="fas fa-inbox" aria-hidden="true"></i>';
                    setAnalyzedButton.title = "Move to Analyzed/Unactuated";
                    setAnalyzedButton.onclick = () => updateRfpStatus(analysis.id, 'analyzed');
                    actionsSpan.appendChild(setAnalyzedButton);
                }
                const deleteButton = document.createElement('button');
                deleteButton.className = 'action-icon delete';
                deleteButton.innerHTML = '<i class="fas fa-trash-alt" aria-hidden="true"></i>';
                deleteButton.title = "Delete RFP";
                deleteButton.onclick = () => deleteRfp(analysis.id, displayTitle);
                actionsSpan.appendChild(deleteButton);
                
                savedAnalysesListDiv.appendChild(itemDiv);
            });
        }
    }

    async function loadSavedAnalysesInitial() {
        showLoadingMessage(rfpListStatusArea, "Loading saved analyses...", true); // Use rfpListStatusArea
        try {
            const response = await fetch('/api/rfp-analyses');
            if (!response.ok) throw new Error((await response.json()).error || 'Failed to fetch analyses.');
            allFetchedAnalyses = await response.json();
            renderAnalysesList(); 
        } catch (error) { 
            if(savedAnalysesListDiv) savedAnalysesListDiv.innerHTML = `<p class="loading-text" style="color:red; text-align:center;">Failed to load: ${error.message}</p>`;
            if(noSavedAnalysesP) noSavedAnalysesP.style.display = 'block';
            if(noSavedAnalysesP) noSavedAnalysesP.textContent = `Failed to load analyses.`;
        } finally {
            hideLoadingMessage(rfpListStatusArea); // Use rfpListStatusArea
        }
    }
    
    // --- Event Listeners for Main Page List Tabs & Sorting ---
    if (rfpListTabsContainer) { /* ... (same as your uploaded version) ... */ 
        rfpListTabsContainer.addEventListener('click', (e) => {
            if (e.target.classList.contains('rfp-list-tab-button')) {
                rfpListTabsContainer.querySelectorAll('.rfp-list-tab-button').forEach(btn => btn.classList.remove('active'));
                e.target.classList.add('active');
                currentStatusFilter = e.target.dataset.statusFilter;
                renderAnalysesList();
            }
        });
    }
    document.querySelectorAll('#saved-analyses-header .sortable-header').forEach(header => { /* ... (same as your uploaded version) ... */ 
        header.addEventListener('click', () => {
            const sortKey = header.dataset.sortKey;
            if (currentSortKey === sortKey) {
                currentSortOrder = currentSortOrder === 'asc' ? 'desc' : 'asc';
            } else {
                currentSortKey = sortKey;
                currentSortOrder = 'asc'; 
            }
            document.querySelectorAll('#saved-analyses-header .sortable-header').forEach(h => {
                let text = h.textContent.replace(/ [⇅↑↓]$/, '');
                if (h.dataset.sortKey === currentSortKey) {
                    text += currentSortOrder === 'asc' ? ' ↑' : ' ↓';
                } else {
                     text += ' ⇅';
                }
                h.textContent = text;
            });
            renderAnalysesList();
        });
    });

    // --- RFP Form Submission (Inside Modal) ---
    if (rfpForm) {
        rfpForm.addEventListener('submit', async function(event) {
            event.preventDefault();
            const rfpTitleValue = document.getElementById('rfpTitle').value.trim();
            const rfpTypeValue = document.getElementById('rfpType').value;
            const submittedByValue = document.getElementById('submittedBy').value;
            const file = rfpFileUpload.files[0];
            
            showLoadingMessage(modalAnalysisStatusArea, "Starting analysis..."); 
            if (modalAnalysisResultsArea) modalAnalysisResultsArea.style.display = 'none'; 

            if (!file) { 
                showLoadingMessage(modalAnalysisStatusArea, "Please upload an RFP document.", false);
                hideLoadingMessage(modalAnalysisStatusArea, 3000);
                return; 
            }
            const rfpFileNameValue = file.name; 
            if (file.type !== "application/pdf") { 
                showLoadingMessage(modalAnalysisStatusArea, "Invalid file type. Please upload a PDF.", false);
                hideLoadingMessage(modalAnalysisStatusArea, 3000);
                return;
            }

            let rfpText = "";
            try { 
                showLoadingMessage(modalAnalysisStatusArea, "Extracting text from PDF...");
                rfpText = await extractTextFromPdf(file);
                if (!rfpText || rfpText.trim().length < 50) throw new Error("Insufficient text from PDF.");
            } catch (error) { 
                showLoadingMessage(modalAnalysisStatusArea, `PDF Error: ${error.message}`, false);
                hideLoadingMessage(modalAnalysisStatusArea, 5000);
                return; 
            }

            const aiPrompt = `Please analyze the following Request for Proposal (RFP) text.
Provide the following distinct sections in your response, each clearly delimited:
1. A concise summary of the RFP.
2. A list of 5 to 15 critical and insightful clarification questions based on the RFP.
3. Key Deadlines.
4. Submission Format (Mail, Email, Portal, site address, etc.).
5. A list of Requirements (e.g., mandatory, highly desirable).
6. Mentioned Stakeholders or Key Contacts.
7. Potential Risks or Red Flags identified in the RFP.
8. Registration requirements or details for bidders.
9. Required Licenses or Certifications for bidders.
10. Any mentioned Budget constraints or financial information.

Use the following format strictly for each section:

###SUMMARY_START###
[Content]
###SUMMARY_END###

###QUESTIONS_START###
[Content]
###QUESTIONS_END###

###DEADLINES_START###
[Key deadlines content]
###DEADLINES_END###

###SUBMISSION_FORMAT_START###
[Submission format content]
###SUBMISSION_FORMAT_END###

###REQUIREMENTS_START###
[Requirements content]
###REQUIREMENTS_END###

###STAKEHOLDERS_START###
[Content]
###STAKEHOLDERS_END###

###RISKS_START###
[Content]
###RISKS_END###

###REGISTRATION_START###
[Content]
###REGISTRATION_END###

###LICENSES_START###
[Content]
###LICENSES_END###

###BUDGET_START###
[Content]
###BUDGET_END###

RFP Text:
---
${rfpText}
---
`;
            
            let summaryText, questionsText, deadlinesText, submissionFormatText,
                requirementsText, stakeholdersText, risksText,
                registrationText, licensesText, budgetText;
            const defaultErrorMsg = (section) => `${section.replace(/_/g, ' ')} not extracted.`;

            try {
                showLoadingMessage(modalAnalysisStatusArea, "AI is analyzing and generating content...");
                const response = await fetch('/api/generate', { 
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ prompt: aiPrompt })
                });
                if (!response.ok) throw new Error((await response.json()).error || 'AI API error.');
                const data = await response.json();
                
                let rawAiOutput = data.generatedText.replace(/^```[a-z]*\s*/im, '').replace(/\s*```$/m, '');
                console.log("Raw AI Output from Gemini (New RFP):\n", rawAiOutput);

                const parseSection = (output, sectionName) => {
                    const regex = new RegExp(`###${sectionName}_START###([\\s\\S]*?)###${sectionName}_END###`);
                    const match = output.match(regex);
                    return match && match[1] ? match[1].trim() : defaultErrorMsg(sectionName);
                };

                summaryText = parseSection(rawAiOutput, "SUMMARY");
                questionsText = parseSection(rawAiOutput, "QUESTIONS"); 
                deadlinesText = parseSection(rawAiOutput, "DEADLINES");
                submissionFormatText = parseSection(rawAiOutput, "SUBMISSION_FORMAT");
                requirementsText = parseSection(rawAiOutput, "REQUIREMENTS"); 
                stakeholdersText = parseSection(rawAiOutput, "STAKEHOLDERS");
                risksText = parseSection(rawAiOutput, "RISKS");
                registrationText = parseSection(rawAiOutput, "REGISTRATION");
                licensesText = parseSection(rawAiOutput, "LICENSES");
                budgetText = parseSection(rawAiOutput, "BUDGET");
                
                clearModalAnalysisResultTabs(); 

                formatAndDisplayContent(modalSummaryResultContentDiv, summaryText);
                formatAndDisplayContent(modalQuestionsResultContentDiv, questionsText); 
                formatAndDisplayContent(modalDeadlinesOnlyContentDiv, deadlinesText); 
                formatAndDisplayContent(modalSubmissionFormatContentDiv, submissionFormatText); 
                formatAndDisplayContent(modalRequirementsResultContentDiv, requirementsText);
                formatAndDisplayContent(modalStakeholdersResultContentDiv, stakeholdersText);
                formatAndDisplayContent(modalRisksResultContentDiv, risksText);
                formatAndDisplayContent(modalRegistrationResultContentDiv, registrationText);
                formatAndDisplayContent(modalLicensesResultContentDiv, licensesText);
                formatAndDisplayContent(modalBudgetResultContentDiv, budgetText);
                
                if(modalAnalysisResultsArea) modalAnalysisResultsArea.style.display = 'block';
                const activeModalResultTab = document.querySelector('#modal-analysis-results-area .tabs-container .tab-link'); // Get first tab
                if (activeModalResultTab) {
                     // Ensure all tabs are inactive first, then activate the first one
                    document.querySelectorAll('#modal-analysis-results-area .tabs-container .tab-link').forEach(tl => tl.classList.remove('active'));
                    activeModalResultTab.classList.add('active');
                    const tabNameToOpen = activeModalResultTab.getAttribute('onclick').match(/'([^']*)'/)[1];
                    if(window.openModalTab) window.openModalTab(null, tabNameToOpen); 
                }
                showLoadingMessage(modalAnalysisStatusArea, "RFP analysis complete! Saving results...", false);

                try {
                    const savePayload = { 
                        rfpTitle: rfpTitleValue || "", rfpType: rfpTypeValue, submittedBy: submittedByValue, 
                        rfpFileName: rfpFileNameValue, rfpSummary: summaryText, generatedQuestions: questionsText,
                        rfpDeadlines: deadlinesText, rfpSubmissionFormat: submissionFormatText, 
                        rfpKeyRequirements: requirementsText, rfpStakeholders: stakeholdersText,
                        rfpRisks: risksText, rfpRegistration: registrationText, 
                        rfpLicenses: licensesText, rfpBudget: budgetText, status: 'analyzed' 
                    };
                    const saveResponse = await fetch('/api/rfp-analysis', { 
                        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(savePayload)
                    });
                    if (!saveResponse.ok) throw new Error((await saveResponse.json()).error || 'Failed to save analysis.');
                    
                    showLoadingMessage(modalAnalysisStatusArea, "Analysis complete and results saved!", false);
                    // Form reset is handled when modal is re-opened for a new entry.
                    await loadSavedAnalysesInitial(); 
                } catch (saveError) {
                    showLoadingMessage(modalAnalysisStatusArea, `Analysis complete, but failed to save: ${saveError.message}`, false);
                }
            } catch (error) {  
                showLoadingMessage(modalAnalysisStatusArea, `Processing Error: ${error.message}`, false);
            } finally {
                 hideLoadingMessage(modalAnalysisStatusArea, 7000); 
                 if (generateAnalysisButton) generateAnalysisButton.disabled = false; 
            }
        });
    }
    
    // --- Initial Page Load ---
    // Activate the first tab in the main page view section if it's somehow visible initially (though it defaults to hidden)
    const firstActiveViewTab = document.querySelector('#view-analysis-results-area .tabs-container .tab-link');
    if (firstActiveViewTab && viewSavedRfpDetailsSection && viewSavedRfpDetailsSection.style.display === 'block') {
        const tabNameToOpen = firstActiveViewTab.getAttribute('onclick').match(/'([^']*)'/)[1];
        const tabElement = document.getElementById(tabNameToOpen);
        if (window.openViewTab && tabElement && tabElement.style.display !== 'block') {
            window.openViewTab(null, tabNameToOpen);
        }
    }
    
    loadSavedAnalysesInitial(); 
});
