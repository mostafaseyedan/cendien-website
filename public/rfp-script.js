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
    const rfpAddendumUpload = document.getElementById('rfpAddendumUpload'); // New addendum input
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
    const rfpListStatusArea = document.getElementById('rfp-list-status-area');
    const yearSpanRFP = document.getElementById('current-year-rfp');

    // --- AI Prompt Settings Modal Elements ---
    const promptSettingsModal = document.getElementById('prompt-settings-modal');
    const openPromptSettingsButton = document.getElementById('open-prompt-settings-modal-button');
    const promptModalCloseButton = document.getElementById('prompt-modal-close-button');
    const promptSectionSelector = document.getElementById('promptSectionSelector');
    const rfpIndividualPromptTextarea = document.getElementById('rfpIndividualPromptTextarea');
    const saveCurrentPromptButton = document.getElementById('save-current-prompt-button');
    const resetCurrentPromptButton = document.getElementById('reset-current-prompt-button');
    const resetAllPromptsButton = document.getElementById('reset-all-prompts-button');
    const promptSaveStatus = document.getElementById('prompt-save-status');

    // --- State Variables ---
    let allFetchedAnalyses = [];
    let currentSortKey = 'analysisDate';
    let currentSortOrder = 'desc';
    let currentStatusFilter = 'all';

    // --- AI Prompt Configuration ---
    const RFP_PROMPT_MAIN_INSTRUCTION = "Please analyze the following Request for Proposal (RFP) text.\nProvide the following distinct sections in your response, each clearly delimited:";
    const RFP_PROMPT_SECTION_DELIMITER_FORMAT = "\n\n###{SECTION_KEY_UPPER}_START###\n[Content for {SECTION_KEY_UPPER}]\n###{SECTION_KEY_UPPER}_END###";
    const RFP_PROMPT_TEXT_SUFFIX = "\n\nRFP Text (including any addendums):\n---\n{RFP_TEXT_PLACEHOLDER}\n---";

    const PROMPT_SECTION_KEYS = {
        summary: "SUMMARY",
        questions: "QUESTIONS",
        deadlines: "DEADLINES",
        submissionFormat: "SUBMISSION_FORMAT",
        requirements: "REQUIREMENTS",
        stakeholders: "STAKEHOLDERS",
        risks: "RISKS",
        registration: "REGISTRATION",
        licenses: "LICENSES",
        budget: "BUDGET"
    };
    
    const DEFAULT_RFP_SECTION_PROMPTS = {
        summary: "1. A concise summary of the RFP.",
        questions: "2. A list of 5 to 15 critical and insightful clarification questions based on the RFP.",
        deadlines: "3. Key Deadlines.",
        submissionFormat: "4. Submission Format (Mail, Email, Portal, site address, etc.).",
        requirements: "5. A list of Requirements (e.g., mandatory, highly desirable).",
        stakeholders: "6. Mentioned Stakeholders or Key Contacts.",
        risks: "7. Potential Risks or Red Flags identified in the RFP.",
        registration: "8. Registration requirements or details for bidders.",
        licenses: "9. Required Licenses or Certifications for bidders.",
        budget: "10. Any mentioned Budget constraints or financial information."
    };

    const getPromptStorageKey = (sectionKey) => `rfpPrompt_${sectionKey}`;


    if (yearSpanRFP && !yearSpanRFP.textContent) {
        yearSpanRFP.textContent = new Date().getFullYear();
    }

    // --- AI Prompt Management Functions ---
    function getStoredSectionPrompt(sectionKey) {
        return localStorage.getItem(getPromptStorageKey(sectionKey)) || DEFAULT_RFP_SECTION_PROMPTS[sectionKey];
    }

    function loadSelectedSectionPromptToTextarea() {
        if (promptSectionSelector && rfpIndividualPromptTextarea) {
            const selectedKey = promptSectionSelector.value; // e.g., "summary", "questions"
            if (selectedKey) { // Ensure a valid key is selected
                 rfpIndividualPromptTextarea.value = getStoredSectionPrompt(selectedKey);
            }
        }
    }

    function saveCurrentSectionPrompt() {
        if (promptSectionSelector && rfpIndividualPromptTextarea && promptSaveStatus) {
            const selectedKey = promptSectionSelector.value;
            const userPrompt = rfpIndividualPromptTextarea.value.trim();

            if (userPrompt) {
                localStorage.setItem(getPromptStorageKey(selectedKey), userPrompt);
                promptSaveStatus.innerHTML = '<p class="loading-text" style="color:green;">Prompt for this section saved!</p>';
            } else {
                promptSaveStatus.innerHTML = '<p class="loading-text" style="color:red;">Section prompt cannot be empty.</p>';
            }
            promptSaveStatus.style.display = 'block';
            setTimeout(() => {
                promptSaveStatus.style.display = 'none';
                promptSaveStatus.innerHTML = '';
            }, 3000);
        }
    }

    function resetCurrentSectionPromptToDefault() {
        if (promptSectionSelector && rfpIndividualPromptTextarea && promptSaveStatus) {
            const selectedKey = promptSectionSelector.value;
            const selectedOptionText = promptSectionSelector.options[promptSectionSelector.selectedIndex].text;
            if (confirm(`Are you sure you want to reset the prompt for "${selectedOptionText}" to its default?`)) {
                localStorage.removeItem(getPromptStorageKey(selectedKey));
                loadSelectedSectionPromptToTextarea();
                promptSaveStatus.innerHTML = `<p class="loading-text" style="color:green;">Prompt for "${selectedOptionText}" reset to default.</p>`;
                promptSaveStatus.style.display = 'block';
                setTimeout(() => {
                    promptSaveStatus.style.display = 'none';
                    promptSaveStatus.innerHTML = '';
                }, 3000);
            }
        }
    }

    function resetAllPromptsToDefault() {
        if (promptSaveStatus && promptSectionSelector) {
            if (confirm("Are you sure you want to reset ALL section prompts to their defaults? This action cannot be undone.")) {
                Object.keys(DEFAULT_RFP_SECTION_PROMPTS).forEach(key => { // Iterate over keys in DEFAULT_RFP_SECTION_PROMPTS
                    localStorage.removeItem(getPromptStorageKey(key));
                });
                loadSelectedSectionPromptToTextarea(); // Reload current selection which will now be default
                promptSaveStatus.innerHTML = '<p class="loading-text" style="color:green;">All prompts have been reset to their defaults.</p>';
                promptSaveStatus.style.display = 'block';
                setTimeout(() => {
                    promptSaveStatus.style.display = 'none';
                    promptSaveStatus.innerHTML = '';
                }, 4000);
            }
        }
    }

    function constructFullRfpAnalysisPrompt(rfpText) {
        let fullPrompt = RFP_PROMPT_MAIN_INSTRUCTION;

        // Append each section's specific instructional text
        Object.keys(DEFAULT_RFP_SECTION_PROMPTS).forEach(key => { // Iterate based on defined default sections
            const sectionInstruction = getStoredSectionPrompt(key);
            fullPrompt += `\n${sectionInstruction}`;
        });
        
        fullPrompt += "\n\nUse the following format strictly for each section:";
        // Append the delimiters for each section
        Object.keys(DEFAULT_RFP_SECTION_PROMPTS).forEach(key => {
            const delimiterKey = PROMPT_SECTION_KEYS[key]; // Get the uppercase key like "SUMMARY"
            if(delimiterKey){ // Check if the key exists in PROMPT_SECTION_KEYS
                 const delimiter = RFP_PROMPT_SECTION_DELIMITER_FORMAT
                    .replace(/{SECTION_KEY_UPPER}/g, delimiterKey); // Use the mapped uppercase key
                 fullPrompt += delimiter;
            }
        });

        fullPrompt += RFP_PROMPT_TEXT_SUFFIX.replace('{RFP_TEXT_PLACEHOLDER}', rfpText);
        return fullPrompt;
    }


    // --- Modal Handling (New RFP and Prompt Settings) ---
    if (openNewRfpModalButton) {
        openNewRfpModalButton.addEventListener('click', () => {
            if (newRfpModal) {
                if (rfpForm) rfpForm.reset();
                if (modalAnalysisResultsArea) modalAnalysisResultsArea.style.display = 'none';
                if (modalAnalysisStatusArea) modalAnalysisStatusArea.style.display = 'none';
                clearModalAnalysisResultTabs();
                if (modalFormTitle) modalFormTitle.textContent = "Analyze New RFP";
                if (viewSavedRfpDetailsSection) {
                    // **MODIFIED PART TO SHOW THE MODAL**
                    viewSavedRfpDetailsSection.style.display = 'block'; // Make it block first to take up space
                    viewSavedRfpDetailsSection.classList.add('modal-active'); // Then activate modal styles
                    document.body.style.overflow = 'hidden'; // Prevent body scroll
                }
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

    if (openPromptSettingsButton) {
        openPromptSettingsButton.addEventListener('click', () => {
            if (promptSettingsModal) {
                loadSelectedSectionPromptToTextarea();
                promptSettingsModal.style.display = 'block';
            }
        });
    }
    if (promptModalCloseButton) {
        promptModalCloseButton.addEventListener('click', () => {
            if (promptSettingsModal) promptSettingsModal.style.display = 'none';
        });
    }
    if (promptSettingsModal) {
        promptSettingsModal.addEventListener('click', (event) => {
            if (event.target === promptSettingsModal) {
                promptSettingsModal.style.display = 'none';
            }
        });
    }
    
    if (promptSectionSelector) {
        promptSectionSelector.addEventListener('change', loadSelectedSectionPromptToTextarea);
    }
    if(saveCurrentPromptButton) {
        saveCurrentPromptButton.addEventListener('click', saveCurrentSectionPrompt);
    }
    if(resetCurrentPromptButton) {
        resetCurrentPromptButton.addEventListener('click', resetCurrentSectionPromptToDefault);
    }
    if(resetAllPromptsButton) {
        resetAllPromptsButton.addEventListener('click', resetAllPromptsToDefault);
    }


    if (closeViewRfpDetailsButton) {
        closeViewRfpDetailsButton.addEventListener('click', () => {
            if (viewSavedRfpDetailsSection) {
                viewSavedRfpDetailsSection.classList.remove('modal-active'); // Remove class
                viewSavedRfpDetailsSection.style.display = 'none';
                document.body.style.overflow = ''; // Restore body scroll
            }
        });
    }
    if (viewSavedRfpDetailsSection) {
        viewSavedRfpDetailsSection.addEventListener('click', (event) => {
            // Check if the click is on the overlay itself (viewSavedRfpDetailsSection)
            // and not on its children (the modal content box which is .view-rfp-modal-content)
            if (event.target === viewSavedRfpDetailsSection) {
                viewSavedRfpDetailsSection.classList.remove('modal-active');
                viewSavedRfpDetailsSection.style.display = 'none';
                document.body.style.overflow = ''; // Restore body scroll
            }
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
        areaElement.style.display = 'flex';
        areaElement.innerHTML = `
            ${showSpinner ? '<div class="spinner"></div>' : ''}
            <p class="loading-text">${message}</p>`;
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
            if (areaElement === modalAnalysisStatusArea && generateAnalysisButton) {
                generateAnalysisButton.disabled = false;
            }
        }, delay);
    }

    // --- PDF Extraction & Content Formatting ---
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
                    reject(new Error(`Failed to extract text from PDF '${file.name}': ${err.message}`));
                }
            };
            reader.onerror = (err) => reject(new Error(`FileReader error for '${file.name}': ${err.message}`));
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

                if (newRfpModal) newRfpModal.style.display = 'none'; // Hide other modals if open
                if (promptSettingsModal) promptSettingsModal.style.display = 'none'; // Hide other modals if open
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
                            firstViewTabLink.classList.add('active');
                            const tabNameToOpen = firstViewTabLink.getAttribute('onclick').match(/'([^']*)'/)[1];
                            if (window.openViewTab) window.openViewTab(null, tabNameToOpen);
                        }

                        const titleForStatus = detailedAnalysis.rfpTitle || detailedAnalysis.rfpFileName || 'N/A';
                        showLoadingMessage(viewRfpStatusArea, `Displaying: ${titleForStatus}`, false);
                    } catch (loadError) {
                        showLoadingMessage(viewRfpStatusArea, `Error: ${loadError.message}`, false);
                    } finally {
                        setTimeout(() => hideLoadingMessage(viewRfpStatusArea), loadError ? 5000 : 2000);
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
        showLoadingMessage(rfpListStatusArea, "Loading saved analyses...", true);
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
            hideLoadingMessage(rfpListStatusArea);
        }
    }

    // --- Event Listeners for Main Page List Tabs & Sorting ---
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

    // --- RFP Form Submission (Inside Modal) ---
    if (rfpForm) {
        rfpForm.addEventListener('submit', async function (event) {
            event.preventDefault();
            const rfpTitleValue = document.getElementById('rfpTitle').value.trim();
            const rfpTypeValue = document.getElementById('rfpType').value;
            const submittedByValue = document.getElementById('submittedBy').value;
            
            const mainRfpFile = rfpFileUpload.files[0];
            const addendumFiles = rfpAddendumUpload.files;

            showLoadingMessage(modalAnalysisStatusArea, "Starting analysis...");
            if (modalAnalysisResultsArea) modalAnalysisResultsArea.style.display = 'none';

            if (!mainRfpFile) {
                showLoadingMessage(modalAnalysisStatusArea, "Please upload the main RFP document.", false);
                hideLoadingMessage(modalAnalysisStatusArea, 3000);
                return;
            }
            const rfpFileNameValue = mainRfpFile.name;
            if (mainRfpFile.type !== "application/pdf") {
                showLoadingMessage(modalAnalysisStatusArea, "Invalid main RFP file type. Please upload a PDF.", false);
                hideLoadingMessage(modalAnalysisStatusArea, 3000);
                return;
            }

            let combinedRfpText = "";
            let filesToProcess = [mainRfpFile];
            
            for (let i = 0; i < addendumFiles.length; i++) {
                if (addendumFiles[i].type === "application/pdf") {
                    filesToProcess.push(addendumFiles[i]);
                } else {
                    showLoadingMessage(modalAnalysisStatusArea, `Skipping non-PDF addendum: '${addendumFiles[i].name}'.`, false);
                }
            }

            try {
                for (let i = 0; i < filesToProcess.length; i++) {
                    const file = filesToProcess[i];
                    showLoadingMessage(modalAnalysisStatusArea, `Extracting text from ${file.name} (${i + 1}/${filesToProcess.length})...`);
                    const text = await extractTextFromPdf(file);
                    combinedRfpText += text + "\n\n";
                    if (!text || text.trim().length < 10) {
                        console.warn(`Minimal text extracted from ${file.name}.`);
                    }
                }
                
                if (combinedRfpText.trim().length < 50) {
                    throw new Error("Insufficient total text extracted from PDF(s) for analysis.");
                }

            } catch (error) {
                showLoadingMessage(modalAnalysisStatusArea, `PDF Error: ${error.message}`, false);
                hideLoadingMessage(modalAnalysisStatusArea, 5000);
                return;
            }
            
            // Construct the full prompt using the new method
            const aiPrompt = constructFullRfpAnalysisPrompt(combinedRfpText);
            
            console.log("Constructed AI Prompt for Submission:\n", aiPrompt); // For debugging

            let summaryText, questionsText, deadlinesText, submissionFormatText,
                requirementsText, stakeholdersText, risksText,
                registrationText, licensesText, budgetText;

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

                const parseSection = (output, sectionKeyName) => { 
                    const regex = new RegExp(`###${sectionKeyName}_START###([\\s\\S]*?)###${sectionKeyName}_END###`);
                    const match = output.match(regex);
                    return match && match[1] ? match[1].trim() : `${sectionKeyName.replace(/_/g, ' ')} not found in AI response.`;
                };
                
                summaryText = parseSection(rawAiOutput, PROMPT_SECTION_KEYS.summary);
                questionsText = parseSection(rawAiOutput, PROMPT_SECTION_KEYS.questions);
                deadlinesText = parseSection(rawAiOutput, PROMPT_SECTION_KEYS.deadlines);
                submissionFormatText = parseSection(rawAiOutput, PROMPT_SECTION_KEYS.submissionFormat);
                requirementsText = parseSection(rawAiOutput, PROMPT_SECTION_KEYS.requirements);
                stakeholdersText = parseSection(rawAiOutput, PROMPT_SECTION_KEYS.stakeholders);
                risksText = parseSection(rawAiOutput, PROMPT_SECTION_KEYS.risks);
                registrationText = parseSection(rawAiOutput, PROMPT_SECTION_KEYS.registration);
                licensesText = parseSection(rawAiOutput, PROMPT_SECTION_KEYS.licenses);
                budgetText = parseSection(rawAiOutput, PROMPT_SECTION_KEYS.budget);


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

                if (modalAnalysisResultsArea) modalAnalysisResultsArea.style.display = 'block';
                const activeModalResultTab = document.querySelector('#modal-analysis-results-area .tabs-container .tab-link');
                if (activeModalResultTab) {
                    document.querySelectorAll('#modal-analysis-results-area .tabs-container .tab-link').forEach(tl => tl.classList.remove('active'));
                    activeModalResultTab.classList.add('active');
                    const tabNameToOpen = activeModalResultTab.getAttribute('onclick').match(/'([^']*)'/)[1];
                    if (window.openModalTab) window.openModalTab(null, tabNameToOpen);
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
    const firstActiveViewTab = document.querySelector('#view-analysis-results-area .tabs-container .tab-link');
    if (firstActiveViewTab && viewSavedRfpDetailsSection && viewSavedRfpDetailsSection.style.display === 'block') {
        const tabNameToOpen = firstActiveViewTab.getAttribute('onclick').match(/'([^']*)'/)[1];
        const tabElement = document.getElementById(tabNameToOpen);
        if (window.openViewTab && tabElement && tabElement.style.display !== 'block') {
            window.openViewTab(null, tabNameToOpen);
        }
    }

    loadSavedAnalysesInitial();
    // Load initial prompt for the settings modal when the page loads
    if (promptSectionSelector) { 
        loadSelectedSectionPromptToTextarea();
    }
});
