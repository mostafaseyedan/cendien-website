/**
 * @file uiManager.js
 * @description Manages all UI interactions and DOM updates for the analyzers.
 */
import { PROMPT_MAIN_INSTRUCTION, PROMPT_SECTION_DELIMITER_FORMAT, PROMPT_TEXT_SUFFIX } from '/js/modules/config.js';

let state = {}; // This module's internal state

/**
 * Initializes the UI manager and sets its internal state.
 * @param {object} initialSharedState - The initial state object from the main app script.
 */
export function initializeUIManager(initialSharedState) {
    state = { ...state, ...initialSharedState };
}

/**
 * Allows the main app script to update the UI manager's state.
 * @param {object} newSharedState - The new state properties to merge.
 */
export function updateSharedState(newSharedState) {
    state = { ...state, ...newSharedState };
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
    const { generateAnalysisButton, saveEditedButton } = state.elements;
    if (showSpinner) {
        if (generateAnalysisButton && areaElement.id.includes('modal-analysis-status')) {
            generateAnalysisButton.disabled = true;
        }
        if (saveEditedButton && areaElement.id.includes('edit-status-area')) {
            saveEditedButton.disabled = true;
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
        if (areaElement) {
            areaElement.style.display = 'none';
            areaElement.innerHTML = '';
        }
        const { generateAnalysisButton, saveEditedButton } = state.elements;
        if (generateAnalysisButton && areaElement?.id.includes('modal-analysis-status')) {
            generateAnalysisButton.disabled = false;
        }
        if (saveEditedButton && areaElement?.id.includes('edit-status-area')) {
            saveEditedButton.disabled = false;
        }
    }, delay);
}

/**
 * Opens a modal and closes any others that might be open.
 * @param {HTMLElement} modalElement - The modal element to open.
 */
export function openModal(modalElement) {
    if (!modalElement) return;
    document.querySelectorAll('.modal-overlay').forEach(modal => {
        if (modal !== modalElement) modal.style.display = 'none';
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
        }
        document.body.style.overflow = '';
    }
}

/**
 * Renders the list of analyses.
 */
export function renderAnalysesList() {
    const { listContainer, noItemsP, allAnalyses, sortKey, sortOrder, statusFilter, type } = state;
    if (!listContainer || !noItemsP) return;

    listContainer.innerHTML = '';
    let filteredAnalyses = allAnalyses.filter(a => statusFilter === 'all_statuses' || a.status === statusFilter);

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
        const orderModifier = sortOrder === 'asc' ? 1 : -1;
        if (valA < valB) return -1 * orderModifier;
        if (valA > valB) return 1 * orderModifier;
        return 0;
    });

    if (filteredAnalyses.length === 0) {
        noItemsP.style.display = 'block';
        noItemsP.textContent = `No ${type.toUpperCase()} analyses found for "${statusFilter}" category.`;
    } else {
        noItemsP.style.display = 'none';
        filteredAnalyses.forEach(analysis => {
            listContainer.appendChild(createAnalysisListItem(analysis));
        });
    }
}

