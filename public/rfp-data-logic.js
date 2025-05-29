import * as pdfjsLib from 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/5.0.375/pdf.min.mjs'; //
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/5.0.375/pdf.worker.min.mjs'; //

// Assumes functions from rfp-ui-interactions.js (e.g., showLoadingMessage, clearViewAnalysisResultTabs)
// and rfp-ai-module.js (e.g., constructFullRfpAnalysisPrompt, formatAndDisplayContentWithPrompt, PROMPT_CONFIG)
// are available globally (e.g., on window object) or will be properly imported.

// --- State Variables ---
let allFetchedAnalyses = []; //
let currentSortKey = 'analysisDate'; //
let currentSortOrder = 'desc'; //
let currentStatusFilter = 'all'; //

// DOM elements that this module might need to instruct UI module to update
// These would be passed to renderAnalysesList or other functions
// let savedAnalysesListDiv, noSavedAnalysesP, rfpListStatusArea; (obtained via parameters)
// let viewRfpMainTitleHeading, viewRfpStatusArea, viewAnalysisResultsArea, viewTabContentMap; (obtained via parameters)

// --- PDF Extraction ---
async function extractTextFromPdf(file) { //
    return new Promise((resolve, reject) => { //
        const reader = new FileReader(); //
        reader.onload = async (event) => { //
            try {
                const pdfData = new Uint8Array(event.target.result); //
                const pdfDoc = await pdfjsLib.getDocument({ data: pdfData }).promise; //
                let fullText = ''; //
                for (let i = 1; i <= pdfDoc.numPages; i++) { //
                    const page = await pdfDoc.getPage(i); //
                    const textContent = await page.getTextContent(); //
                    fullText += textContent.items.map(item => item.str).join(' ') + '\n'; //
                }
                resolve(fullText.trim()); //
            } catch (err) {
                reject(new Error(`Failed to extract text from PDF '${file.name}': ${err.message}`)); //
            }
        };
        reader.onerror = (err) => reject(new Error(`FileReader error for '${file.name}': ${err.message}`)); //
        reader.readAsArrayBuffer(file); //
    });
}

