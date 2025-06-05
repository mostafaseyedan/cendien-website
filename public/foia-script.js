// Import pdfjsLib. Ensure the path is correct if you host it locally.
// Using a CDN for pdf.js
import * as pdfjsLib from 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/5.0.375/pdf.min.mjs';

// Set worker source for pdf.js
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/5.0.375/pdf.worker.min.mjs';

document.addEventListener('DOMContentLoaded', () => {
    // --- START OF MODAL AUTHENTICATION (FOIA specific) ---
    const authModalOverlayFoia = document.getElementById('auth-modal-overlay-foia');
    const authFormFoia = document.getElementById('auth-form-foia');
    const authUsernameInputFoia = document.getElementById('auth-username-foia');
    const authPasswordInputFoia = document.getElementById('auth-password-foia');
    const authErrorMessageFoia = document.getElementById('auth-error-message-foia');
    const pageContentWrapperFoia = document.getElementById('page-content-wrapper-foia');

    const correctUsername = "Cendien"; // Keeping same credentials for now
    const correctPassword = "rfpanalyzer"; // Keeping same credentials for now
    const sessionDuration = 24 * 60 * 60 * 1000; // 24 hours
    const loginTimestampKeyFoia = 'foiaAnalyzerLoginTimestamp'; // FOIA specific key

    function isFoiaSessionValid() {
        const storedTimestamp = localStorage.getItem(loginTimestampKeyFoia);
        if (!storedTimestamp) return false;
        const lastLoginTime = parseInt(storedTimestamp, 10);
        if (isNaN(lastLoginTime)) {
            localStorage.removeItem(loginTimestampKeyFoia);
            return false;
        }
        return (Date.now() - lastLoginTime) < sessionDuration;
    }

    function handleFoiaSuccessfulLogin() {
        localStorage.setItem(loginTimestampKeyFoia, Date.now().toString());
        if (authModalOverlayFoia) {
            authModalOverlayFoia.classList.add('auth-modal-hidden');
            authModalOverlayFoia.style.display = 'none';
        }
        if (pageContentWrapperFoia) {
            pageContentWrapperFoia.classList.remove('content-hidden');
            pageContentWrapperFoia.style.display = '';
        }
        initializeFoiaAppLogic(); // Initialize FOIA app
    }

    function showFoiaLoginError(message) {
        if (authErrorMessageFoia) {
            authErrorMessageFoia.textContent = message;
            authErrorMessageFoia.style.display = 'block';
        }
        if (authPasswordInputFoia) authPasswordInputFoia.value = '';
        if (authUsernameInputFoia) authUsernameInputFoia.focus();
    }

    if (isFoiaSessionValid()) {
        console.log("FOIA Analyzer: Valid session found.");
        handleFoiaSuccessfulLogin();
    } else {
        console.log("FOIA Analyzer: No valid session or session expired. Showing login modal.");
        if (authModalOverlayFoia) {
            authModalOverlayFoia.classList.remove('auth-modal-hidden');
            authModalOverlayFoia.style.display = 'flex';
        }
        if (pageContentWrapperFoia) {
            pageContentWrapperFoia.classList.add('content-hidden');
            pageContentWrapperFoia.style.display = 'none';
        }
        
        if (authFormFoia) {
            authFormFoia.addEventListener('submit', (event) => {
                event.preventDefault();
                if (!authUsernameInputFoia || !authPasswordInputFoia) {
                    showFoiaLoginError("Login form elements are missing.");
                    return;
                }
                const username = authUsernameInputFoia.value.trim();
                const password = authPasswordInputFoia.value;

                if (username === correctUsername && password === correctPassword) {
                    if (authErrorMessageFoia) authErrorMessageFoia.style.display = 'none';
                    handleFoiaSuccessfulLogin();
                } else {
                    showFoiaLoginError("Invalid username or password. Please try again.");
                }
            });
        } else {
             console.error("FOIA Analyzer: Login form (auth-form-foia) not found.");
             if (document.body) document.body.innerHTML = "<div style='text-align:center; padding: 50px; font-family: sans-serif;'><h1>Configuration Error</h1><p>Login form not found. Page cannot load.</p></div>";
        }
    }
    // --- END OF MODAL AUTHENTICATION (FOIA specific) ---

    function initializeFoiaAppLogic() {
        console.log("FOIA Analyzer: Initializing app logic...");
        
        // Modal and Form Elements (FOIA specific IDs)
        const newFoiaModal = document.getElementById('new-foia-modal');
        const openNewFoiaModalButton = document.getElementById('open-new-foia-modal-button');
        const modalCloseButtonFoia = document.getElementById('modal-close-button-foia');
        const modalFormTitleFoia = document.getElementById('modal-title-foia');

        const foiaForm = document.getElementById('foia-details-form');
        const foiaFileUploadInput = document.getElementById('foiaFileUpload'); // Single input for multiple files
        const generateAnalysisButtonFoia = document.getElementById('generate-analysis-button-foia');
        const modalAnalysisStatusAreaFoia = document.getElementById('modal-analysis-status-area-foia');
        const modalAnalysisResultsAreaFoia = document.getElementById('modal-analysis-results-area-foia');

        // Tab content maps for new analysis modal (FOIA specific)
        const modalTabContentMapFoia = {
            summary: document.getElementById('modal-summary-result-content-foia'),
            questions: document.getElementById('modal-questions-result-content-foia'),
            deadlines: null, // Will be populated by clearTabContent
            submissionFormat: null, // Will be populated by clearTabContent
            requirements: document.getElementById('modal-requirements-result-content-foia'),
            stakeholders: document.getElementById('modal-stakeholders-result-content-foia'),
            risks: document.getElementById('modal-risks-result-content-foia'),
        };
        const modalDeadlinesTabContentDivFoia = document.getElementById('modal-deadlines-tab-foia');


        // View Saved FOIA Details Elements
        const viewSavedFoiaDetailsSection = document.getElementById('view-saved-foia-details-section');
        const viewFoiaMainTitleHeading = document.getElementById('view-foia-main-title-heading');
        const closeViewFoiaDetailsButton = document.getElementById('close-view-foia-details-button');
        const viewFoiaStatusArea = document.getElementById('view-foia-status-area');
        const viewAnalysisResultsAreaFoia = document.getElementById('view-analysis-results-area-foia');
        
        // Tab content maps for viewing saved analysis (FOIA specific)
        const viewTabContentMapFoia = {
            summary: document.getElementById('view-summary-result-content-foia'),
            questions: document.getElementById('view-questions-result-content-foia'),
            deadlines: null, // Will be populated by clearTabContent
            submissionFormat: null, // Will be populated by clearTabContent
            requirements: document.getElementById('view-requirements-result-content-foia'),
            stakeholders: document.getElementById('view-stakeholders-result-content-foia'),
            risks: document.getElementById('view-risks-result-content-foia'),
        };
        const viewDeadlinesTabContentDivFoia = document.getElementById('view-deadlines-tab-foia');


        // Edit FOIA Modal Elements
        const editFoiaModal = document.getElementById('edit-foia-modal');
        const editFoiaModalCloseButton = document.getElementById('edit-foia-modal-close-button');
        const editFoiaModalTitle = document.getElementById('edit-foia-modal-title');
        const editFoiaForm = document.getElementById('edit-foia-details-form');
        const editFoiaIdInput = document.getElementById('editFoiaId');
        const editFoiaTitleInput = document.getElementById('editFoiaTitle');
        const editFoiaFileNamesTextarea = document.getElementById('editFoiaFileNames'); // For multiple file names
        const editFoiaTypeInput = document.getElementById('editFoiaType');
        const editSubmittedBySelectFoia = document.getElementById('editSubmittedByFoia');
        const editFoiaStatusSelect = document.getElementById('editFoiaStatus');
        const editFoiaSummaryTextarea = document.getElementById('editFoiaSummary');
        const editGeneratedQuestionsTextareaFoia = document.getElementById('editGeneratedQuestionsFoia');
        const editFoiaDeadlinesTextarea = document.getElementById('editFoiaDeadlines');
        const editFoiaSubmissionFormatTextarea = document.getElementById('editFoiaSubmissionFormat');
        const editFoiaKeyRequirementsTextarea = document.getElementById('editFoiaKeyRequirements');
        const editFoiaStakeholdersTextarea = document.getElementById('editFoiaStakeholders');
        const editFoiaRisksTextarea = document.getElementById('editFoiaRisks');
        const saveEditedFoiaButton = document.getElementById('save-edited-foia-button');
        const cancelEditFoiaButton = document.getElementById('cancel-edit-foia-button');
        const editFoiaStatusArea = document.getElementById('edit-foia-status-area');

        // Saved Analyses List Elements
        const savedAnalysesListDivFoia = document.getElementById('saved-analyses-list-foia');
        const noSavedAnalysesPFoia = document.getElementById('no-saved-analyses-foia');
        const foiaListTabsContainer = document.getElementById('foia-list-tabs');
        const foiaListStatusArea = document.getElementById('foia-list-status-area');
        const yearSpanFoia = document.getElementById('current-year-foia');

        // Prompt Settings Modal Elements (FOIA specific)
        const promptSettingsModalFoia = document.getElementById('prompt-settings-modal-foia');
        const openPromptSettingsButtonFoia = document.getElementById('open-prompt-settings-modal-button-foia');
        const promptModalCloseButtonFoia = document.getElementById('prompt-modal-close-button-foia');
        const promptSectionSelectorFoia = document.getElementById('promptSectionSelectorFoia');
        const foiaIndividualPromptTextarea = document.getElementById('foiaIndividualPromptTextarea');
        const saveCurrentPromptButtonFoia = document.getElementById('save-current-prompt-button-foia');
        const resetCurrentPromptButtonFoia = document.getElementById('reset-current-prompt-button-foia');
        const resetAllPromptsButtonFoia = document.getElementById('reset-all-prompts-button-foia');
        const promptSaveStatusFoia = document.getElementById('prompt-save-status-foia');

        let allFetchedFoiaAnalyses = [];
        let currentFoiaSortKey = 'analysisDate';
        let currentFoiaSortOrder = 'desc';
        let currentFoiaStatusFilter = 'all_statuses';
        let serverFoiaPrompts = null; 
        let foiaPromptsLastFetchedFromServer = false; 

        // FOIA Specific Prompt Configuration (adjust defaultText as needed for FOIA context)
        const FOIA_PROMPT_MAIN_INSTRUCTION = "Please analyze the following Freedom of Information Act (FOIA) document(s).\nProvide the following distinct sections in your response, each clearly delimited:";
        const FOIA_PROMPT_SECTION_DELIMITER_FORMAT = "\n\n###{SECTION_KEY_UPPER}_START###\n[Content for {SECTION_KEY_UPPER}]\n###{SECTION_KEY_UPPER}_END###";
        const FOIA_PROMPT_TEXT_SUFFIX = "\n\nFOIA Document Text:\n---\n{FOIA_TEXT_PLACEHOLDER}\n---";

        const PROMPT_CONFIG_FOIA = {
            summary: {
                defaultText: "You will be provided with the content of a FOIA document. Focus on extracting and condensing key information. Ensure the summary captures essential aspects like: Subject matter, Key entities involved, Main findings or information disclosed, and any specified request scope or timeframe. Maintain conciseness and comprehensiveness.",
                delimiterKey: "SUMMARY"
            },
            questions: {
                defaultText: "Generate a list of critical and insightful clarification questions regarding this FOIA document. These questions should aim to understand the scope of the information, identify potential ambiguities, or areas needing further context for a complete understanding.",
                delimiterKey: "QUESTIONS"
            },
            deadlines: { // For FOIA, this might be 'Key Dates' or 'Response Timelines'
                defaultText: "Identify any key dates mentioned in the FOIA document(s), such as request dates, response deadlines, document creation dates, or event dates. Also, note any information about the format or channel of the FOIA request or response (e.g., online portal, mail).",
                delimiterKey: "DATES_FORMAT" // Combined for FOIA
            },
            submissionFormat: { // Often part of 'Deadlines' for FOIA, handle accordingly or make distinct
                defaultText: "Describe the method or format of the FOIA request or response as detailed in the document (e.g., email, portal, physical mail). Include any specific instructions or contact points mentioned for correspondence.",
                delimiterKey: "RESPONSE_CHANNEL" // Potentially rename for FOIA context
            },
            requirements: { // For FOIA, 'Key Information Requested/Disclosed' or 'Scope'
                defaultText: "List the key pieces of information requested or disclosed in the FOIA document. Detail any specific requirements, scope limitations, or categories of information mentioned.",
                delimiterKey: "KEY_INFORMATION"
            },
            stakeholders: { // For FOIA, 'Entities Involved' or 'Mentioned Parties'
                defaultText: "Identify all government agencies, organizations, individuals, or other entities mentioned as key parties in the FOIA document(s).",
                delimiterKey: "ENTITIES_INVOLVED"
            },
            risks: { // For FOIA, 'Exemptions Cited' or 'Redactions Noted'
                defaultText: "Identify any FOIA exemptions cited, justifications for redactions, or sections of withheld information mentioned in the document. Note any potential issues or controversies highlighted.",
                delimiterKey: "EXEMPTIONS_REDACTIONS"
            }
            // Remove RFP-specific sections like registration, licenses, budget if not applicable to FOIA
            // Or adapt them if there are FOIA equivalents.
        };

        if (yearSpanFoia && !yearSpanFoia.textContent) {
            yearSpanFoia.textContent = new Date().getFullYear();
        }

        // --- Prompt Management Functions (FOIA specific) ---
        async function fetchFoiaPromptsFromServer() {
            if (foiaPromptsLastFetchedFromServer && serverFoiaPrompts) {
                console.log("Using already fetched FOIA server prompts.");
                return serverFoiaPrompts;
            }
            if(promptSaveStatusFoia) showLoadingMessage(promptSaveStatusFoia, 'Loading FOIA prompt settings...', true);
            try {
                const response = await fetch('/api/foia-prompt-settings'); // FOIA specific endpoint
                if (!response.ok) {
                    const errData = await response.json().catch(() => ({ error: 'Failed to fetch FOIA prompts, server error.' }));
                    throw new Error(errData.error || `HTTP error ${response.status}`);
                }
                const data = await response.json();
                serverFoiaPrompts = data.prompts; 
                foiaPromptsLastFetchedFromServer = true;
                if(promptSaveStatusFoia) {
                    showLoadingMessage(promptSaveStatusFoia, 'FOIA Prompts loaded!', false);
                    hideLoadingMessage(promptSaveStatusFoia, 2000);
                }
                return serverFoiaPrompts;
            } catch (error) {
                console.error('Error fetching FOIA prompts:', error);
                if(promptSaveStatusFoia) showLoadingMessage(promptSaveStatusFoia, `Error loading FOIA prompts: ${error.message}. Using local defaults.`, false);
                serverFoiaPrompts = {}; // Initialize if error
                Object.keys(PROMPT_CONFIG_FOIA).forEach(key => {
                    serverFoiaPrompts[key] = PROMPT_CONFIG_FOIA[key].defaultText;
                });
                if(promptSaveStatusFoia) hideLoadingMessage(promptSaveStatusFoia, 3000);
                return serverFoiaPrompts; 
            }
        }

        async function saveFoiaPromptsToServer(promptsToSave) {
            if(promptSaveStatusFoia) showLoadingMessage(promptSaveStatusFoia, 'Saving FOIA prompts...', true);
            try {
                const response = await fetch('/api/foia-prompt-settings', { // FOIA specific endpoint
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ prompts: promptsToSave }),
                });
                if (!response.ok) {
                    const errData = await response.json().catch(() => ({ error: 'Failed to save FOIA prompts, server error.' }));
                    throw new Error(errData.error || `HTTP error ${response.status}`);
                }
                const data = await response.json();
                serverFoiaPrompts = data.prompts; 
                if(promptSaveStatusFoia){
                    showLoadingMessage(promptSaveStatusFoia, data.message || 'FOIA Prompts saved!', false);
                    hideLoadingMessage(promptSaveStatusFoia, 2000);
                }
            } catch (error) {
                console.error('Error saving FOIA prompts:', error);
                if(promptSaveStatusFoia){
                    showLoadingMessage(promptSaveStatusFoia, `Error saving FOIA prompts: ${error.message}`, false);
                    hideLoadingMessage(promptSaveStatusFoia, 3000);
                }
            }
        }
        
        function getStoredFoiaSectionPrompt(sectionKeySuffix) {
            if (serverFoiaPrompts && serverFoiaPrompts[sectionKeySuffix]) {
                return serverFoiaPrompts[sectionKeySuffix];
            }
            return PROMPT_CONFIG_FOIA[sectionKeySuffix]?.defaultText;
        }

        function loadSelectedFoiaSectionPromptToTextarea() {
            if (promptSectionSelectorFoia && foiaIndividualPromptTextarea) {
                const selectedKeySuffix = promptSectionSelectorFoia.value;
                if (selectedKeySuffix && PROMPT_CONFIG_FOIA[selectedKeySuffix]) { 
                    if (!serverFoiaPrompts) {
                        fetchFoiaPromptsFromServer().then(() => { 
                            foiaIndividualPromptTextarea.value = getStoredFoiaSectionPrompt(selectedKeySuffix);
                        });
                    } else {
                        foiaIndividualPromptTextarea.value = getStoredFoiaSectionPrompt(selectedKeySuffix);
                    }
                }
            }
        }

        async function saveCurrentFoiaSectionPrompt() { 
            if (promptSectionSelectorFoia && foiaIndividualPromptTextarea && promptSaveStatusFoia) {
                const selectedKeySuffix = promptSectionSelectorFoia.value;
                const userPrompt = foiaIndividualPromptTextarea.value.trim();

                if (!serverFoiaPrompts) await fetchFoiaPromptsFromServer();
                if (!serverFoiaPrompts) { 
                    showLoadingMessage(promptSaveStatusFoia, 'Error: Base FOIA prompts not loaded.', false);
                    hideLoadingMessage(promptSaveStatusFoia, 3000); return;
                }
                if (userPrompt) {
                    serverFoiaPrompts[selectedKeySuffix] = userPrompt; 
                    await saveFoiaPromptsToServer(serverFoiaPrompts); 
                } else {
                    showLoadingMessage(promptSaveStatusFoia, 'FOIA section prompt cannot be empty.', false);
                    hideLoadingMessage(promptSaveStatusFoia, 3000);
                }
            }
        }

        async function resetCurrentFoiaSectionPromptToDefault() { 
            if (promptSectionSelectorFoia && foiaIndividualPromptTextarea && promptSaveStatusFoia) {
                const selectedKeySuffix = promptSectionSelectorFoia.value;
                const selectedOptionText = promptSectionSelectorFoia.options[promptSectionSelectorFoia.selectedIndex].text;
                if (!serverFoiaPrompts) await fetchFoiaPromptsFromServer();
                if (!serverFoiaPrompts) { 
                    showLoadingMessage(promptSaveStatusFoia, 'Error: Base FOIA prompts not loaded.', false);
                    hideLoadingMessage(promptSaveStatusFoia, 3000); return;
                }
                if (confirm(`Reset prompt for "${selectedOptionText}" (FOIA) to default and save?`)) {
                    const defaultPromptText = PROMPT_CONFIG_FOIA[selectedKeySuffix]?.defaultText;
                    if (defaultPromptText) {
                        serverFoiaPrompts[selectedKeySuffix] = defaultPromptText; 
                        foiaIndividualPromptTextarea.value = defaultPromptText; 
                        await saveFoiaPromptsToServer(serverFoiaPrompts); 
                    } else {
                         showLoadingMessage(promptSaveStatusFoia, `Error: No default FOIA prompt for ${selectedOptionText}.`, false);
                         hideLoadingMessage(promptSaveStatusFoia, 3000);
                    }
                }
            }
        }

        async function resetAllFoiaPromptsToDefault() { 
            if (promptSaveStatusFoia && promptSectionSelectorFoia) {
                if (confirm("Reset ALL FOIA section prompts to default and save? This cannot be undone.")) {
                    const newDefaults = {};
                    Object.keys(PROMPT_CONFIG_FOIA).forEach(keySuffix => {
                        newDefaults[keySuffix] = PROMPT_CONFIG_FOIA[keySuffix].defaultText;
                    });
                    serverFoiaPrompts = newDefaults; 
                    await saveFoiaPromptsToServer(serverFoiaPrompts); 
                    loadSelectedFoiaSectionPromptToTextarea(); 
                }
            }
        }

        function constructFullFoiaAnalysisPrompt(foiaText) {
            let fullPrompt = FOIA_PROMPT_MAIN_INSTRUCTION;
            Object.keys(PROMPT_CONFIG_FOIA).forEach(keySuffix => {
                const sectionInstruction = getStoredFoiaSectionPrompt(keySuffix); 
                fullPrompt += `\n${sectionInstruction}`;
            });
            fullPrompt += "\n\nUse the following format strictly for each section:";
            Object.keys(PROMPT_CONFIG_FOIA).forEach(keySuffix => {
                const delimiterKeyUpper = PROMPT_CONFIG_FOIA[keySuffix]?.delimiterKey;
                if (delimiterKeyUpper) {
                    const delimiter = FOIA_PROMPT_SECTION_DELIMITER_FORMAT.replace(/{SECTION_KEY_UPPER}/g, delimiterKeyUpper);
                    fullPrompt += delimiter;
                }
            });
            fullPrompt += FOIA_PROMPT_TEXT_SUFFIX.replace('{FOIA_TEXT_PLACEHOLDER}', foiaText);
            return fullPrompt;
        }

        // --- Modal Open/Close Utility Functions (generic, used by FOIA modals) ---
        function openModal(modalElement) {
            if (modalElement) {
                [newFoiaModal, editFoiaModal, viewSavedFoiaDetailsSection, promptSettingsModalFoia].forEach(m => {
                    if (m && m !== modalElement) {
                        m.style.display = 'none';
                        if (m.classList.contains('modal-active')) m.classList.remove('modal-active');
                    }
                });
                modalElement.style.display = 'block'; // Or 'flex' if preferred
                if (modalElement.id === 'view-saved-foia-details-section') { // Check ID if class is reused
                    modalElement.classList.add('modal-active');
                }
                document.body.style.overflow = 'hidden';
            }
        }

        function closeModal(modalElement) {
            if (modalElement) {
                modalElement.style.display = 'none';
                 if (modalElement.id === 'view-saved-foia-details-section') {
                    modalElement.classList.remove('modal-active');
                }
                document.body.style.overflow = '';
            }
        }
        
        // --- Event Listeners for FOIA Modals ---
        if (openNewFoiaModalButton) {
            openNewFoiaModalButton.addEventListener('click', () => {
                if (foiaForm) foiaForm.reset();
                if (modalAnalysisResultsAreaFoia) modalAnalysisResultsAreaFoia.style.display = 'none';
                if (modalAnalysisStatusAreaFoia) modalAnalysisStatusAreaFoia.style.display = 'none';
                clearModalFoiaAnalysisResultTabs();
                if (modalFormTitleFoia) modalFormTitleFoia.textContent = "Analyze New FOIA Document(s)";
                openModal(newFoiaModal);
            });
        }
        if (modalCloseButtonFoia) {
            modalCloseButtonFoia.addEventListener('click', () => closeModal(newFoiaModal));
        }
        if (newFoiaModal) {
            newFoiaModal.addEventListener('click', (event) => {
                if (event.target === newFoiaModal) closeModal(newFoiaModal);
            });
        }

        if (openPromptSettingsButtonFoia) {
            openPromptSettingsButtonFoia.addEventListener('click', async () => { 
                if (!foiaPromptsLastFetchedFromServer || !serverFoiaPrompts) { 
                    await fetchFoiaPromptsFromServer();
                }
                loadSelectedFoiaSectionPromptToTextarea(); 
                openModal(promptSettingsModalFoia);
            });
        }
        if (promptModalCloseButtonFoia) {
            promptModalCloseButtonFoia.addEventListener('click', () => closeModal(promptSettingsModalFoia));
        }
        if (promptSettingsModalFoia) {
            promptSettingsModalFoia.addEventListener('click', (event) => {
                if (event.target === promptSettingsModalFoia) closeModal(promptSettingsModalFoia);
            });
        }
        
        if (promptSectionSelectorFoia) {
            promptSectionSelectorFoia.addEventListener('change', loadSelectedFoiaSectionPromptToTextarea);
        }
        if (saveCurrentPromptButtonFoia) {
            saveCurrentPromptButtonFoia.addEventListener('click', saveCurrentFoiaSectionPrompt);
        }
        if (resetCurrentPromptButtonFoia) {
            resetCurrentPromptButtonFoia.addEventListener('click', resetCurrentFoiaSectionPromptToDefault);
        }
        if (resetAllPromptsButtonFoia) {
            resetAllPromptsButtonFoia.addEventListener('click', resetAllFoiaPromptsToDefault);
        }

        if (closeViewFoiaDetailsButton) {
            closeViewFoiaDetailsButton.addEventListener('click', () => closeModal(viewSavedFoiaDetailsSection));
        }
        if (viewSavedFoiaDetailsSection) { // Event listener for background click
            viewSavedFoiaDetailsSection.addEventListener('click', (event) => {
                if (event.target === viewSavedFoiaDetailsSection) closeModal(viewSavedFoiaDetailsSection);
            });
        }

        if (editFoiaModalCloseButton) {
            editFoiaModalCloseButton.addEventListener('click', () => closeModal(editFoiaModal));
        }
        if (cancelEditFoiaButton) {
            cancelEditFoiaButton.addEventListener('click', () => closeModal(editFoiaModal));
        }
         if (editFoiaModal) { // Event listener for background click
            editFoiaModal.addEventListener('click', (event) => {
                if (event.target === editFoiaModal) closeModal(editFoiaModal);
            });
        }
        
        // --- Tab Content Clearing (FOIA specific) ---
        function clearTabContentFoia(tabContentMap, isModalView) {
            Object.keys(tabContentMap).forEach(key => {
                const div = tabContentMap[key];
                if (div) div.innerHTML = '';
            });
            let deadlinesTabParent, deadlinesDivId, submissionDivId;
            // Handle combined "Deadlines & Format" tab for FOIA
            if (isModalView && modalDeadlinesTabContentDivFoia) {
                deadlinesTabParent = modalDeadlinesTabContentDivFoia;
                deadlinesDivId = 'modal-deadlines-only-content-foia'; // Unique ID for inner div
                submissionDivId = 'modal-submission-format-content-foia'; // Unique ID for inner div
                deadlinesTabParent.innerHTML = `<h4>Key Dates:</h4><div id="${deadlinesDivId}"></div><h4 style="margin-top: 1rem;">Response Format/Channel:</h4><div id="${submissionDivId}"></div>`;
                modalTabContentMapFoia.deadlines = document.getElementById(deadlinesDivId);
                modalTabContentMapFoia.submissionFormat = document.getElementById(submissionDivId);
            } else if (!isModalView && viewDeadlinesTabContentDivFoia) {
                 const resultContainer = viewDeadlinesTabContentDivFoia.querySelector('#view-deadlines-result-content-foia'); // Target specific inner container
                deadlinesDivId = 'view-deadlines-only-content-foia';
                submissionDivId = 'view-submission-format-content-foia';
                if (resultContainer) {
                     resultContainer.innerHTML = `<h4>Key Dates:</h4><div id="${deadlinesDivId}"></div><h4 style="margin-top: 1rem;">Response Format/Channel:</h4><div id="${submissionDivId}"></div>`;
                    viewTabContentMapFoia.deadlines = document.getElementById(deadlinesDivId);
                    viewTabContentMapFoia.submissionFormat = document.getElementById(submissionDivId);
                } else if (viewDeadlinesTabContentDivFoia) {
                    viewDeadlinesTabContentDivFoia.innerHTML = '';
                }
            }
        }
        function clearModalFoiaAnalysisResultTabs() { clearTabContentFoia(modalTabContentMapFoia, true); }
        function clearViewFoiaAnalysisResultTabs() { clearTabContentFoia(viewTabContentMapFoia, false); }

        // --- Loading Message Utility (generic) ---
        function showLoadingMessage(areaElement, message = "Processing...", showSpinner = true) {
            if (!areaElement) return;
            areaElement.style.display = 'flex'; 
            areaElement.innerHTML = `${showSpinner ? '<div class="spinner"></div>' : ''}<p class="loading-text">${message}</p>`;
            if (areaElement === modalAnalysisStatusAreaFoia && generateAnalysisButtonFoia && showSpinner) {
                generateAnalysisButtonFoia.disabled = true;
            } else if (areaElement === editFoiaStatusArea && saveEditedFoiaButton && showSpinner) {
                saveEditedFoiaButton.disabled = true;
            }
             if (areaElement === promptSaveStatusFoia) { // Make sure prompt status is always visible when active
                areaElement.style.display = 'flex';
            }
        }
        function hideLoadingMessage(areaElement, delay = 0) {
            setTimeout(() => {
                if (areaElement && (areaElement.innerHTML.includes('loading-text') || areaElement.innerHTML.includes('spinner'))) {
                    areaElement.style.display = 'none';
                    areaElement.innerHTML = '';
                }
                if (generateAnalysisButtonFoia && areaElement === modalAnalysisStatusAreaFoia) generateAnalysisButtonFoia.disabled = false;
                if (saveEditedFoiaButton && areaElement === editFoiaStatusArea) saveEditedFoiaButton.disabled = false;
            }, delay);
        }

        // --- PDF Text Extraction (generic, can be reused) ---
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

        // --- Content Formatting and Display with Prompt (FOIA specific) ---
        function formatAndDisplayFoiaContentWithPrompt(parentElement, sectionKeySuffix, sectionPromptText, sectionContentText) {
            if (!parentElement) {
                console.warn("formatAndDisplayFoiaContentWithPrompt: parentElement is null for sectionKeySuffix:", sectionKeySuffix);
                return;
            }
            parentElement.innerHTML = ''; // Clear previous content

            // Display the prompt used for this section
            if (sectionPromptText) {
                const promptDisplayDiv = document.createElement('div');
                promptDisplayDiv.className = 'prompt-display-box'; // Use existing styling
                const promptLabel = document.createElement('strong');
                promptLabel.textContent = "Prompt Used: ";
                promptDisplayDiv.appendChild(promptLabel);
                const promptTextNode = document.createTextNode(sectionPromptText);
                promptDisplayDiv.appendChild(promptTextNode);
                
                // Indicate if it's the current default
                const currentDefaultPrompt = PROMPT_CONFIG_FOIA[sectionKeySuffix]?.defaultText;
                if (currentDefaultPrompt && sectionPromptText === currentDefaultPrompt) {
                    const defaultIndicator = document.createElement('em');
                    defaultIndicator.textContent = " (This is the current default prompt)";
                    defaultIndicator.style.fontSize = '0.9em';
                    defaultIndicator.style.marginLeft = '5px';
                    promptDisplayDiv.appendChild(defaultIndicator);
                }
                parentElement.appendChild(promptDisplayDiv);
            }

            // Display the AI-generated content
            const contentDiv = document.createElement('div');
            contentDiv.className = 'ai-generated-section-content'; // Use existing styling
            const lines = (sectionContentText || "N/A").split('\n');
            let currentList = null;
            lines.forEach(line => {
                const trimmedLine = line.trim();
                if (trimmedLine) {
                    // Basic formatting for bold text, more can be added
                    let formattedLine = trimmedLine.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>'); 
                    
                    const isQuestionsList = sectionKeySuffix === 'questions'; // for numbered list
                    const listMatch = formattedLine.match(/^(\*|-|\d+\.)\s+/);

                    if (listMatch) { // If line starts with a list marker
                        if (!currentList) { // Create new list if not already in one
                            currentList = isQuestionsList ? document.createElement('ol') : document.createElement('ul');
                            if (isQuestionsList) currentList.className = 'numbered-list'; // For specific styling if needed
                            contentDiv.appendChild(currentList);
                        }
                        const listItem = document.createElement('li');
                        listItem.innerHTML = formattedLine.substring(listMatch[0].length); // Remove marker from content
                        currentList.appendChild(listItem);
                    } else { // Not a list item
                        currentList = null; // End current list
                        const p = document.createElement('p');
                        p.innerHTML = formattedLine;
                        contentDiv.appendChild(p);
                    }
                } else { // Empty line
                    currentList = null; // End current list if line is blank
                }
            });
            parentElement.appendChild(contentDiv);
        }
        
        // --- CRUD Operations for FOIA Analyses (using /api/foia-analysis endpoints) ---
        async function updateFoiaStatus(foiaId, newStatus) {
            const foiaToUpdate = allFetchedFoiaAnalyses.find(a => a.id === foiaId);
            const foiaTitleForMessage = foiaToUpdate ? (foiaToUpdate.foiaTitle || (foiaToUpdate.foiaFileNames && foiaToUpdate.foiaFileNames.length > 0 ? foiaToUpdate.foiaFileNames.join(', ') : 'this document')) : 'this document';

            if(foiaListStatusArea) showLoadingMessage(foiaListStatusArea, `Updating "${foiaTitleForMessage}" to ${newStatus}...`);
            try {
                const response = await fetch(`/api/foia-analysis/${foiaId}/status`, { // FOIA endpoint
                    method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: newStatus }),
                });
                if (!response.ok) throw new Error((await response.json()).error || 'Failed to update FOIA status.');
                const result = await response.json(); 
                const updatedAnalysis = allFetchedFoiaAnalyses.find(a => a.id === foiaId);
                if (updatedAnalysis) updatedAnalysis.status = result.newStatus || newStatus; 
                renderFoiaAnalysesList(); // Re-render the list
                if(foiaListStatusArea) showLoadingMessage(foiaListStatusArea, `"${foiaTitleForMessage}" status updated to ${result.newStatus || newStatus}!`, false);
            } catch (error) { 
                if(foiaListStatusArea) showLoadingMessage(foiaListStatusArea, `Error updating FOIA status: ${error.message}`, false);
            } finally { 
                if(foiaListStatusArea) hideLoadingMessage(foiaListStatusArea, 3000); 
            }
        }

        async function deleteFoiaAnalysis(foiaId, foiaTitleForConfirm) {
            if (!window.confirm(`Are you sure you want to delete FOIA document(s): "${foiaTitleForConfirm}"? This action cannot be undone.`)) return;
            
            if(foiaListStatusArea) showLoadingMessage(foiaListStatusArea, `Deleting "${foiaTitleForConfirm}"...`);
            try {
                const response = await fetch(`/api/foia-analysis/${foiaId}`, { method: 'DELETE' }); // FOIA endpoint
                if (!response.ok) throw new Error((await response.json()).error || `Failed to delete ${foiaTitleForConfirm}.`);
                allFetchedFoiaAnalyses = allFetchedFoiaAnalyses.filter(a => a.id !== foiaId);
                renderFoiaAnalysesList(); // Re-render
                if (viewSavedFoiaDetailsSection && viewSavedFoiaDetailsSection.classList.contains('modal-active') && 
                    viewSavedFoiaDetailsSection.dataset.currentViewingId === foiaId) {
                    closeModal(viewSavedFoiaDetailsSection); // Close view if deleted item was open
                }
                if(foiaListStatusArea) showLoadingMessage(foiaListStatusArea, `"${foiaTitleForConfirm}" deleted successfully!`, false);
            } catch (error) { 
                if(foiaListStatusArea) showLoadingMessage(foiaListStatusArea, `Error deleting FOIA: ${error.message}`, false);
            } finally { 
                if(foiaListStatusArea) hideLoadingMessage(foiaListStatusArea, 3000); 
            }
        }

        async function openEditFoiaModal(analysisFullDetails) {
            if (!editFoiaModal || !editFoiaForm) return;
            let analysis = analysisFullDetails;
            // Check if detailed fields are present, if not, fetch full details
            if (!analysis.foiaSummary && !analysis.generatedQuestionsFoia && !analysis.foiaDeadlines) { 
                if(editFoiaStatusArea) showLoadingMessage(editFoiaStatusArea, 'Loading full FOIA details...');
                try {
                    const response = await fetch(`/api/foia-analysis/${analysisFullDetails.id}`); // FOIA endpoint
                    if (!response.ok) throw new Error((await response.json()).error || 'Failed to fetch full FOIA details.');
                    analysis = await response.json();
                } catch (error) {
                    console.error("Error fetching full FOIA details:", error);
                    if(editFoiaStatusArea) showLoadingMessage(editFoiaStatusArea, `Error: ${error.message}`, false);
                    if(editFoiaStatusArea) hideLoadingMessage(editFoiaStatusArea, 3000);
                    return;
                } finally {
                     if (editFoiaStatusArea && editFoiaStatusArea.innerHTML.includes('Loading full FOIA details...')) {
                        hideLoadingMessage(editFoiaStatusArea);
                    }
                }
            }

            // Populate Edit FOIA Modal
            if (editFoiaIdInput) editFoiaIdInput.value = analysis.id;
            if (editFoiaTitleInput) editFoiaTitleInput.value = analysis.foiaTitle || '';
            if (editFoiaFileNamesTextarea) editFoiaFileNamesTextarea.value = (analysis.foiaFileNames || []).join('\n') || 'N/A';
            if (editFoiaTypeInput) editFoiaTypeInput.value = analysis.foiaType || '';
            if (editSubmittedBySelectFoia) editSubmittedBySelectFoia.value = analysis.submittedBy || 'Other';
            if (editFoiaStatusSelect) editFoiaStatusSelect.value = analysis.status || 'analyzed';
            
            // Map FOIA specific fields from PROMPT_CONFIG_FOIA keys to textarea IDs
            if (editFoiaSummaryTextarea) editFoiaSummaryTextarea.value = analysis.foiaSummary || ''; // Directly map summary
            if (editGeneratedQuestionsTextareaFoia) editGeneratedQuestionsTextareaFoia.value = analysis.generatedQuestionsFoia || ''; // Directly map questions

            // For other sections, map based on the analysis object properties
            // These should match what's saved in the database
            if (editFoiaDeadlinesTextarea) editFoiaDeadlinesTextarea.value = analysis.foiaDeadlines || '';
            if (editFoiaSubmissionFormatTextarea) editFoiaSubmissionFormatTextarea.value = analysis.foiaSubmissionFormat || '';
            if (editFoiaKeyRequirementsTextarea) editFoiaKeyRequirementsTextarea.value = analysis.foiaKeyRequirements || '';
            if (editFoiaStakeholdersTextarea) editFoiaStakeholdersTextarea.value = analysis.foiaStakeholders || '';
            if (editFoiaRisksTextarea) editFoiaRisksTextarea.value = analysis.foiaRisks || '';
            
            if (editFoiaModalTitle) editFoiaModalTitle.textContent = `Edit FOIA: ${analysis.foiaTitle || (analysis.foiaFileNames && analysis.foiaFileNames.length > 0 ? analysis.foiaFileNames[0] : 'Document')}`;
            
            openModal(editFoiaModal);
        }
        
        if (editFoiaForm) {
            editFoiaForm.addEventListener('submit', async (event) => {
                event.preventDefault();
                if (!saveEditedFoiaButton) return;
                const foiaIdToUpdate = editFoiaIdInput.value;
                if (!foiaIdToUpdate) {
                    if(editFoiaStatusArea) showLoadingMessage(editFoiaStatusArea, 'Error: FOIA ID is missing.', false);
                    if(editFoiaStatusArea) hideLoadingMessage(editFoiaStatusArea, 3000); return;
                }
                const updatedFoiaData = {
                    foiaTitle: editFoiaTitleInput.value.trim(),
                    foiaType: editFoiaTypeInput.value.trim(),
                    submittedBy: editSubmittedBySelectFoia.value,
                    status: editFoiaStatusSelect.value,
                    foiaSummary: editFoiaSummaryTextarea.value.trim(),
                    generatedQuestionsFoia: editGeneratedQuestionsTextareaFoia.value.trim(), // FOIA specific field name
                    foiaDeadlines: editFoiaDeadlinesTextarea.value.trim(),
                    foiaSubmissionFormat: editFoiaSubmissionFormatTextarea.value.trim(),
                    foiaKeyRequirements: editFoiaKeyRequirementsTextarea.value.trim(),
                    foiaStakeholders: editFoiaStakeholdersTextarea.value.trim(),
                    foiaRisks: editFoiaRisksTextarea.value.trim(),
                    // foiaFileNames are not typically edited this way, they are part of original upload
                };
                if(editFoiaStatusArea) showLoadingMessage(editFoiaStatusArea, 'Saving FOIA changes...');
                try {
                    const response = await fetch(`/api/foia-analysis/${foiaIdToUpdate}`, { // FOIA endpoint
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(updatedFoiaData)
                    });
                    if (!response.ok) {
                        const errorResult = await response.json().catch(() => ({ error: 'Failed to save FOIA changes. Server error.' }));
                        throw new Error(errorResult.error || `HTTP error! Status: ${response.status}`);
                    }
                    const result = await response.json();
                    if(editFoiaStatusArea) showLoadingMessage(editFoiaStatusArea, result.message || 'FOIA changes saved!', false);
                    await loadSavedFoiaAnalysesInitial(); // Refresh list
                    setTimeout(() => closeModal(editFoiaModal), 2000);
                } catch (error) {
                    console.error('Error saving FOIA details:', error);
                    if(editFoiaStatusArea) showLoadingMessage(editFoiaStatusArea, `Error: ${error.message}`, false);
                    if(editFoiaStatusArea) hideLoadingMessage(editFoiaStatusArea, 5000);
                }
            });
        }

        // --- Rendering FOIA Analyses List ---
        function renderFoiaAnalysesList() {
            if (!savedAnalysesListDivFoia || !noSavedAnalysesPFoia) return;
            savedAnalysesListDivFoia.innerHTML = ''; // Clear existing list
            let filteredAnalyses = [...allFetchedFoiaAnalyses];

            // Filter by status
            if (currentFoiaStatusFilter !== 'all_statuses') {
                filteredAnalyses = filteredAnalyses.filter(a => a.status === currentFoiaStatusFilter);
            }

            // Sort analyses
            filteredAnalyses.sort((a, b) => {
                let valA = a[currentFoiaSortKey];
                let valB = b[currentFoiaSortKey];
                if (currentFoiaSortKey === 'analysisDate') { // Handle Firestore Timestamp
                    valA = a.analysisDate && a.analysisDate._seconds ? Number(a.analysisDate._seconds) : 0;
                    valB = b.analysisDate && b.analysisDate._seconds ? Number(b.analysisDate._seconds) : 0;
                } else { // Handle string sorting
                    valA = (typeof valA === 'string' ? valA.toLowerCase() : (valA || '')).toString();
                    valB = (typeof valB === 'string' ? valB.toLowerCase() : (valB || '')).toString();
                }
                if (valA < valB) return currentFoiaSortOrder === 'asc' ? -1 : 1;
                if (valA > valB) return currentFoiaSortOrder === 'asc' ? 1 : -1;
                return 0;
            });

            if (filteredAnalyses.length === 0) {
                noSavedAnalysesPFoia.style.display = 'block';
                noSavedAnalysesPFoia.textContent = currentFoiaStatusFilter === 'all_statuses' ? 
                    `No FOIA analyses found.` : `No FOIA analyses found for "${currentFoiaStatusFilter}" category.`;
            } else {
                noSavedAnalysesPFoia.style.display = 'none';
                filteredAnalyses.forEach(analysis => {
                    const itemDiv = document.createElement('div');
                    itemDiv.className = 'analyzed-rfp-item'; // Reusing RFP styling for list items
                    const displayTitle = analysis.foiaTitle || (analysis.foiaFileNames && analysis.foiaFileNames.length > 0 ? analysis.foiaFileNames.join(', ') : 'N/A');
                    let formattedDateTime = 'N/A';
                    if (analysis.analysisDate && typeof analysis.analysisDate._seconds === 'number') {
                        const date = new Date(analysis.analysisDate._seconds * 1000);
                        if (!isNaN(date.valueOf())) { // Check if date is valid
                            formattedDateTime = `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
                        }
                    }
                    const statusDotClass = analysis.status === 'active' ? 'green' :
                                       analysis.status === 'not_pursuing' ? 'red' :
                                       analysis.status === 'archived' ? 'grey' :
                                       'orange'; // Default for 'analyzed' or other
                    itemDiv.innerHTML = `
                        <span class="rfp-col-title" title="${displayTitle}">${displayTitle}</span>
                        <span class="rfp-col-type">${analysis.foiaType || 'N/A'}</span>
                        <span class="rfp-col-owner">${analysis.submittedBy || 'N/A'}</span>
                        <span class="rfp-col-date">${formattedDateTime}</span>
                        <span class="rfp-col-status"><span class="rfp-status-dot ${statusDotClass}" title="${analysis.status || 'analyzed'}"></span></span>
                        <span class="rfp-col-actions"></span>`;
                    
                    const actionsSpan = itemDiv.querySelector('.rfp-col-actions');
                    // View Details Link
                    const viewLink = document.createElement('a');
                    viewLink.href = '#'; viewLink.className = 'rfp-view-details action-icon'; // Reuse styling
                    viewLink.dataset.id = analysis.id;
                    viewLink.innerHTML = '<i class="fas fa-eye" aria-hidden="true"></i>';
                    viewLink.title = "View FOIA Analysis Details";
                    viewLink.addEventListener('click', async (e) => {
                        e.preventDefault();
                        const analysisId = e.currentTarget.dataset.id;
                        const foiaItemDiv = e.currentTarget.closest('.analyzed-rfp-item');
                        const titleElement = foiaItemDiv ? foiaItemDiv.querySelector('.rfp-col-title') : null;
                        const loadingMessageTitle = titleElement ? titleElement.textContent : 'Selected FOIA';
                        
                        openModal(viewSavedFoiaDetailsSection);
                        if (viewSavedFoiaDetailsSection) viewSavedFoiaDetailsSection.dataset.currentViewingId = analysisId;
                        if (viewFoiaMainTitleHeading) viewFoiaMainTitleHeading.textContent = `Details for: ${loadingMessageTitle}`;
                        if(viewFoiaStatusArea) showLoadingMessage(viewFoiaStatusArea, `Loading analysis for ${loadingMessageTitle}...`);
                        if (viewAnalysisResultsAreaFoia) viewAnalysisResultsAreaFoia.style.display = 'none';
                        clearViewFoiaAnalysisResultTabs();
                        
                        let loadErrorOccurred = false;
                        try {
                            const detailResponse = await fetch(`/api/foia-analysis/${analysisId}`); // FOIA endpoint
                            if (!detailResponse.ok) throw new Error((await detailResponse.json()).error || 'Failed to fetch FOIA details.');
                            const detailedAnalysis = await detailResponse.json();
                            const savedPromptsForThisAnalysis = detailedAnalysis.analysisPrompts || {};

                            // Populate tabs for viewing saved FOIA
                            Object.keys(PROMPT_CONFIG_FOIA).forEach(keySuffix => {
                                const contentDiv = viewTabContentMapFoia[keySuffix]; // Use FOIA specific map
                                let sectionDataField; // Determine which field in `detailedAnalysis` holds the content for this tab
                                 // Mapping based on how data is likely stored from PROMPT_CONFIG_FOIA
                                if (keySuffix === 'summary') sectionDataField = 'foiaSummary';
                                else if (keySuffix === 'questions') sectionDataField = 'generatedQuestionsFoia'; // Adjusted for FOIA
                                else if (keySuffix === 'deadlines') sectionDataField = 'foiaDeadlines'; // This will hold both dates and format for FOIA in DB
                                else if (keySuffix === 'submissionFormat') sectionDataField = 'foiaSubmissionFormat'; // This will hold both dates and format for FOIA in DB
                                else if (keySuffix === 'requirements') sectionDataField = 'foiaKeyRequirements';
                                else if (keySuffix === 'stakeholders') sectionDataField = 'foiaStakeholders';
                                else if (keySuffix === 'risks') sectionDataField = 'foiaRisks';
                                else { // Fallback or for custom sections if any
                                    sectionDataField = `foia${keySuffix.charAt(0).toUpperCase() + keySuffix.slice(1)}`;
                                }

                                const sectionContent = detailedAnalysis[sectionDataField] || "N/A";
                                const promptTextUsed = savedPromptsForThisAnalysis[keySuffix] || PROMPT_CONFIG_FOIA[keySuffix]?.defaultText;
                                
                                if (contentDiv) {
                                    formatAndDisplayFoiaContentWithPrompt(contentDiv, keySuffix, promptTextUsed, sectionContent);
                                }
                            });
                            if (viewAnalysisResultsAreaFoia) viewAnalysisResultsAreaFoia.style.display = 'block';
                            const firstViewTabLinkFoia = document.querySelector('#view-saved-foia-details-section.modal-active .tabs-container .tab-link');
                            if (firstViewTabLinkFoia) { // Auto-click the first tab
                                document.querySelectorAll('#view-saved-foia-details-section.modal-active .tabs-container .tab-link').forEach(tl => tl.classList.remove('active'));
                                firstViewTabLinkFoia.classList.add('active');
                                const tabNameToOpen = firstViewTabLinkFoia.getAttribute('onclick').match(/'([^']*)'/)[1];
                                if (window.openFoiaViewTab) window.openFoiaViewTab(null, tabNameToOpen); 
                            }
                            const titleForStatus = detailedAnalysis.foiaTitle || (detailedAnalysis.foiaFileNames ? detailedAnalysis.foiaFileNames[0] : 'Document');
                            if(viewFoiaStatusArea) showLoadingMessage(viewFoiaStatusArea, `Displaying: ${titleForStatus}`, false);
                        } catch (loadError) {
                             loadErrorOccurred = true;
                             if(viewFoiaStatusArea) showLoadingMessage(viewFoiaStatusArea, `Error loading FOIA: ${loadError.message}`, false);
                        } finally {
                            if(viewFoiaStatusArea) setTimeout(() => hideLoadingMessage(viewFoiaStatusArea), loadErrorOccurred ? 5000 : 2000);
                        }
                    });
                    actionsSpan.appendChild(viewLink);

                    // Actions Dropdown
                    const dropdownContainer = document.createElement('div');
                    dropdownContainer.className = 'actions-dropdown-container';
                    const dropdownTrigger = document.createElement('button');
                    dropdownTrigger.className = 'actions-dropdown-trigger action-icon';
                    dropdownTrigger.innerHTML = '<i class="fas fa-ellipsis-v"></i>';
                    dropdownTrigger.title = "More actions";
                    const dropdownMenu = document.createElement('div');
                    dropdownMenu.className = 'actions-dropdown-menu';
                    dropdownTrigger.addEventListener('click', (e) => {
                        e.stopPropagation(); // Prevent click from bubbling to document listener immediately
                        // Close other open dropdowns
                        document.querySelectorAll('.actions-dropdown-menu').forEach(menu => {
                            if (menu !== dropdownMenu) menu.style.display = 'none';
                        });
                        dropdownMenu.style.display = dropdownMenu.style.display === 'block' ? 'none' : 'block';
                    });
                    function addFoiaDropdownItem(iconClass, text, clickHandler) {
                        const item = document.createElement('button');
                        item.className = 'dropdown-item';
                        item.innerHTML = `<i class="fas ${iconClass}"></i> ${text}`;
                        item.addEventListener('click', (e) => {
                            e.stopPropagation(); clickHandler(); dropdownMenu.style.display = 'none';
                        });
                        dropdownMenu.appendChild(item);
                    }
                    addFoiaDropdownItem('fa-edit', 'Edit Details', () => openEditFoiaModal(analysis)); // Pass full analysis object
                    dropdownMenu.appendChild(document.createElement('div')).className = 'dropdown-divider';
                    // Status change actions (similar to RFP, adjust if FOIA statuses are different)
                    if (analysis.status === 'analyzed') {
                        addFoiaDropdownItem('fa-check-circle', 'Move to Active', () => updateFoiaStatus(analysis.id, 'active'));
                        addFoiaDropdownItem('fa-times-circle', 'Move to Not Pursuing', () => updateFoiaStatus(analysis.id, 'not_pursuing'));
                        addFoiaDropdownItem('fa-archive', 'Archive', () => updateFoiaStatus(analysis.id, 'archived'));
                    } else if (analysis.status === 'active') {
                        addFoiaDropdownItem('fa-times-circle', 'Move to Not Pursuing', () => updateFoiaStatus(analysis.id, 'not_pursuing'));
                        addFoiaDropdownItem('fa-inbox', 'Move to Analyzed', () => updateFoiaStatus(analysis.id, 'analyzed'));
                        addFoiaDropdownItem('fa-archive', 'Archive', () => updateFoiaStatus(analysis.id, 'archived'));
                    } else if (analysis.status === 'not_pursuing') {
                        addFoiaDropdownItem('fa-check-circle', 'Move to Active', () => updateFoiaStatus(analysis.id, 'active'));
                        addFoiaDropdownItem('fa-inbox', 'Move to Analyzed', () => updateFoiaStatus(analysis.id, 'analyzed'));
                        addFoiaDropdownItem('fa-archive', 'Archive', () => updateFoiaStatus(analysis.id, 'archived'));
                    } else if (analysis.status === 'archived') {
                        addFoiaDropdownItem('fa-box-open', 'Unarchive (to Analyzed)', () => updateFoiaStatus(analysis.id, 'analyzed'));
                        addFoiaDropdownItem('fa-check-circle', 'Move to Active', () => updateFoiaStatus(analysis.id, 'active'));
                    } else { // Default set of actions if status is unknown or different
                        addFoiaDropdownItem('fa-check-circle', 'Move to Active', () => updateFoiaStatus(analysis.id, 'active'));
                        addFoiaDropdownItem('fa-times-circle', 'Move to Not Pursuing', () => updateFoiaStatus(analysis.id, 'not_pursuing'));
                        addFoiaDropdownItem('fa-archive', 'Archive', () => updateFoiaStatus(analysis.id, 'archived'));
                    }
                    dropdownMenu.appendChild(document.createElement('div')).className = 'dropdown-divider';
                    addFoiaDropdownItem('fa-trash-alt', 'Delete FOIA', () => deleteFoiaAnalysis(analysis.id, displayTitle));
                    
                    dropdownContainer.appendChild(dropdownTrigger);
                    dropdownContainer.appendChild(dropdownMenu);
                    actionsSpan.appendChild(dropdownContainer);
                    savedAnalysesListDivFoia.appendChild(itemDiv);
                });
            }
        }

        // Event listeners for FOIA list tabs and sorting headers
        if (foiaListTabsContainer) {
            foiaListTabsContainer.addEventListener('click', (e) => {
                if (e.target.classList.contains('rfp-list-tab-button')) { // Reuse class for styling
                    foiaListTabsContainer.querySelectorAll('.rfp-list-tab-button').forEach(btn => btn.classList.remove('active'));
                    e.target.classList.add('active');
                    currentFoiaStatusFilter = e.target.dataset.statusFilter;
                    renderFoiaAnalysesList();
                }
            });
        }
        document.querySelectorAll('#saved-analyses-header-foia .sortable-header').forEach(header => {
            header.addEventListener('click', () => {
                const sortKey = header.dataset.sortKey;
                if (currentFoiaSortKey === sortKey) {
                    currentFoiaSortOrder = currentFoiaSortOrder === 'asc' ? 'desc' : 'asc';
                } else {
                    currentFoiaSortKey = sortKey;
                    currentFoiaSortOrder = 'asc'; 
                }
                // Update visual indicator for sort order (optional)
                document.querySelectorAll('#saved-analyses-header-foia .sortable-header').forEach(h => {
                    let text = h.textContent.replace(/ [⇅↑↓]$/, ''); 
                    if (h.dataset.sortKey === currentFoiaSortKey) {
                        text += currentFoiaSortOrder === 'asc' ? ' ↑' : ' ↓';
                    } else {
                        text += ' ⇅'; 
                    }
                    h.textContent = text;
                });
                renderFoiaAnalysesList();
            });
        });

        // --- Form Submission for New FOIA Analysis ---
        if (foiaForm) {
            foiaForm.addEventListener('submit', async function (event) {
                event.preventDefault();
                const foiaTitleValue = document.getElementById('foiaTitle').value.trim();
                const foiaTypeValue = document.getElementById('foiaType').value.trim(); // Assuming this is a text input now
                const submittedByValue = document.getElementById('submittedByFoia').value;
                const foiaFiles = foiaFileUploadInput.files; // Get all files from the single input

                if(modalAnalysisStatusAreaFoia) showLoadingMessage(modalAnalysisStatusAreaFoia, "Starting FOIA analysis...");
                if (modalAnalysisResultsAreaFoia) modalAnalysisResultsAreaFoia.style.display = 'none';
                
                if (!foiaFiles || foiaFiles.length === 0) {
                    if(modalAnalysisStatusAreaFoia) showLoadingMessage(modalAnalysisStatusAreaFoia, "Please upload at least one FOIA document.", false);
                    if(modalAnalysisStatusAreaFoia) hideLoadingMessage(modalAnalysisStatusAreaFoia, 3000); return;
                }

                const foiaFileNamesArray = [];
                for (let i = 0; i < foiaFiles.length; i++) {
                    if (foiaFiles[i].type !== "application/pdf") {
                        if(modalAnalysisStatusAreaFoia) showLoadingMessage(modalAnalysisStatusAreaFoia, `Invalid file type: ${foiaFiles[i].name}. Please upload PDFs only.`, false);
                        if(modalAnalysisStatusAreaFoia) hideLoadingMessage(modalAnalysisStatusAreaFoia, 3000); return;
                    }
                    foiaFileNamesArray.push(foiaFiles[i].name);
                }

                let combinedFoiaText = "";
                try {
                    for (let i = 0; i < foiaFiles.length; i++) {
                        const file = foiaFiles[i];
                        if(modalAnalysisStatusAreaFoia) showLoadingMessage(modalAnalysisStatusAreaFoia, `Extracting text from ${file.name} (${i + 1}/${foiaFiles.length})...`);
                        const text = await extractTextFromPdf(file);
                        combinedFoiaText += `--- START OF DOCUMENT: ${file.name} ---\n${text}\n--- END OF DOCUMENT: ${file.name} ---\n\n`;
                        if (!text || text.trim().length < 10) {
                            console.warn(`Minimal text extracted from ${file.name}.`);
                        }
                    }
                    if (combinedFoiaText.trim().length < 50) { // Check total length
                        throw new Error("Insufficient total text extracted from PDF(s) for FOIA analysis.");
                    }
                } catch (error) {
                    if(modalAnalysisStatusAreaFoia) showLoadingMessage(modalAnalysisStatusAreaFoia, `PDF Error: ${error.message}`, false);
                    if(modalAnalysisStatusAreaFoia) hideLoadingMessage(modalAnalysisStatusAreaFoia, 5000); return;
                }

                if (!serverFoiaPrompts) { // Ensure FOIA prompts are loaded
                    if(modalAnalysisStatusAreaFoia) showLoadingMessage(modalAnalysisStatusAreaFoia, "Loading latest FOIA prompt settings...", true);
                    await fetchFoiaPromptsFromServer();
                    if (!serverFoiaPrompts) {
                        if(modalAnalysisStatusAreaFoia) showLoadingMessage(modalAnalysisStatusAreaFoia, "Error: Could not load FOIA prompt settings. Aborting.", false);
                        if(modalAnalysisStatusAreaFoia) hideLoadingMessage(modalAnalysisStatusAreaFoia, 4000);
                        if (generateAnalysisButtonFoia) generateAnalysisButtonFoia.disabled = false;
                        return;
                    }
                }
                
                const aiPromptForFoia = constructFullFoiaAnalysisPrompt(combinedFoiaText);
                console.log("Constructed AI Prompt for FOIA Submission:\n", aiPromptForFoia);

                const currentFoiaAnalysisPrompts = {}; 
                Object.keys(PROMPT_CONFIG_FOIA).forEach(keySuffix => {
                    currentFoiaAnalysisPrompts[keySuffix] = getStoredFoiaSectionPrompt(keySuffix); 
                });
                
                let parsedAISectionsFoia = {};
                try {
                    if(modalAnalysisStatusAreaFoia) showLoadingMessage(modalAnalysisStatusAreaFoia, "AI is analyzing FOIA document(s)...");
                    const response = await fetch('/api/generate', { // Generic AI generation endpoint
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ prompt: aiPromptForFoia })
                    });
                    if (!response.ok) throw new Error((await response.json()).error || 'AI API error during FOIA analysis.');
                    const data = await response.json();
                    let rawAiOutput = data.generatedText.replace(/^```[a-z]*\s*/im, '').replace(/\s*```$/m, '');
                    console.log("Raw AI Output from Gemini (New FOIA):\n", rawAiOutput);
                    
                    const parseFoiaSection = (output, delimiterKey) => {
                        const regex = new RegExp(`###${delimiterKey}_START###([\\s\\S]*?)###${delimiterKey}_END###`);
                        const match = output.match(regex);
                        return match && match[1] ? match[1].trim() : `${delimiterKey.replace(/_/g, ' ')} not found in AI response.`;
                    };
                    Object.keys(PROMPT_CONFIG_FOIA).forEach(keySuffix => {
                        parsedAISectionsFoia[keySuffix] = parseFoiaSection(rawAiOutput, PROMPT_CONFIG_FOIA[keySuffix].delimiterKey);
                    });

                    clearModalFoiaAnalysisResultTabs();
                    Object.keys(PROMPT_CONFIG_FOIA).forEach(keySuffix => {
                        const contentDiv = modalTabContentMapFoia[keySuffix];
                        const promptText = currentFoiaAnalysisPrompts[keySuffix]; 
                        const sectionContent = parsedAISectionsFoia[keySuffix];
                        if (contentDiv) {
                             formatAndDisplayFoiaContentWithPrompt(contentDiv, keySuffix, promptText, sectionContent);
                        } else {
                            console.warn(`Modal FOIA Tab Content Div not found for key: ${keySuffix}`);
                        }
                    });

                    if (modalAnalysisResultsAreaFoia) modalAnalysisResultsAreaFoia.style.display = 'block';
                    const activeModalResultTabFoia = document.querySelector('#new-foia-modal .tabs-container .tab-link');
                    if (activeModalResultTabFoia) { // Auto-click first tab
                        document.querySelectorAll('#new-foia-modal .tabs-container .tab-link').forEach(tl => tl.classList.remove('active'));
                        activeModalResultTabFoia.classList.add('active');
                        const tabNameToOpen = activeModalResultTabFoia.getAttribute('onclick').match(/'([^']*)'/)[1];
                        if (window.openFoiaModalTab) window.openFoiaModalTab(null, tabNameToOpen); 
                    }
                    
                    if(modalAnalysisStatusAreaFoia) showLoadingMessage(modalAnalysisStatusAreaFoia, "FOIA analysis complete! Saving results...", false);
                    try {
                        const savePayloadFoia = {
                            foiaTitle: foiaTitleValue || "", 
                            foiaType: foiaTypeValue, 
                            submittedBy: submittedByValue,
                            foiaFileNames: foiaFileNamesArray, // Save array of names
                            // Map parsed sections to payload keys
                            foiaSummary: parsedAISectionsFoia.summary,
                            generatedQuestionsFoia: parsedAISectionsFoia.questions, // FOIA specific name
                            foiaDeadlines: parsedAISectionsFoia.deadlines, // From combined dates/format
                            foiaSubmissionFormat: parsedAISectionsFoia.submissionFormat, // From combined
                            foiaKeyRequirements: parsedAISectionsFoia.requirements,
                            foiaStakeholders: parsedAISectionsFoia.stakeholders,
                            foiaRisks: parsedAISectionsFoia.risks,
                            status: 'analyzed',
                            analysisPrompts: currentFoiaAnalysisPrompts 
                        };
                        const saveResponse = await fetch('/api/foia-analysis', { // FOIA specific save endpoint
                            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(savePayloadFoia)
                        });
                        if (!saveResponse.ok) throw new Error((await saveResponse.json()).error || 'Failed to save FOIA analysis.');
                        if(modalAnalysisStatusAreaFoia) showLoadingMessage(modalAnalysisStatusAreaFoia, "FOIA analysis complete and results saved!", false);
                        await loadSavedFoiaAnalysesInitial(); // Refresh list
                    } catch (saveError) {
                        if(modalAnalysisStatusAreaFoia) showLoadingMessage(modalAnalysisStatusAreaFoia, `FOIA analysis complete, but failed to save: ${saveError.message}`, false);
                    }
                } catch (error) {
                    if(modalAnalysisStatusAreaFoia) showLoadingMessage(modalAnalysisStatusAreaFoia, `FOIA Processing Error: ${error.message}`, false);
                } finally {
                    if(modalAnalysisStatusAreaFoia) hideLoadingMessage(modalAnalysisStatusAreaFoia, 7000);
                    if (generateAnalysisButtonFoia) generateAnalysisButtonFoia.disabled = false;
                }
            });
        }

        // --- Initial Load for FOIA Page ---
        async function loadSavedFoiaAnalysesInitial() {
            if(foiaListStatusArea) showLoadingMessage(foiaListStatusArea, "Loading saved FOIA analyses...", true);
            try {
                const response = await fetch('/api/foia-analyses'); // FOIA specific endpoint
                if (!response.ok) throw new Error((await response.json()).error || 'Failed to fetch FOIA analyses.');
                allFetchedFoiaAnalyses = await response.json();
                renderFoiaAnalysesList();
            } catch (error) {
                if(savedAnalysesListDivFoia) savedAnalysesListDivFoia.innerHTML = `<p class="loading-text" style="color:red; text-align:center;">Failed to load FOIA: ${error.message}</p>`;
                if(noSavedAnalysesPFoia) noSavedAnalysesPFoia.style.display = 'block';
                if(noSavedAnalysesPFoia) noSavedAnalysesPFoia.textContent = `Failed to load FOIA analyses.`;
            } finally {
                if(foiaListStatusArea) hideLoadingMessage(foiaListStatusArea);
            }
        }
        
        // Auto-activate first tab if viewing saved details (FOIA)
        const firstActiveViewTabFoia = document.querySelector('#view-saved-foia-details-section.modal-active .tabs-container .tab-link');
        if (firstActiveViewTabFoia && viewSavedFoiaDetailsSection && viewSavedFoiaDetailsSection.classList.contains('modal-active')) {
            const tabNameToOpen = firstActiveViewTabFoia.getAttribute('onclick').match(/'([^']*)'/)[1];
            const tabElement = document.getElementById(tabNameToOpen);
            if (window.openFoiaViewTab && tabElement && tabElement.style.display !== 'block') { 
                window.openFoiaViewTab(null, tabNameToOpen);
            }
        }

        async function initializeFoiaPage() {
            await loadSavedFoiaAnalysesInitial(); 
            await fetchFoiaPromptsFromServer();   
            if (promptSectionSelectorFoia) {      
                loadSelectedFoiaSectionPromptToTextarea(); 
            }
        }

        initializeFoiaPage(); // Start the FOIA page logic

        // Global click listener to close dropdowns if clicked outside
        document.addEventListener('click', (e) => {
            const openDropdowns = document.querySelectorAll('.actions-dropdown-menu'); // Standard class
            let clickedInsideADropdownOrTrigger = false;
            const triggerElement = e.target.closest('.actions-dropdown-trigger'); // Standard class

            openDropdowns.forEach(menu => {
                if (menu.contains(e.target) || (triggerElement && menu.previousElementSibling === triggerElement) ) {
                    clickedInsideADropdownOrTrigger = true;
                }
            });
            if (!clickedInsideADropdownOrTrigger) {
                openDropdowns.forEach(menu => menu.style.display = 'none');
            }
        });

    } // End of initializeFoiaAppLogic function

}); // End of DOMContentLoaded