function createAnalysisListItem(analysis) {
    const { type, actionHandlers } = state;
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
        formattedDateTime = `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
    }
    const statusDotClass = { active: 'green', not_pursuing: 'red', archived: 'grey' }[analysis.status] || 'orange';

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
        state.actionHandlers.onView(analysis.id);
    });
    actionsSpan.appendChild(viewLink);
    actionsSpan.appendChild(createActionsDropdown(analysis));
    return itemDiv;
}

function createActionsDropdown(analysis) {
    const { type, actionHandlers } = state;
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
        document.querySelectorAll('.actions-dropdown-menu').forEach(m => {
            if (m !== menu) m.style.display = 'none';
        });
        menu.style.display = menu.style.display === 'block' ? 'none' : 'block';
    });

    const addMenuItem = (icon, text, handler) => {
        const item = document.createElement('button');
        item.className = 'dropdown-item';
        item.innerHTML = `<i class="fas ${icon}"></i> ${text}`;
        item.addEventListener('click', (e) => { e.stopPropagation(); handler(); menu.style.display = 'none'; });
        menu.appendChild(item);
    };
    
    addMenuItem('fa-edit', 'Edit Details', () => actionHandlers.onEdit(analysis));
    menu.appendChild(document.createElement('div')).className = 'dropdown-divider';

    const statusActions = {
        analyzed: [{ text: 'Move to Active', status: 'active', icon: 'fa-check-circle' }, { text: 'Not Pursuing', status: 'not_pursuing', icon: 'fa-times-circle' }, { text: 'Archive', status: 'archived', icon: 'fa-archive' }],
        active: [{ text: 'Not Pursuing', status: 'not_pursuing', icon: 'fa-times-circle' }, { text: 'Back to Analyzed', status: 'analyzed', icon: 'fa-inbox' }, { text: 'Archive', status: 'archived', icon: 'fa-archive' }],
        not_pursuing: [{ text: 'Move to Active', status: 'active', icon: 'fa-check-circle' }, { text: 'Back to Analyzed', status: 'analyzed', icon: 'fa-inbox' }, { text: 'Archive', status: 'archived', icon: 'fa-archive' }],
        archived: [{ text: 'Unarchive', status: 'analyzed', icon: 'fa-box-open' }, { text: 'Move to Active', status: 'active', icon: 'fa-check-circle' }]
    };
    (statusActions[analysis.status] || statusActions.analyzed).forEach(action => addMenuItem(action.icon, action.text, () => actionHandlers.onStatusUpdate(analysis.id, action.status)));
    
    menu.appendChild(document.createElement('div')).className = 'dropdown-divider';
    addMenuItem('fa-trash-alt', `Delete`, () => actionHandlers.onDelete(analysis.id, analysis[type === 'rfp' ? 'rfpTitle' : 'foiaTitle'] || 'this item'));
    
    container.appendChild(trigger);
    container.appendChild(menu);
    return container;
}

export function populateViewModal(analysis) {
    const { viewModalTitle, viewModalContentArea } = state.elements;
    const { type, promptConfig } = state;
    const titleKey = type === 'rfp' ? 'rfpTitle' : 'foiaTitle';
    const fileNamesKey = type === 'rfp' ? 'rfpFileName' : 'foiaFileNames';
    viewModalTitle.textContent = analysis[titleKey] || (Array.isArray(analysis[fileNamesKey]) ? analysis[fileNamesKey].join(', ') : analysis[fileNamesKey]);

    viewModalContentArea.innerHTML = ''; // Clear previous content
    const tabsContainer = document.createElement('div');
    tabsContainer.className = 'tabs-container';
    viewModalContentArea.appendChild(tabsContainer);

    Object.keys(promptConfig).forEach((key, index) => {
        if (type === 'foia' && key === 'documentType') return;
        const config = promptConfig[key];
        const tabButton = document.createElement('button');
        tabButton.className = `tab-link ${index === 0 ? 'active' : ''}`;
        tabButton.textContent = config.title;
        tabButton.onclick = () => {
            viewModalContentArea.querySelectorAll('.tab-link').forEach(t => t.classList.remove('active'));
            tabButton.classList.add('active');
            viewModalContentArea.querySelectorAll('.tab-content').forEach(tc => tc.style.display = 'none');
            document.getElementById(`view-tab-content-${key}`).style.display = 'block';
        };
        tabsContainer.appendChild(tabButton);

        const tabContent = document.createElement('div');
        tabContent.id = `view-tab-content-${key}`;
        tabContent.className = 'tab-content';
        tabContent.style.display = index === 0 ? 'block' : 'none';
        tabContent.innerHTML = analysis[config.databaseKey]?.replace(/\n/g, '<br>') || 'Not available.';
        viewModalContentArea.appendChild(tabContent);
    });
    populateViewModalActions(analysis);
}

export function populateViewModalActions(analysis) {
    const { viewModalActionsMenu, type, actionHandlers } = state;
    if (!viewModalActionsMenu) return;
    viewModalActionsMenu.innerHTML = '';
    const dropdownMenu = createActionsDropdown(analysis, type, actionHandlers);
    
    // Move the actual items (buttons, dividers) into the permanent menu
    while (dropdownMenu.firstElementChild) {
        viewModalActionsMenu.appendChild(dropdownMenu.firstElementChild);
    }
}


export function populateEditModal(analysis) {
    const { editForm, type } = state;
    const prefix = type === 'rfp' ? 'Rfp' : 'Foia';
    
    editForm.reset();

    Object.keys(analysis).forEach(key => {
        let inputId;
        if (key.toLowerCase().includes('submittedby')) {
            inputId = `edit${prefix}SubmittedBy`;
        } else {
             inputId = `edit${prefix}${key.charAt(0).toUpperCase() + key.slice(1)}`;
        }
       
        const input = editForm.querySelector(`#${inputId}`);
        if(input) {
            if (key.toLowerCase().includes('filenames') && Array.isArray(analysis[key])) {
                input.value = analysis[key].join('\n');
            } else {
                input.value = analysis[key];
            }
        }
    });
    editForm.querySelector(`#edit${prefix}Id`).value = analysis.id;
}