// --- API Call Functions for List Item Actions ---
async function updateRfpStatus(rfpId, newStatus, uiCallbacks) { //
    const { showLoadingMessage, hideLoadingMessage, rfpListStatusArea } = uiCallbacks;
    const rfpToUpdate = allFetchedAnalyses.find(a => a.id === rfpId); //
    const rfpTitleForMessage = rfpToUpdate ? (rfpToUpdate.rfpTitle || rfpToUpdate.rfpFileName || 'this RFP') : 'this RFP'; //
    showLoadingMessage(rfpListStatusArea, `Updating "${rfpTitleForMessage}" to ${newStatus}...`); //
    try {
        const response = await fetch(`/api/rfp-analysis/${rfpId}/status`, { //
            method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: newStatus }), //
        });
        if (!response.ok) throw new Error((await response.json()).error || 'Failed to update status.'); //
        const updatedAnalysis = allFetchedAnalyses.find(a => a.id === rfpId); //
        if (updatedAnalysis) updatedAnalysis.status = newStatus; //
        renderAnalysesList(uiCallbacks.savedAnalysesListDiv, uiCallbacks.noSavedAnalysesP, uiCallbacks); //
        showLoadingMessage(rfpListStatusArea, `"${rfpTitleForMessage}" status updated to ${newStatus}!`, false); //
    } catch (error) { showLoadingMessage(rfpListStatusArea, `Error: ${error.message}`, false); //
    } finally { hideLoadingMessage(rfpListStatusArea, 3000); } //
}
async function updateRfpTitle(rfpId, currentTitle, uiCallbacks) { //
    const { showLoadingMessage, hideLoadingMessage, rfpListStatusArea } = uiCallbacks;
    const newTitle = window.prompt("Enter the new title for the RFP:", currentTitle); //
    if (newTitle === null || newTitle.trim() === "" || newTitle.trim() === currentTitle) return; //
    showLoadingMessage(rfpListStatusArea, `Updating title for "${currentTitle}"...`); //
    try {
        const response = await fetch(`/api/rfp-analysis/${rfpId}/title`, { //
            method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ rfpTitle: newTitle.trim() }), //
        });
        if (!response.ok) throw new Error((await response.json()).error || `Failed to update title.`); //
        const updatedRfp = allFetchedAnalyses.find(a => a.id === rfpId); //
        if (updatedRfp) updatedRfp.rfpTitle = newTitle.trim(); //
        renderAnalysesList(uiCallbacks.savedAnalysesListDiv, uiCallbacks.noSavedAnalysesP, uiCallbacks); //
        showLoadingMessage(rfpListStatusArea, `Title updated successfully!`, false); //
    } catch (error) { showLoadingMessage(rfpListStatusArea, `Error updating title: ${error.message}`, false); //
    } finally { hideLoadingMessage(rfpListStatusArea, 3000); } //
}
async function deleteRfp(rfpId, rfpTitleForConfirm, uiCallbacks) { //
    const { showLoadingMessage, hideLoadingMessage, rfpListStatusArea, viewSavedRfpDetailsSection } = uiCallbacks;
    if (!window.confirm(`Are you sure you want to delete RFP: "${rfpTitleForConfirm}"? This action cannot be undone.`)) return; //
    showLoadingMessage(rfpListStatusArea, `Deleting "${rfpTitleForConfirm}"...`); //
    try {
        const response = await fetch(`/api/rfp-analysis/${rfpId}`, { method: 'DELETE' }); //
        if (!response.ok) throw new Error((await response.json()).error || `Failed to delete ${rfpTitleForConfirm}.`); //
        allFetchedAnalyses = allFetchedAnalyses.filter(a => a.id !== rfpId); //
        renderAnalysesList(uiCallbacks.savedAnalysesListDiv, uiCallbacks.noSavedAnalysesP, uiCallbacks); //
        if (viewSavedRfpDetailsSection && viewSavedRfpDetailsSection.classList.contains('modal-active') && //
            viewSavedRfpDetailsSection.dataset.currentViewingId === rfpId) { //
            viewSavedRfpDetailsSection.classList.remove('modal-active'); //
            viewSavedRfpDetailsSection.style.display = 'none'; //
            document.body.style.overflow = ''; //
        }
        showLoadingMessage(rfpListStatusArea, `"${rfpTitleForConfirm}" deleted successfully!`, false); //
    } catch (error) { showLoadingMessage(rfpListStatusArea, `Error deleting: ${error.message}`, false); //
    } finally { hideLoadingMessage(rfpListStatusArea, 3000); } //
}

