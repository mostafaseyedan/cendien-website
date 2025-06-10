/**
 * Cendien - FOIA Analyzer Script
 *
 * This script handles all client-side logic for the FOIA Analyzer page.
 * It imports shared functionality from analysis-common.js and manages
 * FOIA-specific state, configurations, and event handling.
 *
 * @version 3.0.1
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

    // --- FOIA-SPECIFIC CONFIGURATION ---
    const FOIA_DOCUMENT_TYPE_CATEGORIES = [
        "IT Support", "IT Managed Services", "ERP Managed Services",
        "Cloud Migration", "IT Staffing", "Undetermined"
    ];

    const FOIA_PROMPT_CONFIG = {
        summary: {
            defaultText: "Provide a concise overview of the FOIA document content, highlighting the main subject, key information disclosed or requested, and any immediate takeaways.",
            delimiterKey: "SUMMARY", databaseKey: "foiaSummary", title: "Summary"
        },
        proposalComparison: { 
            defaultText: "If the FOIA response includes multiple documents or distinct sections, compare them. Assess the relevance and completeness of the information provided in relation to the presumed request or subject matter. Assign a qualitative rating (e.g., High, Medium, Low relevance/completeness) if applicable.",
            delimiterKey: "PROPOSAL_COMPARISON_RATING", databaseKey: "foiaProposalComparison", title: "Proposal Comparison"
        },
        insightsAnalysis: { 
            defaultText: "Extract key insights, patterns, or significant findings from the FOIA documents. Analyze the implications of the disclosed information.",
            delimiterKey: "INSIGHTS_ANALYSIS", databaseKey: "foiaInsightsAnalysis", title: "Insights Analysis"
        },
        pricingIntelligence: { 
            defaultText: "Identify any information related to fees (e.g., search, duplication, review costs), fee waivers, or any other financial data or budgetary implications mentioned in the FOIA documents.",
            delimiterKey: "FINANCIAL_INTELLIGENCE", databaseKey: "foiaPricingIntelligence", title: "Pricing/Fees Intelligence"
        },
        marketTrends: { 
            defaultText: "Analyze the disclosed information in the context of public interest, current events, or any related trends. What is the broader significance or potential impact of this information?",
            delimiterKey: "CONTEXT_IMPACT", databaseKey: "foiaMarketTrends", title: "Market Trends"
        },
        tasksWorkPlan: { 
            defaultText: "Based on the information disclosed, outline any potential next steps, follow-up actions, or tasks that might be necessary for the user (e.g., further investigation, data analysis, public dissemination).",
            delimiterKey: "ACTIONABLE_ITEMS", databaseKey: "foiaTasksWorkPlan", title: "Tasks/Work Plan"
        },
        documentType: { 
            defaultText: `Based on the content of the provided FOIA document(s), determine and state the primary type of the document(s). Your answer MUST be one of the following predefined categories: ${FOIA_DOCUMENT_TYPE_CATEGORIES.join(", ")}. If the type cannot be confidently determined from the provided list, classify it as "Undetermined".`,
            delimiterKey: "DOCUMENT_TYPE", databaseKey: "foiaType", title: "Document Type"
        }
    };

    // --- AUTHENTICATION FLOW ---
    const authConfig = {
        authModal: document.getElementById('auth-modal-overlay-foia'),
        authForm: document.getElementById('auth-form-foia'),
        usernameInput: document.getElementById('auth-username-foia'),
        passwordInput: document.getElementById('auth-password-foia'),
        errorMessageElement: document.getElementById('auth-error-message-foia'),
        pageContentWrapper: document.getElementById('page-content-wrapper-foia'),
        correctUsername: "Cendien",
        correctPassword: "rfpanalyzer",
        sessionKey: 'foiaAnalyzerLoginTimestamp'
    };

    handleAuthentication(authConfig, initializeFoiaAppLogic);

    // --- MAIN APPLICATION LOGIC ---
    function initializeFoiaAppLogic() {
        console.log("FOIA Analyzer: Initializing main application logic...");

        // DOM Elements
        const newFoiaModal = document.getElementById('new-foia-modal');
        const openNewFoiaModalButton = document.getElementById('open-new-foia-modal-button');
        const foiaForm = document.getElementById('foia-details-form');
        const generateAnalysisButtonFoia = document.getElementById('generate-analysis-button-foia');
        const modalAnalysisStatusAreaFoia = document.getElementById('modal-analysis-status-area-foia');
        const savedAnalysesListDivFoia = document.getElementById('saved-analyses-list-foia');
        const noSavedAnalysesPFoia = document.getElementById('no-saved-analyses-foia');
        const foiaListStatusArea = document.getElementById('foia-list-status-area');
        const foiaListTabsContainer = document.getElementById('foia-list-tabs');
        const viewSavedFoiaDetailsSection = document.getElementById('view-saved-foia-details-section');
        const viewFoiaMainTitleHeading = document.getElementById('view-foia-main-title-heading');
        const viewFoiaStatusArea = document.getElementById('view-foia-status-area');
        const viewAnalysisResultsAreaFoia = document.getElementById('view-analysis-results-area-foia');
        const closeViewFoiaDetailsButton = document.getElementById('close-view-foia-details-button');
        const viewFoiaModalActionTrigger = document.getElementById('view-foia-modal-action-trigger');
        const viewFoiaModalActionsMenu = document.getElementById('view-foia-modal-actions-menu');
        const editFoiaModal = document.getElementById('edit-foia-modal');
        const editFoiaForm = document.getElementById('edit-foia-details-form');
        const saveEditedFoiaButton = document.getElementById('save-edited-foia-button');
        const editFoiaStatusArea = document.getElementById('edit-foia-status-area');
        const promptSettingsModalFoia = document.getElementById('prompt-settings-modal-foia');
        const openPromptSettingsButtonFoia = document.getElementById('open-prompt-settings-modal-button-foia');
        const promptSectionSelectorFoia = document.getElementById('promptSectionSelectorFoia');
        const foiaIndividualPromptTextarea = document.getElementById('foiaIndividualPromptTextarea');
        const saveCurrentPromptButtonFoia = document.getElementById('save-current-prompt-button-foia');
        const resetCurrentPromptButtonFoia = document.getElementById('reset-current-prompt-button-foia');
        const resetAllPromptsButtonFoia = document.getElementById('reset-all-prompts-button-foia');
        const promptSaveStatusFoia = document.getElementById('prompt-save-status-foia');
        const chatbotModal = document.getElementById('chatbot-modal');
        const openChatbotButton = document.getElementById('open-chatbot-button');
        const closeChatbotButton = document.getElementById('close-chatbot-button');
        const chatbotForm = document.getElementById('chatbot-form');
        const chatbotInput = document.getElementById('chatbot-input');
        const chatbotMessages = document.getElementById('chatbot-messages');
        const typePrefix = 'foia';

        // State
        let allFetchedAnalyses = [];
        let currentStatusFilter = 'all_statuses';
        let serverFoiaPrompts = {};
        let currentlyViewedFoiaAnalysis = null;
        let originalFoiaTextForReanalysis = "";

        // --- INITIALIZATION & EVENT LISTENERS ---
        initializePage();

        function initializePage() {
            loadSavedAnalyses();
            fetchPrompts();
            addEventListeners();
        }
        
        function addEventListeners() {
            openNewFoiaModalButton.addEventListener('click', () => {
                foiaForm.reset();
                openModal(newFoiaModal);
            });
            document.querySelectorAll('.modal-close-button').forEach(btn => {
                btn.addEventListener('click', () => closeModal(btn.closest('.modal-overlay')));
            });
            foiaForm.addEventListener('submit', handleNewFoiaAnalysis);
            editFoiaForm.addEventListener('submit', handleEditFoiaSave);
            openPromptSettingsButtonFoia.addEventListener('click', () => openModal(promptSettingsModalFoia));
            promptSectionSelectorFoia.addEventListener('change', loadSelectedPromptToTextarea);
            saveCurrentPromptButtonFoia.addEventListener('click', saveCurrentPrompt);
            resetCurrentPromptButtonFoia.addEventListener('click', () => {
                const selectedKey = promptSectionSelectorFoia.value;
                foiaIndividualPromptTextarea.value = FOIA_PROMPT_CONFIG[selectedKey].defaultText;
                saveCurrentPrompt();
            });
            resetAllPromptsButtonFoia.addEventListener('click', resetAllPrompts);
            closeViewFoiaDetailsButton.addEventListener('click', () => closeModal(viewSavedFoiaDetailsSection));
            viewFoiaModalActionTrigger.addEventListener('click', (e) => {
                e.stopPropagation();
                viewFoiaModalActionsMenu.style.display = viewFoiaModalActionsMenu.style.display === 'block' ? 'none' : 'block';
            });
            foiaListTabsContainer.addEventListener('click', (e) => {
                if (e.target.classList.contains('rfp-list-tab-button')) {
                    foiaListTabsContainer.querySelectorAll('.rfp-list-tab-button').forEach(btn => btn.classList.remove('active'));
                    e.target.classList.add('active');
                    currentStatusFilter = e.target.dataset.statusFilter;
                    renderAnalysesList();
                }
            });
            viewAnalysisResultsAreaFoia.addEventListener('click', function(event) {
                const target = event.target.closest('.tab-link');
                if (!target) return;
                const tabId = target.dataset.tabId;
                const tabContainer = target.closest('.tabs-container');
                tabContainer.querySelectorAll('.tab-link').forEach(link => link.classList.remove('active'));
                target.classList.add('active');
                viewAnalysisResultsAreaFoia.querySelectorAll('.tab-content').forEach(content => {
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
            showLoadingMessage(promptSaveStatusFoia, "Loading prompts...", true);
            try {
                const response = await fetch('/api/foia-prompt-settings');
                if (!response.ok) throw new Error('Failed to fetch prompts.');
                const data = await response.json();
                serverFoiaPrompts = data.prompts || {};
                Object.keys(FOIA_PROMPT_CONFIG).forEach(key => {
                    if (!serverFoiaPrompts[key]) serverFoiaPrompts[key] = FOIA_PROMPT_CONFIG[key].defaultText;
                });
                loadSelectedPromptToTextarea();
                showLoadingMessage(promptSaveStatusFoia, "Prompts loaded.", false);
            } catch (error) {
                showLoadingMessage(promptSaveStatusFoia, `Error: ${error.message}`, false);
            } finally {
                hideLoadingMessage(promptSaveStatusFoia, 2000);
            }
        }

        function loadSelectedPromptToTextarea() {
            const selectedKey = promptSectionSelectorFoia.value;
            foiaIndividualPromptTextarea.value = serverFoiaPrompts[selectedKey] || FOIA_PROMPT_CONFIG[selectedKey].defaultText;
        }

        async function saveCurrentPrompt() {
            const selectedKey = promptSectionSelectorFoia.value;
            serverFoiaPrompts[selectedKey] = foiaIndividualPromptTextarea.value;
            showLoadingMessage(promptSaveStatusFoia, "Saving prompt...", true);
            try {
                const response = await fetch('/api/foia-prompt-settings', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ prompts: serverFoiaPrompts }),
                });
                 if (!response.ok) throw new Error('Failed to save prompt.');
                showLoadingMessage(promptSaveStatusFoia, "Prompt saved!", false);
            } catch (error) {
                showLoadingMessage(promptSaveStatusFoia, `Error: ${error.message}`, false);
            } finally {
                hideLoadingMessage(promptSaveStatusFoia, 2000);
            }
        }
        
        async function resetAllPrompts() {
            if (!confirm("Are you sure you want to reset ALL FOIA prompts to their defaults?")) return;
            Object.keys(FOIA_PROMPT_CONFIG).forEach(key => {
                serverFoiaPrompts[key] = FOIA_PROMPT_CONFIG[key].defaultText;
            });
            loadSelectedPromptToTextarea();
            await saveCurrentPrompt();
        }

        async function handleNewFoiaAnalysis(event) {
            event.preventDefault();
            const foiaFiles = document.getElementById('foiaFileUpload').files;
            if (foiaFiles.length === 0) {
                alert("Please upload at least one FOIA document.");
                return;
            }

            showLoadingMessage(modalAnalysisStatusAreaFoia, "Uploading & processing...", true, generateAnalysisButtonFoia);

            const formData = new FormData();
            formData.append('main_rfp', foiaFiles[0]);
            for (let i = 1; i < foiaFiles.length; i++) {
                formData.append('addendum_files', foiaFiles[i]);
            }

            try {
                const processResponse = await fetch(`${PYTHON_BACKEND_URL}/process-rfp-pdf/`, {
                    method: 'POST',
                    body: formData,
                });
                const processResult = await processResponse.json();
                if (!processResponse.ok || processResult.status === "error") {
                    throw new Error(processResult.error_message || "Failed to extract text from PDF(s).");
                }
                
                const extractedText = processResult.extracted_text;
                showLoadingMessage(modalAnalysisStatusAreaFoia, "Text extracted. Generating analysis...", true);
                
                const fullPrompt = constructFullFoiaAnalysisPrompt(extractedText, serverFoiaPrompts);
                
                const geminiResponse = await fetch('/api/generate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ prompt: fullPrompt }),
                });
                if (!geminiResponse.ok) throw new Error("AI analysis failed.");
                const geminiResult = await geminiResponse.json();
                const parsedSections = parseFoiaAiResponse(geminiResult.generatedText);

                const fileNames = Array.from(foiaFiles).map(f => f.name);

                const saveData = {
                    foiaTitle: document.getElementById('foiaTitle').value || fileNames.join(', '),
                    submittedBy: document.getElementById('submittedByFoia').value,
                    foiaFileNames: fileNames,
                    originalFoiaFullText: extractedText,
                    ...parsedSections,
                    status: 'analyzed',
                    analysisPrompts: { ...serverFoiaPrompts }
                };
                
                const saveResponse = await fetch('/api/foia-analysis', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(saveData),
                });
                if (!saveResponse.ok) throw new Error("Failed to save the final analysis.");
                const newAnalysis = await saveResponse.json();

                closeModal(newFoiaModal);
                await loadSavedAnalyses();
                displayFoiaDetails(newAnalysis.id);

            } catch (error) {
                console.error('Analysis pipeline failed:', error);
                showLoadingMessage(modalAnalysisStatusAreaFoia, `Error: ${error.message}`, false);
            } finally {
                hideLoadingMessage(modalAnalysisStatusAreaFoia, 4000, generateAnalysisButtonFoia);
            }
        }
        
        async function loadSavedAnalyses() {
             showLoadingMessage(foiaListStatusArea, "Loading saved analyses...", true);
            try {
                const response = await fetch('/api/foia-analyses');
                if (!response.ok) throw new Error('Failed to fetch analyses.');
                allFetchedAnalyses = await response.json();
                renderAnalysesList();
            } catch (error) {
                showLoadingMessage(foiaListStatusArea, `Error: ${error.message}`, false);
            } finally {
                hideLoadingMessage(foiaListStatusArea);
            }
        }
        
        function renderAnalysesList() {
            savedAnalysesListDivFoia.innerHTML = '';
            let filteredAnalyses = allFetchedAnalyses.filter(a => currentStatusFilter === 'all_statuses' || a.status === currentStatusFilter);
            
            if (filteredAnalyses.length === 0) {
                noSavedAnalysesPFoia.style.display = 'block';
                noSavedAnalysesPFoia.textContent = 'No analyses found for this filter.';
                return;
            }
            noSavedAnalysesPFoia.style.display = 'none';

            filteredAnalyses.forEach(analysis => {
                const itemDiv = document.createElement('div');
                itemDiv.className = 'analyzed-rfp-item';
                const displayTitle = analysis.foiaTitle || (analysis.foiaFileNames ? analysis.foiaFileNames.join(', ') : 'Untitled');
                const statusDotClass = analysis.status === 'active' ? 'green' : analysis.status === 'not_pursuing' ? 'red' : analysis.status === 'archived' ? 'grey' : 'orange';
                itemDiv.innerHTML = `
                    <span class="rfp-col-title" title="${displayTitle}">${displayTitle}</span>
                    <span class="rfp-col-type">${analysis.foiaType || 'N/A'}</span>
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
                viewBtn.onclick = () => displayFoiaDetails(analysis.id);
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
                
                addDropdownItemToMenu(dropdownMenu, 'fa-edit', 'Edit Details', () => openEditFoiaModal(analysis));
                dropdownMenu.appendChild(document.createElement('div')).className = 'dropdown-divider';
                ['active', 'not_pursuing', 'archived', 'analyzed'].filter(s => s !== analysis.status).forEach(s => {
                    addDropdownItemToMenu(dropdownMenu, 'fa-check-circle', `Move to ${s}`, async () => {
                        if (await updateAnalysisStatus(analysis.id, s, typePrefix, foiaListStatusArea)) {
                            loadSavedAnalyses();
                        }
                    });
                });
                dropdownMenu.appendChild(document.createElement('div')).className = 'dropdown-divider';
                addDropdownItemToMenu(dropdownMenu, 'fa-trash-alt', 'Delete', async () => {
                    if (await deleteAnalysis(analysis.id, displayTitle, typePrefix, foiaListStatusArea)) {
                        loadSavedAnalyses();
                    }
                });

                dropdownContainer.appendChild(dropdownTrigger);
                dropdownContainer.appendChild(dropdownMenu);
                actionsContainer.appendChild(dropdownContainer);
                savedAnalysesListDivFoia.appendChild(itemDiv);
            });
        }
        
        async function displayFoiaDetails(analysisId) {
            openModal(viewSavedFoiaDetailsSection);
            showLoadingMessage(viewFoiaStatusArea, "Loading FOIA details...", true);

            try {
                const response = await fetch(`/api/foia-analysis/${analysisId}`);
                if (!response.ok) throw new Error('Failed to fetch details.');
                const analysis = await response.json();
                currentlyViewedFoiaAnalysis = analysis;
                originalFoiaTextForReanalysis = analysis.originalFoiaFullText || "";
                
                viewFoiaMainTitleHeading.textContent = analysis.foiaTitle || (analysis.foiaFileNames ? analysis.foiaFileNames.join(', ') : 'FOIA Details');
                
                viewFoiaModalActionsMenu.innerHTML = '';
                addDropdownItemToMenu(viewFoiaModalActionsMenu, 'fa-edit', 'Edit Details', () => openEditFoiaModal(analysis));
                viewFoiaModalActionsMenu.appendChild(document.createElement('div')).className = 'dropdown-divider';
                ['active', 'not_pursuing', 'archived', 'analyzed'].filter(s => s !== analysis.status).forEach(s => {
                    addDropdownItemToMenu(viewFoiaModalActionsMenu, 'fa-check-circle', `Move to ${s}`, async () => {
                        if (await updateAnalysisStatus(analysis.id, s, typePrefix, viewFoiaStatusArea)) {
                            closeModal(viewSavedFoiaDetailsSection);
                            loadSavedAnalyses();
                        }
                    });
                });
                viewFoiaModalActionsMenu.appendChild(document.createElement('div')).className = 'dropdown-divider';
                addDropdownItemToMenu(viewFoiaModalActionsMenu, 'fa-trash-alt', 'Delete', async () => {
                     if (await deleteAnalysis(analysis.id, analysis.foiaTitle || analysis.foiaFileNames.join(', '), typePrefix, viewFoiaStatusArea)) {
                        closeModal(viewSavedFoiaDetailsSection);
                        loadSavedAnalyses();
                    }
                });

                Object.keys(FOIA_PROMPT_CONFIG).forEach(key => {
                    if (key === 'documentType') return;
                    const parentId = `view-${key.toLowerCase().replace(/ /g, '-')}-result-content-foia`.replace("proposalcomparison", "comparison-rating");
                    const parentElement = document.getElementById(parentId);
                    if (parentElement) {
                        formatAndDisplaySection(parentElement, key, analysis);
                    }
                });
                
                const firstTab = viewAnalysisResultsAreaFoia.querySelector('.tab-link');
                if(firstTab) firstTab.click();

            } catch (error) {
                showLoadingMessage(viewFoiaStatusArea, `Error: ${error.message}`, false);
            } finally {
                hideLoadingMessage(viewFoiaStatusArea);
            }
        }
        
        function formatAndDisplaySection(parentElement, sectionKey, analysisData) {
            const config = FOIA_PROMPT_CONFIG[sectionKey];
            const analysisPrompts = analysisData.analysisPrompts || {};
            const sectionPrompt = analysisPrompts[sectionKey] || config.defaultText;
            let sectionContent = analysisData[config.databaseKey] || "Not specified.";

            parentElement.innerHTML = `
                <h3>${config.title}</h3>
                <div class="prompt-editor-container" id="prompt-editor-container-${sectionKey}-view">
                    <label for="prompt-edit-${sectionKey}-view">Prompt:</label>
                    <textarea id="prompt-edit-${sectionKey}-view" class="prompt-edit-textarea">${sectionPrompt}</textarea>
                    <button class="reanalyze-section-button btn btn-sm btn-info" data-section-key="${sectionKey}" data-foia-id="${analysisData.id}">Re-Analyze</button>
                    <div id="reanalyze-status-${sectionKey}-view" class="loading-container reanalyze-status-area" style="display: none;"></div>
                </div>
                <div class="section-content-display" id="section-content-display-${sectionKey}-view"></div>
                <button class="save-section-button btn btn-sm btn-success" data-section-key="${sectionKey}" data-foia-id="${analysisData.id}" style="display:none; margin-top: 10px;">Save Changes</button>
            `;
            
            const contentDisplayDiv = parentElement.querySelector('.section-content-display');
            formatAndDisplayContent(sectionContent, contentDisplayDiv);
            
            parentElement.querySelector('.reanalyze-section-button').addEventListener('click', handleReanalyzeSection);
            parentElement.querySelector('.save-section-button').addEventListener('click', handleSaveSectionChanges);
        }

        async function handleReanalyzeSection(event) {
            const button = event.currentTarget;
            const sectionKey = button.dataset.sectionKey;
            const config = FOIA_PROMPT_CONFIG[sectionKey];
            const statusArea = document.getElementById(`reanalyze-status-${sectionKey}-view`);
            const promptTextarea = document.getElementById(`prompt-edit-${sectionKey}-view`);
            const newPrompt = promptTextarea.value;
            
            showLoadingMessage(statusArea, `Re-analyzing ${config.title}...`, true, button);

            const targetedAiPrompt = `Regenerate ONLY the content for the section: "${config.title}".\nUse the specific prompt: "${newPrompt}"\nThe full FOIA text is below.\nWrap your response ONLY with ###${config.delimiterKey}_START### and ###${config.delimiterKey}_END###.\n\nFull FOIA Text:\n---\n${originalFoiaTextForReanalysis}\n---`;

            try {
                const response = await fetch('/api/generate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ prompt: targetedAiPrompt })
                });
                if (!response.ok) throw new Error("AI re-analysis failed.");
                
                const result = await response.json();
                const parsedResponse = parseFoiaAiResponse(result.generatedText);
                const newContent = parsedResponse[config.databaseKey] || "Re-analysis did not return expected format.";
                
                const contentDisplayDiv = document.getElementById(`section-content-display-${sectionKey}-view`);
                formatAndDisplayContent(newContent, contentDisplayDiv);
                
                currentlyViewedFoiaAnalysis[config.databaseKey] = newContent;
                if (!currentlyViewedFoiaAnalysis.analysisPrompts) currentlyViewedFoiaAnalysis.analysisPrompts = {};
                currentlyViewedFoiaAnalysis.analysisPrompts[sectionKey] = newPrompt;

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
            const config = FOIA_PROMPT_CONFIG[sectionKey];
            const statusArea = document.getElementById(`reanalyze-status-${sectionKey}-view`);
            
            showLoadingMessage(statusArea, `Saving changes...`, true, button);

            const payload = {
                [config.databaseKey]: currentlyViewedFoiaAnalysis[config.databaseKey],
                analysisPrompts: currentlyViewedFoiaAnalysis.analysisPrompts
            };

            try {
                const response = await fetch(`/api/foia-analysis/${currentlyViewedFoiaAnalysis.id}`, {
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

        function openEditFoiaModal(analysis) {
            editFoiaForm.reset();
            editFoiaForm.elements.editFoiaId.value = analysis.id;
            editFoiaForm.elements.foiaTitle.value = analysis.foiaTitle || '';
            editFoiaForm.elements.editFoiaFileNames.value = (analysis.foiaFileNames || []).join('\n');
            editFoiaForm.elements.foiaType.value = analysis.foiaType || '';
            editFoiaForm.elements.submittedBy.value = analysis.submittedBy || 'Other';
            editFoiaForm.elements.status.value = analysis.status || 'analyzed';
            
            Object.keys(FOIA_PROMPT_CONFIG).forEach(key => {
                const dbKey = FOIA_PROMPT_CONFIG[key].databaseKey;
                const formElement = editFoiaForm.elements[dbKey];
                if(formElement) {
                    formElement.value = analysis[dbKey] || '';
                }
            });
            
            openModal(editFoiaModal);
        }

        async function handleEditFoiaSave(event) {
            event.preventDefault();
            showLoadingMessage(editFoiaStatusArea, "Saving all changes...", true, saveEditedFoiaButton);
            const foiaId = editFoiaForm.elements.editFoiaId.value;
            
            const updates = {};
            for(const element of editFoiaForm.elements) {
                if(element.name && !['editFoiaFileNames', 'foiaType', 'editFoiaId'].includes(element.name)) {
                    updates[element.name] = element.value;
                }
            }

            try {
                const response = await fetch(`/api/foia-analysis/${foiaId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(updates)
                });
                if(!response.ok) throw new Error("Failed to save.");
                
                showLoadingMessage(editFoiaStatusArea, "All changes saved!", false);
                await loadSavedAnalyses();
                setTimeout(() => closeModal(editFoiaModal), 1500);

            } catch(error) {
                showLoadingMessage(editFoiaStatusArea, `Error: ${error.message}`, false);
            } finally {
                hideLoadingMessage(editFoiaStatusArea, 3000, saveEditedFoiaButton);
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

        function constructFullFoiaAnalysisPrompt(foiaText, prompts) {
            let fullPrompt = "Please analyze the following Freedom of Information Act (FOIA) document(s).\nProvide the following distinct sections in your response, each clearly delimited:";
            Object.keys(FOIA_PROMPT_CONFIG).forEach(key => {
                fullPrompt += `\n\n${prompts[key] || FOIA_PROMPT_CONFIG[key].defaultText}`;
            });
            fullPrompt += "\n\nUse the following format strictly for each section:";
            Object.keys(FOIA_PROMPT_CONFIG).forEach(key => {
                fullPrompt += `\n\n###${FOIA_PROMPT_CONFIG[key].delimiterKey}_START###\n[Content for ${FOIA_PROMPT_CONFIG[key].delimiterKey}]\n###${FOIA_PROMPT_CONFIG[key].delimiterKey}_END###`;
            });
            fullPrompt += `\n\nFOIA Document Text:\n---\n${foiaText}\n---`;
            return fullPrompt;
        }

        function parseFoiaAiResponse(generatedText) {
            const parsed = {};
            Object.keys(FOIA_PROMPT_CONFIG).forEach(key => {
                const config = FOIA_PROMPT_CONFIG[key];
                const regex = new RegExp(`###${config.delimiterKey}_START###([\\s\\S]*?)###${config.delimiterKey}_END###`, 'i');
                const match = generatedText.match(regex);
                parsed[config.databaseKey] = match && match[1] ? match[1].trim() : "Not found in AI response.";
            });
            return parsed;
        }
    }
});