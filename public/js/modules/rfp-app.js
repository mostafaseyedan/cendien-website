/**
 * @file rfp-app.js
 * @description Main application logic for the RFP Analyzer page.
 */

import { initializeAuth } from './modules/auth.js';
import * as api from './modules/apiService.js';
import * as ui from './modules/uiManager.js';
import { initializePdfWorker, extractTextFromPdf } from './modules/pdfHandler.js';
import { RFP_PROMPT_CONFIG, PROMPT_MAIN_INSTRUCTION, PROMPT_SECTION_DELIMITER_FORMAT, PROMPT_TEXT_SUFFIX } from './modules/config.js';

document.addEventListener('DOMContentLoaded', () => {
    // Initialize the PDF worker
    initializePdfWorker();

    // Define page-specific elements
    const elements = {
        authModal: document.getElementById('auth-modal-overlay'),
        authForm: document.getElementById('auth-form'),
        usernameInput: document.getElementById('auth-username'),
        passwordInput: document.getElementById('auth-password'),
        errorMessage: document.getElementById('auth-error-message'),
        pageWrapper: document.getElementById('page-content-wrapper'),
        listContainer: document.getElementById('saved-analyses-list'),
        noItemsP: document.getElementById('no-saved-analyses'),
        generateAnalysisButton: document.getElementById('generate-analysis-button')
        // Add other RFP-specific elements here
    };

    // Define page-specific state
    let state = {
        type: 'rfp',
        allAnalyses: [],
        currentSortKey: 'analysisDate',
        currentSortOrder: 'desc',
        currentStatusFilter: 'all_statuses',
        currentlyViewedAnalysis: null,
        originalTextForReanalysis: "",
        promptConfig: RFP_PROMPT_CONFIG,
        elements: elements,
        // Add handlers that will be passed to the UI manager
        openViewModalHandler: openRfpViewModal,
        actionHandlers: {
            onEdit: openRfpEditModal,
            onStatusUpdate: updateRfpStatus,
            onDelete: deleteRfpAnalysis,
        }
    };
    
    // Initialize the UI Manager with the initial state
    ui.initializeUIManager(state);

    // Initialize authentication
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

    async function initializeRfpPage() {
        console.log("RFP Analyzer: Initializing app logic...");
        await loadSavedAnalyses();
        // Add event listeners for sorting, filtering, etc.
        setupEventListeners();
    }

    async function loadSavedAnalyses() {
        const statusArea = document.getElementById('rfp-list-status-area');
        ui.showLoadingMessage(statusArea, "Loading saved analyses...");
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
        const rfpListTabsContainer = document.querySelector('.rfp-list-tabs');
        if (rfpListTabsContainer) {
            rfpListTabsContainer.addEventListener('click', (e) => {
                if (e.target.classList.contains('rfp-list-tab-button')) {
                    rfpListTabsContainer.querySelectorAll('.rfp-list-tab-button').forEach(btn => btn.classList.remove('active'));
                    e.target.classList.add('active');
                    state.currentStatusFilter = e.target.dataset.statusFilter;
                    ui.renderAnalysesList();
                }
            });
        }
        // Add other event listeners for new RFP modal, form submissions, etc.
    }

    // --- Page-Specific Handlers ---

    async function openRfpViewModal(analysisId) {
        // Logic to fetch details and populate the RFP view modal
        console.log(`Opening view modal for RFP ID: ${analysisId}`);
        // You would use ui.openModal and populate it with data from api.getAnalysisDetails
    }
    
    function openRfpEditModal(analysis) {
        // Logic to populate and open the RFP edit modal
        console.log(`Opening edit modal for RFP:`, analysis);
    }
    
    async function updateRfpStatus(analysisId, newStatus) {
        // Logic to call the API and update the UI
        console.log(`Updating status for RFP ID: ${analysisId} to ${newStatus}`);
        const statusArea = document.getElementById('view-rfp-status-area') || document.getElementById('rfp-list-status-area');
        ui.showLoadingMessage(statusArea, `Updating status to ${newStatus}...`);
        try {
            await api.updateAnalysisStatus(state.type, analysisId, newStatus);
            await loadSavedAnalyses(); // Reload the list to show changes
            ui.showLoadingMessage(statusArea, 'Status updated successfully!', false);
        } catch (error) {
            ui.showLoadingMessage(statusArea, `Error updating status: ${error.message}`, false);
        } finally {
            ui.hideLoadingMessage(statusArea, 3000);
        }
    }
    
    async function deleteRfpAnalysis(analysisId, title) {
        if (!window.confirm(`Are you sure you want to delete RFP: "${title}"?`)) return;
        console.log(`Deleting RFP ID: ${analysisId}`);
        const statusArea = document.getElementById('rfp-list-status-area');
        ui.showLoadingMessage(statusArea, `Deleting "${title}"...`);
        try {
            await api.deleteAnalysis(state.type, analysisId);
            await loadSavedAnalyses(); // Reload list
            ui.showLoadingMessage(statusArea, 'Successfully deleted.', false);
        } catch(error) {
            ui.showLoadingMessage(statusArea, `Error deleting: ${error.message}`, false);
        } finally {
            ui.hideLoadingMessage(statusArea, 3000);
        }
    }
});