// --- Function to Display RFP Details in View Modal ---
async function displayRfpDetailsInViewModal(analysisId, uiElements) {
    const {
        viewSavedRfpDetailsSection,
        viewRfpMainTitleHeading,
        viewRfpStatusArea,
        viewAnalysisResultsArea,
        viewTabContentMap, // Map of content divs for each tab
        showLoadingMessage,
        hideLoadingMessage,
        clearViewAnalysisResultTabs,
        formatAndDisplayContentWithPrompt, // From AI module
        PROMPT_CONFIG // From AI module
    } = uiElements;

    if (window.newRfpModal) window.newRfpModal.style.display = 'none'; // From UI module if exposed
    if (window.promptSettingsModal) window.promptSettingsModal.style.display = 'none'; // From UI module if exposed

    if (viewSavedRfpDetailsSection) {
        viewSavedRfpDetailsSection.dataset.currentViewingId = analysisId;
        viewSavedRfpDetailsSection.style.display = 'block';
        viewSavedRfpDetailsSection.classList.add('modal-active');
        document.body.style.overflow = 'hidden';
    }

    const rfpItem = allFetchedAnalyses.find(a => a.id === analysisId);
    const loadingMessageTitle = rfpItem ? (rfpItem.rfpTitle || rfpItem.rfpFileName || 'Selected RFP') : 'Selected RFP';

    if (viewRfpMainTitleHeading) viewRfpMainTitleHeading.textContent = `Details for: ${loadingMessageTitle}`;
    showLoadingMessage(viewRfpStatusArea, `Loading analysis for ${loadingMessageTitle}...`);
    if (viewAnalysisResultsArea) viewAnalysisResultsArea.style.display = 'none';
    clearViewAnalysisResultTabs(); // UI function

    let loadErrorOccurred = false;
    try {
        const detailResponse = await fetch(`/api/rfp-analysis/${analysisId}`); //
        if (!detailResponse.ok) throw new Error((await detailResponse.json()).error || 'Failed to fetch details.'); //
        const detailedAnalysis = await detailResponse.json(); //
        
        const savedPrompts = detailedAnalysis.analysisPrompts || {}; //

        Object.keys(PROMPT_CONFIG).forEach(keySuffix => { //
            const contentDiv = viewTabContentMap[keySuffix]; //
            const sectionContent = detailedAnalysis[keySuffix === 'questions' ? 'generatedQuestions' : `rfp${keySuffix.charAt(0).toUpperCase() + keySuffix.slice(1)}`] ||  //
                                  detailedAnalysis[`rfp${keySuffix.charAt(0).toUpperCase() + keySuffix.slice(1).replace('Format', 'SubmissionFormat').replace('KeyRequirements', 'KeyRequirements')}`] || //
                                  (keySuffix === 'summary' ? detailedAnalysis.rfpSummary : null) || //
                                  "N/A"; //
            const promptText = savedPrompts[keySuffix] || PROMPT_CONFIG[keySuffix]?.defaultText; //
            
            if (contentDiv) { //
                formatAndDisplayContentWithPrompt(contentDiv, keySuffix, promptText, sectionContent); //
            } else if (keySuffix === 'deadlines' || keySuffix === 'submissionFormat') {
                // Handled by clearViewAnalysisResultTabs' reconstruction
            } else {
                console.warn(`View Tab Content Div not found for key: ${keySuffix}`); //
            }
        });
        
        if (viewAnalysisResultsArea) viewAnalysisResultsArea.style.display = 'block'; //
        // Activate the first tab in the view modal
        const firstViewTabLink = document.querySelector('#view-saved-rfp-details-section.modal-active .tabs-container .tab-link'); //
        if (firstViewTabLink && window.openViewTab) { //
            document.querySelectorAll('#view-saved-rfp-details-section.modal-active .tabs-container .tab-link').forEach(tl => tl.classList.remove('active')); //
            firstViewTabLink.classList.add('active');  //
            const tabNameToOpen = firstViewTabLink.getAttribute('onclick').match(/'([^']*)'/)[1]; //
            window.openViewTab(null, tabNameToOpen);  //
        }
        
        const titleForStatus = detailedAnalysis.rfpTitle || detailedAnalysis.rfpFileName || 'N/A'; //
        showLoadingMessage(viewRfpStatusArea, `Displaying: ${titleForStatus}`, false); //
    } catch (loadError) {
         loadErrorOccurred = true; //
         showLoadingMessage(viewRfpStatusArea, `Error: ${loadError.message}`, false); //
    } finally {
        setTimeout(() => hideLoadingMessage(viewRfpStatusArea), loadErrorOccurred ? 5000 : 2000);  //
    }
}


