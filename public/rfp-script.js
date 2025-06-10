/**
 * Cendien - RFP Analyzer Script
 *
 * This script handles all client-side logic for the RFP Analyzer page.
 * It communicates with a Python backend for PDF processing and a Node.js
 * backend for AI analysis and data management.
 *
 * @version 3.0.3
 * @date 2025-06-10
 */

import {
    showLoadingMessage,
    hideLoadingMessage,
    addDropdownItemToMenu,
    openModal,
    closeModal,
    handleAuthentication,
    updateAnalysisStatus,
    deleteAnalysis
} from './analysis-common.js';

document.addEventListener('DOMContentLoaded', () => {

    const PYTHON_BACKEND_URL = "https://pdf-processor-service-352598512627.us-central1.run.app";

    // --- RFP-SPECIFIC CONFIGURATION ---
    const RFP_PROMPT_CONFIG = {
        summary: {
            defaultText: "You will be provided with the content of the RFP. Follow these guidelines to create a summary: Focus on extracting and condensing key information from the RFP. Ensure the summary captures all essential aspects, including: Project objectives, Scope of work, Requirements and specifications, Evaluation criteria,  Submission guidelines, Deadlines. Maintain a balance between conciseness and comprehensiveness. The summary should be no more 2 pages in length.",
            delimiterKey: "SUMMARY", databaseKey: "rfpSummary", title: "RFP Summary"
        },
        questions: { 
            defaultText: "Generate a list of 20 critical and insightful clarification questions to ask regarding an RFP. These questions should be designed to uncover hidden requirements, ambiguous statements, or areas where more detail is needed to create a comprehensive and competitive proposal. The goal is to ensure a thorough understanding of the client's needs and expectations.",
            delimiterKey: "QUESTIONS", databaseKey: "generatedQuestions", title: "Generated Clarification Questions"
        },
        deadlines: {
            defaultText: "You are an expert in analyzing Request for Proposal (RFP) documents. Your task is to identify key deadlines and the submission format for the RFP. Follow these steps to extract the required information: 1. Carefully read the entire RFP document. 2. Identify all key deadlines, including dates and times for each deadline. 3. Identify the required submission format for the RFP (e.g., electronic submission, hard copy submission, online portal submission). 4. Output the information in a well-organized list with clear labels for each deadline and the submission format.",
            delimiterKey: "DEADLINES", databaseKey: "rfpDeadlines", title: "Key Deadlines"
        },
        submissionFormat: { 
            defaultText: "Carefully review the RFP document to identify the specified submission format for the proposal (e.g., mail, email, online portal, usb, fax). Identify all people related to the RFP. 3. Extract all relevant contact information, including: Addresses for mail submissions. Email addresses for electronic submissions. Links to online portals or websites for online submissions. Phone numbers for contact persons. Names and titles of contact persons. 4. Present the extracted information in a clear and organized manner.",
            delimiterKey: "SUBMISSION_FORMAT", databaseKey: "rfpSubmissionFormat", title: "Submission Format"
        },
        requirements: { 
            defaultText: "5. A list of Requirements (e.g., mandatory, highly desirable).", 
            delimiterKey: "REQUIREMENTS", databaseKey: "rfpKeyRequirements", title: "Requirements"
        },
        stakeholders: { 
            defaultText: "6. Mentioned Stakeholders or Key Contacts.", 
            delimiterKey: "STAKEHOLDERS", databaseKey: "rfpStakeholders", title: "Mentioned Stakeholders"
        },
        risks: { 
            defaultText: "7. Potential Risks or Red Flags identified in the RFP.", 
            delimiterKey: "RISKS", databaseKey: "rfpRisks", title: "Potential Risks/Red Flags" 
        },
        registration: { 
            defaultText: "8. Registration requirements or details for bidders.", 
            delimiterKey: "REGISTRATION", databaseKey: "rfpRegistration", title: "Registration Details"
        },
        licenses: { 
            defaultText: "9. Required Licenses or Certifications for bidders.", 
            delimiterKey: "LICENSES", databaseKey: "rfpLicenses", title: "Licenses & Certifications"
        },
        budget: { 
            defaultText: "10. Any mentioned Budget constraints or financial information.", 
            delimiterKey: "BUDGET", databaseKey: "rfpBudget", title: "Budget Information"
        }
    };
    
    // --- AUTHENTICATION FLOW ---
    const authConfig = {
        authModal: document.getElementById('auth-modal-overlay'),
        authForm: document.getElementById('auth-form'),
        usernameInput: document.getElementById('auth-username'),
        passwordInput: document.getElementById('auth-password'),
        errorMessageElement: document.getElementById('auth-error-message'),
        pageContentWrapper: document.getElementById('page-content-wrapper'),
        correctUsername: "Cendien",
        correctPassword: "rfpanalyzer",
        sessionKey: 'rfpAnalyzerLoginTimestamp'
    };

    handleAuthentication(authConfig, initializeRfpAppLogic);

    // --- MAIN APPLICATION LOGIC ---
    function initializeRfpAppLogic() {
        console.log("RFP Analyzer: Initializing main application logic...");

        // DOM Elements
        const newRfpModal = document.getElementById('new-rfp-modal');
        const openNewRfpModalButton = document.getElementById('open-new-rfp-modal-button');
        const rfpForm = document.getElementById('rfp-details-form');
        const generateAnalysisButton = document.getElementById('generate-analysis-button');
        const modalAnalysisStatusArea = document.getElementById('modal-analysis-status-area');
        const savedAnalysesListDiv = document.getElementById('saved-analyses-list');
        const noSavedAnalysesP = document.getElementById('no-saved-analyses');
        const rfpListStatusArea = document.getElementById('rfp-list-status-area');
        const rfpListTabsContainer = document.querySelector('.rfp-list-tabs');
        const viewSavedRfpDetailsSection = document.getElementById('view-saved-rfp-details-section');
        const viewRfpMainTitleHeading = document.getElementById('view-rfp-main-title-heading');
        const viewRfpStatusArea = document.getElementById('view-rfp-status-area');
        const viewAnalysisResultsArea = document.getElementById('view-analysis-results-area');
        const closeViewRfpDetailsButton = document.getElementById('close-view-rfp-details-button');
        const viewRfpModalActionTrigger = document.getElementById('view-rfp-modal-action-trigger');
        const viewRfpModalActionsMenu = document.getElementById('view-rfp-modal-actions-menu');
        const editRfpModal = document.getElementById('edit-rfp-modal');
        const editRfpForm = document.getElementById('edit-rfp-details-form');
        const saveEditedRfpButton = document.getElementById('save-edited-rfp-button');
        const editRfpStatusArea = document.getElementById('edit-rfp-status-area');
        const promptSettingsModal = document.getElementById('prompt-settings-modal');
        const openPromptSettingsModalButton = document.getElementById('open-prompt-settings-modal-button');
        const promptSectionSelector = document.getElementById('promptSectionSelector');
        const rfpIndividualPromptTextarea = document.getElementById('rfpIndividualPromptTextarea');
        const saveCurrentPromptButton = document.getElementById('save-current-prompt-button');
        const resetCurrentPromptButton = document.getElementById('reset-current-prompt-button');
        const resetAllPromptsButton = document.getElementById('reset-all-prompts-button');
        const promptSaveStatus = document.getElementById('prompt-save-status');
        const chatbotModal = document.getElementById('chatbot-modal');
        const openChatbotButton = document.getElementById('open-chatbot-button');
        const closeChatbotButton = document.getElementById('close-chatbot-button');
        const chatbotForm = document.getElementById('chatbot-form');
        const chatbotInput = document.getElementById('chatbot-input');
        const chatbotMessages = document.getElementById('chatbot-messages');
        const typePrefix = 'rfp';

        // State
        let allFetchedAnalyses = [];
        let currentStatusFilter = 'all_statuses';
        let serverRfpPrompts = {};
        let currentlyViewedRfpAnalysis = null;
        let originalRfpTextForReanalysis = "";

        // --- INITIALIZATION ---
        initializePage();

        function initializePage() {
            loadSavedAnalyses();
            fetchPrompts();
            addEventListeners();
        }
        
        function addEventListeners() {
            openNewRfpModalButton.addEventListener('click', () => {
                rfpForm.reset();
                openModal(newRfpModal);
            });
            document.querySelectorAll('.modal-close-button').forEach(btn => {
                btn.addEventListener('click', () => closeModal(btn.closest('.modal-overlay')));
            });
            rfpForm.addEventListener('submit', handleNewRfpAnalysis);
            editRfpForm.addEventListener('submit', handleEditRfpSave);
            openPromptSettingsModalButton.addEventListener('click', () => openModal(promptSettingsModal));
            promptSectionSelector.addEventListener('change', loadSelectedPromptToTextarea);
            saveCurrentPromptButton.addEventListener('click', saveCurrentPrompt);
            resetCurrentPromptButton.addEventListener('click', () => {
                const selectedKey = promptSectionSelector.value;
                rfpIndividualPromptTextarea.value = RFP_PROMPT_CONFIG[selectedKey].defaultText;
                saveCurrentPrompt();
            });
            resetAllPromptsButton.addEventListener('click', resetAllPrompts);
            closeViewRfpDetailsButton.addEventListener('click', () => closeModal(viewSavedRfpDetailsSection));
            viewRfpModalActionTrigger.addEventListener('click', (e) => {
                e.stopPropagation();
                viewRfpModalActionsMenu.style.display = viewRfpModalActionsMenu.style.display === 'block' ? 'none' : 'block';
            });
            rfpListTabsContainer.addEventListener('click', (e) => {
                if (e.target.classList.contains('rfp-list-tab-button')) {
                    rfpListTabsContainer.querySelectorAll('.rfp-list-tab-button').forEach(btn => btn.classList.remove('active'));
                    e.target.classList.add('active');
                    currentStatusFilter = e.target.dataset.statusFilter;
                    renderAnalysesList();
                }
            });
            viewAnalysisResultsArea.addEventListener('click', function(event) {
                const target = event.target.closest('.tab-link');
                if (!target) return;
                const tabId = target.dataset.tabId;
                const tabContainer = target.closest('.tabs-container');
                tabContainer.querySelectorAll('.tab-link').forEach(link => link.classList.remove('active'));
                target.classList.add('active');
                viewAnalysisResultsArea.querySelectorAll('.tab-content').forEach(content => {
                    content.style.display = 'none';
                });
                document.getElementById(tabId).style.display = 'block';
            });
            openChatbotButton.addEventListener('click', () => chatbotModal.style.display = 'block');
            closeChatbotButton.addEventListener('click', () => chatbotModal.style.display = 'none');
            chatbotForm.addEventListener('submit', (e) => {
                e.preventDefault();
                sendChatMessage();
            });
            document.addEventListener('click', () => {
                document.querySelectorAll('.actions-dropdown-menu, .view-modal-actions-dropdown-menu').forEach(menu => menu.style.display = 'none');
            });
        }
        
        async function fetchPrompts() {
            showLoadingMessage(promptSaveStatus, "Loading prompts...", true);
            try {
                const response = await fetch('/api/rfp-prompt-settings');
                if (!response.ok) throw new Error('Failed to fetch prompts.');
                const data = await response.json();
                serverRfpPrompts = data.prompts || {};
                Object.keys(RFP_PROMPT_CONFIG).forEach(key => {
                    if (!serverRfpPrompts[key]) serverRfpPrompts[key] = RFP_PROMPT_CONFIG[key].defaultText;
                });
                loadSelectedPromptToTextarea();
                showLoadingMessage(promptSaveStatus, "Prompts loaded.", false);
            } catch (error) {
                showLoadingMessage(promptSaveStatus, `Error: ${error.message}`, false);
            } finally {
                hideLoadingMessage(promptSaveStatus, 2000);
            }
        }

        function loadSelectedPromptToTextarea() {
            const selectedKey = promptSectionSelector.value;
            rfpIndividualPromptTextarea.value = serverRfpPrompts[selectedKey] || RFP_PROMPT_CONFIG[selectedKey].defaultText;
        }

        async function saveCurrentPrompt() {
            const selectedKey = promptSectionSelector.value;
            serverRfpPrompts[selectedKey] = rfpIndividualPromptTextarea.value;
            showLoadingMessage(promptSaveStatus, "Saving prompt...", true);
            try {
                const response = await fetch('/api/rfp-prompt-settings', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ prompts: serverRfpPrompts }),
                });
                 if (!response.ok) throw new Error('Failed to save prompt.');
                showLoadingMessage(promptSaveStatus, "Prompt saved!", false);
            } catch (error) {
                showLoadingMessage(promptSaveStatus, `Error: ${error.message}`, false);
            } finally {
                hideLoadingMessage(promptSaveStatus, 2000);
            }
        }
        
        async function resetAllPrompts() {
            if (!confirm("Are you sure you want to reset ALL RFP prompts to their defaults?")) return;
            Object.keys(RFP_PROMPT_CONFIG).forEach(key => {
                serverRfpPrompts[key] = RFP_PROMPT_CONFIG[key].defaultText;
            });
            loadSelectedPromptToTextarea();
            await saveCurrentPrompt();
        }

        async function handleNewRfpAnalysis(event) {
            event.preventDefault();
            const mainRfpFile = document.getElementById('rfpFileUpload').files[0];
            const addendumFiles = document.getElementById('rfpAddendumUpload').files;

            if (!mainRfpFile) {
                alert("Please upload the main RFP document.");
                return;
            }

            showLoadingMessage(modalAnalysisStatusArea, "Uploading & processing with Python backend...", true, generateAnalysisButton);

            const formData = new FormData();
            formData.append('main_rfp', mainRfpFile);
            for (const file of addendumFiles) {
                formData.append('addendum_files', file);
            }

            try {
                const processResponse = await fetch(`${PYTHON_BACKEND_URL}/process-rfp-pdf/`, {
                    method: 'POST',
                    body: formData,
                });
                const processResult = await processResponse.json();
                if (!processResponse.ok || processResult.status === "error") {
                    throw new Error(processResult.error_message || "Failed to extract text via Python backend.");
                }
                
                const extractedText = processResult.extracted_text;
                showLoadingMessage(modalAnalysisStatusArea, "Text extracted. Generating analysis...", true);
                
                const fullPrompt = constructFullRfpAnalysisPrompt(extractedText, serverRfpPrompts);
                
                const geminiResponse = await fetch('/api/generate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ prompt: fullPrompt }),
                });
                if (!geminiResponse.ok) throw new Error("AI analysis failed.");
                const geminiResult = await geminiResponse.json();
                const parsedSections = parseRfpAiResponse(geminiResult.generatedText);

                const saveData = {
                    rfpTitle: document.getElementById('rfpTitle').value || mainRfpFile.name,
                    rfpType: document.getElementById('rfpType').value,
                    submittedBy: document.getElementById('submittedBy').value,
                    rfpFileName: mainRfpFile.name,
                    originalRfpFullText: extractedText,
                    analysisPrompts: { ...serverRfpPrompts },
                    ...parsedSections,
                    status: 'analyzed'
                };
                
                const saveResponse = await fetch('/api/rfp-analysis', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(saveData),
                });
                if (!saveResponse.ok) throw new Error("Failed to save the final analysis.");
                const newAnalysis = await saveResponse.json();

                closeModal(newRfpModal);
                await loadSavedAnalyses();
                displayRfpDetails(newAnalysis.id);

            } catch (error) {
                console.error('Analysis pipeline failed:', error);
                showLoadingMessage(modalAnalysisStatusArea, `Error: ${error.message}`, false);
            } finally {
                hideLoadingMessage(modalAnalysisStatusArea, 4000, generateAnalysisButton);
            }
        }
        
        async function loadSavedAnalyses() {
             showLoadingMessage(rfpListStatusArea, "Loading saved analyses...", true);
            try {
                const response = await fetch('/api/rfp-analyses');
                if (!response.ok) throw new Error('Failed to fetch analyses.');
                allFetchedAnalyses = await response.json();
                renderAnalysesList();
            } catch (error) {
                showLoadingMessage(rfpListStatusArea, `Error: ${error.message}`, false);
            } finally {
                hideLoadingMessage(rfpListStatusArea);
            }
        }
        
        function renderAnalysesList() {
            savedAnalysesListDiv.innerHTML = '';
            let filteredAnalyses = allFetchedAnalyses.filter(a => currentStatusFilter === 'all_statuses' || a.status === currentStatusFilter);
            
            if (filteredAnalyses.length === 0) {
                noSavedAnalysesP.style.display = 'block';
                noSavedAnalysesP.textContent = 'No analyses found for this filter.';
                return;
            }
            noSavedAnalysesP.style.display = 'none';

            filteredAnalyses.forEach(analysis => {
                const itemDiv = document.createElement('div');
                itemDiv.className = 'analyzed-rfp-item';
                const displayTitle = analysis.rfpTitle || analysis.rfpFileName;
                const statusDotClass = analysis.status === 'active' ? 'green' : analysis.status === 'not_pursuing' ? 'red' : analysis.status === 'archived' ? 'grey' : 'orange';
                itemDiv.innerHTML = `
                    <span class="rfp-col-title" title="${displayTitle}">${displayTitle}</span>
                    <span class="rfp-col-type">${analysis.rfpType || 'N/A'}</span>
                    <span class="rfp-col-owner">${analysis.submittedBy || 'N/A'}</span>
                    <span class="rfp-col-date">${new Date(analysis.analysisDate._seconds * 1000).toLocaleDateString()}</span>
                    <span class="rfp-col-status"><span class="rfp-status-dot ${statusDotClass}" title="${analysis.status}"></span></span>
                    <span class="rfp-col-actions"></span>
                `;
                
                const actionsContainer = itemDiv.querySelector('.rfp-col-actions');
                const viewBtn = document.createElement('button');
                viewBtn.innerHTML = '<i class="fas fa-eye"></i>';
                viewBtn.className = 'action-icon';
                viewBtn.title = 'View Details';
                viewBtn.onclick = () => displayRfpDetails(analysis.id);
                actionsContainer.appendChild(viewBtn);

                const dropdownContainer = document.createElement('div');
                dropdownContainer.className = 'actions-dropdown-container';
                const dropdownTrigger = document.createElement('button');
                dropdownTrigger.className = 'actions-dropdown-trigger action-icon';
                dropdownTrigger.innerHTML = '<i class="fas fa-ellipsis-v"></i>';
                dropdownTrigger.onclick = (e) => {
                    e.stopPropagation();
                    document.querySelectorAll('.actions-dropdown-menu').forEach(m => m.style.display = 'none');
                    dropdownMenu.style.display = 'block';
                };

                const dropdownMenu = document.createElement('div');
                dropdownMenu.className = 'actions-dropdown-menu';
                
                addDropdownItemToMenu(dropdownMenu, 'fa-edit', 'Edit Details', () => openEditRfpModal(analysis));
                dropdownMenu.appendChild(document.createElement('div')).className = 'dropdown-divider';
                ['active', 'not_pursuing', 'archived', 'analyzed'].filter(s => s !== analysis.status).forEach(s => {
                    addDropdownItemToMenu(dropdownMenu, 'fa-check-circle', `Move to ${s}`, async () => {
                        if (await updateAnalysisStatus(analysis.id, s, typePrefix, rfpListStatusArea)) {
                            loadSavedAnalyses();
                        }
                    });
                });
                dropdownMenu.appendChild(document.createElement('div')).className = 'dropdown-divider';
                addDropdownItemToMenu(dropdownMenu, 'fa-trash-alt', 'Delete', async () => {
                    if (await deleteAnalysis(analysis.id, displayTitle, typePrefix, rfpListStatusArea)) {
                        loadSavedAnalyses();
                    }
                });

                dropdownContainer.appendChild(dropdownTrigger);
                dropdownContainer.appendChild(dropdownMenu);
                actionsContainer.appendChild(dropdownContainer);
                savedAnalysesListDiv.appendChild(itemDiv);
            });
        }
        
        async function displayRfpDetails(analysisId) {
            openModal(viewSavedRfpDetailsSection);
            showLoadingMessage(viewRfpStatusArea, "Loading RFP details...", true);

            try {
                const response = await fetch(`/api/rfp-analysis/${analysisId}`);
                if (!response.ok) throw new Error('Failed to fetch details.');
                const analysis = await response.json();
                currentlyViewedRfpAnalysis = analysis;
                originalRfpTextForReanalysis = analysis.originalRfpFullText || "";
                
                viewRfpMainTitleHeading.textContent = analysis.rfpTitle || analysis.rfpFileName;
                
                viewRfpModalActionsMenu.innerHTML = '';
                addDropdownItemToMenu(viewRfpModalActionsMenu, 'fa-edit', 'Edit Details', () => openEditRfpModal(analysis));
                viewRfpModalActionsMenu.appendChild(document.createElement('div')).className = 'dropdown-divider';
                ['active', 'not_pursuing', 'archived', 'analyzed'].filter(s => s !== analysis.status).forEach(s => {
                    addDropdownItemToMenu(viewRfpModalActionsMenu, 'fa-check-circle', `Move to ${s}`, async () => {
                        if (await updateAnalysisStatus(analysis.id, s, typePrefix, viewRfpStatusArea)) {
                            closeModal(viewSavedRfpDetailsSection);
                            loadSavedAnalyses();
                        }
                    });
                });
                viewRfpModalActionsMenu.appendChild(document.createElement('div')).className = 'dropdown-divider';
                addDropdownItemToMenu(viewRfpModalActionsMenu, 'fa-trash-alt', 'Delete', async () => {
                     if (await deleteAnalysis(analysis.id, analysis.rfpTitle || analysis.rfpFileName, typePrefix, viewRfpStatusArea)) {
                        closeModal(viewSavedRfpDetailsSection);
                        loadSavedAnalyses();
                    }
                });
                
                const deadlinesTabContent = document.getElementById('view-deadlines-tab');
                deadlinesTabContent.innerHTML = `
                    <div id="view-deadlines-result-content"></div>
                    <hr class="section-divider">
                    <div id="view-submissionFormat-result-content"></div>
                `;

                Object.keys(RFP_PROMPT_CONFIG).forEach(key => {
                    const parentId = `view-${key}-result-content`;
                    const parentElement = document.getElementById(parentId);
                    if(parentElement) {
                        formatAndDisplaySection(parentElement, key, analysis);
                    }
                });
                
                 const firstTab = viewAnalysisResultsArea.querySelector('.tab-link');
                 if(firstTab) firstTab.click();

            } catch (error) {
                showLoadingMessage(viewRfpStatusArea, `Error: ${error.message}`, false);
            } finally {
                hideLoadingMessage(viewRfpStatusArea);
            }
        }
        
        function formatAndDisplaySection(parentElement, sectionKey, analysisData) {
            const config = RFP_PROMPT_CONFIG[sectionKey];
            const analysisPrompts = analysisData.analysisPrompts || {};
            const sectionPrompt = analysisPrompts[sectionKey] || config.defaultText;
            let sectionContent = analysisData[config.databaseKey] || "Not specified.";

            parentElement.innerHTML = `
                <h3>${config.title}</h3>
                <div class="prompt-editor-container" id="prompt-editor-container-${sectionKey}-view">
                    <label for="prompt-edit-${sectionKey}-view">Prompt:</label>
                    <textarea id="prompt-edit-${sectionKey}-view" class="prompt-edit-textarea">${sectionPrompt}</textarea>
                    <button class="reanalyze-section-button btn btn-sm btn-info" data-section-key="${sectionKey}" data-rfp-id="${analysisData.id}">Re-Analyze</button>
                    <div id="reanalyze-status-${sectionKey}-view" class="loading-container reanalyze-status-area" style="display: none;"></div>
                </div>
                <div class="section-content-display" id="section-content-display-${sectionKey}-view"></div>
                <button class="save-section-button btn btn-sm btn-success" data-section-key="${sectionKey}" data-rfp-id="${analysisData.id}" style="display:none; margin-top: 10px;">Save Changes</button>
            `;
            
            const contentDisplayDiv = parentElement.querySelector('.section-content-display');
            formatAndDisplayContent(sectionContent, contentDisplayDiv);
            
            parentElement.querySelector('.reanalyze-section-button').addEventListener('click', handleReanalyzeSection);
            parentElement.querySelector('.save-section-button').addEventListener('click', handleSaveSectionChanges);
        }

        async function handleReanalyzeSection(event) {
            const button = event.currentTarget;
            const sectionKey = button.dataset.sectionKey;
            const config = RFP_PROMPT_CONFIG[sectionKey];
            const statusArea = document.getElementById(`reanalyze-status-${sectionKey}-view`);
            const promptTextarea = document.getElementById(`prompt-edit-${sectionKey}-view`);
            const newPrompt = promptTextarea.value;
            
            showLoadingMessage(statusArea, `Re-analyzing ${config.title}...`, true, button);

            const targetedAiPrompt = `Regenerate ONLY the content for the section: "${config.title}".\nUse the specific prompt: "${newPrompt}"\nThe full RFP text is below.\nWrap your response ONLY with ###${config.delimiterKey}_START### and ###${config.delimiterKey}_END###.\n\nFull RFP Text:\n---\n${originalRfpTextForReanalysis}\n---`;

            try {
                const response = await fetch('/api/generate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ prompt: targetedAiPrompt })
                });
                if (!response.ok) throw new Error("AI re-analysis failed.");
                
                const result = await response.json();
                const parsedResponse = parseRfpAiResponse(result.generatedText);
                const newContent = parsedResponse[config.databaseKey] || "Re-analysis did not return expected format.";
                
                const contentDisplayDiv = document.getElementById(`section-content-display-${sectionKey}-view`);
                formatAndDisplayContent(newContent, contentDisplayDiv);
                
                currentlyViewedRfpAnalysis[config.databaseKey] = newContent;
                if (!currentlyViewedRfpAnalysis.analysisPrompts) currentlyViewedRfpAnalysis.analysisPrompts = {};
                currentlyViewedRfpAnalysis.analysisPrompts[sectionKey] = newPrompt;

                showLoadingMessage(statusArea, "Section updated!", false);
                button.closest('.tab-content').querySelector('.save-section-button').style.display = 'inline-block';

            } catch (error) {
                showLoadingMessage(statusArea, `Error: ${error.message}`, false);
            } finally {
                hideLoadingMessage(statusArea, 3000, button);
            }
        }
        
        function formatAndDisplayContent(content, displayElement) {
            displayElement.innerHTML = '';
            const lines = (content || "").split('\n');
            let currentList = null;
            lines.forEach(line => {
                const trimmedLine = line.trim();
                if (trimmedLine) {
                    let formattedLine = trimmedLine.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
                    const numberedListMatch = formattedLine.match(/^(\d+\.)\s+/);
                    const bulletListMatch = formattedLine.match(/^(\*|-)\s+/);
                    if (numberedListMatch) {
                        if (!currentList || currentList.tagName !== 'OL') {
                            currentList = document.createElement('ol');
                            displayElement.appendChild(currentList);
                        }
                        const listItem = document.createElement('li');
                        listItem.innerHTML = formattedLine.substring(numberedListMatch[0].length);
                        currentList.appendChild(listItem);
                    } else if (bulletListMatch) {
                         if (!currentList || currentList.tagName !== 'UL') {
                            currentList = document.createElement('ul');
                            displayElement.appendChild(currentList);
                        }
                        const listItem = document.createElement('li');
                        listItem.innerHTML = formattedLine.substring(bulletListMatch[0].length);
                        currentList.appendChild(listItem);
                    } else {
                        currentList = null; 
                        const p = document.createElement('p');
                        p.innerHTML = formattedLine;
                        displayElement.appendChild(p);
                    }
                } else {
                    currentList = null; 
                }
            });
        }
        
        async function handleSaveSectionChanges(event) {
            const button = event.currentTarget;
            const sectionKey = button.dataset.sectionKey;
            const config = RFP_PROMPT_CONFIG[sectionKey];
            const statusArea = document.getElementById(`reanalyze-status-${sectionKey}-view`);
            
            showLoadingMessage(statusArea, `Saving changes...`, true, button);

            const payload = {
                [config.databaseKey]: currentlyViewedRfpAnalysis[config.databaseKey],
                analysisPrompts: currentlyViewedRfpAnalysis.analysisPrompts
            };

            try {
                const response = await fetch(`/api/rfp-analysis/${currentlyViewedRfpAnalysis.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                if (!response.ok) throw new Error("Failed to save changes.");
                showLoadingMessage(statusArea, "Changes saved!", false);
                button.style.display = 'none';
                await loadSavedAnalyses();
            } catch(error) {
                 showLoadingMessage(statusArea, `Error: ${error.message}`, false);
            } finally {
                hideLoadingMessage(statusArea, 3000, button);
            }
        }

        function openEditRfpModal(analysis) {
            editRfpForm.reset();
            editRfpForm.elements.editRfpId.value = analysis.id;
            editRfpForm.elements.rfpTitle.value = analysis.rfpTitle || '';
            editRfpForm.elements.editRfpFileName.value = analysis.rfpFileName || '';
            editRfpForm.elements.rfpType.value = analysis.rfpType || 'Other';
            editRfpForm.elements.submittedBy.value = analysis.submittedBy || 'Other';
            editRfpForm.elements.status.value = analysis.status || 'analyzed';
            
            Object.keys(RFP_PROMPT_CONFIG).forEach(key => {
                const dbKey = RFP_PROMPT_CONFIG[key].databaseKey;
                const formElement = editRfpForm.elements[dbKey];
                if(formElement) {
                    formElement.value = analysis[dbKey] || '';
                }
            });
            
            openModal(editRfpModal);
        }

        async function handleEditRfpSave(event) {
            event.preventDefault();
            showLoadingMessage(editRfpStatusArea, "Saving all changes...", true, saveEditedRfpButton);
            const rfpId = editRfpForm.elements.editRfpId.value;
            
            const updates = {};
            for(const element of editRfpForm.elements) {
                if(element.name && element.name !== 'editRfpFileName') {
                    updates[element.name] = element.value;
                }
            }
            delete updates.editRfpId;

            try {
                const response = await fetch(`/api/rfp-analysis/${rfpId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(updates)
                });
                if(!response.ok) throw new Error("Failed to save.");
                
                showLoadingMessage(editRfpStatusArea, "All changes saved!", false);
                await loadSavedAnalyses();
                setTimeout(() => closeModal(editRfpModal), 1500);

            } catch(error) {
                showLoadingMessage(editRfpStatusArea, `Error: ${error.message}`, false);
            } finally {
                hideLoadingMessage(editRfpStatusArea, 3000, saveEditedRfpButton);
            }
        }
        
        async function sendChatMessage() {
            const query = chatbotInput.value.trim();
            if (!query) return;

            addMessageToChat(query, 'user');
            chatbotInput.value = '';
            chatbotInput.disabled = true;

            const thinkingMessage = document.createElement('div');
            thinkingMessage.className = 'chat-message bot';
            thinkingMessage.innerHTML = '<div class="spinner" style="width: 20px; height: 20px; border-width: 3px; margin: 0 auto;"></div>';
            chatbotMessages.appendChild(thinkingMessage);
            chatbotMessages.scrollTop = chatbotMessages.scrollHeight;

            try {
                const response = await fetch('/api/chatbot', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ query })
                });
                
                thinkingMessage.remove();

                if (!response.ok) {
                    const err = await response.json();
                    throw new Error(err.error || 'Failed to get a response.');
                }

                const data = await response.json();
                addMessageToChat(data.reply, 'bot');

            } catch (error) {
                thinkingMessage.remove();
                addMessageToChat(`Sorry, I encountered an error: ${error.message}`, 'bot');
            } finally {
                chatbotInput.disabled = false;
                chatbotInput.focus();
            }
        }

        function addMessageToChat(message, sender) {
            const messageElement = document.createElement('div');
            messageElement.className = `chat-message ${sender}`;
            messageElement.textContent = message;
            chatbotMessages.appendChild(messageElement);
            chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
        }

        function constructFullRfpAnalysisPrompt(rfpText, prompts) {
            const mainInstruction = "Please analyze the following Request for Proposal (RFP) text.\nProvide the following distinct sections in your response, each clearly delimited:";
            const delimiterFormat = "\n\n###{SECTION_KEY_UPPER}_START###\n[Content for {SECTION_KEY_UPPER}]\n###{SECTION_KEY_UPPER}_END###";
            const suffix = `\n\nRFP Text (including any addendums):\n---\n${rfpText}\n---`;
            
            let fullPrompt = mainInstruction;
            Object.keys(RFP_PROMPT_CONFIG).forEach(key => {
                fullPrompt += `\n${prompts[key] || RFP_PROMPT_CONFIG[key].defaultText}`;
            });
            fullPrompt += "\n\nUse the following format strictly for each section:";
            Object.keys(RFP_PROMPT_CONFIG).forEach(key => {
                const delimiter = delimiterFormat.replace(/{SECTION_KEY_UPPER}/g, RFP_PROMPT_CONFIG[key].delimiterKey);
                fullPrompt += delimiter;
            });
            return fullPrompt + suffix;
        }

        function parseRfpAiResponse(generatedText) {
            const parsed = {};
            Object.keys(RFP_PROMPT_CONFIG).forEach(key => {
                const config = RFP_PROMPT_CONFIG[key];
                const regex = new RegExp(`###${config.delimiterKey}_START###([\\s\\S]*?)###${config.delimiterKey}_END###`, 'i');
                const match = generatedText.match(regex);
                parsed[config.databaseKey] = match && match[1] ? match[1].trim() : "Not found in AI response.";
            });
            return parsed;
        }
    }
});