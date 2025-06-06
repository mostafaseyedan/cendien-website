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
        serverPrompts: null,
    };
    
    // This function will pass the current state to the UI manager
    function updateSharedState() {
        ui.initializeSharedState({
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
        elements.openNewRfpModalButton?.addEventListener('click', () => {
            elements.newRfpForm.reset();
            elements.modalAnalysisResultsArea.style.display = 'none';
            elements.modalAnalysisStatusArea.style.display = 'none';
            ui.openModal(elements.newRfpModal);
        });

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

        elements.newRfpModalCloseButton?.addEventListener('click', () => ui.closeModal(elements.newRfpModal));
        elements.viewModalCloseButton?.addEventListener('click', () => ui.closeModal(elements.viewModal));
        elements.editModalCloseButton?.addEventListener('click', () => ui.closeModal(elements.editModal));
        elements.cancelEditButton?.addEventListener('click', () => ui.closeModal(elements.editModal));
        
        elements.newRfpForm?.addEventListener('submit', handleNewRfpSubmission);
        elements.editForm?.addEventListener('submit', handleEditRfpSubmission);
        
        elements.viewModalActionTrigger?.addEventListener('click', (e) => {
            e.stopPropagation();
            if (state.currentlyViewedAnalysis) {
                ui.populateViewModalActions(state.currentlyViewedAnalysis);
            }
            elements.viewModalActionsMenu.style.display = elements.viewModalActionsMenu.style.display === 'block' ? 'none' : 'block';
        });
    }
    
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
            const prompt = ui.constructAnalysisPrompt(state.type, fullText, state.promptConfig, null);
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
            // Map parsed sections to payload
            Object.keys(state.promptConfig).forEach(key => {
                const dbKey = state.promptConfig[key].databaseKey;
                if(dbKey) payload[dbKey] = parsedSections[dbKey];
            });

            const savedAnalysis = await api.saveNewAnalysis(state.type, payload);
            await loadSavedAnalyses();
            ui.showLoadingMessage(elements.modalAnalysisStatusArea, "Analysis complete and saved!", false);
            setTimeout(() => ui.closeModal(elements.newRfpModal), 2000);
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
        // Convert form data keys to match database fields
        for(let [key, value] of formData.entries()) {
            let newKey = key.replace('editRfp', 'rfp').replace('edit', '');
            newKey = newKey.charAt(0).toLowerCase() + newKey.slice(1);
            updatedData[newKey] = value;
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
        // Fetch full details if needed to ensure all textareas are populated
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
        // Full implementation would involve getting the new prompt from the UI,
        // constructing a targeted API call, and updating the view.
    }
    
    async function handleSaveSectionChanges(sectionKey) {
        console.log(`Saving changes for section: ${sectionKey}`);
    }
    
    initializeAuth({
        loginTimestampKey: 'rfpAnalyzerLoginTimestamp',
        authModalEl: elements.authModal,
        authFormEl: elements.authForm,
        usernameInputEl: elements.usernameInput,
        passwordInputEl: elements.passwordInput,
        errorMessageEl: elements.errorMessage,
        pageWrapperEl: elements.pageWrapper,
        onLoginSuccess: initializeRfpPage
    });
});