// --- Render Saved Analyses List (Main Page) ---
// Needs savedAnalysesListDiv, noSavedAnalysesP from UI module (passed as args)
// Also needs uiCallbacks for its child actions
function renderAnalysesList(savedAnalysesListDiv, noSavedAnalysesP, uiCallbacks) { //
    if (!savedAnalysesListDiv || !noSavedAnalysesP) return; //
    savedAnalysesListDiv.innerHTML = ''; //
    let filteredAnalyses = [...allFetchedAnalyses]; //

    if (currentStatusFilter === 'active') { //
        filteredAnalyses = filteredAnalyses.filter(a => a.status === 'active'); //
    } else if (currentStatusFilter === 'not_pursuing') { //
        filteredAnalyses = filteredAnalyses.filter(a => a.status === 'not_pursuing'); //
    } else if (currentStatusFilter === 'all') { //
         filteredAnalyses = filteredAnalyses.filter(a => a.status === 'analyzed' || a.status === 'active' || a.status === 'new'); //
    }


    filteredAnalyses.sort((a, b) => { //
        let valA = a[currentSortKey]; let valB = b[currentSortKey]; //
        if (currentSortKey === 'analysisDate') { //
            valA = a.analysisDate && a.analysisDate._seconds ? Number(a.analysisDate._seconds) : 0; //
            valB = b.analysisDate && b.analysisDate._seconds ? Number(b.analysisDate._seconds) : 0; //
        } else {
            valA = (typeof valA === 'string' ? valA.toLowerCase() : (valA || '')).toString(); //
            valB = (typeof valB === 'string' ? valB.toLowerCase() : (valB || '')).toString(); //
        }
        if (valA < valB) return currentSortOrder === 'asc' ? -1 : 1; //
        if (valA > valB) return currentSortOrder === 'asc' ? 1 : -1; //
        return 0; //
    });

    if (filteredAnalyses.length === 0) { //
        noSavedAnalysesP.style.display = 'block'; //
        noSavedAnalysesP.textContent = `No analyses found for "${currentStatusFilter}" category.`; //
    } else {
        noSavedAnalysesP.style.display = 'none'; //
        filteredAnalyses.forEach(analysis => { //
            const itemDiv = document.createElement('div'); //
            itemDiv.className = 'analyzed-rfp-item'; //
            const displayTitle = analysis.rfpTitle || analysis.rfpFileName || 'N/A'; //
            let formattedDateTime = 'N/A'; //
            if (analysis.analysisDate && typeof analysis.analysisDate._seconds === 'number') { //
                const date = new Date(analysis.analysisDate._seconds * 1000); //
                if (!isNaN(date.valueOf())) { //
                    const year = date.getFullYear(); const month = String(date.getMonth() + 1).padStart(2, '0'); //
                    const day = String(date.getDate()).padStart(2, '0'); const hours = String(date.getHours()).padStart(2, '0'); //
                    const minutes = String(date.getMinutes()).padStart(2, '0'); //
                    formattedDateTime = `${year}/${month}/${day} ${hours}:${minutes}`; //
                }
            }
            const statusDotClass = analysis.status === 'active' ? 'green' : //
                                   analysis.status === 'not_pursuing' ? 'red' : 'orange'; //

            itemDiv.innerHTML = `
                <span class="rfp-col-title" title="${displayTitle}">${displayTitle}</span>
                <span class="rfp-col-type">${analysis.rfpType || 'N/A'}</span>
                <span class="rfp-col-owner">${analysis.submittedBy || 'N/A'}</span>
                <span class="rfp-col-date">${formattedDateTime}</span>
                <span class="rfp-col-status"><span class="rfp-status-dot ${statusDotClass}" title="${analysis.status || 'analyzed'}"></span></span>
                <span class="rfp-col-actions"></span>`; //

            const actionsSpan = itemDiv.querySelector('.rfp-col-actions'); //

            const viewLink = document.createElement('a'); //
            viewLink.href = '#'; viewLink.className = 'rfp-view-details action-icon'; //
            viewLink.dataset.id = analysis.id; //
            viewLink.innerHTML = '<i class="fas fa-eye" aria-hidden="true"></i><span class="visually-hidden">View Details</span>'; //
            viewLink.title = "View Analysis Details"; //
            viewLink.addEventListener('click', (e) => { //
                e.preventDefault(); //
                displayRfpDetailsInViewModal(analysis.id, uiCallbacks.viewModalElements);
            });
            actionsSpan.appendChild(viewLink); //

            const editTitleButton = document.createElement('button'); //
            editTitleButton.className = 'action-icon'; //
            editTitleButton.innerHTML = '<i class="fas fa-edit" aria-hidden="true"></i><span class="visually-hidden">Edit Title</span>'; //
            editTitleButton.title = "Edit RFP Title"; //
            editTitleButton.onclick = () => updateRfpTitle(analysis.id, displayTitle, uiCallbacks); //
            actionsSpan.appendChild(editTitleButton); //

            if (analysis.status !== 'active') { //
                const setActiveButton = document.createElement('button'); //
                setActiveButton.className = 'action-icon'; //
                setActiveButton.innerHTML = '<i class="fas fa-check-circle" aria-hidden="true"></i>'; //
                setActiveButton.title = "Move to Active"; //
                setActiveButton.onclick = () => updateRfpStatus(analysis.id, 'active', uiCallbacks); //
                actionsSpan.appendChild(setActiveButton); //
            }
            if (analysis.status !== 'not_pursuing') { //
                const setNotPursuingButton = document.createElement('button'); //
                setNotPursuingButton.className = 'action-icon'; //
                setNotPursuingButton.innerHTML = '<i class="fas fa-times-circle" aria-hidden="true"></i>'; //
                setNotPursuingButton.title = "Move to Not Pursuing"; //
                setNotPursuingButton.onclick = () => updateRfpStatus(analysis.id, 'not_pursuing', uiCallbacks); //
                actionsSpan.appendChild(setNotPursuingButton); //
            }
             if (analysis.status === 'active' || analysis.status === 'not_pursuing') { //
                const setAnalyzedButton = document.createElement('button'); //
                setAnalyzedButton.className = 'action-icon'; //
                setAnalyzedButton.innerHTML = '<i class="fas fa-inbox" aria-hidden="true"></i>'; //
                setAnalyzedButton.title = "Move to Analyzed/Unactuated"; //
                setAnalyzedButton.onclick = () => updateRfpStatus(analysis.id, 'analyzed', uiCallbacks); //
                actionsSpan.appendChild(setAnalyzedButton); //
            }
            const deleteButton = document.createElement('button'); //
            deleteButton.className = 'action-icon delete'; //
            deleteButton.innerHTML = '<i class="fas fa-trash-alt" aria-hidden="true"></i>'; //
            deleteButton.title = "Delete RFP"; //
            deleteButton.onclick = () => deleteRfp(analysis.id, displayTitle, uiCallbacks); //
            actionsSpan.appendChild(deleteButton); //

            savedAnalysesListDiv.appendChild(itemDiv); //
        });
    }
}
async function loadSavedAnalysesInitial(rfpListStatusArea, savedAnalysesListDiv, noSavedAnalysesP, uiCallbacks) { //
    uiCallbacks.showLoadingMessage(rfpListStatusArea, "Loading saved analyses...", true); //
    try {
        const response = await fetch('/api/rfp-analyses'); //
        if (!response.ok) throw new Error((await response.json()).error || 'Failed to fetch analyses.'); //
        allFetchedAnalyses = await response.json(); //
        renderAnalysesList(savedAnalysesListDiv, noSavedAnalysesP, uiCallbacks); //
    } catch (error) {
        if(savedAnalysesListDiv) savedAnalysesListDiv.innerHTML = `<p class="loading-text" style="color:red; text-align:center;">Failed to load: ${error.message}</p>`; //
        if(noSavedAnalysesP) noSavedAnalysesP.style.display = 'block'; //
        if(noSavedAnalysesP) noSavedAnalysesP.textContent = `Failed to load analyses.`; //
    } finally {
        uiCallbacks.hideLoadingMessage(rfpListStatusArea); //
    }
}


