document.addEventListener('DOMContentLoaded', () => {
    // --- MODAL Elements (for New RFP Analysis) ---
    const newRfpModal = document.getElementById('new-rfp-modal');
    const openNewRfpModalButton = document.getElementById('open-new-rfp-modal-button');
    const modalCloseButton = document.getElementById('modal-close-button');
    const modalFormTitle = document.getElementById('modal-title');

    const rfpForm = document.getElementById('rfp-details-form');
    const rfpFileUpload = document.getElementById('rfpFileUpload'); // Used by rfpForm listener
    const rfpAddendumUpload = document.getElementById('rfpAddendumUpload'); // Used by rfpForm listener
    const generateAnalysisButton = document.getElementById('generate-analysis-button');
    const modalAnalysisStatusArea = document.getElementById('modal-analysis-status-area');
    const modalAnalysisResultsArea = document.getElementById('modal-analysis-results-area');

    // Modal's result tab content divs
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
    
    const viewTabContentMap = { // Used by viewLink listener
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
    const savedAnalysesListDiv = document.getElementById('saved-analyses-list'); // Used by renderAnalysesList (from rfp-data-logic.js)
    const noSavedAnalysesP = document.getElementById('no-saved-analyses'); // Used by renderAnalysesList (from rfp-data-logic.js)
    const rfpListTabsContainer = document.querySelector('.rfp-list-tabs');
    const rfpListStatusArea = document.getElementById('rfp-list-status-area');
    const yearSpanRFP = document.getElementById('current-year-rfp');

    // --- AI Prompt Settings Modal Elements ---
    const promptSettingsModal = document.getElementById('prompt-settings-modal');
    const openPromptSettingsButton = document.getElementById('open-prompt-settings-modal-button');
    const promptModalCloseButton = document.getElementById('prompt-modal-close-button');
    const promptSectionSelector = document.getElementById('promptSectionSelector');
    const rfpIndividualPromptTextarea = document.getElementById('rfpIndividualPromptTextarea'); // Used by loadSelectedSectionPromptToTextarea (from rfp-ai-module.js)
    const saveCurrentPromptButton = document.getElementById('save-current-prompt-button');
    const resetCurrentPromptButton = document.getElementById('reset-current-prompt-button');
    const resetAllPromptsButton = document.getElementById('reset-all-prompts-button');
    const promptSaveStatus = document.getElementById('prompt-save-status');


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
                clearModalAnalysisResultTabs(); // UI function
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
                // loadSelectedSectionPromptToTextarea(); // This will be called from rfp-ai-module.js or here if that module is imported
                if (typeof window.loadSelectedSectionPromptToTextarea === 'function') window.loadSelectedSectionPromptToTextarea();

                if (newRfpModal) newRfpModal.style.display = 'none';
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
        // promptSectionSelector.addEventListener('change', loadSelectedSectionPromptToTextarea);
         promptSectionSelector.addEventListener('change', () => {
            if (typeof window.loadSelectedSectionPromptToTextarea === 'function') window.loadSelectedSectionPromptToTextarea();
         });
    }
    if(saveCurrentPromptButton) {
        // saveCurrentPromptButton.addEventListener('click', saveCurrentSectionPrompt);
        saveCurrentPromptButton.addEventListener('click', () => {
            if (typeof window.saveCurrentSectionPrompt === 'function') window.saveCurrentSectionPrompt(promptSectionSelector, rfpIndividualPromptTextarea, promptSaveStatus);
        });
    }
    if(resetCurrentPromptButton) {
        // resetCurrentPromptButton.addEventListener('click', resetCurrentSectionPromptToDefault);
        resetCurrentPromptButton.addEventListener('click', () => {
            if (typeof window.resetCurrentSectionPromptToDefault === 'function') window.resetCurrentSectionPromptToDefault(promptSectionSelector, rfpIndividualPromptTextarea, promptSaveStatus);
        });
    }
    if(resetAllPromptsButton) {
        // resetAllPromptsButton.addEventListener('click', resetAllPromptsToDefault);
        resetAllPromptsButton.addEventListener('click', () => {
            if (typeof window.resetAllPromptsToDefault === 'function') window.resetAllPromptsToDefault(promptSaveStatus, promptSectionSelector);
        });
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
    
        let deadlinesTabParent, deadlinesDivId, submissionDivId;
        if (isModalView && modalDeadlinesTabContentDiv) {
            deadlinesTabParent = modalDeadlinesTabContentDiv;
            deadlinesDivId = 'modal-deadlines-only-content';
            submissionDivId = 'modal-submission-format-content';
            deadlinesTabParent.innerHTML = `
                <h4>Deadlines:</h4><div id="${deadlinesDivId}"></div>
                <h4 style="margin-top: 1rem;">Submission Format:</h4><div id="${submissionDivId}"></div>
            `;
            // Update map references if they were global/accessible or pass them around
            if (modalTabContentMap) { // Assuming modalTabContentMap is accessible
                 modalTabContentMap.deadlines = document.getElementById(deadlinesDivId);
                 modalTabContentMap.submissionFormat = document.getElementById(submissionDivId);
            }
        } else if (!isModalView && viewDeadlinesTabContentDiv) {
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
                if (viewTabContentMap) { // Assuming viewTabContentMap is accessible
                    viewTabContentMap.deadlines = document.getElementById(deadlinesDivId);
                    viewTabContentMap.submissionFormat = document.getElementById(submissionDivId);
                }
            } else { 
                 viewDeadlinesTabContentDiv.innerHTML = '';
            }
        }
    }
    
    function clearModalAnalysisResultTabs() { clearTabContent(modalTabContentMap, true); }
    function clearViewAnalysisResultTabs() { clearTabContent(viewTabContentMap, false); }


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
    
    // --- Event Listeners for Main Page List Tabs & Sorting ---
    if (rfpListTabsContainer) {
        rfpListTabsContainer.addEventListener('click', (e) => {
            if (e.target.classList.contains('rfp-list-tab-button')) {
                rfpListTabsContainer.querySelectorAll('.rfp-list-tab-button').forEach(btn => btn.classList.remove('active'));
                e.target.classList.add('active');
                // currentStatusFilter = e.target.dataset.statusFilter; // State managed in rfp-data-logic.js
                // renderAnalysesList(); // Called from rfp-data-logic.js
                if (typeof window.handleStatusFilterChange === 'function') window.handleStatusFilterChange(e.target.dataset.statusFilter);
            }
        });
    }
    document.querySelectorAll('#saved-analyses-header .sortable-header').forEach(header => {
        header.addEventListener('click', () => {
            const sortKey = header.dataset.sortKey;
            // Logic for currentSortKey and currentSortOrder will be in rfp-data-logic.js
            // renderAnalysesList(); // Called from rfp-data-logic.js
            if (typeof window.handleSortChange === 'function') window.handleSortChange(sortKey);

            // UI update for arrows can remain here or be part of renderAnalysesList
            document.querySelectorAll('#saved-analyses-header .sortable-header').forEach(h => {
                let text = h.textContent.replace(/ [⇅↑↓]$/, '');
                if (h.dataset.sortKey === window.currentSortKey) { // Assuming currentSortKey is exposed or passed
                    text += window.currentSortOrder === 'asc' ? ' ↑' : ' ↓';
                } else {
                    text += ' ⇅';
                }
                h.textContent = text;
            });
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

            // The core logic for PDF extraction, AI call, parsing, and saving will be in rfp-data-logic.js
            // This UI script will call a main handler function from rfp-data-logic.js
            if (typeof window.handleRfpFormSubmit === 'function') {
                await window.handleRfpFormSubmit({
                    rfpTitleValue, rfpTypeValue, submittedByValue, mainRfpFile, addendumFiles, rfpFileNameValue,
                    modalAnalysisStatusArea, modalAnalysisResultsArea, modalTabContentMap, // Pass UI elements for updates
                    showLoadingMessage, hideLoadingMessage, clearModalAnalysisResultTabs, // Pass UI helpers
                    // formatAndDisplayContentWithPrompt // This will be used by the data logic module
                });
            } else {
                 showLoadingMessage(modalAnalysisStatusArea, "Error: Form submission handler not found.", false);
                 hideLoadingMessage(modalAnalysisStatusArea, 5000);
            }
        });
    }

   if (typeof window.loadSavedAnalysesInitial === 'function') {
        window.loadSavedAnalysesInitial(rfpListStatusArea, savedAnalysesListDiv, noSavedAnalysesP, showLoadingMessage, hideLoadingMessage);
    }
    
    // Load initial prompt for the prompt editor
    if (promptSectionSelector && typeof window.loadSelectedSectionPromptToTextarea === 'function') {
        window.loadSelectedSectionPromptToTextarea();
    }

  });
