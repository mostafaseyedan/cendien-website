/**
 * Cendien - Analysis Common Script
 *
 * This module provides shared, generic functions for both the RFP and FOIA analysis tools.
 * It handles common tasks such as DOM manipulation (modals, loading messages),
 * authentication, and dynamic API interactions.
 *
 * @version 2.2.0
 * @date 2025-06-10
 */

/**
 * Displays a loading message in a specified DOM element.
 * @param {HTMLElement} areaElement - The element where the message should be displayed.
 * @param {string} message - The text message to show.
 * @param {boolean} showSpinner - Whether to display a spinning loading icon.
 * @param {HTMLButtonElement} [disableButtonElement=null] - An optional button to disable while loading.
 */
export function showLoadingMessage(areaElement, message = "Processing...", showSpinner = true, disableButtonElement = null) {
    if (!areaElement) return;
    areaElement.style.display = 'flex';
    areaElement.innerHTML = `${showSpinner ? '<div class="spinner"></div>' : ''}<p class="loading-text">${message}</p>`;
    if (disableButtonElement && showSpinner) {
        disableButtonElement.disabled = true;
    }
}

/**
 * Hides a loading message after a specified delay.
 * @param {HTMLElement} areaElement - The element containing the loading message.
 * @param {number} delay - The delay in milliseconds before hiding the message.
 * @param {HTMLButtonElement} [enableButtonElement=null] - An optional button to re-enable.
 */
export function hideLoadingMessage(areaElement, delay = 0, enableButtonElement = null) {
    setTimeout(() => {
        if (areaElement) {
            areaElement.style.display = 'none';
            areaElement.innerHTML = '';
        }
        if (enableButtonElement) {
            enableButtonElement.disabled = false;
        }
    }, delay);
}

/**
 * Adds a new item to a dropdown menu.
 * @param {HTMLElement} menuElement - The dropdown menu element.
 * @param {string} iconClass - The Font Awesome icon class (e.g., 'fa-edit').
 * @param {string} text - The text for the dropdown item.
 * @param {Function} clickHandler - The function to execute on click.
 */
export function addDropdownItemToMenu(menuElement, iconClass, text, clickHandler) {
    const item = document.createElement('button');
    item.className = 'dropdown-item';
    item.innerHTML = `<i class="fas ${iconClass}"></i> ${text}`;
    item.addEventListener('click', (e) => {
        e.stopPropagation();
        clickHandler();
        document.querySelectorAll('.actions-dropdown-menu, .view-modal-actions-dropdown-menu').forEach(menu => menu.style.display = 'none');
    });
    menuElement.appendChild(item);
}

/**
 * Opens and displays a modal dialog.
 * @param {HTMLElement} modalElement - The modal element to open.
 */
export function openModal(modalElement) {
    if (modalElement) {
        modalElement.style.display = 'block';
        if (!modalElement.classList.contains('auth-modal-overlay')) {
             modalElement.classList.add('modal-active');
        }
        document.body.style.overflow = 'hidden';
    }
}

/**
 * Closes a modal dialog.
 * @param {HTMLElement} modalElement - The modal element to close.
 */
export function closeModal(modalElement) {
    if (modalElement) {
        modalElement.style.display = 'none';
        modalElement.classList.remove('modal-active');
        document.body.style.overflow = '';
    }
}

/**
 * Handles the complete authentication flow for a page.
 * @param {object} config - Configuration object.
 * @param {HTMLElement} config.authModal - The login modal overlay.
 * @param {HTMLElement} config.authForm - The form element for login.
 * @param {HTMLInputElement} config.usernameInput - The username input field.
 * @param {HTMLInputElement} config.passwordInput - The password input field.
 * @param {HTMLElement} config.errorMessageElement - The element to display login errors.
 * @param {HTMLElement} config.pageContentWrapper - The main content wrapper to hide/show.
 * @param {string} config.correctUsername - The correct username.
 * @param {string} config.correctPassword - The correct password.
 * @param {string} config.sessionKey - The localStorage key for the session timestamp.
 * @param {Function} onAuthSuccess - The callback function to execute after a successful login.
 */
