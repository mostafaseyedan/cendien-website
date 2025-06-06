/**
 * @file uiManager.js
 * @description Manages all UI interactions and DOM updates for the analyzers.
 */

let state = {}; // Holds references to elements and current data

/**
 * Initializes the UI manager with necessary elements and state.
 * @param {object} initialState - An object containing initial state and element references.
 */
export function initializeUIManager(initialState) {
    state = { ...initialState };
}

/**
 * Shows a loading or status message in a designated area.
 * @param {HTMLElement} areaElement - The element to display the message in.
 * @param {string} message - The message to display.
 * @param {boolean} showSpinner - Whether to show a loading spinner.
 */
export function showLoadingMessage(areaElement, message = "Processing...", showSpinner = true) {
    if (!areaElement) return;
    areaElement.style.display = 'flex';
    areaElement.innerHTML = `${showSpinner ? '<div class="spinner"></div>' : ''}<p class="loading-text">${message}</p>`;
    // Disable corresponding buttons if a spinner is shown
    if (showSpinner) {
        if (state.elements.generateAnalysisButton && areaElement.id.includes('modal-analysis-status')) {
            state.elements.generateAnalysisButton.disabled = true;
        }
        if (state.elements.saveEditedButton && areaElement.id.includes('edit-status-area')) {
            state.elements.saveEditedButton.disabled = true;
        }
    }
}

/**
 * Hides a loading or status message after a delay.
 * @param {HTMLElement} areaElement - The element containing the message.
 * @param {number} delay - The delay in milliseconds before hiding.
 */
export function hideLoadingMessage(areaElement, delay = 0) {
    setTimeout(() => {
        if (areaElement && (areaElement.innerHTML.includes('loading-text') || areaElement.innerHTML.includes('spinner'))) {
            areaElement.style.display = 'none';
            areaElement.innerHTML = '';
        }
        // Re-enable corresponding buttons
        if (state.elements.generateAnalysisButton && areaElement.id.includes('modal-analysis-status')) {
            state.elements.generateAnalysisButton.disabled = false;
        }
        if (state.elements.saveEditedButton && areaElement.id.includes('edit-status-area')) {
            state.elements.saveEditedButton.disabled = false;
        }
    }, delay);
}

/**
 * Opens a modal and closes any others that might be open.
 * @param {HTMLElement} modalElement - The modal element to open.
 */
export function openModal(modalElement) {
    if (!modalElement) return;
    // Close all other modals first
    document.querySelectorAll('.modal-overlay').forEach(modal => {
        if (modal !== modalElement) {
            modal.style.display = 'none';
            if (modal.classList.contains('modal-active')) {
                modal.classList.remove('modal-active');
            }
        }
    });
    modalElement.style.display = 'block';
    if (modalElement.id.startsWith('view-saved-')) {
        modalElement.classList.add('modal-active');
    }
    document.body.style.overflow = 'hidden';
}

/**
 * Closes a specific modal.
 * @param {HTMLElement} modalElement - The modal element to close.
 */
export function closeModal(modalElement) {
    if (modalElement) {
        modalElement.style.display = 'none';
        if (modalElement.id.startsWith('view-saved-')) {
            modalElement.classList.remove('modal-active');
            // Reset state related to the viewed item
            state.currentlyViewedAnalysis = null;
            state.originalTextForReanalysis = "";
        }
        document.body.style.overflow = '';
    }
}

/**
 * Clears the content of all tabs in a given tab map.
 * @param {object} tabContentMap - A map of section keys to their content elements.
 */
export function clearTabContent(tabContentMap) {
    if (!tabContentMap) return;
    Object.values(tabContentMap).forEach(div => {
        if (div) div.innerHTML = '';
    });
}

/**
 * Renders the list of analyses.
 */
export function renderAnalysesList() {
    const { listContainer, noItemsP, allAnalyses, sortKey, sortOrder, statusFilter, type, openViewModalHandler, actionHandlers } = state;
    if (!listContainer || !noItemsP) return;

    listContainer.innerHTML = '';
    let filteredAnalyses = allAnalyses;

    if (statusFilter !== 'all_statuses') {
        filteredAnalyses = filteredAnalyses.filter(a => a.status === statusFilter);
    }

    // Sort the analyses
    filteredAnalyses.sort((a, b) => {
        let valA = a[sortKey];
        let valB = b[sortKey];
        if (sortKey === 'analysisDate') {
            valA = a.analysisDate?._seconds || 0;
            valB = b.analysisDate?._seconds || 0;
        } else {
            valA = String(valA || '').toLowerCase();
            valB = String(valB || '').toLowerCase();
        }
        if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
        if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
        return 0;
    });

    if (filteredAnalyses.length === 0) {
        noItemsP.style.display = 'block';
        noItemsP.textContent = statusFilter === 'all_statuses'
            ? `No ${type.toUpperCase()} analyses found.`
            : `No ${type.toUpperCase()} analyses found for "${statusFilter}" category.`;
    } else {
        noItemsP.style.display = 'none';
        filteredAnalyses.forEach(analysis => {
            listContainer.appendChild(createAnalysisListItem(analysis, type, openViewModalHandler, actionHandlers));
        });
    }
}

/**
 * Creates a single list item element for an analysis.
 * @param {object} analysis - The analysis data object.
 * @param {string} type - 'rfp' or 'foia'.
 * @param {function} openViewModalHandler - Handler to open the view modal.
 * @param {object} actionHandlers - Object containing handlers for edit, status change, delete.
 * @returns {HTMLElement} - The created list item element.
 */
