/**
 * @file foia-app.js
 * @description Main application logic for the FOIA Analyzer page.
 */

import { initializeAuth } from './modules/auth.js';
import * as api from './modules/apiService.js';
import * as ui from './modules/uiManager.js';
import { initializePdfWorker, extractTextFromPdf } from './modules/pdfHandler.js';
import { FOIA_PROMPT_CONFIG, PROMPT_MAIN_INSTRUCTION, PROMPT_SECTION_DELIMITER_FORMAT, PROMPT_TEXT_SUFFIX } from './modules/config.js';

document.addEventListener('DOMContentLoaded', () => {
    // Initialize the PDF worker
    initializePdfWorker();

    // Define page-specific elements
    const elements = {
        authModal: document.getElementById('auth-modal-overlay-foia'),
        authForm: document.getElementById('auth-form-foia'),
        usernameInput: document.getElementById('auth-username-foia'),
        passwordInput: document.getElementById('auth-password-foia'),
        errorMessage: document.getElementById('auth-error-message-foia'),
        pageWrapper: document.getElementById('page-content-wrapper-foia'),
        listContainer: document.getElementById('saved-analyses-list-foia'),
        noItemsP: document.getElementById('no-saved-analyses-foia'),
        generateAnalysisButton: document.getElementById('generate-analysis-button-foia')
        // Add other FOIA-specific elements here
    };
    
    // Define page-specific state
    let state = {
        type: 'foia',
        allAnalyses: [],
        currentSortKey: 'analysisDate',
        currentSortOrder: 'desc',
        currentStatusFilter: 'all_statuses',
        currentlyViewedAnalysis: null,
        originalTextForReanalysis: "",
        promptConfig: FOIA_PROMPT_CONFIG,
        elements: elements,
        // Add handlers that will be passed to the UI manager
        openViewModalHandler: openFoiaViewModal,
        actionHandlers: {
            onEdit: openFoiaEditModal,
            onStatusUpdate: updateFoiaStatus,
            onDelete: deleteFoiaAnalysis,
        }
    };

    // Initialize the UI Manager with the initial state
    ui.initializeUIManager(state);

    // Initialize authentication
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

    async function initializeFoiaPage() {
        console.log("FOIA Analyzer: Initializing app logic...");
        await loadSavedAnalyses();
        // Add event listeners for sorting, filtering, etc.
        setupEventListeners();
    }

    async function loadSavedAnalyses() {
        const statusArea = document.getElementById('foia-list-status-area');
        ui.showLoadingMessage(statusArea, "Loading saved FOIA analyses...");
        try {
            state.allAnalyses = await api.getAnalyses(state.type);
            ui.renderAnalysesList();
        } catch (error) {
            console.error(`Failed to load ${state.type} analyses:`, error);
            statusArea.innerHTML = `<p class="loading-text" style="color:red;">Failed to load analyses: ${error.message}</p>`;
        } finally {
            ui.hideLoadingMessage(statusArea, 500);
        }
    }
    
    function setupEventListeners() {
        // Example: Filter tabs
        const foiaListTabsContainer = document.getElementById('foia-list-tabs');
        if (foiaListTabsContainer) {
            foiaListTabsContainer.addEventListener('click', (e) => {
                if (e.target.classList.contains('rfp-list-tab-button')) {
                    foiaListTabsContainer.querySelectorAll('.rfp-list-tab-button').forEach(btn => btn.classList.remove('active'));
                    e.target.classList.add('active');
                    state.currentStatusFilter = e.target.dataset.statusFilter;
                    ui.renderAnalysesList();
                }
            });
        }
        // Add other event listeners for new FOIA modal, form submissions, etc.
    }

    // --- Page-Specific Handlers ---

    async function openFoiaViewModal(analysisId) {
        console.log(`Opening view modal for FOIA ID: ${analysisId}`);
    }

    function openFoiaEditModal(analysis) {
        console.log(`Opening edit modal for FOIA:`, analysis);
    }

    async function updateFoiaStatus(analysisId, newStatus) {
        console.log(`Updating status for FOIA ID: ${analysisId} to ${newStatus}`);
        const statusArea = document.getElementById('view-foia-status-area') || document.getElementById('foia-list-status-area');
        ui.showLoadingMessage(statusArea, `Updating status to ${newStatus}...`);
        try {
            await api.updateAnalysisStatus(state.type, analysisId, newStatus);
            await loadSavedAnalyses();
            ui.showLoadingMessage(statusArea, 'Status updated successfully!', false);
        } catch (error) {
            ui.showLoadingMessage(statusArea, `Error updating status: ${error.message}`, false);
        } finally {
            ui.hideLoadingMessage(statusArea, 3000);
        }
    }

    async function deleteFoiaAnalysis(analysisId, title) {
        if (!window.confirm(`Are you sure you want to delete FOIA analysis: "${title}"?`)) return;
        console.log(`Deleting FOIA ID: ${analysisId}`);
        const statusArea = document.getElementById('foia-list-status-area');
        ui.showLoadingMessage(statusArea, `Deleting "${title}"...`);
        try {
            await api.deleteAnalysis(state.type, analysisId);
            await loadSavedAnalyses();
            ui.showLoadingMessage(statusArea, 'Successfully deleted.', false);
        } catch(error) {
            ui.showLoadingMessage(statusArea, `Error deleting: ${error.message}`, false);
        } finally {
            ui.hideLoadingMessage(statusArea, 3000);
        }
    }
});
