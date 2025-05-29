import * as pdfjsLib from 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/5.0.375/pdf.min.mjs';

pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/5.0.375/pdf.worker.min.mjs';

document.addEventListener('DOMContentLoaded', () => {
    // --- MODAL Elements (for New RFP Analysis) ---
    const newRfpModal = document.getElementById('new-rfp-modal');
    const openNewRfpModalButton = document.getElementById('open-new-rfp-modal-button');
    const modalCloseButton = document.getElementById('modal-close-button');
    const modalFormTitle = document.getElementById('modal-title');

    const rfpForm = document.getElementById('rfp-details-form');
    const rfpFileUpload = document.getElementById('rfpFileUpload');
    const rfpAddendumUpload = document.getElementById('rfpAddendumUpload');
    const generateAnalysisButton = document.getElementById('generate-analysis-button');
    const modalAnalysisStatusArea = document.getElementById('modal-analysis-status-area');
    const modalAnalysisResultsArea = document.getElementById('modal-analysis-results-area');

    // Modal's result tab content divs (and their corresponding prompt display elements)
    const modalTabContentMap = {
        summary: document.getElementById('modal-summary-result-content'),
        questions: document.getElementById('modal-questions-result-content'),
        deadlines: document.getElementById('modal-deadlines-only-content'),
        submissionFormat: document.getElementById('modal-submission-format-content'),
        requirements: document.getElementById('modal-requirements-result-content'),
        stakeholders: document.getElementById('modal-stakeholders-result-content'),
        risks: document.getElementById('modal-risks-result-content'),
        registration: document.getElementById('modal-registration-result-content'),
        licenses: document.getElementById('modal-licenses-result-content'),
        budget: document.getElementById('modal-budget-result-content')
    };
    const modalDeadlinesTabContentDiv = document.getElementById('modal-deadlines-tab');


    // --- MAIN PAGE Elements (for Viewing Saved RFP Details) ---
    const viewSavedRfpDetailsSection = document.getElementById('view-saved-rfp-details-section');
    const viewRfpMainTitleHeading = document.getElementById('view-rfp-main-title-heading');
    const closeViewRfpDetailsButton = document.getElementById('close-view-rfp-details-button');
    const viewRfpStatusArea = document.getElementById('view-rfp-status-area');
    const viewAnalysisResultsArea = document.getElementById('view-analysis-results-area');
    
    const viewTabContentMap = {
        summary: document.getElementById('view-summary-result-content'),
        questions: document.getElementById('view-questions-result-content'),
        deadlines: document.getElementById('view-deadlines-only-content'),
        submissionFormat: document.getElementById('view-submission-format-content'),
        requirements: document.getElementById('view-requirements-result-content'),
        stakeholders: document.getElementById('view-stakeholders-result-content'),
        risks: document.getElementById('view-risks-result-content'),
        registration: document.getElementById('view-registration-result-content'),
        licenses: document.getElementById('view-licenses-result-content'),
        budget: document.getElementById('view-budget-result-content')
    };
    const viewDeadlinesTabContentDiv = document.getElementById('view-deadlines-tab');


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
    // Note: The delimiter format must exactly match how the AI is expected to output AND how parseSection expects it.
    // Using {SECTION_KEY_UPPER} for the actual delimiters.
    const RFP_PROMPT_SECTION_DELIMITER_FORMAT = "\n\n###{SECTION_KEY_UPPER}_START###\n[Content for {SECTION_KEY_UPPER}]\n###{SECTION_KEY_UPPER}_END###";
    const RFP_PROMPT_TEXT_SUFFIX = "\n\nRFP Text (including any addendums):\n---\n{RFP_TEXT_PLACEHOLDER}\n---";

    // Maps the <select> option values to the keys used in DEFAULT_RFP_SECTION_PROMPTS
    // and the uppercase keys used for ###DELIMITERS###.
    const PROMPT_CONFIG = {
        summary: { defaultText: "1. A concise summary of the RFP.", delimiterKey: "SUMMARY" },
        questions: { defaultText: "2. A list of 5 to 15 critical and insightful clarification questions based on the RFP.", delimiterKey: "QUESTIONS" },
        deadlines: { defaultText: "3. Key Deadlines.", delimiterKey: "DEADLINES" },
        submissionFormat: { defaultText: "4. Submission Format (Mail, Email, Portal, site address, etc.).", delimiterKey: "SUBMISSION_FORMAT" },
        requirements: { defaultText: "5. A list of Requirements (e.g., mandatory, highly desirable).", delimiterKey: "REQUIREMENTS" },
        stakeholders: { defaultText: "6. Mentioned Stakeholders or Key Contacts.", delimiterKey: "STAKEHOLDERS" },
        risks: { defaultText: "7. Potential Risks or Red Flags identified in the RFP.", delimiterKey: "RISKS" },
        registration: { defaultText: "8. Registration requirements or details for bidders.", delimiterKey: "REGISTRATION" },
        licenses: { defaultText: "9. Required Licenses or Certifications for bidders.", delimiterKey: "LICENSES" },
        budget: { defaultText: "10. Any mentioned Budget constraints or financial information.", delimiterKey: "BUDGET" }
    };

    const getPromptStorageKey = (sectionKeySuffix) => `rfpPrompt_${sectionKeySuffix}`; // sectionKeySuffix is e.g. "summary"

    if (yearSpanRFP && !yearSpanRFP.textContent) {
        yearSpanRFP.textContent = new Date().getFullYear();
    }

    // --- AI Prompt Management Functions ---
    function getStoredSectionPrompt(sectionKeySuffix) { // e.g., "summary"
        return localStorage.getItem(getPromptStorageKey(sectionKeySuffix)) || PROMPT_CONFIG[sectionKeySuffix]?.defaultText;
    }

    function loadSelectedSectionPromptToTextarea() {
        if (promptSectionSelector && rfpIndividualPromptTextarea) {
            const selectedKeySuffix = promptSectionSelector.value; 
            if (selectedKeySuffix && PROMPT_CONFIG[selectedKeySuffix]) {
                 rfpIndividualPromptTextarea.value = getStoredSectionPrompt(selectedKeySuffix);
            }
        }
    }

    function saveCurrentSectionPrompt() {
        if (promptSectionSelector && rfpIndividualPromptTextarea && promptSaveStatus) {
            const selectedKeySuffix = promptSectionSelector.value;
            const userPrompt = rfpIndividualPromptTextarea.value.trim();

            if (userPrompt) {
                localStorage.setItem(getPromptStorageKey(selectedKeySuffix), userPrompt);
                promptSaveStatus.innerHTML = '<p class="loading-text" style="color:green;">Prompt for this section saved!</p>';
            } else {
                promptSaveStatus.innerHTML = '<p class="loading-text" style="color:red;">Section prompt cannot be empty.</p>';
            }
            promptSaveStatus.style.display = 'flex'; // Use flex for consistency with showLoadingMessage
            setTimeout(() => {
                promptSaveStatus.style.display = 'none';
                promptSaveStatus.innerHTML = '';
            }, 3000);
        }
    }

    function resetCurrentSectionPromptToDefault() {
        if (promptSectionSelector && rfpIndividualPromptTextarea && promptSaveStatus) {
            const selectedKeySuffix = promptSectionSelector.value;
            const selectedOptionText = promptSectionSelector.options[promptSectionSelector.selectedIndex].text;
            if (confirm(`Are you sure you want to reset the prompt for "${selectedOptionText}" to its default?`)) {
                localStorage.removeItem(getPromptStorageKey(selectedKeySuffix));
                loadSelectedSectionPromptToTextarea();
                promptSaveStatus.innerHTML = `<p class="loading-text" style="color:green;">Prompt for "${selectedOptionText}" reset to default.</p>`;
                promptSaveStatus.style.display = 'flex';
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
                Object.keys(PROMPT_CONFIG).forEach(keySuffix => {
                    localStorage.removeItem(getPromptStorageKey(keySuffix));
                });
                loadSelectedSectionPromptToTextarea(); 
                promptSaveStatus.innerHTML = '<p class="loading-text" style="color:green;">All prompts have been reset to their defaults.</p>';
                promptSaveStatus.style.display = 'flex';
                setTimeout(() => {
                    promptSaveStatus.style.display = 'none';
                    promptSaveStatus.innerHTML = '';
                }, 4000);
            }
        }
    }

    function constructFullRfpAnalysisPrompt(rfpText) {
        let fullPrompt = RFP_PROMPT_MAIN_INSTRUCTION;

        Object.keys(PROMPT_CONFIG).forEach(keySuffix => {
            const sectionInstruction = getStoredSectionPrompt(keySuffix);
            fullPrompt += `\n${sectionInstruction}`;
        });
        
        fullPrompt += "\n\nUse the following format strictly for each section:";
        Object.keys(PROMPT_CONFIG).forEach(keySuffix => {
            const delimiterKeyUpper = PROMPT_CONFIG[keySuffix]?.delimiterKey;
            if(delimiterKeyUpper){
                 const delimiter = RFP_PROMPT_SECTION_DELIMITER_FORMAT
                    .replace(/{SECTION_KEY_UPPER}/g, delimiterKeyUpper);
                 fullPrompt += delimiter;
            }
        });

        fullPrompt += RFP_PROMPT_TEXT_SUFFIX.replace('{RFP_TEXT_PLACEHOLDER}', rfpText);
        return fullPrompt;
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
                if (viewSavedRfpDetailsSection) { // Close view modal if open
                    viewSavedRfpDetailsSection.classList.remove('modal-active');
                    viewSavedRfpDetailsSection.style.display = 'none';
                }
                if (promptSettingsModal) promptSettingsModal.style.display = 'none'; // Close prompt modal
                newRfpModal.style.display = 'block';
                document.body.style.overflow = 'hidden';
            }
        });
    }
    if (modalCloseButton) {
        modalCloseButton.addEventListener('click', () => {
            if (newRfpModal) newRfpModal.style.display = 'none';
            document.body.style.overflow = '';
        });
    }
    if (newRfpModal) {
        newRfpModal.addEventListener('click', (event) => {
            if (event.target === newRfpModal) {
                newRfpModal.style.display = 'none';
                document.body.style.overflow = '';
            }
        });
    }

    if (openPromptSettingsButton) {
        openPromptSettingsButton.addEventListener('click', () => {
            if (promptSettingsModal) {
                loadSelectedSectionPromptToTextarea();
                if (newRfpModal) newRfpModal.style.display = 'none'; // Close other modals
                if (viewSavedRfpDetailsSection && viewSavedRfpDetailsSection.classList.contains('modal-active')) {
                    viewSavedRfpDetailsSection.classList.remove('modal-active');
                    viewSavedRfpDetailsSection.style.display = 'none';
                }
                promptSettingsModal.style.display = 'block';
                document.body.style.overflow = 'hidden';
            }
        });
    }
    if (promptModalCloseButton) {
        promptModalCloseButton.addEventListener('click', () => {
            if (promptSettingsModal) {
                promptSettingsModal.style.display = 'none';
                document.body.style.overflow = '';
            }
        });
    }
    if (promptSettingsModal) {
        promptSettingsModal.addEventListener('click', (event) => {
            if (event.target === promptSettingsModal) {
                promptSettingsModal.style.display = 'none';
                document.body.style.overflow = '';
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
                viewSavedRfpDetailsSection.classList.remove('modal-active');
                viewSavedRfpDetailsSection.style.display = 'none';
                document.body.style.overflow = '';
            }
        });
    }
    if (viewSavedRfpDetailsSection) {
        viewSavedRfpDetailsSection.addEventListener('click', (event) => {
            if (event.target === viewSavedRfpDetailsSection) {
                viewSavedRfpDetailsSection.classList.remove('modal-active');
                viewSavedRfpDetailsSection.style.display = 'none';
                document.body.style.overflow = '';
            }
        });
    }

    // --- Helper: Clear Tab Content ---
    function clearTabContent(tabContentMap, isModalView) {
        Object.keys(tabContentMap).forEach(key => {
            const div = tabContentMap[key];
            if (div) div.innerHTML = '';
        });
    
        // Special handling for the deadlines tab because its content divs are nested
        let deadlinesTabParent, deadlinesDivId, submissionDivId;
        if (isModalView && modalDeadlinesTabContentDiv) {
            deadlinesTabParent = modalDeadlinesTabContentDiv;
            deadlinesDivId = 'modal-deadlines-only-content';
            submissionDivId = 'modal-submission-format-content';
            // Reconstruct its inner structure because formatAndDisplayContentWithPrompt targets the sub-divs
            deadlinesTabParent.innerHTML = `
                <h4>Deadlines:</h4><div id="${deadlinesDivId}"></div>
                <h4 style="margin-top: 1rem;">Submission Format:</h4><div id="${submissionDivId}"></div>
            `;
            modalTabContentMap.deadlines = document.getElementById(deadlinesDivId);
            modalTabContentMap.submissionFormat = document.getElementById(submissionDivId);
        } else if (!isModalView && viewDeadlinesTabContentDiv) {
            // The viewDeadlinesTabContentDiv is the one identified by "view-deadlines-tab"
            // It itself contains "view-deadlines-result-content" which then has the h4s and sub-divs
            const resultContainer = viewDeadlinesTabContentDiv.querySelector('#view-deadlines-result-content');
            deadlinesDivId = 'view-deadlines-only-content';
            submissionDivId = 'view-submission-format-content';
            if (resultContainer) {
                 resultContainer.innerHTML = `
                    <h4>Deadlines:</h4>
                    <div id="${deadlinesDivId}"></div>
                    <h4 style="margin-top: 1rem;">Submission Format:</h4>
                    <div id="${submissionDivId}"></div>
                `;
                viewTabContentMap.deadlines = document.getElementById(deadlinesDivId);
                viewTabContentMap.submissionFormat = document.getElementById(submissionDivId);
            } else { // Fallback if structure not found, clear parent
                 viewDeadlinesTabContentDiv.innerHTML = '';
            }
        }
    }
    
    function clearModalAnalysisResultTabs() { clearTabContent(modalTabContentMap, true); }
    function clearViewAnalysisResultTabs() { clearTabContent(viewTabContentMap, false); }


    // --- Helper: Show/Hide Loading/Status Messages ---
    function showLoadingMessage(areaElement, message = "Processing...", showSpinner = true) {
        if (!areaElement) return;
        areaElement.style.display = 'flex'; // Changed to flex for better centering
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

    // --- PDF Extraction ---
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

    // --- Content Formatting with Prompt Display ---
    function formatAndDisplayContentWithPrompt(parentElement, sectionKeySuffix, sectionPromptText, sectionContentText) {
        if (!parentElement) {
            console.warn("formatAndDisplayContentWithPrompt: parentElement is null for sectionKeySuffix:", sectionKeySuffix);
            return;
        }
        parentElement.innerHTML = ''; // Clear previous content

        if (sectionPromptText) {
            const promptDisplayDiv = document.createElement('div');
            promptDisplayDiv.className = 'prompt-display-box';
            
            const promptLabel = document.createElement('strong');
            promptLabel.textContent = "Instruction Used: ";
            promptDisplayDiv.appendChild(promptLabel);

            const promptTextNode = document.createTextNode(sectionPromptText);
            promptDisplayDiv.appendChild(promptTextNode);
            
            const currentDefaultPrompt = PROMPT_CONFIG[sectionKeySuffix]?.defaultText;
            if (currentDefaultPrompt && sectionPromptText === currentDefaultPrompt) {
                const defaultIndicator = document.createElement('em');
                defaultIndicator.textContent = " (Default instruction)";
                defaultIndicator.style.fontSize = '0.9em';
                defaultIndicator.style.marginLeft = '5px';
                promptDisplayDiv.appendChild(defaultIndicator);
            }
            parentElement.appendChild(promptDisplayDiv);
        }

        const contentDiv = document.createElement('div');
        contentDiv.className = 'ai-generated-section-content';
        const lines = (sectionContentText || "N/A").split('\n');
        let currentList = null;
        lines.forEach(line => {
            const trimmedLine = line.trim();
            if (trimmedLine) {
                let formattedLine = trimmedLine.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
                const isQuestionsList = sectionKeySuffix === 'questions';
                const listMatch = formattedLine.match(/^(\*|-|\d+\.)\s+/);

                if (listMatch) {
                    if (!currentList) {
                        currentList = isQuestionsList ? document.createElement('ol') : document.createElement('ul');
                        if (isQuestionsList) currentList.className = 'numbered-list';
                        contentDiv.appendChild(currentList);
                    }
                    const listItem = document.createElement('li');
                    listItem.innerHTML = formattedLine.substring(listMatch[0].length);
                    currentList.appendChild(listItem);
                } else {
                    currentList = null;
                    const p = document.createElement('p');
                    p.innerHTML = formattedLine;
                    contentDiv.appendChild(p);
                }
            } else {
                currentList = null;
            }
        });
        parentElement.appendChild(contentDiv);
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
            if (viewSavedRfpDetailsSection && viewSavedRfpDetailsSection.classList.contains('modal-active') && 
                viewSavedRfpDetailsSection.dataset.currentViewingId === rfpId) { // If deleting currently viewed item
                viewSavedRfpDetailsSection.classList.remove('modal-active');
                viewSavedRfpDetailsSection.style.display = 'none';
                document.body.style.overflow = '';
            }
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
                                       analysis.status === 'not_pursuing' ? 'red' : 'orange'; // 'analyzed' or other = orange

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
                    if (promptSettingsModal) promptSettingsModal.style.display = 'none';

                    if (viewSavedRfpDetailsSection) {
                        viewSavedRfpDetailsSection.dataset.currentViewingId = analysisId; // Track current ID
                        viewSavedRfpDetailsSection.style.display = 'block'; 
                        viewSavedRfpDetailsSection.classList.add('modal-active'); 
                        document.body.style.overflow = 'hidden'; 
                    }
                    
                    if (viewRfpMainTitleHeading) viewRfpMainTitleHeading.textContent = `Details for: ${loadingMessageTitle}`;
                    
                    showLoadingMessage(viewRfpStatusArea, `Loading analysis for ${loadingMessageTitle}...`);
                    if (viewAnalysisResultsArea) viewAnalysisResultsArea.style.display = 'none'; 
                    clearViewAnalysisResultTabs();

                    let loadErrorOccurred = false;
                    try {
                        const detailResponse = await fetch(`/api/rfp-analysis/${analysisId}`);
                        if (!detailResponse.ok) throw new Error((await detailResponse.json()).error || 'Failed to fetch details.');
                        const detailedAnalysis = await detailResponse.json();
                        
                        const savedPrompts = detailedAnalysis.analysisPrompts || {};

                        Object.keys(PROMPT_CONFIG).forEach(keySuffix => {
                            const contentDiv = viewTabContentMap[keySuffix];
                            const sectionContent = detailedAnalysis[keySuffix === 'questions' ? 'generatedQuestions' : `rfp${keySuffix.charAt(0).toUpperCase() + keySuffix.slice(1)}`] || 
                                                  detailedAnalysis[`rfp${keySuffix.charAt(0).toUpperCase() + keySuffix.slice(1).replace('Format', 'SubmissionFormat').replace('KeyRequirements', 'KeyRequirements')}`] || // Handle naming inconsistencies if any
                                                  (keySuffix === 'summary' ? detailedAnalysis.rfpSummary : null) || // Explicit for summary
                                                  "N/A";
                            const promptText = savedPrompts[keySuffix] || PROMPT_CONFIG[keySuffix]?.defaultText;
                            
                            if (contentDiv) {
                                formatAndDisplayContentWithPrompt(contentDiv, keySuffix, promptText, sectionContent);
                            } else if (keySuffix === 'deadlines' || keySuffix === 'submissionFormat') {
                                // These are handled together in the 'deadlines' tab
                                // Ensure this is done once if they are part of the same parent
                            } else {
                                console.warn(`View Tab Content Div not found for key: ${keySuffix}`);
                            }
                        });
                        
                        if (viewAnalysisResultsArea) viewAnalysisResultsArea.style.display = 'block';
                        const firstViewTabLink = document.querySelector('#view-saved-rfp-details-section.modal-active .tabs-container .tab-link');
                        if (firstViewTabLink) {
                            document.querySelectorAll('#view-saved-rfp-details-section.modal-active .tabs-container .tab-link').forEach(tl => tl.classList.remove('active'));
                            firstViewTabLink.classList.add('active'); 
                            const tabNameToOpen = firstViewTabLink.getAttribute('onclick').match(/'([^']*)'/)[1];
                            if (window.openViewTab) window.openViewTab(null, tabNameToOpen); 
                        }
                        
                        const titleForStatus = detailedAnalysis.rfpTitle || detailedAnalysis.rfpFileName || 'N/A';
                        showLoadingMessage(viewRfpStatusArea, `Displaying: ${titleForStatus}`, false);
                    } catch (loadError) {
                         loadErrorOccurred = true;
                         showLoadingMessage(viewRfpStatusArea, `Error: ${loadError.message}`, false);
                    } finally {
                        setTimeout(() => hideLoadingMessage(viewRfpStatusArea), loadErrorOccurred ? 5000 : 2000); 
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
                    console.warn(`Skipping non-PDF addendum: '${addendumFiles[i].name}'.`);
                    // Optionally show a non-blocking message to the user here if desired
                }
            }

            try {
                for (let i = 0; i < filesToProcess.length; i++) {
                    const file = filesToProcess[i];
                    showLoadingMessage(modalAnalysisStatusArea, `Extracting text from ${file.name} (${i + 1}/${filesToProcess.length})...`);
                    const text = await extractTextFromPdf(file);
                    combinedRfpText += text + "\n\n"; // Add separation between documents
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
            
            const aiPrompt = constructFullRfpAnalysisPrompt(combinedRfpText);
            console.log("Constructed AI Prompt for Submission:\n", aiPrompt);

            const currentAnalysisPrompts = {};
            Object.keys(PROMPT_CONFIG).forEach(keySuffix => {
                currentAnalysisPrompts[keySuffix] = getStoredSectionPrompt(keySuffix);
            });

            let parsedAISections = {};

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

                const parseSection = (output, delimiterKey) => { 
                    const regex = new RegExp(`###${delimiterKey}_START###([\\s\\S]*?)###${delimiterKey}_END###`);
                    const match = output.match(regex);
                    return match && match[1] ? match[1].trim() : `${delimiterKey.replace(/_/g, ' ')} not found in AI response.`;
                };
                
                Object.keys(PROMPT_CONFIG).forEach(keySuffix => {
                    parsedAISections[keySuffix] = parseSection(rawAiOutput, PROMPT_CONFIG[keySuffix].delimiterKey);
                });

                clearModalAnalysisResultTabs();

                Object.keys(PROMPT_CONFIG).forEach(keySuffix => {
                    const contentDiv = modalTabContentMap[keySuffix];
                    const promptText = currentAnalysisPrompts[keySuffix];
                    const sectionContent = parsedAISections[keySuffix];
                    if (contentDiv) {
                         formatAndDisplayContentWithPrompt(contentDiv, keySuffix, promptText, sectionContent);
                    } else {
                        console.warn(`Modal Tab Content Div not found for key: ${keySuffix}`);
                    }
                });

                if (modalAnalysisResultsArea) modalAnalysisResultsArea.style.display = 'block';
                const activeModalResultTab = document.querySelector('#new-rfp-modal .tabs-container .tab-link');
                if (activeModalResultTab) {
                    document.querySelectorAll('#new-rfp-modal .tabs-container .tab-link').forEach(tl => tl.classList.remove('active'));
                    activeModalResultTab.classList.add('active');
                    const tabNameToOpen = activeModalResultTab.getAttribute('onclick').match(/'([^']*)'/)[1];
                    if (window.openModalTab) window.openModalTab(null, tabNameToOpen);
                }
                showLoadingMessage(modalAnalysisStatusArea, "RFP analysis complete! Saving results...", false);

                try {
                    const savePayload = {
                        rfpTitle: rfpTitleValue || "", rfpType: rfpTypeValue, submittedBy: submittedByValue,
                        rfpFileName: rfpFileNameValue, 
                        rfpSummary: parsedAISections.summary, 
                        generatedQuestions: parsedAISections.questions,
                        rfpDeadlines: parsedAISections.deadlines, 
                        rfpSubmissionFormat: parsedAISections.submissionFormat,
                        rfpKeyRequirements: parsedAISections.requirements, 
                        rfpStakeholders: parsedAISections.stakeholders,
                        rfpRisks: parsedAISections.risks, 
                        rfpRegistration: parsedAISections.registration,
                        rfpLicenses: parsedAISections.licenses, 
                        rfpBudget: parsedAISections.budget, 
                        status: 'analyzed',
                        analysisPrompts: currentAnalysisPrompts 
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
    const firstActiveViewTab = document.querySelector('#view-saved-rfp-details-section.modal-active .tabs-container .tab-link'); // Make selector more specific
    if (firstActiveViewTab && viewSavedRfpDetailsSection && viewSavedRfpDetailsSection.classList.contains('modal-active')) { // check class
        const tabNameToOpen = firstActiveViewTab.getAttribute('onclick').match(/'([^']*)'/)[1];
        const tabElement = document.getElementById(tabNameToOpen); // Ensure tabName is correct
        if (window.openViewTab && tabElement && tabElement.style.display !== 'block') {
             // Check if openViewTab needs event, it was (null, tabNameToOpen)
            window.openViewTab(null, tabNameToOpen); // Pass null for event if not used by openViewTab
        }
    }

    loadSavedAnalysesInitial();
    if (promptSectionSelector) { 
        loadSelectedSectionPromptToTextarea();
    }
});