// --- RFP Form Submission Handler (called from rfp-ui-interactions.js) ---
async function handleRfpFormSubmit(params) {
    const {
        rfpTitleValue, rfpTypeValue, submittedByValue, mainRfpFile, addendumFiles, rfpFileNameValue,
        modalAnalysisStatusArea, modalAnalysisResultsArea, modalTabContentMap,
        showLoadingMessage, hideLoadingMessage, clearModalAnalysisResultTabs,
        // Dependencies from AI module (expected on window or passed if using true modules)
        constructFullRfpAnalysisPrompt, formatAndDisplayContentWithPrompt, getStoredSectionPrompt, PROMPT_CONFIG
    } = params;

    let combinedRfpText = ""; //
    let filesToProcess = [mainRfpFile]; //
    
    for (let i = 0; i < addendumFiles.length; i++) { //
        if (addendumFiles[i].type === "application/pdf") { //
            filesToProcess.push(addendumFiles[i]); //
        } else {
            console.warn(`Skipping non-PDF addendum: '${addendumFiles[i].name}'.`); //
        }
    }

    try {
        for (let i = 0; i < filesToProcess.length; i++) { //
            const file = filesToProcess[i]; //
            showLoadingMessage(modalAnalysisStatusArea, `Extracting text from ${file.name} (${i + 1}/${filesToProcess.length})...`); //
            const text = await extractTextFromPdf(file); //
            combinedRfpText += text + "\n\n"; //
            if (!text || text.trim().length < 10) { //
                console.warn(`Minimal text extracted from ${file.name}.`); //
            }
        }
        
        if (combinedRfpText.trim().length < 50) { //
            throw new Error("Insufficient total text extracted from PDF(s) for analysis."); //
        }

    } catch (error) {
        showLoadingMessage(modalAnalysisStatusArea, `PDF Error: ${error.message}`, false); //
        hideLoadingMessage(modalAnalysisStatusArea, 5000); //
        if (params.generateAnalysisButton) params.generateAnalysisButton.disabled = false; // Re-enable button if passed
        return; //
    }
    
    const aiPrompt = constructFullRfpAnalysisPrompt(combinedRfpText); //
    console.log("Constructed AI Prompt for Submission:\n", aiPrompt); //

    const currentAnalysisPrompts = {}; //
    Object.keys(PROMPT_CONFIG).forEach(keySuffix => { //
        currentAnalysisPrompts[keySuffix] = getStoredSectionPrompt(keySuffix); //
    });

    let parsedAISections = {}; //

    try {
        showLoadingMessage(modalAnalysisStatusArea, "AI is analyzing and generating content..."); //
        const response = await fetch('/api/generate', { //
            method: 'POST', //
            headers: { 'Content-Type': 'application/json' }, //
            body: JSON.stringify({ prompt: aiPrompt }) //
        });
        if (!response.ok) throw new Error((await response.json()).error || 'AI API error.'); //
        const data = await response.json(); //

        let rawAiOutput = data.generatedText.replace(/^```[a-z]*\s*/im, '').replace(/\s*```$/m, ''); //
        console.log("Raw AI Output from Gemini (New RFP):\n", rawAiOutput); //

        const parseSection = (output, delimiterKey) => {  //
            const regex = new RegExp(`###${delimiterKey}_START###([\\s\\S]*?)###${delimiterKey}_END###`); //
            const match = output.match(regex); //
            return match && match[1] ? match[1].trim() : `${delimiterKey.replace(/_/g, ' ')} not found in AI response.`; //
        };
        
        Object.keys(PROMPT_CONFIG).forEach(keySuffix => { //
            parsedAISections[keySuffix] = parseSection(rawAiOutput, PROMPT_CONFIG[keySuffix].delimiterKey); //
        });

        clearModalAnalysisResultTabs(); // UI function //

        Object.keys(PROMPT_CONFIG).forEach(keySuffix => { //
            const contentDiv = modalTabContentMap[keySuffix]; //
            const promptText = currentAnalysisPrompts[keySuffix]; //
            const sectionContent = parsedAISections[keySuffix]; //
            if (contentDiv) { //
                 formatAndDisplayContentWithPrompt(contentDiv, keySuffix, promptText, sectionContent); //
            } else {
                console.warn(`Modal Tab Content Div not found for key: ${keySuffix}`); //
            }
        });

        if (modalAnalysisResultsArea) modalAnalysisResultsArea.style.display = 'block'; //
        // Activate first tab in modal results
        const activeModalResultTab = document.querySelector('#new-rfp-modal .tabs-container .tab-link'); //
        if (activeModalResultTab && window.openModalTab) { //
            document.querySelectorAll('#new-rfp-modal .tabs-container .tab-link').forEach(tl => tl.classList.remove('active')); //
            activeModalResultTab.classList.add('active'); //
            const tabNameToOpen = activeModalResultTab.getAttribute('onclick').match(/'([^']*)'/)[1]; //
            window.openModalTab(null, tabNameToOpen); //
        }
        showLoadingMessage(modalAnalysisStatusArea, "RFP analysis complete! Saving results...", false); //

        try {
            const savePayload = { //
                rfpTitle: rfpTitleValue || "", rfpType: rfpTypeValue, submittedBy: submittedByValue, //
                rfpFileName: rfpFileNameValue,  //
                rfpSummary: parsedAISections.summary,  //
                generatedQuestions: parsedAISections.questions, //
                rfpDeadlines: parsedAISections.deadlines,  //
                rfpSubmissionFormat: parsedAISections.submissionFormat, //
                rfpKeyRequirements: parsedAISections.requirements,  //
                rfpStakeholders: parsedAISections.stakeholders, //
                rfpRisks: parsedAISections.risks,  //
                rfpRegistration: parsedAISections.registration, //
                rfpLicenses: parsedAISections.licenses,  //
                rfpBudget: parsedAISections.budget,  //
                status: 'analyzed', //
                analysisPrompts: currentAnalysisPrompts  //
            };
            const saveResponse = await fetch('/api/rfp-analysis', { //
                method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(savePayload) //
            });
            if (!saveResponse.ok) throw new Error((await saveResponse.json()).error || 'Failed to save analysis.'); //

            showLoadingMessage(modalAnalysisStatusArea, "Analysis complete and results saved!", false); //
            // Call global loadSavedAnalysesInitial with necessary UI elements
            if (window.loadSavedAnalysesInitialGlobal) {
                 window.loadSavedAnalysesInitialGlobal();
            }
        } catch (saveError) {
            showLoadingMessage(modalAnalysisStatusArea, `Analysis complete, but failed to save: ${saveError.message}`, false); //
        }
    } catch (error) {
        showLoadingMessage(modalAnalysisStatusArea, `Processing Error: ${error.message}`, false); //
    } finally {
        hideLoadingMessage(modalAnalysisStatusArea, 7000); //
        if (params.generateAnalysisButton) params.generateAnalysisButton.disabled = false; //
    }
}

