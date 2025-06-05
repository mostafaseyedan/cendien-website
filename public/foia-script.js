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

    const correctUsername = "Cendien"; 
    const correctPassword = "rfpanalyzer"; 
    const sessionDuration = 24 * 60 * 60 * 1000; // 24 hours
    const loginTimestampKeyFoia = 'foiaAnalyzerLoginTimestamp'; 

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
        initializeFoiaAppLogic(); 
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
        
        const newFoiaModal = document.getElementById('new-foia-modal');
        const openNewFoiaModalButton = document.getElementById('open-new-foia-modal-button');
        const modalCloseButtonFoia = document.getElementById('modal-close-button-foia');
        const modalFormTitleFoia = document.getElementById('modal-title-foia');

        const foiaForm = document.getElementById('foia-details-form');
        const foiaFileUploadInput = document.getElementById('foiaFileUpload'); 
        const generateAnalysisButtonFoia = document.getElementById('generate-analysis-button-foia');
        const modalAnalysisStatusAreaFoia = document.getElementById('modal-analysis-status-area-foia');
        const modalAnalysisResultsAreaFoia = document.getElementById('modal-analysis-results-area-foia');

        // Updated modalTabContentMapFoia to match new HTML structure
        const modalTabContentMapFoia = {
            summary: document.getElementById('modal-summary-result-content-foia'),
            proposalComparison: document.getElementById('modal-comparison-rating-result-content-foia'), 
            insightsAnalysis: document.getElementById('modal-insights-analysis-result-content-foia'), 
            pricingIntelligence: document.getElementById('modal-financial-intelligence-result-content-foia'), 
            marketTrends: document.getElementById('modal-context-impact-result-content-foia'), 
            tasksWorkPlan: document.getElementById('modal-actionable-items-result-content-foia'), 
        };
        
        const viewSavedFoiaDetailsSection = document.getElementById('view-saved-foia-details-section');
        const viewFoiaMainTitleHeading = document.getElementById('view-foia-main-title-heading');
        const closeViewFoiaDetailsButton = document.getElementById('close-view-foia-details-button');
        const viewFoiaStatusArea = document.getElementById('view-foia-status-area');
        const viewAnalysisResultsAreaFoia = document.getElementById('view-analysis-results-area-foia');
        const viewFoiaModalActionTrigger = document.getElementById('view-foia-modal-action-trigger'); 
        const viewFoiaModalActionsMenu = document.getElementById('view-foia-modal-actions-menu'); 
        
        // Updated viewTabContentMapFoia to match new HTML structure
        const viewTabContentMapFoia = {
            summary: document.getElementById('view-summary-result-content-foia'),
            proposalComparison: document.getElementById('view-comparison-rating-result-content-foia'), 
            insightsAnalysis: document.getElementById('view-insights-analysis-result-content-foia'),   
            pricingIntelligence: document.getElementById('view-financial-intelligence-result-content-foia'),
            marketTrends: document.getElementById('view-context-impact-result-content-foia'),      
            tasksWorkPlan: document.getElementById('view-actionable-items-result-content-foia'),   
        };
        
        const editFoiaModal = document.getElementById('edit-foia-modal');
        const editFoiaModalCloseButton = document.getElementById('edit-foia-modal-close-button');
        const editFoiaModalTitle = document.getElementById('edit-foia-modal-title');
        const editFoiaForm = document.getElementById('edit-foia-details-form');
        const editFoiaIdInput = document.getElementById('editFoiaId');
        const editFoiaTitleInput = document.getElementById('editFoiaTitle');
        const editFoiaFileNamesTextarea = document.getElementById('editFoiaFileNames'); 
        const editFoiaTypeInput = document.getElementById('editFoiaType');
        const editSubmittedBySelectFoia = document.getElementById('editSubmittedByFoia');
        const editFoiaStatusSelect = document.getElementById('editFoiaStatus');
        
        // Updated textareas for edit modal
        const editFoiaSummaryTextarea = document.getElementById('editFoiaSummary');
        const editFoiaProposalComparisonTextarea = document.getElementById('editFoiaProposalComparison'); 
        const editFoiaInsightsAnalysisTextarea = document.getElementById('editFoiaInsightsAnalysis'); 
        const editFoiaPricingIntelligenceTextarea = document.getElementById('editFoiaPricingIntelligence'); 
        const editFoiaMarketTrendsTextarea = document.getElementById('editFoiaMarketTrends'); 
        const editFoiaTasksWorkPlanTextarea = document.getElementById('editFoiaTasksWorkPlan'); 

        const saveEditedFoiaButton = document.getElementById('save-edited-foia-button');
        const cancelEditFoiaButton = document.getElementById('cancel-edit-foia-button');
        const editFoiaStatusArea = document.getElementById('edit-foia-status-area');

        const savedAnalysesListDivFoia = document.getElementById('saved-analyses-list-foia');
        const noSavedAnalysesPFoia = document.getElementById('no-saved-analyses-foia');
        const foiaListTabsContainer = document.getElementById('foia-list-tabs');
        const foiaListStatusArea = document.getElementById('foia-list-status-area');
        const yearSpanFoia = document.getElementById('current-year-foia');

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
        let currentlyViewedFoiaAnalysis = null; 

        const FOIA_PROMPT_MAIN_INSTRUCTION = "Please analyze the following Freedom of Information Act (FOIA) document(s).\nProvide the following distinct sections in your response, each clearly delimited:";
        const FOIA_PROMPT_SECTION_DELIMITER_FORMAT = "\n\n###{SECTION_KEY_UPPER}_START###\n[Content for {SECTION_KEY_UPPER}]\n###{SECTION_KEY_UPPER}_END###";
        const FOIA_PROMPT_TEXT_SUFFIX = "\n\nFOIA Document Text:\n---\n{FOIA_TEXT_PLACEHOLDER}\n---";

        // Updated PROMPT_CONFIG_FOIA with databaseKey for clarity
        const PROMPT_CONFIG_FOIA = {
            summary: {
                defaultText: "Provide a concise overview of the FOIA document content, highlighting the main subject, key information disclosed or requested, and any immediate takeaways.",
                delimiterKey: "SUMMARY",
                databaseKey: "foiaSummary" 
            },
            proposalComparison: { 
                defaultText: "If the FOIA response includes multiple documents or distinct sections, compare them. Assess the relevance and completeness of the information provided in relation to the presumed request or subject matter. Assign a qualitative rating (e.g., High, Medium, Low relevance/completeness) if applicable.",
                delimiterKey: "PROPOSAL_COMPARISON_RATING",
                databaseKey: "foiaProposalComparison"
            },
            insightsAnalysis: { 
                defaultText: "Extract key insights, patterns, or significant findings from the FOIA documents. Analyze the implications of the disclosed information.",
                delimiterKey: "INSIGHTS_ANALYSIS",
                databaseKey: "foiaInsightsAnalysis"
            },
            pricingIntelligence: { 
                defaultText: "Identify any information related to fees (e.g., search, duplication, review costs), fee waivers, or any other financial data or budgetary implications mentioned in the FOIA documents.",
                delimiterKey: "FINANCIAL_INTELLIGENCE",
                databaseKey: "foiaPricingIntelligence"
            },
            marketTrends: { 
                defaultText: "Analyze the disclosed information in the context of public interest, current events, or any related trends. What is the broader significance or potential impact of this information?",
                delimiterKey: "CONTEXT_IMPACT",
                databaseKey: "foiaMarketTrends"
            },
            tasksWorkPlan: { 
                defaultText: "Based on the information disclosed, outline any potential next steps, follow-up actions, or tasks that might be necessary for the user (e.g., further investigation, data analysis, public dissemination).",
                delimiterKey: "ACTIONABLE_ITEMS",
                databaseKey: "foiaTasksWorkPlan"
            }
        };


        if (yearSpanFoia && !yearSpanFoia.textContent) {
            yearSpanFoia.textContent = new Date().getFullYear();
        }

        async function fetchFoiaPromptsFromServer() {
            if (foiaPromptsLastFetchedFromServer && serverFoiaPrompts) {
                return serverFoiaPrompts;
            }
            if(promptSaveStatusFoia) showLoadingMessage(promptSaveStatusFoia, 'Loading FOIA prompt settings...', true);
            try {
                const response = await fetch('/api/foia-prompt-settings'); 
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
                // Ensure all keys from PROMPT_CONFIG_FOIA exist in serverFoiaPrompts, using defaults if not
                Object.keys(PROMPT_CONFIG_FOIA).forEach(key => {
                    if (!serverFoiaPrompts.hasOwnProperty(key)) {
                        console.warn(`Prompt for '${key}' not found on server, using local default.`);
                        serverFoiaPrompts[key] = PROMPT_CONFIG_FOIA[key].defaultText;
                    }
                });
                return serverFoiaPrompts;
            } catch (error) {
                console.error('Error fetching FOIA prompts:', error);
                if(promptSaveStatusFoia) showLoadingMessage(promptSaveStatusFoia, `Error loading FOIA prompts: ${error.message}. Using local defaults.`, false);
                serverFoiaPrompts = {}; 
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
                const response = await fetch('/api/foia-prompt-settings', { 
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

        function openModal(modalElement) {
            if (modalElement) {
                [newFoiaModal, editFoiaModal, viewSavedFoiaDetailsSection, promptSettingsModalFoia].forEach(m => {
                    if (m && m !== modalElement) {
                        m.style.display = 'none';
                        if (m.classList.contains('modal-active')) m.classList.remove('modal-active');
                    }
                });
                modalElement.style.display = 'block'; 
                if (modalElement.id === 'view-saved-foia-details-section') { 
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
                    currentlyViewedFoiaAnalysis = null; 
                 }
                document.body.style.overflow = '';
            }
        }
        
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
        if (viewSavedFoiaDetailsSection) { 
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
         if (editFoiaModal) { 
            editFoiaModal.addEventListener('click', (event) => {
                if (event.target === editFoiaModal) closeModal(editFoiaModal);
            });
        }
        
        function clearModalFoiaAnalysisResultTabs() { 
            Object.keys(modalTabContentMapFoia).forEach(key => {
                const div = modalTabContentMapFoia[key];
                if (div) {
                     div.innerHTML = '';
                } else {
                    console.warn(`Modal tab content div for key "${key}" not found during clear. Check modalTabContentMapFoia and HTML IDs.`);
                }
            });
        }
        function clearViewFoiaAnalysisResultTabs() { 
             Object.keys(viewTabContentMapFoia).forEach(key => {
                const div = viewTabContentMapFoia[key];
                if (div) {
                     div.innerHTML = '';
                } else {
                    console.warn(`View tab content div for key "${key}" not found during clear. Check viewTabContentMapFoia and HTML IDs.`);
                }
            });
        }

        function showLoadingMessage(areaElement, message = "Processing...", showSpinner = true) {
            if (!areaElement) return;
            areaElement.style.display = 'flex'; 
            areaElement.innerHTML = `${showSpinner ? '<div class="spinner"></div>' : ''}<p class="loading-text">${message}</p>`;
            if (areaElement === modalAnalysisStatusAreaFoia && generateAnalysisButtonFoia && showSpinner) {
                generateAnalysisButtonFoia.disabled = true;
            } else if (areaElement === editFoiaStatusArea && saveEditedFoiaButton && showSpinner) {
                saveEditedFoiaButton.disabled = true;
            }
             if (areaElement === promptSaveStatusFoia) { 
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

        function formatAndDisplayFoiaContentWithPrompt(parentElement, sectionKeySuffix, sectionPromptText, sectionContentText) {
            if (!parentElement) {
                console.warn("formatAndDisplayFoiaContentWithPrompt: parentElement is null for sectionKeySuffix:", sectionKeySuffix);
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
        
        async function updateFoiaStatus(foiaId, newStatus) {
            const foiaToUpdate = allFetchedFoiaAnalyses.find(a => a.id === foiaId) || currentlyViewedFoiaAnalysis; 
            const foiaTitleForMessage = foiaToUpdate ? (foiaToUpdate.foiaTitle || (foiaToUpdate.foiaFileNames && foiaToUpdate.foiaFileNames.length > 0 ? foiaToUpdate.foiaFileNames.join(', ') : 'this document')) : 'this document';
            const statusArea = viewSavedFoiaDetailsSection.style.display === 'block' ? viewFoiaStatusArea : foiaListStatusArea;

            if(statusArea) showLoadingMessage(statusArea, `Updating "${foiaTitleForMessage}" to ${newStatus}...`);
            try {
                const response = await fetch(`/api/foia-analysis/${foiaId}/status`, { 
                    method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: newStatus }),
                });
                if (!response.ok) throw new Error((await response.json()).error || 'Failed to update FOIA status.');
                const result = await response.json(); 
                
                const listItemInAllFetched = allFetchedFoiaAnalyses.find(a => a.id === foiaId);
                if (listItemInAllFetched) listItemInAllFetched.status = result.newStatus || newStatus;
                
                if (currentlyViewedFoiaAnalysis && currentlyViewedFoiaAnalysis.id === foiaId) {
                    currentlyViewedFoiaAnalysis.status = result.newStatus || newStatus;
                    populateViewModalFoiaActions(currentlyViewedFoiaAnalysis); 
                }
                renderFoiaAnalysesList(); 
                if(statusArea) showLoadingMessage(statusArea, `"${foiaTitleForMessage}" status updated to ${result.newStatus || newStatus}!`, false);
            } catch (error) { 
                if(statusArea) showLoadingMessage(statusArea, `Error updating FOIA status: ${error.message}`, false);
            } finally { 
                if(statusArea) hideLoadingMessage(statusArea, 3000); 
            }
        }

        async function deleteFoiaAnalysis(foiaId, foiaTitleForConfirm) {
            if (!window.confirm(`Are you sure you want to delete FOIA document(s): "${foiaTitleForConfirm}"? This action cannot be undone.`)) return;
            const statusArea = viewSavedFoiaDetailsSection.style.display === 'block' ? viewFoiaStatusArea : foiaListStatusArea;
            
            if(statusArea) showLoadingMessage(statusArea, `Deleting "${foiaTitleForConfirm}"...`);
            try {
                const response = await fetch(`/api/foia-analysis/${foiaId}`, { method: 'DELETE' }); 
                if (!response.ok) throw new Error((await response.json()).error || `Failed to delete ${foiaTitleForConfirm}.`);
                allFetchedFoiaAnalyses = allFetchedFoiaAnalyses.filter(a => a.id !== foiaId);
                renderFoiaAnalysesList(); 
                if (viewSavedFoiaDetailsSection && viewSavedFoiaDetailsSection.classList.contains('modal-active') && 
                    currentlyViewedFoiaAnalysis && currentlyViewedFoiaAnalysis.id === foiaId) { 
                    closeModal(viewSavedFoiaDetailsSection); 
                }
                if(statusArea) showLoadingMessage(statusArea, `"${foiaTitleForConfirm}" deleted successfully!`, false);
            } catch (error) { 
                if(statusArea) showLoadingMessage(statusArea, `Error deleting FOIA: ${error.message}`, false);
            } finally { 
                if(statusArea) hideLoadingMessage(statusArea, 3000); 
            }
        }

        async function openEditFoiaModal(analysisFullDetails) {
            if (!editFoiaModal || !editFoiaForm) return;
            let analysis = analysisFullDetails;
            
            const requiredDbKeys = Object.values(PROMPT_CONFIG_FOIA).map(config => config.databaseKey);
            let needsFetch = false;
            for (const dbKey of requiredDbKeys) {
                if (!analysis.hasOwnProperty(dbKey)) {
                    needsFetch = true;
                    break;
                }
            }

            if (needsFetch) { 
                if(editFoiaStatusArea) showLoadingMessage(editFoiaStatusArea, 'Loading full FOIA details for editing...');
                try {
                    const response = await fetch(`/api/foia-analysis/${analysisFullDetails.id}`); 
                    if (!response.ok) throw new Error((await response.json()).error || 'Failed to fetch full FOIA details for editing.');
                    analysis = await response.json();
                } catch (error) {
                    console.error("Error fetching full FOIA details for editing:", error);
                    if(editFoiaStatusArea) showLoadingMessage(editFoiaStatusArea, `Error: ${error.message}`, false);
                    if(editFoiaStatusArea) hideLoadingMessage(editFoiaStatusArea, 3000);
                    return;
                } finally {
                     if (editFoiaStatusArea && editFoiaStatusArea.innerHTML.includes('Loading full FOIA details for editing...')) {
                        hideLoadingMessage(editFoiaStatusArea);
                    }
                }
            }

            if (editFoiaIdInput) editFoiaIdInput.value = analysis.id;
            if (editFoiaTitleInput) editFoiaTitleInput.value = analysis.foiaTitle || '';
            if (editFoiaFileNamesTextarea) editFoiaFileNamesTextarea.value = (analysis.foiaFileNames || []).join('\n') || 'N/A';
            if (editFoiaTypeInput) editFoiaTypeInput.value = analysis.foiaType || '';
            if (editSubmittedBySelectFoia) editSubmittedBySelectFoia.value = analysis.submittedBy || 'Other';
            if (editFoiaStatusSelect) editFoiaStatusSelect.value = analysis.status || 'analyzed';
            
            if (editFoiaSummaryTextarea) editFoiaSummaryTextarea.value = analysis.foiaSummary || ''; 
            if (editFoiaProposalComparisonTextarea) editFoiaProposalComparisonTextarea.value = analysis.foiaProposalComparison || ''; 
            if (editFoiaInsightsAnalysisTextarea) editFoiaInsightsAnalysisTextarea.value = analysis.foiaInsightsAnalysis || ''; 
            if (editFoiaPricingIntelligenceTextarea) editFoiaPricingIntelligenceTextarea.value = analysis.foiaPricingIntelligence || ''; 
            if (editFoiaMarketTrendsTextarea) editFoiaMarketTrendsTextarea.value = analysis.foiaMarketTrends || ''; 
            if (editFoiaTasksWorkPlanTextarea) editFoiaTasksWorkPlanTextarea.value = analysis.foiaTasksWorkPlan || ''; 
            
            if (editFoiaModalTitle) editFoiaModalTitle.textContent = `Edit FOIA: ${analysis.foiaTitle || (analysis.foiaFileNames && analysis.foiaFileNames.length > 0 ? analysis.foiaFileNames[0] : 'Document')}`;
            
            closeModal(viewSavedFoiaDetailsSection); 
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
                    foiaProposalComparison: editFoiaProposalComparisonTextarea.value.trim(),
                    foiaInsightsAnalysis: editFoiaInsightsAnalysisTextarea.value.trim(),
                    foiaPricingIntelligence: editFoiaPricingIntelligenceTextarea.value.trim(),
                    foiaMarketTrends: editFoiaMarketTrendsTextarea.value.trim(),
                    foiaTasksWorkPlan: editFoiaTasksWorkPlanTextarea.value.trim(),
                };
                if(editFoiaStatusArea) showLoadingMessage(editFoiaStatusArea, 'Saving FOIA changes...');
                try {
                    const response = await fetch(`/api/foia-analysis/${foiaIdToUpdate}`, { 
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
                    await loadSavedFoiaAnalysesInitial(); 
                    setTimeout(() => closeModal(editFoiaModal), 2000);
                } catch (error) {
                    console.error('Error saving FOIA details:', error);
                    if(editFoiaStatusArea) showLoadingMessage(editFoiaStatusArea, `Error: ${error.message}`, false);
                    if(editFoiaStatusArea) hideLoadingMessage(editFoiaStatusArea, 5000);
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

        function populateViewModalFoiaActions(analysis) {
            if (!viewFoiaModalActionsMenu || !analysis) return;
            viewFoiaModalActionsMenu.innerHTML = ''; 
            const displayTitle = analysis.foiaTitle || (analysis.foiaFileNames && analysis.foiaFileNames.length > 0 ? analysis.foiaFileNames.join(', ') : 'N/A');

            addDropdownItemToMenu(viewFoiaModalActionsMenu, 'fa-edit', 'Edit Details', () => openEditFoiaModal(analysis));
            viewFoiaModalActionsMenu.appendChild(document.createElement('div')).className = 'dropdown-divider';

            if (analysis.status === 'analyzed') {
                addDropdownItemToMenu(viewFoiaModalActionsMenu, 'fa-check-circle', 'Move to Active', () => updateFoiaStatus(analysis.id, 'active'));
                addDropdownItemToMenu(viewFoiaModalActionsMenu, 'fa-times-circle', 'Move to Not Pursuing', () => updateFoiaStatus(analysis.id, 'not_pursuing'));
                addDropdownItemToMenu(viewFoiaModalActionsMenu, 'fa-archive', 'Archive', () => updateFoiaStatus(analysis.id, 'archived'));
            } else if (analysis.status === 'active') {
                addDropdownItemToMenu(viewFoiaModalActionsMenu, 'fa-times-circle', 'Move to Not Pursuing', () => updateFoiaStatus(analysis.id, 'not_pursuing'));
                addDropdownItemToMenu(viewFoiaModalActionsMenu, 'fa-inbox', 'Move to Analyzed', () => updateFoiaStatus(analysis.id, 'analyzed'));
                addDropdownItemToMenu(viewFoiaModalActionsMenu, 'fa-archive', 'Archive', () => updateFoiaStatus(analysis.id, 'archived'));
            } else if (analysis.status === 'not_pursuing') {
                addDropdownItemToMenu(viewFoiaModalActionsMenu, 'fa-check-circle', 'Move to Active', () => updateFoiaStatus(analysis.id, 'active'));
                addDropdownItemToMenu(viewFoiaModalActionsMenu, 'fa-inbox', 'Move to Analyzed', () => updateFoiaStatus(analysis.id, 'analyzed'));
                addDropdownItemToMenu(viewFoiaModalActionsMenu, 'fa-archive', 'Archive', () => updateFoiaStatus(analysis.id, 'archived'));
            } else if (analysis.status === 'archived') {
                addDropdownItemToMenu(viewFoiaModalActionsMenu, 'fa-box-open', 'Unarchive (to Analyzed)', () => updateFoiaStatus(analysis.id, 'analyzed'));
                addDropdownItemToMenu(viewFoiaModalActionsMenu, 'fa-check-circle', 'Move to Active', () => updateFoiaStatus(analysis.id, 'active'));
            } else {
                addDropdownItemToMenu(viewFoiaModalActionsMenu, 'fa-check-circle', 'Move to Active', () => updateFoiaStatus(analysis.id, 'active'));
                addDropdownItemToMenu(viewFoiaModalActionsMenu, 'fa-times-circle', 'Move to Not Pursuing', () => updateFoiaStatus(analysis.id, 'not_pursuing'));
                addDropdownItemToMenu(viewFoiaModalActionsMenu, 'fa-archive', 'Archive', () => updateFoiaStatus(analysis.id, 'archived'));
            }
            viewFoiaModalActionsMenu.appendChild(document.createElement('div')).className = 'dropdown-divider';
            addDropdownItemToMenu(viewFoiaModalActionsMenu, 'fa-trash-alt', 'Delete FOIA', () => deleteFoiaAnalysis(analysis.id, displayTitle));
        }
        if (viewFoiaModalActionTrigger) {
            viewFoiaModalActionTrigger.addEventListener('click', (e) => {
                e.stopPropagation();
                if (viewFoiaModalActionsMenu) {
                    if (currentlyViewedFoiaAnalysis) {
                        populateViewModalFoiaActions(currentlyViewedFoiaAnalysis);
                    }
                    viewFoiaModalActionsMenu.style.display = viewFoiaModalActionsMenu.style.display === 'block' ? 'none' : 'block';
                }
            });
        }

        function renderFoiaAnalysesList() {
            if (!savedAnalysesListDivFoia || !noSavedAnalysesPFoia) return;
            savedAnalysesListDivFoia.innerHTML = ''; 
            let filteredAnalyses = [...allFetchedFoiaAnalyses];

            if (currentFoiaStatusFilter !== 'all_statuses') {
                filteredAnalyses = filteredAnalyses.filter(a => a.status === currentFoiaStatusFilter);
            }

            filteredAnalyses.sort((a, b) => {
                let valA = a[currentFoiaSortKey];
                let valB = b[currentFoiaSortKey];
                if (currentFoiaSortKey === 'analysisDate') { 
                    valA = a.analysisDate && a.analysisDate._seconds ? Number(a.analysisDate._seconds) : 0;
                    valB = b.analysisDate && b.analysisDate._seconds ? Number(b.analysisDate._seconds) : 0;
                } else { 
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
                    itemDiv.className = 'analyzed-rfp-item'; 
                    const displayTitle = analysis.foiaTitle || (analysis.foiaFileNames && analysis.foiaFileNames.length > 0 ? analysis.foiaFileNames.join(', ') : 'N/A');
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
                        <span class="rfp-col-type">${analysis.foiaType || 'N/A'}</span>
                        <span class="rfp-col-owner">${analysis.submittedBy || 'N/A'}</span>
                        <span class="rfp-col-date">${formattedDateTime}</span>
                        <span class="rfp-col-status"><span class="rfp-status-dot ${statusDotClass}" title="${analysis.status || 'analyzed'}"></span></span>
                        <span class="rfp-col-actions"></span>`;
                    
                    const actionsSpan = itemDiv.querySelector('.rfp-col-actions');
                    const viewLink = document.createElement('a');
                    viewLink.href = '#'; viewLink.className = 'rfp-view-details action-icon'; 
                    viewLink.dataset.id = analysis.id;
                    viewLink.innerHTML = '<i class="fas fa-eye" aria-hidden="true"></i>';
                    viewLink.title = "View FOIA Analysis Details";
                    viewLink.addEventListener('click', async (e) => {
                        e.preventDefault();
                        const analysisId = e.currentTarget.dataset.id;
                        currentlyViewedFoiaAnalysis = allFetchedFoiaAnalyses.find(item => item.id === analysisId);
                        if (!currentlyViewedFoiaAnalysis) {
                            console.error("Could not find FOIA item in local cache for ID:", analysisId);
                            return;
                        }

                        const foiaItemDiv = e.currentTarget.closest('.analyzed-rfp-item');
                        const titleElement = foiaItemDiv ? foiaItemDiv.querySelector('.rfp-col-title') : null;
                        const loadingMessageTitle = titleElement ? titleElement.textContent : 'Selected FOIA';
                        
                        openModal(viewSavedFoiaDetailsSection);
                        if (viewSavedFoiaDetailsSection) viewSavedFoiaDetailsSection.dataset.currentViewingId = analysisId; 
                        if (viewFoiaMainTitleHeading) viewFoiaMainTitleHeading.textContent = `Details for: ${loadingMessageTitle}`;
                        if(viewFoiaStatusArea) showLoadingMessage(viewFoiaStatusArea, `Loading analysis for ${loadingMessageTitle}...`);
                        if (viewAnalysisResultsAreaFoia) viewAnalysisResultsAreaFoia.style.display = 'none';
                        clearViewFoiaAnalysisResultTabs();
                        
                        populateViewModalFoiaActions(currentlyViewedFoiaAnalysis);

                        let loadErrorOccurred = false;
                        try {
                            const detailResponse = await fetch(`/api/foia-analysis/${analysisId}`); 
                            if (!detailResponse.ok) throw new Error((await detailResponse.json()).error || 'Failed to fetch FOIA details.');
                            const detailedAnalysis = await detailResponse.json();
                             currentlyViewedFoiaAnalysis = detailedAnalysis; 
                            populateViewModalFoiaActions(currentlyViewedFoiaAnalysis); 

                            const savedPromptsForThisAnalysis = detailedAnalysis.analysisPrompts || {};

                            Object.keys(PROMPT_CONFIG_FOIA).forEach(keySuffix => {
                                const contentDiv = viewTabContentMapFoia[keySuffix]; 
                                const dbKey = PROMPT_CONFIG_FOIA[keySuffix].databaseKey; // Use the explicit databaseKey

                                const sectionContent = detailedAnalysis[dbKey] || "N/A";
                                const promptTextUsed = savedPromptsForThisAnalysis[keySuffix] || PROMPT_CONFIG_FOIA[keySuffix]?.defaultText;
                                
                                if (contentDiv) {
                                    formatAndDisplayFoiaContentWithPrompt(contentDiv, keySuffix, promptTextUsed, sectionContent);
                                } else {
                                    console.warn(`View tab content div for key "${keySuffix}" (mapped to DB key ${dbKey}) not found. HTML update needed.`);
                                }
                            });
                            if (viewAnalysisResultsAreaFoia) viewAnalysisResultsAreaFoia.style.display = 'block';
                            const firstViewTabLinkFoia = document.querySelector('#view-saved-foia-details-section.modal-active .tabs-container .tab-link');
                            if (firstViewTabLinkFoia) { 
                                document.querySelectorAll('#view-saved-foia-details-section.modal-active .tabs-container .tab-link').forEach(tl => tl.classList.remove('active'));
                                firstViewTabLinkFoia.classList.add('active');
                                const tabNameMatch = firstViewTabLinkFoia.getAttribute('onclick').match(/'(view-[^']+-tab-foia)'/);
                                if (tabNameMatch && tabNameMatch[1] && window.openFoiaViewTab) {
                                     window.openFoiaViewTab(null, tabNameMatch[1]);
                                }
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
                    addDropdownItemToMenu(dropdownMenu, 'fa-edit', 'Edit Details', () => openEditFoiaModal(analysis));
                    dropdownMenu.appendChild(document.createElement('div')).className = 'dropdown-divider';
                    
                    if (analysis.status === 'analyzed') {
                        addDropdownItemToMenu(dropdownMenu, 'fa-check-circle', 'Move to Active', () => updateFoiaStatus(analysis.id, 'active'));
                        addDropdownItemToMenu(dropdownMenu, 'fa-times-circle', 'Move to Not Pursuing', () => updateFoiaStatus(analysis.id, 'not_pursuing'));
                        addDropdownItemToMenu(dropdownMenu, 'fa-archive', 'Archive', () => updateFoiaStatus(analysis.id, 'archived'));
                    } else if (analysis.status === 'active') {
                        addDropdownItemToMenu(dropdownMenu, 'fa-times-circle', 'Move to Not Pursuing', () => updateFoiaStatus(analysis.id, 'not_pursuing'));
                        addDropdownItemToMenu(dropdownMenu, 'fa-inbox', 'Move to Analyzed', () => updateFoiaStatus(analysis.id, 'analyzed'));
                        addDropdownItemToMenu(dropdownMenu, 'fa-archive', 'Archive', () => updateFoiaStatus(analysis.id, 'archived'));
                    } else if (analysis.status === 'not_pursuing') {
                        addDropdownItemToMenu(dropdownMenu, 'fa-check-circle', 'Move to Active', () => updateFoiaStatus(analysis.id, 'active'));
                        addDropdownItemToMenu(dropdownMenu, 'fa-inbox', 'Move to Analyzed', () => updateFoiaStatus(analysis.id, 'analyzed'));
                        addDropdownItemToMenu(dropdownMenu, 'fa-archive', 'Archive', () => updateFoiaStatus(analysis.id, 'archived'));
                    } else if (analysis.status === 'archived') {
                        addDropdownItemToMenu(dropdownMenu, 'fa-box-open', 'Unarchive (to Analyzed)', () => updateFoiaStatus(analysis.id, 'analyzed'));
                        addDropdownItemToMenu(dropdownMenu, 'fa-check-circle', 'Move to Active', () => updateFoiaStatus(analysis.id, 'active'));
                    } else { 
                        addDropdownItemToMenu(dropdownMenu, 'fa-check-circle', 'Move to Active', () => updateFoiaStatus(analysis.id, 'active'));
                        addDropdownItemToMenu(dropdownMenu, 'fa-times-circle', 'Move to Not Pursuing', () => updateFoiaStatus(analysis.id, 'not_pursuing'));
                        addDropdownItemToMenu(dropdownMenu, 'fa-archive', 'Archive', () => updateFoiaStatus(analysis.id, 'archived'));
                    }
                    dropdownMenu.appendChild(document.createElement('div')).className = 'dropdown-divider';
                    addDropdownItemToMenu(dropdownMenu, 'fa-trash-alt', 'Delete FOIA', () => deleteFoiaAnalysis(analysis.id, displayTitle));
                    
                    dropdownContainer.appendChild(dropdownTrigger);
                    dropdownContainer.appendChild(dropdownMenu);
                    actionsSpan.appendChild(dropdownContainer);
                    savedAnalysesListDivFoia.appendChild(itemDiv);
                });
            }
        }

        if (foiaListTabsContainer) {
            foiaListTabsContainer.addEventListener('click', (e) => {
                if (e.target.classList.contains('rfp-list-tab-button')) { 
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

        if (foiaForm) {
            foiaForm.addEventListener('submit', async function (event) {
                event.preventDefault();
                const foiaTitleValue = document.getElementById('foiaTitle').value.trim();
                const foiaTypeValue = document.getElementById('foiaType').value.trim(); 
                const submittedByValue = document.getElementById('submittedByFoia').value;
                const foiaFiles = foiaFileUploadInput.files; 

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
                    if (combinedFoiaText.trim().length < 50) { 
                        throw new Error("Insufficient total text extracted from PDF(s) for FOIA analysis.");
                    }
                } catch (error) {
                    if(modalAnalysisStatusAreaFoia) showLoadingMessage(modalAnalysisStatusAreaFoia, `PDF Error: ${error.message}`, false);
                    if(modalAnalysisStatusAreaFoia) hideLoadingMessage(modalAnalysisStatusAreaFoia, 5000); return;
                }

                if (!serverFoiaPrompts) { 
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
                    const response = await fetch('/api/generate', { 
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
                            console.warn(`Modal FOIA Tab Content Div for key "${keySuffix}" not found. Check HTML IDs and modalTabContentMapFoia.`);
                        }
                    });


                    if (modalAnalysisResultsAreaFoia) modalAnalysisResultsAreaFoia.style.display = 'block';
                    const activeModalResultTabFoia = document.querySelector('#new-foia-modal .tabs-container .tab-link');
                    if (activeModalResultTabFoia) { 
                        document.querySelectorAll('#new-foia-modal .tabs-container .tab-link').forEach(tl => tl.classList.remove('active'));
                        activeModalResultTabFoia.classList.add('active');
                        const tabNameMatch = activeModalResultTabFoia.getAttribute('onclick').match(/'(modal-[^']*-tab-foia)'/);
                        if (tabNameMatch && tabNameMatch[1] && window.openFoiaModalTab) {
                             window.openFoiaModalTab(null, tabNameMatch[1]);
                        } else {
                            console.warn("Could not determine or open first tab for new FOIA analysis results. Target IDs might have changed.");
                        }
                    }
                    
                    if(modalAnalysisStatusAreaFoia) showLoadingMessage(modalAnalysisStatusAreaFoia, "FOIA analysis complete! Saving results...", false);
                    try {
                        const savePayloadFoia = {
                            foiaTitle: foiaTitleValue || "", 
                            foiaType: foiaTypeValue, 
                            submittedBy: submittedByValue,
                            foiaFileNames: foiaFileNamesArray, 
                            status: 'analyzed',
                            analysisPrompts: currentFoiaAnalysisPrompts 
                        };
                        Object.keys(PROMPT_CONFIG_FOIA).forEach(key => {
                            const dbKey = PROMPT_CONFIG_FOIA[key].databaseKey;
                            if (dbKey) { // Ensure databaseKey is defined
                                savePayloadFoia[dbKey] = parsedAISectionsFoia[key];
                            } else {
                                console.warn(`Database key not defined for prompt config key: ${key}`);
                            }
                        });

                        const saveResponse = await fetch('/api/foia-analysis', { 
                            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(savePayloadFoia)
                        });
                        if (!saveResponse.ok) throw new Error((await saveResponse.json()).error || 'Failed to save FOIA analysis.');
                        if(modalAnalysisStatusAreaFoia) showLoadingMessage(modalAnalysisStatusAreaFoia, "FOIA analysis complete and results saved!", false);
                        await loadSavedFoiaAnalysesInitial(); 
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

        async function loadSavedFoiaAnalysesInitial() {
            if(foiaListStatusArea) showLoadingMessage(foiaListStatusArea, "Loading saved FOIA analyses...", true);
            try {
                const response = await fetch('/api/foia-analyses'); 
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
        
        const firstActiveViewTabFoia = document.querySelector('#view-saved-foia-details-section.modal-active .tabs-container .tab-link');
        if (firstActiveViewTabFoia && viewSavedFoiaDetailsSection && viewSavedFoiaDetailsSection.classList.contains('modal-active')) {
            const tabNameMatch = firstActiveViewTabFoia.getAttribute('onclick').match(/'(view-[^']*-tab-foia)'/);
            if (tabNameMatch && tabNameMatch[1]) {
                const tabNameToOpen = tabNameMatch[1];
                const tabElement = document.getElementById(tabNameToOpen);
                if (window.openFoiaViewTab && tabElement && tabElement.style.display !== 'block') { 
                    window.openFoiaViewTab(null, tabNameToOpen);
                }
            }
        }

        async function initializeFoiaPage() {
            await loadSavedFoiaAnalysesInitial(); 
            await fetchFoiaPromptsFromServer();   
            if (promptSectionSelectorFoia) {      
                loadSelectedFoiaSectionPromptToTextarea(); 
            }
        }

        initializeFoiaPage(); 

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

    } // End of initializeFoiaAppLogic function

}); // End of DOMContentLoaded
