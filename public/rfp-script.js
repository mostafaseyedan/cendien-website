import * as pdfjsLib from 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/5.0.375/pdf.min.mjs';

pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/5.0.375/pdf.worker.min.mjs';

document.addEventListener('DOMContentLoaded', () => {
    // --- START OF MODAL AUTHENTICATION ---
    const authModalOverlay = document.getElementById('auth-modal-overlay');
    const authForm = document.getElementById('auth-form');
    const authUsernameInput = document.getElementById('auth-username');
    const authPasswordInput = document.getElementById('auth-password');
    const authErrorMessage = document.getElementById('auth-error-message');
    const pageContentWrapper = document.getElementById('page-content-wrapper');

    const correctUsername = "Cendien";
    const correctPassword = "rfpanalyzer";
    const sessionDuration = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
    const loginTimestampKey = 'rfpAnalyzerLoginTimestamp';

    function isSessionValid() {
        const storedTimestamp = localStorage.getItem(loginTimestampKey);
        if (!storedTimestamp) {
            return false;
        }
        const lastLoginTime = parseInt(storedTimestamp, 10);
        if (isNaN(lastLoginTime)) { // Handle cases where timestamp might be corrupted
            localStorage.removeItem(loginTimestampKey); // Clear invalid item
            return false;
        }
        return (Date.now() - lastLoginTime) < sessionDuration;
    }

    function handleSuccessfulLogin() {
        localStorage.setItem(loginTimestampKey, Date.now().toString());
        if (authModalOverlay) {
            authModalOverlay.classList.add('auth-modal-hidden'); // Hide modal
            authModalOverlay.style.display = 'none'; // Ensure it's fully hidden
        }
        if (pageContentWrapper) {
            pageContentWrapper.classList.remove('content-hidden');
            pageContentWrapper.style.display = ''; // Or 'block', 'flex', etc. depending on its original display
        }
        
        // Initialize the rest of the RFP page functionality
        initializeAppLogic(); 
    }

    function showLoginError(message) {
        if (authErrorMessage) {
            authErrorMessage.textContent = message;
            authErrorMessage.style.display = 'block';
        }
        if (authPasswordInput) authPasswordInput.value = ''; // Clear password
        if (authUsernameInput) authUsernameInput.focus();
    }

    if (isSessionValid()) {
        console.log("RFP Analyzer: Valid session found.");
        handleSuccessfulLogin();
    } else {
        console.log("RFP Analyzer: No valid session or session expired. Showing login modal.");
        if (authModalOverlay) {
            authModalOverlay.classList.remove('auth-modal-hidden');
            authModalOverlay.style.display = 'flex'; // Make sure it's visible as a flex container
        }
        if (pageContentWrapper) {
            pageContentWrapper.classList.add('content-hidden');
            pageContentWrapper.style.display = 'none'; // Ensure main content is hidden
        }
        
        if (authForm) {
            authForm.addEventListener('submit', (event) => {
                event.preventDefault();
                if (!authUsernameInput || !authPasswordInput) { // Guard against missing elements
                    showLoginError("Login form elements are missing.");
                    return;
                }
                const username = authUsernameInput.value.trim();
                const password = authPasswordInput.value; 

                if (username === correctUsername && password === correctPassword) {
                    if (authErrorMessage) authErrorMessage.style.display = 'none';
                    handleSuccessfulLogin();
                } else {
                    showLoginError("Invalid username or password. Please try again.");
                }
            });
        } else {
             console.error("RFP Analyzer: Login form (auth-form) not found in the DOM.");
             document.body.innerHTML = "<div style='text-align:center; padding: 50px; font-family: sans-serif;'><h1>Configuration Error</h1><p>Login form not found. Page cannot load.</p></div>";
             return; 
        }
    }
    // --- END OF MODAL AUTHENTICATION ---

    function initializeAppLogic() {
        console.log("RFP Analyzer: Initializing app logic...");
        
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

        const editRfpModal = document.getElementById('edit-rfp-modal');
        const editRfpModalCloseButton = document.getElementById('edit-rfp-modal-close-button');
        const editRfpModalTitle = document.getElementById('edit-rfp-modal-title');
        const editRfpForm = document.getElementById('edit-rfp-details-form');
        const editRfpId = document.getElementById('editRfpId');
        const editRfpTitleInput = document.getElementById('editRfpTitle');
        const editRfpFileNameInput = document.getElementById('editRfpFileName');
        const editRfpTypeSelect = document.getElementById('editRfpType');
        const editSubmittedBySelect = document.getElementById('editSubmittedBy');
        const editRfpStatusSelect = document.getElementById('editRfpStatus');
        const editRfpSummaryTextarea = document.getElementById('editRfpSummary');
        const editGeneratedQuestionsTextarea = document.getElementById('editGeneratedQuestions');
        const editRfpDeadlinesTextarea = document.getElementById('editRfpDeadlines');
        const editRfpSubmissionFormatTextarea = document.getElementById('editRfpSubmissionFormat');
        const editRfpKeyRequirementsTextarea = document.getElementById('editRfpKeyRequirements');
        const editRfpStakeholdersTextarea = document.getElementById('editRfpStakeholders');
        const editRfpRisksTextarea = document.getElementById('editRfpRisks');
        const editRfpRegistrationTextarea = document.getElementById('editRfpRegistration');
        const editRfpLicensesTextarea = document.getElementById('editRfpLicenses');
        const editRfpBudgetTextarea = document.getElementById('editRfpBudget');
        const saveEditedRfpButton = document.getElementById('save-edited-rfp-button');
        const cancelEditRfpButton = document.getElementById('cancel-edit-rfp-button');
        const editRfpStatusArea = document.getElementById('edit-rfp-status-area');

        const savedAnalysesListDiv = document.getElementById('saved-analyses-list');
        const noSavedAnalysesP = document.getElementById('no-saved-analyses');
        const rfpListTabsContainer = document.querySelector('.rfp-list-tabs');
        const rfpListStatusArea = document.getElementById('rfp-list-status-area');
        const yearSpanRFP = document.getElementById('current-year-rfp');

        const promptSettingsModal = document.getElementById('prompt-settings-modal');
        const openPromptSettingsButton = document.getElementById('open-prompt-settings-modal-button');
        const promptModalCloseButton = document.getElementById('prompt-modal-close-button');
        const promptSectionSelector = document.getElementById('promptSectionSelector');
        const rfpIndividualPromptTextarea = document.getElementById('rfpIndividualPromptTextarea');
        const saveCurrentPromptButton = document.getElementById('save-current-prompt-button');
        const resetCurrentPromptButton = document.getElementById('reset-current-prompt-button');
        const resetAllPromptsButton = document.getElementById('reset-all-prompts-button');
        const promptSaveStatus = document.getElementById('prompt-save-status');

        let allFetchedAnalyses = [];
        let currentSortKey = 'analysisDate';
        let currentSortOrder = 'desc';
        let currentStatusFilter = 'all_statuses';
        let serverRfpPrompts = null; 
        let promptsLastFetchedFromServer = false; 

        const RFP_PROMPT_MAIN_INSTRUCTION = "Please analyze the following Request for Proposal (RFP) text.\nProvide the following distinct sections in your response, each clearly delimited:";
        const RFP_PROMPT_SECTION_DELIMITER_FORMAT = "\n\n###{SECTION_KEY_UPPER}_START###\n[Content for {SECTION_KEY_UPPER}]\n###{SECTION_KEY_UPPER}_END###";
        const RFP_PROMPT_TEXT_SUFFIX = "\n\nRFP Text (including any addendums):\n---\n{RFP_TEXT_PLACEHOLDER}\n---";

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

        if (yearSpanRFP && !yearSpanRFP.textContent) {
            yearSpanRFP.textContent = new Date().getFullYear();
        }

        async function fetchPromptsFromServer() {
            if (promptsLastFetchedFromServer && serverRfpPrompts) {
                console.log("Using already fetched server prompts.");
                return serverRfpPrompts;
            }
            if(promptSaveStatus) showLoadingMessage(promptSaveStatus, 'Loading prompt settings from server...', true);
            try {
                const response = await fetch('/api/rfp-prompt-settings');
                if (!response.ok) {
                    const errData = await response.json().catch(() => ({ error: 'Failed to fetch prompts, server error.' }));
                    throw new Error(errData.error || `HTTP error ${response.status}`);
                }
                const data = await response.json();
                serverRfpPrompts = data.prompts; 
                promptsLastFetchedFromServer = true;
                if(promptSaveStatus) {
                    showLoadingMessage(promptSaveStatus, 'Prompts loaded from server!', false);
                    hideLoadingMessage(promptSaveStatus, 2000);
                }
                return serverRfpPrompts;
            } catch (error) {
                console.error('Error fetching prompts from server:', error);
                if(promptSaveStatus) showLoadingMessage(promptSaveStatus, `Error loading prompts: ${error.message}. Using local defaults.`, false);
                
                serverRfpPrompts = {};
                Object.keys(PROMPT_CONFIG).forEach(key => {
                    serverRfpPrompts[key] = PROMPT_CONFIG[key].defaultText;
                });
                if(promptSaveStatus) hideLoadingMessage(promptSaveStatus, 3000);
                return serverRfpPrompts; 
            }
        }

        async function savePromptsToServer(promptsToSave) {
            if(promptSaveStatus) showLoadingMessage(promptSaveStatus, 'Saving prompts to server...', true);
            try {
                const response = await fetch('/api/rfp-prompt-settings', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ prompts: promptsToSave }),
                });
                if (!response.ok) {
                    const errData = await response.json().catch(() => ({ error: 'Failed to save prompts, server error.' }));
                    throw new Error(errData.error || `HTTP error ${response.status}`);
                }
                const data = await response.json();
                serverRfpPrompts = data.prompts; 
                if(promptSaveStatus){
                    showLoadingMessage(promptSaveStatus, data.message || 'Prompts saved to server!', false);
                    hideLoadingMessage(promptSaveStatus, 2000);
                }
            } catch (error) {
                console.error('Error saving prompts to server:', error);
                if(promptSaveStatus){
                    showLoadingMessage(promptSaveStatus, `Error saving prompts: ${error.message}`, false);
                    hideLoadingMessage(promptSaveStatus, 3000);
                }
            }
        }
        
        function getStoredSectionPrompt(sectionKeySuffix) {
            if (serverRfpPrompts && serverRfpPrompts[sectionKeySuffix]) {
                return serverRfpPrompts[sectionKeySuffix];
            }
            return PROMPT_CONFIG[sectionKeySuffix]?.defaultText;
        }

        function loadSelectedSectionPromptToTextarea() {
            if (promptSectionSelector && rfpIndividualPromptTextarea) {
                const selectedKeySuffix = promptSectionSelector.value;
                if (selectedKeySuffix && PROMPT_CONFIG[selectedKeySuffix]) { 
                    if (!serverRfpPrompts) {
                        console.warn("Server prompts not yet loaded for textarea. Attempting to load now.");
                        fetchPromptsFromServer().then(() => { 
                            rfpIndividualPromptTextarea.value = getStoredSectionPrompt(selectedKeySuffix);
                        });
                    } else {
                        rfpIndividualPromptTextarea.value = getStoredSectionPrompt(selectedKeySuffix);
                    }
                }
            }
        }

        async function saveCurrentSectionPrompt() { 
            if (promptSectionSelector && rfpIndividualPromptTextarea && promptSaveStatus) {
                const selectedKeySuffix = promptSectionSelector.value;
                const userPrompt = rfpIndividualPromptTextarea.value.trim();

                if (!serverRfpPrompts) { 
                    await fetchPromptsFromServer(); 
                }
                 if (!serverRfpPrompts) { 
                    showLoadingMessage(promptSaveStatus, 'Error: Cannot save, base prompts not loaded.', false);
                    hideLoadingMessage(promptSaveStatus, 3000);
                    return;
                }

                if (userPrompt) {
                    serverRfpPrompts[selectedKeySuffix] = userPrompt; 
                    await savePromptsToServer(serverRfpPrompts); 
                } else {
                    showLoadingMessage(promptSaveStatus, 'Section prompt cannot be empty.', false);
                    hideLoadingMessage(promptSaveStatus, 3000);
                }
            }
        }

        async function resetCurrentSectionPromptToDefault() { 
            if (promptSectionSelector && rfpIndividualPromptTextarea && promptSaveStatus) {
                const selectedKeySuffix = promptSectionSelector.value;
                const selectedOptionText = promptSectionSelector.options[promptSectionSelector.selectedIndex].text;

                if (!serverRfpPrompts) { 
                    await fetchPromptsFromServer(); 
                }
                 if (!serverRfpPrompts) { 
                    showLoadingMessage(promptSaveStatus, 'Error: Cannot reset, base prompts not loaded.', false);
                    hideLoadingMessage(promptSaveStatus, 3000);
                    return;
                }

                if (confirm(`Are you sure you want to reset the prompt for "${selectedOptionText}" to its default and save to server?`)) {
                    const defaultPromptText = PROMPT_CONFIG[selectedKeySuffix]?.defaultText;
                    if (defaultPromptText) {
                        serverRfpPrompts[selectedKeySuffix] = defaultPromptText; 
                        rfpIndividualPromptTextarea.value = defaultPromptText; 
                        await savePromptsToServer(serverRfpPrompts); 
                    } else {
                         showLoadingMessage(promptSaveStatus, `Error: No default prompt found for ${selectedOptionText}.`, false);
                         hideLoadingMessage(promptSaveStatus, 3000);
                    }
                }
            }
        }

        async function resetAllPromptsToDefault() { 
            if (promptSaveStatus && promptSectionSelector) {
                if (confirm("Are you sure you want to reset ALL section prompts to their defaults and save to server? This action cannot be undone.")) {
                    const newDefaults = {};
                    Object.keys(PROMPT_CONFIG).forEach(keySuffix => {
                        newDefaults[keySuffix] = PROMPT_CONFIG[keySuffix].defaultText;
                    });
                    serverRfpPrompts = newDefaults; 
                    await savePromptsToServer(serverRfpPrompts); 
                    loadSelectedSectionPromptToTextarea(); 
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
                if (delimiterKeyUpper) {
                    const delimiter = RFP_PROMPT_SECTION_DELIMITER_FORMAT.replace(/{SECTION_KEY_UPPER}/g, delimiterKeyUpper);
                    fullPrompt += delimiter;
                }
            });
            fullPrompt += RFP_PROMPT_TEXT_SUFFIX.replace('{RFP_TEXT_PLACEHOLDER}', rfpText);
            return fullPrompt;
        }

        function openModal(modalElement) {
            if (modalElement) {
                [newRfpModal, editRfpModal, viewSavedRfpDetailsSection, promptSettingsModal].forEach(m => {
                    if (m && m !== modalElement) {
                        m.style.display = 'none';
                        if (m.classList.contains('modal-active')) m.classList.remove('modal-active');
                    }
                });
                modalElement.style.display = 'block';
                if (modalElement.id === 'view-saved-rfp-details-section') {
                    modalElement.classList.add('modal-active');
                }
                document.body.style.overflow = 'hidden';
            }
        }

        function closeModal(modalElement) {
            if (modalElement) {
                modalElement.style.display = 'none';
                if (modalElement.id === 'view-saved-rfp-details-section') {
                    modalElement.classList.remove('modal-active');
                }
                document.body.style.overflow = '';
            }
        }
        
        if (openNewRfpModalButton) {
            openNewRfpModalButton.addEventListener('click', () => {
                if (rfpForm) rfpForm.reset();
                if (modalAnalysisResultsArea) modalAnalysisResultsArea.style.display = 'none';
                if (modalAnalysisStatusArea) modalAnalysisStatusArea.style.display = 'none';
                clearModalAnalysisResultTabs();
                if (modalFormTitle) modalFormTitle.textContent = "Analyze New RFP";
                openModal(newRfpModal);
            });
        }
        if (modalCloseButton) {
            modalCloseButton.addEventListener('click', () => closeModal(newRfpModal));
        }
        if (newRfpModal) {
            newRfpModal.addEventListener('click', (event) => {
                if (event.target === newRfpModal) closeModal(newRfpModal);
            });
        }

        if (openPromptSettingsButton) {
            openPromptSettingsButton.addEventListener('click', async () => { 
                if (!promptsLastFetchedFromServer || !serverRfpPrompts) { 
                    await fetchPromptsFromServer();
                }
                loadSelectedSectionPromptToTextarea(); 
                openModal(promptSettingsModal);
            });
        }
        if (promptModalCloseButton) {
            promptModalCloseButton.addEventListener('click', () => closeModal(promptSettingsModal));
        }
        if (promptSettingsModal) {
            promptSettingsModal.addEventListener('click', (event) => {
                if (event.target === promptSettingsModal) closeModal(promptSettingsModal);
            });
        }
        
        if (promptSectionSelector) {
            promptSectionSelector.addEventListener('change', loadSelectedSectionPromptToTextarea);
        }
        if (saveCurrentPromptButton) {
            saveCurrentPromptButton.addEventListener('click', saveCurrentSectionPrompt);
        }
        if (resetCurrentPromptButton) {
            resetCurrentPromptButton.addEventListener('click', resetCurrentSectionPromptToDefault);
        }
        if (resetAllPromptsButton) {
            resetAllPromptsButton.addEventListener('click', resetAllPromptsToDefault);
        }

        if (closeViewRfpDetailsButton) {
            closeViewRfpDetailsButton.addEventListener('click', () => closeModal(viewSavedRfpDetailsSection));
        }
        if (viewSavedRfpDetailsSection) {
            viewSavedRfpDetailsSection.addEventListener('click', (event) => {
                if (event.target === viewSavedRfpDetailsSection) closeModal(viewSavedRfpDetailsSection);
            });
        }

        if (editRfpModalCloseButton) {
            editRfpModalCloseButton.addEventListener('click', () => closeModal(editRfpModal));
        }
        if (cancelEditRfpButton) {
            cancelEditRfpButton.addEventListener('click', () => closeModal(editRfpModal));
        }
        if (editRfpModal) {
            editRfpModal.addEventListener('click', (event) => {
                if (event.target === editRfpModal) closeModal(editRfpModal);
            });
        }
        
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
                deadlinesTabParent.innerHTML = `<h4>Deadlines:</h4><div id="${deadlinesDivId}"></div><h4 style="margin-top: 1rem;">Submission Format:</h4><div id="${submissionDivId}"></div>`;
                modalTabContentMap.deadlines = document.getElementById(deadlinesDivId); // Re-assign to the new inner div
                modalTabContentMap.submissionFormat = document.getElementById(submissionDivId); // Re-assign
            } else if (!isModalView && viewDeadlinesTabContentDiv) {
                const resultContainer = viewDeadlinesTabContentDiv.querySelector('#view-deadlines-result-content'); // Target specific inner container
                deadlinesDivId = 'view-deadlines-only-content';
                submissionDivId = 'view-submission-format-content';
                if (resultContainer) {
                     resultContainer.innerHTML = `<h4>Deadlines:</h4><div id="${deadlinesDivId}"></div><h4 style="margin-top: 1rem;">Submission Format:</h4><div id="${submissionDivId}"></div>`;
                    viewTabContentMap.deadlines = document.getElementById(deadlinesDivId); // Re-assign
                    viewTabContentMap.submissionFormat = document.getElementById(submissionDivId); // Re-assign
                } else { 
                    if(viewDeadlinesTabContentDiv) viewDeadlinesTabContentDiv.innerHTML = ''; 
                }
            }
        }
        function clearModalAnalysisResultTabs() { clearTabContent(modalTabContentMap, true); }
        function clearViewAnalysisResultTabs() { clearTabContent(viewTabContentMap, false); }

        function showLoadingMessage(areaElement, message = "Processing...", showSpinner = true) {
            if (!areaElement) return;
            areaElement.style.display = 'flex'; 
            areaElement.innerHTML = `${showSpinner ? '<div class="spinner"></div>' : ''}<p class="loading-text">${message}</p>`;
            if ((areaElement === modalAnalysisStatusArea && generateAnalysisButton) || (areaElement === editRfpStatusArea && saveEditedRfpButton)) {
                if(generateAnalysisButton && areaElement === modalAnalysisStatusArea && showSpinner) generateAnalysisButton.disabled = true;
                if(saveEditedRfpButton && areaElement === editRfpStatusArea && showSpinner) saveEditedRfpButton.disabled = true;
            }
            if (areaElement === promptSaveStatus) {
                areaElement.style.display = 'flex'; 
            }
        }
        function hideLoadingMessage(areaElement, delay = 0) {
            setTimeout(() => {
                if (areaElement && (areaElement.innerHTML.includes('loading-text') || areaElement.innerHTML.includes('spinner'))) {
                    areaElement.style.display = 'none';
                    areaElement.innerHTML = '';
                }
                if (generateAnalysisButton && areaElement === modalAnalysisStatusArea) generateAnalysisButton.disabled = false;
                if (saveEditedRfpButton && areaElement === editRfpStatusArea) saveEditedRfpButton.disabled = false;
            }, delay);
        }

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

        function formatAndDisplayContentWithPrompt(parentElement, sectionKeySuffix, sectionPromptText, sectionContentText) {
            if (!parentElement) {
                console.warn("formatAndDisplayContentWithPrompt: parentElement is null for sectionKeySuffix:", sectionKeySuffix);
                return;
            }
            parentElement.innerHTML = '';

            if (sectionPromptText) {
                const promptDisplayDiv = document.createElement('div');
                promptDisplayDiv.className = 'prompt-display-box';
                const promptLabel = document.createElement('strong');
                promptLabel.textContent = "Instruction Used: ";
                promptDisplayDiv.appendChild(promptLabel);
                const promptTextNode = document.createTextNode(sectionPromptText);
                promptDisplayDiv.appendChild(promptTextNode);
                
                const currentDefaultPromptFromConfig = PROMPT_CONFIG[sectionKeySuffix]?.defaultText;
                if (currentDefaultPromptFromConfig && sectionPromptText === currentDefaultPromptFromConfig) {
                    const defaultIndicator = document.createElement('em');
                    defaultIndicator.textContent = " (This is the current default instruction)";
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
        async function updateRfpStatus(rfpId, newStatus) {
            const rfpToUpdate = allFetchedAnalyses.find(a => a.id === rfpId);
            const rfpTitleForMessage = rfpToUpdate ? (rfpToUpdate.rfpTitle || rfpToUpdate.rfpFileName || 'this RFP') : 'this RFP';
            if(rfpListStatusArea) showLoadingMessage(rfpListStatusArea, `Updating "${rfpTitleForMessage}" to ${newStatus}...`);
            try {
                const response = await fetch(`/api/rfp-analysis/${rfpId}/status`, {
                    method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: newStatus }),
                });
                if (!response.ok) throw new Error((await response.json()).error || 'Failed to update status.');
                const result = await response.json(); 
                const updatedAnalysis = allFetchedAnalyses.find(a => a.id === rfpId);
                if (updatedAnalysis) updatedAnalysis.status = result.newStatus || newStatus; 
                renderAnalysesList();
                if(rfpListStatusArea) showLoadingMessage(rfpListStatusArea, `"${rfpTitleForMessage}" status updated to ${result.newStatus || newStatus}!`, false);
            } catch (error) { 
                if(rfpListStatusArea) showLoadingMessage(rfpListStatusArea, `Error updating status: ${error.message}`, false);
            } finally { 
                if(rfpListStatusArea) hideLoadingMessage(rfpListStatusArea, 3000); 
            }
        }

        async function deleteRfp(rfpId, rfpTitleForConfirm) {
            if (!window.confirm(`Are you sure you want to delete RFP: "${rfpTitleForConfirm}"? This action cannot be undone.`)) return;
            if(rfpListStatusArea) showLoadingMessage(rfpListStatusArea, `Deleting "${rfpTitleForConfirm}"...`);
            try {
                const response = await fetch(`/api/rfp-analysis/${rfpId}`, { method: 'DELETE' });
                if (!response.ok) throw new Error((await response.json()).error || `Failed to delete ${rfpTitleForConfirm}.`);
                allFetchedAnalyses = allFetchedAnalyses.filter(a => a.id !== rfpId);
                renderAnalysesList();
                if (viewSavedRfpDetailsSection && viewSavedRfpDetailsSection.classList.contains('modal-active') && 
                    viewSavedRfpDetailsSection.dataset.currentViewingId === rfpId) {
                    closeModal(viewSavedRfpDetailsSection);
                }
                if(rfpListStatusArea) showLoadingMessage(rfpListStatusArea, `"${rfpTitleForConfirm}" deleted successfully!`, false);
            } catch (error) { 
                if(rfpListStatusArea) showLoadingMessage(rfpListStatusArea, `Error deleting: ${error.message}`, false);
            } finally { 
                if(rfpListStatusArea) hideLoadingMessage(rfpListStatusArea, 3000); 
            }
        }

        async function openEditRfpModal(analysisFullDetails) {
            if (!editRfpModal || !editRfpForm) return;
            let analysis = analysisFullDetails;
            if (!analysis.rfpSummary && !analysis.generatedQuestions && !analysis.rfpDeadlines) { 
                if(editRfpStatusArea) showLoadingMessage(editRfpStatusArea, 'Loading full RFP details...');
                try {
                    const response = await fetch(`/api/rfp-analysis/${analysisFullDetails.id}`);
                    if (!response.ok) throw new Error((await response.json()).error || 'Failed to fetch full RFP details.');
                    analysis = await response.json();
                } catch (error) {
                    console.error("Error fetching full RFP details:", error);
                    if(editRfpStatusArea) showLoadingMessage(editRfpStatusArea, `Error: ${error.message}`, false);
                    if(editRfpStatusArea) hideLoadingMessage(editRfpStatusArea, 3000);
                    return;
                } finally {
                     if (editRfpStatusArea && editRfpStatusArea.innerHTML.includes('Loading full RFP details...')) {
                        hideLoadingMessage(editRfpStatusArea);
                    }
                }
            }

            if (editRfpId) editRfpId.value = analysis.id;
            if (editRfpTitleInput) editRfpTitleInput.value = analysis.rfpTitle || '';
            if (editRfpFileNameInput) editRfpFileNameInput.value = analysis.rfpFileName || 'N/A';
            if (editRfpTypeSelect) editRfpTypeSelect.value = analysis.rfpType || 'Other';
            if (editSubmittedBySelect) editSubmittedBySelect.value = analysis.submittedBy || 'Other';
            if (editRfpStatusSelect) editRfpStatusSelect.value = analysis.status || 'analyzed';
            if (editRfpSummaryTextarea) editRfpSummaryTextarea.value = analysis.rfpSummary || '';
            if (editGeneratedQuestionsTextarea) editGeneratedQuestionsTextarea.value = analysis.generatedQuestions || '';
            if (editRfpDeadlinesTextarea) editRfpDeadlinesTextarea.value = analysis.rfpDeadlines || '';
            if (editRfpSubmissionFormatTextarea) editRfpSubmissionFormatTextarea.value = analysis.rfpSubmissionFormat || '';
            if (editRfpKeyRequirementsTextarea) editRfpKeyRequirementsTextarea.value = analysis.rfpKeyRequirements || '';
            if (editRfpStakeholdersTextarea) editRfpStakeholdersTextarea.value = analysis.rfpStakeholders || '';
            if (editRfpRisksTextarea) editRfpRisksTextarea.value = analysis.rfpRisks || '';
            if (editRfpRegistrationTextarea) editRfpRegistrationTextarea.value = analysis.rfpRegistration || '';
            if (editRfpLicensesTextarea) editRfpLicensesTextarea.value = analysis.rfpLicenses || '';
            if (editRfpBudgetTextarea) editRfpBudgetTextarea.value = analysis.rfpBudget || '';
            if (editRfpModalTitle) editRfpModalTitle.textContent = `Edit RFP: ${analysis.rfpTitle || analysis.rfpFileName}`;
            
            openModal(editRfpModal);
        }
        
        if (editRfpForm) {
            editRfpForm.addEventListener('submit', async (event) => {
                event.preventDefault();
                if (!saveEditedRfpButton) return;
                const rfpIdToUpdate = editRfpId.value;
                if (!rfpIdToUpdate) {
                    if(editRfpStatusArea) showLoadingMessage(editRfpStatusArea, 'Error: RFP ID is missing.', false);
                    if(editRfpStatusArea) hideLoadingMessage(editRfpStatusArea, 3000); return;
                }
                const updatedData = {
                    rfpTitle: editRfpTitleInput.value.trim(),
                    rfpType: editRfpTypeSelect.value,
                    submittedBy: editSubmittedBySelect.value,
                    status: editRfpStatusSelect.value,
                    rfpSummary: editRfpSummaryTextarea.value.trim(),
                    generatedQuestions: editGeneratedQuestionsTextarea.value.trim(),
                    rfpDeadlines: editRfpDeadlinesTextarea.value.trim(),
                    rfpSubmissionFormat: editRfpSubmissionFormatTextarea.value.trim(),
                    rfpKeyRequirements: editRfpKeyRequirementsTextarea.value.trim(),
                    rfpStakeholders: editRfpStakeholdersTextarea.value.trim(),
                    rfpRisks: editRfpRisksTextarea.value.trim(),
                    rfpRegistration: editRfpRegistrationTextarea.value.trim(),
                    rfpLicenses: editRfpLicensesTextarea.value.trim(),
                    rfpBudget: editRfpBudgetTextarea.value.trim()
                };
                if(editRfpStatusArea) showLoadingMessage(editRfpStatusArea, 'Saving changes...');
                try {
                    const response = await fetch(`/api/rfp-analysis/${rfpIdToUpdate}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(updatedData)
                    });
                    if (!response.ok) {
                        const errorResult = await response.json().catch(() => ({ error: 'Failed to save changes. Server error.' }));
                        throw new Error(errorResult.error || `HTTP error! Status: ${response.status}`);
                    }
                    const result = await response.json();
                    if(editRfpStatusArea) showLoadingMessage(editRfpStatusArea, result.message || 'Changes saved successfully!', false);
                    await loadSavedAnalysesInitial(); 
                    setTimeout(() => closeModal(editRfpModal), 2000);
                } catch (error) {
                    console.error('Error saving RFP details:', error);
                    if(editRfpStatusArea) showLoadingMessage(editRfpStatusArea, `Error: ${error.message}`, false);
                    if(editRfpStatusArea) hideLoadingMessage(editRfpStatusArea, 5000);
                }
            });
        }

        function renderAnalysesList() {
            if (!savedAnalysesListDiv || !noSavedAnalysesP) return;
            savedAnalysesListDiv.innerHTML = '';
            let filteredAnalyses = [...allFetchedAnalyses];

            if (currentStatusFilter === 'active' || currentStatusFilter === 'not_pursuing' || currentStatusFilter === 'archived') {
                filteredAnalyses = filteredAnalyses.filter(a => a.status === currentStatusFilter);
            } else if (currentStatusFilter === 'all_statuses') {
                // No filter for 'all_statuses'
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
                if (currentStatusFilter === 'all_statuses') {
                    noSavedAnalysesP.textContent = `No analyses found.`;
                } else {
                    noSavedAnalysesP.textContent = `No analyses found for "${currentStatusFilter}" category.`;
                }
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
                                       analysis.status === 'archived' ? 'grey' :
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
                    viewLink.innerHTML = '<i class="fas fa-eye" aria-hidden="true"></i>';
                    viewLink.title = "View Analysis Details";
                    viewLink.addEventListener('click', async (e) => {
                        e.preventDefault();
                        const analysisId = e.currentTarget.dataset.id;
                        const rfpItemDiv = e.currentTarget.closest('.analyzed-rfp-item');
                        const titleElement = rfpItemDiv ? rfpItemDiv.querySelector('.rfp-col-title') : null;
                        const loadingMessageTitle = titleElement ? titleElement.textContent : 'Selected RFP';
                        openModal(viewSavedRfpDetailsSection);
                        if (viewSavedRfpDetailsSection) viewSavedRfpDetailsSection.dataset.currentViewingId = analysisId;
                        if (viewRfpMainTitleHeading) viewRfpMainTitleHeading.textContent = `Details for: ${loadingMessageTitle}`;
                        if(viewRfpStatusArea) showLoadingMessage(viewRfpStatusArea, `Loading analysis for ${loadingMessageTitle}...`);
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
                                let sectionDataField;
                                if (keySuffix === 'questions') {
                                    sectionDataField = 'generatedQuestions';
                                } else if (keySuffix === 'summary') {
                                    sectionDataField = 'rfpSummary';
                                } else if (keySuffix === 'requirements') {
                                    sectionDataField = 'rfpKeyRequirements'; // This is the corrected line for requirements
                                } else {
                                    sectionDataField = `rfp${keySuffix.charAt(0).toUpperCase() + keySuffix.slice(1)}`;
                                }
                                const sectionContent = detailedAnalysis[sectionDataField] || "N/A";
                                const promptTextForThisAnalysis = savedPrompts[keySuffix] || PROMPT_CONFIG[keySuffix]?.defaultText;
                                if (contentDiv) {
                                    formatAndDisplayContentWithPrompt(contentDiv, keySuffix, promptTextForThisAnalysis, sectionContent);
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
                            if(viewRfpStatusArea) showLoadingMessage(viewRfpStatusArea, `Displaying: ${titleForStatus}`, false);
                        } catch (loadError) {
                             loadErrorOccurred = true;
                             if(viewRfpStatusArea) showLoadingMessage(viewRfpStatusArea, `Error: ${loadError.message}`, false);
                        } finally {
                            if(viewRfpStatusArea) setTimeout(() => hideLoadingMessage(viewRfpStatusArea), loadErrorOccurred ? 5000 : 2000);
                        }
                    });
                    actionsSpan.appendChild(viewLink);

                    const dropdownContainer = document.createElement('div');
                    dropdownContainer.className = 'actions-dropdown-container';
                    const dropdownTrigger = document.createElement('button');
                    dropdownTrigger.className = 'actions-dropdown-trigger action-icon';
                    dropdownTrigger.innerHTML = '<i class="fas fa-ellipsis-v"></i>';
                    dropdownTrigger.title = "More actions";
                    const dropdownMenu = document.createElement('div');
                    dropdownMenu.className = 'actions-dropdown-menu';
                    dropdownTrigger.addEventListener('click', (e) => {
                        e.stopPropagation();
                        document.querySelectorAll('.actions-dropdown-menu').forEach(menu => {
                            if (menu !== dropdownMenu) menu.style.display = 'none';
                        });
                        dropdownMenu.style.display = dropdownMenu.style.display === 'block' ? 'none' : 'block';
                    });
                    function addDropdownItem(iconClass, text, clickHandler) {
                        const item = document.createElement('button');
                        item.className = 'dropdown-item';
                        item.innerHTML = `<i class="fas ${iconClass}"></i> ${text}`;
                        item.addEventListener('click', (e) => {
                            e.stopPropagation();
                            clickHandler();
                            dropdownMenu.style.display = 'none';
                        });
                        dropdownMenu.appendChild(item);
                    }
                    addDropdownItem('fa-edit', 'Edit Details', () => openEditRfpModal(analysis));
                    dropdownMenu.appendChild(document.createElement('div')).className = 'dropdown-divider';
                    if (analysis.status === 'analyzed') {
                        addDropdownItem('fa-check-circle', 'Move to Active', () => updateRfpStatus(analysis.id, 'active'));
                        addDropdownItem('fa-times-circle', 'Move to Not Pursuing', () => updateRfpStatus(analysis.id, 'not_pursuing'));
                        addDropdownItem('fa-archive', 'Archive', () => updateRfpStatus(analysis.id, 'archived'));
                    } else if (analysis.status === 'active') {
                        addDropdownItem('fa-times-circle', 'Move to Not Pursuing', () => updateRfpStatus(analysis.id, 'not_pursuing'));
                        addDropdownItem('fa-inbox', 'Move to Analyzed', () => updateRfpStatus(analysis.id, 'analyzed'));
                        addDropdownItem('fa-archive', 'Archive', () => updateRfpStatus(analysis.id, 'archived'));
                    } else if (analysis.status === 'not_pursuing') {
                        addDropdownItem('fa-check-circle', 'Move to Active', () => updateRfpStatus(analysis.id, 'active'));
                        addDropdownItem('fa-inbox', 'Move to Analyzed', () => updateRfpStatus(analysis.id, 'analyzed'));
                        addDropdownItem('fa-archive', 'Archive', () => updateRfpStatus(analysis.id, 'archived'));
                    } else if (analysis.status === 'archived') {
                        addDropdownItem('fa-box-open', 'Unarchive (to Analyzed)', () => updateRfpStatus(analysis.id, 'analyzed'));
                        addDropdownItem('fa-check-circle', 'Move to Active', () => updateRfpStatus(analysis.id, 'active'));
                    } else { 
                        addDropdownItem('fa-check-circle', 'Move to Active', () => updateRfpStatus(analysis.id, 'active'));
                        addDropdownItem('fa-times-circle', 'Move to Not Pursuing', () => updateRfpStatus(analysis.id, 'not_pursuing'));
                        addDropdownItem('fa-archive', 'Archive', () => updateRfpStatus(analysis.id, 'archived'));
                    }
                    dropdownMenu.appendChild(document.createElement('div')).className = 'dropdown-divider';
                    addDropdownItem('fa-trash-alt', 'Delete RFP', () => deleteRfp(analysis.id, displayTitle));
                    dropdownContainer.appendChild(dropdownTrigger);
                    dropdownContainer.appendChild(dropdownMenu);
                    actionsSpan.appendChild(dropdownContainer);
                    savedAnalysesListDiv.appendChild(itemDiv);
                });
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
            rfpForm.addEventListener('submit', async function (event) {
                event.preventDefault();
                const rfpTitleValue = document.getElementById('rfpTitle').value.trim();
                const rfpTypeValue = document.getElementById('rfpType').value;
                const submittedByValue = document.getElementById('submittedBy').value;
                const mainRfpFile = rfpFileUpload.files[0];
                const addendumFiles = rfpAddendumUpload.files;
                if(modalAnalysisStatusArea) showLoadingMessage(modalAnalysisStatusArea, "Starting analysis...");
                if (modalAnalysisResultsArea) modalAnalysisResultsArea.style.display = 'none';
                if (!mainRfpFile) {
                    if(modalAnalysisStatusArea) showLoadingMessage(modalAnalysisStatusArea, "Please upload the main RFP document.", false);
                    if(modalAnalysisStatusArea) hideLoadingMessage(modalAnalysisStatusArea, 3000); return;
                }
                const rfpFileNameValue = mainRfpFile.name;
                if (mainRfpFile.type !== "application/pdf") {
                    if(modalAnalysisStatusArea) showLoadingMessage(modalAnalysisStatusArea, "Invalid main RFP file type. Please upload a PDF.", false);
                    if(modalAnalysisStatusArea) hideLoadingMessage(modalAnalysisStatusArea, 3000); return;
                }
                let combinedRfpText = "";
                let filesToProcess = [mainRfpFile];
                for (let i = 0; i < addendumFiles.length; i++) {
                    if (addendumFiles[i].type === "application/pdf") {
                        filesToProcess.push(addendumFiles[i]);
                    } else {
                        console.warn(`Skipping non-PDF addendum: '${addendumFiles[i].name}'.`);
                    }
                }
                try {
                    for (let i = 0; i < filesToProcess.length; i++) {
                        const file = filesToProcess[i];
                        if(modalAnalysisStatusArea) showLoadingMessage(modalAnalysisStatusArea, `Extracting text from ${file.name} (${i + 1}/${filesToProcess.length})...`);
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
                    if(modalAnalysisStatusArea) showLoadingMessage(modalAnalysisStatusArea, `PDF Error: ${error.message}`, false);
                    if(modalAnalysisStatusArea) hideLoadingMessage(modalAnalysisStatusArea, 5000); return;
                }

                if (!serverRfpPrompts) { 
                    if(modalAnalysisStatusArea) showLoadingMessage(modalAnalysisStatusArea, "Loading latest prompt settings...", true);
                    await fetchPromptsFromServer();
                    if (!serverRfpPrompts) {
                        if(modalAnalysisStatusArea) showLoadingMessage(modalAnalysisStatusArea, "Error: Could not load prompt settings for analysis. Aborting.", false);
                        if(modalAnalysisStatusArea) hideLoadingMessage(modalAnalysisStatusArea, 4000);
                        if (generateAnalysisButton) generateAnalysisButton.disabled = false;
                        return;
                    }
                }
                
                const aiPrompt = constructFullRfpAnalysisPrompt(combinedRfpText);
                console.log("Constructed AI Prompt for Submission (using server/default prompts):\n", aiPrompt);

                const currentAnalysisPrompts = {}; 
                Object.keys(PROMPT_CONFIG).forEach(keySuffix => {
                    currentAnalysisPrompts[keySuffix] = getStoredSectionPrompt(keySuffix); 
                });
                
                let parsedAISections = {};
                try {
                    if(modalAnalysisStatusArea) showLoadingMessage(modalAnalysisStatusArea, "AI is analyzing and generating content...");
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
                    if(modalAnalysisStatusArea) showLoadingMessage(modalAnalysisStatusArea, "RFP analysis complete! Saving results...", false);
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
                        if(modalAnalysisStatusArea) showLoadingMessage(modalAnalysisStatusArea, "Analysis complete and results saved!", false);
                        await loadSavedAnalysesInitial(); 
                    } catch (saveError) {
                        if(modalAnalysisStatusArea) showLoadingMessage(modalAnalysisStatusArea, `Analysis complete, but failed to save: ${saveError.message}`, false);
                    }
                } catch (error) {
                    if(modalAnalysisStatusArea) showLoadingMessage(modalAnalysisStatusArea, `Processing Error: ${error.message}`, false);
                } finally {
                    if(modalAnalysisStatusArea) hideLoadingMessage(modalAnalysisStatusArea, 7000);
                    if (generateAnalysisButton) generateAnalysisButton.disabled = false;
                }
            });
        }

        async function loadSavedAnalysesInitial() {
            if(rfpListStatusArea) showLoadingMessage(rfpListStatusArea, "Loading saved analyses...", true);
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
                if(rfpListStatusArea) hideLoadingMessage(rfpListStatusArea);
            }
        }
        
        const firstActiveViewTab = document.querySelector('#view-saved-rfp-details-section.modal-active .tabs-container .tab-link');
        if (firstActiveViewTab && viewSavedRfpDetailsSection && viewSavedRfpDetailsSection.classList.contains('modal-active')) {
            const tabNameToOpen = firstActiveViewTab.getAttribute('onclick').match(/'([^']*)'/)[1];
            const tabElement = document.getElementById(tabNameToOpen);
            if (window.openViewTab && tabElement && tabElement.style.display !== 'block') { 
                window.openViewTab(null, tabNameToOpen);
            }
        }

        async function initializeRfpPage() {
            await loadSavedAnalysesInitial(); 
            await fetchPromptsFromServer();   
            if (promptSectionSelector) {      
                loadSelectedSectionPromptToTextarea(); 
            }
        }

        initializeRfpPage(); 

        document.addEventListener('click', (e) => {
            const openDropdowns = document.querySelectorAll('.actions-dropdown-menu');
            let clickedInsideADropdownOrTrigger = false;
            const triggerElement = e.target.closest('.actions-dropdown-trigger');

            openDropdowns.forEach(menu => {
                if (menu.contains(e.target) || (triggerElement && menu.previousElementSibling === triggerElement) ) {
                    clickedInsideADropdownOrTrigger = true;
                }
            });
            if (!clickedInsideADropdownOrTrigger) {
                openDropdowns.forEach(menu => menu.style.display = 'none');
            }
        });

    } // End of initializeAppLogic function

}); // End of DOMContentLoaded
