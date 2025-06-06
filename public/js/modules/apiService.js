/**
 * @file apiService.js
 * @description Centralizes all fetch calls to the backend API for analyzers.
 */

async function handleResponse(response) {
    if (!response.ok) {
        const errorResult = await response.json().catch(() => ({ error: `Server error with status: ${response.status}` }));
        throw new Error(errorResult.error || `HTTP error! Status: ${response.status}`);
    }
    return response.json();
}

/**
 * Fetches prompts from the server.
 * @param {string} type - 'rfp' or 'foia'.
 * @returns {Promise<object>} - The prompt settings object.
 */
export async function fetchPrompts(type) {
    const response = await fetch(`/api/${type}-prompt-settings`);
    return handleResponse(response);
}

/**
 * Saves prompts to the server.
 * @param {string} type - 'rfp' or 'foia'.
 * @param {object} prompts - The prompt settings object to save.
 * @returns {Promise<object>} - The server response.
 */
export async function savePrompts(type, prompts) {
    const response = await fetch(`/api/${type}-prompt-settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompts }),
    });
    return handleResponse(response);
}

/**
 * Sends a prompt to the Gemini API for content generation.
 * @param {string} prompt - The full prompt string.
 * @returns {Promise<object>} - The generated content.
 */
export async function generateContent(prompt) {
    const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
    });
    return handleResponse(response);
}

/**
 * Fetches all analyses of a specific type.
 * @param {string} type - 'rfp' or 'foia'.
 * @returns {Promise<Array>} - An array of analysis objects.
 */
export async function getAnalyses(type) {
    const response = await fetch(`/api/${type}-analyses`);
    return handleResponse(response);
}

/**
 * Fetches the full details for a single analysis.
 * @param {string} type - 'rfp' or 'foia'.
 * @param {string} id - The ID of the analysis.
 * @returns {Promise<object>} - The detailed analysis object.
 */
export async function getAnalysisDetails(type, id) {
    const response = await fetch(`/api/${type}-analysis/${id}`);
    return handleResponse(response);
}

/**
 * Saves a new analysis to the database.
 * @param {string} type - 'rfp' or 'foia'.
 * @param {object} data - The analysis data payload.
 * @returns {Promise<object>} - The saved analysis object.
 */
export async function saveNewAnalysis(type, data) {
    const response = await fetch(`/api/${type}-analysis`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    return handleResponse(response);
}

/**
 * Updates an existing analysis.
 * @param {string} type - 'rfp' or 'foia'.
 * @param {string} id - The ID of the analysis to update.
 * @param {object} data - The data to update.
 * @returns {Promise<object>} - The server response.
 */
export async function updateAnalysis(type, id, data) {
    const response = await fetch(`/api/${type}-analysis/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    return handleResponse(response);
}

/**
 * Updates the status of an analysis.
 * @param {string} type - 'rfp' or 'foia'.
 * @param {string} id - The ID of the analysis.
 * @param {string} status - The new status.
 * @returns {Promise<object>} - The server response.
 */
export async function updateAnalysisStatus(type, id, status) {
    const response = await fetch(`/api/${type}-analysis/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
    });
    return handleResponse(response);
}

/**
 * Deletes an analysis.
 * @param {string} type - 'rfp' or 'foia'.
 * @param {string} id - The ID of the analysis to delete.
 * @returns {Promise<object>} - The server response.
 */
export async function deleteAnalysis(type, id) {
    const response = await fetch(`/api/${type}-analysis/${id}`, {
        method: 'DELETE',
    });
    return handleResponse(response);
}
