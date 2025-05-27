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
        // Note: Not hiding analysisResultsArea here, only clearing tabs if it's a new analysis submission.
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
            analysisResultsArea.style.display = 'none'; // Hide details if the deleted one was shown
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

        if (currentStatusFilter === 'active') {
            filteredAnalyses = filteredAnalyses.filter(a => a.status === 'active');
        } else if (currentStatusFilter === 'not_pursuing') {
            filteredAnalyses = filteredAnalyses.filter(a => a.status === 'not_pursuing');
        } else if (currentStatusFilter === 'all') { 
            filteredAnalyses = filteredAnalyses.filter(a => a.status === 'analyzed' || a.status === 'active' || a.status === 'new'); // Include 'new' if applicable
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
                
                itemDiv.innerHTML = `
                    <span class="rfp-col-title" title="${displayTitle}">${displayTitle}</span>
                    <span class="rfp-col-type">${analysis.rfpType || 'N/A'}</span>
                    <span class="rfp-col-owner">${analysis.submittedBy || 'N/A'}</span>
                    <span class="rfp-col-date">${analysis.analysisDate && analysis.analysisDate._seconds ? new Date(analysis.analysisDate._seconds * 1000).toLocaleDateString() : 'N/A'}</span>
                    <span class="rfp-col-status"><span class="rfp-status-dot ${analysis.status === 'active' ? 'green' : analysis.status === 'not_pursuing' ? 'red' : 'orange'}" title="${analysis.status || 'analyzed'}"></span></span>
                    <span class="rfp-col-actions"></span>`; // Actions will be appended

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
                            if (window.openTab) window.openTab(null, tabNameToOpen); // Call global openTab for analysis results
                        }
                        const titleForStatus = detailedAnalysis.rfpTitle || detailedAnalysis.rfpFileName || 'N/A';
                        analysisStatusArea.innerHTML = `<p class="loading-text" style="color:green;">Displaying saved analysis: ${titleForStatus}</p>`;
                        analysisStatusArea.style.display = 'flex';
                    } catch (loadError) {
                        analysisStatusArea.innerHTML = `<p class="loading-text" style="color:red;">Error: ${loadError.message}</p>`;
                        analysisStatusArea.style.display = 'flex';
                    } finally {
                        hideLoadingStateRFP(5000); // Hide after showing details or error
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
            
            showLoadingStateRFP(true, "Starting analysis..."); // Placed before file checks
            analysisResultsArea.style.display = 'none'; // Hide old results area

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
1. A concise summary of the RFP. 2. A list of 5 to 15 critical clarification questions.
3. Key Deadlines. 4. A list of Key Requirements. 5. Mentioned Stakeholders. 6. Potential Risks.
Use format: ###SECTION_NAME_START### [Content] ###SECTION_NAME_END###
RFP Text: --- ${rfpText} ---`;
            
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
                        status: 'analyzed' // New RFPs are 'analyzed' by default
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
                    await loadSavedAnalysesInitial(); // Reload to show new entry in the list
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
        if (window.openTab && document.getElementById(tabNameToOpen)) { // Check if openTab and element exist
            window.openTab(null, tabNameToOpen); // Initialize the result tab display
        }
    }
    
    loadSavedAnalysesInitial(); 
});