function createAnalysisListItem(analysis, type, openViewModalHandler, actionHandlers) {
    const itemDiv = document.createElement('div');
    itemDiv.className = 'analyzed-rfp-item';

    const titleKey = type === 'rfp' ? 'rfpTitle' : 'foiaTitle';
    const typeKey = type === 'rfp' ? 'rfpType' : 'foiaType';
    const fileNamesKey = type === 'rfp' ? 'rfpFileName' : 'foiaFileNames';
    
    const displayTitle = analysis[titleKey] || (Array.isArray(analysis[fileNamesKey]) ? analysis[fileNamesKey].join(', ') : analysis[fileNamesKey]) || 'N/A';
    const displayType = analysis[typeKey] || (type === 'foia' ? 'AI Processing...' : 'N/A');

    let formattedDateTime = 'N/A';
    if (analysis.analysisDate?._seconds) {
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
        <span class="rfp-col-type">${displayType}</span>
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
    viewLink.title = `View ${type.toUpperCase()} Analysis Details`;
    viewLink.addEventListener('click', (e) => {
        e.preventDefault();
        openViewModalHandler(analysis.id);
    });
    actionsSpan.appendChild(viewLink);
    
    // Dropdown Actions
    const dropdownContainer = createActionsDropdown(analysis, type, actionHandlers);
    actionsSpan.appendChild(dropdownContainer);

    return itemDiv;
}

/**
 * Creates the actions dropdown menu for a list item.
 * @param {object} analysis - The analysis object.
 * @param {string} type - 'rfp' or 'foia'.
 * @param {object} actionHandlers - Handlers for actions.
 * @returns {HTMLElement} - The dropdown container element.
 */
function createActionsDropdown(analysis, type, { onEdit, onStatusUpdate, onDelete }) {
    const container = document.createElement('div');
    container.className = 'actions-dropdown-container';

    const trigger = document.createElement('button');
    trigger.className = 'actions-dropdown-trigger action-icon';
    trigger.innerHTML = '<i class="fas fa-ellipsis-v"></i>';
    trigger.title = "More actions";

    const menu = document.createElement('div');
    menu.className = 'actions-dropdown-menu';

    trigger.addEventListener('click', (e) => {
        e.stopPropagation();
        // Close all other menus before opening this one
        document.querySelectorAll('.actions-dropdown-menu').forEach(m => {
            if (m !== menu) m.style.display = 'none';
        });
        menu.style.display = menu.style.display === 'block' ? 'none' : 'block';
    });

    const addMenuItem = (icon, text, handler) => {
        const item = document.createElement('button');
        item.className = 'dropdown-item';
        item.innerHTML = `<i class="fas ${icon}"></i> ${text}`;
        item.addEventListener('click', (e) => {
            e.stopPropagation();
            handler();
            menu.style.display = 'none';
        });
        menu.appendChild(item);
    };
    
    addMenuItem('fa-edit', 'Edit Details', () => onEdit(analysis));
    menu.appendChild(document.createElement('div')).className = 'dropdown-divider';

    const statusActions = {
        analyzed: [
            { text: 'Move to Active', status: 'active', icon: 'fa-check-circle' },
            { text: 'Move to Not Pursuing', status: 'not_pursuing', icon: 'fa-times-circle' },
            { text: 'Archive', status: 'archived', icon: 'fa-archive' }
        ],
        active: [
            { text: 'Move to Not Pursuing', status: 'not_pursuing', icon: 'fa-times-circle' },
            { text: 'Move to Analyzed', status: 'analyzed', icon: 'fa-inbox' },
            { text: 'Archive', status: 'archived', icon: 'fa-archive' }
        ],
        not_pursuing: [
            { text: 'Move to Active', status: 'active', icon: 'fa-check-circle' },
            { text: 'Move to Analyzed', status: 'analyzed', icon: 'fa-inbox' },
            { text: 'Archive', status: 'archived', icon: 'fa-archive' }
        ],
        archived: [
            { text: 'Unarchive (to Analyzed)', status: 'analyzed', icon: 'fa-box-open' },
            { text: 'Move to Active', status: 'active', icon: 'fa-check-circle' },
        ]
    };

    const currentStatusActions = statusActions[analysis.status] || statusActions.analyzed;
    currentStatusActions.forEach(({ text, status, icon }) => {
        addMenuItem(icon, text, () => onStatusUpdate(analysis.id, status));
    });

    menu.appendChild(document.createElement('div')).className = 'dropdown-divider';
    addMenuItem('fa-trash-alt', `Delete ${type.toUpperCase()}`, () => {
        const titleKey = type === 'rfp' ? 'rfpTitle' : 'foiaTitle';
        const fileNamesKey = type === 'rfp' ? 'rfpFileName' : 'foiaFileNames';
        const displayTitle = analysis[titleKey] || analysis[fileNamesKey] || 'this item';
        onDelete(analysis.id, displayTitle);
    });

    container.appendChild(trigger);
    container.appendChild(menu);
    return container;
}

/**
 * Globally handles clicks to close open dropdowns.
 */
document.addEventListener('click', (e) => {
    const isInsideDropdown = e.target.closest('.actions-dropdown-container');
    if (!isInsideDropdown) {
        document.querySelectorAll('.actions-dropdown-menu').forEach(menu => {
            menu.style.display = 'none';
        });
    }
});
