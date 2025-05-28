// mostafaseyedan/cendien-website/cendien-website-Test/public/rfp-script.js
import * as pdfjsLib from 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/5.0.375/pdf.min.mjs';

pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/5.0.375/pdf.worker.min.mjs';

document.addEventListener('DOMContentLoaded', () => {
    // RFP Form and general elements
    const rfpForm = document.getElementById('rfp-details-form');
    const rfpFileUpload = document.getElementById('rfpFileUpload');
    const generateAnalysisButton = document.getElementById('generate-analysis-button');
    const analysisStatusArea = document.getElementById('analysis-status-area'); // Inside modal now
    const analysisResultsArea = document.getElementById('analysis-results-area'); // Inside modal now
    
    // Analysis results tab content divs (ensure all are selected)
    const summaryResultContentDiv = document.getElementById('summary-result-content');
    const questionsResultContentDiv = document.getElementById('questions-result-content');
    // For Deadlines & Submission Format
    const deadlinesOnlyContentDiv = document.getElementById('deadlines-only-content');
    const submissionFormatContentDiv = document.getElementById('submission-format-content');
    // Renamed tab
    const requirementsResultContentDiv = document.getElementById('requirements-result-content');
    const stakeholdersResultContentDiv = document.getElementById('stakeholders-result-content');
    const risksResultContentDiv = document.getElementById('risks-result-content');
    // New tabs
    const registrationResultContentDiv = document.getElementById('registration-result-content');
    const licensesResultContentDiv = document.getElementById('licenses-result-content');
    const budgetResultContentDiv = document.getElementById('budget-result-content');
    
    // Saved RFP List elements
    const savedAnalysesListDiv = document.getElementById('saved-analyses-list');
    const noSavedAnalysesP = document.getElementById('no-saved-analyses');
    const rfpListTabsContainer = document.querySelector('.rfp-list-tabs');
    const yearSpanRFP = document.getElementById('current-year-rfp');

    // Modal elements
    const newRfpModal = document.getElementById('new-rfp-modal');
    const openNewRfpModalButton = document.getElementById('open-new-rfp-modal-button');
    const modalCloseButton = document.getElementById('modal-close-button');
    const modalTitle = document.getElementById('modal-title'); // To change title if needed

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
                // Reset form and results for a new entry
                if (rfpForm) rfpForm.reset();
                if (analysisResultsArea) analysisResultsArea.style.display = 'none';
                if (analysisStatusArea) analysisStatusArea.style.display = 'none';
                clearAnalysisResultTabs();
                if (modalTitle) modalTitle.textContent = "Analyze New RFP";
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
        newRfpModal.addEventListener('click', (event) => { // Close if clicked outside content
            if (event.target === newRfpModal) {
                newRfpModal.style.display = 'none';
            }
        });
    }

    function clearAnalysisResultTabs() {
        const contentDivs = [
            summaryResultContentDiv, questionsResultContentDiv,
            deadlinesOnlyContentDiv, submissionFormatContentDiv,
            requirementsResultContentDiv, stakeholdersResultContentDiv,
            risksResultContentDiv, registrationResultContentDiv,
            licensesResultContentDiv, budgetResultContentDiv
        ];
        contentDivs.forEach(div => {
            if (div) div.innerHTML = '';
        });
    }

    const showLoadingStateRFP = (isLoading, message = "Processing...") => {
        if (!analysisStatusArea) return;
        if (isLoading) {
            analysisStatusArea.style.display = 'flex';
            analysisStatusArea.innerHTML = `
                <div class="spinner"></div>
                <p class="loading-text">${message}</p>`;
            if (generateAnalysisButton) generateAnalysisButton.disabled = true;
        }
    };

    const hideLoadingStateRFP = (delay = 0) => {
         setTimeout(() => {
            if (analysisStatusArea) {
                 if (analysisStatusArea.innerHTML.includes('<div class="spinner">')) { 
                    analysisStatusArea.style.display = 'none';
                    analysisStatusArea.innerHTML = '';
                }
            }
            if (generateAnalysisButton) generateAnalysisButton.disabled = false;
        }, delay);
    };

    async function extractTextFromPdf(file) {
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

    function formatAndDisplayContent(parentElement, textContent) {
        if (!parentElement) return;
        parentElement.innerHTML = ''; 
        const lines = textContent.split('\n');
        let currentList = null;
        lines.forEach(line => {
            const trimmedLine = line.trim();
            if (trimmedLine) {
                let formattedLine = trimmedLine.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
                const listMatch = formattedLine.match(/^(\*|-|\d+\.)\s+/);
                if (listMatch) {
                    if (!currentList) {
                        currentList = (parentElement === questionsResultContentDiv) ? document.createElement('ol') : document.createElement('ul');
                        if (parentElement === questionsResultContentDiv) currentList.className = 'numbered-list';
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

    async function updateRfpStatus(rfpId, newStatus) {
        const rfpToUpdate = allFetchedAnalyses.find(a => a.id === rfpId);
        const rfpTitleForMessage = rfpToUpdate ? (rfpToUpdate.rfpTitle || rfpToUpdate.rfpFileName || 'this RFP') : 'this RFP';

        // For this operation, status messages can appear on the main page, not in modal
        const mainPageStatusArea = document.getElementById('analysis-status-area'); // A bit ambiguous if there are two
                                                                               // Let's assume there's one outside modal for list operations
                                                                               // For now, we'll use the modal's status area.
                                                                               // This might need a dedicated status area on the main page.

        showLoadingStateRFP(true, `Updating "${rfpTitleForMessage}" to ${newStatus}...`); // Uses modal's status area
        try {
            const response = await fetch(`/api/rfp-analysis/${rfpId}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus }),
            });
            if (!response.ok) {
                const errData = await response.json().catch(() => ({ error: `Failed to update status for ${rfpTitleForMessage}.` }));
                throw new Error(errData.error || `HTTP error! status: ${response.status}`);
            }
            const updatedAnalysis = allFetchedAnalyses.find(a => a.id === rfpId);
            if (updatedAnalysis) updatedAnalysis.status = newStatus;
            renderAnalysesList(); // Re-render main page list
            if(analysisStatusArea) { // Check if modal's status area is relevant here
                analysisStatusArea.innerHTML = `<p class="loading-text" style="color:green;">"${rfpTitleForMessage}" status updated to ${newStatus}!</p>`;
                analysisStatusArea.style.display = 'flex';
            }
        } catch (error) {
             if(analysisStatusArea) {
                analysisStatusArea.innerHTML = `<p class="loading-text" style="color:red;">Error: ${error.message}</p>`;
                analysisStatusArea.style.display = 'flex';
             } else {
                alert(`Error: ${error.message}`);
             }
        } finally {
            hideLoadingStateRFP(3000);
        }
    }
    
    async function updateRfpTitle(rfpId, currentTitle) {
        const newTitle = window.prompt("Enter the new title for the RFP:", currentTitle);

        if (newTitle === null) return;
        if (newTitle.trim() === "") {
            window.alert("RFP Title cannot be empty.");
            return;
        }
        if (newTitle.trim() === currentTitle) return;

        showLoadingStateRFP(true, `Updating title for "${currentTitle}"...`);
        try {
            const response = await fetch(`/api/rfp-analysis/${rfpId}/title`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ rfpTitle: newTitle.trim() }),
            });
            if (!response.ok) {
                const errData = await response.json().catch(() => ({ error: `Failed to update title.` }));
                throw new Error(errData.error || `HTTP error! status: ${response.status}`);
            }
            const updatedRfp = allFetchedAnalyses.find(a => a.id === rfpId);
            if (updatedRfp) updatedRfp.rfpTitle = newTitle.trim();
            renderAnalysesList();
             if(analysisStatusArea) {
                analysisStatusArea.innerHTML = `<p class="loading-text" style="color:green;">Title updated successfully!</p>`;
                analysisStatusArea.style.display = 'flex';
            }
        } catch (error) {
            if(analysisStatusArea) {
                analysisStatusArea.innerHTML = `<p class="loading-text" style="color:red;">Error updating title: ${error.message}</p>`;
                analysisStatusArea.style.display = 'flex';
            } else {
                alert(`Error updating title: ${error.message}`);
            }
        } finally {
            hideLoadingStateRFP(3000);
        }
    }


    async function deleteRfp(rfpId, rfpTitleForConfirm) {
        if (!window.confirm(`Are you sure you want to delete RFP: "${rfpTitleForConfirm}"? This action cannot be undone.`)) {
            return;
        }
        showLoadingStateRFP(true, `Deleting "${rfpTitleForConfirm}"...`);
        try {
            const response = await fetch(`/api/rfp-analysis/${rfpId}`, { method: 'DELETE' });
            if (!response.ok) {
                const errData = await response.json().catch(() => ({ error: `Failed to delete ${rfpTitleForConfirm}.` }));
                throw new Error(errData.error || `HTTP error! status: ${response.status}`);
            }
            allFetchedAnalyses = allFetchedAnalyses.filter(a => a.id !== rfpId);
            renderAnalysesList();
            if (analysisResultsArea) analysisResultsArea.style.display = 'none'; 
            if(analysisStatusArea) {
                analysisStatusArea.innerHTML = `<p class="loading-text" style="color:green;">"${rfpTitleForConfirm}" deleted successfully!</p>`;
                analysisStatusArea.style.display = 'flex';
            }
        } catch (error) {
            if(analysisStatusArea) {
                analysisStatusArea.innerHTML = `<p class="loading-text" style="color:red;">Error: ${error.message}</p>`;
                analysisStatusArea.style.display = 'flex';
            } else {
                alert(`Error: ${error.message}`);
            }
        } finally {
            hideLoadingStateRFP(3000);
        }
    }
    
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
            let valA = a[currentSortKey];
            let valB = b[currentSortKey];
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
                        const year = date.getFullYear();
                        const month = String(date.getMonth() + 1).padStart(2, '0');
                        const day = String(date.getDate()).padStart(2, '0');
                        const hours = String(date.getHours()).padStart(2, '0');
                        const minutes = String(date.getMinutes()).padStart(2, '0');
                        formattedDateTime = `${year}/${month}/${day} ${hours}:${minutes}`;
                    }
                }

                const statusDotClass = analysis.status === 'active' ? 'green' :
                                       analysis.status === 'not_pursuing' ? 'red' :
                                       'orange'; 

                itemDiv.innerHTML = `
                    <span class="rfp-col-title" title="${displayTitle}">${displayTitle}</span>
                    <span class="rfp-col-type">${analysis.rfpType || 'N/A'}</span>
                    <span class="rfp-col-owner">${analysis.submittedBy || 'N/A'}</span>
                    <span class="rfp-col-date">${formattedDateTime}</span>
                    <span class="rfp-col-status"><span class="rfp-status-dot ${statusDotClass}" title="${analysis.status || 'analyzed'}"></span></span>
                    <span class="rfp-col-actions"></span>`; 

                const actionsSpan = itemDiv.querySelector('.rfp-col-actions');
                
                const viewLink = document.createElement('a');
                viewLink.href = '#'; 
                viewLink.className = 'rfp-view-details action-icon';
                viewLink.dataset.id = analysis.id; 
                viewLink.innerHTML = '<i class="fas fa-eye" aria-hidden="true"></i><span class="visually-hidden">View Details</span>';
                viewLink.title = "View Analysis Details";
                viewLink.addEventListener('click', async (e) => {
                    e.preventDefault();
                    const analysisId = e.currentTarget.dataset.id;
                    const currentItemTitleElement = e.currentTarget.closest('.analyzed-rfp-item').querySelector('.rfp-col-title');
                    const loadingMessageTitle = currentItemTitleElement ? currentItemTitleElement.textContent : 'Selected RFP';
                    
                    // For viewing details, use the modal's status and results area
                    const modalAnalysisStatusArea = document.getElementById('analysis-status-area');
                    const modalAnalysisResultsArea = document.getElementById('analysis-results-area');

                    if(modalAnalysisStatusArea) modalAnalysisStatusArea.style.display = 'flex';
                    if(modalAnalysisStatusArea) modalAnalysisStatusArea.innerHTML = `<div class="spinner"></div><p class="loading-text">Loading analysis for ${loadingMessageTitle}...</p>`;
                    if(modalAnalysisResultsArea) modalAnalysisResultsArea.style.display = 'none';
                    if(newRfpModal) newRfpModal.style.display = 'block'; // Show modal for viewing
                    if(modalTitle) modalTitle.textContent = `Details for: ${loadingMessageTitle}`;


                    try {
                        const detailResponse = await fetch(`/api/rfp-analysis/${analysisId}`);
                        if (!detailResponse.ok) throw new Error((await detailResponse.json()).error || 'Failed to fetch details.');
                        const detailedAnalysis = await detailResponse.json();
                        
                        clearAnalysisResultTabs(); // Clear before populating

                        formatAndDisplayContent(summaryResultContentDiv, detailedAnalysis.rfpSummary || "Summary not available.");
                        formatAndDisplayContent(questionsResultContentDiv, detailedAnalysis.generatedQuestions || "Questions not available.");
                        
                        // Populate Deadlines and Submission Format
                        formatAndDisplayContent(deadlinesOnlyContentDiv, detailedAnalysis.rfpDeadlines || "Deadlines not extracted.");
                        formatAndDisplayContent(submissionFormatContentDiv, detailedAnalysis.rfpSubmissionFormat || "Submission format not specified.");
                        
                        formatAndDisplayContent(requirementsResultContentDiv, detailedAnalysis.rfpKeyRequirements || "Requirements not extracted.");
                        formatAndDisplayContent(stakeholdersResultContentDiv, detailedAnalysis.rfpStakeholders || "Stakeholders not extracted.");
                        formatAndDisplayContent(risksResultContentDiv, detailedAnalysis.rfpRisks || "Risks not extracted.");

                        // Populate new tabs
                        formatAndDisplayContent(registrationResultContentDiv, detailedAnalysis.rfpRegistration || "Registration details not extracted.");
                        formatAndDisplayContent(licensesResultContentDiv, detailedAnalysis.rfpLicenses || "License information not extracted.");
                        formatAndDisplayContent(budgetResultContentDiv, detailedAnalysis.rfpBudget || "Budget information not extracted.");
                        
                        if(modalAnalysisResultsArea) modalAnalysisResultsArea.style.display = 'block';
                        const activeResultTab = document.querySelector('#analysis-results-area .tabs-container .tab-link.active') || document.querySelector('#analysis-results-area .tabs-container .tab-link');
                        if (activeResultTab) {
                            const tabNameToOpen = activeResultTab.getAttribute('onclick').match(/'([^']*)'/)[1];
                            if (window.openTab) window.openTab(null, tabNameToOpen); 
                        }
                        const titleForStatus = detailedAnalysis.rfpTitle || detailedAnalysis.rfpFileName || 'N/A';
                        if(modalAnalysisStatusArea) modalAnalysisStatusArea.innerHTML = `<p class="loading-text" style="color:green;">Displaying saved analysis: ${titleForStatus}</p>`;
                    } catch (loadError) {
                        if(modalAnalysisStatusArea) modalAnalysisStatusArea.innerHTML = `<p class="loading-text" style="color:red;">Error: ${loadError.message}</p>`;
                    } finally {
                        // Don't auto-hide status if it's showing details
                        // hideLoadingStateRFP(5000); 
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
        // For initial load, use a generic status area or handle display carefully
        const initialLoadStatusP = document.createElement('p');
        initialLoadStatusP.className = 'loading-text';
        initialLoadStatusP.textContent = "Loading saved analyses...";
        if(savedAnalysesListDiv.parentElement.contains(noSavedAnalysesP)){ // Insert before noSavedAnalysesP
             savedAnalysesListDiv.parentElement.insertBefore(initialLoadStatusP, noSavedAnalysesP);
        } else {
            savedAnalysesListDiv.parentElement.appendChild(initialLoadStatusP);
        }

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
            if (initialLoadStatusP.parentElement) { // Remove the temporary loading message
                initialLoadStatusP.remove();
            }
        }
    }
    
    if (rfpListTabsContainer) {
        rfpListTabsContainer.addEventListener('click', (e) => {
            if (e.target.classList.contains('rfp-list-tab-button')) {
                rfpListTabsContainer.querySelectorAll('.rfp-list-tab-button').forEach(btn => btn.classList.remove('active'));
                e.target.classList.add('active');
                currentStatusFilter = e.target.dataset.statusFilter;
                renderAnalysesList();
            }
        });
    }

    document.querySelectorAll('#saved-analyses-header .sortable-header').forEach(header => {
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

    if (rfpForm) {
        rfpForm.addEventListener('submit', async function(event) {
            event.preventDefault();
            const rfpTitleValue = document.getElementById('rfpTitle').value.trim();
            const rfpTypeValue = document.getElementById('rfpType').value;
            const submittedByValue = document.getElementById('submittedBy').value;
            const file = rfpFileUpload.files[0];
            
            showLoadingStateRFP(true, "Starting analysis..."); 
            if (analysisResultsArea) analysisResultsArea.style.display = 'none'; 

            if (!file) {
                if(analysisStatusArea) analysisStatusArea.innerHTML = `<p class="loading-text" style="color:red;">Please upload an RFP document.</p>`;
                if(analysisStatusArea) analysisStatusArea.style.display = 'flex';
                hideLoadingStateRFP(3000);
                return; 
            }
            const rfpFileNameValue = file.name; 
            if (file.type !== "application/pdf") { 
                if(analysisStatusArea) analysisStatusArea.innerHTML = `<p class="loading-text" style="color:red;">Invalid file type. Please upload a PDF.</p>`;
                if(analysisStatusArea) analysisStatusArea.style.display = 'flex';
                hideLoadingStateRFP(3000);
                return;
            }

            let rfpText = "";
            try { 
                showLoadingStateRFP(true, "Extracting text from PDF...");
                rfpText = await extractTextFromPdf(file);
                if (!rfpText || rfpText.trim().length < 50) throw new Error("Insufficient text from PDF.");
            } catch (error) { 
                if(analysisStatusArea) analysisStatusArea.innerHTML = `<p class="loading-text" style="color:red;">PDF Error: ${error.message}</p>`;
                if(analysisStatusArea) analysisStatusArea.style.display = 'flex';
                hideLoadingStateRFP(5000);
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
                showLoadingStateRFP(true, "AI is analyzing and generating content...");
                const response = await fetch('/api/generate', { 
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ prompt: aiPrompt })
                });
                if (!response.ok) throw new Error((await response.json()).error || 'AI API error.');
                const data = await response.json();
                
                let rawAiOutput = data.generatedText.replace(/^```[a-z]*\s*/im, '').replace(/\s*```$/m, '');
                console.log("Raw AI Output from Gemini:\n", rawAiOutput);

                const parseSection = (output, sectionName) => {
                    const regex = new RegExp(`###${sectionName}_START###([\\s\\S]*?)###${sectionName}_END###`);
                    const match = output.match(regex);
                    return match && match[1] ? match[1].trim() : defaultErrorMsg(sectionName);
                };

                summaryText = parseSection(rawAiOutput, "SUMMARY");
                questionsText = parseSection(rawAiOutput, "QUESTIONS"); 
                deadlinesText = parseSection(rawAiOutput, "DEADLINES");
                submissionFormatText = parseSection(rawAiOutput, "SUBMISSION_FORMAT");
                requirementsText = parseSection(rawAiOutput, "REQUIREMENTS"); // Renamed from KEY_REQUIREMENTS
                stakeholdersText = parseSection(rawAiOutput, "STAKEHOLDERS");
                risksText = parseSection(rawAiOutput, "RISKS");
                registrationText = parseSection(rawAiOutput, "REGISTRATION");
                licensesText = parseSection(rawAiOutput, "LICENSES");
                budgetText = parseSection(rawAiOutput, "BUDGET");
                
                clearAnalysisResultTabs(); // Clear before populating

                formatAndDisplayContent(summaryResultContentDiv, summaryText);
                formatAndDisplayContent(questionsResultContentDiv, questionsText); 
                formatAndDisplayContent(deadlinesOnlyContentDiv, deadlinesText); // Populate specific div
                formatAndDisplayContent(submissionFormatContentDiv, submissionFormatText); // Populate specific div
                formatAndDisplayContent(requirementsResultContentDiv, requirementsText);
                formatAndDisplayContent(stakeholdersResultContentDiv, stakeholdersText);
                formatAndDisplayContent(risksResultContentDiv, risksText);
                formatAndDisplayContent(registrationResultContentDiv, registrationText);
                formatAndDisplayContent(licensesResultContentDiv, licensesText);
                formatAndDisplayContent(budgetResultContentDiv, budgetText);
                
                if(analysisResultsArea) analysisResultsArea.style.display = 'block';
                const activeResultTab = document.querySelector('#analysis-results-area .tabs-container .tab-link.active') || document.querySelector('#analysis-results-area .tabs-container .tab-link');
                if (activeResultTab) {
                    const tabNameToOpen = activeResultTab.getAttribute('onclick').match(/'([^']*)'/)[1];
                    if(window.openTab) window.openTab(null, tabNameToOpen); // Use global openTab from HTML
                }

                if(analysisStatusArea) analysisStatusArea.innerHTML = `<p class="loading-text" style="color:green;">RFP analysis complete! Saving results...</p>`;
                if(analysisStatusArea) analysisStatusArea.style.display = 'flex';

                try {
                    const savePayload = { 
                        rfpTitle: rfpTitleValue || "", 
                        rfpType: rfpTypeValue,   
                        submittedBy: submittedByValue, 
                        rfpFileName: rfpFileNameValue, 
                        rfpSummary: summaryText, 
                        generatedQuestions: questionsText,
                        rfpDeadlines: deadlinesText, // Original deadlines
                        rfpSubmissionFormat: submissionFormatText, // New field
                        rfpKeyRequirements: requirementsText, // Field name in DB is still rfpKeyRequirements for now
                        rfpStakeholders: stakeholdersText,
                        rfpRisks: risksText,
                        rfpRegistration: registrationText, // New field
                        rfpLicenses: licensesText,       // New field
                        rfpBudget: budgetText,           // New field
                        status: 'analyzed' 
                    };
                    const saveResponse = await fetch('/api/rfp-analysis', { 
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(savePayload)
                    });
                    if (!saveResponse.ok) throw new Error((await saveResponse.json()).error || 'Failed to save analysis.');
                    
                    if(analysisStatusArea) analysisStatusArea.innerHTML = `<p class="loading-text" style="color:green;">Analysis complete and results saved!</p>`;
                    if (rfpForm) rfpForm.reset(); // Reset form inside modal
                    // Optionally close modal after successful save or keep it open to show results
                    // if (newRfpModal) newRfpModal.style.display = 'none'; 
                    await loadSavedAnalysesInitial(); 
                } catch (saveError) {
                    if(analysisStatusArea) analysisStatusArea.innerHTML = `<p class="loading-text" style="color:orange;">Analysis complete, but failed to save: ${saveError.message}</p>`;
                }
            } catch (error) {  
                if(analysisStatusArea) analysisStatusArea.innerHTML = `<p class="loading-text" style="color:red;">Processing Error: ${error.message}</p>`;
                if(analysisStatusArea) analysisStatusArea.style.display = 'flex';
            } finally {
                 hideLoadingStateRFP(5000);
            }
        });
    }
    
    // Initial setup for analysis results tabs (if any is active by default in HTML)
    const firstActiveResultTab = document.querySelector('#analysis-results-area .tabs-container .tab-link.active');
    if (firstActiveResultTab) {
        const tabNameToOpen = firstActiveResultTab.getAttribute('onclick').match(/'([^']*)'/)[1];
        const tabElement = document.getElementById(tabNameToOpen);
        if (window.openTab && tabElement) { 
             // Only call if tab element exists to prevent error if ID is wrong or element removed
            if (tabElement.style.display !== 'block') { // Avoid redundant call if already visible
                 window.openTab(null, tabNameToOpen); 
            }
        }
    }
    
    loadSavedAnalysesInitial(); 
});