export function handleAuthentication(config, onAuthSuccess) {
    const sessionDuration = 24 * 60 * 60 * 1000; // 24 hours

    const isSessionValid = () => {
        const storedTimestamp = localStorage.getItem(config.sessionKey);
        if (!storedTimestamp) return false;
        const lastLoginTime = parseInt(storedTimestamp, 10);
        return !isNaN(lastLoginTime) && (Date.now() - lastLoginTime) < sessionDuration;
    };

    const handleSuccessfulLogin = () => {
        localStorage.setItem(config.sessionKey, Date.now().toString());
        config.authModal.classList.add('auth-modal-hidden');
        config.authModal.style.display = 'none';
        config.pageContentWrapper.classList.remove('content-hidden');
        config.pageContentWrapper.style.display = '';
        onAuthSuccess();
    };

    const showLoginError = (message) => {
        config.errorMessageElement.textContent = message;
        config.errorMessageElement.style.display = 'block';
        config.passwordInput.value = '';
        config.usernameInput.focus();
    };

    if (isSessionValid()) {
        handleSuccessfulLogin();
    } else {
        config.authModal.classList.remove('auth-modal-hidden');
        config.authModal.classList.add('active');
        config.authModal.style.display = 'flex';
        config.pageContentWrapper.classList.add('content-hidden');
        config.pageContentWrapper.style.display = 'none';
        
        config.authForm.addEventListener('submit', (event) => {
            event.preventDefault();
            const username = config.usernameInput.value.trim();
            const password = config.passwordInput.value;
            if (username === config.correctUsername && password === config.correctPassword) {
                config.errorMessageElement.style.display = 'none';
                handleSuccessfulLogin();
            } else {
                showLoginError("Invalid username or password. Please try again.");
            }
        });
    }
}

/**
 * Updates the status of an analysis record via an API call.
 * @param {string} analysisId - The ID of the analysis to update.
 * @param {string} newStatus - The new status to set.
 * @param {string} typePrefix - The analysis type ('rfp' or 'foia').
 * @param {HTMLElement} statusArea - The DOM element to show status messages.
 * @returns {Promise<boolean>} A promise that resolves to true on success, false on failure.
 */
export async function updateAnalysisStatus(analysisId, newStatus, typePrefix, statusArea) {
    showLoadingMessage(statusArea, `Updating status to ${newStatus}...`, true);
    try {
        const response = await fetch(`/api/${typePrefix}-analysis/${analysisId}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus })
        });
        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.error || 'Failed to update status.');
        }
        showLoadingMessage(statusArea, "Status updated successfully!", false);
        hideLoadingMessage(statusArea, 2000);
        return true;
    } catch (error) {
        console.error(`Error updating ${typePrefix} analysis status:`, error);
        showLoadingMessage(statusArea, `Error: ${error.message}`, false);
        hideLoadingMessage(statusArea, 4000);
        return false;
    }
}

/**
 * Deletes an analysis record via an API call.
 * @param {string} analysisId - The ID of the analysis to delete.
 * @param {string} analysisTitle - The title of the analysis for the confirmation dialog.
 * @param {string} typePrefix - The analysis type ('rfp' or 'foia').
 * @param {HTMLElement} statusArea - The DOM element to show status messages.
 * @returns {Promise<string|null>} A promise that resolves with the ID of the deleted item on success, or null on failure/cancellation.
 */
export async function deleteAnalysis(analysisId, analysisTitle, typePrefix, statusArea) {
    if (!window.confirm(`Are you sure you want to delete "${analysisTitle}"? This action cannot be undone.`)) {
        return null;
    }
    showLoadingMessage(statusArea, `Deleting "${analysisTitle}"...`, true);
    try {
        const response = await fetch(`/api/${typePrefix}-analysis/${analysisId}`, {
            method: 'DELETE'
        });
        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.error || 'Failed to delete analysis.');
        }
        showLoadingMessage(statusArea, `"${analysisTitle}" deleted successfully.`, false);
        hideLoadingMessage(statusArea, 2000);
        return analysisId;
    } catch (error) {
        console.error(`Error deleting ${typePrefix} analysis:`, error);
        showLoadingMessage(statusArea, `Error: ${error.message}`, false);
        hideLoadingMessage(statusArea, 4000);
        return null;
    }
}
