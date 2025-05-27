import * as pdfjsLib from 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/5.0.375/pdf.min.mjs';

pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/5.0.375/pdf.worker.min.mjs';

document.addEventListener('DOMContentLoaded', () => {
    const rfpForm = document.getElementById('rfp-details-form');
    const rfpFileUpload = document.getElementById('rfpFileUpload');
    const generateAnalysisButton = document.getElementById('generate-analysis-button');
    const analysisStatusArea = document.getElementById('analysis-status-area');
    const analysisResultsArea = document.getElementById('analysis-results-area');
    
    const summaryResultContentDiv = document.getElementById('summary-result-content');
    const questionsResultContentDiv = document.getElementById('questions-result-content');
    const deadlinesResultContentDiv = document.getElementById('deadlines-result-content');
    const requirementsResultContentDiv = document.getElementById('requirements-result-content');
    const stakeholdersResultContentDiv = document.getElementById('stakeholders-result-content');
    const risksResultContentDiv = document.getElementById('risks-result-content');
    
    const savedAnalysesListDiv = document.getElementById('saved-analyses-list');
    const noSavedAnalysesP = document.getElementById('no-saved-analyses');
    const rfpListTabsContainer = document.querySelector('.rfp-list-tabs');
    const yearSpanRFP = document.getElementById('current-year-rfp');

    let allFetchedAnalyses = []; 
    let currentSortKey = 'analysisDate'; 
    let currentSortOrder = 'desc'; 
    let currentStatusFilter = 'all'; 

    if (yearSpanRFP && !yearSpanRFP.textContent) {
        yearSpanRFP.textContent = new Date().getFullYear();
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

        showLoadingStateRFP(true, `Updating "${rfpTitleForMessage}" to ${newStatus}...`);
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
            renderAnalysesList();
            analysisStatusArea.innerHTML = `<p class="loading-text" style="color:green;">"${rfpTitleForMessage}" status updated to ${newStatus}!</p>`;
            analysisStatusArea.style.display = 'flex';
        } catch (error) {
            analysisStatusArea.innerHTML = `<p class="loading-text" style="color:red;">Error: ${error.message}</p>`;
            analysisStatusArea.style.display = 'flex';
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
            analysisResultsArea.style.display = 'none'; 
            analysisStatusArea.innerHTML = `<p class="loading-text" style="color:green;">"${rfpTitleForConfirm}" deleted successfully!</p>`;
            analysisStatusArea.style.display = 'flex';
        } catch (error) {
            analysisStatusArea.innerHTML = `<p class="loading-text" style="color:red;">Error: ${error.message}</p>`;
            analysisStatusArea.style.display = 'flex';
        } finally {
            hideLoadingStateRFP(3000);
        }
    }
    
    function renderAnalysesList() {
        if (!savedAnalysesListDiv || !noSavedAnalysesP) return;
        savedAnalysesListDiv.innerHTML = '';
        let filteredAnalyses = [...allFetchedAnalyses];

        // Apply status filter
        if (currentStatusFilter === 'active') {
            filteredAnalyses = filteredAnalyses.filter(a => a.status === 'active');
        } else if (currentStatusFilter === 'not_pursuing') {
            filteredAnalyses = filteredAnalyses.filter(a => a.status === 'not_pursuing');
        } else if (currentStatusFilter === 'all') { 
            filteredAnalyses = filteredAnalyses.filter(a => a.status === 'analyzed' || a.status === 'active' || a.status === 'new'); // Include 'new' if applicable
        }
        // else: if a different 'all' is needed, adjust filter condition


        // Apply sorting
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
                
                // Date and Time Formatting Update
                let formattedDateTime = 'N/A';
                if (analysis.analysisDate && typeof analysis.analysisDate._seconds === 'number') { 
                    const date = new Date(analysis.analysisDate._seconds * 1000); 
                    if (!isNaN(date.valueOf())) { 
                        const year = date.getFullYear();
                        const month = String(date.getMonth() + 1).padStart(2, '0');
                        const day = String(date.getDate()).padStart(2, '0');
                        const hours = String(date.getHours()).padStart(2, '0');
                        const minutes = String(date.getMinutes()).padStart(2, '0');
                        formattedDateTime = `${year}/${month}/${day} ${hours}:${minutes}`; // Shows YYYY/MM/DD HH:MM
                    }
                }

                // Status dot color logic (already implements the requested scheme)
                const statusDotClass = analysis.status === 'active' ? 'green' :
                                       analysis.status === 'not_pursuing' ? 'red' :
                                       'orange'; // Default to orange for 'analyzed' or other initial states

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
                    
                    showLoadingStateRFP(true, `Loading analysis for ${loadingMessageTitle}...`);
                    analysisResultsArea.style.display = 'none';
                    try {
                        const detailResponse = await fetch(`/api/rfp-analysis/${analysisId}`);
                        if (!detailResponse.ok) throw new Error((await detailResponse.json()).error || 'Failed to fetch details.');
                        const detailedAnalysis = await detailResponse.json();
                        
                        formatAndDisplayContent(summaryResultContentDiv, detailedAnalysis.rfpSummary || "Summary not available.");
                        formatAndDisplayContent(questionsResultContentDiv, detailedAnalysis.generatedQuestions || "Questions not available.");
                        formatAndDisplayContent(deadlinesResultContentDiv, detailedAnalysis.rfpDeadlines || "Deadlines not extracted.");
                        formatAndDisplayContent(requirementsResultContentDiv, detailedAnalysis.rfpKeyRequirements || "Key Requirements not extracted.");
                        formatAndDisplayContent(stakeholdersResultContentDiv, detailedAnalysis.rfpStakeholders || "Stakeholders not extracted.");
                        formatAndDisplayContent(risksResultContentDiv, detailedAnalysis.rfpRisks || "Risks not extracted.");
                        
                        analysisResultsArea.style.display = 'block';
                        const activeResultTab = document.querySelector('#analysis-results-area .tabs-container .tab-link.active') || document.querySelector('#analysis-results-area .tabs-container .tab-link');
                        if (activeResultTab) {
                            const tabNameToOpen = activeResultTab.getAttribute('onclick').match(/'([^']*)'/)[1];
                            if (window.openTab) window.openTab(null, tabNameToOpen); 
                        }
                        const titleForStatus = detailedAnalysis.rfpTitle || detailedAnalysis.rfpFileName || 'N/A';
                        analysisStatusArea.innerHTML = `<p class="loading-text" style="color:green;">Displaying saved analysis: ${titleForStatus}</p>`;
                        analysisStatusArea.style.display = 'flex';
                    } catch (loadError) {
                        analysisStatusArea.innerHTML = `<p class="loading-text" style="color:red;">Error: ${loadError.message}</p>`;
                        analysisStatusArea.style.display = 'flex';
                    } finally {
                        hideLoadingStateRFP(5000); 
                    }
                });
                actionsSpan.appendChild(viewLink);

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
                    setAnalyzedButton.innerHTML = '<i class="fas fa-inbox" aria-hidden="true"></i>'; // Example icon
                    setAnalyzedButton.title = "Move to All Analyzed";
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

    async function updateRfpTitle(rfpId, currentTitle) {
        const newTitle = window.prompt("Enter the new title for the RFP:", currentTitle);

        if (newTitle === null) { // User cancelled the prompt
            return;
        }
        if (newTitle.trim() === "") {
            window.alert("RFP Title cannot be empty.");
            return;
        }
        if (newTitle.trim() === currentTitle) {
            return; // No change
        }

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
            const updatedAnalysis = allFetchedAnalyses.find(a => a.id === rfpId);
            if (updatedAnalysis) {
                updatedAnalysis.rfpTitle = newTitle.trim();
            }
            renderAnalysesList(); // Re-render to show the updated title
            analysisStatusArea.innerHTML = `<p class="loading-text" style="color:green;">Title updated successfully!</p>`;
            analysisStatusArea.style.display = 'flex';
        } catch (error) {
            console.error('Error updating RFP title:', error);
            analysisStatusArea.innerHTML = `<p class="loading-text" style="color:red;">Error updating title: ${error.message}</p>`;
            analysisStatusArea.style.display = 'flex';
        } finally {
            hideLoadingStateRFP(3000);
        }
    }

    function renderAnalysesList() {
        if (!savedAnalysesListDiv || !noSavedAnalysesP) return;
        savedAnalysesListDiv.innerHTML = '';
        let filteredAnalyses = [...allFetchedAnalyses];

        // Apply status filter (existing logic)
        if (currentStatusFilter === 'active') {
            filteredAnalyses = filteredAnalyses.filter(a => a.status === 'active');
        } else if (currentStatusFilter === 'not_pursuing') {
            filteredAnalyses = filteredAnalyses.filter(a => a.status === 'not_pursuing');
        } else if (currentStatusFilter === 'all') { 
            filteredAnalyses = filteredAnalyses.filter(a => a.status === 'analyzed' || a.status === 'active' || a.status === 'new');
        }

        // Apply sorting (existing logic)
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
                
                // View Details Link (existing)
                const viewLink = document.createElement('a');
                // ... (viewLink setup and event listener as before) ...
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
                    
                    showLoadingStateRFP(true, `Loading analysis for ${loadingMessageTitle}...`);
                    analysisResultsArea.style.display = 'none';
                    try {
                        const detailResponse = await fetch(`/api/rfp-analysis/${analysisId}`);
                        if (!detailResponse.ok) throw new Error((await detailResponse.json()).error || 'Failed to fetch details.');
                        const detailedAnalysis = await detailResponse.json();
                        
                        formatAndDisplayContent(summaryResultContentDiv, detailedAnalysis.rfpSummary || "Summary not available.");
                        formatAndDisplayContent(questionsResultContentDiv, detailedAnalysis.generatedQuestions || "Questions not available.");
                        formatAndDisplayContent(deadlinesResultContentDiv, detailedAnalysis.rfpDeadlines || "Deadlines not extracted.");
                        formatAndDisplayContent(requirementsResultContentDiv, detailedAnalysis.rfpKeyRequirements || "Key Requirements not extracted.");
                        formatAndDisplayContent(stakeholdersResultContentDiv, detailedAnalysis.rfpStakeholders || "Stakeholders not extracted.");
                        formatAndDisplayContent(risksResultContentDiv, detailedAnalysis.rfpRisks || "Risks not extracted.");
                        
                        analysisResultsArea.style.display = 'block';
                        const activeResultTab = document.querySelector('#analysis-results-area .tabs-container .tab-link.active') || document.querySelector('#analysis-results-area .tabs-container .tab-link');
                        if (activeResultTab) {
                            const tabNameToOpen = activeResultTab.getAttribute('onclick').match(/'([^']*)'/)[1];
                            if (window.openTab) window.openTab(null, tabNameToOpen); 
                        }
                        const titleForStatus = detailedAnalysis.rfpTitle || detailedAnalysis.rfpFileName || 'N/A';
                        analysisStatusArea.innerHTML = `<p class="loading-text" style="color:green;">Displaying saved analysis: ${titleForStatus}</p>`;
                        analysisStatusArea.style.display = 'flex';
                    } catch (loadError) {
                        analysisStatusArea.innerHTML = `<p class="loading-text" style="color:red;">Error: ${loadError.message}</p>`;
                        analysisStatusArea.style.display = 'flex';
                    } finally {
                        hideLoadingStateRFP(5000); 
                    }
                });
                actionsSpan.appendChild(viewLink);

                // ADDED: Edit Title Button
                const editTitleButton = document.createElement('button');
                editTitleButton.className = 'action-icon';
                editTitleButton.innerHTML = '<i class="fas fa-edit" aria-hidden="true"></i><span class="visually-hidden">Edit Title</span>';
                editTitleButton.title = "Edit RFP Title";
                editTitleButton.onclick = () => updateRfpTitle(analysis.id, displayTitle); // Pass current displayTitle for the prompt
                actionsSpan.appendChild(editTitleButton);


                // Move to Active Button (existing)
                if (analysis.status !== 'active') {
                    // ... (code for setActiveButton as before) ...
                    const setActiveButton = document.createElement('button');
                    setActiveButton.className = 'action-icon';
                    setActiveButton.innerHTML = '<i class="fas fa-check-circle" aria-hidden="true"></i>';
                    setActiveButton.title = "Move to Active";
                    setActiveButton.onclick = () => updateRfpStatus(analysis.id, 'active');
                    actionsSpan.appendChild(setActiveButton);
                }
                // Move to Not Pursuing Button (existing)
                if (analysis.status !== 'not_pursuing') {
                    // ... (code for setNotPursuingButton as before) ...
                    const setNotPursuingButton = document.createElement('button');
                    setNotPursuingButton.className = 'action-icon';
                    setNotPursuingButton.innerHTML = '<i class="fas fa-times-circle" aria-hidden="true"></i>';
                    setNotPursuingButton.title = "Move to Not Pursuing";
                    setNotPursuingButton.onclick = () => updateRfpStatus(analysis.id, 'not_pursuing');
                    actionsSpan.appendChild(setNotPursuingButton);
                }
                // Move to Analyzed/Unactuated Button (existing)
                if (analysis.status === 'active' || analysis.status === 'not_pursuing') {
                    // ... (code for setAnalyzedButton as before) ...
                    const setAnalyzedButton = document.createElement('button');
                    setAnalyzedButton.className = 'action-icon';
                    setAnalyzedButton.innerHTML = '<i class="fas fa-inbox" aria-hidden="true"></i>';
                    setAnalyzedButton.title = "Move to Analyzed/Unactuated";
                    setAnalyzedButton.onclick = () => updateRfpStatus(analysis.id, 'analyzed');
                    actionsSpan.appendChild(setAnalyzedButton);
                }

                // Delete Button (existing)
                const deleteButton = document.createElement('button');
                // ... (code for deleteButton as before) ...
                deleteButton.className = 'action-icon delete';
                deleteButton.innerHTML = '<i class="fas fa-trash-alt" aria-hidden="true"></i>';
                deleteButton.title = "Delete RFP";
                deleteButton.onclick = () => deleteRfp(analysis.id, displayTitle);
                actionsSpan.appendChild(deleteButton);
                
                // itemDiv.appendChild(actionsSpan); // actionsSpan is already part of itemDiv.innerHTML setup
                savedAnalysesListDiv.appendChild(itemDiv);
            });
        }
    }

    async function loadSavedAnalysesInitial() {
        showLoadingStateRFP(true, "Loading saved analyses...");
        try {
            const response = await fetch('/api/rfp-analyses');
            if (!response.ok) throw new Error((await response.json()).error || 'Failed to fetch analyses.');
            allFetchedAnalyses = await response.json();
            renderAnalysesList(); 
        } catch (error) { 
            savedAnalysesListDiv.innerHTML = `<p class="loading-text" style="color:red; text-align:center;">Failed to load: ${error.message}</p>`;
            noSavedAnalysesP.style.display = 'block';
            noSavedAnalysesP.textContent = `Failed to load analyses.`;
        } finally {
            hideLoadingStateRFP();
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
            analysisResultsArea.style.display = 'none'; 

            if (!file) {
                analysisStatusArea.innerHTML = `<p class="loading-text" style="color:red;">Please upload an RFP document.</p>`;
                analysisStatusArea.style.display = 'flex';
                hideLoadingStateRFP(3000);
                return; 
            }
            const rfpFileNameValue = file.name; 
            if (file.type !== "application/pdf") { 
                analysisStatusArea.innerHTML = `<p class="loading-text" style="color:red;">Invalid file type. Please upload a PDF.</p>`;
                analysisStatusArea.style.display = 'flex';
                hideLoadingStateRFP(3000);
                return;
            }

            let rfpText = "";
            try { 
                showLoadingStateRFP(true, "Extracting text from PDF...");
                rfpText = await extractTextFromPdf(file);
                if (!rfpText || rfpText.trim().length < 50) throw new Error("Insufficient text from PDF.");
            } catch (error) { 
                analysisStatusArea.innerHTML = `<p class="loading-text" style="color:red;">PDF Error: ${error.message}</p>`;
                analysisStatusArea.style.display = 'flex';
                hideLoadingStateRFP(5000);
                return; 
            }

            const aiPrompt = `Please analyze the following Request for Proposal (RFP) text.
Provide the following distinct sections in your response, each clearly delimited:
1. A concise summary of the RFP.
2. A list of 5 to 15 critical and insightful clarification questions based on the RFP.
3. Key Deadlines mentioned in the RFP.
4. A list of Key Requirements (e.g., mandatory, highly desirable).
5. Mentioned Stakeholders or Key Contacts.
6. Potential Risks or Red Flags identified in the RFP.

Use the following format strictly for each section:

###SUMMARY_START###
[Your generated summary of the RFP here. Aim for 5-8 key bullet points or a paragraph.]
###SUMMARY_END###

###QUESTIONS_START###
[Your list of generated questions here. Each question should ideally be on a new line. You can use natural numbering.]
###QUESTIONS_END###

###DEADLINES_START###
[List any key deadlines, e.g., Submission Deadline: YYYY-MM-DD, Q&A Period Ends: YYYY-MM-DD.]
###DEADLINES_END###

###KEY_REQUIREMENTS_START###
[List key requirements. You can use bullet points. Categorize if possible, e.g., **Mandatory:**, **Desirable:**.]
###KEY_REQUIREMENTS_END###

###STAKEHOLDERS_START###
[List any mentioned stakeholders, roles, or key contacts.]
###STAKEHOLDERS_END###

###RISKS_START###
[List any potential risks, ambiguities, or red flags identified.]
###RISKS_END###

RFP Text:
---
${rfpText}
---
`;
            
            let summaryText, questionsText, deadlinesText, requirementsText, stakeholdersText, risksText;
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
                // **** IMPORTANT: Log the raw AI output for debugging ****
                console.log("Raw AI Output from Gemini:\n", rawAiOutput);
                // **** END OF LOGGING ****

                const parseSection = (output, sectionName) => {
                    const regex = new RegExp(`###${sectionName}_START###([\\s\\S]*?)###${sectionName}_END###`);
                    const match = output.match(regex);
                    return match && match[1] ? match[1].trim() : defaultErrorMsg(sectionName);
                };
                summaryText = parseSection(rawAiOutput, "SUMMARY");
                questionsText = parseSection(rawAiOutput, "QUESTIONS"); 
                deadlinesText = parseSection(rawAiOutput, "DEADLINES");
                requirementsText = parseSection(rawAiOutput, "KEY_REQUIREMENTS");
                stakeholdersText = parseSection(rawAiOutput, "STAKEHOLDERS");
                risksText = parseSection(rawAiOutput, "RISKS");
                
                formatAndDisplayContent(summaryResultContentDiv, summaryText);
                formatAndDisplayContent(questionsResultContentDiv, questionsText); 
                formatAndDisplayContent(deadlinesResultContentDiv, deadlinesText);
                formatAndDisplayContent(requirementsResultContentDiv, requirementsText);
                formatAndDisplayContent(stakeholdersResultContentDiv, stakeholdersText);
                formatAndDisplayContent(risksResultContentDiv, risksText);
                
                analysisResultsArea.style.display = 'block';
                const activeResultTab = document.querySelector('#analysis-results-area .tabs-container .tab-link.active') || document.querySelector('#analysis-results-area .tabs-container .tab-link');
                if (activeResultTab) {
                    const tabNameToOpen = activeResultTab.getAttribute('onclick').match(/'([^']*)'/)[1];
                    if(window.openTab) window.openTab(null, tabNameToOpen);
                }

                analysisStatusArea.innerHTML = `<p class="loading-text" style="color:green;">RFP analysis complete! Saving results...</p>`;
                analysisStatusArea.style.display = 'flex';

                try {
                    const savePayload = { 
                        rfpTitle: rfpTitleValue || "", 
                        rfpType: rfpTypeValue,   
                        submittedBy: submittedByValue, 
                        rfpFileName: rfpFileNameValue, 
                        rfpSummary: summaryText, 
                        generatedQuestions: questionsText,
                        rfpDeadlines: deadlinesText,
                        rfpKeyRequirements: requirementsText,
                        rfpStakeholders: stakeholdersText,
                        rfpRisks: risksText,
                        status: 'analyzed' 
                    };
                    const saveResponse = await fetch('/api/rfp-analysis', { 
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(savePayload)
                    });
                    if (!saveResponse.ok) throw new Error((await saveResponse.json()).error || 'Failed to save analysis.');
                    
                    analysisStatusArea.innerHTML = `<p class="loading-text" style="color:green;">Analysis complete and results saved!</p>`;
                    document.getElementById('rfpTitle').value = ''; 
                    rfpFileUpload.value = ''; 
                    await loadSavedAnalysesInitial(); 
                } catch (saveError) {
                    analysisStatusArea.innerHTML = `<p class="loading-text" style="color:orange;">Analysis complete, but failed to save: ${saveError.message}</p>`;
                }
            } catch (error) {  
                analysisStatusArea.innerHTML = `<p class="loading-text" style="color:red;">Processing Error: ${error.message}</p>`;
                analysisStatusArea.style.display = 'flex';
            } finally {
                 hideLoadingStateRFP(5000);
            }
        });
    }
    
    const firstActiveResultTab = document.querySelector('#analysis-results-area .tabs-container .tab-link.active') || document.querySelector('#analysis-results-area .tabs-container .tab-link');
    if (firstActiveResultTab) {
        const tabNameToOpen = firstActiveResultTab.getAttribute('onclick').match(/'([^']*)'/)[1];
        if (window.openTab && document.getElementById(tabNameToOpen)) { 
            window.openTab(null, tabNameToOpen); 
        }
    }
    
    loadSavedAnalysesInitial(); 
});