// --- Prompt Construction Logic ---
export function constructAnalysisPrompt(type, text, promptConfig, analysisPrompts) {
    const docType = type.toUpperCase();
    let fullPrompt = PROMPT_MAIN_INSTRUCTION.replace('{DOCUMENT_TYPE}', docType);

    Object.keys(promptConfig).forEach(keySuffix => {
        const sectionInstruction = analysisPrompts?.[keySuffix] || state.serverPrompts?.[keySuffix] || promptConfig[keySuffix]?.defaultText || "";
        fullPrompt += `\n${sectionInstruction}`;
    });
    
    fullPrompt += "\n\nUse the following format strictly for each section:";
    Object.keys(promptConfig).forEach(keySuffix => {
        const delimiterKeyUpper = promptConfig[keySuffix]?.delimiterKey;
        if (delimiterKeyUpper) {
            fullPrompt += PROMPT_SECTION_DELIMITER_FORMAT.replace(/{SECTION_KEY_UPPER}/g, delimiterKeyUpper);
        }
    });
    
    fullPrompt += PROMPT_TEXT_SUFFIX.replace('{DOCUMENT_TYPE}', docType).replace('{TEXT_PLACEHOLDER}', text);
    return fullPrompt;
}

export function parseGeneratedContent(rawText, promptConfig) {
    const parsed = {};
    const cleanText = rawText.replace(/^```[a-z]*\s*/im, '').replace(/\s*```$/m, '');
    Object.keys(promptConfig).forEach(key => {
        const config = promptConfig[key];
        const regex = new RegExp(`###${config.delimiterKey}_START###([\\s\\S]*?)###${config.delimiterKey}_END###`);
        const match = cleanText.match(regex);
        parsed[config.databaseKey] = match?.[1].trim() || `Content for ${config.title} not found.`;
    });
    return parsed;
}

// NEWLY ADDED FUNCTION
export function populateNewAnalysisModal(parsedSections) {
    const { modalAnalysisResultsArea, promptConfig, type } = state;
    if (!modalAnalysisResultsArea) return;

    const suffix = type === 'foia' ? '-foia' : '';

    Object.keys(promptConfig).forEach(key => {
        if (type === 'foia' && key === 'documentType') return; // Don't show a tab for this
        const config = promptConfig[key];
        const content = parsedSections[config.databaseKey] || 'Not available.';
        
        // Find the specific container div for this section in the new-analysis modal
        // e.g., 'modal-summary-result-content' or 'modal-proposalComparison-result-content-foia'
        const contentDivId = `modal-${key.toLowerCase().replace('proposalcomparison','comparison-rating').replace('pricingintelligence','financial-intelligence').replace('markettrends','context-impact').replace('tasksworkplan','actionable-items')}-result-content${suffix}`;

        const contentDiv = document.getElementById(contentDivId);
        
        if (contentDiv) {
            contentDiv.innerHTML = content.replace(/\n/g, '<br>');
        } else {
            console.warn(`UI Manager: Could not find content element with ID: ${contentDivId}`);
        }
    });

    modalAnalysisResultsArea.style.display = 'block';

    // Activate the first tab
    const firstTabLink = modalAnalysisResultsArea.querySelector('.tabs-container .tab-link');
    if (firstTabLink) {
        // Deactivate all
        modalAnalysisResultsArea.querySelectorAll('.tabs-container .tab-link').forEach(tl => tl.classList.remove('active'));
        modalAnalysisResultsArea.querySelectorAll('.tab-content').forEach(tc => tc.style.display = 'none');
        
        // Activate first
        firstTabLink.classList.add('active');
        const tabNameMatch = firstTabLink.getAttribute('onclick').match(/'(modal-[^']+-tab[^']*)'/);
        if (tabNameMatch && tabNameMatch[1]) {
            const tabElement = document.getElementById(tabNameMatch[1]);
            if(tabElement) tabElement.style.display = 'block';
        }
    }
}

/**
 * Opens a tab in the view modal context.
 * @param {Event} event - The click event.
 * @param {string} tabId - The ID of the tab to open.
 */
export function openFoiaViewTab(event, tabId) {
    const tabContent = document.querySelectorAll('#view-analysis-results-area-foia .tab-content');
    const tabLinks = document.querySelectorAll('#view-analysis-results-area-foia .tab-link');
    
    tabContent.forEach(content => content.style.display = 'none');
    tabLinks.forEach(link => link.classList.remove('active'));
    
    document.getElementById(tabId).style.display = 'block';
    event.currentTarget.classList.add('active');
}

/**
 * Opens a tab in the new analysis modal context.
 * @param {Event} event - The click event.
 * @param {string} tabId - The ID of the tab to open.
 */
export function openFoiaModalTab(event, tabId) {
    const tabContent = document.querySelectorAll('#modal-analysis-results-area-foia .tab-content');
    const tabLinks = document.querySelectorAll('#modal-analysis-results-area-foia .tab-link');
    
    tabContent.forEach(content => content.style.display = 'none');
    tabLinks.forEach(link => link.classList.remove('active'));
    
    document.getElementById(tabId).style.display = 'block';
    event.currentTarget.classList.add('active');
}
