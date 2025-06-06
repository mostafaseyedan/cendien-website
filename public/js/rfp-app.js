/**
 * @file rfp-app.js
 * @description Main application logic for the RFP Analyzer page.
 */

import { initializeAuth } from './modules/auth.js';
import * as api from './modules/apiService.js';
import * as ui from './modules/uiManager.js';
import { initializePdfWorker, extractTextFromPdf } from './modules/pdfHandler.js';
import { RFP_PROMPT_CONFIG } from './modules/config.js';

document.addEventListener('DOMContentLoaded', () => {
    initializePdfWorker();

    const elements = {
        // Auth
        authModal: document.getElementById('auth-modal-overlay'),
        authForm: document.getElementById('auth-form'),
        usernameInput: document.getElementById('auth-username'),
        passwordInput: document.getElementById('auth-password'),
        errorMessage: document.getElementById('auth-error-message'),
        pageWrapper: document.getElementById('page-content-wrapper'),
        // Main Page
        listContainer: document.getElementById('saved-analyses-list'),
        noItemsP: document.getElementById('no-saved-analyses'),
        listStatusArea: document.getElementById('rfp-list-status-area'),
        listTabsContainer: document.querySelector('.rfp-list-tabs'),
        sortableHeaders: document.querySelectorAll('#saved-analyses-header .sortable-header'),
        // New RFP Modal
        newRfpModal: document.getElementById('new-rfp-modal'),
        openNewRfpModalButton: document.getElementById('open-new-rfp-modal-button'),
        newRfpModalCloseButton: document.getElementById('modal-close-button'),
        newRfpForm: document.getElementById('rfp-details-form'),
        rfpFileUpload: document.getElementById('rfpFileUpload'),
        rfpAddendumUpload: document.getElementById('rfpAddendumUpload'),
        generateAnalysisButton: document.getElementById('generate-analysis-button'),
        modalAnalysisStatusArea: document.getElementById('modal-analysis-status-area'),
        modalAnalysisResultsArea: document.getElementById('modal-analysis-results-area'),
        // View Modal
        viewModal: document.getElementById('view-saved-rfp-details-section'),
        viewModalCloseButton: document.getElementById('close-view-rfp-details-button'),
        viewModalTitle: document.getElementById('view-rfp-main-title-heading'),
        viewModalStatusArea: document.getElementById('view-rfp-status-area'),
        viewModalContentArea: document.getElementById('view-analysis-results-area'),
        viewModalActionTrigger: document.getElementById('view-rfp-modal-action-trigger'),
        viewModalActionsMenu: document.getElementById('view-rfp-modal-actions-menu'),
        // Edit Modal
        editModal: document.getElementById('edit-rfp-modal'),
        editModalCloseButton: document.getElementById('edit-rfp-modal-close-button'),
        cancelEditButton: document.getElementById('cancel-edit-rfp-button'),
        editForm: document.getElementById('edit-rfp-details-form'),
        saveEditedButton: document.getElementById('save-edited-rfp-button'),
        editStatusArea: document.getElementById('edit-rfp-status-area'),
        // Prompt Settings Modal
        promptSettingsModal: document.getElementById('prompt-settings-modal'),
        openPromptSettingsModalButton: document.getElementById('open-prompt-settings-modal-button'),
        promptSettingsModalCloseButton: document.getElementById('prompt-modal-close-button'),
        promptSectionSelector: document.getElementById('promptSectionSelector'),
        individualPromptTextarea: document.getElementById('rfpIndividualPromptTextarea'),
        saveCurrentPromptButton: document.getElementById('save-current-prompt-button'),
        resetCurrentPromptButton: document.getElementById('reset-current-prompt-button'),
        resetAllPromptsButton: document.getElementById('reset-all-prompts-button'),
        promptSaveStatus: document.getElementById('prompt-save-status'),
    };

    let state = {
        type: 'rfp',
        allAnalyses: [],
        currentSortKey: 'analysisDate',
        currentSortOrder: 'desc',
        currentStatusFilter: 'all_statuses',
        currentlyViewedAnalysis: null,
        originalTextForReanalysis: "",
        promptConfig: RFP_PROMPT_CONFIG,
        serverPrompts: null, // Will hold prompts fetched from the server
    };
    
    function updateSharedState() {
        ui.updateSharedState({
            type: state.type,
            allAnalyses: state.allAnalyses,
            sortKey: state.currentSortKey,
            sortOrder: state.currentSortOrder,
            statusFilter: state.currentStatusFilter,
            promptConfig: state.promptConfig,
            currentlyViewedAnalysis: state.currentlyViewedAnalysis,
            originalTextForReanalysis: state.originalTextForReanalysis,
            elements: elements,
            actionHandlers: {
                onView: openRfpViewModal,
                onEdit: openRfpEditModal,
                onStatusUpdate: updateRfpStatus,
                onDelete: deleteRfpAnalysis,
                onReanalyze: handleReanalyzeSection,
                onSaveSection: handleSaveSectionChanges,
            }
        });
    }

    async function initializeRfpPage() {
        console.log("RFP Analyzer: Initializing app logic...");
        ui.initializeUIManager({ elements, state });
        updateSharedState();
        await loadSavedAnalyses();
        setupEventListeners();
    }
    
    async function loadSavedAnalyses() {
        ui.showLoadingMessage(elements.listStatusArea, "Loading saved analyses...");
        try {
            state.allAnalyses = await api.getAnalyses(state.type);
            updateSharedState();
            ui.renderAnalysesList();
        } catch (error) {
            console.error(`Failed to load ${state.type} analyses:`, error);
            elements.listStatusArea.innerHTML = `<p class="loading-text" style="color:red;">Failed to load analyses: ${error.message}</p>`;
        } finally {
            ui.hideLoadingMessage(elements.listStatusArea, 500);
        }
    }

    function setupEventListeners() {
        // Main page buttons
        elements.openNewRfpModalButton?.addEventListener('click', () => {
            elements.newRfpForm.reset();
            elements.modalAnalysisResultsArea.style.display = 'none';
            elements.modalAnalysisStatusArea.style.display = 'none';
            ui.openModal(elements.newRfpModal);
        });
        elements.openPromptSettingsModalButton?.addEventListener('click', openPromptSettingsModal);

        // Tab functionality
        document.querySelectorAll('.tabs-container').forEach(container => {
            container.addEventListener('click', (e) => {
                if (e.target.classList.contains('tab-link')) {
                    const tabId = e.target.dataset.tab;
                    const isViewTab = tabId.startsWith('view-');
                    const isModalTab = tabId.startsWith('modal-');
                    
                    // Remove active class from all tabs in this container
                    container.querySelectorAll('.tab-link').forEach(tab => tab.classList.remove('active'));
                    e.target.classList.add('active');
                    
                    // Hide all tab content
                    const tabContents = isViewTab ? 
                        document.querySelectorAll('#view-analysis-results-area .tab-content') :
                        document.querySelectorAll('#modal-analysis-results-area .tab-content');
                    
                    tabContents.forEach(content => content.style.display = 'none');
                    
                    // Show selected tab content
                    const selectedContent = document.getElementById(tabId);
                    if (selectedContent) {
                        selectedContent.style.display = 'block';
                    }
                }
            });
        });

        // List controls
        elements.listTabsContainer?.addEventListener('click', (e) => {
            if (e.target.classList.contains('rfp-list-tab-button')) {
                elements.listTabsContainer.querySelectorAll('.rfp-list-tab-button').forEach(btn => btn.classList.remove('active'));
                e.target.classList.add('active');
                state.currentStatusFilter = e.target.dataset.statusFilter;
                updateSharedState();
                ui.renderAnalysesList();
            }
        });

        elements.sortableHeaders?.forEach(header => {
            header.addEventListener('click', () => {
                const sortKey = header.dataset.sortKey;
                if (state.currentSortKey === sortKey) {
                    state.currentSortOrder = state.currentSortOrder === 'asc' ? 'desc' : 'asc';
                } else {
                    state.currentSortKey = sortKey;
                    state.currentSortOrder = 'desc';
                }
                updateSharedState();
                ui.renderAnalysesList();
            });
        });

        // Modal close buttons
        elements.newRfpModalCloseButton?.addEventListener('click', () => ui.closeModal(elements.newRfpModal));
        elements.viewModalCloseButton?.addEventListener('click', () => ui.closeModal(elements.viewModal));
        elements.editModalCloseButton?.addEventListener('click', () => ui.closeModal(elements.editModal));
        elements.cancelEditButton?.addEventListener('click', () => ui.closeModal(elements.editModal));
        elements.promptSettingsModalCloseButton?.addEventListener('click', () => ui.closeModal(elements.promptSettingsModal));
        
        // Forms and actions
        elements.newRfpForm?.addEventListener('submit', handleNewRfpSubmission);
        elements.editForm?.addEventListener('submit', handleEditRfpSubmission);
        
        elements.viewModalActionTrigger?.addEventListener('click', (e) => {
            e.stopPropagation();
            ui.populateViewModalActions(state.currentlyViewedAnalysis);
            elements.viewModalActionsMenu.style.display = elements.viewModalActionsMenu.style.display === 'block' ? 'none' : 'block';
        });

        // Prompt Settings controls
        elements.promptSectionSelector?.addEventListener('change', (e) => updatePromptTextarea(e.target.value));
        elements.saveCurrentPromptButton?.addEventListener('click', saveCurrentPrompt);
        elements.resetCurrentPromptButton?.addEventListener('click', resetCurrentPrompt);
        elements.resetAllPromptsButton?.addEventListener('click', resetAllPrompts);
    }
    
    // ... (handleNewRfpSubmission, handleEditRfpSubmission, openRfpViewModal, etc. remain the same) ...
    async function handleNewRfpSubmission(event) {
        event.preventDefault();
        ui.showLoadingMessage(elements.modalAnalysisStatusArea, "Starting analysis...", true);
        elements.modalAnalysisResultsArea.style.display = 'none';

        const mainFile = elements.rfpFileUpload.files[0];
        if (!mainFile) {
            ui.showLoadingMessage(elements.modalAnalysisStatusArea, "Please upload the main RFP document.", false);
            ui.hideLoadingMessage(elements.modalAnalysisStatusArea, 3000);
            return;
        }

        let fullText = "";
        try {
            ui.showLoadingMessage(elements.modalAnalysisStatusArea, `Extracting text from ${mainFile.name}...`, true);
            fullText = await extractTextFromPdf(mainFile);
            const addendumFiles = elements.rfpAddendumUpload.files;
            for (let i = 0; i < addendumFiles.length; i++) {
                const file = addendumFiles[i];
                ui.showLoadingMessage(elements.modalAnalysisStatusArea, `Extracting text from ${file.name}...`, true);
                fullText += `\n\n--- Addendum: ${file.name} ---\n\n` + await extractTextFromPdf(file);
            }
        } catch (error) {
            ui.showLoadingMessage(elements.modalAnalysisStatusArea, `PDF Error: ${error.message}`, false);
            ui.hideLoadingMessage(elements.modalAnalysisStatusArea, 5000);
            return;
        }
        
        state.originalTextForReanalysis = fullText;

        try {
            ui.showLoadingMessage(elements.modalAnalysisStatusArea, "AI is analyzing...", true);
            const prompt = ui.constructAnalysisPrompt(state.type, fullText, state.promptConfig, state.serverPrompts);
            const result = await api.generateContent(prompt);
            const parsedSections = ui.parseGeneratedContent(result.generatedText, state.promptConfig);

            const formData = new FormData(elements.newRfpForm);
            const payload = {
                rfpTitle: formData.get('rfpTitle') || mainFile.name,
                rfpType: formData.get('rfpType'),
                submittedBy: formData.get('submittedBy'),
                rfpFileName: mainFile.name,
                originalRfpFullText: fullText,
                analysisPrompts: state.serverPrompts || {},
            };
            Object.keys(state.promptConfig).forEach(key => {
                const dbKey = state.promptConfig[key].databaseKey;
                if(dbKey) payload[dbKey] = parsedSections[dbKey];
            });

            const savedAnalysis = await api.saveNewAnalysis(state.type, payload);
            await loadSavedAnalyses();
            ui.showLoadingMessage(elements.modalAnalysisStatusArea, "Analysis complete and saved!", false);
            ui.populateNewRfpModalResults(parsedSections); // Display results
        } catch (error) {
            console.error("Error during new RFP submission process:", error);
            ui.showLoadingMessage(elements.modalAnalysisStatusArea, `Error: ${error.message}`, false);
        }
    }

    async function handleEditRfpSubmission(event) {
        event.preventDefault();
        const rfpId = elements.editForm.querySelector('#editRfpId').value;
        if (!rfpId) {
            ui.showLoadingMessage(elements.editStatusArea, "Error: RFP ID is missing.", false);
            ui.hideLoadingMessage(elements.editStatusArea, 3000);
            return;
        }
        
        const formData = new FormData(elements.editForm);
        const updatedData = {};
        for(let [key, value] of formData.entries()) {
            if (key.startsWith('edit')) {
                let newKey = key.substring(4); // remove 'edit'
                newKey = newKey.charAt(0).toLowerCase() + newKey.slice(1);
                updatedData[newKey] = value;
            }
        }
        delete updatedData.rfpId;
        delete updatedData.rfpFileName;

        ui.showLoadingMessage(elements.editStatusArea, "Saving changes...", true);
        try {
            await api.updateAnalysis(state.type, rfpId, updatedData);
            await loadSavedAnalyses();
            ui.showLoadingMessage(elements.editStatusArea, "Changes saved successfully!", false);
            setTimeout(() => ui.closeModal(elements.editModal), 2000);
        } catch (error) {
            console.error("Error saving RFP details:", error);
            ui.showLoadingMessage(elements.editStatusArea, `Error: ${error.message}`, false);
        }
    }
    
    async function openRfpViewModal(analysisId) {
        ui.showLoadingMessage(elements.viewModalStatusArea, "Loading analysis details...", true);
        ui.openModal(elements.viewModal);
        try {
            const analysis = await api.getAnalysisDetails(state.type, analysisId);
            state.currentlyViewedAnalysis = analysis;
            state.originalTextForReanalysis = analysis.originalRfpFullText || "";
            updateSharedState();
            ui.populateViewModal(analysis);
            ui.hideLoadingMessage(elements.viewModalStatusArea);
        } catch (error) {
            ui.showLoadingMessage(elements.viewModalStatusArea, `Error: ${error.message}`, false);
        }
    }

    async function openRfpEditModal(analysis) {
        const fullAnalysis = await api.getAnalysisDetails(state.type, analysis.id);
        ui.populateEditModal(fullAnalysis);
        ui.openModal(elements.editModal);
    }

    async function updateRfpStatus(analysisId, newStatus) {
        const statusArea = elements.viewModal.style.display === 'block' ? elements.viewModalStatusArea : elements.listStatusArea;
        ui.showLoadingMessage(statusArea, `Updating status to ${newStatus}...`, true);
        try {
            await api.updateAnalysisStatus(state.type, analysisId, newStatus);
            await loadSavedAnalyses();
            if (elements.viewModal.style.display === 'block' && state.currentlyViewedAnalysis?.id === analysisId) {
                state.currentlyViewedAnalysis.status = newStatus;
                updateSharedState();
                ui.populateViewModalActions(state.currentlyViewedAnalysis);
            }
            ui.showLoadingMessage(statusArea, 'Status updated!', false);
        } catch (error) {
            ui.showLoadingMessage(statusArea, `Error: ${error.message}`, false);
        } finally {
            ui.hideLoadingMessage(statusArea, 3000);
        }
    }

    async function deleteRfpAnalysis(analysisId, title) {
        if (!window.confirm(`Are you sure you want to delete RFP: "${title}"?`)) return;
        ui.showLoadingMessage(elements.listStatusArea, `Deleting "${title}"...`, true);
        try {
            await api.deleteAnalysis(state.type, analysisId);
            await loadSavedAnalyses();
             if (elements.viewModal.style.display === 'block' && state.currentlyViewedAnalysis?.id === analysisId) {
                ui.closeModal(elements.viewModal);
            }
            ui.showLoadingMessage(elements.listStatusArea, 'Successfully deleted.', false);
        } catch (error) {
            ui.showLoadingMessage(elements.listStatusArea, `Error deleting: ${error.message}`, false);
        } finally {
            ui.hideLoadingMessage(elements.listStatusArea, 3000);
        }
    }

    async function handleReanalyzeSection(sectionKey) {
        console.log(`Re-analyzing section: ${sectionKey}`);
    }
    
    async function handleSaveSectionChanges(sectionKey) {
        console.log(`Saving changes for section: ${sectionKey}`);
    }

    // --- Prompt Settings Modal Logic ---
    async function openPromptSettingsModal() {
        ui.showLoadingMessage(elements.promptSaveStatus, "Loading current prompts...", true);
        ui.openModal(elements.promptSettingsModal);
        try {
            const response = await api.fetchPrompts(state.type);
            state.serverPrompts = response.prompts;
            updateSharedState();
            updatePromptTextarea(elements.promptSectionSelector.value);
            ui.hideLoadingMessage(elements.promptSaveStatus);
        } catch (error) {
            ui.showLoadingMessage(elements.promptSaveStatus, `Error: ${error.message}`, false);
        }
    }

    function updatePromptTextarea(sectionKey) {
        const promptValue = state.serverPrompts?.[sectionKey] || state.promptConfig[sectionKey]?.defaultText || "";
        elements.individualPromptTextarea.value = promptValue;
    }

    async function saveCurrentPrompt() {
        const sectionKey = elements.promptSectionSelector.value;
        const newPromptText = elements.individualPromptTextarea.value;
        const updatedPrompts = { ...(state.serverPrompts || {}), [sectionKey]: newPromptText };

        ui.showLoadingMessage(elements.promptSaveStatus, "Saving...", true);
        try {
            const savedData = await api.savePrompts(state.type, updatedPrompts);
            state.serverPrompts = savedData.prompts;
            updateSharedState();
            ui.showLoadingMessage(elements.promptSaveStatus, "Saved successfully!", false);
        } catch (error) {
            ui.showLoadingMessage(elements.promptSaveStatus, `Error saving: ${error.message}`, false);
        } finally {
            ui.hideLoadingMessage(elements.promptSaveStatus, 2000);
        }
    }

    function resetCurrentPrompt() {
        const sectionKey = elements.promptSectionSelector.value;
        const defaultValue = state.promptConfig[sectionKey]?.defaultText || "";
        elements.individualPromptTextarea.value = defaultValue;
    }

    async function resetAllPrompts() {
        if (!window.confirm("Are you sure you want to reset ALL prompts to their default values? This will be saved immediately.")) return;
        
        const defaultPrompts = {};
        Object.keys(state.promptConfig).forEach(key => {
            defaultPrompts[key] = state.promptConfig[key].defaultText;
        });

        ui.showLoadingMessage(elements.promptSaveStatus, "Resetting all prompts...", true);
        try {
            const savedData = await api.savePrompts(state.type, defaultPrompts);
            state.serverPrompts = savedData.prompts;
            updateSharedState();
            updatePromptTextarea(elements.promptSectionSelector.value);
            ui.showLoadingMessage(elements.promptSaveStatus, "All prompts reset to default!", false);
        } catch (error) {
            ui.showLoadingMessage(elements.promptSaveStatus, `Error resetting: ${error.message}`, false);
        } finally {
            ui.hideLoadingMessage(elements.promptSaveStatus, 2000);
        }
    }
    
    initializeAuth(
        elements.authModal,
        elements.authForm,
        elements.usernameInput,
        elements.passwordInput,
        elements.errorMessage,
        elements.pageWrapper,
        initializeRfpPage
    );
});
