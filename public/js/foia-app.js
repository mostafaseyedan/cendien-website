/**
 * @file foia-app.js
 * @description Main application logic for the FOIA Analyzer page.
 */

import { initializeAuth } from './modules/auth.js';
import * as api from './modules/apiService.js';
import * as ui from './modules/uiManager.js';
import { initializePdfWorker, extractTextFromPdf } from './modules/pdfHandler.js';
import { FOIA_PROMPT_CONFIG } from './modules/config.js';

document.addEventListener('DOMContentLoaded', () => {
    initializePdfWorker();

    const elements = {
        // Auth
        authModal: document.getElementById('auth-modal-overlay-foia'),
        authForm: document.getElementById('auth-form-foia'),
        usernameInput: document.getElementById('auth-username-foia'),
        passwordInput: document.getElementById('auth-password-foia'),
        errorMessage: document.getElementById('auth-error-message-foia'),
        pageWrapper: document.getElementById('page-content-wrapper-foia'),
        // Main Page
        listContainer: document.getElementById('saved-analyses-list-foia'),
        noItemsP: document.getElementById('no-saved-analyses-foia'),
        listStatusArea: document.getElementById('foia-list-status-area'),
        listTabsContainer: document.getElementById('foia-list-tabs'),
        sortableHeaders: document.querySelectorAll('#saved-analyses-header-foia .sortable-header'),
        // New Modal
        newModal: document.getElementById('new-foia-modal'),
        openNewModalButton: document.getElementById('open-new-foia-modal-button'),
        newModalCloseButton: document.getElementById('modal-close-button-foia'),
        newForm: document.getElementById('foia-details-form'),
        fileUpload: document.getElementById('foiaFileUpload'),
        generateAnalysisButton: document.getElementById('generate-analysis-button-foia'),
        modalAnalysisStatusArea: document.getElementById('modal-analysis-status-area-foia'),
        modalAnalysisResultsArea: document.getElementById('modal-analysis-results-area-foia'),
        // View Modal
        viewModal: document.getElementById('view-saved-foia-details-section'),
        viewModalCloseButton: document.getElementById('close-view-foia-details-button'),
        viewModalTitle: document.getElementById('view-foia-main-title-heading'),
        viewModalStatusArea: document.getElementById('view-foia-status-area'),
        viewModalContentArea: document.getElementById('view-analysis-results-area-foia'),
        viewModalActionTrigger: document.getElementById('view-foia-modal-action-trigger'),
        viewModalActionsMenu: document.getElementById('view-foia-modal-actions-menu'),
        // Edit Modal
        editModal: document.getElementById('edit-foia-modal'),
        editModalCloseButton: document.getElementById('edit-foia-modal-close-button'),
        cancelEditButton: document.getElementById('cancel-edit-foia-button'),
        editForm: document.getElementById('edit-foia-details-form'),
        saveEditedButton: document.getElementById('save-edited-foia-button'),
        editStatusArea: document.getElementById('edit-foia-status-area'),
    };

    let state = {
        type: 'foia',
        allAnalyses: [],
        currentSortKey: 'analysisDate',
        currentSortOrder: 'desc',
        currentStatusFilter: 'all_statuses',
        currentlyViewedAnalysis: null,
        originalTextForReanalysis: "",
        promptConfig: FOIA_PROMPT_CONFIG,
        serverPrompts: null,
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
                onView: openFoiaViewModal,
                onEdit: openFoiaEditModal,
                onStatusUpdate: updateFoiaStatus,
                onDelete: deleteFoiaAnalysis,
                onReanalyze: handleReanalyzeSection,
                onSaveSection: handleSaveSectionChanges,
            }
        });
    }

    async function initializeFoiaPage() {
        console.log("FOIA Analyzer: Initializing app logic...");
        ui.initializeUIManager({ elements, state });
        updateSharedState();
        await loadSavedAnalyses();
        setupEventListeners();
    }
    
    async function loadSavedAnalyses() {
        ui.showLoadingMessage(elements.listStatusArea, "Loading saved FOIA analyses...");
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
        elements.openNewModalButton?.addEventListener('click', () => {
            elements.newForm.reset();
            elements.modalAnalysisResultsArea.style.display = 'none';
            elements.modalAnalysisStatusArea.style.display = 'none';
            ui.openModal(elements.newModal);
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

        elements.newModalCloseButton?.addEventListener('click', () => ui.closeModal(elements.newModal));
        elements.viewModalCloseButton?.addEventListener('click', () => ui.closeModal(elements.viewModal));
        elements.editModalCloseButton?.addEventListener('click', () => ui.closeModal(elements.editModal));
        elements.cancelEditButton?.addEventListener('click', () => ui.closeModal(elements.editModal));

        elements.newForm?.addEventListener('submit', handleNewFoiaSubmission);
        elements.editForm?.addEventListener('submit', handleEditFoiaSubmission);

        elements.viewModalActionTrigger?.addEventListener('click', (e) => {
            e.stopPropagation();
            if (state.currentlyViewedAnalysis) {
                ui.populateViewModalActions(state.currentlyViewedAnalysis);
            }
            elements.viewModalActionsMenu.style.display = elements.viewModalActionsMenu.style.display === 'block' ? 'none' : 'block';
        });
    }

    async function handleNewFoiaSubmission(event) {
        event.preventDefault();
        ui.showLoadingMessage(elements.modalAnalysisStatusArea, "Starting FOIA analysis...", true);
        elements.modalAnalysisResultsArea.style.display = 'none';

        const files = elements.fileUpload.files;
        if (!files || files.length === 0) {
            ui.showLoadingMessage(elements.modalAnalysisStatusArea, "Please upload at least one FOIA document.", false);
            ui.hideLoadingMessage(elements.modalAnalysisStatusArea, 3000);
            return;
        }

        let fullText = "";
        let fileNames = [];
        try {
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                fileNames.push(file.name);
                ui.showLoadingMessage(elements.modalAnalysisStatusArea, `Extracting text from ${file.name}...`, true);
                fullText += `--- Document: ${file.name} ---\n` + await extractTextFromPdf(file) + "\n\n";
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

            const formData = new FormData(elements.newForm);
            const payload = {
                foiaTitle: formData.get('foiaTitle') || fileNames.join(', '),
                submittedBy: formData.get('submittedByFoia'),
                foiaFileNames: fileNames,
                originalFoiaFullText: fullText,
                analysisPrompts: state.serverPrompts || {},
            };
            Object.keys(state.promptConfig).forEach(key => {
                const dbKey = state.promptConfig[key].databaseKey;
                if(dbKey) payload[dbKey] = parsedSections[dbKey];
            });

            const savedAnalysis = await api.saveNewAnalysis(state.type, payload);
            await loadSavedAnalyses();
            ui.showLoadingMessage(elements.modalAnalysisStatusArea, "Analysis complete and saved!", false);
            setTimeout(() => ui.closeModal(elements.newModal), 2000);
        } catch (error) {
            console.error("Error during new FOIA submission process:", error);
            ui.showLoadingMessage(elements.modalAnalysisStatusArea, `Error: ${error.message}`, false);
        }
    }

    async function handleEditFoiaSubmission(event) {
        event.preventDefault();
        const foiaId = elements.editForm.querySelector('#editFoiaId').value;
        if (!foiaId) {
            ui.showLoadingMessage(elements.editStatusArea, "Error: FOIA ID is missing.", false);
            return;
        }
        
        const formData = new FormData(elements.editForm);
        const updatedData = {};
        for(let [key, value] of formData.entries()) {
            let newKey = key.replace('editFoia', 'foia').replace('edit', '');
            newKey = newKey.charAt(0).toLowerCase() + newKey.slice(1);
            updatedData[newKey] = value;
        }
        delete updatedData.foiaId;
        delete updatedData.foiaFileNames; // Read-only

        ui.showLoadingMessage(elements.editStatusArea, "Saving changes...", true);
        try {
            await api.updateAnalysis(state.type, foiaId, updatedData);
            await loadSavedAnalyses();
            ui.showLoadingMessage(elements.editStatusArea, "Changes saved successfully!", false);
            setTimeout(() => ui.closeModal(elements.editModal), 2000);
        } catch (error) {
            console.error("Error saving FOIA details:", error);
            ui.showLoadingMessage(elements.editStatusArea, `Error: ${error.message}`, false);
        }
    }

    async function openFoiaViewModal(analysisId) {
        ui.showLoadingMessage(elements.viewModalStatusArea, "Loading analysis details...", true);
        ui.openModal(elements.viewModal);
        try {
            const analysis = await api.getAnalysisDetails(state.type, analysisId);
            state.currentlyViewedAnalysis = analysis;
            state.originalTextForReanalysis = analysis.originalFoiaFullText || "";
            updateSharedState();
            ui.populateViewModal(analysis);
            ui.hideLoadingMessage(elements.viewModalStatusArea);
        } catch (error) {
            ui.showLoadingMessage(elements.viewModalStatusArea, `Error: ${error.message}`, false);
        }
    }

    async function openFoiaEditModal(analysis) {
        const fullAnalysis = await api.getAnalysisDetails(state.type, analysis.id);
        ui.populateEditModal(fullAnalysis);
        ui.openModal(elements.editModal);
    }

    async function updateFoiaStatus(analysisId, newStatus) {
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

    async function deleteFoiaAnalysis(analysisId, title) {
        if (!window.confirm(`Are you sure you want to delete FOIA analysis: "${title}"?`)) return;
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

    initializeAuth({
        loginTimestampKey: 'foiaAnalyzerLoginTimestamp',
        authModalEl: elements.authModal,
        authFormEl: elements.authForm,
        usernameInputEl: elements.usernameInput,
        passwordInputEl: elements.passwordInput,
        errorMessageEl: elements.errorMessage,
        pageWrapperEl: elements.pageWrapper,
        onLoginSuccess: initializeFoiaPage
    });
});
