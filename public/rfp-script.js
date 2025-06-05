// pdf.js import and worker setup are REMOVED

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
        console.log("RFP Analyzer: Valid session found.");
        handleSuccessfulLogin();
    } else {
        console.log("RFP Analyzer: No valid session or session expired. Showing login modal.");
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
             console.error("RFP Analyzer: Login form (auth-form) not found in the DOM.");
             if(document.body) document.body.innerHTML = "<div style='text-align:center; padding: 50px; font-family: sans-serif;'><h1>Configuration Error</h1><p>Login form not found. Page cannot load.</p></div>";
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
            deadlines: null, // Populated by clearTabContent
            submissionFormat: null, // Populated by clearTabContent
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
        const viewRfpModalActionTrigger = document.getElementById('view-rfp-modal-action-trigger');
        const viewRfpModalActionsMenu = document.getElementById('view-rfp-modal-actions-menu');

        const viewTabContentMap = {
            summary: document.getElementById('view-summary-result-content'),
            questions: document.getElementById('view-questions-result-content'),
            deadlines: null, // Populated by clearTabContent
            submissionFormat: null, // Populated by clearTabContent
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
        let currentlyViewedRfpAnalysis = null;

        const RFP_PROMPT_MAIN_INSTRUCTION = "Please analyze the following Request for Proposal (RFP) text.\nProvide the following distinct sections in your response, each clearly delimited:";
        const RFP_PROMPT_SECTION_DELIMITER_FORMAT = "\n\n###{SECTION_KEY_UPPER}_START###\n[Content for {SECTION_KEY_UPPER}]\n###{SECTION_KEY_UPPER}_END###";
        const RFP_PROMPT_TEXT_SUFFIX = "\n\nRFP Text (including any addendums):\n---\n{RFP_TEXT_PLACEHOLDER}\n---";

        const PROMPT_CONFIG = {
            summary: {
                defaultText: "You will be provided with the content of the RFP. Follow these guidelines to create a summary: Focus on extracting and condensing key information from the RFP. Ensure the summary captures all essential aspects, including: Project objectives, Scope of work, Requirements and specifications, Evaluation criteria,  Submission guidelines, Deadlines. Maintain a balance between conciseness and comprehensiveness. The summary should be no more 2 pages in length.",
                delimiterKey: "SUMMARY",
                databaseKey: "rfpSummary"
            },
            questions: {
                defaultText: "Generate a list of 20 critical and insightful clarification questions to ask regarding an RFP. These questions should be designed to uncover hidden requirements, ambiguous statements, or areas where more detail is needed to create a comprehensive and competitive proposal. The goal is to ensure a thorough understanding of the client's needs and expectations.",
                delimiterKey: "QUESTIONS",
                databaseKey: "generatedQuestions"
            },
            deadlines: {
                defaultText: "Carefully read the entire RFP document to iIdentify all key deadlines, including dates and times for each deadline. Output the information in a well-organized list with clear labels for each deadline",
                delimiterKey: "DEADLINES",
                databaseKey: "rfpDeadlines"
            },
            submissionFormat: {
                defaultText: "Carefully review the RFP document to identify the specified submission format for the proposal (e.g., mail, email, online portal, usb, fax). Identify all people related to the RFP. 3. Extract all relevant contact information, including: Addresses for mail submissions. Email addresses for electronic submissions. Links to online portals or websites for online submissions. Phone numbers for contact persons. Names and titles of contact persons. 4. Present the extracted information in a clear and organized manner.",
                delimiterKey: "SUBMISSION_FORMAT",
                databaseKey: "rfpSubmissionFormat"
            },
            requirements: {
                defaultText: "A list of Requirements (e.g., mandatory, highly desirable).",
                delimiterKey: "REQUIREMENTS",
                databaseKey: "rfpKeyRequirements"
            },
            stakeholders: {
                defaultText: "Mentioned Stakeholders or Key Contacts.",
                delimiterKey: "STAKEHOLDERS",
                databaseKey: "rfpStakeholders"
            },
            risks: {
                defaultText: "Potential Risks or Red Flags identified in the RFP.",
                delimiterKey: "RISKS",
                databaseKey: "rfpRisks"
            },
            registration: {
                defaultText: "Registration requirements or details for bidders.",
                delimiterKey: "REGISTRATION",
                databaseKey: "rfpRegistration"
            },
            licenses: {
                defaultText: "Required Licenses or Certifications for bidders.",
                delimiterKey: "LICENSES",
                databaseKey: "rfpLicenses"
            },
            budget: {
                defaultText: "Any mentioned Budget constraints or financial information.",
                delimiterKey: "BUDGET",
                databaseKey: "rfpBudget"
            }
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
                    currentlyViewedRfpAnalysis = null;
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
            let targetParentDiv = isModalView ? modalDeadlinesTabContentDiv : viewDeadlinesTabContentDiv;
            let deadlinesContentId = isModalView ? 'modal-deadlines-only-content' : 'view-deadlines-only-content';
            let submissionFormatContentId = isModalView ? 'modal-submission-format-content' : 'view-submission-format-content';

            if (targetParentDiv) {
                const resultContainer = !isModalView ? targetParentDiv.querySelector('#view-deadlines-result-content') : targetParentDiv;
                if (resultContainer) {
                     resultContainer.innerHTML = `<h4>Deadlines:</h4><div id="${deadlinesContentId}"></div><h4 style="margin-top: 1rem;">Submission Format:</h4><div id="${submissionFormatContentId}"></div>`;
                    tabContentMap.deadlines = document.getElementById(deadlinesContentId);
                    tabContentMap.submissionFormat = document.getElementById(submissionFormatContentId);
                } else if (isModalView) {
                     targetParentDiv.innerHTML = `<h4>Deadlines:</h4><div id="${deadlinesContentId}"></div><h4 style="margin-top: 1rem;">Submission Format:</h4><div id="${submissionFormatContentId}"></div>`;
                    tabContentMap.deadlines = document.getElementById(deadlinesContentId);
                    tabContentMap.submissionFormat = document.getElementById(submissionFormatContentId);
                } else {
                    console.warn(`Could not find result container for combined deadlines/format tab in ${isModalView ? 'modal' : 'view'}.`);
                }
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

        // extractTextFromPdf function is REMOVED

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
                promptLabel.textContent = "Prompt Used: ";
                promptDisplayDiv.appendChild(promptLabel);
                const promptTextNode = document.createTextNode(sectionPromptText);
                promptDisplayDiv.appendChild(promptTextNode);

                const currentDefaultPromptFromConfig = PROMPT_CONFIG[sectionKeySuffix]?.defaultText;
                if (currentDefaultPromptFromConfig && sectionPromptText === currentDefaultPromptFromConfig) {
                    const defaultIndicator = document.createElement('em');
                    defaultIndicator.textContent = " (This is the current default prompt)";
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
                            populateViewModalRfpActions(currentlyViewedRfpAnalysis);

                            const savedPrompts = detailedAnalysis.analysisPrompts || {};
                            Object.keys(PROMPT_CONFIG).forEach(keySuffix => {
                                const contentDiv = viewTabContentMap[keySuffix];
                                const dbKey = PROMPT_CONFIG[keySuffix].databaseKey;
                                const sectionContent = detailedAnalysis[dbKey] || "N/A";
                                const promptTextForThisAnalysis = savedPrompts[keySuffix] || PROMPT_CONFIG[keySuffix]?.defaultText;
                                if (contentDiv) {
                                    formatAndDisplayContentWithPrompt(contentDiv, keySuffix, promptTextForThisAnalysis, sectionContent);
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

                if(modalAnalysisStatusArea) showLoadingMessage(modalAnalysisStatusArea, "Validating RFP files...");
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
                for (let i = 0; i < addendumFiles.length; i++) {
                    if (addendumFiles[i].type !== "application/pdf") {
                         if(modalAnalysisStatusArea) showLoadingMessage(modalAnalysisStatusArea, `Invalid addendum file type: ${addendumFiles[i].name}. Please upload PDFs only.`, false);
                         if(modalAnalysisStatusArea) hideLoadingMessage(modalAnalysisStatusArea, 3000); return;
                    }
                }

                // --- New: Prepare FormData for Python Backend ---
                const formData = new FormData();
                formData.append('main_rfp', mainRfpFile, mainRfpFile.name);
                for (let i = 0; i < addendumFiles.length; i++) {
                    formData.append('addendum_files', addendumFiles[i], addendumFiles[i].name);
                }

                let combinedRfpTextFromServer = "";
                if(modalAnalysisStatusArea) showLoadingMessage(modalAnalysisStatusArea, "Uploading and processing PDF(s) on server...");

                try {
                    // Replace '/python-pdf-processor/process-rfp-pdf/' with your actual Python backend endpoint
                    const pythonResponse = await fetch('/api/process-pdf/', { // Placeholder URL
                        method: 'POST',
                        body: formData
                    });

                    if (!pythonResponse.ok) {
                        const errorData = await pythonResponse.json().catch(() => ({ error: "Unknown error from PDF processing service." , processing_details: [] }));
                        console.error("Python backend error response:", errorData);
                        let errorMsg = errorData.error || `PDF processing failed with status: ${pythonResponse.status}`;
                        if (errorData.processing_details && errorData.processing_details.length > 0) {
                            errorData.processing_details.forEach(detail => {
                                if (detail.status === 'failure' && detail.error_message) {
                                    errorMsg += `\nFile ${detail.file_name}: ${detail.error_message}`;
                                }
                            });
                        }
                        throw new Error(errorMsg);
                    }

                    const pythonResult = await pythonResponse.json();
                    console.log("Python Backend Response:", pythonResult);

                    if (pythonResult.status === 'success' && pythonResult.extracted_text) {
                        combinedRfpTextFromServer = pythonResult.extracted_text;
                        // Optionally display pythonResult.processing_details to the user in a non-modal way or log
                        console.log("Text extraction details from Python backend:", pythonResult.processing_details);
                         if(modalAnalysisStatusArea) showLoadingMessage(modalAnalysisStatusArea, "PDFs processed successfully by server. Preparing AI analysis...", false);

                    } else if (pythonResult.status === 'partial_success' && pythonResult.extracted_text) {
                        combinedRfpTextFromServer = pythonResult.extracted_text;
                        let warningMsg = "Partial success in PDF processing. Some files may have issues. Details:\n";
                        pythonResult.processing_details.forEach(detail => {
                            warningMsg += `File: ${detail.file_name}, Method: ${detail.method}, Status: ${detail.status}${detail.error_message ? ', Error: ' + detail.error_message : ''}\n`;
                        });
                        console.warn(warningMsg);
                        // Display a non-blocking warning to the user if possible, or just proceed.
                        if(modalAnalysisStatusArea) showLoadingMessage(modalAnalysisStatusArea, "Partial success in PDF processing. Continuing with available text...", false);


                    } else {
                        let errorDetail = pythonResult.error_message || "Failed to extract text from PDFs via Python service.";
                        if (pythonResult.processing_details && pythonResult.processing_details.length > 0) {
                             pythonResult.processing_details.forEach(detail => {
                                if (detail.status === 'failure' && detail.error_message) {
                                    errorDetail += `\nFile ${detail.file_name}: ${detail.error_message}`;
                                }
                            });
                        }
                        throw new Error(errorDetail);
                    }

                } catch (error) {
                    console.error('Error calling Python PDF processing backend:', error);
                    if(modalAnalysisStatusArea) showLoadingMessage(modalAnalysisStatusArea, `PDF Processing Error: ${error.message}`, false);
                    if(modalAnalysisStatusArea) hideLoadingMessage(modalAnalysisStatusArea, 7000);
                    if (generateAnalysisButton) generateAnalysisButton.disabled = false;
                    return;
                }
                // --- End of New PDF Processing Logic ---


                if (combinedRfpTextFromServer.trim().length < 50) { // Check text from server
                    if(modalAnalysisStatusArea) showLoadingMessage(modalAnalysisStatusArea, "Insufficient total text extracted from PDF(s) by the server for analysis.", false);
                    if(modalAnalysisStatusArea) hideLoadingMessage(modalAnalysisStatusArea, 5000);
                    if (generateAnalysisButton) generateAnalysisButton.disabled = false;
                     return;
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

                const aiPrompt = constructFullRfpAnalysisPrompt(combinedRfpTextFromServer); // Use server-extracted text
                console.log("Constructed AI Prompt for Submission (using server-extracted text):\n", aiPrompt);

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
