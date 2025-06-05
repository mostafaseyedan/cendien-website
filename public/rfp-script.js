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
    const sessionDuration = 24 * 60 * 60 * 1000; 
    const loginTimestampKey = 'rfpAnalyzerLoginTimestamp';

    function isSessionValid() {
        const storedTimestamp = localStorage.getItem(loginTimestampKey);
        if (!storedTimestamp) return false;
        const lastLoginTime = parseInt(storedTimestamp, 10);
        if (isNaN(lastLoginTime)) {
            localStorage.removeItem(loginTimestampKey);
            return false;
        }
        return (Date.now() - lastLoginTime) < sessionDuration;
    }

    function handleSuccessfulLogin() {
        localStorage.setItem(loginTimestampKey, Date.now().toString());
        if (authModalOverlay) {
            authModalOverlay.classList.add('auth-modal-hidden');
            authModalOverlay.style.display = 'none';
        }
        if (pageContentWrapper) {
            pageContentWrapper.classList.remove('content-hidden');
            pageContentWrapper.style.display = '';
        }
        initializeAppLogic();
    }

    function showLoginError(message) {
        if (authErrorMessage) {
            authErrorMessage.textContent = message;
            authErrorMessage.style.display = 'block';
        }
        if (authPasswordInput) authPasswordInput.value = '';
        if (authUsernameInput) authUsernameInput.focus();
    }

    if (isSessionValid()) {
        handleSuccessfulLogin();
    } else {
        if (authModalOverlay) {
            authModalOverlay.classList.remove('auth-modal-hidden');
            authModalOverlay.style.display = 'flex';
        }
        if (pageContentWrapper) {
            pageContentWrapper.classList.add('content-hidden');
            pageContentWrapper.style.display = 'none';
        }
        if (authForm) {
            authForm.addEventListener('submit', (event) => {
                event.preventDefault();
                if (!authUsernameInput || !authPasswordInput) {
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
            if (document.body) document.body.innerHTML = "<div style='text-align:center; padding: 50px; font-family: sans-serif;'><h1>Configuration Error</h1><p>Login form not found. Page cannot load.</p></div>";
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

        // Map for tab content divs in the "New RFP" modal
        const modalTabContentMap = {
            summary: document.getElementById('modal-summary-result-content'),
            questions: document.getElementById('modal-questions-result-content'),
            deadlines: null, // Will point to a dynamically created div by clearTabContent
            submissionFormat: null, // Will point to a dynamically created div by clearTabContent
            requirements: document.getElementById('modal-requirements-result-content'),
            stakeholders: document.getElementById('modal-stakeholders-result-content'),
            risks: document.getElementById('modal-risks-result-content'),
            registration: document.getElementById('modal-registration-result-content'),
            licenses: document.getElementById('modal-licenses-result-content'),
            budget: document.getElementById('modal-budget-result-content')
        };
        // Parent div for the combined "Deadlines & Format" tab in the "New RFP" modal
        const modalDeadlinesTabContentDiv = document.getElementById('modal-deadlines-tab');

        const viewSavedRfpDetailsSection = document.getElementById('view-saved-rfp-details-section');
        const viewRfpMainTitleHeading = document.getElementById('view-rfp-main-title-heading');
        const closeViewRfpDetailsButton = document.getElementById('close-view-rfp-details-button');
        const viewRfpStatusArea = document.getElementById('view-rfp-status-area');
        const viewAnalysisResultsArea = document.getElementById('view-analysis-results-area');
        const viewRfpModalActionTrigger = document.getElementById('view-rfp-modal-action-trigger'); 
        const viewRfpModalActionsMenu = document.getElementById('view-rfp-modal-actions-menu'); 
        
        // Map for tab content divs in the "View Saved RFP Details" modal
        const viewTabContentMap = {
            summary: document.getElementById('view-summary-result-content'),
            questions: document.getElementById('view-questions-result-content'),
            deadlines: null, // Will point to a dynamically created div by clearTabContent
            submissionFormat: null, // Will point to a dynamically created div by clearTabContent
            requirements: document.getElementById('view-requirements-result-content'),
            stakeholders: document.getElementById('view-stakeholders-result-content'),
            risks: document.getElementById('view-risks-result-content'),
            registration: document.getElementById('view-registration-result-content'),
            licenses: document.getElementById('view-licenses-result-content'),
            budget: document.getElementById('view-budget-result-content')
        };
        // Parent div for the combined "Deadlines & Format" tab in the "View Saved RFP Details" modal
        const viewDeadlinesTabContentDiv = document.getElementById('view-deadlines-result-content'); // Note: This is the inner div


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
        let currentlyViewedRfpAnalysis = null; 
        let originalRfpTextForReanalysis = ""; 

        const RFP_PROMPT_MAIN_INSTRUCTION = "Please analyze the following Request for Proposal (RFP) text.\nProvide the following distinct sections in your response, each clearly delimited:";
        const RFP_PROMPT_SECTION_DELIMITER_FORMAT = "\n\n###{SECTION_KEY_UPPER}_START###\n[Content for {SECTION_KEY_UPPER}]\n###{SECTION_KEY_UPPER}_END###";
        const RFP_PROMPT_TEXT_SUFFIX = "\n\nRFP Text (including any addendums):\n---\n{RFP_TEXT_PLACEHOLDER}\n---";

        const PROMPT_CONFIG = {
            summary: {
                defaultText: "You will be provided with the content of the RFP. Follow these guidelines to create a summary: Focus on extracting and condensing key information from the RFP. Ensure the summary captures all essential aspects, including: Project objectives, Scope of work, Requirements and specifications, Evaluation criteria,  Submission guidelines, Deadlines. Maintain a balance between conciseness and comprehensiveness. The summary should be no more 2 pages in length.",
                delimiterKey: "SUMMARY",
                databaseKey: "rfpSummary",
                title: "RFP Summary"
            },
            questions: { 
                defaultText: "Generate a list of 20 critical and insightful clarification questions to ask regarding an RFP. These questions should be designed to uncover hidden requirements, ambiguous statements, or areas where more detail is needed to create a comprehensive and competitive proposal. The goal is to ensure a thorough understanding of the client's needs and expectations.",
                delimiterKey: "QUESTIONS",
                databaseKey: "generatedQuestions",
                title: "Generated Clarification Questions"
            },
            deadlines: {
                defaultText: "You are an expert in analyzing Request for Proposal (RFP) documents. Your task is to identify key deadlines and the submission format for the RFP. Follow these steps to extract the required information: 1. Carefully read the entire RFP document. 2. Identify all key deadlines, including dates and times for each deadline. 3. Identify the required submission format for the RFP (e.g., electronic submission, hard copy submission, online portal submission). 4. Output the information in a well-organized list with clear labels for each deadline and the submission format.",
                delimiterKey: "DEADLINES", 
                databaseKey: "rfpDeadlines",
                title: "Key Deadlines"
            },
            submissionFormat: { 
                defaultText: "Carefully review the RFP document to identify the specified submission format for the proposal (e.g., mail, email, online portal, usb, fax). Identify all people related to the RFP. 3. Extract all relevant contact information, including: Addresses for mail submissions. Email addresses for electronic submissions. Links to online portals or websites for online submissions. Phone numbers for contact persons. Names and titles of contact persons. 4. Present the extracted information in a clear and organized manner.",
                delimiterKey: "SUBMISSION_FORMAT", 
                databaseKey: "rfpSubmissionFormat",
                title: "Submission Format"
            },
            requirements: { 
                defaultText: "5. A list of Requirements (e.g., mandatory, highly desirable).", 
                delimiterKey: "REQUIREMENTS",
                databaseKey: "rfpKeyRequirements",
                title: "Requirements"
            },
            stakeholders: { 
                defaultText: "6. Mentioned Stakeholders or Key Contacts.", 
                delimiterKey: "STAKEHOLDERS",
                databaseKey: "rfpStakeholders",
                title: "Mentioned Stakeholders"
            },
            risks: { 
                defaultText: "7. Potential Risks or Red Flags identified in the RFP.", 
                delimiterKey: "RISKS",
                databaseKey: "rfpRisks",
                title: "Potential Risks/Red Flags" 
            },
            registration: { 
                defaultText: "8. Registration requirements or details for bidders.", 
                delimiterKey: "REGISTRATION",
                databaseKey: "rfpRegistration",
                title: "Registration Details"
            },
            licenses: { 
                defaultText: "9. Required Licenses or Certifications for bidders.", 
                delimiterKey: "LICENSES",
                databaseKey: "rfpLicenses",
                title: "Licenses & Certifications"
            },
            budget: { 
                defaultText: "10. Any mentioned Budget constraints or financial information.", 
                delimiterKey: "BUDGET",
                databaseKey: "rfpBudget",
                title: "Budget Information"
            }
        };

        if (yearSpanRFP && !yearSpanRFP.textContent) {
            yearSpanRFP.textContent = new Date().getFullYear();
        }

        async function fetchPromptsFromServer() {
            if (promptsLastFetchedFromServer && serverRfpPrompts) {
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
                Object.keys(PROMPT_CONFIG).forEach(key => {
                    if (!serverRfpPrompts.hasOwnProperty(key)) {
                        console.warn(`RFP Prompt for '${key}' not found on server, using local default.`);
                        serverRfpPrompts[key] = PROMPT_CONFIG[key].defaultText;
                    }
                });
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
        
        function getStoredSectionPrompt(sectionKeySuffix, analysisPrompts) {
            if (analysisPrompts && analysisPrompts[sectionKeySuffix]) {
                return analysisPrompts[sectionKeySuffix];
            }
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
                        fetchPromptsFromServer().then(() => { 
                            rfpIndividualPromptTextarea.value = getStoredSectionPrompt(selectedKeySuffix, null); 
                        });
                    } else {
                        rfpIndividualPromptTextarea.value = getStoredSectionPrompt(selectedKeySuffix, null); 
                    }
                }
            }
        }

        async function saveCurrentSectionPrompt() { 
            if (promptSectionSelector && rfpIndividualPromptTextarea && promptSaveStatus) {
                const selectedKeySuffix = promptSectionSelector.value;
                const userPrompt = rfpIndividualPromptTextarea.value.trim();

                if (!serverRfpPrompts) await fetchPromptsFromServer(); 
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
                if (!serverRfpPrompts) await fetchPromptsFromServer(); 
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

        function constructFullRfpAnalysisPrompt(rfpText, analysisPrompts = null) {
            let fullPrompt = RFP_PROMPT_MAIN_INSTRUCTION;
            Object.keys(PROMPT_CONFIG).forEach(keySuffix => {
                const sectionInstruction = getStoredSectionPrompt(keySuffix, analysisPrompts); 
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
                    currentlyViewedRfpAnalysis = null; 
                    originalRfpTextForReanalysis = ""; 
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
        
        // Updated clearTabContent to prepare distinct containers for deadlines and submissionFormat
        function clearTabContent(tabContentMap, isModalView) {
            Object.keys(tabContentMap).forEach(key => {
                const div = tabContentMap[key];
                if (div && (key !== 'deadlines' && key !== 'submissionFormat')) { // Clear normal tabs
                    div.innerHTML = '';
                }
            });
        
            // Get the parent div for the combined "Deadlines & Format" tab
            const combinedTabParentDiv = isModalView ? modalDeadlinesTabContentDiv : viewDeadlinesTabContentDiv; 
        
            if (combinedTabParentDiv) {
                const deadlinesSectionContainerId = `deadlines-section-container${isModalView ? '-modal' : '-view'}`;
                const submissionFormatSectionContainerId = `submissionFormat-section-container${isModalView ? '-modal' : '-view'}`;
        
                // Set the innerHTML for the combined tab, creating placeholders for each section
                combinedTabParentDiv.innerHTML = `
                    <div id="${deadlinesSectionContainerId}">
                        <!-- Content for Deadlines will be injected here by formatAndDisplayContentWithPrompt -->
                    </div>
                    <hr class="section-divider">
                    <div id="${submissionFormatSectionContainerId}">
                        <!-- Content for Submission Format will be injected here by formatAndDisplayContentWithPrompt -->
                    </div>`;
                
                // Update the map to point to these new containers
                tabContentMap.deadlines = document.getElementById(deadlinesSectionContainerId);
                tabContentMap.submissionFormat = document.getElementById(submissionFormatSectionContainerId);
            } else {
                console.warn(`Parent div for combined deadlines/format tab not found for ${isModalView ? 'modal' : 'view'}.`);
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
            if (areaElement && areaElement.classList.contains('reanalyze-status-area')) { 
                areaElement.style.display = 'flex';
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
                 if (areaElement && areaElement.classList.contains('reanalyze-status-area')) {
                    areaElement.style.display = 'none';
                    areaElement.innerHTML = '';
                }
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
        
        function formatAndDisplayContentWithPrompt(parentElement, sectionKeySuffix, sectionPromptText, sectionContentText, rfpId, isViewModal = false) {
            if (!parentElement) {
                console.warn("formatAndDisplayContentWithPrompt: parentElement is null for sectionKeySuffix:", sectionKeySuffix);
                return;
            }
            parentElement.innerHTML = ''; 
        
            const promptTitle = PROMPT_CONFIG[sectionKeySuffix]?.title || sectionKeySuffix.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
        
            const promptEditorContainer = document.createElement('div');
            promptEditorContainer.className = 'prompt-editor-container';
            promptEditorContainer.id = `prompt-editor-container-${sectionKeySuffix}${isViewModal ? '-view' : '-modal'}`;
        
            const promptLabel = document.createElement('label');
            promptLabel.htmlFor = `prompt-edit-${sectionKeySuffix}${isViewModal ? '-view' : ''}`;
            promptLabel.textContent = `Prompt for ${promptTitle}:`;
            promptEditorContainer.appendChild(promptLabel);
        
            const promptTextarea = document.createElement('textarea');
            promptTextarea.id = `prompt-edit-${sectionKeySuffix}${isViewModal ? '-view' : ''}`;
            promptTextarea.className = 'prompt-edit-textarea';
            // For view modal, use the prompt stored with the analysis, or fallback
            const actualPromptForTextarea = isViewModal 
                ? getStoredSectionPrompt(sectionKeySuffix, currentlyViewedRfpAnalysis?.analysisPrompts)
                : getStoredSectionPrompt(sectionKeySuffix, null); // For new modal, use global/default
            promptTextarea.value = actualPromptForTextarea;
            promptEditorContainer.appendChild(promptTextarea);
        
            const reanalyzeButton = document.createElement('button');
            reanalyzeButton.className = 'reanalyze-section-button btn btn-sm btn-info'; 
            reanalyzeButton.dataset.sectionKey = sectionKeySuffix;
            reanalyzeButton.dataset.rfpId = rfpId;
            reanalyzeButton.textContent = "Re-Analyze"; // UPDATED BUTTON TEXT
            reanalyzeButton.addEventListener('click', handleReanalyzeSection);
            promptEditorContainer.appendChild(reanalyzeButton);

            const reanalyzeStatusArea = document.createElement('div');
            reanalyzeStatusArea.id = `reanalyze-status-${sectionKeySuffix}${isViewModal ? '-view' : ''}`;
            reanalyzeStatusArea.className = 'loading-container reanalyze-status-area';
            reanalyzeStatusArea.style.display = 'none';
            promptEditorContainer.appendChild(reanalyzeStatusArea);
        
            parentElement.appendChild(promptEditorContainer);
        
            const contentDisplayContainer = document.createElement('div');
            contentDisplayContainer.className = 'section-content-display';
            contentDisplayContainer.id = `section-content-display-${sectionKeySuffix}${isViewModal ? '-view' : ''}`;
        
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
                            contentDisplayContainer.appendChild(currentList);
                        }
                        const listItem = document.createElement('li');
                        listItem.innerHTML = formattedLine.substring(listMatch[0].length);
                        currentList.appendChild(listItem);
                    } else {
                        currentList = null;
                        const p = document.createElement('p');
                        p.innerHTML = formattedLine;
                        contentDisplayContainer.appendChild(p);
                    }
                } else {
                    currentList = null;
                }
            });
            parentElement.appendChild(contentDisplayContainer);
        
            const saveSectionButton = document.createElement('button');
            saveSectionButton.className = 'save-section-button btn btn-sm btn-success';
            saveSectionButton.dataset.sectionKey = sectionKeySuffix;
            saveSectionButton.dataset.rfpId = rfpId;
            saveSectionButton.textContent = `Save Changes to ${promptTitle}`;
            saveSectionButton.style.display = 'none'; 
            saveSectionButton.style.marginTop = '10px';
            saveSectionButton.addEventListener('click', handleSaveSectionChanges);
            parentElement.appendChild(saveSectionButton);
        }


        async function handleReanalyzeSection(event) {
            const button = event.currentTarget;
            const sectionKey = button.dataset.sectionKey;
            const rfpId = button.dataset.rfpId; 
        
            if (!sectionKey || !rfpId || !currentlyViewedRfpAnalysis || !originalRfpTextForReanalysis) {
                console.error("Missing data for re-analysis:", { sectionKey, rfpId, currentlyViewedRfpAnalysisExists: !!currentlyViewedRfpAnalysis, originalRfpTextExists: !!originalRfpTextForReanalysis });
                alert("Error: Could not re-analyze section due to missing data. Ensure RFP text is loaded.");
                return;
            }
        
            const isViewModalActive = viewSavedRfpDetailsSection.style.display === 'block' || viewSavedRfpDetailsSection.classList.contains('modal-active');
            const promptTextareaId = `prompt-edit-${sectionKey}${isViewModalActive ? '-view' : '-modal'}`;
            const promptTextarea = document.getElementById(promptTextareaId);
            const newSectionPrompt = promptTextarea ? promptTextarea.value : null;
        
            if (!newSectionPrompt) {
                alert("Prompt for the section cannot be empty.");
                return;
            }
        
            const statusAreaId = `reanalyze-status-${sectionKey}${isViewModalActive ? '-view' : '-modal'}`;
            const statusArea = document.getElementById(statusAreaId);
            if (statusArea) showLoadingMessage(statusArea, `Re-analyzing ${PROMPT_CONFIG[sectionKey]?.title || sectionKey}...`);
            button.disabled = true;
        
            const targetedAiPrompt = `
You are an expert RFP analyzer. You will be given the full text of an RFP and a specific instruction for one section.
Your task is to regenerate ONLY the content for the section: "${PROMPT_CONFIG[sectionKey]?.title || sectionKey}".
Use the following specific prompt for this section: "${newSectionPrompt}"
The full RFP text is provided below for context.
Ensure your output for this section is wrapped ONLY with the delimiters: ###${PROMPT_CONFIG[sectionKey].delimiterKey}_START### and ###${PROMPT_CONFIG[sectionKey].delimiterKey}_END###. Do not include any other text or delimiters.

Full RFP Text:
---
${originalRfpTextForReanalysis}
---
            `;
        
            try {
                const response = await fetch('/api/generate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ prompt: targetedAiPrompt })
                });
        
                if (!response.ok) {
                    const errorResult = await response.json().catch(() => ({ error: "Failed to parse error from AI service."}));
                    throw new Error(errorResult.error || `AI service error: ${response.status}`);
                }
        
                const data = await response.json();
                let rawAiOutput = data.generatedText.replace(/^```[a-z]*\s*/im, '').replace(/\s*```$/m, '');
                
                const delimiter = PROMPT_CONFIG[sectionKey].delimiterKey;
                const sectionRegex = new RegExp(`###${delimiter}_START###([\\s\\S]*?)###${delimiter}_END###`);
                const match = rawAiOutput.match(sectionRegex);
                const newSectionContent = match && match[1] ? match[1].trim() : `Failed to extract ${delimiter} section. AI Raw: ${rawAiOutput.substring(0,200)}`;
        
                const contentDisplayId = `section-content-display-${sectionKey}${isViewModalActive ? '-view' : '-modal'}`;
                const contentDisplayDiv = document.getElementById(contentDisplayId);
                if (contentDisplayDiv) {
                    const lines = (newSectionContent || "N/A").split('\n');
                    let currentList = null;
                    contentDisplayDiv.innerHTML = ''; 
                    lines.forEach(line => {
                        const trimmedLine = line.trim();
                        if (trimmedLine) {
                            let formattedLine = trimmedLine.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
                            const isQuestionsList = sectionKey === 'questions';
                            const listMatch = formattedLine.match(/^(\*|-|\d+\.)\s+/);
                            if (listMatch) {
                                if (!currentList) {
                                    currentList = isQuestionsList ? document.createElement('ol') : document.createElement('ul');
                                    if (isQuestionsList) currentList.className = 'numbered-list';
                                    contentDisplayDiv.appendChild(currentList);
                                }
                                const listItem = document.createElement('li');
                                listItem.innerHTML = formattedLine.substring(listMatch[0].length);
                                currentList.appendChild(listItem);
                            } else {
                                currentList = null;
                                const p = document.createElement('p');
                                p.innerHTML = formattedLine;
                                contentDisplayDiv.appendChild(p);
                            }
                        } else {
                            currentList = null;
                        }
                    });
                }
        
                if (currentlyViewedRfpAnalysis) {
                    const dbKey = PROMPT_CONFIG[sectionKey].databaseKey;
                    if (dbKey) {
                        currentlyViewedRfpAnalysis[dbKey] = newSectionContent;
                    }
                    if (!currentlyViewedRfpAnalysis.analysisPrompts) {
                        currentlyViewedRfpAnalysis.analysisPrompts = {};
                    }
                    currentlyViewedRfpAnalysis.analysisPrompts[sectionKey] = newSectionPrompt; 
                }
        
                if (statusArea) showLoadingMessage(statusArea, "Section re-analyzed!", false);
                const parentElementForSaveButton = document.getElementById(`prompt-editor-container-${sectionKey}${isViewModalActive ? '-view' : '-modal'}`)?.parentElement;
                const saveButton = parentElementForSaveButton?.querySelector(`.save-section-button[data-section-key="${sectionKey}"]`);

                if(saveButton) saveButton.style.display = 'inline-block';


            } catch (error) {
                console.error("Error re-analyzing section:", error);
                if (statusArea) showLoadingMessage(statusArea, `Error: ${error.message}`, false);
            } finally {
                if (statusArea) hideLoadingMessage(statusArea, 3000);
                button.disabled = false;
            }
        }

        async function handleSaveSectionChanges(event) {
            const button = event.currentTarget;
            const sectionKey = button.dataset.sectionKey;
            const rfpId = button.dataset.rfpId;
            const isViewModalActive = viewSavedRfpDetailsSection.style.display === 'block' || viewSavedRfpDetailsSection.classList.contains('modal-active');
        
            if (!sectionKey || !rfpId || !currentlyViewedRfpAnalysis) {
                alert("Cannot save: Missing information.");
                return;
            }
        
            const promptTextareaId = `prompt-edit-${sectionKey}${isViewModalActive ? '-view' : ''}`;
            const promptTextarea = document.getElementById(promptTextareaId);
            const newPromptForSection = promptTextarea ? promptTextarea.value : null;
        
            // Get content from the display div. For simplicity, using innerText.
            // If rich HTML content needs to be preserved, this needs adjustment (e.g., storing innerHTML or parsing).
            const contentDisplayId = `section-content-display-${sectionKey}${isViewModalActive ? '-view' : ''}`;
            const contentDisplayDiv = document.getElementById(contentDisplayId);
            const newContentForSection = contentDisplayDiv ? contentDisplayDiv.innerText.trim() : null; 
        
            if (newPromptForSection === null || newContentForSection === null) {
                alert("Cannot save: Content or prompt missing.");
                return;
            }
        
            const statusAreaId = `reanalyze-status-${sectionKey}${isViewModalActive ? '-view' : ''}`;
            const statusArea = document.getElementById(statusAreaId);
        
            if (statusArea) showLoadingMessage(statusArea, `Saving changes for ${PROMPT_CONFIG[sectionKey]?.title || sectionKey}...`);
            button.disabled = true;
        
            try {
                const payload = {
                    analysisPrompts: {
                        ...(currentlyViewedRfpAnalysis.analysisPrompts || {}), 
                        [sectionKey]: newPromptForSection 
                    }
                };
                const dbKey = PROMPT_CONFIG[sectionKey].databaseKey;
                if (dbKey) {
                    payload[dbKey] = newContentForSection;
                } else {
                    throw new Error(`Database key for section ${sectionKey} is not defined in PROMPT_CONFIG.`);
                }
        
                const response = await fetch(`/api/rfp-analysis/${rfpId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
        
                if (!response.ok) {
                    const errorResult = await response.json().catch(() => ({ error: "Failed to save section changes." }));
                    throw new Error(errorResult.error || `Server error: ${response.status}`);
                }
        
                const result = await response.json();
                if (statusArea) showLoadingMessage(statusArea, result.message || "Section changes saved!", false);
                
                const rfpInList = allFetchedAnalyses.find(a => a.id === rfpId);
                if (rfpInList) {
                    if (dbKey) rfpInList[dbKey] = newContentForSection;
                    rfpInList.analysisPrompts = payload.analysisPrompts;
                    rfpInList.lastModified = result.lastModified || new Date().toISOString(); 
                }
                if(currentlyViewedRfpAnalysis && currentlyViewedRfpAnalysis.id === rfpId){
                     if (dbKey) currentlyViewedRfpAnalysis[dbKey] = newContentForSection;
                    currentlyViewedRfpAnalysis.analysisPrompts = payload.analysisPrompts;
                    currentlyViewedRfpAnalysis.lastModified = result.lastModified || new Date().toISOString();
                }
                button.style.display = 'none'; 
        
            } catch (error) {
                console.error("Error saving section changes:", error);
                if (statusArea) showLoadingMessage(statusArea, `Save error: ${error.message}`, false);
            } finally {
                if (statusArea) hideLoadingMessage(statusArea, 4000);
                button.disabled = false;
            }
        }
        

        async function updateRfpStatus(rfpId, newStatus) {
            const rfpToUpdate = allFetchedAnalyses.find(a => a.id === rfpId) || currentlyViewedRfpAnalysis;
            const rfpTitleForMessage = rfpToUpdate ? (rfpToUpdate.rfpTitle || rfpToUpdate.rfpFileName || 'this RFP') : 'this RFP';
            const statusArea = viewSavedRfpDetailsSection.style.display === 'block' ? viewRfpStatusArea : rfpListStatusArea;

            if(statusArea) showLoadingMessage(statusArea, `Updating "${rfpTitleForMessage}" to ${newStatus}...`);
            try {
                const response = await fetch(`/api/rfp-analysis/${rfpId}/status`, {
                    method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: newStatus }),
                });
                if (!response.ok) throw new Error((await response.json()).error || 'Failed to update status.');
                const result = await response.json(); 
                
                const listItemInAllFetched = allFetchedAnalyses.find(a => a.id === rfpId);
                if (listItemInAllFetched) listItemInAllFetched.status = result.newStatus || newStatus;
                
                if (currentlyViewedRfpAnalysis && currentlyViewedRfpAnalysis.id === rfpId) {
                    currentlyViewedRfpAnalysis.status = result.newStatus || newStatus;
                    populateViewModalRfpActions(currentlyViewedRfpAnalysis); 
                }
                renderAnalysesList();
                if(statusArea) showLoadingMessage(statusArea, `"${rfpTitleForMessage}" status updated to ${result.newStatus || newStatus}!`, false);
            } catch (error) { 
                if(statusArea) showLoadingMessage(statusArea, `Error updating status: ${error.message}`, false);
            } finally { 
                if(statusArea) hideLoadingMessage(statusArea, 3000); 
            }
        }

        async function deleteRfp(rfpId, rfpTitleForConfirm) {
            if (!window.confirm(`Are you sure you want to delete RFP: "${rfpTitleForConfirm}"? This action cannot be undone.`)) return;
            const statusArea = viewSavedRfpDetailsSection.style.display === 'block' ? viewRfpStatusArea : rfpListStatusArea;

            if(statusArea) showLoadingMessage(statusArea, `Deleting "${rfpTitleForConfirm}"...`);
            try {
                const response = await fetch(`/api/rfp-analysis/${rfpId}`, { method: 'DELETE' });
                if (!response.ok) throw new Error((await response.json()).error || `Failed to delete ${rfpTitleForConfirm}.`);
                allFetchedAnalyses = allFetchedAnalyses.filter(a => a.id !== rfpId);
                renderAnalysesList();
                if (viewSavedRfpDetailsSection && viewSavedRfpDetailsSection.classList.contains('modal-active') && 
                    currentlyViewedRfpAnalysis && currentlyViewedRfpAnalysis.id === rfpId) {
                    closeModal(viewSavedRfpDetailsSection);
                }
                if(statusArea) showLoadingMessage(statusArea, `"${rfpTitleForConfirm}" deleted successfully!`, false);
            } catch (error) { 
                if(statusArea) showLoadingMessage(statusArea, `Error deleting: ${error.message}`, false);
            } finally { 
                if(statusArea) hideLoadingMessage(statusArea, 3000); 
            }
        }

        async function openEditRfpModal(analysisFullDetails) {
            if (!editRfpModal || !editRfpForm) return;
            let analysis = analysisFullDetails;
            
            const requiredDbKeys = Object.values(PROMPT_CONFIG).map(config => config.databaseKey);
            let needsFetch = false;
            for (const dbKey of requiredDbKeys) {
                if (PROMPT_CONFIG[Object.keys(PROMPT_CONFIG).find(key => PROMPT_CONFIG[key].databaseKey === dbKey)]) { 
                    if (!analysis.hasOwnProperty(dbKey)) {
                        needsFetch = true;
                        break;
                    }
                }
            }


            if (needsFetch) { 
                if(editRfpStatusArea) showLoadingMessage(editRfpStatusArea, 'Loading full RFP details for editing...');
                try {
                    const response = await fetch(`/api/rfp-analysis/${analysisFullDetails.id}`);
                    if (!response.ok) throw new Error((await response.json()).error || 'Failed to fetch full RFP details for editing.');
                    analysis = await response.json();
                } catch (error) {
                    console.error("Error fetching full RFP details for editing:", error);
                    if(editRfpStatusArea) showLoadingMessage(editRfpStatusArea, `Error: ${error.message}`, false);
                    if(editRfpStatusArea) hideLoadingMessage(editRfpStatusArea, 3000);
                    return;
                } finally {
                     if (editRfpStatusArea && editRfpStatusArea.innerHTML.includes('Loading full RFP details for editing...')) {
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
            
            closeModal(viewSavedRfpDetailsSection); 
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
                    // Note: analysisPrompts are updated via handleSaveSectionChanges if re-analysis occurred
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

        function addDropdownItemToMenu(menuElement, iconClass, text, clickHandler) {
            const item = document.createElement('button');
            item.className = 'dropdown-item';
            item.innerHTML = `<i class="fas ${iconClass}"></i> ${text}`;
            item.addEventListener('click', (e) => {
                e.stopPropagation();
                clickHandler();
                menuElement.style.display = 'none'; 
            });
            menuElement.appendChild(item);
        }
        
        function populateViewModalRfpActions(analysis) {
            if (!viewRfpModalActionsMenu || !analysis) return;
            viewRfpModalActionsMenu.innerHTML = ''; 
            const displayTitle = analysis.rfpTitle || analysis.rfpFileName || 'N/A';

            addDropdownItemToMenu(viewRfpModalActionsMenu, 'fa-edit', 'Edit Details', () => openEditRfpModal(analysis));
            viewRfpModalActionsMenu.appendChild(document.createElement('div')).className = 'dropdown-divider';

            if (analysis.status === 'analyzed') {
                addDropdownItemToMenu(viewRfpModalActionsMenu, 'fa-check-circle', 'Move to Active', () => updateRfpStatus(analysis.id, 'active'));
                addDropdownItemToMenu(viewRfpModalActionsMenu, 'fa-times-circle', 'Move to Not Pursuing', () => updateRfpStatus(analysis.id, 'not_pursuing'));
                addDropdownItemToMenu(viewRfpModalActionsMenu, 'fa-archive', 'Archive', () => updateRfpStatus(analysis.id, 'archived'));
            } else if (analysis.status === 'active') {
                addDropdownItemToMenu(viewRfpModalActionsMenu, 'fa-times-circle', 'Move to Not Pursuing', () => updateRfpStatus(analysis.id, 'not_pursuing'));
                addDropdownItemToMenu(viewRfpModalActionsMenu, 'fa-inbox', 'Move to Analyzed', () => updateRfpStatus(analysis.id, 'analyzed'));
                addDropdownItemToMenu(viewRfpModalActionsMenu, 'fa-archive', 'Archive', () => updateRfpStatus(analysis.id, 'archived'));
            } else if (analysis.status === 'not_pursuing') {
                addDropdownItemToMenu(viewRfpModalActionsMenu, 'fa-check-circle', 'Move to Active', () => updateRfpStatus(analysis.id, 'active'));
                addDropdownItemToMenu(viewRfpModalActionsMenu, 'fa-inbox', 'Move to Analyzed', () => updateRfpStatus(analysis.id, 'analyzed'));
                addDropdownItemToMenu(viewRfpModalActionsMenu, 'fa-archive', 'Archive', () => updateRfpStatus(analysis.id, 'archived'));
            } else if (analysis.status === 'archived') {
                addDropdownItemToMenu(viewRfpModalActionsMenu, 'fa-box-open', 'Unarchive (to Analyzed)', () => updateRfpStatus(analysis.id, 'analyzed'));
                addDropdownItemToMenu(viewRfpModalActionsMenu, 'fa-check-circle', 'Move to Active', () => updateRfpStatus(analysis.id, 'active'));
            } else { 
                addDropdownItemToMenu(viewRfpModalActionsMenu, 'fa-check-circle', 'Move to Active', () => updateRfpStatus(analysis.id, 'active'));
                addDropdownItemToMenu(viewRfpModalActionsMenu, 'fa-times-circle', 'Move to Not Pursuing', () => updateRfpStatus(analysis.id, 'not_pursuing'));
                addDropdownItemToMenu(viewRfpModalActionsMenu, 'fa-archive', 'Archive', () => updateRfpStatus(analysis.id, 'archived'));
            }
            viewRfpModalActionsMenu.appendChild(document.createElement('div')).className = 'dropdown-divider';
            addDropdownItemToMenu(viewRfpModalActionsMenu, 'fa-trash-alt', 'Delete RFP', () => deleteRfp(analysis.id, displayTitle));
        }

        if (viewRfpModalActionTrigger) {
            viewRfpModalActionTrigger.addEventListener('click', (e) => {
                e.stopPropagation();
                if (viewRfpModalActionsMenu) {
                    if (currentlyViewedRfpAnalysis) { 
                        populateViewModalRfpActions(currentlyViewedRfpAnalysis); 
                    }
                    viewRfpModalActionsMenu.style.display = viewRfpModalActionsMenu.style.display === 'block' ? 'none' : 'block';
                }
            });
        }

        function renderAnalysesList() {
            if (!savedAnalysesListDiv || !noSavedAnalysesP) return;
            savedAnalysesListDiv.innerHTML = '';
            let filteredAnalyses = [...allFetchedAnalyses];

            if (currentStatusFilter !== 'all_statuses') {
                filteredAnalyses = filteredAnalyses.filter(a => a.status === currentStatusFilter);
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
                noSavedAnalysesP.textContent = currentStatusFilter === 'all_statuses' ? 
                    `No analyses found.` : `No analyses found for "${currentStatusFilter}" category.`;
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
                            formattedDateTime = `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
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
                        originalRfpTextForReanalysis = ""; 
                        currentlyViewedRfpAnalysis = allFetchedAnalyses.find(item => item.id === analysisId); 
                         if (!currentlyViewedRfpAnalysis) {
                            console.error("Could not find RFP item in local cache for ID:", analysisId);
                            return;
                        }

                        const rfpItemDiv = e.currentTarget.closest('.analyzed-rfp-item');
                        const titleElement = rfpItemDiv ? rfpItemDiv.querySelector('.rfp-col-title') : null;
                        const loadingMessageTitle = titleElement ? titleElement.textContent : 'Selected RFP';
                        
                        openModal(viewSavedRfpDetailsSection);
                        if (viewSavedRfpDetailsSection) viewSavedRfpDetailsSection.dataset.currentViewingId = analysisId;
                        if (viewRfpMainTitleHeading) viewRfpMainTitleHeading.textContent = `Details for: ${loadingMessageTitle}`;
                        if(viewRfpStatusArea) showLoadingMessage(viewRfpStatusArea, `Loading analysis for ${loadingMessageTitle}...`);
                        if (viewAnalysisResultsArea) viewAnalysisResultsArea.style.display = 'none';
                        clearViewAnalysisResultTabs(); 
                        populateViewModalRfpActions(currentlyViewedRfpAnalysis); 

                        let loadErrorOccurred = false;
                        try {
                            const detailResponse = await fetch(`/api/rfp-analysis/${analysisId}`);
                            if (!detailResponse.ok) throw new Error((await detailResponse.json()).error || 'Failed to fetch details.');
                            const detailedAnalysis = await detailResponse.json();
                            currentlyViewedRfpAnalysis = detailedAnalysis; 
                            originalRfpTextForReanalysis = detailedAnalysis.originalRfpFullText || ""; 
                             if (!originalRfpTextForReanalysis && detailedAnalysis.rfpFileName) {
                                console.warn("Original RFP full text not found in detailed analysis. Re-analysis might be limited or require re-upload mock.");
                            }

                            populateViewModalRfpActions(currentlyViewedRfpAnalysis); 

                            const savedPrompts = detailedAnalysis.analysisPrompts || {};
                            Object.keys(PROMPT_CONFIG).forEach(keySuffix => {
                                const parentElementForSection = viewTabContentMap[keySuffix];
                                const dbKey = PROMPT_CONFIG[keySuffix].databaseKey;
                                const sectionContent = detailedAnalysis[dbKey] || "N/A";
                                const promptTextForThisAnalysis = getStoredSectionPrompt(keySuffix, savedPrompts);

                                if (parentElementForSection) {
                                     formatAndDisplayContentWithPrompt(parentElementForSection, keySuffix, promptTextForThisAnalysis, sectionContent, analysisId, true);
                                } else {
                                    console.warn(`View tab content div for RFP key "${keySuffix}" (mapped to DB key ${dbKey}) not found.`);
                                }
                            });


                            if (viewAnalysisResultsArea) viewAnalysisResultsArea.style.display = 'block';
                            const firstViewTabLink = document.querySelector('#view-saved-rfp-details-section.modal-active .tabs-container .tab-link');
                            if (firstViewTabLink) {
                                document.querySelectorAll('#view-saved-rfp-details-section.modal-active .tabs-container .tab-link').forEach(tl => tl.classList.remove('active'));
                                firstViewTabLink.classList.add('active');
                                const tabNameMatch = firstViewTabLink.getAttribute('onclick').match(/'(view-[^']+-tab)'/);
                                if (tabNameMatch && tabNameMatch[1] && window.openViewTab) {
                                    window.openViewTab(null, tabNameMatch[1]); 
                                }
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
                    addDropdownItemToMenu(dropdownMenu, 'fa-edit', 'Edit Details', () => openEditRfpModal(analysis));
                    dropdownMenu.appendChild(document.createElement('div')).className = 'dropdown-divider';
                    if (analysis.status === 'analyzed') {
                        addDropdownItemToMenu(dropdownMenu, 'fa-check-circle', 'Move to Active', () => updateRfpStatus(analysis.id, 'active'));
                        addDropdownItemToMenu(dropdownMenu, 'fa-times-circle', 'Move to Not Pursuing', () => updateRfpStatus(analysis.id, 'not_pursuing'));
                        addDropdownItemToMenu(dropdownMenu, 'fa-archive', 'Archive', () => updateRfpStatus(analysis.id, 'archived'));
                    } else if (analysis.status === 'active') {
                        addDropdownItemToMenu(dropdownMenu, 'fa-times-circle', 'Move to Not Pursuing', () => updateRfpStatus(analysis.id, 'not_pursuing'));
                        addDropdownItemToMenu(dropdownMenu, 'fa-inbox', 'Move to Analyzed', () => updateRfpStatus(analysis.id, 'analyzed'));
                        addDropdownItemToMenu(dropdownMenu, 'fa-archive', 'Archive', () => updateRfpStatus(analysis.id, 'archived'));
                    } else if (analysis.status === 'not_pursuing') {
                        addDropdownItemToMenu(dropdownMenu, 'fa-check-circle', 'Move to Active', () => updateRfpStatus(analysis.id, 'active'));
                        addDropdownItemToMenu(dropdownMenu, 'fa-inbox', 'Move to Analyzed', () => updateRfpStatus(analysis.id, 'analyzed'));
                        addDropdownItemToMenu(dropdownMenu, 'fa-archive', 'Archive', () => updateRfpStatus(analysis.id, 'archived'));
                    } else if (analysis.status === 'archived') {
                        addDropdownItemToMenu(dropdownMenu, 'fa-box-open', 'Unarchive (to Analyzed)', () => updateRfpStatus(analysis.id, 'analyzed'));
                        addDropdownItemToMenu(dropdownMenu, 'fa-check-circle', 'Move to Active', () => updateRfpStatus(analysis.id, 'active'));
                    } else { 
                        addDropdownItemToMenu(dropdownMenu, 'fa-check-circle', 'Move to Active', () => updateRfpStatus(analysis.id, 'active'));
                        addDropdownItemToMenu(dropdownMenu, 'fa-times-circle', 'Move to Not Pursuing', () => updateRfpStatus(analysis.id, 'not_pursuing'));
                        addDropdownItemToMenu(dropdownMenu, 'fa-archive', 'Archive', () => updateRfpStatus(analysis.id, 'archived'));
                    }
                    dropdownMenu.appendChild(document.createElement('div')).className = 'dropdown-divider';
                    addDropdownItemToMenu(dropdownMenu, 'fa-trash-alt', 'Delete RFP', () => deleteRfp(analysis.id, displayTitle));
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
                
                let tempOriginalRfpText = ""; 
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
                        tempOriginalRfpText += `--- START OF DOCUMENT: ${file.name} ---\n${text}\n--- END OF DOCUMENT: ${file.name} ---\n\n`;
                        if (!text || text.trim().length < 10) {
                            console.warn(`Minimal text extracted from ${file.name}.`);
                        }
                    }
                    if (tempOriginalRfpText.trim().length < 50) {
                        throw new Error("Insufficient total text extracted from PDF(s) for analysis.");
                    }
                } catch (error) {
                    if(modalAnalysisStatusArea) showLoadingMessage(modalAnalysisStatusArea, `PDF Error: ${error.message}`, false);
                    if(modalAnalysisStatusArea) hideLoadingMessage(modalAnalysisStatusArea, 5000); return;
                }
                originalRfpTextForReanalysis = tempOriginalRfpText; 

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
                
                const aiPrompt = constructFullRfpAnalysisPrompt(originalRfpTextForReanalysis); 
                console.log("Constructed AI Prompt for Submission (New RFP):\n", aiPrompt);

                const currentAnalysisPrompts = {}; 
                Object.keys(PROMPT_CONFIG).forEach(keySuffix => {
                    currentAnalysisPrompts[keySuffix] = getStoredSectionPrompt(keySuffix, null); 
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
                        const parentElementForSection = modalTabContentMap[keySuffix];
                        const promptText = currentAnalysisPrompts[keySuffix]; 
                        const sectionContent = parsedAISections[keySuffix];
                        
                        if (parentElementForSection) {
                             formatAndDisplayContentWithPrompt(parentElementForSection, keySuffix, promptText, sectionContent, null, false); 
                        } else {
                            console.warn(`Modal Tab Content Div for RFP key: ${keySuffix} not found.`);
                        }
                    });


                    if (modalAnalysisResultsArea) modalAnalysisResultsArea.style.display = 'block';
                    const activeModalResultTab = document.querySelector('#new-rfp-modal .tabs-container .tab-link');
                    if (activeModalResultTab) {
                        document.querySelectorAll('#new-rfp-modal .tabs-container .tab-link').forEach(tl => tl.classList.remove('active'));
                        activeModalResultTab.classList.add('active');
                        const tabNameMatch = activeModalResultTab.getAttribute('onclick').match(/'(modal-[^']+-tab)'/);
                        if (tabNameMatch && tabNameMatch[1] && window.openModalTab) {
                             window.openModalTab(null, tabNameMatch[1]); 
                        }
                    }
                    if(modalAnalysisStatusArea) showLoadingMessage(modalAnalysisStatusArea, "RFP analysis complete! Saving results...", false);
                    try {
                        const savePayload = {
                            rfpTitle: rfpTitleValue || "", rfpType: rfpTypeValue, submittedBy: submittedByValue,
                            rfpFileName: rfpFileNameValue,
                            originalRfpFullText: originalRfpTextForReanalysis, 
                            status: 'analyzed',
                            analysisPrompts: currentAnalysisPrompts 
                        };
                        Object.keys(PROMPT_CONFIG).forEach(key => {
                             const dbKey = PROMPT_CONFIG[key].databaseKey;
                             if(dbKey) {
                                savePayload[dbKey] = parsedAISections[key];
                             } else {
                                console.warn(`Database key not defined for RFP prompt config key: ${key}`);
                             }
                        });

                        const saveResponse = await fetch('/api/rfp-analysis', {
                            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(savePayload)
                        });
                        if (!saveResponse.ok) throw new Error((await saveResponse.json()).error || 'Failed to save analysis.');
                        const savedAnalysisData = await saveResponse.json(); 
                        if(modalAnalysisStatusArea) showLoadingMessage(modalAnalysisStatusArea, "Analysis complete and results saved!", false);
                        
                        allFetchedAnalyses.unshift(savedAnalysisData); 
                        renderAnalysesList(); 

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
            const tabNameMatch = firstActiveViewTab.getAttribute('onclick').match(/'(view-[^']+-tab)'/);
            if (tabNameMatch && tabNameMatch[1]) {
                const tabNameToOpen = tabNameMatch[1];
                const tabElement = document.getElementById(tabNameToOpen);
                if (window.openViewTab && tabElement && tabElement.style.display !== 'block') { 
                    window.openViewTab(null, tabNameToOpen);
                }
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
            const actionTriggerClicked = e.target.closest('.actions-dropdown-trigger, .view-modal-actions-dropdown-trigger'); 

            openDropdowns.forEach(menu => {
                 if (menu.contains(e.target) || (actionTriggerClicked && (menu.previousElementSibling === actionTriggerClicked || menu.id === actionTriggerClicked.nextElementSibling?.id))) {
                    clickedInsideADropdownOrTrigger = true;
                }
            });
            if (!clickedInsideADropdownOrTrigger) {
                openDropdowns.forEach(menu => menu.style.display = 'none');
            }
        });

    } // End of initializeAppLogic function

}); // End of DOMContentLoaded