// --- Functions for Main Page List Filtering and Sorting ---
function handleStatusFilterChange(newFilterValue, uiCallbacks) {
    currentStatusFilter = newFilterValue;
    renderAnalysesList(uiCallbacks.savedAnalysesListDiv, uiCallbacks.noSavedAnalysesP, uiCallbacks);
}

function handleSortChange(newSortKey, uiCallbacks) {
    if (currentSortKey === newSortKey) {
        currentSortOrder = currentSortOrder === 'asc' ? 'desc' : 'asc';
    } else {
        currentSortKey = newSortKey;
        currentSortOrder = 'asc';
    }
    renderAnalysesList(uiCallbacks.savedAnalysesListDiv, uiCallbacks.noSavedAnalysesP, uiCallbacks);
}


// Expose functions to be called by rfp-ui-interactions.js
window.extractTextFromPdf = extractTextFromPdf;
window.updateRfpStatusGlobal = updateRfpStatus; // Renamed to avoid conflict if ui has similar name
window.updateRfpTitleGlobal = updateRfpTitle;   // Renamed
window.deleteRfpGlobal = deleteRfp;           // Renamed
window.loadSavedAnalysesInitialGlobal = loadSavedAnalysesInitial; // Renamed
window.renderAnalysesListGlobal = renderAnalysesList; // Renamed for clarity
window.handleRfpFormSubmit = handleRfpFormSubmit;
window.handleStatusFilterChangeGlobal = handleStatusFilterChange; // Renamed
window.handleSortChangeGlobal = handleSortChange; // Renamed

// Expose state for sort indicators in UI module if needed, or better, pass it to render
window.getCurrentSortKey = () => currentSortKey;
window.getCurrentSortOrder = () => currentSortOrder;
